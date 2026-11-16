# Téléchargement de textures et modèles Poly Haven (CC0) : python3 ph_dl.py tex nom1,nom2 [1k|2k]  |  python3 ph_dl.py mod nom1,nom2 [1k]
# Les fichiers bruts vont dans /home/claude/ph (hors dépôt) ; les versions réduites utilisées par le jeu sont faites par tex3d.py / impostors.
import sys,os,json,urllib.request,concurrent.futures as cf
D='/home/claude/ph'
UA={'User-Agent':'gameclaude-bannieres/1.0 (Victor)'}
def ouvrir(u):return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=120)
def get(u,dst):
    if os.path.exists(dst) and os.path.getsize(dst)>0:return
    os.makedirs(os.path.dirname(dst),exist_ok=True);b=ouvrir(u).read();open(dst,'wb').write(b)
def files(n):return json.load(ouvrir('https://api.polyhaven.com/files/'+n))
def tex(n,res):
    f=files(n);out=[]
    for k,s in [('Diffuse','diff'),('nor_gl','nor'),('Rough','rough'),('Displacement','disp')]:
        if k in f and res in f[k]:
            e=f[k][res].get('jpg') or f[k][res].get('png');ext=e['url'].rsplit('.',1)[1];p=f'{D}/tex/{n}/{s}_{res}.{ext}';get(e['url'],p);out.append(p)
    return n,out
def mod(n,res):
    f=files(n);g=f['gltf'][res]['gltf'];base=f'{D}/mod/{n}/';get(g['url'],base+os.path.basename(g['url']))
    for rel,v in g['include'].items():get(v['url'],base+rel)
    return n,base
if __name__=='__main__':
    kind,names=sys.argv[1],sys.argv[2].split(',');res=sys.argv[3] if len(sys.argv)>3 else '1k'
    with cf.ThreadPoolExecutor(6) as ex:
        def un(n):
            try:return (tex if kind=='tex' else mod)(n,res)
            except Exception as e:return n,'ERREUR '+str(e)
        for r in ex.map(un,names):print(r[0],r[1] if isinstance(r[1],str) else len(r[1]))
