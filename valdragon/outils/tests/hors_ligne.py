import asyncio
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx=await b.new_context(viewport={'width':390,'height':780},device_scale_factor=3,is_mobile=True,has_touch=True);pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGE:'+str(e)[:300]))
        pg.on('console',lambda m:errs.append(m.type+':'+m.text[:200]))
        pg.on('requestfailed',lambda r:errs.append('REQFAIL:'+r.url[:120]))
        import os
        async def rt(route):
            u=route.request.url
            if not u.startswith('http://localhost'):
                errs.append('EXTERNE:'+u[:100]); await route.abort(); return
            if 'cdn.jsdelivr.net/npm/three@0.160.0/' in u:
                path='/home/claude/t3d/node_modules/three/'+u.split('three@0.160.0/')[1].split('?')[0]
                if os.path.exists(path): await route.fulfill(path=path,content_type='application/javascript'); return
            if 'fonts.g' in u: await route.fulfill(body='',content_type='text/css'); return
            await route.continue_()
        await pg.route('**/*',rt)
        await pg.goto('http://localhost:8765/valdragon3d.html',timeout=180000);await pg.wait_for_timeout(8000)
        print(await pg.evaluate("()=>({nw:!!document.getElementById('nw'),G3:typeof G3,VD:typeof VD,body:document.body.innerText.slice(0,300)})"))
        try:
            await pg.evaluate("()=>document.getElementById('nw').click()");await pg.wait_for_timeout(6000)
            print(await pg.evaluate("()=>({VD:!!(window.VD&&VD.P),mode:G3.mode,story:document.getElementById('story').style.display})"))
            await pg.evaluate("()=>{const sk=document.querySelector('#story .sskip');if(sk)sk.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}")
            await pg.wait_for_timeout(4000)
            print(await pg.evaluate("()=>({mode:G3.mode,F:VD.F})"))
            await pg.evaluate("()=>{const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}");await pg.wait_for_timeout(8000)
            print('combat',await pg.evaluate("()=>({B:!!VD.B,mode:G3.mode})"))
            await pg.evaluate("()=>document.dispatchEvent(new Event('visibilitychange'))");await pg.wait_for_timeout(1000)
            await pg.reload();await pg.wait_for_timeout(9000)
            print('reload',await pg.evaluate("()=>({txt:(document.getElementById('nw')||{}).innerText,btns:[...document.querySelectorAll('button')].map(b=>b.innerText).filter(t=>t).slice(0,6)})"))
            c=await pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(b=>/Continuer/.test(b.innerText));if(b){b.click();return true}return false}")
            await pg.wait_for_timeout(8000)
            print('continue',c,await pg.evaluate("()=>({mode:G3.mode,F:VD.F,B:!!VD.B})"))
        except Exception as e: print('click',e)
        for e in errs[:20]:print(e)
        await b.close()
asyncio.run(m())
