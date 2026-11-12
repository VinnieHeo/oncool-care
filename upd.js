/* 새 버전 자동 확인 (11/12) · 화면에 다시 돌아올 때와 5분마다 version.json 확인
   입력 중이 아니면 바로 새로고침, 입력 중이면 위에 안내 띠만 띄움 */
(function(){
const meta=document.querySelector('meta[name="oc-ver"]');const MINE=meta?meta.content:"";if(!MINE)return;
let DIRTY=false,last=0,shown=false;
/* 새로고침 때 붙인 주소 꼬리(?u=) 지우기 */
try{const u=new URL(location.href);if(u.searchParams.has("u")){u.searchParams.delete("u");history.replaceState(history.state,"",u.pathname+u.search+u.hash)}}catch(e){}
/* 비밀번호·이름·검색·필터 칸은 입력 중으로 보지 않음 */
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.closest||!t.closest("input,textarea,select"))return;if(t.type==="password"||/^(en|fq|fs|ft|cfs)$/.test(t.id))return;DIRTY=true},true);
/* 저장되면 입력 중 아님 */
const watchSaved=()=>{const m=document.getElementById("c_msg");if(!m||m.__ocw)return;m.__ocw=1;new MutationObserver(()=>{if(/저장되었습니다|저장했/.test(m.textContent))DIRTY=false}).observe(m,{childList:true,characterData:true,subtree:true})};
function busy(){watchSaved();const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=="checkbox"&&a.type!=="radio")return true;if(document.querySelector(".scn"))return true;return DIRTY}
function reload(v){try{if(sessionStorage.getItem("oc_upd_try")===v)return;sessionStorage.setItem("oc_upd_try",v)}catch(e){}
  const u=new URL(location.href);u.searchParams.set("u",v);location.replace(u.href)}
function banner(v){if(shown)return;shown=true;const b=document.createElement("div");b.id="oc_upd";
  b.innerHTML='<span>새 버전이 있어요. 입력하던 내용을 저장한 뒤 눌러 주세요.</span><button type="button">새로고침</button>';
  b.style.cssText="position:fixed;left:0;right:0;top:0;z-index:9999;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:calc(8px + env(safe-area-inset-top,0px)) 14px 8px;background:#1b2333;color:#fff;font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.2)";
  const k=b.querySelector("button");k.style.cssText="font:inherit;border:0;border-radius:8px;padding:6px 12px;background:#fff;color:#1b2333;font-weight:800;cursor:pointer";
  k.onclick=()=>{try{sessionStorage.removeItem("oc_upd_try")}catch(e){}reload(v)};document.body.appendChild(b)}
async function check(){const now=Date.now();if(now-last<30000)return;last=now;
  try{const r=await fetch("version.json?n="+now,{cache:"no-store"});if(!r.ok)return;const j=await r.json();const v=String(j.v||"");
    if(!v||v===MINE)return;if(busy())banner(v);else reload(v)}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check()});
window.addEventListener("focus",check);setInterval(()=>{if(document.visibilityState==="visible")check()},300000);
setTimeout(check,3000);
})();
