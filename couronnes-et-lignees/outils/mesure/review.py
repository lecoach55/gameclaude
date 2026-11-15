import sys,os
HTML='file://'+os.path.abspath(sys.argv[1] if len(sys.argv)>1 and sys.argv[1].endswith('.html') else 'index.html')
from playwright.sync_api import sync_playwright
import sys, time, os
os.makedirs('/tmp/revue',exist_ok=True)
RM = 'rm' in sys.argv
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce' if RM else 'no-preference')
    pg=ctx.new_page(); errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pre='rm_' if RM else ''
    def shot(n): pg.screenshot(path=f'/tmp/revue/{pre}{n}.png')
    def drain(limit=12, cap=None):
        for i in range(limit):
            v=pg.locator('.veil')
            if not v.count(): return
            if cap and i==0: pg.wait_for_timeout(700); shot(cap)
            btn=pg.locator('.veil .choice:not([aria-disabled=true]), .veil .btn').first
            if btn.count(): btn.click()
            else: pg.mouse.click(195,80)
            pg.wait_for_timeout(700)
    pg.goto(HTML);pg.wait_for_timeout(600)
    pg.evaluate("localStorage.clear();localStorage.setItem('cl_guide','1')"); pg.reload(); pg.wait_for_timeout(600)
    shot('00_title')
    pg.get_by_text('Fonder la maison').click(); pg.wait_for_timeout(1500); shot('01_plateau')
    pg.evaluate("catSheet('guerre')"); pg.wait_for_timeout(600); shot('02_cat_guerre'); pg.evaluate("closeM()"); pg.wait_for_timeout(300)
    pg.evaluate("catSheet('gouv')"); pg.wait_for_timeout(600); shot('03_cat_gouv'); pg.evaluate("closeM()"); pg.wait_for_timeout(300)
    i=pg.evaluate("D.borderTargets(S)[0].i"); pg.evaluate(f"tapRegion({i})"); pg.wait_for_timeout(600); shot('04_region'); pg.evaluate("closeM()"); pg.wait_for_timeout(300)
    pg.evaluate("S.army=90;S.gold=150;render()")
    t0=time.time(); pg.evaluate(f"turn('campagne',{i})"); pg.wait_for_timeout(1800); shot('05_battle'); drain(cap='06_after_battle')
    for k in range(5):
        pg.evaluate("turn('attendre')"); pg.wait_for_timeout(1500); drain(cap=f'07_turn{k}')
    shot('08_plateau_later')
    pg.evaluate("who(D.ruler(S).id)"); pg.wait_for_timeout(600); shot('09_fiche'); pg.evaluate("closeM()")
    pg.evaluate("rivalSheet()"); pg.wait_for_timeout(600); shot('10_rival'); pg.evaluate("closeM()")
    pg.evaluate("marryMenu((D.unmarriedAdults(S)[0]||D.ruler(S)).id)"); pg.wait_for_timeout(700); shot('11_marche'); pg.evaluate("closeM()")
    for t in ['cour','lignee','chronique','labo']:
        pg.evaluate(f"setTab('{t}')"); pg.wait_for_timeout(700); shot(f'12_{t}')
        pg.evaluate("window.scrollTo(0,900)"); pg.wait_for_timeout(300); shot(f'12_{t}_b')
    pg.evaluate("setTab('plateau')"); pg.wait_for_timeout(500)
    n=pg.evaluate("()=>{let n=0;while(!S.over&&n<200){D.playTurn(S,'attendre');if(S.event)D.resolveEvent(S,0);n++}return n}")
    pg.evaluate("render();showEnd()"); pg.wait_for_timeout(1500); shot('13_end')
    pg.evaluate("document.querySelector('.sheet')&&(document.querySelector('.sheet').scrollTop=700)"); pg.wait_for_timeout(300); shot('13_end_b')
    # perf: render time
    ms=pg.evaluate("()=>{setTab('plateau');const t=performance.now();for(let i=0;i<10;i++)render();return (performance.now()-t)/10}")
    print('render ms',round(ms,1),'errors',errs[:3])
    b.close()
