# compact短縮・特殊ポーズ改修レポート

実装日：2026-09-07
比較元：公開main `865870f407c7ee906d3c73819adec5630e84a1b7`

## 結果

- プリセット：69件 → 77件（基本15／恋人・親しい相手46／特殊・演出16）。
- 撮影範囲：アップ13／半身33／全身31。
- 既存69件すべてでcompactの文字数が減少。基本15件は19〜40%短縮。
- 既存69件のdetailedと日本語構造は、改修直前の出力とそれぞれ全件完全一致。
- 自動テスト：528件 → 570件、570件すべて成功（Node VM・ブラウザ双方）。
- UIから新規8件を選択し、構造化／詳細英文／日本語構造の24出力を確認。空出力・undefined・null・空カンマなし。コンソールエラーなし。
- 390px幅でカテゴリと系統の絞り込み、8件表示、選択状態を確認。iOS Safari実機での検証ではありません。

## 変更ファイル

| ファイル | 内容 |
| --- | --- |
| generator.js | compact専用alias・条件付き統合・3層分離、難ポーズの可視性補助、追加支持姿勢の出力画角補正 |
| advisor.js | 追加支持姿勢と基本姿勢・腕動作・拘束・寝姿・クロップの競合案内 |
| data/postures.js | 床支持、ブリッジ基本姿勢、7種の支持姿勢と適合メタデータ |
| data/body.js | knees_apart |
| data/limbs.js | 床に両手、膝に両手、腕上げ、上げた足首保持、腕下垂、ブリッジ支持 |
| data/special.js | 運動・演出用の新規8プリセット、説明文・分類 |
| data/preset-utils.js | special_pose系統、実際の拘束指定に基づく分類 |
| tests.js | 追加姿勢・短縮・互換性・統合条件・分類の回帰テスト |
| index.html / tests.html | スクリプトのキャッシュ識別子を20260907aへ更新 |
| README.md | 件数、機能、設計判断と制限を更新 |
| CHANGELOG-20260907.md | 本レポート |

`state.js`、`storage.js`、`app.js`、既存プリセット定義は変更していません。追加値は既存の正規化配列から読み込まれます。

## 短縮の設計

`compactLayers(state)` は `semantic`（主姿勢）、`modifiers`（補助条件）、`stability`（安定化補助）を返します。compactだけで使い、detailedの文章や元のデータ語彙は書き換えません。

- `arms crossed`、`one hand on chin`、`looking back over shoulder`、`from above / below`、`dutch angle`、`on back / stomach / side` などの短い語へ、完全一致した自動生成句だけを置換。
- 正面顔＋Viewer直視＋開眼のときだけ `looking at viewer` に統合。横顔・伏し目・視線外しの違いは維持。
- 片脚重心＋軽い腰ずれ＋斜めの骨盤＋対応する上体の向き＋中立の傾き＋見える画角が揃うときだけ `contrapposto` を使用。胴体・骨盤の向き自体は残す。
- 四点支持は `on all fours` を核にし、両手両膝の接地、四点への荷重、腰の高さ、前傾、全身・両手・両膝の可視性を維持。
- 拘束・Viewer interaction・出力補助は句単位で原文維持。自由入力は分割・短縮せず、改行やカンマも含めて末尾へ保持。
- 追加難ポーズに限り `natural limb anatomy` と必要な支持点の可視性を追加。通常の立位には混入しない。

## 追加したポーズ

「プリセットから作る」→「特殊・演出」→「特殊ポーズ・運動」で8件を表示できます。撮影範囲はすべて全身です。

| UI名 | ID | 主な構造 |
| --- | --- | --- |
| 土下座 | special_dogeza | 膝をつく＋深いお辞儀＋床に両手、頭を床へ下げる |
| 両腕を上げるストレッチ | special_arms_up_stretch | 立位＋両腕を頭上へ伸ばす |
| 蹲踞 | special_sonkyo | 深いしゃがみ＋かかとを上げる＋膝に手 |
| 四股の構え | special_shiko_stance | 両足接地＋広い足幅＋低い重心＋膝に手 |
| I字バランス | special_i_balance | 片脚接地＋反対脚を縦へ上げる＋両手で足首保持 |
| 馬跳びの馬 | special_leapfrog_base | 前屈＋背中を床と平行＋膝に両手 |
| 前屈 | special_forward_bend | 股関節から折る＋両足接地＋腕を床へ垂らす |
| ブリッジ | special_bridge_pose | 手のひら・足裏で支持＋胴体を上げて反る |

新規8件は拘束・Viewer interactionとも初期OFFです。プリセットの読み込み後も各項目を編集できます。非表示の詳細候補は「詳しく調整」で展開できます。

## 代表的なcompact全文比較

文字数はJavaScriptの文字列長です。トークン数や画像生成成功率の比較ではありません。

### 斜め向きのモデル立ち（model_three_quarter）

643文字 → 449文字（30%短縮）。

Before:

```text
solo character standing, weight shifted onto one leg, relaxed stance, one leg placed forward, one knee slightly bent, pelvis angled three-quarters to the viewer, a slight hip shift, torso turned slightly toward the viewer, one shoulder subtly forward, one hand resting on the hip, the other arm hanging relaxed at the side, head turned toward the viewer, chin slightly lowered, eyes looking just past the viewer, with a slightly averted gaze, knee-up shot, viewed from slightly below, subject placed left of center, open space on the right, flat composition, clear foreground-to-background separation, balanced composition with subtle dynamism
```

After:

```text
solo character standing, contrapposto, one hand on hip, other arm relaxed at side, head turned toward the viewer, chin slightly lowered, eyes looking just past the viewer, with a slightly averted gaze, relaxed stance, one leg forward, one knee bent, three-quarter pelvis, torso slightly toward viewer, one shoulder forward, knee up, from slightly below, subject left of center, space on right, flat composition, layered depth, subtle dynamic balance
```

### 腕組みの上半身ポートレート（crossed_bust）

367文字 → 232文字（37%短縮）。

Before:

```text
solo character standing, pelvis facing the viewer, torso aligned with the pelvis, shoulders drawn back, arms crossed naturally across the chest, head turned toward the viewer, eyes directed toward the viewer, with a direct gaze, bust shot, viewed at eye level, subject centered in the frame, flat composition, subject separated from the background, stable composition
```

After:

```text
solo character standing, arms crossed, looking at viewer, pelvis facing viewer, torso aligned with pelvis, shoulders drawn back, bust shot, eye level, centered composition, flat composition, background separation, stable composition
```

### 顎に手を添える思案ポーズ（thinking）

485文字 → 391文字（19%短縮）。

Before:

```text
solo character standing, pelvis angled three-quarters to the viewer, torso turned slightly toward the viewer, shoulders relaxed, one hand touching the chin, the other arm crossing the body, head turned slightly away, chin slightly lowered, neck tilted slightly, eyes focused on a nearby point, with a downward gaze, upper-body shot, viewed at eye level, subject placed right of center, open space on the left, flat composition, subject separated from the background, stable composition
```

After:

```text
solo character standing, one hand on chin, the other arm crossing the body, head turned slightly away, chin slightly lowered, slight head tilt, eyes focused on a nearby point, with a downward gaze, three-quarter pelvis, torso slightly toward viewer, shoulders relaxed, upper body, eye level, subject right of center, space on left, flat composition, background separation, stable composition
```

### ベッドで四つん這い、こちらを振り返る恋人（relationship_bed_hands_and_knees_look_back）

1168文字 → 971文字（17%短縮）。

Before:

```text
solo character kneeling, on a bed, on hands and knees, both palms flat on the bed, both knees on the bed, weight supported by all four points, hips raised, torso leaning forward, full body visible, both hands visible, both knees visible, lowered center of gravity, resting on both knees, both knees bent, back-focused pose with the back and waist clearly visible, torso kept facing away, only the head turned toward the viewer, torso and hips remain facing away, pelvis turned away from the viewer, a slight hip shift, torso aligned with the pelvis, torso leaning forward, one shoulder subtly forward, head looking back over the shoulder, neck tilted slightly, a soft gentle smile, eyes directed toward the viewer, with an over-the-shoulder gaze, at close conversational distance, full-body shot, viewed at eye level, subject placed left of center, open space on the right, soft foreground framing, clear foreground-to-background separation, balanced composition with subtle dynamism, wearing a white t-shirt and black lounge shorts, shorts clearly visible, fully clothed, clothing intact, shirt resting naturally, clothing fully covering the torso, hips, and buttocks
```

After:

```text
solo character kneeling, on a bed, on all fours, looking back over shoulder, slight head tilt, a soft gentle smile, eyes directed toward the viewer, both palms and knees on bed, weight supported by all four points, hips raised, leaning forward, low center of gravity, resting on both knees, both knees bent, back-focused pose with the back and waist clearly visible, torso kept facing away, only the head turned toward the viewer, torso and hips remain facing away, pelvis turned away from the viewer, slight hip shift, torso aligned with pelvis, one shoulder forward, at close conversational distance, full body, eye level, subject left of center, space on right, soft foreground framing, layered depth, subtle dynamic balance, full body visible, both hands visible, both knees visible, wearing a white t-shirt and black lounge shorts, shorts clearly visible, fully clothed, clothing intact, shirt resting naturally, clothing fully covering the torso, hips, and buttocks
```

## 互換性・テスト範囲

保存形式は1.0のまま、保存キーも変更していません。既存IDは保持し、既存保存データへ新しい支持姿勢や拘束を自動追加しません。新しい7支持姿勢で画角が狭い場合は、生成時のコピーだけ全身に補正して、Advisorと日本語構造に理由を表示します。保存した画角は保持されます。

テストには全77件のhard警告0件・空出力防止、新規8件の保存往復と編集、フィルター件数、aria-pressed生成、条件付き視線統合・contrapposto、四点支持補助、拘束ブロック維持、自由入力原文保持、狭い画角補正、支持姿勢の身体・腕・拘束競合を含みます。

## 判断・残る確認

- 性的フェティッシュを目的にした強調・露骨な性的ポーズは対象外です。候補12件のうち4件は未追加、腋強調の候補は一般的な両腕ストレッチへ変更しました。12件すべてを実装したものではありません。
- 四股は、仕様の「大きく脚を開き低く構える」に合わせ、脚上げ前の構えに限定しました。片脚を上げて踏み下ろす連続動作は未実装です。
- `natural limb anatomy` などの補助は生成成功を保証しません。同じモデル・seed・キャラクター条件での画像比較は未実施です。
- 追加支持姿勢とクロップの競合は、ユーザーがAdvisor修正案を選んで解消する方式です。クロップ値を黙って消しません。
- 旧バージョンへ戻すと、新規IDは旧正規化処理により未指定へ戻ることがあります。新規プリセットを保存した後は最新版を使ってください。
- GitHub連携は書き込み権限エラー、ブラウザはログアウト状態だったため、このレポート作成時点では公開版未反映です。ログイン後に公開反映とPages確認を行えます。
