const SITE_LOCALE = (document.documentElement.lang || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
const localeText = (arabic, english) => SITE_LOCALE === 'en' ? english : arabic;

(() => {
  const { formatNumber, getNumber, showError, clearError, validRange, shareResult } = window.CalorieApp;

  function initCalorie() {
    const form = document.getElementById('calorie-form'); if (!form) return;
    const result = document.getElementById('calorie-result'); const empty = document.getElementById('calorie-empty');
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError('calorie-error');
      const age = getNumber('age'), weight = getNumber('weight'), height = getNumber('height');
      const gender = form.querySelector('input[name="gender"]:checked')?.value || 'male';
      const activity = Number(document.getElementById('activity')?.value || 1.2);
      const goal = document.getElementById('goal')?.value || 'maintain';
      if (!validRange(age, 13, 100) || !validRange(weight, 25, 350) || !validRange(height, 100, 240)) { showError('calorie-error', localeText("تحقق من القيم: العمر بين 13 و100 سنة، والوزن والطول ضمن نطاق منطقي.", "Check values: age between 13 and 100 years, and weight and height within a reasonable range.")); return; }
      const bmr = gender === 'female' ? (10 * weight + 6.25 * height - 5 * age - 161) : (10 * weight + 6.25 * height - 5 * age + 5);
      const tdee = bmr * activity;
      const multiplier = goal === 'lose' ? .8 : goal === 'gain' ? 1.12 : 1;
      const target = Math.max(1200, tdee * multiplier);
      const low = Math.max(1100, target - 150), high = target + 150;
      document.getElementById('calorie-target').textContent = formatNumber(target);
      document.getElementById('calorie-bmr').textContent = formatNumber(bmr);
      document.getElementById('calorie-tdee').textContent = formatNumber(tdee);
      document.getElementById('calorie-range').textContent = `${formatNumber(low)} – ${formatNumber(high)}`;
      document.getElementById('calorie-explanation').textContent = goal === 'lose' ? localeText("هذا التقدير يتضمن عجزًا معتدلًا قد يساعد على خسارة الوزن تدريجيًا.", "This estimate includes a moderate deficit that may help with gradual weight loss.") : goal === 'gain' ? localeText("هذا التقدير يتضمن فائضًا بسيطًا قد يساعد على زيادة الوزن تدريجيًا.", "This estimate includes a slight surplus that may help with gradual weight gain.") : localeText("هذا التقدير قريب من احتياجك للمحافظة على وزنك الحالي.", "This estimate is close to your needs for maintaining your current weight.");
      empty.hidden = true; result.classList.add('show'); result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    document.getElementById('share-calorie')?.addEventListener('click', () => shareResult(`احتياجي اليومي التقديري: ${document.getElementById('calorie-target').textContent} سعرة حرارية.`));
  }

  function initBmi() {
    const form = document.getElementById('bmi-form'); if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError('bmi-error');
      const weight = getNumber('bmi-weight'), height = getNumber('bmi-height');
      if (!validRange(weight, 25, 350) || !validRange(height, 100, 240)) { showError('bmi-error', localeText("أدخل وزنًا بين 25 و350 كجم وطولًا بين 100 و240 سم.", "Enter a weight between 25 and 350 kg and a height between 100 and 240 cm.")); return; }
      const bmi = weight / Math.pow(height / 100, 2); let category = localeText("ضمن النطاق الصحي", "Within healthy range"); let color = 'var(--teal)';
      if (bmi < 18.5) { category = localeText("أقل من النطاق الصحي", "Below healthy range"); color = 'var(--yellow)'; } else if (bmi >= 25 && bmi < 30) { category = localeText("أعلى من النطاق الصحي", "Above healthy range"); color = 'var(--coral)'; } else if (bmi >= 30) { category = localeText("مرتفع", "High"); color = 'var(--coral)'; }
      document.getElementById('bmi-value').textContent = bmi.toFixed(1); document.getElementById('bmi-category').textContent = category; document.getElementById('bmi-value').style.color = color;
      document.getElementById('bmi-result').hidden = false; document.getElementById('bmi-empty').hidden = true; document.getElementById('bmi-result').classList.add('show');
    });
    document.getElementById('share-bmi')?.addEventListener('click', () => shareResult(`مؤشر كتلة الجسم التقديري لدي: ${document.getElementById('bmi-value').textContent}.`));
  }

  function initMacros() {
    const form = document.getElementById('macros-form'); if (!form) return;
    const protein = document.getElementById('protein-pct'), carbs = document.getElementById('carbs-pct'), fats = document.getElementById('fats-pct');
    function sync(source) { const values = [protein, carbs, fats]; const remainder = 100 - Number(source.value); const others = values.filter(x => x !== source); const each = Math.max(0, remainder / 2); others.forEach(x => x.value = Math.round(each)); }
    [protein, carbs, fats].forEach(input => input?.addEventListener('change', () => sync(input)));
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError('macros-error'); const calories = getNumber('macro-calories'); const total = Number(protein.value) + Number(carbs.value) + Number(fats.value);
      if (!validRange(calories, 1000, 10000) || total !== 100) { showError('macros-error', localeText("أدخل سعرات بين 1,000 و10,000، وتأكد أن مجموع النسب يساوي 100%.", "Enter calories between 1,000 and 10,000, and ensure the percentages sum to 100%.")); return; }
      const p = calories * Number(protein.value) / 100 / 4, c = calories * Number(carbs.value) / 100 / 4, f = calories * Number(fats.value) / 100 / 9;
      document.getElementById('macro-protein').textContent = `${formatNumber(p)} g`; document.getElementById('macro-carbs').textContent = `${formatNumber(c)} g`; document.getElementById('macro-fats').textContent = `${formatNumber(f)} g`;
      document.getElementById('macros-result').hidden = false; document.getElementById('macros-empty').hidden = true; document.getElementById('macros-result').classList.add('show');
    });
    document.getElementById('share-macros')?.addEventListener('click', () => shareResult(`توزيع الماكروز: بروتين ${document.getElementById('macro-protein').textContent}، كربوهيدرات ${document.getElementById('macro-carbs').textContent}، دهون ${document.getElementById('macro-fats').textContent}.`));
  }
  function initWater() {
    const form = document.getElementById('water-form'); if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError('water-error');
      const weight = getNumber('water-weight'); const activity = Number(document.getElementById('water-activity')?.value || 1);
      if (!validRange(weight, 25, 350)) { showError('water-error', localeText("أدخل وزنًا بين 25 و350 كجم للحصول على تقدير مناسب.", "Enter a weight between 25 and 350 kg for an appropriate estimate.")); return; }
      const liters = (weight * 30 * activity) / 1000;
      document.getElementById('water-liters').textContent = liters.toFixed(1);
      document.getElementById('water-cups').textContent = formatNumber(liters * 4.1667);
      document.getElementById('water-result').hidden = false; document.getElementById('water-empty').hidden = true; document.getElementById('water-result').classList.add('show'); document.getElementById('water-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function initIdealWeight() {
    const form = document.getElementById('ideal-form'); if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError('ideal-error');
      const height = getNumber('ideal-height'); const gender = form.querySelector('input[name="ideal-gender"]:checked')?.value || 'male';
      if (!validRange(height, 100, 240)) { showError('ideal-error', localeText("أدخل طولًا بين 100 و240 سم.", "Enter a height between 100 and 240 cm.")); return; }
      const inches = Math.max(0, height / 2.54 - 60); const base = gender === 'female' ? 45.5 : 50; const estimate = base + (2.3 * inches);
      document.getElementById('ideal-value').textContent = formatNumber(estimate, 1);
      document.getElementById('ideal-range').textContent = `${formatNumber(estimate - 5, 1)} – ${formatNumber(estimate + 5, 1)} كجم`;
      document.getElementById('ideal-result').hidden = false; document.getElementById('ideal-empty').hidden = true; document.getElementById('ideal-result').classList.add('show');
    });
  }

function parseDateInput(id) {
  const value = document.getElementById(id)?.value || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function formatArabicDate(date) { return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
function initDueDate() {
  const form = document.getElementById('pregnancy-due-date-form'); if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('due-error'); const lmp = parseDateInput('due-lmp');
    if (!lmp || lmp > new Date()) { showError('due-error', localeText("أدخلي تاريخًا صحيحًا لا يتجاوز تاريخ اليوم.", "Enter a valid date not later than today.")); return; }
    document.getElementById('due-date').textContent = formatArabicDate(addDays(lmp, 280));
    document.getElementById('due-empty').hidden = true; document.getElementById('due-result').hidden = false; document.getElementById('due-result').classList.add('show');
  });
}
function initFertileWindow() {
  const form = document.getElementById('fertile-window-form'); if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('fertile-error'); const lmp = parseDateInput('fertile-lmp'); const cycle = getNumber('fertile-cycle');
    if (!lmp || lmp > new Date() || !validRange(cycle, 21, 40)) { showError('fertile-error', localeText("أدخلي تاريخًا صحيحًا وطول دورة بين 21 و40 يومًا.", "Enter a valid date and a cycle length between 21 and 40 days.")); return; }
    const ovulation = addDays(lmp, cycle - 14); const start = addDays(ovulation, -5); const end = addDays(ovulation, 1);
    document.getElementById('fertile-ovulation').textContent = formatArabicDate(ovulation);
    document.getElementById('fertile-window').textContent = `${formatArabicDate(start)} — ${formatArabicDate(end)}`;
    document.getElementById('fertile-empty').hidden = true; document.getElementById('fertile-result').hidden = false; document.getElementById('fertile-result').classList.add('show');
  });
}
function initPrediabetes() {
  const form = document.getElementById('prediabetes-risk-form'); if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('pred-error'); const age = getNumber('pred-age'); const weight = getNumber('pred-weight'); const height = getNumber('pred-height');
    if (!validRange(age, 18, 120) || !validRange(weight, 25, 350) || !validRange(height, 100, 240)) { showError('pred-error', localeText("تحقق من العمر والطول والوزن ضمن نطاق منطقي للبالغين.", "Check that age, height, and weight are within a reasonable range for adults.")); return; }
    const gender = form.querySelector('input[name="pred-gender"]:checked')?.value || 'female'; const bmi = weight / Math.pow(height / 100, 2); let score = age >= 60 ? 3 : age >= 50 ? 2 : age >= 40 ? 1 : 0;
    if (gender === 'male') score += 1; if (gender === 'female' && form.querySelector('input[name="pred-gest"]:checked')?.value === 'yes') score += 1;
    if (form.querySelector('input[name="pred-family"]:checked')?.value === 'yes') score += 1; if (form.querySelector('input[name="pred-bp"]:checked')?.value === 'yes') score += 1; if (form.querySelector('input[name="pred-active"]:checked')?.value === 'no') score += 1;
    score += bmi >= 40 ? 3 : bmi >= 30 ? 2 : bmi >= 25 ? 1 : 0;
    const high = score >= 5; document.getElementById('pred-score').textContent = formatNumber(score); document.getElementById('pred-category').textContent = high ? localeText("خطر أعلى", "Higher risk") : localeText("خطر أقل وفق الاستبيان", "Lower risk according to the questionnaire."); document.getElementById('pred-note').textContent = high ? localeText("تحدث مع الطبيب عن فحص ما قبل السكري أو السكري، ولا تعتبر النتيجة تشخيصًا.", "Talk to your doctor about prediabetes or diabetes testing; this result is not a diagnosis.") : localeText("استمر في العادات الصحية، واطلب المشورة الطبية عند وجود أعراض أو عوامل خطر.", "Continue healthy habits, and seek medical advice if you have symptoms or risk factors.");
    document.getElementById('pred-empty').hidden = true; document.getElementById('pred-result').hidden = false; document.getElementById('pred-result').classList.add('show');
  });
  document.getElementById('share-pred')?.addEventListener('click', () => shareResult(`نتيجتي التقديرية في اختبار خطر ما قبل السكري: ${document.getElementById('pred-score').textContent} من 10 نقاط — ${document.getElementById('pred-category').textContent}.`));
}


function normalCdf(z) {
  const sign = z < 0 ? -1 : 1; const x = Math.abs(z) / Math.sqrt(2); const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}
function initChildBmi() {
  const form = document.getElementById('child-bmi-form'); if (!form) return;
  let dataset = null;
  fetch(`${document.body.dataset.root || './'}data/cdc-bmi-for-age.json`).then(response => { if (!response.ok) throw new Error('data'); return response.json(); }).then(data => { if (!data || !Array.isArray(data.male) || !Array.isArray(data.female) || !data.male.length || !data.female.length) throw new Error('invalid CDC data'); dataset = data; }).catch(() => { showError('child-bmi-error', localeText("تعذر تحميل جداول النمو حاليًا. حاول مرة أخرى لاحقًا.", "Growth charts could not be loaded right now. Please try again later.")); });
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('child-bmi-error');
    if (!dataset) { showError('child-bmi-error', localeText("انتظر لحظة حتى تكتمل جداول النمو ثم حاول مرة أخرى.", "Wait until the growth charts finish loading, then try again.")); return; }
    const years = getNumber('child-age-years'), extraMonths = getNumber('child-age-months') || 0, weight = getNumber('child-weight'), height = getNumber('child-height');
    if (!Number.isInteger(years) || !Number.isInteger(extraMonths) || !validRange(years, 2, 19) || !validRange(extraMonths, 0, 11) || !validRange(weight, 5, 250) || !validRange(height, 70, 230)) { showError('child-bmi-error', localeText("تحقق من العمر بين سنتين و19 سنة، والأشهر بين 0 و11، والطول والوزن ضمن نطاق منطقي.", "Check that age is between 2 and 19 years, months between 0 and 11, and height and weight are within a reasonable range.")); return; }
    const ageMonths = years * 12 + extraMonths; const gender = form.querySelector('input[name="child-gender"]:checked')?.value || 'male'; const bmi = weight / Math.pow(height / 100, 2); const rows = dataset[gender];
    if (!Array.isArray(rows) || !rows.length) { showError('child-bmi-error', localeText("جدول النمو غير مكتمل. حاول لاحقًا.", "Growth reference data is incomplete. Try again later.")); return; }
    const row = rows.reduce((best, item) => Math.abs(item.ageMonths - ageMonths) < Math.abs(best.ageMonths - ageMonths) ? item : best, rows[0]);
    const z = row.L === 0 ? Math.log(bmi / row.M) / row.S : (Math.pow(bmi / row.M, row.L) - 1) / (row.L * row.S); const percentile = Math.max(.1, Math.min(99.9, normalCdf(z) * 100));
    const category = percentile < 5 ? localeText("أقل من الوزن المتوقع", "Below expected weight") : percentile < 85 ? localeText("نطاق الوزن الصحي", "Healthy weight range") : percentile < 95 ? localeText("وزن زائد", "Overweight") : localeText("سمنة", "Obesity");
    document.getElementById('child-bmi-value').textContent = bmi.toFixed(1); document.getElementById('child-bmi-percentile').textContent = `${percentile.toFixed(1)}%`; document.getElementById('child-bmi-category').textContent = category; document.getElementById('child-bmi-note').textContent = `تمت مقارنة القياس بجدول CDC الأقرب لعمر ${years} سنة و${extraMonths} شهرًا. النتيجة فحص أولي وليست تشخيصًا.`;
    document.getElementById('child-bmi-empty').hidden = true; document.getElementById('child-bmi-result').hidden = false; document.getElementById('child-bmi-result').classList.add('show');
  });
}
function initPregnancyCalories() {
  const form = document.getElementById('pregnancy-calorie-form'); if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('pregnancy-calorie-error'); const base = getNumber('pregnancy-base-calories'); const trimester = document.getElementById('pregnancy-trimester')?.value || '1';
    if (!validRange(base, 1200, 5000)) { showError('pregnancy-calorie-error', localeText("أدخل سعرات خط أساس بين 1,200 و5,000 سعرة يوميًا.", "Enter a baseline calorie intake between 1,200 and 5,000 calories per day.")); return; }
    const extra = trimester === '2' ? 340 : trimester === '3' ? 450 : 0; const label = trimester === '2' ? localeText("الثاني", "Second") : trimester === '3' ? localeText("الثالث", "Third") : localeText("الأول", "First");
    document.getElementById('pregnancy-calorie-total').textContent = formatNumber(base + extra); document.getElementById('pregnancy-calorie-extra').textContent = `+${formatNumber(extra)}`; document.getElementById('pregnancy-calorie-trimester').textContent = `الثلث ${label}`;
    document.getElementById('pregnancy-calorie-empty').hidden = true; document.getElementById('pregnancy-calorie-result').hidden = false; document.getElementById('pregnancy-calorie-result').classList.add('show');
  });
}


function initInfantGrowth() {
  const form = document.getElementById('infant-growth-form'); if (!form) return;
  let dataset = null;
  fetch(`${document.body.dataset.root || './'}data/who-infant-growth.json`).then(response => { if (!response.ok) throw new Error('data'); return response.json(); }).then(data => { if (!data?.length?.male?.length || !data?.length?.female?.length || !data?.weight?.male?.length || !data?.weight?.female?.length) throw new Error('invalid WHO data'); dataset = data; }).catch(() => showError('infant-growth-error', localeText("تعذر تحميل جداول WHO حاليًا. حاول مرة أخرى لاحقًا.", "Unable to load WHO tables right now. Try again later.")));
  form.addEventListener('submit', event => {
    event.preventDefault(); clearError('infant-growth-error');
    if (!dataset) { showError('infant-growth-error', localeText("انتظر لحظة حتى تكتمل جداول WHO ثم حاول مرة أخرى.", "Wait a moment for the WHO tables to finish loading, then try again.")); return; }
    const month = getNumber('infant-age-months'), length = getNumber('infant-length'), weight = getNumber('infant-weight');
    if (!validRange(month, 0, 24) || !Number.isInteger(month) || !validRange(length, 35, 110) || (Number.isFinite(weight) && weight !== 0 && !validRange(weight, 1, 25))) { showError('infant-growth-error', localeText("تحقق من العمر بين 0 و24 شهرًا، والطول بين 35 و110 سم، والوزن الاختياري ضمن نطاق منطقي.", "Check that age is between 0 and 24 months, height between 35 and 110 cm, and optional weight is within a reasonable range.")); return; }
    const gender = form.querySelector('input[name="infant-gender"]:checked')?.value || 'male'; const row = dataset.length[gender].find(item => item.month === month); const weightRow = dataset.weight[gender].find(item => item.month === month);
    if (!row || (weight > 0 && !weightRow)) { showError('infant-growth-error', localeText("لا تتوفر بيانات مرجعية لهذا العمر. تحقق من العمر أو حاول لاحقًا.", "Reference data is unavailable for this age. Check the age or try again later.")); return; }
    const zScore = (value, item) => item.L === 0 ? Math.log(value / item.M) / item.S : (Math.pow(value / item.M, item.L) - 1) / (item.L * item.S); const percentile = z => Math.max(.1, Math.min(99.9, normalCdf(z) * 100)); const lengthZ = zScore(length, row); const lengthP = percentile(lengthZ);
    document.getElementById('infant-length-z').textContent = `Z ${lengthZ.toFixed(2)}`; document.getElementById('infant-length-percentile').textContent = `المئين ${lengthP.toFixed(1)}%`;
    if (Number.isFinite(weight) && weight > 0) { const weightZ = zScore(weight, weightRow); document.getElementById('infant-weight-z').textContent = `Z ${weightZ.toFixed(2)}`; document.getElementById('infant-weight-percentile').textContent = `المئين ${percentile(weightZ).toFixed(1)}%`; } else { document.getElementById('infant-weight-z').textContent = localeText("غير مدخل", "Not entered"); document.getElementById('infant-weight-percentile').textContent = localeText("الوزن اختياري", "Weight is optional"); }
    document.getElementById('infant-growth-note').textContent = `تمت المقارنة بجدول WHO للشهر ${month}. درجة Z والمئين وصفان إحصائيان للتثقيف ولا يشخّصان حالة الرضيع.`; document.getElementById('infant-growth-empty').hidden = true; document.getElementById('infant-growth-result').hidden = false; document.getElementById('infant-growth-result').classList.add('show');
  });
}

  function initHealthQuiz() {
    const slug = document.body.dataset.tool; const form = document.getElementById(`${slug}-form`); if (!form || !form.classList.contains('health-quiz-card')) return;
    form.addEventListener('submit', event => {
      event.preventDefault(); clearError(`${slug}-error`);
      const groups = [...form.querySelectorAll('fieldset.quiz-question')]; if (groups.some(group => !group.querySelector('input:checked'))) { showError(`${slug}-error`, localeText("أجب عن جميع الأسئلة قبل عرض النتيجة.", "Answer all questions before displaying the result.")); return; }
      const score = groups.reduce((sum, group) => sum + Number(group.querySelector('input:checked').value), 0);
      const max = groups.reduce((sum, group) => sum + Math.max(...[...group.querySelectorAll('input')].map(input => Number(input.value))), 0);
      let category = localeText("مؤشر منخفض نسبيًا", "Relatively low score"); let note = localeText("استخدم النتيجة للتأمل والتثقيف، واطلب المشورة عند استمرار الأعراض.", "Use the score for reflection and education; seek advice if symptoms persist.");
      if (slug === 'asthma-control') { category = score >= 20 ? localeText("تحكم جيد مُبلغ عنه", "Good control reported") : score >= 16 ? localeText("تحكم جزئي مُبلغ عنه", "Partial control reported") : localeText("تحكم ضعيف مُبلغ عنه", "Poor control reported"); note = score >= 20 ? localeText("تحدث مع طبيبك عن استمرار خطة التحكم الحالية.", "Talk to your doctor about continuing your current control plan.") : localeText("حدّد موعدًا قريبًا مع طبيبك لمراجعة خطة التحكم بالربو؛ لا تعدّل الدواء بنفسك.", "Schedule a prompt appointment with your doctor to review your asthma control plan; do not change medication on your own."); }
      if (slug === 'anxiety-screening') { category = score >= 15 ? localeText("أعراض شديدة في الاستبيان", "Severe symptoms on questionnaire") : score >= 10 ? localeText("أعراض متوسطة في الاستبيان", "Moderate symptoms on questionnaire") : score >= 5 ? localeText("أعراض خفيفة في الاستبيان", "Mild symptoms on questionnaire") : localeText("أعراض قليلة في الاستبيان", "Few symptoms on questionnaire"); note = score >= 5 ? localeText("إذا أثرت الأعراض في يومك أو استمرت، تحدث مع مختص.", "If symptoms affect your day or persist, talk to a healthcare professional.") : localeText("استمر في مراقبة ما تشعر به واطلب الدعم إذا تغيرت الأعراض.", "Keep monitoring how you feel and seek support if your symptoms change."); }
      if (slug === 'eating-awareness') { category = score >= 8 ? localeText("إشارات تستحق دعمًا متخصصًا", "Signs that warrant specialist support") : localeText("إشارات أقل في هذا الفحص", "Fewer signs in this screening"); note = score >= 8 ? localeText("تحدث مع مختص بطريقة داعمة وسرية؛ النتيجة ليست تشخيصًا ولا حكمًا على شخصك.", "Talk with a professional in a supportive, confidential way; the result is not a diagnosis or a judgment of you.") : localeText("لا تنفِ النتيجة المنخفضة وجود مشكلة؛ اطلب الدعم إذا كان الطعام أو صورة الجسد يسببان ضيقًا.", "Don't dismiss a low score as meaning there's no problem; seek support if food or body image cause distress."); }
      if (slug === 'sleep-assessment') { category = score >= 25 ? localeText("مؤشرات قوية على اضطراب النوم", "Strong indicators of a sleep disorder") : score >= 17 ? localeText("مؤشرات متعددة تستحق الانتباه", "Multiple indicators warrant attention") : score >= 9 ? localeText("بعض مؤشرات اضطراب النوم", "Some indicators of a sleep disorder") : localeText("نوم جيد وفق الإجابات", "Good sleep based on your responses"); note = score >= 9 ? localeText("جرّب تحسين روتين النوم وراجع الطبيب إذا استمرت المشكلة أو أثرت في يقظتك.", "Try improving your sleep routine and see a doctor if the problem persists or affects your alertness.") : localeText("حافظ على مواعيد نوم منتظمة وراقب أي تغير مستمر.", "Keep regular sleep times and watch for any persistent changes."); }
      if (slug === 'depression-screening') { category = score >= 20 ? localeText("أعراض شديدة في الاستبيان", "Severe symptoms on questionnaire") : score >= 15 ? localeText("أعراض متوسطة إلى شديدة", "Moderate to severe symptoms") : score >= 10 ? localeText("أعراض متوسطة", "Moderate symptoms") : score >= 5 ? localeText("أعراض خفيفة", "Mild symptoms") : localeText("أعراض قليلة أو معدومة", "Few or no symptoms"); note = score >= 5 ? localeText("تحدث مع طبيب أو مختص للصحة النفسية لتقييم مناسب.", "Talk to a doctor or mental health professional for an appropriate assessment.") : localeText("إذا تغير مزاجك أو أثّر في حياتك، اطلب الدعم حتى لو كانت الدرجة منخفضة.", "If your mood changes or it affects your life, seek support even if your score is low."); if (Number(form.querySelector('fieldset:nth-of-type(9) input:checked')?.value || 0) > 0) note = localeText("تتطلب أفكار إيذاء النفس مساعدة عاجلة: تواصل الآن مع الطوارئ المحلية أو شخص موثوق ولا تبقَ وحدك.", "Thoughts of self-harm require urgent help: contact local emergency services or someone you trust now and do not be alone."); }
      if (slug === 'phone-balance') { category = score >= 16 ? localeText("أثر مرتفع محتمل على اليوم", "Possible high impact on your day") : score >= 8 ? localeText("أثر متوسط محتمل", "Possible moderate impact") : localeText("أثر منخفض وفق الإجابات", "Low impact based on responses"); note = score >= 8 ? localeText("جرّب حدودًا واضحة للإشعارات والهاتف، واطلب دعمًا إذا شعرت بفقدان السيطرة.", "Try clear limits on notifications and phone use; seek support if you feel out of control.") : localeText("حافظ على فترات بلا شاشة وروتين نوم يحمي وقت الراحة.", "Maintain screen-free time and a sleep routine that protects rest."); }
      document.getElementById(`${slug}-score`).textContent = `${formatNumber(score)} / ${formatNumber(max)}`; document.getElementById(`${slug}-category`).textContent = category; document.getElementById(`${slug}-note`).textContent = note; document.getElementById(`${slug}-empty`).hidden = true; document.getElementById(`${slug}-result`).hidden = false; document.getElementById(`${slug}-result`).classList.add('show');
    });
  }
  function initChecklist() {
    const slug = document.body.dataset.tool; const form = document.getElementById(`${slug}-form`); if (!form || !form.classList.contains('health-quiz-card') || !form.querySelector('.checklist')) return;
    const boxes = [...form.querySelectorAll('input[type="checkbox"]')]; const update = () => { const done = boxes.filter(box => box.checked).length; const percent = boxes.length ? Math.round(done / boxes.length * 100) : 0; document.getElementById(`${slug}-score`).textContent = `${percent}%`; document.getElementById(`${slug}-progress`).textContent = `${done} من ${boxes.length} بنود`; document.getElementById(`${slug}-progress-bar`).style.width = `${percent}%`; document.getElementById(`${slug}-category`).textContent = percent === 100 ? localeText("اكتملت القائمة", "List complete") : percent >= 60 ? localeText("استعداد جيد", "Well prepared") : localeText("ابدأ بالمراجعة", "Start review"); document.getElementById(`${slug}-note`).textContent = percent === 100 ? localeText("راجع تعليمات طبيبك والجهات الرسمية قبل السفر.", "Review your doctor's and official instructions before travel.") : localeText("حدّد البنود التي أنجزتها وتابع البقية قبل الموعد.", "Mark items you've completed and follow up on the rest before the appointment."); };
    boxes.forEach(box => box.addEventListener('change', update)); update();
  }
  function initVisualAcuity() {
    const form = document.getElementById('visual-acuity-screening-form'); if (!form) return;
    form.addEventListener('submit', event => { event.preventDefault(); const level = document.getElementById('visual-acuity-level').value; const numeric = Number(level); const category = numeric >= 12 ? localeText("يحتاج فحصًا مهنيًا", "Requires a professional examination") : numeric >= 7.5 ? localeText("قراءة قريبة من المعتاد", "Reading close to normal") : localeText("قراءة تقريبية جيدة", "Good approximate reading"); const note = numeric >= 12 ? localeText("النتيجة أسوأ من 6/12 تقريبًا؛ احجز فحص عيون ولا تستخدمها لوصف نظارات.", "Result approximately worse than 6/12; book an eye exam and do not use this to prescribe glasses.") : localeText("هذه قراءة شاشة غير معايرة؛ حافظ على فحوص العين الدورية ولا تعتبرها تشخيصًا.", "This is an uncalibrated screen reading; keep up regular eye exams and do not consider it a diagnosis."); document.getElementById('visual-acuity-screening-score').textContent = `6/${level}`; document.getElementById('visual-acuity-screening-category').textContent = category; document.getElementById('visual-acuity-screening-note').textContent = note; document.getElementById('visual-acuity-screening-empty').hidden = true; document.getElementById('visual-acuity-screening-result').hidden = false; document.getElementById('visual-acuity-screening-result').classList.add('show'); });
  }

  initCalorie(); initBmi(); initMacros(); initWater(); initIdealWeight(); initDueDate(); initFertileWindow(); initPrediabetes(); initChildBmi(); initPregnancyCalories(); initInfantGrowth(); initHealthQuiz(); initChecklist(); initVisualAcuity();
})();
