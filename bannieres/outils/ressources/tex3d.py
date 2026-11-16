# Textures réalistes du rendu 3D à partir des téléchargements Poly Haven (CC0, voir ph_dl.py) : python3 tex3d.py
# Écrit jeu/tex3d/<nom>.jpg (512 px, réglages de teinte pour garder des terrains lisibles) ; les *_n.jpg sont des cartes de relief (normal maps).
import os,numpy as np
from PIL import Image,ImageEnhance
PH='/home/claude/ph/tex';OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../jeu/tex3d');os.makedirs(OUT,exist_ok=True)
def charge(n,k='diff',S=512):
    import glob
    f=glob.glob(f'{PH}/{n}/{k}_*')[0];return Image.open(f).convert('RGB').resize((S,S),Image.LANCZOS)
def regle(im,sat=1,lum=1,con=1,teinte=None,melange=None):
    if teinte is not None:
        a=np.asarray(im,dtype=np.float32);t=np.array(teinte,dtype=np.float32);g=a.mean(2,keepdims=True)
        a=a*(1-melange)+g*t/np.array(255.)*melange*1.0*255/np.maximum(1,t.mean())*t.mean()/255;im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    if sat!=1:im=ImageEnhance.Color(im).enhance(sat)
    if con!=1:im=ImageEnhance.Contrast(im).enhance(con)
    if lum!=1:im=ImageEnhance.Brightness(im).enhance(lum)
    return im
def teinter(im,rgb,force):# multiplie vers une couleur (garde le détail)
    a=np.asarray(im,dtype=np.float32)/255;l=a.mean(2,keepdims=True);c=np.array(rgb,dtype=np.float32)/255
    b=a*(1-force)+(l/np.maximum(.05,l.mean()))*c*force;return Image.fromarray(np.clip(b*255,0,255).astype(np.uint8))
L={
 # sols (ordre des couches du shader : herbe terre rude neige sable marais lave fond route)
 'sol_herbe':lambda:regle(teinter(charge('rocky_terrain_02'),(92,128,52),.25),sat=1.1,lum=1.1),
 'sol_terre':lambda:regle(charge('dry_ground_rocks'),sat=.95,lum=.95),
 'sol_rude':lambda:regle(teinter(charge('rocky_trail'),(150,132,104),.3),lum=.95),
 'sol_neige':lambda:regle(charge('snow_field_aerial'),lum=1.12,sat=.8),
 'sol_sable':lambda:regle(teinter(charge('aerial_sand'),(214,180,118),.45),lum=1.02),
 'sol_marais':lambda:regle(teinter(charge('brown_mud_leaves_01'),(66,78,44),.45),lum=.8),
 'sol_lave':lambda:regle(charge('burned_ground_01'),lum=.7,sat=.8),
 'sol_fond':lambda:regle(teinter(charge('coast_sand_01'),(120,112,84),.4),lum=.85),
 'sol_route':lambda:regle(teinter(charge('grass_path_3'),(170,140,100),.35),lum=1.05),
 # roches et neige des montagnes
 'roche':lambda:regle(charge('mossy_rock'),sat=.8),'roche_n':lambda:charge('mossy_rock','nor'),
 'roche2':lambda:regle(charge('rock_face_03'),sat=.85),'roche2_n':lambda:charge('rock_face_03','nor'),
 'neige':lambda:regle(charge('snow_02'),lum=1.08),
 # bâtiments
 'mur':lambda:charge('castle_wall_varriation'),'mur_n':lambda:charge('castle_wall_varriation','nor'),
 'mur2':lambda:charge('stone_wall'),'mur2_n':lambda:charge('stone_wall','nor'),
 'ardoise':lambda:regle(charge('roof_slates_02'),lum=1.1),'ardoise_n':lambda:charge('roof_slates_02','nor'),
 'tuile':lambda:charge('clay_roof_tiles_02'),'chaume':lambda:regle(charge('thatch_roof_angled'),lum=1.25,sat=1.1),
 'bois':lambda:regle(teinter(charge('brown_planks_05'),(130,96,62),.6),lum=.95),'ecorce':lambda:charge('pine_bark'),
}
for n,f in L.items():
    im=f();q=80 if n.endswith('_n') else 82;p=os.path.join(OUT,n+'.jpg');im.save(p,'JPEG',quality=q,optimize=True);print(n,os.path.getsize(p)//1024,'Kio')
