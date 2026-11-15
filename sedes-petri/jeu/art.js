'use strict';
/* =========================================================
   SEDES PETRI — art procédural (blasons, portraits, scènes)
   ========================================================= */
let _uid = 0;
const OR = '#e2b53e', GU = '#b3242b', AZ = '#2b4f9c', AR = '#f3efe4', SA = '#1c1a18', VE = '#2f7a3a';
const SHP = 'M6 6H94V58C94 88 74 106 50 116C26 106 6 88 6 58Z';
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const F = c => `<rect x="0" y="0" width="100" height="120" fill="${c}"/>`;
const FLEUR = 'M0 -13C4 -9 5 -4 2 1L-2 1C-5 -4 -4 -9 0 -13ZM-2 0C-6 -8 -14 -7 -13 -1C-12 3 -8 3 -6 0C-6 3 -4 4 -2 3ZM2 0C6 -8 14 -7 13 -1C12 3 8 3 6 0C6 3 4 4 2 3ZM-7 2H7V5H-7ZM-2 5L-5 12L0 9L5 12L2 5Z';
const fleur = (x, y, s, c) => `<path d="${FLEUR}" fill="${c}" stroke="#2a1a0c" stroke-width="${0.6 / s}" transform="translate(${x} ${y}) scale(${s})"/>`;
const LION = 'M38 104L42 84L36 74L34 58L28 52L30 44L38 42L36 34L30 30L34 22L42 20L48 24L52 32L50 40L58 46L66 40L72 44L64 52L66 64L76 60L80 66L70 72L68 86L74 104L64 104L60 90L52 92L50 104Z';
const lion = (c, extra) => `<path d="${LION}" fill="${c}" stroke="#2a1a0c" stroke-width="1.2"/><path d="M68 86C84 84 88 70 80 58" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M30 30L22 27M34 22L28 18" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>${extra || ''}`;
const LIONP = 'M-22 4L-18 -4L-20 -9L-14 -10L-10 -6L10 -6L14 -10L18 -12L20 -8L17 -5L18 2L16 8L13 8L13 2L4 2L2 8L-1 8L0 2L-10 2L-12 8L-15 8L-14 2L-18 6Z';
const lionP = (y, c) => `<g transform="translate(50 ${y}) scale(1.35)"><path d="${LIONP}" fill="${c}" stroke="#2a1a0c" stroke-width=".8"/><path d="M18 -7C24 -12 25 -17 21 -19" fill="none" stroke="${c}" stroke-width="2"/></g>`;
function eagle(c, beak, two) {
 const wings = 'M44 44L14 30L18 40L10 42L16 50L8 54L18 60L12 66L26 66L40 62ZM56 44L86 30L82 40L90 42L84 50L92 54L82 60L88 66L74 66L60 62Z';
 const body = 'M50 32C45 32 43 38 44 44L40 70L46 78L42 96L50 88L58 96L54 78L60 70L56 44C57 38 55 32 50 32Z';
 const heads = two ? `<circle cx="42" cy="27" r="6.5" fill="${c}"/><circle cx="58" cy="27" r="6.5" fill="${c}"/><path d="M36 27L30 30L36 31Z M64 27L70 30L64 31Z" fill="${beak}"/>` : `<circle cx="50" cy="27" r="7" fill="${c}"/><path d="M56 26L64 30L56 32Z" fill="${beak}"/>`;
 return `<g stroke="#2a1a0c" stroke-width="1"><path d="${wings}" fill="${c}"/><path d="${body}" fill="${c}"/>${heads}<path d="M44 76L36 86M56 76L64 86" stroke="${beak}" stroke-width="3"/></g>`;
}
function key(rot, c) { return `<g transform="rotate(${rot} 50 60)"><rect x="47.5" y="22" width="5" height="60" fill="${c}" stroke="#2a1a0c" stroke-width=".8"/><circle cx="50" cy="90" r="9" fill="none" stroke="${c}" stroke-width="5"/><circle cx="50" cy="90" r="9" fill="none" stroke="#2a1a0c" stroke-width=".6"/><rect x="52" y="24" width="13" height="6" fill="${c}" stroke="#2a1a0c" stroke-width=".8"/><rect x="52" y="34" width="9" height="5" fill="${c}" stroke="#2a1a0c" stroke-width=".8"/></g>`; }
const cross = (c, w) => `<rect x="${50 - w / 2}" y="0" width="${w}" height="120" fill="${c}"/><rect x="0" y="${52 - w / 2}" width="100" height="${w}" fill="${c}"/>`;
const crown = (x, y, s, c) => `<path d="M-12 6L-12 -4L-6 1L0 -8L6 1L12 -4L12 6Z" fill="${c}" stroke="#2a1a0c" stroke-width="${0.8 / s}" transform="translate(${x} ${y}) scale(${s})"/>`;
function crescent(cx, cy, r, c, bg) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><circle cx="${cx + r * 0.38}" cy="${cy - r * 0.1}" r="${r * 0.82}" fill="${bg}"/>`; }
const BLZ = {
 etats: () => F(GU) + key(-35, OR) + key(35, AR) + `<path d="M40 20C40 8 46 3 50 2C54 3 60 8 60 20Z" fill="${AR}" stroke="${OR}" stroke-width="1.5"/><path d="M41 16H59M42 11H58" stroke="${OR}" stroke-width="2"/>`,
 empire: () => F(OR) + eagle(SA, GU),
 france: () => F(AZ) + fleur(28, 36, 1.35, OR) + fleur(72, 36, 1.35, OR) + fleur(50, 80, 1.35, OR),
 angleterre: () => F(GU) + lionP(30, OR) + lionP(58, OR) + lionP(86, OR),
 ecosse: () => F(OR) + `<path d="${SHP}" fill="none" stroke="${GU}" stroke-width="2.5" transform="translate(50 60) scale(.8) translate(-50 -60)"/>` + `<g transform="translate(50 62) scale(.75) translate(-52 -62)">${lion(GU)}</g>`,
 irlande: () => F(AZ) + `<path d="M36 28C50 20 66 26 68 36L62 98L55 98L58 44C52 38 44 38 40 42L40 98L33 98Z" fill="${OR}" stroke="#2a1a0c"/><path d="M44 46V96M49 44V96M54 46V96" stroke="${AR}" stroke-width="1.2"/>`,
 castille: () => F(GU) + `<path d="M26 96V56H32V48H38V56H44V40H40V30H46V36H54V30H60V40H56V56H62V48H68V56H74V96Z" fill="${OR}" stroke="#2a1a0c"/><rect x="45" y="74" width="10" height="22" rx="5" fill="${AZ}"/><rect x="33" y="62" width="5" height="8" fill="${AZ}"/><rect x="62" y="62" width="5" height="8" fill="${AZ}"/>`,
 aragon: () => F(OR) + [0, 1, 2, 3].map(i => `<rect x="${11 + i * 22}" y="0" width="11" height="120" fill="${GU}"/>`).join(''),
 navarre: () => F(GU) + `<g stroke="${OR}" stroke-width="5" stroke-dasharray="5 3" fill="none"><path d="M50 6V112M6 56H94M12 12L88 104M88 12L12 104"/><path d="${SHP}" transform="translate(50 60) scale(.86) translate(-50 -60)"/></g><circle cx="50" cy="56" r="7" fill="${VE}" stroke="${OR}" stroke-width="2"/>`,
 portugal: () => F(AR) + [[50, 34], [30, 58], [50, 58], [70, 58], [50, 82]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-8 -10H8V2C8 9 0 12 0 12C0 12 -8 9 -8 2Z" fill="${AZ}" stroke="#2a1a0c" stroke-width=".7"/><circle cx="-3" cy="-5" r="1.4" fill="${AR}"/><circle cx="3" cy="-5" r="1.4" fill="${AR}"/><circle cx="0" cy="0" r="1.4" fill="${AR}"/><circle cx="-3" cy="5" r="1.4" fill="${AR}"/><circle cx="3" cy="5" r="1.4" fill="${AR}"/></g>`).join(''),
 sicile: () => F(AZ) + [[22, 40], [50, 40], [78, 40], [36, 66], [64, 66], [50, 92], [22, 92], [78, 92]].map(([x, y]) => fleur(x, y, 0.85, OR)).join('') + `<rect x="10" y="12" width="80" height="6" fill="${GU}"/>` + [24, 50, 76].map(x => `<path d="M${x - 6} 18H${x + 6}L${x + 4} 28H${x - 4}Z" fill="${GU}"/>`).join(''),
 venise: () => F(GU) + `<g transform="translate(50 62) scale(.8) translate(-52 -64)">${lion(OR, '<path d="M50 40C60 20 80 16 86 22C76 26 70 34 62 44Z" fill="' + OR + '" stroke="#2a1a0c"/>')}</g>`,
 genes: () => F(AR) + cross(GU, 16),
 lombardie: () => F(AR) + `<path d="M58 22C34 32 70 46 48 60C28 74 68 82 50 100" fill="none" stroke="${AZ}" stroke-width="10" stroke-linecap="round"/><circle cx="60" cy="20" r="7" fill="${AZ}"/><path d="M62 14L60 8L66 12Z" fill="${OR}"/><circle cx="68" cy="24" r="4" fill="${GU}"/>`,
 toscane: () => F(AR) + fleur(50, 58, 3, GU),
 toulouse: () => F(GU) + `<path d="M50 14L58 46L90 54L58 62L50 100L42 62L10 54L42 46Z" fill="${OR}" stroke="#2a1a0c"/>` + [[50, 12], [90, 54], [50, 102], [10, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${OR}" stroke="#2a1a0c" stroke-width=".7"/>`).join(''),
 hongrie: () => [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="0" y="${i * 15}" width="100" height="15" fill="${i % 2 ? AR : GU}"/>`).join(''),
 pologne: () => F(GU) + eagle(AR, OR) + crown(50, 16, 0.9, OR),
 danemark: () => F(GU) + `<rect x="30" y="0" width="13" height="120" fill="${AR}"/><rect x="0" y="48" width="100" height="13" fill="${AR}"/>`,
 suede: () => F(AZ) + crown(30, 38, 1.3, OR) + crown(70, 38, 1.3, OR) + crown(50, 78, 1.3, OR),
 norvege: () => F(GU) + `<g transform="translate(50 62) scale(.8) translate(-52 -64)">${lion(OR, '<path d="M64 44L86 18" stroke="' + AR + '" stroke-width="3"/><path d="M80 14L92 20L84 26Z" fill="' + AR + '"/>')}</g>`,
 byzance: () => F('#8b1f2b') + cross(OR, 10) + [[25, 30], [75, 30], [25, 84], [75, 84]].map(([x, y], i) => `<text x="${x}" y="${y + 8}" font-size="24" font-weight="bold" text-anchor="middle" fill="${OR}" font-family="serif" transform="${i % 2 ? `scale(-1 1) translate(${-2 * x} 0)` : ''}">B</text>`).join(''),
 rus: () => F(AZ) + `<path d="M47 16H53V100H47ZM36 34H64V39H36ZM30 50H70V56H30ZM38 80L62 70L63 75L39 85Z" fill="${OR}" stroke="#2a1a0c" stroke-width=".7"/>`,
 balkans: () => F(GU) + eagle(AR, OR, true),
 georgie: () => F(AR) + cross(GU, 14) + [[25, 28], [75, 28], [25, 82], [75, 82]].map(([x, y]) => `<path d="M${x - 2} ${y - 9}h4v7h7v4h-7v7h-4v-7h-7v-4h7Z" fill="${GU}"/>`).join(''),
 armenie: () => F(AZ) + `<g transform="translate(50 62) scale(.8) translate(-52 -64)">${lion(OR)}</g>` + crown(50, 16, .8, OR),
 outremer: () => F(AR) + `<path d="M44 14H56V46H88V58H56V100H44V58H12V46H44Z" fill="${OR}" stroke="#2a1a0c"/><path d="M38 14H62V20H38ZM38 94H62V100H38ZM12 40H18V64H12ZM82 40H88V64H82Z" fill="${OR}" stroke="#2a1a0c" stroke-width=".7"/>` + [[26, 28], [74, 28], [26, 80], [74, 80]].map(([x, y]) => `<path d="M${x - 2} ${y - 8}h4v6h6v4h-6v6h-4v-6h-6v-4h6Z" fill="${OR}"/>`).join(''),
 teutons: () => F(AR) + `<path d="M42 0H58V44H100V60H58V120H42V60H0V44H42Z" fill="${SA}"/><path d="M48 20H52V48H80V56H52V100H48V56H20V48H48Z" fill="${OR}"/>`,
 baltes: () => F(GU) + `<path d="M28 52H72V62H64V92H56V62H44V92H36V62H28Z M36 52V38H44V52M56 52V38H64V52" fill="${OR}" stroke="#2a1a0c"/><rect x="34" y="30" width="32" height="8" fill="${OR}" stroke="#2a1a0c"/>`,
 horde: () => F(OR) + `<path d="M50 24V98M32 34C32 58 68 58 68 34" fill="none" stroke="#6b2d10" stroke-width="9" stroke-linecap="round"/>`,
 turcs: () => F(GU) + crescent(46, 58, 26, AR, GU),
 egypte: () => F(OR) + `<path d="M34 44H66C66 62 58 70 50 70C42 70 34 62 34 44Z M46 70H54V82H62V88H38V82H46Z" fill="${GU}" stroke="#2a1a0c"/><rect x="30" y="38" width="40" height="6" fill="${GU}"/>`,
 maghreb: () => F(GU) + `<rect x="26" y="34" width="48" height="48" fill="${AR}"/>` + [0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => (i + j) % 2 ? `<rect x="${26 + i * 12}" y="${34 + j * 12}" width="12" height="12" fill="${SA}"/>` : '').join('')).join(''),
 ifriqiya: () => F(VE) + crescent(46, 58, 24, AR, VE),
 andalus: () => F(GU) + `<path d="M0 10L10 0L100 92L100 110L90 120L0 28Z" fill="${OR}" stroke="#2a1a0c"/>`
};
/* Les SVG répétés (blasons, portraits) deviennent des images : le navigateur les met en cache et les décode hors du DOM. */
function svgImg(svg, cls) {
 if (typeof document === 'undefined') return svg;
 const w = /width="([\d.]+)"/.exec(svg), h = /height="([\d.]+)"/.exec(svg);
 const s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
 return `<img class="${cls}" alt="" width="${w ? w[1] : ''}" height="${h ? h[1] : ''}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}">`;
}
const _SHC = new Map();
function shieldSVG(r, w) {
 const ck = r + '|' + (w || 40); if (_SHC.has(ck)) return _SHC.get(ck); const out = svgImg(shieldSVG0(r, w), 'shield'); _SHC.set(ck, out); return out;
}
function shieldSVG0(r, w) {
 w = w || 40; const id = 'sh' + (++_uid); const inner = (BLZ[r] || BLZ.genes)();
 return `<svg class="shield" viewBox="0 0 100 120" width="${w}" height="${w * 1.2}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${SHP}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs><g clip-path="url(#${id})">${inner}<rect width="100" height="120" fill="url(#${id}g)"/></g><path d="${SHP}" fill="none" stroke="#2a1a0c" stroke-width="4"/><path d="${SHP}" fill="none" stroke="#d9b45a" stroke-width="1.3" transform="translate(50 60) scale(.93) translate(-50 -60)"/></svg>`;
}
function papalArms(w) {
 const id = 'pa' + (++_uid);
 return `<svg viewBox="0 0 120 120" width="${w}" height="${w}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#d9c99e"/></linearGradient></defs>
 <g transform="translate(10 34) scale(.82)">${key(-38, OR)}${key(38, '#e8e6e0')}</g>
 <path d="M60 46C46 46 44 30 46 20C48 10 55 4 60 3C65 4 72 10 74 20C76 30 74 46 60 46Z" fill="url(#${id})" stroke="#8a6a20" stroke-width="1.5"/>
 <path d="M46 38Q60 42 74 38M47 28Q60 32 73 28M50 18Q60 21 70 18" fill="none" stroke="${OR}" stroke-width="3"/>
 ${[38, 28, 18].map(y => [52, 60, 68].map(x => `<circle cx="${x}" cy="${y - 2}" r="1.6" fill="${GU}"/>`).join('')).join('')}
 <circle cx="60" cy="2.5" r="3" fill="${OR}"/><path d="M58.6 -6H61.4V2H58.6ZM56 -3.5H64V-1H56Z" fill="${OR}"/>
 <path d="M50 46L46 64M70 46L74 64" stroke="${GU}" stroke-width="3"/></svg>`;
}

/* ---------- Portraits ---------- */
const SKINS = ['#f2cba6', '#e9b993', '#ddaa80', '#cf9a70', '#bb8459', '#f6d6b8', '#a8714a'];
const _PTC = new Map();
function portraitSVG(o) {
 const ck = [o.seed, o.kind, Math.floor((o.age || 40) / 6), o.w, o.female ? 1 : 0, o.bg, o.robe].join('|'); if (_PTC.has(ck)) return _PTC.get(ck);
 const out = svgImg(portraitSVG0(o), 'pimg'); if (_PTC.size > 600) _PTC.clear(); _PTC.set(ck, out); return out;
}
function portraitSVG0(o) {
 const rng = mulberry(o.seed || 1); const R = () => rng(); const P = a => a[Math.floor(R() * a.length)];
 const kind = o.kind || 'king', age = o.age || 40, w = o.w || 80, female = !!o.female;
 const south = ['sultan', 'khan'].includes(kind);
 const skin = south ? P(['#d9a47c', '#c88f68', '#b97f57', '#e1b28a']) : P(SKINS.slice(0, 6));
 const skinD = shade(skin, -0.22);
 let hair = P(['#2a1a10', '#4a3020', '#6b4a2a', '#8a6236', '#b08850', '#3a2a1e']);
 if (age > 66) hair = '#e6e2da'; else if (age > 54) hair = '#a9a399'; else if (age > 46 && R() < .5) hair = shade(hair, 0.25);
 const cx = 50, cy = 62, rx = 16 + R() * 3.5, ry = 20 + R() * 3;
 const id = 'pt' + (++_uid);
 const bg = o.bg || '#5a1a1a';
 const robe = { pope: '#f4efe2', cardinal: '#a3171c', king: o.robe || '#5b2a6e', emperor: '#3a2a6e', basileus: '#5a1c62', sultan: o.robe || '#2f6b44', khan: '#284f86', doge: '#c9a13a', master: '#efeee8', queen: o.robe || '#7a2240' }[kind] || '#555';
 let s = `<svg viewBox="0 0 100 110" width="${w}" height="${w * 1.1}" aria-hidden="true"><defs><clipPath id="${id}"><rect x="2" y="2" width="96" height="106" rx="10"/></clipPath><radialGradient id="${id}b" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="${shade(bg, 0.35)}"/><stop offset="1" stop-color="${shade(bg, -0.35)}"/></radialGradient><radialGradient id="${id}s" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="${shade(skin, 0.12)}"/><stop offset="1" stop-color="${skinD}"/></radialGradient></defs><g clip-path="url(#${id})"><rect width="100" height="110" fill="url(#${id}b)"/>`;
 s += `<g opacity=".18">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${i * 20 - 10} 0L${i * 20 + 30} 110" stroke="#fff" stroke-width="5"/>`).join('')}</g>`;
 // épaules
 s += `<path d="M6 112C8 92 24 84 50 82C76 84 92 92 94 112Z" fill="${robe}" stroke="#1a0f08" stroke-width="1"/>`;
 if (kind === 'pope') s += `<path d="M14 112C16 94 30 86 50 85C70 86 84 94 86 112L74 112L50 92L26 112Z" fill="#a3171c" stroke="#1a0f08" stroke-width=".8"/><path d="M44 90L40 112H46L50 96L54 112H60L56 90" fill="${OR}"/><circle cx="50" cy="100" r="2.5" fill="${OR}"/>`;
 if (kind === 'cardinal') s += `<path d="M18 112C20 96 32 88 50 87C68 88 80 96 82 112Z" fill="#c21f26" stroke="#1a0f08" stroke-width=".7"/><path d="M50 88V112" stroke="#f4efe2" stroke-width="1.2" stroke-dasharray="2 3"/><path d="M46 100L50 96L54 100L50 112Z" fill="${OR}"/>`;
 if (kind === 'king' || kind === 'emperor' || kind === 'queen') s += `<path d="M12 112C14 94 28 86 50 85C72 86 86 94 88 112L80 112C78 98 66 92 50 92C34 92 22 98 20 112Z" fill="#f8f5ee" stroke="#1a0f08" stroke-width=".7"/>${[22, 32, 42, 58, 68, 78].map((x, i) => `<path d="M${x} ${100 - (i % 2) * 4}l1.2 3 -1.2 2 -1.2 -2z" fill="#111"/>`).join('')}<circle cx="50" cy="96" r="3" fill="${OR}"/>`;
 if (kind === 'basileus') s += `<path d="M30 112L36 88H64L70 112Z" fill="${OR}" opacity=".9"/>${[40, 50, 60].map(x => `<circle cx="${x}" cy="98" r="2.4" fill="${GU}"/><circle cx="${x - 3}" cy="106" r="1.6" fill="#2b6fb0"/>`).join('')}`;
 if (kind === 'sultan') s += `<path d="M38 86L50 112L62 86" fill="none" stroke="${OR}" stroke-width="3"/>`;
 if (kind === 'master') s += `<path d="M44 90H56V112H44ZM34 96H66V104H34Z" fill="${SA}"/>`;
 if (kind === 'doge') s += `<path d="M10 112C12 96 28 88 50 87C72 88 88 96 90 112Z" fill="#c9a13a" stroke="#1a0f08" stroke-width=".7"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${22 + i * 14}" cy="${100 + (i % 2) * 4}" r="2" fill="#7a1a1a"/>`).join('')}`;
 if (kind === 'khan') s += `<path d="M30 86L50 112L70 86" fill="none" stroke="#c9a13a" stroke-width="3"/><path d="M8 112C10 96 20 90 30 88L36 112Z M92 112C90 96 80 90 70 88L64 112Z" fill="#7a5a32"/>`;
 // cou
 s += `<path d="M42 ${cy + ry - 6}L42 86Q50 90 58 86L58 ${cy + ry - 6}Z" fill="${skinD}"/>`;
 // cheveux arrière
 const showHair = !['pope', 'sultan', 'queen'].includes(kind);
 if (showHair && !female) s += `<path d="M${cx - rx - 2} ${cy}C${cx - rx - 4} ${cy - ry - 4} ${cx + rx + 4} ${cy - ry - 4} ${cx + rx + 2} ${cy}L${cx + rx + 3} ${cy + 10}L${cx + rx - 2} ${cy + 2}L${cx - rx + 2} ${cy + 2}L${cx - rx - 3} ${cy + 10}Z" fill="${hair}"/>`;
 if (female) s += `<path d="M${cx - rx - 6} ${cy - 6}C${cx - rx - 8} ${cy - ry - 10} ${cx + rx + 8} ${cy - ry - 10} ${cx + rx + 6} ${cy - 6}L${cx + rx + 10} 92L${cx - rx - 10} 92Z" fill="${kind === 'queen' ? '#f4f0e6' : hair}" stroke="#1a0f08" stroke-width=".5"/>`;
 // oreilles + tête
 s += `<ellipse cx="${cx - rx + 0.5}" cy="${cy + 1}" rx="3.2" ry="5" fill="${skinD}"/><ellipse cx="${cx + rx - 0.5}" cy="${cy + 1}" rx="3.2" ry="5" fill="${skinD}"/>`;
 s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}s)" stroke="#3a2210" stroke-width=".8"/>`;
 if (female && kind === 'queen') s += `<path d="M${cx - rx - 1} ${cy + 6}Q${cx} ${cy + ry + 10} ${cx + rx + 1} ${cy + 6}L${cx + rx + 2} ${cy + ry + 8}L${cx - rx - 2} ${cy + ry + 8}Z" fill="#f4f0e6" stroke="#bdb6a4" stroke-width=".5"/>`;
 // yeux
 const ey = cy - 3 + R() * 2, ex = 6.2 + R() * 1.2, iris = P(['#3b2414', '#5a3b1f', '#2f4e6e', '#3e5a34', '#1d1410', '#6d5a3a']);
 for (const sx of [-1, 1]) {
  const x = cx + sx * ex;
  s += `<path d="M${x - 3.6} ${ey}Q${x} ${ey - 2.6} ${x + 3.6} ${ey}Q${x} ${ey + 2.2} ${x - 3.6} ${ey}Z" fill="#f6f1e6" stroke="#2a1a0c" stroke-width=".6"/><circle cx="${x + R() * 0.6 - 0.3}" cy="${ey}" r="1.5" fill="${iris}"/><circle cx="${x + 0.4}" cy="${ey - 0.5}" r=".45" fill="#fff"/>`;
  const bt = (R() - 0.5) * 2.6;
  s += `<path d="M${x - 4.4} ${ey - 4 + bt * sx * 0.4}Q${x} ${ey - 6.2} ${x + 4.4} ${ey - 4 - bt * sx * 0.4}" stroke="${age > 60 ? '#cfc8bc' : shade(hair, -0.1)}" stroke-width="${1.4 + R() * 0.8}" fill="none" stroke-linecap="round"/>`;
  if (age > 52) s += `<path d="M${x + sx * 4.6} ${ey - 0.5}l${sx * 2} -1M${x + sx * 4.6} ${ey + 0.8}l${sx * 2} 0.8" stroke="${skinD}" stroke-width=".5"/>`;
  if (age > 60) s += `<path d="M${x - 3} ${ey + 3.2}Q${x} ${ey + 4.6} ${x + 3} ${ey + 3.2}" stroke="${skinD}" stroke-width=".6" fill="none"/>`;
 }
 // nez
 const nl = 8 + R() * 4, nw = 2.6 + R() * 1.8, ny = ey + 2;
 s += P([`<path d="M${cx - 0.5} ${ny}L${cx - nw} ${ny + nl}Q${cx} ${ny + nl + 2.2} ${cx + nw} ${ny + nl}" stroke="${skinD}" stroke-width="1" fill="none"/>`,
  `<path d="M${cx} ${ny}Q${cx + nw + 1} ${ny + nl * 0.6} ${cx + nw * 0.5} ${ny + nl}Q${cx} ${ny + nl + 1.5} ${cx - nw} ${ny + nl - 0.5}" stroke="${skinD}" stroke-width="1" fill="none"/>`,
  `<path d="M${cx - 1} ${ny}Q${cx - 2} ${ny + nl * 0.7} ${cx - nw} ${ny + nl}Q${cx} ${ny + nl + 2} ${cx + nw} ${ny + nl}Q${cx + 1.5} ${ny + nl * 0.6} ${cx + 1} ${ny}" stroke="${skinD}" stroke-width=".9" fill="${shade(skin, -0.05)}"/>`]);
 // bouche
 const my = ny + nl + 5 + R() * 1.5, mw = 4.5 + R() * 2.5, mc = (R() - 0.55) * 2.5;
 s += `<path d="M${cx - mw} ${my}Q${cx} ${my + mc + 1.6} ${cx + mw} ${my}" stroke="#7a3a2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
 if (female) s += `<path d="M${cx - mw + 1} ${my + 0.4}Q${cx} ${my + 2.8} ${cx + mw - 1} ${my + 0.4}" fill="#b5524a" opacity=".6"/>`;
 if (age > 45) s += `<path d="M${cx - rx + 5} ${cy - ry + 9}Q${cx} ${cy - ry + 7} ${cx + rx - 5} ${cy - ry + 9}" stroke="${skinD}" stroke-width=".5" fill="none" opacity=".7"/>`;
 if (age > 58) s += `<path d="M${cx - nw - 3} ${ny + nl - 1}Q${cx - mw - 3} ${my + 1} ${cx - mw - 1} ${my + 4}M${cx + nw + 3} ${ny + nl - 1}Q${cx + mw + 3} ${my + 1} ${cx + mw + 1} ${my + 4}" stroke="${skinD}" stroke-width=".6" fill="none"/>`;
 // barbe
 const beardP = { pope: 0.05, cardinal: 0.1, king: 0.6, emperor: 0.65, basileus: 0.97, sultan: 0.9, khan: 0.4, doge: 0.5, master: 0.75 }[kind] || 0;
 if (!female && R() < beardP) {
  const bc = age > 60 ? '#ddd8ce' : hair; const bl = 6 + R() * 12;
  s += `<path d="M${cx - rx + 1} ${cy + 2}Q${cx - rx + 2} ${cy + ry + bl * 0.6} ${cx} ${cy + ry + bl}Q${cx + rx - 2} ${cy + ry + bl * 0.6} ${cx + rx - 1} ${cy + 2}Q${cx + rx - 4} ${my + 3} ${cx} ${my + 2.5}Q${cx - rx + 4} ${my + 3} ${cx - rx + 1} ${cy + 2}Z" fill="${bc}" stroke="#1a0f08" stroke-width=".4"/>`;
  s += `<path d="M${cx - mw - 1.5} ${my - 1.5}Q${cx} ${my - 4} ${cx + mw + 1.5} ${my - 1.5}Q${cx} ${my - 0.5} ${cx - mw - 1.5} ${my - 1.5}Z" fill="${bc}"/>`;
 } else if (kind === 'khan') s += `<path d="M${cx - mw - 2} ${my + 3}Q${cx - mw} ${my - 3} ${cx} ${my - 2}Q${cx + mw} ${my - 3} ${cx + mw + 2} ${my + 3}" stroke="${hair}" stroke-width="1.6" fill="none"/>`;
 // coiffes
 const top = cy - ry;
 if (kind === 'pope') {
  s += `<path d="M${cx - rx + 1} ${top + 7}Q${cx} ${top + 2} ${cx + rx - 1} ${top + 7}" stroke="#ece8de" stroke-width="3" fill="none"/>`;
  s += `<path d="M${cx - 15} ${top + 8}C${cx - 16} ${top - 18} ${cx - 7} ${top - 30} ${cx} ${top - 32}C${cx + 7} ${top - 30} ${cx + 16} ${top - 18} ${cx + 15} ${top + 8}Z" fill="#f6f1e2" stroke="#8a6a20" stroke-width="1"/>`;
  [top + 3, top - 7, top - 17].forEach((y, i) => { const hw = 15 - i * 2.4; s += `<path d="M${cx - hw} ${y}Q${cx} ${y + 2.5} ${cx + hw} ${y}" stroke="${OR}" stroke-width="2.6" fill="none"/>`; for (let k = -2; k <= 2; k++) s += `<path d="M${cx + k * hw / 2.6 - 1.4} ${y}l1.4 -3 1.4 3z" fill="${OR}"/>`; s += `<circle cx="${cx}" cy="${y + 1}" r="1.2" fill="${GU}"/>`; });
  s += `<circle cx="${cx}" cy="${top - 33}" r="2.2" fill="${OR}"/><path d="M${cx - 0.9} ${top - 41}h1.8v7h-1.8zM${cx - 3} ${top - 38.5}h6v1.8h-6z" fill="${OR}"/>`;
 } else if (kind === 'cardinal') {
  s += `<path d="M${cx - rx - 1} ${top + 9}C${cx - rx} ${top - 3} ${cx + rx} ${top - 3} ${cx + rx + 1} ${top + 9}Z" fill="#b51d24" stroke="#4a0a0a" stroke-width=".8"/><path d="M${cx} ${top - 2}V${top + 8}M${cx - 8} ${top}V${top + 8}M${cx + 8} ${top}V${top + 8}" stroke="#7a1015" stroke-width="1"/><circle cx="${cx}" cy="${top - 3}" r="2" fill="#7a1015"/>`;
 } else if (kind === 'king' || kind === 'emperor' || kind === 'queen') {
  const cw = rx + 1, cyb = top + 9;
  s += `<path d="M${cx - cw} ${cyb}L${cx - cw} ${cyb - 9}L${cx - cw / 2} ${cyb - 4}L${cx} ${cyb - 13}L${cx + cw / 2} ${cyb - 4}L${cx + cw} ${cyb - 9}L${cx + cw} ${cyb}Z" fill="${OR}" stroke="#6b4a10" stroke-width=".8"/><rect x="${cx - cw}" y="${cyb - 3}" width="${cw * 2}" height="4" fill="${shade(OR, -0.15)}"/>${[-2, -1, 0, 1, 2].map(k => `<circle cx="${cx + k * cw / 2.4}" cy="${cyb - 1}" r="1.3" fill="${k % 2 ? '#2b6fb0' : GU}"/>`).join('')}`;
  if (kind === 'emperor') s += `<path d="M${cx - cw + 2} ${cyb - 6}Q${cx} ${cyb - 30} ${cx + cw - 2} ${cyb - 6}" fill="none" stroke="${OR}" stroke-width="2.4"/><path d="M${cx - 1} ${cyb - 30}h2v-6h-2zM${cx - 3} ${cyb - 34}h6v2h-6z" fill="${OR}"/>`;
 } else if (kind === 'basileus') {
  s += `<path d="M${cx - rx - 1} ${top + 9}C${cx - rx - 1} ${top - 10} ${cx + rx + 1} ${top - 10} ${cx + rx + 1} ${top + 9}Z" fill="${OR}" stroke="#6b4a10"/>${[-1, 0, 1].map(k => `<circle cx="${cx + k * 8}" cy="${top + 2}" r="1.8" fill="${k ? '#2b6fb0' : GU}"/>`).join('')}<path d="M${cx - rx} ${top + 9}V${top + 26}M${cx - rx - 2} ${top + 9}V${top + 22}M${cx + rx} ${top + 9}V${top + 26}M${cx + rx + 2} ${top + 9}V${top + 22}" stroke="#f4efe2" stroke-width="1.6" stroke-dasharray="1.6 1.4"/><path d="M${cx - 1} ${top - 14}h2v-5h-2zM${cx - 2.6} ${top - 17}h5.2v1.6h-5.2z" fill="${OR}"/>`;
 } else if (kind === 'sultan') {
  s += `<ellipse cx="${cx}" cy="${top + 2}" rx="${rx + 6}" ry="12" fill="#f4f0e4" stroke="#8a826e"/><path d="M${cx - rx - 5} ${top + 2}Q${cx} ${top + 12} ${cx + rx + 5} ${top - 2}M${cx - rx - 4} ${top - 4}Q${cx} ${top + 6} ${cx + rx + 4} ${top - 7}" stroke="#bdb5a0" stroke-width="1.2" fill="none"/><path d="M${cx - 6} ${top - 8}Q${cx} ${top - 18} ${cx + 6} ${top - 8}Z" fill="#2f6b44"/><circle cx="${cx}" cy="${top + 2}" r="2.6" fill="${GU}" stroke="${OR}"/><path d="M${cx} ${top}Q${cx + 4} ${top - 14} ${cx + 1} ${top - 22}" stroke="#f4efe2" stroke-width="2.2" fill="none"/>`;
 } else if (kind === 'khan') {
  s += `<path d="M${cx - rx - 2} ${top + 8}L${cx} ${top - 22}L${cx + rx + 2} ${top + 8}Z" fill="#284f86" stroke="#13284a"/><rect x="${cx - rx - 4}" y="${top + 3}" width="${(rx + 4) * 2}" height="8" rx="4" fill="#8a6a3a"/><circle cx="${cx}" cy="${top - 22}" r="2.5" fill="${GU}"/>`;
 } else if (kind === 'doge') {
  s += `<path d="M${cx - rx - 1} ${top + 9}C${cx - rx - 1} ${top - 6} ${cx - 2} ${top - 18} ${cx + rx - 2} ${top - 12}C${cx + rx + 2} ${top - 6} ${cx + rx + 1} ${top + 2} ${cx + rx + 1} ${top + 9}Z" fill="#c9a13a" stroke="#6b4a10"/><path d="M${cx - rx} ${top + 8}H${cx + rx}" stroke="#f4efe2" stroke-width="2"/>${[0, 1, 2].map(k => `<circle cx="${cx - 6 + k * 6}" cy="${top - 2 - k * 2}" r="1.4" fill="#7a1a1a"/>`).join('')}`;
 }
 s += `</g><rect x="2" y="2" width="96" height="106" rx="10" fill="none" stroke="${OR}" stroke-width="2.5"/><rect x="5" y="5" width="90" height="100" rx="8" fill="none" stroke="#2a1a0c" stroke-width=".8" opacity=".6"/></svg>`;
 return s;
}
function shade(hex, p) {
 const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
 if (p > 0) { r += (255 - r) * p; g += (255 - g) * p; b += (255 - b) * p; } else { r *= 1 + p; g *= 1 + p; b *= 1 + p; }
 return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function rulerKind(r) {
 const R = S.realms[r]; if (!R || !R.ruler) return 'council';
 if (R.ruler.c) return 'council';
 if (r === 'empire') return 'emperor'; if (r === 'byzance') return 'basileus'; if (r === 'venise') return 'doge'; if (r === 'teutons') return 'master';
 if (['turcs', 'egypte', 'maghreb', 'ifriqiya', 'andalus'].includes(r)) return 'sultan'; if (r === 'horde') return 'khan';
 if (R.ruler.f) return 'queen';
 return 'king';
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rulerPortrait(r, w) {
 const R = S.realms[r]; const k = rulerKind(r);
 if (k === 'council') return councilSVG(r, w);
 return portraitSVG({ seed: hashStr(R.ruler.n + r), kind: k, age: R.ruler.a, w, female: !!R.ruler.f, bg: shade(REALMS[r].c, -0.25), robe: k === 'king' ? shade(REALMS[r].c, -0.3) : undefined });
}
function councilSVG(r, w) {
 const c = REALMS[r].c;
 return svgImg(`<svg viewBox="0 0 100 110" width="${w}" height="${w * 1.1}" aria-hidden="true"><rect x="2" y="2" width="96" height="106" rx="10" fill="${shade(c, -0.35)}"/><path d="M0 110V70H14V56H22V70H30V40L38 30L46 40V70H54V50H62V44H70V50H78V70H86V60H100V110Z" fill="${shade(c, -0.6)}"/><path d="M38 30V18M34 22H42" stroke="${OR}" stroke-width="2"/>${[34, 40, 58, 66].map(x => `<rect x="${x}" y="56" width="3" height="5" fill="#f2d680"/>`).join('')}<path d="M30 78H70L64 98H36Z" fill="${OR}" opacity=".85"/><text x="50" y="92" font-size="9" text-anchor="middle" fill="#3a2410" font-family="Cinzel,serif">SPQ</text><rect x="2" y="2" width="96" height="106" rx="10" fill="none" stroke="${OR}" stroke-width="2.5"/></svg>`, 'pimg');
}
function popePortrait(p, w) { return portraitSVG({ seed: p.seed || 7, kind: 'pope', age: p.age, w, bg: '#6b1414' }); }
function cardinalPortrait(c, w) { return portraitSVG({ seed: c.seed || c.id * 7919, kind: 'cardinal', age: c.age, w, bg: { italien: '#6a4a1a', francais: '#23365e', allemand: '#3a3a3a', espagnol: '#6a3a1a', anglais: '#5a1a1a' }[c.nat] || '#444' }); }

/* ---------- Scènes d’événements ---------- */
function sceneSVG(k, seed) {
 const id = 'sc' + (++_uid);
 const moods = { plague: ['#3b3a32', '#8a7f5c'], fire: ['#3a120a', '#d0642a'], miracle: ['#2c3f6e', '#f4d58a'], snow: ['#6f7f94', '#e8ecef'], star: ['#0d1430', '#3b3f74'], swords: ['#4a1a12', '#c9894a'] };
 const [sk1, sk2] = moods[k] || ['#4b6a8a', '#f0d9a0'];
 let s = `<svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk1}"/><stop offset="1" stop-color="${sk2}"/></linearGradient><radialGradient id="${id}r" cx=".5" cy=".9" r=".7"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs><rect width="600" height="200" fill="url(#${id})"/>`;
 const hill = (y, c) => `<path d="M0 ${y}C100 ${y - 30} 200 ${y + 10} 300 ${y - 15}C400 ${y - 40} 500 ${y} 600 ${y - 20}V200H0Z" fill="${c}"/>`;
 const ink = '#1d140c';
 const sil = (d) => `<path d="${d}" fill="${ink}"/>`;
 if (k === 'star') s += [...Array(40)].map((_, i) => `<circle cx="${(i * 137) % 600}" cy="${(i * 53) % 140}" r="${i % 5 ? 0.8 : 1.6}" fill="#fff" opacity=".8"/>`).join('') + `<path d="M420 40L180 120" stroke="#fff6d0" stroke-width="2" opacity=".5"/><path d="M420 40L200 112L210 124Z" fill="#fff6d0" opacity=".35"/><circle cx="424" cy="38" r="7" fill="#fffbe8"/>`;
 else if (k !== 'fire' && k !== 'plague') s += `<circle cx="470" cy="60" r="28" fill="#fff3c4" opacity=".55"/>`;
 if (k === 'miracle') s += [...Array(14)].map((_, i) => `<path d="M300 20L${i * 46 - 20} 200" stroke="#fff6cf" stroke-width="10" opacity=".12"/>`).join('') + `<ellipse cx="300" cy="30" rx="90" ry="22" fill="#fff" opacity=".35"/>`;
 s += hill(150, shade(sk2, -0.45)) + hill(175, shade(sk2, -0.62));
 const art = {
  church: sil('M230 170V100L260 70L290 100V170ZM290 170V110H360V170ZM300 110L325 86L350 110ZM255 70V40H265V70ZM258 30H262V40H258ZM250 34H270V37H250ZM380 170V60L392 40L404 60V170Z') + `<circle cx="260" cy="110" r="10" fill="#f2c96a" opacity=".8"/>`,
  crown: `<path d="M220 150L220 80L260 115L300 50L340 115L380 80L380 150Z" fill="${OR}" stroke="${ink}" stroke-width="4"/><rect x="215" y="140" width="170" height="22" fill="${shade(OR, -0.2)}" stroke="${ink}" stroke-width="4"/>${[240, 270, 300, 330, 360].map((x, i) => `<circle cx="${x}" cy="151" r="6" fill="${i % 2 ? '#2b6fb0' : GU}"/>`).join('')}`,
  swords: `<g stroke="${ink}" stroke-width="3"><path d="M200 50L390 170" stroke="#d8d4c8" stroke-width="9"/><path d="M400 50L210 170" stroke="#d8d4c8" stroke-width="9"/><path d="M215 72L245 44M385 72L355 44" stroke="${OR}" stroke-width="10"/></g>` + sil('M120 180L140 120L160 180ZM460 180L480 110L500 180Z'),
  ship: `<path d="M180 150H420L390 180H215Z" fill="#5a3a1e" stroke="${ink}" stroke-width="3"/><path d="M300 150V40" stroke="${ink}" stroke-width="5"/><path d="M300 45C360 60 370 110 300 140Z" fill="#efe6cf" stroke="${ink}" stroke-width="3"/><path d="M318 70H330V130H318ZM305 95H345V105H305Z" fill="${GU}"/><path d="M0 180Q50 170 100 180T200 180T300 180T400 180T500 180T600 180V200H0Z" fill="#2b4f6e"/>`,
  plague: sil('M80 180V150H86V130H80V126H96V130H90V150H96V180ZM180 180V155H184V140H180V137H190V140H186V155H190V180ZM420 180V150H426V130H420V126H436V130H430V150H436V180Z') + `<circle cx="300" cy="70" r="30" fill="#1a1a14" opacity=".75"/>` + sil('M280 180L300 120L320 180Z'),
  fire: [...Array(9)].map((_, i) => `<path d="M${80 + i * 55} 190C${70 + i * 55} 150 ${100 + i * 55} 130 ${90 + i * 55} ${90 + (i % 3) * 15}C${120 + i * 55} 120 ${125 + i * 55} 160 ${110 + i * 55} 190Z" fill="${i % 2 ? '#e8902e' : '#f4c04a'}" opacity=".85"/>`).join('') + sil('M200 180V120H230V100H250V180ZM330 180V90L350 70L370 90V180Z'),
  miracle: `<path d="M290 170V90H310V170Z M270 110H330V124H270Z" fill="${OR}" stroke="${ink}" stroke-width="3"/><circle cx="300" cy="78" r="26" fill="none" stroke="#fff4c0" stroke-width="4" opacity=".8"/>`,
  rome: sil('M60 170V120H130V170ZM70 120V105H120V120ZM150 170V110Q195 70 240 110V170ZM180 110V96H210V110ZM260 170V90H330V170ZM270 90L295 70L320 90ZM360 170V130Q400 100 440 130V170ZM380 120H420M470 170V100H520V170ZM480 100V90H510V100Z') + [...Array(8)].map((_, i) => `<path d="M${155 + i * 11} 170V140Q${160 + i * 11} 132 ${165 + i * 11} 140V170" fill="${sk2}" opacity=".6"/>`).join(''),
  scroll: `<path d="M200 60H400V150H200Z" fill="#efe2bf" stroke="${ink}" stroke-width="3"/><path d="M190 52Q200 40 210 52V160Q200 172 190 160ZM390 52Q400 40 410 52V160Q400 172 390 160Z" fill="#d9c58e" stroke="${ink}" stroke-width="3"/>${[80, 95, 110, 125].map(y => `<path d="M225 ${y}H375" stroke="#7a5a30" stroke-width="2.5" opacity=".7"/>`).join('')}<circle cx="300" cy="160" r="16" fill="${GU}" stroke="${ink}" stroke-width="3"/><path d="M290 170L285 192M310 170L315 192" stroke="${GU}" stroke-width="5"/>`,
  coins: [...Array(7)].map((_, i) => `<ellipse cx="${250 + (i % 3) * 50}" cy="${165 - Math.floor(i / 3) * 18}" rx="30" ry="9" fill="${OR}" stroke="${ink}" stroke-width="2.5"/>`).join('') + `<path d="M330 60Q380 40 400 80Q420 130 360 150Q300 150 310 100Q315 70 330 60Z" fill="#7a5a30" stroke="${ink}" stroke-width="3"/><path d="M335 62L350 50L365 62" stroke="${ink}" stroke-width="4" fill="none"/>`,
  tower: sil('M250 180V70L240 70V50H255V60H270V50H285V60H300V50H315V60H330V50H345V70H335V180ZM360 180V110H400V180ZM355 110V98H365V104H375V98H385V104H395V98H405V110Z') + `<rect x="285" y="100" width="12" height="20" rx="6" fill="#f2c96a" opacity=".8"/>`,
  book: `<path d="M180 80Q240 60 300 82Q360 60 420 80V170Q360 150 300 172Q240 150 180 170Z" fill="#efe2bf" stroke="${ink}" stroke-width="3"/><path d="M300 82V172" stroke="${ink}" stroke-width="3"/>${[100, 115, 130, 145].map(y => `<path d="M200 ${y}Q250 ${y - 8} 285 ${y}M315 ${y}Q350 ${y - 8} 400 ${y}" stroke="#7a5a30" stroke-width="2" fill="none" opacity=".7"/>`).join('')}<rect x="205" y="88" width="18" height="18" fill="${GU}"/>`,
  people: [...Array(16)].map((_, i) => { const x = 60 + i * 32 + (i % 2) * 6, h = 30 + (i * 7) % 18; return sil(`M${x} 190V${190 - h}Q${x + 8} ${180 - h} ${x + 16} ${190 - h}V190Z`) + `<circle cx="${x + 8}" cy="${178 - h}" r="7" fill="${ink}"/>`; }).join('') + `<path d="M290 120V40M276 56H304" stroke="${ink}" stroke-width="5"/>`,
  snow: [...Array(50)].map((_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 41) % 200}" r="${1 + i % 3}" fill="#fff" opacity=".85"/>`).join('') + sil('M380 180V80H400V60H420V80H440V180ZM230 190Q240 150 250 150Q260 150 262 190Z') + `<circle cx="246" cy="142" r="7" fill="${ink}"/>`,
  cross: `<path d="M292 175V60H308V175ZM270 85H330V100H270Z" fill="${ink}"/>` + sil('M0 190Q150 150 300 175Q450 150 600 190V200H0Z'),
  keys: `<g transform="translate(250 30) scale(1)">${key(-35, OR).replace(/50 60/g, '50 60')}${key(35, '#e8e6e0')}</g>`,
  star: `<path d="M0 190Q300 150 600 190V200H0Z" fill="${ink}"/>`,
  mitres: [...Array(11)].map((_, i) => { const x = 40 + i * 50, y = 150 + (i % 2) * 10; return `<path d="M${x} ${y}L${x + 6} ${y - 30}L${x + 14} ${y - 22}L${x + 22} ${y - 30}L${x + 28} ${y}Z" fill="#f3efe4" stroke="${ink}" stroke-width="2"/><path d="M${x + 14} ${y - 22}V${y}" stroke="${OR}" stroke-width="2.5"/><rect x="${x - 2}" y="${y}" width="32" height="40" fill="${i % 3 ? '#7a1a1a' : '#2b4f6e'}"/>`; }).join('') + `<path d="M270 120V40H330V120Z" fill="${OR}" stroke="${ink}" stroke-width="3"/><path d="M290 40Q300 20 310 40" fill="none" stroke="${ink}" stroke-width="3"/>`,
  horse: [...Array(6)].map((_, i) => { const x = 60 + i * 90, y = 160 - (i % 2) * 8; return `<path d="M${x} ${y}Q${x + 10} ${y - 30} ${x + 40} ${y - 28}L${x + 52} ${y - 44}L${x + 60} ${y - 36}L${x + 56} ${y - 22}Q${x + 60} ${y} ${x + 50} ${y}L${x + 52} ${y + 24}L${x + 46} ${y + 24}L${x + 42} ${y + 4}L${x + 14} ${y + 4}L${x + 8} ${y + 24}L${x + 2} ${y + 24}Z" fill="${ink}"/><path d="M${x + 28} ${y - 28}L${x + 30} ${y - 52}L${x + 38} ${y - 50}L${x + 36} ${y - 28}Z" fill="${ink}"/><circle cx="${x + 34}" cy="${y - 56}" r="5" fill="${ink}"/><path d="M${x + 40} ${y - 50}L${x + 70} ${y - 76}" stroke="${ink}" stroke-width="2.5"/>`; }).join('') + `<path d="M0 185Q300 170 600 185V200H0Z" fill="${ink}"/>`,
  procession: [...Array(14)].map((_, i) => { const x = 30 + i * 41, h = 34 + (i % 3) * 5; return `<path d="M${x} 190V${190 - h}Q${x + 9} ${180 - h} ${x + 18} ${190 - h}V190Z" fill="${i === 7 ? '#f3efe4' : i % 4 === 0 ? '#7a1a1a' : ink}" ${i === 7 ? `stroke="${ink}"` : ''}/><circle cx="${x + 9}" cy="${178 - h}" r="6" fill="${ink}"/>`; }).join('') + `<path d="M318 140V70M308 82H328" stroke="${OR}" stroke-width="4"/><path d="M180 150V60M180 60H210L205 72L210 84H180" fill="#a3171c" stroke="${ink}" stroke-width="2"/><path d="M440 150V60M440 60H470L465 72L470 84H440" fill="#f2d680" stroke="${ink}" stroke-width="2"/>`,
  conclave: `<path d="M150 190V80L300 30L450 80V190Z" fill="#3a2a1a"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${170 + i * 45} 190V110Q${185 + i * 45} 90 ${200 + i * 45} 110V190Z" fill="#a3171c" opacity=".85"/>`).join('')}<path d="M420 40V0" stroke="#6a5a4a" stroke-width="14"/><circle cx="420" cy="-6" r="16" fill="#f8f6ee" opacity=".9"/><circle cx="440" cy="-24" r="22" fill="#f8f6ee" opacity=".7"/>`
 };
 s += art[k] || art.church;
 s += `<rect width="600" height="200" fill="url(#${id}r)"/></svg>`;
 return s;
}

/* ---------- Panorama de Rome ---------- */
function romePanorama() {
 const B = S.build, st = k => B[k] === true ? 'done' : typeof B[k] === 'number' ? 'wip' : 'none';
 const g = (k, inner) => `<g class="rb rb-${st(k)}" data-b="${k}"><title>${BUILDINGS[k].n}</title>${inner}${st(k) === 'wip' ? scaffold(k) : ''}</g>`;
 const ink = '#2a1a0c';
 function scaffold(k) { const box = { chancellerie: [420, 92, 70, 50], saintange: [150, 88, 70, 60], hopital: [210, 120, 70, 30], aqueduc: [500, 80, 100, 50], basilique: [60, 78, 80, 70], studium: [330, 96, 50, 50], bibliotheque: [380, 110, 40, 40], ostie: [0, 140, 60, 40], rocca: [530, 30, 60, 40], chapelle: [110, 70, 30, 40] }[k]; if (!box) return ''; const [x, y, w, h] = box; let p = ''; for (let i = 0; i <= w; i += 10) p += `M${x + i} ${y}V${y + h}`; for (let j = 0; j <= h; j += 10) p += `M${x} ${y + j}H${x + w}`; return `<path d="${p}" stroke="#8a5a20" stroke-width="1.4" opacity=".9"/>`; }
 const SK = [['#a9c4d6', '#f2e6bc'], ['#8fb3d6', '#f6dc9a'], ['#c99a6a', '#f0c98a'], ['#9aa6b4', '#e4e2da']][S.season];
 let s = `<svg viewBox="0 0 600 220" width="100%" class="rome-pan" aria-label="Panorama de Rome"><defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SK[0]}"/><stop offset=".7" stop-color="${SK[1]}"/><stop offset="1" stop-color="#e8c98a"/></linearGradient></defs><rect width="600" height="220" fill="url(#rsky)"/>
 <circle cx="${S.season === 3 ? 470 : 520}" cy="${S.season === 3 ? 60 : 40}" r="16" fill="#fff6d0" opacity=".8"/>
 <g class="clouds" opacity=".75"><g class="cl1"><ellipse cx="80" cy="34" rx="34" ry="9" fill="#fff"/><ellipse cx="102" cy="28" rx="20" ry="9" fill="#fff"/></g><g class="cl2"><ellipse cx="360" cy="22" rx="40" ry="8" fill="#fff"/><ellipse cx="384" cy="17" rx="22" ry="8" fill="#fff"/></g></g>
 <g class="birds" fill="none" stroke="#3a2a1a" stroke-width="1.2"><path d="M200 50q5 -5 10 0q5 -5 10 0"/><path d="M226 42q4 -4 8 0q4 -4 8 0"/><path d="M214 60q3 -3 6 0q3 -3 6 0"/></g>`;
 s += `<path d="M0 120C80 80 160 110 240 90C320 70 400 100 480 76C540 60 580 70 600 66V220H0Z" fill="#b9a678" opacity=".7"/>`;
 s += g('rocca', `<path d="M530 66V44H538V38H546V44H556V38H564V44H572V66Z M575 70V52H583V48H590V52H596V70Z" fill="#8a7650" stroke="${ink}" stroke-width="1.2"/><path d="M551 38V28L560 31L551 34" fill="${GU}"/>`);
 s += `<path d="M0 150C60 140 120 160 200 150C300 138 400 160 600 150V220H0Z" fill="#cdb68a"/>`;
 // Tibre
 s += `<path d="M0 190C80 176 120 160 180 170C230 178 250 200 300 196C360 192 400 172 470 182C520 190 560 200 600 196V220H0Z" fill="#6c8ea6" opacity=".9"/><path d="M20 196C80 186 140 176 200 186M320 204C380 198 440 188 520 198" stroke="#cfe0ea" stroke-width="1.3" fill="none" opacity=".7"/>`;
 s += g('ostie', `<path d="M4 178H56L50 188H10Z" fill="#5a3a1e" stroke="${ink}"/><path d="M30 178V146M30 150C44 156 44 170 30 174Z" fill="#efe6cf" stroke="${ink}"/><path d="M8 176V160H20V176" fill="#9c845a" stroke="${ink}"/>`);
 // Saint-Pierre (ancienne basilique)
 s += `<path d="M60 148V100L100 80L140 100V148Z" fill="#e7d8b4" stroke="${ink}" stroke-width="1.4"/><path d="M72 148V122H88V148ZM112 148V122H128V148Z" fill="#a8946a"/><path d="M96 148V112H104V148Z" fill="#6b4a2a"/>`;
 s += g('basilique', `<path d="M66 100L100 83L134 100Z" fill="${OR}" opacity=".95"/><path d="M76 118H124" stroke="${OR}" stroke-width="5"/><circle cx="100" cy="98" r="5" fill="#2b4f9c"/><path d="M60 100L100 80L140 100" stroke="#fff3c4" stroke-width="2" fill="none"/>`);
 s += g('chapelle', `<path d="M112 98V76H136V98Z" fill="#e2d2aa" stroke="${ink}"/><path d="M110 76L124 66L138 76Z" fill="#a7552e" stroke="${ink}"/><path d="M118 84H130" stroke="#2b4f9c" stroke-width="3"/>`);
 // Château Saint-Ange
 s += `<path d="M160 168V120H210V168Z" fill="#c4ad82" stroke="${ink}" stroke-width="1.4"/><ellipse cx="185" cy="120" rx="25" ry="7" fill="#b39d72" stroke="${ink}"/>`;
 s += g('saintange', `<path d="M152 168V128H158V122H164V128H170V122H176V128H194V122H200V128H206V122H212V128H218V168Z" fill="#a8926a" stroke="${ink}" stroke-width="1.2"/><path d="M182 120V92H188V120Z" fill="#9c865c" stroke="${ink}"/><path d="M185 92L180 86L185 80L190 86Z" fill="#e8e6e0"/><path d="M188 96L200 92L188 88" fill="${GU}"/>`);
 s += `<path d="M210 172H270" stroke="#a8946a" stroke-width="6"/>${[220, 235, 250, 262].map(x => `<path d="M${x} 176Q${x + 5} 168 ${x + 10} 176" stroke="#6c8ea6" stroke-width="3" fill="none"/>`).join('')}`;
 s += g('hopital', `<path d="M214 150V124H278V150Z" fill="#e4d4ae" stroke="${ink}" stroke-width="1.2"/><path d="M212 124L246 112L280 124Z" fill="#a7552e" stroke="${ink}"/><path d="M243 128H249V146H243ZM238 134H254V139H238Z" fill="${GU}"/>`);
 // Panthéon & Colisée
 s += `<path d="M290 150V128H330V150Z" fill="#cdbb92" stroke="${ink}"/><path d="M288 128Q310 104 332 128Z" fill="#bca984" stroke="${ink}"/>`;
 s += g('studium', `<path d="M336 150V108H376V150Z" fill="#e2d2aa" stroke="${ink}" stroke-width="1.2"/><path d="M350 108V96H362V108Z" fill="#d1bf96" stroke="${ink}"/><path d="M348 96L356 88L364 96Z" fill="#a7552e"/>${[342, 352, 362].map(x => `<rect x="${x}" y="118" width="6" height="10" rx="3" fill="#6b4a2a"/>`).join('')}`);
 s += g('bibliotheque', `<path d="M382 150V122H418V150Z" fill="#e7d8b4" stroke="${ink}" stroke-width="1.2"/><path d="M380 122Q400 104 420 122Z" fill="#8a9a9c" stroke="${ink}"/><path d="M392 134H408M392 140H408" stroke="#6b4a2a" stroke-width="2"/>`);
 s += `<g><ellipse cx="460" cy="150" rx="36" ry="10" fill="#bba67c"/><path d="M424 150V118Q460 104 496 118V150" fill="#c9b48a" stroke="${ink}"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${430 + i * 11} 150V130Q${435 + i * 11} 124 ${440 + i * 11} 130V150" fill="#8f7a52"/>`).join('')}</g>`;
 s += g('chancellerie', `<path d="M420 116V96H490V116Z" fill="#ead9b0" stroke="${ink}" stroke-width="1.2"/><path d="M418 96L455 84L492 96Z" fill="#a7552e" stroke="${ink}"/>${[430, 444, 458, 472].map(x => `<rect x="${x}" y="100" width="6" height="9" fill="#6b4a2a"/>`).join('')}<path d="M484 84V70L496 74L484 78" fill="${OR}" stroke="${ink}" stroke-width=".6"/>`);
 // Latran
 s += `<path d="M500 150V112H560V150Z" fill="#e2d2aa" stroke="${ink}" stroke-width="1.4"/><path d="M498 112L530 96L562 112Z" fill="#a7552e" stroke="${ink}"/><path d="M566 150V86H576V150Z" fill="#cdb68a" stroke="${ink}"/><path d="M564 86L571 74L578 86Z" fill="#a7552e"/>`;
 s += g('aqueduc', `${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${490 + i * 12} 92V76H${502 + i * 12}V92Q${496 + i * 12} 84 ${490 + i * 12} 92Z" fill="#b8a27a" stroke="${ink}" stroke-width=".7"/>`).join('')}<path d="M490 76H598" stroke="#6c8ea6" stroke-width="3"/>`);
 // Murs d’Aurélien
 s += `<path d="M0 160H600" stroke="#9c845a" stroke-width="4" stroke-dasharray="14 4"/>`;
 if (S.curia !== 'rome') s += `<rect width="600" height="220" fill="#2a1a0c" opacity=".35"/><text x="300" y="40" text-anchor="middle" font-family="Cinzel,serif" font-size="18" fill="#f4e6c4">${S.curia === 'avignon' ? 'LA CURIE RÉSIDE EN AVIGNON' : 'LA CURIE EST EN EXIL'}</text>`;
 if (S.season === 3) s += [...Array(40)].map((_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 53) % 200}" r="1.4" fill="#fff" opacity=".8"/>`).join('');
 if (S.jubilee > 0) s += [...Array(30)].map((_, i) => `<circle cx="${20 + i * 19}" cy="${198 - (i % 3) * 3}" r="2.5" fill="#3a2410"/>`).join('');
 s += `</svg>`;
 return s;
}

/* ---------- Icônes ---------- */
const ICON = {
 crown: '<svg viewBox="0 0 24 24"><path d="M4 18L3 8l5 4 4-7 4 7 5-4-1 10Z" fill="#e2b53e" stroke="#6b4a10" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.5 20.5h15" stroke="#6b4a10" stroke-width="2"/><circle cx="12" cy="14" r="1.6" fill="#a8322a"/></svg>',
 coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e2b53e" stroke="#6b4a10" stroke-width="1.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#6b4a10" stroke-width="1"/><path d="M12 8v8M9 12h6" stroke="#6b4a10" stroke-width="1.4"/></svg>',
 auth: '<svg viewBox="0 0 24 24"><path d="M12 21C7 21 6.5 15 7 11C7.6 6 10 3 12 2.5C14 3 16.4 6 17 11C17.5 15 17 21 12 21Z" fill="#f6efdc" stroke="#8a6a20" stroke-width="1.2"/><path d="M7.4 17Q12 18.6 16.6 17M7.2 13Q12 14.6 16.8 13M8.4 9Q12 10.2 15.6 9" stroke="#e2b53e" stroke-width="1.6" fill="none"/></svg>',
 fervor: '<svg viewBox="0 0 24 24"><rect x="9.5" y="11" width="5" height="11" rx="1" fill="#f3ead2" stroke="#8a6a20"/><path d="M12 2C15 6 15.5 8.5 12 10.5C8.5 8.5 9 6 12 2Z" fill="#f0a030" stroke="#a04010" stroke-width=".8"/></svg>',
 curia: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="10" ry="3.2" fill="#b51d24" stroke="#4a0a0a"/><path d="M6.5 14.5C6.5 8 17.5 8 17.5 14.5Z" fill="#c4242b" stroke="#4a0a0a"/><path d="M4 16.5L2.5 22M20 16.5L21.5 22" stroke="#b51d24" stroke-width="1.2"/></svg>',
 corr: '<svg viewBox="0 0 24 24"><path d="M7 8Q12 5 17 8L19 18Q12 22 5 18Z" fill="#7a5a30" stroke="#3a2410"/><path d="M9 8L12 4L15 8" stroke="#3a2410" stroke-width="1.5" fill="none"/><path d="M8 15Q10 12 12 15T16 15" stroke="#9ac46a" stroke-width="1.6" fill="none"/></svg>',
 rome: '<svg viewBox="0 0 24 24"><path d="M3 21V11H6V8H9V11H11V5H13V11H15V8H18V11H21V21Z" fill="#c9b48a" stroke="#3a2410"/><path d="M10 21V16Q12 14 14 16V21" fill="#3a2410"/></svg>',
 seal: '<svg viewBox="0 0 24 24"><path d="M12 1.5C14 2.8 15.5 2 17 3.4C18.4 4.6 19.8 4.8 20.6 6.7C21.2 8.4 22.6 9.6 22.3 11.9C22 14 22.6 15.3 21.3 17.1C20.1 18.6 19.8 20.2 17.8 21C16 21.7 14.3 22.6 12 22.4C9.6 22.5 8.2 21.8 6.3 21C4.4 20.1 3.9 18.6 2.8 17C1.6 15.3 1.9 13.8 1.7 12C1.5 9.8 2.6 8.6 3.3 6.8C4.1 5 5.7 4.7 7 3.4C8.5 2.1 10 2.7 12 1.5Z" fill="#a3171c" stroke="#4a0a0a"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#e8a0a0" stroke-width=".9" opacity=".8"/><path d="M11 7.5H13V16.5H11ZM8.6 10H15.4V12H8.6Z" fill="#f6d2c4"/></svg>',
 sealE: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#a3171c" stroke-width="1.4" stroke-dasharray="2 2"/></svg>',
 army: '<svg viewBox="0 0 24 24"><path d="M5 20L18 4M19 20L6 4" stroke="#cfcac0" stroke-width="2.5"/><path d="M7 15L4 18M17 15L20 18" stroke="#e2b53e" stroke-width="3"/></svg>',
 health: '<svg viewBox="0 0 24 24"><path d="M12 21C5 15 3 12 3 8.5A4.5 4.5 0 0 1 12 6A4.5 4.5 0 0 1 21 8.5C21 12 19 15 12 21Z" fill="#b5332b" stroke="#4a0a0a"/></svg>',
 heresy: '<svg viewBox="0 0 24 24"><path d="M12 2C17 8 18 12 15 16C16 13 14 11 12 9C11 13 7 14 9 18C5 15 6 9 12 2Z" fill="#e2702a" stroke="#7a2a0a"/><path d="M7 20H17" stroke="#3a2410" stroke-width="2"/></svg>'
};
