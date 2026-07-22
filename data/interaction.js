(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed) { return { id: id, labelJa: labelJa, compact: compact, detailed: detailed }; }
  D.interactionTargets = [
    o('none', '指定しない', '', ''),
    o('viewer', '画面外の相手', '', '')
  ];
  D.interactionDistances = [
    o('normal', '通常', '', ''),
    o('close', '近い', 'at close conversational distance', 'The figure is positioned at close conversational distance.'),
    o('very_close', 'とても近い', 'at very close face-to-face distance', 'The figure is framed at a very close face-to-face distance.')
  ];
  D.interactionApproaches = [
    o('none', '動きなし', '', ''),
    o('lean_toward', '相手へ身を寄せる', 'leaning toward the viewer', 'The figure leans toward the viewer.'),
    o('lean_away', '相手から少し身を引く', 'leaning slightly away from the viewer', 'The figure leans slightly away from the viewer.'),
    o('reach_toward', '相手へ手を伸ばす', 'reaching toward the viewer', 'The figure reaches toward the viewer.'),
    o('approaching', '相手へ近づく', 'moving toward the viewer', 'The figure moves toward the viewer.')
  ];
})(window);
