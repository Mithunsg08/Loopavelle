/* Video Player offline worker. Keep this file next to index.html (same folder). */
const C='vp5',PRE=['./','./index.html','https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js','https://iptv-org.github.io/iptv/index.m3u'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'cors':'same-origin'})).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||r.headers.has('range'))return;
  if(/\.(m3u8|ts|m4s|mpd|mp4|webm)$/i.test(u.pathname))return;               // never cache live streams / video
  const ok=u.origin===location.origin||u.hostname==='cdn.jsdelivr.net'||u.hostname==='iptv-org.github.io'||r.destination==='image';
  if(!ok)return;
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:r.mode==='navigate'});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}                                      // instant + refresh in background
    const res=await net;
    return res||(r.mode==='navigate'?c.match('./index.html'):Response.error());
  }));
});
