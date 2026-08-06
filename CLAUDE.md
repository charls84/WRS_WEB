@AGENTS.md

# Weather Recovery Solutions (WRS) site context

## Project summary
- Marketing site for Weather Recovery Solutions (roofing services in Deerfield Beach / Broward County).
- Built with Next.js App Router (`next@16`), React 19, TypeScript, Tailwind v4.
- Main implementation is currently a single-page experience composed in `src/app/page.tsx` and section components in `src/components/PageSections.tsx`.
- **Deployed site:** https://weather-recovery-solutions.vercel.app/

## Canonical design sources
- Main Figma design:
  - https://www.figma.com/design/YqsrliBvDTtVXbh3Wx4FbX/Weather-Recovery-Solutions?node-id=551-11792&m=dev
- Figma style guide:
  - https://www.figma.com/design/YqsrliBvDTtVXbh3Wx4FbX/Weather-Recovery-Solutions?node-id=298-2354&t=4jzfEVA1CKZwm1sc-1

When implementing UI, prioritize Figma typography, spacing, and color tokens over defaults.

## Important files
- `src/app/page.tsx`: page composition and section ordering.
- `src/components/PageSections.tsx`: reusable sections/components (form, cards, reviews, FAQ, etc.).
- `src/app/globals.css`: design tokens and typography utility classes.
- `src/app/layout.tsx`: global font loading + metadata.
- `public/`: icon and image assets used by the landing page.
- `.github/workflows/deploy.yml`: production deployment workflow (push to `master` triggers Vercel deploy).

## Playwright MCP workflow (design QA)
Use Playwright MCP to compare rendered output with Figma during implementation/refinement.

### Add MCP server (once per project/session scope)
- HTTP transport (known-good from local history):
  - `claude mcp add --transport http playwright https://playwright.dev/mcp`

Alternative stdio setup if preferred:
- `claude mcp add playwright -- npx -y @playwright/mcp@latest`

### Practical usage guidance
- Run the site locally (`npm run dev`) before visual comparison.
- Capture mobile + desktop screenshots for sections you changed.
- Compare against Figma nodes from the links above.
- Keep visual artifacts in project-local files (for example `.playwright-mcp/` or explicit screenshot files) and clean up temporary outputs before final commit unless intentionally preserving them.

## Git commit/push workflow (Odin GitHub helpers)
Use the existing Odin helper scripts rather than manually managing long-lived GitHub tokens.

### Helper script locations
- `~/.config/odin/git_helper.sh`
- `~/.config/odin/github_auth.py`
- Additional reference: `~/.openclaw/agents/odin/agent/GITHUB.md`

### Standard flow for this repo
1. Stage and commit normally:
   - `git add .`
   - `git commit -m "<message>\n\nCo-Authored-By: Oz <oz-agent@warp.dev>"`
2. Source helper functions:
   - `source ~/.config/odin/git_helper.sh`
3. Push with fresh auth:
   - `odin_git_push origin master`

If remote setup is needed:
- `odin_git_add_remote Pocket-Mimir/Weather-Recovery-Solutions`

## Validation before push
- `npm run lint`
- `npm run build`
- Re-check changed sections visually against Figma (especially typography and spacing).

## Recommended additions for future iterations
- Add a small "Do not regress" checklist for critical hero/form typography styles.
- Add explicit viewport targets used for QA (e.g., mobile widths and desktop baseline).
- Keep metadata in `src/app/layout.tsx` aligned with production brand/site title instead of starter defaults.
