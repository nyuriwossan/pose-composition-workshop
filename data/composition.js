(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed) { return { id: id, labelJa: labelJa, compact: compact, detailed: detailed }; }
  D.placements = [
    o('centered', '中央', 'subject centered in the frame', 'Place the subject at the center of the frame.'),
    o('left_of_center', '中央より少し左', 'subject placed left of center', 'Place the subject slightly left of center.'),
    o('left', '左側', 'subject placed on the left side', 'Place the subject on the left side of the frame.'),
    o('right_of_center', '中央より少し右', 'subject placed right of center', 'Place the subject slightly right of center.'),
    o('right', '右側', 'subject placed on the right side', 'Place the subject on the right side of the frame.')
  ];
  D.negativeSpaces = [
    o('none', '意図的な余白なし', '', ''),
    o('left', '左側に余白', 'open space on the left', 'Leave open space on the left.'),
    o('right', '右側に余白', 'open space on the right', 'Leave open space on the right.'),
    o('above', '上側に余白', 'open space above the subject', 'Leave open space above the subject.'),
    o('around', '周囲に余白', 'open space around the subject', 'Leave open space around the subject.')
  ];
  D.crops = [
    o('none', '意図的に切らない', '', ''),
    o('above_knees', '膝より上で切る', 'cropped above the knees', 'Crop the frame above the knees.'),
    o('waist', '腰で切る', 'cropped at the waist', 'Crop the frame at the waist.'),
    o('tight_face', '顔をタイトに切る', 'tight face crop', 'Use a tight crop around the face.'),
    o('edge', '画面端で切る', 'intentional edge crop', 'Let part of the figure leave the frame edge.')
  ];
  D.foregrounds = [
    o('none', '前景なし', 'flat composition', 'Keep the composition visually flat.'),
    o('soft', '柔らかな前景', 'soft foreground framing', 'Use soft foreground framing.'),
    o('layered', '前景を重ねる', 'layered foreground and background', 'Layer foreground and background around the subject.')
  ];
  D.depths = [
    o('flat', '平面的', 'flat depth', 'Keep depth separation minimal.'),
    o('separated', '背景から分離', 'subject separated from the background', 'Separate the subject clearly from the background.'),
    o('layered', '奥行きを重ねる', 'clear foreground-to-background separation', 'Create clear foreground-to-background separation.'),
    o('strong', '奥行きを強く', 'strong depth separation', 'Use strong depth separation.')
  ];
  D.rhythms = [
    o('stable', '安定', 'stable composition', 'Keep the composition stable and balanced.'),
    o('subtle_dynamic', '軽い躍動', 'balanced composition with subtle dynamism', 'Use a balanced composition with subtle dynamism.'),
    o('dynamic', '強い躍動', 'strong diagonal movement through the frame', 'Build strong diagonal movement through the frame.')
  ];
})(window);
