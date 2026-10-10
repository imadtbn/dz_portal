import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runsOn} from '../assets/js/sntf-trains/engine.js';
const load=n=>JSON.parse(readFileSync('assets/data/sntf/'+n+'.json','utf8'));
const trips=load('trips').trips,calendar=load('calendars').calendars,routes=load('routes').routes,lines=load('lines').lines;
const line=lines.find(l=>l.id==='chlef-affroun');assert.deepEqual(line.route_ids,['chlef-affroun','affroun-chlef']);
for(const [rid,start,end,first,last] of [
 ['chlef-affroun','chlef','el_affroun','10:30','12:36'],
 ['affroun-chlef','el_affroun','chlef','13:55','16:03']]){
 const r=routes.find(x=>x.id===rid),t=trips.find(x=>x.route_id===rid);
 assert(r&&t);assert.equal(r.category,'western');assert.equal(t.source_id,'gallery-west-chlef-affroun');
 assert.equal(t.stop_times.length,11);assert.equal(t.stop_times[0].station_id,start);assert.equal(t.stop_times.at(-1).station_id,end);
 assert.equal(t.stop_times[0].departure,first);assert.equal(t.stop_times.at(-1).arrival,last);
 assert(runsOn(t,'2026-09-28',calendar));assert(runsOn(t,'2026-10-02',calendar),'Image marks both directions daily');
}
const image='assets/train-schedules/Western/chlef-affroun-chlef.jpg';assert(existsSync(image));
const html=readFileSync('sectors/sntf.html','utf8'),west=html.slice(html.indexOf('id="western-regional"'),html.indexOf('id="sahara-plateau-regional"'));
assert(west.includes('../'+image));assert(west.includes('الشلف - العفرون - الشلف'));
console.log('SNTF Chlef–Affroun PASS: two daily directions, 11 stops, gallery image.');
