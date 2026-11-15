import asyncio,sys
sys.path.insert(0,'/home/claude/t3d')
import studio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    ctx=await b.new_context(viewport={'width':390,'height':780})
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
    await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
    await pg.evaluate("()=>localStorage.removeItem('valdragon_tb_v1')")
    await studio.start(pg)
    await pg.evaluate("()=>{VD.P.gold=777;VD.startFloor(3);}")
    await pg.evaluate("()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));}")
    s=await pg.evaluate("()=>{const d=JSON.parse(localStorage.getItem('valdragon_tb_v1'));return d&&[d.P.gold,d.P.floor]}")
    print('saved on hide:',s)
    pg2=await ctx.new_page();await pg2.goto('http://localhost:8765/index_local.html',timeout=180000);await pg2.wait_for_timeout(2500)
    print('continue:',await pg2.evaluate("()=>{const b=document.getElementById('ct');return b&&b.textContent}"))
    print(errs);await b.close()
asyncio.run(main())
