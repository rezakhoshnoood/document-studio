/* effects/gradient-flow.js — گرادیان متحرک (CSS-based، سبک‌ترین افکت) */
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.id = 'gradient-flow-style';
  style.textContent = `
  body[data-effect="gradient-flow"] #bg-canvas{display:none}
  body[data-effect="gradient-flow"]::before{
    content:'';position:fixed;inset:-20%;z-index:0;pointer-events:none;opacity:var(--fx-opacity,.55);
    background:
      radial-gradient(closest-side at 30% 30%, color-mix(in srgb, var(--fx-color,#4f8cff) 60%, transparent), transparent),
      radial-gradient(closest-side at 70% 60%, color-mix(in srgb, var(--fx-color-2,#6c5ce7) 55%, transparent), transparent),
      radial-gradient(closest-side at 50% 85%, color-mix(in srgb, #16c79a 40%, transparent), transparent);
    animation:gfShift 18s ease-in-out infinite alternate;
    filter:blur(40px);
  }
  @keyframes gfShift{
    0%{transform:translate3d(0,0,0) scale(1)}
    50%{transform:translate3d(4%,-3%,0) scale(1.12)}
    100%{transform:translate3d(-4%,4%,0) scale(1.05)}
  }
  @media (prefers-reduced-motion:reduce){body[data-effect="gradient-flow"]::before{animation:none}}`;
  document.head.appendChild(style);
}
export function create(canvas, opts = {}) {
  const root = document.documentElement;
  return {
    start() {
      injectStyle();
      document.body.dataset.effect = 'gradient-flow';
      root.style.setProperty('--fx-color', opts.color || '#4f8cff');
      root.style.setProperty('--fx-color-2', opts.color2 || '#6c5ce7');
      if (opts.opacity !== undefined) root.style.setProperty('--fx-opacity', opts.opacity);
    },
    stop() {
      if (document.body.dataset.effect === 'gradient-flow') delete document.body.dataset.effect;
    },
    destroy() { this.stop(); }
  };
}
export default create;
