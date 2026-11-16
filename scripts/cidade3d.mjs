// Cidade 3D das contribuições: cada dia do último ano é um prédio, em perspectiva.
// Semanas vão da esquerda para a direita e os dias da semana vão "para o fundo".
// A altura vem das contribuições do dia; dias sem contribuição viram calçada.
const TXT = {
  pt: { titulo: 'contribuições no último ano', sub: 'cada prédio é um dia · quanto mais alto, mais contribuições', meses: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], c: 'contribuições em', locale: 'pt-BR' },
  en: { titulo: 'contributions in the last year', sub: 'every building is a day · taller means more contributions', meses: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], c: 'contributions on', locale: 'en-US' },
};
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
// cores por nível: [frente, lateral, telhado]
const CORES = [
  ['#24173f', '#1a102f', '#2f1f52'],
  ['#3b2470', '#2a1854', '#4c2f8f'],
  ['#5530a3', '#3d2178', '#6d43c9'],
  ['#7445d6', '#53309e', '#9166ec'],
  ['#9b6bff', '#6f47c4', '#c4a3ff'],
];

export function cidade3d({ total, semanas }, lang) {
  const L = TXT[lang];
  const W = 900, H = 380;
  const SX = 14, BW = 10, DX = 8, DY = 5.5, OX = 6, OY = 4; // passo da semana, largura, passo do fundo, profundidade do prédio
  const CHAO = 330, X0 = 36, MAXH = 140;
  const dias = semanas.flatMap((s) => s.contributionDays);
  const max = Math.max(1, ...dias.map((d) => d.contributionCount));
  const topo = dias.find((d) => d.contributionCount === max); // o dia mais forte ganha antena
  const r = rng(11);
  let ceu = '';
  for (let i = 0; i < 80; i++) ceu += `<circle class="st" cx="${(r() * W).toFixed(1)}" cy="${(r() * 170 + 6).toFixed(1)}" r="${(r() * 0.9 + 0.3).toFixed(2)}" style="animation-delay:${(r() * 4).toFixed(2)}s"/>`;
  let chao = '', predios = '', meses = '', ultimo = -1;
  // chão: um paralelogramo com a área toda
  const ax = X0 - 6, ay = CHAO + 6, bx = X0 + semanas.length * SX + 4, cx = bx + 7 * DX + 6, cy = CHAO - 7 * DY - 4;
  chao = `<path d="M${ax} ${ay} L${bx} ${ay} L${cx} ${cy} L${ax + 7 * DX + 6} ${cy} Z" fill="url(#piso)"/>`;
  const itens = [];
  semanas.forEach((s, w) => {
    const m = new Date(s.contributionDays[0].date + 'T12:00').getMonth();
    if (m !== ultimo && w < semanas.length - 2) { if (ultimo !== -1 || w < 2) meses += `<text x="${X0 + w * SX}" y="${CHAO + 24}">${L.meses[m]}</text>`; ultimo = m; }
    s.contributionDays.forEach((d) => {
      const dia = new Date(d.date + 'T12:00').getDay(); // 0 = domingo, fica na frente
      itens.push({ w, dia, d });
    });
  });
  // desenha do fundo para a frente e da esquerda para a direita
  itens.sort((a, b) => b.dia - a.dia || a.w - b.w);
  for (const { w, dia, d } of itens) {
    const x = X0 + w * SX + dia * DX, yb = CHAO - dia * DY; // canto inferior esquerdo da frente
    const n = d.contributionCount, lv = d.contributionLevel;
    const label = `${n} ${L.c} ${new Date(d.date + 'T12:00').toLocaleDateString(L.locale)}`;
    const [fr, la, te] = CORES[lv];
    const ox = OX, oy = OY; // profundidade do prédio
    if (n === 0) {
      predios += `<path d="M${x} ${yb} h${BW} l${ox} ${-oy} h${-BW} z" fill="${te}" opacity=".55"><title>${label}</title></path>`;
      continue;
    }
    const h = Math.round(8 + Math.sqrt(n / max) * MAXH);
    const yt = yb - h;
    const rr = rng(w * 7 + dia + 1);
    let jan = '';
    for (let yy = yt + 4; yy < yb - 4; yy += 6) for (const xx of [x + 2, x + 6]) {
      if (rr() < 0.25 + lv * 0.12) jan += `<rect${rr() < 0.15 ? ` class="pi" style="animation-delay:${(rr() * 6).toFixed(2)}s"` : ''} x="${xx}" y="${yy}" width="2" height="2.4" fill="${rr() < 0.5 ? '#f0abfc' : '#ddd6fe'}"/>`;
    }
    const antena = d === topo ? `<line x1="${x + BW / 2 + ox / 2}" y1="${yt - oy / 2}" x2="${x + BW / 2 + ox / 2}" y2="${yt - oy / 2 - 14}" stroke="#c4a3ff" stroke-width="1"/><circle class="an" cx="${x + BW / 2 + ox / 2}" cy="${yt - oy / 2 - 15}" r="1.8" fill="#f43f5e"/>` : '';
    predios += `<g class="pr" style="animation-duration:${(1 + w * 0.025 + dia * 0.04).toFixed(2)}s"><title>${label}</title>`
      + `<path d="M${x + BW} ${yb} l${ox} ${-oy} v${-h} l${-ox} ${oy} z" fill="${la}"/>`
      + `<path d="M${x} ${yt} h${BW} l${ox} ${-oy} h${-BW} z" fill="${te}"/>`
      + `<rect x="${x}" y="${yt}" width="${BW}" height="${h}" fill="${fr}"/>${jan}${antena}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} ${L.titulo}">
<defs>
  <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06030d"/><stop offset=".6" stop-color="#170b2e"/><stop offset="1" stop-color="#2a1458"/></linearGradient>
  <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1036"/><stop offset="1" stop-color="#2c1a55"/></linearGradient>
  <radialGradient id="lua"><stop offset=".55" stop-color="#f5e8ff"/><stop offset=".62" stop-color="#d8b4fe" stop-opacity=".5"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
  <radialGradient id="brilho" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#a855f7" stop-opacity=".35"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="10"/></clipPath>
</defs>
<style>
  text { font: 11px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #a99bc9; }
  .t { font-size: 15px; font-weight: 600; fill: #f3e8ff; }
  .t tspan { fill: #c084fc; }
  .s { fill: #8b7bb0; }
  /* Tudo começa visível; os prédios sobem juntos com durações diferentes. */
  .pr { transform-box: fill-box; transform-origin: 50% 100%; animation: sobe 1.4s cubic-bezier(.2,.9,.3,1.1); }
  @keyframes sobe { from { transform: scaleY(0); } to { transform: none; } }
  .st { fill: #fff; animation: cintila 3.2s ease-in-out infinite; }
  @keyframes cintila { 0%, 100% { opacity: .9; } 50% { opacity: .2; } }
  .pi { animation: pisca 6s steps(1) infinite; }
  @keyframes pisca { 0%, 70%, 100% { opacity: 1; } 72%, 88% { opacity: .1; } }
  .an { animation: antena 1.4s ease-in-out infinite; }
  @keyframes antena { 50% { opacity: .15; } }
  .lua { transform-box: fill-box; transform-origin: center; animation: lua 6s ease-in-out infinite; }
  @keyframes lua { 50% { transform: scale(1.06); } }
  .carro { animation: anda 10s linear infinite; }
  .carro.v { animation-duration: 13s; animation-direction: reverse; }
  @keyframes anda { from { transform: translateX(-40px); } to { transform: translateX(${W + 40}px); } }
  @media (prefers-reduced-motion: reduce) { .pr, .st, .pi, .an, .lua, .carro { animation: none; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#ceu)"/>
  <g>${ceu}</g>
  <circle class="lua" cx="${W - 70}" cy="60" r="32" fill="url(#lua)"/>
  <circle cx="${W - 78}" cy="54" r="4" fill="#e9d5ff" opacity=".7"/><circle cx="${W - 62}" cy="68" r="2.6" fill="#e9d5ff" opacity=".7"/>
  <ellipse cx="${W / 2}" cy="${CHAO}" rx="${W * 0.6}" ry="90" fill="url(#brilho)"/>
  <text x="18" y="30" class="t"><tspan>${total.toLocaleString(L.locale)}</tspan> ${L.titulo}</text>
  <text x="18" y="48" class="s">${L.sub}</text>
  ${chao}
  <g>${predios}</g>
  <rect x="0" y="${CHAO + 7}" width="${W}" height="9" fill="#120a24"/>
  <line x1="0" y1="${CHAO + 11.5}" x2="${W}" y2="${CHAO + 11.5}" stroke="#4c2a8a" stroke-dasharray="8 7"/>
  <g class="carro"><rect x="0" y="${CHAO + 8}" width="12" height="3.2" rx="1.6" fill="#f0abfc"/><circle cx="13" cy="${CHAO + 9.6}" r="1.8" fill="#fde68a"/></g>
  <g class="carro v"><rect x="0" y="${CHAO + 12.5}" width="12" height="3.2" rx="1.6" fill="#818cf8"/><circle cx="-1" cy="${CHAO + 14.1}" r="1.8" fill="#f43f5e"/></g>
  <g>${meses}</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="#3b2566"/>
</svg>
`;
}
