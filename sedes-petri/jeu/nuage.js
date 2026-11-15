'use strict';
/* =========================================================
   SEDES PETRI — sauvegarde en ligne (base de l'artefact, sous-arbre privé du joueur)
   Même principe que valdragon/jeu/cloud.js : un seul document « partie », écrit seulement s'il change.
   ========================================================= */
const NUAGE = (() => {
 let DB = null, UID = null, init = null, busy = false, pending = null, last = '';
 const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r({ code: 'timeout' }), ms))]);
 let etat = 'connexion…';
 // window.claude peut n'apparaître qu'après le premier passage des scripts : on l'attend (10 s max)
 // et on ne mémorise que le succès (un échec est retenté à la sauvegarde suivante).
 const ouvrir = () => init || (init = (async () => {
  try {
   for (let i = 0; i < 50 && !(window.claude && window.claude.use); i++) await new Promise(r => setTimeout(r, 200));
   if (!window.claude || !window.claude.use) { etat = 'indisponible hors de claude.ai'; return false; }
   const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
   if (!db || !user) { etat = 'refusée (connectez-vous à Claude)'; return false; }
   const id = await user.id(); if (!id) { etat = 'refusée (identifiant vide)'; return false; }
   DB = db; UID = id; etat = 'active'; return true;
  } catch (e) { etat = 'erreur : ' + String(e && e.message || e).slice(0, 80); return false; }
 })().then(ok => { if (!ok) init = null; return ok; }));
 const ref = () => DB.collection('data/users/' + UID).doc('partie');
 async function charger() { if (!await ouvrir()) return null; try { const s = await timeout(ref().get(), 10000); if (!s || !s.exists) return null; const d = s.data(); return d && typeof d.s === 'string' ? d : null; } catch (e) { return null; } }
 function sauver(str, d) { if (str === last) return; pending = { s: str, t: Date.now(), d }; pomper(); }
 async function pomper() { if (busy || !pending) return; if (!await ouvrir()) { pending = null; return; } busy = true; const p = pending; pending = null;
  try { await ref().set(p); last = p.s; etat = 'active · enregistrée à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { etat = 'écriture refusée : ' + String(e && (e.code || e.message) || e).slice(0, 60); if (e && e.code === 'unavailable') { pending = pending || p; setTimeout(() => { busy = false; pomper(); }, 1500 + Math.random() * 1500); return; } }
  busy = false; if (pending) pomper(); }
 return { ouvrir, charger, sauver, ok: () => !!DB, etat: () => etat };
})();
