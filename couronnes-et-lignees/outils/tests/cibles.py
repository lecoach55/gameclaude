from playwright.sync_api import sync_playwright
import os, json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    pg.add_init_script("localStorage.setItem('cl_guide','1');localStorage.setItem('cl_3d','0')");pg.goto('file://'+os.path.abspath('index.html'));pg.wait_for_timeout(800)
    pg.evaluate("startTest()");pg.wait_for_timeout(800)
    js="""()=>{const out=[];document.querySelectorAll('button,[onclick],a,input,select').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return;if(getComputedStyle(e).visibility==='hidden')return;if(r.width<44||r.height<44)out.push([(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)||e.tagName,(e.innerText||e.getAttribute('aria-label')||'').slice(0,24).replace(/\\n/g,' '),Math.round(r.width),Math.round(r.height)])});return out}"""
    res={}
    for name,act in [('plateau',''),('menu','menuSheet()'),('cour',"closeM&&closeM();setTab('cour')"),('lignee',"setTab('lignee')"),('chronique',"setTab('chronique')"),('batir',"setTab('plateau');buildMenu()"),('region',"setTab('plateau');closeM();regionSheet&&regionSheet(D.myRegions(S)[0].i)")]:
        try:
            if act: pg.evaluate(act)
            pg.wait_for_timeout(500); res[name]=pg.evaluate(js)
        except Exception as e: res[name]=str(e)[:100]
    for k,v in res.items():
        print('==',k); 
        if isinstance(v,str): print(v); continue
        seen=set()
        for c in v:
            key=(c[0],c[1][:12])
            if key in seen: continue
            seen.add(key); print('  ',c)
    b.close()
