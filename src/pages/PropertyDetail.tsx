import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DealForm } from '../components/DealForm';
import { DealResults } from '../components/DealResults';
import { Metric, NumberField, TextField, tone } from '../components/fields';
import { StageBadge } from '../components/Layout';
import { useStore } from '../data/store';
import { refiEligibleDate, rehabTotals } from '../domain/calc';
import { STAGES, STAGE_LABELS, type Property, type RehabItem, type Stage } from '../domain/types';
import { date, money } from '../format';

type Tab = 'analysis' | 'rehab' | 'details';

export function PropertyDetail() {
  const { id } = useParams();
  const { get, loading } = useStore();
  if (loading) return null;
  const property = id ? get(id) : undefined;
  if (!property) {
    return (
      <div className="page">
        <p>Property not found.</p>
        <Link to="/properties">Back to properties</Link>
      </div>
    );
  }
  return <PropertyEditor key={property.id} initial={property} />;
}

/** Holds a local draft and autosaves it, so typing stays responsive regardless of storage backend. */
function PropertyEditor({ initial }: { initial: Property }) {
  const { save, remove } = useStore();
  const navigate = useNavigate();
  const [p, setP] = useState(initial);
  const [tab, setTab] = useState<Tab>('analysis');
  const [saved, setSaved] = useState(true);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(() => save(p).then(() => setSaved(true)), 400);
    return () => clearTimeout(t);
  }, [p, save]);

  const update = (patch: Partial<Property>) => setP((prev) => ({ ...prev, ...patch }));

  const onDelete = async () => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await remove(p.id);
    navigate('/properties');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/properties" className="muted small">
            ← Properties
          </Link>
          <h1>{p.name || 'Untitled property'}</h1>
          <div className="row">
            <StageBadge stage={p.stage} />
            <span className="muted small">{p.address}</span>
            <span className="muted small">{saved ? 'Saved' : 'Saving…'}</span>
          </div>
        </div>
        <div className="field compact">
          <label htmlFor="stage">Stage</label>
          <select id="stage" value={p.stage} onChange={(e) => update({ stage: e.target.value as Stage })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {(['analysis', 'rehab', 'details'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t === 'analysis' ? 'Deal analysis' : t === 'rehab' ? 'Rehab' : 'Details'}
          </button>
        ))}
      </div>

      {tab === 'analysis' && (
        <div className="analyzer-layout">
          <DealForm deal={p.deal} onChange={(deal) => update({ deal })} />
          <DealResults deal={p.deal} />
        </div>
      )}
      {tab === 'rehab' && <RehabTracker p={p} update={update} />}
      {tab === 'details' && (
        <div className="card details">
          <div className="grid-fields">
            <TextField label="Name" value={p.name} onChange={(name) => update({ name })} />
            <TextField label="Address" value={p.address} onChange={(address) => update({ address })} />
            <TextField label="Purchase date" type="date" value={p.purchaseDate ?? ''} onChange={(v) => update({ purchaseDate: v || undefined })} />
            <TextField label="Refinance date" type="date" value={p.refiDate ?? ''} onChange={(v) => update({ refiDate: v || undefined })} />
            <NumberField
              label="Lender seasoning"
              suffix="mo"
              value={p.seasoningMonths}
              onChange={(seasoningMonths) => update({ seasoningMonths })}
              hint={`Refi eligible: ${date(refiEligibleDate(p))}`}
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows={6} value={p.notes} onChange={(e) => update({ notes: e.target.value })} />
          </div>
          <div className="danger-zone">
            <button className="danger" onClick={onDelete}>
              Delete property
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RehabTracker({ p, update }: { p: Property; update: (patch: Partial<Property>) => void }) {
  const totals = rehabTotals(p);
  const budget = p.deal.rehabBudget;
  const items = p.rehabItems;

  const setItem = (id: string, patch: Partial<RehabItem>) =>
    update({ rehabItems: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const addItem = () =>
    update({
      rehabItems: [...items, { id: crypto.randomUUID(), category: '', description: '', budget: 0, actual: 0, done: false }],
    });
  const removeItem = (id: string) => update({ rehabItems: items.filter((i) => i.id !== id) });

  const spentPct = budget > 0 ? Math.min(100, (totals.actual / budget) * 100) : 0;

  return (
    <div className="page-section">
      <div className="metrics kpis">
        <Metric label="Deal rehab budget" value={money(budget)} sub="From deal analysis" />
        <Metric label="Line-item budget" value={money(totals.budget)} tone={totals.budget > budget ? 'neg' : 'neutral'} />
        <Metric label="Spent to date" value={money(totals.actual)} />
        <Metric label="Remaining" value={money(budget - totals.actual)} tone={tone(budget - totals.actual)} />
        <Metric label="Line items done" value={`${totals.done} / ${totals.count}`} />
      </div>
      <div className="progress" aria-label="Rehab spend vs budget">
        <span className={totals.actual > budget ? 'neg-bg' : ''} style={{ width: `${spentPct}%` }} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="editable">
            <thead>
              <tr>
                <th>Done</th>
                <th>Category</th>
                <th>Description</th>
                <th className="num">Budget</th>
                <th className="num">Actual</th>
                <th className="num">Variance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <input type="checkbox" checked={i.done} aria-label="Done" onChange={(e) => setItem(i.id, { done: e.target.checked })} />
                  </td>
                  <td>
                    <input value={i.category} placeholder="e.g. Kitchen" aria-label="Category" onChange={(e) => setItem(i.id, { category: e.target.value })} />
                  </td>
                  <td>
                    <input value={i.description} aria-label="Description" onChange={(e) => setItem(i.id, { description: e.target.value })} />
                  </td>
                  <td className="num">
                    <input type="number" value={i.budget || ''} placeholder="0" aria-label="Budget" onChange={(e) => setItem(i.id, { budget: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="num">
                    <input type="number" value={i.actual || ''} placeholder="0" aria-label="Actual" onChange={(e) => setItem(i.id, { actual: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={`num ${tone(i.budget - i.actual)}`}>{money(i.budget - i.actual)}</td>
                  <td>
                    <button className="icon" aria-label="Remove line item" onClick={() => removeItem(i.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem}>+ Add line item</button>
      </div>
    </div>
  );
}
