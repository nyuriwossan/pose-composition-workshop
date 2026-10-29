(function (global) {
  'use strict';
  /*
   * モード・アヴァンギャルド（エディトリアル系）一人用ポーズ（2026-10-29 試作8件）
   *
   * 出典：avantgarde_pose_candidates.json（AV-001〜AV-024）。資料は検証前の候補集なので、
   * 身体構造の日本語説明を根拠に、英語・タグはここで書き直している（資料の english_pose_prompt はそのまま使っていない）。
   *
   * 1件ごとに次を持つ。
   *   body   : 身体情報（日本語。日本語構造の表示用）
   *   prompt : 出力文。torso（骨盤・胸郭・肩・頭）と arms（左右の腕）を分ける。
   *            利用者が腕を自分で指定したときは arms を出さず、利用者の指定を優先する。
   *            compact：汎用の構造化出力／detailed：自然文（Tsubaki・詳細英文）／tags：SDXL・NovelAI 用の短い句
   *   tags   : verified は Danbooru のタグ一覧（a1111-sd-webui-tagcomplete の danbooru.csv、2026-10-29 取得）と完全一致を確認したもの。
   *            phrases は自然な英語の短い句（タグとして学習済みかは未確認）。
   *   postures : 成立に必要な基本姿勢（指定がある候補のみ。異なる場合はアドバイザーで案内し、利用者の選択は変えない）
   *   minShot / recommendedShot : これより狭い画角では要点が写らない。狭いときは出力を抑え、アドバイザーで推奨画角を案内する。
   *   figure : 棒人間の模式図の補正（肩の傾き・胸郭の横ずれ・頭の位置・左右の腕の行き先）
   *
   * 性別・年齢・外見・表情・服装・背景・照明・画風・品質タグは入れない。左右は反転しやすいため「片方／反対側」で書く。
   */
  var PCW = global.PCW = global.PCW || {};
  var D = PCW.data = PCW.data || {};

  // Danbooruタグ一覧で実在を確認した語（2026-10-29）。投稿数は確認時点の参考値。
  D.editorialVerifiedTags = {
    'arm behind back': 37640, 'arm behind head': 35492, 'arm up': 208569, 'arms up': 188117, 'arm at side': 42804,
    'leaning forward': 115911, 'leaning back': 19605, 'arm support': 94468
  };

  function pose(def) { return def; }

  D.editorialPoses = [
    { id: 'none', labelJa: '指定なし' },
    pose({
      id: 'shoulder_shelf', avId: 'AV-005', labelJa: '片肩を張り出す肘の棚',
      shortJa: '片肩を前上へ張り、短く畳んだ腕の肘を鎖骨の下から突き出す。反対の腕は背中側へ隠す。',
      minShot: 'bust_shot', recommendedShot: 'waist_up',
      body: {
        pelvis: 'ほぼ正面。張り出す肩の側を少し後ろへ', ribcage: '片肩を前上方へ張り出し、反対の肩は下げて奥へ',
        head: '頭を低い肩の側へ寄せ、首を肩の線から外す', armA: '張り出した側の上腕を短く畳み、肘を鎖骨の下から前へ',
        armB: '反対の腕は胴体の後ろへ隠す', support: '重心を低い肩の側の脚へ少し移す', depth: '肘がいちばん手前、低い肩がいちばん奥'
      },
      prompt: {
        torso: {
          compact: ['one shoulder pushed forward and slightly raised', 'the opposite shoulder dropped and receding', 'head drawn toward the lower shoulder', 'neck offset from the shoulder line'],
          detailed: ['One shoulder is pushed forward and slightly raised while the opposite shoulder drops and recedes.', 'The head draws toward the lower shoulder, keeping the neck offset from the shoulder line.']
        },
        arms: {
          compact: ['upper arm on the raised side folded compactly with the elbow projecting forward just below the collarbone', 'the other arm hidden behind the torso'],
          detailed: ['On the raised side, the upper arm folds compactly so the elbow projects forward just below the collarbone.', 'The other arm stays hidden behind the torso.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['one shoulder forward and raised', 'other shoulder dropped back', 'head toward lower shoulder'] },
        arms: { verified: ['arm behind back'], phrases: ['short folded arm', 'elbow jutting forward below collarbone'] }
      },
      figure: { shoulderTilt: 5, headShift: -5, headTilt: -8, face: 'three_quarter', near: 'elbow:0', twist: 1,
        arms: [{ at: 'collar', dx: 4, dy: 2, toward: true, bend: 1 }, { at: 'hip', dx: 4, dy: -4, hidden: true, bend: -1 }] }
    }),
    pose({
      id: 'long_short_arms', avId: 'AV-006', labelJa: '低い肩の長い腕と高い肘',
      shortJa: '下げた肩の腕を長く垂らし、反対は肩の高さで肘を外へ張る。左右の腕の長さを極端に変える。',
      minShot: 'waist_up', recommendedShot: 'knee_up',
      body: {
        pelvis: 'わずかに斜め', ribcage: '片肩を下げて奥へ、反対の肩を上げて手前へ',
        head: '頭は中央へ戻し、両方の肘から離す', armA: '低い肩の腕を腰より下まで長くまっすぐ垂らす',
        armB: '反対の上腕を短く折り、肘を肩の高さで外へ張り、手は胸の上の外側で止める', support: '低い肩の側の脚に寄せる', depth: '高い肩の肘が手前寄り'
      },
      prompt: {
        torso: {
          compact: ['one shoulder dropped and receding', 'the opposite shoulder lifted and advancing', 'torso tipped slightly toward the lower shoulder', 'head centered between the shoulders'],
          detailed: ['One shoulder drops and recedes while the opposite shoulder lifts and comes forward, tipping the torso slightly toward the lower side.', 'The head stays centered between the shoulders.']
        },
        arms: {
          compact: ['arm on the lower side hanging long and straight past the hip', 'opposite upper arm folded short with the elbow projecting outward at shoulder height', 'that hand stopping at the outer upper chest'],
          detailed: ['On the lower side, the arm hangs long and straight past the hip.', 'On the higher side, the upper arm folds short so the elbow projects outward at shoulder height, with the hand stopping at the outer upper chest.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['one shoulder dropped', 'other shoulder raised'] },
        arms: { verified: ['arm at side'], phrases: ['long straight arm past hip', 'elbow out at shoulder height', 'hand at outer upper chest'] }
      },
      figure: { shoulderTilt: -6, lean: 4, near: 'elbow:1',
        arms: [{ at: 'hip', dx: 10, dy: 22, bend: 1 }, { at: 'shoulder', dx: -3, dy: 8, bend: -1, hintY: -4, elbowOut: 1.6 }] }
    }),
    pose({
      id: 'arm_arch_window', avId: 'AV-009', labelJa: '両腕のアーチで顔の窓をつくる',
      shortJa: '両腕を触れ合わないアーチにして、顔のまわりに開いた窓を残す。肩の高さは左右で変える。',
      minShot: 'bust_shot', recommendedShot: 'upper_body',
      body: {
        pelvis: 'やや斜めで中立寄り', ribcage: '両肩を開き、片側をわずかに先行。肩の高さは左右で変える',
        head: '頭を腕の窓の中に置き、顎を軽く引く', armA: '片腕を外上方へ上げ、前腕を額の上へ',
        armB: '反対の腕は少し低いアーチにして頬の横を空ける', support: '両足で立ち、片脚に軽く荷重', depth: '両腕と顔はほぼ同じ面'
      },
      prompt: {
        torso: {
          compact: ['shoulders opened at unequal heights', 'one shoulder slightly leading', 'head held centered with the chin slightly tucked'],
          detailed: ['The shoulders open at unequal heights, with one shoulder slightly leading.', 'The head stays centered with the chin slightly tucked.']
        },
        arms: {
          compact: ['both arms raised into separate arches around the face', 'elbows opened outward', 'one forearm curving above the forehead and the other lower beside the cheek', 'hands held apart', 'a clear opening around the face'],
          detailed: ['Both arms rise into separate arches around the face with the elbows opened outward.', 'One forearm curves above the forehead and the other runs lower beside the cheek, the hands held apart, leaving a clear opening around the face.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['uneven shoulder height', 'chin slightly tucked'] },
        arms: { verified: ['arms up'], phrases: ['arms arched around face', 'elbows out', 'hands apart', 'open space around face'] }
      },
      figure: { shoulderTilt: 4,
        arms: [{ at: 'hair', dx: 3, dy: -4, bend: 1, hintY: -22, elbowOut: 1.5 }, { at: 'cheek', dx: -12, dy: -5, bend: -1, hintY: -14, elbowOut: 1.5 }] }
    }),
    pose({
      id: 'triangle_hood', avId: 'AV-011', labelJa: '腕で顔を囲む三角フード',
      shortJa: '片腕を胸の前から斜め上へ、反対の腕を頭の後ろから高く。肩と肘で顔のまわりに大きな三角形をつくる。',
      minShot: 'upper_body', recommendedShot: 'waist_up',
      body: {
        pelvis: '腕の上向きの線と反対へ向ける', ribcage: '頭の後ろへ上げた腕の側の肩は後ろ、胸の前の腕の側の肩は前',
        head: '頭を2本の前腕のあいだに置く', armA: '片腕を胸の前から斜め上へ伸ばす',
        armB: '反対の腕は頭の後ろを通して高く外側へ', support: '片脚に軽く荷重', depth: '胸の前の腕が手前、頭の後ろの腕が奥'
      },
      prompt: {
        torso: {
          compact: ['torso shifted slightly to one side', 'one shoulder drawn back', 'the opposite shoulder forward'],
          detailed: ['The torso shifts slightly to one side, drawing one shoulder back while the opposite shoulder comes forward.']
        },
        arms: {
          compact: ['one arm rising diagonally from in front of the chest past the face', 'the other arm bent behind the head with the elbow high and outward', 'shoulders and elbows forming a large triangle around the face', 'forearms kept apart', 'head set between the two forearms'],
          detailed: ['One arm rises diagonally from in front of the chest past the face, while the other bends behind the head with the elbow high and outward.', 'The shoulders and elbows form a large triangle around the face, with the forearms kept apart and the head set between them.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['torso shifted to one side', 'one shoulder drawn back'] },
        arms: { verified: ['arm behind head', 'arm up'], phrases: ['one arm rising diagonally from chest', 'arms forming triangle around face', 'forearms apart', 'head between forearms'] }
      },
      figure: { ribShift: -3,
        arms: [{ at: 'hair', dx: -2, dy: 0, bend: 1, hintY: -30, elbowOut: 1.6 }, { at: 'overhead', dx: -16, dy: 2, bend: 1, hintY: 18 }] }
    }),
    pose({
      id: 'forearm_screen', avId: 'AV-012', labelJa: '前腕の折戸で顔を半分隠す',
      shortJa: '上下にずらした2本の前腕を顔の前に斜めに置き、交差させずに折戸のような隙間から顔の一部だけを見せる。',
      minShot: 'bust_shot', recommendedShot: 'bust_shot',
      body: {
        pelvis: '腕の折戸と逆へ向ける', ribcage: '片肩を前、反対の肩を後ろ', head: '頭を腕の奥に置き、片目や頬だけが見える',
        armA: '片方の前腕を額の前へ斜めに', armB: '反対の前腕を顔の下側へ斜めに。2本は交差させない', support: '両足で立つ', depth: '前腕が手前、顔が奥'
      },
      prompt: {
        torso: {
          compact: ['one shoulder forward and the opposite shoulder back', 'torso upright with a slight sideways shift'],
          detailed: ['One shoulder comes forward and the opposite shoulder draws back, with the torso upright and shifted slightly sideways.']
        },
        arms: {
          compact: ['two forearms held in front of the face at different heights, staggered in parallel', 'the upper forearm angled across the forehead', 'the lower forearm angled across the lower face', 'elbows pushed outward', 'a narrow offset gap leaving part of the face visible', 'head set just behind the forearms'],
          detailed: ['Two forearms are held in front of the face at different heights, staggered in parallel: the upper one angles across the forehead and the lower one across the lower face.', 'The elbows push outward, the head sits just behind them, and a narrow offset gap leaves part of the face visible.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['one shoulder forward', 'torso upright'] },
        arms: { verified: [], phrases: ['two forearms in front of face', 'staggered parallel forearms', 'upper forearm across forehead', 'lower forearm across lower face', 'elbows out', 'face partly visible', 'head behind forearms'] }
      },
      figure: { ribShift: -2,
        arms: [{ at: 'eyes', dx: -5, dy: -2, elbow: { at: 'eyes', dx: 13, dy: -4 } }, { at: 'mouth', dx: 6, dy: 0, elbow: { at: 'mouth', dx: -12, dy: 4 }, toward: true }] }
    }),
    pose({
      id: 'broken_zigzag', avId: 'AV-013', labelJa: '稲妻形に折れる上半身',
      shortJa: '骨盤を引き、胸郭を前下へ折り、肩の線を逆に傾け、頭はさらに逆へ戻す。体の軸が2回向きを変える。',
      minShot: 'upper_body', recommendedShot: 'waist_up', postures: ['standing'],
      body: {
        pelvis: '斜めに引き、荷重脚と反対へ少し下げる', ribcage: '胸郭を腰から前下方へ折り、胸の上部は少し戻す。肩の線は腰と逆に傾ける',
        head: '低い肩から離れる向きへ頭を戻す', armA: '低い側の肘を胴体の後ろへ引く',
        armB: '高い側の腕で、肩から前下方への長い対角線をつくる', support: '後ろ脚に荷重', depth: '胸郭が前、骨盤が後ろ'
      },
      prompt: {
        torso: {
          compact: ['weight on the back leg', 'pelvis drawn back on a diagonal', 'ribcage folding forward and down from the waist', 'upper chest returning slightly upward', 'shoulder line tilted against the hips', 'head returning in the opposite direction from the lower shoulder'],
          detailed: ['The weight settles on the back leg and the pelvis draws back on a diagonal.', 'The ribcage folds forward and down from the waist while the upper chest returns slightly upward, tilting the shoulder line against the hips.', 'The head returns in the opposite direction from the lower shoulder, so the body axis changes direction twice.']
        },
        arms: {
          compact: ['elbow on the lower side pulled back behind the torso', 'arm on the higher side forming a long diagonal forward and down'],
          detailed: ['On the lower side, the elbow pulls back behind the torso.', 'On the higher side, the arm forms a long diagonal reaching forward and down.']
        }
      },
      tags: {
        torso: { verified: ['leaning forward'], phrases: ['weight on back leg', 'hips pulled back', 'ribcage folded forward and down', 'shoulders tilted against hips', 'head tilted away from lower shoulder'] },
        arms: { verified: ['arm behind back'], phrases: ['long diagonal arm reaching down'] }
      },
      figure: { lean: 12, fold: true, shoulderTilt: -8, hipTilt: 6, headShift: -7, headTilt: 10,
        arms: [{ at: 'hip', dx: 22, dy: 16, bend: 1 }, { at: 'hip', dx: -6, dy: -6, hidden: true, bend: -1 }] }
    }),
    pose({
      id: 'rib_slide', avId: 'AV-015', labelJa: '骨盤を残して胸郭だけ横へ',
      shortJa: '骨盤は正面で支持脚の真上に残したまま、胸郭だけを横へ大きく滑らせ、頭は低い肩の外へ落とす。',
      minShot: 'waist_up', recommendedShot: 'knee_up', postures: ['standing'],
      body: {
        pelvis: 'ほぼ正面で立てたまま、支持脚の真上', ribcage: '胸郭だけを横へ大きく滑らせる。張り出す側の肩は前外、反対の肩は奥',
        head: '低い肩の外側へ頭を落とす', armA: '張り出す側の腕を、肘を曲げて上方外側へ', armB: '反対の腕は背中側へ引く',
        support: '支持脚の真上に骨盤', depth: '張り出す側の肩が手前'
      },
      prompt: {
        torso: {
          compact: ['pelvis upright and nearly square over the standing leg', 'ribcage sliding strongly sideways above the pelvis', 'one shoulder projecting forward and outward', 'the opposite shoulder receding', 'head dropped outside the lower shoulder'],
          detailed: ['The pelvis stays upright and nearly square over the standing leg while the ribcage slides strongly sideways above it.', 'One shoulder projects forward and outward, the opposite shoulder recedes, and the head drops outside the lower shoulder.']
        },
        arms: {
          compact: ['arm on the projecting side reaching upward and outward with a bent elbow', 'the other arm pulled behind the back'],
          detailed: ['On the projecting side, the arm reaches upward and outward with a bent elbow.', 'The other arm pulls behind the back.']
        }
      },
      tags: {
        torso: { verified: [], phrases: ['upright square hips', 'ribcage shifted sideways', 'head dropped past lower shoulder'] },
        arms: { verified: ['arm up', 'arm behind back'], phrases: ['bent elbow reaching outward'] }
      },
      figure: { ribShift: 11, lean: -6, shoulderTilt: 8, headShift: -9, headDrop: 3, headTilt: -12, near: 'shoulder:0', twist: 1,
        arms: [{ at: 'overhead', dx: 16, dy: 4, bend: 1, hintY: -12, elbowOut: 1.4 }, { at: 'hip', dx: -4, dy: -4, hidden: true, bend: -1 }] }
    }),
    pose({
      id: 'floor_back_hands', avId: 'AV-017', labelJa: '後ろ手をついた床座りの弧',
      shortJa: '床に座って両手を骨盤の後ろにつき、骨盤を片側へずらし、胸郭を反対側へ持ち上げて体を横向きの弧にする。',
      minShot: 'waist_up', recommendedShot: 'knee_up', postures: ['sitting'], supportType: 'floor',
      body: {
        pelvis: '片側へずらし、片方の腰に体重を乗せる', ribcage: '胸郭を反対側へ持ち上げて開き、肩は前後にずらす',
        head: '高い肩から少し離す', armA: '片手を骨盤の後ろの床につく', armB: '反対の手も後ろの床につくが、前後の位置をずらす',
        support: '両手のひら2点と片側の腰', depth: '後ろの手が奥、胸郭が手前'
      },
      prompt: {
        torso: {
          compact: ['pelvis shifted to one side with the weight on one hip', 'ribcage lifted and curving toward the opposite side', 'torso leaning back slightly', 'shoulders offset in depth', 'head held slightly away from the higher shoulder'],
          detailed: ['The pelvis shifts to one side with the weight on one hip.', 'The ribcage lifts and curves toward the opposite side while the torso leans back slightly, with the shoulders offset in depth and the head held slightly away from the higher shoulder.']
        },
        arms: {
          compact: ['both hands planted on the floor behind the pelvis for support', 'one hand set farther back than the other'],
          detailed: ['Both hands are planted on the floor behind the pelvis for support, one set farther back than the other.']
        }
      },
      tags: {
        torso: { verified: ['leaning back'], phrases: ['hips shifted to one side', 'ribcage curving to opposite side'] },
        arms: { verified: ['arm support'], phrases: ['hands behind hips', 'one hand farther back'] }
      },
      figure: { base: 'floor_sit_back',
        arms: [{ support: 0 }, { support: 1 }] }
    })
  ];

  /*
   * 候補24件の扱い（追跡用）。adopted は internalId（D.editorialPoses の id）と対応する。
   * 資料の english_pose_prompt は AV-020〜AV-023 で行ずれ（AV-021欄＝AV-020の内容、AV-023欄＝AV-021の内容、
   * AV-020欄・AV-022欄＝24件に存在しない姿勢）があったため、英語はすべて身体構造の日本語説明から書き直した。
   */
  D.editorialCandidateLog = [
    { avId: 'AV-001', status: 'held', reasonJa: '胸郭三層の前後差は2Dの図でも生成でも潰れやすく、AV-004と区別しにくい' },
    { avId: 'AV-002', status: 'held', reasonJa: '前回案「胸郭回旋の逆位相」と画像上の差が小さく、中間層の回旋を図で示せない' },
    { avId: 'AV-003', status: 'held', reasonJa: '首を長く伸ばす指定が過長に生成されやすく、既存の肩の高低差と近い' },
    { avId: 'AV-004', status: 'held', reasonJa: 'AV-001とほぼ同じ骨格で、明確に区別できない' },
    { avId: 'AV-005', status: 'adopted', internalId: 'shoulder_shelf' },
    { avId: 'AV-006', status: 'adopted', internalId: 'long_short_arms' },
    { avId: 'AV-007', status: 'held', reasonJa: 'AV-005と腕の構成がほぼ同じ（張り出す肘＋隠す腕）のため統合' },
    { avId: 'AV-008', status: 'held', reasonJa: '画角端で切れる前腕が要点で、図の評価もC。切れた手の誤生成が起きやすい' },
    { avId: 'AV-009', status: 'adopted', internalId: 'arm_arch_window' },
    { avId: 'AV-010', status: 'held', reasonJa: 'AV-011とAV-012の中間形で、どちらかと見分けにくい' },
    { avId: 'AV-011', status: 'adopted', internalId: 'triangle_hood' },
    { avId: 'AV-012', status: 'adopted', internalId: 'forearm_screen' },
    { avId: 'AV-013', status: 'adopted', internalId: 'broken_zigzag' },
    { avId: 'AV-014', status: 'held', reasonJa: '頭を大きく倒す指定で首が折れたように生成されやすい' },
    { avId: 'AV-015', status: 'adopted', internalId: 'rib_slide' },
    { avId: 'AV-016', status: 'held', reasonJa: '脚の重なりで脚の本数が崩れやすく、支持も弱い' },
    { avId: 'AV-017', status: 'adopted', internalId: 'floor_back_hands' },
    { avId: 'AV-018', status: 'held', reasonJa: '前腕とすねの支持が胸上の推奨画角では写らず、ポーズの意味が伝わらない' },
    { avId: 'AV-019', status: 'held', reasonJa: '家具と身体の前後関係が混同されやすく、図の評価もB' },
    { avId: 'AV-020', status: 'held', reasonJa: '資料の英語欄が別姿勢（スツール）で、図の評価もC' },
    { avId: 'AV-021', status: 'held', reasonJa: '英語欄はAV-023欄にずれていたため修正したが、腕の構成がAV-005と重複するため統合' },
    { avId: 'AV-022', status: 'held', reasonJa: '正しい英語欄が資料にない。既存の「体の前を横切る腕」＋逆回旋で近い形を作れる' },
    { avId: 'AV-023', status: 'held', reasonJa: '自身の英語欄がない（欄にはAV-021の内容）。前回案「片腕の対角線のねじれ」と近い' },
    { avId: 'AV-024', status: 'held', reasonJa: '手が手前で巨大化しやすく、AV-021と近い' }
  ];

  var SHOT_ORDER = ['face_close_up', 'headshot', 'bust_shot', 'upper_body', 'waist_up', 'knee_up', 'full_body', 'wide'];
  /** 画角が狭すぎて要点が写らないとき true（未選択なら false） */
  D.editorialShotTooTight = function (poseId, shotSize) {
    var p = (D.editorialPoses || []).filter(function (x) { return x.id === poseId; })[0];
    if (!p || p.id === 'none' || !shotSize) return false;
    return SHOT_ORDER.indexOf(shotSize) < SHOT_ORDER.indexOf(p.minShot);
  };
  D.editorialShotOrder = SHOT_ORDER;

  // ---- プリセット（一人用）----
  var COMMON_COMPOSITION = { subjectPlacement: 'centered', negativeSpace: 'around', crop: 'none', foreground: 'none', depth: 'separated', rhythm: 'subtle_dynamic' };
  function preset(def, patch, camera) {
    return {
      id: 'editorial_' + def.id,
      nameJa: def.labelJa,
      descriptionJa: def.shortJa,
      patch: {
        pose: Object.assign({ editorialPose: def.id }, patch),
        camera: Object.assign({ shotSize: def.recommendedShot, elevation: 'eye_level', roll: 'level' }, camera || {}),
        composition: COMMON_COMPOSITION
      },
      meta: { collection: 'editorial', poseFamily: 'editorial_sculpt', avId: def.avId, audienceTags: [] }
    };
  }
  function byId(id) { return D.editorialPoses.filter(function (x) { return x.id === id; })[0]; }
  // 脚・重心は膝上の画角でしか写らないため、膝上を推奨する候補だけに入れる（狭い画角で「画角外・保持中」を増やさない）。
  var standing = function (weight, extra) {
    var base = { posture: 'standing', motion: { state: 'static' } };
    if (weight) { base.weight = weight; base.lowerBody = { stance: 'relaxed', legRelation: 'parallel', knee: weight === 'one_leg' ? 'one_bent' : 'straight' }; }
    return Object.assign(base, extra || {});
  };
  var editorialPresets = [
    preset(byId('shoulder_shelf'), standing(null)),
    preset(byId('long_short_arms'), standing('one_leg')),
    preset(byId('arm_arch_window'), standing(null)),
    preset(byId('triangle_hood'), standing(null), { elevation: 'slightly_high' }),
    preset(byId('forearm_screen'), standing(null)),
    preset(byId('broken_zigzag'), standing(null), { elevation: 'slightly_high' }),
    preset(byId('rib_slide'), standing('one_leg'), { elevation: 'slightly_low' }),
    preset(byId('floor_back_hands'), { posture: 'sitting', motion: { state: 'static' }, support: { type: 'floor' }, weight: null, lowerBody: { stance: null, legRelation: 'parallel', knee: 'both_bent' } })
  ];
  D.presetCollections = D.presetCollections || {};
  D.presetCollections.editorial = { labelJa: 'モード・アヴァンギャルド' };
  D.editorialPresets = editorialPresets;
  D.presets = (D.presets || []).concat(editorialPresets);
})(window);
