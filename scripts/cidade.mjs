// Cidade das contribuições: cada prédio é uma semana do último ano.
// A altura vem do total da semana e as janelas acesas, dos dias com contribuição.
const TXT = {
  pt: { titulo: 'contribuições no último ano', sub: 'cada prédio é uma semana', meses: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], sem: 'Semana de', c: 'contribuições', locale: 'pt-BR' },
  en: { titulo: 'contributions in the last year', sub: 'every building is a week', meses: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], sem: 'Week of', c: 'contributions', locale: 'en-US' },
};

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

export function cidade({ total, semanas }, lang) {
  const L = TXT[lang];
  const W = 860, H = 330, CHAO = 268, X0 = 34, BW = 12, GAP = 3, MAXH = 170, MINH = 16;
  const tot = semanas.map((s) => s.contributionDays.reduce((a, d) => a + d.contributionCount, 0));
  const max = Math.max(1, ...tot);
  const tons = ['#1e1433', '#2c1a52', '#3f2477', '#5b34a8', '#7c4ddb'];
  let ceu = '', predios = '', meses = '', ultimo = -1, fundo = '';
  // silhueta distante, só para dar profundidade
  const rf = rng(3);
  for (let x = 0; x < W; x += 18 + rf() * 14) { const h = 30 + rf() * 70; fundo += `<rect x="${x.toFixed(1)}" y="${(CHAO - h).toFixed(1)}" width="${(16 + rf() * 12).toFixed(1)}" height="${h.toFixed(1)}" rx="1"/>`; }
  const r = rng(7);
  for (let i = 0; i < 70; i++) {
    const x = (r() * W).toFixed(1), y = (r() * 150 + 8).toFixed(1), rad = (r() * 0.9 + 0.3).toFixed(2);
    ceu += `<circle class="st" cx="${x}" cy="${y}" r="${rad}" style="animation-delay:${(r() * 4).toFixed(2)}s"/>`;
  }
  semanas.forEach((s, w) => {
    const x = X0 + w * (BW + GAP);
    const h = Math.round(MINH - 6 + rng(w + 99)() * 10 + Math.sqrt(tot[w] / max) * (MAXH - MINH));
    const y = CHAO - h;
    const nivel = Math.min(4, Math.max(...s.contributionDays.map((d) => d.contributionLevel)));
    const rr = rng(w + 1);
    const m = new Date(s.contributionDays[0].date + 'T12:00').getMonth();
    if (m !== ultimo && w < semanas.length - 2) { if (ultimo !== -1 || w < 2) meses += `<text x="${x}" y="${CHAO + 34}">${L.meses[m]}</text>`; ultimo = m; }
    // janelas: duas colunas; a quantidade acesa acompanha os dias com contribuição
    const dias = s.contributionDays.filter((d) => d.contributionCount > 0).length;
    let jan = '';
    const linhas = Math.floor((h - 8) / 7);
    for (let l = 0; l < linhas; l++) for (let c = 0; c < 2; c++) {
      const acesa = tot[w] > 0 && rr() < 0.15 + dias / 9;
      if (!acesa) continue;
      const pisca = rr() < 0.18 ? ` class="pi" style="animation-delay:${(rr() * 5).toFixed(2)}s"` : '';
      jan += `<rect${pisca} x="${x + 2 + c * 5}" y="${y + 5 + l * 7}" width="3" height="3" rx=".6" fill="${rr() < 0.5 ? '#f0abfc' : '#c4b5fd'}"/>`;
    }
    const antena = tot[w] === max ? `<line x1="${x + BW / 2}" y1="${y}" x2="${x + BW / 2}" y2="${y - 14}" stroke="${tons[3]}" stroke-width="1.2"/><circle class="an" cx="${x + BW / 2}" cy="${y - 15}" r="1.8" fill="#f43f5e"/>` : '';
    const data = new Date(s.contributionDays[0].date + 'T12:00').toLocaleDateString(L.locale);
    predios += `<g class="pr" style="animation-duration:${(1.1 + w * 0.03).toFixed(2)}s"><title>${L.sem} ${data}: ${tot[w]} ${L.c}</title><rect x="${x}" y="${y}" width="${BW}" height="${h}" rx="1.5" fill="${tons[nivel]}"/><rect x="${x}" y="${y}" width="${BW}" height="${h}" rx="1.5" fill="url(#luz)"/>${jan}${antena}</g>`;
  });
  const fimX = X0 + semanas.length * (BW + GAP);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} ${L.titulo}">
<defs>
  <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07040f"/><stop offset=".65" stop-color="#1a0d33"/><stop offset="1" stop-color="#2e1760"/></linearGradient>
  <linearGradient id="luz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  <radialGradient id="lua"><stop offset=".55" stop-color="#f5e8ff"/><stop offset=".62" stop-color="#d8b4fe" stop-opacity=".5"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
  <linearGradient id="chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1650"/><stop offset="1" stop-color="#0d0719"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="10"/></clipPath>
</defs>
<style>
  text { font: 11px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #a99bc9; }
  .t { font-size: 15px; font-weight: 600; fill: #f3e8ff; }
  .t tspan { fill: #c084fc; }
  .s { font-size: 11px; fill: #8b7bb0; }
  /* Tudo já começa visível; as animações só dão vida. Os prédios sobem juntos,
     com durações diferentes, para nenhum aparecer antes de começar a subir. */
  .pr { transform-box: fill-box; transform-origin: 50% 100%; animation: sobe 1.6s cubic-bezier(.2,.9,.3,1.1); }
  @keyframes sobe { from { transform: scaleY(0); } to { transform: none; } }
  .st { fill: #fff; animation: brilho 3.2s ease-in-out infinite; }
  @keyframes brilho { 0%, 100% { opacity: .9; } 50% { opacity: .2; } }
  .pi { animation: pisca 6s steps(1) infinite; }
  @keyframes pisca { 0%, 70%, 100% { opacity: 1; } 72%, 88% { opacity: .1; } }
  .an { animation: antena 1.4s ease-in-out infinite; }
  @keyframes antena { 50% { opacity: .15; } }
  .lua { animation: lua 6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes lua { 50% { transform: scale(1.06); } }
  .carro { animation: anda 9s linear infinite; }
  .carro.v { animation-duration: 12s; animation-direction: reverse; }
  @keyframes anda { from { transform: translateX(-60px); } to { transform: translateX(${W + 60}px); } }
  @media (prefers-reduced-motion: reduce) { .pr, .st, .pi, .an, .lua, .carro { animation: none; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#ceu)"/>
  <g>${ceu}</g>
  <circle class="lua" cx="${W - 70}" cy="62" r="34" fill="url(#lua)"/>
  <circle cx="${W - 78}" cy="56" r="4" fill="#e9d5ff" opacity=".7"/><circle cx="${W - 62}" cy="70" r="2.6" fill="#e9d5ff" opacity=".7"/>
  <text x="18" y="30" class="t"><tspan>${total.toLocaleString(L.locale)}</tspan> ${L.titulo}</text>
  <text x="18" y="48" class="s">${L.sub}</text>
  <g fill="#1b1036" opacity=".85">${fundo}</g>
  <g>${predios}</g>
  <rect x="0" y="${CHAO}" width="${W}" height="${H - CHAO}" fill="url(#chao)"/>
  <line x1="0" y1="${CHAO + 12}" x2="${W}" y2="${CHAO + 12}" stroke="#4c2a8a" stroke-width="1" stroke-dasharray="8 7"/>
  <g class="carro"><rect x="0" y="${CHAO + 6}" width="14" height="4" rx="2" fill="#f0abfc"/><circle cx="15" cy="${CHAO + 8}" r="2.2" fill="#fde68a"/></g>
  <g class="carro v"><rect x="0" y="${CHAO + 15}" width="14" height="4" rx="2" fill="#818cf8"/><circle cx="-1" cy="${CHAO + 17}" r="2.2" fill="#f43f5e"/></g>
  <g>${meses}</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="#3b2566"/>
</svg>
`;
}
