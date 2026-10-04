import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req:Request) => {
  const u=new URL(req.url), date=u.searchParams.get("date"), key=u.searchParams.get("key");
  if(!date||!key||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!/^[A-Za-z0-9_-]+$/.test(key)) return new Response("Bad request",{status:400});
  const audio=await getStore("daily-narration").get(`${date}/${key}.mp3`,{type:"arrayBuffer"});
  if(!audio) return new Response("Not found",{status:404});
  return new Response(audio,{headers:{"Content-Type":"audio/mpeg","Cache-Control":"public, max-age=86400"}});
};
export const config:Config={path:"/daily-audio"};
