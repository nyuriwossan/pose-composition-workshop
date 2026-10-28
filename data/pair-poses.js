(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // 二人用ポーズの「意味データ」。出力文はモデル別の欄に分け、出力処理（pair.js）とは分離する。
  // 人物Aは常に「動作する側（主導側）」、人物Bは「受ける側（相手側）」。
  // 成人キャラクター同士の親密な構図を、姿勢・向き・手足・接触点・カメラで指定する。露骨な性行為・性器の描写は扱わない。

  D.pairAngles = [
    { id: 'eye_level', labelJa: '目線の高さ', tsubaki: 'The camera is at eye level with the pair.', tags: ['eye level'] },
    { id: 'three_quarter', labelJa: '斜め前から', tsubaki: 'The camera views the pair from a three-quarter angle.', tags: ['three-quarter view'] },
    { id: 'side', labelJa: '真横から', tsubaki: 'The camera views the pair from the side, showing both bodies in profile.', tags: ['from side'] },
    { id: 'high', labelJa: '俯瞰（上から）', tsubaki: 'The camera looks down at the pair from a raised angle.', tags: ['from above'] },
    { id: 'low', labelJa: 'あおり（下から）', tsubaki: 'The camera looks up at the pair from a low angle.', tags: ['from below'] },
    { id: 'overhead', labelJa: '真上から', tsubaki: 'The camera looks straight down at the pair from directly overhead.', tags: ['from above', 'top-down view'] }
  ];
  D.pairShots = [
    { id: 'full_body', labelJa: '全身', tsubaki: 'Show both full bodies from head to toe.', tags: ['full body'] },
    { id: 'knee_up', labelJa: '膝上', tsubaki: 'Frame both figures from the knees up.', tags: ['cowboy shot'] },
    { id: 'upper_body', labelJa: '上半身', tsubaki: 'Frame both figures from the waist up.', tags: ['upper body'] },
    { id: 'close', labelJa: '顔まわり', tsubaki: 'Frame the pair closely around their faces and shoulders.', tags: ['close-up'] }
  ];
  // mode=on: 二人がその面の上にいる / mode=seat: 人物Bがその面に座る
  D.pairSurfaces = [
    { id: 'bed', labelJa: 'ベッド', en: 'a bed', onTag: 'on bed', seatTag: 'sitting on bed' },
    { id: 'floor', labelJa: '床', en: 'the floor', onTag: 'on floor', seatTag: 'sitting on floor' },
    { id: 'sofa', labelJa: 'ソファ', en: 'a sofa', onTag: 'on couch', seatTag: 'sitting on couch' },
    { id: 'chair', labelJa: '椅子', en: 'a chair', onTag: 'on chair', seatTag: 'sitting on chair' },
    { id: 'bench', labelJa: 'ベンチ', en: 'a bench', onTag: 'bench', seatTag: 'bench' }
  ];
  // {A}{B}{front}{back} は人物名へ置換する。tags.a/b/front/back は人物別、sdxl は一枚のタグ列用（矛盾しない語だけ）。
  D.pairGazes = [
    { id: 'mutual', labelJa: '見つめ合う', roles: { a: "is looking into {other}'s eyes", b: "is looking into {other}'s eyes" }, tsubaki: "{A} and {B} look into each other's eyes.", sdxl: ['eye contact'], nai: { base: ['eye contact'], a: ['looking at another'], b: ['looking at another'] } },
    { id: 'a_gazes_b', labelJa: 'AがBを見つめ、Bは視線を外す', roles: { a: 'is gazing at {other}', b: 'is glancing slightly away' }, tsubaki: '{A} gazes at {B}, and {B} glances slightly away.', sdxl: ['looking at another'], nai: { a: ['looking at another'], b: ['looking away'] } },
    { id: 'back_gazes_front', labelJa: '後ろの{back}が{front}の横顔を見る', roles: { back: "is looking at {other}'s profile", front: 'is looking ahead' }, tsubaki: "{back} looks at {front}'s profile, while {front} looks ahead.", sdxl: ['looking at another'], nai: { back: ['looking at another'], front: ['looking ahead'] } },
    { id: 'front_looks_back', labelJa: '前の{front}が振り返って{back}を見る', roles: { front: 'is turning their head to look back at {other}', back: 'is looking at {other}' }, tsubaki: '{front} turns their head to look back at {back}.', sdxl: ['looking back'], nai: { front: ['looking back', 'looking at another'], back: ['looking at another'] } },
    { id: 'both_viewer', labelJa: '二人ともこちらを見る', roles: { a: 'is looking toward the viewer', b: 'is looking toward the viewer' }, tsubaki: 'Both of them look toward the viewer.', sdxl: ['looking at viewer'], nai: { a: ['looking at viewer'], b: ['looking at viewer'] } },
    { id: 'eyes_closed', labelJa: '二人とも目を閉じる', roles: { a: 'has their eyes gently closed', b: 'has their eyes gently closed' }, tsubaki: 'Both of them have their eyes gently closed.', sdxl: ['closed eyes'], nai: { a: ['closed eyes'], b: ['closed eyes'] } }
  ];
  D.pairGenders = [
    { id: 'unspecified', labelJa: '指定なし', tsubaki: '', nai: '', count: '' },
    { id: 'male', labelJa: '男性', tsubaki: 'a man', nai: 'boy', count: 'boy' },
    { id: 'female', labelJa: '女性', tsubaki: 'a woman', nai: 'girl', count: 'girl' }
  ];
  // 人物の枠。出力エンジンはこの配列を順に回す（将来の三人以上の構図に備えた配列ベース）。
  D.pairPersonSlots = [
    { id: 'a', labelJa: '人物A', naiLabel: 'Character 1', tsubakiName: 'Person A' },
    { id: 'b', labelJa: '人物B', naiLabel: 'Character 2', tsubakiName: 'Person B' }
  ];
  D.pairRelationLabels = {
    vertical: { a_above: 'Aが上・Bが下', a_slightly_above: 'Aがやや上（Bの膝の上）', a_taller: 'Aの顔が高い位置', b_carried: 'BがAに抱え上げられている', level: '同じ高さ' },
    depth: { b_front: 'Bが前・Aが後ろ', a_front: 'Aが前・Bが後ろ', none: '前後差なし' },
    facing: { face_to_face: '向かい合う', same_direction: '同じ方向を向く', side_by_side: '横に並ぶ', side_on: '横から寄る' }
  };
  // 二人用ポーズのカテゴリ（依頼書の分類）。一人用プリセットの系統とは別に持つ。
  D.pairPoseCategories = { embrace: '抱擁・密着', seated: '座位・膝上', bed: 'ベッド・寝姿', standing: '立位・壁際', carry: '支え・抱き上げ' };
  D.pairRelationTsubaki = {
    vertical: { a_above: 'Person A is on top and Person B is underneath.', a_slightly_above: "Person A's head is slightly higher than Person B's head.", a_taller: "Person A's head is higher than Person B's head.", b_carried: "Person B's feet are off the ground, held up by Person A.", level: '' },
    depth: { b_front: 'Person B is in front and Person A is behind.', a_front: 'Person A is in front and Person B is behind.', none: '' }
  };

  function pose(def) {
    def.people = 2;
    def.collection = 'relationship';
    def.camera.shots = def.camera.shots || D.pairShots.map(function (s) { return s.id; });
    def.camera.blockedShots = def.camera.blockedShots || {};
    def.related = def.related || [];
    return def;
  }

  D.pairPoses = [
    pose({
      id: 'pair_over_supine',
      labelJa: '仰向けの相手に覆いかぶさる',
      shortJa: '仰向けのBに、Aが向かい合って上から覆いかぶさる。',
      poseFamily: 'lying_bed',
      category: 'bed',
      roles: { a: '上から覆いかぶさる側', b: '仰向けの側' },
      relation: { vertical: 'a_above', depth: 'none', facing: 'face_to_face' },
      placement: {
        a: '四つん這いに近い姿勢でBの上へ身を乗り出す。体重は自分の両手・両膝で支え、Bには乗せない。',
        b: '仰向けに寝て、顔をAへ向ける。両腕は頭の横で力を抜く。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの両手 → Bの頭の両脇の面', tsubaki: "Person A's hands are planted on the surface on either side of Person B's head" },
        { owner: 'a', ja: 'Aの両膝 → Bの腰の外側の面', tsubaki: "Person A's knees rest on the surface outside Person B's hips" },
        { owner: 'both', ja: '顔どうし → 近いが触れていない', tsubaki: 'their faces are close but not touching' }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one leaning over from above", b: "the one lying on their back underneath" },
          overview: 'Person B lies on their back, and Person A leans over Person B from above, face to face.',
          a: "Person A is braced on both hands and knees above Person B, keeping their own weight off Person B, with the torso angled down toward Person B's face.",
          b: 'Person B lies flat on their back beneath Person A, face turned up toward Person A, arms relaxed near the head.'
        },
        sdxl: { core: ['on back', 'leaning over', 'all fours'], placement: ['face-to-face', 'hands beside head'] },
        nai: {
          core: ['face-to-face'],
          actions: [{ tag: 'leaning over', source: 'a' }],
          a: ['all fours', 'hands beside head'],
          b: ['on back', 'lying'],
          nl: 'one person lies on their back while the other leans over them from above'
        }
      },
      camera: {
        angles: ['three_quarter', 'side', 'high', 'eye_level'],
        recommended: ['three_quarter', 'side'],
        defaultAngle: 'three_quarter',
        defaultShot: 'full_body',
        blocked: { low: '面より下から見上げる位置になり、BがAの身体に隠れます。', overhead: '真上からはAの背中でBがほぼ隠れます。' }
      },
      surface: { mode: 'on', allowed: ['bed', 'floor', 'sofa'], defaultId: 'bed' },
      gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['覆いかぶさる', 'おおいかぶさる', '上から', '見下ろす', '見上げる', '仰向け', 'ベッド', '床', '向かい合う', '顔が近い', '寝る', 'ベッド上で覆いかぶさる'],
      related: ['relationship_bed_supine_looking_up', 'relationship_bed_leaning_over_viewer']
    }),
    pose({
      id: 'pair_close_from_behind',
      labelJa: '背後から身を寄せる',
      shortJa: '前に立つBへ、Aが背後から身を寄せる。腕は回さない。',
      poseFamily: 'standing_leaning',
      category: 'embrace',
      roles: { a: '後ろから身を寄せる側', b: '前に立つ側' },
      relation: { vertical: 'level', depth: 'b_front', facing: 'same_direction' },
      placement: {
        a: 'Bの真後ろに立ち、上体をBの背中へ寄せる。腕は回さず、両手をBの二の腕に添える。顔はBの肩の近く。',
        b: '正面を向いて立ち、背中をAへ軽く預ける。両腕は自然に下ろす。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの両手 → Bの二の腕', tsubaki: "Person A's hands rest lightly on Person B's upper arms" },
        { owner: 'a', ja: 'Aの胸 → Bの背中のすぐ後ろ', tsubaki: "Person A's chest is close behind Person B's back" },
        { owner: 'a', ja: 'Aの顔 → Bの肩の近く', tsubaki: "Person A's face is near Person B's shoulder" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one standing behind", b: "the one standing in front" },
          overview: 'Both stand facing the same direction. Person B is in front, and Person A stands directly behind Person B, leaning in close without wrapping their arms around Person B.',
          a: "Person A stands behind Person B with the upper body drawn close to Person B's back.",
          b: 'Person B stands in front, facing forward, back lightly leaning toward Person A, arms relaxed at the sides.'
        },
        sdxl: { core: ['standing', 'behind another', 'close together'], placement: ["hands on another's arms", "face near another's shoulder"] },
        nai: {
          core: ['standing', 'close together'],
          actions: [{ tag: 'leaning on person', source: 'a' }],
          a: ['behind another', "hands on another's arms", "face near another's shoulder"],
          b: ['facing viewer', 'arms at sides'],
          nl: 'one person stands in front while the other leans close against their back from behind'
        }
      },
      camera: {
        angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'],
        recommended: ['eye_level', 'three_quarter'],
        defaultAngle: 'eye_level',
        defaultShot: 'knee_up',
        blocked: { overhead: '真上からは頭頂部ばかりになり、前後関係が読めません。' }
      },
      surface: { mode: 'none', allowed: [], defaultId: null },
      gazes: { allowed: ['back_gazes_front', 'front_looks_back', 'both_viewer', 'eyes_closed'], defaultId: 'back_gazes_front' },
      keywords: ['背後', '後ろから', '身を寄せる', '寄り添う', '肩越し', '立ち', '耳元', '近い', 'くっつく']
    }),
    pose({
      id: 'pair_straddle_lying',
      labelJa: '横になった相手に向かい合ってまたがる',
      shortJa: '仰向けのBの腰の上に、Aが向かい合って膝立ちでまたがる。',
      poseFamily: 'lying_bed',
      category: 'bed',
      roles: { a: 'またがる側', b: '横になる側' },
      relation: { vertical: 'a_above', depth: 'none', facing: 'face_to_face' },
      placement: {
        a: 'Bの腰の上に膝立ちでまたがり、体重は自分の両膝で支える。上体を起こし、両手をBの肩へ添える。',
        b: '仰向けに横になってAを見上げる。両手をAの前腕へ軽く添える。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの両膝 → Bの腰の両脇の面', tsubaki: "Person A's knees rest on the surface on either side of Person B's waist" },
        { owner: 'a', ja: 'Aの両手 → Bの肩', tsubaki: "Person A's hands rest on Person B's shoulders" },
        { owner: 'b', ja: 'Bの両手 → Aの前腕', tsubaki: "Person B's hands lightly hold Person A's forearms" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one kneeling astride on top", b: "the one lying on their back underneath" },
          overview: "Person B lies on their back, and Person A kneels astride Person B's waist, facing Person B.",
          a: 'Person A kneels upright astride Person B, supporting their own weight on their knees, with the torso leaning slightly forward.',
          b: 'Person B lies on their back beneath Person A, looking up at Person A.'
        },
        sdxl: { core: ['straddling', 'on back', 'kneeling'], placement: ['face-to-face', "hands on another's shoulders", "holding another's arm"] },
        nai: {
          core: ['face-to-face'],
          actions: [{ tag: 'straddling', source: 'a' }],
          a: ['kneeling', "hands on another's shoulders"],
          b: ['on back', 'lying', "holding another's arm"],
          nl: 'one person lies on their back while the other kneels astride their waist, facing them'
        }
      },
      camera: {
        angles: ['three_quarter', 'side', 'high', 'eye_level'],
        recommended: ['three_quarter', 'side'],
        defaultAngle: 'three_quarter',
        defaultShot: 'full_body',
        blocked: { low: '面より下から見上げる位置になり、Bが隠れます。', overhead: '真上からはAの身体でBがほぼ隠れます。' }
      },
      surface: { mode: 'on', allowed: ['bed', 'floor', 'sofa'], defaultId: 'bed' },
      gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['またがる', '跨る', '馬乗り', '上に乗る', '仰向け', '見上げる', '見下ろす', 'ベッド', '向かい合う', '膝立ち', '寝る'],
      related: ['relationship_bed_leaning_over_viewer']
    }),
    pose({
      id: 'pair_lap_facing',
      labelJa: '膝の上に向かい合って座る',
      shortJa: '座っているBの膝の上に、Aが向かい合って座る。',
      poseFamily: 'sitting_kneeling',
      category: 'seated',
      roles: { a: '膝に座る側', b: '座っている側' },
      relation: { vertical: 'a_slightly_above', depth: 'none', facing: 'face_to_face' },
      placement: {
        a: 'Bの太ももの上に向かい合って座り、両膝を座面のBの腰の両脇につく。両腕をBの肩から首の後ろへ回す。',
        b: '深く座ったまま、両手をAの腰に添える。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの両膝 → 座面（Bの腰の両脇）', tsubaki: "Person A's knees rest on the seat on either side of Person B's hips" },
        { owner: 'a', ja: 'Aの両腕 → Bの肩と首の後ろ', tsubaki: "Person A's arms rest around Person B's shoulders and neck" },
        { owner: 'b', ja: 'Bの両手 → Aの腰', tsubaki: "Person B's hands rest on Person A's waist" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one sitting on the other's lap", b: "the one seated underneath" },
          overview: "Person B is seated, and Person A sits on Person B's lap facing Person B.",
          a: "Person A sits on Person B's thighs facing them, arms around Person B's shoulders.",
          b: "Person B sits back on the seat, holding Person A's waist with both hands."
        },
        sdxl: { core: ['sitting on lap', 'face-to-face'], placement: ['arms around neck', "hands on another's waist"] },
        nai: {
          core: ['face-to-face'],
          actions: [{ tag: 'sitting on lap', source: 'a' }],
          a: ['arms around neck'],
          b: ['sitting', "hands on another's waist"],
          nl: 'one person sits on the lap of the other, facing them'
        }
      },
      camera: {
        angles: ['three_quarter', 'side', 'eye_level', 'high', 'low'],
        recommended: ['three_quarter', 'side'],
        defaultAngle: 'three_quarter',
        defaultShot: 'knee_up',
        blocked: { overhead: '真上からは頭と肩が重なり、座り方が読めません。' }
      },
      surface: { mode: 'seat', allowed: ['sofa', 'chair', 'bed', 'floor'], defaultId: 'sofa' },
      gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['膝の上', '膝に座る', '膝乗り', '向かい合う', '抱っこ', 'ソファ', '椅子', '首に腕を回す', '座る', '膝の上で抱きつく', '膝上で密着']
    }),
    pose({
      id: 'pair_lap_facing_away',
      labelJa: '膝の上に背中を向けて座る',
      shortJa: '座っているBの膝の上に、Aが背中を向けて（同じ向きで）座る。',
      poseFamily: 'sitting_kneeling',
      category: 'seated',
      roles: { a: '膝に座る側（前）', b: '座っている側（後ろ）' },
      relation: { vertical: 'a_slightly_above', depth: 'a_front', facing: 'same_direction' },
      placement: {
        a: 'Bの膝の上に、Bと同じ向きで座る。背中をBの胸へ預け、両手をBの前腕に重ねる。',
        b: '深く座り、後ろからAの腰へ両腕を軽く回す。顔はAの肩の近く。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの背中 → Bの胸', tsubaki: "Person A's back rests against Person B's chest" },
        { owner: 'b', ja: 'Bの両腕 → Aの腰に回す', tsubaki: "Person B's arms wrap loosely around Person A's waist" },
        { owner: 'a', ja: 'Aの両手 → Bの前腕', tsubaki: "Person A's hands rest on Person B's forearms" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one sitting in front on the other's lap", b: "the one seated behind" },
          overview: "Person B is seated, and Person A sits on Person B's lap facing the same direction, with Person A in front and Person B behind.",
          a: "Person A sits in Person B's lap with their back leaning against Person B's chest.",
          b: "Person B sits behind Person A, arms wrapped loosely around Person A's waist, face near Person A's shoulder."
        },
        sdxl: { core: ['sitting on lap', 'hug from behind'], placement: ['arms around waist', "hands on another's arms"] },
        nai: {
          core: ['sitting on lap'],
          actions: [{ tag: 'sitting on lap', source: 'a' }, { tag: 'hug from behind', source: 'b' }],
          a: ['leaning back', "hands on another's arms"],
          b: ['sitting', 'arms around waist'],
          nl: 'one person sits on the lap of the other, facing away from them, held from behind'
        }
      },
      camera: {
        angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'],
        recommended: ['eye_level', 'three_quarter'],
        defaultAngle: 'eye_level',
        defaultShot: 'knee_up',
        blocked: { overhead: '真上からは頭と肩が重なり、前後関係が読めません。' }
      },
      surface: { mode: 'seat', allowed: ['sofa', 'chair', 'bed', 'floor'], defaultId: 'sofa' },
      gazes: { allowed: ['back_gazes_front', 'front_looks_back', 'both_viewer', 'eyes_closed'], defaultId: 'back_gazes_front' },
      keywords: ['膝の上', '膝に座る', '背中を向けて', '後ろから抱く', 'バックハグ', '抱っこ', 'ソファ', '同じ向き', '座る', '背中を預けて膝上に座る', '甘える']
    }),
    pose({
      id: 'pair_hug_from_behind',
      labelJa: '背後から抱き寄せる',
      shortJa: '前に立つBを、Aが背後から両腕で抱き寄せる。',
      poseFamily: 'standing_leaning',
      category: 'embrace',
      roles: { a: '後ろから抱き寄せる側', b: '前に立つ側' },
      relation: { vertical: 'level', depth: 'b_front', facing: 'same_direction' },
      placement: {
        a: 'Bの真後ろに立ち、両腕をBの腰へ回して抱き寄せる。胸をBの背中へつけ、顎をBの肩へのせる。',
        b: '正面を向いて立ち、両手をAの前腕へ添える。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの両腕 → Bの腰に回す', tsubaki: "Person A's arms wrap around Person B's waist" },
        { owner: 'a', ja: 'Aの胸 → Bの背中', tsubaki: "Person A's chest is pressed against Person B's back" },
        { owner: 'a', ja: 'Aの顎 → Bの肩', tsubaki: "Person A's chin rests on Person B's shoulder" },
        { owner: 'b', ja: 'Bの両手 → Aの前腕', tsubaki: "Person B's hands rest on Person A's forearms" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one hugging from behind", b: "the one standing in front" },
          overview: 'Both stand facing the same direction. Person B is in front, and Person A hugs Person B from behind, pulling them close.',
          a: 'Person A stands directly behind Person B with both arms wrapped around Person B.',
          b: 'Person B stands in front, facing forward.'
        },
        sdxl: { core: ['hug from behind', 'standing'], placement: ['arms around waist', 'chin on shoulder', "hands on another's arms"] },
        nai: {
          core: ['standing'],
          actions: [{ tag: 'hug from behind', source: 'a' }],
          a: ['arms around waist', 'chin on shoulder'],
          b: ["hands on another's arms", 'facing viewer'],
          nl: 'one person hugs the other from behind while both stand facing the same way'
        }
      },
      camera: {
        angles: ['eye_level', 'three_quarter', 'side', 'high', 'low'],
        recommended: ['eye_level', 'three_quarter'],
        defaultAngle: 'eye_level',
        defaultShot: 'knee_up',
        blocked: { overhead: '真上からは頭頂部ばかりになり、抱き寄せる腕が読めません。' }
      },
      surface: { mode: 'none', allowed: [], defaultId: null },
      gazes: { allowed: ['back_gazes_front', 'front_looks_back', 'both_viewer', 'eyes_closed'], defaultId: 'back_gazes_front' },
      keywords: ['バックハグ', '後ろから抱きしめる', '抱き寄せる', '抱きしめる', '背後', '立ち', 'ハグ', '肩に顎', '背後から抱きしめる', '後ろから抱く']
    }),
    pose({
      id: 'pair_leg_lift_support',
      labelJa: '片脚を上げ、相手が支える',
      shortJa: '向かい合って立ち、Bが片脚を上げ、Aがその脚と背中を支える。',
      poseFamily: 'standing_leaning',
      category: 'standing',
      roles: { a: '支える側', b: '片脚を上げる側' },
      relation: { vertical: 'level', depth: 'none', facing: 'face_to_face' },
      placement: {
        a: '両足で立ち、片手でBの上げた脚を膝の下から支え、反対の手をBの腰の後ろへ回す。',
        b: '片脚で立ち、もう片方の脚を膝を曲げてAの腰の高さまで上げる。両手をAの肩へ置く。'
      },
      contacts: [
        { owner: 'a', ja: 'Aの片手 → Bの上げた脚（膝の下）', tsubaki: "one of Person A's hands supports Person B's raised leg under the knee" },
        { owner: 'a', ja: 'Aの反対の手 → Bの腰の後ろ', tsubaki: "Person A's other hand rests on Person B's lower back" },
        { owner: 'b', ja: 'Bの両手 → Aの肩', tsubaki: "Person B's hands rest on Person A's shoulders" }
      ],
      models: {
        tsubaki: {
          roleEn: { a: "the one giving support", b: "the one raising a leg" },
          overview: 'Person A and Person B stand facing each other. Person B balances on one leg and raises the other leg, and Person A supports the raised leg.',
          a: 'Person A stands firmly on both feet.',
          b: "Person B stands on one leg, with the other leg bent at the knee and lifted to about Person A's hip height."
        },
        sdxl: { core: ['standing on one leg', 'leg up', 'face-to-face'], placement: ["holding another's leg", "hand on another's back", "hands on another's shoulders"] },
        nai: {
          core: ['face-to-face'],
          actions: [],
          a: ['standing', "holding another's leg", "hand on another's back"],
          b: ['standing on one leg', 'leg up', "hands on another's shoulders"],
          nl: 'the two stand face to face, one balancing on one leg with the other leg raised while the partner supports the raised leg'
        }
      },
      camera: {
        angles: ['side', 'three_quarter', 'eye_level', 'low', 'high'],
        recommended: ['side', 'three_quarter'],
        defaultAngle: 'side',
        defaultShot: 'full_body',
        shots: ['full_body', 'knee_up'],
        blocked: { overhead: '真上からは上げた脚の高さが読めません。' },
        blockedShots: { upper_body: '上げた脚と支える手が画角外になります。', close: '上げた脚と支える手が画角外になります。' }
      },
      surface: { mode: 'none', allowed: [], defaultId: null },
      gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer', 'eyes_closed'], defaultId: 'mutual' },
      keywords: ['片脚', '片足', '脚を上げる', '足を上げる', '支える', 'ダンス', '向かい合う', '立ち', '抱き寄せる', 'リフト']
    })
  ];
})(window);
