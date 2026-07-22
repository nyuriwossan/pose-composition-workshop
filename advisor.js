(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data;
  var S = PCW.state;

  function issue(id, severity, category, titleJa, messageJa, relatedPaths, resolutions) {
    return { id: id, severity: severity, category: category, titleJa: titleJa, messageJa: messageJa, relatedPaths: relatedPaths || [], resolutions: resolutions || [] };
  }
  function armDef(id, combined) { return S.option(combined ? D.combinedArms : D.armActions, id); }
  function handUsage(state) {
    var arms = state.pose.arms;
    if (arms.mode === 'combined' && arms.combined) {
      var combined = armDef(arms.combined, true);
      return combined ? combined.resources.hands : 0;
    }
    return ['primary', 'secondary'].reduce(function (sum, slot) {
      var item = armDef(arms[slot].action, false);
      return sum + (item ? item.resources.hands : 0);
    }, 0);
  }
  function hidden(zone, shotSize) {
    var v = D.shotVisibility[shotSize];
    if (!v || (v.visible || []).indexOf('all') >= 0) return false;
    return (v.hidden || []).indexOf(zone) >= 0;
  }
  function armHidden(item, shotSize) {
    if (!item) return false;
    var zones = item.zones || ['arms', 'hands'];
    if (zones.indexOf('hands_near_face') >= 0) return hidden('hands_near_face', shotSize);
    if (zones.indexOf('hands_near_chest') >= 0) return hidden('hands_near_chest', shotSize);
    if (zones.indexOf('hands') >= 0 && hidden('hands', shotSize)) return true;
    return zones.indexOf('arms') >= 0 && hidden('arms', shotSize);
  }
  function visibilityIssues(s, out) {
    var shot = s.camera.shotSize;
    if (!shot) return;
    var lowerSet = s.pose.weight || s.pose.lowerBody.stance || s.pose.lowerBody.legRelation || s.pose.lowerBody.knee;
    if (lowerSet && hidden('lowerBody', shot)) out.push(issue('lower_body_hidden', 'info', 'visibility', '脚の設定は現在の画角に写りません', '設定は保持されています。全身寄りの画角へ戻すと、再びプロンプトへ出力されます。', ['camera.shotSize', 'pose.lowerBody'], [
      { labelJa: '全身へ変更', patch: { 'camera.shotSize': 'full_body' } },
      { labelJa: '脚の設定を消す', patch: { 'pose.weight': null, 'pose.lowerBody.stance': null, 'pose.lowerBody.legRelation': null, 'pose.lowerBody.knee': null } }
    ]));
    var arms = s.pose.arms;
    var chosen = arms.mode === 'combined' ? [armDef(arms.combined, true)] : [armDef(arms.primary.action, false), armDef(arms.secondary.action, false)];
    if (chosen.some(function (item) { return armHidden(item, shot); })) out.push(issue('arm_detail_hidden', 'info', 'visibility', '腕・手の一部が現在の画角に写りません', '画角外の指定は保持しますが、プロンプトには出力しません。', ['camera.shotSize', 'pose.arms'], [
      { labelJa: '腰上へ変更', patch: { 'camera.shotSize': 'waist_up' } }
    ]));
    if (shot === 'knee_up' && s.pose.lowerBody.footDirection) out.push(issue('feet_hidden_knee_up', 'warning', 'visibility', '足先は膝上の画角に写りません', '足先の細かな向きは、この画角では効果が期待できません。', ['camera.shotSize', 'pose.lowerBody.footDirection'], []));
  }
  function interactionIssues(s, out) {
    if (s.interaction.target !== 'viewer') return;
    var high = ['slightly_high', 'high', 'top_down'].indexOf(s.camera.elevation) >= 0;
    var low = ['slightly_low', 'low'].indexOf(s.camera.elevation) >= 0;
    if (high && s.pose.gaze.direction === 'downward') out.push(issue('viewer_high_gaze_mismatch', 'warning', 'interaction', '高い相手への視線が下向きです', '相手視点ではカメラ位置が相手の位置です。高いカメラには上向きの視線が自然です。', ['camera.elevation', 'pose.gaze'], [
      { labelJa: '相手を見上げる', patch: { 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'upward' } }
    ]));
    if (low && s.pose.gaze.direction === 'upward') out.push(issue('viewer_low_gaze_mismatch', 'warning', 'interaction', '低い相手への視線が上向きです', '相手視点ではカメラ位置が相手の位置です。低いカメラには下向きの視線が自然です。', ['camera.elevation', 'pose.gaze'], [
      { labelJa: '相手を見下ろす', patch: { 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'downward' } }
    ]));
    if (s.pose.gaze.target !== 'viewer') out.push(issue('viewer_gaze_target_elsewhere', 'info', 'interaction', '視線が画面外の相手を向いていません', '距離や動きは相手基準ですが、視線対象は別に設定されています。', ['interaction.target', 'pose.gaze.target'], [
      { labelJa: '相手を見る', patch: { 'pose.gaze.target': 'viewer' } }
    ]));
    if (s.interaction.distance === 'very_close' && ['full_body', 'wide', 'wide_shot'].indexOf(s.camera.shotSize) >= 0) out.push(issue('viewer_distance_shot_mismatch', 'warning', 'interaction', 'とても近い距離と全身画角が両立しにくいです', '相手との接近感を保つなら、半身またはアップの画角が安定します。', ['interaction.distance', 'camera.shotSize'], [
      { labelJa: '腰上へ変更', patch: { 'camera.shotSize': 'waist_up' } },
      { labelJa: '距離を通常へ戻す', patch: { 'interaction.distance': 'normal' } }
    ]));
    var actions = [s.pose.arms.primary.action, s.pose.arms.secondary.action];
    var reachActions = ['reaching_forward', 'reaching_forward_soft', 'pinching_toward_viewer'];
    if (s.interaction.approach === 'reach_toward' && !actions.some(function (action) { return reachActions.indexOf(action) >= 0; })) out.push(issue('viewer_reach_without_arm', 'info', 'interaction', '相手へ伸ばす腕が未設定です', '片方の腕へ「前へ伸ばす」を設定すると、動きが具体的になります。', ['interaction.approach', 'pose.arms'], [
      { labelJa: '片方の腕を伸ばす', patch: { 'pose.arms.mode': 'separate', 'pose.arms.primary.action': 'reaching_forward', 'pose.arms.combined': null } }
    ]));
    if (s.interaction.approach === 'lean_toward' && s.pose.torso.lean !== 'forward') out.push(issue('viewer_lean_toward_body_mismatch', 'info', 'interaction', '身を寄せる動きと上半身の傾きが揃っていません', '前傾を加えると、相手へ近づく動きが伝わりやすくなります。', ['interaction.approach', 'pose.torso.lean'], [
      { labelJa: '上半身を前へ傾ける', patch: { 'pose.torso.lean': 'forward' } }
    ]));
    if (s.interaction.approach === 'lean_away' && s.pose.torso.lean !== 'backward') out.push(issue('viewer_lean_away_body_mismatch', 'info', 'interaction', '身を引く動きと上半身の傾きが揃っていません', '後方への傾きを加えると、相手から身を引く動きが伝わりやすくなります。', ['interaction.approach', 'pose.torso.lean'], [
      { labelJa: '上半身を後ろへ傾ける', patch: { 'pose.torso.lean': 'backward' } }
    ]));
  }
  function check(raw) {
    var s = S.normalize(raw);
    var out = [];
    var arms = s.pose.arms;
    if (arms.combined && (arms.primary.action || arms.secondary.action)) out.push(issue('combined_with_individual_arms', 'hard', 'arms', '両腕ポーズと片腕ポーズが重複しています', '両腕を使うポーズと個別の腕動作は同時に成立しません。', ['pose.arms'], [
      { labelJa: '両腕ポーズを残す', patch: { 'pose.arms.mode': 'combined', 'pose.arms.primary.action': null, 'pose.arms.secondary.action': null } },
      { labelJa: '個別の腕を残す', patch: { 'pose.arms.mode': 'separate', 'pose.arms.combined': null } }
    ]));
    if (handUsage(s) > 2) out.push(issue('too_many_hands', 'hard', 'arms', '使用する手が2本を超えています', '一人用の設計では、使える手は2本までです。', ['pose.arms'], [
      { labelJa: '反対の手を解除', patch: { 'pose.arms.secondary.action': null } }
    ]));
    if (s.pose.gaze.eyes === 'closed' && s.pose.gaze.target === 'viewer' && s.pose.gaze.direction === 'direct') out.push(issue('closed_eyes_direct_gaze', 'hard', 'gaze', '閉じた目でこちらを見ることはできません', '目を開けるか、視線の指定を解除してください。', ['pose.gaze'], [
      { labelJa: '目を開ける', patch: { 'pose.gaze.eyes': 'open' } },
      { labelJa: '視線を解除', patch: { 'pose.gaze.target': null, 'pose.gaze.direction': null } }
    ]));
    if (s.pose.posture === 'walking' && s.pose.motion.state === 'static') out.push(issue('static_walking', 'hard', 'motion', '歩行と静止が競合しています', '歩行姿勢には動作途中または準備中の状態を指定してください。', ['pose.posture', 'pose.motion.state'], [
      { labelJa: '動作途中にする', patch: { 'pose.motion.state': 'mid_motion' } },
      { labelJa: '立位に戻す', patch: { 'pose.posture': 'standing' } }
    ]));
    if (s.pose.lyingOrientation !== 'none' && ['bed_surface', 'sofa_surface', 'leaning_surface'].indexOf(s.pose.support.type) < 0) out.push(issue('lying_without_surface', 'info', 'support', '寝姿を支える面が未設定です', 'ベッドやソファなどの支持状態を選ぶと、寝姿が伝わりやすくなります。', ['pose.lyingOrientation', 'pose.support.type'], [
      { labelJa: 'ベッド上にする', patch: { 'pose.support.type': 'bed_surface' } }
    ]));
    if (s.pose.support.type === 'bed_surface' && s.pose.posture === 'reclining' && s.pose.lyingOrientation === 'none') out.push(issue('bed_orientation_missing', 'info', 'support', 'ベッド上の寝る向きが未設定です', '仰向け・横向き・うつ伏せのいずれかを選ぶと構図が明確になります。', ['pose.support.type', 'pose.lyingOrientation'], []));
    if (s.pose.supportPose === 'hands_and_knees' && s.pose.posture !== 'kneeling') out.push(issue('hands_and_knees_posture_mismatch', 'warning', 'support', '四点支持と基本姿勢が揃っていません', '手のひらと両膝で支える場合は、基本姿勢も膝をつく状態にすると寝姿や立ち姿へ崩れにくくなります。', ['pose.supportPose', 'pose.posture'], [
      { labelJa: '基本姿勢を膝つきにする', patch: { 'pose.posture': 'kneeling', 'pose.lowerBody.legRelation': 'kneeling_both', 'pose.lowerBody.knee': 'both_bent' } }
    ]));
    if (s.pose.supportPose === 'kneeling_upright' && s.pose.posture !== 'kneeling') out.push(issue('kneeling_upright_posture_mismatch', 'warning', 'support', '膝立ちと基本姿勢が揃っていません', '膝立ちを維持するには、基本姿勢も両膝をつく状態にしてください。', ['pose.supportPose', 'pose.posture'], [
      { labelJa: '基本姿勢を膝つきにする', patch: { 'pose.posture': 'kneeling', 'pose.lowerBody.legRelation': 'kneeling_both', 'pose.lowerBody.knee': 'both_bent' } }
    ]));
    if (['forward_lean_support', 'leaning_forward_on_hands'].indexOf(s.pose.supportPose) >= 0 && s.pose.torso.lean !== 'forward') out.push(issue('forward_support_lean_mismatch', 'info', 'support', '前傾支持と上半身の傾きが揃っていません', '上半身を前へ傾けると、支持姿勢が普通の立ち姿や座り姿へ戻りにくくなります。', ['pose.supportPose', 'pose.torso.lean'], [
      { labelJa: '上半身を前へ傾ける', patch: { 'pose.torso.lean': 'forward' } }
    ]));
    if (s.pose.supportPose === 'hands_and_knees' && s.pose.lyingOrientation !== 'none') out.push(issue('hands_and_knees_lying_mismatch', 'info', 'support', '四点支持に寝る向きが重なっています', 'うつ伏せなどの寝姿指定を外すと、身体を面へ寝かせず四点で支える構造が明確になります。', ['pose.supportPose', 'pose.lyingOrientation'], [
      { labelJa: '寝る向きを指定なしにする', patch: { 'pose.lyingOrientation': 'none' } }
    ]));
    var gestureIds = ['heart_hands_near_face', 'finger_heart_near_face', 'reaching_forward_soft', 'pinching_toward_viewer'];
    var gestureSet = gestureIds.indexOf(s.pose.arms.combined) >= 0 || gestureIds.indexOf(s.pose.arms.primary.action) >= 0 || gestureIds.indexOf(s.pose.arms.secondary.action) >= 0;
    if (gestureSet && ['full_body', 'wide', 'wide_shot'].indexOf(s.camera.shotSize) >= 0) out.push(issue('affection_gesture_too_wide', 'warning', 'visibility', '顔まわりの仕草には画角が広すぎます', 'アップまたは半身にすると、手と表情の関係が伝わりやすくなります。', ['pose.arms', 'camera.shotSize'], [
      { labelJa: 'バストショットへ変更', patch: { 'camera.shotSize': 'bust_shot' } }
    ]));
    if (s.pose.rearViewEmphasis !== 'none' && ['camera', 'three_quarter'].indexOf(s.pose.pelvis.orientation) >= 0) out.push(issue('rear_view_pelvis_mismatch', 'warning', 'bodyFlow', '背面強調と骨盤の向きが揃っていません', '背面を強調していますが、骨盤が正面または斜め前を向いています。背中を見せたい場合は、骨盤を「背中向き」へ変更してください。', ['pose.rearViewEmphasis', 'pose.pelvis.orientation'], [
      { labelJa: '骨盤を背中向きにする', patch: { 'pose.pelvis.orientation': 'away_camera' } }
    ]));
    if (s.pose.rearViewEmphasis !== 'none' && s.pose.head.yaw === 'toward_camera') out.push(issue('rear_view_head_mismatch', 'info', 'head', '背面構図で顔が正面を向いています', '背中を残したまま顔を見せる場合は「肩越しに振り返る」がおすすめです。', ['pose.rearViewEmphasis', 'pose.head.yaw', 'pose.gaze'], [
      { labelJa: '肩越しに振り返る', patch: { 'pose.head.yaw': 'over_shoulder', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'over_shoulder' } }
    ]));
    if (['back_and_waist', 'full_back_line', 'rear_pose_emphasis'].indexOf(s.pose.rearViewEmphasis) >= 0 && ['toward_camera', 'counter'].indexOf(s.pose.torso.relationToPelvis) >= 0) out.push(issue('rear_view_torso_mismatch', 'warning', 'bodyFlow', '背中主役なのに胴体が正面へ戻りやすい指定です', '顔だけを振り返らせ、胴体と骨盤は奥向きのまま揃えると背中のラインを維持できます。', ['pose.rearViewEmphasis', 'pose.torso.relationToPelvis'], [
      { labelJa: '胴体を骨盤へ揃える', patch: { 'pose.torso.relationToPelvis': 'aligned', 'pose.head.yaw': 'over_shoulder' } }
    ]));
    if (s.pose.rearViewEmphasis === 'back_and_shoulders' && ['face_close_up', 'headshot'].indexOf(s.camera.shotSize) >= 0) out.push(issue('rear_view_shot_too_close', 'info', 'visibility', '背中と肩を見せるには画角が近すぎます', '上半身まで写すと、背中と肩を残した構図が安定します。', ['pose.rearViewEmphasis', 'camera.shotSize'], [
      { labelJa: '上半身へ変更', patch: { 'camera.shotSize': 'upper_body' } }
    ]));

    var weight = S.option(D.weights, s.pose.weight);
    if (weight && !S.validForPosture(weight, s.pose.posture)) out.push(issue('weight_posture_mismatch', 'warning', 'lowerBody', '姿勢に合わない重心指定です', '「' + weight.labelJa + '」は主に別の姿勢で使う指定です。', ['pose.posture', 'pose.weight'], [
      { labelJa: '重心を解除', patch: { 'pose.weight': null } },
      { labelJa: '重心を低くする', patch: { 'pose.weight': 'lowered' } }
    ]));
    ['stance', 'legRelation', 'knee'].forEach(function (field) {
      var list = field === 'stance' ? D.stances : field === 'legRelation' ? D.legRelations : D.knees;
      var item = S.option(list, s.pose.lowerBody[field]);
      if (item && !S.validForPosture(item, s.pose.posture)) out.push(issue('lower_' + field + '_mismatch', 'warning', 'lowerBody', '姿勢に合わない脚の指定です', '「' + item.labelJa + '」は現在の姿勢では崩れやすい指定です。', ['pose.posture', 'pose.lowerBody.' + field], [
        { labelJa: 'この脚指定を解除', patch: (function () { var p = {}; p['pose.lowerBody.' + field] = null; return p; })() }
      ]));
    });
    if (['away', 'away_camera'].indexOf(s.pose.pelvis.orientation) >= 0 && s.pose.head.yaw === 'toward_camera') out.push(issue('strong_turn', 'warning', 'head', '首と胴体に強いひねりが必要です', '背中向きの身体から顔を正面へ戻すため、画像生成で崩れやすくなります。', ['pose.pelvis.orientation', 'pose.head.yaw'], [
      { labelJa: '肩越しに振り返る', patch: { 'pose.head.yaw': 'over_shoulder', 'pose.gaze.direction': 'over_shoulder' } },
      { labelJa: '身体を斜め向きにする', patch: { 'pose.pelvis.orientation': 'three_quarter' } }
    ]));
    if (s.composition.subjectPlacement === 'centered' && s.camera.roll !== 'level') out.push(issue('center_dutch_tension', 'warning', 'composition', '中央配置とカメラ傾斜が競合しやすいです', '安定した中央配置と斜めの画面軸では、意図が弱くなることがあります。', ['composition.subjectPlacement', 'camera.roll'], [
      { labelJa: 'カメラを水平にする', patch: { 'camera.roll': 'level' } },
      { labelJa: '人物を少しずらす', patch: { 'composition.subjectPlacement': 'left_of_center', 'composition.negativeSpace': 'right' } }
    ]));
    var recommendedSpace = { left: 'right', left_of_center: 'right', right: 'left', right_of_center: 'left' }[s.composition.subjectPlacement];
    if (recommendedSpace && s.composition.negativeSpace !== recommendedSpace) out.push(issue('negative_space_recommendation', 'info', 'composition', '人物の反対側に余白を取れます', '視線や動きの抜けを作るため、' + (recommendedSpace === 'right' ? '右' : '左') + '側の余白をおすすめします。', ['composition.subjectPlacement', 'composition.negativeSpace'], [
      { labelJa: (recommendedSpace === 'right' ? '右' : '左') + '側に余白', patch: { 'composition.negativeSpace': recommendedSpace } }
    ]));
    visibilityIssues(s, out);
    interactionIssues(s, out);

    var ignored = s.meta.ignoredWarnings || [];
    out.forEach(function (item) { item.ignored = item.severity !== 'hard' && ignored.indexOf(item.id) >= 0; });
    var rank = { hard: 0, warning: 1, info: 2 };
    out.sort(function (a, b) { return rank[a.severity] - rank[b.severity]; });
    return out;
  }
  function summary(raw) {
    var list = check(raw);
    return list.reduce(function (acc, item) { acc[item.severity] += item.ignored ? 0 : 1; return acc; }, { hard: 0, warning: 0, info: 0 });
  }
  function isComplete(raw) {
    var s = S.normalize(raw);
    return !!s.pose.posture && !!s.camera.shotSize && summary(s).hard === 0 && handUsage(s) <= 2 && !!(PCW.generator && PCW.generator.compact(s));
  }
  PCW.advisor = { check: check, summary: summary, handUsage: handUsage, hidden: hidden, armHidden: armHidden, isComplete: isComplete };
})(window);
