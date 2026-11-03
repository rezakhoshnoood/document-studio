import {removeIndexedPart} from './parts.js';
import {applyIconDesign,iconDesignControls} from './icon-design.js';
import { imagePicker } from '../features/icon-upload.js';
/* blocks/timeline.js — بلوک تایم‌لاین */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'timeline',
  icon: '🧭',
  labelKey: 'block.timeline',
  createData: () => ({
    items: [
      { date: 'مهر ۱۴۰۴', title: 'آغاز پروژه', desc: 'تعریف محدوده و اهداف پروژه', icon: '1' },
      { date: 'آبان ۱۴۰۴', title: 'طراحی و پیاده‌سازی', desc: 'توسعه نسخه اول و بازبینی داخلی', icon: '2' },
      { date: 'آذر ۱۴۰۴', title: 'تحویل نهایی', desc: 'انتشار نسخه پایدار و مستندسازی', icon: '3' }
    ]
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const wrap = createElement('div.b-timeline');
    const ol = createElement('ol');
    if (ctx.cascade) ol.classList.add('cascade');
    (d.items || []).forEach((it, i) => {
      const li = createElement('li');
      if (ctx.cascade) li.style.setProperty('--tl-delay', (i * 0.12).toFixed(2) + 's');
      const dot=createElement('span.tl-dot',{'data-icon-index':i},it.iconImage?createElement('img',{src:it.iconImage,alt:'',draggable:'false'}):(it.icon||String(i+1)));li.appendChild(dot);applyIconDesign(dot,it,'timeline');
      const box = createElement('div');
      box.appendChild(createElement('div.tl-date', { text: it.date || '', ...(ctx.editable ? { 'data-edit': `items.${i}.date` } : {}) }));
      box.appendChild(createElement('div.tl-title', { text: it.title || '', ...(ctx.editable ? { 'data-edit': `items.${i}.title` } : {}) }));
      box.appendChild(createElement('p.tl-desc', { text: it.desc || '', ...(ctx.editable ? { 'data-edit': `items.${i}.desc`, 'data-multiline': '1' } : {}) }));
      li.appendChild(box);
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const list = createElement('div.mini-list');
    d.items.forEach((it, i) => {
      list.appendChild(createElement('div.prop-group', { style: { padding: '.4rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '.3rem' } }, [
        createElement('div.mini-item', {}, [
          createElement('input.input', { value: it.date, placeholder: L('تاریخ','Date'), style: { maxWidth: '45%' }, oninput: (e) => { it.date = e.target.value; api.rerender(); }, onchange: () => api.commit() }),
          createElement('input.input', { value: it.icon, placeholder: L('نماد','Icon'), style: { maxWidth: '34px', textAlign: 'center' }, oninput: (e) => { it.icon = e.target.value; api.rerender(); } }),
          createElement('button.icon-btn', { onclick: () => { removeIndexedPart(block,['date','title','desc','dot'],i); d.items.splice(i, 1); api.rerender(); api.commit(); } }, '🗑')
        ]),
        imagePicker(api,it,'iconImage',L('تصویر نشانگر این رویداد','Image for this event marker')),...iconDesignControls(api,it,L,'timeline'),
        createElement('input.input', { value: it.title, placeholder: L('عنوان','Title'), style: { marginBottom: '.25rem' }, oninput: (e) => { it.title = e.target.value; api.rerender(); }, onchange: () => api.commit() }),
        createElement('textarea.textarea', { value: it.desc, placeholder: L('توضیح','Description'), rows: 2, oninput: (e) => { it.desc = e.target.value; api.rerender(); }, onchange: () => api.commit() })
      ]));
    });
    return [api.group(t('prop.content'), [
      list,
      api.button(L('+ افزودن رویداد','+ Add event'), () => { d.items.push({ date: api.doc?.lang==='en'?'Date':'تاریخ', title: api.doc?.lang==='en'?'Event title':'عنوان رویداد', desc: '', icon: String(d.items.length + 1) }); api.rerender(); api.commit(); })
    ])];
  }
};
export default def;
