/* 맨 위 '온앤쿨케어' 표시를 누르면 첫 화면으로 (2026-11-16) */
(function(){const e=document.querySelector(".wrap>.eyebrow");if(!e||e.dataset.home)return;e.dataset.home=1;
  e.classList.add("homeb");e.setAttribute("role","button");e.tabIndex=0;e.title="첫 화면으로";
  e.insertAdjacentHTML("afterbegin",'<span class="homei" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/></svg></span>');
  const go=()=>{const r=document.getElementById("vt-ref");
    if(r){["cedit","cview","detail"].forEach(i=>{const x=document.getElementById(i);if(x)x.hidden=true});r.click()}
    else{const m=document.querySelector('[data-view="menu"]');if(m)m.click()}
    window.scrollTo({top:0,behavior:"smooth"})};
  e.addEventListener("click",go);e.addEventListener("keydown",v=>{if(v.key==="Enter"||v.key===" "){v.preventDefault();go()}});
  const st=document.createElement("style");st.textContent=`.wrap>.eyebrow.homeb.homeb:first-child{cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:8px;padding-left:6px;transition:box-shadow .15s,transform .15s}
.wrap>.eyebrow.homeb.homeb:first-child::before{display:none}
.wrap>.eyebrow.homeb:hover{transform:translateY(-1px)}.wrap>.eyebrow.homeb:focus-visible{outline:2px solid var(--pri);outline-offset:2px}
.homei{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:linear-gradient(140deg,#6c8cf5,#4a52d9);color:#fff;flex:none}.homei svg{width:14px;height:14px}`;document.head.appendChild(st)})();
