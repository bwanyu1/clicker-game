// Insights persistent upgrades (bought with insights; persist through prestige)
export const UPGRADES = [
  {
    id: 'deep_efficiency',
    name: '深層効率化',
    desc: '全自動生成 +10%（加算）',
    cost: 20,
    effects: { prodAddPct: 0.10 },
  },
  {
    id: 'industrial_lessons',
    name: '産業化の教訓',
    desc: '全Computeコスト −15%（乗算）',
    cost: 30,
    effects: { computeCostMult: 0.85 },
  },
  {
    id: 'grant_network',
    name: 'Grant Network',
    desc: 'レアイベント発生率 +50%',
    cost: 25,
    effects: { eventRateMult: 1.5 },
  },
  {
    id: 'clicker_mania',
    name: 'クリックマニア',
    desc: 'クリック+1（基礎+1→+2）',
    cost: 10,
    effects: { clickPowerAdd: 1 },
  },
  {
    id: 'auto_clicker',
    name: '自動クリック',
    desc: '毎秒1回の自動クリック（恒久）',
    cost: 40,
    effects: { autoClickPerSec: 1 },
  },
  // Building-specific permanent multipliers (x2)
  {
    id: 'x2_lab_1956',
    name: '研究室ブースト×2',
    desc: '大学研究室の生産×2（恒久）',
    cost: 12,
    effects: { buildingMult: { lab_1956: 2.0 } },
  },
  {
    id: 'x2_perceptron_1958',
    name: 'パーセプトロン×2',
    desc: 'パーセプトロン装置の生産×2（恒久）',
    cost: 18,
    effects: { buildingMult: { perceptron_1958: 2.0 } },
  },
  {
    id: 'x2_gpu_2009',
    name: 'GPUリグ×2',
    desc: 'GPUリグの生産×2（恒久）',
    cost: 50,
    effects: { buildingMult: { gpu_2009: 2.0 } },
  },
  {
    id: 'x2_convnet_2012',
    name: 'ConvNet工場×2',
    desc: 'ConvNet工場の生産×2（恒久）',
    cost: 90,
    effects: { buildingMult: { convnet_2012: 2.0 } },
  },
  {
    id: 'x2_transformer_2017',
    name: 'Transformer研究棟×2',
    desc: 'Transformer研究棟の生産×2（恒久）',
    cost: 140,
    effects: { buildingMult: { transformer_2017: 2.0 } },
  },
];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
