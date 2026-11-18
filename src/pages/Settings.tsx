import { useRef, useState } from 'react';
import { samplePortfolio } from '../data/sample';
import { useStore } from '../data/store';

export function Settings() {
  const { properties, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), properties }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brrrr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const items = Array.isArray(data) ? data : data.properties;
      if (!Array.isArray(items)) throw new Error('No properties found in file');
      if (properties.length && !confirm(`Replace your ${properties.length} properties with ${items.length} from the file?`)) return;
      await replaceAll(items);
      setMessage(`Imported ${items.length} properties.`);
    } catch (e) {
      setMessage(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="page">
      <h1>Data</h1>
      <div className="card stack">
        <p>
          Your data is stored in this browser only. Export a backup regularly, and use import to move it to
          another device.
        </p>
        <div className="row">
          <button className="primary" onClick={exportJson}>
            Export backup (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()}>Import backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />
        </div>
        {message && <p className="muted">{message}</p>}
      </div>
      <div className="card stack">
        <h3>Sample data</h3>
        <div className="row">
          <button
            onClick={() => {
              if (!properties.length || confirm('Replace all properties with the sample portfolio?')) replaceAll(samplePortfolio());
            }}
          >
            Load sample portfolio
          </button>
          <button
            className="danger"
            onClick={() => {
              if (confirm('Delete ALL properties? Export a backup first if you need one.')) replaceAll([]);
            }}
          >
            Clear all data
          </button>
        </div>
      </div>
    </div>
  );
}
