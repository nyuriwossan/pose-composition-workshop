(function (global) {
  'use strict';
  /*
   * 棒人間の模式図（一人用）
   *
   * プリセットごとに絵を描くのではなく、今の設計状態（state）から組み立てる。
   *   1. 姿勢・支え方から「基本の骨格」を選ぶ（頭・胴・脚）
   *   2. 腕の動き（片手ずつ／両腕の複合）を「手を置く場所」として決め、肘の位置は2関節の計算で求める
   *   3. 上半身の傾き・顔の向きを重ね、撮影範囲の枠とカメラの高さを添える
   * 図は設計の意図を確かめるための目安で、画像生成の結果を保証するものではない。
   * 出力エンジン（generator.js）は一切参照も変更もしない。
   */
  var PCW = global.PCW = global.PCW || {};

  var W = 130, H = 148, CX = 65;
  var UPPER = 21, FORE = 19;            // 上腕・前腕の長さ
  var HEAD_R = 8;

  function P(x, y) { return { x: x, y: y }; }
  function add(a, dx, dy) { return P(a.x + dx, a.y + dy); }
  function mid(a, b, t) { t = t == null ? 0.5 : t; return P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function rotate(p, origin, deg) {
    var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), dx = p.x - origin.x, dy = p.y - origin.y;
    return P(origin.x + dx * c - dy * s, origin.y + dx * s + dy * c);
  }
  function round(n) { return Math.round(n * 10) / 10; }

  /* ------------------------------------------------------------------ */
  /* 1. 基本の骨格                                                       */
  /* ------------------------------------------------------------------ */
  // 骨格は、横から（side）の図では人物が画面右を向く。正面（front）の図では、画面右を「+1側」とする。
  // legs: [{hip, knee, foot}] を2本。side の図では [手前, 奥]。

  function frontStanding(s) {
    var lb = s.pose.lowerBody, knee = lb.knee, rel = lb.legRelation, stance = lb.stance;
    var hipY = 76, half = 7;
    var footHalf = stance === 'together' ? 3 : stance === 'wide' ? 14 : stance === 'shoulder_width' ? 11 : 7;
    var legs = [
      { hip: P(CX + half, hipY), knee: P(CX + half, 105), foot: P(CX + footHalf, 134) },
      { hip: P(CX - half, hipY), knee: P(CX - half, 105), foot: P(CX - footHalf, 134) }
    ];
    if (rel === 'lightly_crossed') { legs[0].foot = P(CX - 3, 134); legs[1].foot = P(CX + 3, 134); legs[0].knee = P(CX + 3, 105); legs[1].knee = P(CX - 3, 105); }
    if (knee === 'one_bent' || rel === 'one_forward') { legs[1].knee = P(CX - 3, 106); legs[1].foot = P(CX - 1, rel === 'one_forward' ? 136 : 133); legs[1].hip.y += 2; }
    if (rel === 'stepping' || s.pose.posture === 'walking') { legs[0].knee = P(CX + 9, 103); legs[0].foot = P(CX + 11, 129); legs[1].knee = P(CX - 6, 105); legs[1].foot = P(CX - 8, 135); }
    if (knee === 'both_bent') { legs[0].knee.x += 3; legs[1].knee.x -= 3; legs[0].knee.y -= 2; legs[1].knee.y -= 2; }
    return { view: 'front', hip: P(CX, hipY), neck: P(CX, 33), head: P(CX, 22), legs: legs, ground: 136 };
  }

  function frontLowSquat(s, supportPose) {
    // 蹲踞・四股・しゃがみを正面から（膝の開きが見分けどころ）
    if (supportPose === 'shiko_stance') {
      return { view: 'front', hip: P(CX, 98), neck: P(CX, 56), head: P(CX, 45), legs: [
        { hip: P(CX + 8, 98), knee: P(CX + 27, 104), foot: P(CX + 30, 134) },
        { hip: P(CX - 8, 98), knee: P(CX - 27, 104), foot: P(CX - 30, 134) }
      ], ground: 136 };
    }
    var hipY = supportPose === 'sonkyo' ? 108 : 110;
    return { view: 'front', hip: P(CX, hipY), neck: P(CX, hipY - 41), head: P(CX, hipY - 52), legs: [
      { hip: P(CX + 7, hipY), knee: P(CX + 24, hipY - 10), foot: P(CX + 9, 132) },
      { hip: P(CX - 7, hipY), knee: P(CX - 24, hipY - 10), foot: P(CX - 9, 132) }
    ], ground: 134, heelsUp: supportPose === 'sonkyo' };
  }

  function side(base) { base.view = 'side'; return base; }

  function sideStanding(s) {
    var walking = s.pose.posture === 'walking' || s.pose.lowerBody.legRelation === 'stepping';
    var legs = walking
      ? [{ hip: P(64, 76), knee: P(71, 104), foot: P(76, 134) }, { hip: P(62, 76), knee: P(58, 105), foot: P(48, 133) }]
      : [{ hip: P(64, 76), knee: P(65, 105), foot: P(64, 134) }, { hip: P(62, 76), knee: P(62, 105), foot: P(60, 134) }];
    return side({ hip: P(63, 76), neck: P(63, 33), head: P(64, 22), legs: legs, ground: 136 });
  }

  function sideSitting(s) {
    var crossed = s.pose.lowerBody.legRelation === 'seated_crossed';
    var hip = P(52, 92);
    var legs = [
      { hip: P(53, 92), knee: P(80, 92), foot: P(81, 124) },
      { hip: P(51, 92), knee: P(78, 93), foot: P(78, 124) }
    ];
    if (crossed) legs[0] = { hip: P(53, 91), knee: P(80, 86), foot: P(96, 104) };
    var surface = s.pose.support.type;
    var props = [];
    if (surface === 'bed_surface') props.push({ kind: 'bed', x: 14, y: 96, w: 100, h: 14 });
    else if (surface === 'sofa_surface') props.push({ kind: 'seat', x: 30, y: 96, w: 52, h: 12 }, { kind: 'backrest', x: 26, y: 60, w: 8, h: 48 });
    else props.push({ kind: 'seat', x: 34, y: 96, w: 44, h: 6 });
    return side({ hip: hip, neck: P(52, 50), head: P(53, 39), legs: legs, ground: 126, props: props });
  }

  function sideKneelingUpright() {
    return side({ hip: P(60, 92), neck: P(60, 50), head: P(61, 39), legs: [
      { hip: P(61, 92), knee: P(62, 122), foot: P(38, 125) },
      { hip: P(59, 92), knee: P(59, 122), foot: P(35, 125) }
    ], ground: 126 });
  }

  function sideOneKnee() {
    return side({ hip: P(56, 92), neck: P(57, 50), head: P(58, 39), legs: [
      { hip: P(57, 92), knee: P(82, 98), foot: P(82, 124) },
      { hip: P(55, 92), knee: P(56, 123), foot: P(32, 125) }
    ], ground: 126 });
  }

  function sideCrouch() {
    return side({ hip: P(52, 108), neck: P(66, 70), head: P(72, 60), legs: [
      { hip: P(53, 108), knee: P(76, 96), foot: P(66, 126) },
      { hip: P(51, 108), knee: P(73, 98), foot: P(63, 126) }
    ], ground: 128 });
  }

  // 支え方・特殊姿勢は、形そのものが見分けどころなので骨格を個別に持つ（腕の支点も含む）
  var SPECIAL = {
    hands_and_knees: function () { return side({ hip: P(44, 96), neck: P(84, 92), head: P(95, 86), legs: [
      { hip: P(45, 96), knee: P(46, 124), foot: P(22, 126) }, { hip: P(43, 96), knee: P(43, 124), foot: P(19, 126) }
    ], ground: 127, supports: { hands: [P(86, 125), P(83, 125)] } }); },
    forward_lean_support: function () { return side({ hip: P(46, 100), neck: P(78, 78), head: P(88, 71), legs: [
      { hip: P(47, 100), knee: P(48, 124), foot: P(24, 126) }, { hip: P(45, 100), knee: P(45, 124), foot: P(21, 126) }
    ], ground: 127, supports: { hands: [P(84, 125), P(81, 125)] } }); },
    leaning_forward_on_hands: function () { return side({ hip: P(50, 74), neck: P(86, 62), head: P(97, 57), legs: [
      { hip: P(51, 74), knee: P(51, 104), foot: P(47, 134) }, { hip: P(49, 74), knee: P(46, 104), foot: P(40, 134) }
    ], ground: 136, props: [{ kind: 'table', x: 84, y: 88, w: 42, h: 6 }], supports: { hands: [P(97, 87), P(94, 87)] } }); },
    kneeling_bow: function () { return side({ hip: P(46, 112), neck: P(80, 116), head: P(91, 120), legs: [
      { hip: P(47, 112), knee: P(70, 126), foot: P(40, 127) }, { hip: P(45, 112), knee: P(67, 126), foot: P(37, 127) }
    ], ground: 128, supports: { hands: [P(98, 127), P(95, 127)] } }); },
    leapfrog_base: function () { return side({ hip: P(50, 82), neck: P(88, 86), head: P(99, 90), legs: [
      { hip: P(51, 82), knee: P(60, 108), foot: P(55, 134) }, { hip: P(49, 82), knee: P(57, 108), foot: P(51, 134) }
    ], ground: 136 }); },
    forward_bend: function () { return side({ hip: P(60, 76), neck: P(70, 112), head: P(68, 123), legs: [
      { hip: P(61, 76), knee: P(61, 105), foot: P(61, 134) }, { hip: P(59, 76), knee: P(59, 105), foot: P(58, 134) }
    ], ground: 136 }); },
    standing_split: function () {
      // I字バランスは脚を体の横へ上げるので、正面から描く
      return { view: 'front', hip: P(CX, 80), neck: P(CX - 4, 37), head: P(CX - 7, 26), legs: [
        { hip: P(CX + 6, 80), knee: P(CX + 15, 51), foot: P(CX + 19, 20) }, { hip: P(CX - 6, 80), knee: P(CX - 7, 107), foot: P(CX - 7, 134) }
      ], ground: 136 };
    },
    bridge_pose: function () { return side({ hip: P(56, 82), neck: P(86, 104), head: P(92, 116), arch: P(70, 74), legs: [
      { hip: P(57, 82), knee: P(38, 100), foot: P(30, 130) }, { hip: P(55, 82), knee: P(35, 101), foot: P(27, 130) }
    ], ground: 132, supports: { hands: [P(96, 130), P(93, 130)] } }); }
  };

  function lying(s) {
    var orient = s.pose.lyingOrientation, sp = s.pose.supportPose, bent = s.pose.lowerBody.knee;
    var bed = { kind: s.pose.support.type === 'bed_surface' ? 'bed' : 'floor', x: 8, y: 112, w: 116, h: 12 };
    if (orient === 'prone') {
      var up = sp === 'propped_up';
      var shoulderY = up ? 82 : 92;
      return side({ hip: P(78, 108), neck: P(42, shoulderY), head: P(30, shoulderY - 9), facing: -1, legs: [
        { hip: P(78, 108), knee: P(104, 109), foot: bent === 'both_bent' ? P(110, 88) : P(126, 108) },
        { hip: P(77, 108), knee: P(102, 110), foot: bent === 'both_bent' || bent === 'one_bent' ? P(104, 90) : P(124, 109) }
      ], ground: 112, props: [bed], supports: { hands: up ? [P(44, 110), P(38, 110)] : [P(24, 108), P(20, 108)], elbows: up ? null : [P(36, 110), P(33, 110)] } });
    }
    // 仰向け・横向き（上から見ると顔がこちらを向く）
    var oneBent = bent === 'one_bent' || bent === 'both_bent';
    return side({ hip: P(78, 104), neck: P(36, 104), head: P(24, 102), facing: -1, lyingFace: true, legs: [
      { hip: P(78, 104), knee: oneBent ? P(96, 90) : P(102, 105), foot: oneBent ? P(112, 106) : P(126, 106) },
      { hip: P(77, 105), knee: bent === 'both_bent' ? P(94, 92) : P(101, 106), foot: bent === 'both_bent' ? P(110, 107) : P(125, 107) }
    ], ground: 110, props: [bed] });
  }

  /*
   * モード系の身体配置（data/editorial.js の figure）。未選択・特殊姿勢・寝姿・基本姿勢の食い違いでは null を返し、
   * 従来の図をそのまま描く（既存プリセットの図は1文字も変わらない）。
   */
  function editorialSpec(s) {
    var D = PCW.data, id = s.pose.editorialPose;
    if (!id || id === 'none' || !D || !D.editorialPoses) return null;
    var p = D.editorialPoses.filter(function (x) { return x.id === id; })[0];
    if (!p || !p.figure) return null;
    if (SPECIAL[s.pose.supportPose] || s.pose.posture === 'reclining' || (s.pose.lyingOrientation && s.pose.lyingOrientation !== 'none')) return null;
    if (p.postures && p.postures.indexOf(s.pose.posture) < 0) return null;
    return p.figure;
  }
  // 床に座り、両手を骨盤の後ろへつく（横から）。手の支点を持つ。
  function floorSitBack() {
    return side({ hip: P(56, 121), neck: P(43, 82), head: P(40, 71), legs: [
      { hip: P(57, 121), knee: P(80, 103), foot: P(101, 124) }, { hip: P(55, 121), knee: P(77, 106), foot: P(97, 125) }
    ], ground: 126, supports: { hands: [P(35, 124), P(29, 123)] } });
  }

  /** 図の向き：その姿勢がいちばん見分けやすい向きを選ぶ */
  function chooseBase(s) {
    var pose = s.pose, sp = pose.supportPose, posture = pose.posture;
    if (SPECIAL[sp]) return SPECIAL[sp]();
    var ed = editorialSpec(s);
    if (ed && ed.base === 'floor_sit_back') return floorSitBack();
    if (posture === 'reclining' || sp === 'leaning_on_elbows' || sp === 'propped_up') return lying(s);
    if (sp === 'sonkyo' || sp === 'shiko_stance') return frontLowSquat(s, sp);
    if (posture === 'sitting') return sideSitting(s);
    if (posture === 'kneeling' || sp === 'kneeling_upright') return sideKneelingUpright(s);
    if (posture === 'one_knee_kneeling') return sideOneKnee(s);
    if (posture === 'crouching' || posture === 'squatting') return sideCrouch(s);
    if (posture === 'bridge') return SPECIAL.bridge_pose();
    if (pose.pelvis.orientation === 'side') return sideStanding(s);
    return frontStanding(s);
  }

  /* ------------------------------------------------------------------ */
  /* 2. 胴・肩・傾き・顔の向き                                            */
  /* ------------------------------------------------------------------ */

  function buildBody(s) {
    var b = chooseBase(s);
    var pose = s.pose;
    var facing = b.facing || 1;                  // side の図で人物が向く方向（+1：右）
    var orient = pose.pelvis.orientation;
    var back = b.view === 'front' && (orient === 'away' || orient === 'away_camera');
    var narrow = b.view === 'front' && (orient === 'three_quarter' || orient === 'side') ? 0.72 : 1;

    // 上半身の傾き（基本骨格に傾きが含まれる特殊姿勢には重ねない）
    var lean = pose.torso.lean;
    var upperRotation = 0;
    var ed = editorialSpec(s);
    var edFront = ed && b.view === 'front' ? ed : null;
    if (!SPECIAL[pose.supportPose] && pose.posture !== 'reclining') {
      if (b.view === 'side') upperRotation = facing * (lean === 'forward' ? 16 : lean === 'backward' ? -12 : 0);
      else if (lean === 'sideways') upperRotation = 8;
    }
    if (edFront && edFront.lean) upperRotation += edFront.lean;
    if (upperRotation) { b.neck = rotate(b.neck, b.hip, upperRotation); b.head = rotate(b.head, b.hip, upperRotation); }
    if (edFront && edFront.ribShift) { b.neck = add(b.neck, edFront.ribShift, 0); b.head = add(b.head, edFront.ribShift, 0); }
    if (edFront && edFront.fold) { b.neck = mid(b.hip, b.neck, 0.9); b.head = add(b.head, 0, 5); }
    var forwardInFront = b.view === 'front' && lean === 'forward';
    if (forwardInFront) { b.neck = mid(b.hip, b.neck, 0.94); b.head = add(b.head, 0, 3); }

    // 肩：正面では左右へ、横からでは1点（手前・奥の腕が同じ肩から出る）
    var toNeck = { x: b.neck.x - b.hip.x, y: b.neck.y - b.hip.y }, len = Math.hypot(toNeck.x, toNeck.y) || 1;
    var down = { x: -toNeck.x / len, y: -toNeck.y / len };              // 首から腰へ向かう単位ベクトル
    var shoulderCenter = add(b.neck, down.x * 3, down.y * 3);
    var shoulders;
    if (b.view === 'front') {
      var halfW = 13 * narrow;
      var perp = { x: -down.y, y: down.x };                            // 肩の左右方向
      var dropR = pose.shoulders.emphasis === 'one_lowered' ? 2 : 0;
      var sa = add(shoulderCenter, perp.x * halfW, perp.y * halfW), sb = add(shoulderCenter, -perp.x * halfW, -perp.y * halfW);
      shoulders = sa.x >= sb.x ? [sa, sb] : [sb, sa];          // [画面右（+1側）, 画面左]
      shoulders[0] = add(shoulders[0], 0, dropR);
      if (narrow < 1) b.legs.forEach(function (leg) { leg.hip = P(b.hip.x + (leg.hip.x - b.hip.x) * narrow, leg.hip.y); });
    } else {
      shoulders = [shoulderCenter, add(shoulderCenter, -facing * 1.5, 0)];
    }
    if (edFront) {
      var tilt = edFront.shoulderTilt || 0, hipTilt = edFront.hipTilt || 0;
      if (tilt) { shoulders[0] = add(shoulders[0], 0, -tilt / 2); shoulders[1] = add(shoulders[1], 0, tilt / 2); }
      if (hipTilt) { b.legs[0].hip = add(b.legs[0].hip, 0, -hipTilt / 2); b.legs[1].hip = add(b.legs[1].hip, 0, hipTilt / 2); }
      if (edFront.headShift) b.head = add(b.head, edFront.headShift, edFront.headDrop || 0);
    }
    b.shoulders = shoulders;            // [+1側（手前）, -1側（奥）]
    b.back = back;
    b.facing = facing;
    b.down = down;
    b.face = faceMarker(s, b);
    if (ed) {
      if (edFront && edFront.headTilt != null) b.face.tilt = edFront.headTilt;
      if (edFront && edFront.face) b.face.kind = edFront.face;
      b.editorial = ed;
    }
    return b;
  }

  /** 顔の印：front（両目）／three_quarter（両目を寄せる）／profile（片目と鼻）／back（後頭部） */
  function faceMarker(s, b) {
    var yaw = s.pose.head.yaw;
    var kind;
    if (b.view === 'front') {
      if (b.back) kind = yaw === 'over_shoulder' || yaw === 'side' ? 'profile' : 'back';
      else kind = yaw === 'side' ? 'profile' : yaw === 'slightly_away' ? 'three_quarter' : 'front';
    } else {
      if (b.lyingFace) kind = yaw === 'side' ? 'profile' : 'front';
      else kind = yaw === 'toward_camera' || yaw === 'over_shoulder' ? 'front' : yaw === 'slightly_away' ? 'three_quarter' : 'profile';
    }
    var pitch = s.pose.head.pitch === 'raised' ? -2 : s.pose.head.pitch === 'lowered' ? 2 : 0;
    var tilt = s.pose.head.tilt === 'pronounced' ? 14 : s.pose.head.tilt === 'slight' ? 7 : 0;
    var dir = b.view === 'side' ? b.facing : 1;
    return { kind: kind, pitch: pitch, tilt: tilt, dir: dir };
  }

  /* ------------------------------------------------------------------ */
  /* 3. 腕：手を置く場所 → 肘は2関節の計算で決める                         */
  /* ------------------------------------------------------------------ */

  function landmarks(b) {
    var h = b.head, d = b.down, f = b.view === 'side' ? b.facing : 0;
    var chest = add(b.neck, d.x * 11 + f * 5, d.y * 11);
    var belly = mid(b.neck, b.hip, 0.72);
    belly = add(belly, f * 6, 0);
    return {
      head: h, chest: chest, belly: belly,
      chin: add(h, f * 3, 8), mouth: add(h, f * 6, 4), eyes: add(h, f * 6, -1), cheek: add(h, f * 4, 3),
      hair: add(h, -f * 2, -7), overhead: P(h.x + f * 4, Math.max(h.y - 18, 5)),
      hip: b.hip, knees: b.legs.map(function (l) { return l.knee; }),
      thigh: b.legs.map(function (l) { return mid(l.hip, l.knee, 0.55); })
    };
  }

  // 片手の動作 → { to: 手を置く点, bend: 肘を寄せる方向, hidden: 体の陰, toward: 手前へ伸びる（短縮して描く） }
  function armTarget(action, side, b, L) {
    var front = b.view === 'front', f = b.facing, sh = b.shoulders[side > 0 ? 0 : 1];
    var out = front ? side : -f;            // 肘を逃がす向き：正面では外側、横からでは背中側
    switch (action) {
      case 'hand_on_hip': return { to: front ? add(b.hip, side * 9, -4) : add(b.hip, f * 2, -4), bend: out, elbowOut: 1.4 };
      case 'hand_near_chest': return { to: front ? add(L.chest, side * 2, 0) : add(L.chest, f * 4, 0), bend: front ? side : -f };
      case 'hand_touching_chin': return { to: front ? add(L.chin, side * 1, 0) : L.chin, bend: front ? side : -f };
      case 'hand_touching_cheek': return { to: front ? add(L.cheek, side * 6, 0) : L.cheek, bend: front ? side : -f };
      case 'hand_in_hair': return { to: front ? add(L.hair, side * 7, 0) : L.hair, bend: front ? side : -f, elbowOut: 1.3, hintY: -12 };
      case 'hand_near_face': return { to: front ? add(L.cheek, side * 9, 2) : add(L.mouth, f * 3, 2), bend: front ? side : -f };
      case 'hand_covering_eyes': return { to: front ? add(L.eyes, side * 2, 0) : L.eyes, bend: front ? side : -f };
      case 'hand_covering_mouth': return { to: front ? add(L.mouth, side * 1, 1) : L.mouth, bend: front ? side : -f };
      case 'finger_heart_near_face': return { to: front ? add(L.cheek, side * 13, 0) : add(L.mouth, f * 8, 0), bend: front ? side : -f };
      case 'hand_in_pocket': return { to: front ? add(b.hip, side * 10, 6) : add(b.hip, f * 2, 6), bend: out };
      case 'across_body': return { to: front ? add(L.belly, -side * 7, 2) : add(L.belly, f * 4, 0), bend: front ? side : -f };
      case 'behind_back': return { to: front ? add(b.hip, side * 3, -2) : add(b.hip, -f * 6, 0), bend: out, hidden: front };
      case 'reaching_forward': return front ? { to: add(sh, side * 6, 12), bend: side, toward: true } : { to: add(sh, f * 38, 4), bend: -1 * f };
      case 'reaching_forward_soft': return front ? { to: add(sh, side * 4, 16), bend: side, toward: true } : { to: add(sh, f * 34, 10), bend: -f };
      case 'pinching_toward_viewer': return front ? { to: add(sh, side * 4, 6), bend: side, toward: true } : { to: add(sh, f * 36, 0), bend: -f };
      case 'supporting_body': return { to: front ? add(b.hip, side * 16, 6) : add(b.hip, -f * 16, 4), bend: front ? side : f };
      case 'resting_on_thigh': return { to: front ? add(L.thigh[side > 0 ? 0 : 1], side * 2, 0) : L.thigh[0], bend: out };
      case 'partially_out': return { to: front ? add(sh, side * 44, 18) : add(sh, -f * 30, 26), bend: front ? 0 : -f, offFrame: true };
      case 'relaxed_at_side':
      default: return { to: front ? add(b.hip, side * 13, 12) : add(b.hip, f * 3, 10), bend: front ? side : -f, relaxed: true };
    }
  }

  // 両腕の複合動作 → [手前(+1)側, 奥(-1)側]
  function combinedTargets(id, b, L) {
    var front = b.view === 'front', f = b.facing, sup = b.supports && b.supports.hands;
    function pair(a, c) { return [a, c]; }
    switch (id) {
      case 'arms_crossed': return pair({ to: front ? add(L.chest, -6, 6) : add(L.chest, f * 4, 4), bend: 1 }, { to: front ? add(L.chest, 6, 9) : add(L.chest, f * 3, 7), bend: -1 });
      case 'hands_clasped': return pair({ to: front ? add(L.belly, 1, 2) : add(L.belly, f * 8, 0), bend: 1 }, { to: front ? add(L.belly, -1, 2) : add(L.belly, f * 8, 0), bend: -1 });
      case 'hands_behind_back': return pair({ to: front ? add(b.hip, 2, -3) : add(b.hip, -f * 7, -2), bend: 1, hidden: front }, { to: front ? add(b.hip, -2, -3) : add(b.hip, -f * 7, -2), bend: -1, hidden: front });
      case 'hands_on_lap': return pair({ to: front ? add(b.hip, 6, 10) : add(L.thigh[0], f * 4, -2), bend: front ? 1 : -f }, { to: front ? add(b.hip, -6, 10) : add(L.thigh[1], f * 2, -2), bend: front ? -1 : -f });
      case 'supporting_upper_body':
        if (sup) return pair({ to: sup[0], bend: -f }, { to: sup[1], bend: -f });
        return pair({ to: front ? add(b.hip, 16, 8) : add(b.hip, -f * 14, 6), bend: f }, { to: front ? add(b.hip, -16, 8) : add(b.hip, -f * 16, 6), bend: f });
      case 'heart_hands_near_face': return pair({ to: front ? add(L.cheek, 13, -6) : add(L.mouth, f * 12, -4), bend: 1 }, { to: front ? add(L.cheek, 9, -6) : add(L.mouth, f * 12, -4), bend: 1 });
      case 'arms_open_toward_viewer': return front
        ? pair({ to: add(b.shoulders[0], 26, 10), bend: 1, toward: true }, { to: add(b.shoulders[1], -26, 10), bend: -1, toward: true })
        : pair({ to: add(b.shoulders[0], f * 36, 0), bend: -f }, { to: add(b.shoulders[1], f * 34, 4), bend: -f });
      case 'palms_on_floor':
        if (sup) return pair({ to: sup[0], bend: -f }, { to: sup[1], bend: -f });
        return pair({ to: add(b.hip, f * 26, 16), bend: -f }, { to: add(b.hip, f * 24, 16), bend: -f });
      case 'hands_on_knees': return pair({ to: L.knees[0], bend: front ? 1 : -f }, { to: L.knees[1], bend: front ? -1 : -f });
      case 'arms_up': return front
        ? pair({ to: add(L.overhead, 4, 0), bend: 1, hintY: -20 }, { to: add(L.overhead, -4, 0), bend: -1, hintY: -20 })
        : pair({ to: add(L.overhead, 0, -2), bend: -f }, { to: add(L.overhead, -f * 2, -2), bend: -f });
      case 'holding_raised_ankle': { var foot = b.legs[0].foot; return pair({ to: add(foot, -1, 6), bend: 1 }, { to: add(foot, -3, 9), bend: -1 }); }
      case 'arms_hanging_down': return pair({ to: P(b.head.x + f * 2, b.ground - 4), bend: f }, { to: P(b.head.x, b.ground - 4), bend: f });
      case 'bridge_support':
        if (sup) return pair({ to: sup[0], bend: f }, { to: sup[1], bend: f });
        return null;
      default: return null;
    }
  }

  // 腕が未指定のときは、拘束・Viewerとのやりとり・姿勢から自然な位置を決める
  function implicitArms(s, b, L) {
    var placement = s.restraint && s.restraint.type !== 'none' ? s.restraint.placement : 'none';
    var front = b.view === 'front', f = b.facing;
    if (placement === 'wrists_front') return [{ to: front ? add(L.belly, 2, 4) : add(L.belly, f * 8, 4), bend: 1, mark: 'bound' }, { to: front ? add(L.belly, -2, 4) : add(L.belly, f * 8, 4), bend: -1 }];
    if (placement === 'wrists_behind') return [{ to: front ? add(b.hip, 2, -3) : add(b.hip, -f * 7, -2), bend: 1, hidden: front, mark: 'bound' }, { to: front ? add(b.hip, -2, -3) : add(b.hip, -f * 7, -2), bend: -1, hidden: front }];
    if (placement === 'wrists_overhead') return [{ to: add(L.overhead, 1, -2), bend: 1, hintY: -20, mark: 'bound' }, { to: add(L.overhead, -1, -2), bend: -1, hintY: -20 }];
    if (placement === 'chair_armrests') return [{ to: front ? add(b.hip, 16, -2) : add(b.hip, f * 14, -6), bend: front ? 1 : -f, mark: 'bound' }, { to: front ? add(b.hip, -16, -2) : add(b.hip, f * 12, -6), bend: front ? -1 : -f }];
    if (placement === 'one_wrist') return [{ to: front ? add(b.shoulders[0], 16, -30) : add(b.shoulders[0], f * 12, -30), bend: 1, hintY: -10, mark: 'bound' }, armTarget('relaxed_at_side', -1, b, L)];
    var hand = s.interaction && s.interaction.viewerHandInteraction;
    var map = { reaching: 'reaching_forward_soft', holding: 'reaching_forward', half_heart: 'finger_heart_near_face', hand_kiss: 'hand_covering_mouth', feeding: 'reaching_forward', cheek_touch: 'hand_touching_cheek' };
    var primary = map[hand] || null;
    var rest = s.pose.posture === 'sitting' ? 'resting_on_thigh' : 'relaxed_at_side';
    return [armTarget(primary || rest, 1, b, L), armTarget(rest, -1, b, L)];
  }

  /** 2関節の計算：肩から手までの距離に合わせて、肘を bendHint 側に置く */
  function solveArm(shoulder, target, bendHint, toward, hintY) {
    var a = toward ? UPPER * 0.62 : UPPER, c = toward ? FORE * 0.62 : FORE;
    var dx = target.x - shoulder.x, dy = target.y - shoulder.y, d = Math.hypot(dx, dy) || 0.001;
    var reach = Math.min(Math.max(d, Math.abs(a - c) + 0.5), a + c - 0.3);
    var ux = dx / d, uy = dy / d;
    var hand = P(shoulder.x + ux * reach, shoulder.y + uy * reach);
    var along = (a * a - c * c + reach * reach) / (2 * reach);
    var h = Math.sqrt(Math.max(a * a - along * along, 0));
    var base = P(shoulder.x + ux * along, shoulder.y + uy * along);
    var e1 = P(base.x - uy * h, base.y + ux * h), e2 = P(base.x + uy * h, base.y - ux * h);
    var hint = P(shoulder.x + (bendHint || 0) * 16, shoulder.y + (hintY == null ? 22 : hintY));   // 肘は基本的に下へ、指定があれば上へ
    var elbow = dist(e1, hint) <= dist(e2, hint) ? e1 : e2;
    return { shoulder: shoulder, elbow: elbow, hand: hand, upper: a, fore: c };
  }

  // モード系の腕：腕が未指定で、拘束・Viewerとの手のやりとりがないときだけ使う（利用者の腕指定を優先）
  function editorialTargets(s, b, L) {
    var ed = b.editorial;
    if (!ed || !ed.arms) return null;
    var arms = s.pose.arms;
    if ((arms.mode === 'combined' && arms.combined) || arms.primary.action || arms.secondary.action) return null;
    if (s.restraint && s.restraint.type !== 'none' && s.restraint.placement !== 'none') return null;
    if (s.interaction && s.interaction.viewerHandInteraction && s.interaction.viewerHandInteraction !== 'none') return null;
    var sup = b.supports && b.supports.hands;
    if (b.view !== 'front' && !(sup && ed.arms.every(function (t) { return t.support != null; }))) return null;
    return ed.arms.map(function (t, i) {
      if (t.support != null) return { to: sup[t.support], bend: -b.facing };
      function at(spec) { var a = spec.at === 'collar' ? add(b.neck, 0, 5) : spec.at === 'hip' ? b.hip : spec.at === 'shoulder' ? b.shoulders[i] : L[spec.at]; return add(a, spec.dx || 0, spec.dy || 0); }
      // elbow を持つ指定は例外用の個別調整（顔の前の前腕など、2関節の計算では置けない形）
      return { to: at(t), bend: t.bend, hintY: t.hintY, hidden: !!t.hidden, toward: !!t.toward, elbowOut: t.elbowOut, fixedElbow: t.elbow ? at(t.elbow) : null };
    });
  }

  function buildArms(s, b) {
    var L = landmarks(b), arms = s.pose.arms, targets;
    targets = editorialTargets(s, b, L);
    if (!targets && arms.mode === 'combined' && arms.combined) targets = combinedTargets(arms.combined, b, L);
    if (!targets) {
      var p = arms.primary.action, q = arms.secondary.action;
      if (!p && !q) targets = implicitArms(s, b, L);
      else {
        var rest = s.pose.posture === 'sitting' ? 'resting_on_thigh' : 'relaxed_at_side';
        targets = [armTarget(p || rest, 1, b, L), armTarget(q || rest, -1, b, L)];
      }
    }
    return targets.map(function (t, i) {
      var shoulder = b.shoulders[i];
      var hint = b.view === 'front' ? (t.bend || (i === 0 ? 1 : -1)) * (t.elbowOut || 1) : (t.bend || -b.facing);
      var solved = t.fixedElbow ? { shoulder: shoulder, elbow: t.fixedElbow, hand: t.to, upper: dist(shoulder, t.fixedElbow), fore: dist(t.fixedElbow, t.to) } : solveArm(shoulder, t.to, hint, t.toward, t.hintY);
      solved.near = i === 0;
      solved.hidden = !!t.hidden;
      solved.toward = !!t.toward;
      solved.offFrame = !!t.offFrame;
      solved.mark = t.mark || null;
      return solved;
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. 撮影範囲の枠とカメラの高さ                                         */
  /* ------------------------------------------------------------------ */

  var SHOT_PARTS = {
    face_close_up: ['head'], headshot: ['head', 'neck'], bust_shot: ['head', 'neck', 'shoulders', 'chest'],
    upper_body: ['head', 'neck', 'shoulders', 'chest', 'belly'], waist_up: ['head', 'neck', 'shoulders', 'chest', 'belly', 'hip'],
    knee_up: ['head', 'neck', 'shoulders', 'chest', 'belly', 'hip', 'knees'], full_body: 'all', wide: 'all'
  };
  function bbox(points) {
    var xs = points.map(function (p) { return p.x; }), ys = points.map(function (p) { return p.y; });
    return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
  }
  function cropFor(s, b, arms) {
    var shot = s.camera.shotSize;
    if (!shot) return null;
    var L = landmarks(b);
    var parts = SHOT_PARTS[shot];
    var pts = [];
    var headBox = [add(b.head, -HEAD_R, -HEAD_R), add(b.head, HEAD_R, HEAD_R)];
    if (parts === 'all') {
      pts = headBox.concat([b.neck, b.hip], b.shoulders, b.legs.map(function (l) { return l.knee; }), b.legs.map(function (l) { return l.foot; }), arms.filter(function (a) { return !a.offFrame; }).map(function (a) { return a.hand; }));
      if (b.arch) pts.push(b.arch);
    } else {
      parts.forEach(function (part) {
        if (part === 'head') pts = pts.concat(headBox);
        else if (part === 'neck') pts.push(b.neck);
        else if (part === 'shoulders') pts = pts.concat(b.shoulders);
        else if (part === 'chest') pts.push(L.chest);
        else if (part === 'belly') pts.push(L.belly);
        else if (part === 'hip') pts.push(b.hip);
        else if (part === 'knees') pts = pts.concat(L.knees);
      });
    }
    var box = bbox(pts);
    var pad = shot === 'wide' ? 14 : shot === 'full_body' ? 5 : 4;
    box = { x0: box.x0 - pad, y0: box.y0 - pad, x1: box.x1 + pad, y1: box.y1 + pad };
    // 縦長の画面（3:4）を基本に、足りない方向を広げる
    var w = box.x1 - box.x0, h = box.y1 - box.y0, ratio = 0.75;
    if (w / h < ratio) { var grow = (h * ratio - w) / 2; box.x0 -= grow; box.x1 += grow; }
    else { var growY = (w / ratio - h) / 2; box.y0 -= growY; box.y1 += growY; }
    var rollDeg = s.camera.roll === 'dutch' ? -10 : s.camera.roll === 'slight_dutch' ? -5 : 0;
    return { x: round(box.x0), y: round(box.y0), w: round(box.x1 - box.x0), h: round(box.y1 - box.y0), roll: rollDeg };
  }

  var ELEVATION_Y = { eye_level: 'eye', slightly_low: 'chest', low: 'ground', slightly_high: 'above', high: 'high', top_down: 'top' };
  function cameraFor(s, b) {
    var e = s.camera.elevation || 'eye_level';
    var y = { eye: b.head.y, chest: mid(b.neck, b.hip, 0.6).y, ground: b.ground - 6, above: Math.max(b.head.y - 18, 8), high: 6, top: 4 }[ELEVATION_Y[e] || 'eye'];
    if (e === 'top_down') return { x: b.hip.x, y: 6, aim: 90, elevation: e };
    var target = e === 'low' || e === 'slightly_low' ? mid(b.head, b.hip, 0.3) : e === 'eye_level' ? b.head : mid(b.head, b.hip, 0.5);
    var x = 9;
    var aim = Math.atan2(target.y - y, target.x - x) * 180 / Math.PI;
    return { x: x, y: Math.min(Math.max(y, 6), H - 10), aim: Math.round(aim), elevation: e };
  }

  /* ------------------------------------------------------------------ */
  /* 5. 組み立てと描画                                                   */
  /* ------------------------------------------------------------------ */

  var VIEW_LABELS = { front: '正面から', side: '横から', back: '背面から' };

  function compute(rawState) {
    var s = PCW.state && PCW.state.normalize ? PCW.state.normalize(rawState) : rawState;
    if (!s.pose.posture) return null;
    var b = buildBody(s);
    var arms = buildArms(s, b);
    var viewKey = b.back ? 'back' : b.view;
    return {
      view: b.view, viewKey: viewKey, viewLabel: VIEW_LABELS[viewKey],
      head: b.head, neck: b.neck, hip: b.hip, arch: b.arch || null, shoulders: b.shoulders, legs: b.legs, arms: arms,
      face: b.face, ground: b.ground, props: b.props || [], heelsUp: !!b.heelsUp, facing: b.facing,
      crop: cropFor(s, b, arms), camera: cameraFor(s, b),
      editorial: b.editorial ? { near: b.editorial.near || null, twist: b.editorial.twist || 0, axes: b.view === 'front' } : null
    };
  }

  function line(a, b, cls) { return '<line class="' + cls + '" x1="' + round(a.x) + '" y1="' + round(a.y) + '" x2="' + round(b.x) + '" y2="' + round(b.y) + '"/>'; }
  function poly(points, cls) { return '<polyline class="' + cls + '" points="' + points.map(function (p) { return round(p.x) + ',' + round(p.y); }).join(' ') + '"/>'; }

  function faceSvg(m) {
    var h = m.head, f = m.face, dy = f.pitch, d = f.dir;
    var g = '<g transform="rotate(' + (f.tilt * d) + ' ' + round(h.x) + ' ' + round(h.y) + ')">';
    if (f.kind === 'front') g += '<circle class="pf-eye" cx="' + round(h.x - 3) + '" cy="' + round(h.y + dy) + '" r="1.1"/><circle class="pf-eye" cx="' + round(h.x + 3) + '" cy="' + round(h.y + dy) + '" r="1.1"/>';
    else if (f.kind === 'three_quarter') g += '<circle class="pf-eye" cx="' + round(h.x + d * 1) + '" cy="' + round(h.y + dy) + '" r="1.1"/><circle class="pf-eye" cx="' + round(h.x + d * 5.5) + '" cy="' + round(h.y + dy) + '" r="1.1"/>';
    else if (f.kind === 'profile') g += '<circle class="pf-eye" cx="' + round(h.x + d * 4) + '" cy="' + round(h.y + dy - 0.5) + '" r="1.1"/><path class="pf-nose" d="M' + round(h.x + d * 7.6) + ' ' + round(h.y + dy) + ' l' + (d * 2.6) + ' 2.2 l' + (-d * 2.4) + ' 0.8"/>';
    else g += '<path class="pf-hair" d="M' + round(h.x - 7) + ' ' + round(h.y - 1) + ' Q' + round(h.x) + ' ' + round(h.y + 6) + ' ' + round(h.x + 7) + ' ' + round(h.y - 1) + '"/>';
    return g + '</g>';
  }

  // モード系の補助線：肩の線と骨盤の線を延長して角度差を見せ、いちばん手前の部位に印、胸郭の回り込みに矢印を付ける
  function editorialSvg(m) {
    var e = m.editorial, g = '<g class="pf-editorial">';
    function ext(a, b, k) { var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return [add(a, -dx / l * k, -dy / l * k), add(b, dx / l * k, dy / l * k)]; }
    if (e.axes) {
      var sh = ext(m.shoulders[1], m.shoulders[0], 7), hp = ext(m.legs[1].hip, m.legs[0].hip, 9);
      g += line(sh[0], sh[1], 'pf-axis') + line(hp[0], hp[1], 'pf-axis');
    }
    if (e.near) {
      var parts = e.near.split(':'), arm = m.arms[Number(parts[1]) || 0];
      var pt = parts[0] === 'shoulder' ? m.shoulders[Number(parts[1]) || 0] : arm && arm[parts[0]];
      if (pt) g += '<circle class="pf-near" cx="' + round(pt.x) + '" cy="' + round(pt.y) + '" r="4.6"/>';
    }
    if (e.twist) {
      var c = mid(m.neck, m.hip, 0.3), d = e.twist > 0 ? 1 : -1, r = 15;
      var a0 = add(c, -d * r, 2), a1 = add(c, d * r, 2);
      g += '<path class="pf-twist" d="M' + round(a0.x) + ' ' + round(a0.y) + ' Q' + round(c.x) + ' ' + round(c.y + 9) + ' ' + round(a1.x) + ' ' + round(a1.y) + '"/>' +
        '<path class="pf-twist pf-twist-head" d="M' + round(a1.x - d * 4) + ' ' + round(a1.y - 1) + ' L' + round(a1.x) + ' ' + round(a1.y) + ' L' + round(a1.x - d * 2) + ' ' + round(a1.y + 4) + '"/>';
    }
    return g + '</g>';
  }

  function cameraSvg(c) {
    return '<g class="pf-camera" transform="translate(' + c.x + ' ' + round(c.y) + ') rotate(' + c.aim + ')"><rect x="-5" y="-3.5" width="8" height="7" rx="1.5"/><path d="M3 -2 L7 -3.5 L7 3.5 L3 2 Z"/></g>';
  }

  function svg(rawState, opts) {
    opts = opts || {};
    var m = compute(rawState);
    var size = opts.size || 'card';
    var title = opts.title ? '<title>' + String(opts.title).replace(/[<&>]/g, '') + '</title>' : '';
    if (!m) return '<svg class="pose-figure pose-figure--' + size + ' pose-figure--empty" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="姿勢が未選択です">' + title + '<text x="65" y="78" text-anchor="middle" class="pf-empty">姿勢を選ぶと図が出ます</text></svg>';
    var out = [];
    // 支える面
    (m.props || []).forEach(function (p) { out.push('<rect class="pf-prop pf-prop--' + p.kind + '" x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="2"/>'); });
    out.push(line(P(6, m.ground), P(W - 6, m.ground), 'pf-ground'));
    // 奥の腕・脚
    var farArms = m.arms.filter(function (a) { return !a.near; }), nearArms = m.arms.filter(function (a) { return a.near; });
    function legSvg(leg, cls) { return poly([leg.hip, leg.knee, leg.foot], cls); }
    function armSvg(a, cls) {
      var c = cls + (a.hidden ? ' pf-hidden' : '') + (a.toward ? ' pf-toward' : '');
      var s = poly([a.shoulder, a.elbow, a.hand], c);
      s += '<circle class="pf-hand' + (a.toward ? ' pf-hand--toward' : '') + (a.hidden ? ' pf-hidden' : '') + '" cx="' + round(a.hand.x) + '" cy="' + round(a.hand.y) + '" r="' + (a.toward ? 3.2 : 2.2) + '"/>';
      if (a.mark === 'bound') s += '<circle class="pf-bound" cx="' + round(a.hand.x) + '" cy="' + round(a.hand.y) + '" r="4.2"/>';
      return s;
    }
    var farCls = m.view === 'side' ? 'pf-limb pf-far' : 'pf-limb';
    out.push(legSvg(m.legs[1], farCls));
    farArms.forEach(function (a) { if (m.view === 'side' || a.hidden) out.push(armSvg(a, farCls)); });
    // 胴（ブリッジは弓なり）
    if (m.arch) out.push('<path class="pf-torso" d="M' + round(m.hip.x) + ' ' + round(m.hip.y) + ' Q' + round(m.arch.x) + ' ' + round(m.arch.y - 12) + ' ' + round(m.neck.x) + ' ' + round(m.neck.y) + '"/>');
    else out.push(line(m.hip, m.neck, 'pf-torso'));
    if (m.view === 'front') out.push(line(m.shoulders[0], m.shoulders[1], 'pf-shoulder'), line(m.legs[0].hip, m.legs[1].hip, 'pf-shoulder'));
    out.push(legSvg(m.legs[0], 'pf-limb'));
    farArms.forEach(function (a) { if (m.view !== 'side' && !a.hidden) out.push(armSvg(a, 'pf-limb')); });
    if (m.heelsUp) m.legs.forEach(function (leg) { out.push(line(leg.foot, add(leg.foot, 0, 3), 'pf-limb pf-heel')); });
    // 首と頭
    var neckTop = mid(m.neck, m.head, 0.35);
    out.push(line(m.neck, neckTop, 'pf-torso'));
    out.push('<circle class="pf-head' + (m.face.kind === 'back' ? ' pf-head--back' : '') + '" cx="' + round(m.head.x) + '" cy="' + round(m.head.y) + '" r="' + HEAD_R + '"/>');
    out.push(faceSvg(m));
    nearArms.forEach(function (a) { out.push(armSvg(a, 'pf-limb')); });
    if (m.editorial) out.push(editorialSvg(m));
    var body = out.join('');
    // 撮影範囲：枠の外を薄くし、枠を点線で示す
    var overlay = '';
    if (m.crop && opts.crop !== false) {
      var c = m.crop, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      var tr = c.roll ? ' transform="rotate(' + c.roll + ' ' + round(cx) + ' ' + round(cy) + ')"' : '';
      overlay = '<g' + tr + '><path class="pf-outside" fill-rule="evenodd" d="M-60 -60 H' + (W + 60) + ' V' + (H + 60) + ' H-60 Z M' + c.x + ' ' + c.y + ' h' + c.w + ' v' + c.h + ' h-' + c.w + ' Z"/><rect class="pf-crop" x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="3"/></g>';
    }
    var camera = opts.camera === false ? '' : cameraSvg(m.camera);
    var label = opts.label ? '<text class="pf-label" x="' + (W - 4) + '" y="' + (H - 3) + '" text-anchor="end">' + m.viewLabel + '</text>' : '';
    var aria = opts.ariaLabel || ('棒人間の模式図（' + m.viewLabel + '）');
    return '<svg class="pose-figure pose-figure--' + size + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + aria + '">' + title + body + overlay + camera + label + '</svg>';
  }

  PCW.figure = {
    compute: compute,
    svg: svg,
    viewLabels: VIEW_LABELS,
    size: { width: W, height: H },
    armLengths: { upper: UPPER, fore: FORE },
    note: '図は設計の目安です。生成結果を保証するものではありません。左右は反転することがあります。'
  };
})(window);
