(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  function o(id, labelJa, compact, detailed, postures) {
    return { id: id, labelJa: labelJa, compact: compact, detailed: detailed, postures: postures || null };
  }

  D.weights = [
    o('even', '均等', 'weight evenly balanced', 'The weight is evenly balanced.', ['standing']),
    o('one_leg', '片脚に重心', 'weight shifted onto one leg', 'The weight is shifted onto one leg.', ['standing']),
    o('forward', '前へ重心', 'weight shifted forward', 'The weight shifts forward.', ['standing', 'walking', 'crouching', 'squatting']),
    o('backward', '後ろへ重心', 'weight shifted backward', 'The weight shifts backward.', ['standing', 'sitting']),
    o('lowered', '重心を低く', 'lowered center of gravity', 'The center of gravity is lowered.', ['kneeling', 'one_knee_kneeling', 'crouching', 'squatting'])
  ];
  D.stances = [
    o('together', '足をそろえる', 'feet together', 'The feet are together.', ['standing']),
    o('relaxed', '自然な足幅', 'relaxed stance', 'The feet form a relaxed stance.', ['standing', 'walking']),
    o('shoulder_width', '肩幅', 'shoulder-width stance', 'The feet are set shoulder-width apart.', ['standing', 'crouching']),
    o('wide', '広め', 'wide stance', 'The feet are set in a wide stance.', ['standing', 'crouching', 'squatting'])
  ];
  D.legRelations = [
    o('parallel', '脚を平行に', 'legs held parallel', 'The legs remain parallel.'),
    o('one_forward', '片脚を前へ', 'one leg placed forward', 'One leg is placed forward.', ['standing', 'walking']),
    o('lightly_crossed', '軽く交差', 'legs lightly crossed', 'The legs cross lightly.', ['standing']),
    o('stepping', '一歩踏み出す', 'stepping forward', 'One foot steps forward.', ['walking']),
    o('seated_crossed', '座って脚を組む', 'seated with legs crossed', 'The legs are crossed while seated.', ['sitting']),
    o('kneeling_both', '両膝をつく', 'resting on both knees', 'Both knees support the pose.', ['kneeling'])
  ];
  D.knees = [
    o('straight', '自然に伸ばす', 'knees naturally extended', 'The knees are naturally extended.'),
    o('one_bent', '片膝を少し曲げる', 'one knee slightly bent', 'One knee is slightly bent.'),
    o('both_bent', '両膝を曲げる', 'both knees bent', 'Both knees are bent.'),
    o('one_raised', '片膝を上げる', 'one knee raised', 'One knee is raised.', ['walking', 'sitting'])
  ];
  D.pelvisOrientations = [
    o('camera', '正面', 'pelvis facing the camera', 'The pelvis faces the camera.'),
    o('three_quarter', '斜め', 'pelvis angled three-quarters to the camera', 'The pelvis is angled three-quarters to the camera.'),
    o('side', '横向き', 'pelvis turned side-on to the camera', 'The pelvis is turned side-on to the camera.'),
    o('away', '背中向き', 'pelvis turned away from the camera', 'The pelvis is turned away from the camera.'),
    o('away_camera', '背中向き', 'pelvis turned away from the camera', 'The pelvis is turned away from the camera.')
  ];
  D.pelvisShifts = [
    o('none', 'ずらさない', '', ''),
    o('slight', '腰を少しずらす', 'a slight hip shift', 'The hips shift slightly to one side.'),
    o('pronounced', '腰を大きくずらす', 'a pronounced hip shift', 'The hips shift noticeably to one side.')
  ];
  D.torsoRelations = [
    o('aligned', '骨盤にそろえる', 'torso aligned with the pelvis', 'The torso stays aligned with the pelvis.'),
    o('toward_camera', '上半身をカメラ側へ', 'torso turned slightly toward the camera', 'The torso turns slightly toward the camera.'),
    o('away_camera', '上半身をカメラから外す', 'torso turned slightly away from the camera', 'The torso turns slightly away from the camera.'),
    o('counter', '腰と逆へひねる', 'torso counter-rotated from the pelvis', 'The torso counter-rotates against the pelvis.')
  ];
  D.torsoLeans = [
    o('neutral', '傾けない', '', ''),
    o('forward', '前かがみ', 'torso leaning forward', 'The torso leans forward.'),
    o('backward', '後ろへ反らす', 'torso leaning backward', 'The torso leans backward.'),
    o('sideways', '横へ傾ける', 'torso leaning sideways', 'The torso leans to one side.')
  ];
  D.shoulders = [
    o('level', '水平', 'shoulders level', 'The shoulders stay level.'),
    o('one_forward', '片肩を前へ', 'one shoulder subtly forward', 'One shoulder comes subtly forward.'),
    o('one_lowered', '片肩を下げる', 'one shoulder lowered', 'One shoulder sits lower than the other.'),
    o('drawn_back', '肩を引く', 'shoulders drawn back', 'The shoulders are drawn back.'),
    o('relaxed', '肩の力を抜く', 'shoulders relaxed', 'The shoulders remain relaxed.'),
    o('hunched', '少し肩を丸める', 'shoulders slightly hunched', 'The shoulders hunch slightly.'),
    o('raised', '肩を少し上げる', 'shoulders slightly raised', 'The shoulders lift slightly.'),
    o('both_open', '両肩を開く', 'shoulders open toward the viewer', 'Both shoulders open toward the viewer.')
  ];
})(window);
