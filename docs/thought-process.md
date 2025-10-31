# 設計メモ & 思考過程

## ゴール整理
- 2 日間程度で完成度の高いハッピーパスを提供することを最優先。
- 従業員の申請 → 承認者の処理 → 管理者によるワークフロー設定の 3 役割がシームレスに動くこと。
- 実運用を想定した拡張余地 (PostgreSQL / Supabase への移行、通知、監査ログなど) を意識しつつも MVP 範囲に収める。

## 技術選定
- **Next.js 16 (App Router)**: フロント・バックを一体で構築でき、Server Actions を使えばフォーム送信のロジックをサーバ側に閉じ込められる。認証や DB アクセスのための API サーバを別途立てる必要がなく、課題期間内で完成させやすい。
- **Prisma + SQLite**: Prisma による型安全なデータアクセスと、`file:` 接続でローカル DB を瞬時に作り直せる開発体験。スキーマは PostgreSQL 互換を意識しており、Supabase への移行コストも低い。
- **手作りセッション認証**: 研修課題ではサードパーティ認証よりも、ユースケース実装に時間を割くべきと判断し HMAC 署名付きクッキーセッションを採用。NextAuth/Supabase Auth への移行が必要になった場合も切り替えしやすい構造。
- **Vitest**: Server Action から切り出したサービス層を Node ランタイムでテストしやすい。Prisma を `npx prisma db push` でテスト用 DB に同期させてからフローを実行。

### Supabase を使うとしたら?
- **利用メリット**: PostgreSQL、Storage、Auth が揃っており、特に領収書ファイルの保管先として最適。Webhooks や Edge Functions を使えば通知連携も容易。
- **導入見送り理由**: 本課題ではローカル検証とテストのスピードを優先。Supabase を組み込むとプロジェクト初期に環境構築のコストが増え、評価対象の「設計・実装判断」の時間を圧迫すると判断した。
- **移行手順の想定**:
  1. Prisma スキーマの `provider` を `postgresql` に変更、`DATABASE_URL` を Supabase connection string に差し替え。
  2. Storage バケットを作成し、`lib/uploads.ts` を Supabase Storage API 呼び出しに変更。
  3. Supabase Auth を採用する場合、`lib/auth.ts` を撤廃し、RLS とアクセスポリシーで権限管理を実装。

## ドメイン設計
- **Workflow**: 申請者の職位ごとに承認ステップ (職位) を登録。ステップは順序付きで、各ステップの approverTitle をユーザーの jobTitle で解決。
- **ExpenseReport / ExpenseApprovalStep**: 申請時にワークフローを展開して approval steps を作成。最初のステップのみ `PENDING`、それ以降は `WAITING` にして明示的に進行管理。
- **User**: role によってナビゲーションを出し分け。承認者は jobTitle をキーにステップへアサインされるため、ユーザー異動時は jobTitle を更新するだけで対応可能。

## 主要なトレードオフ
- **セッション vs. JWT**: 短納期での実装と CSRF 回避を両立するため、Server Action からのみ state-changing 操作を行い、HTTP-only Cookie を利用。
- **ファイル保存**: MVP ではローカルディスク (`./uploads`) に保存。監査要件やマルウェアスキャンを考えるとオブジェクトストレージ連携が不可欠なため README に改善案として記載。
- **Workflow 柔軟性**: 並列承認や SLA/エスカレーションは未実装。将来必要なら `expense_approval_steps` にグループ ID や期限フィールドを追加する方針。

## テスト方針
- もっとも重要なフローである「申請 → 承認 → 次ステップ」と「却下時に残りステップをスキップ」を Vitest で自動化。
- テスト実行時は Prisma 用に空の SQLite ファイルを作成 → `db push` でスキーマを同期 → サービス層の関数を直接呼び出し、結果を Prisma 経由で検証。

## 今後の拡張アイデア
- Prisma Migrate を導入し、CI/CD で DB 変更を管理。
- Server Actions を API Route に揃えて、Next.js 以外のクライアント (例: モバイル) でも再利用できるようにする。
- Supabase Storage / Auth 連携、または Azure AD 連携による SSO 対応。
- 承認者向けダッシュボード (ソート、フィルタ、集計) とエクスポート機能。
- 通知 (メール、Slack / Teams) と監査ログの追加。
