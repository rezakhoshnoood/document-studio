import {applyIconDesign,iconDesignControls} from './icon-design.js';
import { imagePicker } from '../features/icon-upload.js';
/* blocks/divider.js — بلوک جداکننده */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const STYLES = [
  { value: 'solid', label: 'خط ساده' },
  { value: 'dashed', label: 'خط‌چین' },
  { value: 'dotted', label: 'نقطه‌چین' },
  { value: 'gradient', label: 'گرادیان' },
  { value: 'ornament', label: 'تزئینی ✦' }
];

const def = {
  type: 'divider',
  icon: '➖',
  labelKey: 'block.divider',
  createData: () => ({ style: 'gradient', color: '', thickness: 2, ornament: '✦ ❖ ✦' }),
  render(block) {
    const d = block.data;
    const wrap = createElement('div.b-divider');
    const thickness = Number(d.thickness) || 2;
    if (d.style === 'gradient') {
      wrap.appendChild(createElement('div', {
        style: {
          height: thickness + 'px', width: '100%', borderRadius: '9px',
          background: d.color || 'linear-gradient(90deg,transparent,#4f8cff,#6c5ce7,transparent)'
        }
      }));
    } else if (d.style === 'ornament') {
      const el=createElement('span', {style:{color:d.color||'#4f8cff'}},d.ornamentImage?createElement('img',{src:d.ornamentImage,alt:'',draggable:'false'}):(d.ornament||'✦ ❖ ✦'));wrap.appendChild(el);applyIconDesign(el,d,'divider');
    } else {
      wrap.appendChild(createElement('div', {
        style: { height: '0', width: '100%', borderTop: thickness + 'px ' + d.style + ' ' + (d.color || '#d5dbe8') }
      }));
    }
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    return [api.group(t('prop.content'), [
      api.select(L('سبک','Style'), d.style, STYLES, (v) => { d.style = v; api.rerender(); api.commit(); api.refresh(); }),
      api.number(L('ضخامت','Thickness'), d.thickness, (v) => { d.thickness = v; api.rerender(); }, { min: 1, max: 12, suffix: 'px' }),
      api.color(L('رنگ (خالی = پیش\u200cفرض)','Color (empty = default)'), d.color, (v) => { d.color = v; api.rerender(); }),
      d.style === 'ornament' ? imagePicker(api,d,'ornamentImage',L('تصویر نماد تزئینی','Decorative symbol image')) : null,
      ...(d.style==='ornament'?iconDesignControls(api,d,L,'divider'):[]),
      d.style === 'ornament' ? api.text(L('نماد تزئینی','Decorative symbol'), d.ornament, (v) => { d.ornament = v; api.rerender(); }) : null
    ].filter(Boolean))];
  }
};
export default def;
