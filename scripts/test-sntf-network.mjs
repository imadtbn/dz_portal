import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=name=>JSON.parse(readFileSync("assets/data/sntf/"+name+".json","utf8"));
const stations=load("stations").stations,routes=load("routes").routes,lines=load("lines").lines,trips=load("trips").trips;
const networkSource=readFileSync("assets/js/sntf-trains/network.js","utf8");
const network=await import("data:text/javascript;base64,"+Buffer.from(networkSource).toString("base64"));
const active=network.publishedTrips(trips),routeById=new Map(routes.map(r=>[r.id,r]));
assert.equal(stations.length,196,"No station or manually verified coordinate was lost");
assert.equal(lines.length,22,"Twenty grouped geographical lines");
assert.equal(routes.length,63,"Preserve all 34 route IDs, including one legacy alias");
assert.equal(routes.filter(r=>!r.alias_of).length,61,"One legacy alias must not duplicate the real route");
assert.equal(active.length,198,"No documented train removed or duplicated");
const membership=new Set();
for(const line of lines){
 for(const route of network.lineRoutes(line,routes)){
  assert(!membership.has(route.id),"Canonical route duplicated between lines: "+route.id);
  membership.add(route.id);
  assert.equal(route.line_id,line.id,"Each route belongs to its declared line");
 }
}
assert.equal(membership.size,61,"Every nonalias route is in a line");
assert.equal(lines.reduce((n,line)=>n+network.lineSummary(line,routes,trips).train_count,0),198,"Line catalog must count each published train exactly once");
assert.equal(network.lineSummary(lines.find(l=>l.id==="alger-tunis"),routes,trips).train_count,2,"Only the two official Annaba/Tunis departures count as published, not the legacy draft or alias");
const intlStops=network.eligibleStationIdsByCategory("international","annaba-tunis",lines,routes,trips);
assert(intlStops.has("annaba")&&intlStops.has("tunis"),"Both international termini selectable with partial departure-only times");
assert.equal(network.routeStopSummary(routeById.get("annaba-tunis"),trips).known_stops.length,1,"Only Annaba's actual published departure is known");
assert.equal(network.routeStopSummary(routeById.get("tunis-annaba"),trips).known_stops.length,1,"Only Tunis's actual published departure is known");
assert.equal(network.routeStopSummary(routeById.get("alger-batna"),trips).train_count,0,"Legacy Algeria–Batna draft is not published");
for(const direction of ["agha-batna","batna-alger"])assert.equal(network.routeStopSummary(routeById.get(direction),trips).train_count,1,"Daily Batna timetable published in both directions");
const affroun=network.routeStopSummary(routeById.get("affroun-alger"),trips);
assert.equal(affroun.train_count,19,"Official reverse Affroun image retains all 19 services");
assert.equal(affroun.known_stops.length,16,"All 16 stations have a published reverse timetable");
assert.equal(affroun.known_stops.find(s=>s.station_id==="birtouta").train_count,19,"Count trains stopping at each intermediate station");
const thenia=network.routeStopSummary(routeById.get("alger-thenia"),trips);
assert.equal(thenia.train_count,14);
assert.equal(thenia.known_stops.length,18,"Only stations with published timetable times are labeled service stops");
assert(thenia.corridor_only.includes("rouiba_snvi"),"The corridor lists Rouiba SNVI but no published service stop currently exists");
const alias=network.routeStopSummary(routeById.get("zeralda-alger"),trips);
assert.equal(alias.train_count,14,"Legacy alias resolves without duplicating scheduled trips");
const aghaLine=lines.find(l=>l.id==="agha-zeralda");
assert.equal(network.lineSummary(aghaLine,routes,trips).train_count,28,"Route aliases never duplicate the line's total");
const services=network.stationLineServices("birtouta",lines,routes,trips);
assert(services.some(s=>s.line_id==="alger-affroun"&&s.route_services.some(r=>r.route_id==="affroun-alger")));
assert(services.some(s=>s.line_id==="agha-zeralda"),"A station displays every line with a documented stop, not just a corridor");
assert(!services.some(s=>s.line_id==="alger-bejaia"),"Missing national intermediate stop data must not invent station services");
assert.equal(network.eligibleStationIds("","",lines,routes,trips),null,"Unfiltered search still contains all registered stations");
const theniaLineStops=network.eligibleStationIds("alger-thenia","",lines,routes,trips);
assert(theniaLineStops.has("rouiba")&&!theniaLineStops.has("zeralda"),"Line filter narrows stations by actual trip stops");
const affrounStops=network.eligibleStationIds("","affroun-alger",lines,routes,trips);
assert.equal(affrounStops.size,16);
const unknown=network.routeStopSummary(routeById.get("alger-bejaia"),trips);
assert.equal(unknown.train_count,0);
assert.equal(unknown.known_stops.length,0,"No guessed intermediate stops for national timetables pending transcription");
assert(network.eligibleStationIds("alger-bejaia","",lines,routes,trips).has("lakhdaria"),"The line includes the newly transcribed Agha–Béjaïa stops");
const html=readFileSync("sectors/sntf-trains.html","utf8"),app=readFileSync("assets/js/sntf-trains/app.js","utf8");
for(const id of ['id="category-filter"','id="route-filter"','id="category-schedules"','id="station-services"','id="route-catalog"'])assert(html.includes(id),"Missing category, route or stop interface: "+id);
assert(!html.includes('id="line-filter"'),"Old geographic-line dropdown must be replaced by category filter");
for(const category of network.railwayCategories){
 assert(html.includes('<option value="'+category.id+'">'+category.label+'</option>'),"Category selector label must match official timetable sections: "+category.id);
 assert(category.anchor,"Every category links to an SNTF gallery section");
}
const categoryCounts={suburban:19,eastern:18,western:10,sahara:11,international:3};
for(const [category,count] of Object.entries(categoryCounts)){
 assert.equal(network.categoryRoutes(category,routes).length,count,"Only actual directions of the chosen category are available: "+category);
 assert(network.categoryRoutes(category,routes).every(r=>r.category===category&&!r.alias_of));
}
assert.equal(network.categoryRoutes("",routes).length,61,"All 36 canonical route choices are available across categories");
assert.equal(network.eligibleStationIdsByCategory("","",lines,routes,trips),null,"All 177 registered stations remain selectable without a category");
const easternStops=network.eligibleStationIdsByCategory("eastern","",lines,routes,trips);
assert(easternStops.has("alger")&&easternStops.has("bejaia")&&!easternStops.has("zeralda"),"Eastern type shows only documented endpoints until intermediate stop transcription");
const suburbanStops=network.eligibleStationIdsByCategory("suburban","",lines,routes,trips);
assert(suburbanStops.has("el_affroun")&&suburbanStops.has("zeralda")&&!suburbanStops.has("tunis"),"Suburban type includes both directions while excluding international stations");
assert.equal(network.eligibleStationIdsByCategory("suburban","affroun-alger",lines,routes,trips).size,16,"Filtered reverse Affroun route has precisely 16 published stops");
assert.equal(network.eligibleStationIdsByCategory("western","affroun-alger",lines,routes,trips).size,0,"Mismatched type and route never leak stops");
assert(app.includes('get("lines","lines")')&&app.includes("eligibleStationIdsByCategory")&&app.includes('$("category-filter")'),"Live frontend must use category-aware route and station selectors");
assert(app.includes("routeStopSummary")&&app.includes("stationLineServices"),"The catalog and station board continue to use canonical published stop data");
console.log("SNTF network tests PASS: 22 lines, 61 canonical routes, 198 documented trips, 196 stations, 16 Affroun reverse stops, true published station service coverage, and no alias duplication.");
