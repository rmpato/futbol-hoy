import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MatchesService } from './matches/matches.service';

@Controller()
export class AppController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async home(@Res() res: Response) {
    const matches = await this.matchesService.getTodayMatches();

    // ✅ agrupar por liga
    const grouped = matches.reduce((acc, match) => {
      if (!acc[match.league]) {
        acc[match.league] = [];
      }

      acc[match.league].push(match);
      return acc;
    }, {} as Record<string, typeof matches>);

    // ✅ generar HTML por torneo
    const leaguesHtml = Object.entries(grouped as Record<string, typeof matches>)
  .map(([league, leagueMatches]) => `
          <section class="league">
            <h2>${league}</h2>

            ${leagueMatches
              .map(
                m => `
                  <div class="match">
                    <div class="teams">${m.match}</div>
                    <div class="time">${m.time}</div>
                  </div>
                `,
              )
              .join('')}
          </section>
        `,
      )
      .join('');

    const html = `
      <html>
        <head>
          <title>⚽ Fútbol Hoy</title>

          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, Arial;
              background: #0f0f0f;
              color: white;
              padding: 40px;
              max-width: 700px;
              margin: auto;
            }

            h1 {
              margin-bottom: 30px;
            }

            h2 {
              margin-top: 35px;
              color: #00ffae;
              border-bottom: 1px solid #222;
              padding-bottom: 6px;
            }

            .match {
              background: #1b1b1b;
              padding: 12px;
              margin: 10px 0;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .teams {
              font-weight: 600;
            }

            .time {
              color: #aaa;
              font-size: 14px;
            }
          </style>
        </head>

        <body>
          <h1>⚽ Partidos de Hoy</h1>
          ${leaguesHtml}
        </body>
      </html>
    `;

    res.send(html);
  }
}
