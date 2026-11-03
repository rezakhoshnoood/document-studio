/* Non-destructive presentation presets. They do not contain or modify blocks. */
export const PRESETS = [
  { id:'midnight', name:{fa:'شب مدرن',en:'Modern night'}, desc:{fa:'تیره، عریض و متحرک',en:'Dark, wide and animated'}, theme:'modern-blue', surface:'dark', width:'wide', layout:'flow', effect:'particles', color:'#6795ff' },
  { id:'paper', name:{fa:'گزارش روشن',en:'Light report'}, desc:{fa:'روشن و متمرکز بر خوانایی',en:'Light and readable'}, theme:'official', surface:'light', width:'wide', layout:'flow', effect:'none', color:'#315d91' },
  { id:'dashboard', name:{fa:'داشبورد آبی',en:'Blue dashboard'}, desc:{fa:'چیدمان شبکه‌ای و پویا',en:'Responsive grid'}, theme:'ocean', surface:'dark', width:'wide', layout:'grid', effect:'orbit', color:'#3ba4e7' },
  { id:'academic', name:{fa:'دانشگاهی',en:'Academic'}, desc:{fa:'روشن و ساختارمند',en:'Light and structured'}, theme:'academic', surface:'light', width:'bounded', layout:'flow', effect:'none', color:'#8b1d2c' },
  { id:'editorial', name:{fa:'سرمقاله',en:'Editorial'}, desc:{fa:'روشن با چیدمان کارتی',en:'Bright card layout'}, theme:'emerald', surface:'light', width:'wide', layout:'grid', effect:'none', color:'#158064' },
  { id:'aurora', name:{fa:'شفق',en:'Aurora'}, desc:{fa:'تمام‌عرض با نور متحرک',en:'Full-width and animated'}, theme:'royal', surface:'dark', width:'full', layout:'flow', effect:'gradient-flow', color:'#8b72ef' }
,
  { id:'glass-doc',name:{fa:'شیشه‌ای',en:'Glass'},desc:{fa:'کارت‌های شفاف تیره',en:'Translucent dark cards'},theme:'modern-blue',surface:'dark',width:'wide',layout:'grid',style:'glass',effect:'particles',color:'#6795ff'},
  { id:'liquid-doc',name:{fa:'شیشه مایع',en:'Liquid glass'},desc:{fa:'سطوح رنگی و لطیف',en:'Soft tinted surfaces'},theme:'royal',surface:'dark',width:'wide',layout:'grid',style:'liquid',effect:'gradient-flow',color:'#8b72ef'},
  { id:'neu-doc',name:{fa:'نئومورفیسم',en:'Soft relief'},desc:{fa:'کارت‌های روشن برجسته',en:'Light softly raised cards'},theme:'ocean',surface:'light',width:'wide',layout:'grid',style:'neu',effect:'none',color:'#5275a5'},
  { id:'flat-doc',name:{fa:'تاریک تخت',en:'Flat dark'},desc:{fa:'مینیمال و بدون سایه',en:'Minimal and shadow-free'},theme:'minimal',surface:'dark',width:'wide',layout:'grid',style:'flat',effect:'none',color:'#52647d'},
  { id:'light-doc',name:{fa:'روشن',en:'Light'},desc:{fa:'سطوح روشن و مرتب',en:'Clean, light surfaces'},theme:'official',surface:'light',width:'wide',layout:'grid',style:'light',effect:'none',color:'#315d91'}
,
  {id:'startup',name:{fa:'استارتاپ',en:'Startup'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'modern-blue',surface:'dark',width:'wide',layout:'grid',effect:'particles',color:'#527cf2'},
  {id:'pitch',name:{fa:'پیچ سرمایه‌گذاری',en:'Investor pitch'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'royal',surface:'dark',width:'full',layout:'flow',effect:'gradient-flow',color:'#8b62df'},
  {id:'shop',name:{fa:'فروشگاهی روشن',en:'Light retail'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'emerald',surface:'light',width:'bounded',layout:'flow',effect:'none',color:'#11845d'},
  {id:'invoice',name:{fa:'فاکتور مینیمال',en:'Minimal invoice'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'official',surface:'light',width:'bounded',layout:'flow',effect:'none',color:'#344d6e'},
  {id:'ocean-light',name:{fa:'اقیانوس روشن',en:'Light ocean'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'ocean',surface:'light',width:'wide',layout:'grid',effect:'none',color:'#117da3'},
  {id:'forest-dark',name:{fa:'جنگل شب',en:'Night forest'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'emerald',surface:'dark',width:'wide',layout:'grid',effect:'orbit',color:'#258868'},
  {id:'rose-light',name:{fa:'رز روشن',en:'Light rose'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'warm',surface:'light',width:'wide',layout:'flow',effect:'none',color:'#b05075'},
  {id:'tech-night',name:{fa:'فناوری شب',en:'Night technology'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'technical',surface:'dark',width:'full',layout:'grid',effect:'particles',color:'#547cca'},
  {id:'education',name:{fa:'آموزش روشن',en:'Learning'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'academic',surface:'light',width:'wide',layout:'flow',effect:'none',color:'#a44747'},
  {id:'portfolio',name:{fa:'نمونه‌کار',en:'Portfolio'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'royal',surface:'dark',width:'full',layout:'grid',effect:'bubbles',color:'#a26be1'},
  {id:'report-clean',name:{fa:'گزارش ساده',en:'Clean report'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'minimal',surface:'light',width:'bounded',layout:'flow',effect:'none',color:'#536579'},
  {id:'sunset',name:{fa:'غروب گرم',en:'Warm sunset'},desc:{fa:'ظاهر آماده سند',en:'Ready document style'},theme:'sunset',surface:'dark',width:'wide',layout:'flow',effect:'waves',color:'#c56d4d'}
];
const KEY='ds.appearance-presets.v1';
export function getAppearance(doc) {
  const s=doc?.settings||{};
  return {surface:['light','dark'].includes(s.webSurface)?s.webSurface:'dark', width:['bounded','wide','full'].includes(s.webWidth)?s.webWidth:'wide', layout:['flow','grid'].includes(s.webLayout)?s.webLayout:'flow', themeHero:!!s.webThemeHero, style:['glass','liquid','neu','flat','light'].includes(s.webStyle)?s.webStyle:'standard', palette:s.webPalette || null};
}
export function applyAppearance(doc,preset,includeLayout=true) {
  doc.settings ||= {};
  doc.theme=preset.theme || doc.theme;
  doc.settings.webSurface = preset.surface || 'dark';
  doc.settings.webThemeHero = preset.themeHero !== false;
  doc.settings.webStyle = ['glass','liquid','neu','flat','light'].includes(preset.style)?preset.style:'standard';
  doc.settings.webPalette = preset.palette || null;
  doc.settings.bgEffect = preset.effect || 'none';
  doc.settings.bgEffectColor = preset.color || '#4f8cff';
  if (preset.opacity !== undefined) doc.settings.bgEffectOpacity=preset.opacity;
  if(preset.interactive!==undefined)doc.settings.bgInteractive=!!preset.interactive;
  if(preset.interactiveMode)doc.settings.bgInteractiveMode=preset.interactiveMode;
  if(preset.interactiveOpacity!==undefined)doc.settings.bgInteractiveOpacity=preset.interactiveOpacity;
  if(preset.customInteraction)doc.settings.customInteraction=JSON.parse(JSON.stringify(preset.customInteraction));
  if (preset.effect === 'custom' && preset.customBackground) doc.settings.customBackground=JSON.parse(JSON.stringify(preset.customBackground));
  if (includeLayout) {doc.settings.webLayout=preset.layout||'flow'; doc.settings.webWidth=preset.width||'wide';}
}
export function getCustomPresets(){try { const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]; } catch(e){return []}}
export function storeCustomPreset(name,doc){
  const a=getAppearance(doc), list=getCustomPresets();
  const item={id:'custom-'+Date.now(),name:{fa:name,en:name},desc:{fa:'پریست ذخیره‌شده',en:'Saved preset'},theme:doc.theme,...a,effect:doc.settings?.bgEffect||'none',color:doc.settings?.bgEffectColor||'#4f8cff',opacity:doc.settings?.bgEffectOpacity ?? .3,interactive:!!doc.settings?.bgInteractive,interactiveMode:doc.settings?.bgInteractiveMode||'trail',interactiveOpacity:doc.settings?.bgInteractiveOpacity??.65,customInteraction:doc.settings?.customInteraction||null,customBackground:doc.settings?.bgEffect === 'custom' ? doc.settings.customBackground : null};
  list.push(item);localStorage.setItem(KEY,JSON.stringify(list));return item;
}
export function removeCustomPreset(id){localStorage.setItem(KEY,JSON.stringify(getCustomPresets().filter(p=>p.id!==id)));}

/* Randomized palettes are data, not global themes: they travel with the document. */
export function paletteCss(palette) {
  if (!palette || !/^#[0-9a-f]{6}$/i.test(palette.a) || !/^#[0-9a-f]{6}$/i.test(palette.b)) return '';
  return `--d-accent:${palette.a};--d-th-bg:${palette.a};--d-header-bg:linear-gradient(135deg,${palette.a},${palette.b});--d-header-text:#fff;`;
}
function hueToHex(h,s,l){
  s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{let k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')};return '#'+f(0)+f(8)+f(4);
}
function darkEnough(h,s,l){
  while (l>15) {const c=hueToHex(h,s,l); const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4); const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]; if(1.05/(lum+.05)>=4.8)return c; l-=1;} return hueToHex(h,s,l);
}
export function randomAppearance(doc) {
  const r=(n)=>Math.floor(Math.random()*n), h=r(360), hue2=(h+35+r(120))%360;
  const a=darkEnough(h,58+r(24),35+r(12)),b=darkEnough(hue2,58+r(22),36+r(12));
  return {theme:'modern-blue',surface:r(2)?'light':'dark',width:['bounded','wide','full'][r(3)],layout:r(2)?'flow':'grid',themeHero:true,palette:{a,b},effect:['none','particles','bubbles','orbit','waves','gradient-flow'][r(6)],color:a,opacity:.25+r(26)/100};
}
