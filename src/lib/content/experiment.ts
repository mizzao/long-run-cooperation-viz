export const experiment = {
  kicker: 'Part three',
  title: 'The experiment',
  captions: [
    {
      id: 'P3C1',
      at: 0.12,
      until: 0.25,
      text: 'On 4 August 2015, 113 people logged in from 31 US states, ages 18 to 61, 47% women, recruited on Amazon Mechanical Turk. [b]94 of them[/] finished the month. They are the study population.'
    },
    {
      id: 'P3C2',
      at: 0.27,
      until: 0.4,
      text: 'Every weekday for a month the same people returned - twenty days in all, one session at 13:00 and one at 15:00 EDT, about 35 minutes each.'
    },
    {
      id: 'P3C3',
      at: 0.43,
      until: 0.56,
      text: 'Long experiments usually die from dropouts, so showing up was worth real money. It worked: 94 of 113 players (83%) completed the month.'
    },
    {
      id: 'P3C4',
      at: 0.6,
      until: 0.78,
      text: 'One real game from the first afternoon: two strangers, ten rounds. Each cell is one decision - green for [c]cooperate[/], red for [d]defect[/]. Twenty-six pairs played the session’s first game at the same time.'
    },
    {
      id: 'P3C5',
      at: 0.85,
      until: 0.93,
      text: 'After each game the pairs reshuffled: a new anonymous partner every game, twenty games a session. Players never saw names or histories, so no one could build a reputation. Each game stood on its own.'
    },
    {
      id: 'P3C6',
      at: 0.935,
      until: 1,
      text: 'The dark line follows one player through all twenty games. This is one session of one day. The full experiment ran two sessions a day for twenty days: [k]374,251[/] recorded decisions. The next sections show how they changed over the month.'
    }
  ],
  calendar: {
    month: 'August 2015',
    sub: '20 weekdays - two sessions daily, 13:00 & 15:00 EDT',
    header: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    weeks: [
      [3, 4, 5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14, 15, 16],
      [17, 18, 19, 20, 21, 22, 23],
      [24, 25, 26, 27, 28, 29, 30],
      [31, null, null, null, null, null, null]
    ],
    nonDays: [3, 8, 9, 15, 16, 22, 23, 29, 30]
  },
  rules: {
    devId: 'P3I',
    title: 'The deal',
    items: [
      'Every decision was played for real money - and finishing the whole month earned a bonus.'
    ]
  },
  tangle: {
    gameOne: 'game 1',
    gameTwenty: 'game 20',
    axis: 'one full session - 13:00 EDT, day 1: 540 real games',
    single: 'one game - ten rounds'
  }
} as const;
