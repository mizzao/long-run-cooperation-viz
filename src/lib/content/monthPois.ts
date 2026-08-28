// Marked points on the month grid. Each one is addressed the way the raw data
// is: session (day + slot), wave (which of the session's 20 games), and for a
// single game the pair within that wave. World coordinates are derived from the
// address in viz/monthPoi.ts, so this file never has to track the geometry.
//
// `kind: 'game'` marks one pair - twenty decisions - and opens as a large
// labelled strip, because at the lens's 7x a game is only ~29px wide and its
// rounds cannot be counted. `kind: 'wave'` marks a whole column of ~20 games,
// where the pattern is the texture and the lens already reads it.
//
// Rarity counts are over the 18,490 games with no missing decisions; totals
// quoted in the copy are over all 18,972.

export interface MonthPoi {
  id: string;
  kind: 'game' | 'wave';
  day: number;
  slot: '1pm' | '3pm';
  wave: number; // 1-20
  pair?: number; // 1-based, required for kind 'game'
  rarity: string;
  title: string;
  text: string;
}

export const monthPois: readonly MonthPoi[] = [
  {
    id: 'M1',
    kind: 'game',
    day: 2,
    slot: '3pm',
    wave: 18,
    pair: 8,
    rarity: '1 game in 18,972',
    title: 'The prediction, in full',
    text: 'Both players [d]defected[/] in all ten rounds - the outcome game theory says rational players reach. In [k]374,251[/] decisions it happened exactly [b]once[/]. Every other pair in this wave was still cooperating at round nine.'
  },
  {
    id: 'M2',
    kind: 'game',
    day: 1,
    slot: '3pm',
    wave: 9,
    pair: 18,
    rarity: '3 games in 18,972',
    title: 'Locked out of step',
    text: 'Each of these two is answering the round before. Neither is trying to exploit the other, and neither ever manages to [c]cooperate[/] with them - ten rounds, perfectly out of phase. All three cases happened on the first evening and never again.'
  },
  {
    id: 'M3',
    kind: 'game',
    day: 20,
    slot: '1pm',
    wave: 3,
    pair: 4,
    rarity: '7 games in the month',
    title: 'Still cooperating on day 20',
    text: 'Nineteen days in, with everything already learned. One player [d]defected[/] in every round. The other [c]cooperated[/] in every round anyway, and lost points for it ten times over.'
  },
  {
    id: 'M4',
    kind: 'game',
    day: 18,
    slot: '3pm',
    wave: 15,
    pair: 24,
    rarity: '112 games - 1 on day 1, 11 on day 20',
    title: 'Burned at round four',
    text: 'From round four on, the lower player was [d]defected[/] on every single round, and [c]cooperated[/] every single round anyway. There are more people doing this at the [b]end[/] of the month than at the start.'
  },
  {
    id: 'M5',
    kind: 'game',
    day: 1,
    slot: '1pm',
    wave: 7,
    pair: 10,
    rarity: '642 games in the month',
    title: 'One round of trust',
    text: 'Cooperate once, get [d]defected[/] on, never offer again. The commonest shape on the grid, and what backward induction looks like when a real person does it in a single round instead of by reasoning.'
  },
  {
    id: 'M6',
    kind: 'wave',
    day: 14,
    slot: '1pm',
    wave: 14,
    rarity: 'the steepest fall of any wave',
    title: 'Green until round eight',
    text: 'Twenty-one games played at the same moment. Round 1: [k]98%[/] cooperation. Round 10: [k]8%[/] - the sharpest collapse across a single wave in the month. Look at the right-hand edge.'
  },
  {
    id: 'M7',
    kind: 'wave',
    day: 20,
    slot: '3pm',
    wave: 19,
    rarity: 'day 20, second-to-last wave',
    title: 'The last games anyone played',
    text: 'Round 1 is still [k]98%[/] cooperative - after a month of being burned, nobody opened by [d]defecting[/]. Round 10 is [k]10%[/].'
  },
  {
    id: 'M8',
    kind: 'wave',
    day: 5,
    slot: '3pm',
    wave: 1,
    rarity: 'the most cooperative wave of 800',
    title: 'A good afternoon',
    text: 'Eight of these twenty-four games are flawless on both sides for all ten rounds. [k]92%[/] cooperation overall - the month is not only a story about decay.'
  }
];
