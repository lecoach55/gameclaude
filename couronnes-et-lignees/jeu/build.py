h=open('ui2.html').read()
h=h.replace('/*ENGINE*/',open('engine.js').read()).replace('/*ART*/',open('art.js').read()).replace('/*FONTS*/',open('fonts.css').read()).replace('/*APP*/',open('three.js').read()+'\n'+open('tex3d.js').read()+'\n'+open('rendu3d.js').read()+'\n'+open('app.js').read()).replace('/*SIM*/',open('sim.js').read())
open('index.html','w').write(h)
