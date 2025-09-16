import React from 'react';
import { useGame } from '../state/store';
import { KEY, saveState, exportSave, createSnapshot, snapshotList, snapshotRestore, snapshotDelete } from '../utils/storage';

export default function SettingsDebug() {
  const { state } = useGame();
  const [snap, setSnap] = React.useState(() => getRaw());
  const [ts, setTs] = React.useState(() => readable(state.lastSavedAt));
  const [snaps, setSnaps] = React.useState(() => snapshotList());

  React.useEffect(() => {
    setTs(readable(state.lastSavedAt));
    window.__gameState = state; // expose for quick testing
    setSnaps(snapshotList());
  }, [state]);

  return (
    <div className="panel">
      <h2>Settings / Debug</h2>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn ghost" onClick={() => { saveState(state); setSnap(getRaw()); }}>Save Now</button>
        <button className="btn ghost" onClick={() => { loadNow(); setSnap(getRaw()); }}>Load Now</button>
        <button className="btn danger" onClick={() => { if(window.confirm('本当にセーブを削除しますか？先にスナップショットを作成することを推奨します。')) { createSnapshot(); localStorage.removeItem(KEY); setSnap(getRaw()); setSnaps(snapshotList()); } }}>Clear Save</button>
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn ghost" onClick={() => download(exportSave())}>Export</button>
        <label className="btn ghost" style={{ cursor:'pointer' }}>
          Import
          <input type="file" accept="application/json" style={{ display:'none' }} onChange={onImport} />
        </label>
      </div>
      <div className="small muted">lastSavedAt (state): {ts || '-'}</div>
      <div className="small muted">localStorage: {snap ? `${(snap.length/1024).toFixed(1)} KB` : '—'}</div>
      <section style={{ marginTop: 8, marginBottom: 8 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Snapshots（手動バックアップ）</h3>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn primary" onClick={() => { createSnapshot(); setSnaps(snapshotList()); }}>Create Snapshot</button>
          <span className="small muted">最大8件まで保持。Clear/Import前の作成を推奨。</span>
        </div>
        {snaps.length===0 ? (
          <div className="small muted">スナップショットはまだありません。</div>
        ) : (
          <div className="shop">
            {snaps.map(s => (
              <div className="card" key={s.id}>
                <div className="meta">
                  <strong>{readable(s.ts)}</strong>
                  <span className="small muted">{(s.size/1024).toFixed(1)} KB</span>
                </div>
                <div className="row">
                  <button className="btn ghost" onClick={() => { if(window.confirm('このスナップショットに復元しますか？現在の状態は上書きされます。')) { snapshotRestore(s.id); window.location.reload(); } }}>Restore</button>
                  <button className="btn ghost" onClick={() => downloadSnapshot(s.id)}>Download</button>
                  <button className="btn danger" onClick={() => { if(window.confirm('スナップショットを削除しますか？')) { snapshotDelete(s.id); setSnaps(snapshotList()); }}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <details style={{ marginTop: 8 }}>
        <summary className="small">Saved JSON (raw)</summary>
        <pre style={{ maxHeight: 240, overflow: 'auto', fontSize: 12, background: '#0b1222', padding: 8, borderRadius: 8 }}>
{snap || '(no save)'}
        </pre>
      </details>
    </div>
  );
}

function loadNow() {
  try {
    const raw = localStorage.getItem(KEY);
    // eslint-disable-next-line no-console
    console.log('[debug] manual Load Now', raw ? 'found' : 'none');
  } catch (e) {
    console.error(e);
  }
}

function getRaw() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function readable(t) {
  if (!t) return '';
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}

function download(text){
  try{
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ai-clicker-save-v1.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(e){ console.error(e); }
}

function onImport(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const raw = reader.result;
      // eslint-disable-next-line no-console
      console.log('[debug] import size', raw?.length);
      if (window.confirm('現在の状態は上書きされます。先にスナップショットを作成しますか？（OKで作成してから上書き）')) {
        createSnapshot();
      }
      localStorage.setItem(KEY, raw);
      window.location.reload();
    }catch(err){ console.error(err); }
  };
  reader.readAsText(file);
}

function downloadSnapshot(id){
  try{
    const list = JSON.parse(localStorage.getItem('ai-clicker-snapshots-v1')||'[]');
    const s = list.find(x=>x.id===id);
    if(!s) return;
    const blob = new Blob([s.data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ai-clicker-snapshot-${id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(e){ console.error(e); }
}
