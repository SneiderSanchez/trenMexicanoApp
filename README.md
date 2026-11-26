# Tren Mexicano Scorekeeper

Mobile-first scorekeeper for a physical game of Tren Mexicano (Mexican Train dominoes). React (TypeScript) + Convex — see `docs/adr/0001-convex-backend-with-username-pin.md` and `GLOSSARY.md`.

## Running locally

```sh
npm install
npm run dev:backend   # Convex dev deployment; writes VITE_CONVEX_URL to .env.local
npm run dev           # Vite frontend, in a second terminal
```

`npx convex dev` prompts you to log in or use a local deployment the first time.

## Checks

```sh
npm test           # convex-test suite against the public Convex functions
npm run typecheck  # frontend + convex/
npm run lint
```
