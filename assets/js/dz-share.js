/* DZ Portal universal sharing: no dependency, no tracking unless analytics is already present */
(function(){
'use strict';
if(window.__dzShareInitialized)return;window.__dzShareInitialized=true;
const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 13.5 6.6 4m0-11-6.6 4"/></svg>';
const root=new URL('../..',document.currentScript?.src||location.href);
function init(){
 if(document.querySelector('.dz-share-slot'))return;
 const options=['.hero .hero-content','.hero-content','.section-hero .container','.section-hero','.page-hero .container','.page-hero','.hero','.page-header','.page-heading','.section-header','.site-hero'];
 let anchor=null;
 for(const s of options){const candidate=document.querySelector(s);if(candidate&&!candidate.closest('nav,header.site-header,footer')&&!candidate.matches('header')){anchor=candidate;break;}}
 const slot=document.createElement('div');slot.className='dz-share-slot';slot.setAttribute('dir','rtl');
 const btn=document.createElement('button');btn.className='dz-share-button';btn.type='button';btn.setAttribute('aria-label','مشاركة رابط هذه الصفحة');btn.innerHTML=ICON+'<span>مشاركة الصفحة</span>';
 slot.appendChild(btn);
 if(anchor){slot.classList.add('dz-share-in-hero');anchor.appendChild(slot);}
 else {const main=document.querySelector('main,[role="main"]');if(main)main.insertBefore(slot,main.firstChild);else{const footer=document.querySelector('footer');if(footer)footer.before(slot);else document.body.appendChild(slot);}}
 const panel=document.createElement('div');panel.className='dz-share-panel';panel.hidden=true;
 panel.innerHTML='<section class="dz-share-dialog" role="dialog" aria-modal="true" aria-labelledby="dz-share-heading"><div class="dz-share-dialog-header"><h2 id="dz-share-heading">مشاركة هذه الصفحة</h2><button type="button" class="dz-share-close" aria-label="إغلاق">×</button></div><p class="dz-share-page-title"></p><div class="dz-share-options"><a class="dz-share-option dz-whatsapp" target="_blank" rel="noopener noreferrer">واتساب</a><a class="dz-share-option dz-telegram" target="_blank" rel="noopener noreferrer">تيليغرام</a><a class="dz-share-option dz-facebook" target="_blank" rel="noopener noreferrer">فيسبوك</a><button type="button" class="dz-share-option dz-copy">نسخ الرابط</button></div><p class="dz-share-status" role="status" aria-live="polite"></p></section>';
 document.body.appendChild(panel);
 const close=panel.querySelector('.dz-share-close'),status=panel.querySelector('.dz-share-status');
 let focusReturn=btn;
 function hide(){panel.hidden=true;document.removeEventListener('keydown',keys);focusReturn.focus();}
 function keys(e){if(e.key==='Escape')hide();if(e.key==='Tab'){const focusable=[...panel.querySelectorAll('button,a[href]')];const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
 close.addEventListener('click',hide);panel.addEventListener('click',e=>{if(e.target===panel)hide();});
 const title=()=>document.querySelector('meta[property="og:title"]')?.content||document.title||'البوابة الجزائرية للخدمات الرقمية';
 const url=()=>location.href;
 function fallback(){
  const u=url(),t=title(),txt=encodeURIComponent(t+' — '+u),encoded=encodeURIComponent(u);
  panel.querySelector('.dz-share-page-title').textContent=t;
  panel.querySelector('.dz-whatsapp').href='https://api.whatsapp.com/send?text='+txt;
  panel.querySelector('.dz-telegram').href='https://t.me/share/url?url='+encoded+'&text='+encodeURIComponent(t);
  panel.querySelector('.dz-facebook').href='https://www.facebook.com/sharer/sharer.php?u='+encoded;
  status.textContent='';focusReturn=document.activeElement;panel.hidden=false;document.addEventListener('keydown',keys);close.focus();
 }
 panel.querySelector('.dz-copy').addEventListener('click',async()=>{
  try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url());else{const input=document.createElement('textarea');input.value=url();input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();if(!document.execCommand('copy'))throw Error('copy');input.remove();}status.textContent='تم نسخ الرابط بنجاح';}catch(e){status.textContent='تعذر النسخ تلقائيًا. انسخ الرابط من شريط العنوان.';}
 });
 btn.addEventListener('click',async()=>{
  const data={title:title(),text:document.querySelector('meta[name="description"]')?.content||title(),url:url()};
  if(typeof navigator.share==='function'){
   try{await navigator.share(data);return;}catch(e){if(e?.name==='AbortError')return;}
  }
  fallback();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
