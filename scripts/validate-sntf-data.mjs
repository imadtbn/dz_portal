// Run from repository root: node scripts/validate-sntf-data.mjs
import {readFileSync} from "node:fs";
const read = name => JSON.parse(readFileSync("assets/data/sntf/"+name+".json","utf8"));
const stations=read("stations").stations,routes=read("routes").routes,lines=read("lines").lines,trips=read("trips").trips,calendarDoc=read("calendars"),calendars=calendarDoc.calendars,sources=read("sources").sources,holidays=read("holidays");
const errors=[];
function index(data,key){const ids=new Set();for(const item of data){const id=item[key];if(!id)errors.push("Missing "+key);else if(ids.has(id))errors.push("Duplicate "+key+": "+id);ids.add(id)}return ids}
const stationsById=index(stations,"id"),routesById=index(routes,"id"),calendarsById=index(calendars,"id"),sourcesById=index(sources,"id");
const linesById=index(lines,"id");
index(trips,"trip_id");
const time=value=>{if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(value||""))return null;const [h,m,s=0]=value.split(":").map(Number);return h<=47&&m<60&&s<60?h*60+m+s/60:null};
const date=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T12:00:00Z"));
const fail=(cond,message)=>{if(cond)errors.push(message)};
for(const s of stations){
 fail(!s.name||!s.name_fr,"Missing station name "+s.id);
 if(s.geo_verified===true){fail(!Number.isFinite(s.lat)||!Number.isFinite(s.lon),"Invalid coordinates "+s.id);fail(!s.geo_source,"Missing geo source "+s.id)}
}
for(const r of routes){
 fail(!stationsById.has(r.from)||!stationsById.has(r.to),"Unknown route terminal "+r.id);
 fail(!sourcesById.has(r.source),"Missing route source "+r.id);
 fail(!["suburban","eastern","western","sahara","international"].includes(r.category),"Invalid route category "+r.id);
 if(r.schedule_image!==null)fail(!/^\.\.\/assets\/train-schedules\//.test(r.schedule_image||""),"Invalid image path "+r.id);
 if(r.stops){fail(r.stops[0]!==r.from||r.stops.at(-1)!==r.to,"Route stops endpoints mismatch "+r.id);for(const id of r.stops)fail(!stationsById.has(id),"Unknown route stop "+id)}
}
const membership=new Map(),routeMap=new Map(routes.map(r=>[r.id,r]));
for(const line of lines){
 fail(!["suburban","eastern","western","sahara","international"].includes(line.category),"Invalid line category "+line.id);
 fail(!Array.isArray(line.route_ids)||!line.route_ids.length,"Line without routes "+line.id);
 for(const id of line.route_ids||[]){
  const r=routeMap.get(id);
  fail(!r,"Unknown route in line "+line.id+": "+id);
  fail(Boolean(r?.alias_of),"Legacy alias must not duplicate canonical line membership "+id);
  if(membership.has(id))fail(true,"Route appears in multiple lines "+id);
  membership.set(id,line.id);
  if(r)fail(r.line_id!==line.id||r.category!==line.category,"Route line/category mismatch "+id);
 }
}
for(const route of routes){
 const canonical=route.alias_of||route.id;
 fail(!membership.has(canonical)||route.line_id!==membership.get(canonical),"Route without canonical line membership "+route.id);
 if(route.alias_of)fail(!routesById.has(route.alias_of),"Unknown canonical alias target "+route.id);
 if(!route.stops?.length)fail(route.stops_status!=="intermediate_stops_pending_official_transcription","Undocumented intermediate stops must be explicit "+route.id);
}
for(const c of calendars){
 fail(!["daily","friday_holiday","weekday_not_friday","except_friday","friday_only"].includes(c.rule),"Invalid recurrence "+c.id);
 if(c.start_date||c.end_date)fail(!date(c.start_date)||!date(c.end_date)||c.end_date<c.start_date,"Invalid optional calendar dates "+c.id);
}
for(const holiday of holidays.dates){
 const dateValue=typeof holiday==="string"?holiday:holiday.date;
 fail(!date(dateValue),"Invalid holiday date "+dateValue);
}
for(const exception of calendarDoc.exceptions){
 fail(!calendarsById.has(exception.service_id)||!date(exception.date)||!["added","removed"].includes(exception.type),"Invalid calendar exception "+JSON.stringify(exception));
}
for(const t of trips){
 fail(!routesById.has(t.route_id),"Unknown route "+t.trip_id);
 fail(!calendarsById.has(t.service_id),"Unknown service "+t.trip_id);
 fail(!sourcesById.has(t.source_id),"Unknown source "+t.trip_id);
 const source=sources.find(x=>x.id===t.source_id);
 fail(t.data_status==="pending_review"&&source?.kind!=="manual-draft","Draft must use manual-draft provenance "+t.trip_id);
 fail(t.data_status==="verified"&&(!source?.verified_at||!t.train_number),"Verified trip requires verified source and train number "+t.trip_id);
 fail(t.data_status!=="pending_review"&&source?.kind==="manual-draft","Unverified manual draft must not appear as published "+t.trip_id);
 fail(!Array.isArray(t.stop_times)||t.stop_times.length<2,"Not enough stops "+t.trip_id);
 if(!Array.isArray(t.stop_times)||t.stop_times.length<2)continue;
 let previous=-1,sequence=0;
 for(const stop of t.stop_times){
  fail(!stationsById.has(stop.station_id),"Unknown stop "+stop.station_id);
  fail(stop.sequence<=sequence,"Stop sequences not increasing "+t.trip_id);
  sequence=stop.sequence;
  const arr=stop.arrival===null?null:time(stop.arrival),dep=stop.departure===null?null:time(stop.departure);
  fail(stop.arrival!==null&&arr===null||stop.departure!==null&&dep===null,"Invalid time "+t.trip_id);
  const current=arr??dep;
  fail((current===null&&t.data_status!=="pending_review")||(current!==null&&current<previous),"Nonmonotonic or missing published stop time "+t.trip_id);
  fail(arr!==null&&dep!==null&&dep<arr,"Depart before arrival "+t.trip_id);
  previous=dep??arr??previous;
 }
 const route=routes.find(x=>x.id===t.route_id);
 fail(Boolean(route)&&(route.from!==t.stop_times[0].station_id||route.to!==t.stop_times.at(-1).station_id),"Trip and route endpoints mismatch "+t.trip_id);
 if(route?.stops?.length && t.data_status!=="pending_review"){
  let last=-1;
  for(const stop of t.stop_times){const position=route.stops.indexOf(stop.station_id);fail(position<=last,"Published stop missing from ordered route corridor "+t.trip_id+": "+stop.station_id);last=position;}
 }
}
for(const source of sources)fail(!source.url?.startsWith("https://"),"Source URL missing "+source.id);
const fullIds=new Set(),normalized=new Map();
const clean=n=>String(n??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"");
for(const s of stations){for(const name of [s.name_fr,...(s.sntf_names||[])]){
 const n=clean(name);
 if(normalized.has(n)&&normalized.get(n)!==s.id)errors.push("Duplicate station name/alias "+name+": "+s.id+" conflicts with "+normalized.get(n));
 normalized.set(n,s.id);
}}
for(const t of trips){
 const unique=t.route_id+"|"+t.train_number+"|"+t.service_id+"|"+t.stop_times?.[0]?.departure;
 if(t.data_status!=="pending_review"){
  if(fullIds.has(unique))errors.push("Duplicate published trip "+unique);
  fullIds.add(unique);
 }
}

if(errors.length){console.error(errors.join("\\n"));process.exitCode=1}else console.log("DZ Rail validation OK: "+stations.length+" stations; "+lines.length+" lines; "+routes.length+" routes; "+trips.filter(t=>t.data_status==="source_transcribed").length+" transcribed timetable trips; "+trips.filter(t=>t.data_status==="pending_review").length+" editable unpublished drafts; "+holidays.dates.length+" holiday dates.");
