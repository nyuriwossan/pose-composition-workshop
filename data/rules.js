(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  D.shotVisibility = {
    face_close_up: { visible: ['head', 'gaze'], partial: ['shoulders', 'hands_near_face'], hidden: ['torso', 'arms', 'hands', 'hands_near_chest', 'lowerBody', 'feet'] },
    headshot: { visible: ['head', 'gaze', 'shoulders'], partial: ['hands_near_face'], hidden: ['torso', 'arms', 'hands', 'hands_near_chest', 'lowerBody', 'feet'] },
    bust_shot: { visible: ['head', 'gaze', 'shoulders', 'hands_near_face', 'hands_near_chest'], partial: ['arms'], hidden: ['hands', 'lowerBody', 'feet'] },
    upper_body: { visible: ['head', 'gaze', 'shoulders', 'torso', 'arms', 'hands_near_face', 'hands_near_chest'], partial: ['hands'], hidden: ['lowerBody', 'feet'] },
    waist_up: { visible: ['head', 'gaze', 'shoulders', 'torso', 'arms', 'hands', 'hands_near_face', 'hands_near_chest'], hidden: ['lowerBody', 'feet'] },
    knee_up: { visible: ['head', 'gaze', 'shoulders', 'torso', 'arms', 'hands', 'hands_near_face', 'hands_near_chest', 'lowerBody'], hidden: ['feet'] },
    full_body: { visible: ['all'], hidden: [] },
    wide: { visible: ['all'], hidden: [] }
  };

  D.guidedRecommendations = {
    standing: { weight: 'one_leg', stance: 'relaxed', legRelation: 'one_forward', knee: 'one_bent', pelvis: 'three_quarter', torso: 'toward_camera', shoulder: 'one_forward' },
    sitting: { weight: null, stance: null, legRelation: 'parallel', knee: 'both_bent', pelvis: 'camera', torso: 'aligned', shoulder: 'relaxed' },
    walking: { weight: 'forward', stance: 'relaxed', legRelation: 'stepping', knee: 'one_bent', pelvis: 'three_quarter', torso: 'counter', shoulder: 'one_forward', motion: 'mid_motion' },
    kneeling: { weight: 'lowered', stance: null, legRelation: 'kneeling_both', knee: 'both_bent', pelvis: 'camera', torso: 'aligned', shoulder: 'relaxed' },
    one_knee_kneeling: { weight: 'lowered', stance: null, legRelation: 'one_forward', knee: 'one_bent', pelvis: 'three_quarter', torso: 'aligned', shoulder: 'relaxed' },
    crouching: { weight: 'lowered', stance: 'wide', legRelation: 'parallel', knee: 'both_bent', pelvis: 'camera', torso: 'forward', shoulder: 'relaxed' },
    squatting: { weight: 'lowered', stance: 'wide', legRelation: 'parallel', knee: 'both_bent', pelvis: 'camera', torso: 'forward', shoulder: 'relaxed' },
    reclining: { weight: null, stance: null, legRelation: 'parallel', knee: 'one_bent', pelvis: 'side', torso: 'aligned', shoulder: 'relaxed' }
  };

  D.hardRuleIds = [
    'combined_with_individual_arms', 'too_many_hands', 'closed_eyes_direct_gaze',
    'static_walking', 'static_running_motion'
  ];
})(window);
