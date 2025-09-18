// 思考実験で得られる「概念カード」（永続パッシブ）
// rarity: C(ommon) / U(ncommon) / R(are) / L(egendary)
export const CONCEPT_CARDS = [
  // Common
  { id: 'nfl', name: 'No Free Lunch 定理', desc: '全自動生産 +1%（加算）', rarity: 'C', effects: { prodAddPct: 0.01 } },
  { id: 'min_risk', name: '最小リスク学習', desc: '全自動生産 +1%（加算）', rarity: 'C', effects: { prodAddPct: 0.01 } },
  { id: 'bias_var', name: 'バイアス–バリアンス', desc: '全自動生産 ×1.01', rarity: 'C', effects: { rateMult: 1.01 } },
  { id: 'lr_schedule', name: '学習率スケジュール', desc: '全自動生産 ×1.01', rarity: 'C', effects: { rateMult: 1.01 } },
  { id: 'simple_rules', name: "Occam's Razor", desc: 'Paramsコスト −0.5%', rarity: 'C', effects: { paramsCostMult: 0.995 } },
  { id: 'priors', name: '事前分布', desc: 'イベント率 ×1.05', rarity: 'C', effects: { eventRateMult: 1.05 } },
  { id: 'feature_norm', name: '特徴量正規化', desc: '全自動生産 ×1.01', rarity: 'C', effects: { rateMult: 1.01 } },
  { id: 'data_augmentation', name: 'データ拡張', desc: '全自動生産 +1%（加算）', rarity: 'C', effects: { prodAddPct: 0.01 } },
  { id: 'gradient_clip', name: '勾配クリッピング', desc: '全自動生産 +1%（加算）', rarity: 'C', effects: { prodAddPct: 0.01 } },
  { id: 'warmup', name: 'ウォームアップ', desc: '全自動生産 ×1.01', rarity: 'C', effects: { rateMult: 1.01 } },
  { id: 'mini_batch', name: 'ミニバッチ', desc: 'イベント率 ×1.05', rarity: 'C', effects: { eventRateMult: 1.05 } },
  // Uncommon
  { id: 'scaling', name: 'Scaling Hypothesis', desc: '全自動生産 ×1.03', rarity: 'U', effects: { rateMult: 1.03 } },
  { id: 'ensemble', name: 'アンサンブル仮説', desc: '全自動生産 +2%（加算）', rarity: 'U', effects: { prodAddPct: 0.02 } },
  { id: 'reg', name: '正則化の知見', desc: 'Paramsコスト −1%', rarity: 'U', effects: { paramsCostMult: 0.99 } },
  { id: 'posterior', name: "Bayes' Rule", desc: 'イベント率 ×1.10', rarity: 'U', effects: { eventRateMult: 1.10 } },
  { id: 'lottery', name: 'Lottery Ticket Hypothesis', desc: 'クリック +1', rarity: 'U', effects: { clickPowerAdd: 1 } },
  { id: 'batch_norm', name: 'バッチ正規化', desc: '全自動生産 ×1.03', rarity: 'U', effects: { rateMult: 1.03 } },
  { id: 'dropout', name: 'Dropout', desc: '全自動生産 +2%（加算）', rarity: 'U', effects: { prodAddPct: 0.02 } },
  { id: 'knowledge_distillation', name: '知識蒸留', desc: 'Paramsコスト −1%', rarity: 'U', effects: { paramsCostMult: 0.99 } },
  { id: 'label_smoothing', name: 'Label Smoothing', desc: 'イベント率 ×1.08', rarity: 'U', effects: { eventRateMult: 1.08 } },
  { id: 'momentum', name: 'モメンタム', desc: '全自動生産 +2%（加算）', rarity: 'U', effects: { prodAddPct: 0.02 } },
  // Rare
  { id: 'double_descent', name: '二重降下', desc: '全自動生産 ×1.06', rarity: 'R', effects: { rateMult: 1.06 } },
  { id: 'groking', name: 'グロッキング', desc: '全自動生産 +4%（加算）', rarity: 'R', effects: { prodAddPct: 0.04 } },
  { id: 'flat_minima', name: '平坦最小', desc: 'Paramsコスト −2%', rarity: 'R', effects: { paramsCostMult: 0.98 } },
  { id: 'info_bottleneck', name: '情報ボトルネック', desc: 'イベント率 ×1.15', rarity: 'R', effects: { eventRateMult: 1.15 } },
  { id: 'sparsity', name: 'スパース性仮説', desc: 'クリック +2', rarity: 'R', effects: { clickPowerAdd: 2 } },
  { id: 'layer_norm', name: 'Layer Normalization', desc: '全自動生産 ×1.06', rarity: 'R', effects: { rateMult: 1.06 } },
  { id: 'curriculum_learning', name: 'カリキュラム学習', desc: '全自動生産 +4%（加算）', rarity: 'R', effects: { prodAddPct: 0.04 } },
  { id: 'neural_architecture_search', name: 'NAS', desc: 'イベント率 ×1.18', rarity: 'R', effects: { eventRateMult: 1.18 } },
  { id: 'moe_sparse', name: 'Mixture-of-Experts', desc: '全自動生産 ×1.06', rarity: 'R', effects: { rateMult: 1.06 } },
  // Legendary
  { id: 'universal_approx', name: '普遍近似定理', desc: '全自動生産 ×1.12', rarity: 'L', effects: { rateMult: 1.12 } },
  { id: 'mdl', name: 'MDL原理', desc: 'Paramsコスト −4%', rarity: 'L', effects: { paramsCostMult: 0.96 } },
  { id: 'rl_cth', name: '探索–利用バランス', desc: 'イベント率 ×1.25', rarity: 'L', effects: { eventRateMult: 1.25 } },
  { id: 'emergent', name: 'スケール則の出現', desc: '全自動生産 +6%（加算）', rarity: 'L', effects: { prodAddPct: 0.06 } },
  { id: 'self_supervised', name: '自己教師あり学習', desc: '全自動生産 ×1.10', rarity: 'L', effects: { rateMult: 1.10 } },
  { id: 'in_context_learning', name: 'インコンテキスト学習', desc: 'クリック +3', rarity: 'L', effects: { clickPowerAdd: 3 } },
  { id: 'data_centric_ai', name: 'データ中心AI', desc: 'Paramsコスト −5%', rarity: 'L', effects: { paramsCostMult: 0.95 } },
];

export const CONCEPT_MAP = Object.fromEntries(CONCEPT_CARDS.map(c => [c.id, c]));
