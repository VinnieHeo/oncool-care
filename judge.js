/* 1차 사례판정 자료: 가구별 1장 요약 + 증빙 사진 + 서명본 (관리 화면, 2026-11-12) */
window.JUDGE=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const v=x=>Array.isArray(x)?x.join(", "):(x??"");
let JB=null,RPC=null,TOK=null;
{const _i=CSE.init;CSE.init=function(b){JB=b;return _i.apply(this,arguments)}}
const b8=b=>{if(!/^\d{6}$/.test(b||""))return "";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}.${b.slice(2,4)}.${b.slice(4,6)}`};
const age=d=>{const m=/^(\d{4})\.(\d\d)\.(\d\d)/.exec(d||"");if(!m)return "";const t=new Date(),a=t.getFullYear()-m[1]-((t.getMonth()+1<+m[2]||(t.getMonth()+1==+m[2]&&t.getDate()<+m[3]))?1:0);return `만 ${a}세`};
const ymd=s=>{if(!s)return "";const d=new Date(s);return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`};
const md=s=>s?`${+s.slice(5,7)}.${+s.slice(8,10)}`:"";
const noPhone=s=>String(s||"").replace(/0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/g,"(연락처 별도)");
const SIGNED=["consent_own","consent","pledge"];
const ROWS=[["resident","주민등록등본"],["income","소득 증빙"],["bank","본인 명의 통장"],["consent_own","복지관 동의서"],["consent","협회 동의서(별첨 5)"],["pledge","용도 약정서"],["voucher","바우처 확인"],["confirm","확인서(별첨 2~4)"],["etc","현장 사진"]];
const CSS=`@page{size:A4;margin:12mm 13mm}*{box-sizing:border-box}body{font-family:"Pretendard Variable","Malgun Gothic",sans-serif;color:#111;margin:0;font-size:9.6pt;line-height:1.45}
.jp{width:100%;max-width:184mm;margin:0 auto}.jp+.jp,.att,.sgp{break-before:page}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:5px}.top h1{font-size:15pt;margin:0}.top small{font-size:8.5pt;color:#444}.code{font-size:10pt;font-weight:700;border:1.5px solid #111;padding:3px 8px;white-space:nowrap}
h2{font-size:10.2pt;margin:10px 0 4px;padding-left:6px;border-left:3px solid #111}
.jp table{border-collapse:collapse;width:100%}.jp th,.jp td{border:1px solid #888;padding:4px 6px;vertical-align:top}.jp th{background:#eee;font-weight:700;text-align:left;width:17%;white-space:nowrap}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.txt{border:1px solid #888;padding:5px 7px;min-height:28px;white-space:pre-wrap}.pre{white-space:pre-wrap}
.ck{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #888}.ck div{padding:4px 6px;border-right:1px solid #ccc;border-bottom:1px solid #ccc}.ck b{display:inline-block;width:14px}.ok{color:#127a4c}.no{color:#c0392b}.ck small{color:#555}
.amt td,.amt th{text-align:center!important;width:auto!important}.dec th{width:14%!important}
.foot{margin-top:8px;font-size:8pt;color:#555;border-top:1px dashed #999;padding-top:4px;display:flex;justify-content:space-between}
.tag{display:inline-block;font-size:8pt;border:1px solid #999;border-radius:3px;padding:0 4px;margin-left:4px;font-weight:400}
.att{max-width:184mm;margin:0 auto;text-align:center}.att p{margin:0 0 4mm;font-size:9pt;text-align:left;border-bottom:1px solid #999;padding-bottom:2px}.att img{max-width:100%;max-height:255mm;object-fit:contain}
.pdfnote{max-width:184mm;margin:4mm auto 0;font-size:9pt;color:#a33}
.bar{position:sticky;top:0;background:#fffbe8;border-bottom:1px solid #e6d58a;padding:8px 12px;font-size:13px;display:flex;gap:10px;align-items:center;justify-content:space-between}.bar button{font:inherit;padding:6px 14px;border-radius:8px;border:1px solid #333;background:#111;color:#fff}
@media print{.bar{display:none}}`;
function scopeSign(css){return css.replace(/@page\{[^}]*\}/,"").replace(/(^|\})\s*([^{}]+)\{/g,(m,a,sel)=>a+sel.split(",").map(s=>{s=s.trim();return s==="body"?".sgp":".sgp "+s}).join(",")+"{")}

function summary(c,r){const t=CS.typeOf(c),a=CS.amounts(c),d=c.docs||{},sg=c.signs||{},bir=b8(r.birth);
  const p=CS.proposed(c)||"",inc=c.v_income||r.income||"",vou=c.v_voucher||r.voucher||"";
  const ck=ROWS.map(([k,l])=>{const x=d[k]||{},s=sg[k];return `<div><b class="${x.got?"ok":"no"}">${x.got?"✓":"–"}</b>${esc(l)} <small>${s?"전자서명 "+md((s.signed_at||"").slice(0,10)):x.date?md(x.date):""}</small></div>`}).join("");
  return `<div class="jp"><div class="top"><div><small>온(溫) 앤 쿨(cool) 케어 · 1차 사례판정 자료 · 출력 ${ymd(new Date())}</small><h1>사례판정 자료</h1></div><div class="code">${c.household_code?"가구코드 "+esc(c.household_code)+" · ":""}접수 ${esc(r.receipt_no)}번</div></div>
  <h2>1. 대상자 · 세대</h2><table><tr><th>성명</th><td>${esc(r.elder_name)} (${esc(c.v_gender||r.gender||"")}${bir?", "+bir+" · "+age(bir):""})</td><th>거주동</th><td>${esc(r.dong)}</td></tr>
  <tr><th>주소</th><td colspan="3">${esc((r.address||"").replace(" | ",", "))}</td></tr>
  <tr><th>세대</th><td>${c.v_is_head==="예"||r.is_head==="예"?"세대주 본인":"세대주 "+esc(c.v_head_name||r.head_name||"")} · 등본 가구원 ${esc(c.v_household_size||r.household_size||"?")}명</td><th>주거</th><td>${esc([r.housing_tenure,v(r.housing_risk)].filter(Boolean).join(" · "))}</td></tr>
  <tr><th>가구원</th><td colspan="3">${esc(c.members||"")}${r.live_with?`<br><small>실제 함께 사는 분: ${esc(r.live_with)}</small>`:""}</td></tr></table>
  <h2>2. 추천 내용</h2><table><tr><th>추천</th><td>${esc(r.worker_org||"")} ${esc(r.worker_name||"")} · ${ymd(r.created_at)}${r.urgency?" · 긴급도 <b>"+esc(r.urgency)+"</b>":""}</td></tr>
  <tr><th>추천 사유</th><td class="pre">${esc(r.reason||"")}</td></tr><tr><th>건강·생활 위험</th><td class="pre">${esc(r.risk_note||"")}</td></tr>
  ${r.other_support?`<tr><th>다른 지원</th><td>${esc(r.other_support)}</td></tr>`:""}</table>
  <h2>3. 가정방문 확인 <span class="tag">${c.visit_date?ymd(c.visit_date):"방문일 없음"}${c.visitor?" · 방문 "+esc(c.visitor):""}</span></h2><div class="txt">${esc(c.visit_note||"")}</div>
  <table style="margin-top:4px"><tr><th>월평균 냉·난방비</th><td>${esc(c.bill_avg||"")}${c.bill_checked?" (고지서 "+esc(c.bill_checked)+")":""}</td><th>체납</th><td>${esc(c.arrears_months||v(r.arrears)||"")}</td></tr>
  <tr><th>단전·단가스</th><td>${esc(c.cutoff||"")}</td><th>난방</th><td>${esc(c.v_heating||r.heating||"")}</td></tr>
  <tr><th>냉방 설비</th><td>${esc(c.cool_equip||"")}</td><th>설비 소유</th><td>${esc(c.equip_owner||"")}</td></tr>
  <tr><th>한랭·온열 취약</th><td>${esc(c.heat_risk||"")}</td><th>안부 보호자</th><td>${esc(noPhone(c.guardian))}</td></tr></table>
  <h2>4. 선정 기준 확인</h2><div class="g2"><table><tr><th>소득</th><td>${esc(inc)}${v(r.recipient_kinds)?" ("+esc(v(r.recipient_kinds))+")":""}${c.hi_premium?"<br><small>건보료 "+esc(c.hi_premium)+"</small>":""}</td></tr>
  <tr><th>바우처</th><td>${esc(vou)}${c.v_voucher_target?" · 대상 세대원 "+esc(c.v_voucher_target):""}${c.v_env&&c.v_env!=="해당 없음"?"<br><small>"+esc(c.v_env)+"</small>":""}</td></tr>
  <tr><th>제안 유형</th><td><b>${t?t+"유형":"판단 필요"}</b>${p?"<br><small>"+esc(p)+"</small>":""}</td></tr></table>
  ${a?`<table class="amt"><tr>${a.list.map(([m])=>`<th>${esc(m)}</th>`).join("")}<th>합계</th></tr><tr>${a.list.map(([,x])=>`<td>${CS.fmt(x)}</td>`).join("")}<td><b>${CS.fmt(a.tot)}</b></td></tr><tr><td colspan="${a.list.length+1}" style="text-align:left!important;font-size:8.5pt">${t}유형 · ${esc(c.v_household_size)}인 · ${esc(c.start_month||11)}월 시작 (단위: 원)</td></tr></table>`:`<div class="txt">유형과 가구원 수가 정해지면 지원 금액이 나와요</div>`}</div>
  <table style="margin-top:4px"><tr><th>효율 개선 필요</th><td>${esc(v(c.eff_needs))}${c.eff_note?" · "+esc(c.eff_note):""}</td></tr></table>
  <h2>5. 서류 · 서명</h2><div class="ck">${ck}</div>
  <h2>6. 판정</h2><table class="dec"><tr><th>결과</th><td>□ 선정 &nbsp; □ 보류 &nbsp; □ 탈락</td><th>유형</th><td>□1 □2 □3 □4 유형</td></tr><tr><th>의견</th><td colspan="3" style="height:34px"></td></tr></table>
  <div class="foot"><span class="attn">첨부는 뒤쪽에 이어서 출력</span><span>위원회 종료 후 회수 · 파기</span></div></div>`}

async function attachments(c,r,w,onStep){const out=[],pdfs=[];
  for(const x of CS.DOCS){if(SIGNED.includes(x.k)&&(c.signs||{})[x.k])continue;let fs=[];try{fs=await JB.list(c.id,x.k)}catch(_){}
    for(const f of fs){if(f.mimetype==="application/pdf"){pdfs.push(x.l);continue}
      try{const u=await JB.open(c.id,`${c.id}/${x.k}/${f.name}`);const bl=await (await fetch(u)).blob();const du=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(bl)});
        out.push(`<div class="att"><p>${esc(r.elder_name)} · ${esc(x.l)}</p><img src="${du}"></div>`);onStep&&onStep()}catch(_){}}}
  const sp=[];for(const k of SIGNED){if(!(c.signs||{})[k])continue;try{const rec=await RPC("oncool_ed_sign",{p_token:TOK(),p_case:c.id,p_form:k});
      const h=SIGN.printHTML(k,rec,{name:r.elder_name,birth:c.v_birth||b8(r.birth).replace(/\./g,"-"),addr:(r.address||"").replace(" | ",", "),phone:r.phone||"",size:c.v_household_size||""});
      sp.push(h.slice(h.indexOf('<div class="pr-page">'),h.lastIndexOf("</body>")).replace('<div class="pr-page">','<div class="sgp"><div class="pr-page">')+"</div>")}catch(_){}}
  return {html:out.join("")+sp.join("")+(pdfs.length?`<p class="pdfnote">※ PDF로 올린 서류는 따로 열어서 출력해 주세요: ${esc([...new Set(pdfs)].join(", "))}</p>`:""),n:out.length,s:sp.length,pdf:pdfs.length}}

async function build(list,w){const head=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>사례판정 자료</title><style>${CSS}${scopeSign(SIGN.PCSS||"")}</style></head><body>`;
  w.document.open();w.document.write(head+`<div class="bar"><span id="st">자료를 모으는 중… (0/${list.length})</span></div>`);let body="",i=0;
  for(const [c,r] of list){i++;const st=w.document.getElementById("st");if(st)st.textContent=`자료를 모으는 중… (${i}/${list.length}) ${r.elder_name}`;
    const at=await attachments(c,r);body+=summary(c,r).replace('<span class="attn">첨부는 뒤쪽에 이어서 출력</span>',`<span>첨부: 증빙 사진 ${at.n}쪽 · 서명본 ${at.s}쪽${at.pdf?" · PDF "+at.pdf+"건 별도":""}</span>`)+at.html}
  w.document.open();w.document.write(head+`<div class="bar"><span>${list.length}가구 · 준비됐어요</span><button onclick="print()">인쇄</button></div>`+body+"</body></html>");w.document.close();
  setTimeout(()=>{try{w.focus();w.print()}catch(e){}},800)}

function hook(rpcS,tok,getCases,getRows){RPC=rpcS;TOK=tok;
  const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{if(tok()){const p=document.getElementById("c_print");if(p&&!document.getElementById("c_judge")){const b=document.createElement("button");b.type="button";b.className="sbtn";b.id="c_judge";b.textContent="판정 자료 출력";p.after(b);
    b.onclick=()=>{const w=window.open("","_blank");if(!w){alert("팝업이 막혀 있어요. 팝업을 허용해 주세요.");return}const cur=CSE.current()||c;build([[cur,r||{}]],w)}}}}catch(e){console.error(e)}return x};
  const csv=document.getElementById("ccsv");if(csv&&!document.getElementById("cjudge")){const b=document.createElement("button");b.type="button";b.className="sbtn";b.id="cjudge";b.textContent="판정 자료 일괄 출력";csv.before(b);
    b.onclick=()=>{if(!tok()){alert("편집 비밀번호를 넣은 뒤에 쓸 수 있어요.");return}const f=(document.getElementById("cfs")||{}).value||"";
      const R={};getRows().forEach(x=>R[x.id]=x);const list=getCases().filter(c=>f?c.stage===f:["서류완비","위원회상정"].includes(c.stage)).sort((a,b)=>(a.household_code||"~").localeCompare(b.household_code||"~")||((R[a.referral_id]||{}).receipt_no-(R[b.referral_id]||{}).receipt_no)).map(c=>[c,R[c.referral_id]||{}]);
      if(!list.length){alert(f?`‘${f}’ 단계 가구가 없어요.`:"‘서류완비’·‘위원회상정’ 단계 가구가 없어요. 위에서 단계를 골라 주세요.");return}
      const w=window.open("","_blank");if(!w){alert("팝업이 막혀 있어요. 팝업을 허용해 주세요.");return}build(list,w)}}}
return {hook,summary}})();
