# Télécharge des cartes Poly Haven (diffuse/normal/rough/ao) à une résolution donnée
import json,sys,urllib.request,concurrent.futures as cf,os
o=urllib.request.build_opener();o.addheaders=[('User-Agent','valdragon-asset-tool/1.0')];urllib.request.install_opener(o)
def files(i): return json.load(urllib.request.urlopen('https://api.polyhaven.com/files/'+i,timeout=60))
def get(i,res='1k',maps=('Diffuse',),out='.'):
    f=files(i);r=[]
    for m in maps:
        k=m if m in f else {'Diffuse':'diff','Rough':'rough','AO':'AO','nor_gl':'nor_gl'}.get(m,m)
        if k not in f: k=[x for x in f if x.lower().startswith(m.lower()[:4])]; k=k[0] if k else None
        if not k: continue
        u=f[k][res]['jpg']['url'] if 'jpg' in f[k][res] else f[k][res]['png']['url']
        p=os.path.join(out,f'{i}_{m}.{u.split(".")[-1]}');urllib.request.urlretrieve(u,p);r.append(p)
    return r
if __name__=='__main__':
    ids=sys.argv[1].split(',');res=sys.argv[2] if len(sys.argv)>2 else '1k';maps=sys.argv[3].split(',') if len(sys.argv)>3 else ['Diffuse']
    with cf.ThreadPoolExecutor(8) as ex:
        for i,r in zip(ids,ex.map(lambda i:(lambda: get(i,res,maps))() ,ids)): print(i,r)

def model(i,res='1k',out='models'):
    """Télécharge un modèle Poly Haven (gltf + bin + textures) dans out/i/"""
    f=files(i);g=f['gltf'][res]['gltf'];d=os.path.join(out,i);os.makedirs(os.path.join(d,'textures'),exist_ok=True)
    urllib.request.urlretrieve(g['url'],os.path.join(d,i+'.gltf'))
    for rel,v in g.get('include',{}).items():
        p=os.path.join(d,rel);os.makedirs(os.path.dirname(p),exist_ok=True);urllib.request.urlretrieve(v['url'],p)
    return os.path.join(d,i+'.gltf')
