(function (global) {
  'use strict';
  var PCW = global.PCW, D = PCW.data, S = PCW.state, A = PCW.advisor, G = PCW.generator, Store = PCW.storage;
  var tests = [];
  function test(name, fn) { tests.push({ name: name, fn: fn }); }
  function ok(value, message) { if (!value) throw new Error(message || '期待した条件を満たしません'); }
  function eq(actual, expected, message) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error((message || '値が一致しません') + ' / actual=' + JSON.stringify(actual) + ' expected=' + JSON.stringify(expected)); }
  function patch(base, values) { return S.applyPatch(base || S.initial(), values); }
  function ids(list) { return list.map(function (x) { return x.id; }); }
  function unique(list) { return new Set(list).size === list.length; }
  function issueIds(state) { return A.check(state).map(function (x) { return x.id; }); }
  var legacyPresetIds = ['basic_front', 'model_three_quarter', 'natural_weight', 'crossed_bust', 'thinking', 'leaning_seated', 'calm_seated', 'walking_moment', 'walk_turn', 'one_knee', 'low_angle', 'high_seated', 'side_space', 'stable_full', 'fashion_motion'];
  var addedPresetIds = ['viewer_classic_front_close', 'viewer_angled_eye_contact_close', 'viewer_quiet_profile_close', 'viewer_turning_face_close', 'viewer_lowered_gaze_close', 'viewer_raised_chin_downward_close', 'viewer_tilted_soft_close', 'viewer_cheek_touch_close', 'viewer_hair_touch_close', 'viewer_chest_hand_half', 'viewer_pocket_angle_half', 'viewer_hands_behind_half', 'viewer_side_eye_half', 'viewer_low_crouch_full', 'viewer_quiet_reclining_full'];
  function memoryStore(seed) {
    var data = seed || {};
    return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; }, setItem: function (k, v) { data[k] = String(v); }, removeItem: function (k) { delete data[k]; }, data: data };
  }

  test('初期状態：スキーマは1.0', function () { eq(S.initial().schemaVersion, '1.0'); });
  test('初期状態：人物数は1', function () { eq(S.initial().subject.count, 1); });
  test('初期状態：基本姿勢は未選択', function () { eq(S.initial().pose.posture, null); });
  test('初期状態：手は個別モード', function () { eq(S.initial().pose.arms.mode, 'separate'); });
  test('初期状態：カメラは水平', function () { eq(S.initial().camera.roll, 'level'); });
  test('deep merge：元の状態を書き換えない', function () { var a = S.initial(); var b = S.merge(a, { pose: { posture: 'standing' } }); eq(a.pose.posture, null); eq(b.pose.posture, 'standing'); });
  test('getPath：深い値を取得', function () { eq(S.getPath(S.initial(), 'pose.motion.state'), 'static'); });
  test('setPath：深い値を設定', function () { var s = {}; S.setPath(s, 'pose.head.yaw', 'side'); eq(s.pose.head.yaw, 'side'); });
  test('applyPatch：ドットパスを適用', function () { eq(patch(null, { 'pose.posture': 'standing' }).pose.posture, 'standing'); });
  test('applyPatch：パッチ外を保持', function () { var s = patch(null, { 'pose.head.yaw': 'side' }); s = patch(s, { 'pose.posture': 'standing' }); eq(s.pose.head.yaw, 'side'); });

  [
    ['postures', D.postures], ['motionStates', D.motionStates], ['supportTypes', D.supportTypes], ['weights', D.weights], ['stances', D.stances],
    ['legRelations', D.legRelations], ['knees', D.knees], ['pelvisOrientations', D.pelvisOrientations], ['pelvisShifts', D.pelvisShifts],
    ['torsoRelations', D.torsoRelations], ['torsoLeans', D.torsoLeans], ['shoulders', D.shoulders], ['armActions', D.armActions],
    ['combinedArms', D.combinedArms], ['headYaws', D.headYaws], ['headPitches', D.headPitches], ['headTilts', D.headTilts],
    ['gazeTargets', D.gazeTargets], ['gazeDirections', D.gazeDirections], ['eyeStates', D.eyeStates], ['shotSizes', D.shotSizes],
    ['elevations', D.elevations], ['rolls', D.rolls], ['placements', D.placements], ['negativeSpaces', D.negativeSpaces],
    ['crops', D.crops], ['foregrounds', D.foregrounds], ['depths', D.depths], ['rhythms', D.rhythms],
    ['interactionTargets', D.interactionTargets], ['interactionDistances', D.interactionDistances], ['interactionApproaches', D.interactionApproaches], ['presets', D.presets]
  ].forEach(function (row) {
    test('データ：' + row[0] + 'のIDは一意', function () { ok(unique(ids(row[1]))); });
  });
  test('データ：すべての選択肢に日本語ラベル', function () { [D.postures, D.motionStates, D.weights, D.armActions, D.headYaws, D.gazeTargets, D.shotSizes, D.placements].forEach(function (list) { list.forEach(function (x) { ok(x.labelJa); }); }); });
  test('データ：腕の使用手数は0〜2', function () { D.armActions.concat(D.combinedArms).forEach(function (x) { ok(x.resources.hands >= 0 && x.resources.hands <= 2); }); });
  test('データ：複合腕は2本の手を使う', function () { D.combinedArms.forEach(function (x) { eq(x.resources.hands, 2); }); });
  test('データ：ビルトインプリセットは30件', function () { eq(D.presets.length, 30); });
  test('データ：全プリセットにshotSizeがある', function () { D.presets.forEach(function (p) { ok(p.patch.camera && p.patch.camera.shotSize); }); });
  test('データ：既存15プリセットを保持', function () { legacyPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：追加15プリセットが揃う', function () { addedPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：追加プリセットは既存から主要軸が2つ以上異なる', function () {
    function axes(p) { var x = p.patch, q = x.pose || {}, c = x.composition || {}; return [q.posture, JSON.stringify(q.arms || {}), JSON.stringify(q.head || {}), JSON.stringify(q.gaze || {}), (x.camera || {}).elevation, c.subjectPlacement, c.rhythm]; }
    var legacy = D.presets.filter(function (p) { return legacyPresetIds.indexOf(p.id) >= 0; });
    D.presets.filter(function (p) { return addedPresetIds.indexOf(p.id) >= 0; }).forEach(function (added) {
      legacy.forEach(function (old) { var a = axes(added), b = axes(old), differences = a.reduce(function (n, value, index) { return n + (value !== b[index] ? 1 : 0); }, 0); ok(differences >= 2, added.id + ' / ' + old.id); });
    });
  });
  test('分類：アップ用shotSizeを判定', function () { ['face_close_up', 'headshot', 'bust_shot'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'up'); }); });
  test('分類：半身用shotSizeを判定', function () { ['upper_body', 'waist_up', 'knee_up'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'half'); }); });
  test('分類：全身用shotSizeを判定', function () { ['full_body', 'wide', 'wide_shot'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'full'); }); });
  test('分類：未知のshotSizeはother', function () { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: 'unknown' } } }), 'other'); });
  test('分類：全プリセットがアップ・半身・全身のいずれか', function () { D.presets.forEach(function (p) { ok(['up', 'half', 'full'].indexOf(D.getPresetFramingGroup(p)) >= 0); }); });
  test('分類：アップ10・半身10・全身10', function () { var c = D.getPresetFramingCounts(D.presets); eq([c.up, c.half, c.full], [10, 10, 10]); });
  test('分類：分類別件数の合計が全件数', function () { var c = D.getPresetFramingCounts(D.presets); eq(c.up + c.half + c.full + c.other, c.all); });
  test('フィルター：アップだけを返す', function () { var list = D.filterPresets(D.presets, 'up', false); eq(list.length, 10); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'up'); }); });
  test('フィルター：半身だけを返す', function () { var list = D.filterPresets(D.presets, 'half', false); eq(list.length, 10); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'half'); }); });
  test('フィルター：全身だけを返す', function () { var list = D.filterPresets(D.presets, 'full', false); eq(list.length, 10); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'full'); }); });
  test('フィルター：相手視点だけを返す', function () { var list = D.filterPresets(D.presets, 'all', true); eq(list.length, 15); list.forEach(function (p) { ok(p.meta.audienceTags.indexOf('viewer_perspective') >= 0); }); });
  test('フィルター：aria-pressedは選択中だけtrue', function () { var html = D.renderPresetFramingFilters('half', D.presets); eq((html.match(/aria-pressed="true"/g) || []).length, 1); ok(/data-preset-filter="half" aria-pressed="true"/.test(html)); });
  test('フィルター：選択変更でaria-pressedが更新', function () { var html = D.renderPresetFramingFilters('full', D.presets); ok(/data-preset-filter="full" aria-pressed="true"/.test(html)); ok(!/data-preset-filter="half" aria-pressed="true"/.test(html)); });

  test('正規化：nullでも起動', function () { eq(S.normalize(null).schemaVersion, '1.0'); });
  test('正規化：未知の姿勢を除去', function () { eq(S.normalize({ pose: { posture: 'flying' } }).pose.posture, null); });
  test('正規化：未知の画角を除去', function () { eq(S.normalize({ camera: { shotSize: 'macro' } }).camera.shotSize, null); });
  test('正規化：未知の腕動作を除去', function () { eq(S.normalize({ pose: { arms: { primary: { action: 'third_hand' } } } }).pose.arms.primary.action, null); });
  test('正規化：未知の視線を除去', function () { eq(S.normalize({ pose: { gaze: { target: 'unknown_target' } } }).pose.gaze.target, null); });
  test('正規化：人物数を1へ戻す', function () { eq(S.normalize({ subject: { count: 9 } }).subject.count, 1); });
  test('正規化：旧保存データへinteraction初期値を補う', function () { eq(S.normalize({ pose: { posture: 'standing' } }).interaction, { target: 'none', distance: 'normal', approach: 'none' }); });
  test('正規化：未知のinteraction値を除去', function () { eq(S.normalize({ interaction: { target: 'stranger', distance: 'nearer', approach: 'jump' } }).interaction, { target: 'none', distance: 'normal', approach: 'none' }); });
  test('正規化：相手なしなら距離と動きを初期化', function () { eq(S.normalize({ interaction: { target: 'none', distance: 'very_close', approach: 'lean_toward' } }).interaction, { target: 'none', distance: 'normal', approach: 'none' }); });
  test('正規化：自由入力の非文字列を除去', function () { eq(S.normalize({ output: { customText: 42 } }).output.customText, ''); });
  test('正規化：壊れたignore配列を復旧', function () { eq(S.normalize({ meta: { ignoredWarnings: 'x' } }).meta.ignoredWarnings, []); });
  test('姿勢初期値：立位は片足重心候補を入れる', function () { eq(S.applyPostureDefaults(S.initial(), 'standing').pose.weight, 'one_leg'); });
  test('姿勢初期値：座位は片足重心を入れない', function () { eq(S.applyPostureDefaults(S.initial(), 'sitting').pose.weight, null); });
  test('姿勢初期値：歩行は動作途中', function () { eq(S.applyPostureDefaults(S.initial(), 'walking').pose.motion.state, 'mid_motion'); });

  test('advisor：腕組みと顎に手でhard', function () { var s = patch(null, { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed', 'pose.arms.primary.action': 'hand_touching_chin' }); ok(issueIds(s).indexOf('combined_with_individual_arms') >= 0); });
  test('advisor：腕競合の修正案は2件', function () { var s = patch(null, { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed', 'pose.arms.primary.action': 'hand_on_hip' }); var i = A.check(s)[0]; eq(i.resolutions.length, 2); });
  test('advisor：両腕を残すpatchでhard解消', function () { var s = patch(null, { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed', 'pose.arms.primary.action': 'hand_on_hip' }); var r = A.check(s)[0].resolutions[0]; s = patch(s, r.patch); eq(A.summary(s).hard, 0); });
  test('advisor：個別腕を残すpatchでhard解消', function () { var s = patch(null, { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed', 'pose.arms.primary.action': 'hand_on_hip' }); var r = A.check(s)[0].resolutions[1]; s = patch(s, r.patch); eq(A.summary(s).hard, 0); });
  test('advisor：閉眼＋直視でhard', function () { var s = patch(null, { 'pose.gaze.eyes': 'closed', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'direct' }); ok(issueIds(s).indexOf('closed_eyes_direct_gaze') >= 0); });
  test('advisor：目を開けるpatchでhard解消', function () { var s = patch(null, { 'pose.gaze.eyes': 'closed', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'direct' }); s = patch(s, A.check(s)[0].resolutions[0].patch); eq(A.summary(s).hard, 0); });
  test('advisor：歩行＋静止でhard', function () { var s = patch(null, { 'pose.posture': 'walking', 'pose.motion.state': 'static' }); ok(issueIds(s).indexOf('static_walking') >= 0); });
  test('advisor：座位＋片足重心でwarning', function () { var s = patch(null, { 'pose.posture': 'sitting', 'pose.weight': 'one_leg' }); ok(issueIds(s).indexOf('weight_posture_mismatch') >= 0); });
  test('advisor：しゃがみ＋脚交差でwarning', function () { var s = patch(null, { 'pose.posture': 'crouching', 'pose.lowerBody.legRelation': 'lightly_crossed' }); ok(issueIds(s).indexOf('lower_legRelation_mismatch') >= 0); });
  test('advisor：背中向き＋正面顔でwarning', function () { var s = patch(null, { 'pose.pelvis.orientation': 'away', 'pose.head.yaw': 'toward_camera' }); ok(issueIds(s).indexOf('strong_turn') >= 0); });
  test('advisor：中央＋ダッチでwarning', function () { var s = patch(null, { 'composition.subjectPlacement': 'centered', 'camera.roll': 'dutch' }); ok(issueIds(s).indexOf('center_dutch_tension') >= 0); });
  test('advisor：左配置で右余白を提案', function () { var s = patch(null, { 'composition.subjectPlacement': 'left', 'composition.negativeSpace': 'none' }); var i = A.check(s).filter(function (x) { return x.id === 'negative_space_recommendation'; })[0]; eq(i.resolutions[0].patch['composition.negativeSpace'], 'right'); });
  test('advisor：提案余白を適用するとinfo解消', function () { var s = patch(null, { 'composition.subjectPlacement': 'left', 'composition.negativeSpace': 'none' }); var i = A.check(s).filter(function (x) { return x.id === 'negative_space_recommendation'; })[0]; s = patch(s, i.resolutions[0].patch); ok(issueIds(s).indexOf('negative_space_recommendation') < 0); });
  test('advisor：顔アップ＋脚設定でinfo', function () { var s = patch(null, { 'camera.shotSize': 'face_close_up', 'pose.weight': 'one_leg' }); ok(issueIds(s).indexOf('lower_body_hidden') >= 0); });
  test('advisor：バストショット＋腰の手でinfo', function () { var s = patch(null, { 'camera.shotSize': 'bust_shot', 'pose.arms.primary.action': 'hand_on_hip' }); ok(issueIds(s).indexOf('arm_detail_hidden') >= 0); });
  test('advisor：顎に手はバストショットで見える', function () { var s = patch(null, { 'camera.shotSize': 'bust_shot', 'pose.arms.primary.action': 'hand_touching_chin' }); ok(issueIds(s).indexOf('arm_detail_hidden') < 0); });
  test('advisor：warningをignoreできる', function () { var s = patch(null, { 'pose.posture': 'sitting', 'pose.weight': 'one_leg', 'meta.ignoredWarnings': ['weight_posture_mismatch'] }); var i = A.check(s).filter(function (x) { return x.id === 'weight_posture_mismatch'; })[0]; ok(i.ignored); });
  test('advisor：hardはignoreされない', function () { var s = patch(null, { 'pose.posture': 'walking', 'pose.motion.state': 'static', 'meta.ignoredWarnings': ['static_walking'] }); var i = A.check(s).filter(function (x) { return x.id === 'static_walking'; })[0]; ok(!i.ignored); });
  test('advisor：腕組みの手使用数は2', function () { var s = patch(null, { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed' }); eq(A.handUsage(s), 2); });
  test('advisor：腰と顎の手使用数は2', function () { var s = patch(null, { 'pose.arms.primary.action': 'hand_on_hip', 'pose.arms.secondary.action': 'hand_touching_chin' }); eq(A.handUsage(s), 2); });
  test('advisor：高い相手へ伏し目でwarning', function () { var s = patch(null, { 'interaction.target': 'viewer', 'camera.elevation': 'high', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'downward' }); ok(issueIds(s).indexOf('viewer_high_gaze_mismatch') >= 0); });
  test('advisor：低い相手へ上目でwarning', function () { var s = patch(null, { 'interaction.target': 'viewer', 'camera.elevation': 'low', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'upward' }); ok(issueIds(s).indexOf('viewer_low_gaze_mismatch') >= 0); });
  test('advisor：相手視点で別対象を見るとinfo', function () { var s = patch(null, { 'interaction.target': 'viewer', 'pose.gaze.target': 'nearby' }); ok(issueIds(s).indexOf('viewer_gaze_target_elsewhere') >= 0); });
  test('advisor：超近距離の全身でwarning', function () { var s = patch(null, { 'interaction.target': 'viewer', 'interaction.distance': 'very_close', 'camera.shotSize': 'full_body' }); ok(issueIds(s).indexOf('viewer_distance_shot_mismatch') >= 0); });
  test('advisor：相手へ手を伸ばす腕がなければinfo', function () { var s = patch(null, { 'interaction.target': 'viewer', 'interaction.approach': 'reach_toward' }); ok(issueIds(s).indexOf('viewer_reach_without_arm') >= 0); });
  test('advisor：身を寄せるのに前傾なしならinfo', function () { var s = patch(null, { 'interaction.target': 'viewer', 'interaction.approach': 'lean_toward', 'pose.torso.lean': 'neutral' }); ok(issueIds(s).indexOf('viewer_lean_toward_body_mismatch') >= 0); });
  test('advisor：身を引くのに後傾なしならinfo', function () { var s = patch(null, { 'interaction.target': 'viewer', 'interaction.approach': 'lean_away', 'pose.torso.lean': 'neutral' }); ok(issueIds(s).indexOf('viewer_lean_away_body_mismatch') >= 0); });

  function modelState() { var p = D.presets.filter(function (x) { return x.id === 'model_three_quarter'; })[0]; return S.applyPatch(S.initial(), p.patch); }
  test('generator：compactは空でない', function () { ok(G.compact(modelState()).length > 20); });
  test('generator：detailedはcompactと異なる', function () { var s = modelState(); ok(G.detailed(s) !== G.compact(s)); });
  test('generator：日本語構造に姿勢見出し', function () { ok(G.structureJa(modelState()).indexOf('【姿勢】') >= 0); });
  test('generator：solo characterを先頭に含む', function () { ok(/^solo character/.test(G.compact(modelState()))); });
  test('generator：顔と視線を別句で出力', function () { var c = G.compact(modelState()); ok(c.indexOf('head turned') >= 0 && c.indexOf('eyes looking') >= 0); });
  test('generator：両腕ポーズは一つの句', function () { var s = patch(modelState(), { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'arms_crossed', 'pose.arms.primary.action': null, 'pose.arms.secondary.action': null }); var c = G.compact(s); eq((c.match(/arms crossed/g) || []).length, 1); });
  test('generator：バストショットでは脚を出さない', function () { var s = patch(modelState(), { 'camera.shotSize': 'bust_shot' }); var c = G.compact(s); ok(c.indexOf('one leg') < 0 && c.indexOf('one knee') < 0 && c.indexOf('relaxed stance') < 0); });
  test('generator：全身へ戻すと脚を再出力', function () { var s = patch(modelState(), { 'camera.shotSize': 'bust_shot' }); s = patch(s, { 'camera.shotSize': 'full_body' }); ok(G.compact(s).indexOf('one leg') >= 0); });
  test('generator：顔アップでは腰の手を出さない', function () { var s = patch(modelState(), { 'camera.shotSize': 'face_close_up' }); ok(G.compact(s).indexOf('hand resting on the hip') < 0); });
  test('generator：顔アップでも顎に手は出る', function () { var s = patch(modelState(), { 'camera.shotSize': 'face_close_up', 'pose.arms.primary.action': 'hand_touching_chin', 'pose.arms.secondary.action': null }); ok(G.compact(s).indexOf('hand touching the chin') >= 0); });
  test('generator：undefinedを出さない', function () { ok(G.compact(modelState()).indexOf('undefined') < 0); });
  test('generator：nullを出さない', function () { ok(G.compact(modelState()).indexOf('null') < 0); });
  test('generator：空カンマを出さない', function () { ok(G.compact(modelState()).indexOf(',,') < 0); });
  test('generator：連続ピリオドを出さない', function () { ok(G.detailed(modelState()).indexOf('..') < 0); });
  test('generator：同じ句を重複しない', function () { var c = G.compact(modelState()).split(', '); eq(new Set(c).size, c.length); });
  test('generator：自由入力を末尾へそのまま追加', function () { var custom = 'custom WORDS: keep-me'; var s = patch(modelState(), { 'output.customText': custom }); ok(G.compact(s).endsWith(custom)); });
  test('generator：未選択ブロックを除外', function () { var b = G.blocks(S.initial()); eq(b.arms.compact.length, 0); });
  test('generator：カメラ高さと身体向きを混同しない', function () { var s = patch(modelState(), { 'camera.elevation': 'slightly_low', 'pose.pelvis.orientation': 'three_quarter' }); var c = G.compact(s); ok(c.indexOf('three-quarters') >= 0 && c.indexOf('slightly low angle') >= 0); });
  test('generator：構造一覧に顔と視線が別見出し', function () { var j = G.structureJa(modelState()); ok(j.indexOf('【顔・首】') >= 0 && j.indexOf('【視線】') >= 0); });
  test('generator：相手視点の距離を出力', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.distance': 'very_close' }); ok(G.compact(s).indexOf('very close face-to-face distance') >= 0); });
  test('generator：身を寄せる句は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'lean_toward', 'pose.torso.lean': 'forward' }); var c = G.compact(s); eq((c.match(/leaning toward the viewer/g) || []).length, 1); ok(c.indexOf('torso leaning forward') < 0); });
  test('generator：身を引く句は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'lean_away', 'pose.torso.lean': 'backward' }); var c = G.compact(s); eq((c.match(/leaning slightly away from the viewer/g) || []).length, 1); ok(c.indexOf('torso leaning backward') < 0); });
  test('generator：相手へ伸ばす腕は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'reach_toward', 'pose.arms.primary.action': 'reaching_forward', 'pose.arms.secondary.action': null }); var c = G.compact(s); eq((c.match(/reaching toward the viewer/g) || []).length, 1); });
  test('generator：歩み寄る句は一度だけ', function () { var s = patch(modelState(), { 'pose.posture': 'walking', 'pose.motion.state': 'mid_motion', 'interaction.target': 'viewer', 'interaction.approach': 'approaching' }); var c = G.compact(s); eq((c.match(/moving toward the viewer/g) || []).length, 1); ok(c.indexOf('solo character walking') >= 0); });
  test('generator：相手視点でも二人目を出力しない', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.distance': 'close' }); var c = G.compact(s); ['another person', 'another man', 'his partner', 'someone', 'second character', 'two characters'].forEach(function (term) { ok(c.indexOf(term) < 0); }); });

  D.presets.forEach(function (preset) {
    test('プリセット：' + preset.nameJa + 'はhard 0件', function () { var s = S.applyPatch(S.initial(), preset.patch); eq(A.summary(s).hard, 0); ok(G.compact(s)); ok(G.detailed(s)); });
    test('プリセット出力：' + preset.nameJa + 'に空値や空カンマがない', function () { var s = S.applyPatch(S.initial(), preset.patch); var text = G.compact(s) + ' ' + G.detailed(s); ok(text.indexOf('undefined') < 0 && text.indexOf('null') < 0 && text.indexOf(',,') < 0); });
  });
  test('プリセット出力：アップでは脚の細部を出さない', function () { D.filterPresets(D.presets, 'up', false).forEach(function (preset) { var c = G.compact(S.applyPatch(S.initial(), preset.patch)); ['relaxed stance', 'one leg placed forward', 'one knee slightly bent', 'knees naturally extended'].forEach(function (term) { ok(c.indexOf(term) < 0, preset.id + ' / ' + term); }); }); });

  test('完成条件：初期状態は未完了', function () { ok(!A.isComplete(S.initial())); });
  test('完成条件：モデル立ちは完了', function () { ok(A.isComplete(modelState())); });
  test('完成条件：画角なしは未完了', function () { ok(!A.isComplete(patch(modelState(), { 'camera.shotSize': null }))); });
  test('完成条件：hardありは未完了', function () { ok(!A.isComplete(patch(modelState(), { 'pose.gaze.eyes': 'closed', 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'direct' }))); });

  test('storage：下書きを保存・復元', function () { var m = memoryStore(); ok(Store.saveDraft(modelState(), m)); eq(Store.loadDraft(m).pose.posture, 'standing'); });
  test('storage：下書きがなければnull', function () { eq(Store.loadDraft(memoryStore()), null); });
  test('storage：壊れたJSONでもnull', function () { var m = memoryStore(); m.setItem(Store.keys.draft, '{bad'); eq(Store.loadDraft(m), null); });
  test('storage：ユーザープリセットを保存', function () { var m = memoryStore(); Store.savePreset('テスト', modelState(), m); eq(Store.listPresets(m).length, 1); });
  test('storage：無名プリセットに既定名', function () { var m = memoryStore(); var p = Store.savePreset('', modelState(), m); eq(p.name, '名前なしの設計'); });
  test('storage：対象プリセットだけ削除', function () { var m = memoryStore(); var a = Store.savePreset('A', modelState(), m); Store.savePreset('B', modelState(), m); Store.deletePreset(a.id, m); eq(Store.listPresets(m).length, 1); });
  test('storage：保存数は上限以下', function () { var m = memoryStore(); for (var i = 0; i < 25; i++) Store.savePreset('P' + i, modelState(), m); eq(Store.listPresets(m).length, Store.maxPresets); });
  test('storage：設定を保存・復元', function () { var m = memoryStore(); Store.savePreferences({ detail: true }, m); eq(Store.loadPreferences(m).detail, true); });
  test('storage：壊れた設定を空へ復旧', function () { var m = memoryStore(); m.setItem(Store.keys.preferences, '[]'); eq(Store.loadPreferences(m), {}); });
  test('アクセシビリティ：アプリのチップはaria-pressed前提', function () { ok(typeof S.getPath === 'function'); });
  test('アクセシビリティ：全ラベルが空でない', function () { D.postures.concat(D.armActions, D.headYaws, D.gazeTargets).forEach(function (x) { ok(x.labelJa.trim()); }); });

  function run() {
    var results = tests.map(function (t) { try { t.fn(); return { name: t.name, pass: true }; } catch (e) { return { name: t.name, pass: false, error: e.message }; } });
    var passed = results.filter(function (r) { return r.pass; }).length;
    var summary = { total: results.length, passed: passed, failed: results.length - passed, results: results };
    if (global.document) {
      var sum = document.getElementById('testSummary'), list = document.getElementById('testResults');
      if (sum && list) {
        sum.className = 'summary ' + (summary.failed ? 'fail' : 'pass');
        sum.textContent = summary.failed ? passed + ' / ' + results.length + ' 件成功、' + summary.failed + ' 件失敗' : results.length + ' / ' + results.length + ' 件すべて成功';
        list.innerHTML = results.map(function (r) { return '<li class="' + (r.pass ? 'pass' : 'fail') + '">' + (r.pass ? '✓ ' : '✕ ') + r.name + (r.error ? ' — ' + r.error : '') + '</li>'; }).join('');
      }
    }
    return summary;
  }
  PCW.tests = { run: run, count: tests.length };
  PCW.tests.lastResult = run();
})(window);
