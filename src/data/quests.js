// Simple quest definitions. Some are one-shot and claimable when condition is met.
export const QUESTS = [
  { id: 'reach_1958', name: '到達: 1958', desc: '1958 Eraに到達する', type: 'era', value: '1958', reward: { params: 2000 } },
  { id: 'get_gpu', name: '初GPU', desc: 'GPUリグを1台購入する', type: 'building', building: 'gpu_2009', value: 1, reward: { params: 8000 } },
  { id: 'pps_100', name: '自動生成100/s', desc: 'Params/s を100に到達', type: 'pps', value: 100, reward: { buff: { type: 'quest_boost', seconds: 120, mult: 1.2 } } },
  { id: 'reach_2012', name: '到達: 2012', desc: '2012 Eraに到達する', type: 'era', value: '2012', reward: { params: 50000 } },
  { id: 'lab_25', name: '研究室×25', desc: '大学研究室を25台所有', type: 'building', building: 'lab_1956', value: 25, reward: { params: 20000 } },
  { id: 'transformer', name: 'Transformerの夜明け', desc: 'Transformer研究棟を1台', type: 'building', building: 'transformer_2017', value: 1, reward: { buff: { type: 'quest_boost', seconds: 180, mult: 1.25 } } },
];

