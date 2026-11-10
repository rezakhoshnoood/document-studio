/* features/export-html.js — ساخت فایل HTML مستقل و خودکفا (self-contained) */
import { createExtra } from '../effects/extra.js';
import { createInteraction } from '../effects/interaction.js';
import {createReactiveBackground} from '../effects/reactive-background.js';
import { createCustomInteraction } from './custom-interaction.js';
import { setupFreePage } from './free-layout.js';
import { renderBlock } from '../blocks/base.js';
import { themeCss, getTheme, showDocumentBranding } from '../core/state.js';
import { encryptJSON } from './encryption.js';
import { escapeHTML } from '../core/dom.js';
import { fontFaceCss } from '../core/fonts.js';
import { customBackgroundDocument } from './custom-background.js';
import { scopeCss } from '../blocks/layout.js';
import { numeric, persianDigits, normalizeEditableDigits } from '../core/numbers.js';
import { evaluateFormula, tableValue, displayTableCell, smartFooter } from '../core/table-math.js';
import { getAppearance, paletteCss } from './appearance.js';

export const MODES = {
  editable: { id: 'editable', editable: true, lock: false, present: true, label: 'HTML قابل ویرایش' },
  readonly: { id: 'readonly', editable: false, lock: false, present: true, label: 'HTML فقط خواندنی' },
  encrypted: { id: 'encrypted', editable: false, lock: true, present: true, label: 'HTML رمزنگاری‌شده' },
  present: { id: 'present', editable: false, lock: false, present: true, label: 'HTML با حالت ارائه' }
};

/* ---------------- استخراج CSS سند از core.css ---------------- */
const FALLBACK_DOC_CSS = `
.doc-page{--d-accent:#4f8cff;--d-accent-light:#e8f0ff;--d-title:#1a237e;--d-text:#333;--d-header-bg:linear-gradient(135deg,#4f8cff,#6c5ce7);--d-header-text:#fff;--d-th-bg:#4f8cff;--d-zebra:#f5f8ff;--d-border:#e0e0e0;--d-font:Vazirmatn,system-ui,sans-serif;--d-radius:12px;--d-bg:#fff;background:var(--d-bg);color:var(--d-text);font-family:var(--d-font);line-height:1.85;font-size:15px}
.doc-page .b{margin:0 0 16px;position:relative}
`;
let docCssCache = null;
async function getDocCss() {
  if (docCssCache) return docCssCache;
  try {
    const res = await fetch('css/core.css', { cache: 'force-cache' });
    const text = await res.text();
    const start = text.indexOf('/* @doc-css-start');
    const end = text.indexOf('/* @doc-css-end */');
    if (start >= 0 && end > start) {
      docCssCache = text.slice(start, end + '/* @doc-css-end */'.length);
      return docCssCache;
    }
  } catch (_) { /* offline یا فایل در دسترس نیست */ }
  docCssCache = FALLBACK_DOC_CSS;
  return docCssCache;
}

/* ---------------- افکت‌های پس‌زمینه (فقط افکت استفاده‌شده embed می‌شود) ---------------- */
const EFFECT_CODE = {
  particles: `(function(){var c=document.getElementById('bg-canvas'),x=c.getContext('2d'),w=0,h=0,p=[],raf=null,col=COLOR;
function rs(){var d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);p=[];var n=Math.max(24,Math.min(90,Math.round(w*h*0.00008)));for(var i=0;i<n;i++)p.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.32,vy:(Math.random()-.5)*.32,r:Math.random()*1.7+.7});}
function f(){x.clearRect(0,0,w,h);for(var i=0;i<p.length;i++){var a=p[i];a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>w)a.vx*=-1;if(a.y<0||a.y>h)a.vy*=-1;x.beginPath();x.arc(a.x,a.y,a.r,0,6.283);x.fillStyle=col;x.globalAlpha=.75;x.fill();for(var j=i+1;j<p.length;j++){var b=p[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<118){x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle=col;x.globalAlpha=(1-d/118)*.24;x.lineWidth=1;x.stroke();}}}x.globalAlpha=1;raf=requestAnimationFrame(f);}
return{start:function(){rs();if(!raf)f();addEventListener('resize',rs);},stop:function(){removeEventListener('resize',rs);if(raf)cancelAnimationFrame(raf);raf=null;x.clearRect(0,0,w,h);}};})()`,
  bubbles: `(function(){var c=document.getElementById('bg-canvas'),x=c.getContext('2d'),w=0,h=0,b=[],raf=null,col=COLOR;
function rs(){var d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);b=[];var n=Math.max(16,Math.round(w/46));for(var i=0;i<n;i++)b.push(sp(true));}
function sp(any){var r=Math.random()*16+4;return{x:Math.random()*w,y:any?Math.random()*h:h+r,r:r,vy:-(Math.random()*.6+.25),sw:Math.random()*6.283,ss:Math.random()*.02+.006,a:Math.random()*.35+.12};}
function f(){x.clearRect(0,0,w,h);for(var i=0;i<b.length;i++){var o=b[i];o.y+=o.vy;o.sw+=o.ss;var px=o.x+Math.sin(o.sw)*16;x.beginPath();x.arc(px,o.y,o.r,0,6.283);x.fillStyle=col;x.globalAlpha=o.a;x.fill();x.globalAlpha=o.a*1.7;x.strokeStyle=col;x.lineWidth=1;x.stroke();if(o.y+o.r<-20)b[i]=sp(false);}x.globalAlpha=1;raf=requestAnimationFrame(f);}
return{start:function(){rs();if(!raf)f();addEventListener('resize',rs);},stop:function(){removeEventListener('resize',rs);if(raf)cancelAnimationFrame(raf);raf=null;x.clearRect(0,0,w,h);}};})()`,
  orbit: `(function(){var c=document.getElementById('bg-canvas'),x=c.getContext('2d'),w=0,h=0,t=0,r=[],raf=null,col=COLOR;
function rs(){var d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);var b=Math.min(w,h);r=[.22,.34,.48,.64].map(function(f,i){return{rf:b*f,sp:(i%2?-1:1)*(0.0016+i*0.0006),n:2+i,o:i*1.1};});}
function f(){x.clearRect(0,0,w,h);t++;var cx=w/2,cy=h/2;for(var k=0;k<r.length;k++){var g=r[k];x.beginPath();x.arc(cx,cy,g.rf,0,6.283);x.strokeStyle=col;x.globalAlpha=.1;x.lineWidth=1;x.stroke();for(var i=0;i<g.n;i++){var a=t*g.sp*60+g.o+6.283*i/g.n;x.beginPath();x.arc(cx+Math.cos(a)*g.rf,cy+Math.sin(a)*g.rf,2.4,0,6.283);x.fillStyle=col;x.globalAlpha=.55;x.fill();}}x.globalAlpha=1;raf=requestAnimationFrame(f);}
return{start:function(){rs();if(!raf)f();addEventListener('resize',rs);},stop:function(){removeEventListener('resize',rs);if(raf)cancelAnimationFrame(raf);raf=null;x.clearRect(0,0,w,h);}};})()`,
  waves: `(function(){var c=document.getElementById('bg-canvas'),x=c.getContext('2d'),w=0,h=0,t=0,raf=null,col=COLOR;
function rs(){var d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);}
function f(){x.clearRect(0,0,w,h);t+=0.014;for(var l=0;l<3;l++){x.beginPath();var amp=26+l*14,base=h*(.62+l*.09);x.moveTo(0,base);for(var px=0;px<=w;px+=8){x.lineTo(px,base+Math.sin(px/130+t*(1+l*.3)+l)*amp);}x.lineTo(w,h);x.lineTo(0,h);x.closePath();x.fillStyle=col;x.globalAlpha=.075-l*.016;x.fill();x.globalAlpha=.22;x.strokeStyle=col;x.lineWidth=1;x.stroke();}x.globalAlpha=1;raf=requestAnimationFrame(f);}
return{start:function(){rs();if(!raf)f();addEventListener('resize',rs);},stop:function(){removeEventListener('resize',rs);if(raf)cancelAnimationFrame(raf);raf=null;x.clearRect(0,0,w,h);}};})()`,
  matrix: `(function(){var c=document.getElementById('bg-canvas'),x=c.getContext('2d'),w=0,h=0,cols=[],fs=14,raf=null,last=0,col=COLOR,chars='アカサタナハマヤラワ0123456789ABCDEF<>{}[]/*+-';
function rs(){var d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);var n=Math.floor(w/fs);cols=[];for(var i=0;i<n;i++)cols.push(Math.random()*-50);}
function f(ts){if(ts-last>52){last=ts;x.fillStyle='rgba(0,0,0,0.10)';x.fillRect(0,0,w,h);x.font=fs+'px ui-monospace,monospace';for(var i=0;i<cols.length;i++){var ch=chars[Math.floor(Math.random()*chars.length)];x.fillStyle=col;x.globalAlpha=.55;x.fillText(ch,i*fs,cols[i]*fs);cols[i]=cols[i]*fs>h+Math.random()*300?0:cols[i]+1;}x.globalAlpha=1;}raf=requestAnimationFrame(f);}
return{start:function(){rs();if(!raf)raf=requestAnimationFrame(f);addEventListener('resize',rs);},stop:function(){removeEventListener('resize',rs);if(raf)cancelAnimationFrame(raf);raf=null;x.clearRect(0,0,w,h);}};})()`,
  'gradient-flow': `(function(){return{start:function(){document.body.setAttribute('data-effect','gradient-flow');},stop:function(){document.body.removeAttribute('data-effect');}};})()`
};

/* ---------------- CSS رابط فایل خروجی ---------------- */
const UI_CSS = `
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{font-family:var(--d-font,'Vazirmatn',system-ui,sans-serif);background:#0e1020;color:#e9edf9;-webkit-font-smoothing:antialiased}
.doc-page[dir="ltr"]{font-family:'Inter',system-ui,sans-serif;text-align:left}
#bg-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:var(--fx-opacity,.5)}
body[data-effect="none"] #bg-canvas{display:none}
body[data-effect="gradient-flow"] #bg-canvas{display:none}
body[data-effect="gradient-flow"]::before{content:'';position:fixed;inset:-20%;z-index:0;pointer-events:none;opacity:var(--fx-opacity,.5);
 background:radial-gradient(closest-side at 30% 30%,var(--fx-color,#4f8cff),transparent),radial-gradient(closest-side at 70% 60%,#6c5ce7,transparent),radial-gradient(closest-side at 50% 85%,#16c79a,transparent);
 translate:var(--react-x,0px) var(--react-y,0px);filter:blur(48px) brightness(var(--react-brightness,1));animation:gfShift 18s ease-in-out infinite alternate}
@keyframes gfShift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4%,-3%,0) scale(1.12)}100%{transform:translate3d(-4%,4%,0) scale(1.05)}}
.doc-toolbar{position:sticky;top:0;z-index:20;display:flex;gap:.35rem;align-items:center;flex-wrap:wrap;
 padding:.45rem .7rem;background:rgba(14,16,32,.86);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.12)}
.doc-toolbar .tb-brand{font-size:.8rem;font-weight:700;margin-inline-end:.6rem;color:#cfd8f5}
.doc-toolbar button,.doc-toolbar select{font-family:inherit;font-size:.75rem;padding:.32rem .6rem;border-radius:8px;cursor:pointer;
 background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#e9edf9;transition:background .18s}
.doc-toolbar button:hover{background:rgba(255,255,255,.16)}
.doc-toolbar button.on{background:linear-gradient(135deg,#4f8cff,#6c5ce7);border-color:transparent;color:#fff}
.document-content{position:relative;z-index:1;width:min(1320px,96vw);margin:22px auto 0;background:transparent;border-radius:0;box-shadow:none;padding:clamp(20px,3.4vw,46px)}
#custom-bg{position:fixed;inset:0;width:100%;height:100%;border:0;pointer-events:none;z-index:0;opacity:var(--fx-opacity,.5)}
.ds-credit{position:relative;z-index:1;text-align:center;font-size:.72rem;color:#93a0c0;padding:18px 12px 34px;line-height:2}
.ds-credit a{color:#8fb0ff;text-decoration:none}
#effect-panel{position:fixed;inset-block-end:14px;inset-inline-start:14px;z-index:22;background:rgba(16,18,32,.94);
 border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:.8rem;width:min(270px,90vw);font-size:.75rem;
 box-shadow:0 16px 40px rgba(0,0,0,.5);display:none}
#effect-panel.open{display:block}
#effect-panel label{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.5rem}
#effect-panel select,#effect-panel input[type=color]{background:#1b2036;color:#e9edf9;border:1px solid #2b3350;border-radius:7px;padding:.2rem;font-family:inherit;font-size:.72rem}
#effect-panel input[type=range]{width:110px}
#effect-panel .ep-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;font-weight:700;color:#cfd8f5}
.lock-wrap{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:radial-gradient(900px 600px at 70% 0%,#1b2a5c,#0b0d18 60%)}
.lock-card{width:min(380px,92vw);background:rgba(22,24,42,.94);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:1.6rem;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.6)}
.lock-card h1{font-size:1.05rem;margin:.2rem 0 .3rem}
.lock-card p{font-size:.76rem;color:#9aa4bf;margin:0 0 1rem;line-height:1.9}
.lock-card input{width:100%;padding:.6rem .7rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;font-family:inherit;margin-bottom:.6rem}
.lock-card button{width:100%;padding:.62rem;border:0;border-radius:10px;background:linear-gradient(135deg,#4f8cff,#6c5ce7);color:#fff;font-family:inherit;font-size:.85rem;cursor:pointer}
.lock-err{color:#ff8095;font-size:.74rem;min-height:1.2em;margin-bottom:.3rem}
.lock-icon{font-size:2rem}

/* Print studio: the same source blocks, separate print-only visual treatment. */
.print-studio{display:none;position:sticky;top:0;z-index:40;max-height:48vh;overflow:auto;background:#f5f7fb;color:#172033;padding:14px 20px;border-bottom:1px solid #cdd5e3;font-family:Vazirmatn,system-ui,sans-serif}
.print-studio h2{font-size:1rem;margin:0 0 8px}.print-studio .print-controls{display:flex;gap:10px;align-items:end;flex-wrap:wrap}
.print-studio label{display:flex;flex-direction:column;gap:4px;font-size:.75rem;font-weight:600}.print-studio select,.print-studio button{font:inherit;border:1px solid #bac6d8;border-radius:8px;padding:7px 10px;background:white;color:#172033;cursor:pointer}
.print-studio .print-go{background:#315acb;color:white;border-color:#315acb}.print-studio p{font-size:.73rem;margin:8px 0 0;color:#536175}
body.print-workspace{background:#dce2eb;color:#172033}body.print-workspace::before,body.print-workspace #bg-canvas,body.print-workspace .ds-interaction-layer,body.print-workspace .ds-custom-interaction,body.print-workspace #custom-bg,body.print-workspace .doc-toolbar,body.print-workspace #effect-panel,body.print-workspace .present-bar,body.print-workspace .present-progress,body.print-workspace .ds-credit{display:none!important}
body.print-workspace .print-studio{display:block}body.print-workspace .document-content{width:min(var(--preview-width,794px),94vw);min-height:900px;margin:24px auto;padding:var(--print-preview-margin,12mm);border-radius:2px;background:white;box-shadow:0 4px 20px #29364b30}
body.print-workspace .doc-page.site-page[data-web-layout="grid"]{display:block}
body.print-workspace .doc-page.site-page{--d-accent:var(--print-accent)!important;--d-th-bg:var(--print-accent)!important;--d-bg:var(--print-paper,#fff);--d-text:var(--print-text,#222);--d-title:var(--print-accent);--d-accent:var(--print-accent);--d-accent-light:var(--print-pale);--d-th-bg:var(--print-accent);--d-zebra:#f6f7f8;--d-border:#d4d6db;background:var(--print-paper,#fff)!important;color:var(--print-text,#222)!important;font-size:var(--print-font-size,15px)!important}
body.print-workspace{--print-accent:#253c5c;--print-pale:#eef2f6}
body.print-workspace[data-print-theme="mono"]{--print-accent:#222;--print-pale:#f3f3f3}
body.print-workspace[data-print-theme="classic"]{--print-accent:#6b4a25;--print-pale:#f8f3e9}
body.print-workspace[data-print-theme="academic"]{--print-accent:#245844;--print-pale:#edf5ef}
body.print-workspace[data-print-theme="modern"]{--print-accent:#234c92;--print-pale:#edf3fa}
body.print-workspace .doc-page.site-page .b-heading h1,body.print-workspace .doc-page.site-page .b-heading h2,body.print-workspace .doc-page.site-page .b-heading h3,body.print-workspace .doc-page.site-page .b-heading h4,body.print-workspace .doc-page.site-page .tl-title,body.print-workspace .doc-page.site-page .stat-value,body.print-workspace .doc-page.site-page .sign-name,body.print-workspace .doc-page.site-page .chart-title{color:var(--print-accent)}
body.print-workspace .doc-page.site-page .b-text blockquote,body.print-workspace .doc-page.site-page .tl-desc,body.print-workspace .doc-page.site-page .stat-label,body.print-workspace .doc-page.site-page .legend,body.print-workspace .doc-page.site-page .sign-title,body.print-workspace .doc-page.site-page figcaption,body.print-workspace .doc-page.site-page caption{color:#505963}
body.print-workspace .doc-page.site-page .b-table td{background:var(--print-paper,#fff);color:var(--print-text,#222)}
body.print-workspace .doc-page.site-page .b-table tbody tr:nth-child(even) td{background:#f7f8fa}
body.print-workspace .b-hero{background:var(--print-pale)!important;color:var(--print-accent)!important;border-inline-start:4px solid var(--print-accent);border-radius:0;padding:20px!important}
body.print-workspace .b-hero .hero-badge{color:var(--print-accent);background:transparent;border:1px solid currentColor}
body.print-workspace .doc-page .b.anim{opacity:var(--block-opacity,1)!important;transform:none!important;animation:none!important}body.print-workspace .doc-page .b-timeline ol.cascade li{opacity:1!important;transform:none!important;animation:none!important}
body.print-workspace .doc-page .b{box-shadow:none!important}
body.print-workspace .doc-page .b.print-hidden{display:none!important}
.print-blocks{display:flex;flex-wrap:wrap;gap:8px}.print-blocks label{display:flex;flex-direction:row;align-items:center;border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:7px}
body.print-workspace .doc-page .b-table th,body.print-workspace .doc-page .b-table td{border:1px solid #cbd0d8}
body.print-workspace .doc-page .b-table th{background:var(--print-pale)!important;color:var(--print-accent)!important}
body.print-workspace[data-print-theme="mono"] .doc-page .b *{text-shadow:none!important}
body.print-workspace[data-print-layout="centered"] .b-hero{text-align:center;align-items:center;border:0;border-bottom:3px solid var(--print-accent)}
body.print-workspace[data-print-layout="centered"] .b-heading{text-align:center}
body.print-workspace[data-print-layout="centered"] .b-heading .underline{margin-inline:auto}
body.print-workspace[data-print-layout="framed"] .doc-page .b:not(.b-hero){border:1px solid var(--print-accent);border-radius:8px;padding:12px}
body.print-workspace[data-print-layout="minimal"] .doc-page .b-table th,body.print-workspace[data-print-layout="minimal"] .doc-page .b-table td{border:0;border-bottom:1px solid #cbd0d8}
body.print-workspace .custom-layout-content *{background:transparent!important;color:var(--print-text,#222)!important;box-shadow:none!important}
body.print-workspace[data-print-layout="framed"] .b-hero{border:2px solid var(--print-accent);border-radius:12px}
body.print-workspace[data-print-layout="minimal"] .b-hero{background:transparent!important;border:0;border-bottom:1px solid var(--print-accent);padding:8px 0 16px!important}
/* Keep paper dimensions at CSS physical size; narrow screens scroll horizontally. */
body.print-workspace .document-content,body.print-workspace.print-panel-hidden .document-content{position:relative;width:var(--preview-width,210mm)!important;max-width:none!important;min-height:var(--preview-height,297mm)!important;padding:var(--print-preview-margin,12mm)!important}
body.print-workspace[data-print-frame]:not([data-print-frame="none"]) .document-content::after{content:"";position:absolute;top:var(--print-frame-inset,12mm);left:var(--print-frame-inset,12mm);right:var(--print-frame-inset,12mm);height:calc(var(--preview-height,297mm) - 2 * var(--print-frame-inset,12mm));pointer-events:none;z-index:30;border:1px solid var(--print-accent);box-sizing:border-box}
body.print-workspace[data-print-frame="double"] .document-content::after{border:4px double var(--print-accent)}
body.print-workspace[data-print-frame="dashed"] .document-content::after{border:2px dashed var(--print-accent)}
body.print-workspace[data-print-frame="bold"] .document-content::after{border:3px solid var(--print-accent)}
@media print{body.print-workspace .document-content::after{display:none!important}body.print-workspace .document-content{min-height:0!important;padding:0!important;width:100%!important}}
body.print-workspace[data-print-layout="ledger"] .doc-page .b-table :is(th,td){border:1px solid var(--print-accent)!important}
body.print-workspace[data-print-layout="receipt"] .doc-page .b{font-size:.9em;border-bottom:1px dashed #aab3c0;padding-bottom:8px}
body.print-workspace[data-print-layout="columns"] .doc-page{columns:2;column-gap:12mm;display:block!important}
body.print-workspace[data-print-layout="columns"] .doc-page>.b{break-inside:avoid}
body.print-workspace[data-print-density="compact"] .doc-page .b{margin-bottom:8px}body.print-workspace[data-print-density="relaxed"] .doc-page .b{margin-bottom:26px}
.print-studio details{margin-top:10px}.print-studio textarea{width:min(700px,100%);min-height:90px;font:12px/1.5 monospace;direction:ltr;text-align:left;border:1px solid #bac6d8;border-radius:8px;padding:8px}
.print-studio input[type=color]{width:40px;height:35px;border:1px solid #bac6d8;border-radius:7px;background:#fff;cursor:pointer}
.print-studio input[type=number]{width:65px;border:1px solid #bac6d8;border-radius:7px;padding:7px;background:#fff}

/* Inspector-style print tools, with a collapsible mobile drawer. */
body.print-workspace{padding-inline-start:300px;box-sizing:border-box}
body.print-workspace .print-studio{position:fixed;inset-block:0;inset-inline-start:0;width:300px;max-height:none;overflow-y:auto;background:#f9fafc;border:0;border-inline-end:1px solid #d5dbe5;padding:60px 14px 24px;box-shadow:3px 0 18px #24304412;z-index:40}
.print-studio h2{font-size:14px;margin:0 0 14px;color:#182433}
.print-studio .print-controls{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
.print-studio .print-controls>label{min-width:0;font-size:11px;color:#536070}
.print-studio select,.print-studio input[type=number]{width:100%;height:36px;box-sizing:border-box;background:#fff;color:#182433;border:1px solid #d7dde6;border-radius:8px}
.print-studio input[type=color]{width:100%;height:36px;border-color:#d7dde6}
.print-studio .print-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.print-studio .print-actions button{min-height:38px;font-weight:700}.print-studio .print-go{background:#345fdb;border-color:#345fdb}
.print-studio details{border-top:1px solid #e1e6ee;padding:12px 0 0;margin:14px 0 0}.print-studio summary{cursor:pointer;font-size:12px;font-weight:700;color:#344153}
.print-studio details[open] summary{margin-bottom:10px}
.print-studio .print-blocks{display:flex;flex-direction:column;gap:5px}.print-studio .print-blocks label{font-size:11px;font-weight:500;border:0;padding:7px;background:#eef2f7;min-width:0;overflow-wrap:anywhere}
.print-studio .print-blocks input{flex-shrink:0}.print-studio textarea{width:100%;box-sizing:border-box}
#print-panel-toggle{display:none;position:fixed;z-index:42;inset-block-start:12px;inset-inline-start:12px;border:1px solid #d2dae6;background:#fff;color:#263448;border-radius:9px;padding:8px 11px;min-height:38px;cursor:pointer;font:600 12px Vazirmatn,system-ui,sans-serif;box-shadow:0 4px 12px #1f33441c}
body.print-workspace #print-panel-toggle{display:flex;align-items:center;gap:6px} #print-panel-toggle svg{width:16px;height:16px}
body.print-workspace.print-panel-hidden{padding-inline-start:0}body.print-workspace.print-panel-hidden .print-studio{display:none}
body.print-workspace .document-content{width:min(var(--preview-width,794px),calc(100vw - 332px))!important;margin:24px auto;padding:var(--print-preview-margin,12mm)}
body.print-workspace.print-panel-hidden .document-content{width:min(var(--preview-width,794px),94vw)!important}
@media(max-width:700px){body.print-workspace{padding-inline-start:0}body.print-workspace .print-studio{width:min(300px,86vw);box-shadow:0 10px 35px #16233944}body.print-workspace .document-content{width:min(var(--preview-width,794px),94vw)!important;padding:var(--print-preview-margin,12mm);margin-top:62px}}
/* Panel placement follows UI direction, independently from document direction. */
@media(min-width:701px){
body.print-workspace[data-ui-dir="ltr"]{padding-left:300px;padding-right:0}
body.print-workspace[data-ui-dir="rtl"]{padding-right:300px;padding-left:0}
body.print-workspace[data-ui-dir="ltr"] .print-studio{left:0;right:auto}
body.print-workspace[data-ui-dir="rtl"] .print-studio{right:0;left:auto}
body.print-workspace[data-ui-dir="ltr"] #print-panel-toggle{left:12px;right:auto}
body.print-workspace[data-ui-dir="rtl"] #print-panel-toggle{right:12px;left:auto}
body.print-workspace.print-panel-hidden{padding-left:0;padding-right:0}
}
body.print-workspace[data-ui-skin="dark"] .print-studio{background:#242a34;color:#e9eef7;border-color:#3d4755}
body.print-workspace[data-ui-skin="dark"] .print-studio h2,body.print-workspace[data-ui-skin="dark"] .print-studio summary{color:#e8eef8}
body.print-workspace[data-ui-skin="dark"] .print-studio label,body.print-workspace[data-ui-skin="dark"] .print-studio p{color:#c2cbd8}
body.print-workspace[data-ui-skin="dark"] .print-studio select,body.print-workspace[data-ui-skin="dark"] .print-studio input,body.print-workspace[data-ui-skin="dark"] .print-studio textarea,body.print-workspace[data-ui-skin="dark"] .print-studio button:not(.print-go){background:#303946;color:#f0f4fa;border-color:#505c6d}
body.print-workspace[data-ui-skin="dark"] .print-studio details{border-color:#47505d}body.print-workspace[data-ui-skin="dark"] .print-blocks label{background:#303946;color:#eaf0f9}
body.print-workspace[data-ui-skin="dark"] #print-panel-toggle{background:#303946;color:#fff;border-color:#586475}
@media print{body.print-workspace{padding:0!important}#print-panel-toggle{display:none!important}}
@media print{.print-studio{display:none!important}body.print-workspace .document-content{width:100%!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important}body.print-workspace .doc-page *{-webkit-print-color-adjust:exact;print-color-adjust:exact}body.print-workspace .doc-page .b{break-inside:auto;page-break-inside:auto}body.print-workspace .doc-page tr,body.print-workspace .doc-page .b-hero,body.print-workspace .doc-page .b-stat,body.print-workspace .doc-page .b-image{break-inside:avoid;page-break-inside:avoid}body.print-workspace .doc-page thead{display:table-header-group}}

body[data-web-surface="light"]{background:#f4f7fb;color:#1b2637}
body[data-web-width="bounded"] .document-content,body.presenting[data-web-width="bounded"] .document-content{width:min(900px,96vw)}
body[data-web-width="wide"] .document-content,body.presenting[data-web-width="wide"] .document-content{width:min(1320px,96vw)}
body[data-web-width="full"] .document-content,body.presenting[data-web-width="full"] .document-content{width:100%}
@media print{body.print-workspace .document-content,body.print-workspace.print-panel-hidden .document-content{width:100%!important}}
/* present mode */
body.presenting{background:#07080f}
body.presenting .doc-toolbar,body.presenting .ds-credit,body.presenting #effect-panel{display:none}
body.presenting .document-content{border-radius:0}
body.presenting .document-content{width:min(1320px,96vw);border-radius:0;box-shadow:none;margin-top:14px}
.present-bar{position:fixed;inset-block-end:14px;left:50%;right:auto;transform:translateX(-50%);z-index:30;display:none;
 gap:.25rem;align-items:center;padding:.3rem .5rem;border-radius:99px;background:rgba(16,18,32,.86);border:1px solid rgba(255,255,255,.16);box-shadow:0 12px 34px rgba(0,0,0,.55)}
body.presenting .present-bar{display:flex;max-width:98vw}
@media(max-width:480px){.present-bar{gap:0;padding:.25rem}.present-bar button{width:28px;flex:0 0 28px}.present-bar .pc-count{min-width:45px}}
.present-bar button{width:32px;height:32px;border:0;border-radius:99px;background:transparent;color:#dfe6ff;cursor:pointer;font-size:.85rem}
.present-bar button:hover{background:rgba(255,255,255,.16)}
.present-bar .pc-count{font-size:.7rem;color:#9fb0d0;min-width:56px;text-align:center;direction:ltr}
.present-progress{position:fixed;top:0;inset-inline:0;height:3px;background:rgba(255,255,255,.1);z-index:31;display:none}
body.presenting .present-progress{display:block}
.present-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#4f8cff,#7b6bff);transition:width .2s linear}
@media print{
  #bg-canvas,.ds-interaction-layer,.ds-custom-interaction,#custom-bg,#effect-panel,.doc-toolbar,.ds-credit,.present-bar,.present-progress,.lock-wrap{display:none !important}
  html,body{background:#fff !important;color:#000 !important}
  .document-content{width:100% !important;margin:0 !important;box-shadow:none !important;border-radius:0 !important;padding:0 !important}
  .doc-page .b{box-shadow:none !important;break-inside:avoid;page-break-inside:avoid}
  .doc-page .b.anim{opacity:var(--block-opacity,1) !important;animation:none !important;transform:none !important}
  @page{size:A4;margin:12mm}
}
body.print-workspace .doc-page .b.b-hero{background:transparent!important;border:0!important;padding:0!important}
/* Print flow must not clip blocks moved upward in normal layout. */
body.print-workspace[data-print-placement="flow"] .doc-page:not([data-free-layout="true"])>.b{top:auto!important;margin-bottom:16px!important}
@media print{.doc-page:not([data-free-layout="true"])>.b{top:auto!important;margin-bottom:16px!important}}
/* Automatic print flow is the safe default for free-positioned documents. */
body.print-workspace[data-print-placement="flow"] .doc-page[data-free-layout="true"]{min-height:0!important;height:auto!important}
body.print-workspace[data-print-placement="flow"] .doc-page[data-free-layout="true"]>.b{position:relative!important;left:auto!important;top:auto!important;width:100%!important;max-width:100%!important;margin:0 0 16px!important;min-height:0!important}
body.print-workspace[data-print-placement="flow"] .doc-page[data-free-layout="true"]>.doc-footer{position:static;width:auto}
@media print{.doc-page .b{overflow:visible!important;height:auto!important}.doc-page .b-table table{table-layout:fixed!important}.doc-page .b-table :is(td,th){overflow-wrap:anywhere!important}.doc-page pre{white-space:pre-wrap!important;overflow:visible!important;word-break:break-word!important}}
@media screen{body.print-workspace .document-content,body.print-workspace.print-panel-hidden .document-content{width:var(--preview-width,210mm)!important;min-height:var(--preview-height,297mm)!important;max-width:none!important;padding:var(--print-preview-margin,12mm)!important}body.print-workspace[data-print-frame="double"] .document-content::after{border:4px double var(--print-accent)!important}body.print-workspace[data-print-frame="dashed"] .document-content::after{border:2px dashed var(--print-accent)!important}body.print-workspace[data-print-frame="bold"] .document-content::after{border:3px solid var(--print-accent)!important}}


/* Mobile print: fit a true-size paper canvas on screen without changing print dimensions. */
@media screen and (max-width:700px){
 body.print-workspace{padding:0!important}
 body.print-workspace #print-preview-viewport{width:100%;padding:64px 12px 30px;overflow-x:auto;overflow-y:hidden;box-sizing:border-box;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
 body.print-workspace #print-preview-stage{position:relative;margin:0 auto}
 body.print-workspace #print-preview-stage .document-content{position:absolute;top:0;left:0;margin:0!important;transform-origin:top left;transform:scale(var(--mobile-paper-scale,1))}
 body.print-workspace .print-studio{width:min(340px,88vw);padding:64px 18px 26px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
 body.print-workspace .print-studio .print-controls{gap:14px 10px}
 body.print-workspace .print-studio .print-controls>label{font-size:13px;line-height:1.3}
 body.print-workspace .print-studio select,body.print-workspace .print-studio input[type=number],body.print-workspace .print-studio input[type=color],body.print-workspace .print-studio button{min-height:44px;font-size:16px}
 body.print-workspace .print-studio summary{font-size:14px;min-height:32px}
 body.print-workspace #print-panel-toggle{min-height:44px;font-size:14px}
 body.print-workspace #mobile-preview-tools{display:flex;position:fixed;z-index:38;inset-block-start:12px;inset-inline-end:12px;gap:3px;align-items:center;background:#fff;color:#243248;padding:3px;border-radius:10px;box-shadow:0 4px 12px #1f33441c}
 body.print-workspace #mobile-preview-tools button{min-width:38px;height:38px;border:0;border-radius:7px;background:#eaf0f9;color:#243248;font:600 13px system-ui,sans-serif;cursor:pointer}
 body.print-workspace #mobile-preview-tools output{min-width:38px;text-align:center;font:600 11px system-ui,sans-serif;color:#243248}
 body.print-workspace[data-ui-skin="dark"] #mobile-preview-tools{background:#303946;color:#fff}body.print-workspace[data-ui-skin="dark"] #mobile-preview-tools button{background:#465265;color:white}body.print-workspace[data-ui-skin="dark"] #mobile-preview-tools output{color:white}
 body.print-workspace #print-panel-shade{display:block;position:fixed;inset:0;border:0;background:#0d152988;z-index:39;width:100%;height:100%;padding:0}
 body.print-workspace.print-panel-hidden #print-panel-shade{display:none}
}
#print-panel-shade,#mobile-preview-tools{display:none}
@media print{#print-preview-viewport,#print-preview-stage{display:block!important;position:static!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;overflow:visible!important}body.print-workspace #print-preview-stage .document-content{position:relative!important;transform:none!important;margin:0!important}#print-panel-shade,#mobile-preview-tools{display:none!important}}

`;

/* ---------------- CSS حالت قفل ---------------- */

/* ---------------- ساخت HTML بلوک‌ها ---------------- */
export function renderBlocksHTML(doc, { editable = false, animate = false } = {}) {
  const tmp = document.createElement('div');
  (doc.blocks || []).forEach((b, i) => {
    tmp.appendChild(renderBlock(b, { editable, animate, animateCharts:animate, index: i, doc }));
  });
  if (showDocumentBranding(doc)) {
    const f = document.createElement('div'); f.className = 'doc-footer';
    f.textContent = doc.lang === 'en' ? 'Made with Document Studio' : 'ساخته شده با سندساز هوشمند';
    tmp.appendChild(f);
  }
  return tmp.innerHTML;
}

/* ---------------- موتور جاوااسکریپت فایل خروجی ---------------- */
function runtimeJS(cfg) {
  const { effectCode, encrypted } = cfg;
  return `
(function(){
  'use strict';
  var CFG = window.__DS__ || {};
  var DOC = CFG.doc || CFG;   /* در فایل رمزنگاری‌شده پس از باز شدن جایگزین می‌شود */
  var state = { mode: DOC.mode || 'view', presentIndex: 0, autoTimer: null };
  var customBackgroundDocument = ${customBackgroundDocument.toString()};
  var scopePrintCss = ${scopeCss.toString()};
  var numeric = ${numeric.toString()}, parseNumber=numeric;
  var persianDigits = ${persianDigits.toString()}, normalizeEditableDigits = ${normalizeEditableDigits.toString()};
  var evaluateFormula = ${evaluateFormula.toString()}, tableValue = ${tableValue.toString()}, displayTableCell = ${displayTableCell.toString()}, smartFooter = ${smartFooter.toString()};
  function refreshSmartTable(table){
    var headers=[].slice.call(table.querySelectorAll('thead th')),rows=[].slice.call(table.querySelectorAll('tbody tr'));
    var data={headers:headers.map(function(h){return h.textContent}),columnConfigs:headers.map(function(h){return {type:h.dataset.columnType||'text',formula:h.dataset.columnFormula||'',aggregate:h.dataset.columnAggregate||'none'}}), rows:rows.map(function(tr){return [].slice.call(tr.cells).map(function(c){return c.textContent})})};
    rows.forEach(function(tr,r){[].slice.call(tr.cells).forEach(function(cell,c){if(cell.hasAttribute('data-calculated'))cell.textContent=displayTableCell(data,data.rows[r],c,DOC.lang);});});
    var footer=table.querySelector('tfoot tr'),values=smartFooter(data,DOC.lang);if(footer)[].slice.call(footer.cells).forEach(function(cell,i){if(cell.hasAttribute('data-aggregate'))cell.textContent=values[i];});
  }
  document.addEventListener('click',function(e){if(state.mode==='edit'&&e.target.closest('.mini-link'))e.preventDefault();});
  document.addEventListener('input',function(e){var table=e.target.closest&&e.target.closest('.b-table table'),ed=e.target.closest&&e.target.closest('[data-edit]');if(table&&ed){if(DOC.lang==='fa'&&!e.isComposing&&e.inputType==='insertFromPaste')normalizeEditableDigits(ed);refreshSmartTable(table);}});
  document.addEventListener('beforeinput',function(e){var sel=window.getSelection(),parent=sel&&sel.anchorNode&&sel.anchorNode.parentElement,word=sel&&sel.anchorNode&&sel.anchorNode.textContent.slice(0,sel.anchorOffset).split(' ').pop()||'';if((parent&&parent.closest('a,code,pre'))||word.includes('://')||word.includes('www.')||word.includes('@')||DOC.lang!=='fa'||!e.target.closest||!e.target.closest('[data-edit]')||e.isComposing||e.inputType!=='insertText'||!/[0-9٠-٩]/.test(e.data||''))return;e.preventDefault();document.execCommand('insertText',false,persianDigits(e.data));});
  document.addEventListener('compositionend',function(e){var ed=e.target.closest&&e.target.closest('.b-table [data-edit]');if(ed&&DOC.lang==='fa'&&normalizeEditableDigits(ed))ed.dispatchEvent(new Event('input',{bubbles:true}));});

  var setupFreePage = ${setupFreePage.toString()},freePage=null;

  /* ---------- افکت پس‌زمینه ---------- */
  var activeEffect = null, activeInteraction = null, activeReactive = null;
  var makeInteraction = ${createInteraction.toString()};
  var makeReactive = ${createReactiveBackground.toString()};
  var makeCustomInteraction = ${createCustomInteraction.toString()};
  function initEffect(name){
    var root = document.documentElement;
    root.style.setProperty('--fx-opacity', String(DOC.effectOpacity != null ? DOC.effectOpacity : 0.4));
    root.style.setProperty('--fx-color', DOC.effectColor || '#4f8cff');
    document.body.setAttribute('data-effect', name || 'none');
    var custom = document.getElementById('custom-bg');
    if (custom) {
      if (name === 'custom') { custom.style.display = 'block'; custom.srcdoc = customBackgroundDocument(DOC.customBackground || {}); }
      else { custom.style.display = 'none'; custom.removeAttribute('srcdoc'); }
    }
    var canvas = document.getElementById('bg-canvas');
    if (canvas) canvas.style.display = name === 'custom' ? 'none' : '';
    if (activeEffect && activeEffect.stop) { try{ activeEffect.stop(); }catch(e){} }
    activeEffect = null;
    if(activeInteraction){activeInteraction.destroy();activeInteraction=null;}
    if(activeReactive){activeReactive.destroy();activeReactive=null;}
    if(name!=='none'&&(DOC.bgReactMove||DOC.bgReactClick)){var pseudo=name==='gradient-flow',target=pseudo?document.body:name==='custom'?custom:canvas;activeReactive=makeReactive(target,{move:!!DOC.bgReactMove,click:!!DOC.bgReactClick,pseudo:pseudo});}
    if(DOC.bgInteractive && !matchMedia('(prefers-reduced-motion: reduce)').matches) activeInteraction=DOC.bgInteractiveMode==='custom'?makeCustomInteraction(document.body,DOC.customInteraction||{},DOC.bgInteractiveOpacity != null?DOC.bgInteractiveOpacity:.65):makeInteraction(document.body,DOC.effectColor||'#4f8cff',DOC.bgInteractiveOpacity != null?DOC.bgInteractiveOpacity:.65,DOC.bgInteractiveMode||'trail');
    var maker = window.__DS_EFFECTS__ && window.__DS_EFFECTS__[name];
    if (!maker || name === 'none') return;
    try { activeEffect = maker(); if (activeEffect && activeEffect.start) activeEffect.start(); } catch(e){ console.warn(e); }
  }
  window.__dsInitEffect = initEffect;

  /* ---------- انیمیشن بلوک‌ها ---------- */
  function initAnimations(){
    var nodes = [].slice.call(document.querySelectorAll('.document-content .b.anim'));
    if (!DOC.animations) { nodes.forEach(function(n){ n.classList.add('in'); n.style.opacity='1'; }); return; }
    if (!('IntersectionObserver' in window)) { nodes.forEach(function(n){ n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) {
          var el = en.target;
          if (el.getAttribute('data-trigger') === 'load' || el.classList.contains('in')) { io.unobserve(el); return; }
          el.classList.add('in');
          startCounters(el);
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    var loadNodes = nodes.filter(function(n){ return n.getAttribute('data-trigger') === 'load'; });
    loadNodes.forEach(function(n){ n.classList.add('in'); startCounters(n); });
    nodes.filter(function(n){ return n.getAttribute('data-trigger') !== 'load'; }).forEach(function(n){ io.observe(n); });
  }
  function resetAnimations(){
    var nodes = [].slice.call(document.querySelectorAll('.document-content .b.anim'));
    nodes.forEach(function(n){
      n.classList.remove('in');
      n.style.opacity = '';
      var c = n.querySelector('[data-count-to]');
      if (c) (c.querySelector('[data-ds-ink]')||c).textContent = c.getAttribute('data-prefix') || '';
    });
    requestAnimationFrame(function(){ initAnimations(); });
  }
  window.__dsResetAnimations = resetAnimations;

  /* ---------- شمارنده اعداد ---------- */
  function startCounters(scope){
    var items = scope.querySelectorAll ? scope.querySelectorAll('[data-count-to]') : [];
    [].forEach.call(items, function(el){
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      var to = parseFloat(el.getAttribute('data-count-to')) || 0;
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      var dur = 900, t0 = null;
      function step(ts){
        if (!t0) t0 = ts;
        var p = document.body.classList.contains('print-workspace') ? 1 : Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = to * eased;
        var isFa = DOC.lang !== 'en';
        var shown = (Math.abs(to) >= 1000)
          ? Math.round(val).toLocaleString(isFa ? 'fa-IR' : 'en-US')
          : (isFa ? Math.round(val).toLocaleString('fa-IR') : (Math.round(val * 10) / 10).toString());
        (el.querySelector('[data-ds-ink]')||el).textContent = pre + shown + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- حالت‌ها ---------- */
  var music=null;
  function setMode(mode){
    if(mode==='present' && DOC.musicUrl){if(!music){music=new Audio(DOC.musicUrl);music.loop=true;music.volume=.35;}music.play().catch(function(){});}else if(music){music.pause();}
    state.mode = mode;
    document.body.classList.toggle('presenting', mode === 'present');
    var main = document.querySelector('.document-content');
    var editable = mode === 'edit';
    main.querySelectorAll('[data-edit]').forEach(function(el){
      if (editable) { el.setAttribute('contenteditable','true'); el.classList.add('is-editable'); }
      else { el.removeAttribute('contenteditable'); el.classList.remove('is-editable'); }
    });
    document.querySelectorAll('[data-mode-btn]').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-mode-btn') === mode);
    });
    var saveBtn = document.getElementById('ds-save');
    if (saveBtn) saveBtn.style.display = editable ? 'inline-block' : 'none';
    if (mode === 'present') {
      if (main.requestFullscreen) main.parentNode.requestFullscreen && document.documentElement.requestFullscreen().catch(function(){});
      resetAnimations();
      state.presentIndex = 0;
      scrollToBlock(0);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function(){});
    }
    updateProgress();
  }
  window.toggleMode = setMode;

  function blocksArr(){ return [].slice.call(document.querySelectorAll('.document-content .b')); }
  function scrollToBlock(i){
    var list = blocksArr(); if (!list.length) return;
    var idx = Math.max(0, Math.min(i, list.length - 1));
    state.presentIndex = idx;
    list[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    var counter = document.querySelector('.pc-count');
    if (counter) counter.textContent = (idx + 1) + ' / ' + list.length;
    updateProgress();
  }
  function nearestIndex(){
    var list = blocksArr();
    if (!list.length) return 0;
    var top = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (top <= 4) return 0;
    if (max > 0 && top >= max - 6) return list.length - 1;
    var mid = (window.innerHeight || 0) / 2;
    var best = 0, bestD = Infinity;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      var d = Math.abs((r.top + r.height / 2) - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function updateProgress(){
    var bar = document.querySelector('.present-progress i');
    var list = blocksArr();
    var top = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(top / max, 1) : 0;
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    var counter = document.querySelector('.pc-count');
    if (counter && list.length) {
      state.presentIndex = nearestIndex();
      counter.textContent = (state.presentIndex + 1) + ' / ' + list.length;
    }
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ---------- پنل افکت ---------- */
  function initEffectPanel(){
    var panel = document.getElementById('effect-panel');
    var btn = document.getElementById('ds-effect-btn');
    if (!panel || !btn) return;
    btn.addEventListener('click', function(){ panel.classList.toggle('open'); });
    var sel = document.getElementById('effect-select');
    var col = document.getElementById('effect-color');
    var op = document.getElementById('effect-opacity');
    var interactive=document.getElementById('effect-interactive');
    if(interactive){interactive.checked=!!DOC.bgInteractive;interactive.addEventListener('change',function(){DOC.bgInteractive=interactive.checked;initEffect(DOC.bgEffect);});}
    ['move','click'].forEach(function(type){var input=document.getElementById('effect-react-'+type);if(!input)return;var key=type==='move'?'bgReactMove':'bgReactClick';input.checked=!!DOC[key];input.addEventListener('change',function(){DOC[key]=input.checked;initEffect(DOC.bgEffect);});});
    var interactionMode=document.getElementById('effect-interaction-mode');if(interactionMode){interactionMode.value=DOC.bgInteractiveMode||'trail';interactionMode.addEventListener('change',function(){DOC.bgInteractiveMode=interactionMode.value;initEffect(DOC.bgEffect);});}
    var interactionAmount=document.getElementById('effect-interaction-amount');if(interactionAmount){interactionAmount.value=String(Math.round((DOC.bgInteractiveOpacity != null?DOC.bgInteractiveOpacity:.65)*100));interactionAmount.addEventListener('change',function(){DOC.bgInteractiveOpacity=Number(interactionAmount.value)/100;initEffect(DOC.bgEffect);});}
    if (sel) { sel.value = DOC.bgEffect || 'none'; sel.addEventListener('change', function(){
      DOC.bgEffect = sel.value; initEffect(sel.value);
      if (sel.value === 'gradient-flow') document.body.setAttribute('data-effect','gradient-flow');
    }); }
    if (col) { col.value = DOC.effectColor || '#4f8cff'; col.addEventListener('input', function(){
      DOC.effectColor = col.value;
      document.documentElement.style.setProperty('--fx-color', col.value);
      initEffect(DOC.bgEffect);
    }); }
    if (op) { op.value = String(Math.round((DOC.effectOpacity != null ? DOC.effectOpacity : 0.4) * 100));
      op.addEventListener('input', function(){
        DOC.effectOpacity = Number(op.value) / 100;
        document.documentElement.style.setProperty('--fx-opacity', String(DOC.effectOpacity));
      }); }
  }

  /* ---------- تم ---------- */
  function initThemeSelect(){
    var sel = document.getElementById('theme-select');
    if (!sel) return;
    sel.value = DOC.theme || sel.options[0] && sel.options[0].value;
    sel.addEventListener('change', function(){
      DOC.theme = sel.value;
      document.querySelector('.document-content').setAttribute('data-theme', sel.value);
    });
  }

  /* Accessible sorting for serialized tables (DOM listeners do not survive HTML export). */
  function sortTable(th){
    var table=th.closest('table'), body=table && table.querySelector('tbody'); if(!body||table.dataset.hasMerges)return;
    var col=Number(th.getAttribute('data-sort')), asc=th.getAttribute('aria-sort')!=='ascending';
    var rows=[].slice.call(body.rows); rows.sort(function(a,b){var av=a.cells[col] ? a.cells[col].textContent : '', bv=b.cells[col] ? b.cells[col].textContent : '';var an=parseNumber(av),bn=parseNumber(bv);var n=an!==null&&bn!==null?an-bn:av.localeCompare(bv,DOC.lang==='en'?'en':'fa');return asc?n:-n;});
    table.querySelectorAll('th[data-sort]').forEach(function(x){x.setAttribute('aria-sort','none');});
    th.setAttribute('aria-sort',asc?'ascending':'descending'); rows.forEach(function(row){body.appendChild(row);});
  }
  document.addEventListener('click',function(e){var th=e.target.closest && e.target.closest('.b-table th[data-sort]');if(th && state.mode!=='edit') sortTable(th);});
  document.addEventListener('keydown',function(e){var th=e.target.closest && e.target.closest('.b-table th[data-sort]');if(th && state.mode!=='edit' && (e.key==='Enter'||e.key===' ')){e.preventDefault();sortTable(th);}});

  /* ---------- کپی کد ---------- */
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('.js-copy');
    if (!t) return;
    var code = t.getAttribute('data-code') || '';
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(function(){ flash(t); });
    function flash(el){ var o = el.textContent; el.textContent = DOC.uiLang === 'en' ? '✓ Copied' : '✓ کپی شد'; setTimeout(function(){ el.textContent = o; }, 1400); }
  });

  /* ---------- ذخیره نسخه ویرایش‌شده ---------- */
  function saveEdited(){
    var copy = document.documentElement.cloneNode(true);
    copy.querySelectorAll('.ds-interaction-layer,.ds-custom-interaction').forEach(function(n){n.remove();});
    var html = '<!DOCTYPE html>\\n' + copy.outerHTML;
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (DOC.name || 'document') + '-edited.html';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- کیبورد ---------- */
  document.addEventListener('keydown', function(e){
    if (state.mode !== 'present') return;
    if (e.key === 'Escape') { setMode('view'); }
    else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); scrollToBlock(state.presentIndex + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); scrollToBlock(state.presentIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); scrollToBlock(0); }
    else if (e.key === 'End') { e.preventDefault(); scrollToBlock(blocksArr().length - 1); }
    else if (e.key.toLowerCase() === 'r') { resetAnimations(); }
    else if (e.key.toLowerCase() === 'f' && document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(function(){}); }
  });

  /* ---------- خودکار اسکرول ---------- */
  function initAutoScroll(){
    if (!DOC.autoScroll || !DOC.autoScrollInterval) return;
    state.autoTimer = setInterval(function(){
      if (state.mode !== 'present') return;
      var list = blocksArr();
      if (!list.length) return;
      var next = state.presentIndex + 1;
      if (next >= list.length) next = 0;
      scrollToBlock(next);
    }, Math.max(2, DOC.autoScrollInterval) * 1000);
  }

  var mobilePreview=null, previewObserver=null, previewFrame=0, mobileZoom=null, currentMobileScale=1;
  function refreshMobilePreview(){
    cancelAnimationFrame(previewFrame);
    previewFrame=requestAnimationFrame(function(){
      if(!document.body.classList.contains('print-workspace'))return;
      var page=document.querySelector('.document-content'); if(!page)return;
      if(window.innerWidth>700){
        if(mobilePreview){mobilePreview.viewport.replaceWith(page);if(previewObserver)previewObserver.disconnect();mobilePreview=null;}
        return;
      }
      if(!mobilePreview){
        var viewport=document.createElement('div'),stage=document.createElement('div');viewport.id='print-preview-viewport';stage.id='print-preview-stage';
        page.replaceWith(viewport);viewport.appendChild(stage);stage.appendChild(page);mobilePreview={viewport:viewport,stage:stage};
        if(window.ResizeObserver){previewObserver=new ResizeObserver(function(){refreshMobilePreview();});previewObserver.observe(page);}
      }
      var width=page.offsetWidth, height=page.offsetHeight;
      if(!width)return;
      var fit=Math.min(1,Math.max(.1,(document.documentElement.clientWidth-24)/width));
      var scale=mobileZoom===null?fit:mobileZoom;currentMobileScale=scale;
      document.getElementById('mobile-zoom-value').textContent=Math.round(scale*100)+'%';
      page.style.setProperty('--mobile-paper-scale',String(scale));
      mobilePreview.stage.style.width=(width*scale)+'px';mobilePreview.stage.style.height=(height*scale)+'px';
    });
  }
  window.addEventListener('resize',refreshMobilePreview);
  function openPrintStudio(){
    if (state.mode === 'present') setMode('view');
    document.body.classList.add('print-workspace');
    document.body.classList.toggle('print-panel-hidden',window.innerWidth <= 700);
    document.getElementById('print-panel-toggle').setAttribute('aria-expanded',String(!document.body.classList.contains('print-panel-hidden')));
    document.querySelectorAll('.document-content [data-count-to]').forEach(function(el){
      var to = parseFloat(el.dataset.countTo) || 0;
      var shown = to.toLocaleString(DOC.lang === 'en' ? 'en-US' : 'fa-IR');
      el.textContent = (el.dataset.prefix || '') + shown + (el.dataset.suffix || '');
    });
    document.body.dataset.printTheme = document.getElementById('print-theme').value;
    refreshMobilePreview();
    window.scrollTo(0,0);
  }
  function closePrintStudio(){ document.body.classList.remove('print-workspace');cancelAnimationFrame(previewFrame);if(mobilePreview){var page=document.querySelector('.document-content');mobilePreview.viewport.replaceWith(page);if(previewObserver)previewObserver.disconnect();mobilePreview=null;}window.scrollTo(0,0); }
  window.__dsOpenPrint = openPrintStudio;
  var autoPrintStudio = false;
  window.addEventListener('beforeprint', function(){ if (!document.body.classList.contains('print-workspace')) { autoPrintStudio = true; openPrintStudio(); } });
  window.addEventListener('afterprint', function(){ if (autoPrintStudio) { autoPrintStudio = false; closePrintStudio(); } });

  /* ---------- بوت ---------- */
  window.__dsBoot = function(){
    var mainPage=document.querySelector('.document-content');mainPage.setAttribute('data-free-layout',String(!!DOC.freeLayout));if(freePage)freePage.destroy();freePage=setupFreePage(mainPage);
    if (DOC.mode === 'edit' && DOC.editable !== false) setMode('edit');
    initAnimations();
    initEffect(DOC.bgEffect || 'none');
    initEffectPanel();
    initThemeSelect();
    initAutoScroll();
    var bar = document.querySelector('.present-bar');
    if (bar) {
      bar.addEventListener('click', function(e){
        var b = e.target.closest('button'); if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'first') scrollToBlock(0);
        if (act === 'prev') scrollToBlock(state.presentIndex - 1);
        if (act === 'next') scrollToBlock(state.presentIndex + 1);
        if (act === 'last') scrollToBlock(blocksArr().length - 1);
        if (act === 'replay') resetAnimations();
        if (act === 'exit') setMode('view');
        if (act === 'fs' && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){});
      });
    }
    var saveBtn = document.getElementById('ds-save');
    if (saveBtn) saveBtn.addEventListener('click', saveEdited);
    document.querySelectorAll('[data-mode-btn]').forEach(function(b){
      b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode-btn')); });
    });
    var printBtn = document.getElementById('ds-print');
    if (printBtn) printBtn.addEventListener('click', openPrintStudio);
    var printFromPresent = document.getElementById('ds-present-print');
    if (printFromPresent) printFromPresent.addEventListener('click', openPrintStudio);
    var studio = document.getElementById('print-studio');
    if (studio && !studio.dataset.ready) {
      studio.dataset.ready = '1';
      function togglePrintPanel(){document.body.classList.toggle('print-panel-hidden');document.getElementById('print-panel-toggle').setAttribute('aria-expanded',String(!document.body.classList.contains('print-panel-hidden')));}
      document.getElementById('print-panel-toggle').addEventListener('click',togglePrintPanel);
      document.getElementById('print-panel-shade').addEventListener('click',togglePrintPanel);
      document.getElementById('mobile-zoom-fit').addEventListener('click',function(){mobileZoom=null;refreshMobilePreview();});
      document.getElementById('mobile-zoom-in').addEventListener('click',function(){mobileZoom=Math.min(1.5,Math.round((currentMobileScale+.15)*100)/100);refreshMobilePreview();});
      document.getElementById('mobile-zoom-out').addEventListener('click',function(){mobileZoom=Math.max(.25,Math.round((currentMobileScale-.15)*100)/100);refreshMobilePreview();});
      document.addEventListener('keydown',function(e){if(e.key==='Escape' && window.innerWidth<=700 && document.body.classList.contains('print-workspace')&&!document.body.classList.contains('print-panel-hidden')){togglePrintPanel();document.getElementById('print-panel-toggle').focus();}});
      document.getElementById('print-back').addEventListener('click', closePrintStudio);
      document.getElementById('print-go').addEventListener('click', function(){ window.print(); });
      var defaults = {official:['#253c5c','#eef2f6'],mono:['#222222','#f3f3f3'],classic:['#6b4a25','#f8f3e9'],academic:['#245844','#edf5ef'],modern:['#234c92','#edf3fa']};
      var ids = ['placement','theme','layout','accent','pale','bg','text','font','density','paper','orientation','margin','frame','css'];
      var options = DOC.printOptions || {};
      var hidden = Array.isArray(options.hidden) ? options.hidden.slice() : [];
      var blockList = document.getElementById('print-blocks');
      document.querySelectorAll('.document-content > .b').forEach(function(block, index){
        var id=block.getAttribute('data-id'); if(!id)return;
        var label=document.createElement('label'), box=document.createElement('input'), title=document.createElement('span');
        box.type='checkbox';box.checked=hidden.indexOf(id)<0;
        title.textContent=(index+1)+'. '+((block.textContent||'').trim().replace(/\s+/g,' ').slice(0,35)||block.getAttribute('data-type')||'Block');
        label.appendChild(box);label.appendChild(title);blockList.appendChild(label);
        box.addEventListener('change',function(){ hidden=hidden.filter(function(x){return x!==id;});if(!box.checked)hidden.push(id);applyPrint(); });
      });
      ids.forEach(function(id){ if (options[id] !== undefined && document.getElementById('print-'+id)) document.getElementById('print-'+id).value = options[id]; });
      function applyPrint(){
        var val = function(id){return document.getElementById('print-'+id).value;};
        document.body.dataset.printPlacement = val('placement'); document.body.dataset.printTheme = val('theme'); document.body.dataset.printLayout = val('layout'); document.body.dataset.printDensity = val('density'); document.body.dataset.printFrame=val('frame');
        document.body.style.setProperty('--print-accent', val('accent')); document.body.style.setProperty('--print-pale', val('pale'));
        document.body.style.setProperty('--print-paper', val('bg')); document.body.style.setProperty('--print-text', val('text'));
        document.body.style.setProperty('--print-font-size', Math.max(10,Math.min(24,Number(val('font'))||15))+'px');
        document.getElementById('print-custom-style').textContent = scopePrintCss(val('css'), 'body.print-workspace .doc-page.site-page');
        setPaper();
        refreshMobilePreview();
        document.querySelectorAll('.document-content > .b').forEach(function(block){block.classList.toggle('print-hidden',hidden.indexOf(block.getAttribute('data-id'))>=0);});
        var current = {hidden:hidden.slice()}; ids.forEach(function(id){current[id]=val(id)}); DOC.printOptions = current;
        if (typeof window.__dsOnPrintSettingsChange === 'function') window.__dsOnPrintSettingsChange(current);
      }
      document.getElementById('print-theme').addEventListener('change', function(e){ var d = defaults[e.target.value]; if(d){document.getElementById('print-accent').value=d[0];document.getElementById('print-pale').value=d[1];} applyPrint(); });
      ['placement','layout','accent','pale','bg','text','font','density','paper','orientation','margin','frame'].forEach(function(id){ document.getElementById('print-'+id).addEventListener('input', applyPrint); document.getElementById('print-'+id).addEventListener('change', applyPrint); });
      document.getElementById('print-css-apply').addEventListener('click',applyPrint);
      function setPaper(){
        var size = document.getElementById('print-paper').value;
        var orientation = document.getElementById('print-orientation').value;
        var margin = Math.max(0,Math.min(30,Number(document.getElementById('print-margin').value)||0));
        var frame=document.getElementById('print-frame').value;
        var styles={none:'none',single:'1px solid',double:'4px double',dashed:'2px dashed',bold:'3px solid'};
        if(!styles[frame])frame='none';
        var page=document.querySelector('.document-content'),dim={A3:[297,420],A4:[210,297],A5:[148,210],A6:[105,148],B5:[176,250],letter:[215.9,279.4],legal:[215.9,355.6],tabloid:[279.4,431.8]}[size]||[210,297];
        if(orientation==='landscape')dim=[dim[1],dim[0]];
        page.style.setProperty('--preview-width',dim[0]+'mm');page.style.setProperty('--preview-height',dim[1]+'mm');page.style.setProperty('--print-preview-margin',(margin+(frame==='none'?0:4))+'mm');page.style.setProperty('--print-frame-inset',margin+'mm');
        var border=frame==='none'?'none':styles[frame]+' '+document.getElementById('print-accent').value;
        document.getElementById('print-page-style').textContent='@page{size:'+dim[0]+'mm '+dim[1]+'mm;margin:'+margin+'mm;border:'+border+';padding:'+(frame==='none'?0:4)+'mm}';

      }
      applyPrint();
    }
    if (DOC.mode === 'present') setTimeout(function(){ setMode('present'); }, 260);
    updateProgress();
  };

  ${encrypted ? `
  /* ---------- قفل رمزنگاری ---------- */
  var PAYLOAD = window.__DS_ENC__;
  function b64ToBuf(b64){ var bin = atob(b64), bytes = new Uint8Array(bin.length); for (var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return bytes.buffer; }
  async function unlock(password){
    var salt = new Uint8Array(b64ToBuf(PAYLOAD.salt));
    var iv = new Uint8Array(b64ToBuf(PAYLOAD.iv));
    var baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt: salt, iterations: PAYLOAD.iter || 180000, hash:'SHA-256' }, baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']);
    var pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv: iv }, key, b64ToBuf(PAYLOAD.data));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  window.__dsUnlock = async function(password){
    var payload = await unlock(password);
    DOC = payload.doc || DOC; window.__DS__ = DOC;
    var main = document.querySelector('.document-content');
    main.setAttribute('data-theme', DOC.theme || 'modern-blue');
    var appearance=DOC.appearance||{}; ['surface','width','layout','style'].forEach(function(key){if(appearance[key]) main.setAttribute('data-web-'+key,appearance[key]);}); main.setAttribute('data-web-theme-hero', String(!!appearance.themeHero));
    document.body.setAttribute('data-web-surface',appearance.surface||'dark'); document.body.setAttribute('data-web-width',appearance.width||'wide');
    main.setAttribute('dir', DOC.lang === 'en' ? 'ltr' : 'rtl');
    main.innerHTML = payload.html;
    var lock = document.querySelector('.lock-wrap');
    if (lock) lock.remove();
    document.body.classList.remove('locked');
    window.__dsBoot();
  };
  document.addEventListener('DOMContentLoaded', function(){
    var form = document.getElementById('lock-form');
    var err = document.querySelector('.lock-err');
    if (form) form.addEventListener('submit', async function(e){
      e.preventDefault();
      var pw = document.getElementById('lock-pass').value;
      if (!pw) { err.textContent = DOC.uiLang === 'en' ? 'Enter your password' : 'رمز عبور را وارد کنید'; return; }
      err.textContent = DOC.uiLang === 'en' ? 'Unlocking…' : 'در حال باز کردن…';
      try { await window.__dsUnlock(pw); }
      catch (ex) { err.textContent = DOC.uiLang === 'en' ? 'Incorrect password' : 'رمز عبور نادرست است'; }
    });
  });
  ` : `
  document.addEventListener('DOMContentLoaded', function(){ window.__dsBoot(); });
  `}
})();
${effectCode}
`;
}

/* ---------------- ساخت فایل نهایی ---------------- */
export async function buildExportHTML(doc, opts = {}) {
  const mode = MODES[opts.mode] || MODES.readonly;
  const animations = opts.animations !== false;
  const bgEffect = opts.bgEffect ?? doc.settings?.bgEffect ?? 'particles';
  const effectColor = opts.effectColor ?? doc.settings?.bgEffectColor ?? '#4f8cff';
  const effectOpacity = (opts.effectOpacity ?? doc.settings?.bgEffectOpacity ?? 0.3);
  const themeId = opts.theme || doc.theme || 'modern-blue';
  const lang = doc.lang === 'en' ? 'en' : 'fa';
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const uiLang = opts.uiLang === 'en' || opts.uiLang === 'fa' ? opts.uiLang : lang;
  const title = escapeHTML(doc.name || 'سند');
  const editable = mode.editable;
  const appearance = getAppearance(doc);

  const [docCss] = await Promise.all([getDocCss()]);
  const themesCss = themeCss('.doc-page');
  const blocksHtml = renderBlocksHTML(doc, { editable, animate: animations });

  const defaultMode = opts.defaultMode === 'edit' && editable ? 'edit'
    : (opts.mode === 'present' ? 'present' : 'view');
  const docMeta = {
    name: doc.name,
    lang, uiLang,
    theme: themeId,
    mode: defaultMode,
    animations,
    bgEffect,
    bgReactMove:!!doc.settings?.bgReactMove,
    bgReactClick:!!doc.settings?.bgReactClick,
    bgInteractive:!!doc.settings?.bgInteractive,
    bgInteractiveMode:doc.settings?.bgInteractiveMode||'trail',
    bgInteractiveOpacity:doc.settings?.bgInteractiveOpacity??.65,
    customBackground: doc.settings?.customBackground || null,
    customInteraction: doc.settings?.customInteraction || null,
    musicUrl: doc.settings?.musicDataUrl || doc.settings?.musicUrl || '',
    freeLayout: !!doc.settings?.freeLayout,
    printOptions: doc.settings?.printOptions || {},
    appearance,
    effectColor,
    effectOpacity,
    autoScroll: !!(doc.settings?.autoScroll),
    autoScrollInterval: doc.settings?.autoScrollInterval || 5,
    showProgress: doc.settings?.showProgress !== false,
    editable
  };

  for(const id of ['stars','fireflies','snow','rain']) EFFECT_CODE[id]=`(${createExtra.toString()})(document.getElementById('bg-canvas'),{color:COLOR},${JSON.stringify(id)})`;
  const effectCode = '\nwindow.__DS_EFFECTS__ = {' + Object.entries(EFFECT_CODE).map(([name, code]) => JSON.stringify(name) + ':function(){return ' + code.replace(/COLOR/g, "(window.__DS__.effectColor || '#4f8cff')") + ';}').join(',') + '};';
  const runtime = runtimeJS({ effectCode, encrypted: mode.lock });

  const publicDocMeta = mode.lock ? { ...docMeta, customBackground: null, customInteraction:null, musicUrl:'', printOptions: {} } : docMeta;
  let payloadScript = '';
  let mainInner = blocksHtml;
  if (mode.lock) {
    if (!opts.password) throw new Error('password required');
    const enc = await encryptJSON({ doc: docMeta, html: blocksHtml }, opts.password);
    payloadScript = '<script id="ds-payload" type="application/json">' + JSON.stringify(enc).replace(/</g, '\\u003c') + '</script>\n' +
      '<script>window.__DS_ENC__ = JSON.parse(document.getElementById("ds-payload").textContent);</script>';
    mainInner = '';
  }

  const themeOptions = (await import('../core/state.js')).getThemes()
    .map((t) => '<option value="' + t.id + '">' + escapeHTML(t.label[uiLang] || t.label.fa) + '</option>').join('');

  const w = uiLang === 'en' ? {
    toolbar:'Document toolbar',view:'View',edit:'Edit',present:'Present',effect:'Effect',print:'Print',save:'Save file',theme:'Visual theme',effectSettings:'Background effect settings',background:'Background effect',animation:'Animation',color:'Color',opacity:'Opacity',close:'Close',
    locked:'This document is encrypted',lockHint:'Enter the password supplied by the creator to view this document.',lockSecurity:'Content is protected with AES-GCM and a PBKDF2-derived key.',password:'Password',unlock:'Unlock document',controls:'Presentation controls',first:'First',prev:'Previous block',next:'Next block',last:'Last',replay:'Replay animations',fullscreen:'Fullscreen',exit:'Exit'
  } : {
    toolbar:'نوار ابزار سند',view:'نمایش',edit:'ویرایش',present:'ارائه',effect:'افکت',print:'چاپ',save:'ذخیره فایل',theme:'تم بصری',effectSettings:'تنظیمات افکت پس‌زمینه',background:'افکت پس‌زمینه',animation:'انیمیشن',color:'رنگ',opacity:'شفافیت',close:'بستن',
    locked:'این سند رمزنگاری شده است',lockHint:'برای مشاهده محتوا، رمز عبور تعیین‌شده توسط سازنده را وارد کنید.',lockSecurity:'محتوا با AES-GCM و کلید مشتق‌شده از PBKDF2 محافظت می‌شود.',password:'رمز عبور',unlock:'باز کردن سند',controls:'کنترل ارائه',first:'ابتدا',prev:'بلوک قبل',next:'بلوک بعد',last:'انتها',replay:'اجرای مجدد انیمیشن‌ها',fullscreen:'تمام‌صفحه',exit:'خروج'
  };
  const effectOptions = [
    ['none','بدون','None'],['particles','ذرات','Particles'],['bubbles','حباب','Bubbles'],['orbit','مداری','Orbit'],
    ['waves','موج','Waves'],['matrix','ماتریکس','Matrix'],['stars','آسمان ستاره‌ای','Starfield'],['fireflies','کرم شب‌تاب','Fireflies'],['snow','برف آرام','Snowfall'],['rain','باران','Rain'],['gradient-flow','گرادیان متحرک','Animated gradient'],['custom','کد دلخواه','Custom code']
  ].map(([v,fa,en])=>'<option value="'+v+'">'+(uiLang==='en'?en:fa)+'</option>').join('');

  const toolbar = `
  <nav class="doc-toolbar" dir="${uiLang==='en'?'ltr':'rtl'}" aria-label="${w.toolbar}">
    <span class="tb-brand">📄 ${title}</span>
    <button data-mode-btn="view" class="on" title="${w.view}">👁 ${w.view}</button>
    ${editable ? `<button data-mode-btn="edit" title="${w.edit}">✏ ${w.edit}</button>` : ''}
    <button data-mode-btn="present" title="${w.present}">▶ ${w.present}</button>
    <button id="ds-effect-btn" title="${w.effectSettings}">🎨 ${w.effect}</button>
    <button id="ds-print" title="${w.print}">🖨 ${w.print}</button>
    ${editable ? `<button id="ds-save" style="display:none" title="${w.save}">💾 ${w.save}</button>` : ''}
    <select id="theme-select" title="${w.theme}" aria-label="${w.theme}">${themeOptions}</select>
  </nav>`;

  const pw = uiLang === 'en' ? {
    title:'Print workspace', theme:'Print theme', mono:'Black & white', official:'Formal', classic:'Classic', academic:'Academic', modern:'Modern blue', paper:'Paper', orientation:'Orientation', portrait:'Portrait', landscape:'Landscape', margins:'Margins', narrow:'Narrow (8 mm)', normal:'Normal (12 mm)', wide:'Wide (20 mm)', print:'Print / Save PDF', back:'Back to document', hint:'Preview is approximate; pagination and PDF settings depend on your browser and printer.'
  } : {
    title:'فضای آماده‌سازی چاپ', theme:'تم چاپ', mono:'سیاه و سفید', official:'رسمی', classic:'کلاسیک', academic:'دانشگاهی', modern:'آبی مدرن', paper:'اندازه کاغذ', orientation:'جهت کاغذ', portrait:'عمودی', landscape:'افقی', margins:'حاشیه', narrow:'کم (۸ میلی‌متر)', normal:'معمولی (۱۲ میلی‌متر)', wide:'زیاد (۲۰ میلی‌متر)', print:'چاپ / ذخیره PDF', back:'بازگشت به سند', hint:'پیش‌نمایش تقریبی است؛ صفحه‌بندی و تنظیمات PDF به مرورگر و چاپگر وابسته است.'
  };
  const printStudio = `<button type="button" id="print-panel-toggle" aria-controls="print-studio" aria-expanded="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>${uiLang === 'en' ? 'Print tools' : 'ابزارهای چاپ'}</button>
  <div id="mobile-preview-tools" role="group" aria-label="${uiLang === 'en' ? 'Preview zoom' : 'بزرگ‌نمایی پیش‌نمایش'}"><button type="button" id="mobile-zoom-fit" aria-label="${uiLang === 'en' ? 'Fit paper to screen' : 'اندازه کاغذ متناسب با صفحه'}">${uiLang === 'en' ? 'Fit' : 'جا'}</button><button type="button" id="mobile-zoom-out" aria-label="${uiLang === 'en' ? 'Zoom out' : 'کوچک‌نمایی'}">−</button><output id="mobile-zoom-value" aria-live="polite">100%</output><button type="button" id="mobile-zoom-in" aria-label="${uiLang === 'en' ? 'Zoom in' : 'بزرگ‌نمایی'}">+</button></div>
  <button type="button" id="print-panel-shade" aria-label="${uiLang === 'en' ? 'Close print tools' : 'بستن ابزارهای چاپ'}"></button>
  <section id="print-studio" dir="${uiLang === 'en' ? 'ltr' : 'rtl'}" class="print-studio" aria-label="${pw.title}">
  <h2>${pw.title}</h2><div class="print-actions"><button type="button" class="print-go" id="print-go">${pw.print}</button><button type="button" id="print-back">${pw.back}</button></div>
  <p>${pw.hint}</p><details open><summary>${uiLang === 'en' ? 'Page & layout' : 'صفحه و چیدمان'}</summary><div class="print-controls">
  <label>${pw.theme}<select id="print-theme"><option value="official">${pw.official}</option><option value="mono">${pw.mono}</option><option value="classic">${pw.classic}</option><option value="academic">${pw.academic}</option><option value="modern">${pw.modern}</option></select></label>
  <label>${uiLang === 'en' ? 'Free layout in print' : 'چیدمان آزاد در چاپ'}<select id="print-placement"><option value="flow">${uiLang === 'en' ? 'Automatic flow (recommended)' : 'چیدمان خودکار (پیشنهادی)'}</option><option value="exact">${uiLang === 'en' ? 'Keep design positions' : 'حفظ موقعیت طراحی'}</option></select></label>
  <label>${uiLang === 'en' ? 'Layout' : 'چیدمان'}<select id="print-layout"><option value="formal">${uiLang === 'en' ? 'Formal' : 'رسمی'}</option><option value="centered">${uiLang === 'en' ? 'Centered' : 'وسط‌چین'}</option><option value="framed">${uiLang === 'en' ? 'Framed' : 'قاب‌دار'}</option><option value="minimal">${uiLang === 'en' ? 'Minimal' : 'مینیمال'}</option><option value="ledger">${uiLang === 'en' ? 'Ledger' : 'دفتر حساب'}</option><option value="receipt">${uiLang === 'en' ? 'Receipt' : 'رسیدی'}</option><option value="columns">${uiLang === 'en' ? 'Two columns' : 'دو ستونی'}</option></select></label>
  <label>${pw.paper}<select id="print-paper"><option value="A4">A4 · 210 × 297 mm</option><option value="A3">A3 · 297 × 420 mm</option><option value="A5">A5 · 148 × 210 mm</option><option value="A6">A6 · 105 × 148 mm</option><option value="B5">B5 · 176 × 250 mm</option><option value="letter">Letter · 216 × 279 mm</option><option value="legal">Legal · 216 × 356 mm</option><option value="tabloid">Tabloid · 279 × 432 mm</option></select></label>
  <label>${pw.orientation}<select id="print-orientation"><option value="portrait">${pw.portrait}</option><option value="landscape">${pw.landscape}</option></select></label>
  <label>${pw.margins}<select id="print-margin"><option value="12">${pw.normal}</option><option value="8">${pw.narrow}</option><option value="20">${pw.wide}</option></select></label>
  <label>${uiLang==='en'?'Paper border':'کادر دور کاغذ'}<select id="print-frame"><option value="none">${uiLang==='en'?'None':'بدون کادر'}</option><option value="single">${uiLang==='en'?'Fine line':'خط ظریف'}</option><option value="double">${uiLang==='en'?'Double':'دوخطی'}</option><option value="dashed">${uiLang==='en'?'Dashed':'خط‌چین'}</option><option value="bold">${uiLang==='en'?'Bold':'خط ضخیم'}</option></select></label>
  <label>${uiLang === 'en' ? 'Spacing' : 'فاصله'}<select id="print-density"><option value="normal">${uiLang === 'en' ? 'Normal' : 'معمولی'}</option><option value="compact">${uiLang === 'en' ? 'Compact' : 'فشرده'}</option><option value="relaxed">${uiLang === 'en' ? 'Relaxed' : 'باز'}</option></select></label>
  <label>${uiLang === 'en' ? 'Font size' : 'اندازه متن'}<input id="print-font" type="number" min="10" max="24" value="15"></label>
  </div><p>${uiLang === 'en' ? 'Exact placement can overlap or cross page boundaries; check print preview.' : 'در حفظ موقعیت، هم‌پوشانی یا عبور از مرز صفحه ممکن است؛ پیش‌نمایش چاپ را بررسی کنید.'}</p></details><details open><summary>${uiLang === 'en' ? 'Colors' : 'رنگ‌ها'}</summary><div class="print-controls">
  <label>${uiLang === 'en' ? 'Accent' : 'رنگ اصلی'}<input id="print-accent" type="color" value="#253c5c"></label>
  <label>${uiLang === 'en' ? 'Header' : 'رنگ سربرگ'}<input id="print-pale" type="color" value="#eef2f6"></label>
  <label>${uiLang === 'en' ? 'Paper color' : 'رنگ کاغذ'}<input id="print-bg" type="color" value="#ffffff"></label>
  <label>${uiLang === 'en' ? 'Text color' : 'رنگ متن'}<input id="print-text" type="color" value="#222222"></label>
  </div></details><details><summary>${uiLang === 'en' ? 'Choose printable sections' : 'انتخاب بخش‌های قابل چاپ'}</summary><div id="print-blocks" class="print-blocks"></div></details><details><summary>${uiLang === 'en' ? 'Advanced print CSS' : 'استایل پیشرفته چاپ (CSS)'}</summary><p>${uiLang === 'en' ? 'Rules apply only to document content. External URLs and global rules are not supported.' : 'استایل به محتوای سند محدود می‌شود؛ URL خارجی و قواعد سراسری پشتیبانی نمی‌شوند.'}</p><textarea id="print-css" aria-label="${uiLang === 'en' ? 'Print CSS' : 'CSS چاپ'}" spellcheck="false"></textarea><br><button type="button" id="print-css-apply">${uiLang === 'en' ? 'Apply CSS' : 'اعمال CSS'}</button></details></section>`;

  const lockScreen = mode.lock ? `
  <div class="lock-wrap" dir="${uiLang==='en'?'ltr':'rtl'}">
    <form class="lock-card" id="lock-form">
      <div class="lock-icon">🔐</div>
      <h1>${w.locked}</h1>
      <p>${w.lockHint}<br>${w.lockSecurity}</p>
      <input type="password" id="lock-pass" placeholder="${w.password}" aria-label="${w.password}" autocomplete="current-password" autofocus>
      <div class="lock-err"></div>
      <button type="submit">${w.unlock}</button>
    </form>
  </div>` : '';

  const presentBar = `
  <div class="present-progress"><i></i></div>
  <div class="present-bar" dir="${uiLang==='en'?'ltr':'rtl'}" role="toolbar" aria-label="${w.controls}">
    <button data-act="first" title="${w.first}">⏮</button>
    <button data-act="prev" title="${w.prev}">⬆</button>
    <button data-act="next" title="${w.next}">⬇</button>
    <button data-act="last" title="${w.last}">⏭</button>
    <span class="pc-count">0 / 0</span>
    <button data-act="replay" title="${w.replay}">🔄</button>
    <button data-act="fs" title="${w.fullscreen}">⛶</button>
    <button id="ds-present-print" title="${w.print}">🖨</button>
    <button data-act="exit" title="${w.exit}">✕</button>
  </div>`;

  const effectPanel = `
  <div id="effect-panel" dir="${uiLang==='en'?'ltr':'rtl'}" aria-label="${w.effectSettings}">
    <div class="ep-head"><span>🎨 ${w.background}</span><button type="button" aria-label="${w.close}" onclick="document.getElementById('effect-panel').classList.remove('open')" style="background:none;border:0;color:#9aa4bf;cursor:pointer">✕</button></div>
    <label>${w.animation} <select id="effect-select">${effectOptions}</select></label>
    <label>${w.color} <input type="color" id="effect-color" value="${effectColor}"></label>
    <label>${w.opacity} <input type="range" id="effect-opacity" min="0" max="100"></label>
    <label>${uiLang==='en'?'Base animation reacts to movement':'واکنش انیمیشن به حرکت موس'} <input type="checkbox" id="effect-react-move"></label>
    <label>${uiLang==='en'?'Base animation reacts to clicks':'واکنش انیمیشن به کلیک'} <input type="checkbox" id="effect-react-click"></label>
    <label>${uiLang==='en'?'Interactive pointer & clicks':'واکنش به حرکت و کلیک'} <input type="checkbox" id="effect-interactive"></label>
    <label>${uiLang==='en'?'Interactive type':'نوع واکنش'} <select id="effect-interaction-mode"><option value="trail">${uiLang==='en'?'Spark trail':'دنباله درخشان'}</option><option value="ripples">${uiLang==='en'?'Ripples':'موج حلقه‌ای'}</option><option value="spotlight">${uiLang==='en'?'Spotlight':'نور دنبال‌کننده'}</option><option value="network">${uiLang==='en'?'Constellation':'شبکه دنبال‌کننده'}</option><option value="custom">${uiLang==='en'?'Custom code':'کد دلخواه'}</option></select></label>
    <label>${uiLang==='en'?'Interactive intensity':'شدت واکنش'} <input type="range" id="effect-interaction-amount" min="0" max="100"></label>
  </div>`;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>

<style>
${fontFaceCss()}
:root{--fx-opacity:${effectOpacity};--fx-color:${effectColor}}
${docCss}
${themesCss}
${UI_CSS}
</style>
<style id="print-page-style"></style>
<style id="print-custom-style"></style>
</head>
<body data-ui-dir="${uiLang === 'en' ? 'ltr' : 'rtl'}" data-ui-skin="${opts.uiSkin === 'flat' ? 'dark' : 'light'}" data-web-surface="${appearance.surface}" data-web-width="${appearance.width}" data-mode="${docMeta.mode}" data-effect="${bgEffect}" data-theme="${themeId}" class="${mode.lock ? 'locked' : ''}">
<canvas id="bg-canvas" aria-hidden="true"></canvas>
<iframe id="custom-bg" title="Custom background" sandbox="allow-scripts" aria-hidden="true" tabindex="-1" style="display:none"></iframe>
${toolbar}
${printStudio}
<main class="document-content doc-page site-page" data-web-surface="${appearance.surface}" data-web-style="${appearance.style}" data-web-width="${appearance.width}" data-web-layout="${appearance.layout}" data-web-theme-hero="${appearance.themeHero}" data-free-layout="${mode.lock?'false':String(!!doc.settings?.freeLayout)}" data-theme="${themeId}" style="${paletteCss(appearance.palette)}" dir="${dir}" lang="${lang}">${mainInner}</main>

${effectPanel}
${presentBar}
${lockScreen}
${payloadScript}
<script>window.__DS__ = ${JSON.stringify(publicDocMeta).replace(/</g, '\\u003c')};</script>
<script>${runtime}</script>
</body>
</html>`;
}

export default { buildExportHTML, renderBlocksHTML, MODES };
