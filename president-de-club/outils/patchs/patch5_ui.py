p='/home/claude/president/index.html'; s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
def func(name,new):
    global s
    key='\nfunction '+name+'('
    i=s.index(key)+1; j=s.index('\n}\n',i)+3
    s=s[:i]+new.strip('\n')+'\n'+s[j:]

# ====================================================== CSS : habillage
rep("</style>", r"""
/* ===================== Habillage « soir de match » ===================== */
:root{
  --night:#09100c; --turf:#111c16; --turf2:#17251d; --line:#24372c; --line2:#1a2a21;
  --radius:14px; --c1:#1d6b3a; --c2:#ffffff;
  --shadow:0 1px 0 rgba(255,255,255,.04) inset,0 14px 34px -18px rgba(0,0,0,.75);
}
body{
  background:
    radial-gradient(1100px 480px at 50% -200px,rgba(244,196,48,.11),transparent 70%),
    radial-gradient(800px 520px at 105% -10%,color-mix(in srgb,var(--c1) 26%,transparent),transparent 70%),
    repeating-linear-gradient(90deg,rgba(255,255,255,.014) 0 96px,transparent 96px 192px),
    var(--night);
  background-attachment:fixed;
}
::selection{background:rgba(244,196,48,.35)}
*{scrollbar-width:thin;scrollbar-color:#2c4236 transparent}

/* en-tête aux couleurs du club */
.top{position:relative;border-bottom:0;padding-top:22px;
  background:linear-gradient(115deg,color-mix(in srgb,var(--c1) 34%,#0b130e) 0%,#0b130e 52%,#0a110d 100%)}
.top::before{content:'';position:absolute;inset:0 0 auto 0;height:5px;background:linear-gradient(90deg,var(--c1) 0 50%,var(--c2) 50% 100%)}
.top::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(244,196,48,.5),transparent)}
.crest{filter:drop-shadow(0 8px 16px rgba(0,0,0,.55))}
.ident h1{letter-spacing:.01em;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.ident .sub{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;letter-spacing:.06em}
.ident .sub span{padding:2px 9px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);font-size:11.5px}
.board{border-radius:14px;border-color:#1e3027;background:#050907 radial-gradient(rgba(255,255,255,.04) 1px,transparent 1.3px) 0 0/4px 4px;box-shadow:inset 0 2px 14px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.04)}
.board .cell{padding:11px 16px;border-right-color:#17241d}
.board .lab{display:flex;align-items:center;gap:6px}
.board .lab svg{width:13px;height:13px;flex:none}
.board .delta{font:700 11.5px var(--body);margin-left:6px;text-shadow:none;letter-spacing:0}
.board .delta.up{color:var(--good)}.board .delta.dn{color:var(--bad)}
.play{border-radius:14px;background:linear-gradient(180deg,#ffdb63,#efb51a);box-shadow:0 10px 28px -10px rgba(244,196,48,.75),inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(0,0,0,.12);padding:14px 26px}
.play:hover{box-shadow:0 12px 34px -8px rgba(244,196,48,.85),inset 0 1px 0 rgba(255,255,255,.55)}

/* onglets avec pictogrammes */
.tabs{background:rgba(9,16,12,.86);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);gap:2px;padding-top:6px;border-bottom-color:#1c2c23}
.tabs button{display:flex;align-items:center;gap:7px;border-radius:10px 10px 0 0;padding:10px 13px 11px;font-size:16px;transition:color .15s,background .15s}
.tabs button svg{width:16px;height:16px;flex:none;opacity:.8}
.tabs button.on{background:linear-gradient(180deg,rgba(244,196,48,.13),rgba(244,196,48,0));color:#fff;border-bottom-color:var(--flood)}
.tabs button.on svg{opacity:1;color:var(--flood)}

/* cartes */
.card{background:linear-gradient(180deg,#14221a 0%,#0f1914 100%);border-color:var(--line);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow)}
.card.hl{border-color:rgba(244,196,48,.5);box-shadow:var(--shadow),0 0 46px -22px rgba(244,196,48,.55)}
.card>header>h3,.card>h3{display:flex;align-items:center;gap:9px}
.card>header>h3::before,.card>h3::before{content:'';width:4px;height:17px;border-radius:2px;background:linear-gradient(180deg,var(--flood),#c68f00);flex:none}
.kicker{display:block}
main.enter>*{animation:rise .32s cubic-bezier(.2,.7,.2,1) both}
main.enter>*:nth-child(2){animation-delay:.04s}main.enter>*:nth-child(3){animation-delay:.08s}main.enter>*:nth-child(4){animation-delay:.12s}main.enter>*:nth-child(5){animation-delay:.16s}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* boutons */
.btn{border-radius:9px;background:#17261e;border-color:#2a3f33;transition:background .15s,border-color .15s,transform .06s}
.btn:hover{background:#1d3027;border-color:#3d5a49}
.btn:active{transform:translateY(1px)}
.btn.pri{background:linear-gradient(180deg,#ffd95e,#efb51a);border-color:#e9b11c;box-shadow:0 6px 16px -8px rgba(244,196,48,.8),inset 0 1px 0 rgba(255,255,255,.45)}
.btn.pri:hover{background:linear-gradient(180deg,#ffe07a,#f3bd2a)}
.btn.dan{background:#1c1311;border-color:#5a2621}
.btn.dan:hover{background:#2a1714;border-color:#8a3a31}
.choice{border-radius:12px;transition:border-color .15s,background .15s,transform .1s}
.choice:hover{background:#1c2e24;transform:translateX(2px)}

/* tableaux */
.tbl-wrap{border-radius:12px;border-color:var(--line2);background:#0c1510}
th{background:linear-gradient(180deg,#122019,#0f1a14);padding:10px 12px;font-size:10.5px;letter-spacing:.1em;position:sticky;top:0;z-index:1}
td{padding:9px 12px;border-bottom-color:#16241c}
tbody tr:nth-child(even)>td{background:rgba(255,255,255,.014)}
tbody tr:hover>td{background:rgba(255,255,255,.035)}
tr.me>td{background:linear-gradient(90deg,rgba(244,196,48,.18),rgba(244,196,48,.05))!important}
tr.zone-up>td:first-child{box-shadow:inset 4px 0 0 var(--good)}
tr.zone-down>td:first-child{box-shadow:inset 4px 0 0 var(--bad)}
.tc{display:inline-flex;align-items:center;gap:8px;vertical-align:middle}
.tc svg{flex:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}

/* petits éléments */
.pill{border-radius:999px;padding:2px 9px}
.pos{border-radius:5px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}
.form i{border-radius:5px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.15)}
.kpi{border-radius:12px;background:linear-gradient(180deg,#101c16,#0c150f);border-color:var(--line2)}
.kpi .v{line-height:1.1}
.alert{border-radius:10px;border-left-width:4px;padding:10px 12px}
.meter{height:6px;border-radius:3px}
.meter i{border-radius:3px}
.feed div{grid-template-columns:44px 1fr;align-items:baseline}
.feed b{display:inline-block;text-align:center;background:#0c1510;border:1px solid var(--line2);border-radius:6px;padding:1px 0}
.feed span.g{color:#bfe8cf}
.jersey{flex:none;vertical-align:middle;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
.pname{display:inline-flex;align-items:center;gap:8px}

/* match à venir */
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;text-align:center;padding:18px 10px 16px;border-radius:12px;border:1px solid var(--line2);
  background:radial-gradient(ellipse at 50% 120%,rgba(244,196,48,.10),transparent 60%),repeating-linear-gradient(90deg,rgba(255,255,255,.028) 0 34px,transparent 34px 68px),#0d1812}
.hero .team{display:grid;justify-items:center;gap:8px;min-width:0}
.hero .team b{font:800 19px/1 var(--display);text-transform:uppercase;letter-spacing:.02em;overflow-wrap:anywhere}
.hero .team.me b{color:var(--flood)}
.hero .mid{display:grid;justify-items:center;gap:4px}
.hero .mid .vs{font:900 30px/1 var(--display);color:var(--flood);text-shadow:0 0 18px rgba(244,196,48,.4)}
.hero .mid small{font-size:11.5px;color:var(--muted);white-space:nowrap}
.home-cols{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:16px;align-items:start}
.home-cols>div{display:grid;gap:16px;min-width:0}
@media (max-width:900px){.home-cols{grid-template-columns:1fr}}

/* modales et notifications */
.modal{background:rgba(3,6,4,.62);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
.mbox{border-radius:20px;background:linear-gradient(180deg,#16251c,#0f1913);box-shadow:0 30px 80px -20px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.04);position:relative;animation:pop .24s cubic-bezier(.2,.7,.2,1)}
.mbox::before{content:'';position:absolute;left:24px;right:24px;top:0;height:3px;border-radius:0 0 4px 4px;background:linear-gradient(90deg,var(--c1),var(--flood),var(--c2))}
@keyframes pop{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
.toast{border-radius:12px;background:rgba(6,10,8,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-color:rgba(244,196,48,.6);animation:tin .25s ease-out;display:flex;gap:10px;align-items:center}
.toast::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--flood);box-shadow:0 0 10px var(--flood);flex:none}
@keyframes tin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.scoreboard{border-radius:14px;background:#040705 radial-gradient(rgba(255,255,255,.04) 1px,transparent 1.3px) 0 0/4px 4px;box-shadow:inset 0 2px 16px rgba(0,0,0,.8)}
.scoreboard .tn{display:grid;justify-items:center;gap:8px}

/* écran d'accueil */
.start{background:radial-gradient(900px 500px at 50% 0,rgba(244,196,48,.10),transparent 70%)}
.start .card{padding:22px}
.preview{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:12px;background:#0c1510;border:1px solid var(--line2)}
.preview b{font:900 26px/1 var(--display);text-transform:uppercase}

@media (max-width:640px){
  .ident .sub span{font-size:10.5px;padding:1px 7px}
  .tabs button{padding:9px 10px 10px;font-size:15px}
  .hero .team b{font-size:16px}
  .hero .mid .vs{font-size:24px}
  .card{padding:15px}
}
@media (prefers-reduced-motion:reduce){main.enter>*,.mbox,.toast{animation:none!important}}
</style>""")

# ====================================================== pictogrammes
rep("let CREST_N=0;", r"""let CREST_N=0;
const ICO={
 accueil:'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
 calendrier:'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
 classement:'M4 20v-8 M10 20V5 M16 20v-6 M3 20h18',
 stats:'M4 19l5-6 4 3 7-9 M15 7h5v5',
 effectif:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.6a3.5 3.5 0 0 1 0 6.3 M18 14.2c2.3.7 3.6 2.9 3.6 5.8',
 mercato:'M4 8h15l-4-4 M20 16H5l4 4',
 staff:'M9 3h6v3H9z M7 4.5H5V21h14V4.5h-2 M9 11h6 M9 15h4',
 infra:'M2 20h20 M4 20V9l8-4 8 4v11 M9 20v-5h6v5 M8 11h8',
 finances:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M15.5 8.8a4 4 0 1 0 0 6.4 M7.5 11h6 M7.5 13.5h6',
 coupe:'M7 4h10v5a5 5 0 0 1-10 0z M7 6H4a3 3 0 0 0 3.5 4 M17 6h3a3 3 0 0 1-3.5 4 M12 14v4 M8 21h8 M9 18h6',
 club:'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
 users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 4.6a3.5 3.5 0 0 1 0 6.3 M18 14.2c2.3.7 3.6 2.9 3.6 5.8'
};
const ico=(k,sz)=>`<svg viewBox="0 0 24 24" width="${sz||16}" height="${sz||16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICO[k]}"/></svg>`;
function hashS(t){let h=2166136261;for(const ch of t){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h;}
function initials(name){return name.split(' ').filter(w=>w.length>2||/^[A-Z]{2,}$/.test(w)).map(w=>w[0]).join('').slice(0,3).toUpperCase()||'FC';}
function crestSVG(c1,c2,ini,size,v){
  size=size||58;const id='cl'+(++CREST_N),sh='M4 4h50v28c0 16-12 26-25 31C16 58 4 48 4 32z';
  const pat=[`<rect width="58" height="66" fill="${c1}"/><path d="M29 0h29v66H29z" fill="${c2}" opacity=".92"/><rect y="22" width="58" height="14" fill="${c1}"/>`,
    `<rect width="58" height="66" fill="${c1}"/>${[10,24,38].map(x=>`<rect x="${x}" width="8" height="66" fill="${c2}"/>`).join('')}`,
    `<rect width="58" height="66" fill="${c1}"/><path d="M-4 18L40 70h18L10 6z" fill="${c2}"/>`,
    `<rect width="58" height="66" fill="${c1}"/><path d="M4 22l25 16 25-16v12L29 50 4 34z" fill="${c2}"/>`][v||0];
  const txt=size>=34?`<text x="29" y="${v===3?20:33.5}" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="13" fill="${v===0?c2:'#fff'}" stroke="${c1}" stroke-width=".5" paint-order="stroke">${esc(ini)}</text>`:'';
  return `<svg viewBox="0 0 58 66" width="${size}" height="${Math.round(size*66/58)}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${sh}"/></clipPath></defs><g clip-path="url(#${id})">${pat}</g><path d="${sh}" fill="none" stroke="#e9efe5" stroke-opacity=".85" stroke-width="${size<30?3:2}"/>${txt}</svg>`;
}
function teamLook(name){
  if(S&&name===S.club.name)return [S.club.c1,S.club.c2,0];
  const h=hashS(name),c=COLORS[h%COLORS.length];return (h>>5)&1?[c[0],c[1],(h>>7)%4]:[c[0],c[1],(h>>7)%4];
}
function teamCrest(name,size){const [a,b,v]=teamLook(name);return crestSVG(a,b,initials(name),size,v);}
function tc(name,size){return `<span class="tc">${teamCrest(name,size||18)}<span>${esc(name)}</span></span>`;}
const NUMS={G:[1,16,30,40],D:[2,3,4,5,12,13,15,22,23,24,25,32],M:[6,8,10,14,17,18,19,20,21,26,27,28],A:[7,9,11,29,33,39,44]};
function shirtNo(p){
  if(p.num)return p.num;const used=new Set(S.players.map(x=>x.num).filter(Boolean));
  p.num=NUMS[p.pos].find(n=>!used.has(n))||[...Array(99).keys()].map(k=>k+1).find(n=>!used.has(n))||99;return p.num;
}
function jersey(p,size){
  size=size||26;const n=shirtNo(p),c1=S.club.c1,c2=S.club.c2,gk=p.pos==='G';
  const body=gk?'#2b2f36':c1,ink=gk?'#f4c430':c2;
  return `<svg class="jersey" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><path d="M11 3 4 7l3 6 3-1.3V29h12V11.7l3 1.3 3-6-7-4c-1 2.4-2.7 3.5-5 3.5S12 5.4 11 3z" fill="${body}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/><text x="16" y="22.5" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="11" fill="${ink}">${n}</text></svg>`;
}""")

# le blason du club passe par crestSVG
func('crest', r"""
function crest(c1,c2,name,size){return crestSVG(c1,c2,initials(name),size,0);}
""")

# ====================================================== en-tête
rep("""    <div class="ident"><h1>${esc(S.club.name)}</h1><div class="sub">${L.n} · ${esc(S.statut)} · Saison ${seasonLabel(S.year)}</div></div>""",
    """    <div class="ident"><h1>${esc(S.club.name)}</h1><div class="sub"><span>${L.n}</span><span>${esc(S.statut)}</span><span>Saison ${seasonLabel(S.year)}</span></div></div>""")
open(p,'w').write(s); print('ok part1')
