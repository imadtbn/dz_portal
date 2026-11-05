(() => {
'use strict';
const $=id=>document.getElementById(id);
const STORAGE='tools-dz-admin-procedures-progress-v1';
const DATA_URL='../data/procedures/admin-procedures.json';
let procedures=[],selectedId=null,progress={};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadProgress(){try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
function saveProgress(){try{localStorage.setItem(STORAGE,JSON.stringify(progress));}catch{}}
function current(){return procedures.find(p=>p.id===selectedId)}
function keyFor(p,itemId){return p.id+':'+itemId}
function getChecked(p,itemId){return !!progress[keyFor(p,itemId)]}
function filterList(){
 const q=$('apa-search').value.trim().toLocaleLowerCase();
 const category=$('apa-category').value;
 return procedures.filter(p=>(category==='all'||p.category===category)&&[p.title,p.summary,p.authority,p.categoryLabel,p.audience.join(' ')].join(' ').toLocaleLowerCase().includes(q));
}
function renderList(){
 const list=filterList();
 if(!list.some(p=>p.id===selectedId)) selectedId=list[0]?.id||null;
 $('apa-results-count').textContent='عدد الإجراءات: '+list.length;
 $('apa-procedure-list').innerHTML=list.length?list.map(p=>'<button type="button" class="apa-choice" data-procedure-id="'+esc(p.id)+'" aria-pressed="'+(p.id===selectedId)+'"><strong>'+esc(p.title)+'</strong><small>'+esc(p.categoryLabel)+'</small></button>').join(''):'<p class="apa-empty">لم نعثر على إجراء مطابق. جرّب كلمة بحث أخرى.</p>';
}
function renderDetail(){
 const p=current(),root=$('apa-detail-content');
 if(!p){root.innerHTML='<p class="apa-empty">اختر إجراءً من القائمة لعرض الوثائق والخطوات.</p>';return}
 const checked=p.documents.filter(d=>getChecked(p,d.id)).length;
 const docs=p.documents.map(d=>'<label class="apa-check-item"><input type="checkbox" data-check-id="'+esc(d.id)+'" '+(getChecked(p,d.id)?'checked':'')+'><span>'+esc(d.text)+'</span></label>').join('');
 const steps=p.steps.map(s=>'<li>'+esc(s)+'</li>').join('');
 const notes=p.notes.map(n=>'<li>'+esc(n)+'</li>').join('');
 root.innerHTML='<h2>'+esc(p.title)+'</h2><p class="apa-summary">'+esc(p.summary)+'</p>'+
 '<div class="apa-meta"><div class="apa-meta-card"><small><i class="fa-solid fa-building-columns"></i> الجهة المختصة</small><strong>'+esc(p.authority)+'</strong></div><div class="apa-meta-card"><small><i class="fa-solid fa-list-check"></i> تقدم قائمة التحقق</small><strong>'+checked+' من '+p.documents.length+' عناصر مكتملة</strong></div></div>'+
 '<h3 class="apa-section-title"><i class="fa-solid fa-clipboard-check"></i> قائمة الوثائق والتحضير</h3><div class="apa-checklist">'+docs+'</div>'+
 '<h3 class="apa-section-title"><i class="fa-solid fa-route"></i> الخطوات المقترحة</h3><ol class="apa-steps">'+steps+'</ol>'+
 '<h3 class="apa-section-title"><i class="fa-solid fa-circle-exclamation"></i> ملاحظات مهمة</h3><ul class="apa-notes">'+notes+'</ul>'+
 '<div class="apa-actions apa-no-print"><button class="apa-btn" type="button" id="apa-print"><i class="fa-solid fa-print"></i> طباعة القائمة</button><button class="apa-btn apa-btn-secondary" type="button" id="apa-save"><i class="fa-solid fa-floppy-disk"></i> حفظ القائمة</button><button class="apa-btn apa-btn-secondary" type="button" id="apa-export"><i class="fa-solid fa-file-arrow-down"></i> تصدير JSON</button></div>'+
 '<div class="apa-source"><i class="fa-solid fa-shield-halved"></i><span>المصدر: '+esc(p.sourceName)+' — </span><a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.sourceLabel)+'</a><small>آخر مراجعة للمصدر: '+esc(p.verified)+' · '+esc(p.status)+'</small></div>';
 root.querySelectorAll('[data-check-id]').forEach(input=>input.addEventListener('change',()=>{
  progress[keyFor(p,input.dataset.checkId)]=input.checked;saveProgress();renderDetail();renderList();
 }));
 $('apa-print').addEventListener('click',()=>window.print());
 $('apa-save').addEventListener('click',()=>{
  saveProgress();
  const btn=$('apa-save'),old=btn.innerHTML;btn.innerHTML='<i class="fa-solid fa-check"></i> تم الحفظ محليًا';setTimeout(()=>{if(btn.isConnected)btn.innerHTML=old},1800);
 });
 $('apa-export').addEventListener('click',()=>exportCurrent(p));
}
function exportCurrent(p){
 const payload={schemaVersion:1,exportedAt:new Date().toISOString(),procedure:{id:p.id,title:p.title,sourceUrl:p.sourceUrl,verified:p.verified},checklist:p.documents.map(d=>({document:d.text,checked:getChecked(p,d.id)})),steps:p.steps};
 const blob=new Blob(['\ufeff',JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='checklist-'+p.id+'.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
$('apa-procedure-list').addEventListener('click',e=>{
 const b=e.target.closest('[data-procedure-id]');if(!b)return;selectedId=b.dataset.procedureId;renderList();renderDetail();
});
$('apa-search').addEventListener('input',()=>{renderList();renderDetail();});
$('apa-category').addEventListener('change',()=>{renderList();renderDetail();});
async function init(){
 progress=loadProgress();
 try{
  const response=await fetch(DATA_URL);
  if(!response.ok)throw new Error('تعذر تحميل البيانات');
  procedures=await response.json();
  selectedId=procedures[0]?.id||null;
  renderList();renderDetail();
 }catch(error){$('apa-procedure-list').innerHTML='<p class="apa-empty">تعذر تحميل الإجراءات. تحقق من الاتصال ثم أعد تحميل الصفحة.</p>';$('apa-detail-content').innerHTML='<p class="apa-empty">تعذر تحميل الدليل. يمكنك مراجعة <a href="https://interieur.gov.dz/category/الإجراءات-الإدارية/" target="_blank" rel="noopener noreferrer">الإجراءات الإدارية على موقع وزارة الداخلية</a>.</p>'}
}
document.addEventListener('DOMContentLoaded',init);
})();