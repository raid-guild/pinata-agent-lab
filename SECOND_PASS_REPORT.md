# Second Pass Report

Date: 2026-04-29

Scope: second pass across the five Pinata template lab projects with the new steering: read-only browser dashboards, chat/API write paths, optional `APP_PASSWORD` Basic Auth, richer workspace identity/bootstrap docs, and per-template design variation inspired by getdesign.md.

## Summary

All five templates completed the second pass and have clean committed checkpoints.

| Template | Commit | Status | Validation |
| --- | --- | --- | --- |
| Micro CRM | `b9556b0` | Complete | build, typecheck, local `/app`, health, data API, auth |
| Practice Coach | `3e0710f` | Complete | build, typecheck, local `/app`, health, data API, auth |
| Field Notes Research | `94d46f7` | Complete | build, typecheck, local `/app`, health, data API, auth |
| Memory Garden | `ae4f7e2` | Complete | build, typecheck, local `/app`, health, data API, auth |
| Community Quest Board | `770f75e` | Complete | build, typecheck, local `/app`, health, auth |

## What Changed

- Browser UIs are now read-only dashboards. They still allow selection, filtering, and navigation where useful, but form-based writes were removed.
- Existing write APIs remain available for chat/agent operation.
- Each project has `workspace/OPERATIONS.md` documenting API reads, write payloads, auth behavior, and safe agent rules.
- `workspace/BOOTSTRAP.md`, `workspace/IDENTITY.md`, `workspace/AGENTS.md`, and `workspace/USER.md` were expanded around chat-first setup and operating identity.
- Optional Basic Auth is available through `APP_PASSWORD`. If unset, the apps work normally. If set, `/app` and API routes are protected.
- Designs now diverge more:
  - Micro CRM: restrained relationship portfolio.
  - Practice Coach: training status dashboard.
  - Field Notes Research: evidence-first research dossier.
  - Memory Garden: visual knowledge map.
  - Community Quest Board: compact coordination board.

## Notes

The manifest pass checked the actual `pinata-tamagotchi`, `pinata-chef`, Pinata docs, and example-template pattern. All five lab templates now use `https://agents.pinata.cloud/schemas/manifest.v1.json`, numeric `version: 1`, agent `emoji`/`vibe`, `template.category`/`authorName`/`tags`, build/start scripts, and array-based `/app` routes.

`APP_PASSWORD` remains an optional runtime environment convention documented in each template. It is intentionally not listed as a manifest secret for this pass, matching the simpler working template examples and avoiding optional-secret schema drift during deploy validation.

## Next Polish

1. Add template-level smoke scripts that validate `manifest.json`, build, health, and auth behavior consistently.
2. Do one visual QA pass in a browser for mobile and desktop layouts.
3. Add chat playbooks with concrete first-session examples for each template.
4. Test one or two templates through real Pinata deployment to confirm the manifest, route, and middleware assumptions.
5. Revisit `APP_PASSWORD` manifest secrets only if Pinata's deploy validator confirms optional secrets are accepted in the current schema.
