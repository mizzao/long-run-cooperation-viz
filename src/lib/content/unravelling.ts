export const unravelling = {
  kicker: 'Part four',
  title: 'The unravelling begins',
  captions: [
    { at: 0.05, until: 0.26, text: 'Day 1: twenty consecutive games, ten rounds each. [c]Cooperation[/] drops sharply in each game\u2019s final rounds and resets when a new game begins with a new partner.' },
    { at: 0.3, until: 0.47, text: 'The same data, zoomed out to the whole month: 400 games over 20 days. Each colored line tracks one round of the game. The day-1 games you just watched are now the leftmost segment of the chart.' },
    { at: 0.48, until: 0.65, text: 'Round 10 - the last round of each game - falls fastest: [k]51%[/] cooperation on day 1, and it [d]never recovers[/].' },
    { at: 0.66, until: 0.82, text: 'Round 9 starts falling a few days after round 10. [d]Defection[/] is moving backward through the game, one round at a time - the pattern the theory in part two predicts.' },
    { at: 0.85, until: 1, text: 'Round 1 never drops below [k]91%[/]. The question the next section answers: does the fall in the late rounds continue all the way down?' }
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
