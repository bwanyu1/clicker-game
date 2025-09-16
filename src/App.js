import './App.css';
import { GameProvider, useGame } from './state/store';
import ClickPanel from './components/ClickPanel';
import BuildingsShop from './components/BuildingsShop/BuildingsShop';
import EraTimeline from './components/EraTimeline';
import PrestigeModal from './components/PrestigeModal';
import UpgradesShop from './components/UpgradesShop';
import EventsToaster from './components/EventsToaster';
import SettingsDebug from './components/SettingsDebug';
import { randomStoryForEra } from './data/stories';
import AIMotif from './components/AIMotif';
import AchievementsPanel from './components/AchievementsPanel';
import ResearchPanel from './components/ResearchPanel';
import AINetworkCanvas from './components/AINetworkCanvas';
import QuestsPanel from './components/QuestsPanel';
import Tabs from './components/Tabs';
import ParamTuningPanel from './components/ParamTuningPanel';
import HelpGlossary from './components/HelpGlossary';
import ConceptsPanel from './components/ConceptsPanel';
import { formatNumber } from './utils/number';
import React from 'react';

function Header() {
  const { state, paramsPerSec, computePerSec } = useGame();
  const [story, setStory] = React.useState('');
  const eraNext = nextEraTarget(state);
  const nextIns = nextInsightsTarget(state);
  React.useEffect(()=>{ applyEraTheme(state.eraId); }, [state.eraId]);
  // pick a story when era changes, and every 12s
  React.useEffect(() => {
    setStory(randomStoryForEra(state.eraId));
    const id = setInterval(() => setStory(randomStoryForEra(state.eraId)), 12000);
    return () => clearInterval(id);
  }, [state.eraId]);
  return (
    <div className="header">
      <div className="resbar">
        <span className="brand" title="AI Parameters Lab">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#31e6c9" strokeWidth="1.5"/>
            <path d="M7 12h10M12 7v10" stroke="#7c6bf2" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="3.2" stroke="#31e6c9" strokeWidth="1.5"/>
          </svg>
          <strong style={{letterSpacing:'.4px'}}>AI Lab</strong>
        </span>
        <span className="pill">Params: {formatNumber(state.params)} <span className="muted">(+{formatNumber(paramsPerSec())}/s)</span></span>
        <span className="pill">Compute: {formatNumber(state.compute)} <span className="muted">(+{formatNumber(computePerSec())}/s)</span></span>
        <span className="pill">Era: {state.eraId}</span>
        <span className="pill">Insights: {state.insights}</span>
        <span className="muted small">保存は30秒毎／Space/Enterでクリック</span>
      </div>
      <div className="row small" style={{ marginTop: 6 }}>
        {eraNext && (
          <div className="grow">
            <div className="muted">次Eraまで</div>
            <div className="gauge" style={{ '--w': eraNext.pct+'%' }}><i /></div>
          </div>
        )}
        {nextIns && (
          <div className="grow">
            <div className="muted">次Insights +1まで</div>
            <div className="gauge" style={{ '--w': nextIns.pct+'%' }}><i /></div>
          </div>
        )}
      </div>
      {story && (
        <div className="small" style={{ marginTop: 6 }}>
          <span className="story">{story}</span>
        </div>
      )}
    </div>
  );
}

function nextEraTarget(state){
  const order = ['1956','1958','1960s','2006','2012','2017'];
  const idx = order.indexOf(state.eraId);
  const eras = { '1958':500, '1960s':5000, '2006':200000, '2012':2500000, '2017':50000000 };
  const next = order[idx+1];
  if(!next) return null;
  const target = eras[next];
  const cur = state.totalParams || 0;
  const pct = Math.max(0, Math.min(100, (cur/target)*100));
  return { target, pct };
}

function nextInsightsTarget(state){
  const eraOrder = ['1956','1958','1960s','2006','2012','2017'];
  const idx = eraOrder.indexOf(state.eraId);
  const eraFactor = 1 + 0.05 * Math.max(0, idx - 2);
  const params = state.params || 0;
  const gain = Math.floor(Math.sqrt(params/1e6) * eraFactor);
  const nextGain = gain + 1;
  const target = 1e6 * Math.pow(nextGain/eraFactor, 2);
  if (!isFinite(target) || target<=0) return null;
  const pct = Math.max(0, Math.min(100, (params/target)*100));
  return { target, pct };
}

function applyEraTheme(eraId){
  const theme = eraTheme(eraId);
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-2', theme.accent2);
}

function eraTheme(era){
  switch(era){
    case '1956': return { accent:'#31e6c9', accent2:'#3ea8ff' };
    case '1958': return { accent:'#20e3b2', accent2:'#7c6bf2' };
    case '1960s': return { accent:'#26ffd3', accent2:'#58b4ff' };
    case '2006': return { accent:'#2ef2cb', accent2:'#9c6bff' };
    case '2012': return { accent:'#39ffcf', accent2:'#bb6bff' };
    case '2017': return { accent:'#4dffd7', accent2:'#ff6bd6' };
    default: return { accent:'#31e6c9', accent2:'#7c6bf2' };
  }
}

function Layout() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="app">
      <Header />
      <div className="layout">
        <div>
          <ClickPanel />
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="row">
              <div className="grow">
                <h2>プレステージ</h2>
                <p className="small muted">進行は任意にリセットできます（AIウィンター）。恒久通貨 Insights を獲得。</p>
              </div>
              <button className="btn" onClick={() => setOpen(true)}>プレステージ</button>
            </div>
          </div>
          <div style={{ height: 16 }} />
          <ResearchPanel />
          <EraTimeline />
        </div>
        <div>
          <RightTabs />
        </div>
      </div>
      <div className="footer small">AIパラメータ・クリッカー v0.1 MVP</div>
      <PrestigeModal open={open} onClose={() => setOpen(false)} />
      <EventsToaster />
    </div>
  );
}

function RightTabs(){
  const { state, setRightTab } = useGame();
  const idx = state.ui?.rightTab ?? 0;
  const items = [
    { label: 'ショップ', content: <BuildingsShop /> },
    { label: 'アップグレード', content: <UpgradesShop /> },
    { label: 'チューニング', content: <ParamTuningPanel /> },
    { label: 'カード', content: <ConceptsPanel /> },
    { label: 'クエスト', content: <QuestsPanel /> },
    { label: '実績', content: <AchievementsPanel /> },
    { label: '設定', content: <SettingsDebug /> },
    { label: 'ヘルプ', content: <HelpGlossary /> },
  ];
  return <Tabs value={idx} onChange={setRightTab} items={items} />;
}

export default function App() {
  return (
    <GameProvider>
      <AIMotif />
      <AINetworkCanvas />
      <div className="scanlines" />
      <Layout />
    </GameProvider>
  );
}
