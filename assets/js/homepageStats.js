(() => {
  'use strict';

  const sectorCards = Array.from(
    document.querySelectorAll('.sectors-section .sector-card[href^="sectors/"]')
  );
  const sectorStat = document.querySelector('[data-homepage-stat="sectors"]');
  const serviceStat = document.querySelector('[data-homepage-stat="services"]');

  if (!sectorCards.length || !sectorStat || !serviceStat) return;

  const normalizePath = (href) => {
    const url = new URL(href, window.location.href);
    url.hash = '';
    url.search = '';
    return url.href;
  };

  const formatNumber = (value) => value.toLocaleString('en-US');
  const serviceLabel = (value) => value === 1 ? 'خدمة' : 'خدمات';

  const parseServiceCount = (documentRoot) => {
    const serviceItems = documentRoot.querySelectorAll('.service-item');
    if (serviceItems.length > 0) {
      return serviceItems.length;
    }

    return Array.from(documentRoot.querySelectorAll('.service-count'))
      .reduce((total, element) => {
        const match = element.textContent.match(/\d+/);
        return total + (match ? Number.parseInt(match[0], 10) : 0);
      }, 0);
  };

  const fallbackCardCount = (card) => {
    const text = card.querySelector('.sector-count')?.textContent || '';
    const match = text.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
  };

  const uniqueUrls = [...new Set(sectorCards.map((card) => normalizePath(card.href)))];

  const loadSectorCount = async (url) => {
    const cardsForUrl = sectorCards.filter((card) => normalizePath(card.href) === url);
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markup = await response.text();
      const parsedDocument = new DOMParser().parseFromString(markup, 'text/html');
      return { url, count: parseServiceCount(parsedDocument), loaded: true };
    } catch (error) {
      // Keep the homepage usable if one sector page is temporarily unavailable.
      const fallback = fallbackCardCount(cardsForUrl[0]);
      console.warn('تعذر تحميل عدد خدمات القطاع:', url, error);
      return { url, count: fallback, loaded: false };
    }
  };

  const updateCardCount = (url, count) => {
    sectorCards
      .filter((card) => normalizePath(card.href) === url)
      .forEach((card) => {
        const countElement = card.querySelector('.sector-count');
        if (!countElement) return;
        countElement.textContent = `${formatNumber(count)} ${serviceLabel(count)}`;
        countElement.dataset.serviceCount = String(count);
        countElement.setAttribute('aria-label', `${formatNumber(count)} ${serviceLabel(count)}`);
      });
  };

  Promise.all(uniqueUrls.map(loadSectorCount)).then((results) => {
    results.forEach(({ url, count }) => updateCardCount(url, count));

    const totalServices = results.reduce((total, result) => total + result.count, 0);
    sectorStat.textContent = formatNumber(uniqueUrls.length);
    serviceStat.textContent = formatNumber(totalServices);
    sectorStat.dataset.count = String(uniqueUrls.length);
    serviceStat.dataset.count = String(totalServices);
    sectorStat.setAttribute('aria-label', `${formatNumber(uniqueUrls.length)} قطاعًا حكوميًا`);
    serviceStat.setAttribute('aria-label', `${formatNumber(totalServices)} خدمة رقمية`);

    document.dispatchEvent(new CustomEvent('homepageStatsReady', {
      detail: {
        sectors: uniqueUrls.length,
        services: totalServices,
      },
    }));
  });
})();
