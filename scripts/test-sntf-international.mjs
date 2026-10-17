import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runsOn,recordsAtStation,eligible} from '../assets/js/sntf-trains/engine.js';
const load=n=>JSON.parse(readFileSync('assets/data/sntf/'+n+'.json','utf8'));
const trips=load('trips').trips,calendars=load('calendars').calendars;
const byId=new Map(trips.map(t=>[t.trip_id,t]));
for(const [id,start,clock,date,offDate] of [
 ['photo-annaba-tunis-sun-tue-thu','annaba','09:00','2026-09-29','2026-09-30'],
 ['photo-tunis-annaba-mon-wed-fri','tunis','08:25','2026-09-30','2026-10-01']]){
 const t=byId.get(id);
 assert.equal(t.stop_times[0].station_id,start);
 assert.equal(t.stop_times[0].departure,clock);
 assert.equal(t.stop_times.length,6);
 assert(t.stop_times.slice(1).every(s=>s.arrival===null&&s.departure===null),'Only departure time is printed');
 assert(runsOn(t,date,calendars));assert(!runsOn(t,offDate,calendars));
}
const intl=trips.filter(t=>t.route_id==='alger-tunis');
assert(intl.every(t=>t.data_status==='pending_review'),'Historical Alger–Tunis draft remains unpublished');
const events=recordsAtStation(eligible(trips),'tunis','arrival','2026-09-29',{calendars,exceptions:[],holidays:[]},new Date('2026-09-29T00:00:00+01:00'));
assert(!events.some(e=>e.trip.trip_id==='photo-annaba-tunis-sun-tue-thu'),'Unknown arrival cannot produce a countdown');
console.log('SNTF international PASS: direction, day rules, unknown stop times and unpublished draft.');
