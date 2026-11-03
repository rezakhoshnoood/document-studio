/* features/theme-builder.js — سازنده تم سفارشی با پیش‌نمایش زنده */
import { createElement, clear, uid, toast } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';
import { THEMES, listCustomThemes, saveCustomTheme, deleteCustomTheme, getTheme } from '../core/state.js';

const FONTS = [
  { value: "'Vazirmatn', system-ui, sans-serif", label: 'وزیرمتن (فارسی)' },
  { value: "'Inter', system-ui, sans-serif", label: 'Inter (لاتین)' },
  { value: "'Vazirmatn', 'Times New Roman', serif", label: 'Serif / آکادمیک' },
  { value: "'JetBrains Mono', ui-monospace, monospace", label: 'Monospace / فنی' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' }
];

const BASE_VARS = {
  '--d-accent': '#4f8cff',
  '--d-accent-light': '#e8f0ff',
  '--d-title': '#1a237e',
  '--d-text': '#333333',
  '--d-header-bg': 'linear-gradient(135deg,#4f8cff,#6c5ce7)',
  '--d-header-text': '#ffffff',
  '--d-th-bg': '#4f8cff',
  '--d-zebra': '#f5f8ff',
  '--d-border': '#e0e0e0',
  '--d-font': FONTS[0].value,
  '--d-radius': '12px',
  '--d-bg': '#ffffff'
};

const COLOR_FIELDS = [
  ['--d-accent', 'رنگ اصلی'],
  ['--d-accent-light', 'رنگ ملایم'],
  ['--d-title', 'رنگ عنوان'],
  ['--d-text', 'رنگ متن'],
  ['--d-th-bg', 'سرستون جدول'],
  ['--d-zebra', 'نوار زبرا'],
  ['--d-border', 'خطوط و کادر'],
  ['--d-bg', 'پس‌زمینه صفحه']
];

const GRADIENTS = [
  { value: 'linear-gradient(135deg,#4f8cff,#6c5ce7)', label: 'آبی-بنفش' },
  { value: 'linear-gradient(135deg,#0e9f6e,#0ea5e9)', label: 'زمردی' },
  { value: 'linear-gradient(135deg,#f97316,#e11d48)', label: 'غروب' },
  { value: 'linear-gradient(135deg,#7c3aed,#a855f7)', label: 'سلطنتی' },
  { value: 'linear-gradient(135deg,#111827,#374151)', label: 'مشکی' },
  { value: 'linear-gradient(135deg,#f9a8d4,#a5b4fc)', label: 'پاستیلی' },
  { value: '#1e3a5f', label: 'ساده اداری' }
];

function hexFrom(value, fallback = '#4f8cff') {
  if (!value) return fallback;
  if (value.startsWith('#')) return value.slice(0, 7);
  const m = value.match(/#([0-9a-f]{6})/i);
  return m ? '#' + m[1] : fallback;
}

/** پیش‌نمایش کوچک سند با متغیرهای دلخواه */
export function buildPreview(vars, scale = 0.42) {
  const page = createElement('div.doc-page', {
    style: {
      width: '794px', minHeight: '520px', transform: 'scale(' + scale + ')', transformOrigin: 'top center',
      boxShadow: 'none', borderRadius: '0', fontSize: '13px'
    }
  });
  Object.entries(vars).forEach(([k, v]) => page.style.setProperty(k, v));
  page.innerHTML = `
    <div class="b b-hero" style="padding:16px 18px">
      <span class="hero-badge">پیش‌نمایش تم</span>
      <h1 class="hero-title" style="font-size:20px">عنوان سند نمونه</h1>
      <p class="hero-sub" style="font-size:11.5px">این پیش‌نمایش با متغیرهای انتخابی شما ساخته می‌شود.</p>
    </div>
    <div class="b b-heading"><h2 style="font-size:15px">عنوان بخش</h2><div class="underline"></div></div>
    <div class="b b-text"><p style="font-size:11.5px">متن نمونه برای نمایش فونت، رنگ و فاصله‌ها در سند نهایی. <b>بخش پررنگ</b> و <a href="#">لینک نمونه</a>.</p></div>
    <div class="b b-table"><table><thead><tr><th>شرح</th><th>تعداد</th><th>مبلغ</th></tr></thead>
      <tbody><tr><td>خدمات طراحی</td><td>۲</td><td>۱۲٬۰۰۰٬۰۰۰</td></tr>
      <tr><td>پشتیبانی</td><td>۱</td><td>۴٬۵۰۰٬۰۰۰</td></tr></tbody></table></div>
    <div class="b b-stat"><div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat"><div class="stat-icon">👥</div><div class="stat-value" style="font-size:16px">۱٬۲۴۰</div><div class="stat-label">کاربر</div></div>
      <div class="stat"><div class="stat-icon">⭐</div><div class="stat-value" style="font-size:16px">۹۶٪</div><div class="stat-label">رضایت</div></div>
      <div class="stat"><div class="stat-icon">🚀</div><div class="stat-value" style="font-size:16px">۳۸</div><div class="stat-label">پروژه</div></div>
    </div></div>
    <div class="b b-divider"><div style="height:2px;width:100%;border-radius:9px;background:linear-gradient(90deg,transparent,var(--d-accent),transparent)"></div></div>`;
  const holder = createElement('div', {
    style: { overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--border)', height: Math.round(520 * scale) + 'px', background: '#fff' }
  }, [page]);
  return holder;
}

export function renderThemeBuilder({ onChange, initialTheme } = {}) {
  const L=(fa,en)=>getLang()==='en'?en:fa;
  const labelMap={'رنگ اصلی':'Accent color','رنگ ملایم':'Soft color','رنگ عنوان':'Title color','رنگ متن':'Text color','سرستون جدول':'Table header','نوار زبرا':'Striped rows','خطوط و کادر':'Borders','پس‌زمینه صفحه':'Page background','آبی-بنفش':'Blue–violet','زمردی':'Emerald','غروب':'Sunset','سلطنتی':'Royal','مشکی':'Black','پاستیلی':'Pastel','ساده اداری':'Simple professional','وزیرمتن (فارسی)':'Vazirmatn (Persian)','Inter (لاتین)':'Inter (Latin)','Serif / آکادمیک':'Serif / academic','Monospace / فنی':'Monospace / technical'};
  const localized=x=>getLang()==='en'?(labelMap[x]||x):x;
  let vars = { ...BASE_VARS, ...((initialTheme && getTheme(initialTheme).vars) || {}) };
  let name = L('تم من','My theme');

  const previewHost = createElement('div');
  const paint = () => {
    clear(previewHost).appendChild(buildPreview(vars, 0.44));
    if (typeof onChange === 'function') onChange(vars);
  };

  const controls = createElement('div');

  const colorGrid = createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' } });
  COLOR_FIELDS.forEach(([key, originalLabel]) => {
    const label=localized(originalLabel);
    const input = createElement('input', { type: 'color', value: hexFrom(vars[key]), 'aria-label': label });
    input.addEventListener('input', () => {
      vars[key] = input.value;
      if (key === '--d-accent') vars['--d-th-bg'] = input.value;
      paint();
    });
    colorGrid.appendChild(createElement('div.field', {}, [createElement('label', { text: label }), input]));
  });

  const gradientSelect = createElement('select.select');
  GRADIENTS.forEach((g) => {
    const o = createElement('option', { value: g.value, text: localized(g.label) });
    if (vars['--d-header-bg'] === g.value) o.selected = true;
    gradientSelect.appendChild(o);
  });
  gradientSelect.addEventListener('change', () => { vars['--d-header-bg'] = gradientSelect.value; paint(); });

  const fontSelect = createElement('select.select');
  FONTS.forEach((f) => {
    const o = createElement('option', { value: f.value, text: localized(f.label) });
    if (vars['--d-font'] === f.value) o.selected = true;
    fontSelect.appendChild(o);
  });
  fontSelect.addEventListener('change', () => { vars['--d-font'] = fontSelect.value; paint(); });

  const radiusOut = createElement('span.tiny.muted', { text: parseInt(vars['--d-radius']) + 'px' });
  const radius = createElement('input.range', { type: 'range', min: '0', max: '24', value: parseInt(vars['--d-radius']) || 12 });
  radius.addEventListener('input', () => {
    vars['--d-radius'] = radius.value + 'px';
    radiusOut.textContent = radius.value + 'px';
    paint();
  });

  const alignSelect = createElement('select.select');
  [['right', L('راست (RTL)','Right (RTL)')], ['center', L('وسط','Center')], ['left', L('چپ (LTR)','Left (LTR)')]].forEach(([v, l]) => {
    alignSelect.appendChild(createElement('option', { value: v, text: l }));
  });
  alignSelect.value = vars['--d-align'] ? vars['--d-align'].replace(/"/g, '') : 'right';
  alignSelect.addEventListener('change', () => { vars['--d-align'] = alignSelect.value; paint(); });

  const nameInput = createElement('input.input', { value: name, placeholder: t('settings.themeName'), 'aria-label': t('settings.themeName') });
  nameInput.addEventListener('input', () => { name = nameInput.value; });

  const myThemesBox = createElement('div');
  const paintThemes = () => {
    clear(myThemesBox);
    const list = listCustomThemes();
    if (!list.length) {
      myThemesBox.appendChild(createElement('p.hint', { text: L('هنوز تم سفارشی ذخیره نکرده\u200cاید.','No custom themes saved yet.') }));
      return;
    }
    const row = createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.4rem' } });
    list.forEach((theme) => {
      const sw = createElement('div.chip.neutral', { style: { gap: '.4rem', cursor: 'pointer' }, title: theme.name }, [
        createElement('span', { style: { width: '12px', height: '12px', borderRadius: '50%', background: theme.vars['--d-accent'] || '#4f8cff', display: 'inline-block' } }),
        createElement('span', { text: theme.name }),
        createElement('button', {
          title: L('حذف','Delete'), style: { background: 'none', border: '0', color: 'inherit', cursor: 'pointer', padding: '0 2px' },
          onclick: (e) => { e.stopPropagation(); deleteCustomTheme(theme.id); paintThemes(); toast(L('تم حذف شد','Theme deleted')); }
        }, '✕')
      ]);
      sw.addEventListener('click', () => {
        vars = { ...BASE_VARS, ...theme.vars };
        name = theme.name;
        nameInput.value = theme.name;
        paint();
      });
      row.appendChild(sw);
    });
    myThemesBox.appendChild(row);
  };

  const saveBtn = createElement('button.btn.btn-primary.btn-sm', {
    type: 'button', onclick: () => {
      const saved = saveCustomTheme({ name: name || L('تم من','My theme'), vars: { ...vars } });
      paintThemes();
      toast(getLang()==='en'?`Theme “${saved.name}” saved`:'تم «' + saved.name + '» ذخیره شد', 'ok');
      if (typeof onChange === 'function') onChange(vars, saved);
    }
  }, L('💾 ذخیره تم','💾 Save theme'));

  const resetBtn = createElement('button.btn.btn-sm', {
    type: 'button', onclick: () => { vars = { ...BASE_VARS }; paint(); }
  }, L('↺ بازنشانی','↺ Reset'));

  controls.append(
    createElement('div.field', {}, [createElement('label', { text: t('settings.themeName') }), nameInput]),
    createElement('div.field', {}, [createElement('label', { text: L('هدر / گرادیان','Header / gradient') }), gradientSelect]),
    colorGrid,
    createElement('div.row', { style: { gap: '.5rem', marginTop: '.3rem' } }, [
      createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('prop.fontFamily') }), fontSelect]),
      createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('prop.align') }), alignSelect])
    ]),
    createElement('div.field', {}, [createElement('label', { text: L('گوشه\u200cها (radius)','Corner radius') }), createElement('div.row', {}, [radius, radiusOut])]),
    createElement('div.row', { style: { gap: '.4rem', marginTop: '.5rem' } }, [saveBtn, resetBtn])
  );

  const wrap = createElement('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem', alignItems: 'start' } }, [
    controls,
    createElement('div', {}, [
      createElement('h4', { text: t('settings.preview'), style: { margin: '0 0 .5rem', fontSize: '.78rem', color: 'var(--muted)' } }),
      previewHost,
      createElement('h4', { text: t('settings.myThemes'), style: { margin: '.8rem 0 .4rem', fontSize: '.78rem', color: 'var(--muted)' } }),
      myThemesBox
    ])
  ]);
  // در موبایل تک‌ستونه
  if (window.matchMedia('(max-width:720px)').matches) wrap.style.gridTemplateColumns = '1fr';

  paint();
  paintThemes();
  return wrap;
}

export default renderThemeBuilder;
