import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeProperty } from '../data/repository';
import { useStore } from '../data/store';
import { STAGES, STAGE_LABELS } from '../domain/types';
import { PropertyTable } from './Dashboard';

export function Properties() {
  const { save, properties } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const addProperty = async () => {
    const p = await save(normalizeProperty({ name: `Property ${properties.length + 1}` }));
    navigate(`/properties/${p.id}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Properties</h1>
        <button className="primary" onClick={addProperty}>
          + Add property
        </button>
      </div>
      <div className="chips">
        <button className={filter === '' ? 'chip active' : 'chip'} onClick={() => setFilter('')}>
          All
        </button>
        {STAGES.map((s) => (
          <button key={s} className={filter === s ? 'chip active' : 'chip'} onClick={() => setFilter(s)}>
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>
      <section className="card">
        <PropertyTable stageFilter={filter} />
      </section>
    </div>
  );
}
