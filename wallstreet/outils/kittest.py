import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(390,800)]:
      pg=await b.new_page(viewport={'width':w,'height':h});err=[];pg.on('pageerror',lambda e:err.append(str(e)))
      await pg.add_init_script("localStorage.setItem('wallst-tuto','1')");await pg.goto('file:///home/claude/bourse6.html');await pg.wait_for_timeout(800)
      await pg.click('#sGo');await pg.wait_for_timeout(300)
      await pg.evaluate("window.__wst.step(30)");await pg.wait_for_timeout(300)
      before=await pg.evaluate("JSON.stringify(window.__wst.G).length+':'+window.__wst.G.day+':'+Math.round(window.__wst.value())")

      after=await pg.evaluate("JSON.stringify(window.__wst.G).length+':'+window.__wst.G.day+':'+Math.round(window.__wst.value())")
      await pg.screenshot(path=f'kb{w}.png')
      mes=await pg.evaluate("localStorage.getItem('wallst-derniere-mesure')")
      await pg.evaluate("document.querySelector('#infoDlg [data-close]')&&document.querySelector('#infoDlg [data-close]').click()")
      await pg.evaluate("['mEvent','mInfo'].forEach(i=>document.getElementById(i).hidden=true)");await pg.click('#bMenu');await pg.screenshot(path='kmenu.png');await pg.click('#kBug');await pg.fill('#kBugT','test');await pg.click('#kBugGo');await pg.wait_for_timeout(500)
      await pg.screenshot(path=f'kc{w}.png')
      sig=await pg.evaluate("(localStorage.getItem('wallst-dernier-signalement')||'').length")
      print(w,before,after,'sig',sig,'err',err);print(mes)
    await b.close()
asyncio.run(main())
