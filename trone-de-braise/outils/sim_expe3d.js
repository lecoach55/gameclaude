// Expéditions du donjon 3D au tour par tour (moteur repris de Valdragon) jouées par un robot.
// node sim_expe3d.js niveau N [etages] [combat]
// Mesure : réussite, or et niveaux gagnés, objets rapportés — pour caler les conversions avec le Trône de Braise.
const fs = require('fs'), path = require('path');
new Function(fs.readFileSync(path.join(__dirname, '../donjon3d/src/core.js'), 'utf8'))();
const VD = globalThis.VD;
const T = require(path.join(__dirname, '../donjon3d/pont.js'));
const [niv = 5, N = 20, etages = 3, combat = ''] = process.argv.slice(2);
const alive = a => a.filter(u => !u.dead);
const MIST = +(process.env.MIST || .08);
function bestT(foes) { const ch = foes.filter(f => f.charge); if (ch.length) return ch[0]; const sh = foes.filter(f => f.k === 'ch'); if (sh.length) return sh[0]; return foes.slice().sort((a, b) => a.hp - b.hp)[0]; }
function choose(h) {
 const B = VD.B, P = VD.P, foes = alive(B.foes), hs = alive(P.heroes), fi = f => B.foes.indexOf(f), hi = x => P.heroes.indexOf(x);
 const can = k => VD.canUse(h, k); const low = hs.slice().sort((a, b) => a.hp / a.s.mhp - b.hp / b.s.mhp)[0], lr = low.hp / low.s.mhp;
 const bigAoe = foes.some(f => f.intent && f.intent.aoe && f.charge && f.intent.m > 1); const boss = foes.find(f => f.boss);
 if (Math.random() < MIST) { const ks = VD.skillsOf(h).filter(can); const k = ks[Math.floor(Math.random() * ks.length)]; const s = VD.SK[k]; return [k, s.tg === 'ally' ? hi(low) : fi(foes[Math.floor(Math.random() * foes.length)])]; }
 const dead = P.heroes.find(x => x.dead); if (dead && P.pot.phenix > 0 && (B.boss || hs.length <= 1)) return ['item:phenix', hi(dead)];
 if (h.cls === 'mage' && lr < .45 && can('soin')) return ['soin', hi(low)];
 if (lr < .3 && P.pot.soin > 0) return ['item:soin', hi(low)];
 const t = bestT(foes);
 if (h.cls === 'guerrier') { if (bigAoe && can('rempart')) return ['rempart']; if (foes.length >= 3 && can('fendoir')) return ['fendoir']; const ex = foes.find(f => f.hp / f.mhp < .3); if (can('execution') && (ex || boss)) return ['execution', fi(ex || boss)]; return ['frappe', fi(t)]; }
 if (h.cls === 'mage') { const ch = foes.find(f => f.charge && !f.boss); if (ch && can('givre')) return ['givre', fi(ch)]; if (bigAoe && can('barriere')) return ['barriere', hi(low)]; if (foes.length >= 3 && can('feu')) return ['feu']; if (lr < .65 && can('soin') && h.en > 45) return ['soin', hi(low)]; if (can('meteore') && foes.length >= 2) return ['meteore']; return ['trait', fi(t)]; }
 if (boss && !boss.st.mark && can('marque')) return ['marque', fi(boss)]; if (foes.length >= 3 && can('volee')) return ['volee'];
 if (can('fatal')) return ['fatal', fi(boss || foes.slice().sort((a, b) => b.hp - a.hp)[0])]; return ['tir', fi(t)];
}
function battle() { const B = VD.B; let n = 0; while (!B.over && n < 3000) { n++; if (B.wait === 'hero') { const [k, ti] = choose(B.cur); if (!VD.heroAct(k, ti || 0)) VD.heroAct(B.cur.cls === 'guerrier' ? 'frappe' : B.cur.cls === 'mage' ? 'trait' : 'tir', VD.B.foes.indexOf(alive(VD.B.foes)[0])); } else if (B.wait === 'foe') VD.foeTurn(); else break; } return B.over; }
function manage() { const P = VD.P; for (const h of P.heroes) for (const it of P.bag.slice()) if (VD.canEquip(h, it) && VD.power(it) > VD.power(h.eq[it.s]) * 1.03) VD.equip(h, it);
 const order = [['guerrier', 'fendoir'], ['mage', 'feu'], ['rodeuse', 'volee'], ['mage', 'soin'], ['guerrier', 'frappe'], ['rodeuse', 'tir']]; let i = 0;
 while (P.heroes.some(h => h.spts > 0) && i < 80) { const [c, k] = order[i % order.length]; const h = P.heroes.find(h => h.cls === c); if (h) VD.talent(h, k); i++; } VD.calcAll(); }
// héros du Trône de Braise fictif, équipement magique du même niveau (comme sim_donjon « magique »)
function herosTdB(n) { return { classe: 'chevalier', nom: 'Héros', niveau: n, xp: 0, equip: { arme: { rar: 'magique', dmin: 6 + n * 1.6, dmax: 10 + n * 2.6, arme: 'epee' }, armure: { rar: 'magique', armure: 4 + n }, amulette: { rar: 'magique', stats: { pv: 10 + n * 3 } } } }; }
const r = { v: 0, m: 0, f: 0, or: [], dl: [], obj: [], comb: [], t: [] };
for (let s = 0; s < +N; s++) {
 let a = s * 7919 + 13; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
 const h = herosTdB(+niv);
 const cfg = T.configExpedition({ heros: h, compagnon: s % 2 ? { type: 'pretresse', nom: 'Alix' } : null, type: ['crypte', 'foret', 'mine', 'glace'][s % 4], niveau: +niv, etages: +etages, arene: combat ? { n: 8 } : null });
 VD.lancerExpedition(cfg); VD.ev.length = 0; let res = null, nb = 0;
 if (VD.B) { nb++; const o = battle(); res = o === 'win' ? 'victoire' : 'mort'; }
 while (!res) {
  manage();
  const targets = [...VD.obj.filter(o => o.t !== 'brk'), ...VD.E.filter(e => !e.boss)].sort(() => Math.random() - .5); const boss = VD.E.find(e => e.boss); if (boss) targets.push(boss);
  for (const t of targets) { if (t.pack && !VD.E.includes(t)) continue; if (!t.pack && (t.used || !VD.obj.includes(t))) continue; VD.P.x = t.x; VD.P.y = t.y + (t.boss ? 1 : 0);
   let k = 0; while (!VD.B && k < 5) { VD.step(.016, {}); k++; } VD.ev.length = 0;
   if (VD.B) { nb++; const o = battle(); VD.ev.length = 0; if (o === 'lose') { res = 'mort'; (r.ou = r.ou || []).push((VD.F - cfg.F0) + (t.boss ? 'B' : t.elite ? 'e' : '') + ':' + VD.P.heroes.map(x => x.lvl).join('')); break; } VD.closeBattle(); } }
  if (res) break;
  if (VD.F >= VD.expe.dernier && !VD.bossAlive) { res = 'victoire'; break; }
  if (!VD.bossAlive) VD.descend();
 }
 const b = VD.bilanExpedition(res); const X = T.versTdB(b, h, cfg);
 r[res === 'victoire' ? 'v' : 'm']++; r.or.push(X.sacOr); r.dl.push(X.xpGagne / (600 + 500 * +niv)); r.obj.push(X.butin.length); r.comb.push(nb);
}
const moy = a => (a.reduce((x, y) => x + y, 0) / a.length);
console.log(`niveau ${niv}${combat ? ' combat' : ''} : réussite ${r.v}/${N} · or ${Math.round(moy(r.or))} · niveaux TdB +${moy(r.dl).toFixed(2)} · objets ${moy(r.obj).toFixed(1)} · combats ${moy(r.comb).toFixed(1)} · morts ${(r.ou||[]).join(" ")}`);
