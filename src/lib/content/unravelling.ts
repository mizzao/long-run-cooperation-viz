export const unravelling = {
  kicker: 'Part four',
  title: 'The unravelling begins',
  captions: [
    { at: 0.05, until: 0.25, text: 'Day 1: twenty consecutive games, ten rounds each. Cooperation drops sharply in each game\u2019s final rounds and resets when a new game begins with a new partner.' },
    { at: 0.3, until: 0.46, text: 'The same data, zoomed out: 400 games over 20 days. Each line tracks cooperation in one round of the game. Day 1 is the first sliver on the left.' },
    { at: 0.48, until: 0.64, text: 'Round 10 - the last round of each game - falls fastest: 51% cooperation on day 1, and it never recovers.' },
    { at: 0.66, until: 0.8, text: 'Round 9 follows the same pattern a few days later. This is the unravelling that backward-induction theory predicts.' },
    { at: 0.85, until: 1, text: 'Round 1 stays above 91% for the entire experiment. The open question: where does the slide stop?' }
  ],
  chart: {
    yTitle: '% of players cooperating',
    xTitleDay: 'Day 1, played left to right - twenty games of ten rounds each',
    xTitleAll: 'Days 1-20 - one point per game, one line per round',
    xTitleDayShort: 'Day 1 - twenty games, left to right',
    xTitleAllShort: 'Days 1-20 - one point per game',
    bracket: 'one game = 10 rounds',
    dipNote: ['defection spikes in the last', 'rounds - the end-game effect'],
    restartNote: ['new game, new partner -', 'cooperation resets'],
    dipNoteShort: ['end-game', 'defection'],
    restartNoteShort: ['trust', 'resets'],
    morningNote: ['each morning,', 'cooperation resets upward -', 'then the slide resumes']
  }
} as const;
