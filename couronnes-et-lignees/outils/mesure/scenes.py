from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':760,'height':900},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('cl_guide','1')");pg.goto('file://'+os.path.abspath(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else 'index.html'));pg.wait_for_timeout(800)
    pg.evaluate("""startTest();const ks=['tournoi','chantier','foire','noces','couronnement','siege','port','village'];let h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#111;padding:6px">';
      for(const k of ks)h+=`<div style="height:150px;overflow:hidden;position:relative">${SCENE.svg(k,{flag:'#1d4b97',foe:'#7a1e12',seed:5,h:150})}<span style="position:absolute;left:4px;top:2px;color:#fff;font:12px sans-serif">${k}</span></div>`;
      S.year=1320;h+=`<div style="height:150px;overflow:hidden">${SCENE.svg('village',{seed:5,h:150})}</div>`;S.year=1260;h+=`<div style="height:150px;overflow:hidden">${SCENE.svg('village',{seed:5,h:150})}</div>`;document.body.innerHTML=h+'</div>'""")
    pg.wait_for_timeout(400);pg.screenshot(path=(__import__('sys').argv[2] if len(__import__('sys').argv)>2 else 'planche_scenes.png'),full_page=True);print(errs);b.close()
