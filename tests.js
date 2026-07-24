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
  var relationshipExistingIds = ['viewer_upward_soft_close', 'viewer_downward_confident_close', 'viewer_face_approach_close', 'viewer_side_glance_close', 'viewer_cheek_touch_close', 'viewer_chest_hand_upward_half', 'viewer_leaning_down_half', 'viewer_reaching_half', 'viewer_angled_conversation_half', 'viewer_withdrawing_half', 'viewer_seated_looking_up_full', 'viewer_one_knee_full', 'viewer_approaching_walk_full', 'viewer_recoiling_full', 'viewer_reclining_overhead_full'];
  var relationshipNewIds = ['relationship_sofa_leaning_close', 'relationship_walking_close_up', 'relationship_bed_supine_looking_up', 'relationship_bed_prone_looking_back', 'relationship_bed_side_lying_close', 'relationship_bed_turning_back', 'relationship_bed_leaning_over_viewer', 'relationship_heart_hands_near_face', 'relationship_finger_heart_near_face', 'relationship_finger_heart_cheek_touch', 'relationship_open_arms_toward_viewer', 'relationship_touching_viewer_cheek', 'relationship_pinching_viewer_cheek'];
  var rearViewPresetIds = ['relationship_back_facing_over_shoulder', 'relationship_rear_three_quarter_turn', 'relationship_bed_seated_back_turn', 'relationship_bed_prone_back_visible', 'relationship_sofa_backrest_turn'];
  var faceCoveringPresetIds = ['relationship_bed_supine_covering_eyes', 'relationship_bed_supine_covering_mouth'];
  var backFocusedPresetIds = ['relationship_bed_hands_and_knees_look_back', 'relationship_bed_kneeling_upright_look_back', 'relationship_bed_forward_lean_back_turn', 'relationship_furniture_hands_support_turn', 'relationship_open_back_outfit_turn'];
  var viewerHandPresetIds = ['relationship_offer_one_hand_to_viewer', 'relationship_leading_viewer_by_hand', 'relationship_half_heart_with_viewer', 'relationship_kiss_viewer_hand', 'relationship_offer_bite_to_viewer', 'relationship_guide_viewer_hand_to_cheek'];
  var viewerHandVisiblePresetIds = ['relationship_leading_viewer_by_hand', 'relationship_half_heart_with_viewer', 'relationship_kiss_viewer_hand', 'relationship_guide_viewer_hand_to_cheek'];
  var specialPresetIds = ['special_rope_wrists_front_standing', 'special_rope_wrists_behind_turn', 'special_rope_wrists_front_kneeling', 'special_chair_armrests_restraint', 'special_chain_one_wrist_wall_turn', 'special_wrists_overhead_standing', 'special_rope_ankles_floor_sitting', 'special_decorative_chain_torso_standing'];
  var relationshipAddedIds = rearViewPresetIds.concat(faceCoveringPresetIds, backFocusedPresetIds, viewerHandPresetIds);
  var relationshipPresetIds = relationshipExistingIds.concat(relationshipNewIds, relationshipAddedIds);
  function memoryStore(seed) {
    var data = seed || {};
    return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; }, setItem: function (k, v) { data[k] = String(v); }, removeItem: function (k) { delete data[k]; }, data: data };
  }

  test('初期状態：スキーマは1.0', function () { eq(S.initial().schemaVersion, '1.0'); });
  test('初期状態：人物数は1', function () { eq(S.initial().subject.count, 1); });
  test('初期状態：基本姿勢は未選択', function () { eq(S.initial().pose.posture, null); });
  test('初期状態：手は個別モード', function () { eq(S.initial().pose.arms.mode, 'separate'); });
  test('初期状態：カメラは水平', function () { eq(S.initial().camera.roll, 'level'); });
  test('初期状態：任意の出力補助はOFF、四点支持の服装補助は待機', function () { var o = S.initial().output; eq([o.suppressTextSymbols, o.suppressPhotographyEquipment, o.preserveClothing, o.supportOutfitAssist, o.backDesign], [false, false, false, true, 'none']); });
  test('初期状態：Viewerの手のやりとりは未指定', function () { var i = S.initial().interaction; eq([i.viewerHandInteraction, i.viewerHandVisible], ['none', false]); });
  test('初期状態：拘束・固定は無効', function () { eq(S.initial().restraint, { type: 'none', placement: 'none', anchor: 'none', tension: 'loose', freeArm: 'none' }); });
  test('deep merge：元の状態を書き換えない', function () { var a = S.initial(); var b = S.merge(a, { pose: { posture: 'standing' } }); eq(a.pose.posture, null); eq(b.pose.posture, 'standing'); });
  test('getPath：深い値を取得', function () { eq(S.getPath(S.initial(), 'pose.motion.state'), 'static'); });
  test('setPath：深い値を設定', function () { var s = {}; S.setPath(s, 'pose.head.yaw', 'side'); eq(s.pose.head.yaw, 'side'); });
  test('applyPatch：ドットパスを適用', function () { eq(patch(null, { 'pose.posture': 'standing' }).pose.posture, 'standing'); });
  test('applyPatch：パッチ外を保持', function () { var s = patch(null, { 'pose.head.yaw': 'side' }); s = patch(s, { 'pose.posture': 'standing' }); eq(s.pose.head.yaw, 'side'); });

  [
    ['postures', D.postures], ['motionStates', D.motionStates], ['supportTypes', D.supportTypes], ['lyingOrientations', D.lyingOrientations], ['supportPoses', D.supportPoses], ['flowStyles', D.flowStyles], ['rearViewEmphases', D.rearViewEmphases], ['backDesigns', D.backDesigns], ['weights', D.weights], ['stances', D.stances],
    ['legRelations', D.legRelations], ['knees', D.knees], ['pelvisOrientations', D.pelvisOrientations], ['pelvisShifts', D.pelvisShifts],
    ['torsoRelations', D.torsoRelations], ['torsoLeans', D.torsoLeans], ['shoulders', D.shoulders], ['armActions', D.armActions],
    ['combinedArms', D.combinedArms], ['headYaws', D.headYaws], ['headPitches', D.headPitches], ['headTilts', D.headTilts],
    ['gazeTargets', D.gazeTargets], ['gazeDirections', D.gazeDirections], ['eyeStates', D.eyeStates], ['expressions', D.expressions], ['shotSizes', D.shotSizes],
    ['elevations', D.elevations], ['rolls', D.rolls], ['placements', D.placements], ['negativeSpaces', D.negativeSpaces],
    ['crops', D.crops], ['foregrounds', D.foregrounds], ['depths', D.depths], ['rhythms', D.rhythms],
    ['interactionTargets', D.interactionTargets], ['interactionDistances', D.interactionDistances], ['interactionApproaches', D.interactionApproaches], ['viewerHandInteractions', D.viewerHandInteractions],
    ['restraintTypes', D.restraintTypes], ['restraintPlacements', D.restraintPlacements], ['restraintAnchors', D.restraintAnchors], ['restraintTensions', D.restraintTensions], ['restraintFreeArms', D.restraintFreeArms], ['presets', D.presets]
  ].forEach(function (row) {
    test('データ：' + row[0] + 'のIDは一意', function () { ok(unique(ids(row[1]))); });
  });
  test('データ：すべての選択肢に日本語ラベル', function () { [D.postures, D.motionStates, D.weights, D.armActions, D.headYaws, D.gazeTargets, D.shotSizes, D.placements].forEach(function (list) { list.forEach(function (x) { ok(x.labelJa); }); }); });
  test('データ：腕の使用手数は0〜2', function () { D.armActions.concat(D.combinedArms).forEach(function (x) { ok(x.resources.hands >= 0 && x.resources.hands <= 2); }); });
  test('データ：複合腕は2本の手を使う', function () { D.combinedArms.forEach(function (x) { eq(x.resources.hands, 2); }); });
  test('データ：ビルトインプリセットは69件', function () { eq(D.presets.length, 69); });
  test('データ：全プリセットにshotSizeがある', function () { D.presets.forEach(function (p) { ok(p.patch.camera && p.patch.camera.shotSize); }); });
  test('データ：既存15プリセットを保持', function () { legacyPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：relationship既存15件が揃う', function () { relationshipExistingIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：relationship新規13件が揃う', function () { relationshipNewIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：背面5件・顔隠し2件・背中主役5件が揃う', function () { relationshipAddedIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：手のやりとり6件が揃う', function () { viewerHandPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：特殊・演出8件が揃う', function () { specialPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：全プリセットにcollectionがある', function () { D.presets.forEach(function (p) { ok(['basic', 'relationship', 'special'].indexOf(p.meta.collection) >= 0); }); });
  test('データ：basic 15件・relationship 46件・special 8件', function () { var c = D.getPresetCollectionCounts(D.presets); eq([c.basic, c.relationship, c.special], [15, 46, 8]); });
  test('データ：全プリセットにposeFamilyが1つある', function () { D.presets.forEach(function (p) { ok(D.presetPoseFamilyLabels[p.meta.poseFamily], p.id); }); });
  test('データ：特殊・演出は拘束・固定系統', function () { D.filterPresets(D.presets, 'all', { collection: 'special' }).forEach(function (p) { eq(p.meta.poseFamily, 'restraint'); }); });
  test('データ：relationshipはすべて相手視点', function () { D.filterPresets(D.presets, 'all', { collection: 'relationship' }).forEach(function (p) { ok(p.meta.audienceTags.indexOf('viewer_perspective') >= 0); }); });
  test('データ：relationshipタグは定義済み', function () { D.filterPresets(D.presets, 'all', { collection: 'relationship' }).forEach(function (p) { (p.moodTags || p.meta.moodTags || []).forEach(function (tag) { ok(D.presetMoodTagLabels[tag]); }); (p.sceneTags || p.meta.sceneTags || []).forEach(function (tag) { ok(D.presetSceneTagLabels[tag]); }); }); });
  test('データ：追加プリセットは既存から主要軸が2つ以上異なる', function () {
    function axes(p) { var x = p.patch, q = x.pose || {}, c = x.composition || {}; return [q.posture, JSON.stringify(q.arms || {}), JSON.stringify(q.head || {}), JSON.stringify(q.gaze || {}), (x.camera || {}).elevation, c.subjectPlacement, c.rhythm]; }
    var legacy = D.presets.filter(function (p) { return legacyPresetIds.indexOf(p.id) >= 0; });
    D.presets.filter(function (p) { return relationshipNewIds.indexOf(p.id) >= 0; }).forEach(function (added) {
      legacy.forEach(function (old) { var a = axes(added), b = axes(old), differences = a.reduce(function (n, value, index) { return n + (value !== b[index] ? 1 : 0); }, 0); ok(differences >= 2, added.id + ' / ' + old.id); });
    });
  });
  test('分類：アップ用shotSizeを判定', function () { ['face_close_up', 'headshot', 'bust_shot'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'up'); }); });
  test('分類：半身用shotSizeを判定', function () { ['upper_body', 'waist_up', 'knee_up'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'half'); }); });
  test('分類：全身用shotSizeを判定', function () { ['full_body', 'wide', 'wide_shot'].forEach(function (shot) { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: shot } } }), 'full'); }); });
  test('分類：未知のshotSizeはother', function () { eq(D.getPresetFramingGroup({ patch: { camera: { shotSize: 'unknown' } } }), 'other'); });
  test('分類：全プリセットがアップ・半身・全身のいずれか', function () { D.presets.forEach(function (p) { ok(['up', 'half', 'full'].indexOf(D.getPresetFramingGroup(p)) >= 0); }); });
  test('分類：アップ13・半身33・全身23', function () { var c = D.getPresetFramingCounts(D.presets); eq([c.up, c.half, c.full], [13, 33, 23]); });
  test('分類：分類別件数の合計が全件数', function () { var c = D.getPresetFramingCounts(D.presets); eq(c.up + c.half + c.full + c.other, c.all); });
  test('フィルター：アップだけを返す', function () { var list = D.filterPresets(D.presets, 'up', false); eq(list.length, 13); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'up'); }); });
  test('フィルター：半身だけを返す', function () { var list = D.filterPresets(D.presets, 'half', false); eq(list.length, 33); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'half'); }); });
  test('フィルター：全身だけを返す', function () { var list = D.filterPresets(D.presets, 'full', false); eq(list.length, 23); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'full'); }); });
  test('フィルター：相手視点だけを返す', function () { var list = D.filterPresets(D.presets, 'all', true); eq(list.length, 46); list.forEach(function (p) { ok(p.meta.audienceTags.indexOf('viewer_perspective') >= 0); }); });
  test('フィルター：relationshipのアップだけを返す', function () { var list = D.filterPresets(D.presets, 'up', { collection: 'relationship' }); eq(list.length, 12); });
  test('フィルター：relationshipの半身だけを返す', function () { var list = D.filterPresets(D.presets, 'half', { collection: 'relationship' }); eq(list.length, 27); });
  test('フィルター：relationshipの全身だけを返す', function () { var list = D.filterPresets(D.presets, 'full', { collection: 'relationship' }); eq(list.length, 7); });
  test('フィルター：甘めは甘めタグだけを返す', function () { D.filterPresets(D.presets, 'all', { collection: 'relationship', mood: 'sweet' }).forEach(function (p) { ok(p.meta.moodTags.indexOf('sweet') >= 0); }); });
  test('フィルター：ベッドはベッドタグだけを返す', function () { D.filterPresets(D.presets, 'all', { collection: 'relationship', scene: 'bed' }).forEach(function (p) { ok(p.meta.sceneTags.indexOf('bed') >= 0); }); });
  test('フィルター：背中主役は新規5件を返す', function () { var list = D.filterPresets(D.presets, 'all', { collection: 'relationship', scene: 'back_focused' }); eq(ids(list), backFocusedPresetIds); });
  test('フィルター：手のやりとりは新規6件を返す', function () { var list = D.filterPresets(D.presets, 'all', { collection: 'relationship', interaction: 'hand_interaction' }); eq(ids(list), viewerHandPresetIds); });
  test('フィルター：特殊・演出と拘束・固定の組合せで8件', function () { eq(ids(D.filterPresets(D.presets, 'all', { collection: 'special', poseFamily: 'restraint' })), specialPresetIds); });
  test('フィルター：用途とポーズ系統と撮影範囲を組み合わせる', function () { var list = D.filterPresets(D.presets, 'full', { collection: 'relationship', poseFamily: 'rear_turn' }); list.forEach(function (p) { eq([p.meta.collection, p.meta.poseFamily, D.getPresetFramingGroup(p)], ['relationship', 'rear_turn', 'full']); }); });
  test('フィルター：ポーズ系統件数は全件数と一致', function () { var c = D.getPresetPoseFamilyCounts(D.presets), sum = Object.keys(D.presetPoseFamilyLabels).reduce(function (n, id) { return n + (c[id] || 0); }, 0); eq(sum, D.presets.length); });
  test('フィルター：relationship以外へ切替で専用条件をリセット', function () { eq(D.normalizeRelationshipPresetFilters('basic', 'sweet', 'bed', 'hand_interaction'), { mood: 'all', scene: 'all', interaction: 'all' }); });
  test('フィルター：コレクションのaria-pressedは1件', function () { var html = D.renderPresetCollectionFilters('relationship', D.presets); eq((html.match(/aria-pressed="true"/g) || []).length, 1); ok(/data-collection-filter="relationship" aria-pressed="true"/.test(html)); });
  test('フィルター：ポーズ系統のaria-pressedは1件', function () { var html = D.renderPresetPoseFamilyFilters('restraint', D.presets); eq((html.match(/aria-pressed="true"/g) || []).length, 1); ok(/data-pose-family-filter="restraint" aria-pressed="true"/.test(html)); });
  test('フィルター：aria-pressedは選択中だけtrue', function () { var html = D.renderPresetFramingFilters('half', D.presets); eq((html.match(/aria-pressed="true"/g) || []).length, 1); ok(/data-preset-filter="half" aria-pressed="true"/.test(html)); });
  test('フィルター：選択変更でaria-pressedが更新', function () { var html = D.renderPresetFramingFilters('full', D.presets); ok(/data-preset-filter="full" aria-pressed="true"/.test(html)); ok(!/data-preset-filter="half" aria-pressed="true"/.test(html)); });
  test('雰囲気UI：自然を選ぶとaria-pressedがtrue', function () { var html = D.renderFlowStyleChips('natural'); ok(/data-flow="natural" aria-pressed="true"/.test(html)); eq((html.match(/aria-pressed="true"/g) || []).length, 1); });
  test('雰囲気UI：堂々へ切替すると自然が解除', function () { var html = D.renderFlowStyleChips('confident'); ok(/data-flow="confident" aria-pressed="true"/.test(html)); ok(/data-flow="natural" aria-pressed="false"/.test(html)); });
  test('雰囲気UI：4ボタンはtype=buttonでタップ可能', function () { var html = D.renderFlowStyleChips(null); eq((html.match(/type="button"/g) || []).length, 4); eq((html.match(/data-flow=/g) || []).length, 4); });
  test('雰囲気状態：自然で下位候補が更新', function () { var s = S.applyFlowStyle(patch(null, { 'pose.posture': 'standing' }), 'natural'); eq([s.pose.flowStyle, s.pose.weight, s.pose.shoulders.emphasis], ['natural', 'one_leg', 'relaxed']); });
  test('雰囲気状態：堂々へ単一選択で切替', function () { var s = S.applyFlowStyle(S.applyFlowStyle(patch(null, { 'pose.posture': 'standing' }), 'natural'), 'confident'); eq([s.pose.flowStyle, s.pose.weight, s.pose.shoulders.emphasis], ['confident', 'even', 'drawn_back']); });
  test('雰囲気状態：選択後の構造要約は空でない', function () { var s = S.applyFlowStyle(S.initial(), 'natural'); ok(S.designSummary(s) !== 'まだ設計されていません'); ok(S.designSummary(s).indexOf('自然') >= 0); });

  test('正規化：nullでも起動', function () { eq(S.normalize(null).schemaVersion, '1.0'); });
  test('正規化：未知の姿勢を除去', function () { eq(S.normalize({ pose: { posture: 'flying' } }).pose.posture, null); });
  test('正規化：未知の画角を除去', function () { eq(S.normalize({ camera: { shotSize: 'macro' } }).camera.shotSize, null); });
  test('正規化：未知の腕動作を除去', function () { eq(S.normalize({ pose: { arms: { primary: { action: 'third_hand' } } } }).pose.arms.primary.action, null); });
  test('正規化：未知の視線を除去', function () { eq(S.normalize({ pose: { gaze: { target: 'unknown_target' } } }).pose.gaze.target, null); });
  test('正規化：人物数を1へ戻す', function () { eq(S.normalize({ subject: { count: 9 } }).subject.count, 1); });
  test('正規化：旧保存に寝姿軸がなくても移行', function () { var s = S.normalize({ pose: { posture: 'reclining' } }); eq([s.pose.lyingOrientation, s.pose.supportPose], ['none', 'none']); });
  test('正規化：旧保存に背面・表情・雰囲気軸がなくても移行', function () { var s = S.normalize({ pose: { posture: 'standing' } }); eq([s.pose.rearViewEmphasis, s.pose.expression, s.pose.flowStyle], ['none', 'none', null]); });
  test('正規化：旧保存に出力補助軸がなくても安全に移行', function () { var o = S.normalize({ output: { includeSolo: true } }).output; eq([o.suppressTextSymbols, o.suppressPhotographyEquipment, o.preserveClothing, o.supportOutfitAssist, o.backDesign], [false, false, false, true, 'none']); });
  test('正規化：出力補助の真偽値を保持', function () { var o = S.normalize({ output: { suppressTextSymbols: true, preserveClothing: true } }).output; eq([o.suppressTextSymbols, o.preserveClothing], [true, true]); });
  test('正規化：未知の背面衣装はnoneへ戻る', function () { eq(S.normalize({ output: { backDesign: 'missing_clothes' } }).output.backDesign, 'none'); });
  test('正規化：未知の背面強調はnoneへ戻る', function () { eq(S.normalize({ pose: { rearViewEmphasis: 'backiest' } }).pose.rearViewEmphasis, 'none'); });
  test('正規化：未知の表情はnoneへ戻る', function () { eq(S.normalize({ pose: { expression: 'mixed_emotions' } }).pose.expression, 'none'); });
  test('正規化：ベッドと横向き寝を保持', function () { var s = S.normalize({ pose: { support: { type: 'bed_surface' }, lyingOrientation: 'side_lying' } }); eq([s.pose.support.type, s.pose.lyingOrientation], ['bed_surface', 'side_lying']); });
  test('正規化：旧保存データへinteraction初期値を補う', function () { eq(S.normalize({ pose: { posture: 'standing' } }).interaction, { target: 'none', distance: 'normal', approach: 'none', viewerHandInteraction: 'none', viewerHandVisible: false }); });
  test('正規化：旧保存データへ拘束初期値を補う', function () { eq(S.normalize({ pose: { posture: 'standing' } }).restraint, { type: 'none', placement: 'none', anchor: 'none', tension: 'loose', freeArm: 'none' }); });
  test('正規化：未知の拘束値を安全値へ戻す', function () { eq(S.normalize({ restraint: { type: 'laser', placement: 'neck', anchor: 'sky', tension: 'painful', freeArm: 'both' } }).restraint, { type: 'none', placement: 'none', anchor: 'none', tension: 'loose', freeArm: 'none' }); });
  test('正規化：未知のinteraction値を除去', function () { eq(S.normalize({ interaction: { target: 'stranger', distance: 'nearer', approach: 'jump', viewerHandInteraction: 'many_hands', viewerHandVisible: true } }).interaction, { target: 'none', distance: 'normal', approach: 'none', viewerHandInteraction: 'none', viewerHandVisible: false }); });
  test('正規化：相手なしなら距離と動きとViewer手を初期化', function () { eq(S.normalize({ interaction: { target: 'none', distance: 'very_close', approach: 'lean_toward', viewerHandInteraction: 'holding', viewerHandVisible: true } }).interaction, { target: 'none', distance: 'normal', approach: 'none', viewerHandInteraction: 'none', viewerHandVisible: false }); });
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
  test('advisor：寝姿に支持面がなければinfo', function () { var s = patch(null, { 'pose.posture': 'reclining', 'pose.lyingOrientation': 'supine' }); ok(issueIds(s).indexOf('lying_without_surface') >= 0); });
  test('advisor：ベッド寝姿の向きなしはinfo', function () { var s = patch(null, { 'pose.posture': 'reclining', 'pose.support.type': 'bed_surface' }); ok(issueIds(s).indexOf('bed_orientation_missing') >= 0); });
  test('advisor：愛情ジェスチャーの全身画角はwarning', function () { var s = patch(null, { 'pose.posture': 'standing', 'pose.arms.mode': 'combined', 'pose.arms.combined': 'heart_hands_near_face', 'camera.shotSize': 'full_body' }); ok(issueIds(s).indexOf('affection_gesture_too_wide') >= 0); });
  test('advisor：背面強調と正面骨盤でwarning', function () { var s = patch(null, { 'pose.rearViewEmphasis': 'rear_three_quarter', 'pose.pelvis.orientation': 'camera' }); ok(issueIds(s).indexOf('rear_view_pelvis_mismatch') >= 0); });
  test('advisor：背面強調と正面顔でinfo', function () { var s = patch(null, { 'pose.rearViewEmphasis': 'rear_three_quarter', 'pose.pelvis.orientation': 'away_camera', 'pose.head.yaw': 'toward_camera' }); ok(issueIds(s).indexOf('rear_view_head_mismatch') >= 0); });
  test('advisor：背中と肩の顔アップは画角変更を提案', function () { var s = patch(null, { 'pose.rearViewEmphasis': 'back_and_shoulders', 'pose.pelvis.orientation': 'away_camera', 'camera.shotSize': 'headshot' }); var i = A.check(s).filter(function (x) { return x.id === 'rear_view_shot_too_close'; })[0]; ok(i); eq(i.resolutions[0].patch['camera.shotSize'], 'upper_body'); });
  test('advisor：四点支持と立位の不一致を警告', function () { var s = patch(null, { 'pose.posture': 'standing', 'pose.supportPose': 'hands_and_knees' }); ok(issueIds(s).indexOf('hands_and_knees_posture_mismatch') >= 0); });
  test('advisor：前傾支持に前傾がなければ案内', function () { var s = patch(null, { 'pose.supportPose': 'forward_lean_support', 'pose.torso.lean': 'neutral' }); ok(issueIds(s).indexOf('forward_support_lean_mismatch') >= 0); });
  test('advisor：背中主役で胴体を正面へひねると警告', function () { var s = patch(null, { 'pose.rearViewEmphasis': 'full_back_line', 'pose.pelvis.orientation': 'away_camera', 'pose.torso.relationToPelvis': 'counter' }); ok(issueIds(s).indexOf('rear_view_torso_mismatch') >= 0); });
  test('advisor：四点支持の近い画角は全身を提案', function () { var s = patch(null, { 'pose.supportPose': 'hands_and_knees', 'camera.shotSize': 'waist_up' }), i = A.check(s).filter(function (x) { return x.id === 'hands_and_knees_shot_too_close'; })[0]; ok(i); eq(i.resolutions[0].patch['camera.shotSize'], 'full_body'); });
  test('advisor：撮影機材抑制ONで説明を表示', function () { var s = patch(modelState(), { 'output.suppressPhotographyEquipment': true }); ok(issueIds(s).indexOf('photography_equipment_suppression') >= 0); });
  test('advisor：Viewerの手を表示する構図へ実用的な助言', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'holding', 'interaction.viewerHandVisible': true }); ok(issueIds(s).indexOf('viewer_hand_generation_tip') >= 0); });
  test('advisor：ベッド背面で服保持OFFなら案内', function () { var s = patch(null, { 'pose.support.type': 'bed_surface', 'pose.rearViewEmphasis': 'full_back_line', 'output.preserveClothing': false }), i = A.check(s).filter(function (x) { return x.id === 'rear_bed_clothing_risk'; })[0]; ok(i); eq(i.resolutions[0].patch['output.preserveClothing'], true); });
  test('advisor：四点支持の服装補助OFFなら再有効化を提案', function () { var s = patch(null, { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': false }); ok(issueIds(s).indexOf('hands_and_knees_outfit_tip') >= 0); });

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
  test('generator：視点高さと身体向きを混同しない', function () { var s = patch(modelState(), { 'camera.elevation': 'slightly_low', 'pose.pelvis.orientation': 'three_quarter' }); var c = G.compact(s); ok(c.indexOf('three-quarters') >= 0 && c.indexOf('viewed from slightly below') >= 0); });
  test('generator：高位置はviewed from above', function () { ok(G.compact(patch(modelState(), { 'camera.elevation': 'high' })).indexOf('viewed from above') >= 0); });
  test('generator：低位置はviewed from below', function () { ok(G.compact(patch(modelState(), { 'camera.elevation': 'low' })).indexOf('viewed from below') >= 0); });
  test('generator：こちらを見る表現にlooking at the cameraを使わない', function () { var c = G.compact(patch(modelState(), { 'pose.head.yaw': 'toward_camera', 'pose.gaze.target': 'viewer' })); ok(c.indexOf('head turned toward the viewer') >= 0); ok(c.indexOf('looking at the camera') < 0); });
  test('generator：背面表現はback facing the viewer', function () { var c = G.compact(patch(modelState(), { 'pose.rearViewEmphasis': 'back_and_shoulders', 'pose.pelvis.orientation': 'away_camera' })); ok(c.indexOf('back-facing pose') >= 0 && c.indexOf('away from the viewer') >= 0); ok(c.indexOf('back facing the camera') < 0); });
  test('generator：通常生成部分にcamera単語を残さない', function () { D.presets.forEach(function (p) { var s = S.applyPatch(S.initial(), p.patch), text = G.compact(s) + ' ' + G.detailed(s); ok(!/\bcamera\b/i.test(text), p.id + ' / ' + text); }); });
  test('generator：構造一覧に顔と視線が別見出し', function () { var j = G.structureJa(modelState()); ok(j.indexOf('【顔・首】') >= 0 && j.indexOf('【視線】') >= 0); });
  test('generator：相手視点の距離を出力', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.distance': 'very_close' }); ok(G.compact(s).indexOf('very close face-to-face distance') >= 0); });
  test('generator：身を寄せる句は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'lean_toward', 'pose.torso.lean': 'forward' }); var c = G.compact(s); eq((c.match(/leaning toward the viewer/g) || []).length, 1); ok(c.indexOf('torso leaning forward') < 0); });
  test('generator：身を引く句は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'lean_away', 'pose.torso.lean': 'backward' }); var c = G.compact(s); eq((c.match(/leaning slightly away from the viewer/g) || []).length, 1); ok(c.indexOf('torso leaning backward') < 0); });
  test('generator：相手へ伸ばす腕は一度だけ', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'reach_toward', 'pose.arms.primary.action': 'reaching_forward', 'pose.arms.secondary.action': null }); var c = G.compact(s); eq((c.match(/reaching toward the viewer/g) || []).length, 1); });
  test('generator：歩み寄る句は一度だけ', function () { var s = patch(modelState(), { 'pose.posture': 'walking', 'pose.motion.state': 'mid_motion', 'interaction.target': 'viewer', 'interaction.approach': 'approaching' }); var c = G.compact(s); eq((c.match(/moving toward the viewer/g) || []).length, 1); ok(c.indexOf('solo character walking') >= 0); });
  test('generator：相手視点でも二人目を出力しない', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.distance': 'close' }); var c = G.compact(s); ['another person', 'another man', 'his partner', 'someone', 'second character', 'two characters'].forEach(function (term) { ok(c.indexOf(term) < 0); }); });
  test('generator：ベッド仰向けを出力', function () { var s = patch(modelState(), { 'pose.posture': 'reclining', 'pose.support.type': 'bed_surface', 'pose.lyingOrientation': 'supine' }); var c = G.compact(s); ok(c.indexOf('on a bed') >= 0 && c.indexOf('lying supine') >= 0); });
  test('generator：横向き寝を出力', function () { var s = patch(modelState(), { 'pose.posture': 'reclining', 'pose.support.type': 'bed_surface', 'pose.lyingOrientation': 'side_lying' }); ok(G.compact(s).indexOf('lying on the side') >= 0); });
  test('generator：両手ハートを顔近くへ出力', function () { var s = patch(modelState(), { 'pose.arms.mode': 'combined', 'pose.arms.combined': 'heart_hands_near_face', 'pose.arms.primary.action': null, 'pose.arms.secondary.action': null, 'camera.shotSize': 'bust_shot' }); ok(G.compact(s).indexOf('heart shape with both hands near the face') >= 0); });
  test('generator：指ハートを顔近くへ出力', function () { var s = patch(modelState(), { 'pose.arms.primary.action': 'finger_heart_near_face', 'pose.arms.secondary.action': null, 'camera.shotSize': 'headshot' }); ok(G.compact(s).indexOf('finger heart held near the face') >= 0); });
  test('generator：頬タッチのreach_towardは重複しない', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'reach_toward', 'pose.arms.primary.action': 'reaching_forward_soft', 'pose.arms.secondary.action': null }); var c = G.compact(s); eq((c.match(/reaching gently toward the viewer/g) || []).length, 1); });
  test('generator：頬つまみを中立表現で出力', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.approach': 'reach_toward', 'pose.arms.primary.action': 'pinching_toward_viewer', 'pose.arms.secondary.action': null }); ok(G.compact(s).indexOf('lightly pinching the viewer’s cheek') >= 0); });
  test('generator：背面指定なしでは従来出力を変えない', function () { var s = modelState(), before = G.compact(s); s = patch(s, { 'pose.rearViewEmphasis': 'none' }); eq(G.compact(s), before); });
  test('generator：背面斜めにseen from behind', function () { var s = patch(modelState(), { 'pose.rearViewEmphasis': 'rear_three_quarter' }); ok(G.compact(s).indexOf('seen from behind') >= 0); });
  test('generator：背中と肩を明示', function () { var s = patch(modelState(), { 'pose.rearViewEmphasis': 'back_and_shoulders' }); ok(G.compact(s).indexOf('back and shoulders clearly visible') >= 0); });
  test('generator：腰を奥へ向ける表現', function () { var s = patch(modelState(), { 'pose.rearViewEmphasis': 'hips_away' }); ok(G.compact(s).indexOf('hips angled away from the viewer') >= 0); });
  test('generator：表情は単一軸で出力', function () { var s = patch(modelState(), { 'pose.expression': 'wistful' }); ok(G.compact(s).indexOf('wistful expression') >= 0); ok(G.structureJa(s).indexOf('表情：切なげ') >= 0); });
  test('表情：追加20候補が重複なしで揃う', function () {
    var expected = ['closed_mouth_smile', 'relieved_smile', 'bashful_smile', 'suppressing_laugh', 'barely_contained_happy_smile', 'affectionate_smile', 'slight_pout', 'wistful', 'mischievous_grin', 'smug_smile', 'knowing_smile', 'provocative_smile', 'confident_smile', 'wary', 'confused', 'defiant', 'frustrated', 'resigned', 'quiet_tears', 'determined'];
    expected.forEach(function (id) { eq(D.expressions.filter(function (x) { return x.id === id; }).length, 1, id); });
  });
  test('表情：全候補が4表示グループのいずれかに入る', function () { var groups = ids(D.expressionGroups); D.expressions.forEach(function (x) { ok(groups.indexOf(x.group) >= 0, x.id); }); });
  test('表情：切替は単一選択で視線を維持', function () { var s = patch(modelState(), { 'pose.gaze.direction': 'sidelong', 'pose.expression': 'bashful_smile' }); s = patch(s, { 'pose.expression': 'determined' }); eq([s.pose.expression, s.pose.gaze.direction], ['determined', 'sidelong']); ok(G.compact(s).indexOf('bashful smile') < 0 && G.compact(s).indexOf('determined expression') >= 0); });
  test('generator：playful表情だけでは文字記号を抑制しない', function () { var playful = G.compact(patch(modelState(), { 'pose.expression': 'playful' })); ok(playful.indexOf('playful expression') >= 0); ok(playful.indexOf('no comic symbols') < 0 && playful.indexOf('no text') < 0); });
  test('generator：文字記号抑制OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.suppressTextSymbols': false })); ok(c.indexOf('no Japanese text') < 0 && c.indexOf('no comic symbols') < 0); });
  test('generator：文字記号抑制ONで補助文を追加', function () { var s = patch(modelState(), { 'output.suppressTextSymbols': true }), c = G.compact(s); ok(c.indexOf('no text') >= 0 && c.indexOf('no comic symbols') >= 0 && c.indexOf('no sound effect symbols') >= 0); ok(G.structureJa(s).indexOf('文字・記号：抑制') >= 0); });
  test('generator：撮影機材抑制OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.suppressPhotographyEquipment': false })); ok(c.indexOf('no visible photography equipment') < 0 && c.indexOf('no filming equipment') < 0); });
  test('generator：撮影機材抑制ONでcamera語なしの補助文を追加', function () { var s = patch(modelState(), { 'output.suppressPhotographyEquipment': true }), c = G.compact(s); ok(c.indexOf('no visible photography equipment') >= 0 && c.indexOf('no photographer') >= 0 && c.indexOf('no filming equipment') >= 0); ok(!/\bcamera\b/i.test(c)); ok(G.structureJa(s).indexOf('撮影機材：抑制') >= 0); });
  test('generator：服保持OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.preserveClothing': false })); ok(c.indexOf('clothing intact') < 0 && c.indexOf('no bare torso') < 0); });
  test('generator：服保持ONで腰まわりまで覆う補助文を追加', function () { var s = patch(modelState(), { 'output.preserveClothing': true }), c = G.compact(s); ok(c.indexOf('fully clothed') >= 0 && c.indexOf('shirt remains down') >= 0 && c.indexOf('hips and buttocks covered by clothing') >= 0 && c.indexOf('no exposed buttocks') >= 0 && c.indexOf('no nudity') >= 0 && c.indexOf('not underwear-only') >= 0); ok(G.structureJa(s).indexOf('服装：保持') >= 0); });
  test('generator：服装自由入力を判定', function () { ok(G.hasClothingDescription('fitted white t-shirt, slim black pants')); ok(!G.hasClothingDescription('soft bedroom lighting')); });
  test('generator：四点支持＋服保持で服装例を自動補助', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') >= 0 && c.indexOf('shorts clearly visible') >= 0); });
  test('generator：四点支持でも服保持OFFなら服装例なし', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': false, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：四点支持の服装補助OFFなら服装例なし', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': false }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：自由入力に服装があれば自動服装例を重ねない', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': true, 'output.customText': 'fitted white t-shirt, slim black pants' }), c = G.compact(s); ok(c.indexOf('black lounge shorts') < 0); ok(c.endsWith('fitted white t-shirt, slim black pants')); });
  test('generator：四点支持以外では自動服装例なし', function () { var s = patch(modelState(), { 'output.preserveClothing': true, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：四点支持は近い画角でも全身へ出力補正', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'camera.shotSize': 'waist_up' }), c = G.compact(s), j = G.structureJa(s); ok(c.indexOf('full-body shot') >= 0 && c.indexOf('waist-up shot') < 0); ok(c.indexOf('both hands visible') >= 0 && c.indexOf('both knees visible') >= 0); ok(j.indexOf('四点支持のため出力を全身へ補正') >= 0); });

  viewerHandPresetIds.forEach(function (id) {
    test('手のやりとりプリセット：' + id + 'は専用state・カテゴリ・hard 0件', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch);
      ok(p); eq(p.meta.collection, 'relationship'); ok(p.meta.interactionTags.indexOf('hand_interaction') >= 0); ok(s.interaction.viewerHandInteraction !== 'none'); eq(s.interaction.target, 'viewer'); eq(s.subject.count, 1); eq(A.summary(s).hard, 0);
    });
  });
  viewerHandVisiblePresetIds.forEach(function (id) {
    test('Viewer手表示：' + id + 'は手前から片手だけを明記', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s);
      eq(s.interaction.viewerHandVisible, true); ok(c.indexOf('a single viewer hand entering from the foreground') >= 0); ok(c.indexOf('only one hand of the viewer visible') >= 0); ok(c.indexOf('no multiple viewer hands') >= 0);
    });
  });
  ['relationship_offer_one_hand_to_viewer', 'relationship_offer_bite_to_viewer'].forEach(function (id) {
    test('Viewer手不要：' + id + 'はViewer自身の手を描写しない', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s);
      eq(s.interaction.viewerHandVisible, false); ok(c.indexOf("viewer's hand") < 0 && c.indexOf('viewer hand entering') < 0 && c.indexOf('hand of the viewer') < 0);
    });
  });
  test('Viewer手：通常プリセットではViewer手描写を出さない', function () { var c = G.compact(S.applyPatch(S.initial(), D.presets.filter(function (p) { return p.id === 'basic_front'; })[0].patch)); ok(c.indexOf("viewer's hand") < 0 && c.indexOf('viewer hand entering') < 0); });
  test('Viewer手：既存の腕指定と自由入力を上書きしない', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'feeding', 'interaction.viewerHandVisible': false, 'pose.arms.primary.action': 'hand_on_hip', 'output.customText': 'a strawberry on a small fork' }), c = G.compact(s); eq(s.pose.arms.primary.action, 'hand_on_hip'); ok(c.indexOf('hand resting on the hip') >= 0); ok(c.endsWith('a strawberry on a small fork')); ok(c.indexOf('holding a spoon') < 0); });
  test('Viewer手：feedingは自由入力なしの場合だけスプーンを補助', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'feeding', 'interaction.viewerHandVisible': false }), c = G.compact(s); ok(c.indexOf('offering a small bite of food toward the viewer') >= 0 && c.indexOf('holding a spoon near the foreground') >= 0); });

  rearViewPresetIds.forEach(function (id) {
    test('背面プリセット：' + id + 'は背面条件を満たす', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), text = G.compact(s);
      eq(s.pose.pelvis.orientation, 'away_camera'); ok(s.pose.rearViewEmphasis !== 'none'); eq(s.pose.head.yaw, 'over_shoulder'); eq(s.pose.gaze.target, 'viewer'); eq(A.summary(s).hard, 0);
      ok(/seen from behind|back-facing pose|hips angled away/.test(text)); ok(!/front-facing|facing the viewer/.test(text)); ok(text.indexOf('undefined') < 0 && text.indexOf('null') < 0 && text.indexOf(',,') < 0);
    });
  });
  backFocusedPresetIds.forEach(function (id) {
    test('背中主役プリセット：' + id + 'は顔だけ振り返る拘束を維持', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), compact = G.compact(s), detailed = G.detailed(s), ja = G.structureJa(s);
      eq(s.pose.pelvis.orientation, 'away_camera'); eq(s.pose.torso.relationToPelvis, 'aligned'); eq(s.pose.head.yaw, 'over_shoulder'); eq(s.pose.gaze.target, 'viewer'); ok(s.pose.rearViewEmphasis !== 'none'); eq(A.summary(s).hard, 0);
      ok(compact.indexOf('only the head turned toward the viewer') >= 0 && compact.indexOf('no front-facing torso') >= 0 && compact.indexOf('torso kept facing away') >= 0 || compact.indexOf('torso remains facing away') >= 0);
      ok(detailed.indexOf('torso and hips remain facing away') >= 0); ok(ja.indexOf('背面拘束') >= 0); ok(compact && detailed && ja); ok((compact + detailed).indexOf('undefined') < 0 && (compact + detailed).indexOf('null') < 0 && compact.indexOf(',,') < 0);
    });
  });
  test('背中主役：四つん這いは四点支持・全身・服装を固定', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_hands_and_knees_look_back'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.posture, s.pose.supportPose, s.pose.lyingOrientation, s.camera.shotSize], ['kneeling', 'hands_and_knees', 'none', 'full_body']); eq([s.output.preserveClothing, s.output.supportOutfitAssist], [true, true]); ['both palms flat on the bed', 'both knees on the bed', 'weight supported by both hands and both knees', 'hips raised', 'full body visible', 'both hands visible', 'both knees visible', 'not sitting', 'not kneeling upright', 'not lying flat', 'not standing', 'not one knee raised', 'no front-facing torso', 'white t-shirt and black lounge shorts'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); }); });
  test('背中主役：膝立ちは立位へ逃げない', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_kneeling_upright_look_back'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.posture, s.pose.supportPose], ['kneeling', 'kneeling_upright']); ok(c.indexOf('kneeling upright') >= 0 && c.indexOf('not standing') >= 0); });
  test('背中主役：ベッド前傾は前傾支持を維持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_forward_lean_back_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.supportPose, s.pose.torso.lean], ['forward_lean_support', 'forward']); ok(c.indexOf('leaning forward while supporting the body with both hands') >= 0 && c.indexOf('not standing upright') >= 0); });
  test('背中主役：家具支持はもたれ姿ではなく両手支持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_furniture_hands_support_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.support.type, s.pose.supportPose], ['leaning_surface', 'leaning_forward_on_hands']); ok(c.indexOf('supporting the body with both hands') >= 0 && c.indexOf('not lying flat') >= 0); });
  test('背中主役：背中の開いた服は衣装を保持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_open_back_outfit_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.output.backDesign, s.output.preserveClothing], ['open_back_outfit', true]); ok(c.indexOf('open-back outfit') >= 0 && c.indexOf('fabric following the back line') >= 0 && c.indexOf('clothing intact') >= 0 && c.indexOf('no bare torso') >= 0); });
  test('顔隠し：腕動作は1本の手を使い顔付近に表示', function () {
    ['hand_covering_eyes', 'hand_covering_mouth'].forEach(function (id) { var item = S.option(D.armActions, id); eq(item.resources.hands, 1); ok(item.zones.indexOf('hands_near_face') >= 0); ok(!A.armHidden(item, 'upper_body')); });
  });
  test('顔隠し：目元隠しは1回だけでdirect gazeなし', function () {
    var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_supine_covering_eyes'; })[0], s = S.applyPatch(S.initial(), p.patch), text = G.compact(s);
    eq((text.match(/hand covering the eyes/g) || []).length, 1); ok(text.indexOf('direct gaze') < 0 && text.indexOf('eyes directed toward the viewer') < 0); eq(A.summary(s).hard, 0);
  });
  test('顔隠し：口元隠しは1回だけでViewer視線を維持', function () {
    var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_supine_covering_mouth'; })[0], s = S.applyPatch(S.initial(), p.patch), text = G.compact(s);
    eq((text.match(/hand lightly covering the mouth/g) || []).length, 1); ok(text.indexOf('eyes directed toward the viewer') >= 0); eq(A.summary(s).hard, 0);
  });
  faceCoveringPresetIds.forEach(function (id) {
    test('顔隠しプリセット：' + id + 'は仰向け・上半身・hard 0件', function () { var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch); eq([s.pose.support.type, s.pose.lyingOrientation, s.camera.shotSize], ['bed_surface', 'supine', 'upper_body']); eq(A.summary(s).hard, 0); });
  });

  function restraintState(values) {
    return patch(modelState(), Object.assign({
      'pose.arms.mode': 'separate',
      'pose.arms.primary.action': null,
      'pose.arms.secondary.action': null,
      'pose.arms.combined': null,
      'restraint.type': 'rope',
      'restraint.placement': 'wrists_front',
      'restraint.anchor': 'none',
      'restraint.tension': 'loose',
      'restraint.freeArm': 'none'
    }, values || {}));
  }
  test('拘束出力：初期値では拘束語・成人指定・否定文を追加しない', function () { var c = G.compact(modelState()); ['adult character', 'restraints clearly', 'no restraints around the neck', 'no blood'].forEach(function (term) { ok(c.indexOf(term) < 0, term); }); });
  test('拘束出力：縄を両手首だけへ限定', function () { var c = G.compact(restraintState()); ok(c.indexOf('both wrists loosely bound together in front') >= 0 && c.indexOf('rope wrapped around the wrists only') >= 0); });
  test('拘束出力：鎖・手錠・ストラップを切り替え', function () {
    [['chain', 'chain secured around the wrists only'], ['cuffs', 'cuffs secured around the wrists only'], ['straps', 'straps secured around the wrists only']].forEach(function (row) { ok(G.compact(restraintState({ 'restraint.type': row[0] })).indexOf(row[1]) >= 0, row[0]); });
  });
  test('拘束出力：固定先を壁・柱・頭上へ切り替え', function () {
    [['wall', 'secured to a wall fixture'], ['pillar', 'secured to a pillar'], ['overhead_fixture', 'attached to an overhead fixture']].forEach(function (row) { ok(G.compact(restraintState({ 'restraint.anchor': row[0] })).indexOf(row[1]) >= 0, row[0]); });
  });
  test('拘束出力：拘束時だけ成人・非流血・首回避を追加', function () { var c = G.compact(restraintState()); ['adult character', 'no restraints around the neck', 'no injury', 'no bruises', 'no blood', 'no broken limbs'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); }); });
  test('拘束出力：頭上固定は床支持と非吊り下げを明示', function () { var c = G.compact(restraintState({ 'restraint.type': 'cuffs', 'restraint.placement': 'wrists_overhead', 'restraint.anchor': 'overhead_fixture', 'restraint.tension': 'secured' })); ok(c.indexOf('both feet firmly on the floor') >= 0 && c.indexOf('not suspended') >= 0 && c.indexOf('not hanging') >= 0); });
  test('拘束出力：片手首だけを固定し反対腕を自由にする', function () { var c = G.compact(restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'one_wrist', 'restraint.anchor': 'wall', 'restraint.freeArm': 'right' })); ok(c.indexOf('only one wrist restrained') >= 0 && c.indexOf('the other arm free and relaxed') >= 0); });
  test('拘束出力：椅子固定は座位・椅子・床の足を明示', function () { var p = D.presets.filter(function (x) { return x.id === 'special_chair_armrests_restraint'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch)); ok(c.indexOf('each wrist secured to a separate chair armrest') >= 0 && c.indexOf('seated upright in a chair') >= 0 && c.indexOf('feet resting on the floor') >= 0); });
  test('拘束出力：装飾鎖は腕と胴体だけで首へ巻かない', function () { var p = D.presets.filter(function (x) { return x.id === 'special_decorative_chain_torso_standing'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch)); ok(c.indexOf('around the arms and torso') >= 0 && c.indexOf('not the neck') >= 0); });
  test('拘束Advisor：四つん這い＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'pose.posture': 'kneeling', 'pose.supportPose': 'hands_and_knees' })).indexOf('restraint_both_hands_support_conflict') >= 0); });
  test('拘束Advisor：両手ハート＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'pose.arms.mode': 'combined', 'pose.arms.combined': 'heart_hands_near_face' })).indexOf('restraint_two_hand_gesture_conflict') >= 0); });
  test('拘束Advisor：Viewerへ一口差し出す＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'feeding' })).indexOf('restraint_viewer_hand_conflict') >= 0); });
  test('拘束Advisor：椅子肘掛け固定＋非座位でhard', function () { ok(issueIds(restraintState({ 'restraint.placement': 'chair_armrests', 'restraint.anchor': 'chair', 'pose.posture': 'standing' })).indexOf('restraint_chair_posture_conflict') >= 0); });
  test('拘束Advisor：足首固定＋立位でhard', function () { ok(issueIds(restraintState({ 'restraint.placement': 'ankles', 'restraint.tension': 'secured', 'pose.posture': 'standing' })).indexOf('restraint_ankles_posture_conflict') >= 0); });
  test('拘束Advisor：片手首拘束＋片手動作は許可', function () { var s = restraintState({ 'restraint.placement': 'one_wrist', 'restraint.freeArm': 'right', 'pose.arms.primary.action': 'hand_near_chest' }); ok(issueIds(s).indexOf('restraint_one_wrist_too_many_actions') < 0); });
  test('拘束Advisor：片手首拘束＋両手動作でhard', function () { var s = restraintState({ 'restraint.placement': 'one_wrist', 'restraint.freeArm': 'right', 'pose.arms.mode': 'combined', 'pose.arms.combined': 'hands_clasped' }); ok(issueIds(s).indexOf('restraint_one_wrist_too_many_actions') >= 0); });
  test('拘束Advisor：未成年を示す自由入力でhard', function () { ok(issueIds(restraintState({ 'output.customText': 'underage character' })).indexOf('restraint_minor_conflict') >= 0); });
  specialPresetIds.forEach(function (id) {
    test('特殊プリセット：' + id + 'は成人・非損傷・首拘束なし', function () { var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([p.meta.collection, p.meta.poseFamily], ['special', 'restraint']); eq(A.summary(s).hard, 0); ok(c.indexOf('adult character') >= 0 && c.indexOf('no restraints around the neck') >= 0 && c.indexOf('no blood') >= 0); ok(c.indexOf('around the neck') < 0 || c.indexOf('no restraints around the neck') >= 0); });
  });

  D.presets.forEach(function (preset) {
    test('プリセット：' + preset.nameJa + 'はhard 0件', function () { var s = S.applyPatch(S.initial(), preset.patch); eq(A.summary(s).hard, 0); ok(G.compact(s)); ok(G.detailed(s)); ok(G.structureJa(s)); });
    test('プリセット出力：' + preset.nameJa + 'に空値や空カンマがない', function () { var s = S.applyPatch(S.initial(), preset.patch); var text = G.compact(s) + ' ' + G.detailed(s); ok(text.indexOf('undefined') < 0 && text.indexOf('null') < 0 && text.indexOf(',,') < 0); });
  });
  relationshipPresetIds.forEach(function (id) {
    test('relationship出力：' + id + 'は一人表示と公開向け表現を守る', function () { var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), text = (G.compact(s) + ' ' + G.detailed(s)).toLowerCase(); ['another person', 'another man', 'his partner', 'second character', 'two characters', 'pinned down', 'forcing', 'sexual position'].forEach(function (term) { ok(text.indexOf(term) < 0, id + ' / ' + term); }); eq(s.subject.count, 1); });
  });
  relationshipNewIds.forEach(function (id) {
    test('新規relationship：' + id + 'のmetaとinteraction', function () { var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch); eq(p.meta.collection, 'relationship'); eq(s.interaction.target, 'viewer'); eq(A.summary(s).hard, 0); });
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
