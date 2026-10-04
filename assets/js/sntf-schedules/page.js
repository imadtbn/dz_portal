import {findSchedule} from './catalog.js?v=20261004';
import {createViewer} from './viewer.js?v=20261004';
const $=id=>document.getElementById(id),params=new URL(location.href).searchParams,schedule=findSchedule(params.get('schedule'));
const clock=()=>{$('algeria-time').textContent=new Intl.DateTimeFormat('fr-DZ',{timeZone:'Africa/Algiers',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());$('algeria-time').dateTime=new Date().toISOString()};clock();setInterval(clock,1000);
if(!schedule){
 $('schedule-error').hidden=false;$('schedule-error').textContent='الجدول المطلوب غير موجود. اختر جدولًا من صفحة الجداول والخدمات.';
 const back=document.createElement('a');back.href='sntf.html';back.textContent=' العودة إلى الجداول ←';$('schedule-error').append(back);
 const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,follow';document.head.append(robots);
}else{
 $('schedule-content').hidden=false;
 const url=new URL('sntf-schedule.html',location.href);url.searchParams.set('schedule',schedule.id);
 const imageURL=new URL(schedule.image,location.href).href,title='جدول قطارات '+schedule.title,description='راجع الجدول المصوّر لخط '+schedule.title+' ضمن '+schedule.category+' مع التكبير والسحب وملء الشاشة.';
 document.title=title+' | البوابة الجزائرية';document.querySelector('meta[name="description"]').content=description;document.querySelector('link[rel="canonical"]').href=url.href;
 for(const [key,value] of Object.entries({title:document.title,description,url:url.href,image:imageURL}))document.querySelector('meta[property="og:'+key+'"]').content=value;
 for(const [key,value] of Object.entries({title:document.title,description,image:imageURL})){const meta=document.createElement('meta');meta.name='twitter:'+key;meta.content=value;document.head.append(meta)}
 $('schedule-title').textContent=title;$('schedule-category').textContent=schedule.category;$('crumb-category').textContent=schedule.category;$('crumb-category').href='sntf.html#'+schedule.anchor;$('crumb-title').textContent=schedule.title;
 $('info-title').textContent=schedule.title;$('info-category').textContent=schedule.category;$('hero-image').src=schedule.hero;$('hero-image').alt=schedule.anchor==='suburban'?'قطار ضاحية الجزائر':'السكك الحديدية الجزائرية';$('dialog-title').textContent=title;
 const image=$('schedule-image');image.alt='الجدول المصوّر: '+schedule.title;
 if(schedule.width){image.width=schedule.width;image.height=schedule.height}
 const viewer=createViewer($('image-viewport'),$('image-stage'),image,$('zoom-level'));
 image.addEventListener('load',()=>{$('image-status').textContent='الصورة كاملة دون قصّ. الحجم الأصلي: '+image.naturalWidth+' × '+image.naturalHeight+' بكسل.'});
 image.addEventListener('error',()=>{$('image-status').textContent='تعذر تحميل الصورة. أعد تحميل الصفحة أو افتح الصورة الأصلية.'});image.src=schedule.image;$('original-image').href=schedule.image;
 const plan=new URL('sntf-trains.html',location.href);plan.hash='panel-search';if(schedule.fromId&&schedule.toId){plan.searchParams.set('from',schedule.fromId);plan.searchParams.set('to',schedule.toId);$('plan-journey').textContent='خطط رحلة بين '+schedule.from+' و'+schedule.to+' ←'}$('plan-journey').href=plan.href;
 const crumbs=[['الرئيسية',new URL('../index.html',location.href).href],['الجداول والخدمات',new URL('sntf.html',location.href).href],[schedule.category,new URL('sntf.html#'+schedule.anchor,location.href).href],[schedule.title,url.href]];
 $('schedule-schema').textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'ImageObject','@id':url.href+'#image',name:title,contentUrl:imageURL,url:url.href,caption:description,inLanguage:'ar',...(schedule.width?{width:schedule.width,height:schedule.height}:{})},{'@type':'BreadcrumbList',itemListElement:crumbs.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))}]});
 const dialog=$('schedule-dialog'),root=$('schedule-viewer'),placeholder=document.createComment('schedule-viewer');root.before(placeholder);
 const restore=()=>{placeholder.after(root);document.body.classList.remove('schedule-dialog-open');requestAnimationFrame(()=>viewer.refresh())};
 dialog.addEventListener('close',restore);$('close-dialog').addEventListener('click',()=>dialog.close());
 async function share(){
  const status=$('share-status');
  try{if(navigator.share){await navigator.share({title,text:description,url:url.href});status.textContent='تمت مشاركة الجدول.'}else{await navigator.clipboard.writeText(url.href);status.textContent='تم نسخ رابط الجدول.'}}
  catch(error){if(error.name==='AbortError')return;status.replaceChildren();const link=document.createElement('a');link.href=url.href;link.textContent=url.href;status.append('يمكنك نسخ الرابط: ',link)}
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='share')share();else if(action==='fullscreen'){
   if(dialog.open){dialog.close();return}
   $('dialog-viewer').append(root);dialog.showModal();document.body.classList.add('schedule-dialog-open');requestAnimationFrame(()=>viewer.refresh());
  }else viewer[action]?.();
 });
 // Only this one reserved slot is requested, after the main timetable.
 const ad=document.querySelector('.schedule-ad');const loadAd=()=>{
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5656416032906373';script.onload=()=>{try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{}};document.head.append(script);
 };
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();loadAd()}},{rootMargin:'200px'});observer.observe(ad)}
}
