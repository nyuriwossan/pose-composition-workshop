(function (global) {
  'use strict';
  var PCW = global.PCW;
  var D = PCW.data, S = PCW.state, A = PCW.advisor, G = PCW.generator, Store = PCW.storage;
  var $ = function (id) { return document.getElementById(id); };
  var main = $('main'), sticky = $('stickySummary'), nav = $('bottomNav'), meter = $('stepMeter');
  var draft = Store.loadDraft();
  var state = draft || S.initial();
  var view = { screen: 'start', step: 1, expanded: {}, outputTab: 'compact', presetFilter: 'all', viewerOnly: false };
  var stepInfo = [
    null,
    { title: '姿勢と動作', copy: '身体を支える基本状態を一つ選びます。' },
    { title: '身体の流れ', copy: '重心、脚、腰、上半身の関係を組み立てます。' },
    { title: '腕と手', copy: '2本の手を、個別または両腕の動作として管理します。' },
    { title: '顔と視線', copy: '顔の向きと、目が見る方向を別々に設定します。' },
    { title: 'カメラと構図', copy: '画角と配置を決め、見えない指定を整理します。' },
    { title: '確認と出力', copy: '警告を解消し、3種類の出力を確認します。' }
  ];

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]; }); }
  function attr(value) { return esc(value); }
  function option(list, id) { return S.option(list, id); }
  function label(list, id) { var item = option(list, id); return item ? item.labelJa : ''; }
  function rememberFocus() {
    var el = document.activeElement;
    return el && el.dataset ? { path: el.dataset.path, id: el.dataset.id, action: el.dataset.action } : null;
  }
  function restoreFocus(key) {
    if (!key) return;
    var el = Array.prototype.slice.call(document.querySelectorAll('button')).filter(function (button) {
      if (key.path && button.dataset.path !== key.path) return false;
      if (key.id && button.dataset.id !== key.id) return false;
      if (key.action && button.dataset.action !== key.action) return false;
      return true;
    })[0];
    if (el) el.focus({ preventScroll: true });
  }
  function commit(next, focusKey) {
    state = S.normalize(next);
    draft = state;
    Store.saveDraft(state);
    render();
    restoreFocus(focusKey);
  }
  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove('is-visible'); }, 1800);
  }
  function currentSummary() {
    var values = [
      label(D.postures, state.pose.posture),
      label(D.weights, state.pose.weight),
      label(D.pelvisOrientations, state.pose.pelvis.orientation),
      state.pose.arms.mode === 'combined' ? label(D.combinedArms, state.pose.arms.combined) : label(D.armActions, state.pose.arms.primary.action),
      label(D.shotSizes, state.camera.shotSize)
    ].filter(Boolean);
    return values.length ? values.join('・') : 'まだ設計されていません';
  }
  function structureStrip() {
    return '<div class="structure-strip"><small>現在の構造</small><p>' + esc(currentSummary()) + '</p></div>';
  }
  function heading(step) {
    return '<div class="section-heading"><p class="eyebrow">STEP ' + step + ' / 6</p><h1>' + esc(stepInfo[step].title) + '</h1><p>' + esc(stepInfo[step].copy) + '</p></div>' + structureStrip();
  }
  function isValid(item) { return S.validForPosture(item, state.pose.posture); }
  function chips(path, list, opts) {
    opts = opts || {};
    var items = list.slice();
    if (opts.basicOnly) items = items.filter(function (x) { return x.group !== 'detail'; });
    if (state.entryMode === 'guided' && opts.postureAware) items = items.filter(isValid);
    var max = state.entryMode === 'detail' || view.expanded[opts.expandKey] ? items.length : (opts.max || 8);
    var shown = items.slice(0, max);
    var value = S.getPath(state, path);
    var html = '<div class="chip-grid">' + shown.map(function (item) {
      var invalid = opts.postureAware && !isValid(item);
      var disabled = state.entryMode === 'detail' && invalid;
      return '<button type="button" class="chip" data-choice="1" data-path="' + attr(path) + '" data-id="' + attr(item.id) + '" aria-pressed="' + (value === item.id) + '"' + (disabled ? ' disabled title="現在の姿勢には適合しません"' : '') + '>' + esc(item.labelJa) + '</button>';
    }).join('') + '</div>';
    if (items.length > shown.length) html += '<button class="detail-toggle" type="button" data-expand="' + attr(opts.expandKey) + '">詳しく調整（あと' + (items.length - shown.length) + '件）</button>';
    if (state.entryMode === 'detail' && opts.postureAware && items.some(function (x) { return !isValid(x); })) html += '<p class="chip-note">取り消し線の候補は現在の姿勢に合いません。</p>';
    return html;
  }
  function card(title, note, body, badge) {
    return '<section class="design-card"><div class="card-head"><div><h2>' + esc(title) + '</h2>' + (note ? '<p>' + esc(note) + '</p>' : '') + '</div>' + (badge ? '<span class="count-pill">' + esc(badge) + '</span>' : '') + '</div>' + body + '</section>';
  }

  function renderStart() {
    meter.innerHTML = '<span>身体とカメラを一緒に設計</span>';
    sticky.hidden = true; nav.hidden = true;
    var resume = draft ? '<div class="resume-card"><p>端末に前回の設計が残っています。</p><div class="resume-actions"><button class="btn btn--primary" data-action="resume">前回の続き</button><button class="btn btn--quiet" data-action="discard-draft">破棄</button></div></div>' : '';
    main.innerHTML = '<section class="hero"><p class="eyebrow">POSE / CAMERA / COMPOSITION</p><h1>身体の動きと<br>カメラ構図を<br>一緒に組み立てる。</h1><p class="hero-copy">タグを並べるのではなく、身体各部の関係を整理。見えない指定や両立しない組み合わせを確認して、画像生成AI向けの英語へ変換します。</p></section><div class="entry-grid">' +
      '<button class="entry-card" data-entry="guided"><span class="entry-number">01</span><span><strong>かんたんに作る</strong><small>質問に沿って、自然な設計を組み立てます</small></span><span class="entry-arrow">›</span></button>' +
      '<button class="entry-card" data-entry="preset"><span class="entry-number">02</span><span><strong>プリセットから作る</strong><small>整合済みの' + D.presets.length + '種類から始めます</small></span><span class="entry-arrow">›</span></button>' +
      '<button class="entry-card" data-entry="detail"><span class="entry-number">03</span><span><strong>細かく設計する</strong><small>身体・視線・構図の各軸を調整します</small></span><span class="entry-arrow">›</span></button>' +
      '</div>' + resume + '<p class="hint">一人用・小道具なし・厳密な左右指定なし。すべて端末内で動作します。</p>';
  }
  function renderStep1() {
    var posture = card('どんな姿勢ですか', '基本姿勢は一つだけ選びます。', chips('pose.posture', D.postures, { basicOnly: state.entryMode !== 'detail', max: 6, expandKey: 'postures' }));
    var motion = card('静止していますか', '具体的な動作状態を選びます。', chips('pose.motion.state', D.motionStates, { max: 7, expandKey: 'motion' }));
    var support = state.entryMode === 'detail' ? card('身体の支え', '支持物の具体名は指定しません。', chips('pose.support.type', D.supportTypes, { max: 5, expandKey: 'support' })) : '';
    main.innerHTML = heading(1) + posture + motion + support;
  }
  function renderStep2() {
    var flows = card('まず雰囲気から', '選んだ内容を、具体的な身体関係へ反映します。', '<div class="chip-grid">' + [
      ['natural', '自然', '力を抜いた基本'], ['confident', '堂々', '胸を開いた安定感'], ['relaxed', '脱力', '肩と重心をゆるめる'], ['twist', 'ひねり', '腰と肩に方向差']
    ].map(function (x) { return '<button class="chip" type="button" data-flow="' + x[0] + '" aria-pressed="false" title="' + x[2] + '">' + x[1] + '</button>'; }).join('') + '</div>');
    var lower = card('重心と脚', '現在の姿勢に合う候補を優先しています.',
      '<div class="subsection"><h3>重心</h3>' + chips('pose.weight', D.weights, { postureAware: true, max: 5, expandKey: 'weights' }) + '</div>' +
      '<div class="subsection"><h3>足幅</h3>' + chips('pose.lowerBody.stance', D.stances, { postureAware: true, max: 4, expandKey: 'stances' }) + '</div>' +
      '<div class="subsection"><h3>脚の関係</h3>' + chips('pose.lowerBody.legRelation', D.legRelations, { postureAware: true, max: 6, expandKey: 'legs' }) + '</div>' +
      '<div class="subsection"><h3>膝</h3>' + chips('pose.lowerBody.knee', D.knees, { postureAware: true, max: 4, expandKey: 'knees' }) + '</div>');
    var upper = card('腰から肩への流れ', '骨盤と上半身は別々の向きとして管理します。',
      '<div class="subsection"><h3>骨盤の向き</h3>' + chips('pose.pelvis.orientation', D.pelvisOrientations, { max: 4, expandKey: 'pelvis' }) + '</div>' +
      '<div class="subsection"><h3>上半身との関係</h3>' + chips('pose.torso.relationToPelvis', D.torsoRelations, { max: 4, expandKey: 'torso' }) + '</div>' +
      '<div class="subsection"><h3>肩</h3>' + chips('pose.shoulders.emphasis', D.shoulders, { max: 6, expandKey: 'shoulders' }) + '</div>' +
      (state.entryMode === 'detail' || view.expanded.bodyDetail ? '<div class="subsection"><h3>腰のずれ</h3>' + chips('pose.pelvis.shift', D.pelvisShifts, { max: 3, expandKey: 'shift' }) + '</div><div class="subsection"><h3>上半身の傾き</h3>' + chips('pose.torso.lean', D.torsoLeans, { max: 4, expandKey: 'lean' }) + '</div>' : '<button class="detail-toggle" type="button" data-expand="bodyDetail">詳しく調整</button>'));
    main.innerHTML = heading(2) + flows + lower + upper;
  }
  function renderStep3() {
    var used = A.handUsage(state);
    var combined = card('両腕を使うポーズ', '選ぶと両方の腕スロットを占有します。', chips('pose.arms.combined', D.combinedArms, { postureAware: true, max: 4, expandKey: 'combined' }), '使用中の手 ' + used + ' / 2');
    var separate = card('片方ずつ決める', '片方の手と、反対の手を別々に設定します。',
      '<div class="subsection"><h3>片方の手</h3>' + chips('pose.arms.primary.action', D.armActions, { postureAware: true, max: 8, expandKey: 'primaryArm' }) + '</div>' +
      '<div class="subsection"><h3>反対の手</h3>' + chips('pose.arms.secondary.action', D.armActions, { postureAware: true, max: 8, expandKey: 'secondaryArm' }) + '</div>');
    main.innerHTML = heading(3) + combined + separate + renderIssues(true);
  }
  function renderStep4() {
    var face = card('顔の向き', 'カメラの高さではなく、顔とカメラの水平関係です。', chips('pose.head.yaw', D.headYaws, { max: 4, expandKey: 'yaw' }) +
      '<div class="subsection"><h3>顎の上下</h3>' + chips('pose.head.pitch', D.headPitches, { max: 3, expandKey: 'pitch' }) + '</div>' +
      '<div class="subsection"><h3>首の傾き</h3>' + chips('pose.head.tilt', D.headTilts, { max: 3, expandKey: 'tilt' }) + '</div>');
    var gaze = card('目が見る方向', '顔を横へ向けながら、目だけこちらを見る指定もできます。', chips('pose.gaze.target', D.gazeTargets, { max: 7, expandKey: 'gazeTarget' }) +
      '<div class="subsection"><h3>視線の性質</h3>' + chips('pose.gaze.direction', D.gazeDirections, { max: 6, expandKey: 'gazeDirection' }) + '</div>' +
      '<div class="subsection"><h3>目の状態</h3>' + chips('pose.gaze.eyes', D.eyeStates, { max: 2, expandKey: 'eyes' }) + '</div>');
    main.innerHTML = heading(4) + face + gaze + renderIssues(true);
  }
  function renderStep5() {
    var camera = card('どこまで写しますか', '画角外になった指定は消さず、出力だけ抑制します。', chips('camera.shotSize', D.shotSizes, { max: 8, expandKey: 'shot' }) +
      '<div class="subsection"><h3>カメラの高さ</h3>' + chips('camera.elevation', D.elevations, { max: 6, expandKey: 'elevation' }) + '</div>' +
      '<div class="subsection"><h3>カメラの傾き</h3>' + chips('camera.roll', D.rolls, { max: 3, expandKey: 'roll' }) + '</div>');
    var interaction = card('画面外の相手', '一人だけを描きながら、画面外にいる相手との距離や動きを設定します。', chips('interaction.target', D.interactionTargets, { max: 2, expandKey: 'interactionTarget' }) +
      (state.interaction.target === 'viewer' ? '<div class="subsection"><h3>相手との距離</h3>' + chips('interaction.distance', D.interactionDistances, { max: 3, expandKey: 'interactionDistance' }) + '</div><div class="subsection"><h3>相手への動き</h3>' + chips('interaction.approach', D.interactionApproaches, { max: 5, expandKey: 'interactionApproach' }) + '</div>' : '<p class="hint">「画面外の相手」を選ぶと、距離と近づき方を設定できます。</p>'));
    var place = state.composition.subjectPlacement;
    var recommendation = { left: '右側', left_of_center: '右側', right: '左側', right_of_center: '左側' }[place];
    var composition = card('画面の中でどう見せますか', '人物配置と余白を別々に保持します。',
      '<div class="subsection"><h3>人物配置</h3>' + chips('composition.subjectPlacement', D.placements, { max: 5, expandKey: 'placement' }) + '</div>' +
      '<div class="subsection"><h3>余白</h3>' + chips('composition.negativeSpace', D.negativeSpaces, { max: 5, expandKey: 'space' }) + (recommendation ? '<p class="hint">この配置では、' + recommendation + 'の余白が候補です。警告カードから適用できます。</p>' : '') + '</div>' +
      '<div class="subsection"><h3>奥行き</h3>' + chips('composition.depth', D.depths, { max: 4, expandKey: 'depth' }) + '</div>' +
      '<div class="subsection"><h3>安定・躍動</h3>' + chips('composition.rhythm', D.rhythms, { max: 3, expandKey: 'rhythm' }) + '</div>' +
      (state.entryMode === 'detail' || view.expanded.compDetail ? '<div class="subsection"><h3>クロップ</h3>' + chips('composition.crop', D.crops, { max: 5, expandKey: 'crop' }) + '</div><div class="subsection"><h3>前景</h3>' + chips('composition.foreground', D.foregrounds, { max: 3, expandKey: 'foreground' }) + '</div>' : '<button class="detail-toggle" type="button" data-expand="compDetail">詳しく調整</button>'));
    main.innerHTML = heading(5) + camera + interaction + composition + renderIssues(true);
  }
  function issueCard(item) {
    var sev = { hard: '成立しない', warning: '崩れやすい', info: '整理のヒント' }[item.severity];
    var actions = item.resolutions.map(function (r, index) { return '<button class="btn" type="button" data-resolution="' + attr(item.id) + '" data-index="' + index + '">' + esc(r.labelJa) + '</button>'; }).join('');
    if (item.severity !== 'hard' && !item.ignored) actions += '<button class="btn btn--quiet" type="button" data-ignore="' + attr(item.id) + '">今回は維持</button>';
    return '<article class="issue-card issue-card--' + item.severity + (item.ignored ? ' is-ignored' : '') + '"><span class="issue-label">' + sev + (item.ignored ? '・確認済み' : '') + '</span><h3>' + esc(item.titleJa) + '</h3><p>' + esc(item.messageJa) + '</p><div class="issue-actions">' + actions + '</div></article>';
  }
  function renderIssues(compactOnly) {
    var issues = A.check(state);
    if (compactOnly) issues = issues.filter(function (x) { return x.severity === 'hard' || x.severity === 'warning'; }).slice(0, 3);
    return issues.length ? card('設計アドバイザー', '値は保持したまま、修正候補を選べます。', '<div class="issue-list">' + issues.map(issueCard).join('') + '</div>') : '';
  }
  function outputText() {
    if (view.outputTab === 'detailed') return G.detailed(state);
    if (view.outputTab === 'structure') return G.structureJa(state);
    return G.compact(state);
  }
  function renderStep6() {
    var complete = A.isComplete(state);
    var banner = '<div class="complete-banner' + (complete ? '' : ' is-incomplete') + '">' + (complete ? '設計完了：出力をコピーできます。' : '未完了：基本姿勢・撮影範囲・hard警告を確認してください。') + '</div>';
    var tabs = '<div class="output-tabs" role="tablist" aria-label="出力形式">' + [
      ['compact', '構造化'], ['detailed', '詳細英文'], ['structure', '日本語構造']
    ].map(function (x) { return '<button class="output-tab" role="tab" type="button" data-output-tab="' + x[0] + '" aria-selected="' + (view.outputTab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var output = card('プロンプト出力', '標準はカンマ区切りの構造化プロンプトです。', tabs + '<pre class="output-box" id="outputBox">' + esc(outputText()) + '</pre><div class="sheet-actions"><button class="btn btn--accent" data-action="copy-output"' + (!outputText() ? ' disabled' : '') + '>この出力をコピー</button><button class="btn" data-action="open-save">名前を付けて保存</button><button class="btn btn--danger" data-action="reset">リセット</button></div>');
    var custom = card('自由入力', '内容を改変せず、出力の末尾へ追加します。', '<label class="field-label" for="customText">追加したい英語</label><textarea id="customText" data-custom placeholder="例: soft fabric movement">' + esc(state.output.customText) + '</textarea>');
    main.innerHTML = heading(6) + banner + renderIssues(false) + output + custom;
  }
  function renderMeter() {
    if (view.screen === 'start') return;
    meter.innerHTML = '<span>' + esc(stepInfo[view.step].title) + '</span><div class="meter-dots" aria-hidden="true">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<i class="meter-dot ' + (i === view.step ? 'is-active' : i < view.step ? 'is-done' : '') + '"></i>'; }).join('') + '</div>';
  }
  function renderSticky() {
    var sum = A.summary(state), total = sum.hard + sum.warning + sum.info;
    sticky.hidden = false;
    sticky.innerHTML = '<div class="summary-row"><div class="summary-copy"><strong>' + esc(currentSummary()) + '</strong><small><span class="warning-count">警告 ' + (sum.hard + sum.warning) + '</span> ・ 情報 ' + sum.info + '</small></div><button class="btn btn--primary" data-action="open-output">出力を見る</button></div>';
  }
  function renderNav() {
    nav.hidden = false;
    nav.innerHTML = '<button class="btn" type="button" data-action="prev-step">' + (view.step === 1 ? 'スタートへ' : '戻る') + '</button><button class="btn btn--primary" type="button" data-action="next-step">' + (view.step === 6 ? '姿勢から見直す' : view.step === 5 ? '確認・出力へ' : '次へ') + '</button>';
  }
  function render() {
    if (view.screen === 'start') { renderStart(); return; }
    renderMeter();
    ({ 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4, 5: renderStep5, 6: renderStep6 })[view.step]();
    renderSticky(); renderNav();
  }

  function openSheet(html) {
    $('sheetContent').innerHTML = html;
    $('sheetBackdrop').hidden = false; $('bottomSheet').hidden = false;
    var close = $('sheetContent').querySelector('[data-action="close-sheet"]');
    if (close) close.focus();
  }
  function closeSheet() { $('sheetBackdrop').hidden = true; $('bottomSheet').hidden = true; $('sheetContent').innerHTML = ''; }
  function presetSheet() {
    var visiblePresets = D.filterPresets(D.presets, view.presetFilter, view.viewerOnly);
    var builtins = visiblePresets.map(function (p) {
      var tags = (p.meta && p.meta.audienceTags || []).map(function (tag) { return D.presetAudienceTagLabels[tag] ? '<span class="preset-tag">' + esc(D.presetAudienceTagLabels[tag]) + '</span>' : ''; }).join('');
      return '<button class="preset-card" type="button" data-load-preset="' + attr(p.id) + '"><strong>' + esc(p.nameJa) + '</strong><small>' + esc(p.descriptionJa) + '</small>' + (tags ? '<span class="preset-tags">' + tags + '</span>' : '') + '</button>';
    }).join('');
    var filters = '<div class="preset-filters" role="group" aria-label="撮影範囲で絞り込み">' + D.renderPresetFramingFilters(view.presetFilter, D.presets) + '</div><div class="preset-filter-tools"><button type="button" class="viewer-only-filter" data-viewer-only="1" aria-pressed="' + view.viewerOnly + '">相手視点のみ</button><span aria-live="polite">' + visiblePresets.length + '件を表示</span></div>';
    var users = Store.listPresets();
    var userHtml = users.length ? '<h3>保存した設計</h3>' + users.map(function (p) { return '<div class="user-preset"><button class="btn" data-load-user="' + attr(p.id) + '">' + esc(p.name) + '</button><button class="btn btn--danger" aria-label="' + esc(p.name) + 'を削除" data-delete-user="' + attr(p.id) + '">削除</button></div>'; }).join('') : '';
    openSheet('<div class="sheet-head"><div><h2>プリセットから開始</h2><p>整合済みの開始地点です。読み込み後も各項目を調整できます。</p></div><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div>' + filters + '<div class="preset-list">' + (builtins || '<p class="preset-empty">該当するプリセットはありません。</p>') + '</div>' + userHtml);
  }
  function saveSheet() {
    openSheet('<div class="sheet-head"><h2>名前を付けて保存</h2><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div><label class="field-label" for="presetName">設計名</label><input id="presetName" type="text" maxlength="60" placeholder="例：斜め向きの立ち姿"><div class="sheet-actions" style="margin-top:12px"><button class="btn btn--primary" data-action="save-user-preset">保存する</button></div>');
    setTimeout(function () { var input = $('presetName'); if (input) input.focus(); }, 0);
  }
  function applyFlow(id) {
    var patch = {
      natural: { 'pose.weight': state.pose.posture === 'standing' ? 'one_leg' : state.pose.weight, 'pose.pelvis.shift': 'slight', 'pose.torso.relationToPelvis': 'aligned', 'pose.shoulders.emphasis': 'relaxed' },
      confident: { 'pose.weight': state.pose.posture === 'standing' ? 'even' : state.pose.weight, 'pose.torso.relationToPelvis': 'aligned', 'pose.shoulders.emphasis': 'drawn_back', 'pose.head.pitch': 'raised' },
      relaxed: { 'pose.weight': state.pose.posture === 'standing' ? 'one_leg' : state.pose.weight, 'pose.shoulders.emphasis': 'relaxed', 'pose.torso.lean': 'neutral', 'pose.head.tilt': 'slight' },
      twist: { 'pose.pelvis.orientation': 'three_quarter', 'pose.torso.relationToPelvis': 'counter', 'pose.shoulders.emphasis': 'one_forward', 'pose.pelvis.shift': 'slight' }
    }[id];
    if (patch) commit(S.applyPatch(state, patch));
  }
  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && global.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('コピーしました'); }, fallback);
    else fallback();
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); area.setSelectionRange(0, area.value.length);
      try { document.execCommand('copy'); toast('コピーしました'); } catch (e) { toast('コピーできませんでした'); }
      document.body.removeChild(area);
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.entry) {
      if (target.dataset.entry === 'preset') { presetSheet(); return; }
      state = S.initial(); state.entryMode = target.dataset.entry;
      view.screen = 'builder'; view.step = 1; commit(state); return;
    }
    if (target.dataset.choice) {
      var focusKey = rememberFocus(), path = target.dataset.path, id = target.dataset.id;
      var current = S.getPath(state, path), value = current === id ? null : id;
      if (path === 'pose.posture') { commit(value ? S.applyPostureDefaults(state, value) : S.applyPatch(state, { 'pose.posture': null }), focusKey); return; }
      var patch = {}; patch[path] = value;
      if (path === 'pose.arms.combined') patch['pose.arms.mode'] = value ? 'combined' : 'separate';
      if (path.indexOf('pose.arms.primary') === 0 || path.indexOf('pose.arms.secondary') === 0) patch['pose.arms.mode'] = 'separate';
      commit(S.applyPatch(state, patch), focusKey); return;
    }
    if (target.dataset.expand) { view.expanded[target.dataset.expand] = true; render(); return; }
    if (target.dataset.presetFilter) { view.presetFilter = target.dataset.presetFilter; presetSheet(); return; }
    if (target.dataset.viewerOnly) { view.viewerOnly = !view.viewerOnly; presetSheet(); return; }
    if (target.dataset.flow) { applyFlow(target.dataset.flow); return; }
    if (target.dataset.outputTab) { view.outputTab = target.dataset.outputTab; render(); return; }
    if (target.dataset.resolution) {
      var found = A.check(state).filter(function (i) { return i.id === target.dataset.resolution; })[0];
      var resolution = found && found.resolutions[Number(target.dataset.index)];
      if (resolution && resolution.patch) { commit(S.applyPatch(state, resolution.patch)); toast('修正を適用しました'); }
      return;
    }
    if (target.dataset.ignore) {
      var ignored = state.meta.ignoredWarnings.slice();
      if (ignored.indexOf(target.dataset.ignore) < 0) ignored.push(target.dataset.ignore);
      commit(S.applyPatch(state, { 'meta.ignoredWarnings': ignored })); return;
    }
    if (target.dataset.loadPreset) {
      var preset = D.presets.filter(function (p) { return p.id === target.dataset.loadPreset; })[0];
      if (preset) { state = S.applyPatch(S.initial(), preset.patch); state.entryMode = 'preset'; draft = state; closeSheet(); view.screen = 'builder'; view.step = 1; commit(state); toast('プリセットを読み込みました'); }
      return;
    }
    if (target.dataset.loadUser) {
      var user = Store.listPresets().filter(function (p) { return p.id === target.dataset.loadUser; })[0];
      if (user) { closeSheet(); view.screen = 'builder'; view.step = 1; commit(user.state); toast('保存した設計を読み込みました'); }
      return;
    }
    if (target.dataset.deleteUser) { Store.deletePreset(target.dataset.deleteUser); presetSheet(); return; }
    var action = target.dataset.action;
    if (!action) return;
    if (action === 'resume') { view.screen = 'builder'; view.step = 1; render(); }
    if (action === 'discard-draft') { Store.clearDraft(); draft = null; state = S.initial(); render(); }
    if (action === 'prev-step') { if (view.step === 1) view.screen = 'start'; else view.step--; render(); global.scrollTo(0, 0); }
    if (action === 'next-step') { view.step = view.step === 6 ? 1 : view.step + 1; render(); global.scrollTo(0, 0); }
    if (action === 'open-output') { view.screen = 'builder'; view.step = 6; render(); global.scrollTo(0, 0); }
    if (action === 'copy-output') copyText(outputText());
    if (action === 'open-save') saveSheet();
    if (action === 'save-user-preset') { var input = $('presetName'); Store.savePreset(input ? input.value : '', state); closeSheet(); toast('端末内に保存しました'); }
    if (action === 'reset') { if (global.confirm('現在の設計をリセットしますか？')) { Store.clearDraft(); draft = null; state = S.initial(); view.screen = 'start'; render(); } }
    if (action === 'close-sheet') closeSheet();
  });
  document.addEventListener('input', function (event) {
    if (event.target.matches('[data-custom]')) {
      state = S.applyPatch(state, { 'output.customText': event.target.value });
      Store.saveDraft(state);
      var box = $('outputBox'); if (box) box.textContent = outputText();
    }
  });
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('homeButton').addEventListener('click', function () { closeSheet(); view.screen = 'start'; render(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !$('bottomSheet').hidden) closeSheet(); });

  PCW.app = { getState: function () { return S.clone(state); }, setState: function (next) { commit(next); }, render: render, openPresets: presetSheet };
  render();
})(window);
