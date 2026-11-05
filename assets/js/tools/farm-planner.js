
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('farm-form'), map = $('farm-map'), msg = $('farm-message');
  const outputIds = ['farm-count','farm-rows','farm-area','farm-density'];
  const maxMarkers = 12000;
  const storageKey = 'tools_dz_farm_planner_v1', diaryKey = 'tools_dz_farm_diary_v1';
  const fmt = (n, digits=2) => Number.isFinite(n) ? new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(n) : '—';
  const number = id => Number($(id).value);
  let last = null;
  const treeOptions = ['زيتون','خروب','لوز','حمضيات','تين','نخيل','رمان','مشمش','تفاح','أخرى'];
  const select = $('farm-tree');
  select.replaceChildren(...treeOptions.map(name => new Option(name,name)));
  function save() {
    try {
      const values = Object.fromEntries([...form.elements].filter(el => el.id && el.type !== 'button').map(el=>[el.id,el.value]));
      localStorage.setItem(storageKey,JSON.stringify(values));
    } catch (error) {console.warn('Cannot save farm plan',error);}
  }
  function load() {
    try {
      const values=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(!values)return;
      for(const [id,value] of Object.entries(values)) {
        const el=$(id);if(el && el.form===form)el.value=value;
      }
    }catch(error){console.warn('Cannot load farm plan',error);}
  }
  const rect=(x,y,w,h,fill,stroke)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+(stroke||'none')+'"/>';
  function plan(params){
    const {length,width,margin,betweenRows,betweenTrees,mode,pathWidth,pathEvery,reservedLength,reservedWidth}=params;
    const numeric=[length,width,margin,betweenRows,betweenTrees,pathWidth,pathEvery,reservedLength,reservedWidth];
    if(numeric.some(n=>!Number.isFinite(n))||length<=0||width<=0||betweenRows<=0||betweenTrees<=0||margin<0||pathWidth<0||reservedLength<0||reservedWidth<0||!Number.isInteger(pathEvery)||pathEvery<0)throw Error('أدخل أبعادًا ومسافات صحيحة، وأن يكون تكرار الممر عددًا صحيحًا.');
    if(margin*2>=Math.min(length,width))throw Error('الهامش يجب أن يترك مساحة قابلة للغرس داخل حدود الأرض.');
    if(reservedLength>length||reservedWidth>width)throw Error('أبعاد المساحة المحجوزة لا يمكن أن تتجاوز أبعاد الأرض.');
    const usableLength=length-2*margin,usableWidth=width-2*margin;
    const baseRowCount=Math.floor(usableWidth/betweenRows+1e-8)+1;
    const maxColumns=Math.floor(usableLength/betweenTrees+1e-8)+1;
    if(baseRowCount*maxColumns>250000)throw Error('كثافة الغرس كبيرة جدًا للعرض. زد المسافات أو قلّص مساحة المخطط.');
    if(baseRowCount>maxMarkers)throw Error('عدد الصفوف أكبر من الحد المسموح به للعرض.');
    const points=[], paths=[];
    let y=margin,rowIndex=0, plantedRows=0;
    const eps=1e-8;
    while(y <= width-margin+eps){
      if(pathEvery>0 && pathWidth>0 && plantedRows>0 && plantedRows%pathEvery===0){
        // Reserve a full horizontal band before the next row.
        paths.push({x:0,y:y-betweenRows/2,w:length,h:pathWidth});
        y+=pathWidth;
      }
      if(y>width-margin+eps)break;
      const offset=mode==='staggered' && rowIndex%2 ? betweenTrees/2 : 0;
      let colCount=0;
      for(let x=margin+offset;x<=length-margin+eps;x+=betweenTrees){
        if(reservedLength>0 && reservedWidth>0 && x<=reservedLength+eps && y<=reservedWidth+eps)continue;
        points.push({x,y});colCount++;
        if(points.length>maxMarkers)throw Error('عدد نقاط الغرس يتجاوز 12,000. زد المسافات أو قلّص الأرض.');
      }
      rowIndex++;plantedRows++;
      y+=betweenRows;
      if(rowIndex>250000)break;
    }
    return {points, paths, rows:rowIndex, area:length*width, density:points.length/(length*width/10000), width,length, margin,
      reservedLength,reservedWidth,mode,betweenRows,betweenTrees};
  }
  function buildSvg(p) {
    const pad=Math.max(1,Math.min(p.length,p.width)*.065);
    const stroke=Math.max(.045,Math.min(p.length,p.width)*.007);
    const r=Math.min(p.betweenRows,p.betweenTrees)*.11;
    const decorations=p.paths.map(path=>rect(path.x,path.y,Math.max(path.w,.01),Math.max(path.h,.01),'#d5bd87')).join('');
    const reserved=p.reservedLength&&p.reservedWidth?rect(0,0,p.reservedLength,p.reservedWidth,'#a4c6e6','#4f7899'):'';
    const dots=p.points.map(pt=>'<circle cx="'+pt.x+'" cy="'+pt.y+'" r="'+r+'" fill="#27884d" stroke="#155c31" stroke-width="'+Math.max(.02,stroke*.22)+'"/>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(-pad)+' '+(-pad)+' '+(p.length+2*pad)+' '+(p.width+2*pad)+'" role="img" aria-label="مخطط توزيع '+p.points.length+' شجرة على أرض مستطيلة" preserveAspectRatio="xMidYMid meet">'+
      rect(0,0,p.length,p.width,'#edf6e8','#7e6e44')+decorations+reserved+dots+'</svg>';
  }
  function update(){
    try {
      const p=plan({length:number('farm-length'),width:number('farm-width'),margin:number('farm-margin'),
        betweenRows:number('farm-row-gap'),betweenTrees:number('farm-tree-gap'),mode:$('farm-mode').value,
        pathWidth:number('farm-path-width'),pathEvery:number('farm-path-every'),
        reservedLength:number('farm-reserved-length'),reservedWidth:number('farm-reserved-width')});
      last=p;
      $('farm-count').textContent=fmt(p.points.length,0);
      $('farm-rows').textContent=fmt(p.rows,0);
      $('farm-area').textContent=fmt(p.area);
      $('farm-density').textContent=fmt(p.density,0);
      map.innerHTML=buildSvg(p);
      msg.classList.remove('farm-error');
      msg.textContent='مخطط تقريبي لأرض مستطيلة. تم حساب '+fmt(p.points.length,0)+' موضع غرس. الممرات والمساحة المحجوزة باللونين الأصفر والأزرق.';
      $('farm-plan-name').textContent=$('farm-tree').value;
      calculateIrrigation();calculateBudget();
    } catch(error) {
      last=null;
      outputIds.forEach(id=>$(id).textContent='—');
      map.textContent='تعذر رسم المخطط قبل تصحيح المدخلات.';
      msg.textContent=error.message;
      msg.classList.add('farm-error');
      calculateIrrigation();calculateBudget();
    }
  }
  function download(filename,contents,type){
    const link=document.createElement('a'),url=URL.createObjectURL(new Blob([contents],{type}));
    link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  }
  function calculateIrrigation(){
    const trees=last?.points.length||0, drippers=number('farm-drippers'),flow=number('farm-flow'),hours=number('farm-hours'),days=number('farm-days');
    if(!last||[drippers,flow,hours,days].some(n=>!Number.isFinite(n)||n<0)||days>31){
      $('farm-water').textContent='—';$('farm-water-month').textContent='—';$('farm-irrigation-note').textContent='تأكد من المخطط ومدخلات الري.';return;
    }
    const liters=trees*drippers*flow*hours;
    $('farm-water').textContent=fmt(liters)+' لتر/ريّة';
    $('farm-water-month').textContent=fmt(liters*days/1000)+' م³/الفترة';
    $('farm-irrigation-note').textContent='حساب هيدروليكي للتدفق فقط، وليس توصية بكمية الماء المطلوبة للنبات. أدخل برنامج الري المناسب لمناخك وتربتك.';
  }
  function calculateBudget(){
    const fields=['farm-seedling-cost','farm-install-cost','farm-irrigation-cost','farm-labor-cost'];
    const costs=fields.map(number);
    if(!last||costs.some(n=>!Number.isFinite(n)||n<0)){
      $('farm-budget-total').textContent='—';$('farm-budget-per-tree').textContent='—';return;
    }
    const total=last.points.length*costs[0]+costs[1]+costs[2]+costs[3];
    $('farm-budget-total').textContent=fmt(total)+' دج';
    $('farm-budget-per-tree').textContent=last.points.length?fmt(total/last.points.length)+' دج/شجرة':'—';
  }
  function getDiary(){
    try {const v=JSON.parse(localStorage.getItem(diaryKey)||'[]');return Array.isArray(v)?v:[];}
    catch{return [];}
  }
  function renderDiary(){
    const entries=getDiary();
    $('farm-diary-list').replaceChildren();
    if(!entries.length){const p=document.createElement('p');p.className='farm-help';p.textContent='لا توجد أعمال مسجلة بعد.';$('farm-diary-list').append(p);return;}
    entries.forEach(entry=>{
      const tr=document.createElement('tr');
      for(const value of [entry.date,entry.task,entry.note]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
      const cell=document.createElement('td'),button=document.createElement('button');
      button.type='button';button.className='farm-btn farm-btn-secondary';button.textContent='حذف';button.setAttribute('aria-label','حذف سجل '+entry.date);
      button.addEventListener('click',()=>{try{localStorage.setItem(diaryKey,JSON.stringify(getDiary().filter(item=>item.id!==entry.id)));renderDiary();}catch{alert('تعذر تحديث السجل المحلي.');}});
      cell.append(button);tr.append(cell);$('farm-diary-list').append(tr);
    });
  }
  form.addEventListener('input',()=>{save();update();});
  form.addEventListener('change',()=>{save();update();});
  $('farm-irrigation-controls').addEventListener('input',calculateIrrigation);
  $('farm-budget-controls').addEventListener('input',calculateBudget);
  $('farm-export-svg').addEventListener('click',()=>{if(last)download('tools-dz-farm-plan.svg',buildSvg(last),'image/svg+xml;charset=utf-8');});
  $('farm-export-json').addEventListener('click',()=>{
    if(!last)return;
    const {points,...summary}=last;
    const config=Object.fromEntries([...form.elements].filter(el=>el.id).map(el=>[el.id,el.value]));
    download('tools-dz-farm-plan.json',JSON.stringify({version:1,createdAt:new Date().toISOString(),tree:select.value,config,summary,points},null,2),'application/json;charset=utf-8');
  });
  $('farm-print').addEventListener('click',()=>{if(last)window.print();});
  $('farm-reset').addEventListener('click',()=>{form.reset();try{localStorage.removeItem(storageKey);}catch{} update();});
  $('farm-diary-form').addEventListener('submit',event=>{
    event.preventDefault();
    const date=$('farm-diary-date').value,task=$('farm-diary-task').value,note=$('farm-diary-note').value.trim();
    if(!date||!task)return;
    const list=getDiary();list.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2),date,task,note:note.slice(0,300)});
    try{localStorage.setItem(diaryKey,JSON.stringify(list.slice(0,200)));$('farm-diary-form').reset();renderDiary();}
    catch{alert('تعذر حفظ السجل. قد تكون مساحة التخزين ممتلئة.');}
  });
  $('farm-diary-export').addEventListener('click',()=>download('tools-dz-farm-diary.json',JSON.stringify(getDiary(),null,2),'application/json;charset=utf-8'));
  $('farm-diary-date').value=new Date().toISOString().slice(0,10);
  load();update();renderDiary();
})();
