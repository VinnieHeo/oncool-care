/* 가정방문 카드 단계별 화면 · 서류 접기 · 전자서명 연결 (2026-11-12 시안) */
(function(){
const $=s=>document.querySelector(s);
const QUAL=["resident","income","bank","voucher","hifam","etc"],SUBM=["consent_own","consent","pledge","lease"],SIGNABLE=["consent_own","consent","pledge"];
const STEPS=[["가정방문","방문 날짜와 본 모습"],["에너지 상담","가구·요금·설비·건강"],["자격 확인 서류","등본·소득·바우처·통장"],["제출 서류 · 서명","동의서·약정서 전자서명"],["에너지 효율 개선","필요한 물품·수리"],["확인하고 제출","빠진 것 확인 후 제출"]];
let cur=0,P={},SIGS={},CID=null,CC=null;
const NEED=[["resident","주민등록등본",2],["income","소득 증빙",2],["bank","통장 사본",2],["consent_own","복지관 동의서 서명",3],["consent","협회 동의서 서명",3],["pledge","용도 약정서 서명",3]];
const missing=()=>NEED.filter(([k])=>!got(k));
const WREQ=["resident","income","bank"];/* 추천자 화면은 유형과 상관없이 필수 */
/* 서류 설명: 한 줄에 한 가지 */
const HELP={
 resident:[["세대주와 함께 사는 가족을 확인하는 서류예요"],["발급한 지 3개월 이내","w"]],
 income:[["위에서부터 해당하는 것 하나를 올려 주세요","h"],["① 기초생활 수급자증명서 · 수급자라면","d"],["② 에너지바우처 결정통지서 · 바우처를 받는 집이라면","d"],["③ 건강보험료 납부확인서 (최근 3개월) · 수급자가 아니라면","d"],["수급자인데 바우처가 없는 집은 ①과 ③을 같이 올려 주세요","w"],["외국인은 소득금액증명원 또는 근로소득 원천징수 영수증"],["발급한 지 3개월 이내","w"]],
 hifam:[["가족이 건강보험료를 대신 내는 경우에만 필요해요","h"],["건강보험 자격확인서","d"],["가족관계증명서","d"]],
 voucher:[["바우처를 받는 가구만 올려 주세요","h"],["소득 증빙 칸에 결정통지서를 올렸으면 비워 둬도 돼요"],["바우처 결정통지서 또는 누리집 잔액 화면 캡처","d"],["작년(2025년) 바우처를 다 쓴 경우: 잔액 1만 원 이하 확인 (☎ 1600-3190)"],["바우처를 쓰기 어려운 집이면 그 모습 사진이나 메모도 함께"]],
 bank:[["대상자 본인 이름으로 된 통장","h"],["계좌번호가 보이는 첫 장을 찍어 주세요"],["세대주가 아니어도 대상자 본인 명의여야 해요"],["냉·난방비가 이 통장으로 들어가요","w"]],
 etc:[["집 안 사진, 난방기구 사진"],["도시가스가 안 들어오는 집이면 그 근거 사진"],["개인 카톡·문자로 보내지 말고 여기에 바로 올려 주세요","w"]],
 consent_own:[["이 시스템에 상담 기록과 서류를 남기기 위한 동의예요"],["복지관 양식"]],
 consent:[["협회 시스템에 등록하기 전에 꼭 받아야 해요"],["협회 양식 그대로 (별첨 5)"]],
 pledge:[["지원받은 돈을 냉·난방비로만 쓰겠다는 약정이에요"]],
 lease:[["보일러·난방기구가 집주인 것이고, 그걸 고칠 때만 필요해요","h"],["집주인 서명을 받아 사진으로 올려 주세요"]]};
const helpHTML=k=>(HELP[k]||[]).map(([t,c])=>`<li class="${c||""}">${CS.esc(t)}</li>`).join("");
const has=id=>{const e=$("#c_"+id);return !!(e&&String(e.value||"").trim())};
const got=k=>{const b=document.querySelector(`[data-got="${k}"]`);return !!(b&&b.checked)};
const reqOf=d=>!!d.querySelector(".dtg.req");
function stepDone(i){const docsIn=ks=>[...document.querySelectorAll(".wz-pane .doc")].filter(d=>ks.includes(d.dataset.doc));
  if(i===0)return has("visit_date")&&has("visit_note");
  if(i===1)return has("members")&&has("bill_avg");
  if(i===2){const r=docsIn(QUAL).filter(reqOf);return r.length>0&&r.every(d=>got(d.dataset.doc))}
  if(i===3)return SIGNABLE.every(got);
  if(i===4)return !!document.querySelector("[data-eff]:checked")||has("eff_note");
  return false}
function cnt(ks){const ds=[...document.querySelectorAll(".wz-pane .doc")].filter(d=>ks.includes(d.dataset.doc)&&reqOf(d));return [ds.filter(d=>got(d.dataset.doc)).length,ds.length]}

/* 서류 한 줄로 접기 */
function fold(d){if(d.querySelector(".dhd"))return;const k=d.dataset.doc,b=d.querySelector(".doc-top b");
  const nm=b?b.childNodes[0].textContent.trim():k,tag=b&&b.querySelector("span");const tg=tag?tag.textContent.trim():"";
  const req=tg==="필수"||WREQ.includes(k);
  const hd=document.createElement("button");hd.type="button";hd.className="dhd";
  hd.innerHTML=`<span class="dic"></span><span class="dnm">${CS.esc(nm.replace(/\s*\(.*\)\s*$/,""))}<small>${CS.esc((nm.match(/\((.*)\)/)||[,""])[1])}</small></span>${req?'<span class="dtg req">필수</span>':'<span class="dtg">해당하면</span>'}<span class="dst"></span><span class="dch" aria-hidden="true"></span>`;
  const bd=document.createElement("div");bd.className="dbd";bd.hidden=true;while(d.firstChild)bd.appendChild(d.firstChild);
  if(b&&tag)tag.remove();
  const sm=bd.querySelector(":scope>small");if(sm&&HELP[k]){const u=document.createElement("ul");u.className="dhelp";u.innerHTML=helpHTML(k);sm.replaceWith(u)}
  d.append(hd,bd);
  if(SIGNABLE.includes(k)){const s=document.createElement("div");s.className="dsig";bd.insertBefore(s,bd.firstChild);
    const f=bd.querySelector(".files");if(f){const t=document.createElement("details");t.className="dpaper";t.innerHTML="<summary>종이에 받았다면 사진으로 올리기</summary>";bd.insertBefore(t,f);t.appendChild(f)}}
  hd.onclick=()=>{bd.hidden=!bd.hidden;d.classList.toggle("open",!bd.hidden)};
  paint(d)}
function paint(d){const k=d.dataset.doc,ok=got(k),sg=SIGS[k];d.classList.toggle("done",ok);
  d.querySelector(".dst").textContent=ok?(sg?"서명 완료":"완료"):d.querySelector(".dtg.req")?"필요":"";
  const s=d.querySelector(".dsig");if(s){const f=SIGN.FORMS[k];
    s.innerHTML=sg?`<div class="dsg-ok">${sg.png?`<img src="${sg.png}" alt="서명">`:'<span class="dsg-ic">✍</span>'}<div><b>서명 완료</b><small>${new Date(sg.signed_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit"}).replace(". ","/").replace(".","")} · ${sg.who==="대리인"?CS.esc(sg.proxy_name)+"("+CS.esc(sg.proxy_rel)+")":"대상자 본인"}</small></div><button type="button" class="upl" data-resign="${k}">다시 받기</button></div>`
      :`<button type="button" class="btn dsg-go" data-sign="${k}">서명 받기</button><small class="dsg-h">${CS.esc(f.src)} · 화면에서 내용을 읽어 드리고 손가락으로 서명받아요. 종이 양식에 서명이 들어간 채로 복지관에서 출력해요.</small>`}}
function refresh(){document.querySelectorAll(".wz-pane .doc").forEach(paint);
  {const ch=$("#c_chips .chip2");if(ch){const n=missing().length;ch.textContent=`서류 ${NEED.length-n}/${NEED.length}`;ch.className="chip2 "+(n?"amber":"ok")}document.querySelectorAll("#c_chips .chip2.warn,#c_chips .chip2.info").forEach(x=>x.remove())}
  document.querySelectorAll(".wz-dot").forEach((x,i)=>{x.classList.toggle("ok",stepDone(i));x.classList.toggle("cur",i===cur)});
  const [a,b]=cnt(QUAL),[c,e]=cnt(SIGNABLE);const q=$("#wz_q"),s=$("#wz_s");if(q)q.innerHTML=bar(a,b);if(s)s.innerHTML=bar(c,e);
  if(cur===5)review()}
const bar=(a,b)=>`<div class="wz-cnt"><b>필수 ${a}/${b} 완료</b><i><u style="width:${b?a/b*100:0}%"></u></i></div>`;
function review(){const r=$("#wz_rev");if(!r)return;
  const m=missing(),bt=$(".wz-tell"),ms=$("#wz_miss"),af=$(".wz-after"),mode=(CC&&CC.visit_mode)||"추천자",done=CC&&CC.w_done_at;
  if(done){bt.disabled=true;bt.textContent="제출했어요 · 복지관 확인 중";ms.innerHTML="";af.hidden=false;af.textContent="고칠 게 있으면 복지관 담당자에게 말씀해 주세요."}
  else if(mode==="복지관"&&!window.__asVisitor){bt.hidden=true;ms.innerHTML='<p class="wz-ok">복지관이 방문하는 가구라 제출할 필요가 없어요. 아는 내용만 적어 주세요.</p>'}
  else{bt.disabled=!!m.length;ms.innerHTML=m.length?`<div class="wz-miss"><b>아직 없는 필수 항목 ${m.length}개</b>${m.map(([k,l,st])=>`<button type="button" data-go="${st}">${l}<span>${st===2?"3단계":"4단계"} ›</span></button>`).join("")}</div>`:'<p class="wz-ok">✓ 필수 서류와 서명이 다 있어요. 제출할 수 있어요.</p>'}
  {const nx=$("#wz_next");if(nx&&cur===5){nx.disabled=!!(bt.disabled||bt.hidden);nx.textContent=bt.hidden?"제출할 필요 없어요":bt.textContent}}
  r.innerHTML=STEPS.slice(0,5).map(([t],i)=>{const ok=stepDone(i),opt=i===4;return `<button type="button" class="wz-ri${ok?" ok":opt?" skip":""}" data-go="${i}"><i>${ok?"✓":i+1}</i><span><b>${t}</b><small>${ok?(i===2?"업로드 완료":i===3?"서명 완료":"입력 완료"):opt?"해당 없으면 넘어가도 돼요":i===2?`필수 서류 ${cnt(QUAL).join("/")}`:i===3?`서명 ${cnt(SIGNABLE).join("/")}`:"아직 비어 있어요"}</small></span><em>${ok?"":"채우기 ›"}</em></button>`}).join("")}

function go(i){cur=Math.max(0,Math.min(5,i));document.querySelectorAll(".wz-pane").forEach((p,j)=>p.hidden=j!==cur);
  $("#wz_t").innerHTML=`<small>${cur+1} / 6단계</small><b>${STEPS[cur][0]}</b>`;
  $("#wz_prev").hidden=cur===0;$("#wz_next").textContent=cur===5?"제출하기":"저장하고 다음";$("#wz_next").disabled=false;{const cl=$("#c_close");if(cl)cl.hidden=cur===5}
  refresh();const top=$(".wz");if(top)top.scrollIntoView({block:"start"});
  const dot=document.querySelectorAll(".wz-dot")[cur];if(dot)dot.scrollIntoView({inline:"center",block:"nearest"})}

function build(c,r){const form=$("#cedit .cs-form");if(!form||document.getElementById("c_pdf"))return;/* 추천자 화면만 */
  const rb=/^\d{6}$/.test((r&&r.birth)||"")?r.birth:"",rb8=rb?((+rb.slice(0,2)>new Date().getFullYear()%100?"19":"20")+rb.slice(0,2)+"-"+rb.slice(2,4)+"-"+rb.slice(4)):"";
  P={name:r&&r.elder_name,birth:c.v_birth||rb8,bb:rb||(c.v_birth||"").replace(/-/g,"").slice(2),addr:(r&&r.address||"").replace(" | ",", "),phone:r&&r.phone||"",size:c.v_household_size||"",visitor:c.visitor||(r&&r.worker_name)||""};
  SIGS=Object.assign({},c.signs||{});CID=c.id;CC=c;
  const cards=[...form.querySelectorAll(":scope>.cs-card")],byH=t=>cards.find(x=>(x.querySelector("h3")||{}).textContent?.startsWith(t));
  const visit=byH("가정방문"),energy=byH("에너지 상담"),docs=byH("증빙 서류"),eff=byH("에너지 효율");
  const allDocs=[...docs.querySelectorAll(".doc")];allDocs.forEach(fold);
  const mk=(h,ks,id,sub)=>{const cd=document.createElement("div");cd.className="cs-card";cd.innerHTML=`<h3>${h}</h3><p class="wz-sub">${sub}</p><div id="${id}"></div><div class="dlist"></div>`;ks.forEach(k=>{const d=allDocs.find(x=>x.dataset.doc===k);if(d)cd.querySelector(".dlist").appendChild(d)});return cd};
  const q=mk("자격 확인 서류",QUAL,"wz_q","선정 기준에 맞는지 확인하는 서류예요. 누르면 펼쳐져요. 다 올린 서류는 초록색으로 바뀌어요."),
        s=mk("제출 서류 · 서명",SUBM,"wz_s","협회와 복지관에 내는 서류예요. 대상자에게 화면으로 읽어 드리고 폰에 서명받으면 돼요.");
  const rv=document.createElement("div");rv.className="cs-card";rv.innerHTML=`<h3>확인하고 제출</h3><p class="wz-sub">필수 서류와 서명이 모두 있어야 제출할 수 있어요. 서류를 나중에 받았으면 다 올린 뒤 제출해 주세요.</p><div id="wz_rev" class="wz-rev"></div><div id="wz_miss"></div><button type="button" class="btn wz-tell">제출하기</button><p class="wz-after" hidden></p>`;
  const panes=[visit,energy,q,s,eff,rv].map(x=>{const p=document.createElement("div");p.className="wz-pane";p.appendChild(x);return p});
  const rest=document.createElement("div");rest.hidden=true;cards.filter(x=>![visit,energy,docs,eff].includes(x)).forEach(x=>rest.appendChild(x));docs.hidden=true;rest.appendChild(docs);
  const nav=document.createElement("div");nav.className="wz";
  nav.innerHTML=`<div class="wz-dots">${STEPS.map(([t],i)=>`<button type="button" class="wz-dot" data-go="${i}"><i>${i+1}</i><span>${t}</span></button>`).join("")}</div><div class="wz-t" id="wz_t"></div>`;
  form.innerHTML="";form.append(refCard(r),nav,...panes,rest);
  const acts=$("#cedit .acts");acts.classList.add("wz-acts");
  acts.insertAdjacentHTML("afterbegin",`<button type="button" class="sbtn wz-b" id="wz_prev">‹ 이전</button><button type="button" class="sbtn pri wz-n" id="wz_next">저장하고 다음</button>`);
  $("#c_save").classList.add("wz-hide");$("#c_close").textContent="닫기";
  $("#cedit").classList.add("wz-on");
  $("#wz_prev").onclick=()=>go(cur-1);
  $("#wz_next").onclick=()=>{if(cur===5){const t=$(".wz-tell");if(t&&!t.disabled&&!t.hidden)submit(t);return}const from=cur;$("#c_save").click();if(cur<5)go(cur+1);
    if(from===2||from===3){const m=missing().filter(x=>x[2]===from);if(m.length)toast(`아직 없는 서류: ${m.map(x=>x[1]).join(", ")}\n나중에 받아서 올려도 돼요`)}};
  try{members(c)}catch(err){console.error(err)}
  try{equip();guardian()}catch(err){console.error(err)}
  {const hp=$("#c_hi_premium");if(hp){const row=hp.closest(".cs-row2")||hp.closest("label");row.style.display="none"}}/* 건보료는 증빙으로 확인 · 관리 화면에서 입력 */
  cur=0;go(stepDone(0)&&stepDone(1)?2:0)}

/* 추천서 내용: 가정방문 화면 맨 위에 접어서 (보기만) */
function refCard(r){const e=CS.esc,v=x=>Array.isArray(x)?x.join(", "):(x??""),d=document.createElement("details");d.className="refc";
  const kv=[["세대주",r.is_head==="예"?"대상자 본인":r.is_head==="아니오"?`아니오${r.head_name?" ("+r.head_name+")":""}`:r.is_head],["가구원 수",r.household_size?r.household_size+"명":""],["실제 함께 사는 분",r.live_with],["소득",r.income],["수급 종류",v(r.recipient_kinds)],["에너지바우처",r.voucher],["난방",r.heating],["본인 명의 통장",r.account],["집",[r.housing_tenure,v(r.housing_risk)].filter(Boolean).join(" · ")],["고장 난 난방기구",r.heater_broken],["요금 체납",v(r.arrears)],["다른 지원",r.other_support]].filter(([,x])=>x&&String(x).trim());
  d.innerHTML=`<summary><b>추천서 내용 보기</b><span>${e(r.worker_org||"")} ${e(r.worker_name||"")} 선생님 추천${r.urgency?` · 긴급도 ${e(r.urgency)}`:""}</span></summary>
  <div class="refb">${r.reason?`<h4>추천 사유</h4><p>${e(r.reason)}</p>`:""}${r.risk_note?`<h4>건강·생활 위험</h4><p>${e(r.risk_note)}</p>`:""}
  ${kv.length?`<dl>${kv.map(([k,x])=>`<dt>${e(k)}</dt><dd>${e(x)}</dd>`).join("")}</dl>`:""}
  <p class="refn">추천서와 실제가 다르면 1단계 현황 메모에 적어 주세요.</p></div>`;return d}

/* 냉·난방 설비: 여러 개 고르기 (저장은 기존 칸에 "가스보일러, 선풍기"처럼) */
const EQ=[["난방",["가스보일러","기름보일러","연탄보일러","전기장판","전기난로·히터","온풍기"]],["냉방",["에어컨","선풍기","냉풍기"]],["",["냉·난방기 없음"]]];
function equip(){const sel=$("#c_cool_equip");if(!sel||sel.dataset.eq)return;const lab=sel.closest("label");
  const hid=document.createElement("input");hid.type="hidden";hid.id="c_cool_equip";hid.dataset.eq=1;
  const old=(sel.value||"").split(/\s*,\s*/).filter(Boolean).map(x=>x==="선풍기만"?"선풍기":x==="없음"?"냉·난방기 없음":x);hid.value=old.join(", ");
  const box=document.createElement("div");box.className="eqx";
  box.innerHTML=`<b>냉·난방 설비 <small>있는 것 모두</small></b>`+EQ.map(([g,xs])=>`<div class="eqg">${g?`<span>${g}</span>`:""}${xs.map(x=>`<button type="button" class="eqc${old.includes(x)?" on":""}" data-eq="${x}">${x}</button>`).join("")}</div>`).join("");
  const row=sel.closest(".cs-row2");sel.remove();lab.replaceWith(hid);(row||hid.parentNode).before(box);
  box.addEventListener("click",e=>{const b=e.target.closest(".eqc");if(!b)return;const none=b.dataset.eq==="냉·난방기 없음";
    if(none)box.querySelectorAll(".eqc").forEach(x=>x!==b&&x.classList.remove("on"));else box.querySelector('[data-eq="냉·난방기 없음"]').classList.remove("on");
    b.classList.toggle("on");hid.value=[...box.querySelectorAll(".eqc.on")].map(x=>x.dataset.eq).join(", ");hid.dispatchEvent(new Event("input",{bubbles:true}))})}
/* 안부 확인 보호자: 이름 · 관계 · 전화번호 따로 */
const GREL=["아들","딸","배우자","며느리","사위","손자녀","형제자매","이웃","기타"];
function guardian(){const inp=$("#c_guardian");if(!inp||inp.dataset.gx)return;inp.dataset.gx=1;const lab=inp.closest("label");
  const t=inp.value||"",ph=(t.match(/0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/)||[""])[0],rest=t.replace(ph,"").replace(/[·()]/g," ").trim().split(/\s+/).filter(Boolean);
  const rel=rest.find(x=>GREL.includes(x))||"",nm=rest.filter(x=>x!==rel).join(" ");
  inp.type="hidden";const box=document.createElement("div");box.className="gx";
  box.innerHTML=`<b>안부 확인 보호자 <small>없으면 비워 두세요</small></b><div class="gxr"><input data-g="n" placeholder="이름" maxlength="20" value="${CS.esc(nm)}"><select data-g="r"><option value="">관계</option>${GREL.map(x=>`<option${x===rel?" selected":""}>${x}</option>`).join("")}</select><input data-g="p" type="tel" inputmode="tel" placeholder="010-0000-0000" maxlength="13" value="${CS.esc(ph)}"></div>`;
  const row=lab.closest(".cs-row2");lab.style.display="none";lab.after(box);if(row){row.after(box);row.style.display=row.querySelectorAll("label:not([style*='none'])").length?"":"none"}
  const sync=()=>{const n=box.querySelector('[data-g=n]').value.trim(),r=box.querySelector('[data-g=r]').value,p=box.querySelector('[data-g=p]').value.trim();inp.value=[n,r?"("+r+")":"",p].filter(Boolean).join(" ");inp.dispatchEvent(new Event("input",{bubbles:true}))};
  box.addEventListener("input",e=>{if(e.target.dataset.g==="p"){const d=e.target.value.replace(/\D/g,"").slice(0,11);e.target.value=d.length>7?d.slice(0,3)+"-"+d.slice(3,d.length-4)+"-"+d.slice(-4):d.length>3?d.slice(0,3)+"-"+d.slice(3):d}e.stopPropagation();sync()});
  box.addEventListener("change",e=>{e.stopPropagation();sync()})}

/* 가구원: 줄글 대신 한 명씩 추가 (저장은 기존 칸에 "이름 생년월일 관계 / …"로) */
const REL=["본인","배우자","아들","딸","며느리","사위","손자녀","아버지","어머니","형제자매","기타"];
function members(c){const ta=$("#c_members");if(!ta||ta.dataset.mx)return;ta.dataset.mx=1;const lab=ta.closest("label");
  const parse=t=>(t||"").split(/\s*\/\s*|\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^(\S+)\s+(\d{2,4}[.\-]?\d{1,2}[.\-]?\d{1,2})?\s*(\S+)?$/);return m?{n:m[1],b:(m[2]||"").replace(/[.\-]/g,""),r:m[3]||""}:{n:x,b:"",r:""}});
  let L=parse(ta.value);if(!L.length)L=[{n:P.name||"",b:P.bb||"",r:"본인"}];
  else L.forEach(x=>{if(x.r==="본인"&&!x.b)x.b=P.bb||""});/* 본인 생년월일은 추천서에서 */
  const box=document.createElement("div");box.className="mx";lab.after(box);lab.hidden=true;
  const fmtB=b=>{b=b.replace(/\D/g,"");if(b.length===8)return b.slice(0,4)+"."+b.slice(4,6)+"."+b.slice(6);if(b.length===6){let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return y+"."+b.slice(2,4)+"."+b.slice(4)}return b};
  function sync(){ta.value=L.filter(x=>x.n.trim()).map(x=>[x.n.trim(),fmtB(x.b),x.r].filter(Boolean).join(" ")).join(" / ");ta.dispatchEvent(new Event("input",{bubbles:true}));box.querySelector(".mx-n").textContent=L.filter(x=>x.n.trim()).length+"명"}
  function draw(){const e=CS.esc;
    box.innerHTML=`<div class="mx-h"><b>가구원</b><span class="mx-n"></span><small>등본에 나온 사람을 한 명씩 넣어 주세요</small></div>`+L.map((x,i)=>`<div class="mx-r" data-i="${i}"><select data-f="r" aria-label="관계">${REL.map(r=>`<option${r===x.r?" selected":""}>${r}</option>`).join("")}${x.r&&!REL.includes(x.r)?`<option selected>${e(x.r)}</option>`:""}</select><input data-f="n" placeholder="이름" maxlength="20" value="${e(x.n)}"><input data-f="b" placeholder="생년월일 6자리" inputmode="numeric" maxlength="10" value="${e(x.b)}">${i?`<button type="button" class="mx-x" aria-label="빼기">✕</button>`:"<span></span>"}</div>`).join("")+`<button type="button" class="mx-add">+ 가구원 추가</button>`;sync()}
  box.addEventListener("input",e=>{const r=e.target.closest(".mx-r");if(!r)return;e.stopPropagation();L[+r.dataset.i][e.target.dataset.f]=e.target.value;sync()});
  box.addEventListener("change",e=>{const r=e.target.closest(".mx-r");if(!r)return;e.stopPropagation();L[+r.dataset.i][e.target.dataset.f]=e.target.value;sync()});
  box.addEventListener("click",e=>{if(e.target.closest(".mx-add")){L.push({n:"",b:"",r:L.length===1?"배우자":"기타"});draw();const ins=box.querySelectorAll('.mx-r:last-of-type input[data-f=n]');if(ins[0])ins[0].focus();return}
    const x=e.target.closest(".mx-x");if(x){L.splice(+x.closest(".mx-r").dataset.i,1);draw()}});
  draw()}

document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g&&g.closest(".wz-on")&&!g.closest(".back")){go(+g.dataset.go);return}
  const s=e.target.closest("[data-sign],[data-resign]");if(s){const k=s.dataset.sign||s.dataset.resign;
    const vi=$("#c_visitor");if(vi&&vi.value.trim())P.visitor=vi.value.trim();
    SIGN.open(k,P,async rec=>{const m=$("#c_msg");if(m)m.textContent="서명을 저장하는 중…";
      try{const nc=await rpc("oncool_w_sign",{p_token:TOKEN,p_case:CID,p_form:k,p:{png:rec.png,ans:rec.ans,who:rec.who,proxy_name:rec.proxy_name,proxy_rel:rec.proxy_rel,visitor:rec.visitor}});
        SIGS[k]=Object.assign({},(nc&&nc.signs||{})[k]||rec,{png:rec.png});
        const cb=document.querySelector(`[data-got="${k}"]`);if(cb&&!cb.checked){cb.checked=true;cb.dispatchEvent(new Event("change",{bubbles:true}))}
        window.__signs=SIGS;refresh();if(m)m.textContent="서명을 저장했어요"}
      catch(err){if(m)m.textContent="";alert(/session/.test(err.message)?"다시 들어와 주세요.":/locked/.test(err.message)?"사례판정 단계라 서명을 바꿀 수 없어요.":"서명을 저장하지 못했어요. 잠시 뒤에 다시 해 주세요.")}});return}
  const t=e.target.closest(".wz-tell");if(t&&!t.disabled)submit(t)});
function toast(msg){let el=$(".wz-toast");if(!el){el=document.createElement("div");el.className="wz-toast";document.body.appendChild(el)}el.textContent=msg;el.classList.add("on");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("on"),3200)}
function mir(bt){const nx=$("#wz_next");if(nx&&cur===5){nx.disabled=bt.disabled;nx.textContent=bt.textContent}}
async function submit(bt){if(missing().length){review();return}bt.disabled=true;bt.textContent="저장하는 중…";mir(bt);
  const m=$("#c_msg");if(m)m.textContent="";$("#c_save").click();
  for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,150));const t=m?m.textContent:"";if(t==="저장했어요")break;if(/못|끝났/.test(t)){bt.disabled=false;bt.textContent="제출하기";mir(bt);return}}
  bt.textContent="제출하는 중…";mir(bt);
  try{const r=await rpc("oncool_w_done",{p_token:TOKEN,p_case:CID});Object.assign(CC,r||{w_done_at:new Date().toISOString()});review();toast("제출했어요. 복지관이 확인하고 연락드려요.")}
  catch(err){bt.disabled=false;bt.textContent="제출하기";mir(bt);alert(/session/.test(err.message)?"다시 들어와 주세요.":/missing/.test(err.message)?"필수 서류나 서명이 빠져 있어요.":"제출하지 못했어요. 잠시 뒤에 다시 해 주세요.")}}
document.addEventListener("change",e=>{if(e.target.closest(".wz-on"))refresh()});
document.addEventListener("input",e=>{if(e.target.closest(".wz-on"))refresh()});
setInterval(()=>{if($(".wz-on"))document.querySelectorAll(".wz-pane .doc").forEach(paint)},1200);
const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{build(c,r||{})}catch(err){console.error(err)}return x};
window.WIZ={go,refresh};
})();
