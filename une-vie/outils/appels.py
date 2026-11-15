# Répartition des maillages visibles par groupe (≈ appels de dessin). python3 appels.py [sd|hd] [scenes]
import sys,asyncio
from playwright.async_api import async_playwright
from scenes import ouvrir,scene
J="""()=>{const R=W3._dbg();const out={};R.SC.children.forEach((g,i)=>{let n=0;g.traverseVisible(o=>{if(o.isMesh||o.isPoints||o.isSprite||o.isLine)n++});out[(g.name||g.type)+i]=n});
let pc={};(R.chars||[]).forEach(c=>{let n=0;c.g.traverseVisible(o=>{if(o.isMesh)n++});pc[c.kind||'c']=(pc[c.kind||'c']||0)+n});out.parPerso=pc;return out}"""
async def main():
    q=sys.argv[1] if len(sys.argv)>1 else 'sd';ns=(sys.argv[2] if len(sys.argv)>2 else 'villa4,rural0').split(',')
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,qualite=q)
        for n in ns:
            await scene(pg,n,2500);print(n,await pg.evaluate("()=>W3.info().calls"),await pg.evaluate(J))
        await nav.close()
asyncio.run(main())
