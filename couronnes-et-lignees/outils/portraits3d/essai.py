import asyncio,sys,os,base64,json,subprocess
from playwright.async_api import async_playwright
sys.path.insert(0,'/home/claude/gameclaude/bannieres/outils/studio');import studio as _s
T3D='/home/claude/t3d';OUT=sys.argv[1];os.makedirs(OUT,exist_ok=True)
L=json.loads(sys.argv[2])
async def main():
    _s.page();subprocess.run(['sh',os.path.join(T3D,'srv.sh')])
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':300,'height':300});err=[];pg.on('pageerror',lambda e:err.append(str(e)[:300]))
        await pg.goto('http://localhost:8765/bs_studio.html',timeout=120000)
        await pg.evaluate("()=>new Promise(r=>{const f=()=>window.studioPret?window.studioPret.then(r):setTimeout(f,100);f();})")
        for n,d in L.items():
            u=await pg.evaluate("(p)=>rendrePortrait(p)",d);open(f'{OUT}/{n}.png','wb').write(base64.b64decode(u.split(',')[1]))
        print('ok',err[-2:]);await b.close()
asyncio.run(main())
