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
    'こいびと': ['恋人'], 'よつんばい': ['四つん這い', '四点支持'], 'ひざだち': ['膝立ち'], 'どげざ': ['土下座'],
    // 2026-10-28：二人用ポーズ・表情の追加に合わせた読み
    'おひめさま': ['お姫様'], 'ひめ': ['姫'], 'よこだき': ['横抱き'], 'みみ': ['耳'], 'みみもと': ['耳元'], 'ひたい': ['額'], 'むなもと': ['胸元'], 'むね': ['胸'],
    'ほお': ['頬'], 'ひじ': ['肘'], 'そいね': ['添い寝'], 'よりかか': ['寄りかか'], 'よりそ': ['寄り添'], 'ささや': ['囁'], 'ひきよせ': ['引き寄せ'], 'だきよせ': ['抱き寄せ'],
    'だきあ': ['抱き合'], 'だきつ': ['抱きつ'], 'だきあげ': ['抱き上げ'], 'かかえ': ['抱え'], 'てくび': ['手首'], 'もちあげ': ['持ち上げ'], 'ひっぱ': ['引っ張', '引'],
    'みつめ': ['見つめ'], 'てれ': ['照れ'], 'せきめん': ['赤面'], 'むひょうじょう': ['無表情'], 'ほほえみ': ['微笑み'], 'えがお': ['笑顔'], 'おどろ': ['驚'],
    'こまりがお': ['困り顔'], 'せつな': ['切な'], 'よゆう': ['余裕'], 'ちょうはつ': ['挑発'], 'ふしめ': ['伏し目'], 'はんめ': ['半目'], 'よこめ': ['横目'],
    'うるんだ': ['潤んだ'], 'なみだ': ['涙'], 'きんちょう': ['緊張'], 'あまえ': ['甘え'], 'がまん': ['我慢'], 'くちびる': ['唇'], 'いきをのむ': ['息を呑む']
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

  // ---- 利用者が貼り付けた人物プロンプトの解釈（2026-10-28） ----
  // 方針：語は翻訳・削除・言い換えをしない。行うのは、区切りの整理、人数タグの移動、出力先で使えない強調構文の変換だけ。
  // 変換・移動・除外をしたときは必ず notices で利用者へ知らせる。
  var COUNT_TAG = /^(solo|\d+\s?(boys?|girls?|others?)|multiple (boys|girls|others))$/;
  var GENDER_WORDS = { '1boy': 'male', 'boy': 'male', '1girl': 'female', 'girl': 'female' };
  var MAX_PERSON_PROMPT = 4000;

  // 改行と、括弧・強調の外側にあるカンマで区切る。{{a, b}} や 1.2::a, b :: は一つのまとまりとして扱う。
  function splitTop(text) {
    var s = String(text == null ? '' : text), tokens = [], cur = '', depth = 0, numeric = false, i = 0;
    while (i < s.length) {
      var ch = s.charAt(i);
      if (!numeric && depth === 0 && /^\s*$/.test(cur)) {
        var m = /^-?\d+(?:\.\d+)?::/.exec(s.slice(i));
        if (m) { cur += m[0]; i += m[0].length; numeric = true; continue; }
      }
      if (numeric && s.slice(i, i + 2) === '::') { cur += '::'; i += 2; numeric = false; continue; }
      if (ch === '(' || ch === '{' || ch === '[') depth += 1;
      else if (ch === ')' || ch === '}' || ch === ']') depth = Math.max(0, depth - 1);
      else if ((ch === ',' || ch === '\n' || ch === '\r') && depth === 0 && !numeric) { tokens.push(cur); cur = ''; i += 1; continue; }
      cur += ch; i += 1;
    }
    tokens.push(cur);
    return tokens.map(function (t) { return t.replace(/\s*[\r\n]+\s*/g, ' ').trim(); }).filter(Boolean);
  }
  function roundWeight(w) { return String(Math.round(w * 100) / 100); }
  // トークン全体を包む強調を一段だけ外す。kind: numeric / braces / brackets / sdxl / null
  function unwrapOnce(t) {
    var m;
    if ((m = /^(-?\d+(?:\.\d+)?)::([\s\S]*?)\s*(::)?$/.exec(t))) return { kind: 'numeric', inner: m[2].trim(), weight: parseFloat(m[1]) };
    if ((m = /^(\{+)([\s\S]*?)(\}+)$/.exec(t)) && m[1].length === m[3].length) return { kind: 'braces', inner: m[2].trim(), weight: Math.pow(1.05, m[1].length) };
    if ((m = /^(\[+)([\s\S]*?)(\]+)$/.exec(t)) && m[1].length === m[3].length) return { kind: 'brackets', inner: m[2].trim(), weight: Math.pow(1.05, -m[1].length) };
    if ((m = /^\(([^()]+):(\d+(?:\.\d+)?)\)$/.exec(t))) return { kind: 'sdxl', inner: m[1].trim(), weight: parseFloat(m[2]) };
    return { kind: null, inner: t, weight: 1 };
  }
  // 重複・人数タグ判定用の比較キー（表示には使わない）
  function coreOf(token) {
    var t = String(token || '').trim(), guard = 0, u;
    while (guard++ < 6 && (u = unwrapOnce(t)).kind) t = u.inner;
    return t.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stripStray(text) {
    return String(text).replace(/-?\d+(?:\.\d+)?::/g, '').replace(/::/g, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }
  // 出力先に合わせて強調構文を変換する。戻り値 drop=true は負の強調（NovelAI専用の「打ち消し」）で、他モデルでは意味が逆になるため出さない。
  function convertToken(t, targetId) {
    var u = unwrapOnce(t), out = t;
    if (targetId === 'nai') {
      out = t.replace(/\(([^()]+):(\d+(?:\.\d+)?)\)/g, function (_, inner, w) { return w + '::' + inner.trim() + ' ::'; });
      return { text: out, changed: out !== t };
    }
    if (u.kind === 'numeric' && u.weight < 0) return { drop: true };
    if (targetId === 'sdxl') {
      if (u.kind === 'numeric' || u.kind === 'braces' || u.kind === 'brackets') out = '(' + stripStray(u.inner.replace(/[\[\]]/g, '')) + ':' + roundWeight(u.weight) + ')';
      else out = stripStray(t);
      return { text: out, changed: out !== t };
    }
    // tsubaki：自然文なので強調記号を外し、語だけを残す
    out = (u.kind ? u.inner : t).replace(/\(([^()]+):\d+(?:\.\d+)?\)/g, '$1');
    out = stripStray(out).replace(/[\[\]]/g, '').trim();
    return { text: out, changed: out !== t };
  }
  function joinTokens(tokens) {
    return tokens.reduce(function (acc, t) { return acc ? acc + (/[.!?。]$/.test(acc) ? ' ' : ', ') + t : t; }, '');
  }
  // 人物プロンプトを出力先向けに整える。
  function adaptPrompt(text, targetId) {
    var res = { tokens: [], cores: [], text: '', removed: [], inferred: null, genderConflict: false, converted: [], dropped: [], hasPipe: /\|/.test(String(text || '')), raw: String(text || '') };
    var genders = [];
    splitTop(text).forEach(function (tok) {
      var core = coreOf(tok);
      if (GENDER_WORDS[core]) push(genders, GENDER_WORDS[core]);
      if (COUNT_TAG.test(core)) { res.removed.push(tok); return; }
      var conv = convertToken(tok, targetId);
      if (conv.drop) { res.dropped.push(tok); return; }
      if (!conv.text) { res.dropped.push(tok); return; }
      if (conv.changed) res.converted.push(tok + ' → ' + conv.text);
      res.tokens.push(conv.text); res.cores.push(core);
    });
    if (genders.length === 1) res.inferred = genders[0];
    else if (genders.length > 1) res.genderConflict = true;
    res.text = joinTokens(res.tokens);
    return res;
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
    pixaiLexicon: PIXAI_LEXICON,
    splitTop: splitTop,
    coreOf: coreOf,
    adaptPrompt: adaptPrompt,
    joinTokens: joinTokens,
    maxPersonPrompt: MAX_PERSON_PROMPT
  };
})(window);
