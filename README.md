# 設計小課堂

免費線上課程網站。網站放在 GitHub Pages，用 Pages CMS 當後台上架內容。

## 第一次設定（只要做一次）

1. **建立 GitHub 帳號**：到 https://github.com 註冊。
2. **建立 repository**：右上角「+」→「New repository」。名稱例如 `course-site`，選 **Public**，按「Create repository」。
3. **上傳檔案**：在新的 repository 頁面點「uploading an existing file」，把這個資料夾裡的檔案和資料夾全部拖進去，按「Commit changes」。
   - Finder 預設會隱藏 `.pages.yml`，這個檔案一定要上傳。在 Finder 裡按 `Cmd + Shift + .` 就能看到它。
   - `.claude` 資料夾和 `data.local.json` 不用上傳。
4. **開啟網站**：repository 的「Settings」→「Pages」→ Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`，按「Save」。等 1～2 分鐘，網址會是 `https://你的帳號.github.io/course-site/`。
5. **連接後台**：打開 https://app.pagescms.org ，用 GitHub 登入，依照畫面指示安裝 Pages CMS 的 GitHub App，並選擇這個 repository。

## 日常上架

到 https://app.pagescms.org 打開這個 repository，左邊會有四個選單：

| 選單 | 用途 |
| --- | --- |
| 課程主題 | 新增主題、加章節、貼 YouTube 網址、上傳封面和講義 |
| 常見問題 | 新增問答，可以置頂，也可以連到某一章 |
| 筆記分享 | 新增筆記，可以上傳 PDF |
| 網站設定 | 首頁文字、關於我、提問管道、抖內連結、最新消息 |

按「Save」之後，GitHub 會自動更新網站，通常 1～2 分鐘後重新整理就看得到。

### 上架一個新主題

1. 「課程主題」→「Add an entry」。
2. 填「網址代號」（小寫英文和數字，例如 `color`），建立後不要再改。
3. 填名稱、分類、簡介，上傳封面（建議 1600 × 900）。
4. 在「章節」按「Add」新增章節，貼上 YouTube 網址、影片長度、本章重點、時間軸。章節可以拖曳排序。
5. 新主題預設勾著「草稿」，網站上不會出現。全部準備好之後，取消勾選再存檔就會上線。

### 小提醒

- YouTube 影片要設成「公開」或「不公開」，設成「私人」的話網站上無法播放。
- 章節縮圖會自動抓 YouTube 的影片縮圖，不用另外做。
- 「網站設定」→「抖內」的網址留空的話，全站的抖內提示都會先隱藏。
- 想加贊助分級時，在「抖內」→「贊助方案」新增就會出現在支持我頁。

## 檔案說明

| 檔案 | 用途 |
| --- | --- |
| `index.html`、`assets/site.css`、`assets/site.js` | 網站本體 |
| `_data/` | 所有內容（後台改的就是這裡） |
| `assets/uploads/` | 後台上傳的圖片和 PDF |
| `.pages.yml` | 後台的選單和欄位設定 |
| `data.json` | GitHub Pages 會用它把 `_data` 組成網站讀的資料 |
| `preview.py` | 在自己電腦上預覽用 |

## 在自己電腦上預覽

在這個資料夾打開終端機，輸入：

```bash
python3 preview.py
```

再用瀏覽器打開 http://localhost:8000 。
