import React from 'react';
import { ERAS, nextEra } from '../data/eras';
import { useGame } from '../state/store';
import { formatNumber } from '../utils/number';

export default function EraTimeline() {
  const { state } = useGame();
  const nxt = nextEra(state.eraId);
  return (
    <div className="panel">
      <h2>時代（Era）</h2>
      <div className="era">
        {ERAS.map((e) => (
          <span key={e.id} className={chipClass(e.id, state.eraId)} title={`閾値 ${formatNumber(e.threshold)} Params`}>
            {e.name}
          </span>
        ))}
      </div>
      {nxt && (
        <p className="small muted" style={{ marginTop: 8 }}>
          次のEra解放条件: 合計Paramsが {formatNumber(nxt.threshold)} 以上
        </p>
      )}
    </div>
  );
}

function chipClass(id, current) {
  const base = 'chip';
  if (id === current) return `${base} active`;
  const idx = ERAS.findIndex(e=>e.id===id);
  const cur = ERAS.findIndex(e=>e.id===current);
  return idx === cur + 1 ? `${base} next` : base;
}
