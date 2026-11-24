// Kalshi sports edge alerter. Alert-only; it never places orders.
import { config, SPORTS } from './config.js';
import { getOpenMarkets, marketUrl } from './kalshi.js';
import { fetchGames } from './odds.js';
import { findEdges } from './strategy.js';
import { send } from './notify.js';

const oddsCache = new Map(); // sportKey -> { at, games }
const alerted = new Map();   // ticker -> best edge already alerted
const pct = x => (x * 100).toFixed(1);

async function getGames(sportKey) {
  const c = oddsCache.get(sportKey);
  if (c && Date.now() - c.at < config.oddsRefreshMs) return c.games;
  const games = await fetchGames(sportKey);
  oddsCache.set(sportKey, { at: Date.now(), games });
  return games;
}

async function scan() {
  for (const sport of config.sports) {
    if (!SPORTS[sport]) { console.log(`Unknown sport ${sport}, skipping`); continue; }
    const [series, oddsKey] = SPORTS[sport];
    try {
      const markets = await getOpenMarkets(series);
      if (!markets.length) { console.log(`${sport}: no open Kalshi markets`); continue; }
      const games = await getGames(oddsKey);
      const edges = findEdges(markets, games);
      console.log(`${sport}: ${markets.length} markets, ${games.length} games, ${edges.length} edges`);
      for (const e of edges) {
        const t = e.market.ticker, prev = alerted.get(t);
        if (prev !== undefined && e.edge < prev + config.realertStep) continue;
        alerted.set(t, e.edge);
        const msg = [
          e.game,
          `BUY YES ${e.team} @ ${(e.ask * 100).toFixed(0)}¢`,
          `Fair ${pct(e.fair)}% (${e.books} books) | fee ${(e.fee * 100).toFixed(0)}¢`,
          `Edge +${pct(e.edge)} pts | ${t}`,
        ].join('\n');
        console.log(msg.replaceAll('\n', ' | '));
        await send(`${sport} edge +${pct(e.edge)}%`, msg, {
          url: marketUrl(e.market),
          priority: e.edge >= 2 * config.minEdge ? 'high' : 'default',
        });
      }
    } catch (err) {
      console.error(err);
      await send(`${sport} scan error`, String(err.message).slice(0, 300), { priority: 'low', tags: 'warning' });
    }
  }
}

async function main() {
  if (!config.oddsApiKey) { console.error('ODDS_API_KEY is not set'); process.exit(1); }
  await send('Kalshi agent started',
    `Sports: ${config.sports.join(', ')} | min edge ${(config.minEdge * 100).toFixed(0)} pts`, { tags: 'robot' });
  while (true) {
    await scan();
    if (config.runOnce) break;
    await new Promise(r => setTimeout(r, config.kalshiPollMs));
  }
}

main();
