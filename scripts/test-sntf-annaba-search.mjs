import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const readJSON=path=>JSON.parse(readFileSync(path,"utf8"));
const moduleFrom=path=>import("data:text/javascript;base64,"+Buffer.from(readFileSync(path,"utf8")).toString("base64"));
const engine=await moduleFrom("assets/js/sntf-trains/engine.js");
const engineUrl="data:text/javascript;base64,"+Buffer.from(readFileSync("assets/js/sntf-trains/engine.js","utf8")).toString("base64");
const plannerSource=readFileSync("assets/js/sntf-trains/planner.js","utf8").replace("from './engine.js'","from '"+engineUrl+"'");
const planner=await import("data:text/javascript;base64,"+Buffer.from(plannerSource).toString("base64"));
const catalog=await moduleFrom("assets/js/sntf-schedules/catalog.js");
const {trips}=readJSON("assets/data/sntf/trips.json");
const {routes}=readJSON("assets/data/sntf/routes.json");
const {calendars,exceptions=[]}=readJSON("assets/data/sntf/calendars.json");
const holidayData=readJSON("assets/data/sntf/holidays.json");
const targetIds=["photo-east-agha-annaba","photo-east-annaba-agha"];
const selected=targetIds.map(id=>trips.find(t=>t.trip_id===id));
assert(selected.every(Boolean),"Both official Annaba train records must exist");
const [outbound,returning]=selected;
assert.equal(outbound.route_id,"alger-annaba");
assert.equal(returning.route_id,"annaba-alger");
for(const trip of selected){
 assert.equal(trip.data_status,"source_transcribed");
 assert.equal(trip.service_id,"daily","The official daily timetable must activate the trip on all weekdays");
 assert.equal(trip.source_id,"eastern-gallery-annaba-daily");
 assert.equal(trip.operating_days_status,"daily_confirmed_by_official_image");
 assert(trip.operating_days_note.includes("يسير يوميًا"));
 assert(trip.stop_times.length>=17);
}
const config={calendars,exceptions,holidays:holidayData.dates||[]};
for(const date of ["2026-10-24","2026-10-25","2026-10-30","2026-11-01"]){
 assert(engine.runsOn(outbound,date,calendars,exceptions,config.holidays),"Agha–Annaba must run daily on "+date);
 assert(engine.runsOn(returning,date,calendars,exceptions,config.holidays),"Annaba–Agha must run daily on "+date);
}
const outboundResults=planner.planJourney({trips,origin:"agha",destination:"annaba",date:"2026-10-24",after:"00:00",calendars,exceptions,holidays:config.holidays});
const returnResults=planner.planJourney({trips,origin:"annaba",destination:"agha",date:"2026-10-24",after:"00:00",calendars,exceptions,holidays:config.holidays});
assert(outboundResults.direct.some(x=>x.trip.trip_id==="photo-east-agha-annaba"),"Agha–Annaba appears in the journey search");
assert(returnResults.direct.some(x=>x.trip.trip_id==="photo-east-annaba-agha"),"Annaba–Agha appears in the journey search");
assert.equal(catalog.schedulePageForImage("https://imadtbn.github.io/dz_portal/assets/train-schedules/Eastern/alger-annaba-tj.jpg"),"sntf-schedule.html?schedule=alger-annaba");
assert.equal(catalog.findSchedule("alger-annaba-tj").id,"alger-annaba","Legacy daily timetable links resolve to the canonical schedule");
assert.equal(catalog.findSchedule("alger-annaba-days").image,"../assets/train-schedules/Eastern/alger-annaba.jpg","The alternate weekday poster remains available separately");
for(const id of ["alger-annaba","annaba-alger"]){
 const route=routes.find(r=>r.id===id);
 assert.equal(route.schedule_image,"../assets/train-schedules/Eastern/alger-annaba-tj.jpg");
 assert.equal(route.source,"eastern-gallery-annaba-daily");
}
const app=readFileSync("assets/js/sntf-trains/app.js","utf8");
const page=readFileSync("assets/js/sntf-schedules/page.js","utf8");
const html=readFileSync("sectors/sntf.html","utf8");
assert(app.includes("catalog.js?v=20261024-annaba-daily"));
assert(page.includes("catalog.js?v=20261024-annaba-daily"));
assert(html.includes('href="sntf-schedule.html?schedule=alger-annaba"'));
assert(html.includes('href="sntf-schedule.html?schedule=alger-annaba-days"'));
console.log("SNTF Annaba search PASS: both official daily directions appear on the selected date and link to the canonical schedule.");
