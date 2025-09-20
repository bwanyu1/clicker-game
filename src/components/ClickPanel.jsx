import React, { useEffect } from 'react';
import { useGame } from '../state/store';
import { formatNumber } from '../utils/number';

export default function ClickPanel() {
  const { click, state, setDataQ, clickPower, codingProgress, clickPowerBreakdown, buyClickSkill, getClickSkillLevel, clickSkillNextCost } = useGame();
  const cp = codingProgress();
  const nextPct = Math.max(0, Math.min(100, Math.floor((cp.xp / (cp.need||1)) * 100)));
  const br = clickPowerBreakdown();
  const skills = [
    { id:'micro_ops', name:'Micro-ops Fusion', hint:'手動クリック×1.10^Lv' },
    { id:'cache_prefetch', name:'Cache Prefetch', hint:'CXP +0.5/クリック/Lv' },
    { id:'thread_booster', name:'Thread Booster', hint:'自動クリック +0.2/s/Lv' },
  ];

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [click]);

  return (
    <div className="panel">
      <h2>Click</h2>
      <button
        className="clickBtn"
        onClick={click}
        aria-label="Gain Params"
        title={`1回のクリック内訳:\n(基礎 ${br.base} + カード ${br.cards} + CLv ${br.coding.toFixed(2)}) × クリックマニア ×${br.maniaMult.toFixed(0)} × Micro-ops ×${(Math.pow(1.10, (getClickSkillLevel?getClickSkillLevel('micro_ops'):0))).toFixed(2)}\n= 合計 ${clickPower().toFixed(2)}`}
      >
        <span>+{formatNumber(clickPower())} Params/Click</span>
      </button>
      <div className="row" style={{ marginTop: 10 }}>
        <span className="muted small">clickPower</span>
        <span className="pill">{formatNumber(clickPower())}</span>
        <span className="muted small">CLv</span>
        <span className="pill">{cp.level}</span>
        <span className="muted small">OPC</span>
        <span className="pill">{state.opcodePoints||0}</span>
        <span className="muted small">DataQ</span>
        <span className="pill">{Math.round((state.dataQ || 0) * 100)}%</span>
      </div>
      <div className="row small" style={{marginTop:8}}>
        <div className="grow">
          <div className="muted">次のCLvまで</div>
          <div className="gauge" style={{'--w': nextPct + '%'}}><i/></div>
        </div>
        <span className="pill small">{cp.xp}/{cp.need}</span>
      </div>
      <section style={{ marginTop: 12 }}>
        <h3 style={{ margin: '8px 0 6px', fontSize: 16 }}>クリック・エンジン強化（Opcode）</h3>
        <div className="shop">
          {skills.map(s => {
            const lvl = getClickSkillLevel(s.id);
            const cost = clickSkillNextCost(s.id);
            const can = (state.opcodePoints||0) >= cost;
            return (
              <div className="card" key={s.id}>
                <div className="meta">
                  <strong>{s.name}</strong>
                  <span className="small muted">{s.hint}</span>
                </div>
                <div className="row">
                  <span className="pill small">Lv {lvl}</span>
                  <span className="pill small">Cost: {cost} OPC</span>
                  <button className="buyBtn" disabled={!can} onClick={()=> buyClickSkill(s.id)}>購入</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="row small" style={{ marginTop: 8 }}>
        <span className="muted">DataQ調整</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((state.dataQ || 0) * 100)}
          onChange={(e) => setDataQ(Number(e.target.value) / 100)}
          style={{ width: 220 }}
        />
      </div>
    </div>
  );
}
