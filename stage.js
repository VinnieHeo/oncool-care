/* 사례 단계 (2026-11-16 · 11/18 탭·색) */
/* 사례 단계 (2026-11-16): ① 추천자 제출 완료 → ② 담당자 서류 확인 완료 → ③ 복지관 선정 완료 → ④ 협회 선정 완료
   저장 값은 그대로(업로드완료·서류완비·선정), 화면 이름만 바꿈. ④는 '선정' + 협회 승인일. 위원회상정은 ②로 봄. */
window.STG=(function(){
const N={"조사중":"조사중","업로드완료":"1. 추천자 제출 완료","서류완비":"2. 담당자 서류 확인 완료","위원회상정":"2. 담당자 서류 확인 완료","선정":"3. 복지관 선정 완료","보완중":"보완중","보류":"보류","탈락":"탈락"};
const S={"조사중":"조사중","업로드완료":"제출 완료","서류완비":"확인 완료","위원회상정":"확인 완료","선정":"복지관 선정","보완중":"보완중","보류":"보류","탈락":"탈락"};
const step=c=>c.stage==="선정"&&c.kaswc_approved?4:({"업로드완료":1,"서류완비":2,"위원회상정":2,"선정":3}[c.stage]||0);
const name=c=>step(c)===4?"4. 협회 선정 완료":(N[c.stage]||c.stage||"");
const bd=n=>n?`<i class="stg-n">${n}</i>`:"";
const nameH=c=>{const n=step(c);return bd(n)+esc(n===4?"협회 선정 완료":String(N[c.stage]||c.stage||"").replace(/^\d\. /,""))};
const short=c=>step(c)===4?"협회 선정":(S[c.stage]||c.stage||"");
const G=[["보완중 · 서류 다시 받는 중",c=>c.stage==="보완중",0,0,"","sgb","보완중"],["",c=>c.stage==="서류완비"||c.stage==="위원회상정",0,2,"담당자 서류 확인 완료","sg2","확인 완료"],["확인할 차례 · ",c=>c.stage==="업로드완료",1,1,"추천자 제출 완료","sg1","제출 완료"],["",c=>c.stage==="선정"&&!c.kaswc_approved,0,3,"복지관 선정 완료","sg3","복지관 선정"],["",c=>c.stage==="선정"&&!!c.kaswc_approved,0,4,"협회 선정 완료","sg4","협회 선정"],
  ["조사중 · 가나다순",c=>!c.stage||c.stage==="조사중",0,0,"","sgz","조사중"],["보류 · 탈락",c=>c.stage==="보류"||c.stage==="탈락",0,0,"","sgx","보류·탈락"]];
/* 단계 탭 (11/18): 누르면 그 단계만 · 기본 '전체' */
let TAB="";try{TAB=sessionStorage.getItem("oc_stab")||""}catch(_){}
function split(cases){const used=new Set();return G.map(g=>{const L=cases.filter(c=>!used.has(c)&&g[1](c));L.forEach(c=>used.add(c));return L})}
function tabs(cases){const cl=document.getElementById("clist");if(!cl)return;let t=document.getElementById("stg_tabs");if(!t){t=document.createElement("div");t.id="stg_tabs";t.className="stg-tabs";cl.before(t);
    t.onclick=e=>{const b=e.target.closest("[data-tab]");if(!b)return;TAB=b.dataset.tab;try{sessionStorage.setItem("oc_stab",TAB)}catch(_){}const fs=document.getElementById("cfs");if(fs)fs.dispatchEvent(new Event("change"))}}
  const S=split(cases);if(TAB&&!G.some((g,i)=>g[5]===TAB&&S[i].length))TAB="";
  t.innerHTML=`<button type="button" data-tab="" class="${TAB?"":"on"}" style="--k:var(--ink)">전체 <b>${cases.length}</b></button>`+G.map((g,i)=>S[i].length?`<button type="button" data-tab="${g[5]}" class="${g[5]}${TAB===g[5]?" on":""}">${bd(g[3])}${esc(g[6])} <b>${S[i].length}</b></button>`:"").join("")}
/* 보완중 카드에 보완 요청 내용 (11/18) */
function drNote(h,L){const T=document.createElement("template");T.innerHTML=h;const lb=k=>((window.CS&&CS.DOCS||[]).find(x=>x.k===k)||{}).l||k;
  T.content.querySelectorAll(".cc[data-cid]").forEach(el=>{const c=L.find(x=>String(x.id)===el.dataset.cid);if(!c)return;const q=c.doc_req||{};
    const d=new Date(q.at),md=isNaN(d)?"":`${d.getMonth()+1}/${d.getDate()} 요청`;const docs=(q.docs||[]).map(lb).map(s=>s.replace(/\s*\(.*\)\s*$/,""));
    const x=document.createElement("div");x.className="cc-dr";x.innerHTML=(docs.length?`<b>다시 받을 서류</b> ${esc(docs.join(", "))}`:"")+(q.note?`<p>${esc(q.note)}</p>`:(docs.length?"":"<p>보완 내용이 적혀 있지 않아요.</p>"))+(md?`<small>${md}</small>`:"")+ctHTML(c);
    const top=el.querySelector(".cc-top");(top||el.firstElementChild).after(x)});return T.innerHTML}
/* 보완중 카드 연락 체크 (11/18): 누르면 바로 서버에 쌓임 */
const CT={},CTS=["연락함","부재","문자 보냄","회신 대기"];
const ctFmt=x=>{const d=new Date(x.at);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} ${x.s}${x.by?" ("+x.by+")":""}`};
function ctLast(c){const a=c.contact||[];return a.length?a[a.length-1]:null}
function ctHTML(c){CT[c.id]=c;const l=ctLast(c);return `<div class="cc-ct">${CTS.map(s=>`<button type="button" data-ct="${s}" data-cid="${esc(c.id)}"${l&&l.s===s?' class="on"':""}>${s==="연락함"?"☎ ":""}${s}</button>`).join("")}</div><small class="cc-ctl" data-ctl="${esc(c.id)}">${l?"마지막: "+esc(ctFmt(l)):"연락 기록 없음"}</small>`}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-ct]");if(!b)return;e.stopPropagation();e.preventDefault();if(b.disabled)return;
  const id=b.dataset.cid,s=b.dataset.ct,box=b.parentNode,lab=document.querySelector(`[data-ctl="${CSS.escape(id)}"]`);box.querySelectorAll("button").forEach(x=>x.disabled=true);
  try{const r=await rpcS("oncool_ed_contact_add",{p_token:sessionStorage.oc_etok,p_case:id,p_status:s});if(CT[id])CT[id].contact=r;const cur=window.CSE&&CSE.current();if(cur&&cur.id===id)cur.contact=r;
    box.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));const l=r[r.length-1];if(lab&&l)lab.textContent="마지막: "+ctFmt(l)}
  catch(x){if(lab)lab.textContent="저장하지 못했어요: "+(x.message||x)}finally{box.querySelectorAll("button").forEach(x=>x.disabled=false)}},true);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function hook(){if(!window.CS||CS.__stg)return;CS.__stg=1;const orig=CS.listHTML;
  CS.listHTML=function(cases,refs){tabs(cases);if(!cases.length)return orig(cases,refs);const S=split(cases);let out="";
    G.forEach(([t,f,top,gn,gt,cls],i)=>{const L=S[i];if(!L.length||(TAB&&TAB!==cls))return;
      let h=orig(L,refs).replace(/<h3 class="cc-h">[\s\S]*?<\/h3>/g,"").replace(/<\/div><div class="cgrid">/g,"").replace(/<div class="cc" /g,`<div class="cc ${cls}" `);
      h=h.replace(/<span class="stg stg-([^"]*)">[^<]*<\/span>/g,(m,s)=>{const c=L.find(x=>x.stage===s)||{stage:s};return `<span class="stg stg-${s}${step(c)===4?" stg-k4":""}">${bd(step(c))}${esc(short(c))}</span>`});
      if(cls==="sgb")h=drNote(h,L);
      out+=`<h3 class="cc-h ${cls}${top?" cc-top1":""}">${esc(t)}${bd(gn)}${esc(gt||"")} <b>${L.length}</b></h3>`+h});
    const used=new Set(S.flat()),rest=cases.filter(c=>!used.has(c));if(rest.length&&!TAB)out+=orig(rest,refs);return out||'<p class="cc-empty">이 단계에 해당하는 가구가 없어요.</p>'};
  const fs=document.getElementById("cfs");if(fs){fs.value="";fs.style.display="none"}if(fs)[...fs.options].forEach(o=>{if(!o.hasAttribute("value"))o.value=o.textContent;if(o.value==="위원회상정")o.remove();else if(N[o.value]&&o.value)o.textContent=N[o.value]});
  if(window.CSE){const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{panel()}catch(e){console.error(e)}return x}}
  new MutationObserver(()=>{const c=CSE.current();if(!c)return;const p=document.getElementById("stg_box");if(p&&p.dataset.st!==key(c)){panel();return}document.querySelectorAll("#c_chips .stg").forEach(x=>{if(!x.dataset.stg){x.dataset.stg=1;x.innerHTML=nameH(c)}})}).observe(document.getElementById("cedit"),{subtree:true,childList:true,characterData:true});
  const st=document.createElement("style");st.textContent=`.cc-h.cc-top1{color:var(--pri)}.stg-선정{background:var(--green-soft,#e5f6ee);color:var(--green,#159a5c);font-weight:800}.stg.stg-k4{background:#e2f4f4;color:#0e8a8a}.stg-n{font-style:normal;display:inline-grid;place-items:center;min-width:16px;height:16px;border-radius:50%;background:currentColor;margin-right:4px;font-size:10.5px;font-weight:800;line-height:1;vertical-align:middle;position:relative;top:-1px}.stg:has(.stg-n){display:inline-flex;align-items:center}.stg:has(.stg-n) .stg-n{top:0}.stg-n{color:inherit}.stg .stg-n,.cc-h .stg-n{background:none;border:1.5px solid currentColor;margin:0 4px 0 0}.stg-서류완비,.stg-위원회상정{background:var(--pri-soft,#eceffd);color:var(--pri);font-weight:800}
#stg_box{display:flex;flex-direction:column;gap:12px;margin:10px 0 14px}
.stg-steps{display:flex;align-items:flex-start;overflow-x:auto;padding:4px 2px 2px}
.stg-s{flex:1;min-width:84px;display:flex;flex-direction:column;align-items:center;gap:5px;position:relative;font-size:12.5px;text-align:center;color:var(--mute);line-height:1.35}
.stg-s::before{content:"";position:absolute;top:13px;left:-50%;width:100%;height:3px;background:var(--line);z-index:0}.stg-s:first-child::before{display:none}
.stg-s i{font-style:normal;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--surface,#fff);display:grid;place-items:center;font-weight:800;font-size:13px;z-index:1}
.stg-s.done i{background:var(--green,#159a5c);border-color:var(--green,#159a5c);color:#fff}.stg-s.done::before,.stg-s.cur::before{background:var(--green,#159a5c)}
.stg-s.cur i{border-color:var(--pri);color:var(--pri);box-shadow:0 0 0 4px color-mix(in srgb,var(--pri) 15%,transparent)}.stg-s.cur{color:var(--ink);font-weight:800}
.stg-act{display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:color-mix(in srgb,var(--pri) 8%,transparent);border-radius:12px;padding:12px}
.stg-act p{margin:0 auto 0 0;font-size:13px;line-height:1.55}.stg-act.off{background:color-mix(in srgb,var(--warm,#c77a12) 10%,transparent)}
.stg-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:2px 2px 12px}
.stg-tabs button{flex:none;font:inherit;font-size:13px;font-weight:700;border:1.5px solid color-mix(in srgb,var(--k) 45%,var(--line));background:var(--surface,#fff);color:var(--k);border-radius:999px;padding:6px 12px;height:auto;min-height:0;line-height:1.3;cursor:pointer;display:inline-flex;align-items:center;gap:2px;white-space:nowrap}
.stg-tabs .stg-n{background:none;border:1.5px solid currentColor;margin:0 4px 0 0}.stg-tabs button b{font-size:12px;margin-left:3px;opacity:.75}
.stg-tabs button.on{background:var(--k);border-color:var(--k);color:#fff}.stg-tabs button[data-tab=""].on{color:var(--surface,#fff)}
.sg1{--k:#7c4dde}.sg2{--k:#3b5bdb}.sg3{--k:#159a5c}.sg4{--k:#b07d0a}.sgb{--k:#d9730d}.sgz{--k:#7d8699}.sgx{--k:#d0505a}
.cc.sg1,.cc.sg2,.cc.sg3,.cc.sg4,.cc.sgb,.cc.sgz,.cc.sgx{border-left:5px solid var(--k);background:color-mix(in srgb,var(--k) 5%,var(--surface,#fff))}
.cc.sg1 .stg,.cc.sg2 .stg,.cc.sg3 .stg,.cc.sg4 .stg,.cc.sgb .stg,.cc.sgz .stg,.cc.sgx .stg{background:color-mix(in srgb,var(--k) 14%,transparent);color:var(--k);font-weight:800}
.cc-dr{margin:6px 0 2px;padding:7px 9px;border-radius:8px;background:color-mix(in srgb,var(--k) 10%,var(--surface,#fff));font-size:12.5px;line-height:1.5;color:var(--ink)}.cc-dr b{color:var(--k);margin-right:4px}.cc-dr p{margin:2px 0 0;white-space:pre-line}.cc-dr small{display:block;color:var(--mute);font-size:11.5px;margin-top:2px}.cc-ct{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.cc-ct button{font:inherit;font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:99px;border:1.2px solid color-mix(in srgb,var(--k) 45%,var(--line));background:var(--surface,#fff);color:var(--ink);cursor:pointer;height:auto;min-height:0;line-height:1.4}.cc-ct button.on{background:var(--k);border-color:var(--k);color:#fff}.cc-ct button:disabled{opacity:.6}.stg-log{font-size:12.5px;color:var(--mute);line-height:1.6}
.cc-h.sg1,.cc-h.sg2,.cc-h.sg3,.cc-h.sg4,.cc-h.sgb,.cc-h.sgx{color:var(--k)}`;document.head.appendChild(st)}
const key=c=>(c.stage||"")+"|"+(c.kaswc_approved||"");
function setStage(v){const s=document.getElementById("c_stage");if(!s)return;s.value=v;s.dispatchEvent(new Event("change",{bubbles:true}));document.getElementById("c_save").click()}
/* 카드 순서: 증빙 서류 → 유형과 지원 금액 → 에너지 효율 개선 → 단계·판정 → 협회 사이트 입력용 요약(맨 끝) */
function reorder(root){const f=root.querySelector(".cs-form");if(!f||f.dataset.ord)return;const cards=[...f.children].filter(x=>x.classList.contains("cs-card"));
  const by=t=>cards.find(x=>{const h=x.querySelector("h3");return h&&h.textContent.trim().startsWith(t)});
  const docs=by("증빙 서류"),seq=[by("유형과 지원 금액"),by("에너지 효율 개선"),by("단계 · 판정"),f.querySelector(".kw-card")].filter(Boolean);if(!docs)return;
  let prev=docs;for(const x of seq){prev.after(x);prev=x}const kw=f.querySelector(".kw-card");if(kw)kw.style.gridColumn="1/-1";f.dataset.ord=1}
function panel(){const box0=document.getElementById("cedit");const c=window.CSE&&CSE.current();if(!box0||box0.hidden||!c)return;
  const sel=document.getElementById("c_stage");
  if(sel){[...sel.options].forEach(o=>{if(!o.hasAttribute("value"))o.value=o.textContent;if(o.value==="위원회상정"&&c.stage!=="위원회상정")o.remove();else if(N[o.value])o.textContent=N[o.value]})}
  let box=document.getElementById("stg_box");if(!box){box=document.createElement("div");box.id="stg_box";const sub=box0.querySelector(".dv-sub");(sub||box0.firstElementChild).after(box)}
  box0.querySelectorAll("#c_chips .stg").forEach(x=>{x.dataset.stg=1;x.innerHTML=nameH(c)});
  reorder(box0);
  box.dataset.st=key(c);const n=step(c),off=["보완중","보류","탈락"].includes(c.stage);
  const steps=[["조사중"],["추천자","제출 완료"],["담당자","서류 확인 완료"],["복지관","선정 완료"],["협회","선정 완료"]];
  const sh=steps.map((s,i)=>`<div class="stg-s${!off&&i<n?" done":""}${!off&&i===n?" cur":""}"><i>${!off&&i<n?"✓":i||"·"}</i>${s.join("<br>")}</div>`).join("");
  let msg="",btn="";
  if(c.stage==="보완중"){msg="<b>보완 요청을 보낸 가구예요.</b><br>추천자가 서류를 다시 올리면 1단계(추천자 제출 완료)로 돌아와요.";}
  else if(c.stage==="보류"||c.stage==="탈락"){msg=`<b>위원회 결과: ${esc(c.stage)}</b><br>다시 바꾸려면 아래 ‘단계’ 칸에서 골라 주세요.`}
  else if(n<=1){msg=n===1?"<b>서류를 하나씩 열어 확인해 주세요.</b><br>다 맞으면 ‘서류 확인 완료’를 눌러 주세요.":"<b>추천자가 아직 서류를 다 올리지 않았어요.</b><br>서류를 직접 받아 확인했으면 ‘서류 확인 완료’를 눌러 주세요.";
    btn=`<button type="button" class="sbtn pri" data-stg="chk">✓ 서류 확인 완료 → 2단계</button>${document.getElementById("dr_btn")?'<button type="button" class="sbtn" data-stg="req">보완 요청</button>':""}`}
  else if(n===2){msg="<b>사례판정위원회 결과를 넣어 주세요.</b>";btn=`<button type="button" class="sbtn pri" data-stg="선정">복지관 선정 완료 → 3단계</button><button type="button" class="sbtn" data-stg="보류">보류</button><button type="button" class="sbtn" data-stg="탈락">탈락</button>`}
  else if(n===3){msg="<b>협회 승인이 나면 ‘협회 승인일’을 넣고 저장해 주세요.</b><br>그러면 4단계(협회 선정 완료)로 바뀌어요.";btn=`<button type="button" class="sbtn pri" data-stg="kaswc">협회 승인일 넣기</button>`}
  else{msg=`<b>협회 선정 완료</b> · 승인일 ${esc(c.kaswc_approved)}`}
  const lg=(c.contact||[]).slice().reverse();
  box.innerHTML=`<div class="stg-steps">${sh}</div><div class="stg-act${off?" off":""}"><p>${msg}</p>${btn}</div>`+(lg.length?`<div class="stg-log"><b>연락 기록</b> · ${lg.map(x=>esc(ctFmt(x))).join(" · ")}</div>`:"");
  box.onclick=e=>{const b=e.target.closest("[data-stg]");if(!b)return;const a=b.dataset.stg;
    if(a==="chk"){const d=document.getElementById("dc_btn");if(d)d.click();else setStage("서류완비");return}
    if(a==="req"){const d=document.getElementById("dr_btn");if(d){d.click();d.scrollIntoView({block:"center"})}return}
    if(a==="kaswc"){const i=document.getElementById("c_kaswc_approved");if(i){i.scrollIntoView({block:"center"});i.focus();try{i.showPicker()}catch(_){}}return}
    if(a==="보류"||a==="탈락"){if(!confirm(a+"(으)로 바꿀까요?"))return}
    setStage(a)};
  const d=document.getElementById("dc_btn");if(d)d.textContent="서류 확인 완료"}
return {hook,name,short,step,panel}})();
STG.hook();
