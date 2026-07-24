(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa) { return { id: id, labelJa: labelJa }; }

  D.restraintTypes = [
    o('none', 'なし'),
    o('rope', '縄'),
    o('chain', '鎖'),
    o('cuffs', '手錠'),
    o('straps', 'ストラップ')
  ];
  D.restraintPlacements = [
    o('none', '指定なし'),
    o('wrists_front', '両手首を前'),
    o('wrists_behind', '両手首を後ろ'),
    o('wrists_overhead', '両手首を頭上'),
    o('one_wrist', '片手首'),
    o('chair_armrests', '椅子の肘掛け'),
    o('ankles', '両足首'),
    o('torso_and_arms', '腕と胴体')
  ];
  D.restraintAnchors = [
    o('none', '固定先なし'),
    o('wall', '壁'),
    o('pillar', '柱'),
    o('chair', '椅子'),
    o('overhead_fixture', '頭上の固定具')
  ];
  D.restraintTensions = [
    o('loose', '緩く巻く'),
    o('secured', 'しっかり固定'),
    o('decorative', '装飾的に巻く')
  ];
  D.restraintFreeArms = [
    o('none', '指定なし'),
    o('left', '左腕が自由'),
    o('right', '右腕が自由')
  ];
})(window);
