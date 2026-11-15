import asyncio,sys,json
from playwright.async_api import async_playwright
MIN=float(sys.argv[1]) if len(sys.argv)>1 else 5
async def run(b,idx,render,F0=1):
    ctx=await b.new_context(viewport={'width':390,'height':780})
    if not render: await ctx.add_init_script("(()=>{const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t*3));})()")
    pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGE:'+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CON:'+m.text[:200]) if m.type=='error' and '404' not in m.text else None)
    await pg.goto('http://localhost:8765/index_local.html');await pg.wait_for_timeout(1500)
    if not render: await pg.evaluate("()=>{G3.render=()=>{};}")
    await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P",timeout=60000)
    if F0>1:
        await pg.wait_for_timeout(2500)
        await pg.evaluate(f"()=>{{const P=VD.P;P.story.push('prologue','biome0','biome1','biome2','biome3');P.lvl={F0}+2;P.spts=0;P.heroes.forEach(h=>{{h.lvl={F0}+2;h.spts=0;}});P.pot.soin=8;P.pot.phenix=3;P.gold=800;VD.calcAll();P.heroes.forEach(h=>{{h.hp=h.s.mhp;h.en=h.s.men;}});VD.startFloor({F0});}}")
    await pg.add_script_tag(path='agent.js')
    t=0
    while t<MIN*60:
        await pg.wait_for_timeout(15000);t+=15
        if int(t)%90==0: await pg.screenshot(path=f'bot{idx}_{int(t)}.png')
    st=await pg.evaluate("()=>({bugs:__bugs,F:VD.F,lvl:VD.P.lvl,wins:__stats.wins,loses:__stats.loses,shops:__stats.shops,floors:[...__stats.floors],gold:VD.P.gold,bag:VD.P.bag.length})")
    await pg.screenshot(path=f'bot{idx}_end.png')
    print('=== bot',idx,'render' if render else 'norender',json.dumps({k:v for k,v in st.items() if k!='bugs'}))
    for bg in st['bugs']: print('  BUG',bg)
    for e in errs[:12]: print('  ',e)
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        await asyncio.gather(run(b,0,False,1),run(b,1,False,6),run(b,2,False,12),run(b,3,False,14))
        await b.close()
asyncio.run(main())
