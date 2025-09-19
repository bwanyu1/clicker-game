import React from 'react';
import { useGame } from '../state/store';
import { CHALLENGES } from '../data/challenges';

export default function ChallengesPanel(){
  const { state, setChallenge } = useGame();
  const sel = state.challengeSelection || {};
  const locked = state.challengeActive || {};
  return (
    <div className="panel">
      <h2>チャレンジ（高難度）</h2>
      <p className="small muted">チェックは「選択」です。プレステージ/アセンドすると次の周回でロックされ、次のプレステージまで継続します。クリアで恒久強化が蓄積。</p>
      {Object.keys(locked).length>0 && (
        <div className="card">
          <div className="meta">
            <strong>現在の周回に適用中</strong>
            <span className="small muted">{Object.keys(locked).join(', ') || 'なし'}</span>
          </div>
        </div>
      )}
      <div className="shop">
        {CHALLENGES.map(c => (
          <div className="card" key={c.id}>
            <div className="meta">
              <strong>{c.name}</strong>
              <span className="small muted">{c.desc}</span>
            </div>
            <div className="row">
              <label className="small">
                <input type="checkbox" checked={!!sel[c.id]} onChange={e=> setChallenge(c.id, e.target.checked)} /> 選択（次周回で適用）
              </label>
              <span className="pill small">完了: {state.challengeCompletions?.[c.id]||0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
