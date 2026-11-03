/* Global application appearance is intentionally separate from document presets. */
import { createElement, clear, toast, confirmDialog } from '../core/dom.js';
import { t, setLang, getLang } from '../core/i18n.js';
import { getSettings, saveSettings, storageUsage, clearAllData, resetSettings } from '../core/state.js';
import { exportAllJSON, pickJSONFile, importDocuments } from '../features/export-json.js';
import { UI_PALETTES, uiColors } from '../core/ui-colors.js';
import { EFFECTS } from '../effects/manager.js';
import { pageShell, VERSION } from './chrome.js';

export function renderSettings(root) {
  clear(root);
  const settings=getSettings(), en=getLang()==='en';
  const L=(fa,enText)=>en?enText:fa;
  const section=(title,desc,...children)=>createElement('section.settings-card',{},[
    createElement('h3',{text:title}),desc?createElement('p',{text:desc}):null,...children
  ].filter(Boolean));
  const ui=uiColors(settings),current=ui.lightness===0?'flat':ui.lightness===100?'light':null;
  const appearance=section(L('حالت و رنگ برنامه','App mode & colors'), L('همان چیدمان روشن و تیره با طیف رنگی دلخواه؛ سند تغییر نمی‌کند.','The same light and dark interface with your chosen color palette; the document is unaffected.'),
    createElement('p.small',{text:L('پوسته‌های پیشنهادی','Recommended interface themes')}),
    createElement('div.ui-theme-grid',{role:'group','aria-label':L('پوسته‌های پیشنهادی','Recommended interface themes')},[
      ['midnight','slate',0,L('نیمه‌شب','Midnight')],['ocean-night','ocean',15,L('اقیانوس شب','Night ocean')],['plum-night','plum',15,L('آلویی شب','Night plum')],['cloud','slate',100,L('ابر روشن','Light cloud')],['sage-day','sage',95,L('مریم‌گلی روشن','Light sage')],['sand-day','sand',95,L('شنزار روشن','Light sand')]
    ].map(([id,palette,lightness,label])=>{const preview=uiColors({uiPalette:palette,uiLightness:lightness}),active=ui.palette.id===palette&&ui.lightness===lightness&&!settings.uiBackground&&!settings.uiPanel&&!settings.uiAccent;return createElement('button.ui-theme-card'+(active?'.active':''),{type:'button','data-ui-theme':id,'aria-pressed':String(active),onclick:()=>{saveSettings({uiPalette:palette,uiLightness:lightness,skin:lightness>=75?'light':'flat',uiAccent:null,uiBackground:null,uiPanel:null});renderSettings(root);}},[createElement('span.ui-theme-preview',{style:{background:preview.bg,borderColor:preview.border}},[createElement('i',{style:{background:preview.panel,borderColor:preview.border}}),createElement('b',{style:{background:preview.accent}})]),createElement('span',{text:label})]);})),
    createElement('div.skin-grid',{role:'group','aria-label':L('حالت نمایش برنامه','App color mode')},[
      ...[['flat',L('تیره','Dark'),'#222a36'],['light',L('روشن','Light'),'#f1f5fa']].map(([id,label,color])=>createElement('button.skin-opt'+(current===id?'.active':''),{type:'button','data-skin-choice':id,'aria-pressed':String(current===id),onclick:()=>{saveSettings({skin:id,uiLightness:id==='light'?100:0,uiBackground:null,uiPanel:null});renderSettings(root);}},[createElement('div.sw',{style:{background:color,border:'1px solid #8190a3'}}),createElement('span',{text:label})]))
    ]),createElement('div.field.lightness-field',{},[createElement('label',{text:L('تم روشنایی رابط','Interface brightness theme')}),createElement('div.ui-shade-grid',{role:'group','aria-label':L('تم روشنایی رابط','Interface brightness theme')},[[0,'مشکی','Black'],[20,'تیره','Dark'],[40,'دودی','Charcoal'],[60,'خاکستری','Gray'],[80,'روشن','Light'],[100,'سفید','White']].map(([n,fa,en])=>createElement('button.ui-shade'+(Math.abs(ui.lightness-n)<1?'.active':''),{type:'button','data-shade':String(n),'aria-pressed':String(Math.abs(ui.lightness-n)<1),onclick:()=>{saveSettings({uiLightness:n,uiBackground:null,uiPanel:null});renderSettings(root);}},[createElement('span',{style:{background:`rgb(${Math.round(24+2.25*n)} ${Math.round(28+2.15*n)} ${Math.round(34+2.05*n)})`}}),createElement('small',{text:L(fa,en)})])))]),createElement('p.small',{text:L('طیف رنگی رابط','Interface color palette')}),
    createElement('div.ui-palette-grid',{role:'group','aria-label':L('طیف رنگی رابط','Interface color palette')},UI_PALETTES.map(p=>createElement('button.ui-palette'+(ui.palette.id===p.id?'.active':''),{type:'button','data-ui-palette-choice':p.id,'aria-pressed':String(ui.palette.id===p.id),onclick:()=>{saveSettings({uiPalette:p.id,uiAccent:null,uiBackground:null,uiPanel:null});renderSettings(root);}},[createElement('span',{style:{background:p.accent}}),createElement('small',{text:en?p.en:p.fa})])))
  );
  const uiAccent=createElement('input',{type:'color',value:ui.accent,'aria-label':L('رنگ تأکید رابط','Interface accent color')});
  uiAccent.addEventListener('input',()=>saveSettings({uiAccent:uiAccent.value}));
  const radiusValue=settings.uiRadius==null?12:Number(settings.uiRadius),radiusOutput=createElement('output',{text:radiusValue+'px'});
  const uiRadius=createElement('input.range',{type:'range',min:'0',max:'24',value:String(radiusValue),'aria-label':L('گردی رابط برنامه','Interface corner radius')});
  uiRadius.addEventListener('input',()=>{radiusOutput.textContent=uiRadius.value+'px';saveSettings({uiRadius:Number(uiRadius.value)});});
  const background=createElement('input',{type:'color',value:ui.bg,'aria-label':L('رنگ زمینه رابط','Interface background')});background.addEventListener('input',()=>saveSettings({uiBackground:background.value}));
  const panel=createElement('input',{type:'color',value:ui.panel,'aria-label':L('رنگ پنل‌های رابط','Interface panel color')});panel.addEventListener('input',()=>saveSettings({uiPanel:panel.value}));
  const scaleOut=createElement('output',{text:Math.round((settings.uiScale??1)*100)+'%'}),scale=createElement('input.range',{type:'range',min:'90',max:'115',step:'5',value:String(Math.round((settings.uiScale??1)*100)),'aria-label':L('اندازه رابط','Interface scale')});
  scale.addEventListener('input',()=>{scaleOut.textContent=scale.value+'%';saveSettings({uiScale:Number(scale.value)/100});});
  const density=createElement('select.select',{'aria-label':L('تراکم رابط','Interface density')});[['comfortable',L('راحت','Comfortable')],['compact',L('فشرده','Compact')]].forEach(([value,text])=>density.appendChild(createElement('option',{value,text})));density.value=settings.uiDensity||'comfortable';density.addEventListener('change',()=>saveSettings({uiDensity:density.value}));
  const motion=createElement('input',{type:'checkbox'});motion.checked=settings.uiMotion!==false;motion.addEventListener('change',()=>saveSettings({uiMotion:motion.checked}));
  const customize=section(L('شخصی‌سازی رابط برنامه','Customize interface'),L('رنگ دلخواه، اندازه و فاصله رابط؛ جدا از سند. رنگ‌های دلخواه را از نظر خوانایی بررسی کنید.','Custom interface colors, size and spacing; independent of the document. Check custom colors for readability.'),
    createElement('div.field',{},[createElement('label',{text:L('رنگ تأکید رابط','Interface accent')}),uiAccent]),
    createElement('div.field',{},[createElement('label',{text:L('رنگ زمینه رابط','Interface background')}),background]),
    createElement('div.field',{},[createElement('label',{text:L('رنگ پنل‌های رابط','Interface panel color')}),panel]),
    createElement('div.field',{},[createElement('label',{text:L('گردی رابط برنامه','Interface corners')}),createElement('div.row',{},[uiRadius,radiusOutput])]),
    createElement('div.field',{},[createElement('label',{text:L('اندازه رابط','Interface scale')}),createElement('div.row',{},[scale,scaleOut])]),
    createElement('div.field',{},[createElement('label',{text:L('تراکم رابط','Interface density')}),density]),
    createElement('label.switch',{},[motion,L('حرکت‌های تزئینی رابط','Decorative interface motion')]),
    createElement('button.btn.btn-sm',{onclick:()=>{saveSettings({uiAccent:null,uiBackground:null,uiPanel:null,uiRadius:null,uiScale:1,uiDensity:'comfortable',uiMotion:true,uiLightness:null});renderSettings(root);}},L('بازنشانی شخصی‌سازی رابط','Reset interface customization')));
  const langSelect=createElement('select.select',{'aria-label':t('settings.language')});
  [['fa','فارسی (RTL)'],['en','English (LTR)']].forEach(([value,label])=>langSelect.appendChild(createElement('option',{value,text:label})));
  langSelect.value=getLang();langSelect.addEventListener('change',()=>{setLang(langSelect.value);saveSettings({lang:langSelect.value});renderSettings(root);toast(getLang()==='en'?'Interface language changed':'زبان رابط تغییر کرد');});
  const fxSelect=createElement('select.select',{'aria-label':L('افکت پس‌زمینه برنامه','App background effect')});
  EFFECTS.forEach(f=>fxSelect.appendChild(createElement('option',{value:f.id,text:f.label[en?'en':'fa']})));
  fxSelect.value=settings.effect||'particles';fxSelect.addEventListener('change',()=>saveSettings({effect:fxSelect.value}));
  const fxColor=createElement('input',{type:'color',value:settings.effectColor||'#4f8cff','aria-label':L('رنگ افکت برنامه','App effect color')});
  fxColor.addEventListener('input',()=>saveSettings({effectColor:fxColor.value}));
  const fxOpacity=createElement('input.range',{type:'range',min:'0',max:'100',value:String(Math.round((settings.effectOpacity??.55)*100)),'aria-label':L('نمایش افکت برنامه','App effect opacity')});
  fxOpacity.addEventListener('input',()=>saveSettings({effectOpacity:Number(fxOpacity.value)/100}));
  const fxInteractive=createElement('input',{type:'checkbox'});fxInteractive.checked=!!settings.effectInteractive;fxInteractive.addEventListener('change',()=>saveSettings({effectInteractive:fxInteractive.checked}));
  const effects=section(L('انیمیشن محیط برنامه','App background animation'),L('انیمیشن و واکنش به حرکت یا کلیک در صفحه اصلی؛ مستقل از پس‌زمینه سند.','Home-page animation and pointer response; independent of document backgrounds.'),fxSelect,createElement('div.row',{style:{marginTop:'.7rem'}},[fxColor,fxOpacity]),createElement('label.switch',{style:{marginTop:'.7rem'}},[fxInteractive,L('واکنش به ماوس و لمس','React to pointer and touch')]));
  const docLanguage=createElement('select.select',{'aria-label':L('زبان پیش‌فرض اسناد جدید','Default language for new documents')});
  [['fa','فارسی (RTL)'],['en','English (LTR)']].forEach(([value,text])=>docLanguage.appendChild(createElement('option',{value,text})));
  docLanguage.value=settings.documentLang||'fa';docLanguage.addEventListener('change',()=>saveSettings({documentLang:docLanguage.value}));
  const language=section(t('settings.language'),L('زبان رابط برنامه از زبان سند مستقل است.','The interface language is independent of document language.'),langSelect,createElement('label',{text:L('زبان پیش‌فرض اسناد جدید','Default language for new documents'),style:{display:'block',marginTop:'1rem'}}),docLanguage,createElement('p.hint',{text:L('فقط برای اسناد جدید است؛ زبان اسناد موجود را از ویرایشگر تغییر دهید.','Applies only to new documents. Change existing documents in the editor.')}));
  const size=storageUsage(),formatted=size>1024*1024?(size/1024/1024).toFixed(2)+' MB':(size/1024).toFixed(1)+' KB';
  const data=section(t('settings.data'),t('settings.data.d'),createElement('p.small',{text:t('settings.storageUsed')+': '+formatted}),createElement('div.row',{style:{flexWrap:'wrap'}},[
    createElement('button.btn.btn-sm',{onclick:()=>{exportAllJSON();toast(t('export.done'),'ok');}},t('export.downloadJson')),
    createElement('button.btn.btn-sm',{onclick:()=>pickJSONFile((value,file,err)=>{if(!value||err){toast(t('msg.error'),'err');return;}const imported=importDocuments(value);toast(imported.length?`${imported.length} ${L('سند وارد شد','documents imported')}`:t('msg.error'),imported.length?'ok':'err');renderSettings(root);})},t('export.uploadJson')),
    createElement('button.btn.btn-sm.btn-danger',{onclick:async()=>{if(await confirmDialog(L('همه اسناد و تنظیمات این مرورگر پاک شوند؟','Delete all documents and settings in this browser?'),{danger:true,ok:t('btn.delete')})){clearAllData();location.hash='#/home';setTimeout(()=>location.reload(),300);}}},t('settings.clearAll'))
  ]));
  const reset=section(L('بازنشانی تنظیمات برنامه','Reset application settings'),L('این کار فقط تنظیمات برنامه را بازنشانی می‌کند؛ سندها، قالب‌ها و پریست‌ها حذف نمی‌شوند.','Only application settings are reset; documents, templates and presets remain.'),createElement('button.btn.btn-sm',{'data-reset-settings':'true',onclick:async()=>{if(await confirmDialog(L('تنظیمات برنامه به حالت اولیه بازگردد؟ سندها حذف نمی‌شوند.','Restore default application settings? Documents will not be deleted.'),{ok:L('بازنشانی','Reset')})){resetSettings();setLang('en');renderSettings(root);toast('Application settings reset.','ok');}}},L('بازنشانی تنظیمات برنامه','Reset app settings')));
  const install=section(t('settings.install'),t('settings.install.d'),createElement('button.btn.btn-sm',{onclick:async()=>{if(window.__dsInstallPrompt){window.__dsInstallPrompt.prompt();await window.__dsInstallPrompt.userChoice;window.__dsInstallPrompt=null;}else toast(L('از منوی مرورگر گزینه نصب را انتخاب کنید.','Use your browser’s Install app command if available.'));}},t('settings.install')));
  const about=section(t('settings.about'),null,createElement('div.about-box',{},[
    createElement('strong',{text:t('app.title')+' · '+VERSION}),createElement('p',{text:t('app.credit')}),
    createElement('a',{href:'mailto:reza.khoshnoood@gmail.com',text:'reza.khoshnoood@gmail.com'}),
    createElement('p.muted',{text:L('پردازش و ذخیره‌سازی در مرورگر انجام می‌شود.','Processing and storage run locally in your browser.')})
  ]));
  root.appendChild(pageShell('settings',[createElement('section.section.wrap',{},[
    createElement('h1',{text:t('settings.title'),style:{margin:'0 0 .3rem',fontSize:'1.35rem'}}),
    createElement('p.muted.small',{text:L('تنظیمات در این مرورگر ذخیره می‌شود.','Settings are stored in this browser.')}),
    createElement('div.settings-grid.mt3',{},[appearance,customize,effects,language,reset,data,install,about])
  ])]));
}
export default renderSettings;
