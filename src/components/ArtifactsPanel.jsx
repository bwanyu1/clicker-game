import React from 'react';
import { useGame } from '../state/store';
import { ARTIFACT_SLOTS, ARTIFACT_MAP } from '../data/artifacts';

const DISCOVER_COST = 1e6; // Params cost per discover

export default function ArtifactsPanel(){
  const { state, artiDiscover, artiEquip, artiUnequip, artiCombine } = useGame();
  const inv = state.artifacts || {};
  const eq = state.equippedArtifacts || {};

  return (
    <div className="panel">
      <h2>アーティファクト</h2>
      <p className="small muted">AIにまつわる希少な装備。スロットごとに1つ装備できます。</p>

      <div className="card">
        <div className="row">
          <div className="grow">
            <strong>発掘</strong>
            <div className="small muted">ランダムなアーティファクトを1つ発見（コスト: {DISCOVER_COST.toLocaleString()} Params）</div>
          </div>
          <button className="btn" disabled={(state.params||0) < DISCOVER_COST} onClick={()=> artiDiscover(DISCOVER_COST)}>発掘する</button>
        </div>
      </div>

      <h3 style={{marginTop:12}}>装備中</h3>
      {ARTIFACT_SLOTS.map((slot)=>{
        const key = eq[slot];
        const parsed = parseKey(key);
        const a = parsed ? ARTIFACT_MAP[parsed.id] : null;
        return (
          <div className="card" key={slot}>
            <div className="meta">
              <strong>{slotLabel(slot)}</strong>
              <span className="small muted">{a ? `${a.name} [${parsed.rar}]` : '未装備'}</span>
              {a && <span className="small muted">{a.desc}</span>}
            </div>
            <div className="row">
              {a ? (
                <button className="btn ghost" onClick={()=> artiUnequip(slot)}>外す</button>
              ) : (
                <span className="muted small">インベントリから装備できます</span>
              )}
            </div>
          </div>
        );
      })}

      <h3 style={{marginTop:12}}>インベントリ</h3>
      {Object.keys(inv).filter(k => (inv[k]||0) > 0).map((key)=>{
        const parsed = parseKey(key);
        const a = ARTIFACT_MAP[parsed.id];
        const count = inv[key] || 0;
        const canEquip = count > 0;
        const canCombine = count >= 3 && parsed.rar !== 'L';
        return (
          <div className="card" key={key}>
            <div className="meta">
              <strong>{a?.name || parsed.id} [{parsed.rar}] <span className="muted small">x{count}</span></strong>
              <span className="small muted">スロット: {a ? slotLabel(a.slot) : '-'} / {a?.desc || ''}</span>
            </div>
            <div className="row">
              <button className="buyBtn" disabled={!canEquip} onClick={()=> artiEquip(key)}>装備</button>
              <button className="btn ghost" disabled={!canCombine} onClick={()=> artiCombine(key)}>合成（3→1）</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function slotLabel(slot){
  switch(slot){
    case 'theory': return '理論';
    case 'hardware': return 'ハードウェア';
    case 'data': return 'データ';
    case 'algorithms': return 'アルゴリズム';
    default: return slot;
  }
}

function parseKey(key){
  if (!key) return null;
  const [id, rar] = String(key).split('@');
  return { id, rar: rar || 'C' };
}
