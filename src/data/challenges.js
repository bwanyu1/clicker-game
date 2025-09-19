// Difficulty modifiers (opt-in). Each applies global penalties.
// effects: { rateMult?, paramsCostMult?, computeCostMult?, eventRateMult?, disableAuto? }

export const CHALLENGES = [
  {
    id: 'ironman',
    name: 'アイアンマン',
    desc: '自動クリック無効（Auto/Thread系）。',
    effects: { disableAuto: true },
    rewardEffects: { rateMult: 1.02 }, // クリア毎に全体×1.02
    weight: 1,
  },
  {
    id: 'scarcity',
    name: '資源不足',
    desc: '全Params/Computeコスト +35%。',
    effects: { paramsCostMult: 1.35, computeCostMult: 1.35 },
    rewardEffects: { paramsCostMult: 0.99 }, // クリア毎にParamsコスト−1%
    weight: 2,
  },
  {
    id: 'entropy',
    name: '不可逆のエントロピー',
    desc: '全自動生産 ×0.7。',
    effects: { rateMult: 0.7 },
    rewardEffects: { rateMult: 1.03 }, // クリア毎に全体×1.03
    weight: 2,
  },
  {
    id: 'drought',
    name: '研究干ばつ',
    desc: 'レアイベント発生率 ×0.4。',
    effects: { eventRateMult: 0.4 },
    rewardEffects: { eventRateMult: 1.05 }, // クリア毎にイベント率×1.05
    weight: 1,
  },
];

export const CHALLENGE_MAP = Object.fromEntries(CHALLENGES.map(c => [c.id, c]));
