/* Restricted inline markup for rich headings and inner text items. */
const TAGS=new Set(['B','STRONG','I','EM','U','S','STRIKE','SPAN','MARK','FONT','BR']);
const SAFE_STYLES=new Set(['color','background-color','font-size','font-family','font-weight','font-style','text-decoration','text-decoration-line','text-shadow','letter-spacing','vertical-align','font-variant','line-height']);
export function sanitizeInlineHTML(html){
 const template=document.createElement('template');template.innerHTML=String(html||'');
 function clean(root){for(const n of Array.from(root.childNodes)){if(n.nodeType!==1){if(n.nodeType!==3)n.remove();continue;}if(['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH'].includes(n.tagName)){n.remove();continue;}clean(n);if(!TAGS.has(n.tagName)){n.replaceWith(...n.childNodes);continue;}for(const a of Array.from(n.attributes)){if(a.name==='style'){const st=n.style,keep=[];for(const p of SAFE_STYLES){const v=st.getPropertyValue(p);if(v && !/url\s*\(|expression|[<>]/i.test(v))keep.push(p+':'+v);}if(keep.length)n.setAttribute('style',keep.join(';'));else n.removeAttribute('style');}else if(n.tagName==='FONT'&&['color','face','size'].includes(a.name)){}else n.removeAttribute(a.name);}}}
 clean(template.content);return template.innerHTML;
}
export function applyGenericRich(root,block,ctx={}){
 if(['heading','text','layout','code'].includes(block.type))return;
 root.querySelectorAll('[data-ds-part-instance]').forEach(part=>{const instance=part.dataset.dsPartInstance;
  let node=ctx.editable?(part.matches('[data-edit]')?part:part.querySelector(':scope > [data-edit]')):part;
  if(!node||node.closest('[data-mini-index]')||node.matches('img,svg,canvas,pre')||(!ctx.editable&&node.children.length))return;
  if(ctx.editable){if(node.dataset.rich==='1')return;node.dataset.formatInstance=instance;node.dataset.rich='1';}
  const stored=block.data?.richParts?.[instance];if(stored&&stored.text===node.textContent.trim())node.innerHTML=sanitizeInlineHTML(stored.html);
 });
}
export function applyTypography(root,block){
 const map=block.style?.typography||{};root.querySelectorAll('[data-type-key],[data-ds-part-instance]').forEach(el=>{const m=/^mini:(\d+)$/.exec(el.dataset.typeKey||'');const instance=el.dataset.dsPartInstance;const s=m?block.data?.miniBlocks?.[Number(m[1])]?.typography:(el.dataset.typeKey?map[el.dataset.typeKey]:block.type==='table'?block.style?.cellTypography?.[instance]:map['part:'+instance]);if(!s)return;
  if(Number(s.size)>=8&&Number(s.size)<=120)el.style.fontSize=Number(s.size)+'px';
  if(['Vazirmatn','Inter','Georgia','system-ui','monospace','Arial','Tahoma','Times New Roman','Courier New'].includes(s.font))el.style.fontFamily=s.font;
  if(['400','500','600','700','800'].includes(String(s.weight)))el.style.fontWeight=String(s.weight);
  if(Number(s.lineHeight)>=1&&Number(s.lineHeight)<=3)el.style.lineHeight=String(Number(s.lineHeight));
  if(Number(s.letterSpacing)>=-2&&Number(s.letterSpacing)<=8)el.style.letterSpacing=Number(s.letterSpacing)+'px';
  if(/^#[0-9a-f]{6}$/i.test(s.color||''))el.style.color=s.color;
  if(['left','right','center','justify'].includes(s.align))el.style.textAlign=s.align;
  if(['super','sub'].includes(s.verticalAlign))el.style.verticalAlign=s.verticalAlign;if(s.italic)el.style.fontStyle='italic';if(s.underline||s.strike)el.style.textDecoration=[s.underline?'underline':'',s.strike?'line-through':''].filter(Boolean).join(' ');
  const effects={shadow:'2px 2px 3px rgba(0,0,0,.45)',glow:'0 0 7px #61a8ff,0 0 16px #408aff',emboss:'1px 1px 0 #fff,-1px -1px 0 #555',outline:'-1px -1px 0 #111,1px -1px 0 #111,-1px 1px 0 #111,1px 1px 0 #111'};if(effects[s.effect])el.style.textShadow=effects[s.effect];
  if(/^#[0-9a-f]{6}$/i.test(s.highlight||''))el.style.backgroundColor=s.highlight;
 });
}
