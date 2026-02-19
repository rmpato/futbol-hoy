import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ConfigService } from '@nestjs/config';

dayjs.extend(utc);

@Injectable()
export class MatchesService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private config: ConfigService,
    ) { }

    private allowedLeagues = [
        128, // Liga Argentina
        13,  // Libertadores
        11,  // Sudamericana
        39,  // Premier
        2,   // Champions
        45,  // FA Cup
        48,  // Carabao Cup
    ];

    // ✅ etiquetas de día
    private getDayLabel(date: dayjs.Dayjs) {
        const today = dayjs().startOf('day');
        const diff = date.startOf('day').diff(today, 'day');

        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';

        return date.locale('es').format('dddd');
    }

    // ✅ SOLO HOY Y MAÑANA (plan free safe)
    private getAllowedDates(): string[] {
        const today = dayjs().startOf('day');

        return [
            today,
            today.add(1, 'day'),
        ].map(d => d.format('YYYY-MM-DD'));
    }

    // ✅ llamada API protegida
    private async fetchFixturesByDate(date: string) {
        try {
            console.log('Fetching fixtures:', date);

            const response = await axios.get(
                'https://v3.football.api-sports.io/fixtures',
                {
                    params: { date },
                    headers: {
                        'X-RapidAPI-Key': this.config.get<string>('API_KEY'),
                        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
                    },
                },
            );

            return response.data.response ?? [];
        } catch (err) {
            // 🔥 evita crash por limitación del plan free
            console.log('Date not allowed on free plan:', date);
            return [];
        }
    }

    async getTodayMatches() {
        // ✅ CACHE GLOBAL
        const cached = await this.cacheManager.get('today_tomorrow_matches');

        if (cached) {
            console.log('using cached matches');
            return cached;
        }

        const dates = this.getAllowedDates();

        // ✅ llamadas paralelas
        const results = await Promise.all(
            dates.map(date => this.fetchFixturesByDate(date)),
        );

        const fixtures = results.flat();
        
        const todayArg = dayjs().utcOffset(-3).startOf('day');
        const tomorrowArg = todayArg.add(1, 'day');

        const matches = fixtures
            .filter(f => this.allowedLeagues.includes(f.league.id))
            .map(f => {
                const matchDate = dayjs(f.fixture.date)
                    .utc()
                    .utcOffset(-3);

                return {
                    leagueId: f.league.id,
                    league: f.league.name,
                    leagueLogo: f.league.logo ?? null,

                    homeTeam: f.teams.home.name,
                    homeLogo: f.teams.home.logo ?? null,

                    awayTeam: f.teams.away.name,
                    awayLogo: f.teams.away.logo ?? null,

                    matchDate, // 👈 guardamos temporalmente

                    time: matchDate.format('HH:mm') + ' hs ARG',
                    dayLabel: this.getDayLabel(matchDate),

                    status: f.fixture.status.short,

                    goals: {
                        home: f.goals.home,
                        away: f.goals.away,
                    },
                };
            })
            // ✅ FILTRO REAL EN HORARIO ARGENTINA
            .filter(m =>
                m.matchDate.isSame(todayArg, 'day') ||
                m.matchDate.isSame(tomorrowArg, 'day')
            )
            // 👇 removemos campo temporal
            .map(({ matchDate, ...rest }) => rest);

        // ✅ cache 12h
        await this.cacheManager.set(
            'today_tomorrow_matches',
            matches,
            43_200_000,
        );

        console.log('matches fetched & cached');

        return matches;
    }
}
