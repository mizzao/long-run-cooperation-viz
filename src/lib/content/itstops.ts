export const itstops = {
  kicker: 'Part five',
  title: '...then it stops',
  captions: [
    { at: 0.03, until: 0.16, text: 'A marker at day 7: after this point, the decline in late-round cooperation stops.' },
    { at: 0.18, until: 0.34, text: 'The shaded region covers days 7-20: thirteen more sessions, about 260 more games per player, with no further decline.' },
    { at: 0.38, until: 0.56, text: 'The thick lines are 20-game moving averages. Before day 7, round-10 cooperation fell 3.2 percentage points per day. After day 7: 0.4.' },
    { at: 0.76, until: 0.88, text: 'The panel below uses the same 20-day axis. For each day it shows when games saw their first defection. The bars shift left during days 1-6, then stop changing: day 8 matches day 7, and day 20 matches day 8.' },
    { at: 0.9, until: 1, text: 'A steady share of games - about one in six - ends with no defection at all (green). Some players were consistently refusing to defect first. Part six: who they are.' }
  ],
  chart: {
    day7: 'day 7',
    band: 'the stable phase - days 7-20',
    histTitle: 'round of first defection, share of games per day',
    histSameAxis: 'same 20 days as the chart above',
    legend: [
      { key: 'early', label: 'by round 7' },
      { key: 'r8', label: 'round 8' },
      { key: 'r9', label: 'round 9' },
      { key: 'r10', label: 'round 10' },
      { key: 'none', label: 'never (no defection)' }
    ],
    slopeBeforeTitle: 'days 1-7',
    slopeAfterTitle: 'days 7-20',
    slopeUnit: 'points per day'
  }
} as const;
