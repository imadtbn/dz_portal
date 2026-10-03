import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planJourney,MIN_TRANSFER_MINUTES} from '../assets/js/sntf-trains/planner.js';
import {runsOn,isHoliday} from '../assets/js/sntf-trains/engine.js';
const load=name=>JSON.parse(readFileSync(`assets/data/sntf/${name}.json`,'utf8'));
const {trips}=load('trips'),{calendars,exceptions}=load('calendars'),holidays=load('holidays');
const real=planJourney({trips,origin:'thenia',destination:'el_affroun',date:'2026-09-29',after:'08:00',calendars,exceptions,holidays:holidays.dates});
assert(real.direct.some(x=>x.trip.train_number==='B124/125'&&x.fromIndex===0&&x.toIndex===21));
assert(!real.direct.some(x=>x.trip.train_number==='B126/127'),'Rغاية departure must not masquerade as a Thénia train');
assert(real.direct.every(x=>x.departure<x.arrival));
const mk=(id,route,stops,service_id='daily')=>({trip_id:id,route_id:route,data_status:'source_transcribed',service_id,stop_times:stops.map(([station_id,departure,arrival])=>({station_id,departure,arrival}))});
const sample=[
 mk('one','a-b',[['a','08:00',null],['b','08:40','08:40']]),
 mk('too-short','b-c',[['b','09:09',null],['c',null,'10:00']]),
 mk('safe','b-c',[['b','09:10',null],['c',null,'10:00']]),
 mk('too-long','b-c',[['b','11:41',null],['c',null,'12:30']]),
 mk('wrong-stop','d-c',[['d','09:10',null],['c',null,'10:00']]),
 mk('direct','a-c',[['a','08:30',null],['c',null,'09:30']]),
 mk('draft','a-c',[['a','07:00',null],['c',null,'08:00']])
];sample.at(-1).data_status='pending_review';
const result=planJourney({trips:sample,origin:'a',destination:'c',date:'2026-09-29',after:'00:00',calendars,holidays:[]});
assert.deepEqual(result.direct.map(x=>x.trip.trip_id),['direct']);
assert.deepEqual(result.connections.map(x=>[x.first.trip.trip_id,x.second.trip.trip_id,x.wait]),[['one','safe',MIN_TRANSFER_MINUTES]]);
const night=[mk('overnight','a-c',[['a','23:50',null],['c',null,'24:30']])];
assert.equal(planJourney({trips:night,origin:'a',destination:'c',date:'2026-09-29',after:'23:00',calendars,holidays:[]}).direct.length,1);
assert.deepEqual(planJourney({trips:night,origin:'a',destination:'c',date:'2026-09-30',after:'00:00',calendars,holidays:[]}).direct.map(x=>x.serviceDate),['2026-09-30'],'Departure date is the boarding date');
assert(isHoliday('2026-11-01',holidays.dates));
assert(!isHoliday('2026-11-10',holidays.dates),'Unconfirmed 10 November must not affect train service');
assert(isHoliday('2026-03-22',holidays.dates));
assert(isHoliday('2026-05-29',holidays.dates));
assert(!isHoliday('2027-03-01',holidays.dates),'Unannounced religious dates must not be guessed');
const fridayHoliday=mk('holiday','a-b',[['a','08:00',null],['b',null,'09:00']],'friday_holiday');
assert(runsOn(fridayHoliday,'2026-11-01',calendars,exceptions,holidays.dates));
assert(!runsOn(fridayHoliday,'2026-11-10',calendars,exceptions,holidays.dates));
console.log('SNTF journey planner PASS: direct trains, safe transfer, overnight, holiday coverage and pending dates.');
