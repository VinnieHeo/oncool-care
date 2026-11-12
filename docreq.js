/* 보완 요청 (2026-11-12) · 보내면 단계가 ‘보완중’ · 문자는 반자동(문구 채워진 문자 버튼, 전송은 직원이 직접): 직원(편집) → 카드를 미제출로 되돌리고 빠진 서류·사유를 추천 선생님 화면에 표시 */
window.DOCREQ=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lbl=k=>((window.CS&&CS.DOCS||[]).find(x=>x.k===k)||{}).l||k;
const md=s=>{const d=new Date(s);return isNaN(d)?"":`${d.getMonth()+1}/${d.getDate()}`};
const CSS=`.dr-box{border:1.5px solid var(--warm);background:color-mix(in srgb,var(--warm) 8%,var(--surface));border-radius:14px;padding:12px 14px;margin:0 0 12px;display:flex;flex-direction:column;gap:6px}
.dr-box b{font-size:15px;color:var(--warm)}.dr-box p{margin:0;font-size:13.5px;line-height:1.6}.dr-box ul{margin:0;padding-left:20px;font-size:13.5px;line-height:1.7}
.dr-pan{border:1px dashed var(--line);border-radius:12px;padding:12px;margin-top:10px;display:flex;flex-direction:column;gap:8px;width:100%}.dr-pan .dr-ck{display:flex;flex-wrap:wrap;gap:6px 14px}.dr-pan label{display:flex;flex-direction:row!important;align-items:center;gap:6px;font-size:13.5px;font-weight:600;margin:0}
.dr-pan input[type=checkbox]{width:18px;height:18px;-webkit-appearance:auto;appearance:auto;accent-color:var(--pri)}.dr-pan textarea{width:100%;box-sizing:border-box;font:inherit;font-size:14px;min-height:60px}.dr-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}`;
function style(){if(document.getElementById("dr_css"))return;const s=document.createElement("style");s.id="dr_css";s.textContent=CSS;document.head.appendChild(s)}
function boxHTML(q,staff){return `<div class="dr-box"><b>${staff?"보완을 요청한 가구입니다":"복지관에서 서류 보완을 요청했습니다"}</b>${(q.docs||[]).length?`<ul>${q.docs.map(k=>`<li>${esc(lbl(k))}</li>`).join("")}</ul>`:""}${q.note?`<p>${esc(q.note)}</p>`:""}<p style="color:var(--mute);font-size:12.5px">${md(q.at)} 요청${staff&&q.by?" · "+esc(q.by):""}${staff?"":" · 서류를 다시 올린 뒤 ‘방문·서류 완료’를 눌러 주세요."}</p></div>`}
/* 추천자 화면: 카드 맨 위에 요청 내용 */
function worker(){style();const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{const f=document.querySelector("#cedit .cs-form");if(f&&c.doc_req&&!c.w_done_at&&!document.querySelector("#cedit .dr-box"))f.insertAdjacentHTML("beforebegin",boxHTML(c.doc_req,false))}catch(e){console.error(e)}return x}}
/* 직원 화면: ‘추가 서류 요청’ 버튼 */
function staff(rpcS,tok,onDone){style();const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{if(!tok())return x;
    const f=document.querySelector("#cedit .cs-form");if(f&&c.doc_req&&!c.w_done_at&&!document.querySelector("#cedit .dr-box"))f.insertAdjacentHTML("beforebegin",boxHTML(c.doc_req,true));
    const acts=document.querySelector("#cedit .acts");if(!acts||document.getElementById("dr_btn"))return x;
    const b=document.createElement("button");b.type="button";b.className="sbtn";b.id="dr_btn";b.textContent="보완 요청";acts.insertBefore(b,document.getElementById("c_msg"));
    b.onclick=()=>{let p=document.getElementById("dr_pan");if(p){p.remove();return}p=document.createElement("div");p.id="dr_pan";p.className="dr-pan";
      p.innerHTML=`<b>보완할 서류</b><div class="dr-ck">${CS.DOCS.filter(d=>d.k!=="confirm").map(d=>`<label><input type="checkbox" value="${d.k}"> ${esc(d.l)}</label>`).join("")}</div>
      <label style="flex-direction:column!important;align-items:stretch">요청 사유<textarea id="dr_note" maxlength="300" placeholder="예) 건강보험료 납부확인서가 발급한 지 3개월이 지났습니다. 새로 발급받아 올려 주세요."></textarea></label>
      <div class="dr-row"><button type="button" class="sbtn pri" id="dr_send">보완 요청 보내기</button><span class="msg" id="dr_msg"></span></div>
      <p class="hint" style="margin:0">보내면 단계가 ‘보완중’으로 바뀌고, 고른 서류는 ‘받음’이 해제됩니다.<br>보낸 뒤 선생님께 보낼 문자가 준비돼요.</p>`;acts.after(p);
      document.getElementById("dr_send").onclick=async e=>{const docs=[...p.querySelectorAll(".dr-ck input:checked")].map(i=>i.value),note=document.getElementById("dr_note").value.trim(),m=document.getElementById("dr_msg");
        if(!docs.length&&!note){m.textContent="다시 받을 서류를 고르거나 사유를 적어 주세요.";return}e.target.disabled=true;
        try{const nc=await rpcS("oncool_ed_doc_request",{p_token:tok(),p_case:c.id,p_docs:docs,p_note:note});const cur=CSE.current()||c;Object.assign(cur,nc);m.textContent="보완 요청을 보냈습니다.";onDone&&onDone(cur);smsPanel(p,r,docs,()=>CSE.open(cur,r))}
        catch(x){e.target.disabled=false;m.textContent="보내지 못했습니다: "+(/locked/.test(x.message)?"선정이 끝난 가구는 요청할 수 없습니다.":x.message)}}}}catch(e){console.error(e)}return x}}
/* 반자동 문자: 번호·문구를 채운 문자 버튼 + 복사 (전송은 직원이 직접) */
function smsPanel(p,r,docs,done){const d=String(r.worker_phone||"").replace(/\D/g,""),ok=/^01\d{8,9}$/.test(d);
  const nm=String(r.elder_name||"");const mk=nm?nm[0]+"○○":"";
  const body=`[만안복지관 온앤쿨케어]\n${r.worker_name||""} 선생님, 추천하신 ${mk} 님 가구에 서류 보완이 필요해요.\n${docs.length?"보완할 서류: "+docs.map(lbl).map(s=>s.replace(/\s*\(.*\)\s*$/,"")).join(", ")+"\n":""}아래 링크에서 확인하고 다시 올려 주세요.\nhttps://vinnieheo.github.io/oncool-care/\n문의 070-8978-7710`;
  const f=ok?d.replace(/(\d{3})(\d{3,4})(\d{4})/,"$1-$2-$3"):"";
  p.innerHTML=`<b>선생님께 문자 보내기</b><p class="hint" style="margin:0">${ok?`받는 사람: ${esc(r.worker_name||"")} 선생님 · ${f}`:"선생님 휴대폰 번호가 없어요. 문구를 복사해서 보내 주세요."}</p>
   <textarea id="dr_sms" style="min-height:150px">${esc(body)}</textarea>
   <div class="dr-row">${ok?`<a class="sbtn pri" id="dr_sms_go" href="#" style="text-decoration:none">휴대폰 문자로 보내기</a>`:""}<button type="button" class="sbtn" id="dr_sms_cp">문구 복사</button><button type="button" class="sbtn" id="dr_sms_x">닫기</button><span class="msg" id="dr_sms_m"></span></div>
   <p class="hint" style="margin:0">휴대폰에서 누르면 문자 앱이 열려요. 전송은 직접 눌러 주세요.<br>PC에서는 ‘문구 복사’ 후 U+ 문자로 보내 주세요.</p>`;
  const ta=document.getElementById("dr_sms");
  if(ok)document.getElementById("dr_sms_go").onclick=e=>{e.preventDefault();location.href=`sms:${d}?body=${encodeURIComponent(ta.value)}`};
  document.getElementById("dr_sms_cp").onclick=async()=>{const m=document.getElementById("dr_sms_m");try{await navigator.clipboard.writeText(ta.value);m.textContent="복사했어요."}catch(e){ta.select();m.textContent="선택했어요. Ctrl+C로 복사해 주세요."}};
  document.getElementById("dr_sms_x").onclick=()=>{p.remove();done&&done()}}
return {worker,staff}})();
