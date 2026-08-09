import { generateAnalysis } from '../utils/analysis.js';
import { saveDecision, getActiveDecision, clearActiveDecision } from '../utils/storage.js';
import { escapeHtml } from '../utils/dom.js';

const initialOptions = ['',''];

export function renderHome(root, router) {
  root.innerHTML = `
    <div class="app-shell">
      <header>
        <h1>The Tiebreaker</h1>
        <p>Make a decision, compare options, and get AI-style analysis for pros &amp; cons, comparison, or SWOT.</p>
      </header>

      <nav class="page-nav">
        <a href="#/" class="active">Tiebreaker</a>
        <a href="#/dashboard">Dashboard</a>
        <a href="#/saved">Saved decisions</a>
      </nav>

      <main>
        <form id="decision-form" class="card">
          <div class="field">
            <label for="decision-input">Decision to make</label>
            <textarea id="decision-input" placeholder="Describe your decision or problem..." rows="3"></textarea>
          </div>

          <div id="options-container" class="options-grid"></div>

          <div class="field button-group">
            <button type="button" id="add-option-button" class="secondary">Add another option</button>
            <button type="button" id="reset-options-button" class="secondary">Reset options</button>
          </div>

          <div class="field">
            <label for="analysis-type">Analysis format</label>
            <select id="analysis-type">
              <option value="prosCons">Pros &amp; Cons</option>
              <option value="comparison">Comparison Table</option>
              <option value="swot">SWOT Analysis</option>
            </select>
          </div>

          <div class="field">
            <label for="detail-input">Additional details (optional)</label>
            <textarea id="detail-input" placeholder="Add context, criteria, goals, or what matters most..." rows="3"></textarea>
          </div>

          <div class="field actions">
            <button type="submit" id="generate-button">Generate analysis</button>
            <button type="button" id="save-button" class="secondary">Save decision</button>
            <button type="button" id="clear-button" class="secondary">Clear</button>
          </div>
        </form>

        <section id="output-section" class="output hidden"></section>
      </main>
    </div>
  `;

  const form = root.querySelector('#decision-form');
  const outputSection = root.querySelector('#output-section');
  const optionsContainer = root.querySelector('#options-container');
  const analysisTypeSelect = root.querySelector('#analysis-type');
  const decisionInput = root.querySelector('#decision-input');
  const detailsInput = root.querySelector('#detail-input');
  const addOptionButton = root.querySelector('#add-option-button');
  const resetOptionsButton = root.querySelector('#reset-options-button');
  const saveButton = root.querySelector('#save-button');
  const clearButton = root.querySelector('#clear-button');

  let optionCount = 2;
  let activeDecision = getActiveDecision();

  function renderOptions(values = initialOptions) {
    optionCount = values.length;
    optionsContainer.innerHTML = values
      .map(
        (value, index) => `
          <div class="field option-field">
            <label for="option-input-${index + 1}">Option ${index + 1}</label>
            <input id="option-input-${index + 1}" type="text" value="${escapeHtml(value)}" placeholder="Choice ${index + 1}" />
          </div>`
      )
      .join('');
  }

  function getOptions() {
    return Array.from(optionsContainer.querySelectorAll('input'))
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  function clearForm() {
    decisionInput.value = '';
    detailsInput.value = '';
    detailsInput.value = '';
    analysisTypeSelect.value = 'prosCons';
    renderOptions(['', '']);
    outputSection.classList.add('hidden');
    outputSection.innerHTML = '';
  }

  function addOption() {
    if (optionCount >= 6) {
      alert('You can add up to 6 options.');
      return;
    }

    optionCount += 1;
    const field = document.createElement('div');
    field.className = 'field option-field';
    field.innerHTML = `
      <label for="option-input-${optionCount}">Option ${optionCount}</label>
      <input id="option-input-${optionCount}" type="text" placeholder="Choice ${optionCount}" />
    `;
    optionsContainer.appendChild(field);
  }

  function renderOutput(decisionText, detailsText, options, analysisType, analysis) {
    outputSection.classList.remove('hidden');
    outputSection.innerHTML = '';

    const heading = document.createElement('div');
    heading.className = 'analysis-block';
    heading.innerHTML = `
      <h2>Decision analysis</h2>
      <p><strong>Decision:</strong> ${escapeHtml(decisionText)}</p>
      ${detailsText ? `<p><strong>Context:</strong> ${escapeHtml(detailsText)}</p>` : ''}
      <p><strong>Options:</strong> ${options.map(escapeHtml).join(', ')}</p>
    `;
    outputSection.appendChild(heading);

    if (analysisType === 'prosCons') {
      analysis.forEach((item) => outputSection.appendChild(renderProsConsBlock(item)));
    } else if (analysisType === 'comparison') {
      outputSection.appendChild(renderComparisonBlock(analysis));
    } else if (analysisType === 'swot') {
      analysis.forEach((item) => outputSection.appendChild(renderSwotBlock(item)));
    }
  }

  function renderProsConsBlock(item) {
    const block = document.createElement('div');
    block.className = 'analysis-block';
    block.innerHTML = `
      <h3>${escapeHtml(item.option)}</h3>
      <table class="procon-list">
        <thead>
          <tr><th>Pros</th><th>Cons</th></tr>
        </thead>
        <tbody>
          ${rowsFromArrays(item.pros, item.cons)}
        </tbody>
      </table>
    `;
    block.appendChild(renderGuidance(item.guidance));
    return block;
  }

  function renderComparisonBlock(items) {
    const block = document.createElement('div');
    block.className = 'analysis-block';
    block.innerHTML = `
      <h3>Comparison table</h3>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Suitability</th>
            <th>Cost</th>
            <th>Ease</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.option)}</td>
                  <td>${item.suitability}/5</td>
                  <td>${item.cost}/5</td>
                  <td>${item.ease}/5</td>
                  <td>${item.risk}/5</td>
                </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;
    items.forEach((item) => block.appendChild(renderGuidance(item.guidance)));
    return block;
  }

  function renderSwotBlock(item) {
    const block = document.createElement('div');
    block.className = 'analysis-block';
    block.innerHTML = `
      <h3>${escapeHtml(item.option)}</h3>
      <div class="swot-grid">
        <div class="swot-item"><strong>Strengths</strong><p>${escapeHtml(item.strengths.join(' '))}</p></div>
        <div class="swot-item"><strong>Weaknesses</strong><p>${escapeHtml(item.weaknesses.join(' '))}</p></div>
        <div class="swot-item"><strong>Opportunities</strong><p>${escapeHtml(item.opportunities.join(' '))}</p></div>
        <div class="swot-item"><strong>Threats</strong><p>${escapeHtml(item.threats.join(' '))}</p></div>
      </div>
    `;
    block.appendChild(renderGuidance(item.guidance));
    return block;
  }

  function rowsFromArrays(pros, cons) {
    const max = Math.max(pros.length, cons.length);
    return Array.from({ length: max }, (_, index) => {
      const pro = pros[index] ? escapeHtml(pros[index]) : '';
      const con = cons[index] ? escapeHtml(cons[index]) : '';
      return `<tr><td>${pro}</td><td>${con}</td></tr>`;
    }).join('');
  }

  function renderGuidance(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'analysis-block';
    wrapper.innerHTML = `<p><strong>AI insight:</strong> ${escapeHtml(text)}</p>`;
    return wrapper;
  }

  function handleSave() {
    const decisionText = decisionInput.value.trim();
    const detailsText = detailsInput.value.trim();
    const options = getOptions();
    const analysisType = analysisTypeSelect.value;

    if (!decisionText) {
      alert('Please describe the decision before saving.');
      return;
    }

    if (options.length < 2) {
      alert('Save at least two options to keep this decision useful.');
      return;
    }

    const record = {
      id: Date.now().toString(),
      decision: decisionText,
      details: detailsText,
      analysisType,
      options,
      createdAt: new Date().toISOString(),
    };

    saveDecision(record);
    alert('Decision saved. You can load it later from the Saved page.');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const decisionText = decisionInput.value.trim();
    const detailsText = detailsInput.value.trim();
    const options = getOptions();
    const analysisType = analysisTypeSelect.value;

    if (!decisionText) {
      alert('Please describe the decision you want to make.');
      return;
    }

    if (options.length < 2) {
      alert('Enter at least two options to compare.');
      return;
    }

    const analysis = generateAnalysis(decisionText, detailsText, options, analysisType);
    renderOutput(decisionText, detailsText, options, analysisType, analysis);
  }

  addOptionButton.addEventListener('click', addOption);
  resetOptionsButton.addEventListener('click', () => renderOptions(['', '']));
  clearButton.addEventListener('click', clearForm);
  saveButton.addEventListener('click', handleSave);
  form.addEventListener('submit', handleSubmit);

  if (activeDecision) {
    decisionInput.value = activeDecision.decision;
    detailsInput.value = activeDecision.details;
    analysisTypeSelect.value = activeDecision.analysisType || 'prosCons';
    renderOptions(activeDecision.options.length >= 2 ? activeDecision.options : ['', '']);
    clearActiveDecision();
  } else {
    renderOptions(['', '']);
  }
}
