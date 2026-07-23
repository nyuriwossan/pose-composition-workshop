(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed) { return { id: id, labelJa: labelJa, compact: compact, detailed: detailed }; }
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
  D.expressions = [
    o('none', '指定なし', '', ''),
    o('neutral', '無表情', 'neutral expression', 'The expression is neutral.'),
    o('soft_smile', 'やわらかい微笑み', 'a soft gentle smile', 'The character wears a soft, gentle smile.'),
    o('playful', 'playful', 'playful expression', 'The character wears a playful expression.'),
    o('shy', '照れる', 'a shy expression, slightly embarrassed', 'The character looks shy and slightly embarrassed.'),
    o('embarrassed', '恥ずかしがる', 'an embarrassed expression', 'The character wears an embarrassed expression.'),
    o('crying', '泣く', 'crying', 'The character is crying.'),
    o('quiet_tears', '静かに涙を流す', 'quietly shedding tears, tears running softly', 'The character quietly sheds tears that run softly down the face.'),
    o('wistful', '切なげ', 'a wistful expression', 'The character wears a wistful expression.')
  ];
})(window);
