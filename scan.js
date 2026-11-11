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
function enhance(img,mode){if(mode==="raw")return img;const W=img.width,H=img.height,d=img.data,o=new ImageData(W,H),od=o.data,S=16,gw=Math.ceil(W/S),gh=Math.ceil(H/S),bg=new Float32Array(gw*gh*3);
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const v=[[],[],[]];for(let y=gy*S;y<Math.min(H,gy*S+S);y+=2)for(let x=gx*S;x<Math.min(W,gx*S+S);x+=2){const i=(y*W+x)*4;v[0].push(d[i]);v[1].push(d[i+1]);v[2].push(d[i+2])}
    for(let k=0;k<3;k++){const a=v[k].sort((p,q)=>p-q);bg[(gy*gw+gx)*3+k]=a[Math.floor(a.length*.9)]||255}}
  for(let pass=0;pass<2;pass++){const t=bg.slice();for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++)for(let k=0;k<3;k++){let m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=Math.min(gh-1,Math.max(0,gy+dy)),xx=Math.min(gw-1,Math.max(0,gx+dx));m=Math.max(m,t[(yy*gw+xx)*3+k])}bg[(gy*gw+gx)*3+k]=m}}
  {const t=bg.slice();for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++)for(let k=0;k<3;k++){let s=0,c=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const yy=gy+dy,xx=gx+dx;if(yy<0||xx<0||yy>=gh||xx>=gw)continue;s+=t[(yy*gw+xx)*3+k];c++}bg[(gy*gw+gx)*3+k]=s/c}}
  const cu=v=>{v=(v-.18)/(.86-.18);v=v<0?0:v>1?1:v;return Math.pow(v,1.35)};
  for(let y=0;y<H;y++){const fy=Math.min(gh-1.001,Math.max(0,y/S-.5)),y0=fy|0,ty=fy-y0;for(let x=0;x<W;x++){const fx=Math.min(gw-1.001,Math.max(0,x/S-.5)),x0=fx|0,tx=fx-x0,i=(y*W+x)*4,n=[0,0,0];
    for(let k=0;k<3;k++){const a=bg[(y0*gw+x0)*3+k],b=bg[(y0*gw+x0+1)*3+k],c=bg[((y0+1)*gw+x0)*3+k],e=bg[((y0+1)*gw+x0+1)*3+k],t1=a+(b-a)*tx,B=t1+((c+(e-c)*tx)-t1)*ty;n[k]=Math.min(1,d[i+k]/Math.max(40,B))}
    if(mode==="bw"){const l=cu(.299*n[0]+.587*n[1]+.114*n[2])*255;od[i]=od[i+1]=od[i+2]=l}else{const l=.299*n[0]+.587*n[1]+.114*n[2],f=l>0?cu(l)/l:0;for(let k=0;k<3;k++)od[i+k]=Math.min(255,n[k]*f*255)}od[i+3]=255}}
  return o}

/* ---- 화면 ---- */
function open(opt){ensureCss();close();st={opt,src:null,q:null,mode:"bw",warped:null,size:null,pages:[],queue:[],drag:-1,ptr:null,sc:1};
  const root=el(`<div class="scn" role="dialog" aria-modal="true" aria-label="서류 스캔"><div class="scn-p">
   <div class="scn-h"><b>${esc(opt.title||"서류")} 스캔</b><button type="button" data-a="close">닫기</button></div>
   <div class="scn-b">
    <div data-v="pick"><p class="scn-tip">카메라나 사진첩이 열려요. 열리지 않았다면 아래 ‘카메라로 한 장 더’나 ‘사진첩에서 더’를 눌러 주세요.</p></div>
    <div data-v="edit" hidden><p class="scn-tip">파란 점 네 개를 종이 모서리에 맞춰 주세요. 끄는 동안 손가락 밑이 확대돼요.</p>
      <div class="scn-st"><canvas></canvas></div>
      <div class="scn-row" style="margin-top:10px"><button type="button" class="sb" data-a="auto">자동으로 다시 찾기</button><button type="button" class="sb" data-a="full">사진 전체</button><button type="button" class="sb" data-a="rot">90° 돌리기</button></div>
      <div class="scn-row" style="margin-top:10px"><button type="button" class="sb pri grow" data-a="warp">펴고 보정하기</button></div></div>
    <div data-v="result" hidden>
      <div class="scn-ch" role="group" aria-label="보정 방식"><button type="button" data-m="bw" aria-pressed="true">흑백 문서</button><button type="button" data-m="color" aria-pressed="false">컬러 문서</button><button type="button" data-m="raw" aria-pressed="false">보정 없이</button></div>
      <div class="scn-pp" style="margin-top:10px"><img alt="보정한 서류 미리보기"></div><p class="scn-m" data-meta></p>
      <div class="scn-row"><button type="button" class="sb" data-a="back">모서리 다시</button><button type="button" class="sb pri grow" data-a="keep">이 장 담기</button></div></div>
   </div>
   <div class="scn-f"><div class="scn-pg" data-pages hidden></div>
    <div class="scn-row"><button type="button" class="sb grow" data-a="morecam">카메라로 한 장 더</button><button type="button" class="sb grow" data-a="morelib">사진첩에서 더</button></div>
    <button type="button" class="sb pri" data-a="done" disabled>담은 장 올리기</button></div>
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
function next(){const f=st.queue.shift();if(!f)return;view("pick");st.root.querySelector('[data-v="pick"] p').textContent="사진을 여는 중…";
  const url=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);const s=Math.min(1,2200/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);st.src=c;st.q=detect(c)||full(c);view("edit")};
  im.onerror=()=>{URL.revokeObjectURL(url);st.root.querySelector('[data-v="pick"] p').textContent="이 사진은 열 수 없어요. 다른 사진을 골라 주세요. (아이폰 HEIC 사진은 ‘카메라로 찍기’로 다시 찍으면 돼요)";view("pick")};im.src=url}
function draw(){if(!st||!st.src||st.root.querySelector('[data-v="edit"]').hidden)return;const cv=st.cv,ctx=cv.getContext("2d"),W=cv.parentElement.clientWidth||340,dpr=Math.min(2,devicePixelRatio||1),S=st.src;st.sc=W/S.width;
  cv.width=Math.round(W*dpr);cv.height=Math.round(S.height*st.sc*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(S,0,0,W,S.height*st.sc);const p=st.q.map(([x,y])=>[x*st.sc,y*st.sc]);
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,S.height*st.sc);ctx.moveTo(p[0][0],p[0][1]);for(let i=3;i>=0;i--)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();ctx.fillStyle="rgba(10,13,30,.45)";ctx.fill("evenodd");ctx.restore();
  ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.lineWidth=2;ctx.strokeStyle="#7d93ff";ctx.stroke();
  p.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,st.drag===i?13:10,0,7);ctx.fillStyle="rgba(74,99,231,.9)";ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.stroke()});
  if(st.drag>=0){const[x,y]=st.q[st.drag],R=56,Z=2.4,lx=x*st.sc<W/2?W-R-10:R+10,ly=R+10;ctx.save();ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.clip();ctx.fillStyle="#000";ctx.fillRect(lx-R,ly-R,R*2,R*2);const sw=R*2/(Z*st.sc);ctx.drawImage(S,x-sw/2,y-sw/2,sw,sw,lx-R,ly-R,R*2,R*2);ctx.restore();
    ctx.beginPath();ctx.arc(lx,ly,R,0,7);ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.stroke();ctx.beginPath();ctx.moveTo(lx-10,ly);ctx.lineTo(lx+10,ly);ctx.moveTo(lx,ly-10);ctx.lineTo(lx,ly+10);ctx.strokeStyle="#7d93ff";ctx.lineWidth=2;ctx.stroke()}}
function xy(e){const r=st.cv.getBoundingClientRect();return[(e.clientX-r.left)/st.sc,(e.clientY-r.top)/st.sc]}
function pd(e){const[x,y]=xy(e);let bi=-1,bd=1e9;st.q.forEach(([qx,qy],i)=>{const d=Math.hypot(qx-x,qy-y)*st.sc;if(d<bd){bd=d;bi=i}});if(bd<44){st.drag=bi;st.ptr=e.pointerId;st.cv.setPointerCapture(e.pointerId);draw();e.preventDefault()}}
function pm(e){if(st.drag<0||e.pointerId!==st.ptr)return;const[x,y]=xy(e);st.q[st.drag]=[Math.max(0,Math.min(st.src.width,x)),Math.max(0,Math.min(st.src.height,y))];draw()}
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
  else if(k==="auto"){st.q=detect(st.src)||full(st.src);draw()}
  else if(k==="full"){st.q=[[0,0],[st.src.width,0],[st.src.width,st.src.height],[0,st.src.height]];draw()}
  else if(k==="rot"){const S=st.src,c=document.createElement("canvas");c.width=S.height;c.height=S.width;const x=c.getContext("2d");x.translate(c.width,0);x.rotate(Math.PI/2);x.drawImage(S,0,0);const q=st.q.map(([qx,qy])=>[S.height-qy,qx]);st.q=[q[3],q[0],q[1],q[2]];st.src=c;draw()}
  else if(k==="warp"){busy(true);await new Promise(r=>setTimeout(r,30));st.size=outSize(st.q);st.warped=warp(st.src,st.q,st.size.W,st.size.H);busy(false);await render();view("result")}
  else if(k==="back")view("edit");
  else if(k==="keep"){st.pages.push({b:st.blob,u:URL.createObjectURL(st.blob)});drawPages();st.src=null;if(st.queue.length)next();else{view("pick");st.root.querySelector('[data-v="pick"] p').textContent=`${st.pages.length}장 담았어요. 더 있으면 아래에서 한 장 더 찍거나 고르고, 다 됐으면 ‘올리기’를 눌러 주세요.`}}
  else if(k==="morecam")pick("cam");else if(k==="morelib")pick("lib");
  else if(k==="done"){a.disabled=true;a.textContent="올리는 중…";try{await st.opt.onDone(st.pages.map(p=>p.b));close()}catch(x){a.disabled=false;a.textContent="다시 올리기";st.root.querySelector('[data-v="pick"] p').textContent="올리지 못했어요: "+(x.message||x)+" · 잠시 뒤에 다시 눌러 주세요.";view("pick")}}}
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
