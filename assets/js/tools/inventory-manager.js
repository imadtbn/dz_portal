(() => {
'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'tools-dz-inventory-manager-v1';
const state = {products: [], movements: []};
const money = value => new Intl.NumberFormat('fr-DZ',{maximumFractionDigits:2}).format(Number(value)||0) + ' دج';
const today = () => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const uid = () => 'im-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) { status('تعذر حفظ البيانات محليًا. تحقق من مساحة المتصفح.'); } }
function status(text, bad=false){ const el=$('im-status'); el.textContent=text; el.style.color=bad?'#b42318':'#187a50'; }
function load(){ try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){ const data=JSON.parse(raw); if(Array.isArray(data.products)&&Array.isArray(data.movements)){state.products=data.products;state.movements=data.movements;} } } catch(e){status('تعذر قراءة البيانات المحفوظة؛ يمكنك استيراد نسخة JSON.',true);} }
function fmtDate(d){return d||'—';}
function render(){
 const products=state.products, moves=state.movements;
 $('im-stat-products').textContent=products.length;
 $('im-stat-stock').textContent=money(products.reduce((s,p)=>s+(Number(p.stock)||0)*(Number(p.cost)||0),0));
 const daySales=moves.filter(m=>m.type==='sale'&&m.date===today()).reduce((s,m)=>s+m.quantity*m.unitPrice,0);
 $('im-stat-sales').textContent=money(daySales);
 const profit=moves.filter(m=>m.type==='sale').reduce((s,m)=>s+(Number(m.profit)||0),0);
 $('im-stat-profit').textContent=money(profit);
 const search=$('im-search').value.trim().toLocaleLowerCase();
 const filtered=products.filter(p=>[p.name,p.sku,p.category].join(' ').toLocaleLowerCase().includes(search));
 $('im-products-body').innerHTML=filtered.length?filtered.map(p=>{
  const low=Number(p.stock)<=Number(p.minStock);
  const margin=Number(p.price)-Number(p.cost);
  const marginPct=Number(p.price)>0?(margin/Number(p.price))*100:0;
  return '<tr><td><strong>'+esc(p.name)+'</strong><small>'+esc(p.sku||p.category||'بدون رمز')+'</small></td><td class="'+(low?'im-low':'')+'">'+Number(p.stock)+' '+(low?'⚠️':'')+'</td><td>'+money(p.cost)+'</td><td>'+money(p.price)+'</td><td class="'+(margin>=0?'im-profit-positive':'im-profit-negative')+'">'+money(margin)+'<small>'+marginPct.toFixed(1)+'% من سعر البيع</small></td><td>'+money(Number(p.stock)*Number(p.cost))+'</td><td class="no-print"><div class="im-row-actions"><button type="button" class="im-mini-btn" data-action="edit" data-id="'+esc(p.id)+'" title="تعديل الأسعار والحد">تعديل</button><button type="button" class="im-mini-btn" data-action="delete" data-id="'+esc(p.id)+'" title="حذف المنتج">حذف</button></div></td></tr>';
 }).join(''):'<tr><td colspan="7">لا توجد منتجات مطابقة.</td></tr>';
 const low=products.filter(p=>Number(p.stock)<=Number(p.minStock));
 $('im-alerts').innerHTML=low.length?low.map(p=>'<div class="im-alert"><i class="fa-solid fa-triangle-exclamation"></i> مخزون منخفض: <strong>'+esc(p.name)+'</strong> — المتبقي '+Number(p.stock)+'، حد التنبيه '+Number(p.minStock)+'.</div>').join(''):'<div class="im-alert im-alert-ok"><i class="fa-solid fa-circle-check"></i> لا توجد منتجات تحت حد التنبيه.</div>';
 const select=$('im-product-select'), old=select.value;
 select.innerHTML='<option value="">اختر المنتج</option>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' — المتوفر: '+Number(p.stock)+'</option>').join('');
 if(products.some(p=>p.id===old))select.value=old;
 $('im-history-body').innerHTML=moves.length?moves.slice().reverse().map(m=>'<tr><td>'+esc(fmtDate(m.date))+'</td><td>'+(m.type==='sale'?'بيع':'شراء')+'</td><td>'+esc(m.productName)+'</td><td>'+Number(m.quantity)+'</td><td>'+money(m.unitPrice)+'</td><td>'+money(m.quantity*m.unitPrice)+'</td><td class="'+((m.profit||0)>=0?'im-profit-positive':'im-profit-negative')+'">'+(m.type==='sale'?money(m.profit||0):'—')+'</td><td>'+esc(m.note||'—')+'</td></tr>').join(''):'<tr><td colspan="8">لا توجد حركات مسجلة.</td></tr>';
 updateUnitPrice();
}
function updateUnitPrice(){const p=state.products.find(x=>x.id===$('im-product-select').value);$('im-unit-price').value=p?( $('im-movement-type').value==='sale'?p.price:p.cost):0;}
$('im-product-form').addEventListener('submit',e=>{
 e.preventDefault(); const f=new FormData(e.currentTarget);
 const name=String(f.get('name')||'').trim(), sku=String(f.get('sku')||'').trim();
 if(!name){status('أدخل اسم المنتج.',true);return;}
 if(sku&&state.products.some(p=>p.sku.toLowerCase()===sku.toLowerCase())){status('رمز المنتج مستخدم من قبل.',true);return;}
 const product={id:uid(),name,sku,category:String(f.get('category')||'').trim(),cost:Number(f.get('cost')),price:Number(f.get('price')),stock:Number(f.get('stock')),minStock:Number(f.get('minStock'))||0,createdAt:today()};
 if(![product.cost,product.price,product.stock,product.minStock].every(Number.isFinite)||product.cost<0||product.price<0||product.stock<0||product.minStock<0){status('تحقق من الأسعار والكميات المدخلة.',true);return;}
 state.products.push(product);
 if(product.stock>0)state.movements.push({id:uid(),type:'purchase',productId:product.id,productName:product.name,quantity:product.stock,unitPrice:product.cost,profit:0,date:today(),note:'رصيد افتتاحي'});
 save();e.currentTarget.reset();e.currentTarget.elements.cost.value=0;e.currentTarget.elements.price.value=0;e.currentTarget.elements.stock.value=0;e.currentTarget.elements.minStock.value=2;render();status('تمت إضافة المنتج إلى المخزون.');
});
$('im-movement-form').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),type=String(f.get('type')),p=state.products.find(x=>x.id===f.get('productId')),quantity=Number(f.get('quantity')),unitPrice=Number(f.get('unitPrice')),date=String(f.get('date'));
 if(!p){status('اختر منتجًا صالحًا.',true);return;}
 if(!Number.isInteger(quantity)||quantity<1||!Number.isFinite(unitPrice)||unitPrice<0){status('أدخل كمية صحيحة وسعرًا غير سالب.',true);return;}
 if(type==='sale'&&quantity>p.stock){status('الكمية المطلوبة أكبر من المخزون المتوفر ('+p.stock+').',true);return;}
 let profit=0;
 if(type==='sale'){profit=(unitPrice-Number(p.cost))*quantity;p.stock-=quantity;}
 else {const oldQty=Number(p.stock),newQty=oldQty+quantity;p.cost=newQty?((oldQty*Number(p.cost)+quantity*unitPrice)/newQty):unitPrice;p.stock=newQty;}
 state.movements.push({id:uid(),type,productId:p.id,productName:p.name,quantity,unitPrice,unitCost:Number(p.cost),profit,date,note:String(f.get('note')||'').trim()});
 save();e.currentTarget.elements.quantity.value=1;e.currentTarget.elements.note.value='';render();status(type==='sale'?'تم تسجيل البيع وتحديث المخزون.':'تم تسجيل الشراء وتحديث متوسط تكلفة المخزون.');
});
$('im-movement-type').addEventListener('change',updateUnitPrice);
$('im-product-select').addEventListener('change',updateUnitPrice);
$('im-search').addEventListener('input',render);
$('im-products-body').addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;
 const p=state.products.find(x=>x.id===b.dataset.id);if(!p)return;
 if(b.dataset.action==='delete'){
  if(Number(p.stock)>0){status('لا يمكن حذف منتج ما زالت له كمية في المخزون. سجّل المبيعات أو صحّح الكمية أولًا.',true);return;}
  if(!confirm('حذف المنتج «'+p.name+'» من قائمة المخزون؟ ستبقى حركاته السابقة في السجل.'))return;
  state.products=state.products.filter(x=>x.id!==p.id);save();render();status('تم حذف المنتج.');
 }else if(b.dataset.action==='edit'){
  const cost=prompt('سعر الشراء الحالي للوحدة (دج):',p.cost);if(cost===null)return;
  const price=prompt('سعر البيع الحالي للوحدة (دج):',p.price);if(price===null)return;
  const min=prompt('حد التنبيه عند النقص:',p.minStock);if(min===null)return;
  if(![cost,price,min].every(v=>v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0)){status('القيم غير صالحة.',true);return;}
  p.cost=Number(cost);p.price=Number(price);p.minStock=Number(min);save();render();status('تم تحديث بيانات المنتج.');
 }
});
function download(filename,content,type){const blob=new Blob(['\ufeff',content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
$('im-export-json').addEventListener('click',()=>download('tools-dz-inventory-backup-'+today()+'.json',JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),products:state.products,movements:state.movements},null,2),'application/json;charset=utf-8'));
$('im-export-csv').addEventListener('click',()=>{
 const rows=[['التاريخ','نوع الحركة','المنتج','الرمز','الكمية','سعر الوحدة (دج)','الإجمالي (دج)','الربح (دج)','ملاحظة']];
 state.products.forEach(p=>rows.push([today(),'الرصيد الحالي',p.name,p.sku||'',p.stock,p.cost,p.stock*p.cost,'','قيمة المخزون الحالية بالتكلفة']));
 rows.push(['','','','','','','','','']);
 state.movements.forEach(m=>{const p=state.products.find(x=>x.id===m.productId);rows.push([m.date,m.type==='sale'?'بيع':'شراء',m.productName,p?.sku||'',m.quantity,m.unitPrice,m.quantity*m.unitPrice,m.type==='sale'?(m.profit||0):'',m.note||'']);});
 const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 download('tools-dz-inventory-report-'+today()+'.csv',csv,'text/csv;charset=utf-8');
});
$('im-import-json').addEventListener('click',()=>$('im-import-file').click());
$('im-import-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.products)||!Array.isArray(data.movements))throw new Error('صيغة النسخة غير صحيحة.');
  const validProducts=data.products.every(p=>p.id&&typeof p.name==='string'&&Number.isFinite(Number(p.stock))&&Number(p.stock)>=0);
  const validMoves=data.movements.every(m=>m.id&&m.productId&&['sale','purchase'].includes(m.type)&&Number(m.quantity)>0);
  if(!validProducts||!validMoves)throw new Error('النسخة تحتوي بيانات غير صالحة.');
  if(!confirm('سيتم استبدال البيانات الحالية بالنسخة المستوردة. هل تريد المتابعة؟'))return;
  state.products=data.products;state.movements=data.movements;save();render();status('تم استيراد النسخة الاحتياطية بنجاح.');
 }catch(err){status(err.message||'تعذر استيراد الملف.',true);}finally{e.target.value='';}
});
$('im-clear-history').addEventListener('click',()=>{
 if(!confirm('سيتم حذف جميع المنتجات والحركات المحفوظة محليًا. صدّر نسخة JSON أولًا إن كنت تحتاجها. هل تريد المتابعة؟'))return;
 state.products=[];state.movements=[];save();render();status('تم مسح جميع البيانات المحلية.');
});
$('im-movement-form').elements.date.value=today();
load();render();
})();