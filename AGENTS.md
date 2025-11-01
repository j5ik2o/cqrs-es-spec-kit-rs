<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

@.specify/memory/constitution.md

## Active Technologies
- Rust 1.80 系（コマンドサービス）、TypeScript 5.x + Next.js 15（フロント/管理UI） + event-store-adapter-rs, async-graphql, sqlx, AWS SES (メール通知), NextAuth.js (セッション管理) (001-init-user-management)
- DynamoDB（イベントストア）、MySQL（読みモデル）、Redis Streams（リアルタイム通知） (001-init-user-management)

## Recent Changes
- 001-init-user-management: Added Rust 1.80 系（コマンドサービス）、TypeScript 5.x + Next.js 15（フロント/管理UI） + event-store-adapter-rs, async-graphql, sqlx, AWS SES (メール通知), NextAuth.js (セッション管理)
