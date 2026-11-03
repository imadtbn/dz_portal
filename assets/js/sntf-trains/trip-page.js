import {dayISO,mins,formatTime,runsOn,shiftISO,isHoliday} from './engine.js';
import {schedules} from '../sntf-schedules/catalog.js';
const root=new URL('../../data/sntf/',import.meta.url);
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const readableDate=value=>new Intl.DateTimeFormat('ar-DZ-u-nu-latn',{timeZone:'Africa/Algiers',dateStyle:'full'}).format(new Date(value+'T12:00:00+01:00'));
const duration=minutes=>`${Math.floor(minutes/60)} س ${Math.round(minutes%60)} د`;
const tripLink=(trip,date,from='',to='')=>{
 const params=new URLSearchParams({trip:trip.trip_id,date});if(from)params.set('from',from);if(to)params.set('to',to);
 return 'sntf-trip.html?'+params.toString();
};
const safeImage=value=>{
 if(typeof value!=='string')return null;
 if(/^\.\.\/assets\/train-schedules\/[\w./ -]+\.(?:png|jpe?g|webp|svg)$/i.test(value)&&!value.includes('..',3))return value;
 if(/^https:\/\/imadtbn\.github\.io\/dz_portal\/assets\/train-schedules\/[\w./ -]+\.(?:png|jpe?g|webp|svg)$/i.test(value)&&!value.includes('/../'))return value;
 return null;
};
// Map the source image to the matching schedule viewer entry, rather than opening raw files.
const scheduleViewerLink=(image,route)=>{
 if(!image)return null;
 const imagePath=new URL(image,location.href).pathname;
 const entry=schedules.find(s=>new URL(s.image,location.href).pathname===imagePath)
   || schedules.find(s=>s.routeId&&s.routeId===route?.id);
 return entry?'sntf-schedule.html?schedule='+encodeURIComponent(entry.id):null;
};
async function read(name,key){const response=await fetch(new URL(name+'.json',root),{cache:'no-cache'});if(!response.ok)throw Error('تعذر تحميل '+name);const data=await response.json();if(!Array.isArray(data[key]))throw Error('ملف غير صالح: '+name);return data}
const params=new URL(location.href).searchParams;
let trip,route,source,calendar,stations,calendars,exceptions,holidays,complete,date,from,to,image;
const station=id=>stations.find(s=>s.id===id)?.name||id;
const canonicalTrip=()=>new URL('sntf-trip.html?'+new URLSearchParams({trip:trip.trip_id}),location.href).href;
const scheduledDateTime=value=>{
 const minutes=mins(value);
 if(!Number.isFinite(minutes))return null;
 return shiftISO(date,Math.floor(minutes/1440))+'T'+formatTime(value).slice(0,5)+':00+01:00';
};
function updateIndexing(){
 const first=trip.stop_times[0],last=trip.stop_times.at(-1),url=canonicalTrip();
 const name=`قطار ${station(first.station_id)} إلى ${station(last.station_id)}${trip.train_number?' رقم '+trip.train_number:''}`;
 const description=`مواقيت ومحطات ${name}، ${daysLabel()}، وفق صورة جدول SNTF. الأوقات مجدولة وليست تتبعًا مباشرًا.`;
 const trainStation=id=>({ '@type':'TrainStation',name:station(id) });
 const service={
  '@type':'TrainTrip','@id':url+'#train-trip',name,description,url,
  departureStation:trainStation(first.station_id),arrivalStation:trainStation(last.station_id),
  provider:{'@type':'Organization',name:'الشركة الوطنية للنقل بالسكك الحديدية (SNTF)',url:'https://www.sntf.dz/'},
  itinerary:{'@type':'ItemList',itemListElement:trip.stop_times.map((stop,i)=>({
   '@type':'ListItem',position:i+1,item:trainStation(stop.station_id)
  }))}
 };
 if(trip.train_number)service.trainNumber=String(trip.train_number);
 if(image)service.image=new URL(image,location.href).href;
 if(runsOn(trip,date,calendars,exceptions,holidays)){
  const departureTime=scheduledDateTime(first.departure),arrivalTime=scheduledDateTime(last.arrival);
  if(departureTime)service.departureTime=departureTime;
  if(arrivalTime)service.arrivalTime=arrivalTime;
 }
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url+'#webpage',url,name,description,inLanguage:'ar-DZ',mainEntity:{'@id':service['@id']},
   breadcrumb:{'@id':url+'#breadcrumb'}},
  {'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[
   {'@type':'ListItem',position:1,name:'الرئيسية',item:'https://imadtbn.github.io/dz_portal/'},
   {'@type':'ListItem',position:2,name:'منصة القطارات',item:'https://imadtbn.github.io/dz_portal/sectors/sntf-trains.html'},
   {'@type':'ListItem',position:3,name,item:url}
  ]},service
 ]};
 $('trip-canonical').href=url;
 $('trip-og-url').content=url;
 $('trip-schema').textContent=JSON.stringify(schema);
 document.querySelector('meta[name="description"]').content=description;
 document.querySelector('meta[property="og:title"]').content=name;
 document.querySelector('meta[property="og:description"]').content=description;
}
const clock=value=>{
 if(!Number.isFinite(mins(value)))return '<span class="unknown">غير منشور</span>';
 const day=Math.floor(mins(value)/1440),on=shiftISO(date,day);
 return `<time dir="ltr">${esc(formatTime(value).replace(' +1',''))}</time>${day?`<small>اليوم التالي · ${esc(on)}</small>`:''}`;
};
function daysLabel(){
 if(calendar.rule==='daily')return 'يسير كل يوم';
 if(calendar.rule==='friday_holiday')return 'الجمعة والأعياد المدرجة';
 if(calendar.rule==='weekday_not_friday')return 'عدا الجمعة والأعياد المدرجة';
 if(calendar.rule==='except_friday')return 'كل الأيام عدا الجمعة';
 if(calendar.rule==='friday_only')return 'الجمعة فقط';
 const names=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
 const keys=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
 return names.filter((_,i)=>calendar.days?.[keys[i]]).join('، ')||calendar.label||'أيام التشغيل غير محددة';
}
function cell(stop,kind){return clock(stop[kind])}
function stopsHtml(){
 return trip.stop_times.map((stop,i)=>{
  const selected=[from,to].includes(stop.station_id),both=stop.arrival!=null&&stop.departure!=null&&stop.arrival===stop.departure;
  const noTime=stop.arrival==null&&stop.departure==null;
  const common=both&&trip.station_time_kind==='published_departure_or_passage';
  const times=common?`<td colspan="2">${clock(stop.arrival)}<small>وقت واحد منشور للمحطة</small></td>`:`<td>${cell(stop,'arrival')}</td><td>${cell(stop,'departure')}</td>`;
  return `<tr${selected?' class="highlight"':''}><td>${i+1}. ${esc(station(stop.station_id))}${selected?'<small>محطة الرحلة المختارة</small>':''}${noTime?'<small>لا يوجد توقيت منشور لهذه المحطة</small>':''}</td>${times}</tr>`;
 }).join('');
}
function dateStatus(){
 const runs=runsOn(trip,date,calendars,exceptions,holidays);
 const affected=['friday_holiday','weekday_not_friday'].includes(calendar.rule)&&!complete&&!isHoliday(date,holidays);
 let text=trip.operating_days_status==='conflicting_source_versions'?'أيام تشغيل هذه النسخة متعارضة مع صورة أخرى؛ لا تُعرض كتأكيد لرحلة في هذا التاريخ.':
  runs?'يسير في التاريخ المختار بحسب الجدول المنشور.':'لا يسير في التاريخ المختار بحسب أيام التشغيل المدخلة.';
 if(affected)text+=' رزنامة الأعياد غير مكتملة لهذا التاريخ؛ راجع تشغيل الأعياد عند الحاجة.';
 const holiday=holidays.find(x=>(typeof x==='string'?x:x.date)===date);
 return `<p class="date-status ${runs?'yes':'no'}" role="status">${esc(text)}</p>${holiday?`<p class="notice">${esc(holiday.name||'عيد')} · طبقت قاعدة تشغيل الأعياد المدرجة.</p>`:''}`;
}
function summaryTime(stop,kind){const value=stop[kind];if(!Number.isFinite(mins(value)))return 'غير منشور';const day=Math.floor(mins(value)/1440);return formatTime(value).replace(' +1','')+(day?' · اليوم التالي':'')}
function calendarReminder(){
 const boarding=trip.stop_times.find(stop=>stop.station_id===from&&Number.isFinite(mins(stop.departure)))||trip.stop_times[0];
 if(!Number.isFinite(mins(boarding.departure)))return;
 const start=Date.parse(date+'T00:00:00+01:00')+mins(boarding.departure)*60000;
 const utc=ms=>new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const text=value=>String(value).replace(/[\\;,\n]/g,c=>({'\\':'\\\\',';':'\\;',',':'\\,','\n':'\\n'}[c]));
 const title=`تذكير قطار ${station(boarding.station_id)} إلى ${station(trip.stop_times.at(-1).station_id)}`;
 // Five minutes is the calendar reminder event, not a claim about journey duration.
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DZ Portal//DZ Rail//AR','BEGIN:VEVENT',
  'UID:'+encodeURIComponent(trip.trip_id+'-'+date+'-'+boarding.station_id)+'@dz-portal',
  'DTSTAMP:'+utc(Date.now()),'DTSTART:'+utc(start),'DTEND:'+utc(start+5*60000),
  'SUMMARY:'+text(title),'DESCRIPTION:'+text('تذكير بوقت الانطلاق المجدول من صورة SNTF، وليس وقت وصول أو تتبعًا مباشرًا.'),
  'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:'+text(title),'END:VALARM','END:VEVENT','END:VCALENDAR',''];
 const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='dz-rail-'+date+'.ics';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function render(){
 const first=trip.stop_times[0],last=trip.stop_times.at(-1),dep=mins(first.departure),arr=mins(last.arrival);
 const diff=Number.isFinite(dep)&&Number.isFinite(arr)&&arr>=dep?duration(arr-dep):'غير منشورة';
 const validity=source?.valid_from||trip.effective_from;
 const note=trip.time_status==='partial'?'<p class="notice">الصورة تنشر وقت الانطلاق فقط؛ أوقات التوقف والوصول غير منشورة، والمحطات المبيّنة دون وقت لا تمثل وعدًا بالتوقف.</p>':'';
 const scheduleUrl=scheduleViewerLink(image,route);
 const img=image?(scheduleUrl?`<a class="source-preview" href="${esc(scheduleUrl)}" aria-label="عرض الجدول المصور في عارض الجداول"><img src="${esc(image)}" alt="صورة جدول SNTF للرحلة" loading="lazy"></a>`:`<img class="source-preview" src="${esc(image)}" alt="صورة جدول SNTF للرحلة" loading="lazy">`):'<p class="empty">لا توجد صورة محددة لهذه الرحلة.</p>';
 const canRemind=runsOn(trip,date,calendars,exceptions,holidays)&&trip.stop_times.some(s=>s.station_id===(from||trip.stop_times[0].station_id)&&Number.isFinite(mins(s.departure)));
 const actions=`${canRemind?'<button class="button" type="button" id="calendar-trip">تذكير تقويم قبل 30 دقيقة</button>':''}<a class="button" href="sntf-trains.html#journey-planner">البحث عن رحلة أخرى</a><button class="button" type="button" id="share-trip">مشاركة الرحلة</button>`;
 $('trip-content').innerHTML=`<section class="trip-hero"><span class="eyebrow">${esc(route?.category||'رحلة قطار')} · جدول مجدول</span><h1>${esc(station(first.station_id))} ← ${esc(station(last.station_id))}</h1><p>${esc(route?.name||'تفاصيل الرحلة')} · ${esc(readableDate(date))}</p><div class="chips"><span class="chip">القطار: ${esc(trip.train_number||'رقم غير منشور')}</span><span class="chip">${esc(daysLabel())}</span><span class="chip">المدة: ${esc(diff)}</span></div><div class="time-grid"><div><small>الانطلاق</small><strong dir="ltr">${esc(summaryTime(first,'departure'))}</strong></div><div><small>الوصول</small><strong dir="ltr">${esc(summaryTime(last,'arrival'))}</strong></div></div></section>
 <section class="panel"><h2>تاريخ السفر وأيام التشغيل</h2><div class="date-row"><label for="travel-date">اختر تاريخًا لعرض حالة التشغيل<input id="travel-date" type="date" value="${esc(date)}"></label><span class="chip">${esc(daysLabel())}</span></div><div id="operating-status">${dateStatus()}</div><dl class="meta-grid"><div><dt>رقم القطار</dt><dd>${esc(trip.train_number||'غير منشور')}</dd></div><div><dt>بداية سريان الجدول المنشورة</dt><dd>${esc(validity||'غير محددة')}</dd></div><div><dt>عدد المحطات المدرجة</dt><dd>${trip.stop_times.length}</dd></div></dl><p class="notice">هذه أوقات مجدولة من صورة SNTF الرسمية، وليست بيانات تتبع حي أو إعلانًا بتأخير القطار.</p></section>
 <section class="panel"><h2>جميع المحطات والأوقات</h2><p>يظهر وقت الوصول والمغادرة منفصلين عندما ينشر الجدول قيمتين مختلفتين. الشرطة تعني أن الوقت غير منشور.</p>${note}<table class="time-table"><thead><tr><th scope="col">المحطة</th><th scope="col">الوصول</th><th scope="col">المغادرة</th></tr></thead><tbody>${stopsHtml()}</tbody></table></section>
 <section class="panel"><h2>صورة الجدول الأصلي</h2><div class="source-layout"><div class="source-info"><p><strong>${esc(source?.name||'جدول SNTF المصور')}</strong></p><p>مصدر التوقيت: الصورة المرتبطة بهذه الرحلة. ${esc(source?.notice||'')}</p><div class="actions">${scheduleUrl?`<a class="button primary" href="${esc(scheduleUrl)}">عرض الجدول الأصلي بوضوح ←</a>`:''}${actions}</div><p id="share-status" role="status"></p></div>${img}</div></section>`;
 $('travel-date').addEventListener('change',event=>{
  if(!validDate(event.target.value))return;
  date=event.target.value;
  history.replaceState(null,'',tripLink(trip,date,from,to));
  render();
 });
 $('calendar-trip')?.addEventListener('click',calendarReminder);
 $('share-trip').addEventListener('click',async()=>{
  const url=new URL(tripLink(trip,date,from,to),location.href).href;
  try{if(navigator.share)await navigator.share({title:document.title,url});else {await navigator.clipboard.writeText(url);$('share-status').textContent='نُسخ رابط الرحلة.'}}
  catch(error){if(error.name!=='AbortError')$('share-status').textContent='تعذرت المشاركة؛ انسخ الرابط من شريط العنوان.'}
 });
 document.title=`${station(first.station_id)} ← ${station(last.station_id)} | DZ Rail`;
 updateIndexing();
}
$('close-photo').addEventListener('click',()=>$('photo-dialog').close());
$('photo-dialog').addEventListener('click',event=>{if(event.target===$('photo-dialog'))$('photo-dialog').close()});
async function start(){
 try{
  const id=params.get('trip');
  if(!id){$('trip-content').innerHTML='<div class="empty">اختر رحلة من <a href="sntf-trains.html#journey-planner">نتائج البحث</a> لعرض تفاصيلها.</div>';return}
  const [sd,rd,td,cd,src,hd]=await Promise.all([read('stations','stations'),read('routes','routes'),read('trips','trips'),read('calendars','calendars'),read('sources','sources'),read('holidays','dates')]);
  trip=td.trips.find(t=>t.trip_id===id&&['source_transcribed','verified'].includes(t.data_status));
  if(!trip){$('trip-content').innerHTML='<div class="empty">هذه الرحلة غير منشورة أو غير موجودة. <a href="sntf-trains.html#journey-planner">ابحث عن رحلة</a>.</div>';return}
  stations=sd.stations;route=rd.routes.find(r=>r.id===trip.route_id);source=src.sources.find(s=>s.id===trip.source_id);
  calendars=cd.calendars;exceptions=cd.exceptions||[];holidays=hd.dates;complete=hd.complete===true;
  calendar=calendars.find(c=>c.id===trip.service_id);
  if(!calendar)throw Error('تقويم الرحلة غير موجود');
  date=validDate(params.get('date'))?params.get('date'):dayISO(new Date());
  from=trip.stop_times.some(s=>s.station_id===params.get('from'))?params.get('from'):'';
  to=trip.stop_times.some(s=>s.station_id===params.get('to'))?params.get('to'):'';
  image=safeImage(source?.url)||safeImage(route?.schedule_image);
  render();
 }catch(error){$('trip-content').innerHTML='<div class="empty">تعذر تحميل تفاصيل الرحلة. <a href="sntf-trains.html">ارجع إلى منصة القطارات</a>.</div>';console.error('DZ Rail trip:',error)}
}
start();
