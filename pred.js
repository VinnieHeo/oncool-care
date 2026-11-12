/* 추천 화면: 유형 예상 → 바로 가정방문 (2026-11-12) · 예상은 참고용이며 최종 유형은 사례판정위원회가 정함 */
window.PRED=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FOUR=["기름(등유) 보일러","LPG","연탄"];
const TN={"1":"저소득 에너지 취약","2":"바우처 한도 소진","3":"바우처 사각지대","4":"에너지 인프라 취약"};
function predict(p){const v=p.voucher||"",inc=p.income||"",h=p.heating||"",rs=(p.voucher_reason||"").trim();let t="",why="";const warn=[];
  if(FOUR.includes(h)){t="4";why="도시가스가 아닌 연료(등유·LPG·연탄)로 난방하는 가구입니다.";warn.push("4유형은 ‘농산어촌 등 에너지 인프라 취약지역’ 기준이어서 도심 가구는 복지관이 협회에 확인합니다.")}
  else if(v==="받았는데 다 씀"){t="2";why="작년(2025년) 에너지바우처를 다 썼고 올해도 바우처를 받는 가구입니다."}
  else if(rs){t="3";why="에너지바우처 대상이지만 쓰기 어려운 사정이 있는 가구입니다."}
  else if(v==="받는 중"){why="바우처를 받고 있어 1유형은 아닙니다.\n작년 바우처를 다 썼다면 2유형, 쓰기 어려운 사정이 있다면 3유형입니다."}
  else if(v==="안 받음"){t="1";why="에너지바우처를 받지 않는 저소득 가구입니다.";if(inc==="기초생활수급자")warn.push("수급자 가구에 노인·장애인·영유아 등이 있으면 바우처 대상입니다.\n바우처 대상이면 1유형이 아닐 수 있습니다.")}
  else why="에너지바우처를 받는지 가정방문 때 확인하면 유형이 정해집니다.";
  if(inc==="해당 없음")warn.push("소득 기준(기준 중위소득 150% 이하)을 충족해야 합니다.\n가정방문 때 건강보험료 납부확인서로 확인합니다.");
  const D=[["주민등록등본","가구원 전원"]];
  if(t==="1")D.push(inc==="기초생활수급자"?["수급자증명서",""]:["건강보험료 납부확인서","최근 3개월"]);
  else if(t==="2")D.push(["2026년 에너지이용권 결정통지서","없으면 행정복지센터에서 재발급"],["콜센터(1600-3190) 공동 청취","2025년 잔액 1만 원 이하 확인 · 별도 서류 없음"]);
  else if(t==="3")D.push(["2026년 에너지이용권 결정통지서 또는 바우처 대상 증빙 서류",""],["바우처를 쓰기 어려운 사정","현장 사진 또는 메모"]);
  else if(t==="4")D.push(["건강보험료 납부확인서 또는 수급자증명서",""],["난방 연료 사진","도시가스 미공급 근거"]);
  else D.push(["소득 증빙","수급자증명서 또는 건강보험료 납부확인서"],["2026년 에너지이용권 결정통지서","바우처를 받는 경우"]);
  if(t!=="4")D.push(["대상자 본인 명의 통장 사본",""]);
  D.push(["개인정보 동의서 2장 · 용도 약정서","휴대폰 전자서명"]);
  return {t,name:t?TN[t]:"",why,warn,docs:D}}
let P=null;
function html(r){const br=s=>esc(s).replace(/\n/g,"<br>");
  return `<div class="pd-res"><div class="pd-k">입력하신 내용으로 보면</div><div class="pd-t">${r.t?`${r.t}유형 (${esc(r.name)})으로 예상됩니다.`:"유형은 가정방문 후에 정해집니다."}</div><p>${br(r.why)}<br>최종 유형은 복지관 사례판정위원회에서 정합니다.</p>${r.warn.map(w=>`<p class="pd-w">${br(w)}</p>`).join("")}</div>
  <div class="card pd-docs"><h3>가정방문 때 준비할 서류</h3><ol>${r.docs.map(([a,b])=>`<li>${esc(a)}${b?` <small>(${esc(b)})</small>`:""}</li>`).join("")}</ol></div>
  <div class="card pd-next"><h3>다음 단계: 가정방문과 증빙서류 업로드</h3><p>추천은 가정방문을 하고 증빙서류를 올려야 접수가 완료됩니다.<br>방문하실 때 이 화면에서 바로 진행해 주세요.</p></div>
  <p class="err" id="pd_err" hidden></p>
  <button class="btn" type="button" id="pd_go">가정방문 시작하기</button>
  <button class="btn sec" type="button" id="pd_save">오늘은 저장만 하기</button>
  <p class="hint">저장만 하면 ‘내 추천 목록’에 ‘가정방문·서류 필요’로 표시되며, 방문 후 이어서 서류를 올리실 수 있습니다.</p>
  <button class="linkbtn" type="button" id="pd_back">← 입력 내용 고치기</button>`}
function show(p){P=p;const el=document.getElementById("pred");el.innerHTML=html(predict(p));view("pred");
  document.getElementById("pd_back").onclick=()=>view("f");
  document.getElementById("pd_go").onclick=()=>send(true);document.getElementById("pd_save").onclick=()=>send(false)}
async function send(go){const err=document.getElementById("pd_err"),bs=[...document.querySelectorAll("#pd_go,#pd_save")];showErr(err,"");bs.forEach(b=>b.disabled=true);
  try{const r=await rpc("oncool_w_submit",{p_token:TOKEN,p:P});
    if(!(r>0)){showErr(err,"지금은 접수가 많습니다. 잠시 후 다시 눌러 주세요.");return}
    P=null;document.getElementById("f").reset();
    if(go){MINE=await rpc("oncool_w_list",{p_token:TOKEN});const ref=(MINE||[]).find(x=>x.receipt_no===r);
      if(ref){const b=document.createElement("button");b.type="button";b.hidden=true;b.dataset.hr=ref.id;document.body.appendChild(b);b.click();b.remove();return}}
    document.getElementById("rno").textContent=r;
    document.getElementById("dmsg").innerHTML="추천이 저장되었습니다.<br>가정방문을 하고 증빙서류를 올려야 접수가 완료됩니다.<br>‘내 추천 목록’에서 이어서 진행해 주세요.";view("done")}
  catch(x){showErr(err,/session/.test(x.message)?"다시 로그인이 필요합니다. 새 창에서 로그인한 뒤 다시 눌러 주세요. 입력한 내용은 그대로 있습니다.":"보내지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요. 입력한 내용은 그대로 있습니다.")}
  finally{bs.forEach(b=>b.disabled=false)}}
{const st=document.createElement("style");st.textContent=`#pred{display:flex;flex-direction:column;gap:12px}
.pd-res{background:linear-gradient(135deg,color-mix(in srgb,var(--warm) 10%,var(--surface)),var(--surface));border:1.5px solid var(--warm);border-radius:18px;padding:18px}
.pd-k{font-size:13px;font-weight:700;color:var(--warm)}.pd-t{font-size:21px;font-weight:900;margin:4px 0 8px;line-height:1.35}.pd-res p{margin:0;font-size:14px;color:var(--mute);line-height:1.65}.pd-res .pd-w{margin-top:8px;color:var(--amber);font-weight:600}
.pd-docs h3,.pd-next h3{margin:0 0 8px;font-size:16px}.pd-docs ol{margin:0;padding-left:20px;line-height:1.85;font-size:14.5px}.pd-docs small{color:var(--mute)}
.pd-next{border:1.5px solid var(--pri)}.pd-next h3{color:var(--pri)}.pd-next p{margin:0;font-size:14px;line-height:1.65}
.vr-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}.vr-chips button{font:inherit;font-size:13px;border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:var(--surface);color:var(--ink);cursor:pointer}`;document.head.appendChild(st)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-vr]");if(!b)return;const t=document.getElementById("voucher_reason");if(!t)return;const s=b.dataset.vr;if(!t.value.includes(s))t.value=(t.value.trim()?t.value.trim()+" ":"")+s;t.focus()});
/* 가정방문 화면 맨 위: 예상 유형 + 필요한 서류 (11/12) · 방문 중 바우처·난방을 고치면 바로 다시 계산 */
let VR=null,VC=null,FOLD=false;try{FOLD=localStorage.getItem("oc_tyfold")==="1"}catch(e){}
function vval(id,d){const e=document.getElementById(id);return e&&e.value?e.value:d}
function tyHTML(){const r=VR||{},c=VC||{};const q=Object.assign({},r,{voucher:vval("c_v_voucher",c.v_voucher||r.voucher),heating:vval("c_v_heating",c.v_heating||r.heating),income:vval("c_v_income",c.v_income||r.income)});
  const x=predict(q),tf=vval("c_type_final",c.type_final||""),br=s=>esc(s).replace(/\n/g,"<br>");
  const head=tf?`<div class="ty-k">복지관 판정 유형</div><div class="ty-t">${esc(tf)} (${esc(TN[tf[0]]||"")})</div>`:`<div class="ty-k">추천 내용으로 본 예상 유형</div><div class="ty-t">${x.t?`${x.t}유형 (${esc(x.name)})`:"아직 정해지지 않았어요"}</div>`;
  return `${head}<p>${br(x.why)}${tf?"":"<br>최종 유형은 복지관 사례판정위원회에서 정합니다."}</p>${x.warn.map(w=>`<p class="ty-w">${br(w)}</p>`).join("")}
   <details${FOLD?"":" open"}><summary>이 유형에 필요한 서류</summary><ul>${x.docs.map(([a,b])=>`<li>${esc(a)}${b?` <small>· ${esc(b)}</small>`:""}</li>`).join("")}</ul></details>`}
function tyPaint(){const b=document.getElementById("ty_box");if(b)b.innerHTML=tyHTML()}
if(window.CSE){const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{
  const nav=document.querySelector("#cedit .wz");if(!nav||document.getElementById("ty_box"))return x;VR=r||{};VC=c||{};
  nav.insertAdjacentHTML("beforebegin",`<div class="ty-box" id="ty_box"></div>`);tyPaint();
  const b=document.getElementById("ty_box");b.addEventListener("toggle",e=>{FOLD=!e.target.open;try{localStorage.setItem("oc_tyfold",FOLD?"1":"0")}catch(_){}},true);
  document.getElementById("cedit").addEventListener("change",e=>{if(e.target.matches&&e.target.matches("#c_v_voucher,#c_v_heating,#c_v_income"))tyPaint()});
 }catch(e){console.error(e)}return x}}
{const st=document.createElement("style");st.textContent=`.ty-box{margin:0 0 12px;padding:14px;border-radius:14px;border:1.5px solid var(--pri);background:color-mix(in srgb,var(--pri) 6%,transparent)}
.ty-box .ty-k{font-size:12.5px;color:var(--mute);font-weight:700}.ty-box .ty-t{font-size:18px;font-weight:800;margin:2px 0 6px}.ty-box p{margin:0;font-size:13px;color:var(--mute);line-height:1.55}.ty-box p.ty-w{margin-top:6px;color:#b8620e}
.ty-box ul{margin:8px 0 0;padding-left:18px;font-size:13.5px;line-height:1.7}.ty-box ul small{color:var(--mute)}.ty-box summary{cursor:pointer;font-weight:700;font-size:13.5px;margin-top:8px;color:var(--pri)}`;document.head.appendChild(st)}
return {predict,show}})();
