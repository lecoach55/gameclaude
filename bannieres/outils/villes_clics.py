# Écrit par le testeur du Studio le 19/11 : clics sur chaque bâtiment et chaque créature des villes 3D (jeu/ sources) ; python3 villes_clics.py 1280 800 1 [factions] [mix|tout|debut]
# Test des villes 3D : clic au centre de chaque bâtiment et sur chaque créature devant son habitation.
# python3 villes.py largeur hauteur dpr [factions] [amel]
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../outils-communs'))
from atelier import serveur,ARGS
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__))
W,H,DPR=int(sys.argv[1]),int(sys.argv[2]),float(sys.argv[3])
FACS=(sys.argv[4] if len(sys.argv)>4 else 'bastion,sylve,necro,horde').split(',')
AMEL=sys.argv[5] if len(sys.argv)>5 else 'mix'
OUT=os.environ.get('SORTIE','/tmp/villes-clics')+f'/villes_{W}x{H}'
os.makedirs(OUT,exist_ok=True)
PREP='''(amel)=>{const v=villesDe(0)[0];if(amel==='debut'){for(const k of ['fort','citadelle','hab1','hab2','hab3','hab4','taverne','marche','guilde1','hab1u'])v.bat[k]=1;}else for(const k in BAT){if(k==='graal')continue;if(BAT[k].amel&&!(amel==='tout'||(amel==='mix'&&BAT[k].niv%2)))continue;v.bat[k]=1;}
 v.dispo=[9,9,9,9,9,9,9];for(const r in G.joueurs[0].res)G.joueurs[0].res[r]=99999;return v.id;}'''
OUVRIR='''()=>{const v=villesDe(0)[0];ouvrirVille(v);}'''
FERMER='''()=>{let n=0;for(let i=0;i<10;i++){const ms=document.querySelectorAll('body > .modal');if(!ms.length)break;const m=ms[ms.length-1];if(m._fermer){m._fermer(0);n++;}else{m.remove();}}return n;}'''
TITRES='''()=>[...document.querySelectorAll('body > .modal')].map(m=>{const h=m.querySelector('h2,h3');return h?h.textContent.trim():m.textContent.trim().slice(0,60);})'''
# masque des créatures : différence entre le panorama avec et sans créatures
MASQUE='''async()=>{const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const att=()=>new Promise(r=>{const f=()=>VI.dirty?requestAnimationFrame(f):r();f();});
 window.PANO_CACHE&&PANO_CACHE.clear();await att();const A=px(VI.pano.c);VI.dirty=true;window.PANO_CACHE&&PANO_CACHE.clear();await att();const A2=px(VI.pano.c);/* 23/11 : deux rendus identiques ? sinon le bruit est masqué */const cw=VI.pano.c.width,ch=VI.pano.c.height;const zones=VI.pano.zones.map(z=>Object.assign({},z));
 const fac=VI.v.fac,cr=FAC[fac].crea;const blobs=[];
 for(let n=1;n<=7;n++){if(!VI.v.bat['hab'+n])continue;const o=cr[n-1];cr[n-1]=o==='wyverne'?'troll':'wyverne';VI.dirty=true;window.PANO_CACHE&&PANO_CACHE.clear();await att();const B=px(VI.pano.c);cr[n-1]=o;
 const s=2,gw=Math.ceil(cw/s),gh=Math.ceil(ch/s),m=new Uint8Array(gw*gh);
 for(let y=0;y<ch;y+=s)for(let x=0;x<cw;x+=s){const i=(y*cw+x)*4;const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);const d0=Math.abs(A[i]-A2[i])+Math.abs(A[i+1]-A2[i+1])+Math.abs(A[i+2]-A2[i+2]);if(d>60&&d0<30)m[(y/s)*gw+x/s]=1;}
 // érosion légère : garder les points dont les 4 voisins sont aussi dans le masque (on clique bien SUR la créature)
 const m2=new Uint8Array(gw*gh);let tot=0;for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const k=y*gw+x;if(m[k])tot++;if(m[k]&&m[k-1]&&m[k+1]&&m[k-gw]&&m[k+gw])m2[k]=1;}
 let sx=0,sy=0,c=0;for(let k=0;k<gw*gh;k++)if(m2[k]){sx+=k%gw;sy+=(k/gw)|0;c++;}
 if(!c){blobs.push({niv:n,n:tot,vis:0});continue;}const cx=sx/c,cy=sy/c;let best=0,bd=1e18;for(let k=0;k<gw*gh;k++)if(m2[k]){const d=(k%gw-cx)**2+(((k/gw)|0)-cy)**2;if(d<bd){bd=d;best=k;}}
 blobs.push({niv:n,n:tot,vis:c,px:(best%gw)*s/VI.dpr,py:((best/gw)|0)*s/VI.dpr});}
 VI.dirty=true;window.PANO_CACHE&&PANO_CACHE.clear();await att();
 return {blobs,zones:zones.map(z=>({b:z.b,x:z.x/VI.dpr,y:z.y/VI.dpr,w:z.w/VI.dpr,h:z.h/VI.dpr})),dpr:VI.dpr};}'''
async def main():
    base=serveur(os.path.join(D,'../jeu'),8790)
    res={}
    async with async_playwright() as p:
        nav=await p.chromium.launch(args=ARGS)
        for fac in FACS:
            ctx=await nav.new_context(viewport={'width':W,'height':H},device_scale_factor=DPR)
            pg=await ctx.new_page();err=[]
            pg.on('pageerror',lambda e:err.append(str(e)[:300]))
            await pg.goto(base+f'index.html?graine=7&taille=54&fac={fac}',timeout=180000)
            await pg.wait_for_function("()=>typeof ECRAN!=='undefined'&&ECRAN==='aventure'",timeout=120000)
            await pg.wait_for_timeout(800);await pg.evaluate(FERMER);await pg.evaluate(PREP,AMEL);await pg.evaluate(OUVRIR)
            await pg.wait_for_function("()=>ECRAN==='ville'&&VI&&VI.pano&&!VI.dirty",timeout=120000)
            await pg.wait_for_timeout(500)
            M=await pg.evaluate(MASQUE)
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}/{fac}.png')
            canvasTop=await pg.evaluate("()=>document.getElementById('cvVille').getBoundingClientRect().top")
            r={'zones':[],'creatures':[],'erreurs':err,'M':M,'top':canvasTop}
            # bâtiments : centre de chaque zone
            for z in M['zones']:
                x=z['x']+z['w']/2;y=z['y']+z['h']/2+canvasTop
                sous=await pg.evaluate("([x,y])=>{const z=VI.pano.zones;let best=null;const X=x*VI.dpr,Y=y*VI.dpr;for(const q of z)if(X>=q.x&&X<=q.x+q.w&&Y>=q.y&&Y<=q.y+q.h&&(!best||q.y>best.y))best=q;return best&&best.b;}",[x,y-canvasTop])
                await pg.mouse.click(x,y);await pg.wait_for_timeout(350)
                t=await pg.evaluate(TITRES);await pg.evaluate(FERMER);await pg.wait_for_timeout(100)
                r['zones'].append({'b':z['b'],'zone_sous_centre':sous,'titres':t})
            # créatures
            for bl in M['blobs']:
                att='hab%d'%bl['niv']
                attNom=await pg.evaluate("(n)=>CRE[creNiv(VI.v,n-1,false)].pl",bl['niv'])
                if not bl['vis']:
                    r['creatures'].append({'pos':None,'taille':bl['n'],'hab_attendue':att,'cre':attNom,'titres':['(invisible)'],'ok':None});continue
                x=bl['px'];y=bl['py']+canvasTop
                await pg.mouse.click(x,y);await pg.wait_for_timeout(350)
                t=await pg.evaluate(TITRES);await pg.evaluate(FERMER);await pg.wait_for_timeout(100)
                ok=any(attNom.lower() in s.lower() for s in t)
                r['creatures'].append({'pos':[round(x),round(y)],'taille':bl['n'],'hab_attendue':att,'cre':attNom,'titres':t,'ok':ok})
            r['erreurs']=err+await pg.evaluate("()=>TK?TK.erreurs:[]")
            res[fac]=r
            await ctx.close()
        await nav.close()
    json.dump(res,open(f'{OUT}/resultats_{AMEL}.json','w'),ensure_ascii=False,indent=1)
    from PIL import Image,ImageDraw
    for fac,r in res.items():
        im=Image.open(f'{OUT}/{fac}.png').convert('RGB');d=ImageDraw.Draw(im);t=r['top']
        for z in r['M']['zones']:
            X=lambda v:v*DPR
            d.rectangle([X(z['x']),X(z['y']+t),X(z['x']+z['w']),X(z['y']+z['h']+t)],outline=(255,255,0),width=2);d.text((X(z['x'])+3,X(z['y']+t)+3),z['b'],fill=(255,255,0))
        for c in r['creatures']:
            if not c['pos']:continue
            x,y=c['pos'];d.text((x*DPR+8,y*DPR-6),c['hab_attendue'],fill=(0,255,0) if c['ok'] else (255,0,0));d.ellipse([x*DPR-6,y*DPR-6,x*DPR+6,y*DPR+6],fill=(0,255,0) if c['ok'] else (255,0,0))
        im.save(f'{OUT}/{fac}_zones_{AMEL}.png')
    for fac,r in res.items():
        print('==',fac,'zones',len(r['zones']),'créatures',len(r['creatures']),'erreurs',r['erreurs'])
        for z in r['zones']:print('  B',z['b'],'->',z['zone_sous_centre'],z['titres'])
        for c in r['creatures']:print('  C',c['pos'],c['taille'],c['hab_attendue'],c['cre'],'->',c['titres'],'OK' if c['ok'] else 'KO')
asyncio.run(main())
