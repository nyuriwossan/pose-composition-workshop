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
  // 人物の枠（配列）。ポーズが slots を持てばそれを使い、無ければ既定の二人。
  function slotsOf(p) {
    var all = D.pairPersonSlots || [{ id: 'a', labelJa: '人物A' }, { id: 'b', labelJa: '人物B' }];
    return p && p.slots ? all.filter(function (x) { return p.slots.indexOf(x.id) >= 0; }) : all;
  }

  function initial() {
    return {
      schemaVersion: SCHEMA,
      poseId: null,
      people: { a: { gender: 'unspecified', prompt: '', expression: emptyExpression() }, b: { gender: 'unspecified', prompt: '', expression: emptyExpression() } },
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
    slotsOf(null).forEach(function (slot) {
      var k = slot.id, srcPerson = src.people && src.people[k] || {};
      s.people[k] = s.people[k] || { gender: 'unspecified', prompt: '' };
      s.people[k].gender = byId(D.pairGenders, srcPerson.gender) ? srcPerson.gender : 'unspecified';
      // 貼り付けた文章は加工せず保持する（長さの上限だけ設ける）
      s.people[k].prompt = str(srcPerson.prompt, M.maxPersonPrompt);
      s.people[k].expression = normalizeExpression(srcPerson.expression);
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
  // ポーズと構図だけを初期状態へ戻す。人物A・Bの性別・外見・服装と、末尾追加の入力は残す。
  function resetPoseOnly(state) {
    var s = normalize(state), next = initial();
    next.people = clone(s.people); next.notes = clone(s.notes);
    return normalize(next);
  }
  function hasPersonInput(state) {
    var s = normalize(state);
    return slotsOf(null).some(function (slot) { return M.splitTop(s.people[slot.id].prompt).length > 0 || hasExpression(s.people[slot.id]); });
  }
  // 表情だけを未指定へ戻す（外見・服装・性別・ポーズは残す）
  function resetExpressions(state) {
    var next = clone(normalize(state));
    slotsOf(null).forEach(function (slot) { next.people[slot.id].expression = emptyExpression(); });
    return normalize(next);
  }
  // 一人分の外見・服装と表情を消す（性別は残す）
  function clearPerson(state, role) {
    var next = clone(normalize(state));
    if (next.people[role]) { next.people[role].prompt = ''; next.people[role].expression = emptyExpression(); }
    return normalize(next);
  }
  // ポーズのおすすめ表情を、未指定の枠にだけ入れる
  function applySuggestion(state) {
    var s = normalize(state), p = poseById(s.poseId), next = clone(s), filled = 0;
    if (!p || !p.suggest) return { state: s, filled: 0 };
    slotsOf(p).forEach(function (slot) {
      var sug = p.suggest[slot.id] || {}, expr = next.people[slot.id].expression;
      expressionSlotIds().forEach(function (k) {
        if (expr[k] || !sug[k] || expressionConflict(expr, k, sug[k])) return;
        expr[k] = sug[k]; filled += 1;
      });
    });
    return { state: normalize(next), filled: filled };
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
  // 「見る先」を持つ視線（日常ポーズ用、focus:true）だけ、{focus} をポーズの見る先へ置き換えた写しを返す。
  // それ以外の視線は元のオブジェクトをそのまま返すので、既存ポーズの出力は変わらない。
  var DEFAULT_FOCUS = { ja: '同じもの', en: 'the same thing', tags: ['looking at object'] };
  function resolveGaze(p, g) {
    if (!g || !g.focus) return g;
    var f = (p && p.focus) || DEFAULT_FOCUS, r = clone(g);
    function en(t) { return String(t).replace(/\{focus\}/g, f.en); }
    function tags(list) {
      var out = [];
      (list || []).forEach(function (t) { (t === '{focus}' ? f.tags : [t]).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); });
      return out;
    }
    r.labelJa = String(g.labelJa).replace(/\{focus\}/g, f.ja);
    r.tsubaki = en(g.tsubaki);
    Object.keys(r.roles || {}).forEach(function (k) { r.roles[k] = en(r.roles[k]); });
    r.sdxl = tags(g.sdxl);
    Object.keys(r.nai || {}).forEach(function (k) { r.nai[k] = tags(g.nai[k]); });
    return r;
  }
  function gazeOf(p, id) { return resolveGaze(p, byId(D.pairGazes, id)); }
  function fillEn(text, p) {
    var front = roleOf(p, 'front'), back = roleOf(p, 'back');
    return String(text)
      .replace(/\{A\}/g, 'Person A').replace(/\{B\}/g, 'Person B')
      .replace(/\{front\}/g, 'Person ' + (front || 'a').toUpperCase())
      .replace(/\{back\}/g, 'Person ' + (back || 'b').toUpperCase());
  }
  function gazeLabel(p, gazeId) { var g = gazeOf(p, gazeId); return g ? fillJa(g.labelJa, p) : ''; }
  function sentence(text) {
    var t = String(text || '').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '';
  }
  // 人物ごとの入力を出力先向けに整え、実際に使う性別を決める。
  // 性別の選択が最優先。未指定のときだけ、入力内の 1boy / girl などから推定する（状態は書き換えない）。
  function personInfo(s, p, targetId) {
    return slotsOf(p).map(function (slot) {
      var person = s.people[slot.id], ad = M.adaptPrompt(person.prompt, targetId || 'nai');
      var explicit = person.gender !== 'unspecified';
      return {
        slot: slot, id: slot.id, person: person, adapted: ad,
        gender: explicit ? person.gender : (ad.inferred || 'unspecified'),
        inferred: !explicit && !!ad.inferred,
        mismatch: explicit && !!ad.inferred && ad.inferred !== person.gender
      };
    });
  }
  // 人数タグ（SDXL・NAI共通の数え方）。性別が一人でも決まらない場合は空。
  function countTags(s, infos) {
    var list = infos || personInfo(normalize(s), poseById(s && s.poseId), 'nai');
    if (list.some(function (x) { return x.gender === 'unspecified'; })) return [];
    var boys = list.filter(function (x) { return x.gender === 'male'; }).length, girls = list.length - boys;
    var out = [];
    if (boys) out.push(boys === 1 ? '1boy' : boys + 'boys');
    if (girls) out.push(girls === 1 ? '1girl' : girls + 'girls');
    return out;
  }
  // ---- 人物A・B別の表情（2026-10-28） ----
  function expressionSlotIds() { return (D.pairExpressionSlots || []).map(function (x) { return x.id; }); }
  function exprItem(slot, id) { return byId((D.pairExpressions || {})[slot], id); }
  function emptyExpression() { var o = {}; expressionSlotIds().forEach(function (k) { o[k] = null; }); return o; }
  // 同じ人物の中で両立しない組み合わせなら理由を返す（両立するなら空文字）
  function expressionConflict(expr, slot, id) {
    var reason = '';
    (D.pairExpressionConflicts || []).some(function (c) {
      var hit = (c[0] === slot && c[1] === id && expr[c[2]] === c[3]) || (c[2] === slot && c[3] === id && expr[c[0]] === c[1]);
      if (hit) reason = c[4];
      return hit;
    });
    return reason;
  }
  // 先の枠（メイン → 視線 → 補助）を優先し、矛盾する後の枠の値は保存しない
  function normalizeExpression(src) {
    var out = emptyExpression(), raw = isObject(src) ? src : {};
    expressionSlotIds().forEach(function (k) {
      var id = raw[k];
      if (!exprItem(k, id) || expressionConflict(out, k, id)) return;
      out[k] = id;
    });
    return out;
  }
  function hasExpression(person) { return expressionSlotIds().some(function (k) { return !!(person.expression && person.expression[k]); }); }
  function expressionState(state, role, slot, id) {
    var s = normalize(state), expr = clone(s.people[role].expression);
    expr[slot] = null;
    var reason = expressionConflict(expr, slot, id);
    return { ok: !reason, reason: reason };
  }
  function expressionLabel(person) {
    return (D.pairExpressionSlots || []).map(function (slot) { var it = exprItem(slot.id, person.expression[slot.id]); return it ? it.labelJa : ''; }).filter(Boolean).join('・');
  }
  function otherName(infos, info) {
    var others = infos.filter(function (x) { return x.id !== info.id; });
    return others.length ? others[0].slot.tsubakiName : 'the other person';
  }
  // 二人の視線（見つめ合う など）から、その人物だけの視線句を取り出す
  function pairGazePhrase(p, g, role) {
    if (!g || !g.roles) return '';
    return g.roles[role] || (roleOf(p, 'front') === role ? g.roles.front : roleOf(p, 'back') === role ? g.roles.back : '') || '';
  }
  function anyPersonGaze(infos) { return infos.some(function (x) { return !!x.person.expression.gaze; }); }
  // 表情の英文：「Person A has a shy expression and is looking up at Person B, with lips slightly parted.」
  function tsubakiExpression(info, infos, p, g, anyGaze) {
    var e = info.person.expression, other = otherName(infos, info), clauses = [];
    var main = exprItem('main', e.main), gz = exprItem('gaze', e.gaze), sub = exprItem('sub', e.sub);
    if (main) clauses.push('has ' + main.tsubaki);
    var gazeText = gz ? gz.tsubaki : (anyGaze ? pairGazePhrase(p, g, info.id) : '');
    if (gazeText) clauses.push(gazeText.replace(/\{other\}/g, other));
    if (!clauses.length && !sub) return '';
    return sentence(info.slot.tsubakiName + ' ' + (clauses.length ? clauses.join(' and ') : 'appears') + (sub ? (clauses.length ? ', with ' : ' with ') + sub.tsubaki : ''));
  }
  // 表情のタグ（メイン → 視線 → 補助）。NovelAIだけ、タグの無い表情に自然な英語句を足す。
  function expressionTags(person, targetId) {
    var out = [];
    expressionSlotIds().forEach(function (k) {
      var it = exprItem(k, person.expression[k]);
      if (!it) return;
      it.tags.forEach(function (t) { M.push(out, t); });
      if (targetId === 'nai') (it.nai || []).forEach(function (t) { M.push(out, t); });
    });
    return out;
  }
  function gazeRoleTags(p, g, role) {
    if (!g) return [];
    var out = (g.nai[role] || []).slice();
    if (roleOf(p, 'front') === role) out = out.concat(g.nai.front || []);
    if (roleOf(p, 'back') === role) out = out.concat(g.nai.back || []);
    return out;
  }

  function tsubaki(s, p, prefs) {
    var out = [], infos = personInfo(s, p, 'tsubaki');
    out.push('Two grown-up characters, Person A and Person B, appear together.');
    var who = [];
    infos.forEach(function (info) {
      var g = byId(D.pairGenders, info.gender);
      if (g && g.tsubaki) who.push(info.slot.tsubakiName + ' is ' + g.tsubaki);
    });
    if (who.length) out.push(sentence(who.join(', and ')));
    // 外見は「誰が・どの位置の人物か」と結び付けて、ポーズ説明より前に置く
    var described = infos.filter(function (info) { return info.adapted.text; });
    var g0 = gazeOf(p, s.gaze), anyGaze = anyPersonGaze(infos);
    infos.forEach(function (info) {
      if (info.adapted.text) {
        var role = p.models.tsubaki.roleEn && p.models.tsubaki.roleEn[info.id];
        var body = info.adapted.text;
        out.push('Appearance of ' + info.slot.tsubakiName + (role ? ' (' + role + ')' : '') + ': ' + body + (/[.!?]$/.test(body) ? '' : '.'));
      }
      var expr = tsubakiExpression(info, infos, p, g0, anyGaze);
      if (expr) out.push(expr);
    });
    if (described.length >= 2) out.push('Keep the two appearances separate: ' + infos.map(function (info) { return info.slot.tsubakiName + "'s features apply only to " + info.slot.tsubakiName; }).join(', and ') + '.');
    out.push(p.models.tsubaki.overview);
    var vertical = D.pairRelationTsubaki.vertical[p.relation.vertical], depth = D.pairRelationTsubaki.depth[p.relation.depth];
    if (vertical) out.push(vertical);
    if (depth && p.models.tsubaki.overview.indexOf('in front') < 0) out.push(depth);
    out.push(p.models.tsubaki.a);
    out.push(p.models.tsubaki.b);
    out.push(sentence('Contact points: ' + p.contacts.map(function (c) { return c.tsubaki; }).join('; ')));
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf) out.push(p.surface.mode === 'seat' ? 'Person B is seated on ' + surf.en + '.' : p.surface.mode === 'both_seat' ? 'Both are seated on ' + surf.en + '.' : p.surface.mode === 'in' ? 'They sit in ' + surf.en + '.' : 'They are on ' + surf.en + '.');
    var g = gazeOf(p, s.gaze);
    // 人物別の視線を選んだ場合は、上の表情文で一人ずつ書いたので二人の視線文は出さない
    if (g && !anyGaze) out.push(fillEn(g.tsubaki, p));
    var angle = byId(D.pairAngles, s.camera.angle), shot = byId(D.pairShots, s.camera.shot);
    if (angle) out.push(angle.tsubaki);
    if (shot) out.push(shot.tsubaki);
    if (s.options.keepClothed) out.push('Both characters remain fully clothed.');
    if (s.notes.a) out.push('Person A: ' + s.notes.a);
    if (s.notes.b) out.push('Person B: ' + s.notes.b);
    var text = out.map(function (x) { return x.trim(); }).filter(Boolean).join(' ').replace(/\.\.+/g, '.');
    if (s.notes.common) text += ' ' + s.notes.common;
    return { text: text, characters: infos.map(function (info) { return { id: info.id, labelJa: info.slot.labelJa, text: info.adapted.text }; }) };
  }

  function sdxl(s, p, prefs) {
    var tags = [], infos = personInfo(s, p, 'sdxl');
    var counts = countTags(s, infos);
    if (counts.length) counts.forEach(function (t) { M.push(tags, t); }); else M.push(tags, 'two people');
    var core = M.uniq(p.models.sdxl.core);
    M.push(tags, M.emphasize('sdxl', prefs, core));
    var used = core.slice(), cores = core.map(M.coreOf);
    // 人物A → 人物Bの順に外見・服装を入れる。SDXLでは人物を区別できないため、同じ語は一つにまとめる。
    infos.forEach(function (info) {
      info.adapted.tokens.forEach(function (t, i) {
        var c = info.adapted.cores[i];
        if (cores.indexOf(c) >= 0) return;
        cores.push(c); M.push(tags, t);
      });
    });
    function add(t) { if (used.indexOf(t) < 0 && cores.indexOf(M.coreOf(t)) < 0) { used.push(t); cores.push(M.coreOf(t)); M.push(tags, t); } }
    // 人物A → 人物Bの順に表情。視線を選んでいない人物には、二人の視線から導いた視線を使う
    var g = gazeOf(p, s.gaze), anyGaze = anyPersonGaze(infos);
    infos.forEach(function (info) {
      expressionTags(info.person, 'sdxl').forEach(add);
      if (anyGaze && !info.person.expression.gaze) gazeRoleTags(p, g, info.id).forEach(add);
    });
    p.models.sdxl.placement.forEach(add);
    if (g && !anyGaze) g.sdxl.forEach(add);
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
    var pr = M.normalizePrefs(prefs), base = [], infos = personInfo(s, p, 'nai');
    countTags(s, infos).forEach(function (t) { M.push(base, t); });
    var core = M.uniq(p.models.nai.core);
    var used = core.slice();
    M.push(base, M.emphasize('nai', pr, core));
    function addBase(t) { if (used.indexOf(t) < 0) { used.push(t); M.push(base, t); } }
    var g = gazeOf(p, s.gaze), anyGaze = anyPersonGaze(infos);
    if (g && g.nai.base && !anyGaze) g.nai.base.forEach(addBase);
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf && (p.surface.mode === 'on' || p.surface.mode === 'both_seat' || p.surface.mode === 'in')) addBase(surf.onTag);
    var angle = byId(D.pairAngles, s.camera.angle), shot = byId(D.pairShots, s.camera.shot);
    if (angle) angle.tags.forEach(addBase);
    if (shot) shot.tags.forEach(addBase);
    if (s.options.keepClothed) addBase('clothed');
    if (pr.naiNaturalLanguage) addBase(p.models.nai.nl);
    // Character Prompt：性別語（boy / girl）→ 利用者の外見・服装 → 動作タグ（source# / target#）→ 配置 → 視線
    var characters = infos.map(function (info) {
      var role = info.id, list = [], gender = byId(D.pairGenders, info.gender), mine = info.adapted.cores;
      function addMine(t) { if (used.indexOf(t) < 0 && mine.indexOf(M.coreOf(t)) < 0) M.push(list, t); }
      if (gender.nai && mine.indexOf(gender.nai) < 0) M.push(list, gender.nai);
      info.adapted.tokens.forEach(function (t) { list.push(t); });
      expressionTags(info.person, 'nai').forEach(addMine);
      p.models.nai.actions.forEach(function (act) { M.push(list, (act.source === role ? 'source#' : 'target#') + act.tag); });
      // 座る面はBの姿勢として渡す（sitting → sitting on couch などへ具体化）
      var seated = role === 'b' && surf && p.surface.mode === 'seat';
      if (seated) addMine(surf.seatTag);
      (p.models.nai[role] || []).forEach(function (t) { if (seated && t === 'sitting' && /sitting/.test(surf.seatTag)) return; addMine(t); });
      if (!info.person.expression.gaze) gazeRoleTags(p, g, role).forEach(addMine);
      var text = list.join(', ');
      if (s.notes[role]) text += (text ? ', ' : '') + s.notes[role];
      return { id: role, labelJa: info.slot.labelJa, naiLabel: info.slot.naiLabel, text: text };
    });
    var out = { base: base.join(', '), characters: characters };
    characters.forEach(function (c) { out[c.id] = c.text; });
    if (s.notes.common) out.base += (out.base ? ', ' : '') + s.notes.common;
    // パイプ区切り：Character Promptsを使わずに一つの欄へ貼る場合の形式（NAI公式の | 構文）
    out.text = [out.base].concat(characters.map(function (c) { return c.text; })).join(' | ');
    return out;
  }

  function render(state, targetId, prefs) {
    var s = normalize(state), p = poseById(s.poseId);
    var id = targetId === 'generic' ? 'tsubaki' : M.target(targetId).id;
    if (!p) return { target: id, text: '', base: '', a: '', b: '', characters: [] };
    var out = id === 'nai' ? nai(s, p, prefs) : id === 'sdxl' ? sdxl(s, p, prefs) : tsubaki(s, p, prefs);
    out.target = id;
    return out;
  }

  // 簡易版の案内文。切り替え先があればその名前を添える（切り替えは利用者が選ぶ）
  function fallbackText(p) {
    var f = p && p.fallback; if (!f) return '';
    var alt = f.to ? poseById(f.to) : null;
    return f.noteJa + (alt ? '（簡易版：「' + alt.labelJa + '」）' : '');
  }
  function structureJa(state) {
    var s = normalize(state), p = poseById(s.poseId);
    if (!p) return '';
    var R = D.pairRelationLabels, lines = [];
    lines.push('【ポーズ】' + p.labelJa);
    lines.push('【人物A：' + p.roles.a + '】' + p.placement.a);
    lines.push('【人物B：' + p.roles.b + '】' + p.placement.b);
    slotsOf(p).forEach(function (slot) {
      var raw = s.people[slot.id].prompt.trim();
      if (M.splitTop(raw).length) lines.push('【' + slot.labelJa + 'の外見・服装】' + raw.replace(/\s*[\r\n]+\s*/g, ' ／ '));
      var person = s.people[slot.id];
      if (hasExpression(person)) lines.push('【' + slot.labelJa + 'の表情】' + (D.pairExpressionSlots || []).map(function (es) { var it = exprItem(es.id, person.expression[es.id]); return it ? es.labelJa + '：' + it.labelJa : ''; }).filter(Boolean).join('／'));
    });
    var rel = [R.vertical[p.relation.vertical], R.depth[p.relation.depth], R.facing[p.relation.facing]].filter(function (x) { return x && x !== '同じ高さ' && x !== '前後差なし'; });
    lines.push('【位置関係】' + rel.join('／'));
    lines.push('【接触点】\n' + p.contacts.map(function (c) { return '・' + c.ja; }).join('\n'));
    var surf = byId(D.pairSurfaces, s.surface);
    if (surf) lines.push('【場所】' + surf.labelJa + (p.surface.mode === 'seat' ? '（Bが座る）' : p.surface.mode === 'both_seat' ? '（二人が座る）' : p.surface.mode === 'in' ? '（二人が浸かる）' : ''));
    // 場面を決める小物・行為を英語へ含めているポーズだけ表示する（日常の料理・勉強など）
    if (p.sceneJa) lines.push('【場面を決める小物】' + p.sceneJa);
    if (s.gaze) lines.push('【視線】' + gazeLabel(p, s.gaze));
    lines.push('【カメラ】' + byId(D.pairAngles, s.camera.angle).labelJa + '・' + byId(D.pairShots, s.camera.shot).labelJa);
    // プリクラ二人用だけ：元の候補ID・最小画角・崩れやすいときの簡易版（自動では置き換えない）
    if (p.sourceId) lines.push('【元の候補】' + p.sourceId);
    if (p.minNoteJa) lines.push('【最小画角の条件】' + p.minNoteJa);
    if (p.fallback) lines.push('【崩れやすいとき】' + fallbackText(p));
    return lines.join('\n');
  }

  function issues(state, targetId, prefs) {
    var s = normalize(state), p = poseById(s.poseId), out = [], id = targetId === 'generic' ? 'tsubaki' : targetId, pr = M.normalizePrefs(prefs);
    if (!p) return out;
    var infos = personInfo(s, p, id);
    var unspecified = !countTags(s, infos).length;
    if (id === 'nai' && unspecified) out.push({ id: 'nai_count_tags', severity: 'info', textJa: 'NovelAIは共通プロンプトに人数タグ（2boys・1boy, 1girl など）を置くと安定します。人物A・Bの性別を選ぶと自動で入ります。' });
    if (id === 'tsubaki' && pr.emphasis) out.push({ id: 'tsubaki_no_emphasis', severity: 'info', textJa: 'Tsubakiは自然文のため、強調構文を使いません。' });
    var anyPerson = infos.some(function (x) { return x.adapted.tokens.length; });
    if (id === 'sdxl' && !anyPerson) out.push({ id: 'sdxl_binding', severity: 'info', textJa: 'SDXLのタグは人物ごとに分けられないため、上下・前後の取り違えが起きることがあります。安定しない場合はTsubakiやNovelAIのCharacter Promptsを試してください。' });
    if ((id === 'tsubaki' || id === 'sdxl') && (['common', 'a', 'b'].some(function (k) { return M.hasPixaiForbidden(s.notes[k]); }) || infos.some(function (x) { return M.hasPixaiForbidden(x.person.prompt); }))) out.push({ id: 'pixai_forbidden_note', severity: 'warning', textJa: '入力に adult／bust を含む語があります。利用者の入力は原文のまま出力します（アプリ側では追加しません）。' });
    if (id === 'sdxl' && anyPerson) out.push({ id: 'sdxl_person_mixing', severity: 'warning', textJa: 'SDXLでは人物A・Bの外見とポーズが一つのタグ列に入るため、髪色や服装がもう一方へ移ったり、上下・前後を取り違えたりすることがあります。両者に共通する語は一つにまとめます。安定させたいときは、各人物を特徴的な数語に絞るか、TsubakiやNovelAIを使ってください。' });
    var targetName = M.target(id).labelJa;
    var pg = byId(D.pairGazes, s.gaze);
    if (pg && anyPersonGaze(infos)) {
      var allGaze = infos.every(function (x) { return !!x.person.expression.gaze; });
      out.push({ id: 'person_gaze_override', severity: 'info', textJa: allGaze ? '二人とも人物別の視線を選んだため、「場所・視線」の二人の視線（' + gazeLabel(p, s.gaze) + '）は使いません。' : '人物別の視線を選んだため、「場所・視線」の二人の視線（' + gazeLabel(p, s.gaze) + '）は、視線を選んでいない人物にだけ当てはめます。' });
    }
    // 斜め後ろからの角度（日常ポーズだけが持つ）で、顔を見合う視線を選んだときの案内
    var gz0 = byId(D.pairGazes, s.gaze);
    if (s.camera.angle === 'rear_three_quarter' && gz0 && !gz0.focus && gz0.id !== 'eyes_closed') out.push({ id: 'rear_angle_faces', severity: 'info', textJa: '「斜め後ろから」は二人の背中と同じ前方を写す角度です。顔や視線を見せたいときは「斜め前から」を選んでください。' });
    var vh = (D.pairGazeVerticalHints || {})[p.relation.vertical];
    if (vh) infos.forEach(function (x) {
      var gz = exprItem('gaze', x.person.expression.gaze);
      if (gz && gz.direction && gz.direction === vh[x.id]) out.push({ id: 'gaze_vertical_' + x.id, severity: 'warning', textJa: x.slot.labelJa + 'はこのポーズで相手より' + (gz.direction === 'up' ? '高い' : '低い') + '位置にいるため、「' + gz.labelJa + '」は不自然になりやすい組み合わせです。' });
    });
    // 人物ごとに一つの案内へまとめる（スマートフォンで読みやすくするため）
    infos.forEach(function (x) {
      var who = x.slot.labelJa, ad = x.adapted, g = byId(D.pairGenders, x.gender), parts = [], codes = [], severity = 'info';
      function add(code, text, sev) { codes.push(code); parts.push(text); if (sev === 'warning') severity = 'warning'; }
      if (ad.removed.length) add('count_tags', '人数タグ（' + ad.removed.join(', ') + '）は人物欄から外し、' + (id === 'tsubaki' ? '二人の人数は文章で' : id === 'nai' ? '人数は共通プロンプトで' : '人数は先頭のタグで') + '指定します。');
      if (x.inferred) add('gender_inferred', '性別が未指定のため、入力の語から' + g.labelJa + 'として扱っています（性別を選ぶと確定）。');
      if (x.mismatch) add('gender_mismatch', '性別の設定（' + byId(D.pairGenders, x.person.gender).labelJa + '）と、入力の語（' + (ad.inferred === 'male' ? '男性' : '女性') + '）が食い違っています。設定を優先します。', 'warning');
      if (ad.genderConflict) add('gender_conflict', '入力に男性・女性の両方を示す語があります。性別を選ぶと人数タグが安定します。', 'warning');
      if (ad.converted.length) add('emphasis_converted', '強調構文を' + (id === 'tsubaki' ? '外しました（自然文のため）' : targetName + '向けに変換しました') + '：' + ad.converted.slice(0, 3).join('／') + (ad.converted.length > 3 ? ' ほか' + (ad.converted.length - 3) + '件' : '') + '。');
      if (ad.dropped.length) add('emphasis_dropped', ad.dropped.join(', ') + ' はNovelAI専用の打ち消し指定か記号だけの語のため、' + targetName + 'では出力しません。', 'warning');
      if (id === 'nai' && ad.hasPipe) add('pipe', '入力に | があるため、| 区切りの一括コピーでは区切りがずれます。Character Promptsへ個別にコピーしてください。', 'warning');
      if (parts.length) out.push({ id: 'person_' + x.id, person: x.id, codes: codes, severity: severity, textJa: who + '：' + parts.join('') });
    });
    return out;
  }

  // filter はカテゴリ（抱擁・密着 など）か、従来のポーズ系統のどちらでも指定できる
  function filterPoses(query, family) {
    var cats = D.pairPoseCategories || {};
    return (D.pairPoses || []).filter(function (p) {
      if (family && family !== 'all') {
        if (cats[family] ? p.category !== family : p.poseFamily !== family) return false;
      }
      var labels = D.presetPoseFamilyLabels || {};
      return M.matchesQuery(query, [p.labelJa, p.shortJa, p.roles.a, p.roles.b, p.placement.a, p.placement.b, labels[p.poseFamily] || '', cats[p.category] || '', '二人', '2人', 'ふたり'].concat(p.keywords));
    });
  }
  function categoryCounts(query) {
    var counts = { all: 0 };
    filterPoses(query, 'all').forEach(function (p) { counts.all += 1; counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }
  // 表情の検索（ひらがな・カタカナ・漢字の差を吸収）
  function filterExpressions(slot, query) {
    return ((D.pairExpressions || {})[slot] || []).filter(function (it) { return M.matchesQuery(query, [it.labelJa, it.descJa].concat(it.keywords || [], it.tags)); });
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
    fallbackText: fallbackText,
    swapPeople: swapPeople,
    resetPoseOnly: resetPoseOnly,
    resetExpressions: resetExpressions,
    clearPerson: clearPerson,
    applySuggestion: applySuggestion,
    expressionState: expressionState,
    expressionLabel: expressionLabel,
    hasExpression: hasExpression,
    categoryCounts: categoryCounts,
    filterExpressions: filterExpressions,
    hasPersonInput: hasPersonInput,
    slotsOf: slotsOf,
    personInfo: function (state, targetId) { var s = normalize(state); return personInfo(s, poseById(s.poseId), targetId); },
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
