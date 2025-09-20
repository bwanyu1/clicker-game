import React from 'react';
import { useGame } from '../state/store';
import { ASC_NODES, ASC_NODE_MAP } from '../data/ascension';
import { formatNumber } from '../utils/number';

const ASCEND_COST = 100;

export default function AscensionPanel(){
  const { state, ascend, buyAscNode } = useGame();
  const ap = state.ascensionPoints || 0;
  const nodes = state.ascensionNodes || {};
  return (
    <div className="panel">
      <h2>アセンド</h2>
      <p className="small muted">Insightsを消費しAP(Ascension Point)を獲得。APで分岐テックツリーを解放します。</p>
      <div className="card">
        <div className="meta">
          <strong>アセンド</strong>
          <span className="small muted">コスト: {formatNumber(ASCEND_COST)} Insights（深いリセット／恒久要素は維持）</span>
        </div>
        <div className="row">
          <span className="pill">AP: {ap}</span>
          <span className="pill">Insights: {formatNumber(state.insights||0)}</span>
          <button className="buyBtn" disabled={(state.insights||0) < ASCEND_COST} onClick={()=> ascend(ASCEND_COST)}>アセンドする</button>
        </div>
      </div>
      <h3 style={{marginTop:12}}>分岐テックツリー</h3>
      <div className="shop">
        {ASC_NODES.map(n => {
          const owned = !!nodes[n.id];
          const canBuy = !owned && (ap >= (n.cost||1)) && requiresMet(nodes, n) && branchOk(nodes, n);
          return (
            <div className="card" key={n.id}>
              <div className="meta">
                <strong>{n.name} {!owned && <span className="muted small">(AP {n.cost})</span>}</strong>
                <span className="small muted">{n.desc}</span>
              </div>
              <div className="row">
                <span className="pill small">{owned ? '解放済み' : reqText(n)}</span>
                <button className="buyBtn" disabled={!canBuy} onClick={()=> buyAscNode(n.id)}>解放</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function requiresMet(nodes, n){
  const req = n.req || [];
  return req.every(r => !!nodes[r]);
}
function branchOk(nodes, n){
  const b = n.branch || 'misc';
  if (b === 'misc') return true;
  for (const id in nodes){ if (nodes[id] && (ASC_NODE_MAP[id]?.branch) === b) return false; }
  return true;
}
function reqText(n){
  if (!n.req || n.req.length===0) return n.branch==='path' ? '分岐（どれか1つ）' : '—';
  return '要: ' + n.req.map(id=> ASC_NODE_MAP[id]?.name || id).join(', ');
}
