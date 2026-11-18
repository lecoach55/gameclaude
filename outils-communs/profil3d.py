#!/usr/bin/env python3
"""Profil 3D commun : CE QUI COÛTE dans une image Three.js, sans réglage propre au jeu.

usage :
  python3 outils-communs/profil3d.py <jeu>/outils/banc.json [sortie.json] [--scenes a,b] [--appareils ordinateur]
          [--groupes 20] [--images N] [--cpu 4] [--construire]
  (équivalent : python3 outils-communs/banc.py <jeu>/outils/banc.json --profil …)

Reprend les scènes du banc commun (même page, même graine, temps figé) puis, pour chaque scène :
  1. trouve les moteurs et les scènes Three.js tout seul (crochet __THREE_DEVTOOLS__ de three.js, présent depuis r1xx : rien à
     exposer dans le jeu ; bundle, module ou CDN) et compte les appels de dessin et triangles de chaque scène rendue ;
  2. mesure l'image de base (coût réel, GPU compris : le banc joue l'image et lit 1 pixel), puis la même image en MASQUANT tour à
     tour chaque groupe d'objets (enfants de la scène, regroupés par nom ; un groupe qui contient presque tout est ouvert) ;
  3. puis sans ombres, sans environnement (reflets), sans lumières ponctuelles/projecteurs, sans brouillard, à résolution ½ ;
  4. remesure la base à la fin : l'écart entre les deux bases = bruit (les gains plus petits que lui ne disent rien).
Rend un tableau trié « ce qu'on gagne en l'enlevant » (ms et % de l'image, appels, triangles). Tout est remis en place après
chaque variante. Valeurs RELATIVES (rendu logiciel SwiftShader) : chercher le plus gros poste, pas un chiffre absolu.
Remplace les profileurs recopiés (bannieres/outils/prof3d.py, valdragon/outils/mesure/bprof.py). Mode figé seulement.

Réglages facultatifs dans banc.json : "profil": {"groupes": 20, "images": 0, "scene": "expression JS d'une THREE.Scene à profiler"}
(images 0 = automatique : ≈ 2,5 s de rendu par variante, entre 4 et 15 images ; --groupes 10 pour aller plus vite).
"""
import os, sys, json

ICI = os.path.dirname(os.path.abspath(__file__))

# Avant le jeu : three.js annonce chaque WebGLRenderer et chaque Scene créés à __THREE_DEVTOOLS__ (événement « observe »).
# On garde les moteurs et on enveloppe leur render() (méthode d'instance) pour compter, scène par scène, appels et triangles.
INIT = r"""(()=>{if(window.__profil3d)return;const P=window.__profil3d={rend:[],scenes:[],compte:false,rendus:new Map(),autre:null};
 const garder=o=>{try{
  if(o&&(o.isWebGLRenderer||(o.domElement&&typeof o.render==='function'&&typeof o.getContext==='function'))&&!o.__profil){o.__profil=1;P.rend.push(o);const r=o.render;
   o.render=function(s,c){P.tot=(P.tot||0)+1;if(!P.compte)return r.call(this,s,c);const i=this.info.render,a0=this.info.autoReset?0:i.calls,t0=this.info.autoReset?0:i.triangles;
    const cib=!!(this.getRenderTarget&&this.getRenderTarget());const x=r.call(this,s,c);let k=P.rendus.get(s);if(!k){k={n:0,appels:0,tri:0,ren:this,cible:0};P.rendus.set(s,k);}if(cib)k.cible++;k.n++;k.appels+=i.calls-a0;k.tri+=i.triangles-t0;return x;};}
  else if(o&&o.isScene)P.scenes.push(new WeakRef(o));}catch(e){}};
 const et=new EventTarget();et.addEventListener('observe',e=>garder(e.detail));
 const deja=window.__THREE_DEVTOOLS__;if(deja&&deja.addEventListener){deja.addEventListener('observe',e=>garder(e.detail));P.autre=1;}
 else{let cur=et;try{Object.defineProperty(window,'__THREE_DEVTOOLS__',{configurable:true,get(){return cur;},
   set(v){cur=v;try{if(v&&v!==et&&v.addEventListener){v.addEventListener('observe',e=>garder(e.detail));P.autre=1;}}catch(e){}}});}catch(e){window.__THREE_DEVTOOLS__=et;}}})();"""

PROFIL_JS = r"""async([pas,imgVoulues,maxG,cible])=>{
 const P=window.__profil3d;if(!P)return{erreur:'crochet du profil absent'};
 if(!P.rend.length)return{erreur:"aucun moteur Three.js vu (jeu sans three.js, ou three.js trop ancien sans __THREE_DEVTOOLS__)"};
 const now=window.__vraiNow||performance.now.bind(performance),px=new Uint8Array(4),H=window.__horloge;
 if(!H)return{erreur:'profil : mode figé seulement (horloge.js absente)'};
 const vis=window.__bancCtxAffiches?window.__bancCtxAffiches():[];
 const sync=()=>{for(const c of vis){try{if(c.readPixels)c.readPixels(0,0,1,1,c.RGBA,c.UNSIGNED_BYTE,px);else if(c.getImageData)c.getImageData(0,0,1,1);}catch(e){}}void document.body.offsetHeight;};
 const pause=()=>new Promise(r=>setTimeout(r,0));
 const tri=o=>{let t=0;o.traverseVisible(x=>{if((x.isMesh||x.isPoints||x.isLine)&&x.geometry){const g=x.geometry,c=g.index?g.index.count:(g.attributes&&g.attributes.position?g.attributes.position.count:0);
   const d=g.drawRange&&isFinite(g.drawRange.count)?Math.min(c,g.drawRange.count):c;t+=(x.isMesh?d/3:d)*(x.isInstancedMesh?x.count:1);}});return Math.round(t);};
 const nm=o=>{let n=0;o.traverseVisible(x=>{if(x.isMesh||x.isPoints||x.isLine||x.isSprite)n++;});return n;};
 const mes=async(k,chauffe=2)=>{for(let i=0;i<chauffe;i++){H.avancer(1,pas);sync();}await pause();   // images de chauffe (compilation d'une variante qui change les shaders : 2)
  // seules comptent les images où le jeu a vraiment dessiné (un jeu qui ne redessine qu'une image sur deux, ou à la demande,
  // donnerait sinon une médiane qui saute entre 0 et le vrai coût) ; jusqu'à 4k essais pour en réunir k
  P.rendus=new Map();P.compte=true;const a=[];let essais=0;
  try{while(a.length<k&&essais<4*k){const n0=P.tot||0,t0=now();H.avancer(1,pas);sync();const dt=now()-t0;essais++;if((P.tot||0)>n0)a.push(dt);if(essais%4==0)await pause();}}finally{P.compte=false;}
  if(!a.length)return{ms:null,appels:0,tri:0,rendus:P.rendus,essais,dessinees:0};
  a.sort((x,y)=>x-y);let ap=0,tr=0;for(const v of P.rendus.values()){ap+=v.appels;tr+=v.tri;}
  return{ms:+a[a.length>>1].toFixed(2),appels:Math.round(ap/a.length),tri:Math.round(tr/a.length),rendus:P.rendus,essais,dessinees:a.length};};
 // 1) image de base (et scènes réellement rendues)
 const b0=await mes(3);
 if(b0.ms===null)return{erreur:"le jeu n'a dessiné aucune image 3D en "+b0.essais+" images (scène immobile redessinée à la demande ? la faire bouger dans « js »)",moteurs:P.rend.length};
 const ms0=Math.max(b0.ms,0.05);
 const k=imgVoulues>0?imgVoulues:Math.max(4,Math.min(15,Math.round(2500/ms0)));  // ≈ 2,5 s de rendu par variante, 4 images au moins (3 : bruit 15 % sur Valdragon)
 const base=await mes(k);
 let scenes=[];
 if(cible){try{const s=(0,eval)('('+cible+')');if(s&&s.isScene)scenes=[s];}catch(e){return{erreur:'profil.scene : '+String(e).slice(0,120)};}}
 if(!scenes.length)scenes=[...base.rendus.entries()].filter(([s,v])=>s&&s.isScene&&s.children.length).sort((a,b)=>b[1].tri-a[1].tri||b[1].appels-a[1].appels).slice(0,2).map(x=>x[0]);
 if(!scenes.length)return{erreur:'aucune scène Three.js rendue pendant les images mesurées',moteurs:P.rend.length};
 const ren=(base.rendus.get(scenes[0])||{}).ren||P.rend[0];
 const res={images:k,dessin_une_image_sur:+(base.essais/Math.max(1,base.dessinees)).toFixed(1),base:{ms:base.ms,appels:base.appels,triangles:base.tri},moteurs:P.rend.length,
   scenes:[...base.rendus.entries()].filter(([s])=>s&&s.isScene).map(([s,v])=>({nom:s.name||'Scene',enfants:s.children.length,rendus_par_image:+(v.n/Math.max(1,base.dessinees)).toFixed(1),appels:Math.round(v.appels/Math.max(1,base.dessinees)),triangles:Math.round(v.tri/Math.max(1,base.dessinees)),...(v.cible?{dans_une_cible:true}:{})})),
   variantes:[]};
 // 2) groupes d'objets : enfants visibles de la scène ; un groupe qui porte > 50 % des triangles ou des objets est ouvert (3 niveaux au plus)
 const ignore=o=>o.isLight||o.isCamera||!o.visible;
 const net=x=>(x||'').replace(/[\s_\-.#:]*\d+$/,'').trim();
 const nomDe=(o,pref)=>{let n=net(o.name);
   if(!n&&o.children.length){let f=[...o.children];for(let i=0;i<f.length&&i<40;i++){if(net(f[i].name)){n=o.type+'‹'+net(f[i].name)+'›';break;}f.push(...f[i].children);}}  // groupe sans nom : nom du 1er descendant nommé (pièces KayKit…)
   if(!n){const m=o.material?(Array.isArray(o.material)?o.material[0]:o.material):null;n=o.type+(m?'·'+m.type.replace(/Material$/,''):'')+(o.isMesh&&o.geometry&&o.geometry.type!=='BufferGeometry'?'·'+o.geometry.type.replace(/Geometry$/,''):'');}
   return (pref?pref+'/':'')+n;};
 // base remesurée toutes les 3 variantes : chaque variante est comparée aux bases mesurées juste avant et juste après (la machine dérive)
 const seq=[{base:base.ms}],bA=[base.appels],bT=[base.tri];let depuis=0;const rebase=async()=>{if(++depuis>=3){depuis=0;const b=await mes(k);if(b.ms!==null){seq.push({base:b.ms});bA.push(b.appels);bT.push(b.tri);}}};
 for(const sc of scenes){
  const total=tri(sc)||1,totalN=nm(sc)||1;let L=sc.children.filter(o=>!ignore(o)).map(o=>[o,'']);
  for(let prof=0;prof<3;prof++){const i=L.findIndex(([o])=>!o.isMesh&&o.children.filter(c=>!ignore(c)).length>=2&&(tri(o)>total*.5||nm(o)>totalN*.5));if(i<0)break;
   const [o,p]=L[i];L.splice(i,1,...o.children.filter(c=>!ignore(c)).map(c=>[c,nomDe(o,p)]));}
  const G=new Map();for(const [o,p] of L){const n=nomDe(o,p);if(!G.has(n))G.set(n,[]);G.get(n).push(o);}
  let groupes=[...G.entries()].map(([n,os])=>({n,os,t:os.reduce((a,o)=>a+tri(o),0)})).sort((a,b)=>b.t-a.t);
  if(groupes.length>maxG){const r=groupes.slice(maxG-1);groupes=groupes.slice(0,maxG-1).concat([{n:'autres ('+r.length+' groupes)',os:r.flatMap(g=>g.os),t:r.reduce((a,g)=>a+g.t,0)}]);}
  const pre=scenes.length>1?(sc.name||'scène '+(scenes.indexOf(sc)+1))+' · ':'';
  for(const g of groupes){const avant=g.os.map(o=>o.visible);let m,remis=0;
   try{g.os.forEach(o=>o.visible=false);m=await mes(k,1);remis=g.os.filter(o=>o.visible).length;}finally{g.os.forEach((o,i)=>o.visible=avant[i]);}
   const v={nom:pre+g.n,type:'objets',objets:g.os.length,triangles_vus:g.t,ms:m.ms,appels:m.appels,triangles:m.tri,...(remis?{remis_par_le_jeu:remis}:{})};res.variantes.push(v);seq.push({v});await rebase();}
 }
 // 3) réglages globaux (une variante qui change les shaders compile pendant les 2 images de chauffe, hors mesure)
 const sc0=scenes[0];const mats=()=>{for(const s of scenes)s.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true);});};
 const globales=[];
  // chaque réglage : [nom, appliquer, remettre (valeurs d'avant), toujours appliqué ?, note]
 if(ren.shadowMap&&ren.shadowMap.enabled){let n=0;sc0.traverse(o=>{if(o.isLight&&o.castShadow)n++;});globales.push(['sans ombres ('+n+' lumière(s) qui en projettent)',()=>{ren.shadowMap.enabled=false;mats();},()=>{ren.shadowMap.enabled=true;mats();},()=>!ren.shadowMap.enabled]);}
 if(scenes.some(s=>s.environment)){const e=scenes.map(s=>s.environment);globales.push(['sans environnement (reflets)',()=>{scenes.forEach(s=>s.environment=null);mats();},()=>{scenes.forEach((s,i)=>s.environment=e[i]);mats();},()=>scenes.every(s=>!s.environment)]);}
 {const L=[];for(const s of scenes)s.traverse(o=>{if((o.isPointLight||o.isSpotLight)&&o.visible)L.push(o);});
  if(L.length)globales.push(['sans lumières ponctuelles/projecteurs ('+L.length+')',()=>{L.forEach(o=>o.visible=false);mats();},()=>{L.forEach(o=>o.visible=true);mats();},()=>L.every(o=>!o.visible)]);}
 if(scenes.some(s=>s.fog)){const f=scenes.map(s=>s.fog);globales.push(['sans brouillard',()=>{scenes.forEach(s=>s.fog=null);mats();},()=>{scenes.forEach((s,i)=>s.fog=f[i]);mats();},()=>scenes.every(s=>!s.fog)]);}
 {const pr=ren.getPixelRatio(),cib=scenes.some(s=>(base.rendus.get(s)||{}).cible);
  globales.push(['résolution ½ (4× moins de pixels)',()=>ren.setPixelRatio(pr/2),()=>ren.setPixelRatio(pr),()=>Math.abs(ren.getPixelRatio()-pr/2)<1e-6,
   cib?'scène rendue dans une cible (post-traitement) : seule la sortie finale est réduite, gain sous-estimé':'']);}
 for(const [n,f,r,tient,note] of globales){let m,remis=false;try{f();m=await mes(k);remis=!tient();}finally{r();}
  const v={nom:n,type:'reglage',ms:m.ms,appels:m.appels,triangles:m.tri,...(remis?{remis_par_le_jeu:1}:{}),...(note?{note}:{})};res.variantes.push(v);seq.push({v});await rebase();}
 // 4) base finale ; référence d'une variante = moyenne des bases qui l'encadrent ; bruit = plus grand écart entre deux bases
 //    successives (ce qui peut fausser une comparaison locale), rapporté à la médiane des bases
 const fin=await mes(k);if(fin.ms!==null){seq.push({base:fin.ms});bA.push(fin.appels);bT.push(fin.tri);}res.base_fin_ms=fin.ms;
 const med=L=>{const s=L.slice().sort((x,y)=>x-y),n=s.length;return n%2?s[n>>1]:(s[n/2-1]+s[n/2])/2;};
 res.base.appels=Math.round(med(bA));res.base.triangles=Math.round(med(bT));
 const bases=seq.filter(x=>'base' in x).map(x=>x.base);res.bases_ms=bases;const ref=med(bases);res.base_ref_ms=+ref.toFixed(2);
 let saut=0;for(let i=1;i<bases.length;i++)saut=Math.max(saut,Math.abs(bases[i]-bases[i-1]));
 res.bruit_pct=+(saut/Math.max(ref,1e-6)*100).toFixed(1);
 seq.forEach((x,i)=>{if(!x.v)return;let a=null,b=null;for(let j=i-1;j>=0;j--)if('base' in seq[j]){a=seq[j].base;break;}for(let j=i+1;j<seq.length;j++)if('base' in seq[j]){b=seq[j].base;break;}
  x.v.ref_ms=+(a!==null&&b!==null?(a+b)/2:(a!==null?a:(b!==null?b:ref))).toFixed(2);});
 for(const v of res.variantes){if(v.ms===null){v.gain_ms=v.gain_pct=null;v.note='plus aucune image dessinée sans cela';v.appels_en_moins=v.triangles_en_moins=0;continue;}
  v.gain_ms=+(v.ref_ms-v.ms).toFixed(2);v.gain_pct=+((v.ref_ms-v.ms)/Math.max(v.ref_ms,1e-6)*100).toFixed(1);v.appels_en_moins=res.base.appels-v.appels;v.triangles_en_moins=res.base.triangles-v.triangles;}
 res.variantes.sort((a,b)=>(b.gain_ms??-1e9)-(a.gain_ms??-1e9));
 return res;}"""


def reglages(cfg):
    p = cfg.get('profil') or {}
    return {'groupes': int(p.get('groupes', 20)), 'images': int(p.get('images', 0)), 'scene': p.get('scene') or ''}


async def profiler(pg, cfg, opts=None):
    """Profil de la scène affichée (page préparée par banc.une_passe en temps figé, crochet INIT posé avant le chargement)."""
    r = reglages(cfg)
    if opts:
        r.update({k: v for k, v in opts.items() if v})
    return await pg.evaluate(PROFIL_JS, [1000 / 60, r['images'], r['groupes'], r['scene']])


def tableau(nom, p):
    """Tableau lisible d'un profil : variantes triées par gain."""
    if not p or 'erreur' in p:
        return f"  {nom} : profil impossible — {(p or {}).get('erreur', 'rien')}"
    b = p['base']
    mil = lambda n: f'{n:,}'.replace(',', ' ')
    t = [f"  {nom} : image de base {p.get('base_ref_ms', b['ms']):.1f} ms ({len(p.get('bases_ms', [0, 0]))} mesures, bruit {p['bruit_pct']:.0f} %), {b['appels']} appels, {mil(b['triangles'])} triangles, {p['images']} images par variante"]
    if p.get('dessin_une_image_sur', 1) > 1.2:
        t.append(f"    le jeu ne dessine qu'une image sur {p['dessin_une_image_sur']} : seules les images dessinées sont chronométrées")
    for s in p.get('scenes', []):
        t.append(f"    scène « {s['nom']} » : {s['enfants']} enfants, rendue {s['rendus_par_image']}×/image, {s['appels']} appels, {mil(s['triangles'])} triangles")
    t.append(f"    {'en enlevant…':46s} {'gain':>8s} {'%':>6s} {'appels':>7s} {'triangles':>10s}")
    seuil = max(p['bruit_pct'], 3)
    for v in p['variantes']:
        if v.get('gain_ms') is None:
            t.append(f"   ? {v['nom'][:46]:46s}  {v.get('note', 'non mesuré')}"); continue
        mark = '◀' if v['gain_pct'] >= max(2 * seuil, 8) else (' ' if v['gain_pct'] > seuil else '·')
        nom = v['nom'] + (f" ({v['objets']} obj.)" if v.get('objets', 1) > 1 else '')
        fin = ('  [rétabli par le jeu pendant la mesure : gain non mesurable ainsi]' if v.get('remis_par_le_jeu') else '') + (f"  [{v['note']}]" if v.get('note') else '')
        t.append(f"   {mark} {nom[:46]:46s} {v['gain_ms']:+7.1f}  {v['gain_pct']:+5.0f} {-v['appels_en_moins']:+7d} {-v['triangles_en_moins']:+10d}{fin}")
    t.append(f"    (◀ = poste notable (≥ 2× le bruit) ; · = dans le bruit de {seuil:.0f} % : ne rien conclure. Appels/triangles : écart par image, négatif = en moins ;"
             " une scène animée fait varier un peu ces comptes ; la passe d'ombres n'y est pas comptée)")
    return '\n'.join(t)


def main(argv):
    sys.path.insert(0, ICI)
    import banc
    return banc.main(list(argv) + ['--profil'])


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
