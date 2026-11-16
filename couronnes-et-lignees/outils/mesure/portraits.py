# planche de portraits : âges × traits × époques, à 44 px et en grand
from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':780,'height':900},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('cl_guide','1')");pg.goto('file://'+os.path.abspath(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else 'index.html'));pg.wait_for_timeout(800)
    pg.evaluate("""()=>{const rows=[['M',[],0,30],['M',['brave'],0,28],['M',['pieux'],1,40],['M',['cruel'],2,45],['M',['couard'],1,35],['M',['charismatique'],2,25],['M',['simplet'],0,22],['M',[],1,62],['M',['sage'],2,72],
      ['F',[],0,22],['F',['pieux'],1,30],['F',['charismatique'],2,40],['F',['cruel'],2,58],['F',[],1,70],['M',[],0,8],['F',[],2,12]];
      let h='<div style="background:#efe2c4;padding:8px;display:flex;flex-wrap:wrap;gap:6px">';
      rows.forEach(([sex,tr,era,age],i)=>{const o={id:100+i*7,sex,age,traits:tr,era,ruler:i===7||i===13,heir:i===2,robe:['#7a1e12','#1c2f5e','#2f6b55'][i%3],accent:'#d6a62e'};h+=`<div style="text-align:center;font:10px sans-serif">${A.portraitSVG(o,80)}<br>${sex} ${age} ${tr.join('')} é${era}<br>${A.portraitSVG(o,44)}</div>`});
      h+='<div>'+A.impaledSVG(S.house,S.rival,60)+A.impaledSVG('de Coucy',"d'Ibelin",60)+'</div></div>';document.body.innerHTML=h;}""")
    pg.wait_for_timeout(400);pg.screenshot(path=(__import__('sys').argv[2] if len(__import__('sys').argv)>2 else 'planche_portraits.png'),full_page=True);print(errs);b.close()
