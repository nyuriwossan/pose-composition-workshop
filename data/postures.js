(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  D.postures = [
    { id: 'standing', labelJa: '立つ', compact: 'standing', detailed: 'stands', group: 'basic' },
    { id: 'sitting', labelJa: '座る', compact: 'sitting', detailed: 'sits', group: 'basic' },
    { id: 'walking', labelJa: '歩く', compact: 'walking', detailed: 'walks', group: 'basic' },
    { id: 'kneeling', labelJa: '膝をつく', compact: 'kneeling', detailed: 'kneels', group: 'basic' },
    { id: 'one_knee_kneeling', labelJa: '片膝をつく', compact: 'kneeling on one knee', detailed: 'kneels on one knee', group: 'detail' },
    { id: 'crouching', labelJa: 'しゃがむ', compact: 'crouching', detailed: 'crouches', group: 'basic' },
    { id: 'squatting', labelJa: '腰を落としてしゃがむ', compact: 'in a low squat', detailed: 'holds a low squat', group: 'detail' },
    { id: 'reclining', labelJa: '横たわる', compact: 'reclining', detailed: 'reclines', group: 'basic' }
  ];

  D.motionStates = [
    { id: 'static', labelJa: '静止', compact: 'in a still pose', detailed: 'The pose is still and settled.' },
    { id: 'preparing', labelJa: '動き出す前', compact: 'preparing to move', detailed: 'The body is poised to move.' },
    { id: 'mid_motion', labelJa: '動作の途中', compact: 'captured mid-motion', detailed: 'The figure is captured in the middle of a movement.' },
    { id: 'turning', labelJa: '振り向く途中', compact: 'turning through the torso', detailed: 'The torso is caught while turning.' },
    { id: 'reaching', labelJa: '手を伸ばす途中', compact: 'reaching forward', detailed: 'The figure reaches forward.' },
    { id: 'rising', labelJa: '立ち上がる途中', compact: 'rising from a lowered position', detailed: 'The figure is rising from a lowered position.' },
    { id: 'lowering', labelJa: '腰を落とす途中', compact: 'lowering the body', detailed: 'The figure is lowering the body.' }
  ];

  D.supportTypes = [
    { id: 'unsupported', labelJa: '支えなし', compact: '', detailed: '' },
    { id: 'supported_behind', labelJa: '後ろから支えられる', compact: 'supported from behind', detailed: 'The body is supported from behind.' },
    { id: 'supported_one_arm', labelJa: '片腕で支える', compact: 'supported by one arm', detailed: 'One arm supports the body.' },
    { id: 'leaning_surface', labelJa: '面にもたれる', compact: 'leaning on a surface', detailed: 'The body leans against a surface.' },
    { id: 'seated_surface', labelJa: '面に座る', compact: 'seated on a surface', detailed: 'The figure is seated on a surface.' }
  ];
})(window);
