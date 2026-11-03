// Offline SNTF import safeguards. This file NEVER changes previously checked coordinates.
export const lockGeo = station => ({
  lat: station.lat ?? null,
  lon: station.lon ?? null,
  geo_verified: station.geo_verified === true,
  geo_source: station.geo_source ?? null,
  geo_review_needed: station.geo_review_needed ?? null,
  geo_conflict_candidates: station.geo_conflict_candidates ?? null
});
export const stationKey = value => String(value??"")
  .normalize("NFKD").replace(/\p{M}/gu,"").toLocaleLowerCase("fr")
  .replace(/[ءأإآ]/gu,"ا").replace(/ة/gu,"ه")
  .replace(/[\u2019']/gu," ").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
export function matchStation(text, stations) {
  const key=stationKey(text);
  if(!key)return {status:"invalid",name:text,candidates:[]};
  const matches=stations.filter(s=>[
    s.name,s.name_fr,...(s.aliases||[]),...(s.sntf_names||[])
  ].some(n=>stationKey(n)===key));
  if(matches.length===1)return {status:"matched",name:text,station_id:matches[0].id};
  if(matches.length>1)return {status:"ambiguous",name:text,candidates:matches.map(m=>m.id)};
  return {status:"new_candidate",name:text,candidates:[]};
}
export function buildReview(snapshots,stations,routes) {
  const uniqueNames=[...new Set(snapshots.query_snapshots.flatMap(q=>[q.origin_name,q.destination_name]))];
  const names=uniqueNames.map(name=>matchStation(name,stations));
  const byName=new Map(names.map(m=>[m.name,m]));
  const queries=snapshots.query_snapshots.map(q=>{
    const origin=byName.get(q.origin_name),destination=byName.get(q.destination_name);
    const matching=origin.status==="matched"&&destination.status==="matched"
      ?routes.filter(r=>r.from===origin.station_id&&r.to===destination.station_id).map(r=>r.id):[];
    return {
      snapshot_id:q.snapshot_id,query_date:q.query_date,source_url:q.source_url,
      status:"historical_recheck_required",origin,destination,
      candidate_route_ids:matching,
      route_action:matching.length?"review_existing":"propose_new_route",
      intermediate_stops_known:q.intermediate_stops_known===true,
      trips:q.services.map(s=>({
        train_number:s.train_number,departure:s.departure,arrival:s.arrival,
        service_rule:s.service_rule,weekdays:s.weekdays??null,
        approval_status:"pending_official_recheck",
        // Never produce a live trip with missing intermediate stop data.
        incomplete_stop_times:true
      }))
    };
  });
  return {
    version:1,generated_from:snapshots.compiled_on,
    important:"HISTORICAL QUERY SNAPSHOTS ONLY: these are NOT currently verified train times.",
    station_candidates:names,queries,
    summary:{
      station_names:names.length,
      matched_station_names:names.filter(n=>n.status==="matched").length,
      new_station_names:names.filter(n=>n.status==="new_candidate").length,
      ambiguous_station_names:names.filter(n=>n.status==="ambiguous").length,
      source_queries:queries.length,
      archived_trip_candidates:queries.reduce((n,q)=>n+q.trips.length,0),
      existing_verified_coordinates_preserved:stations.filter(s=>s.geo_verified===true).length
    }
  };
}
// Decisions are explicit manual edits; source data cannot request geocoding or rewrite a verified pin.
export function mergeApprovedStations(existing,decisions){
  if(!Array.isArray(decisions))throw new TypeError("decisions must be an array");
  const stations=existing.map(s=>structuredClone(s));
  const before=new Map(existing.map(s=>[s.id,JSON.stringify(lockGeo(s))]));
  const audit=[];
  for(const d of decisions){
    if(d.approved!==true||!d.reviewed_by||!d.reviewed_at)
      throw new Error("Explicit review, approver and date are required: "+(d.input_name||"?"));
    if(!d.input_name||!["link_alias","add_station"].includes(d.action))
      throw new Error("Invalid approved station action");
    // Input coordinates are deliberately ignored even when provided.
    if(d.action==="link_alias"){
      const target=stations.find(s=>s.id===d.station_id);
      if(!target)throw new Error("Unknown station ID "+d.station_id);
      const choices=matchStation(d.input_name,stations);
      if(choices.status==="matched"&&choices.station_id!==target.id)
        throw new Error("Station name would alias another station: "+d.input_name);
      target.sntf_names=[...new Set([...(target.sntf_names||[]),d.input_name])];
      audit.push({action:"link_alias",input_name:d.input_name,station_id:target.id,geo_changed:false});
    }else{
      if(!/^[a-z0-9][a-z0-9_-]{1,75}$/.test(d.station_id||"")||stations.some(s=>s.id===d.station_id))
        throw new Error("New station ID missing or already used: "+d.station_id);
      if(matchStation(d.input_name,stations).status!=="new_candidate")
        throw new Error("New station name already exists or is ambiguous: "+d.input_name);
      if(typeof d.name!=="string"||!d.name.trim()||typeof d.name_fr!=="string"||!d.name_fr.trim())
        throw new Error("Provide Arabic and French station labels: "+d.input_name);
      stations.push({id:d.station_id,name:d.name.trim(),name_fr:d.name_fr.trim(),
        sntf_names:[d.input_name],lat:null,lon:null,geo_verified:false,
        geo_source:null,editor_note:"SNTF name manually reviewed; coordinates need separate Google Maps verification."});
      audit.push({action:"add_station",input_name:d.input_name,station_id:d.station_id,geo_changed:false});
    }
  }
  for(const s of existing){
    const merged=stations.find(x=>x.id===s.id);
    if(JSON.stringify(lockGeo(merged))!==before.get(s.id))
      throw new Error("Protected Google Maps coordinates changed for "+s.id);
  }
  if(new Set(stations.map(s=>s.id)).size!==stations.length)throw new Error("Duplicate station IDs");
  return {stations,audit};
}
