# Reprise d'un appareil à l'autre avec une base simulée : l'appareil A joue, l'appareil B (stockage vide) reprend. python3 nuage_test.py
import asyncio, random, json
from playwright.async_api import async_playwright
from scenes import serveur,navigateur,BUILD
from reprise import jouer
BASE={}
MOCK="""window.claude={use:async n=>n=='user'?{id:async()=>'u1'}:{collection:c=>({doc:d=>({set:async o=>{await window.py_set(c+'/'+d,JSON.stringify(o))},get:async()=>{const v=await window.py_get(c+'/'+d);return v?{exists:true,data:()=>JSON.parse(v)}:{exists:false}}})})}};"""
async def appareil(nav,url):
    ctx=await nav.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();pg.erreurs=[];pg.on('pageerror',lambda e:pg.erreurs.append(str(e)[:300]))
    await pg.expose_function('py_set',lambda k,v:BASE.__setitem__(k,v));await pg.expose_function('py_get',lambda k:BASE.get(k))
    await pg.add_init_script(MOCK+"try{if(!localStorage.getItem('vie8m_q'))localStorage.setItem('vie8m_q','sd')}catch(e){}")
    await pg.goto(url);await pg.wait_for_timeout(800);return ctx,pg
async def main():
    random.seed(4);ok=True
    async with async_playwright() as p:
        url=serveur(BUILD,8790)+'index.html';nav=await navigateur(p)
        ca,a=await appareil(nav,url)
        await a.evaluate("()=>[...document.querySelectorAll('button')].find(b=>/Naître/.test(b.innerText)).click()");await a.wait_for_timeout(3400)
        await a.click("text=Commencer ma vie");await jouer(a,35);await a.wait_for_timeout(300);print('A dbg',await a.evaluate("()=>[S.age,S.dead,Object.keys(localStorage)]"))
        avant=await a.evaluate("()=>{const c=JSON.parse(localStorage.getItem('vie8m_cur'));return [c.S.name,c.S.age,c.S.hist.length]}")
        await a.evaluate("()=>NUAGE.push(true)");await a.wait_for_timeout(1500)
        print('A',avant,'documents',list(BASE),'taille',len(BASE.get('data/users/u1/partie','')))
        cb,b=await appareil(nav,url);await b.wait_for_timeout(1500)
        btn=await b.evaluate("()=>[...document.querySelectorAll('#go button')].map(b=>b.innerText)");print('B boutons',btn)
        if not any('☁️' in x for x in btn): ok=False;print('ÉCHEC : pas de reprise en ligne')
        else:
            await b.evaluate("()=>[...document.querySelectorAll('#go button')].find(b=>/☁️/.test(b.innerText)).click()");await b.wait_for_timeout(2000)
            apres=await b.evaluate("()=>[S.name,S.age,S.hist.length]");print('B',apres)
            if apres!=avant: ok=False
            fini=await jouer(b,600);await b.wait_for_timeout(500);await b.evaluate("()=>NUAGE.push(true)");await b.wait_for_timeout(1500)
            m=json.loads(BASE['data/users/u1/partie']);print('fin de vie sur B',fini,'méta fin',m.get('fin'))
            # A revient à l'accueil : ne doit pas proposer la vie finie en ligne
            await a.reload();await a.wait_for_timeout(1500)
            ba=await a.evaluate("()=>[...document.querySelectorAll('#go button')].map(b=>b.innerText)");vies=await a.evaluate("()=>SAVE.lives.length");print('A boutons',ba,'vies connues',vies)
            if any('Reprendre' in x for x in ba) or vies<1: ok=False;print('ÉCHEC : A propose encore la vie terminée sur B')
        print('erreurs',a.erreurs[:3],b.erreurs[:3]);ok=ok and not a.erreurs and not b.erreurs
        await nav.close()
    print('NUAGE OK' if ok else 'NUAGE ÉCHEC')
asyncio.run(main())
