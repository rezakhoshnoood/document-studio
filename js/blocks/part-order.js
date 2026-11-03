/* Reorder only semantically safe siblings; table structure is intentionally excluded. */
export function applyPartOrder(root,block){
 if(block.type==='table')return;
 const groups=new Map();
 root.querySelectorAll('[data-ds-part-instance],[data-mini-index]').forEach(el=>{
  if(el.closest('[data-mini-index]')!==el && el.closest('[data-mini-index]'))return;
  const key=el.hasAttribute('data-mini-index')?'mini:'+el.dataset.miniIndex:el.dataset.dsPartInstance;
  const parent=el.parentElement;if(!parent||!key)return;let list=groups.get(parent);if(!list)groups.set(parent,list=[]);list.push([key,el]);
 });
 const groupPaths=new Map();for(const [parent,children] of groups){if(children.length<2)continue;let node=parent,path=[];while(node&&node!==root){const par=node.parentElement;if(!par)break;path.push(Array.prototype.indexOf.call(par.children,node));node=par;}if(node===root)groupPaths.set(parent,'p:'+path.reverse().join('.'));}
 for(const [parent,children] of groups){
  if(children.length<2 || !groupPaths.has(parent))continue;
  const group=groupPaths.get(parent);
  parent.dataset.reorderGroup=group;
  children.forEach(([key,el])=>{el.dataset.reorderKey=key;el.dataset.reorderGroup=group;});
  const saved=block.style?.partOrders?.[group];if(!Array.isArray(saved))continue;
  const byKey=new Map(children),seen=new Set(),sorted=saved.filter(k=>byKey.has(k)&&!seen.has(k)&&(seen.add(k),true)).map(k=>byKey.get(k));
  children.forEach(([k,el])=>{if(!seen.has(k))sorted.push(el);});
  const slots=children.map(([,el])=>el),markers=slots.map(el=>{const mark=document.createComment('part-slot');el.before(mark);return mark;});
  sorted.forEach((el,i)=>markers[i].replaceWith(el));
 }
}
