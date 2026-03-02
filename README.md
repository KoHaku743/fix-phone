# FixPhone 🔧

A full-stack web application for managing a phone repair shop. Customers can browse available repair services and book appointments online, while shop administrators can manage services, repair types, and appointments through a dedicated admin panel.

## Features

- **Service Catalogue** – Browse all available repair services with pricing and estimated duration
- **Online Booking** – Submit repair appointment requests with device details and preferred date/time
- **Admin Panel** – Manage repair types, services, and view/update appointment statuses
- **i18n Support** – English and Slovak language toggle stored in `localStorage`
- **Rate Limiting** – Global and per-route rate limiting to protect the API
- **Persistent SQLite Database** – Data stored on disk via `sql.js`

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend  | Node.js, Express |
| Database | SQLite (via `sql.js`) |
| i18n     | Custom `window.t()` helper (`frontend/js/i18n.js`) |

## Project Structure

```
fix-phone/
├── frontend/
│   ├── index.html        # Customer-facing landing page
│   ├── admin.html        # Admin panel
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── i18n.js       # Internationalisation (EN / SK)
│       ├── main.js       # Customer page logic
│       └── admin.js      # Admin panel logic
└── backend/
    ├── server.js         # Express app entry point (port 3000)
    ├── database.js       # sql.js wrapper & DB initialisation / seeding
    ├── package.json
    └── routes/
        ├── services.js      # GET /api/services
        ├── appointments.js  # POST /api/appointments
        └── admin.js         # Admin CRUD endpoints
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Installation & Running

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start the server
npm start
```

The server starts on **http://localhost:3000**.

- Customer page → http://localhost:3000/
- Admin panel   → http://localhost:3000/admin

> On first run the database is created automatically and seeded with sample repair types and services.

## API Reference

All endpoints are prefixed with `/api`.

### Services

| Method | Path              | Description            |
|--------|-------------------|------------------------|
| GET    | `/api/services`   | List all services      |
| GET    | `/api/services/:id` | Get a single service |

### Appointments

| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/appointments`   | Create a new appointment |

**Required body fields:** `customer_name`, `customer_email`, `customer_phone`, `device_model`, `appointment_date`

**Optional body fields:** `service_id`, `notes`

### Admin

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/api/admin/appointments`         | List all appointments              |
| PUT    | `/api/admin/appointments/:id`     | Update appointment status           |
| GET    | `/api/admin/services`             | List all services (admin view)      |
| POST   | `/api/admin/services`             | Create a new service                |
| PUT    | `/api/admin/services/:id`         | Update a service                    |
| DELETE | `/api/admin/services/:id`         | Delete a service                    |
| GET    | `/api/admin/repair-types`         | List all repair types               |
| POST   | `/api/admin/repair-types`         | Create a new repair type            |
| PUT    | `/api/admin/repair-types/:id`     | Update a repair type                |
| DELETE | `/api/admin/repair-types/:id`     | Delete a repair type                |

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file included in this repository.