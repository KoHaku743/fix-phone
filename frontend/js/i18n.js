/* ============================================================
   i18n.js – FixPhone language module (English / Slovak)
   ============================================================ */

const TRANSLATIONS = {
  en: {
    /* ── Navigation ── */
    'nav.services':    'Services',
    'nav.how-it-works':'How It Works',
    'nav.book-now':    'Book Now',

    /* ── Services prices ── */
    'services.price-from':       'From',
    'services.price-up-to':      'Up to',
    'services.price-on-request': 'Price on request',

    /* ── Hero ── */
    'hero.badge':            '⚡ SSS-rank quality service',
    'hero.title1':           'Expert Phone Repairs',
    'hero.title2':           'SSS-rank Style',
    'hero.subtitle':         "We return SSS-rank charging to your phone. Send your device by post – fast, convenient, with genuine parts.",
    'hero.cta-book':         '📦 Send for Repair',
    'hero.cta-services':     '🔍 View Services',
    'hero.stat1-label':      'SSS-rank quality',
    'hero.stat2-label':      'Certified technicians',
    'hero.stat3-label':      'Fast turnaround',
    'hero.phone-warranty':   '🛡️ 90-Day Warranty',
    'hero.phone-title':      'Repair in Progress',
    'hero.phone-subtitle':   'SSS-rank service...',
    'hero.phone-ready':      '📦 Ship by post',

    /* ── Services section ── */
    'services.tag':       'Our Services',
    'services.title':     'Repairs for Every Problem',
    'services.subtitle':  'We handle all major repairs with genuine parts. Prices are estimates – exact price is set after receiving your device.',
    'services.in-stock':  '✓ Available',
    'services.out-stock': '✗ Unavailable',
    'services.empty':     'No services available yet.',
    'services.error':     'Failed to load services. Please try again.',

    /* ── How It Works ── */
    'how.tag':         'Process',
    'how.title':       'How It Works',
    'how.subtitle':    "Getting your phone fixed is simple. Fill in the form and ship your device – we handle the rest.",
    'how.step1-title': 'Choose a Repair',
    'how.step1-desc':  "Browse our repair options and select the service that matches your device's issue. Exact price is set after we receive your phone.",
    'how.step2-title': 'Ship Your Phone',
    'how.step2-desc':  'Fill in the form and ship your device via Packeta or other courier. You will receive the shipping address by e-mail.',
    'how.step3-title': 'Get It Back Fixed',
    'how.step3-desc':  "After the repair, we'll ship your device back to you. Track everything via the conversation link sent to your e-mail.",

    /* ── Booking form ── */
    'booking.tag':              'Send for Repair',
    'booking.title':            'Request a Repair',
    'booking.subtitle':         "Fill in the form below. After receiving your device, we'll send you the exact price and instructions.",
    'booking.name-label':       'Full Name',
    'booking.name-ph':          'John Smith',
    'booking.email-label':      'Email Address',
    'booking.email-ph':         'john@example.com',
    'booking.phone-label':      'Phone Number',
    'booking.phone-ph':         '+421 900 000 000',
    'booking.device-label':     'Device Model',
    'booking.device-ph':        'e.g. iPhone 14, Samsung S23',
    'booking.service-label':    'Repair Type',
    'booking.service-default':  'Select repair type',
    'booking.notes-label':      'Problem Description',
    'booking.notes-ph':         'Describe the issue or any other relevant details...',
    'booking.submit':           '📦 Submit Repair Request',
    'booking.submitting':       '⏳ Submitting...',

    /* ── Footer ── */
    'footer.desc':            'We return SSS-rank charging to your phone. Professional repairs with genuine parts and satisfaction guarantee.',
    'footer.quick-links':     'Quick Links',
    'footer.svc-heading':     'Services',
    'footer.book-appt':       'Send for Repair',
    'footer.track-order':     'Track Order',
    'footer.admin':           'Admin Panel',
    'footer.screen':          'Screen Repair',
    'footer.battery':         'Battery Replacement',
    'footer.water':           'Water Damage',
    'footer.software':        'Software Issues',
    'footer.rights':          'All rights reserved.',

    /* ── Form validation ── */
    'val.name-required':    'Full name is required.',
    'val.email-required':   'Email address is required.',
    'val.email-invalid':    'Please enter a valid email address.',
    'val.phone-required':   'Phone number is required.',
    'val.device-required':  'Device model is required.',
    'val.service-required': 'Please select a repair type.',

    /* ── Toasts (main) ── */
    'toast.val-error':      'Validation Error',
    'toast.booked-title':   'Request Submitted!',
    'toast.booked-msg':     "Thank you! We'll be in touch via {email} once we receive your device.",
    'toast.book-fail':      'Submission Failed',
    'toast.something-wrong':'Something went wrong. Please try again.',

    /* ── Admin sidebar ── */
    'admin.menu-label':     'Main Menu',
    'admin.dashboard':      'Dashboard',
    'admin.orders':         'Orders',
    'admin.services':       'Services',
    'admin.repair-types':   'Repair Types',
    'admin.inventory':      'Inventory',
    'admin.settings':       'Settings',
    'admin.view-website':   '🏠 View Website',

    /* ── Admin topbar ── */
    'admin.subtitle':             'Manage your repair business',
    'admin.tab.dashboard':        'Dashboard',
    'admin.tab.orders':           'All Appointments',
    'admin.tab.services':         'Services',
    'admin.tab.repair-types':     'Repair Types',
    'admin.tab.inventory':        'Inventory',
    'admin.tab.settings':         'Settings',

    /* ── Admin stats ── */
    'admin.total-orders':   'Total Orders',
    'admin.all-time':       '↑ All time',
    'admin.pending':        'Pending',
    'admin.needs-attention':'Needs attention',
    'admin.completed':      'Completed',
    'admin.great-work':     '↑ Great work!',
    'admin.revenue':        'Revenue',
    'admin.completed-orders':'Completed orders',
    'admin.today-orders':   "Today's Orders",
    'admin.today-desc':     'New today',
    'admin.monthly-revenue':'Monthly Revenue',
    'admin.this-month':     'This month',
    'admin.top-models':     'Top Device Models',
    'admin.top-models-sub': 'Most frequent repairs',

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
    'admin.add-service':     '+ Add Service',
    'admin.col.name':        'Name',
    'admin.col.repair-type': 'Repair Type',
    'admin.col.price':       'Price',
    'admin.col.price-range': 'Price Range',
    'admin.col.stock':       'Stock',

    /* ── Admin settings ── */
    'admin.settings':          'Settings',
    'admin.settings-subtitle': 'SMTP e-mail configuration',
    'admin.settings-desc':     'Configure your Gmail SMTP to send booking confirmations and message notifications to customers.',
    'admin.save-settings':     'Save Settings',
    'admin.test-smtp':         'Send Test E-mail',

    /* ── Admin repair-types tab ── */
    'admin.add-repair-type': '+ Add Repair Type',
    'admin.col.description': 'Description',
    'admin.col.created':     'Created',

    /* ── Admin inventory tab ── */
    'admin.add-inventory':   '+ Add Part',
    'admin.edit-inventory':  'Edit Part',
    'admin.inv.part-name':   'Spare Part Name',
    'admin.inv.model':       'Compatible Device Model',
    'admin.inv.quantity':    'Stock Quantity',
    'admin.inv.min-qty':     'Minimum Stock Level',
    'admin.inv.price':       'Unit Price',

    /* ── Admin modal receipt ── */
    'modal.print-receipt':   '🖨️ Receipt',

    /* ── Admin modals ── */
    'modal.update-order':     'Manage Order',
    'modal.update-status':    'Update Appointment Status',
    'modal.customer':         'Customer',
    'modal.status':           'Status',
    'modal.quoted-price':     'Quoted Price (€)',
    'modal.messages':         'Messages',
    'modal.send-msg':         'Send',
    'modal.msg-email-note':   'Customer will receive an e-mail notification when you send a message.',
    'modal.open-conv':        'Open customer conversation page',
    'modal.cancel':           'Cancel',
    'modal.save-changes':     'Save Changes',
    'modal.add-service':      'Add Service',
    'modal.edit-service':     'Edit Service',
    'modal.service-name':     'Service Name *',
    'modal.repair-type':      'Repair Type',
    'modal.select-repair-type':'— Select repair type —',
    'modal.description':      'Description',
    'modal.price-from':       'Price From (€)',
    'modal.price-to':         'Price To (€)',
    'modal.stock-status':     'Stock Status',
    'modal.in-stock':         '✅ In Stock',
    'modal.out-of-stock':     '❌ Out of Stock',
    'modal.save-service':     'Save Service',
    'modal.add-repair-type':  'Add Repair Type',
    'modal.edit-repair-type': 'Edit Repair Type',
    'modal.name':             'Name *',
    'modal.save':             'Save',
    'modal.smtp-host':        'SMTP Host',
    'modal.smtp-port':        'SMTP Port',
    'modal.smtp-secure':      'Secure (SSL/TLS)',
    'modal.smtp-user':        'Gmail address',
    'modal.smtp-pass':        'App Password',
    'modal.smtp-from':        'From name / address',

    /* ── Admin status badges ── */
    'status.pending':       '⏳ Pending',
    'status.confirmed':     '🔵 Confirmed',
    'status.diagnostics':   '🔬 Diagnostics',
    'status.waiting_parts': '⏸️ Waiting for Parts',
    'status.completed':     '✅ Completed',
    'status.cancelled':     '❌ Cancelled',

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
    'empty.no-inventory':   'No inventory items yet',
    'empty.no-inventory-sub':'Click "+ Add Part" to track your first spare part',

    /* ── Admin count labels ── */
    'count.showing':          'Showing {n} of {total} total',
    'count.appts':            '{n} appointment',
    'count.appts-plural':     '{n} appointments',
    'count.services':         '{n} service',
    'count.services-plural':  '{n} services',
    'count.types':            '{n} type',
    'count.types-plural':     '{n} types',
    'count.inv-items':        '{n} item',
    'count.inv-items-plural': '{n} items',

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
    'admin.toast.val-inv-name':     'Part name and device model are required.',
    'admin.toast.svc-updated':      'Service Updated',
    'admin.toast.svc-created':      'Service Created',
    'admin.toast.svc-deleted':      'Service Deleted',
    'admin.toast.type-updated':     'Type Updated',
    'admin.toast.type-created':     'Type Created',
    'admin.toast.type-deleted':     'Type Deleted',
    'admin.toast.msg-sent':         'Message sent',
    'admin.toast.settings-saved':   'Settings Saved',
    'admin.toast.smtp-ok':          'SMTP Test OK',
    'admin.toast.smtp-ok-msg':      'Test e-mail sent successfully.',
    'admin.toast.smtp-fail':        'SMTP Test Failed',
    'admin.toast.inv-updated':      'Part Updated',
    'admin.toast.inv-created':      'Part Added',
    'admin.toast.inv-deleted':      'Part Deleted',

    /* ── Admin confirm dialogs ── */
    'confirm.delete-service':    'Delete service "{name}"? This action cannot be undone.',
    'confirm.delete-type':       'Delete repair type "{name}"? This action cannot be undone.',
    'confirm.delete-inventory':  'Delete part "{name}"? This action cannot be undone.',

    /* ── Admin service description placeholders ── */
    'admin.svc-name-ph':    'e.g. iPhone 15 Screen Replacement',
    'admin.svc-desc-ph':    'Brief description of the service...',
    'admin.rt-name-ph':     'e.g. Screen Repair',
    'admin.rt-desc-ph':     'Brief description...',
    'admin.search-orders-ph':'Search orders...',

    /* ── Admin login ── */
    'login.title':           'Sign In',
    'login.subtitle':        'Enter your admin password to continue.',
    'login.password-label':  'Password',
    'login.password-ph':     'Admin password',
    'login.submit':          'Sign In →',
    'login.submitting':      'Signing in…',
  },

  sk: {
    /* ── Navigation ── */
    'nav.services':    'Služby',
    'nav.how-it-works':'Ako to funguje',
    'nav.book-now':    'Rezervovať',

    /* ── Hero ── */
    'hero.badge':            '⚡ SSS-rank kvalitný servis',
    'hero.title1':           'Odborné opravy telefónov',
    'hero.title2':           'Ktorým môžete veriť',
    'hero.subtitle':         'Od prasklých obrazoviek až po vybité batérie – naši certifikovaní technici rýchlo opravia všetky hlavné modely telefónov s použitím originálnych dielov a zárukou spokojnosti.',
    'hero.cta-book':         '📅 Rezervovať opravu',
    'hero.cta-services':     '🔍 Zobraziť služby',
    'hero.stat1-label':      'Opravených zariadení',
    'hero.stat2-label':      'Hodnotenie zákazníkov',
    'hero.stat3-label':      'Rýchle vybavenie',
    'hero.phone-warranty':   '🛡️ 90-dňová záruka',
    'hero.phone-title':      'Oprava prebieha',
    'hero.phone-subtitle':   'Spúšťanie diagnostiky...',
    'hero.phone-ready':      '📦 Odoslanie poštou',

    /* ── Services section ── */
    'services.tag':       'Naše služby',
    'services.title':     'Opravy pre každý problém',
    'services.subtitle':  'Zabezpečujeme všetky hlavné opravy s originálnymi dielmi. Ceny sú orientačné – presnú cenu stanovíme po obdržaní vášho zariadenia.',
    'services.in-stock':  '✓ Dostupné',
    'services.out-stock': '✗ Nedostupné',
    'services.empty':     'Zatiaľ nie sú k dispozícii žiadne služby.',
    'services.error':     'Nepodarilo sa načítať služby. Skúste to prosím znova.',
    'services.price-from':       'Od',
    'services.price-up-to':      'Do',
    'services.price-on-request': 'Cena po konzultácii',

    /* ── How It Works ── */
    'how.tag':         'Postup',
    'how.title':       'Ako to funguje',
    'how.subtitle':    'Oprava telefónu je jednoduchá. Vyplňte formulár a pošlite nám zariadenie – zvyšok zariadíme my.',
    'how.step1-title': 'Vyberte opravu',
    'how.step1-desc':  'Prezerajte naše opravy a vyberte tú, ktorá zodpovedá problému vášho zariadenia. Cenu stanovíme po obdržaní telefónu.',
    'how.step2-title': 'Pošlite telefón',
    'how.step2-desc':  'Vyplňte formulár a pošlite nám zariadenie cez Packeta alebo iného dopravcu. Adresu dostanete e-mailom.',
    'how.step3-title': 'Dostanete späť opraveného',
    'how.step3-desc':  'Po oprave vám zariadenie pošleme späť. Celý priebeh sledujete cez konverzáciu na odkaze v e-maili.',

    /* ── Booking form ── */
    'booking.tag':              'Odoslať na opravu',
    'booking.title':            'Požiadať o opravu',
    'booking.subtitle':         'Vyplňte formulár nižšie. Po obdržaní zariadenia vám pošleme presnú cenu a ďalšie pokyny e-mailom.',
    'booking.name-label':       'Celé meno',
    'booking.name-ph':          'Ján Novák',
    'booking.email-label':      'E-mailová adresa',
    'booking.email-ph':         'jan@priklad.sk',
    'booking.phone-label':      'Telefónne číslo',
    'booking.phone-ph':         '+421 900 000 000',
    'booking.device-label':     'Model zariadenia',
    'booking.device-ph':        'napr. iPhone 14, Samsung S23',
    'booking.service-label':    'Typ opravy',
    'booking.service-default':  'Vyberte typ opravy',
    'booking.notes-label':      'Popis problému',
    'booking.notes-ph':         'Opíšte problém alebo iné relevantné detaily...',
    'booking.submit':           '📦 Odoslať žiadosť o opravu',
    'booking.submitting':       '⏳ Odosielam...',

    /* ── Footer ── */
    'footer.desc':            'Vrátime vášmu mobilu štýlové SSS-rank nabíjanie. Opravujeme všetky hlavné značky s originálnymi dielmi a zárukou spokojnosti.',
    'footer.quick-links':     'Rýchle odkazy',
    'footer.svc-heading':     'Služby',
    'footer.book-appt':       'Odoslať na opravu',
    'footer.track-order':     'Sledovať zákazku',
    'footer.admin':           'Administrácia',
    'footer.screen':          'Oprava obrazovky',
    'footer.battery':         'Výmena batérie',
    'footer.water':           'Poškodenie vodou',
    'footer.software':        'Softvérové problémy',
    'footer.rights':          'Všetky práva vyhradené.',

    /* ── Form validation ── */
    'val.name-required':    'Celé meno je povinné.',
    'val.email-required':   'E-mailová adresa je povinná.',
    'val.email-invalid':    'Zadajte platnú e-mailovú adresu.',
    'val.phone-required':   'Telefónne číslo je povinné.',
    'val.device-required':  'Model zariadenia je povinný.',
    'val.service-required': 'Vyberte prosím typ opravy.',

    /* ── Toasts (main) ── */
    'toast.val-error':      'Chyba validácie',
    'toast.booked-title':   'Žiadosť odoslaná!',
    'toast.booked-msg':     'Ďakujeme! Ozveme sa vám na {email} hneď ako obdržíme vaše zariadenie.',
    'toast.book-fail':      'Odoslanie zlyhalo',
    'toast.something-wrong':'Niečo sa pokazilo. Skúste to prosím znova.',

    /* ── Admin sidebar ── */
    'admin.menu-label':     'Hlavné menu',
    'admin.dashboard':      'Prehľad',
    'admin.orders':         'Objednávky',
    'admin.services':       'Služby',
    'admin.repair-types':   'Typy opráv',
    'admin.inventory':      'Sklad',
    'admin.settings':       'Nastavenia',
    'admin.view-website':   '🏠 Zobraziť web',

    /* ── Admin topbar ── */
    'admin.subtitle':             'Spravujte svoj opravárenský biznis',
    'admin.tab.dashboard':        'Prehľad',
    'admin.tab.orders':           'Všetky rezervácie',
    'admin.tab.services':         'Služby',
    'admin.tab.repair-types':     'Typy opráv',
    'admin.tab.inventory':        'Sklad',
    'admin.tab.settings':         'Nastavenia',

    /* ── Admin stats ── */
    'admin.total-orders':    'Celkové objednávky',
    'admin.all-time':        '↑ Za celú dobu',
    'admin.pending':         'Čakajúce',
    'admin.needs-attention': 'Vyžaduje pozornosť',
    'admin.completed':       'Dokončené',
    'admin.great-work':      '↑ Skvelá práca!',
    'admin.revenue':         'Tržby',
    'admin.completed-orders':'Dokončené objednávky',
    'admin.today-orders':    'Dnešné objednávky',
    'admin.today-desc':      'Nové dnes',
    'admin.monthly-revenue': 'Mesačné tržby',
    'admin.this-month':      'Tento mesiac',
    'admin.top-models':      'Top modely zariadení',
    'admin.top-models-sub':  'Najčastejšie opravy',

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
    'admin.add-service':     '+ Pridať službu',
    'admin.col.name':        'Názov',
    'admin.col.repair-type': 'Typ opravy',
    'admin.col.price':       'Cena',
    'admin.col.price-range': 'Cenové rozpätie',
    'admin.col.stock':       'Dostupnosť',

    /* ── Admin settings ── */
    'admin.settings':          'Nastavenia',
    'admin.settings-subtitle': 'Konfigurácia SMTP e-mailu',
    'admin.settings-desc':     'Nastavte Gmail SMTP na posielanie potvrdení a upozornení zákazníkom.',
    'admin.save-settings':     'Uložiť nastavenia',
    'admin.test-smtp':         'Odoslať testovací e-mail',

    /* ── Admin repair-types tab ── */
    'admin.add-repair-type': '+ Pridať typ opravy',
    'admin.col.description': 'Popis',
    'admin.col.created':     'Vytvorené',

    /* ── Admin inventory tab ── */
    'admin.add-inventory':   '+ Pridať diel',
    'admin.edit-inventory':  'Upraviť diel',
    'admin.inv.part-name':   'Názov náhradného dielu',
    'admin.inv.model':       'Kompatibilný model zariadenia',
    'admin.inv.quantity':    'Množstvo na sklade',
    'admin.inv.min-qty':     'Minimálna zásoba',
    'admin.inv.price':       'Jednotková cena',

    /* ── Admin modal receipt ── */
    'modal.print-receipt':   '🖨️ Potvrdenka',

    /* ── Admin modals ── */
    'modal.update-order':     'Spravovať objednávku',
    'modal.update-status':    'Aktualizovať stav rezervácie',
    'modal.customer':         'Zákazník',
    'modal.status':           'Stav',
    'modal.quoted-price':     'Cenová ponuka (€)',
    'modal.messages':         'Správy',
    'modal.send-msg':         'Odoslať',
    'modal.msg-email-note':   'Zákazník dostane e-mail keď mu napíšete správu.',
    'modal.open-conv':        'Otvoriť konverzačnú stránku zákazníka',
    'modal.cancel':           'Zrušiť',
    'modal.save-changes':     'Uložiť zmeny',
    'modal.add-service':      'Pridať službu',
    'modal.edit-service':     'Upraviť službu',
    'modal.service-name':     'Názov služby *',
    'modal.repair-type':      'Typ opravy',
    'modal.select-repair-type':'— Vyberte typ opravy —',
    'modal.description':      'Popis',
    'modal.price-from':       'Cena od (€)',
    'modal.price-to':         'Cena do (€)',
    'modal.stock-status':     'Stav dostupnosti',
    'modal.in-stock':         '✅ Dostupné',
    'modal.out-of-stock':     '❌ Nedostupné',
    'modal.save-service':     'Uložiť službu',
    'modal.add-repair-type':  'Pridať typ opravy',
    'modal.edit-repair-type': 'Upraviť typ opravy',
    'modal.name':             'Názov *',
    'modal.save':             'Uložiť',
    'modal.smtp-host':        'SMTP Host',
    'modal.smtp-port':        'SMTP Port',
    'modal.smtp-secure':      'Zabezpečené (SSL/TLS)',
    'modal.smtp-user':        'Gmail adresa',
    'modal.smtp-pass':        'App heslo',
    'modal.smtp-from':        'Meno / adresa odosielateľa',

    /* ── Admin status badges ── */
    'status.pending':       '⏳ Čakajúce',
    'status.confirmed':     '🔵 Potvrdené',
    'status.diagnostics':   '🔬 Diagnostika',
    'status.waiting_parts': '⏸️ Čaká na diely',
    'status.completed':     '✅ Dokončené',
    'status.cancelled':     '❌ Zrušené',

    /* ── Admin stock ── */
    'stock.in':  '✓ Dostupné',
    'stock.out': '✗ Nedostupné',

    /* ── Admin empty states ── */
    'empty.no-appts':        'Zatiaľ žiadne rezervácie',
    'empty.no-orders':       'Žiadne objednávky',
    'empty.no-orders-sub':   'Skúste upraviť filtre alebo vyhľadávacie výrazy',
    'empty.no-services':     'Zatiaľ žiadne služby',
    'empty.no-services-sub': 'Kliknite na „Pridať službu" a vytvorte prvú službu',
    'empty.no-types':        'Zatiaľ žiadne typy opráv',
    'empty.no-inventory':    'Zatiaľ žiadne skladové položky',
    'empty.no-inventory-sub':'Kliknite na „+ Pridať diel" pre sledovanie zásob',

    /* ── Admin count labels ── */
    'count.showing':          'Zobrazujem {n} z {total} celkových',
    'count.appts':            '{n} rezervácia',
    'count.appts-plural':     '{n} rezervácií',
    'count.services':         '{n} služba',
    'count.services-plural':  '{n} služieb',
    'count.types':            '{n} typ',
    'count.types-plural':     '{n} typov',
    'count.inv-items':        '{n} položka',
    'count.inv-items-plural': '{n} položiek',

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
    'admin.toast.val-inv-name':     'Názov dielu a model zariadenia sú povinné.',
    'admin.toast.svc-updated':      'Služba aktualizovaná',
    'admin.toast.svc-created':      'Služba vytvorená',
    'admin.toast.svc-deleted':      'Služba odstránená',
    'admin.toast.type-updated':     'Typ aktualizovaný',
    'admin.toast.type-created':     'Typ vytvorený',
    'admin.toast.type-deleted':     'Typ odstránený',
    'admin.toast.msg-sent':         'Správa odoslaná',
    'admin.toast.settings-saved':   'Nastavenia uložené',
    'admin.toast.smtp-ok':          'SMTP test OK',
    'admin.toast.smtp-ok-msg':      'Testovací e-mail odoslaný úspešne.',
    'admin.toast.smtp-fail':        'SMTP test zlyhal',
    'admin.toast.inv-updated':      'Diel aktualizovaný',
    'admin.toast.inv-created':      'Diel pridaný',
    'admin.toast.inv-deleted':      'Diel odstránený',

    /* ── Admin confirm dialogs ── */
    'confirm.delete-service': 'Odstrániť službu „{name}"? Túto akciu nie je možné vrátiť späť.',
    'confirm.delete-type':    'Odstrániť typ opravy „{name}"? Túto akciu nie je možné vrátiť späť.',
    'confirm.delete-inventory': 'Odstrániť diel „{name}"? Túto akciu nie je možné vrátiť späť.',

    /* ── Admin placeholders ── */
    'admin.svc-name-ph':     'napr. Výmena obrazovky iPhone 15',
    'admin.svc-desc-ph':     'Stručný popis služby...',
    'admin.rt-name-ph':      'napr. Oprava obrazovky',
    'admin.rt-desc-ph':      'Stručný popis...',
    'admin.search-orders-ph':'Hľadať objednávky...',

    /* ── Admin login ── */
    'login.title':           'Prihlásenie',
    'login.subtitle':        'Zadajte heslo administrátora.',
    'login.password-label':  'Heslo',
    'login.password-ph':     'Heslo administrátora',
    'login.submit':          'Prihlásiť sa →',
    'login.submitting':      'Prihlasovanie…',
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
