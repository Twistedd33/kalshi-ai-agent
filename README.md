# Kalshi Sports Edge Alerter

Compares Kalshi game-winner prices with de-vigged sportsbook consensus (The Odds API)
and sends an ntfy push when a Kalshi YES contract is cheaper than fair value after fees.
**Alert-only. It never places orders, and it doesn't need a Kalshi API key.**

## Local (VS Code)  -  requires Node.js 22+
    npm install
    cp .env.example .env      # fill in ODDS_API_KEY and NTFY_TOPIC
    npm test                  # offline logic test
    npm run once              # one live scan

## Deploy (GitHub -> Render)
1. Push this repo to GitHub (private is fine).
2. Render -> New -> Blueprint -> pick the repo (uses render.yaml), or New -> Background Worker.
3. Set ODDS_API_KEY and NTFY_TOPIC in the Render dashboard.
4. In the ntfy app, subscribe to your NTFY_TOPIC.

## Budget note
The Odds API free tier is about 500 credits/month, and each sport refresh costs 1 credit.
3 sports refreshed every 60 min is about 2,160/month, so either use a paid tier or set
ODDS_REFRESH_MINUTES higher or scan fewer SPORTS. Kalshi polling is free.
