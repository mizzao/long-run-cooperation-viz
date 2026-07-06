export const itworks = {
  kicker: 'Part eight',
  title: 'Why a minority is enough',
  captions: [
    { at: 0.16, until: 0.28, text: 'The paper explains the floor with a learning model: rational agents track what opponents play and pick the threshold that pays best - while a fixed minority simply cooperates unless provoked.' },
    { at: 0.3, until: 0.42, text: 'With the minority set to 40%, the model reproduces the experiment: the same strategy mix, the same stability - defection at round 9 becomes the most common rational rule.' },
    { at: 0.52, until: 0.64, text: 'Remove the minority and nothing holds: unravelling runs all the way down until everyone defects from round 1.' },
    { at: 0.72, until: 0.87, text: 'Sweeping the minority share reveals a tipping point near 10%. Below it, collapse; above it, the floor rises fast. The experiment sits far to the right of it.' },
    { at: 0.94, until: 1, text: 'And the floor pays. With the resilient minority present, every group earns more - including the rational majority who exploit them.' }
  ],
  chart: {
    leftTitle: 'the experiment - 94 people',
    rightTitle40: 'the model - 40% resilient',
    rightTitle0: 'the model - 0% resilient',
    yTitle: '% of players, by strategy',
    xLeft: 'days 1-20',
    xRight: 'games 1-400',
    legend: [
      { key: 4, label: 'cooperate always' },
      { key: 3, label: 'defect round 10' },
      { key: 2, label: 'defect round 9' },
      { key: 1, label: 'defect round 8' },
      { key: 0, label: 'earlier / mixed' }
    ],
    phaseX: 'share of resilient cooperators',
    phaseY: 'where unravelling stops (round)',
    critical: 'tipping point ~10%',
    expPoint: 'the experiment',
    welfareTitle: 'average points per round (last stretch of the run)',
    welfareBars: [
      { key: 'a0all', label: 'no minority - everyone', color: '#211E19' },
      { key: 'a40all', label: 'with 40% - everyone', color: '#211E19' },
      { key: 'a40rational', label: 'with 40% - rational majority', color: '#A8642F' },
      { key: 'a40resilient', label: 'with 40% - the resilient', color: '#C79008' }
    ]
  }
} as const;
