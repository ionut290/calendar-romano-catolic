import { getStore } from "@netlify/blobs";
import { dailyReflection } from "./_shared/reflections.mts";

const API="https://parolaviva.art/api/v1/letture";
const KOKORO="https://leonelhs-kokoro-tts-italian.hf.space/gradio_api/call/predict";
const DAILY_PROVERBS=[
["Pr 1,7","Il timore del Signore è principio della conoscenza."],
["Pr 3,5","Confida nel Signore con tutto il cuore e non appoggiarti sulla tua intelligenza."],
["Pr 3,6","In tutti i tuoi passi pensa a lui ed egli appianerà i tuoi sentieri."],
["Pr 3,27","Non negare un bene a chi ne ha diritto, se hai la possibilità di farlo."],
["Pr 4,23","Più di ogni cosa degna di cura custodisci il tuo cuore, perché da esso sgorga la vita."],
["Pr 10,12","L'odio suscita litigi, l'amore ricopre ogni colpa."],
["Pr 11,25","La persona generosa sarà colmata e chi disseta sarà dissetato."],
["Pr 12,18","C'è chi parla senza riflettere: trafigge come una spada, ma la lingua dei saggi risana."],
["Pr 13,20","Chi va con i saggi diventa saggio, chi pratica gli stolti ne subirà danno."],
["Pr 14,31","Chi opprime il povero offende il suo creatore, chi ha pietà del misero lo onora."],
["Pr 15,1","Una risposta gentile calma la collera, una parola pungente eccita l'ira."],
["Pr 15,3","In ogni luogo sono gli occhi del Signore, scrutano i cattivi e i buoni."],
["Pr 15,13","Un cuore lieto dà serenità al volto, ma quando il cuore è triste lo spirito è depresso."],
["Pr 15,16","È meglio aver poco con il timore di Dio che un grande tesoro con inquietudine."],
["Pr 16,3","Affida al Signore le tue opere e i tuoi progetti avranno efficacia."],
["Pr 16,9","Il cuore dell'uomo elabora progetti, ma è il Signore che rende saldi i suoi passi."],
["Pr 16,18","Prima della rovina viene l'orgoglio e prima della caduta lo spirito altero."],
["Pr 16,24","Favo di miele sono le parole gentili, dolcezza per l'anima e refrigerio per il corpo."],
["Pr 17,17","Un amico vuol bene sempre, è nato per essere un fratello nella sventura."],
["Pr 17,22","Un cuore lieto fa bene al corpo, uno spirito abbattuto inaridisce le ossa."],
["Pr 18,10","Torre fortificata è il nome del Signore: il giusto vi si rifugia ed è al sicuro."],
["Pr 18,21","Morte e vita sono in potere della lingua e chi ne fa buon uso ne mangerà i frutti."],
["Pr 19,11","È avvedutezza per l'uomo rimandare lo sdegno ed è sua gloria passare sopra alle offese."],
["Pr 19,17","Chi ha pietà del povero fa un prestito al Signore, che gli darà la sua ricompensa."],
["Pr 20,22","Non dire: «Renderò male per male»; confida nel Signore ed egli ti salverà."],
["Pr 21,3","Praticare la giustizia e l'equità per il Signore vale più di un sacrificio."],
["Pr 22,1","Un buon nome vale più di grandi ricchezze e la benevolenza altrui più dell'argento e dell'oro."],
["Pr 24,16","Il giusto cade sette volte e si rialza, mentre i malvagi soccombono nella sventura."],
["Pr 27,17","Il ferro si aguzza con il ferro e l'uomo aguzza l'ingegno del suo compagno."],
["Pr 28,13","Chi nasconde le proprie colpe non avrà successo; chi le confessa e le abbandona troverà misericordia."],
["Pr 31,8","Apri la bocca in favore del muto, per difendere i diritti di tutti gli sventurati."]
];

const BIBLE_YEAR_BOOKS=[
["Genesi",50],["Esodo",40],["Levitico",27],["Numeri",36],["Deuteronomio",34],["Giosuè",24],["Giudici",21],["Rut",4],["1 Samuele",31],["2 Samuele",24],["1 Re",22],["2 Re",25],["1 Cronache",29],["2 Cronache",36],["Esdra",10],["Neemia",13],["Tobia",14],["Giuditta",16],["Ester",16],["1 Maccabei",16],["2 Maccabei",15],["Giobbe",42],["Salmi",150],["Proverbi",31],["Qoelet",12],["Cantico dei Cantici",8],["Sapienza",19],["Siracide",51],["Isaia",66],["Geremia",52],["Lamentazioni",5],["Baruc",6],["Ezechiele",48],["Daniele",14],["Osea",14],["Gioele",4],["Amos",9],["Abdia",1],["Giona",4],["Michea",7],["Naum",3],["Abacuc",3],["Sofonia",3],["Aggeo",2],["Zaccaria",14],["Malachia",3],["Matteo",28],["Marco",16],["Luca",24],["Giovanni",21],["Atti degli Apostoli",28],["Romani",16],["1 Corinzi",16],["2 Corinzi",13],["Galati",6],["Efesini",6],["Filippesi",4],["Colossesi",4],["1 Tessalonicesi",5],["2 Tessalonicesi",3],["1 Timoteo",6],["2 Timoteo",4],["Tito",3],["Filemone",1],["Ebrei",13],["Giacomo",5],["1 Pietro",5],["2 Pietro",3],["1 Giovanni",5],["2 Giovanni",1],["3 Giovanni",1],["Giuda",1],["Apocalisse",22]
];
const BIBLE_YEAR_CHAPTERS=BIBLE_YEAR_BOOKS.flatMap(([book,n])=>Array.from({length:n},(_,i)=>({book,chapter:i+1})));
function bibleYearDayNumber(d){const y=d.getFullYear(),start=new Date(y,0,1),day=Math.floor((new Date(y,d.getMonth(),d.getDate())-start)/86400000)+1;return Math.min(day,365)}
function bibleYearPlan(day){const total=BIBLE_YEAR_CHAPTERS.length,start=Math.floor((day-1)*total/365),end=Math.floor(day*total/365),parts=BIBLE_YEAR_CHAPTERS.slice(start,end);const groups=[];for(const p of parts){const last=groups[groups.length-1];if(last&&last.book===p.book&&last.to===p.chapter-1)last.to=p.chapter;else groups.push({book:p.book,from:p.chapter,to:p.chapter})}return groups}
function bibleYearRef(groups){return groups.map(g=>g.book+" "+g.from+(g.to>g.from?"-"+g.to:"")).join("; ")}

function plain(v){if(Array.isArray(v))return v.map(x=>typeof x==="string"?x:(x?.t??x?.testo??"")).join(" ");if(v&&typeof v==="object")return plain(v.v??v.versetti??v.testo);return String(v??"")}
function clean(t){return String(t??"").replace(/<[^>]*>/g," ").replace(/(^|\n)\s*\d{1,3}\s+(?=[A-ZÀ-Ý])/g,"$1").replace(/\s+/g," ").trim()}
async function bible(ref){if(!ref)return"";const u="https://query.bibleget.io/v3/?query="+encodeURIComponent(String(ref).replace(/\s+/g,""))+"&version=CEI2008&return=json&appid=calendario-cattolico";const r=await fetch(u);if(!r.ok)return"";const x=await r.json(),vv=x.verses||x.results||x;return Array.isArray(vv)?clean(vv.map(v=>v.text??v.verse_text??v.content??"").join(" ")):""}
async function tts(text){const first=await fetch(KOKORO,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[clean(text).slice(0,3500),"im_nicola",0.92]})});if(!first.ok)throw Error("Kokoro");const j=await first.json();const r=await fetch(KOKORO+"/"+j.event_id);const raw=await r.text();for(const line of raw.split("\n").filter(x=>x.startsWith("data: "))){try{const d=JSON.parse(line.slice(6)),v=Array.isArray(d)?d[0]:d,u=v?.url||(v?.path&&/^https?:/.test(v.path)?v.path:"");if(u){const a=await fetch(u);if(a.ok)return a.arrayBuffer()}}catch{}}throw Error("Audio non ricevuto")}
async function save(store,date,key,text){text=clean(text);if(!text)return;try{const old=await store.getMetadata(date+"/"+key+".mp3");if(old)return}catch{}const a=await tts(text);await store.set(date+"/"+key+".mp3",a)}
export default async(req)=>{
 const body=await req.json().catch(()=>({})),date=body.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date||""))return;
 const [y,m,d]=date.split("-");let x:any=null;try{const cr=await fetch(new URL("/cei-liturgia?date="+encodeURIComponent(date),req.url).href);if(cr.ok){const cx=await cr.json();if(cx?.letture?.vangelo?.testo)x=cx}}catch(e){console.warn("CEI audio fallback",e)}if(!x){const r=await fetch(API+"/"+y+"/"+m+"-"+d+".json");if(!r.ok)throw Error("Liturgia");x=await r.json()}const g=x.letture?.vangelo,store=getStore("daily-narration"),reflection=dailyReflection(x);
 const gospel=await bible(g?.riferimento)||plain(g?.testo);
 const readings=[["Prima lettura",x.letture?.prima],["Salmo",x.letture?.salmo],["Seconda lettura",x.letture?.seconda],["Vangelo",g]].filter(([,v])=>v).map(([l,v])=>l+". "+plain(v?.testo)).join(" ");
 const dt=new Date(y+"-"+m+"-"+d+"T12:00:00Z"),start=new Date(Date.UTC(+y,0,1,12)),day=Math.min(Math.floor((dt-start)/86400000)+1,365);
 const proverb=DAILY_PROVERBS[(day-1)%DAILY_PROVERBS.length][1];
 const groups=bibleYearPlan(day);let bibleYear="";for(const z of groups){const q=z.book+" "+z.from+(z.to>z.from?"-"+z.to:"");bibleYear+=" "+await bible(q)}
 const jobs=[["gospelText",gospel],["readings",readings],["gospelToday",reflection.live],["meditation",reflection.med],["prayer",reflection.prayer],["dailyProverbText",proverb],["bibleYearText",bibleYear]];
 for(const [key,text] of jobs){try{await save(store,date,key,text)}catch(e){console.error("Audio",key,e)}}
 console.log("Audio completi pronti",date);
};
