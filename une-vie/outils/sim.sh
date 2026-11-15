# Non-régression du moteur de jeu : sh sim.sh 2000 [random|smart|f:Équilibre]
D=$(dirname "$0")
python3 -c "
import sys;s=open('$D/../build/index.html').read();i=s.rfind('<script>');j=s.rfind('</script>');open('/tmp/vie_game.js','w').write(s[i+8:j])"
node $D/harness.js /tmp/vie_game.js ${1:-2000} ${2:-random}
