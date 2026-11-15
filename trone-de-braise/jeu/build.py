#!/usr/bin/env python3
"""Assemble le jeu en UNE page autonome (hors ligne) : python3 build.py [sortie.html]"""
import re,sys,os
d=os.path.dirname(os.path.abspath(__file__))
html=open(os.path.join(d,'index.html'),encoding='utf-8').read()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+open(os.path.join(d,'style.css'),encoding='utf-8').read()+'\n</style>')
def inl(m):
    typ,src=m.group(1) or "",m.group(2)
    code=open(os.path.join(d,src),encoding='utf-8').read().replace('</script','<\\/script')
    return f'<script{typ}>\n/* {src} */\n{code}\n</script>'
html=re.sub(r'<script( type="module")? src="([^"]+)"></script>',inl,html)
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(d,'..','build','trone-de-braise.html')
os.makedirs(os.path.dirname(os.path.abspath(out)),exist_ok=True)
open(out,'w',encoding='utf-8').write(html)
print(out,len(html.encode())//1024,'Kio')
