/* Interactive nutrition + meal planner — Tools DZ, no external runtime dependencies */
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const state = {
    gender: 'male', age: 28, weight: 75, height: 175,
    activity: 1.55, goal: 'maintain', intensity: 'moderate',
    diet: 'balanced', macros: {p:30,c:40,f:30}, meals: 4
  };
  const initial = JSON.parse(JSON.stringify(state));
  const presets = {
    balanced: {p:30,c:40,f:30},
    high_protein: {p:40,c:35,f:25},
    low_carb: {p:30,c:10,f:60}
  };
  const configurations = {
    3: [
      {name:'الفطور',time:'08:00',part:.30,idea:'بيض، شوفان أو خبز كامل، فاكهة أو خضر'},
      {name:'الغداء',time:'14:30',part:.40,idea:'دجاج أو سمك، أرز أو بطاطا، سلطة مع زيت الزيتون'},
      {name:'العشاء',time:'20:30',part:.30,idea:'عدس أو تونة، خضار، خبز كامل أو مكسرات'}
    ],
    4: [
      {name:'الفطور',time:'08:00',part:.25,idea:'بيض، شوفان مع فاكهة، ومكسرات'},
      {name:'الغداء',time:'14:00',part:.35,idea:'لحم أو دجاج، أرز أو معكرونة، طبق سلطة'},
      {name:'وجبة خفيفة',time:'17:30',part:.15,idea:'زبادي طبيعي، فاكهة أو كمية من المكسرات'},
      {name:'العشاء',time:'21:00',part:.25,idea:'سمك أو بقول، بطاطا وخضار مطهوة'}
    ],
    5: [
      {name:'الفطور',time:'07:30',part:.25,idea:'شوفان بالحليب مع بيض'},
      {name:'وجبة ثانية',time:'11:30',part:.20,idea:'ساندويتش تونة بخبز كامل وخضار'},
      {name:'الغداء',time:'15:30',part:.30,idea:'بروتين + أرز أو كسكس + سلطة'},
      {name:'وجبة خفيفة',time:'18:30',part:.10,idea:'موزة مع زبادي أو حفنة مكسرات'},
      {name:'العشاء',time:'21:30',part:.15,idea:'بقول أو جبن طازج، أفوكادو أو خضار'}
    ]
  };
  const fmt = (n) => Number(n).toLocaleString('ar-DZ-u-nu-latn');
  const put = (id, value) => { const el = byId(id); if (el) el.textContent = value; };
  const press = (key, value) => {
    document.querySelectorAll('.nutrition-page [data-' + key + ']').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset[key] === String(value)));
    });
  };
  function validate() {
    const limits = {age:[18,90],weight:[35,220],height:[120,230]};
    for (const key of Object.keys(limits)) {
      const value = Number(state[key]);
      if (!Number.isFinite(value) || value < limits[key][0] || value > limits[key][1]) {
        put('nutri-error', 'تحقق من ' + ({age:'العمر (18–90 سنة)',weight:'الوزن (35–220 كغ)',height:'الطول (120–230 سم)'}[key]) + ' قبل متابعة الحساب.');
        byId('nutri-error').hidden = false;
        return false;
      }
    }
    const p = state.macros;
    if (p.p + p.c + p.f !== 100) {
      put('nutri-error', 'يجب أن يساوي مجموع نسب المغذيات 100%.');
      byId('nutri-error').hidden = false;
      return false;
    }
    byId('nutri-error').hidden = true;
    return true;
  }
  function split(total, ratios) {
    const values = ratios.slice(0,-1).map(ratio => Math.round(total * ratio));
    values.push(total - values.reduce((s,x) => s+x,0));
    return values;
  }
  function calculate() {
    if (!validate()) return;
    const bmr = Math.round(10 * state.weight + 6.25 * state.height - 5 * state.age + (state.gender === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * state.activity);
    const adjustments = {mild:.15,moderate:.20,aggressive:.25};
    const change = adjustments[state.intensity];
    let target = tdee;
    if (state.goal === 'cut') target = Math.max(state.gender === 'male' ? 1500 : 1200, Math.round(tdee * (1-change)));
    if (state.goal === 'bulk') target = Math.round(tdee * (1+change));
    const bmi = state.weight / Math.pow(state.height/100, 2);
    const bmiLabel = bmi < 18.5 ? 'نحافة' : bmi < 25 ? 'طبيعي' : bmi < 30 ? 'وزن زائد' : 'سمنة';
    const water = (state.weight * .035 + (state.activity >= 1.725 ? .5 : state.activity >= 1.55 ? .25 : 0));
    const calorieBreakdown = split(target,[state.macros.p/100,state.macros.c/100,state.macros.f/100]);
    const grams = [Math.round(calorieBreakdown[0]/4),Math.round(calorieBreakdown[1]/4),Math.round(calorieBreakdown[2]/9)];
    const titles = {cut:'خطة خسارة الوزن',maintain:'خطة المحافظة على الوزن',bulk:'خطة بناء العضلات'};
    const desc = state.goal === 'maintain'
      ? 'الهدف يساوي الاستهلاك اليومي التقديري للطاقة (TDEE).'
      : (state.goal === 'cut' ? 'عجز تقديري بمقدار ' : 'فائض تقديري بمقدار ') + fmt(Math.abs(target-tdee)) + ' سعرة يومياً مقارنة بسعرات المحافظة.';
    put('nutri-goal-label',titles[state.goal]); put('nutri-target',fmt(target));
    put('nutri-diff',desc);
    put('nutri-tdee',fmt(tdee)); put('nutri-bmr',fmt(bmr));
    put('nutri-bmi',bmi.toFixed(1)); put('nutri-bmi-state',bmiLabel);
    put('nutri-water',water.toFixed(1)); put('nutri-cups',Math.round(water/.25));
    ['p','c','f'].forEach((key,i) => {
      put('nutri-macro-'+key,fmt(grams[i]));
      put('nutri-pct-'+key,state.macros[key]+'%');
      put('nutri-kcal-'+key,fmt(calorieBreakdown[i]));
    });
    put('nutri-total-grams',fmt(grams.reduce((a,b)=>a+b,0))+' غ');
    put('nutri-protein-kg',(grams[0]/state.weight).toFixed(1)+' غ/كغ');
    put('nutri-fiber',fmt(Math.round(target/1000*14))+' غ/يوم');
    const circumference = 2 * Math.PI * 46;
    let start = 0;
    ['p','c','f'].forEach(key => {
      const length = circumference * state.macros[key]/100;
      const node = byId('nutri-arc-'+key);
      node.setAttribute('stroke-dasharray',length+' '+circumference);
      node.setAttribute('stroke-dashoffset',String(-start));
      start += length;
    });
    renderMeals(target,grams);
    renderTips(grams[0]/state.weight,bmi,water);
  }
  function renderMeals(target, grams) {
    const plans = configurations[state.meals];
    const ratios = plans.map(item => item.part);
    const calories = split(target,ratios);
    const proteins = split(grams[0],ratios);
    const carbs = split(grams[1],ratios);
    const fats = split(grams[2],ratios);
    put('nutri-meal-count',state.meals + ' وجبات');
    const root = byId('nutri-meals');
    root.replaceChildren();
    plans.forEach((meal,i) => {
      const card = document.createElement('article');
      card.className = 'nutri-meal';
      const detail = document.createElement('div');
      detail.className = 'nutri-meal-main';
      const top = document.createElement('div');
      top.className = 'nutri-meal-top';
      const name = document.createElement('strong'); name.textContent = meal.name;
      const time = document.createElement('span'); time.textContent = meal.time+' • '+Math.round(meal.part*100)+'%';
      top.append(name,time);
      const idea = document.createElement('p'); idea.textContent = 'مثال غذائي: '+meal.idea;
      detail.append(top,idea);
      const totals = document.createElement('div');
      totals.className = 'nutri-meal-numbers';
      const kcal = document.createElement('strong'); kcal.textContent = fmt(calories[i])+' سعرة';
      const breakdown = document.createElement('small'); breakdown.textContent = 'بروتين '+proteins[i]+'غ • كارب '+carbs[i]+'غ • دهون '+fats[i]+'غ';
      totals.append(kcal,breakdown);
      card.append(detail,totals);
      root.append(card);
    });
  }
  function renderTips(proteinKg,bmi,water) {
    const tips = [];
    if (state.goal === 'cut') {
      tips.push('راقب التقدم عبر متوسط الوزن لعدة أسابيع؛ العجز اليومي المقترح تقديري وليس ضماناً لمعدل نزول معين.');
      tips.push('حافظ على وجبات متنوعة، وتمارين المقاومة حسب قدرتك للمساعدة في الحفاظ على الكتلة العضلية.');
    } else if (state.goal === 'bulk') {
      tips.push('الزيادة التدريجية مع تمارين المقاومة قد تكون أنسب من فائض كبير؛ راقب النتائج وعدّل عند الحاجة.');
    } else {
      tips.push('راقب الوزن والنشاط لمدة أسبوعين أو أكثر، ثم عدّل السعرات عند الحاجة.');
    }
    tips.push('توزيع الوجبات وأوقاتها أمثلة قابلة للتعديل وفق مواعيدك وتفضيلاتك؛ المهم إجمالي اليوم.');
    tips.push('الماء المقدر ('+water.toFixed(1)+' لتر) نقطة بداية فقط؛ تتغير الاحتياجات حسب الجو والتعرق والحالة الصحية.');
    if (proteinKg > 2.2) tips.push('حصة البروتين المحسوبة ('+proteinKg.toFixed(1)+' غ/كغ) مرتفعة؛ راجع ملاءمتها لاحتياجاتك الفردية.');
    if (bmi < 18.5 || bmi >= 30) tips.push('مؤشر كتلة الجسم أداة فحص أولية، وليس تشخيصاً أو قياساً لنسبة الدهون.');
    const list = byId('nutri-tips');
    list.replaceChildren();
    tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      list.append(li);
    });
  }
  function syncNumber(key, raw, fromRange) {
    const number = Number(raw);
    if (!raw.trim() || !Number.isFinite(number)) {
      state[key] = NaN; validate(); return;
    }
    state[key] = number;
    if (fromRange) byId('nutri-'+key).value = String(number);
    else byId('nutri-'+key+'-range').value = String(number);
    calculate();
  }
  function updateMacroLabels() {
    ['p','c','f'].forEach(key => {
      byId('nutri-custom-'+key).value = state.macros[key];
      put('nutri-custom-label-'+key,state.macros[key]+'%');
    });
    put('nutri-custom-total',(state.macros.p+state.macros.c+state.macros.f)+'%');
  }
  function adjustMacros(changed) {
    const limits = {p:[10,70],c:[5,75],f:[10,75]};
    const next = {...state.macros};
    next[changed] = Number(byId('nutri-custom-'+changed).value);
    let difference = 100-(next.p+next.c+next.f);
    const other = ['p','c','f'].filter(key => key !== changed);
    for (const key of other) {
      const proposal = Math.max(limits[key][0],Math.min(limits[key][1],next[key]+difference));
      difference -= proposal-next[key];
      next[key] = proposal;
    }
    if (difference !== 0) {
      next[changed] = Math.max(limits[changed][0],Math.min(limits[changed][1],next[changed]+difference));
    }
    state.macros = next;
    updateMacroLabels();
    calculate();
  }
  function updateUi() {
    press('gender',state.gender);
    press('activity',state.activity);
    press('goal',state.goal);
    press('intensity',state.intensity);
    press('diet',state.diet);
    press('meals',state.meals);
    ['age','weight','height'].forEach(key=>{
      byId('nutri-'+key).value=state[key];
      byId('nutri-'+key+'-range').value=state[key];
    });
    byId('nutri-intensity-box').hidden = state.goal === 'maintain';
    byId('nutri-custom-box').hidden = state.diet !== 'custom';
    put('nutri-intensity-caption',state.goal === 'bulk'?'مقدار فائض السعرات':'مقدار عجز السعرات');
    updateMacroLabels();
    calculate();
  }
  let toastHandle;
  function showToast(message) {
    const toast=byId('nutri-toast');
    toast.textContent=message;
    toast.hidden=false;
    clearTimeout(toastHandle);
    toastHandle=setTimeout(()=>{toast.hidden=true;},3200);
  }
  let previousFocus=null;
  const modal=byId('nutri-food-modal');
  function closeModal() {
    modal.hidden=true;
    document.body.style.overflow='';
    if (previousFocus) previousFocus.focus();
  }
  document.querySelectorAll('[data-food-open]').forEach(button=>button.addEventListener('click',()=>{
    previousFocus=document.activeElement;
    modal.hidden=false;
    document.body.style.overflow='hidden';
    byId('nutri-food-close').focus();
  }));
  byId('nutri-food-close').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
  modal.addEventListener('keydown',event=>{
    if(event.key==='Escape'){ event.preventDefault();closeModal(); }
    if(event.key==='Tab') {
      const focusables=Array.from(modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'));
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  document.querySelectorAll('.nutrition-page [data-gender]').forEach(btn=>btn.addEventListener('click',()=>{state.gender=btn.dataset.gender;updateUi();}));
  document.querySelectorAll('.nutrition-page [data-activity]').forEach(btn=>btn.addEventListener('click',()=>{state.activity=Number(btn.dataset.activity);updateUi();}));
  document.querySelectorAll('.nutrition-page [data-goal]').forEach(btn=>btn.addEventListener('click',()=>{state.goal=btn.dataset.goal;updateUi();}));
  document.querySelectorAll('.nutrition-page [data-intensity]').forEach(btn=>btn.addEventListener('click',()=>{state.intensity=btn.dataset.intensity;updateUi();}));
  document.querySelectorAll('.nutrition-page [data-diet]').forEach(btn=>btn.addEventListener('click',()=>{
    state.diet=btn.dataset.diet;
    if (presets[state.diet]) state.macros={...presets[state.diet]};
    updateUi();
  }));
  document.querySelectorAll('.nutrition-page [data-meals]').forEach(btn=>btn.addEventListener('click',()=>{state.meals=Number(btn.dataset.meals);updateUi();}));
  ['age','weight','height'].forEach(key=>{
    byId('nutri-'+key).addEventListener('input',(event)=>syncNumber(key,event.target.value,false));
    byId('nutri-'+key+'-range').addEventListener('input',(event)=>syncNumber(key,event.target.value,true));
  });
  ['p','c','f'].forEach(key=>byId('nutri-custom-'+key).addEventListener('input',()=>adjustMacros(key)));
  byId('nutri-reset').addEventListener('click',()=>{
    Object.assign(state,JSON.parse(JSON.stringify(initial)));
    updateUi(); showToast('عادت الإعدادات إلى القيم الافتراضية');
  });
  function summary() {
    return [
      'خطة السعرات والوجبات - Tools DZ',
      'الهدف: '+byId('nutri-goal-label').textContent,
      'السعرات: '+byId('nutri-target').textContent+' سعرة/يوم',
      'BMR: '+byId('nutri-bmr').textContent+' • TDEE: '+byId('nutri-tdee').textContent,
      'بروتين: '+byId('nutri-macro-p').textContent+' غ ('+state.macros.p+'%)',
      'كربوهيدرات: '+byId('nutri-macro-c').textContent+' غ ('+state.macros.c+'%)',
      'دهون: '+byId('nutri-macro-f').textContent+' غ ('+state.macros.f+'%)',
      'عدد الوجبات: '+state.meals,
      'الماء التقديري: '+byId('nutri-water').textContent+' لتر',
      'الحسابات تقديرية للبالغين وليست بديلاً عن استشارة طبية.',
      'https://imadtbn.github.io/tools-dz/tools/calorie-calculator.html'
    ].join('\n');
  }
  byId('nutri-copy').addEventListener('click',async()=>{
    if(!validate()) { showToast('تحقق من القيم أولاً'); return; }
    const txt=summary();
    let success=false;
    try { if(navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); success=true; } }
    catch (_) { /* clipboard permission denied */ }
    if(!success) {
      const textarea=document.createElement('textarea');
      textarea.value=txt; textarea.style.position='fixed';textarea.style.opacity='0';
      document.body.append(textarea);textarea.select();
      try {success=document.execCommand('copy');}catch(_){success=false;}
      textarea.remove();
    }
    showToast(success?'تم نسخ الخطة':'تعذر النسخ؛ استخدم زر الطباعة لحفظ الخطة');
  });
  byId('nutri-print').addEventListener('click',()=>{if(validate())window.print();else showToast('تحقق من القيم أولاً');});
  updateUi();
})();
