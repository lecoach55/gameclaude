import struct,zlib,sys
def rd(f,ver):
    end,np,pl=struct.unpack('<III',f.read(12)) if ver<7500 else struct.unpack('<QQQ',f.read(24))
    nl=f.read(1)[0];name=f.read(nl).decode('latin1')
    if end==0:return None
    props=[]
    for _ in range(np):
        t=f.read(1).decode()
        if t=='Y':props.append(struct.unpack('<h',f.read(2))[0])
        elif t=='C':props.append(f.read(1)[0])
        elif t=='I':props.append(struct.unpack('<i',f.read(4))[0])
        elif t=='F':props.append(struct.unpack('<f',f.read(4))[0])
        elif t=='D':props.append(struct.unpack('<d',f.read(8))[0])
        elif t=='L':props.append(struct.unpack('<q',f.read(8))[0])
        elif t in 'fdlib':
            n,enc,cl=struct.unpack('<III',f.read(12));data=f.read(cl)
            if enc==1:data=zlib.decompress(data)
            fmt={'f':'f','d':'d','l':'q','i':'i','b':'b'}[t];sz=struct.calcsize(fmt)
            props.append(list(struct.unpack('<%d%s'%(n,fmt),data[:n*sz])))
        elif t in 'SR':
            n=struct.unpack('<I',f.read(4))[0];d=f.read(n);props.append(d.decode('latin1') if t=='S' else d)
    ch=[]
    while f.tell()<end:
        c=rd(f,ver)
        if c is None:break
        ch.append(c)
    f.seek(end);return (name,props,ch)
def load(p):
    f=open(p,'rb');f.read(23);ver=struct.unpack('<I',f.read(4))[0];top=[]
    while True:
        n=rd(f,ver)
        if n is None:break
        top.append(n)
    return ver,top
if __name__=='__main__':
    ver,top=load(sys.argv[1]);print(ver)
    for n in top:
        print(n[0],len(n[2]))
        if n[0]=='Objects':
            from collections import Counter
            print(Counter((c[0],c[1][1] if len(c[1])>1 and isinstance(c[1][1],str) else '') for c in n[2]))
