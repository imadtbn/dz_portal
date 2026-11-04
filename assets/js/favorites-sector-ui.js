(function(){
 'use strict';
 if(!location.pathname.includes('/sectors/')) return;
 const hero=document.querySelector('.sector-hero');
 if(!hero || document.querySelector('[data-favorite-type="sector"]')) return;
 const canonical=document.querySelector('link[rel="canonical"]')?.href||location.href;
 let url;try{url=new URL(canonical,location.href)}catch(_){url=new URL(location.href)}
 const title=(hero.querySelector('h1,h2')?.textContent||document.querySelector('main h1,h1')?.textContent||document.title).replace(/\s+/g,' ').trim();
 const crumbs=document.querySelector('.breadcrumb .current, .breadcrumb [aria-current="page"], .breadcrumb-content [aria-current="page"]');
 const category=(crumbs?.textContent||'القطاعات والخدمات الحكومية').replace(/\s+/g,' ').trim();
 if(!document.querySelector('link[href*="favorites.css"]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../css/favorites.css?v=20261104-1',document.currentScript?.src||new URL('../js/favorites-sector-ui.js',location.href)).href;document.head.append(css);
 }
 const bar=document.createElement('div');bar.className='favorites-sector-action';
 const button=document.createElement('button');button.type='button';button.dataset.favoriteToggle='true';button.dataset.favoriteType='sector';button.dataset.favoriteId=url.pathname;button.dataset.favoriteTitle=title;button.dataset.favoriteUrl=url.href;button.dataset.favoriteCategory=category;button.dataset.addLabel='إضافة إلى المفضلات';button.dataset.removeLabel='إزالة من المفضلات';button.innerHTML='<i class="fa-regular fa-heart" aria-hidden="true"></i> <span data-favorite-label>إضافة للمفضلات</span>';
 const link=document.createElement('a');link.href=new URL('../pages/favorites.html',url).href;link.innerHTML='<i class="fa-solid fa-heart" aria-hidden="true"></i> عرض مفضلاتي';
 bar.append(button,link);hero.after(bar);
 window.DZFavorites?.refreshButtons();
})();