import sys,json,time
from playwright.sync_api import sync_playwright
f=sys.argv[1];mob=len(sys.argv)>2
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(**(p.devices['iPhone 13'] if mob else {'viewport':{'width':1280,'height':900}}))
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+f);pg.wait_for_timeout(800)
    # partie réelle préalable
    pg.evaluate("document.getElementById('cTown').value='Lens';A.create()");pg.wait_for_timeout(500)
    pg.evaluate("tkClear&&tkClear()")
    before=pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k).length]))")
    savebefore=pg.evaluate("localStorage.getItem(KEY)")
    pg.evaluate("S=null;renderStart()");pg.wait_for_timeout(300)
    pg.screenshot(path=f'/home/claude/president/shots/start{"_m" if mob else ""}.png')
    pg.evaluate("A.modeTest()")
    t0=time.time()
    pg.wait_for_function("TEST.last",timeout=120000)
    print('banc en',round(time.time()-t0),'s')
    pg.screenshot(path=f'/home/claude/president/shots/banc{"_m" if mob else ""}.png')
    out=pg.evaluate("TEST.last");print(json.dumps(out['res'],ensure_ascii=False)[:1500]);print('base',out['base'],out['enregistre'])
    pg.evaluate("A.quitTest()");pg.wait_for_timeout(300)
    after=pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k).length]))")
    print('stockage :',set(eval(after.replace("null","None")) if False else [])) if False else None
    import json as J;A_=dict(map(tuple,J.loads(after)));B_=dict(map(tuple,J.loads(before)));print("clés modifiées",[k for k in set(A_)|set(B_) if A_.get(k)!=B_.get(k)]);print('sauvegarde identique', pg.evaluate("localStorage.getItem('president-club-save-v1')")==savebefore)
    # 🐞 en partie
    pg.evaluate("A.loadSlot(1)");pg.wait_for_timeout(500);pg.evaluate("tkClear()")
    pg.click('button[title="Signaler un problème à Claude"]');pg.wait_for_timeout(11500)
    pg.screenshot(path=f'/home/claude/president/shots/bug{"_m" if mob else ""}.png')
    import base64;cap=pg.evaluate('TK.dernier.capture');open('/home/claude/president/shots/capture.jpg','wb').write(base64.b64decode(cap.split(',')[1])) if cap else None
    d=pg.evaluate("TK.dernier&&{cap:TK.dernier.capture.length,etat:Object.keys(TK.dernier.etat)}");print('signalement',d)
    print('erreurs',errs[:5])
    b.close()
