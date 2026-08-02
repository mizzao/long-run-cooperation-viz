export const appendix = {
  kicker: 'Appendix',
  title: 'For the curious',
  lead: 'The main story ends above. What follows is the fine print - the incentives, why the study ran on the internet, and the learning model that shows why a 40% minority is enough.',
  notes: [
    {
      title: 'The deal, precisely',
      items: [
        'Average pay was $4.47 per ~35-minute session - about $7.66 per hour.',
        'Completing at least 18 of the 20 sessions earned a one-time $20 bonus.',
        'Missing more than two sessions meant exclusion, bonus forfeited.'
      ]
    },
    {
      title: 'Why the internet',
      text: 'A laboratory session ends after an hour or two - about 20-30 games, too short to see where the slide stops. Running the experiment online let the same 94 people come back every weekday for a month, and made a kind of long-run behaviour visible that no lab session can reach.'
    }
  ]
} as const;
