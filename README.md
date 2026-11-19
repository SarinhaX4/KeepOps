# KeepOps

**Keep the context. Keep operations moving.**

Caderno de validação digital do plantonista que acompanha mudanças de infraestrutura (GMUDs) fora do horário comercial, com passagem de plantão e pendências para a equipe da semana.

> Projeto acadêmico (AT2-N2 · React Native). Todos os dados são **fictícios** e demonstrativos.

## Stack
Expo SDK 58 · React Native · TypeScript (strict) · Expo Router · Supabase (Postgres, Auth, RLS) · TanStack Query · Zustand · react-hook-form + zod · date-fns

## Como rodar

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha com as chaves do seu projeto Supabase.
3. No Supabase, abra **SQL Editor** e execute `supabase/migrations/20261119000000_init.sql`.
4. `npm run seed` — cria a equipe demo, os usuários e os dados de exemplo.
5. `npx expo start` e abra no Expo Go.

### Usuários demonstrativos
| Usuário | E-mail | Papel |
|---|---|---|
| Ana Souza | ana.souza@example.com | Plantonista |
| João Lima | joao.lima@example.com | Plantonista |
| Marina Costa | marina.costa@example.com | Equipe da semana |

Senha de todos: `KeepOps#Demo2026` (ambiente demonstrativo).

## Scripts
- `npm run check` — typecheck + lint
- `npm run seed` — recria os dados demonstrativos
- `npm run format` — Prettier

## Documentação
- [Especificação](docs/SPEC.md)
- [Identidade visual](docs/IDENTIDADE_VISUAL.md)
- [Progresso](docs/PROGRESSO.md)
