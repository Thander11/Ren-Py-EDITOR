// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Report a problem or suggest something. The
// message goes to the author's email (main.js sends it).
// ═══════════════════════════════════════════════════════════

let reportKind = 'bug';
let reportInfo = null;
let reportBusy = false;

async function openReport() {
  reportInfo = await window.api.reportInfo();
  reportBusy = false;
  renderReport();
  document.getElementById('report-overlay').classList.add('open');
  document.getElementById('report-subject')?.focus();
}

function closeReport() {
  if (reportBusy) return;
  document.getElementById('report-overlay').classList.remove('open');
}

// The form keeps what was typed when the kind changes
function reportValues() {
  const v = id => document.getElementById(id)?.value ?? '';
  return { title: v('report-subject'), text: v('report-text'), email: v('report-email'), website: v('report-website'),
    withTech: document.getElementById('report-tech')?.checked ?? true };
}

function renderReport(values = { title: '', text: '', email: '', website: '', withTech: true }) {
  const body = document.getElementById('report-body');
  if (!reportInfo.configured) {
    body.innerHTML = `<p class="report-note">${icon('info', 16)}<span>${escHtml(t('report_not_configured'))}</span></p>`;
    document.getElementById('report-footer').innerHTML = `<button class="btn btn-primary" onclick="closeReport()">${t('close')}</button>`;
    return;
  }
  const tech = Object.entries(reportInfo.tech).map(([k, v]) => `<li><span>${escHtml(k)}</span><code>${escHtml(v)}</code></li>`).join('');
  const kinds = ['bug', 'idea'].map(k => `
    <label class="build-pkg report-kind">
      <input type="radio" name="report-kind" value="${k}" ${k === reportKind ? 'checked' : ''} onchange="setReportKind('${k}')">
      <span class="build-pkg-text"><span class="build-pkg-name">${icon(k === 'bug' ? 'alert' : 'idea', 15)}${t('report_kind_' + k)}</span>
      <span class="build-pkg-hint">${t('report_kind_' + k + '_hint')}</span></span>
    </label>`).join('');
  body.innerHTML = `
    <p class="settings-hint">${t('report_intro')}</p>
    <fieldset class="report-kinds"><legend class="form-label">${t('report_kind')}</legend>${kinds}</fieldset>
    <div class="form-group">
      <label class="form-label" for="report-subject">${t('report_subject')}</label>
      <input class="form-input" id="report-subject" maxlength="120" value="${escHtml(values.title)}" placeholder="${escHtml(t('report_subject_placeholder_' + reportKind))}">
    </div>
    <div class="form-group">
      <label class="form-label" for="report-text">${t('report_text')}</label>
      <textarea class="form-input report-text" id="report-text" rows="6" maxlength="5000" placeholder="${escHtml(t('report_text_placeholder_' + reportKind))}">${escHtml(values.text)}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label" for="report-email">${t('report_email')}</label>
      <input class="form-input" id="report-email" type="email" maxlength="200" value="${escHtml(values.email)}" placeholder="${escHtml(t('report_email_placeholder'))}" aria-describedby="report-email-hint">
      <p class="settings-hint" id="report-email-hint">${t('report_email_hint')}</p>
    </div>
    <label class="report-honey" aria-hidden="true">Website <input id="report-website" tabindex="-1" autocomplete="off" value="${escHtml(values.website)}"></label>
    <div class="report-tech">
      <label class="settings-check"><input type="checkbox" id="report-tech" ${values.withTech ? 'checked' : ''}>${t('report_tech')}</label>
      <p class="settings-hint">${t('report_tech_hint')}</p>
      <ul>${tech}</ul>
    </div>
    <div id="report-status" role="status" aria-live="polite"></div>`;
  document.getElementById('report-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeReport()">${t('cancel')}</button>
    <button class="btn btn-primary" id="report-send-btn" onclick="sendReport()">${icon('send', 15)}${t('report_send')}</button>`;
}

function setReportKind(kind) {
  reportKind = kind;
  renderReport(reportValues());
}

function reportStatus(message, type) {
  const el = document.getElementById('report-status');
  el.className = 'report-status ' + (type || '');
  el.innerHTML = message;
}

async function sendReport() {
  const v = reportValues();
  if (!v.title.trim() || !v.text.trim()) { reportStatus(escHtml(t('report_required')), 'err'); return; }
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) { reportStatus(escHtml(t('report_invalid_email')), 'err'); return; }
  reportBusy = true;
  const btn = document.getElementById('report-send-btn');
  btn.disabled = true;
  btn.textContent = t('report_sending');
  const r = await window.api.reportSend({ kind: reportKind, ...v, title: v.title.trim(), text: v.text.trim(), email: v.email.trim() });
  reportBusy = false;
  if (r.ok) {
    closeReport();
    notify(t('report_sent'), 'ok');
    return;
  }
  btn.disabled = false;
  btn.innerHTML = `${icon('send', 15)}${t('report_send')}`;
  // If it can't be sent, the message isn't lost: it can be copied and sent another way
  reportStatus(`${escHtml(t(r.error === 'rate' ? 'report_rate' : 'report_error'))}
    <button class="btn btn-secondary btn-sm" onclick="copyReport()">${icon('copy', 14)}${t('report_copy')}</button>`, 'err');
}

async function copyReport() {
  const v = reportValues();
  const tech = v.withTech ? '\n\n' + Object.entries(reportInfo.tech).map(([k, val]) => `${k}: ${val}`).join('\n') : '';
  await navigator.clipboard.writeText(`[${t('report_kind_' + reportKind)}] ${v.title}\n\n${v.text}${tech}`);
  notify(t('report_copied'), 'ok');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('report-overlay').classList.contains('open')
    && !document.querySelector('.app-dialog-overlay')) closeReport();
});
