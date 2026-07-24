(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed, group) { return { id: id, labelJa: labelJa, compact: compact, detailed: detailed, group: group || null }; }
  D.headYaws = [
    o('toward_camera', 'カメラ方向', 'head turned toward the viewer', 'The head turns toward the viewer.'),
    o('slightly_away', '少し横へ', 'head turned slightly away', 'The head turns slightly away from the viewer.'),
    o('side', '横向き', 'head in side profile', 'The head is shown in side profile.'),
    o('over_shoulder', '肩越しに振り返る', 'head looking back over the shoulder', 'The head turns back over the shoulder.')
  ];
  D.headPitches = [
    o('neutral', '水平', '', ''),
    o('raised', '顎を少し上げる', 'chin slightly raised', 'The chin is slightly raised.'),
    o('lowered', '顎を少し下げる', 'chin slightly lowered', 'The chin is slightly lowered.')
  ];
  D.headTilts = [
    o('level', '首を傾けない', '', ''),
    o('slight', '首を少し傾ける', 'neck tilted slightly', 'The neck tilts slightly.'),
    o('pronounced', '首を大きく傾ける', 'neck tilted noticeably', 'The neck tilts noticeably.')
  ];
  D.gazeTargets = [
    o('viewer', 'こちらを見る', 'eyes directed toward the viewer', 'The eyes look toward the viewer.'),
    o('near_camera', 'カメラの少し横', 'eyes looking just past the viewer', 'The eyes look just past the viewer.'),
    o('offscreen', '画面外の対象', 'eyes focused on an off-screen subject', 'The eyes focus on a subject outside the frame.'),
    o('nearby', '近くの対象', 'eyes focused on a nearby point', 'The eyes focus on a nearby point.'),
    o('ground', '地面', 'eyes directed toward the ground', 'The eyes are directed toward the ground.'),
    o('sky', '空・上方', 'eyes directed upward', 'The eyes are directed upward.'),
    o('distance', '遠く', 'eyes focused into the distance', 'The eyes focus into the distance.')
  ];
  D.gazeDirections = [
    o('direct', 'まっすぐ', 'with a direct gaze', 'The gaze is direct.'),
    o('slightly_averted', '少し外す', 'with a slightly averted gaze', 'The gaze is slightly averted.'),
    o('sidelong', '横目', 'with a sidelong gaze', 'The eyes glance sideways.'),
    o('upward', '上目', 'with an upward gaze', 'The gaze angles upward.'),
    o('downward', '伏し目', 'with a downward gaze', 'The gaze angles downward.'),
    o('over_shoulder', '肩越し', 'with an over-the-shoulder gaze', 'The gaze travels back over the shoulder.')
  ];
  D.eyeStates = [o('open', '目を開ける', '', ''), o('closed', '目を閉じる', 'eyes closed', 'The eyes are closed.')];
  D.expressionGroups = [
    { id: 'calm_bright', labelJa: '穏やか・明るい' },
    { id: 'sweet_intimate', labelJa: '甘さ・親密さ' },
    { id: 'playful_confident', labelJa: 'いたずら・自信' },
    { id: 'tense_emotional', labelJa: '緊張・感情' }
  ];
  D.expressions = [
    o('none', '指定なし', '', '', 'calm_bright'),
    o('neutral', '無表情', 'neutral expression', 'The expression is neutral.', 'calm_bright'),
    o('soft_smile', 'やわらかい微笑み', 'a soft gentle smile', 'The character wears a soft, gentle smile.', 'calm_bright'),
    o('closed_mouth_smile', '口を閉じた微笑み', 'closed-mouth smile', 'The character wears a closed-mouth smile.', 'calm_bright'),
    o('relieved_smile', '安堵した微笑み', 'relieved smile, relaxed brows', 'The character wears a relieved smile with relaxed brows.', 'calm_bright'),
    o('bashful_smile', 'はにかみ笑い', 'bashful smile', 'The character wears a bashful smile.', 'calm_bright'),
    o('suppressing_laugh', '笑いをこらえる', 'suppressing a laugh, lips gently pressed together', 'The character suppresses a laugh with the lips gently pressed together.', 'calm_bright'),
    o('barely_contained_happy_smile', '嬉しさを隠せない表情', 'barely contained happy smile', 'The character can barely contain a happy smile.', 'calm_bright'),

    o('shy', '照れる', 'a shy expression, slightly embarrassed', 'The character looks shy and slightly embarrassed.', 'sweet_intimate'),
    o('embarrassed', '恥ずかしがる', 'an embarrassed expression', 'The character wears an embarrassed expression.', 'sweet_intimate'),
    o('affectionate_smile', '甘えるような笑み', 'soft affectionate smile, gently softened expression', 'The character wears a soft affectionate smile with a gently softened expression.', 'sweet_intimate'),
    o('slight_pout', 'ふくれっ面', 'slight pout, subtly puffed cheeks', 'The character wears a slight pout with subtly puffed cheeks.', 'sweet_intimate'),
    o('wistful', '切なげな表情', 'wistful expression, faintly lowered brows', 'The character wears a wistful expression with faintly lowered brows.', 'sweet_intimate'),

    o('playful', 'playful', 'playful expression', 'The character wears a playful expression.', 'playful_confident'),
    o('mischievous_grin', 'いたずらっぽい笑み', 'mischievous grin', 'The character wears a mischievous grin.', 'playful_confident'),
    o('smug_smile', '得意げな笑み', 'smug smile, slightly raised brow', 'The character wears a smug smile with one brow slightly raised.', 'playful_confident'),
    o('knowing_smile', '含みのある微笑み', 'knowing smile', 'The character wears a knowing smile.', 'playful_confident'),
    o('provocative_smile', '挑発的な微笑み', 'provocative smile, steady eye contact', 'The character wears a provocative smile with steady eye contact.', 'playful_confident'),
    o('confident_smile', '余裕のある笑み', 'calm confident smile', 'The character wears a calm, confident smile.', 'playful_confident'),

    o('crying', '泣く', 'crying', 'The character is crying.', 'tense_emotional'),
    o('wary', '警戒した表情', 'wary expression, tense brows', 'The character wears a wary expression with tense brows.', 'tense_emotional'),
    o('confused', '困惑した表情', 'confused expression, slightly parted lips', 'The character wears a confused expression with slightly parted lips.', 'tense_emotional'),
    o('defiant', '強がる表情', 'defiant expression, restrained tension', 'The character wears a defiant expression with restrained tension.', 'tense_emotional'),
    o('frustrated', '悔しそうな表情', 'frustrated expression, tightly pressed lips', 'The character looks frustrated with tightly pressed lips.', 'tense_emotional'),
    o('resigned', '諦めたような表情', 'resigned expression, lowered gaze', 'The character wears a resigned expression with a lowered gaze.', 'tense_emotional'),
    o('quiet_tears', '静かな涙', 'quiet tears, composed expression', 'The character sheds quiet tears while keeping a composed expression.', 'tense_emotional'),
    o('determined', '決意を秘めた表情', 'determined expression, firm mouth', 'The character wears a determined expression with a firm mouth.', 'tense_emotional')
  ];
})(window);
