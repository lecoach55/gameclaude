// horloge.js — temps virtuel et hasard à graine, pour des captures et des tests REPRODUCTIBLES.
// À injecter AVANT le jeu (Playwright) :  await page.add_init_script(path='outils-communs/horloge.js')
// ou avec atelier.py :                     pg = await page(nav, url, figer=12345)   puis   await avancer(pg, 90)
//
// Ce que ça fait (rien n'est touché dans le jeu lui-même) :
//  - Math.random suit une graine fixe (window.__HORLOGE_GRAINE si défini avant, sinon 12345) ;
//  - performance.now(), Date.now() et new Date() rendent un temps VIRTUEL qui n'avance que d'un pas par image ;
//  - requestAnimationFrame ne tourne plus tout seul : les images sont jouées à la demande par
//    __horloge.avancer(n, pas_ms). Deux captures après le même nombre d'images sont donc identiques,
//    même si la machine est lente (SwiftShader) : fini les caméras qui oscillent selon le moment de la capture.
//  - __horloge.auto(true) relance une image virtuelle par image réelle (pour un écran d'accueil animé,
//    un chargement qui attend une animation…), __horloge.auto(false) refige.
// __horloge.reel(true) : temps et images RÉELS (hasard toujours à graine) pour un chargement qui découpe son travail selon
// performance.now() (sinon une seule image virtuelle peut durer des dizaines de secondes) ; reel(false) refige. window.__HORLOGE_REEL=1
// avant l'injection : la page démarre en temps réel. __horloge.coulant(true) : entre deux images le temps avance pour de vrai
// (au plus 0,99 pas ; images toujours à t+pas) : un travail découpé selon performance.now() ne boucle plus sans fin.
// Limites : page.wait_for_function de Playwright vérifie par défaut à chaque image (rAF) : avec l'horloge figée,
// passer polling=100 ou utiliser atelier.attendre(pg, condition). Une boucle d'attente active
// (while(performance.now()-t0<12)) ne voit plus le temps passer. performance.now() vaut 0 avant le premier avancer().
// Les minuteries setTimeout/setInterval gardent le vrai temps (elles lisent le temps virtuel) ;
// un jeu dont la boucle tourne sur setInterval n'est pas figé. Ne pas mesurer les img/s avec l'horloge figée.
(() => {
  if (window.__horloge) return;
  const W = window, rafReel = W.requestAnimationFrame.bind(W), cafReel = W.cancelAnimationFrame.bind(W);
  // hasard à graine (mulberry32)
  let s = (W.__HORLOGE_GRAINE ?? 12345) >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // temps virtuel
  let t = 0; const DEBUT = 1794787200000; // 16/11/2026 00:00 UTC, fixe
  // mode « réel » (facultatif) : le temps suit la vraie horloge (chargements qui découpent leur travail selon performance.now)
  const nowReel = performance.now.bind(performance); let reel = !!W.__HORLOGE_REEL, decal = reel ? nowReel() : 0;
  // mode « coulant » (facultatif) : entre deux images le temps avance pour de vrai, au plus de 0,99 pas ; les images restent
  // exactement à t+pas (reproductible même si une image est lente) et un travail découpé « tant que performance.now()-t0 < 8 ms »
  // se termine au lieu de tourner sans fin.
  let coulant = false, ref = 0, dernierPas = 1000 / 60;
  const T = () => reel ? nowReel() - decal : coulant ? t + Math.min(nowReel() - ref, dernierPas * 0.99) : t;
  performance.now = () => T();
  const DateReelle = Date;
  function DateFigee(...a) {
    if (!new.target) return new DateReelle(DEBUT + T()).toString(); // Date() sans new : une chaîne, comme le vrai
    return a.length ? new DateReelle(...a) : new DateReelle(DEBUT + T());
  }
  DateFigee.prototype = DateReelle.prototype; DateFigee.UTC = DateReelle.UTC; DateFigee.parse = DateReelle.parse;
  DateFigee.now = () => DEBUT + Math.floor(T());
  W.Date = DateFigee;
  // images à la demande
  let file = new Map(), id = 0, images = 0, auto = false, boucle = 0;
  const erreurs = [];
  W.requestAnimationFrame = cb => { file.set(++id, cb); return id; };
  W.cancelAnimationFrame = n => { file.delete(n); };
  const une = pas => {
    if (reel) t = nowReel() - decal; else t += pas; images++; dernierPas = pas; ref = nowReel();
    const q = file; file = new Map();
    for (const cb of q.values()) {
      try { cb(t); } catch (e) {
        erreurs.push(String(e).slice(0, 200));
        setTimeout(() => { throw e; }); // l'erreur reste visible (pageerror, robots qui comptent les erreurs)
      }
    }
  };
  W.__horloge = {
    avancer(n = 1, pas = 1000 / 60) { for (let i = 0; i < n; i++) une(pas); return { t, images, enAttente: file.size }; },
    auto(on = true, pas = 1000 / 60) {
      if (on && reel) W.__horloge.reel(false);
      auto = on; cafReel(boucle);
      if (on) { const f = () => { if (!auto) return; une(pas); boucle = rafReel(f); }; boucle = rafReel(f); }
      return auto;
    },
    // reel(true) : le temps et les images suivent la vraie horloge (le hasard reste à graine) ; reel(false) : refige à l'instant atteint.
    reel(on = true) {
      if (on && !reel) { auto = false; cafReel(boucle); decal = nowReel() - t; reel = true; const f = () => { if (!reel) return; une(0); boucle = rafReel(f); }; boucle = rafReel(f); }
      else if (!on && reel) { t = nowReel() - decal; reel = false; cafReel(boucle); }
      return reel;
    },
    coulant(on = true) { coulant = !!on; ref = nowReel(); return coulant; },
    temps: () => T(), images: () => images, erreurs, graine: () => s,
  };
  if (reel) { reel = false; W.__horloge.reel(true); }
})();
