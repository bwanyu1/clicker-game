// Click-related skill tree powered by opcode points (OPC)
export const CLICK_SKILLS = [
  {
    id: 'micro_ops',
    name: 'Micro-ops Fusion',
    desc: '手動クリック×1.10^Lv（細粒度最適化）',
    cost: 1,
    costGrowth: 1.5,
    effects: { manualMultPerLevel: 1.10 },
  },
  {
    id: 'cache_prefetch',
    name: 'Cache Prefetch',
    desc: 'クリック経験値（CXP）+0.5/Lv',
    cost: 1,
    costGrowth: 1.5,
    effects: { cxpAddPerClick: 0.5 },
  },
  {
    id: 'thread_booster',
    name: 'Thread Booster',
    desc: '自動クリック +0.2/Lv（毎秒）',
    cost: 2,
    costGrowth: 1.6,
    effects: { autoClicksPerSecAdd: 0.2 },
  },
];

export const CLICK_SKILL_MAP = Object.fromEntries(CLICK_SKILLS.map(s => [s.id, s]));

