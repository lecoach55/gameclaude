'use strict';
/* =========================================================
   Sons synthétisés (Web Audio, aucun fichier) + musique d'ambiance générative
   ========================================================= */
const AUDIO = (() => {
 let ac = null, maitre = null, musique = null, bruitBuf = null, actif = true, volMus = .5, volSfx = .8, dern = {};
 function init() {
  if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  maitre = ac.createGain(); maitre.gain.value = .7; maitre.connect(ac.destination);
  const n = ac.sampleRate; bruitBuf = ac.createBuffer(1, n, n); const d = bruitBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
 }
 function env(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
 function ton(f, d, type = 'sine', v = .2, glisse = 0, delai = 0) {
  const t = ac.currentTime + delai, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glisse), t + d);
  env(g, t, .005, d, v * volSfx); o.connect(g); g.connect(maitre); o.start(t); o.stop(t + d + .05);
 }
 function bruit(d, freq = 1000, q = 1, v = .3, type = 'bandpass', glisse = 0, delai = 0) {
  const t = ac.currentTime + delai, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = bruitBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (glisse) f.frequency.exponentialRampToValueAtTime(freq * glisse, t + d); f.Q.value = q;
  env(g, t, .004, d, v * volSfx); s.connect(f); f.connect(g); g.connect(maitre); s.start(t, Math.random() * .5); s.stop(t + d + .05);
 }
 const S = {
  swing: () => bruit(.12, 1800, 1.5, .12, 'bandpass', .5),
  epee: () => { bruit(.08, 3000, 3, .14); ton(900 + Math.random() * 300, .08, 'triangle', .05, .6); },
  coup: k => { bruit(.07, 600 * k, 1, .16); ton(120, .08, 'sine', .14, .5); },
  arc: () => { bruit(.1, 2500, 4, .08, 'bandpass', .4); ton(500, .06, 'triangle', .04, 1.6); },
  sort: () => { ton(700, .18, 'sawtooth', .04, 2); ton(1050, .14, 'sine', .05, 1.5); },
  boule: () => { bruit(.35, 400, .8, .2, 'lowpass', 3); ton(200, .3, 'sawtooth', .05, 2); },
  explosion: () => { bruit(.6, 300, .7, .35, 'lowpass', .2); ton(70, .45, 'sine', .3, .4); },
  givre: () => { bruit(.5, 5000, 2, .12, 'highpass', .5); ton(1400, .4, 'sine', .05, .7); ton(1870, .35, 'sine', .04, .7, .05); },
  tourbillon: () => { bruit(.35, 900, 1, .2, 'bandpass', 2.5); },
  charge: () => { bruit(.3, 200, .6, .25, 'lowpass', 4); },
  cri: () => { ton(160, .5, 'sawtooth', .12, 1.3); ton(240, .45, 'sawtooth', .08, 1.2); bruit(.4, 700, 1, .1); },
  seisme: () => { ton(55, .7, 'sine', .35, .6); bruit(.7, 200, .5, .3, 'lowpass', .3); },
  blink: () => { ton(400, .2, 'sine', .08, 4); ton(1200, .2, 'triangle', .04, .3); },
  meteore_lance: () => { ton(300, .9, 'sawtooth', .05, .25); bruit(1, 1200, 1, .1, 'bandpass', .2); },
  piege: () => { ton(300, .06, 'square', .05); ton(200, .06, 'square', .05, 1, .06); },
  aie: () => { ton(180, .12, 'sawtooth', .1, .6); bruit(.08, 800, 1, .1); },
  griffe: () => bruit(.09, 1500, 2, .1, 'bandpass', .5),
  tir_e: () => bruit(.12, 2000, 3, .06, 'bandpass', .5),
  mort: () => { bruit(.25, 500, 1, .14, 'lowpass', .4); ton(150, .25, 'triangle', .06, .5); },
  casse: () => { bruit(.15, 2200, 1.2, .16, 'bandpass', .6); bruit(.2, 900, 1, .08, 'bandpass', .5, .05); },
  coffre: () => { ton(180, .1, 'square', .05); [523, 659, 784].forEach((f, i) => ton(f, .3, 'triangle', .07, 1, .1 + i * .08)); },
  or: () => { ton(1800 + Math.random() * 400, .08, 'triangle', .05); ton(2600, .06, 'sine', .03, 1, .04); },
  objet: () => ton(440, .15, 'triangle', .07, 1.5),
  objet_rare: () => [660, 880, 990].forEach((f, i) => ton(f, .25, 'triangle', .07, 1, i * .07)),
  legendaire: () => { [392, 523, 659, 784, 1046].forEach((f, i) => ton(f, .6, 'triangle', .09, 1, i * .09)); bruit(1.2, 4000, 2, .05, 'highpass'); },
  niveau: () => [523, 659, 784, 1046].forEach((f, i) => { ton(f, .5, 'triangle', .1, 1, i * .1); ton(f * 1.5, .4, 'sine', .04, 1, i * .1); }),
  potion: () => { for (let i = 0; i < 4; i++) ton(300 + i * 90, .09, 'sine', .07, 1.4, i * .07); },
  boss: () => { ton(55, 1.6, 'sawtooth', .16, .9); ton(82, 1.6, 'sawtooth', .1, .9); bruit(1.5, 300, .5, .15, 'lowpass'); },
  boss_mort: () => { ton(110, 1.5, 'sawtooth', .15, .3); bruit(1.6, 500, .6, .3, 'lowpass', .2); [392, 523, 659].forEach((f, i) => ton(f, 1, 'triangle', .07, 1, .6 + i * .15)); },
  invoque: () => { ton(90, 1, 'sawtooth', .1, 1.5); bruit(.8, 300, 2, .1, 'bandpass', 3); },
  souffle: () => { bruit(1.3, 700, .7, .3, 'lowpass', 2); ton(80, 1.2, 'sawtooth', .1, 1.4); },
  grogne: () => { ton(90 + Math.random() * 40, .35, 'sawtooth', .08, .7); bruit(.3, 300, 2, .06); },
  escalier: () => [440, 330, 247].forEach((f, i) => ton(f, .3, 'triangle', .08, 1, i * .12)),
  portail: () => { ton(300, 1, 'sine', .1, 3); ton(450, 1, 'sine', .06, 3); },
  mort_joueur: () => { [300, 250, 200, 150].forEach((f, i) => ton(f, .5, 'sawtooth', .08, .9, i * .2)); },
  clic: () => ton(800, .04, 'triangle', .04),
  page: () => bruit(.18, 3000, .7, .06, 'highpass', .5),
  cloche: () => { [196, 392, 588].forEach(f => ton(f, 2.2, 'sine', .08)); ton(523, 1.6, 'triangle', .03); },
  tambour: () => { ton(80, .3, 'sine', .3, .5); bruit(.15, 200, 1, .1, 'lowpass'); },
  des: () => { for (let i = 0; i < 5; i++) bruit(.04, 2500 + Math.random() * 2000, 4, .1, 'bandpass', 1, i * .05 + Math.random() * .03); },
  victoire: () => [392, 523, 659, 784].forEach((f, i) => ton(f, .7, 'triangle', .1, 1, i * .14)),
  defaite: () => [330, 294, 262, 196].forEach((f, i) => ton(f, .7, 'triangle', .09, 1, i * .2)),
 };
 function jouer(nom, k) {
  if (!actif) return; if (!ac) return; if (ac.state === 'suspended') ac.resume();
  const t = performance.now(); if (dern[nom] && t - dern[nom] < 45) return; dern[nom] = t;
  try { S[nom] && S[nom](k || 1); } catch (e) { }
 }
 // musique : bourdon grave + arpèges modaux lents (deux humeurs : royaume / donjon)
 let humeur = null, minut = null;
 function musiqueDe(h) {
  if (!ac || humeur === h) return; humeur = h;
  if (musique) { const m = musique; m.g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5); setTimeout(() => { try { m.o.forEach(o => o.stop()); } catch (e) { } }, 1700); musique = null; }
  if (minut) clearInterval(minut);
  if (!h || !actif) return;
  const g = ac.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.09 * volMus, ac.currentTime + 3); g.connect(maitre);
  const base = h === 'donjon' ? 55 : 73.4, o = [];
  for (const [f, ty, v] of [[base, 'sawtooth', .35], [base * 1.5, 'sine', .4], [base * 2, 'triangle', .15]]) { const x = ac.createOscillator(), gg = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = h === 'donjon' ? 260 : 420; x.type = ty; x.frequency.value = f; x.detune.value = Math.random() * 8 - 4; gg.gain.value = v; x.connect(fl); fl.connect(gg); gg.connect(g); x.start(); o.push(x); }
  musique = { g, o };
  const gamme = h === 'donjon' ? [0, 1, 3, 5, 7, 8, 10] : [0, 2, 3, 5, 7, 9, 10];
  let pas = 0;
  minut = setInterval(() => {
   if (!actif || !musique || document.hidden) return; pas++;
   if (Math.random() < (h === 'donjon' ? .35 : .6)) {
    const n = gamme[Math.floor(Math.random() * gamme.length)] + (Math.random() < .3 ? 12 : 0), f = base * 4 * Math.pow(2, n / 12);
    const t = ac.currentTime, x = ac.createOscillator(), gg = ac.createGain(); x.type = h === 'donjon' ? 'sine' : 'triangle'; x.frequency.value = f;
    gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(.05 * volMus, t + .08); gg.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    const dl = ac.createDelay(); dl.delayTime.value = .38; const fb = ac.createGain(); fb.gain.value = .35; x.connect(gg); gg.connect(maitre); gg.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(maitre);
    x.start(t); x.stop(t + 2.8); setTimeout(() => { try { dl.disconnect(); } catch (e) { } }, 6000);
   }
  }, h === 'donjon' ? 900 : 700);
 }
 return { init, jouer, musiqueDe, regler: (a, m, s) => { actif = a; if (m !== undefined) volMus = m; if (s !== undefined) volSfx = s; if (!a) musiqueDe(null); }, actif: () => actif };
})();
var SON = (n, k) => AUDIO.jouer(n, k);
