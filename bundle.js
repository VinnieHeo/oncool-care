/* 서류 전체 PDF (관리 화면, 2026-11-13)
   1쪽 초기상담지 · 2쪽 사례판정 자료 · 전자서명 서류 · 별첨 2 확인서 · 올린 서류(사진·PDF) 순서로 한 파일
   모두 이 브라우저 안에서 만듭니다(외부 전송 없음) · 추천자 화면은 지금처럼 사진만 묶음 */
window.BUNDLE=(function(){
let B=null,RPC=null,TOK=()=>"";
{const _i=CSE.init;CSE.init=function(b){B=b;return _i.apply(this,arguments)}}
let CUR_R={};{const _o=CSE.open;CSE.open=function(c,r){CUR_R=r||{};return _o.apply(this,arguments)}}
{const _h=JUDGE.hook;JUDGE.hook=function(r,t){RPC=r;TOK=t;return _h.apply(this,arguments)}}
const $=s=>document.querySelector(s);
const b8=b=>{if(!/^\d{6}$/.test(b||""))return "";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
let LIB=null;function lib(){if(window.PDFLib)return Promise.resolve();if(LIB)return LIB;
  LIB=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";s.onload=res;s.onerror=()=>{LIB=null;rej(new Error("PDF 프로그램을 불러오지 못했어요"))};document.head.appendChild(s)});return LIB}

/* 화면용 HTML 한 쪽을 A4 그림으로: 숨긴 틀에 그려서 크기를 재고 → SVG로 감싸 → 캔버스(2배) → JPEG */
const A4W=794,A4H=1123;let FR=null;
function frame(){if(FR&&FR.isConnected)return FR;FR=document.createElement("iframe");FR.setAttribute("aria-hidden","true");FR.tabIndex=-1;
  FR.style.cssText=`position:fixed;left:-10000px;top:0;width:${A4W+40}px;height:${A4H}px;border:0;visibility:hidden`;document.body.appendChild(FR);return FR}
function scope(css){return css.replace(/@page\s*\{[^}]*\}/g,"").replace(/@media\s+print\s*\{([^{}]*\{[^}]*\})*\s*\}/g,"").replace(/(^|\})\s*([^{}@]+)\{/g,(m,a,sel)=>a+sel.split(",").map(s=>{s=s.trim();return s==="body"||s==="html"?".fo-body":/^(body|html)\s/.test(s)?s.replace(/^(body|html)\s+/,".fo-body "):s}).join(",")+"{")}
const margin=css=>{const m=/@page\s*\{[^}]*margin\s*:\s*([^;}]+)/.exec(css);return m?m[1].trim():"12mm"};
async function shot(css,html){const fr=frame(),d=fr.contentDocument;const st=`<style>${scope(css)}.fo-body{width:${A4W}px;min-height:${A4H}px;box-sizing:border-box;padding:${margin(css)};background:#fff;margin:0}.bar,.pdfnote{display:none!important}</style>`;
  d.open();d.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"><div id="fo" class="fo-body">${st}${html}</div></body></html>`);d.close();
  try{await d.fonts.ready}catch(_){}await Promise.all([...d.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await new Promise(r=>setTimeout(r,60));
  const el=d.getElementById("fo"),h=Math.max(A4H,Math.ceil(el.scrollHeight));
  const xml=new XMLSerializer().serializeToString(el);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${A4W}" height="${h}"><foreignObject x="0" y="0" width="${A4W}" height="${h}">${xml}</foreignObject></svg>`;
  const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("쪽을 그리지 못했어요"));i.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)});
  const k=2,cv=document.createElement("canvas");cv.width=A4W*k;cv.height=h*k;const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);
  return toJpg(cv)}
function toJpg(cv){return new Promise((res,rej)=>cv.toBlob(b=>b?b.arrayBuffer().then(res,rej):rej(new Error("그림을 만들지 못했어요")),"image/jpeg",.9))}
/* 올린 사진: 방향 바로잡고 너무 크면 줄여서 JPEG */
async function photo(blob){const bm=await createImageBitmap(blob);const s=Math.min(1,2400/Math.max(bm.width,bm.height)),cv=document.createElement("canvas");cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);
  const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.drawImage(bm,0,0,cv.width,cv.height);bm.close&&bm.close();return toJpg(cv)}
/* 한 문서 HTML(<html>…)에서 스타일과 쪽 나누기 */
function split(html,sel){const doc=new DOMParser().parseFromString(html,"text/html");const css=[...doc.querySelectorAll("style")].map(s=>s.textContent).join("\n");doc.querySelectorAll(".bar,script").forEach(e=>e.remove());
  const els=sel?[...doc.querySelectorAll(sel)]:[doc.body];return {css,pages:els.map(e=>sel?e.outerHTML:e.innerHTML)}}

/* 서류 확인 표지 (11/18): 뒤에 붙는 서류와 같은 순서로 대조 */
const COVER_CSS=`@page{margin:13mm 12mm}body{font-family:"Noto Sans KR","Malgun Gothic",sans-serif;color:#1d2333;font-size:12.5px}
h1{font-size:20px;margin:0}.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2.5px solid #2f3bb0;padding-bottom:6px;margin-bottom:10px}.top small{color:#5b6350}
.who{font-size:15px;font-weight:700;margin:0 0 4px}.ln{margin:2px 0;line-height:1.6}.ln b{color:#2f3bb0}.ln span{color:#5b6350;display:inline-block;min-width:74px}
table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#2f3bb0;color:#fff;padding:6px 7px;text-align:left;font-size:12px}td{padding:6px 7px;border-bottom:1px solid #d9deea;font-size:12.5px}
.na td{color:#9aa1b4}.miss{color:#c0392b;font-weight:700}.box{display:inline-block;width:14px;height:14px;border:1.5px solid #8a93a6;border-radius:3px}
.warn{margin-top:10px;background:#fdf1ee;border-radius:6px;padding:7px 10px;color:#8e2b1f;line-height:1.6}.memo{margin-top:16px;border-top:1px dashed #b7bdcc;padding-top:5px;color:#8a93a6;height:90px}`;
function coverHTML(c,r,files){const e=CS.esc,t=CS.typeOf(c),a=CS.amounts(c),ds=CS.docState(c),d=c.docs||{},sg=c.signs||{},SIGNED=JUDGE.SIGNED||["consent_own","consent","pledge"],v=c.vcall||{};
  const md=x=>x?String(x).slice(5).replace("-","/"):"-",SM={11:"11월 시작 4회",12:"12월 시작 3회",1:"1월 시작 2회",2:"2월 시작 1회"};
  const need=x=>typeof x.req==="string"?(t?x.req.includes(t):null):!!x.req;
  const rows=[],miss=[];
  const row=(x,how)=>{const n=need(x),fs=(files[x.k]||[]).length,has=how==="sign"?!!sg[x.k]:fs>0||(x.k==="confirm"&&how==="annex");if(n===false&&!has)return rows.push(`<tr class="na"><td>${e(x.l)}</td><td>해당 없음</td><td>-</td><td>-</td><td></td></tr>`);
    const m=n&&!has;if(m)miss.push(x.l);const old=ds.stale.includes(x.l);
    rows.push(`<tr><td>${e(x.l)}</td><td>${n===null?"유형 정한 뒤":n?"필수":"선택"}</td><td${m?' class="miss"':""}>${how==="sign"?(has?"전자서명":"없음"):how==="annex"?"확인서 출력":fs?fs+"장":"없음"}</td><td${old?' class="miss"':""}>${md((d[x.k]||{}).date)}${old?" (3개월 지남)":""}</td><td><span class="box"></span></td></tr>`)};
  CS.DOCS.filter(x=>SIGNED.includes(x.k)&&sg[x.k]).forEach(x=>row(x,"sign"));
  {const k=window.ANNEX&&ANNEX.kindOf?ANNEX.kindOf(c):0;const cf=CS.DOCS.find(x=>x.k==="confirm");if(k&&ANNEX.readyK(c,k)&&!(files.confirm||[]).length){row(Object.assign({},cf,{l:`${ANNEX.K[k].t} (별첨 ${k})`,req:1}),"annex");files=Object.assign({},files,{__anx:1})}}
  CS.DOCS.filter(x=>!(SIGNED.includes(x.k)&&sg[x.k])&&!(x.k==="confirm"&&files.__anx)).forEach(x=>row(x,"up"));
  const why=[];
  if(t==="2")why.push(`<span>2025 잔액</span>${v.res?e(v.res):"<b style='color:#c0392b'>확인 기록 없음</b>"}${v.bal?" · "+e(v.bal)+(/\d$/.test(v.bal)?"원":""):""}${v.date?" · "+md(v.date):""}${v.who?" · "+e(v.who)+" 공동 청취":""}`);
  if((t==="3"||t==="4")&&(c.annex_reason||c.v_env))why.push(`<span>${t==="3"?"바우처 못 쓰는 사유":"인프라 취약 사유"}</span>${e(c.annex_reason||c.v_env)}`);
  const kinds=c.v_income==="기초생활수급자"&&(c.v_recipient_kinds||[]).length?" ("+e(c.v_recipient_kinds.join("·"))+")":"";
  const td=new Date(),ts=`${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,"0")}-${String(td.getDate()).padStart(2,"0")}`;
  return `<div class="top"><h1>서류 확인 표지</h1><small>${ts} 출력</small></div>
  <p class="who">${e(r.elder_name)} · 접수 ${e(r.receipt_no)}번 · ${e(r.dong||"")} · ${e(c.v_gender||r.gender||"")} · ${e(c.v_birth||b8(r.birth)||"생년월일 없음")}</p>
  <p class="ln"><span>판정</span><b>${t?t+"유형 "+e(CS.TYPES[t]):"유형 미정"}</b> · 가구원 ${e(c.v_household_size||"?")}명${c.v_income_size?" (소득 판단 "+e(c.v_income_size)+"명)":""} · 동절기 ${a?CS.fmt(a.tot)+"원":"-"} (${SM[c.start_month||11]||""})</p>
  <p class="ln"><span>소득</span>${e(c.v_income||"-")}${kinds}${c.hi_premium?" · 건보료 "+e(c.hi_premium):""}</p>
  <p class="ln"><span>바우처</span>${e(c.v_voucher||"-")}</p>${why.map(x=>`<p class="ln">${x}</p>`).join("")}
  <table><tr><th>서류</th><th>${t?t+"유형 기준":"기준"}</th><th>올린 것</th><th>발급일</th><th style="width:40px">확인</th></tr>${rows.join("")}</table>
  ${miss.length||ds.stale.length?`<div class="warn">${miss.length?"⚠ 빠진 필수 서류: "+e(miss.join(", ")):""}${miss.length&&ds.stale.length?"<br>":""}${ds.stale.length?"⚠ 발급 3개월 지남: "+e(ds.stale.join(", ")):""}</div>`:""}
  <div class="memo">메모</div>`}
/* 받을 서류 고르기 (11/18): plan()으로 목록만 만들고, build()에 고른 key를 넘김 */
async function plan(c,r){const P=[],sg=c.signs||{},SIGNED=JUDGE.SIGNED||["consent_own","consent","pledge"];
  /* 1. 순서 정하기 (아직 그리지 않음) */
  P.push({l:"초기상담지",t:"sheet",run:async()=>{const s=split(CS.printSheet(c,r,true));return [await shot(s.css,s.pages[0])]}});
  P.push({l:"사례판정 자료",t:"judge",run:async()=>[await shot(JUDGE.CSS,JUDGE.summary(c,r).replace(/<span class="attn">[^<]*<\/span>/,"<span>서류 전체 묶음 · 증빙은 뒤쪽</span>"))]});
  for(const k of SIGNED){if(!sg[k])continue;const f=(SIGN.FORMS||{})[k];P.push({l:f?f.t:k,t:"sign",run:async()=>{const rec=await RPC("oncool_ed_sign",{p_token:TOK(),p_case:c.id,p_form:k});
    const s=split(SIGN.printHTML(k,rec,{name:r.elder_name,birth:c.v_birth||b8(r.birth),addr:(r.address||"").replace(" | ",", "),phone:r.phone||"",size:c.v_household_size||""}),".pr-page");const out=[];for(const p of s.pages)out.push(await shot(s.css,p));return out}})}
  const files={};for(const x of CS.DOCS){let fs=[];try{fs=await B.list(c.id,x.k)||[]}catch(_){}files[x.k]=fs}
  {const k=window.ANNEX&&ANNEX.kindOf?ANNEX.kindOf(c):0;if(k&&ANNEX.readyK(c,k)&&!(files.confirm||[]).length)
    P.push({l:`${ANNEX.K[k].t} (별첨 ${k})`,t:"annex",run:async()=>{let g={};try{g=await RPC("oncool_ed_annex_cfg",{p_token:TOK()})||{}}catch(_){}return [await shot(ANNEX.CSS,ANNEX.page(c,r,g,k))]}})}
  for(const x of CS.DOCS){if(SIGNED.includes(x.k)&&sg[x.k])continue;for(const f of files[x.k])P.push({l:x.l,t:"up",f,k:x.k})}
  P.unshift({l:"서류 확인 표지",t:"cover",run:async()=>[await shot(COVER_CSS,coverHTML(c,r,files))]});
  P.forEach(p=>p.key=p.t==="up"?"up:"+p.k:p.t);return P}
async function build(c,r,say,sel){let P=await plan(c,r);if(sel)P=P.filter(p=>sel.has(p.key));const note=[],cnt={cover:0,sheet:0,judge:0,sign:0,annex:0,up:0};if(!P.length)throw new Error("고른 서류가 없어요");
  /* 2. 차례로 만들기 */
  await lib();const {PDFDocument}=PDFLib,out=await PDFDocument.create(),PW=595.28,PH=841.89;
  const addJpg=async bytes=>{const im=await out.embedJpg(bytes),land=im.width>im.height*1.05,W=land?PH:PW,H=land?PW:PH,s=Math.min(W/im.width,H/im.height),w=im.width*s,h=im.height*s;
    out.addPage([W,H]).drawImage(im,{x:(W-w)/2,y:(H-h)/2,width:w,height:h})};
  let i=0;for(const p of P){i++;say(`모으는 중… ${i}/${P.length} (${p.l})<br>조금 걸릴 수 있어요. 창을 닫지 말아 주세요.`,i/P.length);
    try{if(p.run){for(const j of await p.run())await addJpg(j);cnt[p.t]++;continue}
      const u=await B.open(c.id,`${c.id}/${p.k}/${p.f.name}`),bl=await (await fetch(u)).blob();
      if(p.f.mimetype==="application/pdf"||/\.pdf$/i.test(p.f.name||"")||bl.type==="application/pdf"){const src=await PDFDocument.load(await bl.arrayBuffer(),{ignoreEncryption:true});
        (await out.copyPages(src,src.getPageIndices())).forEach(pg=>out.addPage(pg))}else await addJpg(await photo(bl));cnt.up++}
    catch(e){console.error(e);note.push(p.l)}}
  if(!out.getPageCount())throw new Error("넣을 서류가 없어요");
  out.setTitle(`온앤쿨 ${r.elder_name||""} 서류 전체`);return {bytes:await out.save(),pages:out.getPageCount(),cnt,note}}

/* 관리 화면에서만 ‘서류 전체 PDF로 받기’를 이 방식으로 (추천자 화면은 기존대로) */
document.addEventListener("click",async e=>{const b=e.target.closest("#c_pdf");if(!b||!B||B.worker||!RPC||!TOK())return;const c=CSE.current();if(!c)return;
  e.stopImmediatePropagation();e.preventDefault();if(b.dataset.busy)return;
  const old=document.getElementById("c_pdfsel");if(old){old.remove();return}
  const msg=$("#c_pdfmsg"),r=CUR_R||{};msg.textContent="서류 목록을 불러오는 중…";b.disabled=true;let P=[];
  try{P=await plan(c,r)}catch(err){msg.textContent="목록을 불러오지 못했어요: "+(err.message||err);b.disabled=false;return}b.disabled=false;msg.textContent="";
  const G=[];const add=(key,l,n)=>{const g=G.find(x=>x.key===key);if(g)g.n++;else G.push({key,l,n:1})};
  P.forEach(p=>add(p.key,p.t==="sign"?"동의서·약정서 서명본":p.t==="up"?p.l.replace(/\s*\(.*\)\s*$/,""):p.l));
  const ev=k=>k.startsWith("up:")||k==="annex"||k==="cover";
  const box=document.createElement("div");box.id="c_pdfsel";box.style.cssText="border:1px dashed var(--line);border-radius:12px;padding:12px;margin:8px 0;display:flex;flex-direction:column;gap:8px";
  box.innerHTML=`<b style="font-size:14px">받을 서류를 골라 주세요</b><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="sbtn" data-ps="all">전체</button><button type="button" class="sbtn" data-ps="ev">증빙만</button></div>
   <div style="display:flex;flex-direction:column;gap:5px">${G.map(g=>`<label style="display:flex;flex-direction:row;align-items:center;gap:8px;font-size:13.5px;font-weight:600;margin:0"><input type="checkbox" data-pk="${CS.esc(g.key)}" checked style="width:18px;height:18px;-webkit-appearance:auto;appearance:auto;accent-color:var(--pri)"> ${CS.esc(g.l)} <small style="color:var(--mute);font-weight:400">${g.key.startsWith("up:")?g.n+"장":g.n>1?"("+g.n+")":""}</small></label>`).join("")}</div>
   <div><button type="button" class="sbtn pri" data-ps="go">PDF 받기</button></div>`;
  (b.closest(".pdfrow")||b).after(box);
  box.onclick=async ev2=>{const t=ev2.target.closest("[data-ps]");if(!t)return;const m=t.dataset.ps,cks=[...box.querySelectorAll("[data-pk]")];
    if(m==="all"){cks.forEach(x=>x.checked=true);return}if(m==="ev"){cks.forEach(x=>x.checked=ev(x.dataset.pk));return}
    const sel=new Set(cks.filter(x=>x.checked).map(x=>x.dataset.pk));if(!sel.size){msg.textContent="받을 서류를 하나 이상 골라 주세요.";return}
    const whole=sel.size===cks.length;box.remove();b.dataset.busy="1";b.disabled=true;
    const say=(t,f)=>{msg.innerHTML=`<span style="display:block;line-height:1.6">${t}</span>`+(f!=null?`<i style="display:block;height:6px;border-radius:9px;background:var(--line);overflow:hidden;margin-top:6px;max-width:360px"><b style="display:block;height:100%;width:${Math.round(f*100)}%;background:var(--pri)"></b></i>`:"")};
    say("모으는 중… 조금 걸릴 수 있어요. 창을 닫지 말아 주세요.",0);
    try{const name=(r.elder_name||(document.querySelector("#cedit .dv-head h2")||{}).textContent||"가구").trim();const x=await build(c,Object.assign({elder_name:name},r),say,whole?null:sel);
      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([x.bytes],{type:"application/pdf"}));a.download=`온앤쿨_${name}_${whole?"서류전체":"서류선택"}_${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
      const C=x.cnt;say(`<b style="color:var(--green)">${x.pages}쪽을 PDF 한 파일로 받았어요.</b><br>표지 ${C.cover} · 상담지 ${C.sheet} · 판정자료 ${C.judge} · 서명본 ${C.sign} · 확인서 ${C.annex} · 올린 서류 ${C.up}`+(x.note.length?`<br><span style="color:var(--warm)">못 넣은 것: ${CS.esc(x.note.join(", "))} · 따로 열어 확인해 주세요.</span>`:""))}
    catch(err){say("PDF를 만들지 못했어요: "+CS.esc(err.message||String(err)))}finally{b.disabled=false;delete b.dataset.busy}}},true);
return {build,plan,shot,lib,photo,B:()=>B,RPC:()=>RPC,TOK:()=>TOK()}})();
