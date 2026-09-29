exports.handler=async(event)=>{try{
const date=(event.queryStringParameters||{}).date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date||""))return{statusCode:400,body:JSON.stringify({error:"Data invalidă"})};
const[y,m,d]=date.split("-"),url="https://ercis.ro/liturgie/calendar/"+y+"/"+Number(m)+"/"+Number(d);
const r=await fetch(url,{headers:{"user-agent":"CalendarRomanoCatolic/1.1"}});if(!r.ok)throw new Error("Sursa liturgică nu răspunde");
const h=await r.text();const clean=x=>(x||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&quot;|&#34;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&icirc;/g,"î").replace(/&acirc;/g,"â").replace(/&scedil;|&#351;/g,"ş").replace(/&tcedil;|&#355;/g,"ţ").replace(/\s+/g," ").trim();
const plain=clean(h),title=clean((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"");
const color=(plain.match(/\b(Alb|Verde|Roşu|Roșu|Violet|Roz)\b/)||[])[1]||"";
const lect=(plain.match(/Lecturi:\s*(.+?)(?:Liturghie|Lecturile zilei)/i)||[])[1]||"";
const gospelBlock=(h.match(/<h2[^>]*>\s*EVANGHELIA\s*<\/h2>([\s\S]*?)(?=<h2|<h3|Medita|Gândul zilei|Pastila zilei|Celebrări|$)/i)||[])[1]||"";
const gospel=clean(gospelBlock);
const thought=clean((h.match(/<h2[^>]*>\s*(?:Gândul zilei|Meditaţie|Meditație)\s*<\/h2>([\s\S]*?)(?=<h2|<h3|Pastila zilei|Celebrări|$)/i)||[])[1]||"");
const saint=clean((h.match(/<h2[^>]*>\s*(?:Pastila zilei|Sfântul Zilei)\s*<\/h2>([\s\S]*?)(?=<h2|<h3|Celebrări|$)/i)||[])[1]||"");
return{statusCode:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=21600"},body:JSON.stringify({date,title,color,readings:lect.trim(),gospel,thought,saint,source:url})};
}catch(e){return{statusCode:502,body:JSON.stringify({error:e.message})}}};