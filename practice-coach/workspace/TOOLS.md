# Tools

Local tools:

- Next.js App Router
- SQLite through `better-sqlite3`
- PM2 via `ecosystem.config.cjs`

No external secrets are required.

Hosted route helper:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Use the derived URL only when `HOSTNAME` matches the observed Pinata pattern. Otherwise, direct the user to the Routes tab.
