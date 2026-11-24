// Match Kalshi game markets to sportsbook games and compute edge.
import { config } from './config.js';
import { fairProbs } from './odds.js';

// Kalshi taker fee per contract: ceil(0.07 * P * (1-P)) to the cent. Check Kalshi's fee schedule.
export const kalshiFee = p => Math.ceil(0.07 * p * (1 - p) * 100 - 1e-9) / 100;

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

// Kalshi uses short names ('Kansas City', 'LA Rams'); books use full ('Kansas City Chiefs').
export function teamMatches(kalshiName, bookName) {
  const k = norm(kalshiName), b = norm(bookName);
  if (!k || !b) return false;
  if (k.includes(b) || b.includes(k)) return true;
  const kt = k.split(/\s+/), bt = b.split(/\s+/);
  return kt.length > 1 && kt.at(-1) === bt.at(-1);
}

const teamFor = m => m.yes_sub_title || m.subtitle || '';

export function findEdges(markets, games) {
  const byEvent = Map.groupBy(markets, m => m.event_ticker);
  const edges = [];
  for (const eventMarkets of byEvent.values()) {
    const teams = eventMarkets.map(teamFor).filter(Boolean);
    const game = games.find(g =>
      teams.every(t => [g.home_team, g.away_team].some(n => teamMatches(t, n))));
    if (!game) continue;

    const { probs, books } = fairProbs(game);
    if (books < config.minBooks) continue;

    for (const m of eventMarkets) {
      const team = teamFor(m), ask = m._yesAsk;
      if (!team || ask == null || ask < config.minPrice || ask > config.maxPrice) continue;
      const entry = Object.entries(probs).find(([name]) => teamMatches(team, name));
      if (!entry) continue;
      const fair = entry[1], fee = kalshiFee(ask), edge = fair - ask - fee;
      if (edge >= config.minEdge) {
        edges.push({ market: m, team, ask, fair, fee, edge, books,
          game: `${game.away_team} @ ${game.home_team}`, start: game.commence_time });
      }
    }
  }
  return edges;
}
