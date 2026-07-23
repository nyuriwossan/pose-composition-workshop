(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed) { return { id: id, labelJa: labelJa, compact: compact, detailed: detailed }; }
  D.shotSizes = [
    o('face_close_up', '顔アップ', 'face close-up', 'Frame the face in a close-up.'),
    o('headshot', 'ヘッドショット', 'headshot', 'Frame the head and shoulders.'),
    o('bust_shot', 'バストショット', 'bust shot', 'Frame the figure in a bust shot.'),
    o('upper_body', '上半身', 'upper-body shot', 'Frame the upper body.'),
    o('waist_up', '腰上', 'waist-up shot', 'Frame the figure from the waist up.'),
    o('knee_up', '膝上', 'knee-up shot', 'Frame the figure from the knees up.'),
    o('full_body', '全身', 'full-body shot', 'Show the full body.'),
    o('wide', '引きの全身', 'wide full-body shot', 'Frame the full figure in a wide shot.')
  ];
  D.elevations = [
    o('eye_level', '目線の高さ', 'viewed at eye level', 'Use an eye-level viewpoint.'),
    o('slightly_low', '少し低い', 'viewed from slightly below', 'View the figure from slightly below eye level.'),
    o('low', '低位置', 'viewed from below', 'View the figure from below.'),
    o('slightly_high', '少し高い', 'viewed from slightly above', 'View the figure from slightly above eye level.'),
    o('high', '高位置', 'viewed from above', 'View the figure from above.'),
    o('top_down', '真上寄り', 'viewed from directly above', 'Use a top-down viewing angle.')
  ];
  D.rolls = [
    o('level', '水平', '', 'Keep the viewing plane level.'),
    o('slight_dutch', '少し傾ける', 'with a slight Dutch viewing angle', 'Use a slightly tilted viewing angle.'),
    o('dutch', '大きく傾ける', 'with a Dutch viewing angle', 'Use a noticeable Dutch viewing angle.')
  ];
})(window);
