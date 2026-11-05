
'use strict';
(() => {
  // Factors express one unit in its category's canonical SI unit.
  // Temperature and fuel economy use specialized conversions below.
  const U=(name,factor)=>({name,factor});
  const categories={
    length:{name:'الطول',icon:'fa-ruler-horizontal',default:['m','ft'],units:{
      mm:U('ميليمتر (mm)',.001),cm:U('سنتيمتر (cm)',.01),m:U('متر (m)',1),
      km:U('كيلومتر (km)',1000),inch:U('بوصة (in)',.0254),ft:U('قدم (ft)',.3048),
      yd:U('ياردة (yd)',.9144),mile:U('ميل (mi)',1609.344),nmi:U('ميل بحري (nmi)',1852),
      um:U('ميكرومتر (µm)',.000001),nm:U('نانومتر (nm)',1e-9)
    }},
    mass:{name:'الكتلة والوزن',icon:'fa-weight-hanging',default:['kg','lb'],units:{
      mg:U('ميليغرام (mg)',1e-6),g:U('غرام (g)',.001),kg:U('كيلوغرام (kg)',1),
      t:U('طن متري (t)',1000),lb:U('رطل / باوند (lb)',.45359237),
      oz:U('أونصة (oz)',.028349523125),stone:U('ستون (st)',6.35029318),
      ct:U('قيراط (ct)',.0002),usTon:U('طن أمريكي قصير',907.18474),
      ukTon:U('طن بريطاني طويل',1016.0469088)
    }},
    area:{name:'المساحة',icon:'fa-vector-square',default:['m2','ha'],units:{
      mm2:U('ميليمتر مربع (mm²)',1e-6),cm2:U('سنتيمتر مربع (cm²)',1e-4),
      m2:U('متر مربع (m²)',1),km2:U('كيلومتر مربع (km²)',1e6),
      ha:U('هكتار (ha)',10000),acre:U('أكر (acre)',4046.8564224),
      feddan:U('فدان مصري',4200.833333333333),ft2:U('قدم مربع (ft²)',.09290304),
      in2:U('بوصة مربعة (in²)',.00064516),yd2:U('ياردة مربعة (yd²)',.83612736),
      mi2:U('ميل مربع (mi²)',2589988.110336)
    }},
    temperature:{name:'درجة الحرارة',icon:'fa-temperature-half',default:['c','f'],units:{
      c:U('درجة مئوية (°C)',1),f:U('فهرنهايت (°F)',1),
      k:U('كلفن (K)',1),r:U('رانكين (°R)',1)
    }},
    volume:{name:'الحجم والسعة',icon:'fa-flask',default:['l','usgal'],units:{
      ml:U('ميليلتر (mL)',.001),cl:U('سنتيلتر (cL)',.01),dl:U('ديسيلتر (dL)',.1),
      l:U('لتر (L)',1),m3:U('متر مكعب (m³)',1000),cm3:U('سنتيمتر مكعب (cm³)',.001),
      usgal:U('غالون أمريكي (US gal)',3.785411784),ukgal:U('غالون بريطاني (UK gal)',4.54609),
      usqt:U('كوارت أمريكي (qt)',.946352946),uspt:U('باينت أمريكي (pt)',.473176473),
      uscup:U('كوب أمريكي (cup)',.2365882365),floz:U('أونصة سائلة أمريكية (fl oz)',.0295735295625),
      tbsp:U('ملعقة طعام أمريكية',.01478676478125),tsp:U('ملعقة شاي أمريكية',.00492892159375),
      ft3:U('قدم مكعب (ft³)',28.316846592)
    }},
    speed:{name:'السرعة',icon:'fa-gauge-high',default:['kmh','ms'],units:{
      ms:U('متر/ثانية (m/s)',1),kmh:U('كيلومتر/ساعة (km/h)',1/3.6),
      mph:U('ميل/ساعة (mph)',.44704),knot:U('عقدة بحرية (kn)',1852/3600),
      fts:U('قدم/ثانية (ft/s)',.3048),cms:U('سنتيمتر/ثانية (cm/s)',.01)
    }},
    time:{name:'الوقت',icon:'fa-clock',default:['h','min'],units:{
      ns:U('نانوثانية',1e-9),us:U('ميكروثانية',1e-6),ms:U('ميلي ثانية',.001),
      s:U('ثانية',1),min:U('دقيقة',60),h:U('ساعة',3600),
      day:U('يوم',86400),week:U('أسبوع',604800),fortnight:U('أسبوعان',1209600),
      year:U('سنة يوليانية (365.25 يوم)',31557600)
    }},
    data:{name:'حجم البيانات',icon:'fa-database',default:['MB','MiB'],units:{
      bit:U('بت (bit)',.125),B:U('بايت (B)',1),KB:U('كيلوبايت (KB)',1e3),
      MB:U('ميغابايت (MB)',1e6),GB:U('غيغابايت (GB)',1e9),
      TB:U('تيرابايت (TB)',1e12),KiB:U('كيبيبايت (KiB)',1024),
      MiB:U('ميبيبايت (MiB)',1048576),GiB:U('غيبيبايت (GiB)',1073741824),
      TiB:U('تيبيبايت (TiB)',1099511627776),Mbit:U('ميغابت (Mbit)',125000),
      Gbit:U('غيغابت (Gbit)',125000000)
    }},
    pressure:{name:'الضغط',icon:'fa-gauge',default:['bar','psi'],units:{
      Pa:U('باسكال (Pa)',1),kPa:U('كيلوباسكال (kPa)',1000),
      MPa:U('ميغاباسكال (MPa)',1e6),bar:U('بار (bar)',1e5),
      mbar:U('ميليبار (mbar)',100),atm:U('ضغط جوي (atm)',101325),
      psi:U('رطل/بوصة² (psi)',6894.757293168),mmHg:U('ميليمتر زئبق (mmHg)',133.322387415),
      torr:U('تور (Torr)',101325/760)
    }},
    energy:{name:'الطاقة',icon:'fa-bolt',default:['kWh','J'],units:{
      J:U('جول (J)',1),kJ:U('كيلوجول (kJ)',1e3),MJ:U('ميغاجول (MJ)',1e6),
      cal:U('سعرة حرارية صغيرة (cal)',4.184),kcal:U('كيلوسعرة غذائية (kcal)',4184),
      Wh:U('واط ساعي (Wh)',3600),kWh:U('كيلوواط ساعي (kWh)',3600000),
      BTU:U('وحدة حرارية بريطانية (BTU)',1055.05585262),eV:U('إلكترون فولت (eV)',1.602176634e-19)
    }},
    power:{name:'القدرة',icon:'fa-plug',default:['kW','hp'],units:{
      W:U('واط (W)',1),kW:U('كيلوواط (kW)',1000),MW:U('ميغاواط (MW)',1e6),
      hp:U('حصان ميكانيكي (hp)',745.6998715822702),
      metricHp:U('حصان متري (PS)',735.49875),BTUh:U('BTU/ساعة',.29307107017)
    }},
    fuel:{name:'استهلاك الوقود',icon:'fa-gas-pump',default:['l100','kml'],units:{
      l100:U('لتر لكل 100 كم (L/100km)',1),
      kml:U('كم لكل لتر (km/L)',1),
      mpgUS:U('ميل/غالون أمريكي (mpg US)',1),
      mpgUK:U('ميل/غالون بريطاني (mpg UK)',1)
    }}
  };
  const typeSelect=document.getElementById('conversion-type');
  const fromSelect=document.getElementById('input-unit');
  const toSelect=document.getElementById('output-unit');
  const input=document.getElementById('input-val');
  const output=document.getElementById('output-val');
  const equation=document.getElementById('unit-equation');
  const hint=document.getElementById('unit-hint');
  const categoriesBox=document.getElementById('unit-categories');
  const presets=document.getElementById('unit-presets');
  const copyButton=document.getElementById('unit-copy');
  const formatter=new Intl.NumberFormat('en-US',{maximumSignificantDigits:12});
  const label=(key,category)=>category.units[key].name;
  function format(n) {
    if (!Number.isFinite(n)) return 'غير متاح';
    if (Object.is(n,-0)) n=0;
    const abs=Math.abs(n);
    return abs>0&&(abs<.000001||abs>=1e12)?n.toExponential(8):formatter.format(n);
  }
  function toCelsius(v,u) {
    if(u==='c')return v;
    if(u==='f')return(v-32)*5/9;
    if(u==='k')return v-273.15;
    return(v-491.67)*5/9;
  }
  function fromCelsius(v,u) {
    if(u==='c')return v;
    if(u==='f')return v*9/5+32;
    if(u==='k')return v+273.15;
    return(v+273.15)*9/5;
  }
  // All fuel ratios are normalized to L/100km.
  const toLitersPer100=(v,u)=>{
    if(u==='l100')return v;
    if(u==='kml')return 100/v;
    if(u==='mpgUS')return 235.214583/v;
    return 282.480936/v;
  };
  const fromLitersPer100=(v,u)=>{
    if(u==='l100')return v;
    if(u==='kml')return 100/v;
    if(u==='mpgUS')return 235.214583/v;
    return 282.480936/v;
  };
  function calculate() {
    const type=typeSelect.value, category=categories[type];
    const raw=input.value;
    if(!category||raw.trim()===''){output.value='';equation.textContent='أدخل قيمة لإجراء التحويل';copyButton.disabled=true;return;}
    const value=Number(raw),a=fromSelect.value,b=toSelect.value;
    if(!Number.isFinite(value)){output.value='';equation.textContent='أدخل رقمًا صالحًا';copyButton.disabled=true;return;}
    let converted;
    if(type==='temperature'){
      const c=toCelsius(value,a);
      if(c < -273.15-1e-9){setError('لا يمكن إدخال درجة أقل من الصفر المطلق.');return;}
      converted=fromCelsius(c,b);
    } else if(type==='fuel'){
      if(value<=0){setError('يجب أن يكون استهلاك الوقود أكبر من صفر.');return;}
      converted=fromLitersPer100(toLitersPer100(value,a),b);
    } else {
      converted=value*category.units[a].factor/category.units[b].factor;
    }
    hint.textContent=type==='fuel'?'تعتمد تحويلات كفاءة الوقود على النسبة العكسية.':type==='time'?'السنة اليوليانية = 365.25 يومًا.':'';
    output.value=format(converted);
    equation.textContent=format(value)+' '+a+' = '+format(converted)+' '+b;
    copyButton.disabled=!Number.isFinite(converted);
  }
  function setError(message){output.value='';equation.textContent=message;hint.textContent='';copyButton.disabled=true;}
  function changeCategory(key){
    if(!categories[key])return;
    typeSelect.value=key;
    const category=categories[key],entries=Object.entries(category.units);
    fromSelect.replaceChildren(...entries.map(([key,u])=>new Option(u.name,key)));
    toSelect.replaceChildren(...entries.map(([key,u])=>new Option(u.name,key)));
    fromSelect.value=category.default[0];toSelect.value=category.default[1];
    [...categoriesBox.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===key)));
    presets.replaceChildren();
    const suggestions={
      length:[['km','mile'],['cm','inch'],['m','ft']],
      mass:[['kg','lb'],['g','oz'],['t','kg']],
      area:[['ha','m2'],['ha','acre'],['m2','ft2']],
      temperature:[['c','f'],['c','k'],['f','c']],
      volume:[['l','ml'],['l','usgal'],['m3','l']],
      speed:[['kmh','mph'],['kmh','ms'],['knot','kmh']],
      time:[['h','min'],['day','h'],['week','day']],
      data:[['GB','GiB'],['MB','MiB'],['GB','MB']],
      pressure:[['bar','psi'],['kPa','bar'],['atm','Pa']],
      energy:[['kWh','J'],['kcal','kJ'],['Wh','kWh']],
      power:[['kW','hp'],['W','kW'],['metricHp','W']],
      fuel:[['l100','kml'],['l100','mpgUS'],['mpgUK','l100']]
    };
    for(const [a,b] of suggestions[key]){
      const button=document.createElement('button');button.type='button';button.className='unit-preset';
      button.textContent=a+' → '+b;
      button.title=label(a,category)+' إلى '+label(b,category);
      button.addEventListener('click',()=>{fromSelect.value=a;toSelect.value=b;calculate();});
      presets.append(button);
    }
    calculate();
  }
  for(const [key,{name,icon}] of Object.entries(categories)){
    const button=document.createElement('button');button.className='unit-category';button.type='button';
    button.dataset.type=key;button.setAttribute('aria-pressed','false');
    button.innerHTML='<i class="fa-solid '+icon+'" aria-hidden="true"></i><span>'+name+'</span>';
    button.addEventListener('click',()=>changeCategory(key));categoriesBox.append(button);
  }
  for(const key of Object.keys(categories))typeSelect.add(new Option(categories[key].name,key));
  typeSelect.addEventListener('change',()=>changeCategory(typeSelect.value));
  fromSelect.addEventListener('change',calculate);toSelect.addEventListener('change',calculate);
  input.addEventListener('input',calculate);
  document.getElementById('swap-btn').addEventListener('click',()=>{
    const old=fromSelect.value;fromSelect.value=toSelect.value;toSelect.value=old;
    if(output.value&&Number.isFinite(Number(output.value.replaceAll(',','')))){
      input.value=output.value.replaceAll(',','');
    }
    calculate();
  });
  copyButton.addEventListener('click',async()=>{
    if(copyButton.disabled)return;
    const text=equation.textContent;
    try {await navigator.clipboard.writeText(text);copyButton.textContent='تم النسخ';}
    catch {
      const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();
      const ok=document.execCommand('copy');temp.remove();copyButton.textContent=ok?'تم النسخ':'تعذر النسخ';
    }
    setTimeout(()=>{copyButton.innerHTML='<i class="fa-regular fa-copy" aria-hidden="true"></i> نسخ النتيجة';},1700);
  });
  changeCategory('length');
})();
