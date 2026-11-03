/* effects/orbit.js — دایره‌های مداری چرخشی */
export function create(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const color = opts.color || '#4f8cff';
  let raf = null, w = 0, h = 0, t = 0, rings = [];
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const base = Math.min(w, h);
    rings = [0.22, 0.34, 0.48, 0.64].map((f, i) => ({
      r: base * f, speed: (i % 2 ? -1 : 1) * (0.0016 + i * 0.0006),
      dots: 2 + i, offset: i * 1.1
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    t += 1;
    const cx = w / 2, cy = h / 2;
    rings.forEach((ring) => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 0; i < ring.dots; i++) {
        const a = t * ring.speed * 60 + ring.offset + (Math.PI * 2 * i) / ring.dots;
        const x = cx + Math.cos(a) * ring.r;
        const y = cy + Math.sin(a) * ring.r;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { resize(); if (!raf) frame(); window.addEventListener('resize', resize); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h); },
    destroy() { this.stop(); rings = []; }
  };
}
export default create;
