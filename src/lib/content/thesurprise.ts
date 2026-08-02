export const thesurprise = {
  kicker: 'Part six',
  title: 'The scoreboard',
  numberSub: 'of the way from the predicted collapse to the best collective outcome',
  why: 'Why?',
  captions: [
    { id: 'P6C1', at: 0.05, until: 0.19, text: 'Score the month as one society. Had all 94 defected every round - the theory’s prediction - the group would average [d]3.00[/] points per round. Perfect cooperation would pay [c]5.00[/].' },
    { id: 'P6C2', at: 0.27, until: 0.47, text: 'The real number, across all [k]374,251[/] decisions: [k]4.68[/] points per round - [k]84%[/] of the way from the predicted collapse to the best the game allows.' },
    { id: 'P6C3', at: 0.57, until: 0.8, text: 'The slide stopped nowhere near the bottom. Theory misses by this much - so something in this population is holding the line. The next sections find out [b]who[/], and [b]what it cost them[/].' }
  ],
  chart: {
    floorValue: '3.00',
    floorLabel: 'everyone defects, always',
    floorNote: 'the theory’s prediction',
    ceilValue: '5.00',
    ceilLabel: 'everyone cooperates, always',
    ceilNote: 'the best the game allows',
    markerLabel: 'this population',
    unit: 'average points per round, days 1-20'
  }
} as const;
