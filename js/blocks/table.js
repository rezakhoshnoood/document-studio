/* blocks/table.js — بلوک جدول */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';
import { deleteTableColumn, deleteTableRow } from './table-ops.js';
import { displayTableCell, smartFooter } from '../core/table-math.js';
import { renderMerges } from './table-merge.js';
import { numeric, tableFooter, persianDigits } from '../core/numbers.js';

const def = {
  type: 'table',
  icon: '📊',
  labelKey: 'block.table',
  createData: () => ({
    caption: 'جدول اطلاعات',
    headers: ['شرح', 'تعداد', 'مبلغ (تومان)'],
    rows: [
      ['خدمات مشاوره', '۲', '۴٬۰۰۰٬۰۰۰'],
      ['طراحی رابط کاربری', '۱', '۹٬۵۰۰٬۰۰۰'],
      ['پشتیبانی ماهانه', '۳', '۱٬۸۰۰٬۰۰۰']
    ],
    hasFooter: true,
    footerRow: ['جمع کل', '۶', '۱۵٬۳۰۰٬۰۰۰'],
    zebra: true
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const ed = ctx.editable;
    const wrap = createElement('div.b-table');
    const table = createElement('table');
    if (d.caption) table.appendChild(createElement('caption', { text: d.caption, ...(ed?{'data-edit':'caption'}:{}) }));
    if (!d.zebra) table.classList.add('no-zebra');

    const thead = createElement('thead');
    const htr = createElement('tr');
    (d.headers || []).forEach((h,c)=>{
      const cfg=d.columnConfigs?.[c]||{},aggregate=cfg.aggregate||((d.sumColumns||[]).includes(c)?'sum':'none');
      const th=createElement('th',{...(!ed&&!(d.merges||[]).length?{'data-sort':c,tabindex:'0',role:'columnheader','aria-sort':'none',title:'مرتب‌سازی'}:{}),'data-column-type':cfg.type||'text','data-column-formula':cfg.formula||'','data-column-aggregate':aggregate});
      if(ed)th.appendChild(createElement('span.table-cell-editor',{text:h,'data-edit':'headers.'+c}));else th.textContent=h;htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = createElement('tbody');
    (d.rows || []).forEach((row, r) => {
      const tr = createElement('tr');
      row.forEach((cell,c)=>{
        const cfg=d.columnConfigs?.[c]||{},calculated=cfg.type==='formula';
        const td=createElement('td',calculated?{'data-calculated':'true','data-formula':cfg.formula||''}:{});const value=displayTableCell(d,row,c,ctx.doc?.lang);
        if(ed&&!calculated)td.appendChild(createElement('span.table-cell-editor',{text:value,'data-edit':`rows.${r}.${c}`}));else td.textContent=value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    if (d.hasFooter && Array.isArray(d.footerRow) && d.footerRow.length) {
      const tfoot = createElement('tfoot');
      const ftr = createElement('tr');
      smartFooter(d,ctx.doc?.lang).forEach((cell,c)=>{const op=d.columnConfigs?.[c]?.aggregate||((d.sumColumns||[]).includes(c)?'sum':'none');const td=createElement('td',op!=='none'?{'data-aggregate':op}:{});if(ed&&op==='none')td.appendChild(createElement('span.table-cell-editor',{text:cell,'data-edit':'footerRow.'+c}));else td.textContent=cell;ftr.appendChild(td);});
      tfoot.appendChild(ftr);
      table.appendChild(tfoot);
    }
    renderMerges(table,d);
    if (!d.zebra) wrap.classList.add('no-zebra');
    wrap.appendChild(table);

    if (!ed) {
      // مرتب‌سازی ساده در حالت نمایش/ارائه
      let asc = true;
      thead.querySelectorAll('th[data-sort]').forEach((th) => {
        const sort = () => {
          if(table.dataset.hasMerges)return;
          const c = Number(th.dataset.sort);
          const rows = Array.from(tbody.querySelectorAll('tr'));
          rows.sort((a, b) => {
            const av = a.children[c]?.textContent || '';
            const bv = b.children[c]?.textContent || '';
            const an = numeric(av); const bn = numeric(bv);
            const res = (an !== null && bn !== null) ? an - bn : av.localeCompare(bv, 'fa');
            return asc ? res : -res;
          });
          thead.querySelectorAll('th[data-sort]').forEach(h=>h.setAttribute('aria-sort','none'));
          th.setAttribute('aria-sort',asc?'ascending':'descending');
          asc = !asc;
          rows.forEach((r) => tbody.appendChild(r));
        };
        th.addEventListener('click', sort);
        th.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sort();}});
      });
    }
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const covered=(section,r,c)=>(d.merges||[]).some(m=>m.section===section&&r>=m.r1&&r<=m.r2&&c>=m.c1&&c<=m.c2&&(r!==m.r1||c!==m.c1));
    const mergedColumn=(section,c)=>(d.merges||[]).some(m=>m.section===section&&c>=m.c1&&c<=m.c2);
    const cellInput = (value, onInput, extra = {}) => createElement('input.input', {
      value, dir: 'auto', ...extra,
      oninput: (e) => { if(api.doc?.lang==='fa'&&!e.isComposing){const next=persianDigits(e.target.value);if(next!==e.target.value){const start=e.target.selectionStart,end=e.target.selectionEnd,dir=e.target.selectionDirection;e.target.value=next;if(start!=null)e.target.setSelectionRange(start,end,dir);}}onInput(e.target.value); api.rerender(); },
      oncompositionend: e=>{if(api.doc?.lang==='fa')e.target.dispatchEvent(new Event('input',{bubbles:true}));},
      onchange: () => api.commit()
    });

    const headerInputs = createElement('div.mini-list');
    d.headers.forEach((h, i) => headerInputs.appendChild(createElement('div.mini-item', {}, [
      cellInput(h, (v) => { d.headers[i] = v; }, {disabled:covered('head',0,i)}),
      createElement('button.icon-btn', {
        title: L('حذف ستون','Delete column'),
        onclick: () => {
          if (!deleteTableColumn(api.doc,block,i)) return;
          api.rerender(); api.commit(); api.refresh();
        }
      }, '✕')
    ])));

    headerInputs.classList.add('table-panel-fields');
    const rowWrap = createElement('div.mini-list.table-panel-rows');
    d.rows.forEach((row, r) => {
      rowWrap.appendChild(createElement('div.mini-item', {}, [
        ...row.map((cell, c) => cellInput(cell, (v) => { d.rows[r][c] = v; }, { style: { minWidth: '0' },disabled:covered('body',r,c) })),
        createElement('button.icon-btn', { title: L('حذف سطر','Delete row'), onclick: () => { deleteTableRow(block,r); api.rerender(); api.commit(); api.refresh(); } }, '🗑')
      ]));
    });

    return [
      api.group(t('prop.content'), [
        api.text(L('عنوان جدول (caption)','Table caption'), d.caption, (v) => { d.caption = v; api.rerender(); }),
        createElement('p.hint',{text:L('خانه را انتخاب و برای ویرایش F2 بزنید یا دوبار کلیک کنید. +‌ها روی مرزها و حذف و انتخاب محدوده در نوار بالای جدول‌اند.','Select a cell and press F2 or double-click to edit. Insert controls are on cell borders; delete and selection controls are above the table.')}),
        createElement('h4', { text: L('ستون\u200cها','Columns'), style: { fontSize: '.68rem', color: 'var(--muted)', margin: '.3rem 0' } }),
        headerInputs,
        createElement('details.table-types',{},[createElement('summary',{text:L('نوع و محاسبات ستون‌ها','Column types & calculations')}),createElement('p.hint',{text:L('فرمول ردیفی با حروف ستون‌ها: A*B یا A*B*(1-C/100). از + − × ÷ و پرانتز استفاده کنید؛ خطا و ارجاع دوری نمایش داده می‌شود.','Same-row formulas: A*B or A*B*(1-C/100), using + - * / and parentheses. Invalid or cyclic formulas show an error.')}),...d.headers.map((h,i)=>{
          const config=d.columnConfigs?.[i]||{},letter=(()=>{let n=i+1,r='';while(n){n--;r=String.fromCharCode(65+n%26)+r;n=Math.floor(n/26);}return r;})();const type=createElement('select.select',{'aria-label':L('نوع ستون ','Column type ')+letter});[['text',L('متن','Text')],['number',L('عدد','Number')],['currency',L('مبلغ','Currency')],['percent',L('درصد','Percent')],['formula',L('فرمول ردیفی','Row formula')]].forEach(([value,text])=>type.appendChild(createElement('option',{value,text})));type.value=config.type||'text';if(mergedColumn('body',i))type.querySelector('option[value=formula]').disabled=true;
          const agg=createElement('select.select',{'aria-label':L('عملیات ستون ','Column aggregate ')+letter});[['none',L('بدون جمع','No calculation')],['sum',L('جمع','Sum')],['avg',L('میانگین','Average')],['min',L('کمینه','Minimum')],['max',L('بیشینه','Maximum')]].forEach(([value,text])=>agg.appendChild(createElement('option',{value,text})));agg.value=config.aggregate||((d.sumColumns||[]).includes(i)?'sum':'none');if(mergedColumn('foot',i))Array.from(agg.options).filter(x=>x.value!=='none').forEach(x=>x.disabled=true);
          const ensure=()=>{d.columnConfigs ||= [];d.columnConfigs[i] ||= {};return d.columnConfigs[i];};
          type.addEventListener('change',()=>{ensure().type=type.value;api.rerender();api.commit();api.refresh();document.querySelector('.table-types')?.setAttribute('open','');});agg.addEventListener('change',()=>{ensure().aggregate=agg.value;d.sumColumns=(d.sumColumns||[]).filter(x=>x!==i);api.rerender();api.commit();api.refresh();document.querySelector('.table-types')?.setAttribute('open','');});
          const formula=createElement('input.input',{value:config.formula||'',dir:'ltr','aria-label':L('فرمول ستون ','Column formula ')+letter,placeholder:'A*B'});formula.addEventListener('input',()=>{ensure().formula=formula.value;api.rerender();});formula.addEventListener('change',()=>api.commit());
          return createElement('div.column-type-card',{},[createElement('strong',{text:letter+' · '+h}),type,agg,config.type==='formula'?formula:null]);
        })]),
        api.button(L('+ افزودن ستون','+ Add column'), () => {
          d.headers.push(api.doc?.lang==='en'?'Column':'ستون');
          d.rows.forEach((r) => r.push('—'));
          if (d.footerRow) d.footerRow.push('—');
          api.rerender(); api.commit(); api.refresh();
        }),
        createElement('h4', { text: L('سطرها','Rows'), style: { fontSize: '.68rem', color: 'var(--muted)', margin: '.6rem 0 .3rem' } }),
        createElement('div.table-panel-rows-scroll',{},[rowWrap]),
        api.button(L('+ افزودن سطر','+ Add row'), () => {
          d.rows.push(d.headers.map(() => '—'));
          api.rerender(); api.commit(); api.refresh();
        }),
        api.switch(L('نوارهای زبرا','Striped rows'), d.zebra, (v) => { d.zebra = v; api.rerender(); api.commit(); }),
        api.switch(L('سطر جمع/پاورقی','Total / footer row'), d.hasFooter, (v) => {
          d.hasFooter = v;
          if (v && !Array.isArray(d.footerRow)) d.footerRow = d.headers.map(() => '—');
          api.rerender(); api.commit(); api.refresh();
        }),
        d.hasFooter ? createElement('div', {}, [
          createElement('p.hint', { text:getLang()==='en'?'Auto-sum numeric columns (invalid cells are ignored)':L('جمع خودکار ستون\u200cهای عددی (سلول\u200cهای غیرعددی نادیده گرفته می\u200cشوند)','Sum numeric columns automatically (non-numeric cells are ignored)') }),
          ...d.headers.map((h,i)=>{const cb=createElement('input',{type:'checkbox','aria-label':h});cb.disabled=mergedColumn('foot',i);cb.checked=(d.columnConfigs?.[i]?.aggregate||((d.sumColumns||[]).includes(i)?'sum':'none'))==='sum';cb.addEventListener('change',()=>{d.sumColumns=(d.sumColumns||[]).filter(c=>c!==i);if(cb.checked)d.sumColumns.push(i);if(d.columnConfigs?.[i])d.columnConfigs[i].aggregate=cb.checked?'sum':'none';api.rerender();api.commit();});return createElement('label.switch',{},[cb,h]);})
        ]) : null,
        d.hasFooter ? createElement('div.mini-item', {}, d.footerRow.map((cell, c) => cellInput(cell, (v) => { d.footerRow[c] = v; }, { disabled:covered('foot',0,c)||(d.columnConfigs?.[c]?.aggregate||((d.sumColumns||[]).includes(c)?'sum':'none'))!=='none' }))) : null
      ].filter(Boolean))
    ];
  }
};
export default def;
