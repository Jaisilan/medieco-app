# Supabase Security Audit — Initial Findings

Project reviewed: `medieco-core`

Before public launch:
1. Remove unrestricted authenticated INSERT/UPDATE/DELETE policies from `products`.
2. Restrict Bloom Box items, variants and payment schedules to authorised administrators.
3. Add customer-owned and administrator policies for `subscriptions`.
4. Add user-owned policies for `push_subscriptions`.
5. Prevent customers from modifying protected order and payment fields.
6. Consolidate duplicate RLS policies.
7. Fix mutable function search paths and revoke unnecessary function execution.
8. Enable leaked-password protection.
9. Remove broad object-listing policies from public image buckets.
10. Add idempotency constraints for CHIP events and affiliate commissions.

No database mutation was applied during the initial audit.
