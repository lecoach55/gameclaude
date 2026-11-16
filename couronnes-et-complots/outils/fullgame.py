# partie humaine complète par de vrais clics : humain contre 2 IA faciles, vitesse rapide
from playwright.sync_api import sync_playwright
import random
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':860}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/gameclaude/couronnes-et-complots/jeu/couronnes-et-complots.html'); pg.wait_for_timeout(500)
    pg.select_option('#np','3'); pg.select_option('#pa1','facile'); pg.select_option('#pa2','facile'); pg.click('#go')
    pg.select_option('#speed','90')
    stuck=0; turns=0; last=None
    for step in range(3000):
        pg.wait_for_timeout(120)
        if pg.locator('#modal:not(.hidden)').count():
            btns=pg.locator('#mbox .btns button')
            if 'Rejouer' in pg.locator('#mbox').inner_text(): print('FIN :', pg.locator('#mbox h2').inner_text()); break
            btns.last.click(); continue
        st=pg.evaluate("()=>({ai:cur().ai,ph:S.phase,over:S.over,round:S.round,reinf:S.reinf,pending:!!S.pending,busy:S.busy})")
        if st['over']: print('fin sans modale'); break
        if st['ai'] or st['busy']: continue
        key=(st['round'],st['ph'],st['reinf'],st['pending'])
        stuck = stuck+1 if key==last else 0; last=key
        if stuck>40: print('BLOCAGE', st); break
        if st['ph']=='politique':
            turns+=1
            if pg.locator('[data-vote="pour"]').count(): pg.click('[data-vote="pour"]')
            elif pg.locator('#toReinf').count(): pg.click('#toReinf')
        elif st['ph']=='renforts':
            if pg.locator('#autoPlace:not([disabled])').count(): pg.click('#autoPlace')
            else: pg.click('#toAttack')
        elif st['ph']=='attaque':
            if st['pending']: pg.click('#occOk'); continue
            if pg.locator('#roll').count(): pg.click('#blitz'); pg.wait_for_timeout(400); continue
            mv=pg.evaluate("()=>{for(const f of ownedBy(S.cur)){if(S.t[f].a<3)continue;for(const t of ADJ[f]){if(canAttack(f,t)&&conquestOdds(f,t).p>.6)return [f,t]}}return null}")
            if mv and random.random()<.95:
                # clics réels sur les blasons
                pg.locator('#tokens .tok').nth(mv[0]).click(force=True); pg.wait_for_timeout(60)
                pg.locator('#tokens .tok').nth(mv[1]).click(force=True)
            else: pg.click('#toMove')
        elif st['ph']=='manoeuvre':
            pg.click('#endT')
    print('tours humains', turns, 'erreurs', errs)
    pg.screenshot(path='g_full_end.png'); b.close()
