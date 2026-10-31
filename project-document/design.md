# Design — Expense & Budget Visualizer

## Folder Structure
```
expense-budget-visualizer/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── requirement.md
├── design.md
└── to-do-list.md
```

## Layout
Mobile-first, with cards stacked on small screens. On wider screens the form, chart, and monthly summary use a two-column grid, with transactions spanning the full width.

## Visual Design
- Dark navy balance header and white cards on a light grey-blue background.
- Category colors are assigned consistently from a palette.
- Warning progress starts at 80%; over-limit state uses the error color.
- Clear labels, visible focus states, accessible error messages, and responsive spacing.

## Components
- Transaction form: name, amount, category, date.
- Custom categories: create category; remove unused custom categories.
- Spending chart: category distribution for the selected summary month.
- Monthly summary: month selector, total, count, category breakdown, budget progress.
- Transactions: newest first, scrollable, deletable, and filterable by month.

## Storage
- `expense-visualizer:transactions`: array of transaction objects with `id`, `name`, `amount`, `category`, and `date`.
- `expense-visualizer:categories`: array of custom category names.
- `expense-visualizer:monthly-limits`: object keyed by `YYYY-MM`, with numeric limit values.

Existing transactions missing a date are assigned today's local date because the old data model does not contain enough information to reconstruct their original month.
