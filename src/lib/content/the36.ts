export const the36 = {
  kicker: 'Part six',
  title: 'The thirty-six',
  captions: [
    { at: 0.03, until: 0.17, text: 'The 94 participants who completed the experiment. Each icon is one person. On average, each made [k]3,720[/] cooperate-or-defect decisions over the month.' },
    { at: 0.3, until: 0.45, text: 'Here the players are sorted by their most common strategy in days 1-6. Most [c]cooperated unless provoked[/]. Almost no one [d]defected early[/] in a game.' },
    { at: 0.6, until: 0.715, text: 'By the stable phase, 58 players had moved to threshold rules: cooperate until a fixed round, then defect first. Two players moved the other way, toward more cooperation.' },
    { at: 0.72, until: 0.875, text: '[g]36 players[/] never moved. In at least 80% of their stable-phase games they cooperated unless provoked - even while being exploited.' },
    { at: 0.89, until: 1, text: 'That is about [g]40%[/] of the population. In the exit survey, 38 players described refusing to defect first; [g]33 of them[/] are in this gold group. Next: what the choice cost them.' }
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
