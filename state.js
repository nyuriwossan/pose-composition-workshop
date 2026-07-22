(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function merge(base, patch) {
    var out = clone(base);
    Object.keys(patch || {}).forEach(function (key) {
      if (isObject(patch[key]) && isObject(out[key])) out[key] = merge(out[key], patch[key]);
      else out[key] = clone(patch[key]);
    });
    return out;
  }
  function getPath(obj, path) {
    return String(path).split('.').reduce(function (cur, key) { return cur == null ? undefined : cur[key]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = String(path).split('.');
    var cur = obj;
    keys.slice(0, -1).forEach(function (key) {
      if (!isObject(cur[key])) cur[key] = {};
      cur = cur[key];
    });
    cur[keys[keys.length - 1]] = value;
    return obj;
  }
  function ids(list) { return (list || []).map(function (x) { return x.id; }); }
  function known(list, value, fallback) { return ids(list).indexOf(value) >= 0 ? value : fallback; }

  function initialState() {
    return {
      schemaVersion: '1.0',
      entryMode: 'guided',
      subject: { count: 1 },
      pose: {
        posture: null,
        motion: { state: 'static', action: null, phase: null, energy: 'low' },
        support: { type: 'unsupported' },
        lyingOrientation: 'none',
        supportPose: 'none',
        flowStyle: null,
        rearViewEmphasis: 'none',
        weight: null,
        lowerBody: { stance: null, legRelation: null, knee: null, footDirection: null },
        pelvis: { orientation: null, shift: 'none' },
        torso: { relationToPelvis: null, lean: 'neutral' },
        shoulders: { emphasis: null },
        arms: { mode: 'separate', primary: { action: null }, secondary: { action: null }, combined: null },
        head: { yaw: null, pitch: 'neutral', tilt: 'level' },
        gaze: { target: null, direction: null, eyes: 'open' },
        expression: 'none'
      },
      camera: { shotSize: null, elevation: 'eye_level', roll: 'level' },
      interaction: { target: 'none', distance: 'normal', approach: 'none' },
      composition: { subjectPlacement: 'centered', negativeSpace: 'none', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'stable' },
      output: { includeSolo: true, suppressTextSymbols: false, preserveClothing: false, backDesign: 'none', customText: '' },
      meta: { ignoredWarnings: [], updatedAt: null }
    };
  }

  function normalize(raw) {
    var base = initialState();
    var src = isObject(raw) ? raw : {};
    var s = merge(base, src);
    s.schemaVersion = '1.0';
    s.entryMode = ['guided', 'preset', 'detail'].indexOf(s.entryMode) >= 0 ? s.entryMode : 'guided';
    s.subject = { count: 1 };
    s.pose.posture = known(D.postures, s.pose.posture, null);
    s.pose.motion.state = known(D.motionStates, s.pose.motion.state, 'static');
    s.pose.support.type = known(D.supportTypes, s.pose.support.type, 'unsupported');
    s.pose.lyingOrientation = known(D.lyingOrientations, s.pose.lyingOrientation, 'none');
    s.pose.supportPose = known(D.supportPoses, s.pose.supportPose, 'none');
    s.pose.flowStyle = known(D.flowStyles, s.pose.flowStyle, null);
    s.pose.rearViewEmphasis = known(D.rearViewEmphases, s.pose.rearViewEmphasis, 'none');
    s.pose.weight = known(D.weights, s.pose.weight, null);
    s.pose.lowerBody.stance = known(D.stances, s.pose.lowerBody.stance, null);
    s.pose.lowerBody.legRelation = known(D.legRelations, s.pose.lowerBody.legRelation, null);
    s.pose.lowerBody.knee = known(D.knees, s.pose.lowerBody.knee, null);
    s.pose.lowerBody.footDirection = null;
    s.pose.pelvis.orientation = known(D.pelvisOrientations, s.pose.pelvis.orientation, null);
    s.pose.pelvis.shift = known(D.pelvisShifts, s.pose.pelvis.shift, 'none');
    s.pose.torso.relationToPelvis = known(D.torsoRelations, s.pose.torso.relationToPelvis, null);
    s.pose.torso.lean = known(D.torsoLeans, s.pose.torso.lean, 'neutral');
    s.pose.shoulders.emphasis = known(D.shoulders, s.pose.shoulders.emphasis, null);
    s.pose.arms.mode = s.pose.arms.mode === 'combined' ? 'combined' : 'separate';
    s.pose.arms.primary.action = known(D.armActions, s.pose.arms.primary.action, null);
    s.pose.arms.secondary.action = known(D.armActions, s.pose.arms.secondary.action, null);
    s.pose.arms.combined = known(D.combinedArms, s.pose.arms.combined, null);
    s.pose.head.yaw = known(D.headYaws, s.pose.head.yaw, null);
    s.pose.head.pitch = known(D.headPitches, s.pose.head.pitch, 'neutral');
    s.pose.head.tilt = known(D.headTilts, s.pose.head.tilt, 'level');
    s.pose.gaze.target = known(D.gazeTargets, s.pose.gaze.target, null);
    s.pose.gaze.direction = known(D.gazeDirections, s.pose.gaze.direction, null);
    s.pose.gaze.eyes = known(D.eyeStates, s.pose.gaze.eyes, 'open');
    s.pose.expression = known(D.expressions, s.pose.expression, 'none');
    s.camera.shotSize = known(D.shotSizes, s.camera.shotSize, null);
    s.camera.elevation = known(D.elevations, s.camera.elevation, 'eye_level');
    s.camera.roll = known(D.rolls, s.camera.roll, 'level');
    s.interaction.target = known(D.interactionTargets, s.interaction.target, 'none');
    s.interaction.distance = known(D.interactionDistances, s.interaction.distance, 'normal');
    s.interaction.approach = known(D.interactionApproaches, s.interaction.approach, 'none');
    if (s.interaction.target === 'none') {
      s.interaction.distance = 'normal';
      s.interaction.approach = 'none';
    }
    s.composition.subjectPlacement = known(D.placements, s.composition.subjectPlacement, 'centered');
    s.composition.negativeSpace = known(D.negativeSpaces, s.composition.negativeSpace, 'none');
    s.composition.crop = known(D.crops, s.composition.crop, 'none');
    s.composition.foreground = known(D.foregrounds, s.composition.foreground, 'none');
    s.composition.depth = known(D.depths, s.composition.depth, 'separated');
    s.composition.rhythm = known(D.rhythms, s.composition.rhythm, 'stable');
    s.output.includeSolo = s.output.includeSolo !== false;
    s.output.suppressTextSymbols = s.output.suppressTextSymbols === true;
    s.output.preserveClothing = s.output.preserveClothing === true;
    s.output.backDesign = known(D.backDesigns, s.output.backDesign, 'none');
    s.output.customText = typeof s.output.customText === 'string' ? s.output.customText : '';
    s.meta.ignoredWarnings = Array.isArray(s.meta.ignoredWarnings) ? s.meta.ignoredWarnings.filter(function (x) { return typeof x === 'string'; }).slice(0, 50) : [];
    s.meta.updatedAt = typeof s.meta.updatedAt === 'string' ? s.meta.updatedAt : null;
    return s;
  }

  function applyPatch(state, patch) {
    var next = clone(state || initialState());
    Object.keys(patch || {}).forEach(function (key) {
      if (key.indexOf('.') >= 0) setPath(next, key, patch[key]);
      else if (isObject(patch[key]) && isObject(next[key])) next[key] = merge(next[key], patch[key]);
      else next[key] = clone(patch[key]);
    });
    next.meta = next.meta || {};
    next.meta.updatedAt = new Date().toISOString();
    return normalize(next);
  }

  function applyPostureDefaults(state, posture) {
    var rec = D.guidedRecommendations[posture] || {};
    var patch = {
      'pose.posture': posture,
      'pose.weight': rec.weight || null,
      'pose.lowerBody.stance': rec.stance || null,
      'pose.lowerBody.legRelation': rec.legRelation || null,
      'pose.lowerBody.knee': rec.knee || null,
      'pose.pelvis.orientation': rec.pelvis || null,
      'pose.torso.relationToPelvis': rec.torso || null,
      'pose.shoulders.emphasis': rec.shoulder || null
    };
    if (rec.motion) patch['pose.motion.state'] = rec.motion;
    else if (posture !== 'walking') patch['pose.motion.state'] = 'static';
    return applyPatch(state, patch);
  }

  function applyFlowStyle(state, id) {
    var current = normalize(state);
    var patch = {
      natural: { 'pose.flowStyle': 'natural', 'pose.weight': current.pose.posture === 'standing' ? 'one_leg' : current.pose.weight, 'pose.pelvis.shift': 'slight', 'pose.torso.relationToPelvis': 'aligned', 'pose.shoulders.emphasis': 'relaxed' },
      confident: { 'pose.flowStyle': 'confident', 'pose.weight': current.pose.posture === 'standing' ? 'even' : current.pose.weight, 'pose.torso.relationToPelvis': 'aligned', 'pose.shoulders.emphasis': 'drawn_back', 'pose.head.pitch': 'raised' },
      relaxed: { 'pose.flowStyle': 'relaxed', 'pose.weight': current.pose.posture === 'standing' ? 'one_leg' : current.pose.weight, 'pose.shoulders.emphasis': 'relaxed', 'pose.torso.lean': 'neutral', 'pose.head.tilt': 'slight' },
      twist: { 'pose.flowStyle': 'twist', 'pose.pelvis.orientation': 'three_quarter', 'pose.torso.relationToPelvis': 'counter', 'pose.shoulders.emphasis': 'one_forward', 'pose.pelvis.shift': 'slight' }
    }[id];
    return patch ? applyPatch(current, patch) : current;
  }

  function designSummary(raw) {
    var s = normalize(raw);
    var arm = s.pose.arms.mode === 'combined' ? option(D.combinedArms, s.pose.arms.combined) : option(D.armActions, s.pose.arms.primary.action);
    return [
      option(D.postures, s.pose.posture),
      option(D.flowStyles, s.pose.flowStyle),
      option(D.weights, s.pose.weight),
      option(D.pelvisOrientations, s.pose.pelvis.orientation),
      arm,
      option(D.shotSizes, s.camera.shotSize)
    ].filter(Boolean).map(function (item) { return item.labelJa; }).join('・') || 'まだ設計されていません';
  }

  function option(list, id) { return (list || []).filter(function (item) { return item.id === id; })[0] || null; }
  function validForPosture(item, posture) { return !item || !item.postures || item.postures.indexOf(posture) >= 0; }

  PCW.state = {
    initial: initialState,
    normalize: normalize,
    applyPatch: applyPatch,
    applyPostureDefaults: applyPostureDefaults,
    applyFlowStyle: applyFlowStyle,
    designSummary: designSummary,
    clone: clone,
    merge: merge,
    getPath: getPath,
    setPath: setPath,
    option: option,
    validForPosture: validForPosture
  };
})(window);
