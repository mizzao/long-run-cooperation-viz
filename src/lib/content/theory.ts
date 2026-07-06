export const theory = {
  kicker: 'Part two',
  title: 'The prediction',
  captions: [
    {
      id: 'P2C1',
      at: 0.15,
      until: 0.3,
      text: 'Game theory reasons backward from the end. In the final round there is no future left to protect, so a rational player defects - and both players can see that coming.'
    },
    {
      id: 'P2C2',
      at: 0.36,
      until: 0.58,
      text: 'That certainty poisons round 9: with round 10 already lost, defecting one round earlier is strictly better. Then round 8 falls. Each pass of the same logic drags defection back one more round.'
    },
    {
      id: 'P2C3',
      at: 0.67,
      until: 0.79,
      text: 'Ten steps of reasoning later, nothing is left. The unique equilibrium of the finitely repeated game is to defect from the very first move.'
    },
    {
      id: 'P2C4',
      at: 0.84,
      until: 0.94,
      text: 'Real people are not that ruthless - but experience pushes them the same way. In experiments of 20-30 games, first defections crept steadily earlier. The creep was visible; the endpoint was not.'
    },
    {
      id: 'P2C5',
      at: 0.955,
      until: 1,
      text: 'Watching cooperation unravel to the end would take more games than any lab session can hold. So the researchers built a lab without a closing time.'
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
