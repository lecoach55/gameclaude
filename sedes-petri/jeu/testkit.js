// ===== Trousse de test à intégrer dans n'importe quel jeu (artefact Claude) =====
// Ajoute : compteur d'images par seconde (mode test), bouton 🐞 « signaler un problème » (capture + état + erreurs),
// banc de mesure scripté, et envoi des résultats dans la base de l'artefact (lisible par Claude avec db_list).
// Usage dans le jeu :
//   import {Testkit} from './testkit.js';
//   const TK=Testkit({jeu:'hameau', canvas:()=>renderer.domElement, etat:()=>({...}), rendu:()=>renderer.render(scene,cam)});
//   TK.bouton(document.body);            // bouton 🐞 permanent
//   TK.modeTest();                       // affiche le compteur (à appeler depuis un bouton « Mode test »)
//   await TK.banc([{nom:'scène 1', preparer:async()=>{...}}, ...], 5000);  // mesure chaque scène 5 s
// Jeux sans canvas (SVG/DOM) : fournir capture:async()=>dataURL (voir svgCapture ci-dessous) et canvas:()=>document.createElement('canvas') pour le nom du GPU.
// Le mode test ne doit jamais écrire dans la vraie sauvegarde : c'est au jeu de couper sa sauvegarde quand TK.test est vrai.
function Testkit(o){
 const TK={test:false,ft:[],rec:null,lt:0,erreurs:[]};
 let DB=null,UID=null,init=null;
 // Base de l'artefact : window.claude peut arriver après le premier passage du script → on l'attend (10 s max),
 // on ne retient que le succès (un échec sera retenté au prochain envoi) et on garde la raison dans TK.base.
 TK.base='pas encore essayé';
 const cloud=()=>init||(init=(async()=>{try{
   for(let i=0;i<50&&!(window.claude&&window.claude.use);i++)await new Promise(r=>setTimeout(r,200));
   if(!window.claude||!window.claude.use){TK.base='window.claude absent (page hors de claude.ai ?)';return false;}
   const [db,u]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
   if(!db){TK.base='base refusée (db null : déconnecté ou capacité non accordée)';return false;}
   if(!u){TK.base='identité refusée (user null)';return false;}
   UID=await u.id();DB=db;if(!UID){TK.base='identifiant vide';return false;}TK.base='ok';return true;
  }catch(e){TK.base='erreur : '+String(e&&e.message||e).slice(0,160);return false;}})().then(ok=>{if(!ok)init=null;return ok;}));
 TK.envoyer=async(nom,obj)=>{try{localStorage.setItem(o.jeu+'_'+nom.split('_')[0],JSON.stringify(obj));}catch(e){}if(!await cloud())return false;try{await DB.collection('data/users/'+UID).doc(nom).set(obj);return true;}catch(e){TK.base='écriture refusée : '+String(e&&(e.code||e.message)||e).slice(0,160);return false;}};
 addEventListener('error',e=>{TK.erreurs.push(String(e.message||e).slice(0,300));if(TK.erreurs.length>20)TK.erreurs.shift();});
 addEventListener('unhandledrejection',e=>TK.erreurs.push('promesse: '+String(e.reason).slice(0,300)));
 const gpu=()=>{try{const c0=o.canvas&&o.canvas();let gl=c0&&(c0.getContext('webgl2')||c0.getContext('webgl'));if(!gl){const c=document.createElement('canvas');gl=c.getContext('webgl');} // jeux 2D : canvas WebGL temporaire
  const x=gl.getExtension('WEBGL_debug_renderer_info');return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){return '?';}};
 const stats=a=>{if(!a.length)return{};const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length;return{fps:+(1000/m).toFixed(1),bas1:+(1000/s[Math.floor(s.length*.99)]).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length};};
 const tick=t=>{if(TK.lt){const d=t-TK.lt;TK.ft.push(d);if(TK.ft.length>240)TK.ft.shift();if(TK.rec)TK.rec.push(d);}TK.lt=t;if(TK.ov&&t-(TK.tt||0)>500){TK.tt=t;const s=stats(TK.ft.slice(-60));TK.ov.firstChild.textContent=`🧪 ${s.fps||'-'} img/s · pire ${s.pire||'-'} ms`;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
 TK.modeTest=()=>{TK.test=true;if(TK.ov)return;const d=document.createElement('div');d.style.cssText='position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,.72);color:#9fe0a0;font:12px monospace;padding:4px 8px;border-radius:6px';d.innerHTML='<span>🧪</span>';document.body.appendChild(d);TK.ov=d;};
 // Mesure fiable : on attend que la page soit visible ; si le navigateur a suspendu l'affichage pendant la mesure
 // (onglet masqué, fenêtre en arrière-plan, volet replié), on recommence une fois puis on le signale (masquee:true).
 const visible=()=>new Promise(r=>{if(!document.hidden)return r();const f=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',f);r();}};document.addEventListener('visibilitychange',f);});
 TK.mesurer=async(ms,essai=0)=>{await visible();TK.rec=[];let masq=false;const vf=()=>{if(document.hidden)masq=true;};document.addEventListener('visibilitychange',vf);
  await new Promise(r=>setTimeout(r,ms));document.removeEventListener('visibilitychange',vf);const a=TK.rec;TK.rec=null;
  const suspendu=masq||a.length<ms/1000*3; // moins de 3 images/s mesurées : affichage suspendu par le navigateur
  if(suspendu&&essai<1){if(TK.surSuspension)TK.surSuspension();return TK.mesurer(ms,essai+1);}
  const st=stats(a);if(suspendu)st.masquee=true;return st;};
 TK.banc=async(scenes,ms=5000)=>{const res=[];for(const s of scenes){try{await s.preparer();await new Promise(r=>setTimeout(r,1500));res.push(Object.assign({scene:s.nom},await TK.mesurer(ms)));}catch(e){res.push({scene:s.nom,erreur:String(e)});}}
  const out={jeu:o.jeu,date:new Date().toISOString(),gpu:gpu(),ua:navigator.userAgent,ecran:innerWidth+'x'+innerHeight+' @'+devicePixelRatio,res};out.enregistre=await TK.envoyer('mesures_'+Date.now(),out);out.base=TK.base;return out;};
 TK.signaler=async()=>{let img='';try{if(o.capture)img=await o.capture();else{if(o.rendu)o.rendu();const src=o.canvas(),k=Math.min(1,480/src.width),c=document.createElement('canvas');c.width=src.width*k|0;c.height=src.height*k|0;c.getContext('2d').drawImage(src,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.6);}}catch(e){}
  const st={jeu:o.jeu,test:TK.test,date:new Date().toISOString(),gpu:gpu(),ua:navigator.userAgent,img_s:stats(TK.ft.slice(-60)).fps,etat:(()=>{try{return o.etat?o.etat():null;}catch(e){return String(e);}})(),erreurs:TK.erreurs.slice(),capture:img};
  return TK.envoyer('signalement_'+Date.now(),st);};
 TK.bouton=(parent,style)=>{const b=document.createElement('button');b.textContent='🐞';b.title='Signaler un problème à Claude';b.style.cssText=style||'position:fixed;right:10px;bottom:10px;z-index:9999;width:38px;height:38px;border-radius:50%;opacity:.75';parent.appendChild(b);
  b.onclick=async()=>{b.disabled=true;const ok=await TK.signaler();b.disabled=false;b.textContent=ok?'✓':'🐞';setTimeout(()=>b.textContent='🐞',1500);};return b;};
 return TK;}

// Capture d'un <svg> (jeux en SVG) : sérialise, dessine dans un canvas réduit, renvoie un JPEG en dataURL.
function svgCapture(svg,largeur=480){return new Promise(res=>{try{
 // on recopie les feuilles de style de la page dans le clone : sans elles, les classes CSS (display, fill…) sont perdues
 const css=[...document.styleSheets].flatMap(st=>{try{return [...st.cssRules].map(r=>r.cssText);}catch(e){return [];}}).join('\n');
 const cl=svg.cloneNode(true);const stl=document.createElementNS('http://www.w3.org/2000/svg','style');stl.textContent=css;cl.insertBefore(stl,cl.firstChild);
 const xml=new XMLSerializer().serializeToString(cl);const r=svg.getBoundingClientRect();const k=Math.min(1,largeur/r.width);
 const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=r.width*k|0;c.height=r.height*k|0;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.6));}catch(e){res('');}};img.onerror=()=>res('');
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml.replace('<svg','<svg width="'+r.width+'" height="'+r.height+'"'));}catch(e){res('');}});}
// Jeux en scripts classiques (sans import) : exposer aussi la trousse sur window.
// Plus sûr dans un artefact : charger une copie SANS les mots « export » en <script src> classique
// (sed 's/^export //' testkit.js > jeu/testkit.js) : un <script type="module"> peut ne pas se charger dans le cadre isolé.
if(typeof window!=="undefined"){window.Testkit=Testkit;window.svgCapture=svgCapture;}
