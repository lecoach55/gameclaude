p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)

# ---------- pyramide 2026-27 : National 2 (ex-N3), National 1 (ex-N2), Ligue 3 (ex-National)
rep(" {n:'National 3',teams:14,str:[50,60],tick:7, spons:95000,  tv:0,       sub:40000, promo:2,rel:3,fmin:600, fcap:3500},",
    " {n:'National 2',teams:14,str:[50,60],tick:7, spons:95000,  tv:0,       sub:40000, promo:2,rel:3,fmin:600, fcap:3500},")
rep(" {n:'National 2',teams:16,str:[56,66],tick:9, spons:300000, tv:0,       sub:90000, promo:1,rel:3,fmin:1200,fcap:8000},",
    " {n:'National 1',teams:16,str:[56,66],tick:9, spons:300000, tv:0,       sub:90000, promo:1,rel:3,fmin:1200,fcap:8000},")
rep(" {n:'National',  teams:18,str:[61,71],tick:11,spons:1100000,tv:400000,  sub:200000,promo:2,rel:4,fmin:2500,fcap:18000},",
    " {n:'Ligue 3',   teams:18,str:[61,71],tick:12,spons:1800000,tv:500000,  sub:250000,promo:2,rel:3,fmin:2500,fcap:18000,pro:1},")
# Ligue 2 un peu plus riche (budget moyen réel ~15 M€)
rep("spons:2500000,tv:3000000, sub:300000,","spons:3500000,tv:4000000, sub:300000,")
rep("Le club peut désormais créer sa SASP, indispensable pour la Ligue 2.","Le club peut désormais créer sa SASP : le statut professionnel est obligatoire dès la Ligue 3.")
s=s.replace("Le passage en SASP (statut professionnel) devient possible à partir de la National 2.","Le passage en SASP (statut professionnel) devient possible à partir de la National 1. Il est obligatoire pour jouer en Ligue 3.")
s=s.replace("La société anonyme sportive professionnelle est obligatoire pour évoluer en Ligue 2 et en Ligue 1.","La société anonyme sportive professionnelle est obligatoire pour évoluer en Ligue 3, Ligue 2 et Ligue 1.")
# cahier des charges inspiré de la licence club
rep("  if(t===3){add('Éclairage d’entraînement',i.eclairage>=1);add('Stade de 800 places',i.stade>=1);}",
    "  if(t===2){add('Trésorerie positive (sinon interdiction d’accession)',S.cash>=0);}\n  if(t===3){add('Éclairage d’entraînement',i.eclairage>=1);add('Stade de 800 places',i.stade>=1);add('Trésorerie positive',S.cash>=0);}")
rep("  if(t===4){add('Stade de 1 500 places',i.stade>=2);add('Éclairage fédéral E4',i.eclairage>=2);add('Terrain synthétique ou mieux',i.pelouse>=1);}",
    "  if(t===4){add('Statut professionnel (SASP)',S.sasp);add('Tribune couverte, 1 500 places (niveau T2)',i.stade>=2);add('Éclairage fédéral E4',i.eclairage>=2);add('Terrain synthétique ou mieux',i.pelouse>=1);add('Trésorerie positive',S.cash>=0);}")

# ---------- Coupe de France : dotations alignées (7e tour 7 500 €) + bonus exploit
rep("const CUP_PRIZE=[800,1200,2000,4000,6000,10000,25000,50000,90000,200000,450000,1200000];",
    "const CUP_PRIZE=[800,1200,2000,4000,7500,10000,20000,40000,80000,160000,400000,1200000];")
rep("    if(i>=6)S.rep=clamp(S.rep+1.5,0,100);",
    "    if(i>=6)S.rep=clamp(S.rep+1.5,0,100);\n    if(S.div<=3&&od>S.div){const bx=1500*(od-S.div);fin('Coupe de France',bx);news('Bonus exploit de la FFF : '+money(bx)+' pour avoir éliminé un club de '+LV[od].n+'.','g');}")

# ---------- barrages L3/L2 et L2/L1
rep("  if(S.div>=4&&S.cash<0&&out!=='down'){out='dncg';notes.push('La DNCG prononce une rétrogradation administrative pour déficit.');}",
    """  let barrage=null;const me=strength().ovr;
  if(out==='stay'&&(S.div===4||S.div===5)&&pos===3){const oppR=LV[S.div+1].str[0]+rf(1,4),pw=clamp(.5+(me-oppR)*.035,.12,.88),win=R()<pw;
    barrage={up:true,win,txt:'Barrage d’accession contre le 16e de '+LV[S.div+1].n+' : '+(win?'victoire, le club monte !':'défaite, pas de montée.')};
    if(win){const rq=reqs(S.div+1);out=rq.every(x=>x.ok)?'up':'refused';if(out==='refused')notes.push('Barrage gagné, mais montée refusée : cahier des charges de '+LV[S.div+1].n+' non rempli.');}}
  if((S.div===5||S.div===6)&&pos===L.teams-L.rel){const oppR=LV[S.div-1].str[1]+rf(-2,2),pw=clamp(.5+(me-oppR)*.035,.12,.88),win=R()<pw;
    barrage={up:false,win,txt:'Barrage pour le maintien contre le 3e de '+LV[S.div-1].n+' : '+(win?'victoire, maintien assuré.':'défaite, relégation.')};if(!win)out='down';}
  // DNCG : contrôle des comptes dès le National 2 (fédérale) et en pro
  if(S.cash<0&&out!=='down'){
    if(S.div>=4){out='dncg';notes.push('La DNCG prononce une rétrogradation administrative pour déficit.');}
    else if(S.div>=2&&S.cash<-(S.sponsorAnnual+LV[S.div].sub)*.15){out='dncg';notes.push('La DNCG fédérale prononce une rétrogradation administrative : comptes trop déficitaires.');}
  }""")
rep("  return {pos,out,notes,objOk,dc,","  if(barrage)notes.unshift(barrage.txt);\n  return {barrage,pos,out,notes,objOk,dc,")
rep("  if(out==='up')dc+=10;if(out==='down'||out==='dncg')dc-=10;","  if(out==='up')dc+=10;if(out==='down'||out==='dncg')dc-=10;\n  if(barrage&&barrage.win&&!objOk)dc=Math.max(dc,4);")
# la note du barrage doit s'afficher en vert si gagné
rep("  ${e.notes.map(n=>'<div class=\"alert b\">'+esc(n)+'</div>').join('')}","  ${e.notes.map(n=>'<div class=\"alert '+(/victoire/.test(n)?'g':'b')+'\">'+esc(n)+'</div>').join('')}")

# ---------- DNCG en cours de saison (examen à la trêve)
rep("  if(S.week===Math.floor(S.N/2))S.teams.forEach(t=>{","""  if(S.week===Math.floor(S.N/2)&&S.div>=2){
    const pr=projection(),inc=S.sponsorAnnual+LV[S.div].sub+LV[S.div].tv;
    if(pr<-inc*.2){S.dncg={lvl:2,cap:wageBill()};UI.queue.push({type:'info',t:'DNCG : interdiction de recruter',d:'Après examen de vos comptes à la trêve, la DNCG vous interdit tout recrutement jusqu’à la fin de la saison (fin de saison prévue à '+money(pr)+'). Une trésorerie négative en fin de saison entraînera une rétrogradation administrative.'});news('La DNCG interdit au club de recruter.','b');}
    else if(pr<0){S.dncg={lvl:1,cap:wageBill()};UI.queue.push({type:'info',t:'DNCG : encadrement de la masse salariale',d:'La DNCG juge votre budget fragile (fin de saison prévue à '+money(pr)+'). Votre masse salariale est encadrée : impossible de l’augmenter d’ici la fin de la saison.'});news('La DNCG encadre la masse salariale du club.','b');}
    else if(S.dncg){S.dncg=null;}
  }
  if(S.week===Math.floor(S.N/2))S.teams.forEach(t=>{""")
rep("  if(!pre&&squadN()>=30){toast(","""  if(S.dncg&&!pre){if(S.dncg.lvl>=2){toast('Interdiction de recruter prononcée par la DNCG.');return false;}if(wageBill()+o.wage>S.dncg.cap){toast('Masse salariale encadrée par la DNCG : libérez ou vendez un joueur d’abord (plafond '+money(S.dncg.cap)+'/mois).');return false;}}
  if(!pre&&squadN()>=30){toast(""")
rep("  S.talks={};S.offers=[];S.scouting={};","  S.talks={};S.offers=[];S.scouting={};S.dncg=null;")
# alerte DNCG
rep("  if(!S.staff.coach)a.push(['b',","  if(S.dncg)a.push(['b',S.dncg.lvl>=2?'DNCG : interdiction de recruter jusqu’à la fin de la saison.':'DNCG : masse salariale encadrée (plafond '+money(S.dncg.cap)+'/mois).']);\n  if(!S.staff.coach)a.push(['b',")
open(p,'w').write(s); print('ok')
