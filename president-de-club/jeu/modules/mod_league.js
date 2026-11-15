/* ====================== Championnat persistant (divisions amateurs) ====================== */
function leagueSnap(){S._snap={div:S.div,teams:standings().map((t,i)=>({name:t.name,rating:t.rating,user:!!t.user,rank:i+1,sq:t.sq||null,c:t.c||null}))};}
function sqTurnover(sq){if(!sq)return genSq();const out=sq.map(x=>R()<.25?Object.assign(genSq().find(y=>y.pos===x.pos)||{},{pos:x.pos}):Object.assign({},x,{g:0,a:0}));return out.map(x=>Object.assign(x,{g:0,a:0}));}
function leagueCarry(){
  const sn=S._snap;S._snap=null;if(!sn||S.div>2)return;
  const L=LV[S.div],Lp=LV[sn.div],n=sn.teams.length,same=sn.div===S.div;
  let keep;
  if(same)keep=sn.teams.filter(t=>!t.user&&t.rank>Lp.promo&&t.rank<=n-Lp.rel);
  else if(S.div>sn.div)keep=sn.teams.filter(t=>!t.user&&t.rank<=Lp.promo);
  else keep=sn.teams.filter(t=>!t.user&&t.rank>n-Lp.rel);
  const ai=S.teams.filter(t=>!t.user),mid=(n+1)/2;
  keep=keep.slice(0,ai.length);
  keep.forEach((k,i)=>{const t=ai[i];let r=k.rating;
    if(same)r+=(mid-k.rank)*.12+rf(-1.5,1.5);else if(S.div>sn.div)r=Math.max(L.str[0]+rf(0,2),r+rf(0,1.5));else r=Math.min(L.str[1]+rf(-1,1),r-rf(0,1));
    r=clamp(r,L.str[0]-3,L.str[1]+3);
    t.name=k.name;t.rating=r;t.att=r+rf(-2.5,2.5);t.def=r+rf(-2.5,2.5);t.sq=sqTurnover(k.sq);if(k.c)t.c=k.c;
    t.last=k.rank+'e'+(same?'':' en '+Lp.n);t.tag=same?'':(S.div>sn.div?'promu':'relégué');});
  // les nouveaux venus : relégués de la division du dessus (plus forts) et promus du dessous
  const fresh=ai.slice(keep.length);const nTop=S.div<6?Math.min(fresh.length,LV[S.div+1].rel||2):0;
  fresh.forEach((t,i)=>{const top=i<nTop;const r=top?L.str[1]-rf(-.5,2):L.str[0]+rf(0,3);t.rating=r;t.att=r+rf(-2.5,2.5);t.def=r+rf(-2.5,2.5);t.tag=top?'relégué':'promu';t.last=top?'descend de '+LV[Math.min(6,S.div+1)].n:'monte de '+(S.div>0?LV[S.div-1].n:'Régional 3');});
  {const used=new Set(S.teams.map(t=>t.name));S.teams.forEach(t=>used.add('t:'+t.name.split(' ').slice(1).join(' ')));if(S.terr)used.add('t:'+S.terr.n);const tw=new Set(keep.map(k=>k.name.split(' ').slice(1).join(' ')));
   fresh.forEach(t=>{if(tw.has(t.name.split(' ').slice(1).join(' '))&&t.name!==S.rivalName){const nm=clubNameLocal(used);used.add(nm);t.name=nm;}});}
  const names=keep.map(k=>k.name);
  if(names.length)news('Nouvelle saison en '+L.n+' : vous retrouvez '+names.slice(0,4).join(', ')+(names.length>4?' et '+(names.length-4)+' autres':'')+'. '+fresh.length+' nouveaux venus.','');
}
