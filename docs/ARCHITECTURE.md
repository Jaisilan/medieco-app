# Medieco Application Architecture

## Product surfaces

### Customer application
Mobile-first PWA for Bloom Care browsing, configuration, cart, checkout, CHIP payment, orders, deliveries, affiliate functions, notifications, profile and settings.

### Administration portal
Responsive operational console for dashboards, orders, payments, subscriptions and deliveries, products, Bloom Box configuration, inventory, customers, affiliates, staff permissions, notifications, reports and application settings.

Both surfaces share Supabase authentication, database services, design tokens and reusable feedback components, but use purpose-built layouts.

## Responsive targets
- 360 px: small phone
- 390–430 px: modern phone
- 768 px: tablet
- 1024 px: tablet landscape / small laptop
- 1280–1440 px: desktop
- 1920 px: large desktop

## Staging deployment
The `develop` branch is automatically built and deployed to the Hostinger staging site. Each deployment replaces the previous application bundle and writes the Git commit SHA to `version.json` for verification.
