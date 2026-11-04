/* 선정 심사 공용 로직 (관리: 편집 / 열람: 보기) */
window.CS=(function(){
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const DOCS=[
    {k:"resident",l:"주민등록등본",dated:1,req:1,h:"세대주·가구원 확인 · 발급 3개월 이내"},
    {k:"income",l:"소득 증빙",dated:1,req:1,h:"수급자 증명서 · 차상위 증빙 · 건강보험료 납부확인서(3개월 평균) 중 하나 · 발급 3개월 이내"},
    {k:"voucher",l:"에너지바우처 확인",dated:0,req:"t23",h:"결정통지서 또는 잔액조회 캡처 · 2유형은 소진 확인(1600-3190 공동청취) 기록"},
    {k:"bank",l:"본인 명의 통장 사본",dated:0,req:1,h:"지원가구(세대주) 명의"},
    {k:"consent",l:"개인정보 수집·이용 동의서",dated:0,req:1,h:""},
    {k:"pledge",l:"용도 약정서",dated:0,req:1,h:"냉·난방비를 용도대로 쓰겠다는 약정"},
    {k:"etc",l:"기타 서류·현장 사진",dated:0,req:0,h:"바우처 대상 증빙(노인·장애 등), 집 사진 등"}];
  const STAGES=["조사중","서류완비","위원회상정","선정","보류","탈락"];
  const W={"1":[330000,470000,620000,800000],"2":[165000,235000,310000,400000],"3":[330000,470000,620000,800000],"4":[412500,587500,775000,1000000]};
  const MONTHS={11:["11/16","12/10","1/10","2/10"],12:["12/10","1/10","2/10"],1:["1/10","2/10"],2:["2/10"]};
  const typeFrom=(v,h)=>v==="안 받음"?"1":v==="받았는데 다 씀"?"2":v==="받는 중"?"3":(["기름(등유) 보일러","LPG","연탄"].includes(h)?"4":"");
  const proposed=c=>{const t=typeFrom(c.v_voucher,c.v_heating);const four=["기름(등유) 보일러","LPG","연탄"].includes(c.v_heating);return t+(four&&t!=="4"?" (4유형 후보)":"")};
  const typeOf=c=>(c.type_final||"").replace(/[^1-4]/g,"")||typeFrom(c.v_voucher,c.v_heating);
  function amounts(c){const t=typeOf(c),n=Math.min(4,Math.max(1,+c.v_household_size||0));if(!t||!+c.v_household_size)return null;
    const tot=W[t][n-1],ms=MONTHS[c.start_month||11]||MONTHS[11],k=ms.length,per=Math.ceil(tot/k/1000)*1000;
    return {tot,list:ms.map((m,i)=>[m,i<k-1?per:tot-per*(k-1)])}}
  const fmt=n=>Number(n).toLocaleString("ko-KR");
  function docState(c){const d=c.docs||{},t=typeOf(c),today=new Date();let need=0,ok=0,stale=[];
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
    return `<div class="dv-head"><h2>${esc(r.elder_name||"")}</h2><div class="chips"><span class="stg stg-${esc(c.stage)}">${esc(c.stage)}</span>${typeOf(c)?`<span class="chip2 info">${typeOf(c)}유형${c.type_final?"":" (안)"}</span>`:""}<span class="chip2 ${ds.full?"ok":"amber"}">서류 ${ds.ok}/${ds.need}</span>${ds.stale.length?`<span class="chip2 warn">3개월 지남: ${esc(ds.stale.join(", "))}</span>`:""}</div></div>
    <p class="dv-sub">${c.household_code?esc(c.household_code)+" · ":""}방문 ${esc(c.visit_date||"미정")}${c.visitor?" · "+esc(c.visitor):""}</p>
    <div class="dv-grid">
      <div class="dv-card"><h3>확인한 세대·소득</h3>${row("세대주 본인",c.v_is_head)}${row("세대주",[c.v_head_name,c.v_head_birth].filter(Boolean).join(" · "))}${row("가구원 수",c.v_household_size?c.v_household_size+"명":"")}${row("소득 구분",c.v_income)}${row("수급 종류",c.v_recipient_kinds)}${row("바우처",c.v_voucher)}${row("난방 방식",c.v_heating)}${row("본인 명의 통장",c.v_account)}</div>
      <div class="dv-card"><h3>지원 금액 (동절기)</h3>${a?`<div class="amt-box">${a.list.map(([m,v])=>`<div>${m}<b>${fmt(v)}</b></div>`).join("")}<div class="tot">합계<b>${fmt(a.tot)}</b></div></div>`:'<p class="dv-empty">유형과 가구원 수를 확인하면 계산돼요</p>'}</div>
      <div class="dv-card"><h3>증빙 서류</h3>${DOCS.map(x=>{const v=d[x.k]||{};return `<div class="dv-row"><span>${x.l}</span><span>${v.got?"받음"+(v.date?" · "+esc(v.date):""):'<span style="color:var(--mute);font-weight:400">아직</span>'}</span></div>`}).join("")}</div>
      <div class="dv-card"><h3>효율 개선 · 판정</h3>${row("필요 지원",c.eff_needs)}${row("효율 메모",c.eff_note)}${row("위원회 결과",c.committee_result)}${row("판정일",c.committee_date)}${row("판정 메모",c.committee_note)}${row("협회 승인",c.kaswc_approved)}</div>
      ${c.visit_note?`<div class="dv-card" style="grid-column:1/-1"><h3>방문 현황 메모</h3><div class="dv-quote">${esc(c.visit_note)}</div></div>`:""}
    </div>`}
  function csv(cases,refs){const R=Object.fromEntries(refs.map(r=>[r.id,r]));const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const head=["가구코드","대상자","생년월일","성별","연락처","거주동","주소","세대주 본인","세대주","가구원 수","소득 구분","수급 종류","바우처","난방","유형","동절기 지원액","월별 지급","서류","3개월 지난 서류","방문일","방문자","방문 메모","효율 개선","단계","위원회 결과","판정일","협회 승인","추천자"];
    const lines=[head.map(q).join(",")].concat(cases.map(c=>{const r=R[c.referral_id]||{},a=amounts(c),ds=docState(c);return [c.household_code,r.elder_name,r.birth,r.gender,r.phone,r.dong,(r.address||"").replace(" | ",", "),c.v_is_head,[c.v_head_name,c.v_head_birth].filter(Boolean).join(" "),c.v_household_size,c.v_income,(c.v_recipient_kinds||[]).join("·"),c.v_voucher,c.v_heating,typeOf(c)?typeOf(c)+"유형":"",a?a.tot:"",a?a.list.map(([m,v])=>m+" "+v).join(" / "):"",`${ds.ok}/${ds.need}`,ds.stale.join("·"),c.visit_date,c.visitor,c.visit_note,(c.eff_needs||[]).join("·"),c.stage,c.committee_result,c.committee_date,c.kaswc_approved,`${r.worker_org||"생활지원사"} ${r.worker_name||""}`].map(q).join(",")}));
    const b=new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const el=document.createElement("a");el.href=URL.createObjectURL(b);el.download=`온앤쿨_선정심사_${new Date().toISOString().slice(0,10)}.csv`;el.click();URL.revokeObjectURL(el.href)}
  return {DOCS,STAGES,typeFrom,proposed,typeOf,amounts,docState,goal,listHTML,viewHTML,csv,fmt,esc};
})();
