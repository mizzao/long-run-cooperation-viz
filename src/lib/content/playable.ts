export const playable = {
  kicker: 'Part one',
  title: 'Play it first',
  intro: {
    lead: 'Before the data: sit in the chair yourself. Ten rounds against the same partner. Each round, both of you choose in secret - cooperate or defect.',
    matrixNote: 'Points per round. Mutual cooperation beats mutual defection - but defecting against a cooperator pays most, once.',
    disclaimer: 'This warm-up is for intuition; it is not part of the study data.',
    start: 'play round 1',
    skip: 'skip the game'
  },
  games: [
    { label: 'game 1 of 2', partner: 'a patient partner', hint: 'modeled on the experiment\u2019s resilient cooperators' },
    { label: 'game 2 of 2', partner: 'a calculating partner', hint: 'modeled on the experiment\u2019s most common threshold strategy' }
  ],
  buttons: { coop: 'cooperate', defect: 'defect' },
  outcome: {
    cc: 'you both cooperated: +5 / +5',
    cd: 'you cooperated - they defected: +1 / +7',
    dc: 'you defected - they cooperated: +7 / +1',
    dd: 'you both defected: +3 / +3'
  },
  between: { title: 'game 1 done', next: 'play game 2' },
  reveal: {
    title: 'How you compare',
    devId: 'P1R',
    skipped: 'Skipped - no judgment. For the record: on day 1 of the experiment, the most common first defection was round 9, and 40% of players never struck first at all.',
    neverDefected: 'You never defected first. In the experiment, about 40% of players held that line for a month - the story ahead is about them.',
    defected: (round: number) => `Your first unprovoked defection came in round ${round}. On day 1 of the experiment, the most common first defection was round 9 - and about a third of games saw none at all.`,
    scores: (you: number, bot: number) => `Total points: you ${you}, partners ${bot}.`,
    cta: 'now watch 94 people do this for a month'
  }
} as const;
