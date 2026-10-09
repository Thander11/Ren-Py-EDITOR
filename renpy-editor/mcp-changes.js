// ═════════════════════════════════════════════════════════════════════
// Changes made by Claude: every change backs up the files it touches,
// is written to a log and can be undone from the app.
// Stored next to game/ in .renpy-editor/ (Ren'Py leaves dot folders out
// of builds and never loads them as scripts).
// ═════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_ENTRIES = 200;

const hashFile = (fp) => fs.existsSync(fp) ? crypto.createHash('sha1').update(fs.readFileSync(fp)).digest('hex') : null;

function createChangeLog({ getGamePath, onChange = () => {} }) {
  function dirs() {
    const gp = getGamePath();
    if (!gp) throw new Error('No project is open in Ren\'Py EDITOR.');
    const base = path.join(path.dirname(path.resolve(gp)), '.renpy-editor');
    return { gp: path.resolve(gp), base, backups: path.join(base, 'backups'), logFile: path.join(base, 'claude-changes.json') };
  }

  function load() {
    try { return JSON.parse(fs.readFileSync(dirs().logFile, 'utf-8')); } catch (e) { return []; }
  }

  function save(entries) {
    const d = dirs();
    // The oldest changes and their backups are forgotten
    while (entries.length > MAX_ENTRIES) {
      const old = entries.shift();
      fs.rmSync(path.join(d.backups, old.id), { recursive: true, force: true });
    }
    fs.mkdirSync(d.base, { recursive: true });
    fs.writeFileSync(d.logFile, JSON.stringify(entries, null, 1), 'utf-8');
  }

  // Path inside game/, or an error
  function inGame(rel) {
    const { gp } = dirs();
    const fp = path.resolve(gp, rel);
    if (!fp.startsWith(gp + path.sep)) throw new Error(`"${rel}" is outside the project's game/ folder.`);
    return fp;
  }

  // Backs up `files` (paths relative to game/), runs apply() and logs the change.
  // action: { tool, target } describes the change for the app's log
  async function record(action, files, apply) {
    const d = dirs();
    const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const saved = [];
    for (const rel of [...new Set(files)]) {
      const fp = inGame(rel);
      const existed = fs.existsSync(fp);
      if (existed) {
        const backup = path.join(d.backups, id, rel);
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(fp, backup);
      }
      saved.push({ path: rel.split(path.sep).join('/'), existed });
    }
    try {
      await apply();
    } catch (e) {
      // Nothing half-done stays behind
      restore(id, saved);
      fs.rmSync(path.join(d.backups, id), { recursive: true, force: true });
      throw e;
    }
    for (const f of saved) f.after = hashFile(inGame(f.path));
    const entry = { id, time: Date.now(), ...action, files: saved, undone: false };
    const entries = load();
    entries.push(entry);
    save(entries);
    onChange(entry);
    return entry;
  }

  function restore(id, files) {
    const d = dirs();
    for (const f of files) {
      const fp = inGame(f.path);
      if (f.existed) {
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.copyFileSync(path.join(d.backups, id, f.path), fp);
      } else if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
      }
    }
  }

  // Undoes a change. Files edited again afterwards are only overwritten with force
  function undo(id, force = false) {
    const entries = load();
    const entry = entries.find(e => e.id === id);
    if (!entry) return { ok: false, error: 'not-found' };
    if (entry.undone) return { ok: false, error: 'already-undone' };
    const changedLater = entry.files.filter(f => hashFile(inGame(f.path)) !== f.after).map(f => f.path);
    if (changedLater.length && !force) return { ok: false, error: 'changed-later', files: changedLater };
    restore(entry.id, entry.files);
    entry.undone = true;
    entry.undoneAt = Date.now();
    save(entries);
    onChange(entry);
    return { ok: true, entry };
  }

  return { record, undo, list: () => { try { return load(); } catch (e) { return []; } }, inGame };
}

module.exports = { createChangeLog };
