import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd(), out = join(root,"android-web");
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for (const file of ["index.html","app.js","firebase-daily.js","style.css","sw.js","manifest.webmanifest"]) {
  if (!existsSync(join(root,file))) throw new Error("Missing web source: "+file);
  copyFileSync(join(root,file),join(out,file));
}
if(existsSync(join(root,"data")))cpSync(join(root,"data"),join(out,"data"),{recursive:true});
const htmlPath=join(out,"index.html");
let html=readFileSync(htmlPath,"utf8");
html=html.replace('<meta name="viewport"', '<meta name="viewport"');
writeFileSync(htmlPath,html,"utf8");
console.log("Capacitor Android web assets copied (without Netlify functions, credentials, and source scripts).");
