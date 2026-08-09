import { escapeHtml } from '../utils/dom.js';

const exampleData = [
  { Month: 'January', Revenue: 125000, Profit: 22000, Customers: 320 },
  { Month: 'February', Revenue: 138000, Profit: 26000, Customers: 340 },
  { Month: 'March', Revenue: 152000, Profit: 31000, Customers: 360 },
  { Month: 'April', Revenue: 167000, Profit: 33000, Customers: 400 },
  { Month: 'May', Revenue: 179000, Profit: 38000, Customers: 430 },
  { Month: 'June', Revenue: 183000, Profit: 41000, Customers: 450 },
];

function isNumeric(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function findFields(data) {
  const keys = new Set();
  data.forEach((item) => Object.keys(item).forEach((key) => keys.add(key)));
  return Array.from(keys);
}

function numericFields(data) {
  return findFields(data).filter((key) => data.every((item) => isNumeric(item[key])));
}

function normalizeData(raw) {
  if (!Array.isArray(raw)) {
    throw new Error('Data must be an array of objects.');
  }
  if (raw.length === 0) {
    throw new Error('Data array cannot be empty.');
  }
  if (!raw.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    throw new Error('Each entry must be an object with consistent fields.');
  }
  return raw;
}

export function renderDashboard(root, router) {
  const suppliedData = window.dashboardData && normalizeData(window.dashboardData);
  const defaultPayload = suppliedData || exampleData;

  root.innerHTML = `
    <div class="app-shell">
      <header>
        <h1>Interactive Dashboard</h1>
        <p>Visualize your data with charts, summary metrics, and tables. Paste your dataset below, then explore views instantly.</p>
      </header>

      <nav class="page-nav">
        <a href="#/">Tiebreaker</a>
        <a href="#/dashboard" class="active">Dashboard</a>
        <a href="#/saved">Saved</a>
      </nav>

      <main>
        <section class="card dashboard-panel">
          <div class="dashboard-header">
            <div>
              <h2>Load a dataset</h2>
              <p>Paste JSON array data here, then choose how to visualize it.</p>
            </div>
            <div class="button-group">
              <button type="button" id="reset-data-button" class="secondary">Reset to sample</button>
              <button type="button" id="load-data-button">Load data</button>
            </div>
          </div>

          <div class="field">
            <label for="dashboard-data-input">Dataset JSON</label>
            <textarea id="dashboard-data-input" rows="10"></textarea>
          </div>

          <div class="dashboard-controls">
            <div class="field">
              <label for="dashboard-view">Visualization type</label>
              <select id="dashboard-view">
                <option value="summary">Summary cards</option>
                <option value="table">Table view</option>
                <option value="bar">Bar chart</option>
                <option value="line">Line chart</option>
              </select>
            </div>
            <div class="field">
              <label for="x-field">X axis</label>
              <select id="x-field"></select>
            </div>
            <div class="field">
              <label for="y-field">Y axis</label>
              <select id="y-field"></select>
            </div>
          </div>
        </section>

        <section id="dashboard-preview" class="card dashboard-preview"></section>
      </main>
    </div>
  `;

  const dataInput = root.querySelector('#dashboard-data-input');
  const loadButton = root.querySelector('#load-data-button');
  const resetButton = root.querySelector('#reset-data-button');
  const viewSelect = root.querySelector('#dashboard-view');
  const xFieldSelect = root.querySelector('#x-field');
  const yFieldSelect = root.querySelector('#y-field');
  const preview = root.querySelector('#dashboard-preview');

  let currentData = defaultPayload;
  let selectedView = viewSelect.value;
  let selectedX = '';
  let selectedY = '';

  function setDataInput(data) {
    dataInput.value = JSON.stringify(data, null, 2);
  }

  function setMessage(text, variant = 'info') {
    preview.innerHTML = `<div class="dashboard-message ${variant}">${escapeHtml(text)}</div>`;
  }

  function renderFieldOptions(data) {
    const fields = findFields(data);
    xFieldSelect.innerHTML = fields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join('');

    const numeric = numericFields(data);
    yFieldSelect.innerHTML = numeric.length
      ? numeric.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join('')
      : '<option value="">No numeric fields</option>';

    selectedX = fields[0] || '';
    selectedY = numeric[0] || '';
    xFieldSelect.value = selectedX;
    yFieldSelect.value = selectedY;
  }

  function renderPreview(data) {
    if (!Array.isArray(data) || data.length === 0) {
      setMessage('Add a JSON array of objects to see your visualizations.');
      return;
    }

    const fields = findFields(data);
    if (fields.length === 0) {
      setMessage('Data must contain fields to visualize.');
      return;
    }

    const numeric = numericFields(data);
    const rows = data.length;
    const fieldCount = fields.length;

    const summarySection = `
      <div class="metric-grid">
        <div class="metric-card"><strong>${rows}</strong><span>Rows</span></div>
        <div class="metric-card"><strong>${fieldCount}</strong><span>Fields</span></div>
        <div class="metric-card"><strong>${numeric.length}</strong><span>Numeric metrics</span></div>
      </div>
    `;

    let detailSection = '';
    if (selectedView === 'summary') {
      detailSection = renderSummaryCards(data, numeric);
    } else if (selectedView === 'table') {
      detailSection = renderTable(data, fields);
    } else if (selectedView === 'bar') {
      if (!selectedY) {
        detailSection = '<p class="dashboard-help">Please select a numeric Y axis field.</p>';
      } else {
        detailSection = renderBarChart(data, selectedX, selectedY);
      }
    } else if (selectedView === 'line') {
      if (!selectedY) {
        detailSection = '<p class="dashboard-help">Please select a numeric Y axis field.</p>';
      } else {
        detailSection = renderLineChart(data, selectedX, selectedY);
      }
    }

    preview.innerHTML = `
      <div class="dashboard-header small">
        <div>
          <h2>Dataset preview</h2>
          <p>Showing <strong>${rows}</strong> records with <strong>${fieldCount}</strong> fields.</p>
        </div>
      </div>
      ${summarySection}
      ${detailSection}
    `;
  }

  function renderSummaryCards(data, numeric) {
    if (numeric.length === 0) {
      return '<p class="dashboard-help">No numeric values found for summary metrics.</p>';
    }

    return `
      <div class="dashboard-grid">
        ${numeric
          .map((field) => {
            const values = data.map((item) => Number(item[field]) || 0);
            const total = values.reduce((sum, value) => sum + value, 0);
            const average = total / values.length || 0;
            const max = Math.max(...values);
            return `
              <div class="chart-card">
                <h3>${escapeHtml(field)}</h3>
                <div class="metric-value">Total ${escapeHtml(field)}: ${total.toLocaleString()}</div>
                <div>${escapeHtml(field)} average: ${average.toFixed(1)}</div>
                <div>Max: ${max.toLocaleString()}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function renderTable(data, fields) {
    return `
      <div class="table-responsive">
        <table class="dashboard-table">
          <thead>
            <tr>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `<tr>${fields
                  .map((field) => `<td>${escapeHtml(String(row[field] ?? ''))}</td>`)
                  .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderBarChart(data, xField, yField) {
    const values = data
      .map((item) => ({
        label: String(item[xField] ?? ''),
        value: Number(item[yField]) || 0,
      }))
      .slice(0, 20);
    const max = Math.max(...values.map((item) => item.value), 1);

    return `
      <div class="chart-card">
        <h3>${escapeHtml(yField)} by ${escapeHtml(xField)}</h3>
        <div class="bar-chart">
          ${values
            .map(
              (item) => `
                <div class="bar-row">
                  <div class="bar-label">${escapeHtml(item.label)}</div>
                  <div class="bar-scale"><div class="bar-fill" style="width: ${Math.round((item.value / max) * 100)}%;"></div></div>
                  <div class="bar-value">${item.value.toLocaleString()}</div>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderLineChart(data, xField, yField) {
    const values = data
      .slice(0, 20)
      .map((item) => ({
        label: String(item[xField] ?? ''),
        value: Number(item[yField]) || 0,
      }));

    if (values.length === 0) {
      return '<p class="dashboard-help">No values available for the selected fields.</p>';
    }

    const max = Math.max(...values.map((item) => item.value), 1);
    const step = Math.max(values.length - 1, 1);
    const points = values
      .map((item, index) => {
        const left = (index / step) * 100;
        const bottom = (item.value / max) * 100;
        return `
          <div
            class="line-point"
            style="left: ${left}%; bottom: ${bottom}%;"
            title="${escapeHtml(item.label)}: ${item.value}"
          ></div>`;
      })
      .join('');

    const polylinePoints = values
      .map((item, index) => `${(index / step) * 100},${100 - (item.value / max) * 100}`)
      .join(' ');

    const labels = values
      .map((item) => `<div class="line-label">${escapeHtml(item.label)}</div>`)
      .join('');

    return `
      <div class="chart-card">
        <h3>${escapeHtml(yField)} trend by ${escapeHtml(xField)}</h3>
        <div class="line-chart-wrapper">
          <div class="line-chart">
            <svg class="line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="rgba(90, 212, 255, 0.95)" />
                  <stop offset="100%" stop-color="rgba(75, 184, 232, 0.95)" />
                </linearGradient>
              </defs>
              <polyline
                points="${polylinePoints}"
                fill="none"
                stroke="url(#lineGradient)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            ${points}
          </div>
          <div class="line-labels">${labels}</div>
        </div>
      </div>
    `;
  }

  function loadData() {
    try {
      const raw = JSON.parse(dataInput.value.trim());
      currentData = normalizeData(raw);
      renderFieldOptions(currentData);
      selectedView = viewSelect.value;
      renderPreview(currentData);
    } catch (error) {
      setMessage(`Invalid JSON: ${error.message}`, 'error');
    }
  }

  viewSelect.addEventListener('change', () => {
    selectedView = viewSelect.value;
    renderPreview(currentData);
  });

  xFieldSelect.addEventListener('change', () => {
    selectedX = xFieldSelect.value;
    renderPreview(currentData);
  });

  yFieldSelect.addEventListener('change', () => {
    selectedY = yFieldSelect.value;
    renderPreview(currentData);
  });

  loadButton.addEventListener('click', loadData);
  resetButton.addEventListener('click', () => {
    setDataInput(exampleData);
    loadData();
  });

  setDataInput(defaultPayload);
  renderFieldOptions(currentData);
  renderPreview(currentData);
}
