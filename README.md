# ポーズ・構図プロンプト工房

一人の人物について、身体各部の関係とカメラ構図を構造化し、矛盾・手の使用数・現在の画角で見える範囲を確認して、画像生成AI向けの英語プロンプトへ変換する静的Webアプリです。

旧ポーズビルダーの項目やタグ連結処理は移植していません。身体状態を保持する `state`、正規化、`advisor`、`generator`、UIを分離しています。

## 起動方法

`index.html` をブラウザで開いてください。ビルド、npm、外部サーバー、外部APIは不要です。`file://` と GitHub Pages のどちらでも基本機能が動作します。

自動テストは `tests.html` を開くと実行されます。現在のテスト数は124件です。

## 主な機能

- かんたん設計、プリセット開始、詳細設計の3入口
- 姿勢、動作、重心、脚、骨盤、上半身、肩の構造化
- 腕A・腕Bと、両腕を使う複合ポーズの分離
- 顔の向き、顎、首、視線対象、視線方向、目の状態の分離
- 撮影範囲、カメラ高さ、傾き、人物配置、余白、奥行き、構図リズム
- hard / warning / info の設計アドバイザーとpatch形式の修正案
- 画角外の設定を保持したまま、プロンプト出力だけを抑制
- 構造化プロンプト、詳細英文、日本語構造一覧
- 下書き自動保存、名前付きユーザープリセット（最大20件）
- iOS Safari向けコピーのフォールバック
- 320〜430pxを中心にしたスマートフォンUI、セーフエリア、44pxタップ領域

## ファイル構成

```text
pose-composition-workshop/
├─ index.html             アプリ画面とスクリプト読込順
├─ styles.css             スマートフォン優先の見た目
├─ app.js                 UI描画・イベント・ステップ移動
├─ state.js               初期状態・正規化・patch適用
├─ advisor.js             競合・可視範囲・修正候補
├─ generator.js           3種類の出力生成
├─ storage.js             下書き・ユーザープリセット保存
├─ data/
│  ├─ postures.js         姿勢・動作・支持
│  ├─ body.js             重心・脚・骨盤・上半身・肩
│  ├─ limbs.js            個別腕・両腕複合動作
│  ├─ head-gaze.js        顔・顎・首・視線
│  ├─ camera.js           撮影範囲・高さ・傾き
│  ├─ composition.js      配置・余白・クロップ・奥行き
│  ├─ presets.js          15件の整合済みプリセット
│  └─ rules.js            可視範囲・姿勢別推奨値
├─ tests.html             ブラウザ用テスト画面
├─ tests.js               124件のロジックテスト
└─ README.md
```

すべて通常の `<script>` で読み込みます。ES Modulesは使っていません。

## アーキテクチャ

```text
入力UI
  ↓ patch
state.normalize
  ↓
advisor.check ──→ hard / warning / info + resolutions.patch
  ↓
generator.blocks
  ├─ compact
  ├─ detailed
  └─ structureJa
```

`generator.js` は次の関数を公開します。

```js
window.PCW.generator.compact(state)
window.PCW.generator.detailed(state)
window.PCW.generator.structureJa(state)
window.PCW.generator.blocks(state)
```

## データ追加方法

### 選択肢

該当する `data/*.js` の配列へ、既存項目と同じ形式で追加します。日本語ラベルと英語の短縮・詳細表現を分けてください。

腕動作は、使用する手の本数と見える位置を必ず指定します。

```js
{
  id: "hand_on_hip",
  labelJa: "片手を腰に添える",
  prompt: {
    compact: "hand resting on the hip",
    detailed: "The hand rests naturally on the hip."
  },
  resources: { hands: 1 },
  postures: ["standing", "sitting", "kneeling"],
  zones: ["arms", "hands", "torso"]
}
```

新しいIDを追加したら、`state.js` の正規化対象、`generator.js` の出力ブロック、`tests.js` のデータ整合性テストも確認してください。

### プリセット

`data/presets.js` へ通常の状態patchとして追加します。画面専用の分岐は作りません。追加後は `tests.html` で、hard警告が0件、compact / detailedが空でないことを確認してください。

### 警告ルール

`advisor.js` の `check()` から、次の形式の警告を返します。修正案はUI命令ではなく状態patchにします。

```js
{
  id: "rule_id",
  severity: "hard",
  category: "arms",
  titleJa: "警告タイトル",
  messageJa: "説明",
  relatedPaths: ["pose.arms"],
  resolutions: [
    { labelJa: "修正案", patch: { "pose.arms.combined": null } }
  ]
}
```

自動修正で値を黙って削除しないでください。UI上で利用者が修正案を選んだときだけpatchを適用します。

## localStorage

```text
pcw_draft_v1          編集中の下書き
pcw_user_presets_v1   名前付きユーザープリセット
pcw_preferences_v1    表示設定の予約領域
```

JSONが壊れている場合は初期状態へ安全に復旧します。保存データは読み込み時に必ず正規化されます。

## テスト範囲

- データID・必須ラベル・手リソース
- 状態初期化・正規化・未知値除去・patch
- 腕の競合、閉眼と視線、姿勢依存、構図提案
- 画角外の脚・腕・手
- compact / detailed / 日本語構造、重複・空値・句読点
- 15件すべてのビルトインプリセット
- 完成条件
- localStorageの正常・破損・上限

プログラムテストは、生成画像が自然になることまでは証明しません。重要な生成テンプレートは、同一seed・同一モデル・同一キャラクター条件で別途比較してください。

## 既知の制限

- 画像生成AIによってプロンプトの解釈は異なります。
- 左右は反転する場合があります。厳密な左右指定はMVP対象外です。
- 手指の完全な正確性は保証しません。
- 複雑な手足指定は、論理上の矛盾がなくても崩れる場合があります。
- カメラ・ポーズ指定は、利用するモデルやLoRAに上書きされる場合があります。
- 警告がないことは、画像生成の成功を保証しません。
- 一人用です。複数人構図、小道具、具体的な支持物、POV、魚眼、ControlNet連携には対応しません。
