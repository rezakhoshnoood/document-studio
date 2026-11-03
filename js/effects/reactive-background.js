/* Reacts the base animation layer itself, separate from the optional pointer overlay. */
export function createReactiveBackground(target,opts={}){
 if(!target)return {destroy(){}};
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),pseudo=!!opts.pseudo,oldTranslate=target.style.translate,oldFilter=target.style.filter;let timer=0;
 target.dataset.reactiveBackground='true';target.dataset.reactiveMove=String(!!opts.move);target.dataset.reactiveClick=String(!!opts.click);
 function move(e){if(!opts.move||motion.matches)return;const x=Math.round(((e.clientX/Math.max(innerWidth,1))-.5)*24),y=Math.round(((e.clientY/Math.max(innerHeight,1))-.5)*24);if(pseudo){target.style.setProperty('--react-x',x+'px');target.style.setProperty('--react-y',y+'px');}else target.style.translate=x+'px '+y+'px';}
 function click(){if(!opts.click||motion.matches)return;if(pseudo)target.style.setProperty('--react-brightness','1.75');else target.style.filter='brightness(1.75)';clearTimeout(timer);timer=setTimeout(()=>{if(pseudo)target.style.setProperty('--react-brightness','1');else target.style.filter=oldFilter;},380);}
 function reduced(){if(motion.matches){target.style.translate=oldTranslate;target.style.filter=oldFilter;target.style.removeProperty('--react-x');target.style.removeProperty('--react-y');target.style.removeProperty('--react-brightness');}}
 if(opts.move)window.addEventListener('pointermove',move,{passive:true});if(opts.click)window.addEventListener('pointerdown',click,{passive:true});motion.addEventListener('change',reduced);
 return {destroy(){window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',click);motion.removeEventListener('change',reduced);clearTimeout(timer);target.style.translate=oldTranslate;target.style.filter=oldFilter;target.style.removeProperty('--react-x');target.style.removeProperty('--react-y');target.style.removeProperty('--react-brightness');delete target.dataset.reactiveBackground;delete target.dataset.reactiveMove;delete target.dataset.reactiveClick;}};
}
