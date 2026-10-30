(function (global) {
  'use strict';
  var PCW = global.PCW;
  var D = PCW.data, P = PCW.pair, M = PCW.modelOutput;

  // 二人用ポーズ画面。状態・保存・コピーは app.js から渡される ctx 経由で扱う。
  var ui = { query: '', family: 'all', picking: false, showJa: false, personOpen: {}, exprOpen: {}, exprQuery: {} };
  var Store = PCW.storage;
  var PERSON_HINT = 'すでに作成した外見・服装プロンプトを貼り付けてください。選択したポーズと自動で組み合わせます。';

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
    var fam = (D.pairPoseCategories || {})[p.category] || D.presetPoseFamilyLabels[p.poseFamily] || '';
    return '<button type="button" class="pair-pose-card" data-pair-pose="' + ctx.attr(p.id) + '" aria-pressed="' + selected + '"><strong>' + ctx.esc(p.labelJa) + '</strong><small>' + ctx.esc(p.shortJa) + '</small><span class="preset-tags"><span class="preset-tag">二人</span><span class="preset-tag">' + ctx.esc(fam) + '</span>' + (p.sourceId ? '<span class="preset-tag">' + ctx.esc(p.sourceId) + '</span>' : '') + '</span></button>';
  }
  function poseListHtml(ctx, selectedId) {
    var list = P.filterPoses(ui.query, ui.family);
    return list.length ? list.map(function (p) { return poseCard(ctx, p, p.id === selectedId); }).join('') : '<p class="preset-empty">該当するポーズはありません。言葉を短くするか、系統の絞り込みを外してください。</p>';
  }
  // 二人用はカテゴリ（抱擁・密着 など）で絞り込む
  function familyFilters(ctx) {
    var counts = P.categoryCounts(ui.query), cats = D.pairPoseCategories || {};
    var fams = ['all'].concat(Object.keys(cats));
    return fams.map(function (id) {
      var label = id === 'all' ? 'すべて' : cats[id];
      return '<button type="button" data-pair-family="' + id + '" aria-pressed="' + (ui.family === id) + '">' + ctx.esc(label) + ' <b>' + (counts[id] || 0) + '</b></button>';
    }).join('');
  }

  // プリクラ二人用だけ：元の候補ID・最小画角・簡易版への切り替え（人物A・Bの入力は保持される）
  function purikuraNote(ctx, p) {
    if (!p.sourceId) return '';
    var f = p.fallback, alt = f && f.to ? P.poseById(f.to) : null;
    return '<div class="pair-source"><small>元の候補 ' + ctx.esc(p.sourceId) + (p.minNoteJa ? '／最小画角：' + ctx.esc(p.minNoteJa) : '') + '</small>' +
      (f ? '<div class="pair-fallback"><p>崩れやすいとき：' + ctx.esc(f.noteJa) + '</p>' + (alt ? '<div class="chip-grid"><button type="button" class="chip" data-pair-pose="' + ctx.attr(alt.id) + '" aria-pressed="false">簡易版「' + ctx.esc(alt.labelJa) + '」に切り替える</button></div>' : '') + '</div>' : '') + '</div>';
  }
  function picker(ctx, s) {
    var p = P.poseById(s.poseId);
    if (p && !ui.picking) {
      return '<section class="design-card pair-selected"><div class="card-head"><div><small class="mini-label">選択中のポーズ</small><h2>' + ctx.esc(p.labelJa) + '</h2><p>' + ctx.esc(p.shortJa) + '</p></div><button type="button" class="btn btn--nowrap" data-pair-action="pick">変更</button></div>' + purikuraNote(ctx, p) + '</section>';
    }
    return '<section class="design-card"><div class="card-head"><div><h2>ポーズを選ぶ</h2><p>日本語で検索できます（例：膝、バックハグ、壁、お姫様抱っこ、あーん、お風呂）。</p></div><span class="count-pill">' + D.pairPoses.length + '種</span></div>' +
      '<label class="field-label visually-hidden" for="pairSearch">ポーズを検索</label><input id="pairSearch" type="search" data-pair-search placeholder="ポーズを検索" value="' + ctx.attr(ui.query) + '" autocomplete="off">' +
      '<div class="tag-filters pair-family-filters" role="group" aria-label="カテゴリで絞り込み" id="pairFamilyFilters">' + familyFilters(ctx) + '</div>' +
      '<div class="pair-pose-list" id="pairPoseList">' + poseListHtml(ctx, s.poseId) + '</div>' +
      (p ? '<button type="button" class="detail-toggle" data-pair-action="close-pick">選択中のポーズに戻る</button>' : '') +
      (P.hasPersonInput(s) ? '<p class="hint">人物A・Bの入力（外見・服装・表情）は保持しています。ポーズを選ぶと表示されます。</p>' : '') + '</section>';
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
    return '<section class="design-card"><div class="card-head"><div><h2>二人の配置</h2><p>人物ごとの身体の置き方は、上の人物A・B欄に表示しています。</p></div></div>' +
      relationChips(ctx, p) +
      '<div class="subsection"><h3>接触点</h3><ul class="contact-list">' + p.contacts.map(function (c) { return '<li>' + ctx.esc(c.ja) + '</li>'; }).join('') + '</ul></div>' +
      (related.length ? '<div class="subsection"><h3>一人だけを描く近い構図（相手視点）</h3><div class="chip-grid">' + related.map(function (r) { return '<button type="button" class="chip" data-pair-related="' + ctx.attr(r.id) + '">' + ctx.esc(r.nameJa) + '</button>'; }).join('') + '</div></div>' : '') +
      '</section>';
  }
  function genderRow(ctx, s, role) {
    return '<div class="segmented" role="group" aria-label="人物' + role.toUpperCase() + 'の性別"><span class="segmented__label role-badge role-badge--' + role + '">' + role.toUpperCase() + '</span>' + D.pairGenders.map(function (g) {
      return '<button type="button" data-pair-set="people.' + role + '.gender" data-value="' + g.id + '" aria-pressed="' + (s.people[role].gender === g.id) + '">' + ctx.esc(g.labelJa) + '</button>';
    }).join('') + '</div>';
  }
  function whereText(t, slot) {
    if (t === 'nai') return slot.naiLabel + '（' + slot.labelJa + '）の欄で、boy／girl の直後に入ります。';
    if (t === 'sdxl') return '人物A→人物Bの順に、一つのタグ列へ入ります（SDXLは人物を区別できません）。';
    return slot.labelJa + 'の説明文として、ポーズの説明より前に入ります。';
  }
  function personStatus(prompt, person) {
    var t = String(prompt || '').trim(), expr = person ? P.expressionLabel(person) : '';
    var head = !t ? (expr ? '外見は未入力' : '未入力（空欄でも生成できます）') : M.splitTop(t).length + '語・' + t.replace(/\s+/g, ' ').slice(0, 22) + (t.length > 22 ? '…' : '');
    return head + (expr ? '｜表情：' + expr : '');
  }
  // 表情（メイン・視線・補助）。同じ人物の中で両立しない候補は無効にし、理由を出す
  function expressionBlock(ctx, s, slot) {
    var id = slot.id, person = s.people[id], open = !!ui.exprOpen[id], q = ui.exprQuery[id] || '';
    var label = P.expressionLabel(person);
    var rows = (D.pairExpressionSlots || []).map(function (es) {
      var current = person.expression[es.id], blocked = [];
      var visible = P.filterExpressions(es.id, q).map(function (x) { return x.id; });
      var chips = '<button type="button" class="expr-chip" data-expr-set="' + id + '" data-slot="' + es.id + '" data-value="" aria-pressed="' + !current + '">指定なし</button>' +
        D.pairExpressions[es.id].map(function (it) {
          var st = P.expressionState(s, id, es.id, it.id);
          if (!st.ok) blocked.push(it.labelJa + '：' + st.reason);
          return '<button type="button" class="expr-chip" data-expr-set="' + id + '" data-slot="' + es.id + '" data-value="' + it.id + '" aria-pressed="' + (current === it.id) + '" title="' + ctx.attr(it.descJa + (st.ok ? '' : '（' + st.reason + '）')) + '"' + (st.ok ? '' : ' disabled') + (visible.indexOf(it.id) >= 0 ? '' : ' hidden') + '>' + ctx.esc(it.labelJa) + '</button>';
        }).join('');
      return '<div class="expr-row"><h4>' + ctx.esc(es.labelJa) + '</h4><div class="expr-chips" role="group" aria-label="' + ctx.attr(slot.labelJa + 'の' + es.labelJa) + '">' + chips + '</div>' +
        (es.id === 'gaze' ? '<p class="chip-note">選ぶと、' + ctx.esc(slot.labelJa) + 'だけ「場所・視線」の二人の視線より優先します。</p>' : '') +
        (blocked.length ? '<p class="chip-note expr-blocked">選べない候補：' + ctx.esc(blocked.join('／')) + '</p>' : '') + '</div>';
    }).join('');
    return '<details class="expr-fold" data-expr-fold="' + id + '"' + (open ? ' open' : '') + '><summary><strong>表情</strong><small id="exprStatus_' + id + '">' + ctx.esc(label || '未指定') + '</small></summary>' +
      '<div class="expr-body"><label class="field-label visually-hidden" for="exprSearch_' + id + '">' + ctx.esc(slot.labelJa) + 'の表情を検索</label><input id="exprSearch_' + id + '" type="search" data-expr-search="' + id + '" placeholder="表情を検索（例：てれ、見上げる、赤面）" value="' + ctx.attr(q) + '" autocomplete="off">' + rows + '</div></details>';
  }
  function countLine(s) {
    var counts = P.countTags(s);
    return '人数タグ：' + (counts.length ? counts.join(', ') : '性別が決まらないため出力しません（SDXLは two people）');
  }
  function personSets(ctx, slot) {
    var sets = Store.listPersonSets();
    var list = sets.length ? '<ul class="person-set-list">' + sets.map(function (x) {
      return '<li><button type="button" class="btn btn--small-plain" data-person-load="' + ctx.attr(x.id) + '" data-slot="' + slot.id + '">' + ctx.esc(x.name) + '</button><button type="button" class="btn btn--quiet btn--small-plain" data-person-delete="' + ctx.attr(x.id) + '" aria-label="' + ctx.attr(x.name) + 'を削除">削除</button></li>';
    }).join('') + '</ul>' : '<p class="chip-note">まだ保存した人物はありません。</p>';
    return '<details class="person-sets"><summary>保存した人物から読み込む（' + sets.length + '）</summary>' + list + '</details>';
  }
  function personBlock(ctx, s, p, slot) {
    var id = slot.id, person = s.people[id], t = M.pairTarget(ctx.getPrefs());
    var open = ui.personOpen[id] !== false;
    var gender = '<div class="segmented" role="group" aria-label="' + slot.labelJa + 'の性別"><span class="segmented__label">性別</span>' + D.pairGenders.map(function (g) {
      return '<button type="button" data-pair-set="people.' + id + '.gender" data-value="' + g.id + '" aria-pressed="' + (person.gender === g.id) + '">' + ctx.esc(g.labelJa) + '</button>';
    }).join('') + '</div>';
    return '<details class="person-fold person-fold--' + id + '" data-person-fold="' + id + '"' + (open ? ' open' : '') + '><summary><span class="role-badge role-badge--' + id + '">' + id.toUpperCase() + '</span><span class="person-fold__title"><strong>' + ctx.esc(slot.labelJa + '：' + p.roles[id]) + '</strong><small id="personStatus_' + id + '">' + ctx.esc(personStatus(person.prompt, person)) + '</small></span></summary>' +
      '<div class="person-fold__body"><p class="person-placement"><span>このポーズでの' + ctx.esc(slot.labelJa) + '</span>' + ctx.esc(p.placement[id]) + '</p>' + gender +
      '<label class="field-label" for="personPrompt_' + id + '">外見・服装プロンプト</label>' +
      '<textarea id="personPrompt_' + id + '" class="person-prompt" data-person-prompt="' + id + '" rows="4" maxlength="' + M.maxPersonPrompt + '" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="例: short black hair, red eyes, black suit, white shirt">' + ctx.esc(person.prompt) + '</textarea>' +
      '<div class="person-meta"><small id="personCount_' + id + '">' + person.prompt.length + ' / ' + M.maxPersonPrompt + '</small><small class="person-where">' + ctx.esc(whereText(t, slot)) + '</small></div>' +
      expressionBlock(ctx, s, slot) +
      '<div class="person-actions"><button type="button" class="btn btn--quiet" data-person-clear="' + id + '"' + (person.prompt || P.hasExpression(person) ? '' : ' disabled') + '>' + ctx.esc(slot.labelJa) + 'をクリア</button><button type="button" class="btn" data-person-save="' + id + '"' + (person.prompt.trim() ? '' : ' disabled') + '>この人物を保存</button></div>' +
      personSets(ctx, slot) + '</div></details>';
  }
  function people(ctx, s, p) {
    var anyExpr = P.slotsOf(p).some(function (slot) { return P.hasExpression(s.people[slot.id]); });
    return '<section class="design-card person-card" id="pairPeople"><div class="card-head"><div><h2>人物A・B（外見・服装・表情）</h2><p>' + ctx.esc(PERSON_HINT) + '</p></div><button type="button" class="btn btn--quiet btn--nowrap" data-pair-action="swap" aria-label="人物AとBの性別・外見・服装・表情を入れ替える">A⇄B</button></div>' +
      '<p class="chip-note person-roles">Aは動作する側（主導側・支える側）、Bは相手側です。英語タグも文章も、そのまま貼り付けられます。</p>' +
      '<div class="person-tools">' + (p.suggest ? '<button type="button" class="btn" data-pair-action="suggest-expr">このポーズのおすすめ表情</button>' : '') + '<button type="button" class="btn btn--quiet" data-pair-action="reset-expr"' + (anyExpr ? '' : ' disabled') + '>表情だけリセット</button></div>' +
      P.slotsOf(p).map(function (slot) { return personBlock(ctx, s, p, slot); }).join('') +
      '<p class="chip-note" id="pairCountLine">' + ctx.esc(countLine(s)) + '</p></section>';
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
      // optIn の角度（斜め後ろから）は、そのポーズが使える場合だけ表示する（既存ポーズの画面は変えない）
      '<div class="subsection subsection--first"><h3>角度</h3>' + optionChips(ctx, 'camera.angle', D.pairAngles.filter(function (a) { return !a.optIn || p.camera.angles.indexOf(a.id) >= 0; }), s.camera.angle, function (id) { return P.angleState(p, id); }) + '</div>' +
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
    return '<details class="design-card fold"' + (ui.openNotes ? ' open' : '') + ' data-fold="notes"><summary><span><strong>末尾に追加する語（共通・人物A・人物B）</strong><small>' + (filled ? filled + '欄に入力あり' : '未入力') + '</small></span></summary><div class="fold-body"><p class="hint">外見・服装は上の「人物A・B」欄へ。ここに入れた語は加工せず、出力の末尾にそのまま付けます（背景・画風・品質タグなど）。NovelAIでは人物A・Bの語を、それぞれのCharacter Promptの末尾に付けます。</p>' +
      field('common', '共通（背景・画風など）', '例: bedroom, soft lighting') + field('a', '人物Aの末尾', '例: blush') + field('b', '人物Bの末尾', '例: smile') + '</div></details>';
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
  function issuesHtml(ctx, s, t, prefs) {
    return P.issues(s, t, prefs).map(function (i) { return '<p class="output-note output-note--' + i.severity + '">' + ctx.esc(i.textJa) + '</p>'; }).join('');
  }
  function output(ctx, s) {
    var prefs = ctx.getPrefs(), t = M.pairTarget(prefs), out = P.render(s, t, prefs);
    var notesHtml = '<div id="pairIssues">' + issuesHtml(ctx, s, t, prefs) + '</div>';
    var body;
    if (t === 'nai') {
      body = '<div class="nai-block"><div class="nai-head"><strong>共通プロンプト</strong><small>Base Prompt</small>' + copyButton(ctx, 'base', 'コピー', true) + '</div><pre class="output-box output-box--short" id="pairOut_base">' + ctx.esc(out.base) + '</pre></div>' +
        out.characters.map(function (c) {
          return '<div class="nai-block nai-block--' + c.id + '"><div class="nai-head"><span class="role-badge role-badge--' + c.id + '">' + c.id.toUpperCase() + '</span><strong>' + ctx.esc(c.naiLabel + '：' + c.labelJa) + '</strong>' + copyButton(ctx, c.id, 'コピー', true) + '</div><pre class="output-box output-box--short" id="pairOut_' + c.id + '">' + ctx.esc(c.text) + '</pre></div>';
        }).join('') +
        '<div class="sheet-actions"><button type="button" class="btn" data-pair-copy="text">| 区切りでまとめてコピー</button></div>' +
        '<details class="nai-howto"><summary>NovelAIへの貼り方（Character Promptsと | 区切りの使い分け）</summary><ol><li>共通プロンプトを、いつものプロンプト欄へ貼ります。</li><li>Character Promptsの「＋」で欄を二つ作り、上の欄に人物A、下の欄に人物Bを貼ります。</li><li>「| 区切りでまとめてコピー」は、Character Promptsの欄を一つも作らずに、プロンプト欄一つだけで使う形式です。</li></ol><p>Character Promptsの欄が一つでもあると | 区切りは無効になるため、二つの方法は併用しないでください。</p></details>';
    } else {
      body = '<pre class="output-box" id="pairOut_text">' + ctx.esc(out.text) + '</pre><div class="sheet-actions">' + copyButton(ctx, 'text', 'プロンプトをコピー') + '</div>' +
        (t === 'tsubaki' ? '<p class="chip-note">Tsubaki向けにはネガティブプロンプトを出力しません。</p>' : '');
    }
    var ja = '<details class="fold fold--inline"' + (ui.showJa ? ' open' : '') + ' data-fold="ja"><summary><span><strong>日本語で構造を確認</strong></span></summary><pre class="output-box output-box--ja" id="pairOut_ja">' + ctx.esc(P.structureJa(s)) + '</pre></details>';
    return '<section class="design-card" id="pairOutput"><div class="card-head"><div><h2>出力：' + ctx.esc(M.target(t).labelJa) + '</h2><p>選んだ内容と人物A・Bの入力が、リアルタイムで反映されます。</p></div></div>' + notesHtml + body + ja +
      '<div class="sheet-actions pair-actions"><button type="button" class="btn" data-pair-action="save">名前を付けて保存</button><button type="button" class="btn btn--danger" data-pair-action="reset">リセット</button></div></section>';
  }
  // 入力中にフォーカスを失わないよう、画面全体ではなく出力欄・案内・要約だけを書き換える
  function refreshLive(ctx) {
    var s = ctx.getPair(), prefs = ctx.getPrefs(), t = M.pairTarget(prefs), out = P.render(s, t, prefs);
    ['text', 'base'].concat(P.slotsOf(P.poseById(s.poseId)).map(function (x) { return x.id; })).forEach(function (k) {
      var el = document.getElementById('pairOut_' + k); if (el) el.textContent = out[k] || '';
    });
    var ja = document.getElementById('pairOut_ja'); if (ja) ja.textContent = P.structureJa(s);
    var iss = document.getElementById('pairIssues'); if (iss) iss.innerHTML = issuesHtml(ctx, s, t, prefs);
    var cl = document.getElementById('pairCountLine'); if (cl) cl.textContent = countLine(s);
    P.slotsOf(P.poseById(s.poseId)).forEach(function (slot) {
      var prompt = s.people[slot.id].prompt;
      var st = document.getElementById('personStatus_' + slot.id); if (st) st.textContent = personStatus(prompt, s.people[slot.id]);
      var cn = document.getElementById('personCount_' + slot.id); if (cn) cn.textContent = prompt.length + ' / ' + M.maxPersonPrompt;
      var clr = document.querySelector('[data-person-clear="' + slot.id + '"]'); if (clr) clr.disabled = !prompt && !P.hasExpression(s.people[slot.id]);
      var sv = document.querySelector('[data-person-save="' + slot.id + '"]'); if (sv) sv.disabled = !prompt.trim();
    });
    renderSticky(ctx);
  }


  function render(ctx) {
    var s = ctx.getPair(), p = P.poseById(s.poseId);
    ctx.meter.innerHTML = '<span>二人のポーズ</span>';
    var head = '<div class="section-heading"><p class="eyebrow">TWO PEOPLE / POSE</p><h1>二人のポーズ</h1><p>人物A・Bの位置関係と接触点を決め、出力先に合わせた英語へ変換します。成人キャラクター同士を前提にした、非露骨な構図指定です。</p></div>';
    var html = head + targetSwitch(ctx, 'pair') + picker(ctx, s);
    if (p && !ui.picking) html += people(ctx, s, p) + layout(ctx, s, p) + camera(ctx, s, p) + scene(ctx, s, p) + notes(ctx, s) + outputOptions(ctx) + output(ctx, s);
    ctx.main.innerHTML = html;
    // 横スクロールの表情候補は、選択中の候補が見える位置まで送る
    Array.prototype.forEach.call(document.querySelectorAll('.expr-chips'), function (row) {
      var sel = row.querySelector('[aria-pressed="true"]');
      if (sel && sel.dataset.value) row.scrollLeft = Math.max(0, sel.offsetLeft - row.offsetLeft - 8);
    });
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
    if (target.dataset.personClear) {
      var cid = target.dataset.personClear, label = byId(D.pairPersonSlots, cid).labelJa;
      if (!global.confirm(label + 'の外見・服装と表情を消しますか？（性別とポーズは残ります）')) return true;
      ctx.setPair(P.clearPerson(s, cid)); render(ctx); ctx.toast(label + 'の外見・服装と表情を消しました'); return true;
    }
    if (target.dataset.exprSet) {
      if (target.disabled) return true;
      var er = target.dataset.exprSet, eslot = target.dataset.slot, ev = target.dataset.value || null;
      var cur = s.people[er].expression[eslot];
      ctx.setPair(P.set(s, 'people.' + er + '.expression.' + eslot, cur === ev ? null : ev)); render(ctx); ctx.restore(target); return true;
    }
    if (target.dataset.personSave) { ctx.openSave('person:' + target.dataset.personSave); return true; }
    if (target.dataset.personLoad) {
      var set = Store.listPersonSets().filter(function (x) { return x.id === target.dataset.personLoad; })[0], slotId = target.dataset.slot;
      if (!set) return true;
      var slotLabel = byId(D.pairPersonSlots, slotId).labelJa;
      if (s.people[slotId].prompt.trim() && !global.confirm(slotLabel + 'の入力を「' + set.name + '」で置き換えますか？')) return true;
      var loaded = P.set(s, 'people.' + slotId + '.prompt', set.prompt);
      if (set.gender !== 'unspecified') loaded = P.set(loaded, 'people.' + slotId + '.gender', set.gender);
      ctx.setPair(loaded); render(ctx); ctx.toast(slotLabel + 'に「' + set.name + '」を読み込みました'); return true;
    }
    if (target.dataset.personDelete) {
      var del = Store.listPersonSets().filter(function (x) { return x.id === target.dataset.personDelete; })[0];
      if (del && global.confirm('保存した人物「' + del.name + '」を削除しますか？')) { Store.deletePersonSet(del.id); render(ctx); }
      return true;
    }
    var action = target.dataset.pairAction;
    if (!action) return false;
    if (action === 'pick') { ui.picking = true; render(ctx); global.scrollTo(0, 0); }
    if (action === 'close-pick') { ui.picking = false; render(ctx); }
    if (action === 'suggest-expr') {
      var sug = P.applySuggestion(s);
      if (!sug.filled) { ctx.toast('空いている表情の欄がないため、変更しませんでした'); return true; }
      ui.exprOpen.a = true; ui.exprOpen.b = true;
      ctx.setPair(sug.state); render(ctx); ctx.toast('空いていた表情の欄にだけ、おすすめを入れました'); return true;
    }
    if (action === 'reset-expr') { ctx.setPair(P.resetExpressions(s)); render(ctx); ctx.toast('人物A・Bの表情だけを戻しました'); return true; }
    if (action === 'swap') { ctx.setPair(P.swapPeople(s)); render(ctx); ctx.toast('人物AとBの性別・外見・服装・表情を入れ替えました'); }
    if (action === 'home') { ctx.goStart(); }
    if (action === 'to-output') { var el = document.getElementById('pairOutput'); if (el) el.scrollIntoView({ block: 'start' }); }
    if (action === 'save') ctx.openSave('pair');
    if (action === 'reset') {
      // 消える範囲を選んでもらう（人物入力を不用意に消さないため）
      ctx.openSheet('<div class="sheet-head"><div><h2>リセットする範囲</h2><p>どこまで初期状態へ戻すかを選んでください。</p></div><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div>' +
        '<div class="reset-options"><button type="button" class="reset-option" data-pair-action="reset-pose"><strong>ポーズと構図だけ戻す</strong><small>消える：ポーズ・カメラ・場所・二人の視線・服装の設定<br>残る：人物A・Bの性別・外見・服装・表情、末尾に追加する語</small></button>' +
        '<button type="button" class="reset-option reset-option--danger" data-pair-action="reset-all"><strong>すべて消す</strong><small>人物A・Bの性別・外見・服装・表情と、末尾に追加する語も消えます。保存した人物と名前付きの保存は消えません。</small></button>' +
        '<button type="button" class="btn btn--quiet" data-action="close-sheet">キャンセル</button></div>');
    }
    if (action === 'reset-pose') { ctx.closeSheet(); ui.picking = true; ui.query = ''; ui.family = 'all'; ctx.setPair(P.resetPoseOnly(s)); render(ctx); global.scrollTo(0, 0); ctx.toast('ポーズと構図を戻しました。人物A・Bの入力は残っています'); }
    if (action === 'reset-all') { ctx.closeSheet(); ui.picking = false; ui.query = ''; ui.family = 'all'; ctx.setPair(P.initial(), true); render(ctx); global.scrollTo(0, 0); ctx.toast('二人用の入力をすべて消しました'); }
    return true;
  }
  function input(event, ctx) {
    if (ctx.view.screen !== 'pair') return false;
    var t = event.target;
    if (t.matches('[data-pair-search]')) { ui.query = t.value; updatePoseList(ctx); return true; }
    if (t.matches('[data-pair-note]')) { ctx.setPair(P.set(ctx.getPair(), 'notes.' + t.dataset.pairNote, t.value)); refreshLive(ctx); return true; }
    if (t.matches('[data-expr-search]')) {
      var role = t.dataset.exprSearch; ui.exprQuery[role] = t.value;
      (D.pairExpressionSlots || []).forEach(function (es) {
        var ids = P.filterExpressions(es.id, t.value).map(function (x) { return x.id; });
        Array.prototype.forEach.call(document.querySelectorAll('[data-expr-set="' + role + '"][data-slot="' + es.id + '"]'), function (b) { if (b.dataset.value) b.hidden = ids.indexOf(b.dataset.value) < 0; });
      });
      return true;
    }
    if (t.matches('[data-person-prompt]')) { ctx.setPair(P.set(ctx.getPair(), 'people.' + t.dataset.personPrompt + '.prompt', t.value)); refreshLive(ctx); return true; }
    return false;
  }
  function toggle(event) {
    var el = event.target;
    if (el.matches && el.matches('details[data-person-fold]')) { ui.personOpen[el.dataset.personFold] = el.open; return; }
    if (el.matches && el.matches('details[data-expr-fold]')) { ui.exprOpen[el.dataset.exprFold] = el.open; return; }
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
