# Medieco App

Responsive Medieco platform containing two connected interfaces:

- **Customer PWA** — Bloom Care products, configurable boxes, cart, checkout, orders, delivery tracking, affiliate features and profile tools.
- **Administration portal** — operational dashboards, orders, payments, products, inventory, affiliates, users and settings.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Supabase project configuration

## Local setup

```bash
cp .env.example .env
npm ci
npm run dev
```

## Production build

```bash
npm run build
```

Upload the contents of `dist/` to the Hostinger subdomain document root. Copy `deployment/hostinger/.htaccess` into `dist/` before uploading when deploying manually.

## Security

Never commit `.env`, Supabase service-role keys, CHIP secrets, Hostinger credentials or GitHub deployment secrets.

See `docs/SECURITY-AUDIT.md` before public release.
