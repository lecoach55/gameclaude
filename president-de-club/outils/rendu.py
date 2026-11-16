import sys,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for f in sys.argv[1:]:
        pg=b.new_page(viewport={'width':1280,'height':900});pg.goto('file://'+f);pg.wait_for_timeout(400)
        pg.evaluate("Math.random=(()=>{let s=7;return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;}})();document.getElementById('cTown').value='Clichy';A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;")
        r=pg.evaluate("""(()=>{const o={};for(const t of ['accueil','calendrier','effectif','coupe','finances']){A.tab(t);const a=[];for(let k=0;k<15;k++){const t0=performance.now();render();a.push(performance.now()-t0);}a.sort((x,y)=>x-y);o[t]=+a[7].toFixed(2);}return o;})()""")
        print(f.split('/')[-1],json.dumps(r))
    b.close()
