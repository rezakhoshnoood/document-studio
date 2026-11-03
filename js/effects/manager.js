/* effects/manager.js — مدیریت init/start/stop همه افکت‌های پس‌زمینه */
import { createExtra } from './extra.js';
import { createInteraction } from './interaction.js';
import * as particles from './particles.js';
import * as bubbles from './bubbles.js';
import * as orbit from './orbit.js';
import * as waves from './waves.js';
import * as matrix from './matrix.js';
import * as gradientFlow from './gradient-flow.js';

export const EFFECTS = [
  { id: 'none', label: { fa: 'بدون انیمیشن', en: 'None' }, icon: '◻' },
  { id: 'particles', label: { fa: 'ذرات', en: 'Particles' }, icon: '✨' },
  { id: 'bubbles', label: { fa: 'حباب', en: 'Bubbles' }, icon: '🫧' },
  { id: 'orbit', label: { fa: 'مداری', en: 'Orbit' }, icon: '🪐' },
  { id: 'waves', label: { fa: 'موج', en: 'Waves' }, icon: '🌊' },
  { id: 'matrix', label: { fa: 'ماتریکس', en: 'Matrix' }, icon: '🟩' },
  { id:'stars',label:{fa:'آسمان ستاره‌ای',en:'Starfield'},icon:'✦' },
  { id:'fireflies',label:{fa:'کرم شب‌تاب',en:'Fireflies'},icon:'✧' },
  { id:'snow',label:{fa:'برف آرام',en:'Snowfall'},icon:'❄' },
  { id:'rain',label:{fa:'باران',en:'Rain'},icon:'☔' },
  { id: 'gradient-flow', label: { fa: 'گرادیان متحرک', en: 'Gradient flow' }, icon: '🎨' }
];

const FACTORIES = { particles, bubbles, orbit, waves, matrix, 'gradient-flow': gradientFlow, ...Object.fromEntries(['stars','fireflies','snow','rain'].map(id=>[id,{create:(canvas,opts)=>createExtra(canvas,opts,id)}])) };
export const effectLabel = (id, lang = 'fa') => {
  const e = EFFECTS.find((x) => x.id === id);
  return e ? e.label[lang] || e.label.fa : id;
};

export class BackgroundManager {
  constructor(canvas) {
    this.canvas = canvas || document.getElementById('bg-canvas');
    this.current = null;
    this.interaction = null;
    this.name = 'none';
    this.opts = { color: '#4f8cff', opacity: 0.55 };
    this._onVisibility = this._onVisibility.bind(this);
    document.addEventListener('visibilitychange', this._onVisibility);
  }
  set(name = 'particles', opts = {}) {
    this.opts = { ...this.opts, ...opts };
    this._applyCssVars();
    if (this.name === name && this.current && !opts.force && !('interactive' in opts) && !('color' in opts)) return this.current;
    this.stop();
    this.name = name;
    document.body.dataset.effect = name === 'none' ? 'none' : name;
    if (name === 'none' || !FACTORIES[name] || !this.canvas) return null;
    try {
      this.current = FACTORIES[name].create(this.canvas, this.opts);
      this.current.start();
      if(this.opts.interactive && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.interaction=createInteraction(this.canvas.parentElement||document.body,this.opts.color,this.opts.opacity);
    } catch (err) {
      console.warn('[bg effect]', name, err);
      this.current = null;
    }
    return this.current;
  }
  update(opts = {}) {
    const colorChanged = opts.color && opts.color !== this.opts.color;
    this.opts = { ...this.opts, ...opts };
    this._applyCssVars();
    if (colorChanged && this.name !== 'none' && this.name !== 'gradient-flow') {
      this.set(this.name, { ...this.opts, force: true });
    }
  }
  stop() {
    if(this.interaction){this.interaction.destroy();this.interaction=null;}
    if (this.current) {
      try { this.current.stop(); this.current.destroy && this.current.destroy(); } catch (_) {}
      this.current = null;
    }
  }
  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this._onVisibility);
  }
  _applyCssVars() {
    const root = document.documentElement;
    root.style.setProperty('--fx-opacity', String(this.opts.opacity ?? 0.55));
    root.style.setProperty('--fx-color', this.opts.color || '#4f8cff');
  }
  _onVisibility() {
    if (!this.current) return;
    if (document.hidden) this.current.stop();
    else { try { this.current.start(); } catch (_) {} }
  }
}

let _instance = null;
export function getBg(canvas) {
  if (!_instance) _instance = new BackgroundManager(canvas);
  return _instance;
}
/* API تنبل — تا زمانی که در مرورگر اجرا نشده چیزی ساخته نمی‌شود */
export const bg = {
  set: (name, opts) => getBg().set(name, opts),
  update: (opts) => getBg().update(opts),
  stop: () => getBg().stop(),
  destroy: () => { if (_instance) _instance.destroy(); _instance = null; },
  get instance() { return getBg(); },
  get name() { return _instance ? _instance.name : 'none'; }
};
export default bg;
