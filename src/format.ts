const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = (n: number) => usd0.format(Math.round(n));
export const pct = (n: number | null, digits = 1) => (n === null ? '∞' : `${n.toFixed(digits)}%`);
export const ratio = (n: number | null) => (n === null ? '—' : n.toFixed(2));
export const date = (d: Date | string | undefined | null) => {
  if (!d) return '—';
  const v = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return v.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
