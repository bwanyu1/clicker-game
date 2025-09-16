import React, { useMemo } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { eraIndexById } from '../../data/eras';
import BuildingCard from './BuildingCard';
import { useGame } from '../../state/store';

export default function BuildingsShop() {
  const { state, setBuyQty } = useGame();
  const qty = state.ui?.buyQty || 1;
  const available = useMemo(() => BUILDINGS.filter((b) => eraIndexById(b.era) <= eraIndexById(state.eraId)), [state.eraId]);
  return (
    <div className="panel">
      <h2>建物ショップ</h2>
      <div className="row small" style={{ marginBottom: 8 }}>
        <span className="muted">まとめ買い</span>
        {([1,10,100]).map(v => (
          <button key={v} className="btn ghost" onClick={() => setBuyQty(v)} style={{borderColor: qty===v?'#31e6c9':'#374151'}}>
            x{v}
          </button>
        ))}
      </div>
      <div className="shop">
        {available.map((b) => (
          <BuildingCard id={b.id} key={b.id} qty={qty} />
        ))}
      </div>
    </div>
  );
}

// order now derives from ERAS via eraIndexById
