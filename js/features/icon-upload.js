/* Local icon images: SVG is reduced to a safe subset then rasterized to PNG. */
import {createElement,toast} from '../core/dom.js';
import {getLang} from '../core/i18n.js';
const limit=1.2*1024*1024;
function safeSVG(text){
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid SVG');
 const allowed=new Set('svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath mask pattern title desc use'.split(' '));
 for(const el of [...doc.querySelectorAll('*')]){
  if(!allowed.has(el.localName)){el.remove();continue;}
  for(const attr of [...el.attributes]){const n=attr.name.toLowerCase(),v=attr.value.trim();if(n.startsWith('on')||n==='style'||n==='src'||n==='xml:base'||((n==='href'||n==='xlink:href')&&!/^#[\w.-]+$/.test(v))||/url\s*\(/i.test(v)&&!/^url\(\s*#[\w.-]+\s*\)$/.test(v)||/javascript:|data:|https?:|\/\//i.test(v))el.removeAttribute(attr.name);}
 }
 return new XMLSerializer().serializeToString(doc.documentElement);
}
export async function readLocalImage(file){
 if(!file||file.size>limit)throw Error('size');const svg=file.type==='image/svg+xml'||/\.svg$/i.test(file.name);
 if(!svg&&!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error('type');
 if(!svg)return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 const safe=safeSVG(await file.text()),url=URL.createObjectURL(new Blob([safe],{type:'image/svg+xml'}));
 try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{try{let w=img.naturalWidth||256,h=img.naturalHeight||256,scale=Math.min(1,1024/Math.max(w,h));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/png');if(result.length>1.7*1024*1024)throw Error('size');resolve(result);}catch(e){reject(e)}};img.onerror=()=>reject(Error('svg'));img.src=url;});}finally{URL.revokeObjectURL(url)}
}
export function imagePicker(api,obj,key,label,onLoaded){
 const L=(fa,en)=>getLang()==='en'?en:fa;const file=createElement('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg','aria-label':label,style:{display:'none'},'data-image-picker':key});
 file.addEventListener('change',async()=>{try{const f=file.files?.[0];if(!f)return;obj[key]=await readLocalImage(f);if(onLoaded)await onLoaded(obj[key]);api.rerender();api.commit();api.refresh();}catch(e){toast(L('تصویر معتبر PNG/JPEG/WebP/GIF/SVG تا ۱٫۲ مگابایت انتخاب کنید.','Choose a valid PNG/JPEG/WebP/GIF/SVG image up to 1.2 MB.'),'err');}finally{file.value='';}});
 return createElement('div.icon-picker',{},[file,api.button(label,()=>file.click()),obj[key]?createElement('button.btn.btn-sm',{type:'button',onclick:()=>{delete obj[key];api.rerender();api.commit();api.refresh()}},L('حذف تصویر','Remove image')):null]);
}
