export const normalizeStation=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const names=station=>[station.name,station.name_fr,...(station.aliases||[]),...(station.sntf_names||[])].map(normalizeStation);
export function stationPicker({input,value,list,note},stations,createElement){
 const index=stations.map(station=>({station,names:names(station)}));
 let matches=[],active=-1;
 const help='اكتب بالعربية أو الفرنسية ثم اختر المحطة.';
 const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1};
 const choose=station=>{value.value=station?.id||'';input.value=station?.name||'';input.setCustomValidity('');note.textContent=station?'تم اختيار '+station.name:help;close()};
 function render(){
  const query=normalizeStation(input.value);
  list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');
  if(!query){matches=[];note.textContent=help;close();return}
  const found=index.map(item=>({...item,score:item.names.includes(query)?0:item.names.some(name=>name.startsWith(query))?1:item.names.some(name=>name.includes(query))?2:9}))
   .filter(item=>item.score<9).sort((a,b)=>a.score-b.score||a.station.name.localeCompare(b.station.name,'ar'));
  matches=found.slice(0,8).map(item=>item.station);
  matches.forEach((station,i)=>{
   const option=createElement('li');option.id=list.id+'-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.dataset.index=String(i);
   const ar=createElement('strong'),fr=createElement('small');ar.textContent=station.name;fr.textContent=station.name_fr||'';fr.lang='fr';fr.dir='ltr';option.append(ar,fr);list.append(option);
  });
  list.hidden=!matches.length;input.setAttribute('aria-expanded',String(matches.length>0));
  note.textContent=found.length>8?'أول 8 من '+found.length+' محطة مطابقة؛ أكمل الكتابة لتضييق البحث.':matches.length?matches.length+' محطة مطابقة؛ اختر من الاقتراحات.':'لا توجد محطة مطابقة ضمن الرحلات المدرجة.';
 }
 const highlight=i=>{active=i;[...list.children].forEach((option,j)=>option.setAttribute('aria-selected',String(j===i)));input.setAttribute('aria-activedescendant',list.children[i].id);list.children[i].scrollIntoView({block:'nearest'})};
 input.addEventListener('input',()=>{value.value='';input.setCustomValidity('');render()});
 input.addEventListener('focus',render);input.addEventListener('blur',close);
 const pick=event=>{const option=event.target.closest('[role="option"]');if(!option)return;const station=matches[Number(option.dataset.index)];if(!station)return;event.preventDefault();choose(station);input.focus();close()};
 list.addEventListener('pointerdown',pick);list.addEventListener('click',pick);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){close();return}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();if(list.hidden)render();if(matches.length)highlight(active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);
  }else if(event.key==='Enter'&&!list.hidden&&active>=0){event.preventDefault();choose(matches[active])}
  else if(event.key==='Tab')close();
 });
 note.textContent=help;close();
 return {set:choose,validate(){
  if(stations.some(station=>station.id===value.value))return true;
  const query=normalizeStation(input.value),exact=index.filter(item=>query&&item.names.includes(query));
  if(exact.length===1){choose(exact[0].station);return true}
  input.setCustomValidity('اختر محطة من الاقتراحات لإكمال البحث.');input.reportValidity();input.focus();return false;
 }};
}
