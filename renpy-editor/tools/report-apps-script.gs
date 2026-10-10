// ═══════════════════════════════════════════════════════════════════
// Ren'Py EDITOR — receives the reports and suggestions sent from the
// app and emails them to the author. Runs in the author's own Google
// account as an Apps Script web app (see the steps below).
//
// How to publish it (once):
//  1. Open https://script.google.com with the account that will send
//     the emails, create a new project and paste this whole file.
//  2. Deploy › New deployment › type "Web app":
//       Execute as: Me      Who has access: Anyone
//  3. Authorize it when Google asks (it only needs to send email).
//  4. Copy the web app URL (ends in /exec) into "url" in report.config.json
//     (a copy of report.config.example.json; it stays out of git).
// After changing this file: Deploy › Manage deployments › Edit › New
// version, so the same URL serves the new code.
// ═══════════════════════════════════════════════════════════════════

const TO = 'thandercontact+reneditor@gmail.com';
// Must match REPORT_KEY in main.js. It keeps out random requests;
// the limits below keep out the rest.
const APP_KEY = 'renpy-editor-reports-v1';
const MAX_PER_INSTALL_PER_HOUR = 5;
const MAX_TOTAL_PER_HOUR = 40;
const KINDS = { bug: 'Error', idea: 'Sugerencia' };

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    // Bots fill every field, including the one people never see
    if (d.website) return reply({ ok: true });
    if (d.key !== APP_KEY) return reply({ ok: false, error: 'forbidden' });

    const kind = KINDS[d.kind];
    const title = clean(d.title, 120);
    const text = clean(d.text, 5000);
    if (!kind || !title || !text) return reply({ ok: false, error: 'invalid' });

    const cache = CacheService.getScriptCache();
    const install = 'i_' + (clean(d.installId, 64).replace(/[^\w-]/g, '') || 'unknown');
    if (!take(cache, install, MAX_PER_INSTALL_PER_HOUR) || !take(cache, 'total', MAX_TOTAL_PER_HOUR)) {
      return reply({ ok: false, error: 'rate' });
    }

    const email = clean(d.email, 200);
    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
    const lines = [text, '', '——————————', replyTo ? 'Responder a: ' + replyTo : 'Sin correo para responder'];
    if (d.tech && typeof d.tech === 'object') {
      lines.push('', 'Datos técnicos:');
      Object.keys(d.tech).slice(0, 20).forEach(k => lines.push('  ' + clean(k, 40) + ': ' + clean(String(d.tech[k]), 200)));
    }

    const options = { to: TO, subject: "[Ren'Py EDITOR] " + kind + ': ' + title, body: lines.join('\n'), name: "Ren'Py EDITOR" };
    if (replyTo) options.replyTo = replyTo;
    MailApp.sendEmail(options);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: 'server' });
  }
}

// Opening the URL in a browser just says the service is up
function doGet() {
  return reply({ ok: true, service: 'renpy-editor-reports' });
}

// Counts one more message for `key` this hour; false when over the limit
function take(cache, key, max) {
  const n = Number(cache.get(key) || 0);
  if (n >= max) return false;
  cache.put(key, String(n + 1), 3600);
  return true;
}

function clean(s, max) {
  return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function reply(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
