/* core/i18n.js — دیکشنری دوزبانه + t() */
const DICT = {
  'prop.opacity': {fa:'شفافیت المان (میزان نمایش)', en:'Element opacity'},
  'block.logo': { fa:'لوگو', en:'Logo' },
  'block.layout': { fa:'چیدمان کدنویسی‌شده', en:'Custom layout' },
  'app.title': { fa: 'سندساز هوشمند', en: 'Document Studio' },
  'app.tagline': { fa: 'صفحه‌های تعاملی بسازید، ارائه کنید و برای چاپ آماده کنید؛ همه در یک فضای خصوصی.', en: 'Create interactive pages, present and prepare them for print — all in one private workspace.' },
  'app.credit': { fa: 'طراح: رضا خوشنود (Reza Khoshnood)', en: 'Designed by Reza Khoshnood' },
  'app.version': { fa: 'نسخه', en: 'Version' },

  'nav.home': { fa: 'خانه', en: 'Home' },
  'nav.gallery': { fa: 'قالب‌ها', en: 'Templates' },
  'nav.settings': { fa: 'تنظیمات', en: 'Settings' },
  'nav.newDoc': { fa: 'سند جدید', en: 'New document' },

  'btn.newDoc': { fa: 'سند جدید', en: 'New Document' },
  'btn.start': { fa: 'شروع کنید', en: 'Get started' },
  'btn.seeTemplates': { fa: 'مشاهده قالب‌ها', en: 'Browse templates' },
  'btn.edit': { fa: 'ویرایش', en: 'Edit' },
  'btn.delete': { fa: 'حذف', en: 'Delete' },
  'btn.present': { fa: 'ارائه', en: 'Present' },
  'btn.preview': { fa: 'پیش‌نمایش', en: 'Preview' },
  'btn.use': { fa: 'استفاده', en: 'Use' },
  'btn.print': { fa: 'چاپ', en: 'Print' },
  'btn.share': { fa: 'اشتراک', en: 'Share' },
  'btn.export': { fa: 'خروجی', en: 'Export' },
  'btn.save': { fa: 'ذخیره', en: 'Save' },
  'btn.cancel': { fa: 'انصراف', en: 'Cancel' },
  'btn.confirm': { fa: 'تأیید', en: 'Confirm' },
  'btn.close': { fa: 'بستن', en: 'Close' },
  'btn.add': { fa: 'افزودن', en: 'Add' },
  'btn.copy': { fa: 'کپی', en: 'Copy' },
  'btn.download': { fa: 'دانلود', en: 'Download' },
  'btn.undo': { fa: 'واگرد', en: 'Undo' },
  'btn.redo': { fa: 'ازنو', en: 'Redo' },
  'btn.back': { fa: 'بازگشت', en: 'Back' },
  'btn.duplicate': { fa: 'تکثیر', en: 'Duplicate' },
  'btn.saveAsTemplate': { fa: 'ذخیره به‌عنوان قالب', en: 'Save as template' },

  'home.heroTitle': { fa: 'سندساز هوشمند', en: 'Document Studio' },
  'home.features': { fa: 'چرا سندساز هوشمند؟', en: 'Why Document Studio?' },
  'home.templates': { fa: 'قالب‌های آماده', en: 'Ready-made templates' },
  'home.recent': { fa: 'اسناد اخیر', en: 'Recent documents' },
  'home.noDocs': { fa: 'هنوز سندی نساخته‌اید. با یک قالب آماده شروع کنید!', en: 'No documents yet. Start from a template!' },
  'home.feat.blocks': { fa: 'طراحی بلوکی', en: 'Block based design' },
  'home.feat.blocks.d': { fa: '۱۴ بلوک آماده برای صفحه، جدول، نمودار، چیدمان کدنویسی‌شده و بیشتر.', en: '14 building blocks including table, chart and code-authored layout.' },
  'home.feat.themes': { fa: 'تم و چیدمان چاپ', en: 'Print themes & layouts' },
  'home.feat.themes.d': { fa: 'قالب چاپ، رنگ، فاصله‌ها و استایل سند را شخصی‌سازی کنید.', en: 'Customize print layout, colors, spacing and styles.' },
  'home.feat.crypto': { fa: 'رمزنگاری', en: 'Encryption' },
  'home.feat.crypto.d': { fa: 'خروجی HTML رمزنگاری‌شده با AES-GCM و کلید PBKDF2.', en: 'Encrypted HTML export with AES-GCM and PBKDF2.' },
  'home.feat.html': { fa: 'خروجی HTML تعاملی', en: 'Interactive HTML export' },
  'home.feat.html.d': { fa: 'یک فایل مستقل و آفلاین با انیمیشن و تم قابل تغییر.', en: 'One self-contained offline file with animations and theme switching.' },
  'home.feat.present': { fa: 'حالت ارائه', en: 'Present mode' },
  'home.feat.present.d': { fa: 'نمایش تمام‌صفحه با انیمیشن ورود بلوک‌ها و پس‌زمینه زنده.', en: 'Fullscreen showcase with scroll-triggered animations.' },
  'home.feat.pwa': { fa: 'PWA آفلاین', en: 'Offline PWA' },
  'home.feat.pwa.d': { fa: 'نصب روی دستگاه و کار کامل بدون اینترنت؛ داده‌ها در مرورگر.', en: 'Installable and fully offline; data stays in your browser.' },

  'gallery.title': { fa: 'گالری قالب‌ها', en: 'Template gallery' },
  'gallery.builtin': { fa: 'قالب‌های آماده', en: 'Built-in templates' },
  'gallery.mine': { fa: 'قالب‌های من', en: 'My templates' },
  'gallery.empty': { fa: 'هنوز قالب سفارشی ذخیره نکرده‌اید. در ادیتور «ذخیره به‌عنوان قالب» را بزنید.', en: 'No custom templates yet. Use “Save as template” in the editor.' },
  'gallery.search': { fa: 'جستجوی قالب…', en: 'Search templates…' },

  'cat.edu': { fa: 'آموزشی', en: 'Education' },
  'cat.biz': { fa: 'کسب‌وکار', en: 'Business' },
  'cat.resume': { fa: 'رزومه', en: 'Resume' },
  'cat.intro': { fa: 'معرفی', en: 'Profile' },
  'cat.cert': { fa: 'گواهینامه', en: 'Certificate' },
  'cat.report': { fa: 'گزارش', en: 'Report' },

  'editor.layers': { fa: 'لایه‌ها و بلوک‌ها', en: 'Layers & blocks' },
  'editor.addBlock': { fa: 'افزودن بلوک', en: 'Add block' },
  'editor.properties': { fa: 'ویژگی‌ها', en: 'Properties' },
  'editor.selectHint': { fa: 'برای ویرایش ویژگی‌ها یک بلوک را انتخاب کنید.', en: 'Select a block to edit its properties.' },
  'editor.docName': { fa: 'نام سند', en: 'Document name' },
  'editor.saved': { fa: 'ذخیره شد', en: 'Saved' },
  'editor.saving': { fa: 'در حال ذخیره…', en: 'Saving…' },
  'editor.untitled': { fa: 'سند بدون عنوان', en: 'Untitled document' },
  'editor.emptyCanvas': { fa: 'این سند خالی است — از پنل چپ یک بلوک اضافه کنید.', en: 'This document is empty — add a block from the left panel.' },
  'editor.docSettings': { fa: 'تنظیمات سند', en: 'Document settings' },
  'editor.lang': { fa: 'زبان سند', en: 'Doc language' },
  'editor.theme': { fa: 'تم بصری', en: 'Visual theme' },
  'editor.panels': { fa: 'پنل‌ها', en: 'Panels' },
  'editor.dragHint': { fa: 'برای جابه‌جایی بکشید', en: 'Drag to reorder' },
  'editor.autoSave': { fa: 'ذخیره خودکار', en: 'Auto-save' },
  'editor.inlineHint': { fa: 'روی متن کلیک کنید و مستقیم تایپ کنید.', en: 'Click text and type directly.' },

  'block.hero': { fa: 'هیرو / بنر', en: 'Hero banner' },
  'block.heading': { fa: 'عنوان', en: 'Heading' },
  'block.text': { fa: 'متن', en: 'Text' },
  'block.table': { fa: 'جدول', en: 'Table' },
  'block.sign': { fa: 'امضا', en: 'Signature' },
  'block.divider': { fa: 'جداکننده', en: 'Divider' },
  'block.chart': { fa: 'نمودار', en: 'Chart' },
  'block.timeline': { fa: 'تایم‌لاین', en: 'Timeline' },
  'block.flow': { fa: 'فلوچارت', en: 'Flowchart' },
  'block.stat-grid': { fa: 'کارت‌های آماری', en: 'Stat grid' },
  'block.image': { fa: 'آپلود تصویر', en: 'Upload image' },
  'block.code': { fa: 'کد', en: 'Code' },

  'prop.content': { fa: 'محتوا', en: 'Content' },
  'prop.style': { fa: 'استایل', en: 'Style' },
  'prop.animation': { fa: 'انیمیشن', en: 'Animation' },
  'prop.layout': { fa: 'چیدمان', en: 'Layout' },
  'prop.fontSize': { fa: 'اندازه فونت', en: 'Font size' },
  'prop.fontFamily': { fa: 'فونت', en: 'Font' },
  'prop.align': { fa: 'تراز', en: 'Align' },
  'prop.color': { fa: 'رنگ', en: 'Color' },
  'prop.bg': { fa: 'پس‌زمینه', en: 'Background' },
  'prop.padding': { fa: 'حاشیه داخلی', en: 'Padding' },
  'prop.radius': { fa: 'گوشه‌ها', en: 'Radius' },
  'prop.border': { fa: 'کادر', en: 'Border' },
  'prop.duration': { fa: 'مدت', en: 'Duration' },
  'prop.delay': { fa: 'تأخیر', en: 'Delay' },
  'prop.trigger': { fa: 'تریگر', en: 'Trigger' },

  'export.title': { fa: 'خروجی و اشتراک‌گذاری', en: 'Export & share' },
  'export.htmlFiles': { fa: 'فایل HTML', en: 'HTML files' },
  'export.htmlEditable': { fa: 'HTML قابل ویرایش', en: 'Editable HTML' },
  'export.htmlReadonly': { fa: 'HTML فقط خواندنی', en: 'Read-only HTML' },
  'export.htmlEncrypted': { fa: 'HTML رمزنگاری‌شده', en: 'Encrypted HTML' },
  'export.htmlPresent': { fa: 'HTML با حالت ارائه', en: 'HTML with present mode' },
  'export.settings': { fa: 'تنظیمات خروجی HTML', en: 'HTML export settings' },
  'export.print': { fa: 'چاپ', en: 'Print' },
  'export.backup': { fa: 'بکاپ', en: 'Backup' },
  'export.downloadJson': { fa: 'دانلود JSON', en: 'Download JSON' },
  'export.uploadJson': { fa: 'بارگذاری JSON', en: 'Load JSON' },
  'export.shareSection': { fa: 'اشتراک‌گذاری', en: 'Share' },
  'export.plainText': { fa: 'کپی متن ساده', en: 'Copy plain text' },
  'export.shortLink': { fa: 'لینک کوتاه (URL)', en: 'Short link (URL)' },
  'export.bgEffect': { fa: 'انیمیشن پس‌زمینه', en: 'Background effect' },
  'export.effectColor': { fa: 'رنگ افکت', en: 'Effect color' },
  'export.effectOpacity': { fa: 'شفافیت افکت', en: 'Effect opacity' },
  'export.blockAnims': { fa: 'انیمیشن بلوک‌ها', en: 'Block animations' },
  'export.defaultMode': { fa: 'حالت پیش‌فرض', en: 'Default mode' },
  'export.printTheme': { fa: 'تم چاپ', en: 'Print theme' },
  'export.done': { fa: 'فایل ساخته شد', en: 'File generated' },
  'export.password': { fa: 'رمز عبور', en: 'Password' },
  'export.passwordRepeat': { fa: 'تکرار رمز عبور', en: 'Repeat password' },
  'export.encryptWarn': { fa: 'رمز عبور قابل بازیابی نیست؛ آن را جایی امن نگه دارید.', en: 'The password cannot be recovered — keep it safe.' },

  'present.enterFullscreen': { fa: 'تمام‌صفحه', en: 'Fullscreen' },
  'present.exitPresent': { fa: 'خروج از ارائه', en: 'Exit present' },
  'present.first': { fa: 'ابتدا', en: 'First' },
  'present.prev': { fa: 'بلوک قبل', en: 'Previous block' },
  'present.next': { fa: 'بلوک بعد', en: 'Next block' },
  'present.last': { fa: 'انتها', en: 'Last' },
  'present.restart': { fa: 'اجرای مجدد انیمیشن‌ها', en: 'Replay animations' },
  'present.exit': { fa: 'خروج', en: 'Exit' },
  'present.effect': { fa: 'افکت', en: 'Effect' },
  'present.hintKeys': { fa: 'کلیدها: ↑ ↓ برای جابه‌جایی · F تمام‌صفحه · R اجرای مجدد · Esc خروج', en: 'Keys: ↑ ↓ navigate · F fullscreen · R replay · Esc exit' },

  'settings.title': { fa: 'تنظیمات', en: 'Settings' },
  'settings.appearance': { fa: 'ظاهر برنامه', en: 'Appearance' },
  'settings.skin': { fa: 'پوسته کاری', en: 'Workspace skin' },
  'settings.skin.d': { fa: 'پوسته فقط ظاهر پلتفرم را تغییر می‌دهد، نه خروجی سند را.', en: 'Skins change the workspace only, never the exported document.' },
  'settings.effect': { fa: 'انیمیشن پس‌زمینه', en: 'Background effect' },
  'settings.effect.d': { fa: 'یک افکت سبک برای پس‌زمینه پلتفرم انتخاب کنید.', en: 'Pick a lightweight canvas effect for the workspace.' },
  'settings.language': { fa: 'زبان رابط کاربری', en: 'Interface language' },
  'settings.themeBuilder': { fa: 'سازنده تم سفارشی', en: 'Custom theme builder' },
  'settings.themeBuilder.d': { fa: 'رنگ‌ها، فونت و گوشه‌ها را تنظیم و با نام دلخواه ذخیره کنید.', en: 'Tune colors, font and radius, then save with your own name.' },
  'settings.myThemes': { fa: 'تم‌های من', en: 'My themes' },
  'settings.about': { fa: 'درباره', en: 'About' },
  'settings.data': { fa: 'داده‌ها', en: 'Data' },
  'settings.data.d': { fa: 'همه اسناد در localStorage همین مرورگر ذخیره می‌شوند.', en: 'All documents live in this browser’s localStorage.' },
  'settings.clearAll': { fa: 'پاک‌کردن همه داده‌ها', en: 'Clear all data' },
  'settings.storageUsed': { fa: 'حجم استفاده‌شده', en: 'Storage used' },
  'settings.install': { fa: 'نصب برنامه', en: 'Install app' },
  'settings.install.d': { fa: 'سندساز را به‌عنوان PWA روی دستگاه نصب کنید.', en: 'Install Document Studio as a PWA.' },
  'settings.themeName': { fa: 'نام تم', en: 'Theme name' },
  'settings.preview': { fa: 'پیش‌نمایش زنده', en: 'Live preview' },

  'msg.saved': { fa: 'ذخیره شد', en: 'Saved' },
  'msg.deleted': { fa: 'حذف شد', en: 'Deleted' },
  'msg.copied': { fa: 'کپی شد', en: 'Copied' },
  'msg.error': { fa: 'خطایی رخ داد', en: 'Something went wrong' },
  'msg.confirmDelete': { fa: 'این سند برای همیشه حذف شود؟', en: 'Delete this document permanently?' },
  'msg.passwordMismatch': { fa: 'رمزهای عبور یکسان نیستند', en: 'Passwords do not match' },
  'msg.needPassword': { fa: 'رمز عبور را وارد کنید', en: 'Enter a password' },
  'msg.wrongPassword': { fa: 'رمز عبور نادرست است', en: 'Wrong password' },
  'msg.decrypted': { fa: 'سند رمزگشایی شد', en: 'Document decrypted' },
  'msg.templateSaved': { fa: 'قالب ذخیره شد', en: 'Template saved' },
  'msg.linkCopied': { fa: 'لینک کپی شد', en: 'Link copied' },
  'msg.imported': { fa: 'سند وارد شد', en: 'Document imported' },
  'msg.emptyDoc': { fa: 'سند خالی است', en: 'Document is empty' },
  'msg.blockAdded': { fa: 'بلوک اضافه شد', en: 'Block added' },
  'msg.offline': { fa: 'آفلاین — همه‌چیز از حافظه محلی کار می‌کند', en: 'Offline — running from local cache' }
};

let lang = 'en';
const listeners = new Set();

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'fa';
  try { localStorage.setItem('ds.lang', lang); } catch (_) {}
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.title = lang === 'en' ? 'Document Studio — Visual Document Editor' : 'سندساز هوشمند — Document Studio';
  document.getElementById('app')?.setAttribute('aria-label', lang === 'en' ? 'Document Studio' : 'سندساز هوشمند');
  listeners.forEach((fn) => { try { fn(lang); } catch (_) {} });
  return lang;
}
export function getLang() { return lang; }
export function initLang() {
  let saved = null;
  try { saved = localStorage.getItem('ds.lang'); } catch (_) {}
  return setLang(saved || 'en');
}
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function t(key, vars) {
  const entry = DICT[key];
  let out = entry ? (entry[lang] ?? entry.fa) : key;
  if (vars && typeof vars === 'object') {
    for (const [k, v] of Object.entries(vars)) out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return out;
}
export const locale = () => (lang === 'fa' ? 'fa-IR' : 'en-GB');
export const dictKeys = () => Object.keys(DICT);
export default { t, setLang, getLang, initLang, onLangChange, locale };
