# 二人用ポーズ拡張（46種）・人物A/B別の表情 改修レポート

実装日：2026-10-28
比較元：公開main `77e5222`

## 結果

- 二人用ポーズ：7種 → 46種（追加39種）。依頼書の5分類（抱擁・密着11／座位・膝上8／ベッド・寝姿11／立位・壁際9／支え・抱き上げ7）で絞り込める。
- 人物A・Bごとに「メイン表情（12）・視線（9）・補助表情（8）」を指定できる。Tsubaki・SDXL・NovelAIへ自動で反映する。
- 表情が未指定のときの出力は改修前と完全一致：既存7ポーズの全7,284通り、一人用154通り。差分0。
- 自動テスト：634件 → 656件、656件すべて成功（Node VM・Chromium双方）。
- 390px・320px幅で横スクロールなし、コンソールエラーなし（Chromiumでの確認。iOS Safari実機での検証ではありません）。

## 先に行った調査

### 既存ポーズとの重複整理

依頼書の44案のうち次の5案は既存ポーズと同じ構図のため統合し、検索語として残した（「横抱き」で検索するとお姫様抱っこが出る、など）。

| 依頼書の案 | 統合先 |
| --- | --- |
| 2. 背後から抱きしめる | 背後から抱き寄せる（既存） |
| 14. 膝の上で抱きつく | 膝の上に向かい合って座る（既存） |
| 15. 背中を預けて膝上に座る | 膝の上に背中を向けて座る（既存） |
| 25. ベッド上で一方が覆いかぶさる | 仰向けの相手に覆いかぶさる（既存） |
| 38. 横抱き | 37. お姫様抱っこ |

似ている案は、接触点で区別した（例：額を寄せ合う＝額が触れる／鼻先が触れそうな距離＝触れない、壁際で見つめ合う＝半歩離れる／壁に背を預けた相手へ身を寄せる＝体が触れる）。

解釈を決めた案：

- 16「太ももの上に手を置かせる」→ 並んで座り、AがBの太もも（膝の少し上）へ手を置く形にした。
- 26「片手をシーツにつきながら見下ろす」→ Bの横に膝をつき、Bの肩の向こうへ片手をつく形。27「隣で身を乗り出す」は横向きに寝てひじをつく形にした。
- 23「一方が相手の上に体重を預ける」→ うつ伏せで上半身だけをBの胸に預け、脚は横へ伸ばす形。
- 32「壁際で抱き上げる」・44「しがみつく」→ 腰を持って持ち上げる形。脚を相手の腰に回す形は採らない（下記）。

### タグの実在確認

SDXL・NovelAIの多くはDanbooruのタグで学習されているため、AUTOMATIC1111用補完拡張（a1111-sd-webui-tagcomplete）が公開しているDanbooruのタグ一覧（約14万件・投稿数つき）で照合した。

- 追加ポーズと表情で使うタグ104語は、すべて実在するタグ名と完全一致。
- 依頼書の表情タグ案のうち次はDanbooruに無いため、近い実在タグへ置き換えた。NovelAI（V4.5以降は英文も解釈する）には自然な英語句を添える。

| 依頼書の案 | 採用したタグ（SDXL・NovelAI） | NovelAIに添える英語句 |
| --- | --- | --- |
| gentle smile | smile | gentle smile |
| troubled expression | worried | — |
| dreamy expression | light blush, smile | dreamy expression |
| confident smile | smug | confident smile |
| playful smile | naughty face | playful smile |
| teasing smile | smirk, teasing | — |
| slight smile / faint smile | light smile（slight smile は別名） | — |
| looking away | looking to the side | — |
| side glance | sideways glance（side glance は別名） | — |
| teary-eyed | tearing up | — |
| pressed lips | closed mouth | — |
| heavy blush | full-face blush | — |
| tense expression | nervous | — |
| restrained expression | furrowed brow | restrained expression |

- 使わなかったタグ：`leg lock`（脚を相手の腰に回す）と `pinned` は、Danbooruで成人向け・力ずくの文脈に多く使われるため避けた。
- `downcast eyes`（伏し目）は実在するが投稿数が141件と少なく、効きが弱い可能性がある。

### 既存の二人用データにあった、Danbooruに無い語（今回は変更していない）

「未入力時は既存出力と一致」の条件を守るため、既存7ポーズと共通の表（視線・カメラ・場所）は変更していない。次の語はDanbooruのタグとしては存在しない。修正するかどうかは別途判断が必要。

| 語 | 使っている場所 | 実在タグの候補 |
| --- | --- | --- |
| looking away | 二人の視線「AがBを見つめ、Bは視線を外す」 | looking to the side |
| eye level / three-quarter view / top-down view | カメラ角度 | （該当タグなし。straight-on 等は要確認） |
| sitting on bed / sitting on couch / sitting on chair | 場所（Bが座る） | on bed / on couch / on chair + sitting |
| leaning over / hands beside head | 覆いかぶさる | leaning forward など |
| close together / face near another's shoulder | 背後から身を寄せる | — |
| chin on shoulder | 背後から抱き寄せる | head on another's shoulder |

## 視線の扱い（二人の視線と人物別の視線）

- 人物別の視線を選んだ人物は、それを使う。
- 選んでいない人物には、「場所・視線」の二人の視線から、その人物の分を導いて使う（例：見つめ合う → 「is looking into Person B's eyes」）。
- 誰も選ばなければ従来どおり（出力は一致）。
- 二人の視線と食い違う場合、NovelAIの共通プロンプトの `eye contact` は外す。
- ポーズの上下関係と逆の視線（覆いかぶさる側が「見上げる」、抱き上げられた側が「見上げる」など）は警告する。

## 出力

| 出力先 | 表情の入り方 |
| --- | --- |
| Tsubaki | 人物ごとに「外見 → 表情」の順で一文ずつ。例：`Person B has a shy, embarrassed expression and is looking up at Person A, with lips slightly parted.` |
| SDXL | 人数 → 主ポーズ → Aの外見 → Bの外見 → Aの表情 → Bの表情 → 身体配置 → カメラ |
| NovelAI | Character 1・2 に「性別 → 外見 → 表情 → source#/target# → 配置」。共通には人数・ポーズ・場所・カメラ |

## UI

- 人物A・Bの欄に、折りたたみ式の「表情」（メイン・視線・補助を横スクロールの候補で選択）。選択中の候補は自動で見える位置へ送る。
- 表情の検索（ひらがな・カタカナ・漢字・英語タグ）。
- 両立しない組み合わせ（驚き×目を閉じる、笑み×微かに笑う、赤面×赤面強め など）は選べず、理由を表示。
- 「このポーズのおすすめ表情」（空いている枠にだけ入れる）、「表情だけリセット」、「人物Aをクリア／人物Bをクリア」（外見・服装と表情を消し、性別は残す）。
- ポーズ選択と「プリセットから開始」の二人用タブは、5カテゴリで絞り込む。

## データ

- `people.a.expression` / `people.b.expression`（`main`・`gaze`・`sub`）。表情欄のない旧保存データは未指定として読む。
- 表情の枠は `D.pairExpressionSlots` の配列。将来「口元」を足すときは枠と辞書を足すだけで、出力・UI・保存が追従する。

## テストで変えたもの

既存テストのうち、「二人用ポーズはちょうど7種」を前提にした2件の断言だけを、仕様の変更に合わせて「当初の7種が先頭に同じ順で残り、全46種」に書き換えた。他の既存テストは変更していない。

## 未対応（優先度：低）

- 親密度フィルタ、お気に入り登録、表情セット保存は今回入れていない。

## 確認していないこと

生成画像での効き方（タグの置き換えや、Tsubakiの人物ごとの表情文が実際に混ざらず反映されるか）は、同一seedでの比較が必要。
