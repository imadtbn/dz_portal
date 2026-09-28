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
 constructor(id){this.id=id;this.listeners={};this.value="";this.checked=false;this.children=[];this.disabled=false;this.hidden=false;this.innerHTML="";this.textContent="";this.label="";this.dataset={};}
 addEventListener(event,callback){this.listeners[event]=callback}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children;this.value=children[0]?.value||""}
 setAttribute(){}
 scrollIntoView(){}
 focus(){}
 remove(){}
}
class FakeOption{constructor(label,value){this.label=label;this.value=value??""}}
const example="https://example.invalid/dz_portal/sectors/sntf-trains.html";
async function boot(path=""){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id)};
 const document={getElementById:get,querySelectorAll:()=>[],createElement:tag=>new FakeElement(tag)};
 const map={setView(){return this},fitBounds(){return this},getZoom(){return 6}};
 const window={matchMedia:()=>({matches:false,addEventListener(){}}),L:{
  map:()=>map,tileLayer:()=>({addTo(){}}),
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
 return {state,get,selectCategory(value){get("category-filter").listeners.change({target:{value}})},selectRoute(value){get("route-filter").listeners.change({target:{value}})},
  optionCount:()=>get("route-filter").children.slice(1).reduce((sum,group)=>sum+group.children.length,0)};
}
const page=await boot("?station=zeralda");
assert.equal(page.state.selected,"zeralda");
assert.equal(page.state.category,"");
assert.equal(page.get("route-filter").disabled,true,"Route selector waits for railway category");
assert.equal(page.get("station").children.length-1,196,"All 177 stations remain accessible before filtering");
const totals={suburban:22,eastern:18,western:12,sahara:11,international:3};
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
page.selectRoute("alger-bejaia");
assert.equal(page.state.category,"eastern");
assert.equal(page.state.route,"alger-bejaia");
assert.equal(page.get("station").children.length-1,2,"No invented intermediate stations for a schedule pending transcription");
page.selectCategory("international");
page.selectRoute("annaba-tunis");
assert.equal(page.state.route,"annaba-tunis");
assert.equal(page.get("station").children.length-1,2,"Both international termini remain selectable with partial timetable times");
assert(page.get("route-catalog").innerHTML.includes("الأحد، الثلاثاء، الخميس"),"International outbound days visible in its route heading");
page.selectCategory("western");
assert.equal(page.state.route,"");
assert.equal(page.optionCount(),12);
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
assert.equal(page.get("category-schedules").hidden,true);
const linked=await boot("?route=affroun-alger&station=el_affroun");
assert.equal(linked.state.category,"suburban","Direct links infer their railway category");
assert.equal(linked.state.route,"affroun-alger");
assert.equal(linked.state.selected,"el_affroun");
const old=await boot("?line=alger-bejaia");
assert.equal(old.state.category,"eastern","Legacy named-line deep links map to the new category");
assert.equal(old.state.route,"","Grouped east line legacy links retain its category without guessing one direction");
const alias=await boot("?route=zeralda-alger");
assert.equal(alias.state.route,"zeralda-agha","Legacy route aliases resolve to a single canonical direction");
assert.equal(alias.state.category,"suburban");
console.log("SNTF category UI PASS: five types, dependent grouped routes, gallery anchors, genuine station filters, reset and deep-link compatibility.");
