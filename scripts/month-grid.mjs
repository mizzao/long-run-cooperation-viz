// Builds static/data/month_grid.json - every decision of the experiment, grouped
// as 40 sessions (20 days x 1pm/3pm) of 20 waves of pairs, for the zoom-out scene.
// Input is the raw per-decision export (actions.csv, not in the repo); the same
// records are archived at https://osf.io/64z8u/.
// Pair reconstruction mirrors export.py: the CSV's `game` column already encodes
// the greedy wave decomposition, pairs keep first-appearance order, and
// unrecorded cells stay missing ('x') - opp_action is never used to backfill.
// The A/B row order inside a pair came from the Meteor doc's users array, which
// the CSV does not carry; for day-1 1pm we align each pair's halves to the
// shipped session_tangle.json (the ground truth the SVG renders), then require
// cell-for-cell equality so the SVG->canvas seam cannot drift. For the other 39
// sessions the two rows of a pair are anonymous either way.
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.env.ACTIONS_CSV ?? new URL('../code/actions.csv', import.meta.url);
const tanglePath = new URL('../static/data/session_tangle.json', import.meta.url);
const out = new URL('../static/data/month_grid.json', import.meta.url);

const lines = readFileSync(src, 'utf8').split('\n');
const header = lines[0].trim().split(',');
const col = Object.fromEntries(header.map((h, i) => [h, i]));
for (const need of ['session', 'day', 'game', 'round', 'gameId', 'player', 'action']) {
  if (!(need in col)) throw new Error(`missing column ${need}`);
}

// (day, session) -> wave[20] -> Map(gameId -> { players: [a, b?], cells: 20 chars })
const sessions = new Map();
let rows = 0;
for (let li = 1; li < lines.length; li++) {
  const line = lines[li].trim();
  if (!line) continue;
  const f = line.split(',');
  rows++;
  const slot = f[col.session];
  const day = Number(f[col.day]);
  const game = Number(f[col.game]);
  const round = Number(f[col.round]);
  const gameId = f[col.gameId];
  const player = f[col.player];
  const action = f[col.action] === '1' ? 'c' : 'd';
  if (slot !== '1pm' && slot !== '3pm') throw new Error(`bad session ${slot} @${li}`);
  if (day < 1 || day > 20 || game < 1 || game > 20 || round < 1 || round > 10) {
    throw new Error(`out-of-range day/game/round @${li}`);
  }
  const key = `${day}|${slot}`;
  if (!sessions.has(key)) sessions.set(key, Array.from({ length: 20 }, () => new Map()));
  const wave = sessions.get(key)[game - 1];
  if (!wave.has(gameId)) wave.set(gameId, { players: [], cells: Array(20).fill('x') });
  const pr = wave.get(gameId);
  let side = pr.players.indexOf(player);
  if (side === -1) {
    if (pr.players.length === 2) throw new Error(`third player in game ${gameId}`);
    side = pr.players.push(player) - 1;
  }
  pr.cells[side * 10 + (round - 1)] = action;
}

const sessionList = [];
for (let day = 1; day <= 20; day++) {
  for (const slot of ['1pm', '3pm']) {
    const waves = sessions.get(`${day}|${slot}`);
    if (!waves) throw new Error(`missing session ${day} ${slot}`);
    sessionList.push({ day, slot, waves: waves.map((w) => [...w.values()].map((p) => p.cells.join(''))) });
  }
}

// ---- checks (in the spirit of export.py's chk lines)
const chk = (label, ok) => {
  console.log(`${ok ? 'ok ' : 'FAIL'} ${label}`);
  if (!ok) process.exitCode = 1;
};
chk(`374,251 rows read (${rows})`, rows === 374251);
let decisions = 0;
let pairMin = Infinity;
let pairMax = 0;
for (const s of sessionList) {
  for (const w of s.waves) {
    pairMin = Math.min(pairMin, w.length);
    pairMax = Math.max(pairMax, w.length);
    for (const p of w) {
      if (p.length !== 20 || /[^cdx]/.test(p)) throw new Error('bad pair string');
      decisions += p.replace(/x/g, '').length;
    }
  }
}
chk(`decisions kept (${decisions})`, decisions === 374251);
chk(`40 sessions x 20 waves`, sessionList.length === 40 && sessionList.every((s) => s.waves.length === 20));
chk(`pairs per wave 19-28 (${pairMin}-${pairMax})`, pairMin >= 19 && pairMax <= 28);

// ---- seam: align day-1 1pm A/B halves to session_tangle.json, then require equality
const tangle = JSON.parse(readFileSync(tanglePath, 'utf8'));
const mine = sessionList[0];
const cell = (v) => (v === null ? 'x' : v === 1 ? 'c' : 'd');
const swap = (s) => s.slice(10) + s.slice(0, 10);
let seamOk = tangle.games.length === 20;
for (let wi = 0; wi < 20 && seamOk; wi++) {
  const tw = tangle.games[wi].pairs;
  const mw = mine.waves[wi];
  seamOk = tw.length === mw.length;
  for (let pi = 0; pi < tw.length && seamOk; pi++) {
    const want = [...tw[pi].ca, ...tw[pi].cb].map(cell).join('');
    if (mw[pi] !== want && swap(mw[pi]) === want) mw[pi] = want;
    seamOk = mw[pi] === want;
  }
}
chk('day-1 1pm matches session_tangle.json cell-for-cell', seamOk);

if (process.exitCode) throw new Error('validation failed - not writing output');
writeFileSync(out, JSON.stringify({ version: 1, sessions: sessionList, decisions }));
console.log('wrote', out.pathname, `${decisions} decisions, ${sessionList.length} sessions`);
