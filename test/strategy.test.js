import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findEdges, kalshiFee, teamMatches } from '../src/strategy.js';
import { price } from '../src/kalshi.js';

const book = (home, away) => ({ markets: [{ key: 'h2h', outcomes: [
  { name: 'Buffalo Bills', price: home }, { name: 'Kansas City Chiefs', price: away }] }] });

test('team name matching', () => {
  assert.ok(teamMatches('Buffalo', 'Buffalo Bills'));
  assert.ok(teamMatches('LA Rams', 'Los Angeles Rams'));
  assert.ok(!teamMatches('New York G', 'New York Jets'));
});

test('fee', () => assert.equal(kalshiFee(0.5), 0.02));

test('finds edge on underpriced side only', () => {
  const games = [{ id: 'g1', home_team: 'Buffalo Bills', away_team: 'Kansas City Chiefs',
    bookmakers: [book(1.67, 2.25), book(1.65, 2.30), book(1.69, 2.20)] }];
  const markets = [
    { ticker: 'KXNFLGAME-X-BUF', event_ticker: 'KXNFLGAME-X', yes_sub_title: 'Buffalo', yes_ask_dollars: '0.5000' },
    { ticker: 'KXNFLGAME-X-KC', event_ticker: 'KXNFLGAME-X', yes_sub_title: 'Kansas City', yes_ask: 46 },
  ];
  for (const m of markets) m._yesAsk = price(m, 'yes_ask');
  const edges = findEdges(markets, games);
  assert.equal(edges.length, 1);
  assert.equal(edges[0].team, 'Buffalo');
  assert.ok(Math.abs(edges[0].edge - 0.054) < 0.002);
});
