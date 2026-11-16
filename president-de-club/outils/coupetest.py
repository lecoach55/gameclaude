import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for mob in (False,True):
        ctx=b.new_context(**(p.devices['iPhone 13'] if mob else {'viewport':{'width':1280,'height':900}}))
        pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+(sys.argv[1] if len(sys.argv)>1 else '/home/claude/president/index.html'));pg.wait_for_timeout(500)
        pg.evaluate("document.getElementById('cTown').value='Clichy';A.create();tkClear();")
        # vrais matchs de coupe forcés gagnants jusqu'aux 16es
        pg.evaluate("""for(let k=0;k<7;k++){const s0=strength;strength=()=>{const x=s0();x.att+=40;x.def+=40;x.ovr+=40;return x;};playCup();strength=s0;if(S.cup.out)break;}S.week=12;tkClear();A.tab('coupe')""")
        pg.wait_for_timeout(300);pg.screenshot(path='/home/claude/president/shots/coupe'+('_m' if mob else '_d')+'.png',full_page=True)
        print(pg.evaluate("JSON.stringify(S.cup.log.map(l=>[l.r,l.win,l.prime,l.poucet,l.exploit]))"),errs[:3])
    b.close()
