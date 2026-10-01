# Project Tree

```text
life-in-weeks/
├── AGENTS.md
├── README.md
├── docs/
│   ├── architecture.md
│   ├── backend-readiness.md
│   ├── deployment.md
│   ├── environment-variables.md
│   ├── production-checklist.md
│   ├── supabase-setup.md
│   └── ...
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── scripts/
│   ├── generate-icons.mjs
│   └── verify-e2e.mjs
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.css
│   ├── constants.ts
│   ├── types.ts
│   ├── modules/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── diary/
│   │   ├── feedback/
│   │   ├── legal/
│   │   ├── life/
│   │   ├── mood/
│   │   ├── preferences/
│   │   └── profile/
│   └── shared/
│       ├── integrations/supabase/
│       ├── lib/
│       └── ui/
├── supabase/
│   └── migrations/
├── vercel.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── package-lock.json
```

Generated folders such as `dist/`, `.vercel/`, `node_modules/`, screenshots, and Playwright output are not part of the active source tree.
