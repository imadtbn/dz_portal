import {findSchedule} from './sntf-schedules/catalog.js?v=20261104-favorites';
function initFavoritesPage(){
const $=id=>document.getElementById(id);
const icons={sector:'fa-landmark',tool:'fa-toolbox',schedule:'fa-train'};
const labels={sector:'القطاعات والخدمات',tool:'الأدوات الرقمية',schedule:'جداول القطارات'};
let activeFilter='all';
let searchText='';
let resolved=[];
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function resolveItem(item){
 if(item.type!=='schedule')return item;
 const schedule=findSchedule(item.id);
 if(!schedule)return {...item,missing:true};
 const url=new URL('../sectors/sntf-schedule.html',location.href);url.searchParams.set('schedule',schedule.id);
 return {...item,title:schedule.title,url:url.href,category:schedule.category,from:schedule.from||'',to:schedule.to||'',routeId:schedule.routeId||''};
}
function card(item){
 const route=item.type==='schedule'&&(item.from||item.to)?'<div class="favorite-route"><span>'+esc(item.from||'محطة غير محددة')+'</span><i class="fa-solid fa-arrow-left-long" aria-hidden="true"></i><span>'+esc(item.to||'محطة غير محددة')+'</span></div>':'';
 const missing=item.missing?'<p class="favorite-category">لم يعد هذا المعرّف موجودًا في فهرس الجداول الحالي.</p>':'';
 return '<article class="favorite-card" data-type="'+esc(item.type)+'" data-id="'+esc(item.id)+'"><div class="favorite-card-top"><span class="favorite-card-icon"><i class="fa-solid '+icons[item.type]+'" aria-hidden="true"></i></span><div><h2>'+esc(item.title)+'</h2><span class="favorite-category">'+esc(item.category||labels[item.type])+'</span></div></div>'+route+missing+'<div class="favorite-card-actions">'+(item.missing?'<a class="favorite-open" href="../sectors/sntf.html"><i class="fa-solid fa-list" aria-hidden="true"></i> عرض الجداول الحالية</a>':'<a class="favorite-open" href="'+esc(item.url)+'"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> فتح مباشرة</a>')+'<button class="favorite-remove" type="button" data-remove-type="'+esc(item.type)+'" data-remove-id="'+esc(item.id)+'" aria-label="إزالة '+esc(item.title)+' من المفضلات"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></div></article>';
}
function render(){
 const all=window.DZFavorites.list();
 resolved=all.map(resolveItem);
 $('count-sector').textContent=all.filter(x=>x.type==='sector').length;
 $('count-tool').textContent=all.filter(x=>x.type==='tool').length;
 $('count-schedule').textContent=all.filter(x=>x.type==='schedule').length;
 $('count-all').textContent=all.length;
 document.querySelectorAll('.favorites-filter').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.filter===activeFilter)));
 const normalize=s=>String(s||'').toLocaleLowerCase('ar').normalize('NFD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
 const query=normalize(searchText);
 const filtered=resolved.filter(item=>(activeFilter==='all'||item.type===activeFilter)&&(!query||normalize([item.title,item.category,item.from,item.to].join(' ')).includes(query)));
 $('favorites-results').innerHTML=filtered.map(card).join('');
 $('favorites-results').hidden=filtered.length===0;
 $('favorites-empty').hidden=filtered.length!==0;
 if(!all.length){$('favorites-empty-title').textContent='لم تضف أي مفضلات بعد';$('favorites-empty-description').textContent='أضف القطاع أو الأداة أو جدول القطار من صفحته الأصلية، وسيظهر هنا.';}
 else if(!filtered.length){$('favorites-empty-title').textContent='لا توجد نتائج مطابقة';$('favorites-empty-description').textContent='جرّب تغيير كلمات البحث أو اختيار تصنيف آخر.';}
 $('clear-all-favorites').disabled=all.length===0;
}
document.addEventListener('click',event=>{
 const removeButton=event.target.closest('[data-remove-type]');
 if(removeButton){window.DZFavorites.remove(removeButton.dataset.removeType,removeButton.dataset.removeId);$('favorites-status').textContent='تم حذف العنصر من المفضلات.';render();return;}
 const filter=event.target.closest('[data-filter]');
 if(filter){activeFilter=filter.dataset.filter;render();return;}
 if(event.target.closest('#clear-all-favorites')){
  if(!window.DZFavorites.list().length)return;
  if(window.confirm('هل تريد حذف جميع العناصر المحفوظة من هذا الجهاز؟')){window.DZFavorites.list().forEach(item=>window.DZFavorites.remove(item.type,item.id));$('favorites-status').textContent='تم حذف جميع المفضلات.';render();}
 }
});
$('favorites-search').addEventListener('input',event=>{searchText=event.target.value;$('clear-favorites-search').hidden=!searchText;render();});
$('clear-favorites-search').addEventListener('click',()=>{$('favorites-search').value='';searchText='';$('clear-favorites-search').hidden=true;render();$('favorites-search').focus();});
window.addEventListener('dz:favorites-changed',render);
window.addEventListener('storage',render);
render();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initFavoritesPage,{once:true});
else initFavoritesPage();
