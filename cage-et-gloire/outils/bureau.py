#!/usr/bin/env python3
"""Captures bureau rapides : python3 outils/bureau.py build/index.html dossier"""
import sys,os,asyncio
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+html);await pg.wait_for_timeout(5000);await pg.screenshot(path=out+'/b_accueil.png')
    await pg.click('#bTest');await pg.wait_for_timeout(800)
    for v in ['ecurie','ligues','offres','salle']:
      await pg.click(f'#nav [data-v="{v}"]');await pg.wait_for_timeout(300);await pg.screenshot(path=out+f'/b_{v}.png')
    print('erreurs',errs);await b.close()
asyncio.run(main())
