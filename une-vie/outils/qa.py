import asyncio, random
from playwright.async_api import async_playwright
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
        pg=await b.new_page(viewport={"width":390,"height":844},device_scale_factor=1)
        errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file:///home/claude/gameclaude/une-vie/build/index.html");await pg.wait_for_timeout(500)
        lives=[]
        for life in range(3):
            await pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(b=>/Naître|Vivre une autre vie|Une toute nouvelle vie/.test(b.innerText));b.click()}")
            await pg.wait_for_timeout(3400)
            await pg.click("text=Commencer ma vie");await pg.wait_for_timeout(500)
            mig=False
            for i in range(500):
                txt=await pg.evaluate("""()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools')).map(b=>b.innerText)""")
                if any(("Vivre une autre vie" in t) or ("Une toute nouvelle vie" in t) for t in txt): break
                cand=[i for i,t in enumerate(txt) if "Accueil" not in t]
                if not cand:
                    await pg.wait_for_timeout(300);continue
                k=random.choice(cand)
                await pg.evaluate(f"()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools'))[{k}].click()")
                await pg.wait_for_timeout(25)
                if i%15==7: await pg.mouse.click(195,200)
                if i==30:
                    await pg.evaluate("()=>document.querySelector('.tools button:nth-child(2)').click()");await pg.wait_for_timeout(200)
                    await pg.evaluate("()=>document.querySelector('.tools button:nth-child(2)').click()")
                if not mig and await pg.evaluate("()=>!!(S&&S.ab)"):
                    mig=True;await pg.wait_for_timeout(1500);await pg.screenshot(path=f"/tmp/shots/q_mig{life}.png",clip={"x":0,"y":0,"width":390,"height":470})
            info=await pg.evaluate("()=>[S.c.n,S.age,S.ab?S.ab[0]:'',document.getElementById('stage').className]")
            lives.append(info)
        await pg.wait_for_timeout(2500);await pg.evaluate("()=>window.scrollTo(0,0)");await pg.wait_for_timeout(600)
        await pg.screenshot(path="/tmp/shots/q_end.png",clip={"x":0,"y":0,"width":390,"height":470})
        print("lives",lives);print("errors",errs[:6])
        await b.close()
asyncio.run(main())
