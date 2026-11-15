import json,sys,collections
from playwright.sync_api import sync_playwright
W=int(sys.argv[1]) if len(sys.argv)>1 else 390
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':W,'height':755},device_scale_factor=2);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0')")
    pg.goto('file:///home/claude/bourse6.html');pg.wait_for_timeout(600);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const W=window.__wst;for(let i=0;i<20;i++){W.step(21);document.querySelectorAll('.modal').forEach(m=>m.hidden=true);}})()")
    pg.evaluate("window.__wst.doTrade&&0")
    cdp=pg.context.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
    def run(js,label):
        cdp.send('Profiler.enable');cdp.send('Profiler.setSamplingInterval',{'interval':200});cdp.send('Profiler.start')
        t=pg.evaluate("(()=>{const t0=performance.now();"+js+";return performance.now()-t0;})()")
        prof=cdp.send('Profiler.stop')['profile']
        nodes={n['id']:n for n in prof['nodes']};self=collections.Counter()
        dt=prof['timeDeltas'];
        for s,d in zip(prof['samples'],dt):
            n=nodes[s]['callFrame'];self[(n['functionName'] or '(anon)')+':'+str(n['lineNumber'])]+=d/1000
        print(f'== {label}: {t:.0f} ms');[print(f'  {v:7.1f} ms  {k}') for k,v in self.most_common(22)]
    for tab in ['cote','rivaux']:
        pg.evaluate(f"document.querySelector('.tab[data-tab={tab}]').click()");pg.wait_for_timeout(300)
        run("for(let i=0;i<10;i++){window.__wst.step(1);document.getElementById('recapCard').hidden=true;document.querySelectorAll('.modal').forEach(m=>m.hidden=true);}",'10 séances onglet '+tab)
    print('day',pg.evaluate('window.__wst.G.day'),'erreurs',errs)
    b.close()
