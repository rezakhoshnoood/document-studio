/* Code-authored, scoped HTML/CSS layout. JavaScript is deliberately excluded. */
import { createElement } from '../core/dom.js';
import { getLang } from '../core/i18n.js';
import { navigate } from '../core/router.js';
import { previewDocument } from '../features/landing-engine.js';
export const INITIAL_LAYOUT = { html: '<section class="intro">\n  <p class="eyebrow">خوش آمدید</p>\n  <h1>صفحه من</h1>\n  <p>این چیدمان را با HTML و CSS شخصی‌سازی کنید.</p>\n</section>\n<section class="cards">\n  <article>بخش اول</article><article>بخش دوم</article>\n</section>', css: '.intro{padding:3rem 1rem;text-align:center}\n.intro h1{font-size:clamp(2rem,5vw,4rem);margin:.3em 0}\n.eyebrow{color:#8db7ff}\n.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}\n.cards article{padding:2rem;background:#223454;border-radius:1rem}\n@container (max-width: 600px){.cards{grid-template-columns:1fr}}' };
function sanitizeHTML(source) {
  const parsed = new DOMParser().parseFromString(String(source || ''), 'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form,input,button,textarea,select,svg,math').forEach(n=>n.remove());
  parsed.body.querySelectorAll('*').forEach(el=>{
    for (const a of Array.from(el.attributes)) {
      const n=a.name.toLowerCase(), v=a.value.trim();
      if (n.startsWith('on') || n==='style' || n==='srcdoc' || n==='id' || n==='data-edit' || n==='contenteditable') el.removeAttribute(a.name);
      if ((n==='href' || n==='src') && !/^(https?:|mailto:|#|data:image\/(png|jpeg|gif|webp);base64,)/i.test(v)) el.removeAttribute(a.name);
      if (n==='src' && !/^data:image\/(png|jpeg|gif|webp);base64,/i.test(v)) el.removeAttribute(a.name);
    }
    if (el.tagName==='A') el.setAttribute('rel','noopener noreferrer');
  });
  return parsed.body.innerHTML;
}
export function scopeCss(css, scope) {
  const sheet = new CSSStyleSheet();
  try { sheet.replaceSync(String(css || '')); } catch(e) { return ''; }
  function rules(list) {
    return Array.from(list).map(r=>{
      if (r.type === 1) {
        if (/url\s*\(|expression\s*\(|-moz-binding/i.test(r.style.cssText)) return '';
        const selectors = r.selectorText.split(',').map(x => scope+' '+x.trim()).join(',');
        return selectors+'{'+r.style.cssText.replace(/</g,'\\3c ')+'}';
      }
      if (r.type === 4 || r.type === 12 || (typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule)) {
        return r.cssText.slice(0,r.cssText.indexOf('{'))+'{'+rules(r.cssRules)+'}';
      }
      return ''; // No imports, global font declarations, or keyframes.
    }).join('\n');
  }
  return rules(sheet.cssRules);
}
const def = {
  type:'layout', icon:'</>', labelKey:'block.layout',
  createData:()=>({...INITIAL_LAYOUT}),
  render(block, ctx={}) {
    if(block.data.landing){
      const wrap=createElement('div.landing-document-preview');
      const frame=createElement('iframe',{'title':ctx.doc?.lang==='en'?'Landing page preview':'پیش‌نمایش لندینگ',sandbox:'',loading:'lazy'});
      frame.srcdoc=previewDocument(block.data.html,block.data.css);
      if(ctx.editable)frame.style.pointerEvents='none';
      wrap.append(frame);return wrap;
    }
    const el=createElement('div.custom-layout');
    const id='layout-'+String(block.id).replace(/[^a-zA-Z0-9_-]/g,'');
    el.id=id;
    const style=document.createElement('style'); style.textContent=scopeCss(block.data.css,'#'+id);
    const inner=createElement('div.custom-layout-content'); inner.innerHTML=sanitizeHTML(block.data.html);
    if (ctx.editable) inner.addEventListener('click', e=>{if(e.target.closest('a'))e.preventDefault()});
    el.append(style,inner);return el;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const en=getLang()==='en';
    const field=(name,value)=>createElement('textarea.textarea', { value:value||'', dir:'ltr', 'aria-label':name, spellcheck:'false', rows:9, style:{fontFamily:'monospace',fontSize:'.75rem',whiteSpace:'pre',width:'100%'} });
    const html=field('HTML layout',block.data.html), css=field('CSS layout',block.data.css);
    const apply=()=>{block.data.html=html.value;block.data.css=css.value;api.rerender();api.commit();};
    return [api.group(en?'Custom layout code':L('کد چیدمان دلخواه','Custom layout code'),[
      api.button(en?'Open landing page editor':'باز کردن ویرایشگر لندینگ',()=>{block.data.landing=true;api.commit();navigate('/landing/'+encodeURIComponent(api.doc.id)+'/'+encodeURIComponent(block.id));}),
      createElement('p.hint',{text:en?'Landing editor preserves source HTML and isolates its preview.':'ویرایشگر لندینگ کد اصلی را حفظ می‌کند و پیش‌نمایش را جدا نگه می‌دارد.'}),
      createElement('p.hint',{text:block.data.landing?(en?'The document shows an isolated, static preview. Use the landing editor to manage the source and optional script permissions.':'سند یک پیش‌نمایش ایزوله و غیرفعال نشان می‌دهد. برای مدیریت کد و مجوزهای اختیاری از ویرایشگر لندینگ استفاده کنید.'):(en?'HTML and scoped CSS only; scripts, event handlers and external assets are removed. Use @container for responsive preview; @keyframes is not supported.':'HTML و CSS محدود به همین بلوک هستند؛ اسکریپت و منابع خارجی حذف می‌شوند. برای واکنش‌گرایی از @container استفاده کنید؛ @keyframes پشتیبانی نمی‌شود.')}),
      api.field('HTML',html),api.field('CSS',css),
      api.button(en?'Apply changes':L('اعمال تغییرات','Apply changes'),apply)
    ])];
  }
};
export default def;
