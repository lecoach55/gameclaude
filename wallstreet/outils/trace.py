import sys,json,collections
from playwright.sync_api import sync_playwright
f=sys.argv[1];tab=sys.argv[2] if len(sys.argv)>2 else 'cote'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':771,'height':755},device_scale_factor=2)
    pg.add_init_script("localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0')")
    pg.goto('file:///home/claude/'+f);pg.wait_for_timeout(600);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{for(let i=0;i<20;i++){window.__wst.step(21);document.querySelectorAll('.modal').forEach(m=>m.hidden=true);}})()")
    pg.evaluate(f"document.querySelector('.tab[data-tab={tab}]').click()");pg.wait_for_timeout(500)
    b.start_tracing(page=pg,path='/tmp/tr.json',categories=['devtools.timeline','disabled-by-default-devtools.timeline'])
    pg.evaluate("""async()=>{for(let i=0;i<6;i++){window.__wst.step(1);document.querySelectorAll('.modal').forEach(m=>m.hidden=true);await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));await new Promise(r=>setTimeout(r,100));}}""")
    b.stop_tracing()
    ev=json.load(open('/tmp/tr.json'));ev=ev['traceEvents'] if isinstance(ev,dict) else ev
    c=collections.Counter();n=collections.Counter()
    for e in ev:
        if e.get('ph')=='X' and e.get('dur'):
            c[e['name']]+=e['dur']/1000;n[e['name']]+=1
    for k,v in c.most_common(18):print(f'{v:8.1f} ms  x{n[k]:<4} {k}')
    b.close()
