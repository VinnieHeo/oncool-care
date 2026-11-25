/* 월별 지급 서류 (2026-11-25) · 추천 선생님 화면: 입금된 달마다 수령증 서명 · 고지서 · 납부 내역 · 모니터링 메모
   11월분은 수령증만 필수, 12월분부터 네 가지 모두 필수 · 사진은 올리기 전에 가릴 수 있음
   v2: 첫 화면에 '선정 가구 관리' 버튼 (같은 로그인 → 선정 가구 목록으로 바로 이동, 남은 가구 수 표시)
   v3: 입금 전 선정 가구도 목록에 보이고, 서류 칸은 입금되면 열림
   v5: 모든 달 네 가지 모두 필수 · 고지서는 사진 + 사용량 + 요금 모두 입력
   v6: '추천하기'는 추천·가정방문 서류만, '선정 가구 관리'는 선정 가구 목록만 보이게 화면 분리
   v7: '납부 내역' → '통장 사진 또는 납부 영수증' · 사진 가리기(칠하기) 기능 뺌, 고른 사진을 확인하고 저장
   v8: '모니터링 메모' → '안심 체크' (온·쿨 안심 체크리스트를 휴대폰으로, 확인자 전자서명)
   v10: 고지서 · 통장/영수증을 온쿨체크로 합침 (한 번 올리면 신호등 판정에 바로 쓰임, 금액·날짜·사용량 후보 읽기) */
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ORG="안양시만안종합사회복지관";
const K=[["rcpt","수령증 서명"],["bill","전기·가스 고지서"],["paid","통장 사진 또는 납부 영수증"],["memo","안심 체크"]];
const need=m=>["rcpt","bill","paid","memo"];
const mon=m=>Number(m.slice(5,7))+"월";
const md=d=>d?Number(String(d).slice(5,7))+"/"+Number(String(d).slice(8,10)):"";
const won=n=>n||n===0?Number(n).toLocaleString("ko-KR")+"원":"";
const dot=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(d||"");return m?`${m[1]}. ${m[2]}. ${m[3]}.`:""};
let L=[],C=[],open=null,msg="",WANT=false,LOADED=false,MODE="rec";
/* 화면 나누기: rec = 추천하기(추천·가정방문 서류), sel = 선정 가구 관리 */
function mode(m){MODE=m;const h=$("#home");if(!h)return;h.classList.toggle("pd-only",m==="sel");
  const hi=h.querySelector(".hello .hint");if(hi){if(hi.dataset.t0===undefined)hi.dataset.t0=hi.textContent;hi.textContent=m==="sel"?"선정된 가구의 지급 후 서류를 받아 주세요.":hi.dataset.t0}}
document.addEventListener("click",ev=>{if(ev.target.closest('.mc.go[data-view="go"]'))mode("rec")},true);
const key=x=>x.case_id+"|"+x.month;
const left=x=>need(x.month).filter(k=>!(x.docs||{})[k]);
async function load(){try{L=await rpc("oncool_w_pay_months",{p_token:TOKEN})||[];LOADED=true}catch(e){L=[]}
  if(window.CHK&&CHK.wFetch)await CHK.wFetch();
  try{C=await rpc("oncool_w_pay_cases",{p_token:TOKEN})||[]}catch(e){C=[]}badge()}
const locked=()=>C.filter(c=>!L.some(x=>x.case_id===c.case_id));
function lockHTML(c){const nx=c.next||{};const sub=[c.approved?`선정 ${md(c.approved)}`:"선정",nx.paid_on?`입금 예정 ${md(nx.paid_on)}`:"입금 전"].join(" · ");
  return `<div class="pd-row pd-lk"><div class="pd-h pd-hl"><span><b>${esc(c.elder_name)}</b> <small>${esc(c.dong||"")}</small></span><span class="pd-lb">입금 전</span><span class="pd-s">${sub}</span><span class="pd-s pd-ls">수령증 서명 · 고지서 · 통장/영수증 · 안심 체크는 입금되면 열려요</span></div></div>`}
/* 첫 화면 버튼 */
function badge(){const b=$("#pdgo-n");if(!b)return;const n=TOKEN&&LOADED?L.filter(x=>left(x).length).length:0;b.textContent=n?String(n):"";b.hidden=!n}
function addBtn(){const g=$(".menu .mc.go");if(!g||$("#pdgo"))return;
  g.insertAdjacentHTML("afterend",`<button class="mc sel" id="pdgo" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg><span><b>선정 가구 관리<em id="pdgo-n" class="pd-n" hidden></em></b><small>수령증 서명 · 고지서 · 모니터링</small></span></button>`);
  g.parentNode.classList.add("has-sel");
  $("#pdgo").onclick=()=>{WANT=true;mode("sel");mview("go")}}
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
  else if(k==="memo")body=chkHTML(x,d&&d.meta&&d.meta.chk?d.meta:null);
  else body=ckBody(x,k);
  return `<div class="pd-it" data-k="${k}"><div class="pd-ih"><b>${l}</b>${st}</div>${body}</div>`}
/* 온쿨체크 (고지서 · 통장/영수증): 올린 사진은 온쿨체크 증빙으로 저장되어 직원 화면 신호등 판정에 쓰임 */
const CKK={bill:["고지서"],paid:["영수증","통장 내역"]};
function ckBody(x,k){if(!(window.CHK&&CHK.wAdd))return `<p class="pd-tip">온쿨체크를 불러오지 못했어요. 새로고침해 주세요.</p>`;
  const k0=CHK.wItems(x.case_id,x.month),its=(k0.items||[]).filter(i=>CKK[k].includes(i.kind)),lock=!!k0.confirmed,me=CHK.me();
  const tip=k==="bill"?`이번 달 전기·가스(또는 등유) 고지서를 찍어 올려 주세요. 요금과 사용량은 사진에서 찾아 드려요.`:`통장 사진이나 납부 영수증을 찍어 주세요. 통장은 <b>난방비 입금 줄</b>과 <b>요금 출금 줄</b>이 보이게 찍어 주세요.`;
  return `<p class="pd-tip">${tip}</p>${its.length?`<ul class="pd-ck">${its.map(i=>`<li><span><b>${esc(i.use||"")} ${esc(i.kind)}</b> ${won(i.amount)}${i.date?" · "+md(i.date):""}${i.usage?" · "+esc(i.usage):""}</span><span>${i.file?`<button type="button" class="pd-lk" data-act="ckv" data-path="${esc(i.file)}">보기</button>`:""}${!lock&&i.by===me?`<button type="button" class="pd-lk" data-act="ckd" data-id="${esc(i.id)}">지우기</button>`:""}</span></li>`).join("")}</ul>`:""}
    ${lock?`<p class="pd-tip">복지관이 확인을 마친 달이에요.</p>`:`<button type="button" class="btn sec pd-file" data-act="ckadd">${its.length?"한 장 더 올리기":"사진 올리기"}</button>`}<div class="pd-ckf"></div>`}
/* 안심 체크 */
const CK={how:["가정방문","유선"],vent:["함","안 함"],heat:["정상","고장","사용 안 함"],use:["충분히","아껴서","거의 안 함"],health:["좋음","보통","나쁨"],
  sym:["없음","오한·떨림","감기","손발 저림·창백","어지럼"],risk:["65세 이상","혼자 생활","만성질환","거동 불편","음주 잦음"],
  home:["없음","외풍","결로","곰팡이","동파 우려","보일러·난방기 이상","전기·가스 안전 우려"],
  told:["예방수칙 안내","예방수칙 카드 부착 확인","비상연락처 적어 드림","한파 특보 때 연락 방법","지원금은 냉·난방비에 사용","바우처 사용기한·잔액"],
  act:["이상 없음","효율 개선 필요","직원 상담 필요","긴급 연계(119·병원)"]};
const CKL={how:"방법",vent:"환기",heat:"난방기기",use:"난방 사용",health:"건강",sym:"최근 증상",risk:"고위험 요인",home:"주거 위험",told:"안내한 내용",act:"조치·연계"};
const MULTI=["sym","risk","home","told","act"];
function prevRisk(x){const o=L.filter(v=>v.case_id===x.case_id&&v.month<x.month&&v.docs&&v.docs.memo&&v.docs.memo.meta&&v.docs.memo.meta.risk).sort((a,b)=>a.month<b.month?1:-1)[0];return o?o.docs.memo.meta.risk:[]}
function chkHTML(x,m){const v=m||{risk:prevRisk(x)},on=(f,o)=>MULTI.includes(f)?(v[f]||[]).includes(o):v[f]===o;
  const grp=f=>`<fieldset class="ck-g"><legend>${CKL[f]}${MULTI.includes(f)?' <small>여러 개</small>':""}</legend><div class="ck-o">${CK[f].map(o=>`<label class="ck"><input type="${MULTI.includes(f)?"checkbox":"radio"}" name="ck_${f}" value="${esc(o)}"${on(f,o)?" checked":""}><span>${esc(o)}</span></label>`).join("")}</div></fieldset>`;
  return `<div class="ck-box">${m?`<p class="pd-tip">저장한 내용이에요. 고쳐서 다시 저장할 수 있어요.</p>`:""}${grp("how")}
    <fieldset class="ck-g"><legend>실내온도</legend><div class="ck-o"><label class="ck-t">거실 <input data-f="t1" inputmode="decimal" maxlength="4" value="${esc(v.t1||"")}"> ℃</label><label class="ck-t">침실 <input data-f="t2" inputmode="decimal" maxlength="4" value="${esc(v.t2||"")}"> ℃</label></div></fieldset>
    ${["vent","heat","use","health","sym","risk"].map(grp).join("")}
    <div class="pd-q"><label>복용 중인 약</label><input data-f="med" maxlength="60" value="${esc(v.med||"")}"></div>
    ${["home","told","act"].map(grp).join("")}
    <div class="pd-q"><label>특이사항 (필수, 없으면 '없음')</label><textarea data-f="note" rows="3" maxlength="400">${esc(v.note||"")}</textarea></div>
    <div class="pd-q"><label>확인자 서명 · <b>추천 선생님이 서명해 주세요</b> (어르신 서명 아님)</label><canvas class="pd-pad" width="600" height="220" aria-label="확인자 서명칸"></canvas></div>
    <div class="pd-a"><button type="button" class="btn sec" data-act="clr">다시 쓰기</button><button type="button" class="btn" data-act="chk">안심 체크 저장</button></div></div>`}
function chkRead(it){const g=f=>MULTI.includes(f)?[...it.querySelectorAll(`[name="ck_${f}"]:checked`)].map(i=>i.value):((it.querySelector(`[name="ck_${f}"]:checked`)||{}).value||"");
  const m={chk:1};Object.keys(CK).forEach(f=>m[f]=g(f));["t1","t2","med","note"].forEach(f=>m[f]=it.querySelector(`[data-f="${f}"]`).value.trim());return m}
function sigData(c){const s=document.createElement("canvas");s.width=300;s.height=110;const g=s.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,300,110);g.drawImage(c,0,0,300,110);return s.toDataURL("image/png")}
function panel(x){return `<div class="pd-p">${K.map(([k,l])=>item(x,k,l)).join("")}<p class="pd-msg" role="status">${esc(msg)}</p></div>`}
function paint(){let box=$("#pdbox");badge();
  const LK=locked();
  if(!L.length&&!LK.length&&!WANT&&MODE!=="sel"){if(box)box.remove();return}
  if(!box){box=document.createElement("div");box.id="pdbox";($("#vlist")||$("#hlist")||$("#golist")).after(box)}
  if(!L.length&&!LK.length){box.innerHTML=`<div class="pd-head"><b>선정 가구 관리</b></div><p class="hint" style="margin:0">아직 선정된 가구가 없어요. 선정되면 여기에 가구가 나타나요.</p>`;return}
  const todo=L.filter(x=>left(x).length).length,cnt=new Set([...L,...C].map(x=>x.case_id)).size;
  const rows=[...L.map(x=>[x.elder_name+"|"+x.month,rowHTML(x)]),...LK.map(c=>[c.elder_name+"|~",lockHTML(c)])].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(r=>r[1]).join("");
  box.innerHTML=`<div class="pd-head"><b>선정 가구 관리</b><span>선정 ${cnt}${todo?` · 할 일 ${todo}`:""}</span></div><p class="hint" style="margin:0 0 6px">방문하실 때 수령증 서명, 고지서(사용량·요금), 통장 사진 또는 납부 영수증, 안심 체크를 모두 남겨 주세요. 입금 전 가구는 입금되면 서류 칸이 열려요.</p>`+rows;
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
};
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
    if(a==="ckadd"){const box=it.querySelector(".pd-ckf");btn.hidden=true;
      CHK.wAdd(box,x.case_id,x.month,{kinds:CKK[k],needUsage:k==="bill",count:k==="bill"?false:undefined,amountLabel:k==="bill"?"요금 (고지서 청구 금액)":"낸 금액"},async item=>{
        await mark(x,k,{chk:1,path:item.file,kind:item.kind,use:item.use,amount:item.amount,date:item.date,usage:item.usage});await load();msg=(k==="bill"?"고지서를":"통장 사진·납부 영수증을")+" 저장했어요.";paint()});
      box.addEventListener("click",e2=>{if(e2.target.closest("[data-ckx]"))btn.hidden=false});btn.disabled=false;return}
    if(a==="ckv"){CHK.view(x.case_id,btn.dataset.path);btn.disabled=false;return}
    if(a==="ckd"){await CHK.wDel(x.case_id,x.month,btn.dataset.id);msg="지웠어요.";paint();return}
    if(a==="chk"){const m=chkRead(it),need=[];
      if(!m.how)need.push("방법");if(!m.t1&&!m.t2)need.push("실내온도");if(!m.vent)need.push("환기");if(!m.told.includes("예방수칙 안내"))need.push("예방수칙 안내");if(!m.note)need.push("특이사항");
      const c=it.querySelector(".pd-pad");if(!c._ink)need.push("확인자 서명");
      if(need.length){say(it,need.join(", ")+" 항목을 채워 주세요.");btn.disabled=false;return}
      m.sig=sigData(c);m.at=new Date().toISOString();m.alert=m.act.includes("긴급 연계(119·병원)")||m.act.includes("직원 상담 필요")||m.health==="나쁨";
      await mark(x,"memo",m);msg="안심 체크를 저장했어요."+(m.alert?" 직원에게 확인 필요로 표시돼요.":"")}
    if(a==="memo"){const t=it.querySelector('[data-f="memo"]').value.trim();if(!t){say(it,"메모를 적어 주세요.");btn.disabled=false;return}
      await mark(x,"memo",{text:t});msg="메모를 저장했어요."}
    if(a==="up"){if(!MK){say(it,"사진을 먼저 골라 주세요.");btn.disabled=false;return}
      if(k==="bill"){const u=it.querySelector('[data-f="usage"]').value.trim(),f=it.querySelector('[data-f="fee"]').value.trim();
        if(!u||!f){say(it,"사용량과 요금을 모두 적어 주세요.");btn.disabled=false;return}}
      let blob=MK.file,type=MK.file.type||"image/jpeg";
      if(MK.cv&&!MK.cv.hidden){blob=await blobOf(MK.cv,"image/jpeg",.85);type="image/jpeg"}
      const path=await upload(x,k,blob,type);const meta={path};
      if(k==="bill"){meta.usage=it.querySelector('[data-f="usage"]').value.trim();meta.fee=it.querySelector('[data-f="fee"]').value.trim()}
      await mark(x,k,meta);MK=null;msg=(k==="bill"?"고지서를":"통장 사진·납부 영수증을")+" 저장했어요."}
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
#home:not(.pd-only) #pdbox{display:none}#home.pd-only .big>:not(#pdbox),#home.pd-only>.card{display:none!important}#home.pd-only #pdbox{margin-top:0}
.ck-box{display:flex;flex-direction:column;gap:10px}.ck-g{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.ck-g legend{font-size:14px;font-weight:700;padding:0;margin-bottom:6px}.ck-g legend small{font-weight:400;color:var(--mute,#666)}
.ck-o{display:flex;flex-wrap:wrap;gap:6px}.ck{position:relative;cursor:pointer}.ck input{position:absolute;opacity:0;width:1px;height:1px}.ck span{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border:1px solid var(--line,#ccc);border-radius:999px;font-size:14px;background:var(--surface,#fff)}
.ck input:checked+span{background:var(--pri,#1769d6);border-color:var(--pri,#1769d6);color:#fff;font-weight:700}.ck input:focus-visible+span{outline:2px solid var(--pri,#1769d6);outline-offset:2px}
.ck-t{display:flex;align-items:center;gap:6px;font-size:14px}.ck-t input{width:64px;font:inherit;font-size:16px;text-align:center}
#chkw{display:none!important}.pd-ck{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.pd-ck li{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:14px;background:var(--soft,#f6f7fb);border-radius:10px;padding:8px 10px}
.pd-lk{all:unset;cursor:pointer;color:var(--pri,#1769d6);font-weight:700;font-size:13px;padding:4px 6px}.pd-ckf:empty{display:none}
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
