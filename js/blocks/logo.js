import { readLocalImage } from '../features/icon-upload.js';
import { createElement, toast } from '../core/dom.js';
import { getLang } from '../core/i18n.js';
export async function fitLogoToImage(block,src){
 const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});const d=block.data,naturalW=img.naturalWidth||140,naturalH=img.naturalHeight||140;
 d.width=Math.max(20,Math.min(500,naturalW));d.naturalWidth=naturalW;d.naturalHeight=naturalH;block.style.logoFitWidthPx=d.width;
 const page=document.querySelector('.canvas-shell .doc-page'),style=page?getComputedStyle(page):null,available=page?Math.max(200,page.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)):700;
 block.style.blockWidth=Math.max(20,Math.min(100,d.width/available*100));delete block.style.minHeight;delete block.style.blockHeight;
}
const def={type:'logo',icon:'◈',labelKey:'block.logo',createData:()=>({src:'',alt:'لوگوی شرکت',width:140,align:'right'}),
 render(block,ctx={}){const d=block.data,w=createElement('div.b-logo'),fig=createElement('figure',{style:{textAlign:d.align||'right'}});if(d.src){fig.style.lineHeight='0';const img=createElement('img',{src:d.src,alt:d.alt||'',style:{width:Math.max(20,Math.min(500,Number(d.width)||140))+'px',display:'inline-block'}});fig.append(img);}else fig.append(createElement('div.logo-placeholder',{text:ctx.doc?.lang==='en'?'Select a company logo in properties':'لوگوی شرکت را از پنل ویژگی‌ها انتخاب کنید'}));w.append(fig);return w;},
 renderProps(block,api){const d=block.data,en=getLang()==='en',L=(fa,eng)=>en?eng:fa,file=createElement('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg',style:{display:'none'}});
 file.addEventListener('change',async()=>{try{const f=file.files[0];if(!f)return;d.src=await readLocalImage(f);await fitLogoToImage(block,d.src);api.rerender();api.commit();api.refresh()}catch(e){toast(L('تصویر معتبر PNG/JPEG/WebP/GIF/SVG تا ۱٫۲ مگابایت انتخاب کنید.','Choose a valid PNG/JPEG/WebP/GIF/SVG image up to 1.2 MB.'),'err')}});
 return [api.group(L('لوگوی شرکت','Company logo'),[file,api.button(L('انتخاب لوگو','Choose logo'),()=>file.click()),d.src?createElement('img',{src:d.src,alt:d.alt,style:{maxWidth:'100%',maxHeight:'100px',objectFit:'contain'}}):null,api.text(L('متن جایگزین','Alt text'),d.alt,v=>{d.alt=v;api.rerender()}),api.range(L('عرض لوگو (px)','Logo width (px)'),d.width||140,v=>{d.width=v;if(block.style.logoFitWidthPx)block.style.logoFitWidthPx=v;api.rerender()},{min:20,max:500,unit:'px'}),api.seg(L('تراز','Alignment'),d.align,[{value:'right',label:L('راست','Right')},{value:'center',label:L('وسط','Center')},{value:'left',label:L('چپ','Left')}],v=>{d.align=v;api.rerender();api.commit()}),d.src?api.button(L('حذف لوگو','Remove logo'),()=>{d.src='';api.rerender();api.commit();api.refresh()}):null].filter(Boolean))]}};
export default def;
