(function (global) {
  'use strict';
  var PCW = global.PCW;
  var D = PCW.data, S = PCW.state, A = PCW.advisor, G = PCW.generator, Store = PCW.storage, M = PCW.modelOutput, P = PCW.pair;
  var $ = function (id) { return document.getElementById(id); };
  var PRESET_DISPLAY_KEY = 'pcw_preset_display_v1';
  var F = PCW.figure;
  var main = $('main'), sticky = $('stickySummary'), nav = $('bottomNav'), meter = $('stepMeter');
  var draft = Store.loadDraft();
  var state = draft || S.initial();
  var view = { screen: 'start', step: 1, expanded: {}, outputTab: 'compact', presetDisplay: loadPresetDisplay(), presetFilter: 'all', collectionFilter: 'all', poseFamilyFilter: 'all', moodFilter: 'all', sceneFilter: 'all', interactionFilter: 'all', viewerOnly: false, countFilter: 'single', presetQuery: '', pairFamilyFilter: 'all', saveKind: 'single' };
  // 一人用プリセットの表示方法（名前で選ぶ／図で選ぶ）。表示だけの設定なので設計データとは別に保存する
  function loadPresetDisplay() {
    try { return global.localStorage.getItem(PRESET_DISPLAY_KEY) === 'figure' ? 'figure' : 'name'; } catch (e) { return 'name'; }
  }
  function savePresetDisplay(value) {
    try { global.localStorage.setItem(PRESET_DISPLAY_KEY, value); } catch (e) { /* 保存できなくても表示は切り替える */ }
  }
  // 出力先などの表示設定（pcw_preferences_v1 の output 欄）と、二人用の下書き（pcw_pair_draft_v1）
  var prefs = Store.loadOutputPrefs();
  var pairDraft = Store.loadPairDraft();
  var pairState = pairDraft || P.initial();
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
    return S.designSummary(state);
  }
  var EDITORIAL_LEGEND = '橙の点線＝肩と骨盤の線、橙の丸＝いちばん手前、橙の矢印＝胸郭の回り込み';
  function editorialLegendNeeded(st) { var m = F && F.compute(st); return !!(m && m.editorial); }
  function editorialPose(id) { return option(D.editorialPoses, id); }
  function editorialShotText(p) {
    var pose = p && p.patch && p.patch.pose && editorialPose(p.patch.pose.editorialPose);
    return pose && pose.id !== 'none' ? '推奨：' + label(D.shotSizes, pose.recommendedShot) + '（' + label(D.shotSizes, pose.minShot) + '以上）' : '';
  }
  function structureStrip() {
    var figure = F && state.pose.posture ? '<div class="strip-figure" aria-hidden="false">' + F.svg(state, { size: 'strip', label: true, ariaLabel: '現在の設計の模式図' }) + '</div>' : '';
    return '<div class="structure-strip' + (figure ? ' structure-strip--figure' : '') + '">' + figure + '<div class="strip-copy"><small>現在の構造</small><p>' + esc(currentSummary()) + '</p>' + (figure ? '<small class="strip-note">図は設計の目安です（点線の枠＝撮影範囲、青い印＝カメラの高さ' + (editorialLegendNeeded(state) ? '、' + EDITORIAL_LEGEND : '') + '）</small>' : '') + '</div></div>';
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
    var pairHasPeople = pairDraft && P.hasPersonInput(pairDraft);
    var pairResume = pairDraft && (pairDraft.poseId || pairHasPeople) ? '<div class="resume-card resume-card--pair"><p>二人用の前回の選択：' + esc(P.summary(pairDraft)) + (pairHasPeople ? '（人物A・Bの入力あり）' : '') + '</p><div class="resume-actions"><button class="btn btn--primary" data-action="resume-pair">二人用の続き</button><button class="btn btn--quiet" data-action="discard-pair-draft">破棄</button></div></div>' : '';
    main.innerHTML = '<section class="hero"><p class="eyebrow">POSE / CAMERA / COMPOSITION</p><h1>身体の動きと<br>カメラ構図を<br>一緒に組み立てる。</h1><p class="hero-copy">タグを並べるのではなく、身体各部の関係を整理。見えない指定や両立しない組み合わせを確認して、画像生成AI向けの英語へ変換します。</p></section><div class="entry-grid">' +
      '<button class="entry-card" data-entry="guided"><span class="entry-number">01</span><span><strong>かんたんに作る</strong><small>質問に沿って、自然な設計を組み立てます</small></span><span class="entry-arrow">›</span></button>' +
      '<button class="entry-card" data-entry="preset"><span class="entry-number">02</span><span><strong>プリセットから作る</strong><small>整合済みの' + D.presets.length + '種類から始めます</small></span><span class="entry-arrow">›</span></button>' +
      '<button class="entry-card" data-entry="detail"><span class="entry-number">03</span><span><strong>細かく設計する</strong><small>身体・視線・構図の各軸を調整します</small></span><span class="entry-arrow">›</span></button>' +
      '<button class="entry-card entry-card--pair" data-entry="pair"><span class="entry-number">04</span><span><strong>二人のポーズを作る</strong><small>人物A・Bの配置と接触点を' + D.pairPoses.length + '種類から指定します</small></span><span class="entry-arrow">›</span></button>' +
      '</div>' + resume + pairResume + '<p class="hint">一人用はViewer基準、二人用は人物A（主導側）・B（相手側）の配置で指定します。厳密な左右指定はしません。すべて端末内で動作します。</p>';
  }
  function renderStep1() {
    var posture = card('どんな姿勢ですか', '基本姿勢は一つだけ選びます。', chips('pose.posture', D.postures, { basicOnly: state.entryMode !== 'detail', max: 6, expandKey: 'postures' }));
    var motion = card('静止していますか', '具体的な動作状態を選びます。', chips('pose.motion.state', D.motionStates, { max: 7, expandKey: 'motion' }));
    var showSupport = state.entryMode === 'detail' || state.pose.posture === 'reclining' || ['none', 'unsupported'].indexOf(state.pose.support.type) < 0 || state.pose.supportPose !== 'none';
    var support = showSupport ? card('身体の支え', 'ソファやベッドを含め、身体を受ける面を設定します。', chips('pose.support.type', D.supportTypes, { max: 8, expandKey: 'support' })) : '';
    var showLying = state.entryMode === 'detail' || state.pose.posture === 'reclining' || state.pose.support.type === 'bed_surface';
    var showSupportPose = state.entryMode === 'detail' || state.pose.supportPose !== 'none' || ['kneeling', 'reclining'].indexOf(state.pose.posture) >= 0 || ['bed_surface', 'sofa_surface', 'leaning_surface'].indexOf(state.pose.support.type) >= 0;
    var supportStructure = showLying || showSupportPose ? card('身体の支持姿勢', '寝る向きと、手・膝で身体を支える方法を別々に調整できます。',
      (showLying ? '<div class="subsection"><h3>寝る向き</h3>' + chips('pose.lyingOrientation', D.lyingOrientations, { max: 4, expandKey: 'lyingOrientation' }) + '</div>' : '') +
      (showSupportPose ? '<div class="subsection"><h3>身体の支え方</h3>' + chips('pose.supportPose', D.supportPoses, { max: 7, expandKey: 'supportPose' }) + '</div>' : '')) : '';
    main.innerHTML = heading(1) + posture + motion + support + supportStructure;
  }
  function renderStep2() {
    var flows = card('まず雰囲気から', '単一選択です。選んだ内容を、具体的な身体関係へ反映します。', '<div class="chip-grid flow-style-chips">' + D.renderFlowStyleChips(state.pose.flowStyle) + '</div>');
    var lower = card('重心と脚', '現在の姿勢に合う候補を優先しています.',
      '<div class="subsection"><h3>重心</h3>' + chips('pose.weight', D.weights, { postureAware: true, max: 5, expandKey: 'weights' }) + '</div>' +
      '<div class="subsection"><h3>足幅</h3>' + chips('pose.lowerBody.stance', D.stances, { postureAware: true, max: 4, expandKey: 'stances' }) + '</div>' +
      '<div class="subsection"><h3>脚の関係</h3>' + chips('pose.lowerBody.legRelation', D.legRelations, { postureAware: true, max: 6, expandKey: 'legs' }) + '</div>' +
      '<div class="subsection"><h3>膝</h3>' + chips('pose.lowerBody.knee', D.knees, { postureAware: true, max: 4, expandKey: 'knees' }) + '</div>');
    var showRearView = state.entryMode === 'detail' || ['away', 'away_camera'].indexOf(state.pose.pelvis.orientation) >= 0 || state.pose.head.yaw === 'over_shoulder';
    var upper = card('腰から肩への流れ', '骨盤と上半身は別々の向きとして管理します。',
      '<div class="subsection"><h3>骨盤の向き</h3>' + chips('pose.pelvis.orientation', D.pelvisOrientations, { max: 4, expandKey: 'pelvis' }) + '</div>' +
      (showRearView ? '<div class="subsection"><h3>背面の見せ方</h3>' + chips('pose.rearViewEmphasis', D.rearViewEmphases, { max: 7, expandKey: 'rearView' }) + '</div>' : '') +
      '<div class="subsection"><h3>上半身との関係</h3>' + chips('pose.torso.relationToPelvis', D.torsoRelations, { max: 4, expandKey: 'torso' }) + '</div>' +
      '<div class="subsection"><h3>肩</h3>' + chips('pose.shoulders.emphasis', D.shoulders, { max: 6, expandKey: 'shoulders' }) + '</div>' +
      (state.entryMode === 'detail' || view.expanded.bodyDetail ? '<div class="subsection"><h3>腰のずれ</h3>' + chips('pose.pelvis.shift', D.pelvisShifts, { max: 3, expandKey: 'shift' }) + '</div><div class="subsection"><h3>上半身の傾き</h3>' + chips('pose.torso.lean', D.torsoLeans, { max: 4, expandKey: 'lean' }) + '</div>' : '<button class="detail-toggle" type="button" data-expand="bodyDetail">詳しく調整</button>'));
    var edPose = editorialPose(state.pose.editorialPose), edActive = edPose && edPose.id !== 'none';
    var edBody = '';
    if (edActive || state.entryMode === 'detail' || view.expanded.editorial) {
      edBody = chips('pose.editorialPose', D.editorialPoses, { max: D.editorialPoses.length, expandKey: 'editorial' });
      if (edActive) edBody += '<p class="editorial-note"><b>' + esc(edPose.labelJa) + '</b>' + esc(edPose.shortJa) + '<br><span>推奨画角：' + esc(label(D.shotSizes, edPose.recommendedShot)) + '（' + esc(label(D.shotSizes, edPose.minShot)) + '以上）。腕を別に指定すると、腕はそちらを優先します。</span></p>';
    } else edBody = '<button class="detail-toggle" type="button" data-expand="editorial">モード系の身体配置を選ぶ</button>';
    var editorial = card('モード系の身体配置（任意）', '胸郭・肩・頭・腕の位置関係をまとめて指定します。画風や衣装は加えません。', edBody);
    main.innerHTML = heading(2) + flows + lower + upper + editorial;
  }
  function renderStep3() {
    var used = A.handUsage(state);
    var combined = card('両腕を使うポーズ', '選ぶと両方の腕スロットを占有します。', chips('pose.arms.combined', D.combinedArms, { postureAware: true, max: 4, expandKey: 'combined' }), '使用中の手 ' + used + ' / 2');
    var separate = card('片方ずつ決める', '片方の手と、反対の手を別々に設定します。',
      '<div class="subsection"><h3>片方の手</h3>' + chips('pose.arms.primary.action', D.armActions, { postureAware: true, max: 8, expandKey: 'primaryArm' }) + '</div>' +
      '<div class="subsection"><h3>反対の手</h3>' + chips('pose.arms.secondary.action', D.armActions, { postureAware: true, max: 8, expandKey: 'secondaryArm' }) + '</div>');
    var restraintActive = state.restraint.type !== 'none';
    var restraintDifficultyLabels = { rope: '安定', cuffs: '中', straps: '中', chain: '難' };
    var selectedDifficulty = restraintDifficultyLabels[state.restraint.type] || '';
    var rearRestraint = state.pose.rearViewEmphasis !== 'none' || ['away', 'away_camera'].indexOf(state.pose.pelvis.orientation) >= 0 || state.pose.head.yaw === 'over_shoulder';
    var difficultRestraint = state.restraint.type === 'chain' && (
      ['wrists_behind', 'one_wrist', 'torso_and_arms'].indexOf(state.restraint.placement) >= 0 ||
      rearRestraint
    );
    var restraintDifficulty = '<div class="restraint-difficulty" role="note" aria-label="拘束具の生成難易度"><strong>生成難易度の目安</strong><span>縄：安定</span><span>手錠：中</span><span>ストラップ：中</span><span>鎖：難</span></div>' +
      (restraintActive ? '<p class="restraint-level' + (difficultRestraint ? ' restraint-level--warning' : '') + '">選択中：' + esc(S.option(D.restraintTypes, state.restraint.type).labelJa) + '・' + esc(selectedDifficulty) + (difficultRestraint ? '　⚠ 手や接続先が見える半身～全身を推奨します。' : '') + '</p>' : '');
    var restraint = card('拘束・固定（任意）', '既存ポーズへ重ねる、成人キャラクター向けの非流血・非損傷演出です。',
      '<p class="restraint-notice">首への拘束、吊り下げ、傷、流血を出力しません。</p>' +
      restraintDifficulty +
      '<div class="subsection"><h3>拘束具</h3>' + chips('restraint.type', D.restraintTypes, { max: 5, expandKey: 'restraintType' }) + '</div>' +
      (restraintActive ? '<div class="subsection"><h3>拘束位置</h3>' + chips('restraint.placement', D.restraintPlacements, { max: 8, expandKey: 'restraintPlacement' }) + '</div>' +
      '<div class="subsection"><h3>固定先</h3>' + chips('restraint.anchor', D.restraintAnchors, { max: 5, expandKey: 'restraintAnchor' }) + '</div>' +
      '<div class="subsection"><h3>固定の状態</h3>' + chips('restraint.tension', D.restraintTensions, { max: 3, expandKey: 'restraintTension' }) + '</div>' +
      (state.restraint.placement === 'one_wrist' ? '<div class="subsection"><h3>自由な腕</h3>' + chips('restraint.freeArm', D.restraintFreeArms, { max: 3, expandKey: 'restraintFreeArm' }) + '</div>' : '') :
      '<p class="hint">「縄」「鎖」「手錠」「ストラップ」を選ぶと、拘束位置と固定先を設定できます。</p>'));
    main.innerHTML = heading(3) + combined + separate + restraint + renderIssues(true);
  }
  function renderExpressionGroups() {
    return D.expressionGroups.map(function (group) {
      var list = D.expressions.filter(function (item) { return item.group === group.id; });
      return '<div class="subsection expression-group"><h3>' + esc(group.labelJa) + '</h3>' + chips('pose.expression', list, { max: 99, expandKey: 'expression-' + group.id }) + '</div>';
    }).join('');
  }
  function renderStep4() {
    var face = card('顔の向き', 'カメラの高さではなく、顔とカメラの水平関係です。', chips('pose.head.yaw', D.headYaws, { max: 4, expandKey: 'yaw' }) +
      '<div class="subsection"><h3>顎の上下</h3>' + chips('pose.head.pitch', D.headPitches, { max: 3, expandKey: 'pitch' }) + '</div>' +
      '<div class="subsection"><h3>首の傾き</h3>' + chips('pose.head.tilt', D.headTilts, { max: 3, expandKey: 'tilt' }) + '</div>');
    var gaze = card('目が見る方向', '顔を横へ向けながら、目だけこちらを見る指定もできます。', chips('pose.gaze.target', D.gazeTargets, { max: 7, expandKey: 'gazeTarget' }) +
      '<div class="subsection"><h3>視線の性質</h3>' + chips('pose.gaze.direction', D.gazeDirections, { max: 6, expandKey: 'gazeDirection' }) + '</div>' +
      '<div class="subsection"><h3>目の状態</h3>' + chips('pose.gaze.eyes', D.eyeStates, { max: 2, expandKey: 'eyes' }) + '</div>');
    var expression = card('表情', 'ポーズとは独立した単一選択です。視線の向きは変更しません。', renderExpressionGroups());
    main.innerHTML = heading(4) + face + gaze + expression + renderIssues(true);
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
  function singleTarget() { return prefs.outputTarget; }
  function outputText() {
    if (singleTarget() !== 'generic') return M.single(state, singleTarget(), prefs).text;
    if (view.outputTab === 'detailed') return G.detailed(state);
    if (view.outputTab === 'structure') return G.structureJa(state);
    return G.compact(state);
  }
  function negativeOutputText() { return singleTarget() === 'tsubaki' ? '' : G.negative(state); }
  function renderStep6() {
    var complete = A.isComplete(state);
    var banner = '<div class="complete-banner' + (complete ? '' : ' is-incomplete') + '">' + (complete ? '設計完了：出力をコピーできます。' : '未完了：基本姿勢・撮影範囲・hard警告を確認してください。') + '</div>';
    var tabs = '<div class="output-tabs" role="tablist" aria-label="出力形式">' + [
      ['compact', '構造化'], ['detailed', '詳細英文'], ['structure', '日本語構造']
    ].map(function (x) { return '<button class="output-tab" role="tab" type="button" data-output-tab="' + x[0] + '" aria-selected="' + (view.outputTab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var tgt = singleTarget(), modelRes = tgt === 'generic' ? null : M.single(state, tgt, prefs);
    var modelNotes = modelRes ? modelRes.notes.map(function (n) { return '<p class="output-note output-note--' + n.severity + '">' + esc(n.textJa) + '</p>'; }).join('') : '';
    var emphasisOpts = tgt === 'sdxl' || tgt === 'nai' ? '<div class="chip-grid model-opts"><button type="button" class="chip" data-pref-toggle-single="emphasis" aria-pressed="' + prefs.emphasis + '">主ポーズを強調する</button>' +
      (tgt === 'nai' ? '<button type="button" class="chip" data-pref-set-single="naiEmphasisStyle" data-value="braces" aria-pressed="' + (prefs.naiEmphasisStyle === 'braces') + '">{{ }}</button><button type="button" class="chip" data-pref-set-single="naiEmphasisStyle" data-value="numeric" aria-pressed="' + (prefs.naiEmphasisStyle === 'numeric') + '">1.2:: ::</button>' : '') + '</div>' : '';
    var outputBody = tgt === 'generic' ? tabs : '<p class="chip-note">' + esc(M.target(tgt).labelJa + '向け：' + M.target(tgt).noteJa) + '。選択内容は出力先を切り替えても保持されます。</p>' + modelNotes + emphasisOpts;
    var output = PCW.pairUI.targetSwitch(uiCtx, 'single') + card('Positive prompt', '必要な姿勢・見え方を肯定形でまとめます。単独でも使える出力です。', outputBody + '<pre class="output-box" id="outputBox">' + esc(outputText()) + '</pre><div class="sheet-actions"><button class="btn btn--accent" data-action="copy-output"' + (!outputText() ? ' disabled' : '') + '>Positiveをコピー</button><button class="btn" data-action="open-save">名前を付けて保存</button><button class="btn btn--danger" data-action="reset">リセット</button></div>');
    var negative = state.output.includeNegativePrompt && tgt === 'tsubaki' ? card('Negative prompt', 'Tsubaki向けには出力しません。', '<p class="hint">Tsubakiではカスタムネガティブプロンプトを標準出力しない設定です。SDXL・NovelAI・汎用へ切り替えると表示されます。</p>') : state.output.includeNegativePrompt ? card('Negative prompt', '補助的な除外語だけを短く分離しています。生成モデルに必要な場合だけ併用してください。', '<pre class="output-box output-box--negative" id="negativeOutputBox">' + esc(negativeOutputText()) + '</pre><div class="sheet-actions"><button class="btn" data-action="copy-negative"' + (!negativeOutputText() ? ' disabled' : '') + '>Negativeをコピー</button></div>') : '';
    var supportOutfitControl = state.pose.supportPose === 'hands_and_knees' && state.output.preserveClothing ? '<button type="button" class="chip" data-output-toggle="supportOutfitAssist" aria-pressed="' + state.output.supportOutfitAssist + '">白T＋黒ショーツで補助</button>' : '';
    var supportOutfitNote = state.pose.supportPose === 'hands_and_knees' ? '<p class="hint">四点支持では「服を保持する」ON時に、服装未指定なら白Tシャツ＋黒のラウンジショーツを補助できます。</p>' : '';
    var equipmentNote = state.output.suppressPhotographyEquipment ? '<p class="hint">一部の生成モデルが視点指定を撮影機材として描く問題を抑えます。</p>' : '';
    var outputAssist = card('出力補助設定', 'Positiveは完成状態の肯定文へ変換します。必要ならNegativeを別欄で追加できます。初期値はOFFです。', '<div class="chip-grid"><button type="button" class="chip" data-output-toggle="includeNegativePrompt" aria-pressed="' + state.output.includeNegativePrompt + '">ネガティブプロンプトを出力する</button><button type="button" class="chip" data-output-toggle="suppressTextSymbols" aria-pressed="' + state.output.suppressTextSymbols + '">文字・記号を抑える</button><button type="button" class="chip" data-output-toggle="suppressPhotographyEquipment" aria-pressed="' + state.output.suppressPhotographyEquipment + '">撮影機材を映さない</button><button type="button" class="chip" data-output-toggle="preserveClothing" aria-pressed="' + state.output.preserveClothing + '">服を保持する</button>' + supportOutfitControl + '</div><p class="hint">Positive内の否定命令はモデルによって逆効果になるため、必要な除外語は任意のNegativeへ分離します。</p>' + equipmentNote + supportOutfitNote);
    var custom = card('自由入力', '内容を改変せず、出力の末尾へ追加します。', '<label class="field-label" for="customText">追加したい英語</label><textarea id="customText" data-custom placeholder="例: soft fabric movement">' + esc(state.output.customText) + '</textarea>');
    main.innerHTML = heading(6) + banner + renderIssues(false) + output + negative + outputAssist + custom;
  }
  function renderMeter() {
    if (view.screen === 'start') return;
    meter.innerHTML = '<span>' + esc(stepInfo[view.step].title) + '</span><div class="meter-dots" aria-hidden="true">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<i class="meter-dot ' + (i === view.step ? 'is-active' : i < view.step ? 'is-done' : '') + '"></i>'; }).join('') + '</div>';
  }
  function renderSticky() {
    var sum = A.summary(state), total = sum.hard + sum.warning + sum.info;
    sticky.hidden = false;
    var preview = outputText();
    sticky.innerHTML = '<div class="summary-row"><div class="summary-copy"><strong>' + esc(currentSummary()) + '</strong><small><span class="warning-count">警告 ' + (sum.hard + sum.warning) + '</span> ・ 情報 ' + sum.info + ' ・ <span class="target-pill">' + esc(M.target(singleTarget()).shortJa) + '</span></small><span class="live-preview live-preview--line">' + esc(preview || '姿勢を選ぶと英語がここに出ます') + '</span></div><div class="summary-actions"><button class="btn" type="button" data-action="copy-output"' + (preview ? '' : ' disabled') + ' aria-label="現在のPositiveをコピー">コピー</button><button class="btn btn--primary" data-action="open-output">出力を見る</button></div></div>';
  }
  function renderNav() {
    nav.hidden = false;
    nav.innerHTML = '<button class="btn" type="button" data-action="prev-step">' + (view.step === 1 ? 'スタートへ' : '戻る') + '</button><button class="btn btn--primary" type="button" data-action="next-step">' + (view.step === 6 ? '姿勢から見直す' : view.step === 5 ? '確認・出力へ' : '次へ') + '</button>';
  }
  function render() {
    if (view.screen === 'start') { renderStart(); return; }
    if (view.screen === 'pair') { PCW.pairUI.render(uiCtx); return; }
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
  // 今の設計がプリセットを読み込んだ直後の状態と同じなら「選択中」とする（読み込み後に変えたら外れる）
  function designKey(st) {
    var n = S.normalize(st);
    delete n.entryMode; delete n.meta;
    return JSON.stringify(n);
  }
  var presetKeyCache = {};
  function presetKey(p) {
    if (!presetKeyCache[p.id]) presetKeyCache[p.id] = designKey(S.applyPatch(S.initial(), p.patch));
    return presetKeyCache[p.id];
  }
  function selectedPresetId() {
    if (!draft || !state.pose.posture) return null;
    var key = designKey(state);
    var hit = D.presets.filter(function (p) { return presetKey(p) === key; })[0];
    return hit ? hit.id : null;
  }
  function figureCardsHtml(list, selectedId) {
    return list.map(function (p) {
      var selected = p.id === selectedId;
      var preview = S.applyPatch(S.initial(), p.patch);
      return '<button class="preset-card preset-card--figure' + (selected ? ' is-selected' : '') + '" type="button" data-load-preset="' + attr(p.id) + '" aria-pressed="' + selected + '">' +
        '<span class="figure-frame">' + F.svg(preview, { size: 'card', label: true, ariaLabel: p.nameJa + 'の模式図' }) + '</span>' +
        '<strong>' + esc(p.nameJa) + '</strong>' + (editorialShotText(p) ? '<small class="preset-shot">' + esc(editorialShotText(p)) + '</small>' : '') + (selected ? '<span class="selected-badge">選択中</span>' : '') + '</button>';
    }).join('');
  }
  function presetCardsHtml(list) {
    var selectedId = selectedPresetId();
    if (view.presetDisplay === 'figure' && F) return figureCardsHtml(list, selectedId);
    return list.map(function (p) {
      var meta = p.meta || {}, cardTags = [];
      if ((meta.audienceTags || []).indexOf('viewer_perspective') >= 0) cardTags.push(D.presetAudienceTagLabels.viewer_perspective);
      if ((meta.moodTags || []).length && D.presetMoodTagLabels[meta.moodTags[0]]) cardTags.push(D.presetMoodTagLabels[meta.moodTags[0]]);
      if ((meta.interactionTags || []).length && D.presetInteractionTagLabels[meta.interactionTags[0]]) cardTags.push(D.presetInteractionTagLabels[meta.interactionTags[0]]);
      if ((meta.sceneTags || []).length && D.presetSceneTagLabels[meta.sceneTags[0]]) cardTags.push(D.presetSceneTagLabels[meta.sceneTags[0]]);
      if (meta.poseFamily && D.presetPoseFamilyLabels[meta.poseFamily]) cardTags.push(D.presetPoseFamilyLabels[meta.poseFamily]);
      var tags = cardTags.slice(0, 3).map(function (tag) { return '<span class="preset-tag">' + esc(tag) + '</span>'; }).join('');
      var selected = p.id === selectedId;
      return '<button class="preset-card' + (selected ? ' is-selected' : '') + '" type="button" data-load-preset="' + attr(p.id) + '" aria-pressed="' + selected + '"><strong>' + esc(p.nameJa) + (selected ? ' <span class="selected-badge">選択中</span>' : '') + '</strong><small>' + esc(p.descriptionJa) + '</small>' + (editorialShotText(p) ? '<small class="preset-shot">' + esc(editorialShotText(p)) + '</small>' : '') + (tags ? '<span class="preset-tags">' + tags + '</span>' : '') + '</button>';
    }).join('');
  }
  function userPresetRow(p) {
    return '<div class="user-preset"><button class="btn" data-load-user="' + attr(p.id) + '">' + (p.kind === 'pair' ? '<span class="preset-tag">二人</span> ' : '') + esc(p.name) + '</button><button class="btn btn--danger" aria-label="' + esc(p.name) + 'を削除" data-delete-user="' + attr(p.id) + '">削除</button></div>';
  }
  function presetSearchFields(p) {
    var meta = p.meta || {}, fields = [p.nameJa, p.descriptionJa, D.presetPoseFamilyLabels[D.inferPresetPoseFamily(p)] || '', (D.presetCollections[meta.collection || 'basic'] || {}).labelJa || '特殊・演出', '一人', '1人'];
    (meta.moodTags || []).forEach(function (t) { fields.push(D.presetMoodTagLabels[t] || ''); });
    (meta.sceneTags || []).forEach(function (t) { fields.push(D.presetSceneTagLabels[t] || ''); });
    (meta.audienceTags || []).forEach(function (t) { fields.push(D.presetAudienceTagLabels[t] || ''); });
    if (meta.collection === 'editorial') fields.push(meta.avId || '', editorialShotText(p), 'モード', 'アヴァンギャルド', 'エディトリアル', 'ハイファッション', '彫刻的', '非対称');
    return fields;
  }
  function visibleSinglePresets() {
    var filterOptions = { collection: view.collectionFilter, poseFamily: view.poseFamilyFilter, mood: view.moodFilter, scene: view.sceneFilter, interaction: view.interactionFilter, viewerOnly: view.viewerOnly };
    return D.filterPresets(D.presets, view.presetFilter, filterOptions).filter(function (p) { return M.matchesQuery(view.presetQuery, presetSearchFields(p)); });
  }
  function pairPresetCards() {
    var list = P.filterPoses(view.presetQuery, view.pairFamilyFilter);
    return list.length ? list.map(function (p) {
      return '<button class="preset-card" type="button" data-load-pair="' + attr(p.id) + '"><strong>' + esc(p.nameJa || p.labelJa) + '</strong><small>' + esc(p.shortJa) + '</small><span class="preset-tags"><span class="preset-tag">二人</span><span class="preset-tag">' + esc(D.pairPoseCategories[p.category] || D.presetPoseFamilyLabels[p.poseFamily] || '') + '</span><span class="preset-tag">A：' + esc(p.roles.a) + '</span></span></button>';
    }).join('') : '<p class="preset-empty">該当するポーズはありません。</p>';
  }
  function countTabs() {
    return '<div class="segmented segmented--wide count-tabs" role="group" aria-label="人数で絞り込み"><button type="button" data-count-filter="single" aria-pressed="' + (view.countFilter === 'single') + '">一人用 <b>' + D.presets.length + '</b></button><button type="button" data-count-filter="pair" aria-pressed="' + (view.countFilter === 'pair') + '">二人用 <b>' + D.pairPoses.length + '</b></button></div>' +
      '<label class="field-label visually-hidden" for="presetSearch">ポーズを検索</label><input id="presetSearch" type="search" data-preset-search autocomplete="off" placeholder="日本語で検索（例：ベッド、振り返る、膝）" value="' + attr(view.presetQuery) + '">';
  }
  function presetSheet() {
    if (view.countFilter === 'pair') {
      var pairCounts = P.categoryCounts('');
      var pairFams = ['all'].concat(Object.keys(D.pairPoseCategories));
      var pairFilters = '<div class="family-filter-block"><small>カテゴリ</small><div class="tag-filters" role="group" aria-label="カテゴリで絞り込み">' + pairFams.map(function (id) { return '<button type="button" data-pair-preset-family="' + id + '" aria-pressed="' + (view.pairFamilyFilter === id) + '">' + esc(id === 'all' ? 'すべて' : D.pairPoseCategories[id]) + ' <b>' + (pairCounts[id] || 0) + '</b></button>'; }).join('') + '</div></div>';
      var pairUsers = Store.listPresets().filter(function (p) { return p.kind === 'pair'; });
      var pairUserHtml = pairUsers.length ? '<h3>保存した二人用の設計</h3>' + pairUsers.map(userPresetRow).join('') : '';
      openSheet('<div class="sheet-head"><div><h2>プリセットから開始</h2><p>二人用は人物A（主導側）・B（相手側）の配置まで整理済みです。</p></div><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div>' + countTabs() + pairFilters + '<div class="preset-list" id="presetList">' + pairPresetCards() + '</div>' + pairUserHtml);
      return;
    }
    var visiblePresets = visibleSinglePresets();
    var builtins = presetCardsHtml(visiblePresets);
    var commonOptions = { collection: view.collectionFilter, mood: view.moodFilter, scene: view.sceneFilter, interaction: view.interactionFilter, viewerOnly: view.viewerOnly };
    var familyScoped = D.filterPresets(D.presets, view.presetFilter, commonOptions);
    var framingOptions = { collection: view.collectionFilter, poseFamily: view.poseFamilyFilter, mood: view.moodFilter, scene: view.sceneFilter, interaction: view.interactionFilter, viewerOnly: view.viewerOnly };
    var framingScoped = D.filterPresets(D.presets, 'all', framingOptions);
    var relationshipFilters = '';
    if (view.collectionFilter === 'relationship') {
      var filterRow = function (title, values, labels, active, dataName) {
        return '<div class="relationship-filter-row"><small>' + esc(title) + '</small><div class="tag-filters" role="group" aria-label="' + esc(title) + 'で絞り込み"><button type="button" data-' + dataName + '="all" aria-pressed="' + (active === 'all') + '">すべて</button>' + values.map(function (id) { return '<button type="button" data-' + dataName + '="' + attr(id) + '" aria-pressed="' + (active === id) + '">' + esc(labels[id]) + '</button>'; }).join('') + '</div></div>';
      };
      relationshipFilters = '<div class="relationship-filters">' + filterRow('雰囲気', Object.keys(D.presetMoodTagLabels), D.presetMoodTagLabels, view.moodFilter, 'mood-filter') + filterRow('シーン', Object.keys(D.presetSceneTagLabels), D.presetSceneTagLabels, view.sceneFilter, 'scene-filter') + filterRow('やりとり', Object.keys(D.presetInteractionTagLabels), D.presetInteractionTagLabels, view.interactionFilter, 'interaction-filter') + '</div>';
    }
    var selected = [];
    if (view.collectionFilter !== 'all') selected.push((D.presetCollections[view.collectionFilter] || {}).labelJa);
    if (view.poseFamilyFilter !== 'all') selected.push(D.presetPoseFamilyLabels[view.poseFamilyFilter]);
    if (view.presetFilter !== 'all') selected.push({ up: 'アップ', half: '半身', full: '全身' }[view.presetFilter]);
    if (view.moodFilter !== 'all') selected.push(D.presetMoodTagLabels[view.moodFilter]);
    if (view.sceneFilter !== 'all') selected.push(D.presetSceneTagLabels[view.sceneFilter]);
    if (view.interactionFilter !== 'all') selected.push(D.presetInteractionTagLabels[view.interactionFilter]);
    var selectedText = selected.length ? selected.join(' × ') : '条件なし';
    var filters = '<div class="collection-filters" role="group" aria-label="プリセット用途カテゴリで絞り込み">' + D.renderPresetCollectionFilters(view.collectionFilter, D.presets) + '</div>' +
      '<div class="family-filter-block"><small>ポーズ系統</small><div class="tag-filters family-filters" role="group" aria-label="ポーズ系統で絞り込み">' + D.renderPresetPoseFamilyFilters(view.poseFamilyFilter, familyScoped) + '</div></div>' +
      '<div class="preset-filters" role="group" aria-label="撮影範囲で絞り込み">' + D.renderPresetFramingFilters(view.presetFilter, framingScoped) + '</div>' + relationshipFilters +
      '<div class="preset-filter-tools"><span aria-live="polite" id="presetCount">' + visiblePresets.length + '件を表示</span><span class="selected-filters">選択中：' + esc(selectedText) + '</span><button type="button" class="btn btn--quiet" data-action="clear-preset-filters"' + (!selected.length ? ' disabled' : '') + '>絞り込み解除</button></div>';
    var users = Store.listPresets().filter(function (p) { return p.kind !== 'pair'; });
    var userHtml = users.length ? '<h3>保存した設計</h3>' + users.map(userPresetRow).join('') : '';
    var displayToggle = '<div class="segmented display-tabs" role="group" aria-label="プリセットの表示方法"><button type="button" data-preset-display="name" aria-pressed="' + (view.presetDisplay !== 'figure') + '">名前で選ぶ</button><button type="button" data-preset-display="figure" aria-pressed="' + (view.presetDisplay === 'figure') + '">図で選ぶ</button></div>';
    var hasEditorial = visiblePresets.some(function (p) { return (p.meta || {}).collection === 'editorial'; });
    var figureNote = view.presetDisplay === 'figure' ? '<p class="figure-note">' + esc(F.note) + ' 点線の枠は撮影範囲、青い印はカメラの高さです。' + (hasEditorial ? esc(EDITORIAL_LEGEND) + '。' : '') + '</p>' : '';
    openSheet('<div class="sheet-head"><div><h2>プリセットから開始</h2><p>整合済みの開始地点です。読み込み後も各項目を調整できます。</p></div><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div>' + countTabs() + displayToggle + filters + figureNote + '<div class="preset-list' + (view.presetDisplay === 'figure' ? ' preset-list--figure' : '') + '" id="presetList">' + (builtins || '<p class="preset-empty">該当するプリセットはありません。</p>') + '</div>' + userHtml);
  }
  function saveSheet(kind) {
    var personSlot = /^person:/.test(kind || '') ? kind.slice(7) : null;
    view.saveKind = personSlot ? kind : kind === 'pair' ? 'pair' : 'single';
    var personLabel = personSlot ? (D.pairPersonSlots.filter(function (x) { return x.id === personSlot; })[0] || {}).labelJa : '';
    var title = personSlot ? personLabel + 'を人物として保存' : '名前を付けて保存';
    var note = personSlot ? '<p class="chip-note">性別と外見・服装プロンプトを保存します。人物A・Bのどちらにも読み込めます（最大' + Store.maxPersonSets + '件）。</p>' : '';
    openSheet('<div class="sheet-head"><h2>' + esc(title) + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="閉じる">×</button></div>' + note + '<label class="field-label" for="presetName">' + (personSlot ? '人物の名前' : '設計名') + '</label><input id="presetName" type="text" maxlength="60" placeholder="' + (personSlot ? '例：黒髪スーツの彼' : '例：斜め向きの立ち姿') + '"><div class="sheet-actions" style="margin-top:12px"><button class="btn btn--primary" data-action="save-user-preset">保存する</button></div>');
    setTimeout(function () { var input = $('presetName'); if (input) input.focus(); }, 0);
  }
  function applyFlow(id) {
    commit(S.applyFlowStyle(state, id), { action: 'flow-' + id });
  }
  function copyText(text, message) {
    if (!text) return;
    var done = message || 'コピーしました';
    if (navigator.clipboard && global.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast(done); }, fallback);
    else fallback();
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); area.setSelectionRange(0, area.value.length);
      try { document.execCommand('copy'); toast(done); } catch (e) { toast('コピーできませんでした'); }
      document.body.removeChild(area);
    }
  }

  function setPrefs(next) { prefs = M.normalizePrefs(next); Store.saveOutputPrefs(prefs); }
  function setPair(next, clear) {
    pairState = P.normalize(next);
    if (clear) { Store.clearPairDraft(); pairDraft = null; }
    else { pairDraft = pairState; Store.savePairDraft(pairState); }
  }
  function openPair(poseId) {
    closeSheet();
    PCW.pairUI.openWithPose(uiCtx, poseId);
    view.screen = 'pair';
    render(); global.scrollTo(0, 0);
  }
  function loadBuiltinPreset(id) {
    var preset = D.presets.filter(function (p) { return p.id === id; })[0];
    if (!preset) return;
    state = S.applyPatch(S.initial(), preset.patch); state.entryMode = 'preset'; draft = state; closeSheet(); view.screen = 'builder'; view.step = 1; commit(state); global.scrollTo(0, 0); toast('プリセットを読み込みました');
  }
  function refocus(el) {
    if (!el || !el.dataset) return;
    var sel = Object.keys(el.dataset).map(function (k) { return '[data-' + k.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }) + '="' + String(el.dataset[k]).replace(/"/g, '\\"') + '"]'; }).join('');
    var next = sel && document.querySelector('button' + sel);
    if (next) next.focus({ preventScroll: true });
  }
  var uiCtx = {
    main: main, sticky: sticky, nav: nav, meter: meter, view: view,
    esc: esc, attr: attr, toast: toast, copyText: copyText, restore: refocus,
    getPair: function () { return pairState; }, setPair: setPair,
    getPrefs: function () { return M.normalizePrefs(prefs); }, setPrefs: setPrefs,
    goStart: function () { view.screen = 'start'; render(); global.scrollTo(0, 0); },
    loadSinglePreset: loadBuiltinPreset,
    openSave: function (kind) { saveSheet(kind); },
    openSheet: function (html) { openSheet(html); },
    closeSheet: function () { closeSheet(); }
  };

  document.addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) return;
    if (PCW.pairUI.click(target, uiCtx)) return;
    if (target.dataset.target) { setPrefs(Object.assign({}, prefs, { outputTarget: target.dataset.target })); render(); refocus(target); return; }
    if (target.dataset.prefToggleSingle) { var tp = Object.assign({}, prefs); tp[target.dataset.prefToggleSingle] = !tp[target.dataset.prefToggleSingle]; setPrefs(tp); render(); refocus(target); return; }
    if (target.dataset.prefSetSingle) { var sp = Object.assign({}, prefs); sp[target.dataset.prefSetSingle] = target.dataset.value; setPrefs(sp); render(); refocus(target); return; }
    if (target.dataset.presetDisplay) {
      view.presetDisplay = target.dataset.presetDisplay === 'figure' ? 'figure' : 'name';
      savePresetDisplay(view.presetDisplay);
      var sheetBody = $('bottomSheet'), keep = sheetBody ? sheetBody.scrollTop : 0;
      presetSheet();
      if (sheetBody) sheetBody.scrollTop = keep;
      refocus(target);
      return;
    }
    if (target.dataset.countFilter) { view.countFilter = target.dataset.countFilter; presetSheet(); return; }
    if (target.dataset.pairPresetFamily) { view.pairFamilyFilter = target.dataset.pairPresetFamily; presetSheet(); return; }
    if (target.dataset.loadPair) { openPair(target.dataset.loadPair); toast('二人用ポーズを読み込みました'); return; }
    if (target.dataset.entry) {
      if (target.dataset.entry === 'preset') { presetSheet(); return; }
      if (target.dataset.entry === 'pair') { openPair(null); return; }
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
    if (target.dataset.collectionFilter) { var reset = D.normalizeRelationshipPresetFilters(target.dataset.collectionFilter, 'all', 'all', 'all'); view.collectionFilter = target.dataset.collectionFilter; view.poseFamilyFilter = 'all'; view.moodFilter = reset.mood; view.sceneFilter = reset.scene; view.interactionFilter = reset.interaction; view.viewerOnly = false; presetSheet(); return; }
    if (target.dataset.poseFamilyFilter) { view.poseFamilyFilter = target.dataset.poseFamilyFilter; presetSheet(); return; }
    if (target.dataset.moodFilter) { view.moodFilter = target.dataset.moodFilter; presetSheet(); return; }
    if (target.dataset.sceneFilter) { view.sceneFilter = target.dataset.sceneFilter; presetSheet(); return; }
    if (target.dataset.interactionFilter) { view.interactionFilter = target.dataset.interactionFilter; presetSheet(); return; }
    if (target.dataset.viewerOnly) { view.viewerOnly = !view.viewerOnly; presetSheet(); return; }
    if (target.dataset.flow) { applyFlow(target.dataset.flow); return; }
    if (target.dataset.outputToggle) {
      var outputPath = 'output.' + target.dataset.outputToggle, outputPatch = {};
      outputPatch[outputPath] = !S.getPath(state, outputPath);
      commit(S.applyPatch(state, outputPatch), rememberFocus()); return;
    }
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
      if (user && user.kind === 'pair') { setPair(user.state); openPair(null); toast('保存した設計を読み込みました'); return; }
      if (user) { closeSheet(); view.screen = 'builder'; view.step = 1; commit(user.state); toast('保存した設計を読み込みました'); }
      return;
    }
    if (target.dataset.deleteUser) { Store.deletePreset(target.dataset.deleteUser); presetSheet(); return; }
    var action = target.dataset.action;
    if (!action) return;
    if (action === 'resume') { view.screen = 'builder'; view.step = 1; render(); }
    if (action === 'resume-pair') { openPair(null); }
    if (action === 'discard-pair-draft') { if (!P.hasPersonInput(pairState) || global.confirm('二人用の選択と、人物A・Bの外見・服装の入力を消しますか？（保存した人物は残ります）')) { setPair(P.initial(), true); render(); } }
    if (action === 'discard-draft') { Store.clearDraft(); draft = null; state = S.initial(); render(); }
    if (action === 'prev-step') { if (view.step === 1) view.screen = 'start'; else view.step--; render(); global.scrollTo(0, 0); }
    if (action === 'next-step') { view.step = view.step === 6 ? 1 : view.step + 1; render(); global.scrollTo(0, 0); }
    if (action === 'open-output') { view.screen = 'builder'; view.step = 6; render(); global.scrollTo(0, 0); }
    if (action === 'copy-output') copyText(outputText());
    if (action === 'copy-negative') copyText(negativeOutputText());
    if (action === 'open-save') saveSheet();
    if (action === 'save-user-preset' && /^person:/.test(view.saveKind)) {
      var pInput = $('presetName'), pid = view.saveKind.slice(7);
      Store.savePersonSet(pInput ? pInput.value : '', pairState.people[pid]); closeSheet(); render(); toast('人物を端末内に保存しました'); return;
    }
    if (action === 'save-user-preset') { var input = $('presetName'); if (view.saveKind === 'pair') Store.savePreset(input ? input.value : '', pairState, undefined, 'pair'); else Store.savePreset(input ? input.value : '', state); closeSheet(); toast('端末内に保存しました'); }
    if (action === 'reset') { if (global.confirm('現在の設計をリセットしますか？')) { Store.clearDraft(); draft = null; state = S.initial(); view.screen = 'start'; render(); } }
    if (action === 'close-sheet') closeSheet();
    if (action === 'clear-preset-filters') { view.presetQuery = ''; view.presetFilter = 'all'; view.collectionFilter = 'all'; view.poseFamilyFilter = 'all'; view.moodFilter = 'all'; view.sceneFilter = 'all'; view.interactionFilter = 'all'; view.viewerOnly = false; presetSheet(); }
  });
  document.addEventListener('input', function (event) {
    if (PCW.pairUI.input(event, uiCtx)) return;
    if (event.target.matches('[data-preset-search]')) {
      view.presetQuery = event.target.value;
      var listEl = $('presetList');
      if (listEl && view.countFilter === 'pair') listEl.innerHTML = pairPresetCards();
      else if (listEl) {
        var found = visibleSinglePresets();
        listEl.innerHTML = presetCardsHtml(found) || '<p class="preset-empty">該当するプリセットはありません。</p>';
        var countEl = $('presetCount'); if (countEl) countEl.textContent = found.length + '件を表示';
      }
      return;
    }
    if (event.target.matches('[data-custom]')) {
      state = S.applyPatch(state, { 'output.customText': event.target.value });
      Store.saveDraft(state);
      var box = $('outputBox'); if (box) box.textContent = outputText();
      var live = sticky.querySelector('.live-preview'); if (live) live.textContent = outputText();
      var negativeBox = $('negativeOutputBox'); if (negativeBox) negativeBox.textContent = negativeOutputText();
    }
  });
  document.addEventListener('toggle', function (event) { PCW.pairUI.toggle(event); }, true);
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('homeButton').addEventListener('click', function () { closeSheet(); view.screen = 'start'; render(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !$('bottomSheet').hidden) closeSheet(); });

  PCW.app = { getState: function () { return S.clone(state); }, setState: function (next) { commit(next); }, render: render, openPresets: presetSheet, getPairState: function () { return P.normalize(pairState); }, getPrefs: function () { return M.normalizePrefs(prefs); }, openPair: openPair };
  render();
})(window);
