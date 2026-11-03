/* effects/bubbles.js — حباب‌های رنگی صعودکننده */
export function create(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const color = opts.color || '#4f8cff';
  let raf = null, w = 0, h = 0, bubbles = [];
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(16, Math.round(w / 46));
    bubbles = Array.from({ length: count }, () => spawn(true));
  }
  function spawn(anywhere) {
    const r = Math.random() * 16 + 4;
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + r,
      r,
      vy: -(Math.random() * 0.6 + 0.25),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.006,
      alpha: Math.random() * 0.35 + 0.12
    };
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    bubbles.forEach((b) => {
      b.y += b.vy;
      b.sway += b.swaySpeed;
      const x = b.x + Math.sin(b.sway) * 16;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = b.alpha;
      ctx.fill();
      ctx.globalAlpha = b.alpha * 1.7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (b.y + b.r < -20) Object.assign(b, spawn(false));
    });
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { resize(); if (!raf) frame(); window.addEventListener('resize', resize); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h); },
    destroy() { this.stop(); bubbles = []; }
  };
}
export default create;
