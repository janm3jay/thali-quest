const CACHE='thali-quest-v2';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Always ask the server first (revalidating, so a fresh upload shows on the next open). Use the saved copy only when offline.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const same=new URL(e.request.url).origin===self.location.origin;
  const req=same?new Request(e.request,{cache:'no-cache'}):e.request;
  e.respondWith(fetch(req).then(r=>{
    if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}
    return r;
  }).catch(()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('index.html'):Response.error()))));
});

// reminders: show the push, and open the app on tap
self.addEventListener('push',e=>{
  let j={};try{j=e.data?e.data.json():{};}catch(x){try{j={title:'Thali Quest',body:e.data.text()};}catch(y){}}
  const d=j.data||j,n=j.notification||{};
  const title=d.title||n.title||'Thali Quest',opt={body:d.body||n.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||n.tag||'tq',data:{url:d.url||'./'}};
  e.waitUntil(self.registration.showNotification(title,opt));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if('focus'in c){c.focus();if('navigate'in c)return c.navigate(url).catch(()=>{});return;}}
    return self.clients.openWindow(url);
  }));
});
