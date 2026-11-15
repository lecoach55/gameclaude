# Lance le testeur exhaustif (agent2.js) sur plusieurs tranches d'étages en parallèle, sans rendu (accéléré)
import asyncio,sys,json,time
from playwright.async_api import async_playwright
MIN=float(sys.argv[1]) if len(sys.argv)>1 else 8
STARTS=[int(x) for x in (sys.argv[2] if len(sys.argv)>2 else '1,5,9,13').split(',')]
async def run(b,idx,F0):
    ctx=await b.new_context(viewport={'width':390,'height':780})
    await ctx.add_init_script("(()=>{const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t*3));})()")
    pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGE:'+str(e)[:300]))
    pg.on('console',lambda m:errs.append('CON:'+m.text[:200]) if m.type=='error' and '404' not in m.text else None)
    await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
    await pg.evaluate("()=>{G3.render=()=>{};}")
    await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
    await pg.evaluate(f"()=>{{const P=VD.P;P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');if({F0}>1)VD.startFloor({F0});}}")
    await pg.add_script_tag(path='agent2.js')
    t0=time.time()
    while time.time()-t0<MIN*60:
        await pg.wait_for_timeout(20000)
        F=await pg.evaluate("()=>VD.F")
        snap=await pg.evaluate("()=>({F:VD.F,floors:__cov.floors,bugs:__bugs,battles:__cov.battles,errs:0})")
        snap['errs']=errs[:10];open(f'/tmp/expl_{F0}.json','w').write(json.dumps(snap,ensure_ascii=False))
        if F>=F0+4 or F>=17: break
    st=await pg.evaluate("()=>{const S=__cov;return{bugs:__bugs,F:VD.F,floors:S.floors,skills:S.skills,panels:[...S.panels],clicked:S.clicked.size,shops:S.shops,buys:S.buys,sells:S.sells,ups:S.ups,rot:S.rot,battles:S.battles,wins:S.wins,loses:S.loses,bosses:S.bosses,resp:S.respawnTested}}")
    print('=== tranche',F0,'-> étage',st['F'],'| combats',st['battles'],'victoires',st['wins'],'défaites',st['loses'],'boss',st['bosses'],'| marchand',st['shops'],'achats',st['buys'],'ventes',st['sells'],'forge',st['ups'],'| rotations',st['rot'],'| boutons de menu',st['clicked'],'onglets',st['panels'],'| respawn',st['resp'],flush=True)
    for f,v in st['floors'].items(): print('  étage',f,'couverture',v['visited'],'/',v['walk'],'objets',v['objs'],'marchand',v['merch'],'durée',v['t'],'s')
    print('  actions combat :',json.dumps(st['skills'],ensure_ascii=False))
    for bg in st['bugs']: print('  BUG',json.dumps(bg,ensure_ascii=False))
    for e in errs[:15]: print('  ERR',e)
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        await asyncio.gather(*[run(b,i,F0) for i,F0 in enumerate(STARTS)])
        await b.close()
asyncio.run(main())
