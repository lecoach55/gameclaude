# Reprise d'une vie en cours : jouer, recharger la page, reprendre, finir la vie. python3 reprise.py
import asyncio, random
from playwright.async_api import async_playwright
from scenes import serveur,navigateur,page,BUILD
CLIC="(k)=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools'))[k].click()"
LIRE="()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.closest('.tools')).map(b=>b.innerText)"
async def jouer(pg,n):
    for i in range(n):
        txt=await pg.evaluate(LIRE)
        if any(("Vivre une autre vie" in t) or ("Une toute nouvelle vie" in t) for t in txt): return True
        cand=[k for k,t in enumerate(txt) if "Accueil" not in t and "🧪" not in t]
        if not cand: await pg.wait_for_timeout(200);continue
        await pg.evaluate(CLIC,random.choice(cand));await pg.wait_for_timeout(60)
    return False
async def main():
    random.seed(11);ok=True
    async with async_playwright() as p:
        base=serveur(BUILD,8790);nav=await navigateur(p)
        pg=await page(nav,base+'index.html',390,844);await pg.evaluate("()=>{localStorage.clear();localStorage.setItem('vie8m_q','sd')}")
        await pg.goto(base+'index.html');await pg.wait_for_timeout(500)
        await pg.evaluate("()=>[...document.querySelectorAll('button')].find(b=>/Naître/.test(b.innerText)).click()");await pg.wait_for_timeout(3400)
        await pg.click("text=Commencer ma vie");await jouer(pg,40);await pg.wait_for_timeout(400)
        avant=await pg.evaluate("()=>[S.name,S.age,S.hist.length,S.m,document.querySelectorAll('#log .turn').length]")
        # mode test ne doit pas écraser la reprise
        await pg.reload();await pg.wait_for_timeout(800)
        btn=await pg.evaluate("()=>[...document.querySelectorAll('#go button')].map(b=>b.innerText)")
        print('avant',avant,'boutons',btn)
        if not any('Reprendre' in b for b in btn): ok=False;print('ÉCHEC : pas de bouton Reprendre')
        await pg.evaluate("()=>[...document.querySelectorAll('#go button')].find(b=>/Reprendre/.test(b.innerText)).click()");await pg.wait_for_timeout(1500)
        apres=await pg.evaluate("()=>[S.name,S.age,S.hist.length,S.m,document.querySelectorAll('#log .turn').length,!!(S.c&&S.c.n),document.getElementById('stage').className]")
        print('après',apres)
        if apres[:5]!=avant: ok=False;print('ÉCHEC : état différent')
        fini=await jouer(pg,600);print('vie terminée',fini,'âge',await pg.evaluate("()=>S.age"))
        ck=await pg.evaluate("()=>localStorage.getItem('vie8m_cur')");print('reprise effacée à la mort',ck is None)
        if not fini or ck is not None: ok=False
        print('erreurs',pg.erreurs[:5]);ok=ok and not pg.erreurs
        await nav.close()
    print('REPRISE OK' if ok else 'REPRISE ÉCHEC')
if __name__=='__main__':asyncio.run(main())
