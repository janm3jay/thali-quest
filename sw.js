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
