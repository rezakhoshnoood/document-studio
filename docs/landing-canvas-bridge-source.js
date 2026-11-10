(()=>{
 'use strict';
 const root=document.documentElement, token=root.getAttribute('data-ds-bridge-token'), revision=Number(root.getAttribute('data-ds-bridge-rev')||0), editable=root.getAttribute('data-ds-bridge-edit')==='1', lang=root.getAttribute('data-ds-bridge-lang')||'en';
 let mode=root.getAttribute('data-ds-bridge-mode')||'flow',selected=root.getAttribute('data-ds-bridge-selected')||'', editNode=null,drag=null,scrollTimer=0;
 const send=(type,data={})=>parent.postMessage({type,token,revision,...data},'*');
 const hasPath=e=>e&&e.closest&&e.closest('[data-ds-preview-path]');
 const getPath=e=>e?.getAttribute('data-ds-preview-path');
 const find=p=>Array.from(document.querySelectorAll('[data-ds-preview-path]')).find(e=>getPath(e)===p);
 const overlay=document.createElement('div');overlay.setAttribute('data-ds-tool','outline');
 overlay.style.cssText='position:fixed;z-index:2147483645;pointer-events:none;border:2px solid #356bff;box-sizing:border-box;display:none;box-shadow:0 0 0 1px white;';
 const handle=document.createElement('button');handle.type='button';handle.textContent='⠿';handle.setAttribute('data-ds-tool','move');handle.setAttribute('aria-label',lang==='fa'?'کشیدن برای جابه‌جایی':'Drag to move');
 handle.style.cssText='position:fixed;z-index:2147483647;width:32px;height:32px;border:2px solid white;border-radius:7px;background:#356bff;color:white;font:bold 20px/25px sans-serif;cursor:grab;touch-action:none;display:none;box-shadow:0 2px 8px #0004;';
 const resize=document.createElement('button');resize.type='button';resize.textContent='↘';resize.setAttribute('data-ds-tool','resize');resize.setAttribute('aria-label',lang==='fa'?'کشیدن برای تغییر اندازه':'Drag to resize');
 resize.style.cssText='position:fixed;z-index:2147483647;width:28px;height:28px;border:2px solid white;border-radius:6px;background:#356bff;color:white;font:bold 18px/22px sans-serif;cursor:nwse-resize;touch-action:none;display:none;box-shadow:0 2px 8px #0004;';
 const marker=document.createElement('div');marker.style.cssText='position:fixed;z-index:2147483646;height:4px;background:#14c0b2;box-shadow:0 0 0 1px white;pointer-events:none;display:none;';
 document.documentElement.append(overlay,handle,resize,marker);
 function draw(){
  const target=find(selected);if(!editable||!target||target===document.body||editNode){overlay.style.display=handle.style.display=resize.style.display='none';return;}
  const r=target.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight){overlay.style.display=handle.style.display=resize.style.display='none';return;}
  Object.assign(overlay.style,{display:'block',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  Object.assign(handle.style,{display:'block',left:Math.max(0,Math.min(innerWidth-32,r.left))+'px',top:Math.max(0,r.top-16)+'px'});
  Object.assign(resize.style,{display:'block',left:Math.max(0,Math.min(innerWidth-28,r.right-14))+'px',top:Math.max(0,Math.min(innerHeight-28,r.bottom-14))+'px'});
 }
 function select(el){if(!el)return;selected=getPath(el)||'';draw();send('ds-canvas-select',{path:selected});}
 document.addEventListener('click',e=>{
  if(!e.isTrusted||e.target.closest('[data-ds-tool]'))return;
  if(editNode&&editNode.contains(e.target))return;
  const el=hasPath(e.target);if(!el)return;select(el);
  if(editable||e.target.closest('a,form')){e.preventDefault();if(editable)e.stopPropagation();}
 },true);
 document.addEventListener('dblclick',e=>{
  if(!editable||!e.isTrusted||e.target.closest('[data-ds-tool]'))return;
  const el=hasPath(e.target);if(!el||el===document.body||el.children.length||!/^(H[1-6]|P|SPAN|A|BUTTON|LI|STRONG|EM|B|I|LABEL|SMALL|DIV|ARTICLE)$/.test(el.tagName))return;
  e.preventDefault();e.stopPropagation();select(el);editNode=el;const original=el.textContent||'',old=el.getAttribute('contenteditable');el.setAttribute('contenteditable','plaintext-only');el.focus();draw();
  function done(cancel=false){if(!editNode)return;const text=el.innerText??el.textContent??'';if(old===null)el.removeAttribute('contenteditable');else el.setAttribute('contenteditable',old);editNode=null;el.removeEventListener('blur',onBlur);el.removeEventListener('keydown',onKey);el.removeEventListener('paste',onPaste);if(!cancel&&text!==original)send('ds-canvas-text',{path:getPath(el),text,scrollY:window.scrollY});else{if(cancel)el.textContent=original;draw();}}
  const onBlur=()=>done(false);const onKey=ev=>{if(ev.key==='Escape'){ev.preventDefault();done(true);}else if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();el.blur();}};
  const onPaste=ev=>{ev.preventDefault();document.execCommand('insertText',false,ev.clipboardData?.getData('text/plain')||'');};
  el.addEventListener('blur',onBlur);el.addEventListener('keydown',onKey);el.addEventListener('paste',onPaste);
 },true);
 function locate(x,y){handle.style.pointerEvents='none';resize.style.pointerEvents='none';const hit=document.elementFromPoint(x,y);handle.style.pointerEvents='auto';resize.style.pointerEvents='auto';return hasPath(hit);}
 function place(el,y){if(!el||el===document.body)return 'inside';const r=el.getBoundingClientRect();return y<r.top+r.height/2?'before':'after';}
 function showMarker(el,placement){if(!el){marker.style.display='none';return;}const r=el.getBoundingClientRect();marker.style.display='block';marker.style.left=r.left+'px';marker.style.width=Math.max(20,r.width)+'px';marker.style.top=(placement==='before'?r.top:placement==='after'?r.bottom:r.top+4)+'px';}
 function startDrag(kind,e){if(!editable||!e.isTrusted||!selected)return;e.preventDefault();e.stopPropagation();const target=find(selected);if(!target)return;const rect=target.getBoundingClientRect();drag={kind,path:selected,x:e.clientX,y:e.clientY,width:rect.width,height:rect.height};e.currentTarget.setPointerCapture(e.pointerId);}
 handle.addEventListener('pointerdown',e=>startDrag('move',e));resize.addEventListener('pointerdown',e=>startDrag('resize',e));
 function move(e){if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.kind==='move'&&mode==='flow'){const target=locate(e.clientX,e.clientY);const placement=e.altKey?'inside':place(target,e.clientY);showMarker(target,placement);}else {overlay.style.transform=drag.kind==='move'?`translate(${dx}px,${dy}px)`:'none';if(drag.kind==='resize'){overlay.style.width=Math.max(8,drag.width+dx)+'px';overlay.style.height=Math.max(8,drag.height+dy)+'px';}}}
 function end(e){if(!drag)return;const d=drag;drag=null;marker.style.display='none';overlay.style.transform='';const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)<5){draw();return;}
  if(d.kind==='resize')send('ds-canvas-resize',{path:d.path,width:d.width+dx,height:d.height+dy,scrollY:window.scrollY});
  else if(mode==='free')send('ds-canvas-offset',{path:d.path,dx,dy,scrollY:window.scrollY});
  else {const target=locate(e.clientX,e.clientY);if(target)send('ds-canvas-move',{path:d.path,target:getPath(target)||'',placement:e.altKey?'inside':place(target,e.clientY),scrollY:window.scrollY});else draw();}
 }
 [handle,resize].forEach(x=>{x.addEventListener('pointermove',move);x.addEventListener('pointerup',end);x.addEventListener('pointercancel',()=>{drag=null;marker.style.display='none';overlay.style.transform='';draw();});});
 document.addEventListener('dragover',e=>{if(!editable||!e.dataTransfer)return; e.preventDefault();const target=hasPath(e.target);showMarker(target,e.altKey?'inside':place(target,e.clientY));},true);
 document.addEventListener('dragleave',e=>{if(!e.relatedTarget)marker.style.display='none';},true);
 document.addEventListener('drop',e=>{if(!editable||!e.isTrusted||!e.dataTransfer)return;const value=e.dataTransfer.getData('text/plain');if(!value.startsWith('DS-LANDING:'))return;e.preventDefault();e.stopPropagation();marker.style.display='none';const target=hasPath(e.target);if(target)send('ds-canvas-insert',{kind:value.slice(11),target:getPath(target)||'',placement:e.altKey?'inside':place(target,e.clientY),scrollY:window.scrollY});},true);
 document.addEventListener('keydown',e=>{if(!editable||!e.isTrusted||editNode||!selected)return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();send('ds-canvas-delete',{path:selected,scrollY:window.scrollY});}},true);
 window.addEventListener('message',e=>{if(e.source!==parent||e.data?.token!==token||e.data?.revision!==revision)return;if(e.data.type==='ds-parent-select'){selected=String(e.data.path||'');const target=find(selected);if(target&&e.data.scroll)target.scrollIntoView({block:'nearest',inline:'nearest'});draw();}else if(e.data.type==='ds-parent-mode'){mode=e.data.mode==='free'?'free':'flow';}else if(e.data.type==='ds-parent-drop'&&editable&&Number.isFinite(e.data.x)&&Number.isFinite(e.data.y)){const target=locate(e.data.x,e.data.y);if(target)send('ds-canvas-insert',{kind:e.data.kind,target:getPath(target)||'',placement:e.data.inside?'inside':place(target,e.data.y),scrollY:window.scrollY});}});
 window.addEventListener('scroll',()=>{draw();clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>send('ds-canvas-scroll',{scrollY:window.scrollY}),80);},{passive:true});window.addEventListener('resize',draw);
 document.addEventListener('submit',e=>e.preventDefault(),true);
 requestAnimationFrame(()=>{window.scrollTo(0,Number(root.getAttribute('data-ds-bridge-scroll')||0));draw();});
})();
