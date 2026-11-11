/* 온앤쿨케어 관리 화면 알림 (푸시만 처리, 화면 저장은 안 함) */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data?e.data.text():""}}
  e.waitUntil(self.registration.showNotification(d.title||"온앤쿨케어",{body:d.body||"",icon:"logo-96.png",badge:"favicon-32.png",tag:d.tag||undefined,data:{url:d.url||"staff.html"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||"staff.html",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if(c.url.includes("/oncool-care/staff.html")&&"focus" in c){return c.focus().then(w=>w&&w.navigate?w.navigate(url):w)}}
    return self.clients.openWindow(url)}))});
