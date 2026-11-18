import { NavLink, Outlet } from 'react-router-dom';
import type { Stage } from '../domain/types';
import { STAGE_LABELS } from '../domain/types';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/properties', label: 'Properties' },
  { to: '/analyzer', label: 'Deal Analyzer' },
  { to: '/settings', label: 'Data' },
];

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ⌂
          </span>
          BRRRR Manager
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`badge stage-${stage}`}>{STAGE_LABELS[stage]}</span>;
}
