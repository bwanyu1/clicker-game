import React from 'react';
import { UPGRADES } from '../data/upgrades';
import { useGame } from '../state/store';

export default function UpgradesShop() {
  const { state, buyUpgrade, upgradeNextCost, getUpgradeLevel } = useGame();
  return (
    <div className="panel">
      <h2>Insights アップグレード</h2>
      {UPGRADES.map((u) => (
        <div className="card" key={u.id}>
          <div className="meta">
            <strong>{u.name} <span className="muted small">Lv {getUpgradeLevel(u.id)}</span></strong>
            <span className="small muted">{u.desc}</span>
          </div>
          <div className="row">
            <span className="pill small">Next: {upgradeNextCost(u.id)} Insights</span>
            <button className="buyBtn" disabled={state.insights < upgradeNextCost(u.id)} onClick={() => buyUpgrade(u.id)}>
              購入
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
