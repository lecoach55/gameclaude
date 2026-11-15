import asyncio,base64,json,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for f in sys.argv[1:]:
      pg=await b.new_page();pg.on('pageerror',lambda e:print('E',e))
      await pg.goto(f'http://localhost:8765/mxbuild.html?d={f}&ts=768');await pg.wait_for_function("document.title==='done'",timeout=300000)
      print(f,json.dumps(await pg.evaluate("INFO")))
      open(f'/home/claude/assets/mx/{f}.glb','wb').write(base64.b64decode(await pg.evaluate("GLB")));await pg.close()
    await b.close()
asyncio.run(main())
