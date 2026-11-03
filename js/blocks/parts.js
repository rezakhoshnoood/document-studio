/* Stable visual-part controls. Text parts fade only ink, not their fills. */
const specs={
 hero:[['title','عنوان','Title','.hero-title','text'],['subtitle','زیرعنوان','Subtitle','.hero-sub','text'],['badge','متن نشان','Badge text','.hero-badge','text'],['meta','متادیتا','Metadata','.hero-meta span','text'],['icon','آیکون','Icon','.hero-icon','visual']],
 heading:[['title','عنوان','Heading','h1,h2,h3,h4','text'],['line','خط زیر عنوان','Underline','.underline','visual']],
 text:[['body','متن اصلی','Body text','.text-body','text']],
 table:[['caption','عنوان جدول','Caption','caption','text'],['header','متن سرستون‌ها','Header text','thead th','text'],['cells','متن سلول‌ها','Cell text','tbody td','text'],['footer','متن جمع','Footer text','tfoot td','text']],
 chart:[['title','عنوان','Title','.chart-title','text'],['plot','نمودار','Chart graphic','svg,canvas','visual'],['legend','راهنما','Legend','.legend','text']],
 timeline:[['date','تاریخ','Date','.tl-date','text'],['title','عنوان رویداد','Event title','.tl-title','text'],['desc','توضیح','Description','.tl-desc','text'],['dot','نشانگر','Markers','.tl-dot','visual']],
 'stat-grid':[['value','مقدار','Value','.stat-value','text'],['label','برچسب','Label','.stat-label','text'],['icon','آیکون','Icon','.stat-icon','visual']],
 sign:[['name','نام','Name','.sign-name','text'],['title','عنوان','Title','.sign-title','text'],['image','تصویر امضا','Signature image','img','visual'],['line','خط امضا','Signature line','.sign-line','visual']],
 logo:[['image','لوگو','Logo','img','visual']],
 image:[['image','تصویر','Image','img','visual'],['caption','توضیح تصویر','Caption','figcaption','text']],
 code:[['code','متن کد','Code text','pre','text'],['head','سربرگ','Header','.code-head','text']],
 flow:[['graphic','نمودار','Diagram','svg','visual'],['caption','عنوان','Caption','.b-flow > .hint','text']],
 divider:[['line','خط و نماد','Line and symbol',':scope > .b-divider > div, :scope > .b-divider > span','visual']],
 layout:[['content','متن چیدمان','Layout text','.custom-layout-content','text'],['media','تصاویر چیدمان','Layout images','img','visual']]
};
export function partSpecs(type, root) {return (specs[type]||[]).filter(p=>!root||root.querySelector(p[3]));}
export function hasFadedTextParts(style={}) {return Object.values(style.partOpacity||{}).some(v=>Number(v)<100) || Object.values(style.cellOpacity||{}).some(v=>Number(v)<100);}
export function applyPartOpacity(root,block) {
 if(!root)return;
 if(block.type==='table'){
  root.querySelectorAll('thead th').forEach((el,c)=>el.style.setProperty('--detail-ink-opacity',String(Math.max(0,Math.min(100,Number(block.style?.cellOpacity?.['h:'+c]??100)))/100)));
  root.querySelectorAll('tfoot td').forEach((el,c)=>el.style.setProperty('--detail-ink-opacity',String(Math.max(0,Math.min(100,Number(block.style?.cellOpacity?.['f:'+c]??100)))/100)));
  root.querySelectorAll('tbody tr').forEach((row,r)=>Array.from(row.cells).forEach((el,c)=>el.style.setProperty('--detail-ink-opacity',String(Math.max(0,Math.min(100,Number(block.style?.cellOpacity?.['r:'+r+':'+c]??100)))/100))));
 }
 for(const [key,fa,en,selector,kind] of partSpecs(block.type,root)){
  const value=Math.max(0,Math.min(100,Number(block.style?.partOpacity?.[key]??100)))/100;
  let nodes=Array.from(root.querySelectorAll(selector));
  if((block.type==='text'&&key==='body')||(block.type==='layout'&&key==='content')){const nested=nodes.flatMap(el=>Array.from(el.querySelectorAll('p,li,h1,h2,h3,h4,blockquote')));if(nested.length)nodes=nested;}
  nodes.forEach((el,i)=>{
   if(block.type==='text'&&!el.hasAttribute('data-ds-original-style'))el.dataset.dsOriginalStyle=el.getAttribute('style')??'__no_style__';
   let instance=key+':'+i;if(block.type==='table'&&el.matches('th,td')){const row=el.parentElement,section=row.parentElement.tagName;instance=section==='THEAD'?'h:'+el.cellIndex:section==='TFOOT'?'f:'+el.cellIndex:'r:'+row.sectionRowIndex+':'+el.cellIndex;}
   el.dataset.dsPart=key;el.dataset.dsPartInstance=instance;
   let alignment=(block.type==='table'&&el.matches('th,td')?block.style?.cellAlign?.[instance]:block.style?.partInstances?.[instance])||block.style?.partAlignment?.[key];const iconObj=block.type==='hero'&&key==='icon'?block.data:block.type==='stat-grid'&&key==='icon'?block.data.stats?.[i]:block.type==='timeline'&&key==='dot'?block.data.items?.[i]:block.type==='divider'&&key==='line'?block.data:null;if(iconObj?.iconAlign)alignment=iconObj.iconAlign;if(['left','right','center'].includes(alignment)){el.style.textAlign=alignment;if(kind==='visual'){
    el.style.justifyContent=alignment==='center'?'center':alignment==='right'?'flex-end':'flex-start';
    if(el.classList.contains('hero-icon')){el.style.insetInline='auto';el.style.left=alignment==='right'?'auto':alignment==='center'?'50%':'18px';el.style.right=alignment==='right'?'18px':'auto';if(alignment==='center')el.style.transform='translateX(-50%)';}
    else if(['IMG','SVG','CANVAS'].includes(el.tagName.toUpperCase())){if(el.tagName.toUpperCase()==='IMG'&&el.parentElement?.tagName==='FIGURE')el.parentElement.style.textAlign=alignment;el.style.marginLeft=alignment==='left'?'0':'auto';el.style.marginRight=alignment==='right'?'0':'auto';}
   }}
   if(kind==='text')el.style.setProperty('--part-ink-opacity',String(value));
   else if(value<1)el.style.opacity=`calc(var(--block-graphics-opacity, 1) * ${value})`;
   else el.style.removeProperty('opacity');
  });
 }
}

export function removeIndexedPart(block,keys,index){
 function remap(map,prefix=''){if(!map)return;const result={};for(const [key,val] of Object.entries(map)){if(prefix&&!key.startsWith(prefix)){result[key]=val;continue;}const raw=prefix?key.slice(prefix.length):key,m=/^([^:]+):(\d+)$/.exec(raw);if(!m||!keys.includes(m[1])){result[key]=val;continue;}const n=Number(m[2]);if(n===index)continue;result[prefix+m[1]+':'+(n>index?n-1:n)]=val;}return result;}
 if(block.style?.partInstances)block.style.partInstances=remap(block.style.partInstances);
 if(block.style?.typography)block.style.typography=remap(block.style.typography,'part:');
 if(block.data?.richParts)block.data.richParts=remap(block.data.richParts);
}
