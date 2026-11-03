(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const amountInput = $('ntw-amount');
  const result = $('ntw-result');
  const error = $('ntw-error');
  const status = $('ntw-status');
  const formal = $('ntw-formal');
  const showNumber = $('ntw-show-number');
  const MAX_AMOUNT = 999999999999.99;
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function underHundred(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10, ten = Math.floor(n / 10);
    return unit ? ones[unit] + ' و' + tens[ten] : tens[ten];
  }
  function underThousand(n) {
    const h = Math.floor(n / 100), rest = n % 100;
    if (!h) return underHundred(rest);
    return rest ? hundreds[h] + ' و' + underHundred(rest) : hundreds[h];
  }
  function groupWords(n, singular, dual, plural, accusative) {
    if (n === 1) return singular;
    if (n === 2) return dual;
    if (n >= 3 && n <= 10) return underThousand(n) + ' ' + plural;
    return underThousand(n) + ' ' + accusative;
  }
  function integerWords(value) {
    if (value === 0) return 'صفر';
    let n = value;
    const parts = [];
    const scales = [
      {value: 1000000000, singular: 'مليار', dual: 'ملياران', plural: 'مليارات', accusative: 'مليارًا'},
      {value: 1000000, singular: 'مليون', dual: 'مليونان', plural: 'ملايين', accusative: 'مليونًا'},
      {value: 1000, singular: 'ألف', dual: 'ألفان', plural: 'آلاف', accusative: 'ألفًا'}
    ];
    for (const scale of scales) {
      const group = Math.floor(n / scale.value);
      if (group) {
        parts.push(groupWords(group, scale.singular, scale.dual, scale.plural, scale.accusative));
        n %= scale.value;
      }
    }
    if (n) parts.push(underThousand(n));
    return parts.join(' و');
  }
  function currencyWords(n, type) {
    if (type === 'dinar') {
      if (n === 0) return 'صفر دينار جزائري';
      if (n === 1) return 'دينار جزائري واحد';
      if (n === 2) return 'ديناران جزائريان';
      if (n >= 3 && n <= 10) return integerWords(n) + ' دنانير جزائرية';
      if (n >= 100 && n % 100 === 0) return integerWords(n) + ' دينار جزائري';
      return integerWords(n) + ' دينارًا جزائريًا';
    }
    if (n === 0) return '';
    if (n === 1) return 'سنتيم واحد';
    if (n === 2) return 'سنتيمان';
    if (n >= 3 && n <= 10) return integerWords(n) + ' سنتيمات';
    return integerWords(n) + ' سنتيمًا';
  }
  function parseAmount(raw) {
    let s = String(raw || '').trim().replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06f0-\u06f9]/g, d => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[\s\u00a0\u202f]/g, '').replace(/د\.ج|دج|DZD/gi, '');
    if (!s) throw new Error('أدخل المبلغ بالأرقام أولًا.');
    if (!/^[+]?\d[\d.,]*$/.test(s)) throw new Error('استخدم الأرقام والفاصلة أو النقطة فقط، دون رموز أخرى.');
    s = s.replace(/^\+/, '');
    const commas = (s.match(/,/g) || []).length, dots = (s.match(/\./g) || []).length;
    if (commas && dots) {
      const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
      const grouping = decimal === ',' ? /\./g : /,/g;
      s = s.replace(grouping, '').replace(decimal, '.');
    } else if (commas) {
      if (commas > 1) {
        const last = s.lastIndexOf(',');
        s = s.slice(0, last).replace(/,/g, '') + '.' + s.slice(last + 1);
      } else if (/^\d{1,3},\d{3}$/.test(s)) {
        s = s.replace(',', '');
      } else s = s.replace(',', '.');
    } else if (dots > 1) {
      const last = s.lastIndexOf('.');
      s = s.slice(0, last).replace(/\./g, '') + '.' + s.slice(last + 1);
    } else if (/^\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace('.', '');
    }
    if (!/^\d+(?:\.\d{0,2})?$/.test(s)) throw new Error('استخدم منزلتين عشريتين كحد أقصى لتمثيل السنتيم.');
    const [wholeText, fractionText = ''] = s.split('.');
    const whole = Number(wholeText);
    const cents = Number((fractionText + '00').slice(0, 2));
    if (!Number.isSafeInteger(whole) || whole < 0 || whole > 999999999999 || whole + cents / 100 > MAX_AMOUNT) {
      throw new Error('المبلغ أكبر من الحد الذي تدعمه الأداة.');
    }
    return {whole, cents, normalized: whole + cents / 100};
  }
  function formatNumber(n, digits = 2) {
    return new Intl.NumberFormat('fr-DZ', {maximumFractionDigits: digits}).format(n);
  }
  function buildText(parsed) {
    const chunks = [currencyWords(parsed.whole, 'dinar')];
    const centsText = currencyWords(parsed.cents, 'centime');
    if (centsText) chunks.push(centsText);
    let text = chunks.join(' و');
    if (showNumber.checked) text = formatNumber(parsed.normalized) + ' د.ج — ' + text;
    if (formal.checked) text = 'فقط ' + text + ' لا غير';
    return text + (/[.!؟]$/.test(text) ? '' : '.');
  }
  function render() {
    status.textContent = '';
    try {
      const parsed = parseAmount(amountInput.value);
      error.hidden = true;
      error.textContent = '';
      result.textContent = buildText(parsed);
      amountInput.setAttribute('aria-invalid', 'false');
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      result.textContent = 'أدخل مبلغًا صحيحًا لعرضه بالحروف.';
      amountInput.setAttribute('aria-invalid', 'true');
    }
  }
  amountInput.addEventListener('input', render);
  formal.addEventListener('change', render);
  showNumber.addEventListener('change', render);
  document.querySelectorAll('.ntw-example').forEach(button => {
    button.addEventListener('click', () => {
      amountInput.value = button.dataset.amount || '';
      render();
      amountInput.focus();
    });
  });
  $('ntw-clear').addEventListener('click', () => {
    amountInput.value = '';
    render();
    amountInput.focus();
  });
  $('ntw-copy').addEventListener('click', async () => {
    if (!error.hidden) { status.textContent = 'صحّح المبلغ قبل النسخ.'; return; }
    try {
      await navigator.clipboard.writeText(result.textContent);
      status.textContent = 'تم نسخ الصياغة.';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(result);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'تعذر النسخ التلقائي؛ حُددت النتيجة. انسخها يدويًا.';
    }
  });
  $('ntw-print').addEventListener('click', () => {
    if (!error.hidden) { status.textContent = 'صحّح المبلغ قبل الطباعة.'; return; }
    window.print();
  });
  render();
})();
