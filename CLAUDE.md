# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

AnkiPocketは、英語学習のためのNext.jsウェブアプリケーションです。ユーザーは英単語や英文を入力して：
- 英単語の辞書定義を自動取得
- 英文の日本語翻訳を自動実行
- 関連画像を自動生成
- AnkiConnect経由でAnkiデスクトップアプリにカードを自動送信

## 開発コマンド

```bash
# 開発サーバー起動（ポート3000）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# ESLintでコード品質チェック
npm run lint

# Jestでテスト実行
npm run test

# Jestテスト監視モード（ファイル変更時に自動実行）
npm run test:watch

# 特定のテストファイルのみ実行
npm test -- <test-file-name>
```

## アーキテクチャ

### フロントエンド
- **フレームワーク**: React 19 + Next.js 15 (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS + shadcn/ui コンポーネント
- **アイコン**: Lucide React
- **状態管理**: React hooks (useState, useEffect)

### API構造
Next.js App Router API routes (`app/api/`)を使用：
- `/api/dictionary` - Dictionary API経由で英単語の定義取得
- `/api/translate` - MyMemory API経由で英文翻訳
- `/api/unsplash` - Unsplash API経由で関連画像取得
- `/api/auto-anki` - 自動処理（辞書/翻訳 + 画像 + Anki送信）
- `/api/manual-anki` - 手動入力によるAnki送信

### 外部API統合
- **Dictionary API**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **MyMemory Translation**: `https://api.mymemory.translated.net/get`
- **Unsplash API**: 画像検索と取得
- **AnkiConnect**: `http://127.0.0.1:8765` でローカルAnkiアプリと通信

## 主要コンポーネント

### メインページ (`app/page.tsx`)
- 単語/文章入力UI
- 自動判別（単語 vs 文章）による処理分岐
- 辞書結果・翻訳結果表示
- 画像生成・再生成機能
- 一括自動処理ボタン

### 手動入力フォーム (`components/ManualAnkiForm.tsx`)
- ユーザーが手動で単語・意味・画像を入力
- ファイルアップロードまたはURL指定による画像設定
- Tabs UIでファイル/URL入力方式を切り替え

### UI コンポーネント (`components/ui/`)
- shadcn/uiライブラリのコンポーネント群
- Button, Input, Card, Badge, Tabs等のプリミティブ

## テスト

### 設定
- **テストフレームワーク**: Jest + @testing-library/react
- **環境**: jsdom (ブラウザ環境をシミュレート)
- **設定ファイル**: `jest.config.js`, `jest.setup.js`

### テストファイル
- `__tests__/auto-anki.test.js` - 自動Anki送信機能の包括テスト
- `__tests__/api/translate.test.ts` - 翻訳API単体テスト

## 設定ファイル

### TypeScript (`tsconfig.json`)
- strict mode有効
- パスエイリアス: `@/*` → プロジェクトルート
- Next.js プラグイン設定済み

### Next.js (`next.config.mjs`)
- ESLint・TypeScriptビルドエラーを無視（開発効率優先）
- 画像最適化無効（外部API画像対応）

### 依存関係
- **UI**: @radix-ui/* (アクセシブルなプリミティブ)
- **フォーム**: react-hook-form + @hookform/resolvers
- **バリデーション**: zod
- **通知**: sonner (トースト通知)
- **テーマ**: next-themes (ダーク/ライトモード)

## AnkiConnect統合

AnkiConnectアドオン（2055492159）が必要：
1. ポート8765でローカル通信
2. CORS設定でwebCorsOriginListにドメイン追加が必要
3. 画像はbase64でstoreMediaFile APIを使用
4. 自動的に利用可能なノートタイプ・フィールドを検出して適応

## 開発時の注意点

- 新機能開発時は対応するテストを`__tests__/`に追加
- API routes追加時はエラーハンドリングを適切に実装
- UIコンポーネント変更時はTailwind CSSクラスの一貫性を保持
- 外部API呼び出しは適切なエラーハンドリングとフォールバック処理を含める