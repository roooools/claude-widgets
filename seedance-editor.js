/* seedance-editor.js v1.4.1 — Seedance日本語フィールド編集→英語清書エディタ（CDNランタイム）
   v1.4.1: ビートに任意の`label`（例:"C4"）を追加。Genタブ・ビートカード見出し・Gen内の内容サマリー行に反映——「Gen2って何のカット?」を無くす。
   v1.4.0: カメラムーブ辞書（7カテゴリ35種・大カテゴリ→ムーブの2段選択→カメラ欄に挿入）。旧6チップは「演出コンボ」カテゴリへ統合。
   v1.3.1: FOVドロップダウンにmm併記（47°→「47° (40–50mm)」）。
   使い方（チャット側はこれだけ流す）:
     <div id="sd-root">…読み込み中…</div>
     <script>window.SD_DATA = {model,title,common:{refs,look,light,wb,color,audio},gens:[{title,beats:[{t,cut,shot,fov,cam,block,action,fg,bg,perf,line,delivery,props,lock}]}]};</script>
     <script src="https://cdn.jsdelivr.net/gh/roooools/claude-widgets@v1.3.0/seedance-editor.js"></script>
   変換ボタン → sendPrompt(【動画プロンプト英語清書リクエスト｜…】) → Claude側がSantiago式英語に清書。 */
(function () {
  var D = window.SD_DATA || {};
  var model = {
    model: D.model || "Seedance 2.0",
    title: D.title || "",
    common: D.common || {},
    gens: (D.gens || []).map(function (g) {
      return { title: g.title || "", beats: (g.beats || []).map(function (b) { return Object.assign({}, b); }) };
    })
  };
  if (!model.gens.length) model.gens = [{ title: "Generation 1", beats: [{}] }];

  var FOV = [["180°", "フィッシュアイ"], ["107°", "14–16mm"], ["84°", "20–24mm"], ["63°", "28–35mm"], ["47°", "40–50mm"], ["29°", "75–85mm"], ["18°", "100–135mm"], ["12°", "180–200mm"], ["8°", "300–400mm"]];
  function fovLabel(deg) { for (var i = 0; i < FOV.length; i++) { if (FOV[i][0] === deg) return FOV[i][0] + " (" + FOV[i][1] + ")"; } return deg; }
  function degOf(s) { var m = /(\d+)\s*°/.exec(s || ""); return m ? m[1] + "°" : (s || ""); }
  function fovSel(id, v) {
    var d = degOf(v), known = FOV.some(function (f) { return f[0] === d; });
    var has = (v && !known) ? '<option selected>' + esc(v) + '</option>' : '';
    return '<select id="' + id + '" style="width:100%">' + has + FOV.map(function (f) {
      var full = f[0] + " (" + f[1] + ")";
      return '<option value="' + full + '"' + (f[0] === d ? ' selected' : '') + '>' + full + '</option>';
    }).join('') + '</select>';
  }
  var WB = ["3200K", "4000K", "5000K", "5600K", "8500K"];
  /* カメラムーブ辞書（7カテゴリ）。文言は案件非依存の汎用カメラ言語のみ——シーン固有の名詞（机・窓等）は入れない */
  var CAMS = [
    { cat: "演出コンボ（Pro級）", moves: [
      { label: "ヒーローロー煽り", fov: "47°", cam: "ローポジションから煽り、ウエスト→チェストへゆるプッシュイン（1cm微手持ち・リビール動機）" },
      { label: "前ボケ観察→ラック", fov: "47°", cam: "固定、前景の遮蔽物にピント→被写体へラックフォーカス（1cm微手持ち）" },
      { label: "ダッチ15°", fov: "", cam: "15°傾き（左下がり）の不穏フレーム、軽い収束ラック（1cm微手持ち）" },
      { label: "隠しカメラ観視", fov: "12°", cam: "遠距離の定点から超望遠で観視、前景の遮蔽物がフレーム20〜30%を占有、視点は動かさない" },
      { label: "スポーツ中継", fov: "8°", cam: "超望遠の定点アンカー、常時1〜2cm微振動、被写体に近づかず自分の視点内でリフレームのみ" },
      { label: "親密ワイド", fov: "63°", cam: "広角のまま顔に近接、顔センター、背景はボカさず読める深度" }
    ]},
    { cat: "固定・寄り引き", moves: [
      { label: "ロックオフ（沈黙の間）", fov: "", cam: "固定ロックオフ・目線高・動きなし（1cm微手持ちのみ）＝間を置く" },
      { label: "ゆっくりプッシュイン", fov: "", cam: "ゆっくりプッシュイン——ウエスト→チェストへ、気づき/決意を動機に寄る" },
      { label: "極ゆる微プッシュ", fov: "", cam: "極ゆっくりの微プッシュイン、ほぼ気づかない速度で緊張を上げる" },
      { label: "ゆっくりプルバック", fov: "", cam: "ゆっくり引き（プルバック）——孤立や全景のリビールを動機に離れる" },
      { label: "ラックフォーカス", fov: "", cam: "カメラ固定のまま、前景→奥（または逆）へ明確なラックフォーカス" }
    ]},
    { cat: "パン・チルト", moves: [
      { label: "パン 左→右", fov: "", cam: "三脚パン、左→右へ一定のゆっくり速度（順行・進展の方向）" },
      { label: "パン 右→左", fov: "", cam: "三脚パン、右→左へ一定のゆっくり速度（逆行・喪失/抵抗の方向）" },
      { label: "ウィップパン", fov: "", cam: "WHIP PAN：0.3s A静止→0.8sモーションブラー転換→1.4s B静止（0.8s未満はブラーが出ずただのカットになる）" },
      { label: "チルトアップ", fov: "", cam: "下から上へチルトアップ——足元→顔/全体像のスケールリビール" },
      { label: "チルトダウン", fov: "", cam: "上から下へチルトダウン——状況→対象への着地/発見" }
    ]},
    { cat: "ドリー・トラッキング", moves: [
      { label: "横トラッキング並走", fov: "", cam: "被写体と並走する横トラッキング、一定距離・一定速度" },
      { label: "フォロー（背後追従）", fov: "", cam: "背後からフォロー、カメラが半拍遅れてついていく" },
      { label: "リード（前方後退）", fov: "", cam: "被写体の前方を後退しながらリード、表情を見せ続ける" },
      { label: "90°アーク", fov: "", cam: "被写体を軸に90°アーク移動、背景がゆっくり回る" },
      { label: "360°オービット", fov: "", cam: "被写体中心に360°オービット1周、一定速度" }
    ]},
    { cat: "手持ち（手ブレ）", moves: [
      { label: "微手持ち1cm", fov: "", cam: "設置感のある微手持ち——1cmの生命感、オペレーターの呼吸" },
      { label: "ドキュメンタリー肩担ぎ", fov: "", cam: "肩担ぎドキュメンタリー——呼吸と1〜2cm微振動、小さな体重移動リフレーム" },
      { label: "緊迫の荒い手持ち", fov: "", cam: "荒い手持ち2〜4cm——緊迫・混乱、被写体を追い直すリフレーム" },
      { label: "スナップズーム", fov: "", cam: "手持ちスナップズーム（素早いズームイン）——強調・ドキュメンタリー/コメディの文法" }
    ]},
    { cat: "クレーン・ドローン", moves: [
      { label: "クレーンアップ", fov: "", cam: "地上レベルから立ち上がるクレーンショット、人物→全景へ" },
      { label: "クレーンダウン", fov: "", cam: "高所から降りてくるクレーン、全景→人物へ収束" },
      { label: "ドローン真俯瞰", fov: "", cam: "真俯瞰ドローン（トップダウン）、ゆっくり上昇または前進" },
      { label: "ドローン低空前進", fov: "", cam: "ドローンが低空を前進、地形や障害物を縫って被写体へ近づく" },
      { label: "FPVアクロバット", fov: "", cam: "FPVドローン——急旋回・ダイブ・すり抜けのジェットコースター移動" }
    ]},
    { cat: "特殊・POV", moves: [
      { label: "圧縮ズーム（安全版ドリーズーム）", fov: "", cam: "圧縮ズーム＝カメラ後退＋同時ズームイン、被写体サイズ一定・背景だけ圧縮されていく（めまい表現の安全版）" },
      { label: "バレットタイム", fov: "", cam: "被写体スローのまま、カメラが弧を描いて回り込むバレットタイム" },
      { label: "ロール回転", fov: "", cam: "レンズがゆっくりロール回転し水平が傾いていく——眩暈・混乱" },
      { label: "一人称POV", fov: "", cam: "一人称POV、視線と一致した手持ちの自然な揺れ" },
      { label: "車載マウント", fov: "", cam: "車体マウント固定、路面の振動がそのまま伝わる" }
    ]}
  ];
  var BEAT_FIELDS = ["label", "t", "cut", "shot", "fov", "cam", "block", "action", "fg", "bg", "perf", "line", "delivery", "props", "lock"];
  function trunc(s, n) { s = s || ""; return s.length > n ? s.slice(0, n) + "…" : s; }
  function genCutsSummary(g) {
    var labels = g.beats.map(function (b) { return b.label; }).filter(Boolean);
    return labels.length ? labels.join("→") : "";
  }
  function genSynopsis(g) {
    return g.beats.map(function (b, i) {
      var tag = b.label || ("#" + (i + 1));
      var gist = b.line ? "「" + trunc(b.line, 14) + "」" : trunc(b.action, 16);
      return tag + (gist ? "：" + gist : "");
    }).join("　→　");
  }
  var COMMON_FIELDS = ["refs", "look", "light", "wb", "color", "audio"];
  var active = 0;

  function esc(s) { return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function lab(t) { return '<div style="font-size:12px;color:var(--text-secondary);margin:0 0 4px">' + t + '</div>'; }
  function inp(id, v, ph) { return '<input id="' + id + '" value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' style="width:100%">'; }
  function ta(id, v, rows) { return '<textarea id="' + id + '" rows="' + (rows || 2) + '" style="width:100%;resize:vertical">' + esc(v) + '</textarea>'; }
  function sel(id, opts, v) {
    var has = v && opts.indexOf(v) < 0 ? '<option selected>' + esc(v) + '</option>' : '';
    return '<select id="' + id + '" style="width:100%">' + has + opts.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>';
  }
  function field(t, inner) { return '<div style="margin-bottom:10px">' + lab(t) + inner + '</div>'; }
  function g2(a, b) { return '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px">' + a + b + '</div>'; }
  var CARD = 'background:var(--surface-2);border:0.5px solid var(--border);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem';
  var BTN = 'border:0.5px solid var(--border-strong);border-radius:var(--radius);padding:10px 16px;font-size:14px;background:transparent;color:var(--text-primary)';
  var CHIP = 'border:0.5px solid var(--border);border-radius:var(--radius);padding:3px 9px;font-size:12px;background:transparent;color:var(--text-secondary)';

  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }
  function syncFromDOM() {
    COMMON_FIELDS.forEach(function (k) { var e = document.getElementById("c_" + k); if (e) model.common[k] = e.value.trim(); });
    model.gens.forEach(function (g, gi) {
      g.beats.forEach(function (b, bi) {
        BEAT_FIELDS.forEach(function (k) { var e = document.getElementById("g" + gi + "_b" + bi + "_" + k); if (e) b[k] = e.value.trim(); });
      });
    });
  }

  function beatCard(gi, bi, b) {
    var p = "g" + gi + "_b" + bi + "_";
    var h = '<div style="' + CARD + '">';
    h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">';
    h += '<span style="font-weight:500">ビート' + (bi + 1) + '</span>';
    h += '<input id="' + p + 'label" value="' + esc(b.label) + '" placeholder="カット番号(C4等)" style="width:100px;font-size:12px;color:var(--text-accent)">';
    h += '<input id="' + p + 't" value="' + esc(b.t) + '" placeholder="0.0-2.5s" style="width:110px">';
    h += '<input id="' + p + 'cut" value="' + esc(b.cut) + '" placeholder="カット種別（例：2.5s ハードカット）" style="flex:1;min-width:170px">';
    h += '<button data-del="' + gi + ':' + bi + '" style="' + CHIP + '" aria-label="ビート削除"><i class="ti ti-trash" aria-hidden="true" style="font-size:14px"></i></button>';
    h += '</div>';
    h += g2(field("ショットサイズ", inp(p + "shot", b.shot)), field("レンズ（FOV=mm相当）", fovSel(p + "fov", b.fov || "47°")));
    h += field("カメラの動き", inp(p + "cam", b.cam));
    h += '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:10px;margin:-4px 0 10px">';
    h += '<select id="' + p + 'mcat" data-mcat="' + gi + ':' + bi + '" style="width:100%;font-size:13px">' + CAMS.map(function (c, ci) {
      return '<option value="' + ci + '">' + c.cat + '</option>';
    }).join('') + '</select>';
    h += '<select id="' + p + 'mmove" data-mmove="' + gi + ':' + bi + '" style="width:100%;font-size:13px"><option value="">── ムーブを選んで上の欄に挿入 ──</option>' + CAMS[0].moves.map(function (m, mi) {
      return '<option value="' + mi + '">' + m.label + '</option>';
    }).join('') + '</select>';
    h += '</div>';
    h += field("配置", inp(p + "block", b.block));
    h += field("動作", ta(p + "action", b.action));
    h += g2(field("前景", inp(p + "fg", b.fg)), field("背景", inp(p + "bg", b.bg)));
    h += field("表情・芝居", ta(p + "perf", b.perf));
    h += g2(field("セリフ", inp(p + "line", b.line)), field("言い方", inp(p + "delivery", b.delivery)));
    h += g2(field("小道具（空欄=なし）", inp(p + "props", b.props)), field("ロック（固定したいこと）", inp(p + "lock", b.lock)));
    h += '</div>';
    return h;
  }

  function render() {
    var root = document.getElementById("sd-root");
    if (!root) return;
    var h = "";
    if (model.title) h += '<div style="font-weight:500;font-size:15px;margin:0 0 10px">' + esc(model.title) + ' <span style="color:var(--text-muted);font-size:12px">' + esc(model.model) + '</span></div>';
    if (model.gens.length > 1) {
      h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">' + model.gens.map(function (g, i) {
        var on = i === active;
        var cuts = genCutsSummary(g);
        var txt = esc(g.title || ("Gen " + (i + 1))) + (cuts ? '<br><span style="font-size:11px;opacity:.75">' + esc(cuts) + '</span>' : '');
        return '<button data-gen="' + i + '" style="' + BTN + ';padding:6px 14px;font-size:13px;line-height:1.5' + (on ? ';border:2px solid var(--border-accent);color:var(--text-accent)' : '') + '">' + txt + '</button>';
      }).join('') + '</div>';
      h += '<div style="font-size:12px;color:var(--text-muted);margin:0 0 12px">' + esc(genSynopsis(model.gens[active])) + '</div>';
    }
    h += '<div style="' + CARD + '">';
    h += '<div style="font-weight:500;margin-bottom:12px"><i class="ti ti-users" aria-hidden="true" style="font-size:16px;vertical-align:-2px;margin-right:6px"></i>共通設定（全Gen共有）</div>';
    h += field("参照キャラ・舞台", ta("c_refs", model.common.refs, 2));
    h += g2(field("全体の見た目", inp("c_look", model.common.look)), field("色バランス（60:30:10）", inp("c_color", model.common.color)));
    h += g2(field("光の基調", inp("c_light", model.common.light)), field("WB（色温度）", sel("c_wb", WB, model.common.wb || "5600K")));
    h += field("音（BGMなし前提）", inp("c_audio", model.common.audio));
    h += '</div>';
    model.gens.forEach(function (g, gi) {
      h += '<div id="sd-gen' + gi + '" style="display:' + (gi === active ? 'block' : 'none') + '">';
      h += '<div style="font-weight:500;margin:0 0 10px">' + esc(g.title || ("Generation " + (gi + 1))) + '</div>';
      g.beats.forEach(function (b, bi) { h += beatCard(gi, bi, b); });
      h += '<button data-add="' + gi + '" style="' + BTN + ';font-size:13px;padding:7px 14px"><i class="ti ti-plus" aria-hidden="true" style="font-size:14px;vertical-align:-2px"></i> ビート追加</button>';
      h += '</div>';
    });
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">';
    h += '<button id="sd-go" style="' + BTN + ';border-color:var(--border-accent);color:var(--text-accent)">このGenを英語プロンプトに変換 ↗</button>';
    if (model.gens.length > 1) h += '<button id="sd-goall" style="' + BTN + '">全Genまとめて変換 ↗</button>';
    h += '<button id="sd-copy" style="' + BTN + '">日本語をコピー <i class="ti ti-copy" aria-hidden="true" style="font-size:15px;vertical-align:-2px"></i></button>';
    h += '<span id="sd-msg" style="align-self:center;font-size:13px;color:var(--text-muted)"></span>';
    h += '</div>';
    root.innerHTML = h;
    bind();
  }

  function assembleGen(gi) {
    var g = model.gens[gi];
    var s = "\n[" + (g.title || "Generation " + (gi + 1)) + "]\n";
    g.beats.forEach(function (b, bi) {
      s += "\n[ビート" + (bi + 1) + (b.label ? "｜" + b.label : "") + "｜" + (b.t || "") + "] " + (b.cut || "") + "\n";
      s += "ショット: " + (b.shot || "") + " ／ FOV: " + (b.fov || "") + "\n";
      s += "カメラ: " + (b.cam || "") + "\n";
      s += "配置: " + (b.block || "") + "\n";
      s += "動作: " + (b.action || "") + "\n";
      s += "前景: " + (b.fg || "") + " ／ 背景: " + (b.bg || "") + "\n";
      s += "表情芝居: " + (b.perf || "") + "\n";
      s += "セリフ: " + (b.line || "なし") + " ／ 言い方: " + (b.delivery || "") + "\n";
      s += "小道具: " + (b.props || "なし") + " ／ ロック: " + (b.lock || "") + "\n";
    });
    return s;
  }
  function assemble(which) {
    syncFromDOM();
    var c = model.common;
    var s = "【動画プロンプト英語清書リクエスト｜" + model.model + "｜" + (model.title || "") + "】\n";
    s += "以下の編集済み日本語フィールドを、Santiago式マルチショットの英語プロンプトに清書して（英日併記・1コードブロック・文字数チェック付き）。清書時はcinematic-grammar経由でPro級アングルへ引き上げ、引き上げた点を1行報告。空欄はビートの意図に沿って自然補完。BGMなし・テロップは編集焼き前提。\n\n";
    s += "[共通]\n参照: " + (c.refs || "") + "\n見た目: " + (c.look || "") + "\n光: " + (c.light || "") + " ／ WB: " + (c.wb || "") + "\n色: " + (c.color || "") + "\n音: " + (c.audio || "") + "\n";
    if (which === "all") { model.gens.forEach(function (_, gi) { s += assembleGen(gi); }); }
    else { s += assembleGen(active); }
    return s;
  }

  function bind() {
    var root = document.getElementById("sd-root");
    root.querySelectorAll("[data-gen]").forEach(function (el) {
      el.addEventListener("click", function () { syncFromDOM(); active = parseInt(el.getAttribute("data-gen"), 10); render(); });
    });
    root.querySelectorAll("[data-add]").forEach(function (el) {
      el.addEventListener("click", function () { syncFromDOM(); model.gens[parseInt(el.getAttribute("data-add"), 10)].beats.push({}); render(); });
    });
    root.querySelectorAll("[data-del]").forEach(function (el) {
      el.addEventListener("click", function () {
        var a = el.getAttribute("data-del").split(":"); syncFromDOM();
        model.gens[+a[0]].beats.splice(+a[1], 1);
        if (!model.gens[+a[0]].beats.length) model.gens[+a[0]].beats.push({});
        render();
      });
    });
    root.querySelectorAll("[data-mcat]").forEach(function (el) {
      el.addEventListener("change", function () {
        var a = el.getAttribute("data-mcat").split(":");
        var p = "g" + a[0] + "_b" + a[1] + "_";
        var mv = document.getElementById(p + "mmove");
        if (mv) mv.innerHTML = '<option value="">── ムーブを選んで上の欄に挿入 ──</option>' + CAMS[+el.value].moves.map(function (m, mi) {
          return '<option value="' + mi + '">' + m.label + '</option>';
        }).join('');
      });
    });
    root.querySelectorAll("[data-mmove]").forEach(function (el) {
      el.addEventListener("change", function () {
        if (el.value === "") return;
        var a = el.getAttribute("data-mmove").split(":");
        var p = "g" + a[0] + "_b" + a[1] + "_";
        var cat = document.getElementById(p + "mcat");
        var m = CAMS[cat ? +cat.value : 0].moves[+el.value];
        if (!m) return;
        var cam = document.getElementById(p + "cam"); if (cam) cam.value = m.cam;
        if (m.fov) { var f = document.getElementById(p + "fov"); if (f) f.value = fovLabel(m.fov); }
      });
    });
    var go = document.getElementById("sd-go");
    if (go) go.addEventListener("click", function () { if (typeof sendPrompt === "function") sendPrompt(assemble("one")); });
    var goall = document.getElementById("sd-goall");
    if (goall) goall.addEventListener("click", function () { if (typeof sendPrompt === "function") sendPrompt(assemble("all")); });
    var cp = document.getElementById("sd-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = assemble("all");
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      var m = document.getElementById("sd-msg"); if (m) { m.textContent = "コピーした"; setTimeout(function () { m.textContent = ""; }, 1800); }
    });
  }

  render();
})();
