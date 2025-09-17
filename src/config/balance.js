// Centralized balance constants for easy tuning
export const DATA_Q_COST_MULTIPLIER = 0.25; // Params cost up to +25% at DataQ=100%
export const DATA_Q_OPPOSITION_FLOOR = 0.9; // Classic lines keep at least 90% efficiency

// ----- Coding (クリックによる育成) -----
export const CODING_XP_PER_CLICK = 1; // 手動クリック1回あたり獲得CXP
export const CODING_XP_BASE = 50;     // Lv0→1に必要なCXP基礎
export const CODING_XP_GROWTH = 1.5;  // レベル毎の必要CXP倍率
export const CODING_CLICK_POWER_PER_LEVEL = 0.5; // CLv1あたりのクリック加算
export const OPC_POINTS_PER_LEVEL = 1; // CLv上昇ごとに得るOpcodeポイント
