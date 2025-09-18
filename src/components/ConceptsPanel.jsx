import React from 'react';
import { useGame } from '../state/store';
import { CONCEPT_CARDS } from '../data/concepts';
import PackOpenModal from './PackOpenModal';

export default function ConceptsPanel(){
  const { state, openPack, openPacks, shardsToTicket } = useGame();
  const counts = React.useMemo(() => state.conceptCards || {}, [state.conceptCards]);
  const have = CONCEPT_CARDS.filter(c => counts[c.id] > 0);
  const notHave = CONCEPT_CARDS.filter(c => !counts[c.id]);
  const xp = state.conceptXP || 0;
  const pct = Math.round((xp / 60) * 100);
  const [modal, setModal] = React.useState({ open:false, phase:'charging', reveal:null, queue:0, snapshot:counts });

  // Detect which card increased after openPack
  React.useEffect(()=>{
    if (!modal.open) return;
    if (modal.phase !== 'waiting-reveal') return;
    const delta = diffCounts(modal.snapshot, counts);
    if (delta) {
      const card = CONCEPT_CARDS.find(c=> c.id === delta);
      setModal(m => ({ ...m, phase:'reveal', reveal: card }));
    }
  }, [counts, modal.open, modal.phase, modal.snapshot]);

  const startOpen = (n) => {
    if (!state.conceptTickets || state.conceptTickets < 1) return;
    setModal({ open:true, phase:'charging', reveal:null, queue:n, snapshot: { ...counts } });
    // sequence: charging -> burst -> call open
    setTimeout(()=> setModal(m=> ({ ...m, phase:'burst' })), 500);
    setTimeout(()=> {
      setModal(m => ({ ...m, phase:'waiting-reveal' }));
      openPack();
    }, 1100);
  };

  const next = () => {
    if (modal.queue > 1 && (state.conceptTickets||0) > 0) {
      // prepare next
      const snap = { ...counts };
      setModal({ open:true, phase:'charging', reveal:null, queue: modal.queue - 1, snapshot: snap });
      setTimeout(()=> setModal(m=> ({ ...m, phase:'burst' })), 400);
      setTimeout(()=> {
        setModal(m => ({ ...m, phase:'waiting-reveal' }));
        openPack();
      }, 900);
    } else {
      setModal({ open:false, phase:'charging', reveal:null, queue:0, snapshot:counts });
    }
  };
  return (
    <div className="panel">
      <h2>概念カード（思考実験）</h2>
      <div className="small muted" style={{marginBottom:8}}>放置中に思考実験が進行し、復帰時に <b>カードパック</b> を獲得します（最大8時間ぶん）。</div>
      <div className="row small" style={{marginBottom:10}}>
        <div className="grow">
          <div className="muted">次のカードまで</div>
          <div className="gauge" style={{'--w': pct + '%'}}><i/></div>
        </div>
        <span className="pill small">{xp}/60</span>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">Packs: {state.conceptTickets||0}</span>
        <span className="pill">Shards: {state.conceptShards||0}</span>
        <button className="btn primary" disabled={!state.conceptTickets} onClick={()=> startOpen(1)}>Open Pack</button>
        <button className="btn ghost" disabled={(state.conceptTickets||0) < 10} onClick={()=> startOpen(10)}>Open 10</button>
        <button className="btn ghost" disabled={(state.conceptTickets||0) < 50} onClick={()=> openPacks(50)}>Open 50 (Skip)</button>
        <button className="btn ghost" disabled={(state.conceptTickets||0) < 100} onClick={()=> openPacks(100)}>Open 100 (Skip)</button>
        <button className="btn ghost" disabled={(state.conceptTickets||0) < 1} onClick={()=> openPacks(state.conceptTickets||0)}>Open All (Skip)</button>
        <button className="btn ghost" disabled={(state.conceptShards||0) < 100} onClick={()=> shardsToTicket()}>100 Shards → 1 Pack</button>
      </div>
      {state.lastOpenSummary && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="meta">
            <strong>Bulk Open Result</strong>
            <span className="small muted">Opened: {state.lastOpenSummary.opened} / By Rarity: C{state.lastOpenSummary.rarity.C||0} U{state.lastOpenSummary.rarity.U||0} R{state.lastOpenSummary.rarity.R||0} L{state.lastOpenSummary.rarity.L||0}</span>
          </div>
        </div>
      )}
      <Section title={`所持カード ${have.length}/${CONCEPT_CARDS.length}`}> 
        {have.length === 0 ? <div className="small muted">まだカードはありません。</div> :
          <div className="shop">
            {have.map(c => (
              <div className="card" key={c.id}>
                <div className="meta">
                  <strong>{c.name}</strong>
                  <span className="small muted">{c.desc}</span>
                </div>
                <div className="row">
                  <span className="pill small">Rarity: {c.rarity}</span>
                  <span className="pill small">x{counts[c.id]||1}</span>
                </div>
              </div>
            ))}
          </div>
        }
      </Section>
      {notHave.length > 0 && (
        <Section title="未所持">
          <div className="shop">
            {notHave.map(c => (
              <div className="card" key={c.id} style={{opacity:.6}}>
                <div className="meta">
                  <strong>{c.name}</strong>
                  <span className="small muted">{c.desc}</span>
                </div>
                <div className="pill small">未獲得</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      <PackOpenModal
        open={modal.open}
        phase={modal.phase === 'reveal' ? 'reveal' : modal.phase}
        rarity={modal.reveal?.rarity}
        name={modal.reveal?.name}
        onNext={next}
        onClose={()=> setModal({ open:false, phase:'charging', reveal:null, queue:0, snapshot:counts })}
      />
    </div>
  );
}

function Section({ title, children }){
  return (
    <section style={{ marginBottom: 14 }}>
      <h3 style={{ margin: '8px 0 6px', fontSize: 16 }}>{title}</h3>
      {children}
    </section>
  );
}

function diffCounts(prev, cur){
  // return id whose count increased
  const ids = new Set([...Object.keys(prev||{}), ...Object.keys(cur||{})]);
  for (const id of ids){
    const a = prev?.[id]||0, b = cur?.[id]||0;
    if (b > a) return id;
  }
  return null;
}
