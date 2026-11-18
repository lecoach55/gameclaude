import {Delaunay} from 'd3-delaunay';
import fs from 'fs';
import {createRequire} from 'module'; const require=createRequire(import.meta.url);
const {buildMap,TERR,REGIONS}=require('./mapgen.js');
const m=buildMap(Delaunay);
const RINGS=process.env.RINGS!=='0';
if(RINGS){m.paths=m.rings;}
const map=`const TERR=${JSON.stringify(TERR.map(t=>({n:t.n,r:t.r})))};\nconst REGIONS=${JSON.stringify(REGIONS.map(r=>({name:r.name,bonus:r.bonus})))};\nconst MAP=${JSON.stringify({paths:m.paths,centers:m.centers,adj:m.adj,routes:m.routes,inner:m.inner,outlines:m.outlines,glyphs:m.glyphs,rlabels:m.rlabels,region:m.region,coast:m.coast,landRings:m.landRings})};\nconst ADJ=MAP.adj;`;
let html=fs.readFileSync('./src.html','utf8');
html=html.replace('/*__MAP__*/',()=>map).replace('/*__TESTKIT__*/',()=>fs.readFileSync('../../outils-communs/testkit.js','utf8').replace(/^export /gm,'')).replace('__GRAIN__',()=>'data:image/webp;base64,'+fs.readFileSync('./grain.webp').toString('base64')).replace('/*__GAME__*/',()=>fs.readFileSync('./game.js','utf8'));
fs.writeFileSync('./couronnes-et-complots.html',html);
console.log(html.length);
