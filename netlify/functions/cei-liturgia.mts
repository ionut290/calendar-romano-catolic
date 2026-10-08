import type { Config } from "@netlify/functions";

function textOnly(s:string){return s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#8217;|&rsquo;/g,"’").replace(/&#(d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/\s+/g," ").trim()}
function section(html:string,start:string,ends:string[]){const re=new RegExp("<h2[^>]*>\\s*"+start+"\\s*<\\/h2>","i"),m=re.exec(html);if(!m)return"";let end=html.length;for(const e of ends){const x=new RegExp("<h2[^>]*>\\s*"+e+"\\s*<\\/h2>","i").exec(html.slice(m.index+m[0].length));if(x)end=Math.min(end,m.index+m[0].length+x.index)}return html.slice(m.index+m[0].length,end)}
function refFrom(s:string){const m=s.match(/\b((?:1|2|3)?\s?[A-ZÀ-Ý][a-zà-ÿ]{0,8})\s+(\d+[\s,.-]+\d+(?:[-–]\d+)?)/);return m?(m[1].replace(/\s+/g," ")+" "+m[2].replace("–","-")):""}
function reading(sec:string){const t=textOnly(sec).replace(/^(?:[^.]{0,180})?(Dal libro|Dalla lettera|Dagli Atti|Dal Vangelo)/i,"$1");return{riferimento:refFrom(textOnly(sec)),testo:t.replace(/\b(Is|Ger|Ez|Dn|Os|Gl|Am|Abd|Gio|Mi|Na|Ab|Sof|Ag|Zc|Ml|Mt|Mc|Lc|Gv|At|Rm|1Cor|2Cor|Gal|Ef|Fil|Col|1Ts|2Ts|1Tm|2Tm|Tt|Fm|Eb|Gc|1Pt|2Pt|1Gv|2Gv|3Gv|Gd|Ap)\s+\d+[\s,.-]+\d+(?:[-–]\d+)?/,"").trim()}}
export default async(req:Request)=>{
 const u=new URL(req.url),date=(u.searchParams.get("date")||"").replaceAll("-","");
 if(!/^\d{8}$/.test(date))return new Response("Bad request",{status:400});
 const src="https://www.chiesacattolica.it/liturgia-del-giorno/?data-liturgia="+date;
 const r=await fetch(src,{headers:{"User-Agent":"CalendarioCattolico/1.0"}});
 if(!r.ok)return new Response("CEI unavailable",{status:502});
 const html=await r.text(),title=(html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)||[])[1]||"",color=(html.match(/Colore Liturgico\s*([^<\n]+)/i)||[])[1]||"";
 const prima=section(html,"Prima Lettura",["Salmo Responsoriale","Seconda Lettura","Acclamazione al Vangelo","Vangelo"]);
 const salmo=section(html,"Salmo Responsoriale",["Seconda Lettura","Acclamazione al Vangelo","Vangelo"]);
 const seconda=section(html,"Seconda Lettura",["Acclamazione al Vangelo","Vangelo"]);
 const vangelo=section(html,"Vangelo",["Sulle offerte","Antifona alla comunione","Dopo la comunione"]);
 const out={source:"CEI",sourceUrl:src,celebrazione:textOnly(title),colore:textOnly(color),letture:{prima:prima?reading(prima):null,salmo:salmo?reading(salmo):null,seconda:seconda?reading(seconda):null,vangelo:vangelo?reading(vangelo):null}};
 return Response.json(out,{headers:{"Cache-Control":"public, max-age=21600, stale-while-revalidate=86400","Netlify-CDN-Cache-Control":"public, durable, max-age=86400","Netlify-Vary":"query=date"}});
};
export const config:Config={path:"/cei-liturgia"};
