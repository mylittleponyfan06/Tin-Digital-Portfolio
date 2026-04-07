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

export function toSitePath(path = '') {
  const value = String(path || '').trim();
  if (
    !value ||
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('//') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('data:') ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return value;
  }

  return `/${value.replace(/^\.?\//, '')}`;
}

export async function loadJSON(path) {
  const res = await fetch(toSitePath(path));
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

function escapeAttr(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

let privateRepoToastEl = null;
let privateRepoToastTimer = null;

function getPrivateRepoToast() {
  if (privateRepoToastEl) return privateRepoToastEl;
  const toast = document.createElement('div');
  toast.className = 'private-repo-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  privateRepoToastEl = toast;
  return privateRepoToastEl;
}

function showPrivateRepoToast(message) {
  const toast = getPrivateRepoToast();
  toast.textContent = message || 'This GitHub repository is currently private.';
  toast.classList.add('show');

  if (privateRepoToastTimer) window.clearTimeout(privateRepoToastTimer);
  privateRepoToastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2300);
}

function bindPrivateRepoButtons(container) {
  if (!container || container.dataset.privateRepoBound === 'true') return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-private-repo');
    if (!btn) return;
    const msg = btn.getAttribute('data-private-message') || 'This GitHub repository is currently private.';
    btn.classList.remove('is-notified');
    void btn.offsetWidth;
    btn.classList.add('is-notified');
    window.setTimeout(() => btn.classList.remove('is-notified'), 420);
    showPrivateRepoToast(msg);
  });

  container.dataset.privateRepoBound = 'true';
}

export function renderProjectCards(projects, container) {
  if (!container) return;
  bindPrivateRepoButtons(container);

  container.innerHTML = projects.map(p => {
    const isPedalboard = p.title === "Pedalboard Layout" && Array.isArray(p.equipment);
    const imageSrc = p.image ? escapeAttr(toSitePath(p.image)) : '';
    const privateRepoMessage = p.links?.githubPrivateMessage || 'This GitHub repository is currently private.';
    const privateRepoLabel = p.links?.githubPrivateLabel || 'GitHub';
    const privateRepoHint = p.links?.githubPrivateHint || 'Private repo - click for details';
    const safePrivateRepoLabel = escapeAttr(privateRepoLabel);
    const safePrivateRepoHint = escapeAttr(privateRepoHint);
    const demoLink = escapeAttr(toSitePath(p.links?.demo || ''));
    const githubLink = escapeAttr(toSitePath(p.links?.github || ''));
    const bmosLink = escapeAttr(toSitePath(p.links?.BMOS || ''));
    const readMoreLink = escapeAttr(toSitePath(p.links?.readMore || ''));
    const rainmeterLink = escapeAttr(toSitePath(p.links?.Rainmeter || ''));
    const equipmentData = isPedalboard
      ? escapeAttr(JSON.stringify(p.equipment.map(slide => ({
          ...slide,
          img: toSitePath(slide.img)
        }))))
      : '';
    const githubAction = p.links?.githubPrivate
      ? `<button class="btn outline btn-private-repo" type="button" data-private-message="${escapeAttr(privateRepoMessage)}" aria-label="${safePrivateRepoLabel} (${safePrivateRepoHint})" title="${escapeAttr(privateRepoMessage)}"><span class="btn-private-repo__title">${safePrivateRepoLabel}</span><span class="btn-private-repo__hint">${safePrivateRepoHint}</span></button>`
      : p.links?.github
        ? `<a class="btn outline" target="_blank" rel="noopener" href="${githubLink}">GitHub</a>`
        : '';
    const bmosAction = p.links?.BMOS
      ? `<a class="btn outline" target="_blank" rel="noopener" href="${bmosLink}">BMOS gig recording</a>`
      : p.links?.BMOSPlaceholder
        ? `<span class="btn outline" aria-disabled="true">${escapeAttr(p.links.BMOSPlaceholder)}</span>`
        : '';

    return `
      <article class="card fade-in">
        ${p.image ? `<img src="${imageSrc}" alt="${escapeAttr(p.title)} image" loading="lazy" style="border-radius:12px;">` : ''}
        <h3>${p.title}</h3>
        ${p.subtitle ? `<p>${p.subtitle}</p>` : ''}
        <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="links" style="margin-top:.6rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          ${p.links?.demo ? `<a class="btn outline" target="_blank" rel="noopener" href="${demoLink}">Demo</a>` : ''}
          ${githubAction}
          ${bmosAction}
          ${p.links?.readMore ? `<a class="btn" href="${readMoreLink}">Read</a>` : ''}
          ${p.links?.Rainmeter ? `<a class="btn outline" target="_blank" rel="noopener" href="${rainmeterLink}">View/Download here!</a>` : ''}
          ${isPedalboard ? `<button class="btn outline equipment-specs-btn" data-equipment="${equipmentData}">Equipment Specs</button>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

export function initFilters(allTags, projects, container) {
  const wrap = document.getElementById(container.id.includes('art') ? 'artFilters' : 'codeFilters');
  if (!wrap) return;

  const isArt = container.id.includes('art');
  let shownTags;
  if (isArt) {
    const allowedArtTabs = ["Guitar", "Coding", "Crochet"];
    shownTags = allowedArtTabs.filter(tag => allTags.includes(tag));
  } else {
    shownTags = ["performances", "CCA"];
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
