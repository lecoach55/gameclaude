// ===== Sonde : aides injectées dans la page d'un jeu pour les robots de test (aucun effet sur le jeu) =====
// Chargement : pg.add_init_script(path='…/outils-communs/sonde.js') avant goto, ou pg.evaluate(<contenu>) après.
// Depuis Python : outils-communs/sonde.py (cliquer, debordements, boutons), synchrone ou async.
//   __sonde.cliquer(motif, {dans, sel, force})  → e.click() (événement click seulement, pas pointerdown/touchstart : sinon cliquer(…, souris=True) côté Python) ; true si un élément visible, actif et non recouvert a été cliqué, sinon false
//       motif : texte (contenu, insensible à la casse) ou RegExp ; s'utilise avec wait_for_function pour attendre le bouton.
//   __sonde.boutons(dans)                       → textes des éléments cliquables visibles (diagnostic quand un clic échoue)
//   __sonde.cibles({sel, eviter}) / empreinte() / ecran() → pour les robots au hasard (robots/singe.py) et cliquer(…, effet=True)
//   __sonde.debordements({ignorer, tol, ellipses, verticaux}) → liste des contenus coupés :
//       page      : la page défile en largeur (le seul cas que voyaient les anciens contrôles scrollWidth)
//       bloc      : un bloc à défilement propre (overflow auto/scroll) déborde en largeur : un élément trop large y est coupé (accident probable)
//       large     : défilement horizontal voulu (tableau plus large que le bloc, rangée d'onglets ou de vignettes) — non signalé par défaut
//       coupe     : un bloc overflow:hidden/clip cache une partie de son contenu en largeur (ou en hauteur avec verticaux:true) ; bandeaux défilants et carrousels exclus
//       bord      : un élément visible à moitié sort de l'écran à droite ou à gauche (masqué par body{overflow-x:hidden})
//       ellipse   : texte tronqué par « … » (seulement avec ellipses:true ; souvent voulu)
(function () {
  if (window.__sonde) return;
  const SEL = 'button,[role=button],a[href],a[onclick],[role=tab],[role=menuitem],summary,input[type=button],input[type=submit],input[type=checkbox],input[type=radio],select,label[for],[onclick]';
  const visible = e => {
    if (!e || !e.isConnected) return false;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    if (e.closest('[hidden],[inert],[aria-hidden=true]')) return false;
    for (let x = e; x && x.nodeType === 1; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const texte = e => (((e.innerText ?? e.textContent) || e.value || e.getAttribute('aria-label') || e.title || '') + '').replace(/\s+/g, ' ').trim();
  const nom = e => {
    const p = [];
    for (let x = e; x && x.nodeType === 1 && p.length < 4; x = x.parentElement) {
      let s = x.tagName.toLowerCase();
      if (x.id) { p.unshift(s + '#' + x.id); break; }
      const c = [...x.classList].filter(k => !/^(on|off|active|sel|open|show|hide|hidden)$/.test(k)).slice(0, 2);
      if (c.length) s += '.' + c.join('.');
      p.unshift(s);
    }
    return p.join('>');
  };
  const correspond = (e, motif) => {
    const t = texte(e);
    if (motif instanceof RegExp) return motif.test(t);
    return t.toLowerCase().includes(norm(motif));
  };
  const norm = m => String(m).replace(/\s+/g, ' ').trim().toLowerCase();
  const racine = dans => dans ? [...document.querySelectorAll(dans)].filter(visible) : [document];
  const candidats = (motif, o) => {
    const out = [];
    for (const r of racine(o.dans)) for (const e of r.querySelectorAll(o.sel || SEL)) if (correspond(e, motif)) out.push(e);
    return out;
  };
  const actif = e => !(e.disabled || e.getAttribute('aria-disabled') === 'true' || (e.closest('fieldset') || {}).disabled || getComputedStyle(e).pointerEvents === 'none');
  const atteignable = e => {
    let r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;   // défile seulement si le centre est hors écran
    if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) { e.scrollIntoView({ block: 'center', inline: 'center' }); r = e.getBoundingClientRect(); }
    const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const h = document.elementFromPoint(x, y);
    return !!h && (h === e || e.contains(h) || h.contains(e) || (e.tagName === 'INPUT' && h.tagName === 'LABEL' && h.control === e));
  };
  function cliquer(motif, o) {
    o = o || {};
    const c = candidats(motif, o).filter(e => visible(e) && actif(e));
    if (!c.length) return false;
    // texte exact d'abord (« Jouer » avant « Jouer en ligne »), puis le plus petit élément (le bouton plutôt que sa carte)
    const exact = c.filter(e => motif instanceof RegExp ? false : texte(e).toLowerCase() === norm(motif));
    const l = (exact.length ? exact : c).sort((a, b) => texte(a).length - texte(b).length);
    for (const e of l) {
      if (!o.force && !atteignable(e)) continue;
      if (o.viser) { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }   // vrai clic fait par Playwright
      if (typeof e.click === 'function') e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));   // SVG : pas de click()
      return true;
    }
    return false;
  }
  function boutons(dans) {
    const out = [];
    for (const r of racine(dans)) for (const e of r.querySelectorAll(SEL)) if (visible(e)) { const t = texte(e); if (t) out.push(t.slice(0, 40) + (actif(e) ? '' : ' (inactif)')); }
    return [...new Set(out)].slice(0, 40);
  }
  // bandeau défilant, carrousel animé → débordement voulu (aussi à l'arrêt quand prefers-reduced-motion est actif ou qu'une animation est déclarée : bloc d'au moins une demi-largeur d'écran, une seule ligne ≥ 3 fois plus large)
  const anime = x => { const cs = getComputedStyle(x); return cs.animationName && cs.animationName !== 'none'; };
  const bandeau = e => e.clientWidth >= innerWidth / 2 && e.scrollWidth > 3 * e.clientWidth && e.clientHeight < 80
    && (matchMedia('(prefers-reduced-motion: reduce)').matches || anime(e) || [...e.children].some(anime))
    && [e, ...e.children].some(x => getComputedStyle(x).whiteSpace === 'nowrap' || /flex/.test(getComputedStyle(x).display));
  const defile = e => bandeau(e) || !!(e.getAnimations && e.getAnimations({ subtree: true }).some(a => a.playState === 'running' && /transform|translate|left|margin/i.test(JSON.stringify(a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : ''))));
  // défilement horizontal voulu : un tableau plus large que le bloc, ou une rangée (onglets, vignettes) de petits éléments sans retour à la ligne
  const bande = (e, cs) => {
    const w = e.clientWidth;
    if ([...e.querySelectorAll('table')].some(t => t.offsetWidth > w + 2)) return true;
    const enf = [...e.children].filter(visible);
    return /flex/.test(cs.display) && cs.flexWrap === 'nowrap' && !/column/.test(cs.flexDirection) && enf.length >= 3 && enf.every(c => c.offsetWidth < w);
  };
  // texte réellement caché : un nœud texte dépasse le bord du bloc (les décorations en absolu sans texte ne comptent pas)
  const texteCache = (e, sens) => {
    const b = e.getBoundingClientRect(), w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), rg = document.createRange();
    let pire = 0, n = 0;
    for (let t = w.nextNode(); t && n < 400; t = w.nextNode(), n++) {
      if (!t.nodeValue.trim()) continue;
      rg.selectNodeContents(t); const r = rg.getBoundingClientRect(); if (!r.width && !r.height) continue;
      pire = Math.max(pire, sens === 'h' ? Math.max(r.bottom - b.bottom, b.top - r.top) : Math.max(r.right - b.right, b.left - r.left));
    }
    return pire;
  };
  function debordements(o) {
    o = o || {};
    const tol = o.tol == null ? 2 : o.tol, ign = (o.ignorer || []).join(',');
    const out = [], W = innerWidth, de = document.documentElement;
    const ignore = e => ign && e.closest(ign);
    const ajoute = (genre, e, px, extra) => out.push(Object.assign({ genre, sel: e ? nom(e) : 'page', px: Math.round(px), texte: e ? texte(e).slice(0, 50) : '' }, extra || {}));
    let vx = getComputedStyle(de).overflowX; if (vx === 'visible') vx = getComputedStyle(document.body).overflowX;   // body{overflow-x:hidden} : la page ne défile pas (voir « bord »)
    if (de.scrollWidth > W + tol && vx !== 'hidden' && vx !== 'clip') ajoute('page', null, de.scrollWidth - W);
    const tous = [...document.body.querySelectorAll('*')];
    const signales = new Set();
    for (const e of tous) {
      if (ignore(e)) continue;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.display === 'contents') continue;
      const ox = cs.overflowX, oy = cs.overflowY;
      const dx = e.scrollWidth - e.clientWidth, dy = e.scrollHeight - e.clientHeight;
      if (e.clientWidth > 0 && dx > tol && ox !== 'visible' && !['HTML', 'BODY', 'TEXTAREA', 'SELECT', 'INPUT', 'CANVAS', 'SVG', 'svg'].includes(e.tagName) && visible(e)) {
        if (ox === 'auto' || ox === 'scroll') { ajoute(bande(e, cs) ? 'large' : 'bloc', e, dx, { largeur: e.clientWidth }); signales.add(e); }
        else if (cs.textOverflow === 'ellipsis') { if (o.ellipses) ajoute('ellipse', e, dx); signales.add(e); }
        else if ((ox === 'hidden' || ox === 'clip') && texte(e) && !defile(e)) { const c = texteCache(e, 'l'); if (c > tol) { ajoute('coupe', e, c); signales.add(e); } }
      }
      if (o.verticaux && e.clientHeight > 0 && dy > tol && (oy === 'hidden' || oy === 'clip') && !cs.webkitLineClamp?.match?.(/\d/) && texte(e) && visible(e) && !defile(e)) { const c = texteCache(e, 'h'); if (c > tol) { ajoute('coupe', e, c, { sens: 'hauteur' }); signales.add(e); } }
    }
    // éléments à moitié hors de l'écran (cachés par overflow-x:hidden sur body) : seulement le plus haut, hors blocs déjà signalés
    for (const e of tous) {
      if (ignore(e) || !e.firstChild) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0) continue;
      const dehors = r.right > W + tol ? r.right - W : r.left < -tol ? -r.left : 0;
      if (!dehors || r.left >= W || r.right <= 0) continue;          // entièrement hors écran : tiroir fermé, voulu
      const p = e.parentElement; let deja = false;
      for (let x = p; x && x !== document.body; x = x.parentElement) { if (signales.has(x)) { deja = true; break; } const cx = getComputedStyle(x).overflowX; if (cx !== 'visible') { deja = true; break; } }
      if (deja || !visible(e)) continue;
      if (getComputedStyle(e).position === 'fixed' && dehors > r.width / 2) continue;
      ajoute('bord', e, dehors); signales.add(e);
    }
    return out;
  }
  // ----- pour les robots au hasard (outils-communs/robots/singe.py) -----
  // cibles({sel, eviter, max, loin}) : éléments cliquables visibles, actifs, NON recouverts, dont le centre est à l'écran (sans faire défiler).
  //   Chacun reçoit data-sonde-i ; renvoie [{i, t, x, y, tag, type, dialogue}] (dialogue = dans une fenêtre ouverte).
  const DLG = 'dialog[open],[role=dialog],[role=alertdialog],[aria-modal=true],.modal:not([hidden]):not(.cache):not(.hidden)';
  const auCentre = e => {
    const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return null;
    const h = document.elementFromPoint(x, y);
    return h && (h === e || e.contains(h) || h.contains(e) || (e.tagName === 'INPUT' && h.tagName === 'LABEL' && h.control === e)) ? [x, y] : null;
  };
  function cibles(o) {
    o = o || {};
    const ev = (o.eviter || []).map(norm), out = [];
    document.querySelectorAll('[data-sonde-i]').forEach(e => e.removeAttribute('data-sonde-i'));
    const sel = o.sel ? SEL + ',' + o.sel : SEL;
    for (const e of document.querySelectorAll(sel)) {
      if (out.length >= (o.max || 300)) break;
      if (!visible(e) || !actif(e)) continue;
      const t = texte(e), tl = t.toLowerCase(), id = (e.id || '').toLowerCase();
      if (ev.some(x => x && (tl.includes(x) || id === x))) continue;
      const c = auCentre(e);
      let loin = false;
      if (!c) {   // hors écran (plus bas dans une fenêtre ou un panneau qui défile) : proposé avec loin:true, viser(i) le fait venir
        const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (!o.loin || (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight)) continue;   // à l'écran mais recouvert : pas une cible
        loin = true;
      }
      e.setAttribute('data-sonde-i', out.length);
      out.push({ i: out.length, t: (t || e.id || e.getAttribute('aria-label') || e.tagName).split('\n')[0].slice(0, 40), x: c ? Math.round(c[0]) : -1, y: c ? Math.round(c[1]) : -1, tag: e.tagName, type: e.type || '', dialogue: !!e.closest(DLG), loin });
    }
    return out;
  }
  // viser(i) : fait défiler la cible i jusqu'au centre ; renvoie [x, y] si elle est alors atteignable (non recouverte), sinon null.
  function viser(i) {
    const e = document.querySelector('[data-sonde-i="' + i + '"]'); if (!e) return null;
    e.scrollIntoView({ block: 'center', inline: 'center' });
    const c = auCentre(e); return c ? [Math.round(c[0]), Math.round(c[1])] : null;
  }
  // empreinte() : résumé court de ce que voit le joueur (texte affiché, cases cochées, valeurs saisies, étiquettes et états aria des boutons, fenêtres ouvertes, défilement).
  //   Deux empreintes égales avant/après un clic = le clic n'a rien changé à l'écran (bouton mort, ou clic intercepté par une fenêtre).
  function empreinte() {
    const t = (document.body && document.body.innerText) || '';
    let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    let v = 0; for (const e of document.querySelectorAll('input,select,textarea')) { const s = e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? '1' : '0') : (e.value || ''); for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; }
    // boutons à icône : l'effet se lit dans leurs attributs (« Couper le son » → « Activer le son »)
    let a = 0; for (const e of document.querySelectorAll(SEL)) { const s = [e.getAttribute('aria-label'), e.title, e.getAttribute('aria-pressed'), e.getAttribute('aria-expanded'), e.getAttribute('aria-selected'), e.getAttribute('aria-checked'), e.disabled].join(); for (let i = 0; i < s.length; i++) a = (a * 31 + s.charCodeAt(i)) | 0; }
    const dl = [...document.querySelectorAll(DLG)].filter(visible).length;
    return [h, a, t.length, v, dl, location.hash, scrollX | 0, scrollY | 0].join('|');   // pas le focus : un bouton mort prend le focus
  }
  // ecran() : nom court de l'écran affiché (fenêtre ouverte, sinon premier titre visible) pour regrouper les relevés par écran.
  function ecran() {
    const d = [...document.querySelectorAll(DLG)].filter(visible).pop();
    const z = d || document.body;
    const titre = [...z.querySelectorAll('h1,h2,h3,[role=heading],.titre,.title')].find(visible);
    return (d ? 'fenêtre ' + (d.id || '') + ' ' : '') + (titre ? texte(titre).slice(0, 30) : (d ? '' : 'page'));
  }
  // dessus() : ce qui est sous le doigt au centre et en bas de l'écran (diagnostic d'un voile invisible qui avale les clics)
  const dessus = () => [[innerWidth / 2, innerHeight / 2], [innerWidth / 2, innerHeight - 30]].map(([x, y]) => { const h = document.elementFromPoint(x, y); return h ? nom(h) : 'rien'; }).join(' / ');
  window.__sonde = { cliquer, boutons, debordements, visible, texte, nom, cibles, viser, empreinte, ecran, dessus };
})();
