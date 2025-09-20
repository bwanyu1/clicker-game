import React from 'react';
import { useGame } from '../state/store';
import { BUILDINGS } from '../data/buildings';
import { eraIndexById } from '../data/eras';
import { formatNumber } from '../utils/number';

export default function ParamTuningPanel(){
  const { state, buyParamUpgrade, buyParamUpgradeMany } = useGame();
  const list = React.useMemo(()=>
    BUILDINGS
      .filter(b=> eraIndexById(b.era) <= eraIndexById(state.eraId))
      .map(b=> withTuning(state, b))
  ,[state]);

  return (
    <div className="panel">
      <h2>チューニング・ラボ（周回限定の恒久強化）</h2>
      <p className="small muted" style={{marginTop:4, marginBottom:12}}>
        Paramsで購入できる恒久強化（この周回限定）です。対象建物の生産に倍率がかかりますが、プレステージでリセットされます。
      </p>
      <div className="shop">
        {list.map((it)=> (
          <div key={it.id} className="card">
            <div className="meta">
              <strong>{it.name}</strong>
              <span className="small muted">Tier {it.tier} / 現在倍率 ×{it.multNow.toFixed(2)}</span>
            </div>
            <div className="row">
              <span className="pill small">次: ×{it.multNext.toFixed(2)}</span>
              <span className="pill small">{formatNumber(it.cost)} Params</span>
              <button className="buyBtn" disabled={state.params < it.cost} onClick={()=> buyParamUpgrade(it.id)}>
                ×1
              </button>
              <button className="btn" disabled={!canBuyN(state, it, 5)} onClick={()=> buyParamUpgradeMany(it.id, 5)}>×5</button>
              <button className="btn" disabled={!canBuyN(state, it, 10)} onClick={()=> buyParamUpgradeMany(it.id, 10)}>×10</button>
              <button className="btn ghost" onClick={()=> buyParamUpgradeMany(it.id, 'max')}>MAX</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function withTuning(state, b){
  const tier = state.paramUpgrades?.[b.id] || 0;
  const multNow = Math.pow(1.2, tier);
  const multNext = Math.pow(1.2, tier+1);
  const cost = paramUpgradeCost(b, tier);
  return { ...b, tier, multNow, multNext, cost };
}

function paramUpgradeCost(b, tier){
  const base = Math.max(50, Math.floor((b.baseCost?.params || 50) * 15));
  const growth = 1.6;
  return Math.ceil(base * Math.pow(growth, tier));
}

function canBuyN(state, it, n){
  let params = state.params;
  let tier = it.tier;
  for (let i=0;i<n;i++){
    const c = paramUpgradeCost(it, tier);
    if (params < c) return false;
    params -= c; tier += 1;
  }
  return true;
}

// (表示用) Insights由来の恒久×2は生産時に反映済み。ここではParams由来の倍率のみ表示。
