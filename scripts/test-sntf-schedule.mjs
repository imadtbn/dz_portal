import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const module=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('assets/js/sntf-schedules/catalog.js')).toString('base64'));
const {schedules,findSchedule}=module,html=readFileSync('sectors/sntf-schedule.html','utf8'),gallery=readFileSync('sectors/sntf.html','utf8');
assert.equal(new Set(schedules.map(s=>s.id)).size,schedules.length,'Schedule IDs are unique');
assert.equal(findSchedule('alger-thenia').image,'../assets/train-schedules/suburban/alger-thenia.png');
assert.equal(findSchedule('alger-thenia-suburban'),findSchedule('alger-thenia'),'Old gallery IDs resolve to the canonical schedule');
for(const id of ['',null,'../evil.png','https://example.com/image.png'])assert.equal(findSchedule(id),undefined,'Unknown IDs cannot choose a free image path');
for(const s of schedules){
 assert(existsSync(s.image.replace('../','')),'Registered image exists: '+s.id);
 assert(existsSync(s.hero.replace('../','')),'Hero image exists: '+s.id);
 assert(s.id==='agha-batna'||gallery.includes('sntf-schedule.html?schedule='+s.id),'Every timetable card points to its viewer: '+s.id);
 assert(gallery.includes('id="'+s.anchor+'"'),'Category breadcrumb resolves to an existing section');
}
assert.equal(html.match(/class="adsbygoogle"/g).length,1,'Only one ad slot');
assert(html.indexOf('class="schedule-ad"')>html.indexOf('id="schedule-viewer"'),'Ad comes after the viewer');
assert(html.includes('loading="eager"'),'Primary timetable loads eagerly');
const header=s=>s.match(/<header class="header">[\s\S]*?<\/header>/)[0];assert.equal(header(html),header(gallery),'Existing header remains identical');
assert(!readFileSync('assets/css/sntf-schedule.css','utf8').includes('object-fit:cover'),'Timetable must not be cropped');
console.log('Schedule catalog PASS: '+schedules.length+' images, safe IDs, native gallery links, same header and one ad after viewer.');

assert.equal(module.schedulePageForImage('../assets/train-schedules/suburban/alger-thenia.png'),'sntf-schedule.html?schedule=alger-thenia');
assert.equal(module.schedulePageForImage('https://imadtbn.github.io/dz_portal/assets/train-schedules/Eastern/abttbb%20to%20agha.png'),'sntf-schedule.html?schedule=abttbb-to-agha');
assert.equal(module.schedulePageForImage('../assets/train-schedules/Eastern/agha-batna.png'),'sntf-schedule.html?schedule=agha-batna');
assert.equal(module.schedulePageForImage('https://evil.example/assets/train-schedules/suburban/alger-thenia.png'),'');
assert.equal(module.schedulePageForImage('../assets/train-schedules/missing.png'),'');
