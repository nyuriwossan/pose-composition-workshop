(function (global) {
  'use strict';
  /*
   * プリクラ・フォトブース 一人用25件（2026-10-30）
   *
   * 出典：Manus調査 purikura_solo_candidates.json（PK-S001〜PK-S025）と「Claude実装指示書_プリクラ54ポーズ_20261030」。
   * 形式はモード系（data/editorial.js・mode-editorial.js・dance.js）と同じで、pose.editorialPose で選ぶ。line: 'purikura'。
   * - Manusの english_prompt は丸ごと使わず、胴（torso）と腕（arms）に分けて組み直した。視線・顔の向き・カメラの高さは
   *   既存の項目（gaze・head.yaw/pitch・camera.elevation）でプリセットに入れ、二重に出さない。
   * - 英語に左右・否定語・性別・外見・表情・服装・背景・照明・画風・品質・撮影機材（カメラ／スマホ）の語は入れない。
   * - short_tags（Manus）はDanbooru未確認のため出力に使わない。tags.verified は danbooru.csv と完全一致した語だけ。
   * - 画像生成での再現性は未確認。難度・優先度はManusの推定値。
   */
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // Danbooruタグ一覧（a1111-sd-webui-tagcomplete の danbooru.csv、2026-10-30取得）の投稿数
  D.purikuraVerifiedTags = {
    'v': 151368, 'double v': 27325, 'v over eye': 6428, 'paw pose': 27190, 'heart hands': 21949, 'hand on own cheek': 24290,
    'covering own mouth': 22956, 'hand in own hair': 34029, 'adjusting hair': 20766, 'finger frame': 1368,
    'holding own arm': 6505, 'reaching towards viewer': 21744, 'outstretched hand': 24080, 'foreshortening': 53286, 'arms up': 188117,
    'head tilt': 139388, 'leaning forward': 115911, 'hand up': 350006, 'hands up': 180440
  };

  // 4分類（ポーズ系統として絞り込みに出す）
  D.purikuraSoloGroups = {
    purikura_classic: 'プリクラ：王道・顔まわり手形',
    purikura_sweet: 'プリクラ：近接・甘め',
    purikura_mode: 'プリクラ：モード・遠近',
    purikura_play: 'プリクラ：遊び・構図変化'
  };
  var GROUP_BY_JA = { '王道・顔まわり手形': 'purikura_classic', '近接・甘め': 'purikura_sweet', 'モード・遠近': 'purikura_mode', '遊び・構図変化': 'purikura_play' };

  // 腕（図）：at は図の目印（head・chin・mouth・overhead・chest・belly・hip・shoulder）、hand は手の形の記号
  function relaxed(i) { return { at: 'hip', dx: i ? -13 : 13, dy: 12, bend: i ? -1 : 1 }; }
  var BASE_FIG = { axes: false, cropHands: true };
  function fig(extra) { return Object.assign({}, BASE_FIG, extra); }
  var STAND = ['standing'];

  var poses = [
    // ================= 王道・顔まわり手形 =================
    {
      id: 'purikura_s001', sourceId: 'PK-S001', group: '王道・顔まわり手形', priority: 'P1', difficultyJa: '低',
      labelJa: '片目の外側に片手でピース', shortJa: '片手のVを片目の外側（目尻の横）に浮かせ、頭だけを反対側へごく浅く傾ける。両目は見せ、反対の手は低く下ろす。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: 'Vの指先と手首、両目が入ること（肩上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '肩は水平寄りのまま', head: 'Vと反対の側へ頭だけ少し傾ける', armA: '片手の人差し指と中指でVを作り、目尻の外側に浮かせる（指は目にかけない）', armB: '反対の腕は体の横へ低く下ろす', support: '両足で立つ', depth: '手はほぼ顔と同じ面', hands: '片手のV' },
      prompt: {
        torso: { compact: ['shoulders level', 'head tilted slightly away from the raised side'], detailed: ['The shoulders stay level while the head tilts slightly away from the raised side.'] },
        arms: { compact: ['one hand making a V sign beside the outer corner of one eye', 'both eyes kept open beside the fingers', 'the other arm lowered'], detailed: ['One hand makes a V sign beside the outer corner of one eye, the fingers kept clear of the eye.', 'The other arm hangs low at the side.'] }
      },
      tags: { torso: { verified: ['head tilt'], phrases: ['level shoulders'] }, arms: { verified: ['v over eye'], phrases: ['V beside outer eye corner', 'other arm lowered'] } },
      figure: fig({ headTilt: -7, headShift: -1, arms: [{ at: 'head', dx: 11, dy: 2, bend: 1, elbowOut: 1.3, hand: 'v', elbowHint: { at: 'shoulder', dx: 7, dy: 16 } }, relaxed(1)] }),
      keywords: ['ピース', 'V', '片手', '目元', '目尻', '首かしげ']
    },
    {
      id: 'purikura_s002', sourceId: 'PK-S002', group: '王道・顔まわり手形', priority: 'P1', difficultyJa: '中',
      labelJa: '頬の外側でダブルピース', shortJa: '両手のVを左右の頬骨の外側へ分けて浮かせる、正面の対称構図。両ひじを外へ軽く開き、顔の中央を空ける。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '二つのVの指先と手首、顔全体が入ること（肩上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向け、肩は水平', head: 'まっすぐ起こす', armA: '片手のVを同じ側の頬骨の外側に浮かせる', armB: '反対の手のVも、同じ側の頬骨の外側に浮かせる（顔の前で交差させない）', support: '両足で立つ', depth: '両手は顔と同じ面', hands: '両手のV（頬の高さ）' },
      prompt: {
        torso: { compact: ['chest square to the viewer', 'head held upright'], detailed: ['The chest faces the viewer squarely and the head is held upright.'] },
        arms: { compact: ['both hands making V signs beside the outer cheeks', 'elbows opened outward', 'open space kept around the face'], detailed: ['Both hands make V signs beside the outer cheeks, each hand on its own side, the elbows opened outward.', 'Open space stays around the face between the two hands.'] }
      },
      tags: { torso: { verified: [], phrases: ['chest facing the viewer'] }, arms: { verified: ['double v'], phrases: ['V signs beside the outer cheeks', 'elbows opened outward'] } },
      figure: fig({ arms: [{ at: 'head', dx: 14, dy: 5, bend: 1, elbowOut: 1.6, hand: 'v', elbowHint: { at: 'shoulder', dx: 11, dy: 13 } }, { at: 'head', dx: -14, dy: 5, bend: -1, elbowOut: 1.6, hand: 'v', elbowHint: { at: 'shoulder', dx: -11, dy: 13 } }] }),
      keywords: ['ダブルピース', 'Wピース', '両手', 'ピース', '頬', '対称']
    },
    {
      id: 'purikura_s003', sourceId: 'PK-S003', group: '王道・顔まわり手形', priority: 'P2', difficultyJa: '中',
      labelJa: '頭上とあご下のVで顔を縦に囲む', shortJa: '片手のVを頭の上、もう片手のVをあごの下に置き、顔を上下から縦に囲む。肩はすくめない。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '頭上とあご下の二つのVが完全に入ること（頭上に余白）',
      body: { pelvis: '正面に向けて立つ', ribcage: '肩をすくめず、水平に保つ', head: 'まっすぐ起こす', armA: '片手のVを頭頂の少し上に立てる', armB: '反対の手のVをあごのすぐ下に置く（口の前へ上げない）', support: '両足で立つ', depth: '両手は顔と同じ面', hands: '上下二つのV' },
      prompt: {
        torso: { compact: ['shoulders relaxed and level', 'head held straight'], detailed: ['The shoulders stay relaxed and level, with the head held straight.'] },
        arms: { compact: ['one hand making a V sign just above the head', 'the other hand making a V sign just below the jaw', 'the face framed between the two V signs'], detailed: ['One hand makes a V sign just above the head, and the other makes a V sign just below the jaw.', 'The face sits fully visible between the two V signs.'] }
      },
      tags: { torso: { verified: [], phrases: ['relaxed level shoulders'] }, arms: { verified: ['v'], phrases: ['V sign above the head', 'V sign below the jaw', 'face framed vertically'] } },
      composition: { negativeSpace: 'above' },
      figure: fig({ arms: [{ at: 'overhead', dx: 5, dy: 4, bend: 1, hintY: -14, elbowOut: 1.5, hand: 'v' }, { at: 'chin', dx: -3, dy: 5, bend: -1, elbowOut: 1.2, hand: 'v', elbowHint: { at: 'shoulder', dx: -3, dy: 18 } }] }),
      keywords: ['ピース', 'V', '上下', '頭上', 'あご', '縦']
    },
    {
      id: 'purikura_s004', sourceId: 'PK-S004', group: '王道・顔まわり手形', priority: 'P1', difficultyJa: '中',
      labelJa: '頭の上のダブルピースで耳の形', shortJa: '二つのVをこめかみの少し外かつ上に立て、耳のようなシルエットにする。頭頂の上に余白を残す。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '頭頂と両方のVの先端が切れないこと（頭上に余白）',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向ける', head: 'まっすぐ起こす', armA: '片手のVを同じ側のこめかみの少し外かつ上に立てる', armB: '反対の手のVも同じ側のこめかみの上に立てる（頭頂の真上で重ねない）', support: '両足で立つ', depth: '両手は頭と同じ面', hands: '両手のV（頭の上・耳の位置）' },
      prompt: {
        torso: { compact: ['chest facing the viewer', 'head upright and centered'], detailed: ['The chest faces the viewer and the head is upright and centered.'] },
        arms: { compact: ['both hands making V signs above the temples like upright ears', 'forearms raised on each side of the head', 'space kept above the top of the head'], detailed: ['Both hands make V signs above the temples like upright ears, the forearms raised on each side of the head.', 'Space is kept above the top of the head.'] }
      },
      tags: { torso: { verified: [], phrases: ['head upright and centered'] }, arms: { verified: ['double v', 'arms up'], phrases: ['V signs above the temples', 'upright ear shapes'] } },
      composition: { negativeSpace: 'above' },
      figure: fig({ arms: [{ at: 'head', dx: 9, dy: -14, bend: 1, hintY: -12, elbowOut: 1.7, hand: 'v' }, { at: 'head', dx: -9, dy: -14, bend: -1, hintY: -12, elbowOut: 1.7, hand: 'v' }] }),
      keywords: ['ピース', '耳', 'うさ耳', '頭上', 'ダブルピース', 'こめかみ']
    },
    {
      id: 'purikura_s005', sourceId: 'PK-S005', group: '王道・顔まわり手形', priority: 'P2', difficultyJa: '中',
      labelJa: '両手のゆるい猫の手', shortJa: 'ゆるく曲げた両手を、口角の外かつ少し下に左右対称で浮かせる。ひじは外へ軽く開き、顔の輪郭を両側に残す。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '両手の全部の指と顔の輪郭が入ること（肩上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向ける', head: 'まっすぐ起こす', armA: '片手の指をゆるく曲げ、同じ側の口角の外かつ少し下に浮かせる', armB: '反対の手も同じ形で、同じ側の口角の外に浮かせる（拳にしない）', support: '両足で立つ', depth: '両手は顔と同じ面', hands: '両手の猫の手（左右対称）' },
      prompt: {
        torso: { compact: ['torso square to the viewer', 'head level'], detailed: ['The torso faces the viewer squarely with the head level.'] },
        arms: { compact: ['both hands held as relaxed curved paws beside the lower cheeks', 'fingers loosely bent with gaps between them', 'symmetrical placement on each side of the face'], detailed: ['Both hands are held as relaxed curved paws beside the lower cheeks, the fingers loosely bent with small gaps between them.', 'The two paws sit symmetrically on each side of the face.'] }
      },
      tags: { torso: { verified: [], phrases: ['torso square to the viewer'] }, arms: { verified: ['paw pose'], phrases: ['paws beside lower cheeks', 'loosely bent fingers', 'symmetrical paws'] } },
      figure: fig({ arms: [{ at: 'head', dx: 11, dy: 8, bend: 1, elbowOut: 1.5, hand: 'paw', elbowHint: { at: 'shoulder', dx: 9, dy: 16 } }, { at: 'head', dx: -11, dy: 8, bend: -1, elbowOut: 1.5, hand: 'paw', elbowHint: { at: 'shoulder', dx: -9, dy: 16 } }] }),
      keywords: ['猫', 'ねこ', '猫の手', 'にゃん', '両手', '前足']
    },
    {
      id: 'purikura_s006', sourceId: 'PK-S006', group: '王道・顔まわり手形', priority: 'P1', difficultyJa: '低',
      labelJa: '両手のひらをあごの下にそろえる', shortJa: '上向きの両手のひらをあごのすぐ下にそろえ、顔を上に乗せたように見せる。ひじは外へ穏やかに開く。',
      minShot: 'bust_shot', recommendedShot: 'bust_shot', minNoteJa: '顔・両手のひら・外へ開いたひじが入ること（胸上以上）',
      body: { pelvis: '正面に向ける（立っても座ってもよい）', ribcage: '胸を正面に向ける', head: 'まっすぐ起こし、手のひらに押し付けない', armA: '片手のひらを上に向け、あごのすぐ下に置く', armB: '反対の手のひらも上に向けて並べ、手首どうしを近づける', support: '両足、または座面', depth: '両手はあごのすぐ前', hands: '上向きの両手のひら（あご下）' },
      prompt: {
        torso: { compact: ['chest facing the viewer', 'chin held level'], detailed: ['The chest faces the viewer and the chin is held level.'] },
        arms: { compact: ['both open palms turned upward directly below the chin', 'wrists close together', 'elbows spread gently outward'], detailed: ['Both open palms turn upward directly below the chin with the wrists close together, as if presenting the face.', 'The elbows spread gently outward.'] }
      },
      tags: { torso: { verified: [], phrases: ['chin held level'] }, arms: { verified: [], phrases: ['palms upward under the chin', 'wrists close together'] } },
      figure: fig({ arms: [{ at: 'chin', dx: 3, dy: 4, bend: 1, elbowOut: 1.7, hand: 'palm' }, { at: 'chin', dx: -3, dy: 4, bend: -1, elbowOut: 1.7, hand: 'palm' }] }),
      keywords: ['あご', '手のひら', '花', 'お花', '両手', '顔を乗せる']
    },
    {
      id: 'purikura_s007', sourceId: 'PK-S007', group: '王道・顔まわり手形', priority: 'P2', difficultyJa: '中',
      labelJa: 'あごの下に片手でピース', shortJa: '片手のVをあごの輪郭のすぐ下に沿わせ、頭はVと反対へ少し傾ける。反対の手は低く下ろす。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: 'Vの手首と指先、あごの輪郭が入ること（肩上以上）',
      body: { pelvis: '正面か、ごく浅い斜め', ribcage: '胸は正面寄り', head: 'Vと反対の側へ頭を少し傾ける', armA: '片手のVを、あごの輪郭のすぐ下に沿わせる（口の前を横切らない）', armB: '反対の腕は体の横へ低く下ろす', support: '両足で立つ', depth: '手はあごのすぐ前', hands: '片手のV（あごの下）' },
      prompt: {
        torso: { compact: ['torso turned very slightly to one side', 'head tilted slightly away from the raised side'], detailed: ['The torso turns very slightly to one side while the head tilts slightly away from the raised side.'] },
        arms: { compact: ['one hand making a V sign along the jawline', 'two fingers resting just beneath the jaw', 'the other hand low at the side'], detailed: ['One hand makes a V sign along the jawline, the two fingers resting just beneath the jaw.', 'The other hand stays low at the side.'] }
      },
      tags: { torso: { verified: ['head tilt'], phrases: ['torso turned slightly'] }, arms: { verified: ['v'], phrases: ['V sign along the jawline', 'fingers beneath the jaw'] } },
      figure: fig({ headTilt: -7, arms: [{ at: 'chin', dx: 5, dy: 3, bend: 1, elbowOut: 1.2, hand: 'v', elbowHint: { at: 'shoulder', dx: 4, dy: 18 } }, relaxed(1)] }),
      keywords: ['ピース', 'V', 'あご', '片手', '輪郭', '小顔']
    },

    // ================= 近接・甘め =================
    {
      id: 'purikura_s008', sourceId: 'PK-S008', group: '近接・甘め', priority: 'P1', difficultyJa: '中',
      labelJa: '口元を軽く隠して上目づかい', shortJa: '片手を口元の下半分に軽く添え、あごを引いて目線だけを上へ送る近い構図。目は隠さない。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '両目と口元の手が切れないこと（肩上以上）',
      body: { pelvis: '正面寄り', ribcage: '胸を正面寄りにして、顔を少し近づける', head: 'あごを少し引き、首をわずかに傾ける', armA: '片手を口元の下半分に軽く添える（目は隠さない）', armB: '反対の手は低く下ろす', support: '両足で立つ', depth: '口元の手が顔のすぐ前', hands: '口元に添える片手' },
      prompt: {
        torso: { compact: ['upper body leaning in slightly', 'neck tilted gently'], detailed: ['The upper body leans in slightly and the neck tilts gently.'] },
        arms: { compact: ['one hand lightly covering the lower half of the mouth', 'the eyes fully uncovered above the hand', 'the other hand kept low'], detailed: ['One hand lightly covers the lower half of the mouth, leaving the eyes fully uncovered above it.', 'The other hand is kept low.'] }
      },
      tags: { torso: { verified: [], phrases: ['upper body leaning in'] }, arms: { verified: ['covering own mouth'], phrases: ['hand over lower mouth', 'eyes uncovered'] } },
      preset: { head: { yaw: 'toward_camera', pitch: 'lowered' }, gaze: { target: 'viewer', direction: 'upward', eyes: 'open' }, camera: { elevation: 'slightly_high' } },
      figure: fig({ headTilt: 5, arms: [{ at: 'mouth', dx: 2, dy: 1, bend: 1, elbowOut: 1.1, hand: 'palm', elbowHint: { at: 'shoulder', dx: 3, dy: 18 } }, relaxed(1)] }),
      keywords: ['口元', '隠す', '上目遣い', '上目づかい', 'あざとい', '甘め']
    },
    {
      id: 'purikura_s009', sourceId: 'PK-S009', group: '近接・甘め', priority: 'P2', difficultyJa: '中',
      labelJa: '頬骨の外に小さな手のフレーム', shortJa: '開いた片手を小さなC字の弧にして、頬骨の外側を触れずに縁取る。首は手と反対へわずかに傾ける。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '手首から指先までが入ること（肩上以上）',
      body: { pelvis: '浅い斜め前（30〜45度）', ribcage: '胸を浅く斜めにする', head: '手と反対の側へ首をわずかに傾ける', armA: '片手を小さなC字に開き、頬骨の外側に浮かせる（触れない）', armB: '反対の手は低く下ろす', support: '両足で立つ', depth: '手は顔のすぐ横', hands: 'C字の片手フレーム' },
      prompt: {
        torso: { compact: ['torso angled slightly to one side', 'head tilted slightly away from the raised side'], detailed: ['The torso angles slightly to one side and the head tilts slightly away from the raised side.'] },
        arms: { compact: ['one open hand curved into a small C-shaped frame beside the outer cheekbone', 'a small gap between the hand and the cheek', 'the other hand low'], detailed: ['One open hand curves into a small C-shaped frame beside the outer cheekbone, a small gap kept between the hand and the cheek.', 'The other hand rests low.'] }
      },
      tags: { torso: { verified: ['head tilt'], phrases: ['torso angled to one side'] }, arms: { verified: [], phrases: ['C-shaped hand frame', 'hand beside cheekbone', 'gap between hand and cheek'] } },
      figure: fig({ narrow: 0.84, headTilt: -6, arms: [{ at: 'head', dx: 12, dy: 2, bend: 1, elbowOut: 1.3, hand: 'c', elbowHint: { at: 'shoulder', dx: 7, dy: 16 } }, relaxed(1)] }),
      keywords: ['頬', 'フレーム', '小顔', 'C字', '片手', '甘め']
    },
    {
      id: 'purikura_s010', sourceId: 'PK-S010', group: '近接・甘め', priority: 'P2', difficultyJa: '中',
      labelJa: 'あごの横にやわらかいグー', shortJa: '親指と人差し指を少し開いた小さなグーを、あごの外縁の近くに置く。顔を手の側へ少し寄せる。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '手首と指先が切れないこと（肩上以上）',
      body: { pelvis: '浅い斜め前', ribcage: '胸を浅く斜めにする', head: '手の側へ顔を少し寄せ、首を軽く傾ける', armA: '片手をゆるいグーにし、親指と人差し指だけ浅く開いて、あごの外縁の近くに置く（頬を押さない）', armB: '反対の手は低く下ろす', support: '両足で立つ', depth: '手はあごのすぐ横', hands: 'やわらかいグー' },
      prompt: {
        torso: { compact: ['torso angled slightly', 'head tilted toward the raised side'], detailed: ['The torso angles slightly and the head tilts toward the raised side.'] },
        arms: { compact: ['one softly closed hand beside the jawline', 'thumb and index finger slightly parted', 'the other hand low'], detailed: ['One softly closed hand rests beside the jawline with the thumb and index finger slightly parted.', 'The other hand stays low.'] }
      },
      tags: { torso: { verified: ['head tilt'], phrases: ['head tilted toward the hand'] }, arms: { verified: [], phrases: ['soft fist beside the jawline', 'thumb and index slightly parted'] } },
      figure: fig({ narrow: 0.84, headTilt: 6, arms: [{ at: 'chin', dx: 8, dy: -1, bend: 1, elbowOut: 1.1, hand: 'fist', elbowHint: { at: 'shoulder', dx: 5, dy: 17 } }, relaxed(1)] }),
      keywords: ['グー', 'こぶし', 'あご', '片手', '甘め', 'ぶりっこ']
    },
    {
      id: 'purikura_s011', sourceId: 'PK-S011', group: '近接・甘め', priority: 'P2', difficultyJa: '低',
      labelJa: '片手の猫の手で上目づかい', shortJa: '一手だけのゆるい猫の手を頬の外側に置き、あごを引いて目線だけを上げる。頭は手と反対へわずかに倒す。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '手首と全部の指が切れないこと（肩上以上）',
      body: { pelvis: '正面寄り', ribcage: '胸を正面寄りにする', head: 'あごを引き、手と反対の側へ頭をわずかに倒す', armA: '片手の指をゆるく曲げて内向きの猫の手にし、頬の外側に浮かせる', armB: '反対の手は低く下ろす', support: '両足で立つ', depth: '手は顔のすぐ横', hands: '片手の猫の手' },
      prompt: {
        torso: { compact: ['torso facing nearly front', 'head tipped slightly away from the raised side'], detailed: ['The torso faces nearly front and the head tips slightly away from the raised side.'] },
        arms: { compact: ['one hand held as a relaxed curved paw beside one cheek', 'wrist turned slightly inward', 'the other hand low'], detailed: ['One hand is held as a relaxed curved paw beside one cheek, the wrist turned slightly inward.', 'The other hand stays low.'] }
      },
      tags: { torso: { verified: [], phrases: ['torso nearly front'] }, arms: { verified: ['paw pose'], phrases: ['single paw beside cheek', 'wrist turned inward'] } },
      preset: { head: { yaw: 'toward_camera', pitch: 'lowered' }, gaze: { target: 'viewer', direction: 'upward', eyes: 'open' }, camera: { elevation: 'slightly_high' } },
      figure: fig({ headTilt: -6, arms: [{ at: 'head', dx: 11, dy: 5, bend: 1, elbowOut: 1.3, hand: 'paw', elbowHint: { at: 'shoulder', dx: 7, dy: 16 } }, relaxed(1)] }),
      keywords: ['猫', 'ねこ', '猫の手', '片手', '上目遣い', '上目づかい']
    },

    // ================= モード・遠近 =================
    {
      id: 'purikura_s012', sourceId: 'PK-S012', group: 'モード・遠近', priority: 'P1', difficultyJa: '中',
      labelJa: '髪の生え際に手を入れ、目だけ戻す', shortJa: '側頭部に片手を浅く入れ、胴は斜めのまま顔を少し外へ向け、視線だけを正面へ戻す。反対の腕は下ろす。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: '手首・両目・髪の生え際の手が入ること（上半身以上）',
      body: { pelvis: '斜めに向けて立つ', ribcage: '胸を斜めにし、顔だけを少し外へ', head: '顔を少し外へ向け、目だけを正面へ戻す', armA: '片手を自分の側頭部の髪の生え際へ浅く入れる（顔へ滑らせない）', armB: '反対の腕は体の横へ下ろす', support: '両足で立つ', depth: '上げた腕のひじがやや手前', hands: '側頭部に添える片手' },
      prompt: {
        torso: { compact: ['torso in a three-quarter stance', 'face fully visible'], detailed: ['The torso holds a three-quarter stance with the face fully visible.'] },
        arms: { compact: ['one hand lightly tucked into the hairline at the temple', 'that elbow raised to the side', 'the other arm relaxed down'], detailed: ['One hand tucks lightly into the hairline at the temple, the elbow raised to the side.', 'The other arm is relaxed down.'] }
      },
      tags: { torso: { verified: [], phrases: ['three-quarter stance'] }, arms: { verified: ['hand in own hair'], phrases: ['hand at the temple hairline', 'raised elbow to the side'] } },
      preset: { head: { yaw: 'slightly_away', pitch: 'neutral' }, gaze: { target: 'viewer', direction: 'direct', eyes: 'open' } },
      figure: fig({ narrow: 0.78, face: 'three_quarter', headShift: -2, arms: [{ at: 'head', dx: 8, dy: -6, bend: 1, hintY: -10, elbowOut: 1.5, hand: 'palm' }, relaxed(1)] }),
      keywords: ['髪', '髪をかき上げる', 'こめかみ', '目線', 'モード', 'かっこいい']
    },
    {
      id: 'purikura_s013', sourceId: 'PK-S013', group: 'モード・遠近', priority: 'P2', difficultyJa: '中',
      labelJa: '髪を後ろへ払う軽い前傾', shortJa: '片手で髪の生え際を後ろへ払い、反対の前腕を下腹部の前に低く通して、軽い前傾を安定させる。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: '髪際の手・低い前腕・両目が入ること（上半身以上）',
      body: { pelvis: '浅い斜め前', ribcage: '股関節から小さく前傾する（深くしない）', head: '顔は正面寄りで、目は前へ', armA: '片手で髪の生え際を後ろへ払う（目と頬の外側に留める）', armB: '反対の前腕を下腹部の前に低く通す', support: '両足で立つ', depth: '低い前腕が手前', hands: '髪を払う片手' },
      prompt: {
        torso: { compact: ['slight forward lean from the hips', 'torso angled three-quarters', 'face unobstructed'], detailed: ['The body leans slightly forward from the hips with the torso angled three-quarters.', 'The face stays unobstructed.'] },
        arms: { compact: ['one hand brushing backward along the hairline', 'the other forearm held low across the lower torso'], detailed: ['One hand brushes backward along the hairline.', 'The other forearm is held low across the lower torso.'] }
      },
      tags: { torso: { verified: ['leaning forward'], phrases: ['slight lean from the hips'] }, arms: { verified: ['adjusting hair'], phrases: ['hand brushing back the hairline', 'low forearm across the torso'] } },
      figure: fig({ narrow: 0.8, fold: true, face: 'three_quarter', arms: [{ at: 'head', dx: 5, dy: -8, bend: 1, hintY: -12, elbowOut: 1.6, hand: 'palm' }, { at: 'belly', dx: 7, dy: 2, bend: -1 }] }),
      keywords: ['髪', '髪を払う', '前傾', 'モード', 'かっこいい', '前腕']
    },
    {
      id: 'purikura_s014', sourceId: 'PK-S014', group: 'モード・遠近', priority: 'P1', difficultyJa: '中',
      labelJa: '目尻の外にゆるいL字フレーム', shortJa: '親指と人差し指だけの小さなL字を、目尻の外側に触れずに置く。胴は斜め、顔は少し正面へ戻す。反対の腕は下ろす。',
      minShot: 'upper_body', recommendedShot: 'upper_body', minNoteJa: 'L字・顔・手首が入ること（上半身以上）',
      body: { pelvis: '斜めに向けて立つ', ribcage: '胸は斜め、顔は少し正面へ戻す', head: '顔を少し正面へ戻し、軽く傾ける', armA: '片手でゆるいL字（親指と人差し指）を作り、目尻の外側に触れずに置く', armB: '反対の腕は体の横へ下ろす', support: '両足で立つ', depth: '手は顔のすぐ横', hands: 'L字（親指と人差し指）' },
      prompt: {
        torso: { compact: ['torso in a three-quarter stance', 'head angled slightly back toward the front'], detailed: ['The torso holds a three-quarter stance while the head angles slightly back toward the front.'] },
        arms: { compact: ['one hand forming a loose L shape with the thumb and index finger beside the outer corner of one eye', 'a small gap between the fingers and the face', 'the other arm relaxed down'], detailed: ['One hand forms a loose L shape with the thumb and index finger beside the outer corner of one eye, a small gap kept between the fingers and the face.', 'The other arm is relaxed down.'] }
      },
      tags: { torso: { verified: [], phrases: ['head angled back toward front'] }, arms: { verified: ['finger frame'], phrases: ['L-shaped fingers by the eye', 'thumb and index finger frame'] } },
      figure: fig({ narrow: 0.8, face: 'three_quarter', arms: [{ at: 'head', dx: 11, dy: 0, bend: 1, elbowOut: 1.3, hand: 'L', elbowHint: { at: 'shoulder', dx: 7, dy: 15 } }, relaxed(1)] }),
      keywords: ['L字', 'フレーム', '目尻', '指', 'モード', 'かっこいい']
    },
    {
      id: 'purikura_s015', sourceId: 'PK-S015', group: 'モード・遠近', priority: 'P2', difficultyJa: '低',
      labelJa: 'みぞおちの前で手首を低く交差', shortJa: '胸ではなく、みぞおちの前で前腕をゆるく交差させ、各手を反対の前腕の外側に軽く置く。首と顔を開ける。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: '低い前腕の交点と本人の顔が入ること（上半身以上）',
      body: { pelvis: '浅い斜め前', ribcage: '胸は浅く斜め、顔は正面へ少し戻す', head: '顔を正面へ少し戻す', armA: '片方の前腕をみぞおちの前に低く通し、手を反対の前腕の外側に置く', armB: '反対の前腕も低く交差させ、手を反対の前腕の外側に置く（交点を胸へ上げない）', support: '両足で立つ', depth: '交差した前腕が手前', hands: '低い手首の交差' },
      prompt: {
        torso: { compact: ['torso angled three-quarters', 'head turned slightly back toward the front', 'neck and face kept open'], detailed: ['The torso angles three-quarters and the head turns slightly back toward the front, keeping the neck and face open.'] },
        arms: { compact: ['both forearms loosely crossed low in front of the upper abdomen', 'each hand resting on the opposite forearm'], detailed: ['Both forearms cross loosely and low in front of the upper abdomen, each hand resting on the opposite forearm.'] }
      },
      tags: { torso: { verified: [], phrases: ['neck and face open'] }, arms: { verified: [], phrases: ['forearms crossed low', 'crossed in front of the upper abdomen'] } },
      figure: fig({ narrow: 0.82, face: 'three_quarter', arms: [{ at: 'belly', dx: -6, dy: -8, bend: 1, elbowOut: 1.2 }, { at: 'belly', dx: 6, dy: -7, bend: -1, elbowOut: 1.2 }] }),
      keywords: ['腕組み', '交差', '手首', 'みぞおち', 'モード', 'クール']
    },
    {
      id: 'purikura_s016', sourceId: 'PK-S016', group: 'モード・遠近', priority: 'P2', difficultyJa: '中',
      labelJa: '軽く前傾して自分のひじを持つ', shortJa: '片方の前腕を下腹部の前に低く通し、反対の手でそのひじのすぐ下を軽く持つ。股関節から小さく前傾する。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: 'ひじを持つ手と両目が入ること（上半身以上）',
      body: { pelvis: '浅い斜め前', ribcage: '股関節から小さく前傾する（浅く保つ）', head: '顔は正面寄り', armA: '片方の前腕を下腹部の前に低く通す', armB: '反対の手で、その前腕のひじのすぐ下を軽く持つ（握り込まない）', support: '両足で立つ', depth: '前腕とひじを持つ手が手前', hands: '自分のひじを持つ手' },
      prompt: {
        torso: { compact: ['torso angled three-quarters', 'shallow forward lean from the hips', 'face fully visible'], detailed: ['The torso angles three-quarters with a shallow forward lean from the hips, the face fully visible.'] },
        arms: { compact: ['one forearm held low across the lower torso', 'the other hand lightly holding just below that elbow'], detailed: ['One forearm is held low across the lower torso, and the other hand lightly holds just below that elbow.'] }
      },
      tags: { torso: { verified: [], phrases: ['shallow forward lean'] }, arms: { verified: ['holding own arm'], phrases: ['hand holding below the elbow', 'forearm low across the torso'] } },
      figure: fig({ narrow: 0.82, fold: true, face: 'three_quarter', arms: [{ at: 'belly', dx: -9, dy: 0, bend: 1, elbowOut: 1.4 }, { at: 'belly', dx: 9, dy: -2, bend: -1 }] }),
      keywords: ['ひじ', '肘', '前傾', '腕を持つ', 'モード', 'クール']
    },
    {
      id: 'purikura_s017', sourceId: 'PK-S017', group: 'モード・遠近', priority: 'P1', difficultyJa: '高',
      labelJa: '画面の端へ手のひらを出す', shortJa: '顔の外側かつ少し手前に、開いた手のひらを浅い前景として置く。顔は前腕の横で完全に見せ、反対の腕は下ろす。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: '前景の手の外縁と顔が入ること（上半身以上）',
      body: { pelvis: '斜めに向けて立つ', ribcage: '胸は斜め、頭は手と反対へ少し逃がす', head: '頭を手と反対へ少し逃がし、顔を完全に見せる', armA: '片手を顔の外側かつ少し手前へ出し、手のひらを開く（指先を目にかけない）', armB: '反対の腕は体の横へ下ろす', support: '両足で立つ', depth: '開いた手がいちばん手前（浅い遠近）', hands: '前景の開いた手のひら' },
      prompt: {
        torso: { compact: ['torso at a three-quarter angle', 'head shifted slightly away from the raised side', 'face unobstructed'], detailed: ['The torso stands at a three-quarter angle and the head shifts slightly away from the raised side, the face unobstructed.'] },
        arms: { compact: ['one open palm held slightly forward near the outer edge of the frame', 'the face visible beside that forearm', 'the other arm relaxed down'], detailed: ['One open palm is held slightly forward near the outer edge of the frame, with the face visible beside that forearm.', 'The other arm is relaxed down.'] }
      },
      tags: { torso: { verified: [], phrases: ['face unobstructed'] }, arms: { verified: ['outstretched hand', 'foreshortening'], phrases: ['open palm at the frame edge', 'face beside the forearm'] } },
      figure: fig({ narrow: 0.78, face: 'three_quarter', headShift: -3, near: 'hand:0', arms: [{ at: 'head', dx: 21, dy: 8, bend: 1, toward: true, hand: 'palm' }, relaxed(1)] }),
      fallbackJa: '手が大きくなりすぎる・指が増える場合は、カメラ設定の「前景」を外し、手を顔の横の面まで戻す（前へ出さない）と崩れにくくなります。',
      keywords: ['手のひら', '前景', '遠近', '画面端', 'モード', '手を出す']
    },
    {
      id: 'purikura_s018', sourceId: 'PK-S018', group: 'モード・遠近', priority: 'P2', difficultyJa: '高',
      labelJa: '低く差し出す手の遠近ライン', shortJa: '顔より低い片手を手のひらを下にして前へ出し、反対の前腕を下腹部の前に低く置く。軽く前傾し、顔は上に残す。',
      minShot: 'upper_body', recommendedShot: 'waist_up', minNoteJa: '低く差し出す手・反対の前腕・顔が入ること（上半身以上）',
      body: { pelvis: '斜めに向けて立つ', ribcage: '軽く前傾し、頭は正面へ少し戻す', head: '顔を正面へ少し戻す', armA: '片手を胸より低く前へ出し、手のひらを下に向ける（顔の前へ上げない）', armB: '反対の前腕を下腹部の前に低く置く（二本を交差させない）', support: '両足で立つ', depth: '差し出す手がいちばん手前', hands: '下向きの手のひら（前へ）' },
      prompt: {
        torso: { compact: ['slight forward lean', 'torso angled three-quarters', 'face fully visible above'], detailed: ['The body leans slightly forward with the torso angled three-quarters, the face fully visible above.'] },
        arms: { compact: ['one hand extended low and forward with the palm facing down', 'the other forearm held low across the lower torso', 'the two forearms kept apart'], detailed: ['One hand extends low and forward with the palm facing down.', 'The other forearm is held low across the lower torso, the two forearms kept apart.'] }
      },
      tags: { torso: { verified: [], phrases: ['face visible above the hand'] }, arms: { verified: ['reaching towards viewer'], phrases: ['low hand reaching forward', 'palm facing down', 'forearms kept apart'] } },
      figure: fig({ narrow: 0.8, fold: true, face: 'three_quarter', near: 'hand:0', arms: [{ at: 'shoulder', dx: 5, dy: 24, bend: 1, toward: true, hand: 'palm' }, { at: 'belly', dx: 6, dy: 3, bend: -1 }] }),
      fallbackJa: '手が大きくなりすぎる・顔に重なる場合は、手を前へ出さず体の横で低く開く形にすると崩れにくくなります。',
      keywords: ['差し出す', '手のひら', '遠近', '前傾', 'モード', '手を出す']
    },

    // ================= 遊び・構図変化 =================
    {
      id: 'purikura_s019', sourceId: 'PK-S019', group: '遊び・構図変化', priority: 'P1', difficultyJa: '中',
      labelJa: '両手のひらで顔を左右から囲む', shortJa: '開いた両手のひらを、こめかみから頬の外側へ左右対称に置き、顔を広く囲む。両ひじは同じ高さで外へ。',
      minShot: 'bust_shot', recommendedShot: 'bust_shot', minNoteJa: '顔・両手のひら・両ひじが入ること（胸上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向ける', head: 'まっすぐ起こす', armA: '片手のひらを前に向け、指を上にして、同じ側のこめかみから頬の外側に置く（触れない）', armB: '反対の手のひらも同じ形で左右対称に置く', support: '両足で立つ', depth: '両手は顔と同じ面', hands: '両手のひらのフレーム' },
      prompt: {
        torso: { compact: ['chest square to the viewer', 'head centered and upright'], detailed: ['The chest faces the viewer squarely with the head centered and upright.'] },
        arms: { compact: ['both open palms held beside the temples and cheeks with the fingers pointing up', 'elbows level and spread outward', 'a symmetrical frame around the face'], detailed: ['Both open palms are held beside the temples and cheeks with the fingers pointing up, the elbows level and spread outward.', 'The hands form a symmetrical frame around the fully visible face.'] }
      },
      tags: { torso: { verified: [], phrases: ['head centered'] }, arms: { verified: ['hands up'], phrases: ['palms beside the temples', 'symmetrical palm frame', 'elbows level'] } },
      figure: fig({ arms: [{ at: 'head', dx: 13, dy: 1, bend: 1, elbowOut: 1.7, hand: 'palm' }, { at: 'head', dx: -13, dy: 1, bend: -1, elbowOut: 1.7, hand: 'palm' }] }),
      keywords: ['手のひら', '顔を囲む', 'フレーム', '両手', '対称', 'パー']
    },
    {
      id: 'purikura_s020', sourceId: 'PK-S020', group: '遊び・構図変化', priority: 'P1', difficultyJa: '中',
      labelJa: '前後差をつけた両手の猫の手', shortJa: '曲げた両手を頬の少し前に置き、片手だけを浅く手前へ出す。顔は二つの手の間に残す（ただの猫ポーズにしない）。',
      minShot: 'headshot', recommendedShot: 'bust_shot', minNoteJa: '顔と両手の全部の指が入ること（肩上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向ける', head: 'まっすぐ起こし、二つの手の間に残す', armA: '片手をゆるい猫の手にし、頬の少し手前に出す（前後差は浅く）', armB: '反対の手も猫の手にし、頬の少し前に置く（目と口を覆わない）', support: '両足で立つ', depth: '片手だけが浅く手前', hands: '前後差のある両手の猫の手' },
      prompt: {
        torso: { compact: ['torso square to the viewer', 'face visible between the two raised sides'], detailed: ['The torso faces the viewer squarely, the face visible between the two raised sides.'] },
        arms: { compact: ['both hands held as relaxed curved paws slightly in front of the cheeks', 'one paw a little closer to the viewer than the other', 'shallow difference in depth'], detailed: ['Both hands are held as relaxed curved paws slightly in front of the cheeks.', 'One paw sits a little closer to the viewer than the other, a shallow difference in depth.'] }
      },
      tags: { torso: { verified: [], phrases: ['face between the paws'] }, arms: { verified: ['paw pose', 'foreshortening'], phrases: ['one paw closer to the viewer', 'paws in front of the cheeks'] } },
      figure: fig({ near: 'hand:0', arms: [{ at: 'head', dx: 9, dy: 7, bend: 1, elbowOut: 1.3, toward: true, hand: 'paw', elbowHint: { at: 'shoulder', dx: 7, dy: 15 } }, { at: 'head', dx: -10, dy: 6, bend: -1, elbowOut: 1.4, hand: 'paw', elbowHint: { at: 'shoulder', dx: -9, dy: 16 } }] }),
      fallback: { to: 'purikura_s005', noteJa: '指が増える・顔が隠れる場合は、前後差のない「両手のゆるい猫の手」が崩れにくい。' },
      keywords: ['猫', 'ねこ', '猫の手', 'にゃん', '前後', '遠近']
    },
    {
      id: 'purikura_s021', sourceId: 'PK-S021', group: '遊び・構図変化', priority: 'P1', difficultyJa: '高',
      labelJa: '頭の上で大きなハート', shortJa: '両腕を上げてひじを外へ丸く開き、親指と指先を頭頂の上で合わせて一つの大きなハートを作る。顔はハートの下に見せる。',
      minShot: 'bust_shot', recommendedShot: 'waist_up', minNoteJa: '頭上のハート（腕の頂点）から顔の下までが入ること。頭上に余白を残す',
      body: { pelvis: '正面に向けて立つ', ribcage: '胸を正面に向ける', head: 'まっすぐ起こし、ハートの下に顔を見せる', armA: '片腕を上げ、ひじを外へ丸く開いてハートの片側にする', armB: '反対の腕も同じように上げ、指先と親指を頭頂の上で合わせる（頭頂に重ねない）', support: '両足で立つ', depth: '両腕は頭と同じ面', hands: '頭上で合わせた大きなハート' },
      prompt: {
        torso: { compact: ['chest facing the viewer', 'head upright beneath the raised shape', 'clear space above the top of the head'], detailed: ['The chest faces the viewer and the head stays upright beneath the raised shape, with clear space above the top of the head.'] },
        arms: { compact: ['both arms raised overhead with the elbows curved outward', 'fingertips and thumbs joined above the head', 'the arms forming one large heart'], detailed: ['Both arms are raised overhead with the elbows curved outward.', 'The fingertips and thumbs join above the head so the arms form one large heart.'] }
      },
      tags: { torso: { verified: [], phrases: ['space above the head'] }, arms: { verified: ['heart hands', 'arms up'], phrases: ['large heart above the head', 'elbows curved outward'] } },
      composition: { negativeSpace: 'above' },
      figure: fig({ heart: { at: 'overhead', dx: 0, dy: 4, r: 4.5 }, arms: [{ at: 'overhead', dx: 2, dy: 2, bend: 1, hintY: -14, elbowOut: 2, hand: null }, { at: 'overhead', dx: -2, dy: 2, bend: -1, hintY: -14, elbowOut: 2, hand: null }] }),
      fallback: { to: 'purikura_s022', noteJa: '頭上のハートが画面の上で切れる場合は、「顔の横に大きなハート」が収まりやすい。' },
      keywords: ['ハート', '頭上', '大きなハート', '両腕', 'バンザイ', '腕でハート']
    },
    {
      id: 'purikura_s022', sourceId: 'PK-S022', group: '遊び・構図変化', priority: 'P1', difficultyJa: '中',
      labelJa: '顔の横に大きなハート', shortJa: '両手を片側の肩の外の高さでつないで大きなハートを作り、顔と横並びに置く。胴は浅い斜めで、顔とハートの間を空ける。',
      minShot: 'bust_shot', recommendedShot: 'waist_up', minNoteJa: '顔とハートの外縁が入ること（胸上以上）',
      body: { pelvis: '浅い斜め前', ribcage: 'ハート側の肩を少し外へ開く', head: 'まっすぐ起こし、ハートと横並びに', armA: '片手をハートの外側の半分にし、肩の外の高さに置く', armB: '反対の手は体の前を通してハートの内側の半分にし、指先を合わせる（顔の前へ寄せない）', support: '両足で立つ', depth: 'ハートは顔と同じ面', hands: '両手のハート（顔の横）' },
      prompt: {
        torso: { compact: ['torso in a three-quarter stance', 'face fully visible on the open side'], detailed: ['The torso holds a three-quarter stance, the face fully visible on the open side of the composition.'] },
        arms: { compact: ['both hands joined in one large heart at outer shoulder height beside the face', 'a clear gap between the heart and the face'], detailed: ['Both hands join in one large heart at outer shoulder height beside the face, a clear gap kept between the heart and the face.'] }
      },
      tags: { torso: { verified: [], phrases: ['face on the open side'] }, arms: { verified: ['heart hands'], phrases: ['heart at shoulder height', 'heart beside the face'] } },
      figure: fig({ narrow: 0.84, face: 'three_quarter', heart: { at: 'head', dx: 23, dy: 7, r: 5 }, arms: [{ at: 'head', dx: 26, dy: 10, bend: 1, elbowOut: 1.2, hand: null }, { at: 'head', dx: 20, dy: 10, bend: -1, hand: null }] }),
      keywords: ['ハート', '大きなハート', '顔の横', '両手', '横並び', '手でハート']
    },
    {
      id: 'purikura_s023', sourceId: 'PK-S023', group: '遊び・構図変化', priority: 'P2', difficultyJa: '高',
      labelJa: '手前に両手のひらを広げる', shortJa: '肩幅に開いた両手のひらを浅い前景として出し、二つの手の間から顔を見せる。上体はわずかに後ろへ残す。',
      minShot: 'bust_shot', recommendedShot: 'waist_up', minNoteJa: '両手のひらの外縁と顔が切れないこと（胸上以上）',
      body: { pelvis: '正面に向けて立つ', ribcage: '上体をわずかに後ろへ残す', head: '二つの手の間から顔を見せる', armA: '片手のひらを指を広げて、顔より少し手前の肩幅の位置に出す（伸ばし切らない）', armB: '反対の手のひらも同じ高さで肩幅に出す', support: '両足で立つ', depth: '両手のひらが手前、顔はその少し奥', hands: '前景の両手のひら' },
      prompt: {
        torso: { compact: ['torso square to the viewer', 'upper body held slightly back', 'face visible in the middle'], detailed: ['The torso faces the viewer squarely with the upper body held slightly back, the face visible in the middle.'] },
        arms: { compact: ['both open palms held slightly forward at shoulder width with the fingers spread', 'the face set slightly behind and between the hands'], detailed: ['Both open palms are held slightly forward at shoulder width with the fingers spread.', 'The face sits slightly behind and between the hands.'] }
      },
      tags: { torso: { verified: [], phrases: ['upper body held back'] }, arms: { verified: ['foreshortening', 'outstretched hand'], phrases: ['two palms in the foreground', 'fingers spread at shoulder width'] } },
      figure: fig({ near: 'hand:0', arms: [{ at: 'head', dx: 14, dy: 9, bend: 1, toward: true, hand: 'palm' }, { at: 'head', dx: -14, dy: 9, bend: -1, toward: true, hand: 'palm' }] }),
      fallbackJa: '指が増える・手が大きくなりすぎる場合は、片手だけを手前へ出し、反対の腕は体の横へ下ろすと崩れにくくなります（STEP3で反対の腕だけを指定すると、このポーズの腕の指定はすべて外れるため、自由入力での補足がおすすめです）。',
      keywords: ['手のひら', 'パー', '両手', '前景', '遠近', '手を出す']
    },
    {
      id: 'purikura_s024', sourceId: 'PK-S024', group: '遊び・構図変化', priority: 'P2', difficultyJa: '中',
      labelJa: '目尻のすぐ外でダブルピース', shortJa: '両手のVを、両方の目尻のすぐ外側に少し離して置く、顔アップ専用の構図。両目は二つのVの間に見せる。',
      minShot: 'face_close_up', recommendedShot: 'face_close_up', minNoteJa: '二つのV・両目・あごが入ること（顔アップでよい）',
      body: { pelvis: '正面に向ける', ribcage: '胸を正面に向ける', head: 'まっすぐ起こす', armA: '片手のVを同じ側の目尻のすぐ外側に置く（目にかけない）', armB: '反対の手のVも同じ側の目尻の外側に置き、開きを左右でそろえる', support: '両足で立つ', depth: '両手は目と同じ面', hands: '両手のV（目尻の高さ）' },
      prompt: {
        torso: { compact: ['face squarely toward the viewer', 'chin level'], detailed: ['The face is turned squarely toward the viewer with the chin level.'] },
        arms: { compact: ['both hands making V signs just outside the outer corners of the eyes', 'both eyes fully visible between the two V signs', 'elbows lowered below shoulder height'], detailed: ['Both hands make V signs just outside the outer corners of the eyes, with both eyes fully visible between them.', 'The elbows stay lowered below shoulder height.'] }
      },
      tags: { torso: { verified: [], phrases: ['face square to the viewer'] }, arms: { verified: ['v over eye', 'double v'], phrases: ['V signs at eye height', 'eyes between the V signs'] } },
      figure: fig({ arms: [{ at: 'head', dx: 9, dy: -1, bend: 1, elbowOut: 1.05, hand: 'v', elbowHint: { at: 'shoulder', dx: 4, dy: 17 } }, { at: 'head', dx: -9, dy: -1, bend: -1, elbowOut: 1.05, hand: 'v', elbowHint: { at: 'shoulder', dx: -4, dy: 17 } }] }),
      keywords: ['ダブルピース', '目元', '目尻', '顔アップ', 'ピース', 'ギャルピース']
    },
    {
      id: 'purikura_s025', sourceId: 'PK-S025', group: '遊び・構図変化', priority: 'P2', difficultyJa: '中',
      labelJa: '少し上から、胸の前に大きなハート', shortJa: '少し高い位置から見下ろす構図で、両手で作った大きなハートを胸の前に低く保ち、あごだけを上げてこちらを見上げる。',
      minShot: 'bust_shot', recommendedShot: 'waist_up', minNoteJa: '顔とハートの全体が入ること（胸上以上）',
      body: { pelvis: '正面に向ける（立っても座ってもよい）', ribcage: '胸を正面に向ける', head: 'あごだけを高い視点へ上げる', armA: '片手をハートの半分にし、胸の前に置く', armB: '反対の手も胸の前で指先を合わせ、大きなハートを閉じる（あごより上へ上げない）', support: '両足、または座面', depth: 'ハートは胸のすぐ前', hands: '両手の大きなハート（胸の前）' },
      prompt: {
        torso: { compact: ['torso facing the viewer', 'face fully visible above the chest'], detailed: ['The torso faces the viewer with the face fully visible above the chest.'] },
        arms: { compact: ['both hands joined in a large heart held in front of the chest', 'the heart kept below the chin'], detailed: ['Both hands join in a large heart held in front of the chest, kept below the chin.'] }
      },
      tags: { torso: { verified: [], phrases: ['face above the chest'] }, arms: { verified: ['heart hands'], phrases: ['heart in front of the chest', 'heart below the chin'] } },
      preset: { head: { yaw: 'toward_camera', pitch: 'raised' }, gaze: { target: 'viewer', direction: 'upward', eyes: 'open' }, camera: { elevation: 'slightly_high' } },
      figure: fig({ heart: { at: 'chest', dx: 0, dy: 6, r: 5 }, arms: [{ at: 'chest', dx: 3, dy: 5, bend: 1, elbowOut: 1.6, hand: null }, { at: 'chest', dx: -3, dy: 5, bend: -1, elbowOut: 1.6, hand: null }] }),
      keywords: ['ハート', '胸', '俯瞰', '上から', '見上げる', '手でハート']
    }
  ];
  poses.forEach(function (p) { p.line = 'purikura'; p.groupId = GROUP_BY_JA[p.group]; });
  // 手の形（図の記号）の名前。日本語構造と図の説明に使う。
  D.purikuraHandShapes = { v: 'V', paw: '猫の手', palm: '手のひら', fist: 'グー', L: 'L字', c: 'C字', point: '指差し' };
  D.purikuraEditorialPoses = poses;
  D.editorialPoses = (D.editorialPoses || [{ id: 'none', labelJa: '指定なし' }]).concat(poses);

  // ---- 採否ログ（25件すべて採用。ManusのP1〜P3は確認・生成検証の順番で、削除の基準にしない） ----
  D.purikuraSoloCandidateLog = poses.map(function (p) {
    return { id: p.sourceId, status: 'adopted', internalId: p.id, presetId: 'purikura_preset_' + p.id.slice(-4), priority: p.priority, difficultyJa: p.difficultyJa };
  });
  // 資料の修正点（Manus JSONは書き換えず、ここに記録する）
  D.purikuraSoloDataFixes = {
    'PK-S015': '最小画角の「低い交点と両顔」は一人用の誤記。「低い前腕の交点と本人の顔」に修正（指示書の確定修正）',
    'PK-S002': 'PK-S024との差を図と英語で固定：S002は頬の高さ・ひじを大きく外へ・胸上、S024は目尻の高さ・ひじは低め・顔アップ',
    'PK-S005': 'PK-S020との差を固定：S005は前後差なしの左右対称、S020は片手だけ浅く手前（図では手前の手を白抜きで描く）',
    'PK-S021': '頭上のハートが切れないよう、構図に「上側に余白」を入れ、図の撮影範囲の枠は手（腕の頂点）まで含める。簡易版としてPK-S022へ移れる',
    'PK-S017': '弱い遠近を初期値に（推奨は腰上）。崩れる場合の案内を追加',
    'PK-S018': '弱い遠近を初期値に（推奨は腰上）。崩れる場合の案内を追加',
    'PK-S023': '両手前景が崩れる場合の案内（片手前景＋反対の腕は体の横）を追加',
    'english_prompt': '各候補の英語は丸ごと使わず、胴と腕に分けた。without／no などの否定と、chest-up framing などの画角語・カメラ語は使わない（画角はカメラ設定から出す）'
  };

  // ---- プリセット（一人用） ----
  var COMMON_COMPOSITION = { subjectPlacement: 'centered', negativeSpace: 'around', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'subtle_dynamic' };
  function preset(def) {
    var extra = def.preset || {};
    var pose = { posture: 'standing', motion: { state: 'static' }, editorialPose: def.id, head: extra.head || { yaw: 'toward_camera', pitch: 'neutral' }, gaze: extra.gaze || { target: 'viewer', direction: 'direct', eyes: 'open' } };
    return {
      id: 'purikura_preset_' + def.id.slice(-4),
      nameJa: def.labelJa,
      descriptionJa: def.shortJa,
      patch: {
        pose: pose,
        camera: Object.assign({ shotSize: def.recommendedShot, elevation: 'eye_level', roll: 'level' }, extra.camera || {}),
        composition: Object.assign({}, COMMON_COMPOSITION, def.composition || {})
      },
      meta: { collection: 'purikura', poseFamily: def.groupId, sourceId: def.sourceId, audienceTags: [], keywords: def.keywords }
    };
  }
  var purikuraPresets = poses.map(preset);
  D.presetCollections = D.presetCollections || {};
  D.presetCollections.purikura = { labelJa: 'プリクラ・フォトブース' };
  D.purikuraPresets = purikuraPresets;
  D.presets = (D.presets || []).concat(purikuraPresets);
})(window);
