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
  D.viewerHandInteractions = [
    o('none', '指定なし', '', ''),
    o('reaching', 'Viewerへ片手を差し出す', 'reaching one hand toward the viewer, open palm offered invitingly', 'The figure reaches one hand toward the viewer with an open palm offered invitingly.'),
    o('holding', 'Viewerの手を引く', "holding the viewer's hand, gently leading the viewer forward", "The figure gently holds the viewer's hand and leads the viewer forward."),
    o('half_heart', 'Viewerと半分ハート', "forming half of a heart with one hand, the viewer's hand completing the heart from the foreground, hands near the face", "The figure forms half of a heart with one hand while the viewer's hand completes it from the foreground near the face."),
    o('hand_kiss', 'Viewerの手の甲へ口づける', "gently holding the viewer's hand, bringing the back of the viewer's hand toward the lips, a soft kiss on the back of the hand", "The figure gently holds the viewer's hand and brings its back to the lips for a soft kiss."),
    o('feeding', 'Viewerへ一口差し出す', 'offering a small bite of food toward the viewer', 'The figure offers a small bite of food toward the viewer.'),
    o('cheek_touch', 'Viewerの手を頬へ添える', "guiding the viewer's hand to their cheek, resting their cheek against the viewer's palm, soft eye contact with the viewer", "The figure guides the viewer's hand to their cheek and rests against the viewer's palm with soft eye contact.")
  ];
})(window);
