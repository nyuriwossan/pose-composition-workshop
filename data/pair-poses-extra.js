(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // 二人用ポーズの追加分（2026-10-28）。構造は data/pair-poses.js と同じ意味データ。
  // 依頼書の44案のうち、既存と同じ構図の5案（背後から抱きしめる・膝の上で抱きつく・背中を預けて膝上に座る・
  // ベッド上で覆いかぶさる・横抱き）は既存ポーズまたはお姫様抱っこへ統合し、検索語として残した。
  // タグはDanbooruのタグ一覧で実在を確認したものだけを使う。脚を腰に回す leg lock や pinned は、
  // 成人向けの文脈で多用されるタグのため使わない。

  var STAND = { angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'], recommended: ['eye_level', 'three_quarter'], defaultAngle: 'eye_level', defaultShot: 'knee_up', blocked: { overhead: '真上からは頭頂部ばかりになり、二人の関係が読めません。' } };
  var FACE = { angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'], recommended: ['side', 'three_quarter'], defaultAngle: 'side', defaultShot: 'upper_body', blocked: { overhead: '真上からは顔どうしの距離が読めません。' } };
  var SEAT = { angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'], recommended: ['three_quarter', 'eye_level'], defaultAngle: 'three_quarter', defaultShot: 'knee_up', blocked: { overhead: '真上からは頭と肩が重なり、座り方が読めません。' } };
  var LIE = { angles: ['three_quarter', 'side', 'high', 'overhead', 'eye_level'], recommended: ['high', 'overhead'], defaultAngle: 'high', defaultShot: 'full_body', blocked: { low: '面より下から見上げる位置になり、二人が重なって隠れます。' } };
  var WALL = { angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'], recommended: ['three_quarter', 'side'], defaultAngle: 'three_quarter', defaultShot: 'knee_up', blocked: { overhead: '真上からは壁との位置関係が読めません。' } };
  var CARRY = { angles: ['eye_level', 'three_quarter', 'side', 'low', 'high'], recommended: ['three_quarter', 'low'], defaultAngle: 'three_quarter', defaultShot: 'full_body', shots: ['full_body', 'knee_up'], blocked: { overhead: '真上からは抱え上げた高さが読めません。' }, blockedShots: { upper_body: '抱え上げている腕と脚が画角外になります。', close: '抱え上げている腕と脚が画角外になります。' } };

  var GF = { allowed: ['mutual', 'a_gazes_b', 'both_viewer', 'eyes_closed'], defaultId: 'mutual' };
  var GB = { allowed: ['back_gazes_front', 'front_looks_back', 'both_viewer', 'eyes_closed'], defaultId: 'back_gazes_front' };
  var GS = { allowed: ['a_gazes_b', 'mutual', 'both_viewer', 'eyes_closed'], defaultId: 'a_gazes_b' };

  var NONE = { mode: 'none', allowed: [], defaultId: null };
  var SEAT_B = { mode: 'seat', allowed: ['sofa', 'chair', 'bench', 'bed', 'floor'], defaultId: 'sofa' };
  var BOTH_SEAT = { mode: 'both_seat', allowed: ['sofa', 'bench', 'bed', 'floor'], defaultId: 'sofa' };
  var ON_BED = { mode: 'on', allowed: ['bed', 'floor', 'sofa'], defaultId: 'bed' };

  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function ex(main, gaze, sub) { return { main: main || null, gaze: gaze || null, sub: sub || null }; }
  // 短い記述から、既存と同じ形のポーズデータを組み立てる
  function pose(d) {
    var cam = copy(d.camera);
    cam.shots = cam.shots || ['full_body', 'knee_up', 'upper_body', 'close'];
    cam.blockedShots = cam.blockedShots || {};
    if (d.shot) cam.defaultShot = d.shot;
    if (d.angle) cam.defaultAngle = d.angle;
    if (d.shots) cam.shots = d.shots;
    return {
      id: d.id, labelJa: d.label, shortJa: d.short, poseFamily: d.family, category: d.category,
      roles: { a: d.roles[0], b: d.roles[1] },
      relation: { vertical: d.rel[0], depth: d.rel[1], facing: d.rel[2] },
      placement: { a: d.place[0], b: d.place[1] },
      contacts: d.contacts.map(function (c) { return { owner: c[0], ja: c[1], tsubaki: c[2] }; }),
      models: {
        tsubaki: { roleEn: { a: d.roleEn[0], b: d.roleEn[1] }, overview: d.ts[0], a: d.ts[1], b: d.ts[2] },
        sdxl: { core: d.sdxl[0], placement: d.sdxl[1] },
        nai: { core: d.nai.core, actions: (d.nai.actions || []).map(function (x) { return { tag: x[0], source: x[1] }; }), a: d.nai.a, b: d.nai.b, nl: d.nai.nl }
      },
      camera: cam,
      surface: copy(d.surface || NONE),
      gazes: copy(d.gazes),
      keywords: d.keywords,
      related: d.related || [],
      suggest: d.suggest || null,
      people: 2,
      collection: 'relationship'
    };
  }

  var extra = [
    // ---- 抱擁・密着 ----
    pose({
      id: 'pair_front_hug', label: '正面から抱き合う', short: '向かい合って立ち、互いの背中へ腕を回して抱き合う。',
      family: 'standing_leaning', category: 'embrace', roles: ['抱き寄せる側', '抱き返す側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bと向かい合って立ち、両腕をBの背中へ回して抱き寄せる。', 'Aの背中へ両腕を回し返し、顎をAの肩にのせる。'],
      contacts: [['a', 'Aの両腕 → Bの背中', "Person A's arms wrap around Person B's back"], ['b', 'Bの両腕 → Aの背中', "Person B's arms wrap around Person A's back"], ['b', 'Bの顎 → Aの肩', "Person B's chin rests on Person A's shoulder"]],
      roleEn: ['the one pulling the other into a hug', 'the one hugging back'],
      ts: ['Person A and Person B stand face to face and hug each other tightly.', "Person A wraps both arms around Person B's back.", "Person B hugs Person A back, chin resting on Person A's shoulder."],
      sdxl: [['mutual hug', 'standing'], ['arm around back', "head on another's shoulder"]],
      nai: { core: ['mutual hug', 'standing'], a: ['arm around back'], b: ["head on another's shoulder"], nl: 'the two stand face to face and hug each other' },
      camera: STAND, angle: 'three_quarter', gazes: { allowed: ['eyes_closed', 'both_viewer'], defaultId: 'eyes_closed' },
      keywords: ['抱き合う', 'ハグ', '正面', '抱擁', '抱きしめる', '立ち', '密着'],
      suggest: { a: ex('gentle_smile', 'closed'), b: ex('shy', 'closed') }
    }),
    pose({
      id: 'pair_side_hug', label: '横から抱きつく', short: '立っているBに、Aが横から両腕を回して抱きつく。',
      family: 'standing_leaning', category: 'embrace', roles: ['横から抱きつく側', '抱きつかれる側'], rel: ['level', 'none', 'side_on'],
      place: ['Bの横に立ち、両腕をBの腰へ回して抱きつく。頬をBの肩へ寄せる。', '正面を向いて立ち、片手でAの腕に触れる。'],
      contacts: [['a', 'Aの両腕 → Bの腰', "Person A's arms wrap around Person B's waist from the side"], ['a', 'Aの頬 → Bの肩', "Person A's cheek presses against Person B's shoulder"], ['b', 'Bの片手 → Aの腕', "one of Person B's hands rests on Person A's arm"]],
      roleEn: ['the one hugging from the side', 'the one being hugged'],
      ts: ['Person A hugs Person B from the side while both stand.', "Person A stands beside Person B with both arms wrapped around Person B's waist.", 'Person B stands facing forward.'],
      sdxl: [['hug', 'standing'], ['arms around waist', "head on another's shoulder", "hand on another's arm"]],
      nai: { core: ['standing'], actions: [['hug', 'a']], a: ['arms around waist', "head on another's shoulder"], b: ["hand on another's arm"], nl: 'one person hugs the other from the side' },
      camera: STAND, gazes: GS, keywords: ['横から', '抱きつく', 'ハグ', '密着', '甘える', '立ち'],
      suggest: { a: ex('playful_smile', 'look_up'), b: ex('troubled', 'side_glance', 'faint_smile') }
    }),
    pose({
      id: 'pair_arm_around_shoulder', label: '肩に腕を回す', short: '並んで立ち、AがBの肩へ腕を回して引き寄せる。',
      family: 'standing_leaning', category: 'embrace', roles: ['肩に腕を回す側', '引き寄せられる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に並んで立ち、片腕をBの肩へ回して軽く引き寄せる。', 'Aの隣に立ち、肩をAの体へ寄せる。'],
      contacts: [['a', 'Aの腕 → Bの両肩の後ろ', "Person A's arm rests across the back of Person B's shoulders"], ['a', 'Aの手 → Bの遠い側の肩', "Person A's hand holds Person B's far shoulder"], ['both', '肩どうし → 触れている', 'their shoulders touch']],
      roleEn: ['the one with an arm around the other', 'the one pulled close'],
      ts: ["Person A and Person B stand side by side, and Person A puts an arm around Person B's shoulders.", 'Person A pulls Person B slightly closer.', "Person B leans a little toward Person A's side."],
      sdxl: [['arm around shoulder', 'side-by-side', 'standing'], ['leaning to the side']],
      nai: { core: ['side-by-side', 'standing'], a: ['arm around shoulder'], b: ['leaning to the side'], nl: "the two stand side by side with one person's arm around the other's shoulders" },
      camera: STAND, angle: 'eye_level', gazes: GS, keywords: ['肩', '肩を組む', '腕を回す', '並ぶ', '仲良し', '立ち'],
      suggest: { a: ex('confident_smile', 'look_at'), b: ex('shy', 'look_away') }
    }),
    pose({
      id: 'pair_waist_pull', label: '腰を抱く', short: '向かい合って立ち、AがBの腰へ手を回して引き寄せる。',
      family: 'approach_touch', category: 'embrace', roles: ['腰を抱き寄せる側', '引き寄せられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['片腕をBの腰へ回し、自分の方へ引き寄せる。', '引き寄せられ、両手をAの胸に添える。'],
      contacts: [['a', 'Aの腕 → Bの腰', "Person A's arm wraps around Person B's waist"], ['b', 'Bの両手 → Aの胸', "Person B's hands rest on Person A's chest"], ['both', '体の前面 → ほぼ触れている', 'the fronts of their bodies are nearly touching']],
      roleEn: ['the one pulling the other in by the waist', 'the one pulled close'],
      ts: ["Person A and Person B stand face to face, and Person A pulls Person B in by the waist.", "Person A has one arm around Person B's waist.", "Person B is drawn close with both hands on Person A's chest."],
      sdxl: [['arm around waist', 'face-to-face', 'standing'], ["hand on another's chest"]],
      nai: { core: ['face-to-face', 'standing'], actions: [['pulling', 'a']], a: ['arm around waist'], b: ["hand on another's chest"], nl: 'one person pulls the other close by the waist' },
      camera: STAND, angle: 'three_quarter', gazes: GF, keywords: ['腰', '抱き寄せる', '引き寄せる', '腰を抱く', '向かい合う', '立ち'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('surprised', 'look_up', 'heavy_blush') }
    }),
    pose({
      id: 'pair_forehead_touch', label: '額を寄せ合う', short: '向かい合い、額どうしを軽く触れ合わせる。',
      family: 'approach_touch', category: 'embrace', roles: ['頬を包む側', '額を預ける側'], rel: ['level', 'none', 'face_to_face'],
      place: ['両手でBの頬を包み、額をBの額へ軽く当てる。', '額をAへ預け、両手をAの肩に置く。'],
      contacts: [['both', '額どうし → 触れている', 'their foreheads touch gently'], ['a', 'Aの両手 → Bの頬', "Person A's hands cradle Person B's cheeks"], ['b', 'Bの両手 → Aの肩', "Person B's hands rest on Person A's shoulders"]],
      roleEn: ['the one cradling the other\'s face', 'the one leaning in forehead to forehead'],
      ts: ['Person A and Person B face each other with their foreheads gently touching.', "Person A cradles Person B's face in both hands.", "Person B rests both hands on Person A's shoulders."],
      sdxl: [['forehead-to-forehead', 'face-to-face'], ["hands on another's cheeks", "hands on another's shoulders"]],
      nai: { core: ['forehead-to-forehead', 'face-to-face'], a: ["hands on another's cheeks"], b: ["hands on another's shoulders"], nl: 'the two face each other with their foreheads touching' },
      camera: FACE, gazes: { allowed: ['eyes_closed', 'mutual'], defaultId: 'eyes_closed' },
      keywords: ['額', 'おでこ', 'くっつける', '寄せ合う', '向かい合う', '顔', '近い'],
      suggest: { a: ex('gentle_smile', 'closed'), b: ex('slight_smile', 'closed') }
    }),
    pose({
      id: 'pair_nose_close', label: '鼻先が触れそうな距離で向かい合う', short: '鼻先が触れる寸前の距離で、顔を寄せて見つめ合う。',
      family: 'approach_touch', category: 'embrace', roles: ['顔を寄せる側', '顔を寄せられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bへ顔を寄せ、片手をBの腰に添える。鼻先は触れる手前で止める。', 'その場に立ち、片手をAの胸に添えて受け止める。'],
      contacts: [['both', '鼻先どうし → 触れる寸前（触れていない）', 'their noses are almost touching but not quite'], ['a', 'Aの片手 → Bの腰', "one of Person A's hands rests on Person B's waist"], ['b', 'Bの片手 → Aの胸', "one of Person B's hands rests on Person A's chest"]],
      roleEn: ['the one leaning in', 'the one being leaned in on'],
      ts: ['Person A and Person B face each other at extremely close range, their noses almost touching.', 'Person A leans in toward Person B.', 'Person B stays still and holds the gaze.'],
      sdxl: [['face-to-face', 'eye contact'], ["hand on another's waist", "hand on another's chest"]],
      nai: { core: ['face-to-face', 'eye contact'], a: ["hand on another's waist", 'leaning forward'], b: ["hand on another's chest"], nl: 'their faces are so close that their noses almost touch' },
      camera: FACE, gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['鼻先', '至近距離', '顔が近い', '見つめ合う', '向かい合う', '寸前'],
      suggest: { a: ex('confident_smile', 'look_at'), b: ex('blush', 'look_at', 'parted_lips') }
    }),
    pose({
      id: 'pair_face_in_chest', label: '胸元に顔をうずめる', short: 'BがAの胸元へ顔を寄せ、Aが頭を抱いて受け止める。',
      family: 'standing_leaning', category: 'embrace', roles: ['受け止める側', '胸元に顔をうずめる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['片腕をBの背中へ回し、反対の手でBの頭をなでる。', 'Aの胸元へ顔をうずめ、両手でAの服をつかむ。'],
      contacts: [['b', 'Bの顔 → Aの胸元', "Person B's face is buried against Person A's chest"], ['a', 'Aの片手 → Bの頭', "one of Person A's hands rests on Person B's head"], ['a', 'Aの反対の腕 → Bの背中', "Person A's other arm wraps around Person B's back"]],
      roleEn: ['the one holding the other', "the one burying their face in the other's chest"],
      ts: ["Person B buries their face against Person A's chest, and Person A holds Person B close.", "Person A wraps one arm around Person B's back and rests the other hand on Person B's head.", "Person B leans into Person A, gripping Person A's clothes."],
      sdxl: [['hug', 'head on chest'], ["hand on another's head"]],
      nai: { core: ['standing'], actions: [['hug', 'a']], a: ["hand on another's head"], b: ['head on chest'], nl: "one person buries their face in the other's chest while being held" },
      camera: STAND, angle: 'three_quarter', gazes: { allowed: ['eyes_closed', 'a_gazes_b'], defaultId: 'eyes_closed' },
      keywords: ['胸元', '顔をうずめる', '胸に顔', '抱きつく', '甘える', 'なでる', '頭'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex(null, 'closed', 'affectionate') }
    }),
    pose({
      id: 'pair_cheek_touch', label: '頬に手を添える', short: '向かい合い、AがBの頬に手を添える。Bはその手首に触れる。',
      family: 'approach_touch', category: 'embrace', roles: ['頬に手を添える側', '頬に触れられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bと向かい合い、片手をBの頬へ添える。', '頬に添えられた手首へ、自分の手を重ねる。'],
      contacts: [['a', 'Aの片手 → Bの頬', "one of Person A's hands rests on Person B's cheek"], ['b', 'Bの片手 → Aの手首', "Person B's hand holds Person A's wrist"]],
      roleEn: ["the one touching the other's cheek", 'the one whose cheek is touched'],
      ts: ["Person A and Person B face each other, and Person A rests a hand on Person B's cheek.", 'Person A reaches out with one hand.', "Person B lays a hand over Person A's wrist."],
      sdxl: [["hand on another's cheek", 'face-to-face'], ["holding another's wrist"]],
      nai: { core: ['face-to-face'], a: ["hand on another's cheek"], b: ["holding another's wrist"], nl: "one person rests a hand on the other's cheek" },
      camera: FACE, gazes: GF, keywords: ['頬', 'ほっぺ', '手を添える', '触れる', '向かい合う', '顔'],
      suggest: { a: ex('gentle_smile', 'look_at'), b: ex('blush', 'look_at') }
    }),
    pose({
      id: 'pair_chin_lift', label: '顎に手を添えて見上げさせる', short: 'AがBの顎に指を添えて持ち上げ、Bに見上げさせる。',
      family: 'approach_touch', category: 'embrace', roles: ['顎を持ち上げる側', '見上げさせられる側'], rel: ['a_taller', 'none', 'face_to_face'],
      place: ['Bの正面に立ち、指先でBの顎を軽く持ち上げる。', '顎を持ち上げられ、顔をAへ向ける。両手は体の前でそろえる。'],
      contacts: [['a', 'Aの指先 → Bの顎', "Person A's fingertips lift Person B's chin"], ['both', '顔どうし → 近い距離', 'their faces are close']],
      roleEn: ["the one lifting the other's chin", 'the one made to look up'],
      ts: ["Person A stands in front of Person B and gently lifts Person B's chin with their fingertips.", 'Person A tilts their head down toward Person B.', 'Person B tilts their face up toward Person A.'],
      sdxl: [["hand on another's chin", 'face-to-face'], ['head tilt']],
      nai: { core: ['face-to-face'], a: ["hand on another's chin"], b: ['head tilt'], nl: "one person lifts the other's chin with their fingertips" },
      camera: FACE, angle: 'three_quarter', gazes: GF, keywords: ['顎', 'あご', '顎クイ', '見上げる', '見下ろす', '主導', '誘導'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('shy', 'look_up', 'parted_lips') }
    }),

    // ---- 座位・膝上 ----
    pose({
      id: 'pair_lap_sideways', label: '膝の上に横向きで座る', short: '座っているBの膝の上に、Aが横向きに腰掛ける。',
      family: 'sitting_kneeling', category: 'seated', roles: ['膝に横向きに座る側', '座っている側'], rel: ['a_slightly_above', 'none', 'side_on'],
      place: ['Bの太ももの上に横向きに腰掛け、両腕をBの首へ回す。', '深く座り、片腕でAの背中を支える。'],
      contacts: [['a', 'Aの腰 → Bの太ももの上（横向き）', "Person A sits sideways across Person B's thighs"], ['a', 'Aの両腕 → Bの首の後ろ', "Person A's arms rest around Person B's neck"], ['b', 'Bの腕 → Aの背中', "Person B's arm supports Person A's back"]],
      roleEn: ["the one sitting sideways on the other's lap", 'the one seated underneath'],
      ts: ["Person B is seated, and Person A sits sideways across Person B's lap.", "Person A sits across Person B's thighs with both arms around Person B's neck.", "Person B sits back and supports Person A's back with one arm."],
      sdxl: [['sitting on lap', 'sitting sideways'], ['arms around neck', "hand on another's back"]],
      nai: { core: ['sitting on lap'], actions: [['sitting on lap', 'a']], a: ['sitting sideways', 'arms around neck'], b: ['sitting', "hand on another's back"], nl: "one person sits sideways across the other's lap" },
      camera: SEAT, surface: SEAT_B, gazes: GF, keywords: ['膝の上', '横向き', '膝に座る', '抱っこ', 'ソファ', '首に腕', '座る'],
      suggest: { a: ex('playful_smile', 'look_at'), b: ex('gentle_smile', 'look_up') }
    }),
    pose({
      id: 'pair_sofa_snuggle', label: 'ソファで寄り添って座る', short: '横に並んで座り、肩と脚を寄せ合って手を重ねる。',
      family: 'sitting_kneeling', category: 'seated', roles: ['手を重ねる側', '寄り添われる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に座り、肩と脚をBへ寄せる。片手をBの手に重ねる。', 'Aの隣に座り、肩をAへ寄せる。'],
      contacts: [['both', '肩どうし・脚どうし → 触れている', 'their shoulders and legs touch'], ['a', 'Aの手 → Bの手の上', "Person A's hand rests on top of Person B's hand"]],
      roleEn: ['the one sitting close with a hand over the other\'s', 'the one sitting close beside them'],
      ts: ['Person A and Person B sit side by side, snuggled close together.', "Person A sits pressed against Person B's side and lays a hand over Person B's hand.", 'Person B leans their shoulder against Person A.'],
      sdxl: [['sitting', 'side-by-side', 'shoulder-to-shoulder'], ['holding hands']],
      nai: { core: ['sitting', 'side-by-side', 'shoulder-to-shoulder'], a: ['holding hands', 'leaning to the side'], b: ['leaning to the side'], nl: 'the two sit side by side, snuggled close with shoulders touching' },
      camera: SEAT, angle: 'eye_level', surface: BOTH_SEAT, gazes: GS, keywords: ['ソファ', '寄り添う', '並んで座る', '隣', '肩', '手を重ねる', 'くっつく', '座る', 'ベンチ'],
      suggest: { a: ex('gentle_smile', 'look_at'), b: ex('shy', 'downcast') }
    }),
    pose({
      id: 'pair_armrest_lean', label: '肘掛けに腰掛けて寄りかかる', short: 'Bが座り、Aが肘掛けに腰掛けてBの方へ身を寄せる。',
      family: 'sitting_kneeling', category: 'seated', roles: ['肘掛けに腰掛ける側', '座っている側'], rel: ['a_taller', 'none', 'side_on'],
      place: ['肘掛けに腰掛け、上体をBの方へ傾ける。片手をBの肩に置く。', '深く座り、背もたれに体を預けてAを見上げる。'],
      contacts: [['a', 'Aの腰 → 肘掛け', 'Person A perches on the armrest'], ['a', 'Aの片手 → Bの肩', "one of Person A's hands rests on Person B's shoulder"], ['b', 'Bの背中 → 背もたれ', 'Person B leans back against the backrest']],
      roleEn: ['the one perched on the armrest', 'the one seated below'],
      ts: ['Person B sits back in the seat, and Person A perches on the armrest beside Person B.', "Person A leans toward Person B with one hand on Person B's shoulder.", 'Person B leans back and looks up at Person A.'],
      sdxl: [['sitting', 'armrest'], ['leaning forward', "hand on another's shoulder", 'leaning back']],
      nai: { core: ['armrest'], a: ['sitting', 'leaning forward', "hand on another's shoulder"], b: ['sitting', 'leaning back'], nl: 'one person sits in the seat while the other perches on the armrest and leans toward them' },
      camera: SEAT, surface: { mode: 'seat', allowed: ['sofa', 'chair'], defaultId: 'sofa' }, gazes: GF,
      keywords: ['肘掛け', 'ひじかけ', '背もたれ', 'もたれる', 'ソファ', '椅子', 'リラックス', '座る'],
      suggest: { a: ex('playful_smile', 'look_down'), b: ex('slight_smile', 'look_up') }
    }),
    pose({
      id: 'pair_hand_on_thigh', label: '太ももの上に手を置く', short: '並んで座り、AがBの太もも（膝の少し上）へ手を置く。',
      family: 'sitting_kneeling', category: 'seated', roles: ['手を置く側', '手を置かれる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に座って体をBへ向け、片手をBの太ももの膝寄りに置く。', '隣に座ったまま、両手を自分の膝の上でそろえる。'],
      contacts: [['a', 'Aの片手 → Bの太もも（膝の少し上）', "one of Person A's hands rests on Person B's thigh just above the knee"], ['both', '肩どうし → 近い', 'their shoulders are close']],
      roleEn: ["the one resting a hand on the other's thigh", 'the one sitting still beside them'],
      ts: ["Person A and Person B sit side by side, and Person A rests a hand on Person B's thigh just above the knee.", 'Person A sits turned toward Person B.', 'Person B sits upright with both hands on their own lap.'],
      sdxl: [['sitting', 'side-by-side'], ["hand on another's thigh", 'hands on lap']],
      nai: { core: ['sitting', 'side-by-side'], a: ["hand on another's thigh", 'leaning to the side'], b: ['hands on lap'], nl: "the two sit side by side and one rests a hand on the other's thigh" },
      camera: SEAT, angle: 'eye_level', surface: BOTH_SEAT, gazes: GS, keywords: ['太もも', 'ふともも', '膝', '手を置く', '並んで座る', '接触', 'ソファ', 'ベンチ'],
      suggest: { a: ex('confident_smile', 'side_glance'), b: ex('troubled', 'downcast', 'pressed_lips') }
    }),
    pose({
      id: 'pair_chin_on_seated_shoulder', label: '座る相手の肩に後ろからあごを乗せる', short: '座っているBの後ろから、Aが肩にあごを乗せて腕を回す。',
      family: 'sitting_kneeling', category: 'seated', roles: ['後ろからあごを乗せる側', '座っている側'], rel: ['level', 'b_front', 'same_direction'],
      place: ['座っているBの後ろから身をかがめ、あごをBの肩に乗せて両腕をBの肩の前へ回す。', '座ったまま前を向き、Aの腕に片手を添える。'],
      contacts: [['a', 'Aのあご → Bの肩', "Person A's chin rests on Person B's shoulder"], ['a', 'Aの両腕 → Bの肩の前', "Person A's arms drape loosely around the front of Person B's shoulders"], ['b', 'Bの片手 → Aの腕', "one of Person B's hands rests on Person A's arm"]],
      roleEn: ['the one leaning over from behind', 'the one seated in front'],
      ts: ["Person B is seated, and Person A leans over from behind with their chin on Person B's shoulder.", "Person A drapes both arms loosely around Person B's shoulders.", 'Person B sits facing forward.'],
      sdxl: [['hug from behind', 'sitting'], ['behind another', "head on another's shoulder", "hand on another's arm"]],
      nai: { core: ['hug from behind'], actions: [['hug from behind', 'a']], a: ['behind another', "head on another's shoulder", 'leaning forward'], b: ['sitting', "hand on another's arm"], nl: "one person sits while the other leans over from behind with their chin on the seated person's shoulder" },
      camera: SEAT, angle: 'eye_level', surface: SEAT_B, gazes: GB, keywords: ['肩', 'あご', '顎', '後ろから', '甘える', '座る', '背後'],
      suggest: { a: ex('playful_smile', 'look_at'), b: ex('slight_smile', 'side_glance') }
    }),
    pose({
      id: 'pair_lean_on_side', label: '片側から寄りかかる', short: '並んで座り、BがAの肩に頭を預けて体重をかける。',
      family: 'sitting_kneeling', category: 'seated', roles: ['寄りかかられる側（支える側）', '寄りかかる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['座ったまま、片腕をBの肩へ回して支える。', 'Aの肩に頭を預け、体重をAの側へかける。'],
      contacts: [['b', 'Bの頭 → Aの肩', "Person B's head rests on Person A's shoulder"], ['b', 'Bの体 → Aの脇', "Person B leans their weight against Person A's side"], ['a', 'Aの腕 → Bの肩', "Person A's arm wraps around Person B's shoulders"]],
      roleEn: ['the one being leaned on', 'the one leaning on the other'],
      ts: ["Person A and Person B sit side by side, and Person B leans their weight against Person A with their head on Person A's shoulder.", "Person A supports Person B with an arm around Person B's shoulders.", 'Person B rests against Person A.'],
      sdxl: [['sitting', 'side-by-side', "head on another's shoulder"], ['leaning on person', 'arm around shoulder']],
      nai: { core: ['sitting', 'side-by-side'], actions: [['leaning on person', 'b']], a: ['arm around shoulder'], b: ["head on another's shoulder"], nl: "the two sit side by side and one leans their head on the other's shoulder" },
      camera: SEAT, angle: 'eye_level', surface: BOTH_SEAT, gazes: GS, keywords: ['寄りかかる', 'もたれる', '肩に頭', 'ベンチ', 'ソファ', '並んで座る', '体重を預ける'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex(null, 'closed', 'affectionate') }
    }),

    // ---- ベッド・寝姿 ----
    pose({
      id: 'pair_lying_face_each', label: '横になって向かい合う', short: '二人とも横向きに寝て、向かい合う。',
      family: 'lying_bed', category: 'bed', roles: ['手を伸ばす側', '向かい合って寝る側'], rel: ['level', 'none', 'face_to_face'],
      place: ['横向きに寝てBと向かい合い、片手でBの頬に触れる。', '横向きに寝てAと向かい合い、片手をAの胸元に置く。'],
      contacts: [['a', 'Aの片手 → Bの頬', "one of Person A's hands touches Person B's cheek"], ['b', 'Bの片手 → Aの胸元', "one of Person B's hands rests on Person A's chest"], ['both', '体 → 少し離れている', 'a little space remains between their bodies']],
      roleEn: ['the one reaching out', 'the one lying facing them'],
      ts: ['Person A and Person B lie on their sides facing each other.', "Person A lies on their side and touches Person B's cheek.", "Person B lies on their side with one hand on Person A's chest."],
      sdxl: [['lying', 'on side', 'face-to-face'], ["hand on another's cheek", "hand on another's chest"]],
      nai: { core: ['lying', 'on side', 'face-to-face'], a: ["hand on another's cheek"], b: ["hand on another's chest"], nl: 'the two lie on their sides facing each other' },
      camera: LIE, surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' }, gazes: GF,
      keywords: ['横になる', '寝る', '向かい合う', 'ベッド', '添い寝', '横向き'],
      suggest: { a: ex('gentle_smile', 'look_at'), b: ex('slight_smile', 'look_at') }
    }),
    pose({
      id: 'pair_spooning', label: '添い寝で背後から抱く', short: '同じ向きに横になり、AがBを背後から抱く。',
      family: 'lying_bed', category: 'bed', roles: ['後ろから抱く側', '前で抱かれる側'], rel: ['level', 'b_front', 'same_direction'],
      place: ['Bの後ろで横向きに寝て、片腕をBの腰へ回す。', '横向きに寝て、腰に回されたAの腕を抱える。'],
      contacts: [['a', 'Aの腕 → Bの腰', "Person A's arm wraps around Person B's waist"], ['a', 'Aの胸 → Bの背中', "Person A's chest is close against Person B's back"], ['b', 'Bの手 → Aの腕', "Person B holds Person A's arm"]],
      roleEn: ['the one holding the other from behind', 'the one held in front'],
      ts: ['Person A and Person B lie on their sides facing the same way, and Person A holds Person B from behind.', "Person A lies behind Person B with an arm around Person B's waist.", "Person B lies in front, holding Person A's arm."],
      sdxl: [['spooning', 'lying', 'on side'], ['arm around waist', "holding another's arm"]],
      nai: { core: ['spooning', 'lying', 'on side'], actions: [['hug from behind', 'a']], a: ['arm around waist'], b: ["holding another's arm"], nl: 'the two lie on their sides, one holding the other from behind' },
      camera: LIE, surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' },
      gazes: { allowed: ['eyes_closed', 'back_gazes_front', 'front_looks_back', 'both_viewer'], defaultId: 'eyes_closed' },
      keywords: ['添い寝', 'スプーン', '背後から', '抱く', 'ベッド', '寝る', '後ろから抱く'],
      suggest: { a: ex('gentle_smile', 'closed'), b: ex('slight_smile', 'closed') }
    }),
    pose({
      id: 'pair_arm_pillow', label: '腕枕する', short: 'Aが仰向けに寝て腕を伸ばし、Bがその腕に頭をのせる。',
      family: 'lying_bed', category: 'bed', roles: ['腕枕をする側', '腕に頭をのせる側'], rel: ['level', 'none', 'side_on'],
      place: ['仰向けに寝て、片腕をBの頭の下へ伸ばす。', 'Aの方を向いて横向きに寝て、Aの二の腕に頭をのせる。片手をAの胸に置く。'],
      contacts: [['b', 'Bの頭 → Aの二の腕', "Person B's head rests on Person A's upper arm"], ['b', 'Bの片手 → Aの胸', "one of Person B's hands rests on Person A's chest"]],
      roleEn: ['the one offering their arm as a pillow', "the one resting their head on the other's arm"],
      ts: ["Person A lies on their back with one arm stretched out, and Person B rests their head on Person A's arm.", 'Person A lies on their back.', "Person B lies on their side facing Person A, one hand on Person A's chest."],
      sdxl: [['arm pillow', 'lying'], ['on back', 'on side', "hand on another's chest"]],
      nai: { core: ['lying'], a: ['arm pillow', 'on back'], b: ['on side', "hand on another's chest"], nl: "one person lies on their back while the other rests their head on that person's arm" },
      camera: LIE, angle: 'overhead', surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' },
      gazes: { allowed: ['eyes_closed', 'a_gazes_b', 'mutual'], defaultId: 'a_gazes_b' },
      keywords: ['腕枕', 'うでまくら', '添い寝', 'ベッド', '寝る', '仰向け'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex(null, 'closed', 'affectionate') }
    }),
    pose({
      id: 'pair_lying_embrace', label: '片腕で抱き寄せて横になる', short: '向かい合って横になり、AがBを片腕で抱き寄せる。',
      family: 'lying_bed', category: 'bed', roles: ['抱き寄せる側', '抱き寄せられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['横向きに寝て、片腕をBの背中へ回して抱き寄せる。', '横向きに寝て、顔をAの胸元へ寄せる。片手をAの胸に置く。'],
      contacts: [['a', 'Aの腕 → Bの背中', "Person A's arm wraps around Person B's back"], ['b', 'Bの顔 → Aの胸元の近く', "Person B's face is close to Person A's chest"], ['b', 'Bの片手 → Aの胸', "one of Person B's hands rests on Person A's chest"]],
      roleEn: ['the one pulling the other close', 'the one held close'],
      ts: ['Person A and Person B lie on their sides facing each other, and Person A pulls Person B close with one arm.', "Person A wraps one arm around Person B's back.", "Person B nestles close, face near Person A's chest."],
      sdxl: [['lying', 'on side', 'hug'], ['arm around back', "hand on another's chest"]],
      nai: { core: ['lying', 'on side'], actions: [['hug', 'a']], a: ['arm around back'], b: ["hand on another's chest"], nl: 'the two lie facing each other while one pulls the other close with one arm' },
      camera: LIE, surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' }, gazes: GF,
      keywords: ['抱き寄せる', '横になる', '寝る', 'ベッド', '添い寝', '片腕', '密着'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex('shy', 'look_up') }
    }),
    pose({
      id: 'pair_lying_on_person', label: '相手の上に上半身を預ける', short: '仰向けのBの胸に、Aがうつ伏せで上半身を預ける。',
      family: 'lying_bed', category: 'bed', roles: ['上半身を預ける側', '仰向けで受け止める側'], rel: ['a_above', 'none', 'face_to_face'],
      place: ['Bの横でうつ伏せになり、上半身だけをBの胸の上に預ける。両手を重ねてあごをのせる。脚はBの横に伸ばす。', '仰向けに寝て、片手でAの髪をなでる。'],
      contacts: [['a', 'Aの上半身 → Bの胸の上', "Person A's upper body rests on Person B's chest"], ['a', 'Aのあご → 自分の重ねた手', "Person A's chin rests on their own folded hands"], ['b', 'Bの片手 → Aの頭', "one of Person B's hands strokes Person A's hair"]],
      roleEn: ['the one resting their upper body on the other', 'the one lying on their back underneath'],
      ts: ["Person B lies on their back, and Person A lies on their stomach beside Person B with only their upper body resting on Person B's chest.", "Person A props their chin on their folded hands, legs stretched out alongside Person B.", "Person B lies on their back and strokes Person A's hair."],
      sdxl: [['lying on person', 'on back'], ['on stomach', 'head rest', "hand on another's head"]],
      nai: { core: ['lying'], actions: [['lying on person', 'a']], a: ['on stomach', 'head rest'], b: ['on back', "hand on another's head"], nl: "one person lies on their back while the other rests their upper body on that person's chest" },
      camera: LIE, surface: ON_BED, gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['体重を預ける', '乗りかかる', '上に乗る', 'うつ伏せ', 'ベッド', '寝る', '甘える'],
      suggest: { a: ex('playful_smile', 'look_down'), b: ex('gentle_smile', 'look_up') }
    }),
    pose({
      id: 'pair_bed_sitting_facing', label: 'ベッドで向かい合って座る', short: 'ベッドの上で向かい合って座り、膝が触れそうな距離で手をつなぐ。',
      family: 'sitting_kneeling', category: 'bed', roles: ['あぐらで座る側', '正座で座る側'], rel: ['level', 'none', 'face_to_face'],
      place: ['あぐらで座り、両手でBの手を取る。', '正座で座り、両手をAに預ける。膝はAの膝のすぐ前。'],
      contacts: [['both', '両手 → つないでいる', 'they hold hands between them'], ['both', '膝どうし → 触れそうな距離', 'their knees are almost touching']],
      roleEn: ['the one sitting cross-legged', 'the one kneeling upright'],
      ts: ['Person A and Person B sit facing each other, so close that their knees almost touch, holding hands between them.', 'Person A sits cross-legged.', 'Person B sits in a kneeling position.'],
      sdxl: [['sitting', 'face-to-face', 'holding hands'], ['indian style', 'seiza']],
      nai: { core: ['sitting', 'face-to-face', 'holding hands'], a: ['indian style'], b: ['seiza'], nl: 'the two sit facing each other with their knees almost touching' },
      camera: SEAT, surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' }, gazes: GF,
      keywords: ['向かい合って座る', 'ベッド', 'あぐら', '正座', '手をつなぐ', '膝', '座る'],
      suggest: { a: ex('gentle_smile', 'look_at'), b: ex('shy', 'downcast') }
    }),
    pose({
      id: 'pair_loom_one_hand', label: '片手をシーツにつきながら見下ろす', short: '仰向けのBの横で、Aが片手をシーツについて上から見下ろす。',
      family: 'lying_bed', category: 'bed', roles: ['片手をついて見下ろす側', '仰向けで見上げる側'], rel: ['a_above', 'none', 'face_to_face'],
      place: ['Bの横に膝をつき、Bの肩の向こう側のシーツへ片手をつく。反対の手でBの髪に触れる。', '仰向けに寝て、Aを見上げる。両腕は体の横に置く。'],
      contacts: [['a', 'Aの片手 → Bの肩の向こう側のシーツ', "one of Person A's hands is planted on the sheet beyond Person B's shoulder"], ['a', 'Aの反対の手 → Bの髪', "Person A's other hand touches Person B's hair"], ['a', 'Aの膝 → Bの横のシーツ', 'Person A kneels on the sheet beside Person B']],
      roleEn: ['the one braced on one hand above', 'the one lying on their back below'],
      ts: ['Person B lies on their back, and Person A kneels beside Person B, braced on one hand, leaning over to look down at Person B.', "Person A plants one hand on the sheet beyond Person B's shoulder and touches Person B's hair with the other hand.", 'Person B lies on their back, looking up at Person A.'],
      sdxl: [['on back', 'kneeling', 'leaning forward'], ["hand in another's hair"]],
      nai: { core: ['face-to-face'], a: ['kneeling', 'leaning forward', "hand in another's hair"], b: ['on back', 'lying'], nl: 'one person lies on their back while the other kneels beside them, braced on one hand, looking down' },
      camera: LIE, angle: 'three_quarter', surface: ON_BED, gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['片手', 'シーツ', '見下ろす', '見上げる', '上下関係', 'ベッド', '仰向け', '覆いかぶさる'],
      related: ['relationship_bed_leaning_over_viewer'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('surprised', 'look_up', 'gasp') }
    }),
    pose({
      id: 'pair_propped_beside', label: '仰向けの相手の隣で身を乗り出す', short: '仰向けのBの隣で、Aが横向きにひじをついて顔を近づける。',
      family: 'lying_bed', category: 'bed', roles: ['ひじをついて身を乗り出す側', '仰向けの側'], rel: ['a_taller', 'none', 'side_on'],
      place: ['Bの隣で横向きに寝て、ひじをついて上体を起こし、Bの顔へ身を乗り出す。', '仰向けに寝て、顔だけAの方へ向ける。'],
      contacts: [['a', 'Aのひじ → Bの頭の横のシーツ', "Person A's elbow rests on the sheet beside Person B's head"], ['both', '顔どうし → 近い', 'their faces are close']],
      roleEn: ['the one propped on an elbow leaning in', 'the one lying on their back'],
      ts: ['Person B lies on their back, and Person A lies on their side next to Person B, propped up on one elbow and leaning in close to Person B\'s face.', 'Person A props themselves up on one elbow.', 'Person B lies on their back, head turned toward Person A.'],
      sdxl: [['lying', 'elbow rest'], ['on side', 'on back', 'leaning forward']],
      nai: { core: ['lying'], a: ['on side', 'elbow rest', 'leaning forward'], b: ['on back'], nl: 'one person lies on their back while the other lies beside them propped on an elbow, leaning in' },
      camera: LIE, surface: { mode: 'on', allowed: ['bed', 'floor'], defaultId: 'bed' }, gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['隣', '身を乗り出す', 'ひじをつく', '頬杖', '顔を近づける', 'ベッド', '仰向け'],
      related: ['relationship_bed_supine_looking_up'],
      suggest: { a: ex('playful_smile', 'look_down'), b: ex('slight_smile', 'look_up') }
    }),
    pose({
      id: 'pair_hand_on_hip_lying', label: '横たわる相手の腰に手を置く', short: '横向きに寝ているBのそばにAが座り、Bの腰のあたりに手を置く。',
      family: 'lying_bed', category: 'bed', roles: ['そばに座って手を置く側', '横向きに寝ている側'], rel: ['a_taller', 'none', 'side_on'],
      place: ['Bのそばに腰掛け、片手をBの腰の横に置く。', '横向きに寝て、Aの方へ顔を向ける。'],
      contacts: [['a', 'Aの片手 → Bの腰の横', "one of Person A's hands rests on the side of Person B's hip"], ['a', 'Aの腰 → Bのそばの面', 'Person A sits on the surface right next to Person B']],
      roleEn: ['the one sitting beside the other', 'the one lying on their side'],
      ts: ["Person B lies on their side, and Person A sits right beside Person B with one hand resting on Person B's hip.", 'Person A sits leaning slightly toward Person B.', 'Person B lies on their side, face turned toward Person A.'],
      sdxl: [['on side', 'sitting'], ["hand on another's hip", 'lying']],
      nai: { core: ['lying'], a: ['sitting', "hand on another's hip"], b: ['on side'], nl: 'one person lies on their side while the other sits beside them with a hand on their hip' },
      camera: LIE, angle: 'three_quarter', surface: ON_BED, gazes: { allowed: ['a_gazes_b', 'mutual', 'eyes_closed'], defaultId: 'a_gazes_b' },
      keywords: ['腰', '手を置く', '横たわる', '寝ている', 'ベッド', 'そばに座る', '接触'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex(null, 'half_closed', 'faint_smile') }
    }),

    // ---- 立位・壁際 ----
    pose({
      id: 'pair_wall_gaze', label: '壁際で見つめ合う', short: '壁に背をつけたBの前に、Aが少し間を空けて立ち、見つめ合う。',
      family: 'standing_leaning', category: 'standing', roles: ['前に立つ側', '壁に背をつける側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bの正面に立ち、少しだけ前かがみになる。手は壁につかない。', '壁に背をつけて立ち、Aを見つめ返す。'],
      contacts: [['b', 'Bの背中 → 壁', "Person B's back rests against the wall"], ['both', '体 → 半歩ほど離れている', 'about half a step of space remains between them']],
      roleEn: ['the one standing in front', 'the one with their back to the wall'],
      ts: ['Person B stands with their back against a wall, and Person A stands close in front of Person B, face to face.', 'Person A leans in slightly without touching the wall.', 'Person B stands against the wall, returning the gaze.'],
      sdxl: [['against wall', 'face-to-face', 'standing'], ['leaning forward']],
      nai: { core: ['face-to-face', 'standing'], a: ['leaning forward'], b: ['against wall'], nl: 'one person stands with their back to a wall while the other stands close in front of them' },
      camera: WALL, gazes: GF, keywords: ['壁', '壁際', '見つめ合う', '向かい合う', '立ち', '近い'],
      suggest: { a: ex('confident_smile', 'look_at'), b: ex('troubled', 'look_at') }
    }),
    pose({
      id: 'pair_wall_hand', label: '片手で壁に手をつく', short: '壁に背をつけたBの顔の横へ、Aが片手をつく。',
      family: 'standing_leaning', category: 'standing', roles: ['壁に手をつく側', '壁を背にする側'], rel: ['a_taller', 'none', 'face_to_face'],
      place: ['Bの顔の横の壁へ片手をつき、上体をBへ寄せる。', '壁に背をつけて立ち、Aを見上げる。'],
      contacts: [['a', 'Aの片手 → Bの顔の横の壁', "one of Person A's hands is planted on the wall beside Person B's head"], ['b', 'Bの背中 → 壁', "Person B's back is against the wall"]],
      roleEn: ['the one with a hand on the wall', 'the one with their back to the wall'],
      ts: ["Person B stands with their back against a wall, and Person A plants one hand on the wall beside Person B's head.", 'Person A leans in over Person B.', 'Person B stays against the wall, looking up at Person A.'],
      sdxl: [['kabedon', 'against wall'], ['hand on wall', 'face-to-face']],
      nai: { core: ['face-to-face'], actions: [['kabedon', 'a']], a: ['hand on wall', 'leaning forward'], b: ['against wall'], nl: "one person plants a hand on the wall beside the other's head" },
      camera: WALL, gazes: GF, keywords: ['壁ドン', '壁', '手をつく', '壁際', '迫る', '立ち', '見上げる'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('surprised', 'look_up', 'heavy_blush') }
    }),
    pose({
      id: 'pair_tie_pull', label: '襟やネクタイを引く', short: 'AがBのネクタイ（または襟）をつかんで引き寄せる。',
      family: 'standing_leaning', category: 'standing', roles: ['ネクタイを引く側', '引き寄せられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['片手でBのネクタイ（または襟）をつかみ、自分の方へ引く。', '引かれて前かがみになり、顔がAに近づく。'],
      contacts: [['a', 'Aの片手 → Bのネクタイ（または襟）', "one of Person A's hands grips Person B's necktie"], ['both', '顔どうし → 近づく', 'their faces are drawn close']],
      roleEn: ["the one pulling the other's necktie", 'the one being pulled in'],
      ts: ["Person A grips Person B's necktie and pulls Person B closer.", "Person A holds Person B's necktie in one hand.", 'Person B is pulled forward, leaning toward Person A.'],
      sdxl: [['necktie grab', 'face-to-face', 'standing'], ['leaning forward']],
      nai: { core: ['face-to-face', 'standing'], actions: [['necktie grab', 'a']], a: ['pulling'], b: ['leaning forward', 'necktie'], nl: "one person grabs the other's necktie and pulls them closer" },
      camera: STAND, angle: 'side', shot: 'upper_body', gazes: GF, keywords: ['ネクタイ', '襟', 'えり', '引く', '引き寄せる', '主導', '立ち'],
      suggest: { a: ex('teasing_smile', 'look_at'), b: ex('surprised', 'look_at', 'gasp') }
    }),
    pose({
      id: 'pair_wall_lift', label: '壁際で抱き上げる', short: '壁に背をつけたBの腰を、Aが持ち上げて支える。',
      family: 'standing_leaning', category: 'standing', roles: ['抱き上げる側', '抱き上げられる側'], rel: ['b_carried', 'none', 'face_to_face'],
      place: ['両手でBの腰を持ち、Bを壁際で持ち上げて支える。', '壁に背を預けたまま持ち上げられ、両手をAの肩に置く。足は床から離れる。'],
      contacts: [['a', 'Aの両手 → Bの腰', "Person A's hands hold Person B's waist"], ['b', 'Bの両手 → Aの肩', "Person B's hands rest on Person A's shoulders"], ['b', 'Bの背中 → 壁', "Person B's back rests against the wall"]],
      roleEn: ['the one lifting the other', 'the one lifted against the wall'],
      ts: ["Person B's back is against a wall, and Person A lifts Person B up by the waist.", "Person A holds Person B's waist with both hands, standing firmly.", "Person B is held up against the wall, hands on Person A's shoulders, looking down at Person A."],
      sdxl: [['lifting person', 'against wall'], ["hands on another's waist", "hands on another's shoulders"]],
      nai: { core: ['face-to-face'], actions: [['lifting person', 'a']], a: ["hands on another's waist", 'standing'], b: ["hands on another's shoulders", 'against wall'], nl: 'one person lifts the other up against a wall by the waist' },
      camera: CARRY, gazes: GF, keywords: ['抱き上げる', '持ち上げる', '壁際', '壁', '体格差', 'リフト'],
      suggest: { a: ex('confident_smile', 'look_up'), b: ex('surprised', 'look_down', 'heavy_blush') }
    }),
    pose({
      id: 'pair_wall_press', label: '壁に背を預けた相手へ身を寄せる', short: '壁に背をつけたBへ、Aが正面から体を寄せる。',
      family: 'standing_leaning', category: 'standing', roles: ['身を寄せる側', '壁に背を預ける側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bへ正面から体を寄せ、両手をBの腰に添える。', '壁に背を預け、両手をAの胸に置く。'],
      contacts: [['a', 'Aの両手 → Bの腰', "Person A's hands rest on Person B's waist"], ['b', 'Bの両手 → Aの胸', "Person B's hands rest on Person A's chest"], ['b', 'Bの背中 → 壁', "Person B's back rests against the wall"], ['both', '体の前面 → 触れている', 'the fronts of their bodies touch']],
      roleEn: ['the one pressing close', 'the one leaning back against the wall'],
      ts: ['Person B leans back against a wall, and Person A presses close to Person B from the front.', "Person A rests both hands on Person B's waist.", "Person B leans against the wall with both hands on Person A's chest."],
      sdxl: [['against wall', 'face-to-face'], ["hands on another's waist", "hand on another's chest"]],
      nai: { core: ['face-to-face'], a: ["hands on another's waist", 'leaning forward'], b: ['against wall', "hand on another's chest"], nl: 'one person leans against a wall while the other presses close from the front' },
      camera: WALL, gazes: GF, keywords: ['壁', '壁際', '身を寄せる', '密着', '正面', '立ち'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('shy', 'look_away', 'parted_lips') }
    }),
    pose({
      id: 'pair_wall_back_hug', label: '壁際で背後から抱き寄せる', short: '壁の方を向いて片手を壁につくBを、Aが背後から抱き寄せる。',
      family: 'standing_leaning', category: 'standing', roles: ['背後から抱き寄せる側', '壁の方を向く側'], rel: ['level', 'b_front', 'same_direction'],
      place: ['Bの真後ろに立ち、両腕をBの腰へ回して抱き寄せる。', '壁の方を向いて立ち、片手を壁につく。顔だけ振り返る。'],
      contacts: [['a', 'Aの両腕 → Bの腰', "Person A's arms wrap around Person B's waist"], ['b', 'Bの片手 → 壁', "one of Person B's hands rests on the wall"], ['a', 'Aの胸 → Bの背中', "Person A's chest is close against Person B's back"]],
      roleEn: ['the one embracing from behind', 'the one facing the wall'],
      ts: ['Person B stands facing a wall with one hand on it, and Person A embraces Person B from behind.', "Person A stands directly behind Person B with both arms around Person B's waist.", 'Person B faces the wall and turns their head to look back.'],
      sdxl: [['hug from behind', 'hand on wall'], ['arms around waist', 'facing away']],
      nai: { core: ['standing'], actions: [['hug from behind', 'a']], a: ['arms around waist'], b: ['hand on wall', 'facing away'], nl: 'one person faces a wall with a hand on it while the other embraces them from behind' },
      camera: WALL, angle: 'side', gazes: { allowed: ['front_looks_back', 'back_gazes_front', 'eyes_closed'], defaultId: 'front_looks_back' },
      keywords: ['壁', '壁際', '背後', '後ろから', '抱き寄せる', 'バックハグ', '振り返る', '立ち'],
      suggest: { a: ex('gentle_smile', 'look_at'), b: ex('shy', 'side_glance') }
    }),
    pose({
      id: 'pair_leg_hook', label: '片脚を相手の脚にかける', short: '壁に背をつけたBが、片脚を曲げてAのふくらはぎに軽くかける。',
      family: 'standing_leaning', category: 'standing', roles: ['腰を支える側', '片脚をかける側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bの正面に立ち、両手でBの腰を支える。', '壁に背をつけ、片脚を曲げてAのふくらはぎの後ろへ軽くかける。両手はAの肩。'],
      contacts: [['b', 'Bの曲げた片脚 → Aのふくらはぎの後ろ', "Person B lightly hooks one bent leg behind Person A's calf"], ['a', 'Aの両手 → Bの腰', "Person A's hands support Person B's waist"], ['b', 'Bの両手 → Aの肩', "Person B's hands rest on Person A's shoulders"]],
      roleEn: ['the one supporting the other', 'the one hooking a leg around the other'],
      ts: ["Person B leans back against a wall and lightly hooks one bent leg behind Person A's calf.", "Person A stands in front of Person B, supporting Person B's waist with both hands.", "Person B keeps one foot on the floor and rests both hands on Person A's shoulders."],
      sdxl: [['face-to-face', 'standing', 'against wall'], ['leg up', "hands on another's waist", "hands on another's shoulders"]],
      nai: { core: ['face-to-face', 'standing'], a: ["hands on another's waist"], b: ['leg up', 'against wall', "hands on another's shoulders"], nl: "one person leans on a wall and lightly hooks a bent leg behind the other's calf" },
      camera: WALL, angle: 'side', shot: 'full_body', shots: ['full_body', 'knee_up'], gazes: GF,
      keywords: ['片脚', '片足', '脚をかける', '足をかける', '壁', '密着', '立ち', '動き'],
      suggest: { a: ex('confident_smile', 'look_at'), b: ex('playful_smile', 'look_at') }
    }),
    pose({
      id: 'pair_ear_whisper', label: '耳元に顔を寄せる', short: 'AがBの耳元へ顔を寄せてささやく。',
      family: 'approach_touch', category: 'standing', roles: ['耳元でささやく側', 'ささやかれる側'], rel: ['level', 'none', 'side_on'],
      place: ['Bの横から顔を寄せ、口元をBの耳に近づける。片手をBの肩に置く。', '前を向いたまま、片手を自分の胸元に当てる。'],
      contacts: [['a', 'Aの口元 → Bの耳のすぐそば', "Person A's mouth is right next to Person B's ear"], ['a', 'Aの片手 → Bの肩', "one of Person A's hands rests on Person B's shoulder"]],
      roleEn: ["the one whispering into the other's ear", 'the one listening'],
      ts: ["Person A leans in from the side and whispers into Person B's ear.", "Person A rests one hand on Person B's shoulder.", 'Person B stands still, one hand pressed to their own chest.'],
      sdxl: [['whispering', 'standing'], ["hand on another's shoulder", 'hand on own chest']],
      nai: { core: ['standing'], actions: [['whispering', 'a']], a: ["hand on another's shoulder", 'leaning forward'], b: ['hand on own chest'], nl: "one person leans in and whispers into the other's ear" },
      camera: FACE, angle: 'three_quarter', gazes: { allowed: ['a_gazes_b', 'eyes_closed', 'both_viewer'], defaultId: 'a_gazes_b' },
      keywords: ['耳元', 'ささやく', '囁く', '耳', '近い', '立ち'],
      suggest: { a: ex('teasing_smile', 'side_glance'), b: ex('blush', 'look_away', 'pressed_lips') }
    }),

    // ---- 支え・抱き上げ ----
    pose({
      id: 'pair_princess_carry', label: 'お姫様抱っこ', short: 'AがBを横抱きにして持ち上げる。',
      family: 'standing_leaning', category: 'carry', roles: ['抱き上げる側', '抱き上げられる側'], rel: ['b_carried', 'none', 'side_on'],
      place: ['立ったまま、片腕をBの背中、反対の腕をBの膝の裏へ回して横抱きにする。', '横抱きにされ、両腕をAの首へ回す。'],
      contacts: [['a', 'Aの片腕 → Bの背中', "one of Person A's arms supports Person B's back"], ['a', 'Aの反対の腕 → Bの膝の裏', "Person A's other arm is under Person B's knees"], ['b', 'Bの両腕 → Aの首', "Person B's arms wrap around Person A's neck"]],
      roleEn: ['the one carrying', 'the one being carried'],
      ts: ['Person A carries Person B in their arms in a princess carry.', "Person A stands holding Person B, one arm behind Person B's back and the other under Person B's knees.", "Person B is held across Person A's chest with both arms around Person A's neck."],
      sdxl: [['princess carry'], ['arms around neck']],
      nai: { core: ['princess carry'], actions: [['carrying', 'a']], a: ['standing'], b: ['arms around neck'], nl: 'one person carries the other in their arms' },
      camera: CARRY, gazes: GF, keywords: ['お姫様抱っこ', '横抱き', '抱き上げる', '抱っこ', '持ち上げる', '支える'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex('shy', 'look_up') }
    }),
    pose({
      id: 'pair_dip_support', label: '倒れそうな相手を支える', short: '後ろへ倒れかけるBの背中を、Aが片腕で支える。',
      family: 'standing_leaning', category: 'carry', roles: ['支える側', '後ろへ倒れかける側'], rel: ['a_taller', 'none', 'face_to_face'],
      place: ['片腕でBの背中を支え、上体をBへかがめる。反対の手でBの手を取る。', '後ろへ大きく反り、Aの腕に体を預ける。'],
      contacts: [['a', 'Aの片腕 → Bの背中', "one of Person A's arms supports Person B's back"], ['both', '片手どうし → つないでいる', 'they hold one hand'], ['both', '顔どうし → 近い', 'their faces are close']],
      roleEn: ['the one catching and supporting', 'the one leaning far back'],
      ts: ["Person B leans far back as if falling, and Person A catches Person B, supporting Person B's back with one arm.", 'Person A bends over Person B and holds Person B\'s hand with the other hand.', "Person B arches back, trusting their weight to Person A's arm."],
      sdxl: [['leaning back', "hand on another's back"], ['leaning forward', 'holding hands']],
      nai: { core: ['face-to-face', 'holding hands'], actions: [['catching', 'a']], a: ["hand on another's back", 'leaning forward'], b: ['leaning back'], nl: "one person leans far back as if falling and the other supports their back" },
      camera: CARRY, angle: 'side', gazes: GF, keywords: ['支える', '倒れる', '受け止める', 'ドラマチック', 'ダンス', '密着'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('surprised', 'look_up', 'gasp') }
    }),
    pose({
      id: 'pair_lift_gaze', label: '抱え上げて見つめ合う', short: 'AがBの腰を持って抱え上げ、高い位置のBと見つめ合う。',
      family: 'standing_leaning', category: 'carry', roles: ['抱え上げる側', '抱え上げられる側'], rel: ['b_carried', 'none', 'face_to_face'],
      place: ['両手でBの腰を持ち、Bを自分より高く持ち上げる。', '持ち上げられ、両手をAの肩に置いてAを見下ろす。'],
      contacts: [['a', 'Aの両手 → Bの腰', "Person A's hands hold Person B's waist"], ['b', 'Bの両手 → Aの肩', "Person B's hands rest on Person A's shoulders"]],
      roleEn: ['the one lifting', 'the one lifted up'],
      ts: ["Person A lifts Person B up by the waist so that Person B's face is above Person A's.", "Person A stands firmly, holding Person B's waist with both hands.", "Person B rests both hands on Person A's shoulders."],
      sdxl: [['lifting person', 'face-to-face'], ["hands on another's waist", "hands on another's shoulders"]],
      nai: { core: ['face-to-face'], actions: [['lifting person', 'a']], a: ["hands on another's waist", 'standing'], b: ["hands on another's shoulders"], nl: 'one person lifts the other up by the waist and they look at each other' },
      camera: CARRY, gazes: GF, keywords: ['抱え上げる', '持ち上げる', '見つめ合う', 'リフト', '高い高い', '支える'],
      suggest: { a: ex('gentle_smile', 'look_up'), b: ex('playful_smile', 'look_down') }
    }),
    pose({
      id: 'pair_shoulder_support', label: '肩を貸して支える', short: 'Bの腕を肩にかけ、Aが腰を支えて一緒に歩く。',
      family: 'standing_leaning', category: 'carry', roles: ['肩を貸す側', '支えられる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの腕を自分の肩にかけさせ、片腕でBの腰を支えて歩く。', '片腕をAの肩にかけ、体重を少しAへ預けて歩く。'],
      contacts: [['b', 'Bの腕 → Aの肩の上', "Person B's arm is draped over Person A's shoulders"], ['a', 'Aの腕 → Bの腰', "Person A's arm supports Person B's waist"]],
      roleEn: ['the one lending a shoulder', 'the one being supported'],
      ts: ['Person A and Person B walk side by side, with Person A supporting Person B.', "Person A holds Person B's waist with one arm.", "Person B leans on Person A with one arm over Person A's shoulders."],
      sdxl: [['arm over shoulder', 'walking'], ['arm around waist', 'side-by-side']],
      nai: { core: ['walking', 'side-by-side'], a: ['arm around waist'], b: ['arm over shoulder'], nl: "one person helps the other walk, with the other's arm over their shoulders" },
      camera: CARRY, angle: 'eye_level', gazes: GS, keywords: ['肩を貸す', '支える', '歩く', '介抱', '寄りかかる', '弱る'],
      suggest: { a: ex('troubled', 'look_at'), b: ex('wistful', 'downcast') }
    }),
    pose({
      id: 'pair_one_arm_hold', label: '片腕で抱え込む', short: '横に立つBの肩をAが片腕で抱え込み、自分の胸元へ引き寄せる。',
      family: 'standing_leaning', category: 'carry', roles: ['片腕で抱え込む側', '抱え込まれる側'], rel: ['level', 'none', 'side_on'],
      place: ['片腕をBの肩へ回し、Bの頭を自分の胸元へ引き寄せる。', 'Aの胸元へ頭を寄せ、片手をAの胸に置く。'],
      contacts: [['a', 'Aの片腕 → Bの肩', "Person A's arm wraps firmly around Person B's shoulders"], ['b', 'Bの頭 → Aの胸元', "Person B's head is pulled against Person A's chest"], ['b', 'Bの片手 → Aの胸', "one of Person B's hands rests on Person A's chest"]],
      roleEn: ['the one holding the other with one arm', 'the one held close'],
      ts: ["Person A firmly pulls Person B in with one arm around Person B's shoulders.", "Person A holds Person B's head against their chest.", "Person B leans against Person A's chest with one hand on it."],
      sdxl: [['hug', 'arm around shoulder'], ['head on chest', "hand on another's chest"]],
      nai: { core: ['standing'], actions: [['hug', 'a']], a: ['arm around shoulder'], b: ['head on chest', "hand on another's chest"], nl: "one person pulls the other against their chest with one arm" },
      camera: STAND, angle: 'three_quarter', gazes: { allowed: ['a_gazes_b', 'eyes_closed', 'both_viewer'], defaultId: 'eyes_closed' },
      keywords: ['片腕', '抱え込む', '抱き寄せる', '胸元', '力強い', '守る', '立ち'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex(null, 'closed', 'affectionate') }
    }),
    pose({
      id: 'pair_pull_into_arms', label: '引き寄せて支える', short: 'AがBの手首を引き、胸へ倒れ込んできたBを片手で受け止める。',
      family: 'standing_leaning', category: 'carry', roles: ['引き寄せて受け止める側', '引き寄せられる側'], rel: ['level', 'none', 'face_to_face'],
      place: ['片手でBの手首を引き、反対の手でBの背中を受け止める。', '引かれて前へよろけ、Aの胸に手をついて体を預ける。'],
      contacts: [['a', 'Aの片手 → Bの手首', "one of Person A's hands holds Person B's wrist"], ['a', 'Aの反対の手 → Bの背中', "Person A's other hand catches Person B's back"], ['b', 'Bの片手 → Aの胸', "one of Person B's hands lands on Person A's chest"]],
      roleEn: ['the one pulling the other in and catching them', 'the one pulled off balance'],
      ts: ["Person A pulls Person B in by the wrist, and Person B stumbles forward into Person A's arms.", "Person A holds Person B's wrist and catches Person B's back with the other hand.", "Person B falls forward against Person A, one hand on Person A's chest."],
      sdxl: [['pulling', 'face-to-face'], ["holding another's wrist", "hand on another's back", "hand on another's chest"]],
      nai: { core: ['face-to-face'], actions: [['pulling', 'a']], a: ["holding another's wrist", "hand on another's back"], b: ['leaning forward', "hand on another's chest"], nl: 'one person pulls the other in by the wrist and catches them' },
      camera: STAND, angle: 'side', gazes: GF, keywords: ['引き寄せる', '手首', '受け止める', 'よろける', '支える', '腕の中'],
      suggest: { a: ex('confident_smile', 'look_down'), b: ex('surprised', 'look_up', 'gasp') }
    }),
    pose({
      id: 'pair_lift_cling', label: '持ち上げて、しがみつく', short: 'AがBを抱き上げ、Bが首に腕を回してしがみつく。',
      family: 'standing_leaning', category: 'carry', roles: ['抱き上げる側', 'しがみつく側'], rel: ['b_carried', 'none', 'face_to_face'],
      place: ['両腕でBの腰を抱えて持ち上げる。', '足が床から離れ、両腕をAの首へ回してしがみつく。'],
      contacts: [['a', 'Aの両腕 → Bの腰', "Person A's arms wrap around Person B's waist"], ['b', 'Bの両腕 → Aの首', "Person B's arms cling around Person A's neck"], ['b', 'Bの足 → 床から離れている', "Person B's feet are off the ground"]],
      roleEn: ['the one lifting', 'the one clinging on'],
      ts: ["Person A lifts Person B off the ground in a hug, and Person B clings to Person A.", "Person A holds Person B up with both arms around Person B's waist.", "Person B clings on with both arms around Person A's neck."],
      sdxl: [['lifting person', 'hug'], ['arms around waist', 'arms around neck', 'clinging']],
      nai: { core: ['hug'], actions: [['lifting person', 'a']], a: ['arms around waist'], b: ['arms around neck', 'clinging'], nl: 'one person lifts the other off the ground while the other clings to them' },
      camera: CARRY, gazes: { allowed: ['eyes_closed', 'mutual', 'both_viewer'], defaultId: 'eyes_closed' },
      keywords: ['しがみつく', '抱き上げる', '持ち上げる', '抱っこ', '飛びつく', '動き'],
      suggest: { a: ex('gentle_smile', 'closed'), b: ex('playful_smile', 'closed') }
    })
  ];

  // 既存7種のおすすめ表情（ボタンで空欄にだけ入れる。出力は変えない）
  var baseSuggest = {
    pair_over_supine: { a: ex('confident_smile', 'look_down'), b: ex('shy', 'look_up') },
    pair_close_from_behind: { a: ex('gentle_smile', 'look_at'), b: ex('shy', 'downcast') },
    pair_straddle_lying: { a: ex('playful_smile', 'look_down'), b: ex('surprised', 'look_up') },
    pair_lap_facing: { a: ex('shy', 'look_down'), b: ex('gentle_smile', 'look_up') },
    pair_lap_facing_away: { a: ex('slight_smile', 'side_glance'), b: ex('gentle_smile', 'look_at') },
    pair_hug_from_behind: { a: ex('gentle_smile', 'closed'), b: ex('shy', 'side_glance') },
    pair_leg_lift_support: { a: ex('confident_smile', 'look_at'), b: ex('playful_smile', 'look_at') }
  };
  (D.pairPoses || []).forEach(function (p) { if (!p.suggest) p.suggest = baseSuggest[p.id] || null; });
  D.pairPoses = (D.pairPoses || []).concat(extra);
})(window);
