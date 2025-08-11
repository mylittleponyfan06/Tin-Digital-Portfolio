import { loadJSON, renderProjectCards, applyYear, initFilters, initNavToggle } from './modules/utils.js';

initNavToggle();
applyYear();

(async () => {
  try {
    const code = await loadJSON('../data/code-projects.json');
    const container = document.getElementById('codeProjectCards');
    renderProjectCards(code, container);
    const tagSet = new Set();
    code.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    initFilters(Array.from(tagSet).sort(), code, container);
  } catch (e) {
    console.error('Code projects failed', e);
  }
})();
