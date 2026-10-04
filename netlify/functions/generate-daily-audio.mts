import type { Config } from "@netlify/functions";
function romeNow(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());return Object.fromEntries(p.map(x=>[x.type,x.value]))}
export default async(req)=>{
 const p=romeNow();
 if(p.hour!=="00"){console.log("Fuori dalla mezzanotte italiana");return}
 const origin=new URL(req.url).origin;
 await fetch(origin+"/.netlify/functions/generate-daily-audio-background",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:p.year+"-"+p.month+"-"+p.day})});
};
export const config:Config={schedule:"0 22,23 * * *"};
