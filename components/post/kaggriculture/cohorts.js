export function initializeCohorts() {

  const lifetime = new AbortController();
  const removers = [];
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    removers.push(() => target.removeEventListener(type, handler, options));
  }
const money = n => Math.round(n).toLocaleString('en-US');
const replayVideos = [...document.querySelectorAll('video')];
replayVideos.forEach(video => listen(video, 'play', () => {
  replayVideos.forEach(other => { if (other !== video) other.pause(); });
}));
const signed = n => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`;
const summary = document.getElementById('cohort-summary');
const grid = document.getElementById('game-grid');
const detail = document.getElementById('game-detail');
let cohorts;
function selectGame(cohort, row, button) {
  grid.querySelectorAll('button').forEach(b => {
    b.classList.toggle('selected', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  detail.replaceChildren();
  const label = document.createElement('b');
  label.textContent = `${cohort.label} · Game ${row.game_no} · ${row.margin > 0 ? 'Win' : row.margin < 0 ? 'Loss' : 'Draw'} `;
  detail.append(label, document.createTextNode(`Margin ${signed(row.margin)} coins; own cash ${money(row.own_cash)}; rival cash ${money(row.rival_cash)}. Public replay ${row.episode}, seat ${row.seat}.`));
}
function renderCohort(index) {
  const c = cohorts[index];
  document.querySelectorAll('[data-cohort]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.cohort) === index)));
  summary.innerHTML = `<div><strong>${c.first40.wins}/40</strong><span>${c.first40.losses} first-40 losses</span></div><div><strong>${c.first60.wins}/60</strong><span>${c.first60.losses} first-60 losses</span></div><div><strong>${c.first60.strictly_above30000}/60</strong><span>margins &gt; 30,000</span></div>`;
  grid.replaceChildren();
  c.rows.forEach(row => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = row.game_no;
    button.className = row.margin < 0 ? 'loss' : row.margin > 30000 ? 'floor' : '';
    button.title = `Game ${row.game_no}: ${signed(row.margin)} coins`;
    button.setAttribute('aria-label', button.title);
    listen(button, 'click', () => selectGame(c, row, button));
    grid.append(button);
  });
  const selected = c.rows.findIndex(r => r.margin < 0);
  selectGame(c, c.rows[selected < 0 ? 0 : selected], grid.children[selected < 0 ? 0 : selected]);
}
fetch('/assets/posts/kaggriculture-autoresearch/data/cohorts.json', {signal: lifetime.signal}).then(r => {
  if (!r.ok) throw new Error(`cohort data ${r.status}`);
  return r.json();
}).then(data => {
  if (lifetime.signal.aborted) return;
  cohorts = data;
  document.querySelectorAll('[data-cohort]').forEach(button => listen(button, 'click', () => renderCohort(Number(button.dataset.cohort))));
  renderCohort(0);
}).catch(error => {
  if (lifetime.signal.aborted) return;
  detail.textContent = 'Interactive data is unavailable. The complete static margin chart below contains both cohorts.';
  console.error(error);
});

return () => { lifetime.abort(); removers.forEach(remove => remove()); replayVideos.forEach(video => video.pause()); };
}
