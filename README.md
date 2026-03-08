# SSStylish Repair – Phone Repair Service Platform

A full-stack web application for managing a phone repair shop. Customers can book repairs, track order status, and chat with technicians. Admins manage orders, services, inventory, staff, analytics, and more.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js · Express.js · Socket.IO        |
| Database  | sql.js (SQLite in-memory, persisted to file) |
| Email     | Nodemailer (SMTP – Gmail recommended)   |
| Frontend  | Vanilla JavaScript · HTML5 · CSS3       |
| i18n      | Built-in EN/SK (English / Slovak)       |
| Auth      | HMAC-SHA256 tokens (custom, no JWT lib) |

## Features

### Customer-facing
- **Service Browser** – view available repairs with pricing
- **Booking Form** – multi-step form with phone validation
- **Order Tracking** – track repair status by order # + email
- **Conversation** – real-time chat with the repair technician
- **Reviews** – leave star ratings after repair is completed
- **Public Reviews** – approved reviews displayed on the homepage
- **i18n** – English / Slovak language toggle on all pages

### Admin Panel (`/admin`)
- **Dashboard** – overview stats, recent orders, top device models
- **All Orders** – filterable list with CSV export, edit & delete
- **Services** – create/edit/delete repair services with pricing
- **Repair Types** – categorize services
- **Inventory** – track spare parts stock with CSV export
- **Analytics** – revenue trends, service popularity, return rate
- **Reviews** – approve/hide customer reviews
- **CRM** – customer list with history, notes, loyalty tracking + CSV export
- **Calendar** – weekly appointment view
- **Staff** – staff account management, assign orders
- **Settings** – SMTP configuration, time slots, change password, audit log
- **Real-time** – Socket.IO for live order/message updates

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm

### Installation

```bash
git clone https://github.com/KoHaku743/fix-phone.git
cd fix-phone/backend
npm install
```

### Configuration

```bash
cp ../.env.example .env
# Edit .env with your settings
```

### Required Environment Variables

| Variable        | Description                                          |
|-----------------|------------------------------------------------------|
| `ADMIN_PASSWORD`| Password for the owner admin account (**required**)  |
| `JWT_SECRET`    | Secret for signing session tokens (**required**)     |
| `BASE_URL`      | Public URL of the app (used in email links)          |

### Optional Environment Variables

| Variable        | Description                                          |
|-----------------|------------------------------------------------------|
| `PORT`          | HTTP port (default: `3000`)                          |
| `ADMIN_PORT`    | Separate port for admin panel (optional)             |
| `STAFF_PASSWORD`| Password for the staff account                       |
| `OWNER_NAME`    | Display name for owner (default: `Owner`)            |
| `STAFF_NAME`    | Display name for staff (default: `Staff`)            |
| `DB_PATH`       | SQLite database file path (default: `./phone_repair.db`) |
| `SHOP_ADDRESS`  | Physical address shown in emails                     |
| `CORS_ORIGIN`   | Allowed origin for Socket.IO CORS (default: `*`)     |
| `SMTP_HOST`     | SMTP server hostname                                 |
| `SMTP_PORT`     | SMTP server port (default: 587)                      |
| `SMTP_USER`     | SMTP username / Gmail address                        |
| `SMTP_PASS`     | SMTP app password                                    |
| `SMTP_FROM`     | From name and address for outgoing emails            |

> **Note:** SMTP settings can also be configured from the Admin Panel → Settings tab and are stored in the database.

### Running

```bash
# Production
npm start

# Development (with auto-reload via nodemon)
npm run dev
```

The app will be available at `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

See `docker-compose.yml` and `Dockerfile` for details.

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/services` | List all active services |
| `POST` | `/api/appointments` | Create a new appointment |
| `GET`  | `/api/appointments/available-slots?date=YYYY-MM-DD` | List available time slots |
| `GET`  | `/api/track/:id?email=...` | Track order by ID + email |
| `GET`  | `/api/conversations/:token` | Get conversation by token |
| `POST` | `/api/conversations/:token/messages` | Send a customer message |
| `POST` | `/api/reviews` | Submit a review |
| `GET`  | `/api/reviews/public` | List approved public reviews |

### Admin (require Bearer token)
| Method   | Path | Description |
|----------|------|-------------|
| `GET`    | `/api/admin/appointments` | List all appointments |
| `PUT`    | `/api/admin/appointments/:id` | Update appointment |
| `DELETE` | `/api/admin/appointments/:id` | Delete appointment (owner only) |
| `GET`    | `/api/admin/services` | List services |
| `POST`   | `/api/admin/services` | Create service |
| `PUT`    | `/api/admin/services/:id` | Update service |
| `DELETE` | `/api/admin/services/:id` | Delete service |
| `GET`    | `/api/admin/inventory` | List inventory |
| `POST`   | `/api/admin/inventory` | Add item |
| `PUT`    | `/api/admin/inventory/:id` | Update item |
| `DELETE` | `/api/admin/inventory/:id` | Delete item |
| `GET`    | `/api/admin/reviews` | List reviews |
| `PUT`    | `/api/admin/reviews/:id` | Update review status |
| `DELETE` | `/api/admin/reviews/:id` | Delete review |
| `GET`    | `/api/admin/crm/customers` | List CRM customers |
| `GET`    | `/api/admin/crm/customers/:email/history` | Customer order history |
| `PUT`    | `/api/admin/crm/customers/:email/notes` | Save customer notes |
| `GET`    | `/api/admin/analytics` | Analytics data |
| `GET`    | `/api/admin/staff-accounts` | List staff accounts |
| `POST`   | `/api/admin/staff-accounts` | Create staff account |
| `PUT`    | `/api/admin/staff-accounts/:id` | Update staff account |
| `DELETE` | `/api/admin/staff-accounts/:id` | Delete staff account (owner) |
| `PUT`    | `/api/admin/change-password` | Change own password |
| `GET`    | `/api/admin/audit-log` | Audit log |
| `GET`    | `/api/admin/settings` | Get SMTP settings |
| `PUT`    | `/api/admin/settings` | Save SMTP settings |
| `POST`   | `/api/admin/settings/test-smtp` | Send test email |
| `GET`    | `/api/admin/slots` | List time slots |
| `PUT`    | `/api/admin/slots` | Update time slots |

## Pages

| URL | Description |
|-----|-------------|
| `/` | Customer landing page (services, booking, reviews) |
| `/track` | Order tracking page |
| `/conversation/:token` | Customer-technician chat |
| `/admin` | Admin panel |
| `/admin/conversation/:token` | Admin-side chat view |

## Development Notes

- The database is initialized automatically on first start via `backend/database.js`
- All frontend files are in `backend/../frontend/` and served as static files
- Socket.IO is used for real-time updates in the admin panel and customer conversation pages
- The `ADMIN_PASSWORD` owner account is always available; additional staff can be created in the Admin Panel → Settings

## License

MIT
