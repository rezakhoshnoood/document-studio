/* A local HTML landing-page workspace. Original source is retained; preview is isolated. */
import {createElement as el,clear,toast,confirmDialog,downloadFile,escapeHTML} from '../core/dom.js';
import {getLang} from '../core/i18n.js';
import {getDoc,queueSave,flushSave,initHistory,commitHistory,undo,redo,showDocumentBranding} from '../core/state.js';
import {createBlock} from '../blocks/base.js';
import {navigate,registerCleanup} from '../core/router.js';
import {parseLanding,serializeLanding,nodeAt,nodePath,previewDocument,standaloneLanding} from '../features/landing-engine.js';
import {suggestComponents,insertHTMLSnapshot,applyResponsive,readResponsive} from '../features/site-components.js';

export function renderLanding(root,{id,block:bid}){
 const en=getLang()==='en',L=(fa,enText)=>en?enText:fa,doc=getDoc(id),current=()=>doc?.blocks?.find(x=>x.id===bid&&x.type==='layout');
 if(!doc||!current()){clear(root);root.append(el('p',{text:L('سند یا بلوک پیدا نشد.','Document or block not found.')}));return;}
 current().data.landing=true;initHistory(doc);
 let selected='',allowScripts=false,allowExternal=false,sourceTimer=null,closed=false,revision=0,scrollY=0,moveMode='flow';
 const token=(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
 const htmlInput=el('textarea.landing-code',{'aria-label':'HTML',dir:'ltr',spellcheck:'false'});htmlInput.value=current().data.html||'';
 const cssInput=el('textarea.landing-code.landing-css',{'aria-label':'CSS',dir:'ltr',spellcheck:'false'});cssInput.value=current().data.css||'';
 const tree=el('div.landing-tree',{role:'tree','aria-label':L('درخت المان‌ها','Element tree')});
 const inspector=el('div.landing-inspector');
 const breadcrumb=el('nav.site-breadcrumb',{'aria-label':L('مسیر انتخاب','Selection path')});
 const suggestedList=el('div.site-suggested');const savedList=el('div.site-saved');
 const frame=el('iframe.landing-preview',{title:L('پیش‌نمایش لندینگ','Landing preview'),sandbox:'allow-scripts'});
 const status=el('span.landing-status',{'aria-live':'polite',text:L('ذخیره در مرورگر','Stored in this browser')});
 const filter=el('input.input',{type:'search',placeholder:L('جست‌وجوی المان','Find element'),'aria-label':L('جست‌وجوی المان','Find element')});
 const scripts=el('input',{type:'checkbox','aria-label':L('اجرای اسکریپت در پیش‌نمایش','Run scripts in preview')});
 const external=el('input',{type:'checkbox','aria-label':L('اجازه منابع خارجی در پیش‌نمایش','Allow external resources in preview')});
 const shell=el('div.landing-app',{dir:en?'ltr':'rtl'});
 const sourceDetails=el('details.landing-source',{},[el('summary',{text:L('کد HTML و CSS','HTML and CSS source')}),el('p.hint',{text:L('کد و پنل با هم هماهنگ‌اند. تغییرات کد پس از مکث اعمال می‌شوند. در ویرایش بصری ممکن است قالب‌بندی کد توسط مرورگر بازنویسی شود.','Code and panel stay in sync. Source is applied after a pause. Visual editing may normalize HTML formatting.')}),el('label',{text:'HTML'}),htmlInput,el('label',{text:'CSS'}),cssInput]);
 const btn=(text,fn,cls='btn btn-sm')=>el('button',{type:'button',class:cls,onclick:fn},text);
 const field=(label,input)=>el('label.landing-field',{},[el('span',{text:label}),input]);
 function schedule(){if(closed)return;status.textContent=L('در حال ذخیره…','Saving…');queueSave(doc,{onSaved:()=>{if(!closed)status.textContent=L('ذخیره شد','Saved');}});}
 function saveChange(){commitHistory(doc);schedule();}
 function refreshPreview(){revision++;frame.srcdoc=previewDocument(current().data.html,current().data.css,{scripts:allowScripts,external:allowExternal,bridge:true,token,revision,selected,mode:moveMode,scrollY,lang:en?'en':'fa'});}
 function highlight(scroll=false){frame.contentWindow?.postMessage({type:'ds-parent-select',token,revision,path:selected,scroll},'*');}
 function syncCode(){htmlInput.value=current().data.html||'';cssInput.value=current().data.css||'';}
 function applySource(){clearTimeout(sourceTimer);sourceTimer=null;const b=current();if(!b)return;const changed=b.data.html!==htmlInput.value||b.data.css!==cssInput.value;if(!changed)return;b.data.html=htmlInput.value;b.data.css=cssInput.value;b.data.landing=true;saveChange();refreshTree();refreshInspector();refreshPreview();}
 function changeDOM(fn){applySource();const parsed=parseLanding(current().data.html),node=nodeAt(parsed,selected);if(!node)return;try{fn(node,parsed);selected=nodePath(node,parsed.body)??'';current().data.html=serializeLanding(parsed);saveChange();syncCode();refreshTree();refreshInspector();refreshPreview();}catch(err){toast(L('اعمال تغییر ناموفق بود: ','Could not apply change: ')+err.message,'err');}}
 function refreshTree(){
  refreshComponents();clear(tree);const parsed=parseLanding(current().data.html),query=filter.value.trim().toLowerCase();let count=0;
  function row(node,path,depth){
   if(count>=1200)return;count++;const label='<'+node.tagName.toLowerCase()+'>'+(node.id?' #'+node.id:'')+(node.classList.length?' .'+Array.from(node.classList).slice(0,2).join('.'):'');
   const children=Array.from(node.children);const text=(node.textContent||'').replace(/\s+/g,' ').trim().slice(0,55);
   const item=el('button.landing-tree-item',{type:'button',role:'treeitem','aria-level':String(depth+1),'aria-selected':String(path===selected),'data-path':path,title:label,style:{paddingInlineStart:(10+depth*14)+'px'},onclick:()=>{applySource();selected=path;refreshTree();refreshInspector();highlight(true);}},[el('b',{text:label}),!children.length&&text?el('small',{text}):null]);
   if(!query||(label+' '+text).toLowerCase().includes(query))tree.append(item);
   children.forEach((child,i)=>row(child,path?path+'.'+i:String(i),depth+1));
  }
  row(parsed.body,'',0);if(count>=1200)tree.append(el('p.hint',{text:L('درخت به ۱۲۰۰ المان اول محدود است؛ بقیه در کد حفظ می‌شوند.','Tree is limited to the first 1,200 elements; the rest stay in the code.')}));
 }
 function refreshInspector(){
  clear(inspector);const parsed=parseLanding(current().data.html),node=nodeAt(parsed,selected);if(!node){selected='';refreshInspector();return;}
  refreshBreadcrumb(parsed,node);
  inspector.append(el('h3',{text:'<'+node.tagName.toLowerCase()+'>'}),el('p.hint',{text:L('تغییرات این المان به کد اصلی بازمی‌گردد.','Changes to this element update the source.')}));
  const leaf=node.children.length===0,tag=node.tagName.toLowerCase();
  if(leaf&&!['script','style','img','input','hr','br'].includes(tag)){
   const text=el('textarea.textarea',{'aria-label':L('متن المان','Element text'),rows:3});text.value=node.textContent||'';
   inspector.append(field(L('متن','Text'),text),btn(L('اعمال متن','Apply text'),()=>changeDOM(n=>{n.textContent=text.value;})));
  }
  const basicItems=[['id',L('شناسه','ID')],['class',L('کلاس','Class')],...(['a','link'].includes(tag)?[['href',L('نشانی پیوند','Link URL')]]:[]),...(['img','video','audio','source'].includes(tag)?[['src',L('نشانی منبع','Source URL')]]:[]),...(tag==='img'?[['alt',L('متن جایگزین تصویر','Image alt text')]]:[]),...(['input','button'].includes(tag)?[['value',L('مقدار','Value')]]:[])];
  const controls=basicItems.map(([name,label])=>{const input=el('input.input',{'aria-label':label,dir:'auto',value:node.getAttribute(name)||''});return {name,label,input};});
  const basic=el('details.landing-prop-details',{open:true},[el('summary',{text:L('مشخصات اصلی','Basic properties')}),...controls.map(x=>field(x.label,x.input)),btn(L('اعمال مشخصات','Apply properties'),()=>changeDOM(n=>{controls.forEach(({name,input})=>{if(input.value)n.setAttribute(name,input.value);else n.removeAttribute(name);});}))]);
  inspector.append(basic);
  if(tag==='img'){
   const file=el('input.input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif','aria-label':L('انتخاب تصویر محلی','Choose local image')});
   file.addEventListener('change',()=>{const f=file.files?.[0];if(!f)return;if(f.size>400000){toast(L('تصویر باید حداکثر ۴۰۰ کیلوبایت باشد.','Image must be at most 400 KB.'),'err');return;}const target=selected,oldRevision=revision;const reader=new FileReader();reader.onload=()=>{if(selected!==target||revision!==oldRevision){toast(L('انتخاب تغییر کرده است؛ دوباره تصویر را انتخاب کنید.','Selection changed; choose the image again.'),'err');return;}if(typeof reader.result==='string'&&/^data:image\/(png|jpeg|gif|webp);base64,/i.test(reader.result))changeDOM(n=>{if(n.tagName==='IMG')n.setAttribute('src',reader.result);});};reader.readAsDataURL(f);});
   inspector.append(el('details.landing-prop-details',{},[el('summary',{text:L('جایگزینی تصویر','Replace image')}),el('p.hint',{text:L('تصویر کوچک در HTML ذخیره می‌شود.','A small image is embedded in the HTML.')}),file]));
  }
  const styleItems=[['color',L('رنگ متن','Text color')],['background-color',L('رنگ زمینه','Background color')],['font-size',L('اندازه فونت','Font size')],['width',L('عرض','Width')],['height',L('ارتفاع','Height')],['padding',L('فاصله داخلی','Padding')],['margin',L('فاصله بیرونی','Margin')],['text-align',L('تراز متن','Text alignment')],['font-weight',L('وزن متن','Font weight')],['border',L('حاشیه','Border')],['border-radius',L('گردی گوشه','Corner radius')],['display',L('نوع چیدمان','Display')],['gap',L('فاصله اجزا','Gap')],['justify-content',L('تراز افقی چیدمان','Justify content')],['align-items',L('تراز عمودی چیدمان','Align items')]];
  const styleControls=styleItems.map(([name,label])=>{const input=el('input.input',{'aria-label':label,dir:'ltr',value:node.style?.getPropertyValue(name)||'',placeholder:name==='color'?'#334455':name==='font-size'?'24px':name==='width'?'100%':''});let picker=null;if(['color','background-color'].includes(name)){picker=el('input.site-color-picker',{type:'color','aria-label':label+' '+L('انتخاب رنگ','color picker'),value:/^#[0-9a-f]{6}$/i.test(input.value)?input.value:'#345ef5'});picker.addEventListener('input',()=>input.value=picker.value);}return{name,label,input,picker};});
  inspector.append(el('details.landing-prop-details',{},[el('summary',{text:L('رنگ، اندازه و فاصله','Color, size & spacing')}),el('p.hint',{text:L('این مقادیر به استایل همان المان اضافه می‌شوند؛ استایل‌های دیگر حفظ می‌شوند.','These values update this element’s inline style; other styles stay intact.')}),...styleControls.map(x=>field(x.label,x.picker?el('div.site-color-field',{},[x.input,x.picker]):x.input)),btn(L('اعمال ظاهر','Apply appearance'),()=>changeDOM(n=>{styleControls.forEach(({name,input})=>{let value=input.value.trim();if(value&&/^-?\d+(?:\.\d+)?$/.test(value)&&['width','height','font-size','padding','margin','gap','border-radius'].includes(name))value+='px';if(value)n.style.setProperty(name,value);else n.style.removeProperty(name);});}))]));
  const bp=el('select.select',{'aria-label':L('تنظیمات اندازه صفحه','Responsive breakpoint')});[['mobile',L('موبایل تا ۴۸۰ پیکسل','Mobile up to 480px')],['tablet',L('تبلت تا ۷۶۸ پیکسل','Tablet up to 768px')]].forEach(([value,text])=>bp.append(el('option',{value,text})));
  const rpNames=[['width',L('عرض','Width')],['font-size',L('اندازه متن','Font size')],['padding',L('فاصله داخلی','Padding')],['display',L('نمایش','Display')]];
  const rpControls=rpNames.map(([k,label])=>({k,label,input:el('input.input',{'aria-label':L('واکنش‌گرا: ','Responsive: ')+label,dir:'ltr',placeholder:k==='display'?'none / block':k==='width'?'100%':'16px'})}));
  const loadResponsive=()=>{const p=readResponsive(parseLanding(current().data.html),nodeAt(parseLanding(current().data.html),selected),bp.value);rpControls.forEach(x=>x.input.value=p[x.k]||'');};
  bp.addEventListener('change',loadResponsive);loadResponsive();
  inspector.append(el('details.landing-prop-details',{},[el('summary',{text:L('اندازه‌های موبایل و تبلت','Mobile & tablet styles')}),el('p.hint',{text:L('این تنظیمات در همان اندازه با اولویت بالا اعمال می‌شوند؛ مقدار خالی تنظیم اختصاصی را حذف می‌کند.','These overrides apply at the chosen width with high priority; blank values remove the override.')}),field(L('اندازه صفحه','Breakpoint'),bp),...rpControls.map(x=>field(x.label,x.input)),btn(L('اعمال واکنش‌گرا','Apply responsive styles'),()=>changeDOM((n,d)=>applyResponsive(d,n,bp.value,Object.fromEntries(rpControls.map(x=>[x.k,x.input.value])))))]));
  const attrs={};Array.from(node.attributes).forEach(a=>attrs[a.name]=a.value);
  const attrInput=el('textarea.textarea.landing-attrs',{'aria-label':L('ویژگی‌های المان','Element attributes'),dir:'ltr',rows:6,spellcheck:'false'});attrInput.value=JSON.stringify(attrs,null,2);
  const advanced=el('details.landing-prop-details',{},[el('summary',{text:L('ویژگی‌های پیشرفته','Advanced attributes')}),field(L('همه ویژگی‌ها (JSON)','All attributes (JSON)'),attrInput)]);
  advanced.append(btn(L('اعمال ویژگی‌ها','Apply attributes'),()=>{
   let data;try{data=JSON.parse(attrInput.value);if(!data||Array.isArray(data)||typeof data!=='object')throw Error();for(const [k,v] of Object.entries(data)){if(!/^[^\s"'<>\/=]+$/.test(k)||typeof v!=='string')throw Error();}}catch(_){toast(L('ویژگی‌ها باید یک شیء JSON با مقدارهای متنی باشند.','Attributes must be a JSON object with string values.'),'err');return;}
   changeDOM(n=>{Array.from(n.attributes).forEach(a=>n.removeAttribute(a.name));Object.entries(data).forEach(([k,v])=>n.setAttribute(k,v));});
  }));inspector.append(advanced);
  const markup=el('textarea.textarea.landing-markup',{'aria-label':L('کد داخلی المان','Element inner HTML'),dir:'ltr',rows:5,spellcheck:'false'});markup.value=node.innerHTML;
  if(!['img','input','hr','br','meta','link','source','area','wbr'].includes(tag))inspector.append(el('details.landing-prop-details',{},[el('summary',{text:L('HTML داخلی المان','Element inner HTML')}),field(L('HTML داخلی','Inner HTML'),markup),btn(L('اعمال HTML داخلی','Apply inner HTML'),()=>changeDOM(n=>{n.innerHTML=markup.value;}))]));
  const addable=!['img','input','hr','br','meta','link','source','area','wbr','script','style','textarea'].includes(tag);
  if(addable){
   const addSelect=el('select.select',{'aria-label':L('نوع المان جدید','New element type')});
   [['section',L('بخش','Section')],['div',L('گروه','Container')],['h1',L('عنوان بزرگ','Heading 1')],['h2',L('عنوان','Heading 2')],['p',L('پاراگراف','Paragraph')],['a',L('پیوند','Link')],['button',L('دکمه','Button')],['img',L('تصویر','Image')],['ul',L('فهرست','List')],['li',L('آیتم فهرست','List item')],['hr',L('جداکننده','Divider')]].forEach(([value,text])=>addSelect.append(el('option',{value,text})));
   inspector.append(el('details.landing-prop-details',{},[el('summary',{text:L('افزودن المان داخلی','Add child element')}),field(L('نوع المان','Element type'),addSelect),btn(L('افزودن به این المان','Add to this element'),()=>{let next='';changeDOM((n,d)=>{const child=d.createElement(addSelect.value),tag=addSelect.value;if(['h1','h2','p','a','button','li'].includes(tag))child.textContent=L('متن جدید','New text');if(tag==='a')child.setAttribute('href','#');if(tag==='img')child.setAttribute('alt',L('تصویر','Image'));if(tag==='button')child.setAttribute('type','button');n.appendChild(child);next=nodePath(child,d.body);});if(next){selected=next;refreshTree();refreshInspector();highlight();}})]));
  }
  const canMove=selected!=='';
  if(canMove){
   const ops=el('div.landing-actions',{},[
    btn(L('↑ بالا','↑ Earlier'),()=>changeDOM(n=>{if(n.previousElementSibling)n.previousElementSibling.before(n);})),
    btn(L('↓ پایین','↓ Later'),()=>changeDOM(n=>{if(n.nextElementSibling)n.nextElementSibling.after(n);})),
    btn(L('تکثیر','Duplicate'),()=>changeDOM((n,d)=>insertHTMLSnapshot(d,n.outerHTML,n,'after'))),
    btn(node.style.display==='none'?L('نمایش','Show'):L('مخفی','Hide'),()=>changeDOM(n=>{if(n.style.display==='none'){const prev=n.getAttribute('data-ds-prev-display');if(prev)n.style.setProperty('display',prev,n.getAttribute('data-ds-prev-display-priority')||'');else n.style.removeProperty('display');n.removeAttribute('data-ds-prev-display');n.removeAttribute('data-ds-prev-display-priority');}else{n.setAttribute('data-ds-prev-display',n.style.getPropertyValue('display'));n.setAttribute('data-ds-prev-display-priority',n.style.getPropertyPriority('display'));n.style.setProperty('display','none','important');}})),
    btn(L('ذخیره در کتابخانه','Save to library'),()=>saveSelectedComponent()),
    btn(L('حذف','Delete'),async()=>{if(await confirmDialog(L('این المان و فرزندانش حذف شوند؟','Delete this element and its children?'),{danger:true})){changeDOM(n=>n.remove());selected='';refreshTree();refreshInspector();}})
   ]);inspector.append(ops);
  }
  const supported=/^(h[1-4]|p|img|hr|a|button)$/.test(tag);
  const convert=btn(L('افزودن کپی به بلوک‌های سند','Add a copy to document blocks'),async()=>{
   applySource();const n=nodeAt(parseLanding(current().data.html),selected);if(!n)return;const t=n.tagName.toLowerCase();let item;
   if(/^h[1-4]$/.test(t))item=createBlock('heading',{data:{text:n.textContent||'',level:Number(t[1]),underline:false,numbered:false}});
   else if(t==='p')item=createBlock('text',{data:{html:'<p>'+escapeHTML(n.textContent||'')+'</p>'}});
   else if(t==='img'){const src=n.getAttribute('src')||'';if(src&&!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src)&&!await confirmDialog(L('تصویر خارجی در سند ممکن است به شبکه وصل شود. ادامه می‌دهید؟','The external image may connect to the network in the document. Continue?'),{danger:true,ok:L('ادامه','Continue')}))return;item=createBlock('image',{data:{src,alt:n.getAttribute('alt')||''}});}
   else if(t==='hr')item=createBlock('divider');
   else if(t==='a'||t==='button')item=createBlock('text',{data:{html:'',miniBlocks:[{type:'button',text:n.textContent||'',href:n.getAttribute('href')||'',src:'',alt:'',width:100}]}});
   if(!item)return;const index=doc.blocks.findIndex(x=>x.id===bid);doc.blocks.splice(index+1,0,item);saveChange();toast(L('یک کپی افزوده شد؛ ظاهر و رفتار سفارشی منتقل نمی‌شود.','A copy was added; custom appearance and behavior are not transferred.'),'ok');
  },'btn btn-primary btn-sm');convert.disabled=!supported;inspector.append(convert,el('p.hint',{text:L('تبدیل برای عنوان H1–H4، پاراگراف، تصویر، جداکننده و پیوند/دکمه است. تبدیل کپی مستقل می‌سازد و CSS یا JavaScript را منتقل نمی‌کند.','Conversion supports H1–H4, paragraph, image, divider and link/button. The copy is independent; CSS and JavaScript are not transferred.')}));
 }
 htmlInput.addEventListener('input',()=>{clearTimeout(sourceTimer);sourceTimer=setTimeout(applySource,700);status.textContent=L('تغییر کد…','Source changed…');});
 cssInput.addEventListener('input',()=>{clearTimeout(sourceTimer);sourceTimer=setTimeout(applySource,700);status.textContent=L('تغییر کد…','Source changed…');});
 filter.addEventListener('input',refreshTree);
 tree.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const items=Array.from(tree.querySelectorAll('button[role=treeitem]'));const i=items.indexOf(document.activeElement);if(i<0)return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?Math.min(items.length-1,i+1):Math.max(0,i-1);items[j]?.focus();});

 scripts.addEventListener('change',async()=>{if(scripts.checked&&!await confirmDialog(L('JavaScript می‌تواند فریم را به نشانی دیگری ببرد و حتی با منابع خارجی خاموش باعث ارتباط شبکه شود. محیط جدا دیوار آتش کامل نیست؛ فقط کد مورد اعتماد را اجرا کنید.','JavaScript can navigate its frame and may cause network requests even with external resources off. The sandbox is not a complete network firewall. Run trusted code only.'),{danger:true,ok:L('فعال‌سازی','Enable')})){scripts.checked=false;return;}allowScripts=scripts.checked;scriptWarning.hidden=!allowScripts;refreshPreview();});
 external.addEventListener('change',async()=>{if(external.checked&&!await confirmDialog(L('منابع خارجی می‌توانند نشانی IP شما را ببینند؛ در صورت اجرای JavaScript امکان ارسال داده به شبکه وجود دارد. ادامه می‌دهید؟','External resources can see your IP; scripts may transmit data. Continue?'),{danger:true,ok:L('فعال‌سازی','Enable')})){external.checked=false;return;}allowExternal=external.checked;refreshPreview();});
 const onPageExit=()=>{clearTimeout(sourceTimer);sourceTimer=null;const b=current();if(b){b.data.html=htmlInput.value;b.data.css=cssInput.value;b.data.landing=true;flushSave(doc);}};
 window.addEventListener('beforeunload',onPageExit);window.addEventListener('pagehide',onPageExit);
 const validPath=p=>typeof p==='string'&&p.length<512&&/^(?:\d+(?:\.\d+)*)?$/.test(p);
 const canContain=n=>n&&!/^(IMG|INPUT|HR|BR|META|LINK|SOURCE|AREA|WBR|SCRIPT|STYLE|TEXTAREA|TITLE|OPTION|SELECT|VIDEO|AUDIO|CANVAS|SVG|MATH|IFRAME|OBJECT|EMBED|TABLE|THEAD|TBODY|TFOOT|TR|COL|COLGROUP)$/.test(n.tagName);
 const paletteKinds={section:['▤',L('بخش','Section')],div:['▢',L('گروه','Container')],h1:['H1',L('عنوان بزرگ','Heading')],h2:['H2',L('زیرعنوان','Subheading')],p:['¶',L('متن','Text')],a:['↗',L('پیوند','Link')],button:['▣',L('دکمه','Button')],img:['▧',L('تصویر','Image')],ul:['☷',L('فهرست','List')],hr:['―',L('جداکننده','Divider')],hero:['✦',L('معرفی','Hero')],cards:['▥',L('کارت‌ها','Cards')],table:['▦',L('جدول','Table')],stats:['◫',L('آمار','Statistics')],chart:['▥',L('نمودار','Chart')],timeline:['⋮',L('خط زمان','Timeline')],code:['</>',L('کد','Code')],signature:['✎',L('امضا','Signature')],flow:['⇢',L('روند','Flow')],form:['☑',L('فرم','Form')]};
 function createPaletteNode(d,kind){
  if(['hero','cards','table','stats','chart','timeline','code','signature','flow','form'].includes(kind)){
   const templates={
    hero:`<section style="padding:64px 24px;background:#edf3ff;color:#17264b;text-align:center"><h1>${L('عنوان اصلی سایت','Your site headline')}</h1><p>${L('متن معرفی را اینجا بنویسید.','Describe your idea here.')}</p><a href="#" style="display:inline-block;background:#345ef5;color:white;padding:12px 22px;border-radius:8px;text-decoration:none">${L('شروع کنید','Get started')}</a></section>`,
    cards:`<section style="display:flex;gap:16px;flex-wrap:wrap;padding:24px"><article style="flex:1 1 200px;padding:20px;border:1px solid #dde2ea;border-radius:12px"><h3>${L('عنوان کارت','Card title')}</h3><p>${L('توضیحات کارت','Card description')}</p></article><article style="flex:1 1 200px;padding:20px;border:1px solid #dde2ea;border-radius:12px"><h3>${L('عنوان کارت','Card title')}</h3><p>${L('توضیحات کارت','Card description')}</p></article></section>`,
    table:`<table style="width:100%;border-collapse:collapse"><thead><tr><th style="border:1px solid #ccd3df;padding:10px">${L('عنوان','Item')}</th><th style="border:1px solid #ccd3df;padding:10px">${L('مقدار','Value')}</th></tr></thead><tbody><tr><td style="border:1px solid #ccd3df;padding:10px">${L('ردیف اول','First row')}</td><td style="border:1px solid #ccd3df;padding:10px">100</td></tr></tbody></table>`,
    stats:`<section style="display:flex;gap:24px;flex-wrap:wrap;padding:24px"><div><strong style="font-size:32px">120+</strong><p>${L('مشتری','Customers')}</p></div><div><strong style="font-size:32px">98%</strong><p>${L('رضایت','Satisfaction')}</p></div></section>`,
    chart:`<section style="padding:24px"><h3>${L('نمودار نمونه','Sample chart')}</h3><div style="display:flex;gap:16px;height:140px;align-items:flex-end"><div style="background:#345ef5;width:45px;height:45%"></div><div style="background:#6699ff;width:45px;height:75%"></div><div style="background:#14a89e;width:45px;height:60%"></div></div><p>${L('نمودار ساده و ثابت','Simple static chart')}</p></section>`,
    timeline:`<section style="padding:24px"><h3>${L('خط زمان','Timeline')}</h3><ol><li><strong>${L('مرحله اول','First milestone')}</strong><p>${L('توضیحات','Description')}</p></li><li><strong>${L('مرحله دوم','Second milestone')}</strong><p>${L('توضیحات','Description')}</p></li></ol></section>`,
    code:`<pre style="padding:20px;background:#172033;color:#edf3ff;border-radius:8px;overflow:auto"><code>${L('نمونه کد','Code example')}</code></pre>`,
    signature:`<section style="padding:24px"><p>${L('نام و امضا','Name and signature')}</p><div style="width:180px;border-bottom:1px solid #444;height:45px"></div></section>`,
    flow:`<section style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:24px"><div style="border:1px solid #ccd3df;border-radius:8px;padding:14px">${L('مرحله اول','Step one')}</div><span>→</span><div style="border:1px solid #ccd3df;border-radius:8px;padding:14px">${L('مرحله دوم','Step two')}</div></section>`,
    form:`<form style="padding:24px;display:grid;gap:12px;max-width:450px"><label>${L('نام','Name')}<input type="text" style="display:block;width:100%;padding:10px;border:1px solid #ccd3df;border-radius:6px"></label><label>${L('ایمیل','Email')}<input type="email" style="display:block;width:100%;padding:10px;border:1px solid #ccd3df;border-radius:6px"></label><button type="submit" style="padding:10px;background:#345ef5;color:white;border:0;border-radius:6px">${L('ارسال','Send')}</button></form>`};
   const t=d.createElement('template');t.innerHTML=templates[kind];return t.content.firstElementChild;
  }
  const n=d.createElement(kind);if(['h1','h2','p','a','button'].includes(kind))n.textContent=L('متن جدید','New text');if(kind==='a')n.setAttribute('href','#');if(kind==='img'){n.setAttribute('alt',L('تصویر جدید','New image'));n.style.cssText='display:block;width:180px;height:100px;object-fit:contain;background:#eef2f8';}if(kind==='button')n.setAttribute('type','button');if(kind==='section'||kind==='div')n.style.cssText='min-height:48px;padding:16px';if(kind==='ul'){const li=d.createElement('li');li.textContent=L('آیتم جدید','New item');n.appendChild(li);}return n;}
 function insertNode(parsed,kind,target,placement){if(!Object.hasOwn(paletteKinds,kind)||!target)return null;let parent=placement==='inside'?target:target.parentElement;if(!canContain(parent))return null;const n=createPaletteNode(parsed,kind);if(placement==='inside')parent.appendChild(n);else if(placement==='before')target.before(n);else if(placement==='after')target.after(n);else return null;return n;}
 function finishCanvas(parsed,node,y){selected=nodePath(node,parsed.body)??'';current().data.html=serializeLanding(parsed);if(Number.isFinite(y))scrollY=Math.max(0,Math.min(10000000,y));saveChange();syncCode();refreshTree();refreshInspector();refreshPreview();}
 function refreshBreadcrumb(parsed,node){clear(breadcrumb);let chain=[],n=node;while(n){chain.unshift(n);if(n===parsed.body)break;n=n.parentElement;}chain.slice(-8).forEach(n=>{const path=nodePath(n,parsed.body);breadcrumb.append(btn(n===parsed.body?'body':n.tagName.toLowerCase()+(n.id?'#'+n.id:''),()=>{selected=path;refreshTree();refreshInspector();highlight(true);},'site-crumb'));});}
 function insertSnapshot(html,targetPath=selected,placement=null){applySource();const parsed=parseLanding(current().data.html),target=nodeAt(parsed,targetPath);if(!target)return;const where=placement||(canContain(target)?'inside':'after');const parent=where==='inside'?target:target.parentElement;if(!canContain(parent)){toast(L('یک بخش مناسب برای درج انتخاب کنید.','Choose a suitable container.'),'err');return;}const n=insertHTMLSnapshot(parsed,html,target,where);if(n)finishCanvas(parsed,n,scrollY);}
 function saveSelectedComponent(){applySource();const node=nodeAt(parseLanding(current().data.html),selected);if(!node||!selected)return;const html=node.outerHTML;if(html.length>100000){toast(L('این جزء برای کتابخانه بیش از حد بزرگ است.','This component is too large for the library.'),'err');return;}const name=(node.querySelector('h1,h2,h3')?.textContent||node.id||node.classList[0]||node.tagName).trim().slice(0,60);const b=current();b.data.siteComponents ||= [];if(b.data.siteComponents.length>=60){toast(L('حداکثر ۶۰ جزء ذخیره می‌شود.','The library supports up to 60 components.'),'err');return;}b.data.siteComponents.push({id:crypto.randomUUID?.()||String(Date.now()),name,html});saveChange();refreshComponents();toast(L('در کتابخانه ذخیره شد.','Saved to the library.'),'ok');}
 function refreshComponents(){
  clear(suggestedList);clear(savedList);const parsed=parseLanding(current().data.html),suggestions=suggestComponents(parsed);
  suggestions.forEach(item=>{const row=el('div.site-component-row');const choose=btn(item.name+' · <'+item.tag+'>',()=>{selected=item.path;refreshTree();refreshInspector();highlight(true);},'site-component-name');const add=btn('+',()=>{const n=nodeAt(parseLanding(current().data.html),item.path);if(n)insertSnapshot(n.outerHTML);},'site-component-add');add.title=L('افزودن کپی به انتخاب فعلی','Add a copy to the current selection');row.append(choose,add);suggestedList.append(row);});
  if(!suggestions.length)suggestedList.append(el('p.hint',{text:L('جزء پیشنهادی پیدا نشد؛ از درخت صفحه المان انتخاب کنید.','No suggested components; choose an element in the page tree.')}));
  const items=current().data.siteComponents||[];
  items.forEach((item,i)=>{const row=el('div.site-component-row');const name=el('input.input.site-component-input',{'aria-label':L('نام جزء','Component name'),value:item.name||''});name.addEventListener('change',()=>{item.name=name.value.trim().slice(0,60)||'Component';saveChange();});const add=btn('+',()=>insertSnapshot(item.html),'site-component-add');add.title=L('افزودن کپی','Insert a copy');const remove=btn('×',async()=>{if(await confirmDialog(L('این جزء از کتابخانه حذف شود؟','Remove this component from the library?'),{danger:true})){current().data.siteComponents.splice(i,1);saveChange();refreshComponents();}},'site-component-add');remove.title=L('حذف از کتابخانه','Remove from library');row.append(name,add,remove);savedList.append(row);});
  if(!items.length)savedList.append(el('p.hint',{text:L('در ویژگی‌ها «ذخیره در کتابخانه» را بزنید.','Select an element and choose Save to library in its properties.')}));
 }
 function addFromPalette(kind){applySource();const parsed=parseLanding(current().data.html),target=nodeAt(parsed,selected);if(!target)return;let placement=canContain(target)?'inside':'after';const n=insertNode(parsed,kind,target,placement);if(!n){toast(L('این محل برای افزودن المان مناسب نیست؛ یک بخش یا گروه انتخاب کنید.','Choose a container or a suitable element before adding.'),'err');return;}finishCanvas(parsed,n,scrollY);}
 const onMessage=async e=>{
  if(e.source!==frame.contentWindow||!e.data||e.data.token!==token||e.data.revision!==revision||allowScripts)return;
  const m=e.data;if(m.type==='ds-canvas-scroll'){if(Number.isFinite(m.scrollY))scrollY=Math.max(0,Math.min(10000000,m.scrollY));return;}
  if(sourceTimer){applySource();return;}
  if(m.type==='ds-canvas-select'){if(!validPath(m.path)||!nodeAt(parseLanding(current().data.html),m.path))return;selected=m.path;refreshTree();refreshInspector();return;}
  if(!['ds-canvas-text','ds-canvas-move','ds-canvas-insert','ds-canvas-delete','ds-canvas-resize','ds-canvas-offset'].includes(m.type))return;
  if(m.type==='ds-canvas-delete'){
   if(!validPath(m.path)||!m.path)return;const oldRevision=revision;
   if(!await confirmDialog(L('این المان و فرزندانش حذف شوند؟','Delete this element and its children?'),{danger:true}))return;
   if(oldRevision!==revision||allowScripts||sourceTimer)return;
  }
  const parsed=parseLanding(current().data.html);let n=null;
  if(m.type==='ds-canvas-insert'){
   if(!validPath(m.target)||!['inside','before','after'].includes(m.placement))return;
   n=insertNode(parsed,m.kind,nodeAt(parsed,m.target),m.placement);
  }else{
   if(!validPath(m.path)||!m.path)return;n=nodeAt(parsed,m.path);if(!n)return;
   if(m.type==='ds-canvas-text'){
    if(typeof m.text!=='string'||m.text.length>100000||n.children.length||!/^(H[1-6]|P|SPAN|A|BUTTON|LI|STRONG|EM|B|I|LABEL|SMALL|DIV|ARTICLE)$/.test(n.tagName))return;
    n.textContent=m.text;
   }else if(m.type==='ds-canvas-delete'){const parent=n.parentElement;n.remove();n=parent;}
   else if(m.type==='ds-canvas-move'){
    if(!validPath(m.target)||!['inside','before','after'].includes(m.placement))return;const target=nodeAt(parsed,m.target);if(!target||target===n||n.contains(target))return;
    const parent=m.placement==='inside'?target:target.parentElement;if(!canContain(parent))return;
    if(m.placement==='inside')parent.appendChild(n);else if(m.placement==='before')target.before(n);else target.after(n);
   }else if(m.type==='ds-canvas-resize'){
    if(!Number.isFinite(m.width)||!Number.isFinite(m.height))return;
    n.style.width=Math.max(8,Math.min(5000,Math.round(m.width)))+'px';n.style.height=Math.max(8,Math.min(5000,Math.round(m.height)))+'px';n.style.boxSizing='border-box';if(/^(SPAN|A|STRONG|EM|B|I|SMALL|LABEL)$/.test(n.tagName)&&!n.style.display)n.style.display='inline-block';
   }else if(m.type==='ds-canvas-offset'){
    if(!Number.isFinite(m.dx)||!Number.isFinite(m.dy)||Math.abs(m.dx)>10000||Math.abs(m.dy)>10000)return;
    const old=n.style.translate.trim(),match=old.match(/^(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?$/);if(old&&old!=='none'&&!match){toast(L('جابجایی آزاد برای translate پیچیده ممکن نیست؛ از پنل استایل استفاده کنید.','Complex existing translate cannot be moved freely; use the style panel.'),'err');return;}
    const x=(match?Number(match[1]):0)+m.dx,y=(match?Number(match[2]||0):0)+m.dy;n.style.translate=Math.round(x)+'px '+Math.round(y)+'px';
   }
  }
  if(!n){toast(L('درج در این محل ممکن نیست.','Cannot insert at this location.'),'err');return;}finishCanvas(parsed,n,m.scrollY);
 };window.addEventListener('message',onMessage);
 const undoBtn=btn(L('واگرد','Undo'),()=>{applySource();if(undo(doc)){selected='';syncCode();schedule();refreshTree();refreshInspector();refreshPreview();}}),redoBtn=btn(L('ازنو','Redo'),()=>{applySource();if(redo(doc)){selected='';syncCode();schedule();refreshTree();refreshInspector();refreshPreview();}});
 const openEditor=btn(L('بازگشت به سند','Back to document'),()=>{applySource();if(flushSave(doc))navigate('/editor/'+encodeURIComponent(id));});
 const download=btn(L('دریافت HTML سایت','Download site HTML'),async()=>{applySource();if(!await confirmDialog(L('این فایل کد اصلی را حفظ می‌کند و ممکن است JavaScript و منابع خارجی داشته باشد. هنگام باز کردن فایل، از مورد اعتماد بودن آن مطمئن شوید.','This file preserves the source and may include JavaScript and external resources. Open trusted code only.'),{danger:true,ok:L('دریافت','Download')}))return;downloadFile((doc.name||'landing').replace(/[\\/:*?"<>|]+/g,'-')+'.html',standaloneLanding(current().data.html,current().data.css,showDocumentBranding(doc),doc.lang),'text/html;charset=utf-8');});
 const toolbar=el('header.landing-toolbar',{},[el('strong',{text:L('سایت‌ساز بصری','Visual site builder')}),el('span.landing-docname',{text:doc.name}),el('span.landing-spacer'),undoBtn,redoBtn,download,openEditor]);
 const palette=el('div.landing-palette',{'aria-label':L('پالت المان‌ها','Element palette')});
 Object.entries(paletteKinds).forEach(([kind,[icon,label]])=>{
  const b=el('button.landing-palette-item',{type:'button','data-kind':kind,title:L('کلیک برای افزودن یا کشیدن روی صفحه','Click to add or drag onto the page'),onclick:e=>{if(e.detail===0)addFromPalette(kind);}},[el('b',{text:icon}),el('span',{text:label})]);
  let gesture=null,ghost=null;
  b.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isTrusted)return;gesture={x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId);});
  b.addEventListener('pointermove',e=>{if(!gesture)return;if(!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7){gesture.moved=true;ghost=el('div.landing-drag-ghost',{text:icon+' '+label});document.body.append(ghost);}if(ghost){ghost.style.left=(e.clientX+10)+'px';ghost.style.top=(e.clientY+10)+'px';}});
  b.addEventListener('pointerup',e=>{if(!gesture)return;const moved=gesture.moved;gesture=null;ghost?.remove();ghost=null;if(!moved){addFromPalette(kind);return;}if(allowScripts){toast(L('در حالت اجرای JavaScript، برای افزودن از کلیک پالت استفاده کنید.','While JavaScript runs, use palette clicks to add elements.'),'err');return;}const r=frame.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;frame.contentWindow?.postMessage({type:'ds-parent-drop',token,revision,kind,x:e.clientX-r.left-frame.clientLeft,y:e.clientY-r.top-frame.clientTop,inside:e.altKey},'*');});
  b.addEventListener('pointercancel',()=>{gesture=null;ghost?.remove();ghost=null;});palette.append(b);
 });
 const palettePanel=el('section.site-side-panel',{},[el('h2',{text:L('بلوک‌های آماده','Ready blocks')}),el('p.hint',{text:L('کلیک یا کشیدن برای افزودن به HTML؛ بلوک‌های ترکیبی نسخه ساده‌شدهٔ HTML هستند.','Click or drag to add actual HTML. Composite blocks are simplified HTML versions.')}),palette]);
 const structurePanel=el('section.site-side-panel',{hidden:true},[el('h2',{text:L('ساختار صفحه','Page structure')}),filter,tree]);
 const libraryPanel=el('section.site-side-panel',{hidden:true},[el('h2',{text:L('اجزای پیشنهادی سایت','Suggested site components')}),el('p.hint',{text:L('انتخاب برای ویرایش؛ + یک کپی در محل انتخاب‌شده می‌گذارد. ظاهر به CSS صفحه وابسته است.','Select to edit; + inserts a copy at the current selection. Appearance depends on page CSS.')}),suggestedList,el('h2',{text:L('کتابخانه من','My library')}),el('p.hint',{text:L('شناسه‌ها در کپی تغییر می‌کنند؛ استایل مبتنی بر ID ممکن است تغییر کند.','IDs are renamed in copies; ID-based styles may change.')}),savedList]);
 const tabs=el('div.site-tabs',{role:'tablist'});[[L('بلوک‌ها','Blocks'),palettePanel],[L('ساختار','Structure'),structurePanel],[L('اجزا','Components'),libraryPanel]].forEach(([label,panel],i)=>{const tab=el('button.site-tab',{type:'button',role:'tab','aria-selected':String(i===0),onclick:()=>{[palettePanel,structurePanel,libraryPanel].forEach(p=>p.hidden=p!==panel);tabs.querySelectorAll('button').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));}},label);tabs.append(tab);});
 const treePanel=el('aside.landing-panel.landing-tree-panel',{},[tabs,palettePanel,structurePanel,libraryPanel]);
 const viewport=el('select.select.landing-viewport',{'aria-label':L('عرض پیش‌نمایش','Preview width')});[['desktop',L('عرض آزاد','Fluid')],['tablet',L('تبلت ۷۶۸','Tablet 768')],['mobile',L('موبایل ۳۹۰','Mobile 390')]].forEach(([value,text])=>viewport.append(el('option',{value,text})));viewport.addEventListener('change',()=>{frame.style.width=viewport.value==='mobile'?'min(100%, 390px)':viewport.value==='tablet'?'min(100%, 768px)':'100%';frame.style.marginInline='auto';});
 const modeSelect=el('select.select.landing-viewport',{'aria-label':L('حالت جابه‌جایی','Move mode')});[['flow',L('چیدمان صفحه','Page flow')],['free',L('جابه‌جایی آزاد','Free move')]].forEach(([value,text])=>modeSelect.append(el('option',{value,text})));modeSelect.addEventListener('change',()=>{moveMode=modeSelect.value;frame.contentWindow?.postMessage({type:'ds-parent-mode',token,revision,mode:moveMode},'*');});
 const canvasHint=el('p.landing-canvas-hint',{text:L('روی المان کلیک کنید؛ برای ویرایش متن دوبار کلیک، برای جابه‌جایی دستگیره آبی و برای تغییر اندازه گوشه را بکشید. Delete برای حذف؛ هنگام رهاکردن با Alt، المان داخل مقصد قرار می‌گیرد. حالت آزاد با translate ممکن است هم‌پوشانی ایجاد کند.','Click an element; double-click plain text to edit. Drag the blue handle to move, the corner to resize, or press Delete. Hold Alt while dropping to insert inside a target. Free move uses CSS translate and may overlap elements.')});
 const scriptWarning=el('p.landing-script-warning',{hidden:true,text:L('با اجرای JavaScript، ویرایش مستقیم صفحه غیرفعال است؛ پالت، کد و پنل ویژگی‌ها همچنان قابل استفاده‌اند.','Direct canvas editing is disabled while JavaScript runs; palette, source and properties remain available.')});
 const report=current().data.importReport;const reportDetails=el('details.site-report',{},[el('summary',{text:L('گزارش وارد کردن و محدودیت‌ها','Import report & limitations')}),el('p',{text:L('منابع شناسایی‌شده: ','Resolved resources: ')+(report?.resolved?.join(', ')||'—')}),el('p',{text:L('منابع محلی پیدا نشده: ','Missing local resources: ')+(report?.missing?.join(', ')||'—')}),el('p',{text:L('نام‌های مبهم: ','Ambiguous names: ')+(report?.ambiguous?.join(', ')||'—')}),el('p',{text:L('موارد نیازمند بررسی: ','Needs review: ')+(report?.warnings?.join(', ')||'—')}),el('p.hint',{text:L('نمایش سایت‌های وابسته به اسکریپت، iframe و منابع خارجی کامل تضمین نمی‌شود. کتابخانه ظاهر را با CSS همین صفحه به اشتراک می‌گذارد.','Script-dependent sites, iframes and external resources may not be reproduced fully. Components share this page’s CSS.')}),...(current().data.originalImport?[btn(L('دریافت HTML اولیه','Download original imported HTML'),()=>downloadFile('original-import.html',current().data.originalImport.html,'text/html;charset=utf-8'))]:[])]);
 const previewPanel=el('main.landing-main',{},[el('div.landing-preview-bar',{},[el('strong',{text:L('صفحه قابل ویرایش','Editable page')}),viewport,modeSelect,el('span.landing-spacer'),status]),breadcrumb,canvasHint,scriptWarning,reportDetails,el('p.landing-security',{text:L('پیش‌نمایش جدا است؛ فرم‌ها، پنجره‌های جدید و دسترسی به برنامه مسدودند. کد و منابع خارجی فقط با انتخاب شما فعال می‌شوند.','Preview is isolated: forms, popups and access to the app are blocked. Scripts and external resources require your consent.')}),el('div.landing-permissions',{},[el('label.switch',{},[scripts,L('اجرای JavaScript','Run JavaScript')]),el('label.switch',{},[external,L('منابع خارجی','External resources')])]),frame,sourceDetails]);
 const propsPanel=el('aside.landing-panel.landing-properties',{},[el('h2',{text:L('ویژگی‌های المان','Element properties')}),inspector]);
 shell.append(toolbar,el('div.landing-columns',{},[treePanel,previewPanel,propsPanel]));clear(root);root.append(shell);document.body.classList.add('landing-workspace');refreshTree();refreshInspector();refreshPreview();
 registerCleanup(()=>{applySource();closed=true;flushSave(doc);window.removeEventListener('message',onMessage);window.removeEventListener('beforeunload',onPageExit);window.removeEventListener('pagehide',onPageExit);document.body.classList.remove('landing-workspace');});
}
