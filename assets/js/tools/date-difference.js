(() => {
'use strict';
const form=document.getElementById('date-form'), start=document.getElementById('date-start'), end=document.getElementById('date-end');
const error=document.getElementById('date-error'), result=document.getElementById('date-result');
function parseDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;}
function dayNumber(date){return date.getTime()/86400000;}
const today=new Date(), todayText=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
start.value=todayText;end.value=todayText;
form.addEventListener('submit',event=>{
 event.preventDefault();error.hidden=true;error.textContent='';
 const a=parseDay(start.value),b=parseDay(end.value);
 if(!a||!b){error.textContent='اختر تاريخين صحيحين.';error.hidden=false;result.hidden=true;return;}
 const days=Math.abs(dayNumber(b)-dayNumber(a)),weeks=Math.floor(days/7),remaining=days%7;
 document.getElementById('date-days').textContent=days.toLocaleString('ar-DZ')+' يوم';
 document.getElementById('date-details').textContent=days.toLocaleString('ar-DZ')+' يوم = '+weeks.toLocaleString('ar-DZ')+' أسبوع و '+remaining.toLocaleString('ar-DZ')+' يوم.';
 result.hidden=false;
});
form.addEventListener('reset',()=>{error.hidden=true;error.textContent='';result.hidden=true;});
})();