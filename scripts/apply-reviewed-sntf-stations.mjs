// Manual-only safe station importer:
// node scripts/apply-reviewed-sntf-stations.mjs --input assets/data/sntf/review/approved-stations.json
// node scripts/apply-reviewed-sntf-stations.mjs --input ... --apply
// Never fetch the official site or overwrite user-confirmed Google Maps pin metadata.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {mergeApprovedStations} from "./lib/sntf-reconcile.mjs";
const args=process.argv.slice(2),flag=k=>args.includes(k);
const input=args[args.indexOf("--input")+1];
if(!flag("--input")||!input||input.startsWith("--")){
 console.error("Usage: node scripts/apply-reviewed-sntf-stations.mjs --input <approved-review.json> [--apply]");
 process.exit(2);
}
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const path="assets/data/sntf/stations.json",original=read(path),approved=read(input);
const {stations,audit}=mergeApprovedStations(original.stations,approved.decisions);
console.log(JSON.stringify({proposed_changes:audit,existing_count:original.stations.length,result_count:stations.length,geo_changed:false},null,2));
if(flag("--apply")){
 const backup="assets/data/sntf/review/backups/stations-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
 mkdirSync(dirname(backup),{recursive:true});copyFileSync(path,backup);
 writeFileSync(path,JSON.stringify({...original,version:(original.version||0)+1,updated:new Date().toISOString().slice(0,10),stations},null,2)+"\n");
 console.log("Approved station changes applied. Backup:",backup);
}else console.log("DRY RUN. Add --apply only after reviewing names and source evidence.");
