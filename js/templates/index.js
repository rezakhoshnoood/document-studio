/* templates/index.js — ۱۳ قالب آماده (به‌همراه متادیتا و بلوک‌های واقعی) */
import { createBlock } from '../blocks/base.js';
import { uid } from '../core/dom.js';
import {englishTemplateBlocks} from './english.js';

const ANIM_BY_TYPE = {
  hero: 'fadeIn', heading: 'slideUp', text: 'fadeIn', table: 'slideUp', chart: 'zoomIn',
  timeline: 'fadeIn', 'stat-grid': 'zoomIn', flow: 'fadeIn', sign: 'fadeIn',
  divider: 'fadeIn', image: 'zoomIn', code: 'slideUp'
};
/* هر بلوک قالب به‌صورت پیش‌فرض یک انیمیشن ورود cascade دارد تا حالت ارائه زنده باشد */
const b = (type, data = {}, style = {}) => createBlock(type, {
  data,
  style: { animation: ANIM_BY_TYPE[type] || 'none', animationDelay: 'auto', animationTrigger: 'scroll', ...style }
});

const TODAY = '۱۴۰۴/۰۸/۰۸';

export const TEMPLATES = [
 {id:'tpl-store-receipt',name:{fa:'رسید فروشگاهی هوشمند',en:'Smart store receipt'},category:'biz',theme:'official',settings:{bgEffect:'none',animations:false},blocks:()=>[b('logo'),b('hero',{title:'رسید فروش فروشگاه',subtitle:'نام فروشگاه و شماره تماس',badge:'رسید فروش',icon:'🧾',meta:['شماره رسید: ۱','تاریخ: —','سررسید پرداخت: —']}),b('table',{caption:'اقلام خرید',headers:['کالا','تعداد','قیمت واحد','مبلغ ردیف'],rows:[['کالای نمونه','۲','۱۵۰٬۰۰۰',''],['کالای نمونه دوم','۱','۸۰٬۰۰۰','']],columnConfigs:[{type:'text'},{type:'number'},{type:'currency'},{type:'formula',formula:'B*C',aggregate:'sum'}],hasFooter:true,footerRow:['جمع کل','','',''],zebra:true}),b('text',{html:'<p>روش پرداخت: —　|　توضیحات: —</p>'})]},
 {id:'tpl-calculated-invoice',name:{fa:'فاکتور محاسباتی با تخفیف',en:'Calculated invoice with discount'},category:'biz',theme:'emerald',settings:{bgEffect:'none',animations:false},blocks:()=>[b('hero',{title:'فاکتور فروش محاسباتی',subtitle:'نام فروشنده و خریدار',badge:'فاکتور',icon:'🧮',meta:['شماره: —','تاریخ: —','سررسید: —']}),b('table',{caption:'اقلام و تخفیف',headers:['شرح','تعداد','قیمت واحد','تخفیف ٪','مبلغ نهایی'],rows:[['کالا یا خدمت','۲','۱۰۰٬۰۰۰','۱۰',''],['کالا یا خدمت','۱','۵۰٬۰۰۰','۰','']],columnConfigs:[{type:'text'},{type:'number'},{type:'currency'},{type:'percent'},{type:'formula',formula:'B*C*(1-D/100)',aggregate:'sum'}],hasFooter:true,footerRow:['مبلغ کل','','','',''],zebra:true}),b('text',{html:'<p>تاریخ سررسید و شرایط پرداخت را درج کنید.</p>'}),b('sign')]},
 {id:'tpl-payment-due',name:{fa:'رسید پرداخت و سررسید',en:'Payment receipt and due dates'},category:'biz',theme:'official',settings:{bgEffect:'none',animations:false},blocks:()=>[b('hero',{title:'رسید پرداخت و سررسید',subtitle:'نام مشتری و فروشنده',badge:'پیگیری پرداخت',icon:'📆',meta:['شماره: —','تاریخ صدور: —']}),b('table',{caption:'برنامه پرداخت',headers:['مرحله','تاریخ سررسید','مبلغ','وضعیت'],rows:[['پرداخت اول','—','۱۰۰٬۰۰۰','پرداخت نشده'],['پرداخت دوم','—','۱۰۰٬۰۰۰','پرداخت نشده']],columnConfigs:[{type:'text'},{type:'text'},{type:'currency',aggregate:'sum'},{type:'text'}],hasFooter:true,footerRow:['جمع','','',''],zebra:true}),b('sign')]},
 {id:'tpl-company-letter-logo',name:{fa:'سربرگ شرکت با لوگو',en:'Company letterhead with logo'},category:'biz',theme:'official',settings:{bgEffect:'none',animations:false},blocks:()=>[b('logo'),b('hero',{title:'سربرگ شرکت',subtitle:'نام شرکت و اطلاعات تماس',badge:'نامه رسمی',icon:'',meta:['تاریخ: …','شماره: …']}),b('heading',{text:'موضوع نامه',level:2}),b('text',{html:'<p>متن نامه شرکت را اینجا بنویسید.</p>'}),b('sign')]},
 {id:'tpl-company-report-logo',name:{fa:'گزارش شرکت با لوگو',en:'Company report with logo'},category:'biz',theme:'modern-blue',settings:{bgEffect:'particles',animations:true},blocks:()=>[b('logo'),b('hero',{title:'گزارش شرکت',subtitle:'دوره گزارش و نام مجموعه',badge:'گزارش',icon:'',meta:['تاریخ: …']}),b('heading',{text:'خلاصه گزارش',level:2}),b('text',{html:'<p>خلاصه و نتایج را اینجا وارد کنید.</p>'}),b('table')]},
  {
    id: 'tpl-lesson-plan',
    name: { fa: 'طرح درس هوشمند', en: 'AI Lesson Plan' },
    category: 'edu',
    theme: 'modern-blue',
    settings: { bgEffect: 'particles', animations: true },
    blocks: () => [
      b('hero', { title: 'طرح درس: مبانی هوش مصنوعی', subtitle: 'پایه دوازدهم — رشته کامپیوتر · مدت: ۹۰ دقیقه', badge: 'طرح درس', icon: '🧠', bgGradient: 'linear-gradient(135deg,#4f8cff,#6c5ce7)', meta: ['مدرس: رضا خوشنود', 'تاریخ: ' + TODAY, 'کلاس: ۱۲/۲'] }, { animation: 'slideUp' }),
      b('heading', { text: 'اهداف آموزشی', level: 2, underline: true, numbered: true }),
      b('text', { html: '<ul><li>تعریف هوش مصنوعی و تفاوت آن با یادگیری ماشین</li><li>تشخیص کاربردهای AI در زندگی روزمره</li><li>ساخت یک مدل ساده دسته‌بندی به‌صورت عملی</li></ul>' }),
      b('table', { caption: 'زمان‌بندی جلسه', headers: ['بخش', 'فعالیت', 'زمان (دقیقه)'], rows: [['مقدمه', 'پرسش و پاسخ انگیزشی', '۱۰'], ['مفهوم', 'ارائه اسلاید و مثال', '۲۵'], ['کارگاه', 'تمرین گروهی با ابزار آنلاین', '۳۵'], ['جمع‌بندی', 'مرور و تکلیف', '۲۰']], hasFooter: true, footerRow: ['جمع', '—', '۹۰'], zebra: true }),
      b('stat-grid', { columns: 3, stats: [{ label: 'دانش‌آموز', value: '۲۴', icon: '👩‍🎓', color: '#4f8cff', countTo: 24 }, { label: 'گروه کاری', value: '۶', icon: '👥', color: '#16c79a', countTo: 6 }, { label: 'تمرین عملی', value: '۳', icon: '🧪', color: '#6c5ce7', countTo: 3 }] }),
      b('heading', { text: 'ارزشیابی', level: 3, underline: true }),
      b('text', { html: '<ol><li>پرسش شفاهی در پایان جلسه (۲۰٪)</li><li>تمرین گروهی کلاسی (۴۰٪)</li><li>پروژه کوچک خانگی (۴۰٪)</li></ol>' }),
      b('sign', { signatures: [{ title: 'مدرس', name: 'رضا خوشنود' }, { title: 'مدیر گروه', name: '—' }] })
    ]
  },
  {
    id: 'tpl-weekly',
    name: { fa: 'برنامه هفتگی', en: 'Weekly Schedule' },
    category: 'edu',
    theme: 'pastel',
    settings: { bgEffect: 'bubbles', animations: true },
    blocks: () => [
      b('hero', { title: 'برنامه هفتگی کلاس', subtitle: 'هفته دوم آبان ماه ۱۴۰۴', badge: 'هفتگی', icon: '🗓️', bgGradient: 'linear-gradient(135deg,#f9a8d4,#a5b4fc)', meta: ['کلاس ۱۲/۲'] }, { animation: 'fadeIn' }),
      b('table', { caption: 'جدول دروس', headers: ['روز', 'زنگ اول', 'زنگ دوم', 'زنگ سوم'], rows: [['شنبه', 'ریاضی', 'برنامه‌نویسی', 'زبان انگلیسی'], ['یکشنبه', 'شبکه', 'ریاضی', 'تربیت بدنی'], ['دوشنبه', 'هوش مصنوعی', 'کارگاه', 'ادبیات'], ['سه‌شنبه', 'برنامه‌نویسی', 'ریاضی', 'مطالعات'], ['چهارشنبه', 'کارگاه پروژه', 'هوش مصنوعی', '—']], hasFooter: false, zebra: true }),
      b('timeline', { items: [{ date: 'شنبه', title: 'آزمون ریاضی', desc: 'فصل ۲ — مشتق', icon: '۱' }, { date: 'چهارشنبه', title: 'تحویل پروژه', desc: 'پروژه کلاسی هوش مصنوعی', icon: '۲' }] }),
      b('divider', { style: 'ornament' }),
      b('text', { html: '<p><b>یادآوری:</b> حضور در کارگاه پروژه الزامی است.</p>' })
    ]
  },
  {
    id: 'tpl-invoice',
    name: { fa: 'فاکتور فروش', en: 'Invoice' },
    category: 'biz',
    theme: 'emerald',
    settings: { bgEffect: 'waves', animations: true },
    blocks: () => [
      b('hero', { title: 'فاکتور فروش', subtitle: 'شرکت آفرینش داده پارس', badge: 'شماره: ۱۴۰۴-۰۰۷۱', icon: '🧾', bgGradient: 'linear-gradient(135deg,#0e9f6e,#0ea5e9)', meta: ['تاریخ: ' + TODAY, 'مهلت پرداخت: ۱۵ روز'] }, { animation: 'slideUp' }),
      b('text', { html: '<p><b>مشتری:</b> شرکت نوآوران فناوری<br><b>نشانی:</b> تهران، خیابان ولیعصر، پلاک ۱۲۰<br><b>تلفن:</b> ۰۲۱-۸۸۷۷۶۶۵۵</p>' }),
      b('table', { caption: 'اقلام فاکتور', headers: ['#', 'شرح خدمات', 'تعداد', 'قیمت واحد', 'مبلغ'], rows: [['۱', 'طراحی رابط کاربری داشبورد', '۱', '۹٬۵۰۰٬۰۰۰', '۹٬۵۰۰٬۰۰۰'], ['۲', 'پیاده‌سازی API', '۳', '۴٬۰۰۰٬۰۰۰', '۱۲٬۰۰۰٬۰۰۰'], ['۳', 'پشتیبانی سه‌ماهه', '۱', '۴٬۵۰۰٬۰۰۰', '۴٬۵۰۰٬۰۰۰']], hasFooter: true, footerRow: ['', 'جمع کل (با مالیات ۹٪)', '', '', '۲۸٬۳۴۵٬۰۰۰'], zebra: true }),
      b('stat-grid', { columns: 3, stats: [{ label: 'جمع کل', value: '۲۸٬۳۴۵٬۰۰۰', icon: '💰', color: '#0e9f6e', countTo: 28345000 }, { label: 'مالیات', value: '۹٪', icon: '🧮', color: '#0ea5e9', countTo: 9, suffix: '٪' }, { label: 'روز اعتبار', value: '۱۵', icon: '⏳', color: '#f5a524', countTo: 15 }] }),
      b('text', { html: '<p class="muted">پرداخت به شماره حساب ۶۰۳۷-۹۹۷۴-۱۲۳۴-۵۶۷۸ بانک ملی به نام شرکت آفرینش داده پارس.</p>' }),
      b('sign', { signatures: [{ title: 'مهر و امضای فروشنده', name: 'شرکت آفرینش داده پارس' }, { title: 'امضای خریدار', name: '—' }] })
    ]
  },
  {
    id: 'tpl-proposal',
    name: { fa: 'پروپوزال پروژه', en: 'Project Proposal' },
    category: 'biz',
    theme: 'royal',
    settings: { bgEffect: 'particles', animations: true },
    blocks: () => [
      b('hero', { title: 'پروپوزال طراحی پلتفرم آموزش آنلاین', subtitle: 'پیشنهاد همکاری — نسخه ۱.۰', badge: 'پروپوزال', icon: '📑', bgGradient: 'linear-gradient(135deg,#6d28d9,#a855f7)', meta: ['تهیه‌کننده: رضا خوشنود', 'تاریخ: ' + TODAY] }, { animation: 'fadeIn' }),
      b('heading', { text: 'خلاصه اجرایی', level: 2, underline: true, numbered: true }),
      b('text', { html: '<p>هدف این پروژه، طراحی و پیاده‌سازی یک پلتفرم آموزش آنلاین با تمرکز بر تجربه کاربری ساده، دسترس‌پذیری و پشتیبانی از زبان فارسی است.</p>' }),
      b('heading', { text: 'محدوده کار', level: 2, underline: true, numbered: true }),
      b('table', { caption: 'فازبندی و زمان‌بندی', headers: ['فاز', 'خروجی', 'مدت'], rows: [['کشف و تحلیل', 'سند نیازمندی‌ها', '۲ هفته'], ['طراحی', 'فایلها و پروتوتایپ', '۳ هفته'], ['پیاده‌سازی', 'نسخه بتا', '۶ هفته'], ['تحویل', 'انتشار نسخه ۱.۰', '۱ هفته']], hasFooter: false, zebra: true }),
      b('chart', { chartType: 'bar', title: 'توزیع نفر-ساعت به‌تفکیک فاز', labels: ['کشف', 'طراحی', 'پیاده‌سازی', 'تحویل'], datasets: [{ label: 'نفر-ساعت', data: [80, 160, 480, 60], color: '#7c3aed' }] }),
      b('timeline', { items: [{ date: 'هفته ۱-۲', title: 'کشف نیازمندی', desc: 'مصاحبه با ذی‌نفعان و تحلیل رقبا', icon: '۱' }, { date: 'هفته ۳-۵', title: 'طراحی تجربه', desc: 'وایرفریم و رابط نهایی', icon: '۲' }, { date: 'هفته ۶-۱۱', title: 'توسعه', desc: 'پیاده‌سازی و تست', icon: '۳' }] }),
      b('sign', { signatures: [{ title: 'تهیه‌کننده', name: 'رضا خوشنود' }, { title: 'تأیید کارفرما', name: '—' }] })
    ]
  },
  {
    id: 'tpl-contract',
    name: { fa: 'قرارداد همکاری', en: 'Cooperation Contract' },
    category: 'biz',
    theme: 'official',
    settings: { bgEffect: 'none', animations: false },
    blocks: () => [
      b('heading', { text: 'قرارداد همکاری خدمات نرم‌افزاری', level: 1, underline: true }),
      b('text', { html: '<p>این قرارداد در تاریخ ' + TODAY + ' بین <b>شرکت آفرینش داده پارس</b> (کارفرما) و <b>رضا خوشنود</b> (پیمانکار) منعقد گردید.</p>' }),
      b('heading', { text: 'ماده ۱ — موضوع قرارداد', level: 3 }),
      b('text', { html: '<p>طراحی و پیاده‌سازی پلتفرم آموزش آنلاین مطابق سند نیازمندی‌های پیوست.</p>' }),
      b('heading', { text: 'ماده ۲ — مدت و مبلغ', level: 3 }),
      b('table', { caption: '', headers: ['شرح', 'مقدار'], rows: [['مدت اجرا', '۹۰ روز از تاریخ امضا'], ['مبلغ قرارداد', '۲۸۵٬۰۰۰٬۰۰۰ تومان'], ['نحوه پرداخت', '۴۰٪ پیش‌پرداخت، ۶۰٪ پس از تحویل']], hasFooter: false, zebra: false }),
      b('heading', { text: 'ماده ۳ — تعهدات طرفین', level: 3 }),
      b('text', { html: '<ol><li>پیمانکار متعهد به تحویل در زمان مقرر است.</li><li>کارفرما متعهد به تأمین اطلاعات و بازخورد به‌موقع است.</li><li>مالکیت کد نهایی پس از تسویه کامل به کارفرما منتقل می‌شود.</li></ol>' }),
      b('divider', { style: 'solid' }),
      b('sign', { signatures: [{ title: 'کارفرما', name: 'شرکت آفرینش داده پارس' }, { title: 'پیمانکار', name: 'رضا خوشنود' }] })
    ]
  },
  {
    id: 'tpl-resume',
    name: { fa: 'رزومه حرفه‌ای', en: 'Professional Resume' },
    category: 'resume',
    theme: 'minimal',
    settings: { bgEffect: 'gradient-flow', animations: true },
    blocks: () => [
      b('hero', { title: 'رضا خوشنود', subtitle: 'توسعه‌دهنده فول‌استک · طراح تجربه کاربری', badge: 'رزومه', icon: '👤', bgGradient: 'linear-gradient(135deg,#111827,#374151)', meta: ['reza.khoshnoood@gmail.com', 'آمستردام، هلند', 'نمونه‌کار: github.com/rezakhoshnood'] }, { animation: 'slideUp' }),
      b('stat-grid', { columns: 3, stats: [{ label: 'سال تجربه', value: '۸', icon: '📅', color: '#111827', countTo: 8 }, { label: 'پروژه موفق', value: '۴۲', icon: '✅', color: '#374151', countTo: 42 }, { label: 'رضایت کارفرما', value: '۹۸٪', icon: '⭐', color: '#4f8cff', countTo: 98, suffix: '٪' }] }),
      b('heading', { text: 'تجربه کاری', level: 2, underline: true }),
      b('timeline', { items: [{ date: '۱۴۰۲ — اکنون', title: 'توسعه‌دهنده ارشد — استودیو داده', desc: 'رهبری تیم فرانت‌اند و طراحی معماری ماژولار', icon: '۱' }, { date: '۱۳۹۹ — ۱۴۰۲', title: 'توسعه‌دهنده فول‌استک — نوآوران', desc: 'ساخت داشبوردهای تحلیلی و APIهای مقیاس‌پذیر', icon: '۲' }, { date: '۱۳۹۷ — ۱۳۹۹', title: 'طراح رابط کاربری — فریلنس', desc: 'طراحی بیش از ۳۰ رابط کاربری برای استارتاپ‌ها', icon: '۳' }] }),
      b('heading', { text: 'مهارت‌ها', level: 2, underline: true }),
      b('table', { caption: '', headers: ['مهارت', 'سطح'], rows: [['JavaScript / TypeScript', 'پیشرفته'], ['React / Next.js', 'پیشرفته'], ['UI/UX Design', 'پیشرفته'], ['Node.js / PostgreSQL', 'متوسط'], ['Python / Data', 'متوسط']], hasFooter: false, zebra: true }),
      b('heading', { text: 'تحصیلات', level: 2, underline: true }),
      b('text', { html: '<p><b>کارشناسی مهندسی کامپیوتر</b> — دانشگاه تهران، ۱۳۹۳ — ۱۳۹۷</p>' }),
      b('sign', { signatures: [{ title: 'امضا', name: 'رضا خوشنود' }] })
    ]
  },
  {
    id: 'tpl-company',
    name: { fa: 'معرفی شرکت', en: 'Company Profile' },
    category: 'intro',
    theme: 'ocean',
    settings: { bgEffect: 'orbit', animations: true },
    blocks: () => [
      b('hero', { title: 'آفرینش داده پارس', subtitle: 'ساخت محصولات داده‌محور برای کسب‌وکارهای ایرانی', badge: 'معرفی شرکت', icon: '🏢', bgGradient: 'linear-gradient(135deg,#0369a1,#22d3ee)', meta: ['تأسیس ۱۳۹۵', '۴۵ همکار', 'تهران'] }, { animation: 'fadeIn' }),
      b('heading', { text: 'درباره ما', level: 2, underline: true }),
      b('text', { html: '<p>ما تیمی از مهندسان داده، طراحان و متخصصان محصول هستیم که به سازمان‌ها کمک می‌کنیم تصمیم‌های بهتر و سریع‌تر بگیرند.</p>' }),
      b('chart', { chartType: 'doughnut', title: 'ترکیب مشتریان', labels: ['فین‌تک', 'خرده‌فروشی', 'سلامت', 'آموزش'], datasets: [{ label: 'سهم', data: [35, 28, 22, 15] }] }),
      b('stat-grid', { columns: 4, stats: [{ label: 'پروژه', value: '۱۲۰', icon: '📦', color: '#0284c7', countTo: 120 }, { label: 'مشتری فعال', value: '۳۸', icon: '🤝', color: '#22d3ee', countTo: 38 }, { label: 'همکار', value: '۴۵', icon: '👥', color: '#0c4a6e', countTo: 45 }, { label: 'رضایت', value: '۹۶٪', icon: '💙', color: '#0369a1', countTo: 96, suffix: '٪' }] }),
      b('heading', { text: 'فرایند همکاری', level: 2, underline: true }),
      b('flow', { mermaid: 'graph LR\n  A[جلسه کشف] --> B[طراحی راه‌حل]\n  B --> C[اجرای چابک]\n  C --> D[تحویل و پشتیبانی]', caption: 'چرخه همکاری با مشتری' }),
      b('heading', { text: 'تماس با ما', level: 2, underline: true }),
      b('text', { html: '<p>ایمیل: hello@parsdata.example<br>تلفن: ۰۲۱-۹۱۰۰۰۰۰۰<br>وب‌سایت: parsdata.example</p>' })
    ]
  },
  {
    id: 'tpl-certificate',
    name: { fa: 'گواهی پایان دوره', en: 'Course Certificate' },
    category: 'cert',
    theme: 'royal',
    settings: { bgEffect: 'particles', animations: true },
    blocks: () => [
      b('hero', { title: 'گواهی پایان دوره', subtitle: 'دوره جامع طراحی رابط کاربری', badge: 'گواهی رسمی', icon: '🏅', bgGradient: 'linear-gradient(135deg,#7c3aed,#c084fc)', meta: ['شماره گواهی: CERT-۱۴۰۴-۰۱۹۲'] }, { animation: 'zoomIn' }),
      b('heading', { text: 'این گواهی به نام', level: 3, underline: false }),
      b('heading', { text: 'سارا محمدی', level: 1, underline: true }),
      b('text', { html: '<p style="text-align:center">صادر می‌شود به پاس اتمام موفقیت‌آمیز ۴۸ ساعت آموزش و ارزیابی نهایی با نمره <b>۱۹ از ۲۰</b>.</p>' }),
      b('divider', { style: 'ornament', ornament: '✦ ❖ ✦' }),
      b('sign', { signatures: [{ title: 'مدرس دوره', name: 'رضا خوشنود' }, { title: 'مدیر آموزش', name: '—' }] })
    ]
  },
  {
    id: 'tpl-appreciation',
    name: { fa: 'تقدیرنامه', en: 'Appreciation Letter' },
    category: 'cert',
    theme: 'academic',
    settings: { bgEffect: 'gradient-flow', animations: true },
    blocks: () => [
      b('heading', { text: 'تقدیرنامه', level: 1, underline: true }),
      b('hero', { title: 'لوح تقدیر', subtitle: 'به پاس تلاش و تعهد ارزشمند', badge: 'تقدیر', icon: '📜', bgGradient: 'linear-gradient(135deg,#8b1d2c,#b03a4a)', meta: ['تاریخ: ' + TODAY] }, { animation: 'fadeIn' }),
      b('text', { html: '<p>بدین‌وسیله از تلاش‌های ارزنده جناب آقای <b>رضا خوشنود</b> در طراحی و راه‌اندازی سامانه آموزش آنلاین سازمان، صمیمانه تقدیر و تشکر می‌گردد.</p><p>امید است این همکاری در آینده نیز تداوم یابد.</p>' }),
      b('divider', { style: 'dotted' }),
      b('sign', { signatures: [{ title: 'معاونت منابع انسانی', name: '—' }, { title: 'مدیرعامل', name: '—' }] })
    ]
  },
  {
    id: 'tpl-monthly-report',
    name: { fa: 'گزارش ماهانه', en: 'Monthly Report' },
    category: 'report',
    theme: 'technical',
    settings: { bgEffect: 'matrix', animations: true },
    blocks: () => [
      b('hero', { title: 'گزارش عملکرد ماهانه', subtitle: 'مهر ۱۴۰۴ — تیم محصول', badge: 'گزارش', icon: '📊', bgGradient: 'linear-gradient(135deg,#0f766e,#155e75)', meta: ['تهیه‌کننده: رضا خوشنود', 'تاریخ: ' + TODAY] }, { animation: 'slideUp' }),
      b('stat-grid', { columns: 4, stats: [{ label: 'کاربر فعال ماهانه', value: '۱۲٬۴۰۰', icon: '👤', color: '#0f766e', countTo: 12400 }, { label: 'نرخ تبدیل', value: '۴٫۸٪', icon: '🎯', color: '#0ea5e9', countTo: 4.8, suffix: '٪' }, { label: 'تیکت پشتیبانی', value: '۳۱۲', icon: '🎫', color: '#f5a524', countTo: 312 }, { label: 'رضایت (CSAT)', value: '۹۴٪', icon: '💚', color: '#16c79a', countTo: 94, suffix: '٪' }] }),
      b('heading', { text: 'روند شاخص‌های کلیدی', level: 2, underline: true }),
      b('chart', { chartType: 'line', title: 'کاربران فعال — شش ماه گذشته', labels: ['اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر'], datasets: [{ label: 'کاربر فعال', data: [7200, 8100, 8900, 9800, 11200, 12400], color: '#0f766e' }, { label: 'کاربر جدید', data: [900, 1100, 1250, 1400, 1700, 2100], color: '#0ea5e9' }] }),
      b('heading', { text: 'کارهای انجام‌شده', level: 2, underline: true }),
      b('table', { caption: 'خلاصه فعالیت‌ها', headers: ['محور', 'وضعیت', 'پیشرفت'], rows: [['بازطراحی صفحه پرداخت', 'تکمیل', '۱۰۰٪'], ['بهینه‌سازی سرعت', 'در جریان', '۷۰٪'], ['اپلیکیشن موبایل', 'شروع', '۲۵٪']], hasFooter: false, zebra: true }),
      b('heading', { text: 'ریسک‌ها و اقدامات', level: 2, underline: true }),
      b('timeline', { items: [{ date: 'ریسک ۱', title: 'وابستگی به سرویس پیامک', desc: 'اقدام: افزودن سرویس جایگزین', icon: '!' }, { date: 'ریسک ۲', title: 'کمبود نیروی بک‌اند', desc: 'اقدام: جذب نیرو در آبان', icon: '!' }] }),
      b('sign', { signatures: [{ title: 'تهیه‌کننده', name: 'رضا خوشنود' }, { title: 'تأیید مدیر محصول', name: '—' }] })
    ]
  },
  {
    id: 'tpl-checklist',
    name: { fa: 'چک‌لیست انتشار', en: 'Release Checklist' },
    category: 'report',
    theme: 'official',
    settings: { bgEffect: 'none', animations: false },
    blocks: () => [
      b('heading', { text: 'چک‌لیست انتشار نسخه ۱.۰', level: 1, underline: true }),
      b('text', { html: '<p>پیش از انتشار، همه موارد زیر باید تأیید شوند.</p>' }),
      b('table', { caption: 'مراحل فنی', headers: ['#', 'مورد', 'مسئول', 'وضعیت'], rows: [['۱', 'تست واحد و یکپارچگی', 'تیم فنی', '✅'], ['۲', 'بازبینی کد', 'سرگروه', '✅'], ['۳', 'تست دسترس‌پذیری', 'تیم طراحی', '⏳'], ['۴', 'آزمون پذیرش کاربر', 'محصول', '⬜'], ['۵', 'پشتیبان‌گیری داده', 'دواپس', '⬜']], hasFooter: false, zebra: true }),
      b('divider', { style: 'dashed' }),
      b('table', { caption: 'موارد محتوایی', headers: ['#', 'مورد', 'مسئول', 'وضعیت'], rows: [['۶', 'بازبینی متن‌های رابط', 'محتوا', '✅'], ['۷', 'به‌روزرسانی راهنما', 'محتوا', '⏳'], ['۸', 'اطلاع‌رسانی به کاربران', 'مارکتینگ', '⬜']], hasFooter: false, zebra: true }),
      b('sign', { signatures: [{ title: 'تأیید فنی', name: '—' }, { title: 'تأیید محصول', name: '—' }] })
    ]
  },
  {
    id: 'tpl-roadmap',
    name: { fa: 'نقشه راه پروژه', en: 'Project Roadmap' },
    category: 'biz',
    theme: 'sunset',
    settings: { bgEffect: 'orbit', animations: true },
    blocks: () => [
      b('hero', { title: 'نقشه راه محصول ۱۴۰۵', subtitle: 'از کشف تا مقیاس', badge: 'نقشه راه', icon: '🗺️', bgGradient: 'linear-gradient(135deg,#f97316,#e11d48)', meta: ['تیم محصول', 'به‌روزرسانی: ' + TODAY] }, { animation: 'slideUp' }),
      b('timeline', { items: [{ date: 'سه‌ماهه اول', title: 'پایه‌گذاری', desc: 'تحقیق کاربر، تعریف شاخص‌ها، MVP', icon: '۱' }, { date: 'سه‌ماهه دوم', title: 'رشد', desc: 'بهینه‌سازی قیف ثبت‌نام و پرداخت', icon: '۲' }, { date: 'سه‌ماهه سوم', title: 'مقیاس', desc: 'زیرساخت چندشعبه و بین‌‌المللی‌سازی', icon: '۳' }, { date: 'سه‌ماهه چهارم', title: 'پایداری', desc: 'اتوماسیون پشتیبانی و تحلیل پیشرفته', icon: '۴' }] }),
      b('chart', { chartType: 'bar', title: 'تخصیص ظرفیت تیم (%)', labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ label: 'توسعه', data: [45, 50, 55, 40], color: '#f97316' }, { label: 'طراحی', data: [30, 25, 20, 20], color: '#e11d48' }, { label: 'تحقیق', data: [25, 25, 25, 40], color: '#f5a524' }] }),
      b('flow', { mermaid: 'graph TD\n  A[کشف] --> B[طراحی]\n  B --> C[ساخت]\n  C --> D[سنجش]\n  D --> B', caption: 'چرخه بهبود مستمر' })
    ]
  },
  {
    id: 'tpl-portfolio',
    name: { fa: 'نمونه‌کار', en: 'Portfolio' },
    category: 'intro',
    theme: 'darkprint',
    settings: { bgEffect: 'matrix', animations: true },
    blocks: () => [
      b('hero', { title: 'نمونه‌کارهای منتخب', subtitle: 'طراحی محصول و تجربه کاربری', badge: 'پورتفولیو', icon: '🎨', bgGradient: 'linear-gradient(135deg,#0f172a,#1e3a8a)', meta: ['رضا خوشنود', 'github.com/rezakhoshnood'] }, { animation: 'flipIn' }),
      b('heading', { text: 'داشبورد تحلیل فروش', level: 2, underline: true }),
      b('text', { html: '<p>طراحی و پیاده‌سازی داشبورد تحلیلی برای یک هلدینگ خرده‌فروشی با بیش از ۲۰۰ نمایندگی. تمرکز بر سرعت بارگذاری و خوانایی داده‌ها.</p>' }),
      b('chart', { chartType: 'bar', title: 'نتیجه: کاهش زمان تحلیل از ۴ ساعت به ۲۰ دقیقه', labels: ['قبل', 'بعد'], datasets: [{ label: 'دقیقه', data: [240, 20], color: '#60a5fa' }] }),
      b('code', { language: 'javascript', filename: 'chart-config.js', code: "const config = {\n  type: 'bar',\n  data: { labels: ['قبل', 'بعد'], datasets: [{ data: [240, 20] }] },\n  options: { responsive: true, animation: { duration: 800 } }\n};\nexport default config;" }),
      b('heading', { text: 'پلتفرم آموزش آنلاین', level: 2, underline: true }),
      b('text', { html: '<p>طراحی جریان ثبت‌نام، پخش ویدیو و ارزیابی برای بیش از ۱۲ هزار دانشجو.</p>' }),
      b('image', { src: '', alt: 'نمای پلتفرم', caption: 'نمای صفحه دوره (تصویر را در ادیتور اضافه کنید)', maxWidth: 100, align: 'center' }),
      b('sign', { signatures: [{ title: 'ارتباط با من', name: 'reza.khoshnoood@gmail.com' }] })
    ]
  }
];

export const TEMPLATE_CATEGORIES = [
  { id: 'edu', labelKey: 'cat.edu' },
  { id: 'biz', labelKey: 'cat.biz' },
  { id: 'resume', labelKey: 'cat.resume' },
  { id: 'intro', labelKey: 'cat.intro' },
  { id: 'cert', labelKey: 'cat.cert' },
  { id: 'report', labelKey: 'cat.report' }
];

/** قالب را به یک سند کامل تبدیل می‌کند */
export function templateToDoc(tpl, lang = 'en') {
  let blocks = typeof tpl.blocks === 'function' ? tpl.blocks() : (tpl.blocks || []);
  const builtin = TEMPLATES.includes(tpl);
  lang = lang === 'en' ? 'en' : 'fa';
  if (builtin && lang === 'en') blocks = englishTemplateBlocks(tpl.id, blocks);
  return {
    id: uid(),
    name: typeof tpl.name==='string'?tpl.name:((tpl.name && (tpl.name[lang] || tpl.name.fa)) || 'سند'),
    lang,
    theme: tpl.theme || 'modern-blue',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {
      webWidth:'wide', bgEffect: 'particles', bgEffectColor: '#4f8cff', bgEffectOpacity: 0.3,
      transitionSpeed: 'normal', autoScroll: false, autoScrollInterval: 5,
      showProgress: true, musicUrl: '', animations: true, exportMode: 'view', showFooter: true,
      ...(tpl.settings || {}),
      sourceTemplateId: builtin ? tpl.id : null
    },
    blocks: blocks.map((bl) => ({ ...bl, id: uid(), data: JSON.parse(JSON.stringify(bl.data)) }))
  };
}

export function getTemplate(id) { return TEMPLATES.find((t) => t.id === id) || null; }

export default TEMPLATES;
