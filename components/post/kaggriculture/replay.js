/* Public saved-replay viewer. No simulation, interpolation, or policy execution. */
export function initializeReplay() {
  'use strict';
  const lifetime = new AbortController();
  const removers = [];
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    removers.push(() => target.removeEventListener(type, handler, options));
  }

  const ids = ['case', 'play', 'speed', 'turn', 'time', 'own-bank', 'rival-bank',
    'margin', 'own-farm', 'rival-farm', 'command', 'scope', 'result', 'error', 'cell-info'];
  const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(`replay-${id}`)]));
  if (!ui.case) return;
  if (ids.some(id => !ui[id])) {
    console.error('Replay controls are incomplete.');
    return;
  }
  const icons = Object.freeze({WHEAT: '🌾', CARROT: '🥕', TOMATO: '🍅', STRAWBERRY: '🍓',
    MELON: '🍈', COW: '🐄', SHEEP: '🐑', GOOSE: '🪿', WEED: '🌿', PASTURE: '🟫', COOP: '🪹'});
  const cash = value => Number(value).toLocaleString('en-US', {maximumFractionDigits: 0});
  const signed = value => `${value >= 0 ? '+' : '−'}${cash(Math.abs(value))}`;
  const position = (p, x, y) => Array.isArray(p) && p[0] === x && p[1] === y;
  let cases = [], data = null, step = 0, selection = null;
  const resultNotes = Object.freeze({
    '859_recovery': 'The local programme turns −15 into +753: own cash rises 761; rival cash falls 7.',
    '397_narrow_preserved_win': 'Already a win: margin improves 156→241 and own cash rises 77.',
    '397_fragile46_win': 'The parent also won by 46; this fragile win survives unchanged.',
    '361_live_strategic_loss': 'All 719 callbacks completed. Productive paid work makes wage deletion an unproven fix.'
  });
  const displayLabels = Object.freeze({'859_recovery':'859 · Loss recovered (+753)','397_narrow_preserved_win':'397 · Last-day route (+241)','397_fragile46_win':'397 · Fragile win (+46)','361_live_strategic_loss':'361 · Hosted loss (−1,226)'});
  const displayScope = entry => `${entry.id === '361_live_strategic_loss' ? 'Actual hosted match · Margin361' : entry.id === '859_recovery' ? 'Recorded local test · Demand859V3' : 'Recorded local test · Final397'} · source ${entry.source_sha256.slice(0, 12)}…`;
  let playing = false, animation = 0, lastTime = null, remainder = 0;
  let generation = 0, controller = null;

  function setError(message = '') {
    ui.error.textContent = message;
    ui.error.hidden = !message;
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(animation);
    lastTime = null;
    remainder = 0;
    ui.play.textContent = data && step === data.frames.length - 1 ? 'Replay' : 'Play';
    ui.play.setAttribute('aria-pressed', 'false');
  }
  function controls(disabled) {
    ui.play.disabled = disabled;
    ui.speed.disabled = disabled;
    ui.turn.disabled = disabled;
  }
  function localURL(value, base = document.baseURI) {
    const url = new URL(value, base);
    if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Replay data must be served from this local site.');
    }
    return url;
  }
  async function readJSON(url, signal) {
    const response = await fetch(url, {signal, credentials: 'same-origin'});
    if (!response.ok) throw new Error(`Replay file could not be loaded (HTTP ${response.status}).`);
    return response.json();
  }
  function createCells(grid, side) {
    grid.replaceChildren();
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', `${side === 'own' ? 'Own' : 'Rival'} farm, columns and rows 0 to 9`);
    const cells = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.disabled = true;
      cell.className = 'replay-cell';
      listen(cell, 'click', () => { selection = {side, x, y}; render(); });
      const glyph = document.createElement('span');
      glyph.className = 'replay-tile-icon';
      glyph.setAttribute('aria-hidden', 'true');
      const yieldLabel = document.createElement('span');
      yieldLabel.className = 'replay-yield';
      yieldLabel.setAttribute('aria-hidden', 'true');
      const workers = document.createElement('span');
      workers.className = 'replay-workers';
      workers.setAttribute('aria-hidden', 'true');
      const farmer = document.createElement('span');
      farmer.className = 'replay-farmer';
      farmer.setAttribute('aria-hidden', 'true');
      farmer.textContent = 'F';
      cell.append(glyph, yieldLabel, workers, farmer);
      grid.append(cell);
      cells.push({cell, glyph, yieldLabel, workers, farmer, x, y});
    }
    return cells;
  }
  const ownCells = createCells(ui['own-farm'], 'own');
  const rivalCells = createCells(ui['rival-farm'], 'rival');

  function drawFarm(farm, cells, day, side) {
    for (const c of cells) {
      const tile = farm.tiles[c.y][c.x];
      const object = tile && typeof tile === 'object' ? tile : null;
      const kind = tile === 'LOCKED' ? 'locked' : tile === null ? 'empty'
        : object?.kind === 'PLANT' ? 'plant' : object?.animal ? 'animal'
        : object?.kind === 'WEED' ? 'weed' : 'structure';
      const item = object?.crop || object?.animal || object?.kind;
      const isFarmer = position(farm.farmer, c.x, c.y);
      const handIDs = farm.hands.flatMap((p, i) => position(p, c.x, c.y) ? [i] : []);
      c.cell.className = `replay-cell is-${kind}`;
      c.cell.disabled = false;
      const selected = selection?.side === side && selection.x === c.x && selection.y === c.y;
      c.cell.classList.toggle('is-selected', selected);
      c.cell.setAttribute('aria-pressed', String(selected));
      c.cell.classList.toggle('is-watered', Boolean(object?.watered_today));
      c.cell.classList.toggle('is-fed', Boolean(object?.fed_today));
      c.cell.classList.toggle('is-fertilized', object?.kind === 'PLANT' &&
        Number(object.fertilized_until_day ?? -1) >= day);
      c.cell.classList.toggle('has-farmer', isFarmer);
      c.cell.classList.toggle('has-workers', handIDs.length > 0);
      c.glyph.textContent = kind === 'locked' ? '🔒' : kind === 'empty' ? '' : icons[item] || '□';
      const units = Number(object?.yield_units || 0);
      c.yieldLabel.textContent = units > 0 ? String(units) : '';
      c.yieldLabel.hidden = units <= 0;
      c.workers.textContent = String(handIDs.length);
      c.workers.hidden = handIDs.length === 0;
      c.farmer.hidden = !isFarmer;
      c.cell.title = JSON.stringify({position: [c.x, c.y], tile, farmer: isFarmer, hand_indices: handIDs}, null, 2);
      if (selected) ui['cell-info'].textContent = `${side === 'own' ? 'Own' : 'Rival'} farm · column ${c.x}, row ${c.y} (zero-based)\n` + c.cell.title;
      c.cell.setAttribute('aria-label', `Column ${c.x}, row ${c.y}: ${item || kind}` +
        (units > 0 ? `, held yield ${units}` : '') +
        (isFarmer ? ', farmer' : '') + (handIDs.length ? `, ${handIDs.length} workers` : ''));
    }
  }

  // Decode storage only. These are observed public states, not simulated states.
  function normalize(raw, entry) {
    const ownSeat = raw.own_seat;
    const enc = raw.cell_encoding;
    if (raw.schema_version !== 1 || raw.id !== entry.id || ownSeat !== entry.own_seat ||
        raw.source_sha256 !== entry.source_sha256 || ![0, 1].includes(ownSeat) ||
        !Array.isArray(raw.frames) || raw.frames.length !== 720 ||
        !enc || enc.count !== 100 || enc.order !== 'y*10+x' ||
        !Number.isInteger(enc.width) || enc.width < 1 || enc.width > 4 ||
        typeof enc.alphabet !== 'string' || enc.alphabet.length < 2 ||
        new Set(enc.alphabet).size !== enc.alphabet.length ||
        !Array.isArray(raw.tiles) || !Array.isArray(raw.commands) || !raw.tile_fields || !raw.kind_codes) {
      throw new Error('Replay schema or source binding is invalid.');
    }
    const validPosition = p => Array.isArray(p) && p.length === 2 &&
      p.every(v => Number.isInteger(v) && v >= 0 && v < 10);
    const tiles = raw.tiles.map(tile => {
      const kind = raw.kind_codes[tile.k];
      if (kind === 'EMPTY') return null;
      if (kind === 'LOCKED') return 'LOCKED';
      if (!kind) throw new Error('Unknown tile kind in replay.');
      const expanded = {};
      for (const [key, value] of Object.entries(tile)) {
        if (!raw.tile_fields[key]) throw new Error('Unknown public tile field.');
        expanded[raw.tile_fields[key]] = key === 'k' ? kind : value;
      }
      return expanded;
    });
    function command(id) {
      if (!Number.isInteger(id) || !Array.isArray(raw.commands[id])) {
        throw new Error('Replay command index is invalid.');
      }
      return raw.commands[id];
    }
    const frames = raw.frames.map((f, row) => {
      if (f.r !== row || !Number.isInteger(f.d) || !Number.isInteger(f.h) ||
          !Array.isArray(f.b) || f.b.length !== 2 || !f.b.every(Number.isFinite) ||
          !Array.isArray(f.f) || f.f.length !== 2) throw new Error('Replay state is incomplete.');
      const farms = f.f.map((farm, seat) => {
        if (!validPosition(farm.p) || !Array.isArray(farm.w) || !farm.w.every(validPosition) ||
            typeof farm.t !== 'string' || farm.t.length !== 100 * enc.width) {
          throw new Error('Replay board or worker position is invalid.');
        }
        const board = Array.from({length: 10}, () => []);
        for (let i = 0; i < 100; i++) {
          let id = 0;
          for (let j = 0; j < enc.width; j++) {
            const digit = enc.alphabet.indexOf(farm.t[i * enc.width + j]);
            if (digit < 0) throw new Error('Replay tile encoding is invalid.');
            id = id * enc.alphabet.length + digit;
          }
          if (id >= tiles.length) throw new Error('Replay tile index is invalid.');
          board[Math.floor(i / 10)].push(tiles[id]);
        }
        return {money: f.b[seat], tiles: board, farmer: farm.p, hands: farm.w,
          unlocked_quadrants: farm.q, hires_today: farm.n};
      });
      let commands = null;
      if (row > 0) {
        if (!Array.isArray(f.a) || f.a.length !== 3 || !Array.isArray(f.a[1]) || !Array.isArray(f.a[2])) {
          throw new Error('Replay own request is missing.');
        }
        commands = {farmer: command(f.a[0]), hands: f.a[1].map(command), market: f.a[2].map(command)};
      }
      return {row, day: f.d, hour: f.h, farms, commands};
    });
    const terminal = frames[719].farms;
    if (terminal[ownSeat].money !== entry.own_cash || terminal[1 - ownSeat].money !== entry.rival_cash ||
        terminal[ownSeat].money - terminal[1 - ownSeat].money !== entry.margin) {
      throw new Error('Replay final result does not match the manifest.');
    }
    return {id: raw.id, frames, own_seat: ownSeat};
  }
  function render() {
    if (!data) return;
    const frame = data.frames[step];
    const farms = frame.public_farms ?? frame.farms;
    const own = farms[data.own_seat], rival = farms[1 - data.own_seat];
    drawFarm(own, ownCells, frame.day, 'own');
    drawFarm(rival, rivalCells, frame.day, 'rival');
    ui.turn.value = String(step);
    ui.time.textContent = `Day ${frame.day} · hour ${frame.hour} · saved state ${step}/719 (engine day/hour are zero-based)`;
    ui['own-bank'].textContent = cash(own.money);
    ui['rival-bank'].textContent = cash(rival.money);
    ui.margin.textContent = signed(own.money - rival.money);
    ui.margin.dataset.sign = own.money > rival.money ? 'positive' : own.money < rival.money ? 'negative' : 'zero';
    ui.command.textContent = step === 0 ? 'Initial state. No preceding command.' :
      'Own recorded request leading into this state; not proof of fills.\n' + JSON.stringify(frame.commands, null, 2);
    const terminal = data.frames[data.frames.length - 1];
    const finals = terminal.public_farms ?? terminal.farms;
    const margin = finals[data.own_seat].money - finals[1 - data.own_seat].money;
    ui.result.textContent = `Recorded final result: ${margin > 0 ? 'win' : margin < 0 ? 'loss' : 'draw'} ${signed(margin)} coins · ` +
      `${cash(finals[data.own_seat].money)} vs ${cash(finals[1 - data.own_seat].money)}. ` + (resultNotes[data.id] || '');
  }
  async function loadCase(id) {
    pause();
    const token = ++generation;
    controller?.abort();
    controller = new AbortController();
    data = null;
    for (const c of [...ownCells, ...rivalCells]) {
      c.cell.disabled = true; c.cell.className = 'replay-cell'; c.cell.title = '';
      c.cell.removeAttribute('aria-pressed'); c.cell.setAttribute('aria-label', 'Loading cell');
      c.glyph.textContent = ''; c.yieldLabel.hidden = c.workers.hidden = c.farmer.hidden = true;
    }
    for (const key of ['own-bank', 'rival-bank', 'margin']) ui[key].textContent = '—';
    ui.result.textContent = ''; ui.command.textContent = '';
    ui.turn.value = '0';
    controls(true);
    setError();
    ui.time.textContent = 'Loading recorded states…';
    const entry = cases.find(c => c.id === id);
    if (!entry) { setError('The selected replay is unavailable.'); return; }
    selection = null;
    ui['cell-info'].textContent = 'Select a cell to inspect its public tile and worker details.';
    ui.scope.textContent = displayScope(entry); ui.scope.title = `${entry.scope} Source: ${entry.source_sha256}`;
    try {
      const raw = await readJSON(localURL(entry.url, entry.baseURL), controller.signal);
      if (token !== generation) return;
      data = normalize(raw, entry);
      step = 144; // Open on engine day6; every earlier saved state remains selectable.
      ui.turn.min = '0'; ui.turn.max = '719'; ui.turn.step = '1';
      ui.scope.textContent = displayScope(entry);
      render();
      controls(false);
      ui.play.textContent = 'Play';
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      ui.time.textContent = 'Replay unavailable';
      setError(error.message || 'Could not load this replay.');
    }
  }
  function tick(now) {
    if (!playing || !data) return;
    if (lastTime === null) lastTime = now;
    const speed = [4, 12, 24].includes(Number(ui.speed.value)) ? Number(ui.speed.value) : 12;
    remainder += Math.max(0, now - lastTime) * speed / 1000;
    lastTime = now;
    if (remainder >= 1) {
      const advance = Math.floor(remainder);
      remainder -= advance;
      step = Math.min(data.frames.length - 1, step + advance);
      render();
      if (step === data.frames.length - 1) { pause(); return; }
    }
    animation = requestAnimationFrame(tick);
  }
  listen(ui.play, 'click', () => {
    if (!data) return;
    if (playing) { pause(); return; }
    if (step === data.frames.length - 1) { step = 0; render(); }
    document.querySelectorAll('video').forEach(video => video.pause());
    playing = true;
    lastTime = null; remainder = 0;
    ui.play.textContent = 'Pause'; ui.play.setAttribute('aria-pressed', 'true');
    animation = requestAnimationFrame(tick);
  });
  listen(ui.case, 'change', () => loadCase(ui.case.value));
  listen(ui.turn, 'input', () => {
    pause();
    if (!data) return;
    step = Math.min(719, Math.max(0, Number(ui.turn.value) || 0));
    render();
  });
  listen(ui.speed, 'change', () => { lastTime = null; remainder = 0; });
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });
  listen(document, 'play', event => { if (event.target instanceof HTMLVideoElement) pause(); }, true);
  listen(window, 'pagehide', () => { pause(); controller?.abort(); });

  controls(true);
  (async () => {
    try {
      const manifestURL = localURL(ui.case.dataset.manifest || 'data/interactive_replays/interactive_replay_manifest.json');
      const manifest = await readJSON(manifestURL, lifetime.signal);
      if (lifetime.signal.aborted) return;
      if (!Array.isArray(manifest.cases) || !manifest.cases.length) throw new Error('No replay cases are available.');
      cases = manifest.cases.map(entry => ({...entry, url: entry.url || entry.data_url || entry.path, baseURL: manifestURL}));
      if (cases.some(entry => typeof entry.id !== 'string' || typeof entry.url !== 'string') ||
          new Set(cases.map(entry => entry.id)).size !== cases.length) throw new Error('Replay manifest is invalid.');
      ui.case.replaceChildren(...cases.map(entry => {
        const option = document.createElement('option');
        option.value = entry.id; option.textContent = displayLabels[entry.id] || entry.label || entry.title || entry.id;
        return option;
      }));
      await loadCase(cases[0].id);
    } catch (error) {
      if (lifetime.signal.aborted) return;
      controls(true); setError(error.message || 'Could not load the replay index.');
    }
  })();

return () => { generation++; lifetime.abort(); controller?.abort(); pause(); removers.forEach(remove => remove()); };
}
