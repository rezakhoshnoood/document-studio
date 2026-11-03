/* views/gallery.js — گالری قالب‌ها (آماده + قالب‌های من) */
import { createElement, clear, toast, confirmDialog, openModal, openModal as open, closeModal } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';
import { createDoc, listTemplates, deleteTemplate, getTheme } from '../core/state.js';
import { renderPage } from '../blocks/base.js';
import { TEMPLATES, TEMPLATE_CATEGORIES, templateToDoc } from '../templates/index.js';
import {getSettings} from '../core/state.js';
import { pageShell } from './chrome.js';
import {documentThumb,openTemplateDesigner,releaseThumbnails} from '../features/template-ui.js';
import { navigate,registerCleanup } from '../core/router.js';

function scaledPage(doc, scale = 0.31) {
  const page = renderPage(doc, { editable: false, animate: false, footer: false });
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = getLang() === 'fa' ? 'top right' : 'top left';
  page.style.boxShadow = 'none';
  page.style.borderRadius = '0';
  page.dataset.scale = String(scale);
  return page;
}

function useTemplate(tpl){openTemplateDesigner(tpl);}
function previewTemplate(tpl){openTemplateDesigner(tpl);}

export function renderGallery(root) {
  clear(root);
  registerCleanup(()=>releaseThumbnails(root));
  let tab = 'builtin';
  let search = '';
  let category = 'all';

  const content = createElement('div');

  const paint = () => {
    releaseThumbnails(content);clear(content);
    if (tab === 'builtin') {
      const list = TEMPLATES.filter((tpl) => {
        const name = (tpl.name[getLang()] || tpl.name.fa) + ' ' + (tpl.name.en || '');
        const okCat = category === 'all' || tpl.category === category;
        const okSearch = !search || name.toLowerCase().includes(search.toLowerCase());
        return okCat && okSearch;
      });
      if (!list.length) {
        content.appendChild(createElement('div.empty', { text: getLang()==='en'?'No templates match these filters.':'قالبی با این فیلترها پیدا نشد.' }));
        return;
      }
      const grid = createElement('div.gallery-grid');
      list.forEach((tpl) => {
        const doc = templateToDoc(tpl, getSettings().documentLang||'en');
        const previewWrap = createElement('div.tpl-preview', { onclick: () => previewTemplate(tpl), role: 'button', tabindex: '0', 'aria-label': t('btn.preview') }, [documentThumb(doc)]);
        grid.appendChild(createElement('article.tpl-card', {}, [
          previewWrap,
          createElement('div.tpl-body', {}, [
            createElement('div.row-between', {}, [
              createElement('h4', { text: tpl.name[getLang()] || tpl.name.fa }),
              createElement('span.chip', { text: t('cat.' + tpl.category) })
            ]),
            createElement('div.tiny.muted', { text: (doc.blocks || []).length + (getLang()==='en'?' blocks · ':' بلوک · ') + (getTheme(tpl.theme).label[getLang()] || tpl.theme) }),
            createElement('div.actions', {}, [
              createElement('button.btn.btn-sm.btn-primary', { onclick: () => useTemplate(tpl) }, '✓ ' + t('btn.use')),
              createElement('button.btn.btn-sm', { onclick: () => previewTemplate(tpl) }, '👁 ' + t('btn.preview'))
            ])
          ])
        ]));
      });
      content.appendChild(grid);
    } else {
      const mine = listTemplates().filter((tpl) => !search || (tpl.name || '').toLowerCase().includes(search.toLowerCase()));
      if (!mine.length) {
        content.appendChild(createElement('div.empty', { text: t('gallery.empty') }));
        return;
      }
      const grid = createElement('div.gallery-grid');
      mine.forEach((tpl) => {
        const doc = { ...tpl, blocks: tpl.blocks, lang: tpl.lang || 'fa', settings: tpl.settings || {} };
        const previewWrap = createElement('div.tpl-preview', { onclick: () => previewTemplate(tpl), role: 'button', tabindex: '0' }, [documentThumb(doc)]);
        grid.appendChild(createElement('article.tpl-card', {}, [
          previewWrap,
          createElement('div.tpl-body', {}, [
            createElement('div.row-between', {}, [
              createElement('h4', { text: tpl.name }),
              createElement('span.chip.neutral', { text: t('gallery.mine') })
            ]),
            createElement('div.tiny.muted', { text: (tpl.blocks || []).length + (getLang()==='en'?' blocks':' بلوک') }),
            createElement('div.actions', {}, [
              createElement('button.btn.btn-sm.btn-primary', { onclick: () => useTemplate(tpl) }, '✓ ' + t('btn.use')),
              createElement('button.btn.btn-sm.btn-danger', {
                onclick: async () => {
                  if (await confirmDialog(getLang()==='en'?'Delete this template?':'این قالب حذف شود؟', { danger: true })) {
                    deleteTemplate(tpl.id);
                    toast(t('msg.deleted'));
                    paint();
                  }
                }
              }, '🗑')
            ])
          ])
        ]));
      });
      content.appendChild(grid);
    }
  };

  const searchInput = createElement('input.input', {
    type: 'search', placeholder: t('gallery.search'), 'aria-label': t('gallery.search'),
    style: { maxWidth: '260px' }
  });
  searchInput.addEventListener('input', () => { search = searchInput.value; paint(); });

  const tabs = createElement('div.tabs', { role: 'tablist' });
  [['builtin', t('gallery.builtin')], ['mine', t('gallery.mine')]].forEach(([id, label]) => {
    const b = createElement('button.tab' + (tab === id ? '.active' : ''), {
      role: 'tab', 'aria-selected': tab === id ? 'true' : 'false',
      onclick: (e) => {
        tab = id;
        tabs.querySelectorAll('.tab').forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-selected', 'true');
        paint();
      }
    }, label);
    tabs.appendChild(b);
  });

  const catRow = createElement('div.row', { style: { flexWrap: 'wrap', gap: '.35rem', marginTop: '.7rem' } });
  [{ id: 'all', label: getLang()==='en'?'All':'همه' }, ...TEMPLATE_CATEGORIES.map((c) => ({ id: c.id, label: t(c.labelKey) }))].forEach((c) => {
    const chip = createElement('button.btn.btn-sm' + (category === c.id ? '.btn-primary' : ''), {
      text: c.label,
      onclick: (e) => {
        category = c.id;
        catRow.querySelectorAll('button').forEach((b) => { b.classList.remove('btn-primary'); });
        e.currentTarget.classList.add('btn-primary');
        paint();
      }
    });
    catRow.appendChild(chip);
  });

  const head = createElement('section.section.wrap', {}, [
    createElement('div.row-between', { style: { flexWrap: 'wrap', gap: '.6rem' } }, [
      createElement('h1', { text: t('gallery.title'), style: { margin: '0', fontSize: '1.35rem' } }),
      searchInput
    ]),
    createElement('p.muted.small', { text: getLang()==='en'?'Choose a template to create an editable document.':'قالب را انتخاب کنید؛ یک سند جدید از آن ساخته می‌شود و می‌توانید آزادانه ویرایش کنید.', style: { margin: '.4rem 0 .8rem' } }),
    tabs,
    catRow
  ]);
  const body = createElement('section.section.wrap', { style: { paddingTop: '0' } }, [content]);

  root.appendChild(pageShell('gallery', [head, body]));
  paint();
}

export default renderGallery;
