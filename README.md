This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Vercel + scraper worker (your PC)

The site on Vercel calls your **FastAPI worker** over HTTPS. On your machine, expose the worker with a **Cloudflare quick tunnel** (no Cloudflare account required for the quick URL):

1. From the project that contains `api/` (parent folder), start the worker:  
   `python -m uvicorn api.main:app --host 127.0.0.1 --port 8000`
2. In **this** `web` repo, run:  
   `powershell -ExecutionPolicy Bypass -File .\scripts\start-cloudflare-tunnel.ps1`
3. Copy the printed `https://….trycloudflare.com` URL.
4. In **Vercel** → Project → Settings → Environment Variables set:
   - `SCRAPER_API_URL` = that URL (no trailing slash)
   - `SCRAPER_API_SECRET` = same secret as on the worker (see `.env.local.example`)
5. Redeploy the Vercel project (or save env and trigger a new deployment).

**Note:** Quick tunnel URLs change each time you restart `cloudflared`. For a stable hostname, use a [named Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) in the Cloudflare dashboard.

## Getting Started

First, run the development server:

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
