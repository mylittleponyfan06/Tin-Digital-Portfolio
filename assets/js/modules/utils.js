export function initNavToggle() {
  const btn = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('show');
  });
}

export function applyYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
}

export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export function renderProjectCards(projects, container) {
  if (!container) return;
  container.innerHTML = projects.map(p => {
    const isPedalboard = p.title === "Pedalboard Layout" && Array.isArray(p.equipment);
    return `
      <article class="card fade-in">
        ${p.image ? `<img src="${p.image}" alt="${p.title} image" loading="lazy" style="border-radius:12px;">` : ''}
        <h3>${p.title}</h3>
        ${p.subtitle ? `<p>${p.subtitle}</p>` : ''}
        <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="links" style="margin-top:.6rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          ${p.links?.demo ? `<a class="btn outline" target="_blank" rel="noopener" href="${p.links.demo}">Demo</a>` : ''}
          ${p.links?.github ? `<a class="btn outline" target="_blank" rel="noopener" href="${p.links.github}">GitHub</a>` : ''}
          ${p.links?.BMOS ? `<a class="btn outline" target="_blank" rel="noopener" href="${p.links.BMOS}">BMOS gig recording</a>` : ''}
          ${p.links?.readMore ? `<a class="btn" href="${p.links.readMore}">Read</a>` : ''}
          ${isPedalboard ? `<button class="btn outline equipment-specs-btn" data-equipment='${JSON.stringify(p.equipment)}'>Equipment Specs</button>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

export function initFilters(allTags, projects, container) {
  const wrap = document.getElementById(container.id.includes('art') ? 'artFilters' : 'codeFilters');
  if (!wrap) return;

  const isArt = container.id.includes('art');
  // For code projects, only show 'Performance', 'CCA', and a 'Search' button
  let shownTags;
  if (isArt) {
    const allowedArtTabs = ["Guitar", "Coding", "Crochet"];
    shownTags = allowedArtTabs.filter(tag => allTags.includes(tag));
  } else {
    shownTags = ["Performance", "CCA"];
  }

  const makeBtn = (label) => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = label;
    b.dataset.tag = label;
    return b;
  };

  const allBtn = makeBtn('All');
  allBtn.classList.add('active');
  wrap.appendChild(allBtn);
  shownTags.forEach(tag => wrap.appendChild(makeBtn(tag)));

  // Add a Search button for code projects
  let searchInput = null;
  if (!isArt) {
    const searchBtn = makeBtn('Search');
    searchBtn.classList.add('search-btn');
    wrap.appendChild(searchBtn);
    // Get the search input
    searchInput = document.getElementById('codeSearchInput');
    if (searchInput) {
      searchInput.style.display = 'none';
      searchInput.value = '';
    }
  }

  const apply = (tag) => {
    if (tag === 'Search') {
      if (searchInput) {
        searchInput.style.display = 'block';
        searchInput.focus();
      }
      return;
    } else if (searchInput) {
      searchInput.style.display = 'none';
      searchInput.value = '';
    }
    const filtered = tag === 'All' ? projects : projects.filter(p => p.tags.includes(tag));
    renderProjectCards(filtered, container);
    wrap.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === tag));
  };

  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    apply(btn.dataset.tag);
  });

  // Search input event for code projects
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        renderProjectCards(projects, container);
        return;
      }
      const filtered = projects.filter(p =>
        (p.tags && p.tags.some(t => t.toLowerCase().includes(val))) ||
        (p.title && p.title.toLowerCase().includes(val)) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(val))
      );
      renderProjectCards(filtered, container);
    });
  }
}
