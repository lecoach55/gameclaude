import asyncio,json
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){s.querySelector('.sskip').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return 1}return 0}"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx=await b.new_context(viewport={'width':390,'height':780});pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
        async def skip(n=6):
            for i in range(n):
                await pg.evaluate(SK);await pg.wait_for_timeout(500)
        async def state(tag):
            s=await pg.evaluate("()=>({tag:'',F:VD.F,B:!!VD.B,over:VD.B&&VD.B.over,story:document.getElementById('story').style.display,panel:document.getElementById('panel').style.display,desync:G3.mapRef!==VD.map,mode:G3.mode,party:VD.P.heroes.map(h=>h.dead?'D':Math.round(h.hp)).join('/'),pnc:document.getElementById('pnc').innerText.slice(0,60)})")
            s['tag']=tag;print(json.dumps(s,ensure_ascii=False))
        async def winBattle(maxs=90):
            for i in range(maxs):
                await pg.evaluate(SK)
                r=await pg.evaluate("""()=>{if(!VD.B)return 'nob';if(VD.B.over)return 'over:'+VD.B.over;VD.B.foes.forEach(f=>{if(!f.dead)f.hp=Math.min(f.hp,1);});
                  if(VD.B.wait==='hero'&&window.__ui.menu&&!__ui.sel){const b=document.querySelector('#bgrid .sk:not([disabled])');if(b)b.click();}
                  if(__ui.sel){const u=VD.B.foes.find(f=>!f.dead);if(u){const s=G3.screenOf(u);document.getElementById('cv').dispatchEvent(new PointerEvent('pointerdown',{clientX:s.x,clientY:(s.y+s.top)/2,bubbles:true}));}}return 'go'}""")
                if r!='go': return r
                await pg.wait_for_timeout(400)
            return 'timeout'
        await pg.goto('http://localhost:8765/index_local.html');await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{G3.render=()=>{};}")
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500);await skip()
        await state('start')
        # S1 boss F4
        await pg.evaluate("()=>{VD.P.lvl=6;VD.P.heroes.forEach(h=>h.lvl=6);VD.calcAll();VD.startFloor(4);}");await pg.wait_for_timeout(800);await skip()
        await pg.evaluate("()=>{const e=VD.E.find(e=>e.boss);VD.P.x=e.x;VD.P.y=e.y+1;}");await pg.wait_for_timeout(2500);await skip()
        await state('boss-start');print('win->',await winBattle());await pg.evaluate('()=>{G3.render=window.__r||G3.render}');await pg.wait_for_timeout(1500);await state('boss-after-win')
        for i in range(8):
            await skip(1);await pg.wait_for_timeout(600)
        await state('after-story')
        await pg.evaluate("()=>{const c=document.getElementById('cont');if(c)c.click();}");await pg.wait_for_timeout(1000);await state('after-cont')
        await pg.evaluate("()=>{VD.P.x=VD.stairs.x+.5;VD.P.y=VD.stairs.y+.5;}");await pg.wait_for_timeout(600)
        await pg.evaluate("()=>document.getElementById('ctx').click()");await pg.wait_for_timeout(1500);await skip();await state('descended')
        # S3 wipe
        await pg.evaluate("()=>{const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.5;}");await pg.wait_for_timeout(2500);await skip()
        await pg.evaluate("()=>{if(VD.B){VD.P.heroes.forEach(h=>{h.hp=1;});VD.B.foes.forEach(f=>{f.atk=999;});}}")
        for i in range(60):
            o=await pg.evaluate("()=>VD.B&&VD.B.over")
            if o: break
            await pg.evaluate("()=>{if(VD.B&&VD.B.wait==='hero'&&__ui.menu&&!__ui.sel){const b=document.querySelector('#bact [data-k=defend]');if(b)b.click();}}");await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(2500);await state('wiped')
        await pg.evaluate("()=>{const c=document.getElementById('rsp');if(c)c.click();}");await pg.wait_for_timeout(1500);await state('after-rsp')
        # S5 equip
        r=await pg.evaluate("""()=>{const P=VD.P;const h=P.heroes[0];const it=VD.mkItem?VD.mkItem(5,'arme','guerrier'):null;return typeof VD.mkItem+' '+(it&&it.n)}""");print('mkItem',r)
        await pg.evaluate("()=>document.getElementById('bBag').click()");await pg.wait_for_timeout(800)
        tabs=await pg.evaluate("()=>[...document.querySelectorAll('#panel button')].map(b=>b.textContent.trim().slice(0,18)+'|'+Object.keys(b.dataset).join(',')).slice(0,40)")
        print('panel buttons',tabs)
        await pg.screenshot(path='sc_panel.png')
        await pg.evaluate("()=>document.getElementById('xx').click()");await pg.wait_for_timeout(500);await state('closed')
        # S2 final boss F16
        await pg.evaluate("()=>{VD.P.lvl=18;VD.P.heroes.forEach(h=>h.lvl=18);VD.calcAll();VD.P.heroes.forEach(h=>{h.dead=false;h.hp=h.s.mhp;});VD.startFloor(16);}");await pg.wait_for_timeout(800);await skip()
        await pg.evaluate("()=>{const e=VD.E.find(e=>e.boss);VD.P.x=e.x;VD.P.y=e.y+1;}");await pg.wait_for_timeout(2500);await skip()
        print('win16->',await winBattle());await pg.wait_for_timeout(1500)
        for i in range(14):
            await skip(1);await pg.wait_for_timeout(600)
        await state('after-final');await pg.screenshot(path='sc_final.png')
        await pg.evaluate("()=>{const c=document.getElementById('cont');if(c)c.click();}");await pg.wait_for_timeout(1500);await state('after-final-cont')
        await pg.evaluate("()=>{VD.P.x=VD.stairs.x+.5;VD.P.y=VD.stairs.y+.5;}");await pg.wait_for_timeout(600)
        await pg.evaluate("()=>document.getElementById('ctx').click()");await pg.wait_for_timeout(1500);await skip();await state('F17?')
        # S4 reload continue
        await pg.reload();await pg.wait_for_timeout(2000);await pg.evaluate("()=>{G3.render=()=>{};}")
        has=await pg.evaluate("()=>!!document.getElementById('ct')");print('continue btn',has)
        if has:
            await pg.click('#ct');await pg.wait_for_timeout(4000);await skip();await state('continued')
        print('ERRORS',errs[:10])
        await b.close()
asyncio.run(main())
