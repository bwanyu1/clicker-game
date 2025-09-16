import React, { useEffect, useRef } from 'react';

// Lightweight animated node graph for AI vibe
export default function AINetworkCanvas() {
  const ref = useRef(null);
  const stopRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const pr = Math.min(Math.max(Math.floor((w * h) / 90000), 30), 90); // node count by area
    const nodes = Array.from({ length: pr }, () => makeNode(w, h));

    function onResize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', onResize);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    function frame(t) {
      if (stopRef.current) return;
      const dt = Math.min(32, t - last);
      last = t;
      // colors from CSS variables
      const style = getComputedStyle(document.documentElement);
      const c1 = style.getPropertyValue('--accent').trim() || '#31e6c9';
      const c2 = style.getPropertyValue('--accent-2').trim() || '#7c6bf2';
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      // update & draw
      for (const n of nodes) {
        n.x += n.vx * (prefersReduced ? 0.15 : 0.35) * dt / 16;
        n.y += n.vy * (prefersReduced ? 0.15 : 0.35) * dt / 16;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 90 * 90) {
            const a1 = 1 - d2 / (90 * 90);
            ctx.strokeStyle = mixColor(c1, c2, (i + j) % 100 / 100);
            ctx.globalAlpha = 0.10 + 0.35 * a1;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return () => {
      stopRef.current = true;
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="ai-net" aria-hidden />;
}

function makeNode(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
  };
}

function mixColor(a, b, t) {
  // simple mix in RGB space from hex
  const pa = hex2rgb(a), pb = hex2rgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex2rgb(hex) {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(n, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

