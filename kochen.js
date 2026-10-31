/* ---------- „Was habt ihr da?“ – Rezeptvorschläge aus dem, was zu Hause ist ----------
   Liegt bewusst in einer eigenen Datei (mit rezepte.json), damit es die wöchentlich neu gebaute
   index.html überlebt. Die Seite braucht nur <section id="kochen"></section> und <script src="kochen.js" defer>.
   Die Auswahl bleibt pro Gerät gespeichert (localStorage). Salz, Öl, Gewürze, Zwiebeln, Knoblauch, Brühe usw.
   gelten als Grundvorrat und zählen nicht mit (Schlüssel null in rezepte.json). */
(() => {
  const host = document.getElementById("kochen");
  if (!host) return;
  const KEY = "wocheneinkauf-da";
  const CAT_ORDER = ["Gemüse & Obst", "Kühlregal", "Brot", "Vorrat"];
  let data = null, have = new Set(), custom = [];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    have = new Set(saved.have || []); custom = saved.custom || [];
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ have: [...have], custom })); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const css = document.createElement("style");
  css.textContent = `
#kochen { display: flex; flex-direction: column; gap: 14px; }
.da-box { background: var(--surface); border: 1px solid var(--line); border-top: 5px solid var(--a-green); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.da-row { display: flex; flex-wrap: wrap; gap: 8px; }
.da-row input { flex: 1 1 220px; min-width: 0; min-height: 44px; font: inherit; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--ink); }
.da-row input:focus-visible { outline: 2px solid var(--basil); outline-offset: 1px; }
.da-btn { font: inherit; font-weight: 600; min-height: 44px; padding: 0 16px; border-radius: 10px; cursor: pointer; border: 1px solid var(--basil); background: var(--basil); color: #ffffff; }
.da-btn.ghost { background: var(--surface); color: var(--basil); }
.da-btn:focus-visible { outline: 2px solid var(--basil); outline-offset: 2px; }
.da-group { display: flex; flex-direction: column; gap: 6px; }
.da-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.da-chip { font: inherit; font-size: 0.88rem; font-weight: 600; min-height: 36px; padding: 0 12px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--line); background: var(--bg); color: var(--ink); }
.da-chip[aria-pressed="true"] { background: var(--a-green); border-color: var(--a-green); color: #ffffff; }
.da-chip.custom[aria-pressed="true"] { background: var(--a-violet); border-color: var(--a-violet); }
.da-chip:focus-visible { outline: 2px solid var(--basil); outline-offset: 2px; }
.da-chip[hidden] { display: none; }
.da-mine { font-size: 0.9rem; }
.da-mine b { color: var(--a-green); }
.da-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.da-tools .fine { flex: 1 1 200px; }
.da-results { display: flex; flex-direction: column; gap: 12px; }
.da-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; display: grid; grid-template-columns: 120px 1fr; }
.da-card .pic { background: var(--t-green); display: grid; place-items: center; }
.da-card .pic svg { width: 100%; height: auto; display: block; }
.da-card .body { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.da-card h3 { font-size: 1.05rem; }
.da-card .meta { color: var(--muted); font-family: var(--font-mono); font-size: 0.8rem; }
.da-bar { height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; }
.da-bar span { display: block; height: 100%; background: var(--a-green); border-radius: 999px; }
.da-card .ok { color: var(--a-green); font-weight: 600; }
.da-card .miss { color: var(--pumpkin); font-weight: 600; }
.da-card .line { font-size: 0.9rem; margin: 0; }
.da-card details summary { cursor: pointer; color: var(--basil); font-weight: 600; font-size: 0.9rem; min-height: 32px; display: flex; align-items: center; }
.da-card details ul, .da-card details ol { margin: 6px 0; padding-left: 1.2em; font-size: 0.9rem; }
.da-card details li.has { color: var(--a-green); }
.da-card details li.has::marker { content: "✓ "; }
.da-card details .src { font-size: 0.82rem; color: var(--muted); margin: 4px 0 0; }
.da-card details .src a { color: var(--basil); }
.da-empty { color: var(--muted); margin: 0; }
@media (max-width: 520px) { .da-card { grid-template-columns: 1fr; } .da-card .pic { max-height: 120px; overflow: hidden; } }
`;
  document.head.appendChild(css);

  host.innerHTML = `
    <h2 id="kochen-h">Was habt ihr da?</h2>
    <p class="fine">Tippt an, was noch im Kühlschrank oder Vorrat ist. Darunter erscheinen eure Rezepte, für die am wenigsten fehlt. Salz, Öl, Gewürze, Zwiebeln, Knoblauch und Brühe setze ich voraus. Die Auswahl merkt sich dieses Gerät.</p>
    <div class="da-box">
      <form class="da-row" id="da-form" autocomplete="off">
        <input id="da-q" type="text" maxlength="40" placeholder="Zutat suchen oder eintippen, z. B. Feta" aria-label="Zutat suchen oder eintippen" enterkeyhint="done">
        <button class="da-btn" type="submit">Dazu</button>
      </form>
      <div id="da-groups"><p class="da-empty">Rezepte werden geladen …</p></div>
      <div class="da-tools">
        <p class="fine da-mine" id="da-mine"></p>
        <button class="da-btn ghost" type="button" id="da-copy">Für Claude kopieren</button>
        <button class="da-btn ghost" type="button" id="da-clear">Alles abwählen</button>
      </div>
    </div>
    <div class="da-results" id="da-results" aria-live="polite"></div>`;

  const q = host.querySelector("#da-q");
  const groupsEl = host.querySelector("#da-groups");
  const resEl = host.querySelector("#da-results");

  function keysOf(r) { return [...new Set(r.ingredients.map(i => i[2]).filter(Boolean))]; }
  /* Selbst eingetippte Zutaten zählen, wenn sie im Zutatennamen vorkommen (z. B. „Cherry“ → Cherrytomaten) */
  function hasIng(i) {
    if (!i[2]) return false;
    if (have.has(i[2])) return true;
    const n = i[1].toLowerCase();
    return custom.some(c => n.includes(c.toLowerCase()));
  }

  function renderGroups() {
    const cats = data.kategorien;
    const all = Object.keys(cats).sort((a, b) => a.localeCompare(b, "de"));
    const term = q.value.trim().toLowerCase();
    groupsEl.innerHTML = CAT_ORDER.map(cat => {
      const keys = all.filter(k => cats[k] === cat);
      if (!keys.length) return "";
      return `<div class="da-group"><p class="eyebrow">${cat}</p><div class="da-chips">${keys.map(k =>
        `<button type="button" class="da-chip" data-k="${esc(k)}" aria-pressed="${have.has(k)}"${term && !k.toLowerCase().includes(term) ? " hidden" : ""}>${esc(k)}</button>`).join("")}</div></div>`;
    }).join("") + (custom.length ? `<div class="da-group"><p class="eyebrow">Selbst eingetippt</p><div class="da-chips">${custom.map(c =>
      `<button type="button" class="da-chip custom" data-c="${esc(c)}" aria-pressed="true" aria-label="${esc(c)} entfernen">${esc(c)} ×</button>`).join("")}</div></div>` : "");
  }

  function renderResults() {
    const mine = [...have, ...custom];
    host.querySelector("#da-mine").innerHTML = mine.length ? `<b>${mine.length}</b> ausgewählt` : "Noch nichts ausgewählt";
    if (!mine.length) { resEl.innerHTML = ""; return; }
    const scored = data.rezepte.map(r => {
      const need = keysOf(r);
      const got = need.filter(k => r.ingredients.some(i => i[2] === k && hasIng(i)));
      const miss = need.filter(k => !got.includes(k));
      return { r, got, miss, share: need.length ? got.length / need.length : 0 };
    }).filter(x => x.got.length).sort((a, b) => b.share - a.share || a.miss.length - b.miss.length || b.got.length - a.got.length).slice(0, 5);
    if (!scored.length) {
      resEl.innerHTML = `<p class="da-empty">Dazu passt noch keins eurer Rezepte. Tippt auf „Für Claude kopieren“ und schickt mir die Liste, dann suche ich ein neues Rezept.</p>`;
      return;
    }
    resEl.innerHTML = `<p class="eyebrow">Passt am besten</p>` + scored.map(({ r, got, miss, share }) => `
      <article class="da-card">
        <div class="pic">${r.art && typeof svgFor === "function" && typeof ART !== "undefined" && ART[r.art] ? svgFor(r.art) : ""}</div>
        <div class="body">
          <h3>${esc(r.title)}</h3>
          <span class="meta">${esc(r.time)} · ${esc(r.portions)}</span>
          <div class="da-bar" role="img" aria-label="${got.length} von ${got.length + miss.length} Zutaten da"><span style="width:${Math.round(share * 100)}%"></span></div>
          <p class="line"><span class="ok">Da (${got.length}):</span> ${got.map(esc).join(", ")}</p>
          <p class="line">${miss.length ? `<span class="miss">Fehlt (${miss.length}):</span> ${miss.map(esc).join(", ")}` : `<span class="ok">Alles da, los geht’s!</span>`}</p>
          <details>
            <summary>Rezept anzeigen</summary>
            <ul>${r.ingredients.map(i => `<li${hasIng(i) ? ` class="has"` : ""}>${i[0] ? `${esc(i[0])} ` : ""}${esc(i[1])}</li>`).join("")}</ul>
            <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
            <p class="src">Original: <a href="${esc(r.src[1])}" target="_blank" rel="noopener">${esc(r.src[0])}</a></p>
          </details>
        </div>
      </article>`).join("");
  }

  function render() { renderGroups(); renderResults(); }

  groupsEl.addEventListener("click", ev => {
    const b = ev.target.closest(".da-chip");
    if (!b) return;
    if (b.dataset.k) { have.has(b.dataset.k) ? have.delete(b.dataset.k) : have.add(b.dataset.k); }
    else if (b.dataset.c) { custom = custom.filter(c => c !== b.dataset.c); }
    save(); render();
  });
  q.addEventListener("input", renderGroups);
  host.querySelector("#da-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const t = q.value.trim();
    if (!t || !data) return;
    const exact = Object.keys(data.kategorien).find(k => k.toLowerCase() === t.toLowerCase());
    if (exact) have.add(exact);
    else if (!custom.some(c => c.toLowerCase() === t.toLowerCase())) custom.push(t);
    q.value = ""; save(); render();
  });
  host.querySelector("#da-clear").addEventListener("click", () => { have.clear(); custom = []; save(); render(); });
  host.querySelector("#da-copy").addEventListener("click", async ev => {
    const list = [...have, ...custom].join(", ");
    const text = list ? `Wir haben noch da: ${list}. Was können wir daraus kochen?` : "";
    if (!text) return;
    const btn = ev.currentTarget;
    try { await navigator.clipboard.writeText(text); btn.textContent = "Kopiert ✓"; }
    catch (e) { window.prompt("Zum Kopieren:", text); }
    setTimeout(() => { btn.textContent = "Für Claude kopieren"; }, 2000);
  });

  fetch("rezepte.json", { cache: "no-cache" }).then(r => r.json()).then(d => { data = d; render(); })
    .catch(() => { groupsEl.innerHTML = `<p class="da-empty">Die Rezepte konnten gerade nicht geladen werden. Bitte später noch mal öffnen.</p>`; });
})();
