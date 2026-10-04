import {schedulePageForImage} from "../sntf-schedules/catalog.js?v=20261004-stable";
import {dayParts,dayISO,recordsAtStation,eligible,formatTime,countdown,classify,mins} from "./engine.js";
import {planJourney} from "./planner.js";
import {stationPicker} from "./station-picker.js?v=20261003-no-default-station";
import {railwayCategories,categoryRoutes,canonicalRouteId,routeTrips,routeStopSummary,lineRoutes,lineSummary,stationLineServices,eligibleStationIdsByCategory} from "./network.js?v=20260928-catalog-audit";
const dataRoot=new URL("../../data/sntf/",import.meta.url);
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={stations:[],routes:[],lines:[],category:"",allowedStopIds:null,trips:[],calendars:[],exceptions:[],holidays:[],holidaysComplete:false,sources:[],selected:null,route:"",user:null,map:null,mapPending:null,markers:[],userMarker:null,activePopup:null,activeTask:"search",boardMode:"departures",boardLimit:{departure:20,arrival:20},lastMinute:"",busy:false,journeys:[],journeyStations:[],boardStations:[],journeyResults:null,journeyLimit:{direct:4,connections:3}};
let mapExpanded=false,nativeMapFullscreen=false;
const journeyPickers={};
let boardPicker,mapPicker;
function setMapExpanded(expanded){
 mapExpanded=expanded;
 $("map-viewer").classList.toggle("is-expanded",expanded);
 document.body.classList.toggle("map-expanded",expanded);
 const button=$("map-fullscreen"),label=expanded?"تصغير الخريطة":"ملء الشاشة";
 button.innerHTML='<span aria-hidden="true">'+(expanded?'⤢':'⛶')+'</span> '+label;
 button.setAttribute("aria-pressed",String(expanded));button.title=label;
 state.map?.invalidateSize({pan:false});
}
async function closeMapFullscreen(restoreFocus=true){
 setMapExpanded(false);
 if(document.fullscreenElement===$("map-viewer")){
  try{await document.exitFullscreen()}catch{/* Restore the layout even if the browser has already exited. */}
 }
 nativeMapFullscreen=false;if(restoreFocus&&state.activeTask==="explore")$("map-fullscreen").focus();
}
async function toggleMapFullscreen(){
 if(mapExpanded){await closeMapFullscreen();return}
 setMapExpanded(true);
 if($("map-viewer").requestFullscreen){
  try{await $("map-viewer").requestFullscreen();nativeMapFullscreen=true}
  catch{/* The viewport layout also supports browsers without native fullscreen. */}
 }
 state.map?.invalidateSize({pan:false});
}
function showTask(task,focus=false,updateUrl=false){
 if(!["search","station","explore"].includes(task))task="search";
 if(task!=="explore"&&mapExpanded)closeMapFullscreen(false);
 state.activeTask=task;
 for(const id of ["search","station","explore"]){
  $("panel-"+id).hidden=id!==task;
  const tab=$("task-"+id);tab.setAttribute("aria-selected",String(id===task));tab.tabIndex=id===task?0:-1;
  if(id===task&&focus)tab.focus();
 }
 if(task==="explore"){
  fillRouteCatalog();
  if(state.map)state.map.invalidateSize?.();
  else if(state.stations.length&&!state.mapPending)state.mapPending=initMap().finally(()=>{state.mapPending=null});
 }
 if(updateUrl)window.history?.replaceState(null,"","#panel-"+task);
}
const station=id=>state.stations.find(s=>s.id===id);
const name=id=>station(id)?.name||id;
const routeFor=id=>state.routes.find(r=>r.id===id);
const lineFor=id=>state.lines.find(l=>l.id===id);
const canonical=id=>canonicalRouteId(routeFor(id)||{id});
const tripPageLink=(trip,date,from='',to='')=>{const query=new URLSearchParams({trip:trip.trip_id,date});if(from)query.set('from',from);if(to)query.set('to',to);return 'sntf-trip.html?'+query.toString()};
const categoryLabel=Object.fromEntries(railwayCategories.map(category=>[category.id,category.label]));
const serviceLabel={daily:"كل يوم",friday_holiday:"الجمعة والأعياد",weekday_not_friday:"عدا الجمعة والأعياد",except_friday:"عدا الجمعة",friday_only:"الجمعة فقط"};
const serviceName=id=>state.calendars.find(c=>c.id===id)?.label||serviceLabel[id]||id;
const hasGeo=s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&Math.abs(s.lat)<=90&&Math.abs(s.lon)<=180;
const verifiedGeo=s=>s.geo_verified===true&&hasGeo(s);
const editableTrips=()=>eligible(state.trips).filter(t=>state.route?t.route_id===canonical(state.route):!state.category||routeFor(t.route_id)?.category===state.category);
async function get(name,key){const response=await fetch(new URL(name+".json",dataRoot),{cache:"no-cache"});if(!response.ok)throw Error(name+": HTTP "+response.status);const data=await response.json();if(!Array.isArray(data[key]))throw Error(name+": بيانات غير صالحة");return data}
function allowedOnRoute(s){return state.allowedStopIds===null||state.allowedStopIds.has(s.id)}
function updateAllowedStations(){
 state.allowedStopIds=eligibleStationIdsByCategory(state.category,state.route,state.lines,state.routes,state.trips);
}
function fillRouteOptions(){
 const select=$("route-filter"),info=$("route-filter-help");
 if(!state.category){
  select.replaceChildren(new Option("اختر نوع الخط أولًا",""));
  select.disabled=true;
  info.textContent="اختر نوع الخط لتظهر المسارات والاتجاهات المتاحة ضمنه.";
  return;
 }
 select.disabled=false;
 const filteredLines=state.lines.filter(line=>line.category===state.category);
 const groups=filteredLines.map(line=>{
  const options=lineRoutes(line,state.routes);
  if(!options.length)return null;
  const group=document.createElement("optgroup");
  group.label=line.name;
  group.append(...options.map(route=>{
   const count=routeTrips(route,state.trips).length;
   return new Option(route.name+(count?"":" · المواقيت قيد الإدخال"),route.id);
  }));
  return group;
 }).filter(Boolean);
 select.replaceChildren(new Option("جميع المسارات والاتجاهات ضمن هذا النوع",""),...groups);
 if(state.route)select.value=state.route;
 const count=categoryRoutes(state.category,state.routes).length;
 info.textContent=count+" مسارًا متاحًا ضمن "+categoryLabel[state.category]+"؛ اختر اتجاهًا لعرض محطاته ومواقيته.";
}
function listStations(){
 const mapped=state.stations.filter(s=>allowedOnRoute(s)&&hasGeo(s));
 $("map-count").textContent=mapped.length+" محطة على الخريطة · "+mapped.filter(s=>!verifiedGeo(s)).length+" موقع قيد التحقق";
}
function km(p,s){const d=Math.PI/180,dLat=(s.lat-p.lat)*d,dLon=(s.lon-p.lon)*d,a=Math.sin(dLat/2)**2+Math.cos(p.lat*d)*Math.cos(s.lat*d)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function chooseStation(id,{focusMap=false}={}){
 if(!station(id))return;
 state.selected=id;state.boardLimit={departure:20,arrival:20};$("station").value=id;
 boardPicker?.set(station(id));mapPicker?.set(station(id));
 $("selected-name").textContent=name(id);
 $("selected-subtitle").textContent=station(id).name_fr+" · المغادرات والوصول حسب التوقفات المدخلة";
 fillStationLines();fillDirections();listStations();renderBoards();
 refreshMarkers();
 if(focusMap&&state.map&&state.activeTask==="explore"){
  const s=station(id);if(hasGeo(s)){
   state.map.setView([s.lat,s.lon],Math.max(9,state.map.getZoom()),{animate:true});
   state.markers.find(marker=>marker.stationId===id)?.openPopup();
  }
 }
}
function stationBoardUrl(id){
 const url=new URL(location.href);url.searchParams.set("station",id);url.hash="panel-station";
 return url.href;
}
function openStation(id){
 if(!station(id))return;
 chooseStation(id);showTask("station");
 window.history?.replaceState(null,"",stationBoardUrl(id));
 $("station-board").scrollIntoView({behavior:"smooth",block:"start"});
}
function fillStationLines(){
 const root=$("station-services"),count=$("station-line-count");
 if(!state.selected){count.textContent="—";root.innerHTML='<p class="minor">اختر محطة لعرض الخطوط التي يتوقف بها قطار له توقيت مدخل.</p>';return}
 const groups=stationLineServices(state.selected,state.lines,state.routes,state.trips)
  .filter(group=>!state.category||lineFor(group.line_id)?.category===state.category)
  .map(group=>{
   const routes=group.route_services.filter(r=>!state.route||r.route_id===state.route);
   return {...group,route_services:routes,train_count:routes.reduce((n,r)=>n+r.count,0)};
  }).filter(group=>group.route_services.length);
 count.textContent=groups.length+" خط";
 if(!groups.length){root.innerHTML='<p class="minor">لا توجد توقفات موثقة لهذه المحطة ضمن النوع أو المسار المحدد. يمكن تغيير المرشحات أو مراجعة الجداول المصورة.</p>';return}
 root.innerHTML=groups.map(g=>{
  const buttons=g.route_services.map(x=>'<button type="button" class="service-route" data-station-route="'+esc(x.route_id)+'">'+esc(routeFor(x.route_id)?.name||x.route_id)+' <small>'+x.count+' قطار · '+x.departures+' مغادرة · '+x.arrivals+' وصول</small></button>').join("");
  return '<div class="station-service-group"><strong>'+esc(g.line_name)+'</strong><span class="tag">'+g.train_count+' رحلة مدخلة</span><div class="service-route-list">'+buttons+'</div></div>';
 }).join("");
}
function fillDirections(){
 const old=$("direction").value,options=new Map();
 for(const t of editableTrips()){
  const i=t.stop_times.findIndex(s=>s.station_id===state.selected);if(i<0)continue;
  if(t.stop_times[i].departure!=null)options.set("departure:"+t.stop_times.at(-1).station_id,"نحو "+name(t.stop_times.at(-1).station_id));
  if(t.stop_times[i].arrival!=null)options.set("arrival:"+t.stop_times[0].station_id,"قادِم من "+name(t.stop_times[0].station_id));
 }
 $("direction").replaceChildren(new Option("كل الاتجاهات",""),...[...options].sort((a,b)=>a[1].localeCompare(b[1],"ar")).map(([value,label])=>new Option(label,value)));
 if(options.has(old))$("direction").value=old;
}
function filterDirection(events,kind){
 const choice=$("direction").value;
 if(!choice)return events;
 const [selectedKind,terminal]=choice.split(":");
 if(selectedKind!==kind)return [];
 return events.filter(e=>(kind==="departure"?e.destination:e.origin)===terminal);
}
function statusBadge(trip){
 if(classify(trip)==="verified")return '<span class="tag">موثق</span>';
  const source=state.sources.find(s=>s.id===trip.source_id);
  if(source?.official_document||source?.issuing_authority==="SNTF")return '<span class="tag">جدول SNTF مصور</span>';
  return '<span class="tag warn">جدول منقول · السريان غير مؤكد</span>';
}
function details(event){
 const t=event.trip,rows=t.stop_times.map((stop,i)=>{
  const current=stop.station_id===state.selected;
  const a=stop.arrival,d=stop.departure,distinct=a&&d&&a!==d;
  const times=distinct?'<span class="stop-times"><span>الوصول <time dir="ltr">'+formatTime(a)+'</time></span><span>المغادرة <time dir="ltr">'+formatTime(d)+'</time></span></span>':'<time dir="ltr">'+formatTime(d??a)+'</time>';
  return '<li'+(current?' class="current"':'')+'><span>'+(i+1)+'. '+esc(name(stop.station_id))+(current?" (المحطة المختارة)":"")+'</span>'+times+'</li>';
 }).join("");
 return '<details><summary>تفاصيل المسار والتوقفات الموثقة ('+t.stop_times.length+')</summary><ol class="stop-list">'+rows+'</ol></details>';
}
function eventHtml(event,kind){
 const t=event.trip,other=kind==="departure"?event.destination:event.origin;
 const route=routeFor(t.route_id);
 const time=kind==="departure"?event.stop.departure:event.stop.arrival;
 const dateShown=event.serviceDate!==dayISO()?' <span class="tag">'+esc(event.serviceDate)+'</span>':"";
 const prevNext=kind==="departure"?event.following:event.previous;
 const subtitle=prevNext?(kind==="departure"?"المحطة التالية: ":"المحطة السابقة: ")+name(prevNext):"";
 const source=state.sources.find(s=>s.id===t.source_id);
 const photo=source?.kind==="official-timetable-image"&&/^https:\/\/imadtbn\.github\.io\/dz_portal\/assets\/train-schedules\//.test(source.url||"")?source.url:route?.schedule_image;
 const photoPage=schedulePageForImage(photo);
 const link=photoPage?'<a class="photo-source" href="'+esc(photoPage)+'">عرض الجدول الرسمي ↗</a>':photo&&(/^(https:\/\/imadtbn\.github\.io\/dz_portal)?\/assets\/train-schedules\//.test(photo)||/^\.\.\/assets\/train-schedules\//.test(photo))?'<a class="photo-source" href="'+esc(photo)+'" target="_blank" rel="noopener noreferrer">عرض صورة الجدول الرسمي ↗</a>':source?.url?.startsWith("https://")?'<a class="photo-source" href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">مصدر المواقيت ↗</a>':"";
 const page='<a class="photo-source" href="'+esc(tripPageLink(t,event.serviceDate,state.selected))+'">صفحة الرحلة كاملة ←</a>';
 return '<article class="event '+(event.remaining>=0&&event.remaining<=900?" imminent":"")+'"><div class="event-top"><div><h4>'+esc(kind==="departure"?"إلى "+name(other):"من "+name(other))+'</h4><span class="minor">'+esc(route?.name||"")+'</span></div><time dir="ltr">'+formatTime(time)+'</time></div><div class="event-meta"><span class="tag">رقم القطار: '+esc(t.train_number||"غير محدد")+'</span><span class="tag">'+esc(serviceName(t.service_id))+'</span>'+statusBadge(t)+dateShown+'</div><p>'+esc(subtitle)+'</p><p>'+(kind==="departure"?"المتبقي للمغادرة: ":"المتبقي للوصول: ")+'<span class="countdown" data-target="'+event.timestamp+'" dir="ltr">'+countdown(event.remaining)+'</span></p><p class="minor">'+esc(source?.notice||"الموعد مجدول، وليس تتبعًا مباشرًا.")+'</p>'+page+link+details(event)+'</article>';
}
function panel(kind,events){
 const el=$(kind==="departure"?"departures":"arrivals");
 const count=$(kind==="departure"?"count-departures":"count-arrivals");
 const next=$(kind==="departure"?"next-departure":"next-arrival");
 count.textContent=String(events.length);
 next.textContent=events.length?"التالي "+countdown(events[0].remaining):"—";
 if(!state.selected){el.innerHTML='<div class="empty">حدّد موقعك لجلب أقرب محطة أو اختر محطة بالبحث أو من الخريطة.</div>';return}
 if(!events.length){el.innerHTML='<div class="empty">لا توجد '+(kind==="departure"?"مغادرات":"وصولات")+' مدرجة خلال 48 ساعة وفق الجداول المدخلة. عدم ظهور نتيجة لا يعني عدم وجود قطارات. <a href="sntf.html">راجع الجداول المصورة</a>.</div>';return}
 const limit=state.boardLimit[kind];
 el.innerHTML=events.slice(0,limit).map(e=>eventHtml(e,kind)).join("")+(events.length>limit?'<button type="button" class="button outline board-more" data-more="'+kind+'">عرض 20 رحلة إضافية (المتبقي '+(events.length-limit)+')</button>':"");
}
function renderBoards(now=new Date()){
 if(!state.selected){panel("departure",[]);panel("arrival",[]);return}
 const options={calendars:state.calendars,exceptions:state.exceptions,holidays:state.holidays};
 const day=dayISO(now),trips=editableTrips();
 const departures=filterDirection(recordsAtStation(trips,state.selected,"departure",day,options,now),"departure");
 const arrivals=filterDirection(recordsAtStation(trips,state.selected,"arrival",day,options,now),"arrival");
 panel("departure",departures);panel("arrival",arrivals);
}
const journeyClock = ms => new Intl.DateTimeFormat('ar-DZ-u-nu-latn',{timeZone:'Africa/Algiers',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(ms);
const journeyDay = ms => new Intl.DateTimeFormat('ar-DZ-u-nu-latn',{timeZone:'Africa/Algiers',day:'numeric',month:'short'}).format(ms);
const journeyDuration = minutes => `${Math.floor(minutes/60)} س ${Math.round(minutes%60)} د`;
const journeyTime = ms => `<time datetime="${new Date(ms).toISOString()}">${esc(journeyClock(ms))} <small>${esc(journeyDay(ms))}</small></time>`;
function journeyLeg(leg){
 const stops=leg.trip.stop_times.slice(leg.fromIndex,leg.toIndex+1);
 const route=routeFor(leg.trip.route_id),source=state.sources.find(s=>s.id===leg.trip.source_id);
 const img=source?.kind==='official-timetable-image'?source.url:route?.schedule_image;
 const imagePage=schedulePageForImage(img);
 const sourceLink=imagePage?`<a href="${esc(imagePage)}">عرض الجدول المصوّر ↗</a>`:img&&(/^(https:\/\/imadtbn\.github\.io\/dz_portal)?\/assets\/train-schedules\//.test(img)||/^\.\.\/assets\/train-schedules\//.test(img))
  ?`<a href="${esc(img)}" target="_blank" rel="noopener noreferrer">صورة الجدول ↗</a>`:'';
 const list=stops.map((stop,i)=>{
  const arrival=stop.arrival==null?'—':formatTime(stop.arrival),departure=stop.departure==null?'—':formatTime(stop.departure);
  return `<li><span>${esc(name(stop.station_id))}</span><span><time dir="ltr">${esc(arrival)}</time> وصول · <time dir="ltr">${esc(departure)}</time> مغادرة</span></li>`;
 }).join('');
 return `<div class="journey-leg"><div><strong>${esc(name(leg.from))} ← ${esc(name(leg.to))}</strong><span>القطار ${esc(leg.trip.train_number||'غير محدد')} · ${esc(serviceName(leg.trip.service_id))}</span></div><div class="journey-times">${journeyTime(leg.departure)} ← ${journeyTime(leg.arrival)}</div><a class="photo-source" href="${esc(tripPageLink(leg.trip,leg.serviceDate,leg.from,leg.to))}">صفحة القطار وكل توقفاته ←</a><details><summary>تفاصيل الرحلة ومحطات التوقف (${stops.length})</summary><ol class="stop-list">${list}</ol><p class="minor">${esc(source?.name||'جدول مصور')} · ${esc(leg.serviceDate)}</p>${sourceLink}</details></div>`;
}
function journeyCard(item,index){
 const transfer=Boolean(item.second),first=transfer?item.first:item,last=transfer?item.second:item;
 const title=transfer?`تبديل في ${name(item.station)} · انتظار ${journeyDuration(item.wait)}`:'رحلة مباشرة';
 const links=[first,last].filter((leg,i)=>!i||transfer).map((leg,i)=>`<a class="photo-source" href="${esc(tripPageLink(leg.trip,leg.serviceDate,leg.from,leg.to))}">${transfer?'القطار '+(i+1):'صفحة الرحلة'} · ${esc(leg.trip.train_number||'غير محدد')} ←</a>`).join('');
 return `<article class="journey-card"><div class="journey-card-head"><strong>${esc(title)}</strong><span>${journeyTime(first.departure)} ← ${journeyTime(last.arrival)}</span></div><p class="minor">${esc(name(first.from))} ← ${esc(name(last.to))} · المدة ${esc(journeyDuration((last.arrival-first.departure)/60000))}</p><div class="journey-links">${links}</div><details class="journey-extra"><summary>التوقفات والتذكيرات</summary>${journeyLeg(first)}${transfer?journeyLeg(last):''}<div class="journey-actions"><button class="button outline" type="button" data-calendar="${index}">إضافة تذكير إلى التقويم</button><button class="button outline" type="button" data-remind="${index}">تنبيه أثناء فتح الصفحة</button></div></details></article>`;
}
function populateJourneyStations(){
 const ids=new Set(state.trips.filter(t=>t.data_status==='source_transcribed'||t.data_status==='verified').flatMap(t=>t.stop_times.filter(s=>s.arrival!=null||s.departure!=null).map(s=>s.station_id)));
 state.journeyStations=state.stations.filter(s=>ids.has(s.id)).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
 for(const kind of ['from','to']){
  const input=$('journey-'+kind+'-search');
  journeyPickers[kind]=stationPicker({input,value:$('journey-'+kind),list:$('journey-'+kind+'-options'),note:$('journey-'+kind+'-count')},state.journeyStations,tag=>document.createElement(tag));
  input.disabled=false;
 }
 $('journey-submit').disabled=false;
 $('journey-date').value=dayISO(new Date());
 const p=dayParts(new Date());$('journey-after').value=p.hour+':'+p.minute;
}
function refreshStationPickers(stations){
 if(boardPicker)boardPicker.updateStations(stations);
 else boardPicker=stationPicker({input:$("station-search-board"),value:$("station"),list:$("station-board-options"),note:$("station-search-board-count"),onChoose:s=>chooseStation(s.id)},stations,tag=>document.createElement(tag));
 if(mapPicker)mapPicker.updateStations(stations);
 else mapPicker=stationPicker({input:$("station-search"),value:$("map-station"),list:$("station-results"),note:$("map-search-count"),onChoose:s=>chooseStation(s.id,{focusMap:true})},stations,tag=>document.createElement(tag));
}
function searchJourneys(){
 if(!journeyPickers.from?.validate()||!journeyPickers.to?.validate())return;
 const origin=$('journey-from').value,destination=$('journey-to').value,date=$('journey-date').value,after=$('journey-after').value;
 if(!origin||!destination){$('journey-results').innerHTML='<div class="empty">اختر محطة الانطلاق والوصول من القائمتين.</div>';return}
 if(origin===destination){state.journeys=[];state.journeyResults=null;$('journey-results').innerHTML='<div class="empty">اختر محطتين مختلفتين.</div>';return}
 const result=planJourney({trips:state.trips,origin,destination,date,after,calendars:state.calendars,exceptions:state.exceptions,holidays:state.holidays});
 state.journeys=[...result.direct,...result.connections];
 state.journeyResults={...result,date};state.journeyLimit={direct:4,connections:3};renderJourneyResults();
}
function renderJourneyResults(){
 const {direct,connections,date}=state.journeyResults;
 const holiday=state.holidays.find(h=>(typeof h==='string'?h:h.date)===date);
 const notice=holiday?`<p class="journey-notice">${esc(holiday.name||'يوم عيد')} · فُعّلت قاعدة تشغيل الأعياد لهذا اليوم.</p>`:
  !state.holidaysComplete&&state.journeys.some(x=>[x.first||x,x.second].filter(Boolean).some(leg=>['friday_holiday','weekday_not_friday'].includes(leg.trip.service_id)))?'<p class="journey-notice">رزنامة الأعياد غير مكتملة؛ راجع تشغيل هذه القطارات في الأعياد.</p>':'';
 const section=(title,items,offset,key)=>`<h3>${title} <span class="chip">${items.length}</span></h3>`+(items.length?`<div class="journey-list">${items.slice(0,state.journeyLimit[key]).map((x,i)=>journeyCard(x,offset+i)).join('')}</div>${items.length>state.journeyLimit[key]?`<button class="button outline journey-more" type="button" data-more-journeys="${key}">عرض المزيد (${items.length-state.journeyLimit[key]})</button>`:''}`:'<div class="empty">لا توجد رحلة مدخلة مطابقة لهذا التاريخ والاتجاه.</div>');
 $('journey-results').innerHTML=notice+section('الرحلات المباشرة',direct,0,'direct')+section('رحلات بتبديل واحد',connections,direct.length,'connections');
}
function itineraryReminder(item){
 const first=item.first||item,last=item.second||item;
 return {departure:first.departure,arrival:last.arrival,title:`قطار ${name(first.from)} إلى ${name(last.to)}`,key:[first.trip.trip_id,first.serviceDate,first.from,item.second?.trip.trip_id||'',last.to].join('|')};
}
function addCalendar(item){
 const info=itineraryReminder(item);
 const utc=ms=>new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const safe=s=>s.replace(/[\\;,\n]/g,c=>({'\\':'\\\\',';':'\\;',',':'\\,','\n':'\\n'}[c]));
 const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DZ Portal//DZ Rail//AR','BEGIN:VEVENT','UID:'+encodeURIComponent(info.key)+'@dz-portal','DTSTAMP:'+utc(Date.now()),'DTSTART:'+utc(info.departure),'DTEND:'+utc(info.arrival),'SUMMARY:'+safe(info.title),'DESCRIPTION:'+safe('وقت مجدول من صورة جدول SNTF؛ تحقق من تحديثات الشركة قبل السفر.'),'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:'+safe(info.title),'END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
 const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='dz-rail-'+new Date(info.departure).toISOString().slice(0,10)+'.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
const reminderKey='dz-rail-foreground-reminders-v1';
function loadReminders(){try{return JSON.parse(localStorage.getItem(reminderKey)||'[]')}catch{return []}}
function checkReminders(now=Date.now()){
 if(!('Notification' in window))return;
 const pending=[];
 for(const item of loadReminders()){
  if(!Number.isFinite(item.departure)||item.departure<=now)continue;
  if(item.departure-now<=30*60000 && Notification.permission==='granted'){
   try{new Notification('موعد قطارك يقترب',{body:item.title+' · موعد مجدول، تحقق من أي تغيير لدى SNTF.',tag:item.key})}
   catch{pending.push(item)}
  }else pending.push(item);
 }
 try{localStorage.setItem(reminderKey,JSON.stringify(pending))}catch{}
}
async function addForegroundReminder(item){
 const status=$('journey-reminder-status');
 if(!('Notification' in window)){status.textContent='التنبيهات غير مدعومة في هذا المتصفح. استخدم تذكير التقويم.';return}
 const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
 if(permission!=='granted'){status.textContent='لم تُفعّل إشعارات المتصفح. يمكنك إضافة تذكير إلى التقويم.';return}
 const info=itineraryReminder(item);
 if(info.departure<=Date.now()){status.textContent='فات موعد مغادرة هذه الرحلة.';return}
 const values=loadReminders().filter(x=>x.key!==info.key);values.push(info);
 try{localStorage.setItem(reminderKey,JSON.stringify(values))}catch{status.textContent='تعذر حفظ التذكير في المتصفح. استخدم تذكير التقويم.';return}
 status.textContent='حُفظ التنبيه. يظهر قبل المغادرة بنصف ساعة إذا بقيت الصفحة مفتوحة؛ استخدم التقويم للتذكير بعد إغلاقها.';
 checkReminders();
}

function tick(){
 const now=new Date(),parts=dayParts(now),clock=[parts.hour,parts.minute,parts.second].join(":"),key=[parts.year,parts.month,parts.day,parts.hour,parts.minute].join("-");
 $("clock").textContent=clock;
 $("date-label").textContent=new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",dateStyle:"full"}).format(now);
 document.querySelectorAll(".countdown").forEach(el=>{const remaining=Math.floor((Number(el.dataset.target)-now.getTime())/1000);el.textContent=countdown(remaining);el.closest(".event")?.classList.toggle("imminent",remaining>=0&&remaining<=900)});
 if(key!==state.lastMinute){state.lastMinute=key;renderBoards(now);if(state.activePopup)renderPopupSchedule(state.activePopup.root,state.activePopup.stationId,now);checkReminders(now.getTime())}
}
function boardTab(kind,focus=false){
 state.boardMode=kind;
 for(const b of document.querySelectorAll(".board-tabs button")){const yes=b.dataset.view===kind;b.setAttribute("aria-selected",String(yes));b.tabIndex=yes?0:-1;if(yes&&focus)b.focus()}
 const mobile=window.matchMedia("(max-width:680px)").matches;
 $("departures-panel").hidden=mobile&&kind!=="departures";
 $("arrivals-panel").hidden=mobile&&kind!=="arrivals";
}
function tripTimeline(trip){
 const route=routeFor(trip.route_id);
 const items=trip.stop_times.map(stop=>{
  const dual=stop.arrival!=null&&stop.departure!=null&&stop.arrival!==stop.departure;
  const clocks=dual?'<span class="stop-times"><span>وصول <time dir="ltr">'+esc(formatTime(stop.arrival))+'</time></span><span>مغادرة <time dir="ltr">'+esc(formatTime(stop.departure))+'</time></span></span>':
    '<time dir="ltr">'+esc(formatTime(stop.departure??stop.arrival))+'</time>';
  return '<li><span>'+esc(name(stop.station_id))+'</span>'+clocks+'</li>';
 }).join("");
 return '<p class="minor">القطار '+esc(trip.train_number||"غير محدد")+' · '+esc(serviceName(trip.service_id))+' · '+esc(route?.name||"")+'</p><a class="photo-source" href="'+esc(tripPageLink(trip,dayISO(new Date())))+'">افتح صفحة هذا القطار ←</a><ol class="stop-list train-timeline">'+items+'</ol>';
}
function routeCard(route){
 const summary=routeStopSummary(route,state.trips),ts=routeTrips(route,state.trips),src=state.sources.find(s=>s.id===route.source);
 const schedulePage=schedulePageForImage(route.schedule_image);
 const link=schedulePage?'<a class="photo-source" href="'+esc(schedulePage)+'">الجدول المصور ↗</a>':route.schedule_image?'<a class="photo-source" href="'+esc(route.schedule_image)+'" target="_blank" rel="noopener noreferrer">'+(route.schedule_image.endsWith(".svg")?"نسخة معاد تنسيقها من الجدول ↗":"الجدول المصور ↗")+'</a>':"";
 const stops=summary.known_stops.map((item,i)=>'<li><span>'+ (i+1)+'. '+esc(name(item.station_id))+'</span><small>'+item.train_count+' قطار يتوقف هنا</small></li>').join("");
 const corridor=summary.corridor_only.length?'<details class="corridor-note"><summary>محطات مذكورة بالممر دون توقف منشور ('+summary.corridor_only.length+')</summary><p class="minor">هذه أسماء ظاهرة في جدول الممر، لكنها غير مدرجة كتوقف مؤقت في أي قطار أدخلناه لهذا المسار.</p><p>'+summary.corridor_only.map(name).map(esc).join(" · ")+'</p></details>':"";
 const routesStatus=ts.length?'<span class="tag">'+ts.length+' رحلة منقولة</span>':'<span class="tag warn">المواقيت والتوقفات قيد الإدخال</span>';
 const partialNotice=route.category==="international"&&ts.some(t=>t.time_status==="partial")?'<p class="minor">ينشر الجدول وقت الانطلاق فقط؛ أوقات الوصول والمحطات الوسيطة غير منشورة (—).</p>':'';
 const stopHtml=ts.length?'<details class="route-stops"><summary>عرض محطات التوقف المسجلة ('+summary.known_stops.length+')</summary><ol class="catalog-stops">'+stops+'</ol></details>'+corridor:
  '<p class="pending-stops">المعروف حاليًا: '+esc(name(route.from))+' ← '+esc(name(route.to))+'. لا توجد محطات وسيطة موثقة في قاعدة الرحلات لهذا المسار بعد.</p>';
 const options=ts.map(t=>'<option value="'+esc(t.trip_id)+'">'+esc(t.train_number||"غير محدد")+' · '+esc(serviceName(t.service_id))+' · '+esc(formatTime(t.stop_times[0].departure))+' → '+esc(formatTime(t.stop_times.at(-1).arrival))+'</option>').join("");
 const trainSelect=ts.length?'<label class="trip-select-label" for="trip-'+esc(route.id)+'">محطات قطار محدد</label><select id="trip-'+esc(route.id)+'" data-trip-select="'+esc(route.id)+'"><option value="">اختر القطار لعرض توقفاته ومواقيته</option>'+options+'</select><div class="trip-timeline" data-trip-timeline="'+esc(route.id)+'"></div>':"";
 return '<article class="route-item" data-route-id="'+esc(route.id)+'"><div class="route-top"><span class="tag">'+esc(categoryLabel[route.category]||route.category)+'</span>'+routesStatus+'</div><h4>'+esc(route.name)+'</h4><p class="route-terminals">'+esc(name(route.from))+' ← '+esc(name(route.to))+'</p><p class="minor">'+esc(src?.name||"مصدر قيد التوثيق")+'</p>'+partialNotice+stopHtml+trainSelect+'<div class="route-actions"><button type="button" class="button outline route-open" data-route="'+esc(route.id)+'">فتح لوحة المسار</button>'+link+'</div></article>';
}
function fillRouteCatalog(){
 const groups=state.lines.filter(line=>!state.category||line.category===state.category)
  .map(line=>({line,routes:lineRoutes(line,state.routes).filter(r=>!state.route||r.id===state.route)}))
  .filter(g=>g.routes.length);
 $("route-count").textContent=groups.length+" خط · "+groups.reduce((n,g)=>n+g.routes.length,0)+" مسار";
 $("route-catalog").innerHTML=groups.map(g=>{
  const trainCount=g.routes.reduce((sum,route)=>sum+routeTrips(route,state.trips).length,0);
  const served=new Set(g.routes.flatMap(route=>routeStopSummary(route,state.trips).known_stops.map(stop=>stop.station_id)));
  const label=trainCount?trainCount+' قطار مسجل · '+served.size+' محطة توقف مدخلة':'مواقيت وتوقفات هذا الخط قيد النقل';
  const title='<div class="line-header"><div><span class="eyebrow">'+esc(categoryLabel[g.line.category]||g.line.category)+'</span><h3>'+esc(g.line.name)+'</h3><p>'+esc(label)+'</p></div><span class="tag">'+g.routes.length+' مسار</span></div>';
  return '<section class="line-group" aria-label="'+esc(g.line.name)+'">'+title+'<div class="route-grid">'+g.routes.map(routeCard).join("")+'</div></section>';
 }).join("");
}
function routeStations(){
 updateAllowedStations();
 const prev=state.selected;
 let allowed=state.stations.filter(allowedOnRoute);
 if(state.route){
  const route=routeFor(state.route),listed=route?routeStopSummary(route,state.trips).known_stops.map(s=>s.station_id):[];
  const order=listed.length?listed:[route?.from,route?.to].filter(Boolean);
  const indices=new Map(order.map((id,i)=>[id,i]));
  allowed=allowed.sort((a,b)=>(indices.get(a.id)??999)-(indices.get(b.id)??999));
 }else allowed=allowed.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
 state.boardStations=allowed;refreshStationPickers(allowed);
 if(prev&&allowed.some(s=>s.id===prev)){boardPicker.set(station(prev));mapPicker.set(station(prev))}
 else if(prev){state.selected=null;$("selected-name").textContent="اختر محطة";$("selected-subtitle").textContent="اضغط «أقرب محطة لموقعي» أو اختر محطة بالبحث أو من الخريطة."}
 fillStationLines();listStations();if(state.activeTask==="explore")fillRouteCatalog();fillDirections();renderBoards();refreshMarkers();
}
function renderPopupSchedule(root,id,now=new Date()){
 const config={calendars:state.calendars,exceptions:state.exceptions,holidays:state.holidays};
 const trips=editableTrips(),date=dayISO(now);
 const rows=[["departure","أقرب مغادرة","إلى"],["arrival","أقرب وصول","من"]].map(([kind,label,preposition])=>{
  const event=recordsAtStation(trips,id,kind,date,config,now)[0];
  const row=document.createElement("div");row.className="station-map-row";
  const heading=document.createElement("strong");heading.textContent=label;
  const time=document.createElement("time");time.dir="ltr";
  if(event){time.dateTime=new Date(event.timestamp).toISOString();time.textContent=journeyClock(event.timestamp)}
  else time.textContent="—";
  const details=document.createElement("small");
  details.textContent=event?`${preposition} ${name(kind==="departure"?event.destination:event.origin)} · ${journeyDay(event.timestamp)}`:"لا موعد منشور خلال 48 ساعة";
  row.append(heading,time,details);return row;
 });
 root.replaceChildren(...rows);
}
function refreshMarkers(){
 if(!state.map)return;
 state.activePopup=null;
 for(const marker of state.markers)marker.remove();state.markers=[];
 const selected=state.stations.filter(s=>allowedOnRoute(s)&&hasGeo(s));
 for(const s of selected){
  const verified=verifiedGeo(s),color=s.id===state.selected?"#ed9e32":verified?"#087f8c":"#b46813";
  const marker=window.L.circleMarker([s.lat,s.lon],{radius:s.id===state.selected?10:verified?6:7,color:verified?"#fff":"#773f09",weight:verified?2:2.5,fillColor:color,fillOpacity:verified?1:.8,...(verified?{}:{dashArray:"3 3"})}).addTo(state.map);
  marker.stationId=s.id;
  const container=document.createElement("div");container.dir="rtl";container.className="station-map-card";
  const title=document.createElement("a");title.href=stationBoardUrl(s.id);title.className="station-map-link";title.textContent=s.name;
  title.addEventListener("click",event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();openStation(s.id)});
  const subtitle=document.createElement("small");subtitle.textContent=s.name_fr;
  const geoNote=document.createElement("small");geoNote.className="station-map-geo-note";geoNote.textContent=verified?"موقع محطة موثق":"موقع تقريبي · الإحداثيات قيد التحقق";
  const schedule=document.createElement("div");schedule.className="station-map-schedule";
  const hint=document.createElement("span");hint.textContent="مواقيت مجدولة من صور الجداول · افتح لوحة المحطة ←";
  container.append(title,subtitle,geoNote,schedule,hint);
  marker.bindPopup(container,{className:"station-map-popup",maxWidth:260,minWidth:0,autoPanPadding:[12,12]});
  marker.on("popupopen",()=>{state.activePopup={stationId:s.id,root:schedule};renderPopupSchedule(schedule,s.id)});
  marker.on("popupclose",()=>{if(state.activePopup?.root===schedule)state.activePopup=null});
  state.markers.push(marker);
 }
 // Route polylines are deliberately omitted: station-to-station straight lines are not railway tracks.
}
async function initMap(){
 try{
  if(!window.L){
   const link=document.createElement("link");link.rel="stylesheet";link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";document.head.append(link);
   await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";script.onload=resolve;script.onerror=reject;document.head.append(script)});
  }
  $("map").textContent="";
  state.map=window.L.map("map",{scrollWheelZoom:false}).setView([28.1,2.7],5);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18}).addTo(state.map);
  refreshMarkers();
  const geos=state.stations.filter(hasGeo);
  if(geos.length)state.map.fitBounds(geos.map(s=>[s.lat,s.lon]),{padding:[20,20],maxZoom:7});
 }catch(error){$("map").innerHTML='<div class="empty">تعذر تحميل خريطة الإنترنت. اختر المحطة من القائمة المجاورة.</div>';console.warn("DZ Rail map:",error)}
}
function locate(board=false){
 if(state.busy)return;
 const status=$(board?"board-location-status":"location-status");
 if(!navigator.geolocation){status.textContent="الموقع الجغرافي غير مدعوم، اختر المحطة يدويًا.";return}
 const busy=value=>{state.busy=value;for(const id of ["locate","locate-board"]){$(id).disabled=value;$(id).setAttribute("aria-busy",String(value))}};
 busy(true);status.textContent="جار تحديد موقعك… اسمح بالوصول إلى الموقع لاختيار أقرب محطة.";
 navigator.geolocation.getCurrentPosition(position=>{
  busy(false);state.user={lat:position.coords.latitude,lon:position.coords.longitude};
  const available=state.stations.filter(s=>allowedOnRoute(s)&&verifiedGeo(s)).sort((a,b)=>km(state.user,a)-km(state.user,b));
  if(!available.length){status.textContent="لا توجد محطات ذات إحداثيات موثقة ضمن القائمة الحالية. اختر محطة يدويًا.";return}
  chooseStation(available[0].id,{focusMap:!board});
  status.textContent="أقرب محطة وفق المسافة المباشرة: "+available[0].name+" ("+km(state.user,available[0]).toFixed(1)+" كم). هذه ليست مسافة الطريق.";
  if(state.map){if(state.userMarker)state.userMarker.remove();state.userMarker=window.L.circleMarker([state.user.lat,state.user.lon],{radius:9,color:"#1854a5",fillOpacity:.75}).addTo(state.map).bindPopup("موقعك التقريبي")}
 },error=>{busy(false);status.textContent=error.code===1?"لم يُمنح إذن الموقع. اختر محطة يدويًا.":"تعذر تحديد الموقع؛ جرّب مجددًا أو اختر محطة."},{enableHighAccuracy:false,timeout:12000,maximumAge:120000});
}
function setCategoryFilters(categoryId="",routeId=""){
 const supplied=routeId?routeFor(routeId):null;
 const route=supplied&&!supplied.catalog_status?routeFor(canonicalRouteId(supplied)):null;
 const validCategory=railwayCategories.some(item=>item.id===categoryId)?categoryId:"";
 state.route=route?.id||"";
 state.category=route?.category||validCategory;
 $("category-filter").value=state.category;
 const gallery=railwayCategories.find(item=>item.id===state.category);
 $("category-schedules").hidden=!gallery;
 $("category-schedules").href=gallery?"sntf.html#"+gallery.anchor:"sntf.html";
 fillRouteOptions();
 $("route-filter").value=state.route;
 state.boardLimit={departure:20,arrival:20};
 routeStations();
 if(state.map&&(state.category||state.route)){
  const points=state.stations.filter(x=>allowedOnRoute(x)&&hasGeo(x));
  if(points.length)state.map.fitBounds(points.map(x=>[x.lat,x.lon]),{padding:[24,24],maxZoom:10});
 }
}
async function start(){
 try{
 const [stations,routes,lines,trips,calendars,sources,holidays]=await Promise.all([get("stations","stations"),get("routes","routes"),get("lines","lines"),get("trips","trips"),get("calendars","calendars"),get("sources","sources"),get("holidays","dates")]);
 Object.assign(state,{stations:stations.stations,routes:routes.routes,lines:lines.lines,trips:trips.trips,calendars:calendars.calendars,exceptions:calendars.exceptions||[],sources:sources.sources,holidays:holidays.dates,holidaysComplete:holidays.complete===true});
 populateJourneyStations();
 $("holiday-note").textContent="";
 const params=new URL(location.href).searchParams;
 for(const field of ["from","to"]){
  const chosen=state.journeyStations.find(s=>s.id===params.get(field));
  if(chosen)journeyPickers[field]?.set(chosen);
 }
 const oldLine=lineFor(params.get("line"));
 const hashCategory=railwayCategories.find(c=>"#"+c.anchor===location.hash)?.id;
 const selectedCategory=params.get("category")||oldLine?.category||hashCategory||"";
 const oldLineRoutes=oldLine?lineRoutes(oldLine,state.routes):[];
 // Old ?line= links still work: a single-route line opens directly; multi-route lines open their category.
 const selectedRoute=params.get("route")||(oldLineRoutes.length===1?oldLineRoutes[0].id:"");
 setCategoryFilters(selectedCategory,selectedRoute);
 const chosen=params.get("station");
 if(chosen&&station(chosen)&&allowedOnRoute(station(chosen)))chooseStation(chosen);
 const explicitTask=location.hash.match(/^#panel-(search|station|explore)$/)?.[1];
 const initialTask=explicitTask||((chosen&&station(chosen))||location.hash==="#station-board"?"station":params.has("route")||params.has("category")||params.has("line")||hashCategory?"explore":"search");
 showTask(initialTask);tick();
 }catch(error){$("map").innerHTML='<div class="empty">تعذر تحميل قاعدة البيانات. أعد تحميل الصفحة أو افتح <a href="sntf.html">الجداول المصورة</a>.</div>';$("location-status").textContent=error.message;console.error("DZ Rail:",error)}
}
$("station").addEventListener("change",e=>{if(e.target.value)chooseStation(e.target.value,{focusMap:true})});
$("journey-form").addEventListener("submit",event=>{event.preventDefault();searchJourneys()});
$("journey-date").addEventListener("change",()=>{$("journey-after").value="00:00"});
$("journey-results").addEventListener("click",event=>{
 const more=event.target.closest('[data-more-journeys]');
 if(more){const key=more.dataset.moreJourneys;if(!['direct','connections'].includes(key))return;state.journeyLimit[key]+=key==='direct'?4:3;renderJourneyResults();return}
 const calendar=event.target.closest('[data-calendar]'),reminder=event.target.closest('[data-remind]');
 const index=Number((calendar||reminder)?.dataset.calendar??reminder?.dataset.remind);
 if(!Number.isInteger(index)||!state.journeys[index])return;
 if(calendar)addCalendar(state.journeys[index]);else addForegroundReminder(state.journeys[index]);
});
$("category-filter").addEventListener("change",e=>setCategoryFilters(e.target.value));
$("route-filter").addEventListener("change",e=>setCategoryFilters(state.category,e.target.value));
$("direction").addEventListener("change",()=>{state.boardLimit={departure:20,arrival:20};renderBoards()});
for(const kind of ["departure","arrival"]){
 const el=$(kind==="departure"?"departures":"arrivals");
 el.addEventListener("click",event=>{
  if(!event.target.closest("[data-more]"))return;
  state.boardLimit[kind]+=20;renderBoards();
 });
}
$("station-services").addEventListener("click",event=>{
 const trigger=event.target.closest("[data-station-route]");
 if(!trigger)return;
 setCategoryFilters("",trigger.dataset.stationRoute);
 $("station-board").scrollIntoView({behavior:"smooth",block:"start"});
});
$("route-catalog").addEventListener("click",event=>{
 const trigger=event.target.closest("[data-route]");
 if(!trigger)return;
 setCategoryFilters("",trigger.dataset.route);
 showTask("station",false,true);
 $("station-board").scrollIntoView({behavior:"smooth",block:"start"});
});
$("route-catalog").addEventListener("change",event=>{
 const select=event.target.closest("[data-trip-select]");
 if(!select)return;
 const target=select.closest(".route-item")?.querySelector(".trip-timeline");
 if(!target)return;
 const trip=routeTrips(routeFor(select.dataset.tripSelect),state.trips).find(t=>t.trip_id===select.value);
 target.innerHTML=trip?tripTimeline(trip):"";
});
$("locate").addEventListener("click",()=>locate());
$("locate-board").addEventListener("click",()=>locate(true));
$("map-fullscreen").addEventListener("click",toggleMapFullscreen);
document.addEventListener("fullscreenchange",()=>{
 if(document.fullscreenElement===$("map-viewer")){nativeMapFullscreen=true;setMapExpanded(true)}
 else if(nativeMapFullscreen){nativeMapFullscreen=false;setMapExpanded(false);if(state.activeTask==="explore")$("map-fullscreen").focus()}
});
document.addEventListener("keydown",event=>{
 if(!mapExpanded)return;
 if(event.key==="Escape"){event.preventDefault();closeMapFullscreen();return}
 if(event.key!=="Tab")return;
 const controls=[...$("map-viewer").querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.getClientRects().length);
 const first=controls[0],last=controls.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
});
for(const [i,id] of ["search","station","explore"].entries()){
 const button=$("task-"+id);button.addEventListener("click",()=>showTask(id,false,true));
 button.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const all=["search","station","explore"];const next=event.key==="Home"?0:event.key==="End"?2:(i+(event.key==="ArrowLeft"?1:-1)+3)%3;showTask(all[next],true,true)});
}
document.querySelectorAll(".board-tabs button").forEach((b,i,all)=>{b.addEventListener("click",()=>boardTab(b.dataset.view));b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const target=e.key==="Home"?0:e.key==="End"?all.length-1:(i+(e.key==="ArrowLeft"?1:-1)+all.length)%all.length;boardTab(all[target].dataset.view,true)})});
window.matchMedia("(max-width:680px)").addEventListener("change",()=>boardTab(state.boardMode));
boardTab("departures");tick();setInterval(tick,1000);start();
