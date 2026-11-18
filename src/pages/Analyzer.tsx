import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DealForm } from '../components/DealForm';
import { DealResults } from '../components/DealResults';
import { TextField } from '../components/fields';
import { normalizeProperty } from '../data/repository';
import { useStore } from '../data/store';
import { DEFAULT_DEAL, type DealInputs } from '../domain/types';

const DRAFT_KEY = 'brrrr.analyzer.draft';

function loadDraft(): { name: string; address: string; deal: DealInputs } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { name: d.name ?? '', address: d.address ?? '', deal: { ...DEFAULT_DEAL, ...d.deal } };
    }
  } catch {
    /* ignore */
  }
  return { name: '', address: '', deal: DEFAULT_DEAL };
}

/** Scratchpad analyzer for quickly running numbers on a lead before it becomes a tracked property. */
export function Analyzer() {
  const { save } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(loadDraft);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const saveAsProperty = async () => {
    const p = await save(
      normalizeProperty({ name: draft.name || 'New deal', address: draft.address, stage: 'analyzing', deal: draft.deal }),
    );
    setDraft({ name: '', address: '', deal: DEFAULT_DEAL });
    navigate(`/properties/${p.id}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Deal Analyzer</h1>
          <p className="muted">Run the numbers on a lead. Save it to start tracking it in your pipeline.</p>
        </div>
        <div className="row">
          <button onClick={() => setDraft({ name: '', address: '', deal: DEFAULT_DEAL })}>Reset</button>
          <button className="primary" onClick={saveAsProperty}>
            Save as property
          </button>
        </div>
      </div>
      <div className="card grid-fields">
        <TextField label="Deal name" value={draft.name} placeholder="e.g. 123 Main St" onChange={(name) => setDraft({ ...draft, name })} />
        <TextField label="Address" value={draft.address} onChange={(address) => setDraft({ ...draft, address })} />
      </div>
      <div className="analyzer-layout">
        <DealForm deal={draft.deal} onChange={(deal) => setDraft({ ...draft, deal })} />
        <DealResults deal={draft.deal} />
      </div>
    </div>
  );
}
