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
  function filterPresets(presets, group, viewerOnly) {
    return (presets || []).filter(function (preset) {
      var groupMatch = !group || group === 'all' || getPresetFramingGroup(preset) === group;
      var tags = preset.meta && preset.meta.audienceTags || [];
      return groupMatch && (!viewerOnly || tags.indexOf('viewer_perspective') >= 0);
    });
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
  D.filterPresets = filterPresets;
  D.renderPresetFramingFilters = renderPresetFramingFilters;
})(window);
