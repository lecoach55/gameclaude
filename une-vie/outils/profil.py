# Profil CPU (CDP) d'une scène : temps propre par fonction. python3 profil.py [sd|hd] [scene] [secondes]
import sys,asyncio,collections
from playwright.async_api import async_playwright
from scenes import ouvrir,scene
async def main():
    q=sys.argv[1] if len(sys.argv)>1 else 'sd';n=sys.argv[2] if len(sys.argv)>2 else 'villa4';s=float(sys.argv[3]) if len(sys.argv)>3 else 6
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,qualite=q);await scene(pg,n,2000)
        c=await pg.context.new_cdp_session(pg);await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{'interval':200});await c.send('Profiler.start')
        await pg.wait_for_timeout(int(s*1000));pr=(await c.send('Profiler.stop'))['profile'];i=await pg.evaluate("()=>W3.info()");await nav.close()
    nodes={x['id']:x for x in pr['nodes']};cnt=collections.Counter(pr['samples']);tot=sum(cnt.values())
    self_=collections.Counter()
    for k,v in cnt.items():
        cf=nodes[k]['callFrame'];self_[(cf['functionName'] or '(anon)')+':'+str(cf['lineNumber'])+(' three' if 'three' in cf['url'] or cf['lineNumber']<10 and cf['url'] else '')]+=v
    print(n,q,'appels',i['calls'],'tri',i['tris'])
    for k,v in self_.most_common(25):print(f"{100*v/tot:5.1f}%  {k}")
asyncio.run(main())
