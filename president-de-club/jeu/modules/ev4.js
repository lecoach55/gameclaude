/* ====================== Petits événements (lot 4) ====================== */
const EV4={
 vol:{w:1,cond:()=>S.div<=3,make:()=>({c:smallAmt(.03)}),k:'Insolite',title:'Cambriolage au local du club',
  text:d=>`Des ballons, des maillots et la caisse de la buvette ont disparu pendant la nuit. Remplacer le tout coûte ${money(d.c)}.`,
  ch:[{t:'Tout racheter et installer une alarme',f:d=>{fin('Événements',-Math.round(d.c*1.4/50)*50);return 'Le local est désormais sous alarme.';}},{t:'Lancer une cagnotte auprès des supporters',f:d=>{const g=Math.round(d.c*rf(.6,1.3)/50)*50;fin('Événements',g-d.c);S.mood=clamp(S.mood+3,0,100);return 'Les supporters donnent '+money(g)+'. Belle solidarité.';}}]},
 concert:{w:.9,cond:()=>S.infra.stade>=3&&S.week>2,make:()=>({g:smallAmt(.06)}),k:'Économie',title:'Un concert dans votre stade ?',
  text:d=>`Un tourneur veut louer le stade pour un concert en juin : ${money(d.g)} de location. La pelouse risque d’en souffrir.`,
  ch:[{t:'Accepter',f:d=>{fin('Événements',d.g);if(R()<.4){S.players.forEach(p=>{if(!p.loan&&R()<.05)p.inj=Math.max(p.inj,1);});return 'Belle soirée, mais la pelouse est abîmée pour la reprise.';}return 'Concert réussi, pelouse intacte.';}},{t:'Refuser',f:()=>'Le stade reste réservé au football.'}]},
 reportage:{w:.9,cond:()=>S.week>4&&myPos()<=3,make:()=>({}),k:'Médias',title:'Une chaîne nationale veut un reportage',
  text:()=>`Votre bon début de saison intrigue : une émission nationale veut suivre le club pendant une semaine, vestiaire compris.`,
  ch:[{t:'Ouvrir les portes',f:()=>{S.fans=Math.round(S.fans*1.03);S.rep=clamp(S.rep+2,0,100);if(R()<.3){S.players.forEach(p=>{if(!p.loan)p.morale=clamp(p.morale-3,0,100);});return 'Belle exposition, mais certains joueurs ont mal vécu les caméras.';}return 'Le reportage fait un carton : le club gagne des supporters dans toute la région.';}},{t:'Préserver le vestiaire',f:()=>{S.players.forEach(p=>{if(!p.loan)p.morale=clamp(p.morale+2,0,100);});return 'Le groupe apprécie la discrétion.';}}]},
 diplome:{w:.9,make:()=>{const p=pick(S.players.filter(p=>!p.loan&&p.age>=30));return p?{pid:p.id}:null;},k:'Vestiaire',title:'Un cadre passe ses diplômes d’entraîneur',
  text:d=>`${pname(getP(d.pid))} prépare son diplôme d’entraîneur et demande au club de financer la formation (${money(smallAmt(.01))}).`,
  ch:[{t:'Financer : il encadrera les jeunes',f:d=>{const p=getP(d.pid);fin('Événements',-smallAmt(.01));p.morale=clamp(p.morale+10,0,100);S.players.filter(x=>x.age<=21&&!x.loan).forEach(x=>{if(x.pot>x.ovr&&R()<.5)x.ovr=Math.min(x.pot,x.ovr+1);});return pname(p)+' transmet son expérience : les jeunes progressent.';}},{t:'Refuser',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale-6,0,100);return pname(p)+' est déçu.';}}]},
 veterans:{w:1,cond:()=>S.div<=4,make:()=>({}),k:'Vie du club',title:'Le match des anciens',
  text:()=>`Les vétérans du club proposent un match de gala contre les anciens du club rival, à la mi-temps duquel serait organisée une collecte pour l’école de foot.`,
  ch:[{t:'Organiser le gala',f:()=>{const g=smallAmt(.02);fin('Événements',g);S.mood=clamp(S.mood+4,0,100);return 'Ambiance bon enfant et '+money(g)+' récoltés pour les jeunes.';}},{t:'Pas le temps cette saison',f:()=>'Les vétérans rangent leurs crampons.'}]},
 billetterie:{w:.8,cond:()=>S.div>=2&&S.week>1,make:()=>({}),k:'Logistique',title:'La billetterie en ligne plante',
  text:()=>`Le site de billetterie est tombé la veille du match. Les supporters râlent sur les réseaux.`,
  ch:[{t:'Ouvrir des guichets supplémentaires (bénévoles et vigiles)',f:()=>{fin('Événements',-smallAmt(.008));return 'Tout le monde est entré à temps.';}},{t:'Faire avec',f:()=>{S.mood=clamp(S.mood-3,0,100);return 'Longues files d’attente, coup d’envoi devant des tribunes à moitié vides.';}}]}
};
Object.assign(EVENTS,EV4);
