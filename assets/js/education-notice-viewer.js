(() => {
  "use strict";
  const image = document.getElementById('bulletinImage');
  const frame = document.getElementById('bulletinImageArea');
  if (!image || !frame) return;
  const plus = document.getElementById('bulletinZoomIn');
  const minus = document.getElementById('bulletinZoomOut');
  const reset = document.getElementById('bulletinZoomReset');
  const label = document.getElementById('bulletinZoomLabel');
  const status = document.getElementById('bulletinStatus');
  let scale = 1;
  function zoom(next) {
    scale = Math.min(2.5, Math.max(1, Math.round(next * 4) / 4));
    image.style.width = String(scale * 100) + '%';
    label.textContent = Math.round(scale * 100) + '%';
  }
  plus?.addEventListener('click', () => zoom(scale + .25));
  minus?.addEventListener('click', () => zoom(scale - .25));
  reset?.addEventListener('click', () => zoom(1));
  document.getElementById('bulletinPrint')?.addEventListener('click', () => window.print());
  document.getElementById('bulletinShare')?.addEventListener('click', async () => {
    const url = location.href;
    const title = document.querySelector('h1')?.textContent || document.title;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        if (status) status.textContent = 'تم نسخ رابط البلاغ.';
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (status) status.textContent = copied ? 'تم نسخ رابط البلاغ.' : 'يمكن نسخ الرابط من شريط العنوان.';
      }
    } catch (err) {
      if (err?.name !== 'AbortError' && status) status.textContent = 'تعذرت المشاركة. يمكنك نسخ الرابط من شريط العنوان.';
    }
  });
})();
