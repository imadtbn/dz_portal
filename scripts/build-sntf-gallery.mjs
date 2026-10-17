// Index timetable images ALREADY referenced on sectors/sntf.html.
// No OCR or inferred times: image assets are sources for subsequent manual transcription.
// node scripts/build-sntf-gallery.mjs [--check]
import {readFileSync,writeFileSync,existsSync} from "node:fs";
const html=readFileSync("sectors/sntf.html","utf8");
const routes=JSON.parse(readFileSync("assets/data/sntf/routes.json","utf8")).routes;
const filename="assets/data/sntf/gallery-index.json";
const previous=existsSync(filename)?JSON.parse(readFileSync(filename,"utf8")):null;
const assetPattern=/(?:\.\.\/)?assets\/train-schedules\/[^"'<>\s]+?\.(?:png|jpg|jpeg|webp|svg)/gi;
const paths=[...new Set([...html.matchAll(assetPattern)].map(m=>m[0].replace(/^\.\.\//,"")))]
 .filter(path=>!/(?:^|\/)qr-code\./.test(path));
const category=p=>p.includes("/suburban/")?"suburban":p.includes("/Eastern/")?"eastern":
 p.includes("/Western/")?"western":p.includes("/sahara-plateaux/")?"sahara":
 p.includes("/international/")?"international":"uncategorized";
const images=paths.map(path=>{
 const name=path.split("/").pop(),index=html.indexOf(path),
 near=html.slice(Math.max(0,index-300),index+300),alt=near.match(/<img[^>]*alt="([^"]+)"/)?.[1]||null;
 return {
  id:name.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+category(path),
  path,category:category(path),alt:alt&&alt.length<100?alt:null,
  route_ids:routes.filter(r=>r.schedule_image?.replace(/^\.\.\//,"")===path).map(r=>r.id),
  source_page:"sectors/sntf.html",
  issuing_authority:"SNTF",
  status:"official_document_validity_unconfirmed",
  notes:path.endsWith(".svg")?"إعادة رسم رقمية مبنية على الصورة الرسمية لـ SNTF المرفقة من صاحب المشروع، وليست الصورة الفوتوغرافية الأصلية؛ يجب التحقق مستقلاً من استمرار سريان المواقيت.":"صورة جدول صادرة عن SNTF وفق توثيق صاحب المشروع؛ تاريخ السريان واستمرار العمل بالمواقيت يحتاجان مراجعة منفصلة، ولا تُستنتج أوقات الرحلات من اسم الصورة."
 };
});
const expected={version:2,generated_at:previous?.generated_at||new Date().toISOString().slice(0,10),source_page:"sectors/sntf.html",images};
const missing=paths.filter(p=>!existsSync(p));
if(missing.length)console.warn("Gallery references not present locally:",missing.join(", "));
if(process.argv.includes("--check")){
 if(!previous||JSON.stringify({...previous,generated_at:expected.generated_at})!==JSON.stringify(expected)){
  console.error("Gallery index is stale. Run node scripts/build-sntf-gallery.mjs");
  process.exitCode=1;
 }
}else writeFileSync(filename,JSON.stringify(expected,null,2)+"\n");
console.log(images.length+" gallery images, "+images.filter(i=>i.route_ids.length).length+" directly linked to routes.");
