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
    var interactionHand = state.interaction && state.interaction.target === 'viewer' && state.interaction.viewerHandInteraction !== 'none' ? 1 : 0;
    if (arms.mode === 'combined' && arms.combined) {
      var combined = armDef(arms.combined, true);
      return (combined ? combined.resources.hands : 0) + interactionHand;
    }
    return interactionHand + ['primary', 'secondary'].reduce(function (sum, slot) {
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
    if (s.interaction.viewerHandInteraction !== 'none' && s.interaction.viewerHandVisible) out.push(issue('viewer_hand_generation_tip', 'info', 'interaction', 'Viewerの手を含む構図は指や腕が崩れることがあります', 'Viewerの手は手前から片手だけ表示します。アップまたは半身、シンプルな背景にし、別の手振りを重ねないと安定しやすくなります。', ['interaction.viewerHandInteraction', 'interaction.viewerHandVisible', 'camera.shotSize', 'pose.arms'], []));
  }
  function restraintActive(s) {
    return !!(s.restraint && s.restraint.type !== 'none' && s.restraint.placement !== 'none');
  }
  function restraintIssues(s, out) {
    if (!restraintActive(s)) return;
    var placement = s.restraint.placement;
    var bilateralWrists = ['wrists_front', 'wrists_behind', 'wrists_overhead', 'chair_armrests'].indexOf(placement) >= 0;
    var supportUsesBothHands = ['hands_and_knees', 'forward_lean_support', 'leaning_forward_on_hands'].indexOf(s.pose.supportPose) >= 0 ||
      s.pose.arms.mode === 'combined' && s.pose.arms.combined === 'supporting_upper_body';
    var combinedHands = s.pose.arms.mode === 'combined' && !!s.pose.arms.combined;
    var individualActions = [s.pose.arms.primary.action, s.pose.arms.secondary.action].filter(Boolean);
    var viewerHandAction = s.interaction.viewerHandInteraction && s.interaction.viewerHandInteraction !== 'none';
    var isChain = s.restraint.type === 'chain';
    var rearView = s.pose.rearViewEmphasis !== 'none' || ['away', 'away_camera'].indexOf(s.pose.pelvis.orientation) >= 0 || s.pose.head.yaw === 'over_shoulder';
    var longSleeves = /\b(long[-\s]?sleeved?|long sleeves?|jacket|hoodie|sweater|coat)\b|長袖/i.test(s.output.customText || '');
    var closeShot = ['face_close_up', 'headshot', 'bust_shot'].indexOf(s.camera.shotSize) >= 0;
    if (isChain) out.push(issue('restraint_chain_difficulty', 'info', 'restraint', '鎖は難度の高い拘束具です', '鎖は縄より難度が高く、壁・柱・金具などの接続先が見える構図の方が安定します。', ['restraint.type', 'restraint.anchor', 'camera.shotSize'], []));
    if (isChain && s.restraint.anchor === 'none') out.push(issue('restraint_chain_anchor_missing', 'warning', 'restraint', '鎖の固定先が指定されていません', '鎖＋固定先なしでは装飾的な鎖として崩れやすくなります。壁・柱・手錠・金具など、見える接続先を明示すると安定しやすくなります。', ['restraint.type', 'restraint.anchor'], [
      { labelJa: '壁の金具へ固定', patch: { 'restraint.anchor': 'wall' } },
      { labelJa: '縄へ変更', patch: { 'restraint.type': 'rope' } },
      { labelJa: '手錠へ変更', patch: { 'restraint.type': 'cuffs' } }
    ]));
    if (placement === 'wrists_behind') out.push(issue('restraint_behind_hand_visibility', closeShot ? 'warning' : 'info', 'restraint', '後ろ手は手元が省略されやすい構図です', '後ろ手拘束では手や指が省略される場合があります。半身～全身で、腰の後ろの手首と指を見せる構図が安定します。', ['restraint.placement', 'camera.shotSize'], [
      { labelJa: '腰上へ変更', patch: { 'camera.shotSize': 'waist_up' } }
    ]));
    if (placement === 'wrists_behind' && longSleeves) {
      var visibleWristText = (s.output.customText ? s.output.customText.replace(/,\s*$/g, '') + ', ' : '') + 'short sleeves, wrists clearly visible';
      out.push(issue('restraint_behind_long_sleeves', 'warning', 'restraint', '長袖が後ろ手の手首を隠しやすい組み合わせです', '後ろ手拘束と長袖衣装の組み合わせでは、手首や鎖が衣装に埋もれやすくなります。半袖・袖まくり・手首の見える衣装が安定します。', ['restraint.placement', 'output.customText'], [
        { labelJa: '半袖と手首表示を補足', patch: { 'output.customText': visibleWristText } }
      ]));
    }
    if (isChain && placement === 'wrists_behind') out.push(issue('restraint_chain_behind_difficulty', 'warning', 'restraint', '鎖＋後ろ手は高難度です', '鎖と後ろ手を同時に使うと、手・肘・肩の位置や鎖の経路が崩れやすくなります。まず縄へ変更するか、腰上～全身で手元を見せる構図を推奨します。', ['restraint.type', 'restraint.placement', 'camera.shotSize'], [
      { labelJa: '縄へ変更', patch: { 'restraint.type': 'rope' } },
      { labelJa: '腰上へ変更', patch: { 'camera.shotSize': 'waist_up' } }
    ]));
    if (isChain && placement === 'one_wrist' && rearView) out.push(issue('restraint_chain_one_wrist_rear_difficulty', 'warning', 'restraint', '片手首＋鎖＋背面振り返りは高難度です', '片手首＋鎖＋背面振り返りは、固定した手と鎖の接続先が隠れやすい組み合わせです。手錠や縄、または正面寄りの半身構図が安定します。', ['restraint.type', 'restraint.placement', 'pose.rearViewEmphasis', 'camera.shotSize'], [
      { labelJa: '縄へ変更', patch: { 'restraint.type': 'rope' } },
      { labelJa: '正面寄りの腰上へ変更', patch: { 'camera.shotSize': 'waist_up', 'pose.rearViewEmphasis': 'none', 'pose.pelvis.orientation': 'three_quarter' } }
    ]));
    if (isChain && placement === 'torso_and_arms') out.push(issue('restraint_chain_torso_difficulty', 'warning', 'restraint', '腕と胴体へ巻く鎖は高難度です', '装飾的な演出には有効ですが、鎖の通り道が服・脇・背中へ隠れて破綻しやすい構図です。まず縄や単純な胸前固定から試すことを推奨します。', ['restraint.type', 'restraint.placement'], [
      { labelJa: '縄へ変更', patch: { 'restraint.type': 'rope' } },
      { labelJa: '両手首を前で固定', patch: { 'restraint.placement': 'wrists_front', 'restraint.anchor': 'none', 'restraint.tension': 'loose' } }
    ]));
    if (bilateralWrists && supportUsesBothHands) out.push(issue('restraint_both_hands_support_conflict', 'hard', 'restraint', '両手の支持姿勢と両手首の拘束は併用できません', 'このポーズでは両手を身体の支持に使用するため、両手首の拘束と併用できません。', ['restraint.placement', 'pose.supportPose', 'pose.arms'], [
      { labelJa: '拘束位置を解除', patch: { 'restraint.placement': 'none' } },
      { labelJa: '両手支持を解除', patch: { 'pose.supportPose': 'none', 'pose.arms.combined': null, 'pose.arms.mode': 'separate' } }
    ]));
    if (bilateralWrists && combinedHands) out.push(issue('restraint_two_hand_gesture_conflict', 'hard', 'restraint', '両手を使う仕草と両手首の拘束は併用できません', '両手ハートや両手で顔を隠す動作は、両手首を固定した状態では成立しません。', ['restraint.placement', 'pose.arms.combined'], [
      { labelJa: '両手の仕草を解除', patch: { 'pose.arms.mode': 'separate', 'pose.arms.combined': null } }
    ]));
    if (bilateralWrists && viewerHandAction) out.push(issue('restraint_viewer_hand_conflict', 'hard', 'restraint', 'Viewerとの手のやりとりと両手首の拘束は併用できません', 'Viewerの手を引く・支える・一口差し出す動作には自由な手が必要です。', ['restraint.placement', 'interaction.viewerHandInteraction'], [
      { labelJa: '手のやりとりを解除', patch: { 'interaction.viewerHandInteraction': 'none', 'interaction.viewerHandVisible': false } }
    ]));
    if (placement === 'wrists_behind' && individualActions.some(function (id) { return id !== 'behind_back' && id !== 'relaxed_at_side'; })) out.push(issue('restraint_behind_front_action_conflict', 'hard', 'restraint', '後ろで拘束した手と前方の手動作が競合しています', '両手首を後ろで拘束しているため、胸元や顔まわりの手動作を同時に指定できません。', ['restraint.placement', 'pose.arms'], [
      { labelJa: '前方の手動作を解除', patch: { 'pose.arms.primary.action': null, 'pose.arms.secondary.action': null } }
    ]));
    if (placement === 'wrists_overhead' && individualActions.some(function (id) { return id !== 'relaxed_at_side'; })) out.push(issue('restraint_overhead_arm_action_conflict', 'hard', 'restraint', '頭上固定と腕を下げる動作が競合しています', '両手首を頭上へ固定しているため、顔・頬・胸元へ触れる動作は併用できません。', ['restraint.placement', 'pose.arms'], [
      { labelJa: '腕の動作を解除', patch: { 'pose.arms.primary.action': null, 'pose.arms.secondary.action': null } }
    ]));
    if (placement === 'ankles' && s.restraint.tension === 'secured' && ['standing', 'walking', 'one_knee_kneeling'].indexOf(s.pose.posture) >= 0) out.push(issue('restraint_ankles_posture_conflict', 'hard', 'restraint', '固定した足首と現在の姿勢が両立しません', '足首を固定した状態では、立位より床座りまたは寝姿勢が安定します。', ['restraint.placement', 'restraint.tension', 'pose.posture'], [
      { labelJa: '床座りへ変更', patch: { 'pose.posture': 'sitting', 'pose.motion.state': 'static', 'pose.weight': null, 'pose.lowerBody.stance': null, 'pose.lowerBody.legRelation': 'parallel', 'pose.lowerBody.knee': 'both_bent' } }
    ]));
    if (placement === 'chair_armrests' && s.pose.posture !== 'sitting') out.push(issue('restraint_chair_posture_conflict', 'hard', 'restraint', '椅子の肘掛け固定には座位が必要です', '椅子へ座る姿勢と、身体を受ける座面を指定してください。', ['restraint.placement', 'restraint.anchor', 'pose.posture', 'pose.support.type'], [
      { labelJa: '椅子へ座る', patch: { 'pose.posture': 'sitting', 'pose.support.type': 'seated_surface', 'pose.motion.state': 'static', 'pose.weight': null } }
    ]));
    if (placement === 'one_wrist' && (combinedHands || individualActions.length > 1)) out.push(issue('restraint_one_wrist_too_many_actions', 'hard', 'restraint', '片手首拘束で両手の動作が指定されています', '片手首の拘束では、自由な腕の動作を1種類に絞ると安定します。', ['restraint.placement', 'restraint.freeArm', 'pose.arms'], [
      { labelJa: '反対の手動作を解除', patch: { 'pose.arms.mode': 'separate', 'pose.arms.secondary.action': null, 'pose.arms.combined': null } }
    ]));
    if (/\b(minor|underage|child|kid|young\s+(girl|boy)|teen(?:ager)?)\b|未成年|子ども|子供|幼い|少女|少年/i.test(s.output.customText || '')) out.push(issue('restraint_minor_conflict', 'hard', 'safety', '拘束・固定は成人キャラクター専用です', '未成年・子ども・幼い外見を示す自由入力とは併用できません。成人キャラクターの演出として使用してください。', ['restraint', 'output.customText'], [
      { labelJa: '拘束・固定を解除', patch: { 'restraint.type': 'none', 'restraint.placement': 'none', 'restraint.anchor': 'none' } }
    ]));
    out.push(issue('restraint_adult_noninjury_notice', 'info', 'safety', '拘束・固定は成人キャラクター向けの演出です', '首への拘束、吊り下げ、傷、流血を避けた非損傷の演出として出力します。', ['restraint'], []));
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
    if (s.pose.supportPose === 'hands_and_knees' && ['full_body', 'wide', 'wide_shot'].indexOf(s.camera.shotSize) < 0) out.push(issue('hands_and_knees_shot_too_close', 'info', 'visibility', '四点支持には撮影範囲が近すぎます', '四つん這い構図は、全身表示にして両手・両膝・骨盤の支持関係を見せると安定しやすくなります。出力では全身へ補正されます。', ['pose.supportPose', 'camera.shotSize'], [
      { labelJa: '全身へ変更', patch: { 'camera.shotSize': 'full_body' } }
    ]));
    if (s.pose.supportPose === 'hands_and_knees' && s.output.preserveClothing && !s.output.supportOutfitAssist && s.output.backDesign === 'none') out.push(issue('hands_and_knees_outfit_tip', 'info', 'output', '四点支持の服装補助がOFFです', '服保持を安定させたい場合は、Tシャツとショートパンツまたは細身パンツの具体指定が有効です。', ['pose.supportPose', 'output.preserveClothing', 'output.supportOutfitAssist'], [
      { labelJa: '四点支持の服装補助をON', patch: { 'output.supportOutfitAssist': true } }
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
    if (['back_and_waist', 'full_back_line', 'rear_pose_emphasis'].indexOf(s.pose.rearViewEmphasis) >= 0 && s.pose.support.type === 'bed_surface' && !s.output.preserveClothing) out.push(issue('rear_bed_clothing_risk', 'info', 'output', 'ベッドの背面構図は服装が省略されやすい組み合わせです', '衣装を残したい場合は「服を保持する」をONにしてください。腰まわりまで覆う文言が出力へ追加されます。', ['pose.rearViewEmphasis', 'pose.support.type', 'output.preserveClothing'], [
      { labelJa: '服を保持する', patch: { 'output.preserveClothing': true } }
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
    restraintIssues(s, out);
    if (s.output.suppressPhotographyEquipment) out.push(issue('photography_equipment_suppression', 'info', 'output', '撮影機材の誤描画を抑えます', '一部の生成モデルが視点指定を撮影機材として描く問題を抑える補助文を出力します。', ['output.suppressPhotographyEquipment'], []));

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
  PCW.advisor = { check: check, summary: summary, handUsage: handUsage, hidden: hidden, armHidden: armHidden, restraintActive: restraintActive, isComplete: isComplete };
})(window);
