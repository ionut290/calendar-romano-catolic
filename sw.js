const CACHE="calendario-cattolico-v35";
const ASSETS=["./","./index.html","./style.css","./app.js","./manifest.webmanifest"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const asset of ASSETS){const response=await fetch(new Request(asset,{cache:"reload"}));if(!response.ok)throw Error("Asset unavailable");await cache.put(asset,response)}await self.skipWaiting()})());
});
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const keys=await caches.keys();const upgrading=keys.some(key=>key.startsWith("calendario-cattolico-")&&key!==CACHE);
 await Promise.all(keys.filter(key=>key.startsWith("calendario-cattolico-")&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
 if(upgrading){for(const client of await self.clients.matchAll({type:"window"})){try{await client.navigate(client.url)}catch(error){console.warn("Update reload",error)}}}
})()));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:"no-cache"});if(response.ok&&new URL(event.request.url).origin===self.location.origin){const path=new URL(event.request.url).pathname;if(event.request.mode==="navigate"||/\.(js|css)$/.test(path)){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone())}}return response}catch(error){const cached=await caches.match(event.request);if(cached)return cached;throw error}})());
});
