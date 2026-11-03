/* effects/waves.js — موج‌های سینوسی */
export function create(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const color = opts.color || '#4f8cff';
  let raf = null, w = 0, h = 0, t = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    t += 0.014;
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const amp = 26 + layer * 14;
      const baseY = h * (0.62 + layer * 0.09);
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x += 8) {
        const y = baseY + Math.sin(x / 130 + t * (1 + layer * 0.3) + layer) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.075 - layer * 0.016;
      ctx.fill();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { resize(); if (!raf) frame(); window.addEventListener('resize', resize); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h); },
    destroy() { this.stop(); }
  };
}
export default create;
