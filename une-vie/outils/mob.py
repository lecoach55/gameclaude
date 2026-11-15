import asyncio
from playwright.async_api import async_playwright
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
        dev=p.devices["iPhone 13"]
        ctx=await b.new_context(**{k:v for k,v in dev.items() if k!="default_browser_type"})
        pg=await ctx.new_page()
        errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file:///home/claude/gameclaude/une-vie/build/index.html");await pg.wait_for_timeout(800)
        await pg.tap("text=Naître");await pg.wait_for_timeout(3600)
        await pg.tap("text=Commencer ma vie");await pg.wait_for_timeout(3000)
        print(await pg.evaluate("()=>[document.getElementById('stage').className,W3.quality(),JSON.stringify(W3.info())]"))
        await pg.screenshot(path="/tmp/shots/mob.png")
        print(errs)
        await b.close()
asyncio.run(main())
