/* blocks/heading.js — بلوک عنوان */
import { createElement } from '../core/dom.js';
import {sanitizeInlineHTML} from './typography.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'heading',
  icon: '🅷',
  labelKey: 'block.heading',
  createData: () => ({ text: 'عنوان بخش', level: 2, underline: true, numbered: false }),
  render(block, ctx = {}) {
    const d = block.data;
    const level = [1, 2, 3, 4].includes(Number(d.level)) ? Number(d.level) : 2;
    const wrap = createElement('div.b-heading');
    const h = createElement('h' + level);
    let prefix = '';
    if (d.numbered && ctx.doc) {
      const idx = (ctx.doc.blocks || []).findIndex((b) => b.id === block.id);
      const n = (ctx.doc.blocks || []).slice(0, Math.max(idx, 0) + 1)
        .filter((b) => b.type === 'heading' && Number(b.data.level) === level).length;
      prefix = `<span class="num">${ctx.doc.lang === 'en' ? n : toFaDigits(n)}.</span>`;
    }
    if(prefix)h.innerHTML=prefix;
    const span=createElement('span',{'data-type-key':'heading',...(ctx.editable?{'data-edit':'textHTML','data-rich':'1','data-multiline':'1'}:{})});
    if(d.textHTML!==undefined)span.innerHTML=sanitizeInlineHTML(d.textHTML);else span.textContent=d.text||'';
    h.appendChild(span);
    wrap.appendChild(h);
    if (d.underline) wrap.appendChild(createElement('div.underline'));
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    return [
      api.group(t('prop.content'), [
        api.text(L('متن عنوان','Heading text'), d.text, (v) => { d.text = v;delete d.textHTML; api.rerender(); }),
        api.seg(L('سطح عنوان','Heading level'), d.level, [
          { value: 1, label: 'H1' }, { value: 2, label: 'H2' }, { value: 3, label: 'H3' }, { value: 4, label: 'H4' }
        ], (v) => { d.level = Number(v); api.rerender(); api.commit(); }),
        api.switch(L('خط زیرین تزئینی','Decorative underline'), d.underline, (v) => { d.underline = v; api.rerender(); api.commit(); }),
        api.switch(L('شماره\u200cگذاری خودکار','Automatic numbering'), d.numbered, (v) => { d.numbered = v; api.rerender(); api.commit(); })
      ])
    ];
  }
};
function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function toFaDigits(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}
export default def;
