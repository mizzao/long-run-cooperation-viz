export const thecoda = {
  kicker: 'Part nine',
  title: 'The takeaway',
  statement: 'Nice people make everyone better off.',
  statementSub: 'The gold minority paid a small price every day to keep it true.',
  captions: [
    { id: 'P9C1', at: 0.06, until: 0.3, text: 'Ninety-four strangers, twenty days, [k]374,251[/] decisions - and the society they improvised captured [k]84%[/] of the best outcome the game allows.' },
    { id: 'P9C2', at: 0.36, until: 0.56, text: 'It held because [g]thirty-six people[/] absorbed a daily loss rather than defect first. Their presence made [c]cooperating[/] the better-paying choice for everyone else.' }
  ],
  caveats: {
    title: 'What this study cannot claim',
    devId: 'P9C3',
    items: [
      'One population, studied once - 94 people who could expect to meet each other again.',
      'One payoff setting; higher temptation or lower rewards may unravel differently.',
      'Participants knew the experiment would last a month.',
      'Recruited from Mechanical Turk (US and Canada) - not a representative sample.'
    ],
    note: 'The authors are explicit about scope: this is the first long-run experiment of its kind, not the last word.'
  },
  credits: {
    title: 'The Resilient 40%',
    based: 'Based on Mao, Dworkin, Suri & Watts - "Resilient cooperators stabilize long-run cooperation in the finitely repeated Prisoner\u2019s Dilemma", Nature Communications 8:13800 (2017)',
    paperUrl: 'https://doi.org/10.1038/ncomms13800',
    paperLabel: 'read the paper',
    dataUrl: 'https://osf.io/64z8u/',
    dataLabel: 'original data (OSF)',
    method: 'All charts are computed from the raw experiment records; the learning model is re-implemented from the paper\u2019s methods.',
  }
} as const;
