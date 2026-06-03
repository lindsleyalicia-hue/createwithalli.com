/**
 * ═══════════════════════════════════════════════════════════════
 * CREATEWITHALLI — Cloudflare Worker: Amazon PA-API + Trend Alert
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT THIS DOES:
 *   1. /picks         — Returns seasonal Amazon product picks (curated + PA-API enriched)
 *   2. /trends        — Returns current SEO keyword trend data
 *   3. /crypto-pulse  — Returns live crypto market summary
 *
 * SETUP (run these in your Cloudflare dashboard or via wrangler):
 *   wrangler secret put AMAZON_ACCESS_KEY
 *   wrangler secret put AMAZON_SECRET_KEY
 *   wrangler secret put AMAZON_ASSOCIATE_TAG    (e.g. createwith0c-20)
 *   wrangler secret put AMAZON_REGION           (default: us-east-1)
 *
 * DEPLOY:
 *   wrangler deploy workers/amazon-worker.js --name createwithalli-picks
 *
 * Then in your index.html, replace the SEASONAL_PICKS loader with:
 *   const res = await fetch('https://createwithalli-picks.YOUR-SUBDOMAIN.workers.dev/picks');
 *   const { picks, trends } = await res.json();
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ── Amazon PA-API v5 Signing (AWS Signature Version 4) ──
// The PA-API requires HMAC-SHA256 request signing.
// We implement it using the SubtleCrypto API available in Workers.

async function hmacSHA256(key, message) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', typeof key === 'string' ? encoder.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(message));
  return new Uint8Array(sig);
}

function toHex(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function sha256Hex(message) {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  return toHex(new Uint8Array(buf));
}

async function getSigningKey(secret, date, region, service) {
  const kDate    = await hmacSHA256('AWS4' + secret, date);
  const kRegion  = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Sign and execute an Amazon PA-API v5 SearchItems or GetItems request.
 * @param {object} env  - Worker env bindings (secrets)
 * @param {object} body - PA-API v5 request body
 * @param {string} operation - 'SearchItems' or 'GetItems'
 */
async function callPaApi(env, body, operation = 'SearchItems') {
  const region    = env.AMAZON_REGION || 'us-east-1';
  const service   = 'ProductAdvertisingAPI';
  const host      = `webservices.amazon.com`;
  const endpoint  = `https://${host}/paapi5/${operation.toLowerCase()}`;
  const path      = `/paapi5/${operation.toLowerCase()}`;

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const payload   = JSON.stringify(body);
  const payloadHash = await sha256Hex(payload);

  // Canonical headers (must be sorted)
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    'POST', path, '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope  = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSigningKey(env.AMAZON_SECRET_KEY, dateStamp, region, service);
  const signature  = toHex(await hmacSHA256(signingKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.AMAZON_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      'host': host,
      'x-amz-date': amzDate,
      'x-amz-target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
      'authorization': authorization,
    },
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PA-API ${response.status}: ${text}`);
  }
  return response.json();
}

// ── Seasonal keyword maps (same as app.js — single source of truth lives here) ──
const MONTHLY_KEYWORDS = [
  // Jan — Feb — Mar — Apr — May — Jun
  ['adjustable dumbbells', 'meal prep containers glass', 'journal planner 2026'],
  ['valentine gifts women', 'luxury candle gift set', 'skincare gift set'],
  ['spring cleaning organizer', 'SPF moisturizer face', 'linen throw blanket'],
  ['raised garden bed kit', 'outdoor string lights patio', 'cast iron skillet'],
  ['graduation gifts women', 'silk pillowcase', 'air purifier home'],
  ['travel carry-on luggage', 'YETI tumbler', 'sunscreen SPF face'],
  // Jul — Aug — Sep — Oct — Nov — Dec
  ['hydro flask water bottle', 'portable outdoor fan', 'pool float'],
  ['college backpack laptop', 'noise cancelling headphones', 'desk organizer'],
  ['cozy throw blanket set', 'nespresso machine', 'fall candle'],
  ['halloween decor outdoor', 'weighted blanket', 'wax melt warmer'],
  ['black friday tech deals', 'kitchen stand mixer', 'holiday gift guide'],
  ['dyson airwrap', 'personalized photo gift', 'champagne flute set'],
];

const SEO_KEYWORDS_BY_CATEGORY = {
  beauty:  ['hair color tutorial', 'foilayage technique', 'Shades EQ formula', 'tape-in extensions', 'DIA Light hair color', 'IBE weft install'],
  web3:    ['Base chain beginner', 'crypto for beginners', 'how to buy crypto', 'Web3 education', 'DeFi explained'],
  amazon:  ['Amazon storefront creator', 'affiliate picks', 'beauty Amazon finds', 'home renovation Amazon'],
  lifestyle: ['south florida home', 'Florida renovation ideas', 'creator desk setup', 'healthy meal prep'],
};

// ── Fallback picks (used if PA-API not configured or returns an error) ──
const FALLBACK_PICKS_BY_MONTH = [
  [{ title:'Adjustable Dumbbell Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Top seller every January — space-saving home gym essential.'},
   { title:'Meal Prep Glass Containers',href:'https://www.amazon.com/shop/createwithalli',desc:'Keeps lunches fresh all week — leakproof and microwave safe.'},
   { title:'Atomic Habits',href:'https://www.amazon.com/shop/createwithalli',desc:'The book everyone actually finishes in January.'}],
  [{ title:'Diptyque Candle Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Gift-worthy luxury candles that never miss.'},
   { title:'Skincare Gift Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Bestselling bundle trending across beauty.'},
   { title:'Personalized Jewelry Box',href:'https://www.amazon.com/shop/createwithalli',desc:"Valentine's bestseller — ships fast with Prime."}],
  [{ title:'EltaMD UV Clear SPF 46',href:'https://www.amazon.com/shop/createwithalli',desc:'My personal SPF — no white cast, no excuses.'},
   { title:'iRobot Roomba i3+',href:'https://www.amazon.com/shop/createwithalli',desc:"Spring cleaning without actually cleaning. You're welcome."},
   { title:'Linen Throw Blanket',href:'https://www.amazon.com/shop/createwithalli',desc:'Light layers for March evenings in South Florida.'}],
  [{ title:'Raised Garden Bed Kit',href:'https://www.amazon.com/shop/createwithalli',desc:'Growing your own herbs is surprisingly satisfying.'},
   { title:'Outdoor String Lights',href:'https://www.amazon.com/shop/createwithalli',desc:'Patio glow-up — trending every spring and summer.'},
   { title:'Cast Iron Skillet Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Easter brunch upgrade that lasts a lifetime.'}],
  [{ title:'Silk Pillowcase',href:'https://www.amazon.com/shop/createwithalli',desc:"Mother's Day bestseller — hair AND skin benefits."},
   { title:'Personalized Cutting Board',href:'https://www.amazon.com/shop/createwithalli',desc:'Graduates love practical gifts. This one actually gets used.'},
   { title:'LEVOIT Air Purifier Core',href:'https://www.amazon.com/shop/createwithalli',desc:'Pollen season is real in Florida. This thing works.'}],
  [{ title:'Samsonite Carry-On Spinner',href:'https://www.amazon.com/shop/createwithalli',desc:'Summer travel essential — trending every June.'},
   { title:'YETI Rambler Tumbler',href:'https://www.amazon.com/shop/createwithalli',desc:"Father's Day #1 — keeps drinks cold in Florida heat."},
   { title:'Supergoop Unseen Sunscreen',href:'https://www.amazon.com/shop/createwithalli',desc:'Invisible SPF that actually works. No white cast.'}],
  [{ title:'Hydro Flask Water Bottle',href:'https://www.amazon.com/shop/createwithalli',desc:'Summer hydration — trending huge on Prime Day.'},
   { title:'Portable Outdoor Fan',href:'https://www.amazon.com/shop/createwithalli',desc:'South Florida survival gear. Non-negotiable.'},
   { title:'Inflatable Pool Float',href:'https://www.amazon.com/shop/createwithalli',desc:'Prime Day always spikes these. Stock up early.'}],
  [{ title:'Laptop Backpack for College',href:'https://www.amazon.com/shop/createwithalli',desc:"Back to school #1 — fits 15\" MacBook and a week of anxiety."},
   { title:'Sony WH-1000XM5 Headphones',href:'https://www.amazon.com/shop/createwithalli',desc:'The noise-cancelling you need for studying / trading.'},
   { title:'Label Maker Machine',href:'https://www.amazon.com/shop/createwithalli',desc:'Dorm room organisation is an entire aesthetic.'}],
  [{ title:'Cozy Throw Blanket Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Fall vibes hit even in Florida. Lean in.'},
   { title:'Nespresso Vertuo',href:'https://www.amazon.com/shop/createwithalli',desc:'September is basically a coffee machine sales event.'},
   { title:'Nest Pumpkin Candle',href:'https://www.amazon.com/shop/createwithalli',desc:'Overplayed? Sure. Still sells out? Absolutely.'}],
  [{ title:'LED Halloween Projector Lights',href:'https://www.amazon.com/shop/createwithalli',desc:'Halloween decor is a serious niche. Trending hard.'},
   { title:'Plush Weighted Blanket',href:'https://www.amazon.com/shop/createwithalli',desc:'Cozy season starts now — this is the one I actually use.'},
   { title:'Electric Wax Melt Warmer',href:'https://www.amazon.com/shop/createwithalli',desc:'Cozy home essential — early holiday shoppers are already buying.'}],
  [{ title:'iPad 10th Gen',href:'https://www.amazon.com/shop/createwithalli',desc:'Electronics haul content performs in November. Feature this.'},
   { title:'KitchenAid Stand Mixer',href:'https://www.amazon.com/shop/createwithalli',desc:'Gift guide staple — always on sale during Black Friday.'},
   { title:'LEGO Architecture Set',href:'https://www.amazon.com/shop/createwithalli',desc:'Holiday gift guide sleeper hit for the 25-40 demo.'}],
  [{ title:'Dyson Airwrap',href:'https://www.amazon.com/shop/createwithalli',desc:'The gift everyone wants. Ships Prime. Enough said.'},
   { title:'Personalized Photo Book',href:'https://www.amazon.com/shop/createwithalli',desc:'Shutterfly-style gifts trend in final Dec push.'},
   { title:'Champagne Flute Set',href:'https://www.amazon.com/shop/createwithalli',desc:'New Year hosting must-have. People always forget these.'}],
];

// ── PA-API: Search for products matching keyword ──
async function searchProducts(env, keyword, count = 1) {
  if (!env.AMAZON_ACCESS_KEY || !env.AMAZON_SECRET_KEY || !env.AMAZON_ASSOCIATE_TAG) {
    return null; // not configured — fall back gracefully
  }
  try {
    const body = {
      Keywords: keyword,
      Resources: [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Images.Primary.Medium',
        'DetailPageURL',
      ],
      PartnerTag:  env.AMAZON_ASSOCIATE_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      ItemCount:   count,
    };
    const data = await callPaApi(env, body, 'SearchItems');
    const items = data?.SearchResult?.Items || [];
    return items.map(item => ({
      title: item.ItemInfo?.Title?.DisplayValue || keyword,
      href:  item.DetailPageURL || `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&tag=${env.AMAZON_ASSOCIATE_TAG}`,
      image: item.Images?.Primary?.Medium?.URL || null,
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || null,
      desc:  null, // enriched in caller
    }));
  } catch (err) {
    console.error('PA-API error for keyword:', keyword, err.message);
    return null;
  }
}

// ── Trend scoring — simple heuristic (can be replaced with Google Trends API) ──
// Keywords are scored by their seasonal relevance (0-100)
function getTrendScore(keyword, month) {
  const monthlyKws = MONTHLY_KEYWORDS[month] || [];
  const lower = keyword.toLowerCase();
  for (let i = 0; i < monthlyKws.length; i++) {
    if (lower.includes(monthlyKws[i].toLowerCase()) || monthlyKws[i].toLowerCase().includes(lower)) {
      return 90 - i * 10; // first match = 90, second = 80, etc.
    }
  }
  return 50; // baseline score
}

// ── Main handler ──
export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const month  = new Date().getMonth();

    // CORS headers — allow your domain
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://createwithalli.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=21600', // cache 6 hours
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── /picks — seasonal Amazon picks (PA-API enriched or fallback) ──
    if (url.pathname === '/picks') {
      const fallback = FALLBACK_PICKS_BY_MONTH[month];
      const keywords = MONTHLY_KEYWORDS[month];
      let picks = fallback;

      // Attempt PA-API enrichment for each keyword
      if (env.AMAZON_ACCESS_KEY) {
        try {
          const enriched = await Promise.all(
            keywords.slice(0, 3).map(async (kw, i) => {
              const results = await searchProducts(env, kw, 1);
              if (results && results[0]) {
                return {
                  ...results[0],
                  desc: fallback[i]?.desc || '',
                };
              }
              return fallback[i];
            })
          );
          picks = enriched;
        } catch (e) {
          // fall through to fallback
        }
      }

      return new Response(JSON.stringify({ picks, month, cached_at: Date.now() }), {
        headers: corsHeaders,
      });
    }

    // ── /trends — SEO keyword trend data ──
    if (url.pathname === '/trends') {
      const category = url.searchParams.get('category') || 'amazon';
      const kws      = SEO_KEYWORDS_BY_CATEGORY[category] || SEO_KEYWORDS_BY_CATEGORY.amazon;
      const seasonal = MONTHLY_KEYWORDS[month];

      const keywords = kws.map(kw => ({
        keyword: kw,
        score:   getTrendScore(kw, month),
        trending: getTrendScore(kw, month) >= 80,
      })).sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({
        category,
        month,
        seasonal_themes: seasonal,
        keywords,
      }), { headers: corsHeaders });
    }

    // ── /crypto-pulse — live market summary via CoinGecko proxy ──
    if (url.pathname === '/crypto-pulse') {
      const COINS = 'bitcoin,ethereum,ripple,sui,chainlink,solana,cardano,dogecoin,bittensor,fetch-ai';
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { 'User-Agent': 'createwithalli/1.0' } }
      );
      if (!cgRes.ok) {
        return new Response(JSON.stringify({ error: 'CoinGecko unavailable' }), {
          status: 503, headers: corsHeaders,
        });
      }
      const data = await cgRes.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=60' },
      });
    }

    return new Response(JSON.stringify({
      routes: ['/picks', '/trends?category=beauty|web3|amazon|lifestyle', '/crypto-pulse'],
      status: 'createwithalli-worker v1.0',
    }), { headers: corsHeaders });
  },
};
