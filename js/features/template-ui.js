/* Real rendered document thumbnails and the template setup dialog. */
import {createElement,openModal,closeModal,toast} from '../core/dom.js';
import {getLang,t} from '../core/i18n.js';
import {renderPage} from '../blocks/base.js';
import {createDoc,getSettings} from '../core/state.js';
import {templateToDoc} from '../templates/index.js';
import {navigate} from '../core/router.js';

let observer;
function watch(holder,page){
 const resize=()=>{if(!holder.isConnected)return;const scale=holder.clientWidth/1000;page.style.transform=`scale(${scale})`;};
 if('ResizeObserver' in window){observer ||= new ResizeObserver(entries=>entries.forEach(e=>{if(!e.target.isConnected){observer.unobserve(e.target);return;}e.target.firstElementChild.style.transform=`scale(${e.contentRect.width/1000})`;}));observer.observe(holder);}
 requestAnimationFrame(resize);
}
export function releaseThumbnails(root){if(observer)root.querySelectorAll('.doc-thumbnail').forEach(el=>observer.unobserve(el));}
export function documentThumb(doc, extraClass=''){
 const page=renderPage(doc,{editable:false,animate:false,footer:false});page.style.cssText+=';width:1000px;max-width:none;min-height:0;transform-origin:top left;pointer-events:none;position:absolute;top:0;left:0;';
 const holder=createElement('div.doc-thumbnail'+(extraClass?'.'+extraClass:''),{'aria-hidden':'true','data-surface':doc.settings?.webSurface||'dark'},[page]);watch(holder,page);return holder;
}
export function openTemplateDesigner(tpl){
 const en=getLang()==='en',L=(fa,eng)=>en?eng:fa;let doc=templateToDoc(tpl,getSettings().documentLang||'en');
 const preview=createElement('div.template-setup-preview');
 const palettes=[['original',L('اصلی','Original'),null],['ocean',L('اقیانوسی','Ocean'),{a:'#2457a6',b:'#146875'}],['violet',L('بنفش','Violet'),{a:'#6039a2',b:'#aa315b'}],['forest',L('جنگلی','Forest'),{a:'#176b57',b:'#266393'}],['sunset',L('غروب','Sunset'),{a:'#a23733',b:'#8a4a12'}],['slate',L('خاکستری','Slate'),{a:'#3b4b63',b:'#314c77'}]];
 let selected='original',radius='original';let originalThemeHero=doc.settings.webThemeHero,originalPalette=doc.settings.webPalette||null;let originals=doc.blocks.map(b=>b.style?.borderRadius);
 const docLanguage=createElement('select.select',{'aria-label':L('زبان سند','Document language')});[['fa','فارسی (RTL)'],['en','English (LTR)']].forEach(([value,text])=>docLanguage.appendChild(createElement('option',{value,text})));docLanguage.value=doc.lang;docLanguage.addEventListener('change',()=>{doc=templateToDoc(tpl,docLanguage.value);originalThemeHero=doc.settings.webThemeHero;originalPalette=doc.settings.webPalette||null;originals=doc.blocks.map(b=>b.style?.borderRadius);refresh();});
 const colors=createElement('div.template-colors',{role:'group','aria-label':L('پالت رنگ قالب','Template color palette')});
 const corners=createElement('select.select',{'aria-label':L('نرمی گوشه‌های قالب','Template corner softness')});
 [['original',L('گوشه‌های اصلی','Original corners')],['0',L('صاف','Square')],['8',L('کمی نرم','Subtle')],['18',L('نرم','Rounded')],['32',L('خیلی نرم','Very rounded')]].forEach(([value,text])=>corners.appendChild(createElement('option',{value,text})));
 function refresh(){doc.settings.webThemeHero=selected==='original'?originalThemeHero:true;doc.settings.webPalette=selected==='original'?originalPalette:(palettes.find(p=>p[0]===selected)?.[2]||null);doc.blocks.forEach((b,i)=>{b.style ||= {};if(radius==='original'){if(originals[i]===undefined)delete b.style.borderRadius;else b.style.borderRadius=originals[i];}else b.style.borderRadius=Number(radius);});releaseThumbnails(preview);preview.replaceChildren(documentThumb(doc,'setup-thumb'));colors.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.palette===selected)));}
 palettes.forEach(([id,label,palette])=>colors.appendChild(createElement('button.template-color',{type:'button','data-palette':id,title:label,'aria-label':label,'aria-pressed':String(id===selected),style:{background:palette?`linear-gradient(135deg,${palette.a},${palette.b})`:'var(--panel)',color:palette?'white':'var(--text)'},onclick:()=>{selected=id;refresh();}},id==='original'?L('اصلی','Original'):'●')));
 corners.addEventListener('change',()=>{radius=corners.value;refresh();});refresh();
 const body=createElement('div.template-setup',{},[createElement('div',{},[createElement('p.hint',{text:L('پالت و گوشه‌ها را انتخاب کنید؛ می‌توانید بعداً آنها را در ویرایشگر تغییر دهید.','Choose a palette and corner softness; you can change them later in the editor.')}),createElement('label',{text:L('زبان سند','Document language')}),docLanguage,createElement('label',{text:L('پالت رنگی','Color palette')}),colors,createElement('label',{text:L('نرمی گوشه‌ها','Corner softness')}),corners]),preview]);
 openModal({title:doc.name,size:'lg',body,onClose:()=>releaseThumbnails(preview),footer:[createElement('button.btn',{onclick:closeModal},t('btn.cancel')),createElement('button.btn.btn-primary',{'data-create-template':'true',onclick:()=>{const saved=createDoc(doc);if(!saved){toast(L('ساخت سند ناموفق بود.','Could not create document.'),'err');return;}closeModal();navigate('/editor/'+saved.id);}},L('ساخت و ورود به پروژه','Create and open project'))]});
}
