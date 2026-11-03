import {removeIndexedPart} from './parts.js';
import {applyIconDesign,iconDesignControls} from './icon-design.js';
import { imagePicker } from '../features/icon-upload.js';
/* blocks/hero.js — بلوک هیرو/بنر */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const GRADIENTS = [
  { value: 'linear-gradient(135deg,#4f8cff,#6c5ce7)', label: 'آبی-بنفش' },
  { value: 'linear-gradient(135deg,#0ea5e9,#22d3ee)', label: 'اقیانوس' },
  { value: 'linear-gradient(135deg,#f97316,#e11d48)', label: 'غروب' },
  { value: 'linear-gradient(135deg,#0e9f6e,#0ea5e9)', label: 'زمردی' },
  { value: 'linear-gradient(135deg,#7c3aed,#a855f7)', label: 'سلطنتی' },
  { value: 'linear-gradient(135deg,#111827,#374151)', label: 'مشکی' },
  { value: 'linear-gradient(135deg,#f9a8d4,#a5b4fc)', label: 'پاستیلی' }
];

const def = {
  type: 'hero',
  icon: '🎯',
  labelKey: 'block.hero',
  createData: () => ({
    title: 'عنوان سند شما',
    subtitle: 'یک زیرعنوان کوتاه و گویا درباره این سند بنویسید.',
    badge: 'سند رسمی',
    bgGradient: GRADIENTS[0].value,
    icon: '📄',
    meta: ['تاریخ: ۱۴۰۴/۰۸/۰۸', 'شماره: ۰۰۱']
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const ed = ctx.editable;
    const wrap = createElement('div.b-hero');
    if (d.bgGradient) wrap.style.background = d.bgGradient;
    if(d.iconImage||d.icon){const el=createElement('span.hero-icon',{},d.iconImage?createElement('img',{src:d.iconImage,alt:'',draggable:'false'}):d.icon);wrap.appendChild(el);applyIconDesign(el,d,'hero');}
    if (d.badge) wrap.appendChild(createElement('span.hero-badge', { text: d.badge, ...(ed ? { 'data-edit': 'badge' } : {}) }));
    wrap.appendChild(createElement('h1.hero-title', { text: d.title || '', ...(ed ? { 'data-edit': 'title' } : {}) }));
    if (d.subtitle) wrap.appendChild(createElement('p.hero-sub', { text: d.subtitle, ...(ed ? { 'data-edit': 'subtitle' } : {}) }));
    if (Array.isArray(d.meta) && d.meta.length) {
      const meta = createElement('div.hero-meta');
      d.meta.forEach((m, i) => meta.appendChild(createElement('span', { text: m, ...(ed ? { 'data-edit': 'meta.' + i } : {}) })));
      wrap.appendChild(meta);
    }
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const metaList = createElement('div.mini-list');
    d.meta.forEach((m, i) => {
      metaList.appendChild(createElement('div.mini-item', {}, [
        createElement('input.input', {
          value: m, dir: 'auto',
          oninput: (e) => { d.meta[i] = e.target.value; api.rerender(); },
          onchange: () => api.commit()
        }),
        createElement('button.icon-btn', {
          title: '×', onclick: () => { removeIndexedPart(block,['meta'],i); d.meta.splice(i, 1); api.rerender(); api.commit(); }
        }, '✕')
      ]));
    });
    return [
      api.group(t('prop.content'), [
        api.text(L('عنوان','Title'), d.title, (v) => { d.title = v; api.rerender(); }),
        api.text(L('زیرعنوان','Subtitle'), d.subtitle, (v) => { d.subtitle = v; api.rerender(); }),
        api.text(L('برچسب','Label'), d.badge, (v) => { d.badge = v; api.rerender(); }),
        imagePicker(api,d,'iconImage',L('بارگذاری تصویر آیکون','Upload icon image')),...iconDesignControls(api,d,L,'hero'),
        api.text(L('آیکون (اموجی)','Icon (emoji)'), d.icon, (v) => { d.icon = v; api.rerender(); }),
        api.select(L('گرادیان','Gradient'), d.bgGradient, GRADIENTS.map((g,i)=>({...g,label:getLang()==='en'?['Blue–violet','Ocean','Sunset','Emerald','Royal','Black','Pastel'][i]:g.label})), (v) => { d.bgGradient = v; api.rerender(); }),
        createElement('h4', { text: L('متادیتا','Metadata'), style: { fontSize: '.68rem', color: 'var(--muted)', margin: '.4rem 0 .3rem' } }),
        metaList,
        api.button(L('+ افزودن متادیتا','+ Add metadata'), () => { d.meta.push(api.doc?.lang==='en'?'New value':'مقدار جدید'); api.rerender(); api.commit(); })
      ])
    ];
  }
};
export default def;
