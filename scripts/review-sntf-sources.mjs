// Run: node scripts/review-sntf-sources.mjs [--check]
// Reads dated SNTF query snapshots and only creates an editorial review report.
// Deliberately DOES NOT scrape the remote site or change live stations/routes/trips.
import {readFileSync,writeFileSync} from "node:fs";
import {buildReview} from "./lib/sntf-reconcile.mjs";
const base="assets/data/sntf/";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const snapshots=read(base+"review/official-snapshots.json");
const report=buildReview(snapshots,read(base+"stations.json").stations,read(base+"routes.json").routes);
const target=base+"review/official-review-report.json";
const expected=JSON.stringify(report,null,2)+"\n";
if(process.argv.includes("--check")){
 let actual="";
 try{actual=readFileSync(target,"utf8")}catch{}
 if(actual!==expected){console.error("SNTF review report is stale. Run: node scripts/review-sntf-sources.mjs");process.exit(1)}
}else{writeFileSync(target,expected)}
console.log("SNTF historical review:",JSON.stringify(report.summary));
console.log("Verified Google Maps coordinates were read only; no station coordinates changed.");
