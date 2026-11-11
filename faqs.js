/* 직원 화면: 추천자 질문 답변 · 자주 묻는 질문 관리 (편집 비밀번호로 들어왔을 때만) */
window.FAQS=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CATS=["서류","일정","방법","기준"],TAGS=["","협회 확인 중","협회 확인"];
let R=null,T=()=>"",D={questions:[],faq:[]},sub="wait",sel=null,fsel=null,msg="";
const $=s=>document.querySelector(s);
const when=t=>{if(!t)return"";const d=new Date(t);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};
async function load(){if(!T())return;try{D=await R("oncool_ed_questions",{p_token:T()})||D}catch(x){msg="불러오지 못했습니다: "+x.message}count()}
function count(){const n=(D.questions||[]).filter(q=>!q.answer).length,b=$("#vt-q");if(b)b.innerHTML=`추천자 질문${n?` <span class="qn">${n}</span>`:""}`}
function qList(L){if(!L.length)return'<p class="qa-empty">질문이 없습니다.</p>';return L.map(q=>`<button type="button" class="qa-li${q.id===sel?" on":""}" data-q="${q.id}"><b>${esc(q.body.length>60?q.body.slice(0,60)+"…":q.body)}</b><small>${esc(q.who||"")} 선생님${q.org?" · "+esc(q.org):""} · ${when(q.at)} · ${q.answer?"답변 완료":"답변 대기"}</small></button>`).join("")}
function qDetail(q){if(!q)return'<p class="qa-empty">왼쪽에서 질문을 골라 주세요.</p>';
  return `<div class="qa-q">${esc(q.body).replace(/\n/g,"<br>")}</div><div class="qa-m">${esc(q.who||"")} 선생님${q.org?" ("+esc(q.org)+")":""} · ${when(q.at)}${q.answer?` · 답변 ${esc(q.answered_by||"")} ${when(q.answered_at)}`:""}</div>
   <textarea id="qa_a" rows="5" placeholder="답변을 입력해 주세요.">${esc(q.answer||"")}</textarea>
   <div class="qa-row"><label><input type="checkbox" id="qa_f"> 자주 묻는 질문에도 추가</label><select id="qa_c">${CATS.map(c=>`<option>${c}</option>`).join("")}</select></div>
   <input id="qa_fq" placeholder="자주 묻는 질문에 보일 질문 문장 (비우면 원래 질문 그대로)" hidden>
   <div class="qa-row"><button type="button" class="btn" id="qa_send" style="width:auto;padding:0 18px">${q.answer?"답변 고치기":"답변 보내기"}</button><span class="qa-msg">${esc(msg)}</span></div>`}
function fList(){return `<button type="button" class="sbtn" data-fnew>＋ 새 질문 추가</button>`+(D.faq||[]).map(f=>`<button type="button" class="qa-li${f.id===fsel?" on":""}${f.active?"":" off"}" data-f="${f.id}"><b>${esc(f.q)}</b><small>${esc(f.cat)}${f.tag?" · "+esc(f.tag):""}${f.active?"":" · 숨김"} · 순서 ${f.sort}</small></button>`).join("")}
function fDetail(){const f=fsel==="new"?{cat:"방법",q:"",a:"",src:"",tag:"",sort:200,active:true}:(D.faq||[]).find(x=>x.id===fsel);if(!f)return'<p class="qa-empty">왼쪽에서 질문을 골라 고치거나 새 질문을 추가해 주세요.</p>';
  return `<div class="qa-row"><select id="fq_c">${CATS.map(c=>`<option${c===f.cat?" selected":""}>${c}</option>`).join("")}</select><select id="fq_t">${TAGS.map(t=>`<option value="${t}"${t===(f.tag||"")?" selected":""}>${t||"표시 없음"}</option>`).join("")}</select><label>순서 <input id="fq_s" type="number" value="${f.sort}" style="width:70px"></label><label><input type="checkbox" id="fq_on"${f.active?" checked":""}> 보이기</label></div>
   <input id="fq_q" value="${esc(f.q)}" placeholder="질문"><textarea id="fq_a" rows="6" placeholder="답변 (문장이 끝날 때마다 줄을 바꿔 주세요. {마감일}은 이번 차수 마감일로 바뀝니다.)">${esc(f.a)}</textarea><input id="fq_src" value="${esc(f.src||"")}" placeholder="근거 (선택) 예: 협회 유형별 증빙서류 안내(11/11)">
   <div class="qa-row"><button type="button" class="btn" id="fq_save" style="width:auto;padding:0 18px">저장</button><span class="qa-msg">${esc(msg)}</span></div>`}
function paint(){const v=$("#vw-q");if(!v)return;const Q=D.questions||[],W=Q.filter(q=>!q.answer),A=Q.filter(q=>q.answer);
  v.innerHTML=`<div class="qa-tabs">${[["wait",`답변 대기 ${W.length}`],["done",`답변 완료 ${A.length}`],["faq",`자주 묻는 질문 관리 ${(D.faq||[]).length}`]].map(([k,t])=>`<button type="button" data-sub="${k}" class="${sub===k?"on":""}">${t}</button>`).join("")}<span class="qa-hint">답변하면 질문한 선생님 화면의 ‘내 질문’에 표시됩니다.</span></div>
   <div class="qa-g"><div class="qa-l">${sub==="faq"?fList():qList(sub==="wait"?W:A)}</div><div class="qa-d card">${sub==="faq"?fDetail():qDetail(Q.find(q=>q.id===sel))}</div></div>`;count()}
function show(on){const v=$("#vw-q"),b=$("#vt-q");if(!v)return;v.hidden=!on;b.setAttribute("aria-selected",on);if(on){$("#vt-ref").setAttribute("aria-selected",false);$("#vt-case").setAttribute("aria-selected",false);$("#vw-ref").hidden=true;$("#vw-case").hidden=true;msg="";paint();load().then(paint)}}
function setup(){if($("#vt-q"))return;const tabs=document.querySelector(".vtabs");if(!tabs)return;
  const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.id="vt-q";b.setAttribute("aria-selected","false");b.textContent="추천자 질문";tabs.appendChild(b);
  const v=document.createElement("div");v.id="vw-q";v.hidden=true;$("#vw-ref").after(v);
  b.addEventListener("click",()=>{if(!T()){alert("답변은 편집 비밀번호로 들어와야 할 수 있습니다.");return}show(true)});
  tabs.addEventListener("click",e=>{if(e.target.closest("#vt-ref,#vt-case"))show(false)},true);
  v.addEventListener("click",async e=>{const s=e.target.closest("[data-sub]");if(s){sub=s.dataset.sub;sel=null;fsel=null;msg="";paint();return}
    const q=e.target.closest("[data-q]");if(q){sel=+q.dataset.q;msg="";paint();return}
    const f=e.target.closest("[data-f]");if(f){fsel=+f.dataset.f;msg="";paint();return}
    if(e.target.closest("[data-fnew]")){fsel="new";msg="";paint();return}
    if(e.target.id==="qa_send"){const a=$("#qa_a").value.trim();if(!a){$("#qa_a").focus();return}e.target.disabled=true;
      try{await R("oncool_ed_answer",{p_token:T(),p_id:sel,p_answer:a,p_faq:$("#qa_f").checked,p_cat:$("#qa_c").value,p_q:$("#qa_fq").value.trim()});msg="답변을 보냈습니다.";await load()}catch(x){msg="보내지 못했습니다: "+x.message}paint();return}
    if(e.target.id==="fq_save"){const p={cat:$("#fq_c").value,tag:$("#fq_t").value,sort:+$("#fq_s").value||200,active:$("#fq_on").checked,q:$("#fq_q").value.trim(),a:$("#fq_a").value.trim(),src:$("#fq_src").value.trim()};
      if(!p.q||!p.a){msg="질문과 답변을 모두 입력해 주세요.";paint();return}e.target.disabled=true;
      try{const r=await R("oncool_ed_faq_save",{p_token:T(),p_id:fsel==="new"?null:fsel,p});msg="저장했습니다.";await load();fsel=r&&r.id||fsel}catch(x){msg="저장하지 못했습니다: "+x.message}paint()}});
  v.addEventListener("change",e=>{if(e.target.id==="qa_f"){const i=$("#qa_fq");if(i)i.hidden=!e.target.checked}});
  document.addEventListener("click",e=>{const n=e.target.closest(".ni");if(n&&/질문을 남겼어요/.test(n.textContent)&&T()){sub="wait";show(true)}});
  const st=document.createElement("style");st.textContent=`
#vt-q .qn{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:999px;background:#e0603a;color:#fff;font-size:11px;font-weight:800;padding:0 5px;margin-left:4px}
.qa-tabs{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 10px}.qa-tabs button{font:inherit;font-size:13px;font-weight:700;border-radius:999px;padding:6px 12px;background:var(--surface);border:1px solid var(--line);color:var(--mute);cursor:pointer}.qa-tabs button.on{background:var(--pri);color:#fff;border-color:var(--pri)}.qa-hint{font-size:12px;color:var(--mute);margin-left:6px}
.qa-g{display:grid;grid-template-columns:minmax(260px,380px) minmax(0,1fr);gap:12px;align-items:start}@media(max-width:760px){.qa-g{grid-template-columns:1fr}}
.qa-l{display:flex;flex-direction:column;gap:6px}.qa-li{all:unset;cursor:pointer;background:var(--surface);border-radius:12px;box-shadow:var(--lift);padding:10px 12px;display:flex;flex-direction:column;gap:3px}.qa-li.on{outline:2px solid var(--pri)}.qa-li.off{opacity:.55}.qa-li b{font-size:13.5px;line-height:1.45}.qa-li small{font-size:12px;color:var(--mute)}
.qa-d{display:flex;flex-direction:column;gap:8px}.qa-q{font-size:15px;font-weight:700;line-height:1.55}.qa-m{font-size:12.5px;color:var(--mute)}
.qa-d textarea,.qa-d input:not([type=checkbox]):not([type=number]){width:100%;box-sizing:border-box;font:inherit;font-size:14px}.qa-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px}.qa-row select{width:auto!important}
.qa-msg{font-size:13px;color:var(--green);font-weight:700}.qa-empty{color:var(--mute);font-size:13.5px;margin:6px 2px}`;document.head.appendChild(st)}
return {hook(rpcS,tok){R=rpcS;T=tok;if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setup();load()});else{setup();load()}}};
})();
