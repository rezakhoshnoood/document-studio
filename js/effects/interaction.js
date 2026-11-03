/* Standalone-safe pointer effects: this function is also embedded in HTML exports. */
export function createInteraction(host, color='#4f8cff', opacity=.65, mode='trail') {
  const valid=['trail','ripples','spotlight','network'];if(!valid.includes(mode))mode='trail';
  const layer=document.createElement('canvas');layer.className='ds-interaction-layer';layer.dataset.interaction=mode;layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:host===document.body?'fixed':'absolute',inset:'0',width:'100%',height:host===document.body?'100%':'100vh',maxHeight:host===document.body?'none':'1200px',zIndex:'1',pointerEvents:'none',opacity:String(Math.max(0,Math.min(1,opacity)))});
  host.appendChild(layer);const x=layer.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,particles=[],last=0,mouse=null,w=0,h=0,frame=0;
  function resize(){const r=layer.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;layer.width=Math.max(1,w*d);layer.height=Math.max(1,h*d);x.setTransform(d,0,0,d,0,0);}
  function draw(){x.clearRect(0,0,w,h);frame++;
    if(mouse && mode==='spotlight'){const g=x.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,150);g.addColorStop(0,color);g.addColorStop(.35,color);g.addColorStop(1,'transparent');x.globalAlpha=.42;x.fillStyle=g;x.fillRect(mouse.x-150,mouse.y-150,300,300);}
    if(mouse && mode==='network'){for(let i=0;i<12;i++){const a=i*6.283/12+frame*.003,rad=65+18*Math.sin(i+frame*.015),px=mouse.x+Math.cos(a)*rad,py=mouse.y+Math.sin(a)*rad;x.globalAlpha=.36;x.strokeStyle=color;x.lineWidth=1;x.beginPath();x.moveTo(mouse.x,mouse.y);x.lineTo(px,py);x.stroke();x.globalAlpha=.85;x.fillStyle=color;x.beginPath();x.arc(px,py,2,0,6.283);x.fill();}}
    particles=particles.filter(d=>d.life>0);particles.forEach(d=>{d.life-=mode==='ripples'?.018:.025;d.x+=d.vx||0;d.y+=d.vy||0;d.r+=d.grow||0;x.globalAlpha=Math.max(0,d.life);x.beginPath();x.arc(d.x,d.y,d.r,0,6.283);if(d.ring){x.strokeStyle=color;x.lineWidth=2;x.stroke();}else{x.fillStyle=color;x.fill();}});x.globalAlpha=1;
    raf=(particles.length || (mouse && mode==='network'))?requestAnimationFrame(draw):0;
  }
  function add(e,burst){if(motion.matches)return;const rect=layer.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){mouse=null;return;}const px=e.clientX-rect.left,py=e.clientY-rect.top;mouse={x:px,y:py};const now=performance.now();
    if(burst || now-last>65){last=now;if(mode==='ripples'){particles.push({x:px,y:py,r:burst?8:3,grow:burst?2:.8,life:1,ring:true});}else if(mode==='trail'){for(let i=0;i<(burst?12:2);i++)particles.push({x:px,y:py,vx:(Math.random()-.5)*(burst?3:1),vy:(Math.random()-.5)*(burst?3:1),r:Math.random()*2+1,life:1});}else if(burst){particles.push({x:px,y:py,r:4,grow:2,life:1,ring:true});}}
    if(particles.length>100)particles=particles.slice(-100);if(!raf)draw();
  }
  const move=e=>add(e,false),click=e=>add(e,true),leave=()=>{mouse=null;},visibility=()=>{if(document.hidden){mouse=null;particles=[];if(raf)cancelAnimationFrame(raf);raf=0;x.clearRect(0,0,w,h);}};resize();window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',click,{passive:true});document.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visibility);const reduce=()=>{if(motion.matches){mouse=null;particles=[];if(raf)cancelAnimationFrame(raf);raf=0;x.clearRect(0,0,w,h);}};motion.addEventListener('change',reduce);
  return {destroy(){window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',click);document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',reduce);if(raf)cancelAnimationFrame(raf);particles=[];mouse=null;layer.remove();}};
}
