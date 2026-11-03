/* views/chrome.js — هدر/فوتر مشترک صفحات (کمکی برای جلوگیری از تکرار) */
import { createElement } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, getLang, setLang } from '../core/i18n.js';
import {saveSettings,getSettings} from '../core/state.js';
import {resolve} from '../core/router.js';

export const VERSION = '3.7.0';

export function siteHeader(active = '') {
  const navBtn = (id, label, href, iconName) => createElement('a.btn.btn-ghost.btn-sm' + (active === id ? '.active' : ''), {
    href, 'aria-label':label, style: active === id ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}
  }, [icon(iconName), createElement('span.lbl', { text: label })]);
  const en = getLang() === 'en';
  const docLabel = en ? 'Default document language for new documents' : 'زبان پیش‌فرض سندهای جدید';
  const docSelect=createElement('select',{'aria-label':docLabel,title:docLabel});
  [['en','EN'],['fa','فا']].forEach(([value,text])=>docSelect.appendChild(createElement('option',{value,text})));
  docSelect.value=getSettings().documentLang||'en';
  docSelect.addEventListener('change',()=>{saveSettings({documentLang:docSelect.value});resolve();});
  return createElement('header.site-header', {}, [
    createElement('a.brand', { href: '#/home', 'aria-label': t('app.title') }, [
      createElement('span.logo', {}, [icon('layout')]),
      createElement('span', { text: t('app.title') })
    ]),
    createElement('span.spacer'),
    createElement('nav.nav-links', { 'aria-label': 'main' }, [
      navBtn('home', t('nav.home'), '#/home', 'home'),
      navBtn('gallery', t('nav.gallery'), '#/gallery', 'folder'),
      navBtn('settings', t('nav.settings'), '#/settings', 'settings')
    ]),
    active === 'home' ? createElement('button.icon-btn.ui-language-toggle',{type:'button',title:getLang()==='en'?'Switch interface to Persian':'تغییر رابط به انگلیسی','aria-label':getLang()==='en'?'Switch interface to Persian':'تغییر زبان رابط به انگلیسی',onclick:()=>{const lang=getLang()==='en'?'fa':'en';setLang(lang);saveSettings({lang});resolve();}},[icon('language'),createElement('span',{text:getLang()==='en'?'فا':'EN'})]) : null,
    active === 'home' ? createElement('label.home-doc-language',{title:docLabel},[icon('text'),createElement('span.home-doc-language-label',{text:en?'Document':'سند'}),docSelect]) : null,
    createElement('a.btn.btn-primary.btn-sm.new-doc-link', { href: '#/editor', 'aria-label':t('nav.newDoc') }, [
      icon('plus'),
      createElement('span.lbl', { text: t('nav.newDoc') })
    ])
  ]);
}

export function siteFooter() {
  return createElement('footer.site-footer', {}, [
    createElement('div.frow', {}, [
      createElement('div', {}, [
        createElement('div.credit', { text: t('app.credit') }),
        createElement('div', {}, [
          createElement('a', { href: 'mailto:reza.khoshnoood@gmail.com', text: 'reza.khoshnoood@gmail.com' }),
          ' · ',
          createElement('a', { href: 'https://github.com/', target: '_blank', rel: 'noopener', text: 'GitHub' }),
          ' · ',
          createElement('a', { href: '#/settings', text: t('nav.settings') })
        ])
      ]),
      createElement('div.small', { text: `${t('app.title')} · ${t('app.version')} ${VERSION} · PWA · 100% client-side` })
    ])
  ]);
}

export function pageShell(active, children) {
  return createElement('div', { style: { display: 'flex', flexDirection: 'column', minHeight: '100vh' } },
    [siteHeader(active), ...(Array.isArray(children) ? children : [children]), siteFooter()]);
}

export default { siteHeader, siteFooter, pageShell, VERSION };
