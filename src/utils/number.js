export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const neg = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return neg + n.toFixed(n % 1 === 0 ? 0 : 2);
  // Thousand-based short scale suffixes
  // K(1e3) M(1e6) B(1e9) T(1e12) Qa(1e15) Qi(1e18)
  // Then extended: Sx, Sp, Oc, No, Dc, Ud, Dd, Td, Qd, Qn,
  // Sxd, Spd, Ocd, Nod, Vg, Uvg, Dvg, Tvg, Qavg, Qivg,
  // Sxvg, Spvg, Ocvg, Novg, Tg, Utg, Dtg, Ttg, Qatg, Qitg
  const units = [
    'K','M','B','T','Qa','Qi',
    'Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qd','Qn',
    'Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg',
    'Sxvg','Spvg','Ocvg','Novg','Tg','Utg','Dtg','Ttg','Qatg','Qitg'
  ];
  let u = -1;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  if (u >= 0 && u < units.length) return neg + n.toFixed(1) + units[u];
  // Fallback: continue dividing by 1000 to compute total exponent in steps of 3
  let extra = 0;
  while (n >= 1000) { n /= 1000; extra++; }
  const totalExp3 = (units.length) * 3 + extra * 3; // total exponent in powers of 10
  return neg + n.toFixed(2) + 'e' + totalExp3;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
