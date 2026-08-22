# Bread Baking Log

A lightweight bread-baking experiment log for yeast-raised breads and enriched or sweet doughs.

Track formulas, process changes, bake results, photos, and variations so you can learn what worked and improve the next bake. The app is designed around commercial-yeast baking rather than sourdough workflows.

**Live app:** https://bread-baking-log.netlify.app/

## What it does

Bread Baking Log is a simple, mobile-friendly baking notebook built around repeated experiments rather than one-off recipes.

The basic workflow is:

**New Bake → Formula → Process → Baking → Cooling → Evaluation → Photos**

You can:

- Record multiple flour types and weights
- Track water, salt, yeast type, and yeast weight
- See hydration calculated automatically
- Build, reorder, add, and remove process steps
- Record baking and cooling stages
- Evaluate crumb, structure, rise, crust, flavor, and overall result
- Add notes to individual evaluation criteria
- Upload private bake photos with captions
- Clone an existing bake to test one variable while keeping the original recipe name
- Give each clone an optional experiment / variation name
- Delete unwanted test bakes
- Create individual user accounts with password reset support

## Experiments and variations

The app separates the stable recipe name from the experiment name.

For example:

- **Basic** — 50% Whole Wheat
- **Basic** — Higher Hydration — 72%
- **Basic** — Longer Bulk Proof

Using **Clone This** copies the formula and workflow into a new bake while leaving evaluation, photos, and the experiment name behind. This makes it easy to change one variable and compare the result with previous bakes.

## Privacy

The Netlify site is publicly reachable, but baking data is not public.

Authentication and data access are handled by Supabase. Each signed-in user has their own baking records, and row-level security is used to isolate one user's data from another user's data. Bake photos are stored in a private Supabase Storage bucket.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Row Level Security, and Storage
- Netlify deployment

## Run locally

Requirements:

- Node.js 20.9+
- A Supabase project

Install dependencies:

```bash
npm install
```

Create a local `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

Database migrations used by the project are in `supabase/migrations/`.

## Supabase setup notes

The app expects:

- Email/password authentication
- The database tables and RLS policies represented by the migrations in `supabase/migrations/`
- A private Storage bucket named `bake-photos`
- Storage policies that restrict each authenticated user to their own top-level user-ID folder

For production authentication, set the Supabase **Site URL** and allowed redirect URLs to your deployed application URL so confirmation and password-reset links return to the live app rather than localhost.

## Status

This is a small personal project that grew out of wanting a faster way to record bread experiments while baking. It is usable today and intentionally lightweight.

Might add a sourdough recipe option later. Or you do that?

Feedback, bug reports, and ideas are welcome.

## License

No open-source license has been selected yet. Public GitHub visibility makes the source code viewable, but does not by itself grant permission to reuse or redistribute the code.
