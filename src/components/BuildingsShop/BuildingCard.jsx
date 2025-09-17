import React from 'react';
import { useGame } from '../../state/store';
import { BUILDING_MAP } from '../../data/buildings';
import { formatNumber } from '../../utils/number';

export default function BuildingCard({ id, qty=1 }) {
  const { state, nextCost, canBuy, buyBuilding, buyMany, maxAffordable, effectiveRateFor } = useGame();
  const b = BUILDING_MAP[id];
  const count = state.buildings[id]?.count || 0;
  const cost = nextCost(id);
  const afford = canBuy(id);
  const needsCompute = cost.compute && cost.compute > 0;
  const series = useSeriesCost(state, b, count, qty);
  const affordSeries = state.params >= (series.params||0) && state.compute >= (series.compute||0);
  const max = maxAffordable(id);
  const erate = effectiveRateFor(id) || 0;

  return (
    <div className="card" title={`実効DPS/台: ${formatNumber(erate)}\n所持台数: ${count}\n現在の合計DPS: ≈ ${formatNumber((count||0)*erate)}`}>
      <div className="meta">
        <strong>{b.name}</strong>
        <span className="small muted">Era {b.era} / 所持 {count}</span>
        <span className="small">+{formatNumber(erate)} Params/s each</span>
      </div>
      <div className="row" title={`1台あたり: ${formatNumber(cost.params)}P${needsCompute?` + ${formatNumber(cost.compute)}C`:''}\nまとめ買いx${qty}: ${formatNumber(series.params||0)}P${(series.compute?` + ${formatNumber(series.compute)}C`:'')}`}>
        <span className="pill small">{formatNumber(cost.params)} Params</span>
        {needsCompute && <span className="pill small">{formatNumber(cost.compute)} Compute</span>}
        <button className="buyBtn" disabled={!afford} onClick={() => buyBuilding(id)}>x1</button>
        <button className="buyBtn" disabled={!affordSeries} onClick={() => buyMany(id, qty)}>x{qty}</button>
        <button className="btn ghost" disabled={max===0} onClick={() => buyMany(id, max)}>Max({max})</button>
      </div>
      {/* 恒久強化はチューニング・ラボへ移設 */}
    </div>
  );
}

function useSeriesCost(state, b, startCount, qty){
  // reproduce logic in store's seriesCost for display
  let params = 0; let compute = 0;
  for (let i=0;i<qty;i++){
    const idx = startCount + i;
    // mimic nextCostWithMods
    const gp = b.costGrowth?.params || 1;
    const gc = b.costGrowth?.compute || 1;
    let p = b.baseCost.params ? Math.ceil(b.baseCost.params * Math.pow(gp, idx)) : 0;
    let c = b.baseCost.compute ? Math.ceil(b.baseCost.compute * Math.pow(gc, idx)) : 0;
    if (c){
      const lvl = (state.upgrades?.industrial_lessons || 0);
      if (lvl > 0) c = Math.ceil(c * Math.pow(0.85, lvl));
    }
    if (b.id === 'gpu_2009' && state.activeEvents?.some(e=>e.type==='gpu_sale' && e.endsAt>Date.now())){
      if (p) p = Math.ceil(p*0.75);
      if (c) c = Math.ceil(c*0.75);
    }
    params += p; compute += c;
  }
  return {params, compute};
}

// paramUpgradeCost moved to ParamTuningPanel/UI side
