import React from 'react';
import { useGame } from '../state/store';
import { formatNumber } from '../utils/number';

export default function PrestigeModal({ open, onClose }) {
  const { calcPrestigeGain, doPrestige } = useGame();
  if (!open) return null;
  const gain = calcPrestigeGain();
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>AIウィンター（プレステージ）</h3>
        <p className="muted">任意のリセットです。<br/>現在保有している Params に応じて Insights を獲得します。</p>
        <p>獲得予定 Insights: <strong>{formatNumber(gain)}（初回は+10ボーナス）</strong></p>
        <div className="actions">
          <button className="btn ghost" onClick={onClose}>キャンセル</button>
          <button className="btn danger" onClick={() => { doPrestige(); onClose(); }}>リセットして獲得</button>
        </div>
      </div>
    </div>
  );
}
