// ═══════════════════════════════════════════════════════════════════
// SPELLCHECK — only fields with story text are checked (shared by all windows)
// Fields opt in with spellcheck="true"; every other text field gets spellcheck="false"
// so labels, variables, image names and Ren'Py code aren't underlined.
// ═══════════════════════════════════════════════════════════════════

const SPELLCHECK_FIELDS = 'input, textarea, [contenteditable]';

function disableDefaultSpellcheck(root) {
  if (root.nodeType !== 1) return;
  const fields = root.matches(SPELLCHECK_FIELDS) ? [root] : [];
  fields.push(...root.querySelectorAll(SPELLCHECK_FIELDS));
  fields.forEach(el => { if (!el.hasAttribute('spellcheck')) el.setAttribute('spellcheck', 'false'); });
}

disableDefaultSpellcheck(document.body);
new MutationObserver(mutations => {
  mutations.forEach(m => m.addedNodes.forEach(disableDefaultSpellcheck));
}).observe(document.body, { childList: true, subtree: true });
