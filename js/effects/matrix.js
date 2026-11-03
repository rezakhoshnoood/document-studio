/* effects/matrix.js — باران کاراکتر (Matrix) */
export function create(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const color = opts.color || '#22c07d';
  const chars = 'アカサタナハマヤラワ0123456789ABCDEF<>{}[]/*+-';
  let raf = null, w = 0, h = 0, columns = [], fontSize = 14, last = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = 14;
    const cols = Math.floor(w / fontSize);
    columns = Array.from({ length: cols }, () => Math.random() * -50);
  }
  function frame(ts) {
    if (ts - last > 52) {
      last = ts;
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontSize + 'px ui-monospace, monospace';
      columns.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.fillText(ch, i * fontSize, y * fontSize);
        columns[i] = y * fontSize > h + Math.random() * 300 ? 0 : y + 1;
      });
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
  }
  return {
    start() {
      resize();
      try { ctx.clearRect(0, 0, w, h); } catch (_) {}
      if (!raf) raf = requestAnimationFrame(frame);
      window.addEventListener('resize', resize);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      window.removeEventListener('resize', resize);
      try { ctx.clearRect(0, 0, w, h); } catch (_) {}
    },
    destroy() { this.stop(); columns = []; }
  };
}
export default create;
