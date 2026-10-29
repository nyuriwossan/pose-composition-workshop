(function (global) {
  'use strict';
  /*
   * 舞踊的な上半身（しなやかな捻り）一人用ポーズ（2026-10-29f 試作4件）
   *
   * 出典：Manus「舞踊的な上半身ポーズ候補・6分類統合レポート」と dance_pose_candidates.json（BL-001〜BL-024、暫定資料）。
   * 資料が独立調査済みとしているのはポール・ド・ブラ系だけ。技法名は着想の参照で、このアプリのポーズは正式な舞踊の型ではない。
   * 確認できた範囲（2026-10-29）：
   *   - エポールマン：SAB「Suki Says: Part 3」— クロワゼ／エファセで頭を手前の肩へ向けて傾け、頬を前へ出す。クロワゼでは奥の腕を頭上（指先が頭の中心線の上）へ。
   *   - カンブレ：上体を腰から上で弓なりにする。前・後ろ・横がある（Ballet Manila Archives の用語解説）。
   *   - グラハム・テクニック（Wikipedia、二次資料）：収縮は骨盤から背骨を凹に丸める。螺旋は背骨を縦軸のまわりに約45度回す。
   *   - ポール・ド・ブラ：バレエの腕の動きの技法（Merriam-Webster）。流派ごとの腕の位置の違いは未確認。
   *
   * 形式はモード系（data/editorial.js・data/mode-editorial.js）と同じで、pose.editorialPose で選ぶ。line: 'dance'。
   * 英語に ballet／dance／dancer、舞台衣装、性別・外見・表情・服装・背景・照明・画風・品質の語は入れない。
   */
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // Danbooruタグ一覧（a1111-sd-webui-tagcomplete の danbooru.csv、2026-10-29取得）と完全一致を確認した語。
  D.danceVerifiedTags = { 'head tilt': 139388, 'arm up': 208569, 'arm behind back': 37640 };
  // outstretched arm（65194件）は実在するが、腕をまっすぐ伸ばした絵に寄せる可能性があるため（推測）BL-012では使わない。

  var poses = [
    {
      id: 'oval_high_low_arms', sourceId: 'BL-005', line: 'dance', labelJa: '高い腕と低い腕で楕円をつくる',
      shortJa: '片腕を頭上へ丸く上げ、反対の腕は腰の前で低い楕円にする。胸は骨盤と逆へ回し、頭は手前の肩へ傾けて頬を少し前へ。',
      minShot: 'upper_body', recommendedShot: 'waist_up', inspiredBy: 'ポール・ド・ブラ（腕の運び）＋エポールマン（頭の向き）',
      body: {
        pelvis: '斜めに向ける', ribcage: '胸郭を骨盤と逆へ回し、片方の肩を少し上げて前へ',
        head: '首を長く保ち、手前の肩の側へ頭を傾けて頬を少し前へ', armA: '片腕を頭上へ丸く上げ、指先を頭の真上あたりで止める（肘は丸く）',
        armB: '反対の腕は腰の前で低い楕円にし、手は内へ向けて体から少し離す', support: '両足（片脚に軽く荷重）', depth: '低い腕が手前、高い腕は頭のやや前'
      },
      prompt: {
        torso: {
          compact: ['pelvis angled one way', 'ribcage counter-rotated against the pelvis', 'one shoulder lifted slightly forward', 'neck long', 'head inclined toward the near shoulder with the cheek brought slightly forward'],
          detailed: ['The pelvis angles one way while the ribcage counter-rotates against it, lifting one shoulder slightly forward.', 'The neck stays long and the head inclines toward the near shoulder, bringing the cheek slightly forward.']
        },
        arms: {
          compact: ['one arm rounded overhead with a softly curved elbow', 'its fingertips held above the center of the head', 'the other arm forming a low rounded oval in front of the waist', 'that hand turned inward a short distance from the body', 'the two arms at clearly different heights'],
          detailed: ['One arm rounds overhead with a softly curved elbow, its fingertips held above the center of the head.', 'The other arm forms a low rounded oval in front of the waist, the hand turned inward a short distance from the body, so the two arms sit at clearly different heights.']
        }
      },
      tags: {
        torso: { verified: ['head tilt'], phrases: ['pelvis angled one way', 'counter-rotated ribcage', 'cheek brought forward', 'long neck'] },
        arms: { verified: ['arm up'], phrases: ['rounded arm overhead', 'softly curved elbow', 'low rounded arm in front of waist', 'arms at different heights'] }
      },
      figure: { narrow: 0.86, shoulderTilt: 5, headShift: 2, headTilt: 9, twist: 1, near: 'shoulder:0', curve: true,
        arms: [{ at: 'overhead', dx: -3, dy: 3, bend: 1, hintY: -24, elbowOut: 1.5 }, { at: 'belly', dx: 3, dy: 3, bend: -1, elbowOut: 1.7 }] }
    },
    {
      id: 'open_arc_diagonal', sourceId: 'BL-003', line: 'dance', labelJa: '頭上の弧から下の指先まで開く斜線',
      shortJa: '片腕を頭上の外側へ大きな弧で上げ、反対の腕は体の横へ長く下ろす。胸を開いて少し持ち上げ、顔は高い肩の側へ。',
      minShot: 'upper_body', recommendedShot: 'waist_up', postures: ['standing'], inspiredBy: 'エポールマン（胸を開く斜めの向き）',
      body: {
        pelvis: '斜めに向け、片脚に荷重', ribcage: '胸を開いて少し持ち上げ、背中の上部をごくわずかに反らす。片方の肩を高く',
        head: '高い肩の側へ顔を向け、顎を少し上げる', armA: '片腕を頭上の外側へ大きな弧で上げ、肘は柔らかく',
        armB: '反対の腕は体の横へ長く下ろし、手首を腰の外で止める', support: '片脚荷重', depth: '上げた腕は胸の少し後ろ'
      },
      prompt: {
        torso: {
          compact: ['pelvis angled one way with the weight on one leg', 'chest opened and lifted', 'upper back arching very slightly', 'one shoulder raised', 'head turned toward the higher shoulder with the chin lifted slightly'],
          detailed: ['The pelvis angles one way with the weight on one leg while the chest opens and lifts, the upper back arching very slightly and one shoulder rising.', 'The head turns toward the higher shoulder with the chin lifted slightly.']
        },
        arms: {
          compact: ['one arm sweeping overhead in a wide outward arc with a soft elbow', 'the other arm descending long beside the torso', 'that wrist ending just outside the hip', 'one continuous diagonal running from the raised hand to the lowered hand'],
          detailed: ['One arm sweeps overhead in a wide outward arc with a soft elbow.', 'The other arm descends long beside the torso, the wrist ending just outside the hip, so one continuous diagonal runs from the raised hand to the lowered hand.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['chest opened and lifted', 'slight upper back arch', 'head toward higher shoulder', 'chin slightly up'] },
        arms: { verified: ['arm up'], phrases: ['wide arc overhead', 'long lowered arm beside torso', 'diagonal line through both arms'] }
      },
      figure: { shoulderTilt: 7, headShift: 2, headTilt: 7, face: 'three_quarter', near: 'shoulder:1', curve: true,
        arms: [{ at: 'overhead', dx: 13, dy: 3, bend: 1, hintY: -16, elbowOut: 1.3 }, { at: 'hip', dx: -15, dy: 15, bend: -1 }] }
    },
    {
      id: 'curl_and_open', sourceId: 'BL-012', line: 'dance', labelJa: '胸を丸めて片腕だけ開く',
      shortJa: '胸をくぼませて背中を丸め、片方の肩を内へ巻き込んでその腕を胸の下へたたむ。反対の腕だけを斜め上の外へ開く。',
      minShot: 'upper_body', recommendedShot: 'waist_up', inspiredBy: 'コンテンポラリーの収縮と開放（グラハム・テクニックの収縮）',
      body: {
        pelvis: '斜め後ろへ引き、片脚に荷重', ribcage: '胸をくぼませて背中の上部を丸め、片方の肩を内へ巻き込む。反対の肩は後ろへ開く',
        head: '巻き込んだ肩から顔をそらす', armA: '巻き込んだ側の肘を内へたたみ、手首を胸の下で止める',
        armB: '反対の腕は斜め上の外へ伸ばし、肘を柔らかく保つ', support: '片脚荷重', depth: '巻き込んだ肩が手前'
      },
      prompt: {
        torso: {
          compact: ['pelvis drawn back on a diagonal', 'chest hollowed and upper back rounded', 'one shoulder curling inward and forward', 'the opposite shoulder opening back', 'head turned away from the curled shoulder'],
          detailed: ['The pelvis draws back on a diagonal while the chest hollows and the upper back rounds, one shoulder curling inward and forward as the opposite shoulder opens back.', 'The head turns away from the curled shoulder.']
        },
        arms: {
          compact: ['on the curled side, the elbow folding inward with the wrist resting below the chest', 'the other arm extending diagonally outward and upward with a soft elbow'],
          detailed: ['On the curled side, the elbow folds inward with the wrist resting below the chest.', 'The other arm extends diagonally outward and upward with a soft elbow.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['hollowed chest', 'rounded upper back', 'one shoulder curled inward', 'other shoulder opened back', 'head turned away from curled shoulder'] },
        arms: { verified: [], phrases: ['elbow folded inward', 'wrist below chest', 'arm opening diagonally up and out', 'soft elbow'] }
      },
      figure: { narrow: 0.82, lean: 4, fold: true, shoulderTilt: -3, headShift: -4, headTilt: -8, near: 'shoulder:0', curve: true,
        arms: [{ at: 'belly', dx: -3, dy: -5, bend: -1 }, { at: 'shoulder', dx: -31, dy: -13, bend: -1, hintY: 4 }] }
    },
    {
      id: 'delayed_spiral', sourceId: 'BL-013', line: 'dance', labelJa: '腰・胸・顔が順にずれる螺旋',
      shortJa: '骨盤はほぼ正面に止め、胸だけを約45度回す。顔は胸と逆の側へ遅れて戻し、前の腕は腰の前で低い弧、後ろの腕は肘だけ見せる。',
      minShot: 'upper_body', recommendedShot: 'waist_up', inspiredBy: 'コンテンポラリーの螺旋（グラハム・テクニックのスパイラル）＋エポールマン',
      body: {
        pelvis: 'カメラへほぼ正面のまま止める', ribcage: '胸郭だけを約45度回し、先に回る肩を前へ、反対の肩を後ろへ残す',
        head: '首を長く保ち、顔は胸と逆の側へ遅れて戻す', armA: '前へ出た肩の腕は、腰の前で低く丸い弧',
        armB: '後ろに残った肩の腕は胴の陰へ引き、肘だけ見せる', support: '両足で立ち、荷重はほぼ均等', depth: '前へ出た肩が手前'
      },
      prompt: {
        torso: {
          compact: ['pelvis square to the viewer and held still', 'ribcage alone rotated about forty-five degrees', 'leading shoulder advanced', 'trailing shoulder held back', 'head turned the opposite way from the chest'],
          detailed: ['The pelvis stays square to the viewer and holds still while the ribcage alone rotates about forty-five degrees, the leading shoulder advancing and the trailing shoulder held back.', 'With the neck long, the head turns the opposite way from the chest.']
        },
        arms: {
          compact: ['the arm on the leading side forming a low rounded curve in front of the hip', 'the arm on the trailing side drawn behind the torso with only the elbow showing'],
          detailed: ['On the leading side, the arm forms a low rounded curve in front of the hip.', 'On the trailing side, the arm draws behind the torso with only the elbow showing.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['pelvis facing viewer', 'chest turned about 45 degrees', 'head turned opposite to chest', 'leading shoulder forward'] },
        arms: { verified: ['arm behind back'], phrases: ['low rounded arm in front of hip', 'elbow showing behind torso'] }
      },
      figure: { narrow: 0.66, shoulderTilt: 2, headShift: -4, face: 'three_quarter', faceDir: -1, twist: 1, near: 'shoulder:0', curve: true,
        arms: [{ at: 'belly', dx: -3, dy: 10, bend: 1, elbowOut: 1.8 }, { at: 'hip', dx: -3, dy: -6, hidden: true, bend: -1 }] }
    }
  ];
  D.danceEditorialPoses = poses;
  D.editorialPoses = (D.editorialPoses || [{ id: 'none', labelJa: '指定なし' }]).concat(poses);

  /*
   * 24候補の判定。adopted：採用／merged：採用した候補へ統合／near：既存（基本・AV・ME）に近い／held：資料・生成・図の問題で保留。
   * duplicateOf は照合した既存プリセットID・AV番号・ME番号・統合先のBL番号。
   * dataFix：資料の不整合と、この実装での修正。
   */
  D.danceCandidateLog = [
    { id: 'BL-001', nameJa: '斜め螺旋の首戻し', status: 'merged', duplicateOf: ['BL-013', 'ME-02', 'ME-07'], reasonJa: '骨盤・胸郭・頭を三方向へずらす要点がBL-013と同じ。腕の特徴が弱く、モード系のME-02（胸だけひねる）とME-07（顔を戻す）の組み合わせにも近い' },
    { id: 'BL-002', nameJa: 'クロワゼの頬前カーブ', status: 'merged', duplicateOf: ['BL-005'], reasonJa: '頭を手前の肩へ傾ける・高い腕と低い弧の腕はBL-005と同じ構成。SABの説明（奥の腕は頭上で指先が頭の中心線の上）に合わせ、BL-005の高い腕に反映して統合' },
    { id: 'BL-003', nameJa: 'エファセの胸開き斜線', status: 'adopted', internalId: 'open_arc_diagonal', dataFix: '資料は「頭を高い腕から離す」。SABのエファセ（頭を手前の肩へ向け、上げた腕の向こうへ視線）と食い違うため、「高い肩の側へ顔を向け、顎を少し上げる」に修正' },
    { id: 'BL-004', nameJa: 'エカルテの横流れ', status: 'held', duplicateOf: ['AV-015'], reasonJa: '骨盤を残して胸郭を横へ滑らせ片腕を上外へ伸ばす構成がAV-015と同じ。骨盤まで傾きやすい', dataFix: '左腕の欄に右腕、右腕の欄に左腕の説明が入っていた（英語欄は正しい）。欄を入れ替えて解釈' },
    { id: 'BL-005', nameJa: '低腕から高腕への楕円', status: 'adopted', internalId: 'oval_high_low_arms', dataFix: '資料の推奨画角 waist_up はアプリの「腰上」。英語欄の Waist-up pose などの画角語は出力に入れない（画角はカメラ設定から出す）' },
    { id: 'BL-006', nameJa: '顔横の片弧と後退腕', status: 'near', duplicateOf: ['ME-10'], reasonJa: '顔の横に浮かせた手・背中へ回す腕は、ME-10（こめかみに手を浮かせる）と既存の「顔の近くの手」＋「後ろ手」で作れる。差は「弧」「柔らかさ」という抽象表現だけ' },
    { id: 'BL-007', nameJa: '胸前を流れる前腕', status: 'merged', duplicateOf: ['BL-005', 'ME-03'], reasonJa: '胸の前の前腕は、胸を横切るかどうか以外はME-03と同じ。低く丸い腕の要素はBL-005の低い腕へ統合', dataFix: '英語欄の without crossing the chest は否定語のため使わない' },
    { id: 'BL-008', nameJa: '二段腕の非対称楕円', status: 'merged', duplicateOf: ['BL-005'], reasonJa: '高さの違う二つの弧はBL-005と同じ構成。左右対称へ戻りやすい' },
    { id: 'BL-009', nameJa: '胸を開く斜め後屈', status: 'held', duplicateOf: ['viewer_chest_hand_upward_half'], reasonJa: '推奨の胸上では骨盤が写らず、既存の「上半身を後ろへ傾ける」と区別しにくい。首の過伸展になりやすく、腕に特徴がない' },
    { id: 'BL-010', nameJa: '胸郭の前落ちと首の浮き', status: 'near', duplicateOf: ['AV-013'], reasonJa: '後ろ脚荷重・骨盤を引く・胸郭を前下へ折る・頭を逆へ戻す・腕の長い対角線と後ろ手がAV-013とほぼ同じ' },
    { id: 'BL-011', nameJa: '側屈アーチの肩越し戻し', status: 'held', duplicateOf: ['relationship_rear_three_quarter_turn'], reasonJa: '側屈と回旋の合成は図でも生成でも肩越しの振り返りだけに単純化されやすく、既存の振り返りと区別しにくい' },
    { id: 'BL-012', nameJa: '螺旋の収縮から開放', status: 'adopted', internalId: 'curl_and_open' },
    { id: 'BL-013', nameJa: '胸郭中心の遅延スパイラル', status: 'adopted', internalId: 'delayed_spiral', dataFix: '資料の推奨は胸上だが、骨盤を正面に止める要点が胸上では写らないため、推奨を腰上（最小：上半身）に変更' },
    { id: 'BL-014', nameJa: '片肩から指先の長い流線', status: 'near', duplicateOf: ['AV-013', 'ME-03'], reasonJa: '片腕の長い下向きの対角線＋反対の腕を背中へ、はAV-013の腕と同じ。差は「曲線」という抽象表現だけ' },
    { id: 'BL-015', nameJa: '浮遊する胸郭と低い肘', status: 'near', duplicateOf: ['AV-015'], reasonJa: '骨盤を中央に残して胸郭を横へ滑らせる構成がAV-015と同じ' },
    { id: 'BL-016', nameJa: '前傾から首だけの上昇', status: 'near', duplicateOf: ['AV-013', 'BL-010'], reasonJa: '胸郭を前へ折って頭だけ上げる構成がAV-013・BL-010と同じ' },
    { id: 'BL-017', nameJa: '斜め後方への解放弧', status: 'held', duplicateOf: [], reasonJa: '前へ伸ばす腕と後ろへ流す腕の前後差が正面からは読めず、後ろへ傾いただけの絵になりやすい' },
    { id: 'BL-018', nameJa: '連続する三つの弧', status: 'merged', duplicateOf: ['BL-005'], reasonJa: '顔の横の弧と胸の下の弧はBL-005の高低二つの弧と同じ構成。三つ目の「首の弧」は抽象表現' },
    { id: 'BL-019', nameJa: '手首の遅延と肩の先行', status: 'held', duplicateOf: ['AV-005'], reasonJa: '手首だけを返す指定は手のねじれ・崩れが起きやすく、前へ出す肘はAV-005と近い' },
    { id: 'BL-020', nameJa: '非接触の楕円窓', status: 'near', duplicateOf: ['AV-009'], reasonJa: '両腕を高さの違う非接触の弧にして顔のまわりに窓を残す構成がAV-009と同じ', dataFix: '英語欄の forearms not touching は否定語' },
    { id: 'BL-021', nameJa: '椅子に預ける螺旋', status: 'near', duplicateOf: ['ME-21'], reasonJa: '椅子の背に前腕を預け、胸を回す構成がME-21と同じ' },
    { id: 'BL-022', nameJa: '浅い半座位の逆回旋', status: 'near', duplicateOf: ['ME-22'], reasonJa: 'スツールの前縁に浅く座り、骨盤と胸郭を逆へ回し、片手で座面を支える構成がME-22と同じ' },
    { id: 'BL-023', nameJa: '床支持の低い螺旋', status: 'held', duplicateOf: ['AV-017'], reasonJa: '床・膝・手の前後関係が崩れやすく（図の評価C）、床に手をつく低い姿勢はAV-017と近い' },
    { id: 'BL-024', nameJa: '近接肩から遠い手の流線', status: 'held', duplicateOf: ['AV-005', 'ME-07'], reasonJa: 'カメラ側の肩・肘が大きく出すぎやすく、手前の肩を使う構成はAV-005・ME-07と近い' }
  ];

  // ---- プリセット（一人用）----
  var COMMON_COMPOSITION = { subjectPlacement: 'centered', negativeSpace: 'around', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'subtle_dynamic' };
  function preset(def) {
    return {
      id: 'dance_' + def.id,
      nameJa: def.labelJa,
      descriptionJa: def.shortJa,
      patch: {
        pose: { posture: 'standing', motion: { state: 'static' }, editorialPose: def.id },
        camera: { shotSize: def.recommendedShot, elevation: 'eye_level', roll: 'level' },
        composition: COMMON_COMPOSITION
      },
      meta: { collection: 'dance', poseFamily: 'dance_flow', sourceId: def.sourceId, audienceTags: [] }
    };
  }
  var dancePresets = poses.map(preset);
  D.presetCollections = D.presetCollections || {};
  D.presetCollections.dance = { labelJa: '舞踊的な上半身' };
  D.dancePresets = dancePresets;
  D.presets = (D.presets || []).concat(dancePresets);
})(window);
