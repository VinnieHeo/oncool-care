/* 협회 제출 준비 (관리 화면 · 선정 심사, 2026-11-15)
   사례판정위원회 1차 선정(단계 ‘선정’, 협회 승인일 없음) 가구를 모아
   유형별 확인서(별첨 2·3·4)와 올린 유형 증빙을 가구마다 PDF 1개로 만듭니다.
   매뉴얼 261113: 1유형 건보료 납부확인서(또는 수급자증명서) · 2유형 결정통지서 + 별첨 2
   · 3유형 결정통지서 또는 바우처 대상 증빙 + 별첨 3 · 4유형 건보료 납부확인서 또는 수급자증명서 + 별첨 4
   모두 이 브라우저 안에서 만듭니다(외부 전송 없음). */
window.SUBM=(function(){
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let getC=()=>[],getR=()=>[],TOK=()=>"",RPC=null,FILES={},BUSY=false;
const EVI={1:["income"],2:["voucher"],3:["voucher"],4:["income"]};
const EVL={income:"소득 증빙",voucher:"에너지바우처 확인",confirm:"유형별 확인서(올린 파일)"};
const isTest=c=>{try{return typeof isT==="function"&&isT(c)}catch(_){return false}};
const list=()=>getC().filter(c=>c.stage==="선정"&&!c.kaswc_approved&&!isTest(c));
const B=()=>window.BUNDLE&&BUNDLE.B&&BUNDLE.B();
async function files(c){if(FILES[c.id])return FILES[c.id];const b=B(),o={};if(!b)return o;
  for(const k of ["income","voucher","confirm"]){try{o[k]=await b.list(c.id,k)||[]}catch(_){o[k]=[]}}FILES[c.id]=o;return o}
function state(c,f){const t=CS.typeOf(c),k=+t||0,need=[],have=[];
  if(!k)return {k,ok:false,need:["유형 미정 · ‘최종 유형’을 골라 주세요"],have};
  for(const d of EVI[k]){const n=(f[d]||[]).length;if(n)have.push(`✓ ${EVL[d]} ${n}개`);else need.push(`✗ ${EVL[d]} 없음`)}
  if(k>=2){const up=(f.confirm||[]).length;
    if(up)have.push(`✓ 별첨 ${k}: 올린 파일 ${up}개 사용`);
    else if(ANNEX.readyK(c,k))have.push(`⚙ 별첨 ${k} 자동 작성`);
    else need.push(k===2?"✗ 별첨 2: 콜센터 공동 청취 기록(확인일·소진 확인)이 없음":`✗ 별첨 ${k}: ${ANNEX.K[k].l} 미입력`)}
  return {k,ok:!need.length,need,have}}
const R=()=>{const o={};getR().forEach(x=>o[x.id]=x);return o};

function shell(){if($("#subm"))return $("#subm");const s=document.createElement("section");s.id="subm";s.className="card subm";
  const bar=document.querySelector("#vw-case>.bar");bar.parentNode.insertBefore(s,bar);
  s.addEventListener("click",async e=>{const b=e.target.closest("[data-sb]");if(!b)return;const a=b.dataset.sb;
    if(a==="open"){const tr=document.querySelector(`#clist [data-cid="${b.dataset.id}"]`);if(tr)tr.click();return}
    if(a==="refresh"){FILES={};render();return}
    if(a==="one"){const c=getC().find(x=>x.id===b.dataset.id);if(c)await save([c]);return}
    if(a==="all"){const rs=R(),L=[];for(const c of list()){const st=state(c,await files(c));if(st.ok)L.push(c)}if(!L.length){alert("준비된 가구가 없습니다.");return}await save(L);return}
    if(a==="print"){const rs=R(),L=list().map(c=>[c,rs[c.referral_id]||{},ANNEX.kindOf(c)]).filter(([c,,k])=>k&&ANNEX.readyK(c,k));if(!L.length){alert("출력할 확인서가 없습니다.");return}ANNEX.print(L)}});
  return s}
async function render(){const s=shell();if(!TOK()){s.hidden=true;return}s.hidden=false;const L=list(),rs=R();
  if(!L.length){s.innerHTML=`<div class="sb-h"><h2>협회 제출 준비</h2></div><p class="sb-d">사례판정위원회에서 1차 선정한 가구가 여기에 모입니다.<br>단계를 ‘선정’으로 바꾸면 나타나고, ‘협회 승인일’을 넣으면 빠집니다.</p>`;return}
  s.innerHTML=`<div class="sb-h"><h2>협회 제출 준비 · 1차 선정 ${L.length}가구</h2><button type="button" class="linkbtn" data-sb="refresh">다시 확인</button></div>
  <p class="sb-d">‘협회 제출자료 PDF 저장’을 누르면 유형별 확인서(별첨 2·3·4)와 올린 유형 증빙을 가구마다 PDF 1개로 저장합니다.<br>저장한 파일을 협회 성과관리 시스템 ‘지원유형별 증빙자료’에 첨부해 주세요.<br>협회 승인 후 카드에 ‘협회 승인일’을 넣으면 이 목록에서 빠집니다.</p>
  <div class="sb-bar"><button type="button" class="sbtn pri" data-sb="all" id="sb_all">협회 제출자료 PDF 저장</button><button type="button" class="sbtn" data-sb="print">확인서만 인쇄</button><span class="sb-msg" id="sb_msg"></span></div>
  <div class="tw"><table class="sb-t"><thead><tr><th>가구</th><th>유형</th><th>들어갈 서류</th><th>상태</th><th></th></tr></thead><tbody>${L.map(c=>{const r=rs[c.referral_id]||{};
    return `<tr data-sid="${c.id}"><td><button type="button" class="linkbtn" data-sb="open" data-id="${c.id}"><b>${esc(r.elder_name||"")}</b></button><br><small>${esc(c.household_code||"")}</small></td><td class="sb-k">…</td><td class="sb-docs"><small>확인하는 중입니다.</small></td><td class="sb-st"></td><td><button type="button" class="sbtn" data-sb="one" data-id="${c.id}" disabled>PDF 저장</button></td></tr>`}).join("")}</tbody></table></div>`;
  let ready=0;for(const c of L){const f=await files(c),st=state(c,f),tr=s.querySelector(`tr[data-sid="${c.id}"]`);if(!tr)continue;
    tr.querySelector(".sb-k").innerHTML=st.k?`<span class="ty t${st.k}">${st.k}유형</span>`:"—";
    tr.querySelector(".sb-docs").innerHTML=[...st.have.map(x=>`<span class="${x[0]==="⚙"?"auto":"ok"}">${esc(x)}</span>`),...st.need.map(x=>`<span class="no">${esc(x)}</span>`)].join("");
    tr.querySelector(".sb-st").innerHTML=st.ok?`<span class="ok">준비됨</span>`:`<span class="no">빠진 것 ${st.need.length}</span>`;
    tr.querySelector("[data-sb=one]").disabled=!st.ok;if(st.ok)ready++}
  const a=$("#sb_all");if(a){a.textContent=`협회 제출자료 PDF 저장 · 준비된 ${ready}가구`;a.disabled=!ready}}

async function build(c,r){const f=await files(c),k=+CS.typeOf(c)||0,b=B();await BUNDLE.lib();const {PDFDocument}=PDFLib,out=await PDFDocument.create(),PW=595.28,PH=841.89;
  const addJpg=async bytes=>{const im=await out.embedJpg(bytes),land=im.width>im.height*1.05,W=land?PH:PW,H=land?PW:PH,s=Math.min(W/im.width,H/im.height),w=im.width*s,h=im.height*s;
    out.addPage([W,H]).drawImage(im,{x:(W-w)/2,y:(H-h)/2,width:w,height:h})};
  const addFile=async(key,fl)=>{const u=await b.open(c.id,`${c.id}/${key}/${fl.name}`),bl=await (await fetch(u)).blob();
    if(fl.mimetype==="application/pdf"||/\.pdf$/i.test(fl.name||"")||bl.type==="application/pdf"){const src=await PDFDocument.load(await bl.arrayBuffer(),{ignoreEncryption:true});(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p))}
    else await addJpg(await BUNDLE.photo(bl))};
  const note=[];
  if(k>=2){if((f.confirm||[]).length){for(const fl of f.confirm){try{await addFile("confirm",fl)}catch(e){note.push("확인서 파일")}}}
    else{const g=await ANNEX.cfg(true);await addJpg(await BUNDLE.shot(ANNEX.CSS,ANNEX.page(c,r,g,k)))}}
  for(const d of EVI[k]||[])for(const fl of (f[d]||[])){try{await addFile(d,fl)}catch(e){console.error(e);note.push(EVL[d])}}
  out.setTitle(`온앤쿨 협회 제출 ${k}유형 ${r.elder_name||""}`);return {bytes:await out.save(),pages:out.getPageCount(),note,k}}
const fname=(k,n)=>`${k}유형_${String(n||"가구").replace(/[\\/:*?"<>|\s]+/g,"")}_협회제출.pdf`;
async function save(L){if(BUSY)return;BUSY=true;const m=$("#sb_msg"),rs=R(),bad=[];let n=0,fail=0;
  const g=await ANNEX.cfg(true).catch(()=>({}));if(L.some(c=>(+CS.typeOf(c)||0)>=2)&&(!g.confirmer||!g.stamp)){alert("확인자 또는 직인 설정이 없습니다.\n선정 심사 카드의 ‘확인자·직인 설정’에서 먼저 등록해 주세요.");BUSY=false;return}
  try{for(const c of L){const r=rs[c.referral_id]||{};n++;if(m)m.textContent=`만드는 중입니다… ${n}/${L.length} (${r.elder_name||""})`;
      try{const x=await build(c,r);const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([x.bytes],{type:"application/pdf"}));a.download=fname(x.k,r.elder_name);document.body.appendChild(a);a.click();
        setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);if(x.note.length)bad.push(`${r.elder_name}: ${x.note.join(", ")}`);await new Promise(z=>setTimeout(z,700))}
      catch(e){console.error(e);fail++;bad.push(`${r.elder_name}: 만들지 못함(${e.message||e})`)}}
    if(m)m.innerHTML=`<b class="ok">${L.length-fail}가구 PDF를 저장했습니다.</b>`+(bad.length?`<br><span class="no">확인이 필요합니다: ${esc(bad.join(" · "))}</span>`:"")}
  finally{BUSY=false}}
function hook(gc,gr,tok){getC=gc;getR=gr;TOK=tok;
  const st=document.createElement("style");st.textContent=`.subm{margin:0 0 12px}.subm .sb-h{display:flex;align-items:center;gap:10px;justify-content:space-between}.subm h2{margin:0;font-size:17px}
  .subm .sb-d{color:var(--mute);font-size:13px;line-height:1.6;margin:6px 0 10px}.sb-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.sb-msg{font-size:13px;line-height:1.5}
  .sb-t{width:100%;border-collapse:collapse;font-size:13.5px}.sb-t th{font-size:12px;color:var(--mute);text-align:left;padding:7px 8px;border-bottom:1px solid var(--line)}.sb-t td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}
  .sb-docs{display:flex;flex-direction:column;gap:3px}.subm .ok{color:var(--green,#1f7a47)}.subm .no{color:#c0392b;font-weight:700}.subm .auto{color:#2453a6}
  .subm .sbtn[disabled]{opacity:.4;cursor:not-allowed;box-shadow:none}.subm .ty{display:inline-block;border-radius:6px;padding:1px 7px;font-weight:800;font-size:12px;background:var(--soft,#eef2f8)}`;document.head.appendChild(st);
  const t=$("#vt-case");if(t)t.addEventListener("click",()=>setTimeout(render,0));
}
return {hook,render,state,build}})();
