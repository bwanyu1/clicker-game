// AI-themed dungeon runs that reward artifacts upon completion.
// Simple single-run (one at a time), time-gated jobs with upfront cost.

export const DUNGEONS = [
  {
    id: 'dataset_cave',
    name: 'Dataset Cave',
    desc: 'データクリーニングの洞窟を踏破せよ。',
    durationSec: 60,
    cost: { params: 2e6, compute: 500 },
    tier: 1, // rarity weights: C-heavy
    rewards: { artifacts: 1, shards: 20 },
  },
  {
    id: 'gpu_mines',
    name: 'GPU Mines',
    desc: '深部のファンノイズが鳴り止まない。',
    durationSec: 120,
    cost: { params: 8e6, compute: 2000 },
    tier: 2, // U/Rも現実的
    rewards: { artifacts: 1, shards: 50 },
  },
  {
    id: 'conference_gauntlet',
    name: 'Conference Gauntlet',
    desc: '締切と査読の試練を乗り越えよ。',
    durationSec: 180,
    cost: { params: 2.5e7, compute: 6000 },
    tier: 3, // R/Lのチャンス
    rewards: { artifacts: 2, shards: 120 },
  },
  {
    id: 'alignment_trials',
    name: 'Alignment Trials',
    desc: 'AI整合性の迷宮。正解は一つではない。',
    durationSec: 240,
    cost: { params: 8e7, compute: 15000 },
    tier: 4, // Legendaryが稀に
    rewards: { artifacts: 2, shards: 200 },
  },
];

export const DUNGEON_MAP = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

