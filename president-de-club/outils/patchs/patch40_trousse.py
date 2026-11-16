# v36 : trousse de test (outils-communs/testkit.js) : bouton 🐞, mode test (banc de fluidité), rapport de secours sans base.
import sys,os,re
p=sys.argv[1] if len(sys.argv)>1 else '/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a));s=s.replace(a,b)
assert 'TESTKIT-DEBUT' not in s
# 1) trousse commune intégrée (mise à jour : outils/maj_testkit.py)
rep('<div id="toasts" aria-live="polite"></div>\n<script>\n','<div id="toasts" aria-live="polite"></div>\n<script>/*TESTKIT-DEBUT*/\n/*TESTKIT-FIN*/</script>\n<script>\n')
# 2) branchement dans le jeu
rep("try{window.claude?.hot?.snapshot",r"""/* ---------- Trousse de test (outils-communs/testkit.js) ---------- */
const TK=Testkit({jeu:'president',secours:true,canvas:()=>document.createElement('canvas'),capture:()=>domCapture(document.body),
 etat:()=>S?{onglet:UI.tab,test:TEST.on,club:S.club.name,division:LV[S.div].n,saison:S.year,semaine:S.week,tresorerie:Math.round(S.cash),humeur:Math.round(S.mood),confiance:Math.round(S.confidence),
  fenetre:UI.modalOpen?(document.getElementById('mbox').innerText||'').slice(0,600):'',actus:(S.news||[]).slice(0,10).map(n=>n.w+' '+n.t),allege:document.body.classList.contains('lite'),sauvegarde:JSON.stringify(S).slice(0,180000)}:{ecran:'accueil',allege:document.body.classList.contains('lite')}});
TK.bouton(document.body,'position:fixed;right:8px;bottom:8px;z-index:70;width:34px;height:34px;border-radius:50%;opacity:.55;border:1px solid #3c5a48;background:#14201a;color:#fff;font-size:16px;line-height:1;cursor:pointer;padding:0');
// Mode test : partie d'essai jamais sauvegardée (toutes les clés « president-club… » sont gelées), banc de fluidité sur les onglets et un match en direct.
const TEST={on:false};
const tkWait=ms=>new Promise(r=>setTimeout(r,ms));
function tkClear(){UI.queue=[];UI.evBack=null;UI.backFn=null;stopRep();document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;}
function tkScroll(ms){const t0=performance.now(),max=Math.max(0,document.documentElement.scrollHeight-innerHeight);if(!max)return;const f=t=>{const k=(t-t0)/ms;if(k>=1){scrollTo(0,0);return;}scrollTo(0,max*(k<.5?k*2:2-k*2));requestAnimationFrame(f);};requestAnimationFrame(f);}
A.modeTest=async function(){
 if(TEST.on)return;TEST.on=true;TK.modeTest();
 const P=Storage.prototype;TEST.set=P.setItem;TEST.rem=P.removeItem;TEST.key=KEY;
 P.setItem=function(k,v){if(TEST.on&&/^president-club/.test(String(k)))return;return TEST.set.call(this,k,v);};
 P.removeItem=function(k){if(TEST.on&&/^president-club/.test(String(k)))return;return TEST.rem.call(this,k);};
 if(TK.ov&&!TK.ov.querySelector('button')){const b=document.createElement('button');b.textContent='Quitter le test';b.style.cssText='margin-left:8px;font:11px system-ui;padding:2px 6px;border-radius:4px;cursor:pointer';b.onclick=()=>A.quitTest();TK.ov.appendChild(b);}
 UI.setup.real=null;UI.setup.diff=1;renderStart();document.getElementById('cTown').value='Clichy';document.getElementById('cName').value='Banc d’essai FC';A.create();await tkWait(400);tkClear();
 const tabs=[['accueil','Accueil'],['calendrier','Calendrier'],['classement','Classement'],['stats','Statistiques'],['effectif','Effectif'],['mercato','Mercato'],['staff','Staff'],['infra','Installations'],['finances','Finances'],['coupe','Coupe'],['club','Club']];
 const res=[];toast('Mode test : mesure en cours (environ 45 s), ne touchez à rien.');
 for(const [t,n] of tabs){if(!TEST.on)return;try{tkClear();A.tab(t);await tkWait(500);const r=[];for(let k=0;k<5;k++){const t0=performance.now();render();r.push(performance.now()-t0);}r.sort((a,b)=>a-b);
   tkScroll(2500);const m=await TK.mesurer(2500);res.push(Object.assign({scene:n,rendu_ms:+r[2].toFixed(1)},m));}catch(e){res.push({scene:n,erreur:String(e).slice(0,200)});}}
 try{tkClear();A.tab('accueil');const opp=S.teams.find(t=>!t.user);coachDecide(opp);const d=userMatch(true,opp,strength(),false,false);d.opp={name:opp.name,rating:opp.rating};d.comp='Mode test · match en direct';d.home=true;
   UI.queue=[{type:'report',d}];nextQueue();await tkWait(800);res.push(Object.assign({scene:'Match en direct'},await TK.mesurer(5000)));}catch(e){res.push({scene:'Match en direct',erreur:String(e).slice(0,200)});}
 if(!TEST.on)return;tkClear();
 const out={jeu:'president',date:new Date().toISOString(),gpu:(()=>{try{const g=document.createElement('canvas').getContext('webgl'),x=g.getExtension('WEBGL_debug_renderer_info');return x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);}catch(e){return '?';}})(),
  ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,allege:document.body.classList.contains('lite'),res};
 out.enregistre=await TK.envoyer('mesures_'+Date.now(),out);out.base=TK.base;TEST.last=out;
 const cell=v=>v==null?'—':v;
 openModal(`<div class="kicker">🧪 Mode test</div><h2>Mesures de fluidité</h2><p class="muted" style="font-size:13px">${esc(out.ecran)} · affichage ${out.allege?'allégé':'complet'} · ${esc(String(out.gpu).slice(0,60))}</p>
  <div class="tbl-wrap"><table><thead><tr><th>Écran</th><th class="r">Rendu</th><th class="r">img/s</th><th class="r">1 % bas</th><th class="r">Pire</th></tr></thead><tbody>${res.map(x=>`<tr><td>${esc(x.scene)}</td><td class="r">${x.rendu_ms!=null?x.rendu_ms+' ms':'—'}</td><td class="r">${cell(x.fps)}</td><td class="r">${cell(x.bas1)}</td><td class="r">${x.pire!=null?x.pire+' ms':(x.erreur?'erreur':'—')}</td></tr>`).join('')}</tbody></table></div>
  <p style="font-size:13px">${out.enregistre?'✓ Mesures envoyées à Claude.':'Les mesures n’ont pas pu être envoyées automatiquement (base de l’artefact non activée). Utilisez « Rapport à copier » pour les transmettre à Claude.'}</p>
  <div class="row">${out.enregistre?'':'<button class="btn" onclick="TK.rapport(TEST.last,\'Mesures de fluidité\')">Rapport à copier</button>'}<button class="btn" onclick="A.modeTestAgain()">Recommencer</button><button class="play" onclick="A.quitTest()">Quitter le mode test</button></div>`);
};
A.modeTestAgain=function(){tkClear();TEST.on=false;A.quitTest(true);A.modeTest();};
A.quitTest=function(keepOv){const P=Storage.prototype;if(TEST.set){P.setItem=TEST.set;P.removeItem=TEST.rem;}TEST.on=false;TK.test=false;KEY=TEST.key||KEY;S=null;tkClear();UI.tab='accueil';
 if(!keepOv&&TK.ov){TK.ov.remove();TK.ov=null;}renderStart();scrollTo(0,0);};
const _saveTK=save;save=function(){if(TEST.on)return;_saveTK();};
try{window.claude?.hot?.snapshot""")
# 3) bouton sur l'écran d'accueil
rep("""<button class="btn" onclick="A.importSaveStart()">Importer une sauvegarde</button></div>""",
    """<button class="btn" onclick="A.importSaveStart()">Importer une sauvegarde</button></div>
   <p class="muted" style="font-size:12.5px;margin:10px 0 0">🧪 <a href="#" onclick="A.modeTest();return false" style="color:inherit">Mode test</a> : mesure la fluidité de votre appareil sur une partie d’essai (rien n’est sauvegardé). En cas de souci en partie, touchez 🐞 en bas à droite.</p>""")
open(p,'w').write(s);print('ok')
