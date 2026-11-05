
'use strict';
(() => {
  const API = 'https://api.frankfurter.dev/v2';
  const RATE_CACHE = 'tools_dz_currency_v2_rates';
  const selectFrom = document.getElementById('from-currency');
  const selectTo = document.getElementById('to-currency');
  const amount = document.getElementById('amount');
  const result = document.getElementById('result-amount');
  const status = document.getElementById('api-status');
  const summary = document.getElementById('currency-rate');
  const inverse = document.getElementById('currency-inverse');
  const trend = document.getElementById('currency-trend');
  const empty = document.getElementById('currency-graph-empty');
  const chartCanvas = document.getElementById('currency-chart');
  const periods = [...document.querySelectorAll('.currency-period')];
  const names = {
    DZD:'دينار جزائري',EUR:'يورو',USD:'دولار أمريكي',GBP:'جنيه إسترليني',
    CAD:'دولار كندي',AUD:'دولار أسترالي',CHF:'فرنك سويسري',
    JPY:'ين ياباني',CNY:'يوان صيني',SAR:'ريال سعودي',AED:'درهم إماراتي',
    TND:'دينار تونسي',MAD:'درهم مغربي',EGP:'جنيه مصري',TRY:'ليرة تركية',
    QAR:'ريال قطري',KWD:'دينار كويتي',BHD:'دينار بحريني',OMR:'ريال عماني',
    JOD:'دينار أردني',LYD:'دينار ليبي',INR:'روبية هندية',RUB:'روبل روسي',
    BRL:'ريال برازيلي',KRW:'وون كوري',SGD:'دولار سنغافوري',NZD:'دولار نيوزيلندي',
    SEK:'كرونة سويدية',NOK:'كرونة نرويجية',DKK:'كرونة دنماركية',
    PLN:'زلوتي بولندي',ZAR:'راند جنوب أفريقي',MXN:'بيزو مكسيكي',
    HKD:'دولار هونغ كونغ',THB:'بات تايلندي',IDR:'روبية إندونيسية'
  };
  const displayNames = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['ar'], {type:'currency'}) : null;
  const num = new Intl.NumberFormat('ar-DZ-u-nu-latn', {maximumFractionDigits:6});
  let rates = null, date = '', chart = null, duration = 30, chartRequest = 0, historyAbort = null;
  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || 'ready';
  }
  function currencyLabel(code) {
    return (names[code] || (displayNames && displayNames.of(code)) || code) + ' (' + code + ')';
  }
  function populate(codes) {
    const oldFrom = selectFrom.value || 'EUR';
    const oldTo = selectTo.value || 'DZD';
    const sorted = [...new Set(codes)].sort((a,b) => {
      const priority = ['DZD','EUR','USD','GBP','CAD','TND','MAD','SAR','AED'];
      const ai = priority.indexOf(a), bi = priority.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return currencyLabel(a).localeCompare(currencyLabel(b), 'ar');
    });
    for (const select of [selectFrom, selectTo]) {
      select.replaceChildren(...sorted.map(code => new Option(currencyLabel(code), code)));
    }
    selectFrom.value = sorted.includes(oldFrom) ? oldFrom : 'EUR';
    selectTo.value = sorted.includes(oldTo) ? oldTo : 'DZD';
  }
  async function getJSON(url, signal) {
    const response = await fetch(url, {signal, headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }
  function convert() {
    if (!rates) return;
    const from = selectFrom.value, to = selectTo.value;
    const a = Number(amount.value);
    const base = from === 'USD' ? 1 : rates[from];
    const quote = to === 'USD' ? 1 : rates[to];
    if (!Number.isFinite(a) || a < 0 || !base || !quote) {
      result.value = 'غير متاح'; summary.textContent = '—'; inverse.textContent = '—'; return;
    }
    const r = quote / base;
    result.value = num.format(a * r);
    summary.textContent = '1 ' + from + ' = ' + num.format(r) + ' ' + to;
    inverse.textContent = '1 ' + to + ' = ' + num.format(1/r) + ' ' + from;
  }
  function applyRates(rows, stamp) {
    const next = {USD:1};
    for (const row of rows) {
      if (row.base === 'USD' && Number.isFinite(row.rate) && row.rate > 0) next[row.quote] = row.rate;
    }
    if (!next.DZD || !next.EUR) throw new Error('Required currencies missing');
    rates = next;
    date = rows.reduce((latest,row) => row.date > latest ? row.date : latest, '') || stamp;
    populate(Object.keys(next));
    convert();
    setStatus('الأسعار المرجعية بتاريخ ' + date + ' · مصدر: Frankfurter', 'ready');
  }
  async function loadRates(force) {
    setStatus('جارٍ تحميل أسعار الصرف المرجعية...', 'loading');
    const stored = (() => { try {return JSON.parse(localStorage.getItem(RATE_CACHE));}catch{return null;} })();
    if (!force && stored && Date.now()-stored.savedAt < 4*3600000) {
      try { applyRates(stored.rows, stored.date); setStatus('أسعار مخزنة · بيانات ' + date, 'cached'); return; } catch {}
    }
    try {
      const rows = await getJSON(API + '/rates?base=USD');
      if (!Array.isArray(rows)) throw new Error('Invalid response');
      applyRates(rows);
      try { localStorage.setItem(RATE_CACHE, JSON.stringify({rows,date,savedAt:Date.now()})); } catch {}
    } catch (error) {
      console.error('Currency rates:', error);
      if (stored && Array.isArray(stored.rows)) {
        try {
          applyRates(stored.rows, stored.date);
          setStatus('تعذر التحديث · عرض آخر أسعار مخزنة بتاريخ ' + date, 'cached');
          return;
        } catch {}
      }
      rates = null; result.value = 'غير متاح';
      setStatus('تعذر جلب الأسعار. تأكد من الاتصال وأعد المحاولة.', 'error');
    }
  }
  function isoDaysAgo(days) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0,10);
  }
  function renderChart(points, from, to) {
    if (chart) {chart.destroy(); chart=null;}
    if (!points.length) {empty.textContent='لا تتوفر بيانات تاريخية لهذا الزوج خلال الفترة المحددة.';empty.dataset.show='true';trend.textContent='';return;}
    empty.dataset.show='false';
    const first=points[0].rate,last=points[points.length-1].rate;
    const delta=(last/first-1)*100;
    trend.dataset.direction=delta>0?'up':delta<0?'down':'flat';
    trend.textContent='التغير خلال الفترة: ' + (delta>0?'+':'') + delta.toFixed(2) + '% · ' + (delta>0?'ارتفاع':delta<0?'انخفاض':'دون تغير') + ' قيمة ' + from + ' مقابل ' + to;
    if (typeof Chart === 'undefined') {empty.textContent='تعذر تحميل مكتبة المخطط. بيانات الفترة: من ' + num.format(first) + ' إلى ' + num.format(last);empty.dataset.show='true';return;}
    const color=delta>=0?'#159564':'#d45353';
    chart=new Chart(chartCanvas,{
      type:'line',
      data:{labels:points.map(p=>p.date),datasets:[{label:from+' / '+to,data:points.map(p=>p.rate),borderColor:color,backgroundColor:delta>=0?'#15956415':'#d4535315',fill:true,tension:.23,pointRadius:points.length>55?0:2,pointHoverRadius:5,borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'1 '+from+' = '+num.format(ctx.parsed.y)+' '+to}}},
        scales:{x:{ticks:{maxTicksLimit:7,maxRotation:0}},y:{beginAtZero:false,ticks:{callback:v=>num.format(v)}}}}
    });
  }
  async function loadHistory() {
    if (!rates) return;
    const request=++chartRequest;
    if (historyAbort) historyAbort.abort();
    historyAbort=new AbortController();
    const from=selectFrom.value,to=selectTo.value;
    trend.textContent='جارٍ تحميل البيانات التاريخية...';
    empty.dataset.show='false';
    if (from === to) {
      renderChart([{date:isoDaysAgo(duration),rate:1},{date:isoDaysAgo(0),rate:1}],from,to);
      return;
    }
    const url=API+'/rates?from='+isoDaysAgo(duration+4)+'&base='+encodeURIComponent(from)+'&quotes='+encodeURIComponent(to);
    try {
      const rows=await getJSON(url,historyAbort.signal);
      if (request!==chartRequest) return;
      if (!Array.isArray(rows)) throw new Error('Invalid history');
      const points=rows.filter(r=>r.base===from&&r.quote===to&&Number.isFinite(r.rate)&&r.rate>0)
        .map(r=>({date:r.date,rate:r.rate})).sort((a,b)=>a.date.localeCompare(b.date))
        .filter(p=>p.date>=isoDaysAgo(duration));
      renderChart(points,from,to);
    } catch (error) {
      if (error.name==='AbortError' || request!==chartRequest) return;
      console.error('Currency history:',error);
      if(chart){chart.destroy();chart=null;}
      trend.textContent='';
      empty.textContent='البيانات التاريخية غير متاحة حاليًا لهذا الزوج. يمكنك إعادة المحاولة أو اختيار عملتين أخريين.';
      empty.dataset.show='true';
    }
  }
  document.getElementById('swap-btn').addEventListener('click',()=>{
    const old=selectFrom.value;
    selectFrom.value=selectTo.value;selectTo.value=old;
    convert();loadHistory();
  });
  amount.addEventListener('input',convert);
  for (const select of [selectFrom,selectTo]) select.addEventListener('change',()=>{convert();loadHistory();});
  for(const button of periods) button.addEventListener('click',()=>{
    duration=Number(button.dataset.days);
    periods.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    loadHistory();
  });
  document.getElementById('currency-refresh').addEventListener('click',async()=>{await loadRates(true);await loadHistory();});
  loadRates(false).then(loadHistory);
})();
