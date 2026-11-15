'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — données du jeu (sans DOM, testable sous Node)
   ========================================================= */
// ---------- hasard reproductible ----------
function creeRng(seed){const o={s:seed>>>0};
 o.f=()=>{let t=(o.s=(o.s+0x6D2B79F5)>>>0);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
 o.i=(a,b)=>a+Math.floor(o.f()*(b-a+1));o.pick=a=>a[Math.floor(o.f()*a.length)];
 o.melange=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(o.f()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 o.pond=t=>{let s=0;for(const k in t)s+=t[k];let r=o.f()*s;for(const k in t){r-=t[k];if(r<=0)return k;}return Object.keys(t)[0];};
 return o;}

// ---------- ressources ----------
var RES=['or','bois','minerai','mercure','soufre','cristal','gemmes'];
var RES_NOM={or:'Or',bois:'Bois',minerai:'Minerai',mercure:'Mercure',soufre:'Soufre',cristal:'Cristal',gemmes:'Gemmes'};
var RES_VAL={or:1,bois:60,minerai:60,mercure:200,soufre:200,cristal:200,gemmes:200}; // valeur en or (IA, marché)
var MINE_PROD={or:1000,bois:2,minerai:2,mercure:1,soufre:1,cristal:1,gemmes:1};
var MINE_NOM={or:'Mine d’or',bois:'Scierie',minerai:'Mine de minerai',mercure:'Laboratoire alchimique',soufre:'Grotte de soufre',cristal:'Caverne de cristal',gemmes:'Bassin de gemmes'};

// ---------- terrains ----------
var TER=['herbe','terre','rude','neige','sable','marais','lave','eau'];
var TER_NOM={herbe:'Prairie',terre:'Terre battue',rude:'Lande rocailleuse',neige:'Toundra enneigée',sable:'Désert',marais:'Marais',lave:'Terres de lave',eau:'Eau'};
var TER_COUT={herbe:100,terre:100,rude:125,neige:150,sable:150,marais:175,lave:100,eau:9999};
var EAU=7;

// ---------- créatures ----------
// d : dessin {t:type, ...couleurs}. sp : capacités spéciales.
var CRE={
 // Bastion
 piquier:{nom:'Piquier',pl:'Piquiers',fac:'bastion',niv:1,pv:10,att:4,def:5,dmin:1,dmax:3,vit:4,cr:14,cout:{or:60},d:{t:'hum',arme:'pique',tun:'#2f5fa8',arm:'#9aa8b8',casque:1}},
 archer:{nom:'Archer',pl:'Archers',fac:'bastion',niv:2,pv:10,att:6,def:3,dmin:2,dmax:3,vit:4,tirs:12,cr:9,cout:{or:100},d:{t:'hum',arme:'arc',tun:'#3c7a3c',capuche:'#2c5a2c'}},
 griffon:{nom:'Griffon',pl:'Griffons',fac:'bastion',niv:3,pv:25,att:8,def:8,dmin:3,dmax:6,vit:6,vol:1,sp:['riposte2'],cr:7,cout:{or:200},d:{t:'griffon',corps:'#c99a4e',tete:'#efe6d2',aile:'#a8763a'}},
 croise:{nom:'Croisé',pl:'Croisés',fac:'bastion',niv:4,pv:35,att:10,def:12,dmin:6,dmax:9,vit:5,cr:4,cout:{or:300},d:{t:'hum',arme:'epee',tun:'#f1ece0',arm:'#c9d1d8',casque:2,bouclier:'#f1ece0',croix:'#b5262a'}},
 moine:{nom:'Moine',pl:'Moines',fac:'bastion',niv:5,pv:30,att:12,def:7,dmin:10,dmax:12,vit:5,tirs:12,cr:3,cout:{or:400},d:{t:'hum',arme:'baton',robe:'#bfa77a',capuche:'#a58f62',orbe:'#ffe79a'}},
 cavalier:{nom:'Cavalier',pl:'Cavaliers',fac:'bastion',niv:6,pv:100,att:15,def:15,dmin:15,dmax:25,vit:7,sp:['charge'],cr:2,cout:{or:1000},d:{t:'cavalier',cheval:'#ece4d2',arm:'#c3ccd6',tun:'#2f5fa8',arme:'lance'}},
 ange:{nom:'Ange',pl:'Anges',fac:'bastion',niv:7,pv:200,att:20,def:20,dmin:50,dmax:50,vit:12,vol:1,sp:['moral'],cr:1,cout:{or:3000,gemmes:1},d:{t:'ange',robe:'#f4efe2',aile:'#ffffff',cheveux:'#f0c95a',arme:'epee'}},
 // Sylve
 centaure:{nom:'Centaure',pl:'Centaures',fac:'sylve',niv:1,pv:8,att:5,def:3,dmin:2,dmax:3,vit:6,cr:14,cout:{or:70},d:{t:'centaure',corps:'#9b6a3c',peau:'#d9a77a',arme:'lance',tun:'#4c7a32'}},
 nain:{nom:'Nain',pl:'Nains',fac:'sylve',niv:2,pv:20,att:6,def:7,dmin:2,dmax:4,vit:3,sp:['resmagie'],cr:8,cout:{or:120},d:{t:'hum',petit:1,arme:'hache',tun:'#8a3b2a',arm:'#9aa0a6',barbe:'#c76b2a',casque:1}},
 elfe:{nom:'Archer elfe',pl:'Archers elfes',fac:'sylve',niv:3,pv:15,att:9,def:5,dmin:3,dmax:5,vit:6,tirs:24,sp:['doubletir'],cr:7,cout:{or:225},d:{t:'hum',mince:1,arme:'arc',tun:'#2f8a4c',cheveux:'#f2dc8a',oreilles:1}},
 pegase:{nom:'Pégase',pl:'Pégases',fac:'sylve',niv:4,pv:30,att:9,def:8,dmin:5,dmax:9,vit:8,vol:1,cr:5,cout:{or:250},d:{t:'cheval',corps:'#e9eef7',crin:'#b9c8e6',aile:'#ffffff'}},
 treant:{nom:'Tréant',pl:'Tréants',fac:'sylve',niv:5,pv:55,att:9,def:12,dmin:10,dmax:14,vit:3,sp:['entrave'],cr:3,cout:{or:350},d:{t:'treant',ecorce:'#6b4a2b',feuille:'#4f8a2e'}},
 licorne:{nom:'Licorne',pl:'Licornes',fac:'sylve',niv:6,pv:90,att:15,def:14,dmin:18,dmax:22,vit:7,sp:['resmagie'],cr:2,cout:{or:850},d:{t:'cheval',corps:'#ffffff',crin:'#f0b7d8',corne:'#f3d36a'}},
 dragonvert:{nom:'Dragon vert',pl:'Dragons verts',fac:'sylve',niv:7,pv:180,att:18,def:18,dmin:40,dmax:50,vit:10,vol:1,sp:['souffle'],cr:1,cout:{or:2400,cristal:1},d:{t:'dragon',corps:'#3f8f3a',ventre:'#d8d27a',aile:'#2f6e2c'}},
 // Nécropole
 squelette:{nom:'Squelette',pl:'Squelettes',fac:'necro',niv:1,pv:6,att:5,def:4,dmin:1,dmax:3,vit:4,sp:['mort'],cr:12,cout:{or:60},d:{t:'squel',arme:'epee',os:'#e8e2cc',bouclier:'#6d5a3a'}},
 zombie:{nom:'Zombie',pl:'Zombies',fac:'necro',niv:2,pv:20,att:5,def:5,dmin:2,dmax:3,vit:3,sp:['mort'],cr:8,cout:{or:100},d:{t:'hum',peau:'#8fa47a',tun:'#5a4d3b',zombi:1}},
 spectre:{nom:'Spectre',pl:'Spectres',fac:'necro',niv:3,pv:18,att:7,def:7,dmin:3,dmax:5,vit:5,vol:1,sp:['mort'],cr:7,cout:{or:200},d:{t:'spectre',robe:'#9fb3c9',yeux:'#9ff7ff'}},
 vampire:{nom:'Vampire',pl:'Vampires',fac:'necro',niv:4,pv:30,att:10,def:9,dmin:5,dmax:8,vit:6,vol:1,sp:['mort','sansriposte','drain'],cr:4,cout:{or:360},d:{t:'hum',mince:1,peau:'#e6dfe8',tun:'#24162a',cape:'#8a1022',cheveux:'#141018'}},
 liche:{nom:'Liche',pl:'Liches',fac:'necro',niv:5,pv:30,att:13,def:10,dmin:11,dmax:13,vit:6,tirs:12,sp:['mort'],cr:3,cout:{or:550},d:{t:'hum',arme:'baton',robe:'#3a2f52',capuche:'#2a2140',peau:'#d9d3bf',crane:1,orbe:'#7cf7a2'}},
 chevnoir:{nom:'Chevalier noir',pl:'Chevaliers noirs',fac:'necro',niv:6,pv:120,att:16,def:16,dmin:15,dmax:30,vit:7,sp:['mort','malefice'],cr:2,cout:{or:1200},d:{t:'cavalier',cheval:'#22212a',arm:'#3a3d48',tun:'#5a1020',arme:'epee',yeux:'#ff4a3a'}},
 dragonos:{nom:'Dragon d’os',pl:'Dragons d’os',fac:'necro',niv:7,pv:150,att:17,def:15,dmin:25,dmax:50,vit:9,vol:1,sp:['mort','peur'],cr:1,cout:{or:1800},d:{t:'dragon',corps:'#e6e0c8',ventre:'#bdb59a',aile:'#6a6458',os:1}},
 // Neutres
 gobelin:{nom:'Gobelin',pl:'Gobelins',fac:'neutre',niv:1,pv:5,att:4,def:2,dmin:1,dmax:2,vit:5,cr:15,cout:{or:40},d:{t:'hum',petit:1,peau:'#7fae3c',tun:'#6b4a2b',arme:'massue',oreilles:1}},
 loup:{nom:'Loup',pl:'Loups',fac:'neutre',niv:2,pv:15,att:7,def:5,dmin:2,dmax:5,vit:8,cr:9,cout:{or:110},d:{t:'loup',corps:'#7d7f86',ventre:'#c9c9c9'}},
 orque:{nom:'Orque',pl:'Orques',fac:'neutre',niv:3,pv:15,att:8,def:4,dmin:2,dmax:5,vit:4,tirs:12,cr:7,cout:{or:150},d:{t:'hum',peau:'#5f8a46',tun:'#7a3a22',arme:'hachejet',arm:'#6c6c6c'}},
 troll:{nom:'Troll',pl:'Trolls',fac:'neutre',niv:5,pv:40,att:14,def:7,dmin:10,dmax:15,vit:7,sp:['regen'],cr:3,cout:{or:500},d:{t:'hum',gros:1,peau:'#6f8f8a',tun:'#5a4632',arme:'massue'}},
 wyverne:{nom:'Wyverne',pl:'Wyvernes',fac:'neutre',niv:6,pv:70,att:14,def:14,dmin:14,dmax:18,vit:7,vol:1,sp:['poison'],cr:2,cout:{or:800},d:{t:'dragon',corps:'#8a6a2f',ventre:'#d8b46a',aile:'#6a4a20',petit:1}},
};
for(const k in CRE){const c=CRE[k];c.id=k;c.sp=c.sp||[];c.val=c.cout.or+500*Object.keys(c.cout).filter(r=>r!=='or').reduce((s,r)=>s+c.cout[r],0);if(c.tirs)c.val=Math.round(c.val*1.1);}
var CRE_NEUTRES=['gobelin','loup','orque','troll','wyverne'];
var CAP_NOM={riposte2:'Riposte deux fois',charge:'Charge (+5 % dégâts par case parcourue)',moral:'+1 moral à l’armée',resmagie:'Résiste à 40 % des sorts',doubletir:'Tire deux fois',entrave:'Entrave la cible (vitesse −2)',souffle:'Souffle : frappe aussi la case derrière',mort:'Mort-vivant (moral neutre)',sansriposte:'Attaque sans riposte',drain:'Draine la vie (ressuscite les siens)',malefice:'25 % de chance de dégâts doublés',peur:'−1 moral à l’ennemi',regen:'Se régénère à chaque tour',poison:'Empoisonne (−10 % PV max)'};

// ---------- factions ----------
var FAC={
 bastion:{nom:'Bastion',ville:'Bastion',adj:'du Bastion',ter:'herbe',rare:'gemmes',crea:['piquier','archer','griffon','croise','moine','cavalier','ange'],
  coul:{mur:'#d8d2c2',toit:'#3d64b0',drap:'#2f5fa8'},classes:['chevalier','clerc'],desc:'Chevaliers, archers et anges : une armée solide et disciplinée.',
  hab:['Caserne des piquiers','Tour des archers','Nid de griffons','Salle d’armes','Monastère','Lices','Portail de lumière']},
 sylve:{nom:'Sylve',ville:'Sylve',adj:'de la Sylve',ter:'herbe',rare:'cristal',crea:['centaure','nain','elfe','pegase','treant','licorne','dragonvert'],
  coul:{mur:'#c9b38a',toit:'#3f7a34',drap:'#2f8a4c'},classes:['rodeur','druide'],desc:'Archers elfes, licornes et dragons verts : rapides et redoutables à distance.',
  hab:['Clairière des centaures','Chaumière naine','Cercle des archers','Prairie des pégases','Bosquet des tréants','Glade des licornes','Falaise des dragons']},
 necro:{nom:'Nécropole',ville:'Nécropole',adj:'de la Nécropole',ter:'terre',rare:'soufre',crea:['squelette','zombie','spectre','vampire','liche','chevnoir','dragonos'],
  coul:{mur:'#7c7686',toit:'#3a2a4a',drap:'#5a1a6a'},classes:['chevmort','necromancien'],desc:'Morts-vivants innombrables : la nécromancie relève les ennemis tombés.',
  hab:['Cimetière','Tombeau des zombies','Tour hantée','Manoir vampire','Mausolée','Écuries maudites','Ossuaire des dragons']},
};
var FACS=['bastion','sylve','necro'];

// ---------- bâtiments de ville ----------
// cout : ressources ; req : bâtiments requis. 'rare' = ressource rare de la faction.
var BAT={
 conseil:{nom:'Conseil du village',cout:{},desc:'+500 or par jour.',or:500},
 mairie:{nom:'Mairie',cout:{or:2500},req:['taverne'],desc:'+1000 or par jour.',or:1000,remplace:'conseil'},
 hotelville:{nom:'Hôtel de ville',cout:{or:5000},req:['mairie','marche','guilde1'],desc:'+2000 or par jour.',or:2000,remplace:'mairie'},
 capitole:{nom:'Capitole',cout:{or:10000,bois:10,minerai:10},req:['hotelville','chateau'],desc:'+4000 or par jour. Un seul par royaume.',or:4000,remplace:'hotelville',unique:1},
 fort:{nom:'Fort',cout:{or:3000,bois:10,minerai:10},desc:'Remparts : +2 défense aux défenseurs. Requis pour les habitations.',defense:2},
 citadelle:{nom:'Citadelle',cout:{or:2500,minerai:5},req:['fort'],desc:'Croissance des créatures +50 %, +4 défense, une tour de garde.',defense:4,remplace:'fort'},
 chateau:{nom:'Château',cout:{or:5000,bois:10,minerai:10},req:['citadelle'],desc:'Croissance des créatures +100 %, +6 défense, deux tours.',defense:6,remplace:'citadelle'},
 taverne:{nom:'Taverne',cout:{or:500,bois:5},desc:'Recrutez de nouveaux héros (2500 or).'},
 marche:{nom:'Marché',cout:{or:500,bois:5},desc:'Échangez vos ressources.'},
 silo:{nom:'Grenier aux ressources',cout:{or:5000,minerai:5},req:['marche'],desc:'+1 de la ressource rare de la faction et +1 minerai par jour.'},
 guilde1:{nom:'Guilde des mages I',cout:{or:2000,bois:5,minerai:5},desc:'Enseigne 3 sorts du 1er cercle. Recharge le mana des héros.'},
 guilde2:{nom:'Guilde des mages II',cout:{or:1000,bois:5,minerai:5,mercure:4,soufre:4,cristal:4,gemmes:4},req:['guilde1'],desc:'Enseigne 2 sorts du 2e cercle.'},
 guilde3:{nom:'Guilde des mages III',cout:{or:1000,bois:5,minerai:5,mercure:6,soufre:6,cristal:6,gemmes:6},req:['guilde2'],desc:'Enseigne 2 sorts du 3e cercle (Sagesse requise).'},
 graal:{nom:'Merveille du Graal',cout:{},desc:'+5000 or par jour et croissance des créatures +50 %. Se bâtit avec le Saint Graal.',special:1},
 hab1:{cout:{or:300,bois:5},req:['fort'],niv:1},
 hab2:{cout:{or:800,bois:5,minerai:5},req:['hab1'],niv:2},
 hab3:{cout:{or:1000,minerai:5},req:['hab1'],niv:3},
 hab4:{cout:{or:2000,bois:5,minerai:5,rare:5},req:['hab2'],niv:4},
 hab5:{cout:{or:3000,bois:5,minerai:5,rare:5},req:['hab3','guilde1'],niv:5},
 hab6:{cout:{or:4000,bois:10,minerai:10,rare:10},req:['hab4'],niv:6},
 hab7:{cout:{or:8000,minerai:10,rare:15},req:['hab5','hab6','citadelle'],niv:7},
};
var BAT_ORDRE=['conseil','mairie','hotelville','capitole','fort','citadelle','chateau','taverne','marche','silo','guilde1','guilde2','guilde3','hab1','hab2','hab3','hab4','hab5','hab6','hab7'];
var GRAAL_NOM={bastion:'Colosse de lumière',sylve:'Arbre-monde',necro:'Sceau des ténèbres'};
function batNom(b,fac){if(b==='graal')return GRAAL_NOM[fac];return BAT[b].niv?FAC[fac].hab[BAT[b].niv-1]:BAT[b].nom;}
function batCout(b,fac){const c={};for(const r in BAT[b].cout){const k=r==='rare'?FAC[fac].rare:r;c[k]=(c[k]||0)+BAT[b].cout[r];}return c;}

// ---------- sorts ----------
var SORTS={
 fleche:{nom:'Flèche magique',niv:1,mana:5,cible:'ennemi',type:'degats',base:10,par:10,desc:'Dégâts : 10 + 10 × Puissance.'},
 soin:{nom:'Soin',niv:1,mana:5,cible:'allie',type:'soin',base:10,par:5,desc:'Soigne 10 + 5 × Puissance PV et retire les maux.'},
 benediction:{nom:'Bénédiction',niv:1,mana:5,cible:'allie',type:'buff',effet:'beni',desc:'La troupe inflige toujours ses dégâts maximum.'},
 hate:{nom:'Hâte',niv:1,mana:6,cible:'allie',type:'buff',effet:'hate',desc:'+3 vitesse.'},
 bouclier:{nom:'Bouclier',niv:1,mana:5,cible:'allie',type:'buff',effet:'bouclier',desc:'−20 % de dégâts reçus au corps à corps.'},
 lenteur:{nom:'Lenteur',niv:1,mana:6,cible:'ennemi',type:'debuff',effet:'lent',desc:'Vitesse réduite de moitié.'},
 eclair:{nom:'Éclair',niv:2,mana:10,cible:'ennemi',type:'degats',base:10,par:25,desc:'Dégâts : 10 + 25 × Puissance.'},
 malediction:{nom:'Malédiction',niv:2,mana:6,cible:'ennemi',type:'debuff',effet:'maudit',desc:'La troupe inflige ses dégâts minimum −20 %.'},
 pierre:{nom:'Peau de pierre',niv:2,mana:5,cible:'allie',type:'buff',effet:'pierre',desc:'+4 défense.'},
 fureur:{nom:'Fureur',niv:2,mana:8,cible:'allie',type:'buff',effet:'fureur',desc:'+4 attaque.'},
 boulefeu:{nom:'Boule de feu',niv:3,mana:15,cible:'zone',type:'degats',base:15,par:10,desc:'Dégâts sur la case et ses 6 voisines : 15 + 10 × Puissance.'},
 priere:{nom:'Prière',niv:3,mana:16,cible:'allie',type:'buff',effet:'priere',desc:'+2 attaque, défense et vitesse.'},
 vision:{nom:'Vision lointaine',niv:1,mana:4,cible:'aventure',type:'aventure',desc:'Sur la carte : dévoile les terres dans un grand rayon autour du héros.'},
 portail:{nom:'Portail de ville',niv:3,mana:16,cible:'aventure',type:'aventure',desc:'Sur la carte : ramène le héros dans votre ville la plus proche (coûte 300 points de mouvement).'},
 chaine:{nom:'Chaîne d’éclairs',niv:3,mana:24,cible:'ennemi',type:'chaine',base:25,par:40,desc:'25 + 40 × Puissance, puis frappe 3 autres troupes (moitié à chaque saut).'},
};
var SORTS_NIV=[[],['fleche','soin','benediction','hate','bouclier','lenteur'],['eclair','malediction','pierre','fureur'],['boulefeu','priere','chaine']];

// ---------- compétences ----------
var COMP={
 logistique:{nom:'Logistique',desc:['+10 % de mouvement','+20 % de mouvement','+30 % de mouvement']},
 offense:{nom:'Attaque',desc:['+10 % de dégâts au corps à corps','+20 %','+30 %']},
 armure:{nom:'Armure',desc:['−5 % de dégâts reçus','−10 %','−15 %']},
 archerie:{nom:'Archerie',desc:['+10 % de dégâts à distance','+25 %','+50 %']},
 meneur:{nom:'Commandement',desc:['+1 moral','+2 moral','+3 moral']},
 chance:{nom:'Chance',desc:['+1 chance','+2 chance','+3 chance']},
 sagesse:{nom:'Sagesse',desc:['Apprend les sorts du 3e cercle','+ mana +10 %','+ mana +20 %']},
 sorcellerie:{nom:'Sorcellerie',desc:['+10 % de dégâts des sorts','+20 %','+30 %']},
 eclaireur:{nom:'Éclaireur',desc:['+1 de vision','+2','+3']},
 pistage:{nom:'Pistage',desc:['Pénalités de terrain −25 %','−50 %','−75 %']},
 intendance:{nom:'Intendance',desc:['+125 or par jour','+250 or par jour','+500 or par jour']},
 necromancie:{nom:'Nécromancie',desc:['Relève 10 % des ennemis tombés en squelettes','20 %','30 %']},
};
var NIV_NOM=['','Initié','Expert','Maître'];

// ---------- classes et héros ----------
var CLASSES={
 chevalier:{nom:'Chevalier',fac:'bastion',base:[2,2,1,1],prob:[35,45,10,10],comp:{meneur:1},sorts:[],ch:{offense:6,armure:6,meneur:8,logistique:5,archerie:5,chance:3,sagesse:2,eclaireur:3,pistage:3,intendance:4,sorcellerie:1}},
 clerc:{nom:'Clerc',fac:'bastion',base:[1,0,2,2],prob:[20,15,32,33],comp:{sagesse:1},sorts:['benediction'],ch:{sagesse:7,sorcellerie:5,meneur:5,chance:4,logistique:4,armure:3,offense:2,eclaireur:3,pistage:3,intendance:4,archerie:2}},
 rodeur:{nom:'Rôdeur',fac:'sylve',base:[1,3,1,1],prob:[35,45,10,10],comp:{archerie:1},sorts:[],ch:{archerie:8,pistage:6,logistique:6,offense:4,armure:5,chance:5,eclaireur:5,sagesse:2,meneur:3,intendance:2,sorcellerie:1}},
 druide:{nom:'Druide',fac:'sylve',base:[0,2,1,2],prob:[10,20,35,35],comp:{sagesse:1},sorts:['soin'],ch:{sagesse:7,sorcellerie:5,chance:6,pistage:4,eclaireur:4,logistique:3,archerie:3,armure:2,offense:2,meneur:2,intendance:3}},
 chevmort:{nom:'Chevalier de la mort',fac:'necro',base:[1,2,2,1],prob:[30,25,20,25],comp:{necromancie:1},sorts:[],ch:{offense:6,armure:6,necromancie:2,logistique:5,archerie:4,sagesse:3,eclaireur:3,pistage:3,intendance:3,sorcellerie:3}},
 necromancien:{nom:'Nécromancien',fac:'necro',base:[1,0,2,2],prob:[15,15,35,35],comp:{necromancie:1},sorts:['lenteur'],ch:{necromancie:2,sagesse:7,sorcellerie:6,logistique:3,armure:3,eclaireur:4,pistage:3,intendance:3,offense:2,archerie:2}},
};
var HEROS_NOMS={
 chevalier:['Aldric','Gauvain','Roland','Mélisende'],clerc:['Bérénice','Isolde','Clothilde','Tristan'],
 rodeur:['Sylvara','Elanor','Faelan','Thalia'],druide:['Ysoria','Liriel','Maëlis','Elwyn'],
 chevmort:['Corbin','Lazare','Séverine','Ambroise'],necromancien:['Malachie','Ombeline','Morgane','Nérée'],
};
var XP_NIV=[0,0,1000,2000,3200,4600,6200,8000,10000,12200,14700,17500,20600,24320,28784,34140,40567,48279,57533,68637,81961,97949,117134,140156,167782,200933];
function xpPourNiveau(n){if(n<XP_NIV.length)return XP_NIV[n];let x=XP_NIV[XP_NIV.length-1];for(let i=XP_NIV.length;i<=n;i++)x=Math.round(x*1.2);return x;}

// ---------- artefacts ----------
var ARTS={
 hache:{nom:'Hache du centaure',b:{att:2},rang:1},
 bouclierNain:{nom:'Bouclier du nain',b:{def:2},rang:1},
 baguette:{nom:'Baguette de l’apprenti',b:{pou:2},rang:1},
 couronne:{nom:'Couronne de l’érudit',b:{con:2},rang:1},
 trefle:{nom:'Trèfle à quatre feuilles',b:{chance:1},rang:1},
 banniere:{nom:'Bannière du héraut',b:{moral:1},rang:1},
 longuevue:{nom:'Longue-vue de la sentinelle',b:{vision:2},rang:1},
 bottes:{nom:'Bottes de célérité',b:{mvt:400},rang:2},
 lame:{nom:'Lame de l’aube',b:{att:5},rang:2},
 armure:{nom:'Armure du roi-soleil',b:{def:5},rang:2},
 orbe:{nom:'Orbe des tempêtes',b:{pou:4},rang:2},
 grimoire:{nom:'Grimoire des anciens',b:{con:4},rang:2},
 amulette:{nom:'Amulette de vie',b:{moral:1,chance:1},rang:2},
 sceptre:{nom:'Sceptre du souverain',b:{att:3,def:3,pou:3,con:3},rang:3},
};
var ARTS_RANG=[[],[],[],[]];for(const k in ARTS)ARTS_RANG[ARTS[k].rang].push(k);
ARTS.graal={nom:'Saint Graal',b:{},rang:4,desc:'Rapportez-le dans une de vos villes pour y bâtir une merveille.'};

// ---------- objets de la carte ----------
var BATIMENTS_CARTE={
 moulin:{nom:'Moulin à vent',desc:'Chaque semaine, offre quelques ressources.'},
 puits:{nom:'Puits enchanté',desc:'Restaure le mana du héros (une fois par jour).'},
 autel:{nom:'Autel des anciens',desc:'+1 à une caractéristique (une fois par héros).'},
 pierre:{nom:'Pierre du savoir',desc:'+1000 expérience (une fois par héros).'},
 arbre:{nom:'Arbre de la connaissance',desc:'Gagnez un niveau (une fois par héros).'},
 tour:{nom:'Tour de guet',desc:'Dévoile les alentours.'},
 sanctuaire:{nom:'Sanctuaire',desc:'Enseigne un sort (une fois par héros).'},
 ecurie:{nom:'Écuries',desc:'+400 mouvement jusqu’à la fin de la semaine.'},
 feu:{nom:'Campement abandonné',desc:'Or et ressources, à ramasser une fois.'},
 habitation:{nom:'Habitation',desc:'Des créatures s’y installent chaque semaine.'},
 fontaine:{nom:'Fontaine de fortune',desc:'+1 moral et +1 chance pour le prochain combat.'},
 obelisque:{nom:'Obélisque',desc:'Révèle un fragment de la carte du Graal.'},
};
var STAT_NOM=['Attaque','Défense','Puissance','Connaissance'];

if(typeof module!=='undefined')module.exports={};
