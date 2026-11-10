/* views/editor.js — ادیتور اصلی (Figma-like، سبک و بهینه) */
import {
  createElement, clear, $, $$, debounce, toast, confirmDialog, openModal, closeModal,
  promptDialog, formatDateShort, downloadFile, copyText, on
} from '../core/dom.js';
import { t, getLang, setLang as setUiLang } from '../core/i18n.js';
import {
  getDoc, createDoc, saveDoc, queueSave, flushSave, deleteDoc,
  initHistory, commitHistory, undo, redo, historyState,
  getThemes, getTheme, saveAsTemplate, getSettings, saveSettings, DEFAULT_DOC_SETTINGS
} from '../core/state.js';
import { renderPage, renderBlock, blockTypes, createBlock, attachInlineEditing, propsApi, commonStyleProps, registry, styleToCss, applyBackgroundLayer } from '../blocks/base.js';
import {miniBlockControls} from '../blocks/mini-blocks.js';
import {sectionFor,sectionRow,logicalRect} from '../blocks/table-merge.js';
import {installTableKeyboard,preserveTableFocus} from '../blocks/table-keyboard.js';
import { bg, EFFECTS } from '../effects/manager.js';
import { PRESETS, getAppearance, applyAppearance, getCustomPresets, storeCustomPreset, removeCustomPreset, randomAppearance } from '../features/appearance.js';
import { addTableRow, deleteTableRow, moveTableRow, insertTableColumn, deleteTableColumn, moveTableColumn } from '../blocks/table-ops.js';
import { tableFooter } from '../core/numbers.js';
import {smartFooter,displayTableCell} from '../core/table-math.js';
import { createCustomBackground, BACKGROUND_EXAMPLE } from '../features/custom-background.js';
import * as particles from '../effects/particles.js';
import * as bubbles from '../effects/bubbles.js';
import * as orbit from '../effects/orbit.js';
import * as waves from '../effects/waves.js';
import * as matrix from '../effects/matrix.js';
import { exportTablesCSV } from '../features/export-formats.js';
import { buildExportHTML, MODES } from '../features/export-html.js';
import { exportPresentHTML } from '../features/export-present.js';
import { exportDocJSON, pickJSONFile, importDocuments } from '../features/export-json.js';
import { docToPlainText, buildShareLink, openShare, nativeShare } from '../features/share.js';
import { createExtra } from '../effects/extra.js';
import { createInteraction } from '../effects/interaction.js';
import {createReactiveBackground} from '../effects/reactive-background.js';
import { createCustomInteraction, INTERACTION_EXAMPLE } from '../features/custom-interaction.js';
import { iconDesignControls } from '../blocks/icon-design.js';
import { imagePicker } from '../features/icon-upload.js';
import {fitLogoToImage} from '../blocks/logo.js';
import { arrangeFree } from '../features/smart-arrange.js';
import { rememberBlockDesign, resetDesign } from '../features/design-reset.js';
import { setupFreePage } from '../features/free-layout.js';
import { applyPartOpacity, hasFadedTextParts, partSpecs } from '../blocks/parts.js';
import { applyTextInk } from '../blocks/ink.js';
import { renderThemeBuilder } from '../features/theme-builder.js';
import { icon } from '../core/icons.js';
import {getTemplate,templateToDoc} from '../templates/index.js';
import {localizeNewBlock} from '../templates/english.js';
import {snapshotDesign} from '../features/design-reset.js';
import { navigate, registerCleanup } from '../core/router.js';

const ZOOM_MIN = 0.35, ZOOM_MAX = 1.6;

export function renderEditor(root, { id } = {}) {
  /* ---------- document ---------- */
  let doc = id && id !== 'new' ? getDoc(id) : null;
  const isNew = !doc;
  if (!doc) {
    doc = createDoc({ name: t('editor.untitled'), lang: getSettings().documentLang === 'en' ? 'en' : 'fa', blocks: [] });
    if (!doc) { clear(root); root.appendChild(createElement('p', { text:'ذخیره‌سازی مرورگر در دسترس نیست؛ فضای مرورگر را بررسی کنید.' })); return; }
    history.replaceState(null, '', '#/editor/' + doc.id);
  }
  initHistory(doc);

  let selectedId = doc.blocks[0] ? doc.blocks[0].id : null;
  let propsLastId=null;
  let savedTextRange=null,savedTextNode=null,updateTypeTarget=()=>{},lastHighlightColor="#ffea66";
  let workspace = 'simple';
  let zoom = 1;
  let saveState = 'saved';
  let deleted = false;
  let resizeVisible = false;
  const disposers = [];

  /* ---------- shell ---------- */
  const titleInput = createElement('input.doc-name', {
    value: doc.name, 'aria-label': t('editor.docName'), spellcheck: 'false',
    oninput: () => { doc.name = titleInput.value; queueSave(doc); },
    onchange: () => { doc.name = titleInput.value; commitHistory(doc); queueSave(doc); }
  });

  const undoBtn = createElement('button.icon-btn', { title: t('btn.undo') + ' (⌘/Ctrl+Z)', 'aria-label': t('btn.undo') }, icon('undo'));
  const redoBtn = createElement('button.icon-btn', { title: t('btn.redo') + ' (⇧⌘/Ctrl+Z)', 'aria-label': t('btn.redo') }, icon('redo'));

  const topBar = createElement('div.ed-top', {}, [
    createElement('button.icon-btn', { title: t('editor.panels'), 'aria-label': t('editor.panels'), onclick: () => toggleDrawer('left') }, icon('menu')),
    createElement('a.icon-btn', { href: '#/home', title: t('nav.home'), 'aria-label': t('nav.home'), onclick:(e)=>{if(!flushSave(doc))e.preventDefault();} }, icon('home')),
    titleInput,
    createElement('span.sep'),
    undoBtn,
    redoBtn,
    createElement('span.spacer'),
    createElement('button.icon-btn.wide.preset-button', { title:getLang()==='en'?'Appearance presets':'ظاهر و چیدمان', 'aria-label':getLang()==='en'?'Appearance presets':'ظاهر و چیدمان', onclick:()=>openPresets() }, [icon('palette'),createElement('span.lbl',{text:getLang()==='en'?'Presets':'ظاهر و چیدمان'})]),
    createElement('button.icon-btn.wide.preview-button', { title:getLang()==='en'?'Responsive preview':'پیش‌نمایش', 'aria-label':getLang()==='en'?'Responsive preview':'پیش‌نمایش', onclick:()=>openResponsivePreview(doc) }, [icon('eye'),createElement('span.lbl',{text:getLang()==='en'?'Preview':'پیش‌نمایش'})]),
    createElement('button.icon-btn.wide.legacy-print', { title: t('btn.print'), onclick: () => { if (flushSave(doc)) navigate('/print/' + doc.id); }, 'aria-label': t('btn.print') }, [icon('print'), createElement('span.lbl', { text: t('btn.print') })]),
    createElement('button.icon-btn.wide', { title: getLang()==='en'?'Export':'خروجی', onclick: () => openExportModal(), 'aria-label': t('btn.export') }, [icon('export'), createElement('span.lbl', { text: getLang()==='en'?'Export':'خروجی' })]),
    createElement('button.icon-btn.wide', {
      title: t('btn.present'), 'aria-label': t('btn.present'),
      onclick: () => { if (flushSave(doc)) navigate('/present/' + doc.id); }
    }, [icon('play'), createElement('span.lbl', { text: t('btn.present') })]),
    createElement('button.icon-btn.wide.design-reset-btn',{'aria-label':getLang()==='en'?'Reset design':'بازنشانی طراحی',title:getLang()==='en'?'Reset design':'بازنشانی طراحی',onclick:()=>openDesignReset()},[icon('undo'),createElement('span.lbl',{text:getLang()==='en'?'Reset design':'بازنشانی طراحی'})]),
    createElement('button.icon-btn.web-settings-btn', { title: t('editor.docSettings'), 'aria-label': t('editor.docSettings'), onclick: () => openDocSettings() }, icon('settings')),
    createElement('button.icon-btn', { title: t('editor.panels'), 'aria-label': t('editor.properties'), onclick: () => toggleDrawer('right') }, icon('panel'))
  ]);

  /* ---------- left panel ---------- */
  const layerList = createElement('ul.layer-list');
  const palette = createElement('div.palette');
  const addBlockPalette = () => {
    clear(palette);
    blockTypes().forEach((def) => {
      palette.appendChild(createElement('button.pal-item', {
        type: 'button', title: t(def.labelKey),
        onclick: () => addBlock(def.type)
      }, [icon(def.type), createElement('span', { text: t(def.labelKey) })]));
    });
  };
  addBlockPalette();

  const leftPanel = createElement('aside.ed-side.left', { 'aria-label': t('editor.layers') }, [
    createElement('div.panel-head', {}, [
      createElement('span', { text: t('editor.layers') }),
      createElement('button.icon-btn', { title: '×', onclick: () => toggleDrawer('left') }, '✕')
    ]),
    layerList,
    createElement('div.panel-head', {}, [createElement('span', { text: t('editor.addBlock') })]),
    palette,
    createElement('div.panel-section', {}, [
      createElement('button.btn.btn-sm', { style: { width: '100%' }, onclick: () => saveAsTemplatePrompt() }, [icon('copy'), ' '+t('btn.saveAsTemplate')])
    ])
  ]);

  /* ---------- right panel ---------- */
  const propBody = createElement('div');
  // Convert document content fields, not technical, numeric or LTR inputs.
  propBody.addEventListener('input',e=>{const el=e.target;if(doc.lang!=='fa'||e.isComposing||!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return;if(el instanceof HTMLInputElement && !['text','search'].includes(el.type))return;const label=el.getAttribute('aria-label')||'';if(el.dir==='ltr'||/formula|فرمول|code|کد|filename|نام فایل|url|آدرس/i.test(label)||/(?:https?:\/\/|www\.|@)/i.test(el.value))return;const next=el.value.replace(/[0-9]/g,c=>'۰۱۲۳۴۵۶۷۸۹'[Number(c)]);if(next!==el.value){const start=el.selectionStart,end=el.selectionEnd,dir=el.selectionDirection;el.value=next;if(start!=null)el.setSelectionRange(start,end,dir);}},true);
  const rightPanel = createElement('aside.ed-side.right', { 'aria-label': t('editor.properties') }, [
    createElement('div.panel-head', {}, [
      createElement('span', { text: t('editor.properties') }),
      createElement('button.icon-btn', { title: '×', onclick: () => toggleDrawer('right') }, '✕')
    ]),
    propBody
  ]);

  /* ---------- canvas ---------- */
  const canvas = createElement('main.ed-canvas', { 'aria-label': 'canvas' });
  function setupPanelResize(panel, side){
    const handle=createElement('button.panel-resize',{type:'button',role:'separator','aria-orientation':'vertical','aria-label':side==='left'?(getLang()==='en'?'Resize layers panel':'تغییر عرض پنل لایه‌ها'):(getLang()==='en'?'Resize properties panel':'تغییر عرض پنل تنظیمات')});panel.prepend(handle);let start=null;
    const apply=(width)=>{const body=editor.querySelector('.ed-body');if(!body)return;body.style.setProperty('--'+side+'-width',Math.max(180,Math.min(450,width,body.clientWidth*.4))+'px');};
    handle.addEventListener('pointerdown',e=>{if(innerWidth<=900)return;e.preventDefault();start={x:e.clientX,w:panel.getBoundingClientRect().width};handle.setPointerCapture(e.pointerId);});
    handle.addEventListener('pointermove',e=>{if(!start)return;const rect=panel.getBoundingClientRect(),center=(rect.left+rect.right)/2;const dir=center<innerWidth/2?1:-1;apply(start.w+(e.clientX-start.x)*dir);});handle.addEventListener('pointerup',()=>{start=null;});handle.addEventListener('pointercancel',()=>{start=null;});
    handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const r=panel.getBoundingClientRect(),dir=(r.left+r.right)/2<innerWidth/2?1:-1;apply(r.width+(e.key==='ArrowRight'?10:-10)*dir);});
  }
  setupPanelResize(leftPanel,'left');setupPanelResize(rightPanel,'right');
  const shell = createElement('div.canvas-shell');
  const bgWrap = createElement('div.editor-bg-wrap', { 'aria-hidden': 'true' });
  canvas.append(bgWrap, shell);
  let editorEffect = null, editorInteraction=null, editorReactive=null, lastEffectKey = '';
  function renderEditorBackground() {
    const key = workspace === 'simple' ? 'off' : JSON.stringify([doc.settings?.bgEffect,doc.settings?.bgEffectColor,doc.settings?.bgEffectOpacity,doc.settings?.bgReactMove,doc.settings?.bgReactClick,doc.settings?.bgInteractive,doc.settings?.bgInteractiveMode,doc.settings?.bgInteractiveOpacity,doc.settings?.customInteraction,doc.settings?.customBackground]);
    if (key === lastEffectKey) return; lastEffectKey=key;
    if (editorEffect) { editorEffect.destroy(); editorEffect = null; }
    if(editorInteraction){editorInteraction.destroy();editorInteraction=null;}
    if(editorReactive){editorReactive.destroy();editorReactive=null;}
    clear(bgWrap);
    if (workspace === 'simple') return;
    const settings = doc.settings || {}, name = settings.bgEffect || 'particles';
    if (name === 'custom') {
      const iframe = createCustomBackground(settings.customBackground);
      iframe.style.opacity = String(settings.bgEffectOpacity ?? .3);
      bgWrap.appendChild(iframe);
    } else if (name === 'gradient-flow') {
      const gradient = createElement('div.editor-gradient');
      gradient.style.setProperty('--editor-fx', settings.bgEffectColor || '#4f8cff');
      gradient.style.opacity = String(settings.bgEffectOpacity ?? .3);
      bgWrap.appendChild(gradient);
    } else {
      const factories = { particles, bubbles, orbit, waves, matrix };
      if (factories[name] || ['stars','fireflies','snow','rain'].includes(name)) {
        const backdrop = createElement('canvas'); backdrop.style.opacity = String(settings.bgEffectOpacity ?? .3);
        bgWrap.appendChild(backdrop);
        editorEffect = factories[name] ? factories[name].create(backdrop, { color: settings.bgEffectColor || '#4f8cff' }) : createExtra(backdrop,{color:settings.bgEffectColor || '#4f8cff'},name);
        editorEffect.start();
      }
    }
    if((settings.bgReactMove||settings.bgReactClick)&&bgWrap.firstElementChild)editorReactive=createReactiveBackground(bgWrap.firstElementChild,{move:!!settings.bgReactMove,click:!!settings.bgReactClick});
    if(settings.bgInteractive && !matchMedia('(prefers-reduced-motion: reduce)').matches)editorInteraction=settings.bgInteractiveMode==='custom'?createCustomInteraction(bgWrap,settings.customInteraction||INTERACTION_EXAMPLE,settings.bgInteractiveOpacity??.65):createInteraction(bgWrap,settings.bgEffectColor||'#4f8cff',settings.bgInteractiveOpacity??.65,settings.bgInteractiveMode||'trail');
  }
  disposers.push(() => { if (editorEffect) editorEffect.destroy(); if(editorInteraction)editorInteraction.destroy();if(editorReactive)editorReactive.destroy(); });

  const zoomVal = createElement('span.z-val', { text: '100%' });
  const zoomPill = createElement('div.zoom-pill', {}, [
    createElement('button', { title: 'zoom out', onclick: () => setZoom(zoom - 0.1) }, '−'),
    zoomVal,
    createElement('button', { title: 'zoom in', onclick: () => setZoom(zoom + 0.1) }, '+'),
    createElement('button', { title: 'fit', onclick: () => fitZoom() }, '⤢')
  ]);

  const viewportInput = createElement('input', { type:'number', min:'320', max:'1920', value:'794', 'aria-label':getLang()==='en'?'Preview width in pixels':'عرض پیش‌نمایش به پیکسل', style:{ width:'66px', background:'#151d31', color:'#fff', border:'1px solid #46546e', borderRadius:'6px', padding:'4px', textAlign:'center' } });
  const viewportBar = createElement('div.viewport-bar', { role:'group', 'aria-label':getLang()==='en'?'Responsive preview':'پیش‌نمایش واکنش‌گرا' }, [
    createElement('span', { text:getLang()==='en'?'Viewport':'عرض نمایش' }),
    ...[['375','Mobile'],['768','Tablet'],['1200','Desktop']].map(([w,l])=>createElement('button',{type:'button',title:l+' '+w+'px','aria-label':l+' '+w+'px',onclick:()=>setViewport(Number(w))},l)),
    viewportInput, createElement('span',{text:'px'})
  ]);
  function setViewport(w) { const base=workspace==='web'?1200:794;w=Math.max(320,Math.min(1920,Number(w)||base)); viewportInput.value=w; zoom=w/base; shell.style.width=w+'px'; zoomVal.textContent=Math.round(zoom*100)+'%'; }
  viewportInput.addEventListener('change',()=>setViewport(viewportInput.value));

  const backdrop = createElement('div.drawer-backdrop', { onclick: () => closeDrawers() });

  /* ---------- status bar ---------- */
  const saveChip = createElement('span.st-item.saved', { text: '✓ ' + t('editor.saved') });
  const blockCount = createElement('span.st-item', { text: '' });
  const langSelect = createElement('select', { 'aria-label': t('editor.lang') });
  [['fa', 'فارسی'], ['en', 'English']].forEach(([v, l]) => {
    const o = createElement('option', { value: v, text: l });
    if (doc.lang === v) o.selected = true;
    langSelect.appendChild(o);
  });
  langSelect.setAttribute('aria-label', t('editor.lang'));
  langSelect.addEventListener('change', () => requestDocumentLanguage(langSelect.value));

  const themeSelect = createElement('select', { 'aria-label': t('editor.theme') });
  const fillThemes = () => {
    clear(themeSelect);
    getThemes().forEach((th) => {
      const o = createElement('option', { value: th.id, text: (th.label[getLang()] || th.label.fa) });
      if (doc.theme === th.id) o.selected = true;
      themeSelect.appendChild(o);
    });
  };
  fillThemes();
  themeSelect.addEventListener('change', () => {
    doc.theme = themeSelect.value; doc.settings.webPalette=null;
    commitHistory(doc); queueSave(doc);
    canvasRender();
  });

  const animToggle = createElement('input', { type: 'checkbox' });
  animToggle.checked = true;

  animToggle.addEventListener('change', () => canvasRender());
  const statusBar = createElement('div.ed-status', {}, [
    saveChip,
    createElement('span.st-item', {}, [createElement('span', { text: t('editor.lang') + ': ' }), langSelect]),
    createElement('span.st-item', {}, [createElement('span', { text: t('editor.theme') + ': ' }), themeSelect]),
    createElement('span.st-item', {}, [createElement('label.switch', { style: { fontSize: '.7rem' } }, [animToggle, t('export.blockAnims')])]),
    createElement('span.spacer'),
    blockCount,
    createElement('span.st-item', { style: { opacity: '.75' }, text: formatDateShort(doc.updatedAt || Date.now()) })
  ]);

  const enUI = getLang()==='en';
  const switchButton = (key,label) => createElement('button', { type:'button', 'data-workspace':key, onclick:()=>setWorkspace(key) }, [icon(key==='simple'?'text':'palette'),createElement('span',{text:label})]);
  const simpleTab = switchButton('simple', enUI?'Simple editor':'ویرایش ساده');
  const webTab = switchButton('web', enUI?'Web studio':'استودیوی وب');
  const printTab = createElement('button', { type:'button', 'data-workspace':'print', onclick:()=>{if(flushSave(doc))navigate('/print/'+doc.id)} }, [icon('print'),createElement('span',{text:enUI?'Print studio':'استودیوی چاپ'})]);
  const switcher = createElement('nav.workspace-switch', {'aria-label':enUI?'Workspace':'فضاهای کاری'}, [simpleTab,webTab,printTab,createElement('span.workspace-hint',{text:enUI?'One document · three workspaces':'یک سند · سه فضای کاری'})]);
  const webControls = createElement('div.web-controls', {}, [
    createElement('span',{text:enUI?'Design':'طراحی صفحه'}),
    createElement('button.btn.btn-sm.random-design', {type:'button','aria-label':enUI?'Generate random design':'ساخت ظاهر تصادفی', onclick:()=>{applyAppearance(doc,randomAppearance(doc));commitHistory(doc);queueSave(doc);fillThemes();canvasRender();layersRender();propsRender();toast(enUI?'New design applied — Undo to revert.':'ظاهر تازه اعمال شد؛ با واگرد بازگردید.','ok');}}, [icon('random'),enUI?'Surprise me':'ظاهر تصادفی']),
    createElement('button.btn.btn-sm', {onclick:()=>openWebSettings()}, enUI?'Layout & colors':'چیدمان و رنگ‌ها'),
    createElement('button.btn.btn-sm', {onclick:()=>openDocSettings()}, enUI?'Background & animation':'پس‌زمینه و انیمیشن'),
    createElement('button.btn.btn-sm', {onclick:()=>openPresets()}, enUI?'Presets':'پریست‌ها'),
    createElement('button.btn.btn-sm', {onclick:()=>openResponsivePreview(doc)}, enUI?'Responsive preview':'پیش‌نمایش واکنش‌گرا')
  ]);
  const freeToggle=createElement('button.btn.btn-sm.free-toggle',{type:'button','aria-label':enUI?'Toggle free layout':'چیدمان آزاد',onclick:()=>toggleFreeLayout()},enUI?'Free layout':'چیدمان آزاد');
  const snapToggle=createElement('button.btn.btn-sm.snap-toggle',{type:'button','aria-label':enUI?'Toggle snapping':'اسنپ',onclick:()=>{doc.settings.snapEnabled=doc.settings.snapEnabled===false;commitHistory(doc);queueSave(doc);syncLayoutButtons();}},enUI?'Snap':'اسنپ');
  const arrangeSelect=createElement('select.select.smart-arrange',{'aria-label':enUI?'Smart arrangement':'مرتب‌سازی هوشمند',title:enUI?'After moving or resizing':'پس از جابه‌جایی یا تغییر اندازه'});
  [['push',enUI?'Avoid overlaps':'رفع هم‌پوشانی'],['reflow',enUI?'Arrange all':'مرتب‌سازی همه'],['off',enUI?'Manual':'دستی']].forEach(([value,text])=>arrangeSelect.appendChild(createElement('option',{value,text})));
  arrangeSelect.value=doc.settings.smartArrange||'push';arrangeSelect.addEventListener('change',()=>{doc.settings.smartArrange=arrangeSelect.value;commitHistory(doc);queueSave(doc);});
  const rulerToggle=createElement('button.tool-toggle',{type:'button','aria-label':enUI?'Toggle rulers':'نمایش خط‌کش',title:enUI?'Rulers':'خط‌کش','aria-pressed':String(!!getSettings().uiRulers)},enUI?'Rulers':'خط‌کش');
  const gridToggle=createElement('button.tool-toggle',{type:'button','aria-label':enUI?'Toggle grid':'نمایش گرید',title:enUI?'Grid':'گرید','aria-pressed':String(!!getSettings().uiGrid)},enUI?'Grid':'گرید');
  rulerToggle.addEventListener('click',()=>{const value=!getSettings().uiRulers;saveSettings({uiRulers:value});rulerToggle.setAttribute('aria-pressed',String(value));updateRulers();});
  gridToggle.addEventListener('click',()=>{const value=!getSettings().uiGrid;saveSettings({uiGrid:value});gridToggle.setAttribute('aria-pressed',String(value));updateGrid();});
  switcher.append(freeToggle,snapToggle,arrangeSelect,rulerToggle,gridToggle);
  function syncLayoutButtons(){freeToggle.setAttribute('aria-pressed',String(!!doc.settings.freeLayout));snapToggle.setAttribute('aria-pressed',String(doc.settings.snapEnabled!==false));snapToggle.hidden=!doc.settings.freeLayout;arrangeSelect.hidden=!doc.settings.freeLayout;arrangeSelect.value=doc.settings.smartArrange||'push';freeToggle.classList.toggle('active',!!doc.settings.freeLayout);snapToggle.classList.toggle('active',doc.settings.snapEnabled!==false);}
  function toggleFreeLayout(){
    if(!doc.settings.freeLayout){const page=shell.querySelector('.doc-page');if(page){const base=page.getBoundingClientRect(),w=page.clientWidth||base.width;page.querySelectorAll(':scope > .b').forEach(el=>{const block=doc.blocks.find(b=>b.id===el.dataset.id);if(!block)return;if(Number.isFinite(block.style.freeX)&&Number.isFinite(block.style.freeY))return;const rect=el.getBoundingClientRect();block.style.freeX=Math.max(0,Math.min(95,Math.round((rect.left-base.left)/w*1000)/10));block.style.freeY=Math.max(0,Math.round(rect.top-base.top));block.style.blockWidth=Math.max(5,Math.min(100,Math.round(rect.width/w*1000)/10));});}}
    doc.settings.freeLayout=!doc.settings.freeLayout;commitHistory(doc);queueSave(doc);syncLayoutButtons();canvasRender();propsRender();toast(enUI?(doc.settings.freeLayout?'Free layout enabled: use the move handle.':'Flow layout enabled.'):(doc.settings.freeLayout?'چیدمان آزاد فعال شد؛ برای جابه‌جایی از دستگیره استفاده کنید.':'چیدمان عادی فعال شد.'));
  }
  const editor = createElement('div.editor', { 'data-workspace':'simple' }, [
    topBar,
    createElement('div.workspace-nav-container',{},[switcher,webControls]),
    createElement('div.ed-body', {}, [leftPanel, canvas, rightPanel]),
    statusBar
  ]);
  clear(root);
  root.append(editor, zoomPill, viewportBar, backdrop);
  /* Rulers and the grid are screen-only and never serialized into a document. */
  const rulerH=createElement('canvas.work-ruler.ruler-h',{'aria-hidden':'true'}),rulerV=createElement('canvas.work-ruler.ruler-v',{'aria-hidden':'true'});root.append(rulerH,rulerV);
  let rulerFrame=0;
  function updateGrid(){const old=shell.querySelector('.work-grid');old?.remove();if(getSettings().uiGrid)shell.appendChild(createElement('div.work-grid',{'aria-hidden':'true'}));}
  function updateRulers(){cancelAnimationFrame(rulerFrame);rulerFrame=requestAnimationFrame(()=>{const on=!!getSettings().uiRulers;rulerH.hidden=rulerV.hidden=!on;if(!on)return;const a=canvas.getBoundingClientRect(),page=shell.querySelector('.doc-page');if(!page)return;const p=page.getBoundingClientRect();
    function draw(el,horizontal){const w=Math.max(1,Math.round(horizontal?a.width:22)),h=Math.max(1,Math.round(horizontal?22:a.height));el.style.left=(horizontal?a.left:a.left)+'px';el.style.top=(horizontal?a.top:a.top)+'px';el.style.width=w+'px';el.style.height=h+'px';const ratio=devicePixelRatio||1;el.width=Math.round(w*ratio);el.height=Math.round(h*ratio);const c=el.getContext('2d');c.scale(ratio,ratio);c.fillStyle='#263448';c.fillRect(0,0,w,h);c.strokeStyle='#a8bbd2';c.fillStyle='#eef4ff';c.font='9px sans-serif';const origin=horizontal?p.left-a.left:p.top-a.top,len=horizontal?w:h;const start=Math.floor((0-origin)/10)*10;for(let n=start;n<=len-origin;n+=10){if(n<0)continue;let x=origin+n;const major=n%50===0;c.beginPath();if(horizontal){c.moveTo(x,22);c.lineTo(x,major?9:16);if(major)c.fillText(String(n),x+2,8);}else{c.moveTo(22,x);c.lineTo(major?9:16,x);if(major){c.save();c.translate(8,x+2);c.rotate(Math.PI/2);c.fillText(String(n),0,0);c.restore();}}c.stroke();}}
    draw(rulerH,true);draw(rulerV,false);
  });}
  const rulerObserver=new ResizeObserver(updateRulers);rulerObserver.observe(canvas);rulerObserver.observe(shell);canvas.addEventListener('scroll',updateRulers,{passive:true});window.addEventListener('resize',updateRulers);disposers.push(()=>{cancelAnimationFrame(rulerFrame);rulerObserver.disconnect();canvas.removeEventListener('scroll',updateRulers);window.removeEventListener('resize',updateRulers);rulerH.remove();rulerV.remove();});
  /* Screen-space controls do not enter document exports. */
  const handles={};for(const edge of ['n','e','s','w','move']){
    const label=edge==='move'?(enUI?'Move selected block':'جابجایی المان انتخاب‌شده'):(enUI?'Resize '+edge+' edge':'تغییر اندازه از لبه '+({n:'بالا',e:'راست',s:'پایین',w:'چپ'}[edge]));
    handles[edge]=createElement('button.resize-handle.edge-'+edge,{type:'button',hidden:true,'aria-label':label,title:label,'data-edge':edge},edge==='move'?'✥':edge==='n'||edge==='s'?'↕':'↔');root.appendChild(handles[edge]);
  }
  const guideV=createElement('div.snap-guide.snap-v',{hidden:true}),guideH=createElement('div.snap-guide.snap-h',{hidden:true});root.append(guideV,guideH);
  let dragResize=null,freePageController=null;
  function resizeTarget(){return selectedId ? shell.querySelector('.b[data-id="'+CSS.escape(selectedId)+'"]') : null;}
  function hideGuides(){guideV.hidden=true;guideH.hidden=true;}
  function positionBlockOrderStacks(area){shell.querySelectorAll('.doc-page > .b').forEach(block=>{const stack=block.querySelector(':scope > .block-reorder-stack');if(!stack)return;const left=block.getBoundingClientRect().left;let offset=left-70>=area.left+4?-70:left-36>=area.left+4?-36:4;stack.style.left=offset+'px';});}
  function positionResizeHandle(){
    const el=resizeTarget(),area=canvas.getBoundingClientRect();positionBlockOrderStacks(area);if(!resizeVisible||!el){Object.values(handles).forEach(h=>h.hidden=true);return;}
    const b=el.getBoundingClientRect(),mobile=innerWidth<=900||b.left-area.left<74,points={n:[b.left+b.width/2,Math.max(area.top+15,b.top-16)],e:[mobile?b.right-16:Math.min(area.right-15,b.right+16),b.top+b.height/2],s:[b.left+b.width/2,Math.min(area.bottom-15,b.bottom+16)],w:[mobile?b.left+(b.left-area.left<40?52:16):Math.max(area.left+15,b.left-16),b.top+b.height/2],move:[b.left+18,Math.max(area.top+15,b.top-18)]};
    for(const [edge,h] of Object.entries(handles)){const [x,y]=points[edge];const edgeOnscreen=edge==='n'?b.top>=area.top-15:edge==='s'?b.bottom<=area.bottom+15:edge==='move'?b.top>=area.top-15:true;const visible=edgeOnscreen&&(edge!=='move'||doc.settings.freeLayout)&&x>=area.left+4&&x<=area.right-4&&y>=area.top+4&&y<=area.bottom-4;if(!visible){if(!dragResize||dragResize.edge!==edge)h.hidden=true;continue;}h.hidden=false;h.style.left=(x-15)+'px';h.style.top=(y-15)+'px';}
  }
  const resizeObserver=new ResizeObserver(()=>positionResizeHandle());resizeObserver.observe(shell);
  canvas.addEventListener('scroll',positionResizeHandle,{passive:true});window.addEventListener('resize',positionResizeHandle);
  disposers.push(()=>{resizeObserver.disconnect();canvas.removeEventListener('scroll',positionResizeHandle);window.removeEventListener('resize',positionResizeHandle);Object.values(handles).forEach(h=>h.remove());guideV.remove();guideH.remove();freePageController?.destroy();});
  function liveGeometry(block,el,width,height,x,y,flowX,flowShift){
    delete block.style.logoFitWidthPx;block.style.blockWidth=Math.max(doc.settings.freeLayout?5:20,Math.min(100,Math.round(width*10)/10));block.style.minHeight=Math.max(0,Math.min(2000,Math.round(height)));delete block.style.blockHeight;
    el.style.width=block.style.blockWidth+'%';el.style.maxWidth='100%';el.style.minHeight=block.style.minHeight+'px';el.style.removeProperty('height');el.style.removeProperty('overflow');
    if(doc.settings.freeLayout){block.style.freeX=Math.max(0,Math.min(100-block.style.blockWidth,Math.round(x*10)/10));block.style.freeY=Math.max(0,Math.min(50000,Math.round(y)));el.style.setProperty('--free-x',block.style.freeX+'%');el.style.setProperty('--free-y',block.style.freeY+'px');el.style.setProperty('--free-w',block.style.blockWidth+'%');}
    else if(Number.isFinite(flowX)){block.style.flowOffset=Math.max(0,Math.min(100-block.style.blockWidth,Math.round(flowX*10)/10));el.style.marginLeft=block.style.flowOffset+'%';el.style.marginRight='auto';if(Number.isFinite(flowShift)){block.style.flowShiftY=Math.max(-2000,Math.min(2000,Math.round(flowShift)));el.style.top=block.style.flowShiftY+'px';el.style.marginBottom='calc(16px + '+block.style.flowShiftY+'px)';}}
    freePageController?.update();positionResizeHandle();
  }
  function snapPosition(d,left,top){
    hideGuides();if(doc.settings.snapEnabled===false)return [left,top];const page=shell.querySelector('.doc-page'),pr=page.getBoundingClientRect();let bestX=7,bestY=7,adjustX=0,adjustY=0,xGuide=null,yGuide=null;
    const mineX=[left,left+d.box.width/2,left+d.box.width],mineY=[top,top+d.box.height/2,top+d.box.height];
    page.querySelectorAll(':scope > .b').forEach(other=>{if(other===d.el)return;const r=other.getBoundingClientRect();[r.left,r.left+r.width/2,r.right].forEach(v=>mineX.forEach(m=>{const delta=v-m;if(Math.abs(delta)<bestX){bestX=Math.abs(delta);adjustX=delta;xGuide=v}}));[r.top,r.top+r.height/2,r.bottom].forEach(v=>mineY.forEach(m=>{const delta=v-m;if(Math.abs(delta)<bestY){bestY=Math.abs(delta);adjustY=delta;yGuide=v}}));});
    const area=canvas.getBoundingClientRect();if(xGuide!==null){guideV.hidden=false;guideV.style.left=xGuide+'px';guideV.style.top=area.top+'px';guideV.style.height=area.height+'px';}if(yGuide!==null){guideH.hidden=false;guideH.style.top=yGuide+'px';guideH.style.left=area.left+'px';guideH.style.width=area.width+'px';}
    return [left+adjustX,top+adjustY];
  }
  function finishResize(cancel){if(!dragResize)return;const d=dragResize;dragResize=null;handles[d.edge].classList.remove('dragging');hideGuides();if(cancel)d.block.style=JSON.parse(d.old);else{if(d.moved && doc.settings.freeLayout)arrangeFree(doc,shell.querySelector('.doc-page'),d.id,doc.settings.smartArrange||'push');commitHistory(doc);}queueSave(doc);canvasRender();propsRender();updateHistoryButtons();positionResizeHandle();}
  for(const [edge,h] of Object.entries(handles)){
    h.addEventListener('pointerdown',e=>{const block=doc.blocks.find(b=>b.id===selectedId),el=resizeTarget(),page=shell.querySelector('.doc-page');if(!block||!el||!page||e.button!==0)return;e.preventDefault();e.stopPropagation();const box=el.getBoundingClientRect(),pr=page.getBoundingClientRect(),ref=doc.settings.freeLayout?(page.clientWidth||pr.width):(box.width/((Number(block.style.blockWidth)||100)/100));
      const pageStyle=getComputedStyle(page),contentLeft=pr.left+parseFloat(pageStyle.paddingLeft||0),flowX=Math.max(0,Math.min(100,((box.left-contentLeft)/ref)*100));
      const minBefore=el.style.minHeight;el.style.minHeight='0px';const natural=el.getBoundingClientRect().height;el.style.minHeight=minBefore;
      dragResize={edge,id:block.id,block,el,box,ref,x:e.clientX,y:e.clientY,width:parseFloat(block.style.blockWidth??100),height:box.height,natural,flowX,flowShift:Number(block.style.flowShiftY)||0,freeX:Number(block.style.freeX)||0,freeY:Number(block.style.freeY)||0,old:JSON.stringify(block.style),moved:false};h.setPointerCapture(e.pointerId);h.classList.add('dragging');});
    h.addEventListener('pointermove',e=>{if(!dragResize||dragResize.edge!==edge)return;const d=dragResize,dx=e.clientX-d.x,dy=e.clientY-d.y;let width=d.width,height=d.height,x=d.freeX,y=d.freeY,flowX=d.flowX,flowShift=d.flowShift;if(Math.abs(dx)+Math.abs(dy)>1)d.moved=true;
      if(edge==='move'){const pos=snapPosition(d,d.box.left+dx,d.box.top+dy);x=d.freeX+(pos[0]-d.box.left)/d.ref*100;y=d.freeY+(pos[1]-d.box.top);}
      if(edge==='e')width=Math.max(doc.settings.freeLayout?5:20,Math.min(doc.settings.freeLayout?100-d.freeX:100-d.flowX,d.width+dx/d.ref*100));if(edge==='w'){width=Math.max(doc.settings.freeLayout?5:20,Math.min(doc.settings.freeLayout?d.width+d.freeX:d.width+d.flowX,d.width-dx/d.ref*100));if(doc.settings.freeLayout)x=d.freeX+d.width-width;else flowX=d.flowX+d.width-width;}
      if(edge==='s')height+=dy;if(edge==='n'){const lower=Math.max(d.height-2000,doc.settings.freeLayout?-d.freeY:-2000-d.flowShift);const allowed=Math.max(lower,Math.min(dy,Math.max(0,d.height-d.natural)));height-=allowed;if(doc.settings.freeLayout)y+=allowed;else flowShift+=allowed;}
      liveGeometry(d.block,d.el,width,height,x,y,flowX,flowShift);
    });
    h.addEventListener('pointerup',()=>finishResize(false));h.addEventListener('pointercancel',()=>finishResize(true));h.addEventListener('lostpointercapture',()=>finishResize(false));
    h.addEventListener('keydown',e=>{if(e.key==='Escape'&&dragResize){e.stopPropagation();finishResize(true);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;const block=doc.blocks.find(b=>b.id===selectedId),el=resizeTarget();if(!block||!el)return;e.preventDefault();e.stopPropagation();const n=e.shiftKey?5:1,dx=e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0,dy=e.key==='ArrowDown'?n*5:e.key==='ArrowUp'?-n*5:0;
      const page=shell.querySelector('.doc-page'),pr=page.getBoundingClientRect(),r=el.getBoundingClientRect(),ref=r.width/((Number(block.style.blockWidth)||100)/100),flowX=Number.isFinite(Number(block.style.flowOffset))?Number(block.style.flowOffset):Math.max(0,(r.left-pr.left-parseFloat(getComputedStyle(page).paddingLeft||0))/ref*100);let fx=flowX,shift=Number(block.style.flowShiftY)||0;let w=Number(block.style.blockWidth)||100,ht=r.height,x=Number(block.style.freeX)||0,y=Number(block.style.freeY)||0;
      if(edge==='move'){x+=dx;y+=dy}else{const minW=doc.settings.freeLayout?5:20;if(edge==='e')w=Math.max(minW,Math.min(100-(doc.settings.freeLayout?x:fx),w+dx));if(edge==='w'){const oldW=w;w=Math.max(minW,Math.min(w+(doc.settings.freeLayout?x:fx),w-dx));if(doc.settings.freeLayout)x+=oldW-w;else fx+=oldW-w;}if(edge==='s')ht+=dy;if(edge==='n'){const oldMin=el.style.minHeight;el.style.minHeight='0px';const natural=el.getBoundingClientRect().height;el.style.minHeight=oldMin;const lower=Math.max(ht-2000,doc.settings.freeLayout?-y:-2000-shift);const amount=Math.max(lower,Math.min(dy,Math.max(0,ht-natural)));ht-=amount;if(doc.settings.freeLayout)y+=amount;else shift+=amount;}}
      liveGeometry(block,el,w,ht,x,y,fx,shift);if(doc.settings.freeLayout)arrangeFree(doc,page,block.id,doc.settings.smartArrange||'push');commitHistory(doc);queueSave(doc);canvasRender();propsRender();updateHistoryButtons();h.focus({preventScroll:true});});
  }
  const contextState = { id:null, expanded:false, row:null, col:0, part:null, path:null, iconIndex:null, instance:null, quick:null }; 
  let workspaceReady=false;
  function setWorkspace(next) {
    workspace=next === 'web' ? 'web' : 'simple';
    editor.dataset.workspace=workspace;
    document.body.classList.toggle('workspace-simple',workspace==='simple');
    document.body.classList.toggle('workspace-web',workspace==='web');
    simpleTab.classList.toggle('active',workspace==='simple'); webTab.classList.toggle('active',workspace==='web');
    simpleTab.setAttribute('aria-current',workspace==='simple'?'page':'false'); webTab.setAttribute('aria-current',workspace==='web'?'page':'false');
    closeDrawers(); propsRender();
    if(workspaceReady){canvasRender();requestAnimationFrame(fitZoom);}
  }
  setWorkspace('simple'); workspaceReady=true;syncLayoutButtons();

  /* Context inspector is outside the document, so it never enters print/export. */
  const contextMenu = createElement('div.context-popover', {role:'region', 'aria-label':enUI?'Element tools':'ابزارهای المان', hidden:true, dir:enUI?'ltr':'rtl'});
  root.appendChild(contextMenu);
  const getContextBlock = () => doc.blocks.find(b=>b.id===contextState.id);
  const getContextElement = () => Array.from(shell.querySelectorAll('.b[data-id]')).find(el=>el.dataset.id===contextState.id);
  function closeContext(){ contextState.id=null;contextMenu.hidden=true;contextMenu.replaceChildren();shell.querySelectorAll('.context-cell-selected').forEach(x=>x.classList.remove('context-cell-selected')); }
  function contextCell(e,block){
    if(block.type!=='table')return null;
    const cell=e.target.closest('td,th'); if(!cell || !e.currentTarget.contains(cell))return null;
    const row=cell.parentElement,section=row.parentElement.tagName; return {col:cell.cellIndex,row:section==='TBODY'?row.sectionRowIndex:section==='TFOOT'?'footer':null};
  }
  function markContextCell(){
    shell.querySelectorAll('.context-cell-selected').forEach(x=>x.classList.remove('context-cell-selected'));
    const el=getContextElement(), block=getContextBlock(); if(!el||block?.type!=='table')return;
    const rows=el.querySelectorAll('tbody tr');
    const selected=contextState.row===null ? el.querySelector('thead tr') : contextState.row==='footer'?el.querySelector('tfoot tr'):rows[contextState.row];
    selected?.cells[contextState.col]?.classList.add('context-cell-selected');
  }
  function positionContext(){
    if(contextMenu.hidden||!contextState.id)return;
    const target=getContextElement(); if(!target){closeContext();return;}
    const r=target.getBoundingClientRect(), viewport=canvas.getBoundingClientRect();
    if(r.bottom<viewport.top||r.top>viewport.bottom){contextMenu.style.visibility='hidden';return;}
    contextMenu.style.visibility='visible';
    if(contextState.expanded){const available=Math.max(innerWidth-r.right-16,r.left-16);contextMenu.style.width=available>=230?Math.min(325,available)+'px':'';}else contextMenu.style.width='';
    const w=contextMenu.offsetWidth, h=contextMenu.offsetHeight, visibleTop=Math.max(8,viewport.top),visibleBottom=Math.min(innerHeight-8,viewport.bottom);
    if(innerWidth<=900){const left=Math.max(viewport.left+4,Math.min(viewport.right-w-4,viewport.left+(viewport.width-w)/2));const bottom=Math.max(visibleTop,visibleBottom-h-8),top=r.bottom>bottom-40?visibleTop+4:bottom;contextMenu.style.left=Math.round(left)+'px';contextMenu.style.top=Math.round(top)+'px';return;}
    const canPlaceRight=r.right+w+40<=innerWidth-8;
    const canPlaceLeft=r.left-w-105>=8;
    const beside=canPlaceRight||canPlaceLeft;
    const left=canPlaceRight?r.right+40:canPlaceLeft?r.left-w-105:Math.max(8,Math.min(innerWidth-w-8,r.right-w));
    let top=beside?r.top:r.top-h-8;
    if(top<visibleTop) top=Math.min(Math.max(r.top+8,visibleTop),Math.max(visibleTop,visibleBottom-h));
    top=Math.min(top,Math.max(visibleTop,visibleBottom-h));
    contextMenu.style.left=Math.round(left)+'px';contextMenu.style.top=Math.round(top)+'px';
  }
  function openContext(id,cell,changed){
    const block=doc.blocks.find(b=>b.id===id); if(!block)return;
    if(contextState.id!==id||changed){contextState.expanded=false;contextState.row=null;contextState.col=0;contextState.part=null;contextState.path=null;contextState.iconIndex=null;contextState.instance=null;contextState.quick=null;}
    contextState.id=id;
    if(cell){contextState.row=cell.row;contextState.col=cell.col;}
    contextMenu.hidden=false;refreshContext();
  }
  function refreshContext(){
    const block=getContextBlock(); if(!block){closeContext();return;}
    const focusAction=contextMenu.contains(document.activeElement) ? document.activeElement?.dataset?.action : null;
    const isTable=block.type==='table', count=doc.blocks.length, index=doc.blocks.findIndex(b=>b.id===block.id);
    if(isTable){contextState.col=Math.max(0,Math.min(contextState.col,(block.data.headers?.length||1)-1));if(typeof contextState.row==='number' && contextState.row>=block.data.rows.length)contextState.row=block.data.rows.length?block.data.rows.length-1:null;}
    const tr=(fa,en)=>enUI?en:fa;
    contextMenu.classList.toggle('is-compact',!contextState.expanded);
    const quickIcon=(name,label,action,fn)=>createElement('button.ctx-icon',{type:'button',title:label,'aria-label':label,'data-action':action,onclick:fn},icon(name));
    function quickTools(){
      const bar=createElement('div.ctx-quick-row',{},[
        quickIcon('align',tr('تراز سریع','Quick alignment'),'quick-align',()=>{contextState.quick=contextState.quick==='align'?null:'align';refreshContext();}),
        quickIcon('move',tr('تغییر موقعیت','Change position'),'quick-position',()=>{contextState.quick=contextState.quick==='position'?null:'position';refreshContext();}),
        quickIcon('layers',tr('ترتیب لایه','Layer order'),'quick-stack',()=>{contextState.quick=contextState.quick==='stack'?null:'stack';refreshContext();})
      ]);
      bar.querySelector('[data-action=quick-align]').setAttribute('aria-expanded',String(contextState.quick==='align'));
      bar.querySelector('[data-action=quick-stack]').setAttribute('aria-expanded',String(contextState.quick==='stack'));
      bar.querySelector('[data-action=quick-position]').setAttribute('aria-expanded',String(contextState.quick==='position'));
      return bar;
    }
    function quickPanel(){
      if(!contextState.quick)return null;
      const content=contextState.quick==='align'?[
        createElement('span',{text:tr('تراز المان','Align block')}),
        ...[['left',tr('تراز به چپ','Align left')],['center',tr('تراز به مرکز','Align center')],['right',tr('تراز به راست','Align right')]].map(([side,label])=>quickIcon(side,label,'align-'+side,()=>alignBlock(block,side)))
      ]:contextState.quick==='stack'?[createElement('span',{text:tr('ترتیب لایه','Layer order')}),...[[tr('روی همه','Front'),'front'],[tr('یک لایه جلو','Forward'),'forward'],[tr('یک لایه عقب','Backward'),'back'],[tr('زیر همه','Back'),'bottom']].map(([label,action])=>createElement('button.ctx-mini',{type:'button','data-stack':action,onclick:()=>changeStack(block.id,action)},label))]:[
        createElement('span',{text:tr('موقعیت المان','Block position')}),
        ...[['arrowleft',tr('حرکت به چپ','Move left'),-1,0],['up',tr('حرکت به بالا','Move up'),0,-1],['down',tr('حرکت به پایین','Move down'),0,1],['arrowright',tr('حرکت به راست','Move right'),1,0]].map(([ic,label,x,y])=>quickIcon(ic,label,'nudge-'+ic,()=>nudgeBlock(block,x,y)))
      ];
      return createElement('div.ctx-quick-panel',{'aria-label':contextState.quick==='align'?tr('تراز سریع','Quick alignment'):tr('موقعیت سریع','Quick position')},content);
    }
    if(!contextState.expanded){
      const trigger=createElement('button.ctx-trigger',{type:'button','data-action':'settings','aria-label':tr('باز کردن ابزار المان','Open element tools'),title:tr('ابزار المان','Element tools'),'aria-expanded':'false',onclick:()=>{contextState.expanded=true;contextState.quick=null;refreshContext();}},[icon(block.type),createElement('span',{text:t(registry.get(block.type)?.labelKey||'block.text')}),icon('down')]);
      contextMenu.replaceChildren(createElement('div.ctx-compact-row',{},[trigger,quickTools()]));const panel=quickPanel();if(panel)contextMenu.appendChild(panel);markContextCell();requestAnimationFrame(()=>{positionContext();if(focusAction)contextMenu.querySelector('[data-action="'+focusAction+'"]')?.focus({preventScroll:true});});return;
    }
    const tool=(name,label,fn,disabled=false,action='')=>createElement('button.ctx-icon',{type:'button',title:label,'aria-label':label,disabled, ...(action?{'data-action':action}:{}),onclick:fn},icon(name));
    const title=createElement('span.ctx-title',{text:t(registry.get(block.type)?.labelKey||'block.text')});
    const toggle=tool('settings',tr('تنظیمات سریع','Quick settings'),()=>{contextState.expanded=!contextState.expanded;refreshContext();},false,'settings');
    toggle.setAttribute('aria-expanded',String(contextState.expanded));
    const header=createElement('div.ctx-toolbar',{},[
      icon(block.type),title, toggle,
      tool('up',tr('جابجایی المان به بالا','Move block up'),()=>{moveBlock(block.id,-1);},index===0,'block-up'),
      tool('down',tr('جابجایی المان به پایین','Move block down'),()=>{moveBlock(block.id,1);},index===count-1,'block-down'),
      tool('copy',tr('تکثیر المان','Duplicate block'),()=>{duplicateBlock(block.id);openContext(selectedId,null,true);},false,'block-duplicate'),
      tool('trash',tr('حذف المان','Delete block'),async()=>{if(await confirmDialog(tr('این المان حذف شود؟','Delete this block?'),{danger:true,ok:tr('حذف','Delete')})){closeContext();removeBlock(block.id);}},false,'block-delete'),
      tool('close',tr('بستن','Close'),closeContext,false,'close')
    ]);
    contextMenu.replaceChildren(header,quickTools());const qp=quickPanel();if(qp)contextMenu.appendChild(qp);
    const stackBar=createElement('div.ctx-stack',{'aria-label':tr('ترتیب لایه‌ها','Layer order')},[
      createElement('span',{text:tr('ترتیب لایه','Layer order')}),
      ...[[tr('روی همه','Front'),'front'],[tr('یک لایه جلو','Forward'),'forward'],[tr('یک لایه عقب','Backward'),'back'],[tr('زیر همه','Back'),'bottom']].map(([label,action])=>createElement('button.ctx-mini',{type:'button','data-stack':action,onclick:()=>changeStack(block.id,action)},label))
    ]);contextMenu.appendChild(stackBar);
    if(contextState.expanded){
      const body=createElement('div.ctx-body');
      const labelRange=(label,current,onInput,onChange,aria)=>{
        const out=createElement('output',{text:current+'%'}), slider=createElement('input',{type:'range',min:'0',max:'100',step:'1',value:String(current),'aria-label':aria});
        slider.addEventListener('input',()=>{out.textContent=slider.value+'%';onInput(Number(slider.value));});
        slider.addEventListener('change',()=>onChange(Number(slider.value)));
        return createElement('label.ctx-range',{},[createElement('span',{text:label}),slider,out]);
      };
      const applyStyle=()=>{
        const el=getContextElement();if(!el)return;
        const css=styleToCss(block.style);
        el.style.setProperty('--block-opacity',css['--block-opacity']??'1');
        el.style.setProperty('--block-text-opacity',css['--block-text-opacity']??'1');
        el.style.setProperty('--block-graphics-opacity',css['--block-graphics-opacity']??'1');
        applyPartOpacity(el,block);
        applyTextInk(el,Number(block.style.textOpacity ?? 100)<100 || hasFadedTextParts(block.style));
        if(block.style.borderRadius!=='' && block.style.borderRadius!=null){el.style.borderRadius=Number(block.style.borderRadius)+'px';el.dataset.customRadius='true';} else{el.style.removeProperty('border-radius');delete el.dataset.customRadius;}
        if(block.style.blockWidth!=null){el.style.width=Number(block.style.blockWidth)+'%';el.style.maxWidth='100%';if(doc.settings.freeLayout)el.style.setProperty('--free-w',Math.min(100-(Number(block.style.freeX)||0),Number(block.style.blockWidth))+'%');}else{el.style.removeProperty('width');el.style.removeProperty('max-width');}
        if(Number(block.style.minHeight)>0)el.style.minHeight=Number(block.style.minHeight)+'px';else el.style.removeProperty('min-height');
        if(Number(block.style.blockHeight)>0)el.style.minHeight=Math.max(Number(block.style.minHeight)||0,Number(block.style.blockHeight))+'px';el.style.removeProperty('height');el.style.removeProperty('overflow');
        const custom=!!(block.style.bgColor||block.style.bgGradient||block.style.bgImage);
        if(custom){if(block.type==='hero')el.style.removeProperty('background');else if(css.background)el.style.background=css.background;else el.style.removeProperty('background');if(css['--block-bg-override'])el.style.setProperty('--block-bg-override',css['--block-bg-override']);else el.style.removeProperty('--block-bg-override');if(css['--block-bg-image']){el.style.setProperty('--block-bg-image',css['--block-bg-image']);if(block.type!=='hero')el.style.backgroundImage=css['--block-bg-image'];}else{el.style.removeProperty('--block-bg-image');if(!css.background)el.style.removeProperty('background-image');}el.dataset.customBg='true';}
        else{el.style.removeProperty('background');el.style.removeProperty('--block-bg-override');el.style.removeProperty('--block-bg-image');delete el.dataset.customBg;}
        applyBackgroundLayer(el,block);
        queueSave(doc);
      };
      const finishStyle=()=>{commitHistory(doc);queueSave(doc);propsRender();};
      body.appendChild(labelRange(tr('نمایش المان','Element opacity'),block.style.opacity??100,v=>{block.style.opacity=v;applyStyle();},finishStyle,tr('میزان نمایش المان','Element opacity')));
      body.appendChild(labelRange(tr('نمایش متن','Text opacity'),block.style.textOpacity??100,v=>{block.style.textOpacity=v;applyStyle();},finishStyle,tr('میزان نمایش متن','Text opacity')));
      body.appendChild(labelRange(tr('نمایش تصویر/نمودار','Media opacity'),block.style.graphicsOpacity??100,v=>{block.style.graphicsOpacity=v;applyStyle();},finishStyle,tr('میزان نمایش تصویر و نمودار','Media opacity')));
      const currentColor=/^#[0-9a-f]{6}$/i.test(block.style.bgColor||'')?block.style.bgColor:'#5b82dd';
      const color=createElement('input',{type:'color',value:currentColor,'aria-label':tr('رنگ پس‌زمینه المان','Element background color')});
      color.addEventListener('input',()=>{block.style.bgColor=color.value;block.style.bgGradient=null;block.style.bgImage='';applyStyle();});
      color.addEventListener('change',()=>{block.style.bgColor=color.value;block.style.bgGradient=null;block.style.bgImage='';applyStyle();finishStyle();refreshContext();});
      const bgToggle=createElement('button.ctx-plain',{type:'button','data-action':'background-toggle',onclick:()=>{block.style.bgColor=block.style.bgColor?'':color.value;block.style.bgGradient=null;block.style.bgImage='';applyStyle();finishStyle();refreshContext();}},block.style.bgColor?tr('بازنشانی','Reset'):tr('اعمال رنگ','Apply'));
      body.appendChild(createElement('div.ctx-color',{},[createElement('span',{text:tr('رنگ پس‌زمینه','Background')}),color,bgToggle]));
      const bgRange=labelRange(tr('نمایش پس‌زمینه','Background opacity'),block.style.bgOpacity??100,v=>{block.style.bgOpacity=v;applyStyle();},finishStyle,tr('میزان نمایش پس‌زمینه','Background opacity'));
      if(!block.style.bgColor&&!block.style.bgGradient){bgRange.querySelector('input').disabled=true;bgRange.title=tr('ابتدا رنگ پس‌زمینه را اعمال کنید','Apply a background color first');}
      body.appendChild(bgRange);
      const parts=partSpecs(block.type,getContextElement());
      parts.forEach(([key,fa,en])=>body.appendChild(labelRange(tr(fa,en),block.style.partOpacity?.[key]??100,v=>{block.style.partOpacity ||= {};block.style.partOpacity[key]=v;applyStyle();},finishStyle,tr('نمایش '+fa,en+' opacity'))));
      if(isTable){const cellKey=contextState.row===null?'h:'+contextState.col:contextState.row==='footer'?'f:'+contextState.col:'r:'+contextState.row+':'+contextState.col;body.appendChild(labelRange(tr('متن خانه انتخابی','Selected cell text'),block.style.cellOpacity?.[cellKey]??100,v=>{block.style.cellOpacity ||= {};block.style.cellOpacity[cellKey]=v;applyStyle();},finishStyle,tr('نمایش متن خانه انتخابی','Selected cell text opacity')));}
      body.appendChild(createElement('div.ctx-section-title',{text:tr('اندازه و گوشه‌ها','Size & corners')}));
      const numericRange=(label,value,max,unit,cb,min=0)=>{
        const output=createElement('output',{text:value+unit}),input=createElement('input',{type:'range',min:String(min),max:String(max),value:String(value),'aria-label':label});
        input.addEventListener('input',()=>{output.textContent=input.value+unit;cb(Number(input.value));applyStyle();});input.addEventListener('change',finishStyle);
        return createElement('label.ctx-range',{},[createElement('span',{text:label}),input,output]);
      };
      body.appendChild(numericRange(tr('گردی گوشه‌ها','Corner radius'),block.style.borderRadius===''||block.style.borderRadius==null?(parseInt(getComputedStyle(getContextElement()).borderTopLeftRadius)||0):(parseInt(block.style.borderRadius)||0),60,'px',v=>{block.style.borderRadius=v;}));
      body.appendChild(numericRange(tr('عرض المان','Block width'),block.style.blockWidth??100,100,'%',v=>{block.style.blockWidth=Math.max(20,v);},20));
      body.appendChild(numericRange(tr('حداقل ارتفاع','Minimum height'),block.style.minHeight??0,600,'px',v=>{block.style.minHeight=v;}));
      body.appendChild(createElement('p.hint',{text:tr('ارتفاع، حداقل است؛ محتوای بلند بدون پیمایش گسترش می‌یابد.','Height is a minimum; long content expands without scrolling.')}));
      body.appendChild(createElement('button.ctx-plain',{type:'button',onclick:()=>{block.style.borderRadius='';delete block.style.blockWidth;delete block.style.logoFitWidthPx;if(doc.settings.freeLayout)block.style.blockWidth=100-(Number(block.style.freeX)||0);delete block.style.minHeight;delete block.style.blockHeight;applyStyle();finishStyle();refreshContext();}},tr('بازنشانی اندازه و گوشه‌ها','Reset size & corners')));
      if(isTable){
        const d=block.data,c=contextState.col,r=contextState.row,hasRow=r!==null&&r>=0&&r<d.rows.length;
        body.appendChild(createElement('div.ctx-section-title',{text:tr('ساختار جدول','Table structure')}));
        body.appendChild(createElement('p.ctx-cell-info',{text:(hasRow?tr('سطر '+(r+1),'Row '+(r+1)):r==='footer'?tr('پاورقی','Footer'):tr('سرستون / بدون سطر','Header / no row'))+' · '+tr('ستون '+(c+1),'Column '+(c+1))}));
        const act=(label,action,fn,disabled=false)=>createElement('button.ctx-mini',{type:'button','data-action':action,disabled,onclick:fn},label);
        const update=()=>{commitHistory(doc);queueSave(doc);canvasRender();layersRender();propsRender();};
        const rowButtons=createElement('div.ctx-grid',{},[
          act(tr('+ سطر','+ Row'),'row-add',()=>{contextState.row=addTableRow(block,hasRow?r+1:d.rows.length);update();}),
          act(tr('سطر ↑','Row ↑'),'row-up',()=>{if(moveTableRow(block,r,r-1)){contextState.row=r-1;update();}},!hasRow||r===0),
          act(tr('سطر ↓','Row ↓'),'row-down',()=>{if(moveTableRow(block,r,r+1)){contextState.row=r+1;update();}},!hasRow||r===d.rows.length-1),
          act(tr('حذف سطر','Delete row'),'row-delete',async()=>{if(await confirmDialog(tr('سطر انتخاب‌شده حذف شود؟','Delete the selected row?'),{danger:true,ok:tr('حذف','Delete')})){if(deleteTableRow(block,r)){contextState.row=d.rows.length?Math.min(r,d.rows.length-1):null;update();}}},!hasRow)
        ]);
        const colButtons=createElement('div.ctx-grid',{},[
          act(tr('+ ستون قبل','+ Before'),'column-before',()=>{contextState.col=insertTableColumn(doc,block,c);update();}),
          act(tr('+ ستون بعد','+ After'),'column-after',()=>{contextState.col=insertTableColumn(doc,block,c+1);update();}),
          act(tr('ستون قبل','Column earlier'),'column-up',()=>{if(moveTableColumn(doc,block,c,c-1)){contextState.col=c-1;update();}},c===0),
          act(tr('ستون بعد','Column later'),'column-down',()=>{if(moveTableColumn(doc,block,c,c+1)){contextState.col=c+1;update();}},c>=d.headers.length-1),
          act(tr('حذف ستون','Delete column'),'column-delete',async()=>{if(await confirmDialog(tr('ستون و داده‌های آن حذف می‌شود؛ پیوند نمودارهای مرتبط نیز تنظیم می‌شود. ادامه می‌دهید؟','Delete this column and its data? Linked charts will be adjusted.'),{danger:true,ok:tr('حذف','Delete')})){if(deleteTableColumn(doc,block,c)){contextState.col=Math.min(c,d.headers.length-1);update();}}},d.headers.length<=1)
        ]);
        body.append(rowButtons,colButtons);
      }
      contextMenu.appendChild(body);
    }
    markContextCell(); requestAnimationFrame(()=>{positionContext(); if(focusAction) contextMenu.querySelector('[data-action="'+focusAction+'"]:not(:disabled)')?.focus({preventScroll:true});});
  }
  canvas.addEventListener('scroll',positionContext,{passive:true});
  window.addEventListener('resize',positionContext);
  canvas.addEventListener('click',e=>{if(!e.target.closest('.b'))closeContext();});
  contextMenu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeContext();}});
  disposers.push(()=>{canvas.removeEventListener('scroll',positionContext);window.removeEventListener('resize',positionContext);});


  /* ---------- helpers ---------- */
  function markChange({ commit = false, silent = false } = {}) {
    if (commit) commitHistory(doc);
    queueSave(doc);
    updateHistoryButtons();
    if (!silent) updateStatus();
  }
  function updateHistoryButtons() {
    const st = historyState(doc.id);
    undoBtn.disabled = !st.canUndo;
    redoBtn.disabled = !st.canRedo;
  }
  function updateStatus() {
    blockCount.textContent = (doc.blocks || []).length + (enUI?' blocks':' بلوک');
    if (statusBar.lastElementChild) statusBar.lastElementChild.textContent = formatDateShort(doc.updatedAt || Date.now());
    const st = historyState(doc.id);
    saveChip.className = 'st-item ' + (saveState === 'saving' ? 'saving' : saveState === 'error' ? 'save-error' : 'saved');
    saveChip.textContent = (saveState === 'saving' ? '• ' + t('editor.saving') : saveState === 'error' ? (enUI?'⚠ Not saved':'⚠ ذخیره نشد') : '✓ ' + t('editor.saved')); 
    if (st.size) undoBtn.title = t('btn.undo') + ' (' + (st.size - 1) + ')';
  }
  const markSaving = debounce(() => { saveState = 'saved'; updateStatus(); }, 300);

  const unSaveState = on(document, 'ds:save-state', () => {});
  disposers.push(unSaveState);

  function setZoom(v) {
    const base=workspace==='web'?1200:794;
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v * 100) / 100));
    shell.style.width = Math.round(base * zoom) + 'px';
    if (viewportInput) viewportInput.value = Math.round(base * zoom);
    zoomVal.textContent = Math.round(zoom * 100) + '%';
  }
  function fitZoom() {
    const avail = canvas.clientWidth - 40;
    setZoom(Math.min(1,avail/(workspace==='web'?1200:794)));
  }

  /* ---------- selection ---------- */
  function selectBlock(id, { scroll = false, showMenu = false, cell = null } = {}) {
    const changed = selectedId !== id;
    selectedId = id; resizeVisible=!!id;
    $$('.b', shell).forEach((el) => el.classList.toggle('selected', el.dataset.id === id));
    if (changed) { savedTextRange=null;savedTextNode=null;layersRender(); propsRender(); }
    if (scroll && id) {
      const el = $(`.b[data-id="${id}"]`, shell);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (showMenu) { resizeVisible=!!id; if(scroll && window.innerWidth<=900) closeDrawers(); openContext(id, cell, changed); if(cell)propsRender(); } else if (changed) closeContext();
    requestAnimationFrame(()=>{positionResizeHandle();positionMerge();});
  }

  const partDragHandle=createElement('div.part-arrow-controls',{'aria-label':enUI?'Move selected item':'جابه‌جایی جزء انتخاب‌شده'});root.appendChild(partDragHandle);partDragHandle.hidden=true;
  let activePart=null;
  function partAxis(peers){let dx=0,dy=0,firstDx=0,firstDy=0;for(let i=1;i<peers.length;i++){const a=peers[i-1].getBoundingClientRect(),b=peers[i].getBoundingClientRect(),x=(b.left+b.right-a.left-a.right)/2,y=(b.top+b.bottom-a.top-a.bottom)/2;dx+=Math.abs(x);dy+=Math.abs(y);if(!firstDx&&Math.abs(x)>2)firstDx=x;if(!firstDy&&Math.abs(y)>2)firstDy=y;}const horizontal=dx>dy;return {horizontal,forward:horizontal?(firstDx<0?-1:1):(firstDy<0?-1:1)};}
  function directionalPeer(active,peers,dir){const a=active.getBoundingClientRect(),ax=(a.left+a.right)/2,ay=(a.top+a.bottom)/2;let best=null,score=Infinity;for(const e of peers){if(e===active)continue;const b=e.getBoundingClientRect(),dx=(b.left+b.right)/2-ax,dy=(b.top+b.bottom)/2-ay,horizontal=dir==='left'||dir==='right',primary=horizontal?dx:dy,overlap=horizontal?Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top):Math.min(a.right,b.right)-Math.max(a.left,b.left);if(overlap<2||(dir==='left'||dir==='up'?primary>=-2:primary<=2))continue;const n=Math.abs(primary)+Math.abs(horizontal?dy:dx)*.5;if(n<score){best=e;score=n;}}return best;}
  function positionPartHandle(){if(!activePart||!activePart.isConnected){partDragHandle.hidden=true;activePart=null;return;}const r=activePart.getBoundingClientRect(),c=canvas.getBoundingClientRect();if(r.bottom<c.top||r.top>c.bottom){partDragHandle.hidden=true;return;}const peers=Array.from(activePart.parentElement.children).filter(x=>x.dataset.reorderGroup===activePart.dataset.reorderGroup&&x.dataset.reorderKey);Array.from(partDragHandle.children).forEach(btn=>{const target=directionalPeer(activePart,peers,btn.dataset.direction);btn.disabled=!target;btn.dataset.target=target?.dataset.reorderKey||'';});partDragHandle.hidden=false;partDragHandle.style.left=Math.max(c.left+3,Math.min(c.right-75,r.left+35))+'px';partDragHandle.style.top=Math.max(c.top+3,Math.min(c.bottom-74,r.bottom+4))+'px';}
  function animateReorder(before){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;requestAnimationFrame(()=>{shell.querySelectorAll('.b[data-id]').forEach(el=>{const old=before.get(el.dataset.id);if(!old)return;const next=el.getBoundingClientRect(),dx=old.left-next.left,dy=old.top-next.top;if(Math.abs(dx)+Math.abs(dy)>1)el.animate([{transform:`translate(${dx}px,${dy}px)`,filter:'brightness(1.16)'},{transform:'translate(0,0)',filter:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});});});}
  const beforeRects=()=>new Map(Array.from(shell.querySelectorAll('.doc-page > .b[data-id]')).map(el=>[el.dataset.id,el.getBoundingClientRect()]));
  let dragPart=null;
  function finishPart(cancel=false){if(!dragPart)return;const d=dragPart;dragPart=null;d.parent.querySelectorAll('.part-drop-target,.part-dragging').forEach(x=>x.classList.remove('part-drop-target','part-dragging'));if(!cancel&&d.target&&d.target.dataset.reorderKey!==d.key){const items=Array.from(d.parent.children).filter(x=>x.dataset.reorderGroup===d.group&&x.dataset.reorderKey).map(x=>x.dataset.reorderKey),from=items.indexOf(d.key),to=items.indexOf(d.target.dataset.reorderKey);items.splice(to,0,items.splice(from,1)[0]);const nextKey=d.key.startsWith('mini:')?'mini:'+d.target.dataset.reorderKey.slice(5):(d.block.type==='text'?d.target.dataset.reorderKey:d.key);if(d.block.type==='text' && d.parent.closest('[data-edit=html]')){const source=Array.from(d.parent.children).find(x=>x.dataset.reorderKey===d.key);if(source){if(to>from)d.target.after(source);else d.target.before(source);d.parent.closest('[data-edit=html]').dispatchEvent(new Event('input',{bubbles:true}));}if(d.block.style.partOrders)delete d.block.style.partOrders[d.group];}else if(d.key.startsWith('mini:')){const a=Number(d.key.slice(5)),b=Number(d.target.dataset.reorderKey.slice(5));const list=d.block.data.miniBlocks;list.splice(b,0,list.splice(a,1)[0]);if(d.block.style.partOrders)delete d.block.style.partOrders[d.group];}else{d.block.style.partOrders ||= {};d.block.style.partOrders[d.group]=items;}const before=beforeRects();activePart=null;partDragHandle.hidden=true;commitHistory(doc);queueSave(doc);canvasRender();const parent=shell.querySelector('.b[data-id="'+CSS.escape(d.block.id)+'"]');activePart=Array.from(parent?.querySelectorAll('[data-reorder-key]')||[]).find(x=>x.dataset.reorderKey===nextKey&&x.dataset.reorderGroup===d.group)||null;if(activePart){contextState.instance=activePart.dataset.dsPartInstance||null;contextState.path=activePart.dataset.edit||activePart.querySelector('[data-edit]')?.dataset.edit||null;requestAnimationFrame(positionPartHandle);}propsRender();animateReorder(before);}else positionPartHandle();}
  for(const [direction,label,glyph] of [['up',enUI?'Move item up':'انتقال جزء به بالا','↑'],['left',enUI?'Move item left':'انتقال جزء به چپ','←'],['right',enUI?'Move item right':'انتقال جزء به راست','→'],['down',enUI?'Move item down':'انتقال جزء به پایین','↓']]){const btn=createElement('button',{type:'button','data-direction':direction,'aria-label':label,title:label},glyph);btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!activePart)return;const peers=Array.from(activePart.parentElement.children).filter(x=>x.dataset.reorderGroup===activePart.dataset.reorderGroup&&x.dataset.reorderKey),target=directionalPeer(activePart,peers,direction),block=getContextBlock();if(!target||!block)return;dragPart={group:activePart.dataset.reorderGroup,parent:activePart.parentElement,block,key:activePart.dataset.reorderKey,target};finishPart();});partDragHandle.appendChild(btn);}


  canvas.addEventListener('scroll',positionPartHandle,{passive:true});window.addEventListener('resize',positionPartHandle);disposers.push(()=>{canvas.removeEventListener('scroll',positionPartHandle);window.removeEventListener('resize',positionPartHandle);partDragHandle.remove();});
  function selectPart(e,block){
    const previousInstance=contextState.instance,previousPath=contextState.path;
    const root=e.currentTarget,sortable=e.target.closest('[data-reorder-key]');activePart=sortable&&root.contains(sortable)?sortable:null;requestAnimationFrame(positionPartHandle);const partEl=e.target.closest('[data-ds-part]');const hit=partEl&&root.contains(partEl)?partSpecs(block.type,root).find(spec=>spec[0]===partEl.dataset.dsPart):null;contextState.instance=partEl?.dataset.dsPartInstance||null;
    const editable=e.target.closest('[data-edit]')||(partEl?.querySelector('[data-edit]'));contextState.part=hit?.[0]||null;contextState.path=editable&&root.contains(editable)?editable.dataset.edit:null;const iconItem=e.target.closest('[data-icon-index]');contextState.iconIndex=iconItem?Number(iconItem.dataset.iconIndex):null;
    if(hit||contextState.path){if(previousInstance!==contextState.instance||previousPath!==contextState.path)rightPanel.scrollTop=0;propsRender();}
  }
  /* ---------- canvas ---------- */
  function revealAnimations() {
    if (workspace === 'simple' || !animToggle.checked) return;
    setTimeout(() => {
      $$('.b.anim', shell).forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 60));
    }, 120);
  }

  const tableTools=createElement('div.table-insert-tools',{'aria-label':enUI?'Table controls':'ابزار جدول'});root.appendChild(tableTools);tableTools.hidden=true;let hoverCell=null,tableHideTimer=0;
  const makeTool=(cls,fa,en,glyph)=>createElement('button.'+cls,{type:'button','aria-label':enUI?en:fa,title:enUI?en:fa},glyph);
  const topPlus=makeTool('table-add-top','افزودن سطر بالا','Insert row above','+'),bottomPlus=makeTool('table-insert-row','افزودن سطر پایین','Insert row below','+'),leftPlus=makeTool('table-add-left','افزودن ستون چپ','Insert column left','+'),rightPlus=makeTool('table-insert-col','افزودن ستون راست','Insert column right','+'),delRow=makeTool('table-delete-row','حذف سطر','Delete row','−'),delCol=makeTool('table-delete-col','حذف ستون','Delete column','−'),rangeMode=makeTool('table-range-mode','انتخاب محدوده با دو کلیک یا لمس','Select range with two clicks or taps','▦');tableTools.append(topPlus,bottomPlus,leftPlus,rightPlus,delRow,delCol,rangeMode);delRow.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h10M3 9h10M3 13h10M14 12l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.7" fill="none"/></svg>';delCol.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3v10M9 3v10M13 3v10M14 12l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.7" fill="none"/></svg>';
  function updateTableTools(){
    if(!hoverCell?.cell?.isConnected){tableTools.hidden=true;return;}
    const cell=hoverCell.cell,table=cell.closest('table'),r=cell.getBoundingClientRect(),a=canvas.getBoundingClientRect(),t=table.getBoundingClientRect();
    if(r.bottom<a.top||r.top>a.bottom||r.right<a.left||r.left>a.right){tableTools.hidden=true;return;}tableTools.hidden=false;
    const size=17,step=22,railY=t.top-25,railX=Math.max(a.left+2,Math.min(a.right-step*8-2,t.left+4)),vertical=railY<a.top+2||railY+size>a.bottom;
    const sideX=t.left-a.left>=size+3?t.left-size-3:(a.right-t.right>=size+3?t.right+3:a.left+2);
    const rail=(i)=>vertical?{x:sideX,y:a.top+2+i*step}:{x:railX+i*step,y:railY};
    const placed=[];const set=(btn,p)=>{btn.style.left=Math.round(p.x)+'px';btn.style.top=Math.round(p.y)+'px';placed.push({left:p.x,top:p.y,right:p.x+size,bottom:p.y+size});};
    const intersects=(x,z)=>x.left<z.right&&x.right>z.left&&x.top<z.bottom&&x.bottom>z.top;
    const textRects=[];for(let rr=Math.max(0,cell.parentElement.rowIndex-1);rr<=Math.min(table.rows.length-1,cell.parentElement.rowIndex+1);rr++){const tr=table.rows[rr];for(let cc=Math.max(0,cell.cellIndex-1);cc<=Math.min(tr.cells.length-1,cell.cellIndex+(cell.colSpan||1));cc++){const td=tr.cells[cc];if(!td||td.hidden)continue;const walker=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;if(!n.nodeValue.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const box of range.getClientRects())if(box.width&&box.height)textRects.push(box);}}}
    const placeEdge=(btn,side,index)=>{const f=[.5,.25,.75,.12,.88],candidates=f.map(q=>{const x=side==='left'?r.left:side==='right'?r.right:r.left+r.width*q,y=side==='top'?r.top:side==='bottom'?r.bottom:r.top+r.height*q;return {x:x-size/2,y:y-size/2};});let pos=candidates.find(p=>{const box={left:p.x,top:p.y,right:p.x+size,bottom:p.y+size};return box.left>=a.left&&box.right<=a.right&&box.top>=a.top&&box.bottom<=a.bottom&&!textRects.some(t=>intersects(box,t))&&!placed.some(t=>intersects(box,t));});if(!pos)pos=rail(index);set(btn,pos);};
    placeEdge(topPlus,'top',0);placeEdge(bottomPlus,'bottom',1);placeEdge(leftPlus,'left',2);placeEdge(rightPlus,'right',3);
    set(delRow,rail(4));set(delCol,rail(5));set(rangeMode,rail(6));delRow.hidden=hoverCell.section!=='body';delCol.hidden=hoverCell.block.data.headers.length<=1;
    const editing=document.activeElement?.matches?.('.table-cell-editor[contenteditable]');[topPlus,bottomPlus,leftPlus,rightPlus].forEach(btn=>btn.hidden=!!editing);
  }
  async function applyTableTool(action){if(!hoverCell)return;const {block,row,col,cell,section}=hoverCell,d=block.data,rtl=getComputedStyle(cell).direction==='rtl',cs=cell.colSpan||1,rs=cell.rowSpan||1;let changed=true;if(action==='left'||action==='right'){const before=action==='left'?!rtl:rtl;insertTableColumn(doc,block,before?col:col+cs);}else if(action==='top'||action==='bottom'){let at=section==='head'?0:section==='foot'?d.rows.length:row+(action==='bottom'?rs:0);addTableRow(block,at);}else if(action==='deleteRow'){if(section!=='body')return;if(!await confirmDialog(enUI?'Delete this row?':'این سطر حذف شود؟',{danger:true}))return;changed=deleteTableRow(block,row);}else{if(!await confirmDialog(enUI?'Delete this column and adjust linked references?':'این ستون حذف و ارجاع‌ها تنظیم شوند؟',{danger:true}))return;changed=deleteTableColumn(doc,block,col);}if(!changed)return;hoverCell=null;tableTools.hidden=true;selectedId=block.id;commitHistory(doc);queueSave(doc);canvasRender();layersRender();propsRender();refreshLinkedCharts(block.id);}
  rangeMode.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();});rangeMode.addEventListener('click',e=>{e.stopPropagation();const t=hoverCell?.cell?.closest('table');if(!t)return;t.dataset.touchRange='true';toast(enUI?'Now select the opposite corner of the range.':'اکنون گوشهٔ مقابل محدوده را انتخاب کنید.');});
  [[topPlus,'top'],[bottomPlus,'bottom'],[leftPlus,'left'],[rightPlus,'right'],[delRow,'deleteRow'],[delCol,'deleteCol']].forEach(([btn,kind])=>{btn.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();});btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyTableTool(kind);});});
  shell.addEventListener('pointerover',e=>{clearTimeout(tableHideTimer);const cell=e.target.closest?.('.b-table th,.b-table td');if(!cell||!shell.contains(cell)||cell.hidden)return;const blockEl=cell.closest('.b[data-type=table]'),block=doc.blocks.find(b=>b.id===blockEl?.dataset.id);if(!block)return;const section=cell.closest('tbody')?'body':cell.closest('tfoot')?'foot':'head';hoverCell={cell,block,section,row:section==='body'?cell.parentElement.sectionRowIndex:-1,col:cell.cellIndex};updateTableTools();});
  const scheduleTableHide=()=>{clearTimeout(tableHideTimer);tableHideTimer=setTimeout(()=>{tableTools.hidden=true;hoverCell=null;},900);};
  shell.addEventListener('pointerout',e=>{if(e.pointerType==='touch')return;const target=e.target.closest?.('.b-table');if(target&&!(e.relatedTarget instanceof Element&&e.relatedTarget.closest('.b-table'))&&!tableTools.contains(e.relatedTarget))scheduleTableHide();});
  tableTools.addEventListener('pointerenter',()=>clearTimeout(tableHideTimer),true);tableTools.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')scheduleTableHide();},true);
  root.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!tableTools.contains(e.target)&&!e.target.closest?.('.b-table')){tableTools.hidden=true;hoverCell=null;}});
  shell.addEventListener('focusin',()=>requestAnimationFrame(updateTableTools));shell.addEventListener('focusout',()=>requestAnimationFrame(updateTableTools));
  canvas.addEventListener('scroll',updateTableTools,{passive:true});window.addEventListener('resize',updateTableTools);disposers.push(()=>{canvas.removeEventListener('scroll',updateTableTools);window.removeEventListener('resize',updateTableTools);clearTimeout(tableHideTimer);tableTools.remove();});
  const mergeButton=makeTool('table-merge-trigger','تنظیمات ادغام خانه‌ها','Cell merge settings','▦');root.appendChild(mergeButton);mergeButton.hidden=true;let mergeSelection=null;
  function positionMerge(){if(!mergeSelection?.table?.isConnected||selectedId!==mergeSelection.block.id){mergeButton.hidden=true;return;}const {table,q}=mergeSelection,a=canvas.getBoundingClientRect(),cell=table.rows[q.r1]?.cells[q.c1];if(!cell){mergeButton.hidden=true;return;}const r=cell.getBoundingClientRect(),t=table.getBoundingClientRect(),step=22,railY=t.top-25,railX=Math.max(a.left+2,Math.min(a.right-step*8-2,t.left+4)),vertical=railY<a.top+2||railY+17>a.bottom;const sideX=t.left-a.left>=20?t.left-20:(a.right-t.right>=20?t.right+3:a.left+2);mergeButton.hidden=false;mergeButton.style.left=Math.round(vertical?sideX:railX+7*step)+'px';mergeButton.style.top=Math.round(vertical?a.top+2+7*step:railY)+'px';}
  mergeButton.addEventListener('pointerdown',e=>e.preventDefault());mergeButton.addEventListener('click',e=>{e.stopPropagation();if(!mergeSelection)return;const {block,q}=mergeSelection,d=block.data,sec=sectionFor(d,q.r1),same=sectionFor(d,q.r2)===sec,existing=(d.merges||[]).filter(m=>{const x=logicalRect(d,m);return x.r1<=q.r2&&x.r2>=q.r1&&x.c1<=q.c2&&x.c2>=q.c1;});
    const update=()=>{closeModal();mergeSelection=null;mergeButton.hidden=true;commitHistory(doc);queueSave(doc);rerenderBlock(block.id);refreshLinkedCharts(block.id);propsRender();};
    if(existing.length){openModal({title:enUI?'Merge settings':'تنظیمات ادغام',body:createElement('p',{text:enUI?'This selection contains merged cells. Unmerge them before creating another merge. Previously cleared contents return only with Undo.':'این محدوده خانهٔ ادغام‌شده دارد. برای ادغام جدید ابتدا ادغام موجود را لغو کنید. محتوای پاک‌شده فقط با واگرد برمی‌گردد.'}),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},enUI?'Cancel':'انصراف'),createElement('button.btn.btn-sm.btn-primary',{onclick:()=>{d.merges=(d.merges||[]).filter(m=>!existing.includes(m));update();}},enUI?'Unmerge selected':'لغو ادغام انتخاب‌شده')]});return;}
    if(!same){toast(enUI?'Select cells within one table section (header, body or footer).':'خانه‌ها باید در یک بخش جدول باشند: سرستون، بدنه یا پاورقی.');return;}
    const cells=[];for(let r=q.r1;r<=q.r2;r++)for(let c=q.c1;c<=q.c2;c++){const sr=sectionRow(sec,r),arr=sec==='head'?d.headers:sec==='foot'?d.footerRow:d.rows[sr],cfg=d.columnConfigs?.[c]||{},aggregate=cfg.aggregate||((d.sumColumns||[]).includes(c)?'sum':'none');if((sec==='body'&&cfg.type==='formula')||(sec==='foot'&&aggregate!=='none')){toast(enUI?'Calculated cells cannot be merged.':'خانه‌های فرمولی یا جمع خودکار قابل ادغام نیستند.');return;}cells.push({r,c,sr,value:String(arr?.[c]??''),key:sec==='head'?'h:'+c:sec==='foot'?'f:'+c:'r:'+sr+':'+c});}
    const list=createElement('div.merge-content-list');cells.forEach((x,i)=>{const input=createElement('input',{type:'radio',name:'merge-content',value:String(i)});input.checked=i===0;list.appendChild(createElement('label.merge-choice',{},[input,createElement('span',{text:(enUI?'Row ':'سطر ')+(x.r+1)+' · '+(enUI?'Column ':'ستون ')+(x.c+1)+' — '+(x.value|| (enUI?'(empty)':'(خالی)'))})]));});
    openModal({title:enUI?'Merge cells':'ادغام خانه‌ها',body:createElement('div',{},[createElement('p',{text:enUI?'Choose the one cell whose content will be kept. Other contents will be cleared, which can change formulas and charts; Undo can restore them.':'محتوای یک خانه را برای نگهداری انتخاب کنید. محتوای خانه‌های دیگر پاک می‌شود و ممکن است فرمول و نمودار تغییر کند؛ با واگرد می‌توان آن را برگرداند.'}),list]),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},enUI?'Cancel':'انصراف'),createElement('button.btn.btn-sm.btn-primary',{'data-merge-confirm':'',onclick:()=>{const chosen=cells[Number(list.querySelector('input:checked')?.value||0)],first=cells[0],rich=d.richParts?.[chosen.key];for(const x of cells){const arr=sec==='head'?d.headers:sec==='foot'?d.footerRow:d.rows[x.sr];arr[x.c]='';if(d.richParts)delete d.richParts[x.key];}const dest=sec==='head'?d.headers:sec==='foot'?d.footerRow:d.rows[first.sr];dest[first.c]=chosen.value;if(rich){d.richParts ||= {};d.richParts[first.key]=rich;}d.merges ||= [];d.merges.push({section:sec,r1:sectionRow(sec,q.r1),r2:sectionRow(sec,q.r2),c1:q.c1,c2:q.c2});update();}},enUI?'Merge':'ادغام')]});
  });canvas.addEventListener('scroll',positionMerge,{passive:true});window.addEventListener('resize',positionMerge);disposers.push(()=>{canvas.removeEventListener('scroll',positionMerge);window.removeEventListener('resize',positionMerge);mergeButton.remove();});
  function installTableKeyboardFor(el,block){if(block.type!=='table')return;installTableKeyboard(el,block,{
    doc,en:enUI,message:msg=>toast(msg),
    confirm:kind=>confirmDialog(kind==='column'?(enUI?'Delete selected column?':'ستون انتخاب‌شده حذف شود؟'):(enUI?'Delete selected row?':'سطر انتخاب‌شده حذف شود؟'),{danger:true}),
    changed:()=>{commitHistory(doc);queueSave(doc);rerenderBlock(block.id);refreshTableFooter(block);refreshLinkedCharts(block.id);layersRender();propsRender();},
    rerender:()=>{queueSave(doc);rerenderBlock(block.id);refreshTableFooter(block);refreshLinkedCharts(block.id);propsRender();},
    onRange:(table,q)=>{if(q.r1!==q.r2||q.c1!==q.c2||(block.data.merges||[]).some(m=>{const x=logicalRect(block.data,m);return x.r1===q.r1&&x.r2===q.r2&&x.c1===q.c1&&x.c2===q.c2;})){mergeSelection={table,q,block};requestAnimationFrame(positionMerge);}else if(mergeSelection?.block.id===block.id){mergeSelection=null;mergeButton.hidden=true;}},
    onSelect:cell=>{selectBlock(block.id,{showMenu:true,cell:contextCell({target:cell,currentTarget:el},block)});selectPart({target:cell,currentTarget:el},block);}
  });}
  function installBlockDrag(el,block){
    const grip=createElement('button.block-drag-handle',{type:'button','aria-label':enUI?'Drag block to reorder':'درگ برای جابه‌جایی بلوک',title:enUI?'Drag block to reorder':'برای جابه‌جایی بلوک بکشید'},'⠿');
    const stack=createElement('div.block-reorder-stack',{'aria-label':enUI?'Block order':'ترتیب بلوک'});const up=createElement('button.block-order-up',{type:'button','aria-label':enUI?'Move block up':'انتقال بلوک به بالا',title:enUI?'Move block up':'انتقال بلوک به بالا'},'↑'),down=createElement('button.block-order-down',{type:'button','aria-label':enUI?'Move block down':'انتقال بلوک به پایین',title:enUI?'Move block down':'انتقال بلوک به پایین'},'↓');up.disabled=doc.blocks.findIndex(x=>x.id===block.id)===0;down.disabled=doc.blocks.findIndex(x=>x.id===block.id)===doc.blocks.length-1;[up,down].forEach((b,i)=>b.addEventListener('click',e=>{e.stopPropagation();const before=beforeRects();moveBlock(block.id,i===0?-1:1);animateReorder(before);}));stack.addEventListener('click',e=>e.stopPropagation());stack.append(up,grip,down);el.appendChild(stack);let drag=null;
    grip.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.stopPropagation();e.preventDefault();drag={source:block.id,target:null,before:true};grip.setPointerCapture(e.pointerId);el.classList.add('block-dragging');});
    grip.addEventListener('pointermove',e=>{if(!drag)return;const nodes=Array.from(shell.querySelectorAll('.doc-page > .b[data-id]')).filter(x=>x!==el);let best=null,dist=Infinity;nodes.forEach(x=>{const r=x.getBoundingClientRect(),d=Math.abs(e.clientY-(r.top+r.bottom)/2)+Math.abs(e.clientX-(r.left+r.right)/2)*.3;if(d<dist){dist=d;best=x;}});nodes.forEach(x=>x.classList.remove('block-drop-before','block-drop-after'));if(best){drag.target=best.dataset.id;const r=best.getBoundingClientRect();drag.before=e.clientY<(r.top+r.bottom)/2;best.classList.add(drag.before?'block-drop-before':'block-drop-after');}});
    function done(cancel){if(!drag)return;const d=drag;drag=null;el.classList.remove('block-dragging');shell.querySelectorAll('.block-drop-before,.block-drop-after').forEach(x=>x.classList.remove('block-drop-before','block-drop-after'));if(cancel||!d.target)return;const from=doc.blocks.findIndex(x=>x.id===d.source),target=doc.blocks.findIndex(x=>x.id===d.target);if(from<0||target<0)return;let insertion=target+(d.before?0:1);const rects=beforeRects();const moved=doc.blocks.splice(from,1)[0];if(insertion>from)insertion--;doc.blocks.splice(insertion,0,moved);if(insertion===from)return;selectedId=moved.id;commitHistory(doc);queueSave(doc);canvasRender();layersRender();propsRender();animateReorder(rects);}
    grip.addEventListener('pointerup',()=>done(false));grip.addEventListener('pointercancel',()=>done(true));
  }
  function installInsertTrigger(el, block){
    const btn=createElement('button.block-insert-trigger',{type:'button','aria-label':enUI?'Insert block before':'افزودن بلوک پیش از این المان',title:enUI?'Insert a block here':'افزودن بلوک در این نقطه',onclick:e=>{e.stopPropagation();const current=doc.blocks.findIndex(x=>x.id===block.id);if(current<0)return;const options=createElement('div.insert-options',{},blockTypes().map(def=>createElement('button.btn',{type:'button',onclick:()=>{closeModal();addBlock(def.type,current);}},[icon(def.type),t(def.labelKey)])));openModal({title:enUI?'Insert block here':'افزودن بلوک در این نقطه',body:options,footer:[createElement('button.btn',{onclick:closeModal},t('btn.cancel'))]});}},'+');
    btn.addEventListener('click',e=>e.stopPropagation());const zone=createElement('div.block-insert-zone',{},[btn]);zone.addEventListener('click',e=>e.stopPropagation());el.appendChild(zone);
  }
  function canvasRender() {
    langSelect.value = doc.lang;
    // Document language is independent of the interface language.
    if (selectedId && !doc.blocks.some(b => b.id === selectedId)) selectedId = doc.blocks[0]?.id || null;
    const focusedTable=document.activeElement?.matches?.('.b-table th,.b-table td')?document.activeElement.closest('.b[data-type=table]'):null;if(focusedTable)preserveTableFocus(focusedTable.dataset.id);
    activePart=null;partDragHandle.hidden=true;tableTools.hidden=true;hoverCell=null;clear(shell);
    editor.dataset.webSurface=getAppearance(doc).surface;
    renderEditorBackground();
    freePageController?.destroy();
    const page = renderPage(doc, { editable: true, animate: workspace === 'web' && !!animToggle.checked });
    if (!doc.blocks.length) {
      page.appendChild(createElement('div.canvas-empty', { text: t('editor.emptyCanvas') }));
    }
    shell.appendChild(page);updateGrid();updateRulers();
    freePageController=setupFreePage(page);syncLayoutButtons();

    $$('.b', shell).forEach((bEl) => {
      const block = doc.blocks.find((b) => b.id === bEl.dataset.id);
      if (!block) return;
      // ابزارهای بلوک
      const tools = createElement('div.b-tools', { onclick: (e) => e.stopPropagation() }, [
        createElement('button', { title: 'up', onclick: () => moveBlock(block.id, -1) }, icon('up')),
        createElement('button', { title: 'down', onclick: () => moveBlock(block.id, 1) }, icon('down')),
        createElement('button', { title: t('btn.duplicate'), onclick: () => duplicateBlock(block.id) }, icon('copy')),
        createElement('button', { title: t('btn.delete'), onclick: () => removeBlock(block.id) }, icon('trash'))
      ]);
      bEl.appendChild(tools);installBlockDrag(bEl,block);installInsertTrigger(bEl,block);
      bEl.appendChild(createElement('span.doc-badge', { text: t(registry.get(block.type)?.labelKey || '') }));
      bEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBlock(block.id,{showMenu:true,cell:contextCell(e,block)});selectPart(e,block);
      });
      attachInlineEditing(bEl, block, ({ commit }) => {
        if (commit) commitHistory(doc);
        queueSave(doc);
        if (block.type === 'table') { refreshTableFooter(block); refreshLinkedCharts(block.id); }
        if (commit) { layersRender(); updateStatus(); if((Number(block.style?.textOpacity??100)<100 || hasFadedTextParts(block.style)))setTimeout(()=>{if(editor.isConnected&&(!shell.contains(document.activeElement)||!document.activeElement.closest('.b[data-id="'+CSS.escape(block.id)+'"]')))rerenderBlock(block.id);},0); }
      }, doc.lang);
      installTableKeyboardFor(bEl,block);
    });
    $$('.b', shell).forEach((el) => el.classList.toggle('selected', el.dataset.id === selectedId));
    revealAnimations();
    updateHistoryButtons();
    updateStatus();
    if (contextState.id) refreshContext();
    requestAnimationFrame(positionResizeHandle);
  }

  function refreshTableFooter(block) {
    const row = shell.querySelector('.b[data-id="' + block.id + '"] tfoot tr');
    const vals=smartFooter(block.data,doc.lang);
    vals.forEach((value,i)=>{const el=row?.cells[i];if(el?.hasAttribute('data-aggregate')){const ink=el.querySelector('[data-ds-ink]');if(ink)ink.textContent=value;else el.textContent=value;}});
    const root=shell.querySelector('.b[data-id="'+CSS.escape(block.id)+'"]');root?.querySelectorAll('tbody tr').forEach((tr,r)=>Array.from(tr.cells).forEach((cell,c)=>{if(cell.hasAttribute('data-calculated'))cell.textContent=displayTableCell(block.data,block.data.rows[r],c,doc.lang);}));
    if(Number(block.style?.textOpacity??100)<100 || hasFadedTextParts(block.style)) row&&applyTextInk(row,true);
  }
  function refreshLinkedCharts(tableId) {
    doc.blocks.filter(b => b.type === 'chart' && b.data?.source?.tableId === tableId).forEach(b => rerenderBlock(b.id));
  }
  function rerenderBlock(id) {
    const focusedTable=document.activeElement?.matches?.('.b-table th,.b-table td')?document.activeElement.closest('.b[data-type=table]'):null;if(focusedTable?.dataset.id===id)preserveTableFocus(id);
    const el = $(`.b[data-id="${id}"]`, shell);
    const block = doc.blocks.find((b) => b.id === id);
    if (!el || !block) { canvasRender(); return; }
    const idx = doc.blocks.findIndex((b) => b.id === id);
    const fresh = renderBlock(block, { editable: true, index: idx, doc, animate: workspace === 'web' && !!animToggle.checked });
    fresh.classList.toggle('selected', id === selectedId);
    fresh.appendChild(createElement('div.b-tools', { onclick: (e) => e.stopPropagation() }, [
      createElement('button', { title: 'up', onclick: () => moveBlock(block.id, -1) }, icon('up')),
      createElement('button', { title: 'down', onclick: () => moveBlock(block.id, 1) }, icon('down')),
      createElement('button', { title: t('btn.duplicate'), onclick: () => duplicateBlock(block.id) }, icon('copy')),
      createElement('button', { title: t('btn.delete'), onclick: () => removeBlock(block.id) }, icon('trash'))
    ]));
    installBlockDrag(fresh,block);installInsertTrigger(fresh,block);
    fresh.appendChild(createElement('span.doc-badge', { text: t(registry.get(block.type)?.labelKey || '') }));
    fresh.addEventListener('click', (e) => { e.stopPropagation(); selectBlock(block.id,{showMenu:true,cell:contextCell(e,block)});selectPart(e,block); });
    attachInlineEditing(fresh, block, ({ commit }) => {
      if (commit) commitHistory(doc);
      queueSave(doc);
      if (block.type === 'table') { refreshTableFooter(block); refreshLinkedCharts(block.id); }
      if(commit && (Number(block.style?.textOpacity??100)<100 || hasFadedTextParts(block.style)))setTimeout(()=>{if(editor.isConnected&&(!shell.contains(document.activeElement)||!document.activeElement.closest('.b[data-id="'+CSS.escape(block.id)+'"]')))rerenderBlock(block.id);},0);
    }, doc.lang);
    if (fresh.classList.contains('anim')) setTimeout(() => fresh.classList.add('in'), 40);
    if(activePart&&el.contains(activePart)){activePart=null;partDragHandle.hidden=true;}el.replaceWith(fresh);
    installTableKeyboardFor(fresh,block);
    if(doc.settings.freeLayout){freePageController?.destroy();freePageController=setupFreePage(shell.querySelector('.doc-page'));}
    if(contextState.id===id) refreshContext();
    requestAnimationFrame(positionResizeHandle);
  }

  /* ---------- layers ---------- */
  let dragIndex = null;
  function layersRender() {
    clear(layerList);
    if (!doc.blocks.length) {
      layerList.appendChild(createElement('li.layer-empty', { text: t('editor.emptyCanvas') }));
      return;
    }
    doc.blocks.forEach((block, i) => {
      const def = registry.get(block.type);
      const label = blockName(block);
      const li = createElement('li.layer' + (block.id === selectedId ? '.active' : ''), {
        draggable: 'true', 'data-index': String(i), tabindex: '0',
        onclick: () => selectBlock(block.id, { scroll: true, showMenu:true }),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBlock(block.id, { scroll: true, showMenu:true }); requestAnimationFrame(()=>contextMenu.querySelector('[data-action=settings]')?.focus()); } }
      }, [
        icon(def?.type || 'layout'),
        createElement('span.li-name', { text: label, title: label }),
        createElement('span.li-tools', {}, [
          createElement('button', { title: 'up', onclick: (e) => { e.stopPropagation(); moveBlock(block.id, -1); } }, icon('up')),
          createElement('button', { title: 'down', onclick: (e) => { e.stopPropagation(); moveBlock(block.id, 1); } }, icon('down')),
          createElement('button', { title: t('btn.delete'), onclick: (e) => { e.stopPropagation(); removeBlock(block.id); } }, icon('trash'))
        ])
      ]);
      li.addEventListener('dragstart', (e) => {
        dragIndex = i;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {}
      });
      li.addEventListener('dragend', () => { li.classList.remove('dragging'); $$('.layer', layerList).forEach((x) => x.classList.remove('drop-before', 'drop-after')); });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        const rect = li.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        li.classList.toggle('drop-after', after);
        li.classList.toggle('drop-before', !after);
      });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before', 'drop-after'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = dragIndex;
        const to = i + (li.classList.contains('drop-after') ? 1 : 0);
        li.classList.remove('drop-before', 'drop-after');
        if (from === null || from === to || from === to - 1) return;
        reorder(from, to);
      });
      layerList.appendChild(li);
    });
  }
  function blockName(block) {
    const d = block.data || {};
    const raw = d.title || d.text || d.caption || (Array.isArray(d.items) ? d.items[0]?.title : '') ||
      (Array.isArray(d.stats) ? d.stats[0]?.label : '') || (d.headers ? d.headers[0] : '') || '';
    const clean = String(raw).replace(/<[^>]*>/g, '').slice(0, 26);
    return clean || t(registry.get(block.type)?.labelKey || 'block.text');
  }
  function reorder(from, to) {
    const [moved] = doc.blocks.splice(from, 1);
    doc.blocks.splice(to > from ? to - 1 : to, 0, moved);
    commitHistory(doc); queueSave(doc);
    canvasRender(); layersRender();
  }

  /* ---------- block ops ---------- */
  function addBlock(type,insertIndex=null) {
    const block = localizeNewBlock(createBlock(type), doc.lang);
    if(doc.settings.freeLayout){const page=shell.querySelector('.doc-page'),r=page?.getBoundingClientRect();let end=20;page?.querySelectorAll(':scope > .b').forEach(el=>{end=Math.max(end,el.getBoundingClientRect().bottom-r.top+18)});Object.assign(block.style,{freeX:4,freeY:Math.round(end),blockWidth:92});}
    rememberBlockDesign(doc,block);
    const idx = selectedId ? doc.blocks.findIndex((b) => b.id === selectedId) : doc.blocks.length - 1;
    doc.blocks.splice(insertIndex===null?Math.max(0,idx+1):Math.max(0,Math.min(doc.blocks.length,insertIndex)),0,block);
    selectedId = block.id;
    commitHistory(doc); queueSave(doc);
    canvasRender(); layersRender(); propsRender();
    const el = $(`.b[data-id="${block.id}"]`, shell);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    closeDrawers();
  }
  function removeBlock(id) {
    const i = doc.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    doc.blocks.splice(i, 1);
    if (selectedId === id) selectedId = doc.blocks[Math.max(0, i - 1)]?.id || null;
    commitHistory(doc); queueSave(doc);
    canvasRender(); layersRender(); propsRender();
  }
  function duplicateBlock(id) {
    const i = doc.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = createBlock(doc.blocks[i].type, {
      data: JSON.parse(JSON.stringify(doc.blocks[i].data)),
      style: { ...doc.blocks[i].style }
    });
    if(doc.settings.freeLayout){copy.style.freeX=Math.min(100-(Number(copy.style.blockWidth)||100),Math.max(0,(Number(copy.style.freeX)||0)+2));copy.style.freeY=(Number(copy.style.freeY)||0)+24;}
    rememberBlockDesign(doc,copy);
    doc.blocks.splice(i + 1, 0, copy);
    selectedId = copy.id;
    commitHistory(doc); queueSave(doc);
    canvasRender(); layersRender(); propsRender();
  }
  function moveBlock(id, dir) {
    const i = doc.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= doc.blocks.length) return;
    [doc.blocks[i], doc.blocks[j]] = [doc.blocks[j], doc.blocks[i]];
    commitHistory(doc); queueSave(doc);
    canvasRender(); layersRender();
  }

  function changeStack(id,action){
    const order=doc.blocks.map((b,i)=>({b,i,z:Number.isFinite(Number(b.style?.stackOrder))?Number(b.style.stackOrder):i})).sort((a,b)=>a.z-b.z||a.i-b.i);const i=order.findIndex(x=>x.b.id===id);if(i<0)return;let j=action==='front'?order.length-1:action==='bottom'?0:action==='forward'?Math.min(order.length-1,i+1):Math.max(0,i-1);const [item]=order.splice(i,1);order.splice(j,0,item);order.forEach((x,n)=>{x.b.style.stackOrder=n+1});commitHistory(doc);queueSave(doc);canvasRender();propsRender();
  }
  function nudgeBlock(block,dx,dy){
    if(!doc.settings.freeLayout&&dy){moveBlock(block.id,dy);return;}
    const page=shell.querySelector('.doc-page'),el=resizeTarget();if(!page||!el)return;const width=Number(block.style.blockWidth)||100;
    if(doc.settings.freeLayout){block.style.freeX=Math.max(0,Math.min(100-width,(Number(block.style.freeX)||0)+dx*2));block.style.freeY=Math.max(0,Math.min(50000,(Number(block.style.freeY)||0)+dy*10));el.style.setProperty('--free-x',block.style.freeX+'%');el.style.setProperty('--free-y',block.style.freeY+'px');arrangeFree(doc,page,block.id,doc.settings.smartArrange||'push');}
    else{const r=el.getBoundingClientRect(),pr=page.getBoundingClientRect(),ref=r.width/(width/100),old=Number.isFinite(Number(block.style.flowOffset))?Number(block.style.flowOffset):(r.left-pr.left-parseFloat(getComputedStyle(page).paddingLeft||0))/ref*100;block.style.flowOffset=Math.max(0,Math.min(100-width,old+dx*2));}
    commitHistory(doc);queueSave(doc);canvasRender();propsRender();
  }
  function alignBlock(block,side){
    const el=resizeTarget(),page=shell.querySelector('.doc-page');if(!el||!page)return;const width=block.style.logoFitWidthPx&&!doc.settings.freeLayout?Math.min(100,el.getBoundingClientRect().width/Math.max(1,page.clientWidth-parseFloat(getComputedStyle(page).paddingLeft||0)-parseFloat(getComputedStyle(page).paddingRight||0))*100):Number(block.style.blockWidth)||100;
    const x=side==='left'?0:side==='center'?(100-width)/2:100-width;
    if(doc.settings.freeLayout)block.style.freeX=Math.max(0,x);else block.style.flowOffset=Math.max(0,x);
    commitHistory(doc);queueSave(doc);canvasRender();propsRender();
  }
  function openDesignReset(){
    const L=(fa,en)=>enUI?en:fa,labels=[['colors',L('رنگ‌ها، زمینه و تم','Colors, backgrounds and theme')],['dimensions',L('ابعاد، موقعیت و چیدمان','Dimensions, positions and layout')],['opacity',L('شفافیت‌ها','Opacity')],['animation',L('انیمیشن‌ها','Animations')]];
    const checks=labels.map(([key,label])=>{const input=createElement('input',{type:'checkbox','data-reset':key});input.checked=true;return [key,input,createElement('label.switch',{},[input,label])];});
    openModal({title:L('بازنشانی طراحی سند','Reset document design'),body:createElement('div',{},[createElement('p.hint',{text:doc.settings.designBaseline?L('فقط طراحی به مبنای اولیه بازمی‌گردد؛ متن، جدول، تصاویر و لوگوهای محتوا حفظ می‌شوند.','Only design returns to its initial baseline; text, tables, content images and logos are preserved.'):L('برای سند قدیمی، طراحی به پیش‌فرض برنامه بازمی‌گردد؛ محتوای شما حفظ می‌شود.','For this older document, design returns to application defaults; your content is preserved.')}),...checks.map(x=>x[2])]),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},t('btn.cancel')),createElement('button.btn.btn-primary',{'data-action':'reset-design',onclick:()=>{const selected=checks.filter(x=>x[1].checked).map(x=>x[0]);if(!selected.length)return;resetDesign(doc,selected,DEFAULT_DOC_SETTINGS,createBlock);commitHistory(doc);queueSave(doc);fillThemes();canvasRender();layersRender();propsRender();closeModal();toast(L('طراحی بازنشانی شد؛ واگرد در دسترس است.','Design reset; undo is available.'),'ok');}},L('بازنشانی انتخاب‌شده‌ها','Reset selected'))]});
  }

  function rememberTextSelection(){const sel=window.getSelection();if(!sel||!sel.rangeCount)return;const anchor=sel.anchorNode,within=anchor&&(anchor.nodeType===1?anchor:anchor.parentElement);if(sel.isCollapsed){if(within&&shell.contains(within)){savedTextRange=null;savedTextNode=null;updateTypeTarget();}return;}const range=sel.getRangeAt(0),node=(range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement)?.closest('[data-edit][data-rich="1"]');if(node&&shell.contains(node)&&node.contains(range.startContainer)&&node.contains(range.endContainer)){savedTextRange=range.cloneRange();savedTextNode=node;updateTypeTarget();}}

  shell.addEventListener('pointerdown',()=>{savedTextRange=null;savedTextNode=null;updateTypeTarget();});
  document.addEventListener('selectionchange',rememberTextSelection);disposers.push(()=>document.removeEventListener('selectionchange',rememberTextSelection));
  function formatSelection(property,value){
    if(!savedTextRange||!savedTextNode?.isConnected){toast(enUI?'Select editable text first.':'ابتدا بخشی از متن قابل ویرایش را انتخاب کنید.');return;}
    const range=savedTextRange.cloneRange();if(range.collapsed)return;
    try{const walker=document.createTreeWalker(savedTextNode,NodeFilter.SHOW_TEXT),pieces=[];let node;while((node=walker.nextNode())){if(!range.intersectsNode(node))continue;const from=node===range.startContainer?range.startOffset:0,to=node===range.endContainer?range.endOffset:node.length;if(to>from)pieces.push({node,from,to});}if(!pieces.length)return;
      const spans=[];for(let i=pieces.length-1;i>=0;i--){const part=pieces[i],sub=document.createRange();sub.setStart(part.node,part.from);sub.setEnd(part.node,part.to);const span=document.createElement('span');span.style.setProperty(property,value);span.appendChild(sub.extractContents());sub.insertNode(span);spans.unshift(span);}
      const next=document.createRange();next.setStartBefore(spans[0]);next.setEndAfter(spans[spans.length-1]);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(next);savedTextRange=next.cloneRange();savedTextNode.dispatchEvent(new Event('input',{bubbles:true}));commitHistory(doc);queueSave(doc);
    }catch(err){toast(enUI?'Could not format this selection.':'اعمال قالب روی این انتخاب ممکن نشد.','err');}
  }

  function typographyControls(block,api){
    const L=(fa,en)=>enUI?en:fa,path=contextState.id===block.id?contextState.path:null,m=/^miniBlocks\.(\d+)\.textHTML$/.exec(path||'');
    const key=path==='textHTML'&&block.type==='heading'?'heading':path==='html'&&block.type==='text'?'body':m?'mini:'+m[1]:contextState.id===block.id&&contextState.instance?'part:'+contextState.instance:null;
    let style=null;if(key){const isCell=block.type==='table'&&key.startsWith('part:'),holder=m?block.data.miniBlocks[Number(m[1])]:isCell?(block.style.cellTypography ||= {}):(block.style.typography ||= {});style=m?(holder.typography ||= {}):(holder[isCell?key.slice(5):key] ||= {});}
    const targetStatus=createElement('p.type-target',{role:'status','aria-live':'polite'}),target=()=>!!(savedTextRange&&!savedTextRange.collapsed&&savedTextNode?.isConnected&&savedTextNode.closest('.b[data-id]')?.dataset.id===block.id&&savedTextNode.dataset.edit===path);
    function whole(k,v){if(!style){toast(L('ابتدا روی متن یا کادر آن کلیک کنید.','First click a text item.'));return;}if(v===''||v===null||v===false)delete style[k];else style[k]=v;api.rerender();api.commit();}
    function apply(k,css,val,wholeVal=val){if(target()){formatSelection(css,val);updateTypeTarget();}else whole(k,wholeVal);}
    function currentElement(){if(target()){const n=savedTextRange.startContainer;return n.nodeType===1?n:n.parentElement;}const blockEl=shell.querySelector('.b[data-id="'+CSS.escape(block.id)+'"]');if(!blockEl)return null;if(key==='heading')return blockEl.querySelector('[data-type-key="heading"]');if(key==='body')return blockEl.querySelector('[data-type-key="body"]');if(m)return blockEl.querySelector('[data-type-key="mini:'+m[1]+'"]');return contextState.instance?Array.from(blockEl.querySelectorAll('[data-ds-part-instance]')).find(e=>e.dataset.dsPartInstance===contextState.instance):null;}
    function hasDecoration(name){let el=currentElement();while(el&&shell.contains(el)){if(getComputedStyle(el).textDecorationLine.includes(name))return true;el=el.parentElement;}return false;}
    function currentBackground(){let el=currentElement();while(el&&shell.contains(el)){const bg=el.style?.backgroundColor;if(bg&&bg!=='transparent'&&bg!=='rgba(0, 0, 0, 0)')return bg;if(el===savedTextNode)break;el=el.parentElement;}return '';}
    function editableForBox(){const el=currentElement();if(!el)return null;const node=el.matches?.('[data-edit][data-rich="1"]')?el:el.querySelector?.('[data-edit][data-rich="1"]');return node||null;}
    function boxTextBackground(){const node=editableForBox();if(!node)return style?.highlight||'';const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text,colors=[];while((text=walker.nextNode())){if(!text.data.trim())continue;let el=text.parentElement,bg='';while(el&&node.contains(el)){const v=el.style?.backgroundColor;if(v&&v!=='transparent'&&v!=='rgba(0, 0, 0, 0)'){bg=v;break;}if(el===node)break;el=el.parentElement;}colors.push(bg);}return colors.length&&colors.every(Boolean)?colors[0]:(style?.highlight||'');}
    function highlightSelection(color){const node=savedTextNode,range=savedTextRange?.cloneRange();if(!node||!range)return;try{node.focus({preventScroll:true});const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);document.execCommand('styleWithCSS',false,true);if(!document.execCommand('hiliteColor',false,color)){toast(L('تغییر هایلایت در این مرورگر ممکن نبود.','Highlight is not supported in this browser.'));return;}if(sel.rangeCount){savedTextRange=sel.getRangeAt(0).cloneRange();savedTextNode=node;}node.dispatchEvent(new Event('input',{bubbles:true}));commitHistory(doc);queueSave(doc);updateTypeTarget();}catch(err){toast(L('تغییر هایلایت ممکن نبود.','Could not change highlight.'));}}
    function toggleButton(label,glyph,css,on,off,styleKey){const b=createElement('button.btn.btn-sm',{type:'button','aria-label':label,title:label,'aria-pressed':'false'},glyph);b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{const pressed=b.getAttribute('aria-pressed')==='true';apply(styleKey,css,pressed?off:on,pressed?'':(styleKey==='weight'?'700':true));b.setAttribute('aria-pressed',String(!pressed));});return b;}
    const bold=toggleButton(L('بولد','Bold'),'B','font-weight','700','400','weight'),italic=toggleButton(L('ایتالیک','Italic'),'I','font-style','italic','normal','italic'),underline=toggleButton(L('زیرخط','Underline'),'U','text-decoration','underline','none','underline'),strike=toggleButton(L('خط‌خورده','Strike through'),'S','text-decoration','line-through','none','strike');
    const scriptButton=(label,glyph,value)=>{const b=createElement('button.btn.btn-sm',{type:'button','aria-label':label,title:label,'aria-pressed':'false'},glyph);b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{const active=b.getAttribute('aria-pressed')==='true';apply('verticalAlign','vertical-align',active?'baseline':value,active?'':value);b.setAttribute('aria-pressed',String(!active));});return b;};const sup=scriptButton(L('بالانویس','Superscript'),'x²','super'),sub=scriptButton(L('پایین‌نویس','Subscript'),'x₂','sub');
    const toggleHighlight=createElement('input',{type:'checkbox','aria-label':L('فعال کردن هایلایت','Enable highlight')}),highlightColor=createElement('input',{type:'color',value:style?.highlight||lastHighlightColor,'aria-label':L('رنگ هایلایت','Highlight color')});
    function boxHighlight(color){let node=editableForBox();if(style?.highlight){delete style.highlight;api.rerender();api.commit();node=editableForBox();}if(!node){whole('highlight',color==='transparent'?'':color);return;}const r=document.createRange();r.selectNodeContents(node);savedTextRange=r;savedTextNode=node;highlightSelection(color);window.getSelection().removeAllRanges();savedTextRange=null;savedTextNode=null;updateTypeTarget();}
    toggleHighlight.checked=!!style?.highlight;toggleHighlight.addEventListener('change',()=>{const value=toggleHighlight.checked?highlightColor.value:'transparent';if(target()){if(value==='transparent'&&style?.highlight){toast(L('ابتدا هایلایت قدیمی کادر را در حالت انتخاب کادر خاموش کنید.','First turn off the legacy item highlight with the item selected.'));toggleHighlight.checked=true;return;}highlightSelection(value);}else boxHighlight(value);});highlightColor.addEventListener('input',()=>{lastHighlightColor=highlightColor.value;if(!toggleHighlight.checked)return;if(target())highlightSelection(highlightColor.value);else boxHighlight(highlightColor.value);});
    const font=createElement('select.select',{'aria-label':L('فونت','Font')});[['',L('فونت پیش‌فرض','Default font')],...['Vazirmatn','Inter','Georgia','system-ui','monospace','Arial','Tahoma','Times New Roman','Courier New'].map(v=>[v,v])].forEach(([value,text])=>font.appendChild(createElement('option',{value,text})));font.value=style?.font||'';font.addEventListener('change',()=>apply('font','font-family',font.value||'inherit',font.value));
    const size=createElement('input.input',{type:'number',min:8,max:120,step:1,value:style?.size||16,'aria-label':L('اندازه فونت','Font size')});size.addEventListener('change',()=>{const n=Math.max(8,Math.min(120,Number(size.value)||16));size.value=String(n);apply('size','font-size',n+'px',n);});
    const weight=createElement('select.select',{'aria-label':L('ضخامت فونت','Font weight')});[['',L('ضخامت پیش‌فرض','Default weight')],...['400','500','600','700','800'].map(v=>[v,v])].forEach(([value,text])=>weight.appendChild(createElement('option',{value,text})));weight.value=style?.weight||'';weight.addEventListener('change',()=>apply('weight','font-weight',weight.value||'normal',weight.value));
    const color=createElement('input',{type:'color',value:style?.color||'#283de0','aria-label':L('رنگ متن','Text color')});color.addEventListener('input',()=>apply('color','color',color.value));
    const effects={shadow:'2px 2px 3px rgba(0,0,0,.45)',glow:'0 0 7px #61a8ff,0 0 16px #408aff',emboss:'1px 1px 0 #fff,-1px -1px 0 #555',outline:'-1px -1px 0 #111,1px -1px 0 #111,-1px 1px 0 #111,1px 1px 0 #111'};
    const effect=createElement('select.select',{'aria-label':L('افکت متن','Text effect')});[['',L('بدون افکت','No effect')],['shadow',L('سایه','Shadow')],['glow',L('درخشان','Glow')],['emboss',L('برجسته','Emboss')],['outline',L('دورخط','Outline')]].forEach(([value,text])=>effect.appendChild(createElement('option',{value,text})));effect.value=style?.effect||'';effect.addEventListener('change',()=>apply('effect','text-shadow',effects[effect.value]||'none',effect.value));
    const spacing=createElement('select.select',{'aria-label':L('فاصله حروف','Letter spacing')});[['',L('فاصله حروف پیش‌فرض','Default letter spacing')],...[-1,0,1,2,4,6].map(n=>[String(n),n+' px'])].forEach(([value,text])=>spacing.appendChild(createElement('option',{value,text})));spacing.value=style?.letterSpacing===undefined?'':String(style.letterSpacing);spacing.addEventListener('change',()=>apply('letterSpacing','letter-spacing',spacing.value===''?'normal':spacing.value+'px',spacing.value===''?'':Number(spacing.value)));
    const align=createElement('select.select',{'aria-label':L('تراز کادر متن','Text box alignment')});[['',L('تراز پیش‌فرض','Default alignment')],['right',L('راست','Right')],['center',L('وسط','Center')],['left',L('چپ','Left')],['justify',L('دوطرفه','Justify')]].forEach(([value,text])=>align.appendChild(createElement('option',{value,text})));align.value=style?.align||'';align.addEventListener('change',()=>whole('align',align.value));
    const line=createElement('select.select',{'aria-label':L('فاصله خطوط','Line height')});[['',L('فاصله خطوط پیش‌فرض','Default line height')],...['1','1.25','1.5','1.75','2','2.5'].map(n=>[n,n])].forEach(([value,text])=>line.appendChild(createElement('option',{value,text})));line.value=String(style?.lineHeight||'');line.addEventListener('change',()=>apply('lineHeight','line-height',line.value||'normal',line.value?Number(line.value):''));
    updateTypeTarget=()=>{if(!targetStatus.isConnected)return;const selected=target(),el=currentElement(),cs=el?getComputedStyle(el):null;targetStatus.textContent=selected?L('اعمال روی متن انتخاب‌شده','Applying to selected text'):key?L('اعمال روی کادر / جزء انتخاب‌شده','Applying to the selected item'):L('ابتدا روی متن یا کادر آن کلیک کنید.','Click a text item first.');bold.setAttribute('aria-pressed',String(!!cs&&(parseInt(cs.fontWeight)||400)>=600));italic.setAttribute('aria-pressed',String(!!cs&&cs.fontStyle==='italic'));underline.setAttribute('aria-pressed',String(hasDecoration('underline')));strike.setAttribute('aria-pressed',String(hasDecoration('line-through')));sup.setAttribute('aria-pressed',String(cs?.verticalAlign==='super'));sub.setAttribute('aria-pressed',String(cs?.verticalAlign==='sub'));const bg=selected?currentBackground():boxTextBackground();toggleHighlight.checked=!!bg;const toHex=v=>{if(/^#[0-9a-f]{6}$/i.test(v||''))return v;const parts=(v||'').match(/[\d.]+/g);return parts&&parts.length>=3?'#'+parts.slice(0,3).map(n=>Math.max(0,Math.min(255,Number(n))).toString(16).padStart(2,'0')).join(''):null;};if(document.activeElement!==highlightColor&&bg){const hex=toHex(bg);if(hex)highlightColor.value=hex;}if(cs){if(document.activeElement!==size){const n=parseFloat(cs.fontSize);if(n>=8&&n<=120)size.value=String(Math.round(n));}if(document.activeElement!==font){const family=cs.fontFamily.split(',')[0].replace(/[\"']/g,'').trim().toLowerCase();font.value=Array.from(font.options).find(o=>o.value.toLowerCase()===family)?.value||'';}if(document.activeElement!==weight){const w=String(parseInt(cs.fontWeight)||400);weight.value=Array.from(weight.options).some(o=>o.value===w)?w:'';}if(document.activeElement!==color){const hex=toHex(cs.color);if(hex)color.value=hex;}}align.disabled=selected;align.title=selected?L('تراز فقط برای کادر اعمال می‌شود','Alignment applies to the whole item'):'';};
    const result=createElement('details.typography-editor',{},[createElement('summary',{text:L('تایپوگرافی','Typography')}),targetStatus,createElement('div.type-actions',{},[bold,italic,underline,strike,sup,sub]),api.field(L('فونت','Font'),font),api.field(L('اندازه (px)','Size (px)'),size),api.field(L('ضخامت','Weight'),weight),createElement('label.type-color',{},[L('رنگ متن','Text color'),color]),createElement('div.type-highlight',{},[createElement('label.switch',{},[toggleHighlight,L('هایلایت','Highlight')]),highlightColor]),api.field(L('افکت متن','Text effect'),effect),api.field(L('فاصله حروف','Letter spacing'),spacing),api.field(L('فاصله خطوط','Line height'),line),api.field(L('تراز کادر','Item alignment'),align)]);requestAnimationFrame(updateTypeTarget);return result;
  }

  /* ---------- properties ---------- */
  function propsRender() {
    const same=propsLastId===selectedId, oldScroll=same?rightPanel.scrollTop:0;
    const oldDetails=new Map(same?Array.from(propBody.querySelectorAll('details')).map((d,i)=>[(d.querySelector('summary')?.textContent||'')+'#'+i,d.open]):[]);
    propsLastId=selectedId;
    try {
    clear(propBody);
    const block = doc.blocks.find((b) => b.id === selectedId);
    if (!block) {
      propBody.appendChild(createElement('div.prop-empty', { text: t('editor.selectHint') }));
      return;
    }
    const def = registry.get(block.type);
    const api = propsApi(block, {
      onChange: ({ commit } = {}) => markChange({ commit: !!commit }),
      doc, refresh: () => propsRender(),
      rerender: () => { rerenderBlock(block.id); if (block.type === 'table') { refreshTableFooter(block); refreshLinkedCharts(block.id); } },
      onChangeCommit: () => markChange({ commit: true })
    });

    const head = createElement('div.prop-group', {}, [
      createElement('h4', {}, [
        createElement('span.prop-title', {}, [icon(def?.type || 'layout'), t(def?.labelKey || 'block.text')]),
        createElement('span.spacer'),
        createElement('button.icon-btn', { title: t('btn.duplicate'), onclick: () => duplicateBlock(block.id) }, icon('copy')),
        createElement('button.icon-btn', { title: t('btn.delete'), onclick: () => removeBlock(block.id) }, icon('trash'))
      ]),
      createElement('div.row', { style: { gap: '.3rem' } }, [
        createElement('button.btn.btn-sm', { style: { flex: '1' }, onclick: () => moveBlock(block.id, -1) }, [icon('up'), enUI?'Up':'بالا']),
        createElement('button.btn.btn-sm', { style: { flex: '1' }, onclick: () => moveBlock(block.id, 1) }, [icon('down'), enUI?'Down':'پایین'])
      ])
    ]);
    propBody.appendChild(head);

    if(contextState.id===block.id&&(contextState.part||contextState.path)){
      const spec=partSpecs(block.type,shell.querySelector('.b[data-id="'+CSS.escape(block.id)+'"]')).find(x=>x[0]===contextState.part),path=contextState.path;
      const L0=(fa,en)=>enUI?en:fa;const items=[createElement('p.hint',{text:spec?(enUI?spec[2]:spec[1]):L0('جزء انتخاب‌شده','Selected part')})];
      if(path&&path!=='html'){const keys=path.split('.');let obj=block.data;for(const key of keys.slice(0,-1))obj=obj?.[key];const key=keys.at(-1),plainKey=key==='textHTML'?'text':key;if(obj&&typeof obj[plainKey]!=='object')items.push(api.text(L0('متن جزء انتخاب‌شده','Selected part text'),obj[plainKey],v=>{obj[plainKey]=v;if(key==='textHTML')delete obj.textHTML;api.rerender();},{multiline:String(obj[plainKey]||'').length>60}));}
      const part=contextState.part,ix=contextState.iconIndex;
      let imageObj=null,imageKey='iconImage';if(block.type==='hero'&&part==='icon')imageObj=block.data;if(block.type==='stat-grid'&&part==='icon'&&ix!=null)imageObj=block.data.stats?.[ix];if(block.type==='timeline'&&part==='dot'&&ix!=null)imageObj=block.data.items?.[ix];if(block.type==='divider'&&part==='line'&&block.data.style==='ornament'){imageObj=block.data;imageKey='ornamentImage';}if(block.type==='logo'&&part==='image'){imageObj=block.data;imageKey='src';}if(imageObj){items.push(imagePicker(api,imageObj,imageKey,L0('تصویر جزء انتخاب‌شده','Selected part image'),block.type==='logo'?(src)=>fitLogoToImage(block,src):null));if(block.type!=='logo')items.push(...iconDesignControls(api,imageObj,L0,block.type==='stat-grid'?'stat':block.type));else items.push(api.range(L0('عرض لوگو (px)','Logo width (px)'),imageObj.width||140,v=>{imageObj.width=v;if(block.style.logoFitWidthPx)block.style.logoFitWidthPx=v;api.rerender()},{min:20,max:500,unit:'px'}),api.seg(L0('تراز لوگو','Logo alignment'),imageObj.align||'', [{value:'left',label:L0('چپ','Left')},{value:'center',label:L0('وسط','Center')},{value:'right',label:L0('راست','Right')}],v=>{imageObj.align=v;if(block.style.partAlignment)delete block.style.partAlignment.image;if(block.style.partInstances)delete block.style.partInstances['image:0'];api.rerender();api.commit();}));}
      if(spec&&contextState.instance&&!imageObj){const instance=contextState.instance,isCell=block.type==='table'&&/^(h|r|f):/.test(instance),mapName=isCell?'cellAlign':'partInstances';items.push(api.seg(L0('تراز همین جزء','Align this part'),block.style[mapName]?.[instance]||'', [{value:'left',label:L0('چپ','Left')},{value:'center',label:L0('وسط','Center')},{value:'right',label:L0('راست','Right')},{value:'',label:L0('پیش‌فرض','Default')}],v=>{const next={...(block.style[mapName]||{})};if(v)next[instance]=v;else delete next[instance];api.setStyle({[mapName]:next});api.commit();}));}
      if(spec)items.push(api.range(L0('شفافیت جزء انتخاب‌شده','Selected part opacity'),block.style.partOpacity?.[spec[0]]??100,v=>api.setStyle({partOpacity:{...(block.style.partOpacity||{}),[spec[0]]:v}}),{min:0,max:100,unit:'%'}));
      if(activePart?.dataset.reorderGroup){const peers=Array.from(activePart.parentElement.children).filter(x=>x.dataset.reorderGroup===activePart.dataset.reorderGroup&&x.dataset.reorderKey);items.push(createElement('div.row',{},[['up','↑',L0('بالا','Up')],['left','←',L0('چپ','Left')],['right','→',L0('راست','Right')],['down','↓',L0('پایین','Down')]].map(([dir,glyph,label])=>createElement('button.btn.btn-sm',{type:'button',disabled:!directionalPeer(activePart,peers,dir),'aria-label':L0('انتقال جزء به ','Move item ')+label,onclick:()=>{const target=directionalPeer(activePart,peers,dir);if(!target||!activePart?.isConnected)return;dragPart={group:activePart.dataset.reorderGroup,parent:activePart.parentElement,block,key:activePart.dataset.reorderKey,target};finishPart();}},glyph))));}
      const group=api.group(L0('جزء انتخاب‌شده','Selected part'),items);group.dataset.selectedPart=contextState.part||'content';propBody.appendChild(group);
    }
    propBody.appendChild(typographyControls(block,api));
    try {
      const nodes = def && def.renderProps ? def.renderProps(block, api) : [];
      const list=Array.isArray(nodes)?nodes:[nodes];const content=list.find(n=>n?.classList?.contains('prop-group')&&n.querySelector('h4')?.textContent===t('prop.content'));
      if(content)content.appendChild(miniBlockControls(block,api));else {const group=api.group(t('prop.content'),[miniBlockControls(block,api)]);list.unshift(group);}
      list.forEach(n=>{if(n)propBody.appendChild(n);});
    }catch(err){console.error('[props]',err);}
    const opacityItems=[
      api.range(t('prop.opacity'),block.style.opacity??100,v=>api.setStyle({opacity:v}),{min:0,max:100,unit:'%'}),
      api.range(enUI?'Text opacity':'نمایش متن',block.style.textOpacity??100,v=>api.setStyle({textOpacity:v}),{min:0,max:100,unit:'%'}),
      api.range(enUI?'Media opacity':'نمایش تصویر/نمودار',block.style.graphicsOpacity??100,v=>api.setStyle({graphicsOpacity:v}),{min:0,max:100,unit:'%'}),
      api.range(enUI?'Custom background opacity':'نمایش رنگ زمینه دلخواه',block.style.bgOpacity??100,v=>api.setStyle({bgOpacity:v}),{min:0,max:100,unit:'%'}),
      createElement('p.hint',{text:enUI?'Custom background opacity requires a background color. At 0% element opacity, select again from Layers.':'شفافیت زمینه برای رنگ دلخواه اعمال می‌شود. در ۰٪ نمایش کل، المان را از فهرست لایه‌ها انتخاب کنید.'})
    ];

    const L=(fa,en)=>enUI?en:fa;
    const num=(label,value,min,max,onValue)=>{const input=createElement('input.input',{type:'number',min,max,value:value??0,'aria-label':label});input.addEventListener('input',()=>{if(input.value!=='')onValue(Math.max(min,Math.min(max,Number(input.value)||0)));});input.addEventListener('change',()=>api.commit());return api.field(label,input);};
    const backgroundColor=api.color(L('رنگ زمینه المان','Block background color'),block.style.bgColor,v=>api.setStyle({bgColor:v,bgGradient:null,bgImage:''}));
    const gradA=createElement('input',{type:'color',value:block.style.bgGradient?.a||'#4f8cff','aria-label':L('رنگ اول گرادیان','Gradient first color')}),gradB=createElement('input',{type:'color',value:block.style.bgGradient?.b||'#6c5ce7','aria-label':L('رنگ دوم گرادیان','Gradient second color')}),angle=createElement('input.input',{type:'number',min:0,max:360,value:block.style.bgGradient?.angle??135,'aria-label':L('زاویه گرادیان','Gradient angle')});
    const useGradient=()=>{api.setStyle({bgGradient:{a:gradA.value,b:gradB.value,angle:Math.max(0,Math.min(360,Number(angle.value)||0))},bgColor:'',bgImage:''});};
    [gradA,gradB,angle].forEach(el=>{el.addEventListener('input',useGradient);el.addEventListener('change',()=>api.commit());});
    const bgImage=createElement('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif','aria-label':L('تصویر زمینه المان','Block background image')});
    bgImage.addEventListener('change',()=>{const f=bgImage.files?.[0];if(!f)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(f.type)||f.size>1.2*1024*1024){toast(L('تصویر PNG/JPEG/WebP/GIF تا ۱٫۲ مگابایت انتخاب کنید.','Choose PNG/JPEG/WebP/GIF up to 1.2 MB.'),'err');return;}const reader=new FileReader();reader.onload=()=>{api.setStyle({bgImage:reader.result,bgColor:'',bgGradient:null});api.commit();propsRender();};reader.readAsDataURL(f);});
    const gradientControls=createElement('div.row',{},[gradA,gradB,angle]);
    const bgType=block.style.bgImage?'image':block.style.bgGradient?'gradient':'color';
    const bgSelect=api.select(L('نوع زمینه','Background type'),bgType,[{value:'color',label:L('رنگ','Color')},{value:'gradient',label:L('گرادیان','Gradient')},{value:'image',label:L('تصویر','Image')}],v=>{if(v==='color')api.setStyle({bgColor:block.style.bgColor||'#ffffff',bgGradient:null,bgImage:''});else if(v==='gradient')api.setStyle({bgColor:'',bgGradient:{a:'#4f8cff',b:'#6c5ce7',angle:135},bgImage:''});else api.setStyle({bgColor:'',bgGradient:null,bgImage:''});block.style.bgType=v;api.commit();propsRender();});
    const chosenBg=block.style.bgType||bgType;bgSelect.querySelector('select').value=chosenBg;
    const bgHint=createElement('p.hint',{text:L('رنگ، گرادیان یا تصویر یکی را انتخاب کنید. شفافیت زمینه مستقل از محتوا تنظیم می‌شود.','Choose color, gradient or image. Background opacity is independent of content opacity.')});

    propBody.appendChild(api.group(L('زمینه، ابعاد و گوشه‌ها','Background, dimensions & corners'),[
      bgSelect,chosenBg==='color'?backgroundColor:null,chosenBg==='gradient'?api.field(L('گرادیان: دو رنگ و زاویه','Gradient: colors & angle'),gradientControls):null,chosenBg==='image'?api.field(L('تصویر زمینه المان','Block background image'),bgImage):null,
      block.style.bgImage?createElement('p.hint',{text:L('تصویر زمینه انتخاب شده است.','A background image is selected.')}):null,
      api.button(L('حذف زمینه سفارشی','Clear custom background'),()=>{api.setStyle({bgColor:'',bgGradient:null,bgImage:'',bgType:'color'});api.commit();propsRender();}),bgHint,
      num(L('عرض المان (%)','Block width (%)'),block.style.blockWidth??100,doc.settings.freeLayout?5:20,100,v=>{delete block.style.logoFitWidthPx;api.setStyle({blockWidth:Math.min(v,doc.settings.freeLayout?100-(Number(block.style.freeX)||0):100)});}),
      ...(doc.settings.freeLayout?[num(L('موقعیت افقی (%)','Horizontal position (%)'),block.style.freeX??0,0,95,v=>api.setStyle({freeX:Math.min(v,100-(Number(block.style.blockWidth)||100))})),num(L('موقعیت عمودی (px)','Vertical position (px)'),block.style.freeY??0,0,50000,v=>api.setStyle({freeY:v}))]:[]),
      num(L('حداقل ارتفاع (px)','Minimum height (px)'),block.style.minHeight??block.style.blockHeight??0,0,2000,v=>{delete block.style.blockHeight;api.setStyle({minHeight:v})}),
      num(L('گردی گوشه‌ها (px)','Corner radius (px)'),block.style.borderRadius===''||block.style.borderRadius==null?0:parseInt(block.style.borderRadius)||0,0,120,v=>api.setStyle({borderRadius:v})),
      createElement('p.hint',{text:L('المان با محتوای بلند خودکار بزرگ می‌شود؛ حداقل ارتفاع باعث بریدن آن نمی‌شود.','Blocks expand to fit content; minimum height does not crop it.')}),
      api.button(L('بازنشانی اندازه و گوشه‌ها','Reset dimensions & corners'),()=>{block.style.borderRadius='';delete block.style.blockWidth;delete block.style.logoFitWidthPx;if(doc.settings.freeLayout)block.style.blockWidth=100-(Number(block.style.freeX)||0);delete block.style.blockHeight;delete block.style.minHeight;api.rerender();api.commit();propsRender();})
    ]));
    const blockEl=shell.querySelector('.b[data-id="'+CSS.escape(block.id)+'"]');
    const detail=partSpecs(block.type,blockEl);
    if(detail.length){
      const ranges=detail.map(([key,fa,en])=>api.range(L(fa,en),block.style.partOpacity?.[key]??100,v=>api.setStyle({partOpacity:{...(block.style.partOpacity||{}),[key]:v}}),{min:0,max:100,unit:'%'}));
      opacityItems.push(...ranges);
    }
    if(block.type==='table' && contextState.id===block.id){
      const c=contextState.col,rr=contextState.row,cellKey=rr===null?'h:'+c:rr==='footer'?'f:'+c:'r:'+rr+':'+c;
      opacityItems.push(api.range(L('شفافیت متن خانه','Selected cell text opacity'),block.style.cellOpacity?.[cellKey]??100,v=>api.setStyle({cellOpacity:{...(block.style.cellOpacity||{}),[cellKey]:v}}),{min:0,max:100,unit:'%'}));
    }
    propBody.appendChild(api.group(L('شفافیت المان','Element opacity'),opacityItems));

    propBody.appendChild(api.group(L('ترتیب روی‌هم قرارگیری','Stacking order'),[createElement('div.row',{},[[L('روی همه','Front'),'front'],[L('جلو','Forward'),'forward'],[L('عقب','Backward'),'back'],[L('زیر همه','Back'),'bottom']].map(([label,action])=>createElement('button.btn.btn-sm',{type:'button','data-panel-stack':action,onclick:()=>changeStack(block.id,action)},label))),createElement('p.hint',{text:L('این ترتیب مستقل از ترتیب متن و چاپ است.','This order is independent of document and print flow.')})]));
    propBody.appendChild(api.group(L('تراز خودکار','Auto align'),[
      createElement('p.hint',{text:L('تراز خود المان نسبت به عرض صفحه؛ تراز محتوا مستقل است.','Align the block to the page; content alignment is separate.')}),
      createElement('div.row',{},[['left',L('چپ','Left')],['center',L('وسط','Center')],['right',L('راست','Right')]].map(([side,label])=>createElement('button.btn.btn-sm',{'data-align-block':side,type:'button',onclick:()=>alignBlock(block,side)},label))),
      api.seg(L('تراز محتوای المان','Block content alignment'),block.style.textAlign||'', [{value:'left',label:L('چپ','Left')},{value:'center',label:L('وسط','Center')},{value:'right',label:L('راست','Right')}],v=>{api.setStyle({textAlign:v});api.commit();}),
      ...(detail.length?[api.select(L('جزء برای تراز','Part to align'),contextState.part||detail[0][0],detail.map(([value,fa,en])=>({value,label:L(fa,en)})),v=>{contextState.part=v;propsRender();}),api.seg(L('تراز جزء انتخابی','Selected part alignment'),block.style.partAlignment?.[contextState.part||detail[0][0]]||'', [{value:'left',label:L('چپ','Left')},{value:'center',label:L('وسط','Center')},{value:'right',label:L('راست','Right')},{value:'',label:L('پیش‌فرض','Default')}],v=>{const key=contextState.part||detail[0][0];api.setStyle({partAlignment:{...(block.style.partAlignment||{}),[key]:v}});api.commit();})]:[])
    ]));

    const advanced=createElement('div.prop-advanced'); commonStyleProps(api).forEach((n) => advanced.appendChild(n)); propBody.appendChild(advanced);
    } finally {
      propBody.querySelectorAll('details').forEach((d,i)=>{const key=(d.querySelector('summary')?.textContent||'')+'#'+i;if(oldDetails.has(key))d.open=oldDetails.get(key);});
      rightPanel.scrollTop=oldScroll;
    }
  }

  /* ---------- drawers ---------- */
  function toggleDrawer(side) {
    if (window.innerWidth > 900) {
      if(side==='right'&&editor.querySelector('.ed-body').classList.contains('inspector-overlay')){editor.querySelector('.ed-body').classList.remove('inspector-overlay');return;}
      const cls = side === 'left' ? 'no-left' : 'no-right';
      const bodyEl = $('.ed-body', editor);
      bodyEl.classList.toggle(cls);
      fitZoom();
      return;
    }
    const panel = side === 'left' ? leftPanel : rightPanel;
    const isOpen = panel.classList.contains('open');
    closeDrawers();
    if (!isOpen) {
      panel.classList.add('open');
      document.body.classList.add('drawer-open');
    }
  }
  function closeDrawers() {
    editor.querySelector('.ed-body')?.classList.remove('inspector-overlay');
    leftPanel.classList.remove('open');
    rightPanel.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }

  /* The modal renders an actual viewport in an iframe, so CSS media queries see the selected width. */
  function openResponsivePreview(target) {
    const en = getLang()==='en';
    const frame = createElement('iframe.responsive-preview-frame', {title:en?'Page preview':'پیش‌نمایش صفحه',style:{width:'1200px',height:'530px',border:'0',background:'#0c1223'}});
    const wrap = createElement('div.preview-scroll',{},[frame]);
    const label=createElement('span.preview-width-label',{text:'1200 px'});
    const controls=createElement('div.preview-controls',{},[
      ...[['375',en?'Mobile':'موبایل'],['768',en?'Tablet':'تبلت'],['1200',en?'Desktop':'دسکتاپ']].map(([w,text])=>createElement('button.btn.btn-sm',{onclick:()=>{frame.style.width=w+'px';label.textContent=w+' px';}},text)),label
    ]);
    const hint=createElement('p.hint',{text:en?'Read-only preview. Resize presets simulate the viewport width; scroll horizontally if necessary.':'پیش‌نمایش فقط خواندنی است؛ دکمه‌ها عرض واقعی قاب را تغییر می‌دهند. در صورت نیاز افقی پیمایش کنید.'});
    openModal({title:en?'Responsive preview':'پیش‌نمایش واکنش‌گرا',size:'lg',body:createElement('div',{},[controls,hint,wrap]),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},t('btn.close'))]});
    buildExportHTML(target,{mode:'readonly'}).then(html=>{if(frame.isConnected)frame.srcdoc=html;}).catch(err=>{console.error(err);hint.textContent=en?'Could not render preview.':'ساخت پیش‌نمایش ناموفق بود.';});
  }

  function openPresets() {
    const en=getLang()==='en'; let selected=null, baseSelected=null;
    const cards=createElement('div.preset-cards'), preview=createElement('iframe.preset-preview',{title:en?'Preset preview':'پیش‌نمایش پریست',sandbox:'allow-scripts'});
    const previewStatus=createElement('p.hint.preset-preview-status',{role:'status','aria-live':'polite',text:en?'Loading current document…':'در حال بارگذاری سند فعلی…'});let previewRequest=0;
    const include=createElement('input',{type:'checkbox'}); include.checked=true;
    const radiusEnabled=createElement('input',{type:'checkbox','aria-label':en?'Apply corner radius':'اعمال گردی گوشه‌ها'}),radius=createElement('input.range',{type:'range',min:0,max:120,step:1,value:12,'aria-label':en?'Preset corner radius':'گردی گوشه‌ها در پریست'}),radiusNumber=createElement('input.input',{type:'number',min:0,max:120,step:1,value:12,'aria-label':en?'Corner radius value':'مقدار گردی گوشه‌ها'});const applyRadius=d=>{if(radiusEnabled.checked)d.blocks.forEach(b=>{b.style ||= {};b.style.borderRadius=Number(radius.value);});};
    const info=createElement('p.hint',{text:en?'Preview uses the current document. Select a preset and color to compare without changing it.':'پیش‌نمایش با محتوای همین سند ساخته می‌شود؛ پریست و رنگ را بدون تغییر سند مقایسه کنید.'});
    const applyBtn=createElement('button.btn.btn-primary',{disabled:true,onclick:()=>{
      if(!selected&&!radiusEnabled.checked)return;
      if(selected)applyAppearance(doc,selected,include.checked); applyRadius(doc); commitHistory(doc); queueSave(doc); fillThemes(); canvasRender(); layersRender(); propsRender();
      closeModal(); toast(en?'Preset applied — use Undo to revert.':'پریست اعمال شد؛ برای بازگشت از واگرد استفاده کنید.','ok');
    }},en?'Apply preset':'اعمال پریست');
    async function show(preset){
      selected=preset;applyBtn.disabled=!preset&&!radiusEnabled.checked;
      cards.querySelectorAll('button[data-preset]').forEach(b=>b.classList.toggle('selected',!!preset && b.dataset.preset===preset.id));
      const request=++previewRequest;previewStatus.textContent=en?'Updating preview…':'در حال به‌روزرسانی پیش‌نمایش…';
      const clone=JSON.parse(JSON.stringify(doc));if(preset)applyAppearance(clone,preset,include.checked);applyRadius(clone);
      try{
        const html=await buildExportHTML(clone,{mode:'readonly',animations:false,uiLang:getLang()});
        if(!preview.isConnected||request!==previewRequest)return;
        preview.onload=()=>{if(request===previewRequest)previewStatus.textContent=en?'Preview ready — scroll inside it.':'پیش‌نمایش آماده است؛ درون آن پیمایش کنید.';};
        preview.srcdoc=html.replace('</head>','<style>.doc-toolbar{display:none!important}body{padding-top:0!important}</style></head>');
      }catch(error){if(request===previewRequest && preview.isConnected){previewStatus.textContent=en?'Preview could not be generated.':'ساخت پیش‌نمایش ناموفق بود.';console.error(error);}}
    }
    function fill(){
      clear(cards);
      const customThemes=getThemes().filter(x=>x.custom).map(x=>({id:'theme-'+x.id,name:x.label,desc:{fa:'تم سفارشی سند',en:'Custom document theme'},theme:x.id,surface:'light',width:'wide',layout:'flow',effect:'none',color:/^#[0-9a-f]{6}$/i.test(x.vars?.['--d-accent']||'')?x.vars['--d-accent']:'#4f8cff'}));
      [...PRESETS,...customThemes,...getCustomPresets()].forEach(p=>{
        const name=p.name[en?'en':'fa'] || p.name.fa;
        const card=createElement('button.preset-card',{type:'button','data-preset':p.id,onclick:()=>{baseSelected=p;variants.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.variant==='default')));show(p);}},[
          createElement('span.preset-swatch', {style:{background:p.surface==='light'?'#f1f5fa':'#11172a',borderColor:p.color}},[createElement('i',{style:{background:p.color}}),createElement('i',{style:{background:p.color}})]),
          createElement('strong',{text:name}),createElement('small',{text:p.desc?.[en?'en':'fa']||''})
        ]);
        cards.append(card);
      });
    }
    const variants=createElement('div.preset-variants',{role:'group','aria-label':en?'Preset color options':'رنگ‌های پریست'});
    const paletteChoices=[['default',en?'Original':'اصلی',null],['ocean',en?'Ocean':'اقیانوسی',{a:'#2457a6',b:'#146875'}],['violet',en?'Violet':'بنفش',{a:'#6039a2',b:'#aa315b'}],['forest',en?'Forest':'جنگلی',{a:'#176b57',b:'#266393'}],['sunset',en?'Sunset':'غروب',{a:'#a23733',b:'#8a4a12'}],['slate',en?'Slate':'خاکستری',{a:'#3b4b63',b:'#314c77'}],['berry',en?'Berry':'تمشکی',{a:'#8d275c',b:'#593995'}],['teal',en?'Teal':'فیروزه‌ای',{a:'#106b75',b:'#176250'}]];
    paletteChoices.forEach(([id,label,palette])=>variants.appendChild(createElement('button.preset-color',{type:'button','data-variant':id,title:label,'aria-label':label,'aria-pressed':String(id==='default'),style:{background:palette?`linear-gradient(135deg,${palette.a},${palette.b})`:'var(--panel)',color:palette?'white':'var(--text)'},onclick:()=>{if(!baseSelected){toast(en?'Select a preset first':'ابتدا یک پریست انتخاب کنید');return;}variants.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.variant===id)));show({...baseSelected,palette:palette||baseSelected.palette||null,color:palette?.a||baseSelected.color});}},id==='default'?'◌':'●')));
    include.addEventListener('change',()=>show(selected));radiusEnabled.addEventListener('change',()=>show(selected));radius.addEventListener('input',()=>{radiusEnabled.checked=true;radiusNumber.value=radius.value;show(selected);});radiusNumber.addEventListener('input',()=>{if(radiusNumber.value==='')return;radius.value=String(Math.max(0,Math.min(120,Number(radiusNumber.value)||0)));radiusEnabled.checked=true;show(selected);});
    const save=createElement('button.btn.btn-sm',{onclick:async()=>{const name=await promptDialog(en?'Preset name':'نام پریست',{ok:en?'Save':'ذخیره'});if(name?.trim()){try{storeCustomPreset(name.trim(),doc);openPresets();toast(en?'Preset saved':'پریست ذخیره شد','ok');}catch(e){toast(en?'Could not save preset':'ذخیره پریست ناموفق بود','err');}}}},en?'Save current appearance':'ذخیره ظاهر فعلی');
    const buildTheme=createElement('button.btn.btn-sm',{onclick:()=>{openModal({title:en?'Document theme builder':'سازنده تم سند',size:'lg',body:renderThemeBuilder({initialTheme:doc.theme}),footer:[createElement('button.btn.btn-sm',{onclick:()=>openPresets()},en?'Back to presets':'بازگشت به پریست‌ها')]});}},en?'Create document theme':'ساخت تم سند');
    const remove=createElement('button.btn.btn-sm',{onclick:()=>{if(selected?.id.startsWith('custom-')){removeCustomPreset(selected.id);selected=null;applyBtn.disabled=true;fill();}}},en?'Delete selected saved preset':'حذف پریست ذخیره‌شده');
    fill();
    openModal({title:en?'Appearance presets':'پریست‌های ظاهر و چیدمان',size:'lg',body:createElement('div.preset-dialog',{},[
      info,createElement('div.preset-radius',{},[createElement('label.switch',{},[radiusEnabled,en?'Apply corners':'اعمال گردی گوشه‌ها']),radius,radiusNumber,createElement('span',{text:'px'})]),createElement('div.preset-variant-row',{},[createElement('span',{text:en?'Color options':'گزینه‌های رنگی'}),variants]),createElement('label.switch',{},[include,en?'Apply layout and page width too':'اعمال چیدمان و عرض صفحه نیز']),
      createElement('div.preset-layout',{},[cards,createElement('div',{},[previewStatus,createElement('div.preset-preview-wrap',{},[preview])])]),
      createElement('div.row',{style:{marginTop:'12px',flexWrap:'wrap'}},[save,buildTheme,remove])
    ]),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},t('btn.close')),applyBtn]});
    show(null);
  }

  function openWebSettings() {
    const en=getLang()==='en', a=getAppearance(doc), s=doc.settings;
    function selector(aria,items,value){const el=createElement('select.select',{'aria-label':aria});items.forEach(([v,l])=>{el.appendChild(createElement('option',{value:v,text:l}));});el.value=value;return el;}
    const surface=selector(en?'Surface':'پس‌زمینه',[['dark',en?'Dark':'تیره'],['light',en?'Light':'روشن']],a.surface);
    const width=selector(en?'Page width':'عرض صفحه',[['bounded',en?'Bounded':'محدود'],['wide',en?'Wide':'عریض'],['full',en?'Full width':'تمام‌عرض']],a.width);
    const layout=selector(en?'Layout':'چیدمان',[['flow',en?'Single column':'تک‌ستونی'],['grid',en?'Responsive grid':'شبکه‌ای واکنش‌گرا']],a.layout);
    const heroTheme=createElement('input',{type:'checkbox'}); heroTheme.checked=a.themeHero;
    const theme=selector(en?'Theme':'تم',getThemes().map(x=>[x.id,x.label[getLang()]||x.label.fa]),doc.theme);
    const label=(text,node)=>createElement('div.field',{},[createElement('label',{text}),node]);
    openModal({title:en?'Web appearance':'ظاهر استودیوی وب',body:createElement('div.web-appearance-form',{},[
      createElement('p.hint',{text:en?'These settings affect the website and exported HTML, not the print layout.':'این تنظیمات روی نمایش وب و خروجی HTML اثر دارند، نه چیدمان چاپ.'}),
      label(en?'Background':'پس‌زمینه',surface),label(en?'Page width':'عرض صفحه',width),label(en?'Layout':'چیدمان',layout),label(en?'Color theme':'تم رنگی',theme),createElement('label.switch',{},[heroTheme,en?'Use theme colors for hero':'رنگ عنوان اصلی از تم'])
    ]),footer:[createElement('button.btn.btn-sm',{onclick:()=>closeModal()},t('btn.cancel')),
      createElement('button.btn.btn-primary',{onclick:()=>{s.webSurface=surface.value;s.webWidth=width.value;s.webLayout=layout.value;s.webThemeHero=heroTheme.checked;doc.theme=theme.value;doc.settings.webPalette=null;commitHistory(doc);queueSave(doc);fillThemes();canvasRender();closeModal();}},en?'Apply':'اعمال') ]});
  }

  /* A separate native dialog can sit above document settings without discarding its fields. */
  function requestDocumentLanguage(next, settingsSelect = null) {
    const previous = doc.lang;
    if (next === previous) return;
    const en = getLang() === 'en';
    const L=(fa,eng)=>en?eng:fa;
    const template=getTemplate(doc.settings?.sourceTemplateId);
    const dialog=createElement('dialog.language-dialog',{'aria-label':L('تغییر زبان سند','Change document language')});
    const sync=()=>{langSelect.value=doc.lang;if(settingsSelect)settingsSelect.value=doc.lang;};
    const finish=()=>{sync();dialog.close();dialog.remove();};
    const cancel=()=>finish();
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
    dialog.addEventListener('close',()=>dialog.remove());
    const apply=(reset)=>{
      commitHistory(doc);
      if(reset && template){
        const fresh=templateToDoc(template,next);
        doc.blocks=fresh.blocks;doc.theme=fresh.theme;doc.settings=fresh.settings;
        doc.settings.designBaseline=snapshotDesign(doc);
        selectedId=doc.blocks[0]?.id||null;
      }
      doc.lang=next;
      commitHistory(doc);queueSave(doc);sync();fillThemes();canvasRender();layersRender();propsRender();
      finish();
      if(settingsSelect && reset) closeModal();
      toast(reset?L('قالب بازنشانی شد؛ واگرد در دسترس است.','Template reset; Undo is available.'):L('زبان و جهت تغییر کرد؛ محتوای فعلی حفظ شد.','Language and direction changed; existing content was kept.'),'ok');
    };
    const keep=createElement('button.btn.btn-primary',{'data-language-action':'keep',onclick:()=>apply(false)},L('حفظ تغییرات فعلی','Keep current changes'));
    const reset=createElement('button.btn',{'data-language-action':'reset',disabled:!template,onclick:()=>apply(true)},L('بازنشانی قالب به زبان جدید','Reset template in new language'));
    dialog.append(...[createElement('h3',{text:L('تغییر زبان سند','Change document language')}),
      createElement('p',{text:L('حفظ: متن و طراحی فعلی بدون ترجمه حفظ می‌شوند. بازنشانی: محتوا و طراحی با نسخه اصلی قالب جایگزین می‌شوند؛ نام سند حفظ می‌شود. واگرد در دسترس است.','Keep: retain current content and design without translation. Reset: replace content and design with the original template in the new language; the document name stays. Undo is available.')}),
      !template?createElement('p.hint',{text:L('بازنشانی فقط برای سندی که در این نسخه از قالب آماده ساخته شده است ممکن است. محتوای اسناد قدیمی و قالب‌های شخصی حفظ می‌شود.','Reset is only available for documents created from a built-in template in this version. Older and custom-template content is protected.')}):null,
      createElement('div.language-dialog-actions',{},[keep,reset,createElement('button.btn',{'data-language-action':'cancel',onclick:cancel},L('انصراف','Cancel'))])].filter(Boolean));
    document.body.appendChild(dialog);dialog.showModal();keep.focus();
  }

  /* ---------- doc settings modal ---------- */
  function openDocSettings() {
    const en = getLang() === 'en';
    const s = doc.settings;
    const documentLanguage=createElement('select.select',{'aria-label':t('editor.lang')});
    [['fa','فارسی (RTL)'],['en','English (LTR)']].forEach(([value,text])=>documentLanguage.appendChild(createElement('option',{value,text})));
    documentLanguage.value=doc.lang;documentLanguage.addEventListener('change',()=>requestDocumentLanguage(documentLanguage.value,documentLanguage));
    const effectSel = createElement('select.select');
    EFFECTS.forEach((fx) => {
      const o = createElement('option', { value: fx.id, text: fx.label[getLang()] || fx.label.fa });
      if (s.bgEffect === fx.id) o.selected = true;
      effectSel.appendChild(o);
    });
    effectSel.appendChild(createElement('option', { value: 'custom', text: getLang() === 'en' ? 'Custom code' : 'کد دلخواه' }));
    effectSel.value = s.bgEffect || 'particles';
    effectSel.addEventListener('change', () => { s.bgEffect = effectSel.value; commitHistory(doc);queueSave(doc); renderEditorBackground(); });

    const colorIn = createElement('input', { type: 'color', value: s.bgEffectColor || '#4f8cff' });
    colorIn.addEventListener('input', () => { s.bgEffectColor = colorIn.value; queueSave(doc); renderEditorBackground(); });
    colorIn.addEventListener('change',()=>commitHistory(doc));

    const opOut = createElement('span.tiny.muted', { text: Math.round((s.bgEffectOpacity ?? 0.3) * 100) + '%' });
    const opIn = createElement('input.range', { type: 'range', min: '0', max: '100', value: String(Math.round((s.bgEffectOpacity ?? 0.3) * 100)) });
    opIn.addEventListener('input', () => { opOut.textContent = opIn.value + '%'; s.bgEffectOpacity = Number(opIn.value) / 100; queueSave(doc); renderEditorBackground(); });
    opIn.addEventListener('change',()=>commitHistory(doc));

    const speedSel = createElement('select.select');
    [['slow', (getLang()==='en'?'Slow':'آهسته')], ['normal', (getLang()==='en'?'Normal':'معمولی')], ['fast', (getLang()==='en'?'Fast':'سریع')]].forEach(([v, l]) => {
      const o = createElement('option', { value: v, text: l });
      if (s.transitionSpeed === v) o.selected = true;
      speedSel.appendChild(o);
    });
    speedSel.addEventListener('change', () => { s.transitionSpeed = speedSel.value; commitHistory(doc);queueSave(doc); });

    const autoSwitch = createElement('input', { type: 'checkbox' });
    autoSwitch.checked = !!s.autoScroll;
    const autoInterval = createElement('input.input', { type: 'number', min: '2', max: '60', value: String(s.autoScrollInterval || 5), style: { maxWidth: '80px' } });

    const reactiveMove=createElement('input',{type:'checkbox','aria-label':en?'Base animation follows pointer':'واکنش خود انیمیشن به حرکت موس'}),reactiveClick=createElement('input',{type:'checkbox','aria-label':en?'Base animation reacts to clicks':'واکنش خود انیمیشن به کلیک'});reactiveMove.checked=!!s.bgReactMove;reactiveClick.checked=!!s.bgReactClick;
    reactiveMove.addEventListener('change',()=>{s.bgReactMove=reactiveMove.checked;commitHistory(doc);queueSave(doc);renderEditorBackground();});reactiveClick.addEventListener('change',()=>{s.bgReactClick=reactiveClick.checked;commitHistory(doc);queueSave(doc);renderEditorBackground();});
    const interactiveSwitch=createElement('input',{type:'checkbox'});interactiveSwitch.checked=!!s.bgInteractive;
    interactiveSwitch.addEventListener('change',()=>{s.bgInteractive=interactiveSwitch.checked;commitHistory(doc);queueSave(doc);renderEditorBackground();});
    const interactionMode=createElement('select.select',{'aria-label':getLang()==='en'?'Interactive effect type':'نوع واکنش تعاملی'});
    [['trail',getLang()==='en'?'Spark trail':'دنباله درخشان'],['ripples',getLang()==='en'?'Ripples':'موج حلقه‌ای'],['spotlight',getLang()==='en'?'Spotlight':'نور دنبال‌کننده'],['network',getLang()==='en'?'Pointer constellation':'شبکه دنبال‌کننده'],['custom',getLang()==='en'?'Custom code':'کد تعاملی دلخواه']].forEach(([value,text])=>interactionMode.appendChild(createElement('option',{value,text})));
    interactionMode.value=s.bgInteractiveMode||'trail';interactionMode.addEventListener('change',()=>{s.bgInteractiveMode=interactionMode.value;if(s.bgInteractiveMode==='custom'&&!s.customInteraction)s.customInteraction=JSON.parse(JSON.stringify(INTERACTION_EXAMPLE));commitHistory(doc);queueSave(doc);renderEditorBackground();});
    const interactionOpacity=createElement('input.range',{type:'range',min:'0',max:'100',value:String(Math.round((s.bgInteractiveOpacity??.65)*100)),'aria-label':getLang()==='en'?'Interactive effect intensity':'شدت واکنش تعاملی'});
    const interactionOutput=createElement('output',{text:interactionOpacity.value+'%'});
    interactionOpacity.addEventListener('input',()=>{interactionOutput.textContent=interactionOpacity.value+'%';s.bgInteractiveOpacity=Number(interactionOpacity.value)/100;queueSave(doc);renderEditorBackground();});interactionOpacity.addEventListener('change',()=>commitHistory(doc));
    const progressSwitch = createElement('input', { type: 'checkbox' });
    progressSwitch.checked = s.showProgress !== false;

    const animSwitch = createElement('input', { type: 'checkbox' });
    animSwitch.checked = s.animations !== false;

    const footerMode = createElement('select.select',{'aria-label':en?'Document branding':'برچسب ساخته‌شده با'});
    [['inherit',en?'Use app default':'پیش‌فرض برنامه'],['on',en?'Show':'نمایش'],['off',en?'Hide':'عدم نمایش']].forEach(([value,text])=>footerMode.appendChild(createElement('option',{value,text})));
    footerMode.value=['on','off'].includes(s.branding)?s.branding:'inherit';

    const musicInput = createElement('input.input', { value: s.musicUrl || '', placeholder: 'https://…mp3', dir: 'ltr' });

    const musicFile=createElement('input',{type:'file',accept:'audio/*','aria-label':en?'Upload local music':'آپلود موسیقی از دستگاه'});
    const musicInfo=createElement('p.hint',{text:s.musicDataUrl?(en?'Local audio stored with this document.':'موسیقی محلی همراه سند ذخیره شده است.'):(en?'Optional local file, max 1.2 MB; browser storage is limited.':'فایل محلی اختیاری تا ۱٫۲ مگابایت؛ فضای ذخیره مرورگر محدود است.')});
    musicFile.addEventListener('change',()=>{const f=musicFile.files?.[0];if(!f)return;if(!f.type.startsWith('audio/')||f.size>1.2*1024*1024){toast(en?'Choose audio up to 1.2 MB.':'فایل صوتی تا ۱٫۲ مگابایت انتخاب کنید.','err');musicFile.value='';return;}const reader=new FileReader();reader.onload=()=>{s.musicDataUrl=reader.result;s.musicFileName=f.name;musicInfo.textContent=(en?'Local audio: ':'موسیقی محلی: ')+f.name;commitHistory(doc);queueSave(doc);};reader.readAsDataURL(f);});
    const clearMusic=createElement('button.btn.btn-sm',{type:'button',onclick:()=>{delete s.musicDataUrl;delete s.musicFileName;musicFile.value='';musicInfo.textContent=en?'Local audio removed.':'موسیقی محلی حذف شد.';commitHistory(doc);queueSave(doc);}},en?'Remove local audio':'حذف موسیقی محلی');
    const existing = s.customBackground || BACKGROUND_EXAMPLE;
    const codeArea = (label, value) => createElement('textarea.input', { value: value || '', dir: 'ltr', spellcheck: 'false', 'aria-label': label, style: { width:'100%', minHeight:'100px', fontFamily:'monospace', fontSize:'.75rem', whiteSpace:'pre', textAlign:'left' } });
    const htmlCode = codeArea('HTML', existing.html), cssCode = codeArea('CSS', existing.css), jsCode = codeArea('JavaScript', existing.js);
    const saveCode = () => {
      s.customBackground = { html: htmlCode.value, css: cssCode.value, js: jsCode.value };
      s.bgEffect = 'custom'; effectSel.value = 'custom';
      commitHistory(doc); queueSave(doc); renderEditorBackground();
    };
    const codeDetails = createElement('details', { style: { margin:'.7rem 0' } }, [
      createElement('summary', { text: en ? '💻 Custom animated background (HTML / CSS / JS)' : '💻 کدنویسی پس‌زمینه دلخواه (HTML / CSS / JS)', style: { cursor:'pointer', fontWeight:'700' } }),
      createElement('p', { text: en ? 'Runs inside an isolated background iframe. External resources and network requests are blocked by its policy. Only use code you trust; it can still consume CPU or navigate its own frame.' : 'کد در یک iframe جداگانه اجرا می‌شود؛ منابع خارجی و درخواست‌های شبکه با سیاست امنیتی مسدود می‌شوند. فقط کد قابل اعتماد وارد کنید؛ کد همچنان می‌تواند منابع سیستم را مصرف کند یا قاب خود را تغییر مسیر دهد.', style: { fontSize:'.72rem', lineHeight:'1.8' } }),
      createElement('label', { text:'HTML' }), htmlCode,
      createElement('label', { text:'CSS' }), cssCode,
      createElement('label', { text:'JavaScript' }), jsCode,
      createElement('button.btn.btn-sm.btn-primary', { type:'button', onclick: () => { saveCode(); toast(en ? 'Background applied' : 'پس‌زمینه اعمال شد', 'ok'); } }, en ? 'Apply and preview' : 'اعمال و پیش‌نمایش')
    ]);

    const customCode=s.customInteraction||INTERACTION_EXAMPLE;
    const interactionHtml=codeArea('Interactive HTML',customCode.html),interactionCss=codeArea('Interactive CSS',customCode.css),interactionJs=codeArea('Interactive JavaScript',customCode.js);
    const interactionDetails=createElement('details',{},[createElement('summary',{text:en?'Custom interactive code':'کدنویسی واکنش تعاملی'}),createElement('p.hint',{text:en?'Runs in an isolated frame without network access. Listen for message events with data.type = ds-pointer and x, y, event, width, height. Use trusted code only.':'در قاب جداگانه و بدون شبکه اجرا می‌شود. پیام‌های ds-pointer دارای x، y، event، width و height هستند. فقط از کد قابل اعتماد استفاده کنید.'}),createElement('label',{text:'HTML'}),interactionHtml,createElement('label',{text:'CSS'}),interactionCss,createElement('label',{text:'JavaScript'}),interactionJs,createElement('button.btn.btn-sm.btn-primary',{type:'button',onclick:()=>{s.customInteraction={html:interactionHtml.value,css:interactionCss.value,js:interactionJs.value};s.bgInteractive=true;s.bgInteractiveMode='custom';interactionMode.value='custom';interactiveSwitch.checked=true;commitHistory(doc);queueSave(doc);renderEditorBackground();toast(en?'Custom interaction applied':'واکنش دلخواه اعمال شد','ok');}},en?'Apply custom interaction':'اعمال واکنش دلخواه')]);
    const field = (label, node) => createElement('div.field', {}, [createElement('label', { text: label }), node]);

    openModal({
      title: t('editor.docSettings'),
      body: createElement('div', {}, [
        createElement('div.field',{},[createElement('label',{text:t('editor.lang')}),documentLanguage]),
        createElement('div.prop-group', { style: { padding: '0 0 .6rem' } }, [
          createElement('h4', { text: '🎬 ' + t('btn.present') }),
          field(t('export.bgEffect'), effectSel),
          createElement('label.switch',{},[reactiveMove,en?'Move the base animation with pointer':'خود انیمیشن با حرکت موس واکنش نشان دهد']),
          createElement('label.switch',{},[reactiveClick,en?'Pulse the base animation on click':'خود انیمیشن با کلیک واکنش نشان دهد']),
          createElement('label.switch',{style:{display:'flex',marginBottom:'.4rem'}},[interactiveSwitch,en?'Interactive pointer & clicks':'واکنش به حرکت و کلیک']),
          field(en?'Interactive effect type':'نوع واکنش تعاملی',interactionMode),
          interactionDetails,
          field(en?'Interactive intensity':'شدت واکنش تعاملی',createElement('div.row',{},[interactionOpacity,interactionOutput])),
          createElement('p.hint',{text:en?'Web studio, presentation and HTML. Works even when the base effect is None; the simple editor remains still. Background controls apply immediately.':'برای وب، ارائه و HTML؛ حتی با افکت پایه «بدون انیمیشن» فعال است. ویرایش ساده بی‌حرکت می‌ماند. کنترل‌های پس‌زمینه فوراً اعمال می‌شوند.'}),
          codeDetails,
          createElement('div.row', { gap: '.5rem' }, [
            field(t('export.effectColor'), colorIn),
            field(t('export.effectOpacity'), createElement('div.row', {}, [opIn, opOut]))
          ]),
          field((getLang()==='en'?'Transition speed':'سرعت ترنزیشن'), speedSel),
          createElement('label.switch', { style: { display: 'flex', marginBottom: '.4rem' } }, [autoSwitch, (getLang()==='en'?'Auto-scroll between blocks':'اسکرول خودکار بین بلوک\u200cها')]),
          field((getLang()==='en'?'Auto-scroll interval (seconds)':'فاصله اسکرول خودکار (ثانیه)'), autoInterval),
          createElement('label.switch', { style: { display: 'flex', marginBottom: '.4rem' } }, [progressSwitch, (getLang()==='en'?'Show progress bar':'نمایش نوار پیشرفت')]),
          createElement('label.switch', { style: { display: 'flex', marginBottom: '.4rem' } }, [animSwitch, t('export.blockAnims')]),
          field(en?'Made with Document Studio label':'برچسب ساخته‌شده با سندساز',footerMode),
          field((getLang()==='en'?'Background music URL (optional)':'نشانی موسیقی پس‌زمینه (اختیاری)'), musicInput),
          field(en?'Local music':'موسیقی از دستگاه',musicFile),musicInfo,clearMusic,createElement('p.hint',{text:en?'Local audio takes priority over the URL. Playback may require a user gesture.':'موسیقی محلی بر نشانی اینترنتی اولویت دارد. پخش ممکن است به تعامل کاربر با مرورگر نیاز داشته باشد.'})
        ])
      ]),
      footer: [
        createElement('button.btn.btn-sm.btn-danger', {
          onclick: async () => {
            if (await confirmDialog(t('msg.confirmDelete'), { danger: true, ok: t('btn.delete') })) {
              if (deleteDoc(doc.id)) { deleted = true; closeModal(); navigate('/home'); }
            }
          }
        }, getLang()==='en'?'🗑 Delete document':'🗑 حذف سند'),
        createElement('button.btn.btn-sm', { onclick: () => closeModal() }, t('btn.cancel')),
        createElement('button.btn.btn-sm.btn-primary', {
          onclick: () => {
            s.customBackground = { html:htmlCode.value, css:cssCode.value, js:jsCode.value };
            s.autoScroll = autoSwitch.checked;
            s.autoScrollInterval = Number(autoInterval.value) || 5;
            s.showProgress = progressSwitch.checked;
            s.animations = animSwitch.checked;
            s.branding = footerMode.value;
            s.musicUrl = musicInput.value.trim();
            commitHistory(doc);
            canvasRender();
            if (flushSave(doc)) toast(t('msg.saved'), 'ok');
            closeModal();
          }
        }, '✓ ' + t('btn.save'))
      ]
    });
  }

  /* ---------- save as template ---------- */
  async function saveAsTemplatePrompt() {
    const name = await promptDialog((getLang()==='en'?'Template name':'نام قالب'), { value: doc.name, ok: t('btn.save') });
    if (!name) return;
    saveAsTemplate(doc, name);
    toast(t('msg.templateSaved'), 'ok');
  }

  /* ---------- export / share modal ---------- */
  function openExportModal() {
    const s = doc.settings;
    const status = createElement('p.small.muted', { text: '' });

    const effectSel = createElement('select.select');
    EFFECTS.forEach((fx) => {
      const o = createElement('option', { value: fx.id, text: fx.label[getLang()] || fx.label.fa });
      if ((s.bgEffect || 'particles') === fx.id) o.selected = true;
      effectSel.appendChild(o);
    });
    effectSel.appendChild(createElement('option', { value:'custom', text: getLang() === 'en' ? 'Custom code' : 'کد دلخواه' }));
    effectSel.value = s.bgEffect || 'particles';
    const colorIn = createElement('input', { type: 'color', value: s.bgEffectColor || '#4f8cff' });
    const opOut = createElement('span.tiny.muted', { text: Math.round((s.bgEffectOpacity ?? 0.3) * 100) + '%' });
    const opIn = createElement('input.range', { type: 'range', min: '0', max: '100', value: String(Math.round((s.bgEffectOpacity ?? 0.3) * 100)) });
    opIn.addEventListener('input', () => { opOut.textContent = opIn.value + '%'; });
    const animSwitch = createElement('input', { type: 'checkbox' });
    animSwitch.checked = s.animations !== false;
    const modeRadio = createElement('div.seg');
    let exportMode = s.exportMode || 'view';
    [['view', (getLang()==='en'?'View':'نمایش')], ['edit', (getLang()==='en'?'Edit':'ویرایش')]].forEach(([v, l]) => {
      const b = createElement('button', { type: 'button', text: l });
      if (exportMode === v) b.classList.add('on');
      b.addEventListener('click', () => {
        exportMode = v;
        modeRadio.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      });
      modeRadio.appendChild(b);
    });
    const themeSel = createElement('select.select');
    getThemes().forEach((th) => {
      const o = createElement('option', { value: th.id, text: th.label[getLang()] || th.label.fa });
      if (doc.theme === th.id) o.selected = true;
      themeSel.appendChild(o);
    });

    const exportOpts = () => ({
      bgEffect: effectSel.value,
      effectColor: colorIn.value,
      effectOpacity: Number(opIn.value) / 100,
      animations: animSwitch.checked,
      theme: themeSel.value,
      defaultMode: exportMode,
      uiLang: getLang()
    });

    const make = async (kind, opts = {}) => {
      status.textContent = (getLang()==='en'?'Building file…':'در حال ساخت فایل…');
      const name = (doc.name || 'document').replace(/[\\/:*?"<>|]+/g, '-');
      try {
        if (kind === 'present') {
          await exportPresentHTML(doc, exportOpts());
          status.textContent = '✓ ' + t('export.done');
          return;
        }
        let password = null;
        if (kind === 'encrypted') {
          password = await askPassword();
          if (!password) { status.textContent = ''; return; }
        }
        const html = await buildExportHTML(doc, {
          mode: kind === 'editable' ? 'editable' : kind === 'encrypted' ? 'encrypted' : 'readonly',
          password,
          ...exportOpts(),
          ...opts
        });
        const suffix = kind === 'editable' ? '-editable' : kind === 'encrypted' ? '-locked' : '';
        downloadFile(name + suffix + '.html', html, 'text/html;charset=utf-8');
        status.textContent = '✓ ' + t('export.done');
        toast(t('export.done'), 'ok');
      } catch (err) {
        console.error(err);
        status.textContent = '⚠ ' + t('msg.error');
        toast(t('msg.error'), 'err');
      }
    };

    const btn = (label, icon, handler, cls = '') => createElement('button.btn.btn-sm' + (cls ? '.' + cls : ''), {
      style: { justifyContent: 'flex-start', width: '100%' }, onclick: handler
    }, [createElement('span', { text: icon }), createElement('span', { text: label })]);

    const body = createElement('div', {}, [
      createElement('h4', { text: '— ' + t('export.htmlFiles'), style: { margin: '0 0 .5rem', fontSize: '.8rem', color: 'var(--muted)' } }),
      createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' } }, [
        btn(t('export.htmlEditable'), '📝', () => make('editable')),
        btn(t('export.htmlReadonly'), '🔒', () => make('readonly')),
        btn(t('export.htmlEncrypted'), '🔐', () => make('encrypted')),
        btn(t('export.htmlPresent'), '🎬', () => make('present'))
      ]),
      createElement('h4', { text: '— ' + t('export.settings'), style: { margin: '.9rem 0 .5rem', fontSize: '.8rem', color: 'var(--muted)' } }),
      createElement('div.field', {}, [createElement('label', { text: t('export.bgEffect') }), effectSel]),
      createElement('div.row', { style: { gap: '.5rem' } }, [
        createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('export.effectColor') }), colorIn]),
        createElement('div.field', { style: { flex: '2' } }, [createElement('label', { text: t('export.effectOpacity') }), createElement('div.row', {}, [opIn, opOut])])
      ]),
      createElement('div.row', { style: { gap: '.8rem', flexWrap: 'wrap' } }, [
        createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('export.blockAnims') }), createElement('label.switch', {}, [animSwitch, getLang()==='en'?'Enabled':'فعال'])]),
        createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('export.defaultMode') }), modeRadio]),
        createElement('div.field', { style: { flex: '1' } }, [createElement('label', { text: t('editor.theme') }), themeSel])
      ]),
      createElement('h4', { text: '— ' + t('export.print'), style: { margin: '.9rem 0 .5rem', fontSize: '.8rem', color: 'var(--muted)' } }),
      btn(t('btn.print') + ' / PDF', '🖨', () => { closeModal(); if (flushSave(doc)) navigate('/print/' + doc.id); }),
      createElement('div.row', { style: { gap: '.4rem', flexWrap: 'wrap', marginTop: '.5rem' } }, [
        createElement('button.btn.btn-sm', { onclick: () => downloadFile((doc.name || 'document') + '.txt', '\ufeff' + docToPlainText(doc)) }, '📄 TXT'),
        createElement('button.btn.btn-sm', { onclick: () => { if (!exportTablesCSV(doc)) toast(getLang() === 'en' ? 'No tables in this document.' : 'این سند جدولی ندارد.'); } }, '📊 CSV (Excel)')
      ]),
      createElement('p.muted', { text: getLang() === 'en' ? 'TXT is plain text; CSV exports each table separately. Layout and animations are not included.' : 'خروجی TXT متن ساده است؛ هر جدول جداگانه به CSV تبدیل می‌شود. ظاهر و انیمیشن‌ها در این دو قالب حفظ نمی‌شوند.', style: { fontSize: '.72rem' } }),
      createElement('h4', { text: '— ' + t('export.backup'), style: { margin: '.9rem 0 .5rem', fontSize: '.8rem', color: 'var(--muted)' } }),
      createElement('div.row', { style: { gap: '.4rem' } }, [
        createElement('button.btn.btn-sm', { style: { flex: '1' }, onclick: () => { exportDocJSON(doc); status.textContent = '✓ JSON'; } }, '💾 ' + t('export.downloadJson')),
        createElement('button.btn.btn-sm', { style: { flex: '1' }, onclick: () => pickJSONFile((data, file, err) => {
          if (!data || err) { toast(t('msg.error'), 'err'); return; }
          const created = importDocuments(data);
          toast(created.length ? t('msg.imported') : t('msg.error'), created.length ? 'ok' : 'err');
          if (created[0]) { closeModal(); navigate('/editor/' + created[0].id); }
        }) }, '📂 ' + t('export.uploadJson'))
      ]),
      createElement('h4', { text: '— ' + t('export.shareSection'), style: { margin: '.9rem 0 .5rem', fontSize: '.8rem', color: 'var(--muted)' } }),
      createElement('div.row', { style: { gap: '.4rem', flexWrap: 'wrap' } }, [
        createElement('button.btn.btn-sm', {
          onclick: async () => { await copyText(docToPlainText(doc)); toast(t('msg.copied'), 'ok'); }
        }, '📋 ' + t('export.plainText')),
        createElement('button.btn.btn-sm', {
          onclick: async () => {
            try {
              const url = await buildShareLink(doc);
              await copyText(url);
              toast(t('msg.linkCopied'), 'ok');
            } catch (e) {
              if (String(e.message) === 'too-large') toast(getLang()==='en'?'Document is too large for a link; use an HTML file.':'سند برای لینک بزرگ است؛ از فایل HTML استفاده کنید.', 'err');
              else toast(t('msg.error'), 'err');
            }
          }
        }, '🔗 ' + t('export.shortLink')),
        createElement('button.btn.btn-sm', { onclick: () => openShare('whatsapp', doc, { text: doc.name + '\n' }) }, 'WhatsApp'),
        createElement('button.btn.btn-sm', { onclick: () => openShare('telegram', doc, { url: location.href }) }, 'Telegram'),
        createElement('button.btn.btn-sm', { onclick: () => openShare('email', doc, { text: docToPlainText(doc).slice(0, 1500) }) }, 'Email'),
        createElement('button.btn.btn-sm', {
          onclick: async () => {
            const okShare = await nativeShare(doc, { text: docToPlainText(doc).slice(0, 900), url: location.href });
            if (!okShare) toast(getLang()==='en'?'System sharing is unavailable.':'اشتراک‌گذاری سیستمی در دسترس نیست.');
          }
        }, '📲 ' + (getLang()==='en'?'System share':'اشتراک سیستمی'))
      ]),
      status
    ]);

    openModal({ title: '📤 ' + t('export.title'), body, size: 'lg', footer: [
      createElement('button.btn.btn-sm', { onclick: () => closeModal() }, t('btn.close'))
    ] });
  }

  function askPassword() {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (done) return; done = true; closeModal(); resolve(v); };
      const p1 = createElement('input.input', { type: 'password', placeholder: '••••••••', autocomplete: 'new-password' });
      const p2 = createElement('input.input', { type: 'password', placeholder: '••••••••', autocomplete: 'new-password' });
      const err = createElement('p.hint', { style: { color: 'var(--danger)' } });
      openModal({
        title: '🔐 ' + t('export.htmlEncrypted'),
        size: 'sm',
        body: createElement('div', {}, [
          createElement('div.field', {}, [createElement('label', { text: t('export.password') }), p1]),
          createElement('div.field', {}, [createElement('label', { text: t('export.passwordRepeat') }), p2]),
          err,
          createElement('p.hint', { text: t('export.encryptWarn') })
        ]),
        footer: [
          createElement('button.btn.btn-sm', { onclick: () => finish(null) }, t('btn.cancel')),
          createElement('button.btn.btn-sm.btn-primary', {
            onclick: () => {
              if (!p1.value) { err.textContent = t('msg.needPassword'); return; }
              if (p1.value !== p2.value) { err.textContent = t('msg.passwordMismatch'); return; }
              if (p1.value.length < 6) { err.textContent = getLang()==='en'?'Use at least 6 characters.':'رمز حداقل ۶ کاراکتر باشد'; return; }
              finish(p1.value);
            }
          }, getLang()==='en'?'🔐 Encrypt and download':'🔐 رمزنگاری و دانلود')
        ],
        onClose: () => { if (!done) { done = true; resolve(null); } }
      });
      setTimeout(() => p1.focus(), 80);
    });
  }

  /* ---------- keyboard ---------- */
  const onKey = (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Escape' && contextState.id) { closeContext(); if (!typing) { selectedId=null; canvasRender(); propsRender(); } return; }
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) { if (redo(doc)) { fillThemes(); canvasRender(); layersRender(); propsRender(); queueSave(doc); } }
      else if (undo(doc)) { fillThemes(); canvasRender(); layersRender(); propsRender(); queueSave(doc); }
      return;
    }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); if (flushSave(doc)) toast(t('msg.saved'), 'ok'); return; }
    if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); if (flushSave(doc)) navigate('/print/' + doc.id); return; }
    if (!typing) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); removeBlock(selectedId); }
      if (mod && e.key.toLowerCase() === 'd' && selectedId) { e.preventDefault(); duplicateBlock(selectedId); }
      if (e.key === 'Escape') { closeContext(); selectedId = null; canvasRender(); propsRender(); }
    }
  };
  disposers.push(on(document, 'keydown', onKey));

  undoBtn.addEventListener('click', () => { if (undo(doc)) { fillThemes(); canvasRender(); layersRender(); propsRender(); queueSave(doc); } });
  redoBtn.addEventListener('click', () => { if (redo(doc)) { fillThemes(); canvasRender(); layersRender(); propsRender(); queueSave(doc); } });

  const onResize = debounce(() => { if (window.innerWidth > 900) return; /* drawer mode */ }, 200);
  window.addEventListener('resize', onResize);

  /* ---------- boot ---------- */
  document.body.classList.add('editing');
  bg.set('none');
  canvasRender();
  layersRender();
  propsRender();
  updateHistoryButtons();
  requestAnimationFrame(() => fitZoom());

  // پیام «ذخیره» را از لایه state بگیریم
  import('../core/state.js').then(({ on: onState }) => {
    disposers.push(onState('doc:save-state', (payload) => {
      if (payload.id !== doc.id) return;
      saveState = payload.state;
      updateStatus();
    }));
  });

  const cleanup = () => {
    if (!deleted) flushSave(doc);
    disposers.forEach((fn) => { try { fn(); } catch (_) {} });
    window.removeEventListener('resize', onResize);
    closeContext();
    document.body.classList.remove('editing', 'drawer-open', 'workspace-simple', 'workspace-web');
    bg.set('none');
    clear(root);
  };
  registerCleanup(cleanup);
  if (isNew) toast(getLang()==='en'?'New document created — add blocks from the sidebar.':'سند جدید ساخته شد — از پنل چپ بلوک اضافه کنید.');
  else if (window.innerWidth <= 900 && doc.blocks[0]?.type === 'layout') toast(getLang() === 'en' ? 'Open the properties panel to edit the layout code.' : 'برای ویرایش کد، پنل ویژگی‌ها را باز کنید.', '', 4200);
  return cleanup;
}

export default renderEditor;
