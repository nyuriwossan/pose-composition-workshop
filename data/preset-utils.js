(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  var groups = {
    up: ['face_close_up', 'headshot', 'bust_shot'],
    half: ['upper_body', 'waist_up', 'knee_up'],
    full: ['full_body', 'wide', 'wide_shot']
  };
  var poseFamilies = {
    standing_leaning: '立つ・もたれる',
    sitting_kneeling: '座る・膝立ち',
    lying_bed: '寝る・ベッド',
    supported_forward: '前傾・身体を支える',
    face_gesture: '顔まわり・ジェスチャー',
    approach_touch: '接近・触れる',
    rear_turn: '背面・振り返り',
    viewer_hand: 'Viewerとの手のやりとり',
    restraint: '拘束・固定'
  };
  function inferPresetPoseFamily(preset) {
    var meta = preset && preset.meta || {};
    if (poseFamilies[meta.poseFamily]) return meta.poseFamily;
    var patch = preset && preset.patch || {}, pose = patch.pose || {}, arms = pose.arms || {};
    var scenes = meta.sceneTags || [], interactions = meta.interactionTags || [];
    if (meta.collection === 'special' || patch.restraint && patch.restraint.type && patch.restraint.type !== 'none') return 'restraint';
    if (interactions.indexOf('hand_interaction') >= 0) return 'viewer_hand';
    if (['hands_and_knees', 'forward_lean_support', 'leaning_forward_on_hands'].indexOf(pose.supportPose) >= 0 || pose.torso && pose.torso.lean === 'forward' && arms.combined === 'supporting_upper_body') return 'supported_forward';
    if (scenes.indexOf('back_view') >= 0 || scenes.indexOf('back_focused') >= 0 || pose.rearViewEmphasis && pose.rearViewEmphasis !== 'none' || pose.head && pose.head.yaw === 'over_shoulder') return 'rear_turn';
    if (scenes.indexOf('bed') >= 0 || scenes.indexOf('lying_down') >= 0 || pose.posture === 'reclining' || pose.lyingOrientation && pose.lyingOrientation !== 'none') return 'lying_bed';
    if (arms.combined && ['heart_hands_near_face', 'arms_crossed'].indexOf(arms.combined) >= 0 ||
        arms.primary && ['hand_touching_chin', 'hand_touching_cheek', 'hand_in_hair', 'hand_near_face', 'hand_covering_eyes', 'hand_covering_mouth', 'finger_heart_near_face'].indexOf(arms.primary.action) >= 0 ||
        arms.secondary && ['hand_touching_chin', 'hand_touching_cheek', 'hand_in_hair', 'hand_near_face', 'hand_covering_eyes', 'hand_covering_mouth', 'finger_heart_near_face'].indexOf(arms.secondary.action) >= 0) return 'face_gesture';
    if (patch.interaction && patch.interaction.target === 'viewer' && ['very_close', 'close'].indexOf(patch.interaction.distance) >= 0) return 'approach_touch';
    if (['sitting', 'kneeling', 'one_knee_kneeling', 'crouching', 'squatting'].indexOf(pose.posture) >= 0) return 'sitting_kneeling';
    return 'standing_leaning';
  }
  (D.presets || []).forEach(function (preset) {
    preset.meta = preset.meta || {};
    preset.meta.poseFamily = inferPresetPoseFamily(preset);
  });
  function getPresetFramingGroup(preset) {
    var shot = preset && preset.patch && preset.patch.camera && preset.patch.camera.shotSize;
    var found = null;
    Object.keys(groups).some(function (key) {
      if (groups[key].indexOf(shot) >= 0) { found = key; return true; }
      return false;
    });
    return found || 'other';
  }
  function getPresetFramingCounts(presets) {
    var list = presets || [];
    return list.reduce(function (counts, preset) {
      var group = getPresetFramingGroup(preset);
      counts[group] += 1;
      counts.all += 1;
      return counts;
    }, { all: 0, up: 0, half: 0, full: 0, other: 0 });
  }
  function getPresetCollectionCounts(presets) {
    return (presets || []).reduce(function (counts, preset) {
      var collection = preset.meta && preset.meta.collection || 'basic';
      counts.all += 1;
      if (counts[collection] != null) counts[collection] += 1;
      return counts;
    }, { all: 0, basic: 0, relationship: 0, special: 0 });
  }
  function getPresetPoseFamilyCounts(presets) {
    return (presets || []).reduce(function (counts, preset) {
      var family = inferPresetPoseFamily(preset);
      counts.all += 1;
      counts[family] = (counts[family] || 0) + 1;
      return counts;
    }, { all: 0 });
  }
  function filterPresets(presets, group, options) {
    if (typeof options === 'boolean') options = { viewerOnly: options };
    options = options || {};
    return (presets || []).filter(function (preset) {
      var groupMatch = !group || group === 'all' || getPresetFramingGroup(preset) === group;
      var meta = preset.meta || {};
      var tags = meta.audienceTags || [];
      var collectionMatch = !options.collection || options.collection === 'all' || meta.collection === options.collection;
      var familyMatch = !options.poseFamily || options.poseFamily === 'all' || inferPresetPoseFamily(preset) === options.poseFamily;
      var moodMatch = !options.mood || options.mood === 'all' || (meta.moodTags || []).indexOf(options.mood) >= 0;
      var sceneMatch = !options.scene || options.scene === 'all' || (meta.sceneTags || []).indexOf(options.scene) >= 0;
      var interactionMatch = !options.interaction || options.interaction === 'all' || (meta.interactionTags || []).indexOf(options.interaction) >= 0;
      return groupMatch && collectionMatch && familyMatch && moodMatch && sceneMatch && interactionMatch && (!options.viewerOnly || tags.indexOf('viewer_perspective') >= 0);
    });
  }
  function renderPresetCollectionFilters(active, presets) {
    var counts = getPresetCollectionCounts(presets);
    return [['all', 'すべて'], ['basic', '基本ポーズ'], ['relationship', '恋人・親しい相手'], ['special', '特殊・演出']].map(function (row) {
      return '<button type="button" class="collection-filter" data-collection-filter="' + row[0] + '" aria-pressed="' + (active === row[0]) + '">' + row[1] + ' <b>' + counts[row[0]] + '</b></button>';
    }).join('');
  }
  function renderPresetPoseFamilyFilters(active, presets) {
    var counts = getPresetPoseFamilyCounts(presets);
    return [['all', 'すべて']].concat(Object.keys(poseFamilies).map(function (id) { return [id, poseFamilies[id]]; })).map(function (row) {
      return '<button type="button" data-pose-family-filter="' + row[0] + '" aria-pressed="' + (active === row[0]) + '">' + row[1] + ' <b>' + (counts[row[0]] || 0) + '</b></button>';
    }).join('');
  }
  function normalizeRelationshipPresetFilters(collection, mood, scene, interaction) {
    return collection === 'relationship' ? { mood: mood || 'all', scene: scene || 'all', interaction: interaction || 'all' } : { mood: 'all', scene: 'all', interaction: 'all' };
  }
  function renderPresetFramingFilters(active, presets) {
    var counts = getPresetFramingCounts(presets);
    var labels = [
      ['all', 'すべて', ''],
      ['up', 'アップ', '顔〜胸元'],
      ['half', '半身', '上半身〜膝上'],
      ['full', '全身', '頭から足先']
    ];
    return labels.map(function (row) {
      return '<button type="button" class="preset-filter" data-preset-filter="' + row[0] + '" aria-pressed="' + (active === row[0]) + '"><span>' + row[1] + ' <b>' + counts[row[0]] + '</b></span>' + (row[2] ? '<small>' + row[2] + '</small>' : '') + '</button>';
    }).join('');
  }
  D.presetFramingGroups = groups;
  D.getPresetFramingGroup = getPresetFramingGroup;
  D.getPresetFramingCounts = getPresetFramingCounts;
  D.getPresetCollectionCounts = getPresetCollectionCounts;
  D.presetPoseFamilyLabels = poseFamilies;
  D.inferPresetPoseFamily = inferPresetPoseFamily;
  D.getPresetPoseFamilyCounts = getPresetPoseFamilyCounts;
  D.filterPresets = filterPresets;
  D.renderPresetCollectionFilters = renderPresetCollectionFilters;
  D.renderPresetPoseFamilyFilters = renderPresetPoseFamilyFilters;
  D.normalizeRelationshipPresetFilters = normalizeRelationshipPresetFilters;
  D.renderPresetFramingFilters = renderPresetFramingFilters;
})(window);
