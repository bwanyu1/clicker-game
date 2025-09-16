import React from 'react';
import { UPGRADES } from '../data/upgrades';
import { useGame } from '../state/store';

export default function UpgradesShop() {
  const { state, buyUpgrade } = useGame();
  return (
    <div className="panel">
      <h2>Insights アップグレード</h2>
      {UPGRADES.map((u) => (
        <div className="card" key={u.id}>
          <div className="meta">
            <strong>{u.name}</strong>
            <span className="small muted">{u.desc}</span>
          </div>
          <div className="row">
            <span className="pill small">Cost: {u.cost} Insights</span>
            <button className="buyBtn" disabled={state.upgrades.has(u.id) || state.insights < u.cost} onClick={() => buyUpgrade(u.id)}>
              {state.upgrades.has(u.id) ? '取得済' : '購入'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

