import {dayParts,dayISO,recordsAtStation,eligible,formatTime,countdown,classify,mins} from "./engine.js";
import {canonicalRouteId,routeTrips,routeStopSummary,lineRoutes,lineSummary,stationLineServices,eligibleStationIds} from "./network.js";
const dataRoot=new URL("../../data/sntf/",import.meta.url);
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={stations:[],routes:[],lines:[],line:"",allowedStopIds:null,trips:[],calendars:[],exceptions:[],holidays:[],holidaysComplete:false,sources:[],selected:null,route:"",user:null,map:null,markers:[],userMarker:null,boardMode:"departures",boardLimit:{departure:20,arrival:20},lastMinute:"",busy:false};
const station=id=>state.stations.find(s=>s.id===id);
const name=id=>station(id)?.name||id;
const routeFor=id=>state.routes.find(r=>r.id===id);
const lineFor=id=>state.lines.find(l=>l.id===id);
const canonical=id=>canonicalRouteId(routeFor(id)||{id});
const categoryLabel={suburban:"الضواحي",western:"الغرب",eastern:"الشرق",sahara:"الصحراء والهضاب",international:"الدولي"};
const serviceLabel={daily:"كل يوم",friday_holiday:"الجمعة والأعياد",weekday_not_friday:"عدا الجمعة والأعياد",except_friday:"عدا الجمعة",friday_only:"الجمعة فقط"};
const verifiedGeo=s=>s.geo_verified===true&&Number.isFinite(s.lat)&&Number.isFinite(s.lon);
const editableTrips=()=>eligible(state.trips,$("include-drafts").checked).filter(t=>state.route?t.route_id===canonical(state.route):!state.line||lineFor(state.line)?.route_ids.includes(t.route_id));
async function get(name,key){const response=await fetch(new URL(name+".json",dataRoot),{cache:"no-cache"});if(!response.ok)throw Error(name+": HTTP "+response.status);const data=await response.json();if(!Array.isArray(data[key]))throw Error(name+": بيانات غير صالحة");return data}
function allowedOnRoute(s){return state.allowedStopIds===null||state.allowedStopIds.has(s.id)}
function updateAllowedStations(){
 state.allowedStopIds=eligibleStationIds(state.line,state.route,state.lines,state.routes,state.trips);
}
function fillRouteOptions(){
 const available=state.routes.filter(r=>!r.alias_of&&(!state.line||r.line_id===state.line));
 $("route-filter").replaceChildren(new Option(state.line?"جميع مسارات هذا الخط":"جميع المسارات",""),...available.map(r=>new Option(r.name,r.id)));
 if(state.route&&available.some(r=>r.id===state.route))$("route-filter").value=state.route;
}
function listStations(){
 const term=$("station-search").value.trim().toLocaleLowerCase("ar");
 let matches=state.stations.filter(s=>allowedOnRoute(s)&&[s.name,s.name_fr,...(s.sntf_names||[]),...(s.aliases||[])].join(" ").toLocaleLowerCase().includes(term));
 if(state.user)matches=matches.sort((a,b)=>km(state.user,a)-km(state.user,b));
 else matches=matches.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
 $("station-results").innerHTML=matches.length?matches.slice(0,50).map(s=>'<button type="button" class="station-option" data-id="'+esc(s.id)+'" aria-pressed="'+(s.id===state.selected)+'"><span>'+esc(s.name)+' <small>'+esc(s.name_fr)+'</small></span><small>'+(state.user&&verifiedGeo(s)?km(state.user,s).toFixed(1)+" كم":"عرض اللوحة")+'</small></button>').join(""):'<div class="empty">لا توجد محطات مطابقة.</div>';
 $("map-count").textContent=state.stations.filter(s=>allowedOnRoute(s)&&verifiedGeo(s)).length+" محطة بإحداثيات مسجلة";
}
function km(p,s){const d=Math.PI/180,dLat=(s.lat-p.lat)*d,dLon=(s.lon-p.lon)*d,a=Math.sin(dLat/2)**2+Math.cos(p.lat*d)*Math.cos(s.lat*d)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function chooseStation(id,{focusMap=false}={}){
 if(!station(id))return;
 state.selected=id;state.boardLimit={departure:20,arrival:20};$("station").value=id;
 $("selected-name").textContent=name(id);
 $("selected-subtitle").textContent=station(id).name_fr+" · المغادرات والوصول حسب التوقفات المدخلة";
 fillStationLines();fillDirections();listStations();renderBoards();
 refreshMarkers();
 if(focusMap&&state.map){const s=station(id);if(verifiedGeo(s))state.map.setView([s.lat,s.lon],Math.max(9,state.map.getZoom()),{animate:true})}
}
function fillStationLines(){
 const root=$("station-services"),count=$("station-line-count");
 if(!state.selected){count.textContent="—";root.innerHTML='<p class="minor">اختر محطة لعرض الخطوط التي يتوقف بها قطار له توقيت مدخل.</p>';return}
 const groups=stationLineServices(state.selected,state.lines,state.routes,state.trips);
 count.textContent=groups.length+" خط";
 if(!groups.length){root.innerHTML='<p class="minor">هذه المحطة مدرجة في الشبكة، لكن لا توجد لها أوقات توقف منقولة إلى القاعدة بعد. راجع الصور الرسمية إن لزم.</p>';return}
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
 if(classify(trip)==="draft")return '<span class="tag draft">قيد المراجعة · غير موثوق للسفر</span>';
 if(classify(trip)==="verified")return '<span class="tag">موثق</span>';
  const source=state.sources.find(s=>s.id===trip.source_id);
  if(source?.issuing_authority==="SNTF")return '<span class="tag warn">جدول SNTF رسمي · السريان غير مؤكد</span>';
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
 const link=route?.schedule_image&&/^\.\.\/assets\/train-schedules\//.test(route.schedule_image)?'<a class="photo-source" href="'+esc(route.schedule_image)+'" target="_blank" rel="noopener noreferrer">'+(route.schedule_image.endsWith('.svg')?'عرض إعادة تنسيق الجدول ↗':'عرض صورة الجدول الرسمي ↗')+'</a>':source?.url?.startsWith('https://')?'<a class="photo-source" href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">مصدر المواقيت ↗</a>':'';
 return '<article class="event '+(classify(t)==="draft"?"draft":"")+'"><div class="event-top"><div><h4>'+esc(kind==="departure"?"إلى "+name(other):"من "+name(other))+'</h4><span class="minor">'+esc(route?.name||"")+'</span></div><time dir="ltr">'+formatTime(time)+'</time></div><div class="event-meta"><span class="tag">رقم القطار: '+esc(t.train_number||"غير محدد")+'</span><span class="tag">'+esc(serviceLabel[t.service_id]||t.service_id)+'</span>'+statusBadge(t)+dateShown+'</div><p>'+esc(subtitle)+'</p><p>'+(kind==="departure"?"المتبقي للمغادرة: ":"المتبقي للوصول: ")+'<span class="countdown" data-target="'+event.timestamp+'" dir="ltr">'+countdown(event.remaining)+'</span></p><p class="minor">'+esc(classify(t)==="draft"?"المواعيد الحالية مسودة تحرير وليست رحلات مؤكدة.":source?.notice||"الموعد مجدول، وليس تتبعًا مباشرًا.")+'</p>'+link+details(event)+'</article>';
}
function panel(kind,events){
 const el=$(kind==="departure"?"departures":"arrivals");
 const count=$(kind==="departure"?"count-departures":"count-arrivals");
 const next=$(kind==="departure"?"next-departure":"next-arrival");
 count.textContent=String(events.length);
 next.textContent=events.length?"التالي "+countdown(events[0].remaining):"—";
 if(!state.selected){el.innerHTML='<div class="empty">اختر محطة على الخريطة أو من القائمة.</div>';return}
 if(!events.length){el.innerHTML='<div class="empty">لا توجد '+(kind==="departure"?"مغادرات":"وصولات")+' مدرجة خلال 48 ساعة وفق البيانات '+($("include-drafts").checked?"المعروضة":"المراجعة")+'. عدم ظهور نتيجة لا يعني عدم وجود قطارات. <a href="sntf.html">راجع الجداول المصورة</a>.</div>';return}
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
function tick(){
 const now=new Date(),parts=dayParts(now),clock=[parts.hour,parts.minute,parts.second].join(":"),key=[parts.year,parts.month,parts.day,parts.hour,parts.minute].join("-");
 $("clock").textContent=clock;
 $("date-label").textContent=new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",dateStyle:"full"}).format(now);
 document.querySelectorAll(".countdown").forEach(el=>{const remaining=Math.floor((Number(el.dataset.target)-now.getTime())/1000);el.textContent=countdown(remaining)});
 if(key!==state.lastMinute){state.lastMinute=key;renderBoards(now)}
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
 return '<p class="minor">القطار '+esc(trip.train_number)+' · '+esc(serviceLabel[trip.service_id]||trip.service_id)+' · '+esc(route?.name||"")+'</p><ol class="stop-list train-timeline">'+items+'</ol>';
}
function routeCard(route){
 const summary=routeStopSummary(route,state.trips),ts=routeTrips(route,state.trips),src=state.sources.find(s=>s.id===route.source);
 const link=route.schedule_image?'<a class="photo-source" href="'+esc(route.schedule_image)+'" target="_blank" rel="noopener noreferrer">'+(route.schedule_image.endsWith(".svg")?"نسخة معاد تنسيقها من الجدول ↗":"الجدول المصور ↗")+'</a>':"";
 const stops=summary.known_stops.map((item,i)=>'<li><span>'+ (i+1)+'. '+esc(name(item.station_id))+'</span><small>'+item.train_count+' قطار يتوقف هنا</small></li>').join("");
 const corridor=summary.corridor_only.length?'<details class="corridor-note"><summary>محطات مذكورة بالممر دون توقف منشور ('+summary.corridor_only.length+')</summary><p class="minor">هذه أسماء ظاهرة في جدول الممر، لكنها غير مدرجة كتوقف مؤقت في أي قطار أدخلناه لهذا المسار.</p><p>'+summary.corridor_only.map(name).map(esc).join(" · ")+'</p></details>':"";
 const routesStatus=ts.length?'<span class="tag">'+ts.length+' رحلة منقولة</span>':'<span class="tag warn">المواقيت والتوقفات قيد الإدخال</span>';
 const stopHtml=ts.length?'<details class="route-stops"><summary>عرض محطات التوقف المسجلة ('+summary.known_stops.length+')</summary><ol class="catalog-stops">'+stops+'</ol></details>'+corridor:
  '<p class="pending-stops">المعروف حاليًا: '+esc(name(route.from))+' ← '+esc(name(route.to))+'. لا توجد محطات وسيطة موثقة في قاعدة الرحلات لهذا المسار بعد.</p>';
 const options=ts.map(t=>'<option value="'+esc(t.trip_id)+'">'+esc(t.train_number||"غير محدد")+' · '+esc(serviceLabel[t.service_id]||t.service_id)+' · '+esc(formatTime(t.stop_times[0].departure))+' → '+esc(formatTime(t.stop_times.at(-1).arrival))+'</option>').join("");
 const trainSelect=ts.length?'<label class="trip-select-label" for="trip-'+esc(route.id)+'">محطات قطار محدد</label><select id="trip-'+esc(route.id)+'" data-trip-select="'+esc(route.id)+'"><option value="">اختر القطار لعرض توقفاته ومواقيته</option>'+options+'</select><div class="trip-timeline" data-trip-timeline="'+esc(route.id)+'"></div>':"";
 return '<article class="route-item" data-route-id="'+esc(route.id)+'"><div class="route-top"><span class="tag">'+esc(categoryLabel[route.category]||route.category)+'</span>'+routesStatus+'</div><h4>'+esc(route.name)+'</h4><p class="route-terminals">'+esc(name(route.from))+' ← '+esc(name(route.to))+'</p><p class="minor">'+esc(src?.name||"مصدر قيد التوثيق")+'</p>'+stopHtml+trainSelect+'<div class="route-actions"><button type="button" class="button outline route-open" data-route="'+esc(route.id)+'">فتح لوحة المسار</button>'+link+'</div></article>';
}
function fillRouteCatalog(){
 const groups=(state.line?state.lines.filter(l=>l.id===state.line):state.lines)
  .map(line=>({line,routes:lineRoutes(line,state.routes).filter(r=>!state.route||r.id===state.route)}))
  .filter(g=>g.routes.length);
 $("route-count").textContent=groups.length+" خط · "+groups.reduce((n,g)=>n+g.routes.length,0)+" مسار";
 $("route-catalog").innerHTML=groups.map(g=>{
  const stats=lineSummary(g.line,state.routes,state.trips);
  const label=stats.has_timetable?stats.train_count+' قطار مسجل · '+stats.served_station_ids.length+' محطة توقف مدخلة':'مواقيت وتوقفات هذا الخط قيد النقل';
  const title='<div class="line-header"><div><span class="eyebrow">'+esc(categoryLabel[g.line.category]||g.line.category)+'</span><h3>'+esc(g.line.name)+'</h3><p>'+esc(label)+'</p></div><button class="button outline line-open" type="button" data-line="'+esc(g.line.id)+'">تصفية الخط</button></div>';
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
 $("station").replaceChildren(new Option("اختر محطة",""),...allowed.map(s=>new Option(s.name+" / "+s.name_fr,s.id)));
 if(prev&&allowed.some(s=>s.id===prev))$("station").value=prev;
 else if(prev){state.selected=null;$("selected-name").textContent="اختر محطة";$("selected-subtitle").textContent="اختر محطة من الخريطة أو القائمة."}
 fillStationLines();listStations();fillRouteCatalog();fillDirections();renderBoards();refreshMarkers();
}
function refreshMarkers(){
 if(!state.map)return;
 for(const marker of state.markers)marker.remove();state.markers=[];
 const selected=state.stations.filter(s=>allowedOnRoute(s)&&verifiedGeo(s));
 for(const s of selected){
  const color=s.id===state.selected?"#ed9e32":"#087f8c";
  const marker=window.L.circleMarker([s.lat,s.lon],{radius:s.id===state.selected?10:6,color:"#fff",weight:2,fillColor:color,fillOpacity:1}).addTo(state.map);
  const container=document.createElement("div");container.dir="rtl";
  const h=document.createElement("strong");h.textContent=s.name;container.append(h,document.createElement("br"));
  const button=document.createElement("button");button.type="button";button.textContent="عرض المغادرات والوصول";button.addEventListener("click",()=>chooseStation(s.id));container.append(button);
  marker.bindPopup(container);
  marker.on("click",()=>chooseStation(s.id));
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
  const geos=state.stations.filter(verifiedGeo);
  if(geos.length)state.map.fitBounds(geos.map(s=>[s.lat,s.lon]),{padding:[20,20],maxZoom:7});
 }catch(error){$("map").innerHTML='<div class="empty">تعذر تحميل خريطة الإنترنت. اختر المحطة من القائمة المجاورة.</div>';console.warn("DZ Rail map:",error)}
}
function locate(){
 if(state.busy)return;
 if(!navigator.geolocation){$("location-status").textContent="الموقع الجغرافي غير مدعوم، اختر المحطة يدويًا.";return}
 state.busy=true;$("location-status").textContent="جار طلب إذن الموقع…";
 navigator.geolocation.getCurrentPosition(position=>{
  state.busy=false;state.user={lat:position.coords.latitude,lon:position.coords.longitude};
  const available=state.stations.filter(s=>allowedOnRoute(s)&&verifiedGeo(s)).sort((a,b)=>km(state.user,a)-km(state.user,b));
  if(!available.length){$("location-status").textContent="لا توجد محطات ذات إحداثيات مسجلة في هذا المسار.";return}
  chooseStation(available[0].id,{focusMap:true});
  $("location-status").textContent="أقرب محطة وفق المسافة المباشرة: "+available[0].name+" ("+km(state.user,available[0]).toFixed(1)+" كم). هذه ليست مسافة الطريق.";
  if(state.map){if(state.userMarker)state.userMarker.remove();state.userMarker=window.L.circleMarker([state.user.lat,state.user.lon],{radius:9,color:"#1854a5",fillOpacity:.75}).addTo(state.map).bindPopup("موقعك التقريبي")}
 },error=>{state.busy=false;$("location-status").textContent=error.code===1?"لم يُمنح إذن الموقع. اختر محطة يدويًا.":"تعذر تحديد الموقع؛ جرّب مجددًا أو اختر محطة."},{enableHighAccuracy:false,timeout:12000,maximumAge:120000});
}
async function start(){
 try{
 const [stations,routes,trips,calendars,sources,holidays]=await Promise.all([get("stations","stations"),get("routes","routes"),get("trips","trips"),get("calendars","calendars"),get("sources","sources"),get("holidays","dates")]);
 Object.assign(state,{stations:stations.stations,routes:routes.routes,trips:trips.trips,calendars:calendars.calendars,exceptions:calendars.exceptions||[],sources:sources.sources,holidays:holidays.dates,holidaysComplete:holidays.complete===true});
 $("route-filter").append(...state.routes.map(r=>new Option(r.name,r.id)));
 $("holiday-note").textContent=state.holidaysComplete?"":" تواريخ الأعياد غير مكتملة، لذا تحتاج نتائج الرحلات المرتبطة بالأعياد إلى مراجعة.";
 routeStations();
 // Select a station with transcribed trips; map remains available for all other recorded stations.
 const selected=new URL(location.href).searchParams.get("station");
 if(selected&&station(selected))chooseStation(selected);else if(station("zeralda"))chooseStation("zeralda");
 await initMap();
 tick();
 }catch(error){$("map").innerHTML='<div class="empty">تعذر تحميل قاعدة البيانات. أعد تحميل الصفحة أو افتح <a href="sntf.html">الجداول المصورة</a>.</div>';$("location-status").textContent=error.message;console.error("DZ Rail:",error)}
}
$("station").addEventListener("change",e=>{if(e.target.value)chooseStation(e.target.value,{focusMap:true})});
$("station-search").addEventListener("input",listStations);
$("station-results").addEventListener("click",e=>{const button=e.target.closest("[data-id]");if(button)chooseStation(button.dataset.id,{focusMap:true})});
$("route-filter").addEventListener("change",e=>{state.route=e.target.value;state.boardLimit={departure:20,arrival:20};routeStations();if(state.map){const s=state.stations.filter(x=>allowedOnRoute(x)&&verifiedGeo(x));if(s.length)state.map.fitBounds(s.map(x=>[x.lat,x.lon]),{padding:[24,24],maxZoom:10})}});
$("direction").addEventListener("change",()=>{state.boardLimit={departure:20,arrival:20};renderBoards()});
$("include-drafts").addEventListener("change",()=>{state.boardLimit={departure:20,arrival:20};fillDirections();fillRouteCatalog();renderBoards()});
for(const kind of ["departure","arrival"]){
 const el=$(kind==="departure"?"departures":"arrivals");
 el.addEventListener("click",event=>{
  if(!event.target.closest("[data-more]"))return;
  state.boardLimit[kind]+=20;renderBoards();
 });
}
$("route-catalog").addEventListener("click",event=>{
 const trigger=event.target.closest("[data-route]");
 if(!trigger)return;
 const id=trigger.dataset.route,route=routeFor(id);
 if(!route)return;
 state.route=id;$("route-filter").value=id;
 state.boardLimit={departure:20,arrival:20};
 routeStations();
 if(!state.selected){const trip=eligible(state.trips).find(t=>t.route_id===(route.alias_of||id));chooseStation(trip?.stop_times[0]?.station_id||route.from,{focusMap:true})}
 $("station-board").scrollIntoView({behavior:"smooth",block:"start"});
});
$("locate").addEventListener("click",locate);
document.querySelectorAll(".board-tabs button").forEach((b,i,all)=>{b.addEventListener("click",()=>boardTab(b.dataset.view));b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const target=e.key==="Home"?0:e.key==="End"?all.length-1:(i+(e.key==="ArrowLeft"?1:-1)+all.length)%all.length;boardTab(all[target].dataset.view,true)})});
window.matchMedia("(max-width:680px)").addEventListener("change",()=>boardTab(state.boardMode));
boardTab("departures");tick();setInterval(tick,1000);start();
