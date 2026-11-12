/* 통장 사본 사진에서 은행·계좌번호·예금주 읽기 (2026-11-12) · 사진은 이 기기 브라우저 안에서만 읽습니다(외부 전송 없음) · 확인·수정 후 저장 */
window.ACCT=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const BANKS=["NH농협은행","지역농축협","KB국민은행","신한은행","우리은행","하나은행","IBK기업은행","SC제일은행","한국씨티은행","KDB산업은행","수협은행","새마을금고","신협","우체국","카카오뱅크","토스뱅크","케이뱅크","부산은행","경남은행","대구은행(iM뱅크)","광주은행","전북은행","제주은행","산림조합","저축은행"];
const KEY=[[/농축협|지역농협|단위농협/,"지역농축협"],[/농협|NH/i,"NH농협은행"],[/국민|KB/i,"KB국민은행"],[/신한/,"신한은행"],[/우리/,"우리은행"],[/하나|KEB/i,"하나은행"],[/기업|IBK/i,"IBK기업은행"],[/제일|SC/,"SC제일은행"],[/씨티|citi/i,"한국씨티은행"],[/산업|KDB/i,"KDB산업은행"],[/수협/,"수협은행"],[/새마을|MG/,"새마을금고"],[/신협/,"신협"],[/우체국|우정/,"우체국"],[/카카오/,"카카오뱅크"],[/토스/,"토스뱅크"],[/케이뱅크|K\s?bank/i,"케이뱅크"],[/부산/,"부산은행"],[/경남/,"경남은행"],[/대구|iM/i,"대구은행(iM뱅크)"],[/광주/,"광주은행"],[/전북/,"전북은행"],[/제주/,"제주은행"],[/산림/,"산림조합"],[/저축/,"저축은행"]];
let B=null,W=false,CUR=null,REF=null,LIB=null,ST="",BASE=null,RPC=null,TOK=null;
{const _i=CSE.init;CSE.init=function(b){B=b;W=!!(b&&b.worker);return _i.apply(this,arguments)}}
function parse(t){const L=String(t||"").split(/\n/).map(s=>s.trim()).filter(Boolean);let bank="";
  for(const l of L){for(const [re,n] of KEY){if(re.test(l)){bank=n;break}}if(bank)break}
  const cand=[];L.forEach((l,i)=>{const re=/(\d[\d\- ]{8,24}\d)/g;let m;while((m=re.exec(l))){const raw=m[1],dg=raw.replace(/\D/g,"");if(dg.length<10||dg.length>16)continue;if(/^(19|20)\d{2}[ .\-]\d{1,2}[ .\-]\d{1,2}$/.test(raw.trim()))continue;
    cand.push({no:raw.replace(/\s+/g,"").replace(/-{2,}/g,"-"),score:(/계좌|번호|No/i.test(l)?3:0)+(/-/.test(raw)?2:0)+(i<8?1:0)})}});
  cand.sort((a,b)=>b.score-a.score);
  let holder="";for(const l of L){const m=/예\s*금\s*주\s*(?:명)?\s*[:：]?\s*([가-힣]{2,5})/.exec(l)||/([가-힣]{2,5})\s*(?:귀하|님)/.exec(l);if(m){holder=m[1];break}}
  return {bank,no:cand[0]?cand[0].no:"",holder}}
function loadLib(){if(window.Tesseract)return Promise.resolve();if(LIB)return LIB;
  LIB=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=res;s.onerror=()=>{LIB=null;rej(new Error("글자 인식 프로그램을 불러오지 못했습니다. 인터넷 연결을 확인하거나 직접 입력해 주세요."))};document.head.appendChild(s)});return LIB}
async function prep(blob){const url=URL.createObjectURL(blob);const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error("사진을 열지 못했습니다"));i.src=url});
  const k=Math.min(2,2400/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);const x=cv.getContext("2d");x.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
  const d=x.getImageData(0,0,cv.width,cv.height),p=d.data;let mn=255,mx=0;for(let i=0;i<p.length;i+=4){const g=.299*p[i]+.587*p[i+1]+.114*p[i+2];p[i]=g;if(g<mn)mn=g;if(g>mx)mx=g}
  const r=Math.max(1,mx-mn);for(let i=0;i<p.length;i+=4){const g=(p[i]-mn)*255/r;p[i]=p[i+1]=p[i+2]=g}x.putImageData(d,0,0);return cv}
async function readPhoto(cid){const fs=await B.list(cid,"bank");const f=(fs||[]).filter(f=>f.mimetype!=="application/pdf"&&!/\.pdf$/i.test(f.name||"")).pop();if(!f)throw new Error("읽을 통장 사진이 없습니다. PDF는 읽을 수 없으니 직접 입력해 주세요.");
  const u=await B.open(cid,`${cid}/bank/${f.name}`);const bl=await (await fetch(u)).blob();await loadLib();const cv=await prep(bl);
  const w=await Tesseract.createWorker(["kor","eng"]);try{const {data}=await w.recognize(cv);return parse(data.text||"")}finally{w.terminate()}}
function boxHTML(a,name){a=a||{};
  return `<div class="ac-box" id="c_acct"><b>🔍 통장 계좌 정보</b><p>통장 사진을 올리면 자동으로 읽습니다.<br>통장과 같은지 확인하고, 틀리면 고쳐 주세요.</p>
   <p class="ac-st" id="ac_st"></p>
   <label>은행<select id="ac_bank"><option value="">선택</option>${BANKS.map(b=>`<option${b===a.bank?" selected":""}>${b}</option>`).join("")}${a.bank&&!BANKS.includes(a.bank)?`<option selected>${esc(a.bank)}</option>`:""}</select></label>
   <label>계좌번호<input id="ac_no" inputmode="numeric" maxlength="25" autocomplete="off" placeholder="숫자와 - 만 입력" value="${esc(a.no||"")}"></label>
   <label>예금주<input id="ac_holder" maxlength="20" autocomplete="off" value="${esc(a.holder||"")}"></label>
   <p class="ac-warn" id="ac_warn" hidden></p>
   <div class="ac-btns"><button type="button" class="sbtn pri" id="ac_ok">맞습니다</button><button type="button" class="sbtn" id="ac_read">사진에서 읽기</button></div><p class="ac-msg" id="ac_msg"></p></div>`}
const cur=()=>({bank:$("ac_bank").value,no:$("ac_no").value.replace(/[^0-9-]/g,""),holder:$("ac_holder").value.trim()});
const same=(a,b)=>a&&b&&a.bank===b.bank&&a.no===b.no&&a.holder===b.holder;
function paintSt(){const e=$("ac_st");if(!e)return;e.textContent=ST?`상태: ${ST}${ST==="읽기만 됨"?" · 확인이 필요합니다":""}`:"";e.className="ac-st"+(ST==="읽기만 됨"?" need":ST?" ok":"")}
function warn(){const w=$("ac_warn"),h=$("ac_holder").value.replace(/\s/g,""),n=String(REF.elder_name||"").replace(/\s/g,"");
  w.hidden=!(h&&n&&h!==n);w.textContent=`예금주가 대상자(${REF.elder_name||""})와 다릅니다. 대상자 본인 명의 통장인지 확인해 주세요.`}
/* 저장할 값: 칸이 비어 있으면 아무것도 보내지 않음(기존 값 유지) */
function val(){if(!$("ac_bank"))return null;const v=cur();if(!v.bank&&!v.no&&!v.holder)return null;return Object.assign(v,{st:ST||"읽기만 됨"})}
function setVals(a){if(a.bank){if(![...$("ac_bank").options].some(o=>o.value===a.bank))$("ac_bank").insertAdjacentHTML("beforeend",`<option>${esc(a.bank)}</option>`);$("ac_bank").value=a.bank}if(a.no)$("ac_no").value=a.no;if(a.holder)$("ac_holder").value=a.holder}
function mount(c,r){CUR=c;REF=r||{};const d=document.querySelector('#cedit [data-doc="bank"]');if(!d||$("c_acct"))return;
  d.insertAdjacentHTML("beforeend",boxHTML(c.acct,REF.elder_name));
  ST=(c.acct&&c.acct.st)||"";BASE=c.acct&&c.acct.no?cur():null;paintSt();warn();
  const box=$("c_acct"),msg=$("ac_msg"),cid=c.id;
  /* 직원 화면: 계좌는 목록에서 빠져 있으므로 따로 불러옴 */
  if(!W&&RPC&&!c.acct)RPC("oncool_ed_accts",{p_token:TOK()}).then(m=>{const a=m&&m[cid];if(!a||!CUR||CUR.id!==cid||!$("ac_bank"))return;CUR.acct=a;if(!val()){setVals(a);ST=a.st||"";BASE=cur();paintSt();warn()}}).catch(()=>{});
  box.addEventListener("input",()=>{ST=W?"현장 확인":"직원 수정";paintSt();warn()});
  const read=async()=>{const b=$("ac_read");b.disabled=true;msg.textContent="사진을 읽는 중입니다. 처음에는 10초쯤 걸립니다.";
    try{const a=await readPhoto(cid);if(!CUR||CUR.id!==cid)return;setVals(a);ST="읽기만 됨";BASE=cur();paintSt();warn();
      msg.textContent=a.no?"읽었습니다. 통장과 같은지 확인한 뒤 ‘맞습니다’를 눌러 주세요.":"계좌번호를 찾지 못했습니다. 직접 입력해 주세요.";
      const s=$("c_msg");if(s)s.textContent="저장되지 않음"}
    catch(x){msg.textContent=x.message||"읽지 못했습니다. 직접 입력해 주세요."}finally{b.disabled=false}};
  $("ac_read").onclick=read;
  $("ac_ok").onclick=()=>{const v=cur(),n=v.no.replace(/\D/g,"");if(!v.bank||n.length<10||n.length>16){msg.textContent="은행과 계좌번호(숫자 10~16자리)를 확인해 주세요.";return}
    ST=W?"현장 확인":(same(v,BASE)?"직원 확인":"직원 수정");BASE=v;paintSt();msg.textContent="확인했습니다. 저장합니다.";const s=$("c_save");if(s)s.click()};
  /* 통장 사진을 새로 올렸고 계좌가 비어 있으면 자동으로 읽기 */
  const fl=$("files-bank");if(fl){const cnt=()=>fl.querySelectorAll(".fpill").length;let n0=/불러오는 중/.test(fl.textContent)?null:cnt();
    new MutationObserver(()=>{if(/불러오는 중/.test(fl.textContent))return;const n=cnt();if(n0===null){n0=n;return}if(n>n0&&!$("ac_no").value&&!$("ac_read").disabled)read();n0=n}).observe(fl,{childList:true,subtree:true})}}
const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{mount(c,r)}catch(e){console.error(e)}return x};
{const st=document.createElement("style");st.textContent=`.ac-box{margin-top:10px;padding:12px;border:1.5px solid var(--pri);border-radius:12px;background:color-mix(in srgb,var(--pri) 6%,transparent);display:flex;flex-direction:column;gap:8px}
.ac-box>b{font-size:14px}.ac-box p{margin:0;font-size:12.5px;color:var(--mute);line-height:1.55}.ac-box label{display:flex;flex-direction:column;gap:3px;font-size:12.5px;font-weight:700;color:var(--mute)}.ac-box input,.ac-box select{font:inherit;font-size:15px;color:var(--ink)}
.ac-box .ac-warn{color:#c0392b;font-weight:700}.ac-box .ac-st:empty{display:none}.ac-box .ac-st.ok{color:#127a4c;font-weight:700}.ac-box .ac-st.need{color:#b8620e;font-weight:700}.ac-btns{display:flex;gap:6px}.ac-btns .sbtn{flex:1}.ac-box .ac-msg{color:var(--pri);font-weight:600}.ac-box .ac-msg:empty{display:none}`;document.head.appendChild(st)}
const mask=n=>{n=String(n||"");const d=n.replace(/\D/g,"");if(d.length<5)return n;let k=0;const keep=d.length-4;return n.replace(/\d/g,ch=>k++<keep?"*":ch)};
function hook(rpc,tok){RPC=rpc;TOK=tok}
return {val,parse,mask,hook}})();
