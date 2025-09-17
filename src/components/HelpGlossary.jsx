import React from 'react';

export default function HelpGlossary() {
  return (
    <div className="panel">
      <h2>プレイガイド / 用語集</h2>

      <Section title="基本の遊び方">
        <ul>
          <li>クリックボタン（Space/Enterでも可）で <b>Params</b> を増やす。</li>
          <li>ショップで <b>建物</b> を購入すると毎秒自動で Params が増える。</li>
          <li>合計Paramsが閾値を超えると <b>Era</b> が進む。新しい建物や強化が解放される。</li>
          <li>進行が鈍ったら <b>プレステージ（AIウィンター）</b> でリセット → <b>Insights</b> を獲得し恒久強化を購入。</li>
        </ul>
      </Section>

      <Section title="リソース">
        <dl className="glossary">
          <dt>Params</dt>
          <dd>主要通貨。クリックと自動生成で増える。建物や強化の購入に使用。</dd>
          <dt>Compute</dt>
          <dd>中盤以降の高級建物の <b>第二コスト</b>。主に <b>GPUリグ</b> が毎秒産出する。GPUは初回のみCompute不要で購入可。</dd>
          <dt>Data / DataQ</dt>
          <dd>
            データ駆動の建物の効率に影響。DataQは0–100%（UIのスライダーで調整）。
            ConvNet/Transformer/事前学習/生成AIなどは <b>データ親和性</b> に応じて
            生産が <code>×(1 + DataQ × 親和性)</code> で強化されます。
          </dd>
          <dt>Insights</dt>
          <dd>プレステージ（任意リセット）で獲得する恒久通貨。アップグレードや建物別×2などに使用（周回を超えて維持）。</dd>
        </dl>
      </Section>

      <Section title="建物・購入">
        <ul>
          <li>建物は所持数 × 実効レートで毎秒生産。シナジーやイベントで倍率がかかる。</li>
          <li><b>まとめ買い</b>（x1/x10/x100）を選べる。<b>Bキー</b>で切替、<b>1〜9キー</b>で素早く購入。</li>
          <li>コストは購入ごとに指数成長（表示のタイトルに合計見積りを表示）。</li>
          <li>GPUリグは <b>初回のみCompute不要</b>。2台目以降はParams+Computeが必要。</li>
        </ul>
      </Section>

      <Section title="強化の種類">
        <ul>
          <li><b>Insightsアップグレード</b>: 恒久（周回を超えて維持）。例: クリック+1、自動クリック、建物別×2、Computeコスト軽減など。</li>
          <li><b>チューニング・ラボ</b>: Paramsで買う周回限定の恒久強化（プレステージでリセット）。建物ごとに <b>×1.2^Tier</b> の倍率。</li>
          <li><b>研究（短期バフ）</b>: 一定時間の全体×1.25、または <b>建物フォーカス×2（60s）</b> など。重ねがけは乗算。</li>
          <li><b>クエスト報酬</b>: 条件達成でParams付与や一時バフ（×1.2）。</li>
        </ul>
      </Section>

      <Section title="イベント / 実績 / クエスト">
        <ul>
          <li><b>レアイベント</b>: 論文採択（全体×3）、GPU大量調達（GPUコスト−25%）、SOTA更新（ConvNet×2）。右上にトーストで表示。</li>
          <li><b>実績</b>: 条件達成で解放。演出＆一覧に記録（報酬は将来拡張可）。</li>
          <li><b>クエスト</b>: 達成後に「受け取る」ボタンで報酬が入る。右カラムのタブから確認。</li>
        </ul>
      </Section>

      <Section title="プレステージ（AIウィンター）">
        <ul>
          <li>任意タイミングで実行。現在の <b>所持Params</b> に応じて <b>Insights</b> を獲得（初回+10）。</li>
          <li>リセットされるもの: Params/Compute/建物/時代進行/チューニング・ラボの強化。</li>
          <li>維持されるもの: Insights残高・購入済みInsightsアップグレード・実績・クエスト受取状態。</li>
        </ul>
      </Section>

      <Section title="セーブ / 放置">
        <ul>
          <li>自動セーブ: 30秒ごと。タブを閉じる/非表示時にも保存。</li>
          <li>放置計算: 最大8時間ぶんまでログイン時に加算。</li>
          <li>Settings/Debugから <b>Export/Import/Clear</b> が可能。</li>
        </ul>
      </Section>

      <Section title="表記ルール / 小ネタ">
        <ul>
          <li>数値略記: 1,000→1.0K、1,000,000→1.0M など。</li>
          <li>ヘッダー下のミニゲージ: 次のEraまで、次のInsights+1までの進捗を表示。</li>
          <li>GPUが買えない時はCompute不足を確認。<b>初回のみ</b>Compute不要で買える仕様にしています。</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }){
  return (
    <section style={{ marginBottom: 14 }}>
      <h3 style={{ margin: '8px 0 6px', fontSize: 16 }}>{title}</h3>
      {children}
    </section>
  );
}
