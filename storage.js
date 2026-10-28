(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var KEYS = { draft: 'pcw_draft_v1', presets: 'pcw_user_presets_v1', preferences: 'pcw_preferences_v1', pairDraft: 'pcw_pair_draft_v1', personSets: 'pcw_person_sets_v1' };
  var MAX_PERSON_SETS = 30;
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
      // kind が無い保存データは従来どおり一人用として読む
      if (item.kind === 'pair' && PCW.pair) return { id: String(item.id || ''), kind: 'pair', name: item.name.slice(0, 60), savedAt: item.savedAt || '', state: PCW.pair.normalize(item.state) };
      return { id: String(item.id || ''), name: item.name.slice(0, 60), savedAt: item.savedAt || '', state: PCW.state.normalize(item.state) };
    }).slice(0, MAX_PRESETS);
  }
  function savePreset(name, state, store, kind) {
    var list = listPresets(store);
    var isPair = kind === 'pair' && PCW.pair;
    var item = { id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: String(name || '名前なしの設計').trim().slice(0, 60) || '名前なしの設計', savedAt: new Date().toISOString(), state: isPair ? PCW.pair.normalize(state) : PCW.state.normalize(state) };
    if (isPair) item.kind = 'pair';
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
  function saveOutputPrefs(prefs, store) {
    var current = loadPreferences(store);
    current.output = PCW.modelOutput ? PCW.modelOutput.normalizePrefs(prefs) : prefs;
    return savePreferences(current, store);
  }
  function loadOutputPrefs(store) {
    var current = loadPreferences(store);
    return PCW.modelOutput ? PCW.modelOutput.normalizePrefs(current.output) : (current.output || {});
  }
  // 人物プロンプトセット：人物A・Bのどちらにも読み込める、名前付きの外見・服装プロンプト
  function listPersonSets(store) {
    var raw = read(KEYS.personSets, [], store);
    if (!Array.isArray(raw)) return [];
    var max = PCW.modelOutput ? PCW.modelOutput.maxPersonPrompt : 4000;
    return raw.filter(function (x) { return x && typeof x.name === 'string' && typeof x.prompt === 'string'; }).map(function (x) {
      return { id: String(x.id || ''), name: x.name.slice(0, 60), gender: ['male', 'female'].indexOf(x.gender) >= 0 ? x.gender : 'unspecified', prompt: x.prompt.slice(0, max), savedAt: x.savedAt || '' };
    }).slice(0, MAX_PERSON_SETS);
  }
  function savePersonSet(name, person, store) {
    var list = listPersonSets(store), src = person || {};
    var item = { id: 'person_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: String(name || '').trim().slice(0, 60) || '名前なしの人物', gender: ['male', 'female'].indexOf(src.gender) >= 0 ? src.gender : 'unspecified', prompt: String(src.prompt || ''), savedAt: new Date().toISOString() };
    list.unshift(item);
    write(KEYS.personSets, list.slice(0, MAX_PERSON_SETS), store);
    return item;
  }
  function deletePersonSet(id, store) {
    var next = listPersonSets(store).filter(function (x) { return x.id !== id; });
    write(KEYS.personSets, next, store);
    return next;
  }
  function savePairDraft(state, store) { return PCW.pair ? write(KEYS.pairDraft, PCW.pair.normalize(state), store) : false; }
  function loadPairDraft(store) {
    var raw = read(KEYS.pairDraft, null, store);
    if (!raw || typeof raw !== 'object' || !PCW.pair) return null;
    return PCW.pair.normalize(raw);
  }
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
    loadPreferences: loadPreferences,
    saveOutputPrefs: saveOutputPrefs,
    loadOutputPrefs: loadOutputPrefs,
    savePairDraft: savePairDraft,
    loadPairDraft: loadPairDraft,
    clearPairDraft: function (store) { return remove(KEYS.pairDraft, store); },
    maxPersonSets: MAX_PERSON_SETS,
    listPersonSets: listPersonSets,
    savePersonSet: savePersonSet,
    deletePersonSet: deletePersonSet
  };
})(window);
