(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var KEYS = { draft: 'pcw_draft_v1', presets: 'pcw_user_presets_v1', preferences: 'pcw_preferences_v1' };
  var MAX_PRESETS = 20;

  function target(store) { return store || global.localStorage; }
  function read(key, fallback, store) {
    try {
      var raw = target(store).getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value, store) {
    try { target(store).setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function remove(key, store) { try { target(store).removeItem(key); return true; } catch (e) { return false; } }
  function saveDraft(state, store) { return write(KEYS.draft, PCW.state.normalize(state), store); }
  function loadDraft(store) {
    var raw = read(KEYS.draft, null, store);
    if (!raw || typeof raw !== 'object') return null;
    return PCW.state.normalize(raw);
  }
  function listPresets(store) {
    var raw = read(KEYS.presets, [], store);
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (item) { return item && typeof item.name === 'string' && item.state; }).map(function (item) {
      return { id: String(item.id || ''), name: item.name.slice(0, 60), savedAt: item.savedAt || '', state: PCW.state.normalize(item.state) };
    }).slice(0, MAX_PRESETS);
  }
  function savePreset(name, state, store) {
    var list = listPresets(store);
    var item = { id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: String(name || '名前なしの設計').trim().slice(0, 60) || '名前なしの設計', savedAt: new Date().toISOString(), state: PCW.state.normalize(state) };
    list.unshift(item);
    write(KEYS.presets, list.slice(0, MAX_PRESETS), store);
    return item;
  }
  function deletePreset(id, store) {
    var next = listPresets(store).filter(function (item) { return item.id !== id; });
    write(KEYS.presets, next, store);
    return next;
  }
  function savePreferences(value, store) { return write(KEYS.preferences, value || {}, store); }
  function loadPreferences(store) { var value = read(KEYS.preferences, {}, store); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

  PCW.storage = {
    keys: KEYS,
    maxPresets: MAX_PRESETS,
    read: read,
    write: write,
    remove: remove,
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    clearDraft: function (store) { return remove(KEYS.draft, store); },
    listPresets: listPresets,
    savePreset: savePreset,
    deletePreset: deletePreset,
    savePreferences: savePreferences,
    loadPreferences: loadPreferences
  };
})(window);
