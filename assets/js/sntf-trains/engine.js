// DZ Rail 2.0: pure timetable calculations, reusable by the dashboard and tests.
// Recurrence is evaluated on each requested service date; JSON files do not need daily regeneration.
export const ALGIERS_TZ="Africa/Algiers";
export const mins=t=>{if(typeof t!=="string"||!/^\d{2}:\d{2}(?::\d{2})?$/.test(t))return NaN;const [h,m,s=0]=t.split(":").map(Number);return h<=47&&m<60&&s<60?h*60+m+s/60:NaN};
export const dayParts=(now=new Date())=>Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:ALGIERS_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now).map(x=>[x.type,x.value]));
export const dayISO=now=>{const p=dayParts(now);return [p.year,p.month,p.day].join("-")};
export const shiftISO=(date,days)=>new Date(Date.parse(date+"T12:00:00Z")+days*86400000).toISOString().slice(0,10);
export const dayOfWeek=date=>new Date(date+"T12:00:00Z").getUTCDay();
export const isHoliday=(date,holidays)=>holidays.some(x=>(typeof x==="string"?x:x.date)===date);
export function runsOn(trip,date,calendars,exceptions=[],holidays=[]){
  const cal=calendars.find(c=>c.id===trip.service_id);
  if(!cal)return false;
  if(trip.effective_from&&date<trip.effective_from)return false;
  if(trip.effective_until&&date>trip.effective_until)return false;
  if(cal.start_date&&date<cal.start_date||cal.end_date&&date>cal.end_date)return false;
  const ex=exceptions.find(e=>e.service_id===trip.service_id&&e.date===date);
  if(ex)return ex.type==="added";
  const friday=dayOfWeek(date)===5,holiday=isHoliday(date,holidays);
  if(cal.rule==="daily")return true;
  if(cal.rule==="friday_holiday")return friday||holiday;
  if(cal.rule==="weekday_not_friday")return !friday&&!holiday;
  if(cal.rule==="except_friday")return !friday;
  const names=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  return Boolean(cal.days?.[names[dayOfWeek(date)]]);
}
export function recordsAtStation(trips,stationId,kind,date,config,now=new Date()){
 const ms=now.getTime(),events=[];
 // Yesterday handles overnight services with 24+ hour times.
 for(const offset of [-1,0,1,2]){
   const serviceDate=shiftISO(date,offset);
   for(const trip of trips){
    if(!runsOn(trip,serviceDate,config.calendars,config.exceptions,config.holidays))continue;
    const stopIndex=trip.stop_times?.findIndex(s=>s.station_id===stationId)??-1;
    if(stopIndex<0)continue;
    const stop=trip.stop_times[stopIndex];
    const time=kind==="departure"?stop.departure:stop.arrival;
    const minute=mins(time);
    if(!Number.isFinite(minute))continue;
    // Railway times are Algeria local time. Explicit UTC+01:00 avoids the viewer's timezone.
    const timestamp=Date.parse(serviceDate+"T00:00:00+01:00")+minute*60000;
    const remaining=Math.floor((timestamp-ms)/1000);
    if(remaining<0||remaining>48*3600)continue;
    events.push({trip,kind,stop,stopIndex,serviceDate,timestamp,remaining,
      origin:trip.stop_times[0].station_id,destination:trip.stop_times.at(-1).station_id,
      previous:trip.stop_times[stopIndex-1]?.station_id??null,
      following:trip.stop_times[stopIndex+1]?.station_id??null});
   }
 }
 return events.sort((a,b)=>a.timestamp-b.timestamp||String(a.trip.train_number??"").localeCompare(String(b.trip.train_number??""))).slice(0,80);
}
export const eligible=(trips,includeDraft=false)=>trips.filter(t=>includeDraft||t.data_status!=="pending_review");
export const formatTime=(time)=>{const m=mins(time);if(!Number.isFinite(m))return "—";const h=Math.floor(m/60);return String(h%24).padStart(2,"0")+":"+String(Math.floor(m%60)).padStart(2,"0")+(h>=24?" +1":"")};
export const countdown=seconds=>{let n=Math.max(0,Math.floor(seconds));const hours=Math.floor(n/3600);n%=3600;return String(hours).padStart(2,"0")+":"+String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")};
export const classify=trip=>trip.data_status==="pending_review"?"draft":trip.data_status==="verified"?"verified":"transcribed";
export function directionsAtStation(trips,stationId){
 const options=new Map();
 for(const trip of trips){const i=trip.stop_times?.findIndex(s=>s.station_id===stationId)??-1;if(i<0)continue;for(const kind of ["departure","arrival"]){if(!trip.stop_times[i][kind])continue;const dest=kind==="departure"?trip.stop_times.at(-1).station_id:trip.stop_times[0].station_id;options.set(kind+":"+dest,{key:kind+":"+dest,kind,terminal:dest})}}
 return [...options.values()];
}
