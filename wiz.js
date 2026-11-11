/* 가정방문 카드 단계별 화면 · 서류 접기 · 전자서명 연결 (2026-11-12 시안) */
(function(){
const $=s=>document.querySelector(s);
const QUAL=["resident","income","hifam","voucher","bank","etc"],SUBM=["consent_own","consent","pledge","lease"],SIGNABLE=["consent_own","consent","pledge"];
const STEPS=[["가정방문","방문 날짜와 본 모습"],["에너지 상담","가구·요금·설비·건강"],["자격 확인 서류","등본·소득·바우처·통장"],["제출 서류 · 서명","동의서·약정서 전자서명"],["에너지 효율 개선","필요한 물품·수리"],["확인하고 알리기","빠진 것 확인"]];
let cur=0,P={},SIGS={},CID=null;
/* 서류 설명: 한 줄에 한 가지 */
const HELP={
 resident:[["세대주와 함께 사는 가족을 확인하는 서류예요"],["발급한 지 3개월 이내","w"]],
 income:[["아래 중 하나를 올려 주세요","h"],["건강보험료 납부확인서 (최근 3개월)","d"],["기초생활 수급자증명서","d"],["에너지바우처 결정통지서가 있으면 이 칸은 비워 두고 ‘에너지바우처 확인’에 올려 주세요"],["외국인은 소득금액증명원 또는 근로소득 원천징수 영수증"],["발급한 지 3개월 이내","w"]],
 hifam:[["가족이 건강보험료를 대신 내는 경우에만 필요해요","h"],["건강보험 자격확인서","d"],["가족관계증명서","d"]],
 voucher:[["에너지바우처를 받는 가구만 올려 주세요","h"],["바우처 결정통지서 또는 누리집 잔액 화면 캡처","d"],["작년(2025년) 바우처를 다 쓴 경우: 잔액 1만 원 이하 확인 (☎ 1600-3190)"],["바우처를 쓰기 어려운 집이면 그 모습 사진이나 메모도 함께"]],
 bank:[["대상자 본인 이름으로 된 통장","h"],["계좌번호가 보이는 첫 장을 찍어 주세요"],["세대주가 아니어도 대상자 본인 명의여야 해요"],["기름·연탄을 복지관이 직접 배달해 드리는 가구는 필요 없어요"]],
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
  const req=tg==="필수";
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
  document.querySelectorAll(".wz-dot").forEach((x,i)=>{x.classList.toggle("ok",stepDone(i));x.classList.toggle("cur",i===cur)});
  const [a,b]=cnt(QUAL),[c,e]=cnt(SIGNABLE);const q=$("#wz_q"),s=$("#wz_s");if(q)q.innerHTML=bar(a,b);if(s)s.innerHTML=bar(c,e);
  if(cur===5)review()}
const bar=(a,b)=>`<div class="wz-cnt"><b>필수 ${a}/${b} 완료</b><i><u style="width:${b?a/b*100:0}%"></u></i></div>`;
function review(){const r=$("#wz_rev");if(!r)return;
  r.innerHTML=STEPS.slice(0,5).map(([t],i)=>{const ok=stepDone(i),opt=i===4;return `<button type="button" class="wz-ri${ok?" ok":opt?" skip":""}" data-go="${i}"><i>${ok?"✓":i+1}</i><span><b>${t}</b><small>${ok?"됐어요":opt?"해당 없으면 넘어가도 돼요":i===2?`필수 서류 ${cnt(QUAL).join("/")}`:i===3?`서명 ${cnt(SIGNABLE).join("/")}`:"아직 비어 있어요"}</small></span><em>${ok?"":"채우기 ›"}</em></button>`}).join("")}

function go(i){cur=Math.max(0,Math.min(5,i));document.querySelectorAll(".wz-pane").forEach((p,j)=>p.hidden=j!==cur);
  $("#wz_t").innerHTML=`<small>${cur+1} / 6단계</small><b>${STEPS[cur][0]}</b>`;
  $("#wz_prev").hidden=cur===0;$("#wz_next").textContent=cur===5?"저장":"저장하고 다음";
  refresh();const top=$(".wz");if(top)top.scrollIntoView({block:"start"});
  const dot=document.querySelectorAll(".wz-dot")[cur];if(dot)dot.scrollIntoView({inline:"center",block:"nearest"})}

function build(c,r){const form=$("#cedit .cs-form");if(!form||document.getElementById("c_pdf"))return;/* 추천자 화면만 */
  P={name:r&&r.elder_name,birth:c.v_birth||"",addr:(r&&r.address||"").replace(" | ",", "),phone:r&&r.phone||"",size:c.v_household_size||"",visitor:c.visitor||(r&&r.worker_name)||""};
  SIGS=Object.assign({},c.signs||{});CID=c.id;
  const cards=[...form.querySelectorAll(":scope>.cs-card")],byH=t=>cards.find(x=>(x.querySelector("h3")||{}).textContent?.startsWith(t));
  const visit=byH("가정방문"),energy=byH("에너지 상담"),docs=byH("증빙 서류"),eff=byH("에너지 효율");
  const allDocs=[...docs.querySelectorAll(".doc")];allDocs.forEach(fold);
  const mk=(h,ks,id,sub)=>{const cd=document.createElement("div");cd.className="cs-card";cd.innerHTML=`<h3>${h}</h3><p class="wz-sub">${sub}</p><div id="${id}"></div><div class="dlist"></div>`;ks.forEach(k=>{const d=allDocs.find(x=>x.dataset.doc===k);if(d)cd.querySelector(".dlist").appendChild(d)});return cd};
  const q=mk("자격 확인 서류",QUAL,"wz_q","선정 기준에 맞는지 확인하는 서류예요. 누르면 펼쳐져요. 다 올린 서류는 초록색으로 바뀌어요."),
        s=mk("제출 서류 · 서명",SUBM,"wz_s","협회와 복지관에 내는 서류예요. 대상자에게 화면으로 읽어 드리고 폰에 서명받으면 돼요.");
  const rv=document.createElement("div");rv.className="cs-card";rv.innerHTML=`<h3>확인하고 알리기</h3><p class="wz-sub">빠진 단계가 있으면 눌러서 채워 주세요. 다 됐으면 복지관에 알려 주세요.</p><div id="wz_rev" class="wz-rev"></div><button type="button" class="btn wz-tell">방문·서류 다 했어요 · 복지관에 알리기</button>`;
  const panes=[visit,energy,q,s,eff,rv].map(x=>{const p=document.createElement("div");p.className="wz-pane";p.appendChild(x);return p});
  const rest=document.createElement("div");rest.hidden=true;cards.filter(x=>![visit,energy,docs,eff].includes(x)).forEach(x=>rest.appendChild(x));docs.hidden=true;rest.appendChild(docs);
  const nav=document.createElement("div");nav.className="wz";
  nav.innerHTML=`<div class="wz-dots">${STEPS.map(([t],i)=>`<button type="button" class="wz-dot" data-go="${i}"><i>${i+1}</i><span>${t}</span></button>`).join("")}</div><div class="wz-t" id="wz_t"></div>`;
  form.innerHTML="";form.append(nav,...panes,rest);
  const acts=$("#cedit .acts");acts.classList.add("wz-acts");
  acts.insertAdjacentHTML("afterbegin",`<button type="button" class="sbtn wz-b" id="wz_prev">‹ 이전</button><button type="button" class="sbtn pri wz-n" id="wz_next">저장하고 다음</button>`);
  $("#c_save").classList.add("wz-hide");$("#c_close").textContent="닫기";
  $("#cedit").classList.add("wz-on");
  $("#wz_prev").onclick=()=>go(cur-1);
  $("#wz_next").onclick=()=>{$("#c_save").click();if(cur<5)go(cur+1)};
  cur=0;go(stepDone(0)&&stepDone(1)?2:0)}

document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g&&g.closest(".wz-on")&&!g.closest(".back")){go(+g.dataset.go);return}
  const s=e.target.closest("[data-sign],[data-resign]");if(s){const k=s.dataset.sign||s.dataset.resign;
    const vi=$("#c_visitor");if(vi&&vi.value.trim())P.visitor=vi.value.trim();
    SIGN.open(k,P,async rec=>{const m=$("#c_msg");if(m)m.textContent="서명을 저장하는 중…";
      try{const nc=await rpc("oncool_w_sign",{p_token:TOKEN,p_case:CID,p_form:k,p:{png:rec.png,ans:rec.ans,who:rec.who,proxy_name:rec.proxy_name,proxy_rel:rec.proxy_rel,visitor:rec.visitor}});
        SIGS[k]=Object.assign({},(nc&&nc.signs||{})[k]||rec,{png:rec.png});
        const cb=document.querySelector(`[data-got="${k}"]`);if(cb&&!cb.checked){cb.checked=true;cb.dispatchEvent(new Event("change",{bubbles:true}))}
        window.__signs=SIGS;refresh();if(m)m.textContent="서명을 저장했어요"}
      catch(err){if(m)m.textContent="";alert(/session/.test(err.message)?"다시 들어와 주세요.":/locked/.test(err.message)?"사례판정 단계라 서명을 바꿀 수 없어요.":"서명을 저장하지 못했어요. 잠시 뒤에 다시 해 주세요.")}});return}
  const t=e.target.closest(".wz-tell");if(t){const w=document.querySelector(".wtodo .wdone");if(w)w.click()}});
document.addEventListener("change",e=>{if(e.target.closest(".wz-on"))refresh()});
document.addEventListener("input",e=>{if(e.target.closest(".wz-on"))refresh()});
setInterval(()=>{if($(".wz-on"))document.querySelectorAll(".wz-pane .doc").forEach(paint)},1200);
const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{build(c,r||{})}catch(err){console.error(err)}return x};
window.WIZ={go,refresh};
})();
