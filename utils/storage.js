const storageKey = 'tiebreaker-saved-decisions';
const activeKey = 'tiebreaker-active-decision';

export function getSavedDecisions() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function setSavedDecisions(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function saveDecision(record) {
  const saved = getSavedDecisions();
  saved.unshift(record);
  setSavedDecisions(saved);
  return saved;
}

export function deleteDecision(id) {
  const saved = getSavedDecisions().filter((item) => item.id !== id);
  setSavedDecisions(saved);
  return saved;
}

export function setActiveDecision(record) {
  localStorage.setItem(activeKey, JSON.stringify(record));
}

export function getActiveDecision() {
  try {
    return JSON.parse(localStorage.getItem(activeKey) || 'null');
  } catch {
    return null;
  }
}

export function clearActiveDecision() {
  localStorage.removeItem(activeKey);
}
