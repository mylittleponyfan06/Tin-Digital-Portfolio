import { loadJSON, renderProjectCards, applyYear, initFilters, initNavToggle } from './modules/utils.js';

initNavToggle();
applyYear();

(async () => {
  try {
    const art = await loadJSON('../data/art-projects.json');
    const container = document.getElementById('artProjectCards');
    renderProjectCards(art, container);

    const tagSet = new Set();
    art.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    initFilters(Array.from(tagSet).sort(), art, container);
  } catch (e) {
    console.error('Art projects failed', e);
  }
})();
