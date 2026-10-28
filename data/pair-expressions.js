(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // 人物A・B別の表情辞書（2026-10-28）
  // tags：SDXL・NovelAI共通のタグ（Danbooruのタグ一覧で実在を確認済み）
  // nai ：NovelAIだけに足す自然な英語句（該当するタグが無い表情だけ。V4.5以降は英文も解釈する）
  // tsubaki：自然文で使う句。main は「has ＿」、gaze は動詞句（{other} は相手の名前）、sub は「with ＿」として文に入る
  // 将来「口元」などを足すときは、slots に枠を足し、同じ形の配列を加える。

  D.pairExpressionSlots = [
    { id: 'main', labelJa: 'メイン表情' },
    { id: 'gaze', labelJa: '視線' },
    { id: 'sub', labelJa: '補助表情' }
  ];

  function e(id, labelJa, descJa, tsubaki, tags, extra) {
    var item = { id: id, labelJa: labelJa, descJa: descJa, tsubaki: tsubaki, tags: tags, nai: [], keywords: [] };
    Object.keys(extra || {}).forEach(function (k) { item[k] = extra[k]; });
    return item;
  }

  D.pairExpressions = {
    main: [
      e('expressionless', '無表情', '感情を抑えた表情', 'an expressionless face', ['expressionless'], { keywords: ['むひょうじょう', 'クール', '真顔'] }),
      e('slight_smile', '微笑み', '軽い笑み', 'a slight smile', ['light smile'], { smile: true, keywords: ['ほほえみ', 'にこ'] }),
      e('gentle_smile', '優しい笑顔', '柔らかく穏やかな笑顔', 'a gentle smile', ['smile'], { smile: true, nai: ['gentle smile'], keywords: ['やさしい', '穏やか', '笑顔'] }),
      e('troubled', '困り顔', '少し困った表情', 'a troubled, worried expression', ['worried'], { keywords: ['こまりがお', '困る', '心配'] }),
      e('surprised', '驚き', '目を見開く', 'a surprised expression with wide-open eyes', ['surprised'], { eyesOpen: true, keywords: ['おどろき', 'びっくり'] }),
      e('shy', '照れ', '恥じらいのある表情', 'a shy, embarrassed expression', ['embarrassed', 'shy'], { keywords: ['てれ', '恥ずかしい', 'はにかむ'] }),
      e('blush', '赤面', '顔を赤らめる', 'a flushed face', ['blush'], { keywords: ['せきめん', '赤い', '頬'] }),
      e('dreamy', 'うっとり', 'とろんと惹き込まれた様子', 'a dreamy, entranced expression', ['light blush', 'smile'], { smile: true, nai: ['dreamy expression'], keywords: ['とろん', '見とれる', '夢見心地'] }),
      e('wistful', '切なげ', '物憂げ・切なげ', 'a wistful expression', ['sad smile'], { nai: ['wistful'], keywords: ['せつない', '物憂げ', '寂しげ'] }),
      e('confident_smile', '余裕のある笑み', '主導感のある笑み', 'a confident smile', ['smug'], { smile: true, nai: ['confident smile'], keywords: ['よゆう', '自信', 'したり顔'] }),
      e('playful_smile', 'いたずらっぽい笑み', '茶目っ気のある笑み', 'a playful smile', ['naughty face'], { smile: true, nai: ['playful smile'], keywords: ['いたずら', '茶目っ気', 'にやり'] }),
      e('teasing_smile', '挑発的な笑み', '煽るような笑み', 'a teasing smile', ['smirk', 'teasing'], { smile: true, keywords: ['ちょうはつ', '煽る', 'からかう', 'にやり'] })
    ],
    gaze: [
      e('look_at', '見つめる', '相手と視線を合わせる', 'is looking at {other}', ['looking at another'], { keywords: ['みつめる', '視線'] }),
      e('look_up', '見上げる', '下から見上げる', 'is looking up at {other}', ['looking up', 'looking at another'], { direction: 'up', keywords: ['みあげる', '上目遣い'] }),
      e('look_down', '見下ろす', '上から見下ろす', 'is looking down at {other}', ['looking down', 'looking at another'], { direction: 'down', keywords: ['みおろす'] }),
      e('look_away', '目をそらす', '恥ずかしさや戸惑い', 'is looking away from {other}', ['looking to the side'], { keywords: ['めをそらす', '目線を外す', '照れ'] }),
      e('side_glance', '横目で見る', 'チラ見・流し目', 'is giving {other} a sideways glance', ['sideways glance'], { keywords: ['よこめ', '流し目', 'チラ見'] }),
      e('downcast', '伏し目', '目線を落とす', 'has downcast eyes', ['downcast eyes'], { keywords: ['ふしめ', '目を伏せる'] }),
      e('closed', '目を閉じる', '柔らかい感情表現', 'has their eyes closed', ['closed eyes'], { eyesClosed: true, keywords: ['めをとじる', '閉じた目'] }),
      e('half_closed', '半目', 'とろん・けだるい', 'has half-lidded eyes', ['half-closed eyes'], { eyesClosed: true, keywords: ['はんめ', 'けだるい', 'とろん'] }),
      e('teary', '潤んだ目', '感情が高まった印象', 'has teary, glistening eyes', ['tearing up'], { keywords: ['うるんだ', '涙目', 'なみだ'] })
    ],
    sub: [
      e('gasp', '息を呑む', 'はっとしたニュアンス', 'lips parted in a small gasp', [':o'], { mouthOpen: true, keywords: ['いきをのむ', 'はっと'] }),
      e('parted_lips', '口を少し開ける', '近距離感を出す', 'lips slightly parted', ['parted lips'], { keywords: ['くちをあける', '唇'] }),
      e('pressed_lips', '唇を引き結ぶ', '我慢・緊張', 'lips pressed together', ['closed mouth'], { keywords: ['くちびる', '口を結ぶ', '我慢'] }),
      e('faint_smile', '微かに笑う', '控えめな笑み', 'a faint smile', ['light smile'], { keywords: ['かすかに', '控えめ', 'ほほえみ'] }),
      e('heavy_blush', '赤面強め', '顔全体が赤い', 'a deeply flushed face', ['full-face blush'], { keywords: ['せきめん', '真っ赤', '赤い'] }),
      e('tense', '緊張', 'こわばり', 'a tense, nervous look', ['nervous'], { keywords: ['きんちょう', 'こわばる'] }),
      e('affectionate', '甘える', '依存・身を預ける感じ', 'an affectionate look', ['affectionate'], { keywords: ['あまえる', '甘え', '懐く'] }),
      e('restrained', '我慢している', '感情を抑えている', 'a look of holding back their feelings', ['furrowed brow'], { nai: ['restrained expression'], keywords: ['がまん', 'こらえる'] })
    ]
  };

  // 同じ人物の中で両立しない組み合わせ。あとから選んだ枠の候補を無効にし、理由を表示する。
  // [枠, ID, 枠, ID, 理由]
  var conflicts = [];
  D.pairExpressions.main.filter(function (x) { return x.eyesOpen; }).forEach(function (m) {
    D.pairExpressions.gaze.filter(function (g) { return g.eyesClosed; }).forEach(function (g) { conflicts.push(['main', m.id, 'gaze', g.id, '「' + m.labelJa + '」は目を見開く表情のため、閉じた目・半目とは両立しません。']); });
  });
  D.pairExpressions.main.filter(function (x) { return x.smile; }).forEach(function (m) {
    conflicts.push(['main', m.id, 'sub', 'faint_smile', 'メイン表情がすでに笑みのため重なります。']);
    conflicts.push(['main', m.id, 'sub', 'gasp', '笑みと「息を呑む」の口の形は両立しません。']);
  });
  conflicts.push(['main', 'expressionless', 'sub', 'faint_smile', '無表情と笑みは両立しません。']);
  conflicts.push(['main', 'expressionless', 'sub', 'affectionate', '無表情と甘える表情は両立しません。']);
  conflicts.push(['main', 'blush', 'sub', 'heavy_blush', 'メインの「赤面」と重なります。赤面強めだけにする場合は、メイン表情を別にしてください。']);
  D.pairExpressionConflicts = conflicts;

  // ポーズの上下関係から見て不自然になりやすい視線（警告のみ。選択は止めない）
  D.pairGazeVerticalHints = {
    a_above: { a: 'up', b: 'down' },
    a_taller: { a: 'up', b: 'down' },
    b_carried: { a: 'down', b: 'up' }
  };
})(window);
