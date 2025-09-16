import React from 'react';

export default function PackOpenModal({ open, phase, rarity, name, onNext, onClose }){
  if (!open) return null;
  return (
    <div className="modalBackdrop" style={{ zIndex: 60 }}>
      <div className="pack-stage">
        {phase === 'charging' && <Charging />}
        {phase === 'burst' && <Burst />}
        {phase === 'reveal' && <Reveal rarity={rarity} name={name} />}
        <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          {phase === 'reveal' ? (
            <>
              <button className="btn ghost" onClick={onClose}>閉じる</button>
              <button className="btn primary" onClick={onNext}>次へ</button>
            </>
          ) : (
            <button className="btn ghost" onClick={onClose}>スキップ</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Charging(){
  return (
    <div className="pack">
      <div className="pack-glow" />
      <div className="pack-body" />
      <div className="scan" />
    </div>
  );
}

function Burst(){
  return (
    <div className="pack pack-burst">
      <div className="burst-ring" />
      <div className="burst-spark a" />
      <div className="burst-spark b" />
      <div className="burst-spark c" />
    </div>
  );
}

function Reveal({ rarity, name }){
  return (
    <div className={`card-reveal rarity-${(rarity||'C').toLowerCase()}`}>
      <div className="card-inner">
        <div className="title">{name || '???'}</div>
        <div className="rar">{rarity || 'C'}</div>
      </div>
    </div>
  );
}

