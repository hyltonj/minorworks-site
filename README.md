# Minor Works — minorworks.co

Studio homepage. Next.js (App Router) + TypeScript + Tailwind. No backend —
contact is a `mailto:` link, and the two homepage teasers (Ballpark, Venny)
are self-contained evergreen samples that don't touch the real games' data.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Click through both tabs in "Try a little
something" with mouse, touch, and keyboard (Tab + Enter) before shipping any
changes — that's the part most likely to break silently.

## Structure

- `src/app/page.tsx` — assembles the homepage sections, in order:
  Hero → Philosophy → LiveProjects → Moments → TrySomething → ProjectCards
  (secondary) → Contact → Footer
- `src/components/Hero.tsx`, `Philosophy.tsx` — top-of-page copy
- `src/components/LiveProjects.tsx` — the three equal-prominence cards
  (Ballpark, Venny, Dappled), each with a code-built graphic matching the
  real product's colors/layout (not photos — see caveat below)
- `src/components/Moments.tsx` — 8-tile showcase of small recreated moments
  across all four products
- `src/components/TrySomething.tsx` — tab switcher (user-controlled, no
  autoplay) wrapping the two playable teasers
- `src/components/BallparkTeaser.tsx` — evergreen "tennis balls in Fenway
  Park" estimation slider
- `src/components/VennyTeaser.tsx` — evergreen "Where would Saturn go?"
  3-circle Venn diagram (click/tap/drag + keyboard region buttons)
- `src/components/ProjectCards.tsx` — Rank and File (real card), Dealemma,
  Sylly, Fall Line
- `src/components/Contact.tsx`, `Footer.tsx`

Brand tokens live in `tailwind.config.ts`: Ballpark/Venny tokens pulled from
`~/dev/games-clean/shared/src/theme/brand.ts`; Dappled tokens pulled from its
real build spec (paper `#F8F5EE`, ink `#3A362F`, riso palette).

## Known placeholder / caveat items

- The Ballpark/Venny/Dappled card graphics and the Moments tiles are
  code-built recreations (real colors/copy/layout, observed live), not
  screenshots — a screenshot-capture attempt didn't produce usable files.
  Drop real screenshots into `public/` and swap the `<Image>`/graphic
  components in if you'd rather have photos.
- Dealemma's card uses a typographic stand-in for the box art. Attach the
  real box photo as a file (not a pasted image) and it'll get saved to
  `public/dealemma/box.jpg`.
- Sylly has no card of its own yet — only named in "also in the works",
  since its playability status wasn't confirmed.

## Deploying on Netlify

1. **Push to GitHub** (git is already initialized locally with one commit).
   On your Mac, in this folder:
   ```bash
   cd ~/dev/minorworks-site
   ```
   Create a new empty repo at https://github.com/new (name it
   `minorworks-site`, don't add a README/gitignore — this repo already has
   one). Then:
   ```bash
   git remote add origin https://github.com/<your-username>/minorworks-site.git
   git branch -M main
   git push -u origin main
   ```
2. **Connect Netlify**: at https://app.netlify.com → "Add new site" →
   "Import an existing project" → GitHub → pick `minorworks-site`. Netlify
   auto-detects Next.js and installs its Next.js runtime plugin — no build
   command changes needed. Click Deploy.
3. **Add the domain**: in the Netlify site → Domain settings → Add a domain
   → `minorworks.co`. Netlify shows you the DNS records to use.
4. **Repoint DNS at GoDaddy**: in GoDaddy DNS for minorworks.co, replace
   whatever currently points at Website Builder with Netlify's records
   (typically an A record on `@` pointing at Netlify's load balancer IP, and
   a CNAME on `www` → your Netlify site's `.netlify.app` address — Netlify's
   domain settings page gives you the exact current values).
5. Once DNS propagates (can take a few hours), minorworks.co serves this
   site. You can then cancel/downgrade the GoDaddy Website Builder product.

After this is connected, every `git push` to `main` auto-deploys — so future
edits (mine or yours) just need a commit + push to go live.
