// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Stroke icons (24×24, drawn with currentColor)
// Static markup uses <span class="icon" data-icon="name"></span>,
// filled in by hydrateIcons(); scripts call icon(name).
// ═══════════════════════════════════════════════════════════

const ICON_PATHS = {
  // Navigation and tools
  map: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.5 12H12M12 6v12M12 6h4.5M12 18h4.5"/>',
  scenes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
  characters: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"/>',
  'main-menu': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h4M7 17h5"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  'folder-open': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"/><path d="M3 7v11a1 1 0 0 0 1 1h13.5l3.5-8H7l-3.5 7"/>',
  'project-new': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v6M9 14h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  'file-plus': '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M12.5 11v6M9.5 14h6"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  'copy-end': '<rect x="8" y="3" width="11" height="10" rx="2"/><path d="M5 7v9a2 2 0 0 0 2 2h4M16 15v6M13.5 18.5 16 21l2.5-2.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  export: '<path d="M12 4v11M7 9l5-5 5 5"/><path d="M5 14v6h14v-6"/>',
  eraser: '<path d="M8 20h12M4.5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 18H7z"/><path d="m9 11 5 5"/>',
  panels: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  // Block types
  narration: '<path d="M4 6h16M4 10h16M4 14h10M4 18h12"/>',
  dialogue: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  show: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5"/><path d="M18 13v7M14.5 16.5h7"/>',
  show_multi: '<circle cx="8" cy="8" r="3"/><circle cx="15" cy="7" r="2.5"/><path d="M2.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M19 14v6M16 17h6"/>',
  hide: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5M14.5 16.5h7"/>',
  hide_multi: '<circle cx="8" cy="8" r="3"/><circle cx="15" cy="7" r="2.5"/><path d="M2.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M16 17h6"/>',
  scene: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  solid: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 14 14 4M8 20 20 8"/>',
  label: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  menu: '<path d="M5 4v6a4 4 0 0 0 4 4h10M5 10v10"/><path d="m15 10 4 4-4 4"/>',
  condition: '<path d="M12 3 21 12 12 21 3 12z"/><path d="M10 10a2 2 0 1 1 2.5 2c-.4.2-.5.5-.5 1M12 15.5v.5"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  jump: '<path d="M4 18V12a5 5 0 0 1 5-5h11M15 2l5 5-5 5"/>',
  call: '<path d="M4 12h11M11 8l4 4-4 4"/><path d="M15 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/>',
  comment: '<path d="M5 5h14v10h-6l-5 4v-4H5z"/><path d="M9 9h6"/>',
  custom: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>'
};

function icon(name, size = 16) {
  const paths = ICON_PATHS[name];
  if (!paths) return '';
  return `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = icon(el.dataset.icon, parseInt(el.dataset.iconSize, 10) || 16);
  });
}
