export const experiment = {
  kicker: 'Part three',
  title: 'The experiment',
  captions: [
    {
      id: 'P3C1',
      at: 0.12,
      until: 0.24,
      text: 'On 4 August 2015, 113 people logged in from across the United States - 31 states, ages 18 to 61, 47% women - recruited in advance from Amazon Mechanical Turk. The 94 who stayed the course became the study population.'
    },
    {
      id: 'P3C2',
      at: 0.26,
      until: 0.38,
      text: 'Every weekday for a month the same people returned - twenty days in all, one session at 13:00 and one at 15:00 EDT, about 35 minutes each.'
    },
    {
      id: 'P3C3',
      at: 0.42,
      until: 0.54,
      text: 'Attrition is what kills long-run experiments, so showing up was worth real money. It worked: 94 of 113 players - 83% - completed the month.'
    },
    {
      id: 'P3C4',
      at: 0.6,
      until: 0.72,
      text: 'This is one real game from the first afternoon: two strangers, ten rounds. Every cell is one decision - green to cooperate, red to defect. Twenty-six pairs played at once, and the session’s first game was done.'
    },
    {
      id: 'P3C5',
      at: 0.78,
      until: 0.9,
      text: 'Then everyone reshuffled: a new anonymous partner for every game, twenty games a session. No names, no reputations, no way to build a relationship - only choices.'
    },
    {
      id: 'P3C6',
      at: 0.92,
      until: 1,
      text: 'The dark line threads one player’s afternoon through the shuffle. Multiply by two sessions and twenty days: 374,251 decisions, every one recorded. Game theory says how they should evolve - here is what actually happened.'
    }
  ],
  calendar: {
    month: 'August 2015',
    sub: '20 weekdays - two sessions daily, 13:00 & 15:00 EDT',
    header: ['M', 'T', 'W', 'T', 'F'],
    weeks: [
      [3, 4, 5, 6, 7],
      [10, 11, 12, 13, 14],
      [17, 18, 19, 20, 21],
      [24, 25, 26, 27, 28],
      [31, null, null, null, null]
    ],
    nonDays: [3]
  },
  rules: {
    devId: 'P3I',
    title: 'The deal',
    items: [
      '$4.47 average per ~35-minute session (about $7.66/hour)',
      'a one-time $20 bonus for completing at least 18 of the 20 sessions',
      'miss more than two sessions and you were excluded - bonus forfeited'
    ]
  },
  tangle: {
    gameOne: 'game 1',
    gameTwenty: 'game 20',
    axis: 'one full session - 13:00 EDT, day 1: 540 real games',
    single: 'one game - ten rounds'
  }
} as const;
