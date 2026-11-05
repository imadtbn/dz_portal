(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KAABA = { lat: 21.422487, lon: 39.826206 };
  const state = { lat: null, lon: null, name: '', bearing: null, heading: null, sensor: false, permissionRequested: false };
  const normalize = angle => ((angle % 360) + 360) % 360;
  const format = (n, digits = 1) => new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: digits }).format(n);
  const directionName = deg => {
    const names = ['الشمال','الشمال الشرقي','الشرق','الجنوب الشرقي','الجنوب','الجنوب الغربي','الغرب','الشمال الغربي'];
    return names[Math.round(normalize(deg) / 45) % 8];
  };
  function calculate(lat, lon) {
    const p1 = lat * Math.PI / 180, p2 = KAABA.lat * Math.PI / 180;
    const dLon = (KAABA.lon - lon) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
    const bearing = normalize(Math.atan2(y, x) * 180 / Math.PI);
    const dLat = (KAABA.lat - lat) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0,1-a)));
    return { bearing, distance };
  }
  function render() {
    if (state.lat === null || state.lon === null || state.bearing === null) return;
    $('qibla-bearing').textContent = format(state.bearing, 1) + '°';
    $('qibla-distance').textContent = format(calculate(state.lat,state.lon).distance, 0) + ' كم';
    $('qibla-location-summary').innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i><span></span>';
    $('qibla-location-summary').querySelector('span').textContent = state.name + ' — اتجاه القبلة ' + format(state.bearing,1) + '° من الشمال الحقيقي (' + directionName(state.bearing) + ').';
    $('qibla-heading-value').textContent = state.heading === null ? 'غير متاح' : format(state.heading,0) + '°';
    $('qibla-dial').style.transform = 'rotate(' + (-(state.heading ?? 0)) + 'deg)';
    $('qibla-needle').style.transform = 'rotate(' + (state.bearing - (state.heading ?? 0)) + 'deg)';
    $('qibla-north-pointer').style.transform = 'rotate(' + (-(state.heading ?? 0)) + 'deg)';
    $('qibla-compass').setAttribute('aria-label', 'اتجاه القبلة ' + format(state.bearing,1) + ' درجة من الشمال الحقيقي' + (state.heading === null ? '' : '، اتجاه الهاتف ' + format(state.heading,0) + ' درجة'));
  }
  function setLocation(lat, lon, name) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return;
    state.lat=lat; state.lon=lon; state.name=name;
    state.bearing=calculate(lat,lon).bearing;
    render();
    $('qibla-search-status').textContent = 'تم تحديد الموقع وحساب اتجاه القبلة.';
    try { localStorage.setItem('tools-dz-qibla-place', JSON.stringify({lat,lon,name})); } catch (_) {}
  }
  function setStatus(message) { $('qibla-search-status').textContent = message; }
  async function searchCity(query) {
    const results = $('qibla-city-results');
    results.hidden = false; results.replaceChildren();
    setStatus('جارٍ البحث عن المدن…');
    try {
      const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=8&language=ar&format=json';
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error('search');
      const data = await response.json();
      const places = data.results || [];
      if (!places.length) { setStatus('لم نعثر على مدينة مطابقة. جرّب الاسم باللغة العربية أو اللاتينية.'); results.hidden=true; return; }
      setStatus('اختر الموقع الصحيح من النتائج:');
      places.forEach(place => {
        const button = document.createElement('button');
        button.type='button'; button.className='qibla-city-option'; button.setAttribute('role','option');
        const label = [place.name, place.admin1, place.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('، ');
        button.textContent = label + (place.latitude != null && place.longitude != null ? '' : '');
        button.addEventListener('click', () => { setLocation(Number(place.latitude), Number(place.longitude), label); results.hidden=true; });
        results.appendChild(button);
      });
    } catch (_) {
      results.hidden=true;
      setStatus('تعذر البحث عن المدن الآن. تحقق من اتصال الإنترنت أو استخدم موقعك الحالي.');
    }
  }
  $('qibla-search-form').addEventListener('submit', event => {
    event.preventDefault();
    const query = $('qibla-city-search').value.trim();
    if (query.length < 2) { setStatus('اكتب اسم مدينة من حرفين على الأقل.'); return; }
    searchCity(query);
  });
  $('qibla-geolocate').addEventListener('click', () => {
    if (!navigator.geolocation) { setStatus('المتصفح لا يدعم تحديد الموقع. ابحث عن اسم المدينة بدلًا من ذلك.'); return; }
    setStatus('جارٍ تحديد موقعك… وافق على طلب الموقع عند ظهوره.');
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude,longitude,accuracy } = position.coords;
      setLocation(latitude, longitude, 'موقعي الحالي');
      $('qibla-location-summary').querySelector('span').textContent += ' دقة تحديد الموقع المعلنة: نحو ' + format(accuracy,0) + ' متر.';
    }, error => {
      const message = error.code===1 ? 'لم يُسمح بالوصول إلى الموقع. يمكنك البحث عن مدينتك يدويًا.' : error.code===2 ? 'تعذر تحديد الموقع الحالي. جرّب البحث عن اسم المدينة.' : 'انتهت مهلة تحديد الموقع. حاول مجددًا أو ابحث عن المدينة.';
      setStatus(message);
    }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
  });
  function onOrientation(event) {
    let heading = null;
    if (typeof event.webkitCompassHeading === 'number') heading = event.webkitCompassHeading;
    else if (event.absolute === true && typeof event.alpha === 'number') heading = 360 - event.alpha;
    else if (typeof event.alpha === 'number' && event.absolute === true) heading = 360 - event.alpha;
    if (heading === null || !Number.isFinite(heading)) return;
    state.heading=normalize(heading);
    state.sensor=true;
    $('qibla-sensor-badge').dataset.state='ready';
    $('qibla-sensor-badge').textContent='المستشعر يعمل';
    $('qibla-sensor-help').textContent='تم استقبال بيانات الاتجاه. قد تتأثر الدقة بالمعادن والمغناطيس وبطريقة دعم المتصفح للمستشعر.';
    render();
  }
  async function enableSensor() {
    const DeviceOrientation = window.DeviceOrientationEvent;
    if (!DeviceOrientation) { sensorError('هذا الجهاز أو المتصفح لا يوفّر مستشعر اتجاه مدعومًا.'); return; }
    try {
      if (typeof DeviceOrientation.requestPermission === 'function') {
        const permission = await DeviceOrientation.requestPermission();
        if (permission !== 'granted') { sensorError('لم يتم منح إذن مستشعر الاتجاه.'); return; }
      }
      window.addEventListener('deviceorientation', onOrientation, true);
      window.addEventListener('deviceorientationabsolute', onOrientation, true);
      $('qibla-sensor-badge').dataset.state='idle';
      $('qibla-sensor-badge').textContent='بانتظار بيانات المستشعر';
      $('qibla-sensor-help').textContent='حرّك الهاتف ببطء وانتظر ظهور القراءة. إذا لم تظهر، فقد لا يدعم المتصفح مستشعر الاتجاه.';
      state.permissionRequested=true;
      if (window.isSecureContext === false) $('qibla-sensor-help').textContent='يتطلب مستشعر الاتجاه اتصالًا آمنًا HTTPS. افتح الموقع عبر عنوانه الرسمي.';
    } catch (_) { sensorError('تعذر تفعيل المستشعر. تحقق من الأذونات وحاول مجددًا.'); }
  }
  function sensorError(message) {
    $('qibla-sensor-badge').dataset.state='error';
    $('qibla-sensor-badge').textContent='المستشعر غير متاح';
    $('qibla-sensor-help').textContent=message + ' سيظل حساب زاوية القبلة متاحًا.';
  }
  $('qibla-enable-sensor').addEventListener('click', enableSensor);
  $('qibla-reset').addEventListener('click', () => {
    state.heading=null; state.sensor=false;
    $('qibla-sensor-badge').dataset.state='idle';
    $('qibla-sensor-badge').textContent='المستشعر غير مفعّل';
    $('qibla-sensor-help').textContent='أعيد ضبط عرض البوصلة. يمكن تفعيل المستشعر من جديد.';
    render();
  });
  $('qibla-share').addEventListener('click', async () => {
    const shareData={title:document.title,text:'بوصلة القبلة وتحديد الشمال — Tools DZ',url:location.href};
    try { if (navigator.share) await navigator.share(shareData); else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(location.href); $('qibla-share').innerHTML='<i class="fa-solid fa-check" aria-hidden="true"></i> تم نسخ الرابط'; setTimeout(()=>{$('qibla-share').innerHTML='<i class="fa-solid fa-share-nodes" aria-hidden="true"></i> مشاركة'},2200); } else window.prompt('انسخ رابط الأداة:',location.href); } catch (error) { if (error.name!=='AbortError') window.prompt('انسخ رابط الأداة:',location.href); }
  });
  $('qibla-help-toggle').addEventListener('click', () => {
    const panel=$('qibla-help-panel'), open=panel.hidden;
    panel.hidden=!open; $('qibla-help-toggle').setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.qibla-help-wrap')) { $('qibla-help-panel').hidden=true; $('qibla-help-toggle').setAttribute('aria-expanded','false'); }
    if (!event.target.closest('.qibla-search-form')) $('qibla-city-results').hidden=true;
  });
  $('current-year').textContent=new Date().getFullYear();
  try {
    const saved=JSON.parse(localStorage.getItem('tools-dz-qibla-place')||'null');
    if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) setLocation(saved.lat,saved.lon,saved.name||'الموقع المحفوظ');
  } catch (_) {}
})();