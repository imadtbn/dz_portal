import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {lockGeo,matchStation,buildReview,mergeApprovedStations} from "./lib/sntf-reconcile.mjs";
const read=p=>JSON.parse(readFileSync("assets/data/sntf/"+p,"utf8"));
const stations=read("stations.json").stations,routes=read("routes.json").routes;
const source=read("review/official-snapshots.json"),saved=read("review/official-review-report.json");
const geoLock=read("verified-geo-lock.json");
const byId=new Map(stations.map(s=>[s.id,s]));
for(const locked of geoLock.stations){
 const actual=byId.get(locked.id);
 assert(actual,"Protected station missing: "+locked.id);
 assert.deepEqual(lockGeo(actual),{...lockGeo(actual),lat:locked.lat,lon:locked.lon,geo_verified:true,geo_source:locked.geo_source},
  "Manually verified Google Maps coordinates changed: "+locked.id);
}

const gallery=read("gallery-index.json");
const expected=buildReview(source,stations,routes);
assert.deepEqual(saved,expected,"Official snapshot report must be reproducible and current");
assert(source.publish_to_live===false,"Historical SNTF snapshots must not publish as current service");
assert(source.query_snapshots.every(q=>q.status==="historical_recheck_required"&&q.intermediate_stops_known===false),"Historical snapshots must disclose unknown intermediate stops");
assert(saved.queries.every(q=>q.trips.every(t=>t.approval_status==="pending_official_recheck"&&t.incomplete_stop_times===true)),"No archived timetable can appear as a complete live trip");
assert(saved.summary.archived_trip_candidates===12,"Expected 12 historical official search records");
assert(saved.summary.new_station_names===0,"All ten distinct historical station names should now resolve to canonical station IDs");
assert(saved.station_candidates.some(x=>x.name==="SIDI BOUABIDA"&&x.status==="matched"&&x.station_id==="sidi_bouabida"));
assert(saved.station_candidates.some(x=>x.name==="CHEBAITA M"&&x.status==="matched"&&x.station_id==="chebaita_m"));
assert.equal(matchStation("THENIA",stations).status,"matched");
assert.equal(matchStation("OUED AISSI",stations).station_id,"oued_aissi");
const oldGeo=new Map(stations.map(s=>[s.id,JSON.stringify(lockGeo(s))]));
const approved={approved:true,reviewed_by:"local-test",reviewed_at:"2026-09-26"};
const merged=mergeApprovedStations(stations,[
 {...approved,action:"link_alias",station_id:"oued_aissi",input_name:"OUED AISSI",lat:0,lon:0,geo_verified:false,geo_source:"UNTRUSTED"},
 {...approved,action:"add_station",station_id:"sntf_sidi_bouabida_review",input_name:"SIDI BOUABIDA",name:"سيدي بوعبيدة",name_fr:"Sidi Bouabida",lat:0,lon:0,geo_verified:true}
]);
assert.equal(merged.stations.length,stations.length+1);
assert.equal(merged.stations.find(x=>x.id==="oued_aissi").sntf_names.includes("OUED AISSI"),true);
for(const station of stations)assert.equal(JSON.stringify(lockGeo(merged.stations.find(x=>x.id===station.id))),oldGeo.get(station.id),"Protected Google Maps pin must be unchanged: "+station.id);
const added=merged.stations.at(-1);
assert.equal(added.geo_verified,false);assert.equal(added.lat,null);assert.equal(added.lon,null);
assert.throws(()=>mergeApprovedStations(stations,[{...approved,approved:false,action:"link_alias",station_id:"oued_aissi",input_name:"OUED AISSI"}]),/Explicit review/);
assert.throws(()=>mergeApprovedStations(stations,[{...approved,action:"link_alias",station_id:"thenia",input_name:"OUED AISSI"}]),/alias another station/);
assert.deepEqual(stations.map(s=>JSON.stringify(lockGeo(s))),stations.map(s=>oldGeo.get(s.id)),"Merge may not mutate input");
const html=readFileSync("sectors/sntf.html","utf8");
assert.equal(gallery.images.length,29);
assert.equal(new Set(gallery.images.map(i=>i.id)).size,gallery.images.length);
assert(gallery.images.every(i=>html.includes(i.path)&&existsSync(i.path)&&i.status==="official_document_validity_unconfirmed"&&i.issuing_authority==="SNTF"&&i.source_page==="sectors/sntf.html"),"Every indexed gallery image must exist in repository, be referenced on SNTF page and distinguish official origin from schedule validity");
assert(gallery.images.some(i=>i.route_ids.includes("alger-thenia")),"Gallery must index Alger-Thenia timetable");
assert.equal(stations.filter(s=>s.geo_verified).length,saved.summary.existing_verified_coordinates_preserved,"Verified coordinate count unchanged since source review");
console.log("SNTF source ingestion tests PASS:",saved.summary.archived_trip_candidates,"historical candidates,",gallery.images.length,"gallery images, and",geoLock.stations.length,"locked verified Google Maps pins protected.");
