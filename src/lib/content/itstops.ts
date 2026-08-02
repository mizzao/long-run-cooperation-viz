export const itstops = {
  kicker: 'Part five',
  title: '...then it stops',
  captions: [
    { id: 'P5C1', at: 0.03, until: 0.17, text: 'A marker at [b]day 7[/]: after this point, the decline in late-round cooperation stops.' },
    { id: 'P5C2', at: 0.18, until: 0.36, text: 'The shaded region covers days 7-20: thirteen more sessions, about 260 more games per player, with no further decline.' },
    { id: 'P5C3', at: 0.38, until: 0.58, text: 'The thick lines are 20-game moving averages. Before day 7, round-10 cooperation fell by [k]3.2[/] percentage points per day. After day 7 it fell by [k]0.4[/].' },
    { id: 'P5C4', at: 0.76, until: 0.895, text: 'The panel below shows, for each day, the round where games had their [d]first defection[/]. During days 1-6 the bars shift left: defection comes earlier. From day 7 on, the shape stops changing - day 20 looks like day 8.' },
    { id: 'P5C5', at: 0.905, until: 1, text: 'The [c]green bar[/] is games with [c]no defection[/] at all. It holds steady at about one in six - every day, some players simply refused to defect first. Before meeting them: the scoreboard.' }
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
