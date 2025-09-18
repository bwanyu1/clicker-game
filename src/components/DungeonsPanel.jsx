import React from 'react';
import { useGame } from '../state/store';
import { DUNGEONS } from '../data/dungeons';

export default function DungeonsPanel(){
  const { state, startDungeon, claimDungeon } = useGame();
  const run = state.dungeon;
  const now = Date.now();
  const remaining = run && run.status === 'running' ? Math.max(0, Math.ceil((run.endsAt - now)/1000)) : 0;
  return (
    <div className="panel">
      <h2>ダンジョン（AIテーマ）</h2>
      <p className="small muted">アーティファクトはダンジョン攻略で獲得できます。難度が高いほど高レアの確率が上がります。</p>

      {run ? (
        <div className="card">
          <div className="meta">
            <strong>{labelFor(run.id)}</strong>
            <span className="small muted">状態: {run.status === 'running' ? `進行中（残り ${remaining}s）` : '完了'}</span>
          </div>
          <div className="row">
            {run.status === 'completed' ? (
              <button className="buyBtn" onClick={()=> claimDungeon()}>報酬を受け取る</button>
            ) : (
              <span className="pill small">進行中…</span>
            )}
          </div>
        </div>
      ) : (
        <div className="shop">
          {DUNGEONS.map(d => (
            <div className="card" key={d.id}>
              <div className="meta">
                <strong>{d.name} <span className="muted small">（{tierText(d.tier)} / {d.durationSec}s）</span></strong>
                <span className="small muted">{d.desc}</span>
              </div>
              <div className="row">
                <span className="pill small">Cost: {fmt(d.cost.params)} Params / {fmt(d.cost.compute)} Compute</span>
                <span className="pill small">Reward: Artifact×{d.rewards.artifacts}, Shards +{d.rewards.shards}</span>
                <button className="buyBtn" disabled={!canAfford(state, d)} onClick={()=> startDungeon(d.id)}>開始</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function canAfford(state, d){
  return (state.params||0) >= (d.cost?.params||0) && (state.compute||0) >= (d.cost?.compute||0);
}
function fmt(n){ return Number(n).toLocaleString(); }
function labelFor(id){ const d = DUNGEONS.find(x=>x.id===id); return d ? d.name : id; }
function tierText(t){
  switch(t){
    case 1: return 'Tier 1';
    case 2: return 'Tier 2';
    case 3: return 'Tier 3';
    case 4: return 'Tier 4';
    default: return `Tier ${t}`;
  }
}

