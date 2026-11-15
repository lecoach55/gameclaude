# Teste la sauvegarde en ligne avec une fausse base (window.claude.use simulé) : écriture, course, relecture sur un « autre appareil »
from playwright.sync_api import sync_playwright
MOCK="""window.__docs=window.__docs||{};window.claude={use:async n=>{if(n==='user')return{id:async()=>'u1'};if(n==='db')return{collection:c=>({doc:d=>({
 set:async o=>{await new Promise(r=>setTimeout(r,30));const k=c+'/'+d;localStorage.setItem('__db'+k,JSON.stringify(o));},
 get:async()=>{const v=localStorage.getItem('__db'+c+'/'+d);return v?{exists:true,data:()=>JSON.parse(v)}:{exists:false};}})})};return null;}};"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':771,'height':755})
    ctx.add_init_script(MOCK+"localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0');")
    pg=ctx.new_page();err=[];pg.on('pageerror',lambda e:err.append(str(e)))
    pg.goto('file:///home/claude/bourse6.html');pg.wait_for_timeout(800);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("window.__wst.step(60)");pg.evaluate("document.querySelectorAll('.modal').forEach(m=>m.hidden=true)")
    # plusieurs envois simultanés (la course qui donnait « Cannot read properties of null »)
    pg.evaluate("(()=>{const C=window.__wst.CLOUD;C.push(true);C.push(true);C.push(true);})()");pg.wait_for_timeout(3000)
    st=pg.evaluate("({ok:window.__wst.CLOUD.ok,err:window.__wst.CLOUD.err,day:window.__wst.G.day})");print('envoi',st)
    # « autre appareil » : on efface la partie locale et on recharge
    pg.evaluate("localStorage.removeItem('wallst-sim-v3')");pg.reload();pg.wait_for_timeout(2500)
    box=pg.evaluate("document.getElementById('sCloud').innerText");print('offre',box[:120])
    pg.click('#cLoad');pg.wait_for_timeout(1500)
    print('reprise',pg.evaluate("window.__wst.G.day"),'erreurs',err)
    # autre cas : on ignore l'offre et on commence une nouvelle partie -> la partie en ligne ne doit pas être écrasée tout de suite
    pg.evaluate("localStorage.removeItem('wallst-sim-v3')");pg.reload();pg.wait_for_timeout(2500);pg.click('#sGo');pg.wait_for_timeout(300)
    pg.evaluate("window.__wst.step(5)");pg.evaluate("window.__wst.CLOUD.push(true)");pg.wait_for_timeout(1500)
    print('partie en ligne intacte',pg.evaluate("JSON.parse(localStorage.getItem('__dbdata/users/u1/partie')).day"))
    b.close()
