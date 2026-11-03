import {removeIndexedPart} from './parts.js';
import {applyIconDesign,iconDesignControls} from './icon-design.js';
import { imagePicker } from '../features/icon-upload.js';
/* blocks/stat-grid.js — بلوک کارت‌های آماری */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'stat-grid',
  icon: '🔢',
  labelKey: 'block.stat-grid',
  createData: () => ({
    columns: 3,
    stats: [
      { label: 'کاربران فعال', value: '۱٬۲۴۰', icon: '👥', color: '#4f8cff', countTo: 1240, prefix: '', suffix: '' },
      { label: 'رضایت مشتری', value: '۹۶٪', icon: '⭐', color: '#16c79a', countTo: 96, prefix: '', suffix: '٪' },
      { label: 'پروژه‌های موفق', value: '۳۸', icon: '🚀', color: '#6c5ce7', countTo: 38, prefix: '', suffix: '' }
    ]
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const wrap = createElement('div.b-stat');
    const grid = createElement('div.stat-grid');
    grid.style.gridTemplateColumns = `repeat(${Math.min(Math.max(Number(d.columns) || 3, 1), 4)}, minmax(0,1fr))`;
    (d.stats || []).forEach((s, i) => {
      const card = createElement('div.stat');
      if (s.color) card.style.borderColor = s.color + '55';
      if(s.iconImage||s.icon){const el=createElement('div.stat-icon',{'data-icon-index':i},s.iconImage?createElement('img',{src:s.iconImage,alt:'',draggable:'false'}):s.icon);card.appendChild(el);applyIconDesign(el,s,'stat');}
      const val = createElement('div.stat-value', { text: s.value });
      if (s.countTo !== '' && s.countTo !== undefined && s.countTo !== null && Number(s.countTo) > 0) {
        val.dataset.countTo = String(s.countTo);
        val.dataset.prefix = s.prefix || '';
        val.dataset.suffix = s.suffix || '';
        if (s.color) val.style.color = s.color;
      }
      if (ctx.editable) { val.dataset.edit = `stats.${i}.value`; }
      card.appendChild(val);
      card.appendChild(createElement('div.stat-label', { text: s.label || '', ...(ctx.editable ? { 'data-edit': `stats.${i}.label` } : {}) }));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const list = createElement('div.mini-list');
    d.stats.forEach((s, i) => {
      list.appendChild(createElement('div.prop-group', { style: { padding: '.4rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '.3rem' } }, [
        createElement('div.mini-item', {}, [
          createElement('input.input', { value: s.value, placeholder: L('مقدار','Value'), oninput: (e) => { s.value = e.target.value; api.rerender(); }, onchange: () => api.commit() }),
          createElement('input.input', { value: s.icon, placeholder: '🙂', style: { maxWidth: '34px', textAlign: 'center' }, oninput: (e) => { s.icon = e.target.value; api.rerender(); } }),
          createElement('input', { type: 'color', value: s.color || '#4f8cff', style: { width: '32px', flex: '0 0 auto' }, oninput: (e) => { s.color = e.target.value; api.rerender(); } }),
          createElement('button.icon-btn', { onclick: () => { removeIndexedPart(block,['value','label','icon'],i); d.stats.splice(i, 1); api.rerender(); api.commit(); } }, '🗑')
        ]),
        imagePicker(api,s,'iconImage',L('تصویر آیکون این کارت','Image for this card icon')),...iconDesignControls(api,s,L,'stat'),
        createElement('input.input', { value: s.label, placeholder: L('برچسب','Label'), style: { marginBottom: '.25rem' }, oninput: (e) => { s.label = e.target.value; api.rerender(); }, onchange: () => api.commit() }),
        createElement('div.mini-item', {}, [
          createElement('input.input', { type: 'number', value: s.countTo ?? '', placeholder: L('عدد برای شمارش','Count-up number'), title: L('مقدار عددی برای انیمیشن شمارش','Numeric value for the count-up animation'), oninput: (e) => { s.countTo = e.target.value; }, onchange: () => api.commit() }),
          createElement('input.input', { value: s.suffix || '', placeholder: L('پسوند','Suffix'), style: { maxWidth: '70px' }, oninput: (e) => { s.suffix = e.target.value; } })
        ])
      ]));
    });
    return [api.group(t('prop.content'), [
      api.seg(L('تعداد ستون','Column count'), d.columns, [{ value: 1, label: '۱' }, { value: 2, label: '۲' }, { value: 3, label: '۳' }, { value: 4, label: '۴' }],
        (v) => { d.columns = Number(v); api.rerender(); api.commit(); }),
      list,
      api.button(L('+ افزودن کارت','+ Add card'), () => { d.stats.push({ label: api.doc?.lang==='en'?'Label':'برچسب', value: api.doc?.lang==='en'?'0':'۰', icon: '📌', color: '#4f8cff', countTo: 0 }); api.rerender(); api.commit(); })
    ])];
  }
};
export default def;
