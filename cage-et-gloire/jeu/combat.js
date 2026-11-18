'use strict';
/* Cage & Gloire — moteur de combat (déterministe avec une graine). Tourne sous Node. */
var Combat=(function(){
function rngOf(seed){let a=seed>>>0||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const sig=x=>1/(1+Math.exp(-x)),cl=(x,a,b)=>x<a?a:x>b?b:x;
const TECH={
 jab:{acc:.55,dmg:2.2,z:'tete',n:'jab'},cross:{acc:.05,dmg:5,z:'tete',n:'direct'},hook:{acc:-.2,dmg:6.5,z:'tete',n:'crochet'},
 upper:{acc:-.35,dmg:7,z:'tete',n:'uppercut'},combo:{acc:-.05,dmg:7.5,z:'tete',n:'enchaînement'},
 lowkick:{acc:.25,dmg:3.4,z:'jambe',n:'low-kick'},bodykick:{acc:-.1,dmg:4.6,z:'corps',n:'coup de pied au corps'},
 headkick:{acc:-.95,dmg:12,z:'tete',n:'high-kick'},body:{acc:.1,dmg:3.2,z:'corps',n:'crochet au foie'},
 knee:{acc:-.6,dmg:9,z:'tete',n:'genou sauté'},spin:{acc:-1.25,dmg:13,z:'tete',n:'coup de poing retourné'}
};
const REP={
 striker:{jab:5,cross:4,hook:3,upper:1.4,combo:3,lowkick:2.4,bodykick:1.4,headkick:.7,body:1.4,knee:.3,spin:.25},
 cogneur:{jab:3,cross:4,hook:5,upper:2,combo:2.5,lowkick:1.5,bodykick:.6,headkick:.3,body:1,knee:.2,spin:.1},
 muay:{jab:3,cross:3,hook:2,upper:.8,combo:2.4,lowkick:4,bodykick:3,headkick:1.2,body:1,knee:1,spin:.15},
 lutteur:{jab:4,cross:3,hook:2.4,upper:.6,combo:1.5,lowkick:1.4,bodykick:.6,headkick:.15,body:1,knee:.2,spin:.05},
 grappler:{jab:4,cross:2.5,hook:2,upper:.5,combo:1.2,lowkick:1.6,bodykick:.8,headkick:.2,body:.8,knee:.2,spin:.05},
 sambo:{jab:3.5,cross:3,hook:2.8,upper:.8,combo:1.6,lowkick:1.4,bodykick:.6,headkick:.2,body:1,knee:.3,spin:.05},
 complet:{jab:4.5,cross:3.5,hook:2.8,upper:1,combo:2.4,lowkick:2.2,bodykick:1.2,headkick:.5,body:1.2,knee:.4,spin:.15}
};
const PLANS={equi:{n:'Équilibré',agg:1,td:1,sub:1},debout:{n:'Rester debout',agg:1.05,td:.2,sub:.6},sol:{n:'Amener au sol',agg:1,td:2.4,sub:1.4},
 pression:{n:'Pression',agg:1.35,td:1.1,sub:1,sta:1.25},contre:{n:'Contre / prudent',agg:.75,td:.8,sub:.9,def:5,sta:.8}};
function pick(r,w){let s=0;for(const k in w)s+=w[k];let x=r()*s;for(const k in w){x-=w[k];if(x<=0)return k;}return Object.keys(w)[0];}
function fmt(t){t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
// --- textes ---
const T={
 hit:{tete:['{A} touche {D} au visage avec un {t} !','{t} de {A} en pleine face !','{A} trouve la cible : {t} sur {D} !','Le {t} de {A} passe la garde !'],
  corps:['{A} enfonce un {t} dans les côtes de {D}.','{t} de {A}, {D} grimace.','{A} travaille le corps : {t} !'],
  jambe:['{A} fauche la jambe avant de {D} : {t} !','Nouveau {t} de {A}, la jambe de {D} rougit.','{t} sec de {A} sur la cuisse.']},
 miss:['{D} esquive le {t} de {A}.','{A} lance un {t}, dans le vide.','{D} bloque le {t} de {A}.','{t} de {A} trop court.'],
 counter:['Contre de {D} ! {t} qui claque !','{D} punit l\'erreur : {t} en contre !'],
 big:['OH ! {A} secoue {D} !','{D} accuse le coup, les jambes flanchent !','Énorme {t} de {A}, {D} vacille !'],
 kd:['{D} EST AU TAPIS !','KNOCKDOWN ! {D} s\'écroule sous le {t} de {A} !','Le {t} de {A} envoie {D} au sol !'],
 ko:['C\'EST FINI ! {A} éteint {D} !','KO ! {D} ne se relève pas !','L\'arbitre se jette entre eux, {A} gagne par KO !'],
 tko:['L\'arbitre arrête le combat ! TKO pour {A} !','{D} ne se défend plus, l\'arbitre intervient !','Arrêt de l\'arbitre ! {A} l\'emporte !'],
 td:['{A} plonge dans les jambes et amène {D} au sol !','Amenée au sol de {A} !','Double-leg de {A}, {D} est sur le dos !','{A} soulève {D} et le plaque au tapis !'],
 tdf:['{D} défend l\'amenée au sol de {A}.','Sprawl parfait de {D} !','{A} tente le double-leg, {D} reste debout.'],
 clinch:['{A} colle {D} contre la cage.','Corps à corps contre le grillage.','{A} attrape la nuque : clinch thaï !'],
 cknee:['Genou de {A} au corps dans le clinch !','{A} enchaîne les genoux contre la cage.','Coude de {A} à la sortie du clinch !'],
 sep:['Les deux combattants se séparent.','On repart au centre de l\'octogone.'],
 feint:['Les deux combattants s\'observent.','{A} feinte et tourne autour de {D}.','Échange de feintes au centre.','{A} coupe l\'octogone.','{A} met la pression, {D} recule.'],
 gnp:['{A} frappe au sol ! Ground and pound !','Coude de {A} depuis la position haute !','{A} martèle {D} au sol !','{A} pilonne, {D} se couvre !'],
 ctrl:['{A} contrôle au sol.','{A} passe la garde.','{A} prend la position montée !','{A} prend le dos de {D} !','{A} écrase {D} de tout son poids.'],
 esc:['{D} se relève !','{D} se dégage et revient debout !','{D} retrouve ses appuis contre la cage.'],
 sweep:['Renversement de {D} ! Il passe dessus !','Sweep magnifique de {D} !'],
 subA:['{A} tente un(e) {s} !','{A} cherche le/la {s} !','{A} enroule {D} : {s} !'],
 subE:['{D} s\'échappe de la soumission.','{D} résiste et se libère !','Belle défense de {D} !'],
 subW:['{D} TAPE ! Victoire par {s} de {A} !','Il abandonne ! {s} de {A} !','{A} serre la soumission, {D} tape !'],
 gard:['{A} attaque depuis le dos : {s} !']
};
function txt(r,arr,o){let s=arr[Math.floor(r()*arr.length)];return s.replace(/\{(\w)\}/g,(m,k)=>o[k]??'');}
function cf(a){return 1-((a.cardio??a.e.cardio)-65)/150;}
function eff(f,plan,j){const a=f.at,fo=cl((f.forme??100)/100,.4,1);const m=-(1-fo)*18+(j||0)+(f.bonusCamp||0);
 const o=f.bonusAt||{};return {frappe:a.frappe+m+(o.frappe||0),puiss:a.puiss+m+(o.puiss||0),def:a.def+(PLANS[plan].def||0)+m,lutte:a.lutte+m+(o.lutte||0),sol:a.sol+m+(o.sol||0),cardio:a.cardio+m+(o.cardio||0),menton:a.menton};}
/* simule un combat ; F = [combattant0, combattant1], o = {rounds, plans:[p0,p1], seed} */
function simuler(F,o){
 o=o||{};const r=rngOf(o.seed||Math.floor(Math.random()*1e9));const R=o.rounds||3;const plans=o.plans||['equi','equi'];
 const nm=F.map(f=>f.nom);
 const jr=F.map(()=>(r()+r()+r()-1.5)*7);
 const TR=F.map(f=>{const t={};(f.traits||[]).forEach(k=>t[k]=1);return t;});
 const S=F.map((f,i)=>({e:eff(f,plans[i],jr[i]),st:f.style||'complet',hd:0,bd:0,lg:0,sta:100,kd:0,tr:TR[i],
   hp:(92+(f.at.menton-60)*.45)*(TR[i].menton_fer?1.12:TR[i].verre?.9:1),stats:{sig:0,sigT:0,td:0,tdT:0,kd:0,sub:0,ctrl:0,tete:0,corps:0,jambe:0},rp:[]}));
 const ev=[];let pos='S',top=-1,res=null;let changes=o.changes||{};
 const B=20;
 function rnd(a,b){return a+(b-a)*r();}
 function mob(i){const s=S[i];return 1-cl(s.lg/45,0,.35);}
 function fsta(i){return (100-S[i].sta)*.28;}
 for(let rd=1;rd<=R&&!res;rd++){
  if(changes[rd])for(const k in changes[rd]){plans[k]=changes[rd][k];}
  S.forEach((s,k)=>{const t=s.tr;const rm=(t.diesel?(rd===1?-3:rd>=3?4:0):0)+(t.explosif?(rd===1?7:rd>=3?-2:0):0);s.e=eff(F[k],plans[k],jr[k]+rm);});
  const rp=[{p:0},{p:0}];
  ev.push({r:rd,b:0,k:'round',t:'Début du round '+rd+' !',pos:'S',sta:S.map(s=>s.sta),hd:S.map(s=>s.hd)});
  pos='S';top=-1;let gb=0;
  for(let b=1;b<=B&&!res;b++){
   const tsec=b*15-rnd(0,14);let E=null;
   const ag=S.map((s,i)=>PLANS[plans[i]].agg*(.6+.4*s.sta/100)*(.8+(s.e.frappe+s.e.lutte)/250)*(s.tr.pressing?1.2:1));
   if(pos==='S'||pos==='C'){
    const A=r()<ag[0]/(ag[0]+ag[1])?0:1,D=1-A;const a=S[A].e,d=S[D].e,fa=fsta(A),fd=fsta(D);
    const sty=S[A].st;
    const tdAff=({lutteur:2.3,sambo:2,grappler:1.8,complet:1.1,striker:.35,cogneur:.45,muay:.3})[sty]||1;
    let wT=cl((a.lutte-d.lutte+(a.sol-d.sol)*.35)/28+.55,.04,1.4)*tdAff*PLANS[plans[A]].td;
    if(a.frappe>d.frappe+12&&plans[A]!=='sol')wT*=.45;
    const wS=2.6+(a.frappe-d.frappe)/60;const wQ=pos==='C'?.15:.55;const wC=pos==='C'?.9:.22;
    const act=pick(r,{s:wS,t:wT*.55,q:wQ,c:wC});
    if(act==='q'){E={k:'feint',a:A,t:txt(r,T.feint,{A:nm[A],D:nm[D]})};if(pos==='C')pos='S';}
    else if(act==='c'){
     if(pos==='C'){if(r()<.45){pos='S';E={k:'sep',a:A,t:txt(r,T.sep,{})};}
      else{const land=r()<sig(((a.frappe-fa)-(d.def-fd))/14+.2);const dm=land?rnd(2,5.5)*(1.03+(a.puiss-d.menton)/110)*(1-fa/120):0;
       if(land){S[D].bd+=dm*.6;S[D].hd+=dm*.4;rp[A].p+=dm;S[A].stats.sig++;}S[A].stats.sigT++;
       E={k:'cknee',a:A,h:land,z:'corps',t:land?txt(r,T.cknee,{A:nm[A],D:nm[D]}):txt(r,T.clinch,{A:nm[A],D:nm[D]})};}
     }else{pos='C';E={k:'clinch',a:A,t:txt(r,T.clinch,{A:nm[A],D:nm[D]})};}
    }
    else if(act==='t'){
     S[A].stats.tdT++;S[A].sta-=3.5*cf(a);
     const p=sig(((a.lutte-fa)-(d.lutte-fd)*.9-d.sol*.08)/14+(pos==='C'?.25+(S[A].tr.cage?.8:0):-.45)+(S[D].lg>20?.3:0));
     if(r()<p){pos='G';top=A;gb=0;S[A].stats.td++;rp[A].p+=5;E={k:'td',a:A,h:1,t:txt(r,T.td,{A:nm[A],D:nm[D]})};}
     else{S[A].sta-=2;E={k:'tdf',a:A,h:0,t:txt(r,T.tdf,{A:nm[A],D:nm[D]})};if(r()<.04+d.lutte/2500){pos='G';top=D;gb=0;E.t+=' '+nm[D]+' finit au-dessus !';}}
    }
    else{// frappe
     const rep=Object.assign({},REP[sty]||REP.complet);if(pos==='C'){rep.knee=3;rep.headkick=0;rep.spin=0;rep.bodykick=0;}
     const tk=pick(r,rep),tc=TECH[tk];
     S[A].stats.sigT++;S[A].sta-=(tc.dmg>6?1.6:.9)*cf(a)*(PLANS[plans[A]].sta||1);
     const p=sig(((a.frappe-fa)-(d.def-fd)*mob(D))/17+tc.acc-.1+(S[A].tr.gaucher&&!S[D].tr.gaucher?.15:0)+(S[A].tr.rapide&&(tk==='jab'||tk==='cross')?.2:0));
     if(r()<p){
      let dm=tc.dmg*(1.03+(a.puiss-d.menton)/110)*(1-fa/120)*rnd(.55,1.45);if(r()<.05)dm*=1.8;if(S[A].tr.finisseur&&S[D].hd>S[D].hp*.45)dm*=1.2;
      S[A].stats.sig++;S[A].stats[tc.z]++;rp[A].p+=dm;
      if(tc.z==='jambe')S[D].lg+=dm*1.15;else if(tc.z==='corps'){S[D].bd+=dm;S[D].sta-=dm*.7;}else S[D].hd+=dm;
      E={k:tk,a:A,h:1,z:tc.z,dm,t:txt(r,T.hit[tc.z],{A:nm[A],D:nm[D],t:tc.n})};
      if(tc.z!=='jambe'){
       const crit=dm*(.6+S[D].hd/45+S[D].bd/160);const th=13.4+(S[D].e.menton-60)*.06+(S[D].tr.menton_fer?2:S[D].tr.verre?-2.5:0);
       if(crit>th*rnd(1,2.1)){// knockdown
        S[D].kd++;S[A].stats.kd++;S[D].hd+=6;rp[A].p+=14;
        const pf=.3+(a.puiss-d.menton)/160+S[D].hd/(S[D].hp*2.2)+S[D].kd*.12+(S[A].tr.tueur?.28:0);
        if(r()<pf){res={w:A,m:crit>th*1.75?'ko':'tko',r:rd,t:tsec,tech:tc.n};E={k:'ko',a:A,h:1,t:txt(r,T.kd,{A:nm[A],D:nm[D],t:tc.n})+' '+txt(r,res.m==='ko'?T.ko:T.tko,{A:nm[A],D:nm[D]})};}
        else{E={k:'kd',a:A,h:1,t:txt(r,T.kd,{A:nm[A],D:nm[D],t:tc.n})};if(r()<.5){pos='G';top=A;gb=0;E.t+=' '+nm[A]+' fond sur lui !';}}
       }else if(crit>th*.75)E.t=txt(r,T.big,{A:nm[A],D:nm[D],t:tc.n});
      }
      if(!res&&S[D].hd>=S[D].hp){res={w:A,m:'tko',r:rd,t:tsec};E.k='ko';E.t+=' '+txt(r,T.tko,{A:nm[A],D:nm[D]});}
     }else{
      E={k:tk,a:A,h:0,z:tc.z,t:txt(r,T.miss,{A:nm[A],D:nm[D],t:tc.n})};
      if(pos==='S'&&r()<cl(.13+(d.frappe-a.frappe)/150,.04,.3)*(plans[D]==='contre'?1.7:1)*(S[D].tr.contreur?1.6:1)){// contre
       const ct=r()<.5?'cross':'hook',c2=TECH[ct];S[D].stats.sigT++;
       if(r()<sig((d.frappe-a.def*.9)/12)){const dm=c2.dmg*(1.03+(d.puiss-a.menton)/110)*rnd(.6,1.5);S[A].hd+=dm;S[D].stats.sig++;S[D].stats.tete++;rp[D].p+=dm;
        E={k:'counter',a:D,ct,h:1,z:'tete',dm,t:txt(r,T.counter,{A:nm[A],D:nm[D],t:c2.n})};
        const crit=dm*(.55+S[A].hd/55);const th=13.4+(a.menton-60)*.06+(S[A].tr.menton_fer?2:S[A].tr.verre?-2.5:0);
        if(crit>th*rnd(1,2.1)){S[A].kd++;S[D].stats.kd++;rp[D].p+=14;S[A].hd+=6;
         if(r()<.32+(d.puiss-a.menton)/160+S[A].hd/(S[A].hp*2.2)){res={w:D,m:'ko',r:rd,t:tsec,tech:c2.n};E.k='ko';E.a=D;E.t+=' '+txt(r,T.ko,{A:nm[D],D:nm[A]});}
         else{E.k='kd';E.a=D;E.t+=' '+txt(r,T.kd,{A:nm[D],D:nm[A],t:c2.n});}}
        if(!res&&S[A].hd>=S[A].hp){res={w:D,m:'tko',r:rd,t:tsec};E.k='ko';E.a=D;}
       }
      }
     }
    }
   }else{// au sol
    const A=top,D=1-top,a=S[A].e,d=S[D].e,fa=fsta(A),fd=fsta(D);gb++;S[A].stats.ctrl+=15;rp[A].p+=1.3;
    const pE=sig(((d.lutte-fd)+(d.sol-fd)*.5-(a.lutte-fa)-(a.sol-fa)*.5)/13-1.05+(gb>5?.5:0)+(PLANS[plans[D]].td<.5?.4:0));
    if(r()<pE*.8){
     if(r()<.15+cl((d.sol-a.sol)/120,0,.25)){top=D;gb=0;E={k:'sweep',a:D,t:txt(r,T.sweep,{A:nm[A],D:nm[D]})};}
     else{pos='S';top=-1;E={k:'esc',a:D,t:txt(r,T.esc,{A:nm[A],D:nm[D]})};}
    }else if(r()<.07*(d.sol/a.sol)*PLANS[plans[D]].sub*(S[D].tr.gardes?2:1)&&(d.sol>a.sol+4||S[D].tr.gardes)){// soumission depuis le dos
     const s=SOUMS_C[Math.floor(r()*3)+3];S[D].stats.sub++;rp[D].p+=3;
     if(r()<sig(((d.sol-fd)-(a.sol-fa))/11-3+(S[D].tr.gardes?.4:0))){res={w:D,m:'sub',r:rd,t:tsec,tech:s};E={k:'subw',a:D,s,t:txt(r,T.gard,{A:nm[D],D:nm[A],s})+' '+txt(r,T.subW,{A:nm[D],D:nm[A],s})};}
     else E={k:'suba',a:D,s,t:txt(r,T.gard,{A:nm[D],D:nm[A],s})+' '+txt(r,T.subE,{A:nm[D],D:nm[A]})};
    }else{
     const w={g:2.2+(a.puiss-d.menton)/60,s:cl(.55+(a.sol-d.sol)/30,.1,1.4)*PLANS[plans[A]].sub,c:1};const act=pick(r,w);
     if(act==='g'){S[A].stats.sigT++;S[A].sta-=1.1*cf(a);
      if(r()<sig((a.sol+a.frappe*.3-d.sol*.6-d.def*.3)/14+.4)){const dm=rnd(2,6.5)*(1.03+(a.puiss-d.menton)/110)*(1-fa/120);S[D].hd+=dm;S[A].stats.sig++;S[A].stats.tete++;rp[A].p+=dm;
       E={k:'gnp',a:A,h:1,dm,t:txt(r,T.gnp,{A:nm[A],D:nm[D]})};
       if(S[D].hd>=S[D].hp*(.92+r()*.1)){res={w:A,m:'tko',r:rd,t:tsec,tech:'ground and pound'};E.k='gnpko';E.t+=' '+txt(r,T.tko,{A:nm[A],D:nm[D]});}
      }else E={k:'gnp',a:A,h:0,t:nm[D]+' se protège des frappes de '+nm[A]+'.'};}
     else if(act==='s'){const s=SOUMS_C[Math.floor(r()*SOUMS_C.length)];S[A].stats.sub++;rp[A].p+=3;S[A].sta-=2.2;
      const p=sig(((a.sol-fa)-(d.sol-fd))/11-2.95+S[D].hd/(S[D].hp*1.4)+(S[D].sta<30?.5:0));
      if(r()<p){res={w:A,m:'sub',r:rd,t:tsec,tech:s};E={k:'subw',a:A,s,t:txt(r,T.subA,{A:nm[A],D:nm[D],s})+' '+txt(r,T.subW,{A:nm[A],D:nm[D],s})};}
      else{E={k:'suba',a:A,s,t:txt(r,T.subA,{A:nm[A],D:nm[D],s})+' '+txt(r,T.subE,{A:nm[A],D:nm[D]})};if(r()<.3){pos='S';top=-1;E.t+=' On revient debout.';}}}
     else E={k:'ctrl',a:A,t:txt(r,T.ctrl,{A:nm[A],D:nm[D]})};
    }
    S[D].sta-=.9*cf(d);
   }
   S.forEach((s,i)=>{s.sta-=.45*(PLANS[plans[i]].sta||1)*cf(s.e)*(s.tr.explosif&&rd>=3?1.25:1);if(s.tr.machine)s.sta+=.3;s.sta=cl(s.sta,4,100);});
   if(E){E.r=rd;E.b=b;E.ts=tsec;E.pos=pos==='G'?'G'+top:pos;E.sta=S.map(s=>Math.round(s.sta));E.hd=S.map(s=>+(s.hd/s.hp).toFixed(3));ev.push(E);}
  }
  S.forEach((s,i)=>{s.rp.push(rp[i].p);});
  if(!res){const dd=rp[0].p-rp[1].p,ld=dd>0?0:1,ad=Math.abs(dd);ev.push({r:rd,b:B+1,k:'fin',t:'Fin du round '+rd+'. '+(ad>30?'Round écrasé par '+nm[ld]+' !':ad>12?'Round nettement dominé par '+nm[ld]+'.':ad>3?'Avantage '+nm[ld]+' dans ce round.':'Round très serré !'),pos:'S',sta:S.map(s=>Math.round(s.sta)),hd:S.map(s=>+(s.hd/s.hp).toFixed(3))});
   S.forEach(s=>{s.sta=cl(s.sta+22*(1+(s.e.cardio-65)/150),0,100);s.hd*=.62;s.lg*=.8;});}
 }
 // décision
 let cards=null;
 if(!res){
  cards=[0,1,2].map(j=>{let t0=0,t1=0;const rs=[];
   for(let i=0;i<S[0].rp.length;i++){const d=S[0].rp[i]-S[1].rp[i]+(r()-.5)*5*(j===1?1.3:1);let a=10,b=10;
    if(Math.abs(d)<.25){}else if(d>0){b=Math.abs(d)>34?8:9;}else{a=Math.abs(d)>34?8:9;}t0+=a;t1+=b;rs.push([a,b]);}
   return {s:[t0,t1],rs};});
  const v=cards.map(c=>c.s[0]>c.s[1]?0:c.s[1]>c.s[0]?1:-1);const n0=v.filter(x=>x===0).length,n1=v.filter(x=>x===1).length;
  let w,m;if(n0>=2||n1>=2){w=n0>n1?0:1;const nw=Math.max(n0,n1),nl=Math.min(n0,n1);m=nw===3?'ud':nl===1?'sd':'md';}else if(r()<.3){w=-1;m='dr';}else{const tot=S[0].rp.reduce((x,y)=>x+y,0)-S[1].rp.reduce((x,y)=>x+y,0);w=tot>=0?0:1;m='sd';const c=cards.find(c=>c.s[0]===c.s[1]);if(c){c.s[w]++;}}
  res={w,m,r:R,t:300};
 }
 res.cards=cards;res.stats=S.map(s=>s.stats);res.temps=fmt(res.t);res.kd=S.map(s=>s.kd);
 const fin={k:'res',r:res.r,b:99,res,pos,sta:S.map(s=>Math.round(s.sta)),hd:S.map(s=>+(s.hd/s.hp).toFixed(3))};ev.push(fin);
 return {ev,res,plans};
}
const SOUMS_C=['étranglement arrière','guillotine','clé de bras','triangle','kimura','étranglement d\'Arcé','clé de cheville','étranglement en bras-tête'];
return {simuler,PLANS,TECH,rngOf,fmt};
})();
if(typeof module!=='undefined')module.exports=Combat;
