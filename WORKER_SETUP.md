# Cloudflare Worker Setup — createwithalli.com

## What the Worker Does
`workers/amazon-worker.js` is a Cloudflare Worker that handles three routes:

| Route | What it returns |
|---|---|
| `/picks` | Seasonal Amazon product picks (PA-API enriched, fallback if not configured) |
| `/trends?category=beauty` | SEO keyword trend scores for a given category |
| `/crypto-pulse` | Live crypto prices proxied from CoinGecko (bypasses browser CORS limits) |

---

## Step 1 — Amazon PA-API Access
1. You need an **Amazon Associates account** AND separately apply for **PA-API access** at [affiliate-program.amazon.com](https://affiliate-program.amazon.com)
2. PA-API access requires at least 3 qualifying sales on your Associates account first
3. Once approved, go to your Associates portal → Tools → Product Advertising API → Generate Credentials

---

## Step 2 — Add Secrets to Cloudflare
```bash
cd workers/
wrangler secret put AMAZON_ACCESS_KEY
wrangler secret put AMAZON_SECRET_KEY
wrangler secret put AMAZON_ASSOCIATE_TAG   # e.g. createwith0c-20
```

## Step 3 — Deploy the Worker
```bash
cd workers/
wrangler deploy
```
Your worker will be live at:
`https://createwithalli-picks.YOUR-SUBDOMAIN.workers.dev`

## Step 4 — Connect to the Frontend
In `app.js`, update `loadSeasonalPicks()` to fetch from your Worker:

```javascript
async function loadSeasonalPicksFromWorker() {
  try {
    const res = await fetch('https://createwithalli-picks.YOUR-SUBDOMAIN.workers.dev/picks');
    const { picks } = await res.json();
    picks.forEach((p, i) => {
      const n = i + 1;
      document.getElementById(`pick${n}Title`).textContent = p.title;
      document.getElementById(`pick${n}Desc`).textContent  = p.desc;
      document.getElementById(`pick${n}Link`).href         = p.href;
    });
  } catch {
    loadSeasonalPicks(new Date().getMonth()); // fall back to local data
  }
}
```

## Step 5 — Custom Domain (Optional)
In your Cloudflare Workers dashboard, add a custom route:
- Pattern: `createwithalli.com/api/*`
- Worker: `createwithalli-picks`

Then update fetch URLs to `https://createwithalli.com/api/picks`

---

## SEO Trend Alerts — How They Work
The `/trends` endpoint scores your affiliate keywords by seasonal relevance. High-scoring keywords should be used in:
- Your Amazon storefront section titles
- Your TikTok/YouTube video descriptions
- Your Instagram bio link tree labels
- Alt text on product images

The scoring is currently rule-based (month → seasonal keywords). You can upgrade it by wiring in the **Google Trends API** or **DataForSEO API** and replacing `getTrendScore()` in the Worker.

---

## Existing Worker (CoinGecko Ticker)
Your current site fetches directly from CoinGecko in the browser. The `/crypto-pulse` route lets you proxy this through the Worker instead — which:
- Avoids browser rate limits on CoinGecko free tier
- Lets you add your own CoinGecko API key server-side
- Caches responses for 60 seconds at the edge

To use it, change `COINGECKO_URL` in `app.js` to:
```javascript
const COINGECKO_URL = 'https://createwithalli-picks.YOUR-SUBDOMAIN.workers.dev/crypto-pulse';
```
