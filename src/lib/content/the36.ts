export const the36 = {
  kicker: 'Part six',
  title: 'The thirty-six',
  captions: [
    { at: 0.03, until: 0.15, text: 'The 94 participants who completed the experiment. Each icon is one person; each made roughly 4,000 cooperate-or-defect decisions.' },
    { at: 0.3, until: 0.44, text: 'Grouped by their dominant strategy in the first six days, most players looked conditionally cooperative - hardly anyone started out as a first-striker.' },
    { at: 0.6, until: 0.7, text: 'Then the drift: by the stable phase, 58 players sat on threshold rules - cooperate until a fixed round, then defect first. Two players even moved the other way.' },
    { at: 0.72, until: 0.86, text: '36 players never moved. In at least 80% of their stable-phase games they cooperated unless provoked - even while being exploited.' },
    { at: 0.88, until: 1, text: 'That is about 40% of the population. In the exit survey, 38 players described refusing to defect first; 33 of them are in this gold group. Next: what the choice cost them.' }
  ],
  chart: {
    groupLabels: { CC: 'cooperate always', T10: 'defect round 10', T9: 'defect round 9', T8: 'defect round 8', earlier: 'earlier / mixed' },
    groupLabelsShort: { CC: 'always', T10: 'r10', T9: 'r9', T8: 'r8', earlier: 'mixed' },
    stat: '36 of 94',
    statSub: 'about 40% of the population',
    survey1: 'Exit survey: 38 players said they',
    survey2: 'refused to defect first -',
    survey3: '33 of them are these same 36.'
  }
} as const;
