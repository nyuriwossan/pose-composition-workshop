(function (global) {
  'use strict';
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  function preset(id, nameJa, descriptionJa, patch, meta) {
    return { id: id, nameJa: nameJa, descriptionJa: descriptionJa, patch: patch, meta: meta || {} };
  }
  function unique(values) {
    return (values || []).filter(function (value, index, list) { return list.indexOf(value) === index; });
  }

  D.presetCollections = {
    basic: { labelJa: '基本ポーズ' },
    relationship: { labelJa: '恋人・親しい相手' }
  };
  D.presetAudienceTagLabels = {
    viewer_perspective: '相手視点',
    close_distance: '距離近め',
    upward_gaze: '見上げる',
    downward_gaze: '見下ろす',
    uke_like: '受け寄り',
    seme_like: '攻め寄り'
  };
  D.presetMoodTagLabels = {
    everyday: '日常',
    calm_intimacy: '穏やか',
    sweet: '甘め',
    playful: 'playful',
    assertive: '主導的',
    hesitant: 'ためらい',
    sensual: '色気'
  };
  D.presetSceneTagLabels = {
    walking: '歩きながら',
    sofa: 'ソファ',
    bed: 'ベッド',
    lying_down: '寝転び',
    affection_gesture: '愛情ジェスチャー'
  };

  var relationshipPresets = [
preset(
  "viewer_upward_soft_close",
  "見上げる受け寄りアップ",
  "上方にいる相手を、近い距離から柔らかく見上げる構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "hunched"
      },
      arms: {
        mode: "separate",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "none"
    },
    camera: {
      shotSize: "face_close_up",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "none",
      crop: "tight_face",
      foreground: "soft",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_downward_confident_close",
  "見下ろす攻め寄りアップ",
  "低い位置の相手へ身を寄せ、視線を落とす接近構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "lowered",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "downward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "headshot",
      elevation: "low",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "none",
      crop: "tight_face",
      foreground: "none",
      depth: "strong",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "seme_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_face_approach_close",
  "顔を近づける接近アップ",
  "正面の相手へ顔を寄せる、距離感を主役にしたアップ。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "headshot",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "tight_face",
      foreground: "soft",
      depth: "strong",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "close_distance"
    ]
  }
),
preset(
  "viewer_side_glance_close",
  "横顔気味で目だけ向けるアップ",
  "顔を少し外しながら、視線だけを相手へ戻す構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: null
      },
      head: {
        yaw: "slightly_away",
        pitch: "lowered",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "sidelong",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "bust_shot",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "none",
      foreground: "soft",
      depth: "separated",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "close_distance"
    ]
  }
),
preset(
  "viewer_cheek_touch_close",
  "頬に手を添えた接近アップ",
  "頬に片手を添え、近い相手へ視線を向ける構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_touching_cheek"
        },
        secondary: {
          action: null
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "none"
    },
    camera: {
      shotSize: "bust_shot",
      elevation: "slightly_high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "soft",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_chest_hand_upward_half",
  "胸元に手を添えて見上げる半身",
  "身体を少し引き、胸元へ手を添えて相手を見上げる構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "away_camera",
        lean: "backward"
      },
      shoulders: {
        emphasis: "hunched"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "across_body"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_away"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "soft",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_leaning_down_half",
  "前かがみで見下ろす半身",
  "相手へ上半身を寄せ、低い位置へ視線を落とす構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_on_hip"
        },
        secondary: {
          action: "partially_out"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "lowered",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "downward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "low",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "none",
      crop: "none",
      foreground: "none",
      depth: "strong",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "seme_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_reaching_half",
  "片手をこちらへ伸ばす半身",
  "画面外の相手へ片腕を伸ばす、前後感の強い構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "reaching"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "reaching_forward"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "reach_toward"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "edge",
      foreground: "soft",
      depth: "strong",
      rhythm: "dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "close_distance"
    ]
  }
),
preset(
  "viewer_angled_conversation_half",
  "顔を寄せる斜め半身",
  "身体を斜めに保ちながら、近い相手へ顔を寄せる構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "slight"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "partially_out"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "soft",
      depth: "layered",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "close_distance"
    ]
  }
),
preset(
  "viewer_withdrawing_half",
  "少し身を引きながら見つめる半身",
  "身体は引きながらも、視線を相手から外さない構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "away_camera",
        lean: "backward"
      },
      shoulders: {
        emphasis: "hunched"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "across_body"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "lowered",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_away"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "slightly_high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "none",
      foreground: "soft",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like",
      "close_distance"
    ]
  }
),
preset(
  "viewer_seated_looking_up_full",
  "相手を見上げる座り姿",
  "座った状態から、上方に立つ相手を見上げる全身構図。",
  {
    pose: {
      posture: "sitting",
      motion: {
        state: "static"
      },
      support: {
        type: "seated_surface"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "both_bent"
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "backward"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "combined",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: "hands_on_lap"
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "normal",
      approach: "none"
    },
    camera: {
      shotSize: "full_body",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "around",
      crop: "none",
      foreground: "soft",
      depth: "layered",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like"
    ]
  }
),
preset(
  "viewer_one_knee_full",
  "相手の前に片膝をつく全身",
  "片膝をつき、上方の相手へ顔と視線を向ける構図。",
  {
    pose: {
      posture: "one_knee_kneeling",
      motion: {
        state: "static"
      },
      weight: "lowered",
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: "one_bent"
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "normal",
      approach: "none"
    },
    camera: {
      shotSize: "full_body",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "around",
      crop: "none",
      foreground: "none",
      depth: "layered",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective"
    ]
  }
),
preset(
  "viewer_approaching_walk_full",
  "こちらへ歩み寄る全身",
  "相手へ歩み寄りながら、正面へ視線を向ける全身構図。",
  {
    pose: {
      posture: "walking",
      motion: {
        state: "mid_motion"
      },
      weight: "forward",
      lowerBody: {
        stance: "relaxed",
        legRelation: "stepping",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "counter",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "relaxed_at_side"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "normal",
      approach: "approaching"
    },
    camera: {
      shotSize: "full_body",
      elevation: "slightly_low",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "none",
      foreground: "soft",
      depth: "strong",
      rhythm: "dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "seme_like"
    ]
  }
),
preset(
  "viewer_recoiling_full",
  "身を引きながら見上げる全身",
  "重心を後方へ移しながら、上方の相手を見つめる構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "preparing"
      },
      weight: "backward",
      lowerBody: {
        stance: "relaxed",
        legRelation: "one_forward",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "away_camera",
        lean: "backward"
      },
      shoulders: {
        emphasis: "hunched"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "across_body"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "normal",
      approach: "lean_away"
    },
    camera: {
      shotSize: "full_body",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "none",
      depth: "layered",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like"
    ]
  }
),
preset(
  "viewer_reclining_overhead_full",
  "上から見つめる横たわり構図",
  "横たわった人物が、真上にいる相手へ視線を向ける構図。",
  {
    pose: {
      posture: "reclining",
      motion: {
        state: "static"
      },
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "side",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "normal",
      approach: "none"
    },
    camera: {
      shotSize: "wide",
      elevation: "top_down",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "around",
      crop: "none",
      foreground: "soft",
      depth: "layered",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    audienceTags: [
      "viewer_perspective",
      "uke_like"
    ]
  }
),
preset(
  "relationship_sofa_leaning_close",
  "ソファで隣にもたれかかる恋人",
  "ソファで隣に座り、Viewer側へ穏やかにもたれかかる近距離構図。",
  {
    pose: {
      posture: "sitting",
      motion: {
        state: "static"
      },
      support: {
        type: "sofa_surface"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "both_bent"
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "slight"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "sideways"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "combined",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: "hands_on_lap"
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "none",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["everyday", "calm_intimacy"],
    sceneTags: ["sofa"]
  }
),
preset(
  "relationship_walking_close_up",
  "歩きながら顔を寄せる恋人",
  "隣を歩きながら、Viewerへ顔を寄せる親密な近距離アップ。",
  {
    pose: {
      posture: "walking",
      motion: {
        state: "mid_motion"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: "forward",
      lowerBody: {
        stance: "relaxed",
        legRelation: "stepping",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "slight"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "relaxed_at_side"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "bust_shot",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "none",
      foreground: "soft",
      depth: "separated",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["everyday", "calm_intimacy"],
    sceneTags: ["walking"]
  }
),
preset(
  "relationship_bed_supine_looking_up",
  "ベッドで仰向けの恋人を見下ろす視点",
  "ベッドに仰向けで横たわり、上方のViewerを見上げる構図。",
  {
    pose: {
      posture: "reclining",
      motion: {
        state: "static"
      },
      support: {
        type: "bed_surface"
      },
      lyingOrientation: "supine",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_chest"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "raised",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "upward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "around",
      crop: "none",
      foreground: "none",
      depth: "layered",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance", "upward_gaze"],
    moodTags: ["sweet", "sensual"],
    sceneTags: ["bed", "lying_down"]
  }
),
preset(
  "relationship_bed_prone_looking_back",
  "ベッドでうつ伏せになり、こちらを見る恋人",
  "ベッドでうつ伏せに寝転び、顔だけViewerへ向ける甘い構図。",
  {
    pose: {
      posture: "reclining",
      motion: {
        state: "static"
      },
      support: {
        type: "bed_surface"
      },
      lyingOrientation: "prone",
      supportPose: "leaning_on_elbows",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "both_bent"
      },
      pelvis: {
        orientation: "away_camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "counter",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "combined",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: "supporting_upper_body"
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "over_shoulder",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "none",
      foreground: "none",
      depth: "separated",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "playful"],
    sceneTags: ["bed", "lying_down"]
  }
),
preset(
  "relationship_bed_side_lying_close",
  "隣で寝ながら顔を見てくる恋人",
  "Viewerのすぐ隣で横向きに寝ながら、静かに顔を見つめる構図。",
  {
    pose: {
      posture: "reclining",
      motion: {
        state: "static"
      },
      support: {
        type: "bed_surface"
      },
      lyingOrientation: "side_lying",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "side",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "relaxed"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "hand_near_face"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "none"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "minimal",
      crop: "none",
      foreground: "none",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["everyday", "calm_intimacy", "sweet"],
    sceneTags: ["bed", "lying_down"]
  }
),
preset(
  "relationship_bed_turning_back",
  "ベッド上で身を起こして振り返る恋人",
  "ベッド上で身を支えながら上体を起こし、背後のViewerを振り返る構図。",
  {
    pose: {
      posture: "reclining",
      motion: {
        state: "static"
      },
      support: {
        type: "bed_surface"
      },
      lyingOrientation: "prone",
      supportPose: "propped_up",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "away_camera",
        shift: "slight"
      },
      torso: {
        relationToPelvis: "counter",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "supporting_body"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "over_shoulder",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "slightly_high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "none",
      foreground: "none",
      depth: "layered",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "sensual"],
    sceneTags: ["bed", "lying_down"]
  }
),
preset(
  "relationship_bed_leaning_over_viewer",
  "寝転ぶ相手へ上から距離を詰めて見下ろす恋人",
  "ベッド上で低い位置のViewerへ身を乗り出し、上から見下ろす近距離構図。",
  {
    pose: {
      posture: "kneeling",
      motion: {
        state: "static"
      },
      support: {
        type: "bed_surface"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: "lowered",
      lowerBody: {
        stance: null,
        legRelation: "parallel",
        knee: "both_bent"
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "resting_on_thigh"
        },
        secondary: {
          action: "partially_out"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "lowered",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "downward",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "very_close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "low",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "none",
      crop: "none",
      foreground: "none",
      depth: "strong",
      rhythm: "dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance", "downward_gaze"],
    moodTags: ["assertive", "sensual"],
    sceneTags: ["bed", "lying_down"]
  }
),
preset(
  "relationship_heart_hands_near_face",
  "顔の近くで両手ハート",
  "顔の近くで両手でハートを作り、Viewerへ向ける甘いアップ構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "raised"
      },
      arms: {
        mode: "combined",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: "heart_hands_near_face"
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "bust_shot",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "minimal",
      crop: "tight_face",
      foreground: "none",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "playful"],
    sceneTags: ["affection_gesture"]
  }
),
preset(
  "relationship_finger_heart_near_face",
  "顔の近くで指ハート",
  "顔の近くで片手の指ハートを作り、Viewerへ向ける可愛いアップ構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "raised"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "finger_heart_near_face"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "bust_shot",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "tight_face",
      foreground: "none",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "playful"],
    sceneTags: ["affection_gesture"]
  }
),
preset(
  "relationship_finger_heart_cheek_touch",
  "指ハートと頬添え",
  "片手で指ハートを作り、反対の手を頬へ添える甘い顔アップ構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "static"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "aligned",
        lean: "neutral"
      },
      shoulders: {
        emphasis: "raised"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "finger_heart_near_face"
        },
        secondary: {
          action: "hand_touching_cheek"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "none"
    },
    camera: {
      shotSize: "headshot",
      elevation: "slightly_high",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "minimal",
      crop: "tight_face",
      foreground: "none",
      depth: "separated",
      rhythm: "stable"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "playful", "sensual"],
    sceneTags: ["affection_gesture"]
  }
),
preset(
  "relationship_open_arms_toward_viewer",
  "Viewerを抱きしめる直前",
  "Viewerへ向かって両腕を広げ、抱きしめる直前のように距離を詰める構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "reaching"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: "forward",
      lowerBody: {
        stance: "relaxed",
        legRelation: "one_forward",
        knee: "one_bent"
      },
      pelvis: {
        orientation: "camera",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "both_open"
      },
      arms: {
        mode: "combined",
        primary: {
          action: null
        },
        secondary: {
          action: null
        },
        combined: "arms_open_toward_viewer"
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "level"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "lean_toward"
    },
    camera: {
      shotSize: "waist_up",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "centered",
      negativeSpace: "minimal",
      crop: "edge",
      foreground: "soft",
      depth: "strong",
      rhythm: "dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "assertive"],
    sceneTags: ["affection_gesture"]
  }
),
preset(
  "relationship_touching_viewer_cheek",
  "Viewerの頬へ触れる",
  "片手をカメラ方向へ伸ばし、Viewerの頬へ優しく触れるような近距離構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "reaching"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "reaching_forward_soft"
        },
        secondary: {
          action: "relaxed_at_side"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "reach_toward"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "right_of_center",
      negativeSpace: "left",
      crop: "edge",
      foreground: "soft",
      depth: "strong",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["sweet", "calm_intimacy"],
    sceneTags: ["affection_gesture"]
  }
),
preset(
  "relationship_pinching_viewer_cheek",
  "Viewerの頬をつまむ",
  "片手をカメラ方向へ伸ばし、Viewerの頬を軽くつまむような playful な構図。",
  {
    pose: {
      posture: "standing",
      motion: {
        state: "reaching"
      },
      support: {
        type: "none"
      },
      lyingOrientation: "none",
      supportPose: "none",
      weight: null,
      lowerBody: {
        stance: null,
        legRelation: null,
        knee: null
      },
      pelvis: {
        orientation: "three_quarter",
        shift: "none"
      },
      torso: {
        relationToPelvis: "toward_camera",
        lean: "forward"
      },
      shoulders: {
        emphasis: "one_forward"
      },
      arms: {
        mode: "separate",
        primary: {
          action: "pinching_toward_viewer"
        },
        secondary: {
          action: "hand_on_hip"
        },
        combined: null
      },
      head: {
        yaw: "toward_camera",
        pitch: "neutral",
        tilt: "slight"
      },
      gaze: {
        target: "viewer",
        direction: "direct",
        eyes: "open"
      }
    },
    interaction: {
      target: "viewer",
      distance: "close",
      approach: "reach_toward"
    },
    camera: {
      shotSize: "upper_body",
      elevation: "eye_level",
      roll: "level"
    },
    composition: {
      subjectPlacement: "left_of_center",
      negativeSpace: "right",
      crop: "edge",
      foreground: "soft",
      depth: "strong",
      rhythm: "subtle_dynamic"
    },
    output: {
      includeSolo: true
    }
  },
  {
    collection: "relationship",
    audienceTags: ["viewer_perspective", "close_distance"],
    moodTags: ["playful"],
    sceneTags: ["affection_gesture"]
  }
)
  ];

  var oldMeta = {
    viewer_upward_soft_close: { moodTags: ['sweet', 'hesitant'] },
    viewer_downward_confident_close: { moodTags: ['assertive'] },
    viewer_face_approach_close: { moodTags: ['sweet', 'calm_intimacy'] },
    viewer_side_glance_close: { moodTags: ['sensual'] },
    viewer_cheek_touch_close: { moodTags: ['sweet', 'sensual'], sceneTags: ['affection_gesture'] },
    viewer_chest_hand_upward_half: { moodTags: ['sweet', 'hesitant'] },
    viewer_leaning_down_half: { moodTags: ['assertive'] },
    viewer_reaching_half: { moodTags: ['calm_intimacy'], sceneTags: ['affection_gesture'] },
    viewer_angled_conversation_half: { moodTags: ['calm_intimacy'] },
    viewer_withdrawing_half: { moodTags: ['hesitant'] },
    viewer_seated_looking_up_full: { moodTags: ['calm_intimacy', 'hesitant'] },
    viewer_one_knee_full: { moodTags: ['calm_intimacy'] },
    viewer_approaching_walk_full: { moodTags: ['everyday', 'assertive'], sceneTags: ['walking'] },
    viewer_recoiling_full: { moodTags: ['hesitant'] },
    viewer_reclining_overhead_full: { moodTags: ['sensual'], sceneTags: ['lying_down'] }
  };

  relationshipPresets.forEach(function (item) {
    var extra = oldMeta[item.id] || {};
    item.meta = item.meta || {};
    item.meta.collection = 'relationship';
    item.meta.audienceTags = unique(['viewer_perspective'].concat(item.meta.audienceTags || []));
    item.meta.moodTags = unique((item.meta.moodTags || []).concat(extra.moodTags || []));
    item.meta.sceneTags = unique((item.meta.sceneTags || []).concat(extra.sceneTags || []));
    item.patch.output = item.patch.output || {};
    item.patch.output.includeSolo = true;
  });

  D.presets = (D.presets || []).filter(function (item) {
    return !(item.meta && (item.meta.audienceTags || []).indexOf('viewer_perspective') >= 0);
  }).map(function (item) {
    item.meta = item.meta || {};
    item.meta.collection = 'basic';
    item.meta.audienceTags = item.meta.audienceTags || [];
    item.meta.moodTags = item.meta.moodTags || [];
    item.meta.sceneTags = item.meta.sceneTags || [];
    return item;
  }).concat(relationshipPresets);

  D.relationshipPresetIds = relationshipPresets.map(function (item) { return item.id; });
})(window);
