# Portraits 3D des héros : python3 portraits.py dossier
import asyncio,sys,os,base64,json,subprocess
from playwright.async_api import async_playwright
sys.path.insert(0,os.path.dirname(__file__));import studio as _s  # réutilise la page du studio
T3D=os.environ.get('T3D','/home/claude/t3d');OUT=sys.argv[1]
# variantes : modèle + teintes ; « recol » repeint les tissus (h : teinte source, to : teinte cible)
A=lambda to,s=1.1,dk=1.6,**k:{'f':'hx_aldric','o':dict({'recol':{'h':.75,'to':to,'w':.14,'s':s},'gdk':dk},**k)}
AN=lambda to,s=1.1,dk=1.6,**k:{'f':'hx_aldric','cache':'Helmet','o':dict({'recol':{'h':.75,'to':to,'w':.14,'s':s},'gdk':dk},**k)}
Y=lambda to,s=.8,dk=1.4,**k:{'f':'hx_ysolde','o':dict({'recol':{'h':.11,'to':to,'w':.25,'s':s},'gdk':dk},**k)}
M=lambda **k:{'f':'hx_maelle','o':k}
C=lambda to,s=.7,**k:{'f':'hx_cult','o':dict({'recol':{'h':0,'to':to,'w':.18,'s':s}},**k)}
# une variante par nom de héros (même ordre que HEROS_NOMS dans data.js, genre respecté)
B=lambda hue=.35,**k:{'f':'hx_brute','o':dict({'hue':hue,'gsat':.95,'gdk':1.25,'gamt':.15,'ghc':.2},**k),'d':1.55,'dy':-.02,'rot':.3}
P={
 'barbare':[B(.35),B(.05),B(-.4),M(recol={'h':.33,'to':.05,'w':.15,'s':1})],
 'chaman':[B(1.2,gdk=.95),C(.08,.8,gdk=1.1),Y(.05,1,1.1),M(recol={'h':.33,'to':.08,'w':.15,'s':.9})],
 'chevalier':[A(.62,1.2),A(.0,1.2,hue=2.2),A(.12,hue=.6,dk=1.8),Y(.62,.9)],
 'clerc':[Y(.12,.4,1.6),Y(.6,.7),M(recol={'h':.33,'to':.12,'w':.15,'s':.6}),A(.12,hue=.9,dk=1.9)],
 'rodeur':[M(hue=.25),M(recol={'h':.33,'to':.3,'w':.15,'s':1}),A(.3,hue=1.6,dk=1.3),Y(.3)],
 'druide':[Y(.3),M(recol={'h':.33,'to':.28,'w':.15,'s':.9}),Y(.38,dk=1.2),A(.3,hue=1.3,dk=1.4)],
 'chevmort':[dict(A(.98,1.2,.6,gsat=.3),yeux=0xff4a3a),dict(A(.8,.8,.8,gsat=.35,hue=.4),yeux=0x9fffd0),Y(.98,1,.8,gsat=.4),A(.75,.9,.7,gsat=.25,hue=2.5)],
 'necromancien':[C(.75,gsat=.6,gdk=.9),Y(.78,.8,1.0,gsat=.6),Y(.98,.9,.9,gsat=.5),C(.0,.5,gsat=.5,gdk=1.0)],
}
async def main():
    _s.page();subprocess.run(['sh',os.path.join(T3D,'srv.sh')]);os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':300,'height':300});err=[];pg.on('pageerror',lambda e:err.append(str(e)[:300]))
        await pg.goto('http://localhost:8765/bs_studio.html',timeout=120000)
        await pg.evaluate("()=>new Promise(r=>{const f=()=>window.studioPret?window.studioPret.then(r):setTimeout(f,100);f();})")
        for cl,l in P.items():
            if os.environ.get('SEUL') and cl not in os.environ['SEUL'].split(','):continue
            for i,d in enumerate(l):
                d=json.loads(json.dumps(d))
                js="(p)=>rendrePortrait(p)"
                u=await pg.evaluate(js,d);open(f'{OUT}/{cl}_{i}.png','wb').write(base64.b64decode(u.split(',')[1]))
            print(cl,'ok',err[-1:] if err else '')
        await b.close()
if __name__=='__main__':asyncio.run(main())
