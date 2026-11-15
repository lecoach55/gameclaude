// Bot injecté dans la page : joue avec une stratégie donnée et collecte des statistiques
window.BOT = {
 strat: 'prudent',
 stats: { seasons: [], events: {}, matches: { h: 0, d: 0, a: 0, goals: 0, n: 0 }, mine: { w: 0, d: 0, l: 0 }, refused: 0, signings: 0, sales: 0, builds: 0, loans: 0, renewFail: 0, expired: 0, attUtil: [], blocked: {}, cupBest: 0 },
 income() {
  const L = LV[S.div];
  return S.sponsorAnnual + S.sponsorBonus + S.naming + L.sub * S.subsidyMult + L.tv + S.fans * MERCH[S.infra.commerce] * (1 + S.div * .4)
   + Math.min(cap(), S.fans * .7) * (S.ticket + BUV[S.infra.commerce]) * S.N / 2;
 },
 costs() { return (wageBill() + staffBill()) * 12 + S.invested * .025 + MAINT[S.div] + TRAVEL[S.div] * S.N / 2 + (S.infra.formation ? INFRA.formation.run[S.infra.formation] : 0); },
 ratio() { return { prudent: .8, depensier: 1.05, formation: .85, equilibre: .92 }[this.strat]; },
 weekly() {
  const st = this.strat, L = LV[S.div];
  // objectif réaliste
  // staff
  if (S.week === 0 || S.week === Math.floor(S.N / 2) || !S.staff.coach) {
   const roles = st === 'formation' ? ['coach', 'formateur', 'prepa', 'recruteur', 'commercial'] : ['coach', 'recruteur', 'prepa', 'commercial', 'formateur'];
   for (const r of roles) {
    A.cands(r);
    const list = S.cands[r].list.slice().sort((a, b) => b.lvl - a.lvl);
    for (const c of list) {
     const cur = S.staff[r];
     if (cur && cur.lvl >= c.lvl) break;
     const delta = (c.salary - (cur ? cur.salary : 0)) * 12;
     if (this.costs() + delta < this.income() * this.ratio() && S.cash > (cur ? cur.salary * 3 : 0) + 2000) { A.hire(r, S.cands[r].list.indexOf(c)); break; }
    }
   }
  }
  // travaux : d'abord le cahier des charges de la division suivante
  const need = S.div < 6 ? reqs(S.div + 1).filter(x => !x.ok).map(x => x.l) : [];
  const wish = [];
  const map = { 'Stade': 'stade', 'Éclairage': 'eclairage', 'Terrain': 'pelouse', 'Pelouse': 'pelouse', 'Centre de formation': 'formation', 'Centre d’entraînement': 'entrainement' };
  need.forEach(l => { for (const k in map) if (l.startsWith(k)) wish.push(map[k]); });
  if (st === 'formation') wish.push('formation', 'entrainement');
  if (st === 'depensier') wish.push('stade', 'commerce', 'loges', 'entrainement');
  if (st === 'equilibre') wish.push('commerce', 'entrainement', 'stade');
  if (st === 'prudent') wish.push('commerce');
  // stade plein -> agrandir
  if (this.lastAtt && this.lastAtt > cap() * .9) wish.unshift('stade');
  for (const k of [...new Set(wish)]) {
   const c = buildCost(k);
   const margin = { prudent: 2.5, depensier: 1.05, formation: 1.6, equilibre: 1.8 }[st];
   if (c != null && !S.builds.some(b => b.key === k) && !buildBlocked(k) && S.cash > c * margin) { A.build(k); this.stats.builds++; }
   else if (c != null && buildBlocked(k)) this.stats.blocked[k] = (this.stats.blocked[k] || 0) + 1;
  }
  if (!S.flags.subvAsked && S.week > 1) A.askSubv();
  // emprunt
  if (st === 'depensier' && S.week === 1 && loanCap() > 5000) { A.loan(.5); this.stats.loans++; }
  if (S.cash < 0 && loanCap() > 2000 && st !== 'prudent') { A.loan(.5); this.stats.loans++; }
  // SASP
  if (S.div >= 3 && !S.sasp && L.promo) { A.goPro(); A.doPro(st === 'depensier' ? 2 : 1); UI.modalOpen = false; }
  // prix du billet : viser ~ remplissage
  if (this.lastAtt != null) {
   if (this.lastAtt >= cap() * .97) S.ticket = Math.min(S.ticket + 1, L.tick * 2);
   else if (this.lastAtt < cap() * .6 && S.ticket > L.tick * .7) S.ticket--;
  }
  // mercato
  const xi = strength().xi;
  const worst = pos => { const a = xi.filter(e => e.slot === pos); return a.length ? Math.min(...a.map(e => e.p.ovr)) : 0; };
  const cands = S.market.filter(p => (!p.fee || windowOpen()) && S.tried[p.id] !== S.gw)
   .filter(p => p.ovr >= worst(p.pos) + 2 || (st === 'formation' && p.age <= 20 && (p.potSeen ? p.potSeen[1] : p.pot) > L.str[1]))
   .sort((a, b) => (b.ovr - worst(b.pos)) - (a.ovr - worst(a.pos)));
  for (const p of cands.slice(0, 3)) {
   if (squadN() >= 28) break;
   const w = Math.round(p.demand * (st === 'depensier' ? 1.25 : 1.05));
   if (this.costs() + w * 12 > this.income() * this.ratio()) continue;
   if (p.fee && p.fee > S.cash * (st === 'depensier' ? .9 : .5)) continue;
   if (interest(p) < .05) continue;
   const t = talk(p); if (t.closed > S.gw) continue;
   if (t.stage === 'club') { if (!windowOpen()) continue; clubOffer(p, Math.min(t.ask, Math.round(p.fee * (st==='depensier'?1:.92)))); }
   if (t.stage === 'player') playerOffer(p, { wage: Math.max(w, t.wAsk), years: 2, bonus: st === 'depensier' ? t.bAsk : Math.round(t.bAsk / 2), role: p.ovr >= startsAt(p) ? 'Titulaire' : 'Rotation' });
   if (t.stage === 'done') { const b = S.players.length; finalize(p); if (S.players.length > b) this.stats.signings++; }
  }
  (S.offers || []).forEach(o => { const p = getP(o.pid); if (p && p.listed) { A.acceptOffer(o.id); this.stats.sales++; } });
  UI.modalOpen = false;
  // vendre les remplaçants trop nombreux / vieux
  if (S.players.length > 25) { const bench = S.players.filter(p => !xi.some(e => e.p.id === p.id) && !p.youth).sort((a, b) => a.ovr - b.ovr)[0]; if (bench && !bench.listed) A.list(bench.id); }
  // prolongations à 6 journées de la fin
  if (S.week === S.N - 6) {
   const ids = new Set(xi.map(e => e.p.id));
   S.players.filter(p => p.contract <= 1 && (ids.has(p.id) || p.pot - p.ovr > 6)).forEach(p => {
    A.renew(p.id); if (!UI.modalOpen) return;
    document.getElementById('rnW').value = String(Math.round(p.renewDemand * 1.05)); A.renUpd();
    const c = p.contract; A.renGo(); UI.modalOpen = false; if (p.contract === c) this.stats.renewFail++;
   });
  }
 },
 handleModal() {
  const box = document.getElementById('mbox'); const txt = box.textContent;
  if (/Quel cap pour la saison/.test(txt)) {
   const L = LV[S.div]; const me = strength().ovr; const avg = (L.str[0] + L.str[1]) / 2;
   const o = me > avg + 3 && L.promo ? 'montee' : me > avg - 1 ? 'milieu' : 'maintien';
   A.setObj(o); return;
  }
  if (/Lancer la saison/.test(txt)) {
   const e = S.endSum;
   if (e.out === 'refused') this.stats.refused++;
   const atts = S.myResults.filter(r => r.home).map(r => r.att);
   this.stats.seasons.push({ y: S.year, div: S.div, pos: e.pos, out: e.out, cash: Math.round(S.cash), inc: Math.round(e.inc), exp: Math.round(e.exp), fans: S.fans, conf: Math.round(S.confidence), str: Math.round(strength().ovr), lg: Math.round(S.teams.filter(t => !t.user).reduce((s, t) => s + t.rating, 0) / (S.teams.length - 1)), att: atts.length ? Math.round(atts.reduce((a, b) => a + b, 0) / atts.length) : 0, cap: cap(), squad: S.players.length, wages: wageBill() * 12, staff: staffBill() * 12, cup: S.cup.log.length, obj: S.objective, objOk: e.objOk, mood: Math.round(S.mood), ticket: S.ticket, rep: Math.round(S.rep), debt: Math.round(debt()), incB:Object.assign({},S.sf.inc), expB:Object.assign({},S.sf.exp) });
   const before = S.players.length; A.newSeason(); return;
  }
  if (/Rapport d’effectif/.test(txt)) { this.stats.events.sreport=(this.stats.events.sreport||0)+1; closeModal(); return; }
  const choices = [...box.querySelectorAll('.choice')];
  if (choices.length) {
   const q = UI.curEv; if (q) this.stats.events[q.id] = (this.stats.events[q.id] || 0) + 1;
   const i = Math.floor(Math.random() * choices.length); choices[i].click(); return;
  }
  const pri = box.querySelector('#rsBtn') || box.querySelector('.btn.pri') || box.querySelector('button');
  if (pri) pri.click(); else closeModal();
 }
};
