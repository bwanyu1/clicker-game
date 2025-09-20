import React from 'react';
import { UPGRADES } from '../data/upgrades';
import { useGame } from '../state/store';
import { formatNumber } from '../utils/number';

export default function UpgradesShop() {
  const { state, buyUpgrade, upgradeNextCost, getUpgradeLevel, clickPowerBreakdown, getClickSkillLevel } = useGame();
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
              const microLvl = getClickSkillLevel('micro_ops') || 0;
              const microMult = Math.pow(1.10, microLvl);
              const cur = br.total * microMult;
              const next = (br.sum) * Math.pow(2, lvl + 1) * microMult;
              return (
                <span className="small muted">
                  現在の1クリック: {Math.floor(cur)} → 購入後: {Math.floor(next)}
                </span>
              );
            })()}
          </div>
          <div className="row">
            <span className="pill small">Next: {formatNumber(upgradeNextCost(u.id))} Insights</span>
            <button className="buyBtn" disabled={state.insights < upgradeNextCost(u.id)} onClick={() => buyUpgrade(u.id)}>
              購入
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
