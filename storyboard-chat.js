/* storyboard-chat runtime v1.2.1 — 絵コンテチャット（タム運用）
   使い方: <script src="...jsdelivr.../storyboard-chat.js"></script> の後に
   StoryboardChat.render({cases: CASES, base: BASE}) を呼ぶ。
   ページ側に <div id="tabs"></div><div id="panel"></div> が必要。
   GRADES の実体は /color-grade-library と同期（変わったらここも更新して新タグをpush）。 */
(function(){
'use strict';
var CSS = [
'.tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}',
'.tab{padding:8px 16px;border:0.5px solid var(--border);border-radius:var(--radius);background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:var(--text-secondary)}',
'.tab.active{background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent)}',
'.tab .rank{font-size:11px;color:var(--text-muted);margin-left:4px}',
'.concept{font-size:14px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;padding:8px 0;border-bottom:0.5px solid var(--border)}',
'.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:16px}',
'.stat{background:var(--surface-1);border-radius:var(--radius);padding:10px 14px}',
'.stat-label{font-size:11px;color:var(--text-muted);margin-bottom:2px}',
'.stat-val{font-size:18px;font-weight:500}',
'.stat-val.pass{color:var(--text-success)}',
'.sec-h{font-size:12px;font-weight:500;color:var(--text-muted);margin:0 0 8px}',
'.assets{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;margin-bottom:8px}',
'.a-card{display:flex;gap:10px;background:var(--surface-1);border-radius:var(--radius);padding:10px;position:relative}',
'.a-thumb{position:relative;width:88px;min-height:60px;flex-shrink:0;border:1px dashed var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;color:var(--text-muted)}',
'.a-thumb.has-img{border-style:solid}',
'.a-thumb img{width:100%;height:auto;display:block;border-radius:3px}',
'.a-thumb:hover{border-color:var(--border-accent)}',
'.a-body{flex:1;min-width:0;font-size:12px;line-height:1.5}',
'.tag-chip{display:inline-block;background:var(--bg-accent);color:var(--text-accent);border-radius:4px;padding:1px 7px;font-size:11px;font-weight:500;font-family:var(--font-mono)}',
'.a-kind{font-size:11px;color:var(--text-muted);margin-left:6px}',
'.a-name{font-weight:500;margin:3px 0 2px}',
'.a-name[contenteditable]:focus,.a-path[contenteditable]:focus{background:var(--bg-accent);outline:none;border-radius:2px}',
'.a-path{font-family:var(--font-mono);font-size:10.5px;color:var(--text-secondary);word-break:break-all;outline:none;border-radius:2px;flex:1;min-width:0}',
'.a-thumb-wrap{display:flex;flex-direction:column;gap:3px;align-items:center;flex-shrink:0}',
'.a-cap{font-size:9px;color:var(--text-muted);line-height:1;text-align:center;letter-spacing:.02em}',
'.a-path-label{display:flex;align-items:center;gap:4px;margin:5px 0 1px}',
'.a-path-badge{display:inline-flex;align-items:center;gap:3px;font-size:9.5px;color:var(--text-muted);background:var(--surface-2,var(--bg-accent));border-radius:3px;padding:1px 5px;letter-spacing:.02em}',
'.a-path-row{display:flex;align-items:flex-start;gap:4px}',
'.a-note{font-size:10px;line-height:1.3;margin-top:2px;display:flex;align-items:center;gap:3px}',
'.a-note.warn{color:var(--text-danger)}',
'.a-note.ok{color:var(--text-muted)}',
'.a-card.unset .a-thumb{border-color:var(--border)}',
'.a-del{position:absolute;top:6px;right:6px;opacity:0;cursor:pointer;color:var(--text-muted);background:none;border:none;font-size:14px;padding:2px}',
'.a-card:hover .a-del{opacity:1}',
'.a-del:hover{color:var(--text-danger)}',
'.look-box{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--surface-1);border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;font-size:13px}',
'.look-box label{color:var(--text-secondary);font-size:12px}',
'.look-en{font-size:11px;color:var(--text-muted);font-family:var(--font-mono);flex-basis:100%;line-height:1.5}',
'.sbc select{font-size:12px}',
'.cast-box{background:var(--surface-1);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;font-size:13px;line-height:1.6}',
'.cast-box strong{font-weight:500;color:var(--text-primary)}',
'.cast-box span{color:var(--text-secondary)}',
'.tbl-wrap{overflow-x:auto;margin-bottom:8px}',
'.sbc table{width:100%;border-collapse:collapse;font-size:13px}',
'.sbc th{text-align:left;padding:8px 6px;font-weight:500;font-size:12px;color:var(--text-muted);border-bottom:0.5px solid var(--border-strong);white-space:nowrap}',
'.sbc td{padding:7px 6px;border-bottom:0.5px solid var(--border);vertical-align:top;line-height:1.5;color:var(--text-primary)}',
'.sbc td[contenteditable]{outline:none;cursor:text;border-radius:2px;min-width:110px}',
'.sbc td[contenteditable]:hover{background:var(--bg-accent)}',
'.sbc td[contenteditable]:focus{background:var(--bg-accent);box-shadow:inset 0 0 0 1.5px var(--border-accent)}',
'.sbc td.refs-td{font-family:var(--font-mono);font-size:11px;color:var(--text-accent);min-width:90px}',
'.sbc tr.silent td{background:var(--surface-1);color:var(--text-secondary)}',
'.sbc tr.cta-row td{background:var(--bg-accent);color:var(--text-accent)}',
'.sbc tr.dragging{opacity:.4}',
'.sbc tr.drag-over td{border-top:2px solid var(--text-accent)}',
'.del-btn{opacity:0;cursor:pointer;color:var(--text-muted);background:none;border:none;font-size:15px;padding:2px}',
'.sbc tr:hover .del-btn{opacity:1}',
'.del-btn:hover{color:var(--text-danger)}',
'.delivery{font-style:italic;color:var(--text-accent);font-size:12px}',
'.img-cell{position:relative;width:84px;min-height:56px;border:1px dashed var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;font-size:11px;color:var(--text-muted)}',
'.img-cell.has-img{width:300px;border-style:solid}',
'.img-cell img{width:100%;height:auto;display:block;border-radius:3px}',
'.img-cell:hover{border-color:var(--border-accent)}',
'.img-del{position:absolute;top:6px;right:6px;width:26px;height:26px;border:none;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}',
'.foot{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}',
'.foot button{background:transparent;border:0.5px solid var(--border-strong);border-radius:var(--radius);padding:6px 18px;font-size:13px;cursor:pointer;color:var(--text-secondary)}',
'.foot button:hover{background:var(--surface-1);color:var(--text-primary)}',
'.undo-bar{background:var(--surface-1);color:var(--text-secondary);padding:8px 14px;border-radius:var(--radius);display:none;align-items:center;justify-content:space-between;font-size:13px;margin-top:8px}',
'.undo-bar button{background:none;border:none;color:var(--text-accent);font-weight:500;cursor:pointer;text-decoration:underline}',
'.gate-comment{margin-top:12px;padding:12px 16px;background:var(--surface-1);border-radius:var(--radius);font-size:13px;line-height:1.6;color:var(--text-secondary)}',
'.gate-comment strong{color:var(--text-primary);font-weight:500}'
].join('\n');

var GRADES=[
{n:1,name:'ティール&オレンジ',mood:'力強い/大作/CM',en:'teal-and-orange grade: teal-cyan shadows, warm orange skin and highlights, high contrast'},
{n:2,name:'ウォーム・ゴールデン',mood:'郷愁/家族/食品',en:'warm golden-hour grade: amber highlights, warm skin tones, soft warm mids, gentle glow'},
{n:3,name:'クールブルー',mood:'冷静/知的/企業',en:'cool blue grade: restrained cyan-blue tones, cool clean shadows, warm skin pop, moderate contrast'},
{n:4,name:'ブリーチバイパス',mood:'硬派/報道',en:'bleach-bypass look: desaturated, high contrast, metallic silvery skin, gritty'},
{n:5,name:'パステル・ハイキー',mood:'清潔/美容/女性向け',en:'high-key pastel grade: bright airy, low contrast, soft desaturated pastels, lifted blacks'},
{n:6,name:'ネオン',mood:'近未来/夜/Z世代',en:'neon cyberpunk grade: magenta-and-cyan, glowing saturated highlights, deep blue shadows'},
{n:7,name:'セピア/ヴィンテージ',mood:'回想/老舗/レトロ',en:'vintage film grade: warm sepia cast, faded lifted blacks, muted saturation, subtle halation'},
{n:8,name:'スリラー(青緑)',mood:'不穏/緊張',en:'gritty thriller grade: cyan-green lifted milky shadows, green-tinted midtones, warm orange skin, high contrast, steely (Dark Knight / Fincher style)'},
{n:9,name:'モノクロ',mood:'高級/アート',en:'high-contrast black-and-white, rich blacks, silvery highlights, fine grain'},
{n:10,name:'ナチュラル',mood:'報道/医療/UGC',en:'natural true-to-life grade: neutral balance, accurate skin, moderate contrast, documentary feel'},
{n:11,name:'アースカラー',mood:'上質/大人/洗練',en:'muted earthy grade: desaturated olive and tan earth tones, refined restraint, soft contrast'},
{n:12,name:'ハイサチュ・パンチ',mood:'スポーツ/勢い',en:'punchy saturated grade: vivid bold colors, high contrast, energetic (warm-red dramatic variant available)'}
];

var CASES=[], BASE='';
var activeTab=null;
var undoStack=[];
var dragIdx=null;
var statsTimer=null;

function getCase(){ return CASES.find(function(c){ return c.id === activeTab; }); }
function gradeOf(n){ return GRADES.find(function(g){ return String(g.n) === String(n); }); }

// パスが「未設定」＝下流に渡らない状態か判定。空・BASEのみ・テンプレのYYMMDDプレースホルダはすべて未設定扱い。
function pathUnset(a){
  var p = (a.path || '').trim();
  if(!p) return true;
  if(p === BASE || p === BASE.replace(/\/$/, '')) return true;
  if(/YYMMDD/.test(p)) return true;
  return false;
}

function countChars(cs){
  var tmp = document.createElement('div');
  var n = 0;
  cs.cuts.forEach(function(c){
    tmp.innerHTML = c.audioHtml || '';
    var txt = tmp.textContent.replace(/\[.*?\]/g,'').replace(/[A-Za-z「」、。!?！？\s]/g,'');
    n += txt.length;
  });
  return n;
}

function importImage(file, obj, done){
  var r = new FileReader();
  r.onload = function(le){
    var im = new Image();
    im.onload = function(){
      var MAX = 640;
      var w = im.width, h = im.height;
      if(w > MAX){ h = Math.round(h * MAX / w); w = MAX; }
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(im, 0, 0, w, h);
      try{ obj.pic = cv.toDataURL('image/jpeg', 0.82); }
      catch(err){ obj.pic = le.target.result; }
      done();
    };
    im.onerror = function(){ obj.pic = le.target.result; done(); };
    im.src = le.target.result;
  };
  r.readAsDataURL(file);
}

// アセットのサムネに画像を入れる。プレビュー(pic)を設定しつつ、
// パスが未設定なら「BASE+ファイル名」を自動補完＝ドロップが実際に下流参照を生む（タムの運用: Higgsfield画像を案件フォルダ=BASEに置く）。
// 既にパスが入っている場合は絶対に上書きしない。
function importAssetImage(file, a){
  var wasUnset = pathUnset(a);
  importImage(file, a, function(){
    if(wasUnset && file && file.name) a.path = BASE + file.name;
    renderPanel();
  });
}

function buildScriptText(cs){
  var tmp = document.createElement('div');
  var g = gradeOf(cs.color);
  var out = '【絵コンテチャット確定】' + cs.rank + ' ' + cs.label + '（' + cs.cuts.length + 'カット）\n';
  out += '■アセット（= のパスが生成の参照。下流はこのパスを直接消費する）:\n' + cs.assets.map(function(a){
    return a.tag + '（' + a.name + '／' + a.kind + '）= ' + (pathUnset(a) ? '【パス未設定・要確認】' : a.path);
  }).join('\n') + '\n';
  out += '■ベースカラー: ' + (g ? g.n + ' ' + g.name + ' — ' + g.en : '未選択') + '\n';
  var lines = cs.cuts.map(function(c, i){
    tmp.innerHTML = c.audioHtml || '';
    var a = tmp.textContent.trim();
    var cg = c.color ? gradeOf(c.color) : null;
    return 'C' + (i + 1) + '｜' + c.time + '｜画:' + (c.img || '-') + '｜カメラ:' + (c.cam || '-') + '｜参照:' + (c.refs || '-') + '｜音声:' + (a || '（無言）') + '｜SE:' + (c.se || '-') + '｜テロップ:' + (c.tl || '-') + '｜色:' + (cg ? cg.n + ' ' + cg.name : 'ベース') + (c.pic ? '｜画像:あり' : '');
  });
  return out + lines.join('\n');
}

function renderTabs(){
  var el = document.getElementById('tabs');
  el.innerHTML = '';
  CASES.forEach(function(c){
    var btn = document.createElement('button');
    btn.className = 'tab' + (c.id === activeTab ? ' active' : '');
    btn.innerHTML = c.label + '<span class="rank">' + c.rank + '</span>';
    btn.onclick = function(){ activeTab = c.id; renderTabs(); renderPanel(); };
    el.appendChild(btn);
  });
}

function colorOptions(sel, withBase){
  var h = withBase ? '<option value=""' + (sel ? '' : ' selected') + '>ベース</option>' : '';
  GRADES.forEach(function(g){
    h += '<option value="' + g.n + '"' + (String(sel) === String(g.n) ? ' selected' : '') + '>' + g.n + ' ' + g.name + '</option>';
  });
  return h;
}

function renderPanel(){
  var cs = getCase();
  var el = document.getElementById('panel');
  var g = gradeOf(cs.color);
  var html = '<div class="concept">' + cs.concept + '</div>';
  html += '<div class="stats">';
  html += '<div class="stat"><div class="stat-label">カット数</div><div class="stat-val" id="st-cuts">' + cs.cuts.length + '</div></div>';
  html += '<div class="stat"><div class="stat-label">セリフ+NA文字数</div><div class="stat-val" id="st-chars">' + countChars(cs) + '</div></div>';
  html += '<div class="stat"><div class="stat-label">無言カット</div><div class="stat-val" id="st-silent">' + cs.cuts.filter(function(c){return c.silent;}).length + '</div></div>';
  html += '<div class="stat"><div class="stat-label">P4判定</div><div class="stat-val pass">PASS</div></div>';
  html += '</div>';
  html += '<p class="sec-h">アセット棚 — <strong style="color:var(--text-secondary);font-weight:500">パスが生成に渡る本体</strong>。サムネは確認用プレビューで、画像自体はチャットに送られません（送られるのはパス＝@タグの一覧）</p>';
  html += '<div class="assets" id="assets">';
  cs.assets.forEach(function(a, i){
    var unset = pathUnset(a);
    html += '<div class="a-card' + (unset ? ' unset' : '') + '" data-ai="' + i + '">';
    html += '<div class="a-thumb-wrap"><div class="a-thumb' + (a.pic ? ' has-img' : '') + '" data-aimg="' + i + '" title="クリックで画像を選択 / D&D可（プレビュー＋パス自動補完）">' + (a.pic ? '' : '<i class="ti ti-photo" style="font-size:18px" aria-hidden="true"></i>') + '</div><div class="a-cap">プレビュー</div></div>';
    html += '<div class="a-body"><span class="tag-chip" contenteditable="true" data-af="tag">' + a.tag + '</span><span class="a-kind">' + a.kind + '</span>';
    html += '<div class="a-name" contenteditable="true" data-af="name">' + a.name + '</div>';
    html += '<div class="a-path-label"><span class="a-path-badge"><i class="ti ti-arrow-down-right" style="font-size:11px" aria-hidden="true"></i>生成に渡すパス</span></div>';
    html += '<div class="a-path-row"><div class="a-path" contenteditable="true" data-af="path">' + a.path + '</div></div>';
    html += unset
      ? '<div class="a-note warn"><i class="ti ti-alert-triangle" style="font-size:12px" aria-hidden="true"></i>パス未設定：この状態では下流に渡りません（画像をドロップするか実パスを入力）</div>'
      : '<div class="a-note ok"><i class="ti ti-check" style="font-size:12px" aria-hidden="true"></i>このパスが生成に渡ります</div>';
    html += '</div>';
    html += '<button class="a-del" data-adel="' + i + '" title="このアセットを削除"><i class="ti ti-x" aria-hidden="true"></i></button>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="foot" style="justify-content:flex-start;margin:0 0 16px"><button id="a-add-btn"><i class="ti ti-plus" style="font-size:14px;vertical-align:-1px;margin-right:4px" aria-hidden="true"></i>アセット追加（プロップ等）</button></div>';
  html += '<div class="look-box"><label>カラーグレード（/color-grade-library）</label><select id="g-color">' + colorOptions(cs.color, false) + '</select>';
  html += '<span style="font-size:11px;color:var(--text-muted)">' + (g ? g.mood : '') + '</span>';
  html += '<span class="look-en" id="g-en">' + (g ? g.en : '') + '</span></div>';
  html += '<div class="cast-box">';
  cs.cast.forEach(function(p){
    html += '<strong>' + p.name + '</strong>: <span>' + p.desc + ' / ' + p.voice + '</span><br>';
  });
  html += '</div>';
  html += '<div class="tbl-wrap"><table><thead><tr><th style="width:26px"></th><th style="width:34px">Cut</th><th style="width:64px">Time</th><th>画像</th><th>画（ト書き）</th><th>カメラ</th><th>参照</th><th>音声</th><th style="width:64px">SE</th><th style="width:76px">テロップ</th><th style="width:92px">色</th></tr></thead><tbody id="tbody">';
  cs.cuts.forEach(function(c, i){
    var cls = c.cta ? 'cta-row' : (c.silent ? 'silent' : '');
    html += '<tr' + (cls ? ' class="' + cls + '"' : '') + ' data-idx="' + i + '">';
    html += '<td><button class="del-btn" data-del="' + i + '" title="このカットを削除"><i class="ti ti-x" aria-hidden="true"></i></button></td>';
    html += '<td>C' + (i + 1) + '</td>';
    html += '<td contenteditable="true" data-f="time" style="min-width:64px">' + c.time + '</td>';
    html += '<td><div class="img-cell' + (c.pic ? ' has-img' : '') + '" data-img="' + i + '" title="クリックで画像を選択 / D&D可">' + (c.pic ? '' : '<i class="ti ti-photo" style="font-size:20px" aria-hidden="true"></i>') + '</div></td>';
    html += '<td contenteditable="true" data-f="img">' + c.img + '</td>';
    html += '<td contenteditable="true" data-f="cam" style="min-width:130px;font-size:12px;color:var(--text-secondary)">' + c.cam + '</td>';
    html += '<td contenteditable="true" data-f="refs" class="refs-td">' + c.refs + '</td>';
    html += '<td contenteditable="true" data-f="audioHtml">' + c.audioHtml + '</td>';
    html += '<td contenteditable="true" data-f="se" style="min-width:64px">' + c.se + '</td>';
    html += '<td contenteditable="true" data-f="tl" style="min-width:76px">' + c.tl + '</td>';
    html += '<td><select data-color="' + i + '">' + colorOptions(c.color, true) + '</select></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  html += '<div class="foot"><button id="add-btn"><i class="ti ti-plus" style="font-size:14px;vertical-align:-1px;margin-right:4px" aria-hidden="true"></i>カット追加</button>';
  html += '<button id="send-btn">この案をチャットに送る ↗</button></div>';
  html += '<div class="undo-bar" id="undo-bar"><span>カットを削除しました</span><button id="undo-btn">元に戻す</button></div>';
  html += '<div class="gate-comment"><strong>P4ゲート:</strong> ' + cs.gate + '</div>';
  el.innerHTML = html;
  hydrateImages(cs);
  wire();
}

function hydrateImages(cs){
  cs.cuts.forEach(function(c, i){
    if(!c.pic) return;
    var cell = document.querySelector('.img-cell[data-img="' + i + '"]');
    if(!cell) return;
    cell.innerHTML = '';
    var im = document.createElement('img');
    im.src = c.pic;
    var bd = document.createElement('button');
    bd.className = 'img-del'; bd.dataset.imgdel = i; bd.title = '画像を削除';
    bd.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
    cell.appendChild(im); cell.appendChild(bd);
  });
  cs.assets.forEach(function(a, i){
    if(!a.pic) return;
    var cell = document.querySelector('.a-thumb[data-aimg="' + i + '"]');
    if(!cell) return;
    cell.innerHTML = '';
    var im = document.createElement('img');
    im.src = a.pic;
    cell.appendChild(im);
  });
}

function refreshStats(){
  var cs = getCase();
  var a = document.getElementById('st-cuts');
  var b = document.getElementById('st-chars');
  var c = document.getElementById('st-silent');
  if(a) a.textContent = cs.cuts.length;
  if(b) b.textContent = countChars(cs);
  if(c) c.textContent = cs.cuts.filter(function(x){return x.silent;}).length;
}

function wire(){
  var tbody = document.getElementById('tbody');
  var assetsEl = document.getElementById('assets');
  var cs = getCase();

  tbody.addEventListener('input', function(e){
    var td = e.target.closest('td[data-f]');
    if(!td) return;
    var tr = td.closest('tr');
    var cut = cs.cuts[+tr.dataset.idx];
    if(!cut) return;
    if(td.dataset.f === 'audioHtml') cut.audioHtml = td.innerHTML;
    else cut[td.dataset.f] = td.textContent;
    clearTimeout(statsTimer);
    statsTimer = setTimeout(refreshStats, 400);
  });

  tbody.addEventListener('change', function(e){
    var sel = e.target.closest('select[data-color]');
    if(!sel) return;
    cs.cuts[+sel.dataset.color].color = sel.value;
  });

  assetsEl.addEventListener('input', function(e){
    var f = e.target.closest('[data-af]');
    if(!f) return;
    var card = f.closest('.a-card');
    var a = cs.assets[+card.dataset.ai];
    if(a) a[f.dataset.af] = f.textContent;
  });

  // パス編集が終わったら未設定/設定済みの表示だけ更新（入力中は再描画しない＝フォーカス維持）
  assetsEl.addEventListener('focusout', function(e){
    var f = e.target.closest('[data-af="path"]');
    if(!f) return;
    var card = f.closest('.a-card');
    var a = cs.assets[+card.dataset.ai];
    if(!a) return;
    var unset = pathUnset(a);
    var note = card.querySelector('.a-note');
    card.classList.toggle('unset', unset);
    if(note){
      note.className = 'a-note ' + (unset ? 'warn' : 'ok');
      note.innerHTML = unset
        ? '<i class="ti ti-alert-triangle" style="font-size:12px" aria-hidden="true"></i>パス未設定：この状態では下流に渡りません（画像をドロップするか実パスを入力）'
        : '<i class="ti ti-check" style="font-size:12px" aria-hidden="true"></i>このパスが生成に渡ります';
    }
  });

  assetsEl.addEventListener('click', function(e){
    var del = e.target.closest('.a-del');
    if(del){ cs.assets.splice(+del.dataset.adel, 1); renderPanel(); return; }
    var th = e.target.closest('.a-thumb');
    if(th){
      var i = +th.dataset.aimg;
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function(ev){
        var f = ev.target.files[0]; if(!f) return;
        importAssetImage(f, cs.assets[i]);
      };
      inp.click();
    }
  });

  assetsEl.addEventListener('dragover', function(e){ if(e.target.closest('.a-thumb')) e.preventDefault(); });
  assetsEl.addEventListener('drop', function(e){
    var th = e.target.closest('.a-thumb');
    if(!th || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault();
    var f = e.dataTransfer.files[0];
    if(f && f.type.indexOf('image/') === 0) importAssetImage(f, cs.assets[+th.dataset.aimg]);
  });

  document.getElementById('a-add-btn').onclick = function(){
    cs.assets.push({tag:'@prop' + (cs.assets.length + 1), kind:'プロップ', name:'新規アセット', path:BASE, pic:''});
    renderPanel();
  };

  document.getElementById('g-color').onchange = function(){
    cs.color = this.value;
    renderPanel();
  };

  tbody.addEventListener('click', function(e){
    var imgdel = e.target.closest('.img-del');
    if(imgdel){
      e.stopPropagation();
      cs.cuts[+imgdel.dataset.imgdel].pic = '';
      renderPanel();
      return;
    }
    var del = e.target.closest('.del-btn');
    if(del){
      var i = +del.dataset.del;
      undoStack.push({ caseId: cs.id, idx: i, cut: cs.cuts.splice(i, 1)[0] });
      renderPanel();
      var ub = document.getElementById('undo-bar');
      if(ub){ ub.style.display = 'flex'; setTimeout(function(){ if(ub) ub.style.display = 'none'; }, 6000); }
      return;
    }
    var ic = e.target.closest('.img-cell');
    if(ic){
      var ii = +ic.dataset.img;
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function(ev){
        var f = ev.target.files[0]; if(!f) return;
        importImage(f, cs.cuts[ii], renderPanel);
      };
      inp.click();
    }
  });

  tbody.addEventListener('mousedown', function(e){
    var tr = e.target.closest('tr');
    if(!tr) return;
    tr.draggable = !e.target.closest('[contenteditable]') && !e.target.closest('select');
  });
  tbody.addEventListener('dragstart', function(e){
    var tr = e.target.closest('tr');
    if(!tr || !tr.dataset.idx){ return; }
    dragIdx = +tr.dataset.idx;
    tr.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  tbody.addEventListener('dragend', function(e){
    var tr = e.target.closest('tr');
    if(tr) tr.classList.remove('dragging');
    tbody.querySelectorAll('tr').forEach(function(r){ r.classList.remove('drag-over'); });
  });
  tbody.addEventListener('dragover', function(e){
    e.preventDefault();
    var tr = e.target.closest('tr');
    tbody.querySelectorAll('tr').forEach(function(r){ r.classList.remove('drag-over'); });
    if(tr) tr.classList.add('drag-over');
  });
  tbody.addEventListener('drop', function(e){
    var tr = e.target.closest('tr');
    if(!tr) return;
    var i = +tr.dataset.idx;
    if(e.dataTransfer.files && e.dataTransfer.files.length){
      e.preventDefault();
      var f = e.dataTransfer.files[0];
      if(f && f.type.indexOf('image/') === 0){
        importImage(f, cs.cuts[i], renderPanel);
      }
      return;
    }
    e.preventDefault();
    if(dragIdx === null || dragIdx === i){ tbody.querySelectorAll('tr').forEach(function(r){ r.classList.remove('drag-over'); }); return; }
    var moved = cs.cuts.splice(dragIdx, 1)[0];
    cs.cuts.splice(i, 0, moved);
    dragIdx = null;
    renderPanel();
  });

  document.getElementById('add-btn').onclick = function(){
    cs.cuts.push({time:'',pic:'',img:'',cam:'',refs:'',audioHtml:'',audio:'',delivery:'',se:'',tl:'',color:'',silent:false,cta:false});
    renderPanel();
  };

  document.getElementById('undo-btn').onclick = function(){
    if(!undoStack.length) return;
    var last = undoStack.pop();
    var target = CASES.find(function(c){ return c.id === last.caseId; });
    if(target){ target.cuts.splice(last.idx, 0, last.cut); if(target.id === activeTab) renderPanel(); }
  };

  var sendBtn = document.getElementById('send-btn');
  var sendOrig = sendBtn.innerHTML;
  sendBtn.onclick = function(){
    var text = buildScriptText(cs);
    var unsetN = cs.assets.filter(pathUnset).length;
    var sent = false;
    try{
      if(typeof sendPrompt === 'function'){ sendPrompt(text); sent = true; }
      else if(window.sendPrompt){ window.sendPrompt(text); sent = true; }
    }catch(err){ sent = false; }
    if(sent){
      sendBtn.textContent = unsetN ? ('送信しました（パス未設定' + unsetN + '件に注意）') : '送信しました';
    } else {
      var copied = false;
      try{
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      }catch(err){ copied = false; }
      if(!copied && navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text);
        copied = true;
      }
      sendBtn.textContent = copied ? 'コピーしました — チャット欄に貼り付けてください' : '送信もコピーも失敗';
    }
    setTimeout(function(){ sendBtn.innerHTML = sendOrig; }, 4000);
  };
}

function render(opts){
  CASES = (opts && opts.cases) || [];
  BASE = (opts && opts.base) || '';
  if(!CASES.length) return;
  if(!document.getElementById('sbc-style')){
    var st = document.createElement('style');
    st.id = 'sbc-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  var tabsEl = document.getElementById('tabs');
  var panelEl = document.getElementById('panel');
  if(tabsEl) tabsEl.classList.add('sbc');
  if(panelEl) panelEl.classList.add('sbc');
  CASES.forEach(function(cs){
    cs.cuts.forEach(function(c){
      if(c.audioHtml === undefined){
        c.audioHtml = (c.audio || '') + (c.delivery ? '<br><span class="delivery">[' + c.delivery + ']</span>' : '');
      }
    });
  });
  activeTab = CASES[0].id;
  undoStack.length = 0;
  renderTabs();
  renderPanel();
}

window.StoryboardChat = { render: render, GRADES: GRADES };
})();
