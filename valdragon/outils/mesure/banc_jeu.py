# Joue le banc 🧪 du jeu (runBench) en entier dans Chrome logiciel et relève erreurs + boucle morte
import asyncio,json,sys,os
from playwright.async_api import async_playwright
URL=os.environ.get('VD_URL','http://localhost:8765/index_local.html')
SC=os.environ.get('SC')  # ex: [["combat",6],["boss",8]]
LV=os.environ.get('LV','[0,1]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':771,'height':755},device_scale_factor=1)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]));pg.on('console',lambda m:m.type=='error' and errs.append('console: '+m.text[:300]))
        await pg.add_init_script(f"window.__LV={LV};"+(f"window.__SC={SC};" if SC else ""))
        await pg.goto(URL,timeout=180000);await pg.wait_for_timeout(2000)
        await pg.click('#tst');await pg.wait_for_function("window.VD&&VD.P",timeout=90000);await pg.wait_for_timeout(2000)
        await pg.click('#tbench')
        for i in range(400):
            await pg.wait_for_timeout(3000)
            t=await pg.evaluate("()=>document.getElementById('tbench').textContent")
            if i%10==0: print(t,flush=True)
            if t=='▶ Banc': break
        r=await pg.evaluate("()=>JSON.parse(localStorage.getItem('valdragon_mesures'))")
        for x in r['res']: print(json.dumps(x,ensure_ascii=False))
        print('ERREURS',errs)
        await b.close()
asyncio.run(main())
