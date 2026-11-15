import collections,sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':800})
    pg.add_init_script("localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0')")
    pg.goto('file:///home/claude/'+sys.argv[1]);pg.wait_for_timeout(600);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("window.__wst.step(30)");[pg.evaluate("window.__wst.step(1)") for i in range(12)];pg.evaluate("window.__wst.step(21)");pg.evaluate("document.querySelectorAll('.modal').forEach(m=>m.hidden=true)");pg.evaluate("window.__wst.kitBench()");pg.wait_for_timeout(34000);pg.evaluate("document.querySelectorAll('.modal').forEach(m=>m.hidden=true)");pg.wait_for_timeout(1000)
    cdp=pg.context.new_cdp_session(pg);cdp.send('Profiler.enable');cdp.send('Profiler.start')
    f=pg.evaluate("new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(n/3)};requestAnimationFrame(f);})")
    prof=cdp.send('Profiler.stop')['profile'];nodes={n['id']:n for n in prof['nodes']};c=collections.Counter()
    for s,d in zip(prof['samples'],prof['timeDeltas']):
        n=nodes[s]['callFrame'];c[(n['functionName'] or '(anon)')+':'+str(n['lineNumber'])]+=d/1000
    print('fps',f,pg.evaluate("localStorage.getItem('wallst-derniere-mesure')")[-700:]);[print(f'{v:7.0f} {k}') for k,v in c.most_common(8)]
    b.close()
