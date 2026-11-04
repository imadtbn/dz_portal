/* DZ Portal favorites: local-first, deduplicated and safe for static hosting. */
(function () {
  'use strict';
  if (window.DZFavorites) return;

  const STORAGE_KEY = 'dzPortalFavorites:v1';
  const TYPES = new Set(['sector', 'tool', 'schedule']);
  const baseUrl = 'https://imadtbn.github.io/dz_portal/';
  const text = (value, max = 240) => String(value == null ? '' : value).trim().slice(0, max);
  const safeUrl = (value) => {
    try {
      const url = new URL(value || baseUrl, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return baseUrl;
      return url.href;
    } catch (_) { return baseUrl; }
  };
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(item => item && TYPES.has(item.type) && item.id && item.title && item.url)
        .map(item => ({
          type: item.type,
          id: text(item.id, 300),
          title: text(item.title),
          url: safeUrl(item.url),
          category: text(item.category, 160),
          from: text(item.from, 100),
          to: text(item.to, 100),
          routeId: text(item.routeId, 160),
          savedAt: Number(item.savedAt) || Date.now()
        }));
    } catch (_) { return []; }
  }
  function write(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('dz:favorites-changed', { detail: { count: items.length } }));
      return true;
    } catch (error) {
      console.warn('DZ Portal: تعذر حفظ المفضلات على هذا الجهاز.', error);
      return false;
    }
  }
  function key(type, id) { return type + ':' + String(id); }
  function has(type, id) { return read().some(item => key(item.type, item.id) === key(type, id)); }
  function add(input) {
    if (!input || !TYPES.has(input.type) || !text(input.id, 300) || !text(input.title) || !input.url) return false;
    const item = {
      type: input.type,
      id: text(input.id, 300),
      title: text(input.title),
      url: safeUrl(input.url),
      category: text(input.category, 160),
      from: text(input.from, 100),
      to: text(input.to, 100),
      routeId: text(input.routeId, 160),
      savedAt: Date.now()
    };
    const items = read().filter(saved => key(saved.type, saved.id) !== key(item.type, item.id));
    items.unshift(item);
    return write(items);
  }
  function remove(type, id) { return write(read().filter(item => key(item.type, item.id) !== key(type, id))); }
  function toggle(input) {
    if (has(input.type, input.id)) { remove(input.type, input.id); return false; }
    return add(input);
  }
  function refreshButtons(root = document) {
    root.querySelectorAll('[data-favorite-toggle]').forEach(button => {
      const active = has(button.dataset.favoriteType, button.dataset.favoriteId);
      button.classList.toggle('is-favorite', active);
      button.setAttribute('aria-pressed', String(active));
      const label = active ? (button.dataset.removeLabel || 'إزالة من المفضلات') : (button.dataset.addLabel || 'إضافة إلى المفضلات');
      button.setAttribute('aria-label', label);
      const labelNode = button.querySelector('[data-favorite-label]');
      if (labelNode) labelNode.textContent = active ? 'في المفضلات' : 'إضافة للمفضلات';
      const icon = button.querySelector('i');
      if (icon) { icon.classList.toggle('fa-solid', active); icon.classList.toggle('fa-regular', !active); }
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-favorite-toggle]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const item = {
      type: button.dataset.favoriteType,
      id: button.dataset.favoriteId,
      title: button.dataset.favoriteTitle,
      url: button.dataset.favoriteUrl,
      category: button.dataset.favoriteCategory || '',
      from: button.dataset.favoriteFrom || '',
      to: button.dataset.favoriteTo || '',
      routeId: button.dataset.favoriteRouteId || ''
    };
    const wasSaved = has(item.type, item.id);
    const ok = wasSaved ? remove(item.type, item.id) : add(item);
    if (!ok && !wasSaved) {
      const status = document.getElementById('favorites-status');
      if (status) status.textContent = 'تعذر حفظ المفضلات. تحقق من مساحة التخزين في المتصفح.';
      return;
    }
    refreshButtons();
    const status = document.getElementById('favorites-status');
    if (status) status.textContent = wasSaved ? 'تمت الإزالة من المفضلات.' : 'تمت الإضافة إلى المفضلات.';
  });
  document.addEventListener('DOMContentLoaded', () => refreshButtons());
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) refreshButtons(); });
  window.addEventListener('dz:favorites-changed', () => refreshButtons());
  window.DZFavorites = Object.freeze({ key: STORAGE_KEY, list: read, has, add, remove, toggle, refreshButtons });
})();