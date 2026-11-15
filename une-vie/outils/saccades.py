# Sonde des saccades : durée de chaque image (CPU), et ce qui change au même moment (shaders, textures, géométries).
# python3 saccades.py [sd|hd] [scene] [secondes]
import sys,asyncio,json
from playwright.async_api import async_playwright
from scenes import ouvrir,scene
SONDE="""()=>{window.__f=[];const o=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>o(t=>{const a=performance.now();cb(t);const d=performance.now()-a;if(d>4){const i=W3.info()||{};window.__f.push([+(a/1000).toFixed(2),+d.toFixed(1),i.progs,i.tex,i.geos])}});}"""
async def main():
    q=sys.argv[1] if len(sys.argv)>1 else 'sd';n=sys.argv[2] if len(sys.argv)>2 else 'villa4';s=float(sys.argv[3]) if len(sys.argv)>3 else 15
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,qualite=q)
        await pg.evaluate(SONDE);await scene(pg,n,2000)
        await pg.evaluate("()=>{window.__f=[]}")
        i0=await pg.evaluate("()=>W3.info()")
        await pg.wait_for_timeout(int(s*1000))
        f=await pg.evaluate("()=>window.__f");i1=await pg.evaluate("()=>W3.info()")
        await nav.close()
    d=sorted(x[1] for x in f);med=d[len(d)//2] if d else 0
    print(f"{n} {q}: images>4ms {len(f)}, médiane {med} ms, progs {i0['progs']}→{i1['progs']}, tex {i0['tex']}→{i1['tex']}, geos {i0['geos']}→{i1['geos']}")
    prev=None
    for x in f:
        if x[1]>med*2.2 or (prev and x[2:]!=prev[2:]):print('  ',x)
        prev=x
asyncio.run(main())
