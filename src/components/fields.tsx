import { useEffect, useId, useState, type ReactNode } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  step?: number;
}

/** Numeric input that lets the user clear/type freely and only commits valid numbers. */
export function NumberField({ label, value, onChange, prefix, suffix, hint, step }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(value ? String(value) : '');

  useEffect(() => {
    // Sync from outside changes without clobbering in-progress edits like "12." or "".
    const parsed = text === '' ? 0 : Number(text);
    if (parsed !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-affix">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step ?? 'any'}
          value={text}
          placeholder="0"
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value === '') onChange(0);
            else if (Number.isFinite(n)) onChange(n);
          }}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date';
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Metric({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: 'pos' | 'neg' | 'neutral';
  sub?: ReactNode;
}) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${tone ?? ''}`}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

export const tone = (n: number): 'pos' | 'neg' | 'neutral' => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'neutral');
