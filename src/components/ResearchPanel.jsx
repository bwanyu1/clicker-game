import React from 'react';
import { useGame } from '../state/store';
import { BUILDINGS } from '../data/buildings';

export default function ResearchPanel(){
  const { state, startResearchBoost } = useGame();
  const active = state.activeEvents?.some(e=> e.type==='research_boost' && e.endsAt > Date.now());
  const remaining = active ? Math.ceil((state.activeEvents.find(e=>e.type==='research_boost').endsAt - Date.now())/1000) : 0;
  const cost = 10000; // params
  return (
    <div className="panel">
      <h2>研究（短期バフ）</h2>
      <div className="row">
        <div className="grow small muted">60秒間、生産×1.25（購入時点の全体に適用）。</div>
        <button className="btn primary" disabled={active || state.params < cost} onClick={()=> startResearchBoost(cost, 60000)}>
          {active? `稼働中… ${remaining}s` : `購入（${cost.toLocaleString()} Params）`}
        </button>
      </div>
      <FocusX2 />
    </div>
  );
}

function FocusX2(){
  const { state } = useGame();
  const [target, setTarget] = React.useState(()=> availableIds(state)[0] || 'lab_1956');
  const focusActive = (id) => state.activeEvents?.some(e=> e.type==='focus_x2' && e.buildingId===id && e.endsAt > Date.now());
  const remaining = (id) => {
    const e = state.activeEvents?.find(e=> e.type==='focus_x2' && e.buildingId===id);
    return e ? Math.ceil((e.endsAt - Date.now())/1000) : 0;
  };
  const cost = 25000;
  const { startFocusX2 } = useGame();
  const ids = availableIds(state);
  React.useEffect(()=>{ if (!ids.includes(target) && ids.length) setTarget(ids[0]); }, [ids, target]);
  return (
    <div className="row" style={{ marginTop: 10 }}>
      <div className="grow">
        <div className="small muted">生産フォーカス x2（60秒・対象建物のみ）</div>
        <select value={target} onChange={(e)=> setTarget(e.target.value)} style={{ background:'#0b1329', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px' }}>
          {ids.map(id => <option key={id} value={id}>{nameOf(id)}</option>)}
        </select>
      </div>
      <button className="btn primary" disabled={focusActive(target) || state.params < cost} onClick={()=> startFocusX2(target, cost, 60000)}>
        {focusActive(target)? `稼働中… ${remaining(target)}s` : `購入（${cost.toLocaleString()} Params）`}
      </button>
    </div>
  );
}

function nameOf(id){ return (BUILDINGS.find(b=> b.id===id)?.name) || id; }
function availableIds(state){
  const order = ['1956','1958','1960s','2006','2012','2017','2018','2021'];
  const eraIdx = order.indexOf(state.eraId);
  return BUILDINGS.filter(b=> order.indexOf(b.era) <= eraIdx).map(b=> b.id);
}
