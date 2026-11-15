from playwright.sync_api import sync_playwright
U='file:///home/claude/gameclaude/couronnes-et-complots/jeu/couronnes-et-complots.html'
def run(pg,tag):
    pg.goto(U); pg.wait_for_timeout(500)
    pg.select_option('#np','4'); pg.click('#go'); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'e_{tag}_1debut.png')
    pg.evaluate("()=>{const o=document.createElement('option');o.value='0';$('speed').appendChild(o);$('speed').value='0';S.players[0].ai=true;S.players[0].lvl='ruse';if(!S.busy)aiTurn();}")
    for _ in range(200):
        pg.wait_for_timeout(250)
        if pg.evaluate("()=>S.round>=9||S.over"): break
    pg.evaluate("()=>{$('speed').value='320'}"); pg.wait_for_timeout(1800)
    pg.screenshot(path=f'e_{tag}_2milieu.png')
    pg.evaluate("()=>{S.claim={o:S.cur,round:S.round};render()}"); pg.wait_for_timeout(400)
    pg.screenshot(path=f'e_{tag}_3sacre.png')
    pg.evaluate("()=>{S.claim=null;victory(alive()[0],'militaire','Capture de contrôle.')}"); pg.wait_for_timeout(600)
    pg.screenshot(path=f'e_{tag}_4fin.png')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    errs=[]
    for tag,(w,h) in {'L':(1440,860),'M':(1180,720),'S':(390,844)}.items():
        pg=b.new_page(viewport={'width':w,'height':h}); pg.on('pageerror',lambda e: errs.append(str(e)))
        run(pg,tag); pg.close()
    pg=b.new_page(viewport={'width':1440,'height':860}); cdp=pg.context.new_cdp_session(pg)
    cdp.send('Emulation.setEmulatedVisionDeficiency',{'type':'deuteranopia'}); run(pg,'D')
    print(errs); b.close()
