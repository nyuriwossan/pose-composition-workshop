(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var G = PCW.generator;

  // 出力先（モデル系統）と、その共通ルール。
  // generic は従来の3形式（構造化・詳細英文・日本語構造）をそのまま使う。
  var TARGETS = [
    { id: 'generic', labelJa: '汎用', shortJa: '汎用', noteJa: '従来の構造化・詳細英文・日本語構造', single: true, pair: false },
    { id: 'tsubaki', labelJa: 'PIXAI Tsubaki', shortJa: 'Tsubaki', noteJa: 'Tsubaki.2／3向けの自然文', single: true, pair: true },
    { id: 'sdxl', labelJa: 'PIXAI SDXL', shortJa: 'SDXL', noteJa: '短い英語タグ', single: true, pair: true },
    { id: 'nai', labelJa: 'NovelAI', shortJa: 'NovelAI', noteJa: 'NAI V5中心のタグ・Character Prompts', single: true, pair: true }
  ];
  var DEFAULT_PREFS = { outputTarget: 'generic', emphasis: false, naiEmphasisStyle: 'braces', naiNaturalLanguage: false };
  // PIXAI系（Tsubaki・SDXL）では使わない語。部分一致で判定する（robust なども含めて排除）。
  var PIXAI_FORBIDDEN = /adult|bust/i;
  // PIXAI系の単独ポーズ用語彙。データIDに対する置換表で、生成済み文字列の置換ではない。
  var PIXAI_LEXICON = {
    bust_shot: { compact: 'chest-up framing', detailed: 'Frame the figure from the chest up.' }
  };
  var PIXAI_AGE = {
    tsubaki: { compact: 'grown-up character', detailed: 'The character is a grown-up.' },
    sdxl: { compact: 'grown-up character', detailed: 'The character is a grown-up.' }
  };

  function target(id) { return TARGETS.filter(function (t) { return t.id === id; })[0] || TARGETS[0]; }
  function normalizePrefs(raw) {
    var src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return {
      outputTarget: TARGETS.some(function (t) { return t.id === src.outputTarget; }) ? src.outputTarget : DEFAULT_PREFS.outputTarget,
      emphasis: src.emphasis === true,
      naiEmphasisStyle: src.naiEmphasisStyle === 'numeric' ? 'numeric' : 'braces',
      naiNaturalLanguage: src.naiNaturalLanguage === true
    };
  }
  // 二人用は汎用形式を持たないため、汎用選択中はTsubakiとして扱う（保存値は変えない）。
  function pairTarget(prefs) {
    var id = normalizePrefs(prefs).outputTarget;
    return id === 'generic' ? 'tsubaki' : id;
  }

  function push(list, value) {
    var v = String(value == null ? '' : value).trim();
    if (v && list.indexOf(v) < 0) list.push(v);
  }
  function uniq(values) { var out = []; (values || []).forEach(function (v) { push(out, v); }); return out; }
  // 強調構文。対応する出力先でだけ使い、他の出力先には一切出さない。
  function emphasize(targetId, prefs, parts) {
    var text = uniq(parts).join(', ');
    if (!text) return '';
    var p = normalizePrefs(prefs);
    if (!p.emphasis) return text;
    if (targetId === 'sdxl') return '(' + text + ':1.2)';
    if (targetId === 'nai') return p.naiEmphasisStyle === 'numeric' ? '1.2::' + text + ' ::' : '{{' + text + '}}';
    return text;
  }
  function hasPixaiForbidden(text) { return PIXAI_FORBIDDEN.test(String(text || '')); }
  function syntaxLeaks(targetId, text) {
    var t = String(text || '');
    var sdxl = /\([^()]*:\d+(\.\d+)?\)/.test(t);
    var naiNumeric = /\d+(\.\d+)?::/.test(t);
    var braces = /[{}]/.test(t);
    if (targetId === 'sdxl') return naiNumeric || braces;
    if (targetId === 'nai') return sdxl;
    return sdxl || naiNumeric || braces;
  }

  // 日本語検索：全角半角・大文字小文字・カタカナ/ひらがな・空白の差を吸収する。
  function searchKey(value) {
    var s = String(value == null ? '' : value);
    if (s.normalize) s = s.normalize('NFKC');
    s = s.toLowerCase().replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
    return s.replace(/[\s・、。,.!?！？「」『』（）()]/g, '');
  }
  // ひらがなで入力された語を、データ側の漢字表記へも当てる小さな読み辞書（部分一致で展開）。
  var READINGS = {
    'ひざ': ['膝'], 'うしろ': ['後ろ', '背後'], 'はいご': ['背後'], 'せなか': ['背中'], 'ねころ': ['寝転'], 'ねる': ['寝'],
    'すわ': ['座'], 'たつ': ['立'], 'たち': ['立'], 'だき': ['抱'], 'だく': ['抱'], 'だっこ': ['抱っこ'], 'あおむけ': ['仰向け'],
    'うつぶせ': ['うつ伏せ', '伏せ'], 'よこむき': ['横向き'], 'ふりかえ': ['振り返'], 'みあげ': ['見上げ'], 'みおろ': ['見下ろ'],
    'おおいかぶさ': ['覆いかぶさ'], 'かお': ['顔'], 'あし': ['脚', '足'], 'かたあし': ['片脚', '片足'], 'うで': ['腕'],
    'くび': ['首'], 'かた': ['肩'], 'こし': ['腰'], 'あご': ['顎'], 'いす': ['椅子'], 'ゆか': ['床'], 'かべ': ['壁'],
    'またが': ['跨'], 'うまのり': ['馬乗り'], 'ささえ': ['支え'], 'ひとり': ['一人'], 'ふたり': ['二人'], 'ぜんしん': ['全身'],
    'はんしん': ['半身'], 'じょうはんしん': ['上半身'], 'こうそく': ['拘束'], 'しばる': ['縛'], 'くさり': ['鎖'], 'なわ': ['縄'],
    'こいびと': ['恋人'], 'よつんばい': ['四つん這い', '四点支持'], 'ひざだち': ['膝立ち'], 'どげざ': ['土下座']
  };
  function variants(term) {
    var out = [term];
    Object.keys(READINGS).forEach(function (key) {
      if (term.indexOf(key) < 0) return;
      READINGS[key].forEach(function (alt) { var v = term.replace(key, searchKey(alt)); if (out.indexOf(v) < 0) out.push(v); });
    });
    return out;
  }
  function matchesQuery(query, fields) {
    var terms = String(query || '').split(/[\s　]+/).map(searchKey).filter(Boolean);
    if (!terms.length) return true;
    var hay = (fields || []).map(searchKey).join('|');
    return terms.every(function (term) { return variants(term).some(function (v) { return hay.indexOf(v) >= 0; }); });
  }

  // 一人用の出力先別アダプタ。既存generatorの意味ブロックを使い、出力先ごとに文構造・語彙・強調を変える。
  function single(state, targetId, prefs) {
    var S = PCW.state, s = S.normalize(state), p = normalizePrefs(prefs);
    var id = target(targetId).id, notes = [];
    if (id === 'generic') return { target: id, text: G.compact(s), negative: G.negative(s), notes: notes };
    var custom = s.output.customText;
    var pixai = id === 'tsubaki' || id === 'sdxl';
    if (pixai && hasPixaiForbidden(custom)) notes.push({ severity: 'warning', textJa: '自由入力に adult／bust を含む語があります。自由入力は原文のまま出力します。' });
    if (id === 'tsubaki') {
      var opts = { lexicon: PIXAI_LEXICON, ageTerm: PIXAI_AGE.tsubaki };
      if (s.output.includeNegativePrompt) notes.push({ severity: 'info', textJa: 'Tsubakiではカスタムネガティブプロンプトを標準出力しません。' });
      if (p.emphasis) notes.push({ severity: 'info', textJa: 'Tsubakiは自然文のため、強調構文を使いません。' });
      return { target: id, text: G.detailed(s, opts), negative: '', notes: notes };
    }
    var tagOpts = id === 'sdxl' ? { lexicon: PIXAI_LEXICON, ageTerm: PIXAI_AGE.sdxl, tagSubject: true } : { tagSubject: true };
    var layers = G.compactLayers(s, tagOpts);
    var main = layers.main || [];
    var ordered = [];
    var mainPlaced = false;
    layers.semantic.concat(layers.modifiers, layers.stability).forEach(function (part) {
      if (main.indexOf(part) >= 0) {
        if (!mainPlaced) { ordered.push(emphasize(id, p, main)); mainPlaced = true; }
        return;
      }
      if (ordered.indexOf(part) < 0) ordered.push(part);
    });
    var text = ordered.filter(Boolean).join(', ');
    if (custom) text += (text ? ', ' : '') + custom;
    return { target: id, text: text, negative: G.negative(s), notes: notes };
  }

  PCW.modelOutput = {
    targets: TARGETS,
    target: target,
    defaultPrefs: function () { return normalizePrefs({}); },
    normalizePrefs: normalizePrefs,
    pairTarget: pairTarget,
    emphasize: emphasize,
    uniq: uniq,
    push: push,
    hasPixaiForbidden: hasPixaiForbidden,
    syntaxLeaks: syntaxLeaks,
    searchKey: searchKey,
    matchesQuery: matchesQuery,
    single: single,
    pixaiLexicon: PIXAI_LEXICON
  };
})(window);
