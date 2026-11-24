import 'dotenv/config';

// Kalshi series ticker -> The Odds API sport key.
// Kalshi tickers can change; verify via GET /trade-api/v2/series?category=Sports
export const SPORTS = {
  NFL:   ['KXNFLGAME',    'americanfootball_nfl'],
  NCAAF: ['KXNCAAFGAME',  'americanfootball_ncaaf'],
  NBA:   ['KXNBAGAME',    'basketball_nba'],
  NCAAB: ['KXNCAAMBGAME', 'basketball_ncaab'],
  NHL:   ['KXNHLGAME',    'icehockey_nhl'],
  MLB:   ['KXMLBGAME',    'baseball_mlb'],
};

const num = (name, def) => Number(process.env[name] ?? def);

export const config = {
  kalshiBase: process.env.KALSHI_BASE || 'https://api.elections.kalshi.com/trade-api/v2',
  oddsApiKey: process.env.ODDS_API_KEY || '',
  ntfyServer: (process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, ''),
  ntfyTopic: process.env.NTFY_TOPIC || '',
  sports: (process.env.SPORTS || 'NFL,NBA,NHL').split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
  minEdge: num('MIN_EDGE_PCT', 4) / 100,
  minPrice: num('MIN_PRICE', 5) / 100,
  maxPrice: num('MAX_PRICE', 95) / 100,
  minBooks: num('MIN_BOOKS', 3),
  kalshiPollMs: num('KALSHI_POLL_SECONDS', 120) * 1000,
  oddsRefreshMs: num('ODDS_REFRESH_MINUTES', 60) * 60 * 1000,
  realertStep: num('REALERT_STEP_PCT', 2) / 100,
  runOnce: process.env.RUN_ONCE === '1' || process.argv.includes('--once'),
};
