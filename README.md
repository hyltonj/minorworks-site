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

- `src/app/page.tsx` — assembles the homepage sections
- `src/components/Hero.tsx`, `About.tsx` — top-of-page copy
- `src/components/DappledWindow.tsx` — ambient placeholder feature window,
  links to `/dappled`. Swap in real Dappled preview media/link once it
  exists.
- `src/components/TrySomething.tsx` — tab switcher (user-controlled, no
  autoplay) wrapping the two teasers
- `src/components/BallparkTeaser.tsx` — evergreen "tennis balls in Fenway
  Park" estimation slider
- `src/components/VennyTeaser.tsx` — evergreen "Where would Saturn go?"
  3-circle Venn diagram (click/tap/drag + keyboard region buttons)
- `src/components/ProjectCards.tsx` — Ballpark / Venny / Rank and File cards
  + "in development" list (Dealemma, Sylly, Fall Line)
- `src/components/Contact.tsx`, `Footer.tsx`

Brand tokens (colors, fonts, radii) live in `tailwind.config.ts` and were
pulled directly from `~/dev/games-clean/shared/src/theme/brand.ts` (the
`BRAND` object used by Ballpark/Venny) so this site matches the real games
rather than inventing a new look.

## Deploying (mirrors the playvenny.app setup)

1. Push this repo to GitHub.
2. In Vercel: New Project → import the repo. Framework preset: Next.js
   (auto-detected). No special build command needed — defaults work.
3. Add the `minorworks.co` domain in Vercel project settings.
4. In GoDaddy DNS for minorworks.co, replace whatever currently points at
   Website Builder with the records Vercel shows you (typically an A record
   on `@` and a CNAME on `www` → `cname.vercel-dns.com`).
5. Once DNS propagates, minorworks.co serves this site instead of the
   GoDaddy template. You can then cancel/downgrade the GoDaddy Website
   Builder product if you don't need it for anything else.

## Known placeholder decisions (flagging so you can override)

- Dappled has no real build yet, so its homepage window is a purely
  atmospheric CSS animation (no real screenshot/preview) linking to an
  internal `/dappled` "coming soon" page. Swap this out once Dappled has
  something real to show.
- Sylly has no card of its own yet — it's only named in the "in
  development" list, since its playability status wasn't confirmed.
- Rank and File links to playballpark.app generally (its real entry point
  inside Ballpark's screens) rather than a dedicated URL, since it doesn't
  have one.
