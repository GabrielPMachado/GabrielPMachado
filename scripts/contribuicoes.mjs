// Busca as contribuições do último ano e desenha a cidade 3D (assets/cidade-3d.svg e assets/city-3d.svg).
// Uso: GITHUB_TOKEN=... USERNAME=... node scripts/contribuicoes.mjs
//      MOCK=1 node scripts/contribuicoes.mjs   (dados de exemplo, para testar)
import { writeFileSync, mkdirSync } from 'node:fs';
import { cidade3d } from './cidade3d.mjs';

async function buscar() {
  if (process.env.MOCK) {
    const semanas = [];
    const hoje = new Date();
    const ini = new Date(hoje); ini.setDate(ini.getDate() - 364 - ini.getDay());
    for (let w = 0; w < 53; w++) {
      const dias = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(ini); dt.setDate(ini.getDate() + w * 7 + d);
        if (dt > hoje) break;
        const n = w > 42 ? (Math.random() < 0.8 ? (Math.random() * 12) | 0 : 0) : (Math.random() < 0.04 ? 1 : 0);
        dias.push({ date: dt.toISOString().slice(0, 10), contributionCount: n, contributionLevel: n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 9 ? 3 : 4 });
      }
      semanas.push({ contributionDays: dias });
    }
    return { total: semanas.flatMap((s) => s.contributionDays).reduce((a, d) => a + d.contributionCount, 0), semanas };
  }
  const query = `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { u: process.env.USERNAME } }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  const c = j.data.user.contributionsCollection.contributionCalendar;
  const nivel = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  for (const w of c.weeks) for (const d of w.contributionDays) d.contributionLevel = nivel[d.contributionLevel];
  return { total: c.totalContributions, semanas: c.weeks };
}

const dados = await buscar();
mkdirSync('assets', { recursive: true });
writeFileSync('assets/cidade-3d.svg', cidade3d(dados, 'pt'));
writeFileSync('assets/city-3d.svg', cidade3d(dados, 'en'));
console.log(`${dados.total} contribuições, ${dados.semanas.length} semanas`);
