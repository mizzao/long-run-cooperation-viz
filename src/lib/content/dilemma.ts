export const dilemma = {
  kicker: 'Part one',
  title: 'The trap',
  captions: [
    { id: 'P1C1', at: 0.03, until: 0.13, text: 'Two strangers, one deal. Each of you must choose in secret - [c]cooperate[/] or [d]defect[/] - and the choices are revealed together.' },
    { id: 'P1C2', at: 0.12, until: 0.23, text: 'If you both [c]cooperate[/], you both do well: [k]5[/] points each.' },
    { id: 'P1C3', at: 0.26, until: 0.37, text: 'But if you [d]defect[/] while they cooperate, you do even better - [k]7[/] - and they are left with [k]1[/]. That is the temptation.' },
    { id: 'P1C4', at: 0.4, until: 0.51, text: 'When you both give in to it: [k]3[/] each. Worse for both of you than the [k]5[/] and [k]5[/] you walked past.' },
    { id: 'P1C5', at: 0.555, until: 0.71, text: 'Four possible outcomes, one table. Read your own row: whatever they choose, [d]defecting[/] pays you more. They can read their row too.' },
    { id: 'P1C6', at: 0.73, until: 0.895, text: 'That trap is the [b]Prisoner’s Dilemma[/], and it runs the real world: two rivals cut prices to win each other’s customers, and both end up poorer. Arms races and doping work the same way.' },
    { id: 'P1C7', at: 0.915, until: 1, text: 'Played once between strangers, betrayal usually wins. This essay is about what happens when the same people meet [b]again and again[/]. First: sit in the chair yourself.' }
  ],
  stage: {
    them: 'a stranger',
    you: 'you',
    reveal: 'choices made in secret, revealed together'
  },
  matrix: {
    colThem: ['they cooperate', 'they defect'],
    rowYou: ['you cooperate', 'you defect'],
    dominance: ['7 > 5', '3 > 1'],
    dominanceNote: 'your defect row pays more in both columns'
  },
  shops: {
    a: 'their shop',
    b: 'your shop',
    prices: ['$9', '$7', '$5'],
    profit: 'monthly profit'
  }
} as const;
