# Écran étroit (volet 483×755 du MacBook de Victor, téléphone 390×844) : carte ajustée, départ zoomé, double appui, pincement
from playwright.sync_api import sync_playwright
U='file:///home/claude/gameclaude/couronnes-et-complots/jeu/couronnes-et-complots.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome'); errs=[]
    for nom,(w,h,touch) in {'volet':(483,755,False),'tel':(390,844,True)}.items():
        ctx=b.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch,device_scale_factor=2)
        pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto(U); pg.wait_for_timeout(600); pg.click('#go'); pg.wait_for_timeout(2500)
        pg.screenshot(path=f'/tmp/n_{nom}_debut.png')
        print(nom,'vue',pg.evaluate("()=>({w:Math.round(vb.w),x:Math.round(vb.x),y:Math.round(vb.y)})"), 'débordement horizontal', pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth"))
        if touch:
            box=pg.locator('#map').bounding_box(); cx,cy=box['x']+box['width']/2,box['y']+box['height']/2
            cdp=ctx.new_cdp_session(pg)
            def t(typ,pts): cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
            w0=pg.evaluate("()=>vb.w")
            t('touchStart',[(cx-30,cy),(cx+30,cy)])
            for k in range(1,11): t('touchMove',[(cx-30-k*8,cy),(cx+30+k*8,cy)]); pg.wait_for_timeout(16)
            t('touchEnd',[]); pg.wait_for_timeout(300)
            w1=pg.evaluate("()=>vb.w"); print('pincement : largeur vue',round(w0),'→',round(w1))
            for _ in range(2): t('touchStart',[(cx,cy)]); t('touchEnd',[]); pg.wait_for_timeout(120)
            pg.wait_for_timeout(300); print('double appui : largeur vue →',round(pg.evaluate("()=>vb.w")))
            pg.screenshot(path=f'/tmp/n_{nom}_geste.png')
        ctx.close()
    print('erreurs',errs); b.close()
