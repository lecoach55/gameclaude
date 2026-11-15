/* ====================== Coupes d'Europe ====================== */
const EURO={
 ldc:{n:'Ligue des champions',s:'LdC',md:8,part:18.6e6,win:2.1e6,draw:.7e6,pos:.275e6,po:1e6,r16:11e6,qf:12.5e6,sf:15e6,f:18.5e6,w:6.5e6,str:[73,92],tick:2.2,col:'#8fb3ff',pts:3},
 lde:{n:'Ligue Europa',s:'LE',md:8,part:4.31e6,win:.45e6,draw:.15e6,pos:.03e6,po:.3e6,r16:1.75e6,qf:2.5e6,sf:4e6,f:7e6,w:6e6,str:[69,86],tick:1.7,col:'#ff9d4d',pts:2},
 lce:{n:'Ligue Conférence',s:'LC',md:6,part:3.17e6,win:.4e6,draw:.133e6,pos:.02e6,po:.2e6,r16:.8e6,qf:1.3e6,sf:2.5e6,f:4e6,w:3e6,str:[63,81],tick:1.4,col:'#5fd39a',pts:1}
};
const KO_N={po:'Barrages',r16:'8es de finale',qf:'Quarts de finale',sf:'Demi-finales',f:'Finale'},KO_NEXT={po:'r16',r16:'qf',qf:'sf',sf:'f'};
const EU_C=[
 ['ENG',1,['Leeds','Brighton','Nottingham','Leicester','Sheffield','Bristol','Norwich','Sunderland','Burnley','Derby','Ipswich','Southampton'],null,[' United',' City',' Athletic',' Rovers',' Town']],
 ['ESP',1,['Sevilla','Valencia','Bilbao','Vigo','Getafe','Málaga','Zaragoza','Pamplona','Vitoria','Gijón','Elche','Cadix'],['Real ','CD ','UD ','Deportivo ','Atlético '],null],
 ['GER',1,['Bochum','Kiel','Hanovre','Nuremberg','Karlsruhe','Rostock','Brême','Fribourg','Augsbourg','Darmstadt','Heidenheim','Paderborn'],['VfB ','SV ','FC ','TSV ','SC '],null],
 ['ITA',1,['Parme','Bari','Palerme','Vérone','Lecce','Pise','Pérouse','Brescia','Bergame','Udine','Gênes','Cagliari'],['AC ','US ','FC ','SS '],null],
 ['POR',2,['Braga','Guimarães','Setúbal','Aveiro','Coimbra','Faro','Porto','Funchal'],['SC ','CD ','FC ','Vitória '],null],
 ['NED',2,['Utrecht','Groningue','Zwolle','Breda','Arnhem','Tilburg','Heerenveen','Alkmaar'],['FC ','SC ','RKC ','Go Ahead '],null],
 ['BEL',2,['Gand','Malines','Ostende','Liège','Genk','Courtrai','Charleroi','Bruges'],['KAA ','KV ','RSC ','Royal '],null],
 ['TUR',2,['Konya','Trabzon','Bursa','Sivas','Antalya','Kayseri','Izmir','Samsun'],null,['spor',' FK','spor Kulübü']],
 ['SCO',3,['Dundee','Aberdeen','Perth','Kilmarnock','Motherwell','Inverness'],null,[' Thistle',' FC',' Athletic',' United']],
 ['GRE',3,['Patras','Larissa','Volos','Xánthi','Héraklion','Ioannina'],['AE ','PAS ','FC '],null],
 ['AUT',3,['Linz','Graz','Innsbruck','Salzbourg','Ried','Klagenfurt'],['SV ','SK ','FC '],null],
 ['SUI',3,['Lucerne','Saint-Gall','Lugano','Sion','Bâle','Thoune'],['FC '],null],
 ['CRO',3,['Split','Rijeka','Osijek','Zadar'],['NK ','HNK '],null],
 ['SRB',3,['Novi Sad','Niš','Kragujevac','Subotica'],['FK '],null],
 ['CZE',3,['Plzeň','Ostrava','Liberec','Olomouc'],['FK ','SK ','FC '],null],
 ['DEN',3,['Aarhus','Odense','Aalborg','Herning'],['FC ','AGF ','B '],null],
 ['NOR',3,['Bergen','Tromsø','Molde','Bodø'],['IL ','FK ','SK '],null],
 ['SWE',3,['Malmö','Göteborg','Norrköping','Halmstad'],['IF ','IFK ','BK '],null],
 ['POL',3,['Poznań','Cracovie','Gdańsk','Białystok'],['KS ','GKS ','MKS '],null],
 ['UKR',3,['Kharkiv','Lviv','Odessa','Dnipro'],['FK ','FC '],null]
];
function euroName(used){for(let k=0;k<40;k++){const c=wPick(EU_C,x=>[0,5,3,1.6][x[1]]);const city=pick(c[2]);const n=c[3]?pick(c[3])+city:city+pick(c[4]);if(!used.has(n)){used.add(n);return [n,c[0],c[1]];}}return ['FC Europa '+ri(1,99),'EUR',3];}
function euroTeam(k,used,boost){const C=EURO[k],[name,c,t]=euroName(used);let r=rf(C.str[0],C.str[1]-4)+{1:4,2:0,3:-3}[t]+(boost||0);if(R()<.08)r=rf(C.str[1]-3,C.str[1]+1);r=clamp(r,C.str[0]-2,C.str[1]+1);
  return {name,c,rating:r,att:r+rf(-2.5,2.5),def:r+rf(-2.5,2.5),mom:0,sq:genSq(),P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0};}
function euroSetup(k){
  const C=EURO[k],used=new Set([S.club.name]),n=C.md;
  const teams=[{name:S.club.name,c:'FRA',user:true,rating:0,P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0}];
  for(let i=0;i<35;i++)teams.push(euroTeam(k,used));
  // deux autres clubs français, pour la couleur locale
  const fr=S.teams.filter(t=>!t.user).sort((a,b)=>b.rating-a.rating).slice(0,2);fr.forEach((f,i)=>{const t=teams[1+i];t.name=f.name;t.c='FRA';});
  const opp=shuffle([...Array(35).keys()].map(x=>x+1)).slice(0,n);
  const lpw=[...Array(n).keys()].map(i=>Math.round(2+i*(S.N*.53)/(n-1)));
  S.euro={k,teams,opp,md:0,lpw,phase:'league',ko:null,log:[],earned:0,rank:null,seed:false};
  fin('Compétitions européennes',C.part);S.euro.earned+=C.part;
  S.uefa=(S.uefa||[]).filter(u=>u.y>S.year-3);S.uefa.push({y:S.year,k,pts:C.pts});
  news('Le club est qualifié pour la phase de ligue de la '+C.n+' : '+money(C.part)+' de prime de participation.','g');
}
function euroRec(h,a,gh,ga){[h,a].forEach(t=>t.P++);h.GF+=gh;h.GA+=ga;a.GF+=ga;a.GA+=gh;
  if(gh>ga){h.W++;a.L++;h.Pts+=3;}else if(gh<ga){a.W++;h.L++;a.Pts+=3;}else{h.D++;a.D++;h.Pts++;a.Pts++;}}
function euroTable(){return [...S.euro.teams].sort((a,b)=>b.Pts-a.Pts||(b.GF-b.GA)-(a.GF-a.GA)||b.GF-a.GF||a.name.localeCompare(b.name));}
function euroDue(){const E=S.euro;if(!E||E.phase==='out'||E.phase==='won')return false;
  if(E.phase==='league')return E.lpw[E.md]===S.week;
  if(E.phase==='ko')return E.ko.weeks[E.ko.leg]===S.week;return false;}
function euroGate(opp,mult){if(delocOn())return 0;const att=Math.min(cap(),Math.round(attendance(opp,mult)));const C=EURO[S.euro.k];fin('Billetterie européenne',att*S.ticket*C.tick);fin('Buvette',att*BUV[S.infra.commerce]);return att;}
function euroPlay(){
  const E=S.euro,C=EURO[E.k];
  S.players.forEach(p=>{p.fit=clamp(p.fit+3,20,100);});
  if(E.phase==='league'){
    const i=E.md,oi=E.opp[i],opp=E.teams[oi],home=i%2===0,ui=0;
    coachDecide(opp);const me=strength();
    const d=userMatch(home,opp,me,false,true);
    const rest=shuffle(E.teams.map((t,j)=>j).filter(j=>j!==ui&&j!==oi));
    for(let k=0;k+1<rest.length;k+=2){const a=E.teams[rest[k]],b=E.teams[rest[k+1]];const [g1,g2]=simGoals(aiStr(a),aiStr(b));euroRec(a,b,g1,g2);}
    if(home)euroRec(E.teams[0],opp,d.gf,d.ga);else euroRec(opp,E.teams[0],d.ga,d.gf);
    E.md++;
    const prize=d.res==='V'?C.win:d.res==='N'?C.draw:0;if(prize){fin('Compétitions européennes',prize);E.earned+=prize;}
    if(home)d.att=euroGate(opp,1.6);
    E.log.push({r:'J'+(i+1),opp:opp.name,c:opp.c,home,gf:d.gf,ga:d.ga,res:d.res});
    d.home=home;d.opp={name:opp.name,rating:opp.rating};d.comp=C.n+' · Phase de ligue, J'+(i+1);d.euro=E.k;
    news(C.s+' · '+(home?'contre ':'à ')+opp.name+' ('+opp.c+') : '+d.gf+'-'+d.ga+(prize?' · prime '+money(prize):''),d.res==='V'?'g':d.res==='D'?'b':'');
    S.mood=clamp(S.mood+(d.res==='V'?4:d.res==='D'?-2:1),0,100);S.rep=clamp(S.rep+(d.res==='V'?.6:.2),0,100);
    if(E.md>=C.md)euroLeagueEnd();
    return d;
  }
  // phase à élimination directe
  const K=E.ko,opp=K.opp,final=K.r==='f',leg=K.leg,home=final?false:(leg===0?!K.seed:K.seed);
  coachDecide(opp);const me=strength();
  const d=userMatch(home,opp,me,final,true);
  K.agg[0]+=d.gf;K.agg[1]+=d.ga;
  if(home)d.att=euroGate(opp,1.8+(['qf','sf'].includes(K.r)?.4:0));
  if(final){d.att=Math.round(rf(60000,72000));d.neutral=true;}
  d.home=final?true:home;d.opp={name:opp.name,rating:opp.rating};d.euro=E.k;
  const lab=C.n+' · '+KO_N[K.r]+(final?'':leg===0?' (aller)':' (retour)');
  let decided=final||leg===1,win=null,tab=null;
  if(decided){
    if(K.agg[0]!==K.agg[1])win=K.agg[0]>K.agg[1];
    else{const pw=clamp(.5+(me.ovr-opp.rating)*.01,.3,.7);win=R()<pw;const a=ri(3,5);tab=win?[a,a-ri(1,2)]:[a-ri(1,2),a];tab=tab.map(x=>Math.max(x,1));if(tab[0]===tab[1])tab[win?0:1]++;d.tab=tab;}
  }
  d.comp=lab+(decided&&!final?' · cumul '+K.agg[0]+'-'+K.agg[1]:'');
  E.log.push({r:KO_N[K.r]+(final?'':leg===0?' aller':' retour'),opp:opp.name,c:opp.c,home:d.home,gf:d.gf,ga:d.ga,res:d.res,tab});
  if(!decided){K.leg=1;news(C.s+' · '+KO_N[K.r]+' aller : '+d.gf+'-'+d.ga+' face à '+opp.name+'.','');return d;}
  if(win){
    if(final){E.phase='won';fin('Compétitions européennes',C.w);E.earned+=C.w;S.palmares.push(C.n+' '+seasonLabel(S.year));S.rep=clamp(S.rep+15,0,100);S.mood=100;S.confidence=clamp(S.confidence+20,0,100);S.fans=Math.round(S.fans*1.15);
      news('LE CLUB REMPORTE LA '+C.n.toUpperCase()+' ! Prime de '+money(C.w)+'.','g');d.euroWon=true;}
    else{const nx=KO_NEXT[K.r];fin('Compétitions européennes',C[nx]);E.earned+=C[nx];S.rep=clamp(S.rep+2,0,100);S.mood=clamp(S.mood+6,0,100);S.confidence=clamp(S.confidence+3,0,100);
      news(C.s+' · qualification pour les '+KO_N[nx].toLowerCase()+' face à '+opp.name+(tab?' aux tirs au but':'')+' ! Prime de '+money(C[nx])+'.','g');euroKO(nx);}
  }else{E.phase='out';news(C.s+' · élimination en '+KO_N[K.r].toLowerCase()+' face à '+opp.name+(tab?' aux tirs au but':'')+'. Gains européens de la saison : '+money(E.earned)+'.','b');}
  return d;
}
function euroLeagueEnd(){
  const E=S.euro,C=EURO[E.k],tb=euroTable(),r=tb.findIndex(t=>t.user)+1;E.rank=r;
  const pb=Math.round((37-r)*C.pos);fin('Compétitions européennes',pb);E.earned+=pb;
  if(r<=8){E.seed=true;fin('Compétitions européennes',C.r16);E.earned+=C.r16;news(C.s+' · '+r+'e de la phase de ligue : qualification directe pour les 8es de finale ('+money(C.r16+pb)+') !','g');euroKO('r16');}
  else if(r<=24){fin('Compétitions européennes',C.po);E.earned+=C.po;news(C.s+' · '+r+'e de la phase de ligue : barrages pour les 8es.','');E.seed=r<=16;euroKO('po');}
  else{E.phase='out';news(C.s+' · '+r+'e de la phase de ligue : élimination. Gains européens : '+money(E.earned)+'.','b');}
}
function euroKO(r){
  const E=S.euro,tb=euroTable().filter(t=>!t.user),N=S.N;
  let pool;
  if(r==='po')pool=[tb[33-(E.rank||17)-1]||tb[15]];
  else if(r==='r16')pool=E.seed?tb.slice(8,24):tb.slice(0,8);
  else pool=tb.slice(0,12);
  const used=new Set(E.log.map(l=>l.opp));let opp=pick(pool.filter(t=>!used.has(t.name))||pool)||pick(tb.slice(0,10));
  if(!opp)opp=tb[0];
  const boost={po:0,r16:.5,qf:1.2,sf:2,f:2.5}[r];
  const o={name:opp.name,c:opp.c,rating:opp.rating+boost,att:opp.att+boost,def:opp.def+boost,mom:0,sq:opp.sq||genSq()};
  const wk={po:[.62,.65],r16:[.7,.73],qf:[.79,.82],sf:[.88,.91],f:[1,1]}[r].map(x=>r==='f'?N-1:Math.round(x*N));
  if(wk[1]===wk[0])wk[1]++;
  E.phase='ko';E.ko={r,opp:o,leg:0,agg:[0,0],weeks:r==='f'?[N-1]:wk,seed:E.seed&&r!=='po'?true:E.seed};
}
/* qualification européenne selon le classement de Ligue 1 (et la Coupe de France) */
function euroQualif(pos,cupWon){
  if(S.div===6){if(pos<=3)return 'ldc';if(pos===4)return 'ldcq';if(pos===5||cupWon)return 'lde';if(pos===6)return 'lce';return null;}
  if(cupWon&&S.div>=5)return 'lde';return null;
}
const EQ_TXT={ldc:'Ligue des champions (phase de ligue)',ldcq:'tour préliminaire de la Ligue des champions',lde:'Ligue Europa',lce:'Ligue Conférence'};
function uefaIndex(){return (S.uefa||[]).filter(u=>u.y>S.year-3).reduce((s,u)=>s+u.pts,0);}

/* ====================== Les cadors de Ligue 1 ====================== */
function eliteSetup(){
  const ai=S.teams.filter(t=>!t.user);
  if(!S.elite){const used=new Set(S.teams.map(t=>t.name));S.elite=[{base:90,n:'Racing'},{base:87},{base:85}].map(e=>({name:clubName(used),base:e.base}));}
  const me=S.lastStr||60;
  S.elite.forEach((e,k)=>{const t=ai[k];if(!t)return;t.name=e.name;let r=e.base+rf(-1.5,1.5);
    if(me>r-2){r=Math.min(94.5,Math.max(r,me+rf(-1.5,2)-k*1.4));e.base=clamp(Math.max(e.base,r-1),84,93);}
    t.rating=r;t.att=r+rf(-2,2);t.def=r+rf(-2,2);t.elite=true;});
  ai.slice(3,7).forEach(t=>{const r=rf(79.5,84);t.rating=r;t.att=r+rf(-2,2);t.def=r+rf(-2,2);});
}

/* ====================== Investisseurs ====================== */
const INV_T={
 fonds:{n:'Fonds d’investissement américain',d:'Un fonds qui possède déjà plusieurs clubs en Europe. Il veut des résultats rapides et une valorisation du club.',amt:[.9,1.5],own:20,mood:-6,dem:'europe'},
 golfe:{n:'Consortium du Golfe',d:'Des moyens quasi illimités, une stratégie d’image mondiale. Les supporters historiques se méfient.',amt:[1.8,3],own:10,mood:-12,dem:'titre'},
 local:{n:'Entrepreneur de la région',d:'Un patron du coin, attaché au club et à son ancrage local. Plus patient, moins riche.',amt:[.35,.6],own:45,mood:6,dem:'milieu'}
};
const DEM_TXT={europe:'une place européenne (top 6)',titre:'le podium (top 3)',milieu:'la première moitié de tableau',montee:'la montée en Ligue 1'};
function demandOk(dem,pos,out){if(S.div<6&&dem!=='milieu')return out==='up';return dem==='titre'?pos<=3:dem==='europe'?pos<=6:pos<=9;}
