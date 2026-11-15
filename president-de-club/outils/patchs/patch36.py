f='/home/claude/president/index.html';s=open(f).read()
i=s.index("function livePos(form,away){");j=s.index("function liveMsg(M,t){")
s=s[:i]+open('/home/claude/t/live2.js').read()+s[j:]
a="}else{r.pause=k==='ht'?12:5;liveMsg(r.live,"
assert s.count(a)==1
s=s.replace(a,"}else{r.pause=k==='ht'?12:k==='occ'||k==='save'?9:5;if(k==='occ'||k==='save')liveChance(r.live,k,r.d.home);liveMsg(r.live,")
open(f,'w').write(s);print('ok')
