# Captures de vues fixes (graine fixe) pour comparer avant/après avec outils-communs/compare.py.
# usage : python3 captures.py dossier_sortie
#   puis : python3 ../../outils-communs/compare.py ../references dossier_sortie planche.png
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'captures'
JEU=os.environ.get('JEU') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
VUES=[ # nom, largeur, hauteur, scénario, script de préparation
 ('accueil',390,780,None,""),
 ('carte_1073',390,780,'1073',"MAP.mode='royaumes';renderAll()"),
 ('carte_heresie',390,780,'1198',"MAP.mode='heresie';renderAll()"),
 ('carte_relations',390,780,'1294',"MAP.mode='relations';renderAll()"),
 ('royaume',390,780,'1073',"selectRealm('empire');document.getElementById('panel').scrollIntoView()"),
 ('rome',390,780,'1198',"UI.tab='rome';renderAll();document.getElementById('panel').scrollIntoView()"),
 ('curie',390,780,'1294',"UI.tab='curie';renderAll();document.getElementById('panel').scrollIntoView()"),
 ('evenement',390,780,'1073',"showEvent(forced('relique'))"),
 ('mac_carte',1440,860,'1378',"MAP.mode='royaumes';renderAll()"),
]
async def main():
    base=serveur(JEU,int(os.environ.get('PORT','8771'))); os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        nav=await p.chromium.launch(executable_path='/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None,args=['--no-sandbox'])
        for nom,w,h,sc,js in VUES:
            pg=await nav.new_page(viewport={'width':w,'height':h}); err=[]; pg.on('pageerror',lambda e:err.append(str(e)))
            await pg.add_init_script("try{localStorage.clear();localStorage.setItem('sp_welcome','1')}catch(e){}")
            await pg.goto(base+'index.html?graine=7'); await pg.wait_for_function("!document.getElementById('start').hidden",timeout=120000)
            await pg.add_style_tag(content='*{animation:none!important;transition:none!important}#toast{display:none!important}')
            if sc:
                await pg.click(f'[data-scen="{sc}"]'); await pg.click('#stStart'); await pg.wait_for_timeout(700)
                if js: await pg.evaluate("()=>{"+js+"}"); await pg.wait_for_timeout(600)
            await pg.screenshot(path=os.path.join(OUT,nom+'.png'))
            if err: print(nom,'ERREURS',err)
            await pg.close()
        await nav.close()
    print('captures :',len(VUES),'→',OUT)
asyncio.run(main())
