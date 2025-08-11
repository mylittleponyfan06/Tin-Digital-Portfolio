import { loadJSON, renderProjectCards, applyYear, initNavToggle } from './modules/utils.js';

initNavToggle();
applyYear();

// Load featured projects (mix of art + code flagged as featured=true)
(async () => {
  try {
    const [art, code] = await Promise.all([
      loadJSON('data/art-projects.json'),
      loadJSON('data/code-projects.json')
    ]);
    const featured = [...art, ...code].filter(p => p.featured).slice(0, 6);
    renderProjectCards(featured, document.getElementById('featuredCards'));
  } catch (e) {
    console.error('Failed to load featured projects', e);
  }
})();
