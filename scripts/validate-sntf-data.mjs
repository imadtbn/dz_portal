// Run from repository root: node scripts/validate-sntf-data.mjs
import {readFileSync} from "node:fs";
const root = "assets/data/sntf/";
const read = name => JSON.parse(readFileSync(root+name+".json","utf8"));
const stations=read("stations").stations,routes=read("routes").routes,trips=read("trips").trips,calendars=read("calendars").calendars,sources=read("sources").sources;
const errors=[];
const unique=(arr,type)=>{const ids=new Set();for(const x of arr){if(!x.id)errors.push(type+" missing id");else if(ids.has(x.id))errors.push(type+" duplicate id: "+x.id);ids.add(x.id)}return ids};
const stationIds=unique(stations,"stations"),routeIds=unique(routes,"routes"),calendarIds=unique(calendars,"calendars"),sourceIds=unique(sources,"sources");
const time=value=>{if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(value||""))return null;const [h,m,s=0]=value.split(":").map(Number);return h<=47&&m<60&&s<60?h*60+m+s/60:null};
for(const s of stations){
 if(!s.name||!s.name_fr)errors.push("station name missing: "+s.id);
 if(s.geo_verified===true&&(!Number.isFinite(s.lat)||!Number.isFinite(s.lon)||s.lat<18||s.lat>38||s.lon<-9||s.lon>12)&&s.id!=="tunis")errors.push("invalid verified station coordinates: "+s.id);
 if(s.geo_verified===true&&!s.geo_source)errors.push("geo source missing: "+s.id);
}
for(const r of routes){
 if(!stationIds.has(r.from)||!stationIds.has(r.to))errors.push("unknown route terminal: "+r.id);
 if(!sourceIds.has(r.source))errors.push("route source missing: "+r.id);
 if(!["suburban","eastern","western","sahara","international"].includes(r.category))errors.push("unknown route category: "+r.id);
 if(!/^..\x2fassets\x2ftrain-schedules\x2f/.test(r.schedule_image||""))errors.push("gallery path invalid: "+r.id);
}
for(const t of trips){
 if(!t.id&&!t.trip_id)errors.push("trip id missing");
 if(!routeIds.has(t.route_id))errors.push("trip route unknown: "+t.trip_id);
 if(!calendarIds.has(t.service_id))errors.push("trip calendar unknown: "+t.trip_id);
 if(!sourceIds.has(t.source_id))errors.push("trip source unknown: "+t.trip_id);
 if(!Array.isArray(t.stop_times)||t.stop_times.length<2){errors.push("trip needs two or more stops: "+t.trip_id);continue}
 let prev=-1;const sequences=new Set();
 for(const stop of t.stop_times){
  if(!stationIds.has(stop.station_id))errors.push("unknown trip station: "+t.trip_id);
  if(sequences.has(stop.sequence))errors.push("duplicate stop sequence: "+t.trip_id);sequences.add(stop.sequence);
  const arr=stop.arrival===null?null:time(stop.arrival),dep=stop.departure===null?null:time(stop.departure);
  if(stop.arrival!==null&&arr===null||stop.departure!==null&&dep===null)errors.push("invalid stop time: "+t.trip_id);
  const cur=arr??dep;
  if(cur!==null&&cur<prev)errors.push("nonmonotonic trip times: "+t.trip_id);
  if(arr!==null&&dep!==null&&dep<arr)errors.push("departure before arrival: "+t.trip_id);
  prev=dep??arr??prev;
 }
}
for(const c of calendars){if(!/^\d{4}-\d\d-\d\d$/.test(c.start_date||"")||!/^\d{4}-\d\d-\d\d$/.test(c.end_date||"")||c.end_date<c.start_date)errors.push("invalid calendar: "+c.id)}
for(const s of sources){if(!s.url?.startsWith("https://"))errors.push("invalid source URL: "+s.id)}
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}else{console.log("DZ Rail validation OK: "+stations.length+" stations, "+routes.length+" routes, "+trips.length+" trips, "+sources.length+" sources.");if(trips.length===0)console.log("No digital timetables published: gallery fallback enabled.")}