/* Load third-party tutorial players only after an explicit user action.
   The link remains usable as a fallback if this script is unavailable. */
(() => {
  'use strict';

  document.querySelectorAll('[data-video-on-demand]').forEach((player) => {
    const link = player.querySelector('[data-video-launch]');
    const template = player.querySelector('template[data-video-embed]');
    const iframe = template?.content?.querySelector('iframe[src]');
    if (!link || !iframe) return;

    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || (typeof event.button === 'number' && event.button !== 0) ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      const loadedFrame = iframe.cloneNode(true);
      // Attempt playback following the user's click; browsers may still require
      // Play within the iframe depending on their autoplay policy.
      const source = loadedFrame.getAttribute('src') || '';
      if (/youtube(?:-nocookie)?\.com\/embed\//.test(source)) {
        loadedFrame.setAttribute('src', source + (source.includes('?') ? '&' : '?') + 'autoplay=1&playsinline=1');
      } else if (/facebook\.com\/plugins\/video\.php/.test(source)) {
        loadedFrame.setAttribute('src', source + (source.includes('?') ? '&' : '?') + 'autoplay=true');
      }
      loadedFrame.setAttribute('loading', 'eager');
      loadedFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      link.replaceWith(loadedFrame);
      template.remove();
    });
  });
})();
