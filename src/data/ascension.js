// Ascension tech tree nodes
// branch: 'path' are mutually exclusive. 'depth' require a path node.

export const ASC_NODES = [
  // Paths (pick one)
  {
    id: 'path_convnet', branch: 'path', cost: 1,
    name: 'ConvNet 路線',
    desc: 'ConvNet×1.5 / GPU×1.1',
    effects: { buildingMult: { convnet_2012: 1.5, gpu_2009: 1.1 } },
  },
  {
    id: 'path_transformer', branch: 'path', cost: 1,
    name: 'Transformer 路線',
    desc: 'Transformer×1.5 / 生成AI推論×1.2',
    effects: { buildingMult: { transformer_2017: 1.5, genai_inference_2021: 1.2 } },
  },
  {
    id: 'path_multimodal', branch: 'path', cost: 1,
    name: 'マルチモーダル 路線',
    desc: 'マルチモーダル×1.5 / データレイク×1.1',
    effects: { buildingMult: { multimodal_2023: 1.5, datalake_2018: 1.1 } },
  },

  // Depths (require the corresponding path)
  { id: 'depth_convnet_optim', branch: 'depth', req: ['path_convnet'], cost: 2, name: 'Conv 最適化', desc: '全自動生産 ×1.10', effects: { rateMult: 1.10 } },
  { id: 'depth_transformer_optim', branch: 'depth', req: ['path_transformer'], cost: 2, name: 'Transformer 最適化', desc: '全自動生産 ×1.10', effects: { rateMult: 1.10 } },
  { id: 'depth_multimodal_optim', branch: 'depth', req: ['path_multimodal'], cost: 2, name: '統合最適化', desc: '全自動生産 ×1.10', effects: { rateMult: 1.10 } },
];

export const ASC_NODE_MAP = Object.fromEntries(ASC_NODES.map(n => [n.id, n]));

