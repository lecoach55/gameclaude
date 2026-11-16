#!/usr/bin/env python3
"""Assemble Cage & Gloire en UNE page autonome (hors ligne) : python3 build.py [sortie.html]"""
import re,sys,os,base64,subprocess
d=os.path.dirname(os.path.abspath(__file__));R=os.path.dirname(d)
nm=os.path.join(R,'node_modules')
if not os.path.isdir(nm):nm='/home/claude/mma/node_modules'
# 1) l'arène 3D (Three.js) en un seul script
subprocess.run([os.path.join(nm,'.bin','esbuild'),os.path.join(d,'arene.js'),'--bundle','--minify','--format=iife','--target=es2019','--outfile='+os.path.join(d,'arene.bundle.js'),'--log-level=warning'],check=True,cwd=os.path.dirname(nm))
html=open(os.path.join(d,'index.html'),encoding='utf-8').read()
css=open(os.path.join(d,'style.css'),encoding='utf-8').read()
f64=lambda p:base64.b64encode(open(p,'rb').read()).decode()
fonts=''
fs=os.path.join(nm,'@fontsource')
for fam,fn,w in [('Bebas Neue','bebas-neue/files/bebas-neue-latin-400-normal.woff2',400),('Inter','inter/files/inter-latin-400-normal.woff2',400),('Inter','inter/files/inter-latin-600-normal.woff2',600),('Inter','inter/files/inter-latin-800-normal.woff2',800)]:
    fonts+="@font-face{font-family:'%s';font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}\n"%(fam,w,f64(os.path.join(fs,fn)))
css=css.replace('/*FONTS*/',fonts)
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>')
def inl(m):
    src=m.group(1);code=open(os.path.join(d,src),encoding='utf-8').read().replace('</script','<\\/script')
    return '<script>\n/* %s */\n%s\n</script>'%(src,code)
html=re.sub(r'<script src="([^"]+)"></script>',inl,html)
html=html.replace('<body>','<body>\n<script type="text/plain" id="xbot">'+f64(os.path.join(d,'xbot.glb'))+'</script>',1)
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(R,'build','cage-et-gloire.html')
os.makedirs(os.path.dirname(os.path.abspath(out)),exist_ok=True)
open(out,'w',encoding='utf-8').write(html)
print(out,len(html.encode())//1024,'Kio')
