(()=>{'use strict';const root='https://imadtbn.github.io/dz_portal/';const routes={"age-calculator":"calculators","average-calculator":"calculators","calculator":"calculators","car-cost-calculator":"calculators","currency-converter":"calculators","date-difference":"calculators","electricity-calculator":"calculators","fuel-calculator":"calculators","loan-calculator":"calculators","number-to-words":"calculators","percentage-calculator":"calculators","salary-calculator":"calculators","unit-converter":"calculators","budget-calculator":"daily-life","budget-manager":"daily-life","farm-planner":"daily-life","maps":"daily-life","meal-planner":"daily-life","anxiety-screening":"health","asthma-control":"health","calorie-calculator":"health","child-bmi-calculator":"health","depression-screening":"health","diabetes-awareness":"health","eating-awareness":"health","fertile-window":"health","health-tools":"health","ideal-weight-calculator":"health","infant-growth-calculator":"health","nutrition-calculator":"health","pilgrim-health-checklist":"health","prediabetes-risk":"health","pregnancy-calorie-calculator":"health","pregnancy-due-date":"health","sleep-assessment":"health","vaccine-tracker":"health","visual-acuity-screening":"health","water-calculator":"health","hijri-calendar":"islamic","qibla-compass":"islamic","admin-procedures-assistant":"productivity","arabic-dictionary":"productivity","cv-builder":"productivity","image-compressor":"productivity","inventory-manager":"productivity","invoice-generator":"productivity","pdf-tools":"productivity","qr-generator":"productivity","text-tools":"productivity","apa-generator":"study","countdown":"study","exam-planner":"study","exam-study-planner":"study","flashcards":"study","notes-calendar":"study","points-ranking":"study","pomodoro":"study","research-plan":"study","semester-calculator":"study","study-schedule":"study"};const b=document.getElementById('dz-tools-nav-toggle'),n=document.getElementById('dz-tools-nav');if(b&&n&&b.dataset.bound!=='true'){b.dataset.bound='true';b.addEventListener('click',()=>{const o=n.classList.toggle('is-open');b.setAttribute('aria-expanded',String(o))});n.addEventListener('click',e=>{if(e.target.closest('a')&&window.matchMedia('(max-width:720px)').matches){n.classList.remove('is-open');b.setAttribute('aria-expanded','false')}})}document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(!h||h.startsWith('#')||/^(?:https?:|mailto:|tel:|javascript:|data:|\/)/i.test(h))return;const base=h.split(/[?#]/)[0];const slug=base.split('/').pop().replace(/\.html$/i,'');if(routes[slug]){a.href=root+'pages/tools/'+routes[slug]+'/'+slug+'.html';return}if(base==='index.html'||base==='../index.html'){a.href=root;return}if(/privacy\.html$/.test(base)){a.href=root+'pages/privacy.html';return}if(/contact\.html$/.test(base)){a.href=root+'pages/contact.html';return}if(/\.(?:png|jpe?g|webp|svg|pdf|zip|json|csv)$/i.test(base))return;a.href=root+'pages/tools/index.html'})
// Remove legacy share controls injected by imported tool bundles. Keep exactly
// the portal's canonical share/help row (or the Qibla page's native row).
function cleanupLegacyShareControls(){
 const isCanonical=el=>!!el.closest('.dz-share-slot,.qibla-share-row');
 const removeControl=el=>{
  if(!el||isCanonical(el))return;
  const wrapper=el.closest('button,a,[role="button"],.floating-share,.share-fab,.share-widget,.social-share,.share-container');
  const target=wrapper&&!isCanonical(wrapper)?wrapper:el;
  if(target!==document.body&&target!==document.documentElement)target.remove();
 };
 const iconSelector='.fa-share,.fa-share-alt,.fa-share-nodes,.fa-share-from-square,[data-share-button],[data-action="share"],[aria-label*="share" i],[title*="share" i]';
 document.querySelectorAll(iconSelector).forEach(removeControl);
 document.querySelectorAll('button,a,[role="button"],[tabindex="0"]').forEach(el=>{
  if(isCanonical(el))return;
  const label=[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-tooltip'),el.innerText,el.textContent].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  const cls=typeof el.className==='string'?el.className:'';
  const legacyClass=/(?:^|\s)(?:share|share-btn|share-button|share-fab|floating-share|social-share-button|help-btn|help-button|question-btn|question-button)(?:\s|$)/i.test(cls);
  const shareMatch=/(?:مشاركة(?: الصفحة)?|share(?: this page| page)?)/i.test(label);
  const helpMatch=/(?:مساعدة|لماذا أشارك|استفهام|share help|help button)/i.test(label)||/^[?؟]+$/.test(label.trim());
  if(legacyClass||shareMatch||helpMatch)removeControl(el);
 });
 const nav=document.querySelector('.dz-import-nav');
 if(nav){
  const routes=[['الرئيسية',root],['الأدوات الرقمية',root+'pages/tools/index.html'],['الخصوصية',root+'pages/privacy.html'],['سياسة الخصوصية',root+'pages/privacy.html'],['اتصل بنا',root+'pages/contact.html']];
  nav.querySelectorAll('a').forEach(a=>{const label=(a.textContent||'').trim();const match=routes.find(([name])=>name===label);if(match)a.href=match[1];});
 }
 const crumbs=document.querySelector('.tool-breadcrumb');
 if(crumbs)crumbs.querySelectorAll('a').forEach(a=>{const label=(a.textContent||'').trim();if(label==='الرئيسية')a.href=root;else if(['جميع الأدوات','الأدوات الرقمية','التصنيفات','الأدوات الصحية'].includes(label))a.href=root+'pages/tools/index.html';});
}
 // The upstream tools-dz app.js injects its own #share-help-tools section.
 // Remove that entire duplicate block (not just its two buttons), including
 // its injected stylesheet, and watch for any late re-injection.
 function removeToolsDzShareBlock(){
  document.getElementById('share-help-tools')?.remove();
  document.getElementById('share-help-tools-styles')?.remove();
  cleanupLegacyShareControls();
 }
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',removeToolsDzShareBlock,{once:true});
 }else{
  removeToolsDzShareBlock();
 }
 const shareCleanupObserver=new MutationObserver(()=>{
  if(document.getElementById('share-help-tools')||document.querySelector('.share-help-tools__share,.share-help-tools__help')){
   removeToolsDzShareBlock();
  }else{
   cleanupLegacyShareControls();
  }
 });
 shareCleanupObserver.observe(document.documentElement,{childList:true,subtree:true});

 // Fallback loader for imported pages.
 if (location.pathname.indexOf('/pages/tools/') !== -1 && !location.pathname.endsWith('/pages/tools/index.html') && !window.__dzUnifiedTemplateLoader) {
   window.__dzUnifiedTemplateLoader = true;
   const template = document.createElement('script');
   template.src = root + 'assets/js/tools/unified-tool-template.js';
   document.head.appendChild(template);
 }

})();
