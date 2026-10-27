(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data, M = PCW.modelOutput;

  // 二人用ポーズの状態・整合・出力。意味データは data/pair-poses.js、ここは出力先ごとの組み立てだけを持つ。
  var SCHEMA = 'pair-1.0';

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0] || null; }
  function poseById(id) { return byId(D.pairPoses, id); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 400) : ''; }

  function initial() {
    return {
      schemaVersion: SCHEMA,
      poseId: null,
      people: { a: { gender: 'unspecified' }, b: { gender: 'unspecified' } },
      camera: { angle: null, shot: null },
      surface: null,
      gaze: null,
      options: { keepClothed: false },
      notes: { common: '', a: '', b: '' },
      meta: { updatedAt: null }
    };
  }

  // 選択肢の可否。UIの無効化と正規化の両方が同じ判定を使う。
  function angleState(p, id) {
    if (!p) return { ok: false, reason: '' };
    if (p.camera.angles.indexOf(id) >= 0) return { ok: true, recommended: p.camera.recommended.indexOf(id) >= 0 };
    return { ok: false, reason: p.camera.blocked[id] || 'このポーズでは使えません。' };
  }
  function shotState(p, id) {
    if (!p) return { ok: false, reason: '' };
    if (p.camera.shots.indexOf(id) >= 0) return { ok: true };
    return { ok: false, reason: p.camera.blockedShots[id] || 'このポーズでは使えません。' };
  }
  function surfaceState(p, id) { return { ok: !!p && p.surface.allowed.indexOf(id) >= 0 }; }
  function gazeState(p, id) { return { ok: !!p && p.gazes.allowed.indexOf(id) >= 0 }; }

  function normalize(raw) {
    var base = initial(), src = isObject(raw) ? raw : {};
    var s = clone(base);
    var p = poseById(src.poseId);
    s.poseId = p ? p.id : null;
    ['a', 'b'].forEach(function (k) {
      var g = src.people && src.people[k] && src.people[k].gender;
      s.people[k].gender = byId(D.pairGenders, g) ? g : 'unspecified';
    });
    if (p) {
      var cam = src.camera || {};
      s.camera.angle = angleState(p, cam.angle).ok ? cam.angle : p.camera.defaultAngle;
      s.camera.shot = shotState(p, cam.shot).ok ? cam.shot : p.camera.defaultShot;
      s.surface = surfaceState(p, src.surface).ok ? src.surface : p.surface.defaultId;
      s.gaze = gazeState(p, src.gaze).ok ? src.gaze : p.gazes.defaultId;
    }
    s.options.keepClothed = !!(src.options && src.options.keepClothed === true);
    ['common', 'a', 'b'].forEach(function (k) { s.notes[k] = str(src.notes && src.notes[k]); });
    s.meta.updatedAt = src.meta && typeof src.meta.updatedAt === 'string' ? src.meta.updatedAt : null;
    return s;
  }

  function set(state, path, value) {
    var next = clone(normalize(state)), keys = path.split('.'), cur = next;
    keys.slice(0, -1).forEach(function (k) { if (!isObject(cur[k])) cur[k] = {}; cur = cur[k]; });
    cur[keys[keys.length - 1]] = value;
    next.meta.updatedAt = new Date().toISOString();
    return normalize(next);
  }

  // ポーズ切り替え：新しいポーズで成立する値は保持し、成立しない値だけ推奨値へ戻す。
  function selectPose(state, poseId) {
    var before = normalize(state), p = poseById(poseId);
    if (!p) return { state: set(before, 'poseId', null), adjusted: [] };
    var next = set(before, 'poseId', p.id), adjusted = [];
    if (before.poseId) {
      if (before.camera.angle && before.camera.angle !== next.camera.angle) adjusted.push('カメラ：' + byId(D.pairAngles, next.camera.angle).labelJa);
      if (before.camera.shot && before.camera.shot !== next.camera.shot) adjusted.push('撮影範囲：' + byId(D.pairShots, next.camera.shot).labelJa);
    }
    return { state: next, adjusted: adjusted };
  }
  function swapPeople(state) {
    var s = normalize(state), next = clone(s);
    next.people = { a: clone(s.people.b), b: clone(s.people.a) };
    next.notes.a = s.notes.b; next.notes.b = s.notes.a;
    return normalize(next);
  }

  function roleOf(p, which) {
    // which: 'front' | 'back' → 'a' | 'b'
    var depth = p.relation.depth;
    if (depth === 'b_front') return which === 'front' ? 'b' : 'a';
    if (depth === 'a_front') return which === 'front' ? 'a' : 'b';
    return null;
  }
  function fillJa(text, p) {
    return String(text).replace(/\{front\}/g, (roleOf(p, 'front') || 'a').toUpperCase()).replace(/\{back\}/g, (roleOf(p, 'back') || 'b').toUpperCase());
  }
  function fillEn(text, p) {
    var front = roleOf(p, 'front'), back = roleOf(p, 'back');
    return String(text)
      .replace(/\{A\}/g, 'Person A').replace(/\{B\}/g, 'Person B')
      .replace(/\{front\}/g, 'Person ' + (front || 'a').toUpperCase())
      .replace(/\{back\}/g, 'Person ' + (back || 'b').toUpperCase());
  }
  function gazeLabel(p, gazeId) { var g = byId(D.pairGazes, gazeId); return g ? fillJa(g.labelJa, p) : ''; }
  function sentence(text) {
    var t = String(text || '').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '';
  }
  // 人数タグ（SDXL・NAI共通の数え方）。性別がそろっていない場合は空。
  function countTags(s) {
    var ga = s.people.a.gender, gb = s.people.b.gender;
    if (ga === 'unspecified' || gb === 'unspecified') return [];
    if (ga === gb) return [ga === 'male' ? '2boys' : '2girls'];
    return ['1boy', '1girl'];
  }
  function gazeRoleTags(p, g, role) {
    if (!g) return [];
    var out = (g.nai[role] || []).slice();
    if (roleOf(p, 'front') === role) out = out.concat(g.nai.front || []);
    if (roleOf(p, 'back') === role) out = out.concat(g.nai.back || []);
    return out;
  }

  function tsubaki(s, p, prefs) {
    var out = [], ga = byId(D.pairGenders, s.people.a.gender), gb = byId(D.pairGenders, s.people.b.gender);
    out.push('Two grown-up characters, Person A and Person B, appear together.');
    var who = [];
    if (ga.tsubaki) who.push('Person A is ' + ga.tsubaki);
    if (gb.tsubaki) who.push('Person B is ' + gb.tsubaki);
    if (who.length) out.push(sentence(who.join(', and ')));
    out.push(p.models.tsubaki.overview);
    var vertical = D.pairRelationTsubaki.vertical[p.relation.vertical], depth = D.pairRelationTsubaki.depth[p.relation.depth];
    if (vertical) out.push(vertical);
    if (depth && p.models.tsubaki.overview.indexOf('in front') < 0) out.push(depth);
    out.push(p.models.tsubaki.a);
    out.push(p.models.tsubaki.b);
    out.push(sentence('Contact points: ' + p.contacts.map(function (c) { return c.tsubaki; }).join('; ')));
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf) out.push(p.surface.mode === 'seat' ? 'Person B is seated on ' + surf.en + '.' : 'They are on ' + surf.en + '.');
    var g = byId(D.pairGazes, s.gaze);
    if (g) out.push(fillEn(g.tsubaki, p));
    var angle = byId(D.pairAngles, s.camera.angle), shot = byId(D.pairShots, s.camera.shot);
    if (angle) out.push(angle.tsubaki);
    if (shot) out.push(shot.tsubaki);
    if (s.options.keepClothed) out.push('Both characters remain fully clothed.');
    if (s.notes.a) out.push('Person A: ' + s.notes.a);
    if (s.notes.b) out.push('Person B: ' + s.notes.b);
    var text = out.map(function (x) { return x.trim(); }).filter(Boolean).join(' ').replace(/\.\.+/g, '.');
    if (s.notes.common) text += ' ' + s.notes.common;
    return { text: text };
  }

  function sdxl(s, p, prefs) {
    var tags = [];
    var counts = countTags(s);
    if (counts.length) counts.forEach(function (t) { M.push(tags, t); }); else M.push(tags, 'two people');
    var core = M.uniq(p.models.sdxl.core);
    M.push(tags, M.emphasize('sdxl', prefs, core));
    var used = core.slice();
    function add(t) { if (used.indexOf(t) < 0) { used.push(t); M.push(tags, t); } }
    p.models.sdxl.placement.forEach(add);
    var g = byId(D.pairGazes, s.gaze);
    if (g) g.sdxl.forEach(add);
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf) add(p.surface.mode === 'seat' ? surf.seatTag : surf.onTag);
    var angle = byId(D.pairAngles, s.camera.angle), shot = byId(D.pairShots, s.camera.shot);
    if (angle) angle.tags.forEach(add);
    if (shot) shot.tags.forEach(add);
    if (s.options.keepClothed) add('clothed');
    var text = tags.join(', ');
    ['a', 'b', 'common'].forEach(function (k) { if (s.notes[k]) text += (text ? ', ' : '') + s.notes[k]; });
    return { text: text };
  }

  function nai(s, p, prefs) {
    var pr = M.normalizePrefs(prefs), base = [], a = [], b = [];
    countTags(s).forEach(function (t) { M.push(base, t); });
    var core = M.uniq(p.models.nai.core);
    var used = core.slice();
    M.push(base, M.emphasize('nai', pr, core));
    function addBase(t) { if (used.indexOf(t) < 0) { used.push(t); M.push(base, t); } }
    var g = byId(D.pairGazes, s.gaze);
    if (g && g.nai.base) g.nai.base.forEach(addBase);
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf && p.surface.mode === 'on') addBase(surf.onTag);
    var angle = byId(D.pairAngles, s.camera.angle), shot = byId(D.pairShots, s.camera.shot);
    if (angle) angle.tags.forEach(addBase);
    if (shot) shot.tags.forEach(addBase);
    if (s.options.keepClothed) addBase('clothed');
    if (pr.naiNaturalLanguage) addBase(p.models.nai.nl);
    var roles = { a: a, b: b };
    ['a', 'b'].forEach(function (role) {
      var list = roles[role], gender = byId(D.pairGenders, s.people[role].gender);
      if (gender.nai) M.push(list, gender.nai);
      p.models.nai.actions.forEach(function (act) { M.push(list, (act.source === role ? 'source#' : 'target#') + act.tag); });
      // 座る面はBの姿勢として渡す（sitting → sitting on couch などへ具体化）
      var seated = role === 'b' && surf && p.surface.mode === 'seat';
      if (seated) M.push(list, surf.seatTag);
      p.models.nai[role].forEach(function (t) { if (seated && t === 'sitting') return; if (used.indexOf(t) < 0) M.push(list, t); });
      gazeRoleTags(p, g, role).forEach(function (t) { if (used.indexOf(t) < 0) M.push(list, t); });
    });
    var out = { base: base.join(', '), a: a.join(', '), b: b.join(', ') };
    if (s.notes.common) out.base += (out.base ? ', ' : '') + s.notes.common;
    if (s.notes.a) out.a += (out.a ? ', ' : '') + s.notes.a;
    if (s.notes.b) out.b += (out.b ? ', ' : '') + s.notes.b;
    // パイプ区切り：Character Promptsを使わずに一つの欄へ貼る場合の形式（NAI公式の | 構文）
    out.text = [out.base, out.a, out.b].join(' | ');
    return out;
  }

  function render(state, targetId, prefs) {
    var s = normalize(state), p = poseById(s.poseId);
    var id = targetId === 'generic' ? 'tsubaki' : M.target(targetId).id;
    if (!p) return { target: id, text: '', base: '', a: '', b: '' };
    var out = id === 'nai' ? nai(s, p, prefs) : id === 'sdxl' ? sdxl(s, p, prefs) : tsubaki(s, p, prefs);
    out.target = id;
    return out;
  }

  function structureJa(state) {
    var s = normalize(state), p = poseById(s.poseId);
    if (!p) return '';
    var R = D.pairRelationLabels, lines = [];
    lines.push('【ポーズ】' + p.labelJa);
    lines.push('【人物A：' + p.roles.a + '】' + p.placement.a);
    lines.push('【人物B：' + p.roles.b + '】' + p.placement.b);
    var rel = [R.vertical[p.relation.vertical], R.depth[p.relation.depth], R.facing[p.relation.facing]].filter(function (x) { return x && x !== '同じ高さ' && x !== '前後差なし'; });
    lines.push('【位置関係】' + rel.join('／'));
    lines.push('【接触点】\n' + p.contacts.map(function (c) { return '・' + c.ja; }).join('\n'));
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf) lines.push('【場所】' + surf.labelJa + (p.surface.mode === 'seat' ? '（Bが座る）' : ''));
    if (s.gaze) lines.push('【視線】' + gazeLabel(p, s.gaze));
    lines.push('【カメラ】' + byId(D.pairAngles, s.camera.angle).labelJa + '・' + byId(D.pairShots, s.camera.shot).labelJa);
    return lines.join('\n');
  }

  function issues(state, targetId, prefs) {
    var s = normalize(state), p = poseById(s.poseId), out = [], id = targetId === 'generic' ? 'tsubaki' : targetId, pr = M.normalizePrefs(prefs);
    if (!p) return out;
    var unspecified = s.people.a.gender === 'unspecified' || s.people.b.gender === 'unspecified';
    if (id === 'nai' && unspecified) out.push({ id: 'nai_count_tags', severity: 'info', textJa: 'NovelAIは共通プロンプトに人数タグ（2boys・1boy, 1girl など）を置くと安定します。人物A・Bの性別を選ぶと自動で入ります。' });
    if (id === 'tsubaki' && pr.emphasis) out.push({ id: 'tsubaki_no_emphasis', severity: 'info', textJa: 'Tsubakiは自然文のため、強調構文を使いません。' });
    if (id === 'sdxl') out.push({ id: 'sdxl_binding', severity: 'info', textJa: 'SDXLのタグは人物ごとに分けられないため、上下・前後の取り違えが起きることがあります。安定しない場合はTsubakiやNovelAIのCharacter Promptsを試してください。' });
    if ((id === 'tsubaki' || id === 'sdxl') && ['common', 'a', 'b'].some(function (k) { return M.hasPixaiForbidden(s.notes[k]); })) out.push({ id: 'pixai_forbidden_note', severity: 'warning', textJa: '自由入力に adult／bust を含む語があります。自由入力は原文のまま出力します。' });
    return out;
  }

  function filterPoses(query, family) {
    return (D.pairPoses || []).filter(function (p) {
      if (family && family !== 'all' && p.poseFamily !== family) return false;
      var labels = D.presetPoseFamilyLabels || {};
      return M.matchesQuery(query, [p.labelJa, p.shortJa, p.roles.a, p.roles.b, p.placement.a, p.placement.b, labels[p.poseFamily] || '', '二人', '2人', 'ふたり'].concat(p.keywords));
    });
  }
  function familyCounts(query) {
    var counts = { all: 0 };
    filterPoses(query, 'all').forEach(function (p) { counts.all += 1; counts[p.poseFamily] = (counts[p.poseFamily] || 0) + 1; });
    return counts;
  }
  function summary(state, targetId) {
    var s = normalize(state), p = poseById(s.poseId);
    if (!p) return 'ポーズ未選択';
    return [p.labelJa, byId(D.pairAngles, s.camera.angle).labelJa, byId(D.pairShots, s.camera.shot).labelJa].join('・');
  }

  PCW.pair = {
    schema: SCHEMA,
    initial: initial,
    normalize: normalize,
    set: set,
    selectPose: selectPose,
    swapPeople: swapPeople,
    poseById: poseById,
    angleState: angleState,
    shotState: shotState,
    surfaceState: surfaceState,
    gazeState: gazeState,
    gazeLabel: gazeLabel,
    countTags: countTags,
    render: render,
    structureJa: structureJa,
    issues: issues,
    filterPoses: filterPoses,
    familyCounts: familyCounts,
    summary: summary
  };
})(window);
