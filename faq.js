/* 문의하기 (추천자 화면): 자주 묻는 질문 → 질문 남기기 → 전화 */
(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CATS=["전체","서류","일정","방법","기준"];
let FAQ=null,DUE=null,MYQ=null,cat="전체",kw="",tab="faq",sent="";
const tok=()=>{try{return TOKEN||""}catch(x){return""}};
const call=(fn,a)=>rpc(fn,a);
async function load(force){if(FAQ&&!force)return;try{const r=await call("oncool_faq_list",{});FAQ=Array.isArray(r&&r.items)?r.items:[];DUE=r&&r.due}catch(x){FAQ=FAQ||[]}}
async function loadMine(){if(!tok()){MYQ=null;return}try{const r=await call("oncool_w_questions",{p_token:tok()});MYQ=Array.isArray(r)?r:[]}catch(x){MYQ=MYQ||[]}}
function dueTxt(){if(!DUE)return"담당자가 안내한 날짜";const d=new Date(DUE+"T00:00:00");return `${d.getMonth()+1}월 ${d.getDate()}일(${"일월화수목금토"[d.getDay()]})`}
const body=a=>esc(String(a||"").replace(/\{마감일\}/g,dueTxt())).replace(/\n/g,"<br>");
const fmt=t=>{const d=new Date(t);return `${d.getMonth()+1}월 ${d.getDate()}일`};
const unread=()=>(MYQ||[]).filter(q=>q.answer&&!q.seen).length;
function tag(t){if(!t)return"";return `<span class="fq-tag ${t==="협회 확인"?"ok":"wait"}">${esc(t)}</span>`}
function hits(){const k=kw.trim().toLowerCase();return (FAQ||[]).filter(f=>(cat==="전체"||f.cat===cat)&&(!k||(f.q+" "+f.a).toLowerCase().includes(k)))}
function list(){const L=hits();
  if(!FAQ)return'<p class="fq-load">불러오는 중…</p>';
  if(!L.length)return `<div class="fq-none"><b>찾는 답이 없습니다.</b><p>아래에서 질문을 남겨 주시면 담당자가 확인한 뒤 답변을 드립니다.</p></div>`;
  return L.map(f=>`<details class="fq-i"><summary class="fq-q"><i>Q</i><span>${esc(f.q)}${tag(f.tag)}</span></summary><div class="fq-a">${body(f.a)}${f.src?`<small>${esc(f.src)}</small>`:""}</div></details>`).join("")}
function ask(){const u=unread();
  if(!tok())return `<section class="fq-box"><b>찾는 답이 없으십니까?</b><p>질문을 남기시면 담당자가 확인한 뒤 답변을 드립니다.<br>질문을 남기려면 추천하기와 같은 이름·번호로 로그인해 주세요.</p><div class="fq-btns"><button type="button" class="btn" data-fq="login">로그인하고 질문 남기기</button></div></section>`;
  return `<section class="fq-box"><b>찾는 답이 없으십니까?</b><p>질문을 남기시면 담당자가 확인한 뒤 답변을 드립니다.<br>답변은 ‘내 질문 보기’에서 확인할 수 있습니다.</p>
   <textarea class="fq-ta" maxlength="1000" placeholder="궁금한 점을 적어 주세요.">${esc(sent||!kw.trim()||hits().length?"":kw)}</textarea><small class="fq-warn">대상자 이름이나 연락처는 적지 마세요.</small>
   ${sent?`<p class="fq-sent">${esc(sent)}</p>`:""}
   <div class="fq-btns"><button type="button" class="btn" data-fq="send">질문 남기기</button><button type="button" class="btn sec" data-fq="mine">내 질문 보기${u?` <span class="fq-tag ok">답변 ${u}</span>`:""}</button></div></section>`}
function mine(){if(!MYQ)return'<p class="fq-load">불러오는 중…</p>';if(!MYQ.length)return'<p class="fq-load">아직 남긴 질문이 없습니다.</p>';
  return MYQ.map(q=>`<div class="fq-my"><b>${esc(q.body)}</b><small>${fmt(q.at)} 질문 · ${q.answer?"답변 완료":"확인 중"}</small>${q.answer?`<div class="fq-ans"><em>담당자 답변 · ${fmt(q.answered_at)}</em>${esc(q.answer).replace(/\n/g,"<br>")}</div>`:""}</div>`).join("")}
function phone(){return `<section class="fq-box fq-call"><b>그래도 해결되지 않으면 전화로 문의해 주세요.</b><div class="fq-btns"><a class="btn sec" href="tel:07089787710"><small>사무실 직통</small>070-8978-7710</a><a class="btn sec" href="tel:01083999293"><small>휴대폰</small>010-8399-9293</a></div><small>근무시간(평일 9시~18시)에는 사무실 직통으로 연락해 주세요.<br>문자도 괜찮습니다.</small></section>`}
function html(){if(tab==="mine")return `<button type="button" class="linkbtn" data-fq="faq">← 자주 묻는 질문</button><h3 class="fq-h3">내 질문</h3><div class="fq-list">${mine()}</div>${ask()}${phone()}`;
  return `<div class="fq-s"><span aria-hidden="true">🔍</span><input type="search" class="fq-kw" placeholder="궁금한 내용을 입력해 주세요 (예: 통장, 마감)" aria-label="질문 검색" value="${esc(kw)}"></div>
   <div class="fq-cats">${CATS.map(c=>`<button type="button" class="${c===cat?"on":""}" data-fqc="${c}">${c}</button>`).join("")}</div>
   <div class="fq-list">${list()}</div>${ask()}${phone()}`}
const roots=new Set();
function paint(){roots.forEach(el=>{if(!el.isConnected){roots.delete(el);return}const kwEl=el.querySelector(".fq-kw"),focus=kwEl&&document.activeElement===kwEl,pos=focus?kwEl.selectionStart:0;
  el.innerHTML=html();if(focus){const k=el.querySelector(".fq-kw");if(k){k.focus();k.setSelectionRange(pos,pos)}}});badge()}
function bind(el){if(el.dataset.fqb)return;el.dataset.fqb=1;
  el.addEventListener("input",e=>{if(e.target.classList.contains("fq-kw")){kw=e.target.value;sent="";const l=el.querySelector(".fq-list");if(l)l.innerHTML=list();const ta=el.querySelector(".fq-ta");if(ta&&!ta.dataset.touched)ta.value=hits().length?"":kw}
    if(e.target.classList.contains("fq-ta"))e.target.dataset.touched=1});
  el.addEventListener("click",async e=>{const c=e.target.closest("[data-fqc]");if(c){cat=c.dataset.fqc;paint();return}
    const b=e.target.closest("[data-fq]");if(!b)return;const a=b.dataset.fq;
    if(a==="login"){close();if(typeof mview==="function")mview("go");return}
    if(a==="faq"){tab="faq";paint();return}
    if(a==="mine"){tab="mine";await loadMine();paint();if(unread()){try{await call("oncool_w_q_seen",{p_token:tok()})}catch(x){}(MYQ||[]).forEach(q=>{if(q.answer)q.seen=true});badge()}return}
    if(a==="send"){const ta=el.querySelector(".fq-ta"),v=(ta&&ta.value||"").trim();if(v.length<2){ta&&ta.focus();return}
      b.disabled=true;b.textContent="보내는 중…";
      try{await call("oncool_w_ask",{p_token:tok(),p_body:v});sent="질문을 보냈습니다. 담당자가 확인한 뒤 답변을 드립니다.";kw="";await loadMine()}
      catch(x){sent=/too_many/.test(x.message)?"오늘 남길 수 있는 질문 수를 넘었습니다. 전화로 문의해 주세요.":/session/.test(x.message)?"다시 로그인해 주세요.":"질문을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."}
      paint()}})}
async function mount(el){roots.add(el);bind(el);tab="faq";paint();await Promise.all([load(),loadMine()]);paint()}
let sheet=null;
function open(){if(!sheet){sheet=document.createElement("div");sheet.className="fq-sheet";sheet.innerHTML=`<div class="fq-dim" data-fqx></div><div class="fq-pan" role="dialog" aria-modal="true" aria-label="문의하기"><div class="fq-ph"><b>문의하기</b><button type="button" class="sbtn" data-fqx>닫기</button></div><div class="fq-pb"></div></div>`;
    sheet.addEventListener("click",e=>{if(e.target.closest("[data-fqx]"))close()});document.body.appendChild(sheet)}
  sheet.hidden=false;document.documentElement.style.overflow="hidden";mount(sheet.querySelector(".fq-pb"))}
function close(){if(sheet){sheet.hidden=true;document.documentElement.style.overflow=""}}
function badge(){const u=unread();document.querySelectorAll(".mc.call b, [data-faq]").forEach(x=>{let t=x.querySelector(".fq-dot");if(u&&!t){t=document.createElement("i");t.className="fq-dot";x.appendChild(t)}if(t){if(u)t.textContent=u;else t.remove()}})}
document.addEventListener("click",e=>{if(e.target.closest("[data-faq]")){e.preventDefault();open()}
  if(e.target.closest('[data-view="call"]'))setTimeout(()=>{const v=document.getElementById("faqv");if(v)mount(v)},0)});
const css=document.createElement("style");css.textContent=`
.fq-s{display:flex;align-items:center;gap:8px;background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:0 12px;height:48px;margin-bottom:10px}
.fq-s input{border:0!important;outline:0;background:none!important;font:inherit;font-size:16px;flex:1;min-width:0;color:var(--ink);padding:0!important;box-shadow:none!important;height:auto}
.fq-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.fq-cats button{font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:6px 12px;background:var(--surface);border:1px solid var(--line);color:var(--mute);cursor:pointer}.fq-cats button.on{background:var(--pri);border-color:var(--pri);color:#fff}
.fq-list{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.fq-i{background:var(--surface);border-radius:14px;box-shadow:var(--lift)}.fq-q{display:flex;gap:10px;padding:13px 14px;font-weight:700;font-size:15px;list-style:none;cursor:pointer;line-height:1.45}.fq-q::-webkit-details-marker{display:none}.fq-q i{font-style:normal;color:var(--pri);font-weight:800}
.fq-a{padding:0 14px 14px 36px;font-size:14.5px;line-height:1.65;word-break:keep-all}.fq-a small{display:block;margin-top:8px;font-size:12px;color:var(--mute)}
.fq-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:2px 7px;margin-left:6px;vertical-align:1px;white-space:nowrap}.fq-tag.wait{background:var(--amber-soft);color:var(--amber)}.fq-tag.ok{background:var(--green-soft);color:var(--green)}
.fq-none{background:var(--surface);border-radius:14px;padding:14px;box-shadow:var(--lift)}.fq-none p{margin:4px 0 0;color:var(--mute);font-size:14px;line-height:1.6}
.fq-load{color:var(--mute);font-size:14px;margin:4px 2px}
.fq-box{background:var(--surface);border-radius:16px;box-shadow:var(--lift);padding:14px;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;word-break:keep-all}
.fq-box>p{margin:0;font-size:14px;line-height:1.6;color:var(--mute)}.fq-box>small{font-size:12.5px;color:var(--mute);line-height:1.5}
.fq-ta{width:100%;box-sizing:border-box;min-height:90px;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;background:var(--soft);color:var(--ink)}
.fq-warn{font-size:12.5px;color:var(--warm)}.fq-sent{margin:0;font-size:14px;color:var(--green);font-weight:700}
.fq-btns{display:flex;gap:8px;flex-wrap:wrap}.fq-btns>*{flex:1 1 140px;text-align:center;text-decoration:none}
.fq-call{background:var(--soft);box-shadow:none;border:1px solid var(--line)}.fq-call .fq-btns a{display:flex;flex-direction:column;gap:2px;line-height:1.3;padding:10px 8px}.fq-call .fq-btns a small{font-size:12px;color:var(--mute);font-weight:600}
.fq-h3{margin:6px 0 10px;font-size:17px}
.fq-my{background:var(--surface);border-radius:14px;box-shadow:var(--lift);padding:13px 14px;display:flex;flex-direction:column;gap:6px}.fq-my>b{font-size:15px;line-height:1.5}.fq-my>small{font-size:12px;color:var(--mute)}
.fq-ans{background:var(--green-soft);border-radius:10px;padding:10px 12px;font-size:14.5px;line-height:1.6}.fq-ans em{display:block;font-style:normal;font-size:12px;font-weight:800;color:var(--green);margin-bottom:2px}
.fq-sheet{position:fixed;inset:0;z-index:70}.fq-dim{position:absolute;inset:0;background:rgba(15,20,40,.45)}
.fq-pan{position:absolute;left:0;right:0;bottom:0;max-height:90vh;background:var(--bg);border-radius:22px 22px 0 0;display:flex;flex-direction:column;max-width:720px;margin:0 auto}
.fq-ph{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}.fq-ph b{font-size:18px}
.fq-pb{overflow:auto;padding:0 16px calc(18px + env(safe-area-inset-bottom,0px))}
.wz-ask{margin-left:auto;align-self:center;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;font-weight:700;color:var(--pri);cursor:pointer;position:relative}
.fq-dot{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:999px;background:#e0603a;color:#fff;font-size:11px;font-style:normal;font-weight:800;display:grid;place-items:center;padding:0 4px}
.mc.call b{position:relative}.mc.call b .fq-dot{position:static;display:inline-grid;margin-left:6px;vertical-align:2px}`;
document.head.appendChild(css);
window.FAQ={open,mount,badge,refresh:async()=>{await loadMine();badge()}};
if(tok())loadMine().then(badge);
})();
