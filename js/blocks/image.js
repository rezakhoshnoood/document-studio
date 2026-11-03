/* blocks/image.js — بلوک تصویر (base64) */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const def = {
  type: 'image',
  icon: '🖼️',
  labelKey: 'block.image',
  createData: () => ({ src: '', alt: 'تصویر سند', caption: '', maxWidth: 100, align: 'center' }),
  render(block, ctx = {}) {
    const d = block.data;
    const wrap = createElement('div.b-image');
    const fig = createElement('figure');
    if (d.src) {
      const img = createElement('img', { src: d.src, alt: d.alt || '', loading: 'lazy' });
      if (d.maxWidth) img.style.maxWidth = Math.min(Number(d.maxWidth), 100) + '%';
      if (d.align === 'left') img.style.marginInlineEnd = 'auto';
      if (d.align === 'right') img.style.marginInlineStart = 'auto';
      fig.appendChild(img);
    } else {
      fig.appendChild(createElement('div', {
        text: ctx.doc?.lang === 'en' ? '🖼️ No image selected — upload one in properties' : '🖼️ تصویر انتخاب نشده — از پنل ویژگی‌ها آپلود کنید',
        style: {
          padding: '2rem 1rem', border: '2px dashed #d5dbe8', borderRadius: '10px', color: '#8b95a8', fontSize: '12px'
        }
      }));
    }
    if (d.caption) fig.appendChild(createElement('figcaption', { text: d.caption, ...(ctx.editable?{'data-edit':'caption'}:{}) }));
    wrap.appendChild(fig);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const file = createElement('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (f.size > 1.6 * 1024 * 1024) {
        alert('حجم تصویر باید کمتر از ۱.۶ مگابایت باشد (به‌دلیل محدودیت localStorage).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { d.src = reader.result; api.rerender(); api.commit(); };
      reader.readAsDataURL(f);
    });
    return [api.group(t('prop.content'), [
      api.button(L('📁 آپلود تصویر از دستگاه','📁 Upload image'), () => file.click()),
      d.src ? createElement('img', { src: d.src, style: { width: '100%', borderRadius: '8px', marginTop: '.4rem' } }) : null,
      api.text(L('متن جایگزین (alt)','Alt text'), d.alt, (v) => { d.alt = v; api.rerender(); }),
      api.text(L('توضیح زیر تصویر','Image caption'), d.caption, (v) => { d.caption = v; api.rerender(); }),
      api.range(L('عرض (%)','Width (%)'), Number(d.maxWidth) || 100, (v) => { d.maxWidth = v; api.rerender(); }, { min: 20, max: 100, unit: '%' }),
      api.seg(L('تراز','Alignment'), d.align, [{ value: 'left', label: L('چپ','Left') }, { value: 'center', label: L('وسط','Center') }, { value: 'right', label: L('راست','Right') }],
        (v) => { d.align = v; api.rerender(); api.commit(); }),
      d.src ? api.button(L('🗑 حذف تصویر','🗑 Remove image'), () => { d.src = ''; api.rerender(); api.commit(); }) : null
    ].filter(Boolean))];
  }
};
export default def;
