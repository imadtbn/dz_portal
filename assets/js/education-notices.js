(() => {
  'use strict';
  const section = document.getElementById('official-notice');
  if (!section) return;
  const status = section.querySelector('[data-notice-status]');
  section.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-notice-share]');
    if (!button || !section.contains(button)) return;
    const href = button.getAttribute('data-notice-share');
    if (!href) return;
    const url = new URL(href, document.baseURI).href;
    const title = button.closest('.education-notice-card')?.querySelector('h4')?.textContent?.trim() || 'بيان رسمي';
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
        if (status) status.textContent = copied ? 'تم نسخ رابط البلاغ.' : 'تعذر نسخ الرابط، يمكنك فتح البلاغ ومشاركة عنوانه.';
      }
    } catch (error) {
      if (error?.name !== 'AbortError' && status) status.textContent = 'تعذرت المشاركة. افتح البلاغ لنسخ عنوانه.';
    }
  });
})();
