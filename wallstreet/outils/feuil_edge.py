# Avantage d'un joueur qui « suit les dépêches » des feuilletons : après chaque annonce ou dépêche, il prend position
# dans le sens de l'espérance intégrée (signe de s.px) sur les titres concernés, jusqu'à 5 séances après le dénouement.
# Mesure le rendement moyen de cette position, net du marché (bêta). Cible : proche de 0.
# usage : python3 feuil_edge.py [page] [parties] [séances]
import asyncio,sys,json,statistics as st
from playwright.async_api import async_playwright
PAGE=sys.argv[1] if len(sys.argv)>1 else '/home/claude/bourse6.html'
N=int(sys.argv[2]) if len(sys.argv)>2 else 4; DAYS=int(sys.argv[3]) if len(sys.argv)>3 else 1500
JS=r"""
async (days)=>{const W=__wst;W.newGame(50000);const G=()=>W.G;const snaps=[],res=[];
 const idx=()=>G().idx[G().idx.length-1];
 const clear=()=>{for(let i=0;i<8;i++){const e=document.querySelector('#mEvent:not([hidden]) .choice:not([disabled])'),f=document.querySelector('#mInfo:not([hidden]) [data-close]');if(e)e.click();else if(f)f.click();else break;}};
 const seen={};
 for(let d=0;d<days;d++){W.step(1);clear();
   const S=G().game.scen;
   S.list.forEach(s=>{const key=s.id+':'+s.acts.filter(x=>x<0).length;const E=s.ex||s.px;if(!s.done&&E&&!seen[key]){seen[key]=1;const L=Object.keys(E).filter(t=>Math.abs(E[t])>0.002);snaps.push({id:s.id,k:s.k,end:s.day+5,L,sg:L.map(t=>Math.sign(E[t])),p0:L.map(t=>W.P(t)),m0:idx()});}});
   for(let i=snaps.length-1;i>=0;i--){const x=snaps[i];if(G().day>=x.end){let r=0;const mk=idx()/x.m0-1;x.L.forEach((t,j)=>{r+=x.sg[j]*((W.P(t)/x.p0[j]-1)-mk*(1));});res.push({k:x.k,r:r/Math.max(1,x.L.length)});snaps.splice(i,1);}}
 }
 return res;}
"""
async def main():
    allr=[];errs=[]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for i in range(N):
            pg=await b.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file://'+PAGE);await pg.wait_for_timeout(300);await pg.evaluate("document.querySelector('#bSound').click()")
            allr+=await pg.evaluate(JS,DAYS);await pg.close()
        await b.close()
    by={}
    for x in allr:by.setdefault(x['k'],[]).append(x['r'])
    tot=[x['r'] for x in allr]
    for k,v in sorted(by.items()):print(f"{k:7s} n={len(v):3d} moyenne {100*st.mean(v):+.2f} %  écart-type {100*(st.pstdev(v)):.1f} %")
    m=st.mean(tot);se=st.pstdev(tot)/len(tot)**.5
    print(f"TOUS n={len(tot)} avantage moyen par position {100*m:+.2f} % (± {100*se:.2f} %) ; erreurs {errs[:3]}")
asyncio.run(main())
