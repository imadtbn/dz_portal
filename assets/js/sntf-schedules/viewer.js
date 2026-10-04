export function createViewer(viewport,stage,image,output){
 let zoom=1,base=0,max=8,loaded=false,drag=null,pinch=null,lastTap=null,lastTouchZoom=0;
 const pointers=new Map();
 const clamp=z=>Math.max(1,Math.min(max,z));
 const point=()=>{const r=viewport.getBoundingClientRect();return {x:r.left+viewport.clientWidth/2,y:r.top+viewport.clientHeight/2}};
 function update(next,anchor=point()){
  if(!loaded)return;
  const before=stage.getBoundingClientRect(),ratio={x:(anchor.x-before.left)/before.width,y:(anchor.y-before.top)/before.height};
  zoom=clamp(next);stage.style.width=base*zoom+'px';stage.style.height=base*zoom*image.naturalHeight/image.naturalWidth+'px';
  const after=stage.getBoundingClientRect();viewport.scrollLeft+=after.left+ratio.x*after.width-anchor.x;viewport.scrollTop+=after.top+ratio.y*after.height-anchor.y;
  output.value=Math.round(zoom*100)+'%';output.textContent=output.value;
 }
 function fit(reset=true){
  if(!loaded)return;
  const style=getComputedStyle(viewport);base=Math.min(image.naturalWidth,viewport.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));max=Math.max(8,image.naturalWidth/base*2);if(!reset){update(zoom);return}zoom=1;
  stage.style.width=base+'px';stage.style.height=base*image.naturalHeight/image.naturalWidth+'px';viewport.scrollTo(0,0);output.value='100%';output.textContent='100%';
 }
 image.addEventListener('load',()=>{loaded=true;fit()});
 if(image.complete&&image.naturalWidth){loaded=true;fit()}
 function pair(){const [a,b]=[...pointers.values()];return {distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}}
 viewport.addEventListener('pointerdown',e=>{
  if(!loaded||e.button>0)return;
  viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};
  if(pointers.size===2){const p=pair();pinch={...p,zoom};drag=null;lastTap=null}
 });
 viewport.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2&&pinch){const p=pair();update(pinch.zoom*p.distance/Math.max(1,pinch.distance),p.center);viewport.scrollLeft-=p.center.x-pinch.center.x;viewport.scrollTop-=p.center.y-pinch.center.y;pinch.center=p.center}
  else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>8)drag.moved=true;viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy}
 },{passive:false});
 function end(e){
  const wasPinch=!!pinch;
  if(e.type==='pointerup'&&!wasPinch&&drag&&!drag.moved&&e.pointerType==='touch'){
   const now=Date.now(),p={x:e.clientX,y:e.clientY};
   if(lastTap&&now-lastTap.time<350&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){update(zoom<2?2:1,p);lastTouchZoom=now;lastTap=null}else lastTap={...p,time:now};
  }
  pointers.delete(e.pointerId);pinch=null;drag=null;
  if(pointers.size===1){const p=[...pointers.values()][0];drag={...p,left:viewport.scrollLeft,top:viewport.scrollTop,moved:true}}
 }
 viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 viewport.addEventListener('dblclick',e=>{if(e.pointerType==='touch'||Date.now()-lastTouchZoom<500)return;e.preventDefault();update(zoom<2?2:1,{x:e.clientX,y:e.clientY})});
 viewport.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();update(zoom*1.25)}else if(e.key==='-'){e.preventDefault();update(zoom/1.25)}else if(e.key==='0'){e.preventDefault();fit()}});
 // Observe the outer width, which cannot oscillate when image scrollbars appear.
 let width=viewport.getBoundingClientRect().width,resizeFrame=0;
 new ResizeObserver(()=>{
  const next=viewport.getBoundingClientRect().width;
  if(next<=0||Math.abs(next-width)<1)return;
  width=next;
  cancelAnimationFrame(resizeFrame);
  resizeFrame=requestAnimationFrame(()=>fit(false));
 }).observe(viewport,{box:'border-box'});
 return {in:()=>update(zoom*1.25),out:()=>update(zoom/1.25),native:()=>update(image.naturalWidth/base),reset:()=>fit(),refresh:()=>fit()};
}
