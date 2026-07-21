(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function arm(id, labelJa, compact, detailed, hands, postures, zones) {
    return { id: id, labelJa: labelJa, prompt: { compact: compact, detailed: detailed }, resources: { hands: hands }, postures: postures || null, zones: zones || ['arms', 'hands'] };
  }
  D.armActions = [
    arm('relaxed_at_side', '体側へ自然に下ろす', 'arm hanging relaxed at the side', 'The arm hangs naturally at the side.', 0),
    arm('hand_on_hip', '片手を腰に添える', 'hand resting on the hip', 'The hand rests naturally on the hip.', 1, ['standing', 'sitting', 'kneeling', 'one_knee_kneeling'], ['arms', 'hands', 'torso']),
    arm('hand_near_chest', '胸元へ手を添える', 'hand held near the chest', 'The hand is held near the chest.', 1, null, ['arms', 'hands_near_chest']),
    arm('hand_touching_chin', '顎に手を添える', 'hand touching the chin', 'The hand touches the chin in a thoughtful gesture.', 1, null, ['hands_near_face']),
    arm('hand_touching_cheek', '頬に手を添える', 'hand touching the cheek', 'The hand gently touches the cheek.', 1, null, ['hands_near_face']),
    arm('hand_in_hair', '髪に手を入れる', 'hand resting in the hair', 'The hand rests lightly in the hair.', 1, null, ['hands_near_face']),
    arm('hand_in_pocket', 'ポケットに手を入れる', 'hand placed in a pocket', 'The hand is placed in a pocket.', 1, ['standing', 'walking'], ['arms', 'hands', 'torso']),
    arm('across_body', '腕を体の前へ', 'arm crossing the body', 'The arm crosses softly in front of the body.', 0),
    arm('behind_back', '腕を背中側へ', 'arm held behind the back', 'The arm is held behind the back.', 0),
    arm('reaching_forward', '前へ伸ばす', 'arm reaching forward', 'The arm reaches forward.', 0, ['standing', 'sitting', 'walking', 'kneeling']),
    arm('partially_out', '画面外へ逃がす', 'arm partially out of frame', 'The arm extends partially out of frame.', 0)
  ];
  D.combinedArms = [
    arm('arms_crossed', '腕を組む', 'arms crossed naturally across the chest', 'Both arms are crossed naturally across the chest.', 2, ['standing', 'sitting'], ['arms', 'hands_near_chest']),
    arm('hands_clasped', '両手を組む', 'hands clasped together', 'Both hands are clasped together.', 2),
    arm('hands_behind_back', '両手を背中側で組む', 'both hands held behind the back', 'Both hands are held together behind the back.', 2, ['standing', 'walking']),
    arm('hands_on_lap', '両手を膝上に置く', 'both hands resting on the lap', 'Both hands rest naturally on the lap.', 2, ['sitting'], ['arms', 'hands', 'torso'])
  ];
})(window);
