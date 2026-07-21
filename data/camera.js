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
    o('eye_level', '目線の高さ', 'at eye level', 'Use an eye-level camera.'),
    o('slightly_low', '少し低い', 'from a slightly low angle', 'Place the camera slightly below eye level.'),
    o('low', '低位置', 'from a low angle', 'Use a low-angle camera.'),
    o('slightly_high', '少し高い', 'from a slightly high angle', 'Place the camera slightly above eye level.'),
    o('high', '高位置', 'from a high angle', 'Use a high-angle camera.'),
    o('top_down', '真上寄り', 'from a top-down angle', 'Use a top-down camera angle.')
  ];
  D.rolls = [
    o('level', '水平', '', 'Keep the camera level.'),
    o('slight_dutch', '少し傾ける', 'with a slight Dutch angle', 'Tilt the camera slightly.'),
    o('dutch', '大きく傾ける', 'with a Dutch angle', 'Use a noticeable Dutch angle.')
  ];
})(window);
