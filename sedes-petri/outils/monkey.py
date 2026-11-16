import asyncio, sys, random, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../outils-communs'))
from atelier import serveur
from playwright.async_api import async_playwright
MOB = 'm' in sys.argv; N = int(sys.argv[1])
async def clear(pg):
    for k in range(40):
        if not await pg.is_visible('#modal'): return
        if await pg.query_selector('.dp.on'):
            await pg.click('[data-cdone]'); await pg.wait_for_timeout(250); continue
        done=False
        for sel in ['[data-pname]','[data-scrut]:not([disabled])','[data-back]:not([disabled])','[data-dec]','[data-opt]:not([disabled])','[data-cont]','[data-close]']:
            els = [e for e in await pg.query_selector_all(sel) if await e.is_visible()]
            if els:
                await random.choice(els).click(); await pg.wait_for_timeout(9500 if 'scrut' in sel else 250); done=True; break
        if not done: await pg.wait_for_timeout(400)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        vp = {'width':390,'height':844} if MOB else {'width':1400,'height':860}
        pg = await b.new_page(viewport=vp, has_touch=MOB, is_mobile=MOB)
        errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        serveur(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../jeu'), 8771); await pg.goto('http://localhost:8771/index.html'); await pg.wait_for_timeout(2500)
        await pg.click(f'[data-scen="{random.choice(["1073","1198","1294","1378"])}"]'); await pg.wait_for_timeout(200)
        await pg.click('#stStart'); await pg.wait_for_timeout(800)
        for t in range(N):
            await pg.evaluate("S.authority=Math.max(S.authority,25)")
            for k in range(6):
                tab = random.choice(['royaume','rome','curie','eglise','croisade','tresor','pontife','chronique'])
                await pg.evaluate(f"UI.tab='{tab}';renderPanel()")
                if tab=='royaume':
                    r = await pg.evaluate("pick(activeRealms())"); await pg.evaluate(f"selectRealm('{r}')")
                acts = await pg.query_selector_all('#tabBody .act:not(.dis)')
                acts = [a for a in acts if (await a.get_attribute('data-act')) not in ('abdiquer',None) and await a.is_visible()]
                if acts:
                    a = random.choice(acts)
                    try: await a.click(timeout=2000)
                    except Exception as ex: pass
                    await pg.wait_for_timeout(120)
                    await clear(pg)
            if random.random()<0.3:
                await pg.click(f'[data-mode="{random.choice(["relations","ferveur","heresie","investitures","religions","royaumes"])}"]')
            await pg.evaluate("UI.warned=true")
            try: await pg.click('#endTurn', timeout=5000)
            except Exception: pass
            # attendre la fin de saison (carte de saison #scard, UI.busy) avant de rejouer : sinon on touche des éléments recouverts
            calme=0
            for k in range(60):
                await pg.wait_for_timeout(300); await clear(pg)
                ok = await pg.evaluate("!(window.UI&&UI.busy) && !document.querySelector('#scard:not([hidden])') && document.getElementById('modal').hidden")
                calme = calme+1 if ok else 0
                if calme>=2: break
            if errs: print('turn',t, errs[-1]); 
        print('final', await pg.evaluate("dateStr()+' '+popeName()+' A'+Math.round(S.authority)"), 'errors:', len(errs))
        for e in errs[:10]: print(e)
        await pg.screenshot(path='/tmp/monkey_end.png')
        await b.close()
asyncio.run(main())
