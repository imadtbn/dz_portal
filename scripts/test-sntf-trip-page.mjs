import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dayISO,mins,formatTime,runsOn,shiftISO,isHoliday} from '../assets/js/sntf-trains/engine.js';
const files=new Set(['stations','routes','trips','calendars','sources','holidays']);
const raw=readFileSync('assets/js/sntf-trains/trip-page.js','utf8')
 .replace(/^import [^\n]+\n/gm,'')
 .replaceAll('import.meta.url','"https://example.invalid/dz_portal/assets/js/sntf-trains/trip-page.js"')
 .replace(/\nstart\(\);\s*$/,'\nreturn start();');
class Element{
 constructor(){this.innerHTML='';this.textContent='';this.value='';this.listeners={};}
 addEventListener(name,fn){this.listeners[name]=fn}
}
async function page(query){
 const nodes=new Map(),document={title:'',getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)}};
 const location={href:'https://example.invalid/dz_portal/sectors/sntf-trip.html?'+query};
 const fetch=async url=>{const name=new URL(url).pathname.split('/').at(-1).replace('.json','');assert(files.has(name));return {ok:true,json:async()=>JSON.parse(readFileSync('assets/data/sntf/'+name+'.json','utf8'))}};
 const history={replaceState(_state,_title,url){location.href=new URL(url,location.href).href}};
 const run=new Function('document','location','history','URL','fetch','console','dayISO','mins','formatTime','runsOn','shiftISO','isHoliday',raw);
 await run(document,location,history,URL,fetch,console,dayISO,mins,formatTime,runsOn,shiftISO,isHoliday);
 return {get:id=>document.getElementById(id),title:document.title};
}
const trips=JSON.parse(readFileSync('assets/data/sntf/trips.json','utf8')).trips;
const daily=trips.find(x=>x.train_number==='B124/125');
const shown=await page(new URLSearchParams({trip:daily.trip_id,date:'2026-09-29',from:'thenia',to:'el_affroun'}));
const html=shown.get('trip-content').innerHTML;
assert(html.includes('B124/125')&&html.includes('08:15')&&html.includes('09:52'));
assert(html.includes('يسير في التاريخ المختار')&&html.includes('وقت واحد منشور للمحطة'));
assert(html.includes('thenia-affroune-thenia.png')&&html.includes('class="highlight"'));
assert(html.includes('id="calendar-trip"'),'Published departures can be added to a calendar');
assert.equal((html.match(/<tbody>/g)||[]).length,1);
assert.equal((html.match(/<tr/g)||[]).length,23,'Header plus 22 actual stations');
const intl=trips.find(x=>x.trip_id==='photo-annaba-tunis-sun-tue-thu');
const partial=(await page(new URLSearchParams({trip:intl.trip_id,date:'2026-09-29'}))).get('trip-content').innerHTML;
assert(partial.includes('09:00')&&partial.includes('غير منشور')&&partial.includes('الصورة تنشر وقت الانطلاق فقط'));
const night=trips.find(x=>x.data_status==='source_transcribed'&&x.stop_times.some(s=>mins(s.arrival)>=1440));
assert(night,'Night service must exist');
const overnight=(await page(new URLSearchParams({trip:night.trip_id,date:'2026-09-29'}))).get('trip-content').innerHTML;
assert(overnight.includes('اليوم التالي'));
const reverse=trips.find(x=>x.trip_id==='photo-affroun-alger-1022-except_friday-20260919');
const off=(await page(new URLSearchParams({trip:reverse.trip_id,date:'2026-10-02'}))).get('trip-content').innerHTML;
assert(off.includes('لا يسير في التاريخ المختار')&&!off.includes('id="calendar-trip"'),'An inactive Friday must not get a calendar reminder');
assert(off.includes('affroun-alger.jpg'),'The original JPG replaces the deleted SVG');
const draft=trips.find(x=>x.data_status==='pending_review');
assert((await page(new URLSearchParams({trip:draft.trip_id}))).get('trip-content').innerHTML.includes('غير منشورة'));
assert((await page('')).get('trip-content').innerHTML.includes('اختر رحلة'));
console.log('SNTF trip page PASS: published daily, partial, overnight, image, highlighted stops and hidden drafts.');
