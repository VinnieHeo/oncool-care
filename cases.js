/* 선정 심사 공용 로직 (관리: 편집 / 열람: 보기) */
window.CS=(function(){
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const DOCS=[
    {k:"resident",l:"주민등록등본",dated:1,req:1,h:"세대주·가구원 확인 · 발급 3개월 이내"},
    {k:"income",l:"소득 증빙",dated:1,req:1,h:"1유형: 건강보험료 납부확인서(3개월 평균) · 3유형: 수급자 증명서 · 4유형: 건보료 납부확인서 또는 수급자 증명서 · 발급 3개월 이내 · 외국인은 소득금액증명원/근로소득 원천징수 영수증"},
    {k:"hifam",l:"건보 자격확인서 + 가족관계증명서",dated:1,req:0,h:"가족이 건강보험료를 내는 경우만 · 납부자의 자격확인(통보)서 인원으로 가구원 수 산정"},
    {k:"voucher",l:"에너지바우처 확인",dated:0,req:"t23",h:"2유형: 결정통지서 또는 누리집 잔액 캡처 + 2025년 소진 확인(잔액 1만 원 이하, 1600-3190 공동청취) · 3유형: 결정통지서, 또는 수급자증명서 + 바우처 대상 증빙, 그리고 바우처를 쓰기 어려운 환경 확인(사진·상담 메모) · 근거: 공고문 2쪽, 안내문 1쪽"},
    {k:"bank",l:"본인 명의 통장 사본",dated:0,req:1,h:"지원가구(세대주) 명의"},
    {k:"consent",l:"개인정보 수집·이용·제공 동의서 (협회 양식)",dated:0,req:1,h:"협회 시스템에 입력하기 전에 꼭 받아야 해요 · 원본은 복지관 보관"},
    {k:"pledge",l:"용도 약정서",dated:0,req:1,h:"냉·난방비를 용도대로 쓰겠다는 약정"},
    {k:"lease",l:"임대인 사용 보장 협약서",dated:0,req:0,h:"임대인·타인 소유 냉·난방기구를 수리할 때만 필수 (공고문 3쪽)"},
    {k:"etc",l:"기타 서류·현장 사진",dated:0,req:0,h:"집 사진, 4유형 근거(도시가스 미공급 등) · 기관 기기로 촬영, 개인 메신저 전송 금지"}];
  const STAGES=["조사중","서류완비","위원회상정","선정","보류","탈락"];
  const W={"1":[330000,470000,620000,800000],"2":[165000,235000,310000,400000],"3":[330000,470000,620000,800000],"4":[412500,587500,775000,1000000]};
  const MONTHS={11:["11/16","12/10","1/10","2/10"],12:["12/10","1/10","2/10"],1:["1/10","2/10"],2:["2/10"]};
  /* 유형 기준: 공고문(2차) 2쪽 · 신청 질의응답 2쪽
     1 저소득 에너지 취약 = 바우처 미대상 + 냉·난방비 부담
     2 바우처 한도 소진 = 2026 바우처 대상 + 2025 바우처 소진(잔액 1만 원 이하, OT 36쪽)
     3 바우처 사각지대 = 2026 바우처 대상(미신청 포함) + 거주형태·이용환경 때문에 바우처로 충당 어려움
     4 인프라 취약 = 도시가스 미설치, 등유·LPG·화목·연탄 보일러 등 (질의응답: 등유·LPG·연탄 → 4유형) */
  const TYPES={"1":"저소득 에너지 취약","2":"바우처 한도 소진","3":"바우처 사각지대","4":"에너지 인프라 취약"};
  const FOUR=["기름(등유) 보일러","LPG","연탄"];
  const ENV=["해당 없음","관리비에 포함해 냄","개별 난방기구만 씀(전기장판 등)","고시원·쪽방·원룸 등 일반 주거 아님","기타 (메모에 적기)"];
  const isTarget=(v,inc,tg)=>v==="받는 중"||v==="받았는데 다 씀"||(inc==="기초생활수급자"&&tg==="있음");
  const hardEnv=env=>!!env&&env!=="해당 없음";
  const typeFrom=(v,h,inc,tg,env)=>{if(FOUR.includes(h))return "4";if(v==="받았는데 다 씀")return "2";
    if(isTarget(v,inc,tg))return hardEnv(env)?"3":"";return v==="안 받음"?"1":""};
  const proposed=c=>{const v=c.v_voucher,inc=c.v_income,tg=c.v_voucher_target,env=c.v_env;
    const t=typeFrom(v,c.v_heating,inc,tg,env);
    if(t==="4")return "4유형 에너지 인프라 취약 (난방: "+c.v_heating+")";
    if(t)return t+"유형 "+TYPES[t]+(t==="1"&&inc==="기초생활수급자"&&!tg?" · 수급자라 바우처 대상 세대원이 있으면 1유형이 아니에요":"");
    if(isTarget(v,inc,tg))return env==="해당 없음"?"바우처 대상인데 2·3유형 조건이 안 보여요 (2025 소진 아님 · 사용 어려운 환경 아님) → 위원회 판단 필요":"바우처 대상이에요 → ‘바우처 쓰기 어려운 환경’을 고르면 3유형인지 보여요";
    return ""};
  const typeOf=c=>(c.type_final||"").replace(/[^1-4]/g,"")||typeFrom(c.v_voucher,c.v_heating,c.v_income,c.v_voucher_target,c.v_env);
  function amounts(c){const t=typeOf(c),n=Math.min(4,Math.max(1,+c.v_household_size||0));if(!t||!+c.v_household_size)return null;
    const tot=W[t][n-1],ms=MONTHS[c.start_month||11]||MONTHS[11],k=ms.length,per=Math.ceil(tot/k/1000)*1000;
    return {tot,list:ms.map((m,i)=>[m,i<k-1?per:tot-per*(k-1)])}}
  const fmt=n=>Number(n).toLocaleString("ko-KR");
  /* 안내문 1쪽: 증빙은 "신청일 기준 3개월 이내 발급" → 기준일 = 가정방문일(신청서 받는 날), 없으면 심사 카드 만든 날 */
  function docState(c){const d=c.docs||{},t=typeOf(c),today=c.visit_date?new Date(c.visit_date):c.created_at?new Date(c.created_at):new Date();let need=0,ok=0,stale=[];
    DOCS.forEach(x=>{const req=x.req==="t23"?(t==="2"||t==="3"):!!x.req;if(!req)return;need++;const v=d[x.k]||{};
      let good=!!v.got;if(good&&x.dated){if(!v.date){good=false}else{const dt=new Date(v.date);const lim=new Date(today);lim.setMonth(lim.getMonth()-3);if(dt<lim){good=false;stale.push(x.l)}}}
      if(good)ok++});
    return {need,ok,full:need>0&&ok===need,stale}}
  function goal(cases){const sel=cases.filter(c=>["선정","위원회상정","서류완비"].includes(c.stage));
    const by={"1":0,"2":0,"3":0,"4":0};sel.forEach(c=>{const t=typeOf(c);if(by[t]!==undefined)by[t]++});
    const tot=sel.length,pct=Math.min(100,tot/40*100);
    return `<div class="goal"><b>선정 목표 40가구 이상 · 유형별 최소 4가구</b><div class="bar2"><i style="width:${pct}%;background:var(--green)"></i></div>
      <small>서류완비·상정·선정 ${tot}가구 / 40 · 방문 ${cases.length}가구</small>
      <div class="tcount">${["1","2","3","4"].map(t=>`<span class="chip2 ${by[t]>=4?"ok":"warn"}">${t}유형 ${by[t]}</span>`).join("")}</div></div>`}
  function listHTML(cases,refs){const R=Object.fromEntries(refs.map(r=>[r.id,r]));
    return `<div class="tw"><table><thead><tr><th>가구코드</th><th>대상자</th><th>거주동</th><th>가구원</th><th>유형</th><th>동절기 지원액</th><th>서류</th><th>방문일</th><th>단계</th></tr></thead><tbody>${
      cases.map(c=>{const r=R[c.referral_id]||{},a=amounts(c),ds=docState(c);return `<tr data-cid="${c.id}" tabindex="0"><td>${esc(c.household_code)}</td><td><b>${esc(r.elder_name)}</b></td><td>${esc(r.dong)}</td><td>${c.v_household_size?c.v_household_size+"명":""}</td><td>${typeOf(c)?typeOf(c)+"유형"+(c.type_final?"":" (안)"):""}</td><td>${a?fmt(a.tot)+"원":""}</td><td class="dchk${ds.full?" full":""}">${ds.ok}/${ds.need}${ds.stale.length?" ⚠":""}</td><td>${esc(c.visit_date||"")}</td><td><span class="stg stg-${esc(c.stage)}">${esc(c.stage)}</span></td></tr>`}).join("")||'<tr><td colspan="9" style="color:var(--mute)">아직 방문 기록이 없어요. 추천 접수에서 가구를 열고 ‘가정방문 기록 시작’을 눌러 주세요.</td></tr>'}</tbody></table></div>`}
  function viewHTML(c,r){const a=amounts(c),ds=docState(c),d=c.docs||{};
    const row=(l,v)=>v!==null&&v!==undefined&&String(v).trim()!==""&&!(Array.isArray(v)&&!v.length)?`<div class="dv-row"><span>${l}</span><span>${esc(Array.isArray(v)?v.join(", "):v)}</span></div>`:"";
    return `<div class="dv-head"><h2>${esc(r.elder_name||"")}</h2><div class="chips"><span class="stg stg-${esc(c.stage)}">${esc(c.stage)}</span>${typeOf(c)?`<span class="chip2 info">${typeOf(c)}유형 ${TYPES[typeOf(c)]}${c.type_final?"":" (안)"}</span>`:""}<span class="chip2 ${ds.full?"ok":"amber"}">서류 ${ds.ok}/${ds.need}</span>${ds.stale.length?`<span class="chip2 warn">신청일 기준 3개월 넘음: ${esc(ds.stale.join(", "))}</span>`:""}</div></div>
    <p class="dv-sub">${c.household_code?esc(c.household_code)+" · ":""}방문 ${esc(c.visit_date||"미정")}${c.visitor?" · "+esc(c.visitor):""}</p>
    <div class="dv-grid">
      <div class="dv-card"><h3>협회 시스템 입력 항목</h3>${row("성별",c.v_gender)}${row("생년월일",c.v_birth)}${row("지원 기간",c.period)}${row("사업 참여 이력",c.participation)}${row("돌봄단 발굴",c.care_found)}</div>
      <div class="dv-card"><h3>확인한 세대·소득</h3>${row("세대주 본인",c.v_is_head)}${row("세대주",[c.v_head_name,c.v_head_birth].filter(Boolean).join(" · "))}${row("가구원 수",c.v_household_size?c.v_household_size+"명":"")}${row("소득 구분",c.v_income)}${row("수급 종류",c.v_recipient_kinds)}${row("바우처",c.v_voucher)}${row("바우처 대상 세대원",c.v_voucher_target)}${row("바우처 쓰기 어려운 환경",c.v_env)}${row("난방 방식",c.v_heating)}${row("본인 명의 통장",c.v_account)}</div>
      <div class="dv-card"><h3>지원 금액 (동절기)</h3>${a?`<div class="amt-box">${a.list.map(([m,v])=>`<div>${m}<b>${fmt(v)}</b></div>`).join("")}<div class="tot">합계<b>${fmt(a.tot)}</b></div></div>`:'<p class="dv-empty">유형과 가구원 수를 확인하면 계산돼요</p>'}</div>
      <div class="dv-card"><h3>증빙 서류</h3>${DOCS.map(x=>{const v=d[x.k]||{};return `<div class="dv-row"><span>${x.l}</span><span>${v.got?"받음"+(v.date?" · "+esc(v.date):""):'<span style="color:var(--mute);font-weight:400">아직</span>'}</span></div>`}).join("")}</div>
      <div class="dv-card"><h3>효율 개선 · 판정</h3>${row("필요 지원",c.eff_needs)}${row("효율 메모",c.eff_note)}${row("위원회 결과",c.committee_result)}${row("판정일",c.committee_date)}${row("판정 메모",c.committee_note)}${row("협회 승인",c.kaswc_approved)}</div>
      ${c.visit_note?`<div class="dv-card" style="grid-column:1/-1"><h3>방문 현황 메모</h3><div class="dv-quote">${esc(c.visit_note)}</div></div>`:""}
    </div>`}
  function csv(cases,refs){const R=Object.fromEntries(refs.map(r=>[r.id,r]));const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const head=["가구코드","대상자","생년월일","성별","지원 기간","사업 참여 이력","돌봄단 발굴","연락처","거주동","주소","세대주 본인","세대주","가구원 수","소득 구분","수급 종류","바우처","바우처 대상 세대원","바우처 쓰기 어려운 환경","난방","유형","동절기 지원액","월별 지급","서류","3개월 지난 서류","방문일","방문자","방문 메모","효율 개선","단계","위원회 결과","판정일","협회 승인","추천자"];
    const lines=[head.map(q).join(",")].concat(cases.map(c=>{const r=R[c.referral_id]||{},a=amounts(c),ds=docState(c);return [c.household_code,r.elder_name,c.v_birth||r.birth,c.v_gender||r.gender,c.period,c.participation,c.care_found,r.phone,r.dong,(r.address||"").replace(" | ",", "),c.v_is_head,[c.v_head_name,c.v_head_birth].filter(Boolean).join(" "),c.v_household_size,c.v_income,(c.v_recipient_kinds||[]).join("·"),c.v_voucher,c.v_voucher_target,c.v_env,c.v_heating,typeOf(c)?typeOf(c)+"유형 "+TYPES[typeOf(c)]:"",a?a.tot:"",a?a.list.map(([m,v])=>m+" "+v).join(" / "):"",`${ds.ok}/${ds.need}`,ds.stale.join("·"),c.visit_date,c.visitor,c.visit_note,(c.eff_needs||[]).join("·"),c.stage,c.committee_result,c.committee_date,c.kaswc_approved,`${r.worker_org||"생활지원사"} ${r.worker_name||""}`].map(q).join(",")}));
    const b=new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const el=document.createElement("a");el.href=URL.createObjectURL(b);el.download=`온앤쿨_선정심사_${new Date().toISOString().slice(0,10)}.csv`;el.click();URL.revokeObjectURL(el.href)}
  return {TYPES,ENV,DOCS,STAGES,typeFrom,proposed,typeOf,amounts,docState,goal,listHTML,viewHTML,csv,fmt,esc};
})();

/* 심사 카드 편집기 (백엔드 B, 훅 H 주입) */
window.CSE=(function(){
const $=s=>document.querySelector(s);
let B=null,H={saved(){},deleted(){},reverted(){}},curCase=null;
const opt=(arr,v)=>arr.map(x=>`<option${x===v?" selected":""}>${x}</option>`).join("");
const opt2=(arr,v)=>arr.map(([x,l])=>`<option value="${x}"${x===v?" selected":""}>${l}</option>`).join("");
const b8=b=>{if(!/^\d{6}$/.test(b||""))return"";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
function openCase(c,r){curCase=c;r=r||{};const e=CS.esc,d=c.docs||{};
  const prop=CS.proposed(c);
  $("#cedit").hidden=false;
  $("#cedit").innerHTML=`<div class="dv-head"><h2>${e(r.elder_name)}</h2><div class="chips" id="c_chips"></div></div>
  <p class="dv-sub">접수 ${e(r.receipt_no)}번 · 추천 ${e(r.worker_org||"생활지원사")} · ${e(r.worker_name)} · ${e(r.dong)} · ${e((r.address||"").replace(" | ",", "))}</p>
  <div class="cs-form">
   <div class="cs-card"><h3>가정방문</h3>
     <div class="cs-row2"><label>방문일<input type="date" id="c_visit_date" value="${e(c.visit_date||"")}"></label><label>방문자<input type="text" id="c_visitor" maxlength="30" value="${e(c.visitor||"")}"></label></div>
     <label>현황 메모 (주거·난방·건강·생활)<textarea id="c_visit_note" maxlength="2000">${e(c.visit_note||"")}</textarea></label></div>
   <div class="cs-card"><h3>협회 시스템 입력 항목 <small style="font-weight:400;color:var(--mute)">(성과관리시스템 필수 항목)</small></h3>
     <div class="cs-row2"><label>성별<select id="c_v_gender">${opt(["","남","여"],c.v_gender||r.gender||"")}</select></label><label>생년월일<input type="date" id="c_v_birth" value="${e(c.v_birth||b8(r.birth))}"></label></div>
     <div class="cs-row2"><label>지원 기간 구분<select id="c_period">${opt(["동절기","하절기","동·하절기 전체"],c.period||"동절기")}</select></label><label>사업 참여 이력<select id="c_participation">${opt2([["신규 대상자","신규 (복지관 사례관리 대상 아님)"],["기존 대상자","기존 대상자 (연계)"]],c.participation||"신규 대상자")}</select></label></div>
     <div class="cs-row2"><label>에너지 돌봄단 발굴<select id="c_care_found">${opt2([["","선택"],["예","예 (돌봄단 발굴)"],["아니오","아니오 (기관 자체 발굴)"]],c.care_found||"")}</select></label><span></span></div></div>
   <div class="cs-card"><h3>확인한 세대·소득 <small style="font-weight:400;color:var(--mute)">(추천 내용에서 가져옴, 확인 후 고치기)</small></h3>
     <div class="cs-row2"><label>세대주 본인<select id="c_v_is_head">${opt(["","예","아니오"],c.v_is_head)}</select></label><label>가구원 수 (등본)<input type="number" min="1" max="20" id="c_v_household_size" value="${e(c.v_household_size||"")}"></label></div>
     <div class="cs-row2"><label>세대주 성함<input type="text" id="c_v_head_name" maxlength="30" value="${e(c.v_head_name||"")}"></label><label>세대주 생년월일<input type="text" id="c_v_head_birth" maxlength="6" value="${e(c.v_head_birth||"")}"></label></div>
     <div class="cs-row2"><label>소득 구분<select id="c_v_income">${opt(["","기초생활수급자","차상위","저소득(건보료 기준)","기준 초과"],c.v_income)}</select></label><label>에너지바우처<select id="c_v_voucher">${opt2([["",""],["안 받음","안 받음"],["받았는데 다 씀","받았는데 다 씀 (2025 잔액 1만원 이하)"],["받는 중","받는 중"]],c.v_voucher||"")}</select></label></div>
     <label>바우처 대상 세대원 <small style="font-weight:400;color:var(--mute)">노인·영유아·장애인·임산부·중증/희귀/중증난치질환자·한부모·소년소녀가정·다자녀 (수급자면 바우처 대상)</small><select id="c_v_voucher_target">${opt(["","있음","없음"],c.v_voucher_target)}</select></label>
     <label>바우처 쓰기 어려운 환경 <small style="font-weight:400;color:var(--mute)">3유형 판단 근거 (공고문 2쪽) · 근거 사진·메모를 남겨 두세요</small><select id="c_v_env">${opt(["",...CS.ENV],c.v_env)}</select></label>
     <div class="cs-row2"><label>난방 방식<select id="c_v_heating">${opt(["","도시가스","기름(등유) 보일러","LPG","연탄","전기","기타"],c.v_heating)}</select></label><label>본인 명의 통장<select id="c_v_account">${opt(["","있음","없음","압류 우려"],c.v_account)}</select></label></div></div>
   <div class="cs-card"><h3>유형과 지원 금액</h3>
     <p class="dv-sub" style="margin:0 0 6px">확인한 정보로 본 제안: <b id="c_prop">${prop?e(prop):"정보 부족"}</b></p>
     <div class="cs-row2"><label>판정 유형 (위원회 상정용)<select id="c_type_final">${opt2([["","아직"],...["1","2","3","4"].map(t=>[t+"유형",t+"유형 "+CS.TYPES[t]])],c.type_final||"")}</select></label><label>지원 시작<select id="c_start_month">${[[11,"11월(4회)"],[12,"12월(3회)"],[1,"1월(2회)"],[2,"2월(1회)"]].map(([v,l])=>`<option value="${v}"${(c.start_month||11)==v?" selected":""}>${l}</option>`).join("")}</select></label></div>
     <div id="c_amt"></div></div>
   <div class="cs-card" style="grid-column:1/-1"><h3>증빙 서류 <small style="font-weight:400;color:var(--mute)">사진·스캔·PDF를 올리면 여기서 바로 열어볼 수 있어요 (담당자 계정만)</small></h3>
     ${CS.DOCS.map(x=>{const v=d[x.k]||{};return `<div class="doc" data-doc="${x.k}"><div class="doc-top"><b>${x.l}${x.req===1?' <span style="color:var(--warm);font-size:12px">필수</span>':x.req==="t23"?' <span style="color:var(--amber);font-size:12px">2·3유형 필수</span>':""}</b>
       <label><input type="checkbox" data-got="${x.k}"${v.got?" checked":""}> 받음</label>${x.dated?`<label>발급일 <input type="date" data-date="${x.k}" value="${e(v.date||"")}"></label>`:""}</div>${x.h?`<small>${x.h}</small>`:""}
       <div class="files" id="files-${x.k}"><span class="dv-empty">불러오는 중…</span></div></div>`}).join("")}</div>
   <div class="cs-card"><h3>에너지 효율 개선</h3><div class="cs-checks">${["열화상 진단","방풍·단열 물품","방한 물품","난방기구 수리","외부 집수리 연계"].map(x=>`<label><input type="checkbox" data-eff="${x}"${(c.eff_needs||[]).includes(x)?" checked":""}> ${x}</label>`).join("")}</div>
     <label style="margin-top:8px">메모<textarea id="c_eff_note" maxlength="1000">${e(c.eff_note||"")}</textarea></label></div>
   <div class="cs-card"><h3>단계 · 판정</h3>
     <div class="cs-row2"><label>단계<select id="c_stage">${opt(CS.STAGES,c.stage)}</select></label><label>가구코드<input type="text" id="c_household_code" maxlength="10" placeholder="A-01" value="${e(c.household_code||"")}"></label></div>
     <div class="cs-row2"><label>위원회 결과<select id="c_committee_result">${opt(["","선정","보류","탈락"],c.committee_result)}</select></label><label>판정일<input type="date" id="c_committee_date" value="${e(c.committee_date||"")}"></label></div>
     <label>판정 메모<input type="text" id="c_committee_note" maxlength="300" value="${e(c.committee_note||"")}"></label>
     <label>협회 승인일<input type="date" id="c_kaswc_approved" value="${e(c.kaswc_approved||"")}"></label></div>
  </div>
  <div class="acts"><button class="sbtn pri" id="c_save" type="button">저장</button><button class="sbtn" id="c_close" type="button">닫기</button>${B.revert?'<button class="sbtn dan" id="c_rev" type="button">추천 접수로 되돌리기</button>':""}<span class="msg" id="c_msg"></span></div>`;
  refreshCalc();CS.DOCS.forEach(x=>listFiles(x.k));
  $("#cedit").oninput=$("#cedit").onchange=()=>{refreshCalc();$("#c_msg").textContent="저장 안 됨"};
  $("#c_save").onclick=saveCase;$("#c_close").onclick=()=>{$("#cedit").hidden=true;curCase=null};
  let arm2=false;if($("#c_rev"))$("#c_rev").onclick=async()=>{if(!arm2){arm2=true;$("#c_rev").textContent="정말 되돌리기 (방문 기록·올린 서류가 지워져요)";return}
    $("#c_rev").disabled=true;try{await B.revert(c.id);$("#cedit").hidden=true;H.reverted(c)}catch(x){$("#c_msg").textContent="되돌리지 못했어요: "+x.message;$("#c_rev").disabled=false}};
  let arm=false;if($("#c_del"))$("#c_del").onclick=async()=>{if(!arm){arm=true;$("#c_del").textContent="정말 삭제 (올린 파일은 남아요)";return}try{await B.del(c.id);$("#cedit").hidden=true;H.deleted(c.id)}catch(x){$("#c_msg").textContent="삭제하지 못했어요"}};
  $("#cedit").scrollIntoView({behavior:"smooth",block:"start"});
}
function formCase(){const c=curCase,g=id=>$("#c_"+id),docs={};
  CS.DOCS.forEach(x=>{const got=document.querySelector(`[data-got="${x.k}"]`).checked,dt=document.querySelector(`[data-date="${x.k}"]`);docs[x.k]={got,date:dt&&dt.value||null}});
  return {visit_date:g("visit_date").value||null,visitor:g("visitor").value.trim()||null,visit_note:g("visit_note").value.trim()||null,
    v_is_head:g("v_is_head").value||null,v_head_name:g("v_head_name").value.trim()||null,v_head_birth:g("v_head_birth").value.trim()||null,v_household_size:+g("v_household_size").value||null,
    v_income:g("v_income").value||null,v_voucher_target:g("v_voucher_target").value||null,v_env:g("v_env").value||null,v_gender:g("v_gender").value||null,v_birth:g("v_birth").value||null,period:g("period").value,participation:g("participation").value,care_found:g("care_found").value||null,v_voucher:g("v_voucher").value||null,v_heating:g("v_heating").value||null,v_account:g("v_account").value||null,
    type_final:g("type_final").value||null,start_month:+g("start_month").value,docs,
    eff_needs:[...document.querySelectorAll("[data-eff]:checked")].map(x=>x.dataset.eff),eff_note:g("eff_note").value.trim()||null,
    stage:g("stage").value,household_code:g("household_code").value.trim()||null,committee_result:g("committee_result").value||null,committee_date:g("committee_date").value||null,committee_note:g("committee_note").value.trim()||null,kaswc_approved:g("kaswc_approved").value||null}}
function refreshCalc(){if(!curCase)return;const t=Object.assign({},curCase,formCase());const a=CS.amounts(t),ds=CS.docState(t);
  $("#c_prop").textContent=CS.proposed(t)||"정보 부족";
  $("#c_amt").innerHTML=a?`<div class="amt-box">${a.list.map(([m,v])=>`<div>${m}<b>${CS.fmt(v)}</b></div>`).join("")}<div class="tot">동절기 합계<b>${CS.fmt(a.tot)}</b></div></div>`:'<p class="dv-empty">유형과 가구원 수를 넣으면 계산돼요</p>';
  $("#c_chips").innerHTML=`<span class="stg stg-${CS.esc(t.stage)}">${CS.esc(t.stage)}</span><span class="chip2 ${ds.full?"ok":"amber"}">서류 ${ds.ok}/${ds.need}</span>${ds.stale.length?`<span class="chip2 warn">신청일 기준 3개월 넘음: ${CS.esc(ds.stale.join(", "))}</span>`:""}${ds.full&&t.stage==="조사중"?'<span class="chip2 info">서류가 다 모였어요 → 단계를 ‘서류완비’로</span>':""}`}
async function saveCase(){const up=formCase();$("#c_save").disabled=true;
  try{const nc=await B.save(curCase.id,up);Object.assign(curCase,nc||up);$("#c_msg").textContent="저장했어요";H.saved(curCase)}
  catch(x){$("#c_msg").textContent=/session/.test(x.message)?"편집 시간이 끝났어요. 다시 편집 비밀번호를 넣어 주세요":"저장하지 못했어요: "+x.message}
  finally{$("#c_save").disabled=false}}
/* 증빙 파일 */
async function listFiles(k){const box=$("#files-"+k);if(!box||!curCase)return;let fs=[],error=null;try{fs=await B.list(curCase.id,k)}catch(x){error=x}
  box.innerHTML=fs.map(f=>`<span class="fpill">${CS.esc(f.mimetype==="application/pdf"?"PDF":"사진")} · ${CS.esc(new Date(f.created_at).toLocaleDateString("ko-KR"))}<button type="button" data-open="${CS.esc(k+"/"+f.name)}">보기</button><button type="button" class="x" data-rm="${CS.esc(k+"/"+f.name)}">삭제</button></span>`).join("")+
    `<label class="upl">+ 사진·파일 올리기<input type="file" accept="image/*,application/pdf" multiple data-up="${k}"></label>`+(error?'<span class="err">목록을 못 불러왔어요</span>':"")}
async function shrink(file){if(!/^image\//.test(file.type)||file.type==="image/heic")return file;
  const img=await createImageBitmap(file).catch(()=>null);if(!img)return file;const m=2000,s=Math.min(1,m/Math.max(img.width,img.height));
  const cv=document.createElement("canvas");cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
  return await new Promise(res=>cv.toBlob(b=>res(b||file),"image/jpeg",.85))}
document.addEventListener("change",async e=>{const inp=e.target.closest("[data-up]");if(!inp||!curCase)return;e.stopPropagation();const k=inp.dataset.up;
  for(const f of inp.files){const b=await shrink(f);const ext=b.type==="application/pdf"?"pdf":b.type==="image/png"?"png":b.type==="image/heic"?"heic":"jpg";
    try{await B.upload(curCase.id,k,b,b.type||f.type||"image/jpeg")}catch(x){$("#c_msg").textContent="올리지 못했어요: "+x.message}}
  const cb=document.querySelector(`[data-got="${k}"]`);if(cb&&!cb.checked){cb.checked=true;refreshCalc();$("#c_msg").textContent="파일을 올려 ‘받음’에 체크했어요. 저장을 눌러 주세요"}
  listFiles(k)},true);
document.addEventListener("click",async e=>{const o=e.target.closest("[data-open]"),x=e.target.closest("[data-rm]");if(!curCase||(!o&&!x))return;
  if(o){const w=window.open("","_blank");try{const u=await B.open(curCase.id,`${curCase.id}/${o.dataset.open}`);if(w)w.location=u;else location.href=u}catch(e2){if(w)w.close();$("#c_msg").textContent="열지 못했어요"}}
  if(x){if(x.dataset.arm!=="1"){x.dataset.arm="1";x.textContent="정말 삭제";return}try{await B.remove(curCase.id,`${curCase.id}/${x.dataset.rm}`)}catch(e2){$("#c_msg").textContent="삭제하지 못했어요";return}listFiles(x.dataset.rm.split("/")[0])}});

return {init(b,h){B=b;H=Object.assign(H,h||{})},open:openCase,current:()=>curCase};
})();
