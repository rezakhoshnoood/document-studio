/* blocks/chart.js — بلوک نمودار (رندر SVG خودکفا؛ بدون وابستگی خارجی) */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';
import { numeric } from '../core/numbers.js';
import {tableValue} from '../core/table-math.js';

export const PALETTE = ['#4f8cff', '#6c5ce7', '#16c79a', '#f5a524', '#ff5c73', '#22d3ee', '#a855f7'];
const TYPES = [
  { value: 'bar', label: 'ستونی (bar)' },
  { value: 'line', label: 'خطی (line)' },
  { value: 'pie', label: 'دایره‌ای (pie)' },
  { value: 'doughnut', label: 'حلقه‌ای (doughnut)' },
  { value: 'radar', label: 'رادار (radar)' }
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v) => numeric(v) ?? 0;
const fmt = (n) => {
  const r = Math.round(n * 100) / 100;
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '،');
};

export function chartLegend(cfg) {
  if (cfg.chartType === 'pie' || cfg.chartType === 'doughnut') {
    return cfg.labels.map((l, i) => ({ label: l, color: PALETTE[i % PALETTE.length] }));
  }
  return (cfg.datasets || []).map((ds, i) => ({ label: ds.label, color: ds.color || PALETTE[i % PALETTE.length] }));
}

/** ساخت SVG نمودار — مستقل از کتابخانه خارجی */
export function buildChartSVG(cfg, { width = 700, height = 330, animate = false, lang = 'fa' } = {}) {
  const fmt = n => String(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, lang==='en' ? ',' : '،');
  const type = cfg.chartType || 'bar';
  const labels = (cfg.labels || []).map(String);
  const datasets = (cfg.datasets && cfg.datasets.length ? cfg.datasets : [{ label: 'Series 1', data: [] }])
    .map((ds, i) => ({ label: ds.label || 'Series ' + (i + 1), data: (ds.data || []).map(num), color: ds.color || PALETTE[i % PALETTE.length] }));
  const W = width, H = height;

  if (type === 'pie' || type === 'doughnut') {
    const data = datasets[0].data;
    const total = data.reduce((a, b) => a + Math.max(b, 0), 0) || 1;
    const cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) / 2 - 26;
    const inner = type === 'doughnut' ? R * 0.55 : 0;
    let acc = -Math.PI / 2;
    const parts = [];
    data.forEach((v, i) => {
      const frac = Math.max(v, 0) / total;
      const a0 = acc, a1 = acc + frac * Math.PI * 2;
      acc = a1;
      const color = PALETTE[i % PALETTE.length];
      const large = frac > 0.5 ? 1 : 0;
      if (frac <= 0) return;
      if (frac >= 0.999999) {
        parts.push(inner > 0 ? `<circle cx="${cx}" cy="${cy}" r="${(R+inner)/2}" fill="none" stroke="${color}" stroke-width="${R-inner}"/>` : `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${color}"/>`);
        return;
      }
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      let d;
      if (inner > 0) {
        const ix0 = cx + inner * Math.cos(a1), iy0 = cy + inner * Math.sin(a1);
        const ix1 = cx + inner * Math.cos(a0), iy1 = cy + inner * Math.sin(a0);
        d = `M${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${ix0.toFixed(2)},${iy0.toFixed(2)} A${inner},${inner} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
      } else {
        d = `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
      }
      const pct = Math.round(frac * 100);
      const mid = (a0 + a1) / 2;
      const lx = cx + (R * 0.66) * Math.cos(mid), ly = cy + (R * 0.66) * Math.sin(mid);
      parts.push(`<path d="${d}" fill="${color}">${animate ? `<animate attributeName="opacity" from="0" to="1" dur="0.7s" begin="${(i * 0.12).toFixed(2)}s" fill="freeze"/>` : ''}</path>`);
      if (frac > 0.06) parts.push(`<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${pct}%</text>`);
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || 'chart')}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}${
      inner > 0 ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="15" font-weight="800" fill="#334">${esc(fmt(total))}</text>` : ''
    }</svg>`;
  }

  if (type === 'radar') {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 42;
    const n = Math.max(labels.length, 3);
    const max = Math.max(1, ...datasets.flatMap((d) => d.data));
    const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const rings = [0.25, 0.5, 0.75, 1].map((f) => {
      const pts = Array.from({ length: n }, (_, i) => `${(cx + R * f * Math.cos(angle(i))).toFixed(1)},${(cy + R * f * Math.sin(angle(i))).toFixed(1)}`).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#e3e8f1" stroke-width="1"/>`;
    }).join('');
    const axes = Array.from({ length: n }, (_, i) =>
      `<line x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(angle(i))).toFixed(1)}" y2="${(cy + R * Math.sin(angle(i))).toFixed(1)}" stroke="#e3e8f1"/>`).join('');
    const labelEls = labels.map((l, i) => {
      if(i % Math.max(1,Math.ceil(labels.length/10)))return '';
      const x = cx + (R + 18) * Math.cos(angle(i));
      const y = cy + (R + 18) * Math.sin(angle(i)) + 4;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#667">${esc(l)}</text>`;
    }).join('');
    const polys = datasets.map((ds, di) => {
      const pts = Array.from({ length: n }, (_, i) => {
        const v = ds.data[i] ?? 0;
        const r = (Math.max(v, 0) / max) * R;
        return `${(cx + r * Math.cos(angle(i))).toFixed(1)},${(cy + r * Math.sin(angle(i))).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${ds.color}" fill-opacity="0.22" stroke="${ds.color}" stroke-width="2"/>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${rings}${axes}${polys}${labelEls}</svg>`;
  }

  /* cartesian: bar / line */
  const axisText=Math.max(...datasets.flatMap(d=>d.data).map(v=>fmt(v).length),1);const padL=Math.min(165,Math.max(54,axisText*7+12)), padR = 16, padT = 16, padB = 40;
  const cw = W - padL - padR, ch = H - padT - padB;
  const values = datasets.flatMap(d => d.data);
  const max = Math.max(0, ...values), min = Math.min(0, ...values);
  const high = max > 0 ? niceCeil(max) : 0;
  const low = min < 0 ? -niceCeil(-min) : 0;
  const range = high - low || 1;
  const gridLines = 4;
  const y = (v) => padT + ((high - v) / range) * ch;
  const zeroY = y(0);
  const grid = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = low + (range / gridLines) * i;
    const yy = y(val).toFixed(1);
    return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="#b8c5d9" stroke-width="1"/>` +
      `<text x="${padL - 8}" y="${(Number(yy) + 3.5).toFixed(1)}" text-anchor="end" font-size="10" fill="#96a7bf">${fmt(val)}</text>`;
  }).join('');

  const slot = cw / Math.max(labels.length, 1);
  const labelStep=Math.max(1,Math.ceil(labels.length/Math.max(1,Math.floor(cw/80))));
  const xLabels = labels.map((l, i) => i%labelStep?'':
    `<text x="${(padL + slot * i + slot / 2).toFixed(1)}" y="${H - 14}" text-anchor="middle" font-size="10.5" fill="#667">${esc(l.length>13?l.slice(0,12)+'…':l)}</text>`
  ).join('');

  let series = '';
  if (type === 'bar') {
    const groupW = slot * 0.62;
    const barW = Math.max(4, groupW / datasets.length - 3);
    series = datasets.map((ds, di) => ds.data.map((v, i) => {
      const h = Math.abs(y(v) - zeroY);
      const x = padL + slot * i + (slot - groupW) / 2 + di * (barW + 3);
      const yy = Math.min(y(v), zeroY);
      const anim = animate ? `<animate attributeName="height" from="0" to="${h.toFixed(1)}" dur="0.8s" begin="${(i * 0.06).toFixed(2)}s" fill="freeze"/><animate attributeName="y" from="${zeroY.toFixed(1)}" to="${yy.toFixed(1)}" dur="0.8s" begin="${(i * 0.06).toFixed(2)}s" fill="freeze"/>` : '';
      return `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${ds.color}">${anim}</rect>`;
    }).join('')).join('');
  } else if (type === 'line') {
    series = datasets.map((ds) => {
      const pts = ds.data.map((v, i) => [padL + slot * i + slot / 2, y(v)]);
      if (!pts.length) return '';
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${zeroY.toFixed(1)} L${pts[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;
      const dots = pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${ds.color}" stroke-width="2"/>`).join('');
      const anim = animate ? `<animate attributeName="opacity" from="0" to="1" dur="0.9s" fill="freeze"/>` : '';
      return `<path d="${area}" fill="${ds.color}" fill-opacity="0.12" ${anim}></path>` +
        `<path d="${line}" fill="none" stroke="${ds.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${anim}></path>` + dots;
    }).join('');
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title || 'chart')}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${W}" height="${H}" fill="none"/>
    ${grid}
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + ch}" stroke="#d6dde8"/>
    ${series}
    ${xLabels}
  </svg>`;
}
function niceCeil(v) {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))));
  const n = Math.ceil((v / pow) * 2) / 2 * pow;
  return n > 0 ? n : 1;
}

export function resolveChartData(d, doc) {
  const L=(fa,en)=>doc?.lang==='en'?en:fa;
  if (!d.source || !d.source.tableId) { const negative=(d.datasets||[]).some(x=>(x.data||[]).some(v=>(numeric(v)??0)<0)); return { data:d, errors:negative && ['pie','doughnut','radar'].includes(d.chartType) ? [L('این نوع نمودار مقدار منفی را پشتیبانی نمی‌کند.','This chart type does not support negative values.')] : [] }; }
  const table=(doc?.blocks || []).find(b=>b.id===d.source.tableId && b.type==='table');
  if (!table) return {data:{...d, labels:[], datasets:[]},errors:[L('جدول منبع پیدا نشد؛ دوباره انتخاب کنید.','Source table not found; select it again.')]};
  const td=table.data, labels=[], errors=[];
  const labelCol=Number(d.source.labelCol ?? 0), cols=Array.isArray(d.source.valueCols)?d.source.valueCols.map(Number):[];
  if (labelCol < 0 || labelCol >= td.headers.length) return {data:{...d,labels:[],datasets:[]},errors:[L('ستون برچسب حذف شده؛ یک ستون جدید انتخاب کنید.','The label column was removed; select another.')]};
  if (cols.some(c=>c<0 || c>=td.headers.length)) return {data:{...d,labels:[],datasets:[]},errors:[L('ستون مقدار پیدا نشد؛ دوباره انتخاب کنید.','A value column was not found; select it again.')]};
  if (!cols.length) return {data:{...d,labels:[],datasets:[]},errors:[L('حداقل یک ستون مقدار انتخاب کنید.','Select at least one value column.')]};
  const datasets=cols.map((c,i)=>({label:td.headers[c] || L('ستون ','Column ')+(c+1),color:PALETTE[i%PALETTE.length],data:[]}));
  (td.rows||[]).forEach((row,ri)=>{
    labels.push(String(row[labelCol] ?? ''));
    cols.forEach((c,i)=>{
      const value=tableValue(td,row,c);
      if (value===null) errors.push(L(`سطر ${ri+1}، ${td.headers[c] || 'ستون '+(c+1)}: مقدار عددی معتبر نیست`,`Row ${ri+1}, ${td.headers[c] || 'Column '+(c+1)}: invalid number`));
      datasets[i].data.push(value ?? 0);
    });
  });
  if ((d.chartType==='pie' || d.chartType==='doughnut' || d.chartType==='radar') && datasets.some(x=>x.data.some(v=>v<0))) errors.push(L('این نوع نمودار مقدار منفی را پشتیبانی نمی‌کند.','This chart type does not support negative values.'));
  return {data:{...d,labels,datasets},errors};
}

const def = {
  type: 'chart',
  icon: '📈',
  labelKey: 'block.chart',
  createData: () => ({
    chartType: 'bar',
    title: 'نمودار فروش ماهانه',
    labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
    datasets: [{ label: 'فروش', data: [12, 19, 14, 25, 22, 30], color: '#4f8cff' }]
  }),
  render(block, ctx = {}) {
    const result = resolveChartData(block.data, ctx.doc);
    const d = result.data;
    const wrap = createElement('div.b-chart');
    if (result.errors.length) { wrap.appendChild(createElement('p.chart-error', { role:'alert', text:result.errors.slice(0,3).join(' | ') })); return wrap; }
    if (d.title) wrap.appendChild(createElement('div.chart-title', { text: d.title, ...(ctx.editable?{'data-edit':'title'}:{}) }));
    const holder = createElement('div.chart-wrap', { html: buildChartSVG(d, { animate: !!ctx.animateCharts, lang:ctx.doc?.lang||'fa' }) });
    wrap.appendChild(holder);
    const legend = chartLegend(d);
    if (legend.length) {
      const lg = createElement('div.legend');
      legend.forEach((item) => lg.appendChild(createElement('span', {
        html: `<i style="background:${item.color}"></i>${esc(item.label)}`
      })));
      wrap.appendChild(lg);
    }
    const detail=createElement('details.chart-data');
    detail.appendChild(createElement('summary',{text:ctx.doc?.lang==='en'?'Chart data':'داده‌های نمودار'}));
    const tbl=createElement('table');
    const head=createElement('tr'); [ctx.doc?.lang==='en'?'Label':'برچسب',...d.datasets.map(ds=>ds.label)].forEach(v=>head.appendChild(createElement('th',{text:v})));
    const thead=createElement('thead');thead.appendChild(head);tbl.appendChild(thead);
    const body=createElement('tbody'); (d.labels||[]).forEach((label,i)=>{const tr=createElement('tr');[label,...d.datasets.map(ds=>ds.data[i] ?? '')].forEach(v=>tr.appendChild(createElement('td',{text:String(v)})));body.appendChild(tr)});tbl.appendChild(body);detail.appendChild(tbl);wrap.appendChild(detail);
    wrap.dataset.chart = JSON.stringify(d);
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    const labelsBox = createElement('div.mini-list');
    d.labels.forEach((l, i) => labelsBox.appendChild(createElement('div.mini-item', {}, [
      createElement('input.input', {
        value: l, dir: 'auto',
        oninput: (e) => { d.labels[i] = e.target.value; api.rerender(); },
        onchange: () => api.commit()
      }),
      createElement('button.icon-btn', { onclick: () => { d.labels.splice(i, 1); d.datasets.forEach((ds) => ds.data.splice(i, 1)); api.rerender(); api.commit(); api.refresh(); } }, '✕')
    ])));

    const dsBox = createElement('div.mini-list');
    d.datasets.forEach((ds, di) => {
      const head = createElement('div.mini-item', {}, [
        createElement('input.input', {
          value: ds.label, placeholder: L('نام سری','Series name'),
          oninput: (e) => { ds.label = e.target.value; api.rerender(); },
          onchange: () => api.commit()
        }),
        createElement('input', {
          type: 'color', value: ds.color || PALETTE[di % PALETTE.length], style: { width: '34px', flex: '0 0 auto' },
          oninput: (e) => { ds.color = e.target.value; api.rerender(); }
        }),
        createElement('button.icon-btn', { onclick: () => { if (d.datasets.length > 1) { d.datasets.splice(di, 1); api.rerender(); api.commit(); api.refresh(); } } }, '✕')
      ]);
      const vals = createElement('div', {}, d.labels.map((label, i) => createElement('div.mini-item', {}, [
        createElement('span', {text:label || ('#'+(i+1)),style:{fontSize:'.72rem',minWidth:'70px'}}),
        createElement('input.input', { type:'number', step:'any', value:ds.data[i] ?? 0, 'aria-label':ds.label+' / '+label, oninput:(e)=>{ds.data[i]=Number(e.target.value);api.rerender();}, onchange:()=>api.commit() })
      ])));
      dsBox.append(head, vals);
    });

    const dataArea = createElement('div.field', {}, [
      createElement('label', { text: L('داده\u200cهای سری اول (سریع)','First series values') }),
      createElement('input.input', {
        value: d.datasets[0].data.join(', '), dir: 'ltr', placeholder: '12, 19, 14',
        onchange: (e) => {
          const arr = e.target.value.split(/[,،\s]+/).filter(Boolean).map(Number);
          d.datasets[0].data = arr;
          while (d.labels.length < arr.length) d.labels.push(L('مورد ','Item ') + (d.labels.length + 1));
          api.rerender(); api.commit();
        }
      })
    ]);

    const en = getLang()==='en';
    const tables=(api.doc?.blocks||[]).filter(x=>x.type==='table');
    const sourceOptions=[{value:'',label:en?'Manual data':L('داده دستی','Manual data')},...tables.map((x,i)=>({value:x.id,label:x.data.caption||('Table '+(i+1))}))];
    if (d.source?.tableId && !tables.some(x=>x.id===d.source.tableId)) sourceOptions.push({value:d.source.tableId,label:en?'Missing table':L('جدول حذف شده','Table deleted')});
    const selectedTable=tables.find(x=>x.id===d.source?.tableId);
    const sourceFields=[api.select(en?'Data source':L('منبع داده','Data source'), d.source?.tableId || '', sourceOptions, value=>{d.source=value?{tableId:value,labelCol:0,valueCols:[1]}:null;api.rerender();api.commit();api.refresh();})];
    if (selectedTable) {
      const cols=(selectedTable.data.headers||[]).map((h,i)=>({value:String(i),label:h||('Column '+(i+1))}));
      sourceFields.push(api.select(en?'Labels column':L('ستون برچسب\u200cها','Label column'),String(d.source.labelCol ?? 0),[{value:'-1',label:en?'Choose a column':L('انتخاب ستون','Choose a column')},...cols],value=>{d.source.labelCol=Number(value);api.rerender();api.commit();}));
      sourceFields.push(createElement('p.hint',{text:en?'Value columns (numeric)':L('ستون\u200cهای مقدار (عددی)','Value columns (numeric)')}));
      cols.forEach((col,i)=>{
        const checkbox=createElement('input',{type:'checkbox','aria-label':col.label});checkbox.checked=(d.source.valueCols||[]).includes(i);
        checkbox.addEventListener('change',()=>{let list=(d.source.valueCols||[]).filter(n=>n!==i);if(checkbox.checked)list.push(i);d.source.valueCols=list.sort((a,b)=>a-b);api.rerender();api.commit();});
        sourceFields.push(createElement('label.switch',{},[checkbox,col.label]));
      });
    }
    const linked=!!d.source?.tableId;
    return [
      api.group(t('prop.content'), [
        api.text(L('عنوان نمودار','Chart title'), d.title, (v) => { d.title = v; api.rerender(); }),
        api.select(L('نوع نمودار','Chart type'), d.chartType, TYPES.map((g,i)=>({...g,label:getLang()==='en'?['Bar','Line','Pie','Doughnut','Radar'][i]:g.label})), (v) => { d.chartType = v; api.rerender(); api.commit(); }),
        ...sourceFields,
        linked ? createElement('p.hint',{text:en?'Values are updated from the source table.':L('مقدارها از جدول منبع به\u200cروزرسانی می\u200cشوند.','Values update from the source table.')}) : dataArea,
        linked ? null : createElement('h4', { text: L('برچسب\u200cها','Labels'), style: { fontSize: '.68rem', color: 'var(--muted)', margin: '.4rem 0 .3rem' } }),
        linked ? null : labelsBox,
        linked ? null : api.button(L('+ برچسب','+ Label'), () => { d.labels.push(L('برچسب','Label')); d.datasets.forEach((ds) => ds.data.push(0)); api.rerender(); api.commit(); api.refresh(); }),
        linked ? null : createElement('h4', { text: L('سری داده\u200cها','Data series'), style: { fontSize: '.68rem', color: 'var(--muted)', margin: '.6rem 0 .3rem' } }),
        linked ? null : dsBox,
        linked ? null : api.button(L('+ سری داده','+ Add series'), () => {
          d.datasets.push({ label: L('سری ','Series ') + (d.datasets.length + 1), data: d.labels.map(() => 0), color: PALETTE[d.datasets.length % PALETTE.length] });
          api.rerender(); api.commit(); api.refresh();
        })
      ])
    ];
  }
};
export default def;
