#!/usr/bin/env python3
"""Assemble le jeu en UNE page autonome (hors ligne) : python3 build.py [sortie.html]"""
import re,sys,os
d=os.path.dirname(os.path.abspath(__file__))
html=open(os.path.join(d,'index.html'),encoding='utf-8').read()
import base64
css=open(os.path.join(d,'style.css'),encoding='utf-8').read()
css=re.sub(r'url\((polices/[^)]+)\)',lambda m:'url(data:font/woff2;base64,'+base64.b64encode(open(os.path.join(d,m.group(1)),'rb').read()).decode()+')',css)
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>')
def inl(m):
    typ,src=m.group(1) or "",m.group(2)
    code=open(os.path.join(d,src),encoding='utf-8').read().replace('</script','<\\/script')
    return f'<script{typ}>\n/* {src} */\n{code}\n</script>'
html=re.sub(r'<script( type="module")? src="([^"]+)"></script>',inl,html)
# --avec3d : le donjon 3D est intégré à la page (version hors ligne pour le Mac) ; sinon il est chargé à côté (donjon3d.html)
if '--avec3d' in sys.argv:
    p3=os.path.join(d,'..','build','donjon3d.html')
    html=html.replace('</body>','<script type="text/plain" id="donjon3d-b64">'+base64.b64encode(open(p3,'rb').read()).decode()+'</script>\n</body>')
sys.argv=[a for a in sys.argv if a!='--avec3d']
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(d,'..','build','trone-de-braise.html')
os.makedirs(os.path.dirname(os.path.abspath(out)),exist_ok=True)
open(out,'w',encoding='utf-8').write(html)
print(out,len(html.encode())//1024,'Kio')
