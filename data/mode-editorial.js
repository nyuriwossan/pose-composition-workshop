(function (global) {
  'use strict';
  /*
   * モード・エディトリアル（通常モード系）一人用ポーズ（2026-10-29c 試作9件）
   *
   * 出典：Manus「モード系ポージング候補・統合調査レポート」（pose_research_report_ja.md）の28候補。
   * 資料には候補IDがないため、掲載順に ME-01〜ME-28 を振って追跡する（D.modeCandidateLog）。
   * 資料の英語欄にある gender-neutral／neutral expression／fully clothed／non-sexual／tailored clothing／
   * clean studio background などはポーズ指定ではないため使わず、身体配置の説明から英語を書き直した。
   *
   * データの形はアヴァンギャルド系（data/editorial.js）と同じで、pose.editorialPose で選ぶ。
   *   line: 'mode'（アヴァンギャルド系は line なし）／sourceId: ME-xx
   *   椅子・スツール・壁など、姿勢の成立に必要な物だけを書く。性別・外見・表情・服装・背景・照明・画風・品質は書かない。
   */
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // Danbooruタグ一覧（a1111-sd-webui-tagcomplete の danbooru.csv、2026-10-29取得）と完全一致を確認した語。投稿数は確認時点の参考値。
  D.modeVerifiedTags = {
    'head tilt': 139388, 'hand on own neck': 2066, 'contrapposto': 30005, 'arm across chest': 402, 'looking back': 281064,
    'arm at side': 42804, 'hand up': 350006, 'against wall': 14753, 'leaning to the side': 10342, 'chair': 91462,
    'leaning on object': 2915, 'stool': 11014, 'arm support': 94468, 'hand on own thigh': 12747, 'leaning forward': 115911,
    'on chair': 21903, 'elbow on knee': 876, 'armchair': 6376, 'elbow rest': 6876
  };

  var poses = [
    {
      id: 'neck_touch_twist', sourceId: 'ME-02', line: 'mode', labelJa: '首元に指を添えて胸だけひねる',
      shortJa: '骨盤は片側に止めたまま胸と肩を逆へ回し、片手の指先を首の横に添える。首は下げた肩の側へ傾ける。',
      minShot: 'upper_body', recommendedShot: 'waist_up',
      body: {
        pelvis: '片側へ向けて止める', ribcage: '胸郭と肩を骨盤と逆へ回し、手を添えた側の肩を下げる',
        head: '下げた肩の側へ首を軽く傾ける', armA: '片手の指先を首の横（顎の下）に軽く添え、肘を斜め下の外へ',
        armB: '反対の腕は胴から少し離して下ろす', support: '片脚に軽く荷重', depth: '手を添えた側の肩が奥、反対の肩が手前'
      },
      prompt: {
        torso: {
          compact: ['pelvis turned to one side and held there', 'ribcage and shoulders counter-rotated against the pelvis', 'one shoulder lowered', 'head tilted toward the lowered shoulder'],
          detailed: ['The pelvis turns to one side and holds there while the ribcage and shoulders counter-rotate against it.', 'One shoulder lowers, and the head tilts toward it.']
        },
        arms: {
          compact: ['fingertips of the hand on the lowered side resting lightly at the side of the neck just below the jaw', 'that elbow angled outward and down', 'the other arm lowered with a small gap from the torso'],
          detailed: ['On the lowered side, the fingertips rest lightly at the side of the neck just below the jaw, with that elbow angled outward and down.', 'The other arm lowers with a small gap from the torso.']
        }
      },
      tags: {
        torso: { verified: ['head tilt'], phrases: ['pelvis turned one way', 'shoulders counter-rotated', 'one shoulder lowered'] },
        arms: { verified: ['hand on own neck'], phrases: ['fingertips below jaw', 'elbow angled out and down', 'small gap between arm and torso'] }
      },
      figure: { narrow: 0.8, shoulderTilt: -5, headShift: 2, headTilt: 9, twist: -1, near: 'shoulder:1',
        arms: [{ at: 'shoulder', dx: -5, dy: -2, elbow: { at: 'shoulder', dx: 6, dy: 13 } }, { at: 'hip', dx: -15, dy: 8, bend: -1 }] }
    },
    {
      id: 'diagonal_forearm_x', sourceId: 'ME-03', line: 'mode', labelJa: '片腕を胸に斜めに渡すX字のひねり',
      shortJa: '腰と肩を逆に傾けてX字にし、片方の前腕を胸の前へ斜めに渡す。反対の腕は下へ長く、腰から離す。',
      minShot: 'upper_body', recommendedShot: 'waist_up', postures: ['standing'],
      body: {
        pelvis: '片側へ傾けて斜めに向ける', ribcage: '肩の線を骨盤と逆へ傾け、胸郭を逆に回す（肩と腰の線でX字）',
        head: '高い肩から離す', armA: '片方の前腕を胸の前へ斜めに渡し、手を反対側の肋骨の上で止める',
        armB: '反対の腕は下へ長く伸ばし、腰から離す', support: '片脚荷重', depth: '斜めの前腕が手前'
      },
      prompt: {
        torso: {
          compact: ['hips tilted and angled one way', 'shoulder line tilted the opposite way', 'ribcage counter-rotated so the shoulders and hips form an X', 'head held away from the higher shoulder'],
          detailed: ['The hips tilt and angle one way while the shoulder line tilts the opposite way, the ribcage counter-rotating so the shoulders and hips form an X.', 'The head stays away from the higher shoulder.']
        },
        arms: {
          compact: ['one forearm crossing diagonally in front of the chest', 'that hand resting on the opposite side of the ribcage', 'the other arm extended long and down, angled away from the hip'],
          detailed: ['One forearm crosses diagonally in front of the chest, its hand resting on the opposite side of the ribcage.', 'The other arm extends long and down, angled away from the hip.']
        }
      },
      tags: {
        torso: { verified: ['contrapposto'], phrases: ['hips and shoulders tilted opposite', 'counter-rotated ribcage'] },
        arms: { verified: ['arm across chest'], phrases: ['diagonal forearm over chest', 'other arm straight down away from hip'] }
      },
      figure: { shoulderTilt: 7, hipTilt: -6, headShift: -3, headTilt: -7, twist: 1,
        arms: [{ at: 'chest', dx: -10, dy: 3, bend: 1 }, { at: 'hip', dx: -22, dy: 12, bend: -1 }] }
    },
    {
      id: 'near_shoulder_dip', sourceId: 'ME-07', line: 'mode', labelJa: '手前の肩を落として顔を戻す',
      shortJa: '体をカメラから斜めに外し、手前の肩を下げ奥の肩を上げる。顔だけをカメラへ戻し、顎を手前の肩へ寄せる。',
      minShot: 'bust_shot', recommendedShot: 'upper_body',
      body: {
        pelvis: '斜め奥へ向ける（体をカメラから約45度外す）', ribcage: '手前の肩を下げ、奥の肩を上げて、肩の線を手前へ下る斜めにする',
        head: '顔だけカメラ側へ戻し、顎を手前の肩へ寄せる', armA: '手前の腕は胴に沿って下ろす',
        armB: '奥の腕は胴の陰に半分隠す', support: '奥の脚に荷重', depth: '手前の肩がいちばん手前で、いちばん低い'
      },
      prompt: {
        torso: {
          compact: ['torso turned about forty-five degrees away from the viewer', 'near shoulder dropped low', 'far shoulder raised', 'shoulder line slanting down toward the viewer', 'head turned back toward the viewer', 'chin drawn toward the near shoulder'],
          detailed: ['The torso turns about forty-five degrees away from the viewer, with the near shoulder dropped low and the far shoulder raised so the shoulder line slants down toward the viewer.', 'The head turns back toward the viewer, the chin drawn toward the near shoulder.']
        },
        arms: {
          compact: ['near arm hanging close along the torso', 'far arm partly hidden behind the torso'],
          detailed: ['The near arm hangs close along the torso, and the far arm stays partly hidden behind it.']
        }
      },
      tags: {
        torso: { verified: ['looking back'], phrases: ['body turned away', 'near shoulder lowered', 'far shoulder raised', 'chin toward near shoulder'] },
        arms: { verified: ['arm at side'], phrases: ['far arm hidden behind torso'] }
      },
      figure: { narrow: 0.62, shoulderTilt: -9, headShift: 3, headTilt: 8, face: 'three_quarter', near: 'shoulder:0',
        arms: [{ at: 'hip', dx: 6, dy: 12, bend: 1 }, { at: 'hip', dx: -4, dy: -2, hidden: true, bend: -1 }] }
    },
    {
      id: 'temple_hover', sourceId: 'ME-10', line: 'mode', labelJa: 'こめかみに手を浮かせて肩を落とす',
      shortJa: '片手をこめかみの横に浮かせ、頬との間に隙間を残す。手を上げた側の肩はあえて下げ、反対の肩を手前へ出す。',
      minShot: 'bust_shot', recommendedShot: 'upper_body',
      body: {
        pelvis: '斜めに向け、片脚に軽く荷重', ribcage: '胸郭を回し、手を上げた側の肩をあえて下げ、反対の肩を手前へ',
        head: '首をまっすぐ保ち、手から少し離す', armA: '片手をこめかみの横（生え際の近く）に浮かせ、顔には触れない',
        armB: '反対の腕は自然に下ろす', support: '片脚荷重', depth: '反対の肩が手前'
      },
      prompt: {
        torso: {
          compact: ['torso rotated', 'one shoulder dropped', 'the opposite shoulder brought closer to the viewer', 'neck kept long and upright'],
          detailed: ['The torso rotates, dropping one shoulder while the opposite shoulder comes closer to the viewer.', 'The neck stays long and upright.']
        },
        arms: {
          compact: ['the hand on the dropped-shoulder side hovering beside the temple near the hairline', 'a visible gap between the hand and the cheek', 'that elbow opened outward', 'the other arm relaxed downward'],
          detailed: ['On the dropped-shoulder side, the hand hovers beside the temple near the hairline, leaving a visible gap between the hand and the cheek, with that elbow opened outward.', 'The other arm relaxes downward.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['one shoulder dropped', 'opposite shoulder forward', 'long upright neck'] },
        arms: { verified: ['hand up'], phrases: ['hand hovering beside temple', 'gap between hand and cheek', 'elbow opened out'] }
      },
      figure: { narrow: 0.85, shoulderTilt: -7, headShift: -1, near: 'shoulder:1', twist: -1,
        arms: [{ at: 'eyes', dx: 12, dy: -3, bend: 1, hintY: -2, elbowOut: 1.5 }, { at: 'hip', dx: -12, dy: 11, bend: -1 }] }
    },
    {
      id: 'wall_side_lean', sourceId: 'ME-18', line: 'mode', labelJa: '壁に肩を預けて体を斜めにする',
      shortJa: '足を壁から離して置き、片肩と背中の上を壁に預けて体の軸を斜めにする。首は壁と反対へ傾ける。',
      minShot: 'upper_body', recommendedShot: 'waist_up', postures: ['standing'],
      body: {
        pelvis: '足を壁から離して置き、骨盤ごと体の軸を壁の側へ倒す', ribcage: '壁側の肩と背中の上部を壁に預け、反対の肩を下げる',
        head: '首を壁と反対へ傾け、体の軸と逆にする', armA: '壁側の腕は体と壁のあいだに下ろす',
        armB: '反対の腕は体から少し離して垂らす', support: '壁に触れる肩・背中の上部と両足', depth: '壁は人物の真横'
      },
      prompt: {
        torso: {
          compact: ['leaning sideways against a wall', 'one shoulder and the upper back resting on the wall', 'feet set away from the wall', 'body axis on a diagonal', 'the opposite shoulder dropped', 'head tilted away from the wall'],
          detailed: ['The figure leans sideways against a wall, one shoulder and the upper back resting on it with the feet set away from the wall, so the body axis runs on a diagonal.', 'The opposite shoulder drops and the head tilts away from the wall.']
        },
        arms: {
          compact: ['wall-side arm hanging between the body and the wall', 'the free arm hanging loosely with a gap from the torso'],
          detailed: ['The wall-side arm hangs between the body and the wall, and the free arm hangs loosely with a gap from the torso.']
        }
      },
      tags: {
        torso: { verified: ['against wall', 'leaning to the side'], phrases: ['shoulder resting on wall', 'diagonal body axis', 'head tilted away from wall'] },
        arms: { verified: [], phrases: ['free arm hanging with gap'] }
      },
      figure: { bodyLean: 11, wall: 1, shoulderTilt: 3, headShift: -3, headTilt: -10,
        arms: [{ at: 'hip', dx: 6, dy: 10, bend: 1 }, { at: 'hip', dx: -13, dy: 12, bend: -1 }] }
    },
    {
      id: 'chair_back_rest', sourceId: 'ME-21', line: 'mode', labelJa: '椅子の背に片腕を預けて立つ',
      shortJa: '背の高い椅子の横に立ち、背もたれの上に前腕を軽く乗せる。腰は椅子から離し、胸は椅子の側へ回す。',
      minShot: 'waist_up', recommendedShot: 'knee_up', postures: ['standing'],
      body: {
        pelvis: '椅子と反対へ少しずらす', ribcage: '胸郭を椅子の側へ約30度回し、椅子側の肩を下げ、反対の肩を前へ',
        head: '首を長く保つ', armA: '片方の前腕を椅子の背もたれの上に軽く乗せる',
        armB: '反対の腕は下ろし、胴とのあいだに縦の隙間を残す', support: '両足（背もたれの前腕には軽く預けるだけ）', depth: '椅子は人物の横'
      },
      prompt: {
        torso: {
          compact: ['standing beside a high-backed chair', 'hips shifted away from the chair', 'torso rotated about thirty degrees toward the chair', 'shoulder on the chair side lowered', 'the opposite shoulder forward'],
          detailed: ['The figure stands beside a high-backed chair, the hips shifted away from it while the torso rotates about thirty degrees toward it.', 'The shoulder on the chair side lowers and the opposite shoulder comes forward.']
        },
        arms: {
          compact: ['one forearm resting lightly along the top of the chair back', 'the other arm lowered with a narrow vertical gap beside the torso'],
          detailed: ['One forearm rests lightly along the top of the chair back.', 'The other arm lowers, leaving a narrow vertical gap beside the torso.']
        }
      },
      tags: {
        torso: { verified: ['chair'], phrases: ['standing beside chair', 'hips shifted away from chair', 'chair-side shoulder lowered'] },
        arms: { verified: ['leaning on object'], phrases: ['forearm on chair back', 'vertical gap beside torso'] }
      },
      figure: { lean: 9, hipShift: -4, shoulderTilt: -4, narrow: 0.85, chairRail: true, twist: 1,
        arms: [{ at: 'rail', dx: 15, dy: 0, elbow: { at: 'rail', dx: 0, dy: 0 } }, { at: 'hip', dx: -12, dy: 12, bend: -1 }] }
    },
    {
      id: 'stool_edge_twist', sourceId: 'ME-22', line: 'mode', labelJa: 'スツールの縁に浅く座って胸をひねる',
      shortJa: 'スツールの前縁に浅く座り、両足を床につけて骨盤を止め、胸だけを逆へ回す。片手は座面の縁で体を支える。',
      minShot: 'waist_up', recommendedShot: 'knee_up', postures: ['sitting'],
      body: {
        pelvis: 'スツールの前縁に浅く乗せ、一方へ向けて止める', ribcage: '胸郭を骨盤と逆へ回し、肩の高さを変える',
        head: '首を長く保つ', armA: '片手を腰の横の座面の縁につき、軽く体を支える',
        armB: '反対の肘を胴から離して曲げ、手は太ももの上', support: '座面の前縁・支える手・床についた両足', depth: '支える手は腰の横'
      },
      prompt: {
        torso: {
          compact: ['seated lightly on the front edge of a stool', 'both feet grounded', 'pelvis angled one way and held still', 'ribcage rotated the opposite way', 'shoulders at uneven heights'],
          detailed: ['The figure sits lightly on the front edge of a stool with both feet grounded, the pelvis angled one way and held still.', 'The ribcage rotates the opposite way, leaving the shoulders at uneven heights.']
        },
        arms: {
          compact: ['one hand bracing on the seat edge beside the hip', 'the other elbow bent away from the torso with the hand on the thigh'],
          detailed: ['One hand braces on the seat edge beside the hip.', 'The other elbow bends away from the torso, the hand resting on the thigh.']
        }
      },
      tags: {
        torso: { verified: ['stool'], phrases: ['sitting on front edge of stool', 'feet on ground', 'hips and chest turned opposite'] },
        arms: { verified: ['arm support', 'hand on own thigh'], phrases: ['hand on seat edge', 'elbow bent outward'] }
      },
      figure: { base: 'front_seated', seat: 'stool', narrow: 0.82, shoulderTilt: 5, twist: 1, near: 'shoulder:1',
        arms: [{ at: 'hip', dx: 17, dy: -1, bend: 1 }, { at: 'thigh1', dx: -1, dy: -2, bend: -1, elbowOut: 1.7 }] }
    },
    {
      id: 'elbow_on_knee_lean', sourceId: 'ME-25', line: 'mode', labelJa: '膝に肘をついて前へ傾く座り',
      shortJa: '椅子に座って上半身を前へ傾け、片肘と前腕を同じ側の膝に乗せる。反対の手は太ももに置き、顔はカメラへ戻す。',
      minShot: 'knee_up', recommendedShot: 'knee_up', postures: ['sitting'],
      body: {
        pelvis: '椅子に座り、斜めに向ける', ribcage: '上半身を股関節から前へ傾け、斜め3/4へ回す。肩は前後にずらす',
        head: '顔をカメラへ戻す', armA: '片肘と前腕を同じ側の膝に乗せ、手は膝の先で力を抜く',
        armB: '反対の手は太ももの上に軽く置く', support: '座面と、膝に乗せた肘', depth: '膝の上の肘が手前'
      },
      prompt: {
        torso: {
          compact: ['seated on a simple chair', 'torso leaning forward from the hips', 'torso rotated three-quarters', 'shoulders offset front to back', 'head turned back toward the viewer'],
          detailed: ['The figure sits on a simple chair, the torso leaning forward from the hips and rotated three-quarters with the shoulders offset front to back.', 'The head turns back toward the viewer.']
        },
        arms: {
          compact: ['one elbow and forearm resting on the knee on the same side', 'that hand relaxed past the knee', 'the other hand resting lightly on the thigh'],
          detailed: ['One elbow and forearm rest on the knee on the same side, the hand relaxed past the knee.', 'The other hand rests lightly on the thigh.']
        }
      },
      tags: {
        torso: { verified: ['leaning forward', 'on chair'], phrases: ['torso turned three-quarters', 'head turned to viewer'] },
        arms: { verified: ['elbow on knee'], phrases: ['forearm over knee', 'other hand on thigh'] }
      },
      figure: { sideLean: 40, fold: 0.86, face: 'front', sideOK: true,
        arms: [{ at: 'knee0', dx: 9, dy: 5, elbow: { at: 'knee0', dx: -6, dy: -5 } }, { at: 'thigh1', dx: 2, dy: -2, bend: 1 }] }
    },
    {
      id: 'armrest_elbow', sourceId: 'ME-26', line: 'mode', labelJa: '肘掛けに片肘を預けて肩を落とす',
      shortJa: '肘掛け椅子に座り、片肘を肘掛けに乗せて、その側の肩を下げる。反対の手は太ももに置き、左右の腕の高さを変える。',
      minShot: 'waist_up', recommendedShot: 'waist_up', postures: ['sitting'],
      body: {
        pelvis: '肘掛け椅子に座り、骨盤は正面寄り', ribcage: '肘を預けた側の肩を下げ、上半身を少し回す',
        head: '顔を少し横へ向ける', armA: '片肘を肘掛けに乗せ、前腕を肘掛けに沿わせる',
        armB: '反対の手は太ももの上', support: '座面と、肘掛けの上の肘', depth: '肘掛けは人物の横'
      },
      prompt: {
        torso: {
          compact: ['seated in an armchair', 'torso subtly rotated', 'shoulder on the armrest side lowered', 'head turned slightly aside'],
          detailed: ['The figure sits in an armchair with the torso subtly rotated and the shoulder on the armrest side lowered.', 'The head turns slightly aside.']
        },
        arms: {
          compact: ['one elbow resting on the armrest with the forearm along it', 'the other hand resting on the thigh', 'the two arms set at clearly different heights'],
          detailed: ['One elbow rests on the armrest with the forearm lying along it.', 'The other hand rests on the thigh, so the two arms sit at clearly different heights.']
        }
      },
      tags: {
        torso: { verified: ['armchair'], phrases: ['armrest-side shoulder lowered', 'torso subtly rotated'] },
        arms: { verified: ['elbow rest'], phrases: ['forearm along armrest', 'hand on thigh', 'arms at different heights'] }
      },
      figure: { base: 'front_seated', seat: 'armchair', narrow: 0.9, shoulderTilt: -6, headShift: -2, headTilt: -6, face: 'three_quarter', armrest: true,
        arms: [{ at: 'armrest', dx: 4, dy: 3, toward: true, elbow: { at: 'armrest', dx: 0, dy: 0 } }, { at: 'thigh1', dx: 1, dy: -2, bend: -1 }] }
    }
  ];
  D.modeEditorialPoses = poses;
  D.editorialPoses = (D.editorialPoses || [{ id: 'none', labelJa: '指定なし' }]).concat(poses);

  /*
   * 28候補の判定（ME-01〜ME-28 は資料の掲載順）。
   * adopted：採用（internalId と対応）／merged：採用した候補へ統合／reproducible：既存の項目・プリセットで再現できる／
   * near：既存またはアヴァンギャルド系に近い／held：資料の曖昧さ・生成や図の難しさで保留。
   * duplicateOf は照合した既存プリセットID・AV番号・統合先。
   */
  D.modeCandidateLog = [
    { id: 'ME-01', nameJa: 'コントラポストの肩腰ずらし', status: 'reproducible', duplicateOf: ['model_three_quarter', 'fashion_motion'], reasonJa: '片脚荷重・骨盤の斜め・逆回旋・肩の高低・片手腰は既存の項目でそのまま作れ、出力にも contrapposto が入る' },
    { id: 'ME-02', nameJa: '胸郭回旋の逆位相', status: 'adopted', internalId: 'neck_touch_twist' },
    { id: 'ME-03', nameJa: '片腕対角線のねじれ', status: 'adopted', internalId: 'diagonal_forearm_x' },
    { id: 'ME-04', nameJa: '交差腕と反対向きの首', status: 'reproducible', duplicateOf: ['crossed_bust'], reasonJa: '腕組み＋上半身の逆回旋＋顔をそらす・首の傾きを既存項目で組み合わせられる。左右非対称の腕組みは生成で区別しにくい' },
    { id: 'ME-05', nameJa: '斜め背面・肩越しの振り返り', status: 'reproducible', duplicateOf: ['relationship_rear_three_quarter_turn', 'relationship_back_facing_over_shoulder'], reasonJa: '骨盤を奥・肩越しに振り返る・片肩を前・背面の見せ方は既存プリセットとほぼ同じ' },
    { id: 'ME-06', nameJa: '背面プロフィールの首戻し', status: 'reproducible', duplicateOf: ['relationship_back_facing_over_shoulder'], reasonJa: '背中向き＋顔を横向き＋視線を外す＋後ろ手で作れる。既存の背面プリセットとの差は顔の向きだけ' },
    { id: 'ME-07', nameJa: '高低差のある肩と逆側の首', status: 'adopted', internalId: 'near_shoulder_dip' },
    { id: 'ME-08', nameJa: '腰の逆回旋と肩越しの直視', status: 'near', duplicateOf: ['walk_turn', 'relationship_rear_three_quarter_turn'], reasonJa: '骨盤と胸郭の向きの差・肩越しの直視は既存の振り返りとほぼ同じ絵になり、静止画では区別しにくい' },
    { id: 'ME-09', nameJa: '顎支えの三分の四回旋', status: 'reproducible', duplicateOf: ['thinking'], reasonJa: '顎に手を添える・斜め・首を傾ける・反対の腕を下ろすは既存プリセットと同じ構造' },
    { id: 'ME-10', nameJa: 'こめかみフレームの肩落とし', status: 'adopted', internalId: 'temple_hover' },
    { id: 'ME-11', nameJa: '首元の片側タッチと反対肘', status: 'merged', duplicateOf: ['ME-02'], reasonJa: '首の横への指先・外へ張る肘・逆回旋がME-02と同じ構成のため、ME-02（首元に指を添えて胸だけひねる）へ統合' },
    { id: 'ME-12', nameJa: '肩越しの頬タッチ', status: 'reproducible', duplicateOf: ['relationship_rear_three_quarter_turn'], reasonJa: '既存の振り返りプリセットの片手を「頬に触れる」にすれば作れる' },
    { id: 'ME-13', nameJa: '頭上の片腕と背面の反対腕', status: 'near', duplicateOf: ['AV-015', 'AV-011'], reasonJa: '片腕を上げ反対を背中へ回す腕の構成がアヴァンギャルドのAV-015と同じ' },
    { id: 'ME-14', nameJa: 'こめかみの曲げ腕と下向きの反対腕', status: 'near', duplicateOf: ['ME-10', 'AV-006'], reasonJa: '高い肘＋長く下ろす腕はAV-006、こめかみの手はME-10と重なる。既存の「髪に触れる」＋腕を下ろすでも作れる' },
    { id: 'ME-15', nameJa: '斜め前へ伸ばす腕と背中へ引く腕', status: 'near', duplicateOf: ['AV-015'], reasonJa: '斜め上へ伸ばす腕＋背中へ引く腕がAV-015と同じ構成' },
    { id: 'ME-16', nameJa: '横へ開く腕と低い反対腕', status: 'held', duplicateOf: ['AV-006'], reasonJa: '支えのない水平の腕は踊りのような演技的な形に寄りやすく、高い腕と低い腕のジグザグはAV-006と近い' },
    { id: 'ME-17', nameJa: '軽い前傾と後ろ脚のコントラポスト', status: 'reproducible', duplicateOf: ['viewer_leaning_down_half', 'AV-013'], reasonJa: '後ろ脚荷重・前傾・上半身をカメラへ・片手腰は既存の項目で作れる。骨格はAV-013の穏やかな版' },
    { id: 'ME-18', nameJa: '壁を支点にした横倒し', status: 'adopted', internalId: 'wall_side_lean' },
    { id: 'ME-19', nameJa: '胸郭の回旋で作る胸上の斜線', status: 'merged', duplicateOf: ['ME-03'], reasonJa: '骨盤を正面に残した胸郭の回旋＋斜めの前腕がME-03と同じ要点のため、ME-03へ統合' },
    { id: 'ME-20', nameJa: '前へ出した肩と後退した骨盤', status: 'reproducible', duplicateOf: ['viewer_leaning_down_half', 'viewer_reaching_half', 'AV-005'], reasonJa: '骨盤を斜め・上半身をカメラへ・前傾・片肩を前は既存の半身プリセット群と同じ構造' },
    { id: 'ME-21', nameJa: '背もたれ越しの肩差し立ち', status: 'adopted', internalId: 'chair_back_rest' },
    { id: 'ME-22', nameJa: '座面縁の半座位ひねり', status: 'adopted', internalId: 'stool_edge_twist' },
    { id: 'ME-23', nameJa: '背面フレームの片肘寄りかかり', status: 'held', duplicateOf: ['ME-21'], reasonJa: '椅子の背を手前に置いて体を隠す構図で、家具と身体の前後関係が崩れやすい。前腕を背もたれに乗せる点はME-21と重なる' },
    { id: 'ME-24', nameJa: '座面片手支えの浮遊スクワット', status: 'held', duplicateOf: [], reasonJa: '座らずに片手で支える荷重が曖昧で、立つか座るかに崩れやすい。曲げた膝が主役で今回の画角方針とも合わない' },
    { id: 'ME-25', nameJa: '片肘・膝の前傾', status: 'adopted', internalId: 'elbow_on_knee_lean' },
    { id: 'ME-26', nameJa: '肘掛けの片側レール', status: 'adopted', internalId: 'armrest_elbow' },
    { id: 'ME-27', nameJa: '交差脚・膝上の二重置き', status: 'reproducible', duplicateOf: ['calm_seated'], reasonJa: '座る＋脚を組む＋手を太もも・膝に置く＋上半身の逆回旋は既存の項目で作れる' },
    { id: 'ME-28', nameJa: '片手支持・片膝立て', status: 'held', duplicateOf: ['AV-017'], reasonJa: '低い床座りで手をつく形がAV-017と近く、立てた膝・脚の重なりで図も生成も混み合う' }
  ];

  // ---- プリセット（一人用）----
  var COMMON_COMPOSITION = { subjectPlacement: 'centered', negativeSpace: 'around', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'subtle_dynamic' };
  function byId(id) { return poses.filter(function (x) { return x.id === id; })[0]; }
  function preset(def, posePatch, camera) {
    return {
      id: 'mode_' + def.id,
      nameJa: def.labelJa,
      descriptionJa: def.shortJa,
      patch: {
        pose: Object.assign({ editorialPose: def.id }, posePatch),
        camera: Object.assign({ shotSize: def.recommendedShot, elevation: 'eye_level', roll: 'level' }, camera || {}),
        composition: COMMON_COMPOSITION
      },
      meta: { collection: 'mode_editorial', poseFamily: 'mode_twist', sourceId: def.sourceId, audienceTags: [] }
    };
  }
  var standing = { posture: 'standing', motion: { state: 'static' } };
  var standingLegs = { posture: 'standing', motion: { state: 'static' }, weight: 'one_leg', lowerBody: { stance: 'relaxed', legRelation: 'parallel', knee: 'one_bent' } };
  var sitting = { posture: 'sitting', motion: { state: 'static' }, weight: null, lowerBody: { stance: null, legRelation: 'parallel', knee: 'both_bent' } };
  var modePresets = [
    preset(byId('neck_touch_twist'), standing),
    preset(byId('diagonal_forearm_x'), standing),
    preset(byId('near_shoulder_dip'), standing),
    preset(byId('temple_hover'), standing),
    preset(byId('wall_side_lean'), standing),
    preset(byId('chair_back_rest'), standingLegs),
    preset(byId('stool_edge_twist'), sitting),
    preset(byId('elbow_on_knee_lean'), sitting, { elevation: 'slightly_high' }),
    preset(byId('armrest_elbow'), { posture: 'sitting', motion: { state: 'static' } })
  ];
  D.presetCollections = D.presetCollections || {};
  D.presetCollections.mode_editorial = { labelJa: 'モード・エディトリアル' };
  D.modeEditorialPresets = modePresets;
  D.presets = (D.presets || []).concat(modePresets);
})(window);
