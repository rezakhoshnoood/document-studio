/* effects/particles.js — ذرات شناور متصل با خطوط */
export function create(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let raf = null, w = 0, h = 0, pts = [];
  const color = opts.color || '#4f8cff';
  const density = opts.density || 0.00008;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(24, Math.min(90, Math.round(w * h * density)));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.7 + 0.7
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 118) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = color;
          ctx.globalAlpha = (1 - d / 118) * 0.24;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { resize(); if (!raf) frame(); window.addEventListener('resize', resize); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h); },
    destroy() { this.stop(); pts = []; },
    setColor(c) { /* color is captured; manager re-creates on color change */ }
  };
}
export default create;
