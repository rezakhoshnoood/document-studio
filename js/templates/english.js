/* Curated English counterparts for built-in templates. User-authored text is never translated. */
const sig=[{title:'Prepared by',name:'Full name'},{title:'Approved by',name:'Full name'}];
export const ENGLISH_DATA={
 'tpl-store-receipt':[
  {alt:'Company logo',align:'left'},
  {title:'Store Sales Receipt',subtitle:'Store name and contact details',badge:'Receipt',meta:['Receipt no. 1','Date: —','Payment due: —']},
  {caption:'Purchased items',headers:['Item','Quantity','Unit price','Amount'],rows:[['Sample item','2','150,000',''],['Second sample item','1','80,000','']],footerRow:['Total','','','']},
  {html:'<p>Payment method: — &nbsp; | &nbsp; Notes: —</p>'}
 ],
 'tpl-calculated-invoice':[
  {title:'Calculated Sales Invoice',subtitle:'Seller and customer details',badge:'Invoice',meta:['Invoice no.: —','Date: —','Due date: —']},
  {caption:'Items and discounts',headers:['Description','Quantity','Unit price','Discount %','Total'],rows:[['Product or service','2','100,000','10',''],['Product or service','1','50,000','0','']],footerRow:['Total','','','','']},
  {html:'<p>Enter the payment due date and terms.</p>'},{signatures:sig}
 ],
 'tpl-payment-due':[
  {title:'Payment Receipt & Due Dates',subtitle:'Customer and seller details',badge:'Payment tracking',meta:['Reference: —','Issue date: —']},
  {caption:'Payment schedule',headers:['Stage','Due date','Amount','Status'],rows:[['First payment','—','100,000','Unpaid'],['Second payment','—','100,000','Unpaid']],footerRow:['Total','','','']},{signatures:sig}
 ],
 'tpl-company-letter-logo':[
  {alt:'Company logo',align:'left'},{title:'Company Letterhead',subtitle:'Company name and contact details',badge:'Official letter',meta:['Date: …','Reference: …']},{text:'Subject'},{html:'<p>Write your company letter here.</p>'},{signatures:sig}
 ],
 'tpl-company-report-logo':[
  {alt:'Company logo',align:'left'},{title:'Company Report',subtitle:'Reporting period and company name',badge:'Report',meta:['Date: …']},{text:'Report Summary'},{html:'<p>Enter the summary and findings here.</p>'},
  {caption:'Report data',headers:['Description','Quantity','Amount'],rows:[['Consulting','2','4,000,000'],['Interface design','1','9,500,000'],['Monthly support','3','1,800,000']],footerRow:['Total','6','15,300,000']}
 ],
 'tpl-lesson-plan':[
  {title:'Lesson Plan: Introduction to AI',subtitle:'Grade 12 · Computer Science · 90 minutes',badge:'Lesson plan',meta:['Instructor: Reza Khoshnood','Date: —','Class: 12/2']},{text:'Learning Objectives'},
  {html:'<ul><li>Define artificial intelligence and distinguish it from machine learning.</li><li>Identify AI applications in everyday life.</li><li>Build a simple classification model.</li></ul>'},
  {caption:'Session schedule',headers:['Section','Activity','Time (minutes)'],rows:[['Introduction','Discussion and questions','10'],['Concepts','Presentation and examples','25'],['Workshop','Group exercise','35'],['Wrap-up','Review and homework','20']],footerRow:['Total','—','90']},
  {stats:[{label:'Students',value:'24'},{label:'Working groups',value:'6'},{label:'Practical exercises',value:'3'}]},{text:'Assessment'},
  {html:'<ol><li>End-of-session questions (20%)</li><li>Group exercise (40%)</li><li>Take-home project (40%)</li></ol>'},{signatures:[{title:'Instructor',name:'Reza Khoshnood'},{title:'Department head',name:'—'}]}
 ],
 'tpl-weekly':[
  {title:'Weekly Class Schedule',subtitle:'Week overview',badge:'Weekly',meta:['Class 12/2']},
  {caption:'Class schedule',headers:['Day','Period 1','Period 2','Period 3'],rows:[['Monday','Math','Programming','English'],['Tuesday','Networks','Math','Physical education'],['Wednesday','Artificial intelligence','Workshop','Literature'],['Thursday','Programming','Math','Social studies'],['Friday','Project workshop','Artificial intelligence','—']],footerRow:['Total','6','15,300,000']},
  {items:[{date:'Monday',title:'Math quiz',desc:'Chapter 2 — derivatives',icon:'1'},{date:'Friday',title:'Project due',desc:'Class AI project',icon:'2'}]}, {},{html:'<p><b>Reminder:</b> Attendance at the project workshop is required.</p>'}
 ],
 'tpl-invoice':[
  {title:'Sales Invoice',subtitle:'Example Company',badge:'Invoice no. 0071',meta:['Date: —','Payment due in 15 days']},
  {html:'<p><b>Customer:</b> Example Client<br><b>Address:</b> Customer address<br><b>Phone:</b> Contact number</p>'},
  {caption:'Invoice items',headers:['#','Service description','Quantity','Unit price','Amount'],rows:[['1','Dashboard UI design','1','9,500,000','9,500,000'],['2','API implementation','3','4,000,000','12,000,000'],['3','Three-month support','1','4,500,000','4,500,000']],footerRow:['','Total (including 9% tax)','','','28,345,000']},
  {stats:[{label:'Total',value:'28,345,000'},{label:'Tax',value:'9%',suffix:'%'},{label:'Days valid',value:'15'}]},
  {html:'<p class="muted">Add payment instructions and account details here.</p>'},{signatures:[{title:'Seller signature',name:'Example Company'},{title:'Customer signature',name:'—'}]}
 ],
 'tpl-proposal':[
  {title:'Online Learning Platform Proposal',subtitle:'Project proposal — version 1.0',badge:'Proposal',meta:['Prepared by: Reza Khoshnood','Date: —']},{text:'Executive Summary'},
  {html:'<p>Design and develop an online learning platform focused on usability, accessibility, and a clear learning experience.</p>'},{text:'Scope of Work'},
  {caption:'Phases and schedule',headers:['Phase','Deliverable','Duration'],rows:[['Discovery','Requirements','2 weeks'],['Design','Designs and prototype','3 weeks'],['Development','Beta release','6 weeks'],['Delivery','Version 1.0','1 week']],footerRow:['Total','6','15,300,000']},
  {title:'Team hours by phase',labels:['Discovery','Design','Development','Delivery'],datasets:[{label:'Hours'}]},
  {items:[{date:'Weeks 1–2',title:'Discovery',desc:'Stakeholder interviews and research',icon:'1'},{date:'Weeks 3–5',title:'Experience design',desc:'Wireframes and interface design',icon:'2'},{date:'Weeks 6–11',title:'Development',desc:'Implementation and testing',icon:'3'}]},
  {signatures:[{title:'Prepared by',name:'Reza Khoshnood'},{title:'Client approval',name:'—'}]}
 ],
 'tpl-contract':[
  {text:'Software Services Agreement'},{html:'<p>This agreement is made between <b>Example Company</b> (client) and <b>Reza Khoshnood</b> (contractor) on the agreed date.</p>'},{text:'1 — Scope'},
  {html:'<p>Design and development of an online learning platform according to the attached requirements.</p>'},{text:'2 — Duration and fees'},
  {headers:['Description','Terms'],rows:[['Duration','90 days from signing'],['Project fee','285,000,000'],['Payment','40% in advance; 60% on delivery']],footerRow:['Total','6','15,300,000']},
  {text:'3 — Responsibilities'},{html:'<ol><li>The contractor will deliver the agreed work on schedule.</li><li>The client will provide timely information and feedback.</li><li>Ownership of the final code transfers after full payment.</li></ol>'},{},
  {signatures:[{title:'Client',name:'Example Company'},{title:'Contractor',name:'Reza Khoshnood'}]}
 ],
 'tpl-resume':[
  {title:'Reza Khoshnood',subtitle:'Full-stack developer · UX designer',badge:'Resume',meta:['reza.khoshnoood@gmail.com','Amsterdam, Netherlands','Portfolio: github.com/rezakhoshnood']},
  {stats:[{label:'Years of experience',value:'8'},{label:'Completed projects',value:'42'},{label:'Client satisfaction',value:'98%',suffix:'%'}]},{text:'Experience'},
  {items:[{date:'2023 — Present',title:'Senior developer — Data Studio',desc:'Led front-end work and modular architecture.',icon:'1'},{date:'2020 — 2023',title:'Full-stack developer',desc:'Built analytics dashboards and scalable APIs.',icon:'2'},{date:'2018 — 2020',title:'Freelance UI designer',desc:'Designed interfaces for startups.',icon:'3'}]},
  {text:'Skills'},{headers:['Skill','Level'],rows:[['JavaScript / TypeScript','Advanced'],['React / Next.js','Advanced'],['UI/UX Design','Advanced'],['Node.js / PostgreSQL','Intermediate'],['Python / Data','Intermediate']],footerRow:['Total','6','15,300,000']},{text:'Education'},
  {html:'<p><b>BSc in Computer Engineering</b> — University of Tehran</p>'},{signatures:[{title:'Signature',name:'Reza Khoshnood'}]}
 ],
 'tpl-company':[
  {title:'Example Data Company',subtitle:'Building data-driven products for modern businesses',badge:'Company profile',meta:['Established 2016','45 team members','Amsterdam']},{text:'About Us'},
  {html:'<p>We are a team of engineers, designers, and product specialists helping organizations make better decisions.</p>'},
  {title:'Customer mix',labels:['Fintech','Retail','Healthcare','Education'],datasets:[{label:'Share'}]},
  {stats:[{label:'Projects',value:'120'},{label:'Active clients',value:'38'},{label:'Team members',value:'45'},{label:'Satisfaction',value:'96%',suffix:'%'}]},
  {text:'How We Work'},{mermaid:'graph LR\n  A[Discovery] --> B[Solution design]\n  B --> C[Agile delivery]\n  C --> D[Support]',caption:'Our collaboration process'},{text:'Contact Us'},
  {html:'<p>Email: hello@example.com<br>Phone: Add your number<br>Website: example.com</p>'}
 ],
 'tpl-certificate':[
  {title:'Certificate of Completion',subtitle:'User Interface Design Course',badge:'Certificate',meta:['Certificate no.: CERT-0192']},{text:'This certificate is presented to'},{text:'Sara Mohammadi'},
  {html:'<p style="text-align:center">For successfully completing 48 hours of training and achieving <b>19 out of 20</b> in the final assessment.</p>'},{},
  {signatures:[{title:'Course instructor',name:'Reza Khoshnood'},{title:'Training director',name:'—'}]}
 ],
 'tpl-appreciation':[
  {text:'Letter of Appreciation'},{title:'Certificate of Appreciation',subtitle:'In recognition of outstanding effort and commitment',badge:'Appreciation',meta:['Date: —']},
  {html:'<p>We sincerely thank <b>Reza Khoshnood</b> for valuable contributions to the design and launch of the online learning platform.</p><p>We look forward to continued collaboration.</p>'},{},
  {signatures:[{title:'Human resources',name:'—'},{title:'Chief executive',name:'—'}]}
 ],
 'tpl-monthly-report':[
  {title:'Monthly Performance Report',subtitle:'Product team · Monthly overview',badge:'Report',meta:['Prepared by: Reza Khoshnood','Date: —']},
  {stats:[{label:'Monthly active users',value:'12,400'},{label:'Conversion rate',value:'4.8%',suffix:'%'},{label:'Support tickets',value:'312'},{label:'Satisfaction (CSAT)',value:'94%',suffix:'%'}]},{text:'Key Metrics'},
  {title:'Active users — last six months',labels:['May','June','July','August','September','October'],datasets:[{label:'Active users'},{label:'New users'}]},{text:'Completed Work'},
  {caption:'Activity summary',headers:['Initiative','Status','Progress'],rows:[['Checkout redesign','Complete','100%'],['Performance optimization','In progress','70%'],['Mobile app','Started','25%']],footerRow:['Total','6','15,300,000']},{text:'Risks and Actions'},
  {items:[{date:'Risk 1',title:'Dependence on messaging provider',desc:'Add an alternative provider.'},{date:'Risk 2',title:'Backend staffing',desc:'Recruit additional support.'}]},
  {signatures:[{title:'Prepared by',name:'Reza Khoshnood'},{title:'Product manager approval',name:'—'}]}
 ],
 'tpl-checklist':[
  {text:'Release Checklist — Version 1.0'},{html:'<p>All items below should be reviewed before release.</p>'},
  {caption:'Technical checks',headers:['#','Item','Owner','Status'],rows:[['1','Unit and integration tests','Engineering','✅'],['2','Code review','Team lead','✅'],['3','Accessibility testing','Design','⏳'],['4','User acceptance testing','Product','⬜'],['5','Data backup','Operations','⬜']],footerRow:['Total','6','15,300,000']},{},
  {caption:'Content checks',headers:['#','Item','Owner','Status'],rows:[['6','Review interface copy','Content','✅'],['7','Update documentation','Content','⏳'],['8','Notify users','Marketing','⬜']],footerRow:['Total','6','15,300,000']},
  {signatures:[{title:'Technical approval',name:'—'},{title:'Product approval',name:'—'}]}
 ],
 'tpl-roadmap':[
  {title:'Product Roadmap',subtitle:'From discovery to scale',badge:'Roadmap',meta:['Product team','Updated: —']},
  {items:[{date:'Q1',title:'Foundation',desc:'User research, metrics, and MVP',icon:'1'},{date:'Q2',title:'Growth',desc:'Improve onboarding and payments',icon:'2'},{date:'Q3',title:'Scale',desc:'Infrastructure and internationalization',icon:'3'},{date:'Q4',title:'Sustainability',desc:'Support automation and advanced analytics',icon:'4'}]},
  {title:'Team capacity allocation (%)',datasets:[{label:'Development'},{label:'Design'},{label:'Research'}]},
  {mermaid:'graph TD\n  A[Discover] --> B[Design]\n  B --> C[Build]\n  C --> D[Measure]\n  D --> B',caption:'Continuous improvement cycle'}
 ],
 'tpl-portfolio':[
  {title:'Selected Work',subtitle:'Product design and user experience',badge:'Portfolio',meta:['Reza Khoshnood','github.com/rezakhoshnood']},{text:'Sales Analytics Dashboard'},
  {html:'<p>Designed an analytics dashboard for a retail organization, focusing on speed and data clarity.</p>'},
  {title:'Analysis time: from four hours to twenty minutes',labels:['Before','After'],datasets:[{label:'Minutes'}]},
  {code:"const config = {\n  type: 'bar',\n  data: { labels: ['Before', 'After'], datasets: [{ data: [240, 20] }] },\n  options: { responsive: true, animation: { duration: 800 } }\n};\nexport default config;"},
  {text:'Online Learning Platform'},{html:'<p>Designed enrollment, video playback, and assessment workflows for learners.</p>'},
  {alt:'Platform view',caption:'Course page preview'}, {signatures:[{title:'Contact',name:'reza.khoshnoood@gmail.com'}]}
 ]
};
function merge(base,patch){if(Array.isArray(patch)){if(patch.length&&patch.every(x=>x&&typeof x==='object'&&!Array.isArray(x))&&Array.isArray(base))return patch.map((x,i)=>merge(base[i]||{},x));return patch;}if(patch&&typeof patch==='object'){const out={...(base||{})};for(const [k,v] of Object.entries(patch))out[k]=merge(out[k],v);return out;}return patch;}
function western(value){if(typeof value==='string')return value.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/٬/g,',').replace(/٫/g,'.').replace(/٪/g,'%');if(Array.isArray(value))return value.map(western);if(value&&typeof value==='object'){return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,western(v)]));}return value;}
export function englishTemplateBlocks(id,blocks){const patches=ENGLISH_DATA[id];if(!patches)return blocks;return blocks.map((block,i)=>({...block,data:western(merge(block.data,patches[i]||{}))}));}
const DEFAULTS={
 hero:{title:'Your Document Title',subtitle:'Add a short, descriptive subtitle.',badge:'Document',meta:['Date: —','Reference: 001']},
 layout:{html:'<section class="intro">\n  <p class="eyebrow">Welcome</p>\n  <h1>My page</h1>\n  <p>Customize this layout with HTML and CSS.</p>\n</section>\n<section class="cards">\n  <article>First section</article><article>Second section</article>\n</section>'},
 heading:{text:'Section heading'},text:{html:'<p>Write your text here. You can use <b>bold</b>, <i>italic</i>, and lists.</p><ul><li>First point</li><li>Second point</li></ul>'},
 table:{caption:'Information',headers:['Description','Quantity','Amount'],rows:[['Consulting','2','4,000,000'],['Interface design','1','9,500,000'],['Monthly support','3','1,800,000']],footerRow:['Total','6','15,300,000']},
 sign:{signatures:sig},'stat-grid':{stats:[{label:'Active users',value:'1,240'},{label:'Customer satisfaction',value:'96%',suffix:'%'},{label:'Successful projects',value:'38'}]},
 timeline:{items:[{date:'Phase 1',title:'Project kickoff',desc:'Define scope and goals',icon:'1'},{date:'Phase 2',title:'Design and development',desc:'Build and review the first version',icon:'2'},{date:'Phase 3',title:'Final delivery',desc:'Release and documentation',icon:'3'}]},
 chart:{title:'Monthly sales',labels:['January','February','March','April','May','June'],datasets:[{label:'Sales'}]},
 flow:{mermaid:'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Process]\n  B -->|No| D[End]\n  C --> D',caption:'Workflow'},
 image:{alt:'Document image'},logo:{alt:'Company logo',align:'left'},code:{code:'// Example code\nconst studio = new DocumentStudio({\n  name: "Document Studio",\n  theme: "modern-blue"\n});\nstudio.export("html");'}
};
export function localizeNewBlock(block,lang){if(lang==='en'&&DEFAULTS[block.type])block.data=western(merge(block.data,DEFAULTS[block.type]));return block;}
