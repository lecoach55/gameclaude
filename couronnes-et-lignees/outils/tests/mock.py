import sys,os
HTML='file://'+os.path.abspath(sys.argv[1] if len(sys.argv)>1 and sys.argv[1].endswith('.html') else 'index.html')
from playwright.sync_api import sync_playwright
MOCK = r"""
window.__prompts=[];
const mk=async (p,o)=>{ window.__prompts.push(p); await new Promise(r=>setTimeout(r,300));
 if(p.includes('ORDRE DU SOUVERAIN')){ const heirId=(p.match(/\[id (\d+)\][^\n]*héritier/)||[])[1];
   return {titre:'Le défi lancé aux Montfort',recit:"Le souverain fit lire son défi sur le parvis. Les barons applaudirent, mais les marchands fermèrent leurs coffres. On fourbit les armes tout l'hiver.",action:'campagne',cible:null,type_mariage:null,effets:{or:-15,stabilite:4,prestige:6,soldats:0,menace:10},mort:null,traits:heirId?[{id:+heirId,ajout:'brave'}]:[],resume:'Le souverain défia la maison rivale et partit en guerre.'};}
 return {chronique:"Trois hivers passèrent sur les terres de la maison. On baptisa un enfant à la Saint-Martin, et les moissons furent maigres.",situation:"Un chevalier de la maison rivale demande asile à votre cour : il prétend détenir les plans de son seigneur. Le recevoir serait une insulte ouverte.",suggestions:["Je l'accueille et j'écoute ses secrets","Je le livre enchaîné à son seigneur","Je l'envoie en Terre sainte, loin d'ici"]};};
const sample=Object.assign((p,o)=>mk(p,o).then(x=>({text:JSON.stringify(x)})),{json:mk});
window.claude={use:(n)=>Promise.resolve(n==='sample'?sample:null)};
"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    pg.add_init_script(MOCK)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(HTML);pg.wait_for_timeout(600)
    pg.evaluate("localStorage.clear();newGame()");pg.wait_for_timeout(400)
    pg.screenshot(path='h1_choose.png')
    pg.locator('.tbtn').first.click(); pg.wait_for_timeout(1500)
    pg.screenshot(path='h2_opening.png',full_page=True)
    pg.locator('.sugg button').nth(1).click()
    pg.locator('#ordre').fill("Je défie publiquement la maison rivale et je lève l'ost pour marcher sur leurs terres.")
    pg.locator('.btn.wide').click(); pg.wait_for_timeout(150); pg.screenshot(path='h3_busy.png')
    pg.wait_for_timeout(1600)
    pg.screenshot(path='h4_result.png')
    for i in range(5):
        if pg.locator('.veil').count(): pg.locator('.veil .btn, .veil .choice').first.click(); pg.wait_for_timeout(500)
    pg.wait_for_timeout(1000)
    pg.screenshot(path='h5_next.png')
    pr=pg.evaluate("window.__prompts")
    print('appels IA:',len(pr)); print('--- 3e prompt (ouverture tour 2), extrait faits ---'); t=pr[-1]; i=t.find('FAITS'); print(t[i:i+600])
    print('erreurs',errs[:3]);b.close()
