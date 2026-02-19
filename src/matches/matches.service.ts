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
        39,  // Premier League
        2,   // Champions
        45,  // FA Cup
        48,  // Carabao Cup
    ];

    async getTodayMatches() {

        // ✅ check cache first
        const cached = await this.cacheManager.get('today_matches');

        if (cached) {
            console.log('cached', cached);
            return cached;
        }

        const today = dayjs().format('YYYY-MM-DD');

        const response = await axios.get(
            'https://v3.football.api-sports.io/fixtures',
            {
                params: { date: today },
                headers: {
                    'X-RapidAPI-Key': this.config.get<string>('API_KEY'),
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
                },
            },
        );

        const fixtures = response.data.response;

        const matches = fixtures
            .filter(f => this.allowedLeagues.includes(f.league.id))
            .map(f => {
                const argentinaTime = dayjs(f.fixture.date)
                    .utc()
                    .utcOffset(-3)
                    .format('HH:mm');

                return {
                    match: `${f.teams.home.name} vs ${f.teams.away.name}`,
                    time: `${argentinaTime} hs ARG`,
                    league: f.league.name,
                };
            });

        // ✅ cache for 5 minutes
        //await this.cacheManager.set('today_matches', matches, 300);
        await this.cacheManager.set(
            'today_matches',
            matches,
            300_000 // 5 minutos en ms
        );

        console.log('matches fetched from API and cached');

        return matches;
    }
}