/* Keep absolutely positioned content within a naturally growing page. Self-contained for export. */
export function setupFreePage(page){
  if(!page || page.dataset.freeLayout!=='true')return {update(){},destroy(){}};
  let raf=0,dead=false;
  function update(){if(dead)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(dead)return;const blocks=Array.from(page.children).filter(el=>el.classList.contains('b'));let end=0;blocks.forEach(el=>{end=Math.max(end,el.offsetTop+el.offsetHeight)});const footer=page.querySelector(':scope > .doc-footer');page.style.setProperty('--free-footer-y',(end+22)+'px');page.style.minHeight=(end+(footer?footer.offsetHeight+50:28))+'px';});}
  const observer=new ResizeObserver(update);Array.from(page.children).forEach(el=>observer.observe(el));window.addEventListener('resize',update);update();
  return {update,destroy(){dead=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('resize',update);}};
}
