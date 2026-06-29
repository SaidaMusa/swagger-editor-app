# Swagger Editor App

Full-stack React application for editing OpenAPI/Swagger specifications, viewing endpoints, executing requests through a server-side proxy, and reviewing request history with analytics.

## Stack

- Next.js App Router
- TypeScript
- React
- Server route handlers for auth, schema storage, proxy requests, and analytics
- File-based JSON storage for local demo
- Vitest, ESLint, Prettier, Husky

## Demo

`https://swagger-editor-app-ashy.vercel.app/`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use this password format for registration: at least 8 characters, one letter, one digit, and one special character.

## Available scripts

```bash
npm run dev
npm run build
npm run lint
npm run format:check
npm run test
npm run test:coverage
```

## Main features

- Public Swagger Editor and Swagger Viewer on the main page
- JSON and YAML schema loading
- Format auto-detection
- JSON ↔ YAML conversion
- Structural OpenAPI/Swagger validation with visible errors
- Endpoint viewer grouped by path and method
- Parameters, request body, response schemas, examples, and status codes
- Try-It-Out request execution through `/api/proxy` to avoid browser CORS problems
- cURL generation and clipboard copy
- Email/password sign up and sign in
- HttpOnly cookie session
- Protected history route
- Server-rendered request history and analytics
- Saved schema restore for authenticated users
- Public About page
- English and Uzbek UI language switcher
- Sticky animated header
- Friendly application error page and request error messages

## Repository requirements checklist

- Private GitHub repo name: `swagger-editor-app`
- `develop` branch is the default development branch
- `main` branch contains only `README.md`, `.gitignore`, `.github/pull_request_template.md` before final PR
- Create PR from `develop` to `main`
- Do not merge the PR
- Add deployed app link to README
- Add YouTube video link to PR
- Make repo public after the deadline

## Deployment note

This starter uses local file storage in `.data/db.json`. It is good for local demo and development. For a production serverless deployment, replace `src/lib/db.ts` with Supabase, Firebase, Postgres, or another persistent database, because serverless file systems can be ephemeral.
