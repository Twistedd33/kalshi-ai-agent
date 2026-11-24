// Sportsbook consensus from The Odds API, de-vigged into fair win probabilities.
import { config } from './config.js';

export async function fetchGames(sportKey) {
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
  url.search = new URLSearchParams({ apiKey: config.oddsApiKey, regions: 'us', markets: 'h2h', oddsFormat: 'decimal' });
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const remaining = res.headers.get('x-requests-remaining');
  if (remaining) console.log(`  odds api credits remaining: ${remaining}`);
  return res.json();
}

const median = a => {
  const s = [...a].sort((x, y) => x - y), mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Returns { probs: {team: fairProb}, books: n }. Median of per-book de-vigged probabilities.
export function fairProbs(game) {
  const perTeam = {};
  let books = 0;
  for (const book of game.bookmakers ?? []) {
    for (const mkt of book.markets ?? []) {
      if (mkt.key !== 'h2h') continue;
      const outs = mkt.outcomes ?? [];
      if (outs.length < 2 || outs.some(o => !(o.price > 1))) continue;
      const total = outs.reduce((s, o) => s + 1 / o.price, 0); // > 1 because of the vig
      for (const o of outs) (perTeam[o.name] ??= []).push(1 / o.price / total);
      books++;
    }
  }
  const probs = Object.fromEntries(Object.entries(perTeam).map(([t, ps]) => [t, median(ps)]));
  return { probs, books };
}
