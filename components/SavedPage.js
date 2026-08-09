import { getSavedDecisions, deleteDecision, setActiveDecision } from '../utils/storage.js';
import { escapeHtml } from '../utils/dom.js';

export function renderSavedPage(root, router) {
  root.innerHTML = `
    <div class="app-shell">
      <header>
        <h1>The Tiebreaker</h1>
        <p>Review your saved decisions, load one back into the editor, or delete items you no longer need.</p>
      </header>

      <nav class="page-nav">
        <a href="#/">Decision</a>
        <a href="#/saved" class="active">Saved decisions</a>
      </nav>

      <main>
        <section class="card saved-card">
          <h2>Saved decisions</h2>
          <div id="saved-list" class="saved-list"></div>
        </section>
      </main>
    </div>
  `;

  const savedList = root.querySelector('#saved-list');
  renderSavedList();

  function renderSavedList() {
    const saved = getSavedDecisions();
    savedList.innerHTML = '';

    if (saved.length === 0) {
      savedList.innerHTML = '<p>No saved decisions yet. Use the Decision page to save one.</p>';
      return;
    }

    saved.forEach((record) => {
      const item = document.createElement('div');
      item.className = 'saved-item';
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(record.decision)}</strong>
          <p>${escapeHtml(record.options.join(', '))}</p>
          <small>Saved ${new Date(record.createdAt).toLocaleString()}</small>
        </div>
        <div class="saved-actions">
          <button type="button" data-action="load" data-id="${record.id}">Load</button>
          <button type="button" data-action="delete" data-id="${record.id}" class="secondary">Delete</button>
        </div>
      `;

      item.querySelector('[data-action="load"]').addEventListener('click', () => {
        setActiveDecision(record);
        router.navigate('#/');
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', () => {
        deleteDecision(record.id);
        renderSavedList();
      });

      savedList.appendChild(item);
    });
  }
}
