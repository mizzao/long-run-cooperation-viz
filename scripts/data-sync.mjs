import { cpSync, mkdirSync } from 'node:fs';
const src = process.env.DATA_EXPORT_DIR
  ? new URL(`file://${process.env.DATA_EXPORT_DIR.replace(/\\/g, '/')}/`)
  : new URL('../../data-export/', import.meta.url);
const dst = new URL('../static/data/', import.meta.url);
mkdirSync(dst, { recursive: true });
for (const f of ['coop_by_round_game.json', 'day_heartbeat.json', 'first_defection_by_day.json', 'strategy_raster.json', 'payoffs_by_group_day.json']) {
  cpSync(new URL(f, src), new URL(f, dst));
  console.log('synced', f);
}
