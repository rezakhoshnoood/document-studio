/* Rectangular, deterministic free-layout collision handling; the moved block stays anchored in push mode. */
export function arrangeFree(doc,page,anchorId,mode='push'){
 if(!page||!doc.settings?.freeLayout||mode==='off')return false;
 const pw=page.clientWidth||page.getBoundingClientRect().width;if(!pw)return false;
 const items=(doc.blocks||[]).map((block,index)=>{const el=Array.from(page.querySelectorAll(':scope > .b')).find(x=>x.dataset.id===block.id);if(!el)return null;const r=el.getBoundingClientRect();return {block,index,x:Number(block.style.freeX)||0,y:Number(block.style.freeY)||0,w:r.width,h:r.height};}).filter(Boolean);
 if(!items.length)return false;const gap=12;let changed=false;
 function set(item,x,y){x=Math.max(0,Math.min(100-(Number(item.block.style.blockWidth)||100),x));y=Math.max(0,Math.min(50000,y));x=Math.round(x*10)/10;y=Math.round(y);if(x!==Number(item.block.style.freeX)||y!==Number(item.block.style.freeY)){item.block.style.freeX=x;item.block.style.freeY=y;changed=true;}item.x=x;item.y=y;}
 if(mode==='reflow'){
  items.sort((a,b)=>a.y-b.y||a.x-b.x||a.index-b.index);let x=0,y=16,rowH=0;
  for(const it of items){const wp=Math.max(5,Math.min(100,Number(it.block.style.blockWidth)||100)),gapPct=gap/pw*100;if(x>0&&x+wp>100.001){x=0;y+=rowH+gap;rowH=0;}set(it,x,y);x+=wp+gapPct;rowH=Math.max(rowH,it.h);}
 }else{
  const anchor=items.find(it=>it.block.id===anchorId),placed=anchor?[anchor]:[];
  const rest=items.filter(it=>it!==anchor).sort((a,b)=>a.y-b.y||a.x-b.x||a.index-b.index);
  for(const it of rest){let y=it.y;for(let pass=0;pass<items.length+1;pass++){let next=y;for(const a of placed){const horizontal=it.x*pw/100<a.x*pw/100+a.w+gap && it.x*pw/100+it.w+gap>a.x*pw/100;const vertical=y<a.y+a.h+gap && y+it.h+gap>a.y;if(horizontal&&vertical)next=Math.max(next,a.y+a.h+gap);}if(next===y)break;y=next;}set(it,it.x,y);placed.push(it);}
 }
 return changed;
}
