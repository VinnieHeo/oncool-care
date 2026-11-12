/* 선정 이후 기록 (2026-11-12) · 1단계: 월별 냉·난방비 지급 명단 · 협회 실적 입력 항목 · 수령증(협회 별첨 1 원본 양식) · 편집 비밀번호 전용 */
window.PAY=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const ORG="안양시만안종합사회복지관";
const TABS=[["2026-11","11월","11/23","2026-11-23"],["2026-12","12월","12/10","2026-12-10"],["2027-01","1월","1/10","2027-01-10"],["2027-02","2월","2/10","2027-02-10"]];
const ENG=["전기","도시가스","등유·연탄·LPG","기타"],MTH=["대상자 명의 계좌이체","기타"];
const engOf=h=>h==="도시가스"?"도시가스":h==="전기"?"전기":["기름(등유) 보일러","LPG","연탄"].includes(h)?"등유·연탄·LPG":"";
const b8=b=>{if(!/^\d{6}$/.test(b||""))return "";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
const dot=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(s||"");return m?`${m[1]}. ${m[2]}. ${m[3]}.`:""};
const won=n=>n||n===0?Number(n).toLocaleString("ko-KR")+"원":"";
let R=null,T=()=>"",GC=()=>[],GR=()=>[],ME=()=>"",PAYS=[],tab=0,all=false,sel=null,msg="";
const typeNo=c=>CS.typeOf(c)||"";
function rows(){const M={};GR().forEach(x=>M[x.id]=x);
  return GC().filter(c=>all?["선정","위원회상정","서류완비"].includes(c.stage):c.stage==="선정").map(c=>[c,M[c.referral_id]||{}])
    .sort((a,b)=>(a[0].household_code||"~").localeCompare(b[0].household_code||"~")||(a[1].receipt_no-b[1].receipt_no))}
function due(c){const a=CS.amounts(c);if(!a)return null;const x=a.list.find(([m])=>m===TABS[tab][2]);return x?x[1]:0}
const rec=c=>PAYS.find(p=>p.case_id===c.id&&p.month===TABS[tab][0]&&p.season==="난방");
let ACS={};const ac=c=>ACS[c.id]||null,acM=c=>{const a=ac(c);return a&&a.no?`${esc(a.bank||"")} ${esc(window.ACCT?ACCT.mask(a.no):"")}${a.st==="읽기만 됨"?' <span class="pw">확인 필요</span>':""}`:'<span class="pn">없음</span>'};
async function load(){try{PAYS=await R("oncool_ed_payments",{p_token:T()})||[];ACS=await R("oncool_ed_accts",{p_token:T()})||{}}catch(x){msg="불러오지 못했습니다: "+x.message}}
function defaults(c){const t=typeNo(c);return {case_id:c.id,season:"난방",month:TABS[tab][0],amount:due(c),paid_on:TABS[tab][3],method:t==="4"?"기타":"대상자 명의 계좌이체",receipt:"미수취",energy:engOf(c.v_heating)||"",usage:"",note:`${TABS[tab][1]}분 난방비 지급`,kaswc:false}}
function listHTML(L){const S={n:0,sum:0,paid:0,norc:0,nokw:0};
  const tr=L.map(([c,r])=>{const p=rec(c),a=due(c),t=typeNo(c);if(a){S.n++;S.sum+=a}if(p&&p.paid_on)S.paid++;if(p&&p.receipt!=="수취")S.norc++;if(p&&!p.kaswc_at)S.nokw++;
    return `<tr class="${sel===c.id?"on":""}" data-pc="${c.id}"><td>${esc(c.household_code||"")}</td><td><b>${esc(r.elder_name)}</b></td><td>${t?t+"유형":"유형 미정"} · ${esc(c.v_household_size||"?")}인</td><td>${a===null?'<span class="pw">유형·인원 필요</span>':a===0?'<span class="pm">대상 월 아님</span>':won(p&&p.amount!=null?p.amount:a)}</td>
    <td>${p&&p.paid_on?esc(p.paid_on.slice(5).replace("-","/")):""}</td><td>${p?esc(p.method||""):""}</td><td>${t==="4"?'<span class="pm">필요 없음</span>':acM(c)}</td><td>${p?(p.receipt==="수취"?'<span class="pk">수취</span>':'<span class="pn">미수취</span>'):""}</td><td>${p?esc(p.energy||""):""}</td><td>${p?esc(p.usage||""):""}</td><td>${p?(p.kaswc_at?'<span class="pk">입력 완료</span>':'<span class="pw">입력 전</span>'):""}</td></tr>`}).join("");
  return `<div class="py-sum"><div>대상 가구<b>${L.length}</b></div><div>이번 달 지급 예정<b>${won(S.sum)}</b></div><div>지급 기록<b class="pk">${S.paid}</b></div><div>수령증 미수취<b class="pn">${S.norc}</b></div><div>협회 입력 전<b class="pw">${S.nokw}</b></div></div>
  ${L.length?`<div class="py-tw"><table class="py-t"><tr><th>가구코드</th><th>대상자</th><th>유형·인원</th><th>이번 달 금액</th><th>지급일</th><th>지급 방식</th><th>계좌</th><th>수령증</th><th>주 사용처</th><th>사용량</th><th>협회 입력</th></tr>${tr}</table></div>`:`<p class="py-e">${all?"표시할 가구가 없습니다.":"아직 ‘선정’ 단계인 가구가 없습니다. 사례판정 후 단계를 ‘선정’으로 바꾸면 여기에 나타납니다."}</p>`}`}
function formHTML(c,r){const p=Object.assign(defaults(c),rec(c)||{});const rad=(n,L,v)=>L.map(x=>`<label><input type="radio" name="py_${n}" value="${esc(x)}"${x===v?" checked":""}> ${esc(x)}</label>`).join("");
  return `<div class="card py-f"><div class="py-fh"><b>${esc(c.household_code||"")} ${esc(r.elder_name)} · ${TABS[tab][1]} 기록</b><button type="button" class="sbtn" data-pclose>닫기</button></div>
  <div class="py-g"><span>지원 구분</span><div>난방</div>
  <span>지원 대상 월</span><div>${TABS[tab][0].replace("-","년 ")}월</div>
  <span>지원 금액</span><div><input id="py_amount" inputmode="numeric" value="${esc(p.amount??"")}"> 원 <small>계산 금액 ${won(due(c))}</small></div>
  <span>지급 일자</span><div><input type="date" id="py_paid_on" value="${esc(p.paid_on||"")}"></div>
  <span>지급 방식</span><div class="py-r">${rad("method",MTH,p.method)}</div>
  <span>수령증 수취</span><div class="py-r">${rad("receipt",["수취","미수취"],p.receipt)}</div>
  <span>주 사용처</span><div class="py-r">${rad("energy",ENG,p.energy)}</div>
  <span>에너지 사용량</span><div><input id="py_usage" maxlength="40" placeholder="예) 310 kWh, 48 m³" value="${esc(p.usage||"")}"></div>
  <span>지원 상세 내용</span><div><input id="py_note" maxlength="300" value="${esc(p.note||"")}"></div>
  <span>수행 담당자</span><div>${esc(ME())}</div></div>
  <label class="py-kw"><input type="checkbox" id="py_kwc"${p.kaswc_at?" checked":""}> 협회 사이트에 입력 완료${p.kaswc_at?` <small>(${esc(String(p.kaswc_at).slice(0,10))})</small>`:""}</label>
  <div class="py-a"><button type="button" class="sbtn pri" data-psave>저장</button><button type="button" class="sbtn" data-prc>수령증 출력</button><button type="button" class="sbtn" data-pcopy>협회 입력용 복사</button><span class="msg">${esc(msg)}</span></div></div>`}
function formVal(c){const v=n=>(document.querySelector(`input[name="py_${n}"]:checked`)||{}).value||"";
  return {case_id:c.id,season:"난방",month:TABS[tab][0],amount:String($("#py_amount").value).replace(/[^0-9]/g,""),paid_on:$("#py_paid_on").value,method:v("method"),receipt:v("receipt"),energy:v("energy"),usage:$("#py_usage").value.trim(),note:$("#py_note").value.trim(),kaswc:$("#py_kwc").checked}}
function kwText(c,p){return [["지원 구분","난방"],["지원 대상 월",TABS[tab][0].replace("-","년 ")+"월"],["지원 금액",String(p.amount||"")],["지급 일자",p.paid_on||""],["지급 방식",p.method||""],["수령증 수취 여부",p.receipt||""],["에너지 비용 주 사용처",p.energy||""],["에너지 사용량",p.usage||""],["지원 상세 내용",p.note||""],["수행 담당자",ME()]].map(([a,b])=>a+"\t"+b).join("\n")}
function paint(){const v=$("#vw-pay");if(!v)return;const L=rows(),cur=L.find(([c])=>c.id===sel);
  v.innerHTML=`<div class="py-top"><div class="py-tabs">${TABS.map((t,i)=>`<button type="button" data-ptab="${i}" class="${i===tab?"on":""}">${t[1]} (${t[2]} 지급)</button>`).join("")}</div>
   <label class="py-all"><input type="checkbox" id="py_all"${all?" checked":""}> 선정 전 가구도 미리 보기</label></div>
   ${listHTML(L)}
   <div class="py-a"><button type="button" class="sbtn" data-pbulk>이번 달 지급 기록 일괄 만들기</button><button type="button" class="sbtn" data-pcsv>지급 명단 엑셀 받기</button><button type="button" class="sbtn" data-prcall>수령증 일괄 출력</button><span class="msg">${cur?"":esc(msg)}</span></div>
   <p class="hint">금액은 유형·가구원 수·지원 시작 월로 자동 계산합니다(천 원 단위 올림, 마지막 달 잔액).<br>가구를 누르면 협회 실적 입력과 같은 순서의 기록 칸이 열립니다.</p>
   ${cur?formHTML(cur[0],cur[1]):""}`}
function csv(L){const h=["가구코드","성명","생년월일","유형","가구원수","지원 대상 월","지원 금액","지급 일자","지급 방식","은행","계좌번호","예금주","계좌 확인","수령증","주 사용처","에너지 사용량"];
  const q=s=>`"${String(s??"").replace(/"/g,'""')}"`;
  const body=L.filter(([c])=>due(c)).map(([c,r])=>{const p=rec(c)||{};return [c.household_code,r.elder_name,c.v_birth||b8(r.birth),typeNo(c)?typeNo(c)+"유형":"",c.v_household_size,TABS[tab][0],p.amount??due(c),p.paid_on||TABS[tab][3],p.method||"",(ac(c)||{}).bank||"",(ac(c)||{}).no?`="${ac(c).no}"`:"",(ac(c)||{}).holder||"",(ac(c)||{}).st||"",p.receipt||"",p.energy||"",p.usage||""].map(q).join(",")});
  const blob=new Blob(["﻿"+[h.map(q).join(",")].concat(body).join("\r\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`온앤쿨_지급명단_${TABS[tab][0]}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
/* 수령증: 협회 별첨 1 원본(별첨문서_261106.hwp) 문구·순서·표 그대로, 빈칸만 채움 */
const RCSS=`@font-face{font-family:"AnxB";src:local("휴먼명조"),local("HumanMyeongjo"),local("함초롬바탕"),local("HCR Batang"),local("HCRBatang"),local("바탕"),local("Batang")}
@font-face{font-family:"AnxT";src:local("HY헤드라인M"),local("HYHeadLine-Medium"),local("HYHeadLine M"),local("Malgun Gothic Bold"),local("MalgunGothicBold"),local("맑은 고딕 Bold")}
@page{size:A4;margin:20mm 21mm 15mm}*{box-sizing:border-box}body{margin:0;color:#000;font-family:"AnxB","Nanum Myeongjo",serif;font-size:15pt;line-height:1.6}
.ax{width:168mm;margin:0 auto}.ax+.ax{break-before:page}.ax p{margin:0;min-height:1.6em}.tag{font-size:13pt}
.ttl{width:100%;border-collapse:collapse}.ttl td{padding:0;border:0}.bar1{height:2.3mm;background:linear-gradient(90deg,#ff843a,#ffceb0)}.bar2{height:2.8mm;background:linear-gradient(90deg,#ff843a,#ffceb0)}
.ttl .t{height:14.3mm;text-align:center;font-family:"AnxT","Malgun Gothic",sans-serif;font-size:20pt;line-height:1.3;padding:1.5mm 0}
.sec{font-weight:700}.c{text-align:center}
.tb{width:100%;border-collapse:collapse;table-layout:fixed;border:.5mm double #000}.tb td{width:50%;height:13mm;border:.12mm solid #000;text-align:center;vertical-align:middle;padding:0 2mm}.tb .h{font-weight:700}
.ck{position:relative;display:inline-block}.ck:after{content:"";position:absolute;left:-1.6mm;right:-1.6mm;top:-1mm;bottom:-1mm;border:.45mm solid #000;border-radius:50%}
.bar{position:sticky;top:0;background:#fffbe8;border-bottom:1px solid #e6d58a;padding:8px 12px;font:13px sans-serif;display:flex;gap:10px;align-items:center;justify-content:space-between}.bar button{font:inherit;padding:6px 14px;border-radius:8px;border:1px solid #333;background:#111;color:#fff}
@media print{.bar{display:none}}`;
function rcPage(c,r){const p=rec(c)||{},amt=p.amount??due(c),birth=dot(c.v_birth||b8(r.birth));
  return `<div class="ax"><p class="tag">[별첨 1]</p><p class="tag"></p>
  <table class="ttl"><tr><td class="bar1"></td></tr><tr><td class="t">온(溫) 앤 쿨(cool) 사업<br>냉·난방비 수령증</td></tr><tr><td class="bar2"></td></tr></table>
  <p></p><p>&nbsp;&nbsp;본인은 ‘온(溫) 앤 쿨(cool)’ 사업 참여 지원가구의 가구원으로서 기관으로부터 아래와 같이 본 사업 참여에 따른 냉·난방비 지원을 받았음을 확인합니다.</p><p></p>
  <p class="sec">□ 수 령 인</p><p></p>
  <table class="tb"><tr><td class="h">성&nbsp;&nbsp;&nbsp;&nbsp;명</td><td>${esc(r.elder_name)}</td></tr><tr><td class="h">생년월일</td><td>${birth||"0000. 00. 00."}</td></tr></table>
  <p></p><p class="sec">□ 지원내역</p><p></p>
  <table class="tb"><tr><td class="h">지원구분</td><td>냉방비 / <span class="ck">난방비</span></td></tr><tr><td class="h">수 령 일</td><td>${dot(p.paid_on||TABS[tab][3])}</td></tr><tr><td class="h">지원금액</td><td>${amt?Number(amt).toLocaleString("ko-KR")+"원":"000,000원"}</td></tr><tr><td class="h">지원기관</td><td>${ORG}</td></tr></table>
  <p></p><p></p><table class="tb"><tr><td class="h">서&nbsp;&nbsp;&nbsp;&nbsp;명</td><td></td></tr></table><p></p><p class="c">${ORG}</p></div>`}
function printRc(L){L=L.filter(([c])=>due(c));if(!L.length){alert("이번 달 지급 대상 가구가 없습니다.");return}const w=window.open("","_blank");if(!w){alert("팝업이 차단되어 있습니다. 팝업을 허용해 주세요.");return}
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>수령증 ${TABS[tab][1]}</title><style>${RCSS}</style></head><body><div class="bar"><span>${L.length}가구 · ${TABS[tab][1]} 난방비 수령증</span><button onclick="print()">인쇄</button></div>${L.map(([c,r])=>rcPage(c,r)).join("")}</body></html>`);w.document.close()}
async function save(p){const n=await R("oncool_ed_payment_save",{p_token:T(),p});const i=PAYS.findIndex(x=>x.id===n.id);if(i<0)PAYS.push(n);else PAYS[i]=n;return n}
function show(on){const v=$("#vw-pay"),b=$("#vt-pay");if(!v)return;v.hidden=!on;b.setAttribute("aria-selected",on);
  if(on){["#vt-ref","#vt-case","#vt-q"].forEach(s=>{const x=$(s);if(x)x.setAttribute("aria-selected",false)});["#vw-ref","#vw-case","#vw-q"].forEach(s=>{const x=$(s);if(x)x.hidden=true});msg="";paint();load().then(paint)}}
function setup(){if($("#vt-pay"))return;const tabs=document.querySelector(".vtabs");if(!tabs)return;
  const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.id="vt-pay";b.setAttribute("aria-selected","false");b.textContent="선정 이후 기록";tabs.appendChild(b);
  const v=document.createElement("div");v.id="vw-pay";v.hidden=true;$("#vw-ref").after(v);
  b.addEventListener("click",()=>{if(!T()){alert("편집 비밀번호로 들어와야 사용할 수 있습니다.");return}show(true)});
  tabs.addEventListener("click",e=>{const t=e.target.closest("[role=tab]");if(t&&t.id!=="vt-pay")show(false)},true);
  v.addEventListener("change",e=>{if(e.target.id==="py_all"){all=e.target.checked;sel=null;paint()}});
  v.addEventListener("click",async e=>{const L=rows();
    const tb=e.target.closest("[data-ptab]");if(tb){tab=+tb.dataset.ptab;msg="";paint();return}
    const r=e.target.closest("[data-pc]");if(r){sel=r.dataset.pc;msg="";paint();const f=$(".py-f");if(f)f.scrollIntoView({block:"nearest"});return}
    if(e.target.closest("[data-pclose]")){sel=null;msg="";paint();return}
    const cur=L.find(([c])=>c.id===sel);
    if(e.target.closest("[data-psave]")&&cur){e.target.disabled=true;try{await save(formVal(cur[0]));msg="저장되었습니다."}catch(x){msg="저장하지 못했습니다: "+x.message}paint();return}
    if(e.target.closest("[data-prc]")&&cur){printRc([cur]);return}
    if(e.target.closest("[data-pcopy]")&&cur){const t=kwText(cur[0],formVal(cur[0]));try{await navigator.clipboard.writeText(t);msg="복사했습니다."}catch(_){msg="복사하지 못했습니다."}const m=e.target.parentNode.querySelector(".msg");if(m)m.textContent=msg;return}
    if(e.target.closest("[data-pcsv]")){csv(L);return}
    if(e.target.closest("[data-prcall]")){printRc(L);return}
    if(e.target.closest("[data-pbulk]")){const todo=L.filter(([c])=>due(c)&&!rec(c));if(!todo.length){msg="새로 만들 기록이 없습니다.";paint();return}
      e.target.disabled=true;let ok=0;for(const [c] of todo){try{await save(defaults(c));ok++}catch(_){}}msg=`${ok}가구의 ${TABS[tab][1]} 지급 기록을 만들었습니다. 지급일·수령증을 확인해 주세요.`;paint()}});
  const st=document.createElement("style");st.textContent=`
#vw-pay{display:flex;flex-direction:column;gap:10px}.py-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.py-tabs{display:flex;gap:6px;flex-wrap:wrap}.py-tabs button{font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:6px 12px;background:var(--surface);border:1px solid var(--line);color:var(--mute);cursor:pointer}.py-tabs button.on{background:var(--pri);color:#fff;border-color:var(--pri)}
.py-all{display:flex;flex-direction:row!important;gap:6px;align-items:center;font-size:13px;font-weight:600}.py-all input,.py-kw input,.py-r input{-webkit-appearance:auto;appearance:auto;width:auto;accent-color:var(--pri)}
.py-sum{display:flex;gap:8px;flex-wrap:wrap}.py-sum div{background:var(--surface);border-radius:12px;padding:8px 14px;box-shadow:var(--lift);font-size:12.5px;color:var(--mute)}.py-sum b{display:block;font-size:18px;color:var(--ink)}
.py-tw{overflow-x:auto;background:var(--surface);border-radius:12px;box-shadow:var(--lift)}.py-t{border-collapse:collapse;width:100%;font-size:13px}.py-t th,.py-t td{padding:8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}.py-t th{font-size:12px;color:var(--mute)}.py-t tr[data-pc]{cursor:pointer}.py-t tr.on td{background:color-mix(in srgb,var(--pri) 10%,transparent)}
.pk{color:var(--green);font-weight:700}.pn{color:#c0392b;font-weight:700}.pw{color:var(--amber);font-weight:700}.pm{color:var(--mute)}.py-e{color:var(--mute);margin:6px 2px}
.py-a{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.py-f{display:flex;flex-direction:column;gap:10px}.py-fh{display:flex;justify-content:space-between;align-items:center}
.py-g{display:grid;grid-template-columns:130px 1fr;gap:8px 12px;align-items:center;font-size:13.5px}.py-g>span{color:var(--mute);font-weight:700}.py-g input:not([type=radio]){width:auto;min-width:200px;font:inherit}.py-g small{color:var(--mute);margin-left:6px}
.py-r{display:flex;gap:6px 14px;flex-wrap:wrap}.py-r label,.py-kw{display:flex;flex-direction:row!important;align-items:center;gap:5px;font-weight:600;margin:0}
@media(max-width:700px){.py-g{grid-template-columns:1fr}}`;document.head.appendChild(st)}
return {hook(rpcS,tok,getCases,getRows,me){R=rpcS;T=tok;GC=getCases;GR=getRows;ME=me||(()=>"");if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup()}};
})();
