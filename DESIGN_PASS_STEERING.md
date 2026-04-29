# Design Pass Steering

Date: 2026-04-29

Goal: make the five template dashboards feel like five distinct products instead of variants of the same three-column admin layout. Keep the browser experience read-only and keep chat/API as the write interface, but give each app a stronger visual identity, richer data presentation, and a small amount of tasteful motion.

## Global Requirements

- Add the footer text `built by the RaidGuild cohort` to every app.
- Preserve `/app` as the public route and keep existing APIs unchanged.
- Keep dashboards read-only. Filtering, selection, tabs, view toggles, and hover states are allowed. Mutating forms and browser writes are not.
- Avoid the repeated pattern of topbar + metric pills + left list + center detail + right panel. Each template should use a different page architecture.
- Use distinct typography choices through CSS font stacks. Do not add a font service dependency unless it is already local and reliable in template deploys.
- Add visual data elements where the data supports it: sparklines, rings, timelines, heatmaps, matrix views, mini charts, node maps, board density indicators, progress bars, or SVG illustrations.
- Add subtle CSS animation only where it improves comprehension or personality. Respect `prefers-reduced-motion`.
- Do not add heavyweight charting libraries for this pass. Prefer CSS, inline SVG, simple React-rendered SVG, and semantic HTML.
- Avoid one-note palettes. Each app needs a different color logic, contrast rhythm, and density.
- Keep layouts responsive with stable dimensions. Mobile must not become a crushed version of desktop columns.
- Keep `APP_PASSWORD`, `API_PASSWORD`, OpenClaw proxy routes, manifests, and workspace docs intact.
- Run `npm run build` and `npm run typecheck` for each changed project.

## Shared Footer Pattern

Every app should end with a quiet footer:

```tsx
<footer className="cohortFooter">built by the RaidGuild cohort</footer>
```

Style it to match each product rather than copying one footer style everywhere. It should be visible but not loud.

## Template Briefs

### Micro CRM

Design direction: relationship command center for a solo operator. It should feel sharp, executive, and signal-rich, more like a deal cockpit than a generic CRM.

Layout:

- Replace the three-column layout with a "relationship radar" dashboard.
- Use a wide top zone with next follow-ups and pipeline health.
- Put contacts into a compact account grid or kanban-like relationship matrix, not a vertical sidebar.
- Selected contact can appear as a slide-out style detail panel or full-width dossier band below the radar.

Visual elements:

- Pipeline distribution as segmented bars or small stacked horizontal bands.
- Follow-up urgency as a date heat strip.
- Contact status as precise badges and thin timeline ticks.
- Draft follow-ups as message cards with status ribbons.

Motion:

- Subtle hover lift on account tiles.
- Animated progress fill on pipeline bars after load.
- No playful animation; keep this one controlled and professional.

Palette and type:

- High-contrast neutral base, ink/graphite text, one strong accent for urgency, one cooler accent for active relationships.
- Use a narrow or system UI stack that feels operational: `Inter`, `Aptos`, `Segoe UI`, sans-serif.

Must not:

- Look like a SaaS landing page.
- Use oversized cards for every metric.
- Hide due follow-ups below the fold.

### Personal Practice Coach

Design direction: training console with movement and momentum. It should feel active, physical, and focused, closer to a practice studio dashboard than an admin app.

Layout:

- Replace the generic grid with a "session arena" layout.
- Use a hero performance ring or training dial for the selected goal.
- Put goals in a horizontal discipline switcher or track lane.
- Recent sessions should read like workout intervals or practice reps, not basic list rows.

Visual elements:

- Streak ring using CSS conic gradients or SVG.
- Weekly practice heatmap.
- Session timeline with minutes as bar lengths.
- Next drill displayed as a coach card or cue sheet.

Motion:

- Gentle pulse on the active streak ring.
- Bar charts can animate width on entry.
- Hover states should feel snappy and athletic.

Palette and type:

- Energetic palette with dark graphite, electric lime or coral, and pale training-surface backgrounds.
- Use a sturdy type stack: `Avenir Next`, `Inter`, `Segoe UI`, sans-serif. Larger numerals can use tabular figures.

Must not:

- Feel like a habit tracker clone.
- Use the same CRM/list/detail composition.
- Overdo motivational copy. The data should carry the coach feeling.

### Field Notes Research

Design direction: evidence desk for fieldwork and synthesis. It should feel editorial, investigative, and a little archival.

Layout:

- Replace the sidebar/detail pattern with a dossier workspace.
- Put the working synthesis in a strong document header or pinned research memo.
- Use a masonry-like note board or evidence ledger for field notes.
- Filters can live as compact chips across the top or as an index rail, not a full left panel.

Visual elements:

- Source coverage chart by source type.
- Theme clusters as labeled index tabs or file-folder bands.
- Quotes displayed as clipped evidence excerpts with source stamps.
- Follow-up questions as open research threads.

Motion:

- Minimal. Small highlight animation when filters change.
- Hover can reveal source metadata or tags.

Palette and type:

- Editorial palette: off-white paper, black ink, muted red/blue source stamps, pale highlighter accents.
- Use a serif/sans pairing from system stacks: `Georgia` for document headings, `Inter`/`Segoe UI` for controls.

Must not:

- Look like a spreadsheet.
- Treat all notes as identical cards when quote/source/theme should be visually distinct.
- Use playful gradients or glossy surfaces.

### Memory Garden

Design direction: living knowledge map. This one should be the most organic and visual, with clusters, growth, and resurfacing as the main visual story.

Layout:

- Replace the current topic/detail split with a full visual garden map.
- Use topic clusters as islands, nodes, or planting beds with size tied to memory count.
- Selected topic detail can appear as a grounded lower panel, side drawer, or contextual tray.
- Resurfaced memories should feel like "sprouts" or "blooms" that need attention.

Visual elements:

- SVG or CSS node map connecting related memories.
- Growth indicators as rings, stems, or layered petals.
- Topic colors should materially affect the scene, not just badge accents.
- Links can become visible paths between memory cards.

Motion:

- Gentle floating or breathing animation for active clusters.
- Link paths can draw in when a topic is selected.
- Respect reduced motion and avoid distracting constant movement.

Palette and type:

- Fresh but not beige: deep green/ink base, bright botanical accents, sky or lavender highlights.
- Use a softer rounded type stack: `Nunito`, `Inter`, `Trebuchet MS`, sans-serif. Keep text readable.

Must not:

- Become a generic card grid.
- Let decorative plants overwhelm the actual memory text.
- Use only green tones; the garden needs color variety.

### Community Quest Board

Design direction: guild operations board with game-like quest energy. It should feel more like a mission control tavern board than a generic kanban clone.

Layout:

- Replace the standard columns with a quest map or bounty board.
- Statuses can be represented as lanes, zones, or a compact board with stronger visual hierarchy.
- Selected quest should appear as a quest parchment/detail sheet or mission briefing panel.
- Weekly recap should be prominent as the "guild ledger" or "raid report", not a small side panel.

Visual elements:

- Points shipped as a progress meter or guild XP bar.
- Status distribution as icons or banners.
- Quest cards with rank/points/due badges.
- Recap highlights as ledger entries or announcement strips.

Motion:

- Small banner shimmer or active quest glow on hover.
- Progress meter fill animation on load.
- Keep it useful; avoid fantasy clutter that reduces scan speed.

Palette and type:

- Distinct from the others: dark ink, parchment or warm paper surfaces, saturated banner colors, metallic accent lines.
- Use a readable display tone for headings: `Optima`, `Georgia`, `Palatino`, serif, with system sans for details.

Must not:

- Become a standard four-column kanban with new colors.
- Use tiny low-contrast text on decorative backgrounds.
- Hide blocked/open quests behind recap content.

## Implementation Loop

Work one project at a time and commit each finished design pass separately.

For each project:

1. Read `app/page.tsx`, `app/styles.css`, and the relevant API response shape.
2. Sketch the new information architecture in code comments or a temporary note before editing.
3. Update markup and CSS together.
4. Add the cohort footer.
5. Verify responsive behavior at mobile and desktop widths.
6. Run `npm run build` and `npm run typecheck`.
7. Commit that project before moving to the next one.

Suggested order:

1. Micro CRM
2. Practice Coach
3. Field Notes Research
4. Memory Garden
5. Community Quest Board

## Acceptance Criteria

- A screenshot of any two apps should not look like the same product with renamed labels.
- Every app has at least one custom visual/data element beyond plain metric pills.
- Every app has a distinct layout architecture.
- Every app includes `built by the RaidGuild cohort`.
- No app reintroduces browser write forms.
- Builds and typechecks pass.
