import asyncio
from playwright.async_api import async_playwright
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
        pg=await b.new_page(viewport={"width":390,"height":844},device_scale_factor=2)
        errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file:///home/claude/gameclaude/une-vie/build/index.html");await pg.wait_for_timeout(500)
        await pg.click("text=Naître");await pg.wait_for_timeout(3600)
        await pg.click("text=Commencer ma vie");await pg.wait_for_timeout(1500)
        await pg.evaluate("""()=>{S.age=30;S.partner={name:"Ama",sex:S.sex=="m"?"f":"m",rel:70,off:-2,since:22,married:true,work:true};hdr();S.kids=[{name:"Lina",sex:"f",at:30,alive:true,inv:0,op:"Ama",opOff:-2},{name:"Tom",sex:"m",at:33,alive:true,inv:0,op:"Ama",opOff:-2}];S.age=62;S.deathAge=62;die()}""")
        await pg.wait_for_timeout(1500)
        txt=await pg.evaluate("()=>[...document.querySelectorAll('button')].map(b=>b.innerText).join(' | ')")
        print(txt[:400])
        await pg.evaluate("()=>{[...document.querySelectorAll('button')].find(b=>/Vivre la vie de/.test(b.innerText)).click()}")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path="/tmp/shots/h_reveal.png",full_page=False)
        await pg.click("text=Commencer ma vie");await pg.wait_for_timeout(2500)
        info=await pg.evaluate("()=>JSON.stringify({gen:S.gen,y0:S.y0,par:S.par.map(p=>[p.name,p.role,p.off,p.dieAt,!!p.look]),sib:S.sibL,lin:S.lineage.length})")
        print(info)
        await pg.screenshot(path="/tmp/shots/h_start.png",clip={"x":0,"y":0,"width":390,"height":844})
        # play until parent death
        for i in range(60):
            await pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools'));b[0]&&b[0].click()}")
            await pg.wait_for_timeout(30)
            if await pg.evaluate("()=>S.par.some(p=>p.prev&&!p.alive)||S.dead"): break
        print(await pg.evaluate("()=>JSON.stringify([S.age,S.par.map(p=>[p.name,p.alive,p.died])])"))
        print(errs)
        await b.close()
asyncio.run(main())
