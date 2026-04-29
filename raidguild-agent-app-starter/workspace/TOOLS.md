# Tools

Useful local commands:

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

Useful app routes:

- `/app`
- `/app/api/health`
- `/app/api/todos`
- `/app/api/todos/:id`
- `/app/api/openclaw/health`
- `/app/api/openclaw/responses`
- `/app/api/openclaw/hooks/:name`

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`

Marketplace validation and submission:

```bash
pinata agents templates validate https://github.com/user/my-template
pinata agents templates submit https://github.com/user/my-template
```

Database:

- SQLite database path: `data/starter.sqlite`
- Schema and seed logic: `lib/db.ts`
