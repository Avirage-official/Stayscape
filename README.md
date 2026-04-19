This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses system fonts (`system-ui` for sans-serif and `Georgia` for serif) defined in `tailwind.config.ts`.

## Environment Variables

See `.env.example` for all required and optional environment variables. Copy it to `.env.local` and fill in your values — `.env.local` is gitignored and must **never** be committed.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (backend only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ✅ | Mapbox public token |
| `GEOAPIFY_API_KEY` | ✅ | Geoapify key (backend only) |
| `OPENAI_API_KEY` | ⬜ | OpenAI key for AI enrichment (backend only) |
| `ADMIN_SYNC_KEY` | ⬜ | Admin key for automated sync triggers |
| `APP_URL` | ⬜ | Public app URL used by scheduled sync workflow |
| `UPSTASH_REDIS_REST_URL` | ⬜ | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ⬜ | Upstash Redis token for rate limiting |

## Rate Limiting (Optional)

API routes are protected by rate limiting via [@upstash/ratelimit](https://github.com/upstash/ratelimit-js). To enable it:

1. Create a free Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token into your `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=your-upstash-redis-rest-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token
   ```

If these variables are not set, rate limiting is silently skipped and all requests are allowed through — so the app works in development without Redis.

- **Public routes** (`/api/places`, `/api/discovery/*`): 30 requests per 10 seconds per IP
- **Admin routes** (`/api/admin/*`): 5 requests per 60 seconds per IP

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
