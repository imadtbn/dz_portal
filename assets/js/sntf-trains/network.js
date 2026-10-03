// Canonical, source-aware SNTF line/route presentation. Timetable stops come only from published stop_times.
// Railway categories mirror the five official timetable sections in sectors/sntf.html.
export const railwayCategories=Object.freeze([
 {id:"suburban",label:"ضاحية الجزائر",anchor:"suburban"},
 {id:"eastern",label:"الخطوط الجهوية الشرقية",anchor:"eastern-regional"},
 {id:"western",label:"الخطوط الجهوية الغربية",anchor:"western-regional"},
 {id:"sahara",label:"الصحراء والهضاب العليا",anchor:"sahara-plateau-regional"},
 {id:"international",label:"الخط الدولي",anchor:"international"}
]);
export const categoryRoutes=(category,routes)=>routes.filter(r=>!r.alias_of&&!r.catalog_status&&(!category||r.category===category));
export const canonicalRouteId = route => route.alias_of || route.id;
export const publishedTrips = trips => trips.filter(t => t.data_status === "source_transcribed" || t.data_status === "verified");
export function routeTrips(route, trips, includeDrafts = false) {
 const id=canonicalRouteId(route);
 return trips.filter(t => t.route_id===id && (includeDrafts || t.data_status==="source_transcribed" || t.data_status==="verified"))
  .sort((a,b)=>String(a.stop_times?.[0]?.departure||"99:99").localeCompare(String(b.stop_times?.[0]?.departure||"99:99")) || String(a.train_number||"").localeCompare(String(b.train_number||"")));
}
export function routeStopSummary(route,trips) {
 const available=routeTrips(route,trips),counts=new Map(),services=new Map();
 for(const t of available){
  const seen=new Set();
  for(const s of t.stop_times||[]){
   if(seen.has(s.station_id) || (s.arrival==null && s.departure==null))continue;
   seen.add(s.station_id);counts.set(s.station_id,(counts.get(s.station_id)||0)+1);
   if(!services.has(s.station_id))services.set(s.station_id,[]);
   services.get(s.station_id).push(t.trip_id);
  }
 }
 const corridor=Array.isArray(route.stops)&&route.stops.length?route.stops:[route.from,route.to];
 const ordered=[...new Set([...corridor,...counts.keys()])];
 return {route_id:route.id,canonical_id:canonicalRouteId(route),train_count:available.length,
  known_stops:ordered.filter(id=>counts.has(id)).map(id=>({station_id:id,train_count:counts.get(id)})),
  corridor_only:available.length?ordered.filter(id=>!counts.has(id)):[],
  endpoints_only:available.length===0,unverified_endpoints:available.length===0?[route.from,route.to]:[],
  stop_service_ids:services};
}
export function lineRoutes(line,routes){
 const routeIds=new Set(line.route_ids);
 return routes.filter(r=>routeIds.has(r.id) && !r.alias_of && !r.catalog_status);
}
export function lineSummary(line,routes,trips) {
 const rs=lineRoutes(line,routes),ids=new Set(),activeRoutes=[];
 let trainCount=0;
 for(const r of rs) {
  const t=routeTrips(r,trips);trainCount+=t.length;
  if(t.length)activeRoutes.push(r.id);
  for(const trip of t)for(const s of trip.stop_times||[])if(s.arrival!=null||s.departure!=null)ids.add(s.station_id);
 }
 return {line_id:line.id,route_count:rs.length,train_count:trainCount,served_station_ids:[...ids],active_route_ids:activeRoutes,has_timetable:trainCount>0};
}
export function stationLineServices(stationId,lines,routes,trips){
 const result=[];
 for(const line of lines){
  const covered=[];
  for(const route of lineRoutes(line,routes)){
   const matching=routeTrips(route,trips).filter(t=>t.stop_times?.some(s=>s.station_id===stationId && (s.arrival!=null||s.departure!=null)));
   if(matching.length)covered.push({route_id:route.id,count:matching.length,
    departures:matching.filter(t=>t.stop_times.find(s=>s.station_id===stationId)?.departure!=null).length,
    arrivals:matching.filter(t=>t.stop_times.find(s=>s.station_id===stationId)?.arrival!=null).length});
  }
  if(covered.length)result.push({line_id:line.id,line_name:line.name,route_services:covered,train_count:covered.reduce((n,r)=>n+r.count,0)});
 }
 return result;
}
export function eligibleStationIds(lineId,routeId,lines,routes,trips){
 const selected=routeId?routes.filter(r=>r.id===routeId):
  lineId?routes.filter(r=>lineRoutes(lines.find(l=>l.id===lineId)||{route_ids:[]},routes).some(x=>x.id===r.id)):null;
 if(selected===null)return null; // all registered stations remain searchable before filtering
 const ids=new Set();
 for(const r of selected){
  const t=routeTrips(r,trips);
  // Every directional service keeps its two termini selectable even when only its departure is published.
  ids.add(r.from);ids.add(r.to);
  if(t.length)for(const x of t)for(const stop of x.stop_times||[])if(stop.arrival!=null||stop.departure!=null)ids.add(stop.station_id);
 }
 return ids;
}

export function eligibleStationIdsByCategory(category,routeId,lines,routes,trips){
 if(routeId){
  const route=routes.find(r=>r.id===routeId);
  if(!route||(category&&route.category!==category))return new Set();
  return eligibleStationIds("",canonicalRouteId(route),lines,routes,trips);
 }
 if(!category)return null; // No filter: all registered stations remain available.
 const stops=new Set();
 for(const line of lines.filter(line=>line.category===category)){
  const ids=eligibleStationIds(line.id,"",lines,routes,trips);
  if(ids)for(const id of ids)stops.add(id);
 }
 return stops;
}
