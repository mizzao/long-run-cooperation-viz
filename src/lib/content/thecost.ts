export const thecost = {
  kicker: 'Part eight',
  title: 'The cost of holding the line',
  statement: {
    id: 'P8S',
    at: 0.54,
    until: 0.72,
    title: 'It actually costs something to always cooperate first.',
    sub: 'The stable-phase gap: [k]0.08[/] points per round, paid every single day.'
  },
  captions: [
    { id: 'P8C1', at: 0.05, until: 0.22, text: 'On day 1 the two groups earned nearly the same, about 4.7 points per round. Refusing to defect first cost nothing on the first day.' },
    { id: 'P8C2', at: 0.28, until: 0.48, text: 'From day 2 the lines separate: [g]resilient cooperators[/] earned less than threshold players on every remaining day.' },
    { id: 'P8C3', at: 0.76, until: 0.905, text: 'Not everyone could keep it up. Some players who began as cooperators switched to [d]defecting first[/] after repeated exploitation - the card above paraphrases one player\u2019s exit-survey account.' },
    { id: 'P8C4', at: 0.915, until: 1, text: '[g]Thirty-six players[/] held the line for the whole month and paid for it, every day. One section left: what their stubbornness bought everyone else.' }
  ],
  chart: {
    yTitle: 'average points earned per round',
    yNote: 'scale starts at 4.4, not zero',
    xTitle: 'Days 1-20 - daily averages per group',
    resilientLabel: 'resilient cooperators (36)',
    thresholdLabel: 'threshold players (58)',
    gapLabel: 'stable-phase gap: 0.08 points per round',
    quote: 'I started off trying to cooperate as much as possible... it became evident I was only being cheated over and over. So I began defecting first on the last round, then the ninth, then the eighth.',
    quoteAttrib: 'an initially cooperative participant - exit survey (paraphrased)'
  }
} as const;
