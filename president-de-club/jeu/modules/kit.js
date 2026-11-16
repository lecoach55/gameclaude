
/* ====================== Maillots, écussons, emblèmes ====================== */
const KIT_PAT=['Uni','Rayures','Cerceaux','Moitié-moitié','Écharpe','Col et manches'];
const CREST_PAT=['Parti','Rayé','Bande','Chevron','Écartelé','Cerclé','Fascé','Plein'];
const CREST_EMB=['Initiales','Étoile','Ballon','Tour','Couronne','Vague','Éclair'];
function clubKit(){const k=S.club.kit||(S.club.kit={});const h=Math.abs(hashS(S.club.name||'club'));if(k.cr==null)k.cr=0;if(k.em==null)k.em=0;if(k.sh==null)k.sh=[0,1,2,3][h%4];return k;}
function emblemSVG(e,c){
  switch(e){
    case 1:return `<path d="M29 15l3.8 7.8 8.6 1.2-6.2 6 1.5 8.5L29 34.5l-7.7 4 1.5-8.5-6.2-6 8.6-1.2z" fill="${c}"/>`;
    case 2:return `<circle cx="29" cy="28" r="10" fill="#fff" stroke="#111" stroke-width="1.2"/><path d="M29 22.5l4.6 3.3-1.8 5.4h-5.6l-1.8-5.4z" fill="#111"/><path d="M29 22.5V18M33.6 25.8l4.2-1.5M31.8 31.2l2.6 3.7M26.2 31.2l-2.6 3.7M24.4 25.8l-4.2-1.5" stroke="#111" stroke-width="1.2"/>`;
    case 3:return `<path d="M20 38V22h3v3h3v-3h6v3h3v-3h3v16z" fill="${c}"/><rect x="27" y="31" width="4" height="7" rx="2" fill="#0008"/>`;
    case 4:return `<path d="M18 36l-2-14 7 6 6-9 6 9 7-6-2 14z" fill="${c}"/><rect x="18" y="36" width="22" height="3" fill="${c}"/>`;
    case 5:return `<path d="M15 26c4-4 7-4 10 0s7 4 10 0 7-4 9 0M15 33c4-4 7-4 10 0s7 4 10 0 7-4 9 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    case 6:return `<path d="M32 14l-10 15h6l-3 14 11-17h-6z" fill="${c}"/>`;
    default:return '';
  }
}
function crestSVG(c1,c2,ini,size,v,em){
  size=size||58;const id='cl'+(++CREST_N),sh='M4 4h50v28c0 16-12 26-25 31C16 58 4 48 4 32z';
  v=v||0;em=em||0;
  const pat=[`<rect width="58" height="66" fill="${c1}"/><path d="M29 0h29v66H29z" fill="${c2}" opacity=".92"/><rect y="22" width="58" height="14" fill="${c1}"/>`,
    `<rect width="58" height="66" fill="${c1}"/>${[10,24,38].map(x=>`<rect x="${x}" width="8" height="66" fill="${c2}"/>`).join('')}`,
    `<rect width="58" height="66" fill="${c1}"/><path d="M-4 18L40 70h18L10 6z" fill="${c2}"/>`,
    `<rect width="58" height="66" fill="${c1}"/><path d="M4 22l25 16 25-16v12L29 50 4 34z" fill="${c2}"/>`,
    `<rect width="58" height="66" fill="${c1}"/><path d="M29 0h29v32H29zM0 32h29v34H0z" fill="${c2}"/>`,
    `<rect width="58" height="66" fill="${c2}"/><circle cx="29" cy="30" r="17" fill="${c1}"/>`,
    `<rect width="58" height="66" fill="${c1}"/>${[12,28,44].map(y=>`<rect y="${y}" width="58" height="7" fill="${c2}"/>`).join('')}`,
    `<rect width="58" height="66" fill="${c1}"/><rect y="0" width="58" height="12" fill="${c2}"/>`][v%8];
  const ink=v===0||v===5?c2:'#fff';
  const txt=size>=34&&!em?`<text x="29" y="${v===3?20:33.5}" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="13" fill="${ink}" stroke="${c1}" stroke-width=".5" paint-order="stroke">${esc(ini)}</text>`:'';
  const emb=em?`<g ${size<30?'transform="translate(29 29) scale(1.15) translate(-29 -29)"':''} stroke="${c1}" stroke-width=".4" paint-order="stroke">${emblemSVG(em,v===5?c2:'#fff')}</g>`+(size>=44?`<text x="29" y="51" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="8" fill="#fff" stroke="${c1}" stroke-width="1.6" paint-order="stroke">${esc(ini)}</text>`:''):'';
  return `<svg viewBox="0 0 58 66" width="${size}" height="${Math.round(size*66/58)}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${sh}"/></clipPath></defs><g clip-path="url(#${id})">${pat}${emb}</g><path d="${sh}" fill="none" stroke="#e9efe5" stroke-opacity=".85" stroke-width="${size<30?3:2}"/>${txt}</svg>`;
}
// motif d'un maillot (dans un repère 32×32 pour les petites icônes, ou 120×120 pour la vitrine)
function kitPattern(p,c1,c2,s){
  const k=s/32;
  switch(p){
    case 1:return [7,13,19,25].map(x=>`<rect x="${(x-1.5)*k}" y="0" width="${3*k}" height="${s}" fill="${c2}"/>`).join('');
    case 2:return [9,16,23].map(y=>`<rect x="0" y="${(y-1.6)*k}" width="${s}" height="${3.2*k}" fill="${c2}"/>`).join('');
    case 3:return `<rect x="${16*k}" y="0" width="${16*k}" height="${s}" fill="${c2}"/>`;
    case 4:return `<path d="M${6*k} 0h${6*k}L${28*k} ${32*k}h-${6*k}z" fill="${c2}"/>`;
    case 5:return `<path d="M${10*k} ${2*k}h${12*k}l-${2*k} ${4*k}h-${8*k}z" fill="${c2}"/><path d="M0 ${6*k}l${7*k} ${7*k}V${4*k}zM${32*k} ${6*k}l-${7*k} ${7*k}V${4*k}z" fill="${c2}"/>`;
    default:return '';
  }
}
const SHIRT_D='M11 3 4 7l3 6 3-1.3V29h12V11.7l3 1.3 3-6-7-4c-1 2.4-2.7 3.5-5 3.5S12 5.4 11 3z';
function jersey(p,size){
  size=size||26;const n=shirtNo(p),c1=S.club.c1,c2=S.club.c2,gk=p.pos==='G';
  const body=gk?'#2b2f36':c1,ink=gk?'#f4c430':c2;const kp=gk?0:clubKit().sh;
  const id='jy'+(++CREST_N);const pat=size>=22&&kp?`<g clip-path="url(#${id})">${kitPattern(kp,body,ink,32)}</g>`:'';
  const numInk=hexLum(kp===1||kp===3?'#777':body)>.45?'#111':'#fff';
  return `<svg class="jersey" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${SHIRT_D}"/></clipPath></defs><path d="${SHIRT_D}" fill="${body}"/>${pat}<path d="${SHIRT_D}" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/><text x="16" y="22.5" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="11" fill="${kp?numInk:ink}" ${kp?`stroke="${body}" stroke-width=".8" paint-order="stroke"`:''}>${n}</text></svg>`;
}
// grand maillot de face, avec le sponsor maillot et l'écusson
function kitSVG(c1,c2,pat,sponsor,label){
  const id='kt'+(++CREST_N),s=120,sc=s/32;
  const sp=(sponsor||'').replace(/^(Concession automobile|Entreprise de|Supermarché|Boulangerie industrielle|Société de)\s+/i,'').slice(0,18);
  const lum=hexLum(c1),ink=lum>.45?'#111':'#fff';
  return `<figure class="kitfig"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${esc(label)}"><defs><clipPath id="${id}"><path transform="scale(${sc})" d="${SHIRT_D}"/></clipPath></defs>
   <path transform="scale(${sc})" d="${SHIRT_D}" fill="${c1}"/><g clip-path="url(#${id})">${kitPattern(pat,c1,c2,120)}</g>
   <path transform="scale(${sc})" d="${SHIRT_D}" fill="none" stroke="${c2}" stroke-width=".9" stroke-linejoin="round"/>
   <g transform="translate(70 30) scale(.24)">${crestSVG(c1,c2,initials(S.club.name),58,clubKit().cr,clubKit().em).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</g>
   ${sp?`<rect x="36" y="58" width="48" height="15" rx="2" fill="${ink==='#fff'?'#0006':'#fff8'}"/><text x="60" y="69" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="800" font-size="${sp.length>12?7:9}" fill="${ink}">${esc(sp.toUpperCase())}</text>`:''}
  </svg><figcaption>${esc(label)}</figcaption></figure>`;
}
function kitCard(){
  const k=clubKit(),c1=S.club.c1,c2=S.club.c2,sp=S.spons&&S.spons.maillot?S.spons.maillot.b:'';
  const sel=(id,arr,val,fn)=>`<label class="fld" style="margin:0">${id}<select onchange="${fn}(this.value)">${arr.map((n,i)=>`<option value="${i}" ${i===val?'selected':''}>${n}</option>`).join('')}</select></label>`;
  return `<div class="card"><header><h3>Maillots et écusson</h3>${sp?`<span class="muted" style="font-size:12.5px">Sponsor maillot : ${esc(sp)}</span>`:''}</header>
   <div class="kitrow">${crestSVG(c1,c2,initials(S.club.name),96,k.cr,k.em)}${kitSVG(c1,c2,k.sh,sp,'Domicile')}${kitSVG(c2,c1,k.sh,sp,'Extérieur')}</div>
   <div class="grid g3" style="gap:8px">${sel('Motif du maillot',KIT_PAT,k.sh,'A.kitSh')}${sel('Écusson',CREST_PAT,k.cr,'A.kitCr')}${sel('Emblème',CREST_EMB,k.em,'A.kitEm')}</div></div>`;
}
A.kitSh=v=>{clubKit().sh=+v;save();render();};
A.kitCr=v=>{clubKit().cr=+v;save();render();};
A.kitEm=v=>{clubKit().em=+v;save();render();};
