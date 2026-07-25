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

## Payment boundary
The Vue client must not call CHIP with private credentials. Checkout creation, price validation and CHIP purchase creation belong in Supabase Edge Functions. CHIP webhooks are the source of truth for paid status.
