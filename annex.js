/* 협회 별첨 2 「전년도 에너지바우처 소진 조회 확인서」 출력 (관리 화면, 편집 비밀번호) · 원본 양식(별첨문서_261106.hwp) 그대로 */
window.ANNEX=(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ORG="안양시만안종합사회복지관";
let RPC=null,TOK=()=>"",CFG=null;
const b8=b=>{if(!/^\d{6}$/.test(b||""))return "";let y=+b.slice(0,2);y+=y>new Date().getFullYear()%100?1900:2000;return `${y}-${b.slice(2,4)}-${b.slice(4,6)}`};
const dot=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(s||"");return m?`${m[1]}. ${m[2]}. ${m[3]}.`:""};
async function cfg(force){if(CFG&&!force)return CFG;CFG=await RPC("oncool_ed_annex_cfg",{p_token:TOK()})||{};return CFG}
const CSS=`@font-face{font-family:"AnxB";src:local("휴먼명조"),local("HumanMyeongjo"),local("함초롬바탕"),local("HCR Batang"),local("HCRBatang"),local("바탕"),local("Batang")}
@font-face{font-family:"AnxT";src:local("HY헤드라인M"),local("HYHeadLine-Medium"),local("HYHeadLine M"),local("Malgun Gothic Bold"),local("MalgunGothicBold"),local("맑은 고딕 Bold")}
@page{size:A4;margin:20mm 21mm 15mm}*{box-sizing:border-box}body{margin:0;color:#000;font-family:"AnxB","Nanum Myeongjo",serif;font-size:15pt;line-height:1.6}
.ax{width:168mm;margin:0 auto}.ax+.ax{break-before:page}.ax p{margin:0;min-height:1.6em}.tag{font-size:13pt}
.ttl{width:100%;border-collapse:collapse}.ttl td{padding:0;border:0}.bar1{height:2.3mm;background:linear-gradient(90deg,#ff843a,#ffceb0)}.bar2{height:2.8mm;background:linear-gradient(90deg,#ff843a,#ffceb0)}
.ttl .t{height:14.3mm;text-align:center;font-family:"AnxT","Malgun Gothic",sans-serif;font-size:20pt;line-height:1.3;padding:1.5mm 0}
.sec{font-weight:700;text-align:left}.c{text-align:center}
.tb{width:100%;border-collapse:collapse;table-layout:fixed;border:.5mm double #000}.tb td{width:50%;height:13mm;border:.12mm solid #000;text-align:center;vertical-align:middle;padding:0 2mm}.tb .h{font-weight:700}
.tb .tall{height:26.1mm;position:relative}.stamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-height:24mm;max-width:40mm;mix-blend-mode:multiply}
.ck{position:relative;display:inline-block}.ck:after{content:"";position:absolute;left:-1.6mm;right:-1.6mm;top:-1mm;bottom:-1mm;border:.45mm solid #000;border-radius:50%}
.bar{position:sticky;top:0;background:#fffbe8;border-bottom:1px solid #e6d58a;padding:8px 12px;font:13px sans-serif;display:flex;gap:10px;align-items:center;justify-content:space-between}.bar button{font:inherit;padding:6px 14px;border-radius:8px;border:1px solid #333;background:#111;color:#fff}
@media print{.bar{display:none}}`;
function page(c,r,g){const v=c.vcall||{},birth=dot(c.v_birth||b8(r.birth));
  return `<div class="ax"><p class="tag">[별첨 2]</p><p class="tag"></p>
  <table class="ttl"><tr><td class="bar1"></td></tr><tr><td class="t">온(溫) 앤 쿨(cool) 사업<br>전년도 에너지바우처 소진 조회 확인서</td></tr><tr><td class="bar2"></td></tr></table>
  <p></p><p class="sec">□ 지원가구</p><p></p>
  <table class="tb"><tr><td class="h">성&nbsp;&nbsp;&nbsp;&nbsp;명</td><td>${esc(r.elder_name)}</td></tr><tr><td class="h">생년월일</td><td>${birth||"0000. 00. 00."}</td></tr></table>
  <p></p><p class="sec">□ 확인내역</p><p></p>
  <table class="tb"><tr><td class="h">확인일자</td><td>${dot(v.date)||"2026. 00. 00."}</td></tr><tr><td class="h">확인여부</td><td><span class="ck">확인</span> / 미확인</td></tr></table>
  <p></p><p class="c">&nbsp;&nbsp;위 지원가구의 ‘온(溫) 앤 쿨(cool)’ 사업 신청 및 지원을 위한 전년도 에너지바우처 소진 여부가 확인되었음을 증명합니다.</p><p></p><p></p>
  <table class="tb"><tr><td class="h">수행기관 확인자명</td><td>${esc(g.confirmer||"성명 / 직책")}</td></tr>
  <tr><td class="h">기 관 명</td><td rowspan="2" class="tall">(기관 직인)${g.stamp?`<img class="stamp" src="${g.stamp}" alt="직인">`:""}</td></tr><tr><td>${ORG}</td></tr></table></div>`}
const ready=c=>c&&c.vcall&&c.vcall.ok&&c.vcall.res==="소진 확인"&&c.vcall.date;
async function print(list){const w=window.open("","_blank");if(!w){alert("팝업이 차단되어 있습니다. 팝업을 허용해 주세요.");return}
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>별첨 2 확인서</title><style>${CSS}</style></head><body><div class="bar">불러오는 중입니다.</div></body></html>`);
  let g;try{g=await cfg(true)}catch(x){w.document.body.innerHTML="설정을 불러오지 못했습니다: "+esc(x.message);return}
  const warn=[!g.confirmer?"확인자":"",!g.stamp?"직인":""].filter(Boolean);
  w.document.open();w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>별첨 2 확인서</title><style>${CSS}</style></head><body><div class="bar"><span>${list.length}가구${warn.length?` · ${warn.join("·")} 설정이 없습니다. ‘확인자·직인 설정’에서 등록해 주세요.`:""}</span><button onclick="print()">인쇄</button></div>${list.map(([c,r])=>page(c,r,g)).join("")}</body></html>`);w.document.close()}
function live(c){const q=id=>document.getElementById(id);if(!q("c_vc_ok"))return c;return Object.assign({},c,{vcall:{ok:q("c_vc_ok").checked,date:q("c_vc_date").value,bal:q("c_vc_bal").value,who:q("c_vc_who").value,res:q("c_vc_res").value},v_birth:(q("c_v_birth")||{}).value||c.v_birth})}
function toPNG(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{const s=Math.min(1,500/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);const x=cv.getContext("2d");x.drawImage(im,0,0,cv.width,cv.height);
  const d=x.getImageData(0,0,cv.width,cv.height),p=d.data;for(let i=0;i<p.length;i+=4){const mx=Math.max(p[i],p[i+1],p[i+2]),mn=Math.min(p[i],p[i+1],p[i+2]);if(mx>215&&mx-mn<40)p[i+3]=0}x.putImageData(d,0,0);res(cv.toDataURL("image/png"))};im.src=fr.result};fr.readAsDataURL(file)})}
function panel(box){const old=document.getElementById("anx_cfg");if(old){old.remove();return}
  const d=document.createElement("div");d.id="anx_cfg";d.className="anx-cfg";d.innerHTML=`<label>수행기관 확인자명 (성명 / 직책)<input type="text" id="anx_who" maxlength="40" placeholder="예) 홍길동 / 팀장"></label>
  <label>기관 직인 (스캔 이미지 · 흰 배경은 자동으로 투명하게 처리됩니다)<input type="file" id="anx_st" accept="image/png,image/jpeg"></label><div class="anx-prev" id="anx_prev"></div>
  <div class="anx-row"><button type="button" class="sbtn pri" id="anx_save">저장</button><span class="msg" id="anx_msg"></span></div>`;box.appendChild(d);
  let stamp=null;cfg(true).then(g=>{document.getElementById("anx_who").value=g.confirmer||"";if(g.stamp)document.getElementById("anx_prev").innerHTML=`<img src="${g.stamp}" alt="직인">`}).catch(()=>{});
  document.getElementById("anx_st").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{stamp=await toPNG(f);document.getElementById("anx_prev").innerHTML=`<img src="${stamp}" alt="직인">`}catch(_){document.getElementById("anx_msg").textContent="이미지를 읽지 못했습니다."}};
  document.getElementById("anx_save").onclick=async()=>{const m=document.getElementById("anx_msg");try{await RPC("oncool_ed_annex_set",{p_token:TOK(),p_confirmer:document.getElementById("anx_who").value,p_stamp:stamp});CFG=null;m.textContent="저장되었습니다."}catch(x){m.textContent="저장하지 못했습니다: "+x.message}}}
function hook(rpcS,tok,getCases,getRows){RPC=rpcS;TOK=tok;
  const st=document.createElement("style");st.textContent=`.anx-act{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.anx-cfg{display:flex;flex-direction:column;gap:8px;margin-top:8px;padding:10px;border:1px dashed var(--line);border-radius:10px}.anx-prev img{max-height:70px}.anx-row{display:flex;gap:8px;align-items:center}`;document.head.appendChild(st);
  const _o=CSE.open;CSE.open=function(c,r){const x=_o.apply(this,arguments);try{if(tok()){const box=document.getElementById("c_vcall");if(box&&!document.getElementById("anx_one")){const a=document.createElement("div");a.className="anx-act";
      a.innerHTML='<button type="button" class="sbtn" id="anx_one">확인서(별첨 2) 출력</button><button type="button" class="sbtn" id="anx_set">확인자·직인 설정</button>';box.appendChild(a);
      document.getElementById("anx_one").onclick=()=>{const cur=live(CSE.current()||c);if(!ready(cur)){alert("‘함께 들으며 확인하였습니다’ 체크, 확인일, 결과 ‘소진 확인’이 있어야 출력할 수 있습니다.");return}print([[cur,r||{}]])};
      document.getElementById("anx_set").onclick=()=>panel(box)}}}catch(e){console.error(e)}return x};
  const csv=document.getElementById("ccsv");if(csv&&!document.getElementById("canx")){const b=document.createElement("button");b.type="button";b.className="sbtn";b.id="canx";b.textContent="별첨 2 일괄 출력";csv.before(b);
    b.onclick=()=>{if(!tok()){alert("편집 비밀번호를 입력한 뒤에 사용할 수 있습니다.");return}const R={};getRows().forEach(x=>R[x.id]=x);
      const list=getCases().filter(ready).sort((a,b)=>(a.household_code||"~").localeCompare(b.household_code||"~")||((R[a.referral_id]||{}).receipt_no-(R[b.referral_id]||{}).receipt_no)).map(c=>[c,R[c.referral_id]||{}]);
      if(!list.length){alert("2025년 바우처 소진 확인을 마친 가구가 없습니다.");return}print(list)}}}
return {hook,page,CSS}})();
