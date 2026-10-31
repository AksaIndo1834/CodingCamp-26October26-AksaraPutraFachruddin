# To-Do List — Expense & Budget Visualizer

## Existing features
- [x] Add and validate transactions
- [x] Delete transactions
- [x] Show all-time total
- [x] Show spending pie chart
- [x] Persist transactions in Local Storage
- [x] Empty states and Chart.js fallback

## New features
- [x] Add custom categories with duplicate validation
- [x] Persist custom categories in Local Storage
- [x] Prevent removal of categories used by transactions
- [x] Add transaction date and default it to today
- [x] Add monthly selector and monthly summary
- [x] Show transaction count and category breakdown by month
- [x] Filter transaction list by month
- [x] Set and remove per-month spending limits
- [x] Show monthly budget progress and remaining amount
- [x] Highlight 80% warning and over-limit state
- [x] Keep all data client-side with Local Storage

## Manual verification still recommended
- [ ] Test in Chrome, Firefox, Edge, and Safari
- [ ] Test on a phone-sized screen
- [ ] Add transactions across multiple months and compare monthly totals
- [ ] Reload and confirm transactions, categories, and limits persist
- [ ] Verify warning at 80% and alert at/above 100%
- [ ] Verify old transactions without dates load without crashing
