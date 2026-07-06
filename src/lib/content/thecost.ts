export const thecost = {
  kicker: 'Part seven',
  title: 'The cost of holding the line',
  captions: [
    { at: 0.05, until: 0.2, text: 'On day 1 the two groups earned nearly the same - about 4.7 points per round. Refusing to defect first cost nothing, yet.' },
    { at: 0.28, until: 0.46, text: 'From day 2 the lines separate: resilient cooperators earned less than threshold players on every remaining day.' },
    { at: 0.54, until: 0.7, text: 'Across the stable phase the gap averaged 0.08 points per round - a steady tax for never striking first.' },
    { at: 0.76, until: 0.9, text: 'The pressure was real. Not everyone who started out cooperatively could sustain it against repeated exploitation.' },
    { at: 0.92, until: 1, text: 'Thirty-six did, for a month, at a measurable cost. Part eight: why that minority stabilizes everyone.' }
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
