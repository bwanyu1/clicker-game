import React, { useMemo } from 'react';
import { useGame } from '../state/store';
import { QUESTS } from '../data/quests';

export default function QuestsPanel(){
  const { state, claimQuest } = useGame();
  const list = useMemo(()=> QUESTS.map(q => ({...q, done: isDone(state,q), claimed: state.questsClaimed?.has(q.id)})), [state]);
  const sorted = list.sort((a,b)=> (a.claimed?1:0) - (b.claimed?1:0) || (b.done?1:0) - (a.done?1:0));
  return (
    <div className="panel">
      <h2>クエスト</h2>
      <div className="shop">
        {sorted.map(q => (
          <div className="card" key={q.id} style={{opacity: q.claimed? .45 : 1}}>
            <div className="meta">
              <strong>{q.name}</strong>
              <span className="small muted">{q.desc}</span>
            </div>
            <div className="row">
              <span className="pill small">{q.claimed? '受取済' : (q.done? '達成！' : '未達')}</span>
              <button className="buyBtn" disabled={!q.done || q.claimed} onClick={() => claimQuest(q.id)}>
                受け取る
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isDone(state, q){
  if (q.type==='era') return state.eraId === q.value;
  if (q.type==='building') return (state.buildings[q.building]?.count||0) >= q.value;
  if (q.type==='pps') return Math.floor((state.__ppsCache||0)) >= q.value; // store fills this per tick
  return false;
}

