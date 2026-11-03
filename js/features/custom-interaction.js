import { customBackgroundDocument } from './custom-background.js';
export const INTERACTION_EXAMPLE={html:'<div id="dot"></div>',css:'html,body{background:transparent}\n#dot{position:absolute;width:28px;height:28px;border-radius:50%;background:#36a4ff;box-shadow:0 0 28px #36a4ff;transform:translate(-50%,-50%);pointer-events:none}',js:"const dot=document.getElementById('dot');\nwindow.addEventListener('message',event=>{const p=event.data;if(!p || p.type!=='ds-pointer')return;dot.style.left=p.x+'px';dot.style.top=p.y+'px';});"};
// Self-contained except customBackgroundDocument, which is also embedded in HTML exports.
export function createCustomInteraction(host,code,opacity=.65){
 const frame=document.createElement('iframe');frame.className='ds-custom-interaction';frame.title='Custom interactive effect';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 Object.assign(frame.style,{position:host===document.body?'fixed':'absolute',top:'0',left:'0',width:'100%',height:host===document.body?'100%':'100vh',maxHeight:host===document.body?'none':'1200px',border:'0',pointerEvents:'none',zIndex:'1',opacity:String(Math.max(0,Math.min(1,opacity)))});frame.srcdoc=customBackgroundDocument(code||{});host.appendChild(frame);
 let raf=0,pending=null;const motion=matchMedia('(prefers-reduced-motion: reduce)');
 function dispatch(e){if(motion.matches)return;const r=frame.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;pending={type:'ds-pointer',event:e.type,x:e.clientX-r.left,y:e.clientY-r.top,width:r.width,height:r.height};if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(pending&&frame.contentWindow)frame.contentWindow.postMessage(pending,'*');pending=null;});}
 window.addEventListener('pointermove',dispatch,{passive:true});window.addEventListener('pointerdown',dispatch,{passive:true});
 return {destroy(){window.removeEventListener('pointermove',dispatch);window.removeEventListener('pointerdown',dispatch);if(raf)cancelAnimationFrame(raf);frame.remove();}};
}
