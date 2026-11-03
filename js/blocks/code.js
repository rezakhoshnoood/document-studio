/* blocks/code.js — بلوک کد با هایلایت ساده و کپی */
import { createElement } from '../core/dom.js';
import { t, getLang } from '../core/i18n.js';

const LANGS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'text', label: 'متن ساده' }
];

const KW = /\b(const|let|var|function|return|if|else|for|while|class|new|import|export|from|default|await|async|try|catch|throw|switch|case|break|continue|typeof|instanceof|this|super|extends|static|get|set|def|elif|None|True|False|and|or|not|in|is|lambda|with|as|pass|echo|cd|sudo|npm|git)\b/;
const TOKEN = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|class|new|import|export|from|default|await|async|try|catch|throw|switch|case|break|continue|typeof|this|super|extends|static|def|elif|None|True|False|and|or|not|in|is|lambda|with|as|pass|echo|npm|git)\b)/g;

export function highlight(code = '', lang = 'javascript') {
  const safe = String(code)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (lang === 'text') return safe;
  return safe.replace(TOKEN, (m, comment, str, n, kw) => {
    if (comment) return `<span class="tok-com">${m}</span>`;
    if (str) return `<span class="tok-str">${m}</span>`;
    if (n) return `<span class="tok-num">${m}</span>`;
    if (kw) return `<span class="tok-kw">${m}</span>`;
    return m;
  });
}

const def = {
  type: 'code',
  icon: '💻',
  labelKey: 'block.code',
  createData: () => ({
    language: 'javascript',
    code: '// نمونه کد\nconst studio = new DocumentStudio({\n  name: "سندساز هوشمند",\n  theme: "modern-blue"\n});\nstudio.export("html");',
    filename: 'example.js'
  }),
  render(block, ctx = {}) {
    const d = block.data;
    const wrap = createElement('div.b-code');
    const head = createElement('div.code-head', {}, [
      createElement('span', { text: d.filename || (d.language || 'code') }),
      createElement('button.btn.btn-sm.js-copy', {
        type: 'button', 'data-code': d.code || '', style: { padding: '1px 7px', fontSize: '.62rem', background: 'transparent', border: '1px solid #2c3450', color: '#8a93b0' }
      }, ctx.doc?.lang === 'en' ? '⧉ Copy' : '⧉ کپی')
    ]);
    wrap.appendChild(head);
    wrap.appendChild(createElement('pre', { html: `<code class="lang-${d.language}">${highlight(d.code || '', d.language)}</code>` }));
    return wrap;
  },
  renderProps(block, api) {
    const L = (fa,en) => getLang()==='en'?en:fa;
    const d = block.data;
    return [api.group(t('prop.content'), [
      api.select(L('زبان','Language'), d.language, LANGS, (v) => { d.language = v; api.rerender(); api.commit(); }),
      api.text(L('نام فایل','Filename'), d.filename, (v) => { d.filename = v; api.rerender(); }),
      api.text(L('کد','Code'), d.code, (v) => { d.code = v; api.rerender(); }, { multiline: true, dir: 'ltr' })
    ])];
  }
};
export default def;
