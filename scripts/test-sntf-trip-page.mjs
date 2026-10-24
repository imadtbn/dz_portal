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
 const nodes=new Map(),document={title:'',getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)},querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector)}};
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
const schema=JSON.parse(shown.get('trip-schema').textContent);
const service=schema['@graph'].find(node=>node['@type']==='TrainTrip');
assert.equal(service.trainNumber,'B124/125');
assert.equal(service.itinerary.itemListElement.length,22);
assert.equal(service.departureTime,'2026-09-29T08:15:00+01:00');
assert.equal(service.arrivalTime,'2026-09-29T09:52:00+01:00');
assert.equal(shown.get('trip-canonical').href,'https://example.invalid/dz_portal/sectors/sntf-trip.html?trip='+encodeURIComponent(daily.trip_id));
const intl=trips.find(x=>x.trip_id==='photo-annaba-tunis-sun-tue-thu');
const partial=(await page(new URLSearchParams({trip:intl.trip_id,date:'2026-09-29'}))).get('trip-content').innerHTML;
assert(partial.includes('09:00')&&partial.includes('غير منشور')&&partial.includes('الصورة تنشر وقت الانطلاق فقط'));
const partialPage=await page(new URLSearchParams({trip:intl.trip_id,date:'2026-09-29'}));
assert(!('arrivalTime' in JSON.parse(partialPage.get('trip-schema').textContent)['@graph'].at(-1)),'Unknown arrival is omitted');
const night=trips.find(x=>x.data_status==='source_transcribed'&&x.stop_times.some(s=>mins(s.arrival)>=1440));
assert(night,'Night service must exist');
const overnight=(await page(new URLSearchParams({trip:night.trip_id,date:'2026-09-29'}))).get('trip-content').innerHTML;
assert(overnight.includes('اليوم التالي'));
const overnightSchema=JSON.parse((await page(new URLSearchParams({trip:night.trip_id,date:'2026-09-29'}))).get('trip-schema').textContent)['@graph'].at(-1);
if(overnightSchema.arrivalTime)assert(overnightSchema.arrivalTime.startsWith('2026-09-30T'),'Overnight arrival is on the next date');
const reverse=trips.find(x=>x.trip_id==='photo-affroun-alger-1022-except_friday-20260919');
const off=(await page(new URLSearchParams({trip:reverse.trip_id,date:'2026-10-02'}))).get('trip-content').innerHTML;
assert(off.includes('لا يسير في التاريخ المختار')&&!off.includes('id="calendar-trip"'),'An inactive Friday must not get a calendar reminder');
const offSchema=JSON.parse((await page(new URLSearchParams({trip:reverse.trip_id,date:'2026-10-02'}))).get('trip-schema').textContent)['@graph'].at(-1);
assert(!('departureTime' in offSchema),'Inactive dates must not claim scheduled departure');
assert(off.includes('affroun-alger.jpg'),'The original JPG replaces the deleted SVG');
const draft=trips.find(x=>x.data_status==='pending_review');
assert((await page(new URLSearchParams({trip:draft.trip_id}))).get('trip-content').innerHTML.includes('غير منشورة'));
assert((await page('')).get('trip-content').innerHTML.includes('اختر رحلة'));
const sitemap=readFileSync('sitemap.xml','utf8');
const indexed=[...sitemap.matchAll(/<loc>https:\/\/imadtbn\.github\.io\/dz_portal\/sectors\/sntf-trip\.html\?trip=([^<]+)<\/loc>/g)].map(match=>decodeURIComponent(match[1]));
assert.deepEqual(new Set(indexed),new Set(trips.filter(x=>['source_transcribed','verified'].includes(x.data_status)).map(x=>x.trip_id)));
assert(!sitemap.includes('<loc>https://imadtbn.github.io/dz_portal/sectors/sntf-trip.html</loc>'),'Empty trip shell is not indexed');
console.log('SNTF trip page PASS: published daily, partial, overnight, image, highlighted stops and hidden drafts.');
