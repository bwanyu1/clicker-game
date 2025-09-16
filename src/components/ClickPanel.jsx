import React, { useEffect } from 'react';
import { useGame } from '../state/store';

export default function ClickPanel() {
  const { click, state, setDataQ, clickPower } = useGame();

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [click]);

  return (
    <div className="panel">
      <h2>Click</h2>
      <button className="clickBtn" onClick={click} aria-label="Gain Params">
        <span>+{clickPower()} Params</span>
      </button>
      <div className="row" style={{ marginTop: 10 }}>
        <span className="muted small">clickPower</span>
        <span className="pill">{clickPower()}</span>
        <span className="muted small">DataQ</span>
        <span className="pill">{Math.round((state.dataQ || 0) * 100)}%</span>
      </div>
      <div className="row small" style={{ marginTop: 8 }}>
        <span className="muted">DataQ調整</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((state.dataQ || 0) * 100)}
          onChange={(e) => setDataQ(Number(e.target.value) / 100)}
          style={{ width: 220 }}
        />
      </div>
    </div>
  );
}
