import {mins, runsOn, shiftISO} from './engine.js';

export const MIN_TRANSFER_MINUTES = 30;
export const MAX_TRANSFER_MINUTES = 180;
const DAY = 86400000;
const timestamp = (date, clock) => Date.parse(date + 'T00:00:00+01:00') + mins(clock) * 60000;
const published = trip => trip.data_status === 'source_transcribed' || trip.data_status === 'verified';

// A leg needs a published departure and arrival in the right station order.
function legsForDate(trips, date, config, earliest) {
  const start = timestamp(date, '00:00');
  const end = start + DAY;
  const legs = [];
  for (const serviceDate of [shiftISO(date, -1), date, shiftISO(date, 1)]) {
    for (const trip of trips) {
      if (!published(trip) || !runsOn(trip, serviceDate, config.calendars, config.exceptions, config.holidays)) continue;
      const stops = trip.stop_times || [];
      for (let i = 0; i < stops.length - 1; i++) {
        const departure = mins(stops[i].departure);
        if (!Number.isFinite(departure)) continue;
        const dep = timestamp(serviceDate, stops[i].departure);
        if (dep < earliest || dep >= end + DAY) continue;
        for (let j = i + 1; j < stops.length; j++) {
          const arrival = mins(stops[j].arrival);
          if (!Number.isFinite(arrival)) continue;
          const arr = timestamp(serviceDate, stops[j].arrival);
          if (arr <= dep) continue;
          legs.push({trip, serviceDate, from:stops[i].station_id, to:stops[j].station_id,
            fromIndex:i, toIndex:j, departure:dep, arrival:arr});
        }
      }
    }
  }
  return {legs, start, end};
}

export function planJourney({trips, origin, destination, date, after='00:00', calendars, exceptions=[], holidays=[], minTransfer=MIN_TRANSFER_MINUTES, maxTransfer=MAX_TRANSFER_MINUTES}) {
  if (!origin || !destination || origin === destination || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(mins(after))) return {direct:[], connections:[]};
  const config = {calendars, exceptions, holidays};
  const {legs, start, end} = legsForDate(trips, date, config, timestamp(date, after));
  const first = legs.filter(l => l.from === origin && l.departure >= start && l.departure < end);
  const direct = first.filter(l => l.to === destination)
    .sort((a,b) => a.departure-b.departure || a.arrival-b.arrival).slice(0,20);
  const byOrigin = new Map();
  for (const leg of legs) {
    if (!byOrigin.has(leg.from)) byOrigin.set(leg.from, []);
    byOrigin.get(leg.from).push(leg);
  }
  const connections = [];
  for (const a of first) {
    if (a.to === destination || a.to === origin) continue;
    for (const b of byOrigin.get(a.to) || []) {
      if (b.to !== destination || a.trip.trip_id === b.trip.trip_id && a.serviceDate === b.serviceDate) continue;
      const wait = (b.departure - a.arrival) / 60000;
      if (wait < minTransfer || wait > maxTransfer || b.arrival <= a.arrival) continue;
      connections.push({first:a, second:b, station:a.to, wait});
    }
  }
  // Each unique pair of dated services and interchange should appear once.
  const seen = new Set();
  return {direct, connections:connections.sort((a,b) => a.second.arrival-b.second.arrival || a.first.departure-b.first.departure)
    .filter(c => {const key=[c.first.trip.trip_id,c.first.serviceDate,c.station,c.second.trip.trip_id,c.second.serviceDate].join('|');if(seen.has(key))return false;seen.add(key);return true}).slice(0,20)};
}
