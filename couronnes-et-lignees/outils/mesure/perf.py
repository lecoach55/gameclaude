# Banc de performance reproductible (graine 1234), processeur ralenti ×4 pour imiter un téléphone.
# usage : python3 perf.py index.html sortie.json
import sys, os, json
from playwright.sync_api import sync_playwright
html, out = os.path.abspath(sys.argv[1]), sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3)
    pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.add_init_script("try{localStorage.clear();localStorage.setItem('cl_guide','1');localStorage.setItem('cl_sound',JSON.stringify({sfx:false,music:false}))}catch(e){}")
    pg.goto('file://' + html); pg.wait_for_timeout(1500)
    nav = pg.evaluate("(()=>{const n=performance.getEntriesByType('navigation')[0];return {chargement_ms:Math.round(n.loadEventEnd)}})()")
    pg.evaluate("startTest();document.querySelectorAll('div[style*=\"9999\"]').forEach(e=>e.remove());for(let i=0;i<12;i++){D.playTurn(S,'attendre');if(S.event)D.resolveEvent(S,0);}S.event=null;D.autoCouncil(S);render()")
    r = pg.evaluate("""async()=>{const T=(f,n=10)=>{const t=performance.now();for(let i=0;i<n;i++)f();return +((performance.now()-t)/n).toFixed(1)};
      const res={};for(const t of ['plateau','cour','lignee','chronique','labo'])res['rendu_'+t]=T(()=>{tab=t;render()},6);
      tab='plateau';render();
      res.tour_moteur=T(()=>{D.playTurn(S,'attendre');if(S.event)D.resolveEvent(S,0);},10);
      res.fiche_region=T(()=>{tapRegion(D.borderTargets(S)[0].i);closeM()},6);
      res.fiche_batir=T(()=>{buildMenu();closeM()},6);
      // images pendant un zoom continu et un glissé de carte
      const frames=async(fn,ms)=>{const a=[];let lt=0,on=true;const f=t=>{if(lt)a.push(t-lt);lt=t;if(on){fn();requestAnimationFrame(f);}};requestAnimationFrame(f);await new Promise(r=>setTimeout(r,ms));on=false;a.sort((x,y)=>x-y);const m=a.reduce((x,y)=>x+y,0)/a.length;return {img_s:+(1000/m).toFixed(1),pire_ms:+a[a.length-1].toFixed(1),p95_ms:+a[Math.floor(a.length*.95)].toFixed(1)}};
      let k=0;res.zoom=await frames(()=>zoomAt(k++%30<15?1.03:1/1.03,innerWidth/2,innerHeight/2),3000);
      fitView();let d=0;res.glisse=await frames(()=>{if(typeof view==='object'&&view){view.x+=(d++%60<30?3:-3);applyView(true);}},3000);
      res.dom_noeuds=document.getElementsByTagName('*').length;res.svg_carte_ko=Math.round((document.querySelector('#board')||{innerHTML:''}).innerHTML.length/1024);
      return res}""")
    r.update(nav); r['erreurs'] = []
    json.dump(r, open(out, 'w'), ensure_ascii=False, indent=1); print(json.dumps(r, ensure_ascii=False))
    b.close()
