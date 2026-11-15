// ===== Sauvegarde en ligne pour grosses parties (compressée + découpée) — testé sur Wall Street =====
// Pour les jeux dont la sauvegarde dépasse quelques centaines de Kio (historiques de prix, etc.).
// Compression gzip (CompressionStream) puis base64, découpage en morceaux de 240 000 caractères :
// documents data/users/<id>/partie (méta + 1er morceau) et partie_1, partie_2… ; la méta est écrite en dernier
// avec un identifiant commun, donc une lecture ne mélange jamais deux versions.
// Artefact : déclarer capabilities {db:{},user:{}} AVANT de publier le code qui s'en sert.
// Usage :
//   const NUAGE=SauvegardeEnLigne({etat:()=>JSON.stringify(G), meta:()=>({t:G.savedAt,jour:G.day})});
//   NUAGE.push();          // après chaque sauvegarde locale (limité à une écriture toutes les 30 s)
//   NUAGE.push(true);      // immédiat (visibilitychange → hidden, pagehide)
//   const m=await NUAGE.get();  if(m && m.t>localT) proposer « Reprendre la partie de l'autre appareil »
//   const texte=await NUAGE.full(m);  // partie complète décompressée
//   await NUAGE.put('mesures_'+Date.now(),obj);  // documents de test (jamais la partie)
// Règle : ne jamais écraser une partie locale sans demander ; proposer la plus récente.
function SauvegardeEnLigne(o){
  let DB=null,UID=null,init=null,busy=false,pend=null,lastT=0,tm=null;const ECART=o.ecart||30000,CH=240000;
  const to=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r({code:'timeout'}),ms))]);
  const ini=()=>init||(init=(async()=>{try{if(!window.claude||!window.claude.use)return false;const [db,u]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);if(!db||!u)return false;const id=await u.id();if(!id)return false;DB=db;UID=id;return true;}catch(e){return false;}})());
  const doc=n=>DB.collection('data/users/'+UID).doc(n);
  const b64=buf=>{let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);};
  const unb64=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;};
  const zip=async str=>{if(!window.CompressionStream)return {raw:str};const r=new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip')));return {z:b64(await r.arrayBuffer())};};
  const unzip=z=>new Response(new Blob([unb64(z)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  async function ecrire(str,meta){const p=await zip(str),body=p.z||p.raw,n=Math.max(1,Math.ceil(body.length/CH)),id=Date.now().toString(36);
    for(let k=1;k<n;k++)await to(doc('partie_'+k).set({id,c:body.slice(k*CH,(k+1)*CH)}),20000);
    await to(doc('partie').set(Object.assign({id,n,gz:!!p.z,c:body.slice(0,CH)},meta)),20000);N.taille=body.length;}
  async function get(){if(!await ini())return null;try{const s=await to(doc('partie').get(),10000);return s&&s.exists?s.data():null;}catch(e){return null;}}
  async function full(m){let body=m.c;for(let k=1;k<m.n;k++){const s=await to(doc('partie_'+k).get(),10000);const d=s&&s.exists&&s.data();if(!d||d.id!==m.id)return null;body+=d.c;}return m.gz?unzip(body):body;}
  async function pump(){if(busy||!pend)return;if(!await ini()){pend=null;return;}busy=true;const p=pend;pend=null;
    try{await ecrire(p.s,p.m);N.ok=true;N.err='';}catch(e){N.err=String(e&&(e.code||e.message)||e).slice(0,160);if(e&&(e.code==='unavailable'||e.code==='timeout')){pend=pend||p;busy=false;setTimeout(pump,4000+Math.random()*3000);return;}}
    busy=false;if(pend)pump();}
  function push(now){if(o.coupe&&o.coupe())return;clearTimeout(tm);const go=()=>{lastT=Date.now();pend={s:o.etat(),m:Object.assign({t:Date.now()},o.meta?o.meta():{})};pump();};
    const w=ECART-(Date.now()-lastT);if(now||w<=0)go();else tm=setTimeout(go,w);}
  const N={ini,get,full,push,ok:false,err:'',taille:0,put:async(n,obj)=>{if(!await ini())return false;try{await to(doc(n).set(obj),10000);return true;}catch(e){return false;}}};
  return N;
}
