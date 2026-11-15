import json,statistics as S
rec=json.load(open('/tmp/feet.json'))
for HI in range(3):
    out=[]
    for k in ('LeftFoot','RightFoot'):
        rel=[]
        for a,b in zip(rec,rec[1:]):
            pa,pb=a['party'][HI],b['party'][HI];dt=b['dt'] or 1/60
            dx,dz=pb['x']-pa['x'],pb['z']-pa['z'];sp=(dx*dx+dz*dz)**.5/dt
            if sp<3:continue
            ux,uz=dx/dt/sp,dz/dt/sp
            fa={f[0]:f for f in pa['f']};fb={f[0]:f for f in pb['f']}
            vx=(fb[k][1]-fa[k][1])/dt-dx/dt;vz=(fb[k][3]-fa[k][3])/dt-dz/dt
            rel.append((vx*ux+vz*uz)/sp)
        back=[r for r in rel if r<0]
        out.append('%s retour relatif moyen %.2f×vitesse (%.0f%% du temps)'%(k,-S.mean(back),100*len(back)/len(rel)))
    print('héros',HI,' | '.join(out))
