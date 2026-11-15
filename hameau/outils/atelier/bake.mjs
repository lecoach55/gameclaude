import {ALL,VC} from './models.mjs';import fs from 'fs';
const out={};let tot=0,bytes=0;
for(const [k,f] of Object.entries(ALL)){const m=f().bake();out[k]=m;tot+=m.verts;console.log(k.padEnd(10),'sommets',m.verts,'matériaux',m.parts.map(p=>p.m).join(','),'bbox',JSON.stringify(m.bbox));}
for(const [k,f] of Object.entries(VC)){const m=f();out[k]=m;tot+=m.verts;console.log(k.padEnd(10),'sommets',m.verts,'(couleurs de sommets)');}
const s=JSON.stringify(out);fs.writeFileSync(new URL('../../jeu/models.json',import.meta.url),s);console.log('total sommets',tot,'taille',(s.length/1024).toFixed(0),'Ko');
