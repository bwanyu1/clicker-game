import React from 'react';
import { UPGRADES } from '../data/upgrades';
import { useGame } from '../state/store';

export default function UpgradesShop() {
  const { state, buyUpgrade, upgradeNextCost, getUpgradeLevel, clickPowerBreakdown } = useGame();
  return (
    <div className="panel">
      <h2>Insights アップグレード</h2>
      {UPGRADES.map((u) => (
        <div className="card" key={u.id}>
          <div className="meta">
            <strong>{u.name} <span className="muted small">Lv {getUpgradeLevel(u.id)}</span></strong>
            <span className="small muted">{u.desc}</span>
            {u.id === 'clicker_mania' && (() => {
              const br = clickPowerBreakdown();
              const lvl = getUpgradeLevel(u.id) || 0;
              const nextTotal = (br.sum) * Math.pow(2, lvl + 1);
              return (
                <span className="small muted">
                  現在の1クリック: {Math.floor(br.total)} → 購入後: {Math.floor(nextTotal)}
                </span>
              );
            })()}
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
