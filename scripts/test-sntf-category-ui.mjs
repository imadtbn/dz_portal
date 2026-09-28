import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const loadJSON=name=>JSON.parse(readFileSync("assets/data/sntf/"+name+".json","utf8"));
const loadModule=async path=>import("data:text/javascript;base64,"+Buffer.from(readFileSync(path,"utf8")).toString("base64"));
const engine=await loadModule("assets/js/sntf-trains/engine.js");
const network=await loadModule("assets/js/sntf-trains/network.js");
const plannerSource=readFileSync("assets/js/sntf-trains/planner.js","utf8").replace(/^import [^\n]+\n/gm,"").replace(/^export /gm,"");
const {planJourney}=new Function("mins","runsOn","shiftISO",plannerSource+"\nreturn {planJourney};")(engine.mins,engine.runsOn,engine.shiftISO);
const engineNames=["dayParts","dayISO","recordsAtStation","eligible","formatTime","countdown","classify","mins"];
const networkNames=["railwayCategories","categoryRoutes","canonicalRouteId","routeTrips","routeStopSummary","lineRoutes","lineSummary","stationLineServices","eligibleStationIdsByCategory"];
const src=readFileSync("assets/js/sntf-trains/app.js","utf8")
 .replace(/^import [^\n]+\n/gm,"")
 .replaceAll("import.meta.url",'"https://example.invalid/assets/js/sntf-trains/app.js"')
 .replace('boardTab("departures");tick();setInterval(tick,1000);start();','boardTab("departures");tick();return start().then(()=>state);');
assert(src.includes("return start().then(()=>state)"),"The UI test must await application initialization");
const run=new Function("document","window","location","URL","fetch","Option","setInterval","console","Intl","planJourney",...engineNames,...networkNames,src);
class FakeElement{
 constructor(id){this.id=id;this.listeners={};this.attributes={};this.value="";this.checked=false;this.children=[];this.disabled=false;this.hidden=false;this.innerHTML="";this.textContent="";this.label="";this.dataset={};}
 addEventListener(event,callback){this.listeners[event]=callback}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children;this.value=children[0]?.value||""}
 setAttribute(key,value){this.attributes[key]=value}
 scrollIntoView(){}
 focus(){}
 remove(){}
}
class FakeOption{constructor(label,value){this.label=label;this.value=value??""}}
const example="https://example.invalid/dz_portal/sectors/sntf-trains.html";
async function boot(path=""){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id)};
 const document={getElementById:get,querySelectorAll:()=>[],createElement:tag=>new FakeElement(tag)};
 let mapsCreated=0;
 const map={setView(){return this},fitBounds(){return this},getZoom(){return 6},invalidateSize(){return this}};
 const window={matchMedia:()=>({matches:false,addEventListener(){}}),L:{
  map:()=>{mapsCreated++;return map},tileLayer:()=>({addTo(){}}),
  circleMarker:()=>({addTo(){return this},bindPopup(){return this},on(){return this},remove(){}})
 }};
 const target=new URL(example+path),location={href:target.href,hash:target.hash};
 const fetch=async url=>{
  const filename=new URL(String(url)).pathname.split("/").at(-1);
  assert(["stations.json","routes.json","lines.json","trips.json","calendars.json","sources.json","holidays.json"].includes(filename),"Unexpected remote request "+filename);
  return {ok:true,json:async()=>loadJSON(filename.slice(0,-5))};
 };
 const errors=[];
 const state=await run(document,window,location,URL,fetch,FakeOption,()=>{},
  {warn:(...parts)=>errors.push(parts.join(" ")),error:(...parts)=>errors.push(parts.join(" "))},Intl,
  planJourney,...engineNames.map(k=>engine[k]),...networkNames.map(k=>network[k]));
 assert.deepEqual(errors,[],"The app must start and filter without JavaScript errors");
 return {state,get,mapsCreated:()=>mapsCreated,task(id){get('task-'+id).listeners.click()},selectCategory(value){get("category-filter").listeners.change({target:{value}})},selectRoute(value){get("route-filter").listeners.change({target:{value}})},
  optionCount:()=>get("route-filter").children.slice(1).reduce((sum,group)=>sum+group.children.length,0)};
}
const page=await boot("?station=zeralda");
assert.equal(page.state.selected,"zeralda");
assert.equal(page.state.activeTask,"station","Station links open the station task");
assert.equal(page.mapsCreated(),0,"Station task does not download or create the map");
page.task("search");
assert.equal(page.get("panel-station").hidden,true);
assert.equal(page.get("task-search").attributes["aria-selected"],"true");
page.task("explore");
assert.equal(page.mapsCreated(),1,"Map initializes when exploring the network");
assert.equal(page.get("panel-explore").hidden,false);
assert.equal(page.state.category,"");
assert.equal(page.get("route-filter").disabled,true,"Route selector waits for railway category");
assert.equal(page.get("station").children.length-1,196,"All 177 stations remain accessible before filtering");
const totals={suburban:22,eastern:16,western:10,sahara:10,international:2};
for(const cat of network.railwayCategories){
 page.selectCategory(cat.id);
 assert.equal(page.state.category,cat.id);
 assert.equal(page.state.route,"","Changing railway type clears the previous route");
 assert.equal(page.optionCount(),totals[cat.id],"Only routes from the chosen type should be offered");
 assert.equal(page.get("route-filter").disabled,false);
 assert.equal(page.get("category-schedules").href,"sntf.html#"+cat.anchor,"Category gallery anchor must match the official reference section");
 assert(!page.get("category-schedules").hidden);
 assert(!page.get("route-catalog").innerHTML.includes('data-route="affroun-alger"')||cat.id==="suburban","Unrelated category cannot show Affroun route");
}
page.selectCategory("eastern");
page.selectRoute("agha-bejaia");
assert.equal(page.state.category,"eastern");
assert.equal(page.state.route,"agha-bejaia");
assert.equal(page.get("station").children.length-1,16,"Documented intermediate stops for the actual Agha–Bejaia departure are available");
page.selectRoute("alger-bejaia");
assert.equal(page.state.route,"","Old gallery placeholder cannot hide the published directional timetables");
page.selectCategory("international");
page.selectRoute("annaba-tunis");
assert.equal(page.state.route,"annaba-tunis");
assert.equal(page.get("station").children.length-1,2,"Both international termini remain selectable with partial timetable times");
assert(page.get("route-catalog").innerHTML.includes("الأحد، الثلاثاء، الخميس"),"International outbound days visible in its route heading");
page.selectCategory("western");
assert.equal(page.state.route,"");
assert.equal(page.optionCount(),10);
page.selectCategory("suburban");
page.selectRoute("affroun-alger");
assert.equal(page.state.route,"affroun-alger");
assert.equal(page.get("station").children.length-1,16,"The reverse Affroun route has 16 real stopping stations");
assert(page.get("route-catalog").innerHTML.includes("19 رحلة منقولة"),"The route card has 19 published services, not the grouped two-way total");
page.selectCategory("");
assert.equal(page.get("route-filter").disabled,true);
assert.equal(page.get("station").children.length-1,196);
assert(page.get("journey-from").children.length>150,"Planner offers stations with documented stops");
page.get("journey-from").value="thenia";
page.get("journey-to").value="el_affroun";
page.get("journey-date").value="2026-09-29";
page.get("journey-after").value="08:00";
page.get("journey-form").listeners.submit({preventDefault(){}});
assert(page.get("journey-results").innerHTML.includes("B124/125"),"Search displays an actual direct train and its station timeline");
assert(page.get("journey-results").innerHTML.includes('sntf-trip.html?trip='),"Journey results link to the full published trip page");
assert(page.get("journey-results").innerHTML.includes('class="journey-extra"'),"Stop details and reminders remain available in collapsed results");
assert(page.state.journeyResults.direct.length>0);
page.state.journeyResults.direct=Array(8).fill(page.state.journeyResults.direct[0]);
page.get("journey-results").listeners.click({target:{closest:selector=>selector==='[data-more-journeys]'?{dataset:{moreJourneys:'direct'}}:null}});
assert.equal(page.state.journeyLimit.direct,8,"The show-more control reveals additional journeys on demand");
assert.equal((page.get("journey-results").innerHTML.match(/class="journey-card"/g)||[]).length,8+Math.min(3,page.state.journeyResults.connections.length));
assert(page.get("departures").innerHTML.includes('sntf-trip.html?trip='),"Station departure cards link to the trip page");
assert.equal(page.get("category-schedules").hidden,true);
const linked=await boot("?route=affroun-alger&station=el_affroun");
assert.equal(linked.state.category,"suburban","Direct links infer their railway category");
assert.equal(linked.state.route,"affroun-alger");
assert.equal(linked.state.selected,"el_affroun");
assert.equal(linked.state.activeTask,"station");
const old=await boot("?line=alger-bejaia");
assert.equal(old.state.category,"eastern","Legacy named-line deep links map to the new category");
assert.equal(old.state.activeTask,"explore");
assert.equal(old.state.route,"","Grouped east line legacy links retain its category without guessing one direction");
const alias=await boot("?route=zeralda-alger");
assert.equal(alias.state.route,"zeralda-agha","Legacy route aliases resolve to a single canonical direction");
assert.equal(alias.state.category,"suburban");
const home=await boot();
assert.equal(home.state.activeTask,"search");
assert.equal(home.mapsCreated(),0,"Default search avoids initializing the map");
assert.equal(home.get("route-catalog").innerHTML,"","Catalog waits for the explore task");
const searchLink=await boot("?station=zeralda#panel-search");
assert.equal(searchLink.state.activeTask,"search","Explicit task hash takes precedence over a station link");
assert.equal(searchLink.mapsCreated(),0);
console.log("SNTF category UI PASS: five types, dependent grouped routes, gallery anchors, genuine station filters, reset and deep-link compatibility.");
