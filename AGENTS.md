# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 16 App Router project. Application routes live in `src/app`, including the home page and exam detail route at `src/app/exams/[id]`. Reusable UI is under `src/components`, split by feature (`analysis`, `chat`, `exam`, `layout`) and base primitives in `src/components/ui`. Shared logic lives in `src/hooks`, `src/services`, `src/store`, `src/types`, `src/lib`, and `src/utils`. Static assets are in `public/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the local development server on `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: serve the production build locally.
- `npm run lint`: run ESLint with the Next.js core-web-vitals and TypeScript config.

Set local API endpoints in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/chat
```

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode and the `@/*` path alias from `tsconfig.json`. Follow the existing file style: functional React components, PascalCase for component files (`ExamList.tsx`), camelCase for hooks and utilities (`useAnalysis.ts`, `chatContext.ts`), and descriptive Zustand store names (`analysisStore.ts`). Prefer single quotes in app code, keep JSX indentation consistent at two spaces, and rely on `npm run lint` before submitting changes.

## Testing Guidelines
There is no committed test runner yet. Until one is added, treat linting and manual verification as required gates. For UI changes, verify the affected route in `npm run dev`; for API changes, confirm behavior against the backend configured through `.env.local`. When adding tests, place them near the feature or under `src/tests`, and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history mixes informal commits (`Phase 1`) with conventional ones (`feat: 网页版本`). Prefer Conventional Commits going forward, for example `feat: add subject summary card` or `fix: handle missing chat response`. Keep pull requests focused, describe user-facing changes, link the related issue when available, and include screenshots or short recordings for UI updates.

## Agent-Specific Notes
This repository uses a newer Next.js release. Before changing framework-specific code, read the relevant guide in `node_modules/next/dist/docs/` and follow current conventions rather than older Next.js patterns.
