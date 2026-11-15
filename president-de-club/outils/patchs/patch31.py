f='/home/claude/president/index.html';s=open(f).read()
a="const cm=c?(c.lvl-2)*1.4+(c.form===S.tactic.formation?1.5:0)"
assert s.count(a)==1
s=s.replace(a,"const cm=c?(c.lvl-COACH_TYP[S.div])*1.4+(c.form===S.tactic.formation?1.5:0)")
a="function strength(xi){"
assert s.count(a)==1
s=s.replace(a,"// niveau d'entraîneur « normal » dans chaque division : un 5 étoiles fait la différence en N2, beaucoup moins en Ligue 1 où tous les clubs en ont un bon\nconst COACH_TYP=[2,2,2,2.5,3,3.5,4];\n"+a)
open(f,'w').write(s);print('ok')
