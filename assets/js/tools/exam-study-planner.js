(() => {
'use strict';
const $=id=>document.getElementById(id), KEY='tools_dz_exam_study_planner_v1';
const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
const iso=d=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmtDate=s=>new Intl.DateTimeFormat('ar-DZ',{weekday:'long',day:'numeric',month:'long'}).format(parse(s));
const uid=()=>Math.random().toString(36).slice(2,10);
let subjects=[],tasks=[],planMeta={};
const defaults=['الرياضيات','اللغة العربية','اللغة الفرنسية','اللغة الإنجليزية','العلوم الطبيعية','العلوم الفيزيائية','التاريخ والجغرافيا','التربية الإسلامية'];
function addSubject(name='',level='medium',weight=2){subjects.push({id:uid(),name,level,weight});renderSubjects()}
function renderSubjects(){
$('subjects-list').replaceChildren(...subjects.map(s=>{const tr=document.createElement('tr');
const name=document.createElement('td'),level=document.createElement('td'),weight=document.createElement('td'),remove=document.createElement('td');
const input=document.createElement('input');input.className='subject-name';input.value=s.name;input.placeholder='اسم المادة';input.maxLength=45;input.addEventListener('input',()=>{s.name=input.value;});
const sel=document.createElement('select');sel.className='subject-level';[['easy','سهلة'],['medium','متوسطة'],['hard','صعبة']].forEach(([v,t])=>{const o=new Option(t,v);o.selected=s.level===v;sel.add(o)});sel.addEventListener('change',()=>s.level=sel.value);
const w=document.createElement('select');w.className='subject-weight';[['1','عادية'],['2','مهمة'],['3','أولوية عالية']].forEach(([v,t])=>{const o=new Option(t,v);o.selected=String(s.weight)===v;w.add(o)});w.addEventListener('change',()=>s.weight=Number(w.value));
const b=document.createElement('button');b.type='button';b.className='remove-subject';b.textContent='حذف';b.setAttribute('aria-label','حذف المادة '+s.name);b.addEventListener('click',()=>{subjects=subjects.filter(x=>x.id!==s.id);renderSubjects()});
name.append(input);level.append(sel);weight.append(w);remove.append(b);tr.append(name,level,weight,remove);return tr;}));
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({subjects,tasks,planMeta,settings:{type:$('exam-type').value,date:$('exam-date').value,hours:$('daily-hours').value,length:$('session-length').value}}));$('setup-message').textContent='تم حفظ الخطة على هذا الجهاز.'}catch(e){$('setup-message').textContent='تعذر الحفظ في المتصفح؛ صدّر نسخة JSON للاحتفاظ ببياناتك.'}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(!d)return false;subjects=Array.isArray(d.subjects)?d.subjects:[];tasks=Array.isArray(d.tasks)?d.tasks:[];planMeta=d.planMeta||{};if(d.settings){$('exam-type').value=d.settings.type||'bac';$('exam-date').value=d.settings.date||'';$('daily-hours').value=d.settings.hours||4;$('session-length').value=d.settings.length||60}return true}catch(e){return false}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function distribute(fromDate,keepDone=true){
const date=$('exam-date').value,hours=Number($('daily-hours').value),mins=Number($('session-length').value);
if(!date||!Number.isFinite(hours)||hours<1||hours>12){$('setup-message').textContent='حدد تاريخ الامتحان وأدخل عدد ساعات يومي بين 1 و12.';return}
const start=fromDate||today(),end=parse(date),days=Math.floor((end-start)/86400000);
const valid=subjects.filter(s=>s.name.trim());if(!valid.length){$('setup-message').textContent='أضف مادة واحدة على الأقل.';return}
if(days<0){$('setup-message').textContent='تاريخ الامتحان يجب أن يكون اليوم أو بعده.';return}
const oldDone=keepDone?new Set(tasks.filter(t=>t.done).map(t=>t.id)):new Set();
const dailySlots=Math.max(1,Math.floor(hours*60/mins));
const totalDays=days+1,weighted=valid.map(s=>({...s,score:(s.level==='hard'?3:s.level==='medium'?2:1)*Number(s.weight||1)}));
const sessions=[],credit=Object.fromEntries(weighted.map(s=>[s.id,0]));
for(let di=0;di<totalDays;di++){
const day=new Date(start);day.setDate(day.getDate()+di);
for(let slot=0;slot<dailySlots;slot++){
weighted.forEach(s=>credit[s.id]+=s.score);
const subject=weighted.reduce((best,s)=>credit[s.id]>credit[best.id]?s:best,weighted[0]);
credit[subject.id]-=weighted.reduce((sum,s)=>sum+s.score,0);
const duration=Math.min(mins,Math.round(hours*60/dailySlots));
sessions.push({id:uid(),date:iso(day),subjectId:subject.id,subject:subject.name,minutes:duration,kind:slot%3===0?'مراجعة الدرس':slot%3===1?'حل تمارين':'استرجاع واختبار قصير',done:false});
}
}
tasks=sessions.map(t=>{if(oldDone.has(t.id))t.done=true;return t});
planMeta={generatedAt:new Date().toISOString(),examDate:date,startDate:iso(start),hours,sessionLength:mins};renderPlan();save();
$('setup-message').textContent='تم إنشاء البرنامج اليومي. يمكنك تعديل المواد والصعوبة ثم إعادة إنشاء الخطة.';
}
function renderPlan(){
const out=$('plan-output');if(!tasks.length){out.innerHTML='<div class="study-empty">لا توجد خطة بعد. اضغط إنشاء خطة المراجعة.</div>';updateStats();return}
const groups={};tasks.forEach(t=>(groups[t.date]??=[]).push(t));
out.replaceChildren();Object.keys(groups).sort().forEach(day=>{
const section=document.createElement('section');section.className='plan-day';
const head=document.createElement('div');head.className='plan-day-head';const title=document.createElement('strong');title.textContent=fmtDate(day);const count=document.createElement('span');const dayTasks=groups[day];count.textContent=dayTasks.filter(t=>t.done).length+' / '+dayTasks.length+' حصص منجزة';head.append(title,count);
const list=document.createElement('div');list.className='plan-tasks';
dayTasks.forEach(t=>{const row=document.createElement('div');row.className='plan-task'+(t.done?' done':'');const check=document.createElement('input');check.type='checkbox';check.checked=!!t.done;check.id='task-'+t.id;check.addEventListener('change',()=>{t.done=check.checked;renderPlan();save()});const label=document.createElement('label');label.htmlFor=check.id;const strong=document.createElement('span');strong.className='task-subject';strong.textContent=t.subject;const meta=document.createElement('span');meta.className='task-meta';meta.textContent=t.kind+' • '+t.minutes+' دقيقة';label.append(strong,meta);row.append(check,label);list.append(row)});
section.append(head,list);out.append(section);
});
$('plan-period').textContent=tasks.length+' حصة موزعة';
updateStats();
}
function updateStats(){const total=tasks.length,done=tasks.filter(t=>t.done).length,pct=total?Math.round(done/total*100):0;$('total-count').textContent=total;$('done-count').textContent=done;$('left-count').textContent=total-done;$('progress-label').textContent=pct+'%';$('progress-bar').style.width=pct+'%';const date=$('exam-date').value;$('days-left').textContent=date?Math.max(0,Math.ceil((parse(date)-today())/86400000)):'—'}
function redistribute(){if(!tasks.length){distribute(today(),false);return}const pending=tasks.filter(t=>!t.done);if(!pending.length){$('setup-message').textContent='كل الحصص منجزة؛ لا توجد مهام متأخرة لإعادة توزيعها.';return}
const now=today(),exam=parse($('exam-date').value);const futureDays=Math.max(1,Math.floor((exam-now)/86400000)+1);const slots=Math.max(1,Math.floor(Number($('daily-hours').value)*60/Number($('session-length').value)));const capacity=futureDays*slots;
const keep=tasks.filter(t=>t.done);const pendingPool=pending.slice();const next=[];
for(let d=0;d<futureDays&&pendingPool.length;d++){const date=new Date(now);date.setDate(date.getDate()+d);for(let j=0;j<slots&&pendingPool.length;j++){const t=pendingPool.shift();next.push({...t,date:iso(date),id:uid()})}}
tasks=[...keep,...next];renderPlan();save();$('setup-message').textContent=pendingPool.length?'أعيد توزيع ما أمكن؛ عدد المهام التي تجاوزت السعة المتاحة: '+pendingPool.length:'تمت إعادة توزيع الحصص غير المنجزة على الأيام المتبقية.'}
function exportJSON(){const blob=new Blob([JSON.stringify({subjects,tasks,planMeta,settings:{type:$('exam-type').value,date:$('exam-date').value,hours:$('daily-hours').value,length:$('session-length').value}},null,2)],{type:'application/json'});download(blob,'exam-study-plan.json')}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('add-subject').addEventListener('click',()=>addSubject());$('generate-plan').addEventListener('click',()=>distribute(today(),false));$('save-plan').addEventListener('click',save);$('redistribute-plan').addEventListener('click',redistribute);$('print-plan').addEventListener('click',()=>window.print());$('export-plan').addEventListener('click',exportJSON);
$('exam-date').min=iso(today());$('exam-date').value=iso(new Date(today().getFullYear(),today().getMonth()+2,today().getDate()));
if(!load()){defaults.forEach((n,i)=>addSubject(n,i===0?'hard':i===1?'medium':'medium',i<2?3:2))}renderSubjects();renderPlan();
})();