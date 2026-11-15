import asyncio,json,sys
from playwright.async_api import async_playwright
JS=r"""
async (args)=>{
 const [persona,days]=args; const W=__wst; W.newGame(50000);
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const G=()=>W.G; const start=G().day; const TK=W.TK;
 let clicks=0, interrupts=0, choices={};
 function resolve(){let n=0;for(let k=0;k<8;k++){const ev=document.querySelector('#mEvent:not([hidden])'),inf=document.querySelector('#mInfo:not([hidden])');
   if(ev){const bs=[...ev.querySelectorAll('.choice:not([disabled])')];const b=persona==='prudent'?bs[bs.length-1]:persona==='yolo'?bs[0]:bs[Math.floor(Math.random()*bs.length)];const id=G().game.stats.last;choices[id]=(choices[id]||0)+1;b.click();n++;}
   else if(inf){inf.querySelector('[data-close]').click();n++;} else break;} return n;}
 const buyEq=(list,frac)=>{list.forEach(t=>{W.setSel(t);const p=W.P(t);const q=Math.floor(G().cash*frac/list.length/p);if(q>0)W.doTrade('A',q,true);});};
 const sellAll=()=>{Object.keys(G().pos).forEach(t=>{W.setSel(t);W.doTrade('V',G().pos[t].q,true);});};
 let lastTrade=-99;
 while(G().day-start<days){
   const d=G().day-start;
   if(persona==='passif'&&d===0){buyEq(TK.slice(0,30),0.98);}
   if(persona==='actif'&&d-lastTrade>=21){lastTrade=d;sellAll();const sc=t=>{const r=G().st[t].rat;let s=0,n=0;for(const k in r)if(r[k].day>G().day-126){s+=r[k].r;n++;}return n?s/n:0;};buyEq(TK.slice().sort((a,b)=>sc(b)-sc(a)).slice(0,8),0.97);}
   if(persona==='yolo'&&d-lastTrade>=5){lastTrade=d;sellAll();const L=TK.slice().sort(()=>Math.random()-.5).slice(0,2);buyEq(L,0.99);}
   if(persona==='prudent'&&d===0){buyEq(TK.filter(t=>G().st[t].dy>0.025).slice(0,15),0.7);}
   const t0=performance.now(); W.step(5); clicks++; window.__ms=(window.__ms||0)+(performance.now()-t0);
   interrupts+=resolve();
 }
 const g=G().game; const b=W.board();
 return {ms:Math.round(window.__ms/clicks),size:JSON.stringify(G()).length,orders:G().game.orders.length,persona,contrib:Math.round(g.contrib),bonus:G().tx.filter(x=>x.item==='Prime annuelle').map(x=>Math.round(x.pl)),cashm:G().game.missions.length,years:days/252,val:Math.round(W.value()),xp:g.xp,rank:g.rank,rk:Object.fromEntries(Object.entries(g.stats.rk).map(([k,v])=>[k,v-start])),md:g.stats.md,mf:g.stats.mf,dil:g.stats.dil,spec:g.stats.spec,pop:g.stats.pop,pay:g.stats.pay.map(Math.round),interrupts,clicks,board:b.map(x=>x.id+':'+Math.round(x.v/1000)+'k'),items:Object.keys(g.items),choices};
}
"""
async def main():
    personas=sys.argv[1].split(','); runs=int(sys.argv[2]); days=int(sys.argv[3])
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        out=[];errs=[]
        for per in personas:
            for r in range(runs):
                ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
                await pg.goto('file:///home/claude/bourse6.html'); await pg.wait_for_timeout(400)
                await pg.evaluate("document.querySelector('#bSound').click()")
                res=await pg.evaluate(JS,[per,days]); out.append(res); print(json.dumps(res,ensure_ascii=False)); sys.stdout.flush(); await ctx.close()
        json.dump(out,open('gsim_out.json','w'),ensure_ascii=False)
        print('erreurs',errs[:5])
        await b.close()
asyncio.run(main())
