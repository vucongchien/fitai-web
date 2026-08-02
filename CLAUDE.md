# CLAUDE.md - Project Guidelines for AI Agents

## Commands

- **Dev**: `pnpm run dev`
- **Build**: `pnpm run build`
- **Lint**: `pnpm run lint` (runs `oxlint`)
- **Format**: `pnpm run format` (runs `oxfmt`)
- **Typecheck**: `pnpm run typecheck` (runs `tsc --noEmit`)

## Next.js conventions

- Refer to `node_modules/next/dist/docs/` for the APIs of the exact installed Next.js version.
- Always `await` `params` and `searchParams`.
- Use `oxlint` and `oxfmt` instead of ESLint and Prettier.
