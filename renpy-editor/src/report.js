// ═══════════════════════════════════════════════════════════
// Ren'Py EDITOR — Report a problem or suggest something. It goes
// to the author's email (main.js sends it) or, for those who
// prefer it, opens a GitHub issue already filled in.
// ═══════════════════════════════════════════════════════════

let reportKind = 'bug';
let reportVia = 'email';   // email | github
let reportInfo = null;
let reportBusy = false;

try { reportVia = localStorage.getItem('reportVia') === 'github' ? 'github' : 'email'; } catch (e) { /* default */ }

// The ways this build can send a report
function reportWays() {
  return [reportInfo.configured && 'email', reportInfo.github && 'github'].filter(Boolean);
}

async function openReport() {
  reportInfo = await window.api.reportInfo();
  reportBusy = false;
  if (!reportWays().includes(reportVia)) reportVia = reportWays()[0] || 'email';
  renderReport();
  document.getElementById('report-overlay').classList.add('open');
  document.getElementById('report-subject')?.focus();
}

function closeReport() {
  if (reportBusy) return;
  document.getElementById('report-overlay').classList.remove('open');
}

// The form keeps what was typed when the kind or the way changes
function reportValues() {
  const v = id => document.getElementById(id)?.value ?? '';
  return { title: v('report-subject'), text: v('report-text'), email: v('report-email'), website: v('report-website'),
    withTech: document.getElementById('report-tech')?.checked ?? true };
}

function reportChoice(name, value, current, iconName, onchange) {
  return `
    <label class="build-pkg report-kind">
      <input type="radio" name="${name}" value="${value}" ${value === current ? 'checked' : ''} onchange="${onchange}('${value}')">
      <span class="build-pkg-text"><span class="build-pkg-name">${icon(iconName, 15)}${t(`${name}_${value}`)}</span>
      <span class="build-pkg-hint">${t(`${name}_${value}_hint`)}</span></span>
    </label>`;
}

function renderReport(values = { title: '', text: '', email: '', website: '', withTech: true }) {
  const body = document.getElementById('report-body');
  const ways = reportWays();
  if (!ways.length) {
    body.innerHTML = `<p class="report-note">${icon('info', 16)}<span>${escHtml(t('report_not_configured'))}</span></p>`;
    document.getElementById('report-footer').innerHTML = `<button class="btn btn-primary" onclick="closeReport()">${t('close')}</button>`;
    return;
  }
  const github = reportVia === 'github';
  const tech = Object.entries(reportInfo.tech).map(([k, v]) => `<li><span>${escHtml(k)}</span><code>${escHtml(v)}</code></li>`).join('');
  body.innerHTML = `
    <p class="settings-hint">${t('report_intro')}</p>
    <fieldset class="report-kinds"><legend class="form-label">${t('report_kind')}</legend>
      ${reportChoice('report_kind', 'bug', reportKind, 'alert', 'setReportKind')}${reportChoice('report_kind', 'idea', reportKind, 'idea', 'setReportKind')}
    </fieldset>
    ${ways.length > 1 ? `<fieldset class="report-kinds"><legend class="form-label">${t('report_via')}</legend>
      ${reportChoice('report_via', 'email', reportVia, 'message', 'setReportVia')}${reportChoice('report_via', 'github', reportVia, 'external', 'setReportVia')}
    </fieldset>` : ''}
    <div class="form-group">
      <label class="form-label" for="report-subject">${t('report_subject')}</label>
      <input class="form-input" id="report-subject" maxlength="120" value="${escHtml(values.title)}" placeholder="${escHtml(t('report_subject_placeholder_' + reportKind))}">
    </div>
    <div class="form-group">
      <label class="form-label" for="report-text">${t('report_text')}</label>
      <textarea class="form-input report-text" id="report-text" rows="6" maxlength="5000" placeholder="${escHtml(t('report_text_placeholder_' + reportKind))}">${escHtml(values.text)}</textarea>
    </div>
    ${github ? `<p class="report-note">${icon('info', 16)}<span>${escHtml(t('report_github_public'))}</span></p>` : `
    <div class="form-group">
      <label class="form-label" for="report-email">${t('report_email')}</label>
      <input class="form-input" id="report-email" type="email" maxlength="200" value="${escHtml(values.email)}" placeholder="${escHtml(t('report_email_placeholder'))}" aria-describedby="report-email-hint">
      <p class="settings-hint" id="report-email-hint">${t('report_email_hint')}</p>
    </div>
    <label class="report-honey" aria-hidden="true">Website <input id="report-website" tabindex="-1" autocomplete="off" value="${escHtml(values.website)}"></label>`}
    <div class="report-tech">
      <label class="settings-check"><input type="checkbox" id="report-tech" ${values.withTech ? 'checked' : ''}>${t('report_tech')}</label>
      <p class="settings-hint">${t('report_tech_hint')}</p>
      <ul>${tech}</ul>
    </div>
    <div id="report-status" role="status" aria-live="polite"></div>`;
  document.getElementById('report-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeReport()">${t('cancel')}</button>
    <button class="btn btn-primary" id="report-send-btn" onclick="sendReport()">${reportSendLabel()}</button>`;
}

const reportSendLabel = () => reportVia === 'github'
  ? `${icon('external', 15)}${t('report_open_github')}` : `${icon('send', 15)}${t('report_send')}`;

function setReportKind(kind) {
  reportKind = kind;
  renderReport(reportValues());
}

function setReportVia(via) {
  reportVia = via;
  try { localStorage.setItem('reportVia', via); } catch (e) { /* only a preference */ }
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
  const report = { kind: reportKind, ...v, title: v.title.trim(), text: v.text.trim(), email: v.email.trim() };
  if (reportVia === 'github') {
    await window.api.reportOpenIssue(report);
    closeReport();
    notify(t('report_github_opened'), 'ok');
    return;
  }
  if (report.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.email)) { reportStatus(escHtml(t('report_invalid_email')), 'err'); return; }
  reportBusy = true;
  const btn = document.getElementById('report-send-btn');
  btn.disabled = true;
  btn.textContent = t('report_sending');
  const r = await window.api.reportSend(report);
  reportBusy = false;
  if (r.ok) {
    closeReport();
    notify(t('report_sent'), 'ok');
    return;
  }
  btn.disabled = false;
  btn.innerHTML = reportSendLabel();
  // If it can't be sent, the message isn't lost: it can be copied or opened on GitHub
  reportStatus(`${escHtml(t(r.error === 'rate' ? 'report_rate' : 'report_error'))}
    <button class="btn btn-secondary btn-sm" onclick="copyReport()">${icon('copy', 14)}${t('report_copy')}</button>
    ${reportInfo.github ? `<button class="btn btn-secondary btn-sm" onclick="setReportVia('github'); sendReport()">${icon('external', 14)}${t('report_open_github')}</button>` : ''}`, 'err');
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
