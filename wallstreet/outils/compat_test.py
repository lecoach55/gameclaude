# Ancienne partie (version publiée) chargée dans la nouvelle version : aucune erreur, feuilletons ajoutés, rien de perdu.
import asyncio,json,sys
NEW=sys.argv[1] if len(sys.argv)>1 else '/home/claude/bourse6.html'
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();ctx=await b.new_context();errs=[]
        pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/bourse_old.html');await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#bSound').click();__wst.newGame(50000);__wst.setSel('AAPL');__wst.doTrade('A',40,true)")
        for k in range(30):
            await pg.evaluate("__wst.step(5)")
            await pg.evaluate("for(let i=0;i<8;i++){const e=document.querySelector('#mEvent:not([hidden]) .choice:not([disabled])'),f=document.querySelector('#mInfo:not([hidden]) [data-close]');if(e)e.click();else if(f)f.click();else break;}")
        await pg.evaluate("window.dispatchEvent(new Event('pagehide'))");await pg.wait_for_timeout(1800)
        save=await pg.evaluate("localStorage.getItem('wallst-sim-v3')")
        before=json.loads(save);await pg.close()
        pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+NEW);await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#bSound').click()")
        # reprendre la partie depuis le menu d'accueil
        btn=await pg.query_selector('#mStart:not([hidden]) button:has-text("Reprendre"), #mStart:not([hidden]) #sResume')
        if btn: await btn.click()
        await pg.wait_for_timeout(300)
        st=await pg.evaluate("({day:__wst.G.day,cash:__wst.G.cash,pos:Object.keys(__wst.G.pos).length,xp:__wst.G.game.xp,scen:!!__wst.G.game.scen})")
        print('chargée :',st,'| avant :',{'day':before['day'],'cash':before['cash'],'pos':len(before['pos']),'xp':before['game']['xp']})
        n=0
        for k in range(50):
            await pg.evaluate("__wst.step(5)")
            await pg.evaluate("for(let i=0;i<8;i++){const e=document.querySelector('#mEvent:not([hidden]) .choice:not([disabled])'),f=document.querySelector('#mInfo:not([hidden]) [data-close]');if(e)e.click();else if(f)f.click();else break;}")
        r=await pg.evaluate("({day:__wst.G.day,scen:__wst.G.game.scen.n,ok:__wst.G.game.scen.ok,hist:__wst.G.game.scen.hist.length})")
        print('après 250 séances :',r,'erreurs',errs[:5])
        await b.close()
asyncio.run(main())
