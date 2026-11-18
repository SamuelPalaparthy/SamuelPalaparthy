import type { DealInputs } from '../domain/types';
import { NumberField } from './fields';

type Key = keyof DealInputs;
type FieldDef = { key: Key; label: string; kind: 'money' | 'pct' | 'num'; suffix?: string; hint?: string };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Buy',
    fields: [
      { key: 'purchasePrice', label: 'Purchase price', kind: 'money' },
      { key: 'buyClosingCosts', label: 'Closing costs', kind: 'money' },
      { key: 'acqLoanAmount', label: 'Acquisition loan', kind: 'money', hint: 'Hard money / private. 0 if cash.' },
      { key: 'acqRatePct', label: 'Loan rate', kind: 'pct', hint: 'Interest-only' },
      { key: 'acqPointsPct', label: 'Points', kind: 'pct' },
    ],
  },
  {
    title: 'Rehab',
    fields: [
      { key: 'rehabBudget', label: 'Rehab budget', kind: 'money' },
      { key: 'holdingMonths', label: 'Months to refi', kind: 'num', suffix: 'mo' },
      { key: 'holdingCostsMonthly', label: 'Holding costs', kind: 'money', suffix: '/mo', hint: 'Utilities, tax, insurance while vacant' },
    ],
  },
  {
    title: 'Rent',
    fields: [
      { key: 'monthlyRent', label: 'Monthly rent', kind: 'money' },
      { key: 'otherMonthlyIncome', label: 'Other income', kind: 'money', suffix: '/mo' },
      { key: 'vacancyPct', label: 'Vacancy', kind: 'pct' },
      { key: 'maintenancePct', label: 'Maintenance', kind: 'pct', hint: '% of rent' },
      { key: 'capexPct', label: 'CapEx reserve', kind: 'pct', hint: '% of rent' },
      { key: 'managementPct', label: 'Management', kind: 'pct', hint: '% of rent' },
      { key: 'propertyTaxAnnual', label: 'Property tax', kind: 'money', suffix: '/yr' },
      { key: 'insuranceAnnual', label: 'Insurance', kind: 'money', suffix: '/yr' },
      { key: 'hoaMonthly', label: 'HOA', kind: 'money', suffix: '/mo' },
      { key: 'utilitiesMonthly', label: 'Owner-paid utilities', kind: 'money', suffix: '/mo' },
    ],
  },
  {
    title: 'Refinance',
    fields: [
      { key: 'arv', label: 'After-repair value (ARV)', kind: 'money' },
      { key: 'refiLtvPct', label: 'Refi LTV', kind: 'pct' },
      { key: 'refiRatePct', label: 'Refi rate', kind: 'pct' },
      { key: 'refiTermYears', label: 'Term', kind: 'num', suffix: 'yrs' },
      { key: 'refiClosingCosts', label: 'Refi closing costs', kind: 'money' },
    ],
  },
];

export function DealForm({ deal, onChange }: { deal: DealInputs; onChange: (d: DealInputs) => void }) {
  return (
    <div className="deal-form">
      {SECTIONS.map((s) => (
        <fieldset key={s.title} className="card">
          <legend>{s.title}</legend>
          <div className="grid-fields">
            {s.fields.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                value={deal[f.key]}
                prefix={f.kind === 'money' ? '$' : undefined}
                suffix={f.suffix ?? (f.kind === 'pct' ? '%' : undefined)}
                hint={f.hint}
                onChange={(v) => onChange({ ...deal, [f.key]: v })}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
