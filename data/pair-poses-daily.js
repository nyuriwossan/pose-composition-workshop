(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // 二人用「日常」ポーズ（2026-10-30）。Manus調査の日常カップル26候補（DC-001〜DC-026）を、
  // 既存46件と身体構造（位置関係・接触点・視線・支持点）で照合して採用・統合した22件。
  // 料理・勉強のように、身体配置だけでは場面が別のものに流れるポーズは、場面を決める最小限の小物・行為も
  // 英語に含め、日本語構造に sceneJa として表示する（生成確認の結果、2026-10-30）。
  // 構造は data/pair-poses.js と同じ意味データ。ここで足すカテゴリ・視線・場所・カメラ角度は、
  // 既存46件の allowed に入っていないため、既存ポーズの出力と画面は変わらない。
  // 英語は身体配置・視線・接触・役割・家具との関係だけを書き、性別・年齢・表情・服装・背景・照明・品質の語は入れない。
  // タグは a1111-sd-webui-tagcomplete の danbooru.csv と完全一致したものだけ（D.dailyPairVerifiedTags）。

  // ---- カテゴリ（既存の5分類の後ろに並ぶ） ----
  D.pairPoseCategories.daily_relax = '日常・くつろぎ';
  D.pairPoseCategories.daily_table = '日常・テーブルと台所';
  D.pairPoseCategories.daily_bath = '日常・お風呂';

  // ---- 視線：{focus} はポーズごとの「見る先」（p.focus）に置き換える ----
  // focus:true の視線だけが置き換えの対象。既存の6種は変更しない。
  D.pairGazes.push(
    { id: 'both_focus', focus: true, labelJa: '二人とも{focus}を見る', roles: { a: 'is looking at {focus}', b: 'is looking at {focus}' }, tsubaki: 'Both of them look at {focus}.', sdxl: ['{focus}'], nai: { a: ['{focus}'], b: ['{focus}'] } },
    { id: 'a_focus_b_looks', focus: true, labelJa: 'Aは{focus}を見て、BはAを見る', roles: { a: 'is looking at {focus}', b: 'is looking at {other}' }, tsubaki: '{A} looks at {focus}, while {B} looks at {A}.', sdxl: ['{focus}', 'looking at another'], nai: { a: ['{focus}'], b: ['looking at another'] } },
    { id: 'b_focus_a_looks', focus: true, labelJa: 'AはBを見て、Bは{focus}を見る', roles: { a: 'is looking at {other}', b: 'is looking at {focus}' }, tsubaki: '{A} looks at {B}, while {B} looks at {focus}.', sdxl: ['looking at another', '{focus}'], nai: { a: ['looking at another'], b: ['{focus}'] } },
    { id: 'a_focus_b_closed', focus: true, labelJa: 'Aは{focus}を見て、Bは目を閉じる', roles: { a: 'is looking at {focus}', b: 'has their eyes gently closed' }, tsubaki: '{A} looks at {focus}, while {B} rests with eyes gently closed.', sdxl: ['{focus}', 'closed eyes'], nai: { a: ['{focus}'], b: ['closed eyes'] } }
  );

  // ---- 場所：二人が座る食卓まわり（mode: both_seat で「Both are seated on ＿.」になる） ----
  D.pairSurfaces.push(
    { id: 'dining', labelJa: '椅子とテーブル', en: 'chairs at a table', onTag: 'chair', seatTag: 'on chair' },
    { id: 'low_table', labelJa: '床とローテーブル', en: 'the floor at a low table', onTag: 'on floor', seatTag: 'on floor' },
    { id: 'kotatsu', labelJa: 'こたつ', en: 'the floor with their legs under a kotatsu', onTag: 'kotatsu', seatTag: 'kotatsu' },
    // お風呂（mode: in で「They sit in ＿.」になる）。家庭の湯船は一人分の幅が多いため、横並び・対角は広めの湯船か温泉に限る
    { id: 'home_bath', labelJa: '家庭の湯船', en: 'an ordinary home bathtub', onTag: 'bathtub', seatTag: 'bathtub' },
    { id: 'wide_bath', labelJa: '広めの湯船', en: 'a wide bathtub with room for two side by side', onTag: 'bathtub', seatTag: 'bathtub' },
    { id: 'onsen', labelJa: '温泉・大浴場', en: 'a large hot spring bath', onTag: 'onsen', seatTag: 'onsen' }
  );

  // ---- カメラ：斜め後ろから（optIn：このポーズが angles に含めたときだけ画面に出す） ----
  // 画面を見る二人を後ろから撮る構図は、プリセットを増やさずこの角度で吸収する。
  D.pairAngles.push({ id: 'rear_three_quarter', labelJa: '斜め後ろから', tsubaki: 'The camera views the pair from diagonally behind, looking past their shoulders toward what they face.', tags: ['from behind'], optIn: true });

  var NONE = { mode: 'none', allowed: [], defaultId: null };
  var TABLE = { mode: 'both_seat', allowed: ['dining', 'low_table', 'kotatsu'], defaultId: 'dining' };
  var NO_LOW = '下からでは手元と家具の位置関係が読めません。';
  var NO_TOP = '真上からは顔と視線の向きが読めません。';
  var BATH_SHOTS = { full_body: '湯に浸かっているため、全身の画角は成立しません。', knee_up: '湯に浸かっているため、膝上の画角は成立しません。' };

  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function ex(main, gaze, sub) { return { main: main || null, gaze: gaze || null, sub: sub || null }; }
  function cam(angles, recommended, def, shot, shots, blocked, blockedShots) {
    return { angles: angles, recommended: recommended, defaultAngle: def, defaultShot: shot, shots: shots || ['full_body', 'knee_up', 'upper_body', 'close'], blocked: blocked || { low: NO_LOW, overhead: NO_TOP }, blockedShots: blockedShots || {} };
  }
  function pose(d) {
    return {
      id: d.id, labelJa: d.label, shortJa: d.short, poseFamily: d.family, category: d.category, source: d.source,
      roles: { a: d.roles[0], b: d.roles[1] },
      relation: { vertical: d.rel[0], depth: d.rel[1], facing: d.rel[2] },
      placement: { a: d.place[0], b: d.place[1] },
      contacts: d.contacts.map(function (c) { return { owner: c[0], ja: c[1], tsubaki: c[2] }; }),
      models: {
        tsubaki: { roleEn: { a: d.roleEn[0], b: d.roleEn[1] }, overview: d.ts[0], a: d.ts[1], b: d.ts[2] },
        sdxl: { core: d.sdxl[0], placement: d.sdxl[1] },
        nai: { core: d.nai.core, actions: (d.nai.actions || []).map(function (x) { return { tag: x[0], source: x[1] }; }), a: d.nai.a, b: d.nai.b, nl: d.nai.nl }
      },
      focus: d.focus || null,
      sceneJa: d.sceneJa || null,
      camera: copy(d.camera),
      surface: copy(d.surface || NONE),
      gazes: copy(d.gazes),
      keywords: d.keywords,
      related: d.related || [],
      suggest: d.suggest || null,
      daily: true,
      people: 2,
      collection: 'relationship'
    };
  }

  var daily = [
    // ================= 日常・くつろぎ =================
    pose({
      id: 'pair_daily_shared_book', source: 'DC-001（DC-004を統合）', category: 'daily_relax', family: 'sitting_kneeling',
      label: '一冊の本を一緒に読む', short: '並んで座り、二人の間の一冊を両側から持って、同じページを読む。',
      roles: ['本の片側を持つ側', '本の反対側を持つ側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に座り、胸を少しだけ本の方へ向ける。Bに近い手で本の片側の下端を持ち、もう一方の手は自分の膝に置く。', 'Aの隣に座り、Aに近い手で同じ本の反対側の下端を持つ。もう一方の手は自分の膝に置く。'],
      contacts: [['a', 'Aの片手 → 本の片側の下端', "Person A's inner hand holds one lower corner of the open book"], ['b', 'Bの片手 → 本の反対側の下端', "Person B's inner hand holds the opposite lower corner of the same book"], ['both', '肩と腕 → 少し間を空ける（触れない）', 'a little space remains between their shoulders and arms']],
      roleEn: ['the one holding one side of the book', 'the one holding the other side of the book'],
      ts: ['Person A and Person B sit side by side and read one open book together, held low between them.', 'Person A sits with the chest turned slightly toward the book, the outer hand resting on their own knee.', 'Person B sits beside Person A, the outer hand resting on their own knee.'],
      sdxl: [['side-by-side', 'sitting', 'reading'], ['open book', 'holding book', 'hand on own knee']],
      nai: { core: ['side-by-side', 'sitting', 'reading', 'open book'], a: ['holding book', 'hand on own knee'], b: ['holding book', 'hand on own knee'], nl: 'the two sit side by side, reading one open book held between them' },
      focus: { ja: '本', en: 'the same page of the book', tags: ['looking down'] },
      camera: cam(['three_quarter', 'eye_level', 'high', 'side'], ['three_quarter', 'high'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], { low: NO_LOW, overhead: '真上からは本で顔が隠れます。' }, { close: '本と二人の手が画角外になります。' }),
      surface: { mode: 'both_seat', allowed: ['sofa', 'bed', 'bench', 'floor'], defaultId: 'sofa' },
      gazes: { allowed: ['both_focus', 'a_focus_b_looks', 'mutual', 'both_viewer'], defaultId: 'both_focus' },
      keywords: ['本', '読書', 'どくしょ', '一緒に読む', '読み聞かせ', 'ページ', 'ソファ', 'ベッド', '並んで座る', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_watch_forward', source: 'DC-002（DC-015を統合）', category: 'daily_relax', family: 'sitting_kneeling',
      label: '肩を寄せて同じ画面を見る', short: '並んで深く座り、肩だけを軽く触れ合わせて、同じ前方（映画・テレビなど）を見る。',
      roles: ['肩を寄せる側', '肩を並べる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に深く座り、背もたれに背中を預ける。Bに近い肩だけをBの肩へ軽く寄せ、両手は自分の太ももに置く。', 'Aの隣に深く座り、同じ背もたれに背中を預ける。両手は自分の膝の上に置く。'],
      contacts: [['both', '肩どうし → 軽く触れている（接点はここだけ）', 'only their inner shoulders lightly touch'], ['a', 'Aの両手 → 自分の太もも', "Person A's hands rest on their own thighs"], ['b', 'Bの両手 → 自分の膝の上', "Person B's hands rest in their own lap"], ['both', '背中 → 同じ背もたれ', 'both backs lean against the same backrest']],
      roleEn: ['the one leaning a shoulder in', 'the one sitting shoulder to shoulder'],
      ts: ['Person A and Person B sit side by side, leaning back against the same backrest, facing the same direction.', "Person A sits back with the inner shoulder resting lightly against Person B's shoulder.", 'Person B sits back beside Person A, facing the same way.'],
      sdxl: [['side-by-side', 'sitting', 'shoulder-to-shoulder'], ['leaning back', 'hand on own thigh', 'hands on lap']],
      nai: { core: ['side-by-side', 'sitting', 'shoulder-to-shoulder'], a: ['leaning back', 'hand on own thigh'], b: ['leaning back', 'hands on lap'], nl: 'the two sit side by side with shoulders touching, both watching the same thing ahead of them' },
      focus: { ja: '同じ前方（画面など）', en: 'the same thing ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'rear_three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'rear_three_quarter'], 'three_quarter', 'knee_up'),
      surface: { mode: 'both_seat', allowed: ['sofa', 'bench', 'bed', 'floor'], defaultId: 'sofa' },
      gazes: { allowed: ['both_focus', 'b_focus_a_looks', 'mutual', 'eyes_closed', 'both_viewer'], defaultId: 'both_focus' },
      keywords: ['映画', 'えいが', 'テレビ', '一緒に見る', '画面', '動画', 'ソファ', '並んで座る', '肩', '同じ方向', 'ベンチ', 'くつろぐ', '日常'],
      suggest: { a: ex('slight_smile'), b: ex('gentle_smile') }
    }),
    pose({
      id: 'pair_daily_gaming', source: 'DC-002から派生（両手が手元で埋まる姿勢差）', category: 'daily_relax', family: 'sitting_kneeling',
      label: '並んでゲームをする', short: '並んで座り、それぞれコントローラーを両手で持って同じ画面を見る。Aは前のめり、Bは深く座る。',
      roles: ['前のめりで遊ぶ側', '深く座って遊ぶ側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣で座面の前寄りに座り、上体を少し前へ乗り出す。コントローラーを両手で胸の前に持ち、ひじを軽く曲げる。', 'Aの隣で深く座り、背もたれに背中を預ける。自分のコントローラーを両手で膝の上に持つ。'],
      contacts: [['a', 'Aの両手 → 自分のコントローラー（胸の前）', "Person A holds a game controller in both hands in front of the chest"], ['b', 'Bの両手 → 自分のコントローラー（膝の上）', "Person B holds a second game controller in both hands over their own lap"], ['both', '肩・腕 → 近いが重ならない', 'their shoulders are close while their arms stay apart']],
      roleEn: ['the one leaning forward into the game', 'the one sitting back while playing'],
      ts: ['Person A and Person B sit side by side, each playing a video game with their own controller, both facing the same screen ahead.', 'Person A sits on the front of the seat, leaning forward with elbows slightly bent.', 'Person B sits back against the backrest beside Person A.'],
      sdxl: [['side-by-side', 'sitting', 'playing games', 'holding controller'], ['game controller', 'leaning forward']],
      nai: { core: ['side-by-side', 'sitting', 'playing games'], a: ['holding controller', 'leaning forward'], b: ['holding controller', 'leaning back'], nl: 'the two sit side by side, each holding a game controller and playing the same game on a screen ahead' },
      focus: { ja: '同じ画面', en: 'the same screen ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'rear_three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'rear_three_quarter'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '手元のコントローラーが画角外になります。' }),
      surface: { mode: 'both_seat', allowed: ['sofa', 'floor', 'bed'], defaultId: 'sofa' },
      gazes: { allowed: ['both_focus', 'a_focus_b_looks', 'both_viewer'], defaultId: 'both_focus' },
      keywords: ['ゲーム', 'テレビゲーム', 'コントローラー', '一緒に遊ぶ', '対戦', '画面', 'ソファ', '並んで座る', 'くつろぐ', '日常'],
      suggest: { a: ex('playful_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_head_on_shoulder', source: 'DC-011', category: 'daily_relax', family: 'sitting_kneeling',
      label: '肩に頭を預けて並んで座る', short: '並んで座り、BがAの肩に頭の側面だけを預ける。腕は回さず、手はそれぞれ自分の膝に置く。',
      roles: ['肩を貸す側', '頭を預ける側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に座って上体を前へ向け、Bに近い側の肩でBの頭を受ける。腕はBに回さず、両手は自分の膝に置く。', 'Aの隣に座り、自分の座面と足で体を支えたまま、頭の側面だけをAの肩に預ける。両手は自分の膝に置く。'],
      contacts: [['b', 'Bの頭の側面 → Aの肩（接点はここだけ）', "the side of Person B's head rests on Person A's nearer shoulder"], ['a', 'Aの両手 → 自分の膝の上', "Person A's hands rest in their own lap"], ['b', 'Bの両手 → 自分の膝の上', "Person B's hands rest in their own lap"]],
      roleEn: ['the one lending a shoulder', "the one resting their head on the other's shoulder"],
      ts: ["Person A and Person B sit side by side, and Person B rests the side of their head on Person A's shoulder.", 'Person A sits upright facing forward, arms kept to their own side.', 'Person B supports their own weight on the seat, leaning only the head onto Person A.'],
      sdxl: [['side-by-side', 'sitting', "head on another's shoulder"], ['hands on lap', 'leaning to the side']],
      nai: { core: ['side-by-side', 'sitting'], a: ['hands on lap'], b: ["head on another's shoulder", 'hands on lap', 'leaning to the side'], nl: "the two sit side by side, one resting their head on the other's shoulder while both keep their hands in their own laps" },
      focus: { ja: '前方（画面など）', en: 'the same thing ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'rear_three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up'),
      surface: { mode: 'both_seat', allowed: ['sofa', 'bench', 'bed', 'floor'], defaultId: 'sofa' },
      gazes: { allowed: ['a_focus_b_closed', 'both_focus', 'a_focus_b_looks', 'eyes_closed'], defaultId: 'a_focus_b_closed' },
      keywords: ['肩に頭', 'もたれる', '寄りかかる', 'うとうと', '居眠り', '映画', 'えいが', 'ソファ', '並んで座る', 'ベンチ', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex(null, null, 'affectionate') }
    }),
    pose({
      id: 'pair_daily_sofa_floor', source: 'DC-016（A/Bを入れ替え：肩に手を添える側をAに）', category: 'daily_relax', family: 'sitting_kneeling',
      label: '床とソファで高さを違えて話す', short: 'Bは床に座ってソファの前面にもたれ、Aはそのすぐ後ろの座面に座って、Bの肩に手を添える。',
      roles: ['ソファに座って肩に手を添える側', '床に座ってソファにもたれる側'], rel: ['a_taller', 'b_front', 'side_on'],
      place: ['ソファの座面の端に座り、胴体と膝をBの方へ斜めに向ける。Bに近い手のひらだけをBの肩の外側に軽く添え、もう一方の手は自分の膝に置く。', 'ソファの前の床に座り、上背をソファの前面に預けて片膝を立てる。両手は自分の膝と床に置く。'],
      contacts: [['a', 'Aの片手のひら → Bの肩の外側', "one of Person A's palms rests lightly on the outside of Person B's shoulder"], ['b', 'Bの上背 → ソファの前面', "Person B's upper back leans against the front of the sofa"], ['b', 'Bの腰 → 床', 'Person B sits on the floor']],
      roleEn: ['the one seated on the sofa above', 'the one sitting on the floor against the sofa'],
      ts: ['Person B sits on the floor leaning back against the front of a sofa, and Person A sits on the sofa seat just behind and above Person B.', "Person A sits on the edge of the seat with the torso and knees angled toward Person B, one hand resting lightly on Person B's shoulder.", 'Person B sits on the floor with one knee raised, upper back supported by the sofa.'],
      sdxl: [['sitting', 'on floor', 'couch'], ["hand on another's shoulder", 'knee up']],
      nai: { core: ['couch'], a: ['sitting', 'on couch', "hand on another's shoulder"], b: ['sitting', 'on floor', 'knee up'], nl: 'one person sits on the floor leaning against the front of a sofa while the other sits on the sofa just above them' },
      camera: cam(['three_quarter', 'side', 'eye_level', 'high'], ['side', 'three_quarter'], 'three_quarter', 'full_body', ['full_body', 'knee_up'], { low: '下からでは床に座るBの顔と高低差が読めません。', overhead: '真上からは床と座面の高低差が読めません。' }, { upper_body: '床とソファの高低差が画角外になります。', close: '床とソファの高低差が画角外になります。' }),
      gazes: { allowed: ['mutual', 'back_gazes_front', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['床', 'ソファ', '高低差', '段差', '肩に手', '見上げる', '見下ろす', '話す', 'リビング', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex('slight_smile', 'look_up') }
    }),
    pose({
      id: 'pair_daily_sofa_ends', source: 'DC-017（A/Bを入れ替え：座る側をAに）', category: 'daily_relax', family: 'lying_bed',
      label: 'ソファの両端でくつろぐ', short: 'Bはソファに横になって肘掛けに頭を預け、Aは反対の端に座ってBの方を向く。Bの足先だけがAに触れる。',
      roles: ['反対の端に座る側', '肘掛けに頭を預けて横になる側'], rel: ['a_taller', 'none', 'face_to_face'],
      place: ['ソファの一方の端に座り、胴体をBの方へ斜めに向ける。片手は自分の膝、もう一方の手は座面に置く。', 'ソファの反対の端で、頭を肘掛けに預けて座面に沿って仰向けに横になる。膝を軽く曲げ、足先をAの太ももに軽く当てる。'],
      contacts: [['b', 'Bの頭 → 肘掛け', "Person B's head rests on the armrest"], ['b', 'Bの足先 → Aの太もも（接点はここだけ）', "Person B's feet lightly touch Person A's thigh"], ['a', 'Aの手 → 自分の膝と座面', "Person A's hands rest on their own knee and the seat"]],
      roleEn: ['the one sitting at the far end', 'the one lying back against the armrest'],
      ts: ['Person A and Person B relax on opposite ends of the same sofa: Person B lies along the seat with their head on one armrest, and Person A sits upright at the far end.', 'Person A sits with the torso turned toward Person B, one hand on their own knee.', 'Person B reclines on their back along the seat with knees slightly bent.'],
      sdxl: [['couch', 'lying', 'sitting'], ['on back', 'arm rest']],
      nai: { core: ['couch'], a: ['sitting'], b: ['lying', 'on back', 'arm rest'], nl: 'the two relax on opposite ends of one sofa, one lying with their head on an armrest and the other sitting at the far end' },
      camera: cam(['three_quarter', 'high', 'eye_level', 'side'], ['three_quarter', 'high'], 'three_quarter', 'full_body', ['full_body', 'knee_up'], null, { upper_body: 'ソファの両端と二人の全身が画角外になります。', close: 'ソファの両端と二人の全身が画角外になります。' }),
      gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['ソファ', '両端', '横になる', '寝そべる', 'ごろごろ', '肘掛け', '足', '向かい合う', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex('slight_smile', 'look_up') }
    }),
    pose({
      id: 'pair_daily_bed_headboard', source: 'DC-019（A/Bを入れ替え：相手を見る側をAに）', category: 'daily_relax', family: 'sitting_kneeling',
      label: 'ベッドで背をもたれて並ぶ', short: '同じヘッドボードに背を預け、脚を伸ばして並ぶ。肩だけが触れる。視線は相手・前方（テレビなど）から選べる。',
      roles: ['肩を寄せる側', '肩を並べる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣で上背をヘッドボードに預け、脚を前へ伸ばす。両手は自分の脇の寝具に置く。', 'Aの隣で上背を同じヘッドボードに預け、脚を前へ伸ばす。両手は自分の膝の上に置く。'],
      contacts: [['both', '肩どうし → 軽く触れている（接点はここだけ）', 'only their inner shoulders lightly touch'], ['both', '上背 → 同じヘッドボード', 'both upper backs lean against the same headboard'], ['a', 'Aの両手 → 自分の脇の寝具', "Person A's hands rest on the bedding at their own side"]],
      roleEn: ['the one on one side of the headboard', 'the one on the other side of the headboard'],
      ts: ['Person A and Person B sit side by side in bed, both leaning back against the same headboard with legs stretched out in front.', 'Person A sits with both hands resting on the bedding at their own side.', 'Person B sits beside Person A with hands resting in their own lap.'],
      sdxl: [['side-by-side', 'sitting', 'on bed'], ['headboard', 'leaning back', 'shoulder-to-shoulder']],
      nai: { core: ['side-by-side', 'sitting', 'on bed', 'headboard'], a: ['leaning back'], b: ['leaning back', 'hands on lap'], nl: 'the two sit side by side in bed, leaning back against the same headboard with their shoulders touching' },
      focus: { ja: '前方', en: 'the space ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'eye_level', 'high', 'side'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '手元とヘッドボードが画角外になります。' }),
      gazes: { allowed: ['b_focus_a_looks', 'both_focus', 'mutual', 'eyes_closed'], defaultId: 'b_focus_a_looks' },
      keywords: ['ベッド', 'ヘッドボード', 'もたれる', '並んで座る', '寝る前', '寝室', '肩', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_floor_board', source: 'DC-003', category: 'daily_relax', family: 'sitting_kneeling',
      label: '床で盤面を一緒にのぞき込む', short: '低い盤の同じ側に並んで床に座り、Aが駒を動かし、Bはそばで手元を見守る。',
      roles: ['駒を動かす側', 'そばで見守る側'], rel: ['level', 'none', 'side_by_side'],
      place: ['盤の同じ辺に沿って床に座り、胸を少し盤へ傾ける。盤に近い手で駒を動かし、もう一方の手を床について体を支える。', 'Aの隣で床に座り、胸を少し盤へ傾ける。盤に近い手は盤の脇の床に置き、もう一方の手も床について体を支える。'],
      contacts: [['a', 'Aの片手 → 盤の上の駒', "one of Person A's hands moves a piece on the board"], ['b', 'Bの片手 → 盤の脇の床', "one of Person B's hands rests on the floor beside the board"], ['both', '肩・腕 → 少し間を空ける', 'a little space remains between their shoulders and arms']],
      roleEn: ['the one moving a piece', 'the one watching beside them'],
      ts: ['Person A and Person B sit side by side on the floor along the same side of a low game board, both leaning slightly toward it.', 'Person A moves a piece with one hand, the other hand braced on the floor.', 'Person B rests one hand beside the board, the other hand braced on the floor.'],
      sdxl: [['side-by-side', 'on floor', 'board game'], ['sitting', 'leaning forward', 'arm support']],
      nai: { core: ['side-by-side', 'on floor', 'board game'], a: ['sitting', 'leaning forward', 'arm support'], b: ['sitting', 'arm support'], nl: 'the two sit side by side on the floor at a low game board, one moving a piece while the other watches' },
      focus: { ja: '盤面', en: 'the board', tags: ['looking down'] },
      camera: cam(['high', 'three_quarter', 'eye_level', 'side'], ['high', 'three_quarter'], 'high', 'full_body', ['full_body', 'knee_up', 'upper_body'], { low: '床より下からは盤面と手元が見えません。', overhead: '真上からは顔が隠れ、二人の視線が読めません。' }, { close: '盤面と手元が画角外になります。' }),
      gazes: { allowed: ['both_focus', 'a_focus_b_looks', 'b_focus_a_looks', 'mutual'], defaultId: 'both_focus' },
      keywords: ['盤', 'ボードゲーム', '将棋', 'チェス', 'オセロ', 'パズル', '床', '床座り', '一緒に遊ぶ', 'ゲーム', '日常'],
      suggest: { a: ex('confident_smile'), b: ex('troubled') }
    }),
    pose({
      id: 'pair_daily_phone_show', source: 'DC-024（A/Bを入れ替え：見せる側をAに）', category: 'daily_relax', family: 'standing_leaning',
      label: 'スマホの画面を見せる', short: '椅子に座るBの斜め前に立ったAが、一台のスマートフォンを二人の間へ傾けて見せる。',
      roles: ['立って画面を見せる側', '座って画面をのぞく側'], rel: ['a_taller', 'none', 'side_on'],
      place: ['Bの斜め前に立ち、スマートフォンを一台だけ胸の高さで持って、画面を二人の間へ傾ける。もう一方の手は自分の脇に下ろし、足は前後に開いて立つ。', '椅子に浅く座り、上体を少しだけ画面の方へ寄せる。両手は自分の膝に置く。'],
      contacts: [['a', 'Aの片手 → スマートフォン（二人の間へ傾ける）', "one of Person A's hands holds a single smartphone at chest level, screen tilted between them"], ['b', 'Bの両手 → 自分の膝', "Person B's hands rest on their own knees"], ['both', '体 → 離れている（画面だけを共有）', 'their bodies stay apart, sharing only the screen']],
      roleEn: ['the one standing and showing the phone', 'the one seated and looking at the screen'],
      ts: ['Person B sits on a chair, and Person A stands diagonally beside and slightly in front of Person B, showing Person B the screen of one smartphone.', 'Person A holds the phone at chest level with the free hand relaxed at the side.', 'Person B sits on the front of the seat, leaning the upper body slightly toward the phone.'],
      sdxl: [['holding phone', 'smartphone', 'sitting', 'standing'], ['on chair', 'hands on own knees']],
      nai: { core: ['smartphone'], a: ['standing', 'holding phone'], b: ['sitting', 'on chair', 'hands on own knees'], nl: 'one person stands beside a seated person and shows them a smartphone screen' },
      focus: { ja: 'スマホの画面', en: 'the phone screen', tags: ['looking at phone'] },
      camera: cam(['three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], { low: '下からでは画面の向きが読めません。', overhead: NO_TOP }, { close: 'スマートフォンと持つ手が画角外になります。' }),
      gazes: { allowed: ['both_focus', 'b_focus_a_looks', 'mutual'], defaultId: 'both_focus' },
      keywords: ['スマホ', 'スマートフォン', '携帯', '画面', '見せる', '写真', '動画', '椅子', '日常'],
      suggest: { a: ex('playful_smile'), b: ex('surprised') }
    }),
    pose({
      id: 'pair_daily_floor_talk', source: 'DC-025', category: 'daily_relax', family: 'sitting_kneeling',
      label: '床に座って飲み物を手に話す', short: '斜めに向き合って床に座り、Aがカップを手に話す。Bは身を乗り出して、Aの前腕にそっと手を添える。',
      roles: ['カップを持って話す側', '身を乗り出して聞く側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bへ斜めに向いて床に座り、片膝を立てる。片手でカップを膝の近くに低く持ち、もう一方の手を小さく開いて話す。', 'Aへ斜めに向いて床に座り、片ひじを自分の膝にのせて上体を前へ傾ける。空いた手を、Aのカップを持たない方の前腕の外側に軽く添える。'],
      contacts: [['a', 'Aの片手 → カップ（膝の近く）', "one of Person A's hands holds a cup low near the raised knee"], ['b', 'Bの片手 → Aの前腕の外側', "one of Person B's hands rests lightly on the outside of Person A's free forearm"], ['b', 'Bのひじ → 自分の膝', "Person B's elbow rests on their own knee"]],
      roleEn: ['the one talking with a cup in hand', 'the one leaning in to listen'],
      ts: ['Person A and Person B sit on the floor angled toward each other in conversation.', 'Person A sits with one knee raised, holding the cup low near it, the other hand open in a small speaking gesture.', "Person B leans forward with one elbow on their own knee, the free hand resting lightly on Person A's forearm."],
      sdxl: [['on floor', 'sitting', 'holding cup'], ['knee up', 'leaning forward', "hand on another's arm"]],
      nai: { core: ['on floor', 'sitting'], a: ['holding cup', 'knee up'], b: ['leaning forward', "hand on another's arm"], nl: 'the two sit on the floor angled toward each other, one holding a cup and talking while the other leans in and touches their forearm' },
      camera: cam(['three_quarter', 'side', 'eye_level', 'high'], ['side', 'three_quarter'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: 'カップと前腕に添えた手が画角外になります。' }),
      gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['床', '床座り', '飲み物', 'カップ', 'お茶', '話す', 'おしゃべり', '聞く', '前腕', '触れる', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),

    pose({
      id: 'pair_daily_counter_side', source: 'DC-012（生成確認を受けて改訂：両前腕で並んで眺める形にし、料理の場面は pair_daily_cooking_side へ分けた）', category: 'daily_relax', family: 'standing_leaning',
      label: 'カウンターに並んで前腕をのせる', short: '同じカウンター（バー・カフェ・窓辺など）に並んで立ち、二人とも前腕をのせて眺める。肩の間は少しだけ空ける。',
      roles: ['体を少し相手へ向ける側', '手を重ねて眺める側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣に立ち、両前腕をカウンターの縁にのせて軽く前かがみになる。胸だけを少しBの方へ向ける。', 'Aの隣に立ち、両前腕をカウンターの縁にのせて、手を軽く重ねる。'],
      contacts: [['a', 'Aの両前腕 → カウンターの縁', "both of Person A's forearms rest on the edge of the counter"], ['b', 'Bの両前腕 → カウンターの縁（手を軽く重ねる）', "both of Person B's forearms rest on the edge of the counter, hands loosely clasped"], ['both', '肩どうし → 少し間を空ける（触れない）', 'a small gap remains between their shoulders']],
      roleEn: ['the one turning slightly toward the other', 'the one with hands clasped on the counter'],
      ts: ['Person A and Person B stand side by side at a counter, both leaning forward with their forearms resting on the edge, a small gap between their shoulders.', 'Person A leans on both forearms with the chest turned slightly toward Person B.', 'Person B leans on both forearms with the hands loosely clasped on the counter.'],
      sdxl: [['side-by-side', 'standing', 'counter'], ['leaning forward', 'arm support', 'own hands together']],
      nai: { core: ['side-by-side', 'standing', 'counter', 'leaning forward'], a: ['arm support'], b: ['arm support', 'own hands together'], nl: 'the two stand side by side leaning their forearms on a counter, a small gap between their shoulders' },
      focus: { ja: '同じ方向（店内・窓の外など）', en: 'the same view ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'eye_level', 'side', 'high', 'low'], ['three_quarter', 'side'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], { overhead: NO_TOP }, { close: 'カウンターと前腕の支えが画角外になります。' }),
      gazes: { allowed: ['both_focus', 'b_focus_a_looks', 'mutual', 'both_viewer'], defaultId: 'both_focus' },
      keywords: ['カウンター', 'バー', 'カフェ', '窓辺', '手すり', '並んで立つ', '眺める', 'もたれる', '前腕', '立ち話', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    // ================= 日常・テーブルと台所 =================
    pose({
      id: 'pair_daily_mug_handoff', source: 'DC-006（DC-008・DC-010を統合）', category: 'daily_table', family: 'sitting_kneeling',
      label: 'テーブル越しに飲み物を渡す', short: 'テーブルを挟んで向かい合い、Aがマグカップを低く差し出し、Bが片手で受け取る途中。',
      roles: ['マグカップを渡す側', '受け取る側'], rel: ['level', 'none', 'face_to_face'],
      place: ['テーブルを挟んでBの向かいに座り、上体を少し前へ出す。片手でマグカップをテーブルの少し上に低く差し出し、もう一方の手はテーブルの縁に置く。', 'Aの向かいに座り、片手をマグカップの下へ伸ばして受け取る。もう一方の手は自分の膝に置く。'],
      contacts: [['a', 'Aの片手 → マグカップ（テーブルの少し上）', "one of Person A's hands holds a mug low just above the table"], ['b', 'Bの片手 → マグカップの下（受け取る手）', "one of Person B's hands reaches under the mug to take it"], ['both', '二人の手 → マグカップをはさんで分かれている', 'their two hands stay separate around the mug']],
      roleEn: ['the one passing the mug', 'the one receiving the mug'],
      ts: ['Person A and Person B sit facing each other across a small table, and Person A passes a mug to Person B.', 'Person A leans slightly forward, holding the mug out low over the table with the elbow softly bent, the other hand on the table edge.', 'Person B reaches out with one hand under the mug to receive it, the other hand resting on their own knee.'],
      sdxl: [['face-to-face', 'giving', 'mug'], ['sitting', 'table', 'reaching']],
      nai: { core: ['face-to-face', 'table', 'mug'], actions: [['giving', 'a']], a: ['sitting', 'holding cup', 'leaning forward'], b: ['sitting', 'reaching'], nl: 'the two sit facing each other across a small table while one passes a mug to the other' },
      focus: { ja: 'マグカップ', en: 'the mug between their hands', tags: ['looking at object'] },
      camera: cam(['three_quarter', 'side', 'eye_level', 'high'], ['three_quarter', 'side'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '受け渡しの手とマグカップが画角外になります。' }),
      surface: TABLE,
      gazes: { allowed: ['both_focus', 'mutual', 'b_focus_a_looks'], defaultId: 'both_focus' },
      keywords: ['テーブル', '食卓', 'マグカップ', '飲み物', 'コーヒー', 'お茶', '渡す', '受け取る', '受け渡し', '向かい合う', 'ちゃぶ台', 'こたつ', 'ローテーブル', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_table_talk', source: 'DC-007', category: 'daily_table', family: 'sitting_kneeling',
      label: '向かい合って食事しながら話す', short: '食卓で向かい合い、Aが片ひじをついて身を乗り出して話し、Bはカップを持ったまま聞く。',
      roles: ['片ひじをついて話しかける側', 'カップを持って聞く側'], rel: ['level', 'none', 'face_to_face'],
      place: ['Bの向かいに座って胸をBへ向け、片ひじをテーブルについて身を乗り出す。もう一方の手を開いて小さく前へ出す。', 'Aの向かいで少し斜めに座り、片手でカップを低く持つ。もう一方の前腕はテーブルに置く。'],
      contacts: [['a', 'Aのひじ → テーブル', "Person A's elbow rests on the table"], ['b', 'Bの片手 → カップ（低く持つ）', "one of Person B's hands holds a cup low"], ['b', 'Bの前腕 → テーブル', "Person B's other forearm rests on the table"]],
      roleEn: ['the one leaning in to talk', 'the one listening with a cup in hand'],
      ts: ['Person A and Person B sit facing each other across a table set with a meal, pausing to talk.', 'Person A leans forward with one elbow on the table, the other hand open in a small gesture.', 'Person B sits slightly angled, holding a cup low in one hand, the other forearm resting on the table.'],
      sdxl: [['face-to-face', 'sitting', 'table'], ['elbow on table', 'holding cup', 'food', 'leaning forward']],
      nai: { core: ['face-to-face', 'sitting', 'table', 'food'], a: ['elbow on table', 'leaning forward'], b: ['holding cup'], nl: 'the two sit facing each other at a table with a meal, one leaning forward on an elbow to talk while the other holds a cup' },
      camera: cam(['three_quarter', 'side', 'eye_level', 'high'], ['three_quarter', 'side'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: 'テーブルと二人の手元が画角外になります。' }),
      surface: TABLE,
      gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['食事', 'しょくじ', 'ご飯', 'ごはん', '食卓', 'テーブル', '向かい合う', '話す', '会話', '身を乗り出す', 'ひじをつく', 'カップ', 'ちゃぶ台', 'こたつ', '日常'],
      suggest: { a: ex('playful_smile'), b: ex('gentle_smile') }
    }),
    pose({
      id: 'pair_daily_feeding', source: '新規（依頼書の「あーん」。26候補に無いため補った）', category: 'daily_table', family: 'sitting_kneeling',
      label: '「あーん」と食べさせる', short: 'テーブルを挟んで、Aがスプーンで一口を差し出し、もう一方の手を下に添える。Bは身を乗り出して受ける。',
      roles: ['一口を差し出す側', '身を乗り出して受ける側'], rel: ['level', 'none', 'face_to_face'],
      place: ['テーブルを挟んでBの向かいに座り、上体を少し乗り出す。片手でスプーンを持ち、一口分をBの口元の高さへ差し出す。もう一方の手は、こぼれないように一口の下へ軽く添える。', 'Aの向かいに座り、上体を少し前へ乗り出して、差し出された一口へ顔を寄せる。受け取りに手は使わず、両手はテーブルの縁に置く。'],
      contacts: [['a', 'Aの片手 → スプーン（Bの口元の高さ）', "one of Person A's hands holds a spoon with a bite of food up near Person B's mouth"], ['a', 'Aのもう一方の手 → スプーンの下に添える', "Person A's other hand is cupped just beneath the spoon"], ['b', 'Bの両手 → テーブルの縁', "Person B's hands rest on the edge of the table"]],
      roleEn: ['the one offering a bite', 'the one leaning in to take the bite'],
      ts: ['Person A and Person B sit facing each other across a table, and Person A feeds Person B a bite of food from a spoon.', "Person A leans forward and holds the spoon up to Person B's mouth, the other hand cupped beneath it.", 'Person B leans in toward the spoon to take the bite.'],
      sdxl: [['feeding', 'face-to-face', 'holding spoon'], ['table', 'sitting', 'leaning forward', 'food']],
      nai: { core: ['face-to-face', 'table'], actions: [['feeding', 'a']], a: ['sitting', 'holding spoon', 'leaning forward'], b: ['sitting', 'leaning forward'], nl: 'one person feeds the other a bite of food from a spoon across a table' },
      focus: { ja: '差し出した一口', en: 'the bite on the spoon', tags: ['looking at food'] },
      camera: cam(['side', 'three_quarter', 'eye_level', 'high'], ['side', 'three_quarter'], 'side', 'upper_body'),
      surface: TABLE,
      gazes: { allowed: ['b_focus_a_looks', 'mutual', 'both_focus'], defaultId: 'b_focus_a_looks' },
      keywords: ['あーん', 'あーんする', '食べさせる', '一口', 'スプーン', '食事', 'しょくじ', 'ご飯', 'ごはん', 'デザート', 'ケーキ', '向かい合う', 'テーブル', 'いちゃいちゃ', '日常'],
      related: ['relationship_offer_bite_to_viewer'],
      suggest: { a: ex('gentle_smile'), b: ex('shy', null, 'parted_lips') }
    }),
    pose({
      id: 'pair_daily_counter_handoff', source: 'DC-009（A/Bを入れ替え：立って渡す側をAに）', category: 'daily_table', family: 'standing_leaning',
      label: 'カウンター越しに小皿を渡す', short: 'カウンターの内側に立つAが小皿を差し出し、反対側のスツールに座るBが受け取る。',
      roles: ['立って小皿を渡す側', 'スツールに座って受け取る側'], rel: ['a_taller', 'none', 'face_to_face'],
      place: ['カウンターの内側に立ち、片足を少し後ろへ引く。片手で小皿をカウンター越しに差し出し、もう一方の手をカウンターに添える。', 'カウンターの反対側のスツールに座り、片手を伸ばして小皿を受け取る。もう一方の前腕はカウンターに置く。'],
      contacts: [['a', 'Aの片手 → 小皿（カウンターの上）', "one of Person A's hands passes a small plate across the counter"], ['b', 'Bの片手 → 小皿の反対側（受け取る手）', "one of Person B's hands takes the other side of the plate"], ['both', 'カウンター → 二人の間を隔てる', 'the counter stays between them']],
      roleEn: ['the one standing and passing the plate', 'the one seated on the stool'],
      ts: ['Person A stands on one side of a kitchen counter and passes a small plate across it to Person B, who sits on a stool on the other side.', 'Person A stands with one foot drawn back, reaching across the counter with the plate, the other hand resting on the counter.', 'Person B sits on the stool, reaching up with one hand to take the plate, the other forearm on the counter.'],
      sdxl: [['giving', 'plate', 'counter'], ['standing', 'sitting', 'stool']],
      nai: { core: ['counter', 'plate'], actions: [['giving', 'a']], a: ['standing', 'holding plate'], b: ['sitting', 'stool', 'reaching'], nl: 'one person stands behind a kitchen counter and passes a small plate to the other, who sits on a stool' },
      focus: { ja: '小皿', en: 'the small plate', tags: ['looking at object'] },
      camera: cam(['three_quarter', 'side', 'eye_level', 'high'], ['three_quarter', 'side'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '小皿と受け渡しの手が画角外になります。' }),
      gazes: { allowed: ['b_focus_a_looks', 'mutual', 'both_focus'], defaultId: 'b_focus_a_looks' },
      keywords: ['キッチン', 'カウンター', '台所', '小皿', '味見', '渡す', '受け取る', 'スツール', '料理', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_table_side_touch', source: 'DC-013（A/Bを入れ替え：触れる側をAに）', category: 'daily_table', family: 'approach_touch',
      label: 'テーブル脇で腕にそっと触れる', short: '椅子に座るBの横に立ったAが、片手をテーブルについて、Bの前腕にそっと手を添える。',
      roles: ['横に立って腕に触れる側', '椅子に座る側'], rel: ['a_taller', 'none', 'side_on'],
      place: ['Bの横に、Bに対して直角に近い向きで立つ。片手をテーブルの縁について体を支え、もう一方の手のひらをBの前腕の外側に軽く添える。上体は深く倒さない。', 'テーブルに対して斜めに椅子へ座り、背もたれに背を預ける。片前腕を自分の太ももに置く。'],
      contacts: [['a', 'Aの片手のひら → Bの前腕の外側', "one of Person A's palms rests lightly on the outside of Person B's forearm"], ['a', 'Aのもう一方の手 → テーブルの縁', "Person A's other hand is braced on the table edge"], ['b', 'Bの背中 → 椅子の背もたれ', "Person B's back rests against the back of the chair"]],
      roleEn: ['the one standing beside and touching the arm', 'the one seated in the chair'],
      ts: ['Person B sits angled in a chair beside a table, and Person A stands close beside Person B, roughly perpendicular to them.', "Person A braces one hand on the table edge and lays the other palm lightly on Person B's forearm.", 'Person B sits back in the chair with one forearm resting on their own thigh, turned toward Person A.'],
      sdxl: [["hand on another's arm", 'sitting', 'standing'], ['on chair', 'table', 'hand on own thigh']],
      nai: { core: ['table'], a: ['standing', "hand on another's arm"], b: ['sitting', 'on chair', 'hand on own thigh'], nl: 'one person sits in a chair by a table while the other stands beside them and lightly touches their forearm' },
      camera: cam(['three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '前腕に添えた手とテーブルが画角外になります。' }),
      gazes: { allowed: ['mutual', 'a_gazes_b', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['テーブル', '食卓', '椅子', '腕', '前腕', '手を添える', '触れる', '声をかける', '立つ', '座る', '日常'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex('slight_smile', 'look_up') }
    }),
    pose({
      id: 'pair_daily_cooking_side', source: '新規（DC-012の生成確認で、料理の場面を独立させた）', category: 'daily_table', family: 'standing_leaning',
      label: 'キッチンで並んで料理する', short: 'キッチンカウンターの前に並んでまっすぐ立ち、Aがまな板で野菜を切り、Bはボウルを持って隣で手伝う。',
      roles: ['まな板で食材を切る側', 'ボウルを持って手伝う側'], rel: ['level', 'none', 'side_by_side'],
      place: ['カウンターの前にまっすぐ立ち、まな板の上の野菜を包丁で切る。もう一方の手で野菜を押さえる。どこにももたれない。', 'Aの隣にまっすぐ立ち、両手でボウルを持って、まな板の近くに差し出す。肩の間は少し空ける。'],
      contacts: [['a', 'Aの片手 → 包丁（まな板の上）', "one of Person A's hands holds a kitchen knife over the cutting board"], ['a', 'Aのもう一方の手 → 野菜を押さえる', "Person A's other hand steadies the vegetables on the board"], ['b', 'Bの両手 → ボウル（まな板の近く）', "Person B holds a bowl in both hands close to the cutting board"], ['both', '肩どうし → 少し間を空ける', 'a small gap remains between their shoulders']],
      roleEn: ['the one cutting vegetables', 'the one holding the bowl and helping'],
      ts: ['Person A and Person B stand side by side at a kitchen counter, preparing food together.', 'Person A stands upright facing the counter, slicing vegetables on a cutting board, the other hand steadying them.', 'Person B stands upright beside Person A, holding a bowl in both hands close to the cutting board, ready to take the cut vegetables.'],
      sdxl: [['side-by-side', 'cooking', 'kitchen'], ['cutting board', 'holding knife', 'vegetable', 'holding bowl', 'standing']],
      nai: { core: ['side-by-side', 'standing', 'cooking', 'kitchen', 'cutting board'], a: ['holding knife', 'vegetable'], b: ['holding bowl'], nl: 'the two stand side by side at a kitchen counter cooking together, one cutting vegetables on a cutting board while the other holds a bowl beside them' },
      focus: { ja: 'まな板の手元', en: 'the cutting board', tags: ['looking down'] },
      sceneJa: 'キッチン・まな板・包丁・野菜・ボウル（料理の場面だと分かるように出力へ含める）',
      camera: cam(['three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: 'まな板とボウルの手元が画角外になります。' }),
      gazes: { allowed: ['both_focus', 'a_focus_b_looks'], defaultId: 'both_focus' },
      keywords: ['料理', 'りょうり', '一緒に料理', 'キッチン', '台所', 'まな板', '包丁', '野菜', 'ボウル', '手伝う', '並んで立つ', '日常'],
      suggest: { a: ex('slight_smile'), b: ex('gentle_smile') }
    }),
    pose({
      id: 'pair_daily_cookbook', source: 'DC-026（生成確認を受けて改訂：料理中の場面に限定し、勉強の場面は pair_daily_study_point へ分けた）', category: 'daily_table', family: 'standing_leaning',
      label: 'レシピを見ながら料理する', short: 'キッチンカウンターでボウルを混ぜるBの斜め後ろから、Aが立てかけた料理本を指さし、Bの二の腕に手を添える。',
      roles: ['斜め後ろから料理本を指さす側', 'ボウルを混ぜる側'], rel: ['level', 'b_front', 'same_direction'],
      place: ['Bの斜め後ろに半歩ずれて立ち、真後ろには入らずに横から身を乗り出す。片手の人差し指で、カウンターに立てかけた料理本のページを指し、もう一方の手をBの二の腕の外側に軽く置く。', 'カウンターの前に立ち、片腕でボウルを抱えて、もう一方の手の泡立て器で中身を混ぜる。'],
      contacts: [['a', 'Aの人差し指 → 立てかけた料理本のページ', "Person A's index finger points to the page of an open cookbook propped up on the counter"], ['a', 'Aのもう一方の手 → Bの二の腕の外側', "Person A's other hand rests lightly on the outside of Person B's upper arm"], ['b', 'Bの両手 → ボウルと泡立て器', "Person B's hands hold a bowl and a whisk"]],
      roleEn: ['the one leaning in and pointing at the recipe', 'the one mixing the bowl'],
      ts: ['Person A and Person B stand at a kitchen counter while cooking, with Person B in front mixing a bowl and Person A leaning in from just behind and to the side, checking an open cookbook propped up on the counter.', "Person A leans in beside Person B's shoulder, pointing at the recipe page with one finger.", 'Person B holds the bowl in one arm and stirs it with a whisk in the other hand.'],
      sdxl: [['cooking', 'kitchen', 'pointing'], ['cookbook', 'open book', 'holding bowl', 'whisk', "hand on another's arm", 'standing']],
      nai: { core: ['standing', 'cooking', 'kitchen', 'cookbook', 'open book'], a: ['pointing', 'leaning forward', "hand on another's arm"], b: ['holding bowl', 'whisk'], nl: 'two people cook at a kitchen counter, one mixing a bowl while the other leans in from behind to point at a recipe in an open cookbook' },
      focus: { ja: '料理本のページ', en: 'the recipe page', tags: ['looking down'] },
      sceneJa: 'キッチン・立てかけた料理本・ボウルと泡立て器（勉強の場面に流れないように出力へ含める）',
      camera: cam(['three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'knee_up', ['full_body', 'knee_up', 'upper_body'], null, { close: '料理本と手元が画角外になります。' }),
      gazes: { allowed: ['both_focus', 'back_gazes_front', 'front_looks_back'], defaultId: 'both_focus' },
      keywords: ['レシピ', '料理本', '料理', 'りょうり', 'キッチン', 'カウンター', '台所', '指さす', 'のぞき込む', '一緒に作る', 'お菓子作り', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_study_point', source: '新規（DC-026の生成確認で出た「勉強」の形を独立させた）', category: 'daily_table', family: 'approach_touch',
      label: '机で本を指さして教える', short: '机に向かって座るBの斜め後ろからAがのぞき込み、開いた本のページを指さして、Bの二の腕に手を添える。',
      roles: ['後ろから指さして教える側', '机に座って本を読む側'], rel: ['a_taller', 'b_front', 'same_direction'],
      place: ['Bの斜め後ろに立ち、真後ろには入らずに横から身を乗り出す。片手の人差し指で机の上の本のページを指し、もう一方の手をBの二の腕の外側に軽く置く。', '机に向かって椅子に座り、開いた本を机に置く。片手をページの端に添え、もう一方の前腕は机に置く。'],
      contacts: [['a', 'Aの人差し指 → 机の上の本のページ', "Person A's index finger points to a spot on the page of the open book"], ['a', 'Aのもう一方の手 → Bの二の腕の外側', "Person A's other hand rests lightly on the outside of Person B's upper arm"], ['b', 'Bの片手 → ページの端', "one of Person B's hands rests on the edge of the page"]],
      roleEn: ['the one leaning in to point and explain', 'the one seated at the desk'],
      ts: ['Person B sits at a desk with an open book, and Person A stands just behind and to the side of Person B, leaning in to point at the page.', "Person A leans in beside Person B's shoulder, pointing with one finger, the other hand resting on Person B's upper arm.", 'Person B sits with one hand on the edge of the page and the other forearm resting on the desk.'],
      sdxl: [['pointing', 'open book', 'desk'], ['studying', 'sitting', 'standing', "hand on another's arm", 'leaning forward']],
      nai: { core: ['open book', 'desk', 'studying'], a: ['standing', 'pointing', 'leaning forward', "hand on another's arm"], b: ['sitting', 'on chair'], nl: 'one person sits at a desk with an open book while the other leans in from behind to point at the page and explain' },
      focus: { ja: '本のページ', en: 'the same spot on the page', tags: ['looking down'] },
      sceneJa: '机・開いた本（勉強・教える場面）',
      camera: cam(['three_quarter', 'eye_level', 'side', 'high'], ['three_quarter', 'eye_level'], 'three_quarter', 'upper_body', ['full_body', 'knee_up', 'upper_body'], null, { close: '本と指さす手が画角外になります。' }),
      gazes: { allowed: ['both_focus', 'back_gazes_front', 'front_looks_back'], defaultId: 'both_focus' },
      keywords: ['勉強', 'べんきょう', '教える', '宿題', 'テスト勉強', '机', '本', '指さす', 'のぞき込む', '図書館', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),

    // ================= 日常・お風呂（姿勢・向き・距離・接触点だけを書く） =================
    pose({
      id: 'pair_daily_bath_side', source: 'DC-005', category: 'daily_bath', family: 'sitting_kneeling',
      label: '湯船で肩を並べる', short: '広めの湯船か温泉で、同じ壁に並んでもたれ、肩だけを触れ合わせる。外側の腕はそれぞれ自分の側の縁に置く。',
      roles: ['肩を寄せる側', '肩を並べる側'], rel: ['level', 'none', 'side_by_side'],
      place: ['Bの隣で湯船の壁に上背を預け、胸のあたりまで湯に浸かる。Bに近い肩だけをBへ軽く寄せ、外側の前腕を自分の側の縁に置く。', 'Aの隣で同じ壁に上背を預け、外側の前腕を自分の側の縁に置く。内側の腕は自分の体の近くに収める。'],
      contacts: [['both', '肩どうし → 軽く触れている（接点はここだけ）', 'only their inner shoulders lightly touch'], ['a', 'Aの外側の前腕 → 自分の側の湯船の縁', "Person A's outer forearm rests on the edge of the bath at their own side"], ['b', 'Bの外側の前腕 → 自分の側の湯船の縁', "Person B's outer forearm rests on the edge of the bath at their own side"]],
      roleEn: ['the one leaning a shoulder in', 'the one sitting shoulder to shoulder'],
      ts: ['Person A and Person B sit side by side in the bath, both leaning back against the same wall of the bath, partially submerged in the water.', 'Person A leans the inner shoulder lightly against Person B.', 'Person B leans back beside Person A, the inner arm kept close to the body.'],
      sdxl: [['side-by-side', 'partially submerged', 'shoulder-to-shoulder'], ['leaning back']],
      nai: { core: ['side-by-side', 'partially submerged', 'shoulder-to-shoulder'], a: ['leaning back'], b: ['leaning back'], nl: 'the two sit side by side in a wide bath, leaning back against the same wall with their shoulders touching' },
      focus: { ja: '同じ方向', en: 'the view ahead of them', tags: ['looking ahead'] },
      camera: cam(['three_quarter', 'rear_three_quarter', 'high', 'eye_level', 'side'], ['three_quarter', 'rear_three_quarter'], 'three_quarter', 'upper_body', ['upper_body', 'close'], { low: '湯面より下からは見られません。', overhead: '真上からは肩の接点と縁の支えが読めません。' }, BATH_SHOTS),
      surface: { mode: 'in', allowed: ['wide_bath', 'onsen'], defaultId: 'wide_bath' },
      gazes: { allowed: ['both_focus', 'b_focus_a_looks', 'mutual', 'eyes_closed'], defaultId: 'both_focus' },
      keywords: ['お風呂', '風呂', 'おふろ', '湯船', 'ゆぶね', '入浴', '一緒に入る', '並ぶ', '肩', '温泉', 'くつろぐ', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex(null, 'half_closed', 'faint_smile') }
    }),
    pose({
      id: 'pair_daily_bath_facing', source: 'DC-020', category: 'daily_bath', family: 'sitting_kneeling',
      label: '湯船で向かい合って話す', short: '広めの湯船か温泉の対角の角に座り、それぞれ近い壁と縁で体を支えて向かい合う。体は触れない。',
      roles: ['奥の角に座る側', '手前の角に座る側'], rel: ['level', 'none', 'face_to_face'],
      place: ['湯船の奥の角に座り、上背を近い壁へ軽く寄せる。上体を中央へ向け、片前腕を最も近い縁に置く。', 'Aと対角の手前の角に座り、上背を近い壁へ軽く寄せる。上体を中央へ向け、片前腕を最も近い縁に置く。'],
      contacts: [['a', 'Aの片前腕 → 近い湯船の縁', "one of Person A's forearms rests on the nearest edge of the bath"], ['b', 'Bの片前腕 → 近い湯船の縁', "one of Person B's forearms rests on the nearest edge of the bath"], ['both', '体 → 湯面をはさんで離れている', 'open water stays between them']],
      roleEn: ['the one in the far corner', 'the one in the near corner'],
      ts: ['Person A and Person B sit in opposite corners of the bath, facing each other across the water, partially submerged.', 'Person A sits in the far corner with the upper back against the wall of the bath.', 'Person B sits in the near corner with the upper back against the wall of the bath.'],
      sdxl: [['facing another', 'partially submerged'], ['leaning back']],
      nai: { core: ['facing another', 'partially submerged'], a: ['leaning back'], b: ['leaning back'], nl: 'the two sit in opposite corners of a wide bath, facing each other across the water' },
      camera: cam(['three_quarter', 'high', 'side', 'eye_level'], ['three_quarter', 'high'], 'three_quarter', 'upper_body', ['upper_body'], { low: '湯面より下からは見られません。', overhead: '真上からは向かい合う顔が見えません。' }, { full_body: BATH_SHOTS.full_body, knee_up: BATH_SHOTS.knee_up, close: '二人が離れているため、顔まわりの画角には収まりません。' }),
      surface: { mode: 'in', allowed: ['wide_bath', 'onsen'], defaultId: 'wide_bath' },
      gazes: { allowed: ['mutual', 'a_gazes_b', 'eyes_closed', 'both_viewer'], defaultId: 'mutual' },
      keywords: ['お風呂', '風呂', 'おふろ', '湯船', 'ゆぶね', '入浴', '一緒に入る', '向かい合う', '話す', '対角', '温泉', '日常'],
      suggest: { a: ex('gentle_smile'), b: ex('slight_smile') }
    }),
    pose({
      id: 'pair_daily_bath_back_rest', source: 'DC-021（身体配置の矛盾を修正）', category: 'daily_bath', family: 'sitting_kneeling',
      label: '湯船で背中を預ける', short: 'Aが湯船の壁にもたれ、その前に少し横へずれて座ったBが、上背をAの胸に預ける。腕は回さない。家庭の湯船でも収まる形。',
      roles: ['後ろで受け止める側', '前で背中を預ける側'], rel: ['level', 'b_front', 'same_direction'],
      place: ['湯船の奥側に座り、上背を奥の壁に預ける。両手はそれぞれ湯船の縁に置き、Bには腕を回さない。', 'Aの前に、少し横へずれて座る。上背の片側だけをAの胸に預け、片手を自分の側の縁に置く。'],
      contacts: [['b', 'Bの上背の片側 → Aの胸', "one side of Person B's upper back rests against Person A's chest"], ['a', 'Aの両手 → 湯船の縁', "Person A's hands rest on the edges of the bath"], ['b', 'Bの片手 → 自分の側の縁', "one of Person B's hands rests on the edge of the bath at their own side"]],
      roleEn: ['the one sitting behind as a backrest', 'the one in front leaning back'],
      ts: ['Person A sits at the back of the bath leaning against its wall, and Person B is in front of Person A, seated slightly off to one side and leaning back against Person A, both partially submerged.', 'Person A keeps both hands resting along the edges of the bath.', 'Person B rests one hand on the edge of the bath at their own side.'],
      sdxl: [['leaning back', 'partially submerged'], ['leaning on person']],
      nai: { core: ['partially submerged'], actions: [['leaning on person', 'b']], a: ['leaning back'], b: ['leaning back'], nl: 'one person sits at the back of the bath while the other sits in front, leaning back against their chest' },
      camera: cam(['side', 'three_quarter', 'high', 'eye_level'], ['side', 'three_quarter'], 'side', 'upper_body', ['upper_body', 'close'], { low: '湯面より下からは見られません。', overhead: '真上からは前後の重なりが読めません。' }, BATH_SHOTS),
      surface: { mode: 'in', allowed: ['home_bath', 'wide_bath', 'onsen'], defaultId: 'home_bath' },
      gazes: { allowed: ['back_gazes_front', 'front_looks_back', 'eyes_closed', 'both_viewer'], defaultId: 'back_gazes_front' },
      keywords: ['お風呂', '風呂', 'おふろ', '湯船', 'ゆぶね', '入浴', '一緒に入る', '背中を預ける', 'もたれる', '前後', '温泉', '日常'],
      suggest: { a: ex('gentle_smile', 'look_down'), b: ex(null, 'half_closed', 'affectionate') }
    })
  ];

  D.pairPoses = (D.pairPoses || []).concat(daily);

  // ---- DC-001〜DC-026 の判定記録（採用しなかった候補の理由を残す） ----
  // decision: adopted（新規採用）/ merged_candidate（候補同士で統合）/ existing（既存ポーズで代用可能・既存に近いため統合）/ hold（保留）
  D.dailyPairCandidateLog = [
    { id: 'DC-001', decision: 'adopted', poseId: 'pair_daily_shared_book', reasonJa: '一冊を二人で両側から持つ手の役割と非接触の並びは、既存46件に無い。' },
    { id: 'DC-002', decision: 'adopted', poseId: 'pair_daily_watch_forward', reasonJa: '既存「ソファで寄り添って座る」は手を重ね、脚も触れ、相手を見る。前方を一緒に見る視線と肩一点の接触は既存に無い。' },
    { id: 'DC-003', decision: 'adopted', poseId: 'pair_daily_floor_board', reasonJa: '床座り・低い盤面・片方だけが駒に触れる手の役割は既存に無い。' },
    { id: 'DC-004', decision: 'merged_candidate', poseId: 'pair_daily_shared_book', reasonJa: 'DC-001と身体構造（横並び・一冊を挟む）が同じ。違いはベッドと非対称の視線だけなので、DC-001の「場所：ベッド」と視線「Aは本を見て、BはAを見る」で表せる。' },
    { id: 'DC-005', decision: 'adopted', poseId: 'pair_daily_bath_side', reasonJa: '湯船の構図は既存に無い。依頼書の「お風呂で横並び」に対応。' },
    { id: 'DC-006', decision: 'adopted', poseId: 'pair_daily_mug_handoff', reasonJa: 'テーブル越しの受け渡しは既存に無い。DC-008・DC-010を場所の選択肢（椅子とテーブル／床とローテーブル／こたつ）に吸収。' },
    { id: 'DC-007', decision: 'adopted', poseId: 'pair_daily_table_talk', reasonJa: '受け渡しではなく、片ひじで身を乗り出す話し手とカップを持つ聞き手の持続姿勢。依頼書の「向かい合ってご飯」に対応。' },
    { id: 'DC-008', decision: 'merged_candidate', poseId: 'pair_daily_mug_handoff', reasonJa: 'DC-006と、向かい合い・一方向の受け渡し・小物への視線が同じ。違いは床に座ることと脚の組み方なので、DC-006の場所「床とローテーブル」「こたつ」へ統合。' },
    { id: 'DC-009', decision: 'adopted', poseId: 'pair_daily_counter_handoff', reasonJa: '立つ人と座る人の高低差をカウンターが隔てる受け渡し。A＝渡す側に揃えるため、立って渡す側をAにした。' },
    { id: 'DC-010', decision: 'merged_candidate', poseId: 'pair_daily_mug_handoff', reasonJa: '皿の縁を二人で持つ形は、生成ではテーブル越しの受け渡しと見分けにくい。指先の接点も消えやすいため、DC-006へ統合。' },
    { id: 'DC-011', decision: 'adopted', poseId: 'pair_daily_head_on_shoulder', reasonJa: '既存「片側から寄りかかる」はAの腕がBの肩に回り、Bが体重を預ける抱き寄せ型。DC-011は腕を回さず頭だけを預け、Aは前を見る日常型で、接触点と視線が違う。' },
    { id: 'DC-012', decision: 'adopted', poseId: 'pair_daily_counter_side', reasonJa: '立位で接触なし、肩の間を空けて並ぶ構図は既存に無い（既存の立位はすべて接触あり）。生成確認で料理の場面にならず「並んで眺める」に流れたため、両前腕で眺める形に改め、料理の場面は「キッチンで並んで料理する」に分けた（2026-10-30）。' },
    { id: 'DC-013', decision: 'adopted', poseId: 'pair_daily_table_side_touch', reasonJa: '立つ人と座る人が直角に近い向きで、手のひら→前腕の一点だけで触れる構図は既存に無い。' },
    { id: 'DC-014', decision: 'existing', poseId: 'pair_close_from_behind', reasonJa: '既存「背後から身を寄せる」と、同じ向きの前後配置・背中→胸の接点・腕を回さない点が同じ。壁は既存の「末尾に追加する語」で足せる。' },
    { id: 'DC-015', decision: 'merged_candidate', poseId: 'pair_daily_watch_forward', reasonJa: 'DC-002と横並び・前方視線・肩一点接触・背もたれ支持の4点が同じ。「同じクッション」は生成では区別できない。' },
    { id: 'DC-016', decision: 'adopted', poseId: 'pair_daily_sofa_floor', reasonJa: '床とソファの高低差・ソファ前面へのもたれ・肩への手のひらは既存に無い。触れる側をAにした。' },
    { id: 'DC-017', decision: 'adopted', poseId: 'pair_daily_sofa_ends', reasonJa: 'ソファの両端・寝る人と座る人・足先だけの接点は既存に無い。' },
    { id: 'DC-018', decision: 'existing', poseId: 'pair_armrest_lean', reasonJa: '既存「肘掛けに腰掛けて寄りかかる」と、一脚を座面と肘掛けで分ける構造が同じ（役割の向きが逆なだけ）。' },
    { id: 'DC-019', decision: 'adopted', poseId: 'pair_daily_bed_headboard', reasonJa: '既存のベッド座り（向かい合う・寄り添う）と違い、ヘッドボードに背を預けて脚を伸ばす半座位。視線の選択でテレビを見る場面にも使える。' },
    { id: 'DC-020', decision: 'adopted', poseId: 'pair_daily_bath_facing', reasonJa: '依頼書の「お風呂で向き合う」に対応。対角・非接触・別々の縁支持。' },
    { id: 'DC-021', decision: 'adopted', poseId: 'pair_daily_bath_back_rest', reasonJa: '依頼書の「お風呂で背中を預ける」に対応。元の記述「前の人の上背を後ろの人の肩甲骨側へ」は、同じ向きに前後で座ると成立しないため、「前の人の上背を後ろの人の胸へ」に直した。' },
    { id: 'DC-022', decision: 'hold', poseId: null, reasonJa: 'DC-020（対角・別々の縁）との違いが指先→前腕の一点だけで、湯船の画角では生成でほぼ消える。生成確認でDC-020が安定してから再検討。' },
    { id: 'DC-023', decision: 'hold', poseId: null, reasonJa: 'Manusの評価もP3（保留寄り）。向かいの長辺・同じ角への向き・一方向の視線の三点が画面で読めないとDC-005／DC-020と区別できない。' },
    { id: 'DC-024', decision: 'adopted', poseId: 'pair_daily_phone_show', reasonJa: '立つ人が一台の画面を座る人へ見せる、非接触の共同注視は既存に無い。見せる側をAにした。' },
    { id: 'DC-025', decision: 'adopted', poseId: 'pair_daily_floor_talk', reasonJa: '床座りの斜め向かい、話し手と聞き手、前腕への手添えは既存に無い。' },
    { id: 'DC-026', decision: 'adopted', poseId: 'pair_daily_cookbook', reasonJa: '立位の前後ずれ、指さす人と料理する人の非対称、二の腕への手添えは既存に無い。指さす側をAにした。生成確認で本と指さしだけでは勉強の場面に流れたため、キッチン・料理本・ボウルを出力に含め、勉強の場面は「机で本を指さして教える」に分けた（2026-10-30）。' }
  ];

  // ---- 日常ポーズで使うタグ（danbooru.csv の投稿数。2026-10-30時点のtagcomplete版） ----
  D.dailyPairVerifiedTags = {
    'side-by-side': 10408, 'sitting': 939842, 'reading': 17519, 'open book': 26872, 'holding book': 44948, 'hand on own knee': 12078,
    'looking down': 96175, 'shoulder-to-shoulder': 326, 'leaning back': 19605, 'hand on own thigh': 12747, 'hands on lap': 3234,
    'looking ahead': 30172, 'playing games': 8025, 'holding controller': 4711, 'game controller': 11047, 'leaning forward': 115911,
    "head on another's shoulder": 2883, 'leaning to the side': 10342, 'closed eyes': 706552, 'on floor': 25999, 'couch': 52769, 'on couch': 19423,
    "hand on another's shoulder": 25244, 'knee up': 40682, 'lying': 446035, 'on back': 252306, 'arm rest': 5851, 'on bed': 110142, 'headboard': 312,
    'board game': 2645, 'arm support': 94468, 'holding phone': 50373, 'smartphone': 53141, 'standing': 901688, 'on chair': 21903,
    'hands on own knees': 6823, 'looking at phone': 4330, 'holding cup': 67140, "hand on another's arm": 5776, 'face-to-face': 13349,
    'giving': 3767, 'mug': 28187, 'table': 84769, 'reaching': 29748, 'looking at object': 8899, 'elbow on table': 822, 'food': 442029,
    'feeding': 9142, 'holding spoon': 11094, 'looking at food': 1984, 'plate': 44749, 'counter': 3282, 'stool': 11014, 'holding plate': 13694,
    'leaning on object': 2915, 'pointing': 65269, 'bathtub': 9669, 'partially submerged': 35074, 'facing another': 12091,
    'leaning on person': 6528, 'looking at another': 264736, 'chair': 91462, 'kotatsu': 7130, 'onsen': 18611, 'from behind': 232537,
    'own hands together': 78093, 'cooking': 9165, 'kitchen': 6817, 'cutting board': 1804, 'holding knife': 24424, 'vegetable': 5263,
    'holding bowl': 7086, 'whisk': 2915, 'cookbook': 130, 'desk': 40794, 'studying': 641
  };
})(window);
