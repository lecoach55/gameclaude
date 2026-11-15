'use strict';
/* Cage & Gloire — données : organisations, catégories, noms, textes */
var ORGS=[
 {id:'cfr',nom:'Cage Fighting Régional',court:'CFR',tier:0,pays:'🇫🇷',c1:'#2fbf71',c2:'#0d3b26',acc:'#c8ffd9',freq:2,show:800,max:12,
  villes:['Lille','Nantes','Rennes','Toulouse','Montpellier','Dijon','Metz','Clermont-Ferrand','Angers','Brest','Nancy','Perpignan'],devise:'Là où tout commence'},
 {id:'hex',nom:'Hexagone MMA League',court:'HEX',tier:1,pays:'🇫🇷',c1:'#3d7bff',c2:'#0c1d4a',acc:'#ff4d5e',freq:3,show:2500,max:12,
  villes:['Paris','Lyon','Marseille','Bordeaux','Nice','Strasbourg','Lille','Toulouse'],devise:'Le meilleur du MMA français'},
 {id:'ecc',nom:'European Cage Championship',court:'ECC',tier:2,pays:'🇪🇺',c1:'#ffc531',c2:'#13224d',acc:'#7fb2ff',freq:3,show:7000,max:12,
  villes:['Londres','Varsovie','Amsterdam','Stockholm','Dublin','Madrid','Prague','Milan','Berlin','Bruxelles'],devise:'La couronne du continent'},
 {id:'gla',nom:'Gladius Fighting Series',court:'GLADIUS',tier:3,pays:'🌐',c1:'#e8344a',c2:'#3a0710',acc:'#ffb4a0',freq:3,show:20000,max:12,
  villes:['Tokyo','Singapour','Dubaï','Moscou','São Paulo','Mexico','Chicago','Sydney'],devise:'Le Colisée moderne'},
 {id:'apx',nom:'Apex Fighting Championship',court:'APEX',tier:4,pays:'🏆',c1:'#e9c46a',c2:'#0a0a0c',acc:'#ffffff',freq:2,show:55000,max:14,
  villes:['Las Vegas','New York','Paris','Abou Dabi','Londres','Rio de Janeiro','Toronto','Melbourne','Tokyo','Mexico'],devise:'Le sommet du monde'}
];
var DIVS=[
 {id:'pl',nom:'Poids plumes',kg:66,s:'H'},{id:'le',nom:'Poids légers',kg:70,s:'H'},{id:'mm',nom:'Poids mi-moyens',kg:77,s:'H'},
 {id:'mo',nom:'Poids moyens',kg:84,s:'H'},{id:'ml',nom:'Poids mi-lourds',kg:93,s:'H'},{id:'lo',nom:'Poids lourds',kg:120,s:'H'},
 {id:'fp',nom:'Poids pailles (F)',kg:52,s:'F'},{id:'fc',nom:'Poids coqs (F)',kg:61,s:'F'}
];
var STYLES={
 striker:{nom:'Pieds-poings',ic:'🥊',b:{frappe:8,puiss:3,def:4,lutte:-6,sol:-6}},
 cogneur:{nom:'Cogneur',ic:'💥',b:{puiss:10,menton:4,frappe:2,def:-4,cardio:-4,sol:-4}},
 lutteur:{nom:'Lutteur',ic:'🤼',b:{lutte:10,cardio:4,sol:2,frappe:-5,def:-2}},
 grappler:{nom:'Jiu-jitsu',ic:'🥋',b:{sol:11,lutte:3,frappe:-6,puiss:-3}},
 complet:{nom:'Complet',ic:'⭐',b:{frappe:2,lutte:2,sol:2,cardio:2,def:2}},
 sambo:{nom:'Sambo',ic:'🐻',b:{lutte:8,sol:6,menton:3,frappe:-4,def:-3}},
 muay:{nom:'Muay-thaï',ic:'🦵',b:{frappe:6,puiss:5,cardio:2,lutte:-5,sol:-5}}
};
var ATTRS=[['frappe','Frappe'],['puiss','Puissance'],['def','Défense'],['lutte','Lutte'],['sol','Sol / JJB'],['cardio','Cardio'],['menton','Menton']];
var PAYS={
 FR:{f:'🇫🇷',lib:'France',p:['Lucas','Hugo','Théo','Nathan','Mathis','Enzo','Yanis','Karim','Mehdi','Kylian','Bastien','Romain','Florian','Kevin','Mamadou','Samir','Axel','Dylan','Jordan','Maxime','Antoine','Ilyes','Bilal','Moussa','Thibault','Quentin','Adrien','Jérémy','Cédric','Nassim','Wilfried','Loïc'],
   pf:['Léa','Manon','Chloé','Inès','Sarah','Camille','Jade','Océane','Lina','Emma','Nora','Amandine','Laura','Yasmine','Marion','Aïcha'],
   n:['Martin','Bernard','Dubois','Durand','Leroy','Moreau','Laurent','Garnier','Faure','Rousseau','Blanc','Guerin','Muller','Henry','Roussel','Mercier','Boyer','Diallo','Traoré','Benali','Haddad','Mendy','Camara','Lefèvre','Gauthier','Chevalier','Fontaine','Perrin','Bonnet','Lambert','Masson','Barbier','Brunet','Meyer','Ndiaye','Kone','Saïdi','Marchand','Picard','Renard']},
 BE:{f:'🇧🇪',lib:'Belgique',p:['Jonas','Arnaud','Wout','Senne','Bram','Mohamed','Yassine','Lander'],pf:['Lotte','Elise','Fien','Julie'],n:['Peeters','Janssens','Maes','Jacobs','Mertens','Willems','Claes','Dupont','Lemaire','Wouters']},
 CH:{f:'🇨🇭',lib:'Suisse',p:['Luca','Noah','Fabian','Loris','Joël'],pf:['Lara','Nina','Céline'],n:['Müller','Meier','Schmid','Keller','Favre','Rochat','Brunner']},
 BR:{f:'🇧🇷',lib:'Brésil',p:['João','Thiago','Rafael','Gabriel','Leandro','Rodrigo','Vitor','Anderson','Junior','Marcos','Renan','Gilberto','Caio'],pf:['Juliana','Larissa','Bia','Taís','Jéssica'],
   n:['Silva','Santos','Oliveira','Souza','Lima','Pereira','Ferreira','Costa','Rodrigues','Almeida','Nascimento','Barbosa','Carvalho','Ribeiro','Moraes','Teixeira']},
 US:{f:'🇺🇸',lib:'États-Unis',p:['Jake','Tyler','Cody','Brandon','Dustin','Jon','Travis','Derrick','Marcus','Chase','Bo','Colby','Justin','Kyle','Darius','Sean'],pf:['Kayla','Ashley','Taylor','Brittany','Paige','Jessica'],
   n:['Johnson','Miller','Davis','Wilson','Anderson','Thomas','Jackson','White','Harris','Thompson','Walker','Young','Allen','King','Wright','Hill','Brooks','Carter']},
 RU:{f:'🇷🇺',lib:'Russie',p:['Magomed','Shamil','Ruslan','Aleksei','Petr','Sergei','Movsar','Said','Umar'],pf:['Irina','Yana','Antonina'],
   n:['Magomedov','Ivanov','Volkov','Petrov','Abdulaev','Gadzhiev','Smirnov','Kuznetsov','Aliev']},
 IE:{f:'🇮🇪',lib:'Irlande',p:['Conor','Sean','Cian','Darragh','Liam'],pf:['Aisling','Siobhan','Niamh'],n:['Murphy',"O'Brien",'Kelly','Walsh','Byrne','Ryan',"O'Neill",'Doyle']},
 GB:{f:'🇬🇧',lib:'Royaume-Uni',p:['Tom','Harry','Jack','Ollie','Callum','Michael','Arnold'],pf:['Molly','Lauren','Chloe'],n:['Smith','Jones','Taylor','Brown','Evans','Edwards','Wood']},
 PL:{f:'🇵🇱',lib:'Pologne',p:['Jan','Mateusz','Kamil','Marcin','Bartosz','Łukasz'],pf:['Joanna','Karolina','Agnieszka'],n:['Nowak','Kowalski','Wiśniewski','Wójcik','Kamiński','Lewandowski','Zieliński']},
 NG:{f:'🇳🇬',lib:'Nigeria',p:['Chidi','Emeka','Tunde','Sodiq'],pf:['Amara','Ngozi'],n:['Okafor','Eze','Adeyemi','Balogun','Nwosu']},
 MX:{f:'🇲🇽',lib:'Mexique',p:['Brandon','Yair','Diego','Alejandro','Ricardo','Jesús'],pf:['Alexa','Irene','Lupita'],n:['Hernández','García','Rodríguez','Moreno','López','Martínez','Rivera']},
 JP:{f:'🇯🇵',lib:'Japon',p:['Takashi','Yuta','Kenji','Ryo','Hiroshi','Tatsuro'],pf:['Ayaka','Mizuki','Rin'],n:['Sato','Suzuki','Takahashi','Tanaka','Nakamura','Yamamoto']},
 SE:{f:'🇸🇪',lib:'Suède',p:['Alexander','Khalil','Erik','Oscar','Anton'],pf:['Elin','Saga'],n:['Andersson','Johansson','Lindqvist']},
 AU:{f:'🇦🇺',lib:'Australie',p:['Alex','Tai','Robert','Jack','Riley'],pf:['Casey','Jess'],n:['Jenkins','Cooper','Mitchell','Kelly','Nguyen','Walsh']},
 GE:{f:'🇬🇪',lib:'Géorgie',p:['Giga','Guram','Levan','Davit','Nika','Zurab'],pf:['Liza','Nino'],n:['Kutateladze','Beridze','Gelashvili','Lomidze','Kapanadze','Tsiklauri']},
 KZ:{f:'🇰🇿',lib:'Kazakhstan',p:['Arman','Damir','Nursultan','Timur','Yerlan'],pf:['Mariya','Aida'],n:['Zhumagulov','Bekov','Seitkali','Abenov','Nurlanov']},
 CN:{f:'🇨🇳',lib:'Chine',p:['Wei','Song','Li','Yan'],pf:['Xiaonan'],n:['Zhang','Li','Wang','Song','Yan','Liu']},
 NL:{f:'🇳🇱',lib:'Pays-Bas',p:['Daan','Bas','Rico','Reinier'],pf:['Germaine','Lotte'],n:['de Jong','de Vries','van Dijk','Bakker','de Ridder']},
 CM:{f:'🇨🇲',lib:'Cameroun',p:['Samuel','Patrick','Junior'],pf:['Grace','Béatrice'],n:['Eto','Ndongo','Tchami']},
 MA:{f:'🇲🇦',lib:'Maroc',p:['Youssef','Hamza','Anas','Ayoub'],pf:['Salma','Imane'],n:['El Amrani','Bennani','Tazi','Alaoui']},
 ES:{f:'🇪🇸',lib:'Espagne',p:['Joel','Pablo','Sergio','Javier','Iván'],pf:['Lucía','Paula'],n:['García','Fernández','González','Ruiz','Díaz']},
 IT:{f:'🇮🇹',lib:'Italie',p:['Marvin','Alessio','Lorenzo','Matteo','Carlo'],pf:['Giulia','Chiara'],n:['Rossi','Russo','Ferrari','Esposito','Bianchi']},
 CA:{f:'🇨🇦',lib:'Canada',p:['Mike','Charles','Marc-André','Kyle'],pf:['Valérie','Sarah'],n:['Tremblay','Gagnon','Roy','Côté','Bouchard','Pelletier']}
};
// origine des combattants selon le niveau de l'organisation
var PAYS_TIER=[
 {FR:70,BE:10,CH:6,MA:6,ES:4,IT:4},
 {FR:60,BE:8,CH:5,MA:7,ES:5,IT:5,PL:5,CM:5},
 {FR:18,GB:15,PL:12,IE:8,SE:7,NL:7,ES:7,IT:7,BE:5,GE:6,RU:8},
 {BR:14,US:12,RU:12,JP:10,KZ:6,CN:7,MX:8,AU:6,GE:6,NG:4,FR:8,GB:7},
 {US:20,BR:16,RU:12,FR:6,GB:6,AU:5,MX:6,NG:5,GE:6,IE:3,CN:4,JP:3,KZ:4,PL:2,CA:2}
];
var SURNOMS=['Le Boucher','The Hammer','La Machine','El Toro','Le Marteau','Iron','Le Loup','The Ghost','Le Pitbull','La Panthère','Rocky','The Nightmare','Le Bulldozer','Ninja','Le Cobra','Le Sniper','Bad Boy','Le Viking','Le Requin','La Tornade','Le Bourreau','Tank','The Ripper','El Matador','Le Samouraï','Scorpion','Le Lion','The Hurricane','Wolverine','L\'Artiste','Titan','Le Professeur','Mad Dog','The Killer Bee','La Foudre','Trouble','The Mauler','Le Faucon','Cannonier','The Chosen One','Le Roc'];
var SURNOMS_F=['La Comète','Furie','La Sentinelle','Rubis','L\'Ouragan','Mamba','La Tigresse','Ironheart','La Lionne','La Reine','Venom','Tornade','La Guerrière','Fearless'];
var ISSUES={ko:'KO',tko:'TKO',sub:'Soumission',ud:'Décision unanime',sd:'Décision partagée',md:'Décision majoritaire',dr:'Match nul',dq:'Disqualification'};
var SOUMS=['étranglement arrière','guillotine','clé de bras','triangle','kimura','étranglement d\'Arcé','clé de cheville','anaconda','étranglement en bras-tête','heel hook'];
if(typeof module!=='undefined')module.exports={ORGS,DIVS,STYLES,ATTRS,PAYS,PAYS_TIER,SURNOMS,SURNOMS_F,ISSUES,SOUMS};
var TRAITS={
 menton_fer:{n:'Menton de fer',ic:'🪨',d:'Encaisse beaucoup mieux les coups à la tête.',bon:1},
 verre:{n:'Mâchoire de verre',ic:'🥚',d:'Tombe plus facilement sur un coup propre.',bon:0},
 machine:{n:'Cardio de machine',ic:'🫁',d:'Se fatigue nettement moins vite.',bon:1},
 finisseur:{n:'Finisseur',ic:'🎯',d:'Frappe plus fort quand l\'adversaire est touché.',bon:1},
 tueur:{n:'Instinct de tueur',ic:'🐺',d:'Conclut plus souvent après un knockdown.',bon:1},
 diesel:{n:'Diesel',ic:'🚂',d:'Lent au démarrage, redoutable dans les derniers rounds.',bon:1},
 explosif:{n:'Explosif',ic:'💣',d:'Terrible au premier round, s\'essouffle ensuite.',bon:1},
 gaucher:{n:'Gaucher',ic:'🫲',d:'Sa garde inversée gêne les droitiers.',bon:1},
 contreur:{n:'Contreur',ic:'🔁',d:'Punit les erreurs en contre.',bon:1},
 pressing:{n:'Pressing',ic:'⏩',d:'Avance sans cesse et impose le rythme.',bon:1},
 cage:{n:'Lutte contre la cage',ic:'🧱',d:'Redoutable pour amener au sol depuis le corps à corps.',bon:1},
 gardes:{n:'Garde dangereuse',ic:'🕸️',d:'Cherche la soumission même sur le dos.',bon:1},
 rapide:{n:'Vitesse de main',ic:'⚡',d:'Ses jabs et directs partent plus vite.',bon:1},
 showman:{n:'Showman',ic:'🎤',d:'Gagne beaucoup plus de popularité.',bon:1,hors:1},
 bosseur:{n:'Gros bosseur',ic:'🏋️',d:'Progresse plus vite à l\'entraînement.',bon:1,hors:1},
 fragile:{n:'Fragile',ic:'🩹',d:'Se blesse plus souvent.',bon:0,hors:1},
 leader:{n:'Leader',ic:'🧭',d:'Son moral rejaillit sur toute l\'écurie.',bon:1,hors:1},
 tete_brulee:{n:'Tête brûlée',ic:'🔥',d:'Moral en dents de scie, adore les gros combats.',bon:0,hors:1}
};
var BLESSURES=[{n:'Coupure à l\'arcade',s:[2,3]},{n:'Côte fêlée',s:[3,6]},{n:'Main fracturée',s:[5,9]},{n:'Entorse du genou',s:[4,8]},{n:'Épaule luxée',s:[6,10]},{n:'Commotion',s:[4,7]},{n:'Ligament croisé',s:[18,30],grave:1},{n:'Hernie discale',s:[10,16],grave:1}];
if(typeof module!=='undefined'){module.exports.TRAITS=TRAITS;module.exports.BLESSURES=BLESSURES;}
