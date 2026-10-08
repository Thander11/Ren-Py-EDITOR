// ═══════════════════════════════════════════════════════════════════
// THEME — shared by all windows (dark / light / oled / custom)
// ═══════════════════════════════════════════════════════════════════

// Colors the user can edit in the custom theme (the rest are derived)
const CUSTOM_THEME_KEYS = ['bg', 'surface', 'surface2', 'border', 'text', 'text2', 'accent'];
// Code panel colors; when not set they follow the interface colors (see resolveCustomTheme)
const CUSTOM_THEME_CODE_KEYS = ['codeBg', 'codeText', 'codeKeyword', 'codeString', 'codeComment', 'codeNumber'];

const CUSTOM_THEME_DEFAULT = {
  bg: '#0e1312',
  surface: '#121918',
  surface2: '#18211f',
  border: '#26322f',
  text: '#e6eeec',
  text2: '#a6b8b3',
  accent: '#7fe0b0'
};

// Translations start with an emoji; the interface draws its own icons instead
function stripLeadingEmoji(s) {
  return String(s).replace(/^(?:[\p{Extended_Pictographic}\p{Regional_Indicator}][️‍\p{Extended_Pictographic}\p{Regional_Indicator}]*\s*)+/u, '');
}

// CSS variable for each code color
const CODE_THEME_VARS = {
  codeBg: 'code-editor-bg', codeText: 'code-text', codeKeyword: 'code-keyword', codeString: 'code-string',
  codeComment: 'code-comment', codeNumber: 'code-number'
};

// Every CSS variable that applyTheme() may set inline
const THEME_VARS = [
  ...CUSTOM_THEME_KEYS, 'text3', 'accent2', 'on-accent', 'modal-bg', 'shadow', 'scrollbar-track',
  'scrollbar-thumb', 'header-bg', 'nav-bg', 'code-bg', 'card-bg', ...Object.values(CODE_THEME_VARS)
];

function themeHexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function themeRgbToHex(rgb) {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

// Mix color a with color b; t = 0 → a, t = 1 → b
function themeMix(a, b, t) {
  const ca = themeHexToRgb(a), cb = themeHexToRgb(b);
  return themeRgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

function themeIsLight(hex) {
  const [r, g, b] = themeHexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

// All editable colors of a custom theme, filling the code colors the user hasn't set
function resolveCustomTheme(custom) {
  const c = { ...CUSTOM_THEME_DEFAULT, ...(custom || {}) };
  return {
    codeBg: c.bg,
    codeText: c.text,
    codeKeyword: c.accent,
    codeString: themeIsLight(c.bg) ? '#b25f1c' : '#f0b38a',
    codeComment: themeMix(c.text2, c.bg, 0.3),
    codeNumber: themeIsLight(c.bg) ? '#2c5fc4' : '#9cc3ff',
    ...c
  };
}

// Full variable set for a custom theme, derived from the editable colors
function buildCustomThemeVars(custom) {
  const c = resolveCustomTheme(custom);
  const code = {};
  Object.entries(CODE_THEME_VARS).forEach(([k, v]) => { code[v] = c[k]; });
  const light = themeIsLight(c.bg);
  const deep = light ? themeMix(c.bg, '#000000', 0.05) : themeMix(c.bg, '#000000', 0.35);
  return {
    ...c,
    'text3': themeMix(c.text2, c.bg, 0.4),
    'accent2': themeMix(c.accent, light ? '#000000' : '#ffffff', 0.15),
    // Text on accent-colored buttons: dark on a light accent, white on a dark one
    'on-accent': themeIsLight(c.accent) ? themeMix(c.accent, '#000000', 0.85) : '#ffffff',
    'modal-bg': light ? 'rgba(0,0,0,0.15)' : deep,
    'shadow': light ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.5)',
    'scrollbar-track': 'transparent',
    'scrollbar-thumb': c.border,
    'header-bg': light ? c.surface : c.bg,
    'nav-bg': deep,
    'code-bg': light ? c.surface : deep,
    'card-bg': c.surface2,
    ...code
  };
}

function applyTheme(s) {
  if (!s || !s.theme) return;
  const root = document.documentElement;
  root.setAttribute('data-theme', s.theme);
  if (s.theme === 'custom') {
    const vars = buildCustomThemeVars(s.customTheme);
    THEME_VARS.forEach(k => root.style.setProperty('--' + k, vars[k]));
  } else {
    THEME_VARS.forEach(k => root.style.removeProperty('--' + k));
  }
}
