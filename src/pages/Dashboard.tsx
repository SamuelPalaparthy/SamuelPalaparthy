import { Link, useNavigate } from 'react-router-dom';
import { Metric, tone } from '../components/fields';
import { StageBadge } from '../components/Layout';
import { analyzeDeal, portfolioSummary, refiEligibleDate } from '../domain/calc';
import { STAGES, STAGE_LABELS } from '../domain/types';
import { useStore } from '../data/store';
import { samplePortfolio } from '../data/sample';
import { date, money } from '../format';

export function Dashboard() {
  const { properties, replaceAll, loading } = useStore();
  const navigate = useNavigate();
  if (loading) return null;

  if (properties.length === 0) {
    return (
      <div className="empty">
        <h1>Welcome to BRRRR Manager</h1>
        <p>Analyze deals, track each property from purchase through refinance, and watch your portfolio grow.</p>
        <div className="row">
          <button className="primary" onClick={() => navigate('/analyzer')}>
            Analyze a deal
          </button>
          <button onClick={() => replaceAll(samplePortfolio())}>Load sample portfolio</button>
        </div>
      </div>
    );
  }

  const s = portfolioSummary(properties);
  const maxStage = Math.max(1, ...STAGES.map((st) => s.byStage[st] ?? 0));

  const today = new Date();
  const upcomingRefis = properties
    .filter((p) => ['acquired', 'rehab', 'rented'].includes(p.stage))
    .map((p) => ({ p, eligible: refiEligibleDate(p) }))
    .sort((a, b) => (a.eligible?.getTime() ?? Infinity) - (b.eligible?.getTime() ?? Infinity));

  return (
    <div className="page">
      <h1>Portfolio</h1>

      <div className="metrics kpis">
        <Metric label="Properties owned" value={s.ownedCount} sub={`${s.pipelineCount} in pipeline`} />
        <Metric label="Estimated value" value={money(s.estimatedValue)} />
        <Metric label="Total debt" value={money(s.totalDebt)} />
        <Metric label="Equity" value={money(s.equity)} tone={tone(s.equity)} />
        <Metric label="Monthly cash flow" value={money(s.monthlyCashFlow)} tone={tone(s.monthlyCashFlow)} />
        <Metric label="Cash tied up" value={money(s.cashLeftInDeals)} sub="Capital still in deals" />
      </div>

      <div className="two-col">
        <section className="card">
          <h3>Pipeline by stage</h3>
          <div className="stage-bars">
            {STAGES.map((st) => {
              const n = s.byStage[st] ?? 0;
              return (
                <div key={st} className="stage-bar">
                  <span className="stage-bar-label">{STAGE_LABELS[st]}</span>
                  <span className="stage-bar-track">
                    <span className={`stage-bar-fill stage-${st}`} style={{ width: `${(n / maxStage) * 100}%` }} />
                  </span>
                  <span className="stage-bar-count">{n}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3>Refinance readiness</h3>
          {upcomingRefis.length === 0 ? (
            <p className="muted">No properties waiting on a refinance.</p>
          ) : (
            <ul className="list">
              {upcomingRefis.map(({ p, eligible }) => {
                const ready = eligible !== null && eligible <= today;
                return (
                  <li key={p.id}>
                    <Link to={`/properties/${p.id}`}>{p.name}</Link>
                    <span className={ready ? 'pos' : 'muted'}>
                      {eligible === null ? 'Set purchase date' : ready ? 'Seasoned — ready to refi' : `Eligible ${date(eligible)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h3>Properties</h3>
        <PropertyTable />
      </section>
    </div>
  );
}

export function PropertyTable({ stageFilter }: { stageFilter?: string }) {
  const { properties } = useStore();
  const rows = properties.filter((p) => !stageFilter || p.stage === stageFilter);
  if (rows.length === 0) return <p className="muted">No properties here yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Stage</th>
            <th className="num">ARV</th>
            <th className="num">Cash left in</th>
            <th className="num">Cash flow / mo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const m = analyzeDeal(p.deal);
            return (
              <tr key={p.id}>
                <td>
                  <Link to={`/properties/${p.id}`}>{p.name}</Link>
                  <div className="muted small">{p.address}</div>
                </td>
                <td>
                  <StageBadge stage={p.stage} />
                </td>
                <td className="num">{money(p.deal.arv)}</td>
                <td className="num">{money(m.cashLeftInDeal)}</td>
                <td className={`num ${tone(m.monthlyCashFlow)}`}>{money(m.monthlyCashFlow)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
