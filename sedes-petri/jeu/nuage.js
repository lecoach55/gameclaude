'use strict';
/* =========================================================
   SEDES PETRI — sauvegarde en ligne (base de l'artefact, sous-arbre privé du joueur)
   Même principe que valdragon/jeu/cloud.js : un seul document « partie », écrit seulement s'il change.
   ========================================================= */
const NUAGE = (() => {
 let DB = null, UID = null, init = null, busy = false, pending = null, last = '';
 const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r({ code: 'timeout' }), ms))]);
 const ouvrir = () => init || (init = (async () => { try { if (!window.claude || !window.claude.use) return false; const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); if (!db || !user) return false; const id = await user.id(); if (!id) return false; DB = db; UID = id; return true; } catch (e) { return false; } })());
 const ref = () => DB.collection('data/users/' + UID).doc('partie');
 async function charger() { if (!await ouvrir()) return null; try { const s = await timeout(ref().get(), 10000); if (!s || !s.exists) return null; const d = s.data(); return d && typeof d.s === 'string' ? d : null; } catch (e) { return null; } }
 function sauver(str, d) { if (str === last) return; pending = { s: str, t: Date.now(), d }; pomper(); }
 async function pomper() { if (busy || !pending) return; if (!await ouvrir()) { pending = null; return; } busy = true; const p = pending; pending = null;
  try { await ref().set(p); last = p.s; } catch (e) { if (e && e.code === 'unavailable') { pending = pending || p; setTimeout(() => { busy = false; pomper(); }, 1500 + Math.random() * 1500); return; } }
  busy = false; if (pending) pomper(); }
 return { ouvrir, charger, sauver, ok: () => !!DB };
})();
