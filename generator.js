(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data;
  var S = PCW.state;

  function selected(list, id) { return S.option(list, id); }
  function push(arr, value) { if (value && arr.indexOf(value) < 0) arr.push(value); }
  function sentence(value) {
    var text = String(value || '').trim().replace(/\s+/g, ' ').replace(/[.]+$/g, '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) + '.' : '';
  }
  function visible(zone, shot) { return !PCW.advisor.hidden(zone, shot); }
  function reachesViewer(id) { return ['reaching_forward', 'reaching_forward_soft', 'pinching_toward_viewer'].indexOf(id) >= 0; }
  function armBlock(s) {
    var compact = [], detailed = [];
    var arms = s.pose.arms;
    if (arms.mode === 'combined' && arms.combined) {
      var combined = selected(D.combinedArms, arms.combined);
      if (combined && !PCW.advisor.armHidden(combined, s.camera.shotSize)) {
        push(compact, combined.prompt.compact);
        push(detailed, combined.prompt.detailed);
      }
      return { compact: compact, detailed: detailed };
    }
    [['primary', 'One'], ['secondary', 'The other']].forEach(function (pair) {
      var item = selected(D.armActions, arms[pair[0]].action);
      if (!item || PCW.advisor.armHidden(item, s.camera.shotSize)) return;
      var viewerReach = s.interaction.target === 'viewer' && s.interaction.approach === 'reach_toward' && reachesViewer(item.id);
      if (viewerReach && item.id === 'reaching_forward') {
        push(compact, pair[0] === 'primary' ? 'one arm reaching toward the viewer' : 'the other arm reaching toward the viewer');
        push(detailed, pair[1] + ' arm reaches toward the viewer.');
        return;
      }
      var c = item.prompt.compact;
      if (pair[0] === 'primary') c = 'one ' + c;
      else c = 'the other ' + c;
      push(compact, c);
      var d = item.prompt.detailed.replace(/^The arm/, pair[1] + ' arm').replace(/^The hand/, pair[1] + ' hand');
      push(detailed, d);
    });
    return { compact: compact, detailed: detailed };
  }
  function blocks(raw) {
    var s = S.normalize(raw);
    var b = {
      subjectPosture: { compact: [], detailed: [], ja: [] },
      lowerBody: { compact: [], detailed: [], ja: [] },
      bodyFlow: { compact: [], detailed: [], ja: [] },
      arms: { compact: [], detailed: [], ja: [] },
      head: { compact: [], detailed: [], ja: [] },
      gaze: { compact: [], detailed: [], ja: [] },
      interaction: { compact: [], detailed: [], ja: [] },
      camera: { compact: [], detailed: [], ja: [] },
      composition: { compact: [], detailed: [], ja: [] },
      custom: { compact: [], detailed: [], ja: [] }
    };
    var posture = selected(D.postures, s.pose.posture);
    var motion = selected(D.motionStates, s.pose.motion.state);
    var support = selected(D.supportTypes, s.pose.support.type);
    var lying = selected(D.lyingOrientations, s.pose.lyingOrientation);
    var supportPose = selected(D.supportPoses, s.pose.supportPose);
    if (posture) {
      push(b.subjectPosture.compact, (s.output.includeSolo ? 'solo character ' : 'character ') + posture.compact);
      push(b.subjectPosture.detailed, 'A solo character ' + posture.detailed + '.');
      push(b.subjectPosture.ja, '基本姿勢：' + posture.labelJa);
    }
    if (motion && s.pose.motion.state !== 'static' && s.pose.motion.state !== 'mid_motion' || (motion && s.pose.motion.state === 'mid_motion' && s.pose.posture !== 'walking')) {
      push(b.subjectPosture.compact, motion.compact);
      push(b.subjectPosture.detailed, motion.detailed);
      push(b.subjectPosture.ja, '動作：' + motion.labelJa);
    } else if (motion) push(b.subjectPosture.ja, '動作：' + motion.labelJa);
    if (support && support.id !== 'unsupported' && support.id !== 'none') {
      push(b.subjectPosture.compact, support.compact); push(b.subjectPosture.detailed, support.detailed); push(b.subjectPosture.ja, '支持：' + support.labelJa);
    }
    if (lying && lying.id !== 'none') {
      push(b.subjectPosture.compact, lying.compact); push(b.subjectPosture.detailed, lying.detailed); push(b.subjectPosture.ja, '寝姿：' + lying.labelJa);
    }
    if (supportPose && supportPose.id !== 'none') {
      push(b.subjectPosture.compact, supportPose.compact); push(b.subjectPosture.detailed, supportPose.detailed); push(b.subjectPosture.ja, '支持姿勢：' + supportPose.labelJa);
    }

    if (visible('lowerBody', s.camera.shotSize)) {
      [[D.weights, s.pose.weight, '重心'], [D.stances, s.pose.lowerBody.stance, '足幅'], [D.legRelations, s.pose.lowerBody.legRelation, '脚'], [D.knees, s.pose.lowerBody.knee, '膝']].forEach(function (row) {
        var item = selected(row[0], row[1]);
        if (item) { push(b.lowerBody.compact, item.compact); push(b.lowerBody.detailed, item.detailed); push(b.lowerBody.ja, row[2] + '：' + item.labelJa); }
      });
    } else {
      var held = [selected(D.weights, s.pose.weight), selected(D.stances, s.pose.lowerBody.stance), selected(D.legRelations, s.pose.lowerBody.legRelation), selected(D.knees, s.pose.lowerBody.knee)].filter(Boolean);
      held.forEach(function (item) { push(b.lowerBody.ja, item.labelJa + '（画角外・保持中）'); });
    }

    if (visible('torso', s.camera.shotSize) || visible('shoulders', s.camera.shotSize)) {
      [[D.pelvisOrientations, s.pose.pelvis.orientation, '骨盤'], [D.pelvisShifts, s.pose.pelvis.shift, '腰'], [D.torsoRelations, s.pose.torso.relationToPelvis, '上半身'], [D.torsoLeans, s.pose.torso.lean, '傾き'], [D.shoulders, s.pose.shoulders.emphasis, '肩']].forEach(function (row) {
        var item = selected(row[0], row[1]);
        if (!item) return;
        var interactionOwnsLean = row[0] === D.torsoLeans && s.interaction.target === 'viewer' && ((s.interaction.approach === 'lean_toward' && item.id === 'forward') || (s.interaction.approach === 'lean_away' && item.id === 'backward'));
        if (interactionOwnsLean) { push(b.bodyFlow.ja, row[2] + '：' + item.labelJa); return; }
        if (row[2] !== '骨盤' || visible('torso', s.camera.shotSize)) push(b.bodyFlow.compact, item.compact);
        if (row[2] !== '骨盤' || visible('torso', s.camera.shotSize)) push(b.bodyFlow.detailed, item.detailed);
        push(b.bodyFlow.ja, row[2] + '：' + item.labelJa);
      });
    }

    var ab = armBlock(s);
    ab.compact.forEach(function (x) { push(b.arms.compact, x); });
    ab.detailed.forEach(function (x) { push(b.arms.detailed, x); });
    if (s.pose.arms.mode === 'combined') {
      var ca = selected(D.combinedArms, s.pose.arms.combined);
      if (ca) push(b.arms.ja, '両腕：' + ca.labelJa + (PCW.advisor.armHidden(ca, s.camera.shotSize) ? '（画角外・保持中）' : ''));
    } else {
      var pa = selected(D.armActions, s.pose.arms.primary.action), sa = selected(D.armActions, s.pose.arms.secondary.action);
      if (pa) push(b.arms.ja, '片方の手：' + pa.labelJa + (PCW.advisor.armHidden(pa, s.camera.shotSize) ? '（画角外・保持中）' : ''));
      if (sa) push(b.arms.ja, '反対の手：' + sa.labelJa + (PCW.advisor.armHidden(sa, s.camera.shotSize) ? '（画角外・保持中）' : ''));
    }

    [[D.headYaws, s.pose.head.yaw, '顔'], [D.headPitches, s.pose.head.pitch, '顎'], [D.headTilts, s.pose.head.tilt, '首']].forEach(function (row) {
      var item = selected(row[0], row[1]);
      if (item) { push(b.head.compact, item.compact); push(b.head.detailed, item.detailed); push(b.head.ja, row[2] + '：' + item.labelJa); }
    });
    [[D.eyeStates, s.pose.gaze.eyes, '目'], [D.gazeTargets, s.pose.gaze.target, '視線対象'], [D.gazeDirections, s.pose.gaze.direction, '視線方向']].forEach(function (row) {
      var item = selected(row[0], row[1]);
      if (item) { push(b.gaze.compact, item.compact); push(b.gaze.detailed, item.detailed); push(b.gaze.ja, row[2] + '：' + item.labelJa); }
    });

    if (s.interaction.target === 'viewer') {
      var distance = selected(D.interactionDistances, s.interaction.distance);
      var approach = selected(D.interactionApproaches, s.interaction.approach);
      var armReaches = s.interaction.approach === 'reach_toward' && [s.pose.arms.primary.action, s.pose.arms.secondary.action].some(reachesViewer);
      if (distance) { push(b.interaction.compact, distance.compact); push(b.interaction.detailed, distance.detailed); push(b.interaction.ja, '距離：' + distance.labelJa); }
      if (approach && !armReaches) { push(b.interaction.compact, approach.compact); push(b.interaction.detailed, approach.detailed); }
      if (approach) push(b.interaction.ja, '相手への動き：' + approach.labelJa);
      push(b.interaction.ja, '対象：画面外の相手');
    }

    [[D.shotSizes, s.camera.shotSize, '撮影範囲'], [D.elevations, s.camera.elevation, 'カメラ高さ'], [D.rolls, s.camera.roll, 'カメラ傾き']].forEach(function (row) {
      var item = selected(row[0], row[1]);
      if (item) { push(b.camera.compact, item.compact); push(b.camera.detailed, item.detailed); push(b.camera.ja, row[2] + '：' + item.labelJa); }
    });
    [[D.placements, s.composition.subjectPlacement, '人物配置'], [D.negativeSpaces, s.composition.negativeSpace, '余白'], [D.crops, s.composition.crop, 'クロップ'], [D.foregrounds, s.composition.foreground, '前景'], [D.depths, s.composition.depth, '奥行き'], [D.rhythms, s.composition.rhythm, '構図']].forEach(function (row) {
      var item = selected(row[0], row[1]);
      if (item) { push(b.composition.compact, item.compact); push(b.composition.detailed, item.detailed); push(b.composition.ja, row[2] + '：' + item.labelJa); }
    });
    if (s.output.customText) {
      b.custom.compact.push(s.output.customText);
      b.custom.detailed.push(s.output.customText);
      b.custom.ja.push('自由入力：' + s.output.customText);
    }
    return b;
  }

  function compact(raw) {
    var b = blocks(raw), out = [];
    Object.keys(b).forEach(function (key) { b[key].compact.forEach(function (x) { push(out, x); }); });
    return out.filter(Boolean).join(', ').replace(/,\s*,+/g, ',').replace(/^,\s*|,\s*$/g, '');
  }
  function detailed(raw) {
    var b = blocks(raw), groups = [];
    Object.keys(b).forEach(function (key) {
      var values = b[key].detailed.filter(Boolean);
      if (!values.length) return;
      if (key === 'custom') groups.push(values[0]);
      else groups.push(values.map(sentence).join(' '));
    });
    return groups.join(' ').replace(/\.\.+/g, '.').trim();
  }
  function structureJa(raw) {
    var b = blocks(raw), names = { subjectPosture: '姿勢', lowerBody: '下半身', bodyFlow: '身体の流れ', arms: '腕・手', head: '顔・首', gaze: '視線', interaction: '画面外の相手', camera: 'カメラ', composition: '構図', custom: '自由入力' };
    var lines = [];
    Object.keys(b).forEach(function (key) {
      if (b[key].ja.length) lines.push('【' + names[key] + '】\n' + b[key].ja.join('\n'));
    });
    return lines.join('\n\n');
  }
  PCW.generator = { blocks: blocks, compact: compact, detailed: detailed, structureJa: structureJa };
})(window);
