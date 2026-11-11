/* 복지관 방문 담당 계정: 복지관·동행 방문 가구를 추천자 화면에서 바로 (2026-11-12) */
(function(){
const $=s=>document.querySelector(s),e=s=>CS.esc(s);
let V=[];
const WK=["resident","income","bank","consent_own","consent","pledge"];
const cnt=c=>WK.filter(k=>((c.docs||{})[k]||{}).got).length;
const md=d=>d?Number(d.slice(5,7))+"/"+Number(d.slice(8,10)):"";
function row(x){const c=x.case,done=!!c.w_done_at,n=cnt(c);
  const k=done?"rev":"todo",lb=done?"제출 완료":(c.visit_mode==="동행"?"동행 방문":"복지관 방문");
  return `<div class="hr k-${k}"><button type="button" class="hrb" data-vr="${e(c.id)}"><span class="hn"><b>${e(x.elder_name)}</b><small>${e(x.dong||"")}</small></span><span class="hbdg">${done?"":"● "}${lb}</span><span class="hs">서류 ${n}/${WK.length}${c.doc_due?" · 마감 "+md(c.doc_due):""}${c.visit_date?" · 방문 "+md(c.visit_date):""} · 추천 ${e(x.worker_name||"")}</span><span class="hgo" aria-hidden="true">›</span></button></div>`}
async function load(){try{const r=await rpc("oncool_w_visits",{p_token:TOKEN});return r&&r.visitor?r:null}catch(err){return null}}
async function show(){const r=await load();let box=$("#vlist");
  if(!r){if(box)box.remove();return}
  V=r.rows||[];if(!box){box=document.createElement("div");box.id="vlist";($("#hlist")||$("#golist")).after(box)}
  const todo=V.filter(x=>!x.case.w_done_at).length;
  box.innerHTML=`<div class="vhead"><b>복지관 방문 가구</b><span>${V.length}곳${todo?` · 할 일 ${todo}곳`:""}</span></div>`+(V.length?V.map(row).join(""):'<p class="hint" style="margin:0">복지관 방문 예정 가구가 없습니다.</p>')}
const _gh=goHome;goHome=async function(){$("#list").classList.remove("vmode");tt("내가 추천한 가구");await _gh.apply(this,arguments);if(TOKEN)show()};
document.addEventListener("click",ev=>{if(ev.target.closest("#golist")){$("#list").classList.remove("vmode");tt("내가 추천한 가구")}},true);
function tt(t){const h=$("#list > h2");if(h)h.textContent=t}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-vr]");if(!b)return;const x=V.find(v=>v.case.id===b.dataset.vr);if(!x)return;
  window.__asVisitor=true;view("list");$("#mine").innerHTML="";$("#cedit").hidden=false;$("#list").classList.add("vmode");tt("🏠 복지관 방문 가구");
  CSE.open(x.case,Object.assign({},x,{worker_name:x.worker_name}));$("#cedit").scrollIntoView({block:"start"})});
{const _o=CSE.open;CSE.open=function(c){if(!V.some(v=>v.case.id===c.id))window.__asVisitor=false;return _o.apply(this,arguments)}}
})();
