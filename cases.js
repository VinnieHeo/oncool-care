/* 선정 심사 공용 로직 (관리: 편집 / 열람: 보기) */
window.CS=(function(){
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const DOCS=[
    {k:"resident",l:"주민등록등본",dated:1,req:1,h:"세대주·가구원 확인 · 발급 3개월 이내"},
    {k:"income",l:"소득 증빙",dated:1,req:"t14",h:"1유형: 건강보험료 납부확인서(최근 3개월), 의료급여 수급자는 수급자증명서(협회 확인 11/12) · 4유형: 건보료 납부확인서 또는 수급자증명서 · 2·3유형은 결정통지서가 대신합니다 · 발급 3개월 이내 · 외국인은 소득금액증명원/근로소득 원천징수 영수증 · 근거: 매뉴얼 1장"},
    {k:"hifam",l:"건보 자격확인서 + 가족관계증명서",dated:1,req:0,h:"가족이 건강보험료를 내는 경우만 · 납부자의 자격확인(통보)서 인원으로 가구원 수 산정"},
    {k:"voucher",l:"에너지바우처 확인",dated:0,req:"t23",h:"2유형: 2026년 에너지이용권 결정통지서 · 2025년 소진(잔액 1만 원 이하)은 따로 나오는 서류가 없어 대상자가 1600-3190에 전화하고 담당자가 함께 듣고 확인 → 확인서(별첨 2)에 직인을 찍어 증빙으로 제출(협회 확인 11/12) · 3유형: 결정통지서, 또는 수급자증명서 + 바우처 대상 증빙, 그리고 바우처를 쓰기 어려운 환경 확인(사진·상담 메모) · 근거: 공고문 2쪽, 안내문 1쪽"},
    {k:"confirm",l:"유형별 확인서 (협회 별첨 2·3·4)",dated:0,req:"t234",h:"복지관이 작성·직인 · 2유형 별첨 2(전년도 바우처 소진 조회) · 3유형 별첨 3(사각지대 거주) · 4유형 별첨 4(인프라 취약지역 거주) · 협회 시스템에 증빙으로 등록"},
    {k:"bank",l:"대상자 본인 명의 통장 사본",dated:0,req:"t123",h:"세대주가 아니어도 대상자 본인 명의 · 4유형은 연료를 직접 구매·배송해서 필요 없습니다 · 근거: 매뉴얼 3장"},
    {k:"consent_own",l:"개인정보 동의서 (복지관 자체 · 온앤쿨 시스템)",dated:1,req:1,h:"가정방문 때 서면으로 받기 · 이 시스템에 기록·증빙을 올리기 전에 필요 · 민감정보(건강·장애)는 별도 동의란 · 원본은 복지관 보관"},
    {k:"consent",l:"개인정보 수집·이용·제공 동의서 (협회 양식)",dated:0,req:1,h:"협회 시스템에 입력하기 전에 꼭 받아야 합니다 · 원본은 복지관 보관"},
    {k:"pledge",l:"용도 약정서",dated:0,req:1,h:"냉·난방비를 용도대로 쓰겠다는 약정"},
    {k:"lease",l:"임대인 사용 보장 협약서",dated:0,req:0,h:"임대인·타인 소유 냉·난방기구를 수리할 때만 필수 (공고문 3쪽)"},
    {k:"etc",l:"기타 서류·현장 사진",dated:0,req:0,h:"집 사진, 4유형 근거(도시가스 미공급 등) · 기관 기기로 촬영, 개인 메신저 전송 금지"}];
  const STAGES=["조사중","업로드완료","보완중","서류완비","위원회상정","선정","보류","탈락"];
  const W={"1":[330000,470000,620000,800000],"2":[165000,235000,310000,400000],"3":[330000,470000,620000,800000],"4":[412500,587500,775000,1000000]};
  const MONTHS={11:["11/23","12/10","1/10","2/10"],12:["12/10","1/10","2/10"],1:["1/10","2/10"],2:["2/10"]};
  /* 유형 기준: 공고문(2차) 2쪽 · 신청 질의응답 2쪽
     1 저소득 에너지 취약 = 바우처 미대상 + 냉·난방비 부담
     2 바우처 한도 소진 = 2026 바우처 대상 + 2025 바우처 소진(잔액 1만 원 이하, OT 36쪽)
     3 바우처 사각지대 = 2026 바우처 대상(미신청 포함) + 거주형태·이용환경 때문에 바우처로 충당 어려움
     4 인프라 취약 = 도시가스 미설치, 등유·LPG·화목·연탄 보일러 등 (질의응답: 등유·LPG·연탄 → 4유형) */
  const TYPES={"1":"저소득 에너지 취약","2":"바우처 한도 소진","3":"바우처 사각지대","4":"에너지 인프라 취약"};
  const FOUR=["기름(등유) 보일러","LPG","연탄"];
  const ENV=["해당 없음","관리비에 포함해 냄","개별 난방기구만 씀(전기장판 등)","고시원·쪽방·원룸 등 일반 주거 아님","작년에 못 받았거나 못 씀","쓸 수 없어서 신청 안 함","기타 (메모에 적기)"];
  const isTarget=(v,inc,tg)=>v==="받는 중"||v==="받았는데 다 씀"||(inc==="기초생활수급자"&&tg==="있음");
  const hardEnv=env=>!!env&&env!=="해당 없음";
  const typeFrom=(v,h,inc,tg,env)=>{if(FOUR.includes(h))return "4";if(v==="받았는데 다 씀")return "2";
    if(isTarget(v,inc,tg))return hardEnv(env)?"3":"";return v==="안 받음"?"1":""};
  const proposed=c=>{const v=c.v_voucher,inc=c.v_income,tg=c.v_voucher_target,env=c.v_env;
    const t=typeFrom(v,c.v_heating,inc,tg,env);
    if(t==="4")return "4유형 에너지 인프라 취약 (난방: "+c.v_heating+")";
    if(t)return t+"유형 "+TYPES[t]+(t==="1"&&inc==="기초생활수급자"&&!tg?" · 수급자라 바우처 대상 세대원이 있으면 1유형이 아닙니다":"");
    if(isTarget(v,inc,tg))return env==="해당 없음"?"바우처 대상인데 2·3유형 조건이 안 보입니다 (2025 소진 아님 · 사용 어려운 환경 아님) → 위원회 판단 필요":"바우처 대상입니다 → ‘바우처를 쓸 수 없는 사유’가 있으면 3유형, 없으면 이번 사업 대상이 아닙니다";
    return ""};
  const typeOf=c=>(c.type_final||"").replace(/[^1-4]/g,"")||typeFrom(c.v_voucher,c.v_heating,c.v_income,c.v_voucher_target,c.v_env);
  function amounts(c){const t=typeOf(c),n=Math.min(4,Math.max(1,+c.v_household_size||0));if(!t||!+c.v_household_size)return null;
    const tot=W[t][n-1],ms=MONTHS[c.start_month||11]||MONTHS[11],k=ms.length,per=Math.ceil(tot/k/1000)*1000;
    return {tot,list:ms.map((m,i)=>[m,i<k-1?per:tot-per*(k-1)])}}
  const fmt=n=>Number(n).toLocaleString("ko-KR");
  /* 안내문 1쪽: 증빙은 "신청일 기준 3개월 이내 발급" → 기준일 = 가정방문일(신청서 받는 날), 없으면 심사 카드 만든 날 */
  function docState(c){const d=c.docs||{},t=typeOf(c),today=c.visit_date?new Date(c.visit_date):c.created_at?new Date(c.created_at):new Date();let need=0,ok=0,stale=[];
    DOCS.forEach(x=>{const req=typeof x.req==="string"?(!t||x.req.includes(t)):!!x.req;if(!req)return;need++;const v=d[x.k]||{};
      let good=!!v.got;if(good&&x.dated&&v.date){{const dt=new Date(v.date);const lim=new Date(today);lim.setMonth(lim.getMonth()-3);if(dt<lim){good=false;stale.push(x.l)}}}
      if(good)ok++});
    return {need,ok,full:need>0&&ok===need,stale}}
  function goal(cases){const sel=cases.filter(c=>["선정","위원회상정","서류완비"].includes(c.stage));
    const by={"1":0,"2":0,"3":0,"4":0};sel.forEach(c=>{const t=typeOf(c);if(by[t]!==undefined)by[t]++});
    const tot=sel.length,pct=Math.min(100,tot/40*100);
    return `<div class="goal"><b>선정 목표 40가구 이상 · 유형별 최소 4가구</b><div class="bar2"><i style="width:${pct}%;background:var(--green)"></i></div>
      <small>서류완비·상정·선정 ${tot}가구 / 40 · 방문 ${cases.length}가구</small>
      <div class="tcount">${["1","2","3","4"].map(t=>`<span class="chip2 ${by[t]>=4?"ok":"warn"}">${t}유형 ${by[t]}</span>`).join("")}</div></div>`}
  /* 추천자 연락처 (눌러서 전화, 행 열림 방지) */
  const tel=p=>{const d=String(p||"").replace(/\D/g,"");if(!/^0\d{8,10}$/.test(d))return "";const f=d.length===11?d.replace(/(\d{3})(\d{4})(\d{4})/,"$1-$2-$3"):d.replace(/(\d{2,3})(\d{3,4})(\d{4})/,"$1-$2-$3");return `<a class="wtel" href="tel:${d}" onclick="event.stopPropagation()">☎ ${f}</a>`};
  /* 선정 심사 카드 (11/12): 업로드완료(확인할 차례)를 맨 앞, 나머지는 대상자 가나다순 · 추천 접수와 같은 색·배지 */
  function cardHTML(c,r){const a=amounts(c),ds=docState(c),t=typeOf(c),pct=ds.need?Math.round(ds.ok/ds.need*100):0;
    return `<div class="cc" data-cid="${c.id}" tabindex="0"><div class="cc-top"><div class="cc-nm"><b>${esc(r.elder_name)}</b><small>${esc(r.dong||"")}${c.v_household_size?" · "+c.v_household_size+"명":""}${c.household_code?" · "+esc(c.household_code):""}</small></div><span class="stg stg-${esc(c.stage)}">${esc(c.stage)}</span></div>
      <div class="cc-mid">${t?`<span class="pill t${t}">${t}유형${c.type_final?"":" (안)"}</span>`:'<span class="pill">유형 미정</span>'}${a?`<span class="cc-amt">${fmt(a.tot)}원</span>`:""}${c.visit_date?`<span class="cc-vd">방문 ${esc(c.visit_date.slice(5).replace("-","/"))}</span>`:""}</div>
      <div class="cc-doc${ds.full?" full":""}"><span>서류 ${ds.ok}/${ds.need}${ds.stale.length?" ⚠":""}</span><i><b style="width:${pct}%"></b></i></div>
      <div class="cc-wk"><b>${esc(r.worker_name||"")}</b><small>${esc(r.worker_org||"")}</small>${tel(r.worker_phone)}</div></div>`}
  function listHTML(cases,refs){const R=Object.fromEntries(refs.map(r=>[r.id,r]));const nm=c=>(R[c.referral_id]||{}).elder_name||"";
    const tt=c=>(R[c.referral_id]||{}).is_test?1:0,L=[...cases].sort((a,b)=>tt(a)-tt(b)||nm(a).localeCompare(nm(b),"ko")),up=L.filter(c=>c.stage==="업로드완료"),rest=L.filter(c=>c.stage!=="업로드완료");
    if(!L.length)return '<p class="cc-empty">아직 방문 기록이 없습니다. 추천 접수에서 가구를 열고 ‘가정방문 기록 시작’을 눌러 주세요.</p>';
    return (up.length?`<h3 class="cc-h">확인할 차례 · 업로드완료 <b>${up.length}</b></h3><div class="cgrid">${up.map(c=>cardHTML(c,R[c.referral_id]||{})).join("")}</div>`:"")+
      (rest.length?`<h3 class="cc-h">${up.length?"나머지 · ":""}가나다순 <b>${rest.length}</b></h3><div class="cgrid">${rest.map(c=>cardHTML(c,R[c.referral_id]||{})).join("")}</div>`:"")}
  {const st=document.createElement("style");st.textContent=`.cc-h{font-size:14px;margin:14px 4px 8px;color:var(--mute);font-weight:800}.cc-h b{color:var(--ink)}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.cc{background:var(--surface,#fff);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;cursor:pointer;min-width:0}
.cc:hover,.cc:focus-visible{border-color:var(--pri);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--pri) 15%,transparent)}
.cc.tst{opacity:.6}.cc-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.cc-nm{min-width:0}.cc-nm b{font-size:16px}.cc-nm small{display:block;color:var(--mute);font-size:12.5px;margin-top:1px}
.cc-mid{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:13px}.cc-amt{font-weight:700}.cc-vd{color:var(--mute)}
.cc-doc{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--mute)}.cc-doc i{flex:1;height:6px;border-radius:9px;background:var(--line);overflow:hidden}.cc-doc i b{display:block;height:100%;background:var(--pri)}.cc-doc.full span{color:var(--green);font-weight:700}.cc-doc.full i b{background:var(--green)}
.cc-wk{border-top:1px dashed var(--line);padding-top:8px;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline;font-size:13px}.cc-wk small{color:var(--mute);font-size:12px}.cc-wk .wtel{margin-left:auto;font-size:12.5px;color:var(--pri);font-weight:600;text-decoration:none}
.cc-empty{color:var(--mute);padding:12px}`;document.head.appendChild(st)}
  function viewHTML(c,r){const a=amounts(c),ds=docState(c),d=c.docs||{};
    const row=(l,v)=>v!==null&&v!==undefined&&String(v).trim()!==""&&!(Array.isArray(v)&&!v.length)?`<div class="dv-row"><span>${l}</span><span>${esc(Array.isArray(v)?v.join(", "):v)}</span></div>`:"";
    return `<div class="dv-head"><h2>${esc(r.elder_name||"")}</h2><div class="chips"><span class="stg stg-${esc(c.stage)}">${esc(c.stage)}</span>${typeOf(c)?`<span class="chip2 info">${typeOf(c)}유형 ${TYPES[typeOf(c)]}${c.type_final?"":" (안)"}</span>`:""}<span class="chip2 ${ds.full?"ok":"amber"}">서류 ${ds.ok}/${ds.need}</span>${ds.stale.length?`<span class="chip2 warn">신청일 기준 3개월 넘음: ${esc(ds.stale.join(", "))}</span>`:""}</div></div>
    <p class="dv-sub">${c.household_code?esc(c.household_code)+" · ":""}방문 ${esc(c.visit_date||"미정")}${c.visitor?" · "+esc(c.visitor):""}</p>
    <div class="dv-grid">
      <div class="dv-card"><h3>협회 시스템 입력 항목</h3>${row("성별",c.v_gender)}${row("생년월일",c.v_birth)}${row("지원 기간",c.period)}${row("사업 참여 이력",c.participation)}${row("돌봄단 발굴",c.care_found)}</div>
      <div class="dv-card"><h3>확인한 세대·소득</h3>${row("세대주 본인",c.v_is_head)}${row("세대주",[c.v_head_name,c.v_head_birth].filter(Boolean).join(" · "))}${row("가구원 수",c.v_household_size?c.v_household_size+"명":"")}${row("소득 구분",c.v_income)}${row("수급 종류",c.v_recipient_kinds)}${row("바우처",c.v_voucher)}${row("바우처 대상 세대원",c.v_voucher_target)}${row("바우처를 쓸 수 없는 사유",c.v_env)}${row("난방 방식",c.v_heating)}${row("본인 명의 통장",c.v_account)}</div>
      <div class="dv-card"><h3>지원 금액 (동절기)</h3>${a?`<div class="amt-box">${a.list.map(([m,v])=>`<div>${m}<b>${fmt(v)}</b></div>`).join("")}<div class="tot">합계<b>${fmt(a.tot)}</b></div></div>`:'<p class="dv-empty">유형과 가구원 수를 확인하면 계산됩니다</p>'}</div>
      <div class="dv-card"><h3>증빙 서류</h3>${DOCS.map(x=>{const v=d[x.k]||{};return `<div class="dv-row"><span>${x.l}</span><span>${v.got?"받음"+(v.date?" · "+esc(v.date):""):'<span style="color:var(--mute);font-weight:400">아직</span>'}</span></div>`}).join("")}</div>
      <div class="dv-card"><h3>효율 개선 · 판정</h3>${row("필요 지원",c.eff_needs)}${row("효율 메모",c.eff_note)}${row("위원회 결과",c.committee_result)}${row("판정일",c.committee_date)}${row("판정 메모",c.committee_note)}${row("협회 승인",c.kaswc_approved)}</div>
      <div class="dv-card"><h3>에너지 상담</h3>${row("가구원",c.members)}${row("건강보험료 월액",c.hi_premium)}${row("냉방 설비",c.cool_equip)}${row("월평균 냉·난방비",[c.bill_avg,c.bill_checked?"고지서 "+c.bill_checked:""].filter(Boolean).join(" · "))}${row("체납 기간",c.arrears_months)}${row("설비 소유",c.equip_owner)}${row("단전·단가스",c.cutoff)}${row("온열·한랭 취약성",c.heat_risk)}${row("안부 확인 보호자",c.guardian)}</div>
      ${c.visit_note?`<div class="dv-card" style="grid-column:1/-1"><h3>방문 현황 메모</h3><div class="dv-quote">${esc(c.visit_note)}</div></div>`:""}
    </div>`}

  /* 초기상담지 출력 (A4 한 장) */
  function printSheet(c,r){r=r||{};const v=x=>esc(Array.isArray(x)?x.join(", "):(x??""));const t=typeOf(c),a=amounts(c),ds=docState(c),d=c.docs||{};
    const R=(l,x,l2,x2)=>l2===undefined?`<tr><th>${l}</th><td colspan="3">${x}</td></tr>`:`<tr><th>${l}</th><td>${x}</td><th>${l2}</th><td>${x2}</td></tr>`;
    const sec=(h,rows)=>`<h3>■ ${h}</h3><table>${rows}</table>`;
    const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>초기상담지_${v(r.elder_name)}</title><style>
      @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:"맑은 고딕","Malgun Gothic",sans-serif;font-size:10pt;color:#000;margin:0}
      h1{font-size:16pt;text-align:center;margin:0 0 2px}.sub{text-align:center;font-size:9pt;margin:0 0 8px}h3{font-size:10.5pt;margin:8px 0 3px}
      table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #444;padding:3px 6px;vertical-align:middle;word-break:keep-all;overflow-wrap:anywhere}
      th{background:#e7ecf2;width:17%;font-weight:700;text-align:center}td{width:33%}.sign{margin-top:10px;text-align:right}.note{font-size:8.5pt;margin-top:6px}
      .bar{display:flex;gap:8px;justify-content:center;margin:10px}@media print{.bar{display:none}}</style></head><body>
      <div class="bar"><button onclick="print()">인쇄 · PDF 저장</button></div>
      <h1>온앤쿨케어 초기상담지 (에너지 돌봄)</h1><p class="sub">안양시만안종합사회복지관 · 접수 ${v(r.receipt_no)}번${c.household_code?" · 가구코드 "+v(c.household_code):""}</p>
      ${sec("상담 정보",R("상담일",v(c.visit_date),"상담자",v(c.visitor))+R("추천자",v((r.worker_org||"")+" "+(r.worker_name||"")),"긴급도",v(r.urgency)))}
      ${sec("대상자",R("성명",v(r.elder_name),"생년월일·성별",v([c.v_birth||r.birth,c.v_gender||r.gender].filter(Boolean).join(" · ")))+R("연락처",v(r.phone),"거주동",v(r.dong))+R("실거주 주소",v((r.address||"").replace(" | ",", "))))}
      ${sec("세대·소득·바우처",R("세대주",v(c.v_is_head==="예"?"본인":[c.v_head_name,c.v_head_birth].filter(Boolean).join(" · ")),"가구원 수",v(c.v_household_size?c.v_household_size+"명":""))+R("가구원(등본)",v(c.members)||v(r.live_with))+R("소득 구분",v([c.v_income,(c.v_recipient_kinds||[]).join("·")].filter(Boolean).join(" ")),"건강보험료 월액",v(c.hi_premium))+R("에너지바우처",v(c.v_voucher),"바우처 대상 세대원",v(c.v_voucher_target))+R("바우처를 쓸 수 없는 사유",v(c.v_env)))}
      ${sec("주거 에너지 환경",R("난방 방식",v(c.v_heating),"냉방 설비",v(c.cool_equip))+R("주거 형태",v(r.housing_tenure),"주거 위험",v(r.housing_risk))+R("설비 고장",v(r.heater_broken),"설비 소유",v(c.equip_owner))+R("월평균 냉·난방비",v([c.bill_avg,c.bill_checked?"고지서 "+c.bill_checked:""].filter(Boolean).join(" · ")),"체납",v([(r.arrears||[]).join("·"),c.arrears_months].filter(Boolean).join(" · ")))+R("단전·단가스 경험",v(c.cutoff),"타 에너지 지원",v(r.other_support))+R("본인 명의 통장",v(c.v_account)))}
      ${sec("건강·안전",R("건강·생활 위험",v(r.risk_note))+R("온열·한랭 취약성",v(c.heat_risk),"안부 확인 보호자",v(c.guardian)))}
      ${sec("판단",R("유형 판단",v(t?t+"유형 "+TYPES[t]:"")+(c.type_final?"":" (제안)"),"동절기 지원액",a?fmt(a.tot)+"원":"")+R("효율 개선 필요",v(c.eff_needs),"증빙 서류",`${ds.ok}/${ds.need}`+(ds.stale.length?" (3개월 넘음: "+v(ds.stale.join(", "))+")":""))+R("추천 사유",v(r.reason))+R("방문 현황·상담자 의견",v(c.visit_note).replace(/\n/g,"<br>"))+R("위원회 결과",v(c.committee_result),"판정일",v(c.committee_date)))}
      <p class="sign">상담자 ${v(c.visitor)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(서명)</p>
      <p class="note">※ 추천 페이지 입력 내용과 가정방문 기록으로 자동 작성된 상담지입니다. 출력 ${new Date().toLocaleDateString("ko-KR")}</p></body></html>`;
    const w=window.open("","_blank");if(!w){alert("팝업이 막혀 있습니다. 팝업을 허용해 주세요.");return}w.document.open();w.document.write(html);w.document.close()}
  function csv(cases,refs){const R=Object.fromEntries(refs.map(r=>[r.id,r]));const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const head=["가구코드","대상자","생년월일","성별","지원 기간","사업 참여 이력","돌봄단 발굴","연락처","거주동","주소","세대주 본인","세대주","가구원 수","소득 구분","수급 종류","바우처","바우처 대상 세대원","바우처 쓰기 어려운 환경","난방","유형","동절기 지원액","월별 지급","서류","3개월 지난 서류","방문일","방문자","방문 메모","효율 개선","단계","위원회 결과","판정일","협회 승인","추천자"];
    const lines=[head.map(q).join(",")].concat(cases.map(c=>{const r=R[c.referral_id]||{},a=amounts(c),ds=docState(c);return [c.household_code,r.elder_name,c.v_birth||r.birth,c.v_gender||r.gender,c.period,c.participation,c.care_found,r.phone,r.dong,(r.address||"").replace(" | ",", "),c.v_is_head,[c.v_head_name,c.v_head_birth].filter(Boolean).join(" "),c.v_household_size,c.v_income,(c.v_recipient_kinds||[]).join("·"),c.v_voucher,c.v_voucher_target,c.v_env,c.v_heating,typeOf(c)?typeOf(c)+"유형 "+TYPES[typeOf(c)]:"",a?a.tot:"",a?a.list.map(([m,v])=>m+" "+v).join(" / "):"",`${ds.ok}/${ds.need}`,ds.stale.join("·"),c.visit_date,c.visitor,c.visit_note,(c.eff_needs||[]).join("·"),c.stage,c.committee_result,c.committee_date,c.kaswc_approved,`${r.worker_org||"생활지원사"} ${r.worker_name||""}`].map(q).join(",")}));
    const b=new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const el=document.createElement("a");el.href=URL.createObjectURL(b);el.download=`온앤쿨_선정심사_${new Date().toISOString().slice(0,10)}.csv`;el.click();URL.revokeObjectURL(el.href)}
  return {TYPES,ENV,DOCS,STAGES,typeFrom,proposed,typeOf,amounts,docState,goal,listHTML,viewHTML,csv,fmt,esc,printSheet};
})();

/* 심사 카드 편집기 (백엔드 B, 훅 H 주입) */
window.CSE=(function(){
const $=s=>document.querySelector(s);
let B=null,H={saved(){},deleted(){},reverted(){}},curCase=null,curRef={};
const opt=(arr,v)=>(v&&!arr.includes(v)?[...arr,v]:arr).map(x=>x===""?`<option value=""${!v?" selected":""}>선택</option>`:`<option${x===v?" selected":""}>${x}</option>`).join("");/* 목록에 없는 저장값도 지우지 않게 */
const opt2=(arr,v)=>arr.map(([x,l])=>`<option value="${x}"${x===v?" selected":""}>${l}</option>`).join("");
const b8=b=>{if(!/^\d{6}$/.test(b||""))return"";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
/* 효율개선: 협회 실적 입력 분야를 앞에, 이어서 복지관 항목 (한 묶음) · 기타는 내용 입력 */
const EFF=["단열·창호 (뽁뽁이·문풍지)","고효율 LED 조명 교체","친환경 보일러 점검","서큘레이터·선풍기 보급"],EFF2=["열화상 진단","방한 물품","난방기구 수리","외부 집수리 연계","기타"];
/* 단계 색: 업로드완료(확인할 차례) · 보완중(반려) (11/12) */
{const st=document.createElement("style");st.textContent=".stg-업로드완료{background:var(--violet-soft);color:var(--violet);font-weight:800}.stg-보완중{background:var(--warm-soft);color:var(--warm);font-weight:800}";document.head.appendChild(st)}
/* 추천서 답변은 참고로만 보여 주고 자동 체크는 하지 않음 (11/12) */
const effHint=r=>{const L=[];if(r&&r.heater_broken==="예")L.push("난방기구 고장");((r&&r.housing_risk)||[]).forEach(x=>L.push(x));return L.length?`<p class="eff-hint" style="margin:0 0 8px;font-size:13px;color:var(--mute);line-height:1.55">추천서에 적힌 내용: ${CS.esc(L.join(", "))}<br>현장에서 확인하고 필요한 항목을 골라 주세요.</p>`:""};
const effHas=(L,x)=>(L||[]).includes(x)||(x===EFF[0]&&(L||[]).includes("방풍·단열 물품"));
/* 2유형: 2025년 바우처 소진은 서류가 없어 1600-3190 공동 청취로 확인 → 복지관이 별첨 2 작성 (협회 확인 11/12) */
const VC_ON=v=>["받았는데 다 씀","모름"].includes(v);
function vcallHTML(c,r){const v=c.vcall||{},e=CS.esc,show=v.ok||VC_ON(c.v_voucher||(r||{}).voucher);
  return `<div class="vcall" id="c_vcall"${show?"":" hidden"}><b>2025년 바우처 소진 확인 (2유형)</b><p>2025년 사용 내역은 따로 발급되는 서류가 없습니다.<br>대상자가 에너지바우처 콜센터(1600-3190)에 전화하고 담당자가 함께 들어 주세요.</p>
   <label class="vc-ck"><input type="checkbox" id="c_vc_ok"${v.ok?" checked":""}> 함께 들으며 2025년 잔액이 1만 원 이하임을 확인하였습니다.</label>
   <div class="cs-row2"><label>확인일<input type="date" id="c_vc_date" value="${e(v.date||"")}"></label><label>2025년 잔액 (들은 금액)<input type="text" id="c_vc_bal" maxlength="20" placeholder="예) 3,200원" value="${e(v.bal||"")}"></label></div>
   <div class="cs-row2"><label>함께 들은 사람<input type="text" id="c_vc_who" maxlength="30" placeholder="이름" value="${e(v.who||"")}"></label><label>결과<select id="c_vc_res">${opt(["","소진 확인","1만 원 초과","조회 안 됨"],v.res||"")}</select></label></div></div>`}
function vcallForm(){const q=id=>document.getElementById(id);if(!q("c_vc_ok"))return (curCase||{}).vcall||null;
  const v={ok:q("c_vc_ok").checked,date:q("c_vc_date").value||null,bal:q("c_vc_bal").value.trim()||null,who:q("c_vc_who").value.trim()||null,res:q("c_vc_res").value||null};return v.ok||v.date||v.bal||v.who||v.res?v:null}
document.addEventListener("change",e=>{if(!e.target||e.target.id!=="c_vc_ok"||!e.target.checked)return;const d=document.getElementById("c_vc_date"),s=document.getElementById("c_vc_res");
  if(d&&!d.value){const t=new Date();d.value=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}if(s&&!s.value)s.value="소진 확인"});
{const st=document.createElement("style");st.textContent=`.vcall{margin-top:10px;padding:12px;border:1.5px solid var(--pri);border-radius:12px;background:color-mix(in srgb,var(--pri) 6%,transparent);display:flex;flex-direction:column;gap:8px}.vcall>b{font-size:14px}.vcall>p{margin:0;font-size:12.5px;color:var(--mute);line-height:1.55}.vcall .vc-ck{flex-direction:row!important;align-items:flex-start!important;gap:8px;font-weight:700;font-size:13.5px}.vcall .vc-ck input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:var(--pri);-webkit-appearance:auto;appearance:auto}`;document.head.appendChild(st)}
document.addEventListener("change",e=>{const t=e.target;if(!t.matches||!t.matches('[data-eff="기타"]'))return;const l=document.querySelector(".eff-etc");if(l){l.hidden=!t.checked;if(t.checked){const i=l.querySelector("input");if(i)i.focus()}}});
function openCase(c,r){curCase=c;r=r||{};curRef=r;const e=CS.esc,d=c.docs||{};
  const prop=CS.proposed(c);
  $("#cedit").hidden=false;
  $("#cedit").innerHTML=`<div class="dv-head"><h2>${e(r.elder_name)}</h2><div class="chips" id="c_chips"></div></div>
  <p class="dv-sub">접수 ${e(r.receipt_no)}번 · 추천 ${e(r.worker_org||"생활지원사")} · ${e(r.worker_name)} · ${e(r.dong)} · ${e((r.address||"").replace(" | ",", "))}</p>
  ${B.worker?'<p class="hint" style="margin:6px 0 0">가정방문 내용과 서류를 여기에 남겨 주세요. 복지관 담당자와 같은 카드를 함께 씁니다. 저장을 눌러야 반영됩니다.</p>':""}<div class="cs-form">
   <div class="cs-card"><h3>가정방문</h3>
     <div class="cs-row2"><label>방문일<input type="date" id="c_visit_date" value="${e(c.visit_date||"")}"></label><label>방문자<input type="text" id="c_visitor" maxlength="30" placeholder="이름" value="${e(c.visitor||"")}"></label></div>
     <label>현황 메모<small class="fh">주거·난방·건강·생활 모습을 적어 주세요</small><textarea id="c_visit_note" maxlength="2000" placeholder="예) 보일러는 있지만 가스비 걱정에 전기장판만 사용. 외풍이 심함.">${e(c.visit_note||"")}</textarea></label></div>
   <div class="cs-card"><h3>에너지 상담 <small class="fh2">초기상담지 항목</small></h3>
     <div class="cs-sub">가구</div>
     <label>가구원<small class="fh">등본 기준 · 이름·생년월일·관계</small><textarea id="c_members" maxlength="600" placeholder="예) 홍길동 1950.01.01 본인 / 김영희 1952.03.03 배우자">${e(c.members||"")}</textarea></label>
     <div class="cs-row2"><label>건강보험료 월액<input type="text" id="c_hi_premium" maxlength="30" inputmode="numeric" placeholder="예) 18,500원" value="${e(c.hi_premium||"")}"></label><span></span></div>
     <div class="cs-sub">요금</div>
     <div class="cs-row2"><label>월평균 냉·난방비<input type="text" id="c_bill_avg" maxlength="30" placeholder="예) 12만 원" value="${e(c.bill_avg||"")}"></label><label>고지서 확인<select id="c_bill_checked">${opt(["","확인","미확인"],c.bill_checked||"")}</select></label></div>
     <div class="cs-row2"><label>체납 기간<input type="text" id="c_arrears_months" maxlength="20" placeholder="없음 / 가스 2개월" value="${e(c.arrears_months||"")}"></label><label>단전·단가스 경험<input type="text" id="c_cutoff" maxlength="100" placeholder="없음 / 있음(언제·무엇)" value="${e(c.cutoff||"")}"></label></div>
     <div class="cs-sub">설비</div>
     <div class="cs-row2"><label>냉방 설비<select id="c_cool_equip">${opt(["","에어컨","선풍기만","없음"],c.cool_equip||"")}</select></label><label>냉·난방 설비 소유<select id="c_equip_owner">${opt(["","본인","임대인","기타"],c.equip_owner||"")}</select></label></div>
     <div class="cs-sub">건강·안부</div>
     <div class="cs-row2"><label>온열·한랭질환 취약성<select id="c_heat_risk">${opt(["","낮음","보통","높음"],c.heat_risk||"")}</select></label><label>안부 확인 보호자<input type="text" id="c_guardian" maxlength="100" placeholder="성명·관계·연락처" value="${e(c.guardian||"")}"></label></div></div>
   <div class="cs-card"${B.worker?" hidden":""}><h3>협회 시스템 입력 항목 <small style="font-weight:400;color:var(--mute)">(성과관리시스템 필수 항목)</small></h3>
     <div class="cs-row2"><label>성별<select id="c_v_gender">${opt(["","남","여"],c.v_gender||r.gender||"")}</select></label><label>생년월일<input type="date" id="c_v_birth" value="${e(c.v_birth||b8(r.birth))}"></label></div>
     <div class="cs-row2"><label>지원 기간 구분<select id="c_period">${opt(["동절기","하절기","동·하절기 전체"],c.period||"동절기")}</select></label><label>사업 참여 이력<select id="c_participation">${opt2([["신규 대상자","신규 (복지관 사례관리 대상 아님)"],["기존 대상자","기존 대상자 (연계)"]],c.participation||"신규 대상자")}</select></label></div>
     <div class="cs-row2"><label>에너지 돌봄단 발굴<select id="c_care_found">${opt2([["","선택"],["예","예 (돌봄단 발굴)"],["아니오","아니오 (기관 자체 발굴)"]],c.care_found||"")}</select></label><span></span></div></div>
   <div class="cs-card"${B.worker?" hidden":""}><h3>확인한 세대·소득 <small style="font-weight:400;color:var(--mute)">(추천 내용에서 가져옴, 확인 후 고치기)</small></h3>
     <div class="cs-row2"><label>세대주 본인<select id="c_v_is_head">${opt(["","예","아니오"],c.v_is_head)}</select></label><label>가구원 수 (등본)<input type="number" min="1" max="20" id="c_v_household_size" value="${e(c.v_household_size||"")}"></label></div>
     <div class="cs-row2"><label>세대주 성함<input type="text" id="c_v_head_name" maxlength="30" value="${e(c.v_head_name||"")}"></label><label>세대주 생년월일<input type="text" id="c_v_head_birth" maxlength="6" value="${e(c.v_head_birth||"")}"></label></div>
     <div class="cs-row2"><label>소득 구분<select id="c_v_income">${opt(["","기초생활수급자","차상위","저소득(건보료 기준)","기준 초과"],c.v_income)}</select></label><label>에너지바우처<select id="c_v_voucher">${opt2([["",""],["안 받음","안 받음"],["받았는데 다 씀","받았는데 다 씀 (2025 잔액 1만원 이하)"],["받는 중","받는 중"]],c.v_voucher||"")}</select></label></div>
     <label>바우처 대상 세대원 <small style="font-weight:400;color:var(--mute)">노인·영유아·장애인·임산부·중증/희귀/중증난치질환자·한부모·소년소녀가정·다자녀 (수급자면 바우처 대상)</small><select id="c_v_voucher_target">${opt(["","있음","없음"],c.v_voucher_target)}</select></label>
     ${r.voucher_reason?`<p class="dv-sub" style="margin:0">추천 시 적은 바우처 미신청 사유: <b>${e(r.voucher_reason)}</b></p>`:""}<label>바우처를 쓸 수 없는 사유 <small style="font-weight:400;color:var(--mute)">3유형은 이 사유가 꼭 있어야 해요 · 근거 사진·메모를 남겨 주세요</small><select id="c_v_env">${opt(["",...CS.ENV],c.v_env)}</select></label>
     <div class="cs-row2"><label>난방 방식<select id="c_v_heating">${opt(["","도시가스","기름(등유) 보일러","LPG","연탄","전기","기타"],c.v_heating)}</select></label><label>본인 명의 통장<select id="c_v_account">${opt(["","있음","없음","압류 우려"],c.v_account)}</select></label></div></div>
   <div class="cs-card"${B.worker?" hidden":""}><h3>유형과 지원 금액</h3>
     <p class="dv-sub" style="margin:0 0 6px">확인한 정보로 본 제안: <b id="c_prop">${prop?e(prop):"정보 부족"}</b></p>
     <div class="cs-row2"><label>판정 유형 (위원회 상정용)<select id="c_type_final">${opt2([["","아직"],...["1","2","3","4"].map(t=>[t+"유형",t+"유형 "+CS.TYPES[t]])],c.type_final||"")}</select></label><label>지원 시작<select id="c_start_month">${[[11,"11월(4회)"],[12,"12월(3회)"],[1,"1월(2회)"],[2,"2월(1회)"]].map(([v,l])=>`<option value="${v}"${(c.start_month||11)==v?" selected":""}>${l}</option>`).join("")}</select></label></div>
     <div id="c_amt"></div></div>
   ${B.worker?"":'<div class="cs-card kw-card"><h3>협회 사이트 입력용 요약 <small style="font-weight:400;color:var(--mute)">(onandcool.or.kr 대상자 등록 순서)</small></h3><div id="c_kaswc"></div></div>'}
   <div class="cs-card" style="grid-column:1/-1"><h3>증빙 서류 <small style="font-weight:400;color:var(--mute)">‘찍어서 올리기’는 종이를 반듯하게 펴고 하얗게 보정해서 올립니다 (담당자 계정만)</small></h3>${B.worker?"":'<div class="pdfrow"><button type="button" class="upl" id="c_pdf">서류 전체 PDF로 받기</button><span id="c_pdfmsg" class="dv-empty"></span></div>'}
     <div class="doc-mas">${CS.DOCS.filter(x=>!(B.worker&&x.k==="confirm")).map(x=>{const v=d[x.k]||{};return `<div class="doc" data-doc="${x.k}"><div class="doc-top"><b>${x.l}${x.req===1?' <span class="dreq" style="color:var(--warm);font-size:12px">필수</span>':typeof x.req==="string"?` <span class="dreq" data-req="${x.req}" style="color:var(--amber);font-size:12px">${x.req.slice(1).split("").join("·")}유형 필수</span>`:""}</b>
       <label><input type="checkbox" data-got="${x.k}"${v.got?" checked":""}> 받음</label></div>${x.h?`<small>${x.h}</small>`:""}
       <div class="files" id="files-${x.k}"><span class="dv-empty">불러오는 중…</span></div>${x.k==="voucher"?vcallHTML(c,r):""}</div>`}).join("")}</div></div>
   <div class="cs-card"><h3>에너지 효율 개선</h3>${effHint(r)}<div class="cs-checks">${EFF.concat(EFF2).map(x=>`<label><input type="checkbox" data-eff="${x}"${effHas(c.eff_needs,x)?" checked":""}> ${x}</label>`).join("")}</div>
     <label class="eff-etc"${effHas(c.eff_needs,"기타")?"":" hidden"}>기타 필요 내역<input type="text" id="c_eff_etc" maxlength="100" placeholder="필요한 물품이나 수리 내용을 입력해 주세요" value="${e(c.eff_etc||"")}"></label>
     <label style="margin-top:8px">메모<textarea id="c_eff_note" maxlength="1000">${e(c.eff_note||"")}</textarea></label></div>
   <div class="cs-card"${B.worker?" hidden":""}><h3>단계 · 판정</h3>
     <div class="cs-row2"><label>단계<select id="c_stage">${opt(CS.STAGES,c.stage)}</select></label><label>가구코드<input type="text" id="c_household_code" maxlength="10" placeholder="A-01" value="${e(c.household_code||"")}"></label></div>
     <div class="cs-row2"><label>위원회 결과<select id="c_committee_result">${opt(["","선정","보류","탈락"],c.committee_result)}</select></label><label>판정일<input type="date" id="c_committee_date" value="${e(c.committee_date||"")}"></label></div>
     <label>판정 메모<input type="text" id="c_committee_note" maxlength="300" value="${e(c.committee_note||"")}"></label>
     <label>협회 승인일<input type="date" id="c_kaswc_approved" value="${e(c.kaswc_approved||"")}"></label></div>
  </div>
  <div class="acts"><button class="sbtn pri" id="c_save" type="button">저장</button><button class="sbtn" id="c_close" type="button">닫기</button>${B.worker?"":'<button class="sbtn" id="c_print" type="button">상담지 출력</button>'}${B.revert?'<button class="sbtn dan" id="c_rev" type="button">추천 접수로 되돌리기</button>':""}<span class="msg" id="c_msg"></span></div>`;
  refreshCalc();CS.DOCS.forEach(x=>listFiles(x.k));
  $("#cedit").oninput=$("#cedit").onchange=()=>{refreshCalc();$("#c_msg").textContent="저장되지 않음"};
  $("#c_save").onclick=saveCase;if($("#c_print"))$("#c_print").onclick=()=>CS.printSheet(Object.assign({},curCase,formCase()),r);$("#c_close").onclick=()=>{$("#cedit").hidden=true;curCase=null};
  let arm2=false;if($("#c_rev"))$("#c_rev").onclick=async()=>{if(!arm2){arm2=true;$("#c_rev").textContent="정말 되돌리기 (방문 기록·업로드한 서류가 지워집니다)";return}
    $("#c_rev").disabled=true;try{await B.revert(c.id);$("#cedit").hidden=true;H.reverted(c)}catch(x){$("#c_msg").textContent="되돌리지 못했습니다: "+x.message;$("#c_rev").disabled=false}};
  let arm=false;if($("#c_del"))$("#c_del").onclick=async()=>{if(!arm){arm=true;$("#c_del").textContent="정말 삭제 (올린 파일은 남습니다)";return}try{await B.del(c.id);$("#cedit").hidden=true;H.deleted(c.id)}catch(x){$("#c_msg").textContent="삭제하지 못했습니다"}};
  $("#cedit").scrollIntoView({behavior:"smooth",block:"start"});
}
/* 긴 메모 칸은 내용만큼 자동으로 늘어남 (11/12) */
function growTA(t){if(!t||!t.offsetParent)return;t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px"}
function growAll(){document.querySelectorAll("#cedit textarea").forEach(growTA)}
document.addEventListener("input",e=>{if(e.target&&e.target.tagName==="TEXTAREA")growTA(e.target)});
document.addEventListener("click",()=>requestAnimationFrame(growAll));
{const st=document.createElement("style");st.textContent="#cedit textarea{overflow-y:hidden;resize:vertical}";document.head.appendChild(st)}
/* 증빙 카드 (11/12): 받은 서류는 초록 카드 · 직원 화면은 이 가구 유형 기준으로 필수/해당 없음 표시 */
function paintDocs(t){const ty=CS.typeOf(t);document.querySelectorAll("#cedit .doc[data-doc]").forEach(d=>{const gb=d.querySelector("[data-got]");d.classList.toggle("got",!!(gb&&gb.checked));
    if(B.worker)return;const sp=d.querySelector(".dreq[data-req]");if(!sp)return;const rq=sp.dataset.req;
    if(!ty){sp.textContent=rq.slice(1).split("").join("·")+"유형 필수";sp.style.color="var(--amber)";d.classList.remove("na")}
    else if(rq.includes(ty)){sp.textContent="필수";sp.style.color="var(--warm)";d.classList.remove("na")}
    else if(d.dataset.doc==="income"&&["2","3"].includes(ty)){sp.textContent="받아 두기";sp.style.color="var(--amber)";d.classList.remove("na")}
    else{sp.textContent="";sp.style.color="var(--mute)";d.classList.add("na")}})}
{const st=document.createElement("style");st.textContent=".staff-ui #cedit .doc.got{background:var(--green-soft);border-color:var(--green)}.staff-ui #cedit .doc.got .doc-top>label:first-of-type{color:var(--green);font-weight:800}.staff-ui #cedit .doc.na{opacity:.6}.staff-ui #cedit .doc-mas{grid-column:1/-1;column-count:2;column-gap:10px}.staff-ui #cedit .doc-mas>.doc{break-inside:avoid;display:inline-block;width:100%;box-sizing:border-box}@media (max-width:760px){.staff-ui #cedit .doc-mas{column-count:1}}";document.head.appendChild(st)}
function formCase(){const c=curCase,g=id=>$("#c_"+id),docs={};
  CS.DOCS.forEach(x=>{const gb=document.querySelector(`[data-got="${x.k}"]`);if(!gb){docs[x.k]=(c.docs||{})[x.k]||{got:false,date:null};return}const got=gb.checked,dt=document.querySelector(`[data-date="${x.k}"]`);docs[x.k]={got,date:dt?(dt.value||null):(((c.docs||{})[x.k]||{}).date||null)}});
  return {visit_date:g("visit_date").value||null,visitor:g("visitor").value.trim()||null,visit_note:g("visit_note").value.trim()||null,
    v_is_head:g("v_is_head").value||null,v_head_name:g("v_head_name").value.trim()||null,v_head_birth:g("v_head_birth").value.trim()||null,v_household_size:+g("v_household_size").value||null,
    v_income:g("v_income").value||null,v_voucher_target:g("v_voucher_target").value||null,v_env:g("v_env").value||null,v_gender:g("v_gender").value||null,v_birth:g("v_birth").value||null,period:g("period").value,participation:g("participation").value,care_found:g("care_found").value||null,v_voucher:g("v_voucher").value||null,v_heating:g("v_heating").value||null,v_account:g("v_account").value||null,
    type_final:g("type_final").value||null,start_month:+g("start_month").value,docs,vcall:vcallForm(),...(window.ACCT&&ACCT.val()?{acct:ACCT.val()}:{}),
    eff_needs:[...document.querySelectorAll("[data-eff]:checked")].map(x=>x.dataset.eff),eff_note:g("eff_note").value.trim()||null,eff_etc:(g("eff_etc")&&document.querySelector('[data-eff="기타"]:checked')?g("eff_etc").value.trim():"")||null,
    members:g("members").value.trim()||null,hi_premium:g("hi_premium").value.trim()||null,cool_equip:g("cool_equip").value||null,bill_avg:g("bill_avg").value.trim()||null,bill_checked:g("bill_checked").value||null,arrears_months:g("arrears_months").value.trim()||null,cutoff:g("cutoff").value.trim()||null,equip_owner:g("equip_owner").value||null,heat_risk:g("heat_risk").value||null,guardian:g("guardian").value.trim()||null,
    stage:g("stage").value,household_code:g("household_code").value.trim()||null,committee_result:g("committee_result").value||null,committee_date:g("committee_date").value||null,committee_note:g("committee_note").value.trim()||null,kaswc_approved:g("kaswc_approved").value||null}}
function refreshCalc(){if(!curCase)return;const t=Object.assign({},curCase,formCase());paintDocs(t);requestAnimationFrame(growAll);{const vb=$("#c_vcall");if(vb)vb.hidden=!(t.vcall&&t.vcall.ok)&&!VC_ON(t.v_voucher||curRef.voucher)}const a=CS.amounts(t),ds=CS.docState(t);
  $("#c_prop").textContent=CS.proposed(t)||"정보 부족";if(!B.worker)kaswc(t);
  $("#c_amt").innerHTML=a?`<div class="amt-box">${a.list.map(([m,v])=>`<div>${m}<b>${CS.fmt(v)}</b></div>`).join("")}<div class="tot">동절기 합계<b>${CS.fmt(a.tot)}</b></div></div>`:'<p class="dv-empty">유형과 가구원 수를 넣으면 계산됩니다</p>';
  $("#c_chips").innerHTML=`<span class="stg stg-${CS.esc(t.stage)}">${CS.esc(t.stage)}</span><span class="chip2 ${ds.full?"ok":"amber"}">서류 ${ds.ok}/${ds.need}</span>${ds.stale.length?`<span class="chip2 warn">신청일 기준 3개월 넘음: ${CS.esc(ds.stale.join(", "))}</span>`:""}${ds.full&&["조사중","업로드완료"].includes(t.stage)?'<span class="chip2 info">서류가 다 모였습니다 → 단계를 ‘서류완비’로</span>':""}`}
async function saveCase(){const up=formCase();$("#c_save").disabled=true;
  try{const nc=await B.save(curCase.id,up);Object.assign(curCase,nc||up);$("#c_msg").textContent="저장되었습니다";H.saved(curCase)}
  catch(x){$("#c_msg").textContent=/session/.test(x.message)?"편집 시간이 끝났습니다. 닫기 후 비밀번호로 다시 들어와 주세요":"저장하지 못했습니다: "+x.message}
  finally{$("#c_save").disabled=false}}
/* 협회 사이트 입력용 요약: 협회 대상자 등록 화면과 같은 순서 · 항목마다 복사 */
const KEV={"1유형":"건강보험료 납부확인서 (의료급여 수급자는 수급자증명서)","2유형":"2026년 에너지이용권 결정통지서 + 확인서(별첨 2, 1600-3190 공동 청취로 2025년 소진 확인)","3유형":"결정통지서 또는 바우처 대상 증빙 + 확인서(별첨 3)","4유형":"건강보험료 납부확인서 또는 수급자증명서 + 확인서(별첨 4)"};
function kaswc(t){const box=$("#c_kaswc");if(!box)return;const r=curRef||{},e=CS.esc,d8=v=>{v=String(v||"");if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const n=v.replace(/\D/g,"");if(n.length===8)return n.slice(0,4)+"-"+n.slice(4,6)+"-"+n.slice(6);return b8(n)};
  const n=+t.v_household_size||0,sg=(t.signs||{}).consent||(t.signs||{}).consent_own,hd=t.v_is_head;
  const rows=[["대상자 성명",r.elder_name],["생년월일",d8(t.v_birth||r.birth)],["성별",t.v_gender||r.gender],["연락처",r.phone],["실거주 주소",(r.address||"").replace(" | "," ")],
    ["가구주",hd==="예"?"대상자와 동일":hd==="아니오"?"다른 가구원":""],...(hd==="아니오"?[["가구주 성명",t.v_head_name],["가구주 생년월일",d8(t.v_head_birth)]]:[]),
    ["가구원수",n>=4?"4인 이상":n?n+"인":""],["지원유형",t.type_final],["지원 기간",t.period],["사업 참여 이력",t.participation==="기존 대상자"?"기존 대상자 (연계)":t.participation?"신규 대상자":""],
    ["돌봄단 발굴",t.care_found==="예"?"예 (돌봄단 발굴)":t.care_found==="아니오"?"아니오 (기관 자체발굴)":""],["증빙 첨부",KEV[t.type_final]||""],
    ["개인정보 동의",sg?"동의 받음 · "+new Date(sg.signed_at).toLocaleDateString("ko-KR"):((t.docs||{}).consent||{}).got?"동의 받음 (종이)":""]];
  const miss=rows.filter(x=>!x[1]).length;
  box.innerHTML=(miss?`<p class="kw-miss">미확인 항목 ${miss}개 · 위 카드에서 먼저 확인해 주세요.</p>`:'<p class="kw-ok">모든 항목이 확인되었습니다.</p>')+'<div class="kw">'+rows.map(([k,v])=>`<div class="kw-r"><span>${e(k)}</span><b>${v?e(v):'<em>미확인</em>'}</b>${v&&k!=="증빙 첨부"&&k!=="개인정보 동의"?`<button type="button" class="kw-c" data-kw="${e(v)}">복사</button>`:"<i></i>"}</div>`).join("")+"</div>";
  if(!document.getElementById("kw-css")){const st=document.createElement("style");st.id="kw-css";st.textContent=`.kw{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;overflow:hidden}.kw-r{display:grid;grid-template-columns:110px 1fr 52px;gap:8px;align-items:center;padding:8px 10px;border-top:1px solid var(--line);font-size:13.5px}.kw-r:first-child{border-top:0}.kw-r span{color:var(--mute)}.kw-r b{font-weight:600;min-width:0;overflow-wrap:anywhere}.kw-r em{color:var(--warm);font-style:normal}.kw-c{font:inherit;font-size:12px;border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:4px 0;cursor:pointer;color:var(--ink)}.kw-miss{margin:0 0 8px;color:var(--warm);font-size:13px;font-weight:700}.kw-ok{margin:0 0 8px;color:var(--green);font-size:13px;font-weight:700}`;document.head.appendChild(st)}}
document.addEventListener("click",async e=>{const b=e.target.closest(".kw-c");if(!b)return;const v=b.dataset.kw;
  try{await navigator.clipboard.writeText(v)}catch(_){const ta=document.createElement("textarea");ta.value=v;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(__){}ta.remove()}
  const o=b.textContent;b.textContent="복사됨";setTimeout(()=>b.textContent=o,1200)});
/* 증빙 파일 */
async function listFiles(k){const box=$("#files-"+k);if(!box||!curCase)return;let fs=[],error=null;try{fs=await B.list(curCase.id,k)}catch(x){error=x}
  box.innerHTML=fs.map(f=>`<span class="fpill">${CS.esc(f.mimetype==="application/pdf"?"PDF":"사진")} · ${CS.esc(new Date(f.created_at).toLocaleDateString("ko-KR"))}<button type="button" data-open="${CS.esc(k+"/"+f.name)}">보기</button><button type="button" class="x" data-rm="${CS.esc(k+"/"+f.name)}">삭제</button></span>`).join("")+
    `<span class="upls"><button type="button" class="upl pri" data-scan="${k}" data-from="cam">카메라 촬영</button><button type="button" class="upl" data-scan="${k}" data-from="lib">앨범에서 선택</button><label class="upl">파일 첨부<input type="file" accept="image/*,application/pdf" multiple data-up="${k}"></label></span>`+(error?'<span class="err">목록을 못 불러왔습니다</span>':"")}
async function shrink(file){if(!/^image\//.test(file.type)||file.type==="image/heic")return file;
  const img=await createImageBitmap(file).catch(()=>null);if(!img)return file;const m=2000,s=Math.min(1,m/Math.max(img.width,img.height));
  const cv=document.createElement("canvas");cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
  return await new Promise(res=>cv.toBlob(b=>res(b||file),"image/jpeg",.85))}
document.addEventListener("change",async e=>{const inp=e.target.closest("[data-up]");if(!inp||!curCase)return;e.stopPropagation();const k=inp.dataset.up;
  for(const f of inp.files){const b=await shrink(f);const ext=b.type==="application/pdf"?"pdf":b.type==="image/png"?"png":b.type==="image/heic"?"heic":"jpg";
    try{await B.upload(curCase.id,k,b,b.type||f.type||"image/jpeg")}catch(x){$("#c_msg").textContent="올리지 못했습니다: "+x.message}}
  const cb=document.querySelector(`[data-got="${k}"]`);if(cb&&!cb.checked){cb.checked=true;refreshCalc();autoGot()}
  listFiles(k)},true);
document.addEventListener("click",async e=>{const o=e.target.closest("[data-open]"),x=e.target.closest("[data-rm]");if(!curCase||(!o&&!x))return;
  if(o){const w=window.open("","_blank");try{const u=await B.open(curCase.id,`${curCase.id}/${o.dataset.open}`);if(w)w.location=u;else location.href=u}catch(e2){if(w)w.close();$("#c_msg").textContent="열지 못했습니다"}}
  if(x){if(x.dataset.arm!=="1"){x.dataset.arm="1";x.textContent="삭제 확인";return}try{await B.remove(curCase.id,`${curCase.id}/${x.dataset.rm}`)}catch(e2){$("#c_msg").textContent="삭제하지 못했습니다";return}const k=x.dataset.rm.split("/")[0];await listFiles(k);
    /* 추천자 화면: 그 서류 사진을 다 지우면 ‘받음’을 풀고 바로 저장 (제출한 가구는 서버가 미제출로 되돌림) */
    if(!((curCase.signs||{})[k])){let left=1;try{left=(await B.list(curCase.id,k)).length}catch(e3){}const cb=document.querySelector(`[data-got="${k}"]`);
      if(!left&&cb&&cb.checked){cb.checked=false;refreshCalc();cb.dispatchEvent(new Event("change",{bubbles:true}));await saveCase();document.dispatchEvent(new CustomEvent("cs:saved",{detail:curCase}))}}}});


/* 서류 스캔(찍어서 올리기) · 가구 서류 PDF */
/* 사진을 올리면 ‘받음’ 자동 체크 후 바로 저장 (11/12) */
async function autoGot(){$("#c_msg").textContent="사진을 올려 ‘받음’으로 바꿨습니다. 저장 중…";await saveCase();if($("#c_msg").textContent==="저장되었습니다")$("#c_msg").textContent="사진을 올려 ‘받음’으로 바꾸고 저장했습니다"}
function markGot(k){const cb=document.querySelector(`[data-got="${k}"]`);if(cb&&!cb.checked){cb.checked=true;refreshCalc();autoGot()}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-scan]");if(!b||!curCase)return;const k=b.dataset.scan,doc=CS.DOCS.find(x=>x.k===k);
  if(!window.SCAN){$("#c_msg").textContent="스캔 기능을 불러오지 못했습니다. ‘파일 첨부’를 이용해 주세요";return}
  const cid=curCase.id;SCAN.open({title:doc?doc.l:"서류",from:b.dataset.from,onDone:async blobs=>{for(const bl of blobs)await B.upload(cid,k,bl,"image/jpeg");if(curCase&&curCase.id===cid){markGot(k);listFiles(k)}}})});
document.addEventListener("click",async e=>{const b=e.target.closest("#c_pdf");if(!b||!curCase||!window.SCAN)return;const msg=$("#c_pdfmsg"),cid=curCase.id,name=(document.querySelector("#cedit .dv-head h2")||{}).textContent||"가구";
  b.disabled=true;msg.textContent="모으는 중…";const items=[],skipped=[];
  try{for(const x of CS.DOCS){let fs=[];try{fs=await B.list(cid,x.k)}catch(_){}
      for(const f of fs){if(f.mimetype==="application/pdf"){skipped.push(x.l);continue}const u=await B.open(cid,`${cid}/${x.k}/${f.name}`);const r=await fetch(u);if(r.ok)items.push(await r.blob())}}
    if(!items.length){msg.textContent=skipped.length?"사진 서류가 없습니다 (PDF로 업로드한 서류는 따로 열어 주세요)":"업로드한 서류가 없습니다";return}
    const pdf=await SCAN.pdf(items),a=document.createElement("a");a.href=URL.createObjectURL(pdf);a.download=`온앤쿨_${name.trim()}_서류.pdf`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
    msg.textContent=`${items.length}장을 PDF 한 파일로 받았습니다`+(skipped.length?` · PDF로 올린 ${skipped.length}건(${[...new Set(skipped)].join(", ")})은 따로 열어 주세요`:"")}
  catch(x){msg.textContent="PDF를 만들지 못했습니다: "+(x.message||x)}finally{b.disabled=false}});

return {init(b,h){B=b;H=Object.assign(H,h||{});if(!b.worker)document.body.classList.add("staff-ui")},open:openCase,current:()=>curCase};
})();
