# Expense Approval MVP (Next.js)

研修課題向けに構築した、職位ベースの承認フローを備えた経費申請アプリです。Next.js App Router と Prisma (SQLite) を採用し、2 日間程度で実装できるシンプルさと拡張性のバランスを重視しています。

## Tech Stack

- Next.js 16 (App Router, Server Actions)
- Prisma + SQLite (ローカル検証用)。PostgreSQL 互換の Supabase へ移行しやすいスキーマ設計
- TypeScript + Zod バリデーション
- Vitest でサービス層のユースケースを検証

## 主要機能

- **従業員**: 経費申請、領収書アップロード、承認ステータス確認
- **承認者**: 自身にアサインされた申請を承認 / 却下。コメントを残すと次工程へ自動遷移
- **管理者**: 申請者の職位ごとに承認経路を設定 (例: Engineer → Team Lead → Finance)

## 動作要件

- Node.js 20 以上
- npm (標準付属)。pnpm/bun でも動作しますが、本手順では npm を使用

## セットアップ手順

1. **依存パッケージのインストール**

   ```bash
   npm install
   cp .env.example .env
   ```

2. **Prisma スキーマを適用 & サンプルデータ投入**

   ```bash
   npm run db:push
   npm run db:seed
   ```

   作成されるサンプルアカウント:

   | ロール | email | password |
   | --- | --- | --- |
   | 従業員 | engineer@example.com | engineerpass |
   | チームリード (承認者) | lead@example.com | leadpass |
   | 財務 (承認者) | finance@example.com | financepass |
   | 管理者 | admin@example.com | adminpass |

3. **開発サーバの起動**

   ```bash
   npm run dev
   ```

   `http://localhost:3000/login` へアクセスして上記アカウントでログインしてください。

4. **テスト実行**

   ```bash
   npm run test
   ```

   Vitest によるサービス層テスト (申請 → 承認 / 却下のハッピーパス) が走ります。

## ディレクトリ構成 (主要部のみ)

```
app/
  (public)/login/     # ログインページ (Form Actions)
  (app)/              # 認証後のレイアウト/ページ
lib/
  services/           # ユースケース層 (経費申請/承認)
  auth.ts             # セッションベース認証
  prisma.ts           # PrismaClient シングルトン
prisma/
  schema.prisma       # データモデル
  seed.ts             # サンプルデータ投入スクリプト
tests/
  expense-flow.test.ts
```
