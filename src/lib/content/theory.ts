export const theory = {
  kicker: 'Part two',
  title: 'The prediction',
  captions: [
    {
      id: 'P2C1',
      at: 0.15,
      until: 0.31,
      text: 'Game theory reasons backward from the last round. Nothing comes after round 10, so a rational player defects in it - and both players know that in advance. The top row shows the result: round 10 turns [d]red[/].'
    },
    {
      id: 'P2C2',
      at: 0.36,
      until: 0.6,
      text: 'Each row repeats the logic one step further. If round 10 is certain defection, cooperating in round 9 gains nothing, so round 9 falls too. Then round 8. Every row of reasoning moves the first defection one round earlier.'
    },
    {
      id: 'P2C3',
      at: 0.66,
      until: 0.8,
      text: 'By the bottom row nothing is left. The theory\u2019s prediction for fully experienced players: [d]defect from round 1[/]. The stepped line marks how far the collapse has reached at each level of reasoning.'
    },
    {
      id: 'P2C4',
      at: 0.84,
      until: 0.95,
      text: 'Real people are not this ruthless, but experience pushes them the same direction. In earlier experiments of 20-30 games, [d]first defections[/] came earlier game by game. Those experiments were too short to show where the slide would stop.'
    },
    {
      id: 'P2C5',
      at: 0.955,
      until: 1,
      text: 'Following that slide to its end would take hundreds of games, far more than one lab session can hold. The researchers\u2019 answer: run the experiment online and bring the same people back [b]every weekday for a month[/].'
    }
  ],
  grid: {
    xTitle: 'round',
    yTitle: 'steps of reasoning'
  },
  quote: {
    lead: 'Researchers who saw the creep in the lab extrapolated it to zero - with a caveat:',
    text: '…it is not plausible to observe cooperation rates decline to negligible levels…',
    tail: 'in any session short enough to run in a laboratory.',
    source: 'Embrey, Fréchette & Yuksel, quoted in Mao et al. (2017)'
  }
} as const;
