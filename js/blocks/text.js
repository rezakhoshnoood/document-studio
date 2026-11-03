/* blocks/text.js — بلوک متن غنی */
import { createElement } from '../core/dom.js';
import { richHTMLWithoutInk } from './ink.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'text',
  icon: '📝',
  labelKey: 'block.text',
  createData: () => ({
    html: '<p>متن خود را اینجا بنویسید. می‌توانید از <b>پررنگ</b>، <i>مورب</i> و فهرست‌های نقطه‌ای استفاده کنید.</p><ul><li>نکته اول</li><li>نکته دوم</li></ul>'
  }),
  render(block, ctx = {}) {
    const wrap = createElement('div.b-text');
    const body = createElement('div.text-body', { html: block.data.html || '', 'data-type-key':'body' });
    if (ctx.editable) {
      body.setAttribute('data-edit', 'html');
      body.setAttribute('data-rich', '1');
      body.setAttribute('data-multiline', '1');
    }
    wrap.appendChild(body);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const canvasEdit = () => document.querySelector(`.canvas-shell [data-id="${block.id}"] [data-edit="html"]`);
    const cmd = (command, value = null) => {
      const target = canvasEdit();
      if (!target) return;
      target.focus();
      document.execCommand(command, false, value);
      d.html = richHTMLWithoutInk(target);
      api.commit();
    };
    const toolBtn = (label, title, fn) => createElement('button.btn.btn-sm', {
      type: 'button', title,
      onmousedown: (e) => e.preventDefault(),
      onclick: fn
    }, label);

    return [
      api.group(t('prop.content'), [
        api.text(L('HTML متن','Text HTML'), d.html, (v) => { d.html = v; api.rerender(); }, { multiline: true }),
        createElement('div.row', { style: { flexWrap: 'wrap', gap: '.25rem' } }, [
          toolBtn('B', L('پررنگ','Bold'), () => cmd('bold')),
          toolBtn('I', L('مورب','Italic'), () => cmd('italic')),
          toolBtn('U', L('زیرخط','Underline'), () => cmd('underline')),
          toolBtn('•', L('لیست نقطه\u200cای','Bulleted list'), () => cmd('insertUnorderedList')),
          toolBtn('1.', L('لیست شماره\u200cدار','Numbered list'), () => cmd('insertOrderedList')),
          toolBtn('H', L('رنگ تأکید','Highlight color'), () => cmd('foreColor', '#4f8cff')),
          toolBtn('🔗', L('لینک','Link'), () => {
            const url = prompt(L('نشانی لینک:','Link URL:'));
            if (url) cmd('createLink', url);
          })
        ]),
        createElement('p.hint', { text: L('در بوم سند نیز می\u200cتوانید مستقیم روی متن کلیک و تایپ کنید.','You can also click the document text and type directly.') })
      ])
    ];
  }
};
export default def;
