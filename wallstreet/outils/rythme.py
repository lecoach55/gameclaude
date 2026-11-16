# Rythme d'une partie : repère les semaines « plates » (rien à décider, rien de marquant).
# python3 rythme.py [page.html] [profils] [parties] [séances]   → rythme_out.json + résumé
# Une semaine = un clic « +1 semaine » (5 séances). Marquant = décision (dilemme), flash spécial,
# fenêtre d'information, message non routinier (hors paie/dividende), indice ±2,5 % ou portefeuille ±3 % sur la semaine,
# ou nouveauté de jeu (cat 'jeu' dans le fil). Plate = rien de tout cela.
import asyncio,json,sys
from playwright.async_api import async_playwright
PAGE=sys.argv[1] if len(sys.argv)>1 else '/home/claude/bourse6.html'
PERS=(sys.argv[2] if len(sys.argv)>2 else 'passif,actif').split(',')
RUNS=int(sys.argv[3]) if len(sys.argv)>3 else 2
DAYS=int(sys.argv[4]) if len(sys.argv)>4 else 504
JS=r"""
async (args)=>{
 const [persona,days,seed]=args; const W=__wst; W.newGame(50000);
 const G=()=>W.G, TK=W.TK, start=G().day;
 const log={d:0,f:0,i:0,t:0,p:0}; const kinds={};
 window.__H=(k,m)=>{if(k==='t'){m=String(m);if(/^Jour de paie|^Dividende/.test(m))return;const key=m.replace(/[0-9 ,.$+%−-]+/g,'#').slice(0,28);kinds[key]=(kinds[key]||0)+1;}log[k]++;};
 function resolve(){for(let k=0;k<10;k++){const ev=document.querySelector('#mEvent:not([hidden])'),inf=document.querySelector('#mInfo:not([hidden])');
   if(ev){const bs=[...ev.querySelectorAll('.choice:not([disabled])')];bs[Math.floor(Math.random()*bs.length)].click();}
   else if(inf){const b=inf.querySelector('[data-close]')||inf.querySelector('button');if(!b)break;b.click();} else break;}}
 const buyEq=(list,frac)=>{list.forEach(t=>{W.setSel(t);const q=Math.floor(G().cash*frac/list.length/W.P(t));if(q>0)W.doTrade('A',q,true);});};
 const sellAll=()=>{Object.keys(G().pos).forEach(t=>{W.setSel(t);W.doTrade('V',G().pos[t].q,true);});};
 let last=-99; const weeks=[];
 while(G().day-start<days){
   const d=G().day-start;
   if(persona==='passif'&&d===0)buyEq(TK.slice(0,30),0.98);
   if(persona==='actif'&&d-last>=21){last=d;sellAll();const sc=t=>{const r=G().st[t].rat;let s=0,n=0;for(const k in r)if(r[k].day>G().day-126){s+=r[k].r;n++;}return n?s/n:0;};buyEq(TK.slice().sort((a,b)=>sc(b)-sc(a)).slice(0,8),0.97);}
   const before=Object.assign({},log), v0=W.value(), m0=G().idx[G().idx.length-1], n0=G().news.length;
   W.step(5); resolve();
   const dl={};for(const k in log)dl[k]=log[k]-before[k];
   const mv=G().idx[G().idx.length-1]/m0-1, pv=W.value()/v0-1;
   const jeu=G().news.slice(n0).filter(x=>x.cat==='jeu').length, big=G().news.slice(n0).filter(x=>x.big).length;
   const tags=[];if(dl.d)tags.push('decision');if(dl.f)tags.push('flash');if(dl.i||dl.p)tags.push('fenetre');if(dl.t)tags.push('message');
   if(Math.abs(mv)>0.025)tags.push('marche');if(Math.abs(pv)>0.03)tags.push('portef');if(jeu||big)tags.push('actu');
   weeks.push({w:weeks.length,tags,mv:+mv.toFixed(4)});
 }
 return {persona,weeks,kinds};
}
"""
def streaks(ws):
    best=cur=0;L=[]
    for w in ws:
        if not w['tags']:cur+=1;best=max(best,cur)
        else:
            if cur:L.append(cur)
            cur=0
    if cur:L.append(cur)
    return best,L
HOOKS=[('function showDilemma(){','d'),('function showScen(id){','d?'),('function breaking(n){','f'),('function info(html){','i'),('function toast(msg,c){','t'),('function showPromo(r){','p')]
def instrument():
    h=open(PAGE,encoding='utf8').read()
    for sig,k in HOOKS:
        if k.endswith('?'):
            if sig not in h: continue
            k=k[:-1]
        assert sig in h,sig
        h=h.replace(sig,sig+"window.__H&&__H('%s',arguments[0]);"%k,1)
    out='/tmp/rythme_page.html';open(out,'w',encoding='utf8').write(h);return out
async def main():
    out=[];errs=[];page=instrument()
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for per in PERS:
            for r in range(RUNS):
                ctx=await b.new_context(viewport={'width':1280,'height':900});pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
                await pg.goto('file://'+page);await pg.wait_for_timeout(400)
                await pg.evaluate("document.querySelector('#bSound').click()")
                res=await pg.evaluate(JS,[per,DAYS,r]);out.append(res);await ctx.close()
                ws=res['weeks'];flat=sum(1 for w in ws if not w['tags']);best,L=streaks(ws)
                agg={}
                for w in ws:
                    for t in w['tags']:agg[t]=agg.get(t,0)+1
                quiet=sum(1 for w in ws if not set(w['tags'])-{'message'})
                print(f"{per} #{r}: {len(ws)} semaines, plates {flat} ({100*flat/len(ws):.0f} %), sans rien d'autre qu'un message {quiet} ({100*quiet/len(ws):.0f} %), plus longue série plate {best}, séries ≥4 : {sum(1 for x in L if x>=4)} | "+' '.join(f'{k}:{v}' for k,v in sorted(agg.items())))
        await b.close()
    json.dump(out,open('rythme_out.json','w'),ensure_ascii=False)
    allw=[w for o in out for w in o['weeks']];f=sum(1 for w in allw if not w['tags']);q=sum(1 for w in allw if not set(w['tags'])-{'message'})
    print(f"TOTAL : {len(allw)} semaines, plates {100*f/len(allw):.1f} %, calmes (au plus un message) {100*q/len(allw):.1f} %, plus longue série plate {max(streaks(o['weeks'])[0] for o in out)}")
    kinds={}
    for o in out:
        for k,v in o['kinds'].items():kinds[k]=kinds.get(k,0)+v
    print('messages les plus fréquents :',sorted(kinds.items(),key=lambda x:-x[1])[:12])
    print('erreurs',errs[:5])
asyncio.run(main())
