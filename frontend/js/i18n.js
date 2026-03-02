/* ============================================================
   i18n.js – FixPhone language module (English / Slovak)
   ============================================================ */

const TRANSLATIONS = {
  en: {
    /* ── Navigation ── */
    'nav.services':    'Services',
    'nav.how-it-works':'How It Works',
    'nav.book-now':    'Book Now',

    /* ── Hero ── */
    'hero.badge':            '✅ Same-Day Service Available',
    'hero.title1':           'Expert Phone Repairs',
    'hero.title2':           'You Can Trust',
    'hero.subtitle':         'From cracked screens to dead batteries, our certified technicians fix all major phone models quickly using genuine parts — with a satisfaction guarantee.',
    'hero.cta-book':         '📅 Book a Repair',
    'hero.cta-services':     '🔍 View Services',
    'hero.stat1-label':      'Devices Fixed',
    'hero.stat2-label':      'Customer Rating',
    'hero.stat3-label':      'Avg Repair Time',
    'hero.phone-warranty':   '🛡️ 90-Day Warranty',
    'hero.phone-title':      'Repair in Progress',
    'hero.phone-subtitle':   'Running diagnostics...',
    'hero.phone-ready':      '⚡ Ready in 60 min',

    /* ── Services section ── */
    'services.tag':       'Our Services',
    'services.title':     'Repairs for Every Problem',
    'services.subtitle':  'We handle all major repairs with genuine parts and expert care. Browse our full range of services below.',
    'services.in-stock':  '✓ In Stock',
    'services.out-stock': '✗ Unavailable',
    'services.empty':     'No services available yet.',
    'services.error':     'Failed to load services. Please try again.',

    /* ── How It Works ── */
    'how.tag':         'Process',
    'how.title':       'How It Works',
    'how.subtitle':    "Getting your phone fixed is simple. Three easy steps and you're back up and running.",
    'how.step1-title': 'Choose a Service',
    'how.step1-desc':  "Browse our repair options and select the service that matches your device's issue. We support all major brands and models.",
    'how.step2-title': 'Book Appointment',
    'how.step2-desc':  'Pick a convenient date and time. Fill in your contact details and device info — takes less than 2 minutes.',
    'how.step3-title': 'Get It Fixed',
    'how.step3-desc':  'Bring your device to our shop. Our certified technicians will have it repaired and ready to go — often within the hour.',

    /* ── Booking form ── */
    'booking.tag':              'Book Now',
    'booking.title':            'Schedule a Repair',
    'booking.subtitle':         "Fill in the form below and we'll confirm your appointment within the hour.",
    'booking.name-label':       'Full Name',
    'booking.name-ph':          'John Smith',
    'booking.email-label':      'Email Address',
    'booking.email-ph':         'john@example.com',
    'booking.phone-label':      'Phone Number',
    'booking.phone-ph':         '+1 (555) 000-0000',
    'booking.device-label':     'Device Model',
    'booking.device-ph':        'e.g. iPhone 14, Samsung S23',
    'booking.service-label':    'Service',
    'booking.service-default':  'Select a service (optional)',
    'booking.date-label':       'Preferred Date',
    'booking.notes-label':      'Additional Notes',
    'booking.notes-ph':         'Describe the issue or any other relevant details...',
    'booking.submit':           '📅 Book My Appointment',
    'booking.submitting':       '⏳ Booking...',

    /* ── Footer ── */
    'footer.desc':            'Professional phone repair services with a satisfaction guarantee. We fix all major brands with genuine parts and expert care.',
    'footer.quick-links':     'Quick Links',
    'footer.svc-heading':     'Services',
    'footer.book-appt':       'Book Appointment',
    'footer.admin':           'Admin Panel',
    'footer.screen':          'Screen Repair',
    'footer.battery':         'Battery Replacement',
    'footer.water':           'Water Damage',
    'footer.software':        'Software Issues',
    'footer.rights':          'All rights reserved.',
    'footer.hours':           'Hours: Mon–Sat 9am–7pm · Sun 10am–5pm',

    /* ── Form validation ── */
    'val.name-required':    'Full name is required.',
    'val.email-required':   'Email address is required.',
    'val.email-invalid':    'Please enter a valid email address.',
    'val.phone-required':   'Phone number is required.',
    'val.device-required':  'Device model is required.',
    'val.date-required':    'Appointment date is required.',

    /* ── Toasts (main) ── */
    'toast.val-error':      'Validation Error',
    'toast.booked-title':   'Appointment Booked!',
    'toast.booked-msg':     "We'll see you on {date}. Confirmation sent to {email}.",
    'toast.book-fail':      'Booking Failed',
    'toast.something-wrong':'Something went wrong. Please try again.',

    /* ── Admin sidebar ── */
    'admin.menu-label':     'Main Menu',
    'admin.dashboard':      'Dashboard',
    'admin.orders':         'Orders',
    'admin.services':       'Services',
    'admin.repair-types':   'Repair Types',
    'admin.view-website':   '🏠 View Website',

    /* ── Admin topbar ── */
    'admin.subtitle':           'Manage your repair business',
    'admin.tab.dashboard':      'Dashboard',
    'admin.tab.orders':         'All Appointments',
    'admin.tab.services':       'Services',
    'admin.tab.repair-types':   'Repair Types',

    /* ── Admin stats ── */
    'admin.total-orders':   'Total Orders',
    'admin.all-time':       '↑ All time',
    'admin.pending':        'Pending',
    'admin.needs-attention':'Needs attention',
    'admin.completed':      'Completed',
    'admin.great-work':     '↑ Great work!',
    'admin.revenue':        'Revenue',
    'admin.completed-orders':'Completed orders',

    /* ── Admin dashboard table ── */
    'admin.recent-orders':  'Recent Orders',
    'admin.view-all':       'View All →',
    'admin.col.num':        '#',
    'admin.col.customer':   'Customer',
    'admin.col.device':     'Device',
    'admin.col.service':    'Service',
    'admin.col.date':       'Date',
    'admin.col.status':     'Status',
    'admin.col.contact':    'Contact',
    'admin.col.actions':    'Actions',
    'admin.action.edit':    'Edit',
    'admin.action.delete':  'Delete',

    /* ── Admin orders tab ── */
    'admin.all-appts':      'All Appointments',
    'admin.search-ph':      'Search orders...',
    'admin.filter.all':       'All',
    'admin.filter.pending':   'Pending',
    'admin.filter.confirmed': 'Confirmed',
    'admin.filter.completed': 'Completed',
    'admin.filter.cancelled': 'Cancelled',

    /* ── Admin services tab ── */
    'admin.add-service':    '+ Add Service',
    'admin.col.name':       'Name',
    'admin.col.repair-type':'Repair Type',
    'admin.col.price':      'Price',
    'admin.col.duration':   'Duration',
    'admin.col.stock':      'Stock',

    /* ── Admin repair-types tab ── */
    'admin.add-repair-type': '+ Add Repair Type',
    'admin.col.description': 'Description',
    'admin.col.created':     'Created',

    /* ── Admin modals ── */
    'modal.update-status':    'Update Appointment Status',
    'modal.customer':         'Customer',
    'modal.status':           'Status',
    'modal.cancel':           'Cancel',
    'modal.save-changes':     'Save Changes',
    'modal.add-service':      'Add Service',
    'modal.edit-service':     'Edit Service',
    'modal.service-name':     'Service Name *',
    'modal.repair-type':      'Repair Type',
    'modal.select-repair-type':'— Select repair type —',
    'modal.description':      'Description',
    'modal.price':            'Price ($) *',
    'modal.duration':         'Duration (minutes)',
    'modal.stock-status':     'Stock Status',
    'modal.in-stock':         '✅ In Stock',
    'modal.out-of-stock':     '❌ Out of Stock',
    'modal.save-service':     'Save Service',
    'modal.add-repair-type':  'Add Repair Type',
    'modal.edit-repair-type': 'Edit Repair Type',
    'modal.name':             'Name *',
    'modal.save':             'Save',

    /* ── Admin status badges ── */
    'status.pending':   '⏳ Pending',
    'status.confirmed': '🔵 Confirmed',
    'status.completed': '✅ Completed',
    'status.cancelled': '❌ Cancelled',

    /* ── Admin stock ── */
    'stock.in':  '✓ In Stock',
    'stock.out': '✗ Out of Stock',

    /* ── Admin empty states ── */
    'empty.no-appts':       'No appointments yet',
    'empty.no-orders':      'No orders found',
    'empty.no-orders-sub':  'Try adjusting filters or search terms',
    'empty.no-services':    'No services yet',
    'empty.no-services-sub':'Click "Add Service" to create your first service',
    'empty.no-types':       'No repair types yet',

    /* ── Admin count labels ── */
    'count.showing':      'Showing {n} of {total} total',
    'count.appts':        '{n} appointment',
    'count.appts-plural': '{n} appointments',
    'count.services':     '{n} service',
    'count.services-plural':'{n} services',
    'count.types':        '{n} type',
    'count.types-plural': '{n} types',

    /* ── Admin toasts ── */
    'admin.toast.load-error':       'Load Error',
    'admin.toast.load-error-msg':   'Failed to load data from the server.',
    'admin.toast.status-updated':   'Status Updated',
    'admin.toast.update-failed':    'Update Failed',
    'admin.toast.save-failed':      'Save Failed',
    'admin.toast.delete-failed':    'Delete Failed',
    'admin.toast.val':              'Validation',
    'admin.toast.val-name':         'Service name is required.',
    'admin.toast.val-price':        'Valid price is required.',
    'admin.toast.val-type-name':    'Repair type name is required.',
    'admin.toast.svc-updated':      'Service Updated',
    'admin.toast.svc-created':      'Service Created',
    'admin.toast.svc-deleted':      'Service Deleted',
    'admin.toast.type-updated':     'Type Updated',
    'admin.toast.type-created':     'Type Created',
    'admin.toast.type-deleted':     'Type Deleted',

    /* ── Admin confirm dialogs ── */
    'confirm.delete-service':    'Delete service "{name}"? This action cannot be undone.',
    'confirm.delete-type':       'Delete repair type "{name}"? This action cannot be undone.',

    /* ── Admin service description placeholders ── */
    'admin.svc-name-ph':    'e.g. iPhone 15 Screen Replacement',
    'admin.svc-desc-ph':    'Brief description of the service...',
    'admin.rt-name-ph':     'e.g. Screen Repair',
    'admin.rt-desc-ph':     'Brief description...',
    'admin.search-orders-ph':'Search orders...',
  },

  sk: {
    /* ── Navigation ── */
    'nav.services':    'Služby',
    'nav.how-it-works':'Ako to funguje',
    'nav.book-now':    'Rezervovať',

    /* ── Hero ── */
    'hero.badge':            '✅ Servis v ten istý deň',
    'hero.title1':           'Odborné opravy telefónov',
    'hero.title2':           'Ktorým môžete veriť',
    'hero.subtitle':         'Od prasklých obrazoviek až po vybité batérie – naši certifikovaní technici rýchlo opravia všetky hlavné modely telefónov s použitím originálnych dielov a zárukou spokojnosti.',
    'hero.cta-book':         '📅 Rezervovať opravu',
    'hero.cta-services':     '🔍 Zobraziť služby',
    'hero.stat1-label':      'Opravených zariadení',
    'hero.stat2-label':      'Hodnotenie zákazníkov',
    'hero.stat3-label':      'Priem. čas opravy',
    'hero.phone-warranty':   '🛡️ 90-dňová záruka',
    'hero.phone-title':      'Oprava prebieha',
    'hero.phone-subtitle':   'Spúšťanie diagnostiky...',
    'hero.phone-ready':      '⚡ Hotové do 60 min',

    /* ── Services section ── */
    'services.tag':       'Naše služby',
    'services.title':     'Opravy pre každý problém',
    'services.subtitle':  'Zabezpečujeme všetky hlavné opravy s originálnymi dielmi a odbornou starostlivosťou. Prezrite si celú ponuku služieb.',
    'services.in-stock':  '✓ Skladom',
    'services.out-stock': '✗ Nedostupné',
    'services.empty':     'Zatiaľ nie sú k dispozícii žiadne služby.',
    'services.error':     'Nepodarilo sa načítať služby. Skúste to prosím znova.',

    /* ── How It Works ── */
    'how.tag':         'Postup',
    'how.title':       'Ako to funguje',
    'how.subtitle':    'Oprava vášho telefónu je jednoduchá. Tri jednoduché kroky a ste späť v prevádzke.',
    'how.step1-title': 'Vyberte si službu',
    'how.step1-desc':  'Prezerajte naše možnosti opráv a vyberte si službu, ktorá zodpovedá problému vášho zariadenia. Podporujeme všetky hlavné značky a modely.',
    'how.step2-title': 'Rezervujte termín',
    'how.step2-desc':  'Vyberte si vhodný dátum a čas. Vyplňte kontaktné údaje a informácie o zariadení – trvá to menej ako 2 minúty.',
    'how.step3-title': 'Dajte to opraviť',
    'how.step3-desc':  'Prineste zariadenie do nášho servisu. Naši certifikovaní technici ho opravia a dostanete ho späť – často do hodiny.',

    /* ── Booking form ── */
    'booking.tag':              'Rezervovať',
    'booking.title':            'Naplánovať opravu',
    'booking.subtitle':         'Vyplňte formulár nižšie a potvrdíme vašu rezerváciu do hodiny.',
    'booking.name-label':       'Celé meno',
    'booking.name-ph':          'Ján Novák',
    'booking.email-label':      'E-mailová adresa',
    'booking.email-ph':         'jan@priklad.sk',
    'booking.phone-label':      'Telefónne číslo',
    'booking.phone-ph':         '+421 900 000 000',
    'booking.device-label':     'Model zariadenia',
    'booking.device-ph':        'napr. iPhone 14, Samsung S23',
    'booking.service-label':    'Služba',
    'booking.service-default':  'Vyberte službu (nepovinné)',
    'booking.date-label':       'Preferovaný dátum',
    'booking.notes-label':      'Ďalšie poznámky',
    'booking.notes-ph':         'Opíšte problém alebo iné relevantné detaily...',
    'booking.submit':           '📅 Rezervovať termín',
    'booking.submitting':       '⏳ Rezervujem...',

    /* ── Footer ── */
    'footer.desc':            'Profesionálne opravy telefónov so zárukou spokojnosti. Opravujeme všetky hlavné značky s originálnymi dielmi a odbornou starostlivosťou.',
    'footer.quick-links':     'Rýchle odkazy',
    'footer.svc-heading':     'Služby',
    'footer.book-appt':       'Rezervovať termín',
    'footer.admin':           'Administrácia',
    'footer.screen':          'Oprava obrazovky',
    'footer.battery':         'Výmena batérie',
    'footer.water':           'Poškodenie vodou',
    'footer.software':        'Softvérové problémy',
    'footer.rights':          'Všetky práva vyhradené.',
    'footer.hours':           'Otváracie hodiny: Po–So 9:00–19:00 · Ne 10:00–17:00',

    /* ── Form validation ── */
    'val.name-required':    'Celé meno je povinné.',
    'val.email-required':   'E-mailová adresa je povinná.',
    'val.email-invalid':    'Zadajte platnú e-mailovú adresu.',
    'val.phone-required':   'Telefónne číslo je povinné.',
    'val.device-required':  'Model zariadenia je povinný.',
    'val.date-required':    'Dátum termínu je povinný.',

    /* ── Toasts (main) ── */
    'toast.val-error':      'Chyba validácie',
    'toast.booked-title':   'Termín rezervovaný!',
    'toast.booked-msg':     'Uvidíme sa {date}. Potvrdenie bolo odoslané na {email}.',
    'toast.book-fail':      'Rezervácia zlyhala',
    'toast.something-wrong':'Niečo sa pokazilo. Skúste to prosím znova.',

    /* ── Admin sidebar ── */
    'admin.menu-label':     'Hlavné menu',
    'admin.dashboard':      'Prehľad',
    'admin.orders':         'Objednávky',
    'admin.services':       'Služby',
    'admin.repair-types':   'Typy opráv',
    'admin.view-website':   '🏠 Zobraziť web',

    /* ── Admin topbar ── */
    'admin.subtitle':           'Spravujte svoj opravárenský biznis',
    'admin.tab.dashboard':      'Prehľad',
    'admin.tab.orders':         'Všetky rezervácie',
    'admin.tab.services':       'Služby',
    'admin.tab.repair-types':   'Typy opráv',

    /* ── Admin stats ── */
    'admin.total-orders':    'Celkové objednávky',
    'admin.all-time':        '↑ Za celú dobu',
    'admin.pending':         'Čakajúce',
    'admin.needs-attention': 'Vyžaduje pozornosť',
    'admin.completed':       'Dokončené',
    'admin.great-work':      '↑ Skvelá práca!',
    'admin.revenue':         'Tržby',
    'admin.completed-orders':'Dokončené objednávky',

    /* ── Admin dashboard table ── */
    'admin.recent-orders':  'Nedávne objednávky',
    'admin.view-all':       'Zobraziť všetky →',
    'admin.col.num':        '#',
    'admin.col.customer':   'Zákazník',
    'admin.col.device':     'Zariadenie',
    'admin.col.service':    'Služba',
    'admin.col.date':       'Dátum',
    'admin.col.status':     'Stav',
    'admin.col.contact':    'Kontakt',
    'admin.col.actions':    'Akcie',
    'admin.action.edit':    'Upraviť',
    'admin.action.delete':  'Odstrániť',

    /* ── Admin orders tab ── */
    'admin.all-appts':      'Všetky rezervácie',
    'admin.search-ph':      'Hľadať objednávky...',
    'admin.filter.all':       'Všetky',
    'admin.filter.pending':   'Čakajúce',
    'admin.filter.confirmed': 'Potvrdené',
    'admin.filter.completed': 'Dokončené',
    'admin.filter.cancelled': 'Zrušené',

    /* ── Admin services tab ── */
    'admin.add-service':    '+ Pridať službu',
    'admin.col.name':       'Názov',
    'admin.col.repair-type':'Typ opravy',
    'admin.col.price':      'Cena',
    'admin.col.duration':   'Trvanie',
    'admin.col.stock':      'Sklad',

    /* ── Admin repair-types tab ── */
    'admin.add-repair-type': '+ Pridať typ opravy',
    'admin.col.description': 'Popis',
    'admin.col.created':     'Vytvorené',

    /* ── Admin modals ── */
    'modal.update-status':    'Aktualizovať stav rezervácie',
    'modal.customer':         'Zákazník',
    'modal.status':           'Stav',
    'modal.cancel':           'Zrušiť',
    'modal.save-changes':     'Uložiť zmeny',
    'modal.add-service':      'Pridať službu',
    'modal.edit-service':     'Upraviť službu',
    'modal.service-name':     'Názov služby *',
    'modal.repair-type':      'Typ opravy',
    'modal.select-repair-type':'— Vyberte typ opravy —',
    'modal.description':      'Popis',
    'modal.price':            'Cena (€) *',
    'modal.duration':         'Trvanie (minúty)',
    'modal.stock-status':     'Stav skladu',
    'modal.in-stock':         '✅ Skladom',
    'modal.out-of-stock':     '❌ Vypredané',
    'modal.save-service':     'Uložiť službu',
    'modal.add-repair-type':  'Pridať typ opravy',
    'modal.edit-repair-type': 'Upraviť typ opravy',
    'modal.name':             'Názov *',
    'modal.save':             'Uložiť',

    /* ── Admin status badges ── */
    'status.pending':   '⏳ Čakajúce',
    'status.confirmed': '🔵 Potvrdené',
    'status.completed': '✅ Dokončené',
    'status.cancelled': '❌ Zrušené',

    /* ── Admin stock ── */
    'stock.in':  '✓ Skladom',
    'stock.out': '✗ Vypredané',

    /* ── Admin empty states ── */
    'empty.no-appts':        'Zatiaľ žiadne rezervácie',
    'empty.no-orders':       'Žiadne objednávky',
    'empty.no-orders-sub':   'Skúste upraviť filtre alebo vyhľadávacie výrazy',
    'empty.no-services':     'Zatiaľ žiadne služby',
    'empty.no-services-sub': 'Kliknite na „Pridať službu" a vytvorte prvú službu',
    'empty.no-types':        'Zatiaľ žiadne typy opráv',

    /* ── Admin count labels ── */
    'count.showing':         'Zobrazujem {n} z {total} celkových',
    'count.appts':           '{n} rezervácia',
    'count.appts-plural':    '{n} rezervácií',
    'count.services':        '{n} služba',
    'count.services-plural': '{n} služieb',
    'count.types':           '{n} typ',
    'count.types-plural':    '{n} typov',

    /* ── Admin toasts ── */
    'admin.toast.load-error':       'Chyba načítania',
    'admin.toast.load-error-msg':   'Nepodarilo sa načítať dáta zo servera.',
    'admin.toast.status-updated':   'Stav aktualizovaný',
    'admin.toast.update-failed':    'Aktualizácia zlyhala',
    'admin.toast.save-failed':      'Uloženie zlyhalo',
    'admin.toast.delete-failed':    'Odstránenie zlyhalo',
    'admin.toast.val':              'Validácia',
    'admin.toast.val-name':         'Názov služby je povinný.',
    'admin.toast.val-price':        'Vyžaduje sa platná cena.',
    'admin.toast.val-type-name':    'Názov typu opravy je povinný.',
    'admin.toast.svc-updated':      'Služba aktualizovaná',
    'admin.toast.svc-created':      'Služba vytvorená',
    'admin.toast.svc-deleted':      'Služba odstránená',
    'admin.toast.type-updated':     'Typ aktualizovaný',
    'admin.toast.type-created':     'Typ vytvorený',
    'admin.toast.type-deleted':     'Typ odstránený',

    /* ── Admin confirm dialogs ── */
    'confirm.delete-service': 'Odstrániť službu „{name}"? Túto akciu nie je možné vrátiť späť.',
    'confirm.delete-type':    'Odstrániť typ opravy „{name}"? Túto akciu nie je možné vrátiť späť.',

    /* ── Admin placeholders ── */
    'admin.svc-name-ph':     'napr. Výmena obrazovky iPhone 15',
    'admin.svc-desc-ph':     'Stručný popis služby...',
    'admin.rt-name-ph':      'napr. Oprava obrazovky',
    'admin.rt-desc-ph':      'Stručný popis...',
    'admin.search-orders-ph':'Hľadať objednávky...',
  }
};

// ─── Core translation function ─────────────────────────────
let _lang = 'en';

/**
 * Translate a key. Supports {placeholder} substitution.
 * @param {string} key
 * @param {Object} [vars]  e.g. { name: 'iPhone' }
 * @returns {string}
 */
function t(key, vars) {
  const dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    });
  }
  return str;
}

// ─── Apply translations to DOM ─────────────────────────────
function applyTranslations() {
  // text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  // placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Update <html lang> attribute
  document.documentElement.lang = _lang;
  // Update toggle button label (shows the OTHER language)
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = _lang === 'en' ? 'SK' : 'EN';
    btn.setAttribute('aria-label', _lang === 'en' ? 'Prepnúť na slovenčinu' : 'Switch to English');
  });
}

// ─── Set & persist language ────────────────────────────────
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  _lang = lang;
  try { localStorage.setItem('fixphone-lang', lang); } catch (_) {}
  applyTranslations();
}

function currentLang() { return _lang; }

// ─── Auto-init ─────────────────────────────────────────────
(function init() {
  let saved = 'en';
  try { saved = localStorage.getItem('fixphone-lang') || 'en'; } catch (_) {}
  if (!TRANSLATIONS[saved]) saved = 'en';
  _lang = saved;
  // Apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }
})();

// ─── Expose globals ────────────────────────────────────────
window.t           = t;
window.setLanguage = setLanguage;
window.currentLang = currentLang;
