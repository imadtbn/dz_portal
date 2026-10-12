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
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      const loadedFrame = iframe.cloneNode(true);
      loadedFrame.setAttribute('loading', 'eager');
      loadedFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      link.replaceWith(loadedFrame);
      template.remove();
    }, { once: true });
  });
})();
