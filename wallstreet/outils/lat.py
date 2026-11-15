import sys,json
from playwright.sync_api import sync_playwright
f=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':771,'height':755},device_scale_factor=2)
    pg.add_init_script("localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0')")
    pg.goto('file:///home/claude/'+f);pg.wait_for_timeout(600);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{for(let i=0;i<20;i++){window.__wst.step(21);document.querySelectorAll('.modal').forEach(m=>m.hidden=true);}})()")
    cdp=pg.context.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
    out={}
    for tab in ['cote','portef','rivaux','missions']:
        pg.evaluate(f"document.querySelector('.tab[data-tab={tab}]').click()");pg.wait_for_timeout(500)
        r=pg.evaluate("""async()=>{const a=[],js=[];for(let i=0;i<8;i++){const t0=performance.now();window.__wst.step(1);document.querySelectorAll('.modal').forEach(m=>m.hidden=true);document.getElementById('recapCard').hidden=true;const t1=performance.now();await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));a.push(performance.now()-t0);js.push(t1-t0);await new Promise(r=>setTimeout(r,150));}
          a.sort((x,y)=>x-y);js.sort((x,y)=>x-y);return {total_median:Math.round(a[4]),js_median:Math.round(js[4])};}""")
        out[tab]=r
    print(f,json.dumps(out))
    b.close()
