import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await b.new_page(viewport={'width':390,'height':800},device_scale_factor=2);err=[];pg.on('pageerror',lambda e:err.append(str(e)))
    await pg.add_init_script("localStorage.setItem('wallst-tuto','1')")
    await pg.goto('file:///home/claude/bourse6.html');await pg.wait_for_timeout(600);await pg.click('#sGo');await pg.wait_for_timeout(500)
    await pg.screenshot(path='mtop.png',clip={'x':0,'y':0,'width':390,'height':140})
    await pg.click('#bMenu');await pg.wait_for_timeout(300);print(await pg.evaluate("document.getElementById('mStart').hidden"),err)
    await b.close()
asyncio.run(main())
