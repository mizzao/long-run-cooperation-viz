/**
 * Dev-only Vite middleware that writes caption timings back into
 * `src/lib/content/*.ts`.
 *
 * The tuner panel (src/lib/dev/CapTuner.svelte) POSTs
 * `{ updates: [{ id, at, until }] }` to /__cap-timing; each entry is matched by
 * its `id: 'PxCy'` literal and only the two numbers are rewritten, so comments,
 * formatting and caption text stay untouched. Writing the file triggers the
 * normal HMR reload, so the page picks the new values straight up.
 *
 * `apply: 'serve'` keeps this out of the production build entirely.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = 'src/lib/content';
const ENDPOINT = '/__cap-timing';

/** @param {number} n */
const fmt = (n) => String(Math.round(n * 1000) / 1000);

/**
 * Rewrite the `at`/`until` of one caption, identified by its id literal.
 * @param {string} src @param {string} id @param {number} at @param {number} until
 * @returns {string | null} the new file text, or null if the id is not in this file
 */
function patch(src, id, at, until) {
  const marker = `id: '${id}'`;
  const start = src.indexOf(marker);
  if (start < 0) return null;
  // Stop at the next caption so we can't stray into a neighbouring object.
  const next = src.indexOf("id: '", start + marker.length);
  const end = next < 0 ? src.length : next;

  let hits = 0;
  let region = src.slice(start, end);
  region = region.replace(/\bat:\s*[0-9.]+/, () => (hits++, `at: ${fmt(at)}`));
  region = region.replace(/\buntil:\s*[0-9.]+/, () => (hits++, `until: ${fmt(until)}`));
  if (hits !== 2) return null;
  return src.slice(0, start) + region + src.slice(end);
}

/**
 * @param {string} root
 * @param {{ id: string; at: number; until: number }[]} updates
 */
function applyUpdates(root, updates) {
  const dir = join(root, CONTENT_DIR);
  /** @type {Map<string, string>} */ const files = new Map();
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.ts')) files.set(name, readFileSync(join(dir, name), 'utf8'));
  }

  /** @type {string[]} */ const written = [];
  /** @type {string[]} */ const skipped = [];
  const touched = new Set();

  for (const u of updates) {
    if (typeof u?.id !== 'string' || !Number.isFinite(u.at) || !Number.isFinite(u.until)) {
      skipped.push(String(u?.id));
      continue;
    }
    let done = false;
    for (const [name, src] of files) {
      const out = patch(String(src), u.id, u.at, u.until);
      if (out === null) continue;
      if (out !== src) {
        files.set(name, out);
        touched.add(name);
      }
      written.push(u.id);
      done = true;
      break;
    }
    if (!done) skipped.push(u.id);
  }

  for (const name of touched) writeFileSync(join(dir, name), String(files.get(name)), 'utf8');
  return { written, skipped, files: [...touched] };
}

const STUB_ID = '\0cap-tuner-stub';

/** @returns {import('vite').Plugin[]} */
export function capTimingWriteback() {
  return [stubPanelOnBuild(), writebackOnServe()];
}

/**
 * The panel is only ever imported from a `dev`-guarded branch, but the bundler
 * still emits a chunk for the dynamic import - orphaned, yet deployed. Resolve
 * it to an inert module during builds so no dev tooling reaches the live site.
 * @returns {import('vite').Plugin}
 */
function stubPanelOnBuild() {
  return {
    name: 'cap-timing-stub',
    apply: 'build',
    enforce: 'pre',
    resolveId(source) {
      return source.endsWith('/dev/CapTuner.svelte') ? STUB_ID : null;
    },
    load(id) {
      return id === STUB_ID ? 'export default null;' : null;
    }
  };
}

/** @returns {import('vite').Plugin} */
function writebackOnServe() {
  return {
    name: 'cap-timing-writeback',
    apply: 'serve',
    configureServer(server) {
      /* eslint-disable-next-line */
      server.middlewares.use(ENDPOINT, (req, res) => {
        /** @param {number} code @param {unknown} body */
        const send = (code, body) => {
          res.statusCode = code;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { ok: false, error: 'POST only' });

        let body = '';
        req.on('data', (c) => {
          body += c;
          if (body.length > 1e6) req.destroy();
        });
        req.on('end', () => {
          try {
            const { updates } = JSON.parse(body || '{}');
            if (!Array.isArray(updates) || !updates.length) return send(400, { ok: false, error: 'no updates' });
            const result = applyUpdates(server.config.root, updates);
            if (!result.written.length) return send(422, { ok: false, error: `no caption ids matched: ${result.skipped.join(', ')}` });
            server.config.logger.info(`  cap-timing: wrote ${result.written.join(', ')} -> ${result.files.join(', ')}`);
            send(200, { ok: true, ...result });
          } catch (err) {
            send(500, { ok: false, error: err instanceof Error ? err.message : String(err) });
          }
        });
      });
    }
  };
}
