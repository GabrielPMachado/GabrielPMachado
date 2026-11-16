// Prédios 3D das contribuições girando: cada dia do último ano é um prédio roxo,
// com altura pelas contribuições do dia. O conjunto dá uma volta completa em loop
// para dar para ver todos os dias. O README não roda JavaScript, então a rotação
// é feita com quadros pré-desenhados que se alternam por CSS dentro do próprio SVG.
const TXT = {
  pt: { titulo: 'contribuições no último ano', sub: 'cada prédio é um dia · quanto mais alto, mais contribuições', locale: 'pt-BR' },
  en: { titulo: 'contributions in the last year', sub: 'every building is a day · taller means more contributions', locale: 'en-US' },
};
// [r, g, b] da cor base de cada nível (0 = sem contribuição não vira prédio)
const BASE = [null, [92, 52, 168], [118, 72, 214], [150, 102, 245], [190, 150, 255]];
const QUADROS = 60, VOLTA = 12; // quadros por volta e segundos por volta
const W = 900, H = 440, CX = W / 2, CY = 268, S = 12.5, TILT = 0.42; // escala e inclinação da câmera

const cor = (rgb, k) => `rgb(${rgb.map((v) => Math.min(255, Math.round(v * k))).join(',')})`;

function quadro(barras, ang, max) {
  const c = Math.cos(ang), s = Math.sin(ang), st = Math.sin(TILT), ct = Math.cos(TILT);
  const proj = (x, z, y) => {
    const xr = x * c - z * s, zr = x * s + z * c;
    return [CX + xr * S, CY + zr * S * st - y * S * ct * 1.6, zr];
  };
  const p = (q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  // piso
  const cantos = [[-27.2, -4.2], [27.2, -4.2], [27.2, 4.2], [-27.2, 4.2]].map(([x, z]) => proj(x, z, 0));
  let out = `<path class="piso" d="M${cantos.map(p).join(' L')} Z"/>`;
  // ordena do fundo para a frente
  const vis = barras.map((b) => ({ ...b, zr: proj(b.x, b.z, 0)[2] })).sort((a, b) => a.zr - b.zr);
  const lado = 0.4; // meia largura do prédio
  for (const b of vis) {
    const h = b.h;
    const base = [[-lado, -lado], [lado, -lado], [lado, lado], [-lado, lado]].map(([dx, dz]) => [b.x + dx, b.z + dz]);
    const bot = base.map(([x, z]) => proj(x, z, 0)), top = base.map(([x, z]) => proj(x, z, h));
    // faces laterais viradas para a câmera (normal com componente zr positiva)
    const normais = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    let faces = '';
    for (let i = 0; i < 4; i++) {
      const [nx, nz] = normais[i];
      const nzr = nx * s + nz * c;
      if (nzr <= 0) continue;
      const j = (i + 1) % 4;
      const nxr = nx * c - nz * s;
      const luz = 0.55 + 0.35 * Math.max(0, nxr * -0.6 + nzr * 0.8);
      faces += `<path d="M${p(bot[i])} L${p(bot[j])} L${p(top[j])} L${p(top[i])} Z" fill="${cor(b.rgb, luz)}"/>`;
    }
    faces += `<path d="M${top.map(p).join(' L')} Z" fill="${cor(b.rgb, 1.18)}"/>`;
    out += faces;
  }
  return out;
}

export function predios({ total, semanas }, lang) {
  const L = TXT[lang];
  const dias = semanas.flatMap((s, w) => s.contributionDays.map((d) => ({ ...d, w, dia: new Date(d.date + 'T12:00').getDay() })));
  const max = Math.max(1, ...dias.map((d) => d.contributionCount));
  const barras = dias.filter((d) => d.contributionCount > 0).map((d) => ({
    x: d.w - (semanas.length - 1) / 2, z: d.dia - 3,
    h: 0.35 + Math.sqrt(d.contributionCount / max) * 7.5,
    rgb: BASE[Math.max(1, d.contributionLevel)],
  }));
  const dur = VOLTA / QUADROS;
  let quadros = '';
  for (let k = 0; k < QUADROS; k++) {
    const ang = (k / QUADROS) * Math.PI * 2 + 0.35;
    quadros += `<g class="f${k === 0 ? ' f0' : ''}" style="animation-delay:${(-(QUADROS - k) * dur).toFixed(3)}s">${quadro(barras, ang, max)}</g>`;
  }
  const fatia = (100 / QUADROS).toFixed(3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} ${L.titulo}">
<defs>
  <radialGradient id="bg" cx=".5" cy=".62" r=".7"><stop offset="0" stop-color="#2a1559"/><stop offset=".55" stop-color="#140b2b"/><stop offset="1" stop-color="#0a0616"/></radialGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="10"/></clipPath>
</defs>
<style>
  text { font: 11px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #8b7bb0; }
  .t { font-size: 15px; font-weight: 600; fill: #f3e8ff; }
  .t tspan { fill: #c084fc; }
  .piso { fill: #2a1a4f; fill-opacity: .55; stroke: #6d43c9; stroke-opacity: .45; }
  /* Um quadro por vez. Sem animação (ou com "reduzir movimento"), fica parado no primeiro. */
  .f { visibility: hidden; animation: q ${VOLTA}s steps(1) infinite; }
  .f0 { visibility: visible; }
  @keyframes q { 0% { visibility: visible; } ${fatia}%, 100% { visibility: hidden; } }
  @media (prefers-reduced-motion: reduce) { .f { animation: none; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="18" y="30" class="t"><tspan>${total.toLocaleString(L.locale)}</tspan> ${L.titulo}</text>
  <text x="18" y="48">${L.sub}</text>
  ${quadros}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="#3b2566"/>
</svg>
`;
}
