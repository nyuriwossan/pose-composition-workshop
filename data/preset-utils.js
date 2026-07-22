(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};
  var groups = {
    up: ['face_close_up', 'headshot', 'bust_shot'],
    half: ['upper_body', 'waist_up', 'knee_up'],
    full: ['full_body', 'wide', 'wide_shot']
  };
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
    }, { all: 0, basic: 0, relationship: 0 });
  }
  function filterPresets(presets, group, options) {
    if (typeof options === 'boolean') options = { viewerOnly: options };
    options = options || {};
    return (presets || []).filter(function (preset) {
      var groupMatch = !group || group === 'all' || getPresetFramingGroup(preset) === group;
      var meta = preset.meta || {};
      var tags = meta.audienceTags || [];
      var collectionMatch = !options.collection || options.collection === 'all' || meta.collection === options.collection;
      var moodMatch = !options.mood || options.mood === 'all' || (meta.moodTags || []).indexOf(options.mood) >= 0;
      var sceneMatch = !options.scene || options.scene === 'all' || (meta.sceneTags || []).indexOf(options.scene) >= 0;
      return groupMatch && collectionMatch && moodMatch && sceneMatch && (!options.viewerOnly || tags.indexOf('viewer_perspective') >= 0);
    });
  }
  function renderPresetCollectionFilters(active, presets) {
    var counts = getPresetCollectionCounts(presets);
    return [['all', 'すべて'], ['basic', '基本ポーズ'], ['relationship', '恋人・親しい相手']].map(function (row) {
      return '<button type="button" class="collection-filter" data-collection-filter="' + row[0] + '" aria-pressed="' + (active === row[0]) + '">' + row[1] + ' <b>' + counts[row[0]] + '</b></button>';
    }).join('');
  }
  function normalizeRelationshipPresetFilters(collection, mood, scene) {
    return collection === 'relationship' ? { mood: mood || 'all', scene: scene || 'all' } : { mood: 'all', scene: 'all' };
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
  D.filterPresets = filterPresets;
  D.renderPresetCollectionFilters = renderPresetCollectionFilters;
  D.normalizeRelationshipPresetFilters = normalizeRelationshipPresetFilters;
  D.renderPresetFramingFilters = renderPresetFramingFilters;
})(window);
