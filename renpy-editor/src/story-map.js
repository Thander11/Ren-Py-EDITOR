// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Story map: the project's labels as cards,
// joined by their jumps, calls and menu choices
// ═══════════════════════════════════════════════════════════

const MAP_NODE_W = 220;
const MAP_NODE_H = 172;
const MAP_REF_H = 58;       // card that points to a scene placed elsewhere
const MAP_COL_GAP = 130;
const MAP_STACK_GAP = 38;   // between cards hanging under the same column
const MAP_INDENT = 40;      // hanging cards sit a bit to the right of their column
const MAP_PAD = 48;
const MAP_PAD_TOP = 120;    // room for the arcs between distant columns

let storyMap = null;    // { nodes: Map<name, node>, edges: [], cards: [], width, height }
let mapSelected = null; // name of the selected label
let mapZoom = 1;

async function openStoryMap() {
  if (!gamePath) { notify(t('open_project_first'), 'err'); return; }
  document.getElementById('map-overlay').classList.add('open');
  storyMap = await buildStoryMap();
  layoutStoryMap(storyMap);
  if (!storyMap.nodes.has(mapSelected)) mapSelected = storyMap.nodes.has('start') ? 'start' : null;
  renderStoryMap();
  fitStoryMap();
}

function closeStoryMap() {
  document.getElementById('map-overlay').classList.remove('open');
}

// ── Parsing ──

async function buildStoryMap() {
  const nodes = new Map();
  let edges = [];
  for (const file of await window.api.listRpyFiles()) {
    const text = await window.api.readFile(file);
    if (text) parseLabelsForMap(text, file, nodes, edges);
  }
  // Labels with parameters, or called with arguments, are helper routines, not scenes
  const helpers = new Set([...nodes.values()].filter(n => n.helper).map(n => n.name));
  for (const e of edges) if (e.kind === 'helper') helpers.add(e.to);
  helpers.forEach(name => nodes.delete(name));
  edges = edges.filter(e => !helpers.has(e.to));
  // Falling into the next label isn't drawn, but still counts to place the cards
  for (const e of edges) e.hidden = e.kind === 'next';
  // A called label returns to its caller, and so does every label it jumps to:
  // their return is not an ending
  const queue = edges.filter(e => e.kind === 'call').map(e => e.to);
  const inCall = new Set(queue);
  while (queue.length) {
    const cur = queue.shift();
    for (const e of edges) {
      if (e.from === cur && e.kind !== 'call' && !inCall.has(e.to)) { inCall.add(e.to); queue.push(e.to); }
    }
  }
  inCall.forEach(name => { if (nodes.has(name)) nodes.get(name).ending = false; });
  // Jumps and calls to labels that don't exist yet
  for (const e of edges) {
    if (!e.hidden && nodes.has(e.from) && !nodes.has(e.to)) {
      nodes.set(e.to, { name: e.to, missing: true, file: '', lines: 0, chars: [], menus: [] });
    }
  }
  // The same jump written twice is drawn once
  const seen = new Set();
  const unique = edges.filter(e => {
    if (!nodes.has(e.from) || !nodes.has(e.to)) return false;
    const id = `${e.from}|${e.to}|${e.kind}|${e.choice}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return { nodes, edges: unique, cards: [], width: 0, height: 0 };
}

function parseLabelsForMap(text, file, nodes, edges) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  lines.forEach((l, i) => {
    const m = /^label\s+(\w+)\s*(\([^)]*\))?\s*:\s*(?:#\s*(.*))?$/.exec(l);
    if (m) starts.push({ name: m[1], params: m[2], comment: (m[3] || '').trim(), line: i });
  });
  starts.forEach((s, k) => {
    const next = starts[k + 1];
    const body = lines.slice(s.line + 1, next ? next.line : lines.length);
    const node = analyzeLabelBody(s.name, file, body, edges);
    node.helper = !!s.params;
    // The comment after "label name:" describes the scene better than its first line
    if (s.comment) node.summary = s.comment;
    // Without jump or return at the end, Ren'Py continues into the next label
    if (node.fallsThrough) {
      if (next) edges.push({ from: s.name, to: next.name, kind: 'next', choice: '' });
      else node.ending = true;
    }
    if (!nodes.has(s.name)) nodes.set(s.name, node);
  });
}

const MAP_CHOICE_RE = /^"((?:[^"\\]|\\.)*)"\s*(?:if\s+(.+?))?\s*:$/;

function analyzeLabelBody(name, file, body, edges) {
  const node = {
    name, file, lines: 0, summary: '', background: '', firstScene: '', chars: [], menus: [],
    ending: false, fallsThrough: false
  };
  const menuStack = [];  // menus still open: { indent, choiceIndent, choices }
  let baseIndent = null;
  let lastBase = '';
  let terminal = '';     // top-level jump or return that ends the label
  let m;
  for (const raw of body) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    if (indent === 0) break;  // another top-level statement ends the label
    if (baseIndent === null) baseIndent = indent;
    node.lines++;
    if (terminal) continue;   // code after a top-level jump or return never runs
    if (indent === baseIndent) {
      lastBase = line;
      if (/^(jump|return)\b/.test(line) && !/^jump\s+expression\b/.test(line)) terminal = line;
    }

    while (menuStack.length && indent <= menuStack[menuStack.length - 1].indent) menuStack.pop();
    const menu = menuStack[menuStack.length - 1];
    const choice = menu && menu.choices.length && indent > menu.choiceIndent
      ? menu.choices[menu.choices.length - 1] : null;

    if (/^menu\b[^"]*:$/.test(line)) {
      const newMenu = { indent, choiceIndent: null, choices: [] };
      node.menus.push(newMenu);
      menuStack.push(newMenu);
    } else if (menu && (m = MAP_CHOICE_RE.exec(line)) && (menu.choiceIndent === null || indent === menu.choiceIndent)) {
      menu.choiceIndent = indent;
      menu.choices.push({ text: stripTextTags(unescRpy(m[1])), cond: m[2] || '', effects: [] });
    } else if ((m = /^(jump|call)\s+(\w+)\s*(\()?/.exec(line))) {
      // Calls with arguments go to helper routines; "jump expression" can't be followed
      if (m[2] !== 'expression') {
        const kind = m[3] ? 'helper' : m[1];
        edges.push({ from: name, to: m[2], kind, choice: kind !== 'helper' && choice ? choice.text : '' });
        if (choice && kind !== 'helper') choice.effects.push({ type: kind, to: m[2] });
      }
    } else if ((m = /^\$\s*(\w+)\s*([+\-*/]?=)\s*(.+)$/.exec(line))) {
      if (choice && !m[1].startsWith('_')) choice.effects.push({ type: 'set', text: `${m[1]} ${m[2]} ${m[3]}` });
    } else if ((m = /^scene\s+(.+?)(?:\s+(?:with|at|behind|onlayer)\b.*)?:?$/.exec(line))) {
      // The thumbnail is the first background that is a real image, skipping black screens
      if (!node.firstScene) node.firstScene = m[1];
      if (!node.background && !/black|negro/i.test(m[1]) && findImagePath(m[1])) node.background = m[1];
    } else if ((m = /^(\w+)\s+(?:\w+\s+)*"((?:[^"\\]|\\.)*)"$/.exec(line))) {
      const chr = data.characters.find(c => c.id === m[1]);
      if (chr) {
        if (!node.chars.includes(chr.id)) node.chars.push(chr.id);
        if (!node.summary) node.summary = `${chr.displayName}: ${stripTextTags(unescRpy(m[2]))}`;
      }
    } else if (!node.summary && (m = /^"((?:[^"\\]|\\.)*)"$/.exec(line))) {
      node.summary = stripTextTags(unescRpy(m[1]));
    }
  }
  node.menus = node.menus.filter(mn => mn.choices.length);
  node.ending = /^return\b/.test(terminal);
  // A menu at the end whose every choice jumps away doesn't continue either
  const lastMenu = node.menus[node.menus.length - 1];
  const menuLeaves = /^menu\b/.test(lastBase) && lastMenu
    && lastMenu.choices.every(c => c.effects.some(ef => ef.type === 'jump'));
  node.fallsThrough = !terminal && !!lastBase && !menuLeaves;
  return node;
}

// ── Layout ──
// The main line (start and the labels it jumps to, one after another) runs
// left to right. Every other scene hangs under the first column that leads to
// it; a column that also uses a scene placed elsewhere gets a reference card.

function layoutStoryMap(map) {
  const { nodes, edges } = map;
  for (const node of nodes.values()) {
    node.incoming = [];
    node.spine = false;
    node.owner = null;
    node.unreachable = false;
  }
  for (const e of edges) if (!e.hidden) nodes.get(e.to).incoming.push(e.from);
  const outgoing = name => edges.filter(e => e.from === name);

  const columns = [];  // [{ head, cards: [card] }]
  const startColumn = (head) => {
    const col = { head, cards: [] };
    head.spine = true;
    head.owner = head.name;
    columns.push(col);
    return col;
  };

  // Main line: follow jumps (not choices) from start while they reach new labels
  const hasStart = nodes.has('start');
  if (hasStart) {
    let cur = nodes.get('start');
    startColumn(cur);
    for (;;) {
      const e = outgoing(cur.name).find(x => (x.kind === 'jump' || x.kind === 'next') && !x.choice
        && !nodes.get(x.to).spine);
      if (!e) break;
      cur = nodes.get(e.to);
      startColumn(cur);
    }
  }

  // Scenes reached from each column hang under it
  const fillColumn = (col) => {
    const queue = [col.head.name];
    const refs = new Set();
    while (queue.length) {
      for (const e of outgoing(queue.shift())) {
        const target = nodes.get(e.to);
        if (target.spine) continue;
        if (!target.owner) {
          target.owner = col.head.name;
          col.cards.push(target);
          queue.push(target.name);
        } else if (target.owner !== col.head.name && !e.hidden && !refs.has(target.name)) {
          refs.add(target.name);
          col.cards.push({ ref: true, name: target.name, owner: col.head.name });
        }
      }
    }
  };
  columns.forEach(fillColumn);

  // Labels not reached from start start their own columns at the end
  for (;;) {
    const left = [...nodes.values()].filter(n => !n.owner);
    if (!left.length) break;
    const head = left.find(n => !edges.some(e => e.to === n.name && !nodes.get(e.from).owner && e.from !== n.name)) || left[0];
    const col = startColumn(head);
    fillColumn(col);
    if (hasStart) [head, ...col.cards.filter(c => !c.ref)].forEach(n => { n.unreachable = true; });
  }

  // Positions
  map.cards = [];
  let bottom = MAP_PAD_TOP + MAP_NODE_H;
  columns.forEach((col, c) => {
    const x = MAP_PAD + c * (MAP_NODE_W + MAP_COL_GAP);
    Object.assign(col.head, { x, y: MAP_PAD_TOP, h: MAP_NODE_H, col: c });
    map.cards.push(col.head);
    let y = MAP_PAD_TOP + MAP_NODE_H + MAP_STACK_GAP;
    for (const card of col.cards) {
      Object.assign(card, { x: x + MAP_INDENT, y, h: card.ref ? MAP_REF_H : MAP_NODE_H, col: c });
      map.cards.push(card);
      y += card.h + MAP_STACK_GAP;
    }
    bottom = Math.max(bottom, y - MAP_STACK_GAP);
  });
  map.width = MAP_PAD * 2 + Math.max(1, columns.length) * (MAP_NODE_W + MAP_COL_GAP) - MAP_COL_GAP + MAP_INDENT;
  map.height = bottom + MAP_PAD;
}

// Card an edge points to: the scene itself, or the reference card in the
// column the edge starts from when the scene is placed elsewhere
function mapTargetCard(e) {
  const from = storyMap.nodes.get(e.from);
  const to = storyMap.nodes.get(e.to);
  if (to.spine || to.owner === from.owner) return to;
  return storyMap.cards.find(c => c.ref && c.name === e.to && c.owner === from.owner) || to;
}

// ── Drawing ──

// Path and label position of an edge between two cards
function routeMapEdge(a, b) {
  const r = 8;
  const ay = a.y + a.h / 2, by = b.y + b.h / 2;
  // Column head to a card hanging under it: down its left side, then in
  if (a.spine && b.owner === a.name && !b.spine) {
    const bx = a.x + 20;
    return { d: `M${bx},${a.y + a.h} L${bx},${by - r} Q${bx},${by} ${bx + r},${by} L${b.x},${by}`, above: b };
  }
  // Between cards of the same column: around their right side
  if (!a.spine && !b.spine && a.owner === b.owner) {
    const rx = a.x + MAP_NODE_W + 22, s = by > ay ? 1 : -1;
    return {
      d: `M${a.x + MAP_NODE_W},${ay} L${rx - r},${ay} Q${rx},${ay} ${rx},${ay + s * r} L${rx},${by - s * r} Q${rx},${by} ${rx - r},${by} L${b.x + MAP_NODE_W},${by}`,
      above: b
    };
  }
  // Between neighbouring columns of the main line: straight across
  if (a.spine && b.spine && b.col === a.col + 1) {
    const mx = (a.x + MAP_NODE_W + b.x) / 2;
    return { d: `M${a.x + MAP_NODE_W},${ay} C${mx},${ay} ${mx},${by} ${b.x},${by}`, mid: [mx, (ay + by) / 2] };
  }
  // Anything else: an arc over the top of the cards
  const span = Math.abs(b.col - a.col);
  const k = 60 + 12 * Math.min(span, 5);
  const ax = a.x + MAP_NODE_W / 2 + (b.x > a.x ? 30 : -30), bx = b.x + MAP_NODE_W / 2;
  return { d: `M${ax},${a.y} C${ax},${a.y - k} ${bx},${b.y - k} ${bx},${b.y}`, mid: [(ax + bx) / 2, Math.min(a.y, b.y) - k * 0.75] };
}

function renderStoryMap() {
  const inner = document.getElementById('map-inner');
  if (!storyMap.nodes.size) {
    inner.style.width = inner.style.height = '';
    inner.innerHTML = `<div class="map-empty">${t('map_empty')}</div>`;
    renderMapDetails();
    return;
  }
  inner.style.width = storyMap.width + 'px';
  inner.style.height = storyMap.height + 'px';

  const paths = [];
  const labels = [];
  for (const e of storyMap.edges) {
    if (e.hidden) continue;
    const route = routeMapEdge(storyMap.nodes.get(e.from), mapTargetCard(e));
    const active = mapSelected && (e.from === mapSelected || e.to === mapSelected);
    const cls = `map-edge map-edge-${e.kind}${e.choice ? ' map-edge-choice' : ''}${active ? ' active' : ''}`;
    const arrow = active || e.choice ? 'map-arrow-accent' : 'map-arrow';
    paths.push(`<path class="${cls}" d="${route.d}" marker-end="url(#${arrow})"/>`);
    if (e.choice) {
      const text = `<span>${escHtml(truncate(e.choice, 34))}</span>`;
      labels.push(route.above
        ? `<div class="map-edge-label above${active ? ' active' : ''}" style="left:${route.above.x}px;top:${route.above.y - 5}px" title="${escHtml(e.choice)}">${text}</div>`
        : `<div class="map-edge-label${active ? ' active' : ''}" style="left:${route.mid[0]}px;top:${route.mid[1]}px" title="${escHtml(e.choice)}">${text}</div>`);
    }
  }

  inner.innerHTML = `
    <svg class="map-edges" width="${storyMap.width}" height="${storyMap.height}" aria-hidden="true">
      <defs>
        <marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path class="map-arrow-head" d="M0,0 L10,5 L0,10 z"/></marker>
        <marker id="map-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path class="map-arrow-head-accent" d="M0,0 L10,5 L0,10 z"/></marker>
      </defs>
      ${paths.join('')}
    </svg>
    ${labels.join('')}
    ${storyMap.cards.map(c => c.ref ? mapRefHtml(c) : mapNodeHtml(c)).join('')}`;
  renderMapDetails();
}

function mapBadge(node) {
  if (node.missing) return `<span class="map-badge map-badge-missing">${t('map_badge_missing')}</span>`;
  if (node.name === 'start') return `<span class="map-badge map-badge-start">${t('map_badge_start')}</span>`;
  if (node.ending) return `<span class="map-badge map-badge-ending">${t('map_badge_ending')}</span>`;
  if (node.unreachable) return `<span class="map-badge map-badge-unreachable">${t('map_badge_unreachable')}</span>`;
  return '';
}

function mapThumbHtml(node) {
  const path = node.background && findImagePath(node.background);
  return path
    ? `<span class="map-thumb" style="background-image:url('${getImageURL(path)}')"></span>`
    : `<span class="map-thumb map-thumb-empty">${escHtml(node.firstScene || '')}</span>`;
}

function mapCount(n, oneKey, manyKey) {
  return n === 1 ? t(oneKey) : t(manyKey, n);
}

function mapNodeHtml(node) {
  const cls = ['map-node'];
  if (node.name === mapSelected) cls.push('selected');
  if (node.missing) cls.push('missing');
  const facts = [];
  if (node.chars.length) facts.push(mapCount(node.chars.length, 'map_characters_one', 'map_characters'));
  if (node.menus.length) facts.push(`<b>${mapCount(node.menus.length, 'map_decisions_one', 'map_decisions')}</b>`);
  const body = node.missing
    ? `<span class="map-summary">${t('map_missing_desc')}</span>`
    : `${mapThumbHtml(node)}
       <span class="map-summary">${escHtml(truncate(node.summary, 80))}</span>
       <span class="map-foot"><span>${facts.join(' · ')}</span><span>${t('map_lines', node.lines)}</span></span>`;
  return `<button class="${cls.join(' ')}" style="left:${node.x}px;top:${node.y}px;width:${MAP_NODE_W}px;height:${node.h}px"
      onclick="selectMapNode('${node.name}')">
    <span class="map-node-head"><span class="map-node-name">${escHtml(node.name)}</span>${mapBadge(node)}</span>
    ${body}
  </button>`;
}

function mapRefHtml(card) {
  const cls = 'map-node map-ref' + (card.name === mapSelected ? ' selected' : '');
  return `<button class="${cls}" style="left:${card.x}px;top:${card.y}px;width:${MAP_NODE_W}px;height:${card.h}px"
      onclick="selectMapNode('${card.name}', true)" title="${t('map_ref_desc')}">
    <span class="map-node-head"><span class="map-node-name">↪ ${escHtml(card.name)}</span></span>
    <span class="map-summary">${t('map_ref_desc')}</span>
  </button>`;
}

function mapLinkList(names) {
  if (!names.length) return `<div class="map-none">${t('map_none')}</div>`;
  return [...new Set(names)].map(n =>
    `<button class="map-link" onclick="selectMapNode('${n}', true)">${escHtml(n)}</button>`).join('');
}

function mapEffectHtml(ef) {
  if (ef.type === 'set') return `<li class="map-effect-set">${escHtml(ef.text)}</li>`;
  const link = `<button class="map-inline-link" onclick="selectMapNode('${ef.to}', true)">${escHtml(ef.to)}</button>`;
  return `<li>${t(ef.type === 'jump' ? 'map_effect_jump' : 'map_effect_call', link)}</li>`;
}

function mapDecisionsHtml(node) {
  return node.menus.map((mn, i) => `
    <div class="map-decision">
      <div class="map-decision-title">${t('map_decision_n', i + 1)}</div>
      ${mn.choices.map(c => `
        <div class="map-option">
          <div class="map-option-text">${escHtml(c.text)}</div>
          ${c.cond ? `<div class="map-option-cond">${t('map_option_if', escHtml(c.cond))}</div>` : ''}
          <ul class="map-effects">${c.effects.length ? c.effects.map(mapEffectHtml).join('') : `<li class="map-effect-stay">${t('map_effect_stay')}</li>`}</ul>
        </div>`).join('')}
    </div>`).join('');
}

function renderMapDetails() {
  const box = document.getElementById('map-details');
  const node = mapSelected && storyMap.nodes.get(mapSelected);
  if (!node) { box.innerHTML = `<div class="map-hint">${t('map_select_hint')}</div>`; return; }
  const leadsTo = storyMap.edges.filter(e => e.from === node.name && !e.hidden).map(e => e.to);
  const preview = node.background && findImagePath(node.background);
  const chars = node.chars.map(id => {
    const chr = data.characters.find(c => c.id === id);
    return chr ? chr.displayName : id;
  });
  box.innerHTML = `
    <div class="map-details-head">
      <span class="map-details-name">${escHtml(node.name)}</span>${mapBadge(node)}
    </div>
    ${node.missing ? `<p class="map-hint">${t('map_missing_desc')}</p>` : `
      ${preview ? `<img class="map-details-thumb" src="${getImageURL(preview)}" alt="">` : ''}
      ${node.summary ? `<p class="map-details-summary">${escHtml(node.summary)}</p>` : ''}
      <button class="btn btn-primary map-open-btn" onclick="openMapLabel('${node.name}')">${t('map_open')}</button>
      <dl class="map-facts">
        <dt>${t('map_file')}</dt><dd>${escHtml(node.file)}</dd>
        <dt>${t('map_size')}</dt><dd>${t('map_lines', node.lines)}</dd>
        ${chars.length ? `<dt>${t('map_section_characters')}</dt><dd>${escHtml(chars.join(', '))}</dd>` : ''}
      </dl>
      ${node.menus.length ? `<div class="map-section-title">${t('map_section_decisions')}</div>${mapDecisionsHtml(node)}` : ''}`}
    <div class="map-section-title">${t('map_leads_to')}</div>
    ${mapLinkList(leadsTo)}
    <div class="map-section-title">${t('map_comes_from')}</div>
    ${mapLinkList(node.incoming || [])}`;
}

function selectMapNode(name, scrollTo) {
  mapSelected = name;
  renderStoryMap();
  if (scrollTo) {
    const node = storyMap.nodes.get(name);
    const canvas = document.getElementById('map-canvas');
    mapPan.x = canvas.clientWidth / 2 - (node.x + MAP_NODE_W / 2) * mapZoom;
    mapPan.y = canvas.clientHeight / 2 - (node.y + node.h / 2) * mapZoom;
    applyMapTransform();
  }
}

// Loads the label's blocks into the editor, switching file if needed
async function openMapLabel(name) {
  const node = storyMap && storyMap.nodes.get(name);
  if (!node || node.missing) return;
  closeStoryMap();
  if (node.file !== activeRpyFile) {
    await selectRpyFile(node.file);
    if (activeRpyFile !== node.file) return;  // the user cancelled
  }
  const sel = document.getElementById('target-label');
  sel.value = name;
  await onTargetLabelChange();
}

// ── Zoom and panning ──

let mapPan = { x: 0, y: 0 };  // position of the map inside the canvas, in px

function applyMapTransform() {
  document.getElementById('map-inner').style.transform =
    `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`;
  // The dotted background moves and scales with the map
  const canvas = document.getElementById('map-canvas');
  canvas.style.backgroundSize = `${22 * mapZoom}px ${22 * mapZoom}px`;
  canvas.style.backgroundPosition = `${mapPan.x}px ${mapPan.y}px`;
  document.getElementById('map-zoom-value').textContent = Math.round(mapZoom * 100) + '%';
}

// Zooms keeping the point under (ax, ay) still; by default the canvas center
function setMapZoom(z, ax, ay) {
  const canvas = document.getElementById('map-canvas');
  if (ax === undefined) { ax = canvas.clientWidth / 2; ay = canvas.clientHeight / 2; }
  const newZoom = Math.min(2.5, Math.max(0.15, z));
  mapPan.x = ax - (ax - mapPan.x) * newZoom / mapZoom;
  mapPan.y = ay - (ay - mapPan.y) * newZoom / mapZoom;
  mapZoom = newZoom;
  applyMapTransform();
}

function fitStoryMap() {
  const canvas = document.getElementById('map-canvas');
  if (!storyMap || !storyMap.width) return;
  mapZoom = Math.min(1, Math.max(0.15, Math.min(
    (canvas.clientWidth - 40) / storyMap.width, (canvas.clientHeight - 40) / storyMap.height)));
  mapPan.x = (canvas.clientWidth - storyMap.width * mapZoom) / 2;
  mapPan.y = (canvas.clientHeight - storyMap.height * mapZoom) / 2;
  applyMapTransform();
}

(function () {
  const canvas = document.getElementById('map-canvas');

  // Mouse wheel zooms towards the cursor
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    setMapZoom(mapZoom * Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  // Dragging anywhere moves the map; a drag over a card doesn't select it
  let drag = null;
  let suppressClick = false;
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, panX: mapPan.x, panY: mapPan.y, moved: false };
  });
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    canvas.classList.add('panning');
    mapPan.x = drag.panX + dx;
    mapPan.y = drag.panY + dy;
    applyMapTransform();
  });
  document.addEventListener('mouseup', () => {
    if (drag && drag.moved) suppressClick = true;
    drag = null;
    canvas.classList.remove('panning');
  });
  canvas.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('map-overlay').classList.contains('open')) closeStoryMap();
  });
})();
