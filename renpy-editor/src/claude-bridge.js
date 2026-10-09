// ═══════════════════════════════════════════════════════════════════
// CONNECTION WITH CLAUDE — answers the questions Claude asks through
// the MCP server, using the editor's own parsers and project data
// ═══════════════════════════════════════════════════════════════════

// Labels Ren'Py runs by itself, so nothing needs to jump to them
const RENPY_ENTRY_LABELS = ['start', 'splashscreen', 'before_main_menu', 'main_menu', 'after_load', 'after_warp', 'quit'];

const claudeTools = {
  async get_project_overview() {
    const files = [];
    for (const file of await window.api.listRpyFiles()) {
      const text = await window.api.readFile(file) || '';
      const labels = [...text.matchAll(/^label\s+(\w+)/gm)].map(m => m[1]);
      files.push({ file, lines: text.split('\n').length, labels });
    }
    return {
      resolution: data.resolution,
      hasStartLabel: files.some(f => f.labels.includes('start')),
      fileOpenInEditor: activeRpyFile,
      files,
      counts: {
        characters: data.characters.length,
        backgrounds: data.backgrounds.length,
        sceneImages: data.scenes.length,
        audioFiles: data.audioFiles.length
      }
    };
  },

  async get_story_map() {
    const map = await buildStoryMap();
    const scenes = [...map.nodes.values()].map(n => n.missing
      ? { name: n.name, missing: true }
      : {
        name: n.name, file: n.file, lines: n.lines, summary: n.summary || '',
        background: n.background || n.firstScene || '', characters: n.chars,
        decisions: n.menus.map(mn => mn.choices.map(c => ({ text: c.text, condition: c.cond || undefined, effects: c.effects }))),
        ending: n.ending
      });
    const links = map.edges.map(e => ({
      from: e.from, to: e.to,
      kind: e.kind === 'next' ? 'falls through' : e.kind,
      choice: e.choice || undefined, condition: e.cond || undefined
    }));
    return { scenes, links };
  },

  // The whole cast in short; every sprite and expression file of one character on request
  // The whole cast in short; every sprite and expression file of one character on request
  list_characters({ name }) {
    const exprsOf = c => data.expressions.filter(x => x.charId === c.id || x.charId === c.imageAttr);
    if (name) {
      const c = data.characters.find(x => x.id === name || x.displayName === name);
      if (!c) throw new Error(`There is no character "${name}" in characters.rpy.`);
      return {
        variable: c.id, name: c.displayName, color: c.color || undefined, imageTag: c.imageAttr || undefined,
        sprites: c.images, expressions: exprsOf(c).map(x => ({ key: x.key, path: x.path }))
      };
    }
    return data.characters.map(c => ({
      variable: c.id, name: c.displayName, color: c.color || undefined, imageTag: c.imageAttr || undefined,
      sprites: c.images.length, expressions: exprsOf(c).length
    }));
  },

  list_assets() {
    return {
      backgrounds: data.backgrounds, sceneImages: data.scenes,
      transforms: data.animations, positions: data.positions, audioFiles: data.audioFiles
    };
  },

  async get_variables() {
    return (await buildStoryMap()).vars;
  },

  // Problems in the story flow; the main process adds the image and audio checks
  async check_project() {
    const map = await buildStoryMap();
    const missingLabels = [...map.nodes.values()].filter(n => n.missing).map(n => ({
      label: n.name, usedBy: [...new Set(map.edges.filter(e => e.to === n.name).map(e => e.from))]
    }));
    const reached = new Set(map.edges.map(e => e.to));
    const unreachedScenes = [...map.nodes.values()]
      .filter(n => !n.missing && !reached.has(n.name) && !RENPY_ENTRY_LABELS.includes(n.name))
      .map(n => ({ label: n.name, file: n.file }));
    return { missingLabels, unreachedScenes };
  }
};

window.api.onMcpCall(async (tool, args) => {
  const fn = claudeTools[tool];
  if (!fn) throw new Error(`Unknown tool: ${tool}`);
  if (!gamePath) throw new Error('No project is open in Ren\'Py EDITOR.');
  return fn(args || {});
});

// ── Settings panel: turn the connection on and off ──
let claudeStatus = null;

async function initClaudeSettings() {
  claudeStatus = await window.api.claudeGetStatus();
  renderClaudeSettings();
}

function claudeAddCommand(s) {
  return `claude mcp add --transport http --scope user renpy-editor ${s.url} --header "Authorization: Bearer ${s.token}"`;
}

function renderClaudeSettings() {
  const s = claudeStatus;
  if (!s) return;
  document.getElementById('claude-enabled').checked = s.enabled;
  document.getElementById('claude-details').hidden = !s.enabled;
  const state = document.getElementById('claude-state');
  state.className = 'claude-state';
  if (s.error) {
    state.classList.add('error');
    state.textContent = s.error === 'port-in-use' ? t('claude_port_in_use', s.port) : t('claude_error', s.error);
  } else if (s.running && s.client) {
    state.classList.add('connected');
    state.textContent = s.calls ? t('claude_connected_calls', s.client, s.calls) : t('claude_connected', s.client);
  } else if (s.running) {
    state.classList.add('on');
    state.textContent = t('claude_waiting');
  } else {
    state.textContent = t('claude_off');
  }
  document.getElementById('claude-port').value = s.port;
  document.getElementById('claude-command').textContent = s.token ? claudeAddCommand(s) : '';
}

async function setClaudeEnabled(on) {
  claudeStatus = await window.api.claudeSetEnabled(on);
  renderClaudeSettings();
}

async function setClaudePort(port) {
  claudeStatus = await window.api.claudeSetPort(port);
  renderClaudeSettings();
}

async function copyClaudeCommand() {
  if (!claudeStatus || !claudeStatus.token) return;
  await navigator.clipboard.writeText(claudeAddCommand(claudeStatus));
  notify(t('claude_command_copied'), 'ok');
}

async function newClaudeToken() {
  const ok = await showDialog({
    title: t('claude_new_key'), message: t('claude_new_key_confirm'),
    buttons: [t('cancel'), t('claude_new_key')], defaultId: 1, cancelId: 0
  });
  if (ok !== 1) return;
  claudeStatus = await window.api.claudeNewToken();
  renderClaudeSettings();
}

window.api.onClaudeStatus(s => { claudeStatus = s; renderClaudeSettings(); });
