# Planche-contact de modèles glTF/GLB : python3 planche_modeles.py sortie.png fichier1.gltf fichier2.glb ...
# (chemins absolus sous /home/claude ; sert /home/claude en http sur le port 8791)
import asyncio,sys,os,json,subprocess,time,base64
from playwright.async_api import async_playwright
ROOT='/home/claude'
async def main():
    out=sys.argv[1];fs=[os.path.abspath(f) for f in sys.argv[2:]]
    srv=subprocess.Popen([sys.executable,'-m','http.server','8791','-d',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
            pg=await b.new_page();pg.on('console',lambda m:print('console:',m.text) if m.type=='error' else None)
            m=','.join('/'+os.path.relpath(f,ROOT) for f in fs)
            await pg.goto(f'http://localhost:8791/outils/planche_modeles.html?m={m}',timeout=60000)
            await pg.wait_for_function('window.DONE',timeout=600000)
            data=await pg.evaluate("()=>document.querySelector('canvas').toDataURL('image/png')")
            open(out,'wb').write(base64.b64decode(data.split(',')[1]))
            for i in await pg.evaluate('()=>INFO'): print(json.dumps(i,ensure_ascii=False))
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
