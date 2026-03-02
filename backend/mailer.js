/* ============================================================
   mailer.js – SSStylish Repair e-mail sender
   Uses nodemailer with admin-configured SMTP (Gmail).
   ============================================================ */

const nodemailer = require('nodemailer');

/**
 * Load SMTP settings from the DB via getDb().
 * Returns null when SMTP is not yet configured.
 */
function getSmtpSettings() {
  try {
    const { prepare } = require('./database').getDb();
    const rows = prepare(`SELECT key, value FROM settings WHERE key IN
      ('smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from','smtp_secure')`).all();
    const s = {};
    rows.forEach(r => { s[r.key] = r.value; });
    if (!s.smtp_host || !s.smtp_user || !s.smtp_pass) return null;
    return s;
  } catch {
    return null;
  }
}

function createTransport(cfg) {
  const port = parseInt(cfg.smtp_port, 10) || 587;
  // Port 465 always uses implicit TLS; other ports use STARTTLS (secure=false)
  // unless the user has explicitly opted in via smtp_secure=true.
  const secure = port === 465 ? true : cfg.smtp_secure === 'true';
  return nodemailer.createTransport({
    host:   cfg.smtp_host,
    port,
    secure,
    auth: {
      user: cfg.smtp_user,
      pass: cfg.smtp_pass,
    },
  });
}

/* ── Branded HTML email template ───────────────────────────── */
function buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0e1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#131a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1535 0%,#1a103a 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,212,255,0.2);">
              <div style="font-size:28px;font-weight:800;color:#e8eaf0;letter-spacing:-0.5px;">
                <span style="color:#00d4ff;">SSS</span>tylish <span style="background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Repair</span>
              </div>
              <div style="font-size:12px;color:#8892a4;margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Vrátime vášmu mobilu štýlové SSS-rank nabíjanie</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;color:#e8eaf0;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA button (conversation link) -->
          ${conversationUrl ? `
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${conversationUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#0a0e1a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
                💬 Otvoriť konverzáciu
              </a>
              <div style="margin-top:12px;font-size:12px;color:#4a5568;">
                Alebo skopírujte tento odkaz: <span style="color:#00d4ff;">${conversationUrl}</span>
              </div>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#0f1629;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#4a5568;text-align:center;">
                    © ${year} SSStylish Repair · Vrátime vášmu mobilu štýlové SSS-rank nabíjanie
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:#2d3748;text-align:center;padding-top:6px;">
                    Táto správa bola odoslaná automaticky. Ak potrebujete pomoc, odpovedzte na tento e-mail alebo otvorte konverzáciu vyššie.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Public send helper ─────────────────────────────────────── */

/**
 * Send booking confirmation to customer.
 */
async function sendBookingConfirmation({ to, customerName, deviceModel, serviceName, orderNumber, conversationUrl }) {
  const cfg = getSmtpSettings();
  if (!cfg) return;

  const shopAddress = process.env.SHOP_ADDRESS || '';
  const mapsLink = shopAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddress)}`
    : null;

  const subject = `Potvrdenie rezervácie #${orderNumber} – SSStylish Repair`;
  const preheader = `Vaša oprava zariadenia ${deviceModel} bola prijatá.`;
  const bodyHtml = `
    <p>Dobrý deň <strong style="color:#00d4ff;">${escHtml(customerName)}</strong>,</p>
    <p>Vaša žiadosť o opravu bola úspešne prijatá. Tu sú detaily vašej objednávky:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
      <tr style="background:#0f1629;">
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;width:40%;">Číslo objednávky</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;font-weight:700;">#${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">Zariadenie</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;">${escHtml(deviceModel)}</td>
      </tr>
      <tr style="background:#0f1629;">
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">Typ opravy</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;">${escHtml(serviceName || 'Bude upresnené')}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">Stav</td>
        <td style="padding:12px 16px;font-size:13px;"><span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">⏳ Čaká na spracovanie</span></td>
      </tr>
    </table>

    <p>Naši technici si vašu žiadosť preštudujú a <strong style="color:#00d4ff;">stanovia cenu opravy</strong>. O všetkom vás budeme informovať cez konverzáciu nižšie.</p>
    ${mapsLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#0f1629;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">📍 Adresa servisu</p>
          <p style="margin:0 0 10px;font-size:14px;color:#e8eaf0;font-weight:600;">${escHtml(shopAddress)}</p>
          <a href="${mapsLink}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#0a0e1a;font-size:13px;font-weight:700;text-decoration:none;padding:9px 20px;border-radius:8px;">
            🗺️ Otvoriť v Google Maps
          </a>
        </td>
      </tr>
    </table>
    ` : '<p>Zariadenie nám prosím zašlite na adresu, ktorú obdržíte v ďalšej správe.</p>'}
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl }),
  });
}

/**
 * Notify customer that admin posted a new message.
 */
async function sendMessageNotification({ to, customerName, orderNumber, adminMessage, conversationUrl }) {
  const cfg = getSmtpSettings();
  if (!cfg) return;

  const subject = `Nová správa k objednávke #${orderNumber} – SSStylish Repair`;
  const preheader = `Technik vám odpovedal na vašu objednávku #${orderNumber}.`;
  const bodyHtml = `
    <p>Dobrý deň <strong style="color:#00d4ff;">${escHtml(customerName)}</strong>,</p>
    <p>K vašej objednávke <strong style="color:#00d4ff;">#${orderNumber}</strong> pribudla nová správa od nášho technika:</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#0f1629;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#e8eaf0;line-height:1.6;">
          ${escHtml(adminMessage)}
        </td>
      </tr>
    </table>

    <p>Pre odpoveď kliknite na tlačidlo nižšie a otvorte konverzáciu priamo v prehliadači.</p>
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl }),
  });
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { sendBookingConfirmation, sendMessageNotification, getSmtpSettings, createTransport };
