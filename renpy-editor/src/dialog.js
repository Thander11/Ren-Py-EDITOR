// ═══════════════════════════════════════════════════════════════════
// DIALOG — themed replacement for confirm() and native message boxes
// (shared by all windows; styles in dialog.css)
// ═══════════════════════════════════════════════════════════════════

const DIALOG_ICONS = { question: '?', info: 'i', warning: '!', error: '✕' };
let dialogQueue = Promise.resolve();

function dialogText(key, fallback) {
  const val = typeof t === 'function' ? t(key) : key;
  return val && val !== key ? val : fallback;
}

// opts: { title, message, detail, type, buttons, defaultId, cancelId, dangerId }
// Resolves with the index of the pressed button (cancelId on Escape / overlay click)
function showDialog(opts) {
  const next = dialogQueue.then(() => openDialog(opts));
  dialogQueue = next.catch(() => {});
  return next;
}

function openDialog({
  title = '', message = '', detail = '', type = 'question',
  buttons = [dialogText('dialog_ok', 'OK')], defaultId = 0, cancelId = -1, dangerId = -1
} = {}) {
  return new Promise(resolve => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'app-dialog-overlay';
    overlay.innerHTML = `
      <div class="app-dialog app-dialog-${type}" role="dialog" aria-modal="true">
        <div class="app-dialog-main">
          <div class="app-dialog-icon"></div>
          <div class="app-dialog-content">
            <div class="app-dialog-title"></div>
            <div class="app-dialog-message"></div>
            <div class="app-dialog-detail"></div>
          </div>
        </div>
        <div class="app-dialog-buttons"></div>
      </div>`;
    overlay.querySelector('.app-dialog-icon').textContent = DIALOG_ICONS[type] || DIALOG_ICONS.info;
    overlay.querySelector('.app-dialog-title').textContent = title;
    overlay.querySelector('.app-dialog-message').textContent = message;
    overlay.querySelector('.app-dialog-detail').textContent = detail;

    const close = (idx) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      prevFocus?.focus?.();
      resolve(idx);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(cancelId); }
      else if (e.key === 'Enter' && !e.target.closest?.('.app-dialog-buttons')) {
        e.preventDefault(); e.stopPropagation(); close(defaultId);
      }
    };

    const row = overlay.querySelector('.app-dialog-buttons');
    const btnEls = buttons.map((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'app-dialog-btn ' + (i === dangerId ? 'danger' : i === defaultId ? 'primary' : 'secondary');
      b.textContent = label;
      b.addEventListener('click', () => close(i));
      return b;
    });
    // Secondary buttons first, the default/danger action on the right
    btnEls.slice().reverse().forEach(b => row.appendChild(b));

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(cancelId); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    (btnEls[defaultId] || btnEls[0])?.focus();
  });
}

// Async confirm(): resolves true when accepted
async function showConfirm(message, { title = '', okText, cancelText, danger = false, type } = {}) {
  const response = await showDialog({
    title,
    message,
    type: type || (danger ? 'warning' : 'question'),
    buttons: [okText || dialogText(danger ? 'btn_delete' : 'dialog_ok', danger ? 'Delete' : 'OK'), cancelText || dialogText('cancel', 'Cancel')],
    defaultId: 0,
    cancelId: 1,
    dangerId: danger ? 0 : -1
  });
  return response === 0;
}
