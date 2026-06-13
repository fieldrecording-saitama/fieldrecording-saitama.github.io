# Field Recording Club Saitama Sound Map

フィールドレコーディングクラブさいたまのサンプル1枚ページです。

## 内容

- 2026年7月18日プレイベントの告知
- MapLibre GL JSによる音地図（一時非表示中）
- GeoJSONで管理する録音地点データ
- SoundCloud埋め込みプレイヤー

## ローカル確認

```sh
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

## 主なファイル

- `index.html`
- `assets/css/style.css`
- `assets/js/main.js`
- `data/sounds.geojson`
