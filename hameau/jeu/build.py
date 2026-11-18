import os,re,sys
D=os.path.dirname(os.path.abspath(__file__))
OUT=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,'..','..','hameau3d.html') if not os.path.exists(os.path.join(D,'..','..','outils-communs')) else os.path.join(D,'hameau3d.html')
COMMUNS=os.environ.get('COMMUNS') or next((p for p in [os.path.join(D,'..','..','outils-communs'),'/home/claude/gameclaude/outils-communs'] if os.path.exists(p)),None)
s=open(os.path.join(D,'game.html')).read()
s=s.replace('/*SIM*/',open(os.path.join(D,'sim.js')).read())
s=s.replace('/*MODELS*/','const MODELS='+open(os.path.join(D,'models.json')).read()+';')
tk=open(os.path.join(COMMUNS,'testkit.js')).read().replace('export function Testkit','function Testkit')
s=s.replace('/*TESTKIT*/',tk)
s=s.replace('/*CHARTE*/',open(os.path.join(D,'charte.js')).read())
import base64
s=s.replace('/*PAVES*/','data:image/jpeg;base64,'+base64.b64encode(open(os.path.join(D,'paves.jpg'),'rb').read()).decode())  # Poly Haven cobblestone_floor_04 (CC0), 512²
s=s.replace('/*TESTSAVE*/null',open(os.path.join(D,'test_save.json')).read().strip())
open(OUT,'w').write(s);print('construit',OUT,len(s)//1024,'Ko')
