"use strict";
// ===================== Données =====================
const NT = TERR.length, MAX_ROUNDS = 30, DOMINATION = 21;
const PCOL = [   // palette recalée pour le lavis (revue artistique du 16/11) : Azur en indigo, teintes moins saturées
  // w / o : couleur et densité du lavis sur la carte (le bleu sur papier beige vire au gris : lavis plus soutenu)
  { c: "#b8463a", d: "#7a241c", l: "#e4a090", o: .42 },
  { c: "#2f4f8a", d: "#172f5c", l: "#9fb2d8", w: "#2a55a6", o: .6 },
  { c: "#3e7a4e", d: "#1f4a2c", l: "#9ccaa8", w: "#3a7d48", o: .48 },
  { c: "#c49a2c", d: "#7f5d0e", l: "#ecd08a", o: .45 },
  { c: "#6b3f86", d: "#3f2156", l: "#c1a6dc", o: .52 },
];
// partitions héraldiques : distinguent les Maisons sans dépendre de la couleur
const CHARGES = [
  "M-13,4 L0,-6 L13,4",            // chevron
  "M-13,-4.5 H13",                 // fasce
  "M-13,-14 L13,10",               // bande
  "M0,-14 V16",                    // pal
  "M-13,-14 L13,10 M13,-14 L-13,10" // sautoir
];
const SHIELD = "M-12,-13 H12 V-1 Q12,10 0,15.5 Q-12,10 -12,-1Z";
function shieldSVG(o, size = 18) { return shieldCol(o < 0 ? -1 : P(o).color, size); }
function shieldCol(ci, size = 18) {
  const c = ci < 0 ? NEUTRAL : PCOL[ci], ch = ci < 0 ? "" : CHARGES[ci];
  const id = "sc" + Math.random().toString(36).slice(2, 8);
  return `<svg class="shieldI" width="${size}" height="${size * 1.2}" viewBox="-14 -15 28 33" aria-hidden="true"><clipPath id="${id}"><path d="${SHIELD}"/></clipPath><path d="${SHIELD}" fill="${c.c}" stroke="#e9cf8a" stroke-width="1.6"/><path d="${ch}" stroke="${c.l}" stroke-width="4.5" fill="none" clip-path="url(#${id})" opacity=".85"/><path d="${SHIELD}" fill="none" stroke="#24180c" stroke-width=".6"/></svg>`;
}
const NEUTRAL = { c: "#d9caa6", d: "#665c4c", l: "#d6c9aa" };
const HOUSES = ["Maison Vermeil", "Maison Azur", "Maison Sinople", "Maison d'Or", "Maison Pourpre"];
const START_ARMIES = { 2: 26, 3: 23, 4: 20, 5: 17 };
const COST = { ordre: 3, propagande: 2, mercenaires: (typeof window !== "undefined" && window.__RULES && window.__RULES.mercCost) || 3, soudoyer: 4, revolte: 2, pacte: 1 };
const EDICTS = [
  { id: "treve", name: "Trêve des Couronnes", d: "Pendant le tour suivant, aucune capitale ne peut être attaquée ni soudoyée." },
  { id: "impot", name: "Impôt de guerre", d: "Au tour suivant, chaque Maison reçoit +3 armées de renfort, mais le peuple gronde : −1 stabilité pour toutes dès l'adoption." },
  { id: "embargo", name: "Embargo contre l'Hégémon", d: "La Maison qui possède le plus de territoires au moment du vote perd 3 armées de renfort et 1 influence au tour suivant." },
  { id: "amnistie", name: "Grande Amnistie", d: "Immédiat : toutes les Maisons gagnent +2 stabilité." },
  { id: "martiale", name: "Loi martiale", d: "Au tour suivant, les défenseurs ajoutent +1 à leur meilleur dé." },
  { id: "conquete", name: "Droit de conquête", d: "Au tour suivant, les attaquants ajoutent +1 à leur meilleur dé." },
  { id: "marchands", name: "Concile des marchands", d: "Immédiat : toutes les Maisons gagnent +2 influence, sauf la plus riche en influence, qui n'en reçoit pas." },
  { id: "levee", name: "Levée en masse", d: "Au tour suivant, chaque Maison qui ne contrôle aucune région entière reçoit +3 armées de renfort." },
  { id: "censure", name: "Censure impériale", d: "Au tour suivant, Soudoyer et Fomenter une révolte sont interdits." },
];
// variantes de règles testables par le simulateur
const RULES = Object.assign({ infPer: 0, sacreAvg: false, butinPer: false, mercStab: 1, rep: true }, (typeof window !== "undefined" && window.__RULES) || {});
const MERC_N = RULES.mercArmies || 3;
const CROWN_INF = RULES.crownInf || 13, CROWN_STAB = 8, CROWN_HOLD = RULES.crownHold || 6, CROWN_COST = RULES.crownCost || 9;
const PHASES = ["politique", "renforts", "attaque", "manoeuvre"];
const PHASE_LBL = { politique: "Politique", renforts: "Renforts", attaque: "Attaque", manoeuvre: "Manœuvre" };

let S = null;
const $ = id => document.getElementById(id);
const rnd = n => Math.floor(Math.random() * n);
const d6 = () => 1 + rnd(6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const speed = () => +$("speed").value;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ===================== Outils d'état =====================
const P = i => S.players[i];
const cur = () => S.players[S.cur];
const col = o => o < 0 ? NEUTRAL : PCOL[P(o).color];
const pname = o => o < 0 ? "Rebelles" : P(o).name;
const ownedBy = o => S.t.map((t, i) => t.o === o ? i : -1).filter(i => i >= 0);
const armiesOf = o => S.t.reduce((s, t) => s + (t.o === o ? t.a : 0), 0);
const capitalOf = t => S.players.findIndex(p => p.alive && p.capital === t);
const regionsOf = o => REGIONS.map((r, ri) => ri).filter(ri => TERR.every((t, i) => t.r !== ri || S.t[i].o === o));
const edictOn = id => S.active && S.active.id === id && S.active.round === S.round;
const pactBetween = (a, b) => a >= 0 && b >= 0 && S.pacts.some(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
const pactsOf = o => S.pacts.filter(p => p.a === o || p.b === o);
const alive = () => S.players.map((p, i) => i).filter(i => P(i).alive);
const strength = o => ownedBy(o).length + armiesOf(o) / 3;
const leader = () => alive().sort((a, b) => ownedBy(b).length - ownedBy(a).length || armiesOf(b) - armiesOf(a))[0];
const smallest = () => alive().sort((a, b) => ownedBy(a).length - ownedBy(b).length || armiesOf(a) - armiesOf(b))[0];

function log(html, cls) {
  if (S.players) S.players.forEach(p => { const n = esc(p.name); html = html.split(n).join(`<span style="color:${PCOL[p.color].l};font-weight:600">${n}</span>`); });
  S.logN = (S.logN || 0) + 1;
  S.log.push({ html, cls, n: S.logN });
  if (S.log.length > 150) S.log.shift();
}

function baseIncome(o) {
  const n = ownedBy(o).length;
  let base = Math.max(3, Math.floor(n / 3));
  if (edictOn("levee") && !regionsOf(o).length) base += 3;
  let tot = base + regionsOf(o).reduce((s, ri) => s + REGIONS[ri].bonus, 0);
  if (edictOn("impot")) tot += 3;
  if (edictOn("embargo") && S.active.target === o) tot -= 3;
  // handicap de l'IA « f4 » (candidate facile) : renforts réduits
  if (P(o).ai && P(o).lvl === "facile") tot = Math.max(2, Math.floor(tot * .7));
  return Math.max(1, tot);
}
function influenceIncome(o) {
  const p = P(o);
  if (RULES.infTerr) {
    let w = Math.floor(ownedBy(o).length / RULES.infTerr) + pactsOf(o).length + (p.stab >= 8 ? 1 : 0) + (S.t[p.capital].o === o ? 1 : 0);
    if (edictOn("embargo") && S.active.target === o) w -= 1;
    return Math.max(0, w);
  }
  let v = 1;
  if (S.t[p.capital].o === o) v += 1;
  v += pactsOf(o).length;
  if (p.stab >= 8) v += 1;
  if (regionsOf(o).length) v += 1;
  if (RULES.infPer) v += Math.floor(ownedBy(o).length / RULES.infPer);
  if (edictOn("embargo") && S.active.target === o) v -= 1;
  return Math.max(0, v);
}

// ===================== Nouvelle partie =====================
function newGame(cfg) {
  S = {
    players: cfg.map((c, i) => ({ name: c.name, ai: c.ai, lvl: (c.lvl || "normal").split("+")[0], pv: (c.lvl || "").split("+")[1] || "", color: c.color, alive: true, inf: 2, stab: 6, capital: -1, lost: false })),
    t: TERR.map(() => ({ o: -1, a: 2 })), cur: 0, round: 1, phase: "politique", reinf: 0, step: 1,
    sel: -1, tgt: -1, mode: null, pending: null, conq: 0, moved: false,
    used: {}, votes: {}, edict: null, lastEdict: null, active: null, pacts: [], log: [], over: false, busy: false, tray: null,
  };
  const np = cfg.length, order = shuffle([...Array(NT).keys()]);
  const neutral = np === 2 ? 8 : 0;
  order.forEach((ti, k) => {
    if (k < neutral) { S.t[ti] = { o: -1, a: 3 }; return; }
    S.t[ti] = { o: (k - neutral) % np, a: 1 };
  });
  S.players.forEach((p, i) => {
    const mine = ownedBy(i);
    // capitale : le territoire le plus « intérieur »
    mine.sort((x, y) => ADJ[y].filter(j => S.t[j].o === i).length - ADJ[x].filter(j => S.t[j].o === i).length);
    p.capital = mine[0];
    S.t[p.capital].a += 2;
    // compensation de l'ordre de jeu : chaque siège après le premier reçoit des armées en plus
    let left = START_ARMIES[np] - mine.length - 2 + i * (np === 2 ? (RULES.duelBonus ?? 4) : 2);
    while (left-- > 0) {
      const border = mine.filter(t => ADJ[t].some(j => S.t[j].o !== i));
      const pool = border.length ? border : mine;
      S.t[pool[rnd(pool.length)]].a++;
    }
  });
  S.edict = drawEdict();
  log(`<span class="r">Manche 1</span>`);
  log(`Le Conseil des Couronnes examine : <b>${S.edict.name}</b>.`);
  render();
  focusStart();
  tokEls.forEach((g, i) => { g.style.setProperty("--d", (MAP.centers[i][0] + MAP.centers[i][1]) * .9 + "ms"); g.classList.add("enter"); });
  setTimeout(() => tokEls.forEach(g => g.classList.remove("enter")), 2200);
  startTurn();
}
function drawEdict() {
  const pool = EDICTS.filter(e => !S.lastEdict || e.id !== S.lastEdict);
  const e = pool[rnd(pool.length)];
  S.lastEdict = e.id;
  return e;
}

// ===================== Déroulement =====================
async function startTurn() {
  if (S.over) return;
  const o = S.cur, p = cur();
  S.phase = "politique"; S.sel = S.tgt = -1; S.mode = null; S.pending = null; S.conq = 0; S.moved = false;
  S.used = { propagande: 0, mercenaires: 0, soudoyer: 0, revolte: 0, pacte: 0 };
  S.turnStart = (S.logN || 0) + 1;
  log(`<b>${esc(p.name)}</b> prend la main.`);
  // sacre : la proclamation faite une manche plus tôt aboutit-elle ?
  if (S.claim && S.claim.o === o) {
    const holds = S.t[p.capital].o === o, ok = holds && p.stab >= CROWN_HOLD;
    S.claim = null;
    if (ok) return victory(o, "politique", `${esc(p.name)} a tenu sa capitale et gardé son peuple derrière elle pendant toute une manche après sa proclamation. Elle est sacrée souveraine de Valdorre.`);
    p.stab = clamp(p.stab - 1, 0, 10);
    log(`👑 Le sacre de ${esc(p.name)} échoue : ${holds ? "son peuple a vacillé" : "sa capitale est tombée"}.`, "warn");
    render();
    if (S.players.some(q => q.alive && !q.ai)) await modal(`<h2>Le sacre est empêché</h2><p>${esc(p.name)} ${holds ? `n'a plus que ${p.stab + 1} de stabilité, sous le seuil de ${CROWN_HOLD}` : "a perdu sa capitale"} : la proclamation tombe. Les ${CROWN_COST} influence de la proclamation sont perdues et sa stabilité baisse de 1.</p>`, [["Continuer", true, "primary"]]);
    if (S.over) return;
  }
  if (!p.lost && p.stab < 7) { p.stab++; log(`Aucune perte : stabilité +1 (${p.stab}).`); }
  p.lost = false;
  const inc = influenceIncome(o);
  p.inf += inc;
  log(`Revenu politique : +${inc} influence (${p.inf}).`);
  // victoire politique
  if (!S.claim && S.t[p.capital].o === o && p.stab >= CROWN_STAB && p.inf >= CROWN_INF && sacreTerrOk(o)) {
    const claim = p.ai ? true : await modal(`<h2>Proclamer ta souveraineté ?</h2><p>Tu tiens ta capitale avec ${p.stab} de stabilité et ${p.inf} influence. La proclamation coûte <b>${CROWN_COST} influence</b>.</p><p>Toutes les Maisons rivales jouent alors une manche complète pour t'arrêter, et chaque territoire perdu pendant cette manche te coûte 1 stabilité. Si, au début de ton prochain tour, tu tiens toujours ta capitale avec au moins <b>${CROWN_HOLD} de stabilité</b>, tu es sacrée et tu gagnes la partie.</p><p class="muted">Échec : l'influence dépensée est perdue et ta stabilité baisse de 1.</p>`, [["Attendre", false], ["Proclamer", true, "primary"]]);
    if (claim) {
      p.inf -= CROWN_COST;
      S.claim = { o, round: S.round }; sfx("sacre");
      chron(o, "♛", `${fullName(o)} proclame sa souveraineté`);
      log(`👑 ${esc(p.name)} proclame sa souveraineté ! Sacre au début de son prochain tour si elle tient ${TERR[p.capital].n} avec ${CROWN_HOLD}+ de stabilité.`, "warn");
      render();
      if (p.ai && S.players.some(q => q.alive && !q.ai)) await modal(`<h2>${esc(p.name)} se proclame souveraine</h2><p>Elle sera sacrée au début de son prochain tour si elle tient encore <b>${TERR[p.capital].n}</b> avec au moins ${CROWN_HOLD} de stabilité.</p><p>Pour l'en empêcher : prends sa capitale, ou fais tomber sa stabilité sous ${CROWN_HOLD}. Chaque territoire qu'elle perd lui coûte 1 stabilité, et les révoltes fomentées en coûtent 1 ou 2.</p>`, [["Aux armes", true, "primary"]]);
    }
  }
  // révoltes
  if (p.stab <= 3) {
    let n = 0;
    for (const t of ownedBy(o)) {
      if (t === p.capital || S.t[t].a > 1) continue;
      if (d6() <= 2) { S.t[t] = { o: -1, a: 2 }; n++; }
    }
    log(n ? `⚠ Instabilité : ${n} territoire(s) de ${esc(p.name)} font sécession.` : `Instabilité : les garnisons tiennent bon.`, "warn");
    if (!ownedBy(o).length) { eliminate(o, -1); return endTurn(); }
  }
  S.reinf = baseIncome(o);
  render();
  if (!p.ai && S.players.filter(q => q.alive && !q.ai).length > 1 && S.lastHuman !== o) {
    await modal(`<h2>À ${esc(p.name)} de jouer</h2><p>Passe l'écran à ${esc(p.name)}. Tu disposes de ${p.inf} influence et de ${S.reinf} armées de renfort.</p>`, [["Je prends la main", true, "primary"]]);
  }
  if (!p.ai) S.lastHuman = o;
  if (p.ai) await aiTurn();
}

function goPhase(ph) {
  S.phase = ph; S.sel = S.tgt = -1; S.mode = null;
  try { $("pbody").scrollTop = 0; } catch (e) {}
  if (ph === "renforts") { S.reinfSnap = { arm: S.t.map(x => x.a), reinf: S.reinf }; S.step = S.reinf > 8 ? 3 : 1; }
  render();
}

async function endTurn() {
  if (S.over) return;
  const o = S.cur, p = cur();
  if (p.alive) {
    if (S.conq >= 1) { const b = RULES.butinPer ? Math.min(S.conq, 3) : 1; p.inf += b; log(`Butin de guerre : +${b} influence.`); }
    if (S.conq >= 4) { p.stab = clamp(p.stab - 1, 0, 10); log(`Surextension (${S.conq} conquêtes) : stabilité −1.`); }
    if (ownedBy(o).length >= DOMINATION) return victory(o, "militaire", `${esc(p.name)} contrôle ${ownedBy(o).length} territoires sur ${NT}.`);
  }
  let n = S.cur, wrapped = false;
  do { n = (n + 1) % S.players.length; if (n === 0) wrapped = true; } while (!P(n).alive);
  const g = S;
  if (wrapped || n <= S.cur) await endRound();
  if (S !== g || S.over) return;
  S.cur = n;
  startTurn();
}

async function endRound() {
  if (S.round >= MAX_ROUNDS) {
    const ranked = alive().sort((a, b) => reignScore(b) - reignScore(a) || P(b).inf - P(a).inf);
    const w = ranked[0];
    victory(w, "au Conseil", `Après ${MAX_ROUNDS} manches, le Conseil des Couronnes tranche : ${esc(P(w).name)} a le règne le plus solide (${reignScore(w)} points : ${ownedBy(w).length} territoires, ${regionsOf(w).reduce((t, r) => t + REGIONS[r].bonus, 0)} de bonus de régions${S.t[P(w).capital].o === w ? ", capitale tenue" : ""}).`);
    return;
  }
  const e = S.edict;
  let pour = 0, contre = 0;
  const lines = [];
  for (const [k, v] of Object.entries(S.votes)) {
    if (v.side === "pour") pour += v.w; else if (v.side === "contre") contre += v.w;
    lines.push(`${esc(P(+k).name)} : ${v.side === "pour" ? "pour" : v.side === "contre" ? "contre" : "abstention"}${v.w ? ` (${v.w} ⚜)` : ""}`);
  }
  const dp = d6(), dc = d6();
  const pass = pour + dp > contre + dc;
  S.tray = { kind: "vote", dp, dc, pour, contre, pass }; sfx("conseil");
  log(`<span class="r">Conseil des Couronnes</span>`);
  log(`${e.name} : pour ${pour}+🎲${dp} = ${pour + dp} contre ${contre}+🎲${dc} = ${contre + dc} → <b>${pass ? "ADOPTÉ" : "REJETÉ"}</b>.`);
  (S.hist ||= []).push(S.players.map((q, i) => ownedBy(i).length));
  { const h = S.hist[S.hist.length - 1], best = Math.max(...h), top = h.indexOf(best);
    if (h.filter(v => v === best).length === 1 && top !== S.lead) { if (S.lead !== undefined) chron(top, "⚑", `${fullName(top)} prend la tête (${best} territoires)`); S.lead = top; } }
  S.round++;
  S.active = null;
  let extra = "";
  if (pass) {
    if (e.id === "amnistie") { alive().forEach(i => P(i).stab = clamp(P(i).stab + 2, 0, 10)); extra = "Toutes les Maisons gagnent +2 stabilité."; }
    else if (e.id === "marchands") { const rich = alive().sort((a, b) => P(b).inf - P(a).inf)[0]; alive().forEach(i => { if (i !== rich) P(i).inf += 2; }); extra = `Toutes les Maisons gagnent +2 influence, sauf ${esc(P(rich).name)}.`; }
    else if (e.id === "impot") { alive().forEach(i => P(i).stab = clamp(P(i).stab - 1, 0, 10)); S.active = { id: e.id, round: S.round, name: e.name }; extra = "Toutes les Maisons perdent 1 stabilité."; }
    else {
      S.active = { id: e.id, round: S.round, name: e.name };
      if (e.id === "embargo") { S.active.target = leader(); extra = `Cible : ${esc(P(S.active.target).name)}.`; }
      if (e.id === "levee") { const b2 = alive().filter(i => !regionsOf(i).length); extra = b2.length ? `Bénéficiaires : ${b2.map(i => esc(P(i).name)).join(", ")}.` : "Aucune Maison n'en profite."; }
    }
    if (extra) log(extra);
  }
  // expiration des pactes
  const expired = S.pacts.filter(p => p.until < S.round);
  expired.forEach(p => log(`Le pacte entre ${esc(P(p.a).name)} et ${esc(P(p.b).name)} arrive à son terme.`));
  S.pacts = S.pacts.filter(p => p.until >= S.round);
  S.votes = {};
  if (S.nextEdict) { const ne = S.nextEdict; S.edict = EDICTS.find(x => x.id === ne.id); S.lastEdict = ne.id; S.edict = { ...S.edict, by: ne.by }; S.nextEdict = null; }
  else S.edict = drawEdict();
  log(`<span class="r">Manche ${S.round}</span>`);
  log(`Le Conseil examine : <b>${S.edict.name}</b>.`);
  render();
  if (S.players.some(p => p.alive && !p.ai)) {
    await modal(`<h2>Le Conseil a tranché</h2>
      <p><b>${e.name}</b> : ${e.d}</p>
      <p class="muted small">${lines.length ? lines.join(" · ") : "Aucune Maison n'a voté."}</p>
      <div class="row" style="gap:18px;margin:8px 0">
        <div class="row"><span>Pour ${pour}</span>${dieHTML(dp, "pol")}<b>= ${pour + dp}</b></div>
        <div class="row"><span>Contre ${contre}</span>${dieHTML(dc, "def")}<b>= ${contre + dc}</b></div>
      </div>
      <p style="font-family:var(--f-display);font-size:18px;color:${pass ? "#3d6b2a" : "#8a2a20"}">${pass ? "Édit adopté" : "Édit rejeté"}</p>
      ${extra ? `<p>${extra}</p>` : ""}
      <p class="muted">Manche ${S.round} : le Conseil examinera <b>${S.edict.name}</b>.</p>`, [["Continuer", true, "primary"]]);
  }
}

// score de fin de règne : territoires + bonus des régions + 3 si la capitale est tenue + influence / 3
function reignScore(o) { return ownedBy(o).length + regionsOf(o).reduce((t, r) => t + REGIONS[r].bonus, 0) + (S.t[P(o).capital].o === o ? 3 : 0) + Math.floor(P(o).inf / 3); }
function eliminate(o, by) {
  const p = P(o);
  p.alive = false;
  if (S.claim && S.claim.o === o) S.claim = null;
  S.pacts = S.pacts.filter(x => x.a !== o && x.b !== o);
  chron(by >= 0 ? by : o, "☠", `${fullName(o)} est éliminée${by >= 0 ? ` par ${laName(by)}` : ""}`);
  log(`☠ ${esc(p.name)} est éliminée${by >= 0 ? ` par ${esc(P(by).name)}` : ""}.`, "warn");
  if (by >= 0) { P(by).inf += p.inf; if (p.inf) log(`${esc(P(by).name)} s'empare de son trésor (+${p.inf} influence).`); }
  p.inf = 0;
  const left = alive();
  if (left.length === 1) victory(left[0], "militaire", `${esc(P(left[0]).name)} est la dernière Maison debout.`);
}

// petite chronique : territoires de chaque Maison, manche après manche
function chronicleSVG() {
  const H = (S.hist || []).concat([S.players.map((q, i) => ownedBy(i).length)]);
  if (H.length < 2) return "";
  // sur téléphone, un repère plus étroit : le dessin est moins réduit et les textes restent lisibles (~10-11 px au lieu de ~6)
  const narrow = typeof window !== "undefined" && window.innerWidth < 600, fs = narrow ? 12 : 11;
  const W = narrow ? 330 : 560, Hh = narrow ? 190 : 175, pad = 28, x0 = pad + 12, maxT = Math.max(...H.flat(), 10);
  const x = k => x0 + k * (W - x0 - 8) / (H.length - 1), y = v => Hh - 20 - v * (Hh - 60) / maxT;
  const grid = [0, Math.round(maxT / 2), maxT].map(v => `<line x1="${pad}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="#b79d70" stroke-width=".6"/><text x="${pad - 6}" y="${y(v) + 4}" text-anchor="end" font-size="${fs}" fill="#6e5838">${v}</text>`).join("");
  const lines = S.players.map((p, i) => { const c = PCOL[p.color]; const pts = H.map((r, k) => `${x(k).toFixed(1)},${y(r[i]).toFixed(1)}`).join(" "); const last = H[H.length - 1][i]; const dash = ["", "7 3", "2 3", "", "9 3 2 3"][p.color]; return `<polyline points="${pts}" fill="none" stroke="${c.c}" stroke-width="${p.color === 3 ? 3.4 : 2.4}" stroke-dasharray="${dash}" stroke-linejoin="round"/><circle cx="${x(H.length - 1)}" cy="${y(last)}" r="3.5" fill="${c.c}" stroke="#2b1d10" stroke-width=".8"/>`; }).join("");
  // moments clés : on garde d'abord les événements marquants, puis les changements de tête, au plus 7
  let ev = (S.ev || []).slice();
  while (ev.length > 7) { const k = ev.findIndex(e => e.i === "⚑"); ev.splice(k >= 0 ? k : 0, 1); }
  const marks = ev.map(e => { const k = clamp(e.r - 1, 0, H.length - 1), v = H[k][e.o] ?? 0, c = PCOL[P(e.o).color]; const up = 13 + 18 * (ev.slice(0, ev.indexOf(e)).filter(q => q.r === e.r).length % 2); return `<g transform="translate(${x(k).toFixed(1)},${y(v).toFixed(1)})"><line y2="${-up}" stroke="${c.c}" stroke-width="1"/><circle r="2.2" fill="${c.c}"/><g transform="translate(0,${-up})"><circle r="8.5" fill="#f3e8cc" stroke="${c.c}" stroke-width="1.8"/><text y="4.3" text-anchor="middle" font-size="12" font-family="serif" fill="#2b1d10">${e.i}\uFE0E</text></g></g>`; }).join("");
  const list = ev.length ? `<ul class="chron">${ev.map(e => `<li><span class="cr">M. ${e.r}</span> <span class="ci">${e.i}\uFE0E</span> ${e.t}</li>`).join("")}</ul>` : "";
  return `<h3>Chronique du règne</h3><svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="Territoires par Maison au fil des manches">${grid}${lines}${marks}<text x="${W - 8}" y="${Hh - 4}" text-anchor="end" font-size="${fs}" fill="#6e5838">manche ${H.length}</text><text x="${x0}" y="${Hh - 4}" font-size="${fs}" fill="#6e5838">manche 1</text></svg>
    <div class="row small" style="gap:12px;margin-top:2px">${S.players.map((p, i) => `<span>${shieldSVG(i, 12)} ${esc(p.name.replace(/^Maison (d')?/i, ""))}</span>`).join("")}</div>${list}`;
}
// moments clés de la partie (affichés dans la chronique de fin) ; n'influence aucune règle
function chron(o, icon, txt) {
  if (!S) return; S.ev ||= [];
  if (icon === "♜" && S.ev.some(e => e.t === txt)) return;   // une capitale qui change de mains plusieurs fois : on ne le raconte qu'une fois
  S.ev.push({ r: S.round, o, i: icon, t: txt });
}
const shortName = o => esc(P(o).name.replace(/^Maison (d')?/i, ""));
const fullName = o => esc(P(o).name), laName = o => "la " + esc(P(o).name);
function victory(o, kind, why) {
  S.over = true; S.busy = false;
  log(`👑 Victoire ${kind} de ${esc(P(o).name)} !`, "warn");
  render();
  S.sel = S.tgt = -1; S.mode = null; renderMap();
  const rows = S.players.map((p, i) => `<tr><td>${shieldSVG(i, 13)} ${esc(p.name)}</td><td>${ownedBy(i).length}</td><td>${armiesOf(i)}</td><td>${p.inf}</td><td>${p.stab}</td><td>${p.alive ? "" : "éliminée"}</td></tr>`).join("");
  modal(`<h2>${esc(P(o).name)} règne sur Valdorre</h2><p><b>Victoire ${kind}.</b> ${why}</p><p class="muted">Manche ${S.round}.</p>
    ${chronicleSVG()}
    <table class="rt"><tr><th>Maison</th><th>Terr.</th><th>Armées</th><th>⚜</th><th>Stab.</th><th></th></tr>${rows}</table>`,
    [["Rejouer", "new", "primary"], ["Voir la carte", false]]).then(v => { if (v === "new") setupDialog(); });
}

// ===================== Combat =====================
function canAttack(f, t, o = S.cur) {
  if (f < 0 || t < 0 || firstTurnLock(o)) return false;
  const F = S.t[f], T = S.t[t];
  if (F.o !== o || T.o === o || F.a < 2 || !ADJ[f].includes(t)) return false;
  if (pactBetween(o, T.o)) return false;
  if (edictOn("treve") && capitalOf(t) >= 0) return false;
  return true;
}
// la Maison qui ouvre la partie ne peut pas attaquer pendant la première manche
function firstTurnLock(o) { return S.round === 1 && o === 0; }
function battle(f, t) {
  const F = S.t[f], T = S.t[t], att = F.o, def = T.o;
  const na = Math.min(3, F.a - 1), nd = Math.min(2, T.a);
  const A = Array.from({ length: na }, d6).sort((x, y) => y - x);
  const D = Array.from({ length: nd }, d6).sort((x, y) => y - x);
  const mA = edictOn("conquete") ? 1 : 0;
  const mD = (capitalOf(t) === def && def >= 0 ? 1 : 0) + (edictOn("martiale") ? 1 : 0);
  let la = 0, ld = 0;
  const lostA = [], lostD = [];
  for (let i = 0; i < Math.min(na, nd); i++) {
    const a = A[i] + (i === 0 ? mA : 0), d = D[i] + (i === 0 ? mD : 0);
    if (a > d) { ld++; lostD.push(i); } else { la++; lostA.push(i); }
  }
  F.a -= la; T.a -= ld;
  if (la) floatText(f, "−" + la, "loss"); if (ld) floatText(t, "−" + ld, "loss");
  strikeFX(f, t, att, ld > 0 && T.a > 0);
  sfx("des");
  S.tray = { kind: "battle", A, D, mA, mD, lostA, lostD, txt: `${TERR[f].n} → ${TERR[t].n} : l'attaquant perd ${la}, le défenseur perd ${ld}.` };
  if (def >= 0 && ld) P(def).lost = true;
  if (T.a <= 0) { conquer(f, t, na); flash(t); return true; }
  return false;
}
function conquer(f, t, minMove) {
  const F = S.t[f], T = S.t[t], o = F.o, prev = T.o;
  const mv = Math.min(minMove, F.a - 1);
  T.o = o; T.a = mv; F.a -= mv;
  S.conq++;
  plantFlag(t, o); sfx("conquete");
  log(`${esc(P(o).name)} s'empare de <b>${TERR[t].n}</b>${prev >= 0 ? ` (${esc(P(prev).name)})` : " (rebelles)"}.`);
  if (prev >= 0) {
    P(prev).lost = true;
    shakeClaim(prev);
    if (P(prev).capital === t) {
      P(prev).stab = clamp(P(prev).stab - 3, 0, 10);
      P(o).inf += 2;
      chron(o, "♜", `${fullName(o)} prend ${TERR[t].n}, capitale de ${laName(prev)}`);
      log(`👑 La capitale de ${esc(P(prev).name)} tombe ! Sa stabilité chute de 3 ; ${esc(P(o).name)} pille le trésor royal (+2 influence).`, "warn");
    }
    if (!ownedBy(prev).length) eliminate(prev, o);
  }
  if (!S.over && F.a > 1) S.pending = { f, t };
}

// ===================== Politique =====================
function validBribe(t, o = S.cur) {
  const T = S.t[t];
  if (T.o === o || T.a > 2 || capitalOf(t) >= 0 || edictOn("censure")) return false;
  if (pactBetween(o, T.o)) return false;
  return ADJ[t].some(j => S.t[j].o === o);
}
function validRevolt(t, o = S.cur) {
  const T = S.t[t];
  return T.o >= 0 && T.o !== o && !pactBetween(o, T.o) && !edictOn("censure");
}
function bribeNeed(t, o = S.cur) { return S.t[t].a + 3 - (S.t[t].o < 0 ? 1 : 0) - (P(o).stab >= 7 ? 1 : 0); }

function doPropagande(o = S.cur) {
  const p = P(o); p.inf -= COST.propagande; S.used.propagande++;
  p.stab = clamp(p.stab + 2, 0, 10);
  log(`${esc(p.name)} lance une campagne de propagande : stabilité ${p.stab}.`);
}
function doMercenaires(o = S.cur) {
  const p = P(o); p.inf -= COST.mercenaires; S.used.mercenaires++;
  S.reinf += MERC_N;
  if (RULES.mercStab) { p.stab = clamp(p.stab - RULES.mercStab, 0, 10); }
  log(`${esc(p.name)} engage des mercenaires : +${MERC_N} armées.`);
}
function doBribe(t, o = S.cur) {
  const p = P(o); p.inf -= COST.soudoyer; S.used.soudoyer++;
  const need = bribeNeed(t, o), r = d6(), prev = S.t[t].o; sfx("intrigue");
  S.tray = { kind: "pol", v: r, txt: `Soudoyer ${TERR[t].n} : il faut ${need}+ → ${r >= need ? "réussite" : "échec"}.` };
  if (r >= need) {
    S.t[t].o = o;
    if (prev >= 0) { P(prev).lost = true; shakeClaim(prev); }
    flash(t);
    log(`💰 ${esc(p.name)} achète la garnison de <b>${TERR[t].n}</b> (🎲${r}, il fallait ${need}).`);
    if (prev >= 0 && !ownedBy(prev).length) eliminate(prev, o);
  } else log(`💰 ${esc(p.name)} tente de soudoyer ${TERR[t].n} : refus (🎲${r}, il fallait ${need}).`);
}
function doRevolt(t, o = S.cur) {
  const p = P(o); p.inf -= COST.revolte; S.used.revolte++;
  const r = d6(), T = S.t[t], vic = T.o, V = P(vic);
  let txt;
  if (r === 1) { p.stab = clamp(p.stab - 1, 0, 10); txt = `complot éventé ! ${esc(p.name)} perd 1 stabilité`; }
  else if (r <= 3) txt = "les meneurs hésitent, rien ne se passe";
  else {
    const loss = Math.min(2, T.a - 1);
    T.a -= loss;
    V.stab = clamp(V.stab - (r === 6 ? 2 : 1), 0, 10);
    V.lost = true;
    txt = `émeutes : −${loss} armée(s), stabilité de ${esc(V.name)} −${r === 6 ? 2 : 1}`;
    if (r === 6 && T.a === 1 && capitalOf(t) < 0) { T.o = -1; T.a = 2; txt += `, et ${TERR[t].n} passe aux rebelles`; if (!ownedBy(vic).length) eliminate(vic, -1); }
  }
  flash(t);
  S.tray = { kind: "pol", v: r, txt: `Révolte à ${TERR[t].n} : ${txt.replace(/<[^>]+>/g, "")}.` };
  log(`🔥 Révolte fomentée à <b>${TERR[t].n}</b> (🎲${r}) : ${txt}.`);
}
function avgTerr() { const al = alive(); return al.reduce((s, i) => s + ownedBy(i).length, 0) / al.length; }
function sacreTerrOk(o) { return !RULES.sacreAvg || ownedBy(o).length >= Math.floor(avgTerr()); }
// chaque territoire perdu pendant la manche du sacre ébranle la légitimité du prétendant
function shakeClaim(v) {
  if (!S.claim || S.claim.o !== v) return;
  P(v).stab = clamp(P(v).stab - 1, 0, 10);
  log(`♛ La légitimité de ${esc(P(v).name)} vacille : stabilité ${P(v).stab}.`);
}
// ordre du jour : imposer l'édit de la prochaine manche
function setAgenda(o, id) {
  P(o).inf -= COST.ordre; S.used.ordre = 1;
  S.nextEdict = { id, by: o };
  log(`📜 ${esc(P(o).name)} inscrit « ${EDICTS.find(x => x.id === id).name} » à l'ordre du jour de la prochaine manche.`);
}
function agendaChoices() { const pool = EDICTS.filter(e => e.id !== S.edict.id); return shuffle(pool.slice()).slice(0, 3); }
function makePact(a, b) {
  S.pacts.push({ a, b, until: S.round + 2 });
  log(`🤝 Pacte de non-agression entre ${esc(P(a).name)} et ${esc(P(b).name)} (jusqu'à la manche ${S.round + 2}).`);
}
function breakPact(a, b) {
  S.pacts = S.pacts.filter(p => !((p.a === a && p.b === b) || (p.a === b && p.b === a)));
  P(a).stab = clamp(P(a).stab - 3, 0, 10);
  P(b).inf += 2;
  P(a).betrayed = S.round;
  chron(a, "⚔", `${fullName(a)} trahit son pacte avec ${laName(b)}`);
  log(`🗡 ${esc(P(a).name)} trahit son pacte avec ${esc(P(b).name)} ! Stabilité −3 ; la victime gagne +2 influence.`, "warn");
}
async function proposePact(a, b, why) {
  P(a).inf -= COST.pacte; S.used.pacte++;
  let ok;
  if (P(b).ai) ok = aiAcceptPact(b, a);
  else ok = await modal(`<h2>Proposition de pacte</h2><p><b>${esc(P(a).name)}</b> propose à <b>${esc(P(b).name)}</b> un pacte de non-agression jusqu'à la fin de la manche ${S.round + 2}.</p>
    ${why === "fear" ? `<p><i>« Votre puissance nous inquiète. Mieux vaut la paix entre nous que la ruine des deux. »</i> ${esc(P(a).name)} a ${ownedBy(a).length} territoires et ${armiesOf(a)} armées, toi ${ownedBy(b).length} et ${armiesOf(b)}.</p>` : why === "border" ? `<p><i>« Nos frontières se touchent. Gardons nos épées pour d'autres. »</i></p>` : ""}
    ${isOathbreaker(a) ? `<p class="muted">Attention : ${esc(P(a).name)} a trahi un pacte à la manche ${P(a).betrayed}.</p>` : ""}
    <p class="muted">Pendant le pacte, aucune des deux Maisons ne peut attaquer, soudoyer ni fomenter de révolte chez l'autre. Chacune gagne +1 influence par tour. Rompre un pacte coûte 3 stabilité.</p>
    <p class="small muted">${esc(P(b).name)}, prends la main pour répondre.</p>`, [["Refuser", false, "danger"], ["Accepter", true, "primary"]]);
  if (ok) makePact(a, b); else log(`${esc(P(b).name)} rejette le pacte proposé par ${esc(P(a).name)}.`);
  render();
}
function vote(side, w, o = S.cur) {
  P(o).inf -= w;
  S.votes[o] = { side, w };
  log(`${esc(P(o).name)} vote ${side === "abst" ? "l'abstention" : side} sur « ${S.edict.name} »${w ? ` en engageant ${w} influence` : ""}.`);
}

// ===================== Interaction =====================
function reachable(f) {
  const o = S.t[f].o, seen = new Set([f]), st = [f];
  while (st.length) { const u = st.pop(); for (const v of ADJ[u]) if (!seen.has(v) && S.t[v].o === o) { seen.add(v); st.push(v); } }
  seen.delete(f); return seen;
}
function validSet() {
  const s = new Set();
  if (!S || S.over || cur().ai || S.pending) return s;
  const o = S.cur;
  if (S.phase === "politique" && S.mode === "soudoyer") TERR.forEach((_, i) => validBribe(i) && s.add(i));
  else if (S.phase === "politique" && S.mode === "revolte") TERR.forEach((_, i) => validRevolt(i) && s.add(i));
  else if (S.phase === "attaque" && S.sel >= 0) ADJ[S.sel].forEach(j => canAttack(S.sel, j) && s.add(j));
  else if (S.phase === "manoeuvre" && S.sel >= 0 && !S.moved) reachable(S.sel).forEach(j => s.add(j));
  return s;
}
function clickTerr(i) {
  if (!S || S.over || cur().ai || S.busy) return;
  const o = S.cur, T = S.t[i];
  if (S.pending) return;
  if (S.phase === "politique") {
    if (S.mode === "soudoyer" && validBribe(i)) { doBribe(i); S.mode = null; }
    else if (S.mode === "revolte" && validRevolt(i)) { doRevolt(i); S.mode = null; }
  } else if (S.phase === "renforts") {
    if (T.o === o && S.reinf > 0) { const k = S.step === 0 ? S.reinf : Math.min(S.step, S.reinf); T.a += k; S.reinf -= k; floatText(i, "+" + k); }
  } else if (S.phase === "attaque") {
    if (T.o === o) { S.sel = T.a >= 2 ? i : -1; S.tgt = -1; }
    else if (S.sel >= 0 && canAttack(S.sel, i)) S.tgt = i;
  } else if (S.phase === "manoeuvre" && !S.moved) {
    if (S.sel >= 0 && T.o === o && i !== S.sel && reachable(S.sel).has(i)) { S.tgt = i; S.moveN = Math.max(1, Math.floor((S.t[S.sel].a - 1) / 2)); }
    else if (T.o === o) { S.sel = T.a >= 2 ? i : -1; S.tgt = -1; }
  }
  render();
}

// au doigt, un appui qui ne change rien (tour de l'IA, territoire non valide) ouvre la fiche du territoire
let tapType = "mouse", lpFired = false;
function terrAt(el) { const g = el && el.closest && el.closest("[data-i]"); return g ? +g.dataset.i : -1; }
function tapTerr(e, i) {
  const sig = () => S ? [S.sel, S.tgt, S.reinf, S.mode, S.moveN, S.pending ? 1 : 0, S.t[i].a].join() : "";
  const before = sig();
  clickTerr(i);
  if (tapType === "touch" && sig() === before) tip(e, i, true);
}
function setDrawer(open) {
  const a = $("aside"), b = $("drawer"); if (!a || !b) return;
  a.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
  b.firstElementChild.textContent = open ? "▾ Réduire le panneau" : "▴ Panneau du tour";
  if (!open) a.scrollTop = 0;
  const tp = $("tip"); if (tp) tp.style.display = "none";
}
// téléphone : le bouton de fin de phase est recopié dans la barre du tiroir (visible même tiroir replié)
// (vote du Conseil en attente : bouton qui ouvre le tiroir ; cible choisie : « Lancer les dés » + « Assaut total »)
function drawerGo() {
  const g = $("drawerGo"), g2 = $("drawerGo2"); if (!g || !g2) return;
  const mirror = (b, src, label) => { b.hidden = !src; if (!src) { b.onclick = null; return; } b.textContent = label || src.textContent; b.disabled = src.disabled; b.onclick = () => src.click(); };
  mirror(g2, null);
  if (!S || S.over || cur().ai) return mirror(g, null);
  const vote = $("pbody").querySelector("[data-vote]");
  if (vote) { g.hidden = false; g.disabled = false; g.textContent = "Voter au Conseil ▴"; g.onclick = () => { setDrawer(true); vote.scrollIntoView({ block: "center" }); }; return; }
  if ($("roll")) { mirror(g, $("roll"), "Dés"); mirror(g2, $("blitz"), "Assaut total"); return; }
  if ($("movOk")) { mirror(g, $("movOk")); mirror(g2, $("endT"), "Terminer ✓"); return; }
  mirror(g, ["occOk", "toReinf", "toAttack", "toMove", "endT"].map(id => $(id)).find(Boolean) || null);
}
// province la plus proche d'être complète pour la Maison o (aide aux renforts)
function nearestRegion(o) {
  let best = null;
  REGIONS.forEach((r, ri) => {
    const ts = TERR.map((t, i) => i).filter(i => TERR[i].r === ri), miss = ts.filter(i => S.t[i].o !== o).length;
    if (!miss || miss === ts.length) return;
    if (!best || miss < best.miss || (miss === best.miss && r.bonus > best.bonus)) best = { ri, miss, bonus: r.bonus, name: r.name };
  });
  return best;
}

// ===================== Rendu =====================
let landEls = [], tokEls = [], olEls = [];
function flash(t) {
  const g = tokEls[t]; if (!g) return;
  g.classList.remove("flash"); void g.getBoundingClientRect(); g.classList.add("flash");
}
function plantFlag(t, o) {
  if (!tokEls[t] || typeof document === "undefined") return;
  const [x, y] = MAP.centers[t], c = PCOL[P(o).color];
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "flag"); g.setAttribute("transform", `translate(${x + 13},${y - 8})`);
  g.innerHTML = `<g class="flagIn"><path d="M0,0 V-26" stroke="#2a1608" stroke-width="1.6" stroke-linecap="round"/><path d="M0,-26 H15 L11,-20.5 L15,-15 H0Z" fill="${c.c}" stroke="#2a1608" stroke-width="1"/><circle cy="-27" r="1.6" fill="#e3b445"/></g>`;
  $("tokens").appendChild(g); setTimeout(() => g.remove(), 1700);
}
// trait d'attaque aux couleurs de l'assaillant + choc sur le territoire visé (un seul à la fois, purement visuel)
let strikeT = 0, shakeTok = null;
function strikeFX(f, t, o, hit) {
  if (!tokEls[t] || typeof document === "undefined" || o < 0) return;
  const old = $("tokens").querySelector(".strike"); if (old) old.remove();
  const [x1, y1] = MAP.centers[f], [x2, y2] = MAP.centers[t], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const sx = x1 + dx * 16 / L, sy = y1 + dy * 16 / L, ex = x2 - dx * 19 / L, ey = y2 - dy * 19 / L;
  const mx = (sx + ex) / 2 - dy * .18, my = (sy + ey) / 2 + dx * .18, c = PCOL[P(o).color].c;
  const a = Math.atan2(ey - my, ex - mx) * 180 / Math.PI;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "strike" + (hit ? " hit" : ""));
  g.innerHTML = `<path class="sk" d="M${sx.toFixed(1)},${sy.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" pathLength="100" stroke="${c}"/><path class="sh" transform="translate(${ex.toFixed(1)},${ey.toFixed(1)}) rotate(${a.toFixed(0)})" d="M2,0 L-9,-6 L-6,0 L-9,6Z" fill="${c}"/><g class="clash" transform="translate(${x2},${y2})"><path d="M-9,-9 L9,9 M9,-9 L-9,9 M0,-12 V12 M-12,0 H12"/></g>`;
  $("tokens").appendChild(g); if (cur().ai) $("map").classList.add("striking");   // la flèche de visée s'efface sous le trait
  if (shakeTok) shakeTok.classList.remove("shake");
  const tk = shakeTok = tokEls[t]; void tk.getBoundingClientRect(); if (hit) tk.classList.add("shake");
  clearTimeout(strikeT); strikeT = setTimeout(() => { g.remove(); tk.classList.remove("shake"); shakeTok = null; $("map").classList.remove("striking"); }, 750);
}
function floatText(t, txt, cls) {
  if (!tokEls[t] || typeof document === "undefined") return;
  const [x, y] = MAP.centers[t];
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("class", "float" + (cls ? " " + cls : "")); el.setAttribute("x", x + 16); el.setAttribute("y", y - 10); el.textContent = txt;
  $("tokens").appendChild(el); setTimeout(() => el.remove(), 1100);
}
function placeFX(before) { S.t.forEach((T, i) => { const d = T.a - before[i]; if (d > 0) floatText(i, "+" + d); }); }
// probabilité de conquête en assaut total (Monte-Carlo)
// probabilités exactes d'une bataille complète (programmation dynamique sur les jets de dés)
const _roundCache = new Map(), _oddsCache = new Map();
function roundProbs(na, nd, mA, mD) {
  const key = `${na}${nd}${mA}${mD}`;
  if (_roundCache.has(key)) return _roundCache.get(key);
  const res = {}, n = na + nd, tot = 6 ** n;
  for (let k = 0; k < tot; k++) {
    let x = k; const A = [], D = [];
    for (let i = 0; i < na; i++) { A.push(1 + x % 6); x = Math.floor(x / 6); }
    for (let i = 0; i < nd; i++) { D.push(1 + x % 6); x = Math.floor(x / 6); }
    A.sort((p, q) => q - p); D.sort((p, q) => q - p);
    let la = 0, ld = 0;
    for (let i = 0; i < Math.min(na, nd); i++) { if (A[i] + (i ? 0 : mA) > D[i] + (i ? 0 : mD)) ld++; else la++; }
    res[la + "," + ld] = (res[la + "," + ld] || 0) + 1 / tot;
  }
  const out = Object.entries(res).map(([k, p]) => { const [la, ld] = k.split(",").map(Number); return [la, ld, p]; });
  _roundCache.set(key, out); return out;
}
// renvoie [probabilité de conquête, armées attaquantes restantes espérées en cas de succès]
function oddsExact(a, d, mA = 0, mD = 0) {
  a = Math.min(a, 80); d = Math.min(d, 80);
  const key = `${a},${d},${mA},${mD}`;
  if (_oddsCache.has(key)) return _oddsCache.get(key);
  let r;
  if (d <= 0) r = [1, a]; else if (a < 2) r = [0, 0];
  else {
    let p = 0, e = 0;
    for (const [la, ld, q] of roundProbs(Math.min(3, a - 1), Math.min(2, d), mA, mD)) { const [p2, e2] = oddsExact(a - la, d - ld, mA, mD); p += q * p2; e += q * p2 * e2; }
    r = [p, p ? e / p : 0];
  }
  _oddsCache.set(key, r); return r;
}
function battleMods(t) { const def = S.t[t].o; return [edictOn("conquete") ? 1 : 0, (capitalOf(t) === def && def >= 0 ? 1 : 0) + (edictOn("martiale") ? 1 : 0)]; }
function conquestOdds(f, t) { const [mA, mD] = battleMods(t); const [p, left] = oddsExact(S.t[f].a, S.t[t].a, mA, mD); return { p, left }; }
let edgeEls = [], hatchEls = [];
function buildBoard() {
  const ns = "http://www.w3.org/2000/svg";
  const mk = (tag, at, parent, html) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); if (html) e.innerHTML = html; parent.appendChild(e); return e; };
  // houle côtière : anneaux concentriques autour des côtes
  [[32, "#9fbfbc", .16], [30, "#41707b", 1], [21, "#9fbfbc", .28], [19, "#41707b", 1], [11, "#b9d2cc", .5], [6, "#d3e3da", .35]]
    .forEach(([w, c, o]) => mk("path", { d: MAP.coast, stroke: c, "stroke-width": w, opacity: o }, $("ripples")));
  mk("path", { d: MAP.coast, stroke: "#20323a", "stroke-width": 15, "stroke-dasharray": ".9 2.4", "stroke-linecap": "butt", opacity: .32 }, $("ripples"));
  const base = $("landBase");
  base.setAttribute("d", MAP.paths.join("")); base.setAttribute("stroke", "#ead8ac"); base.setAttribute("stroke-width", ".8"); base.setAttribute("fill-rule", "evenodd");
  const defs = document.querySelector("#map defs");
  TERR.forEach((t, i) => {
    const L = mk("path", { d: MAP.paths[i], class: "land tint", "stroke-width": ".8", "fill-rule": "evenodd" }, $("tint"));
    L.addEventListener("click", e => tapTerr(e, i)); L.dataset.i = i;
    L.addEventListener("mousemove", e => { if (tapType !== "touch") tip(e, i); }); L.addEventListener("mouseleave", () => { if (tapType !== "touch") $("tip").style.display = "none"; });
    landEls.push(L);
    mk("clipPath", { id: "c" + i }, defs, `<path d="${MAP.paths[i]}" clip-rule="evenodd"/>`);
    hatchEls.push(mk("path", { d: MAP.paths[i], "pointer-events": "none", stroke: "none", "fill-rule": "evenodd" }, $("hatch")));
    edgeEls.push(mk("path", { d: MAP.outlines[i], fill: "none", "stroke-width": "9", opacity: ".42", "clip-path": `url(#c${i})`, "pointer-events": "none", class: "tint" }, $("edges")));
    olEls.push(mk("path", { d: MAP.outlines[i], class: "ol" }, $("outl")));
  });
  // relief
  $("relief").innerHTML = MAP.glyphs.map(([x, y, k]) => `<use href="#g-${k}" x="${x}" y="${y}"/>`).join("");
  $("bInner").setAttribute("d", MAP.inner);
  $("bRegion").setAttribute("d", MAP.region); $("bRegionHalo").setAttribute("d", MAP.region);
  $("bCoast").setAttribute("d", MAP.coast);
  // noms des mers
  [["Golfe du Nord", 455, 42, 0], ["Baie d'Ostrel", 665, 326, 0], ["Détroit de Kael", 255, 622, -32]]
    .forEach(([n, x, y, r]) => mk("text", { class: "sea", x, y, transform: `rotate(${r} ${x} ${y})` }, $("sealbl")).textContent = n);
  // graduation du cadre
  const tk = [];
  for (let x = 0; x < 1000; x += 50) { if ((x / 50) % 2 === 0) tk.push(`M${x},-9H${x + 50}M${x},669H${x + 50}`); }
  for (let y = 0; y < 660; y += 50) { if ((y / 50) % 2 === 0) tk.push(`M-9,${y}V${Math.min(660, y + 50)}M1009,${y}V${Math.min(660, y + 50)}`); }
  mk("path", { d: tk.join(""), "stroke-width": "4.5" }, $("ticks"));
  mk("path", { d: "M-14,-4H1014M-14,669.5H1014M-4,-14V674M1004,-14V674", "stroke-width": ".8", opacity: ".7" }, $("ticks"));
  mk("path", { d: "M-14,-13.5H1014M-14,673.5H1014M-13.5,-14V674M1013.5,-14V674", "stroke-width": ".8", opacity: ".7" }, $("ticks"));
  // cartouche du titre, à cheval sur le cadre
  mk("g", { transform: "translate(500,-13)", "pointer-events": "none" }, $("compass").parentNode, `
    <path d="M-150,-11 H150 L162,0 L150,11 H-150 L-162,0Z" fill="#efe1bf" stroke="#2a1b0e" stroke-width="1.6"/>
    <path d="M-144,-7 H144 L152,0 L144,7 H-144 L-152,0Z" fill="none" stroke="#9c7426" stroke-width=".8"/>
    <text y="4.5" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="14" letter-spacing="2.4" fill="#3a2412">Valdorre · les six provinces</text>`);
  // rose des vents
  const cp = $("compass"); cp.setAttribute("transform", "translate(950,472)");
  let rose = `<circle r="27" fill="#ead8ac" fill-opacity=".25" stroke="#24180c" stroke-width=".9"/><circle r="22" fill="none" stroke="#24180c" stroke-width=".5"/>`;
  for (let k = 0; k < 8; k++) {
    const L2 = k % 2 ? 19 : 33, w = k % 2 ? 3.6 : 5.5, a = k * 45;
    rose += `<g transform="rotate(${a})"><path d="M0,${-L2} L${w},0 L0,0Z" fill="#24180c"/><path d="M0,${-L2} L${-w},0 L0,0Z" fill="#efe2c0" stroke="#24180c" stroke-width=".5"/></g>`;
  }
  rose += `<circle r="2.6" fill="#a8382f" stroke="#24180c" stroke-width=".6"/><text y="-37" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="13" fill="#efe2c0" stroke="#24180c" stroke-width=".6">N</text>`;
  cp.innerHTML = rose;
  // routes maritimes
  MAP.routes.forEach(([a, b]) => {
    const [x1, y1] = MAP.centers[a], [x2, y2] = MAP.centers[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 22;
    mk("path", { d: `M${x1},${y1}Q${mx},${my} ${x2},${y2}`, fill: "none", stroke: "#efe2c0", "stroke-width": "1.8", "stroke-dasharray": "1 6", "stroke-linecap": "round", opacity: ".9" }, $("routes"));
  });
  // blasons
  const SH = "M-12,-13 H12 V-1 Q12,10 0,15.5 Q-12,10 -12,-1Z";
  TERR.forEach((t, i) => {
    const [x, y] = MAP.centers[i];
    const tg = mk("g", { class: "tok", transform: `translate(${x},${y})` }, $("tokens"), `
      <circle class="ring" r="21"/>
      <g class="body" filter="url(#tokShadow)"><path class="shield" d="${SH}" stroke="#e9cf8a" stroke-width="1.5" stroke-linejoin="round"/><path class="charge" d="" fill="none" stroke-width="4.2" clip-path="url(#shieldClip)" opacity=".55" pointer-events="none"/><path d="${SH}" fill="url(#shieldGloss)" pointer-events="none"/></g>
      <path class="cap" transform="translate(0,-20) scale(1.15)" d="M-8,5 V-3 H-5.5 V-0.5 H-2.7 V-3 H-0.9 V-0.5 H0.9 V-3 H2.7 V-0.5 H5.5 V-3 H8 V5Z M-1.8,5 V2 Q0,0 1.8,2 V5" stroke="#24180c" stroke-width="1.1" stroke-linejoin="round" fill-rule="evenodd" style="display:none;paint-order:stroke;filter:drop-shadow(0 0 1.5px #f3e6c4)"/>
      <text class="n" y="0.5"></text><text class="lbl" y="31">${t.n}</text>`);
    tg.addEventListener("click", e => tapTerr(e, i)); tg.dataset.i = i;
    tg.addEventListener("mousemove", e => { if (tapType !== "touch") tip(e, i); }); tg.addEventListener("mouseleave", () => { if (tapType !== "touch") $("tip").style.display = "none"; });
    tokEls.push(tg);
  });
}
function tip(e, i, touch) {
  if (!S) return;
  const T = S.t[i], tp = $("tip"), r = REGIONS[TERR[i].r], cap = capitalOf(i);
  let extra = "";
  if (S.mode === "soudoyer" && validBribe(i)) extra = `<br><b style="color:var(--gold)">Corruption : ${Math.round(Math.max(0, 7 - bribeNeed(i)) / 6 * 100)} % de réussite</b>`;
  if (S.phase === "attaque" && S.sel >= 0 && canAttack(S.sel, i)) extra = `<br><b style="color:var(--gold)">Assaut total : ${Math.round(conquestOdds(S.sel, i).p * 100)} %</b>`;
  tp.innerHTML = `<b>${TERR[i].n}</b>${cap >= 0 ? " 👑" : ""}<br><span class="muted">${r.name} (+${r.bonus})</span><br>${esc(pname(T.o))} · ${T.a} armée${T.a > 1 ? "s" : ""}${cap >= 0 ? `<br><span class="muted">Capitale de ${esc(P(cap).name)}${T.o === cap ? " : +1 au meilleur dé en défense" : ""}</span>` : ""}`;
  if (touch) {
    const me = S.players.findIndex(q => !q.ai && q.alive), ts = TERR.map((t, k) => k).filter(k => TERR[k].r === TERR[i].r);
    if (me >= 0) tp.innerHTML += `<br><span class="muted">${r.name} : ${ts.filter(k => S.t[k].o === me).length}/${ts.length} à ${esc(P(me).name)}</span>`;
  }
  tp.innerHTML += extra;
  const b = $("board").getBoundingClientRect();
  tp.style.display = "block";
  if (touch) {   // au-dessus du doigt (sinon en dessous s'il n'y a pas la place), jamais hors du cadre
    const w = tp.offsetWidth, h = tp.offsetHeight, x = e.clientX - b.left, y = e.clientY - b.top;
    tp.style.left = clamp(x - w / 2, 6, b.width - w - 6) + "px";
    tp.style.top = (y - h - 28 >= 4 ? y - h - 28 : Math.min(y + 28, b.height - h - 4)) + "px";
    clearTimeout(tipT); tipT = setTimeout(() => tp.style.display = "none", 6000);
    return;
  }
  tp.style.left = Math.min(e.clientX - b.left + 14, b.width - 230) + "px";
  tp.style.top = (e.clientY - b.top + 14) + "px";
}
let tipT = 0;
function dieHTML(v, cls, mod, lost) {
  const pip = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }[v];
  return `<div class="die ${cls}${lost ? " lost" : ""}" title="${v}"><svg viewBox="0 0 40 40">${pip.map(([x, y]) => `<circle cx="${x * 10}" cy="${y * 10}" r="3.6"/>`).join("")}</svg>${mod ? `<span class="mod">+${mod}</span>` : ""}</div>`;
}
function renderMap() {
  const vs = validSet();
  TERR.forEach((_, i) => {
    const T = S.t[i], c = col(T.o);
    const L = landEls[i];
    L.setAttribute("fill", T.o < 0 ? "url(#rebelHatch)" : c.w || c.c); L.setAttribute("stroke", T.o < 0 ? "#d9caa6" : c.w || c.c);
    const lo = T.o < 0 ? .58 : c.o || .42; L.setAttribute("fill-opacity", lo); L.setAttribute("stroke-opacity", lo);
    edgeEls[i].setAttribute("stroke", c.d);
    hatchEls[i].setAttribute("fill", T.o < 0 ? "none" : `url(#tinct${P(T.o).color})`);
    olEls[i].setAttribute("class", "ol" + (i === S.tgt ? " tgt" : i === S.sel ? " sel" : vs.has(i) ? " valid" : ""));
    const g = tokEls[i];
    g.querySelector(".shield").setAttribute("fill", c.d);
    const chg = g.querySelector(".charge");
    chg.setAttribute("d", T.o < 0 ? "" : CHARGES[P(T.o).color]); chg.setAttribute("stroke", c.l);
    const nEl = g.querySelector(".n");
    nEl.textContent = T.a; nEl.style.fontSize = T.a >= 100 ? "10px" : T.a >= 10 ? "12px" : "";
    const cap = capitalOf(i);
    const cr = g.querySelector(".cap");
    cr.style.display = cap >= 0 ? "" : "none";
    if (cap >= 0) cr.setAttribute("fill", PCOL[P(cap).color].l);
    const ring = g.querySelector(".ring");
    ring.setAttribute("class", "ring" + (i === S.sel ? " sel" : i === S.tgt ? " tgt" : S.claim && P(S.claim.o).capital === i ? " claim" : ""));
  });
  // flèche d'attaque ou de manœuvre
  const show = S.sel >= 0 && S.tgt >= 0 && (S.phase === "attaque" || S.phase === "manoeuvre");
  ["arrow", "arrowIn", "arrowHead"].forEach(id => $(id).style.display = show ? "" : "none");
  if (show) {
    const [x1, y1] = MAP.centers[S.sel], [x2, y2] = MAP.centers[S.tgt];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = x1 + ux * 17, sy = y1 + uy * 17, ex = x2 - ux * 26, ey = y2 - uy * 26;
    const cx = (sx + ex) / 2 - uy * L * .18, cy = (sy + ey) / 2 + ux * L * .18;
    const d = `M${sx},${sy}Q${cx},${cy} ${ex},${ey}`;
    const c = S.phase !== "attaque" ? "#ffd76a" : cur().ai ? PCOL[cur().color].l : "#ff6b57";   // IA : teinte claire de sa Maison (le contour sombre la détache du fond)
    $("arrow").setAttribute("d", d); $("arrowIn").setAttribute("d", d); $("arrowIn").setAttribute("stroke", c);
    const tx = ex - cx, ty = ey - cy, tl = Math.hypot(tx, ty), vx = tx / tl, vy = ty / tl;
    $("arrowHead").setAttribute("d", `M${ex + vx * 11},${ey + vy * 11}L${ex - vy * 7},${ey + vx * 7}L${ex + vy * 7},${ey - vx * 7}Z`);
    $("arrowHead").setAttribute("fill", c);
  }
}
function renderPlayers() {
  $("players").innerHTML = S.players.map((p, i) => {
    const st = Array.from({ length: 10 }, (_, k) => `<i class="${k < p.stab ? (p.stab <= 3 ? "low" : p.stab >= 8 ? "hi" : "on") : ""}"></i>`).join("");
    const pacts = pactsOf(i).map(x => P(x.a === i ? x.b : x.a)).map(q => `<span title="Pacte avec ${esc(q.name)}">${shieldCol(q.color, 9)}</span>`).join("");
    return `<div class="chip ${i === S.cur && !S.over ? "cur" : ""} ${p.alive ? "" : "dead"}" title="${esc(p.name)}" style="--hc:${PCOL[p.color].c}">
      ${shieldSVG(i, 14)}<b class="nm">${esc(p.name.replace(/^Maison (d')?/i, ""))}</b>${p.ai ? `<span class="tag" title="IA ${p.lvl === "ruse" ? "rusée" : p.lvl === "facile" ? "facile" : "normale"}">IA${p.lvl === "ruse" ? " ★" : p.lvl === "facile" ? " ·" : ""}</span>` : ""}${i === S.cur && !S.over ? `<span class="ph">${PHASE_LBL[S.phase]}</span>` : ""}
      <span class="cT" title="Territoires">▦ ${ownedBy(i).length}</span><span class="cA" title="Armées">⚔ ${armiesOf(i)}</span><span class="cI" title="Influence">⚜ ${p.inf}</span>${S.t[p.capital].o === i ? "" : `<span title="Capitale perdue" class="ko">♛̸</span>`}${S.claim && S.claim.o === i ? `<span title="Sacre en cours" class="claimTag">♛</span>` : ""}${isOathbreaker(i) ? `<span class="ko" title="Parjure : a trahi un pacte à la manche ${p.betrayed}">✗</span>` : ""}
      <span class="st" title="Stabilité ${p.stab}/10">${st}</span><span class="stn ${p.stab <= 3 ? "ko" : p.stab >= 8 ? "ok" : ""}" title="Stabilité">☗ ${p.stab}</span>${pacts ? `<span class="pc" title="Pactes" style="display:inline-flex;gap:2px">🤝${pacts}</span>` : ""}</div>`;
  }).join("");
}
function renderLegend() {
  $("legend").innerHTML = `<div class="lt">Provinces de Valdorre</div>` + REGIONS.map((r, ri) => {
    const owner = S.players.findIndex((p, i) => p.alive && regionsOf(i).includes(ri));
    return `<div class="lr"><span class="dot" title="${owner >= 0 ? esc(P(owner).name) : "Aucun maître"}">${owner >= 0 ? shieldSVG(owner, 11) : ""}</span>${r.name} <b>+${r.bonus}</b></div>`;
  }).join("");
}
let trayShown = null, trayHid = false, trayT = 0;
function renderTray() {
  const tr = $("tray"), t = S.tray;
  if (!t) { tr.className = ""; return; }
  // téléphone : le bandeau des dés se retire seul après 4 s (ou au toucher) pour rendre le bas de la carte
  if (typeof window !== "undefined" && window.innerWidth <= 900) {
    if (trayShown !== t) { trayShown = t; trayHid = false; clearTimeout(trayT); trayT = setTimeout(() => { trayHid = true; tr.className = ""; }, 4000); tr.onclick = () => { trayHid = true; tr.className = ""; }; }
    if (trayHid) { tr.className = ""; return; }
  }
  tr.className = "show";
  if (t.kind === "battle") {
    tr.innerHTML = `<div class="side"><span class="lab">Attaque</span>${t.A.map((v, k) => dieHTML(v, "att", k === 0 ? t.mA : 0, t.lostA.includes(k))).join("")}</div>
      <div class="side"><span class="lab">Défense</span>${t.D.map((v, k) => dieHTML(v, "def", k === 0 ? t.mD : 0, t.lostD.includes(k))).join("")}</div><div class="res">${t.txt}</div>`;
  } else if (t.kind === "pol") {
    tr.innerHTML = `<div class="side"><span class="lab">Intrigue</span>${dieHTML(t.v, "pol")}</div><div class="res">${t.txt}</div>`;
  } else if (t.kind === "vote") {
    tr.innerHTML = `<div class="side"><span class="lab">Pour ${t.pour}</span>${dieHTML(t.dp, "pol")}</div><div class="side"><span class="lab">Contre ${t.contre}</span>${dieHTML(t.dc, "def")}</div><div class="res">Édit ${t.pass ? "adopté" : "rejeté"}.</div>`;
  }
}
function renderLog() {
  $("log").innerHTML = S.log.map(l => l.html.startsWith('<span class="r">') ? `<div>${l.html}</div>` : `<div${l.cls === "warn" ? ' style="color:#f0c27a"' : ""}>${l.html}</div>`).join("");
  $("log").scrollTop = $("log").scrollHeight;
}
let lastSnap = null;
function render() {
  if (!S) return;
  if (!S.over && !cur().ai && !S.busy && !S.pending) { try { lastSnap = JSON.stringify(S); } catch (e) {} }
  renderMap(); renderPlayers(); renderLegend(); renderTray(); renderPanel(); renderLog();
}

function renderPanel() {
  const o = S.cur, p = cur(), c = PCOL[p.color];
  const ph = PHASES.indexOf(S.phase);
  let h = `<div class="turnhead">${shieldSVG(o, 22)}<h2>${esc(p.name)}</h2><span class="rd">Manche ${S.round}/${MAX_ROUNDS}</span></div>
    <div class="phases">${PHASES.map((x, k) => `<span class="${k === ph ? "on" : k < ph ? "done" : ""}">${PHASE_LBL[x]}</span>`).join("")}</div>`;
  if (S.claim) { const c2 = P(S.claim.o); h += `<div class="card claimCard"><p class="small"><b>♛ ${esc(c2.name)} réclame la Couronne.</b> ${S.claim.o === o ? `Tiens ${TERR[c2.capital].n} avec au moins ${CROWN_HOLD} de stabilité jusqu'à ton prochain tour.` : `Elle sera sacrée au début de son prochain tour si elle tient ${TERR[c2.capital].n} avec ${CROWN_HOLD}+ de stabilité (actuellement ${c2.stab}).`}</p></div>`; }
  if (S.active && S.active.round === S.round) h += `<div class="card edict"><p class="small"><span class="muted">Édit en vigueur :</span> <b>${S.active.name}</b>${S.active.target !== undefined ? ` (${esc(P(S.active.target).name)})` : ""}</p></div>`;
  if (S.over) { $("pbody").innerHTML = h + `<div class="card"><h3>Partie terminée</h3><p>Lance une nouvelle partie depuis l'en-tête.</p></div>`; drawerGo(); return; }
  if (p.ai) {
    const feed = S.log.filter(l => (l.n || 0) >= (S.turnStart || 0)).slice(-9).map(l => `<div>${l.html}</div>`).join("") || `<div class="muted">Délibérations en cours…</div>`;
    h += `<div class="card"><h3>${esc(p.name)} joue</h3><div class="feed">${feed}</div><p class="small muted">Change la vitesse de l'IA en haut à droite.</p></div>`;
    $("pbody").innerHTML = h + crownCard(o); drawerGo(); return;
  }
  if (S.phase === "politique") h += politicsPanel(o);
  else if (S.phase === "renforts") {
    h += `<div class="card"><h3>Renforts</h3>
      <div class="row"><span class="big">${S.reinf}</span><span class="muted small">armées à placer<br>(${Math.max(3, Math.floor(ownedBy(o).length / 3))} de base${regionsOf(o).length ? " + régions " + regionsOf(o).map(r => REGIONS[r].name).join(", ") : ""})</span></div>
      ${(nr => nr ? `<p class="small">Il te manque <b>${nr.miss}</b> territoire${nr.miss > 1 ? "s" : ""} pour tenir ${nr.name} (<b>+${nr.bonus}</b> par tour).</p>` : "")(nearestRegion(o))}
      <p class="small muted">Clique sur tes territoires pour y poser des armées.</p>
      <div class="row"><span class="small">Par clic :</span><div class="seg">${[[1, "1"], [3, "3"], [0, "Tout"]].map(([v, l]) => `<button data-step="${v}" class="${S.step === v ? "on" : ""}">${l}</button>`).join("")}</div>
      <button id="autoPlace" ${S.reinf ? "" : "disabled"}>Placement auto</button>
      <button id="undoPlace" ${S.reinfSnap && S.reinf < S.reinfSnap.reinf ? "" : "disabled"}>Annuler</button></div></div>
      <button class="primary" id="toAttack" ${S.reinf ? "disabled" : ""}>Passer à l'attaque →</button>`;
  } else if (S.phase === "attaque") {
    if (S.pending) {
      const { f, t } = S.pending, max = S.t[f].a - 1;
      h += `<div class="card"><h3>Occuper ${TERR[t].n}</h3><p class="small">Combien d'armées supplémentaires envoyer depuis ${TERR[f].n} ?</p>
        <div class="row"><input type="range" id="occN" min="0" max="${max}" value="${max}" style="flex:1"><b id="occV">${max}</b></div>
        <button class="primary" id="occOk">Confirmer</button></div>`;
    } else {
      h += `<div class="card"><h3>Attaque</h3>`;
      if (firstTurnLock(o)) h += `<p class="small">Première manche : la Maison qui ouvre la partie ne peut pas attaquer. Passe à la manœuvre.</p>`;
      else if (S.sel < 0) h += `<p class="small">Choisis un territoire d'où lancer l'assaut (au moins 2 armées).</p>`;
      else if (S.tgt < 0) h += `<p class="small">Depuis <b>${TERR[S.sel].n}</b> (${S.t[S.sel].a}) : choisis une cible voisine marquée en pointillés.</p>`;
      else {
        const F = S.t[S.sel], T = S.t[S.tgt], na = Math.min(3, F.a - 1), nd = Math.min(2, T.a);
        const mods = [];
        if (capitalOf(S.tgt) === T.o && T.o >= 0) mods.push("capitale : défense +1");
        if (edictOn("martiale")) mods.push("loi martiale : défense +1");
        if (edictOn("conquete")) mods.push("droit de conquête : attaque +1");
        h += `<p><b>${TERR[S.sel].n}</b> (${F.a}) → <b>${TERR[S.tgt].n}</b> (${T.a}, ${esc(pname(T.o))})</p>
          <p class="small muted">${na} dé${na > 1 ? "s" : ""} contre ${nd}. ${mods.join(" · ")}</p>
          ${(() => { const od = conquestOdds(S.sel, S.tgt); return `<div class="odds"><span>Assaut total</span><div class="meter"><i style="width:${Math.round(od.p * 100)}%"></i></div><b>${Math.round(od.p * 100)} %</b></div><p class="small muted">En cas de succès, il te resterait environ ${od.left.toFixed(1)} armées.</p>`; })()}
          <div class="row"><button class="primary" id="roll">Lancer les dés</button><button id="blitz">Assaut total</button></div>`;
      }
      h += `<p class="small muted">${S.conq} conquête${S.conq > 1 ? "s" : ""} ce tour${S.conq >= 3 ? " — attention, 4 conquêtes ou plus coûtent 1 stabilité" : ""}.</p></div>
        <button class="primary" id="toMove">Passer à la manœuvre →</button>`;
    }
  } else if (S.phase === "manoeuvre") {
    h += `<div class="card"><h3>Manœuvre</h3>`;
    if (S.moved) h += `<p class="small">Manœuvre effectuée.</p>`;
    else if (S.sel < 0) h += `<p class="small">Un seul déplacement : choisis un territoire de départ, puis un territoire relié par tes terres.</p>`;
    else if (S.tgt < 0) h += `<p class="small">Depuis <b>${TERR[S.sel].n}</b> : choisis la destination.</p>`;
    else {
      const max = S.t[S.sel].a - 1;
      h += `<p class="small"><b>${TERR[S.sel].n}</b> → <b>${TERR[S.tgt].n}</b></p>
        <div class="row"><input type="range" id="movN" min="1" max="${max}" value="${Math.min(S.moveN, max)}" style="flex:1"><b id="movV">${Math.min(S.moveN, max)}</b></div>
        <button id="movOk">Déplacer</button>`;
    }
    h += `</div><button class="primary" id="endT">Terminer le tour ✓</button>`;
  }
  $("pbody").innerHTML = h + crownCard(o);
  bindPanel();
  // téléphone : le choix des armées à faire entrer ouvre le tiroir, qui se referme ensuite
  drawerGo();
  const pend = !!S.pending;
  if (pend !== drawerAuto && typeof window !== "undefined" && window.innerWidth <= 900) { drawerAuto = pend; setDrawer(pend); }
}
let drawerAuto = false;
function crownCard(o) {
  const p = P(o), capOk = S.t[p.capital].o === o;
  return `<div class="card"><h3>Voie de la Couronne</h3>
    <div class="crown"><span>Capitale ${TERR[p.capital].n}</span><span></span><b class="${capOk ? "ok" : "ko"}">${capOk ? "tenue" : "perdue"}</b>
    <span>Stabilité</span><div class="meter"><i style="width:${p.stab * 10}%"></i></div><b class="${p.stab >= CROWN_STAB ? "ok" : ""}">${p.stab}/${CROWN_STAB}</b>
    <span>Influence</span><div class="meter"><i style="width:${Math.min(100, p.inf / CROWN_INF * 100)}%"></i></div><b class="${p.inf >= CROWN_INF ? "ok" : ""}">${p.inf}/${CROWN_INF}</b></div>
    <p class="small muted">Les trois conditions réunies au début de ton tour te permettent de proclamer ta souveraineté (${CROWN_COST} influence) ; tu es sacrée si tu tiens encore une manche. Victoire militaire à ${DOMINATION} territoires (${ownedBy(o).length} actuellement).</p>
    ${!p.ai && p.inf >= 9 ? `<p class="small" style="color:var(--gold)">${p.inf >= CROWN_INF && capOk && p.stab < CROWN_STAB ? `Tu as assez d'influence pour proclamer ta souveraineté : il te manque ${CROWN_STAB - p.stab} de stabilité (Propagande : +2).` : p.inf >= CROWN_INF && !capOk ? "Tu as assez d'influence pour proclamer, mais il faut d'abord reprendre ta capitale." : `Ton influence (${p.inf} ⚜) attend un usage : mercenaires, ordre du jour, ou réserve pour la proclamation (${CROWN_INF} ⚜).`}</p>` : ""}
    <p class="small muted">Fin de règne à la manche ${MAX_ROUNDS} : la Maison au meilleur score l'emporte. Ton score : <b>${reignScore(o)}</b> · meilleur rival : ${(() => { const r = alive().filter(i => i !== o).sort((a, b) => reignScore(b) - reignScore(a))[0]; return r !== undefined ? `${esc(P(r).name)} (${reignScore(r)})` : "aucun"; })()}.</p></div>`;
}
function politicsPanel(o) {
  const p = P(o), e = S.edict, v = S.votes[o];
  let pour = 0, contre = 0; Object.values(S.votes).forEach(x => { if (x.side === "pour") pour += x.w; if (x.side === "contre") contre += x.w; });
  let h = `<div class="card"><h3>Conseil des Couronnes</h3><div class="edict"><b>${e.name}</b><p class="small">${e.d}</p>${e.by !== undefined ? `<p class="small muted">Inscrit à l'ordre du jour par ${esc(P(e.by).name)}.</p>` : ""}</div>
    <div class="tally muted"><span>Pour : ${pour} ⚜</span><span>Contre : ${contre} ⚜</span><span>+ 1 dé chacun</span></div>`;
  if (v) h += `<p class="small">Ton vote : <b>${v.side === "abst" ? "abstention" : v.side}</b>${v.w ? ` (${v.w} ⚜)` : ""}.</p>`;
  else h += `<div class="row"><label class="small" for="vw">Engager</label><input type="number" id="vw" min="0" max="${p.inf}" value="${Math.min(1, p.inf)}" style="width:60px"><span class="small">⚜</span>
      <button data-vote="pour">Pour</button><button data-vote="contre">Contre</button><button data-vote="abst">S'abstenir</button></div>`;
  h += `</div>`;
  const cen = edictOn("censure");
  const acts = [
    ["propagande", "Propagande", "+2 stabilité. Une fois par tour.", p.inf >= COST.propagande && !S.used.propagande && p.stab < 10],
    ["mercenaires", "Mercenaires", "+3 armées en renfort, mais −1 stabilité (pillages). Une fois par tour.", p.inf >= COST.mercenaires && !S.used.mercenaires],
    ["soudoyer", "Soudoyer", "Rallier une garnison voisine de 2 armées max. Une fois par tour.", p.inf >= COST.soudoyer && !S.used.soudoyer && !cen],
    ["revolte", "Fomenter une révolte", "N'importe où chez un rival. 4+ : −2 armées et −1 stabilité. Une fois par tour.", p.inf >= COST.revolte && !S.used.revolte && !cen],
    ["ordre", "Ordre du jour", S.nextEdict ? `Déjà fixé par ${esc(P(S.nextEdict.by).name)} pour la prochaine manche.` : "Choisir parmi 3 l'édit que le Conseil examinera à la prochaine manche.", p.inf >= COST.ordre && !S.nextEdict],
  ];
  h += `<div class="card"><h3>Actions politiques <span class="muted" style="font-family:var(--f-body);letter-spacing:0">· ${p.inf} ⚜ disponibles</span></h3><div class="acts">
    ${acts.map(([id, n, d, ok]) => `<button class="act ${S.mode === id ? "on" : ""}" data-act="${id}" ${ok || S.mode === id ? "" : "disabled"}><b>${n}</b><span class="cost">${COST[id]} ⚜</span><span>${d}</span></button>`).join("")}
    </div>`;
  if (S.mode === "soudoyer") h += `<p class="small">Choisis une garnison voisine (pointillés). Seuil au dé : armées + 3${p.stab >= 7 ? ", −1 grâce à ta stabilité" : ""}, −1 contre les rebelles. <a href="#" id="cancelMode" style="color:var(--gold)">Annuler</a></p>`;
  if (S.mode === "revolte") h += `<p class="small">Choisis un territoire rival. 1 : complot éventé (−1 stabilité pour toi) · 2-3 : rien · 4-5 : −2 armées, −1 stabilité · 6 : −2 stabilité, le territoire peut passer aux rebelles. <a href="#" id="cancelMode" style="color:var(--gold)">Annuler</a></p>`;
  if (cen) h += `<p class="small muted">Censure impériale : les intrigues sont interdites cette manche.</p>`;
  h += `</div>`;
  // diplomatie
  const others = alive().filter(i => i !== o);
  const free = others.filter(i => !pactBetween(o, i));
  h += `<div class="card"><h3>Diplomatie</h3>`;
  pactsOf(o).forEach(x => { const q = x.a === o ? x.b : x.a; h += `<div class="row small"><span>🤝 ${esc(P(q).name)} jusqu'à la manche ${x.until}</span><button class="danger" data-break="${q}" style="margin-left:auto;padding:4px 8px">Rompre (−3 stab.)</button></div>`; });
  if (free.length) h += `<div class="row"><select id="pactTo">${free.map(i => { const c = pactChance(i, o); return `<option value="${i}">${esc(P(i).name)}${c === null ? "" : ` · ${c >= .9 ? "acceptera" : c >= .5 ? "hésitera" : "refusera sans doute"}`}</option>`; }).join("")}</select>
      <button id="pactGo" ${p.inf >= COST.pacte && !S.used.pacte ? "" : "disabled"}>Proposer un pacte (1 ⚜)</button></div>
      ${isOathbreaker(o) ? `<p class="small ko">Tu as trahi un pacte à la manche ${p.betrayed} : jusqu'à la manche ${p.betrayed + 6}, les autres Maisons refuseront presque toujours tes propositions.</p>` : ""}
      <p class="small muted">Pacte de 3 manches : pas d'attaque ni d'intrigue mutuelle, +1 influence par tour pour chacun.</p>`;
  h += `</div><p class="small muted">Renforts de ce tour : <b style="color:var(--ink)">${S.reinf}</b> armées${S.used.mercenaires ? " (mercenaires inclus)" : ""}.</p><button class="primary" id="toReinf">Passer aux renforts →</button>`;
  return h;
}
function bindPanel() {
  const on = (id, f) => { const el = $(id); if (el) el.onclick = f; };
  document.querySelectorAll("[data-vote]").forEach(b => b.onclick = () => {
    const side = b.dataset.vote; let w = side === "abst" ? 0 : clamp(parseInt($("vw").value) || 0, 0, cur().inf);
    vote(side, w); render();
  });
  document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (S.mode === a) { S.mode = null; return render(); }
    if (a === "propagande") doPropagande();
    else if (a === "mercenaires") doMercenaires();
    else if (a === "ordre") {
      const ch = agendaChoices();
      modal(`<h2>Ordre du jour</h2><p>Pour ${COST.ordre} influence, choisis l'édit que le Conseil examinera à la prochaine manche. Le vote reste ouvert à toutes les Maisons.</p>${ch.map(e => `<p><b>${e.name}</b> : ${e.d}</p>`).join("")}`,
        [["Renoncer", null]].concat(ch.map(e => [e.name, e.id, "primary"]))).then(id => { if (id) { setAgenda(S.cur, id); render(); } });
      return;
    }
    else S.mode = a;
    render();
  });
  document.querySelectorAll("[data-break]").forEach(b => b.onclick = async () => {
    const q = +b.dataset.break;
    const ok = await modal(`<h2>Trahir le pacte ?</h2><p>Rompre le pacte avec <b>${esc(P(q).name)}</b> coûte <b>3 stabilité</b> et lui offre 2 influence.</p>`, [["Garder ma parole", false], ["Trahir", true, "danger"]]);
    if (ok) { breakPact(S.cur, q); render(); }
  });
  document.querySelectorAll("[data-step]").forEach(b => b.onclick = () => { S.step = +b.dataset.step; render(); });
  on("cancelMode", e => { e.preventDefault(); S.mode = null; render(); });
  on("pactGo", () => proposePact(S.cur, +$("pactTo").value));
  on("toReinf", () => goPhase("renforts"));
  on("undoPlace", () => { if (!S.reinfSnap) return; S.reinfSnap.arm.forEach((a, i) => S.t[i].a = a); S.reinf = S.reinfSnap.reinf; render(); });
  on("autoPlace", () => { const b = S.t.map(x => x.a); autoPlace(S.cur); render(); placeFX(b); });
  on("toAttack", () => goPhase("attaque"));
  on("toMove", () => goPhase("manoeuvre"));
  on("endT", () => { S.tray = null; endTurn(); });
  on("roll", () => { if (S.busy) return; if (battle(S.sel, S.tgt)) afterConquest(); else if (S.t[S.sel].a < 2) { S.sel = S.tgt = -1; } render(); });
  on("blitz", async () => {
    if (S.busy) return;
    S.busy = true; const g = S;
    while (S === g && S.sel >= 0 && S.tgt >= 0 && S.t[S.sel].a >= 2 && S.t[S.tgt].o !== S.cur) { const won = battle(S.sel, S.tgt); render(); await wait(140); if (S !== g) return; if (won) { afterConquest(); break; } }
    if (S.sel >= 0 && S.t[S.sel].a < 2) S.sel = S.tgt = -1;
    S.busy = false; render();
  });
  const occ = $("occN"); if (occ) { occ.oninput = () => $("occV").textContent = occ.value; on("occOk", () => { const n = +occ.value, { f, t } = S.pending; S.t[f].a -= n; S.t[t].a += n; S.pending = null; S.sel = S.t[t].a >= 2 ? t : -1; S.tgt = -1; render(); }); }
  const mv = $("movN"); if (mv) { mv.oninput = () => { $("movV").textContent = mv.value; S.moveN = +mv.value; }; on("movOk", () => { const n = +mv.value; S.t[S.sel].a -= n; S.t[S.tgt].a += n; log(`${esc(cur().name)} déplace ${n} armée(s) de ${TERR[S.sel].n} vers ${TERR[S.tgt].n}.`); S.moved = true; S.sel = S.tgt = -1; render(); }); }
}
function afterConquest() {
  if (S.over) return;
  S.tgt = -1;
  if (!S.pending) S.sel = -1;
}
function autoPlace(o) {
  const mine = ownedBy(o);
  while (S.reinf > 0) {
    let best = mine[0], bs = -1e9;
    for (const t of mine) {
      const en = ADJ[t].filter(j => S.t[j].o !== o && !pactBetween(o, S.t[j].o));
      if (!en.length) continue;
      const threat = en.reduce((s, j) => s + S.t[j].a, 0) - S.t[t].a + rnd(3);
      if (threat > bs) { bs = threat; best = t; }
    }
    S.t[best].a++; S.reinf--;
  }
}

// ===================== IA =====================
function isOathbreaker(o) { return RULES.rep && P(o).betrayed !== undefined && S.round - P(o).betrayed < 6; }
// estimation affichée au joueur : probabilité qu'une IA accepte son pacte
function pactChance(me, from) {
  if (!P(me).ai) return null;
  if (isOathbreaker(from)) return .2;
  const shares = ownedBy(me).some(t => ADJ[t].some(j => S.t[j].o === from));
  if (!shares) return .6;
  return strength(from) >= strength(me) * .85 ? 1 : .3;
}
function aiAcceptPact(me, from) {
  // réputation : une Maison parjure depuis moins de 6 manches est rarement crue
  if (isOathbreaker(from) && Math.random() > .2) return false;
  const shares = ownedBy(me).some(t => ADJ[t].some(j => S.t[j].o === from));
  if (!shares) return Math.random() < .6;
  return strength(from) >= strength(me) * .85 || Math.random() < .3;
}
function edictPref(id, o) {
  const avg = alive().reduce((s, i) => s + ownedBy(i).length, 0) / alive().length, mine = ownedBy(o).length;
  switch (id) {
    case "impot": return P(o).stab >= 5 ? 1 : -1;
    case "marchands": { const rich = alive().sort((a, b) => P(b).inf - P(a).inf)[0]; return rich === o ? -1 : 1; }
    case "embargo": return leader() === o ? -1 : 1;
    case "amnistie": return P(o).stab < 7 ? 1 : 0;
    case "treve": case "martiale": return mine < avg ? 1 : -1;
    case "conquete": return mine >= avg ? 1 : -1;
    case "levee": return regionsOf(o).length ? -1 : 1;
    case "censure": return P(o).stab <= 5 ? 1 : -1;
  }
  return 0;
}
function crownRace(o) {
  const p = P(o);
  if ((p.pv === "cp" || (p.lvl === "ruse" && p.pv !== "nocp")) && S.t[p.capital].o === o && p.stab >= 6 && p.inf >= 6 && bst(p.capital, o) <= S.t[p.capital].a) return true;
  return S.t[p.capital].o === o && p.inf >= CROWN_INF - 5 && p.stab >= 5; }
async function aiTurn() {
  const g = S;
  const W8 = async ms => { await wait(ms); if (S !== g || g.over) throw "stop"; };
  try { await aiTurnBody(W8); } catch (e) { if (e !== "stop") throw e; }
}
async function aiTurnBody(W8) {
  const o = S.cur, p = cur(), sp = speed();
  S.busy = true;
  render(); await W8(sp);
  // --- politique
  const V = p.pv || "";
  const pref = edictPref(S.edict.id, o);
  const saving = crownRace(o) || (V === "crown" && S.t[p.capital].o === o && p.stab >= 6);
  let w = 0;
  if (pref !== 0 && !saving && p.inf >= 4) w = Math.min(2, p.inf - 3);
  if (V === "eco") w = 0;
  if (V === "vote" && pref !== 0 && ["embargo", "levee", "marchands", "treve", "impot"].includes(S.edict.id)) w = Math.max(0, Math.min(4, p.inf - 2));
  vote(pref > 0 ? "pour" : pref < 0 ? "contre" : "abst", w, o);
  if (p.stab <= 4 && p.inf >= COST.propagande) doPropagande(o);
  if (saving && p.stab < CROWN_STAB && p.inf >= COST.propagande + 1 && !S.used.propagande) doPropagande(o);
  // trahison opportuniste
  for (const x of [...pactsOf(o)]) {
    const q = x.a === o ? x.b : x.a;
    if (S.claim && S.claim.o === q && p.stab >= 4) { breakPact(o, q); render(); await W8(sp); continue; }
    if (saving || p.stab < 6 || Math.random() > .5 || V === "pacts") continue;
    const juicy = ownedBy(o).some(f => ADJ[f].some(t => S.t[t].o === q && S.t[f].a - S.t[t].a >= 3 && (P(q).capital === t || TERR.filter((z, i) => z.r === TERR[t].r && S.t[i].o !== o).length === 1)));
    if (juicy) { breakPact(o, q); render(); await W8(sp); }
  }
  // freiner un rival proche de la couronne, sinon affaiblir l'hégémon
  const threat = alive().find(i => i !== o && P(i).inf >= CROWN_INF - (V === "watch" ? 6 : 4) && P(i).stab >= CROWN_STAB - (V === "watch" ? 2 : 1) && !pactBetween(o, i));
  const lead = leader();
  const foe = S.claim && S.claim.o !== o && !pactBetween(o, S.claim.o) ? S.claim.o : threat !== undefined ? threat : (lead !== o && !pactBetween(o, lead) && p.inf >= 5 && !saving && Math.random() < .5 ? lead : undefined);
  if (foe !== undefined && p.inf >= COST.revolte && !S.used.revolte && !edictOn("censure")) {
    const ts = ownedBy(foe).filter(t => validRevolt(t, o)).sort((a, b) => S.t[b].a - S.t[a].a);
    if (ts.length) { doRevolt(ts[0], o); render(); await W8(sp); }
  }
  if (!S.nextEdict && !saving && p.inf >= COST.ordre + 1 && p.lvl !== "facile" && Math.random() < .35) {
    const best = EDICTS.filter(e => e.id !== S.edict.id).map(e => ({ e, v: edictPref(e.id, o) + (e.id === "embargo" && leader() !== o ? 1 : 0) + (e.id === "levee" && !regionsOf(o).length ? .5 : 0) })).sort((a, b) => b.v - a.v)[0];
    if (best && best.v >= 1.5) setAgenda(o, best.e.id);
  }
  if (!saving && !(["facile", "f2"].includes(p.lvl) && Math.random() < .5) && !(p.lvl === "f3" && Math.random() < .7) && !(p.lvl === "naif" && Math.random() < .3)) {
    if (p.inf >= COST.soudoyer && !S.used.soudoyer) {
      const tg = TERR.map((_, i) => i).filter(i => validBribe(i, o) && bribeNeed(i, o) <= (V === "eco" ? 3 : 4)).sort((a, b) => bribeNeed(a, o) - bribeNeed(b, o))[0];
      if (tg !== undefined) { doBribe(tg, o); render(); await W8(sp); }
    }
    const mercMargin = V === "merc" ? 0 : V === "h2" ? (p.stab >= 6 ? 3 : 99) : p.lvl === "ruse" ? (p.stab >= 5 ? 0 : 99) : 2;
    if (V !== "eco" && p.inf >= COST.mercenaires + mercMargin && !S.used.mercenaires) doMercenaires(o);
    if (p.inf >= 1 && !S.used.pacte && V !== "nopact") {
      const nb = alive().filter(i => i !== o && !pactBetween(o, i) && ownedBy(o).some(t => ADJ[t].some(j => S.t[j].o === i)));
      nb.sort((a, b) => strength(b) - strength(a));
      const scared = nb.length && strength(nb[0]) > strength(o) * 1.25;
      if (nb.length && !isOathbreaker(nb[0]) && (scared ? Math.random() < .6 : Math.random() < (V === "pacts" || (p.lvl === "ruse" && V !== "fewpacts") ? (P(nb[0]).ai ? .45 : .25) : .15))) { render(); await proposePact(o, nb[0], scared ? "fear" : "border"); await W8(0); }
    }
  }
  render(); await W8(sp);
  // --- renforts
  goPhase("renforts");
  const before = S.t.map(x => x.a);
  if (S.claim && S.claim.o === o) { if (p.stab < 10 && p.inf >= COST.propagande && !S.used.propagande) doPropagande(o); S.t[p.capital].a += S.reinf; S.reinf = 0; }
  const plan = aiBestAttack(o, true);
  const lv = p.lvl === "normal" || p.lvl === "facile" ? "classique" : p.lvl;
  if (plan && S.reinf) { const k = Math.ceil(S.reinf * (lv === "classique" ? .7 : lv === "facile" ? .4 : .5)); S.t[plan.f].a += k; S.reinf -= k; }
  if (lv === "classique") autoPlace(o); else bsrPlace(o, ["facile", "naif", "f2", "f3"].includes(lv));
  render(); placeFX(before); await W8(sp);
  // --- attaque
  goPhase("attaque");
  let guard = 0;
  while (!S.over && guard++ < 30) {
    if (S.conq >= 4 && ownedBy(o).length + 2 < DOMINATION && !(S.claim && S.claim.o !== o)) break;
    if (S.claim && S.claim.o === o && S.conq >= 1) break;
    const m = aiBestAttack(o, false);
    if (!m) break;
    S.sel = m.f; S.tgt = m.t;
    while (!S.over && S.t[m.f].a >= 2 && S.t[m.t].o !== o) {
      if (lv === "classique") { if (S.t[m.f].a < 3 && S.t[m.t].a > 1) break; }
      else if (conquestOdds(m.f, m.t).p < targetThr(o, m.t, lv) * .8) break;
      const won = battle(m.f, m.t); render(); await W8(sp * .6);
      if (won) {
        if (S.pending) {
          const { f, t } = S.pending, exposed = ADJ[f].some(j => S.t[j].o !== o && !pactBetween(o, S.t[j].o));
          let n = exposed ? Math.floor((S.t[f].a - 1) / 2) : S.t[f].a - 1;
          if (lv !== "classique" && exposed) { const bf = bst(f, o), bt = bst(t, o); n = Math.round((S.t[f].a - 1) * (bt + 1) / (bf + bt + 2)); }
          S.t[f].a -= n; S.t[t].a += n; S.pending = null;
        }
        break;
      }
    }
    S.sel = S.tgt = -1;
  }
  if (S.over) return;
  render(); await W8(sp);
  // --- manœuvre
  goPhase("manoeuvre");
  aiFortify(o);
  render(); await W8(sp);
  S.busy = false;
  endTurn();
}
// menace frontalière : somme des armées ennemies voisines (hors pactes)
function bst(t, o) { return ADJ[t].reduce((s, j) => s + (S.t[j].o !== o && !pactBetween(o, S.t[j].o) ? S.t[j].a : 0), 0); }
function aiThreshold(lv) { if (/^t\d+$/.test(lv)) return +lv.slice(1) / 100; if (lv === "ruse") {
    const n = alive().length, me = S.cur, mine = ownedBy(me).length;
    let t = n <= 2 ? .55 : n === 3 ? .68 : .75;
    if (mine >= DOMINATION - 6) t -= .2;            // la victoire militaire est à portée : on pousse
    if (S.round >= MAX_ROUNDS - 8) t -= .1;          // fin de règne en vue
    if (leader() === me && n > 2) t -= .05;
    return Math.max(.5, t);
  }
  // l'IA facile se trompe de tempo : prudente en duel, téméraire à plusieurs
  if (lv === "facile") return alive().length <= 2 ? .85 : .5;
  if (lv === "naif") return .6;
  if (lv === "f2") return .8;
  if (lv === "f3") return .65;
  return .58; }
// renforts répartis selon le ratio menace / garnison (Border Security Ratio)
function bsrPlace(o, sloppy) {
  const border = ownedBy(o).filter(t => bst(t, o) > 0);
  const pool = border.length ? border : ownedBy(o);
  while (S.reinf > 0) {
    let best = pool[0], bs = -1;
    for (const t of pool) { const r = bst(t, o) / S.t[t].a + (sloppy ? Math.random() * 2 : 0); if (r > bs) { bs = r; best = t; } }
    S.t[best].a++; S.reinf--;
  }
}
function aiBestAttack(o, planning) {
  const lv = P(o).lvl;
  if (lv !== "classique" && lv !== "normal" && lv !== "facile") return aiBestAttack2(o, planning, lv);
  let best = null, bs = -1e9;
  for (const f of ownedBy(o)) {
    const a = S.t[f].a;
    if (!planning && a < 2) continue;
    for (const t of ADJ[f]) {
      if (planning ? (S.t[t].o === o || pactBetween(o, S.t[t].o) || (edictOn("treve") && capitalOf(t) >= 0)) : !canAttack(f, t, o)) continue;
      const d = S.t[t].a, r = TERR[t].r;
      const inRegion = TERR.filter((x, i) => x.r === r && S.t[i].o === o).length, regSize = TERR.filter(x => x.r === r).length;
      let v = (a - d) * 1.2 + (inRegion / regSize) * 4 + (inRegion === regSize - 1 ? REGIONS[r].bonus * 1.5 : 0);
      if (capitalOf(t) >= 0 && capitalOf(t) !== o) v += 3;
      if (S.t[t].o < 0) v += .5;
      if (S.t[t].o >= 0 && S.t[t].o === leader() && leader() !== o) v += 1.5;
      if (S.claim && S.claim.o !== o && S.t[t].o === S.claim.o) v += t === P(S.claim.o).capital ? 12 : 2.5;
      const vsClaim = S.claim && S.claim.o !== o && S.t[t].o === S.claim.o;
      if (!planning && a - 1 <= d && !(vsClaim && a >= 3)) continue;
      if (!planning && a < 3 && d > 1) continue;
      if (v > bs) { bs = v; best = { f, t }; }
    }
  }
  return best;
}
function targetValue(o, t) {
  const r = TERR[t].r;
  const inRegion = TERR.filter((x, i) => x.r === r && S.t[i].o === o).length, regSize = TERR.filter(x => x.r === r).length;
  let v = 2 + (inRegion / regSize) * 3 + (inRegion === regSize - 1 ? REGIONS[r].bonus * 1.6 : 0);
  // briser la région d'un rival
  const ro = S.t[t].o; if (ro >= 0 && regionsOf(ro).includes(r)) v += REGIONS[r].bonus;
  if (capitalOf(t) >= 0 && capitalOf(t) !== o) v += 3;
  if (ro >= 0 && ro === leader() && leader() !== o) v += 1.5;
  if (S.claim && S.claim.o !== o && ro === S.claim.o) v += t === P(S.claim.o).capital ? 14 : 3;
  if (P(o).pv === "watch" && ro >= 0 && ro !== o && P(ro).inf >= CROWN_INF - 5) v += t === P(ro).capital ? 5 : 1.5;
  return v;
}
// pendant un Sacre adverse, toute perte infligée au prétendant compte : on accepte des combats risqués
function targetThr(o, t, lv) { const base = aiThreshold(lv); return S.claim && S.claim.o !== o && S.t[t].o === S.claim.o ? Math.min(base, .4) : base; }
function aiBestAttack2(o, planning, lv) {
  let best = null, bs = -1e9;
  for (const f of ownedBy(o)) {
    for (const t of ADJ[f]) {
      if (planning ? (S.t[t].o === o || pactBetween(o, S.t[t].o) || (edictOn("treve") && capitalOf(t) >= 0) || firstTurnLock(o)) : !canAttack(f, t, o)) continue;
      const [mA, mD] = battleMods(t);
      // en planification, on suppose que la moitié des renforts arrivera ici
      const a = S.t[f].a + (planning ? Math.ceil(S.reinf * .5) : 0);
      const [p, left] = oddsExact(a, S.t[t].a, mA, mD);
      if (!planning && p < targetThr(o, t, lv)) continue;
      if ((lv === "facile" && Math.random() < .3 || lv === "naif" && Math.random() < .15 || lv === "f2" && Math.random() < .3 || lv === "f3" && Math.random() < .5) && !planning) continue;
      const v = p * targetValue(o, t) + left * .08 - (1 - p) * 1.5;
      if (v > bs) { bs = v; best = { f, t }; }
    }
  }
  return best;
}
function aiFortify(o) {
  const mine = ownedBy(o);
  const isBorder = t => ADJ[t].some(j => S.t[j].o !== o);
  const interior = mine.filter(t => !isBorder(t) && S.t[t].a > 1).sort((a, b) => S.t[b].a - S.t[a].a);
  if (!interior.length) return;
  const f = interior[0];
  // BFS vers la frontière la plus menacée accessible
  const prev = { [f]: -1 }, q = [f]; let dest = -1;
  while (q.length) {
    const u = q.shift();
    if (u !== f && isBorder(u)) { dest = u; break; }
    for (const v of ADJ[u]) if (prev[v] === undefined && S.t[v].o === o) { prev[v] = u; q.push(v); }
  }
  if (dest < 0) return;
  const n = S.t[f].a - 1;
  S.t[f].a -= n; S.t[dest].a += n; S.moved = true;
  log(`${esc(P(o).name)} redéploie ${n} armée(s) de ${TERR[f].n} vers ${TERR[dest].n}.`);
}

// ===================== Fenêtres =====================
function modal(html, buttons) {
  return new Promise(res => {
    $("mbox").innerHTML = html + `<div class="btns">${buttons.map((b, k) => `<button data-k="${k}" class="${b[2] || ""}">${b[0]}</button>`).join("")}</div>`;
    $("modal").classList.remove("hidden");
    $("mbox").querySelectorAll("[data-k]").forEach(b => b.onclick = () => { $("modal").classList.add("hidden"); res(buttons[+b.dataset.k][1]); });
    const last = $("mbox").querySelector(".btns button:last-child"); if (last) last.focus({ preventScroll: true }); $("mbox").scrollTop = 0;
  });
}
function setupDialog() {
  let n = 4;
  const draw = () => {
    const rows = Array.from({ length: n }, (_, i) => `${shieldCol(i, 18)}
      <input id="pn${i}" value="${esc(HOUSES[i])}" aria-label="Nom du joueur ${i + 1}">
      <select id="pa${i}" aria-label="Type du joueur ${i + 1}"><option value="h" ${i === 0 ? "selected" : ""}>Humain</option><option value="facile">IA facile</option><option value="normal" ${i > 0 ? "selected" : ""}>IA normale</option><option value="ruse">IA rusée</option></select>`).join("");
    $("mbox").innerHTML = `<div class="crest" aria-hidden="true"><svg viewBox="0 0 120 60" width="120" height="60"><path d="M20,48 L20,22 L38,36 L60,8 L82,36 L100,22 L100,48Z" fill="#d4a548" stroke="#5a3d0e" stroke-width="2.4" stroke-linejoin="round"/><circle cx="60" cy="38" r="4.5" fill="#a8382f"/><circle cx="38" cy="42" r="3" fill="#2e5f9c"/><circle cx="82" cy="42" r="3" fill="#1f8468"/><path d="M14,54 H106" stroke="#5a3d0e" stroke-width="2"/></svg></div>
      <p class="kicker">Chronique des guerres de Valdorre</p><h2>Nouvelle partie</h2>
      <p>Cinq Maisons se disputent le continent de Valdorre par les armes, le vote et l'intrigue. Plusieurs humains peuvent jouer à tour de rôle sur le même écran.</p>
      <div class="row"><label for="np">Nombre de Maisons</label><select id="np">${[2, 3, 4, 5].map(k => `<option ${k === n ? "selected" : ""}>${k}</option>`).join("")}</select></div>
      <div class="setup">${rows}</div>
      <p class="small muted">À 2 joueurs, 8 territoires rebelles neutres (3 armées) sont ajoutés. Territoires et armées sont répartis au hasard ; chaque Maison reçoit une capitale, et les Maisons qui jouent plus tard reçoivent des armées de départ en plus.</p>
      <div class="btns"><button id="bancBtn" title="Mesure la fluidité sur cet appareil et envoie les résultats à Claude">🧪 Mode test</button><button id="rulesFromSetup">Lire les règles</button><button class="primary" id="go">Commencer</button></div>`;
    $("np").onchange = () => { n = +$("np").value; draw(); };
    $("bancBtn").onclick = () => { if (TK) runBanc(); };
    if (!TK) $("bancBtn").style.display = "none";
    $("rulesFromSetup").onclick = () => rulesDialog().then(() => { $("modal").classList.remove("hidden"); draw(); });
    $("go").onclick = () => {
      const cfg = Array.from({ length: n }, (_, i) => ({ name: ($("pn" + i).value.trim() || HOUSES[i]).slice(0, 22), ai: $("pa" + i).value !== "h", lvl: $("pa" + i).value === "h" ? "normal" : $("pa" + i).value, color: i }));
      $("modal").classList.add("hidden");
      S && (S.over = true);
      setTimeout(() => newGame(cfg), S && S.busy ? 900 : 0);
    };
  };
  $("modal").classList.remove("hidden");
  draw();
}
function rulesDialog() {
  return modal(`<h2>Règles de Couronnes &amp; Complots</h2>
  <p>Un jeu de conquête à la manière de Risk, où chaque Maison doit aussi tenir son peuple, acheter des voix au Conseil et comploter contre ses rivales. Les combats se règlent toujours aux dés.</p>
  <h3>Victoire</h3>
  <ul><li><b>Militaire</b> : contrôler ${DOMINATION} territoires sur ${NT} à la fin de ton tour, ou être la dernière Maison en jeu.</li>
  <li><b>Fin de règne</b> : si personne n'a gagné à la fin de la manche ${MAX_ROUNDS}, la Maison au meilleur score l'emporte. Score = territoires + bonus des régions contrôlées + 3 si tu tiens ta capitale + influence ÷ 3 (arrondi en dessous).</li>
  <li><b>Politique (le Sacre)</b> : au début de ton tour, si tu tiens ta capitale avec au moins ${CROWN_STAB} de stabilité et ${CROWN_INF} d'influence, tu peux proclamer ta souveraineté pour ${CROWN_COST} influence. Les rivales ont alors une manche complète pour réagir ; chaque territoire que tu perds pendant cette manche te coûte 1 stabilité. Si, au début de ton tour suivant, tu tiens toujours ta capitale avec au moins ${CROWN_HOLD} de stabilité, tu es sacrée. Sinon, la proclamation tombe et tu perds 1 stabilité. Une seule proclamation à la fois.</li></ul>
  <h3>Ressources</h3>
  <ul><li><b>Armées</b> : au début du tour, max(3, territoires ÷ 3) + bonus des régions entièrement contrôlées.</li>
  <li><b>Influence ⚜</b> : +1 par tour, +1 si tu tiens ta capitale, +1 par pacte actif, +1 si ta stabilité est ≥ 8, +1 si tu contrôles au moins une région entière. +1 de butin si tu as conquis au moins un territoire pendant ton tour, +2 en prenant une capitale ennemie.</li>
  <li><b>Stabilité</b> (0 à 10, départ 6) : +1 au début du tour si tu n'as rien perdu depuis ton tour précédent (jusqu'à 7). −3 si ta capitale tombe, −3 si tu trahis un pacte, −1 si tu fais 4 conquêtes ou plus dans un tour, −1 à chaque recours aux mercenaires, −1 ou −2 quand une révolte fomentée contre toi réussit, −1 pour toutes les Maisons si l'Impôt de guerre est adopté. À 3 ou moins, chaque territoire non-capitale gardé par 1 seule armée fait sécession sur 1-2 au dé et passe aux rebelles.</li></ul>
  <h3>Déroulement d'un tour</h3>
  <ul><li><b>1. Politique</b> : voter au Conseil, utiliser des actions politiques, proposer ou rompre des pactes.</li>
  <li><b>2. Renforts</b> : placer toutes ses armées.</li>
  <li><b>3. Attaque</b> : autant d'assauts que voulu vers des territoires voisins (ou reliés par une route maritime en pointillés). Pendant la première manche, la Maison qui ouvre la partie ne peut pas attaquer.</li>
  <li><b>4. Manœuvre</b> : un seul déplacement d'armées entre deux territoires reliés par tes terres.</li></ul>
  <h3>Combat</h3>
  <p>L'attaquant lance jusqu'à 3 dés (il doit toujours laisser 1 armée en arrière), le défenseur jusqu'à 2. On compare les dés du plus fort au plus faible ; chaque paire perdue coûte une armée, les égalités vont au défenseur. Une <b>capitale</b> ajoute +1 au meilleur dé de son défenseur. Après une conquête, tu déplaces au moins autant d'armées que de dés lancés.</p>
  <h3>Le Conseil des Couronnes</h3>
  <p>À chaque manche, un édit est mis au vote. Pendant ta phase politique, vote pour, contre ou abstiens-toi en engageant de l'influence (dépensée quoi qu'il arrive). En fin de manche : total « pour » + 1 dé contre total « contre » + 1 dé ; l'égalité rejette l'édit. Un édit adopté s'applique pendant toute la manche suivante (ou immédiatement s'il est marqué ainsi).</p>
  <table class="rt">${EDICTS.map(e => `<tr><td><b>${e.name}</b></td><td>${e.d}</td></tr>`).join("")}</table>
  <h3>Actions politiques</h3>
  <table class="rt">
  <tr><td><b>Propagande</b> (2 ⚜)</td><td>+2 stabilité. Une fois par tour.</td></tr>
  <tr><td><b>Mercenaires</b> (3 ⚜)</td><td>+3 armées à placer, mais les pillages coûtent 1 stabilité. Une fois par tour.</td></tr>
  <tr><td><b>Soudoyer</b> (4 ⚜)</td><td>Une fois par tour. Cible : territoire voisin d'au plus 2 armées, hors capitale. Lance 1 dé : il faut au moins armées + 3 (−1 contre des rebelles, −1 si ta stabilité est ≥ 7). Réussite : la garnison passe chez toi avec ses armées.</td></tr>
  <tr><td><b>Ordre du jour</b> (3 ⚜)</td><td>Une fois par manche pour toutes les Maisons (la première qui l'utilise). Tu choisis parmi 3 édits celui que le Conseil examinera à la manche suivante ; le vote reste ouvert à tous.</td></tr>
  <tr><td><b>Fomenter une révolte</b> (2 ⚜)</td><td>Une fois par tour. Cible : n'importe quel territoire d'une Maison rivale. 1 : complot éventé, −1 stabilité pour toi. 2-3 : rien. 4-5 : la cible perd 2 armées (garde au moins 1), son propriétaire perd 1 stabilité. 6 : idem mais −2 stabilité, et si le territoire tombe à 1 armée (hors capitale), il passe aux rebelles.</td></tr>
  </table>
  <p class="small muted">Chaque action politique est limitée à une fois par tour.</p>
  <h3>Pactes de non-agression</h3>
  <p>Proposer coûte 1 ⚜ (une proposition par tour). Un pacte accepté dure jusqu'à la fin de la deuxième manche suivante : pas d'attaque ni d'intrigue entre les signataires, et +1 influence par tour pour chacun. Le rompre est possible pendant ta phase politique, au prix de 3 stabilité ; la victime reçoit 2 influence. Une Maison qui trahit devient parjure pendant 6 manches : l'IA refuse alors presque toujours ses propositions de pacte.</p>
  <h3>Niveaux de l'IA</h3>
  <p><b>Facile</b> : joue comme la normale mais reçoit 30 % de renforts en moins. <b>Normale</b> : adversaire honnête. <b>Rusée</b> : calcule ses chances exactes au combat, renforce les frontières les plus menacées, adapte son audace au nombre de joueurs et se ligue contre toute Maison qui proclame sa souveraineté.</p>
  <h3>Rebelles</h3>
  <p>Territoires neutres gris. Ils ne jouent pas, mais se défendent aux dés et peuvent être soudoyés plus facilement.</p>`, [["Fermer", true, "primary"]]);
}

// ===================== Sons (Web Audio, désactivés par défaut) =====================
let soundOn = false, actx = null;
function sfx(kind) {
  if (!soundOn || typeof window === "undefined") return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime, out = actx.createGain(); out.gain.value = .18; out.connect(actx.destination);
    const tone = (f, at, dur, type = "triangle", vol = 1) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(vol, t0 + at + .01); g.gain.exponentialRampToValueAtTime(.001, t0 + at + dur); o.connect(g).connect(out); o.start(t0 + at); o.stop(t0 + at + dur + .05); };
    const noise = (at, dur, vol = .6) => { const b = actx.createBuffer(1, actx.sampleRate * dur, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const n = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; g.gain.value = vol; n.buffer = b; n.connect(f).connect(g).connect(out); n.start(t0 + at); };
    if (kind === "des") { for (let k = 0; k < 4; k++) noise(k * .055, .045, .5); }
    else if (kind === "conquete") { [392, 523, 659].forEach((f, k) => tone(f, k * .09, .35, "sawtooth", .35)); }
    else if (kind === "conseil") { tone(196, 0, .5, "sine", .9); tone(98, 0, .6, "sine", .6); }
    else if (kind === "sacre") { [523, 659, 784, 1047].forEach((f, k) => tone(f, k * .12, .9, "sine", .5)); }
    else if (kind === "intrigue") { tone(330, 0, .25, "square", .25); tone(311, .12, .3, "square", .25); }
  } catch (e) {}
}
// ===================== Zoom et déplacement =====================
const VB0 = { x: -26, y: -26, w: 1052, h: 712 };
let vb = { ...VB0 }, drag = null, justDragged = false;
// Le viewBox « engagé » est celui réellement dessiné. Pendant un geste, on déplace l'image déjà dessinée
// par une transformation CSS (composée par la carte graphique, sans redessiner la carte), puis on engage
// le nouveau viewBox 140 ms après le dernier mouvement.
let cvb = { ...VB0 }, geo = null, commitT = 0;
// proportions du cadre de la carte : sur un écran en hauteur (téléphone), la vue zoomée remplit tout le cadre
// au lieu de rester un bandeau aux proportions de la carte (vue d'ensemble : carte entière, centrée)
let arCache = 0;   // remis à zéro au redimensionnement (évite de relire la mise en page à chaque image d'un geste)
function mapAR() {
  const r0 = VB0.w / VB0.h;
  if (typeof window === "undefined" || window.innerWidth > 900) return r0;
  if (arCache) return arCache;
  const m = $("map"), W = m && m.clientWidth, H = m && m.clientHeight;
  return W > 0 && H > 0 ? (arCache = Math.min(r0, W / H)) : r0;
}
function clampVB() {
  vb.w = clamp(vb.w, VB0.w / 3.2, VB0.w); vb.h = vb.w / mapAR();
  vb.x = clamp(vb.x, VB0.x, VB0.x + VB0.w - vb.w);
  // cadre plus haut que la carte : centrée en vue d'ensemble, libre dans le cadre une fois zoomée (le pincement reste sous les doigts)
  if (vb.h > VB0.h) vb.y = vb.w >= VB0.w - 1 ? VB0.y - (vb.h - VB0.h) / 2 : clamp(vb.y, VB0.y + VB0.h - vb.h, VB0.y);
  else vb.y = clamp(vb.y, VB0.y, VB0.y + VB0.h - vb.h);
}
// ombre portée : un calque séparé, calé sur la zone dessinée (bien moins coûteux qu'un filtre sur la carte)
function placeShadow() {
  const m = $("map"), sh = $("mapShadow"); if (!m || !sh) return;
  const W = m.clientWidth, H = m.clientHeight, s0 = Math.min(W / VB0.w, H / VB0.h);
  sh.style.left = m.offsetLeft + (W - VB0.w * s0) / 2 + "px"; sh.style.top = m.offsetTop + (H - VB0.h * s0) / 2 + "px";
  sh.style.width = VB0.w * s0 + "px"; sh.style.height = VB0.h * s0 + "px";
}
// écran étroit (téléphone, volet latéral) : on démarre zoomé sur la capitale du premier joueur humain
function focusStart() {
  if (typeof window === "undefined" || window.innerWidth > 900) { vb = { ...VB0 }; return applyVB(true); }
  const h = S.players.findIndex(p => !p.ai), o = h >= 0 ? h : 0, [cx, cy] = MAP.centers[P(o).capital];
  const ar = mapAR();   // cadre en hauteur : zoom juste assez pour que la carte remplisse le cadre
  vb = { w: Math.min(VB0.w / 1.8, VB0.h * ar), h: 0, x: 0, y: 0 }; vb.h = vb.w / ar; vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
  applyVB(true);
}
// l'ombre portée suit la carte entière : masquée quand la vue zoomée remplit un cadre en hauteur (téléphone)
function shadowVis() { const sh = $("mapShadow"); if (sh) sh.style.visibility = vb.w < VB0.w - 1 && mapAR() < VB0.w / VB0.h - .01 ? "hidden" : ""; }
function measureGeo() {
  const m = $("map"), W = m.clientWidth, H = m.clientHeight, r = m.getBoundingClientRect();
  const s0 = Math.min(W / cvb.w, H / cvb.h);
  geo = { s0, ox: (W - cvb.w * s0) / 2, oy: (H - cvb.h * s0) / 2, left: r.left, top: r.top };
}
// taille des noms de territoires : au moins ~11,5 px à l'écran (téléphone, volet étroit), sans dépasser ×1,6
function labelScale() {
  const m = $("map"); if (!m || !m.clientWidth) return;
  const s = Math.min(m.clientWidth / cvb.w, m.clientHeight / cvb.h);
  m.style.setProperty("--lk", clamp(11.5 / (13 * s), 1, 1.6).toFixed(3));
}
function commitVB() {
  const m = $("map");
  cvb = { ...vb };
  m.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  labelScale();
  m.style.transform = ""; m.classList.remove("gesture");
  m.classList.toggle("zoomed", vb.w < VB0.w - 1);
  shadowVis();
  geo = null;
}
function applyVB(immediate) {
  clampVB();
  const m = $("map");
  if (immediate || typeof document === "undefined") return commitVB();
  if (!geo) measureGeo();
  const k = cvb.w / vb.w, tx = -k * (vb.x - cvb.x) * geo.s0, ty = -k * (vb.y - cvb.y) * geo.s0;
  m.classList.add("gesture");
  m.style.transformOrigin = `${geo.ox}px ${geo.oy}px`;
  m.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
  m.classList.toggle("zoomed", vb.w < VB0.w - 1);
  shadowVis();
  clearTimeout(commitT); commitT = setTimeout(commitVB, 140);
}
// coordonnées carte d'un point écran, d'après le viewBox visé (indépendant de la transformation en cours)
function svgPt(cx, cy) {
  if (!geo) measureGeo();
  const per = geo.s0 * cvb.w / vb.w;
  return { x: vb.x + (cx - geo.left - geo.ox) / per, y: vb.y + (cy - geo.top - geo.oy) / per };
}
function zoomAt(f, x, y) { const nw = clamp(vb.w * f, VB0.w / 3.2, VB0.w), k = nw / vb.w; vb.x = x - (x - vb.x) * k; vb.y = y - (y - vb.y) * k; vb.w = nw; applyVB(); }
function zoomCenter(f) { zoomAt(f, vb.x + vb.w / 2, vb.y + vb.h / 2); }
// Les textures de papier (feTurbulence) coûtent cher à chaque redessin : on les calcule une fois en image.
function bakeTextures() {
  const ns = "http://www.w3.org/2000/svg";
  document.querySelectorAll("#map rect[filter]").forEach(r => {
    const id = r.getAttribute("filter").match(/#([\w-]+)/)[1], f = document.getElementById(id);
    const x = +(r.getAttribute("x") || 0), y = +(r.getAttribute("y") || 0), w = +r.getAttribute("width"), h = +r.getAttribute("height");
    const sc = 1, src = `<svg xmlns="${ns}" width="${w * sc}" height="${h * sc}" viewBox="${x} ${y} ${w} ${h}"><defs>${f.outerHTML}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#${id})"/></svg>`;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = w * sc; c.height = h * sc; c.getContext("2d").drawImage(img, 0, 0);
        const im = document.createElementNS(ns, "image");
        im.setAttribute("href", c.toDataURL("image/png")); im.setAttribute("x", x); im.setAttribute("y", y); im.setAttribute("width", w); im.setAttribute("height", h);
        im.setAttribute("preserveAspectRatio", "none"); im.setAttribute("pointer-events", "none");
        if (r.getAttribute("opacity")) im.setAttribute("opacity", r.getAttribute("opacity"));
        im.setAttribute("style", r.getAttribute("style") || "");
        r.replaceWith(im);
      } catch (e) {}
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  });
}
// Plateau de table : veines de noyer calculées une seule fois en petite image répétée (aucun coût à l'affichage)
function bakeTable() {
  const b = $("board"); if (!b || !window.Image) return;
  const N = 384, src = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}"><filter id="w" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0045 .085" numOctaves="4" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .27  0 0 0 0 .175  0 0 0 0 .1  1.9 0 0 0 -.5"/></filter><rect width="${N}" height="${N}" fill="#160f0a"/><rect width="${N}" height="${N}" filter="url(#w)"/></svg>`;
  const img = new Image();
  img.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = N; c.getContext("2d").drawImage(img, 0, 0);
    b.style.backgroundImage = `radial-gradient(ellipse at 50% 45%,rgba(43,30,21,.15),rgba(12,8,5,.85) 85%),url(${c.toDataURL("image/png")})`; b.style.backgroundSize = `auto,${N}px ${N}px`; } catch (e) {} };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
}
function initZoom() {
  try { bakeTextures(); bakeTable(); } catch (e) {}
  const m = $("map");
  m.addEventListener("wheel", e => { e.preventDefault(); const p = svgPt(e.clientX, e.clientY); zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y); }, { passive: false });
  // pincement à deux doigts (téléphone, pavé tactile)
  const ptrs = new Map(); let pinch = null, lastTap = 0;
  const startPinch = () => {
    const [a, b] = [...ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, w0: vb.w, p: svgPt(mx, my) }; drag = null;
  };
  m.addEventListener("pointerdown", e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { startPinch(); return; }
    if (e.button === 0 && ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false };
  });
  window.addEventListener("pointermove", e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      vb.w = clamp(pinch.w0 * pinch.d0 / d, VB0.w / 3.2, VB0.w); vb.h = vb.w / mapAR();
      if (!geo) measureGeo();
      const per = geo.s0 * cvb.w / vb.w;
      vb.x = pinch.p.x - (mx - geo.left - geo.ox) / per; vb.y = pinch.p.y - (my - geo.top - geo.oy) / per;
      justDragged = true; applyVB(); return;
    }
    if (!drag || vb.w >= VB0.w - 1) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true; m.classList.add("dragging");
    if (!geo) measureGeo();
    const k = vb.w / (cvb.w * geo.s0);
    vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; applyVB();
  });
  const up = e => {
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) { pinch = null; setTimeout(() => justDragged = false, 0); } return; }
    if (drag && drag.moved) { justDragged = true; setTimeout(() => justDragged = false, 0); }
    else if (e.pointerType === "touch" && drag) {
      // double appui au doigt : zoom (le dblclick n'est pas fiable sur écran tactile)
      const now = performance.now();
      if (now - lastTap < 300) { const p = svgPt(e.clientX, e.clientY); zoomAt(vb.w < VB0.w / 2.6 ? 3 : 1 / 1.7, p.x, p.y); lastTap = 0; } else lastTap = now;
    }
    drag = null; m.classList.remove("dragging");
  };
  window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  m.addEventListener("click", e => { if (justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  m.addEventListener("dblclick", e => { const p = svgPt(e.clientX, e.clientY); zoomAt(1 / 1.6, p.x, p.y); });
  $("zIn").onclick = () => zoomCenter(1 / 1.3); $("zOut").onclick = () => zoomCenter(1.3); $("zReset").onclick = () => { vb = { ...VB0 }; applyVB(true); $("zIn").focus(); };   // ⤢ disparaît en vue d'ensemble : le focus passe à +
  let rzT = 0;
  window.addEventListener("resize", () => { geo = null; arCache = 0; placeShadow(); clearTimeout(rzT); rzT = setTimeout(() => {
    const ar = mapAR(), cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    if (Math.abs(vb.w / vb.h - ar) < 1e-3) return labelScale();   // proportions inchangées (ordinateur) : rien à redessiner
    clampVB(); vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2; applyVB(true); }, 120); });
  m.addEventListener("contextmenu", e => { if (tapType === "touch") e.preventDefault(); });
  // tiroir du panneau (téléphone)
  $("drawer").onclick = () => setDrawer(!$("aside").classList.contains("open"));
  // fiche de territoire au doigt : appui long n'importe quand, ou appui qui ne déclenche aucune action
  let lp = null;
  const hideTip = () => { $("tip").style.display = "none"; };
  m.addEventListener("pointerdown", e => {
    hideTip(); tapType = e.pointerType; lpFired = false;
    clearTimeout(lp && lp.t); lp = null;
    if (e.pointerType !== "touch") return;
    const i = terrAt(e.target); if (i < 0) return;
    const x = e.clientX, y = e.clientY;
    lp = { x, y, t: setTimeout(() => { lpFired = true; tip({ clientX: x, clientY: y }, i, true); }, 480) };
  });
  window.addEventListener("pointermove", e => { if (e.pointerType === "mouse") tapType = "mouse"; if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) { clearTimeout(lp.t); lp = null; } });
  const lpEnd = () => { if (lp) clearTimeout(lp.t); lp = null; if (lpFired) setTimeout(() => lpFired = false, 400); };
  window.addEventListener("pointerup", lpEnd); window.addEventListener("pointercancel", lpEnd);
  m.addEventListener("click", e => { if (lpFired) { e.stopPropagation(); e.preventDefault(); } }, true);
  placeShadow(); setTimeout(placeShadow, 300);
  $("legBtn").onclick = () => { const L = $("legend"); L.classList.toggle("closed"); $("legBtn").setAttribute("aria-expanded", !L.classList.contains("closed")); };
  $("legend").onclick = () => $("legBtn").click();
  $("legend").title = "Cliquer pour masquer";
  if (window.innerWidth < 1350) $("legend").classList.add("closed");
}

// ===================== Trousse de test (outils-communs/testkit.js) =====================
let TK = null;
function initTestkit() {
  if (typeof Testkit === "undefined") return;
  TK = Testkit({
    jeu: "couronnes", secours: true, canvas: () => document.createElement("canvas"), capture: () => svgCapture($("map")),
    etat: () => S && { manche: S.round, phase: S.phase, joueur: S.cur, fin: S.over, zoom: +(VB0.w / vb.w).toFixed(2),
      maisons: S.players.map((p, i) => ({ nom: p.name, ia: p.ai, niveau: p.lvl, terr: ownedBy(i).length, armees: armiesOf(i), inf: p.inf, stab: p.stab, vivante: p.alive })) },
  });
  const b = TK.bouton($("hbtnTK"), " ");
  b.title = "Signaler un problème à Claude (capture de la carte + état de la partie)";
}
// banc de mesure sur l'appareil : tour d'IA, zoom continu, carte au repos (5 s chacun), résultats envoyés à Claude
async function runBanc() {
  $("modal").classList.add("hidden");
  if (S) S.over = true;
  await wait(500);
  TK.modeTest();
  TK.surSuspension = () => { try { $("tip").style.display = "none"; } catch (e) {} };
  $("speed").value = "320";
  newGame([0, 1, 2, 3].map(i => ({ name: HOUSES[i], ai: true, lvl: "ruse", color: i })));
  let zoomOn = false;
  const loop = () => { if (!zoomOn) return; const k = performance.now() / 1000; vb.w = VB0.w / (1.8 + .6 * Math.sin(k * 1.3)); vb.x = VB0.x + 220 + 160 * Math.sin(k * .8); vb.y = VB0.y + 130 + 90 * Math.cos(k * .9); applyVB(); requestAnimationFrame(loop); };
  const res = await TK.banc([
    { nom: "tour de l'IA", preparer: async () => {} },
    { nom: "zoom et déplacement", preparer: async () => { zoomOn = true; requestAnimationFrame(loop); } },
    { nom: "carte au repos", preparer: async () => { zoomOn = false; S.over = true; vb = { ...VB0 }; applyVB(true); } },
  ], 5000);
  const rows = res.res.map(r => `<tr><td>${esc(r.scene)}</td><td>${r.fps ?? "—"}</td><td>${r.bas1 ?? "—"}</td><td>${r.pire ?? "—"} ms${r.masquee ? " ⚠" : ""}</td></tr>`).join("");
  await modal(`<h2>Banc de mesure</h2><p class="muted">${esc(res.gpu)} · ${esc(res.ecran)}</p>
    <table class="rt"><tr><th>Scène</th><th>img/s</th><th>1 % les plus lents</th><th>pire image</th></tr>${rows}</table>
    ${res.res.some(r => r.masquee) ? `<p class="muted">⚠ Le navigateur a suspendu l'affichage pendant une mesure (fenêtre masquée ou en arrière-plan) : garde le jeu visible pendant les 25 secondes du banc.</p>` : ""}
    <p>${res.enregistre ? "Résultats envoyés à Claude ✓" : "Résultats gardés sur cet appareil (envoi impossible ici)."}</p>`, [["Nouvelle partie", true, "primary"]]);
  setupDialog();
}

// ===================== Lancement =====================
function boot(data) {
  try { initTestkit(); } catch (e) {}
  buildBoard();
  initZoom();
  $("btnRules").onclick = () => rulesDialog();
  $("btnNew").onclick = () => setupDialog();
  try { soundOn = localStorage.getItem("cc-son") === "1"; } catch (e) {}
  const sb = $("btnSound"); const paint = () => { sb.textContent = soundOn ? "🔈" : "🔇"; sb.title = soundOn ? "Sons activés (cliquer pour couper)" : "Sons coupés (cliquer pour activer)"; sb.setAttribute("aria-label", sb.title); sb.setAttribute("aria-pressed", soundOn); };
  paint(); sb.onclick = () => { soundOn = !soundOn; try { localStorage.setItem("cc-son", soundOn ? "1" : "0"); } catch (e) {} paint(); sfx("conseil"); };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && S && !cur().ai && $("modal").classList.contains("hidden")) { S.sel = S.tgt = -1; S.mode = null; render(); } });
  window.claude?.hot?.snapshot?.(() => lastSnap ? { S: JSON.parse(lastSnap) } : {});
  if (data && data.S && !data.S.over) { S = data.S; S.busy = false; render(); return; }
  // partie de démonstration en arrière-plan, puis écran de configuration
  newGame([0, 1, 2, 3].map(i => ({ name: HOUSES[i], ai: i > 0, color: i })));
  setupDialog();
}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
