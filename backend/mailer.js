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

/* ── i18n strings for emails ────────────────────────────────── */
const EMAIL_I18N = {
  en: {
    tagline:          'We return SSS-rank charging to your phone',
    footer_auto:      'This message was sent automatically. If you need help, reply to this email or open the conversation above.',
    btn_open_conv:    '💬 Open Conversation',
    btn_copy:         'Or copy this link:',
    order_number:     'Order Number',
    device:           'Device',
    repair_type:      'Repair Type',
    status_label:     'Status',
    // Booking confirmation
    booking_subject:  (n) => `Booking Confirmation #${n} – SSStylish Repair`,
    booking_preheader:(d) => `Your repair request for ${d} has been received.`,
    booking_greeting: (name) => `Hello <strong style="color:#00d4ff;">${name}</strong>,`,
    booking_intro:    'Your repair request has been successfully received. Here are your order details:',
    booking_info:     'Our technicians will review your request and <strong style="color:#00d4ff;">set a repair price</strong>. We will keep you informed via the conversation below.',
    booking_no_addr:  'Please send your device to the address you will receive in the next message.',
    booking_maps_label: '📍 Shop Address',
    booking_maps_btn:   '🗺️ Open in Google Maps',
    status_pending:   '⏳ Pending',
    // Message notification
    msg_subject:      (n) => `New message on order #${n} – SSStylish Repair`,
    msg_preheader:    (n) => `Your technician replied to order #${n}.`,
    msg_greeting:     (name) => `Hello <strong style="color:#00d4ff;">${name}</strong>,`,
    msg_intro:        (n) => `A new message was posted on your order <strong style="color:#00d4ff;">#${n}</strong> by our technician:`,
    msg_reply_hint:   'Click the button below to open the conversation directly in your browser.',
    // Status update
    status_subject:   (n) => `Order #${n} status update – SSStylish Repair`,
    status_preheader: (n) => `Your order #${n} has been updated.`,
    status_greeting:  (name) => `Hello <strong style="color:#00d4ff;">${name}</strong>,`,
    status_intro:     (n) => `The status of your order <strong style="color:#00d4ff;">#${n}</strong> has been updated:`,
    status_labels: {
      pending:        '⏳ Pending',
      confirmed:      '🔵 Confirmed',
      diagnostics:    '🔬 Diagnostics',
      waiting_parts:  '⏸️ Waiting for parts',
      completed:      '✅ Completed',
      cancelled:      '❌ Cancelled',
    },
    status_hint:      'You can follow the full progress via your conversation.',
    price_offer:      (p) => `💰 Price quote from technician: ${p} €`,
  },
  sk: {
    tagline:          'Vrátime vášmu mobilu štýlové SSS-rank nabíjanie',
    footer_auto:      'Táto správa bola odoslaná automaticky. Ak potrebujete pomoc, odpovedzte na tento e-mail alebo otvorte konverzáciu vyššie.',
    btn_open_conv:    '💬 Otvoriť konverzáciu',
    btn_copy:         'Alebo skopírujte tento odkaz:',
    order_number:     'Číslo objednávky',
    device:           'Zariadenie',
    repair_type:      'Typ opravy',
    status_label:     'Stav',
    // Booking confirmation
    booking_subject:  (n) => `Potvrdenie rezervácie #${n} – SSStylish Repair`,
    booking_preheader:(d) => `Vaša oprava zariadenia ${d} bola prijatá.`,
    booking_greeting: (name) => `Dobrý deň <strong style="color:#00d4ff;">${name}</strong>,`,
    booking_intro:    'Vaša žiadosť o opravu bola úspešne prijatá. Tu sú detaily vašej objednávky:',
    booking_info:     'Naši technici si vašu žiadosť preštudujú a <strong style="color:#00d4ff;">stanovia cenu opravy</strong>. O všetkom vás budeme informovať cez konverzáciu nižšie.',
    booking_no_addr:  'Zariadenie nám prosím zašlite na adresu, ktorú obdržíte v ďalšej správe.',
    booking_maps_label: '📍 Adresa servisu',
    booking_maps_btn:   '🗺️ Otvoriť v Google Maps',
    status_pending:   '⏳ Čaká na spracovanie',
    // Message notification
    msg_subject:      (n) => `Nová správa k objednávke #${n} – SSStylish Repair`,
    msg_preheader:    (n) => `Technik vám odpovedal na vašu objednávku #${n}.`,
    msg_greeting:     (name) => `Dobrý deň <strong style="color:#00d4ff;">${name}</strong>,`,
    msg_intro:        (n) => `K vašej objednávke <strong style="color:#00d4ff;">#${n}</strong> pribudla nová správa od nášho technika:`,
    msg_reply_hint:   'Pre odpoveď kliknite na tlačidlo nižšie a otvorte konverzáciu priamo v prehliadači.',
    // Status update
    status_subject:   (n) => `Aktualizácia objednávky #${n} – SSStylish Repair`,
    status_preheader: (n) => `Vaša objednávka #${n} bola aktualizovaná.`,
    status_greeting:  (name) => `Dobrý deň <strong style="color:#00d4ff;">${name}</strong>,`,
    status_intro:     (n) => `Stav vašej objednávky <strong style="color:#00d4ff;">#${n}</strong> bol aktualizovaný:`,
    status_labels: {
      pending:        '⏳ Čaká na spracovanie',
      confirmed:      '🔵 Potvrdená',
      diagnostics:    '🔬 Diagnostika',
      waiting_parts:  '⏸️ Čaká na diely',
      completed:      '✅ Dokončená',
      cancelled:      '❌ Zrušená',
    },
    status_hint:      'Celý priebeh môžete sledovať cez svoju konverzáciu.',
    price_offer:      (p) => `💰 Cenová ponuka technika: ${p} €`,
  },
};

/* ── Branded HTML email template ───────────────────────────── */
function buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, lang = 'sk' }) {
  const t = EMAIL_I18N[lang] || EMAIL_I18N.sk;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="${lang}">
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
              <div style="font-size:12px;color:#8892a4;margin-top:6px;letter-spacing:1px;text-transform:uppercase;">${t.tagline}</div>
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
                ${t.btn_open_conv}
              </a>
              <div style="margin-top:12px;font-size:12px;color:#4a5568;">
                ${t.btn_copy} <span style="color:#00d4ff;">${conversationUrl}</span>
              </div>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#0f1629;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#4a5568;text-align:center;">
                    © ${year} SSStylish Repair · ${t.tagline}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:#2d3748;text-align:center;padding-top:6px;">
                    ${t.footer_auto}
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

/* ── Public send helpers ────────────────────────────────────── */

/**
 * Send booking confirmation to customer.
 */
async function sendBookingConfirmation({ to, customerName, deviceModel, serviceName, orderNumber, conversationUrl, lang = 'sk' }) {
  const cfg = getSmtpSettings();
  if (!cfg) return;

  const t = EMAIL_I18N[lang] || EMAIL_I18N.sk;
  const shopAddress = process.env.SHOP_ADDRESS || '';
  const mapsLink = shopAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddress)}`
    : null;

  const subject = t.booking_subject(orderNumber);
  const preheader = t.booking_preheader(deviceModel);
  const bodyHtml = `
    <p>${t.booking_greeting(escHtml(customerName))}</p>
    <p>${t.booking_intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
      <tr style="background:#0f1629;">
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;width:40%;">${t.order_number}</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;font-weight:700;">#${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">${t.device}</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;">${escHtml(deviceModel)}</td>
      </tr>
      <tr style="background:#0f1629;">
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">${t.repair_type}</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;">${escHtml(serviceName || t.unknown_repair)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">${t.status_label}</td>
        <td style="padding:12px 16px;font-size:13px;"><span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${t.status_pending}</span></td>
      </tr>
    </table>

    <p>${t.booking_info}</p>
    ${mapsLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#0f1629;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.booking_maps_label}</p>
          <p style="margin:0 0 10px;font-size:14px;color:#e8eaf0;font-weight:600;">${escHtml(shopAddress)}</p>
          <a href="${mapsLink}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#0a0e1a;font-size:13px;font-weight:700;text-decoration:none;padding:9px 20px;border-radius:8px;">
            ${t.booking_maps_btn}
          </a>
        </td>
      </tr>
    </table>
    ` : `<p>${t.booking_no_addr}</p>`}
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, lang }),
  });
}

/**
 * Notify customer that admin posted a new message.
 */
async function sendMessageNotification({ to, customerName, orderNumber, adminMessage, conversationUrl, lang = 'sk' }) {
  const cfg = getSmtpSettings();
  if (!cfg) return;

  const t = EMAIL_I18N[lang] || EMAIL_I18N.sk;
  const subject = t.msg_subject(orderNumber);
  const preheader = t.msg_preheader(orderNumber);
  const bodyHtml = `
    <p>${t.msg_greeting(escHtml(customerName))}</p>
    <p>${t.msg_intro(orderNumber)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#0f1629;border-left:3px solid #00d4ff;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#e8eaf0;line-height:1.6;">
          ${escHtml(adminMessage)}
        </td>
      </tr>
    </table>

    <p>${t.msg_reply_hint}</p>
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, lang }),
  });
}

/**
 * Notify customer that admin updated the appointment status.
 */
async function sendStatusUpdateNotification({ to, customerName, orderNumber, newStatus, quotedPrice, conversationUrl, lang = 'sk' }) {
  const cfg = getSmtpSettings();
  if (!cfg) return;

  const t = EMAIL_I18N[lang] || EMAIL_I18N.sk;
  const statusLabel = t.status_labels[newStatus] || newStatus;

  const statusColor = {
    pending:       '#f59e0b',
    confirmed:     '#3b82f6',
    diagnostics:   '#a855f7',
    waiting_parts: '#f59e0b',
    completed:     '#10b981',
    cancelled:     '#ef4444',
  }[newStatus] || '#8892a4';

  const statusBg = {
    pending:       'rgba(245,158,11,0.15)',
    confirmed:     'rgba(59,130,246,0.15)',
    diagnostics:   'rgba(168,85,247,0.15)',
    waiting_parts: 'rgba(245,158,11,0.15)',
    completed:     'rgba(16,185,129,0.15)',
    cancelled:     'rgba(239,68,68,0.15)',
  }[newStatus] || 'rgba(136,146,164,0.15)';

  const subject = t.status_subject(orderNumber);
  const preheader = t.status_preheader(orderNumber);
  const bodyHtml = `
    <p>${t.status_greeting(escHtml(customerName))}</p>
    <p>${t.status_intro(orderNumber)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
      <tr style="background:#0f1629;">
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;width:40%;">${t.order_number}</td>
        <td style="padding:12px 16px;font-size:13px;color:#e8eaf0;font-weight:700;">#${orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#8892a4;">${t.status_label}</td>
        <td style="padding:12px 16px;font-size:13px;">
          <span style="background:${statusBg};color:${statusColor};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${statusLabel}</span>
        </td>
      </tr>
      ${quotedPrice != null ? `
      <tr style="background:#0f1629;">
        <td colspan="2" style="padding:12px 16px;font-size:14px;color:#00d4ff;font-weight:600;">
          ${t.price_offer(Number(quotedPrice).toFixed(2))}
        </td>
      </tr>` : ''}
    </table>

    <p>${t.status_hint}</p>
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, lang }),
  });
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { sendBookingConfirmation, sendMessageNotification, sendStatusUpdateNotification, getSmtpSettings, createTransport };
