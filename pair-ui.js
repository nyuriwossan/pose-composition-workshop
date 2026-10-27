(function (global) {
  'use strict';
  var PCW = global.PCW;
  var D = PCW.data, P = PCW.pair, M = PCW.modelOutput;

  // 二人用ポーズ画面。状態・保存・コピーは app.js から渡される ctx 経由で扱う。
  var ui = { query: '', family: 'all', picking: false, showJa: false };

  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0] || null; }

  function targetSwitch(ctx, mode) {
    var prefs = ctx.getPrefs();
    var active = mode === 'pair' ? M.pairTarget(prefs) : prefs.outputTarget;
    var list = M.targets.filter(function (t) { return mode === 'pair' ? t.pair : t.single; });
    var current = M.target(active);
    return '<div class="target-switch" role="group" aria-label="出力先"><div class="target-switch__row"><span class="target-switch__label">出力先</span><div class="target-switch__buttons">' + list.map(function (t) {
      return '<button type="button" data-target="' + t.id + '" aria-pressed="' + (t.id === active) + '">' + ctx.esc(t.shortJa) + '</button>';
    }).join('') + '</div></div><small class="target-switch__note">' + ctx.esc(current.labelJa + '：' + current.noteJa) + '</small></div>';
  }

  function poseCard(ctx, p, selected) {
    var fam = D.presetPoseFamilyLabels[p.poseFamily] || '';
    return '<button type="button" class="pair-pose-card" data-pair-pose="' + ctx.attr(p.id) + '" aria-pressed="' + selected + '"><strong>' + ctx.esc(p.labelJa) + '</strong><small>' + ctx.esc(p.shortJa) + '</small><span class="preset-tags"><span class="preset-tag">二人</span><span class="preset-tag">' + ctx.esc(fam) + '</span></span></button>';
  }
  function poseListHtml(ctx, selectedId) {
    var list = P.filterPoses(ui.query, ui.family);
    return list.length ? list.map(function (p) { return poseCard(ctx, p, p.id === selectedId); }).join('') : '<p class="preset-empty">該当するポーズはありません。言葉を短くするか、系統の絞り込みを外してください。</p>';
  }
  function familyFilters(ctx) {
    var counts = P.familyCounts(ui.query);
    var fams = ['all'].concat(Object.keys(D.presetPoseFamilyLabels).filter(function (id) { return (D.pairPoses || []).some(function (p) { return p.poseFamily === id; }); }));
    return fams.map(function (id) {
      var label = id === 'all' ? 'すべて' : D.presetPoseFamilyLabels[id];
      return '<button type="button" data-pair-family="' + id + '" aria-pressed="' + (ui.family === id) + '">' + ctx.esc(label) + ' <b>' + (counts[id] || 0) + '</b></button>';
    }).join('');
  }

  function picker(ctx, s) {
    var p = P.poseById(s.poseId);
    if (p && !ui.picking) {
      return '<section class="design-card pair-selected"><div class="card-head"><div><small class="mini-label">選択中のポーズ</small><h2>' + ctx.esc(p.labelJa) + '</h2><p>' + ctx.esc(p.shortJa) + '</p></div><button type="button" class="btn btn--nowrap" data-pair-action="pick">変更</button></div></section>';
    }
    return '<section class="design-card"><div class="card-head"><div><h2>ポーズを選ぶ</h2><p>日本語で検索できます（例：膝、バックハグ、仰向け）。</p></div><span class="count-pill">' + D.pairPoses.length + '種</span></div>' +
      '<label class="field-label visually-hidden" for="pairSearch">ポーズを検索</label><input id="pairSearch" type="search" data-pair-search placeholder="ポーズを検索" value="' + ctx.attr(ui.query) + '" autocomplete="off">' +
      '<div class="tag-filters pair-family-filters" role="group" aria-label="ポーズ系統で絞り込み" id="pairFamilyFilters">' + familyFilters(ctx) + '</div>' +
      '<div class="pair-pose-list" id="pairPoseList">' + poseListHtml(ctx, s.poseId) + '</div>' +
      (p ? '<button type="button" class="detail-toggle" data-pair-action="close-pick">選択中のポーズに戻る</button>' : '') + '</section>';
  }

  function relationChips(ctx, p) {
    var R = D.pairRelationLabels, out = [];
    if (p.relation.vertical !== 'level') out.push(['上下', R.vertical[p.relation.vertical]]);
    if (p.relation.depth !== 'none') out.push(['前後', R.depth[p.relation.depth]]);
    out.push(['向き', R.facing[p.relation.facing]]);
    return '<div class="relation-chips">' + out.map(function (r) { return '<span><small>' + r[0] + '</small>' + ctx.esc(r[1]) + '</span>'; }).join('') + '</div>';
  }
  function layout(ctx, s, p) {
    var related = p.related.map(function (id) { return byId(D.presets, id); }).filter(Boolean);
    return '<section class="design-card"><div class="card-head"><div><h2>二人の配置</h2><p>Aは動作する側（主導側）、Bは受ける側（相手側）です。</p></div><button type="button" class="btn btn--quiet btn--nowrap" data-pair-action="swap" aria-label="人物AとBの性別・自由入力を入れ替える">A⇄B</button></div>' +
      relationChips(ctx, p) +
      '<div class="role-row role-row--a"><span class="role-badge">A</span><div><strong>' + ctx.esc(p.roles.a) + '</strong><p>' + ctx.esc(p.placement.a) + '</p></div></div>' +
      '<div class="role-row role-row--b"><span class="role-badge">B</span><div><strong>' + ctx.esc(p.roles.b) + '</strong><p>' + ctx.esc(p.placement.b) + '</p></div></div>' +
      '<div class="subsection"><h3>接触点</h3><ul class="contact-list">' + p.contacts.map(function (c) { return '<li>' + ctx.esc(c.ja) + '</li>'; }).join('') + '</ul></div>' +
      (related.length ? '<div class="subsection"><h3>一人だけを描く近い構図（相手視点）</h3><div class="chip-grid">' + related.map(function (r) { return '<button type="button" class="chip" data-pair-related="' + ctx.attr(r.id) + '">' + ctx.esc(r.nameJa) + '</button>'; }).join('') + '</div></div>' : '') +
      '</section>';
  }
  function genderRow(ctx, s, role) {
    return '<div class="segmented" role="group" aria-label="人物' + role.toUpperCase() + 'の性別"><span class="segmented__label role-badge role-badge--' + role + '">' + role.toUpperCase() + '</span>' + D.pairGenders.map(function (g) {
      return '<button type="button" data-pair-set="people.' + role + '.gender" data-value="' + g.id + '" aria-pressed="' + (s.people[role].gender === g.id) + '">' + ctx.esc(g.labelJa) + '</button>';
    }).join('') + '</div>';
  }
  function people(ctx, s) {
    var counts = P.countTags(s);
    return '<section class="design-card"><div class="card-head"><div><h2>人物</h2><p>SDXL・NovelAIの人数タグ（2boys など）と、Tsubakiの人物説明に使います。</p></div></div>' +
      genderRow(ctx, s, 'a') + genderRow(ctx, s, 'b') +
      '<p class="chip-note">人数タグ：' + ctx.esc(counts.length ? counts.join(', ') : '性別が未指定のため出力しません（SDXLは two people）') + '</p></section>';
  }
  function optionChips(ctx, path, items, value, stateFn) {
    var blocked = [];
    var html = '<div class="chip-grid">' + items.map(function (item) {
      var st = stateFn(item.id);
      if (!st.ok && st.reason) blocked.push(item.labelJa + '：' + st.reason);
      return '<button type="button" class="chip' + (st.recommended ? ' chip--recommended' : '') + '" data-pair-set="' + path + '" data-value="' + ctx.attr(item.id) + '" aria-pressed="' + (value === item.id) + '"' + (!st.ok ? ' disabled aria-disabled="true"' : '') + '>' + (st.recommended ? '<span aria-hidden="true">★</span>' : '') + ctx.esc(item.labelJa) + (st.recommended ? '<span class="visually-hidden">（推奨）</span>' : '') + '</button>';
    }).join('') + '</div>';
    if (blocked.length) html += '<details class="blocked-note"><summary>選べない候補（' + blocked.length + '）の理由</summary><ul>' + blocked.map(function (b) { return '<li>' + ctx.esc(b) + '</li>'; }).join('') + '</ul></details>';
    return html;
  }
  function camera(ctx, s, p) {
    return '<section class="design-card"><div class="card-head"><div><h2>カメラ</h2><p>★は推奨。ポーズと矛盾する候補は選べません。</p></div></div>' +
      '<div class="subsection subsection--first"><h3>角度</h3>' + optionChips(ctx, 'camera.angle', D.pairAngles, s.camera.angle, function (id) { return P.angleState(p, id); }) + '</div>' +
      '<div class="subsection"><h3>撮影範囲</h3>' + optionChips(ctx, 'camera.shot', D.pairShots, s.camera.shot, function (id) { return P.shotState(p, id); }) + '</div></section>';
  }
  function scene(ctx, s, p) {
    var surf = byId(D.pairSurfaces, s.surface);
    var summaryText = [surf ? surf.labelJa : '', P.gazeLabel(p, s.gaze), s.options.keepClothed ? '服装を保持' : ''].filter(Boolean).join('・');
    var surfaces = p.surface.mode === 'none' ? '' : '<div class="subsection subsection--first"><h3>' + (p.surface.mode === 'seat' ? 'Bが座る場所' : '場所') + '</h3>' + optionChips(ctx, 'surface', D.pairSurfaces.filter(function (x) { return p.surface.allowed.indexOf(x.id) >= 0; }), s.surface, function (id) { return P.surfaceState(p, id); }) + '</div>';
    var gazes = '<div class="subsection' + (surfaces ? '' : ' subsection--first') + '"><h3>視線</h3><div class="chip-grid">' + p.gazes.allowed.map(function (id) {
      return '<button type="button" class="chip" data-pair-set="gaze" data-value="' + id + '" aria-pressed="' + (s.gaze === id) + '">' + ctx.esc(P.gazeLabel(p, id)) + '</button>';
    }).join('') + '</div></div>';
    var clothed = '<div class="subsection"><h3>服装</h3><button type="button" class="chip" data-pair-toggle="options.keepClothed" aria-pressed="' + s.options.keepClothed + '">二人とも服を着たままにする</button></div>';
    return '<details class="design-card fold"' + (ui.openScene ? ' open' : '') + ' data-fold="scene"><summary><span><strong>場所・視線・服装</strong><small>' + ctx.esc(summaryText) + '</small></span></summary><div class="fold-body">' + surfaces + gazes + clothed + '</div></details>';
  }
  function notes(ctx, s) {
    var filled = ['common', 'a', 'b'].filter(function (k) { return s.notes[k]; }).length;
    var field = function (k, label, ph) { return '<label class="field-label" for="pairNote_' + k + '">' + label + '</label><textarea id="pairNote_' + k + '" data-pair-note="' + k + '" rows="2" placeholder="' + ctx.attr(ph) + '">' + ctx.esc(s.notes[k]) + '</textarea>'; };
    return '<details class="design-card fold"' + (ui.openNotes ? ' open' : '') + ' data-fold="notes"><summary><span><strong>自由入力（共通・人物A・人物B）</strong><small>' + (filled ? filled + '欄に入力あり' : '未入力') + '</small></span></summary><div class="fold-body"><p class="hint">英語で入力すると、出力先に合わせて末尾へ追加します。NovelAIでは人物A・BをそれぞれのCharacter Promptへ入れます。原文は改変しません。</p>' +
      field('common', '共通（背景・画風など）', '例: bedroom, soft lighting') + field('a', '人物A', '例: black hair, white shirt') + field('b', '人物B', '例: silver hair, cardigan') + '</div></details>';
  }
  function outputOptions(ctx) {
    var prefs = ctx.getPrefs(), t = M.pairTarget(prefs);
    var emphasis = t === 'tsubaki' ? '<p class="chip-note">Tsubakiは自然文のため、強調構文を使いません。</p>' :
      '<button type="button" class="chip" data-pref-toggle="emphasis" aria-pressed="' + prefs.emphasis + '">主ポーズを強調する</button>';
    var naiExtra = t === 'nai' ? '<div class="subsection"><h3>NovelAIの強調構文</h3><div class="segmented segmented--plain" role="group" aria-label="NovelAIの強調構文"><button type="button" data-pref-set="naiEmphasisStyle" data-value="braces" aria-pressed="' + (prefs.naiEmphasisStyle === 'braces') + '">{{ }}</button><button type="button" data-pref-set="naiEmphasisStyle" data-value="numeric" aria-pressed="' + (prefs.naiEmphasisStyle === 'numeric') + '">1.2:: ::（V4以降）</button></div></div>' +
      '<div class="subsection"><h3>自然文の補足</h3><button type="button" class="chip" data-pref-toggle="naiNaturalLanguage" aria-pressed="' + prefs.naiNaturalLanguage + '">位置関係を英文で補足（V5向け）</button></div>' : '';
    return '<details class="design-card fold" data-fold="opts"' + (ui.openOpts ? ' open' : '') + '><summary><span><strong>出力オプション</strong><small>' + ctx.esc((prefs.emphasis && t !== 'tsubaki' ? '強調あり' : '強調なし') + (t === 'nai' && prefs.naiNaturalLanguage ? '・英文補足' : '')) + '</small></span></summary><div class="fold-body"><div class="subsection subsection--first">' + emphasis + '</div>' + naiExtra + '</div></details>';
  }
  function copyButton(ctx, key, label, small) {
    return '<button type="button" class="btn btn--accent' + (small ? ' btn--small' : '') + '" data-pair-copy="' + key + '">' + ctx.esc(label) + '</button>';
  }
  function output(ctx, s) {
    var prefs = ctx.getPrefs(), t = M.pairTarget(prefs), out = P.render(s, t, prefs);
    var notesHtml = P.issues(s, t, prefs).map(function (i) { return '<p class="output-note output-note--' + i.severity + '">' + ctx.esc(i.textJa) + '</p>'; }).join('');
    var body;
    if (t === 'nai') {
      body = '<div class="nai-block"><div class="nai-head"><strong>共通プロンプト</strong><small>Base Prompt</small>' + copyButton(ctx, 'base', 'コピー', true) + '</div><pre class="output-box output-box--short" id="pairOut_base">' + ctx.esc(out.base) + '</pre></div>' +
        '<div class="nai-block nai-block--a"><div class="nai-head"><span class="role-badge">A</span><strong>Character 1：人物A</strong>' + copyButton(ctx, 'a', 'コピー', true) + '</div><pre class="output-box output-box--short" id="pairOut_a">' + ctx.esc(out.a) + '</pre></div>' +
        '<div class="nai-block nai-block--b"><div class="nai-head"><span class="role-badge role-badge--b">B</span><strong>Character 2：人物B</strong>' + copyButton(ctx, 'b', 'コピー', true) + '</div><pre class="output-box output-box--short" id="pairOut_b">' + ctx.esc(out.b) + '</pre></div>' +
        '<div class="sheet-actions"><button type="button" class="btn" data-pair-copy="text">| 区切りでまとめてコピー</button></div><p class="chip-note">Character Promptsは人物Aを上、人物Bを下に並べます。| 区切りはCharacter Promptsを使わない場合の形式です。</p>';
    } else {
      body = '<pre class="output-box" id="pairOut_text">' + ctx.esc(out.text) + '</pre><div class="sheet-actions">' + copyButton(ctx, 'text', 'プロンプトをコピー') + '</div>' +
        (t === 'tsubaki' ? '<p class="chip-note">Tsubaki向けにはネガティブプロンプトを出力しません。</p>' : '');
    }
    var ja = '<details class="fold fold--inline"' + (ui.showJa ? ' open' : '') + ' data-fold="ja"><summary><span><strong>日本語で構造を確認</strong></span></summary><pre class="output-box output-box--ja">' + ctx.esc(P.structureJa(s)) + '</pre></details>';
    return '<section class="design-card" id="pairOutput"><div class="card-head"><div><h2>出力：' + ctx.esc(M.target(t).labelJa) + '</h2><p>選んだ内容がリアルタイムで反映されます。</p></div></div>' + notesHtml + body + ja +
      '<div class="sheet-actions pair-actions"><button type="button" class="btn" data-pair-action="save">名前を付けて保存</button><button type="button" class="btn btn--danger" data-pair-action="reset">リセット</button></div></section>';
  }

  function render(ctx) {
    var s = ctx.getPair(), p = P.poseById(s.poseId);
    ctx.meter.innerHTML = '<span>二人のポーズ</span>';
    var head = '<div class="section-heading"><p class="eyebrow">TWO PEOPLE / POSE</p><h1>二人のポーズ</h1><p>人物A・Bの位置関係と接触点を決め、出力先に合わせた英語へ変換します。成人キャラクター同士を前提にした、非露骨な構図指定です。</p></div>';
    var html = head + targetSwitch(ctx, 'pair') + picker(ctx, s);
    if (p && !ui.picking) html += layout(ctx, s, p) + people(ctx, s) + camera(ctx, s, p) + scene(ctx, s, p) + notes(ctx, s) + outputOptions(ctx) + output(ctx, s);
    ctx.main.innerHTML = html;
    renderSticky(ctx);
    ctx.nav.hidden = false;
    ctx.nav.innerHTML = '<button class="btn" type="button" data-pair-action="home">スタートへ</button><button class="btn btn--primary" type="button" data-pair-action="to-output"' + (p ? '' : ' disabled') + '>出力へ移動</button>';
  }
  function renderSticky(ctx) {
    var s = ctx.getPair(), prefs = ctx.getPrefs(), t = M.pairTarget(prefs);
    var out = P.render(s, t, prefs);
    var preview = t === 'nai' ? out.base : out.text;
    ctx.sticky.hidden = false;
    ctx.sticky.innerHTML = '<div class="summary-row"><div class="summary-copy"><strong>' + ctx.esc(P.summary(s)) + '</strong><small><span class="target-pill">' + ctx.esc(M.target(t).shortJa) + '</span> <span class="live-preview" aria-live="off">' + ctx.esc(preview || 'ポーズを選ぶと英語がここに出ます') + '</span></small></div><button class="btn btn--primary" type="button" data-pair-copy="' + (t === 'nai' ? 'text' : 'text') + '"' + (preview ? '' : ' disabled') + '>コピー</button></div>';
  }
  function updatePoseList(ctx) {
    var list = document.getElementById('pairPoseList'), fam = document.getElementById('pairFamilyFilters');
    if (list) list.innerHTML = poseListHtml(ctx, ctx.getPair().poseId);
    if (fam) fam.innerHTML = familyFilters(ctx);
  }

  function click(target, ctx) {
    var s = ctx.getPair(), prefs = ctx.getPrefs();
    if (target.dataset.target) {
      if (ctx.view.screen !== 'pair') return false;
      prefs.outputTarget = target.dataset.target; ctx.setPrefs(prefs); render(ctx); return true;
    }
    if (ctx.view.screen !== 'pair') return false;
    if (target.dataset.pairPose) {
      var res = P.selectPose(s, target.dataset.pairPose);
      ui.picking = false; ctx.setPair(res.state); render(ctx);
      if (res.adjusted.length) ctx.toast('ポーズに合わせて ' + res.adjusted.join('・') + ' に調整しました');
      global.scrollTo(0, 0);
      return true;
    }
    if (target.dataset.pairFamily) { ui.family = target.dataset.pairFamily; updatePoseList(ctx); return true; }
    if (target.dataset.pairSet) {
      if (target.disabled) return true;
      ctx.setPair(P.set(s, target.dataset.pairSet, target.dataset.value)); render(ctx); ctx.restore(target); return true;
    }
    if (target.dataset.pairToggle) {
      var cur = target.dataset.pairToggle.split('.').reduce(function (o, k) { return o && o[k]; }, s);
      ctx.setPair(P.set(s, target.dataset.pairToggle, !cur)); render(ctx); ctx.restore(target); return true;
    }
    if (target.dataset.prefToggle) { prefs[target.dataset.prefToggle] = !prefs[target.dataset.prefToggle]; ctx.setPrefs(prefs); render(ctx); ctx.restore(target); return true; }
    if (target.dataset.prefSet) { prefs[target.dataset.prefSet] = target.dataset.value; ctx.setPrefs(prefs); render(ctx); ctx.restore(target); return true; }
    if (target.dataset.pairCopy) {
      var out = P.render(s, M.pairTarget(prefs), prefs);
      var key = target.dataset.pairCopy;
      ctx.copyText(out[key] || '', key === 'a' ? '人物Aをコピーしました' : key === 'b' ? '人物Bをコピーしました' : key === 'base' ? '共通プロンプトをコピーしました' : 'コピーしました');
      return true;
    }
    if (target.dataset.pairRelated) { ctx.loadSinglePreset(target.dataset.pairRelated); return true; }
    var action = target.dataset.pairAction;
    if (!action) return false;
    if (action === 'pick') { ui.picking = true; render(ctx); global.scrollTo(0, 0); }
    if (action === 'close-pick') { ui.picking = false; render(ctx); }
    if (action === 'swap') { ctx.setPair(P.swapPeople(s)); render(ctx); ctx.toast('人物AとBの設定を入れ替えました'); }
    if (action === 'home') { ctx.goStart(); }
    if (action === 'to-output') { var el = document.getElementById('pairOutput'); if (el) el.scrollIntoView({ block: 'start' }); }
    if (action === 'save') ctx.openSave('pair');
    if (action === 'reset') { if (global.confirm('二人用の選択内容をリセットしますか？')) { ui.picking = false; ui.query = ''; ui.family = 'all'; ctx.setPair(P.initial(), true); render(ctx); global.scrollTo(0, 0); } }
    return true;
  }
  function input(event, ctx) {
    if (ctx.view.screen !== 'pair') return false;
    var t = event.target;
    if (t.matches('[data-pair-search]')) { ui.query = t.value; updatePoseList(ctx); return true; }
    if (t.matches('[data-pair-note]')) {
      ctx.setPair(P.set(ctx.getPair(), 'notes.' + t.dataset.pairNote, t.value));
      // 入力中のフォーカスを保つため、出力欄と要約だけ更新する
      var s = ctx.getPair(), prefs = ctx.getPrefs(), out = P.render(s, M.pairTarget(prefs), prefs);
      ['text', 'base', 'a', 'b'].forEach(function (k) { var el = document.getElementById('pairOut_' + k); if (el) el.textContent = out[k] || ''; });
      renderSticky(ctx);
      return true;
    }
    return false;
  }
  function toggle(event) {
    var el = event.target;
    if (!el.matches || !el.matches('details[data-fold]')) return;
    var key = { scene: 'openScene', notes: 'openNotes', opts: 'openOpts', ja: 'showJa' }[el.dataset.fold];
    if (key) ui[key] = el.open;
  }
  function openWithPose(ctx, poseId) {
    if (poseId) { var res = P.selectPose(ctx.getPair(), poseId); ctx.setPair(res.state); }
    ui.picking = !ctx.getPair().poseId;
  }

  PCW.pairUI = { render: render, click: click, input: input, toggle: toggle, openWithPose: openWithPose, targetSwitch: targetSwitch, state: ui };
})(window);
