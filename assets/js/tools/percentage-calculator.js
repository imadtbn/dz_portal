(() => {
'use strict';
const form=document.getElementById('pct-form'), part=document.getElementById('pct-part'), total=document.getElementById('pct-total');
const error=document.getElementById('pct-error'), result=document.getElementById('pct-result');
form.addEventListener('submit',event=>{
 event.preventDefault();error.hidden=true;error.textContent='';
 const a=Number(part.value),b=Number(total.value);
 if(part.value.trim()===''||total.value.trim()===''||!Number.isFinite(a)||!Number.isFinite(b)){error.textContent='أدخل قيمتين رقميتين صحيحتين.';error.hidden=false;result.hidden=true;return;}
 if(b===0){error.textContent='لا يمكن حساب النسبة عندما يكون الإجمالي صفرًا.';error.hidden=false;result.hidden=true;return;}
 const pct=(a/b)*100;
 document.getElementById('pct-value').textContent=pct.toLocaleString('ar-DZ',{maximumFractionDigits:4})+'%';
 document.getElementById('pct-details').textContent=a.toLocaleString('ar-DZ')+' من '+b.toLocaleString('ar-DZ')+' تساوي '+pct.toLocaleString('ar-DZ',{maximumFractionDigits:4})+' بالمائة.';
 result.hidden=false;
});
form.addEventListener('reset',()=>{error.hidden=true;error.textContent='';result.hidden=true;});
})();