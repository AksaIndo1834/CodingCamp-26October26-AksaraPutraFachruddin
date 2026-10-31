/* ==========================================================================
   Expense & Budget Visualizer — vanilla JavaScript
   Custom categories, monthly summary, and monthly spending limits.
   ========================================================================== */

const STORAGE_KEY = "expense-visualizer:transactions";
const CATEGORIES_KEY = "expense-visualizer:categories";
const LIMITS_KEY = "expense-visualizer:monthly-limits";
const CURRENCY = "IDR";
const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];
const PALETTE = ["#f2a93b", "#2f6feb", "#d6407a", "#299d8f", "#9467bd", "#e76f51", "#8a9b0f", "#64748b", "#c056a6"];

const form = document.getElementById("transaction-form");
const nameInput = document.getElementById("item-name");
const amountInput = document.getElementById("item-amount");
const categoryInput = document.getElementById("item-category");
const dateInput = document.getElementById("item-date");
const formError = document.getElementById("form-error");
const totalEl = document.getElementById("total-balance");
const noteEl = document.getElementById("balance-note");
const balanceHeader = document.getElementById("balance-header");
const budgetAlert = document.getElementById("budget-alert");
const listEl = document.getElementById("transaction-list");
const listEmptyEl = document.getElementById("list-empty");
const chartCanvas = document.getElementById("spending-chart");
const chartEmptyEl = document.getElementById("chart-empty");
const chartPeriod = document.getElementById("chart-period");
const categoryForm = document.getElementById("category-form");
const newCategoryInput = document.getElementById("new-category");
const categoryError = document.getElementById("category-error");
const categoryList = document.getElementById("category-list");
const summaryMonthInput = document.getElementById("summary-month");
const monthTotalEl = document.getElementById("month-total");
const monthCountEl = document.getElementById("month-count");
const limitTotalEl = document.getElementById("limit-total");
const monthlyLimitInput = document.getElementById("monthly-limit");
const saveLimitButton = document.getElementById("save-limit");
const clearLimitButton = document.getElementById("clear-limit");
const budgetError = document.getElementById("budget-error");
const progressWrap = document.getElementById("budget-progress-wrap");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("budget-progress-label");
const monthlyBreakdown = document.getElementById("monthly-breakdown");
const summaryEmpty = document.getElementById("summary-empty");
const listFilterMonth = document.getElementById("list-filter-month");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function currentMonth() { return localDateString().slice(0, 7); }
function safeRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch (_) { return fallback; }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (_) { /* App remains usable for the current session if storage is blocked. */ }
}
function loadTransactions() {
  const saved = safeRead(STORAGE_KEY, []);
  if (!Array.isArray(saved)) return [];
  // Older transactions did not store a date. Assign today's date so they remain visible.
  return saved.filter(tx => tx && typeof tx === "object").map(tx => ({
    id: String(tx.id || createId()),
    name: String(tx.name || "Untitled transaction"),
    amount: Number(tx.amount) || 0,
    category: String(tx.category || "Other"),
    date: validDate(tx.date) ? tx.date : localDateString()
  })).filter(tx => tx.amount > 0);
}
let transactions = loadTransactions();
let categories = loadCategories();
let monthlyLimits = loadLimits();
let chart = null;
const categoryColors = {};

function loadCategories() {
  const saved = safeRead(CATEGORIES_KEY, []);
  const all = [...DEFAULT_CATEGORIES, ...(Array.isArray(saved) ? saved : [])];
  transactionsForCategoryMigration(all);
  return [...new Set(all.filter(c => typeof c === "string").map(c => c.trim()).filter(Boolean))];
}
function transactionsForCategoryMigration(all) {
  // Keep categories from older transaction data even if they were not in the original defaults.
  const savedTx = safeRead(STORAGE_KEY, []);
  if (Array.isArray(savedTx)) savedTx.forEach(tx => {
    if (tx && typeof tx.category === "string" && tx.category.trim()) all.push(tx.category.trim());
  });
}
function loadLimits() {
  const value = safeRead(LIMITS_KEY, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function saveTransactions() { safeWrite(STORAGE_KEY, transactions); }
function saveCategories() { safeWrite(CATEGORIES_KEY, categories); }
function saveLimits() { safeWrite(LIMITS_KEY, monthlyLimits); }
function validDate(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`)); }
function createId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function formatMoney(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(value);
}
function monthOf(tx) { return tx.date.slice(0, 7); }
function getMonthTransactions(month) { return transactions.filter(tx => monthOf(tx) === month); }
function getTotalsByCategory(items) {
  const totals = {};
  items.forEach(tx => { totals[tx.category] = (totals[tx.category] || 0) + tx.amount; });
  return totals;
}
function getColor(category) {
  if (!categoryColors[category]) {
    const index = categories.indexOf(category);
    categoryColors[category] = PALETTE[(index >= 0 ? index : Object.keys(categoryColors).length) % PALETTE.length];
  }
  return categoryColors[category];
}
function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}
function validateTransaction() {
  const amount = Number(amountInput.value);
  const errors = {
    name: !nameInput.value.trim(),
    amount: amountInput.value === "" || !Number.isFinite(amount) || amount <= 0,
    category: !categories.includes(categoryInput.value),
    date: !validDate(dateInput.value)
  };
  nameInput.classList.toggle("invalid", errors.name);
  amountInput.classList.toggle("invalid", errors.amount);
  categoryInput.classList.toggle("invalid", errors.category);
  dateInput.classList.toggle("invalid", errors.date);
  showError(formError, Object.values(errors).some(Boolean)
    ? "Please fill in every field, choose a category, and enter an amount greater than 0." : "");
  return !Object.values(errors).some(Boolean);
}
function renderCategoryOptions() {
  const previous = categoryInput.value;
  categoryInput.textContent = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose one";
  categoryInput.appendChild(placeholder);
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryInput.appendChild(option);
  });
  if (categories.includes(previous)) categoryInput.value = previous;
  renderCategoryList();
}
function renderCategoryList() {
  categoryList.textContent = "";
  categories.forEach(category => {
    const li = document.createElement("li");
    li.className = "category-chip";
    const dot = document.createElement("span");
    dot.className = "tx__dot";
    dot.style.background = getColor(category);
    const label = document.createElement("span");
    label.textContent = category;
    li.append(dot, label);
    if (!DEFAULT_CATEGORIES.includes(category) && !transactions.some(tx => tx.category === category)) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "category-remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove category ${category}`);
      remove.addEventListener("click", () => {
        categories = categories.filter(item => item !== category);
        saveCategories();
        renderCategoryOptions();
        render();
      });
      li.appendChild(remove);
    }
    categoryList.appendChild(li);
  });
}
function addTransaction(name, amount, category, date) {
  transactions.unshift({ id: createId(), name: name.trim(), amount, category, date });
  saveTransactions();
  render();
}
function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions();
  render();
}
function renderBalance() {
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  totalEl.textContent = formatMoney(total);
  noteEl.textContent = transactions.length === 0 ? "No transactions yet" : `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;

  const month = currentMonth();
  const monthTotal = getMonthTransactions(month).reduce((sum, tx) => sum + tx.amount, 0);
  const limit = Number(monthlyLimits[month]);
  const hasLimit = Number.isFinite(limit) && limit > 0;
  const exceeded = hasLimit && monthTotal > limit;
  const reached = hasLimit && monthTotal >= limit;
  balanceHeader.classList.toggle("balance--warning", reached);
  budgetAlert.hidden = !reached;
  if (reached) {
    budgetAlert.textContent = exceeded
      ? `Monthly limit exceeded by ${formatMoney(monthTotal - limit)}.`
      : "You have reached your monthly spending limit.";
  }
}
function renderList() {
  listEl.textContent = "";
  const filter = listFilterMonth.value || "all";
  const visible = filter === "all" ? transactions : transactions.filter(tx => monthOf(tx) === filter);
  listEmptyEl.hidden = visible.length > 0;
  visible.forEach(tx => {
    const item = document.createElement("li");
    item.className = "tx";
    const dot = document.createElement("span");
    dot.className = "tx__dot";
    dot.style.background = getColor(tx.category);
    const info = document.createElement("div");
    info.className = "tx__info";
    const name = document.createElement("p");
    name.className = "tx__name";
    name.textContent = tx.name;
    const meta = document.createElement("p");
    meta.className = "tx__category";
    meta.textContent = `${tx.category} · ${tx.date}`;
    info.append(name, meta);
    const amount = document.createElement("span");
    amount.className = "tx__amount";
    amount.textContent = formatMoney(tx.amount);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "tx__delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${tx.name}`);
    remove.addEventListener("click", () => deleteTransaction(tx.id));
    item.append(dot, info, amount, remove);
    listEl.appendChild(item);
  });
}
function renderMonthFilter() {
  const selected = listFilterMonth.value || "all";
  const months = [...new Set(transactions.map(monthOf))].sort().reverse();
  listFilterMonth.textContent = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All months";
  listFilterMonth.appendChild(all);
  months.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    listFilterMonth.appendChild(option);
  });
  listFilterMonth.value = months.includes(selected) ? selected : "all";
}
function renderChart() {
  const month = summaryMonthInput.value || currentMonth();
  const totals = getTotalsByCategory(getMonthTransactions(month));
  const labels = Object.keys(totals).filter(label => totals[label] > 0);
  const data = labels.map(label => totals[label]);
  const hasData = data.length > 0;
  chartPeriod.textContent = `For ${month}`;
  chartCanvas.hidden = !hasData;
  chartEmptyEl.hidden = hasData;
  if (typeof Chart === "undefined") {
    if (hasData) {
      chartCanvas.hidden = true;
      chartEmptyEl.textContent = "The chart could not load. Check your internet connection.";
      chartEmptyEl.hidden = false;
    }
    return;
  }
  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    return;
  }
  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: labels.map(getColor), borderColor: "#ffffff", borderWidth: 2 }]
  };
  if (chart) {
    chart.data = chartData;
    chart.update();
    return;
  }
  chart = new Chart(chartCanvas, {
    type: "pie",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } },
        tooltip: { callbacks: { label: context => ` ${context.label}: ${formatMoney(context.parsed)}` } }
      }
    }
  });
}
function renderMonthlySummary() {
  const month = summaryMonthInput.value || currentMonth();
  const items = getMonthTransactions(month);
  const total = items.reduce((sum, tx) => sum + tx.amount, 0);
  const limit = Number(monthlyLimits[month]);
  const hasLimit = Number.isFinite(limit) && limit > 0;
  monthTotalEl.textContent = formatMoney(total);
  monthCountEl.textContent = String(items.length);
  limitTotalEl.textContent = hasLimit ? formatMoney(limit) : "Not set";
  monthlyLimitInput.value = hasLimit ? String(limit) : "";
  progressWrap.hidden = !hasLimit;
  if (hasLimit) {
    const ratio = total / limit * 100;
    const percent = Math.min(100, ratio);
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(Math.min(100, Math.round(ratio))));
    progressTrack.setAttribute("aria-valuemax", "100");
    progressTrack.classList.toggle("progress-track--warning", ratio >= 80);
    progressTrack.classList.toggle("progress-track--over", ratio >= 100);
    progressLabel.textContent = ratio >= 100
      ? `${Math.round(ratio)}% used · Over limit by ${formatMoney(total - limit)}`
      : `${Math.round(ratio)}% used · ${formatMoney(limit - total)} remaining`;
  }
  const totals = getTotalsByCategory(items);
  monthlyBreakdown.textContent = "";
  Object.entries(totals).sort((a, b) => b[1] - a[1]).forEach(([category, amount]) => {
    const li = document.createElement("li");
    li.className = "breakdown-item";
    const left = document.createElement("span");
    left.className = "breakdown-item__name";
    const dot = document.createElement("span");
    dot.className = "tx__dot";
    dot.style.background = getColor(category);
    const name = document.createElement("span");
    name.textContent = category;
    left.append(dot, name);
    const value = document.createElement("strong");
    value.textContent = formatMoney(amount);
    li.append(left, value);
    monthlyBreakdown.appendChild(li);
  });
  summaryEmpty.hidden = items.length > 0;
}
function render() {
  renderCategoryOptions();
  renderBalance();
  renderMonthFilter();
  renderList();
  renderMonthlySummary();
  renderChart();
}

categoryForm.addEventListener("submit", event => {
  event.preventDefault();
  const value = newCategoryInput.value.trim();
  const duplicate = categories.some(category => category.toLocaleLowerCase() === value.toLocaleLowerCase());
  if (!value || duplicate) {
    showError(categoryError, !value ? "Enter a category name." : "That category already exists.");
    newCategoryInput.focus();
    return;
  }
  categories.push(value);
  saveCategories();
  newCategoryInput.value = "";
  showError(categoryError, "");
  renderCategoryOptions();
  categoryInput.value = value;
});
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateTransaction()) return;
  addTransaction(nameInput.value, Number(amountInput.value), categoryInput.value, dateInput.value);
  form.reset();
  dateInput.value = localDateString();
  showError(formError, "");
  nameInput.focus();
});
[ nameInput, amountInput, categoryInput, dateInput ].forEach(input => input.addEventListener("input", () => {
  input.classList.remove("invalid");
  showError(formError, "");
}));
summaryMonthInput.addEventListener("change", () => {
  renderMonthlySummary();
  renderChart();
});
listFilterMonth.addEventListener("change", renderList);
saveLimitButton.addEventListener("click", () => {
  const month = summaryMonthInput.value || currentMonth();
  const valueText = monthlyLimitInput.value;
  const value = Number(valueText);
  if (valueText === "" || !Number.isFinite(value) || value <= 0) {
    showError(budgetError, "Enter a monthly limit greater than 0.");
    monthlyLimitInput.focus();
    return;
  }
  monthlyLimits[month] = value;
  saveLimits();
  showError(budgetError, "");
  render();
});
clearLimitButton.addEventListener("click", () => {
  const month = summaryMonthInput.value || currentMonth();
  delete monthlyLimits[month];
  saveLimits();
  monthlyLimitInput.value = "";
  showError(budgetError, "");
  render();
});

summaryMonthInput.value = currentMonth();
dateInput.value = localDateString();
render();
