import React from 'react';
import { useGame } from '../state/store';
import { ACHIEVEMENTS } from '../data/achievements';

export default function AchievementsPanel(){
  const { state } = useGame();
  const unlocked = new Set(state.achievements || []);
  const count = unlocked.size;
  return (
    <div className="panel">
      <h2>実績 <span className="muted small">{count}/{ACHIEVEMENTS.length}</span></h2>
      <div className="shop">
        {ACHIEVEMENTS.map(a => (
          <div className="card" key={a.id} style={{opacity: unlocked.has(a.id)?1:.45}}>
            <div className="meta">
              <strong>{a.name}</strong>
              <span className="small muted">{a.desc}</span>
            </div>
            <div className="pill small">{unlocked.has(a.id)?'解放済':'未解放'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

