(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  /*
   * プリクラ・フォトブース 二人用29件（2026-10-30）
   * 出典：Manus調査 purikura_pair_candidates.json（PK-P001〜PK-P029）と「Claude実装指示書_プリクラ54ポーズ_20261030」。
   * 構造は data/pair-poses.js と同じ意味データ。既存68件の後ろに追加し、既存の視線・カメラ・場所の定義は変えない。
   *
   * 左右の書き方（重要）：
   * - 「画面の左／右」は画像上の位置（画面座標）。人物Aは画面の左、Bは右（前後のある候補は各候補に記載）。
   * - 手は「外側の手＝相手から遠い手」「内側の手＝相手に近い手」で書き、英語に left hand／right hand を使わない。
   *   正面を向いた画面左の人物の外側の手は、本人にとっては右手になる。Manus資料の「Aの左外手」「Aの右内手」は
   *   画面の左右と本人の左右が混ざっているため、生成モデルが本人の左右と読むと逆の手になる（実装では外側／内側に統一）。
   * - 既存の「A⇄B」は人物の外見・表情・メモを入れ替える機能で、位置・役割・接触点は動かさない（このファイルでも変えない）。
   * 英語に性別・年齢・外見・表情・服装・背景・照明・画風・品質・撮影機材（カメラ／スマホ）の語は入れない。
   * タグは danbooru.csv と完全一致した語だけ（D.purikuraPairVerifiedTags）。Manusの short_tags は使わない。
   */

  D.pairPoseCategories.pk_classic = 'プリクラ：王道・おそろい';
  D.pairPoseCategories.pk_touch = 'プリクラ：近接・役割接触';
  D.pairPoseCategories.pk_shape = 'プリクラ：共同形状・顔フレーム';
  D.pairPoseCategories.pk_layer = 'プリクラ：前後・高低差・非対称';

  // Bの顔が高い位置（しゃがむA・座るA・膝を曲げるAの後ろや横にBが立つ候補）。既存の上下関係は変えない。
  D.pairRelationLabels.vertical.b_taller = 'Bの顔が高い位置';
  D.pairRelationTsubaki.vertical.b_taller = "Person B's head is higher than Person A's head.";
  D.pairGazeVerticalHints = D.pairGazeVerticalHints || {};
  D.pairGazeVerticalHints.b_taller = { a: 'down', b: 'up' };

  D.purikuraPairVerifiedTags = {
    'side-by-side': 10408, 'cheek-to-cheek': 5126, 'heads together': 10165, 'v': 151368, 'double v': 27325, 'waving': 26502,
    'hand on own chin': 18162, 'hand on own cheek': 24290, 'finger heart': 1825, 'heart hands duo': 3421, 'arm hug': 5454,
    "head on another's shoulder": 2883, 'cheek poking': 2887, "hand on another's arm": 5776, "hand on another's cheek": 7872,
    'looking at viewer': 3315722, 'looking at another': 264736, 'own hands together': 78093, 'holding own arm': 6505,
    "holding another's wrist": 12632, 'finger frame': 1368, 'arms up': 188117, 'arm up': 208569, 'hands up': 180440,
    'pointing at another': 2395, 'squatting': 86123, 'sitting': 939842, 'on one knee': 13347, 'standing': 901688,
    'hand on own chest': 61930, 'hand on own hip': 153755, "hand on another's shoulder": 25244, 'claw pose': 18551,
    'spread arms': 20683, 'shoulder-to-shoulder': 326, 'facing viewer': 62315, 'looking back': 281064, 'head tilt': 139388,
    'leaning on person': 6528, 'arm at side': 42804, 'hands on lap': 3234, 'outstretched hand': 24080, 'hand on own knee': 12078
  };

  var VIEWER = { ja: 'こちら（カメラ）', en: 'the viewer', tags: ['looking at viewer'] };
  var G_SYNC = { allowed: ['both_viewer', 'a_focus_b_looks', 'b_focus_a_looks', 'eyes_closed'], defaultId: 'both_viewer' };
  var G_A_FWD = { allowed: ['a_focus_b_looks', 'both_viewer', 'eyes_closed'], defaultId: 'a_focus_b_looks' };   // Aは前方、BはAを見る
  var G_B_FWD = { allowed: ['b_focus_a_looks', 'both_viewer', 'eyes_closed'], defaultId: 'b_focus_a_looks' };   // AはBを見る、Bは前方
  var BL_SIDE = '真横からは二人の顔と手の形が重なって読めません。', BL_TOP = '真上からは顔と手の形が見えません。', BL_LOW = '下からは顔の前の手が顔に重なりやすく、正面の構図になりません。';
  function cam(angles, recommended, def, shot, shots, blockedShots, blocked) {
    var all = { eye_level: 1, three_quarter: 1, side: 1, high: 1, low: 1, overhead: 1 }, bl = {};
    var reasons = Object.assign({ side: BL_SIDE, overhead: BL_TOP, low: BL_LOW, high: '上からは手の形と高低差が読みにくくなります。', three_quarter: '斜めからは共同の形が崩れて見えます。', eye_level: '' }, blocked || {});
    Object.keys(all).forEach(function (k) { if (angles.indexOf(k) < 0) bl[k] = reasons[k]; });
    return { angles: angles, recommended: recommended, defaultAngle: def, defaultShot: shot, shots: shots, blocked: bl, blockedShots: blockedShots || {} };
  }
  var NO_CLOSE = { close: '顔まわりの画角では、胸元までの手の形と二人の配置が切れます。' };
  var FRONT_UB = cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'upper_body', ['upper_body', 'knee_up', 'full_body'], NO_CLOSE);
  var ANGLE_UB = cam(['three_quarter', 'eye_level', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'upper_body', ['upper_body', 'knee_up', 'full_body'], NO_CLOSE);
  var FRONT_CLOSE = cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'upper_body', ['close', 'upper_body', 'knee_up', 'full_body']);
  var LAYER_NO_CLOSE = { close: '顔まわりの画角では、高さの違い（座る・しゃがむ・膝を曲げる）が読めません。' };

  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function ex(main, gaze, sub) { return { main: main || null, gaze: gaze || null, sub: sub || null }; }
  function pose(d) {
    return {
      id: d.id, sourceId: d.sourceId, labelJa: d.label, shortJa: d.short, poseFamily: d.family, category: d.category,
      priority: d.priority, difficultyJa: d.difficulty,
      roles: { a: d.roles[0], b: d.roles[1] },
      relation: { vertical: d.rel[0], depth: d.rel[1], facing: d.rel[2] },
      placement: { a: d.place[0], b: d.place[1] },
      contacts: d.contacts.map(function (c) { return { owner: c[0], ja: c[1], tsubaki: c[2] }; }),
      models: {
        tsubaki: { roleEn: { a: d.roleEn[0], b: d.roleEn[1] }, overview: d.ts[0], a: d.ts[1], b: d.ts[2] },
        sdxl: { core: d.sdxl[0], placement: d.sdxl[1] },
        nai: { core: d.nai.core, actions: (d.nai.actions || []).map(function (x) { return { tag: x[0], source: x[1] }; }), a: d.nai.a, b: d.nai.b, nl: d.nai.nl }
      },
      focus: VIEWER,
      minNoteJa: d.minNote,
      fallback: d.fallback || null,
      camera: copy(d.camera),
      surface: { mode: 'none', allowed: [], defaultId: null },
      gazes: copy(d.gazes || G_SYNC),
      keywords: ['プリクラ', 'フォトブース', '4カット'].concat(d.keywords),
      related: [],
      suggest: d.suggest || { a: ex('playful_smile'), b: ex('gentle_smile') },
      purikura: true,
      people: 2,
      collection: 'relationship'
    };
  }
  var SIDE_EN = 'Person A on the left side of the image and Person B on the right';

  var list = [
    // ================= 王道・おそろい =================
    pose({
      id: 'pair_purikura_p001', sourceId: 'PK-P001', category: 'pk_classic', family: 'face_gesture', priority: 'P1', difficulty: '低',
      label: '頬を寄せて、外側の手でおそろいピース', short: '横並びで頬と肩を軽く寄せ、二人とも外側の手（相手から遠い手）で、外側のこめかみの横にVを作る。',
      roles: ['画面左・外側の手でピース', '画面右・外側の手でピース'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、Bと近い頬と内側の肩を軽く寄せて正面を向く。外側の手（Bから遠い手）でVを作り、外側のこめかみの横に置く。内側の手は胸元より下で分ける。', '画面の右に立ち、Aと近い頬と内側の肩を軽く寄せて正面を向く。外側の手（Aから遠い手）でVを作り、外側のこめかみの横に置く。内側の手は胸元より下で分ける。'],
      contacts: [['both', '近い頬どうし・内側の肩 → 軽く触れている（手どうしは触れない）', 'their nearer cheeks and inner shoulders touch lightly'], ['a', 'Aの外側の手 → 外側のこめかみの横でV', "Person A's outer hand makes a V sign beside Person A's outer temple"], ['b', 'Bの外側の手 → 外側のこめかみの横でV', "Person B's outer hand makes a V sign beside Person B's outer temple"]],
      roleEn: ['the one on the left making a V sign with the outer hand', 'the one on the right making a V sign with the outer hand'],
      ts: [SIDE_EN + ' stand side by side facing forward, their nearer cheeks gently touching.', 'Person A raises the outer hand, the one farther from Person B, in a V sign beside the outer temple, with the inner hand kept low.', 'Person B raises the outer hand, the one farther from Person A, in a V sign beside the outer temple, with the inner hand kept low.'],
      sdxl: [['cheek-to-cheek', 'side-by-side', 'v'], ['facing viewer']],
      nai: { core: ['cheek-to-cheek', 'side-by-side'], a: ['v'], b: ['v'], nl: 'two people stand side by side with their cheeks touching, each making a V sign with the outer hand beside the outer temple' },
      minNote: '二つのVと二人の顔全体が入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['ピース', '頬寄せ', 'ほっぺ', 'おそろい', '外側の手', 'V', 'ほおよせ']
    }),
    pose({
      id: 'pair_purikura_p002', sourceId: 'PK-P002', category: 'pk_classic', family: 'face_gesture', priority: 'P2', difficulty: '中',
      label: 'こめかみを寄せて、外側の手でほおづえ', short: '頭だけを内側へ傾けてこめかみを寄せ、二人とも外側の手のひらで自分のあごを支える。肩の間は少し空ける。',
      roles: ['画面左・外側の手で自分のあごを支える', '画面右・外側の手で自分のあごを支える'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、頭だけを内側へ傾けてBとこめかみを寄せる。肩の間は少し空ける。外側の手のひらで自分のあごを下から支え、内側の手は低く下ろす。', '画面の右に立ち、頭だけを内側へ傾けてAとこめかみを寄せる。外側の手のひらで自分のあごを下から支え、内側の手は低く下ろす。'],
      contacts: [['both', '内側のこめかみどうし → 軽く触れている（肩の間は少し空ける）', 'their inner temples touch lightly while a small gap stays between their shoulders'], ['a', 'Aの外側の手のひら → 自分のあごの下', "Person A's outer palm supports Person A's own chin"], ['b', 'Bの外側の手のひら → 自分のあごの下', "Person B's outer palm supports Person B's own chin"]],
      roleEn: ['the one on the left resting the chin on the outer palm', 'the one on the right resting the chin on the outer palm'],
      ts: [SIDE_EN + ' stand side by side facing forward, heads tilted inward so their temples gently touch.', 'Person A rests their own chin on the outer palm, the hand farther from Person B, with the inner hand low.', 'Person B rests their own chin on the outer palm, the hand farther from Person A, with the inner hand low.'],
      sdxl: [['heads together', 'side-by-side', 'hand on own chin'], ['head tilt']],
      nai: { core: ['heads together', 'side-by-side'], a: ['hand on own chin', 'head tilt'], b: ['hand on own chin', 'head tilt'], nl: 'two people stand side by side with their temples touching, each resting the chin on the outer palm' },
      minNote: 'こめかみの接点と二つの手のひらが入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['ほおづえ', '頬杖', 'あご', 'こめかみ', 'おそろい', '外側の手']
    }),
    pose({
      id: 'pair_purikura_p003', sourceId: 'PK-P003', category: 'pk_classic', family: 'face_gesture', priority: 'P1', difficulty: '低',
      label: '肩を寄せて、外側の手で一緒に手を振る', short: '内側の肩だけを軽く触れさせ、二人とも外側の手を肩の高さで開いて小さく振る。内側の手は体の横。',
      roles: ['画面左・外側の手を振る', '画面右・外側の手を振る'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、内側の肩だけをBへ軽く寄せる。外側の手を肩の高さで開いて小さく振る。内側の手は体の横。', '画面の右に立ち、内側の肩だけをAへ軽く寄せる。外側の手を肩の高さで開いて小さく振る。内側の手は体の横。'],
      contacts: [['both', '内側の肩どうし → 軽く触れている（接点はここだけ）', 'only their inner shoulders touch lightly'], ['a', 'Aの外側の手 → 肩の高さで開いて振る', "Person A's outer hand is open at shoulder height in a small wave"], ['b', 'Bの外側の手 → 肩の高さで開いて振る', "Person B's outer hand is open at shoulder height in a small wave"]],
      roleEn: ['the one on the left waving the outer hand', 'the one on the right waving the outer hand'],
      ts: [SIDE_EN + ' stand side by side facing forward, inner shoulders lightly touching.', 'Person A waves the open outer hand at shoulder height, the inner hand low at the side.', 'Person B waves the open outer hand at shoulder height, the inner hand low at the side.'],
      sdxl: [['side-by-side', 'shoulder-to-shoulder', 'waving'], ['facing viewer']],
      nai: { core: ['side-by-side', 'shoulder-to-shoulder'], a: ['waving'], b: ['waving'], nl: 'two people stand shoulder to shoulder, both waving the outer hand at shoulder height' },
      minNote: '肩の接点と、手首から先が入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['手を振る', 'バイバイ', 'ばいばい', '肩寄せ', 'おそろい', '外側の手']
    }),
    pose({
      id: 'pair_purikura_p004', sourceId: 'PK-P004', category: 'pk_classic', family: 'face_gesture', priority: 'P2', difficulty: '中',
      label: '横並びで、内側の手を自分の頬に添える', short: '肩を少し離して横に並び、二人とも内側の手（相手に近い手）を自分の内側の頬に添える。中央に小さな余白を残す。',
      roles: ['画面左・内側の手で自分の頬に触れる', '画面右・内側の手で自分の頬に触れる'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、顔の高さをBとそろえて正面を向く。内側の手（Bに近い手）を自分の内側の頬に軽く添える（鼻や口の前を横切らない）。外側の手は低く。', '画面の右に立ち、顔の高さをAとそろえて正面を向く。内側の手（Aに近い手）を自分の内側の頬に軽く添える。外側の手は低く。'],
      contacts: [['a', 'Aの内側の手のひら → 自分の内側の頬', "Person A's inner palm lightly touches Person A's own inner cheek"], ['b', 'Bの内側の手のひら → 自分の内側の頬', "Person B's inner palm lightly touches Person B's own inner cheek"], ['both', '肩の間 → 少し空ける（二人は触れない）', 'a narrow space stays between their shoulders']],
      roleEn: ['the one on the left touching their own cheek with the inner hand', 'the one on the right touching their own cheek with the inner hand'],
      ts: [SIDE_EN + ' stand side by side facing forward, a narrow space between their shoulders.', 'Person A lightly touches their own inner cheek with the inner palm, the hand nearer Person B, with the outer hand low.', 'Person B lightly touches their own inner cheek with the inner palm, the hand nearer Person A, with the outer hand low.'],
      sdxl: [['side-by-side', 'hand on own cheek'], ['facing viewer']],
      nai: { core: ['side-by-side'], a: ['hand on own cheek'], b: ['hand on own cheek'], nl: 'two people stand side by side, each touching their own inner cheek with the inner hand' },
      minNote: '二人の顔と頬の手が入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['頬', 'ほっぺ', '手を添える', 'おそろい', '内側の手', '小顔']
    }),
    pose({
      id: 'pair_purikura_p005', sourceId: 'PK-P005', category: 'pk_classic', family: 'face_gesture', priority: 'P1', difficulty: '中',
      label: '外側のほっぺで、おそろいの指ハート', short: '近い横並びで、二人とも外側の手で、外側の頬の横に指ハートを作る。二つのハートは独立させる。',
      roles: ['画面左・外側の手で指ハート', '画面右・外側の手で指ハート'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、肩はBに近いが重ねない。外側の手で指ハートを作り、外側の頬の横に置く（顔から少し離す）。内側の手は低く。', '画面の右に立ち、肩はAに近いが重ねない。外側の手で指ハートを作り、外側の頬の横に置く。内側の手は低く。'],
      contacts: [['a', 'Aの外側の手 → 外側の頬の横で指ハート', "Person A's outer hand makes a finger heart beside Person A's outer cheek"], ['b', 'Bの外側の手 → 外側の頬の横で指ハート', "Person B's outer hand makes a finger heart beside Person B's outer cheek"], ['both', '肩 → 近いが重ならない（二人と手どうしは触れない）', 'their shoulders are close while each body keeps its own space']],
      roleEn: ['the one on the left making a finger heart with the outer hand', 'the one on the right making a finger heart with the outer hand'],
      ts: [SIDE_EN + ' stand close side by side facing forward.', 'Person A makes a finger heart with the outer hand beside the outer cheek, with the inner hand low.', 'Person B makes a finger heart with the outer hand beside the outer cheek, with the inner hand low.'],
      sdxl: [['side-by-side', 'finger heart'], ['facing viewer']],
      nai: { core: ['side-by-side'], a: ['finger heart'], b: ['finger heart'], nl: 'two people stand side by side, each making a finger heart with the outer hand beside the outer cheek' },
      minNote: '二人の顔と二つの指ハートが完全に入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['指ハート', 'ハート', '韓国', 'ほっぺ', 'おそろい', '外側の手']
    }),
    pose({
      id: 'pair_purikura_p006', sourceId: 'PK-P006', category: 'pk_classic', family: 'face_gesture', priority: 'P2', difficulty: '中',
      label: '胸元でおそろいの指ハート', short: '内側の肩を軽く寄せ、二人とも内側の手で自分の鎖骨の前に、同じ高さの指ハートを作る。外側の手は下ろす。',
      roles: ['画面左・内側の手で胸元に指ハート', '画面右・内側の手で胸元に指ハート'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、内側の肩をBへ軽く寄せて正面を向く。内側の手で、自分の鎖骨の前に指ハートを作る（鎖骨より高くしない）。外側の手は下ろす。', '画面の右に立ち、内側の肩をAへ軽く寄せて正面を向く。内側の手で、自分の鎖骨の前に指ハートを作る。外側の手は下ろす。'],
      contacts: [['both', '内側の肩どうし → 軽く触れている（二つの指ハートは触れない）', 'only their inner shoulders touch lightly'], ['a', 'Aの内側の手 → 自分の鎖骨の前で指ハート', "Person A's inner hand makes a finger heart in front of Person A's own collarbone"], ['b', 'Bの内側の手 → 自分の鎖骨の前で指ハート', "Person B's inner hand makes a finger heart in front of Person B's own collarbone"]],
      roleEn: ['the one on the left making a finger heart at the collarbone', 'the one on the right making a finger heart at the collarbone'],
      ts: [SIDE_EN + ' stand side by side facing forward, inner shoulders lightly touching.', 'Person A makes a finger heart with the inner hand in front of their own collarbone, the outer hand lowered.', 'Person B makes a finger heart with the inner hand in front of their own collarbone, the outer hand lowered.'],
      sdxl: [['side-by-side', 'shoulder-to-shoulder', 'finger heart'], ['arm at side']],
      nai: { core: ['side-by-side', 'shoulder-to-shoulder'], a: ['finger heart', 'arm at side'], b: ['finger heart', 'arm at side'], nl: 'two people stand shoulder to shoulder, each making a finger heart in front of their own collarbone' },
      minNote: '顔と二つの指ハートが入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['指ハート', 'ハート', '胸元', '鎖骨', 'おそろい', '内側の手']
    }),
    pose({
      id: 'pair_purikura_p007', sourceId: 'PK-P007', category: 'pk_classic', family: 'face_gesture', priority: 'P1', difficulty: '中',
      label: '二人の片手ずつで、中央にハート', short: '内側の手を中央へ寄せ、Aが左半分、Bが右半分を作って、あごの下で一つのハートを閉じる。頭は少し内側へ。',
      roles: ['画面左・内側の手でハートの左半分', '画面右・内側の手でハートの右半分'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、頭をわずかに内側へ傾ける。内側の手（Bに近い手）でハートの左半分を作り、指先をBの指先と中央で合わせる（手首は交差させない）。外側の手は低く。', '画面の右に立ち、頭をわずかに内側へ傾ける。内側の手（Aに近い手）でハートの右半分を作り、指先をAの指先と中央で合わせる。外側の手は低く。'],
      contacts: [['both', '内側の手の指先どうし → あごの下の中央で合わせる（一つのハート）', 'their inner fingertips meet at the center below their chins to close one heart'], ['a', 'Aの内側の手 → ハートの左半分', "Person A's inner hand forms the left half of the heart"], ['b', 'Bの内側の手 → ハートの右半分', "Person B's inner hand forms the right half of the heart"]],
      roleEn: ['the one on the left forming the left half of the heart', 'the one on the right forming the right half of the heart'],
      ts: [SIDE_EN + ' stand side by side facing forward with their heads tilted slightly inward, sharing one heart made with their inner hands.', 'Person A forms the left half of the heart with the inner hand, the outer hand low.', 'Person B forms the right half of the heart with the inner hand, the outer hand low.'],
      sdxl: [['heart hands duo', 'side-by-side'], ['head tilt']],
      nai: { core: ['heart hands duo', 'side-by-side'], a: ['head tilt'], b: ['head tilt'], nl: 'two people stand side by side and make one heart together with their inner hands below their chins' },
      minNote: '完成したハートと二人の顔が入ること（頭頂〜胸下）', camera: FRONT_UB,
      keywords: ['ハート', '二人でハート', '片手ずつ', '中央', 'おそろい', '内側の手']
    }),
    pose({
      id: 'pair_purikura_p008', sourceId: 'PK-P008', category: 'pk_classic', family: 'face_gesture', priority: 'P2', difficulty: '高',
      label: '頬を寄せて、二人とも両手でダブルピース', short: '頬を寄せた二人が四つのVを作る。外側の手は外側のこめかみの横、内側の手は自分のあごの下へ分ける。',
      roles: ['画面左・外側と内側の手で二つのV', '画面右・外側と内側の手で二つのV'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、Bと近い頬と内側の肩を軽く寄せる。外側の手のVを外側のこめかみの横に、内側の手のVを自分のあごの下に置く（内側の手を前へ伸ばさない）。', '画面の右に立ち、Aと近い頬と内側の肩を軽く寄せる。外側の手のVを外側のこめかみの横に、内側の手のVを自分のあごの下に置く。'],
      contacts: [['both', '近い頬どうし・内側の肩 → 軽く触れている（四つの手は触れない）', 'their nearer cheeks and inner shoulders touch lightly while all four hands stay separate'], ['a', 'Aの外側の手 → こめかみの横でV／Aの内側の手 → 自分のあごの下でV', "Person A makes one V sign beside the outer temple and one below their own chin"], ['b', 'Bの外側の手 → こめかみの横でV／Bの内側の手 → 自分のあごの下でV', "Person B makes one V sign beside the outer temple and one below their own chin"]],
      roleEn: ['the one on the left making two V signs', 'the one on the right making two V signs'],
      ts: [SIDE_EN + ' stand side by side facing forward with their nearer cheeks gently touching, each making two V signs.', "Person A holds the outer hand's V sign beside the outer temple and the inner hand's V sign below their own chin.", "Person B holds the outer hand's V sign beside the outer temple and the inner hand's V sign below their own chin."],
      sdxl: [['cheek-to-cheek', 'side-by-side', 'double v'], ['facing viewer']],
      nai: { core: ['cheek-to-cheek', 'side-by-side'], a: ['double v'], b: ['double v'], nl: 'two people with their cheeks touching each make two V signs, outer hands at the temples and inner hands below their own chins' },
      minNote: '四つのVと二人の顔がすべて入ること（頭頂〜胸下）', camera: FRONT_UB,
      fallback: { to: 'pair_purikura_p001', noteJa: '四つのVの持ち主が混ざって崩れる場合は、外側の手だけでピースする形が崩れにくい。' },
      keywords: ['ダブルピース', 'ピース', '頬寄せ', '四つのV', 'おそろい', '両手']
    }),

    // ================= 近接・役割接触 =================
    pose({
      id: 'pair_purikura_p009', sourceId: 'PK-P009', category: 'pk_touch', family: 'approach_touch', priority: 'P1', difficulty: '中',
      label: '腕を抱えて、肩に頭を預ける', short: 'BがAの内側の肩に頭の側面を預け、Bの両手でAの内側の前腕を持つ。抱き寄せはしない。Aは前、BはAを見る。',
      roles: ['肩と前腕を貸す側（画面左）', '頭を預けて前腕を両手で持つ側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立つ。内側の腕（Bに近い腕）は下ろしたまま、ひじを軽く曲げて前腕をBの腰の前あたりに低く出す（Bを抱き寄せない）。外側の腕は体の横に下ろす。', '画面の右に立ち、頭の側面をAの内側の肩に預ける。両手でAの内側の前腕を持つ（片手はAのひじの少し下、もう片手は手首の近く）。胸と腰はAに密着させない。'],
      contacts: [['b', 'Bの頭の側面 → Aの内側の肩', "the side of Person B's head rests on Person A's inner shoulder"], ['b', 'Bの両手 → Aの内側の前腕（ひじの少し下と手首の近く）', "Person B holds Person A's inner forearm with both hands, one just below the elbow and one near the wrist"], ['a', 'Aの内側の前腕 → Bの腰の前を低く通す（抱き寄せない）', "Person A's inner forearm rests low in front of Person B's waist"]],
      roleEn: ['the one lending a shoulder and a forearm', 'the one resting the head and holding the forearm'],
      ts: [SIDE_EN + ' stand side by side, and Person B rests the side of the head on Person A\'s inner shoulder.', "Person A keeps the inner forearm low in front of Person B's waist, the outer arm relaxed at the side.", "Person B holds Person A's inner forearm with both hands, one just below the elbow and one near the wrist."],
      sdxl: [['arm hug', "head on another's shoulder", 'side-by-side'], ['standing']],
      nai: { core: ['side-by-side', 'standing'], actions: [['arm hug', 'b']], a: ['arm at side'], b: ["head on another's shoulder"], nl: "one person rests the head on the other's shoulder and holds that person's forearm with both hands" },
      minNote: '二人の顔、肩の接点、Bの両手、Aの前腕が入ること（胸上以上）', camera: ANGLE_UB, gazes: G_A_FWD,
      fallback: { noteJa: '前腕や頬が重なって崩れる場合は、Bの手を一つにして（Aのひじの下だけを持つ）接点を減らすと崩れにくくなります。' },
      keywords: ['腕を抱える', '腕組み', '肩に頭', 'もたれる', '甘える', '前腕'],
      suggest: { a: ex('gentle_smile'), b: ex('playful_smile', null, 'affectionate') }
    }),
    pose({
      id: 'pair_purikura_p010', sourceId: 'PK-P010', category: 'pk_touch', family: 'approach_touch', priority: 'P1', difficulty: '中',
      label: '横に並んで、ほっぺをつつく', short: 'Aが内側の手の人差し指一本で、Bの近い頬を軽くつつく。BはAの前腕のひじの下に内側の手を添える。',
      roles: ['人差し指でつつく側（画面左）', '前腕に手を添えて受ける側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、肩だけをBへ軽く寄せる。内側の手の人差し指一本で、Bの近い頬を軽くつつく（他の指はBの顔にかけない）。外側の手は体の横。', '画面の右に立ち、顔を正面寄りに出す。内側の手を、Aの内側の前腕のひじの下に軽く添える。外側の手は体の横。'],
      contacts: [['a', 'Aの人差し指の先 → Bの近い頬', "Person A's index fingertip gently presses Person B's nearer cheek"], ['b', 'Bの内側の手 → Aの前腕のひじの下', "Person B's inner hand rests just below Person A's elbow"], ['both', '肩どうし → 軽く寄せる', 'their shoulders lean lightly together']],
      roleEn: ['the one poking the cheek', 'the one being poked'],
      ts: [SIDE_EN + ' stand side by side with both faces visible.', "Person A gently presses Person B's nearer cheek with one index fingertip, the outer hand low.", "Person B rests the inner hand just below Person A's elbow, the outer hand low."],
      sdxl: [['cheek poking', 'side-by-side'], ["hand on another's arm"]],
      nai: { core: ['side-by-side'], actions: [['cheek poking', 'a']], a: ['standing'], b: ["hand on another's arm"], nl: "one person pokes the other's cheek with an index finger while the other rests a hand below that person's elbow" },
      minNote: '二人の顔、指先、Bの前腕への手が入ること（胸上以上）', camera: ANGLE_UB,
      keywords: ['ほっぺつんつん', 'つつく', '頬', 'いたずら', '人差し指', 'つんつん'],
      suggest: { a: ex('playful_smile'), b: ex('surprised') }
    }),
    pose({
      id: 'pair_purikura_p011', sourceId: 'PK-P011', category: 'pk_touch', family: 'approach_touch', priority: 'P2', difficulty: '中',
      label: '半歩後ろから、片方の頬を包む', short: '半歩後ろのAが、Bの首の後ろを通した片手でBの遠い頬を包む。BはAの前腕に近い手を添える。AはBを見て、Bは前を見る。',
      roles: ['半歩後ろから頬を包む側（画面左・奥）', '前で受けて前腕に手を添える側（画面右・手前）'], rel: ['level', 'b_front', 'same_direction'],
      place: ['Bの半歩後ろ・画面の左に立ち、顔をBの肩の外側に出す。内側の腕をBの首の後ろに通し、開いた手でBの遠い頬を外側から包む（腕はBの顔の前を横切らない。親指は目元へ上げない）。', '半歩前・画面の右に立つ。近い手（Aに近い手）を、自分の肩の後ろを通るAの前腕に軽く添える。'],
      contacts: [['a', 'Aの内側の手のひら → Bの遠い頬（首の後ろを通して外側から）', "Person A's inner palm cups Person B's far cheek from the outside, the forearm passing behind Person B's neck"], ['b', 'Bの近い手 → Aの前腕', "Person B's near hand rests on Person A's forearm"], ['both', '顔 → 二人とも見えている（Bの肩でAの顔を隠さない）', 'both faces stay visible']],
      roleEn: ['the one behind cupping the cheek', 'the one in front with a hand on the forearm'],
      ts: ['Person A is on the left side of the image and Person B is on the right, Person B half a step forward and Person A just behind, both faces visible.', "Person A reaches the inner arm behind Person B's neck and gently cups Person B's far cheek from the outside.", "Person B rests the near hand on Person A's forearm."],
      sdxl: [["hand on another's cheek", 'standing'], ["hand on another's arm"]],
      nai: { core: ['standing'], a: ["hand on another's cheek"], b: ["hand on another's arm"], nl: "one person stands half a step behind and cups the other's far cheek, reaching behind the neck" },
      minNote: '二人の顔、Aの手、Bの前腕への手が入ること（胸上以上）', camera: ANGLE_UB, gazes: G_B_FWD,
      fallback: { noteJa: '腕が顔の前を横切る・顔が隠れる場合は、Aの手をBの近い頬の外縁に沿わせる形（遠い頬まで回さない）にすると崩れにくくなります。' },
      keywords: ['頬を包む', '頬', 'ほっぺ', '後ろから', '前後', '甘い'],
      suggest: { a: ex('gentle_smile'), b: ex('shy') }
    }),
    pose({
      id: 'pair_purikura_p012', sourceId: 'PK-P012', category: 'pk_touch', family: 'approach_touch', priority: 'P2', difficulty: '低',
      label: 'こめかみを寄せて、片方だけ相手を見る', short: '横に並んでこめかみだけを寄せ、AがBを見て、Bは前を見る。外側の手は自分の内側の前腕を低く持つ。',
      roles: ['相手を見る側（画面左）', '前を見る側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、肩の高さをBとそろえる。内側のこめかみをBへ寄せる。内側の腕は下ろし、外側の手で自分の内側の前腕を低く持つ。', '画面の右に立ち、内側のこめかみをAへ寄せる。内側の腕は下ろし、外側の手で自分の内側の前腕を低く持つ。'],
      contacts: [['both', '内側のこめかみどうし → 軽く触れている（接点はここだけ）', 'only their inner temples touch lightly'], ['a', 'Aの外側の手 → 自分の内側の前腕（低く）', "Person A's outer hand holds their own inner forearm low"], ['b', 'Bの外側の手 → 自分の内側の前腕（低く）', "Person B's outer hand holds their own inner forearm low"]],
      roleEn: ['the one on the left turning the eyes to the other', 'the one on the right facing forward'],
      ts: [SIDE_EN + ' stand side by side, their inner temples gently touching while the shoulders stay level.', 'Person A keeps the inner arm low and holds it with the outer hand.', 'Person B keeps the inner arm low and holds it with the outer hand.'],
      sdxl: [['heads together', 'side-by-side', 'holding own arm'], ['facing viewer']],
      nai: { core: ['heads together', 'side-by-side'], a: ['holding own arm'], b: ['holding own arm'], nl: 'two people stand side by side with their temples touching, one looking at the other' },
      minNote: '二人の顔とこめかみの接点が入ること（胸上以上）', camera: ANGLE_UB, gazes: G_B_FWD,
      keywords: ['こめかみ', '見つめる', '片思い', '寄り添う', '横並び', '視線']
    }),
    pose({
      id: 'pair_purikura_p013', sourceId: 'PK-P013', category: 'pk_touch', family: 'approach_touch', priority: 'P2', difficulty: '中',
      label: '二の腕に頬を寄せて、両手で腕を持つ', short: 'BがAの横で半歩前に出て、Aの曲げた前腕を両手で持ち、Aの二の腕に頬を寄せる。AはBを見て、Bは前を見る。',
      roles: ['曲げた腕を貸す側（画面左・奥）', '前腕を両手で持って頬を寄せる側（画面右・手前）'], rel: ['level', 'b_front', 'same_direction'],
      place: ['画面の左に立つ。内側のひじを柔らかく曲げ、前腕を自分の胴の前に通す。外側の腕は体の横。', 'Aの横で半歩前・画面の右に立つ。両手でAの前腕を持ち（片手はひじ寄り、もう片手は手首寄り。指は絡めない）、頬をAの二の腕に軽く寄せる。胸と腰はAに触れさせない。'],
      contacts: [['b', 'Bの頬 → Aの二の腕', "Person B's cheek rests lightly on Person A's upper arm"], ['b', 'Bの両手 → Aの前腕（ひじ寄りと手首寄り）', "Person B holds Person A's forearm with both hands, one near the elbow and one near the wrist"], ['a', 'Aの内側の前腕 → 自分の胴の前（曲げる）', "Person A's inner forearm bends across Person A's own torso"]],
      roleEn: ['the one lending a bent arm', 'the one holding the arm and leaning the cheek on it'],
      ts: ['Person A is on the left side of the image and Person B is on the right, Person B a half-step forward beside Person A.', "Person A bends the inner arm softly so the forearm crosses their own torso, the outer arm at the side.", "Person B holds Person A's forearm with both hands and rests one cheek lightly on Person A's upper arm."],
      sdxl: [['arm hug', 'standing'], ['leaning on person']],
      nai: { core: ['standing'], actions: [['arm hug', 'b']], a: ['arm at side'], b: ['leaning on person'], nl: "one person holds the other's bent forearm with both hands and leans a cheek on that person's upper arm" },
      minNote: '二人の顔、Aの二の腕、Bの両手が入ること（胸上以上）', camera: ANGLE_UB, gazes: G_B_FWD,
      fallback: { noteJa: '前腕や頬が重なって崩れる場合は、Bの手を一つにする、または頬を寄せずに両手で腕を持つだけにして接点を減らすと崩れにくくなります。' },
      keywords: ['腕を抱える', '腕組み', '二の腕', '頬を寄せる', '甘える', '前後'],
      suggest: { a: ex('gentle_smile'), b: ex('playful_smile', null, 'affectionate') }
    }),
    pose({
      id: 'pair_purikura_p014', sourceId: 'PK-P014', category: 'pk_touch', family: 'approach_touch', priority: 'P2', difficulty: '中',
      label: '肩越しに顔を出して、手首でつながる', short: '前のBが後ろへ片手を伸ばしてAの手首に触れ、AはBの肩の外側から顔を出す。胴どうしは触れない。',
      roles: ['肩の外側から顔を出す側（画面左・奥）', '手首でつながる側（手前）'], rel: ['level', 'b_front', 'same_direction'],
      place: ['Bの肩の外側後方・画面の左に半歩ずれて立ち、顔をBの肩の横に出す（Bの真後ろに置かない）。両手を自分の胴の前で軽く重ねる。', '半歩前に立ち、内側の手（Aに近い手）だけを後ろへ伸ばして、Aの近い手首に軽く置く。外側の手は低く。'],
      contacts: [['b', 'Bの内側の手 → Aの近い手首', "Person B's inner hand reaches back and rests on Person A's near wrist"], ['a', 'Aの両手 → 自分の胴の前で重ねる', "Person A's hands are lightly clasped in front of Person A's own torso"], ['both', '胴 → 触れていない（Bの肩でAの目鼻口を隠さない）', "their bodies stay apart, Person A's face visible beside Person B's shoulder"]],
      roleEn: ['the one peeking out from behind the shoulder', 'the one in front reaching back to the wrist'],
      ts: ['Person B stands half a step forward, and Person A stands behind and outside Person B\'s shoulder on the left side of the image, the face visible beside that shoulder.', "Person A keeps both hands lightly clasped in front of their own torso.", "Person B reaches back with the inner hand to rest on Person A's near wrist."],
      sdxl: [['standing', "holding another's wrist"], ['own hands together']],
      nai: { core: ['standing'], a: ['own hands together'], b: ["holding another's wrist"], nl: "one person peeks out beside the other's shoulder from behind while the person in front reaches back to touch their wrist" },
      minNote: '二人の顔と手首の接点が入ること（胸上以上）', camera: ANGLE_UB,
      keywords: ['肩越し', '顔を出す', 'ひょっこり', '手首', '前後', 'つながる']
    }),
    pose({
      id: 'pair_purikura_p015', sourceId: 'PK-P015', category: 'pk_touch', family: 'approach_touch', priority: 'P1', difficulty: '中',
      label: '頬を寄せて、内側の腕をそっと支え合う', short: '近い頬を寄せ、Aの内側の手はBの二の腕、Bの内側の手はAの前腕に置く。Aは前を見て、BはAを見る。',
      roles: ['前を見てBの二の腕に手を置く側（画面左）', 'Aを見てAの前腕に手を置く側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、近い頬をBへ寄せる。内側の手を、Bの内側の二の腕に軽く置く。外側の手は体の横。', '画面の右に立ち、近い頬をAへ寄せる。内側の手を、Aの内側の前腕（Aの手よりひじ側）に軽く置く。外側の手は体の横。'],
      contacts: [['both', '近い頬どうし・内側の肩 → 軽く触れている', 'their nearer cheeks and inner shoulders touch lightly'], ['a', 'Aの内側の手 → Bの内側の二の腕', "Person A's inner hand rests on Person B's inner upper arm"], ['b', 'Bの内側の手 → Aの内側の前腕', "Person B's inner hand rests on Person A's inner forearm"]],
      roleEn: ['the one facing forward with a hand on the other\'s upper arm', 'the one looking at the other with a hand on their forearm'],
      ts: [SIDE_EN + ' stand side by side with their nearer cheeks gently touching.', "Person A rests the inner hand on Person B's inner upper arm, the outer hand low.", "Person B rests the inner hand on Person A's inner forearm, the outer hand low."],
      sdxl: [['cheek-to-cheek', 'side-by-side', "hand on another's arm"], ['facing viewer']],
      nai: { core: ['cheek-to-cheek', 'side-by-side'], a: ["hand on another's arm"], b: ["hand on another's arm"], nl: "two people with their cheeks touching, each resting the inner hand on the other's arm" },
      minNote: '二人の顔、頬の接点、内側の二つの手が入ること（胸上以上）', camera: ANGLE_UB, gazes: G_A_FWD,
      keywords: ['頬寄せ', 'ほっぺ', '支える', '腕', '寄り添う', 'カップル'],
      suggest: { a: ex('gentle_smile'), b: ex('shy') }
    }),

    // ================= 共同形状・顔フレーム =================
    pose({
      id: 'pair_purikura_p016', sourceId: 'PK-P016', category: 'pk_shape', family: 'face_gesture', priority: 'P1', difficulty: '高',
      label: '四つの手で二人を囲む大きなハート', short: '外側の腕をそれぞれ自分の頭の上へ弧にして、外側の指先を頭上の中央で合わせる。内側の指先はあごの下の中央で合わせ、二人の顔を一つの大きなハートで囲む。',
      roles: ['外側の腕で左上の弧・内側の手で左下を作る側（画面左）', '外側の腕で右上の弧・内側の手で右下を作る側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、肩をBに軽く触れさせる。外側の腕を自分の頭の上へ弧にして上げ、指先を二人の頭の間の真上でBの外側の指先と合わせる（ハートの左上の丸み）。内側の手は下ろして、指先をあごの下の中央でBの内側の指先と合わせる（ハートの左下）。', '画面の右に立ち、外側の腕を自分の頭の上へ弧にして上げ、指先を頭上の中央でAの外側の指先と合わせる（右上の丸み）。内側の手は下ろして、指先をあごの下の中央でAの内側の指先と合わせる（右下）。'],
      contacts: [['both', '外側の手の指先どうし → 二人の頭の間の真上で合わせる（ハートの上の切れ込み）', "their outer fingertips meet above the gap between their heads"], ['both', '内側の手の指先どうし → あごの下の中央で合わせる（ハートの下の先端）', 'their inner fingertips meet at the center below their chins'], ['both', '内側の肩 → 軽く触れている', 'their inner shoulders touch lightly']],
      roleEn: ['the one on the left forming the upper-left curve and lower-left side', 'the one on the right forming the upper-right curve and lower-right side'],
      ts: [SIDE_EN + ' stand close side by side, both faces visible inside one large heart traced by their four arms.', "Person A curves the outer arm over their own head so the fingertips meet Person B's above the gap between their heads, and lowers the inner hand so the fingertips meet Person B's below their chins.", "Person B curves the outer arm over their own head to meet Person A's fingertips above, and lowers the inner hand to meet Person A's fingertips below their chins."],
      sdxl: [['heart hands duo', 'side-by-side', 'arms up'], ['shoulder-to-shoulder']],
      nai: { core: ['heart hands duo', 'side-by-side'], a: ['arm up'], b: ['arm up'], nl: 'two people make one large heart around both faces, outer arms curving over their heads to meet above and inner hands meeting below their chins' },
      minNote: '上と下の二つの接点と二人の顔が入ること（胸上以上）', camera: FRONT_UB,
      fallback: { to: 'pair_purikura_p007', noteJa: '四本の腕が交差して崩れる場合は、内側の手だけで中央に一つのハートを作る形が崩れにくい。' },
      keywords: ['大きなハート', 'ハート', '四つの手', '囲む', '腕でハート', '共同']
    }),
    pose({
      id: 'pair_purikura_p017', sourceId: 'PK-P017', category: 'pk_shape', family: 'face_gesture', priority: 'P2', difficulty: '高',
      label: '指先だけで閉じる小さな二人のハート', short: '二人の内側の手だけで、あごの間に小さなハートを閉じる。親指どうしを下、人差し指どうしを上で合わせる（指ハートより一回り大きく、二点で閉じる）。',
      roles: ['内側の手で左半分（画面左）', '内側の手で右半分（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、肩をBに近づける（顔どうしは少し離す）。内側の手の親指と人差し指で、ハートの左半分を作る。外側の手は低く。', '画面の右に立ち、内側の手の親指と人差し指で、ハートの右半分を作る。親指の先はAの親指の先と下で、人差し指の先はAの人差し指の先と上で合わせる。外側の手は低く。'],
      contacts: [['both', '親指の先どうし → 下で合わせる（ハートの先端）', 'their thumbs touch at the lower point'], ['both', '人差し指の先どうし → 上で合わせる（ハートの切れ込み）', 'their index fingertips touch at the upper notch'], ['both', '顔どうし → 少し離す', 'a little space stays between their faces']],
      roleEn: ['the one forming the left half with thumb and index finger', 'the one forming the right half with thumb and index finger'],
      ts: [SIDE_EN + ' stand close side by side, both faces visible, their inner hands forming one small heart between their chins.', 'Person A shapes the left half with the thumb and index finger of the inner hand, the outer hand low.', 'Person B shapes the right half with the thumb and index finger of the inner hand, the outer hand low.'],
      sdxl: [['heart hands duo', 'finger heart', 'side-by-side'], ['facing viewer']],
      nai: { core: ['heart hands duo', 'side-by-side'], a: ['finger heart'], b: ['finger heart'], nl: 'two people form one small heart between their chins, thumbs touching below and index fingertips touching above' },
      minNote: '小さなハートの二つの接点と二人の顔が入ること（肩上でよい）', camera: cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'close', ['close', 'upper_body', 'knee_up', 'full_body']),
      fallback: { to: 'pair_purikura_p005', noteJa: '小さな二つの接点が崩れる場合は、それぞれが外側の手で指ハートを作る形が崩れにくい。' },
      keywords: ['小さいハート', 'ハート', '指先', '二人でハート', '共同', '指ハート']
    }),
    pose({
      id: 'pair_purikura_p018', sourceId: 'PK-P018', category: 'pk_shape', family: 'face_gesture', priority: 'P1', difficulty: '中',
      label: '四つの手で横長の楕円フレーム', short: '四つの開いた手を二人の顔の外まわりに置き、横長の楕円を作る。Aは左上と左下、Bは右上と右下。手どうし・手と顔は触れない。',
      roles: ['左上と左下の外周を作る側（画面左）', '右上と右下の外周を作る側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立ち、顔の高さをBとそろえる。片手を自分の頭の左上の外側、もう片手を自分のあごの左下の外側に、指先を楕円の線に沿わせて開く（手を顔の前へ入れない）。', '画面の右に立ち、片手を自分の頭の右上の外側、もう片手を自分のあごの右下の外側に、指先を楕円の線に沿わせて開く。'],
      contacts: [['a', 'Aの両手 → 楕円の左上と左下（顔の外側）', "Person A's two open hands mark the upper-left and lower-left of the oval outside the faces"], ['b', 'Bの両手 → 楕円の右上と右下（顔の外側）', "Person B's two open hands mark the upper-right and lower-right of the oval"], ['both', '手どうし・手と顔 → 触れない（肩は軽く触れてよい）', 'their hands stay apart from each other and from the faces']],
      roleEn: ['the one marking the left side of the oval', 'the one marking the right side of the oval'],
      ts: [SIDE_EN + ' stand close side by side, both faces visible inside one wide oval traced by their four open hands.', 'Person A places one open hand above and outside the upper left of the faces and the other below and outside the lower left.', 'Person B places one open hand above and outside the upper right of the faces and the other below and outside the lower right.'],
      sdxl: [['side-by-side', 'hands up'], ['facing viewer']],
      nai: { core: ['side-by-side'], a: ['hands up'], b: ['hands up'], nl: 'two people frame both faces with one wide oval made by four open hands placed around the outside' },
      minNote: '上側と下側の手首すべてと二人の顔が入ること（肩上でよい）', camera: FRONT_CLOSE,
      fallback: { noteJa: '手の持ち主が混ざる・形が崩れる場合は、上側の二つの手だけで顔の外側をなぞり、下側の手は胸元へ下ろすと崩れにくくなります。' },
      keywords: ['フレーム', '楕円', '顔を囲む', '四つの手', '共同', '額縁']
    }),
    pose({
      id: 'pair_purikura_p019', sourceId: 'PK-P019', category: 'pk_shape', family: 'face_gesture', priority: 'P2', difficulty: '高',
      label: '四隅をL字で分け合う横長の四角いフレーム', short: '二人が両手のL字で横長の四角の四隅を分担する。Aは左上と左下、Bは右上と右下。人差し指は上下の辺に沿って中央へ、親指は横の辺に沿う。',
      roles: ['左上と左下の角を作る側（画面左）', '右上と右下の角を作る側（画面右）'], rel: ['level', 'none', 'side_by_side'],
      place: ['画面の左に立つ。左上の角：人差し指を上の辺に沿って中央へ、親指を下へ向ける。左下の角：人差し指を下の辺に沿って中央へ、親指を上へ向ける。', '画面の右に立つ。右上の角：人差し指を上の辺に沿って中央へ、親指を下へ向ける。右下の角：人差し指を下の辺に沿って中央へ、親指を上へ向ける。'],
      contacts: [['a', 'Aの両手 → 四角の左上と左下の角（L字）', "Person A's two L-shaped hands form the upper-left and lower-left corners"], ['b', 'Bの両手 → 四角の右上と右下の角（L字）', "Person B's two L-shaped hands form the upper-right and lower-right corners"], ['both', '人物・手どうし → 触れない', 'their bodies and hands stay apart']],
      roleEn: ['the one making the two left corners', 'the one making the two right corners'],
      ts: [SIDE_EN + ' stand side by side, both faces visible inside one wide rectangular frame made by four L-shaped hands.', 'Person A makes the upper-left and lower-left corners, each index finger running along the top or bottom edge toward the center and each thumb along the outer edge.', 'Person B makes the upper-right and lower-right corners in the same way.'],
      sdxl: [['finger frame', 'side-by-side'], ['hands up']],
      nai: { core: ['finger frame', 'side-by-side'], a: ['hands up'], b: ['hands up'], nl: 'two people make one wide rectangular frame around both faces, each forming two corners with L-shaped hands' },
      minNote: '四つのL字の指すべてが入ること（肩上でよい）', camera: FRONT_CLOSE,
      fallback: { noteJa: 'L字がVや指差しに変わって崩れる場合は、上の二つの角だけを作り、下側の手は胸元へ下ろすと崩れにくくなります（完成形の難度は推定）。' },
      keywords: ['フレーム', '四角', 'L字', '四隅', '共同', '額縁']
    }),
    pose({
      id: 'pair_purikura_p020', sourceId: 'PK-P020', category: 'pk_shape', family: 'face_gesture', priority: 'P2', difficulty: '高',
      label: '上の人と下の人で作る縦のハート窓', short: '上の段のAが両手でハートの上の二つの丸み、下の段のBが両手で下の先端を作る。Aは後ろで少し左、Bは前で浅く低く。顔は縦に重ねない。',
      roles: ['上の二つの丸みと高い顔（後ろ・画面のやや左）', '下の先端と低い顔（前）'], rel: ['a_taller', 'b_front', 'same_direction'],
      place: ['Bの後ろで少し左にずれて立つ（Bの真後ろに置かない）。両腕を上げ、ハートの上の二つの丸みを作る（腕をBの頭に重ねない）。', 'Aの前で膝を軽く曲げて浅く低くなる。両手を体の前の下で合わせ、ハートの下の先端を作る。'],
      contacts: [['a', 'Aの両手 → ハートの上の二つの丸み', "Person A's raised hands form the two upper curves of one vertical heart"], ['b', 'Bの両手 → ハートの下の先端', "Person B's hands come together below to form the lower point"], ['both', '体・手どうし → 触れない（輪郭だけで一つのハート）', 'their bodies and hands stay apart, only the outline reading as one heart']],
      roleEn: ['the one higher behind forming the upper curves', 'the one lower in front forming the lower point'],
      ts: ['Person A stands behind and slightly to the left of the image in the upper position, and Person B is lower in the foreground, both faces visible and offset.', 'Person A raises both arms to form the two upper curves of one vertical heart.', 'Person B bends the knees a little and brings both hands together below to form the lower point.'],
      sdxl: [['heart hands duo', 'arms up'], ['own hands together']],
      nai: { core: ['heart hands duo'], a: ['standing', 'arms up'], b: ['own hands together'], nl: 'two people at different heights form one vertical heart, the higher one making the upper curves and the lower one making the point' },
      minNote: 'ハートの上端・下端と二人の顔が入ること（胸上以上。高低差が読める画角）', camera: cam(['high', 'eye_level', 'three_quarter'], ['high', 'eye_level'], 'high', 'upper_body', ['upper_body', 'knee_up', 'full_body'], LAYER_NO_CLOSE),
      fallback: { noteJa: '形が崩れる場合は、Aの上側の手だけで頭上に弧を作り、Bは胸元で両手を合わせる程度にすると崩れにくくなります。' },
      keywords: ['ハート', '縦', '上下', '高低差', '共同', '窓']
    }),
    pose({
      id: 'pair_purikura_p021', sourceId: 'PK-P021', category: 'pk_shape', family: 'face_gesture', priority: 'P3', difficulty: '高',
      label: '上下二段で閉じる縦長の四角いフレーム', short: '高いAが上の二隅、低いBが下の二隅をL字で受け持つ。Aは後ろで少し右、Bは前の低い段。顔を縦にずらして見せる。',
      roles: ['上の二隅と上段の顔（後ろ・画面のやや右）', '下の二隅と下段の顔（前）'], rel: ['a_taller', 'b_front', 'same_direction'],
      place: ['Bの後ろで少し右にずれて立つ。上の二つの角をL字で作る（人差し指を上の辺に沿って中央へ、親指を下へ）。', 'Aの前で膝を曲げて低くなる。下の二つの角をL字で作る（人差し指を下の辺に沿って中央へ、親指を上へ）。'],
      contacts: [['a', 'Aの両手 → 四角の上の二隅（L字）', "Person A's two L-shaped hands form the upper corners"], ['b', 'Bの両手 → 四角の下の二隅（L字）', "Person B's two L-shaped hands form the lower corners"], ['both', '手どうし・人物どうし → 触れない', 'their bodies and hands stay apart']],
      roleEn: ['the one higher behind forming the upper corners', 'the one lower in front forming the lower corners'],
      ts: ['Person A stands behind and slightly to the right of the image in the upper position, and Person B is lower in the foreground, both faces visible and offset vertically.', 'Person A makes the upper-left and upper-right corners of one tall rectangular frame with L-shaped hands.', 'Person B makes the lower-left and lower-right corners with L-shaped hands.'],
      sdxl: [['finger frame', 'hands up'], ['standing']],
      nai: { core: ['finger frame'], a: ['standing', 'hands up'], b: ['hands up'], nl: 'two people at different heights make one tall rectangular frame around both faces, the higher one making the top corners and the lower one the bottom corners' },
      minNote: '四つのL字と二人の顔が入ること（胸上以上。高低差が読める画角）', camera: cam(['high', 'eye_level', 'three_quarter'], ['high', 'eye_level'], 'high', 'upper_body', ['upper_body', 'knee_up', 'full_body'], LAYER_NO_CLOSE),
      fallback: { noteJa: '要素が多く崩れやすい（P3）。上の二隅（A）だけで顔の外側にフレームを作り、Bは手を下ろすと崩れにくくなります。' },
      keywords: ['フレーム', '四角', 'L字', '上下', '高低差', '共同']
    }),

    // ================= 前後・高低差・非対称 =================
    pose({
      id: 'pair_purikura_p022', sourceId: 'PK-P022', category: 'pk_layer', family: 'standing_leaning', priority: 'P1', difficulty: '中',
      label: '前の人が後ろの人を指さして紹介する', short: '半歩前・画面右のAが、後ろ・画面左のBを斜め後ろへ人差し指で指す。Bは肩の横のすき間から顔を全部出す。触れない。',
      roles: ['手前で紹介する側（画面右・前）', '奥で紹介される側（画面左・後ろ）'], rel: ['level', 'a_front', 'same_direction'],
      place: ['半歩前・画面の右に立ち、胴を少し内側へ向ける。内側の腕を曲げ、人差し指でBを斜め後ろへ指す。外側の手は自分の腰。', '半歩後ろ・画面の左に立ち、Aの近い肩（Bに近い側の肩）の外側から顔を全部出す（Aの肩から半顔分ずらす）。片手を自分の胸元で開く。'],
      contacts: [['a', 'Aの人差し指 → 斜め後ろのBを指す', "Person A points diagonally back toward Person B with one index finger"], ['a', 'Aの外側の手 → 自分の腰', "Person A's outer hand rests on their own hip"], ['b', 'Bの片手 → 自分の胸元（開く）', "Person B holds one open palm near their own chest"]],
      roleEn: ['the one in front introducing the other', 'the one behind being introduced'],
      ts: ['Person A stands half a step forward on the right side of the image, and Person B stands behind on the left with the full face visible beside Person A\'s nearer shoulder.', 'Person A angles the torso slightly inward and points diagonally back toward Person B, the other hand on their own hip.', 'Person B holds one open palm near their own chest.'],
      sdxl: [['pointing at another', 'standing'], ['hand on own hip', 'hand on own chest']],
      nai: { core: ['standing'], actions: [['pointing at another', 'a']], a: ['hand on own hip'], b: ['hand on own chest'], nl: 'one person in front points back toward the other, who shows the full face beside the front person\'s shoulder' },
      minNote: 'Aの指先からBの胸元までが入ること（胸上以上）', camera: ANGLE_UB,
      keywords: ['紹介', '指さす', '指差し', '前後', 'こちら', 'レイヤー']
    }),
    pose({
      id: 'pair_purikura_p023', sourceId: 'PK-P023', category: 'pk_layer', family: 'sitting_kneeling', priority: 'P1', difficulty: '中',
      label: '前でしゃがむ人と、後ろから顔を出す人', short: '手前・画面右のAが浅くしゃがんで両ひじを膝に置き、後ろ・画面左のBが立ってAの斜め上から顔を出す。膝が写る画角（膝上以上）で使う。',
      roles: ['手前で低くしゃがむ土台役（画面右・前）', '後ろで立って上から顔を出す側（画面左・後ろ）'], rel: ['b_taller', 'a_front', 'same_direction'],
      place: ['手前・画面の右で浅くしゃがみ、両ひじを自分の立てた膝に置いて、手を軽く合わせる（低くしすぎない）。', '後ろ・画面の左に立ち、Aの斜め上から顔を出す（Aの真後ろに置かない）。片手を自分の胸元で開く。'],
      contacts: [['a', 'Aの両ひじ → 自分の立てた膝', "Person A's elbows rest on their own raised knees"], ['a', 'Aの両手 → 軽く合わせる', "Person A's hands are lightly together"], ['b', 'Bの片手 → 自分の胸元（開く）', "Person B holds one open palm near their own chest"]],
      roleEn: ['the one crouching low in front', 'the one standing behind and peeking from above'],
      ts: ['Person A crouches in the foreground on the right side of the image, and Person B stands behind on the left with the face visible diagonally above Person A.', "Person A rests both elbows on their own raised knees with the hands lightly together.", 'Person B holds one open palm near their own chest.'],
      sdxl: [['squatting', 'standing'], ['own hands together', 'hand on own chest']],
      nai: { core: ['facing viewer'], a: ['squatting', 'own hands together'], b: ['standing', 'hand on own chest'], nl: 'one person crouches in front with elbows on the knees while the other stands behind and peeks out from above' },
      minNote: 'Aのひじと膝の支え・Bの顔が両方入ること（膝上以上。指示書の修正：原資料の「腰上」では膝が切れる）',
      camera: cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'knee_up', ['knee_up', 'full_body'], { upper_body: 'Aの膝とひじの支えが画角外になり、しゃがむ姿勢が読めません（膝上以上）。', close: 'しゃがむ姿勢と高低差が画角外になります（膝上以上）。' }),
      keywords: ['しゃがむ', '前後', '高低差', '顔を出す', 'ひょっこり', 'レイヤー']
    }),
    pose({
      id: 'pair_purikura_p024', sourceId: 'PK-P024', category: 'pk_layer', family: 'sitting_kneeling', priority: 'P1', difficulty: '低',
      label: '前に座る人の肩に、斜め後ろから片手', short: '前の低い座面に浅く座るAの、斜め後ろ・画面右にBが立ち、Bの内側の手だけをAの肩（Bに近い側）に置く。',
      roles: ['前で座る側（前）', '斜め後ろから肩に片手を置く側（画面右・後ろ）'], rel: ['b_taller', 'a_front', 'same_direction'],
      place: ['前の低い座面に浅く座り、正面を向く。両手は自分の膝の上。', 'Aの斜め後ろ・画面の右に半身ずれて立つ（Aの真後ろに置かない）。内側の手（Aに近い手）だけを、Aの肩（Bに近い側）に軽く置く（首や顔へは近づけない）。外側の手は体の横。'],
      contacts: [['b', 'Bの内側の手 → Aの肩（Bに近い側）', "Person B's inner hand rests lightly on Person A's shoulder on Person B's side"], ['a', 'Aの両手 → 自分の膝の上', "Person A's hands rest on their own lap"], ['a', 'Aの腰 → 低い座面', 'Person A sits on a low seat']],
      roleEn: ['the one seated in front', 'the one standing diagonally behind with a hand on the shoulder'],
      ts: ['Person A sits in the foreground on a low seat facing forward, and Person B stands behind and diagonally to the right of the image, the face visible beside and slightly above Person A.', 'Person A keeps both hands on their own lap.', "Person B rests only the inner hand lightly on Person A's shoulder on that side."],
      sdxl: [['sitting', 'standing', "hand on another's shoulder"], ['hands on lap']],
      nai: { core: ['facing viewer'], a: ['sitting', 'hands on lap'], b: ['standing', "hand on another's shoulder"], nl: "one person sits in front while the other stands diagonally behind with one hand on the seated person's shoulder" },
      minNote: '二人の顔と、Bの肩への片手が入ること（胸上以上。座る・立つの差が読める画角）',
      camera: cam(['three_quarter', 'eye_level', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'upper_body', ['upper_body', 'knee_up', 'full_body'], LAYER_NO_CLOSE),
      keywords: ['座る', '肩に手', '前後', '高低差', '後ろに立つ', 'レイヤー']
    }),
    pose({
      id: 'pair_purikura_p025', sourceId: 'PK-P025', category: 'pk_layer', family: 'sitting_kneeling', priority: 'P2', difficulty: '中',
      label: '高く座る人が、横で片膝をつく人を紹介する', short: '画面左で高めの座面に座るAが、画面右で片膝をつくBを、頭の上の横に開いた手で紹介する（触れない）。Bは両手を立てた膝に置く。',
      roles: ['高い位置から紹介する側（画面左）', '低い位置で紹介される側（画面右）'], rel: ['a_taller', 'none', 'side_by_side'],
      place: ['画面の左で高めの座面に座り、胴を少しBへ向ける。Bに近い手を開き、Bの頭より上の横に差し出して紹介する（Bの頭に重ねない）。', 'Aの横・画面の右で片膝をつき、顔を低くして胴を前へ向ける。両手を自分の立てた膝に置く。'],
      contacts: [['a', 'Aの開いた手 → Bの頭の上の横（触れない）', "Person A holds one open palm above and beside Person B's head, a hand's width away"], ['b', 'Bの両手 → 自分の立てた膝', "Person B rests both hands on their own raised knee"], ['a', 'Aの腰 → 高めの座面', 'Person A sits on a raised seat']],
      roleEn: ['the one seated higher and presenting', 'the one kneeling lower and being presented'],
      ts: ['Person A sits higher on the left side of the image with the torso turned slightly toward Person B, and Person B kneels on one knee at Person A\'s side on the right with the face lower.', "Person A presents Person B with one open palm held above and beside Person B's head, a hand's width away.", 'Person B rests both hands on their own raised knee.'],
      sdxl: [['sitting', 'on one knee'], ['outstretched hand', 'hand on own knee']],
      nai: { core: ['facing viewer'], a: ['sitting', 'outstretched hand'], b: ['on one knee', 'hand on own knee'], nl: 'one person sits higher and presents the other, who kneels on one knee beside them' },
      minNote: 'Aの開いた手とBの両手が入ること（腰上以上。高低差が読める画角）',
      camera: cam(['eye_level', 'three_quarter', 'low', 'high'], ['eye_level', 'low'], 'eye_level', 'knee_up', ['knee_up', 'upper_body', 'full_body'], LAYER_NO_CLOSE, { low: '' }),
      keywords: ['紹介', '片膝', '座る', '高低差', 'じゃーん', 'レイヤー']
    }),
    pose({
      id: 'pair_purikura_p026', sourceId: 'PK-P026', category: 'pk_layer', family: 'rear_turn', priority: 'P2', difficulty: '中',
      label: '肩越しに振り返る人と、反対側から顔を出す人', short: '手前・画面左のAが胴を斜め後ろへ向けて肩越しに顔を戻し、奥・画面右のBがAの肩の線の外から正面を向く。触れない。',
      roles: ['手前で肩越しに振り返る側（画面左・前）', '奥の反対側から顔を出す側（画面右・後ろ）'], rel: ['level', 'a_front', 'same_direction'],
      place: ['手前・画面の左に立ち、胴を斜め後ろへ四分の三ほど向け、外側の肩越しに顔をこちらへ戻す（振り返りすぎない）。両手は低く。', '奥・画面の右に立ち、Aの肩の線の外側から顔を全部出して正面を向く。片手を自分の胸元に添える。'],
      contacts: [['b', 'Bの片手 → 自分の胸元', "Person B rests one hand near their own chest"], ['a', 'Aの両手 → 低く下ろす', "Person A's hands stay low"], ['both', '人物どうし → 触れない（Bは必ずAの肩の線の外）', "their bodies stay apart, Person B outside Person A's shoulder line"]],
      roleEn: ['the one in front looking back over the shoulder', 'the one behind facing forward'],
      ts: ['Person A stands in the foreground on the left side of the image with the torso turned three-quarters away, and Person B stands behind on the right with the full face visible outside Person A\'s shoulder line.', "Person A turns the face back over the outer shoulder, the hands low.", 'Person B faces forward with one hand near their own chest.'],
      sdxl: [['looking back', 'standing'], ['hand on own chest']],
      nai: { core: ['standing'], a: ['looking back'], b: ['hand on own chest'], nl: 'one person in front looks back over the shoulder while the other faces forward from behind on the opposite side' },
      minNote: '二人の顔と、Aの肩越しの向きが読めること（胸上以上）', camera: ANGLE_UB,
      keywords: ['振り返り', '肩越し', '前後', '向きをずらす', 'クール', 'レイヤー']
    }),
    pose({
      id: 'pair_purikura_p027', sourceId: 'PK-P027', category: 'pk_layer', family: 'face_gesture', priority: 'P2', difficulty: '中',
      label: 'ガオーする人と、静かな相棒', short: '少し手前・画面左のAだけが両手をゆるい爪の形にして頬の外へ上げ、半歩奥・画面右のBは片手を腰に置いて静かに対比させる。',
      roles: ['ガオーの動きを強く出す側（画面左・前）', '静かに対比を作る側（画面右・後ろ）'], rel: ['level', 'a_front', 'same_direction'],
      place: ['少し手前・画面の左に立ち、両手を自分の頬の外かつ少し前に上げて、指をゆるく曲げた爪の形にする（手を中央へ寄せない）。', '半歩奥・画面の右に立ち、片手を自分の腰に、反対の腕は低く下ろす。顔のまわりに空間を残す。'],
      contacts: [['a', 'Aの両手 → 頬の外で爪の形', "Person A's raised hands curl into loose claw shapes outside their own cheeks"], ['b', 'Bの片手 → 自分の腰', "Person B rests one hand on their own hip"], ['both', '人物どうし → 触れない', 'their bodies stay apart']],
      roleEn: ['the one making the claw gesture', 'the calm partner behind'],
      ts: ['Person A stands slightly forward on the left side of the image, and Person B stands half a step behind on the right, both faces fully visible.', 'Person A raises both hands outside their own cheeks with the fingers loosely curved into claw shapes.', 'Person B rests one hand on their own hip with the other arm low.'],
      sdxl: [['claw pose', 'standing'], ['hand on own hip']],
      nai: { core: ['standing'], a: ['claw pose'], b: ['hand on own hip', 'arm at side'], nl: 'one person in front makes a playful claw gesture while the partner behind stands calmly with a hand on the hip' },
      minNote: 'Aの両手の指先までが入ること（胸上以上）', camera: cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'upper_body', ['upper_body', 'knee_up', 'full_body'], NO_CLOSE),
      keywords: ['ガオー', 'がおー', '爪', '怪獣', '対比', 'レイヤー'],
      suggest: { a: ex('playful_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_purikura_p028', sourceId: 'PK-P028', category: 'pk_layer', family: 'face_gesture', priority: 'P2', difficulty: '中',
      label: '高さの違う二人の、おそろいの猫耳', short: '少し低い画面左のAと、少し高い画面右のBが、外側の手だけで頭の外上にV字の耳を作る。内側の手は自分の肩の近く。触れない。',
      roles: ['少し低い耳形役（画面左）', '少し高い耳形役（画面右）'], rel: ['b_taller', 'none', 'side_by_side'],
      place: ['画面の左で膝を少し曲げて低くなる。外側の手だけを頭の外上に上げ、ゆるいV字の耳にする。内側の手は自分の肩の近く。', '画面の右でまっすぐ立つ。外側の手だけを頭の外上に上げ、ゆるいV字の耳にする。内側の手は自分の肩の近く。肩の間は空ける。'],
      contacts: [['a', 'Aの外側の手 → 頭の外上でV字の耳', "Person A raises only the outer hand above their own head in a loose V-shaped ear"], ['b', 'Bの外側の手 → 頭の外上でV字の耳', "Person B raises only the outer hand above their own head in a loose V-shaped ear"], ['both', '肩の間 → 空ける（触れない）', 'a space stays between their shoulders']],
      roleEn: ['the slightly lower one on the left', 'the slightly higher one on the right'],
      ts: [SIDE_EN + ' stand at slightly different heights, Person A with the knees slightly bent.', 'Person A raises only the outer hand above their own head in a loose V-shaped ear, the inner hand near their own shoulder.', 'Person B raises only the outer hand above their own head in a loose V-shaped ear, the inner hand near their own shoulder.'],
      sdxl: [['v', 'arm up', 'side-by-side'], ['facing viewer']],
      nai: { core: ['side-by-side'], a: ['v', 'arm up'], b: ['v', 'arm up'], nl: 'two people at slightly different heights each raise only the outer hand above the head in a V-shaped ear' },
      minNote: '頭上の外側の手の指が切れないこと（胸上以上）', camera: FRONT_UB,
      keywords: ['猫耳', 'ねこみみ', '耳', 'V', '高低差', 'おそろい']
    }),
    pose({
      id: 'pair_purikura_p029', sourceId: 'PK-P029', category: 'pk_layer', family: 'standing_leaning', priority: 'P3', difficulty: '低',
      label: '派手に「ジャーン」する人と、控えめな相棒', short: '半歩手前・画面左のAが肩より低い位置で両手を外へ開き、半歩奥・画面右のBは片手を腰に置く。Bの顔はAの腕の外に出す。',
      roles: ['手前で両手を開く側（画面左・前）', '奥で控えめに対比する側（画面右・後ろ）'], rel: ['level', 'a_front', 'same_direction'],
      place: ['半歩手前・画面の左で正面を向き、ひじを柔らかく曲げて、両手を肩より低い位置で外へ開く（肩より上へ上げない）。', '半歩奥・画面の右に立ち、片手を自分の腰に、反対の腕は低く下ろす。顔をAの腕の線の外に出す（Aの腕の間に入らない）。'],
      contacts: [['a', 'Aの両手 → 肩より低い位置で外へ開く', "Person A holds both open hands low and outward below shoulder level"], ['b', 'Bの片手 → 自分の腰', "Person B rests one hand on their own hip"], ['both', '人物どうし → 触れない', 'their bodies stay apart']],
      roleEn: ['the one in front with both hands spread', 'the low-key partner behind'],
      ts: ['Person A stands half a step forward on the left side of the image, and Person B stands half a step behind on the right, both faces clear outside Person A\'s arm line.', 'Person A faces forward with the elbows softly bent and both open hands held low and outward below shoulder level.', 'Person B rests one hand on their own hip with the other arm low.'],
      sdxl: [['spread arms', 'standing'], ['hand on own hip']],
      nai: { core: ['standing'], a: ['spread arms'], b: ['hand on own hip', 'arm at side'], nl: 'one person in front spreads both hands low in a showy pose while the partner behind stands calmly with a hand on the hip' },
      minNote: 'Aの両手の外側までが入ること（胸上以上）', camera: cam(['eye_level', 'three_quarter', 'high'], ['eye_level'], 'eye_level', 'upper_body', ['upper_body', 'knee_up', 'full_body'], NO_CLOSE),
      keywords: ['ジャーン', 'じゃーん', 'ターダ', '両手を広げる', '対比', 'レイヤー'],
      suggest: { a: ex('playful_smile'), b: ex('slight_smile') }
    })
  ];

  D.purikuraPairPoses = list;
  D.pairPoses = (D.pairPoses || []).concat(list);

  // ---- 採否ログ（29件すべて採用。資料の修正点を記録） ----
  D.purikuraPairCandidateLog = list.map(function (p) { return { id: p.sourceId, status: 'adopted', internalId: p.id, priority: p.priority, difficultyJa: p.difficultyJa }; });
  D.purikuraPairDataFixes = {
    'PK-P016': '指示書の確定修正：外側の腕で上の二つの丸み（外側の指先を頭上の中央で合わせる）、内側の手で下の先端（あごの下の中央で合わせる）。Manus案（内手を頭上・外手をあご下）は外から内へ腕が交差して顔を覆いやすい',
    'PK-P023': '指示書の確定修正：最小画角を「腰上」から「膝上」へ。しゃがむ姿勢（ひじを膝に置く）が膝を切ると消えるため、上半身・顔まわりの画角は選べない',
    'PK-P011': '遠い頬へ届く腕の通り道を「Bの首の後ろを通して外側から包む」と明記し、Bの手はAの前腕（Bの肩の後ろを通る部分）に添える。顔が隠れる場合の簡易版（近い頬の外縁に沿わせる）を案内',
    'PK-P022': '資料の「Bの顔はAの外側の肩の横」は、Bが画面左（Aの内側）にいる配置と食い違うため、「Aの近い肩（Bに近い側）の外側」に修正',
    'PK-P023b': '資料の「Aの外肩上の空間からBが顔を出す」も同じ理由で「Aの斜め上」に修正',
    'PK-P024': '資料の「Aの外側肩へBの内手」は、Aが一人で座っているため外側が定まらない。「Aの肩（Bに近い側）」に修正',
    'left_right': '資料の「Aは左外手」「Aの右内手」などは画面の左右と本人の左右が混ざっている（正面を向いた画面左の人物の外側の手は本人の右手）。英語・日本語とも「外側の手（相手から遠い手）／内側の手（相手に近い手）」と画面上の位置で書き、left hand／right hand は使わない',
    'swap': 'Manusメモの「A⇄B入れ替えで身体配置も鏡写し」は現行仕様と矛盾。A⇄Bは外見・表情・メモの入れ替えのみで、ポーズの位置・役割・接触点は変えない（指示書のとおり）'
  };
})(window);
