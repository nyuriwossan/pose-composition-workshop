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
  test('初期状態：任意の出力補助とNegativeはOFF、四点支持の服装補助は待機', function () { var o = S.initial().output; eq([o.includeNegativePrompt, o.suppressTextSymbols, o.suppressPhotographyEquipment, o.preserveClothing, o.supportOutfitAssist, o.backDesign], [false, false, false, false, true, 'none']); });
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
  test('データ：ビルトインプリセットは77件', function () { eq(D.presets.length, 77); });
  test('データ：全プリセットにshotSizeがある', function () { D.presets.forEach(function (p) { ok(p.patch.camera && p.patch.camera.shotSize); }); });
  test('データ：既存15プリセットを保持', function () { legacyPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：relationship既存15件が揃う', function () { relationshipExistingIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：relationship新規13件が揃う', function () { relationshipNewIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：背面5件・顔隠し2件・背中主役5件が揃う', function () { relationshipAddedIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：手のやりとり6件が揃う', function () { viewerHandPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：既存の拘束・演出8件が揃う', function () { specialPresetIds.forEach(function (id) { ok(ids(D.presets).indexOf(id) >= 0); }); });
  test('データ：全プリセットにcollectionがある', function () { D.presets.forEach(function (p) { ok(['basic', 'relationship', 'special'].indexOf(p.meta.collection) >= 0); }); });
  test('データ：basic 15件・relationship 46件・special 16件', function () { var c = D.getPresetCollectionCounts(D.presets); eq([c.basic, c.relationship, c.special], [15, 46, 16]); });
  test('データ：全プリセットにposeFamilyが1つある', function () { D.presets.forEach(function (p) { ok(D.presetPoseFamilyLabels[p.meta.poseFamily], p.id); }); });
  test('データ：既存の特殊8件は拘束・固定系統を保持', function () { specialPresetIds.forEach(function (id) { eq(D.presets.filter(function (p) { return p.id === id; })[0].meta.poseFamily, 'restraint'); }); });
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
  test('分類：アップ13・半身33・全身31', function () { var c = D.getPresetFramingCounts(D.presets); eq([c.up, c.half, c.full], [13, 33, 31]); });
  test('分類：分類別件数の合計が全件数', function () { var c = D.getPresetFramingCounts(D.presets); eq(c.up + c.half + c.full + c.other, c.all); });
  test('フィルター：アップだけを返す', function () { var list = D.filterPresets(D.presets, 'up', false); eq(list.length, 13); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'up'); }); });
  test('フィルター：半身だけを返す', function () { var list = D.filterPresets(D.presets, 'half', false); eq(list.length, 33); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'half'); }); });
  test('フィルター：全身だけを返す', function () { var list = D.filterPresets(D.presets, 'full', false); eq(list.length, 31); list.forEach(function (p) { eq(D.getPresetFramingGroup(p), 'full'); }); });
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
  test('正規化：旧保存に出力補助軸がなくても安全に移行', function () { var o = S.normalize({ output: { includeSolo: true } }).output; eq([o.includeNegativePrompt, o.suppressTextSymbols, o.suppressPhotographyEquipment, o.preserveClothing, o.supportOutfitAssist, o.backDesign], [false, false, false, false, true, 'none']); });
  test('正規化：Negative出力設定を保持', function () { eq(S.normalize({ output: { includeNegativePrompt: true } }).output.includeNegativePrompt, true); });
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
  test('generator：顔アップでは腰の手を出さない', function () { var s = patch(modelState(), { 'camera.shotSize': 'face_close_up' }); ok(G.compact(s).indexOf('hand on hip') < 0); });
  test('generator：顔アップでも顎に手は出る', function () { var s = patch(modelState(), { 'camera.shotSize': 'face_close_up', 'pose.arms.primary.action': 'hand_touching_chin', 'pose.arms.secondary.action': null }); ok(G.compact(s).indexOf('hand on chin') >= 0); });
  test('generator：undefinedを出さない', function () { ok(G.compact(modelState()).indexOf('undefined') < 0); });
  test('generator：nullを出さない', function () { ok(G.compact(modelState()).indexOf('null') < 0); });
  test('generator：空カンマを出さない', function () { ok(G.compact(modelState()).indexOf(',,') < 0); });
  test('generator：連続ピリオドを出さない', function () { ok(G.detailed(modelState()).indexOf('..') < 0); });
  test('generator：同じ句を重複しない', function () { var c = G.compact(modelState()).split(', '); eq(new Set(c).size, c.length); });
  test('generator：自由入力を末尾へそのまま追加', function () { var custom = 'custom WORDS: keep-me'; var s = patch(modelState(), { 'output.customText': custom }); ok(G.compact(s).endsWith(custom)); });
  test('generator：未選択ブロックを除外', function () { var b = G.blocks(S.initial()); eq(b.arms.compact.length, 0); });
  test('generator：視点高さと身体向きを混同しない', function () { var s = patch(modelState(), { 'camera.elevation': 'slightly_low', 'pose.pelvis.orientation': 'three_quarter' }); var c = G.compact(s); ok(c.indexOf('three-quarter pelvis') >= 0 && c.indexOf('from slightly below') >= 0); });
  test('generator：高位置はfrom above', function () { ok(G.compact(patch(modelState(), { 'camera.elevation': 'high' })).indexOf('from above') >= 0); });
  test('generator：低位置はfrom below', function () { ok(G.compact(patch(modelState(), { 'camera.elevation': 'low' })).indexOf('from below') >= 0); });
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
  test('generator：ベッド仰向けを出力', function () { var s = patch(modelState(), { 'pose.posture': 'reclining', 'pose.support.type': 'bed_surface', 'pose.lyingOrientation': 'supine' }); var c = G.compact(s); ok(c.indexOf('on a bed') >= 0 && c.indexOf('on back') >= 0); });
  test('generator：横向き寝を出力', function () { var s = patch(modelState(), { 'pose.posture': 'reclining', 'pose.support.type': 'bed_surface', 'pose.lyingOrientation': 'side_lying' }); ok(G.compact(s).indexOf('on side') >= 0); });
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
  test('generator：playful表情だけでは文字記号補助を加えない', function () { var playful = G.compact(patch(modelState(), { 'pose.expression': 'playful' })); ok(playful.indexOf('playful expression') >= 0); ok(playful.indexOf('clean unmarked background') < 0); });
  test('generator：文字記号抑制OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.suppressTextSymbols': false })); ok(c.indexOf('clean unmarked background') < 0); });
  test('generator：文字記号抑制ONはPositiveを肯定形にする', function () { var s = patch(modelState(), { 'output.suppressTextSymbols': true }), c = G.compact(s); ok(c.indexOf('clean unmarked background') >= 0 && c.indexOf('graphic-free presentation') >= 0); ok(G.structureJa(s).indexOf('文字・記号：抑制') >= 0); });
  test('generator：撮影機材抑制OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.suppressPhotographyEquipment': false })); ok(c.indexOf('unobstructed first-person viewpoint') < 0); });
  test('generator：撮影機材抑制ONでcamera語なしの肯定文を追加', function () { var s = patch(modelState(), { 'output.suppressPhotographyEquipment': true }), c = G.compact(s); ok(c.indexOf('unobstructed first-person viewpoint') >= 0 && c.indexOf('subject fully visible') >= 0); ok(!/\bcamera\b/i.test(c)); ok(G.structureJa(s).indexOf('撮影機材：抑制') >= 0); });
  test('generator：服保持OFFでは補助文なし', function () { var c = G.compact(patch(modelState(), { 'output.preserveClothing': false })); ok(c.indexOf('clothing intact') < 0); });
  test('generator：服保持ONで腰まわりまで覆う肯定文を追加', function () { var s = patch(modelState(), { 'output.preserveClothing': true }), c = G.compact(s); ok(c.indexOf('fully clothed') >= 0 && c.indexOf('clothing intact') >= 0 && c.indexOf('clothing fully covering the torso, hips, and buttocks') >= 0); ok(G.structureJa(s).indexOf('服装：保持') >= 0); });
  test('generator：服装自由入力を判定', function () { ok(G.hasClothingDescription('fitted white t-shirt, slim black pants')); ok(!G.hasClothingDescription('soft bedroom lighting')); });
  test('generator：四点支持＋服保持で服装例を自動補助', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') >= 0 && c.indexOf('shorts clearly visible') >= 0); });
  test('generator：四点支持でも服保持OFFなら服装例なし', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': false, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：四点支持の服装補助OFFなら服装例なし', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': false }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：自由入力に服装があれば自動服装例を重ねない', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'output.preserveClothing': true, 'output.supportOutfitAssist': true, 'output.customText': 'fitted white t-shirt, slim black pants' }), c = G.compact(s); ok(c.indexOf('black lounge shorts') < 0); ok(c.endsWith('fitted white t-shirt, slim black pants')); });
  test('generator：四点支持以外では自動服装例なし', function () { var s = patch(modelState(), { 'output.preserveClothing': true, 'output.supportOutfitAssist': true }), c = G.compact(s); ok(c.indexOf('white t-shirt and black lounge shorts') < 0); });
  test('generator：四点支持は近い画角でも全身へ出力補正', function () { var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'camera.shotSize': 'waist_up' }), c = G.compact(s), j = G.structureJa(s); ok(c.indexOf('full body') >= 0 && c.indexOf('waist up') < 0); ok(c.indexOf('both hands visible') >= 0 && c.indexOf('both knees visible') >= 0); ok(j.indexOf('四点支持のため出力を全身へ補正') >= 0); });

  viewerHandPresetIds.forEach(function (id) {
    test('手のやりとりプリセット：' + id + 'は専用state・カテゴリ・hard 0件', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch);
      ok(p); eq(p.meta.collection, 'relationship'); ok(p.meta.interactionTags.indexOf('hand_interaction') >= 0); ok(s.interaction.viewerHandInteraction !== 'none'); eq(s.interaction.target, 'viewer'); eq(s.subject.count, 1); eq(A.summary(s).hard, 0);
    });
  });
  viewerHandVisiblePresetIds.forEach(function (id) {
    test('Viewer手表示：' + id + 'は手前から片手だけを明記', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s);
      eq(s.interaction.viewerHandVisible, true); ok(c.indexOf('a single anatomically complete viewer hand entering from the foreground') >= 0);
    });
  });
  ['relationship_offer_one_hand_to_viewer', 'relationship_offer_bite_to_viewer'].forEach(function (id) {
    test('Viewer手不要：' + id + 'はViewer自身の手を描写しない', function () {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s);
      eq(s.interaction.viewerHandVisible, false); ok(c.indexOf("viewer's hand") < 0 && c.indexOf('viewer hand entering') < 0 && c.indexOf('hand of the viewer') < 0);
    });
  });
  test('Viewer手：通常プリセットではViewer手描写を出さない', function () { var c = G.compact(S.applyPatch(S.initial(), D.presets.filter(function (p) { return p.id === 'basic_front'; })[0].patch)); ok(c.indexOf("viewer's hand") < 0 && c.indexOf('viewer hand entering') < 0); });
  test('Viewer手：既存の腕指定と自由入力を上書きしない', function () { var s = patch(modelState(), { 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'feeding', 'interaction.viewerHandVisible': false, 'pose.arms.primary.action': 'hand_on_hip', 'output.customText': 'a strawberry on a small fork' }), c = G.compact(s); eq(s.pose.arms.primary.action, 'hand_on_hip'); ok(c.indexOf('hand on hip') >= 0); ok(c.endsWith('a strawberry on a small fork')); ok(c.indexOf('holding a spoon') < 0); });
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
      ok(compact.indexOf('only the head turned toward the viewer') >= 0 && (compact.indexOf('torso kept facing away') >= 0 || compact.indexOf('torso remains facing away') >= 0));
      ok(detailed.indexOf('torso and hips remain facing away') >= 0); ok(ja.indexOf('背面拘束') >= 0); ok(compact && detailed && ja); ok((compact + detailed).indexOf('undefined') < 0 && (compact + detailed).indexOf('null') < 0 && compact.indexOf(',,') < 0);
    });
  });
  test('背中主役：四つん這いは四点支持・全身・服装を固定', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_hands_and_knees_look_back'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.posture, s.pose.supportPose, s.pose.lyingOrientation, s.camera.shotSize], ['kneeling', 'hands_and_knees', 'none', 'full_body']); eq([s.output.preserveClothing, s.output.supportOutfitAssist], [true, true]); ['on all fours', 'both palms and knees on bed', 'weight supported by all four points', 'hips raised', 'full body visible', 'both hands visible', 'both knees visible', 'white t-shirt and black lounge shorts'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); }); });
  test('背中主役：膝立ちは立位へ逃げない肯定構造', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_kneeling_upright_look_back'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.posture, s.pose.supportPose], ['kneeling', 'kneeling_upright']); ok(c.indexOf('upright kneeling posture') >= 0 && c.indexOf('torso lifted above both knees') >= 0); });
  test('背中主役：ベッド前傾は前傾支持を維持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_bed_forward_lean_back_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.supportPose, s.pose.torso.lean], ['forward_lean_support', 'forward']); ok(c.indexOf('leaning forward with the upper body lifted and supported by both hands') >= 0); });
  test('背中主役：家具支持はもたれ姿ではなく両手支持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_furniture_hands_support_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.pose.support.type, s.pose.supportPose], ['leaning_surface', 'leaning_forward_on_hands']); ok(c.indexOf('both hands supporting the lifted upper body') >= 0); });
  test('背中主役：背中の開いた服は衣装を保持', function () { var p = D.presets.filter(function (x) { return x.id === 'relationship_open_back_outfit_turn'; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([s.output.backDesign, s.output.preserveClothing], ['open_back_outfit', true]); ok(c.indexOf('open-back outfit') >= 0 && c.indexOf('fabric following the back line') >= 0 && c.indexOf('clothing intact') >= 0); });
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
  test('拘束出力：初期値では拘束語・成人指定を追加しない', function () { var c = G.compact(modelState()); ['adult character', 'restraint visible', 'clean uninjured skin'].forEach(function (term) { ok(c.indexOf(term) < 0, term); }); });
  test('拘束出力：縄を両手首だけへ限定', function () { var c = G.compact(restraintState()); ok(c.indexOf('both wrists loosely bound together in front') >= 0 && c.indexOf('rope wrapped around the wrists only') >= 0); });
  test('拘束出力：鎖・手錠・ストラップを切り替え', function () {
    [['chain', 'chain secured around the wrists only'], ['cuffs', 'cuffs secured around the wrists only'], ['straps', 'straps secured around the wrists only']].forEach(function (row) { ok(G.compact(restraintState({ 'restraint.type': row[0] })).indexOf(row[1]) >= 0, row[0]); });
  });
  test('拘束出力：固定先を壁・柱・頭上へ切り替え', function () {
    [['wall', 'secured to a wall fixture'], ['pillar', 'secured to a pillar'], ['overhead_fixture', 'attached to an overhead fixture']].forEach(function (row) { ok(G.compact(restraintState({ 'restraint.anchor': row[0] })).indexOf(row[1]) >= 0, row[0]); });
  });
  test('拘束出力：拘束時だけ成人・非損傷を肯定形で追加', function () { var c = G.compact(restraintState()); ['adult character', 'clean uninjured skin', 'natural complete limbs', 'one clear restraint setup'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); }); });
  test('拘束出力：頭上固定は床と脚の支持を明示', function () { var c = G.compact(restraintState({ 'restraint.type': 'cuffs', 'restraint.placement': 'wrists_overhead', 'restraint.anchor': 'overhead_fixture', 'restraint.tension': 'secured' })); ok(c.indexOf('both feet clearly planted on the floor') >= 0 && c.indexOf('body weight fully supported by the legs') >= 0); });
  test('拘束出力：片手首だけを固定し反対腕を自由にする', function () { var c = G.compact(restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'one_wrist', 'restraint.anchor': 'wall', 'restraint.freeArm': 'right' })); ok(c.indexOf('only one wrist restrained') >= 0 && c.indexOf('the other arm free and visible') >= 0); });
  test('拘束出力：椅子固定は座位・椅子・床の足を明示', function () { var p = D.presets.filter(function (x) { return x.id === 'special_chair_armrests_restraint'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch)); ok(c.indexOf('each wrist secured to a separate chair armrest') >= 0 && c.indexOf('seated upright in a chair') >= 0 && c.indexOf('feet resting on the floor') >= 0); });
  test('拘束出力：装飾鎖は腕と胴体へ置き首を空ける', function () { var p = D.presets.filter(function (x) { return x.id === 'special_decorative_chain_torso_standing'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch)); ok(c.indexOf('around the upper arms and torso') >= 0 && c.indexOf('neck fully clear') >= 0); });
  test('拘束微改修：鎖使用時だけ鎖の輪と衣装外経路を補助', function () {
    var chain = G.compact(restraintState({ 'restraint.type': 'chain' })), rope = G.compact(restraintState({ 'restraint.type': 'rope' }));
    ['chain links clearly visible', 'chain routed outside the body and clothing as a separate object'].forEach(function (term) { ok(chain.indexOf(term) >= 0, term); ok(rope.indexOf(term) < 0, 'rope / ' + term); });
  });
  test('拘束微改修：鎖＋壁固定で見える接続先を明示', function () {
    var c = G.compact(restraintState({ 'restraint.type': 'chain', 'restraint.anchor': 'wall' }));
    ok(c.indexOf('chain clearly attached to a visible restraint point') >= 0 && c.indexOf('attached to a visible wall ring') >= 0);
  });
  test('拘束微改修：固定先なしの鎖へ壁や柱を捏造しない', function () {
    var c = G.compact(restraintState({ 'restraint.type': 'chain', 'restraint.anchor': 'none' }));
    ok(c.indexOf('visible wall ring') < 0 && c.indexOf('visible pillar fixture') < 0 && c.indexOf('visible overhead restraint point') < 0);
  });
  test('拘束微改修：手首拘束で手と指の完全性を補助', function () {
    var c = G.compact(restraintState());
    ['both bound hands anatomically complete and fully visible', 'all fingers clearly separated'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); });
  });
  test('拘束微改修：後ろ手で手首・肘・肩の位置を明示', function () {
    var c = G.compact(restraintState({ 'restraint.placement': 'wrists_behind' }));
    ['bound hands clearly visible behind the waist', 'elbows slightly bent', 'wrists close together', 'natural shoulder and arm alignment'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); });
  });
  test('拘束微改修：片手首拘束で自由な腕と両手を表示', function () {
    var c = G.compact(restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'one_wrist', 'restraint.anchor': 'wall', 'restraint.freeArm': 'right' }));
    ok(c.indexOf('the other arm free and visible') >= 0 && c.indexOf('the restrained hand and free hand both visible') >= 0);
  });
  test('拘束微改修：通常ポーズへ鎖専用・手指補助を混入しない', function () {
    var c = G.compact(modelState());
    ['chain links clearly visible', 'chain routed outside the body', 'hands fully visible and anatomically complete'].forEach(function (term) { ok(c.indexOf(term) < 0, term); });
  });
  test('拘束微改修：装飾鎖は胸前の見える経路へ限定', function () {
    var p = D.presets.filter(function (x) { return x.id === 'special_decorative_chain_torso_standing'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch));
    ok(c.indexOf('one or two chain passes across the front at chest height') >= 0 && c.indexOf('one or two chain routes clearly visible across the front of the torso and outside the clothing') >= 0);
  });
  test('拘束微改修：椅子固定で左右の見える肘掛けと両手を明示', function () {
    var p = D.presets.filter(function (x) { return x.id === 'special_chair_armrests_restraint'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch));
    ok(c.indexOf('each wrist secured to a separate chair armrest') >= 0 && c.indexOf('both hands and both chair armrests clearly visible') >= 0);
  });
  test('拘束微改修：頭上固定で床・脚支持・非吊り下げを補強', function () {
    var p = D.presets.filter(function (x) { return x.id === 'special_wrists_overhead_standing'; })[0], c = G.compact(S.applyPatch(S.initial(), p.patch));
    ok(c.indexOf('both feet clearly planted on the floor') >= 0 && c.indexOf('body weight fully supported by the legs') >= 0);
  });
  test('拘束Advisor：四つん這い＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'pose.posture': 'kneeling', 'pose.supportPose': 'hands_and_knees' })).indexOf('restraint_both_hands_support_conflict') >= 0); });
  test('拘束Advisor：両手ハート＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'pose.arms.mode': 'combined', 'pose.arms.combined': 'heart_hands_near_face' })).indexOf('restraint_two_hand_gesture_conflict') >= 0); });
  test('拘束Advisor：Viewerへ一口差し出す＋両手首拘束でhard', function () { ok(issueIds(restraintState({ 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'feeding' })).indexOf('restraint_viewer_hand_conflict') >= 0); });
  test('拘束Advisor：椅子肘掛け固定＋非座位でhard', function () { ok(issueIds(restraintState({ 'restraint.placement': 'chair_armrests', 'restraint.anchor': 'chair', 'pose.posture': 'standing' })).indexOf('restraint_chair_posture_conflict') >= 0); });
  test('拘束Advisor：足首固定＋立位でhard', function () { ok(issueIds(restraintState({ 'restraint.placement': 'ankles', 'restraint.tension': 'secured', 'pose.posture': 'standing' })).indexOf('restraint_ankles_posture_conflict') >= 0); });
  test('拘束Advisor：片手首拘束＋片手動作は許可', function () { var s = restraintState({ 'restraint.placement': 'one_wrist', 'restraint.freeArm': 'right', 'pose.arms.primary.action': 'hand_near_chest' }); ok(issueIds(s).indexOf('restraint_one_wrist_too_many_actions') < 0); });
  test('拘束Advisor：片手首拘束＋両手動作でhard', function () { var s = restraintState({ 'restraint.placement': 'one_wrist', 'restraint.freeArm': 'right', 'pose.arms.mode': 'combined', 'pose.arms.combined': 'hands_clasped' }); ok(issueIds(s).indexOf('restraint_one_wrist_too_many_actions') >= 0); });
  test('拘束Advisor：未成年を示す自由入力でhard', function () { ok(issueIds(restraintState({ 'output.customText': 'underage character' })).indexOf('restraint_minor_conflict') >= 0); });
  test('拘束Advisor微改修：鎖＋固定先なしで注意と代替案', function () {
    var list = A.check(restraintState({ 'restraint.type': 'chain', 'restraint.anchor': 'none' })), item = list.filter(function (x) { return x.id === 'restraint_chain_anchor_missing'; })[0];
    ok(item && item.resolutions.length >= 2);
  });
  test('拘束Advisor微改修：鎖＋後ろ手で高難度注意', function () { ok(issueIds(restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'wrists_behind' })).indexOf('restraint_chain_behind_difficulty') >= 0); });
  test('拘束Advisor微改修：後ろ手＋長袖で衣装埋没注意', function () { ok(issueIds(restraintState({ 'restraint.placement': 'wrists_behind', 'output.customText': 'long-sleeved shirt' })).indexOf('restraint_behind_long_sleeves') >= 0); });
  test('拘束Advisor微改修：腕と胴体への鎖で高難度注意', function () { ok(issueIds(restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'torso_and_arms' })).indexOf('restraint_chain_torso_difficulty') >= 0); });
  test('拘束Advisor微改修：片手首＋鎖＋背面振り返りで高難度注意', function () {
    var s = restraintState({ 'restraint.type': 'chain', 'restraint.placement': 'one_wrist', 'restraint.anchor': 'wall', 'pose.rearViewEmphasis': 'rear_three_quarter', 'pose.pelvis.orientation': 'away_camera', 'pose.head.yaw': 'over_shoulder' });
    ok(issueIds(s).indexOf('restraint_chain_one_wrist_rear_difficulty') >= 0);
  });
  specialPresetIds.forEach(function (id) {
    test('特殊プリセット：' + id + 'は成人・非損傷を肯定形で保持', function () { var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(), p.patch), c = G.compact(s); eq([p.meta.collection, p.meta.poseFamily], ['special', 'restraint']); eq(A.summary(s).hard, 0); ok(c.indexOf('adult character') >= 0 && c.indexOf('clean uninjured skin') >= 0 && c.indexOf('natural complete limbs') >= 0); });
  });

  test('Positive：自動生成部分にno／not／without／avoid／excludeを含まない', function () {
    D.presets.forEach(function (preset) {
      var s = S.applyPatch(S.initial(), preset.patch);
      s = S.applyPatch(s, { 'output.customText': '' });
      [G.compact(s), G.detailed(s)].forEach(function (text) { ok(!/(^|[\s,.])(no|not|without|avoid|exclude)\b/i.test(text), preset.id + ' / ' + text); });
    });
  });
  test('Positive：自由入力は否定語を含めて原文のまま末尾へ残す', function () {
    var custom = 'no text, not smiling, without hat, avoid blur, exclude logo';
    var s = patch(modelState(), { 'output.customText': custom });
    ok(G.compact(s).endsWith(custom)); ok(G.detailed(s).endsWith(custom));
  });
  test('Negative：初期値とOFFでは空', function () { eq(G.negative(modelState()), ''); eq(G.negative(patch(modelState(), { 'output.includeNegativePrompt': false })), ''); });
  test('Negative：ONで拘束の安全・手指語を短く分離', function () {
    var n = G.negative(restraintState({ 'output.includeNegativePrompt': true }));
    ['blood', 'wounds', 'extra hands', 'missing fingers', 'fused fingers', 'duplicated restraints', 'restraints around neck'].forEach(function (term) { ok(n.indexOf(term) >= 0, term); });
  });
  test('Negative：鎖の経路・固定破綻語を分離', function () {
    var n = G.negative(restraintState({ 'restraint.type': 'chain', 'restraint.anchor': 'wall', 'output.includeNegativePrompt': true }));
    ['floating chain', 'chain fused with body', 'chain passing through body', 'chain passing through clothing'].forEach(function (term) { ok(n.indexOf(term) >= 0, term); });
  });
  test('Negative：四点支持・背面・Viewer手の補助語を分離', function () {
    var n = G.negative(patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'pose.rearViewEmphasis': 'full_back_line', 'pose.head.yaw': 'over_shoulder', 'interaction.target': 'viewer', 'interaction.viewerHandInteraction': 'hand_holding', 'interaction.viewerHandVisible': true, 'output.includeNegativePrompt': true }));
    ['sitting pose', 'lying flat', 'front-facing torso', 'full-body twist', 'multiple viewer hands'].forEach(function (term) { ok(n.indexOf(term) >= 0, term); });
  });
  test('Negative：文字・機材・服保持オプションを必要時だけ分離', function () {
    var n = G.negative(patch(modelState(), { 'output.includeNegativePrompt': true, 'output.suppressTextSymbols': true, 'output.suppressPhotographyEquipment': true, 'output.preserveClothing': true }));
    ['Japanese text', 'comic symbols', 'photography equipment', 'tripod', 'nudity', 'underwear-only outfit'].forEach(function (term) { ok(n.indexOf(term) >= 0, term); });
  });
  test('Negative：Positive単独でも背面と四点支持の意味が残る', function () {
    var s = patch(modelState(), { 'pose.supportPose': 'hands_and_knees', 'pose.rearViewEmphasis': 'full_back_line', 'pose.head.yaw': 'over_shoulder' }), c = G.compact(s);
    ['on all fours', 'both palms and knees on', 'weight supported by all four points', 'only the head turned toward the viewer', 'torso and hips remain facing away'].forEach(function (term) { ok(c.indexOf(term) >= 0, term); });
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

  var physicalExpected = {
    special_dogeza: ['kneeling', 'kneeling_bow', 'palms_on_floor', 'kneeling bow', 'head lowered to floor'],
    special_arms_up_stretch: ['standing', 'none', 'arms_up', 'arms up'],
    special_sonkyo: ['squatting', 'sonkyo', 'hands_on_knees', 'sonkyo squat', 'heels raised'],
    special_shiko_stance: ['squatting', 'shiko_stance', 'hands_on_knees', 'shiko stance', 'wide stance'],
    special_i_balance: ['standing', 'standing_split', 'holding_raised_ankle', 'standing split', 'both legs fully visible'],
    special_leapfrog_base: ['standing', 'leapfrog_base', 'hands_on_knees', 'bent over', 'back parallel to ground'],
    special_forward_bend: ['standing', 'forward_bend', 'arms_hanging_down', 'standing forward bend', 'arms hanging toward floor'],
    special_bridge_pose: ['bridge', 'bridge_pose', 'bridge_support', 'back bridge', 'palms and feet planted on floor']
  };
  Object.keys(physicalExpected).forEach(function (id) {
    var p = D.presets.filter(function (x) { return x.id === id; })[0];
    test('特殊姿勢：' + id + 'の構造・出力・分類', function () {
      ok(p); var s = S.applyPatch(S.initial(), p.patch), expected = physicalExpected[id];
      eq([s.pose.posture, s.pose.supportPose, s.pose.arms.combined], expected.slice(0, 3));
      eq(A.summary(s).hard, 0); eq(s.restraint.type, 'none');
      var c = G.compact(s), parts = c.split(', ');
      expected.slice(3).forEach(function (term) { ok(c.indexOf(term) >= 0, term); });
      eq(new Set(parts).size, parts.length); ok(G.detailed(s)); ok(G.structureJa(s));
      ok(D.filterPresets(D.presets, 'full', { collection: 'special', poseFamily: 'special_pose' }).some(function (x) { return x.id === id; }));
    });
    test('特殊姿勢：' + id + 'を保存・再編集', function () {
      var m = memoryStore(), s = S.applyPatch(S.initial(), p.patch);
      Store.savePreset(id, s, m); var loaded = Store.listPresets(m)[0].state;
      eq(loaded.pose, s.pose); eq(loaded.output.includeNegativePrompt, false);
      var changed = S.applyPatch(loaded, { 'pose.expression': 'soft_smile' });
      eq(changed.pose.supportPose, s.pose.supportPose); ok(G.compact(changed).indexOf('soft gentle smile') >= 0);
    });
  });
  test('特殊姿勢：新規8件と既存拘束8件を別系統で探せる', function () {
    eq(ids(D.filterPresets(D.presets, 'all', { collection: 'special', poseFamily: 'special_pose' })), Object.keys(physicalExpected));
    eq(ids(D.filterPresets(D.presets, 'all', { collection: 'special', poseFamily: 'restraint' })), specialPresetIds);
    ok(/data-pose-family-filter="special_pose" aria-pressed="true"/.test(D.renderPresetPoseFamilyFilters('special_pose', D.presets)));
  });
  test('短縮：既存基本15件が改修前より短い', function () {
    var lengths = [494,643,482,367,485,424,385,493,615,464,474,477,484,446,716];
    D.presets.slice(0,15).forEach(function (p, i) { ok(G.compact(S.applyPatch(S.initial(),p.patch)).length < lengths[i], p.id); });
  });
  test('短縮：正面顔と直視を統合し、外した視線は統合しない', function () {
    var s = patch(modelState(), { 'pose.gaze.target': 'viewer', 'pose.gaze.direction': 'direct' });
    var c = G.compact(s); eq((c.match(/looking at viewer/g) || []).length, 1); ok(c.indexOf('head turned toward') < 0 && c.indexOf('with a direct gaze') < 0);
    ok(G.compact(patch(s, { 'pose.gaze.direction': 'sidelong' })).indexOf('with a sidelong gaze') >= 0);
    ok(G.compact(patch(s, { 'pose.head.yaw': 'side' })).indexOf('head in side profile') >= 0);
    ok(G.compact(patch(s, { 'pose.gaze.eyes': 'closed' })).indexOf('looking at viewer') < 0);
  });
  test('短縮：contrappostoは意味と可視範囲が揃う時のみ', function () {
    ok(G.compact(modelState()).indexOf('contrapposto') >= 0);
    ['sitting', 'walking'].forEach(function (posture) { ok(G.compact(patch(modelState(), { 'pose.posture': posture })).indexOf('contrapposto') < 0); });
    ok(G.compact(patch(modelState(), { 'pose.torso.relationToPelvis': 'aligned' })).indexOf('contrapposto') < 0);
    ok(G.compact(patch(modelState(), { 'camera.shotSize': 'bust_shot' })).indexOf('contrapposto') < 0);
  });
  test('短縮：3層と自由入力を分け、自由入力の句読点を保持', function () {
    var custom = '  from above,,\nno text...  ', s = patch(modelState(), { 'output.customText': custom });
    eq(Object.keys(G.compactLayers(s)), ['semantic','modifiers','stability']);
    ok(G.compact(s).endsWith(custom)); ok(JSON.stringify(G.compactLayers(s)).indexOf(custom) < 0);
  });
  test('短縮：拘束ブロックの部位・固定先・非損傷性を保持', function () {
    specialPresetIds.forEach(function (id) {
      var p = D.presets.filter(function (x) { return x.id === id; })[0], s = S.applyPatch(S.initial(),p.patch), c = G.compact(s);
      G.blocks(s).restraint.compact.forEach(function (clause) { ok(c.indexOf(clause) >= 0, id + ' / ' + clause); });
    });
  });
  test('短縮：通常立位には特殊姿勢の解剖・支持補助を加えない', function () {
    var c = G.compact(modelState()); ['natural limb anatomy', 'both knees visible', 'both legs fully visible', 'on all fours'].forEach(function (term) { ok(c.indexOf(term) < 0); });
  });
  test('特殊姿勢：狭い画角の補正は保存値を変えず説明する', function () {
    var p = D.presets.filter(function (x) { return x.id === 'special_i_balance'; })[0], s = patch(S.applyPatch(S.initial(),p.patch), { 'camera.shotSize': 'face_close_up' });
    var before = JSON.stringify(s); ok(G.compact(s).indexOf('both legs fully visible') >= 0); ok(G.compact(s).indexOf('face close-up') < 0);
    ok(G.detailed(s).indexOf('Show the full body') >= 0); ok(G.structureJa(s).indexOf('保存した画角は保持') >= 0); eq(JSON.stringify(s), before);
    ok(issueIds(s).indexOf('special_pose_full_body') >= 0);
  });
  test('特殊姿勢：支持点を使う腕と基本姿勢の競合を通知', function () {
    var p = D.presets.filter(function (x) { return x.id === 'special_bridge_pose'; })[0], s = S.applyPatch(S.initial(),p.patch);
    ok(issueIds(patch(s, { 'pose.posture': 'standing' })).indexOf('special_pose_posture_mismatch') >= 0);
    ok(issueIds(patch(s, { 'pose.arms.combined': 'arms_up' })).indexOf('special_pose_arms_mismatch') >= 0);
    ok(issueIds(patch(s, { 'restraint.type': 'cuffs', 'restraint.placement': 'one_wrist' })).indexOf('special_pose_wrist_conflict') >= 0);
    ok(issueIds(patch(s, { 'restraint.type': 'cuffs', 'restraint.placement': 'wrists_front' })).indexOf('restraint_both_hands_support_conflict') >= 0);
  });
  test('特殊姿勢：以前の保存に新値を押し込まない', function () {
    var s = S.normalize({ pose: { posture: 'reclining' } }); eq(s.pose.supportPose, 'none'); eq(s.pose.arms.combined, null);
  });


  // ---- 二人用ポーズ・出力先別出力（2026-10-27） ----
  var P = PCW.pair, MO = PCW.modelOutput;
  var pairIds = ['pair_over_supine', 'pair_close_from_behind', 'pair_straddle_lying', 'pair_lap_facing', 'pair_lap_facing_away', 'pair_hug_from_behind', 'pair_leg_lift_support'];
  var genderCombos = [];
  ['unspecified', 'male', 'female'].forEach(function (a) { ['unspecified', 'male', 'female'].forEach(function (b) { genderCombos.push([a, b]); }); });
  var prefVariants = [
    { emphasis: false }, { emphasis: true, naiEmphasisStyle: 'braces' }, { emphasis: true, naiEmphasisStyle: 'numeric', naiNaturalLanguage: true }
  ];
  function pairState(id, extra) {
    var st = P.selectPose(P.initial(), id).state;
    Object.keys(extra || {}).forEach(function (k) { st = P.set(st, k, extra[k]); });
    return st;
  }
  function stripEmphasis(text) {
    return String(text).replace(/\((.*?):1\.2\)/g, '$1').replace(/\{\{(.*?)\}\}/g, '$1').replace(/1\.2::(.*?) ::/g, '$1');
  }
  function tagsOf(text) { return stripEmphasis(text).split(/,\s*/).map(function (x) { return x.trim(); }); }
  function cleanList(text, label) {
    ok(text && text.trim(), label + '：空の出力');
    ok(!/undefined|null|NaN/.test(text), label + '：undefined/null');
    var tags = tagsOf(text);
    ok(tags.every(Boolean), label + '：空のタグ ' + text);
    ok(unique(tags), label + '：重複タグ ' + text);
  }
  function eachPairCombo(fn) {
    D.pairPoses.forEach(function (pose) {
      pose.camera.angles.forEach(function (angle) {
        pose.camera.shots.forEach(function (shot) {
          genderCombos.forEach(function (g) {
            fn(pairState(pose.id, { 'camera.angle': angle, 'camera.shot': shot, 'people.a.gender': g[0], 'people.b.gender': g[1] }), pose);
          });
        });
      });
      (pose.surface.allowed.length ? pose.surface.allowed : [null]).forEach(function (surface) {
        pose.gazes.allowed.forEach(function (gaze) {
          [false, true].forEach(function (clothed) {
            fn(pairState(pose.id, { surface: surface, gaze: gaze, 'options.keepClothed': clothed, 'people.a.gender': 'male', 'people.b.gender': 'female' }), pose);
          });
        });
      });
    });
  }

  test('二人用：要求された7種類がそろっている', function () { eq(ids(D.pairPoses), pairIds); });
  test('二人用：IDは一意で、一人用プリセットIDと衝突しない', function () { ok(unique(ids(D.pairPoses))); ids(D.pairPoses).forEach(function (id) { ok(ids(D.presets).indexOf(id) < 0, id); }); });
  test('二人用：意味データの必須項目（人数・A/B配置・接触点・カメラ・モデル別表現・検索語）', function () {
    D.pairPoses.forEach(function (p) {
      ok(p.id && p.labelJa && p.shortJa, p.id + ' 名前');
      eq(p.people, 2, p.id + ' 人数');
      ok(D.presetPoseFamilyLabels[p.poseFamily], p.id + ' カテゴリ');
      ok(p.roles.a && p.roles.b && p.placement.a && p.placement.b, p.id + ' A/B');
      ok(D.pairRelationLabels.vertical[p.relation.vertical] && D.pairRelationLabels.depth[p.relation.depth] && D.pairRelationLabels.facing[p.relation.facing], p.id + ' 位置関係');
      ok(p.contacts.length >= 2 && p.contacts.every(function (c) { return c.ja && c.tsubaki && ['a', 'b', 'both'].indexOf(c.owner) >= 0; }), p.id + ' 接触点');
      ok(p.camera.angles.indexOf(p.camera.defaultAngle) >= 0 && p.camera.shots.indexOf(p.camera.defaultShot) >= 0, p.id + ' 既定カメラ');
      p.camera.recommended.forEach(function (r) { ok(p.camera.angles.indexOf(r) >= 0, p.id + ' 推奨 ' + r); });
      Object.keys(p.camera.blocked).forEach(function (b) { ok(p.camera.angles.indexOf(b) < 0, p.id + ' blocked ' + b); });
      ok(p.surface.mode === 'none' ? p.surface.defaultId === null : p.surface.allowed.indexOf(p.surface.defaultId) >= 0, p.id + ' 場所');
      ok(p.gazes.allowed.indexOf(p.gazes.defaultId) >= 0, p.id + ' 視線');
      ok(p.models.tsubaki.overview && p.models.sdxl.core.length && p.models.nai.core.length && p.models.nai.nl, p.id + ' モデル別表現');
      ok(p.keywords.length >= 5, p.id + ' 検索語');
      p.related.forEach(function (r) { ok(ids(D.presets).indexOf(r) >= 0, p.id + ' related ' + r); });
    });
  });
  test('二人用：意味データに露骨な語を含まない', function () {
    var banned = /\b(sex|sexual|nude|naked|nsfw|penis|vagina|genital|nipple|crotch|groin|thrust|penetrat|intercourse|missionary|cowgirl|doggy)\w*/i;
    D.pairPoses.forEach(function (p) { ok(!banned.test(JSON.stringify(p.models)), p.id); ok(!/対面座位|騎乗位|後背位|正常位|性行為/.test(JSON.stringify(p)), p.id); });
  });
  test('二人用：主導側と相手側を区別する（NAIのsource/targetがA/Bで逆）', function () {
    D.pairPoses.forEach(function (p) {
      p.models.nai.actions.forEach(function (act) { ok(['a', 'b'].indexOf(act.source) >= 0, p.id); });
      var out = P.render(pairState(p.id), 'nai', {});
      p.models.nai.actions.forEach(function (act) {
        var src = act.source === 'a' ? out.a : out.b, tgt = act.source === 'a' ? out.b : out.a;
        ok(src.indexOf('source#' + act.tag) >= 0 && tgt.indexOf('target#' + act.tag) >= 0, p.id + ' ' + act.tag);
      });
    });
  });
  test('二人用：初期状態と破損データの正規化', function () {
    var s = P.initial(); eq([s.poseId, s.camera.angle, s.people.a.gender, s.options.keepClothed], [null, null, 'unspecified', false]);
    var n = P.normalize({ poseId: 'nope', camera: { angle: 'x' }, people: { a: { gender: 'robot' } }, notes: { a: 5 } });
    eq([n.poseId, n.camera.angle, n.people.a.gender, n.notes.a], [null, null, 'unspecified', '']);
    eq(P.normalize(null).schemaVersion, 'pair-1.0'); eq(P.normalize('broken').poseId, null);
  });
  test('二人用：矛盾するカメラ・撮影範囲は保存されず既定値へ戻る', function () {
    var s = P.normalize({ poseId: 'pair_over_supine', camera: { angle: 'overhead', shot: 'full_body' } });
    eq(s.camera.angle, 'three_quarter'); ok(!P.angleState(P.poseById('pair_over_supine'), 'overhead').ok);
    var leg = P.normalize({ poseId: 'pair_leg_lift_support', camera: { angle: 'side', shot: 'close' } });
    eq(leg.camera.shot, 'full_body'); ok(P.shotState(P.poseById('pair_leg_lift_support'), 'close').reason);
    var stand = P.normalize({ poseId: 'pair_hug_from_behind', surface: 'bed', gaze: 'mutual' });
    eq([stand.surface, stand.gaze], [null, 'back_gazes_front']);
  });
  test('二人用：選べない候補には理由がある', function () {
    D.pairPoses.forEach(function (p) {
      D.pairAngles.forEach(function (a) { var st = P.angleState(p, a.id); ok(st.ok || st.reason, p.id + ' ' + a.id); });
      D.pairShots.forEach(function (sh) { var st = P.shotState(p, sh.id); ok(st.ok || st.reason, p.id + ' ' + sh.id); });
    });
  });
  test('二人用：ポーズ切り替えで成立する値は保持し、成立しない値だけ調整', function () {
    var s = pairState('pair_lap_facing', { 'camera.angle': 'low', 'camera.shot': 'upper_body', 'people.a.gender': 'male' });
    var r = P.selectPose(s, 'pair_hug_from_behind');
    eq([r.state.camera.angle, r.state.camera.shot, r.state.people.a.gender], ['low', 'upper_body', 'male']); eq(r.adjusted, []);
    var r2 = P.selectPose(s, 'pair_over_supine');
    eq(r2.state.camera.angle, 'three_quarter'); ok(r2.adjusted.length === 1);
  });
  test('二人用：出力先を切り替えても選択内容は変わらない', function () {
    var s = pairState('pair_straddle_lying', { 'camera.angle': 'side', 'people.b.gender': 'female', 'notes.a': 'black hair' }), before = JSON.stringify(s);
    ['tsubaki', 'sdxl', 'nai', 'generic', 'tsubaki'].forEach(function (t) { P.render(s, t, { emphasis: true }); });
    eq(JSON.stringify(s), before);
  });
  test('二人用：全組み合わせで3系統の出力が空にならず、重複・空タグがない', function () {
    var n = 0;
    eachPairCombo(function (s, pose) {
      prefVariants.forEach(function (pr) {
        var t = P.render(s, 'tsubaki', pr).text, x = P.render(s, 'sdxl', pr).text, nai = P.render(s, 'nai', pr);
        ok(t && !/undefined|null/.test(t) && !/\.\./.test(t), pose.id + ' tsubaki');
        cleanList(x, pose.id + ' sdxl'); cleanList(nai.base, pose.id + ' nai base'); cleanList(nai.a, pose.id + ' nai A'); cleanList(nai.b, pose.id + ' nai B');
        n++;
      });
    });
    ok(n > 500, '組み合わせ数 ' + n);
  });
  test('二人用：PIXAI系（Tsubaki・SDXL）に adult／bust を含む語を出さない', function () {
    eachPairCombo(function (s, pose) { prefVariants.forEach(function (pr) {
      ok(!MO.hasPixaiForbidden(P.render(s, 'tsubaki', pr).text), pose.id + ' tsubaki');
      ok(!MO.hasPixaiForbidden(P.render(s, 'sdxl', pr).text), pose.id + ' sdxl');
    }); });
  });
  test('二人用：非対応の強調構文が他モデルへ混入しない', function () {
    eachPairCombo(function (s, pose) { prefVariants.forEach(function (pr) {
      var t = P.render(s, 'tsubaki', pr).text, x = P.render(s, 'sdxl', pr).text, nai = P.render(s, 'nai', pr), all = [nai.base, nai.a, nai.b].join(' | ');
      ok(!MO.syntaxLeaks('tsubaki', t), pose.id + ' tsubaki');
      ok(!MO.syntaxLeaks('sdxl', x), pose.id + ' sdxl');
      ok(!MO.syntaxLeaks('nai', all), pose.id + ' nai');
      if (!pr.emphasis) { ok(!/:1\.2\)/.test(x), pose.id + ' sdxl off'); ok(!/[{}]|::/.test(all), pose.id + ' nai off'); }
      else { ok(/\(.*:1\.2\)/.test(x), pose.id + ' sdxl on'); ok(pr.naiEmphasisStyle === 'numeric' ? /1\.2::.* ::/.test(nai.base) : /\{\{.*\}\}/.test(nai.base), pose.id + ' nai on'); }
      ok(!/[{}]|::|source#|target#/.test(x), pose.id + ' sdxlにNAI構文なし');
    }); });
  });
  test('二人用：NAIの人数タグは共通欄だけ、人物欄とのタグ重複なし', function () {
    eachPairCombo(function (s, pose) {
      var nai = P.render(s, 'nai', {}), base = tagsOf(nai.base);
      [nai.a, nai.b].forEach(function (c) {
        ok(!/\b(1boy|1girl|2boys|2girls)\b/.test(c), pose.id + ' 人数タグ');
        tagsOf(c).forEach(function (t) { ok(base.indexOf(t) < 0, pose.id + ' 共通と重複 ' + t); });
      });
    });
  });
  test('二人用：人数タグは性別の組み合わせから一つに決まる', function () {
    var cases = { 'male,male': ['2boys'], 'female,female': ['2girls'], 'male,female': ['1boy', '1girl'], 'female,male': ['1boy', '1girl'], 'male,unspecified': [] };
    Object.keys(cases).forEach(function (k) {
      var g = k.split(','), s = pairState('pair_lap_facing', { 'people.a.gender': g[0], 'people.b.gender': g[1] });
      eq(P.countTags(s), cases[k], k);
      if (!cases[k].length) ok(P.render(s, 'sdxl', {}).text.indexOf('two people') === 0);
    });
    var nai = P.render(pairState('pair_lap_facing', { 'people.a.gender': 'male', 'people.b.gender': 'female' }), 'nai', {});
    ok(/^boy,/.test(nai.a) && /^girl,/.test(nai.b));
  });
  test('二人用：Tsubakiは上下・前後・接触点を文章で明示し、ネガティブを持たない', function () {
    D.pairPoses.forEach(function (p) {
      var out = P.render(pairState(p.id), 'tsubaki', {}), t = out.text;
      ok(t.indexOf('Person A') >= 0 && t.indexOf('Person B') >= 0 && t.indexOf('Contact points:') >= 0, p.id);
      if (p.relation.vertical === 'a_above') ok(t.indexOf('Person A is on top and Person B is underneath.') >= 0, p.id + ' 上下');
      if (p.relation.depth !== 'none') ok(/Person [AB] (is )?in front/.test(t), p.id + ' 前後');
      ok(!('negative' in out), p.id);
    });
  });
  test('二人用：自由入力は原文のまま、NAIでは人物別の欄へ入る', function () {
    var s = pairState('pair_hug_from_behind', { 'notes.common': 'bedroom, (soft light)', 'notes.a': 'black hair', 'notes.b': 'silver hair' });
    var nai = P.render(s, 'nai', {});
    ok(nai.base.endsWith('bedroom, (soft light)') && nai.a.endsWith('black hair') && nai.b.endsWith('silver hair'));
    ok(P.render(s, 'tsubaki', {}).text.indexOf('Person A: black hair') >= 0);
    eq(nai.text, [nai.base, nai.a, nai.b].join(' | '));
  });
  test('二人用：A⇄B入れ替えは性別と人物別入力を交換する', function () {
    var s = P.swapPeople(pairState('pair_lap_facing', { 'people.a.gender': 'male', 'notes.b': 'cardigan' }));
    eq([s.people.a.gender, s.people.b.gender, s.notes.a, s.notes.b], ['unspecified', 'male', 'cardigan', '']);
  });
  test('二人用：日本語構造にA/B配置と接触点を含む', function () {
    D.pairPoses.forEach(function (p) { var j = P.structureJa(pairState(p.id)); ok(j.indexOf('【人物A') >= 0 && j.indexOf('【人物B') >= 0 && j.indexOf('【接触点】') >= 0, p.id); });
  });
  test('二人用：注意表示（NAIの人数タグ、自由入力のadult/bust）', function () {
    var s = pairState('pair_lap_facing');
    ok(P.issues(s, 'nai', {}).some(function (i) { return i.id === 'nai_count_tags'; }));
    ok(P.issues(P.set(s, 'notes.a', 'adult man'), 'sdxl', {}).some(function (i) { return i.id === 'pixai_forbidden_note'; }));
    ok(!P.issues(P.set(s, 'notes.a', 'adult man'), 'nai', {}).some(function (i) { return i.id === 'pixai_forbidden_note'; }));
  });
  test('検索：ひらがな・カタカナ・漢字の表記差を吸収する', function () {
    function found(q) { return ids(P.filterPoses(q, 'all')); }
    ok(found('ひざ').indexOf('pair_lap_facing') >= 0); ok(found('バックハグ').indexOf('pair_hug_from_behind') >= 0);
    ok(found('ばっくはぐ').indexOf('pair_hug_from_behind') >= 0); ok(found('かたあし').indexOf('pair_leg_lift_support') >= 0);
    eq(found('ひざ うしろ').indexOf('pair_over_supine'), -1); eq(found('存在しない語').length, 0); eq(found('').length, 7);
    eq(ids(P.filterPoses('', 'lying_bed')), ['pair_over_supine', 'pair_straddle_lying']);
    ok(MO.matchesQuery('べっど', ['ベッドで仰向け'])); ok(MO.matchesQuery('ＢＥＤ', ['bed']));
  });
  test('出力先：設定の正規化と既定値', function () {
    eq(MO.normalizePrefs(null), { outputTarget: 'generic', emphasis: false, naiEmphasisStyle: 'braces', naiNaturalLanguage: false });
    eq(MO.normalizePrefs({ outputTarget: 'xx', emphasis: 'yes' }).outputTarget, 'generic');
    eq(MO.pairTarget({ outputTarget: 'generic' }), 'tsubaki'); eq(MO.pairTarget({ outputTarget: 'nai' }), 'nai');
  });
  test('一人用：汎用出力は従来のcompact・Negativeと完全一致', function () {
    D.presets.forEach(function (p) {
      var s = S.applyPatch(S.initial(), p.patch), r = MO.single(s, 'generic', { emphasis: true });
      eq(r.text, G.compact(s), p.id); eq(r.negative, G.negative(s), p.id);
    });
  });
  test('一人用：全プリセットでPIXAI系にadult／bustを出さない（自由入力なし）', function () {
    D.presets.forEach(function (p) {
      var s = S.applyPatch(S.initial(), p.patch);
      [{ emphasis: false }, { emphasis: true }].forEach(function (pr) {
        ok(!MO.hasPixaiForbidden(MO.single(s, 'tsubaki', pr).text), p.id + ' tsubaki');
        ok(!MO.hasPixaiForbidden(MO.single(s, 'sdxl', pr).text), p.id + ' sdxl');
      });
    });
  });
  test('一人用：拘束時の年齢指定はPIXAI系でgrown-upへ置き換え、NovelAI・汎用は従来どおり', function () {
    var s = S.applyPatch(S.initial(), D.presets.filter(function (x) { return x.id === 'special_rope_wrists_front_standing'; })[0].patch);
    ok(MO.single(s, 'sdxl', {}).text.indexOf('grown-up character') >= 0);
    ok(MO.single(s, 'tsubaki', {}).text.indexOf('The character is a grown-up.') >= 0);
    ok(MO.single(s, 'nai', {}).text.indexOf('adult character') >= 0);
    ok(G.compact(s).indexOf('adult character') >= 0);
  });
  test('一人用：Tsubakiは自然文・ネガティブなし・強調なし', function () {
    D.presets.forEach(function (p) {
      var s = S.applyPatch(S.applyPatch(S.initial(), p.patch), { 'output.includeNegativePrompt': true }), r = MO.single(s, 'tsubaki', { emphasis: true });
      eq(r.negative, '', p.id); ok(!MO.syntaxLeaks('tsubaki', r.text), p.id); ok(/^A solo character/.test(r.text), p.id);
    });
  });
  test('一人用：SDXL・NovelAIは人数→主ポーズの順で、強調は各モデルの構文だけ', function () {
    D.presets.forEach(function (p) {
      var s = S.applyPatch(S.initial(), p.patch);
      var x = MO.single(s, 'sdxl', { emphasis: true }).text, n1 = MO.single(s, 'nai', { emphasis: true }).text, n2 = MO.single(s, 'nai', { emphasis: true, naiEmphasisStyle: 'numeric' }).text, off = MO.single(s, 'sdxl', {}).text;
      ok(/^solo, \(/.test(x), p.id + ' ' + x.slice(0, 40)); ok(/^solo, \{\{/.test(n1), p.id); ok(/^solo, 1\.2::/.test(n2), p.id);
      ok(!MO.syntaxLeaks('sdxl', x) && !MO.syntaxLeaks('nai', n1) && !MO.syntaxLeaks('nai', n2), p.id);
      ok(!/[{}()]|::/.test(off), p.id + ' off'); cleanList(off, p.id + ' sdxl');
    });
  });
  test('一人用：出力先別の生成は保存状態を変えない', function () {
    var s = S.applyPatch(S.initial(), D.presets[0].patch), before = JSON.stringify(s);
    ['generic', 'tsubaki', 'sdxl', 'nai'].forEach(function (t) { MO.single(s, t, { emphasis: true }); });
    eq(JSON.stringify(s), before);
  });
  test('一人用：opts省略時のgenerator出力は従来と同じ', function () {
    D.presets.forEach(function (p) {
      var s = S.applyPatch(S.initial(), p.patch);
      eq(G.compact(s, undefined), G.compact(s), p.id); eq(G.detailed(s, undefined), G.detailed(s), p.id);
      eq(Object.keys(G.compactLayers(s)), ['semantic', 'modifiers', 'stability']);
    });
  });
  test('保存：二人用の下書き・名前付き保存・出力先設定', function () {
    var st = memoryStore();
    var s = pairState('pair_lap_facing_away', { 'people.a.gender': 'female' });
    ok(Store.savePairDraft(s, st)); eq(Store.loadPairDraft(st).poseId, 'pair_lap_facing_away');
    Store.savePreset('二人', s, st, 'pair'); Store.savePreset('一人', S.initial(), st);
    var list = Store.listPresets(st); eq(list.map(function (x) { return x.kind || 'single'; }), ['single', 'pair']);
    eq(list[1].state.people.a.gender, 'female');
    ok(Store.saveOutputPrefs({ outputTarget: 'nai', emphasis: true }, st)); eq(Store.loadOutputPrefs(st).outputTarget, 'nai');
    st.data[Store.keys.preferences] = '{broken'; eq(Store.loadOutputPrefs(st).outputTarget, 'generic');
    st.data[Store.keys.pairDraft] = '{broken'; eq(Store.loadPairDraft(st), null);
  });
  test('保存：kindのない旧ユーザープリセットは一人用として読む', function () {
    var st = memoryStore(); st.data[Store.keys.presets] = JSON.stringify([{ id: 'old', name: '旧', state: { pose: { posture: 'standing' } } }]);
    var list = Store.listPresets(st); eq(list[0].kind, undefined); eq(list[0].state.pose.posture, 'standing');
  });
  test('保存：出力先設定は一人用の下書きへ混入しない', function () {
    var st = memoryStore(); Store.saveOutputPrefs({ outputTarget: 'sdxl' }, st); Store.saveDraft(S.initial(), st);
    ok(JSON.parse(st.data[Store.keys.draft]).output.outputTarget === undefined);
  });


  // ---- 人物A・Bの外見・服装プロンプトの自動統合（2026-10-28） ----
  var PA = '1boy, solo, short black hair, {{red eyes}}, black suit,\nwhite shirt';
  var PB = '1girl, long silver hair, blue eyes, (white dress:1.2), frills';
  var personCases = { onlyA: { a: PA, b: '' }, onlyB: { a: '', b: PB }, both: { a: PA, b: PB }, none: { a: '', b: '' } };
  function withPeople(id, c, extra) {
    var st = pairState(id, extra);
    st = P.set(st, 'people.a.prompt', c.a); st = P.set(st, 'people.b.prompt', c.b);
    return st;
  }
  function allOutputs(st, pr) {
    var t = P.render(st, 'tsubaki', pr), x = P.render(st, 'sdxl', pr), n = P.render(st, 'nai', pr);
    return { t: t, x: x, n: n };
  }
  test('人物入力：初期状態は空欄で、旧保存データ（prompt欄なし）も空欄として読む', function () {
    eq([P.initial().people.a.prompt, P.initial().people.b.prompt], ['', '']);
    var old = P.normalize({ poseId: 'pair_lap_facing', people: { a: { gender: 'male' }, b: { gender: 'female' } }, notes: { a: 'blush' } });
    eq([old.people.a.prompt, old.people.b.prompt, old.people.a.gender, old.notes.a], ['', '', 'male', 'blush']);
    eq(P.normalize({ people: { a: { prompt: 42 } } }).people.a.prompt, '');
  });
  test('人物入力：両方空欄・空白だけの入力では、全ポーズ・全出力先の出力が変わらない', function () {
    D.pairPoses.forEach(function (pose) {
      prefVariants.forEach(function (pr) {
        var base = pairState(pose.id, { 'people.a.gender': 'male', 'notes.common': 'bedroom' });
        var blank = P.set(P.set(base, 'people.a.prompt', '  \n '), 'people.b.prompt', ',  ,');
        var a = allOutputs(base, pr), b = allOutputs(blank, pr);
        eq(b.t.text, a.t.text, pose.id); eq(b.x.text, a.x.text, pose.id); eq([b.n.base, b.n.a, b.n.b, b.n.text], [a.n.base, a.n.a, a.n.b, a.n.text], pose.id);
        eq(P.structureJa(blank), P.structureJa(base), pose.id);
      });
    });
  });
  test('人物入力：Aのみ・Bのみ・両方で、全ポーズ×全出力先×強調設定の出力が整っている', function () {
    D.pairPoses.forEach(function (pose) {
      Object.keys(personCases).forEach(function (key) {
        prefVariants.forEach(function (pr) {
          var st = withPeople(pose.id, personCases[key]), o = allOutputs(st, pr), label = pose.id + '/' + key;
          ok(o.t.text && !/undefined|null|\.\.|, ,/.test(o.t.text), label + ' tsubaki');
          cleanList(o.x.text, label + ' sdxl'); cleanList(o.n.base, label + ' nai base'); cleanList(o.n.a, label + ' nai A'); cleanList(o.n.b, label + ' nai B');
          ok(!MO.syntaxLeaks('tsubaki', o.t.text), label + ' tsubaki leak'); ok(!MO.syntaxLeaks('sdxl', o.x.text), label + ' sdxl leak'); ok(!MO.syntaxLeaks('nai', o.n.text), label + ' nai leak');
          ok(!MO.hasPixaiForbidden(o.t.text) && !MO.hasPixaiForbidden(o.x.text), label + ' adult/bust');
        });
      });
    });
  });
  test('人物入力：Aのみ・Bのみの外見は、その人物の欄・文だけに入る', function () {
    var onlyA = allOutputs(withPeople('pair_hug_from_behind', personCases.onlyA), {});
    ok(onlyA.n.a.indexOf('short black hair') >= 0 && onlyA.n.b.indexOf('short black hair') < 0 && onlyA.n.base.indexOf('short black hair') < 0);
    ok(onlyA.t.text.indexOf('Appearance of Person A (the one hugging from behind): short black hair') >= 0 && onlyA.t.text.indexOf('Appearance of Person B') < 0);
    ok(onlyA.t.text.indexOf('Keep the two appearances separate') < 0);
    var onlyB = allOutputs(withPeople('pair_hug_from_behind', personCases.onlyB), {});
    ok(onlyB.n.b.indexOf('long silver hair') >= 0 && onlyB.n.a.indexOf('long silver hair') < 0);
    ok(onlyB.t.text.indexOf('Appearance of Person B (the one standing in front): long silver hair') >= 0 && onlyB.t.text.indexOf('Appearance of Person A') < 0);
  });
  test('人物入力：両方入力でA・Bの特徴が混ざらない（NAIは欄ごと、Tsubakiは文ごと）', function () {
    D.pairPoses.forEach(function (pose) {
      var o = allOutputs(withPeople(pose.id, personCases.both), {});
      ok(o.n.a.indexOf('black suit') >= 0 && o.n.a.indexOf('silver') < 0, pose.id + ' A');
      ok(o.n.b.indexOf('long silver hair') >= 0 && o.n.b.indexOf('black suit') < 0, pose.id + ' B');
      var sentA = o.t.text.split('Appearance of Person A')[1].split('. ')[0], sentB = o.t.text.split('Appearance of Person B')[1].split('. ')[0];
      ok(sentA.indexOf('black suit') >= 0 && sentA.indexOf('silver') < 0, pose.id + ' tsubaki A');
      ok(sentB.indexOf('silver') >= 0 && sentB.indexOf('black suit') < 0, pose.id + ' tsubaki B');
      ok(o.t.text.indexOf('Keep the two appearances separate') >= 0, pose.id);
      ok(o.t.text.indexOf('Appearance of Person A') < o.t.text.indexOf(pose.models.tsubaki.overview), pose.id + ' 外見はポーズ説明の前');
    });
  });
  test('人物入力：Tsubakiは位置関係の説明を各ポーズの役割と結び付ける', function () {
    D.pairPoses.forEach(function (pose) {
      var t = P.render(withPeople(pose.id, personCases.both), 'tsubaki', {}).text;
      ok(t.indexOf('Appearance of Person A (' + pose.models.tsubaki.roleEn.a + ')') >= 0, pose.id);
      ok(t.indexOf('Appearance of Person B (' + pose.models.tsubaki.roleEn.b + ')') >= 0, pose.id);
      ok(!/adult|bust/i.test(pose.models.tsubaki.roleEn.a + pose.models.tsubaki.roleEn.b), pose.id);
    });
  });
  test('人物入力：人数タグの混在。人物欄から外し、人数は一か所だけ（SDXL先頭・NAI共通）', function () {
    var st = withPeople('pair_lap_facing', personCases.both), o = allOutputs(st, {});
    eq(tagsOf(o.x.text).filter(function (t) { return /^(\d+(boys?|girls?)|solo)$/.test(t); }), ['1boy', '1girl']);
    eq(tagsOf(o.n.base).slice(0, 2), ['1boy', '1girl']);
    [o.n.a, o.n.b].forEach(function (c) { ok(!/\b(1boy|1girl|solo)\b/.test(c), c); });
    ok(/^boy, /.test(o.n.a) && /^girl, /.test(o.n.b), '性別語はboy/girl');
    ok(!/\b(1boy|1girl|solo)\b/.test(o.t.text.split('appear together.')[1]), 'Tsubaki本文に人数タグなし');
    ok(o.t.text.indexOf('Person A is a man, and Person B is a woman.') >= 0, '入力から性別を推定');
    var codes = P.issues(st, 'nai', {}).filter(function (i) { return i.id === 'person_a'; })[0].codes;
    ok(codes.indexOf('count_tags') >= 0 && codes.indexOf('gender_inferred') >= 0);
    ok(!P.issues(st, 'nai', {}).some(function (i) { return i.id === 'nai_count_tags'; }), '推定で人数タグが入るときは不足案内を出さない');
  });
  test('人物入力：一人用と二人用の人数指定を混同しない（solo / 2boys は人物欄から外す）', function () {
    var st = withPeople('pair_hug_from_behind', { a: 'solo, 2boys, black hair', b: 'multiple girls, red hair' });
    var o = allOutputs(st, {});
    ok(!/\b(solo|2boys|multiple girls)\b/.test(o.x.text.replace(/^two people, /, '')), o.x.text);
    ok(/^two people, /.test(o.x.text), '性別不明なら two people');
    [o.n.a, o.n.b, o.n.base].forEach(function (c) { ok(!/\b(solo|2boys|multiple girls)\b/.test(c), c); });
  });
  test('人物入力：性別の設定と入力の語が食い違うときは設定を優先し、警告する', function () {
    var st = P.set(withPeople('pair_lap_facing', { a: '1girl, long hair', b: '' }), 'people.a.gender', 'male');
    var n = P.render(st, 'nai', {});
    ok(/^boy, long hair/.test(n.a), n.a);
    var issue = P.issues(st, 'nai', {}).filter(function (i) { return i.id === 'person_a'; })[0];
    ok(issue.severity === 'warning' && issue.codes.indexOf('gender_mismatch') >= 0);
    var both = withPeople('pair_lap_facing', { a: 'boy, girl, scarf', b: '' });
    ok(P.issues(both, 'sdxl', {}).filter(function (i) { return i.id === 'person_a'; })[0].codes.indexOf('gender_conflict') >= 0);
    eq(P.countTags(both), []);
  });
  test('人物入力：NAIの強調構文を含む入力。NAIはそのまま、SDXLは変換、Tsubakiは記号を外す', function () {
    var st = withPeople('pair_over_supine', { a: '{{red eyes}}, [[smile]], 1.3::silver earrings, ring ::, -1::hat ::', b: '' });
    var o = allOutputs(st, {});
    ok(o.n.a.indexOf('{{red eyes}}, [[smile]], 1.3::silver earrings, ring ::, -1::hat ::') >= 0, o.n.a);
    ok(o.x.text.indexOf('(red eyes:1.1), (smile:0.91), (silver earrings, ring:1.3)') >= 0, o.x.text);
    ok(o.t.text.indexOf('red eyes, smile, silver earrings, ring') >= 0, o.t.text);
    ok(o.x.text.indexOf('hat') < 0 && o.t.text.indexOf('hat') < 0, '負の強調はPIXAI系に出さない');
    ['sdxl', 'tsubaki'].forEach(function (t) { ok(P.issues(st, t, {}).filter(function (i) { return i.id === 'person_a'; })[0].codes.indexOf('emphasis_dropped') >= 0, t); });
    var sd = withPeople('pair_over_supine', { a: '(long hair:1.3), kafka (honkai: star rail)', b: '' });
    ok(P.render(sd, 'nai', {}).a.indexOf('1.3::long hair ::, kafka (honkai: star rail)') >= 0, 'SDXL形式はNAI形式へ。重みのない括弧は名前として保持');
    ok(P.render(sd, 'sdxl', {}).text.indexOf('(long hair:1.3), kafka (honkai: star rail)') >= 0);
  });
  test('人物入力：アプリの強調と利用者の強調が出力先ごとに混ざらない', function () {
    D.pairPoses.forEach(function (pose) {
      prefVariants.forEach(function (pr) {
        var o = allOutputs(withPeople(pose.id, personCases.both), pr);
        ok(!/[{}]|::/.test(o.x.text), pose.id + ' SDXLにNAI構文なし');
        ok(!/\([^()]*:\d+(\.\d+)?\)/.test(o.n.text), pose.id + ' NAIにSDXL構文なし');
      });
    });
  });
  test('人物入力：長いプロンプトの貼り付け（上限4000字まで保持し、超過分だけ切る）', function () {
    var tags = []; for (var i = 0; i < 400; i++) tags.push('tag' + i);
    var long = tags.join(', ');
    ok(long.length > 3000 && long.length <= 4000, '長さ ' + long.length);
    var st = withPeople('pair_hug_from_behind', { a: long, b: '' });
    eq(st.people.a.prompt, long);
    ok(P.render(st, 'nai', {}).a.indexOf('tag399') >= 0); ok(P.render(st, 'sdxl', {}).text.indexOf('tag399') >= 0); ok(P.render(st, 'tsubaki', {}).text.indexOf('tag399') >= 0);
    var over = P.set(st, 'people.a.prompt', long + long);
    eq(over.people.a.prompt.length, 4000);
  });
  test('人物入力：改行・文章の貼り付けは区切りだけ整え、語は変えない', function () {
    var st = withPeople('pair_hug_from_behind', { a: 'He has short black hair.\nHe wears a navy coat.', b: 'red scarf\n\nwhite gloves' });
    ok(P.render(st, 'tsubaki', {}).text.indexOf('Appearance of Person A (the one hugging from behind): He has short black hair. He wears a navy coat.') >= 0);
    ok(P.render(st, 'nai', {}).b.indexOf('red scarf, white gloves') >= 0);
    eq(st.people.b.prompt, 'red scarf\n\nwhite gloves', '保存値は原文のまま');
  });
  test('人物入力：利用者の語とアプリの語が重なるときはアプリ側を出さない', function () {
    var st = withPeople('pair_hug_from_behind', { a: 'boy, black hair', b: 'looking ahead, red hair' });
    var n = P.render(st, 'nai', {});
    eq((n.a.match(/\bboy\b/g) || []).length, 1); eq((n.b.match(/looking ahead/g) || []).length, 1);
    var x = P.render(withPeople('pair_hug_from_behind', { a: 'white shirt', b: 'white shirt' }), 'sdxl', {}).text;
    eq((x.match(/white shirt/g) || []).length, 1, 'SDXLの共通語は一つに');
  });
  test('人物入力：出力先を変えても入力内容は変わらない', function () {
    var st = withPeople('pair_straddle_lying', personCases.both), before = JSON.stringify(st);
    ['tsubaki', 'sdxl', 'nai', 'generic', 'nai'].forEach(function (t) { P.render(st, t, { emphasis: true }); P.issues(st, t, {}); });
    eq(JSON.stringify(st), before);
  });
  test('人物入力：ポーズを変えても入力内容を保持する', function () {
    var st = withPeople('pair_straddle_lying', personCases.both);
    pairIds.forEach(function (id) { var next = P.selectPose(st, id).state; eq([next.people.a.prompt, next.people.b.prompt], [PA, PB], id); st = next; });
    eq(P.selectPose(st, null).state.people.a.prompt, PA, 'ポーズ未選択に戻しても保持');
  });
  test('人物入力：一括コピー（| 区切り）と個別コピーの内容が一致する', function () {
    D.pairPoses.forEach(function (pose) {
      Object.keys(personCases).forEach(function (key) {
        var n = P.render(withPeople(pose.id, personCases[key]), 'nai', { emphasis: true });
        eq(n.text, [n.base, n.a, n.b].join(' | '), pose.id + key);
        eq(n.characters.map(function (c) { return c.id; }), ['a', 'b']);
        eq(n.characters.map(function (c) { return c.text; }), [n.a, n.b]);
      });
    });
  });
  test('人物入力：| を含む入力は一括コピーがずれるため警告する', function () {
    var st = withPeople('pair_hug_from_behind', { a: 'black hair | red eyes', b: '' });
    ok(P.issues(st, 'nai', {}).filter(function (i) { return i.id === 'person_a'; })[0].codes.indexOf('pipe') >= 0);
    ok(!P.issues(st, 'sdxl', {}).some(function (i) { return i.id === 'person_a' && i.codes.indexOf('pipe') >= 0; }));
  });
  test('人物入力：adult／bust はアプリ側で足さず、利用者の入力にあれば警告だけする', function () {
    var st = withPeople('pair_hug_from_behind', { a: 'adult man, black hair', b: '' });
    ok(P.issues(st, 'tsubaki', {}).some(function (i) { return i.id === 'pixai_forbidden_note'; }));
    ok(P.render(st, 'tsubaki', {}).text.indexOf('adult man') >= 0, '利用者の語は残す');
    ok(!P.issues(st, 'nai', {}).some(function (i) { return i.id === 'pixai_forbidden_note'; }));
  });
  test('人物入力：SDXLでは人物属性が混ざる可能性を案内する', function () {
    ok(P.issues(withPeople('pair_hug_from_behind', personCases.both), 'sdxl', {}).some(function (i) { return i.id === 'sdxl_person_mixing'; }));
    ok(!P.issues(pairState('pair_hug_from_behind'), 'sdxl', {}).some(function (i) { return i.id === 'sdxl_person_mixing'; }));
  });
  test('人物入力：A⇄B入れ替えで外見・服装も入れ替わる', function () {
    var st = P.swapPeople(withPeople('pair_lap_facing', personCases.both));
    eq([st.people.a.prompt, st.people.b.prompt], [PB, PA]);
  });
  test('人物入力：日本語構造に人物ごとの外見・服装を表示する', function () {
    var j = P.structureJa(withPeople('pair_lap_facing', personCases.onlyA));
    ok(j.indexOf('【人物Aの外見・服装】1boy, solo, short black hair, {{red eyes}}, black suit, ／ white shirt') >= 0, j);
    ok(j.indexOf('【人物Bの外見・服装】') < 0);
  });
  test('人物入力：ポーズと構図だけのリセットは人物入力と末尾追加を残す', function () {
    var st = P.set(withPeople('pair_lap_facing', personCases.both, { 'camera.angle': 'low', 'people.a.gender': 'male' }), 'notes.common', 'bedroom');
    var r = P.resetPoseOnly(st);
    eq([r.poseId, r.camera.angle, r.people.a.prompt, r.people.b.prompt, r.people.a.gender, r.notes.common], [null, null, PA, PB, 'male', 'bedroom']);
    ok(P.hasPersonInput(r)); ok(!P.hasPersonInput(P.initial()));
  });
  test('人物入力：人物の枠は配列で、人数タグは三人以上の数え方にも対応する', function () {
    eq(P.slotsOf(null).map(function (x) { return x.id; }), ['a', 'b']);
    eq(P.countTags({}, [{ gender: 'male' }, { gender: 'male' }, { gender: 'female' }]), ['2boys', '1girl']);
    eq(P.countTags({}, [{ gender: 'female' }, { gender: 'female' }, { gender: 'female' }]), ['3girls']);
    eq(P.countTags({}, [{ gender: 'male' }, { gender: 'unspecified' }]), []);
  });
  test('人物入力：解析は括弧と強調の内側のカンマで区切らない', function () {
    eq(MO.splitTop('a, {{b, c}}, 1.2::d, e ::, (f, g:1.1), h\ni'), ['a', '{{b, c}}', '1.2::d, e ::', '(f, g:1.1)', 'h', 'i']);
    eq(MO.coreOf('{{Black_Hair}}'), 'black hair'); eq(MO.coreOf('1.2::Red Eyes ::'), 'red eyes');
  });
  test('保存：人物プロンプトセットの保存・一覧・削除・上限・破損', function () {
    var st = memoryStore();
    var item = Store.savePersonSet('黒髪スーツ', { gender: 'male', prompt: PA }, st);
    eq(Store.listPersonSets(st)[0].prompt, PA); eq(Store.listPersonSets(st)[0].gender, 'male');
    Store.savePersonSet('', { gender: 'robot', prompt: 'x' }, st);
    eq(Store.listPersonSets(st)[0].name, '名前なしの人物'); eq(Store.listPersonSets(st)[0].gender, 'unspecified');
    Store.deletePersonSet(item.id, st); eq(Store.listPersonSets(st).length, 1);
    for (var i = 0; i < 40; i++) Store.savePersonSet('p' + i, { prompt: 'x' }, st);
    eq(Store.listPersonSets(st).length, Store.maxPersonSets);
    st.data[Store.keys.personSets] = '{broken'; eq(Store.listPersonSets(st), []);
  });
  test('保存：二人用の下書き・名前付き保存に人物入力が残る', function () {
    var st = memoryStore(), s = withPeople('pair_lap_facing', personCases.both);
    Store.savePairDraft(s, st); eq(Store.loadPairDraft(st).people.a.prompt, PA);
    Store.savePreset('二人', s, st, 'pair'); eq(Store.listPresets(st)[0].state.people.b.prompt, PB);
  });


  // ---- NovelAI専用の打ち消し指定（負の強調）の扱い（2026-10-28 確認） ----
  var NEG_RAW = 'black hair, -1::hat ::, -0.5::glasses, scarf ::';
  function negState() { return P.set(pairState('pair_hug_from_behind'), 'people.a.prompt', NEG_RAW); }
  test('打ち消し指定：非対応モデルの出力からだけ外し、入力の原文は保持する', function () {
    var st = negState(), before = JSON.stringify(st);
    ['tsubaki', 'sdxl'].forEach(function (t) {
      var text = P.render(st, t, { emphasis: true }).text;
      ok(text.indexOf('black hair') >= 0, t + ' 他の語は残る');
      ok(!/hat|glasses|scarf|-\d|::/.test(text), t + ' 打ち消し指定を出さない: ' + text);
    });
    eq(JSON.stringify(st), before, '出力しても状態は変わらない');
    eq(st.people.a.prompt, NEG_RAW);
  });
  test('打ち消し指定：NovelAIへ戻すと元の指定がそのまま出る', function () {
    var st = negState(), first = P.render(st, 'nai', {}).a;
    ['tsubaki', 'sdxl', 'generic'].forEach(function (t) { P.render(st, t, {}); });
    var again = P.render(st, 'nai', {}).a;
    eq(again, first);
    ok(again.indexOf('black hair, -1::hat ::, -0.5::glasses, scarf ::') >= 0, again);
    ok(!P.issues(st, 'nai', {}).some(function (i) { return i.id === 'person_a' && i.codes.indexOf('emphasis_dropped') >= 0; }), 'NovelAIでは除外の案内を出さない');
  });
  test('打ち消し指定：人物プロンプトセット・下書き・名前付き保存で原文を保持する', function () {
    var mem = memoryStore(), st = negState();
    Store.savePersonSet('帽子なし', st.people.a, mem); eq(Store.listPersonSets(mem)[0].prompt, NEG_RAW);
    Store.savePairDraft(st, mem); eq(Store.loadPairDraft(mem).people.a.prompt, NEG_RAW);
    Store.savePreset('二人', st, mem, 'pair'); eq(Store.listPresets(mem)[0].state.people.a.prompt, NEG_RAW);
    var reloaded = P.set(pairState('pair_lap_facing'), 'people.b.prompt', Store.listPersonSets(mem)[0].prompt);
    ok(P.render(reloaded, 'nai', {}).b.indexOf('-1::hat ::') >= 0, '読み込み後もNovelAIで復元');
  });
  test('打ち消し指定：除外した指定を、出力先ごとに案内で確認できる', function () {
    var st = negState();
    ['tsubaki', 'sdxl'].forEach(function (t) {
      var issue = P.issues(st, t, {}).filter(function (i) { return i.id === 'person_a'; })[0];
      ok(issue && issue.codes.indexOf('emphasis_dropped') >= 0 && issue.severity === 'warning', t);
      ok(issue.textJa.indexOf('-1::hat ::') >= 0 && issue.textJa.indexOf('-0.5::glasses, scarf ::') >= 0, t + ' 除外した指定を原文で表示');
      ok(issue.textJa.indexOf(MO.target(t).labelJa) >= 0, t + ' どの出力先で外したかを表示');
    });
  });
  test('打ち消し指定：他モデルのネガティブプロンプトへ自動変換しない', function () {
    var st = negState();
    ['tsubaki', 'sdxl', 'nai'].forEach(function (t) {
      var out = P.render(st, t, { emphasis: true });
      ok(!('negative' in out), t + ' 二人用出力にネガティブ欄なし');
      ok(!/\b(hat|glasses)\b/.test(t === 'nai' ? out.base : out.text), t + ' 共通・本文へ移さない');
    });
    var single = S.applyPatch(S.initial(), D.presets[0].patch);
    single = S.applyPatch(single, { 'output.includeNegativePrompt': true });
    ['generic', 'sdxl', 'nai', 'tsubaki'].forEach(function (t) { ok(!/\b(hat|glasses)\b/.test(MO.single(single, t, {}).negative), t + ' 一人用Negativeにも入らない'); });
  });

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
