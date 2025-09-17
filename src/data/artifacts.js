// AI-themed artifacts that can be equipped in slots.
// Effects mirror existing bonus types used across the game.
export const ARTIFACT_SLOTS = ['theory', 'hardware', 'data', 'algorithms'];

// Rarity tiers and labels
export const ARTIFACT_RARITIES = ['C','U','R','L'];
export const ARTIFACT_RARITY_LABEL = { C:'Common', U:'Uncommon', R:'Rare', L:'Legendary' };

// Scaling helpers for effects by rarity
// For additive bonuses (e.g., prodAddPct, clickPowerAdd), multiply value by this factor
export const ARTIFACT_ADD_SCALE = { C: 1.0, U: 1.6, R: 2.4, L: 3.5 };
// For multiplicative bonuses >1 (e.g., rateMult, computeRateMult): 1 + (m-1) * scale
export const ARTIFACT_MULT_GT1_SCALE = { C: 1.0, U: 1.35, R: 1.75, L: 2.4 };
// For multiplicative bonuses <1 (e.g., paramsCostMult, computeCostMult): 1 - (1-m) * scale
export const ARTIFACT_MULT_LT1_SCALE = { C: 1.0, U: 1.4, R: 1.9, L: 2.6 };

export const ARTIFACTS = [
  {
    id: 'turing_award_medal',
    name: 'チューリング賞メダル',
    slot: 'theory',
    desc: '理論的ブレイクスルーが波及。全自動生産 ×1.05',
    effects: { rateMult: 1.05 },
    weight: 10,
  },
  {
    id: 'scaling_laws_chart',
    name: 'スケーリング則チャート',
    slot: 'theory',
    desc: '規模の理解が前進。全自動生産 +2%',
    effects: { prodAddPct: 0.02 },
    weight: 8,
  },
  {
    id: 'tensor_core_module',
    name: 'Tensor Core モジュール',
    slot: 'hardware',
    desc: '演算資源が効率化。Compute産出 ×1.3',
    effects: { computeRateMult: 1.3 },
    weight: 9,
  },
  {
    id: 'datacenter_cooling_blueprint',
    name: '冷却最適化ブループリント',
    slot: 'hardware',
    desc: '消費効率の改善。Computeコスト −5%',
    effects: { computeCostMult: 0.95 },
    weight: 7,
  },
  {
    id: 'open_dataset_cache',
    name: 'オープンデータセット・キャッシュ',
    slot: 'data',
    desc: '前処理が捗る。全自動生産 ×1.03 / Paramsコスト −1%',
    effects: { rateMult: 1.03, paramsCostMult: 0.99 },
    weight: 10,
  },
  {
    id: 'optimizer_adam_paper',
    name: 'Adam最適化論文',
    slot: 'algorithms',
    desc: '学習の初速向上。クリック +1 / 全自動生産 ×1.02',
    effects: { clickPowerAdd: 1, rateMult: 1.02 },
    weight: 10,
  },
  {
    id: 'attention_is_all_you_need',
    name: 'Attention Is All You Need',
    slot: 'algorithms',
    desc: '自己注意の発見。Transformer系の生産 ×1.15',
    effects: { buildingMult: { transformer_2017: 1.15, genai_inference_2021: 1.10 } },
    weight: 6,
  },
  {
    id: 'imagenet_trophy',
    name: 'ImageNet トロフィー',
    slot: 'data',
    desc: 'データベンチマーク制覇。ConvNet工場 ×1.2 / レアイベント率 ×1.05',
    effects: { eventRateMult: 1.05, buildingMult: { convnet_2012: 1.2 } },
    weight: 6,
  },
];

export const ARTIFACT_MAP = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
