# Scènes reproductibles d'« Une vie parmi 8 milliards » (graine fixe + état forcé).
import sys,os,asyncio
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../outils-communs'))
from atelier import serveur,navigateur,page,mesurer,capturer,avancer
ICI=os.path.dirname(os.path.abspath(__file__));BUILD=os.path.join(ICI,'../build')
GRAINE="(()=>{let a=%d;window.__regraine=n=>{a=n};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})()"
def etat(pays,m,age,urb=True,job="serv",lvl=1,extra=""):
    return f"""S.c=C.find(c=>c.n=="{pays}");S.ab=null;S.m={m};S.age={age};S.b=62;S.urban={'true' if urb else 'false'};S.school=null;S.job={{s:"{job}",lvl:{lvl}}};S.partner={{name:"Ama",sex:S.sex=="m"?"f":"m",rel:70,off:-2,since:{max(0,age-8)},married:true,work:true}};S.kids=[{{name:"Leo",sex:"m",at:{max(0,age-8)},alive:true,inv:0}},{{name:"Mia",sex:"f",at:{max(0,age-1)},alive:true,inv:0}}];S.turnNo=1;{extra};theme(S.c.r);hdr()"""
SCENES={
 'rural0':etat("Niger",8,30,False,"agri",0),
 'ville1':etat("Inde",30,30,True,"serv",0),
 'appart2':etat("Brésil",42,32,True,"serv",1),
 'maison3':etat("Japon",55,40,True,"tech",1),
 'villa4':etat("France",95,50,True,"sante",2,'S.asp="monde";S.f.robot=1'),
 'nuit':etat("France",80,88,True,"sante",2,'S.retired=true;S.job=null'),
 'hiver':etat("Allemagne",60,40,False,"tech",1,'S.turnNo=3'),
 'automne':etat("Allemagne",60,40,False,"tech",1,'S.turnNo=2'),
 'canicule':etat("Espagne",50,40,True,"bur",1,'S.turnNo=5;S.f.heat=5') if False else etat("France",50,40,True,"bur",1,'S.turnNo=5;S.f.heat=5'),
 'deluge':etat("Bangladesh",30,35,True,"serv",0,'S.turnNo=6;S.f.flood=6'),
 'froid':etat("Russie",35,45,True,"ind",1),
}
async def ouvrir(p,graine=7,largeur=390,hauteur=844,qualite="hd",figer=False):
    """figer=True : horloge virtuelle (outils-communs/horloge.js) → captures identiques d'une série à l'autre.
    Ne jamais figer pour mesurer des img/s (perf.py, saccades.py…)."""
    base=serveur(BUILD,8790)
    nav=await navigateur(p)
    pg=await page(nav,base+'index.html',largeur,hauteur,stockage={'vie8m_q':qualite},figer=graine if figer else None)
    pg._fige=bool(figer)
    await pg.add_init_script(GRAINE%graine)
    await pg.goto(base+'index.html');await attente(pg,600)
    await pg.evaluate("()=>{__regraine(%d);newLife();start()}"%graine);await attente(pg,1200)  # re-graine : la vie tirée ne dépend pas de l'écran d'accueil
    return nav,pg
async def attente(pg,ms):
    """Page figée : joue ms/50 images virtuelles de 50 ms (le jeu plafonne dt à 0,05 s : même animation, 3× moins d'images à rendre ;
    les minuteries gardent le vrai temps : petite pause réelle en plus)."""
    if getattr(pg,'_fige',False):
        # minuteries réelles (fondu de déménagement 350 ms…) déclenchées pendant les images : pause réelle puis quelques images de plus
        await pg.wait_for_timeout(min(ms,400));await avancer(pg,max(1,round(ms/50)),50);await pg.wait_for_timeout(450);await avancer(pg,12,50)
    else:await pg.wait_for_timeout(ms)
async def scene(pg,nom,attente_ms=3500):
    await pg.evaluate("()=>{"+("__regraine(%d)"%(7+len(nom)) if getattr(pg,'_fige',False) else "")+";"+SCENES[nom]+"}");await attente(pg,attente_ms)
