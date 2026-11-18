# Variante de captures.py pour l'ordinateur : VW=1280 VH=800 SCN="c6:battle:6,b4:boss:4" python3 captures_ordi.py sortie 1 (VD_URL pour viser une autre version)
# Captures de référence reproductibles (graine fixe) : mêmes scènes que le banc perf.py
# usage : python3 captures.py dossier [niveau]
# Écrit aussi lisibilite.json : luminance moyenne des personnages, de leur entourage, et contraste (lisibilité des silhouettes)
import asyncio,sys,os
from playwright.async_api import async_playwright
import os as _os;VD_URL=_os.environ.get('VD_URL','http://localhost:8765/index_local.html')  # autre version du jeu : VD_URL=http://localhost:8766/index_local.html
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
SCN=[('explo_F2','explo',2),('explo_F6','explo',6),('explo_F10','explo',10),('explo_F14','explo',14),('combat_F6','battle',6),('boss_F8','boss',8)]
if os.environ.get('SCN'):SCN=[(x.split(':')[0],x.split(':')[1],int(x.split(':')[2])) for x in os.environ['SCN'].split(',')]

LIS="""()=>{const d=G3._d(),r=d.renderer,gl=r.getContext(),sc=d.rp.scene,cam=d.cam;
 const roots=d.rp.scene===d.scB?[...d.BT.units.values()].map(u=>u.root):[...(d.EX.party||[]).map(u=>u.root),...[...(d.EX.packs||new Map()).values()].filter(u=>u.root.visible).map(u=>u.root)];
 const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,read=()=>{const a=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
 d.composer.render(0.016);const A=read();
 const vis=[],mats=[],white=new THREE_BASIC();const isChar=new Set();roots.forEach(R=>R.traverse(o=>isChar.add(o)));
 sc.traverse(o=>{if(o.isMesh||o.isPoints||o.isSprite||o.isLine){if(isChar.has(o)&&o.isMesh){mats.push([o,o.material]);o.material=white;}else{vis.push([o,o.visible]);o.visible=false;}}});
 const bg=sc.background,fg=sc.fog;sc.background=null;sc.fog=null;r.setRenderTarget(null);r.setClearColor(0,1);r.clear();r.render(sc,cam);const M=read();
 sc.background=bg;sc.fog=fg;vis.forEach(([o,v])=>o.visible=v);mats.forEach(([o,m])=>o.material=m);
 const L=(a,i)=>.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];const m=new Uint8Array(W*H);let n=0;for(let i=0;i<W*H;i++)if(M[i*4]>128){m[i]=1;n++;}
 const R=Math.round(W/60);let sc_=0,sr=0,nr=0;const ring=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!m[i])continue;sc_+=L(A,i*4);for(const[dx,dy]of[[R,0],[-R,0],[0,R],[0,-R],[R,R],[-R,-R],[R,-R],[-R,R]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(!m[j]&&!ring[j]){ring[j]=1;sr+=L(A,j*4);nr++;}}}
 let eb=0,ne=0;const D=Math.max(2,Math.round(W/200));for(let y=D;y<H-D;y++)for(let x=D;x<W-D;x++){const i=y*W+x;if(!m[i])continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const o=(y+dy*D)*W+(x+dx*D);if(m[o])continue;const ii=(y-dy*D)*W+(x-dx*D);if(!m[ii])continue;eb+=Math.abs(L(A,ii*4)-L(A,o*4));ne++;break;}}
 const lc=n?sc_/n:0,lr=nr?sr/nr:0;return {pix:n,perso:+lc.toFixed(1),entourage:+lr.toFixed(1),contraste:+((Math.max(lc,lr)+12)/(Math.min(lc,lr)+12)).toFixed(2),bord:+(ne?eb/ne:0).toFixed(1)};}"""
async def one(b,out,lvl,tag,kind,F):
    pg=await b.new_page(viewport={'width':int(os.environ.get('VW',390)),'height':int(os.environ.get('VH',780))})
    await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
    await pg.goto(VD_URL,timeout=180000);await pg.wait_for_timeout(1500)
    await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
    for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
    await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
    await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
    if kind=='explo':
        await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}");await pg.wait_for_timeout(4000)
    else:
        await pg.evaluate("()=>{const e=VD.E.find(e=>"+("e.boss" if kind=='boss' else "!e.boss")+");VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);}")
        await pg.wait_for_timeout(6000);await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;}");await pg.wait_for_timeout(5000)
    for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
    await pg.screenshot(path=os.path.join(out,tag+'.png'))
    try:
        await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;}")
        LISV[tag]=await pg.evaluate(LIS.replace('new THREE_BASIC()','new (G3._d().THREE.MeshBasicMaterial)({color:0xffffff})'))
    except Exception as e: LISV[tag]={'erreur':str(e)[:200]}
    await pg.close()
LISV={}
async def main():
    out=sys.argv[1];lvl=int(sys.argv[2]) if len(sys.argv)>2 else 1;os.makedirs(out,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for tag,kind,F in SCN:
            await one(b,out,lvl,tag,kind,F);print('capture',tag,flush=True)
        await b.close()
    import json;json.dump(LISV,open(os.path.join(out,'lisibilite.json'),'w'),ensure_ascii=False,indent=1)
    for k,v in LISV.items(): print(f'{k:10s}',v)
asyncio.run(main())
