/* 추천 상세 카드 (admin/staff 공용) */
window.DV=(function(){
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const arr=v=>Array.isArray(v)?v.join(", "):v;
  const has=v=>Array.isArray(v)?v.length>0:(v!==null&&v!==undefined&&String(v).trim()!=="");
  const phone=p=>{const d=String(p||"").replace(/[^0-9]/g,"");return d.length===11?d.replace(/(\d{3})(\d{4})(\d{4})/,"$1-$2-$3"):d.length===10?d.replace(/(\d{3})(\d{3})(\d{4})/,"$1-$2-$3"):p};
  const typeOf=r=>r.voucher==="안 받음"?"1":r.voucher==="받았는데 다 씀"?"2":r.voucher==="받는 중"?"3":"?";
  const is4=r=>["기름(등유) 보일러","LPG","연탄"].includes(r.heating);
  function age(b){if(!/^\d{6}$/.test(b||""))return"";const n=new Date();let y=+b.slice(0,2);y+=y>n.getFullYear()%100?1900:2000;const m=+b.slice(2,4),d=+b.slice(4,6);let a=n.getFullYear()-y;if(n.getMonth()+1<m||(n.getMonth()+1===m&&n.getDate()<d))a--;return a>0&&a<120?` (만 ${a}세)`:""}
  function row(l,v){return has(v)?`<div class="dv-row"><span>${l}</span><span>${esc(arr(v))}</span></div>`:""}
  function card(t,rows){const b=rows.join("");return b?`<div class="dv-card"><h3>${t}</h3>${b}</div>`:""}
  function chips(r){const c=[];const t=typeOf(r);
    c.push(t==="?"?'<span class="chip2">유형 미확인</span>':`<span class="chip2 info">${t}유형 예상</span>`);
    if(is4(r))c.push('<span class="chip2 warn">4유형 후보</span>');
    if(r.urgency)c.push(`<span class="chip2 ${r.urgency==="상"?"warn":r.urgency==="중"?"amber":""}">긴급 ${esc(r.urgency)}</span>`);
    if(["없음","압류 우려"].includes(r.account))c.push(`<span class="chip2 warn">통장 ${esc(r.account)}</span>`);
    if(r.heater_broken==="예")c.push('<span class="chip2 amber">난방기구 고장</span>');
    if((r.arrears||[]).some(x=>x!=="없음"))c.push(`<span class="chip2 warn">체납: ${esc(r.arrears.filter(x=>x!=="없음").join("·"))}</span>`);
    if(r.status)c.push(`<span class="chip2 ${r.status==="선정"?"ok":r.status==="제외"||r.status==="보류"?"warn":""}">${esc(r.status)}</span>`);
    return `<div class="chips">${c.join("")}</div>`}
  function html(r,opts){opts=opts||{};
    const when=r.created_at?new Date(r.created_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";
    const head=`<div class="dv-head"><h2>${esc(r.elder_name)}</h2>${chips(r)}</div>
      <p class="dv-sub">접수 ${esc(r.receipt_no)}번 · ${esc(when)} · 추천 ${esc(r.worker_org||"생활지원사")} · ${esc(r.worker_name||"")}</p>`;
    const cards=[
      card("대상자",[row("생년월일",has(r.birth)?r.birth+age(r.birth):""),row("성별",r.gender),row("연락처",has(r.phone)?phone(r.phone):""),row("거주동",r.dong),row("주소",(r.address||"").replace(" | ",", "))]),
      card("세대",[row("세대주 본인",r.is_head),row("세대주",[r.head_name,r.head_birth].filter(Boolean).join(" · ")),row("가구원 수",has(r.household_size)?r.household_size+"명":""),row("실제 동거",r.live_with)]),
      card("소득 · 에너지바우처",[row("소득 구분",r.income),row("수급 종류",r.recipient_kinds),row("바우처",r.voucher)]),
      card("난방 · 통장",[row("난방 방식",r.heating),row("본인 명의 통장",r.account),row("고지서 사진",r.bill_photo)]),
      card("주거",[row("집",r.housing_tenure),row("주거 위험",r.housing_risk),row("난방기구 고장",r.heater_broken),row("요금 체납",r.arrears)]),
      card("다른 지원",[row("지원 내용",r.other_support)])
    ].join("");
    const note=[has(r.reason)?`<div class="dv-card" style="grid-column:1/-1"><h3>추천 사유</h3><div class="dv-quote">${esc(r.reason)}</div>${has(r.risk_note)?`<h3 style="margin-top:10px">건강·생활 위험</h3><div class="dv-quote" style="border-color:var(--warm)">${esc(r.risk_note)}</div>`:""}</div>`:(has(r.risk_note)?`<div class="dv-card" style="grid-column:1/-1"><h3>건강·생활 위험</h3><div class="dv-quote" style="border-color:var(--warm)">${esc(r.risk_note)}</div></div>`:"")].join("");
    const staff=opts.staff?card("복지관 처리",[row("상태",r.status),row("가구코드",r.household_code),row("담당자 메모",r.staff_memo)]):"";
    return head+`<div class="dv-grid">${note}${cards}${staff}</div>`;
  }
  return {html,typeOf,is4};
})();
