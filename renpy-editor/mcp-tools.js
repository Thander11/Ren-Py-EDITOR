// ═════════════════════════════════════════════════════════════════════
// Tools offered to Claude through the MCP server. File-based tools run
// here; the ones that need the editor's parsers (story map, characters…)
// are answered by the editor window through askRenderer().
// ═════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const INSTRUCTIONS = `This server is Ren'Py EDITOR, a visual editor for Ren'Py visual novels that the user has open on their computer.
Use these tools to understand the user's novel: its scenes (Ren'Py labels), the jumps, calls and decisions between them, characters, images, audio, story variables and GUI settings.
Start with get_project_overview, then get_story_map to see how the story flows, and read_label to read the code of a scene.
Ren'Py terms such as label, jump, call, menu, scene, show and define keep their code names.
For now the tools only read the project: they never change the user's files.`;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

function buildMcpTools({ getGamePath, askRenderer, readGameInfo }) {
  function gamePathOrThrow() {
    const gp = getGamePath();
    if (!gp || !fs.existsSync(gp)) throw new Error('No project is open in Ren\'Py EDITOR. Ask the user to open their novel first.');
    return gp;
  }

  // .rpy files of game/, as the editor lists them (first level)
  function rpyFiles(gp) {
    return fs.readdirSync(gp).filter(f => f.endsWith('.rpy')).sort();
  }

  function resolveRpy(gp, file) {
    const base = path.resolve(gp);
    const resolved = path.resolve(base, String(file || ''));
    if (!resolved.startsWith(base + path.sep) || !resolved.endsWith('.rpy')) {
      throw new Error(`"${file}" is not a .rpy file of the project's game/ folder.`);
    }
    if (!fs.existsSync(resolved)) throw new Error(`The file "${file}" does not exist.`);
    return resolved;
  }

  const numbered = (lines, first) => lines.map((l, i) => `${String(first + i).padStart(5)}  ${l}`).join('\n');

  const fromEditor = (name) => (args) => { gamePathOrThrow(); return askRenderer(name, args); };

  return [
    {
      name: 'get_project_overview',
      title: 'Project overview',
      description: 'Name, version, resolution and folder of the open Ren\'Py project, its .rpy files with the labels each one defines, and how many characters, images and audio files it has.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: async () => {
        const gp = gamePathOrThrow();
        const info = readGameInfo();
        const overview = await askRenderer('get_project_overview', {});
        return { name: info.name, version: info.version, buildName: info.buildName, gameFolder: gp, ...overview };
      }
    },
    {
      name: 'get_story_map',
      title: 'Story map',
      description: 'How the story flows: every scene (label) with its file, a short summary, the characters in it, its decisions (menu choices with their conditions, variable changes and jumps) and whether it is an ending; plus every jump, call and fall-through between scenes. Helper labels with parameters are left out, like in the editor\'s map.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: fromEditor('get_story_map')
    },
    {
      name: 'read_label',
      title: 'Read a label',
      description: 'Ren\'Py code of one label (scene), with its file and line numbers.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Label name, e.g. "start"' } },
        required: ['name']
      },
      annotations: READ_ONLY,
      handler: ({ name }) => {
        const gp = gamePathOrThrow();
        const start = new RegExp(`^label\\s+${String(name).replace(/\W/g, '')}\\s*(\\(|:)`);
        for (const file of rpyFiles(gp)) {
          const lines = fs.readFileSync(path.join(gp, file), 'utf-8').split(/\r?\n/);
          const first = lines.findIndex(l => start.test(l));
          if (first < 0) continue;
          // The label ends at the next statement written at the start of a line
          let end = first + 1;
          while (end < lines.length && (!lines[end].trim() || /^\s/.test(lines[end]) || lines[end].startsWith('#'))) end++;
          while (end > first + 1 && !lines[end - 1].trim()) end--;
          return `${file}, lines ${first + 1}-${end}:\n${numbered(lines.slice(first, end), first + 1)}`;
        }
        throw new Error(`There is no label "${name}" in the project.`);
      }
    },
    {
      name: 'read_script_file',
      title: 'Read a .rpy file',
      description: 'Contents of a .rpy file of the game/ folder with line numbers. Long files can be read in parts with start_line and end_line.',
      inputSchema: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Path relative to game/, e.g. "script.rpy"' },
          start_line: { type: 'integer', minimum: 1 },
          end_line: { type: 'integer', minimum: 1 }
        },
        required: ['file']
      },
      annotations: READ_ONLY,
      handler: ({ file, start_line, end_line }) => {
        const gp = gamePathOrThrow();
        const lines = fs.readFileSync(resolveRpy(gp, file), 'utf-8').split(/\r?\n/);
        const from = Math.max(1, start_line || 1);
        const to = Math.min(lines.length, end_line || from + 1999);
        const more = to < lines.length ? `\n… ${lines.length - to} more lines (use start_line ${to + 1}).` : '';
        return `${file}, lines ${from}-${to} of ${lines.length}:\n${numbered(lines.slice(from - 1, to), from)}${more}`;
      }
    },
    {
      name: 'list_characters',
      title: 'Characters',
      description: 'Characters defined in the project: Ren\'Py variable, displayed name, name color and how many sprites and side-image expressions each one has. Pass name to get every sprite and expression image of one character.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Ren\'Py variable or displayed name of one character' } }
      },
      annotations: READ_ONLY,
      handler: fromEditor('list_characters')
    },
    {
      name: 'list_assets',
      title: 'Images and audio',
      description: 'Backgrounds and scene images declared in the project, transforms (animations), positions, and audio files in game/audio/.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: fromEditor('list_assets')
    },
    {
      name: 'get_variables',
      title: 'Story variables',
      description: 'Story variables: their default value, the scenes and choices where they change, and the conditions that check them.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: fromEditor('get_variables')
    },
    {
      name: 'get_gui_settings',
      title: 'GUI settings',
      description: 'Every "define gui.*" of gui.rpy (colors, fonts, sizes, positions of the dialogue box, names and choice buttons) and the game options of options.rpy (name, version, text speed).',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: () => {
        const gp = gamePathOrThrow();
        const read = f => { try { return fs.readFileSync(path.join(gp, f), 'utf-8'); } catch (e) { return ''; } };
        const gui = read('gui.rpy');
        const defines = {};
        for (const m of gui.matchAll(/^[ \t]*define[ \t]+(gui\.\w+)[ \t]*=[ \t]*((?:"[^"\n]*"|'[^'\n]*'|[^\n#'"])*?)[ \t]*(?:#.*)?$/gm)) {
          defines[m[1]] = m[2].trim();
        }
        const res = /gui\.init\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(gui);
        const options = read('options.rpy');
        const cps = /^\s*default\s+preferences\.text_cps\s*=\s*(\d+)/m.exec(options);
        return {
          resolution: res ? { width: +res[1], height: +res[2] } : null,
          game: { ...readGameInfo(), textSpeedCps: cps ? +cps[1] : null },
          guiDefines: defines
        };
      }
    },
    {
      name: 'check_project',
      title: 'Check the project',
      description: 'Looks for common problems: jumps or calls to labels that don\'t exist, images shown but never declared or whose file is missing, audio files that are played but missing, and scenes no other scene leads to.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
      handler: async (args) => {
        const gp = gamePathOrThrow();
        const flow = await askRenderer('check_project', args);
        return { ...flow, ...checkAssets(gp) };
      }
    }
  ];
}

// Every file under dir, as paths relative to dir with forward slashes
function walk(dir, base = dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const SHOW_KEYWORDS = /\s+(?:at|with|behind|as|onlayer|zorder)\b.*$|\s*:$/;

// Images and audio the script uses but the project doesn't have
function checkAssets(gp) {
  const files = walk(gp).filter(f => !f.startsWith('tl/') && !f.startsWith('gui/editor_backup/'));
  const fileSet = new Set(files.map(f => f.toLowerCase()));
  const exists = (rel, folder) => fileSet.has(rel.toLowerCase()) || fileSet.has(`${folder}/${rel}`.toLowerCase());

  // Images: declared with "image", plus the ones Ren'Py defines from the files in images/
  const images = new Set(['black']);
  for (const f of files) {
    if (f.startsWith('images/') && IMAGE_EXT.test(f)) images.add(path.basename(f).replace(/\.[^.]+$/, '').toLowerCase());
  }
  const scripts = files.filter(f => f.endsWith('.rpy')).map(f => ({ file: f, lines: fs.readFileSync(path.join(gp, f), 'utf-8').split(/\r?\n/) }));
  const missingImageFiles = [];
  const audioNames = new Set();
  for (const { file, lines } of scripts) {
    lines.forEach((line, i) => {
      let m = /^\s*image\s+([\w ]+?)\s*(?:=\s*(.*)|:)\s*$/.exec(line);
      if (m) {
        images.add(m[1].trim().replace(/\s+/g, ' ').toLowerCase());
        const str = m[2] && /^"([^"]+)"$/.exec(m[2].trim());
        if (str && IMAGE_EXT.test(str[1]) && !exists(str[1], 'images')) {
          missingImageFiles.push({ image: m[1].trim(), file: str[1], declaredIn: `${file}:${i + 1}` });
        }
      }
      if ((m = /^\s*define\s+audio\.(\w+)\s*=/.exec(line))) audioNames.add(m[1]);
    });
  }
  const declared = [...images].map(n => n.split(' '));
  const knownImage = (name) => {
    const words = name.toLowerCase().split(' ');
    // Ren'Py also finds "eileen happy" when the shown words are part of a longer image name
    return declared.some(d => d[0] === words[0] && words.every(w => d.includes(w)));
  };

  const undeclaredImages = [];
  const missingAudio = [];
  for (const { file, lines } of scripts) {
    lines.forEach((line, i) => {
      const where = `${file}:${i + 1}`;
      let m = /^\s*(scene|show)\s+(.+)$/.exec(line);
      if (m && !/^(screen|expression|text|layer)\b/.test(m[2])) {
        const quoted = /^"([^"]+)"/.exec(m[2]);
        if (quoted) {
          if (!exists(quoted[1], 'images')) undeclaredImages.push({ image: quoted[1], usedIn: where });
        } else {
          const name = m[2].replace(SHOW_KEYWORDS, '').trim().replace(/\s+/g, ' ');
          if (name && /^[\w ]+$/.test(name) && !knownImage(name)) undeclaredImages.push({ image: name, usedIn: where });
        }
      }
      if ((m = /^\s*(?:play|queue)\s+\w+\s+(.+)$/.exec(line))) {
        for (const q of m[1].matchAll(/"([^"]+)"/g)) {
          const rel = q[1].replace(/^<[^>]*>/, '');
          if (!exists(rel, 'audio')) missingAudio.push({ file: rel, usedIn: where });
        }
        const bare = /^(?:audio\.)?(\w+)\b(?!\.)/.exec(m[1]);
        if (bare && !/^"/.test(m[1]) && !audioNames.has(bare[1])) {
          // Ren'Py also names audio files of game/audio/ after their file name
          const auto = files.some(f => f.startsWith('audio/') && path.basename(f).replace(/\.[^.]+$/, '').toLowerCase() === bare[1].toLowerCase());
          if (!auto) missingAudio.push({ name: bare[1], usedIn: where });
        }
      }
    });
  }
  return { undeclaredImages, missingImageFiles, missingAudio };
}

module.exports = { buildMcpTools, INSTRUCTIONS };
