# DZ Rail — local railway data

The page is `sectors/sntf-trains.html`. It links from `sectors/sntf.html`.
This initial delivery indexes 25 named stations and 25 railway gallery entries from the existing DZ Portal SNTF page. These are a *catalogue*, not independently confirmed currently operating services. Digital trips, timetables, station coordinates and calendars are intentionally empty until their source and validity are independently verified. Do not derive times from a route name.

## Publishing a validated timetable

1. Verify the current SNTF document (official website, ticket office or dated publication). Save the authoritative URL or stable reference, document date, effective dates and checked date in `sources.json`.
2. Add every verified station to `stations.json`; use null coordinates until a credible geographic source is logged in `geo_source`, then set `geo_verified: true`.
3. Define line orientation in `routes.json` and applicable operating days in `calendars.json`. Put official exceptions in `exceptions` with `service_id`, `date` and `type` (`added` or `removed`).
4. Only then insert a trip in `trips.json` with `trip_id`, `route_id`, `service_id`, `train_number` (or null), `source_id` and ordered `stop_times` (`station_id`, `arrival`, `departure`, `sequence`). Use GTFS-like 24+ hour times for next-day arrivals. Existing JS supports 00:00 to 47:59.
5. Run `node scripts/validate-sntf-data.mjs`. Check results against the source manually and publish together.

## Design and limitations

- Hosting is static GitHub Pages; no paid API or server is required.
- Search runs locally against documented direct trips. Gallery cards appear as a fallback when current timetable data is absent.
- Clock uses `Africa/Algiers` regardless of visitor timezone. Times are scheduled, never claimed live.
- Map loads Leaflet on demand and displays only stations with verified geographic coordinates. Nearest distances are great-circle distances, not travel distance.
- Location is requested only after a click and is never persisted. Map tiles require internet and provider attribution.
- New standalone CSS/JS avoid modifying legacy `sector-sntf.js`, gallery styles or advertising infrastructure.
- Do not claim all national trains have been populated: the system is nationally extensible; coverage is tied to sourced data.
