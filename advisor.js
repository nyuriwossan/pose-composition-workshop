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
    if (s.pose.pelvis.orientation === 'away' && s.pose.head.yaw === 'toward_camera') out.push(issue('strong_turn', 'warning', 'head', '首と胴体に強いひねりが必要です', '背中向きの身体から顔を正面へ戻すため、画像生成で崩れやすくなります。', ['pose.pelvis.orientation', 'pose.head.yaw'], [
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
