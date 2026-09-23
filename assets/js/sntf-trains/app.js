// DZ Rail: static-data-first, no synthetic train services or coordinates.
const base = new URL("../../data/sntf/", import.meta.url);
const state = { stations:[],routes:[],trips:[],calendars:[],exceptions:[],holidays:[],holidaysComplete:false,sources:[],map:null,user:null,locationBusy:false };
const $ = id => document.getElementById(id);
const escapeHtml = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const algeriaTime = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Algiers",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
const localDate = () => {const t=algeriaTime();return t.year+"-"+t.month+"-"+t.day};
const minutesOf = value => {if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(value||""))return NaN;const [h,m]=value.split(":").map(Number);return h*60+m};
const serviceNames={daily:"كل يوم",friday_holiday:"الجمعة والأعياد المسجلة",weekday_not_friday:"عدا الجمعة والأعياد المسجلة",except_friday:"عدا الجمعة"};
const isDemo=t=>t.demo===true||t.data_status==="demo";
const demoMode=()=>document.getElementById("show-demo")?.checked===true;
const usableTrips=()=>state.trips.filter(t=>!isDemo(t)||demoMode());
const categoryNames={suburban:"الضواحي",eastern:"الشرق",western:"الغرب",sahara:"الصحراء والهضاب",international:"الدولي"};
const stationById = id => state.stations.find(s=>s.id===id);
const stationName = id => stationById(id)?.name||id;
const sourceById = id => state.sources.find(s=>s.id===id);
const validDate = x => typeof x==="string" && /^\d{4}-\d\d-\d\d$/.test(x);
function updateClock(){
 const t=algeriaTime(),clock=t.hour+":"+t.minute+":"+t.second;
 $("clock").textContent=clock;$("departure-clock").textContent=clock;
 $("today").textContent=new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",dateStyle:"full"}).format(new Date());
 if(!$("panel-departures").hidden && $("station").value)renderDepartures();
}
async function json(filename,key){
 const response=await fetch(new URL(filename,base),{cache:"no-cache"});
 if(!response.ok)throw new Error("تعذر تحميل "+filename);
 const body=await response.json();
 if(!Array.isArray(body[key]))throw new Error("بنية بيانات غير صحيحة: "+filename);
 return body;
}
async function loadData(){
 try{
 const [s,r,t,c,src,h]=await Promise.all([json("stations.json","stations"),json("routes.json","routes"),json("trips.json","trips"),json("calendars.json","calendars"),json("sources.json","sources"),json("holidays.json","dates")]);
 Object.assign(state,{stations:s.stations,routes:r.routes,trips:t.trips,calendars:c.calendars,exceptions:c.exceptions||[],holidays:h.dates,holidaysComplete:h.complete===true,sources:src.sources});
 for(const select of [$("from"),$("to"),$("station")]){
   const fragment=document.createDocumentFragment();
   for(const station of state.stations){
     const opt=document.createElement("option");opt.value=station.id;opt.textContent=station.name+" / "+station.name_fr;fragment.appendChild(opt);
   }
   select.appendChild(fragment);
 }
 $("routes-count").textContent=state.routes.length+" جدول خط متاح";
 $("data-status").textContent=" · "+state.trips.filter(t=>!isDemo(t)).length+" رحلة من الصورة المرفقة و"+state.trips.filter(isDemo).length+" رحلة محاكاة (اختيارية).";
 renderCatalog();renderNearby();
 }catch(error){
   $("data-status").textContent=" · تعذر تحميل قاعدة البيانات.";
   $("search-results").innerHTML='<div class="empty">تعذر تحميل البيانات. تحقق من الاتصال وحاول إعادة تحميل الصفحة. <a href="sntf.html">الجداول المصورة</a></div>';
   console.error("DZ Rail data:",error);
 }
}
function routeCard(route,extra=""){
 const image=route.schedule_image||"";
 const from=stationName(route.from),to=stationName(route.to);
 const imgLink=image && image.startsWith("../assets/train-schedules/") ? '<a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(image)+'">عرض الجدول المصور ↗</a>':"";
 const source=sourceById(route.source);
 return '<article class="route-card"><div class="badge-row"><span class="tag">'+escapeHtml(categoryNames[route.category]||route.category)+'</span><span class="tag warn">المواعيد بحاجة إلى تحقق</span></div><h4>'+escapeHtml(route.name||from+" — "+to)+'</h4><p>'+escapeHtml(extra||"المصدر: "+(source?.name||"غير محدد"))+'</p><div class="card-actions">'+imgLink+' <button type="button" data-from="'+escapeHtml(route.from)+'" data-to="'+escapeHtml(route.to)+'" class="choose-route">تحديد المسار</button></div></article>';
}
function renderCatalog(){
 const text=$("catalog-filter").value.trim().toLocaleLowerCase(),cat=$("category").value;
 const selected=state.routes.filter(r=>(!cat||r.category===cat)&&(!text||[r.name,stationName(r.from),stationName(r.to),categoryNames[r.category]].join(" ").toLocaleLowerCase().includes(text)));
 $("catalog").innerHTML=selected.length?selected.map(r=>routeCard(r)).join(""):'<div class="empty">لا توجد خطوط مطابقة للبحث.</div>';
}
function activeOn(trip,date){
 const calendar=state.calendars.find(c=>c.id===trip.service_id);
 if(!calendar||!validDate(date))return false;
 const exception=state.exceptions.find(e=>e.service_id===trip.service_id&&e.date===date);
 if(exception)return exception.type==="added";
 const friday=new Date(date+"T12:00:00Z").getUTCDay()===5;
 const holiday=state.holidays.some(h=>(typeof h==="string"?h:h.date)===date);
 switch(calendar.rule){
 case "daily":return true;
 case "friday_holiday":return friday||holiday;
 case "weekday_not_friday":return !friday&&!holiday;
 case "except_friday":return !friday;
 default:return false;
 }
}

function stopIndex(trip,id){return (trip.stop_times||[]).findIndex(s=>s.station_id===id)}
function getTrips(from,to,date,after){
 const start=minutesOf(after);
 return usableTrips().filter(t=>{
  if(!activeOn(t,date))return false;
  const i=stopIndex(t,from),j=stopIndex(t,to);
  return i>=0&&j>i&&minutesOf(t.stop_times[i].departure)>=start;
 }).sort((a,b)=>minutesOf(a.stop_times[stopIndex(a,from)].departure)-minutesOf(b.stop_times[stopIndex(b,from)].departure));
}

function minutesLabel(value){const m=minutesOf(value);if(!Number.isFinite(m))return "—";const hours=Math.floor(m/60);return String(hours%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0")+(hours>=24?" (اليوم التالي)":"")}
function tripCard(trip,from,to){
 const a=trip.stop_times[stopIndex(trip,from)],b=trip.stop_times[stopIndex(trip,to)];
 const route=state.routes.find(r=>r.id===trip.route_id);
 const duration=minutesOf(b.arrival)-minutesOf(a.departure);
 const source=sourceById(trip.source_id);
 return '<article class="trip-card"><div class="badge-row"><span class="tag">'+escapeHtml(categoryNames[route?.category]||"قطار")+'</span><span class="tag">مجدول وليس مباشرًا</span></div><h4>'+escapeHtml(stationName(from))+' ← '+escapeHtml(stationName(to))+'</h4><p>المغادرة: <b dir="ltr">'+minutesLabel(a.departure)+'</b> · الوصول: <b dir="ltr">'+minutesLabel(b.arrival)+'</b>'+ (duration>=0?' · المدة: '+Math.floor(duration/60)+'س '+(duration%60)+'د':"")+'</p><p>قطار '+escapeHtml(trip.train_number||"رقمه غير منشور")+' · المصدر: '+escapeHtml(source?.name||"غير محدد")+'</p></article>';
}
function search(event){
 event?.preventDefault();
 const from=$("from").value,to=$("to").value,date=$("date").value,after=$("after").value;
 if(!from||!to||!date){$("search-results").innerHTML='<div class="empty">حدد المحطتين وتاريخ الرحلة.</div>';return}
 if(from===to){$("search-results").innerHTML='<div class="empty">اختر محطتين مختلفتين.</div>';return}
 const found=getTrips(from,to,date,after);
 const catalog=state.routes.filter(r=>(r.from===from&&r.to===to)||((r.name||"").includes("↔")&&r.from===to&&r.to===from));
 $("result-count").textContent=found.length+" رحلة موثقة";
 if(found.length){
 $("search-results").innerHTML=found.map(t=>tripCard(t,from,to)).join("");
 }else if(catalog.length){
 $("search-results").innerHTML='<div class="empty">لا تتوفر بعد مواقيت رقمية موثقة لهذا المسار في الوقت المحدد. يمكنك مراجعة الجدول المصور؛ لم يتم التأكد من استمرار صلاحيته.</div>'+catalog.map(r=>routeCard(r)).join("");
 }else{
 $("search-results").innerHTML='<div class="empty">لا تتوفر بيانات رقمية موثقة لهذا المسار. هذا لا يعني عدم وجود قطارات. <a href="sntf.html">راجع جميع الجداول المصورة</a>.</div>';
 }
}
function renderDepartures(){
 const station=$("station").value;if(!station){$("departures").innerHTML='<div class="empty">اختر محطة لعرض المغادرات.</div>';return}
 const now=algeriaTime(),today=now.year+"-"+now.month+"-"+now.day,elapsed=Number(now.hour)*60+Number(now.minute)+Number(now.second)/60;
 const next=state.trips.filter(t=>activeOn(t,today)&&stopIndex(t,station)>=0&&Number.isFinite(minutesOf(t.stop_times[stopIndex(t,station)].departure))&&minutesOf(t.stop_times[stopIndex(t,station)].departure)>=elapsed).sort((a,b)=>minutesOf(a.stop_times[stopIndex(a,station)].departure)-minutesOf(b.stop_times[stopIndex(b,station)].departure)).slice(0,15);
 $("departures").innerHTML=next.length?next.map(t=>{
 const at=t.stop_times[stopIndex(t,station)],dest=t.stop_times[t.stop_times.length-1],remaining=Math.max(0,Math.ceil((minutesOf(at.departure)-elapsed)*60));
 const clock=String(Math.floor(remaining/3600)).padStart(2,"0")+":"+String(Math.floor(remaining%3600/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");
 return '<article class="trip-card"><h4>'+escapeHtml(stationName(dest.station_id))+'</h4><p>الانطلاق المجدول: '+minutesLabel(at.departure)+' · الوقت المتبقي حسب الجدول: <strong dir="ltr">'+clock+'</strong></p></article>';
 }).join(""):'<div class="empty">لا تتوفر مغادرات رقمية موثقة لهذه المحطة في بقية اليوم. <a href="sntf.html">اطّلع على جداول SNTF المصورة</a>.</div>';
}
function activateTab(name,focus=false){
 for(const b of document.querySelectorAll('[role="tab"]')){const on=b.dataset.tab===name;b.setAttribute("aria-selected",String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus()}
 for(const p of document.querySelectorAll('[role="tabpanel"]'))p.hidden=p.id!=="panel-"+name;
 if(name==="map")initMap();
 if(name==="departures")renderDepartures();
}
function verifiedStations(){return state.stations.filter(s=>s.geo_verified&&Number.isFinite(s.lat)&&Number.isFinite(s.lon))}
function distanceKm(a,b,c,d){const x=Math.PI/180,p=(c-a)*x,l=(d-b)*x,q=Math.sin(p/2)**2+Math.cos(a*x)*Math.cos(c*x)*Math.sin(l/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function renderNearby(){
 const located=verifiedStations().map(s=>({...s,distance:state.user?distanceKm(state.user.lat,state.user.lon,s.lat,s.lon):null})).sort((a,b)=>state.user?a.distance-b.distance:a.name.localeCompare(b.name,"ar"));
 $("geo-count").textContent=located.length+" محطة بإحداثيات موثقة";
 $("nearby").innerHTML=located.length?located.slice(0,state.user?5:50).map(s=>'<article class="route-card"><h4>'+escapeHtml(s.name)+'</h4><p>'+(state.user?s.distance.toFixed(1)+" كم تقريبًا في خط مستقيم":"إحداثيات موثقة")+'</p><div class="card-actions"><button data-station="'+escapeHtml(s.id)+'" class="choose-station">عرض المغادرات</button><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(s.lat+","+s.lon)+'">الاتجاهات ↗</a></div></article>').join(""):'<div class="empty">لم تُدرج إحداثيات محطات مدققة بعد. يمكن استخدام البحث النصي عن الخطوط والمحطات إلى حين اكتمال الخريطة.</div>';
}
async function initMap(){
 if(state.map)return;
 const target=$("map");
 try{
 if(!window.L){
 const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";document.head.append(css);
 await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";s.onload=resolve;s.onerror=reject;document.head.append(s)});
 }
 target.textContent="";
 const map=window.L.map(target,{scrollWheelZoom:false}).setView([28.03,2.45],5);
 window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18}).addTo(map);
 state.map=map;
 const points=verifiedStations();
 for(const s of points){
 const marker=window.L.marker([s.lat,s.lon]).addTo(map);
 const node=document.createElement("div");node.dir="rtl";
 const name=document.createElement("strong");name.textContent=s.name;node.append(name,document.createElement("br"));
 const button=document.createElement("button");button.type="button";button.textContent="عرض المغادرات";button.addEventListener("click",()=>{$("station").value=s.id;activateTab("departures")});node.append(button);
 marker.bindPopup(node);
 }
 if(points.length)map.fitBounds(points.map(s=>[s.lat,s.lon]),{padding:[30,30],maxZoom:10});
 if(state.user)window.L.circleMarker([state.user.lat,state.user.lon],{radius:9,color:"#087f8c"}).addTo(map).bindPopup("موقعك التقريبي");
 setTimeout(()=>map.invalidateSize(),50);
 }catch(error){target.innerHTML='<div class="empty">تعذر تحميل الخريطة. تبقى قائمة المحطات والبحث متاحة.</div>';console.warn("Map unavailable:",error)}
}
function locate(){
 if(state.locationBusy)return;
 if(!navigator.geolocation){$("location-status").textContent="تحديد الموقع غير مدعوم في هذا المتصفح.";return}
 state.locationBusy=true;$("location-status").textContent="جارٍ تحديد الموقع بعد إذنك…";
 navigator.geolocation.getCurrentPosition(position=>{
 state.locationBusy=false;state.user={lat:position.coords.latitude,lon:position.coords.longitude};
 $("location-status").textContent="تم تحديد الموقع. المسافات المعروضة خط مستقيم وليست مسافات طرق.";
 renderNearby();
 if(state.map){window.L.circleMarker([state.user.lat,state.user.lon],{radius:9,color:"#087f8c"}).addTo(state.map).bindPopup("موقعك التقريبي");state.map.setView([state.user.lat,state.user.lon],10)}
 },error=>{state.locationBusy=false;$("location-status").textContent=error.code===1?"لم يُمنح إذن الموقع، يمكنك اختيار المحطات يدويًا.":"تعذر تحديد الموقع؛ جرّب مجددًا أو اختر المحطة يدويًا."},{enableHighAccuracy:false,timeout:10000,maximumAge:120000});
}
document.querySelectorAll('[role="tab"]').forEach((b,i,all)=>{
 b.addEventListener("click",()=>activateTab(b.dataset.tab));
 b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();let n=e.key==="Home"?0:e.key==="End"?all.length-1:(i+(e.key==="ArrowLeft"?1:-1)+all.length)%all.length;activateTab(all[n].dataset.tab,true)});
});
$("route-form").addEventListener("submit",search);
$("catalog-filter").addEventListener("input",renderCatalog);
$("category").addEventListener("change",renderCatalog);
$("swap").addEventListener("click",()=>{const from=$("from").value;$("from").value=$("to").value;$("to").value=from});
$("station").addEventListener("change",renderDepartures);
$("locate").addEventListener("click",locate);
$("nearby-from").addEventListener("click",()=>{activateTab("map");locate()});
$("catalog").addEventListener("click",e=>{const b=e.target.closest(".choose-route");if(!b)return;$("from").value=b.dataset.from;$("to").value=b.dataset.to;window.scrollTo({top:$("route-form").getBoundingClientRect().top+scrollY-90,behavior:"smooth"});search()});
$("search-results").addEventListener("click",e=>{const b=e.target.closest(".choose-route");if(!b)return;$("from").value=b.dataset.from;$("to").value=b.dataset.to;search()});
$("nearby").addEventListener("click",e=>{const b=e.target.closest(".choose-station");if(!b)return;$("station").value=b.dataset.station;activateTab("departures")});
$("date").value=localDate();
$("show-demo").addEventListener("change",()=>{if($("from").value&&$("to").value)search();renderDepartures()});
updateClock();setInterval(updateClock,1000);loadData();
