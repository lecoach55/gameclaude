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
  // le doigt touche e : e lui-même, un de ses enfants, ou l'étiquette d'une case (pas un ancêtre : bordure ou fond de fenêtre)
  const touche = (e, h) => !!h && (h === e || e.contains(h) || (h.tagName === 'LABEL' && (h.contains(e) || h.control === e)));
  // vue(e) : {z: partie visible [gauche, haut, droite, bas] ou null, entier, cache}
  //   coupée par l'écran et par les blocs overflow≠visible qui la contiennent vraiment (bloc conteneur : un élément fixed/absolute
  //   n'est pas coupé par un ancêtre statique), à l'intérieur de leurs bordures et barres de défilement.
  //   cache = entièrement caché par un bloc qui ne défile pas (accordéon ou tiroir fermé, overflow:hidden) : inatteignable en défilant.
  const vue = e => {
    const r = e.getBoundingClientRect();
    let l = Math.max(r.left, 0), t = Math.max(r.top, 0), d = Math.min(r.right, innerWidth), b = Math.min(r.bottom, innerHeight), cache = false;
    let pos = getComputedStyle(e).position;
    for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const st = getComputedStyle(a);
      const cree = st.transform !== 'none' || st.filter !== 'none' || /paint|layout|strict|content/.test(st.contain || '');
      if (pos === 'fixed' && !cree) continue;                                // un élément fixe n'est coupé que par un ancêtre transformé
      if (pos === 'absolute' && st.position === 'static' && !cree) continue;  // absolu : seuls les ancêtres positionnés le contiennent
      pos = st.position;
      if (st.overflowX === 'visible' && st.overflowY === 'visible') continue;
      const q = a.getBoundingClientRect(), svg = a instanceof SVGElement;
      const L = svg ? q.left : q.left + a.clientLeft, T = svg ? q.top : q.top + a.clientTop;
      const R = svg ? q.right : L + a.clientWidth, B = svg ? q.bottom : T + a.clientHeight;
      const defile = /auto|scroll/.test(st.overflowX + st.overflowY);
      const avant = [l, t, d, b];
      if (st.overflowX !== 'visible') { l = Math.max(l, L); d = Math.min(d, R); }
      if (st.overflowY !== 'visible') { t = Math.max(t, T); b = Math.min(b, B); }
      if (!defile && (d - l < 2 || b - t < 2) && avant[2] - avant[0] >= 2 && avant[3] - avant[1] >= 2) cache = true;
    }
    const z = d - l < 2 || b - t < 2 ? null : [l, t, d, b];
    return { z, cache, entier: !!z && z[0] <= r.left + 1 && z[1] <= r.top + 1 && z[2] >= r.right - 1 && z[3] >= r.bottom - 1 };
  };
  const zone = e => vue(e).z;
  // point(e) : point ENTIER où un vrai doigt toucherait e — centre de la partie visible, vérifié par elementFromPoint à ces
  //   coordonnées exactes ; null si rien de visible ou recouvert.
  //   (Avant : centre de la boîte entière, arrondi — un bouton à moitié sous le bord d'une fenêtre recevait le clic sur la fenêtre.)
  const point = e => {
    const z = zone(e); if (!z) return null;
    const x = Math.floor((z[0] + z[2]) / 2), y = Math.floor((z[1] + z[3]) / 2);
    return touche(e, document.elementFromPoint(x, y)) ? [x, y] : null;
  };
  const atteignable = e => {
    if (point(e)) return true;
    const v = vue(e);
    if (v.entier || v.cache) return false;          // visible mais recouvert (voile de chargement), ou replié : ne pas faire défiler
    e.scrollIntoView({ block: 'center', inline: 'center' });   // hors écran ou coupé par un bloc qui défile
    return !!point(e);
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
      if (o.viser) return point(e) || (() => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })();   // vrai clic fait par Playwright
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
  const auCentre = point;
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
        const v = vue(e);
        if (!o.loin || v.entier || v.cache) continue;   // recouvert, ou replié (accordéon fermé) : pas une cible ; hors écran ou coupé : loin
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
    return point(e);
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
