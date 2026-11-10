/* Extract and insert reusable HTML snapshots; no script execution in the editor document. */
import {nodePath} from './landing-engine.js';
export function suggestComponents(doc){
 const list=[];
 for(const n of doc.body.querySelectorAll('header,nav,main,section,article,aside,footer,form,figure,div[class],div[id]')){
  if(list.length>=80)break;if(n.closest('template')||n.outerHTML.length>100000)continue;
  const depth=nodePath(n,doc.body);if(!depth)continue;
  const text=(n.querySelector('h1,h2,h3,h4')?.textContent||n.getAttribute('aria-label')||n.id||n.classList[0]||n.tagName).trim().replace(/\s+/g,' ').slice(0,60);
  list.push({path:depth,name:text,tag:n.tagName.toLowerCase()});
 }
 return list;
}
export function insertHTMLSnapshot(doc,html,target,placement){
 const temp=doc.createElement('template');temp.innerHTML=String(html||'');const node=temp.content.firstElementChild;if(!node)return null;
 for(const n of [node,...node.querySelectorAll('[data-ds-responsive-id]')]){const id=n.getAttribute('data-ds-responsive-id');if(!id)continue;const mobile=readResponsive(doc,n,'mobile'),tablet=readResponsive(doc,n,'tablet');n.removeAttribute('data-ds-responsive-id');if(Object.keys(tablet).length)applyResponsive(doc,n,'tablet',tablet);if(Object.keys(mobile).length)applyResponsive(doc,n,'mobile',mobile);}
 const suffix='-copy-'+Math.random().toString(36).slice(2,8),ids=new Map();
 for(const n of [node,...node.querySelectorAll('[id]')]){const id=n.getAttribute('id');if(id){const next=id+suffix;ids.set(id,next);n.id=next;}}
 for(const n of [node,...node.querySelectorAll('*')]){
  for(const name of ['for','aria-labelledby','aria-describedby','aria-controls','headers']){const v=n.getAttribute(name);if(v)n.setAttribute(name,v.split(/\s+/).map(x=>ids.get(x)||x).join(' '));}
  const href=n.getAttribute('href');if(href?.startsWith('#')&&ids.has(href.slice(1)))n.setAttribute('href','#'+ids.get(href.slice(1)));
 }
 if(placement==='inside')target.append(node);else if(placement==='before')target.before(node);else if(placement==='after')target.after(node);else return null;
 return node;
}
export function applyResponsive(doc,node,breakpoint,properties){
 let rid=node.getAttribute('data-ds-responsive-id');if(!rid){rid='r'+Math.random().toString(36).slice(2,12);node.setAttribute('data-ds-responsive-id',rid);}
 let style=doc.head.querySelector('style[data-ds-responsive-rules]');if(!style){style=doc.createElement('style');style.setAttribute('data-ds-responsive-rules','');doc.head.append(style);}
 // Rules are represented as JSON in a data attribute so they survive source edits, undo and export.
 let map={};try{map=JSON.parse(style.getAttribute('data-ds-responsive-map')||'{}');}catch(_){map={};}
 if(!map[rid])map[rid]={};const clean={};const validator=doc.createElement('div').style;
 for(const [k,v] of Object.entries(properties)){if(!['width','font-size','padding','display'].includes(k)||!v.trim())continue;validator.removeProperty(k);validator.setProperty(k,v);const accepted=validator.getPropertyValue(k);if(accepted)clean[k]=accepted;}
 if(Object.keys(clean).length)map[rid][breakpoint]=clean;else delete map[rid][breakpoint];if(!Object.keys(map[rid]).length)delete map[rid];
 style.setAttribute('data-ds-responsive-map',JSON.stringify(map));
 const rules=[];for(const [id,bps] of Object.entries(map)){if(!/^r[a-z0-9]+$/.test(id)||!bps||typeof bps!=='object')continue;for(const bp of ['tablet','mobile']){const vals=bps[bp];if(!vals||typeof vals!=='object')continue;const valid=[];for(const [k,v] of Object.entries(vals)){if(!['width','font-size','padding','display'].includes(k)||typeof v!=='string')continue;validator.removeProperty(k);validator.setProperty(k,v);if(validator.getPropertyValue(k))valid.push(k+':'+validator.getPropertyValue(k)+' !important');}if(valid.length)rules.push(`@media (max-width:${bp==='mobile'?'480':'768'}px){[data-ds-responsive-id="${id}"]{${valid.join(';')}}}`);}}
 style.textContent=rules.join('\n').replace(/</g,'\\3c ');return map[rid]?.[breakpoint]||{};
}
export function readResponsive(doc,node,bp){const rid=node.getAttribute('data-ds-responsive-id');try{return JSON.parse(doc.head.querySelector('style[data-ds-responsive-rules]')?.getAttribute('data-ds-responsive-map')||'{}')[rid]?.[bp]||{};}catch(_){return {};}}
