#!/usr/bin/env python3
"""Assemble le jeu en UNE page autonome (hors ligne) : python3 build.py [sortie.html]"""
import re,sys,os
d=os.path.dirname(os.path.abspath(__file__))
html=open(os.path.join(d,'index.html'),encoding='utf-8').read()
import base64 as _b
css=open(os.path.join(d,'style.css'),encoding='utf-8').read().replace('url(tex/bois.jpg)','url(data:image/jpeg;base64,'+_b.b64encode(open(os.path.join(d,'tex','bois.jpg'),'rb').read()).decode()+')')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>')
def inl(m):
    typ,src=m.group(1) or "",m.group(2)
    code=open(os.path.join(d,src),encoding='utf-8').read().replace('</script','<\\/script')
    return f'<script{typ}>\n/* {src} */\n{code}\n</script>'
html=re.sub(r'<script( type="module")? src="([^"]+)"></script>',inl,html)
import glob,base64
blobs=''.join(f'<script type="text/plain" id="snd-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob(os.path.join(d,'snd','*.mp3'))))
html=html.replace('</body>',blobs+'</body>')
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(d,'..','build','bannieres.html')
os.makedirs(os.path.dirname(os.path.abspath(out)),exist_ok=True)
open(out,'w',encoding='utf-8').write(html)
print(out,len(html.encode())//1024,'Kio')
