import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { BUILDINGS, BUILDING_MAP } from '../data/buildings';
import { ERAS, nextEra, eraIndexById } from '../data/eras';
import { clamp } from '../utils/number';
import { saveState, loadState } from '../utils/storage';
import { UPGRADE_MAP } from '../data/upgrades';
import { ACHIEVEMENTS } from '../data/achievements';
import { CONCEPT_CARDS } from '../data/concepts';
import { QUESTS } from '../data/quests';
import { ARTIFACTS, ARTIFACT_MAP, ARTIFACT_SLOTS, ARTIFACT_RARITIES, ARTIFACT_ADD_SCALE, ARTIFACT_MULT_GT1_SCALE, ARTIFACT_MULT_LT1_SCALE } from '../data/artifacts';
import { DATA_Q_COST_MULTIPLIER, DATA_Q_OPPOSITION_FLOOR, CODING_XP_PER_CLICK, CODING_XP_BASE, CODING_XP_GROWTH, CODING_CLICK_POWER_PER_LEVEL, OPC_POINTS_PER_LEVEL } from '../config/balance';
import { CLICK_SKILL_MAP } from '../data/click_skills';
import { ASC_NODE_MAP } from '../data/ascension';
import { DUNGEON_MAP } from '../data/dungeons';

const initialState = {
  params: 0,
  compute: 0,
  data: 0,
  dataQ: 0.0,
  eraId: ERAS[0].id,
  totalParams: 0,
  insights: 0,
  buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, { count: 0 }])),
  upgrades: {}, // { [upgradeId]: level }
  achievements: new Set(),
  questsClaimed: new Set(),
  lastSavedAt: Date.now(),
  activeEvents: [], // [{id, type, endsAt}]
  ui: { buyQty: 1 },
  paramUpgrades: {}, // { [buildingId]: tier }
  conceptXP: 0,           // 思考実験の進捗（60でカード1枚）
  conceptCards: {},
  conceptTickets: 0,
  conceptShards: 0,
  codingXP: 0,
  codingLevel: 0,
  opcodePoints: 0,
  clickSkills: {}, // { [skillId]: level }
  artifacts: {}, // { [artifactKey]: count } where artifactKey = `${id}@${rar}`
  equippedArtifacts: {}, // { [slot]: artifactKey }
  lastOpenSummary: null,
  dungeon: null, // { id, status: 'running'|'completed', startedAt, endsAt, rewards? }
  ascensionPoints: 0,
  ascensionNodes: {},
};

function initState() {
  try {
    const s = loadState();
    if (!s) return initialState;
    // offline catch-up
    const now = Date.now();
    const elapsed = Math.min(8 * 3600, Math.floor((now - (s.lastSavedAt || now)) / 1000));
    let tmp = { ...initialState, ...s };
    // migrate upgrades Set/Array -> map
    if (!tmp.upgrades || tmp.upgrades instanceof Set || Array.isArray(tmp.upgrades)) {
      const map = {};
      if (tmp.upgrades instanceof Set) tmp.upgrades.forEach(id => map[id]=(map[id]||0)+1);
      if (Array.isArray(tmp.upgrades)) for (const id of tmp.upgrades) map[id]=(map[id]||0)+1;
      tmp.upgrades = map;
    }
    if (elapsed > 0) {
      const pps = totalParamsPerSec(tmp);
      const cps = computePerSec(tmp);
      tmp.params += pps * elapsed;
      tmp.totalParams += pps * elapsed;
      tmp.compute += cps * elapsed;
      // 思考実験: オフライン進行→カードパック（チケット）
      const eraIdx = eraIndexById(tmp.eraId);
      const xpGain = Math.floor(elapsed * (0.3 + 0.1 * Math.max(0, eraIdx))); // 秒×係数
      if (xpGain > 0) {
        let xp = (tmp.conceptXP || 0) + xpGain;
        const awards = Math.floor(xp / 60);
        xp = xp % 60;
        tmp.conceptXP = xp;
        if (awards > 0) {
          tmp.conceptTickets = (tmp.conceptTickets || 0) + awards;
          tmp.activeEvents = [ ...(tmp.activeEvents||[]), { id:`ticket-${now}`, type:'concept_award', note:`カードパック +${awards}`, endsAt: now + 8000 } ];
        }
      }
    }
    return tmp;
  } catch {
    return initialState;
  }
}

function calcGlobalAddPct(state) {
  // Building-defined global additive bonuses, with optional diminishing returns
  let add = 0;
  for (const b of BUILDINGS) {
    const cnt = state.buildings[b.id]?.count || 0;
    const base = b.globalAddPct || 0;
    if (!base || cnt <= 0) continue;
    const r = b.globalAddDecay;
    if (typeof r === 'number' && r > 0 && r < 1) {
      // sum of geometric series: base * (1 - r^cnt) / (1 - r)
      add += base * (1 - Math.pow(r, cnt)) / (1 - r);
    } else {
      // default: first copy only
      add += base;
    }
  }
  // Insights: 深層効率化 +10% per level
  {
    const lvl = getUpgradeLevel(state, 'deep_efficiency');
    if (lvl > 0) add += 0.10 * lvl;
  }
  // 概念カード: 加算ボーナス
  add += conceptProdAddPct(state);
  // アーティファクト: 加算ボーナス
  add += artifactProdAddPct(state);
  // 論文採択イベント: 全体×3 は乗算扱いにし、別でmultに反映するためここでは加算しない
  return add;
}

function calcSynergyMult(state, b) {
  let mult = 1;
  const s = b.synergy;
  if (s && state.buildings[s.with]?.count > 0) {
    mult *= s.mult || 1;
  }
  // イベント: SOTA更新 → ConvNet系×2
  if (b.id === 'convnet_2012' && hasEvent(state, 'sota_break')) mult *= 2;
  // イベント: 論文採択 → 全体×3（ここで乗算）
  if (hasEvent(state, 'paper_accept')) mult *= 3;
  // 建物フォーカスx2
  if (hasFocusX2(state, b.id)) mult *= 2;
  // 恒久アップグレード: building-specific multipliers
  mult *= buildingPermanentMult(state, b.id);
  // アーティファクト: building-specific multipliers
  mult *= artifactBuildingMult(state, b.id);
  // アセンド: building-specific multipliers
  mult *= ascBuildingMult(state, b.id);
  return mult;
}

function effectiveRate(state, b) {
  const base = b.baseRate;
  const addPct = calcGlobalAddPct(state); // additive
  const dataQ = state.dataQ || 0;
  let rate = base;
  // DataQ effect across buildings via dataQAffinity (0..1 typical)
  if (b.dataQAffinity) {
    rate *= 1 + dataQ * b.dataQAffinity;
  } else if (b.rateFormula === 'base*(1+dataQ)') {
    // backward compatibility if any leftover definitions exist
    rate = base * (1 + dataQ);
  }
  // Trade-off: classic/symbolic lines lose efficiency as DataQ rises
  if (b.dataQOpposition) {
    const opp = Math.max(DATA_Q_OPPOSITION_FLOOR, 1 - dataQ * b.dataQOpposition);
    rate *= opp;
  }
  rate *= 1 + addPct; // add then apply mult
  if (hasEvent(state, 'research_boost')) rate *= 1.25;
  if (hasEvent(state, 'quest_boost')) rate *= 1.2;
  rate *= conceptRateMult(state);
  rate *= artifactRateMult(state);
  rate *= ascRateMult(state);
  rate *= calcSynergyMult(state, b);
  return rate;
}

function totalParamsPerSec(state) {
  return BUILDINGS.reduce((sum, b) => sum + (state.buildings[b.id]?.count || 0) * effectiveRate(state, b), 0);
}

function computePerSec(state) {
  let sum = BUILDINGS.reduce((s, b) => s + (state.buildings[b.id]?.count || 0) * (b.produces?.compute || 0), 0);
  // Insights: クラウド最適化（Compute産出×）
  {
    const lvl = getUpgradeLevel(state, 'cloud_optimization');
    if (lvl > 0) {
      const mult = (UPGRADE_MAP['cloud_optimization']?.effects?.computeRateMult) || 1.5;
      sum *= Math.pow(mult, lvl);
    }
  }
  // アーティファクト: Compute産出×
  sum *= artifactComputeRateMult(state);
  // アセンド: Compute産出（将来拡張用）
  sum *= ascComputeRateMult(state);
  return sum;
}

function coreClickPower(state) {
  // 基礎クリック＋カード加算 → クリックマニアで×2^Lv
  let p = 1 + conceptClickAdd(state);
  const lvl = getUpgradeLevel(state, 'clicker_mania');
  if (lvl > 0) p *= Math.pow(2, lvl);
  return p;
}

function clickPower(state) {
  // 手動クリック用: (基礎 + カード + CLv加算) × 2^Lv(clicker_mania)
  const br = clickPowerBreakdown(state);
  // skill: micro_ops adds multiplicative manual multiplier
  const sLvl = getSkillLevel(state, 'micro_ops');
  const mult = sLvl > 0 ? Math.pow(CLICK_SKILL_MAP['micro_ops'].effects.manualMultPerLevel || 1, sLvl) : 1;
  return br.total * mult;
}

function clickPowerBreakdown(state){
  const base = 1;
  const cards = conceptClickAdd(state);
  const coding = (state.codingLevel || 0) * CODING_CLICK_POWER_PER_LEVEL;
  const arti = artifactClickAdd(state);
  const sum = base + cards + coding + arti;
  const maniaLvl = getUpgradeLevel(state, 'clicker_mania');
  const maniaMult = maniaLvl > 0 ? Math.pow(2, maniaLvl) : 1;
  const total = sum * maniaMult;
  return { base, cards, coding, sum, maniaLvl, maniaMult, total };
}

function nextCostWithMods(state, b, count) {
  const cost = {};
  const gp = b.costGrowth?.params || 1;
  const gc = b.costGrowth?.compute || 1;
  if (b.baseCost.params) cost.params = Math.ceil(b.baseCost.params * Math.pow(gp, count));
  if (b.baseCost.compute) cost.compute = Math.ceil(b.baseCost.compute * Math.pow(gc, count));
  // Bootstrap: allow buying the very first GPU without compute cost
  if (b.id === 'gpu_2009' && count === 0) {
    cost.compute = 0;
  }
  // Insights: Computeコスト減
  if (cost.compute) {
    const lvl = getUpgradeLevel(state, 'industrial_lessons');
    const mult = lvl > 0 ? Math.pow(0.85, lvl) : 1;
    cost.compute = Math.ceil(cost.compute * mult);
    // アーティファクト: Computeコスト乗算
    cost.compute = Math.ceil(cost.compute * artifactComputeCostMult(state));
  }
  // 概念カード: Paramsコスト減
  if (cost.params) {
    const m = conceptParamsCostMult(state);
    const ma = artifactParamsCostMult(state);
    cost.params = Math.ceil(cost.params * m * ma * ascParamsCostMult(state));
  }
  // イベント: GPU大量調達 → GPUリグのParams/Computeコスト−25%
  if (b.id === 'gpu_2009' && hasEvent(state, 'gpu_sale')) {
    if (cost.params) cost.params = Math.ceil(cost.params * 0.75);
    if (cost.compute) cost.compute = Math.ceil(cost.compute * 0.75);
  }
  // Trade-off: data-driven lines become costlier as DataQ rises (Paramsのみ)
  if (b.dataQAffinity && cost.params) {
    const dm = 1 + (state.dataQ || 0) * DATA_Q_COST_MULTIPLIER;
    cost.params = Math.ceil(cost.params * dm);
  }
  return cost;
}

function seriesCost(state, b, startCount, qty) {
  // iterative sum to match per-item ceil and dual currencies
  let params = 0;
  let compute = 0;
  for (let i = 0; i < qty; i++) {
    const c = nextCostWithMods(state, b, startCount + i);
    params += c.params || 0;
    compute += c.compute || 0;
  }
  return { params, compute };
}

function maxAffordableCount(state, id) {
  const b = BUILDING_MAP[id];
  const current = state.buildings[id]?.count || 0;
  let low = 0, high = 1;
  // exponential search to find an upper bound
  while (true) {
    const cost = seriesCost(state, b, current, high);
    if (cost.params <= state.params && cost.compute <= state.compute) {
      low = high;
      high *= 2;
      if (high > 1e6) break;
    } else break;
  }
  // binary search between low (affordable) and high (maybe not)
  let l = low, r = high;
  while (l < r) {
    const mid = Math.ceil((l + r + 1) / 2);
    const cost = seriesCost(state, b, current, mid);
    if (cost.params <= state.params && cost.compute <= state.compute) l = mid; else r = mid - 1;
  }
  return l;
}

function canAfford(state, cost) {
  const okParams = (cost.params || 0) <= state.params;
  const okCompute = (cost.compute || 0) <= state.compute;
  return okParams && okCompute;
}

function spend(state, cost) {
  return { ...state, params: state.params - (cost.params || 0), compute: state.compute - (cost.compute || 0) };
}

function calcPrestigeGain(state) {
  // 現在保有しているParams量に基づく獲得量
  const current = state.params || 0;
  const idx = eraIndexById(state.eraId);
  const eraFactor = 1 + 0.05 * Math.max(0, idx - 2);
  const base = Math.floor(Math.sqrt(current / 1e6) * eraFactor);
  return base;
}

const GameContext = createContext(null);

function codingXpNeededFor(level){
  return Math.ceil(CODING_XP_BASE * Math.pow(CODING_XP_GROWTH, level));
}

function reducer(state, action) {
  // normalize/migrate legacy shapes
  if (!state.upgrades || state.upgrades instanceof Set || Array.isArray(state.upgrades)) {
    const map = {};
    if (state.upgrades instanceof Set) state.upgrades.forEach(id => map[id]=(map[id]||0)+1);
    if (Array.isArray(state.upgrades)) for (const id of state.upgrades) map[id]=(map[id]||0)+1;
    state = { ...state, upgrades: map };
  }
  if (!state.achievements) state = { ...state, achievements: new Set() };
  if (!state.questsClaimed) state = { ...state, questsClaimed: new Set() };
  if (!state.activeEvents) state = { ...state, activeEvents: [] };
  if (!state.paramUpgrades) state = { ...state, paramUpgrades: {} };
  if (!('artifacts' in state)) state = { ...state, artifacts: {} };
  if (!('equippedArtifacts' in state)) state = { ...state, equippedArtifacts: {} };
  // migrate artifact keys: plain id -> id@C, equipped plain -> @C
  if (state.artifacts && typeof state.artifacts === 'object') {
    const next = {};
    for (const k of Object.keys(state.artifacts)) {
      const v = state.artifacts[k] || 0;
      if (!v) continue;
      const key = (k.includes('@') ? k : `${k}@C`);
      next[key] = (next[key]||0) + v;
    }
    state = { ...state, artifacts: next };
  }
  if (state.equippedArtifacts && typeof state.equippedArtifacts === 'object') {
    const eq = {};
    for (const slot in state.equippedArtifacts) {
      const id = state.equippedArtifacts[slot];
      if (!id) continue;
      eq[slot] = id.includes('@') ? id : `${id}@C`;
    }
    state = { ...state, equippedArtifacts: eq };
  }
  if (state.conceptCards && Array.isArray(state.conceptCards)) {
    const obj = {}; for (const id of state.conceptCards) obj[id]=(obj[id]||0)+1; state = { ...state, conceptCards: obj };
  }
  if (!state.conceptCards || state.conceptCards instanceof Set) state = { ...state, conceptCards: (state.conceptCards instanceof Set ? Object.fromEntries(Array.from(state.conceptCards).map(id=>[id,1])) : {}) };
  if (!('conceptXP' in state)) state = { ...state, conceptXP: 0 };
  if (!('conceptTickets' in state)) state = { ...state, conceptTickets: 0 };
  if (!('conceptShards' in state)) state = { ...state, conceptShards: 0 };
  if (!('codingXP' in state)) state = { ...state, codingXP: 0 };
  if (!('codingLevel' in state)) state = { ...state, codingLevel: 0 };
  if (!('opcodePoints' in state)) state = { ...state, opcodePoints: 0 };
  if (!('clickSkills' in state)) state = { ...state, clickSkills: {} };
  if (!('ascensionPoints' in state)) state = { ...state, ascensionPoints: 0 };
  if (!('ascensionNodes' in state)) state = { ...state, ascensionNodes: {} };
  switch (action.type) {
    case 'TICK': {
      const dt = action.dt;
      const pps = totalParamsPerSec(state);
      const cps = computePerSec(state);
      // auto clicker from upgrades（手動ボーナスは除外）
      let clickAuto = 0;
      {
        const lvl = getUpgradeLevel(state, 'auto_clicker');
        if (lvl > 0) clickAuto += coreClickPower(state) * dt * lvl; // lvl clicks/sec
        // skill: thread_booster adds extra auto clicks per sec
        const sLvl = getSkillLevel(state, 'thread_booster');
        if (sLvl > 0) clickAuto += coreClickPower(state) * dt * (0.2 * sLvl);
      }
      const paramsGain = pps * dt;
      const computeGain = cps * dt;
      const params = state.params + paramsGain + clickAuto;
      const totalParams = state.totalParams + paramsGain + clickAuto;
      // Auto-clicks also grant Coding XP (including Thread Booster contribution)
      let codingXP = state.codingXP || 0;
      let codingLevel = state.codingLevel || 0;
      let opcodePoints = state.opcodePoints || 0;
      const cpp = Math.max(1e-9, coreClickPower(state));
      const autoClicks = clickAuto / cpp; // number of implicit clicks this tick
      if (autoClicks > 0) {
        const cxpPerClick = CODING_XP_PER_CLICK * cxpUpgradeMult(state);
        codingXP += autoClicks * cxpPerClick;
        while (codingXP >= codingXpNeededFor(codingLevel)) {
          codingXP -= codingXpNeededFor(codingLevel);
          codingLevel += 1;
          opcodePoints += OPC_POINTS_PER_LEVEL;
        }
      }
      // Era progress
      let eraId = state.eraId;
      const nxt = nextEra(eraId);
      if (nxt && totalParams >= nxt.threshold) {
        eraId = nxt.id;
      }
      return { ...state, params, totalParams, compute: state.compute + computeGain, eraId, __ppsCache: pps, codingXP, codingLevel, opcodePoints };
    }
    case 'CLICK': {
      const gain = clickPower(state);
      // Coding XP（手動クリックのみ）
      const cxpBonus = getSkillLevel(state, 'cache_prefetch') * (CLICK_SKILL_MAP['cache_prefetch'].effects.cxpAddPerClick || 0);
      let cxpGain = CODING_XP_PER_CLICK + cxpBonus;
      // Insights: CXP研修プログラム（乗算）
      {
        const lvl = getUpgradeLevel(state, 'cxp_curriculum');
        if (lvl > 0) {
          const mult = (UPGRADE_MAP['cxp_curriculum']?.effects?.cxpMult) || 1.25;
          cxpGain *= Math.pow(mult, lvl);
        }
      }
      let codingXP = (state.codingXP || 0) + cxpGain;
      let codingLevel = state.codingLevel || 0;
      let opcodePoints = state.opcodePoints || 0;
      while (codingXP >= codingXpNeededFor(codingLevel)) {
        codingXP -= codingXpNeededFor(codingLevel);
        codingLevel += 1;
        opcodePoints += OPC_POINTS_PER_LEVEL;
      }
      return { ...state, params: state.params + gain, totalParams: state.totalParams + gain, codingXP, codingLevel, opcodePoints };
    }
    case 'BUY': {
      const b = BUILDING_MAP[action.id];
      const count = state.buildings[b.id]?.count || 0;
      const cost = nextCostWithMods(state, b, count);
      if (!canAfford(state, cost)) return state;
      const afterSpend = spend(state, cost);
      return {
        ...afterSpend,
        buildings: { ...afterSpend.buildings, [b.id]: { count: count + 1 } },
      };
    }
    case 'BUY_MANY': {
      const b = BUILDING_MAP[action.id];
      const current = state.buildings[b.id]?.count || 0;
      let qty = Math.max(1, action.qty | 0);
      const cost = seriesCost(state, b, current, qty);
      if (!canAfford(state, cost)) return state;
      const afterSpend = spend(state, cost);
      return {
        ...afterSpend,
        buildings: { ...afterSpend.buildings, [b.id]: { count: current + qty } },
      };
    }
    case 'BUY_PARAM_UPGRADE': {
      const b = BUILDING_MAP[action.id];
      if (!b) return state;
      const tier = state.paramUpgrades[b.id] || 0;
      const cost = paramUpgradeCost(b, tier);
      if (state.params < cost) return state;
      return {
        ...state,
        params: state.params - cost,
        paramUpgrades: { ...state.paramUpgrades, [b.id]: tier + 1 },
      };
    }
    case 'SAVE_MARK': {
      return { ...state, lastSavedAt: Date.now() };
    }
    case 'SET_DATAQ': {
      return { ...state, dataQ: clamp(action.value, 0, 1) };
    }
    case 'SET_BUY_QTY': {
      const v = [1,10,100].includes(action.value) ? action.value : 1;
      return { ...state, ui: { ...state.ui, buyQty: v } };
    }
    case 'CYCLE_BUY_QTY': {
      const order = [1,10,100];
      const i = order.indexOf(state.ui.buyQty);
      const next = order[(i+1)%order.length];
      return { ...state, ui: { ...state.ui, buyQty: next } };
    }
    case 'SET_RIGHT_TAB': {
      return { ...state, ui: { ...state.ui, rightTab: action.value|0 } };
    }
    case 'BUY_UPGRADE': {
      const u = UPGRADE_MAP[action.id];
      if (!u) return state;
      const level = getUpgradeLevel(state, u.id);
      const cost = upgradeCost(u, level);
      if (state.insights < cost) return state;
      const next = { ...state.upgrades, [u.id]: level + 1 };
      return { ...state, insights: state.insights - cost, upgrades: next };
    }
    case 'BUY_CLICK_SKILL': {
      const s = CLICK_SKILL_MAP[action.id];
      if (!s) return state;
      const level = getSkillLevel(state, s.id);
      const cost = clickSkillCost(s, level);
      if ((state.opcodePoints || 0) < cost) return state;
      const next = { ...(state.clickSkills||{}), [s.id]: level + 1 };
      return { ...state, clickSkills: next, opcodePoints: (state.opcodePoints||0) - cost };
    }
    case 'DO_PRESTIGE': {
      const gain = calcPrestigeGain(state) + (state.insights === 0 ? 10 : 0);
      return {
        ...initialState,
        // persistent upgrades stay after prestige
        upgrades: { ...state.upgrades },
        achievements: new Set(state.achievements),
        insights: state.insights + gain,
        lastSavedAt: Date.now(),
        // 概念カードは永続（思考の蓄積）
        conceptCards: Array.isArray(state.conceptCards) || state.conceptCards instanceof Set ? state.conceptCards : { ...state.conceptCards },
        conceptXP: state.conceptXP,
        // アーティファクトは永続
        artifacts: { ...(state.artifacts || {}) },
        equippedArtifacts: { ...(state.equippedArtifacts || {}) },
        ascensionPoints: state.ascensionPoints,
        ascensionNodes: { ...(state.ascensionNodes||{}) },
      };
    }
    case 'ASCEND': {
      const cost = Math.max(100, action.cost | 0 || 100);
      if ((state.insights||0) < cost) return state;
      return {
        ...initialState,
        upgrades: { ...state.upgrades },
        achievements: new Set(state.achievements),
        insights: (state.insights||0) - cost,
        lastSavedAt: Date.now(),
        conceptCards: Array.isArray(state.conceptCards) || state.conceptCards instanceof Set ? state.conceptCards : { ...state.conceptCards },
        conceptXP: state.conceptXP,
        artifacts: { ...(state.artifacts || {}) },
        equippedArtifacts: { ...(state.equippedArtifacts || {}) },
        ascensionPoints: (state.ascensionPoints||0) + 1,
        ascensionNodes: { ...(state.ascensionNodes||{}) },
      };
    }
    case 'ASC_NODE_BUY': {
      const id = action.id; const node = ASC_NODE_MAP[id]; if (!node) return state;
      if (state.ascensionNodes?.[id]) return state;
      const ap = state.ascensionPoints || 0; const need = node.cost || 1;
      if (ap < need) return state;
      const req = node.req || [];
      for (const r of req){ if (!state.ascensionNodes?.[r]) return state; }
      const branch = node.branch || 'misc';
      if (branch !== 'misc') {
        for (const k in (state.ascensionNodes||{})){
          if (state.ascensionNodes[k] && (ASC_NODE_MAP[k]?.branch) === branch) return state;
        }
      }
      const nodes = { ...(state.ascensionNodes||{}), [id]: true };
      return { ...state, ascensionPoints: ap - need, ascensionNodes: nodes };
    }
    case 'ACH_UNLOCK': {
      if (state.achievements.has(action.id)) return state;
      const next = new Set(state.achievements); next.add(action.id);
      const ac = ACHIEVEMENTS.find(a => a.id === action.id);
      const note = ac ? ac.name : '実績解放';
      return { ...state, achievements: next, activeEvents: [...state.activeEvents, { id: `ach-${action.id}-${Date.now()}`, type: 'achieve', endsAt: Date.now() + 8000, note }] };
    }
    case 'QUEST_CLAIM': {
      const q = QUESTS.find(x=> x.id === action.id);
      if (!q) return state;
      if (state.questsClaimed.has(q.id)) return state;
      const nextClaimed = new Set(state.questsClaimed); nextClaimed.add(q.id);
      let next = { ...state, questsClaimed: nextClaimed };
      if (q.reward?.params) {
        next.params += q.reward.params; next.totalParams += q.reward.params;
      }
      if (q.reward?.buff?.type === 'quest_boost') {
        const seconds = q.reward.buff.seconds || 60;
        next = { ...next, activeEvents: [...next.activeEvents, { id:`qb-${Date.now()}`, type:'quest_boost', endsAt: Date.now()+seconds*1000 }] };
      }
      return next;
    }
    case 'EVENT_ADD': {
      const ev = action.event;
      // avoid duplicates of same type
      if (state.activeEvents.some((e) => e.type === ev.type)) return state;
      return { ...state, activeEvents: [...state.activeEvents, ev] };
    }
    case 'EVENT_CLEAN': {
      const now = Date.now();
      const act = state.activeEvents.filter((e) => e.endsAt > now);
      return act.length === state.activeEvents.length ? state : { ...state, activeEvents: act };
    }
    case 'RESEARCH_BOOST': {
      const cost = action.cost || 10000;
      if (state.params < cost) return state;
      const nextEvents = [...state.activeEvents.filter(e=>e.type!=='research_boost'), { id:`rb-${Date.now()}`, type:'research_boost', endsAt: Date.now()+ (action.durationMs||60000) }];
      return { ...state, params: state.params - cost, totalParams: state.totalParams - cost, activeEvents: nextEvents };
    }
    case 'DUNGEON_START': {
      if (state.dungeon && state.dungeon.status === 'running') return state;
      const d = DUNGEON_MAP[action.id];
      if (!d) return state;
      const costP = d.cost?.params || 0;
      const costC = d.cost?.compute || 0;
      if ((state.params||0) < costP || (state.compute||0) < costC) return state;
      const now = Date.now();
      const run = { id: d.id, status: 'running', startedAt: now, endsAt: now + d.durationSec*1000 };
      return { ...state, params: state.params - costP, totalParams: state.totalParams - costP, compute: state.compute - costC, dungeon: run };
    }
    case 'DUNGEON_TICK': {
      const d = state.dungeon; if (!d || d.status !== 'running') return state;
      if (Date.now() < d.endsAt) return state;
      // complete and roll rewards now
      const def = DUNGEON_MAP[d.id]; if (!def) return { ...state, dungeon: null };
      const rewards = rollDungeonRewards(def);
      const ev = { id:`dg-${Date.now()}`, type:'concept_award', note:`${def.name} クリア！報酬を受け取れます`, endsAt: Date.now()+10000 };
      return { ...state, dungeon: { ...d, status:'completed', rewards }, activeEvents: [...state.activeEvents, ev] };
    }
    case 'DUNGEON_CLAIM': {
      const d = state.dungeon; if (!d || d.status !== 'completed') return state;
      const def = DUNGEON_MAP[d.id]; if (!def) return { ...state, dungeon: null };
      // apply rewards
      let next = { ...state };
      if (d.rewards?.shards) next.conceptShards = (next.conceptShards||0) + (d.rewards.shards||0);
      if (Array.isArray(d.rewards?.artifacts)) {
        const inv = { ...(next.artifacts||{}) };
        for (const key of d.rewards.artifacts){ inv[key] = (inv[key]||0) + 1; }
        next.artifacts = inv;
      }
      next.dungeon = null;
      return next;
    }
    case 'FOCUS_X2': {
      const buildingId = action.buildingId;
      const cost = action.cost || 25000;
      const duration = action.durationMs || 60000;
      if (!BUILDING_MAP[buildingId]) return state;
      if (state.params < cost) return state;
      // replace existing focus for this building
      const filtered = state.activeEvents.filter(e => !(e.type==='focus_x2' && e.buildingId===buildingId));
      const ev = { id:`fx2-${buildingId}-${Date.now()}`, type:'focus_x2', buildingId, endsAt: Date.now()+duration };
      return { ...state, params: state.params - cost, totalParams: state.totalParams - cost, activeEvents: [...filtered, ev] };
    }
    case 'OPEN_PACK': {
      if ((state.conceptTickets||0) <= 0) return state;
      const pick = rollConcept(state.conceptCards);
      const cards = { ...(state.conceptCards||{}) };
      cards[pick.id] = (cards[pick.id]||0) + 1;
      const tickets = (state.conceptTickets||0) - 1;
      const events = [...state.activeEvents, { id:`new-${Date.now()}`, type:'concept_award', note:`カード: ${pick.name} ×${cards[pick.id]}`, endsAt: Date.now()+8000 }];
      return { ...state, conceptTickets: tickets, conceptCards: cards, activeEvents: events };
    }
    case 'OPEN_MANY': {
      let want = Math.max(1, action.count | 0);
      const have = state.conceptTickets || 0;
      const k = Math.min(want, have);
      if (k <= 0) return state;
      const cards = { ...(state.conceptCards || {}) };
      const delta = {};
      const rarity = { C:0, U:0, R:0, L:0 };
      for (let i=0;i<k;i++){
        const pick = rollConcept(cards);
        cards[pick.id] = (cards[pick.id]||0) + 1;
        delta[pick.id] = (delta[pick.id]||0) + 1;
        rarity[pick.rarity] = (rarity[pick.rarity]||0) + 1;
      }
      const tickets = have - k;
      const note = `Packs x${k}: C${rarity.C||0}/U${rarity.U||0}/R${rarity.R||0}/L${rarity.L||0}`;
      const events = [...state.activeEvents, { id:`bulk-${Date.now()}`, type:'concept_award', note, endsAt: Date.now()+6000 }];
      return { ...state, conceptTickets: tickets, conceptCards: cards, activeEvents: events, lastOpenSummary: { opened:k, rarity, delta } };
    }
    case 'SHARDS_TO_TICKET': {
      if ((state.conceptShards||0) < 100) return state;
      return { ...state, conceptShards: state.conceptShards - 100, conceptTickets: (state.conceptTickets||0) + 1 };
    }
    case 'ARTI_DISCOVER': {
      const cost = action.cost || 1e6;
      if ((state.params || 0) < cost) return state;
      const art = randomArtifact();
      const key = artiKey(art.id, 'C');
      const inv = { ...(state.artifacts || {}) };
      inv[key] = (inv[key] || 0) + 1;
      const note = `${art.name} [C] を発見！`;
      return { ...state, params: state.params - cost, totalParams: state.totalParams - cost, artifacts: inv, activeEvents: [...state.activeEvents, { id:`arti-${Date.now()}`, type:'concept_award', note, endsAt: Date.now() + 6000 }] };
    }
    case 'ARTI_EQUIP': {
      const key = action.key; const { id } = parseArtiKey(key);
      const a = ARTIFACT_MAP[id]; if (!a) return state;
      const have = (state.artifacts?.[key] || 0);
      if (have <= 0) return state;
      const slot = a.slot;
      const equipped = { ...(state.equippedArtifacts || {}) };
      const inv = { ...(state.artifacts || {}) };
      const prev = equipped[slot];
      equipped[slot] = key;
      inv[key] = Math.max(0, (inv[key]||0) - 1);
      if (prev) inv[prev] = (inv[prev] || 0) + 1;
      return { ...state, equippedArtifacts: equipped, artifacts: inv };
    }
    case 'ARTI_UNEQUIP': {
      const slot = action.slot; if (!slot) return state;
      const equipped = { ...(state.equippedArtifacts || {}) };
      const key = equipped[slot]; if (!key) return state;
      const inv = { ...(state.artifacts || {}) };
      inv[key] = (inv[key] || 0) + 1;
      delete equipped[slot];
      return { ...state, equippedArtifacts: equipped, artifacts: inv };
    }
    case 'ARTI_COMBINE': {
      const key = action.key;
      const { id, rar } = parseArtiKey(key);
      const idx = ARTIFACT_RARITIES.indexOf(rar);
      if (idx < 0 || idx >= ARTIFACT_RARITIES.length - 1) return state;
      const have = (state.artifacts?.[key] || 0);
      if (have < 3) return state;
      const nextKey = artiKey(id, ARTIFACT_RARITIES[idx+1]);
      const inv = { ...(state.artifacts || {}) };
      inv[key] = have - 3;
      inv[nextKey] = (inv[nextKey] || 0) + 1;
      return { ...state, artifacts: inv };
    }
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const savedOnce = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const hydratedRef = useRef(false); // avoid saving initial empty state before load
  useEffect(() => { hydratedRef.current = true; }, []);

  // Tick loop
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'TICK', dt: 1 });
      // rare event roll using latest state via ref
      rollEvent(dispatch, stateRef.current);
      // cleanup expired
      dispatch({ type: 'EVENT_CLEAN' });
      // dungeon completion check
      dispatch({ type: 'DUNGEON_TICK' });
      // achievements
      checkAchievements(dispatch, stateRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Hotkeys: numbers buy, B to cycle qty
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && (e.target.tagName||'').toLowerCase()) || '';
      if (tag === 'input' || tag === 'textarea' || e.isComposing) return;
      if (e.key.toLowerCase() === 'b') {
        dispatch({ type: 'CYCLE_BUY_QTY' });
        return;
      }
      const n = parseInt(e.key, 10);
      if (n>=1 && n<=9) {
        const ids = availableBuildingIds(stateRef.current);
        const id = ids[n-1];
        if (id) dispatch({ type:'BUY_MANY', id, qty: stateRef.current.ui.buyQty });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto save every 30s
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'SAVE_MARK' });
      // Read current via closure
      if (!savedOnce.current) savedOnce.current = true;
      // ensure save is called even if effects are throttled
      // eslint-disable-next-line no-console
      console.log('[autosave:tick]');
      saveState(stateRef.current);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Persist on state change of interest
  useEffect(() => {
    if (!hydratedRef.current) return; // skip first paint prior to load
    saveState(state);
  }, [state]);

  // Save on tab close / reload
  useEffect(() => {
    const onBeforeUnload = () => {
      saveState(stateRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveState(stateRef.current);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const api = useMemo(() => ({
    state,
    click: () => dispatch({ type: 'CLICK' }),
    buyBuilding: (id) => dispatch({ type: 'BUY', id }),
    buyMany: (id, qty) => dispatch({ type: 'BUY_MANY', id, qty }),
    setDataQ: (v) => dispatch({ type: 'SET_DATAQ', value: v }),
    setBuyQty: (v) => dispatch({ type: 'SET_BUY_QTY', value: v }),
    cycleBuyQty: () => dispatch({ type: 'CYCLE_BUY_QTY' }),
    setRightTab: (i) => dispatch({ type: 'SET_RIGHT_TAB', value: i }),
    doPrestige: () => dispatch({ type: 'DO_PRESTIGE' }),
    buyUpgrade: (id) => dispatch({ type: 'BUY_UPGRADE', id }),
    getUpgradeLevel: (id) => getUpgradeLevel(state, id),
    upgradeNextCost: (id) => {
      const u = UPGRADE_MAP[id];
      if (!u) return 0;
      return upgradeCost(u, getUpgradeLevel(state, id));
    },
    buyClickSkill: (id) => dispatch({ type:'BUY_CLICK_SKILL', id }),
    getClickSkillLevel: (id) => getSkillLevel(state, id),
    clickSkillNextCost: (id) => {
      const s = CLICK_SKILL_MAP[id];
      if (!s) return 0;
      return clickSkillCost(s, getSkillLevel(state, id));
    },
    codingProgress: () => {
      const lvl = state.codingLevel || 0;
      const xp = state.codingXP || 0;
      const need = codingXpNeededFor(lvl);
      return { level: lvl, xp, need };
    },
    claimQuest: (id) => dispatch({ type: 'QUEST_CLAIM', id }),
    startResearchBoost: (cost, durationMs) => dispatch({ type:'RESEARCH_BOOST', cost, durationMs }),
    buyParamUpgrade: (id) => dispatch({ type:'BUY_PARAM_UPGRADE', id }),
    startFocusX2: (buildingId, cost, durationMs) => dispatch({ type:'FOCUS_X2', buildingId, cost, durationMs }),
    openPack: () => dispatch({ type:'OPEN_PACK' }),
    openPacks: (count) => dispatch({ type:'OPEN_MANY', count }),
    shardsToTicket: () => dispatch({ type:'SHARDS_TO_TICKET' }),
    ascend: (cost) => dispatch({ type:'ASCEND', cost }),
    buyAscNode: (id) => dispatch({ type:'ASC_NODE_BUY', id }),
    artiDiscover: (cost) => dispatch({ type:'ARTI_DISCOVER', cost }),
    artiEquip: (key) => dispatch({ type:'ARTI_EQUIP', key }),
    artiUnequip: (slot) => dispatch({ type:'ARTI_UNEQUIP', slot }),
    artiCombine: (key) => dispatch({ type:'ARTI_COMBINE', key }),
    paramsPerSec: () => totalParamsPerSec(state),
    computePerSec: () => computePerSec(state),
    globalAddPct: () => calcGlobalAddPct(state),
    clickPower: () => clickPower(state),
    coreClickPower: () => coreClickPower(state),
    clickPowerBreakdown: () => clickPowerBreakdown(state),
    effectiveRateFor: (id) => {
      const b = BUILDING_MAP[id];
      if (!b) return 0;
      return effectiveRate(state, b);
    },
    nextCost: (id) => {
      const b = BUILDING_MAP[id];
      const count = state.buildings[id]?.count || 0;
      return nextCostWithMods(state, b, count);
    },
    canBuy: (id) => {
      const b = BUILDING_MAP[id];
      const count = state.buildings[id]?.count || 0;
      const cost = nextCostWithMods(state, b, count);
      return canAfford(state, cost);
    },
    maxAffordable: (id) => maxAffordableCount(state, id),
    calcPrestigeGain: () => calcPrestigeGain(state),
    startDungeon: (id) => dispatch({ type:'DUNGEON_START', id }),
    claimDungeon: () => dispatch({ type:'DUNGEON_CLAIM' }),
  }), [state]);

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

// Helpers: events
function hasEvent(state, type) {
  return state.activeEvents?.some((e) => e.type === type && e.endsAt > Date.now());
}

function hasFocusX2(state, buildingId){
  return state.activeEvents?.some((e)=> e.type==='focus_x2' && e.buildingId===buildingId && e.endsAt > Date.now());
}

function buildingPermanentMult(state, buildingId){
  if (!state.upgrades) return 1;
  let m = 1;
  for (const [id, lvl] of Object.entries(state.upgrades || {})) {
    if (!lvl) continue;
    const u = UPGRADE_MAP[id];
    const bm = u && u.effects && u.effects.buildingMult;
    if (bm && bm[buildingId]) m *= Math.pow(bm[buildingId], lvl);
  }
  const tier = state.paramUpgrades?.[buildingId] || 0;
  if (tier > 0) m *= Math.pow(1.2, tier);
  return m;
}

function paramUpgradeCost(b, tier){
  const base = Math.max(50, Math.floor((b.baseCost?.params || 50) * 15));
  const growth = 1.6;
  return Math.ceil(base * Math.pow(growth, tier));
}

function rollEvent(dispatch, state) {
  // base 1/180 per second
  let p = 1 / 180;
  {
    const lvl = getUpgradeLevel(state, 'grant_network');
    if (lvl > 0) p *= Math.pow(1.5, lvl);
  }
  p *= conceptEventRateMult(state);
  p *= artifactEventRateMult(state);
  if (Math.random() < p) {
    // pick event by weights
    const pick = randomChoice([
      { type: 'paper_accept', min: 30, max: 60, w: 1 },
      { type: 'gpu_sale', min: 60, max: 60, w: 1 },
      { type: 'sota_break', min: 30, max: 30, w: 1 },
    ]);
    const dur = randInt(pick.min, pick.max);
    dispatch({ type: 'EVENT_ADD', event: { id: `${pick.type}-${Date.now()}`, type: pick.type, endsAt: Date.now() + dur * 1000 } });
  }
}

function randomChoice(list) {
  const sum = list.reduce((s, x) => s + (x.w || 1), 0);
  let r = Math.random() * sum;
  for (const x of list) {
    r -= x.w || 1;
    if (r <= 0) return x;
  }
  return list[list.length - 1];
}

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Concept cards aggregation
function conceptProdAddPct(state){
  let add = 0;
  const cc = state.conceptCards || {};
  for (const id in cc) {
    const cnt = cc[id]||0; if (!cnt) continue;
    const c = CONCEPT_CARDS.find(x=> x.id === id);
    if (c?.effects?.prodAddPct) add += c.effects.prodAddPct * cnt;
  }
  return add;
}

// --- Concept pack gacha helpers ---

function rollConcept(ownedSet){
  // weights by rarity
  const weights = { C: 65, U: 25, R: 9, L: 1 };
  const pool = [];
  for (const c of CONCEPT_CARDS) {
    pool.push({ c, w: weights[c.rarity] || 1 });
  }
  // sample by weight
  const total = pool.reduce((s,x)=>s+x.w,0);
  let r = Math.random()*total;
  for (const x of pool){ r -= x.w; if (r<=0) return x.c; }
  return pool[pool.length-1].c;
}

function conceptRateMult(state){
  let m = 1;
  const cc = state.conceptCards || {};
  for (const id in cc) {
    const cnt = cc[id]||0; if (!cnt) continue;
    const c = CONCEPT_CARDS.find(x=> x.id === id);
    if (c?.effects?.rateMult) m *= Math.pow(c.effects.rateMult, cnt);
  }
  return m;
}

function conceptParamsCostMult(state){
  let m = 1;
  const cc = state.conceptCards || {};
  for (const id in cc) {
    const cnt = cc[id]||0; if (!cnt) continue;
    const c = CONCEPT_CARDS.find(x=> x.id === id);
    if (c?.effects?.paramsCostMult) m *= Math.pow(c.effects.paramsCostMult, cnt);
  }
  return m;
}

function conceptEventRateMult(state){
  let m = 1;
  const cc = state.conceptCards || {};
  for (const id in cc) {
    const cnt = cc[id]||0; if (!cnt) continue;
    const c = CONCEPT_CARDS.find(x=> x.id === id);
    if (c?.effects?.eventRateMult) m *= Math.pow(c.effects.eventRateMult, cnt);
  }
  return m;
}

// --- Artifacts aggregation ---
function equippedArtifactList(state){
  const eq = state.equippedArtifacts || {};
  const list = [];
  for (const slot of ARTIFACT_SLOTS) {
    const key = eq[slot];
    if (!key) continue;
    const parsed = parseArtiKey(key);
    const base = ARTIFACT_MAP[parsed.id];
    if (base) list.push({ base, rar: parsed.rar, key });
  }
  return list;
}

function scaledEffects(base, rar){
  const eff = base.effects || {};
  const multGt1 = (v)=> 1 + (v - 1) * (ARTIFACT_MULT_GT1_SCALE[rar] || 1);
  const multLt1 = (v)=> 1 - (1 - v) * (ARTIFACT_MULT_LT1_SCALE[rar] || 1);
  const add = (v)=> v * (ARTIFACT_ADD_SCALE[rar] || 1);
  const out = {};
  if (eff.rateMult) out.rateMult = multGt1(eff.rateMult);
  if (eff.computeRateMult) out.computeRateMult = multGt1(eff.computeRateMult);
  if (eff.paramsCostMult) out.paramsCostMult = multLt1(eff.paramsCostMult);
  if (eff.computeCostMult) out.computeCostMult = multLt1(eff.computeCostMult);
  if (eff.prodAddPct) out.prodAddPct = add(eff.prodAddPct);
  if (eff.clickPowerAdd) out.clickPowerAdd = add(eff.clickPowerAdd);
  if (eff.eventRateMult) out.eventRateMult = multGt1(eff.eventRateMult);
  if (eff.buildingMult) {
    out.buildingMult = {};
    for (const bid in eff.buildingMult) out.buildingMult[bid] = multGt1(eff.buildingMult[bid]);
  }
  return out;
}

function artifactProdAddPct(state){
  return equippedArtifactList(state).reduce((a, x) => a + (scaledEffects(x.base, x.rar).prodAddPct || 0), 0);
}

function artifactRateMult(state){
  return equippedArtifactList(state).reduce((m, x) => m * (scaledEffects(x.base, x.rar).rateMult || 1), 1);
}

function artifactParamsCostMult(state){
  return equippedArtifactList(state).reduce((m, x) => m * (scaledEffects(x.base, x.rar).paramsCostMult || 1), 1);
}

function artifactComputeRateMult(state){
  return equippedArtifactList(state).reduce((m, x) => m * (scaledEffects(x.base, x.rar).computeRateMult || 1), 1);
}

function artifactComputeCostMult(state){
  return equippedArtifactList(state).reduce((m, x) => m * (scaledEffects(x.base, x.rar).computeCostMult || 1), 1);
}

function artifactEventRateMult(state){
  return equippedArtifactList(state).reduce((m, x) => m * (scaledEffects(x.base, x.rar).eventRateMult || 1), 1);
}

function artifactClickAdd(state){
  return equippedArtifactList(state).reduce((a, x) => a + (scaledEffects(x.base, x.rar).clickPowerAdd || 0), 0);
}

function artifactBuildingMult(state, buildingId){
  return equippedArtifactList(state).reduce((m, x) => {
    const eff = scaledEffects(x.base, x.rar).buildingMult || {};
    const v = eff[buildingId];
    return m * (v || 1);
  }, 1);
}

// ---- Ascension aggregation ----
function ascNodeList(state){
  const nodes = state.ascensionNodes || {};
  return Object.keys(nodes).filter(id => nodes[id]).map(id => ASC_NODE_MAP[id]).filter(Boolean);
}

function ascRateMult(state){
  return ascNodeList(state).reduce((m, n) => m * ((n.effects?.rateMult) || 1), 1);
}

function ascParamsCostMult(state){
  return ascNodeList(state).reduce((m, n) => m * ((n.effects?.paramsCostMult) || 1), 1);
}

function ascComputeRateMult(state){
  return ascNodeList(state).reduce((m, n) => m * ((n.effects?.computeRateMult) || 1), 1);
}

function ascBuildingMult(state, buildingId){
  return ascNodeList(state).reduce((m, n) => {
    const bm = n.effects?.buildingMult || {};
    const v = bm[buildingId];
    return m * (v || 1);
  }, 1);
}

function artiKey(id, rar){ return `${id}@${rar}`; }
function parseArtiKey(key){ const [id, rar] = String(key).split('@'); return { id, rar: rar||'C' }; }

function randomArtifact(){
  const total = ARTIFACTS.reduce((s,a)=> s + (a.weight||1), 0);
  let r = Math.random() * total;
  for (const a of ARTIFACTS){ r -= (a.weight||1); if (r <= 0) return a; }
  return ARTIFACTS[0];
}

// Dungeon reward helpers
function rollDungeonRewards(def){
  const out = { shards: def.rewards?.shards || 0, artifacts: [] };
  const n = def.rewards?.artifacts || 0;
  for (let i=0;i<n;i++){
    const picked = randomArtifact();
    const rar = rollRarity(def.tier);
    out.artifacts.push(artiKey(picked.id, rar));
  }
  return out;
}

function rollRarity(tier){
  // return C/U/R/L weights depending on tier
  // tier1: 94/5/1/0, tier2: 75/18/6/1, tier3: 55/28/14/3, tier4: 40/30/22/8
  const table = {
    1: { C:94, U:5, R:1, L:0 },
    2: { C:75, U:18, R:6, L:1 },
    3: { C:55, U:28, R:14, L:3 },
    4: { C:40, U:30, R:22, L:8 },
  };
  const w = table[tier] || table[1];
  const picks = [ ['C', w.C], ['U', w.U], ['R', w.R], ['L', w.L] ];
  const sum = picks.reduce((s,[,x])=> s + x, 0);
  let r = Math.random() * sum;
  for (const [rar, x] of picks){ r -= x; if (r <= 0) return rar; }
  return 'C';
}

// ------- Upgrades helpers (multi-level) -------
function getUpgradeLevel(state, id){
  return (state.upgrades && state.upgrades[id]) || 0;
}

function upgradeCost(upg, level){
  const base = upg.cost || 0;
  const growth = upg.costGrowth || 1.6;
  return Math.ceil(base * Math.pow(growth, level));
}

// Click skills helpers
function getSkillLevel(state, id){
  return (state.clickSkills && state.clickSkills[id]) || 0;
}

function clickSkillCost(skill, level){
  const base = skill.cost || 1;
  const g = skill.costGrowth || 1.5;
  return Math.ceil(base * Math.pow(g, level));
}

function conceptClickAdd(state){
  let add = 0;
  const cc = state.conceptCards || {};
  for (const id in cc) {
    const cnt = cc[id]||0; if (!cnt) continue;
    const c = CONCEPT_CARDS.find(x=> x.id === id);
    if (c?.effects?.clickPowerAdd) add += c.effects.clickPowerAdd * cnt;
  }
  return add;
}

function cxpUpgradeMult(state){
  const lvl = getUpgradeLevel(state, 'cxp_curriculum');
  if (lvl > 0) {
    const mult = (UPGRADE_MAP['cxp_curriculum']?.effects?.cxpMult) || 1.25;
    return Math.pow(mult, lvl);
  }
  return 1;
}

// Expose light debug helpers for manual testing in dev
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.debugClicker = {
    saveNow: () => saveState(window.__gameState || {}),
  };
}

// Achievements check
function checkAchievements(dispatch, state) {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.has(a.id)) continue;
    if (a.type === 'total_params' && (state.totalParams || 0) >= a.value) dispatch({ type: 'ACH_UNLOCK', id: a.id });
    if (a.type === 'era' && state.eraId === a.value) dispatch({ type: 'ACH_UNLOCK', id: a.id });
    if (a.type === 'building' && (state.buildings[a.building]?.count || 0) >= a.value) dispatch({ type: 'ACH_UNLOCK', id: a.id });
    if (a.type === 'insights' && (state.insights || 0) >= a.value) dispatch({ type: 'ACH_UNLOCK', id: a.id });
  }
}

function availableBuildingIds(state){
  const order = ['1956','1958','1960s','2006','2012','2017','2018','2021'];
  const eraIdx = order.indexOf(state.eraId);
  return BUILDINGS.filter(b=> order.indexOf(b.era) <= eraIdx).map(b=> b.id);
}
