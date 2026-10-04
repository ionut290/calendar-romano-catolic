import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const API = "https://parolaviva.art/api/v1/letture";
const KOKORO = "https://leonelhs-kokoro-tts-italian.hf.space/gradio_api/call/predict";
const VOICE = "im_nicola";
const store = () => getStore("daily-narration");

function romeDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
function plain(v:any):string {
  if (Array.isArray(v)) return v.map(x => typeof x === "string" ? x : (x?.t ?? x?.testo ?? "")).join(" ");
  if (v && typeof v === "object") return plain(v.v ?? v.versetti ?? v.testo);
  return String(v ?? "");
}
function clean(text:string):string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/(^|\n)\s*\d{1,3}\s+(?=[A-ZÀ-Ý])/g, "$1")
    .replace(/\s+/g, " ").trim();
}
async function liturgy(date:string) {
  const [y,m,d] = date.split("-");
  const r = await fetch(`${API}/${y}/${m}-${d}.json`);
  if (!r.ok) throw new Error(`Liturgia ${date}: ${r.status}`);
  return r.json();
}
async function bibleGet(ref:string) {
  if (!ref) return "";
  const q = String(ref).replace(/\s+/g, "");
  const u = "https://query.bibleget.io/v3/?query="+encodeURIComponent(q)+"&version=CEI2008&return=json&appid=calendario-cattolico";
  const r = await fetch(u);
  if (!r.ok) return "";
  const x:any = await r.json();
  const vv = x.verses || x.results || x;
  return Array.isArray(vv) ? clean(vv.map((v:any)=>v.text??v.verse_text??v.content??"").join(" ")) : "";
}
async function tts(text:string) {
  const first = await fetch(KOKORO,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[text.slice(0,3500),VOICE,0.92]})});
  if(!first.ok) throw new Error("Kokoro non disponibile");
  const j:any=await first.json();
  if(!j.event_id) throw new Error("Kokoro event_id assente");
  const r=await fetch(KOKORO+"/"+j.event_id);
  if(!r.ok) throw new Error("Kokoro audio non disponibile");
  const raw=await r.text();
  for(const line of raw.split("\n").filter(x=>x.startsWith("data: "))){
    try{
      const data=JSON.parse(line.slice(6)),v=Array.isArray(data)?data[0]:data;
      const url=v?.url || (v?.path && /^https?:/.test(v.path) ? v.path : "");
      if(url){const a=await fetch(url); if(!a.ok) throw new Error("Download audio fallito"); return a.arrayBuffer();}
    }catch{}
  }
  throw new Error("Audio non ricevuto");
}
async function create(date:string,key:string,text:string){
  text=clean(text); if(!text) return;
  const audio=await tts(text);
  await store().set(`${date}/${key}.mp3`,audio);
}
export default async () => {
  // Netlify usa UTC: 23:00 UTC corrisponde alle 00:00 in Italia durante l'ora solare.
  // Generiamo il giorno corrente di Roma; una seconda esecuzione di sicurezza alle 00:00 UTC
  // rende il sistema robusto anche nel passaggio ora legale/solare.
  const date=romeDate(0), x:any=await liturgy(date), g=x.letture?.vangelo;
  const jobs:[string,string][]=[];
  const gospel=await bibleGet(g?.riferimento)||plain(g?.testo);
  if(gospel) jobs.push(["gospelText",gospel]);
  const readings=[
    ["Prima lettura",x.letture?.prima],["Salmo",x.letture?.salmo],
    ["Seconda lettura",x.letture?.seconda],["Vangelo",g]
  ].filter(([,v])=>v).map(([label,v]:any)=>`${label}. ${plain(v?.testo)}`).join(" ");
  if(readings) jobs.push(["readings",readings]);
  // Le sezioni editoriali/proverbio/Bibbia annuale dipendono dall'app client:
  // vengono memorizzate automaticamente alla prima riproduzione tramite la funzione audio-cache.
  for(const [key,text] of jobs) await create(date,key,text);
  console.log("Audio giornalieri pronti:",date,jobs.map(x=>x[0]).join(", "));
};
export const config: Config = { schedule: "0 23,0 * * *" };
