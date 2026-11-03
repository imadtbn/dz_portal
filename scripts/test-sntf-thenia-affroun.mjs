import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => JSON.parse(readFileSync(`assets/data/sntf/${name}.json`, 'utf8'));
const routes = read('routes').routes;
const trips = read('trips').trips;
const line = read('lines').lines.find(item => item.id === 'affroun-thenia');
const source = read('sources').sources.find(item => item.id === 'gallery-suburban-thenia-affroun-2026-09-19');
const corridor = ['thenia', 'tidjelabine', 'boumerdes', 'corso', 'boudouaou', 'reghaia', 'reghaia_zi', 'rouiba_zi', 'rouiba', 'dar_el_beida', 'bab_ezzouar', 'oued_smar', 'gue_de_constantine', 'ain_naadja', 'baba_ali', 'birtouta', 'boufarik', 'beni_mered', 'blida', 'chiffa', 'mouzaia', 'el_affroun'];
assert.ok(source?.url.endsWith('/assets/train-schedules/suburban/thenia-affroune-thenia.png'));
assert.deepEqual(line.route_ids, ['thenia-affroun', 'reghaia-affroun', 'affroun-thenia', 'affroun-reghaia']);
const cases = [
  ['thenia-affroun', 'B124/125', '08:15', '09:52', corridor.length],
  ['reghaia-affroun', 'B126/127', '12:10', '13:25', corridor.length - 5],
  ['thenia-affroun', 'B128/129', '16:10', '17:45', corridor.length],
  ['affroun-thenia', 'B152/153', '06:00', '07:41', corridor.length],
  ['affroun-reghaia', 'B154/155', '10:25', '11:40', corridor.length - 5],
  ['affroun-thenia', 'B156/157', '14:00', '15:34', corridor.length]
];
for (const [routeId, number, first, last, count] of cases) {
  const route = routes.find(item => item.id === routeId);
  const trip = trips.find(item => item.route_id === routeId && item.train_number === number);
  assert.ok(route && trip, `Missing ${number}`);
  assert.equal(route.schedule_status, 'source_transcribed');
  assert.equal(trip.service_id, 'daily');
  assert.equal(trip.data_status, 'source_transcribed');
  assert.equal(trip.stop_times.length, count);
  assert.equal(trip.stop_times[0].departure, first);
  assert.equal(trip.stop_times.at(-1).arrival, last);
  assert.deepEqual(trip.stop_times.map(stop => stop.station_id), route.stops);
}
assert.deepEqual(routes.find(item => item.id === 'thenia-affroun').stops, corridor);
assert.deepEqual(routes.find(item => item.id === 'affroun-thenia').stops, [...corridor].reverse());
const gallery = read('gallery-index');
assert.match(JSON.stringify(gallery), /thenia-affroune-thenia\.png/);
const html = readFileSync('sectors/sntf.html', 'utf8');
assert.match(html, /data-image="\.\.\/assets\/train-schedules\/suburban\/thenia-affroune-thenia\.png"/);
console.log('SNTF Thénia–El Affroun PASS: six daily trips, four actual corridors.');
