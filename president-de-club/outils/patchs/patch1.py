import re
p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt, (n, old[:80])
    s=s.replace(old,new)

# --- divisions : écarts plus nets, plafond de supporters
s=re.sub(r"const LV=\[.*?\n\];", """const LV=[
 {n:'Régional 2',teams:12,str:[37,47],tick:5, spons:12000,  tv:0,       sub:8000,  promo:2,rel:2,fmin:150, fcap:700},
 {n:'Régional 1',teams:14,str:[44,54],tick:6, spons:32000,  tv:0,       sub:16000, promo:2,rel:3,fmin:300, fcap:1600},
 {n:'National 3',teams:14,str:[50,60],tick:7, spons:95000,  tv:0,       sub:40000, promo:1,rel:3,fmin:600, fcap:3500},
 {n:'National 2',teams:16,str:[56,66],tick:9, spons:300000, tv:0,       sub:90000, promo:1,rel:3,fmin:1200,fcap:8000},
 {n:'National',  teams:18,str:[61,71],tick:11,spons:1100000,tv:400000,  sub:200000,promo:2,rel:4,fmin:2500,fcap:18000},
 {n:'Ligue 2',   teams:18,str:[66,76],tick:15,spons:2500000,tv:3000000, sub:300000,promo:2,rel:2,fmin:6000,fcap:35000},
 {n:'Ligue 1',   teams:18,str:[71,86],tick:28,spons:10000000,tv:18000000,sub:300000,promo:0,rel:2,fmin:15000,fcap:60000},
];""", s, flags=re.S)

# --- favoris dans chaque championnat
rep("let r=rf(L.str[0],L.str[1]);if(S.div===6&&i<=3)r=rf(80,86);",
    "let r=rf(L.str[0],L.str[1]);if(i<=2)r=rf(L.str[1]-1,L.str[1]+2);if(S.div===6&&i<=3)r=rf(82,88);")
rep("S.lastRound=[];S.myResults=[];", "S.lastRound=[];S.myResults=[];S.track=S.track||{cash:[]};S.track.pos=[];")
rep("S.sf={inc:{},exp:{}};", "S.sf={inc:{},exp:{},fi:{}};")

# --- financement hors résultat
rep("function fin(cat,amt){if(!amt)return;S.cash+=amt;const b=",
    "const FIN_CATS=new Set(['Emprunts','Remboursements d’emprunt','Apport des actionnaires']);\nfunction fin(cat,amt){if(!amt)return;S.cash+=amt;if(FIN_CATS.has(cat)){S.sf.fi=S.sf.fi||{};S.sf.fi[cat]=(S.sf.fi[cat]||0)+amt;return;}const b=")
rep("S.loans.forEach(l=>{const pay=Math.min(l.perWeek,l.remaining);l.remaining-=pay;fin('Remboursements d’emprunt',-pay);});",
    "S.loans.forEach(l=>{const pay=Math.min(l.perWeek,l.remaining);l.remaining-=pay;const it=Math.min(pay,l.intW||0);if(it)fin('Intérêts d’emprunt',-it);fin('Remboursements d’emprunt',-(pay-it));});")
rep("S.loans.push({label:'Prêt bancaire '+(rate*100).toFixed(1).replace('.',',')+' %',amount:amt,remaining:total,perWeek:total/(S.N*2)});",
    "S.loans.push({label:'Prêt bancaire '+(rate*100).toFixed(1).replace('.',',')+' %',amount:amt,remaining:total,perWeek:total/(S.N*2),intW:(total-amt)/(S.N*2)});")

# --- supporters, humeur et confiance
rep("""function afterResult(res,att){
  const L=LV[S.div];
  S.fans=Math.round(S.fans*(res==='V'?1.012:res==='N'?1.003:.993));
  if(att&&att>=cap()*.97)S.fans=Math.round(S.fans*1.004);
  S.fans=Math.max(L.fmin,S.fans);
  S.mood=clamp(S.mood+(res==='V'?4:res==='N'?0:-4)+(S.ticket>L.tick*1.4?-1:0),0,100);
  S.confidence=clamp(S.confidence+(res==='V'?1:res==='D'?-1:0),0,100);
}""", """const fanCap=()=>LV[S.div].fcap*(1+S.rep/150);
function afterResult(res,att,diff,home){
  const L=LV[S.div],fc=fanCap();
  if(res==='V')S.fans+=Math.round(Math.max(0,fc-S.fans)*.02);
  else if(res==='N')S.fans+=Math.round(Math.max(0,fc-S.fans)*.005);
  else S.fans=Math.round(S.fans*.994);
  if(att&&att>=cap()*.97)S.fans+=Math.round(Math.max(0,fc-S.fans)*.005);
  if(S.fans>fc)S.fans=Math.round(S.fans-(S.fans-fc)*.04);
  S.fans=Math.max(L.fmin,S.fans);
  S.mood=clamp(S.mood+(res==='V'?4:res==='N'?0:-4)+(S.ticket>L.tick*1.4?-1:0),0,100);
  S.mood+=(60-S.mood)*.06;
  // la confiance dépend du résultat par rapport à ce qui était attendu
  const xp=clamp(1.35+(diff||0)/8+(home?.15:-.15),.2,2.7),pts=res==='V'?3:res==='N'?1:0;
  S.confidence=clamp(S.confidence+(pts-xp)*1.1,0,100);
  S.confidence+=(55-S.confidence)*.015;
}""")
rep("afterResult(rep.res,rep.home?rep.att:0);",
    "afterResult(rep.res,rep.home?rep.att:0,me.ovr-rep.opp.rating,rep.home);\n  S.track.pos.push(myPos());S.track.cash.push(Math.round(S.cash));if(S.track.cash.length>160)S.track.cash.shift();\n  if(S.week===Math.floor(S.N/2))S.teams.forEach(t=>{if(!t.user){const b=rf(-.5,1.5);t.att+=b;t.def+=b;t.rating+=b;}});")
rep("S.cup.round++;S.fans=Math.round(S.fans*(1.02+i*.004));",
    "S.cup.round++;S.fans+=Math.round(Math.max(0,fanCap()-S.fans)*(.02+i*.006));")

# --- progression liée au temps de jeu, plus lente
rep("""  S.players.forEach(p=>{
    if(p.ovr<p.pot){
      const pr=p.age<=21?.13:p.age<=24?.08:p.age<=28?.035:0;
      if(R()<pr+tr*.02+co*.008)p.ovr++;
    }
    if(p.age>=31&&R()<.025*(p.age-30))p.ovr=Math.max(25,p.ovr-1);
  });""", """  S.players.forEach(p=>{
    const played=p.lastPlayed!=null&&S.gw-p.lastPlayed<=2;
    if(p.ovr<p.pot){
      const base=p.age<=20?.075:p.age<=23?.05:p.age<=27?.022:.006;
      if(R()<(base+tr*.007+co*.004)*(played?1.25:.75)*(1+(p.pot-p.ovr)/40))p.ovr++;
    }
    if(p.age>=30&&R()<.012*(p.age-29))p.ovr=Math.max(25,p.ovr-1);
  });""")
rep("const p=e.p;p.apps++;p.sa++;", "const p=e.p;p.apps++;p.sa++;p.lastPlayed=S.gw;")

# --- mercato : attractivité calée sur le niveau moyen, prime pour les joueurs au-dessus
rep("""  const gap=p.ovr-(L.str[1]+S.rep/20+S.infra.pelouse);
  return gap<=0?.9:gap<=4?.65:gap<=8?.32:gap<=12?.12:.03;""",
"""  const gap=p.ovr-((L.str[0]+L.str[1])/2+4+S.rep/25+S.infra.pelouse*.7);
  return gap<=0?.9:gap<=3?.6:gap<=6?.3:gap<=9?.1:.02;""")
rep("const d=clamp(S.div+pick([-1,-1,0,0,0,0,1,rec>=3?1:0,rec>=4?1:0]),0,6);",
    "const d=clamp(S.div+pick([-1,-1,0,0,0,0,0,1,rec>=4?1:0]),0,6);")
rep("p.ovr=clamp(p.ovr+Math.round(rec*.6-1),25,92);", "p.ovr=clamp(p.ovr+Math.round(rec*.5-1),25,92);")
rep("p.demand=Math.round(wageFor(p.ovr)*rf(1,1.35)/10)*10;",
    "p.demand=Math.round(wageFor(p.ovr)*rf(1,1.35)*(1+Math.max(0,p.ovr-LV[S.div].str[1])*.06)/10)*10;")

# --- coupe : adversaires plus relevés dans le dernier carré
rep("const od=i<6?clamp(Math.floor(i*.7)+ri(-1,1),0,4):clamp(ri(i-6,6),0,6);",
    "const od=i<6?clamp(Math.floor(i*.7)+ri(-1,1),0,4):clamp(ri(Math.max(0,i-4),6),0,6);")

# --- garde-fous
rep("if(!S||S.over||UI.modalOpen)return;", "if(!S||S.over||UI.modalOpen)return;\n  if(UI.queue.length){nextQueue();return;}")
rep("A.cands=function(role){S.cands[role]=",
    "A.cands=function(role){if(S.cands[role]&&S.cands[role].gw===S.gw){toast('Nouveaux candidats disponibles après la prochaine journée.');return;}S.cands[role]=")
rep("S.flags.kitDeal=true;S.naming+=d.amt*0+0;S.sponsorBonus+=d.amt;", "S.flags.kitDeal=true;S.sponsorBonus+=d.amt;")
open(p,'w').write(s); print('ok')
