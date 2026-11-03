(() => {
'use strict';
const timeEl=document.getElementById('pomodoro-time');
const labelEl=document.getElementById('pomodoro-label');
const statusEl=document.getElementById('pomodoro-status');
const startBtn=document.getElementById('pomodoro-start');
const resetBtn=document.getElementById('pomodoro-reset');
const soundToggle=document.getElementById('pomodoro-sound');
const modes=Array.from(document.querySelectorAll('.pomodoro-mode'));
let duration=25*60,remaining=duration,interval=null,running=false,modeName='جلسة دراسة';
function render(){
 const minutes=Math.floor(remaining/60),seconds=remaining%60;
 timeEl.textContent=String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
 labelEl.textContent=modeName;
 startBtn.innerHTML=running?'<i class="fa-solid fa-pause" aria-hidden="true"></i> إيقاف مؤقت':'<i class="fa-solid fa-play" aria-hidden="true"></i> ابدأ';
 startBtn.setAttribute('aria-pressed',String(running));
}
function stop(){if(interval!==null){clearInterval(interval);interval=null;}running=false;}
function alertUser(){
 statusEl.textContent='انتهى الوقت. خذ استراحة قصيرة أو ابدأ جلسة جديدة.';
 if(soundToggle.checked&&typeof Audio!=='undefined'){
   try{const audio=new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');audio.volume=.45;audio.play().catch(()=>{});}catch(_){}
 }
 if(typeof window.dzTrackEvent==='function')window.dzTrackEvent('pomodoro_completed',{mode:modeName,duration_minutes:duration/60});
}
function chooseMode(button){
 stop();
 const minutes=Number(button.dataset.minutes);
 duration=minutes*60;remaining=duration;
 modeName=minutes===25?'جلسة دراسة':minutes===5?'استراحة قصيرة':'استراحة طويلة';
 modes.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 statusEl.textContent='تم ضبط المؤقت على '+minutes+' دقيقة.';
 render();
}
modes.forEach(button=>button.addEventListener('click',()=>chooseMode(button)));
startBtn.addEventListener('click',()=>{
 if(running){stop();statusEl.textContent='تم إيقاف المؤقت مؤقتًا.';render();return;}
 if(remaining<=0)remaining=duration;
 running=true;statusEl.textContent='المؤقت يعمل. ركّز على مهمتك الحالية.';render();
 interval=setInterval(()=>{
   remaining=Math.max(0,remaining-1);
   render();
   if(remaining===0){stop();render();alertUser();}
 },1000);
});
resetBtn.addEventListener('click',()=>{stop();remaining=duration;statusEl.textContent='أُعيد ضبط المؤقت.';render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&running)statusEl.textContent='المؤقت مستمر.';});
render();
})();