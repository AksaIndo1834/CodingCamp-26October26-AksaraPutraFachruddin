# Requirements — Expense & Budget Visualizer

## 1. Overview
A mobile-friendly web app to track spending, view spending distribution, summarize a selected month, create custom categories, and monitor monthly spending limits.

## 2. Functional Requirements

### FR-1 Input Form
- Fields: Item Name, Amount, Category, and Date.
- Category options include Food, Transport, Fun, and user-created categories.
- All fields are required; amount must be greater than 0.
- Invalid submission displays an accessible error and does not add a transaction.

### FR-2 Transaction List
- Displays transactions newest first with name, amount, category, date, and a delete button.
- Supports filtering by month.
- List remains scrollable.

### FR-3 Total Balance
- Shows all-time spending total and transaction count.
- Updates automatically when a transaction is added or deleted.

### FR-4 Spending Chart
- Pie chart displays spending by category for the month selected in Monthly Summary.
- Updates when transactions, categories, or the selected month changes.
- Uses Chart.js from a CDN and displays a fallback message if it fails to load.

### FR-5 Custom Categories
- Users can create custom categories.
- Category names are trimmed and duplicates are rejected case-insensitively.
- Categories persist in Local Storage and appear in the transaction form and chart.
- Unused custom categories can be removed; categories used by transactions cannot be removed from the category list.

### FR-6 Monthly Summary
- User can select a month.
- Summary shows monthly spending total, transaction count, and category breakdown.
- Transactions are assigned a date; older stored transactions without a date are migrated to the current local date.

### FR-7 Monthly Spending Limit
- User can set or remove a spending limit for the selected month.
- Monthly progress displays percentage used and remaining or over-limit amount.
- At 80% of the limit, the progress indicator changes to a warning color.
- At or above 100%, the progress indicator and all-time header are highlighted and a clear warning is shown.
- Limits persist per month in Local Storage.

## 3. Technical Constraints
- HTML, CSS, and vanilla JavaScript; no frontend framework or backend.
- Client-side data stored with Local Storage.
- One CSS file in `css/` and one JavaScript file in `js/`.
- Designed for modern browsers and mobile screens.

## 4. Storage
- Transactions: `expense-visualizer:transactions`
- Categories: `expense-visualizer:categories`
- Monthly limits: `expense-visualizer:monthly-limits`

## 5. Compatibility Notes
Existing transactions without dates are assigned the current local date on load and are saved with a date on the next transaction change. This preserves existing data, but the original historical month cannot be inferred.
