/* ============================================================
   mailer.js – SSStyle Repair e-mail sender
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
    city:             'City',
    status_label:     'Status',
    // Booking confirmation
    booking_subject:  (n) => `Booking Confirmation #${n} – SSStyle Repair`,
    booking_preheader:(d) => `Your repair request for ${d} has been received.`,
    booking_greeting: (name) => `Hello <strong style="color:#00d4ff;">${name}</strong>,`,
    booking_intro:    'Your repair request has been successfully received. Here are your order details:',
    booking_info:     'Our technicians will review your request and <strong style="color:#00d4ff;">set a repair price</strong>. We will keep you informed via the conversation below.',
    booking_no_addr:  'Please send your device to the address you will receive in the next message.',
    booking_maps_label: '📍 Shop Address',
    booking_maps_btn:   '🗺️ Open in Google Maps',
    status_pending:   '⏳ Pending',
    // Message notification
    msg_subject:      (n) => `New message on order #${n} – SSStyle Repair`,
    msg_preheader:    (n) => `Your technician replied to order #${n}.`,
    msg_greeting:     (name) => `Hello <strong style="color:#00d4ff;">${name}</strong>,`,
    msg_intro:        (n) => `A new message was posted on your order <strong style="color:#00d4ff;">#${n}</strong> by our technician:`,
    msg_reply_hint:   'Click the button below to open the conversation directly in your browser.',
    // Status update
    status_subject:   (n) => `Order #${n} status update – SSStyle Repair`,
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
    // Review prompt (completed orders)
    review_heading:   '⭐ Share Your Experience',
    review_intro:     'We hope your repair went smoothly! We\'d love to hear your feedback.',
    review_btn:       '⭐ Leave a Review',
    review_hint:      'It only takes a minute and helps us improve our service.',
  },
  sk: {
    tagline:          'Vrátime vášmu mobilu štýlové SSS-rank nabíjanie',
    footer_auto:      'Táto správa bola odoslaná automaticky. Ak potrebujete pomoc, odpovedzte na tento e-mail alebo otvorte konverzáciu vyššie.',
    btn_open_conv:    '💬 Otvoriť konverzáciu',
    btn_copy:         'Alebo skopírujte tento odkaz:',
    order_number:     'Číslo objednávky',
    device:           'Zariadenie',
    repair_type:      'Typ opravy',
    city:             'Mesto',
    status_label:     'Stav',
    // Booking confirmation
    booking_subject:  (n) => `Potvrdenie rezervácie #${n} – SSStyle Repair`,
    booking_preheader:(d) => `Vaša oprava zariadenia ${d} bola prijatá.`,
    booking_greeting: (name) => `Dobrý deň <strong style="color:#00d4ff;">${name}</strong>,`,
    booking_intro:    'Vaša žiadosť o opravu bola úspešne prijatá. Tu sú detaily vašej objednávky:',
    booking_info:     'Naši technici si vašu žiadosť preštudujú a <strong style="color:#00d4ff;">stanovia cenu opravy</strong>. O všetkom vás budeme informovať cez konverzáciu nižšie.',
    booking_no_addr:  'Zariadenie nám prosím zašlite na adresu, ktorú obdržíte v ďalšej správe.',
    booking_maps_label: '📍 Adresa servisu',
    booking_maps_btn:   '🗺️ Otvoriť v Google Maps',
    status_pending:   '⏳ Čaká na spracovanie',
    // Message notification
    msg_subject:      (n) => `Nová správa k objednávke #${n} – SSStyle Repair`,
    msg_preheader:    (n) => `Technik vám odpovedal na vašu objednávku #${n}.`,
    msg_greeting:     (name) => `Dobrý deň <strong style="color:#00d4ff;">${name}</strong>,`,
    msg_intro:        (n) => `K vašej objednávke <strong style="color:#00d4ff;">#${n}</strong> pribudla nová správa od nášho technika:`,
    msg_reply_hint:   'Pre odpoveď kliknite na tlačidlo nižšie a otvorte konverzáciu priamo v prehliadači.',
    // Status update
    status_subject:   (n) => `Aktualizácia objednávky #${n} – SSStyle Repair`,
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
    // Review prompt (completed orders)
    review_heading:   '⭐ Ohodnoťte opravu',
    review_intro:     'Dúfame, že ste s opravou spokojní! Vaša spätná väzba je pre nás veľmi cenná.',
    review_btn:       '⭐ Napísať recenziu',
    review_hint:      'Zaberá to iba chvíľu a pomáha nám zlepšovať naše služby.',
  },
};

/* ── Branded HTML email template ───────────────────────────── */
function buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, reviewUrl, lang = 'sk' }) {
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

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0e1a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#131a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1535 0%,#1a103a 100%);padding:36px 48px;text-align:center;border-bottom:2px solid rgba(0,212,255,0.25);">
              <div style="font-size:30px;font-weight:800;color:#e8eaf0;letter-spacing:-0.5px;margin-bottom:6px;">
                <span style="color:#00d4ff;">SSS</span>tylish <span style="background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Repair</span>
              </div>
              <div style="font-size:12px;color:#8892a4;letter-spacing:1.5px;text-transform:uppercase;">${t.tagline}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;color:#e8eaf0;font-size:16px;line-height:1.75;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA button (conversation link) -->
          ${conversationUrl ? `
          <tr>
            <td style="padding:0 48px 32px;text-align:center;">
              <a href="${conversationUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#0a0e1a;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;letter-spacing:0.3px;">
                ${t.btn_open_conv}
              </a>
              <div style="margin-top:14px;font-size:12px;color:#4a5568;">
                ${t.btn_copy} <span style="color:#00d4ff;word-break:break-all;">${conversationUrl}</span>
              </div>
            </td>
          </tr>` : ''}

          <!-- Review CTA (completed orders) -->
          ${reviewUrl ? `
          <tr>
            <td style="padding:0 48px 36px;text-align:center;">
              <div style="background:#0f1629;border:1px solid rgba(250,204,21,0.25);border-radius:12px;padding:24px 28px;">
                <div style="font-size:18px;font-weight:700;color:#fbbf24;margin-bottom:8px;">${t.review_heading}</div>
                <div style="font-size:14px;color:#c4cdd8;margin-bottom:18px;line-height:1.6;">${t.review_intro}</div>
                <a href="${reviewUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
                  ${t.review_btn}
                </a>
                <div style="margin-top:12px;font-size:12px;color:#4a5568;">${t.review_hint}</div>
              </div>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#0a0e1a;padding:24px 48px;border-top:1px solid rgba(255,255,255,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#4a5568;text-align:center;">
                    © ${year} SSStyle Repair · ${t.tagline}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:#2d3748;text-align:center;padding-top:8px;line-height:1.6;">
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
async function sendBookingConfirmation({ to, customerName, deviceModel, serviceName, orderNumber, conversationUrl, lang = 'sk', customerCity = null }) {
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
    <p style="margin:0 0 20px;font-size:17px;">${t.booking_greeting(escHtml(customerName))}</p>
    <p style="margin:0 0 24px;color:#c4cdd8;">${t.booking_intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
      <tr style="background:#0f1629;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;width:42%;">${t.order_number}</td>
        <td style="padding:14px 20px;font-size:15px;color:#00d4ff;font-weight:700;">#${orderNumber}</td>
      </tr>
      <tr style="background:#1a2240;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.device}</td>
        <td style="padding:14px 20px;font-size:15px;color:#e8eaf0;font-weight:600;">${escHtml(deviceModel)}</td>
      </tr>
      <tr style="background:#0f1629;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.repair_type}</td>
        <td style="padding:14px 20px;font-size:15px;color:#e8eaf0;">${escHtml(serviceName || t.unknown_repair)}</td>
      </tr>
      ${customerCity ? `
      <tr style="background:#1a2240;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.city || 'City'}</td>
        <td style="padding:14px 20px;font-size:15px;color:#e8eaf0;">${escHtml(customerCity)}</td>
      </tr>` : ''}
      <tr style="${customerCity ? 'background:#0f1629;' : 'background:#1a2240;'}">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.status_label}</td>
        <td style="padding:14px 20px;"><span style="background:rgba(245,158,11,0.18);color:#f59e0b;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid rgba(245,158,11,0.3);">${t.status_pending}</span></td>
      </tr>
    </table>

    <p style="margin:0 0 24px;color:#c4cdd8;line-height:1.75;">${t.booking_info}</p>
    ${mapsLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:#0f1629;border-left:4px solid #00d4ff;border-radius:0 10px 10px 0;padding:18px 22px;">
          <p style="margin:0 0 6px;font-size:12px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.booking_maps_label}</p>
          <p style="margin:0 0 14px;font-size:15px;color:#e8eaf0;font-weight:600;">${escHtml(shopAddress)}</p>
          <a href="${mapsLink}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#0a0e1a;font-size:14px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;">
            ${t.booking_maps_btn}
          </a>
        </td>
      </tr>
    </table>
    ` : `<p style="margin:0;color:#c4cdd8;">${t.booking_no_addr}</p>`}
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    replyTo: 'support@ssstyle.store',
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
    <p style="margin:0 0 20px;font-size:17px;">${t.msg_greeting(escHtml(customerName))}</p>
    <p style="margin:0 0 20px;color:#c4cdd8;">${t.msg_intro(orderNumber)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f1629;border-left:4px solid #00d4ff;border-radius:0 10px 10px 0;padding:18px 22px;font-size:15px;color:#e8eaf0;line-height:1.75;">
          ${escHtml(adminMessage)}
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#c4cdd8;">${t.msg_reply_hint}</p>
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    replyTo: 'support@ssstyle.store',
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, lang }),
  });
}

/**
 * Notify customer that admin updated the appointment status.
 */
async function sendStatusUpdateNotification({ to, customerName, orderNumber, newStatus, quotedPrice, conversationUrl, customerEmail, lang = 'sk' }) {
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
    pending:       'rgba(245,158,11,0.18)',
    confirmed:     'rgba(59,130,246,0.18)',
    diagnostics:   'rgba(168,85,247,0.18)',
    waiting_parts: 'rgba(245,158,11,0.18)',
    completed:     'rgba(16,185,129,0.18)',
    cancelled:     'rgba(239,68,68,0.18)',
  }[newStatus] || 'rgba(136,146,164,0.18)';

  const statusBorder = {
    pending:       'rgba(245,158,11,0.3)',
    confirmed:     'rgba(59,130,246,0.3)',
    diagnostics:   'rgba(168,85,247,0.3)',
    waiting_parts: 'rgba(245,158,11,0.3)',
    completed:     'rgba(16,185,129,0.3)',
    cancelled:     'rgba(239,68,68,0.3)',
  }[newStatus] || 'rgba(136,146,164,0.3)';

  // Build review URL for completed orders
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const reviewUrl = (newStatus === 'completed' && customerEmail)
    ? `${baseUrl}/track?id=${orderNumber}&email=${encodeURIComponent(customerEmail)}`
    : null;

  const subject = t.status_subject(orderNumber);
  const preheader = t.status_preheader(orderNumber);
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:17px;">${t.status_greeting(escHtml(customerName))}</p>
    <p style="margin:0 0 24px;color:#c4cdd8;">${t.status_intro(orderNumber)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
      <tr style="background:#0f1629;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;width:42%;">${t.order_number}</td>
        <td style="padding:14px 20px;font-size:15px;color:#00d4ff;font-weight:700;">#${orderNumber}</td>
      </tr>
      <tr style="background:#1a2240;">
        <td style="padding:14px 20px;font-size:13px;color:#8892a4;text-transform:uppercase;letter-spacing:0.5px;">${t.status_label}</td>
        <td style="padding:14px 20px;">
          <span style="background:${statusBg};color:${statusColor};padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid ${statusBorder};">${statusLabel}</span>
        </td>
      </tr>
      ${quotedPrice != null ? `
      <tr style="background:#0f1629;">
        <td colspan="2" style="padding:16px 20px;font-size:15px;color:#00d4ff;font-weight:700;">
          ${t.price_offer(Number(quotedPrice).toFixed(2))}
        </td>
      </tr>` : ''}
    </table>

    <p style="margin:0;color:#c4cdd8;">${t.status_hint}</p>
  `;

  const transport = createTransport(cfg);
  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    replyTo: 'support@ssstyle.store',
    to,
    subject,
    html: buildEmailHtml({ subject, preheader, bodyHtml, conversationUrl, reviewUrl, lang }),
  });
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { sendBookingConfirmation, sendMessageNotification, sendStatusUpdateNotification, getSmtpSettings, createTransport };
