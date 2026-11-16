# v36 : pistes du journal (16/11) : primes de Coupe affichées (Petit Poucet, bonus exploit), aide FFF Ligue 3 en ligne dédiée,
# derbys locaux (même département), leaders de vestiaire (affichage + événement).
import sys
p=sys.argv[1] if len(sys.argv)>1 else '/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a));s=s.replace(a,b)
# --- Coupe : gains notés dans le parcours ---
rep("S.cup.log.push({r:CUP_R[i],opp:opp.name,od,gf:d.gf,ga:d.ga,tab,win:true});","S.cup.log.push({r:CUP_R[i],opp:opp.name,od,gf:d.gf,ga:d.ga,tab,win:true,prime:CUP_PRIZE[i]});")
rep("if(i===5&&S.div<=2&&!S.cup.poucet){S.cup.poucet=true;fin('Coupe de France',5000);","if(i===5&&S.div<=2&&!S.cup.poucet){S.cup.poucet=true;fin('Coupe de France',5000);S.cup.log[S.cup.log.length-1].poucet=5000;")
rep("if(S.div<=3&&od>S.div){const bx=1500*(od-S.div);fin('Coupe de France',bx);","if(S.div<=3&&od>S.div){const bx=1500*(od-S.div);fin('Coupe de France',bx);S.cup.log[S.cup.log.length-1].exploit=bx;")
rep("  d.cupWin=win;\n  return d;\n}","  d.cupWin=win;\n  if(win){const g=S.cup.log[S.cup.log.length-1];d.comp+=' · '+cupGainTxt(g,true);}\n  return d;\n}")
rep("function vCoupe(){",r"""function cupGainTxt(l,long){if(!l||!l.win)return '';const t=[money(l.prime||0)+(long?' de prime':'')];if(l.poucet)t.push('Petit Poucet '+money(l.poucet));if(l.exploit)t.push('bonus exploit '+money(l.exploit));return '+'+t.join(' + ');}
function vCoupe(){""")
rep("""<td>${tc(l.opp)} <span class="muted">(${LV[l.od].n})</span></td><td class="r"><b class="${l.win?'good':'bad'}">${l.gf} - ${l.ga}</b>${l.tab?' <span class="muted">t.a.b. '+l.tab[0]+'-'+l.tab[1]+'</span>':''}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">Pas encore de match.</p>'}</div>""",
"""<td>${tc(l.opp)} <span class="muted">(${LV[l.od].n})</span>${l.win?'<div style="font-size:12px;margin-top:2px"><span class="good">+'+money((l.prime||0)+(l.poucet||0)+(l.exploit||0))+'</span>'+(l.poucet?' <span class="pill g" title="Club amateur qualifié pour les 32es : 5 000 €">Petit Poucet</span>':'')+(l.exploit?' <span class="pill y" title="Bonus exploit de la FFF : '+money(l.exploit)+'">Exploit</span>':'')+'</div>':''}</td><td class="r"><b class="${l.win?'good':'bad'}">${l.gf} - ${l.ga}</b>${l.tab?' <span class="muted">t.a.b. '+l.tab[0]+'-'+l.tab[1]+'</span>':''}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">Pas encore de match.</p>'}${(()=>{const g=(S.sf.inc||{})['Coupe de France']||0;return g?`<p class="muted" style="font-size:13px;margin:8px 0 0">Recettes de Coupe cette saison (primes, bonus et billetterie) : <b class="good">${money(g)}</b></p>`:'';})()}</div>""")
rep("""${i===11?' + 600 k€ de recette':''}</td></tr>`).join('')}</tbody></table></div></div></div>`;""",
"""${i===11?' + 600 k€ de recette':''}</td></tr>`).join('')}</tbody></table></div>
  ${S.div<=3?`<div style="display:grid;gap:6px;margin-top:10px;font-size:13px">${S.div<=2?`<div><span class="pill g">Petit Poucet</span> ${c.poucet?'<b class="good">obtenu ✓</b>':'si le club amateur atteint les 32es de finale'} : <b>5 000 €</b>, supporters +8 %, presse nationale.</div>`:''}<div><span class="pill y">Bonus exploit FFF</span> <b>1 500 €</b> par division d’écart en éliminant un club de division supérieure${(()=>{const n=c.log.filter(l=>l.exploit).length;return n?' · <b class="good">'+n+' obtenu'+(n>1?'s':'')+'</b>':'';})()}.</div></div>`:''}</div></div>`;""")
# calendrier : gains sur la ligne de Coupe
rep("""${lg.tab?' <span class="muted" style="font-size:12px">t.a.b.</span>':''}</td><td></td></tr>""",
    """${lg.tab?' <span class="muted" style="font-size:12px">t.a.b.</span>':''}</td><td class="r good" style="font-size:12px">${cupGainTxt(lg)}</td></tr>""")
# --- Aide FFF Ligue 3 : même montant total, ligne dédiée ---
rep("fin('Subventions',L.sub*S.subsidyMult/N);","if(S.div===4){fin('Subventions',L.sub*S.subsidyMult*.2/N);fin('Aide FFF (Ligue 3)',L.sub*S.subsidyMult*.8/N);}else fin('Subventions',L.sub*S.subsidyMult/N);")
rep("I('Subventions',L.sub*S.subsidyMult);","if(S.div===4){I('Subventions',L.sub*S.subsidyMult*.2);I('Aide FFF (Ligue 3)',L.sub*S.subsidyMult*.8);}else I('Subventions',L.sub*S.subsidyMult);")
# --- Derbys locaux : adversaires du même département (ou de la région pour les clubs pros) ---
rep("function vCoupe(){",r"""function derbyLocal(t){if(!t||t.user||t.derby||!S||!S.terr||!S.terr.dep)return false;if(t.local!=null)return t.local;
  let loc=false;const r=realFor(t.name);
  if(r){const c=r[1]&&commFind(r[1]);const reg=c?REGIONS[c[2]]:(REAL_EXTRA[r[0]]||{}).reg;loc=c?c[1]===S.terr.dep||(S.div>=4&&reg===S.terr.reg):S.div>=4&&reg===S.terr.reg;}
  else{const pf=PREF.find(x=>t.name.startsWith(x+' '));const c=pf&&commFind(t.name.slice(pf.length+1));loc=!!(c&&c[1]===S.terr.dep&&c[0]!==S.terr.n);}
  return t.local=loc;}
function vCoupe(){""",1)
rep("opp:{name:opp.name,rating:opp.rating,derby:!!opp.derby},comp:L.n+' · Journée '+(S.week+1)+(opp.derby?' · CHOC CONTRE LE RIVAL':'')",
    "opp:{name:opp.name,rating:opp.rating,derby:!!opp.derby,local:derbyLocal(opp)},comp:L.n+' · Journée '+(S.week+1)+(opp.derby?' · CHOC CONTRE LE RIVAL':derbyLocal(opp)?' · DERBY LOCAL':'')")
rep("rep.att=attendance(rep.opp,rep.opp.derby?1.4:1)","rep.att=attendance(rep.opp,rep.opp.derby?1.4:rep.opp.local?1.15:1)")
rep("""'Match nul contre le rival '+rep.opp.name+' : honneur sauf.',v>0?'g':v<0?'b':'');}""",
"""'Match nul contre le rival '+rep.opp.name+' : honneur sauf.',v>0?'g':v<0?'b':'');}
  else if(rep.opp.local){const v=rep.res==='V'?1:rep.res==='D'?-1:0;S.mood=clamp(S.mood+v*3,0,100);
    news((v>0?'Derby local remporté face à ':v<0?'Derby local perdu face à ':'Derby local sans vainqueur face à ')+rep.opp.name+(rep.home?' devant '+nf(rep.att)+' spectateurs'+(v>=0?', la buvette a tourné à plein.':'.'):v>0?' : les supporters ont fait le déplacement en nombre.':'.'),v>0?'g':v<0?'b':'');}""")
rep("""${o.derby?' <span class="pill b">Rival</span>':''}""","""${o.derby?' <span class="pill b">Rival</span>':derbyLocal(o)?' <span class="pill y" title="Club voisin : affluence et ambiance renforcées">Derby</span>':''}""")
# --- Leaders de vestiaire ---
rep("function weeklyUpdates(){",r"""function vestLeaders(){const c=captain();const yrs=p=>(p.hist||[]).filter(h=>h.own).length;
  return S.players.filter(p=>!p.loan&&!p.youth&&p!==c&&p.age>=24).map(p=>({p,sc:Math.min(p.age,33)*1.2+yrs(p)*4+p.ovr*.5})).sort((a,b)=>b.sc-a.sc).slice(0,2).map(x=>x.p);}
function weeklyUpdates(){""")
rep("""${p.id===S.captainId?' <span class="capt" title="Capitaine">C</span>':''}""","""${p.id===S.captainId?' <span class="capt" title="Capitaine">C</span>':vestLeaders().includes(p)?' <span class="capt ldr" title="Leader du vestiaire">L</span>':''}""")
rep(""" capitaine : son moral déteint sur le vestiaire</div>':''}""",""" capitaine : son moral déteint sur le vestiaire</div>':vestLeaders().includes(p)?'<div class="muted" style="font-size:12px"><span class="capt ldr">L</span> leader du vestiaire : le groupe l’écoute</div>':''}""")
rep(".capt{display:inline-grid;",".capt.ldr{background:#9fb3a6}\n.capt{display:inline-grid;")
rep("sponsorLocal:{w:3,",r"""leaderGrogne:{w:2,cond:()=>S.gw>4&&vestLeaders().some(p=>p.morale<40),make:()=>{const p=vestLeaders().filter(p=>p.morale<40)[0];return p?{pid:p.id}:null;},k:'Vestiaire',title:'Un leader du vestiaire grogne',
  text:d=>{const p=getP(d.pid);return `${pname(p)} (${p.age} ans), l’une des voix qui comptent dans le vestiaire, n’a plus le moral (${p.morale}/100). Ses coéquipiers l’écoutent : son humeur pourrait déteindre sur le groupe.`;},
  ch:[{t:'Le recevoir dans votre bureau',s:'Son moral remonte nettement',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale+15,0,100);return pname(p)+' se sent écouté.';}},
      {t:'Lui confier le rôle de relais auprès des jeunes',s:'Moral +8 pour lui, +1 pour le groupe',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale+8,0,100);S.players.forEach(x=>{if(x!==p&&!x.loan)x.morale=clamp(x.morale+1,0,100);});return pname(p)+' prend les jeunes sous son aile.';}},
      {t:'Laisser couler',s:'Le groupe risque de suivre',f:d=>{const p=getP(d.pid);p.morale=clamp(p.morale-5,0,100);S.players.forEach(x=>{if(x!==p&&!x.loan)x.morale=clamp(x.morale-2,0,100);});return 'La grogne de '+pname(p)+' gagne une partie du vestiaire.';}}]},
 sponsorLocal:{w:3,""")
rep("subvention ${money(L.sub*S.subsidyMult)}${L.tv?","subvention ${money(L.sub*S.subsidyMult)}${S.div===4?' (dont aide FFF '+money(L.sub*S.subsidyMult*.8)+')':''}${L.tv?")
open(p,'w').write(s);print('ok')
