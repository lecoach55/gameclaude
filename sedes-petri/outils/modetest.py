# Test : lance le 🧪 Mode test (banc ~35 s), vérifie qu'aucune sauvegarde n'est écrite, puis le bouton 🐞.
import asyncio,sys
sys.path.insert(0,'/home/claude/gameclaude/outils-communs')
from atelier import serveur
from playwright.async_api import async_playwright
async def main():
    base=serveur('/home/claude/gameclaude/sedes-petri/jeu',8771)
    async with async_playwright() as p:
        nav=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await nav.new_page(viewport={'width':1400,'height':860}); err=[]; pg.on('pageerror',lambda e:err.append(str(e)))
        await pg.add_init_script("localStorage.setItem('sp_welcome','1')")
        await pg.goto(base+'index.html'); await pg.wait_for_function("!document.getElementById('start').hidden",timeout=120000)
        await pg.click('#stTest'); await pg.wait_for_timeout(40000)
        await pg.screenshot(path='/tmp/t9_banc.png')
        print(await pg.evaluate("document.querySelector('#modalBox').innerText.slice(0,400)"))
        print('save après test:', await pg.evaluate("localStorage.getItem('sedes_petri_save_v1')===null"))
        await pg.click('[data-new]'); await pg.wait_for_timeout(3000)
        await pg.click('#stStart'); await pg.wait_for_timeout(800); await pg.click('[data-bug]'); await pg.wait_for_timeout(1500)
        print('signalement local:', await pg.evaluate("Object.keys(localStorage).filter(k=>k.includes('signalement'))"))
        print(err); await nav.close()
asyncio.run(main())
