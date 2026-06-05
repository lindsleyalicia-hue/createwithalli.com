# createwithalli.com — Codespace Dev Container

Opens deploy-ready. No manual setup.

## What's pre-installed

| Tool | Purpose |
|---|---|
| Node 22 LTS | Runtime |
| Wrangler (latest) | Cloudflare Workers CLI — deploy, dev, secrets |
| Miniflare | Local Workers simulator — test without internet |
| Live Server | Static HTML preview on port 5500 |
| HTMLHint | HTML linter |
| GitHub CLI | Already authenticated in Codespace |

## First time in this Codespace

**Authenticate Cloudflare (once):**
```bash
wrangler login
```

**Or use a Cloudflare API Token instead** (recommended for Codespaces):
1. Go to dash.cloudflare.com → My Profile → API Tokens
2. Create token with `Workers Scripts:Edit` permission
3. Add to your Codespace secrets:
   - `CLOUDFLARE_API_TOKEN` = your token
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID (from CF dashboard URL)

These auto-inject into the container via `devcontainer.json remoteEnv`.

## Common commands

```bash
# Preview the site
live-server --port=5500 --open=index.html

# Run a Worker locally (port 8787)
cd workers
wrangler dev amazon-worker.js

# Deploy Workers
wrangler deploy amazon-worker.js --name createwithalli-picks
wrangler deploy amazon-trends-worker.js --name createwithalli-trends

# Add affiliate tag secret
wrangler secret put AMAZON_ASSOCIATE_TAG --name createwithalli-picks
# enter: alicialindsle-20

# Lint all HTML
htmlhint '**/*.html' --ignore 'node_modules/**'
```

## Ports

| Port | What |
|---|---|
| `5500` | Live Server — static HTML preview (opens automatically) |
| `8787` | Wrangler dev — local Worker testing |
