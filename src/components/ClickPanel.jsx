import React, { useEffect } from 'react';
import { useGame } from '../state/store';

export default function ClickPanel() {
  const { click, state, setDataQ, clickPower, codingProgress, clickPowerBreakdown } = useGame();
  const cp = codingProgress();
  const nextPct = Math.max(0, Math.min(100, Math.floor((cp.xp / (cp.need||1)) * 100)));
  const br = clickPowerBreakdown();

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
      <button
        className="clickBtn"
        onClick={click}
        aria-label="Gain Params"
        title={`1回のクリック内訳:\n(基礎 ${br.base} + カード ${br.cards} + CLv ${br.coding.toFixed(2)}) × クリックマニア ×${br.maniaMult.toFixed(0)}\n= 合計 ${br.total.toFixed(2)}`}
      >
        <span>+{clickPower()} Params</span>
      </button>
      <div className="row" style={{ marginTop: 10 }}>
        <span className="muted small">clickPower</span>
        <span className="pill">{clickPower()}</span>
        <span className="muted small">CLv</span>
        <span className="pill">{cp.level}</span>
        <span className="muted small">DataQ</span>
        <span className="pill">{Math.round((state.dataQ || 0) * 100)}%</span>
      </div>
      <div className="row small" style={{marginTop:8}}>
        <div className="grow">
          <div className="muted">次のCLvまで</div>
          <div className="gauge" style={{'--w': nextPct + '%'}}><i/></div>
        </div>
        <span className="pill small">{cp.xp}/{cp.need}</span>
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
