/* ====================== Petits événements (lot 3) ====================== */
const EV3={
 tombola:{w:1.2,cond:()=>S.div<=3,make:()=>({c:smallAmt(.02)}),k:'Vie du club',title:'La tombola de Noël',
  text:d=>`Les bénévoles proposent une grande tombola : un maillot dédicacé, un week-end à la mer et un jambon offert par le boucher du coin. Il faut avancer ${money(d.c)} pour les lots et l’impression des tickets.`,
  ch:[{t:'Banco, on lance la tombola',f:d=>{const g=Math.round(d.c*rf(1.4,2.6));fin('Événements',g-d.c);S.mood=clamp(S.mood+2,0,100);return 'Tous les tickets sont partis : bénéfice de '+money(g-d.c)+'.';}},{t:'Pas cette année',f:()=>'Les bénévoles sont un peu déçus.'}]},
 arbitre:{w:1,cond:()=>S.week>3&&S.div<=4,make:()=>({}),k:'Polémique',title:'Un arbitrage qui fait jaser',
  text:()=>`Après le dernier match, une vidéo d’un penalty refusé tourne en boucle sur les réseaux. Les supporters sont remontés et la presse locale attend votre réaction.`,
  ch:[{t:'Monter au créneau publiquement',f:()=>{S.mood=clamp(S.mood+4,0,100);S.rep=clamp(S.rep-1,0,100);if(R()<.35){const a=smallAmt(.015);fin('Amendes',-a);return 'Les supporters adorent, mais la commission de discipline vous inflige '+money(a)+' d’amende.';}return 'Les supporters apprécient votre franchise.';}},{t:'Rester sobre : « on regarde devant »',f:()=>{S.rep=clamp(S.rep+1,0,100);return 'Une réaction jugée digne par les instances.';}}]},
 ecole:{w:1.1,make:()=>({}),k:'Territoire',title:'Une école demande des joueurs',
  text:()=>`Le directeur d’une école${S.terr?' de '+S.terr.n:''} aimerait que deux ou trois joueurs viennent animer une matinée de sport avec les enfants.`,
  ch:[{t:'Envoyer des joueurs (une matinée d’entraînement en moins)',f:()=>{S.fans=Math.round(S.fans*1.015);S.rep=clamp(S.rep+1,0,100);S.players.forEach(p=>{if(!p.loan)p.fit=clamp(p.fit-2,20,100);});return 'Les enfants repartent avec des autographes. Quelques nouvelles familles au stade.';}},{t:'Décliner poliment',f:()=>'Le directeur comprend.'}]},
 doublure:{w:1,cond:()=>S.week>4,make:()=>{const p=pick(S.players.filter(p=>!p.loan&&p.age<=23&&p.s&&p.s.mj<=2));return p?{pid:p.id}:null;},k:'Vestiaire',title:'Un jeune frappe à la porte',
  text:d=>`${pname(getP(d.pid))} s’entraîne comme un fou mais n’a presque pas joué. Il vient vous voir : il veut sa chance, sinon il demandera à partir.`,
  ch:[{t:'Demander à l’entraîneur de le lancer',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale+18,0,100);p.ovr=clamp(p.ovr+(R()<.5?1:0),25,92);return pname(p)+' est gonflé à bloc.';}},{t:'Lui demander de patienter',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale-10,0,100);return pname(p)+' fait la tête.';}}]},
 pelouse:{w:1,cond:()=>S.div<=3&&S.week>2,make:()=>({c:smallAmt(.04)}),k:'Installations',title:'La pelouse est un champ de patates',
  text:d=>`Après des semaines de pluie, la pelouse est dans un état lamentable. Le jardinier propose un regarnissage d’urgence pour ${money(d.c)}.`,
  ch:[{t:'Payer le regarnissage',f:d=>{fin('Entretien',-d.c);return 'La pelouse retrouve des couleurs.';}},{t:'On fera avec',f:()=>{S.players.forEach(p=>{if(!p.loan&&R()<.06)p.inj=Math.max(p.inj,ri(1,2));});return 'Quelques chevilles tordues à l’entraînement.';}}]},
 recordAffluence:{w:.8,cond:()=>S.week>5&&S.mood>65,make:()=>({}),k:'Supporters',title:'Les supporters veulent un déplacement en bus',
  text:()=>`Les supporters organisent un grand déplacement pour le prochain match à l’extérieur et demandent au club de payer un des cars.`,
  ch:[{t:'Payer un car',f:()=>{const c=smallAmt(.01);fin('Événements',-c);S.mood=clamp(S.mood+5,0,100);S.players.forEach(p=>{if(!p.loan)p.morale=clamp(p.morale+2,0,100);});return 'Un parcage plein à craquer : les joueurs ont adoré.';}},{t:'Refuser',f:()=>{S.mood=clamp(S.mood-3,0,100);return 'Les supporters y vont quand même, un peu vexés.';}}]},
 agentMalin:{w:.9,cond:()=>S.week>3,make:()=>{const p=pick(topPlayers(5,p=>!p.loan&&p.contract>=2));return p?{pid:p.id}:null;},k:'Mercato',title:'Un agent fait monter les enchères',
  text:d=>`L’agent de ${pname(getP(d.pid))} laisse entendre dans la presse que « plusieurs clubs sont intéressés ». Il réclame une revalorisation de 15 %.`,
  ch:[{t:'Revaloriser son salaire',f:d=>{const p=getP(d.pid);p.wage=Math.round(p.wage*1.15/10)*10;p.morale=clamp(p.morale+10,0,100);return pname(p)+' est rassuré.';}},{t:'Ne pas céder au chantage',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale-12,0,100);return 'L’agent claque la porte. '+pname(p)+' est moins motivé.';}}]}
};
Object.assign(EVENTS,EV3);
