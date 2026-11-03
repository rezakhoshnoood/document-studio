/* Four lightweight, self-contained canvas effects. No network or library. */
export function createExtra(canvas, opts = {}, kind = 'stars') {
  const ctx=canvas.getContext('2d'),color=opts.color||'#4f8cff';let raf=0,w=0,h=0,items=[];
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function resize(){const d=Math.min(devicePixelRatio||1,2);w=canvas.clientWidth||innerWidth;h=canvas.clientHeight||innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);const n=Math.min(90,Math.max(24,Math.floor(w*h/12000)));items=Array.from({length:n},()=>({x:rnd(0,w),y:rnd(0,h),r:rnd(.8,3),speed:rnd(.3,1.3),phase:rnd(0,6.28)}));}
  function draw(){ctx.clearRect(0,0,w,h);items.forEach(o=>{o.phase+=.025;ctx.fillStyle=color;ctx.strokeStyle=color;
    if(kind==='rain'){ctx.globalAlpha=.25;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x-4,o.y+12);ctx.stroke();o.y+=o.speed*4;o.x-=.6;}
    else if(kind==='snow'){ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,6.283);ctx.fill();o.y+=o.speed;o.x+=Math.sin(o.phase)*.3;}
    else {ctx.globalAlpha=kind==='fireflies'?.25+.35*(1+Math.sin(o.phase))/2:.3+.35*(1+Math.sin(o.phase))/2;ctx.beginPath();ctx.arc(o.x,o.y,kind==='fireflies'?o.r*1.2:o.r*.7,0,6.283);ctx.fill();if(kind==='fireflies'){o.x+=Math.sin(o.phase)*.35;o.y-=o.speed*.3;} }
    if(o.y>h+20)o.y=-10;if(o.y< -20)o.y=h+10;if(o.x< -20)o.x=w+10;if(o.x>w+20)o.x=-10;
  });ctx.globalAlpha=1;raf=requestAnimationFrame(draw);}
  return {start(){resize();if(!raf)draw();window.addEventListener('resize',resize);},stop(){if(raf)cancelAnimationFrame(raf);raf=0;window.removeEventListener('resize',resize);ctx.clearRect(0,0,w,h);},destroy(){this.stop();items=[];}};
}
