export const load = async ({ fetch }) => {
  const [coopRaw, hbRaw, defRaw, stratRaw, payoffsRaw] = await Promise.all([
    fetch('/data/coop_by_round_game.json').then((r) => r.json()),
    fetch('/data/day_heartbeat.json').then((r) => r.json()),
    fetch('/data/first_defection_by_day.json').then((r) => r.json()),
    fetch('/data/strategy_raster.json').then((r) => r.json()),
    fetch('/data/payoffs_by_group_day.json').then((r) => r.json())
  ]);
  return { coopRaw, hbRaw, defRaw, stratRaw, payoffsRaw };
};
