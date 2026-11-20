import bpy, math, random, sys, mathutils
random.seed(7)
OUT=sys.argv[-1] if sys.argv[-1].endswith('.png') else 'essai.png'
PEINT='--brut' not in sys.argv
bpy.ops.wm.read_homefile(use_empty=True)
sc=bpy.context.scene
def imp(m):
    before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f'm/{m}/{m}.gltf')
    new=[o for o in bpy.data.objects if o not in before]
    for o in new:
        for c in o.users_collection: c.objects.unlink(o)
    return {o.name:o for o in new if o.type=='MESH'}
def place(src,loc,rz=0,s=1):
    o=bpy.data.objects.new(src.name+'_i',src.data); o.location=loc; o.rotation_euler=(0,0,rz); o.scale=(s,s,s); sc.collection.objects.link(o); return o
# --- sol
bpy.ops.mesh.primitive_plane_add(size=320,location=(0,0,0)); sol=bpy.context.object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=160); bpy.ops.object.mode_set(mode='OBJECT')
tx=bpy.data.textures.new('relief','CLOUDS'); tx.noise_scale=38; tx.noise_depth=2
dm=sol.modifiers.new('d','DISPLACE'); dm.texture=tx; dm.strength=7; dm.mid_level=.5
def haut(x,y):
    # approximation : on lit la hauteur après modificateur
    return 0
bpy.ops.object.shade_smooth()
mat=bpy.data.materials.new('sol'); mat.use_nodes=True; nt=mat.node_tree; N=nt.nodes; L=nt.links
bsdf=N['Principled BSDF']; tc=N.new('ShaderNodeTexCoord'); mp=N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(320/22,320/22,1)
L.new(tc.outputs['UV'],mp.inputs[0])
herbe=N.new('ShaderNodeTexImage'); herbe.image=bpy.data.images.load('/home/claude/peint/aerial_grass_rock_Diffuse.jpg'); L.new(mp.outputs[0],herbe.inputs[0])
terre=N.new('ShaderNodeTexImage'); terre.image=bpy.data.images.load('/home/claude/peint/forrest_ground_01_Diffuse.jpg'); L.new(mp.outputs[0],terre.inputs[0])
nz=N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=4; nz.inputs['Detail'].default_value=6
cr=N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position=.6; cr.color_ramp.elements[1].position=.66
L.new(tc.outputs['UV'],nz.inputs['Vector']); L.new(nz.outputs['Fac'],cr.inputs[0])
mx=N.new('ShaderNodeMixRGB'); L.new(cr.outputs[0],mx.inputs[0]); L.new(herbe.outputs[0],mx.inputs[1]); L.new(terre.outputs[0],mx.inputs[2])
hsv=N.new('ShaderNodeHueSaturation'); hsv.inputs['Hue'].default_value=.56; hsv.inputs['Saturation'].default_value=.85; hsv.inputs['Value'].default_value=.95
L.new(mx.outputs[0],hsv.inputs['Color']); L.new(hsv.outputs[0],bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value=.95
nm=N.new('ShaderNodeTexImage'); nm.image=bpy.data.images.load('/home/claude/peint/aerial_grass_rock_nor_gl.jpg'); nm.image.colorspace_settings.name='Non-Color'; L.new(mp.outputs[0],nm.inputs[0])
nmap=N.new('ShaderNodeNormalMap'); nmap.inputs['Strength'].default_value=1.5; L.new(nm.outputs[0],nmap.inputs['Color']); L.new(nmap.outputs[0],bsdf.inputs['Normal'])
sol.data.materials.append(mat)
# --- eau : lac en contrebas
bpy.ops.mesh.primitive_plane_add(size=320,location=(0,0,-2.6)); eau=bpy.context.object
me=bpy.data.materials.new('eau'); me.use_nodes=True; b=me.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value=(.02,.07,.09,1); b.inputs['Roughness'].default_value=.06; b.inputs['Transmission Weight'].default_value=.6; b.inputs['IOR'].default_value=1.33
w=me.node_tree.nodes.new('ShaderNodeTexWave'); w.inputs['Scale'].default_value=60; bm=me.node_tree.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=.08
me.node_tree.links.new(w.outputs['Fac'],bm.inputs['Height']); me.node_tree.links.new(bm.outputs[0],b.inputs['Normal']); eau.data.materials.append(me)
# hauteurs réelles du sol (après déplacement) pour poser les objets
dg=bpy.context.evaluated_depsgraph_get(); se=sol.evaluated_get(dg)
def h(x,y):
    ok,loc,_,_=se.ray_cast(mathutils.Vector((x,y,100)),mathutils.Vector((0,0,-1)))
    return loc.z if ok else 0
# --- forteresse (Poly Haven modular_fort_01) sur une butte aplanie au centre
F=imp('modular_fort_01'); fz=max(h(0,0),h(15,15),h(-15,-15))+.3
T=F['modular_fort_01_tower_round']; W=F['modular_fort_01_wall_thick_straight_01']; G=F['modular_fort_01_wall_thin_gate_01']
def pl(src,x,y,rz=0,s=1):
    o=place(src,(0,0,0),rz,s); bpy.context.view_layer.update(); bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
    cx=sum(v.x for v in bb)/8; cy=sum(v.y for v in bb)/8; mz=min(v.z for v in bb)
    o.location=(x-cx,y-cy,fz-mz); return o
def plw(x,y,rz,long):
    o=pl(W,x,y,rz,1); o.scale=(.75,long/14.6,.75); bpy.context.view_layer.update()
    bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]; mz=min(v.z for v in bb)
    cx=sum(v.x for v in bb)/8; cy=sum(v.y for v in bb)/8; o.location.x+=x-cx; o.location.y+=y-cy; o.location.z+=fz-mz
for x,y in [(-10,-10),(10,-10),(-10,10),(10,10)]: pl(T,x,y,0,.52)
plw(-10,0,0,12.5); plw(10,0,0,12.5); plw(0,10,math.pi/2,12.5)
plw(-6.1,-10,math.pi/2,4.2); plw(6.1,-10,math.pi/2,4.2); pl(G,0,-10,math.pi/2,.75)
pl(T,0,2,0,.62)
# --- arbres, rochers, buissons
A=list(imp('island_tree_02').values())[0]; R=list(imp('rock_moss_set_01').values()); B=list(imp('boulder_01').values())[0]; Bu=list(imp('shrub_04').values())[0]
def libre(x,y): return math.hypot(x,y)>20
for cx,cy,n,rad in [(-38,8,45,14),(36,22,40,13),(30,-45,25,10),(-30,-48,20,9),(-55,25,60,22),(50,45,55,22),(70,-30,35,16),(-45,-50,30,14),(-95,-5,40,20),(15,75,40,22),(100,20,30,16)]:
    for i in range(n):
        x=cx+random.gauss(0,rad*.55); y=cy+random.gauss(0,rad*.55)
        if libre(x,y) and h(x,y)>-.6: place(A,(x,y,h(x,y)-.2),random.random()*6.3,random.uniform(2.2,3.6))
for i in range(40):
    x,y=random.uniform(-140,140),random.uniform(-110,110)
    if libre(x,y) and h(x,y)>-.8: place(random.choice(R),(x,y,h(x,y)-.3),random.random()*6.3,random.uniform(1.2,3.5))
for i in range(160):
    x,y=random.uniform(-140,140),random.uniform(-110,110)
    if libre(x,y) and h(x,y)>-.5: place(Bu,(x,y,h(x,y)),random.random()*6.3,random.uniform(4,9))
# --- chemin de terre depuis la porte
import bmesh
bmr=bmesh.new(); pts=[]
for i in range(70):
    y=-14-i*2.2; x=9*math.sin(i/9.0)+i*.35
    pts.append((x,y))
prev=None
for i,(x,y) in enumerate(pts):
    nx,ny=(pts[min(i+1,len(pts)-1)][0]-pts[max(i-1,0)][0]),(pts[min(i+1,len(pts)-1)][1]-pts[max(i-1,0)][1]); l=math.hypot(nx,ny) or 1
    px,py=-ny/l*2.6,nx/l*2.6
    a=bmr.verts.new((x+px,y+py,h(x+px,y+py)+.35)); b=bmr.verts.new((x-px,y-py,h(x-px,y-py)+.35))
    if prev: bmr.faces.new((prev[0],prev[1],b,a))
    prev=(a,b)
rm=bpy.data.meshes.new('route'); bmr.to_mesh(rm)
mr=bpy.data.materials.new('terre'); mr.use_nodes=True; nr=mr.node_tree; ti=nr.nodes.new('ShaderNodeTexImage'); ti.image=bpy.data.images.load('/home/claude/peint/forrest_ground_01_Diffuse.jpg')
tco=nr.nodes.new('ShaderNodeTexCoord'); mpp=nr.nodes.new('ShaderNodeMapping'); mpp.inputs['Scale'].default_value=(.15,.15,.15); nr.links.new(tco.outputs['Object'],mpp.inputs[0]); nr.links.new(mpp.outputs[0],ti.inputs[0])
br=nr.nodes.new('ShaderNodeBrightContrast'); br.inputs['Bright'].default_value=-.05; nr.links.new(ti.outputs[0],br.inputs[0]); nr.links.new(br.outputs[0],nr.nodes['Principled BSDF'].inputs['Base Color']); rm.materials.append(mr)
# --- lumière
wd=bpy.data.worlds.new('w'); sc.world=wd; wd.use_nodes=True; en=wd.node_tree.nodes.new('ShaderNodeTexEnvironment'); en.image=bpy.data.images.load('/home/claude/peint/ciel.hdr')
wd.node_tree.links.new(en.outputs[0],wd.node_tree.nodes['Background'].inputs[0]); wd.node_tree.nodes['Background'].inputs[1].default_value=.8
ld=bpy.data.lights.new('soleil','SUN'); ld.energy=4.2; ld.color=(1,.88,.72); ld.angle=math.radians(2)
lo=bpy.data.objects.new('soleil',ld); lo.rotation_euler=(math.radians(52),0,math.radians(-35)); sc.collection.objects.link(lo)
# --- caméra façon Heroes (vue plongeante oblique)
cd=bpy.data.cameras.new('c'); cd.lens=38; cam=bpy.data.objects.new('c',cd); sc.collection.objects.link(cam); sc.camera=cam
cam.location=(6,-88,72); cam.rotation_euler=(math.radians(50),0,math.radians(3))
sc.render.engine='CYCLES'; sc.cycles.samples=int([a for a in sys.argv if a.startswith('ech=')][0][4:]) if any(a.startswith('ech=') for a in sys.argv) else 40
sc.cycles.use_denoising=True; sc.cycles.max_bounces=4
sc.render.resolution_x=1280; sc.render.resolution_y=720
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
if PEINT:
    sc.use_nodes=True; ct=sc.node_tree if hasattr(sc,'node_tree') and sc.node_tree else None
    if ct is None:
        ct=bpy.data.node_groups.new('comp','CompositorNodeTree'); sc.compositing_node_group=ct
    for n in list(ct.nodes): ct.nodes.remove(n)
    rl=ct.nodes.new('CompositorNodeRLayers'); ku=ct.nodes.new('CompositorNodeKuwahara')
    try: ku.variation='ANISOTROPIC'
    except Exception: pass
    for k in ('Size','size'):
        if k in ku.inputs: ku.inputs[k].default_value=5
    try: ku.size=5
    except Exception: pass
    ct.links.new(rl.outputs['Image'],ku.inputs[0])
    try: out=ct.nodes.new('CompositorNodeComposite')
    except Exception:
        out=ct.nodes.new('NodeGroupOutput'); ct.interface.new_socket('Image',in_out='OUTPUT',socket_type='NodeSocketColor')
    ct.links.new(ku.outputs[0],out.inputs[0])
sc.render.filepath='/home/claude/peint/'+OUT
bpy.ops.render.render(write_still=True); print('FINI',OUT)
