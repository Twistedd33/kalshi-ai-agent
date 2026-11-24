// Read-only Kalshi client. Market data is public, so no API key is needed for alerts.
import { config } from './config.js';

// Price as 0-1. Handles new `*_dollars` strings and legacy integer cents.
export function price(m, field) {
  const d = m[`${field}_dollars`];
  if (d !== undefined && d !== null && d !== '') return Number(d);
  const c = m[field];
  return c === undefined || c === null ? null : Number(c) / 100;
}

export async function getOpenMarkets(seriesTicker) {
  const markets = [];
  let cursor = '';
  do {
    const url = new URL(`${config.kalshiBase}/markets`);
    url.search = new URLSearchParams({ series_ticker: seriesTicker, status: 'open', limit: '1000', ...(cursor && { cursor }) });
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Kalshi ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    for (const m of data.markets ?? []) {
      m._yesAsk = price(m, 'yes_ask');
      markets.push(m);
    }
    cursor = data.cursor;
  } while (cursor);
  return markets;
}

export const marketUrl = m => `https://kalshi.com/markets/${(m.event_ticker || m.ticker).toLowerCase()}`;
