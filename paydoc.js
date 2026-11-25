/* 월별 지급 서류 (2026-11-25) · 추천 선생님 화면: 입금된 달마다 수령증 서명 · 고지서 · 납부 내역 · 모니터링 메모
   11월분은 수령증만 필수, 12월분부터 네 가지 모두 필수 · 사진은 올리기 전에 가릴 수 있음
   v2: 첫 화면에 '선정 가구 관리' 버튼 (같은 로그인 → 선정 가구 목록으로 바로 이동, 남은 가구 수 표시)
   v3: 입금 전 선정 가구도 목록에 보이고, 서류 칸은 입금되면 열림
   v5: 모든 달 네 가지 모두 필수 · 고지서는 사진 + 사용량 + 요금 모두 입력 */
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ORG="안양시만안종합사회복지관";
const K=[["rcpt","수령증 서명"],["bill","전기·가스 고지서"],["paid","납부 내역"],["memo","모니터링 메모"]];
const need=m=>["rcpt","bill","paid","memo"];
const mon=m=>Number(m.slice(5,7))+"월";
const md=d=>d?Number(String(d).slice(5,7))+"/"+Number(String(d).slice(8,10)):"";
const won=n=>n||n===0?Number(n).toLocaleString("ko-KR")+"원":"";
const dot=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(d||"");return m?`${m[1]}. ${m[2]}. ${m[3]}.`:""};
let L=[],C=[],open=null,msg="",WANT=false,LOADED=false;
const key=x=>x.case_id+"|"+x.month;
const left=x=>need(x.month).filter(k=>!(x.docs||{})[k]);
async function load(){try{L=await rpc("oncool_w_pay_months",{p_token:TOKEN})||[];LOADED=true}catch(e){L=[]}
  try{C=await rpc("oncool_w_pay_cases",{p_token:TOKEN})||[]}catch(e){C=[]}badge()}
const locked=()=>C.filter(c=>!L.some(x=>x.case_id===c.case_id));
function lockHTML(c){const nx=c.next||{};const sub=[c.approved?`선정 ${md(c.approved)}`:"선정",nx.paid_on?`입금 예정 ${md(nx.paid_on)}`:"입금 전"].join(" · ");
  return `<div class="pd-row pd-lk"><div class="pd-h pd-hl"><span><b>${esc(c.elder_name)}</b> <small>${esc(c.dong||"")}</small></span><span class="pd-lb">입금 전</span><span class="pd-s">${sub}</span><span class="pd-s pd-ls">수령증 서명 · 고지서 · 납부 내역 · 메모는 입금되면 열려요</span></div></div>`}
/* 첫 화면 버튼 */
function badge(){const b=$("#pdgo-n");if(!b)return;const n=TOKEN&&LOADED?L.filter(x=>left(x).length).length:0;b.textContent=n?String(n):"";b.hidden=!n}
function addBtn(){const g=$(".menu .mc.go");if(!g||$("#pdgo"))return;
  g.insertAdjacentHTML("afterend",`<button class="mc sel" id="pdgo" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg><span><b>선정 가구 관리<em id="pdgo-n" class="pd-n" hidden></em></b><small>수령증 서명 · 고지서 · 모니터링</small></span></button>`);
  g.parentNode.classList.add("has-sel");
  $("#pdgo").onclick=()=>{WANT=true;mview("go")}}
function rowHTML(x){const n=need(x.month),got=n.filter(k=>(x.docs||{})[k]).length,done=got===n.length,on=open===key(x);
  return `<div class="pd-row${done?" ok":""}${on?" on":""}"><button type="button" class="pd-h" data-pd="${esc(key(x))}"><span><b>${esc(x.elder_name)}</b> <small>${esc(x.dong||"")}</small></span><span class="pd-b">${done?"완료":`서류 ${got}/${n.length}`}</span><span class="pd-s">${mon(x.month)}분 ${won(x.amount)} · 입금 ${md(x.paid_on)}</span></button>${on?panel(x):""}</div>`}
function item(x,k,l){const d=(x.docs||{})[k],req=need(x.month).includes(k);
  const st=d?`<span class="pd-ok">완료 ${md(d.at)}</span>`:(req?`<span class="pd-need">필수</span>`:`<span class="pd-opt">선택</span>`);
  let body="";
  if(k==="rcpt")body=`<div class="pd-rc"><p>본인은 ‘온(溫) 앤 쿨(cool)’ 사업 참여 지원가구의 가구원으로서 기관으로부터 아래와 같이 본 사업 참여에 따른 냉·난방비 지원을 받았음을 확인합니다.</p>
    <dl><dt>수령인</dt><dd>${esc(x.elder_name)}</dd><dt>지원구분</dt><dd>난방비 (${mon(x.month)}분)</dd><dt>수령일</dt><dd>${dot(x.paid_on)}</dd><dt>지원금액</dt><dd>${won(x.amount)}</dd><dt>지원기관</dt><dd>${ORG}</dd></dl>
    <div class="pd-q"><label>서명하는 분</label><select data-f="rel"><option>본인</option><option>가족 대리</option><option>기타 대리</option></select><input data-f="who" maxlength="20" placeholder="대리 서명이면 이름과 관계를 적어 주세요" hidden></div>
    <canvas class="pd-pad" width="600" height="220" aria-label="서명칸"></canvas>
    <div class="pd-a"><button type="button" class="btn sec" data-act="clr">다시 쓰기</button><button type="button" class="btn" data-act="rcpt">서명 완료</button></div></div>`;
  else if(k==="memo")body=`<textarea data-f="memo" rows="3" maxlength="500" placeholder="실내 온도, 난방 사용, 건강 상태, 특이사항을 짧게 적어 주세요">${esc(d&&d.meta&&d.meta.text||"")}</textarea><div class="pd-a"><button type="button" class="btn" data-act="memo">메모 저장</button></div>`;
  else body=`${k==="paid"?`<p class="pd-tip">납부 영수증이 있으면 그걸 찍어 주세요. 통장은 <b>난방비 입금 줄</b>과 <b>요금 출금 줄</b>만 보이게 찍어 주세요.</p>`:`<p class="pd-tip">이번 달 전기·가스(또는 등유) 고지서를 꼭 찍어 올리고, 사용량과 요금도 적어 주세요.</p>`}
    ${k==="bill"?`<div class="pd-q"><label>사용량 (필수)</label><input data-f="usage" maxlength="40" placeholder="예) 310 kWh, 48 m³" value="${esc(d&&d.meta&&d.meta.usage||"")}"></div><div class="pd-q"><label>요금 (필수)</label><input data-f="fee" maxlength="20" inputmode="numeric" placeholder="예) 45,600원" value="${esc(d&&d.meta&&d.meta.fee||"")}"></div>`:""}
    <label class="btn sec pd-file">사진 찍기·고르기<input type="file" accept="image/*,application/pdf" data-file="${k}" hidden></label>
    <div class="pd-mask" hidden><p class="pd-tip">가릴 곳(다른 거래, 잔액, 계좌번호 등)을 손가락으로 칠해 주세요.</p><canvas class="pd-mc"></canvas>
      <div class="pd-a"><button type="button" class="btn sec" data-act="undo">처음부터</button><button type="button" class="btn" data-act="up" data-k="${k}">이대로 저장</button></div></div>`;
  return `<div class="pd-it" data-k="${k}"><div class="pd-ih"><b>${l}</b>${st}</div>${body}</div>`}
function panel(x){return `<div class="pd-p">${K.map(([k,l])=>item(x,k,l)).join("")}<p class="pd-msg" role="status">${esc(msg)}</p></div>`}
function paint(){let box=$("#pdbox");badge();
  const LK=locked();
  if(!L.length&&!LK.length&&!WANT){if(box)box.remove();return}
  if(!box){box=document.createElement("div");box.id="pdbox";($("#vlist")||$("#hlist")||$("#golist")).after(box)}
  if(!L.length&&!LK.length){box.innerHTML=`<div class="pd-head"><b>선정 가구 관리</b></div><p class="hint" style="margin:0">아직 선정된 가구가 없어요. 선정되면 여기에 가구가 나타나요.</p>`;return}
  const todo=L.filter(x=>left(x).length).length,cnt=new Set([...L,...C].map(x=>x.case_id)).size;
  const rows=[...L.map(x=>[x.elder_name+"|"+x.month,rowHTML(x)]),...LK.map(c=>[c.elder_name+"|~",lockHTML(c)])].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(r=>r[1]).join("");
  box.innerHTML=`<div class="pd-head"><b>선정 가구 관리</b><span>선정 ${cnt}${todo?` · 할 일 ${todo}`:""}</span></div><p class="hint" style="margin:0 0 6px">방문하실 때 수령증 서명, 고지서(사용량·요금), 납부 내역, 모니터링 메모를 모두 남겨 주세요. 입금 전 가구는 입금되면 서류 칸이 열려요.</p>`+rows;
  box.querySelectorAll(".pd-pad").forEach(pad);
  box.querySelectorAll('select[data-f="rel"]').forEach(s=>s.onchange=()=>{s.parentNode.querySelector('[data-f="who"]').hidden=s.value==="본인"})}
async function show(){if(!TOKEN)return;await load();paint();
  if(WANT){WANT=false;const b=$("#pdbox");if(b)setTimeout(()=>b.scrollIntoView({behavior:"smooth",block:"start"}),60)}}
/* 서명칸 */
function pad(c){const g=c.getContext("2d");g.lineWidth=4;g.lineCap="round";g.lineJoin="round";g.strokeStyle="#111";c._ink=false;
  const pt=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
  let on=false;c.style.touchAction="none";
  c.onpointerdown=e=>{on=true;c.setPointerCapture(e.pointerId);const[x,y]=pt(e);g.beginPath();g.moveTo(x,y)};
  c.onpointermove=e=>{if(!on)return;const[x,y]=pt(e);g.lineTo(x,y);g.stroke();c._ink=true};
  c.onpointerup=c.onpointercancel=()=>{on=false}}
/* 가리기 */
let MK=null;
function maskStart(it,file){const cv=it.querySelector(".pd-mc"),box=it.querySelector(".pd-mask");
  if(file.type==="application/pdf"){MK={file};box.hidden=false;cv.hidden=true;return}
  const img=new Image();img.onload=()=>{const s=Math.min(1,1600/Math.max(img.width,img.height));cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);
    const g=cv.getContext("2d");g.drawImage(img,0,0,cv.width,cv.height);cv.hidden=false;box.hidden=false;MK={file,img,cv};
    g.lineWidth=Math.max(18,cv.width/25);g.lineCap="round";g.strokeStyle="#000";cv.style.touchAction="none";let on=false;
    const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
    cv.onpointerdown=e=>{on=true;cv.setPointerCapture(e.pointerId);const[x,y]=pt(e);g.beginPath();g.moveTo(x,y);g.lineTo(x+.1,y);g.stroke()};
    cv.onpointermove=e=>{if(!on)return;const[x,y]=pt(e);g.lineTo(x,y);g.stroke()};cv.onpointerup=cv.onpointercancel=()=>{on=false}};
  img.onerror=()=>{MK={file};box.hidden=false;cv.hidden=true};img.src=URL.createObjectURL(file)}
const blobOf=(cv,t,q)=>new Promise(r=>cv.toBlob(r,t,q));
async function upload(x,k,blob,type){const u=await wefn({action:"upload_url",case_id:x.case_id,doc:`m/${x.month}/${k}`,content_type:type});
  const r=await fetch(u.signedUrl,{method:"PUT",headers:{"Content-Type":type},body:blob});if(!r.ok)throw new Error("업로드 실패 "+r.status);return u.path}
async function mark(x,k,meta){await rpc("oncool_w_pay_mark",{p_token:TOKEN,p_case:x.case_id,p_month:x.month,p_kind:k,p_meta:meta})}
const say=(it,t)=>{const m=it.closest(".pd-p").querySelector(".pd-msg");if(m)m.textContent=t};
async function act(x,it,a,btn){const k=it.dataset.k;msg="";
  try{btn.disabled=true;
    if(a==="clr"){const c=it.querySelector(".pd-pad");c.getContext("2d").clearRect(0,0,c.width,c.height);c._ink=false;btn.disabled=false;return}
    if(a==="undo"){if(MK&&MK.img){const g=MK.cv.getContext("2d");g.drawImage(MK.img,0,0,MK.cv.width,MK.cv.height)}btn.disabled=false;return}
    if(a==="rcpt"){const c=it.querySelector(".pd-pad");if(!c._ink){say(it,"서명을 해 주세요.");btn.disabled=false;return}
      const rel=it.querySelector('[data-f="rel"]').value,who=it.querySelector('[data-f="who"]').value.trim();
      if(rel!=="본인"&&!who){say(it,"대리 서명은 이름과 관계를 적어 주세요.");btn.disabled=false;return}
      const path=await upload(x,"rcpt",await blobOf(c,"image/png"),"image/png");
      await mark(x,"rcpt",{path,rel,who,signed_at:new Date().toISOString()});msg="수령증 서명을 저장했어요."}
    if(a==="memo"){const t=it.querySelector('[data-f="memo"]').value.trim();if(!t){say(it,"메모를 적어 주세요.");btn.disabled=false;return}
      await mark(x,"memo",{text:t});msg="메모를 저장했어요."}
    if(a==="up"){if(!MK){say(it,"사진을 먼저 골라 주세요.");btn.disabled=false;return}
      if(k==="bill"){const u=it.querySelector('[data-f="usage"]').value.trim(),f=it.querySelector('[data-f="fee"]').value.trim();
        if(!u||!f){say(it,"사용량과 요금을 모두 적어 주세요.");btn.disabled=false;return}}
      let blob=MK.file,type=MK.file.type||"image/jpeg";
      if(MK.cv&&!MK.cv.hidden){blob=await blobOf(MK.cv,"image/jpeg",.85);type="image/jpeg"}
      const path=await upload(x,k,blob,type);const meta={path};
      if(k==="bill"){meta.usage=it.querySelector('[data-f="usage"]').value.trim();meta.fee=it.querySelector('[data-f="fee"]').value.trim()}
      await mark(x,k,meta);MK=null;msg=(k==="bill"?"고지서":"납부 내역")+"를 저장했어요."}
    await load()}catch(e){msg=/session/.test(e.message)?"다시 로그인해 주세요.":/not_paid/.test(e.message)?"아직 입금 기록이 없는 달이에요.":"저장하지 못했어요: "+e.message}
  paint()}
document.addEventListener("click",ev=>{const h=ev.target.closest("[data-pd]");if(h){open=open===h.dataset.pd?null:h.dataset.pd;msg="";MK=null;paint();return}
  const b=ev.target.closest("#pdbox [data-act]");if(!b)return;const it=b.closest(".pd-it"),x=L.find(v=>key(v)===open);if(x&&it)act(x,it,b.dataset.act,b)});
document.addEventListener("change",ev=>{const f=ev.target.closest("#pdbox [data-file]");if(!f||!f.files[0])return;maskStart(f.closest(".pd-it"),f.files[0])});
const _gh=goHome;goHome=async function(){const r=await _gh.apply(this,arguments);show();return r};
const st=document.createElement("style");st.textContent=`
.menu.has-sel{grid-template-columns:repeat(6,1fr)}.menu.has-sel>.mc{grid-column:span 2}.menu.has-sel>.mc.go,.menu.has-sel>.mc.sel{grid-column:span 3}
.menu.has-sel>.mc.who,.menu.has-sel>.mc.about,.menu.has-sel>.mc.call{min-height:0;padding:14px 10px;align-items:center;text-align:center;gap:6px}
.menu.has-sel>.mc.who small,.menu.has-sel>.mc.about small,.menu.has-sel>.mc.call small{font-size:12px}
.mc.sel{background:linear-gradient(150deg,#22b37a 0%,#16a06a 55%,#0f8a5b 100%);color:#fff;border-color:transparent;box-shadow:0 18px 34px -16px rgba(22,160,106,.75)}
.mc.sel svg{background:rgba(255,255,255,.18);color:#fff}.mc.sel small{color:inherit;opacity:.85}
.pd-n{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;margin-left:6px;border-radius:999px;background:#fff;color:#0f8a5b;font-style:normal;font-size:13px;font-weight:800;vertical-align:2px;box-sizing:border-box}
@media (max-width:340px){.menu.has-sel{grid-template-columns:1fr}.menu.has-sel>.mc{grid-column:auto}}
.pd-row.pd-lk{opacity:.9}.pd-hl{cursor:default}.pd-lb{font-size:13px;font-weight:700;color:var(--mute,#666);background:var(--soft,#f3f4f6);border-radius:999px;padding:2px 9px}.pd-ls{font-size:12.5px}
#pdbox{margin-top:14px;display:flex;flex-direction:column;gap:8px}.pd-head{display:flex;justify-content:space-between;align-items:center}.pd-head span{font-size:13px;color:var(--mute,#666)}
.pd-row{background:var(--surface,#fff);border-radius:14px;box-shadow:var(--lift,0 1px 3px rgba(0,0,0,.08))}.pd-row.ok{opacity:.8}
.pd-h{all:unset;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;gap:2px 8px;width:100%;padding:12px 14px;cursor:pointer}.pd-h small{color:var(--mute,#666)}
.pd-b{font-size:13px;font-weight:700;color:var(--pri,#1769d6)}.pd-row.ok .pd-b{color:var(--green,#17864a)}.pd-s{grid-column:1/-1;font-size:13px;color:var(--mute,#666)}
.pd-p{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px}.pd-it{border-top:1px solid var(--line,#eee);padding-top:10px;display:flex;flex-direction:column;gap:8px}
.pd-ih{display:flex;justify-content:space-between;align-items:center}.pd-ok{color:var(--green,#17864a);font-size:13px;font-weight:700}.pd-need{color:#c0392b;font-size:13px;font-weight:700}.pd-opt{color:var(--mute,#666);font-size:13px}
.pd-rc p{margin:0 0 6px;font-size:14px;line-height:1.6}.pd-rc dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0 0 8px;font-size:14px}.pd-rc dt{color:var(--mute,#666)}.pd-rc dd{margin:0}
.pd-pad{width:100%;height:auto;aspect-ratio:600/220;border:2px dashed var(--line,#ccc);border-radius:12px;background:#fff}
.pd-mc{width:100%;height:auto;border-radius:8px;background:#fff}.pd-a{display:flex;gap:8px;flex-wrap:wrap}.pd-a .btn{flex:1;min-height:44px}
.pd-q{display:flex;flex-direction:column;gap:4px}.pd-q label{font-size:13px;color:var(--mute,#666)}.pd-q select,.pd-q input,.pd-it textarea{font:inherit;font-size:16px}
.pd-tip{margin:0;font-size:13px;color:var(--mute,#666)}.pd-file{text-align:center;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.pd-msg{margin:0;font-size:13px;font-weight:700;color:var(--pri,#1769d6)}.pd-msg:empty{display:none}`;
document.head.appendChild(st);
addBtn();
if(TOKEN)setTimeout(()=>{if($("#v-menu")&&!$("#v-menu").hidden)load();else show()},800);
})();
