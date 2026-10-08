import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const headers={
  "Content-Type":"audio/mpeg",
  "Cache-Control":"public, max-age=86400",
  // GET responses can be served by the CDN without invoking the function again.
  "Netlify-CDN-Cache-Control":"public, durable, max-age=86400",
  "Netlify-Vary":"query=date|key"
};
export default async(req:Request)=>{
  if(req.method!=="GET"&&req.method!=="HEAD")return new Response("Method not allowed",{status:405});
  const u=new URL(req.url),date=u.searchParams.get("date"),key=u.searchParams.get("key");
  if(!date||!key||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!/^[A-Za-z0-9_-]+$/.test(key))
    return new Response("Bad request",{status:400});
  const store=getStore("daily-narration"),path=`${date}/${key}.mp3`;
  if(req.method==="HEAD"){
    // HEAD is not CDN-cached; use a lightweight metadata lookup instead of transferring MP3 data.
    const result=await store.getMetadata(path);
    return result?new Response(null,{status:200,headers}):new Response(null,{status:404});
  }
  const audio=await store.get(path,{type:"arrayBuffer"});
  if(!audio)return new Response("Not found",{status:404});
  return new Response(audio,{headers});
};
export const config:Config={path:"/daily-audio"};
