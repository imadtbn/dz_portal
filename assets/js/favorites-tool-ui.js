(function(){
 'use strict';
 if(!location.pathname.includes('/pages/tools/')) return;
 if(/\/pages\/tools\/(?:index\.html)?$/.test(location.pathname)) return;
 if(document.querySelector('[data-favorite-type="tool"]')) return;
 const canonical=document.querySelector('link[rel="canonical"]')?.href||location.href;
 let url;try{url=new URL(canonical,location.href)}catch(_){url=new URL(location.href)}
 const heading=document.querySelector('main h1, .tool-hero h1, .page-intro h1, h1');
 const title=(heading?.textContent||document.title).replace(/\s+/g,' ').trim();
 const category=(document.querySelector('.breadcrumb [aria-current="page"], .breadcrumb .current, .tool-category')?.textContent||'الأدوات الرقمية').replace(/\s+/g,' ').trim();
 if(!document.querySelector('link[href*="favorites.css"]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../css/favorites.css?v=20261104-2',document.currentScript?.src||new URL('../js/favorites-tool-ui.js',location.href)).href;document.head.append(css);
 }
 const bar=document.createElement('div');bar.className='favorites-tool-action';
 const button=document.createElement('button');button.type='button';button.dataset.favoriteToggle='true';button.dataset.favoriteType='tool';button.dataset.favoriteId=url.pathname;button.dataset.favoriteTitle=title;button.dataset.favoriteUrl=url.href;button.dataset.favoriteCategory=category;button.dataset.addLabel='إضافة إلى المفضلات';button.dataset.removeLabel='إزالة من المفضلات';button.innerHTML='<i class="fa-regular fa-heart" aria-hidden="true"></i> <span data-favorite-label>إضافة للمفضلات</span>';
 const link=document.createElement('a');link.href=new URL('../../favorites.html',url).href;link.innerHTML='<i class="fa-solid fa-heart" aria-hidden="true"></i> عرض مفضلاتي';
 bar.append(button,link);
 const anchor=document.querySelector('main .hero, main .page-intro, main .tool-hero, main .page-hero');
 if(anchor)anchor.after(bar);else if(heading)heading.parentElement.after(bar);else document.querySelector('main')?.prepend(bar);
 window.DZFavorites?.refreshButtons();
})();