import asyncio
from playwright.async_api import async_playwright
CLICK="(async()=>{for(let k=0;k<40;k++){await new Promise(r=>setTimeout(r,40));if(!UI.modalOpen)continue;const c=document.querySelector('#mbox .choice')||document.querySelector('#rsBtn')||document.querySelector('#mbox .btn.pri');if(c)c.click();}})()"
SETUP="""S.div=6;S.maxDiv=6;S.sasp=true;S.statut='SASP';S.ownership=60;Object.assign(S.infra,{stade:6,eclairage:3,pelouse:2,entrainement:3,formation:3,commerce:3,loges:2});S.invested=40e6;S.fans=45000;S.rep=65;S.cash=30e6;
S.players.forEach(p=>{p.ovr=clamp(p.ovr+33+ri(-3,3),40,90);p.pot=Math.max(p.pot,p.ovr);p.wage=wageFor(p.ovr);});
Object.values(S.staff).forEach(s=>{if(s){s.lvl=4;s.salary=staffSalary(4);}});S.ticket=LV[6].tick;S.euroNext='ldc';S.lastStr=strength().ovr;setupSeason();S.objective='montee';
S.ultras={name:'Kop Clichy 2019',rel:68,size:2400,since:2027,sec:0};S.reserve={since:2026,W:4,D:2,L:3,GF:0,GA:0};S.flags.fem=true;S.femT={W:5,D:1,L:2};
S.legends=[{id:999,n:'Karim Benali',pos:'A',num:9,seasons:8,apps:231,goals:97,y:2031,how:'Retraite',retired:true,tribune:true,jubile:false,ret:true},{id:998,n:'Julien Morel',pos:'D',num:4,seasons:7,apps:188,goals:6,y:2032,how:'Transfert',retired:false,tribune:false,jubile:false,ret:false}];
S.investor={k:'fonds',n:'Fonds d’investissement américain',dem:'europe',strikes:0,since:2031,top:12e6};render();"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1280,'height':900});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(400)
        await pg.evaluate("A.create()");await pg.evaluate(CLICK);await pg.wait_for_timeout(1500)
        await pg.evaluate(SETUP);await pg.wait_for_timeout(200)
        await pg.evaluate("A.tab('finances')");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/fin_abo.png')
        for i in range(9):
            await pg.evaluate(CLICK);await pg.evaluate("S.autoReport=true;A.play()");await pg.wait_for_timeout(250)
        await pg.evaluate(CLICK);await pg.wait_for_timeout(1800)
        await pg.evaluate("A.tab('finances')");await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('.bmeter').scrollIntoView({block:'center'})")
        await pg.screenshot(path='/home/claude/shots6/fin_budget.png')
        await pg.evaluate("A.tab('coupe')");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/coupe.png',full_page=True)
        await pg.evaluate("A.tab('calendrier')");await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('tr.eur').scrollIntoView({block:'center'})")
        await pg.screenshot(path='/home/claude/shots6/cal.png')
        await pg.evaluate("A.tab('club')");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/club.png',full_page=True)
        await pg.evaluate("A.tab('accueil')");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/accueil.png',full_page=True)
        # rapport européen
        await pg.evaluate("S.autoReport=false;S.euro.lpw[S.euro.md]=S.week+1;A.play()");await pg.wait_for_timeout(400)
        await pg.evaluate(CLICK);await pg.wait_for_timeout(1200)
        await pg.screenshot(path='/home/claude/shots6/rep_euro.png')
        await pg.evaluate("if(UI.rep)repFinish();A.close()");await pg.wait_for_timeout(600)
        await pg.evaluate("A.close()");await pg.wait_for_timeout(300)
        # comparateur
        await pg.evaluate("A.tab('mercato')");await pg.wait_for_timeout(300)
        await pg.evaluate("UI.cmp=[S.players[0].id,S.market[0].id,S.market[1].id];cmpBar();A.cmpShow()");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/cmp.png')
        await pg.evaluate("A.close()");await pg.wait_for_timeout(300)
        # presse
        await pg.evaluate("UI.queue.push({type:'event',id:'presse_conf',d:{c:'crise'}});nextQueue()");await pg.wait_for_timeout(300)
        await pg.screenshot(path='/home/claude/shots6/presse.png')
        await pg.evaluate("A.evChoice(0)");await pg.wait_for_timeout(200);await pg.evaluate("A.close()");await pg.wait_for_timeout(300)
        # fin de saison
        await pg.evaluate("while(S.week<S.N){S.autoReport=true;UI.queue=[];UI.modalOpen=false;A.play();UI.queue=UI.queue.filter(q=>q.type==='seasonEnd');document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;}");await pg.wait_for_timeout(300)
        await pg.evaluate("UI.queue=[];UI.modalOpen=false;showSeasonEnd()");await pg.wait_for_timeout(900)
        await pg.screenshot(path='/home/claude/shots6/fin_saison.png',full_page=True)
        el=await pg.query_selector('#mbox');await el.screenshot(path='/home/claude/shots6/fin_saison_box.png')
        await pg.evaluate("A.toMenu()");await pg.wait_for_timeout(400)
        await pg.screenshot(path='/home/claude/shots6/start.png')
        print(errs)
        # mobile
        m=await b.new_page(viewport={'width':390,'height':844});m.on('pageerror',lambda e:errs.append(str(e)))
        await m.goto('file:///home/claude/president/index.html');await m.wait_for_timeout(400)
        await m.evaluate("A.loadSlot(+localStorage.getItem('president-club-slot'))");await m.wait_for_timeout(300)
        await m.evaluate("UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;A.newSeason()");await m.wait_for_timeout(500)
        await m.evaluate(CLICK);await m.wait_for_timeout(800)
        await m.evaluate("S.autoReport=false;A.play()");await m.wait_for_timeout(300)
        await m.evaluate(CLICK);await m.wait_for_timeout(1500)
        await m.screenshot(path='/home/claude/shots6/m_live.png')
        print(errs)
        await b.close()
asyncio.run(main())
