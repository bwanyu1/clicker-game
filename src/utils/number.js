export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const neg = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return neg + n.toFixed(n % 1 === 0 ? 0 : 2);
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let u = -1;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  return neg + n.toFixed(1) + units[u];
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

