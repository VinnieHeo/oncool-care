/* 선정 이후 기록 (2026-11-12 · 11-25 지급 구분·소급 · 월별 서류) · 1단계: 월별 냉·난방비 지급 명단 · 협회 실적 입력 항목 · 수령증(협회 별첨 1 원본 양식) · 편집 비밀번호 전용 */
window.PAY=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const ORG="안양시만안종합사회복지관";
const TABS=[["2026-11","11월","11/27","2026-11-27"],["2026-12","12월","12/10","2026-12-10"],["2027-01","1월","1/10","2027-01-10"],["2027-02","2월","2/10","2027-02-10"]];
const ENG=["전기","도시가스","등유·연탄·LPG","기타"],MTH=["대상자 명의 계좌이체","기타"];
const engOf=h=>h==="도시가스"?"도시가스":h==="전기"?"전기":["기름(등유) 보일러","LPG","연탄"].includes(h)?"등유·연탄·LPG":"";
const b8=b=>{if(!/^\d{6}$/.test(b||""))return "";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
const dot=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(s||"");return m?`${m[1]}. ${m[2]}. ${m[3]}.`:""};
const won=n=>n||n===0?Number(n).toLocaleString("ko-KR")+"원":"";
let R=null,T=()=>"",GC=()=>[],GR=()=>[],ME=()=>"",PAYS=[],tab=0,all=false,sel=null,msg="";
const typeNo=c=>CS.typeOf(c)||"";
function rows(){const M={};GR().forEach(x=>M[x.id]=x);
  return GC().filter(c=>!(M[c.referral_id]||{}).is_test).filter(c=>all?["선정","위원회상정","서류완비"].includes(c.stage):c.stage==="선정").map(c=>[c,M[c.referral_id]||{}])
    .sort((a,b)=>(a[0].household_code||"~").localeCompare(b[0].household_code||"~")||(a[1].receipt_no-b[1].receipt_no))}
function dueAt(c,i){const a=CS.amounts(c);if(!a)return null;const x=a.list.find(([m])=>m===TABS[i][2]);return x?x[1]:0}
const due=c=>dueAt(c,tab);
const recAt=(c,i)=>PAYS.find(p=>p.case_id===c.id&&p.month===TABS[i][0]&&p.season==="난방"),rec=c=>recAt(c,tab);
/* 11/24 협회 공지: 협회 선정 가구는 그달 지급일에 지급 · 지급일 뒤 같은 달 안에 선정되면 다음 지급일에 소급 · 협회 심사중은 지급하지 않음 */
const kw=c=>c.kaswc_approved?String(c.kaswc_approved).slice(0,10):"";
function stOf(c,i=tab){const k=kw(c);if(!k)return "wait";return k>TABS[i][3]&&k.slice(0,7)===TABS[i][0]&&TABS[i+1]?"back":"pay"}
const carry=c=>tab>0&&stOf(c,tab-1)==="back"?(dueAt(c,tab-1)||0):0;
function badge(c){const s=stOf(c);return s==="wait"?'<span class="pb wt">협회 심사중</span>':s==="back"?`<span class="pb bk">${TABS[tab+1][2]} 소급</span>`:`<span class="pb ok">${TABS[tab][2]} 지급${carry(c)?" · 소급 포함":""}</span>`}
let ACS={};const ac=c=>ACS[c.id]||null,acM=c=>{const a=ac(c);if(a&&a.kind==="현금")return '<span class="pw">현금 지급 · 사유서</span>';return a&&a.no?`${a.kind==="세대원"?"가족("+esc(a.rel||"세대원")+") ":""}${esc(a.bank||"")} ${esc(window.ACCT?ACCT.mask(a.no):"")}${a.st==="읽기만 됨"?' <span class="pw">확인 필요</span>':""}`:'<span class="pn">없음</span>'};
async function load(){try{PAYS=await R("oncool_ed_payments",{p_token:T()})||[];ACS=await R("oncool_ed_accts",{p_token:T()})||{}}catch(x){msg="불러오지 못했습니다: "+x.message}
  try{PDOCS=await R("oncool_ed_pay_docs",{p_token:T()})||[]}catch(_){PDOCS=[]}}
/* 월별 서류 (11/25): 추천 선생님이 수령증 서명·고지서·납부 내역·모니터링 메모, 직원이 이체확인증 · 11월분은 수령증·이체확인증만 필수 */
let PDOCS=[];const PDK=[["rcpt","수령증 서명"],["bill","고지서"],["paid","통장·영수증"],["memo","모니터링 메모"],["xfer","이체확인증"]];
const pdNeed=m=>["rcpt","bill","paid","memo","xfer"];
const pdOf=(c,m)=>{const o={};PDOCS.filter(d=>d.case_id===c.id&&d.month===m).forEach(d=>o[d.kind]=d);return o};
function pdCell(c){const m=TABS[tab][0],o=pdOf(c,m),n=pdNeed(m),g=n.filter(k=>o[k]).length;return g===n.length?'<span class="pk">완료</span>':`<span class="${g?"pw":"pn"}">${g}/${n.length}</span>`}
async function pdOpen(c,m,k){const d=pdOf(c,m)[k],B=BUNDLE.B();let p=d&&d.meta&&d.meta.path;
  if(!p){const f=await B.list(c.id,`m/${m}/${k}`);if(f.length)p=`${c.id}/m/${m}/${k}/${f[f.length-1].name}`}
  if(!p)throw new Error("올린 파일이 없습니다");return B.open(c.id,p)}
function defaults(c,i=tab,to){const t=typeNo(c);/* 11/13 협회 질의응답: 11월 안에 선정되면 11월분을 12월에 소급 · 달이 지난 뒤 기록하면 다음 지급일·소급으로 채움 */
  const a=ac(c)||{},end=new Date(+TABS[i][0].slice(0,4),+TABS[i][0].slice(5,7),0,23,59),late=to!=null||stOf(c,i)==="back"||(new Date()>end&&TABS[i+1]),how=a.kind==="현금"?"현금 지급 (현금지급 사유서 첨부)":a.kind==="세대원"?`세대원(${a.rel||"가족"}) 명의 계좌이체`:"";
  return {case_id:c.id,season:"난방",month:TABS[i][0],amount:dueAt(c,i),paid_on:to!=null?TABS[to][3]:late?TABS[i+1][3]:TABS[i][3],method:t==="4"||a.kind==="현금"||a.kind==="세대원"?"기타":"대상자 명의 계좌이체",receipt:"미수취",energy:engOf(c.v_heating)||"",usage:"",note:`${TABS[i][1]}분 난방비 ${late?"소급 ":""}지급${how?" · "+how:""}`,kaswc:false}}
function listHTML(L){const S={n:0,sum:0,paid:0,norc:0,nokw:0,wt:0,bk:0};
  const tr=L.map(([c,r])=>{const p=rec(c),a=due(c),t=typeNo(c),st=stOf(c),cy=carry(c);if(st==="wait")S.wt++;if(st==="back"||cy)S.bk++;if(a&&st==="pay"){S.n++;S.sum+=(p&&p.amount!=null?+p.amount:a)+cy}if(p&&p.paid_on)S.paid++;if(p&&p.receipt!=="수취")S.norc++;if(p&&!p.kaswc_at)S.nokw++;
    return `<tr class="${sel===c.id?"on":""}" data-pc="${c.id}"><td>${badge(c)}</td><td>${esc(c.household_code||"")}</td><td><b>${esc(r.elder_name)}</b></td><td>${t?t+"유형":"유형 미정"} · ${esc(c.v_household_size||"?")}인</td><td>${a===null?'<span class="pw">유형·인원 필요</span>':a===0?'<span class="pm">대상 월 아님</span>':st==="pay"?won(p&&p.amount!=null?p.amount:a)+(cy?` <small class="pm">+ ${TABS[tab-1][1]}분 ${won(cy)}</small>`:""):`<span class="pm">(${won(a)}) ${st==="back"?TABS[tab+1][2]+"에 지급":"합계 제외"}</span>`}</td>
    <td>${p&&p.paid_on?esc(p.paid_on.slice(5).replace("-","/")):""}</td><td>${p?esc(p.method||""):""}</td><td>${t==="4"?'<span class="pm">필요 없음</span>':acM(c)}</td><td>${p?(p.receipt==="수취"?'<span class="pk">수취</span>':'<span class="pn">미수취</span>'):""}</td><td>${st==="pay"&&p&&p.paid_on?pdCell(c):""}</td><td>${p?esc(p.energy||""):""}</td><td>${p?esc(p.usage||""):""}</td><td>${p?(p.kaswc_at?'<span class="pk">입력 완료</span>':'<span class="pw">입력 전</span>'):""}</td><td>${window.CHK?esc(CHK.forPay(c.id,TABS[tab][0])||""):""}</td></tr>`}).join("");
  return `<div class="py-sum"><div>대상 가구<b>${L.length}</b></div><div>이번 달 지급 예정<b>${won(S.sum)}</b></div><div>협회 심사중<b class="pw">${S.wt}</b></div><div>소급 대상<b>${S.bk}</b></div><div>지급 기록<b class="pk">${S.paid}</b></div><div>수령증 미수취<b class="pn">${S.norc}</b></div><div>협회 입력 전<b class="pw">${S.nokw}</b></div></div>
  ${L.length?`<div class="py-tw"><table class="py-t"><tr><th>지급 구분</th><th>가구코드</th><th>대상자</th><th>유형·인원</th><th>이번 달 금액</th><th>지급일</th><th>지급 방식</th><th>계좌</th><th>수령증</th><th>월별 서류</th><th>주 사용처</th><th>사용량</th><th>협회 입력</th><th>온쿨체크</th></tr>${tr}</table></div>`:`<p class="py-e">${all?"표시할 가구가 없습니다.":"아직 ‘선정’ 단계인 가구가 없습니다. 사례판정 후 단계를 ‘선정’으로 바꾸면 여기에 나타납니다."}</p>`}`}
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
  ${pdHTML(c)}
  <label class="py-kw"><input type="checkbox" id="py_kwc"${p.kaswc_at?" checked":""}> 협회 사이트에 입력 완료${p.kaswc_at?` <small>(${esc(String(p.kaswc_at).slice(0,10))})</small>`:""}</label>
  <div class="py-a"><button type="button" class="sbtn pri" data-psave>저장</button><button type="button" class="sbtn" data-prc>수령증 출력</button><button type="button" class="sbtn" data-pcopy>협회 입력용 복사</button><span class="msg">${esc(msg)}</span></div></div>`}
function pdHTML(c){const m=TABS[tab][0],o=pdOf(c,m),n=pdNeed(m),md2=d=>d?String(d).slice(5,10).replace("-","/"):"";
  return `<div class="py-pd"><b>${TABS[tab][1]}분 서류</b>${PDK.map(([k,l])=>{const d=o[k],req=n.includes(k);
    const info=d?(k==="rcpt"&&d.meta&&d.meta.rel&&d.meta.rel!=="본인"?`대리(${esc(d.meta.who||d.meta.rel)}) · `:"")+(k==="bill"&&d.meta&&d.meta.usage?esc(d.meta.usage)+" · ":"")+(k==="memo"&&d.meta?esc(String(d.meta.text||"").slice(0,60))+" · ":"")+md2(d.at)+" "+esc(d.by||""):"";
    return `<div class="py-pdr"><span>${l}</span><span>${d?'<span class="pk">받음</span> '+info:(req?'<span class="pn">필수 · 아직</span>':'<span class="pm">선택</span>')}</span><span>${d&&k!=="memo"?`<button type="button" class="sbtn" data-pdv="${k}">보기</button>`:""}${k==="xfer"?`<label class="sbtn">파일 올리기<input type="file" accept="image/*,application/pdf" data-pdx hidden></label>`:""}</span></div>`}).join("")}</div>`}
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
  const E=[];L.forEach(([c,r])=>{if(carry(c))E.push([c,r,tab-1]);if(due(c)&&stOf(c)==="pay")E.push([c,r,tab])});
  const body=E.map(([c,r,i])=>{const p=recAt(c,i)||{};return [c.household_code,r.elder_name,c.v_birth||b8(r.birth),typeNo(c)?typeNo(c)+"유형":"",c.v_household_size,TABS[i][0],p.amount??dueAt(c,i),p.paid_on||TABS[tab][3],p.method||"",(ac(c)||{}).bank||"",(ac(c)||{}).no?`="${ac(c).no}"`:"",(ac(c)||{}).holder||"",(ac(c)||{}).st||"",p.receipt||"",p.energy||"",p.usage||""].map(q).join(",")});
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
function rcPage(c,r,sig){const p=rec(c)||{},amt=p.amount??due(c),birth=dot(c.v_birth||b8(r.birth));
  return `<div class="ax"><p class="tag">[별첨 1]</p><p class="tag"></p>
  <table class="ttl"><tr><td class="bar1"></td></tr><tr><td class="t">온(溫) 앤 쿨(cool) 사업<br>냉·난방비 수령증</td></tr><tr><td class="bar2"></td></tr></table>
  <p></p><p>&nbsp;&nbsp;본인은 ‘온(溫) 앤 쿨(cool)’ 사업 참여 지원가구의 가구원으로서 기관으로부터 아래와 같이 본 사업 참여에 따른 냉·난방비 지원을 받았음을 확인합니다.</p><p></p>
  <p class="sec">□ 수 령 인</p><p></p>
  <table class="tb"><tr><td class="h">성&nbsp;&nbsp;&nbsp;&nbsp;명</td><td>${esc(r.elder_name)}</td></tr><tr><td class="h">생년월일</td><td>${birth||"0000. 00. 00."}</td></tr></table>
  <p></p><p class="sec">□ 지원내역</p><p></p>
  <table class="tb"><tr><td class="h">지원구분</td><td>냉방비 / <span class="ck">난방비</span></td></tr><tr><td class="h">수 령 일</td><td>${dot(p.paid_on||TABS[tab][3])}</td></tr><tr><td class="h">지원금액</td><td>${amt?Number(amt).toLocaleString("ko-KR")+"원":"000,000원"}</td></tr><tr><td class="h">지원기관</td><td>${ORG}</td></tr></table>
  <p></p><p></p><table class="tb"><tr><td class="h">서&nbsp;&nbsp;&nbsp;&nbsp;명</td><td>${sig&&sig.url?`<img src="${esc(sig.url)}" alt="서명" style="max-height:11mm;max-width:100%;vertical-align:middle">${sig.rel&&sig.rel!=="본인"?`<div style="font-size:9pt">대리 서명: ${esc(sig.who||sig.rel)}</div>`:""}`:""}</td></tr></table><p></p><p class="c">${ORG}</p></div>`}
async function printRc(L){L=L.filter(([c])=>due(c));if(!L.length){alert("이번 달 지급 대상 가구가 없습니다.");return}const w=window.open("","_blank");if(!w){alert("팝업이 차단되어 있습니다. 팝업을 허용해 주세요.");return}
  w.document.write("<p style='font-family:sans-serif;padding:20px'>서명을 불러오는 중…</p>");const m=TABS[tab][0],S={};
  await Promise.all(L.map(async([c])=>{const d=pdOf(c,m).rcpt;if(!d)return;try{S[c.id]={url:await pdOpen(c,m,"rcpt"),rel:d.meta&&d.meta.rel,who:d.meta&&d.meta.who}}catch(_){}}));
  w.document.open();w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>수령증 ${TABS[tab][1]}</title><style>${RCSS}</style></head><body><div class="bar"><span>${L.length}가구 · ${TABS[tab][1]} 난방비 수령증 · 서명 ${Object.keys(S).length}가구</span><button onclick="print()">인쇄</button></div>${L.map(([c,r])=>rcPage(c,r,S[c.id])).join("")}</body></html>`);w.document.close()}
async function save(p){const n=await R("oncool_ed_payment_save",{p_token:T(),p});const i=PAYS.findIndex(x=>x.id===n.id);if(i<0)PAYS.push(n);else PAYS[i]=n;return n}
function show(on){const v=$("#vw-pay"),b=$("#vt-pay");if(!v)return;v.hidden=!on;b.setAttribute("aria-selected",on);
  if(on){["#vt-ref","#vt-case","#vt-q"].forEach(s=>{const x=$(s);if(x)x.setAttribute("aria-selected",false)});["#vw-ref","#vw-case","#vw-q"].forEach(s=>{const x=$(s);if(x)x.hidden=true});msg="";paint();Promise.all([load(),window.CHK?CHK.ensure().catch(()=>{}):0]).then(paint)}}
function setup(){if($("#vt-pay"))return;const tabs=document.querySelector(".vtabs");if(!tabs)return;
  const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.id="vt-pay";b.setAttribute("aria-selected","false");b.textContent="선정 이후 기록";tabs.appendChild(b);
  const v=document.createElement("div");v.id="vw-pay";v.hidden=true;$("#vw-ref").after(v);
  b.addEventListener("click",()=>{if(!T()){alert("편집 비밀번호로 들어와야 사용할 수 있습니다.");return}show(true)});
  tabs.addEventListener("click",e=>{const t=e.target.closest("[role=tab]");if(t&&t.id!=="vt-pay")show(false)},true);
  v.addEventListener("change",async e=>{if(e.target.id==="py_all"){all=e.target.checked;sel=null;paint();return}
    if(e.target.matches("[data-pdx]")&&e.target.files[0]){const f=e.target.files[0],cur=rows().find(([c])=>c.id===sel);if(!cur)return;const m=TABS[tab][0];
      try{await BUNDLE.B().upload(cur[0].id,`m/${m}/xfer`,f,f.type||"application/pdf");await R("oncool_ed_pay_doc_mark",{p_token:T(),p_case:cur[0].id,p_month:m,p_kind:"xfer",p_meta:{name:f.name}});await load();msg="이체확인증을 올렸습니다."}catch(x){msg="올리지 못했습니다: "+x.message}paint()}});
  v.addEventListener("click",async e=>{const L=rows();
    const tb=e.target.closest("[data-ptab]");if(tb){tab=+tb.dataset.ptab;msg="";paint();return}
    const r=e.target.closest("[data-pc]");if(r){sel=r.dataset.pc;msg="";paint();const f=$(".py-f");if(f)f.scrollIntoView({block:"nearest"});return}
    if(e.target.closest("[data-pclose]")){sel=null;msg="";paint();return}
    const cur=L.find(([c])=>c.id===sel);
    if(e.target.closest("[data-psave]")&&cur){e.target.disabled=true;try{await save(formVal(cur[0]));msg="저장되었습니다."}catch(x){msg="저장하지 못했습니다: "+x.message}paint();return}
    if(e.target.closest("[data-prc]")&&cur){printRc([cur]);return}
    const pv=e.target.closest("[data-pdv]");if(pv&&cur){const w=window.open("","_blank");try{const u=await pdOpen(cur[0],TABS[tab][0],pv.dataset.pdv);if(w)w.location=u;else location.href=u}catch(x){if(w)w.close();msg=x.message;paint()}return}
    if(e.target.closest("[data-pcopy]")&&cur){const t=kwText(cur[0],formVal(cur[0]));try{await navigator.clipboard.writeText(t);msg="복사했습니다."}catch(_){msg="복사하지 못했습니다."}const m=e.target.parentNode.querySelector(".msg");if(m)m.textContent=msg;return}
    if(e.target.closest("[data-pcsv]")){csv(L);return}
    if(e.target.closest("[data-prcall]")){printRc(L.filter(([c])=>stOf(c)==="pay"));return}
    if(e.target.closest("[data-pbulk]")){const hold=c=>window.CHK&&CHK.forPay(c.id,TABS[tab][0])==="보류·재심",todo=L.filter(([c])=>due(c)&&stOf(c)==="pay"&&!rec(c)&&!hold(c)),back=L.filter(([c])=>carry(c)&&!recAt(c,tab-1)&&!hold(c));if(!todo.length&&!back.length){msg="새로 만들 기록이 없습니다.";paint();return}
      e.target.disabled=true;let ok=0,bk=0;for(const [c] of todo){try{await save(defaults(c));ok++}catch(_){}}for(const [c] of back){try{await save(defaults(c,tab-1,tab));bk++}catch(_){}}msg=`${ok}가구의 ${TABS[tab][1]} 지급 기록${bk?`, ${bk}가구의 ${TABS[tab-1][1]}분 소급 기록`:""}을 만들었습니다. 지급일·수령증을 확인해 주세요.`;paint()}});
  const st=document.createElement("style");st.textContent=`
#vw-pay{display:flex;flex-direction:column;gap:10px}.py-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.py-tabs{display:flex;gap:6px;flex-wrap:wrap}.py-tabs button{font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:6px 12px;background:var(--surface);border:1px solid var(--line);color:var(--mute);cursor:pointer}.py-tabs button.on{background:var(--pri);color:#fff;border-color:var(--pri)}
.py-all{display:flex;flex-direction:row!important;gap:6px;align-items:center;font-size:13px;font-weight:600}.py-all input,.py-kw input,.py-r input{-webkit-appearance:auto;appearance:auto;width:auto;accent-color:var(--pri)}
.py-sum{display:flex;gap:8px;flex-wrap:wrap}.py-sum div{background:var(--surface);border-radius:12px;padding:8px 14px;box-shadow:var(--lift);font-size:12.5px;color:var(--mute)}.py-sum b{display:block;font-size:18px;color:var(--ink)}
.py-tw{overflow-x:auto;background:var(--surface);border-radius:12px;box-shadow:var(--lift)}.py-t{border-collapse:collapse;width:100%;font-size:13px}.py-t th,.py-t td{padding:8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}.py-t th{font-size:12px;color:var(--mute)}.py-t tr[data-pc]{cursor:pointer}.py-t tr.on td{background:color-mix(in srgb,var(--pri) 10%,transparent)}
.pb{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700}.pb.ok{background:color-mix(in srgb,var(--green) 14%,transparent);color:var(--green)}.pb.wt{background:color-mix(in srgb,var(--amber) 16%,transparent);color:var(--amber)}.pb.bk{background:color-mix(in srgb,var(--pri) 12%,transparent);color:var(--pri)}
.py-pd{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:10px}.py-pdr{display:grid;grid-template-columns:110px 1fr auto;gap:8px;align-items:center;font-size:13px}.py-pdr .sbtn{cursor:pointer}
.pk{color:var(--green);font-weight:700}.pn{color:#c0392b;font-weight:700}.pw{color:var(--amber);font-weight:700}.pm{color:var(--mute)}.py-e{color:var(--mute);margin:6px 2px}
.py-a{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.py-f{display:flex;flex-direction:column;gap:10px}.py-fh{display:flex;justify-content:space-between;align-items:center}
.py-g{display:grid;grid-template-columns:130px 1fr;gap:8px 12px;align-items:center;font-size:13.5px}.py-g>span{color:var(--mute);font-weight:700}.py-g input:not([type=radio]){width:auto;min-width:200px;font:inherit}.py-g small{color:var(--mute);margin-left:6px}
.py-r{display:flex;gap:6px 14px;flex-wrap:wrap}.py-r label,.py-kw{display:flex;flex-direction:row!important;align-items:center;gap:5px;font-weight:600;margin:0}
@media(max-width:700px){.py-g{grid-template-columns:1fr}}`;document.head.appendChild(st)}
return {hook(rpcS,tok,getCases,getRows,me){R=rpcS;T=tok;GC=getCases;GR=getRows;ME=me||(()=>"");if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup()}};
})();
