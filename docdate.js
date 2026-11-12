/* 서류 발급일 읽기 (2026-11-12) · 추천 선생님·직원 화면 모두, 화면을 막지 않고 카드 안에서 백그라운드로 읽음 · 등본·소득 증빙·건보 자격확인서 사진에서 발급일을 읽어 3개월 이내인지 표시
   사진은 이 기기 브라우저 안에서만 읽습니다(외부 전송 없음) · 틀리면 직접 고칠 수 있음 */
window.DOCDATE=(function(){
const KS=["resident","income","hifam"];
let B=null,LIB=null,WK=null,BUSY=Promise.resolve();
{const _i=CSE.init;CSE.init=function(b){B=b;return _i.apply(this,arguments)}}
const $=s=>document.querySelector(s);
function loadLib(){if(window.Tesseract)return Promise.resolve();if(LIB)return LIB;
  LIB=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=res;s.onerror=()=>{LIB=null;rej(new Error("글자 인식 프로그램을 불러오지 못했습니다"))};document.head.appendChild(s)});return LIB}
let READY=false;async function worker(onPrep){if(!READY&&onPrep)onPrep();await loadLib();if(!WK)WK=await Tesseract.createWorker(["kor","eng"]);READY=true;return WK}
async function prep(blob){const url=URL.createObjectURL(blob);const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error("사진을 열지 못했습니다"));i.src=url});
  const k=Math.min(2,2400/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);const x=cv.getContext("2d");x.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
  const d=x.getImageData(0,0,cv.width,cv.height),p=d.data;let mn=255,mx=0;for(let i=0;i<p.length;i+=4){const g=.299*p[i]+.587*p[i+1]+.114*p[i+2];p[i]=g;if(g<mn)mn=g;if(g>mx)mx=g}
  const r=Math.max(1,mx-mn);for(let i=0;i<p.length;i+=4){const g=(p[i]-mn)*255/r;p[i]=p[i+1]=p[i+2]=g}x.putImageData(d,0,0);return cv}
/* 날짜 찾기 (11/12 3차: 등본은 오른쪽 위 발급일 자리만 먼저 크게 읽음): ① ‘발급’ 줄 ② 년·월·일 날짜(글자가 틀려도: ‘20264 114 129)’ → 2026.11.12) ③ 짧은 줄에 따로 있는 날짜
   ④ 등본은 표 안 날짜(2011-08-30 같은 신고일)를 절대 쓰지 않음 · 다른 서류만 표 밖 날짜를 마지막으로 봄 · 못 찾으면 비워 두고 직접 입력 */
const DRE=/(20\d{2})\s*[.\-\/년]\s*(\d{1,2})\s*[.\-\/월]\s*(\d{1,2})/g;
const KRE=/(20\d{2})\s*(?:년|[^\d\s])?\d?\s*(\d{1,2})\s*월\s*(\d{1,2})/g;
/* 글자가 깨진 날짜 줄: 숫자 덩어리만 보고 연·월·일을 맞춤 (‘202644 114 12%’ → 2026.11.12) */
function loose(l){const T=l.match(/\d+/g)||[];for(let i=0;i<T.length-2;i++){const y=T[i];if(!/^20\d{2}\d{0,2}$/.test(y))continue;
  const pick=(t,mx)=>{const two=+t.slice(0,2);return t.length>=2&&two>=1&&two<=mx?two:+t[0]};const v=iso(y.slice(0,4),pick(T[i+1],12),pick(T[i+2],31));if(v)return v}return ""}
function iso(y,m,d){m=+m;d=+d;if(m<1||m>12||d<1||d>31)return "";return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
const SKIP=/생\s*년|생일|전\s*입|출생|납부\s*기간|기간|신\s*고|변\s*경|등\s*록|현\s*주\s*소|세\s*대\s*주|사\s*유|일\s*자/;
function all(re,l){const o=[];re.lastIndex=0;let m;while((m=re.exec(l))){const v=iso(m[1],m[2],m[3]);if(v)o.push(v)}return o}
function parse(t,k){const L=String(t||"").split(/\n/);const today=new Date().toISOString().slice(0,10);const ok=v=>v&&v<=today;let best="";
  const top=re=>{best="";for(const l of L){if(/생\s*년|생일|출생/.test(l))continue;for(const v of all(re,l))if(ok(v)&&v>best)best=v}return best};
  for(const l of L){if(/발\s*급/.test(l)&&!/번\s*호/.test(l)){const v=all(DRE,l).concat(all(KRE,l)).find(ok);if(v)return v}}
  if(top(KRE))return best;
  best="";for(const l of L){const x=l.replace(/[^0-9가-힣]/g,"");if(x.length>16||/-\d/.test(l))continue;const v=loose(l);if(ok(v)&&v>best)best=v}if(best)return best;
  if(k==="resident")return "";
  for(const l of L){if(SKIP.test(l))continue;for(const v of all(DRE,l))if(ok(v)&&v>best)best=v}
  return best}
async function readDate(cid,k,onPrep){const fs=(await B.list(cid,k)||[]).filter(f=>f.mimetype!=="application/pdf"&&!/\.pdf$/i.test(f.name||""));if(!fs.length)return {none:true};
  const f=fs[fs.length-1];const u=await B.open(cid,`${cid}/${k}/${f.name}`);const bl=await (await fetch(u)).blob();const cv=await prep(bl);const w=await worker(onPrep);
  /* 등본: 발급일은 늘 오른쪽 위(‘…동장’ 바로 위)에 있음 → 그 자리만 잘라 크게 읽고, 못 찾으면 전체를 읽음 */
  if(k==="resident"){const c2=document.createElement("canvas"),sx=Math.round(cv.width*.4),sy=Math.round(cv.height*.05),sw=cv.width-sx,sh=Math.round(cv.height*.25),z=1600/sw;
    c2.width=1600;c2.height=Math.round(sh*z);c2.getContext("2d").drawImage(cv,sx,sy,sw,sh,0,0,c2.width,c2.height);
    const r1=await w.recognize(c2);const v=parse(r1.data.text||"",k);if(v)return {date:v}}
  const {data}=await w.recognize(cv);return {date:parse(data.text||"",k)}}
function base(c){return c.visit_date?new Date(c.visit_date):new Date()}
function within(c,d){const lim=base(c);lim.setMonth(lim.getMonth()-3);return new Date(d)>=lim}
const fmt=d=>d?d.replace(/-/g,"."):"";
function rowHTML(c,k,msg){const v=((c.docs||{})[k]||{}).date;
  if(msg)return `<span class="dd-m">${msg}</span>`;
  if(!v)return B&&B.worker?"":`<span class="dd-m">발급일 없음</span><button type="button" class="dd-b" data-ddread="${k}">사진에서 읽기</button><button type="button" class="dd-b" data-ddedit="${k}">직접 입력</button>`;
  const ok=within(c,v),W=B&&B.worker;return `<span class="dd-d">발급 ${fmt(v)}</span><b class="${ok?"dd-ok":"dd-no"}">${ok?"3개월 이내":W?"3개월 지남 · 복지관에서 확인할게요":"3개월 지남 · 새로 발급 필요"}</b>${W?"":`<button type="button" class="dd-b" data-ddedit="${k}">고치기</button>`}<button type="button" class="dd-b" data-ddread="${k}">다시 읽기</button>`}
function paint(c,k,msg){const r=document.getElementById("dd_"+k);if(r)r.innerHTML=rowHTML(c,k,msg);const d=document.querySelector(`#cedit .doc[data-doc="${k}"]`),v=((c.docs||{})[k]||{}).date;if(d)d.classList.toggle("stale",!!v&&!within(c,v))}
function setDate(c,k,v){c.docs=c.docs||{};c.docs[k]=Object.assign({got:false},c.docs[k]||{},{date:v||null});paint(c,k);const s=$("#c_save");if(s)s.click()}
function run(c,k){BUSY=BUSY.then(async()=>{const cur=CSE.current();if(!cur||cur.id!==c.id)return;paint(c,k,"발급일 확인 중… 조금 걸릴 수 있어요. 다음 서류를 계속 올려 주세요.");
  try{const r=await readDate(c.id,k,()=>paint(c,k,"처음 한 번만 준비 중이에요. 와이파이에서 더 빨라요. 다음 서류를 계속 올려 주세요."));if(!CSE.current()||CSE.current().id!==c.id)return;if(r.none){paint(c,k);return}
    if(r.date)setDate(c,k,r.date);else paint(c,k,B&&B.worker?"발급일을 찾지 못했어요. 복지관에서 확인할게요.":"발급일을 찾지 못했어요. ‘직접 입력’을 눌러 주세요.")}
  catch(e){paint(c,k,e.message||"읽지 못했어요")}
  setTimeout(()=>{const cc=CSE.current();if(cc&&cc.id===c.id&&!((cc.docs||{})[k]||{}).date&&!document.querySelector(`#dd_${k} [data-ddedit]`))paint(cc,k)},4000)})}
function mount(c){if(!B)return;KS.forEach(k=>{const d=document.querySelector(`#cedit .doc[data-doc="${k}"]`);if(!d||document.getElementById("dd_"+k))return;
    const fl=d.querySelector(".files");(fl||d).insertAdjacentHTML("afterend",`<div class="dd-row" id="dd_${k}"></div>`);paint(c,k);
    if(fl){let n0=null;const cnt=()=>fl.querySelectorAll(".fpill").length;new MutationObserver(()=>{if(/불러오는 중/.test(fl.textContent))return;const n=cnt();
      if(n0===null){n0=n;if(n&&!B.worker&&!((c.docs||{})[k]||{}).date)run(c,k);return}if(n>n0)run(c,k);n0=n}).observe(fl,{childList:true,subtree:true})}})}
document.addEventListener("click",e=>{const r=e.target.closest("[data-ddread]"),w=e.target.closest("[data-ddedit]");const c=CSE.current();if(!c||(!r&&!w))return;
  if(r){run(c,r.dataset.ddread);return}
  const k=w.dataset.ddedit,row=document.getElementById("dd_"+k);const v=((c.docs||{})[k]||{}).date||"";
  row.innerHTML=`<input type="date" class="dd-in" value="${v}"><button type="button" class="dd-b" data-ddok="${k}">저장</button><button type="button" class="dd-b" data-ddx="${k}">취소</button>`;
  row.querySelector("[data-ddok]").onclick=()=>{const nv=row.querySelector(".dd-in").value;setDate(c,k,nv)};row.querySelector("[data-ddx]").onclick=()=>paint(c,k)});
const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{mount(c)}catch(e){console.error(e)}return x};
{const st=document.createElement("style");st.textContent=`.dd-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:6px 0 4px;font-size:12.5px}
.dd-row .dd-d{font-weight:700}.dd-row .dd-ok{color:var(--green)}.dd-row .dd-no{color:var(--warm)}.dd-row .dd-m{color:var(--mute)}
.dd-row .dd-b{font:inherit;font-size:12px;border:1px solid var(--line);background:var(--surface,#fff);border-radius:7px;padding:2px 8px;cursor:pointer;color:var(--ink)}
.staff-ui #cedit .doc.got.stale{background:var(--warm-soft);border-color:var(--warm)}
.dd-row .dd-in{height:28px!important;min-height:28px!important;font-size:12.5px!important;width:auto!important}`;document.head.appendChild(st)}
return {parse}})();
