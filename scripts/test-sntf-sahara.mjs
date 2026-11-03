import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runsOn} from '../assets/js/sntf-trains/engine.js';
const load=n=>JSON.parse(readFileSync('assets/data/sntf/'+n+'.json','utf8'));
const trips=load('trips').trips,calendars=load('calendars').calendars;
const byId=new Map(trips.map(t=>[t.trip_id,t]));
assert.equal(trips.filter(t=>t.trip_id.startsWith('photo-sahara-')).length,14);
const tou=byId.get('photo-sahara-agha-touggourt');
assert.equal(tou.stop_times.find(s=>s.station_id==='el_outaya').departure,null,'Conflicting time is JSON null');
assert(runsOn(tou,'2026-09-28',calendars),'Monday outbound');
assert(!runsOn(tou,'2026-09-29',calendars),'No Tuesday outbound');
assert.equal(byId.get('photo-sahara-b193').stop_times.length,6);
assert.equal(byId.get('photo-sahara-b195').stop_times[0].station_id,'djelfa','Short turn starts in Djelfa');
for(const id of ['photo-sahara-bechar-tindouf-evening','photo-sahara-bechar-tindouf-day']){
 const t=byId.get(id);assert.equal(t.operating_days_status,'conflicting_source_versions');
 assert(!runsOn(t,'2026-09-28',calendars),'Undated conflicting posters must not both generate a live train');
}
console.log('SNTF Sahara PASS: 14 columns, partial time, short turns and undated variant suppression.');
