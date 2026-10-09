// ═════════════════════════════════════════════════════════════════════
// Tools offered to Claude through the MCP server. File-based tools run
// here; the ones that need the editor's parsers (story map, characters…)
// are answered by the editor window through askRenderer().
// ═════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const os = require('os');

const INSTRUCTIONS = `This server is Ren'Py EDITOR, a visual editor for Ren'Py visual novels that the user has open on their computer.
Use these tools to understand the user's novel: its scenes (Ren'Py labels), the jumps, calls and decisions between them, characters, images, audio, story variables and GUI settings.
Start with get_project_overview, then get_story_map to see how the story flows, and read_label to read the code of a scene.
Ren'Py terms such as label, jump, call, menu, scene, show and define keep their code names.
You can also change the novel: write_label for whole scenes, edit_script for small changes, and tools to add characters, images, variables and GUI settings. Read the code before changing it and keep Ren'Py's indentation (4 spaces, never tabs).
Before every change the editor backs up the files it touches and logs it; the user can undo any change from the app, and so can you with undo_change. Tell the user briefly what you changed.`;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

function buildMcpTools({ getGamePath, askRenderer, readGameInfo, changes, saveGameInfo }) {
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

  // Where a label is: its file, the file split in lines (with and without
  // their line breaks) and the label's first line and end (exclusive)
  function findLabel(gp, name) {
    const start = new RegExp(`^label\\s+${String(name).replace(/\W/g, '')}\\s*(\\(|:)`);
    for (const file of rpyFiles(gp)) {
      const raw = fs.readFileSync(path.join(gp, file), 'utf-8');
      const parts = splitLines(raw);
      const lines = parts.map(p => p.replace(/\r?\n$/, ''));
      const first = lines.findIndex(l => start.test(l.replace(/^﻿/, '')));
      if (first < 0) continue;
      // The label ends at the next statement written at the start of a line;
      // blank lines and comments right before it belong to what comes next
      let end = first + 1;
      while (end < lines.length && (!lines[end].trim() || /^\s/.test(lines[end]) || lines[end].startsWith('#'))) end++;
      while (end > first + 1 && (!lines[end - 1].trim() || lines[end - 1].startsWith('#'))) end--;
      return { file, raw, parts, lines, first, end };
    }
    return null;
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
        const found = findLabel(gamePathOrThrow(), name);
        if (!found) throw new Error(`There is no label "${name}" in the project.`);
        const { file, lines, first, end } = found;
        return `${file}, lines ${first + 1}-${end}:\n${numbered(lines.slice(first, end), first + 1)}`;
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
    },
    ...buildWriteTools({ gamePathOrThrow, rpyFiles, resolveRpy, findLabel, changes, saveGameInfo })
  ];
}

// ── Text files keep their line breaks (CRLF/LF) and BOM ──

// Lines with their line break, so the untouched ones are written back as they were
const splitLines = (raw) => raw.match(/[^\n]*\n|[^\n]+$/g) || [];
const eolOf = (raw) => raw.includes('\r\n') ? '\r\n' : '\n';
const withEol = (s, eol) => s.replace(/\r?\n/g, eol);
const readText = (fp) => fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
const pyStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ') + '"';
const IDENT = /^[A-Za-z_]\w*$/;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

// Appends text at the end of a file, after one blank line
function appendBlock(raw, block, eol) {
  const body = raw.replace(/\s+$/, '');
  return (body ? body + eol + eol : '') + withEol(block, eol) + eol;
}

// "define name = …" or "default name = …" already somewhere in the project
function definedIn(gp, files, kind, name) {
  const re = new RegExp(`^[ \\t]*${kind}[ \\t]+${name.replace(/\./g, '\\.')}[ \\t]*=`, 'm');
  return files.find(f => re.test(readText(path.join(gp, f))));
}

function buildWriteTools({ gamePathOrThrow, rpyFiles, resolveRpy, findLabel, changes, saveGameInfo }) {
  // One change at a time, so two requests never write the same file at once
  let queue = Promise.resolve();
  const serial = (fn) => (args) => {
    const run = queue.then(() => fn(args || {}));
    queue = run.catch(() => {});
    return run;
  };
  const done = (entry, text) => `${text}\nChange ${entry.id} — the user can undo it from Ren'Py EDITOR (Settings › Connection with Claude › Changes).`;

  // New .rpy files go in game/ itself, where the editor finds them
  function rpyTarget(gp, file) {
    const name = String(file || 'script.rpy');
    if (!/^[\w\- ]+\.rpy$/.test(name)) throw new Error(`"${name}" is not a valid file name: use something like "chapter2.rpy", directly inside game/.`);
    return { rel: name, fp: path.join(gp, name) };
  }

  return [
    {
      name: 'write_label',
      title: 'Write a label',
      description: 'Creates a label or replaces the whole code of an existing one. code is the complete label, starting with its "label name:" line, with every other line indented with spaces (4 per level, never tabs). Read the label first with read_label when it exists. A new label goes at the end of file (default script.rpy; a new file is created if needed).',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Label name' },
          code: { type: 'string', description: 'Complete Ren\'Py code of the label' },
          file: { type: 'string', description: 'For a new label: .rpy file inside game/ (default script.rpy)' }
        },
        required: ['name', 'code']
      },
      annotations: { ...WRITE, destructiveHint: true },
      handler: serial(async ({ name, code, file }) => {
        const gp = gamePathOrThrow();
        if (!IDENT.test(name || '')) throw new Error(`"${name}" is not a valid label name.`);
        const lines = String(code || '').replace(/\s+$/, '').split(/\r?\n/);
        if (!new RegExp(`^label\\s+${name}\\s*(\\([^)]*\\))?\\s*:`).test(lines[0] || '')) {
          throw new Error(`code must start with "label ${name}:".`);
        }
        const bad = lines.slice(1).findIndex(l => l.trim() && !/^ +\S/.test(l));
        if (bad >= 0) throw new Error(`Line ${bad + 2} of code is not indented with spaces; inside a label every line needs indentation (tabs are not allowed in Ren'Py).`);

        const found = findLabel(gp, name);
        if (found && file && found.file !== file) throw new Error(`The label "${name}" already exists in ${found.file}.`);
        if (found) {
          const fp = path.join(gp, found.file);
          const eol = eolOf(found.raw);
          const entry = await changes.record({ tool: 'write_label', target: name }, [found.file], () => {
            const text = found.parts.slice(0, found.first).join('') + withEol(lines.join('\n'), eol)
              + (found.end < found.parts.length || /\n$/.test(found.raw) ? eol : '') + found.parts.slice(found.end).join('');
            fs.writeFileSync(fp, text, 'utf-8');
          });
          return done(entry, `Label "${name}" replaced in ${found.file} (${lines.length} lines).`);
        }
        const { rel, fp } = rpyTarget(gp, file);
        const raw = readText(fp);
        const entry = await changes.record({ tool: 'create_label', target: name }, [rel], () => {
          fs.writeFileSync(fp, appendBlock(raw, lines.join('\n'), raw ? eolOf(raw) : os.EOL), 'utf-8');
        });
        return done(entry, `Label "${name}" created at the end of ${rel}.`);
      })
    },
    {
      name: 'edit_script',
      title: 'Edit a .rpy file',
      description: 'Replaces an exact piece of text of a .rpy file with new text, for small changes: a line of dialogue, a choice, a jump, a definition. old_text must appear exactly once (copy it from read_label or read_script_file without the line numbers, keeping its indentation) unless replace_all is true.',
      inputSchema: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Path relative to game/, e.g. "script.rpy"' },
          old_text: { type: 'string' },
          new_text: { type: 'string' },
          replace_all: { type: 'boolean', description: 'Replace every occurrence' }
        },
        required: ['file', 'old_text', 'new_text']
      },
      annotations: { ...WRITE, destructiveHint: true },
      handler: serial(async ({ file, old_text, new_text, replace_all }) => {
        const gp = gamePathOrThrow();
        const fp = resolveRpy(gp, file);
        if (!old_text) throw new Error('old_text is empty.');
        const raw = readText(fp);
        const eol = eolOf(raw);
        // The same text matches whatever line breaks the file uses
        const pattern = old_text.replace(/\r\n/g, '\n').split('\n')
          .map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\r?\\n');
        const count = (raw.match(new RegExp(pattern, 'g')) || []).length;
        if (!count) throw new Error(`old_text was not found in ${file}. Read the file again: it may have changed.`);
        if (count > 1 && !replace_all) throw new Error(`old_text appears ${count} times in ${file}. Include more surrounding lines so it is unique, or set replace_all.`);
        const rel = path.relative(gp, fp);
        const entry = await changes.record({ tool: 'edit_script', target: rel.split(path.sep).join('/') }, [rel], () => {
          const text = raw.replace(new RegExp(pattern, replace_all ? 'g' : ''), () => withEol(new_text, eol));
          fs.writeFileSync(fp, text, 'utf-8');
        });
        return done(entry, `${file}: ${count > 1 ? `${count} occurrences` : '1 occurrence'} replaced.`);
      })
    },
    {
      name: 'add_character',
      title: 'Add a character',
      description: 'Defines a new character in characters.rpy: define variable = Character("Name", color=..., image=...). Use the variable in dialogue lines: variable "Text".',
      inputSchema: {
        type: 'object',
        properties: {
          variable: { type: 'string', description: 'Ren\'Py variable used in the script, e.g. "cory"' },
          name: { type: 'string', description: 'Name shown in the game' },
          color: { type: 'string', description: 'Name color, e.g. "#ff9900"' },
          image: { type: 'string', description: 'Image tag of the character\'s sprites and side images' }
        },
        required: ['variable', 'name']
      },
      annotations: WRITE,
      handler: serial(async ({ variable, name, color, image }) => {
        const gp = gamePathOrThrow();
        if (!IDENT.test(variable || '')) throw new Error(`"${variable}" is not a valid Ren'Py variable name.`);
        if (color && !/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)) throw new Error(`"${color}" is not a color like "#ff9900".`);
        if (image && !/^[\w ]+$/.test(image)) throw new Error(`"${image}" is not a valid image tag.`);
        const where = definedIn(gp, rpyFiles(gp), 'define', variable);
        if (where) throw new Error(`"${variable}" is already defined in ${where}.`);
        const args = [pyStr(name), color && `color="${color}"`, image && `image = "${image}"`].filter(Boolean).join(', ');
        const fp = path.join(gp, 'characters.rpy');
        const raw = readText(fp);
        const entry = await changes.record({ tool: 'add_character', target: name }, ['characters.rpy'], () => {
          fs.writeFileSync(fp, appendBlock(raw || '# Characters', `define ${variable} = Character(${args})`, raw ? eolOf(raw) : os.EOL), 'utf-8');
        });
        return done(entry, `Character "${name}" added to characters.rpy as ${variable}.`);
      })
    },
    {
      name: 'add_image',
      title: 'Add a background or scene image',
      description: 'Declares a background (backgrounds.rpy, file in images/backgrounds/) or a scene illustration (scenes.rpy, file in images/scenes/) so it can be used with "scene name". Give source_file to copy an image from the user\'s computer into the project, or path for an image already inside game/images/.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Image name used in the script, one word, e.g. "bg_beach"' },
          kind: { type: 'string', enum: ['background', 'scene'] },
          source_file: { type: 'string', description: 'Absolute path of an image file on the user\'s computer to copy into the project' },
          path: { type: 'string', description: 'Path relative to game/images/ of an image already in the project' }
        },
        required: ['name', 'kind']
      },
      annotations: WRITE,
      handler: serial(async ({ name, kind, source_file, path: imgPath }) => {
        const gp = gamePathOrThrow();
        if (!IDENT.test(name || '')) throw new Error(`"${name}" is not a valid image name: use one word with letters, numbers and _.`);
        const folder = { background: 'backgrounds', scene: 'scenes' }[kind];
        if (!folder) throw new Error('kind must be "background" or "scene".');
        const existing = rpyFiles(gp).find(f => new RegExp(`^[ \\t]*image[ \\t]+${name}[ \\t]*[=:]`, 'm').test(readText(path.join(gp, f))));
        if (existing) throw new Error(`The image "${name}" is already declared in ${existing}.`);
        const touched = [`${folder}.rpy`];
        let rel = imgPath && imgPath.replace(/\\/g, '/').replace(/^images\//, '');
        let copyTo = null;
        if (source_file) {
          if (!path.isAbsolute(source_file) || !fs.existsSync(source_file)) throw new Error(`source_file "${source_file}" does not exist.`);
          if (!/\.(png|jpe?g|webp|avif|bmp|gif)$/i.test(source_file)) throw new Error('source_file must be an image (png, jpg, webp, avif, bmp or gif).');
          rel = `${folder}/${path.basename(source_file)}`;
          copyTo = path.join(gp, 'images', folder, path.basename(source_file));
          if (fs.existsSync(copyTo) && !fs.readFileSync(copyTo).equals(fs.readFileSync(source_file))) {
            throw new Error(`There is already a different images/${rel}. Rename the file first.`);
          }
          if (!fs.existsSync(copyTo)) touched.push(`images/${rel}`);
          else copyTo = null;
        } else if (!rel || !fs.existsSync(path.join(gp, 'images', rel))) {
          throw new Error(`Give source_file, or a path of an image that exists in game/images/${rel ? ` ("${rel}" doesn't)` : ''}.`);
        }
        const fp = path.join(gp, `${folder}.rpy`);
        const raw = readText(fp);
        const entry = await changes.record({ tool: 'add_image', target: name }, touched, () => {
          if (copyTo) {
            fs.mkdirSync(path.dirname(copyTo), { recursive: true });
            fs.copyFileSync(source_file, copyTo);
          }
          const header = kind === 'background' ? '# Backgrounds' : '# Scenes';
          const body = (raw || header).replace(/\s+$/, '');
          const eol = raw ? eolOf(raw) : os.EOL;
          // Declarations of images go one per line, without blank lines between them
          fs.writeFileSync(fp, body + eol + `image ${name} = ${pyStr(rel)}` + eol, 'utf-8');
        });
        return done(entry, `Image "${name}" declared in ${folder}.rpy (images/${rel}). Use it with: scene ${name}`);
      })
    },
    {
      name: 'add_variable',
      title: 'Add a story variable',
      description: 'Adds "default name = value" to script.rpy, before the first label, so the variable exists from the start of the game and is saved with it.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'string', description: 'Python expression, e.g. 0, False, "" or []' }
        },
        required: ['name', 'value']
      },
      annotations: WRITE,
      handler: serial(async ({ name, value }) => {
        const gp = gamePathOrThrow();
        if (!IDENT.test(name || '')) throw new Error(`"${name}" is not a valid variable name.`);
        if (!String(value).trim() || /[\r\n]/.test(value)) throw new Error('value must be a one-line Python expression.');
        const where = definedIn(gp, rpyFiles(gp), 'default', name);
        if (where) throw new Error(`"${name}" already has a default in ${where}.`);
        const fp = path.join(gp, 'script.rpy');
        const raw = readText(fp);
        const eol = raw ? eolOf(raw) : os.EOL;
        const parts = splitLines(raw);
        const line = `default ${name} = ${String(value).trim()}${eol}`;
        let at = parts.findIndex(p => /^label\s/.test(p.replace(/^﻿/, '')));
        // Comments right above the label describe it, so they stay with it
        while (at > 0 && parts[at - 1].startsWith('#')) at--;
        let insert = [line, eol];
        if (at < 0) { at = parts.length; insert = [parts.length && !/\n$/.test(parts[at - 1]) ? eol : '', line]; }
        else {
          // Next to the other defaults when they are right before the label
          let prev = at - 1;
          while (prev >= 0 && !parts[prev].trim()) prev--;
          if (prev >= 0 && /^default\s/.test(parts[prev])) { at = prev + 1; insert = [line]; }
        }
        const entry = await changes.record({ tool: 'add_variable', target: name }, ['script.rpy'], () => {
          parts.splice(at, 0, ...insert);
          fs.writeFileSync(fp, parts.join(''), 'utf-8');
        });
        return done(entry, `Added "default ${name} = ${String(value).trim()}" to script.rpy.`);
      })
    },
    {
      name: 'set_gui_settings',
      title: 'Change GUI settings',
      description: 'Changes "define gui.*" values of gui.rpy (see get_gui_settings for the current ones). Values are Python expressions as written in gui.rpy: colors and file names in quotes (e.g. "\'#ffcc00\'" or "\'fonts/Lato-Regular.ttf\'"), numbers without them. Unknown names are added at the end of gui.rpy.',
      inputSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            description: 'Map of gui.* name to its new value, e.g. { "gui.text_color": "\'#ffffff\'", "gui.text_size": "36" }',
            additionalProperties: { type: 'string' }
          }
        },
        required: ['settings']
      },
      annotations: WRITE,
      handler: serial(async ({ settings }) => {
        const gp = gamePathOrThrow();
        const entries = Object.entries(settings || {});
        if (!entries.length) throw new Error('settings is empty.');
        for (const [k, v] of entries) {
          if (!/^gui\.\w+$/.test(k)) throw new Error(`"${k}" is not a gui.* setting.`);
          if (!String(v).trim() || /[\r\n]/.test(v)) throw new Error(`The value of ${k} must be a one-line Python expression.`);
        }
        const fp = path.join(gp, 'gui.rpy');
        if (!fs.existsSync(fp)) throw new Error('The project has no gui.rpy.');
        let raw = readText(fp);
        const eol = eolOf(raw);
        const changed = [], added = [];
        for (const [k, v] of entries) {
          const re = new RegExp(`^([ \\t]*define[ \\t]+${k.replace('.', '\\.')}[ \\t]*=[ \\t]*)((?:"[^"\\r\\n]*"|'[^'\\r\\n]*'|[^\\r\\n#'"])*?)([ \\t]*(?:#[^\\r\\n]*)?)(?=\\r?\\n|$)`, 'm');
          if (re.test(raw)) { raw = raw.replace(re, (_, a, __, c) => a + String(v).trim() + c); changed.push(k); }
          else { raw = raw.replace(/\s*$/, '') + eol + `define ${k} = ${String(v).trim()}` + eol; added.push(k); }
        }
        const entry = await changes.record({ tool: 'set_gui_settings', target: entries.map(e => e[0]).join(', ') }, ['gui.rpy'], () => {
          fs.writeFileSync(fp, raw, 'utf-8');
        });
        return done(entry, `gui.rpy: ${changed.length} changed${added.length ? `, ${added.length} added (${added.join(', ')})` : ''}.`);
      })
    },
    {
      name: 'set_game_info',
      title: 'Change the game\'s name or version',
      description: 'Changes the game\'s name (config.name), version (config.version) or build name (build.name, ASCII without spaces: it names the files of the builds) in options.rpy.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' }, version: { type: 'string' }, build_name: { type: 'string' } }
      },
      annotations: WRITE,
      handler: serial(async ({ name, version, build_name }) => {
        gamePathOrThrow();
        if (name === undefined && version === undefined && build_name === undefined) throw new Error('Give name, version or build_name.');
        if (build_name !== undefined && !/^[A-Za-z0-9_\-.]+$/.test(build_name)) throw new Error('build_name can only have ASCII letters, numbers, ".", "_" and "-".');
        const entry = await changes.record({ tool: 'set_game_info', target: [name, version].filter(Boolean).join(' ') || build_name }, ['options.rpy'], () => {
          if (!saveGameInfo({ name, version, buildName: build_name })) throw new Error('options.rpy could not be written.');
        });
        return done(entry, 'options.rpy updated.');
      })
    },
    {
      name: 'list_changes',
      title: 'Changes made by Claude',
      description: 'The latest changes made through these tools, newest first, with their id and whether they were undone.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      handler: () => {
        gamePathOrThrow();
        return changes.list().slice(-30).reverse()
          .map(e => ({ id: e.id, time: new Date(e.time).toISOString(), change: e.tool, target: e.target, files: e.files.map(f => f.path), undone: e.undone }));
      }
    },
    {
      name: 'undo_change',
      title: 'Undo a change',
      description: 'Puts back the files of one change as they were before it. If a file was edited again afterwards, nothing is undone: the user can still force it from the app.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      annotations: { ...WRITE, destructiveHint: true },
      handler: serial(async ({ id }) => {
        gamePathOrThrow();
        const r = changes.undo(id);
        if (r.ok) return `Change ${id} undone.`;
        if (r.error === 'changed-later') throw new Error(`Not undone: ${r.files.join(', ')} changed after it. Undo the later changes first, or ask the user to force it from the app.`);
        throw new Error(r.error === 'already-undone' ? `Change ${id} was already undone.` : `There is no change ${id}.`);
      })
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
