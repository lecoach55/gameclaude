# Fuites mémoire sur une vie entière : géométries, textures, programmes, nœuds DOM tous les 10 choix. python3 fuites.py [sd|hd]
import asyncio, random, sys
from playwright.async_api import async_playwright
from scenes import ouvrir
async def main():
    random.seed(5);q=sys.argv[1] if len(sys.argv)>1 else 'sd'
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,qualite=q)
        rows=[]
        for i in range(400):
            txt=await pg.evaluate("""()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools')).map(b=>b.innerText)""")
            if any(("Vivre une autre vie" in t) or ("Une toute nouvelle vie" in t) for t in txt): break
            cand=[k for k,t in enumerate(txt) if "Accueil" not in t and "🧪" not in t]
            if not cand: await pg.wait_for_timeout(200);continue
            await pg.evaluate(f"()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools'))[{random.choice(cand)}].click()")
            await pg.wait_for_timeout(120)
            if i%10==0:
                r=await pg.evaluate("()=>{const i=W3.info()||{};return [S.age,i.geos,i.tex,i.progs,document.getElementsByTagName('*').length,performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0]}")
                rows.append(r);print('âge %s géos %s tex %s progs %s DOM %s tas %s Mo'%tuple(r))
        print('erreurs',pg.erreurs[:5]);await nav.close()
asyncio.run(main())
