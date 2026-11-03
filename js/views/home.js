/* views/home.js — صفحه اصلی/لندینگ */
import { createElement, clear, formatDate, toast, confirmDialog, openModal, closeModal } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, getLang } from '../core/i18n.js';
import { listDocs, deleteDoc, duplicateDoc, getDoc, listTemplates, createDoc, getSettings } from '../core/state.js';
import { renderPage, createBlock } from '../blocks/base.js';
import { TEMPLATES, templateToDoc } from '../templates/index.js';
import { pageShell } from './chrome.js';
import {documentThumb,releaseThumbnails} from '../features/template-ui.js';
import { navigate, registerCleanup } from '../core/router.js';
import { exportAllJSON, pickJSONFile, importDocuments } from '../features/export-json.js';

const FEATURES = [
  { icon: 'layout', title: 'home.feat.blocks', desc: 'home.feat.blocks.d' },
  { icon: 'palette', title: 'home.feat.themes', desc: 'home.feat.themes.d' },
  { icon: 'lock', title: 'home.feat.crypto', desc: 'home.feat.crypto.d' },
  { icon: 'export', title: 'home.feat.html', desc: 'home.feat.html.d' },
  { icon: 'play', title: 'home.feat.present', desc: 'home.feat.present.d' },
  { icon: 'phone', title: 'home.feat.pwa', desc: 'home.feat.pwa.d' }
];

function typewriter(node, text, speed = 70) {
  let i = 0;
  node.textContent = '';
  const caret = createElement('span.caret', { 'aria-hidden': 'true' });
  node.appendChild(caret);
  const tick = () => {
    if (i <= text.length) {
      caret.remove();
      node.textContent = text.slice(0, i);
      node.appendChild(caret);
      i++;
      setTimeout(tick, speed);
    } else {
      setTimeout(() => caret.remove(), 1400);
    }
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.textContent = text;
    return;
  }
  setTimeout(tick, 240);
}

function templateThumb(tpl, scale = 0.24) {
  const doc = templateToDoc(tpl, getLang());
  const page = renderPage(doc, { editable: false, animate: false });
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = 'top center';
  page.style.boxShadow = 'none';
  page.style.borderRadius = '0';
  page.style.minHeight = '1123px';
  const holder = createElement('div.thumb', { style: { height: '132px' } }, [page]);
  return holder;
}

async function installApp(){
 const en=getLang()==='en';
 if(matchMedia('(display-mode: standalone)').matches || navigator.standalone){toast(en?'The app is already installed.':'برنامه هم‌اکنون نصب شده است.');return;}
 const prompt=window.__dsInstallPrompt;
 if(prompt){window.__dsInstallPrompt=null;try{await prompt.prompt();await prompt.userChoice;}catch(e){toast(en?'Use your browser’s Install app command.':'از منوی مرورگر گزینه نصب را انتخاب کنید.');}return;}
 openModal({title:en?'Install Document Studio':'نصب سندساز',body:createElement('p',{text:en?'If your browser supports installation, use “Install app” or “Add to Home Screen” in its menu. On iPhone or iPad, use Share → Add to Home Screen in Safari. Installation requires HTTPS or localhost; availability varies by browser.':'اگر مرورگر از نصب پشتیبانی می‌کند، از منوی آن «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید. در iPhone یا iPad از منوی اشتراک‌گذاری Safari گزینه Add to Home Screen را بزنید. نصب به HTTPS یا localhost نیاز دارد و در همه مرورگرها در دسترس نیست.'}),footer:[createElement('button.btn.btn-primary',{onclick:closeModal},en?'Got it':'متوجه شدم')]});
}

function openCodeLayout() {
  const en=getLang()==='en', L=(fa,enText)=>en?enText:fa;
  const html=createElement('textarea.textarea',{rows:12,dir:'ltr',spellcheck:'false','aria-label':'HTML',placeholder:'<section><h1>My page</h1></section>',style:{fontFamily:'monospace',textAlign:'left',minHeight:'210px'}});
  const css=createElement('textarea.textarea',{rows:5,dir:'ltr',spellcheck:'false','aria-label':'CSS',placeholder:'section { padding: 2rem; }',style:{fontFamily:'monospace',textAlign:'left'}});
  const body=createElement('div',{},[createElement('p.hint',{text:L('HTML را وارد کنید و «ساخت چیدمان» را بزنید. CSS جداگانه یا تگ style پذیرفته می‌شود. اسکریپت، رویدادها و منابع خارجی به دلایل امنیتی اجرا نمی‌شوند.','Paste HTML and choose Build layout. Separate CSS or style tags are supported. Scripts, events and external resources are not run for safety.')}),createElement('label',{text:'HTML'}),html,createElement('label',{text:'CSS'}),css]);
  openModal({title:L('ساخت چیدمان با کد','Build a layout from code'),size:'lg',body,footer:[createElement('button.btn',{onclick:closeModal},t('btn.cancel')),createElement('button.btn.btn-primary',{onclick:()=>{
    if(!html.value.trim()){toast(L('کد HTML را وارد کنید.','Enter HTML first.'),'err');return;}
    const parsed=new DOMParser().parseFromString(html.value,'text/html');const embedded=Array.from(parsed.querySelectorAll('style')).map(x=>x.textContent).join('\n');
    const block=createBlock('layout',{data:{html:html.value,css:[css.value,embedded].filter(Boolean).join('\n')}});
    const d=createDoc({name:L('چیدمان کدنویسی‌شده','Custom code layout'),blocks:[block]});if(d){closeModal();navigate('/editor/'+d.id);}else toast(L('ساخت سند ناموفق بود.','Could not create document.'),'err');
  }},L('ساخت چیدمان','Build layout'))]});
}

export function renderHome(root) {
  if(root._homeShowcaseCleanup){root._homeShowcaseCleanup();root._homeShowcaseCleanup=null;}
  clear(root);
  const docs = listDocs();

  /* ---------- hero ---------- */
  const heroTitle = createElement('h1', { 'aria-label': t('app.title') });
  const hero = createElement('section.hero', {}, [
    createElement('span.hero-kicker', {text: getLang()==='en' ? 'DESIGN · PRESENT · PRINT' : 'طراحی · ارائه · چاپ'}),
    heroTitle,
    createElement('p.sub', { text: t('app.tagline') }),
    createElement('div.hero-cta', {}, [
      createElement('a.btn.btn-primary.btn-lg', { href: '#/editor' }, [icon('plus'), ' '+t('btn.start')]),
      createElement('button.btn.btn-lg.home-install', { type:'button', onclick:installApp }, [icon('phone'), ' '+(getLang()==='en'?'Install app':'نصب برنامه')]),
      createElement('a.btn.btn-lg', { href: '#/gallery' }, [icon('folder'), ' '+t('btn.seeTemplates')]),
      createElement('button.btn.btn-lg', { onclick: openCodeLayout }, getLang()==='en' ? '‹/› Start with code' : '‹/› طراحی با کد')
    ]),
    createElement('div.row.center', { style: { justifyContent: 'center', marginTop: '1.1rem', flexWrap: 'wrap', gap: '.4rem' } }, [
      createElement('span.chip', { text: getLang()==='en' ? 'Private by design' : 'خصوصی و آفلاین' }),
      createElement('span.chip.neutral', { text: 'PWA' }),
      createElement('span.chip.neutral', { text: 'Offline-first' }),
      createElement('span.chip.neutral', { text: getLang()==='en' ? '14 building blocks' : '۱۴ بلوک طراحی' }),
      createElement('span.chip.neutral', { text: getLang()==='en'?'12 themes':'۱۲ تم' }),
      createElement('span.chip.neutral', { text: 'AES-GCM' })
    ])
  ]);

  /* ---------- features ---------- */
  const featureGrid = createElement('div.feature-grid');
  FEATURES.forEach((f) => {
    featureGrid.appendChild(createElement('article.feature', {}, [
      createElement('span.fi', {'aria-hidden':'true'}, [icon(f.icon)]),
      createElement('h3', { text: t(f.title) }),
      createElement('p', { text: t(f.desc) })
    ]));
  });
  const features = createElement('section.section.wrap', {}, [
    createElement('h2.section-title', {}, [createElement('span.dot'), t('home.features')]),
    featureGrid
  ]);

  /* ---------- animated gallery showcase ---------- */
  const en=getLang()==='en';
  const strip=createElement('div.showcase-grid',{'aria-hidden':'true'});
  let previous=[];
  function showTemplates(){
    const pool=TEMPLATES.filter(t=>!previous.includes(t.id));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    const picks=pool.slice(0,4);previous=picks.map(t=>t.id);
    releaseThumbnails(strip);
    strip.replaceChildren(...picks.map((tpl,i)=>{
      const doc=templateToDoc(tpl,getSettings().documentLang||'en');
      return createElement('article.showcase-card',{'data-template-id':tpl.id},[
        createElement('div.showcase-card-top',{},[createElement('span.showcase-card-dot'),createElement('span',{text:en?'TEMPLATE':'قالب'}),createElement('span.spacer'),createElement('span',{text:String(i+1).padStart(2,'0')})]),
        documentThumb(doc),createElement('strong',{text:tpl.name[getLang()]||tpl.name.fa})
      ]);
    }));
  }
  showTemplates();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const timer=setInterval(()=>{if(!reduce.matches && getSettings().uiMotion!==false && !document.hidden && !showcase.matches(':hover') && !showcase.contains(document.activeElement) && !document.querySelector('#modal-host.open'))showTemplates();},8500);
  const cleanup=()=>{clearInterval(timer);releaseThumbnails(root);};root._homeShowcaseCleanup=cleanup;
  registerCleanup(()=>{cleanup();if(root._homeShowcaseCleanup===cleanup)root._homeShowcaseCleanup=null;});
  const showcase=createElement('a.template-showcase',{href:'#/gallery','aria-label':en?'Explore all built-in templates':'مشاهده همه قالب‌های آماده'},[
    createElement('div.showcase-orb.orb-one',{'aria-hidden':'true'}),createElement('div.showcase-orb.orb-two',{'aria-hidden':'true'}),
    createElement('div.showcase-intro',{},[
      createElement('span.showcase-eyebrow',{text:en?'THE TEMPLATE COLLECTION':'مجموعه قالب‌های آماده'}),
      createElement('h2',{text:en?'A little inspiration for your next idea.':'ایده‌ای تازه برای سند بعدی شما.'}),
      createElement('p',{text:en?'Explore real, ready-to-edit templates — from invoices and reports to portfolios and more.':'قالب‌های واقعی و آماده ویرایش را ببینید؛ از فاکتور و گزارش تا نمونه‌کار و بیشتر.'}),
      createElement('span.showcase-link',{},[en?'Explore all templates':'مشاهده همه قالب‌ها',createElement('span',{'aria-hidden':'true'},en?'↗':'↖')]),
      createElement('span.showcase-count',{text:en?`${TEMPLATES.length} BUILT-IN TEMPLATES`:`${TEMPLATES.length} قالب آماده`})
    ]),
    createElement('div.showcase-visual',{},[createElement('div.showcase-glow',{'aria-hidden':'true'}),strip])
  ]);
  const presets=createElement('section.section.wrap.showcase-section',{},[showcase]);

  /* ---------- recent docs ---------- */
  const recentBox = createElement('div.doc-grid');
  if (!docs.length) {
    recentBox.appendChild(createElement('div.empty', { text: t('home.noDocs') }));
  } else {
    docs.slice(0, 6).forEach((d) => {
      const fullDoc=getDoc(d.id);
      const card = createElement('article.doc-card', {}, [
        fullDoc?createElement('a.recent-preview',{href:'#/editor/'+d.id,'aria-label':(getLang()==='en'?'Open ':'بازکردن ')+(d.name||'')},[documentThumb(fullDoc)]):null,
        createElement('div.row-between', {}, [
          createElement('h4', { text: d.name || t('editor.untitled'), title: d.name }),
          createElement('span.chip.neutral', { text: (d.blockCount || 0) + (getLang()==='en'?' blocks':' بلوک') })
        ]),
        createElement('div.meta', {}, [
          createElement('span', { text: formatDate(d.updatedAt || d.createdAt) }),
          createElement('span', { text: d.theme || '' })
        ]),
        createElement('div.actions', {}, [
          createElement('a.btn.btn-sm.btn-primary', { href: '#/editor/' + d.id }, '✏ ' + t('btn.edit')),
          createElement('a.btn.btn-sm', { href: '#/present/' + d.id }, '▶ ' + t('btn.present')),
          createElement('button.btn.btn-sm', {
            onclick: () => { if (duplicateDoc(d.id)) { toast(t('msg.saved')); renderHome(root); } }
          }, '⧉'),
          createElement('button.btn.btn-sm.btn-danger', {
            onclick: async () => {
              if (await confirmDialog(t('msg.confirmDelete'), { danger: true, ok: t('btn.delete') })) {
                if (deleteDoc(d.id)) { toast(t('msg.deleted')); renderHome(root); }
              }
            }
          }, '🗑')
        ])
      ]);
      recentBox.appendChild(card);
    });
  }
  const backupActions=createElement('div.row', {style:{gap:'.5rem',flexWrap:'wrap'}}, [
    createElement('button.btn.btn-sm',{onclick:()=>exportAllJSON()},getLang()==='en'?'↓ Backup all JSON':'↓ پشتیبان همه سندها'),
    createElement('button.btn.btn-sm',{onclick:()=>pickJSONFile((data,file,err)=>{if(err||!data){toast(getLang()==='en'?'Invalid backup':'فایل معتبر نیست','err');return;}const created=importDocuments(data).filter(Boolean);toast(created.length ? (getLang()==='en'?'Backup imported':'پشتیبان وارد شد') : (getLang()==='en'?'No documents imported':'سندی وارد نشد'),created.length?'ok':'err');renderHome(root);})},getLang()==='en'?'↑ Restore JSON':'↑ بازیابی JSON')
  ]);
  const recent = createElement('section.section.wrap', {}, [
    createElement('div.row-between',{style:{flexWrap:'wrap',marginBottom:'1rem'}},[createElement('h2.section-title', {style:{margin:'0'}}, [createElement('span.dot'), t('home.recent')]),backupActions]),
    recentBox
  ]);

  root.appendChild(pageShell('home', [hero, presets, features, recent]));
  typewriter(heroTitle,t('home.heroTitle'),65);
}

export default renderHome;
