# Tools

- Next.js App Router for the web app.
- SQLite through `better-sqlite3` for local persistence.
- PM2-compatible `ecosystem.config.cjs` for production runtime.

Hosted route helper:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Use the derived URL only when `HOSTNAME` matches the observed Pinata pattern. Otherwise, direct the user to the Routes tab.
