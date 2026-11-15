'use strict';
/* =========================================================
   SEDES PETRI — données du monde
   ========================================================= */
const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'];
const MW = 1000, MH = 800;
function proj(lat, lon) { return [(lon + 12) * 17.5, (62 - lat) * 25]; }

/* ---------- Terres émergées (lat, lon) ---------- */
const LAND = [
[62,5.0,61.2,4.9,60.4,5.0,59.3,5.3,58.6,5.6,58.0,7.0,58.2,8.3,58.8,9.6,59.1,10.4,59.7,10.6,59.2,11.0,58.4,11.3,57.7,11.8,57.0,12.2,56.4,12.8,55.6,12.95,55.4,13.8,55.9,14.3,56.2,15.8,56.8,16.5,57.6,16.7,58.6,16.9,59.3,18.5,60.0,18.6,60.7,17.3,61.5,17.2,61.8,17.4,
61.9,21.3,61.4,21.5,60.6,21.3,60.2,22.5,60.0,24.5,60.4,26.5,60.5,28.5,60.1,29.8,59.9,30.3,59.75,29.0,59.4,28.0,59.5,26.5,59.4,24.7,59.1,23.4,58.5,23.6,58.2,24.4,57.6,24.3,57.0,24.1,57.2,23.2,57.7,22.6,57.2,21.4,56.5,21.0,55.7,21.1,55.2,21.0,54.9,20.3,54.6,19.8,54.4,18.8,54.8,18.4,54.6,16.8,54.3,16.0,54.1,14.5,54.4,13.3,54.1,12.1,54.0,11.2,54.2,10.9,54.4,10.2,55.0,9.9,55.5,9.7,56.1,10.2,56.5,10.6,57.1,10.4,57.7,10.6,57.2,9.5,57.1,8.6,56.6,8.1,55.6,8.1,55.0,8.6,54.5,8.7,54.0,8.9,53.6,8.4,53.5,7.2,53.4,6.5,53.0,5.0,52.4,4.6,51.9,4.1,51.4,3.5,51.1,2.6,50.95,1.85,50.5,1.6,50.0,1.4,49.7,0.2,49.4,0.1,49.3,-0.5,49.6,-1.3,49.7,-1.9,49.2,-1.6,48.6,-1.5,48.7,-2.6,48.8,-3.5,48.6,-4.6,48.3,-4.7,47.9,-4.3,47.7,-3.4,47.5,-2.9,47.2,-2.2,46.7,-1.9,46.2,-1.2,45.6,-1.2,44.6,-1.25,43.5,-1.5,43.4,-2.4,43.4,-3.8,43.6,-5.7,43.7,-7.0,43.75,-7.9,43.4,-8.4,42.9,-9.3,42.2,-8.85,41.1,-8.7,40.2,-8.9,39.4,-9.4,38.7,-9.45,38.4,-8.8,37.9,-8.8,37.0,-8.95,37.0,-7.9,37.2,-7.3,36.7,-6.4,36.0,-5.6,36.15,-5.35,36.7,-4.4,36.75,-3.0,36.7,-2.2,37.6,-0.9,38.3,-0.5,38.75,0.2,39.5,-0.3,40.2,0.3,40.7,0.85,41.1,1.2,41.4,2.2,41.8,3.1,42.35,3.25,42.7,3.05,43.3,3.5,43.5,4.1,43.35,4.9,43.3,5.4,43.1,6.0,43.4,6.9,43.7,7.4,43.9,8.1,44.4,8.9,44.3,9.4,44.05,9.9,43.5,10.3,42.9,10.55,42.4,11.2,42.05,11.8,41.7,12.3,41.3,13.0,41.2,13.6,40.8,14.25,40.6,14.4,40.3,14.95,40.0,15.6,39.4,16.0,38.8,16.2,38.2,15.65,37.95,15.95,38.0,16.4,38.4,16.6,38.9,17.1,39.4,17.0,39.9,16.5,40.4,17.2,40.0,18.0,39.8,18.4,40.15,18.5,40.6,17.95,41.1,16.9,41.4,16.2,41.9,16.2,41.9,15.2,42.5,14.2,43.6,13.5,44.1,12.6,44.8,12.3,45.4,12.3,45.7,13.1,45.6,13.8,45.1,13.6,44.8,13.9,45.3,14.4,44.7,14.9,44.1,15.2,43.5,16.4,43.0,17.4,42.6,18.1,42.1,19.0,41.3,19.45,40.5,19.35,39.9,20.0,39.4,20.3,39.0,20.75,38.4,21.2,38.2,21.7,37.6,21.3,36.8,21.7,36.4,22.5,36.9,22.9,36.45,23.2,37.0,23.1,37.6,22.8,37.4,23.4,37.9,23.7,37.65,24.05,38.2,24.1,38.7,23.4,39.0,22.9,39.4,23.0,40.0,22.6,40.6,22.9,40.3,23.4,40.0,23.8,40.4,23.9,40.9,24.4,40.85,25.9,40.6,26.1,40.05,26.2,40.4,26.75,40.65,27.3,40.95,27.9,41.0,28.95,41.25,29.05,41.6,28.3,42.1,27.9,42.5,27.5,43.2,27.95,43.8,28.6,44.6,28.8,45.2,29.7,45.8,30.1,46.5,30.75,46.6,31.6,46.1,32.0,46.0,33.0,45.7,32.6,45.3,32.6,45.2,33.4,44.5,33.5,44.4,34.2,44.8,35.1,45.0,35.6,45.4,36.5,45.1,36.8,44.9,37.3,44.7,37.8,43.6,39.7,43.0,41.0,42.15,41.65,41.6,41.6,41.0,40.5,41.0,39.7,41.0,37.9,41.3,36.3,42.0,35.1,41.9,34.0,41.7,32.4,41.45,31.8,41.15,30.0,41.15,29.1,40.95,29.1,40.75,29.9,40.45,29.1,40.4,28.0,40.35,27.2,40.0,26.4,39.5,26.1,39.3,26.7,38.8,26.9,38.4,26.3,38.4,27.1,37.95,27.3,37.0,27.3,36.75,28.2,36.6,29.1,36.2,29.6,36.3,30.5,36.9,30.7,36.6,31.7,36.1,32.6,36.15,33.6,36.7,34.4,36.8,34.9,36.6,35.6,36.85,36.1,36.6,36.2,36.0,35.9,35.5,35.8,34.9,35.9,34.4,35.8,33.9,35.5,33.2,35.2,32.8,35.0,32.1,34.75,31.5,34.4,31.2,33.8,31.25,32.3,31.5,31.5,31.25,30.0,30.9,29.4,31.0,28.4,31.35,27.2,31.6,25.2,32.1,24.0,32.6,23.1,32.9,22.3,32.7,21.3,32.4,20.5,31.6,19.9,30.9,20.0,30.35,19.3,30.5,18.6,31.0,17.5,31.25,16.5,31.8,15.3,32.4,15.1,32.85,13.2,33.1,11.8,33.6,11.1,33.9,10.3,34.5,10.6,35.2,11.1,35.8,10.6,36.4,10.6,37.05,11.05,36.8,10.3,37.3,9.85,36.9,8.6,36.9,7.8,37.0,6.5,36.75,5.0,36.8,3.1,36.5,1.8,36.05,0.3,35.7,-0.6,35.3,-1.8,35.15,-2.9,35.2,-4.0,35.9,-5.3,35.8,-5.95,35.0,-6.2,34.0,-6.8,33.6,-7.6,32.9,-8.7,32.3,-9.25,31.5,-9.8,30.9,-9.85,30.4,-9.6,29.8,-9.7,29.8,45.8,62.3,45.8,62.3,5.0],
// Grande-Bretagne
[50.05,-5.7,50.35,-4.1,50.6,-3.4,50.55,-2.45,50.75,-1.6,50.8,-0.8,50.8,0.2,51.1,1.35,51.4,1.4,51.5,0.7,51.75,0.9,51.95,1.3,52.5,1.75,52.95,1.3,52.95,0.5,52.8,0.2,53.2,0.35,53.6,0.1,54.1,-0.2,54.5,-0.6,55.0,-1.4,55.8,-2.0,56.0,-2.6,56.0,-3.2,56.2,-2.8,56.45,-2.8,56.7,-2.4,57.15,-2.05,57.7,-1.8,57.65,-3.0,57.55,-4.2,57.85,-3.8,58.45,-3.1,58.65,-3.4,58.55,-4.6,58.6,-5.0,58.2,-5.3,57.9,-5.4,57.5,-5.8,57.0,-5.85,56.6,-6.2,56.4,-5.5,55.9,-5.6,55.3,-5.8,55.5,-4.65,55.0,-5.1,54.65,-4.9,54.85,-4.4,54.9,-3.4,54.4,-3.5,54.05,-2.9,53.4,-3.05,53.3,-4.6,52.8,-4.75,52.4,-4.1,51.9,-5.3,51.65,-5.0,51.6,-3.95,51.45,-3.2,51.5,-2.7,51.2,-3.4,51.2,-4.2,51.0,-4.5,50.4,-5.1],
// Irlande
[55.4,-7.4,55.2,-6.1,54.6,-5.6,54.3,-5.55,54.0,-6.3,53.35,-6.15,53.0,-6.0,52.2,-6.35,52.15,-7.0,51.8,-8.3,51.45,-9.8,51.8,-10.3,52.1,-10.4,52.6,-9.6,53.15,-9.2,53.4,-10.1,54.0,-10.1,54.25,-9.3,54.3,-8.6,54.6,-8.6,55.15,-8.3],
// Seeland, Fionie
[56.1,12.5,55.6,12.6,55.2,12.2,55.0,11.8,55.2,11.2,55.7,10.95,56.0,11.6],
[55.6,10.3,55.1,10.8,55.05,10.1,55.5,9.8],
// Corse, Sardaigne, Sicile
[43.0,9.45,42.4,9.55,41.4,9.25,41.6,8.8,42.1,8.6,42.6,8.75],
[41.25,9.35,40.9,9.75,40.1,9.7,39.2,9.6,38.9,8.65,39.1,8.4,40.0,8.45,40.6,8.15,40.95,8.25],
[38.25,15.6,37.5,15.1,36.7,15.1,37.05,14.25,37.5,13.2,37.8,12.45,38.1,12.55,38.15,13.35,38.03,14.1,38.25,15.2],
// Crète, Chypre, Majorque, Gotland, Rhodes
[35.6,23.6,35.3,24.3,35.4,25.4,35.3,26.3,35.0,26.2,34.95,24.8,35.2,23.55],
[35.7,34.6,35.15,33.95,34.95,33.6,34.6,33.0,34.75,32.4,35.1,32.3,35.35,33.3,35.4,34.0],
[39.95,3.15,39.6,3.45,39.3,3.0,39.6,2.35],
[57.9,18.9,57.6,18.9,57.2,18.4,57.4,18.1,57.8,18.6],
[36.45,28.2,36.1,27.95,36.2,27.7]
];

/* ---------- Royaumes ---------- */
const REALMS = {
 etats:{n:'États pontificaux',c:'#f2d680',rel:'catholique',title:'Pape',base:6,caps:['latium']},
 empire:{n:'Saint-Empire',c:'#b39b55',rel:'catholique',title:'Empereur',base:28,caps:['rhenanie','franconie'],names:['Henri','Frédéric','Conrad','Otton','Louis','Charles','Albert','Rodolphe','Sigismond','Venceslas'],dyns:['Hohenstaufen','Welf','Habsbourg','Luxembourg','Wittelsbach']},
 france:{n:'Royaume de France',c:'#4f73a8',rel:'catholique',title:'Roi',base:20,caps:['iledefrance'],names:['Louis','Philippe','Charles','Jean','Henri','Robert']},
 angleterre:{n:'Royaume d’Angleterre',c:'#b0413e',rel:'catholique',title:'Roi',base:16,caps:['kent'],names:['Henri','Édouard','Richard','Jean','Guillaume','Étienne']},
 ecosse:{n:'Royaume d’Écosse',c:'#5f8f9a',rel:'catholique',title:'Roi',base:7,caps:['lothian'],names:['Alexandre','David','Guillaume','Robert','Jacques','Malcolm']},
 irlande:{n:'Royaumes d’Irlande',c:'#5e8d4c',rel:'catholique',title:'Haut-roi',base:5,caps:['munster','connacht','ulster'],names:['Brian','Ruaidrí','Toirdelbach','Domnall','Conchobar','Muirchertach']},
 castille:{n:'Royaume de Castille',c:'#c56a3c',rel:'catholique',title:'Roi',base:14,caps:['castillep','tolede'],names:['Alphonse','Ferdinand','Sanche','Henri','Pierre','Jean']},
 aragon:{n:'Couronne d’Aragon',c:'#d8a340',rel:'catholique',title:'Roi',base:9,caps:['catalogne','aragon_p'],names:['Pierre','Jacques','Alphonse','Jean','Martin','Ferdinand']},
 navarre:{n:'Royaume de Navarre',c:'#9b4f72',rel:'catholique',title:'Roi',base:4,caps:['navarre_p'],names:['Sanche','Garcia','Thibaut','Henri','Charles','Jeanne']},
 portugal:{n:'Royaume de Portugal',c:'#3f7d70',rel:'catholique',title:'Roi',base:6,caps:['lisbonne','porto'],names:['Alphonse','Sanche','Denis','Pierre','Jean','Ferdinand','Édouard']},
 sicile:{n:'Royaume de Sicile',c:'#7593c4',rel:'catholique',title:'Roi',base:13,caps:['sicile_p','campanie','pouilles'],names:['Roger','Guillaume','Frédéric','Charles','Robert','Louis','Alphonse']},
 venise:{n:'République de Venise',c:'#b85c4b',rel:'catholique',title:'Doge',base:9,caps:['venetie'],doge:['Dandolo','Contarini','Morosini','Tiepolo','Gradenigo','Foscari','Mocenigo','Zeno','Soranzo','Dolfin','Michiel','Venier']},
 genes:{n:'République de Gênes',c:'#c6bfae',rel:'catholique',title:'Commune',base:7,caps:['ligurie'],doge:['Doria','Spinola','Fieschi','Grimaldi','Boccanegra','Adorno','Fregoso']},
 lombardie:{n:'Commune de Milan',c:'#7e9c68',rel:'catholique',title:'Seigneur',base:8,caps:['lombardie_p'],names:['Matteo','Galeazzo','Azzone','Luchino','Bernabò','Gian Galeazzo','Filippo Maria','Francesco']},
 toscane:{n:'Commune de Florence',c:'#c29563',rel:'catholique',title:'Commune',base:6,caps:['toscane_p']},
 toulouse:{n:'Comté de Toulouse',c:'#c45a56',rel:'catholique',title:'Comte',base:6,caps:['toulousain'],names:['Raymond','Alphonse','Bertrand','Guillaume']},
 hongrie:{n:'Royaume de Hongrie',c:'#8d6b9c',rel:'catholique',title:'Roi',base:12,caps:['hongriep'],names:['Béla','Étienne','André','Ladislas','Coloman','Géza','Louis']},
 pologne:{n:'Royaume de Pologne',c:'#c9808e',rel:'catholique',title:'Duc',base:9,caps:['ptepologne','gdepologne'],names:['Boleslas','Casimir','Ladislas','Mieszko','Henri','Lech']},
 danemark:{n:'Royaume de Danemark',c:'#a64646',rel:'catholique',title:'Roi',base:8,caps:['seeland','jutland'],names:['Valdemar','Canut','Éric','Christophe','Olaf','Sven']},
 suede:{n:'Royaume de Suède',c:'#5079ad',rel:'catholique',title:'Roi',base:6,caps:['svealand'],names:['Éric','Magnus','Knut','Charles','Sverker','Birger','Inge']},
 norvege:{n:'Royaume de Norvège',c:'#7e5446',rel:'catholique',title:'Roi',base:5,caps:['norvege_p'],names:['Haakon','Olaf','Magnus','Éric','Sigurd','Inge']},
 byzance:{n:'Empire byzantin',c:'#7a4b8c',rel:'orthodoxe',title:'Basileus',base:22,caps:['thrace','bithynie'],names:['Jean','Manuel','Alexis','Andronic','Michel','Constantin','Isaac','Théodore']},
 rus:{n:'Principautés russes',c:'#6b7f56',rel:'orthodoxe',title:'Grand-prince',base:12,caps:['kiev','vladimir','novgorod'],names:['Iaroslav','Vladimir','Vsevolod','Iouri','Dimitri','Ivan','Vassili','Mstislav']},
 balkans:{n:'Royaumes serbe et bulgare',c:'#9b6f5c',rel:'orthodoxe',title:'Roi',base:8,caps:['serbie','bulgarie'],names:['Stefan','Uroš','Dragutin','Lazar','Ivan Asen','Kaloyan']},
 georgie:{n:'Royaume de Géorgie',c:'#8d5f80',rel:'orthodoxe',title:'Roi',base:6,caps:['georgie_p'],names:['David','Georges','Bagrat','Démétrius','Alexandre']},
 armenie:{n:'Royaume d’Arménie',c:'#b48252',rel:'orthodoxe',title:'Roi',base:5,caps:['cilicie'],names:['Léon','Héthoum','Oshin','Constantin','Guy']},
 outremer:{n:'Royaume de Jérusalem',c:'#ece6d4',rel:'catholique',title:'Roi',base:8,caps:['jerusalem','acre','chypre'],names:['Baudouin','Amaury','Guy','Henri','Jean','Hugues','Pierre']},
 teutons:{n:'Ordre teutonique',c:'#c3c4b6',rel:'catholique',title:'Grand maître',base:8,caps:['prusse','livonie'],names:['Hermann','Siegfried','Winrich','Konrad','Ulrich','Heinrich','Ludolf'],gm:['von Salza','von Feuchtwangen','von Kniprode','von Jungingen','von Plauen','von Orseln','von Altenburg']},
 baltes:{n:'Païens du Nord-Est',c:'#6f6352',rel:'paien',title:'Chefs',base:7,caps:['lituanie','prusse'],names:['Mindaugas','Traidenis','Gediminas','Algirdas','Jogaila','Vytautas','Kęstutis']},
 horde:{n:'Coumans',c:'#ab9468',rel:'paien',title:'Khan',base:9,caps:['volga','steppe'],names:['Batu','Berke','Özbeg','Jani Beg','Toqtamysh','Mengü-Timür','Edigu']},
 turcs:{n:'Grands Seldjoukides',c:'#6f8b4f',rel:'musulman',title:'Sultan',base:20,caps:['konya','galatie'],names:['Kılıç Arslan','Kaykhusraw','Kayqubad','Orhan','Murad','Bayezid','Mehmed','Süleyman']},
 egypte:{n:'Califat fatimide',c:'#97a85a',rel:'musulman',title:'Calife',base:22,caps:['egyptep'],names:['Baybars','Qalawun','Barquq','al-Kamil','as-Salih','Qaitbay','Faraj','Barsbay']},
 maghreb:{n:'Almoravides',c:'#5d8a6a',rel:'musulman',title:'Émir',base:14,caps:['maroc','fes'],names:['Abu Yusuf','Abu Yaqub','Abu Said','Abu l-Hasan','Abu Inan','Abu Salim']},
 ifriqiya:{n:'Zirides',c:'#7fa67c',rel:'musulman',title:'Émir',base:8,caps:['ifriq'],names:['Abu Zakariya','al-Mustansir','Abu Faris','Abu Bakr','Uthman','Abu Ishaq']},
 andalus:{n:'Taïfas d’al-Andalus',c:'#4d7b4f',rel:'musulman',title:'Émir',base:10,caps:['grenade','seville','cordoue'],names:['Muhammad','Yusuf','Ismaïl','Nasr','Abu l-Hasan Ali','Saad']}
};

/* ---------- Provinces : id, nom, maître en 1073, graines [lat,lon], ville ---------- */
const PROVS_RAW = [
['latium','Latium','etats',[[41.9,12.75]],'Rome'],['spolete','Duché de Spolète','etats',[[42.8,12.6]],'Spolète'],['ancone','Marche d’Ancône','etats',[[43.35,13.25]],'Ancône'],['romagne','Romagne','etats',[[44.3,11.9]],'Ravenne'],
['toscane_p','Toscane','toscane',[[43.5,11.0],[43.1,11.5]],'Florence'],['emilie','Émilie','toscane',[[44.7,10.6]],'Canossa'],
['ligurie','Ligurie','genes',[[44.55,9.0]],'Gênes'],['corse','Corse','genes',[[42.1,9.1]],'Ajaccio'],['sardaigne','Sardaigne','genes',[[40.1,9.0]],'Cagliari'],
['lombardie_p','Lombardie','lombardie',[[45.5,9.4]],'Milan'],['piemont','Piémont','lombardie',[[44.9,7.6]],'Turin'],
['venetie','Vénétie','venise',[[45.55,12.0]],'Venise'],['dalmatie','Dalmatie','venise',[[44.0,15.8],[43.3,16.9]],'Zara'],['frioul','Frioul','empire',[[46.1,13.2]],'Aquilée'],
['abruzzes','Abruzzes','sicile',[[42.2,14.0]],'L’Aquila'],['campanie','Campanie','sicile',[[40.9,14.6]],'Naples'],['pouilles','Pouilles','sicile',[[41.0,16.2]],'Bari'],['calabre','Calabre','sicile',[[39.1,16.4]],'Reggio'],['sicile_p','Sicile','sicile',[[37.5,14.1]],'Palerme'],
['saxe','Saxe','empire',[[51.9,11.3]],'Magdebourg'],['bassesaxe','Basse-Saxe','empire',[[53.2,9.8]],'Brême'],['frise','Frise','empire',[[53.0,6.8]],'Groningue'],['brabant','Brabant','empire',[[50.9,4.9]],'Liège'],['lotharingie','Lotharingie','empire',[[49.2,6.3]],'Metz'],['rhenanie','Rhénanie','empire',[[50.4,7.3]],'Aix-la-Chapelle'],['franconie','Franconie','empire',[[49.8,10.2]],'Bamberg'],['souabe','Souabe','empire',[[48.3,9.2]],'Ulm'],['baviere','Bavière','empire',[[48.4,12.2]],'Ratisbonne'],['autriche','Autriche','empire',[[48.1,15.6]],'Vienne'],['carinthie','Carinthie','empire',[[46.8,13.9]],'Klagenfurt'],['tyrol','Tyrol','empire',[[47.0,11.0]],'Trente'],['helvetie','Bourgogne transjurane','empire',[[46.8,7.8]],'Bâle'],['franchecomte','Comté de Bourgogne','empire',[[47.0,5.9]],'Besançon'],['provence','Provence','empire',[[43.8,6.0]],'Arles'],['lyonnais','Lyonnais','empire',[[45.4,5.3]],'Lyon'],['boheme','Bohême','empire',[[49.9,14.6]],'Prague'],['moravie','Moravie','empire',[[49.3,17.0]],'Olomouc'],['brandebourg','Brandebourg','baltes',[[52.5,13.6]],'Brandebourg'],['mecklembourg','Mecklembourg','baltes',[[53.7,12.0]],'Schwerin'],
['iledefrance','Île-de-France','france',[[48.8,2.4]],'Paris'],['picardie','Picardie','france',[[49.9,2.5]],'Amiens'],['flandre','Flandre','france',[[50.9,3.1]],'Bruges'],['champagne','Champagne','france',[[48.8,4.3]],'Reims'],['normandie','Normandie','angleterre',[[49.1,0.0]],'Rouen'],['bretagne','Bretagne','france',[[48.0,-2.9]],'Rennes'],['anjou','Anjou','france',[[47.4,-0.5]],'Angers'],['orleanais','Orléanais','france',[[47.7,1.8]],'Orléans'],['bourgogne','Duché de Bourgogne','france',[[47.2,4.5]],'Dijon'],['auvergne','Auvergne','france',[[45.4,3.0]],'Clermont'],['aquitaine','Aquitaine','france',[[45.9,0.4]],'Poitiers'],['gascogne','Gascogne','france',[[44.1,-0.6]],'Bordeaux'],
['toulousain','Toulousain','toulouse',[[43.7,1.5]],'Toulouse'],['languedoc','Bas-Languedoc','toulouse',[[43.7,3.7]],'Narbonne'],
['kent','Londres et Kent','angleterre',[[51.4,0.0]],'Londres'],['wessex','Wessex','angleterre',[[51.0,-2.2]],'Winchester'],['cornouailles','Cornouailles','angleterre',[[50.4,-4.6]],'Exeter'],['mercie','Mercie','angleterre',[[52.6,-1.6]],'Lincoln'],['eastanglie','Est-Anglie','angleterre',[[52.5,0.8]],'Norwich'],['northumbrie','Northumbrie','angleterre',[[54.5,-1.7]],'York'],['galles','Pays de Galles','angleterre',[[52.3,-3.7]],'Saint-David'],
['lothian','Lothian','ecosse',[[55.7,-3.3]],'Édimbourg'],['highlands','Highlands','ecosse',[[57.4,-4.6]],'Inverness'],['galloway','Galloway','ecosse',[[55.1,-4.6]],'Whithorn'],
['leinster','Leinster','irlande',[[53.0,-6.7]],'Dublin'],['munster','Munster','irlande',[[52.2,-8.7]],'Cashel'],['connacht','Connacht','irlande',[[53.6,-9.0]],'Tuam'],['ulster','Ulster','irlande',[[54.7,-6.9]],'Armagh'],
['galice','Galice','castille',[[42.8,-8.0]],'Compostelle'],['leon','León','castille',[[42.5,-5.8]],'León'],['castillep','Vieille-Castille','castille',[[41.9,-3.9]],'Burgos'],['porto','Portucale','castille',[[41.2,-8.2]],'Porto'],
['tolede','Tolède','andalus',[[39.8,-4.0]],'Tolède'],['estremadure','Estrémadure','andalus',[[39.2,-6.2]],'Badajoz'],['murcie','Murcie','andalus',[[38.1,-1.4]],'Murcie'],['cordoue','Cordoue','andalus',[[37.9,-4.8]],'Cordoue'],['seville','Séville','andalus',[[37.3,-6.0]],'Séville'],['grenade','Grenade','andalus',[[37.0,-3.5]],'Grenade'],['saragosse','Saragosse','andalus',[[41.5,-0.9]],'Saragosse'],['valence','Valence','andalus',[[39.4,-0.6]],'Valence'],['baleares','Baléares','andalus',[[39.6,2.9]],'Palma'],['lisbonne','Lisbonne','andalus',[[38.9,-8.8]],'Lisbonne'],['algarve','Algarve','andalus',[[37.2,-8.0]],'Silves'],
['navarre_p','Navarre','navarre',[[42.75,-1.7]],'Pampelune'],['aragon_p','Aragon','aragon',[[42.5,-0.4]],'Jaca'],['catalogne','Catalogne','aragon',[[41.8,1.9]],'Barcelone'],
['maroc','Maroc','maghreb',[[32.3,-7.0]],'Marrakech'],['fes','Fès','maghreb',[[34.2,-4.5]],'Fès'],['tlemcen','Tlemcen','maghreb',[[34.6,-0.6]],'Tlemcen'],
['algerois','Algérois','ifriqiya',[[36.1,3.5]],'Béjaïa'],['ifriq','Ifriqiya','ifriqiya',[[35.6,9.6]],'Kairouan'],['tripolitaine','Tripolitaine','ifriqiya',[[31.6,13.5]],'Tripoli'],
['cyrenaique','Cyrénaïque','egypte',[[32.2,21.5]],'Barca'],['egyptep','Égypte','egypte',[[30.6,30.5],[30.7,27.5]],'Le Caire'],['acre','Galilée','egypte',[[32.9,35.3]],'Acre'],['tripoli_l','Tripoli du Liban','egypte',[[34.4,36.05]],'Tripoli'],
['jerusalem','Judée','turcs',[[31.6,35.1]],'Jérusalem'],['damas','Damas','turcs',[[33.4,36.6]],'Damas'],['alep','Alep','turcs',[[36.0,37.6]],'Alep'],['konya','Lycaonie','turcs',[[37.9,32.5]],'Konya'],['galatie','Galatie','turcs',[[39.9,32.9]],'Ancyre'],['cappadoce','Cappadoce','turcs',[[38.7,35.6]],'Césarée'],['armenie_p','Haute-Arménie','turcs',[[39.8,41.5]],'Erzurum'],['mesopotamie','Haute-Mésopotamie','turcs',[[37.3,41.8]],'Amida'],
['antioche','Antioche','byzance',[[36.2,36.35]],'Antioche'],['edesse','Édesse','byzance',[[37.2,38.9]],'Édesse'],['chypre','Chypre','byzance',[[35.0,33.2]],'Nicosie'],['cilicie','Cilicie','byzance',[[37.0,35.0]],'Tarse'],['trebizonde','Pont','byzance',[[40.6,39.0]],'Trébizonde'],['bithynie','Bithynie','byzance',[[40.3,30.0]],'Nicée'],['ionie','Ionie','byzance',[[38.4,28.0]],'Smyrne'],['lycie','Pamphylie','byzance',[[37.3,30.3]],'Attalia'],['thrace','Thrace','byzance',[[41.25,28.0]],'Constantinople'],['macedoine','Macédoine','byzance',[[40.9,22.8]],'Thessalonique'],['epire','Épire','byzance',[[39.6,20.7]],'Arta'],['hellade','Hellade','byzance',[[38.6,22.8]],'Thèbes'],['moree','Morée','byzance',[[37.4,22.2]],'Corinthe'],['crete','Crète','byzance',[[35.2,24.9]],'Candie'],['bulgarie','Bulgarie','byzance',[[42.8,25.0]],'Tarnovo'],['albanie','Albanie','byzance',[[41.3,20.0]],'Durazzo'],
['serbie','Serbie','balkans',[[43.6,20.6]],'Ras'],['bosnie','Bosnie','balkans',[[44.1,17.9]],'Bobovac'],
['croatie','Croatie','hongrie',[[45.4,15.8]],'Zagreb'],['hongriep','Hongrie','hongrie',[[47.3,19.4]],'Esztergom'],['pannonie','Transdanubie','hongrie',[[46.9,17.3]],'Székesfehérvár'],['hautehongrie','Haute-Hongrie','hongrie',[[48.6,20.0]],'Kassa'],['transylvanie','Transylvanie','hongrie',[[46.6,24.0]],'Alba Iulia'],
['valachie','Valachie','horde',[[44.6,25.5]],'Argeș'],['moldavie','Moldavie','horde',[[47.0,27.5]],'Suceava'],['crimee','Crimée','horde',[[45.1,34.2]],'Soldaïa'],['steppe','Steppe pontique','horde',[[47.4,36.0],[48.6,32.0]],'Sarkel'],['volga','Basse-Volga','horde',[[48.0,43.0]],'Saraï'],['circassie','Circassie','horde',[[44.6,40.6]],'Matrega'],
['georgie_p','Géorgie','georgie',[[42.0,43.6]],'Tbilissi'],
['gdepologne','Grande-Pologne','pologne',[[52.4,17.0]],'Gniezno'],['ptepologne','Petite-Pologne','pologne',[[50.2,20.4]],'Cracovie'],['mazovie','Mazovie','pologne',[[52.4,21.3]],'Płock'],['silesie','Silésie','pologne',[[51.0,16.6]],'Wrocław'],
['pomeranie','Poméranie','baltes',[[53.8,16.0]],'Kołobrzeg'],['prusse','Prusse','baltes',[[54.1,20.8]],'Königsberg'],['lituanie','Lituanie','baltes',[[55.0,24.5]],'Kernavė'],['livonie','Livonie','baltes',[[57.0,25.0]],'Riga'],['estonie','Estonie','baltes',[[58.8,25.6]],'Reval'],['finlande','Finlande','baltes',[[61.3,24.5]],'Åbo'],
['jutland','Jutland','danemark',[[56.2,9.3]],'Ribe'],['seeland','Seeland','danemark',[[55.5,11.8]],'Roskilde'],['scanie','Scanie','danemark',[[55.9,13.6]],'Lund'],
['gotaland','Götaland','suede',[[57.8,14.2]],'Skara'],['svealand','Svealand','suede',[[59.6,16.5]],'Uppsala'],
['norvege_p','Norvège','norvege',[[60.5,8.8],[59.3,6.6]],'Bergen'],
['novgorod','Novgorod','rus',[[58.5,31.3]],'Novgorod'],['polotsk','Polotsk','rus',[[55.5,28.3]],'Polotsk'],['smolensk','Smolensk','rus',[[54.8,32.5]],'Smolensk'],['vladimir','Vladimir-Souzdal','rus',[[56.5,40.0]],'Vladimir'],['riazan','Riazan','rus',[[54.2,40.5]],'Riazan'],['tchernigov','Tchernigov','rus',[[51.8,33.0]],'Tchernigov'],['kiev','Kiev','rus',[[50.3,30.5]],'Kiev'],['volhynie','Galicie-Volhynie','rus',[[50.2,25.0]],'Halitch']
];
const PROVS = PROVS_RAW.map(([id, n, o, s, city]) => ({ id, n, o, s, city, xy: s.map(([a, b]) => proj(a, b)) }));
const PROV = {}; PROVS.forEach(p => PROV[p.id] = p);
const PATRI = ['latium', 'spolete', 'ancone', 'romagne'];
const PATRI_VAL = { latium: 11, spolete: 7, ancone: 7, romagne: 8 };
const DENIER = ['angleterre', 'danemark', 'suede', 'norvege', 'pologne', 'hongrie', 'portugal', 'irlande', 'ecosse'];
const SEA_LINKS = [['kent','picardie'],['kent','flandre'],['calabre','sicile_p'],['seeland','scanie'],['seeland','jutland'],['thrace','bithynie'],['galloway','ulster'],['galles','leinster'],['wessex','normandie'],['cornouailles','bretagne'],['sicile_p','ifriq'],['chypre','cilicie'],['chypre','acre'],['crete','moree'],['baleares','catalogne'],['baleares','valence'],['corse','ligurie'],['sardaigne','corse'],['estonie','finlande'],['grenade','fes'],['seville','fes'],['seeland','mecklembourg'],['scanie','pomeranie'],['venetie','dalmatie'],['crimee','trebizonde']];
const TARGETS = {
 terre_sainte: ['jerusalem', 'acre', 'antioche', 'tripoli_l', 'edesse', 'chypre', 'damas'],
 iberie: ['tolede', 'saragosse', 'lisbonne', 'valence', 'baleares', 'cordoue', 'seville', 'murcie', 'estremadure', 'algarve', 'grenade'],
 baltique: ['mecklembourg', 'brandebourg', 'pomeranie', 'prusse', 'livonie', 'estonie', 'finlande', 'lituanie']
};
const IBERIA = ['galice','leon','castillep','porto','tolede','estremadure','murcie','cordoue','seville','grenade','saragosse','valence','baleares','lisbonne','algarve','navarre_p','aragon_p','catalogne'];

/* ---------- Traits ---------- */
const POPE_TRAITS = {
 reformateur:{n:'Réformateur',v:1,d:'Combat la simonie : la corruption recule chaque saison ; exiger les investitures porte plus loin, mais les rois s’en irritent.'},
 juriste:{n:'Canoniste',v:1,d:'Maître du droit canon : un sceau supplémentaire chaque saison.'},
 diplomate:{n:'Diplomate',v:1,d:'Les relations s’améliorent 30 % plus vite ; les médiations réussissent plus souvent.'},
 ascete:{n:'Ascète',v:1,d:'Vie austère : dépenses de la Curie −15 %, ferveur de la Chrétienté accrue.'},
 batisseur:{n:'Bâtisseur',v:1,d:'Les chantiers de Rome coûtent 25 % de moins et s’achèvent plus vite.'},
 croise:{n:'Pape croisé',v:1,d:'Les croisades sont 20 % plus fortes ; les appels à la croix rehaussent l’autorité.'},
 theologien:{n:'Théologien',v:1,d:'La prédication et les débats contre l’hérésie sont 50 % plus efficaces.'},
 nepotiste:{n:'Népotiste',v:0,d:'Favorise sa parenté : les neveux cardinaux sont fidèles, mais la corruption grimpe.'},
 irascible:{n:'Irascible',v:0,d:'Colères célèbres : les relations se dégradent 40 % plus vite.'},
 fragile:{n:'Santé fragile',v:0,d:'La santé du pontife décline deux fois plus vite.'},
 vaniteux:{n:'Vaniteux',v:0,d:'Aime la pompe : gains d’autorité accrus, mais corruption en hausse et ferveur moindre.'},
 avide:{n:'Avide',v:0,d:'Revenus +12 %, mais la corruption progresse.'}
};
const RULER_TRAITS = {
 pieux:'Pieux', zele:'Zélé', guerrier:'Guerrier', ambitieux:'Ambitieux', ruse:'Rusé', colerique:'Colérique', faible:'Faible',
 anticlerical:'Anticlérical', erudit:'Érudit', batisseur:'Bâtisseur', tolerant:'Tolérant', avide:'Avide', marchand:'Marchand', enfant:'Mineur', paresseux:'Indolent'
};

/* ---------- Décrets conciliaires ---------- */
const DECREES = {
 celibat:{n:'Célibat des clercs',min:1000,d:'Interdit le mariage des prêtres. Corruption −0,3/saison, ferveur durablement accrue, autorité +3.'},
 simonie:{n:'Condamnation de la simonie',min:1000,d:'Corruption −0,5/saison ; les offices ne se vendent plus (dîmes −5 %).'},
 conclave:{n:'Élection réservée aux cardinaux',min:1000,d:'Le collège seul élit le pape : risque d’antipape divisé par deux au conclave.'},
 treve:{n:'Trêve de Dieu',min:1000,d:'Les guerres entre chrétiens durent moins longtemps et éclatent moins souvent.'},
 investitures:{n:'Liberté des élections épiscopales',min:1000,d:'Investitures +10 dans tous les royaumes catholiques, relations −8 avec les souverains, autorité +5.'},
 tournois:{n:'Interdiction des tournois',min:1100,d:'Croisades +10 % ; relations −3 avec les cours.'},
 embargo:{n:'Embargo contre les Sarrasins',min:1150,d:'Croisades +10 % ; Venise et Gênes −15.'},
 indulgence:{n:'Indulgence plénière des croisés',min:1095,d:'Le recrutement des croisades s’améliore nettement ; corruption +0,2/saison.'},
 universites:{n:'Privilèges des universités',min:1150,d:'Les nouveaux cardinaux sont plus compétents ; autorité +2.'},
 inquisition:{n:'Tribunaux de l’Inquisition',min:1184,d:'Débloque l’Inquisition contre les hérésies : efficace, mais redoutée.'},
 confession:{n:'Confession annuelle',min:1200,d:'Ferveur durablement accrue, croissance de l’hérésie −25 %.'},
 transsub:{n:'Dogme de la transsubstantiation',min:1200,d:'Autorité +4 ; l’hérésie savante recule (−5 partout).'},
 residence:{n:'Résidence obligatoire des évêques',min:1150,d:'Ferveur accrue, investitures +4.'},
 ubi:{n:'Ubi periculum : le conclave enfermé',min:1270,d:'Les conclaves sont rapides ; la vacance du Siège ne dure pas.'},
 clericis:{n:'Immunité fiscale du clergé',min:1250,d:'Dîmes +10 % ; France et Angleterre −12.'},
 unam:{n:'Suprématie pontificale',min:1290,d:'Autorité +8 ; relations −10 avec les souverains ambitieux.'},
 union:{n:'Décret d’union avec les Grecs',min:1000,req:'union',d:'Scelle l’union des Églises si les négociations sont avancées (≥ 60).'},
 finschisme:{n:'Fin du schisme',min:1000,req:'schism',d:'Dépose l’antipape et réunit les obédiences.'},
 reforme:{n:'Réforme de la Curie',min:1300,d:'Corruption −15 immédiatement ; loyauté des cardinaux −8.'}
};

/* ---------- Ordres religieux ---------- */
const ORDERS = {
 cisterciens:{n:'Ordre de Cîteaux',min:1100,who:'Bernard, abbé de Clairvaux',d:'Moines défricheurs : ferveur +2, corruption −0,2/saison, patrimoine mieux exploité.'},
 chartreux:{n:'Ordre des Chartreux',min:1085,who:'Bruno de Cologne',d:'Solitude et silence : autorité +0,15/saison.'},
 hospitaliers:{n:'Hospitaliers de Saint-Jean',min:1113,who:'frère Gérard de Jérusalem',d:'Défendent l’Outremer et soignent les pèlerins : croisades +10 %, Royaume de Jérusalem plus fort.'},
 templiers:{n:'Ordre du Temple',min:1120,who:'Hugues de Payns',d:'Moines-soldats et banquiers : croisades +15 %, revenus +3/saison.'},
 teutoniques:{n:'Chevaliers teutoniques',min:1190,who:'des croisés allemands d’Acre',d:'Croisades baltes +25 % ; conquêtes baltes confiées à l’Ordre.'},
 trinitaires:{n:'Ordre des Trinitaires',min:1194,who:'Jean de Matha',d:'Rachat des captifs : relations avec l’Islam +, ferveur +1.'},
 franciscains:{n:'Frères mineurs (Franciscains)',min:1209,who:'François d’Assise',d:'Pauvreté évangélique : ferveur +3, hérésie −30 %, corruption −0,2/saison.'},
 dominicains:{n:'Frères prêcheurs (Dominicains)',min:1215,who:'Dominique de Guzmán',d:'Prédication savante : la prédication est doublée ; inquisiteurs efficaces.'},
 clarisses:{n:'Pauvres Dames (Clarisses)',min:1212,who:'Claire d’Assise',d:'Ferveur +1 dans toute la Chrétienté, vocations féminines.'},
 carmes:{n:'Ordre du Carmel',min:1226,who:'des ermites du mont Carmel',d:'Ferveur +1, missions plus efficaces.'}
};

/* ---------- Chantiers de Rome ---------- */
const BUILDINGS = {
 chancellerie:{n:'Chancellerie du Latran',c:150,t:4,d:'Les scribes et notaires démultiplient les bulles : +1 sceau par saison.'},
 saintange:{n:'Château Saint-Ange fortifié',c:120,t:4,d:'La forteresse du Tibre : défense de Rome +10, stabilité +5.'},
 hopital:{n:'Hôpital du Saint-Esprit',c:80,t:3,d:'Soins aux pauvres et aux pèlerins : peuple de Rome +8, ferveur +1.'},
 aqueduc:{n:'Aqueduc restauré',c:100,t:4,d:'L’eau revient sur le Champ de Mars : stabilité, revenus +2.'},
 basilique:{n:'Mosaïques de Saint-Pierre',c:140,t:5,d:'Or et lapis-lazuli : pèlerinages +5/saison.'},
 studium:{n:'Studium de la Curie',c:110,t:4,d:'École de droit et de théologie : cardinaux plus compétents, prédication +20 %.'},
 bibliotheque:{n:'Bibliothèque et archives',c:90,t:3,d:'Registres et décrétales : autorité +0,2/saison, légats plus efficaces.'},
 ostie:{n:'Port d’Ostie',c:100,t:3,d:'Les grains et les marchands affluent : revenus +3/saison.'},
 rocca:{n:'Rocche du Patrimoine',c:130,t:4,d:'Forteresses dans les provinces : contrôle du patrimoine +1/saison.'},
 palais_avignon:{n:'Palais des Papes d’Avignon',c:220,t:6,avignon:1,d:'Uniquement en Avignon : revenus +4, pèlerinages, stabilité de la Curie.'},
 chapelle:{n:'Chapelle palatine',c:200,t:5,min:1400,d:'Fresques des maîtres : autorité +4, conclaves plus sereins.'}
};

/* ---------- Noms ---------- */
const PNAMES_LIST = ['Grégoire','Innocent','Urbain','Clément','Boniface','Léon','Benoît','Alexandre','Célestin','Honorius','Nicolas','Jean','Pascal','Eugène','Adrien','Lucius','Martin','Calixte','Victor','Étienne','Sixte','Pie','Paul','Gélase','Anastase','Sylvestre'];
const PN = (a) => { const o = {}; PNAMES_LIST.forEach((n, i) => o[n] = a[i]); return o; };
const CARD_NAMES = {
 italien:{f:['Giovanni','Pietro','Ugo','Guido','Ottaviano','Giacomo','Matteo','Napoleone','Benedetto','Gregorio','Ranieri','Stefano','Rolando','Bernardo','Teobaldo','Ottobono','Latino','Gerardo','Francesco','Niccolò','Angelo','Pandolfo','Leone','Romano','Cencio','Bonifacio'],l:['Colonna','Orsini','Savelli','Conti','Annibaldi','Fieschi','Capocci','Malabranca','Boccamazza','Stefaneschi','Gentile','da Pisa','da Siena','di Segni','Gaetani','Crescenzi','Brancaleoni','Pallavicini','Ubaldini','Castiglioni','Frangipane','Pierleoni','Tomacelli','Orsini del Monte']},
 francais:{f:['Pierre','Guillaume','Jean','Raymond','Bertrand','Hugues','Arnaud','Gaucelme','Gui','Bérenger','Étienne','Simon','Nicolas','Raoul','Gilles','Bernard'],l:['de Bar','de Montfort','de Foix','de Chartres','de Farges','de Got','de la Chapelle','de Beaufort','de Talleyrand','Aycelin','de Mortemart','Roger','de Pellegrue','Fournier','d’Euse','de Cros','de Clermont','de Nogaret']},
 allemand:{f:['Konrad','Otto','Heinrich','Siegfried','Gerhard','Hermann','Friedrich','Ludwig','Burchard','Dietrich'],l:['von Urach','von Wittelsbach','von Zähringen','von Hohenlohe','von Kyburg','von Saarbrücken','von Eppstein','von Nassau']},
 espagnol:{f:['Pedro','Gonzalo','Rodrigo','Gil','Alonso','Juan','Fernando','Diego'],l:['de Albornoz','de Luna','Gómez','Pérez','de Toledo','Martínez','de Carrillo','Hispano']},
 anglais:{f:['Robert','Nicholas','Hugh','Stephen','Thomas','Walter','Adam','Simon','Richard'],l:['Pullen','Breakspear','Langton','Kilwardby','Easton','Langham','de Winchester','Somercote']}
};
const NAT_LABEL = { italien:'Romaine', francais:'Française', allemand:'Impériale', espagnol:'Ibérique', anglais:'Anglaise' };
const NAT_COLOR = { italien:'#b8892d', francais:'#3f63a0', allemand:'#4d4d4d', espagnol:'#b5532d', anglais:'#8c2b2b' };
const SAINTS = ['Gilbert de Sempringham','Hugues de Lincoln','Élisabeth de Hongrie','Hedwige de Silésie','Edmond Rich','Louis d’Anjou','Yves de Tréguier','Nicolas de Tolentino','Brigitte de Suède','Catherine de Sienne','Thomas de Hereford','Wulfstan de Worcester','Stanislas de Cracovie','Ladislas de Hongrie','Knut de Danemark','Éric de Suède','Olaf de Norvège','Homebon de Crémone','Galgano','Rosalie de Palerme'];

/* ---------- Hérésies ---------- */
function heresyNameFor(r, year) {
 const t = [
  [['toulouse','france','aragon'],1140,1330,'Cathares'],[['lombardie','toscane','genes'],1140,1300,'Patarins'],
  [['france','lombardie','empire','toulouse'],1175,1500,'Vaudois'],[['hongrie','balkans'],1000,1500,'Bogomiles'],
  [['empire'],1290,1410,'Frères du Libre-Esprit'],[['lombardie'],1280,1320,'Apostoliques'],[['toscane','sicile'],1300,1400,'Fraticelles'],
  [['angleterre','ecosse'],1370,1500,'Lollards'],[['empire','pologne'],1405,1500,'Hussites'],[['france','toulouse'],1290,1340,'Béguins'],
  [['lombardie','toscane'],1000,1140,'Clercs nicolaïtes']
 ];
 const ok = t.filter(x => x[0].includes(r) && year >= x[1] && year <= x[2]);
 if (ok.length) return ok[Math.floor(Math.random() * ok.length)][3];
 if (year < 1140) return 'Prédicateurs errants';
 if (year < 1300) return 'Bons hommes';
 return 'Spirituels dissidents';
}

/* ---------- Scénarios ---------- */
function RU(n, a, p, t, d, x) { return Object.assign({ n, a, p, t: t || [], d }, x || {}); }
const SCEN = {
 '1073': {
  year:1073, title:'La Querelle des Investitures', tag:'Anno 1073',
  desc:'Le moine Hildebrand vient d’être acclamé par la foule de Rome. Les rois vendent les évêchés, les prêtres prennent femme, et le jeune Henri IV entend nommer lui-même les évêques d’Empire. La Réforme commence — ou meurt avec vous.',
  pope:{name:'Grégoire',fam:'Aldobrandeschi',nat:'italien',age:53,voc:'reformateur'},
  treasury:180, authority:45, corruption:48, invest:24, army:200,
  cards:{italien:9,francais:2,allemand:1},
  fam:[['Frangipane',38,55],['Pierleoni',34,48],['Crescenzi',30,32]],
  ctrl:{latium:72,spolete:50,ancone:44,romagne:30},
  owners:{},
  names:{sicile:'Normands d’Italie',lombardie:'Commune de Milan',toscane:'Marche de Toscane',horde:'Coumans',baltes:'Païens du Nord-Est',turcs:'Grands Seldjoukides',egypte:'Califat fatimide',maghreb:'Almoravides',ifriqiya:'Zirides',andalus:'Taïfas d’al-Andalus',irlande:'Royaumes d’Irlande',pologne:'Duché de Pologne'},
  titles:{sicile:'Duc',toscane:'Comte',lombardie:'Chef de la Pataria',egypte:'Calife',pologne:'Duc'},
  rulers:{
   empire:RU('Henri IV',23,3,['ambitieux','colerique'],'Saliens'), france:RU('Philippe Ier',21,3,['paresseux','avide'],'Capétiens'),
   angleterre:RU('Guillaume le Conquérant',45,6,['guerrier','ruse'],'Normandie'), ecosse:RU('Malcolm III',42,5,['guerrier'],'Dunkeld'),
   irlande:RU('Toirdelbach Ua Briain',64,6,[],'Ua Briain'), castille:RU('Alphonse VI',33,6,['guerrier','ambitieux'],'Jimena'),
   aragon:RU('Sanche Ramírez',30,7,['pieux'],'Jimena'), navarre:RU('Sanche IV',34,5,[],'Jimena'),
   sicile:RU('Robert Guiscard',58,4,['guerrier','ruse'],'Hauteville'), venise:RU('Domenico Selvo',50,5,['marchand'],'Selvo'),
   genes:RU('Les consuls de Gênes',0,5,['marchand'],'',{c:1}), lombardie:RU('Erlembald Cotta',40,9,['zele'],'Pataria'),
   toscane:RU('Mathilde de Canossa',27,9,['pieux','batisseur'],'Canossa',{f:1}), toulouse:RU('Guillaume IV',33,5,[],'Toulouse'),
   hongrie:RU('Salomon',20,4,['faible'],'Árpád'), pologne:RU('Boleslas II le Hardi',31,4,['colerique','guerrier'],'Piast'),
   danemark:RU('Sven II Estridsen',54,6,[],'Estridsen'), suede:RU('Inge l’Ancien',35,7,['pieux'],'Stenkil'), norvege:RU('Olaf III le Paisible',23,7,['pieux','batisseur'],'Hardrada'),
   byzance:RU('Michel VII Doukas',23,6,['faible','erudit'],'Doukas'), rus:RU('Sviatoslav II',46,4,['guerrier'],'Riourikides'),
   balkans:RU('Michel de Dioclée',50,5,[],'Vojislavljević'), georgie:RU('Georges II',19,5,['faible'],'Bagratides'),
   baltes:RU('Les chefs païens',0,2,['guerrier'],'',{c:1}), horde:RU('Les khans coumans',0,2,['guerrier'],'',{c:1}),
   turcs:RU('Malik Shah',18,5,['guerrier','batisseur'],'Seldjoukides'), egypte:RU('al-Mustansir',44,5,['faible'],'Fatimides'),
   maghreb:RU('Youssef ibn Tachfine',64,8,['guerrier','zele'],'Almoravides'), ifriqiya:RU('Tamim ibn al-Muizz',42,5,[],'Zirides'),
   andalus:RU('al-Mutamid de Séville',33,4,['erudit'],'Abbadides')
  },
  rel:{empire:-5,sicile:-25,toscane:30,lombardie:25,angleterre:-5},
  heresy:{lombardie:[12,'Clercs nicolaïtes'],france:[6,null]},
  wars:[['castille','andalus'],['turcs','byzance']],
  union:12, mission:0,
  nums:{france:{Louis:5,Philippe:1,Henri:1,Robert:2,Charles:3},empire:{Henri:4,Conrad:2,Otton:3,Louis:4,Charles:3},angleterre:{Guillaume:1},castille:{Alphonse:6,Sanche:2,Ferdinand:1},byzance:{Jean:1,Constantin:10,Michel:7,Isaac:1,Romain:4},hongrie:{Étienne:1,André:1,Béla:1,Géza:1,Salomon:1}},
  pn:PN([6,1,1,2,7,9,10,2,1,1,2,19,1,2,2,1,3,1,2,9,2,1,1,1,3,2])
 },
 '1198': {
  year:1198, title:'L’Apogée de la Papauté', tag:'Anno 1198',
  desc:'À trente-sept ans, Lothaire de Segni coiffe la tiare. L’Empire a deux rois, la Sicile un roi de quatre ans dont vous êtes le tuteur, Philippe Auguste a répudié sa reine, les Cathares gagnent le Languedoc, et Jérusalem attend une nouvelle croisade.',
  pope:{name:'Innocent',fam:'Conti di Segni',nat:'italien',age:37,voc:'juriste'},
  treasury:260, authority:58, corruption:32, invest:48, army:300,
  cards:{italien:12,francais:3,anglais:1,espagnol:1,allemand:1},
  fam:[['Frangipane',32,44],['Orsini',36,46],['Conti',30,78]],
  ctrl:{latium:66,spolete:58,ancone:50,romagne:42},
  owners:{normandie:'angleterre',anjou:'angleterre',aquitaine:'angleterre',gascogne:'angleterre',leinster:'angleterre',tolede:'castille',estremadure:'maghreb',murcie:'maghreb',cordoue:'maghreb',seville:'maghreb',grenade:'maghreb',saragosse:'aragon',valence:'maghreb',baleares:'maghreb',porto:'portugal',lisbonne:'portugal',algarve:'maghreb',emilie:'lombardie',dalmatie:'hongrie',jerusalem:'egypte',acre:'outremer',tripoli_l:'outremer',antioche:'outremer',damas:'egypte',alep:'egypte',edesse:'egypte',chypre:'outremer',cilicie:'armenie',lycie:'turcs',bulgarie:'balkans',bosnie:'hongrie',brandebourg:'empire',mecklembourg:'empire',pomeranie:'pologne',algerois:'maghreb',ifriq:'maghreb'},
  names:{sicile:'Royaume de Sicile',lombardie:'Ligue lombarde',toscane:'Commune de Florence',horde:'Coumans',baltes:'Païens baltes',turcs:'Sultanat de Roum',egypte:'Sultanat ayyoubide',maghreb:'Califat almohade',ifriqiya:'Banu Ghaniya',irlande:'Royaumes d’Irlande',pologne:'Duchés de Pologne'},
  titles:{egypte:'Sultan',maghreb:'Calife',lombardie:'Recteurs',ifriqiya:'Émir',pologne:'Duc'},
  rulers:{
   empire:RU('Philippe de Souabe',21,5,['ambitieux'],'Hohenstaufen',{claim:'Otton de Brunswick'}), france:RU('Philippe Auguste',33,5,['ruse','ambitieux'],'Capétiens'),
   angleterre:RU('Richard Cœur de Lion',40,6,['guerrier'],'Plantagenêt'), ecosse:RU('Guillaume le Lion',55,6,[],'Dunkeld'),
   irlande:RU('Cathal Crobderg',45,5,[],'Ua Conchobair'), castille:RU('Alphonse VIII',43,7,['guerrier'],'Bourgogne-Ivrée'),
   aragon:RU('Pierre II',24,7,['guerrier'],'Barcelone'), navarre:RU('Sanche VII le Fort',44,5,['guerrier'],'Jimena'), portugal:RU('Sanche Ier',43,6,[],'Bourgogne'),
   sicile:RU('Frédéric Roger',4,5,['enfant'],'Hohenstaufen',{ward:1}), venise:RU('Enrico Dandolo',91,5,['ruse','marchand'],'Dandolo'),
   genes:RU('Le podestat de Gênes',0,5,['marchand'],'',{c:1}), lombardie:RU('Les recteurs de la Ligue',0,5,[],'',{c:1}), toscane:RU('Les prieurs de Florence',0,6,['marchand'],'',{c:1}),
   toulouse:RU('Raymond VI',42,3,['tolerant'],'Toulouse'), hongrie:RU('Imre',24,5,[],'Árpád'), pologne:RU('Mieszko III le Vieux',76,4,[],'Piast'),
   danemark:RU('Knud VI',35,6,[],'Estridsen'), suede:RU('Sverker II',34,6,[],'Sverker'), norvege:RU('Sverre Sigurdsson',47,2,['anticlerical','guerrier'],'Sverre',{excom:1}),
   byzance:RU('Alexis III Ange',45,4,['faible','avide'],'Ange'), rus:RU('Vsevolod Grand-Nid',44,5,[],'Riourikides'), balkans:RU('Stefan Nemanjić',33,6,['ruse'],'Nemanjić'),
   georgie:RU('Tamar la Grande',38,8,['pieux','batisseur'],'Bagratides',{f:1}), armenie:RU('Léon Ier',48,6,['ruse'],'Roupénides'), outremer:RU('Aimery de Lusignan',53,6,[],'Lusignan'),
   teutons:RU('Heinrich Walpot',50,8,['zele'],'Ordre'), baltes:RU('Les chefs païens',0,2,['guerrier'],'',{c:1}), horde:RU('Les khans coumans',0,2,['guerrier'],'',{c:1}),
   turcs:RU('Süleyman II',35,4,['guerrier'],'Seldjoukides de Roum'), egypte:RU('al-Adil',53,6,['ruse'],'Ayyoubides'), maghreb:RU('Abu Yusuf al-Mansur',38,7,['guerrier','batisseur'],'Almohades'),
   ifriqiya:RU('Yahya ibn Ghaniya',40,6,['guerrier'],'Banu Ghaniya')
  },
  rel:{france:-12,norvege:-40,sicile:35,armenie:25,outremer:30},
  heresy:{toulouse:[52,'Cathares'],lombardie:[30,'Patarins'],france:[14,'Vaudois'],hongrie:[12,'Bogomiles']},
  wars:[['france','angleterre'],['castille','maghreb']],
  union:6, mission:6,
  flags:{ingeburge:1,doubleElection:1,nLatran:3},
  nums:{france:{Louis:7,Philippe:2,Henri:1,Robert:2,Charles:3},empire:{Henri:6,Conrad:3,Otton:3,Frédéric:1,Philippe:1,Louis:4,Charles:3},angleterre:{Guillaume:2,Henri:2,Richard:1},castille:{Alphonse:8,Sanche:3,Ferdinand:1},byzance:{Jean:2,Constantin:10,Michel:7,Alexis:3,Manuel:1,Isaac:2,Andronic:1},sicile:{Roger:2,Guillaume:3},hongrie:{Étienne:3,André:1,Béla:3,Ladislas:2,Géza:2,Imre:1}},
  pn:PN([8,2,3,3,7,9,10,3,3,2,2,19,2,3,4,3,3,2,3,9,2,1,1,2,4,2])
 },
 '1294': {
  year:1294, title:'La Tempête des Rois', tag:'Anno 1294',
  desc:'Célestin V, l’ermite couronné, vient d’abdiquer. Vous héritez d’un trône contesté par les Colonna, face à Philippe le Bel qui taxe son clergé et Édouard Ier qui guerroie. Acre est tombée, mais le Jubilé approche et Rome peut redevenir le centre du monde.',
  pope:{name:'Boniface',fam:'Caetani',nat:'italien',age:59,voc:'juriste'},
  treasury:380, authority:62, corruption:42, invest:60, army:400,
  cards:{italien:12,francais:6,anglais:1,espagnol:1},
  fam:[['Colonna',44,30],['Orsini',38,52],['Caetani',30,85]],
  ctrl:{latium:70,spolete:55,ancone:52,romagne:40},
  owners:{normandie:'france',anjou:'france',aquitaine:'france',gascogne:'angleterre',leinster:'angleterre',munster:'angleterre',tolede:'castille',estremadure:'castille',murcie:'castille',cordoue:'castille',seville:'castille',grenade:'andalus',saragosse:'aragon',valence:'aragon',baleares:'aragon',porto:'portugal',lisbonne:'portugal',algarve:'portugal',emilie:'lombardie',dalmatie:'venise',crete:'venise',jerusalem:'egypte',acre:'egypte',tripoli_l:'egypte',antioche:'egypte',damas:'egypte',alep:'egypte',edesse:'egypte',chypre:'outremer',cilicie:'armenie',lycie:'turcs',ionie:'turcs',bulgarie:'balkans',brandebourg:'empire',mecklembourg:'empire',pomeranie:'pologne',prusse:'teutons',livonie:'teutons',estonie:'danemark',finlande:'suede',toulousain:'france',languedoc:'france',sicile_p:'aragon',albanie:'sicile',provence:'sicile',algerois:'ifriqiya'},
  names:{sicile:'Royaume de Naples',lombardie:'Seigneurie de Milan',toscane:'Commune de Florence',horde:'Horde d’Or',baltes:'Grand-duché de Lituanie',turcs:'Beyliks turcs',egypte:'Sultanat mamelouk',maghreb:'Sultanat mérinide',ifriqiya:'Sultanat hafside',andalus:'Émirat de Grenade',irlande:'Rois gaéliques',outremer:'Royaume de Chypre',pologne:'Royaume de Pologne'},
  titles:{egypte:'Sultan',maghreb:'Sultan',ifriqiya:'Sultan',andalus:'Sultan',turcs:'Bey',baltes:'Grand-duc',outremer:'Roi',pologne:'Duc'},
  rulers:{
   empire:RU('Adolphe de Nassau',44,5,['faible'],'Nassau'), france:RU('Philippe IV le Bel',26,4,['ruse','ambitieux','anticlerical'],'Capétiens'),
   angleterre:RU('Édouard Ier',55,6,['guerrier','ambitieux'],'Plantagenêt'), ecosse:RU('Jean Balliol',45,6,['faible'],'Balliol'),
   irlande:RU('Les rois gaéliques',0,5,[],'',{c:1}), castille:RU('Sanche IV',36,5,['colerique'],'Bourgogne-Ivrée'), aragon:RU('Jacques II',27,6,['ruse'],'Barcelone'),
   navarre:RU('Jeanne Ire',21,7,[],'Champagne',{f:1}), portugal:RU('Denis Ier',33,6,['batisseur','erudit'],'Bourgogne'), sicile:RU('Charles II d’Anjou',40,8,['pieux'],'Anjou'),
   venise:RU('Pietro Gradenigo',43,5,['marchand'],'Gradenigo'), genes:RU('Les capitaines du peuple',0,5,['marchand'],'',{c:1}), lombardie:RU('Matteo Visconti',44,4,['ruse'],'Visconti'),
   toscane:RU('Les prieurs de Florence',0,6,['marchand'],'',{c:1}), hongrie:RU('André III',29,6,[],'Árpád'), pologne:RU('Przemysł II',37,6,['ambitieux'],'Piast'),
   danemark:RU('Éric VI Menved',20,5,[],'Estridsen'), suede:RU('Birger Magnusson',14,5,['enfant'],'Folkungar'), norvege:RU('Éric II',26,4,[],'Sverre'),
   byzance:RU('Andronic II',35,7,['erudit','faible'],'Paléologue'), rus:RU('André de Vladimir',40,5,[],'Riourikides'), balkans:RU('Stefan Milutin',41,6,['batisseur','ruse'],'Nemanjić'),
   georgie:RU('David VIII',21,6,[],'Bagratides'), armenie:RU('Héthoum II',28,8,['pieux'],'Héthoumides'), outremer:RU('Henri II de Lusignan',23,6,['faible'],'Lusignan'),
   teutons:RU('Konrad von Feuchtwangen',50,7,[],'Ordre'), baltes:RU('Vytenis',34,2,['guerrier'],'Gediminides'), horde:RU('Toqtaï',24,3,['guerrier'],'Djötchides'),
   turcs:RU('Osman Ier',36,6,['ambitieux','guerrier'],'Ottomans'), egypte:RU('an-Nasir Muhammad',9,5,['enfant'],'Qalawunides'), maghreb:RU('Abu Yaqub Yusuf',50,6,['guerrier'],'Mérinides'),
   ifriqiya:RU('Abu Hafs Umar',50,5,[],'Hafsides'), andalus:RU('Muhammad II',59,6,['ruse'],'Nasrides')
  },
  rel:{france:10,sicile:40,aragon:-20,armenie:20},
  heresy:{lombardie:[22,'Apostoliques'],toscane:[16,'Fraticelles'],france:[12,'Béguins'],empire:[10,'Frères du Libre-Esprit'],hongrie:[10,'Bogomiles']},
  wars:[['aragon','sicile'],['angleterre','france'],['angleterre','ecosse'],['turcs','byzance']],
  union:22, mission:22,
  flags:{colonna:1,acreLost:1,nLatran:4,nLyon:2},
  nums:{france:{Louis:9,Philippe:4,Charles:3,Jean:0,Henri:1,Robert:2},empire:{Henri:6,Conrad:4,Otton:4,Frédéric:2,Rodolphe:1,Adolphe:1,Louis:4,Charles:3},angleterre:{Henri:3,Édouard:1,Richard:1,Jean:1,Guillaume:2},castille:{Alphonse:10,Sanche:4,Ferdinand:3,Henri:1},byzance:{Jean:4,Michel:8,Andronic:2,Constantin:10,Manuel:1,Alexis:4},sicile:{Charles:2,Roger:2,Guillaume:3},hongrie:{Étienne:5,André:3,Béla:4,Ladislas:4}},
  pn:PN([10,5,4,4,7,9,10,4,5,4,4,21,2,3,5,3,4,2,3,9,2,1,1,2,4,2])
 }
};

SCEN['1378'] = {
 year:1378, title:'Le Grand Schisme', tag:'Anno 1378',
 desc:'Le pape vient de quitter Avignon pour Rome, et la foule romaine a exigé un pape italien. Mais onze cardinaux sur seize sont français, et ils murmurent déjà que l’élection fut forcée. La peste revient, les Turcs sont en Thrace, Anglais et Français s’épuisent dans une guerre sans fin.',
 pope:{name:'Urbain',fam:'Prignano',nat:'italien',age:60,voc:'reformateur'},
 treasury:300, authority:50, corruption:56, invest:55, army:400,
 cards:{francais:11,italien:4,espagnol:1},
 fam:[['Orsini',40,48],['Colonna',36,40],['Savelli',28,52]],
 ctrl:{latium:58,spolete:46,ancone:44,romagne:30},
 owners:Object.assign({}, SCEN['1294'].owners, {dalmatie:'hongrie',sardaigne:'aragon',macedoine:'balkans',epire:'balkans',albanie:'balkans',bithynie:'turcs',galatie:'turcs',cilicie:'egypte',estonie:'teutons',kiev:'baltes',volhynie:'baltes',polotsk:'baltes',aquitaine:'france',gascogne:'angleterre',silesie:'empire',pomeranie:'empire',provence:'sicile',sicile_p:'aragon'}),
 names:{sicile:'Royaume de Naples',lombardie:'Seigneurie de Milan',toscane:'Commune de Florence',horde:'Horde d’Or',baltes:'Grand-duché de Lituanie',turcs:'Sultanat ottoman',egypte:'Sultanat mamelouk',maghreb:'Sultanat mérinide',ifriqiya:'Sultanat hafside',andalus:'Émirat de Grenade',irlande:'Rois gaéliques',outremer:'Royaume de Chypre',pologne:'Royaume de Pologne',balkans:'Empire serbe'},
 titles:{egypte:'Sultan',maghreb:'Sultan',ifriqiya:'Sultan',andalus:'Sultan',turcs:'Sultan',baltes:'Grand-duc',outremer:'Roi',pologne:'Roi',balkans:'Prince'},
 rulers:{
  empire:RU('Venceslas',17,4,['paresseux'],'Luxembourg'), france:RU('Charles V le Sage',40,7,['erudit','ruse'],'Valois'),
  angleterre:RU('Richard II',11,5,['enfant'],'Plantagenêt'), ecosse:RU('Robert II',62,5,['faible'],'Stuart'), irlande:RU('Les rois gaéliques',0,5,[],'',{c:1}),
  castille:RU('Henri II',44,5,['guerrier','ruse'],'Trastamare'), aragon:RU('Pierre IV le Cérémonieux',59,4,['ruse','ambitieux'],'Barcelone'),
  navarre:RU('Charles II le Mauvais',46,3,['ruse','colerique'],'Évreux'), portugal:RU('Ferdinand Ier',32,5,['faible'],'Bourgogne'),
  sicile:RU('Jeanne Ire',52,6,[],'Anjou',{f:1}), venise:RU('Andrea Contarini',73,6,['marchand'],'Contarini'), genes:RU('Le doge de Gênes',0,5,['marchand'],'',{c:1}),
  lombardie:RU('Bernabò Visconti',55,2,['anticlerical','colerique'],'Visconti'), toscane:RU('Les prieurs de Florence',0,4,['marchand'],'',{c:1}),
  hongrie:RU('Louis Ier le Grand',52,8,['pieux','guerrier'],'Anjou'), pologne:RU('Louis le Hongrois',52,8,['pieux'],'Anjou'),
  danemark:RU('Olaf II',8,5,['enfant'],'Folkungar'), suede:RU('Albert de Mecklembourg',40,5,[],'Mecklembourg'), norvege:RU('Haakon VI',38,6,[],'Folkungar'),
  byzance:RU('Jean V Paléologue',46,5,['faible'],'Paléologue'), rus:RU('Dimitri Donskoï',28,7,['guerrier'],'Riourikides'), balkans:RU('Lazar Hrebeljanović',49,8,['pieux'],'Hrebeljanović'),
  georgie:RU('Bagrat V',58,6,[],'Bagratides'), outremer:RU('Pierre II de Lusignan',21,5,[],'Lusignan'), teutons:RU('Winrich von Kniprode',68,7,['batisseur'],'Ordre'),
  baltes:RU('Jogaila',26,4,['ambitieux'],'Gediminides'), horde:RU('Mamaï',43,3,['guerrier','ambitieux'],'Kiyat'), turcs:RU('Murad Ier',52,6,['guerrier','ambitieux'],'Ottomans'),
  egypte:RU('Barquq',42,5,['ruse'],'Mamelouks'), maghreb:RU('Abu l-Abbas Ahmad',35,5,[],'Mérinides'), ifriqiya:RU('Abu l-Abbas Ahmad II',60,6,['guerrier'],'Hafsides'), andalus:RU('Muhammad V',40,6,['batisseur'],'Nasrides')
 },
 rel:{france:5,lombardie:-30,hongrie:30,sicile:10},
 heresy:{angleterre:[22,'Lollards'],empire:[16,'Frères du Libre-Esprit'],toscane:[20,'Fraticelles'],lombardie:[12,'Vaudois']},
 wars:[['angleterre','france'],['turcs','byzance'],['teutons','baltes'],['castille','portugal']],
 union:18, mission:62,
 flags:{schisme1378:1,plagueDone:1,mongols:1,nLatran:4,nLyon:2,nVienne:1},
 nums:{france:{Louis:10,Philippe:6,Charles:5,Jean:2,Henri:1,Robert:2},empire:{Henri:7,Conrad:4,Otton:4,Frédéric:2,Rodolphe:1,Adolphe:1,Albert:1,Louis:4,Charles:4,Venceslas:1,Sigismond:0},angleterre:{Henri:3,Édouard:3,Richard:2,Jean:1,Guillaume:2},castille:{Alphonse:11,Sanche:4,Ferdinand:4,Henri:2,Pierre:1,Jean:0},byzance:{Jean:5,Michel:9,Andronic:4,Constantin:10,Manuel:1,Alexis:4},sicile:{Charles:2,Robert:1,Jeanne:1,Ladislas:0},hongrie:{Étienne:5,André:3,Béla:4,Ladislas:4,Louis:1,Charles:1}},
 pn:PN([11,6,5,6,8,9,12,4,5,4,5,22,2,3,5,3,4,2,3,9,2,1,1,2,4,2])
};

/* ---------- Décor de la carte ---------- */
const SEA_LABELS = [
 [35.2,17.5,'MARE INTERNVM',13],[46.5,-8.8,'OCEANVS',15],[56.3,3.2,'MARE GERMANICVM',10],[56.0,18.6,'MARE BALTICVM',9],
 [43.3,34.6,'PONTVS EVXINVS',10],[39.7,11.8,'MARE TYRRHENVM',8],[38.4,25.2,'AEGAEVM',8],[42.5,15.6,'ADRIA',7],[33.6,24.5,'MARE LIBYCVM',9]
];
