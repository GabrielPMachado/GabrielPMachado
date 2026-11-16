// Gera assets/contribuicoes*.svg (PT) e assets/contributions*.svg (EN), em tema escuro e claro:
// a grade de contribuições do último ano no estilo do GitHub, em tons de roxo, com cantos mais redondos,
// textos em português e animações leves: uma onda que atravessa as colunas, um feixe de luz,
// os dias mais fortes pulsando e a legenda respirando.
// Uso: GITHUB_TOKEN=... USERNAME=... node scripts/contribuicoes.mjs
//      MOCK=1 node scripts/contribuicoes.mjs   (dados de exemplo, para testar)
import { writeFileSync, mkdirSync } from 'node:fs';
import { cidade } from './cidade.mjs';

const TEXTOS = {
  pt: { meses: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], dias: ['seg', 'qua', 'sex'],
    titulo: 'contribuições no último ano', em: 'contribuições em', atualizado: 'Atualizado em', menos: 'Menos', mais: 'Mais', locale: 'pt-BR' },
  en: { meses: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], dias: ['Mon', 'Wed', 'Fri'],
    titulo: 'contributions in the last year', em: 'contributions on', atualizado: 'Updated', menos: 'Less', mais: 'More', locale: 'en-US' },
};
const TEMAS = {
  escuro: { bg: '#0d1117', borda: '#30363d', txt: '#e6edf3', dim: '#7d8590', acc: '#a371f7', n: ['#161b22', '#3b1f6e', '#5b2fb0', '#8957e5', '#bc8cff'] },
  claro: { bg: '#ffffff', borda: '#d0d7de', txt: '#1f2328', dim: '#59636e', acc: '#8250df', n: ['#ebedf0', '#d8c7ff', '#b392f0', '#8250df', '#5a32a3'] },
};

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

function svg({ total, semanas }, t, L) {
  const Q = 11, G = 3, X0 = 40, Y0 = 58; // tamanho, espaço, margem esquerda e topo da grade
  const W = X0 + semanas.length * (Q + G) + 16, H = Y0 + 7 * (Q + G) + 40;
  let celulas = '', meses = '', ultimoMes = -1;
  semanas.forEach((s, w) => {
    const x = X0 + w * (Q + G);
    const m = new Date(s.contributionDays[0].date + 'T12:00').getMonth();
    if (m !== ultimoMes && w < semanas.length - 2) { if (ultimoMes !== -1 || w < 2) meses += `<text x="${x}" y="${Y0 - 8}">${L.meses[m]}</text>`; ultimoMes = m; }
    s.contributionDays.forEach((d) => {
      const dia = new Date(d.date + 'T12:00').getDay();
      const label = `${d.contributionCount} ${L.em} ${new Date(d.date + 'T12:00').toLocaleDateString(L.locale)}`;
      const lv = d.contributionLevel;
      // onda que atravessa a grade coluna por coluna; os dias mais fortes também pulsam
      const atraso = `${(w * 0.05).toFixed(2)}s${lv >= 3 ? `, ${((w * 7 + dia) % 9 * 0.27).toFixed(2)}s` : ''}`;
      celulas += `<rect class="${lv >= 3 ? 'q' : ''}" x="${x}" y="${Y0 + dia * (Q + G)}" width="${Q}" height="${Q}" rx="3" fill="${t.n[lv]}" style="animation-delay:${atraso}"><title>${label}</title></rect>`;
    });
  });
  const legenda = '<g class="lg">' + t.n.map((c, i) => `<rect x="${W - 120 + i * (Q + G)}" y="${H - 26}" width="${Q}" height="${Q}" rx="3" fill="${c}" style="animation-delay:${i * 0.18}s"/>`).join('') + '</g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} ${L.titulo}">
<style>
  text { font: 11px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; fill: ${t.dim}; }
  .t { font-size: 14px; font-weight: 600; fill: ${t.txt}; }
  .n { fill: ${t.acc}; }
  /* Tudo começa visível: as animações só enfeitam, nunca escondem a grade. */
  .g rect { transform-box: fill-box; transform-origin: center; animation: onda 7s ease-in-out infinite; }
  .g rect.q { animation: onda 7s ease-in-out infinite, pulso 2.4s ease-in-out infinite; }
  @keyframes onda { 0%, 14%, 100% { transform: none; opacity: 1; } 5% { transform: translateY(-2px) scale(1.18); opacity: .7; } }
  @keyframes pulso { 0%, 100% { filter: none; } 50% { filter: brightness(1.35) drop-shadow(0 0 3px ${t.acc}); } }
  .scan { animation: scan 7s ease-in-out infinite; }
  @keyframes scan { 0% { transform: translateX(0); opacity: 0; } 4% { opacity: 1; } 32% { opacity: 1; } 36%, 100% { transform: translateX(${semanas.length * (Q + G)}px); opacity: 0; } }
  .lg rect { transform-box: fill-box; transform-origin: center; animation: lg 2.5s ease-in-out infinite; }
  @keyframes lg { 0%, 60%, 100% { transform: none; } 30% { transform: scale(1.25); } }
  .n { animation: brilha 3s ease-in-out infinite; }
  @keyframes brilha { 50% { filter: drop-shadow(0 0 4px ${t.acc}); } }
  @media (prefers-reduced-motion: reduce) { .g rect, .g rect.q, .scan, .lg rect, .n { animation: none; } }
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.bg}" stroke="${t.borda}"/>
<text x="16" y="26" class="t"><tspan class="n">${total.toLocaleString(L.locale)}</tspan> ${L.titulo}</text>
<g>${meses}</g>
<text x="8" y="${Y0 + 1 * (Q + G) + 9}">${L.dias[0]}</text><text x="8" y="${Y0 + 3 * (Q + G) + 9}">${L.dias[1]}</text><text x="8" y="${Y0 + 5 * (Q + G) + 9}">${L.dias[2]}</text>
<defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="${t.acc}" stop-opacity="0"/><stop offset=".5" stop-color="${t.acc}" stop-opacity=".35"/><stop offset="1" stop-color="${t.acc}" stop-opacity="0"/></linearGradient></defs>
<g class="g">${celulas}</g>
<rect class="scan" x="${X0 - 30}" y="${Y0 - 3}" width="30" height="${7 * (Q + G) + 3}" fill="url(#sg)" opacity="0" pointer-events="none"/>
<text x="16" y="${H - 16}">${L.atualizado} ${new Date().toLocaleDateString(L.locale, { timeZone: 'America/Sao_Paulo' })}</text>
<text x="${W - 126}" y="${H - 16}" text-anchor="end">${L.menos}</text>${legenda}<text x="${W - 120 + 5 * (Q + G) + 2}" y="${H - 16}">${L.mais}</text>
</svg>
`;
}

const dados = await buscar();
mkdirSync('assets', { recursive: true });
writeFileSync('assets/contribuicoes.svg', svg(dados, TEMAS.escuro, TEXTOS.pt));
writeFileSync('assets/contribuicoes-claro.svg', svg(dados, TEMAS.claro, TEXTOS.pt));
writeFileSync('assets/contributions.svg', svg(dados, TEMAS.escuro, TEXTOS.en));
writeFileSync('assets/contributions-light.svg', svg(dados, TEMAS.claro, TEXTOS.en));
writeFileSync('assets/cidade.svg', cidade(dados, 'pt'));
writeFileSync('assets/city.svg', cidade(dados, 'en'));
console.log(`${dados.total} contribuições, ${dados.semanas.length} semanas`);
