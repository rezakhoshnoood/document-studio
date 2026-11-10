/* Import small local HTML/CSS/assets without a backend. Imported source is never executed here. */
import {parseLanding,serializeLanding} from './landing-engine.js';
const MAX_TOTAL=1600000, MAX_FILE=1200000;
const ext=p=>(p.split('.').pop()||'').toLowerCase();
function dataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('Could not read '+file.name));r.readAsDataURL(file);});}
function norm(p){const stack=[];for(const part of p.replace(/\\/g,'/').split('/')){if(!part||part==='.')continue;if(part==='..'){stack.pop();continue;}stack.push(part);}return stack.join('/');}
function relative(ref,base){const noquery=ref.split(/[?#]/)[0];try{return norm((base?base.split('/').slice(0,-1).join('/')+'/':'')+decodeURIComponent(noquery));}catch(_){return norm((base?base.split('/').slice(0,-1).join('/')+'/':'')+noquery);}}
const remote=u=>/^(?:[a-z][\w+.-]*:|\/\/|#|\/)/i.test(u.trim());
function mapRef(ref,base,entries,report){if(!ref||remote(ref))return null;const path=relative(ref.trim(),base);let matches=entries.filter(x=>x.path===path);if(!matches.length){const name=path.split('/').pop();matches=entries.filter(x=>x.path.split('/').pop()===name);}if(matches.length===1)return matches[0];if(matches.length>1)report.ambiguous.add(ref);else report.missing.add(ref);return null;}
function cssUrls(css,base,entries,report){return css.replace(/url\(\s*(?:(['"])(.*?)\1|([^)]*?))\s*\)/gi,(all,q,quoted,bare)=>{const ref=(quoted??bare??'').trim(),found=mapRef(ref,base,entries,report);if(!found||!found.data)return all;report.resolved.add(ref);return 'url("'+found.data+'")';});}
export async function importSite({html,css='',files=[],htmlPath=''}){
 files=Array.from(files);const total=files.reduce((n,f)=>n+f.size,0);
 if(files.length>200||total>MAX_TOTAL||files.some(f=>f.size>MAX_FILE))throw Error('FILE_LIMIT');
 const report={resolved:new Set(),missing:new Set(),ambiguous:new Set(),warnings:[]};
 const entries=[];
 for(const f of files){const path=norm(f.webkitRelativePath||f.name),type=ext(path);const entry={path,type};if(type==='css')entry.text=await f.text();else if(['png','jpg','jpeg','gif','webp','avif','svg','woff','woff2','ttf','otf','mp3','mp4','webm','ogg','js','mjs'].includes(type)){entry.data=await dataUrl(f);if(['js','mjs'].includes(type))entry.data='data:text/javascript;base64,'+entry.data.split(',')[1];}entries.push(entry);}
 const d=parseLanding(html),htmlBase=norm(htmlPath);
 for(const link of Array.from(d.querySelectorAll('link[rel~="stylesheet"][href]'))){const ref=link.getAttribute('href'),match=mapRef(ref,htmlBase,entries,report);if(!match||match.type!=='css')continue;const style=d.createElement('style');if(link.hasAttribute('media'))style.setAttribute('media',link.getAttribute('media'));style.setAttribute('data-ds-imported-css',match.path);style.textContent=cssUrls(match.text,match.path,entries,report).replace(/</g,'\\3c ');link.replaceWith(style);report.resolved.add(ref);if(/@import\b/i.test(match.text))report.warnings.push('CSS @import');}
 for(const style of d.querySelectorAll('style:not([data-ds-imported-css])')){style.textContent=cssUrls(style.textContent||'',htmlBase,entries,report).replace(/</g,'\\3c ');if(/@import\b/i.test(style.textContent))report.warnings.push('CSS @import');}
 for(const node of d.querySelectorAll('[src],[poster],[background],[srcset],[style]')){
  for(const attr of ['src','poster','background']){if(!node.hasAttribute(attr))continue;const ref=node.getAttribute(attr),m=mapRef(ref,htmlBase,entries,report);if(m?.data){node.setAttribute(attr,m.data);report.resolved.add(ref);if(node.tagName==='SCRIPT')report.warnings.push('Embedded JavaScript may depend on relative imports: '+ref);}}
  if(node.hasAttribute('srcset')){report.warnings.push('srcset: '+node.getAttribute('srcset'));}
  if(node.hasAttribute('style'))node.setAttribute('style',cssUrls(node.getAttribute('style'),htmlBase,entries,report));
 }
 if(d.querySelector('script'))report.warnings.push('JavaScript');if(d.querySelector('iframe,object,embed'))report.warnings.push('iframe / embed');
 if(d.querySelector('link[href^="http"],link[href^="//"]'))report.warnings.push('External stylesheet');
 const outCss=cssUrls(css,htmlBase,entries,report);
 return {html:serializeLanding(d),css:outCss,report:{resolved:[...report.resolved],missing:[...report.missing],ambiguous:[...report.ambiguous],warnings:[...new Set(report.warnings)]},files:entries.map(x=>x.path)};
}
