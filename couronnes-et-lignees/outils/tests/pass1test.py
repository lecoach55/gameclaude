import sys,os
HTML='file://'+os.path.abspath(sys.argv[1] if len(sys.argv)>1 and sys.argv[1].endswith('.html') else 'index.html')
from playwright.sync_api import sync_playwright
import subprocess
ANC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'anciennes')
olds={v:subprocess.check_output(['node','-e',"const D=require(process.argv[1]);const s=D.createGame(11);for(let i=0;i<8;i++){D.playTurn(s,'attendre');if(s.event)D.resolveEvent(s,0);}console.log(JSON.stringify(s))",os.path.join(ANC,'engine_'+v+'.js')]).decode() for v in ['v10','v13','v14']}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(HTML);pg.wait_for_timeout(600)
    pg.evaluate("localStorage.clear();newGame();render()");pg.wait_for_timeout(400)
    # full game via engine actions through the UI path
    r=pg.evaluate("""()=>{let n=0;while(!S.over&&n<200){const a=D.getActions(S).filter(x=>x.ok&&x.id!=='marier'&&x.id!=='campagne'&&x.id!=='vassaliser');const id=a.find(x=>x.id==='intrigue')&&n%5==0?'intrigue':a[n%a.length].id;D.playTurn(S,id);if(S.event)D.resolveEvent(S,n%2);n++;}render();return [n,S.over,S.year,D.score?D.score(S):0]}""")
    pg.wait_for_timeout(800);pg.screenshot(path='p1_end.png')
    print('partie',r)
    for t in ['cour','lignee','chronique','labo','plateau']:
        pg.evaluate(f"typeof tab==='function'?tab('{t}'):0");pg.wait_for_timeout(250)
    pg.screenshot(path='p1_labo.png')
    for v,o in olds.items():
        q=b.new_page(viewport={'width':390,'height':844});e=[];q.on('pageerror',lambda x:e.append(str(x)))
        q.goto(HTML);q.wait_for_timeout(300)
        q.evaluate("s=>{localStorage.clear();localStorage.setItem('cl_save4',s)}",o);q.reload();q.wait_for_timeout(700)
        ok=q.evaluate("()=>{for(let i=0;i<10&&!S.over;i++){D.playTurn(S,'intrigue');if(S.event)D.resolveEvent(S,0);}render();return S.year}")
        print(v,'ok',ok,e[:2])
    print('erreurs',errs[:3]); b.close()
