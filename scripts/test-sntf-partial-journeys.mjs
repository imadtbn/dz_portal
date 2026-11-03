import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Reuse the dashboard's mock-DOM boot without running unrelated catalog fixtures.
const harness=readFileSync('scripts/test-sntf-category-ui.mjs','utf8').split("\nfor(const path of")[0];
const {boot}=await import('data:text/javascript;base64,'+Buffer.from(harness+'\nexport {boot};').toString('base64'));

// Departure-only announcements remain searchable without fabricated arrival times.
for(const [from,to,id] of [
 ['oran','chlef','sntf-oran-chlef-1600-20260921'],
 ['chlef','oran','sntf-chlef-oran-0545-20260921'],
 ['telagh','oran','sntf-telagh-oran-0709'],
 ['oran','telagh','sntf-oran-telagh-1520'],
 ['telagh','saida','sntf-telagh-saida-frenda-1717'],
 ['telagh','frenda','sntf-telagh-saida-frenda-1717']
]){
 const partial=await boot(`?from=${from}&to=${to}`);
 assert.equal(partial.get('journey-from').value,from);
 assert.equal(partial.get('journey-to').value,to,'An untimed destination is selectable');
 partial.get('journey-date').value='2026-10-09';partial.get('journey-after').value='00:00';
 partial.get('journey-form').listeners.submit({preventDefault(){}});
 assert(partial.state.journeyResults.direct.some(leg=>leg.trip.trip_id===id&&leg.arrival===null));
 const html=partial.get('journey-results').innerHTML;
 assert(html.includes('وقت الوصول غير منشور')&&html.includes('المدة غير منشورة'));
 assert(html.includes('يحتاج')||html.includes('تحتاج'),'Unconfirmed operating days stay visible');
 assert(!html.includes('1970')&&!html.includes('NaN'),'No fabricated timestamps or durations');
}
console.log('Departure-only journey UI PASS: six directions, untimed destinations and source notices.');
