/* 온쿨체크 1단계 (2026-11-13) · 지원금이 냉·난방비에 쓰였는지 매월 확인
   추천 선생님: 선정 가구의 고지서·영수증·통장 거래내역 사진 올리기 / 직원: 사용률·신호등 확인, 판정 확정, 지급 목록 연동
   사진 글자 읽기는 이 기기 브라우저 안에서만 합니다(외부 전송 없음) · 읽은 값은 후보로만 보여 주고 사람이 고릅니다 */
window.CHK=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
/* [확인 월, 탭 이름, 지원금 월 이름, 지원금(지급) 월, 지급 일자(계산표 기준), 올림 마감] */
const MONTHS=[["2026-12","12월 확인","11월분","2026-11","11/23","2026-11-23","2026-12-05"],["2027-01","1월 확인","12월분","2026-12","12/10","2026-12-10","2027-01-05"],
  ["2027-02","2월 확인","1월분","2027-01","1/10","2027-01-10","2027-02-05"],["2027-03","3월 확인","2월분","2027-02","2/10","2027-02-10","2027-03-05"]];
const USES=["도시가스","전기","관리비","등유·LPG·연탄","기타"],KINDS=["고지서","영수증","통장 내역"];
const won=n=>n||n===0?Number(n).toLocaleString("ko-KR")+"원":"";
const md=d=>d?Number(d.slice(5,7))+"/"+Number(d.slice(8,10)):"";
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function nowIdx(){const t=today();for(let i=0;i<MONTHS.length;i++)if(t<=MONTHS[i][6]||t.slice(0,7)<=MONTHS[i][0])return i;return MONTHS.length-1}
const msgOf=e=>{const m=String(e&&e.message||e||"");return /session/.test(m)?"다시 로그인해 주세요.":/locked/.test(m)?"복지관이 확인을 마친 달이라 바꿀 수 없습니다.":/not_selected/.test(m)?"선정된 가구만 올릴 수 있습니다.":m};
let CTX=null;

/* ── 사진 줄이기 (방향 바로잡고 긴 변 2000px JPEG) */
async function shrink(file){if(file.type==="application/pdf")return {blob:file,type:"application/pdf"};
  const bm=await createImageBitmap(file);const s=Math.min(1,2000/Math.max(bm.width,bm.height)),cv=document.createElement("canvas");cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);
  const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.drawImage(bm,0,0,cv.width,cv.height);bm.close&&bm.close();
  return {blob:await new Promise(r=>cv.toBlob(r,"image/jpeg",.85)),type:"image/jpeg",cv}}

/* ── 글자 읽기: 금액·날짜·사용량 후보만 뽑음 */
let LIB=null,WK=null,BUSY=Promise.resolve();
function lib(){if(window.Tesseract)return Promise.resolve();if(LIB)return LIB;LIB=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=res;s.onerror=()=>{LIB=null;rej(new Error("글자 읽기 프로그램을 불러오지 못했습니다"))};document.head.appendChild(s)});return LIB}
function ocr(cv,onPrep){const run=BUSY.then(async()=>{if(!WK&&onPrep)onPrep();await lib();if(!WK)WK=await Tesseract.createWorker(["kor","eng"]);
    const g=cv.getContext("2d"),d=g.getImageData(0,0,cv.width,cv.height),p=d.data;for(let i=0;i<p.length;i+=4){const v=.299*p[i]+.587*p[i+1]+.114*p[i+2];p[i]=p[i+1]=p[i+2]=v}g.putImageData(d,0,0);
    return (await WK.recognize(cv)).data.text||""});BUSY=run.catch(()=>{});return run}
const KEYW=/납부|청구|합계|금액|결제|출금|이체|입금|받을|당월|요금|총액|판매/;
function cands(t){const L=String(t||"").split(/\n/),A=new Map(),D=new Set(),U=new Set(),td=today();
  L.forEach((l,i)=>{const near=KEYW.test(l)||KEYW.test(L[i-1]||"");
    for(const m of l.matchAll(/(\d{1,3}(?:[,.]\d{3})+|\d{4,7})\s*(원)?/g)){const raw=m[1],v=+raw.replace(/[,.]/g,"");if(!(v>=1000&&v<=3000000))continue;if(!m[2]&&!/[,.]/.test(raw)&&!near)continue;if(/^20\d\d$/.test(raw))continue;
      const sc=(m[2]?2:0)+(near?3:0)+(/[,.]/.test(raw)?1:0);A.set(v,Math.max(A.get(v)||0,sc))}
    for(const m of l.matchAll(/(20\d{2})\s*[.\-\/년]\s*(\d{1,2})\s*[.\-\/월]\s*(\d{1,2})/g)){const y=m[1],mo=+m[2],dd=+m[3];if(mo<1||mo>12||dd<1||dd>31)continue;const v=`${y}-${String(mo).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;if(v<=td&&v>="2026-10-01")D.add(v)}
    for(const m of l.matchAll(/(\d[\d,.]*)\s*(kWh|KWH|kwh|㎥|m3|m³|MJ|리터|L\b|ℓ|드럼|장)/g))U.add(m[1]+" "+m[2].replace(/m3|m³/,"㎥"))});
  return {amounts:[...A.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]).slice(0,8).map(x=>x[0]),dates:[...D].sort().reverse().slice(0,4),usages:[...U].slice(0,4)}}

/* ── 올리기 칸 (선생님·직원 공통) */
function formHTML(){const seg=(n,L,v)=>`<div class="ck-seg" data-seg="${n}">${L.map(x=>`<button type="button" data-v="${esc(x)}" class="${x===v?"on":""}">${esc(x)}</button>`).join("")}</div>`;
  return `<div class="ck-form"><div class="ck-pick"><label class="sbtn pri">카메라로 찍기<input type="file" accept="image/*" capture="environment" data-ckf hidden></label><label class="sbtn">앨범·파일에서 고르기<input type="file" accept="image/*,application/pdf" data-ckf hidden></label></div>
   <div class="ck-prev" hidden></div>
   <div class="ck-l">증빙 종류</div>${seg("kind",KINDS,"고지서")}
   <div class="ck-l">어디에 낸 돈인가요</div>${seg("use",USES,"")}
   <div class="ck-l">낸 금액</div><div class="ck-c" data-cc="amount"></div><input class="ck-in" data-ck="amount" inputmode="numeric" placeholder="예) 84300">
   <div class="ck-l">낸 날짜</div><div class="ck-c" data-cc="date"></div><input class="ck-in" type="date" data-ck="date">
   <div class="ck-l">사용량 <small>있으면</small></div><div class="ck-c" data-cc="usage"></div><input class="ck-in" data-ck="usage" maxlength="40" placeholder="예) 310 kWh, 48 ㎥, 등유 1드럼">
   <div class="ck-act"><button type="button" class="sbtn pri" data-cksave>저장</button><button type="button" class="sbtn" data-ckx>닫기</button><span class="ck-msg" aria-live="polite"></span></div></div>`}
function mountForm(box,cid,month,onSaved){box.innerHTML=formHTML();const f=box.querySelector(".ck-form");let file=null,run=0;const msg=t=>f.querySelector(".ck-msg").textContent=t||"";
  const chips=(k,L,fmt)=>{const c=f.querySelector(`[data-cc="${k}"]`);c.innerHTML=L.length?L.map(v=>`<button type="button" data-cv="${esc(v)}">${esc(fmt?fmt(v):v)}</button>`).join(""):""};
  f.addEventListener("click",e=>{const s=e.target.closest("[data-seg] button");if(s){s.parentNode.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===s));return}
    const cv=e.target.closest("[data-cv]");if(cv){const k=cv.parentNode.dataset.cc;f.querySelector(`[data-ck="${k}"]`).value=cv.dataset.cv;cv.parentNode.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===cv));return}
    if(e.target.closest("[data-ckx]")){box.innerHTML="";return}
    if(e.target.closest("[data-cksave]"))save(e.target)});
  f.addEventListener("change",async e=>{if(!e.target.matches("[data-ckf]"))return;const fl=e.target.files[0];e.target.value="";if(!fl)return;const my=++run;
    try{file=await shrink(fl)}catch(_){msg("사진을 열지 못했습니다. 다른 사진으로 해 주세요.");return}
    const pv=f.querySelector(".ck-prev");pv.hidden=false;pv.innerHTML=file.type==="application/pdf"?`<span>PDF · ${esc(fl.name)}</span>`:`<img alt="올릴 사진" src="${URL.createObjectURL(file.blob)}">`;
    ["amount","date","usage"].forEach(k=>chips(k,[]));
    if(!file.cv){msg("PDF는 글자를 읽지 않습니다. 금액을 직접 넣어 주세요.");return}
    msg("금액을 찾는 중… 조금 걸릴 수 있어요. 그동안 종류를 골라 주세요.");
    try{const t=await ocr(file.cv,()=>{if(my===run)msg("처음 한 번만 준비 중이에요. 와이파이에서 더 빨라요.")});if(my!==run)return;const c=cands(t);
      chips("amount",c.amounts,won);chips("date",c.dates,v=>v.replace(/-/g,"."));chips("usage",c.usages);
      msg(c.amounts.length?"찾은 금액 중 실제로 낸 금액을 눌러 주세요.\n없으면 직접 넣어 주세요.":"금액을 찾지 못했어요. 직접 넣어 주세요.")}catch(x){if(my===run)msg("글자를 읽지 못했어요. 직접 넣어 주세요.")}});
  async function save(b){const v=k=>f.querySelector(`[data-ck="${k}"]`).value.trim(),sg=n=>(f.querySelector(`[data-seg="${n}"] .on`)||{}).dataset;
    const it={kind:(sg("kind")||{}).v||"고지서",use:(sg("use")||{}).v||"",amount:v("amount").replace(/[^0-9]/g,""),date:v("date"),usage:v("usage")};
    if(!file){msg("사진을 먼저 올려 주세요.");return}if(!it.use){msg("어디에 낸 돈인지 골라 주세요.");return}if(!it.amount){msg("낸 금액을 넣어 주세요.");return}
    b.disabled=true;msg("올리는 중…");
    try{const u=await CTX.fn({action:"upload_url",case_id:cid,month,content_type:file.type});const r=await fetch(u.signedUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file.blob});if(!r.ok)throw new Error("업로드 실패 "+r.status);
      it.file=u.path;await onSaved(it);box.innerHTML=""}catch(x){b.disabled=false;msg("저장하지 못했습니다: "+msgOf(x))}}}
async function view(cid,path){const w=window.open("","_blank");try{const u=(await CTX.fn({action:"sign",case_id:cid,path})).url;if(w)w.location=u;else location.href=u}catch(x){if(w)w.close();alert("열지 못했습니다: "+msgOf(x))}}
function itemsHTML(L,cid,own){return L.length?`<ul class="ck-items">${L.map(i=>`<li><b>${esc(i.use)} ${esc(i.kind)}</b> ${won(i.amount)}${i.date?" · "+esc(md(i.date)):""}${i.usage?" · "+esc(i.usage):""}${i.file?` <button type="button" class="lk" data-ckv="${esc(i.file)}" data-cid="${esc(cid)}">보기</button>`:""}${own&&own(i)?` <button type="button" class="lk" data-ckd="${esc(i.id)}">지우기</button>`:""}</li>`).join("")}</ul>`:""}

/* ══ 추천 선생님 화면 ══ */
let W=null,WR=[],wopen=null;
function wmount(){const home=$("#home")||($("#golist")||{}).closest&&$("#golist").closest("section");if(!home||$("#chkw"))return;const d=document.createElement("div");d.id="chkw";d.hidden=true;(($("#hlist")||$("#golist").parentNode)).after(d);d.addEventListener("click",wclick)}
async function wload(){const box=$("#chkw");if(!box)return;const m=MONTHS[nowIdx()];
  const sel=(W.cases()||[]).filter(c=>c.stage==="선정");if(!sel.length||today()<m[5]){box.hidden=true;return}
  try{WR=await W.rpc("oncool_w_chks",{p_token:W.tok()})||[]}catch(_){WR=[]}wpaint()}
function wpaint(){const box=$("#chkw");if(!box)return;const m=MONTHS[nowIdx()],R={};(W.mine()||[]).forEach(r=>R[r.id]=r);
  const sel=(W.cases()||[]).filter(c=>c.stage==="선정");if(!sel.length){box.hidden=true;return}box.hidden=false;
  box.innerHTML=`<div class="card ck-w"><div class="ck-wh"><b>이번 달 온쿨체크</b><span>${md(m[6])}까지</span></div>
   <p class="hint" style="margin:4px 0 8px">${m[2]} 지원금으로 낸 냉·난방비 고지서, 영수증, 통장 거래내역 중 있는 것을 찍어 올려 주세요.<br>금액은 사진에서 찾아 드리고, 복지관에서 다시 확인합니다.</p>
   ${sel.map(c=>{const k=WR.find(x=>x.case_id===c.id&&x.month===m[0]),n=k?k.items.length:0,r=R[c.referral_id]||{};
     return `<div class="ck-wr"><div class="ck-wt"><b>${esc(r.elder_name||"어르신")}</b><span class="ck-p ${k&&k.confirmed?"g":n?"b":"r"}">${k&&k.confirmed?"확인 완료":n?`${n}건 올림`:"아직 없음"}</span></div>
      ${itemsHTML(k?k.items:[],c.id,i=>!(k&&k.confirmed)&&i.by===W.me())}
      ${k&&k.confirmed?"":`<button type="button" class="sbtn" data-ckadd="${esc(c.id)}">사진 올리기</button>`}<div class="ck-fb" data-fb="${esc(c.id)}"></div></div>`}).join("")}</div>`;
  if(wopen){const fb=box.querySelector(`[data-fb="${wopen}"]`);if(fb)wform(fb,wopen)}}
function wform(fb,cid){const m=MONTHS[nowIdx()];mountForm(fb,cid,m[0],async it=>{const r=await W.rpc("oncool_w_chk_add",{p_token:W.tok(),p_case:cid,p_month:m[0],p_item:it});const i=WR.findIndex(x=>x.case_id===cid&&x.month===m[0]);if(i<0)WR.push(r);else WR[i]=r;wopen=null;wpaint()})}
async function wclick(e){const a=e.target.closest("[data-ckadd]");if(a){wopen=a.dataset.ckadd;const fb=$(`#chkw [data-fb="${wopen}"]`);if(fb)wform(fb,wopen);return}
  const v=e.target.closest("[data-ckv]");if(v){view(v.dataset.cid,v.dataset.ckv);return}
  const d=e.target.closest("[data-ckd]");if(d){const cid=d.closest(".ck-wr").querySelector("[data-fb]").dataset.fb,m=MONTHS[nowIdx()];if(!confirm("이 증빙을 지울까요?"))return;
    try{const r=await W.rpc("oncool_w_chk_del",{p_token:W.tok(),p_case:cid,p_month:m[0],p_id:d.dataset.ckd});const i=WR.findIndex(x=>x.case_id===cid&&x.month===m[0]);if(i>=0)WR[i]=r;wpaint()}catch(x){alert("지우지 못했습니다: "+msgOf(x))}}}
function worker(o){W=o;CTX={fn:async b=>{const r=await fetch(o.sb+"/functions/v1/oncool-chk",{method:"POST",headers:{"apikey":o.key,"Authorization":"Bearer "+o.key,"Content-Type":"application/json"},body:JSON.stringify(Object.assign({wtoken:o.tok()},b))});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error==="session_invalid"?"session":(j.error||("HTTP "+r.status)));return j}};
  css();wmount();const hl=()=>{const h=$("#hlist");if(h&&!h.__ck){h.__ck=1;new MutationObserver(()=>wload()).observe(h,{childList:true});wload()}};
  new MutationObserver(()=>{if(!$("#chkw"))wmount();hl()}).observe(document.body,{childList:true,subtree:true});hl()}

/* ══ 직원 화면 ══ */
let S=null,ROWS=[],SCOPE=USES.slice(),PAYS=[],tab=0,sel=null,smsg="";
const signalOf=(c,k,prevK)=>{const t=CS.typeOf(c);if(t==="4")return {s:"해당 없음",cls:"n",why:"복지관 직접 구매"};
  const sup=support(c);const its=(k&&k.items||[]).filter(i=>i.count!==false&&SCOPE.includes(i.use)),paid=its.reduce((a,i)=>a+(+i.amount||0),0);
  if(!(k&&k.items&&k.items.length)){const twice=prevK!==undefined&&!(prevK&&prevK.items&&prevK.items.length);return {s:"미제출",cls:twice?"r":"y",why:twice?"2회 연속 미제출":"1회 미제출",paid:0,sup}}
  if(!sup)return {s:"금액 확인",cls:"n",why:"지원금 기록 없음",paid,sup};const r=Math.round(paid*100/sup);
  return {s:r>=80?"초록":r>=50?"노랑":"빨강",cls:r>=80?"g":r>=50?"y":"r",ratio:r,paid,sup,why:`${won(paid)} / ${won(sup)}`}};
function support(c){const m=MONTHS[tab],p=PAYS.find(x=>x.case_id===c.id&&x.month===m[3]&&x.season==="난방");if(p&&p.amount!=null)return +p.amount;const a=CS.amounts(c);if(!a)return 0;const x=a.list.find(([k])=>k===m[4]);return x?x[1]:0}
const chkOf=(cid,mon)=>ROWS.find(x=>x.case_id===cid&&x.month===mon);
function srows(){const M={};S.rows().forEach(x=>M[x.id]=x);return S.cases().filter(c=>c.stage==="선정"&&!(M[c.referral_id]||{}).is_test).map(c=>[c,M[c.referral_id]||{}])
  .sort((a,b)=>(a[0].household_code||"~").localeCompare(b[0].household_code||"~")||(a[1].receipt_no-b[1].receipt_no))}
function sig(c){const m=MONTHS[tab];return signalOf(c,chkOf(c.id,m[0]),tab>0?chkOf(c.id,MONTHS[tab-1][0])||null:undefined)}
function spaint(){const v=$("#vw-chk");if(!v)return;const L=srows(),m=MONTHS[tab],C={g:0,y:0,r:0,u:0};
  const tr=L.map(([c,r])=>{const k=chkOf(c.id,m[0]),g=sig(c);if(g.s==="미제출")C.u++;else if(g.cls in C)C[g.cls]++;
    return `<tr data-ck="${c.id}" class="${sel===c.id?"on":""}"><td>${esc(c.household_code||"")}</td><td><b>${esc(r.elder_name)}</b><small>${esc(r.worker_name||"")}</small></td><td>${CS.typeOf(c)?CS.typeOf(c)+"유형":""}</td><td>${g.sup?won(g.sup):""}</td><td>${g.paid?won(g.paid):g.s==="해당 없음"?"":"—"}</td><td>${g.ratio!=null?g.ratio+"%":""}</td>
     <td><span class="ck-dot ${g.cls}"></span>${esc(g.s)}${g.s==="미제출"?` <small>${esc(g.why)}</small>`:""}</td><td>${k&&k.items.length?k.items.length+"건":""}</td><td>${k&&k.confirmed_at?`<b class="ck-dec">${esc(k.decision||"확정")}</b>`:'<span class="pm">확정 전</span>'}</td></tr>`}).join("");
  const dd=Math.ceil((new Date(m[6].slice(0,8)+"10")-new Date(today()))/864e5);
  v.innerHTML=`<div class="py-top"><div class="py-tabs">${MONTHS.map((x,i)=>`<button type="button" data-cktab="${i}" class="${i===tab?"on":""}">${x[1]} (${x[2]})</button>`).join("")}</div></div>
   <div class="ck-dd"><span>${m[2]} 지원금 사용 확인 · 협회 입력·다음 지급 ${md(m[6].slice(0,8)+"10")}</span><b>${dd>0?"D-"+dd:dd===0?"D-day":"지남"}</b></div>
   <div class="ck-sum"><div class="g">초록<b>${C.g}</b></div><div class="y">노랑<b>${C.y}</b></div><div class="r">빨강<b>${C.r}</b></div><div class="u">미제출<b>${C.u}</b></div></div>
   ${L.length?`<div class="py-tw"><table class="py-t"><tr><th>가구코드</th><th>대상자 · 추천자</th><th>유형</th><th>${m[2]} 지원금</th><th>냉·난방비 납부</th><th>사용률</th><th>판정 제안</th><th>증빙</th><th>확정</th></tr>${tr}</table></div>`:'<p class="py-e">선정된 가구가 없습니다.</p>'}
   <details class="ck-scope"><summary>사용률에 넣는 사용처</summary><div>${USES.map(u=>`<label><input type="checkbox" data-scope="${esc(u)}"${SCOPE.includes(u)?" checked":""}> ${esc(u)}</label>`).join("")}<span class="pm">협회 답을 받으면 여기서 바꿔 주세요.</span></div></details>
   <p class="hint">초록 80% 이상 · 노랑 50~80% 또는 1회 미제출 · 빨강 50% 미만 또는 2회 연속 미제출 (조정사업계획서 기준)<br>판정은 시스템이 제안만 합니다. 담당자가 확정해야 지급 목록에 반영됩니다.</p>
   <div class="ck-detail">${sel?detailHTML():""}</div>`;
  if(sel&&addOpen){const fb=v.querySelector(".ck-sfb");if(fb)sform(fb)}}
let addOpen=false,draft=null;
function detailHTML(){const it=srows().find(([c])=>c.id===sel);if(!it)return "";const [c,r]=it,m=MONTHS[tab],k=chkOf(c.id,m[0])||{items:[]};if(!draft||draft.cid!==c.id||draft.m!==m[0])draft={cid:c.id,m:m[0],items:JSON.parse(JSON.stringify(k.items||[])),decision:k.decision||"",note:k.note||""};
  const g=signalOf(c,{items:draft.items},tab>0?chkOf(c.id,MONTHS[tab-1][0])||null:undefined),D=["지급","상담 후 지급","보류·재심"];
  return `<div class="card py-f"><div class="py-fh"><b>${esc(c.household_code||"")} ${esc(r.elder_name)} · ${esc(m[1])} <span class="ck-p ${g.cls}">${esc(g.s)}${g.ratio!=null?" "+g.ratio+"%":""}</span></b><button type="button" class="sbtn" data-ckclose>닫기</button></div>
   ${g.sup?`<div class="ck-bar"><i class="${g.cls}" style="width:${Math.min(100,g.ratio||0)}%"></i></div><p class="pm" style="margin:0">${esc(g.why)}</p>`:`<p class="pm" style="margin:0">${esc(g.why||"")}</p>`}
   <div class="py-tw"><table class="py-t ck-it"><tr><th>사용률</th><th>사용처</th><th>종류</th><th>금액</th><th>날짜</th><th>사용량</th><th>올린 사람</th><th></th></tr>
   ${draft.items.map((i,n)=>`<tr data-ci="${n}"><td><input type="checkbox" data-ce="count"${i.count!==false?" checked":""} title="중복이면 끄기"></td><td><select data-ce="use">${USES.map(u=>`<option${u===i.use?" selected":""}>${u}</option>`).join("")}</select></td><td><select data-ce="kind">${KINDS.concat(["기타"]).map(u=>`<option${u===i.kind?" selected":""}>${u}</option>`).join("")}</select></td>
     <td><input data-ce="amount" inputmode="numeric" value="${esc(i.amount??"")}" size="8"></td><td><input type="date" data-ce="date" value="${esc(i.date||"")}"></td><td><input data-ce="usage" value="${esc(i.usage||"")}" size="10"></td><td>${esc(i.by||"")}</td>
     <td>${i.file?`<button type="button" class="lk" data-ckv="${esc(i.file)}" data-cid="${esc(c.id)}">보기</button> `:""}<button type="button" class="lk" data-cdel="${n}">빼기</button></td></tr>`).join("")||'<tr><td colspan="8" class="pm">아직 올린 증빙이 없습니다.</td></tr>'}</table></div>
   <p class="pm" style="margin:0">같은 돈을 고지서와 통장 내역으로 두 번 올렸으면 한쪽의 ‘사용률’ 체크를 꺼 주세요.</p>
   <div><button type="button" class="sbtn" data-ckadds>증빙 직접 올리기</button></div><div class="ck-sfb"></div>
   <div class="ck-l">판정</div><div class="py-r">${D.map(x=>`<label><input type="radio" name="ck_dec" value="${x}"${draft.decision===x?" checked":""}> ${x}</label>`).join("")}</div>
   <div class="ck-l">상담·조치 기록 <small>${g.cls==="y"?"노랑: 상담·사용 교육 내용을 적어 주세요":g.cls==="r"?"빨강: 재심 회부·협회 협의 내용을 적어 주세요":""}</small></div><textarea id="ck_note" rows="3" maxlength="1000">${esc(draft.note)}</textarea>
   <div class="py-a"><button type="button" class="sbtn" data-cksave="0">저장</button><button type="button" class="sbtn pri" data-cksave="1">판정 확정</button>${k.confirmed_at?`<span class="pm">확정 ${esc(String(k.confirmed_at).slice(0,10))} · ${esc(k.confirmed_by||"")}</span>`:""}<span class="msg">${esc(smsg)}</span></div></div>`}
function sform(fb){const m=MONTHS[tab];mountForm(fb,sel,m[0],async it=>{it.by=S.me();it.at=new Date().toISOString();draft.items.push(it);addOpen=false;await ssave(false,true);})}
async function ssave(confirm,keepMsg){const it=srows().find(([c])=>c.id===sel);if(!it)return;const [c]=it,m=MONTHS[tab];const dec=(document.querySelector('input[name="ck_dec"]:checked')||{}).value||"";const nt=($("#ck_note")||{}).value;
  if(nt!=null)draft.note=nt;draft.decision=dec;if(confirm&&!dec){smsg="판정을 골라 주세요.";spaint();return}
  const g=signalOf(c,{items:draft.items},tab>0?chkOf(c.id,MONTHS[tab-1][0])||null:undefined);
  try{const n=await S.rpc("oncool_ed_chk_save",{p_token:S.tok(),p:{case_id:c.id,month:m[0],items:draft.items,decision:dec,signal:g.s,ratio:g.ratio??"",note:draft.note,confirm}});
    const i=ROWS.findIndex(x=>x.case_id===c.id&&x.month===m[0]);if(i<0)ROWS.push(n);else ROWS[i]=n;draft=null;smsg=confirm?"판정을 확정했습니다.":"저장되었습니다."}catch(x){smsg="저장하지 못했습니다: "+msgOf(x)}spaint()}
function sedit(e){const tr=e.target.closest("[data-ci]");if(!tr||!draft)return;const i=draft.items[+tr.dataset.ci],k=e.target.dataset.ce;if(!k)return;
  i[k]=k==="count"?e.target.checked:k==="amount"?e.target.value.replace(/[^0-9]/g,""):e.target.value;const st=$("#vw-chk .py-fh .ck-p");
  const it=srows().find(([c])=>c.id===sel);if(it&&st){const g=signalOf(it[0],{items:draft.items});st.className="ck-p "+g.cls;st.textContent=g.s+(g.ratio!=null?" "+g.ratio+"%":"")}}
async function sload(){try{const o=await S.rpc("oncool_ed_chks",{p_token:S.tok()})||{};ROWS=o.rows||[];if(Array.isArray(o.scope))SCOPE=o.scope;PAYS=await S.rpc("oncool_ed_payments",{p_token:S.tok()})||[]}catch(x){smsg="불러오지 못했습니다: "+msgOf(x)}}
function sshow(on){const v=$("#vw-chk"),b=$("#vt-chk");if(!v)return;v.hidden=!on;b.setAttribute("aria-selected",on);
  if(on){["#vt-ref","#vt-case","#vt-q","#vt-pay"].forEach(s=>{const x=$(s);if(x)x.setAttribute("aria-selected",false)});["#vw-ref","#vw-case","#vw-q","#vw-pay"].forEach(s=>{const x=$(s);if(x)x.hidden=true});smsg="";spaint();sload().then(spaint)}}
function ssetup(){if($("#vt-chk"))return;const tabs=document.querySelector(".vtabs");if(!tabs)return;
  const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.id="vt-chk";b.setAttribute("aria-selected","false");b.textContent="온쿨체크";tabs.appendChild(b);
  const v=document.createElement("div");v.id="vw-chk";v.hidden=true;$("#vw-ref").after(v);
  b.addEventListener("click",()=>{if(!S.tok()){alert("편집 비밀번호로 들어와야 사용할 수 있습니다.");return}tab=nowIdx();sshow(true)});
  tabs.addEventListener("click",e=>{const t=e.target.closest("[role=tab]");if(t&&t.id!=="vt-chk")sshow(false)},true);
  v.addEventListener("input",sedit);v.addEventListener("change",async e=>{sedit(e);const sc=e.target.closest("[data-scope]");if(sc){const L=[...v.querySelectorAll("[data-scope]:checked")].map(x=>x.dataset.scope);
    try{SCOPE=await S.rpc("oncool_ed_chk_scope",{p_token:S.tok(),p_scope:L})||L}catch(x){alert("바꾸지 못했습니다: "+msgOf(x))}spaint();const d=$("#vw-chk .ck-scope");if(d)d.open=true}});
  v.addEventListener("click",async e=>{const t=e.target.closest("[data-cktab]");if(t){tab=+t.dataset.cktab;sel=null;draft=null;smsg="";spaint();return}
    const vv=e.target.closest("[data-ckv]");if(vv){view(vv.dataset.cid,vv.dataset.ckv);return}
    const r=e.target.closest("tr[data-ck]");if(r){sel=r.dataset.ck;draft=null;addOpen=false;smsg="";spaint();const f=$("#vw-chk .ck-detail");if(f)f.scrollIntoView({block:"nearest"});return}
    if(e.target.closest("[data-ckclose]")){sel=null;draft=null;spaint();return}
    const dl=e.target.closest("[data-cdel]");if(dl&&draft){if(!confirm("이 증빙을 목록에서 뺄까요? 저장을 눌러야 반영됩니다."))return;draft.items.splice(+dl.dataset.cdel,1);keepNote();spaint();return}
    if(e.target.closest("[data-ckadds]")){keepNote();addOpen=true;spaint();return}
    const sv=e.target.closest("[data-cksave]");if(sv){sv.disabled=true;await ssave(sv.dataset.cksave==="1")}});
  css()}
function keepNote(){const n=$("#ck_note");if(n&&draft)draft.note=n.value;const d=document.querySelector('input[name="ck_dec"]:checked');if(d&&draft)draft.decision=d.value}
function staff(o){S=o;CTX={fn:async b=>{const r=await fetch(o.sb+"/functions/v1/oncool-chk",{method:"POST",headers:{"apikey":o.key,"Authorization":"Bearer "+o.key,"Content-Type":"application/json"},body:JSON.stringify(Object.assign({token:o.tok()},b))});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||("HTTP "+r.status));return j}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ssetup);else ssetup()}
/* 지급 목록에서 쓸 상태: 지급 월(YYYY-MM)에 맞는 확인 결과 */
function forPay(cid,payMonth){const k=ROWS.find(x=>x.case_id===cid&&x.month===payMonth);return k&&k.confirmed_at?k.decision:""}
async function ensure(){if(S&&S.tok()&&!ROWS.length)await sload()}

let CSSOK=false;function css(){if(CSSOK)return;CSSOK=true;const st=document.createElement("style");st.textContent=`
.ck-form{display:flex;flex-direction:column;gap:6px;margin-top:8px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface,#fff)}
.ck-pick{display:flex;gap:6px;flex-wrap:wrap}.ck-pick label{cursor:pointer}.ck-prev img{max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--line)}
.ck-l{font-weight:700;font-size:13px;margin-top:6px}.ck-l small{font-weight:400;color:var(--mute)}
.ck-seg,.ck-c{display:flex;flex-wrap:wrap;gap:6px}.ck-seg button,.ck-c button{font:inherit;font-size:13px;border-radius:999px;padding:5px 11px;border:1px solid var(--line);background:var(--surface,#fff);color:var(--ink);cursor:pointer}
.ck-seg button.on{background:var(--pri);border-color:var(--pri);color:#fff}.ck-c button{border-style:dashed;border-color:var(--pri);color:var(--pri);font-weight:700;border-radius:9px}.ck-c button.on{border-style:solid;background:color-mix(in srgb,var(--pri) 12%,transparent)}
.ck-in{font:inherit;font-size:15px}.ck-act{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}.ck-msg{font-size:12.5px;color:var(--mute);white-space:pre-line}
.ck-w{margin-top:14px}.ck-wh{display:flex;justify-content:space-between;align-items:center}.ck-wh span{font-size:12.5px;font-weight:700;color:var(--warm)}
.ck-wr{border-top:1px dashed var(--line);padding:10px 0}.ck-wt{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ck-p{font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 9px;background:#f1f2f5;color:#5a6478}.ck-p.g{background:#e3f6ec;color:#127a4c}.ck-p.y{background:#fff3cf;color:#8a6100}.ck-p.r{background:#fde8e4;color:#c0392b}.ck-p.b{background:#e8edff;color:#3d63f5}
.ck-items{margin:0 0 8px;padding-left:18px;font-size:13px;line-height:1.7}.lk{font:inherit;font-size:12.5px;border:0;background:none;color:var(--pri);text-decoration:underline;cursor:pointer;padding:0 2px}
#vw-chk{display:flex;flex-direction:column;gap:10px}.ck-dd{display:flex;justify-content:space-between;align-items:center;background:#1b2333;color:#fff;border-radius:10px;padding:8px 12px;font-weight:700;font-size:13.5px}
.ck-sum{display:flex;gap:8px;flex-wrap:wrap}.ck-sum div{border-radius:12px;padding:8px 16px;font-size:12.5px;font-weight:700}.ck-sum b{display:block;font-size:20px}
.ck-sum .g{background:#e3f6ec;color:#127a4c}.ck-sum .y{background:#fff3cf;color:#8a6100}.ck-sum .r{background:#fde8e4;color:#c0392b}.ck-sum .u{background:#f1f2f5;color:#5a6478}
.ck-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;background:#c3c8d3}.ck-dot.g{background:#1fa463}.ck-dot.y{background:#f2b705}.ck-dot.r{background:#e04b3a}
#vw-chk .py-t td small{display:block;color:var(--mute);font-size:11.5px}#vw-chk .py-t tr[data-ck]{cursor:pointer}#vw-chk .py-t tr.on{background:color-mix(in srgb,var(--pri) 8%,transparent)}.ck-dec{color:var(--pri)}
.ck-bar{height:10px;border-radius:9px;background:#eceff5;overflow:hidden}.ck-bar i{display:block;height:100%;background:#c3c8d3}.ck-bar i.g{background:#1fa463}.ck-bar i.y{background:#f2b705}.ck-bar i.r{background:#e04b3a}
.ck-it input,.ck-it select{font:inherit;font-size:13px;width:auto;min-width:0;padding:4px 6px;height:auto}.ck-it input[type=checkbox],.ck-scope input,#vw-chk .py-r input{-webkit-appearance:auto;appearance:auto;width:auto;accent-color:var(--pri)}
.ck-scope summary{cursor:pointer;font-weight:700;font-size:13px}.ck-scope div{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:6px;font-size:13px;align-items:center}.ck-scope label{display:flex;flex-direction:row!important;gap:5px;align-items:center;margin:0}
#ck_note{font:inherit;width:100%;box-sizing:border-box}`;document.head.appendChild(st)}
return {worker,staff,forPay,ensure,cands,MONTHS}})();
