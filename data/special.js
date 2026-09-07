(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function preset(id, nameJa, descriptionJa, patch) {
    return {
      id: id,
      nameJa: nameJa,
      descriptionJa: descriptionJa,
      patch: patch,
      meta: {
        collection: 'special',
        poseFamily: 'restraint',
        audienceTags: [],
        moodTags: [],
        sceneTags: ['restraint_stage'],
        interactionTags: []
      }
    };
  }
  function basePose(posture) {
    return {
      posture: posture,
      motion: { state: 'static' },
      support: { type: 'unsupported' },
      lyingOrientation: 'none',
      supportPose: 'none',
      flowStyle: null,
      rearViewEmphasis: 'none',
      weight: posture === 'standing' ? 'even' : null,
      lowerBody: {
        stance: posture === 'standing' ? 'relaxed' : null,
        legRelation: posture === 'standing' ? 'parallel' : null,
        knee: posture === 'standing' ? 'straight' : 'both_bent'
      },
      pelvis: { orientation: 'camera', shift: 'none' },
      torso: { relationToPelvis: 'aligned', lean: 'neutral' },
      shoulders: { emphasis: 'relaxed' },
      arms: { mode: 'separate', primary: { action: null }, secondary: { action: null }, combined: null },
      head: { yaw: 'toward_camera', pitch: 'neutral', tilt: 'level' },
      gaze: { target: 'viewer', direction: 'direct', eyes: 'open' },
      expression: 'neutral'
    };
  }
  function basePatch(pose, restraint) {
    return {
      subject: { count: 1 },
      pose: pose,
      restraint: restraint,
      camera: { shotSize: 'full_body', elevation: 'eye_level', roll: 'level' },
      composition: { subjectPlacement: 'centered', negativeSpace: 'around', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'stable' },
      output: { includeSolo: true }
    };
  }

  var p1 = basePose('standing');
  var p2 = basePose('standing');
  p2.pelvis.orientation = 'away_camera';
  p2.rearViewEmphasis = 'full_back_line';
  p2.head.yaw = 'over_shoulder';
  p2.gaze.direction = 'over_shoulder';
  p2.shoulders.emphasis = 'one_forward';
  var p3 = basePose('kneeling');
  p3.supportPose = 'kneeling_upright';
  p3.lowerBody.legRelation = 'kneeling_both';
  p3.lowerBody.knee = 'both_bent';
  var p4 = basePose('sitting');
  p4.support.type = 'seated_surface';
  p4.lowerBody.legRelation = 'parallel';
  p4.lowerBody.knee = 'both_bent';
  var p5 = basePose('standing');
  p5.pelvis.orientation = 'three_quarter';
  p5.head.yaw = 'over_shoulder';
  p5.gaze.direction = 'over_shoulder';
  var p6 = basePose('standing');
  var p7 = basePose('sitting');
  p7.support.type = 'seated_surface';
  p7.lowerBody.legRelation = 'parallel';
  p7.lowerBody.knee = 'both_bent';
  var p8 = basePose('standing');
  p8.shoulders.emphasis = 'drawn_back';

  var specialPresets = [
    preset('special_rope_wrists_front_standing', '両手首を前で縄に縛られて立つ', '両手首だけを前方で緩くまとめ、Viewerを見る非損傷の立ち姿。', basePatch(p1, { type: 'rope', placement: 'wrists_front', anchor: 'none', tension: 'loose', freeArm: 'none' })),
    preset('special_rope_wrists_behind_turn', '両手を後ろで縛られ、肩越しに振り返る', '胴体と骨盤は奥向きのまま、腰の後ろの両手と顔だけを見せる背面構図。', basePatch(p2, { type: 'rope', placement: 'wrists_behind', anchor: 'none', tension: 'secured', freeArm: 'none' })),
    preset('special_rope_wrists_front_kneeling', '両手首を前で縛られて膝立ち', '両膝で身体を支え、前方でまとめた手を膝上付近へ置く構図。', basePatch(p3, { type: 'rope', placement: 'wrists_front', anchor: 'none', tension: 'loose', freeArm: 'none' })),
    preset('special_chair_armrests_restraint', '椅子に座り、両手首を肘掛けへ固定', '椅子へ正面向きで座り、左右の手首を別々の肘掛けへ固定する構図。', basePatch(p4, { type: 'straps', placement: 'chair_armrests', anchor: 'chair', tension: 'secured', freeArm: 'none' })),
    preset('special_chain_one_wrist_wall_turn', '片手首を鎖で壁や柱へつながれて振り返る', '片手首だけを壁側へ固定し、もう片方の腕を自由に残して振り返る構図。', basePatch(p5, { type: 'chain', placement: 'one_wrist', anchor: 'wall', tension: 'secured', freeArm: 'right' })),
    preset('special_wrists_overhead_standing', '両手首を頭上で固定されて立つ', '両足を床につけて脚で身体を支え、吊り下げにならない頭上固定の立ち姿。', basePatch(p6, { type: 'cuffs', placement: 'wrists_overhead', anchor: 'overhead_fixture', tension: 'secured', freeArm: 'none' })),
    preset('special_rope_ankles_floor_sitting', '足首を縄で縛られて床に座る', '両膝を軽く曲げて床に座り、縄を両足首だけへ緩く巻く構図。', basePatch(p7, { type: 'rope', placement: 'ankles', anchor: 'none', tension: 'loose', freeArm: 'none' })),
    preset('special_decorative_chain_torso_standing', '腕と胴体へ鎖を緩く巻いた演出的な立ち姿', '首を避け、腕と胴体へ鎖を装飾的に巻くダークファンタジー向け構図。', basePatch(p8, { type: 'chain', placement: 'torso_and_arms', anchor: 'none', tension: 'decorative', freeArm: 'none' }))
  ];

  D.presetCollections = D.presetCollections || {};
  D.presetCollections.special = { labelJa: '特殊・演出' };
  D.presetSceneTagLabels = D.presetSceneTagLabels || {};
  D.presetSceneTagLabels.restraint_stage = '拘束演出';
  D.presets = (D.presets || []).concat(specialPresets);
  D.specialPresetIds = specialPresets.map(function (item) { return item.id; });

  // Adjustable physical poses. The existing restraint collection remains intact.
  function physicalPreset(id, name, description, posture, supportPose, arms, lowerBody, lean) {
    var pose = basePose(posture);
    pose.support.type = 'floor';
    pose.supportPose = supportPose;
    pose.weight = null;
    pose.lowerBody = lowerBody;
    pose.pelvis.orientation = 'side';
    pose.torso.lean = lean || 'neutral';
    pose.arms = { mode: 'combined', primary: { action: null }, secondary: { action: null }, combined: arms };
    pose.head = { yaw: 'side', pitch: 'neutral', tilt: 'level' };
    pose.gaze = { target: null, direction: null, eyes: 'open' };
    var patch = basePatch(pose, { type: 'none', placement: 'none', anchor: 'none', tension: 'loose', freeArm: 'none' });
    var item = preset(id, name, description, patch);
    item.meta.poseFamily = 'special_pose';
    item.meta.sceneTags = ['movement_study'];
    return item;
  }
  var physicalPresets = [
    physicalPreset('special_dogeza', '土下座', '床に両手と両膝をつき、腰をかかと側へ下ろして深く頭を下げるお辞儀。', 'kneeling', 'kneeling_bow', 'palms_on_floor', { stance: null, legRelation: 'kneeling_both', knee: 'both_bent' }, 'forward'),
    physicalPreset('special_arms_up_stretch', '両腕を上げるストレッチ', '両足で立ち、両腕を頭上へ伸ばす全身ストレッチ。', 'standing', 'none', 'arms_up', { stance: 'shoulder_width', legRelation: 'parallel', knee: 'straight' }),
    physicalPreset('special_sonkyo', '蹲踞', 'かかとを上げ、両足の前部でバランスを取りながら深く腰を落とす構え。', 'squatting', 'sonkyo', 'hands_on_knees', { stance: null, legRelation: 'knees_apart', knee: 'both_bent' }),
    physicalPreset('special_shiko_stance', '四股の構え', '両足を広く床につけ、膝に手を置いて低く構える。片脚を上げる動作前の姿勢。', 'squatting', 'shiko_stance', 'hands_on_knees', { stance: 'wide', legRelation: 'knees_apart', knee: 'both_bent' }),
    physicalPreset('special_i_balance', 'I字バランス', '片脚で立ち、もう片脚を縦に上げて足首を両手で支える全身バランス。', 'standing', 'standing_split', 'holding_raised_ankle', { stance: null, legRelation: null, knee: 'straight' }),
    physicalPreset('special_leapfrog_base', '馬跳びの馬', '足を広げて前屈し、膝に両手を置いて背中を床と平行に保つ姿勢。', 'standing', 'leapfrog_base', 'hands_on_knees', { stance: 'wide', legRelation: 'parallel', knee: 'both_bent' }, 'forward'),
    physicalPreset('special_forward_bend', '前屈', '両足を床につけて股関節から前へ折り、両腕を床へ垂らすストレッチ。', 'standing', 'forward_bend', 'arms_hanging_down', { stance: 'together', legRelation: 'parallel', knee: 'straight' }, 'forward'),
    physicalPreset('special_bridge_pose', 'ブリッジ', '手のひらと足裏の四点で身体を支え、背中を反らして胴体を持ち上げる姿勢。', 'bridge', 'bridge_pose', 'bridge_support', { stance: null, legRelation: 'parallel', knee: 'both_bent' })
  ];
  D.presetSceneTagLabels.movement_study = '運動・姿勢研究';
  D.presets = D.presets.concat(physicalPresets);
  D.physicalPresetIds = physicalPresets.map(function (item) { return item.id; });
})(window);
