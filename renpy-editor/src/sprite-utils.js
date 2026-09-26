// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Sprite naming helpers (shared by both windows)
// Sprite keys follow the format: <characterId>_<type>_<identifier>
// ═══════════════════════════════════════════════════════════

// Type names can't contain "_" because it separates the key parts
function sanitizeSpriteType(s) {
  return (s || '').trim().replace(/[^A-Za-z0-9]/g, '');
}

function sanitizeSpriteId(s) {
  return (s || '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
}

function buildSpriteKey(charId, type, id) {
  return type ? `${charId}_${type}_${id}` : `${charId}_${id}`;
}

// Split a key into { type, id }. Keys without type (legacy) return type ''.
function parseSpriteKey(charId, key) {
  let rest = key;
  for (const prefix of [charId + '_', charId.toLowerCase() + '_']) {
    if (key.startsWith(prefix)) { rest = key.slice(prefix.length); break; }
  }
  const idx = rest.indexOf('_');
  if (idx <= 0 || idx === rest.length - 1) return { type: '', id: rest };
  return { type: rest.slice(0, idx), id: rest.slice(idx + 1) };
}

// Types of a character, in order of first appearance
function getSpriteTypes(chr) {
  if (!chr) return [];
  const types = [];
  for (const img of chr.images || []) {
    const { type } = parseSpriteKey(chr.id, img.key);
    if (!types.includes(type)) types.push(type);
  }
  return types;
}

// [{ type, images: [...] }] grouped by type, in order of first appearance
function groupSpritesByType(chr) {
  const groups = [];
  for (const img of (chr && chr.images) || []) {
    const { type } = parseSpriteKey(chr.id, img.key);
    let g = groups.find(x => x.type === type);
    if (!g) { g = { type, images: [] }; groups.push(g); }
    g.images.push(img);
  }
  return groups;
}

function getSpritesOfType(chr, type) {
  if (!chr) return [];
  return (chr.images || []).filter(img => parseSpriteKey(chr.id, img.key).type === type);
}

function getSpriteType(chr, key) {
  return chr ? parseSpriteKey(chr.id, key).type : '';
}

// Next free numeric identifier for a character + type
function nextSpriteNumber(chr, type) {
  let max = 0;
  for (const img of (chr && chr.images) || []) {
    const p = parseSpriteKey(chr.id, img.key);
    if (p.type === type && /^\d+$/.test(p.id)) max = Math.max(max, parseInt(p.id, 10));
  }
  return max + 1;
}

// Character that owns a sprite key (longest matching id wins)
function findCharForSpriteKey(chars, key) {
  let best = null;
  for (const c of chars || []) {
    if (key.startsWith(c.id + '_') || key.startsWith(c.id.toLowerCase() + '_')) {
      if (!best || c.id.length > best.id.length) best = c;
    }
  }
  return best;
}

// ── Side expressions ──
// Declared as: image side <imageTag> <charId>_<type>_<id> = "path"
// Keys without a character prefix (legacy) are shared by every character
// using that image tag, and have no type ('').

function isOwnExpressionKey(chr, key) {
  return key.startsWith(chr.id + '_') || key.startsWith(chr.id.toLowerCase() + '_');
}

function getCharExpressions(chars, chr, expressions) {
  if (!chr || !chr.imageAttr) return [];
  return (expressions || []).filter(e => {
    if (e.charId !== chr.imageAttr) return false;
    const owner = findCharForSpriteKey(chars, e.key);
    return owner ? owner.id === chr.id : true;
  });
}

function getExpressionType(chr, key) {
  return chr && isOwnExpressionKey(chr, key) ? parseSpriteKey(chr.id, key).type : '';
}

function expressionLabel(chr, key) {
  return chr && isOwnExpressionKey(chr, key) ? parseSpriteKey(chr.id, key).id : key;
}

function nextExpressionNumber(chr, charExprs, type) {
  let max = 0;
  for (const e of charExprs) {
    if (!isOwnExpressionKey(chr, e.key)) continue;
    const p = parseSpriteKey(chr.id, e.key);
    if (p.type === type && /^\d+$/.test(p.id)) max = Math.max(max, parseInt(p.id, 10));
  }
  return max + 1;
}
