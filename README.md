# AIパラメータ・クリッカー（React版）仕様書 v0.1

最終更新: 2025-09-16 / ターゲット: Web（React） / 言語: TypeScript

---

## 0. 目的・コンセプト

* **テーマ**: クリックで「AIモデルのパラメータ（Params）」を増やし、時代（Era）を進めながら自動化装置を解放する放置×インフレゲーム。
* **差別化**: AI史に沿った時代進行（1956→…）、AIウィンターをモチーフにした**任意リセット型プレステージ**（Insights）。
* **演出方針**: 通常は控えめ、レアイベント時のみ派手。

---

## 1. ゲームコアループ

1. プレイヤーがクリック → `Params`増加（`clickPower`）。
2. 所有中の建物（自動化）が毎秒`Params`を生成（`paramsPerSec`）。
3. `Params`と`Compute`を消費して建物・アップグレード・時代解放。
4. 一定到達で**任意**にAIウィンター（Prestige）→ `Insights`獲得 → 初期化＋恒久ボーナス。

---

## 2. リソースと単位

* **Params**（メイン通貨）: クリックと自動化で増加。
* **Compute**（計算資源）: 中後半の建設・強化に必要。特定建物が産出。
* **Data / DataQ**（データ量/品質）: 一部建物の倍率。DataQは0〜100%で全体%加算。
* **Insights**（Prestige通貨）: リセット時に獲得、恒久効果を購入。

数値表記は`1000→1.0K`、`1e6→1.0M`等の略記。指数的インフレに対応。

---

## 3. 時代（Era）進行

* **Era定義**（抜粋）:

  * 1956: ダートマス会議（研究室）
  * 1958–1969: パーセプトロン/記号主義
  * 1974–1980: AIウィンターI（任意Prestige解放）
  * 1980s: エキスパートシステム
  * 1986: Backprop普及
  * 1987–90s: AIウィンターII（任意Prestige強化）
  * 1990s: HPC・探索
  * 2006–2011: DL再興・GPU
  * 2012: AlexNet
  * 2017: Transformer
  * 2018–2020: 事前学習・BERT/GPT
  * 2021–2025: 生成AI大流行

* **解放条件**: `params >= eraThreshold[eraId]` もしくは前Eraのキークエスト達成。

* **時代効果**: 新建物/アップグレード解放、コスト係数の段階上昇。

---

## 4. 建物（自動化）

### 4.1 プロパティ

```
Building {
  id: string,
  name: string,
  era: EraId,
  baseRate: number,        // 1台あたりの基礎Params/s
  rateFormula?: string,    // 依存式（DataQやGPU数など）
  baseCost: { params: number, compute?: number },
  costGrowth: { params: number, compute?: number }, // 購入毎の倍率（例: 1.15）
  produces?: { compute?: number, data?: number },    // 副産物/秒
  synergies?: Synergy[],
}
Synergy { with: BuildingId | Tag, mult?: number, addPct?: number }
```

### 4.2 初期実装（v0.1 対象）

* `lab_1956 / 大学研究室`（Era 1956）

  * `baseRate=1.0`、`baseCost={params: 50}`、`costGrowth=1.15`
* `perceptron_1958 / パーセプトロン装置`（Era 1958）

  * `baseRate=1.5`、`baseCost={params: 200}`、`synergy: lab_1956と組合せで+10%`
* `symbolic_1960s / 記号推論班`（Era 1960s）

  * 率は小さいが全体に`+5%`（加算型バフ）
* `gpu_2009 / GPUリグ`（Era 2006–2011）

  * `baseRate=250`、`produces.compute=0.2/s`、`baseCost={params: 5e4, compute: 10}`
* `convnet_2012 / ConvNet工場`（Era 2012）

  * `baseRate=2500`、`rateFormula=base*(1+DataQ)`、`synergy: gpu_2009 ×1.3`

---

## 5. クリックと自動生成の数式

* **クリック**: `gain = clickPower * (1 + globalClickPct)`
* **自動生成**:

  * `paramsPerSec = Σ_i( count_i * effectiveRate_i )`
  * `effectiveRate_i = baseRate_i * (1 + insightsPct + dataPct + eraPct) * synergyMults`
* **コスト**:

  * 購入n回目のコスト: `cost(n) = baseCost * growth^n`
  * 中盤以降の大型建物は`params`と`compute`の二重コスト。

---

## 6. プレステージ（任意リセット）

### 6.1 発動条件

* プレイヤー任意。推奨タイミングをUIで示唆（生産の逓減、冬の足音演出）。

### 6.2 獲得式

```
insightsGain = floor( sqrt(totalParams / 1e6) * eraFactor )
eraFactor = 1 + 0.05 * max(0, eraIndexReached - 2)
```

* 初回Prestige時は`+10`のボーナスを付与。

### 6.3 リセット処理

* `params=0, compute=0, data=0, dataQ=初期値`、建物保有数=0、Era=1956へ。
* `insights += insightsGain`は保持。
* **恒久ボーナス**（購入型）:

  * `基礎理論の再評価`: クリック効率 +10%（1段階あたり）
  * `産業化の教訓`: 全`Compute`コスト −15%（乗算）
  * `Grant Network`: レアイベント発生率 +X%

---

## 7. レアイベント

* `論文採択（Top会議）`: 30–60秒、全体×3、控えめ花火。
* `GPU大量調達`: 60秒、GPU系建築コスト −25%。
* `SOTA更新`: 30秒、Transformer系×2。
* 発生率: 基本低確率。`Grant Network`で上昇。

---

## 8. セーブ/ロード & 放置計算

* **保存先**: LocalStorage（鍵名: `ai-clicker-save-v1`）。
* **自動セーブ**: 30秒毎＋主要アクション時。
* **放置計算**: 復帰時、前回保存からの経過秒`t`を計算し `params += paramsPerSec * min(t, cap)`（`cap`は例: 8時間）。

---

## 9. 技術スタック

* **フレームワーク**: React 18 + Vite
* **言語**: TypeScript
* **状態管理**: Zustand（軽量・シリアライズ容易）
* **UI**: Tailwind CSS + Headless UI / Radix を適宜
* **アニメーション**: Framer Motion（限定使用）
* **数値/略記**: decimal.js（誤差対策）、`numabbr`ユーティリティ
* **テスト**: Vitest + React Testing Library
* **Lint/Format**: ESLint + Prettier

---

## 10. コンポーネント設計（UI）

* `<AppLayout>`: ヘッダー（資源バー）、メイン、フッター。
* `<ClickPanel>`: クリックボタン、クリック演出、`clickPower`表示。
* `<EraTimeline>`: 年表、到達状況、次Era要件。
* `<BuildingsShop>`: 建物一覧、購入、所持数、DPS表示、シナジー表示。
* `<UpgradesShop>`: Insightsで買う恒久アップグレード。
* `<PrestigeModal>`: 任意リセット確認、獲得予測`insightsGain`表示、演出。
* `<EventsToaster>`: レアイベント通知（控えめアニメ）。
* `<Settings>`: サウンドON/OFF、略記フォーマット、セーブ/ロード、リセット。

---

## 11. Zustand ストア構造（概略）

```ts
// /src/state/store.ts
export interface GameState {
  params: Decimal; compute: Decimal; data: Decimal; dataQ: number; eraId: EraId;
  totalParams: Decimal; insights: number;
  buildings: Record<BuildingId, { count: number }>;
  upgrades: Set<UpgradeId>;
  lastSavedAt: number;
  tick(dt: number): void;              // 自動生成反映
  click(): void;                        // クリック
  buyBuilding(id: BuildingId): void;    // 購入
  canPrestige(): boolean;               // 任意なので常にtrueでも可（UIで誘導）
  calcPrestigeGain(): number;           // sqrt式
  doPrestige(): void;                   // リセット処理
  save(): void; load(): void;           // LocalStorage
}
```

---

## 12. バランス初期値（v0.1）

* クリック: `clickPower=1`
* Eraしきい値: `1956→1958: 500 Params`, `1958→1960s: 5K`, `…`
* 成長係数: 小型`1.15`、中型`1.12`、大型`1.08`
* Insights式: `floor( sqrt(totalParams / 1e6) * eraFactor )`（`eraFactor`初期1.0）
* レアイベント: 基本1/180秒、持続30–60秒

---

## 13. 演出・SFX

* 通常クリック: 微小パーティクル（CSS/transform + opacity）。
* レア: 花火/吹雪（キャンバス or Lottie）。
* 冬→春: 背景グラデの青→白→暖色、SEは控えめに。

---

## 14. アクセシビリティ

* クリックボタンは`Space/Enter`支持。
* 高コントラスト/アニメ軽減トグル。
* 数値はツールチップでフル表記を提供。

---

## 15. i18n

* 英日対応（初期は日本語）。`/locales/ja.json` 等でキー管理。

---

## 16. ディレクトリ構成（提案）

```
src/
  components/
    ClickPanel.tsx
    EraTimeline.tsx
    BuildingsShop/
      BuildingCard.tsx
      BuildingsShop.tsx
    PrestigeModal.tsx
    EventsToaster.tsx
  state/
    store.ts
    formulas.ts
  data/
    eras.ts
    buildings.ts
    upgrades.ts
  utils/
    number.ts (略記/フォーマット)
    storage.ts (LS)
  styles/
    index.css
  App.tsx
  main.tsx
```

---

## 17. 疑似コード（主要ロジック）

```ts
// tick（60fps程度で呼ぶ or 250ms間隔）
function tick(dt: number) {
  const pps = sum(buildings.map(b => count[b.id] * effectiveRate(b)));
  params += pps * dt;
  totalParams += pps * dt;
}

function effectiveRate(b: Building): number {
  const mult = (1 + insightsPct + dataPct + eraPct) * synergyMult(b);
  let rate = b.baseRate * mult;
  if (b.rateFormula) rate = evalRate(b.rateFormula, ctx); // 安全にパースする実装
  return rate;
}

function calcPrestigeGain(): number {
  const eraFactor = 1 + 0.05 * Math.max(0, eraIndexReached - 2);
  return Math.floor(Math.sqrt(totalParams / 1e6) * eraFactor) + (isFirstPrestige ? 10 : 0);
}
```

---

## 18. QA/テスト観点

* 連打/高負荷時の`params`オーバーフロー防止（decimal.jsで対応）。
* セーブ/ロードの後方互換（バージョンキー保持）。
* オフライン復帰の悪用（時刻改ざん）に対する軽減 (`cap`導入)。
* レアイベント重複/競合の優先度テーブル。

---

## 19. マイルストーン

* **M1: v0.1 プロトタイプ**（1–2日）

  * クリック、1種の建物、LocalStorage、DPS表示。
* **M2: Era/Shop**（+2–3日）

  * Era解放、3種の建物、略記、簡易演出。
* **M3: Prestige**（+2日）

  * 任意リセット、Insights、恒久アップグレード1–2種。
* **M4: レアイベント/演出**（+2–3日）

  * Toaster、花火/吹雪、バランス初期調整。

---

## 20. 将来拡張

* マルチ（協力SOTAイベント）、ランキング（オプトイン）
* クラウド同期（Authなし匿名ID + KV）
* 実績/称号（Steam風のアンロック）

---

## 21. 受け入れ基準（v0.1）

* クリックで数値が増え、1種の建物で自動増加する。
* ブラウザを閉じても状態が保存される。
* 任意PrestigeでInsightsが増え、次周回で成長が体感できる。
* 通常演出は控えめ、レア演出の存在が視覚的に分かる。
