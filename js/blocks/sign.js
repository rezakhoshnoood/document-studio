import {removeIndexedPart} from './parts.js';
/* blocks/sign.js — بلوک امضا */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'sign',
  icon: '✍️',
  labelKey: 'block.sign',
  createData: () => ({
    signatures: [
      { title: 'تهیه‌کننده', name: 'نام و نام خانوادگی' },
      { title: 'تأییدکننده', name: 'نام و نام خانوادگی' }
    ]
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const list = Array.isArray(d.signatures) ? d.signatures : [];
    const wrap = createElement('div.b-sign');
    const row = createElement('div.sign-row');
    row.style.gridTemplateColumns = `repeat(${Math.min(Math.max(list.length, 1), 4)}, minmax(0,1fr))`;
    list.forEach((s, i) => {
      const cell = createElement('div.sign-cell');
      if (s.image) cell.appendChild(createElement('img', { src: s.image, alt: s.name || 'signature' }));
      cell.appendChild(createElement('div.sign-title', { text: s.title || '', ...(ctx.editable ? { 'data-edit': `signatures.${i}.title` } : {}) }));
      cell.appendChild(createElement('div.sign-name', { text: s.name || '', ...(ctx.editable ? { 'data-edit': `signatures.${i}.name` } : {}) }));
      row.appendChild(cell);
    });
    wrap.appendChild(row);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const list = createElement('div.mini-list');
    d.signatures.forEach((s, i) => {
      list.appendChild(createElement('div.mini-item', { style: { flexWrap: 'wrap' } }, [
        createElement('input.input', {
          value: s.title, placeholder: L('عنوان','Title'), style: { maxWidth: '44%' },
          oninput: (e) => { s.title = e.target.value; api.rerender(); },
          onchange: () => api.commit()
        }),
        createElement('input.input', {
          value: s.name, placeholder: L('نام','Name'), dir: 'auto',
          oninput: (e) => { s.name = e.target.value; api.rerender(); },
          onchange: () => api.commit()
        }),
        createElement('button.icon-btn', { title: '×', onclick: () => { removeIndexedPart(block,['name','title','image','line'],i); d.signatures.splice(i, 1); api.rerender(); api.commit(); } }, '✕')
      ]));
      const file = createElement('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
      file.addEventListener('change', () => {
        const f = file.files && file.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => { s.image = reader.result; api.rerender(); api.commit(); };
        reader.readAsDataURL(f);
      });
      list.appendChild(createElement('div.mini-item', {}, [
        api.button(L('🖼 تصویر امضا','🖼 Signature image'), () => file.click()),
        s.image ? createElement('button.btn.btn-sm', { onclick: () => { s.image = ''; api.rerender(); api.commit(); } }, L('حذف تصویر','Remove image')) : null
      ].filter(Boolean)));
    });
    return [
      api.group(t('prop.content'), [
        list,
        api.button(L('+ افزودن امضا','+ Add signature'), () => {
          if (d.signatures.length >= 4) return;
          d.signatures.push({ title: api.doc?.lang==='en'?'Signature':'امضا', name: api.doc?.lang==='en'?'Name':'نام' });
          api.rerender(); api.commit();
        }),
        createElement('p.hint', { text: L('حداکثر ۴ امضا در یک ردیف.','Up to four signatures per row.') })
      ])
    ];
  }
};
export default def;
