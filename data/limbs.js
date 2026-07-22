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
    arm('hand_near_face', '顔の近くへ手を添える', 'hand held near the face', 'The hand is held softly near the face.', 1, null, ['hands_near_face']),
    arm('hand_covering_eyes', '片手で目元を隠す', 'hand covering the eyes', 'The hand covers the eyes as if hiding the expression.', 1, null, ['hands_near_face']),
    arm('hand_covering_mouth', '片手で口元を隠す', 'hand lightly covering the mouth', 'The hand lightly covers the mouth.', 1, null, ['hands_near_face']),
    arm('finger_heart_near_face', '顔の近くで指ハート', 'finger heart held near the face', 'The hand makes a finger heart near the face.', 1, null, ['hands_near_face']),
    arm('hand_in_pocket', 'ポケットに手を入れる', 'hand placed in a pocket', 'The hand is placed in a pocket.', 1, ['standing', 'walking'], ['arms', 'hands', 'torso']),
    arm('across_body', '腕を体の前へ', 'arm crossing the body', 'The arm crosses softly in front of the body.', 0),
    arm('behind_back', '腕を背中側へ', 'arm held behind the back', 'The arm is held behind the back.', 0),
    arm('reaching_forward', '前へ伸ばす', 'arm reaching forward', 'The arm reaches forward.', 0, ['standing', 'sitting', 'walking', 'kneeling']),
    arm('reaching_forward_soft', 'やさしく前へ伸ばす', 'arm reaching gently toward the viewer', 'The arm reaches gently toward the viewer.', 0, ['standing', 'sitting', 'walking', 'kneeling']),
    arm('pinching_toward_viewer', '相手の頬へ指を伸ばす', 'hand lightly pinching the viewer’s cheek', 'The hand reaches forward as if lightly pinching the viewer’s cheek.', 1, ['standing', 'sitting'], ['arms', 'hands']),
    arm('supporting_body', '片腕で上体を支える', 'one arm supporting the upper body', 'One arm supports the upper body.', 0, ['sitting', 'reclining', 'kneeling']),
    arm('resting_on_thigh', '手を太ももへ置く', 'hand resting on the thigh', 'The hand rests on the thigh.', 1, ['sitting', 'kneeling', 'one_knee_kneeling']),
    arm('partially_out', '画面外へ逃がす', 'arm partially out of frame', 'The arm extends partially out of frame.', 0)
  ];
  D.combinedArms = [
    arm('arms_crossed', '腕を組む', 'arms crossed naturally across the chest', 'Both arms are crossed naturally across the chest.', 2, ['standing', 'sitting'], ['arms', 'hands_near_chest']),
    arm('hands_clasped', '両手を組む', 'hands clasped together', 'Both hands are clasped together.', 2),
    arm('hands_behind_back', '両手を背中側で組む', 'both hands held behind the back', 'Both hands are held together behind the back.', 2, ['standing', 'walking']),
    arm('hands_on_lap', '両手を膝上に置く', 'both hands resting on the lap', 'Both hands rest naturally on the lap.', 2, ['sitting'], ['arms', 'hands', 'torso']),
    arm('supporting_upper_body', '両腕で上体を支える', 'both arms supporting the upper body', 'Both arms support the upper body.', 2, ['standing', 'sitting', 'kneeling', 'reclining'], ['arms', 'hands', 'torso']),
    arm('heart_hands_near_face', '顔の近くで両手ハート', 'forming a heart shape with both hands near the face', 'Both hands form a heart shape near the face.', 2, null, ['hands_near_face']),
    arm('arms_open_toward_viewer', '相手へ両腕を広げる', 'opening both arms toward the viewer', 'Both arms open toward the viewer.', 2, ['standing', 'sitting'], ['arms', 'hands', 'torso'])
  ];
})(window);
