/* Dedicated print workspace built on the same standalone renderer as exports. */
import { createElement, clear } from '../core/dom.js';
import { getDoc, saveDoc, getSettings } from '../core/state.js';
import { getLang } from '../core/i18n.js';
import { bg } from '../effects/manager.js';
import { registerCleanup } from '../core/router.js';
import { buildExportHTML } from '../features/export-html.js';
export function renderPrint(root, { id }) {
  clear(root);
  const doc = getDoc(id), en = getLang() === 'en';
  if (!doc) { root.append(createElement('a.btn', { href:'#/home', text:en ? 'Document not found — Home' : 'سند پیدا نشد — بازگشت' })); return; }
  bg.set('none');
  registerCleanup(()=>bg.set('none'));
  const wrapper = createElement('div', { style:{ position:'fixed', inset:'0', zIndex:'150', background:'#dce2eb', display:'flex', flexDirection:'column' } });
  const head = createElement('div.print-workspace-head', { style:{ padding:'8px 14px', background:['light','neu'].includes(getSettings().skin)?'#f7f9fc':'#273241', display:'flex', alignItems:'center', gap:'12px', color:['light','neu'].includes(getSettings().skin)?'#202b3b':'white' } }, [
    createElement('a.btn.btn-sm', { href:'#/editor/' + encodeURIComponent(id), text:en ? '← Editor' : '← بازگشت به ویرایشگر' }),
    createElement('strong', { text:doc.name, title:doc.name, style:{minWidth:'0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'} })
  ]);
  const frame = createElement('iframe', { title:en ? 'Print workspace' : 'فضای آماده‌سازی چاپ', style:{ flex:'1', width:'100%', border:'0', minHeight:'0', background:'#dce2eb' } });
  wrapper.append(head, frame); root.append(wrapper);
  buildExportHTML(doc, { mode:'readonly', animations:false, bgEffect:'none', uiLang:getLang(), uiSkin: getSettings().skin === 'light' || getSettings().skin === 'neu' ? 'light' : 'flat' }).then(html => {
    if (!frame.isConnected) return;
    frame.addEventListener('load', () => {
      frame.contentWindow.__dsOnPrintSettingsChange = options => {
        const latest = getDoc(id); if (!latest) return;
        latest.settings.printOptions = options; saveDoc(latest);
      };
      if (frame.contentWindow.__dsOpenPrint) frame.contentWindow.__dsOpenPrint();
    }, { once:true });
    frame.srcdoc = html;
  }).catch(err => { console.error(err); frame.replaceWith(createElement('p', { text:en ? 'Could not load print preview.' : 'بارگذاری پیش‌نمایش چاپ ناموفق بود.' })); });
}
