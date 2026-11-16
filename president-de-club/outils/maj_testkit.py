# Recopie outils-communs/testkit.js (sans « export ») entre /*TESTKIT-DEBUT*/ et /*TESTKIT-FIN*/ dans jeu/index.html,
# et garde une copie jeu/testkit.js (repérée par bureau.py). Usage : python3 outils/maj_testkit.py [index.html]
import sys,os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p=sys.argv[1] if len(sys.argv)>1 else os.path.join(R,'jeu','index.html')
tk=open(os.path.join(R,'..','outils-communs','testkit.js'),encoding='utf-8').read()
tk=re.sub(r'^export ','',tk,flags=re.M)
assert '</script' not in tk
open(os.path.join(R,'jeu','testkit.js'),'w',encoding='utf-8').write(tk)
s=open(p,encoding='utf-8').read()
a,b=s.index('/*TESTKIT-DEBUT*/'),s.index('/*TESTKIT-FIN*/')
s=s[:a]+'/*TESTKIT-DEBUT*/\n'+tk.strip()+'\n'+s[b:]
open(p,'w',encoding='utf-8').write(s);print('testkit intégré :',len(tk),'car.')
