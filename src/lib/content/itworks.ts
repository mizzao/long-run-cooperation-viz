export const itworks = {
  kicker: 'Part eight',
  title: 'Why a minority is enough',
  captions: [
    { at: 0.16, until: 0.29, text: 'The paper tests the explanation with a learning model. Rational agents track what opponents play and pick the defection round that pays best. A fixed minority cooperates unless provoked.' },
    { at: 0.3, until: 0.44, text: 'With the minority set to 40%, the model reproduces the experiment: unravelling slows and stops, and defecting at round 9 becomes the most common rational strategy, matching the real data.' },
    { at: 0.52, until: 0.66, text: 'Remove the minority and the same model collapses: defection moves earlier and earlier until every agent defects from round 1.' },
    { at: 0.72, until: 0.88, text: 'Varying the minority share shows a tipping point near 10%. Below it the model collapses. Above it, unravelling stops at later and later rounds. The experiment, at about 40%, sits far past it.' },
    { at: 0.93, until: 1, text: 'The minority also raises earnings. With resilient cooperators present, every group in the model earns more per round - including the rational players who exploit them.' }
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
