/* Homepage heavy-card images: defer source downloads until nearing the viewport.
   Preserves the original logo, alt text, dimensions, card layout and links. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('#sectors .sector-icon img[data-dz-src]')];
  if (!cards.length) return;

  const load = (img) => {
    const source = img.dataset.dzSrc;
    if (!source) return;
    img.src = source;
    img.removeAttribute('data-dz-src');
  };

  // Browser compatibility and accessibility: never leave images unloaded when
  // IntersectionObserver is unavailable.
  if (!('IntersectionObserver' in window)) {
    cards.forEach(load);
    return;
  }

  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      load(target);
      instance.unobserve(target);
    });
  }, { rootMargin: '800px 0px', threshold: 0 });

  cards.forEach((img) => observer.observe(img));
})();
