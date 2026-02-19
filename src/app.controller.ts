import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MatchesService } from './matches/matches.service';

type Match = {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  league: string;
  leagueLogo?: string | null;
  time: string;
  dayLabel: string;
};

@Controller()
export class AppController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async home(@Res() res: Response) {
    const matches = (await this.matchesService.getTodayMatches()) as Match[];

    // ✅ agrupar por liga + día
    const grouped = matches.reduce((acc, match) => {
      if (!acc[match.league]) {
        acc[match.league] = {
          logo: match.leagueLogo ?? null,
          days: {} as Record<string, Match[]>,
          total: 0,
        };
      }

      if (!acc[match.league].days[match.dayLabel]) {
        acc[match.league].days[match.dayLabel] = [];
      }

      acc[match.league].days[match.dayLabel].push(match);
      acc[match.league].total++;

      return acc;
    }, {} as Record<string, {
      logo: string | null;
      days: Record<string, Match[]>;
      total: number;
    }>);

    const leagues = Object.keys(grouped);

    // ✅ render partidos
    const renderMatches = (list: Match[]) =>
      list
        .map(
          m => `
<div class="match" data-teams="${(
            m.homeTeam + ' ' + m.awayTeam
          ).toLowerCase()}">

  <div class="teams">

    <div class="team">
      ${m.homeLogo ? `<img src="${m.homeLogo}" />` : ''}
      <span>${m.homeTeam}</span>
    </div>

    <span class="vs">vs</span>

    <div class="team">
      <span>${m.awayTeam}</span>
      ${m.awayLogo ? `<img src="${m.awayLogo}" />` : ''}
    </div>

  </div>

  <div class="time">${m.time}</div>
</div>
`,
        )
        .join('');

    // ✅ render por días
    const renderByDay = (days: Record<string, Match[]>) =>
      Object.entries(days)
        .map(
          ([day, matches]) => `
<div class="day-block">
  <div class="day-title">${day}</div>
  ${renderMatches(matches)}
</div>
`,
        )
        .join('');

    // ✅ TAB TODO
    const allTab = `
<div class="tab-content active" data-tab="Todo">
${renderByDay(
  matches.reduce((acc, m) => {
    if (!acc[m.dayLabel]) acc[m.dayLabel] = [];
    acc[m.dayLabel].push(m);
    return acc;
  }, {} as Record<string, Match[]>),
)}
</div>
`;

    // ✅ tabs ligas
    const leaguesTabs = leagues
      .map(league => `
<div class="tab-content" data-tab="${league}">
${renderByDay(grouped[league].days)}
</div>
`)
      .join('');

    // ✅ botones tabs con badge
    const tabsButtons = `
<button class="tab active" data-tab="Todo">
Todo
<span class="badge">${matches.length}</span>
</button>

${leagues
  .map(league => {
    const data = grouped[league];

    return `
<button class="tab" data-tab="${league}">
  ${
    data.logo
      ? `<img class="league-logo" src="${data.logo}" />`
      : ''
  }
  ${league}
  <span class="badge">${data.total}</span>
</button>
`;
  })
  .join('')}
`;

    const html = `
<html>
<head>
<title>Futbol Hoy</title>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, Arial;
  background:#0f0f0f;
  color:white;
  padding:40px;
  max-width:750px;
  margin:auto;
}

input {
  width:100%;
  padding:10px;
  margin-bottom:20px;
  border-radius:8px;
  border:none;
  background:#1b1b1b;
  color:white;
}

.tabs {
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-bottom:20px;
}

.tab {
  background:#1b1b1b;
  border:none;
  padding:8px 14px;
  border-radius:20px;
  color:white;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:6px;
}

.tab.active {
  background:#00ffae;
  color:black;
  font-weight:bold;
}

.badge {
  background:#333;
  padding:2px 8px;
  border-radius:10px;
  font-size:12px;
}

.league-logo {
  width:18px;
  height:18px;
}

.day-title {
  margin-top:28px;
  margin-bottom:10px;
  font-weight:bold;
  color:#00ffae;
  border-bottom:1px solid #222;
  padding-bottom:4px;
}

.match {
  background:#1b1b1b;
  padding:14px;
  margin:10px 0;
  border-radius:10px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.teams {
  display:flex;
  align-items:center;
  gap:12px;
}

.team {
  display:flex;
  align-items:center;
  gap:8px;
}

.team img {
  width:22px;
  height:22px;
}

.vs { opacity:.5; }

.time {
  color:#aaa;
  font-size:14px;
}

.tab-content { display:none; }
.tab-content.active { display:block; }
</style>
</head>

<body>

<h1>Partidos hasta el Domingo</h1>

<input id="search" placeholder="Buscar equipo..." />

<div class="tabs">
${tabsButtons}
</div>

${allTab}
${leaguesTabs}

<script>
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');
const searchInput = document.getElementById('search');

let activeTab = "Todo";

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    activeTab = tab.dataset.tab;

    contents.forEach(c =>
      c.classList.toggle('active', c.dataset.tab === activeTab)
    );

    filterMatches();
  });
});

function filterMatches() {
  const text = searchInput.value.toLowerCase();
  const activeContent =
    document.querySelector('.tab-content.active');

  activeContent.querySelectorAll('.match').forEach(match => {
    const teams = match.dataset.teams;
    match.style.display =
      teams.includes(text) ? 'flex' : 'none';
  });
}

searchInput.addEventListener('input', filterMatches);
</script>

</body>
</html>
`;

    res.send(html);
  }
}
