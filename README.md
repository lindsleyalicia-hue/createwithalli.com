# AlliOPSEC.xyz

Personal brand portfolio for **Alicia Ann** — Hair colorist · Web3 educator · Amazon influencer · AI agent builder · Content creator.

## Stack
- Plain HTML / CSS / Vanilla JS — no framework, no build step
- Deployed on **Cloudflare Pages**
- Live crypto prices via **CoinGecko API**
- Amazon trend scanning via **Cloudflare Workers**
- Amazon PA-API product picks via **Workers** (PA-API credentials in Cloudflare secrets)

## Pages
| Page | Description |
|---|---|
| `/` | Homepage — hero, live crypto ticker, Amazon picks, AI insights |
| `/pages/web3.html` | Web3 education — Base chain, ALLITRADE, SheFi, portfolio |
| `/pages/content.html` | Content creation — TikTok, YouTube, Instagram, brand collabs |
| `/pages/beauty.html` | Palm Beach Hair Co — services, booking, Alicia Ann Hair |
| `/pages/amazon.html` | Amazon storefront — 4 niche categories + PA-API trend picks |
| `/pages/home-life.html` | South Florida lifestyle, renovation, health |

## Workers
| Worker | Description |
|---|---|
| `workers/amazon-worker.js` | PA-API product picker — seasonal picks + affiliate links |
| `workers/amazon-trends-worker.js` | Amazon homepage trend scanner — runs every 6 hours via cron |

## Socials
- Instagram: [@aliciareviewsit](https://www.instagram.com/aliciareviewsit) · [@westpalmhairpro](https://www.instagram.com/westpalmhairpro) · [@alliopsec](https://www.instagram.com/alliopsec)
- TikTok: [@fadesandhairshades](https://www.tiktok.com/@fadesandhairshades) · [@alliopsdev](https://www.tiktok.com/@alliopsdev)
- YouTube: [@createwithalli](https://www.youtube.com/@createwithalli)
- Amazon: [createwithalli storefront](https://www.amazon.com/shop/createwithalli) · [doodlechronicles (Wynston)](https://www.amazon.com/shop/doodlechronicles)

## Wynston
Chief Mood Officer at AlliOps. [@official_winniethepooch](https://www.instagram.com/official_winniethepooch)

## Deploy to Cloudflare Pages
1. Connect this repo in your Cloudflare Pages dashboard
2. Build command: *(none — static site)*
3. Output directory: `/`
4. Add Worker secrets for PA-API via `wrangler secret put`

## Credentials
SheFi S16 Graduate · Claude Code 101 Certified · Harvard CS50 Enrolled · CS50 Cybersecurity Next
