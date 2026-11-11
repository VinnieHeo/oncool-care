/* 온앤쿨케어 서류 스캔: 카메라·사진첩 → 모서리 맞추기 → 펴기·보정 → 여러 장 담기 (2026-11-11)
   SCAN.open({title, from:"cam"|"lib", onDone(blobs)}) · SCAN.pdf(pages) */
window.SCAN=(function(){
const A4=Math.SQRT2;
const css=`.scn{position:fixed;inset:0;z-index:1000;background:rgba(9,12,22,.72);display:flex;align-items:stretch;justify-content:center}
.scn-p{background:var(--bg,#f1f3fa);color:var(--ink,#141a2e);width:100%;max-width:560px;display:flex;flex-direction:column;min-height:0;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
.scn-h{display:flex;align-items:center;gap:10px;padding:12px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));background:var(--surface,#fff);border-bottom:1px solid var(--line,#e6e9f2)}
.scn-h b{font-size:16px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.scn-h button{border:0;background:var(--soft,#f6f7fb);color:var(--ink,#141a2e);font:inherit;font-weight:700;border-radius:10px;padding:8px 12px;cursor:pointer}
.scn-b{flex:1;overflow:auto;padding:14px max(16px,env(safe-area-inset-right,0px)) 14px max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:12px}
.scn-tip{font-size:13.5px;color:var(--mute,#697189);margin:0;line-height:1.5}
.scn-st{background:#20263a;border-radius:14px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;position:relative}
.scn-st canvas{display:block;width:100%;height:auto}
.scn-row{display:flex;gap:8px;flex-wrap:wrap}
.scn .sb{font:inherit;font-size:14px;font-weight:700;border-radius:12px;padding:11px 14px;border:1px solid var(--line,#e6e9f2);background:var(--surface,#fff);color:var(--ink,#141a2e);cursor:pointer}
.scn .sb.pri{background:linear-gradient(180deg,#6a80f2,#4a5ee0);color:#fff;border-color:transparent}
.scn .sb.grow{flex:1}.scn .sb:disabled{opacity:.5}
.scn .sb:focus-visible,.scn-ch button:focus-visible{outline:3px solid #4a63e7;outline-offset:2px}
.scn-ch{display:inline-flex;background:var(--soft,#f6f7fb);border:1px solid var(--line,#e6e9f2);border-radius:12px;padding:3px;gap:2px}
.scn-ch button{border:0;background:none;font:inherit;font-size:13px;font-weight:700;color:var(--mute,#697189);padding:7px 12px;border-radius:9px;cursor:pointer}
.scn-ch button[aria-pressed="true"]{background:var(--surface,#fff);color:var(--pri,#4a63e7);box-shadow:0 1px 3px rgba(23,33,79,.14)}
.scn-pp{background:#e9ebf1;border-radius:14px;padding:10px;display:grid;place-items:center}
.scn-pp img{max-height:58vh;max-width:100%;width:auto;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.scn-m{font-size:12px;color:var(--mute,#697189);font-weight:700}
.scn-pg{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.scn-pg div{position:relative;flex:none;width:70px}
.scn-pg img{width:70px;height:99px;object-fit:contain;background:#fff;border-radius:6px;border:1px solid var(--line,#e6e9f2)}
.scn-pg span{display:block;text-align:center;font-size:11px;color:var(--mute,#697189);font-weight:700}
.scn-pg button{position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:0;background:#e0603a;color:#fff;font-weight:800;cursor:pointer}
.scn-f{display:flex;flex-direction:column;gap:8px;padding:10px max(16px,env(safe-area-inset-right,0px)) 12px max(16px,env(safe-area-inset-left,0px));background:var(--surface,#fff);border-top:1px solid var(--line,#e6e9f2)}
.scn-busy{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,13,22,.55);color:#fff;font-weight:700}
.scn [hidden]{display:none!important}
.upls{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.upl.pri{background:var(--pri,#4a63e7);color:#fff;border-style:solid;font-weight:700}.pdfrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0 8px}`;
let st=null;
function el(h){const d=document.createElement("div");d.innerHTML=h.trim();return d.firstChild}
function ensureCss(){if(document.getElementById("scn-css"))return;const s=document.createElement("style");s.id="scn-css";s.textContent=css;document.head.appendChild(s)}

/* ---- 영상 처리 ---- */
function blur(a,w,h,r){const o=new Float32Array(a.length),t=new Float32Array(a.length);for(let y=0;y<h;y++){let s=0,c=0;for(let x=-r;x<w;x++){if(x+r<w){s+=a[y*w+x+r];c++}if(x-r-1>=0){s-=a[y*w+x-r-1];c--}if(x>=0)t[y*w+x]=s/c}}for(let x=0;x<w;x++){let s=0,c=0;for(let y=-r;y<h;y++){if(y+r<h){s+=t[(y+r)*w+x];c++}if(y-r-1>=0){s-=t[(y-r-1)*w+x];c--}if(y>=0)o[y*w+x]=s/c}}return o}
function detect(c){const s=Math.min(1,360/Math.max(c.width,c.height)),w=Math.max(8,Math.round(c.width*s)),h=Math.max(8,Math.round(c.height*s));
  const t=document.createElement("canvas");t.width=w;t.height=h;const tx=t.getContext("2d");tx.drawImage(c,0,0,w,h);const d=tx.getImageData(0,0,w,h).data,N=w*h;
  const g=new Float32Array(N);for(let i=0;i<N;i++)g[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];const b=blur(g,w,h,3);
  const hist=new Array(256).fill(0);for(const v of b)hist[Math.min(255,v|0)]++;let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
  let sB=0,wB=0,best=0,th=128;for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=N-wB;if(!wF)break;sB+=i*hist[i];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i}}
  const m=new Uint8Array(N);for(let i=0;i<N;i++)m[i]=b[i]>th?1:0;const lab=new Int32Array(N).fill(-1);let bl=-1,bn=0,id=0;const sk=[];
  for(let i=0;i<N;i++){if(!m[i]||lab[i]>=0)continue;let n=0;sk.push(i);lab[i]=id;while(sk.length){const p=sk.pop();n++;const x=p%w,y=(p/w)|0;
    if(x>0&&m[p-1]&&lab[p-1]<0){lab[p-1]=id;sk.push(p-1)}if(x<w-1&&m[p+1]&&lab[p+1]<0){lab[p+1]=id;sk.push(p+1)}if(y>0&&m[p-w]&&lab[p-w]<0){lab[p-w]=id;sk.push(p-w)}if(y<h-1&&m[p+w]&&lab[p+w]<0){lab[p+w]=id;sk.push(p+w)}}
    if(n>bn){bn=n;bl=id}id++}
  if(bn<N*.12||bn>N*.97)return null;let tl=[0,0,1e9],tr=[0,0,-1e9],br=[0,0,-1e9],bo=[0,0,1e9];
  for(let i=0;i<N;i++){if(lab[i]!==bl)continue;const x=i%w,y=(i/w)|0,a=x+y,dd=x-y;if(a<tl[2])tl=[x,y,a];if(a>br[2])br=[x,y,a];if(dd>tr[2])tr=[x,y,dd];if(dd<bo[2])bo=[x,y,dd]}
  const q=[tl,tr,br,bo].map(p=>[p[0]/s,p[1]/s]);let ar=0;for(let i=0;i<4;i++){const[x1,y1]=q[i],[x2,y2]=q[(i+1)%4];ar+=x1*y2-x2*y1}
  return Math.abs(ar/2)<c.width*c.height*.1?null:q}
/* 종이 찾기 v3: 밝기 경계 직선(허프) + 종이색 안쪽/바깥쪽 확인으로 네 변을 고름. 실패하면 v2(색 덩어리) */
function detect3(c){
  const s=Math.min(1,420/Math.max(c.width,c.height)),w=Math.max(16,Math.round(c.width*s)),h=Math.max(16,Math.round(c.height*s)),N=w*h;
  const t=document.createElement("canvas");t.width=w;t.height=h;const tx=t.getContext("2d");tx.drawImage(c,0,0,w,h);const d=tx.getImageData(0,0,w,h).data;
  const R=new Float32Array(N),G=new Float32Array(N),B=new Float32Array(N),L=new Float32Array(N);
  for(let i=0;i<N;i++){R[i]=d[i*4];G[i]=d[i*4+1];B[i]=d[i*4+2];L[i]=.299*R[i]+.587*G[i]+.114*B[i]}
  const Rb=blur(R,w,h,2),Gb=blur(G,w,h,2),Bb=blur(B,w,h,2),Lb=blur(L,w,h,2);
  /* 종이 기준: 가운데 상자 밝기 상위값, 채도(색 진함) */
  const C=new Float32Array(N);for(let i=0;i<N;i++)C[i]=Math.max(Rb[i],Gb[i],Bb[i])-Math.min(Rb[i],Gb[i],Bb[i]);const Db=blur(C,w,h,2);
  const cx0=(w*.3)|0,cx1=(w*.7)|0,cy0=(h*.3)|0,cy1=(h*.7)|0,ls=[];for(let y=cy0;y<cy1;y++)for(let x=cx0;x<cx1;x++)ls.push(Lb[y*w+x]);ls.sort((a,b)=>a-b);const Lp=ls[(ls.length*.8)|0]||200;
  const paper=i=>Lb[i]>Lp*.7&&Db[i]<48;
  /* 경계 세기: 밝기 + 종이색 거리 */
  const gx=new Float32Array(N),gy=new Float32Array(N),mg=new Float32Array(N);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;
    const a=(f)=>[f[i-w+1]+2*f[i+1]+f[i+w+1]-f[i-w-1]-2*f[i-1]-f[i+w-1],f[i+w-1]+2*f[i+w]+f[i+w+1]-f[i-w-1]-2*f[i-w]-f[i-w+1]];
    const[l1,l2]=a(Lb),[d1,d2]=a(Db);const X=l1-d1*.6,Y=l2-d2*.6;gx[i]=X;gy[i]=Y;mg[i]=Math.hypot(X,Y)}
  const ms=Array.from(mg).filter(v=>v>0).sort((a,b)=>a-b);const thr=ms[(ms.length*.78)|0]||1;
  /* 허프 */
  const NT=180,diag=Math.ceil(Math.hypot(w,h)),NR=diag*2+1,acc=new Float32Array(NT*NR),cs=[],sn=[];for(let k=0;k<NT;k++){cs.push(Math.cos(k*Math.PI/NT));sn.push(Math.sin(k*Math.PI/NT))}
  for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;if(mg[i]<thr)continue;let th=Math.atan2(gy[i],gx[i]);if(th<0)th+=Math.PI;const k0=Math.round(th/Math.PI*NT);const wv=Math.min(3,mg[i]/thr);
    for(let dk=-6;dk<=6;dk++){const k=(k0+dk+NT)%NT;const r=Math.round(x*cs[k]+y*sn[k])+diag;acc[k*NR+r]+=wv}}
  /* 봉우리 */
  const peaks=[];for(let k=0;k<NT;k++)for(let r=1;r<NR-1;r++){const v=acc[k*NR+r];if(v<w*.15)continue;let mx=true;
    for(let dk=-4;dk<=4&&mx;dk++)for(let dr=-6;dr<=6;dr++){if(!dk&&!dr)continue;const kk=(k+dk+NT)%NT,rr=r+dr;if(rr<0||rr>=NR)continue;const u=acc[kk*NR+rr];if(u>v||(u===v&&(dk<0||(dk===0&&dr<0)))){mx=false;break}}
    if(mx)peaks.push({k,r:r-diag,v})}
  peaks.sort((a,b)=>b.v-a.v);const P=peaks.filter(p=>p.k>=45&&p.k<135).slice(0,30).concat(peaks.filter(p=>p.k<45||p.k>=135).slice(0,30));
  const CX=w/2,CY=h/2;
  /* 각 직선: 종이 쪽(가운데 쪽)이 종이색, 바깥이 덜 종이색인지 */
  function side(L1){const c1=cs[L1.k],s1=sn[L1.k],rr=L1.r;const sgn=(CX*c1+CY*s1-rr)>0?1:-1;let n=0,pos=0,diff=0,pt=0,pp=0;
    /* 직선을 따라 점 찍기 */const tx2=-s1,ty2=c1,x0=c1*rr,y0=s1*rr;
    for(let tt=-diag;tt<=diag;tt+=3){const x=x0+tx2*tt,y=y0+ty2*tt;if(x<4||y<4||x>w-5||y>h-5)continue;const xi=(x+sgn*c1*6)|0,yi=(y+sgn*s1*6)|0,xo=(x-sgn*c1*6)|0,yo=(y-sgn*s1*6)|0;
      if(xo<0||yo<0||xo>=w||yo>=h){continue}const ii=yi*w+xi,io=yo*w+xo,pv=(Lb[ii]-Lb[io])/Lp*100+(Db[io]-Db[ii])*.8;n++;diff+=pv;if(pv>6)pos++;
      for(const o of[14,22,32,44,58]){const xa=(x-sgn*c1*o)|0,ya=(y-sgn*s1*o)|0;if(xa<0||ya<0||xa>=w||ya>=h)break;pt++;if(paper(ya*w+xa))pp++}}
    return n?{fr:pos/n,df:diff/n,n,of:pt?pp/pt:0}:{fr:0,df:0,n:0,of:0}}
  P.forEach(p=>{const sd=side(p);p.fr=sd.fr;p.df=sd.df;p.of=sd.of;p.sc=p.v*(.15+sd.fr)*(sd.df>0?1:.3)*Math.pow(1-sd.of,2)});
  /* 방향 나누기: 가로선(법선 ≈ 90°), 세로선 */
  const isH=p=>p.k>=45&&p.k<135;const above=p=>{/* 가로선이 가운데보다 위? */const yAt=(p.r-CX*cs[p.k])/sn[p.k];return yAt<CY};const leftOf=p=>{const xAt=(p.r-CY*sn[p.k])/cs[p.k];return xAt<CX};
  const top=P.filter(p=>isH(p)&&above(p)).sort((a,b)=>b.sc-a.sc).slice(0,6),bot=P.filter(p=>isH(p)&&!above(p)).sort((a,b)=>b.sc-a.sc).slice(0,6),
        lef=P.filter(p=>!isH(p)&&leftOf(p)).sort((a,b)=>b.sc-a.sc).slice(0,6),rig=P.filter(p=>!isH(p)&&!leftOf(p)).sort((a,b)=>b.sc-a.sc).slice(0,6);
  const X=(a,b)=>{const det=cs[a.k]*sn[b.k]-sn[a.k]*cs[b.k];if(Math.abs(det)<1e-6)return null;return[(a.r*sn[b.k]-b.r*sn[a.k])/det,(cs[a.k]*b.r-cs[b.k]*a.r)/det]};
  let best=null,bsc=-1;const W2=w*.12,H2=h*.12;
  for(const T of top)for(const Bo of bot)for(const Le of lef)for(const Ri of rig){const q=[X(T,Le),X(T,Ri),X(Bo,Ri),X(Bo,Le)];if(q.some(p=>!p||p[0]<-W2||p[1]<-H2||p[0]>w+W2||p[1]>h+H2))continue;
    let ar=0,cv=true;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],cc=q[(i+2)%4];ar+=a[0]*b[1]-b[0]*a[1];if(((b[0]-a[0])*(cc[1]-b[1])-(b[1]-a[1])*(cc[0]-b[0]))<=0)cv=false}
    ar=ar/2;if(!cv||ar<N*.18)continue;const sc=(T.sc+Bo.sc+Le.sc+Ri.sc)*Math.pow(Math.min(1,ar/N),1.2);if(sc>bsc){bsc=sc;best=q}}
  if(!best)return null;
  return best.map(([x,y])=>[Math.max(0,Math.min(c.width,x/s)),Math.max(0,Math.min(c.height,y/s))])}

/* 종이 찾기 v2: 가운데 종이 색 기준 → 색 거리 문턱 → 닫기·열기 → 가운데 덩어리 → 구멍 메우기 → 볼록껍질 → 4점 */
function detect2(c){
  const s=Math.min(1,420/Math.max(c.width,c.height)),w=Math.max(16,Math.round(c.width*s)),h=Math.max(16,Math.round(c.height*s)),N=w*h;
  const t=document.createElement("canvas");t.width=w;t.height=h;const tx=t.getContext("2d");tx.drawImage(c,0,0,w,h);const d=tx.getImageData(0,0,w,h).data;
  const R=new Float32Array(N),G=new Float32Array(N),B=new Float32Array(N),L=new Float32Array(N);
  for(let i=0;i<N;i++){R[i]=d[i*4];G[i]=d[i*4+1];B[i]=d[i*4+2];L[i]=.299*R[i]+.587*G[i]+.114*B[i]}
  const bl=(a,r)=>blur(a,w,h,r);const Rb=bl(R,2),Gb=bl(G,2),Bb=bl(B,2),Lb=bl(L,2);
  /* 종이 색: 가운데 상자에서 밝은 쪽 절반의 중앙값 */
  const cx0=(w*.3)|0,cx1=(w*.7)|0,cy0=(h*.3)|0,cy1=(h*.7)|0,ls=[];
  for(let y=cy0;y<cy1;y++)for(let x=cx0;x<cx1;x++)ls.push(Lb[y*w+x]);ls.sort((a,b)=>a-b);const lmed=ls[(ls.length*.6)|0];
  const rs=[],gs=[],bs=[];for(let y=cy0;y<cy1;y++)for(let x=cx0;x<cx1;x++){const i=y*w+x;if(Lb[i]>=lmed){rs.push(Rb[i]);gs.push(Gb[i]);bs.push(Bb[i])}}
  const med=a=>{a.sort((x,y)=>x-y);return a[(a.length/2)|0]};const pr=med(rs),pg=med(gs),pb=med(bs),pl=.299*pr+.587*pg+.114*pb;
  /* 색 거리 (밝기는 그늘을 생각해 덜 따짐) */
  const D=new Float32Array(N);let mx=0;
  for(let i=0;i<N;i++){const k=Lb[i]>1?pl/Lb[i]:1;const dr=Rb[i]*k-pr,dg=Gb[i]*k-pg,db=Bb[i]*k-pb;const chroma=Math.abs(dr)+Math.abs(dg)+Math.abs(db);const dl=Math.max(0,pl-Lb[i]);D[i]=chroma+dl*.7;if(D[i]>mx)mx=D[i]}
  const hist=new Array(256).fill(0);for(let i=0;i<N;i++)hist[Math.min(255,(D[i]/mx*255)|0)]++;
  let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];let sB=0,wB=0,best=0,th=60;for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=N-wB;if(!wF)break;sB+=i*hist[i];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i}}
  let T=th/255*mx;T=Math.max(28,Math.min(110,T));
  let m=new Uint8Array(N);for(let i=0;i<N;i++)m[i]=D[i]<T?1:0;
  const mor=(a,r,dil)=>{/* 사각 창 팽창/침식 (가로·세로 분리) */const o=new Uint8Array(N),t2=new Uint8Array(N);
    for(let y=0;y<h;y++){let c2=0;for(let x=-r;x<w;x++){if(x+r<w)c2+=a[y*w+x+r];if(x-r-1>=0)c2-=a[y*w+x-r-1];if(x>=0){const n=Math.min(x+r,w-1)-Math.max(x-r,0)+1;t2[y*w+x]=dil?(c2>0?1:0):(c2===n?1:0)}}}
    for(let x=0;x<w;x++){let c2=0;for(let y=-r;y<h;y++){if(y+r<h)c2+=t2[(y+r)*w+x];if(y-r-1>=0)c2-=t2[(y-r-1)*w+x];if(y>=0){const n=Math.min(y+r,h-1)-Math.max(y-r,0)+1;o[y*w+x]=dil?(c2>0?1:0):(c2===n?1:0)}}}return o};
  m=mor(mor(m,4,1),4,0);/* 닫기: 글자 구멍 */m=mor(mor(m,3,0),3,1);/* 열기: 가는 다리 끊기 */
  /* 가운데에서 가장 큰 덩어리 */
  const lab=new Int32Array(N).fill(-1),size=[];let id=0;const sk=[];
  for(let i=0;i<N;i++){if(!m[i]||lab[i]>=0)continue;let n=0;sk.push(i);lab[i]=id;while(sk.length){const p=sk.pop();n++;const x=p%w,y=(p/w)|0;
    if(x>0&&m[p-1]&&lab[p-1]<0){lab[p-1]=id;sk.push(p-1)}if(x<w-1&&m[p+1]&&lab[p+1]<0){lab[p+1]=id;sk.push(p+1)}if(y>0&&m[p-w]&&lab[p-w]<0){lab[p-w]=id;sk.push(p-w)}if(y<h-1&&m[p+w]&&lab[p+w]<0){lab[p+w]=id;sk.push(p+w)}}size.push(n);id++}
  const cnt=new Map();for(let y=cy0;y<cy1;y++)for(let x=cx0;x<cx1;x++){const l=lab[y*w+x];if(l>=0)cnt.set(l,(cnt.get(l)||0)+1)}
  let pick=-1,pc=0;cnt.forEach((v,k)=>{const sc=v+size[k]*.2;if(sc>pc){pc=sc;pick=k}});if(pick<0)return null;
  /* 구멍 메우기: 바깥에서 닿지 않는 곳은 안쪽 */
  const out=new Uint8Array(N);const q=[];for(let x=0;x<w;x++){q.push(x,(h-1)*w+x)}for(let y=0;y<h;y++){q.push(y*w,y*w+w-1)}
  for(const p of q)if(lab[p]!==pick&&!out[p])out[p]=1;let qi=0;const qq=q.filter(p=>out[p]);while(qi<qq.length){const p=qq[qi++],x=p%w,y=(p/w)|0;for(const n of[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!out[n]&&lab[n]!==pick){out[n]=1;qq.push(n)}}
  let area=0;const pts=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(out[i])continue;area++;const e=x===0||y===0||x===w-1||y===h-1||out[i-1]||out[i+1]||out[i-w]||out[i+w];if(e)pts.push([x+.5,y+.5])}
  if(area<N*.12||area>N*.985||pts.length<8)return null;
  /* 볼록껍질 */
  pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
  let hull=lo.slice(0,-1).concat(up.slice(0,-1));
  /* 4점으로 줄이기: 가장 작은 삼각형부터 빼기 */
  while(hull.length>4){let bi=0,ba=1e18;for(let i=0;i<hull.length;i++){const a=hull[(i-1+hull.length)%hull.length],b=hull[i],cc=hull[(i+1)%hull.length];const ar=Math.abs(cr(a,b,cc));if(ar<ba){ba=ar;bi=i}}hull.splice(bi,1)}
  if(hull.length<4)return null;
  /* 왼위·오위·오아래·왼아래 순서 */
  const cxm=hull.reduce((s2,p)=>s2+p[0],0)/4,cym=hull.reduce((s2,p)=>s2+p[1],0)/4;hull.sort((a,b)=>Math.atan2(a[1]-cym,a[0]-cxm)-Math.atan2(b[1]-cym,b[0]-cxm));
  let st0=0,bs0=1e18;hull.forEach((p,i)=>{if(p[0]+p[1]<bs0){bs0=p[0]+p[1];st0=i}});const qd=[0,1,2,3].map(k=>hull[(st0+k)%4]);
  let ar2=0;for(let i=0;i<4;i++){const[x1,y1]=qd[i],[x2,y2]=qd[(i+1)%4];ar2+=x1*y2-x2*y1}if(Math.abs(ar2/2)<N*.12)return null;
  return qd.map(([x,y])=>[Math.max(0,Math.min(c.width,x/s)),Math.max(0,Math.min(c.height,y/s))])}

function findPaper(c){let q=null;try{q=detect3(c)}catch(e){}if(!q){try{q=detect2(c)}catch(e){}}if(!q){try{q=detect(c)}catch(e){}}return q}
function full(c){const m=Math.round(Math.min(c.width,c.height)*.04);return[[m,m],[c.width-m,m],[c.width-m,c.height-m],[m,c.height-m]]}
function homography(s,d){const A=[],B=[];for(let i=0;i<4;i++){const[x,y]=s[i],[u,v]=d[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);B.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);B.push(v)}
  for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[B[c],B[p]]=[B[p],B[c]];for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c]/A[c][c];for(let k=c;k<8;k++)A[r][k]-=f*A[c][k];B[r]-=f*B[c]}}
  return B.map((b,i)=>b/A[i][i]).concat(1)}
function outSize(q){const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);const w=(d(q[0],q[1])+d(q[3],q[2]))/2,h=(d(q[0],q[3])+d(q[1],q[2]))/2;let r=h/w,a4=false;
  if(Math.abs(r-A4)/A4<.14){r=A4;a4=true}else if(Math.abs(r-1/A4)*A4<.14){r=1/A4;a4=true}const L=1754;return r>=1?{W:Math.round(L/r),H:L,a4}:{W:L,H:Math.round(L*r),a4}}
function warp(src,q,W,H){const Hm=homography([[0,0],[W,0],[W,H],[0,H]],q),sd=src.getContext("2d").getImageData(0,0,src.width,src.height).data,sw=src.width,sh=src.height,o=new ImageData(W,H),od=o.data;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const z=Hm[6]*x+Hm[7]*y+1,u=(Hm[0]*x+Hm[1]*y+Hm[2])/z,v=(Hm[3]*x+Hm[4]*y+Hm[5])/z,i=(y*W+x)*4;
    if(u<0||v<0||u>=sw-1||v>=sh-1){od[i]=od[i+1]=od[i+2]=od[i+3]=255;continue}const x0=u|0,y0=v|0,fx=u-x0,fy=v-y0,j=(y0*sw+x0)*4,j2=j+sw*4;
    for(let k=0;k<3;k++){const a=sd[j+k]+(sd[j+4+k]-sd[j+k])*fx,b=sd[j2+k]+(sd[j2+4+k]-sd[j2+k])*fx;od[i+k]=a+(b-a)*fy}od[i+3]=255}
  return o}
function enhance(img,mode){if(mode==="raw")return img;const W=img.width,H=img.height,d=img.data,o=new ImageData(W,H),od=o.data,S=24,gw=Math.ceil(W/S),gh=Math.ceil(H/S),G=gw*gh,bg=new Float32Array(G*3),ok=new Uint8Array(G),bl=new Float32Array(G);
  /* 1) 칸마다 바탕색 추정(밝은 쪽 85%) */
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const v=[[],[],[]];for(let y=gy*S;y<Math.min(H,gy*S+S);y+=2)for(let x=gx*S;x<Math.min(W,gx*S+S);x+=2){const i=(y*W+x)*4;v[0].push(d[i]);v[1].push(d[i+1]);v[2].push(d[i+2])}
    const j=gy*gw+gx;for(let k=0;k<3;k++){const a=v[k].sort((p,q)=>p-q);bg[j*3+k]=a[Math.floor(a.length*.85)]||255}bl[j]=.299*bg[j*3]+.587*bg[j*3+1]+.114*bg[j*3+2]}
  /* 2) 종이 밝기 기준 → 색칠된 칸·글자 덩어리 칸은 바탕으로 안 씀 */
  const sl=Array.from(bl).sort((a,b)=>a-b),P=sl[Math.floor(G*.75)]||230;
  for(let j=0;j<G;j++){const r=bg[j*3],g=bg[j*3+1],b=bg[j*3+2],ch=Math.max(r,g,b)-Math.min(r,g,b);ok[j]=(ch<38&&bl[j]>P*.45)?1:0}
  /* 3) 빠진 칸은 둘레의 좋은 칸으로 채움 (그늘은 살리고 색 면은 지움) */
  for(let it=0;it<60;it++){let left=0;const nk=ok.slice(),nb=bg.slice();for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const j=gy*gw+gx;if(ok[j])continue;let s=[0,0,0],c=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=gy+dy,xx=gx+dx;if(yy<0||xx<0||yy>=gh||xx>=gw)continue;const q=yy*gw+xx;if(!ok[q])continue;for(let k=0;k<3;k++)s[k]+=bg[q*3+k];c++}
      if(c){for(let k=0;k<3;k++)nb[j*3+k]=s[k]/c;nk[j]=1}else left++}ok.set(nk);bg.set(nb);if(!left)break}
  for(let j=0;j<G;j++)if(!ok[j])for(let k=0;k<3;k++)bg[j*3+k]=P;
  /* 4) 부드럽게 */
  for(let pass=0;pass<2;pass++){const t=bg.slice();for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++)for(let k=0;k<3;k++){let s=0,c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=gy+dy,xx=gx+dx;if(yy<0||xx<0||yy>=gh||xx>=gw)continue;s+=t[(yy*gw+xx)*3+k];c++}bg[(gy*gw+gx)*3+k]=s/c}}
  /* 5) 바탕은 하얗게, 글자는 진하게(중간톤 덜 날림) */
  const cu=mode==="bw"?(v=>{v=(v-.12)/(.9-.12);v=v<0?0:v>1?1:v;return Math.pow(v,1.6)}):(v=>{v=(v-.06)/(.92-.06);v=v<0?0:v>1?1:v;return Math.pow(v,1.25)});
  for(let y=0;y<H;y++){const fy=Math.min(gh-1.001,Math.max(0,y/S-.5)),y0=fy|0,ty=fy-y0;for(let x=0;x<W;x++){const fx=Math.min(gw-1.001,Math.max(0,x/S-.5)),x0=fx|0,tx=fx-x0,i=(y*W+x)*4,n=[0,0,0];
    for(let k=0;k<3;k++){const a=bg[(y0*gw+x0)*3+k],b=bg[(y0*gw+x0+1)*3+k],c=bg[((y0+1)*gw+x0)*3+k],e=bg[((y0+1)*gw+x0+1)*3+k],t1=a+(b-a)*tx,B=t1+((c+(e-c)*tx)-t1)*ty;n[k]=Math.min(1,d[i+k]/Math.max(40,B))}
    const l=.299*n[0]+.587*n[1]+.114*n[2];
    if(mode==="bw"){od[i]=od[i+1]=od[i+2]=cu(l)*255}else{const f=l>0?cu(l)/l:0;for(let k=0;k<3;k++)od[i+k]=Math.min(255,n[k]*f*255)}od[i+3]=255}}
  return o}

/* ---- 화면 ---- */
function open(opt){ensureCss();close();st={opt,src:null,q:null,mode:"bw",warped:null,size:null,pages:[],queue:[],drag:-1,ptr:null,sc:1};
  const root=el(`<div class="scn" role="dialog" aria-modal="true" aria-label="서류 스캔"><div class="scn-p">
   <div class="scn-h"><b>${esc(opt.title||"서류")} 스캔</b><button type="button" data-a="close">닫기</button></div>
   <div class="scn-b">
    <div data-v="pick"><p class="scn-tip">카메라 또는 앨범이 열립니다.<br>열리지 않으면 아래 버튼을 눌러 주세요.</p><div class="scn-row" style="margin-top:12px"><button type="button" class="sb grow" data-a="morecam">카메라 촬영</button><button type="button" class="sb grow" data-a="morelib">앨범에서 선택</button></div></div>
    <div data-v="edit" hidden><p class="scn-tip">파란 점 네 개를 서류 모서리에 맞춰 주세요.<br>점을 끄는 동안 해당 부분이 확대됩니다.</p>
      <div class="scn-st"><canvas></canvas></div>
      <div class="scn-row" style="margin-top:10px"><button type="button" class="sb" data-a="auto">자동 인식</button><button type="button" class="sb" data-a="full">사진 전체</button><button type="button" class="sb" data-a="rot">90° 회전</button></div>
      <div class="scn-row" style="margin-top:10px"><button type="button" class="sb pri grow" data-a="warp">다음</button></div></div>
    <div data-v="result" hidden>
      <div class="scn-ch" role="group" aria-label="보정 방식"><button type="button" data-m="bw" aria-pressed="true">흑백 문서</button><button type="button" data-m="color" aria-pressed="false">컬러 문서</button><button type="button" data-m="raw" aria-pressed="false">보정 없이</button></div>
      <div class="scn-pp" style="margin-top:10px"><img alt="보정한 서류 미리보기"></div><p class="scn-m" data-meta></p>
      <div class="scn-row"><button type="button" class="sb" data-a="back">모서리 조정</button><button type="button" class="sb pri grow" data-a="keep">업로드</button></div></div>
   </div>
   <input type="file" accept="image/*" capture="environment" data-f="cam" hidden><input type="file" accept="image/*" multiple data-f="lib" hidden>
  </div></div>`);
  document.body.appendChild(root);st.root=root;document.documentElement.style.overflow="hidden";
  const cv=root.querySelector("canvas");st.cv=cv;
  root.querySelectorAll("[data-f]").forEach(inp=>inp.onchange=e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length){if(!st.src&&!st.pages.length)close();return}st.queue=fs;next()});
  root.addEventListener("click",onClick);
  cv.addEventListener("pointerdown",pd);cv.addEventListener("pointermove",pm);cv.addEventListener("pointerup",pu);cv.addEventListener("pointercancel",pu);
  addEventListener("resize",draw);
  pick(opt.from==="lib"?"lib":"cam")}
function pick(k){st.root.querySelector(`[data-f="${k}"]`).click()}
function view(v){st.root.querySelectorAll("[data-v]").forEach(x=>x.hidden=x.dataset.v!==v);st.root.querySelector(".scn-b").scrollTop=0;if(v==="edit")draw()}
function next(){const f=st.queue.shift();if(!f)return;view("pick");st.root.querySelector('[data-v="pick"] p').textContent="사진을 불러오는 중…";
  const url=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);const s=Math.min(1,2200/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);st.src=c;st.q=findPaper(c)||full(c);st.base=null;view("edit")};
  im.onerror=()=>{URL.revokeObjectURL(url);st.root.querySelector('[data-v="pick"] p').textContent="이 사진은 열 수 없습니다. 다른 사진을 골라 주세요. (아이폰 HEIC 사진은 ‘카메라 촬영’으로 다시 촬영하면 됩니다)";view("pick")};im.src=url}
function draw(){if(!st||!st.src||st.root.querySelector('[data-v="edit"]').hidden)return;const cv=st.cv,ctx=cv.getContext("2d"),W=cv.parentElement.clientWidth||340,dpr=Math.min(2,devicePixelRatio||1),S=st.src;st.sc=W/S.width;
  const cw=Math.round(W*dpr),ch=Math.round(S.height*st.sc*dpr);if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;st.base=null}
  if(!st.base||st.base.src!==S||st.base.w!==cw){const b=document.createElement("canvas");b.width=cw;b.height=ch;b.getContext("2d").drawImage(S,0,0,cw,ch);st.base={c:b,src:S,w:cw}}
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(st.base.c,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);const p=st.q.map(([x,y])=>[x*st.sc,y*st.sc]);
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,S.height*st.sc);ctx.moveTo(p[0][0],p[0][1]);for(let i=3;i>=0;i--)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();ctx.fillStyle="rgba(10,13,30,.45)";ctx.fill("evenodd");ctx.restore();
  ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.lineWidth=2;ctx.strokeStyle="#7d93ff";ctx.stroke();
  p.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,st.drag===i?13:10,0,7);ctx.fillStyle="rgba(74,99,231,.9)";ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.stroke()});
  if(st.drag>=0){const[x,y]=st.q[st.drag],R=56,Z=2.4,lx=x*st.sc<W/2?W-R-10:R+10,ly=R+10;ctx.save();ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.clip();ctx.fillStyle="#000";ctx.fillRect(lx-R,ly-R,R*2,R*2);const sw=R*2/(Z*st.sc);ctx.drawImage(S,x-sw/2,y-sw/2,sw,sw,lx-R,ly-R,R*2,R*2);ctx.restore();
    ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.stroke();ctx.beginPath();ctx.moveTo(lx-10,ly);ctx.lineTo(lx+10,ly);ctx.moveTo(lx,ly-10);ctx.lineTo(lx,ly+10);ctx.strokeStyle="#7d93ff";ctx.lineWidth=2;ctx.stroke()}}
function xy(e){const r=st.cv.getBoundingClientRect();return[(e.clientX-r.left)/st.sc,(e.clientY-r.top)/st.sc]}
function pd(e){const[x,y]=xy(e);let bi=-1,bd=1e9;st.q.forEach(([qx,qy],i)=>{const d=Math.hypot(qx-x,qy-y)*st.sc;if(d<bd){bd=d;bi=i}});if(bd<48){st.drag=bi;st.ptr=e.pointerId;st.off=[st.q[bi][0]-x,st.q[bi][1]-y];st.cv.setPointerCapture(e.pointerId);draw();e.preventDefault()}}
function redraw(){if(st.raf)return;st.raf=requestAnimationFrame(()=>{st.raf=0;draw()})}
function pm(e){if(st.drag<0||e.pointerId!==st.ptr)return;e.preventDefault();const[x0,y0]=xy(e),o=st.off||[0,0],x=x0+o[0],y=y0+o[1];st.q[st.drag]=[Math.max(0,Math.min(st.src.width,x)),Math.max(0,Math.min(st.src.height,y))];redraw()}
function pu(){if(st.drag<0)return;st.drag=-1;st.ptr=null;draw()}
function busy(on){const box=st.root.querySelector(".scn-st");let b=box.querySelector(".scn-busy");if(on&&!b){b=el('<div class="scn-busy">보정하는 중…</div>');box.appendChild(b)}else if(!on&&b)b.remove()}
function render(){const o=enhance(st.warped,st.mode),c=document.createElement("canvas");c.width=o.width;c.height=o.height;c.getContext("2d").putImageData(o,0,0);
  return new Promise(res=>c.toBlob(b=>{st.blob=b;const img=st.root.querySelector('[data-v="result"] img');if(img.dataset.u)URL.revokeObjectURL(img.dataset.u);img.dataset.u=URL.createObjectURL(b);img.src=img.dataset.u;
    st.root.querySelector("[data-meta]").textContent=`${st.size.a4?"A4 비율로 맞춤":"찍은 비율 그대로"} · ${Math.round(b.size/1024)}KB`;res()},"image/jpeg",st.mode==="bw"?.8:.85))}
function drawPages(){const box=st.root.querySelector("[data-pages]");box.hidden=!st.pages.length;box.innerHTML=st.pages.map((p,i)=>`<div><img src="${p.u}" alt="${i+1}쪽"><span>${i+1}쪽</span><button type="button" data-del="${i}" aria-label="${i+1}쪽 빼기">×</button></div>`).join("");
  const d=st.root.querySelector('[data-a="done"]');d.disabled=!st.pages.length;d.textContent=st.pages.length?`담은 ${st.pages.length}장 올리기`:"담은 장 올리기"}
async function onClick(e){const del=e.target.closest("[data-del]");if(del){const p=st.pages.splice(+del.dataset.del,1)[0];URL.revokeObjectURL(p.u);drawPages();return}
  const m=e.target.closest("[data-m]");if(m){st.mode=m.dataset.m;st.root.querySelectorAll("[data-m]").forEach(x=>x.setAttribute("aria-pressed",x===m));await render();return}
  const a=e.target.closest("[data-a]");if(!a)return;const k=a.dataset.a;
  if(k==="close"){if(st.pages.length&&a.dataset.arm!=="1"){a.dataset.arm="1";a.textContent="담은 장 버리고 닫기";return}close()}
  else if(k==="auto"){st.q=findPaper(st.src)||full(st.src);draw()}
  else if(k==="full"){st.q=[[0,0],[st.src.width,0],[st.src.width,st.src.height],[0,st.src.height]];draw()}
  else if(k==="rot"){const S=st.src,c=document.createElement("canvas");c.width=S.height;c.height=S.width;const x=c.getContext("2d");x.translate(c.width,0);x.rotate(Math.PI/2);x.drawImage(S,0,0);const q=st.q.map(([qx,qy])=>[S.height-qy,qx]);st.q=[q[3],q[0],q[1],q[2]];st.src=c;draw()}
  else if(k==="warp"){busy(true);await new Promise(r=>setTimeout(r,30));st.size=outSize(st.q);st.warped=warp(st.src,st.q,st.size.W,st.size.H);busy(false);await render();view("result")}
  else if(k==="back")view("edit");
  else if(k==="keep"){/* 이 장 바로 올리기 → 남은 사진이 있으면 다음 장, 없으면 닫기 */a.disabled=true;a.textContent="업로드 중…";
    try{await st.opt.onDone([st.blob]);st.up=(st.up||0)+1;st.src=null;a.disabled=false;a.textContent="업로드";if(st.queue.length)next();else close()}
    catch(x){a.disabled=false;a.textContent="다시 업로드";st.root.querySelector("[data-meta]").textContent="업로드하지 못했습니다: "+(x.message||x)+" · 잠시 후 다시 시도해 주세요."}}
  else if(k==="morecam")pick("cam");else if(k==="morelib")pick("lib");
  else if(k==="done"){a.disabled=true;a.textContent="업로드 중…";try{await st.opt.onDone(st.pages.map(p=>p.b));close()}catch(x){a.disabled=false;a.textContent="다시 업로드";st.root.querySelector('[data-v="pick"] p').textContent="업로드하지 못했습니다: "+(x.message||x)+" · 잠시 후 다시 시도해 주세요.";view("pick")}}}
function close(){if(!st)return;st.pages.forEach(p=>URL.revokeObjectURL(p.u));st.root.remove();removeEventListener("resize",draw);document.documentElement.style.overflow="";st=null}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

/* ---- 이미지들을 A4 PDF 한 파일로 ---- */
async function toJpeg(blob){if(blob.type==="image/jpeg"){const im=await createImageBitmap(blob);return{bytes:new Uint8Array(await blob.arrayBuffer()),w:im.width,h:im.height}}
  const im=await createImageBitmap(blob),c=document.createElement("canvas");c.width=im.width;c.height=im.height;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);
  const b=await new Promise(r=>c.toBlob(r,"image/jpeg",.88));return{bytes:new Uint8Array(await b.arrayBuffer()),w:c.width,h:c.height}}
async function pdf(items){const enc=new TextEncoder(),parts=[],offs=[];let len=0;const push=x=>{const u=typeof x==="string"?enc.encode(x):x;parts.push(u);len+=u.length};
  const imgs=[];for(const it of items)imgs.push(await toJpeg(it));
  const n=imgs.length,PW=595.28,PH=841.89;push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const obj=(i,body)=>{offs[i]=len;push(`${i} 0 obj\n`);if(Array.isArray(body))body.forEach(push);else push(body);push("\nendobj\n")};
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  obj(2,`<< /Type /Pages /Count ${n} /Kids [${imgs.map((_,i)=>`${3+i*3} 0 R`).join(" ")}] >>`);
  imgs.forEach((im,i)=>{const p=3+i*3,c=p+1,x=p+2,land=im.w>im.h,W=land?PH:PW,H=land?PW:PH,s=Math.min(W/im.w,H/im.h),dw=im.w*s,dh=im.h*s,ox=(W-dw)/2,oy=(H-dh)/2;
    const cs=`q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${ox.toFixed(2)} ${oy.toFixed(2)} cm /Im${i} Do Q`;
    obj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im${i} ${x} 0 R >> >> /Contents ${c} 0 R >>`);
    obj(c,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
    obj(x,[`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`,im.bytes,"\nendstream"])});
  const total=3+n*3,xref=len;push(`xref\n0 ${total}\n0000000000 65535 f \n`);for(let i=1;i<total;i++)push(String(offs[i]).padStart(10,"0")+" 00000 n \n");
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:"application/pdf"})}
if(document.head)ensureCss();else document.addEventListener("DOMContentLoaded",ensureCss);
return {open,close,pdf};
})();
