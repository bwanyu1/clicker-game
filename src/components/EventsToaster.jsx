import React from 'react';
import { useGame } from '../state/store';

export default function EventsToaster() {
  const { state } = useGame();
  return (
    <div style={{ position: 'fixed', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {state.activeEvents.map((ev) => (
        <div key={ev.id} className={`pill event ${cls(ev.type)}`}>
          <strong style={{ marginRight: 6 }}>{ev.type==='achieve' ? '[実績]': '[イベント]'}</strong>
          <span>
            {ev.type==='achieve' ? ev.note : label(ev.type)}
            {ev.type!=='achieve' && ` / 残り ${Math.ceil((ev.endsAt - Date.now()) / 1000)}s`}
          </span>
        </div>
      ))}
    </div>
  );
}

function label(type) {
  switch (type) {
    case 'paper_accept':
      return '論文採択: 全体×3';
    case 'gpu_sale':
      return 'GPU大量調達: GPU系コスト−25%';
    case 'sota_break':
      return 'SOTA更新: ConvNet系×2';
    case 'quest_boost':
      return 'クエスト報酬: 生産×1.2';
    case 'research_boost':
      return '研究: 生産×1.25';
    case 'focus_x2':
      return '生産フォーカス: 指定建物×2';
    case 'concept_award':
      return '思考実験: 概念カード獲得';
    default:
      return type;
  }
}

function cls(type){
  if (type === 'paper_accept') return 'paper';
  if (type === 'gpu_sale') return 'gpu';
  if (type === 'sota_break') return 'sota';
  return '';
}
