# claude-widgets

Claude Code チャットウィジェット用の静的ランタイム置き場（jsdelivr CDN経由で配信）。

## storyboard-chat.js
絵コンテチャット（storyboard-chat スキル v1.2）のランタイム。
チャット側にはカットデータだけを流し、CSS/JS本体はここから読み込むことで表示を高速化する。

使い方:
```html
<div class="tabs" id="tabs"></div>
<div id="panel"></div>
<script src="https://cdn.jsdelivr.net/gh/roooools/claude-widgets@v1.2.0/storyboard-chat.js"></script>
<script>
StoryboardChat.render({cases: CASES, base: BASE});
</script>
```

更新手順: storyboard-chat.js を編集 → commit → 新しいタグ（v1.2.x）をpush → スキルSKILL.mdのCDN URLを新タグに更新。
