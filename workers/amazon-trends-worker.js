/**
 * ═══════════════════════════════════════════════════════════════
 * CREATEWITHALLI — Amazon Homepage Trend Finder Worker
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT THIS DOES:
 *   Fetches Amazon's homepage, best sellers, movers & shakers,
 *   and new releases — extracts trending product categories and
 *   keywords — returns structured trend data for your site and
 *   content planning.
 *
 * ROUTES:
 *   GET /trends              — Full trend report (all sources)
 *   GET /trends/bestsellers  — Best sellers by category
 *   GET /trends/movers       — Movers & shakers (fastest rising)
 *   GET /trends/new          — New releases trending now
 *   GET /trends/keywords     — SEO keyword list extracted from trends
 *
 * DEPLOY:
 *   cd workers/
 *   wrangler deploy amazon-trends-worker.js --name createwithalli-trends
 *
 * SCHEDULE (auto-run every 6 hours):
 *   Add to wrangler.toml:
 *     [triggers]
 *     crons = ["0 */6 * * *"]
 *
 * SECRETS (optional — improves rate limits):
 *   wrangler secret put BRIGHTDATA_TOKEN   (proxy service for Amazon)
 *   wrangler secret put CACHE_KV_ID        (KV namespace for caching)
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ── Amazon URLs to monitor ──
const AMAZON_SOURCES = {
  homepage:    'https://www.amazon.com/',
  bestsellers: 'https://www.amazon.com/gp/bestsellers/',
  movers:      'https://www.amazon.com/gp/movers-and-shakers/',
  newreleases: 'https://www.amazon.com/gp/new-releases/',
  deals:       'https://www.amazon.com/deals',
};

// Top categories to monitor — matches your niche verticals
const CATEGORIES = [
  { name: 'Beauty',           url: 'https://www.amazon.com/gp/bestsellers/beauty/' },
  { name: 'Hair Care',        url: 'https://www.amazon.com/gp/bestsellers/beauty/11062591/' },
  { name: 'Skin Care',        url: 'https://www.amazon.com/gp/bestsellers/beauty/11060451/' },
  { name: 'Home',             url: 'https://www.amazon.com/gp/bestsellers/home-garden/' },
  { name: 'Electronics',      url: 'https://www.amazon.com/gp/bestsellers/electronics/' },
  { name: 'Health',           url: 'https://www.amazon.com/gp/bestsellers/hpc/' },
  { name: 'Kitchen',          url: 'https://www.amazon.com/gp/bestsellers/kitchen/' },
  { name: 'Tools & Home Imp', url: 'https://www.amazon.com/gp/bestsellers/hi/' },
];

// ── Headers that reduce bot detection ──
// Amazon blocks headless requests — we mimic a real browser
function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };
}

// ── Fetch a page with retry logic ──
async function fetchPage(url, env, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: getHeaders(),
        // If you have BrightData or Oxylabs proxy:
        // cf: { resolveOverride: env.PROXY_HOST }
      });
      if (res.ok) {
        const text = await res.text();
        return text;
      }
      if (res.status === 503 || res.status === 429) {
        // Rate limited — wait and retry
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

// ── Extract product titles from Amazon HTML ──
// Amazon renders product names in multiple patterns — we catch all of them
function extractProductTitles(html) {
  const titles = new Set();

  // Best seller / grid item titles
  const patterns = [
    // Span with class containing title or product
    /<span[^>]*class="[^"]*(?:p13n-sc-truncated|zg-item-title|a-size-small a-link-normal)[^"]*"[^>]*>([^<]{10,120})<\/span>/gi,
    // Link text in product cards
    /<a[^>]*class="[^"]*(?:a-link-normal s-underline-text|zg_title)[^"]*"[^>]*>\s*([^<]{10,120})\s*<\/a>/gi,
    // aria-label on product links
    /aria-label="([^"]{15,120})"/gi,
    // Product title divs
    /<div[^>]*class="[^"]*product-title[^"]*"[^>]*>\s*([^<]{10,120})\s*<\/div>/gi,
    // h2 inside product cards
    /<h2[^>]*>\s*<a[^>]*>\s*<span[^>]*>([^<]{10,120})<\/span>/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const title = match[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ');
      if (title.length >= 10 && title.length <= 120) {
        titles.add(title);
      }
    }
  }

  return [...titles].slice(0, 50);
}

// ── Extract category names from nav/links ──
function extractCategories(html) {
  const cats = new Set();
  const pattern = /href="\/gp\/bestsellers\/([^/"]+)\/?(?:[^"]*)"[^>]*>\s*([^<]{3,40})\s*</gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const name = match[2].trim().replace(/\s+/g, ' ');
    if (name.length > 2 && name.length < 40 && !name.includes('http')) {
      cats.add(name);
    }
  }
  return [...cats].slice(0, 20);
}

// ── Extract deal/promotion labels ──
function extractDealKeywords(html) {
  const keywords = new Set();

  // Deal labels
  const labelPattern = /<span[^>]*class="[^"]*(?:a-badge-label|dealBadge|s-coupon-highlight-color)[^"]*"[^>]*>\s*([^<]{3,60})\s*</gi;
  let match;
  while ((match = labelPattern.exec(html)) !== null) {
    keywords.add(match[1].trim());
  }

  // Percentage off labels
  const pctPattern = /(\d+)%\s*off/gi;
  while ((match = pctPattern.exec(html)) !== null) {
    const pct = parseInt(match[1]);
    if (pct >= 20) keywords.add(`${pct}% off deals`);
  }

  return [...keywords].slice(0, 15);
}

// ── Distill keywords from product titles ──
// Pulls high-signal words useful for SEO / content strategy
function distillKeywords(titles) {
  // Words that are too generic to be useful
  const stopWords = new Set([
    'the','and','for','with','in','of','to','a','an','is','are','set',
    'pack','count','piece','inch','oz','ml','fl','lb','kg','size','color',
    'new','best','top','amazon','prime','free','shipping','seller','choice',
    'buy','get','our','your','their','this','that','these','those',
  ]);

  const wordFreq = {};
  const bigrams  = {};

  for (const title of titles) {
    const words = title.toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Single words
    words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

    // Bigrams (2-word phrases — more useful for SEO)
    for (let i = 0; i < words.length - 1; i++) {
      const bg = `${words[i]} ${words[i+1]}`;
      bigrams[bg] = (bigrams[bg] || 0) + 1;
    }
  }

  const topWords = Object.entries(wordFreq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  const topBigrams = Object.entries(bigrams)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([bg]) => bg);

  return { topWords, topBigrams };
}

// ── Score trends by your niche relevance ──
function scoreByNiche(titles) {
  const niches = {
    beauty:    ['hair', 'skincare', 'serum', 'moisturizer', 'spf', 'shampoo', 'conditioner', 'mascara', 'foundation', 'lip', 'nail', 'curl', 'gloss', 'toner', 'retinol'],
    salon:     ['redken', 'olaplex', 'wella', 'matrix', 'foil', 'bleach', 'color', 'toner', 'balayage', 'extensions', 'weft', 'tape'],
    home:      ['organizer', 'storage', 'candle', 'diffuser', 'cleaning', 'kitchen', 'bathroom', 'bedding', 'couch', 'rug', 'lamp', 'shelf'],
    tech:      ['bluetooth', 'wireless', 'usb', 'cable', 'monitor', 'keyboard', 'mouse', 'stand', 'charger', 'laptop', 'tablet', 'earbuds'],
    wellness:  ['supplement', 'vitamin', 'protein', 'collagen', 'probiotic', 'magnesium', 'sleep', 'hydration', 'electrolyte', 'sunscreen'],
    lifestyle: ['travel', 'bag', 'wallet', 'journal', 'planner', 'water bottle', 'tumbler', 'backpack', 'gift'],
  };

  const scores = {};
  for (const [niche, keywords] of Object.entries(niches)) {
    scores[niche] = 0;
    for (const title of titles) {
      const lower = title.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) scores[niche]++;
      }
    }
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([niche, score]) => ({ niche, score, hot: score >= 5 }));
}

// ── Build content ideas from trending products ──
function generateContentIdeas(titles, niches) {
  const ideas = [];
  const hotNiches = niches.filter(n => n.hot).map(n => n.niche);
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  if (hotNiches.includes('beauty')) {
    const beautyTitles = titles.filter(t => /hair|skin|serum|spf|moisturizer/i.test(t)).slice(0, 3);
    if (beautyTitles.length) {
      ideas.push({
        platform: 'TikTok / Reels',
        format: 'Get Ready With Me',
        hook: `"Amazon beauty haul — what's actually trending in ${month}"`,
        products: beautyTitles,
      });
    }
  }

  if (hotNiches.includes('home')) {
    const homeTitles = titles.filter(t => /organiz|storage|candle|clean/i.test(t)).slice(0, 3);
    if (homeTitles.length) {
      ideas.push({
        platform: 'TikTok / Instagram',
        format: 'Amazon Home Finds',
        hook: `"${month} home picks that are actually worth it"`,
        products: homeTitles,
      });
    }
  }

  if (hotNiches.includes('tech')) {
    const techTitles = titles.filter(t => /wireless|bluetooth|charger|stand/i.test(t)).slice(0, 3);
    if (techTitles.length) {
      ideas.push({
        platform: 'TikTok / YouTube Shorts',
        format: 'Creator Tech Picks',
        hook: '"Desk setup upgrade — everything linked in my Amazon storefront"',
        products: techTitles,
      });
    }
  }

  // Always suggest a storefront update
  ideas.push({
    platform: 'All',
    format: 'Storefront Update',
    hook: `"Updated my Amazon storefront for ${month} — trending picks live now"`,
    products: titles.slice(0, 5),
  });

  return ideas;
}

// ── CORS headers ──
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// ── Main fetch handler ──
export default {
  // Runs on HTTP request
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    try {
      const data = await runTrendScan(env);

      if (url.pathname === '/trends/keywords') {
        return new Response(JSON.stringify({
          keywords:  data.seoKeywords,
          bigrams:   data.seoBigrams,
          hot_niches: data.nicheScores.filter(n => n.hot),
          updated_at: data.updated_at,
        }), { headers: { ...CORS, 'Cache-Control': 'public, max-age=21600' } });
      }

      if (url.pathname === '/trends/bestsellers') {
        return new Response(JSON.stringify({
          bestsellers: data.bestsellers,
          updated_at:  data.updated_at,
        }), { headers: { ...CORS, 'Cache-Control': 'public, max-age=21600' } });
      }

      if (url.pathname === '/trends/content-ideas') {
        return new Response(JSON.stringify({
          ideas:      data.contentIdeas,
          updated_at: data.updated_at,
        }), { headers: { ...CORS, 'Cache-Control': 'public, max-age=21600' } });
      }

      // Default: full report
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Cache-Control': 'public, max-age=21600' },
      });

    } catch (err) {
      return new Response(JSON.stringify({
        error:   err.message,
        tip:     'Amazon may have blocked the request. Consider adding a BrightData proxy — see WORKER_SETUP.md',
        fallback: getFallbackTrends(),
      }), { status: 503, headers: CORS });
    }
  },

  // Runs on cron schedule (every 6 hours)
  async scheduled(event, env, ctx) {
    try {
      const data = await runTrendScan(env);
      // If you have KV storage, cache it:
      // await env.TREND_CACHE.put('latest', JSON.stringify(data), { expirationTtl: 21600 });
      console.log(`[${new Date().toISOString()}] Trend scan complete — ${data.allTitles.length} products found`);
    } catch (err) {
      console.error('Scheduled trend scan failed:', err.message);
    }
  },
};

// ── Core trend scanning logic ──
async function runTrendScan(env) {
  const results = {
    allTitles:    [],
    bestsellers:  {},
    categories:   [],
    dealKeywords: [],
    seoKeywords:  [],
    seoBigrams:   [],
    nicheScores:  [],
    contentIdeas: [],
    updated_at:   new Date().toISOString(),
    sources_checked: [],
  };

  // 1. Scan homepage
  try {
    const html = await fetchPage(AMAZON_SOURCES.homepage, env);
    const titles = extractProductTitles(html);
    results.allTitles.push(...titles);
    results.dealKeywords = extractDealKeywords(html);
    results.sources_checked.push('homepage');
  } catch (e) {
    console.warn('Homepage scan failed:', e.message);
  }

  // 2. Scan best sellers (top 3 categories relevant to your niches)
  const priorityCategories = CATEGORIES.slice(0, 4); // beauty, hair, skin, home
  for (const cat of priorityCategories) {
    try {
      const html   = await fetchPage(cat.url, env);
      const titles = extractProductTitles(html);
      results.bestsellers[cat.name] = titles.slice(0, 10);
      results.allTitles.push(...titles);
      results.sources_checked.push(`bestsellers/${cat.name}`);
      // Small delay between requests — be polite
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.warn(`Category scan failed for ${cat.name}:`, e.message);
    }
  }

  // 3. Movers & shakers — fastest rising products
  try {
    const html   = await fetchPage(AMAZON_SOURCES.movers, env);
    const titles = extractProductTitles(html);
    results.allTitles.push(...titles);
    results.sources_checked.push('movers-and-shakers');
  } catch (e) {
    console.warn('Movers scan failed:', e.message);
  }

  // 4. Deduplicate all titles
  results.allTitles = [...new Set(results.allTitles)];

  // 5. Extract SEO keywords from everything found
  const { topWords, topBigrams } = distillKeywords(results.allTitles);
  results.seoKeywords = topWords;
  results.seoBigrams  = topBigrams;

  // 6. Score by your niches
  results.nicheScores = scoreByNiche(results.allTitles);

  // 7. Generate content ideas
  results.contentIdeas = generateContentIdeas(results.allTitles, results.nicheScores);

  return results;
}

// ── Fallback if Amazon blocks all requests ──
// Returns the seasonal data from the main worker as a safety net
function getFallbackTrends() {
  const month = new Date().getMonth();
  const seasonal = [
    ['adjustable dumbbells', 'meal prep containers', 'self-help books'],
    ['valentine gifts', 'luxury candles', 'skincare sets'],
    ['spring cleaning', 'SPF moisturizer', 'linen throws'],
    ['garden beds', 'patio lights', 'cast iron cookware'],
    ['graduation gifts', 'silk pillowcase', 'air purifier'],
    ['travel luggage', 'YETI tumbler', 'sunscreen'],
    ['hydro flask', 'outdoor fan', 'Prime Day deals'],
    ['college backpack', 'noise cancelling headphones', 'desk organizer'],
    ['cozy throw blanket', 'nespresso machine', 'fall candles'],
    ['halloween decor', 'weighted blanket', 'wax warmer'],
    ['black friday tech', 'stand mixer', 'holiday gift guide'],
    ['dyson airwrap', 'photo gifts', 'champagne flutes'],
  ];
  return {
    source: 'fallback_seasonal',
    keywords: seasonal[month],
    note: 'Amazon rate-limited this request. Using seasonal fallback data.',
  };
}
