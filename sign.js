/* 전자서명: 동의서·약정서 (2026-11-12 시안) */
window.SIGN=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ORG="안양시만안종합사회복지관";
const YN=["동의함","동의하지 않음"];
/* 양식: 협회 양식은 문구 그대로 (별첨 5), 복지관 양식은 06·02번 서식 */
const FORMS={
 consent:{t:"개인정보 수집·이용 및 제공에 관한 동의서",src:"협회 양식 · 별첨 5",pre:"온(溫) 앤 쿨(cool) 사업",
  sec:[
   {h:"① 지역사회 맞춤형 에너지 돌봄 온(溫) 앤 쿨(cool) 사업 신청을 위한 개인정보 수집･이용 내역",p:"한국사회복지관협회는 「개인정보보호법」제 15조 제1항 제4호에 의거하여 신청인의 필수 개인정보를 신정인의 동의  없이 수집･이용 하고 있습니다.",
    tb:[["개인정보 수집 및 이용 근거","개인정보 수집 및 이용목적","수집하는 기본 개인정보 항목","보유 및 이용기간"],["개인정보 보호법 제15조제1항1호","지원사업 지원과 서비스 제공","성명, 성별, 생년월일, 주소, 연락처, 주거상황, 경제상황, 가족사항 등 사업 참여 관련 개인정보 및 민감정보","사업 종료 후 3년"]],
    q:{k:"c1",l:"위의 내용을 확인하셨습니까?",o:["확인함"]}},
   {h:"② 지역사회 맞춤형 에너지 돌봄 온(溫) 앤 쿨(cool) 사업 신청을 위한 민감정보 수집･이용 동의",p:"한국사회복지관협회는 「개인정보보호법」제 23조에 의거하여 신청인의 민감정보를 신청인의 동의를 받아 수집하고 있습니다.",
    tb:[["개인정보 수집 및 이용목적","수집하는 기본 개인정보 항목","보유 및 이용기간"],["지원사업 지원과 서비스 제공","기초생활수급자 여부, 에너지바우처 발급 여부, 건강·장기요양보험료 고지금액 등","사업 종료 후 3년"]],
    n:"※ 귀하는 민감정보 수집·이용 동의를 거부할 권리가 있으나, 동의 거부 시 지역사회 맞춤형 에너지 돌봄 온(溫) 앤 쿨(cool) 사업 신청과 서비스 이용이 불가합니다.",
    q:{k:"c2",l:"민감정보 수집 및 이용에 동의하십니까?",o:YN}},
   {h:"③ 개인정보 제3자 제공 및 공유",p:"한국사회복지관협회는 개인정보를 개인정보 처리방침에서 고지한 제3자 제공 범위 내에서 제공하며, 정보주체의 사전 동의 없이 동 범위를 초과하여 제3자에게 제공하지 않습니다.",
    tb:[["개인정보를 제공 받는 자","제공 받는 자의 개인정보 이용 목적","제공되는 개인정보 항목","제공 받는 자의 보유 및 이용기간"],["한국사회복지관협회, 사회복지공동모금회, 숭실대학교 기업가치연구소","지원사업 서비스 평가 및 지원･관리","성명, 성별, 생년월일, 주소, 연락처, 주거상황, 경제상황, 가족사항 등 추천관련 제반서류상의 개인정보 및 민감정보","사업 종료 후 3년"]],
    n:"※ 귀하는 민감정보 수집·이용 동의를 거부할 권리가 있으나, 동의 거부 시 2지역사회 맞춤형 에너지 돌봄 온(溫) 앤 쿨(cool) 사업 신청과 서비스 이용이 불가합니다.",
    q:{k:"c3",l:"개인정보 제3자 제공에 동의하십니까?",o:YN}}],
  sign:"(법정대리인) 성명", to:""},
 consent_own:{t:"개인정보 수집·이용 동의서",src:"복지관 양식 · 06번",pre:"지역사회 맞춤형 에너지 돌봄 사업 「온(溫) 앤 쿨(cool) 케어」 · "+ORG,
  intro:ORG+"은(는) 온앤쿨케어 사업 대상자 추천과 지원을 위해 아래와 같이 개인정보를 수집·이용합니다. 내용을 읽고 동의 여부를 표시해 주세요.",
  sec:[
   {h:"① 개인정보 수집·이용 (「개인정보 보호법」 제15조)",kv:[["수집·이용 목적","온앤쿨케어 대상자 추천 접수, 선정 심사(사례판정), 가정방문 상담, 냉·난방비 지원과 사용 확인, 에너지 돌봄 사례관리, 폭염·한파 시 안부 확인"],["수집 항목 (필수)","성명, 생년월일, 성별, 연락처, 실거주 주소·거주동, 세대주 여부와 세대주 성명·생년월일, 가구원 수와 가구원 성명·생년월일, 주거 형태·주거 환경, 난방·냉방 방식, 냉·난방비 사용·체납 현황, 지급용 통장 정보(은행·계좌번호·예금주), 추천인 성명·소속\n※ 주민등록번호는 수집하지 않습니다."],["수집 항목 (선택)","고지서·영수증 사진, 주거 환경 사진, 안부 확인용 보호자 연락처"],["보유·이용 기간","사업 종료 후 5년 (사회복지공동모금회 배분사업 서류 보존 기준). 기간이 끝나면 지체 없이 파기합니다."]],
    q:{k:"o1",l:"위 개인정보 수집·이용에",o:YN}},
   {h:"② 민감정보 수집·이용 (「개인정보 보호법」 제23조)",kv:[["수집·이용 목적","지원 대상 소득 기준·유형 판정, 건강 위험에 따른 안부 확인과 사례관리"],["수집 항목","기초생활수급 여부와 급여 종류, 차상위 여부, 건강보험료 납부액, 에너지바우처 수급·사용 여부, 건강 상태(기저질환·거동, 온열·한랭질환 위험)"],["보유·이용 기간","사업 종료 후 5년"]],
    q:{k:"o2",l:"위 민감정보 수집·이용에",o:YN}},
   {h:"③ 개인정보 처리 업무 위탁 안내 (「개인정보 보호법」 제26조)",tb:[["수탁자","업무 내용","비고"],["Supabase, Inc.","추천·선정 관리 시스템의 데이터 보관 (온라인 추천서·가정방문 기록·증빙 파일)","서버 위치: 대한민국(서울) · 접근: 복지관 담당자와 추천인 본인만"]]},
   {h:"④ 알려 드립니다",li:["동의를 거부할 권리가 있습니다. 다만 ①·②에 동의하지 않으시면 이 사업의 선정과 지원을 받을 수 없습니다.","동의하지 않으시면 추천 때 입력된 정보는 지체 없이 삭제합니다.","협회·사회복지공동모금회·성과연구기관에 제공하는 정보는 한국사회복지관협회 양식(별첨 5)으로 따로 동의를 받습니다.","개인정보 열람·정정·삭제·처리정지를 요청하실 수 있습니다. (문의: "+ORG+" 마을복지과 070-8978-7710)"]}],
  sign:"정보주체(대상자)",to:ORG+"장 귀하"},
 pledge:{t:"냉·난방비 용도 약정서",src:"복지관 양식 · 02번",pre:"지역사회 맞춤형 에너지 돌봄 사업 「온(溫) 앤 쿨(cool) 케어」",
  info:1,
  sec:[{h:"■ 약정 내용",ol:["지원받은 냉·난방비는 <b>냉방·난방 비용</b>(도시가스·전기·등유·LPG·연탄, 관리비 중 난방비 등)으로만 사용하겠습니다.","냉·난방비는 <b>대상자 본인 명의 통장</b>으로 받으며, 받을 때마다 수령증에 서명하겠습니다.","매월 고지서·영수증 등으로 사용 내역을 확인하는 데 협조하겠습니다. (복지관 담당자나 에너지 돌봄단이 대신 촬영할 수 있습니다.)","냉·난방비를 다른 용도로 쓰거나 사용 확인을 거부하는 경우, 1개월 이상 연락이 닿지 않는 경우에는 지원이 중단(종결)될 수 있음을 알고 있습니다.","전출·가구원 수 변동 등 지원에 영향을 주는 변동이 생기면 바로 복지관에 알리겠습니다.","같은 사업의 지원을 다른 기관에서 중복으로 받지 않겠습니다."],
    q:{k:"p1",l:"본인은 위 내용을 충분히 설명 듣고 이해하였으며, 이를 지킬 것을 약정합니다.",o:["약정합니다"]}}],
  sign:"약정인(대상자)",to:ORG+"장 귀하"}};

function bodyHTML(f,ans,interactive,p){let h="";
  if(f.info){const v=x=>esc(x||"");h+=`<h4>■ 대상자</h4><table class="sg-kv4"><tr><th>성명</th><td>${v(p.name)}</td><th>생년월일</th><td>${v(p.birth)}</td></tr><tr><th>주소</th><td colspan="3">${v(p.addr)}</td></tr><tr><th>연락처</th><td>${v(p.phone)}</td><th>가구원 수</th><td>${v(p.size)}${p.size?" 명":""}</td></tr><tr><th>지원 기간</th><td colspan="3">2026. 11. ~ 2027. 8.</td></tr></table>`}
  if(f.intro)h+=`<p>${esc(f.intro)}</p>`;
  f.sec.forEach(s=>{h+=`<h4>${esc(s.h)}</h4>`;if(s.p)h+=`<p class="ind">${esc(s.p)}</p>`;
    if(s.tb)h+=`<div class="sg-tw"><table class="sg-tb"><tr>${s.tb[0].map(x=>`<th>${esc(x)}</th>`).join("")}</tr>${s.tb.slice(1).map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div>`;
    if(s.kv)h+=`<table class="sg-kv">${s.kv.map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b).replace(/\n/g,"<br>")}</td></tr>`).join("")}</table>`;
    if(s.li)h+=`<ul>${s.li.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
    if(s.ol)h+=`<ol>${s.ol.map(x=>`<li>${x}</li>`).join("")}</ol>`;
    if(s.n)h+=`<p class="sg-n">${esc(s.n)}</p>`;
    if(s.q){const a=ans[s.q.k];h+=`<div class="sg-q${interactive?" live":""}" data-q="${s.q.k}"><span>${esc(s.q.l)}</span><span class="sg-os">${s.q.o.map(o=>interactive?`<button type="button" class="sg-o${a===o?" on":""}${o==="동의하지 않음"?" no":""}" data-o="${esc(o)}">${a===o?"☑":"☐"} ${esc(o)}</button>`:`<span class="sg-pb">${a===o?"☑":"☐"} ${esc(o)}</span>`).join("")}</span></div>`}});
  return h}

/* ───── 서명 받기 화면 ───── */
let ov=null;
function open(k,p,onDone){const f=FORMS[k];if(!f)return;const ans={};let who="본인",drawn=false;
  ov=document.createElement("div");ov.className="sg-ov";
  ov.innerHTML=`<div class="sg-bar"><button type="button" class="sg-x" aria-label="닫기">✕</button><div><small>${esc(f.src)}</small><b>${esc(f.t)}</b></div></div>
  <div class="sg-scroll"><div class="sg-doc"><p class="sg-pre">${esc(f.pre)}</p><h3>${esc(f.t)}</h3>${bodyHTML(f,ans,true,p)}</div>
   <div class="sg-who"><b>서명하는 분</b><div class="sg-seg"><button type="button" class="on" data-w="본인">대상자 본인</button><button type="button" data-w="대리인">대리인(가족 등)</button></div>
    <div class="sg-proxy" hidden><input type="text" id="sg_pn" placeholder="대리인 성함" maxlength="20"><input type="text" id="sg_pr" placeholder="대상자와의 관계 (예: 아들)" maxlength="20"></div></div>
   <div class="sg-padw"><div class="sg-padh"><b><span id="sg_nm">${esc(p.name||"")}</span> 님 서명</b><button type="button" class="sg-clr">지우기</button></div>
    <canvas class="sg-pad"></canvas><p class="sg-ph">이 칸에 손가락으로 서명해 주세요</p></div>
   <p class="sg-meta">서명일 ${new Date().toLocaleDateString("ko-KR")} · 확인자 ${esc(p.visitor||"")} · 서명하면 위 내용에 동의한 것으로 저장돼요</p></div>
  <div class="sg-foot"><span class="sg-left"></span><button type="button" class="btn sg-ok" disabled>서명 완료</button></div>`;
  document.body.appendChild(ov);document.documentElement.style.overflow="hidden";
  const cv=ov.querySelector(".sg-pad"),ctx=cv.getContext("2d"),ok=ov.querySelector(".sg-ok"),left=ov.querySelector(".sg-left");
  function size(){const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=2.6;ctx.lineCap=ctx.lineJoin="round";ctx.strokeStyle="#111";drawn=false;ov.querySelector(".sg-ph").hidden=false;chk()}
  requestAnimationFrame(size);
  let last=null;cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect();last=[e.clientX-r.left,e.clientY-r.top];e.preventDefault()});
  cv.addEventListener("pointermove",e=>{if(!last)return;const r=cv.getBoundingClientRect(),pt=[e.clientX-r.left,e.clientY-r.top];ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...pt);ctx.stroke();last=pt;if(!drawn){drawn=true;ov.querySelector(".sg-ph").hidden=true;chk()}});
  ["pointerup","pointercancel"].forEach(t=>cv.addEventListener(t,()=>last=null));
  cv.style.touchAction="none";
  function need(){const qs=f.sec.filter(s=>s.q).map(s=>s.q.k);const miss=qs.filter(k=>!ans[k]).length;return {miss,proxy:who==="대리인"&&!(ov.querySelector("#sg_pn").value.trim()&&ov.querySelector("#sg_pr").value.trim())}}
  function chk(){const n=need();ok.disabled=!!(n.miss||n.proxy||!drawn);left.textContent=n.miss?`체크할 곳 ${n.miss}개 남음`:n.proxy?"대리인 정보를 적어 주세요":!drawn?"서명을 해 주세요":Object.values(ans).includes("동의하지 않음")?"‘동의하지 않음’이 있어요":"준비됐어요"}
  ov.addEventListener("input",chk);
  ov.addEventListener("click",e=>{const o=e.target.closest(".sg-o");if(o){const q=o.closest("[data-q]").dataset.q;ans[q]=o.dataset.o;o.parentNode.querySelectorAll(".sg-o").forEach(b=>{const on=b===o;b.classList.toggle("on",on);b.textContent=(on?"☑ ":"☐ ")+b.dataset.o});chk();return}
    const w=e.target.closest("[data-w]");if(w){who=w.dataset.w;ov.querySelectorAll("[data-w]").forEach(b=>b.classList.toggle("on",b===w));ov.querySelector(".sg-proxy").hidden=who!=="대리인";ov.querySelector("#sg_nm").textContent=who==="대리인"?"대리인":p.name||"";chk();return}
    if(e.target.closest(".sg-clr")){size();return}
    if(e.target.closest(".sg-x")){close();return}
    if(e.target.closest(".sg-ok")&&!ok.disabled){const rec={form:k,ans:Object.assign({},ans),who,proxy_name:who==="대리인"?ov.querySelector("#sg_pn").value.trim():null,proxy_rel:who==="대리인"?ov.querySelector("#sg_pr").value.trim():null,visitor:p.visitor||"",signed_at:new Date().toISOString(),png:trimPNG(cv)};close();onDone&&onDone(rec)}});
}
function close(){if(ov){ov.remove();ov=null}document.documentElement.style.overflow=""}
function trimPNG(cv){const c=cv.getContext("2d"),{width:w,height:h}=cv,d=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2)if(d[(y*w+x)*4+3]>0){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<=x0)return cv.toDataURL();const m=8,o=document.createElement("canvas");o.width=x1-x0+2*m;o.height=y1-y0+2*m;o.getContext("2d").drawImage(cv,x0-m,y0-m,o.width,o.height,0,0,o.width,o.height);return o.toDataURL("image/png")}

/* ───── 관리 화면: 서명이 들어간 양식 (A4 인쇄) ───── */
function printHTML(k,rec,p){const f=FORMS[k],dt=new Date(rec.signed_at),ymd=`${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일`;
  const sig=`<img class="pr-sig" src="${rec.png}" alt="서명">`;
  const nm=rec.who==="대리인"?esc(rec.proxy_name):esc(p.name);
  let foot="";
  if(k==="consent")foot=`<p class="pr-date">${ymd}</p><p class="pr-signl">${rec.who==="대리인"?"(법정대리인) ":"신청인 "}성명 : <span class="pr-nm">${nm}</span><span class="pr-box">${sig}(인 또는 서명)</span></p>${rec.who==="대리인"?`<p class="pr-rel">대상자 ${esc(p.name)} 와(과)의 관계: ${esc(rec.proxy_rel)}</p>`:""}`;
  else foot=`<p class="pr-date">${ymd}</p><table class="pr-st"><tr><th>${esc(f.sign)}</th><td>${rec.who==="본인"?`<span class="pr-nm">${esc(p.name)}</span><span class="pr-box">${sig}(서명)</span>`:"<span class='pr-box'>(서명)</span>"}</td><th>${k==="pledge"?"대리인(필요 시)":"법정대리인<br>(필요 시)"}</th><td>${rec.who==="대리인"?`<span class="pr-nm">${nm}</span><span class="pr-box">${sig}(서명)</span>`:"<span class='pr-box'>(서명)</span>"}</td></tr><tr><th>${k==="pledge"?"":"생년월일"}</th><td>${k==="pledge"?"":esc(p.birth||"")}</td><th>대상자와의 관계</th><td>${esc(rec.proxy_rel||"")}</td></tr></table><p class="pr-to">${esc(f.to)}</p>`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(f.t)} - ${esc(p.name)}</title><style>${PCSS}</style></head><body><div class="pr-page">${k==="consent"?'<p class="pr-tag">[별첨 5]</p>':""}<p class="sg-pre">${esc(f.pre)}</p><h3>${esc(f.t)}</h3>${bodyHTML(f,rec.ans,false,p)}${foot}
  <p class="pr-audit">전자서명 · ${dt.toLocaleString("ko-KR")} · 서명 ${rec.who==="대리인"?"대리인 "+esc(rec.proxy_name)+"("+esc(rec.proxy_rel)+")":"대상자 본인"} · 확인자 ${esc(rec.visitor)} · 온앤쿨케어 시스템</p></div></body></html>`}
const PCSS=`@page{size:A4;margin:16mm 16mm 14mm}body{font-family:"Pretendard Variable","Malgun Gothic",sans-serif;color:#000;margin:0;font-size:10.5pt;line-height:1.55}
.pr-page{max-width:178mm;margin:0 auto}.pr-tag{margin:0;font-weight:700}.sg-pre{text-align:center;margin:4px 0 0;font-size:10pt}h3{text-align:center;font-size:17pt;margin:2px 0 14px;letter-spacing:-.02em}
h4{font-size:11pt;margin:14px 0 4px}p{margin:4px 0}.ind{text-indent:1em}table{border-collapse:collapse;width:100%;margin:6px 0}th,td{border:1px solid #000;padding:5px 6px;font-size:9.5pt;vertical-align:middle}th{background:#eee;font-weight:700}
.sg-tb td{text-align:center}.sg-kv th,.sg-kv4 th{width:22%;text-align:center}.sg-n{font-size:9pt}.sg-q{display:flex;justify-content:flex-end;gap:14px;font-weight:700;margin:6px 0 2px;flex-wrap:wrap}.sg-os{display:flex;gap:14px}
ol,ul{margin:4px 0;padding-left:22px}li{margin:3px 0}.pr-date{text-align:center;margin:18px 0 10px;font-size:11pt}.pr-signl{text-align:right;font-size:11pt;margin:0 6mm 0 0}
.pr-nm{display:inline-block;min-width:26mm;text-align:center;font-weight:700}.pr-box{position:relative;display:inline-block;min-width:30mm;text-align:right}.pr-sig{position:absolute;right:2mm;bottom:-4mm;height:13mm;max-width:34mm;object-fit:contain;mix-blend-mode:multiply}
.pr-st td{height:15mm}.pr-st th{width:18%}.pr-to{text-align:center;font-weight:700;font-size:12pt;margin-top:14px}.pr-rel{text-align:right;font-size:9.5pt;margin-right:6mm}
.pr-audit{margin-top:14px;border-top:1px dashed #999;padding-top:5px;font-size:8pt;color:#555}`;
function print(k,rec,p,w){w=w||window.open("","_blank");if(!w)return;w.document.open();w.document.write(printHTML(k,rec,p));w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch(e){}},500)}
/* 관리 화면: 서명 받은 서류에 ‘서명본 출력’ 버튼 */
function staffHook(rpcS,tok){const b8=b=>{if(!/^\d{6}$/.test(b||""))return"";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
  const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{if(!tok())return x;r=r||{};
    const p={name:r.elder_name||"",birth:c.v_birth||b8(r.birth),addr:(r.address||"").replace(" | ",", "),phone:r.phone||"",size:c.v_household_size||""};
    Object.keys(FORMS).forEach(k=>{const m=(c.signs||{})[k],d=document.querySelector(`#cedit .doc[data-doc="${k}"]`);if(!m||!d||d.querySelector(".sg-prbtn"))return;
      const box=document.createElement("div");box.className="sg-prrow";
      box.innerHTML=`<span>✍ 전자서명 ${new Date(m.signed_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit"})} · ${m.who==="대리인"?esc(m.proxy_name)+"("+esc(m.proxy_rel)+")":"대상자 본인"} · 확인 ${esc(m.visitor||"")}</span><button type="button" class="upl pri sg-prbtn">서명본 출력</button>`;
      const top=d.querySelector(".doc-top");(top||d).after(box);
      box.querySelector("button").onclick=async()=>{const w=window.open("","_blank");if(w)w.document.write("<p style='font-family:sans-serif;padding:20px'>불러오는 중…</p>");
        try{const rec=await rpcS("oncool_ed_sign",{p_token:tok(),p_case:c.id,p_form:k});print(k,rec,p,w)}catch(e){if(w)w.close();alert("서명본을 불러오지 못했어요: "+e.message)}}})}catch(e){console.error(e)}return x}}
return {FORMS,open,print,printHTML,staffHook}})();
