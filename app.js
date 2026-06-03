/* ═══════════════════════════════════════════
   CREATE WITH ALLI — Main App JS
   Crypto prices, Amazon picks, SEO trends,
   nav toggle, newsletter form
═══════════════════════════════════════════ */

// ── NAV TOGGLE ──
const navToggle = document.getElementById('navToggle');
const siteNav   = document.getElementById('siteNav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

// ── DARK MODE TOGGLE (if present) ──
(function () {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  r.setAttribute('data-theme', d);
  if (t) t.addEventListener('click', () => {
    d = d === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', d);
  });
})();

// ── CRYPTO PRICES (CoinGecko) ──
const COINS = [
  { id: 'bitcoin',      ticker: 'BTC',  name: 'Bitcoin'   },
  { id: 'ethereum',     ticker: 'ETH',  name: 'Ethereum'  },
  { id: 'ripple',       ticker: 'XRP',  name: 'XRP'       },
  { id: 'sui',          ticker: 'SUI',  name: 'Sui'       },
  { id: 'chainlink',    ticker: 'LINK', name: 'Chainlink' },
  { id: 'solana',       ticker: 'SOL',  name: 'Solana'    },
  { id: 'cardano',      ticker: 'ADA',  name: 'Cardano'   },
  { id: 'dogecoin',     ticker: 'DOGE', name: 'Dogecoin'  },
  { id: 'bittensor',    ticker: 'TAO',  name: 'Bittensor' },
  { id: 'fetch-ai',     ticker: 'FET',  name: 'Fetch.ai'  },
];
const COIN_IDS = COINS.map(c => c.id).join(',');
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`;

function fmtPrice(n) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1)    return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}

let latestPrices = {};

function renderCryptoGrid(data) {
  latestPrices = {};
  const grid = document.getElementById('cryptoGrid');
  if (!grid) return;

  COINS.forEach(coin => {
    if (data[coin.id]) {
      latestPrices[coin.ticker] = {
        price:  data[coin.id].usd,
        change: data[coin.id].usd_24h_change ?? 0,
      };
    }
  });

  grid.innerHTML = COINS.map(coin => {
    const info   = data[coin.id];
    const price  = info ? info.usd : null;
    const change = info ? info.usd_24h_change : null;
    const up     = change >= 0;
    return `<div class="coin-card">
      <div class="coin-ticker">${coin.ticker}</div>
      <div class="coin-name">${coin.name}</div>
      <div class="coin-price">${price != null ? fmtPrice(price) : '—'}</div>
      ${change != null
        ? `<div class="coin-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}% (24h)</div>`
        : `<div class="coin-change" style="color:var(--muted)">— 24h</div>`}
    </div>`;
  }).join('');
}

async function fetchPrices() {
  try {
    const res  = await fetch(COINGECKO_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderCryptoGrid(data);

    const eb = document.getElementById('errorBanner');
    if (eb) eb.hidden = true;

    const lu = document.getElementById('lastUpdated');
    if (lu) lu.innerHTML = `<span class="dot"></span>Updated ${new Date().toLocaleTimeString()}`;

    if (Object.keys(latestPrices).length) {
      const ci = document.getElementById('cryptoInsight');
      if (ci && ci.classList.contains('loading')) runCryptoAgent();
    }
  } catch (err) {
    const eb = document.getElementById('errorBanner');
    if (eb) { eb.textContent = '⚠️ Could not reach CoinGecko — retrying in 60s.'; eb.hidden = false; }
    const lu = document.getElementById('lastUpdated');
    if (lu) lu.textContent = 'Price update failed';
  }
}

// ── CRYPTO AGENT ──
function runCryptoAgent() {
  const entries = Object.entries(latestPrices);
  if (!entries.length) return;
  const sorted  = [...entries].sort((a, b) => b[1].change - a[1].change);
  const bullish  = entries.filter(([, v]) => v.change >= 0).length;
  const bearish  = entries.length - bullish;
  const top      = sorted[0];
  const bottom   = sorted[sorted.length - 1];
  const bigDown  = sorted.filter(([, v]) => v.change < -3).length;
  const bigUp    = sorted.filter(([, v]) => v.change > 3).length;
  const lines    = [];
  if (bullish >= 7)       lines.push(`🟢 Market broadly GREEN — ${bullish}/${entries.length} coins up in 24h`);
  else if (bearish >= 7)  lines.push(`🔴 Market broadly RED — ${bearish}/${entries.length} coins down in 24h`);
  else                    lines.push(`⚖️ Mixed market — ${bullish} up, ${bearish} down in 24h`);
  if (top)    lines.push(`🚀 Biggest gainer: ${top[0]} +${top[1].change.toFixed(2)}% (${fmtPrice(top[1].price)})`);
  if (bottom && bottom[1].change < 0)
              lines.push(`📉 Biggest drop: ${bottom[0]} ${bottom[1].change.toFixed(2)}% (${fmtPrice(bottom[1].price)})`);
  if (bigUp  > 3) lines.push(`⚡ ${bigUp} coins up 3%+ — strong bullish momentum`);
  if (bigDown > 3) lines.push(`⚠️ ${bigDown} coins down 3%+ — broad selling pressure`);
  setInsight('cryptoInsight', lines.join('\n\n'));
}

// ── AMAZON TREND AGENT ──
// Seasonal keyword map — also powers the SEO trend alert system
const AMAZON_TRENDS = [
  // Jan
  ['🏋️ Fitness & Home Gym', '📚 Self-improvement books', '🍲 Meal prep containers'],
  // Feb
  ['💝 Valentine\'s Day gifts', '💄 Beauty & skincare sets', '🌹 Home fragrance & candles'],
  // Mar
  ['🌱 Spring cleaning supplies', '🌸 Skincare & SPF', '👗 Spring fashion'],
  // Apr
  ['🌿 Garden & outdoor', '🐣 Easter gifts & decor', '☀️ Outdoor entertaining'],
  // May
  ['🎓 Graduation gifts', '👩 Mother\'s Day picks', '🪴 Home & garden'],
  // Jun
  ['🏖️ Summer travel essentials', '👨 Father\'s Day gifts', '☀️ Sun care & cooling'],
  // Jul
  ['🏕️ Outdoor & camping', '💧 Water toys & pools', '🎉 Prime Day deals'],
  // Aug
  ['🎒 Back to school', '💻 Tech for students', '📦 Storage & organisation'],
  // Sep
  ['🍂 Fall home decor', '🧥 Transitional fashion', '☕ Cozy kitchen'],
  // Oct
  ['🎃 Halloween costumes & decor', '🕯️ Cozy home essentials', '🛒 Early holiday shopping'],
  // Nov
  ['🛍️ Black Friday prep', '🎁 Holiday gift guides', '🧸 Toys & games'],
  // Dec
  ['🎄 Last-minute gifts', '🏠 Cozy home gifts', '🥂 New Year party'],
];

function runAmazonAgent() {
  const month = new Date().getMonth();
  setInsight('amazonInsight', AMAZON_TRENDS[month].join('\n\n'));
  updateTrendMeta(month);
  loadSeasonalPicks(month);
}

function updateTrendMeta(month) {
  const el = document.getElementById('trendMeta');
  if (!el) return;
  el.textContent = `Auto-updated · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} trends`;
}

// ── SEASONAL PICKS (placeholder until Amazon PA-API Worker is configured) ──
// These are curated starter picks. Replace href values with your Amazon affiliate links.
// Format: https://www.amazon.com/dp/ASIN?tag=YOUR_ASSOCIATE_TAG
const SEASONAL_PICKS = [
  // Jan
  [
    { title: 'Adjustable Dumbbell Set', desc: 'Space-saving home gym essential — top seller every January.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Meal Prep Containers 20-Pack', desc: 'Glass containers that keep lunches fresh all week.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Atomic Habits (James Clear)', desc: 'The book everyone actually finishes in January.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Feb
  [
    { title: 'Diptyque Candle Set', desc: 'Gift-worthy luxury candles that never miss.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Skincare Gift Set', desc: 'Bestselling bundle trending across beauty categories.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Personalized Jewelry Box', desc: 'Valentine\'s bestseller — ships fast with Prime.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Mar
  [
    { title: 'EltaMD UV Clear SPF 46', desc: 'My personal SPF — perfect transition-to-spring skincare.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'iRobot Roomba i3+', desc: 'Spring cleaning without actually cleaning. You\'re welcome.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Linen Throw Blanket', desc: 'Light layers for March evenings in South Florida.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Apr
  [
    { title: 'Raised Garden Bed Kit', desc: 'Growing your own herbs is surprisingly satisfying.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Outdoor String Lights', desc: 'Patio glow-up — trending every spring and summer.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Cast Iron Skillet Set', desc: 'Easter brunch upgrade that lasts a lifetime.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // May
  [
    { title: 'Silk Pillowcase', desc: 'Mother\'s Day bestseller — hair AND skin benefits.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Personalized Cutting Board', desc: 'Graduates love practical gifts. This one actually gets used.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Air Purifier (LEVOIT Core)', desc: 'Pollen season is real in Florida. This thing works.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Jun
  [
    { title: 'Samsonite Carry-On Spinner', desc: 'Summer travel essential — trending every June.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'YETI Rambler Tumbler', desc: 'Father\'s Day #1 — keeps drinks cold in Florida heat.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Supergoop Unseen Sunscreen', desc: 'Invisible SPF that actually works. No white cast.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Jul
  [
    { title: 'Hydro Flask Water Bottle', desc: 'Summer hydration — trending huge on Prime Day.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Portable Outdoor Fan', desc: 'South Florida survival gear. Non-negotiable.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Inflatable Pool Float', desc: 'Prime Day always spikes these. Stock up early.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Aug
  [
    { title: 'Laptop Backpack for College', desc: 'Back to school #1 — fits 15" MacBook and a week of anxiety.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Sony WH-1000XM5 Headphones', desc: 'The noise-cancelling you need for studying / trading.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Label Maker Machine', desc: 'Dorm room organisation is an entire aesthetic.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Sep
  [
    { title: 'Cozy Throw Blanket Set', desc: 'Fall vibes hit even in Florida. Lean in.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Nespresso Vertuo Coffee Maker', desc: 'September is basically a coffee machine sales event.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Pumpkin Spice Candle (Nest)', desc: 'Overplayed? Sure. Still sells out? Absolutely.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Oct
  [
    { title: 'LED Halloween Projector Lights', desc: 'Halloween decor is a serious niche. Trending hard.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Plush Weighted Blanket', desc: 'Cozy season starts now — this is the one I actually use.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Electric Wax Melt Warmer', desc: 'Cozy home essential — early holiday shoppers are already buying.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Nov
  [
    { title: 'iPad 10th Gen (Black Friday)', desc: 'Electronics haul content performs in November. Feature this.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'KitchenAid Stand Mixer', desc: 'Gift guide staple — always on sale during Black Friday.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'LEGO Adult Set (Architecture)', desc: 'Holiday gift guide sleeper hit for the 25-40 demo.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
  // Dec
  [
    { title: 'Dyson Airwrap (Last-Minute)', desc: 'The gift everyone wants. Ships Prime. Enough said.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Personalized Photo Book', desc: 'Shutterfly-style gifts trend in final Dec push.', href: 'https://www.amazon.com/shop/createwithalli' },
    { title: 'Champagne Flute Set', desc: 'New Year hosting must-have. People always forget these.', href: 'https://www.amazon.com/shop/createwithalli' },
  ],
];

function loadSeasonalPicks(month) {
  const picks = SEASONAL_PICKS[month];
  if (!picks) return;
  const ids = ['1','2','3'];
  ids.forEach((n, i) => {
    const p = picks[i];
    if (!p) return;
    const t = document.getElementById(`pick${n}Title`);
    const d = document.getElementById(`pick${n}Desc`);
    const l = document.getElementById(`pick${n}Link`);
    if (t) t.textContent = p.title;
    if (d) d.textContent = p.desc;
    if (l) l.href = p.href;
  });
}

// ── SEO TREND KEYWORDS (feeds into trend alert panel) ──
// These surface on the Amazon and Web3 pages' trend alert panels
const SEO_KEYWORDS = {
  beauty:  ['hair color tutorial', 'foilayage technique', 'Shades EQ formula', 'tape-in extensions', 'DIA Light hair color', 'IBE weft install', 'salon gloss treatment'],
  web3:    ['Base chain beginner', 'crypto for beginners', 'how to buy crypto', 'Web3 education', 'DeFi explained', 'onchain wallet setup', 'SheFi program'],
  amazon:  ['Amazon storefront creator', 'affiliate picks', 'beauty Amazon finds', 'home renovation Amazon', 'salon professional supplies Amazon'],
  trending: ['hair extension tutorial', 'onchain lifestyle', 'Florida home renovation', 'SPF for dark hair', 'crypto tips 2026'],
};

function renderTrendAlertPanel(containerId, category) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const month = new Date().getMonth();
  const seasonal = AMAZON_TRENDS[month];
  const kws = SEO_KEYWORDS[category] || SEO_KEYWORDS.trending;
  container.innerHTML = `
    <div class="trend-alert-panel">
      <div class="trend-alert-title">
        <span>🎯</span> SEO Trend Alert — ${new Date().toLocaleDateString('en-US', {month:'long',year:'numeric'})}
      </div>
      <div class="trend-keywords">
        ${kws.map((k, i) => `<span class="kw-tag ${i < 2 ? 'trending' : ''}">${k}</span>`).join('')}
      </div>
      <div class="trend-desc">
        <strong>Trending this month:</strong> ${seasonal.join(' · ')}<br>
        <strong>Tip:</strong> Optimise your content titles and product descriptions with these keywords to rank higher on Google and Amazon search.
      </div>
    </div>`;
}

// ── HELPERS ──
function setInsight(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('loading');
  el.style.color = 'var(--text)';
  el.textContent = text;
}

// ── NEWSLETTER ──
function handleSubscribe(e) {
  e.preventDefault();
  const msg = document.getElementById('subscribeMsg');
  const input = e.target.querySelector('input[type="email"]');
  if (msg) {
    msg.textContent = `You're on the list — check your inbox for a welcome email.`;
    msg.style.color = '#1a6c3a';
  }
  if (input) input.value = '';
  // TODO: wire to your email provider (ConvertKit, Mailchimp, etc.)
  // POST to /api/subscribe with { email: input.value }
}

// ── INIT ──
runAmazonAgent();
fetchPrices();
setInterval(fetchPrices, 60_000);
