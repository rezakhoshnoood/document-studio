/* Lightweight children belong to their parent block and are not top-level blocks. */
import {createElement,toast} from '../core/dom.js';
import {getLang} from '../core/i18n.js';
import {sanitizeInlineHTML} from './typography.js';
import {readLocalImage} from '../features/icon-upload.js';

export function renderMiniBlocks(block,ctx={}){
 const items=Array.isArray(block.data?.miniBlocks)?block.data.miniBlocks:[];if(!items.length)return null;
 const host=createElement('div.mini-blocks');
 items.forEach((child,i)=>{
  const type=child.type, text=child.text||'',attrs={'data-type-key':`mini:${i}`,...(ctx.editable?{'data-edit':`miniBlocks.${i}.textHTML`,'data-rich':'1','data-multiline':'1'}:{})};
  let el;
  if(type==='subtitle')el=createElement('p.mini-subtitle',{text,...attrs});
  else if(type==='text')el=createElement('p.mini-text',{text,...attrs});
  else if(type==='button'){
   const href=/^(https?:\/\/|mailto:)/i.test(child.href||'')?child.href:'';
   el=createElement('a.mini-link',{...(href?{href,target:'_blank',rel:'noopener noreferrer'}:{role:'button'}),text,...attrs});
   if(ctx.editable)el.addEventListener('click',e=>e.preventDefault());
  }else if(type==='image'){
   const fig=createElement('figure.mini-image');if(child.src)fig.appendChild(createElement('img',{src:child.src,alt:child.alt||'',style:{maxWidth:Math.max(10,Math.min(100,Number(child.width)||100))+'%'}}));
   else if(ctx.editable)fig.appendChild(createElement('span',{text:getLang()==='en'?'Select an image in properties':'تصویر را از پنل ویژگی‌ها انتخاب کنید'}));el=fig;
  }else if(type==='divider')el=createElement('hr.mini-divider');
  if(el){if(['text','subtitle','button'].includes(type)&&child.textHTML!==undefined)el.innerHTML=sanitizeInlineHTML(child.textHTML);el.dataset.miniIndex=String(i);host.appendChild(el);}
 });return host;
}
export function miniBlockControls(block,api){
 const en=getLang()==='en',L=(fa,eng)=>en?eng:fa,items=block.data.miniBlocks||[];
 const labels={subtitle:L('زیرعنوان','Subtitle'),text:L('متن','Text'),button:L('دکمه / پیوند','Button / link'),image:L('تصویر','Image'),divider:L('جداکننده','Divider')};
 const select=createElement('select.select',{'aria-label':L('نوع جزء داخلی','Inner item type')});Object.entries(labels).forEach(([value,text])=>select.appendChild(createElement('option',{value,text})));
 const refresh=()=>{api.rerender();api.commit();api.refresh();};
 const add=createElement('button.btn.btn-sm',{'data-add-mini':'true',type:'button',onclick:()=>{block.data.miniBlocks ||= [];const type=select.value;block.data.miniBlocks.push({type,text:type==='subtitle'?(api.doc?.lang==='en'?'New subtitle':'زیرعنوان جدید'):type==='text'?(api.doc?.lang==='en'?'New text':'متن جدید'):type==='button'?(api.doc?.lang==='en'?'Learn more':'مشاهده بیشتر'):'',href:'',src:'',alt:'',width:100});refresh();}},L('+ افزودن جزء داخلی','+ Add inner item'));
 const addText=(block.type==='heading'||block.type==='text')?createElement('button.btn.btn-sm',{'data-add-text-box':'true',type:'button',onclick:()=>{block.data.miniBlocks ||= [];block.data.miniBlocks.push({type:'text',text:(api.doc?.lang==='en'?'New text':'متن جدید')});refresh();}},L('+ افزودن باکس متن','+ Add text box')):null;
 const cards=items.map((item,i)=>{
  const head=createElement('div.mini-item',{},[createElement('strong',{text:labels[item.type]||item.type}),createElement('span.spacer'),createElement('button.icon-btn',{type:'button',disabled:i===0,'aria-label':L('انتقال جزء به بالا','Move item up'),onclick:()=>{[items[i-1],items[i]]=[items[i],items[i-1]];refresh();}},'↑'),createElement('button.icon-btn',{type:'button',disabled:i===items.length-1,'aria-label':L('انتقال جزء به پایین','Move item down'),onclick:()=>{[items[i+1],items[i]]=[items[i],items[i+1]];refresh();}},'↓'),createElement('button.icon-btn',{type:'button','aria-label':L('حذف جزء','Remove item'),onclick:()=>{items.splice(i,1);refresh();}},'✕')]);
  const fields=[];
  if(['text','subtitle','button'].includes(item.type))fields.push(api.text(L('متن','Text'),item.text||'',v=>{item.text=v;delete item.textHTML;api.rerender();}));
  if(item.type==='button')fields.push(api.text(L('آدرس پیوند (https یا mailto)','Link URL (https or mailto)'),item.href||'',v=>{item.href=v;api.rerender();},{dir:'ltr'}));
  if(item.type==='image'){
    const file=createElement('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg','aria-label':L('فایل تصویر داخلی','Inner image file')});file.addEventListener('change',async()=>{try{if(!file.files?.[0])return;item.src=await readLocalImage(file.files[0]);refresh();}catch(e){toast(L('تصویر معتبر تا ۱٫۲ مگابایت انتخاب کنید.','Choose a valid image up to 1.2 MB.'),'err');}});
    fields.push(file,api.text(L('متن جایگزین','Alt text'),item.alt||'',v=>{item.alt=v;api.rerender();}),api.range(L('عرض تصویر داخلی','Inner image width'),item.width||100,v=>{item.width=v;api.rerender();},{min:10,max:100,unit:'%'}));
  }
  return createElement('div.mini-block-card',{},[head,...fields]);
 });
 return createElement('details.inner-block-editor',{},[createElement('summary',{text:L('اجزای داخلی المان','Inner items')}),createElement('p.hint',{text:L('اجزا درون همین المان نمایش داده می‌شوند و مستقل از بلوک‌های اصلی‌اند.','These items stay inside this block, separate from top-level blocks.')}),addText,select,add,...cards]);
}
