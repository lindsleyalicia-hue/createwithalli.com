#!/bin/bash
# ═══════════════════════════════════════════════════════
# createwithalli.com — Codespace setup script
# Runs once after container build via postCreateCommand
# ═══════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  createwithalli.com — Dev Setup      ║"
echo "║  Installing Cloudflare tooling...    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Wrangler (Cloudflare Workers CLI) ──
echo "▶ Installing Wrangler..."
npm install -g wrangler@latest
echo "  ✓ Wrangler $(wrangler --version)"

# ── 2. Miniflare (local Cloudflare Workers simulator — no internet needed) ──
echo "▶ Installing Miniflare..."
npm install -g miniflare@latest
echo "  ✓ Miniflare installed"

# ── 3. Live Server (static HTML preview) ──
echo "▶ Installing Live Server..."
npm install -g live-server
echo "  ✓ Live Server installed"

# ── 4. HTMLHint (HTML linter — catches broken tags before deploy) ──
echo "▶ Installing HTMLHint..."
npm install -g htmlhint
echo "  ✓ HTMLHint installed"

# ── 5. Workers project deps (if any package.json exists in workers/) ──
if [ -f "workers/package.json" ]; then
  echo "▶ Installing workers/package.json deps..."
  cd workers && npm install && cd ..
  echo "  ✓ Worker deps installed"
fi

# ── 6. Print available commands ──
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✓ All tools installed. Ready to deploy.                 ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  AUTHENTICATE CLOUDFLARE (run once):                     ║"
echo "║    wrangler login                                        ║"
echo "║                                                          ║"
echo "║  PREVIEW SITE (opens browser on port 5500):              ║"
echo "║    live-server --port=5500 --open=index.html             ║"
echo "║                                                          ║"
echo "║  RUN WORKER LOCALLY (port 8787):                         ║"
echo "║    cd workers && wrangler dev amazon-worker.js           ║"
echo "║                                                          ║"
echo "║  DEPLOY WORKERS TO CLOUDFLARE:                           ║"
echo "║    cd workers                                            ║"
echo "║    wrangler deploy amazon-worker.js                      ║"
echo "║       --name createwithalli-picks                        ║"
echo "║    wrangler deploy amazon-trends-worker.js               ║"
echo "║       --name createwithalli-trends                       ║"
echo "║                                                          ║"
echo "║  ADD SECRETS (one-time per worker):                      ║"
echo "║    wrangler secret put AMAZON_ASSOCIATE_TAG              ║"
echo "║       --name createwithalli-picks                        ║"
echo "║    # type: alicialindsle-20 when prompted                ║"
echo "║                                                          ║"
echo "║  LINT HTML:                                              ║"
echo "║    htmlhint '**/*.html' --ignore 'node_modules/**'       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
