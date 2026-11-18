import { analyzeDeal, dealVerdict } from '../domain/calc';
import type { DealInputs } from '../domain/types';
import { money, pct, ratio } from '../format';
import { Metric, tone } from './fields';

const VERDICT_LABEL = {
  great: 'Strong BRRRR',
  good: 'Solid deal',
  marginal: 'Marginal',
  poor: 'Doesn’t pencil',
  incomplete: 'Needs inputs',
} as const;

export function DealResults({ deal }: { deal: DealInputs }) {
  const m = analyzeDeal(deal);
  const { verdict, reasons } = dealVerdict(deal, m);

  return (
    <div className="results">
      <div className={`card verdict verdict-${verdict}`}>
        <div className="verdict-title">{VERDICT_LABEL[verdict]}</div>
        <ul>
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Capital</h3>
        <div className="metrics">
          <Metric label="Total project cost" value={money(m.totalProjectCost)} />
          <Metric label="Cash invested" value={money(m.cashInvested)} />
          <Metric label="Cash out at refi" value={money(m.cashOutAtRefi)} tone={tone(m.cashOutAtRefi)} />
          <Metric
            label="Cash left in deal"
            value={money(m.cashLeftInDeal)}
            tone={m.cashLeftInDeal <= 0 ? 'pos' : 'neutral'}
            sub={
              m.cashLeftInDeal < 0
                ? `All capital back + ${money(-m.cashLeftInDeal)} extra`
                : `${pct(Math.max(0, m.capitalRecoveredPct), 0)} recovered`
            }
          />
        </div>
      </div>

      <div className="card">
        <h3>After refinance</h3>
        <div className="metrics">
          <Metric label="Monthly cash flow" value={money(m.monthlyCashFlow)} tone={tone(m.monthlyCashFlow)} />
          <Metric label="Cash-on-cash" value={pct(m.cashOnCash)} tone={m.cashOnCash === null ? 'pos' : tone(m.cashOnCash)} />
          <Metric label="DSCR" value={ratio(m.dscr)} tone={m.dscr === null ? 'neutral' : m.dscr >= 1.2 ? 'pos' : 'neg'} />
          <Metric label="Equity" value={money(m.equityAfterRefi)} />
          <Metric label="New loan" value={money(m.refiLoan)} sub={`${money(m.monthlyPI)}/mo P&I`} />
          <Metric label="NOI" value={money(m.noiAnnual)} sub="per year" />
          <Metric label="Cap rate (on ARV)" value={pct(m.capRate)} />
          <Metric label="Operating expenses" value={money(m.monthlyOperatingExpenses)} sub="per month" />
        </div>
      </div>

      <div className="card">
        <h3>Rules of thumb</h3>
        <div className="metrics">
          <Metric
            label="70% rule max offer"
            value={money(m.maxOffer70)}
            tone={m.meets70Rule ? 'pos' : 'neg'}
            sub={m.meets70Rule ? 'Price is under max' : 'Price is over max'}
          />
          <Metric
            label="Rent-to-cost"
            value={m.onePercentRatio === null ? '—' : pct(m.onePercentRatio, 2)}
            tone={m.onePercentRatio !== null && m.onePercentRatio >= 1 ? 'pos' : 'neutral'}
            sub="1% rule target"
          />
        </div>
      </div>
    </div>
  );
}
