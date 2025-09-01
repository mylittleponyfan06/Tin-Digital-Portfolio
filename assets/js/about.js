import { loadJSON, applyYear, initNavToggle } from './modules/utils.js';

initNavToggle();
applyYear();

(async () => {
  try {
    const [education, skills] = await Promise.all([
      loadJSON('data/education.json'),
      loadJSON('data/skills.json')
    ]);

    const eduList = document.getElementById('educationTimeline');
    education.sort((a,b)=> b.start.localeCompare(a.start));
    eduList.innerHTML = education.map(item => `
      <li class="fade-in">
        <time>${item.start}${item.end ? ' – ' + item.end : ''}</time>
        <strong>${item.title}</strong><br/>
        <span>${item.place}</span>
      </li>`).join('');

  const skillGroupsEl = document.getElementById('skillGroups');
  // Optional logo mapping for popular technologies (uses Devicon via jsDelivr)
  const ICONS = {
    'html': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    'css': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
    'javascript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    'react': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    'vite': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Jinja_software_logo.svg/300px-Jinja_software_logo.svg.png?20181208104937',
  'jinja': 'https://www.svgrepo.com/show/473669/jinja.svg',
    'node.js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    'node': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    'python': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    'flask': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
    'c#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    'csharp': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    'mysql': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    'github': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
  // AWS via Devicon
  'aws': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fpixelbag.net%2Fwp-content%2Fuploads%2F2021%2F12%2FAWS-Logo-svg.jpg&f=1&nofb=1&ipt=https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fgadget.co.za%2Fwp-content%2Fuploads%2F2020%2F12%2Faws-logo-scaled.jpg&f=1&nofb=1&ipt=092adcfd862ad5fd759ef1ba9abcbde95478acd67630048a5ee51218c8a22d65',
  // TiDB / TiDB Cloud (CloudTiDB) via Simple Icons CDN
  'cloudtidb': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimage.pngaaa.com%2F259%2F2969259-middle.png&f=1&nofb=1&ipt=ad139f9d034e17548b52f1b2a25130ffb8d352c33968419e64ad078504f14ae9',
  };

  const normalize = (s) => String(s).trim().toLowerCase()
    .replace(/\(react\)|\(.*?\)/g, '')
    .replace(/\.js|\.jsx|\.ts|\.tsx/g, '')
    .replace(/\s+&\s+/, ' & ')
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim();

  const getIconFor = (label) => {
    const key = normalize(label);
    if (ICONS[key]) return ICONS[key];
    // Special cases
    if (key.includes('react')) return ICONS['react'];
    if (key.includes('node')) return ICONS['node'];
    if (key.includes('html')) return ICONS['html'];
    if (key.includes('css')) return ICONS['css'];
    if (key.includes('javascript') || key === 'js') return ICONS['javascript'];
  if (key.includes('aws') || key.includes('amazon web service')) return ICONS['aws'];
  if (key.includes('cloudtidb') || key === 'tidb' || key.includes('tidb')) return ICONS['cloudtidb'];
    return null;
  };
  const dotsWrap = document.getElementById('skillsDots');
    // Backward compatibility: if skills is an array, show as a single group
    const renderList = (arr) => `<ul class="skill-list">${arr.map(s => {
      const isObj = s && typeof s === 'object';
      const name = isObj ? (s.name || s.label || '') : String(s);
      const logo = isObj && s.logo ? s.logo : getIconFor(name);
      const title = isObj && s.title ? s.title : name;
      // Hide broken icons gracefully
      const img = logo ? `<img class=\"skill-icon\" src=\"${logo}\" alt=\"\" title=\"${title}\" loading=\"lazy\" onerror=\"this.style.display='none'\">` : '';
      return `<li class=\"fade-in\">${img}<span>${title}</span></li>`;
    }).join('')}</ul>`;

    if (Array.isArray(skills)) {
      // Single group mode (legacy)
      skillGroupsEl.className = 'skill-groups';
      skillGroupsEl.innerHTML = `
        <section class="skill-group">
          <h3>Skills</h3>
          ${renderList(skills)}
        </section>`;
      if (dotsWrap) dotsWrap.style.display = 'none';
    } else if (skills && typeof skills === 'object') {
      // Expected shape: { technical: [...], soft: [...], hobby: [...] }
      const order = [
        ['technical', 'Technical skills'],
        ['soft', 'Soft skills'],
        ['hobby', 'Hobby skills']
      ];
      skillGroupsEl.className = 'skill-groups';
      const renderSubgroups = (obj) => {
        const entries = Object.entries(obj).filter(([, arr]) => Array.isArray(arr) && arr.length);
        if (!entries.length) return '';
        return `
          <div class="skill-subgroups">
            ${entries.map(([subLabel, arr]) => `
              <section class="skill-subgroup">
                <h4>${subLabel}</h4>
                ${renderList(arr)}
              </section>
            `).join('')}
          </div>
        `;
      };
      // Build labeled tabs
      const available = order.filter(([key]) => skills[key]);
      if (dotsWrap) {
        dotsWrap.setAttribute('role', 'tablist');
        dotsWrap.innerHTML = available.map(([key, label], i) => {
          const text = label.replace(/\s*skills/i, '').trim();
          return `
            <button role="tab" class="skills-tab${i===0?' active':''}" data-key="${key}" title="${label}" aria-pressed="${i===0}" aria-selected="${i===0}">
              ${text}
            </button>`;
        }).join('');
      }

      const renderCategory = (key) => {
        const val = skills[key];
        const label = order.find(([k]) => k===key)?.[1] || '';
        const content = Array.isArray(val) ? renderList(val) : renderSubgroups(val);
        return `
          <section class="skill-group">
            <h3>${label}</h3>
            ${content}
          </section>
        `;
      };

      // Initial render: first category
      let activeKey = available[0]?.[0];
      skillGroupsEl.innerHTML = renderCategory(activeKey);

      // Handle swapping
      dotsWrap?.addEventListener('click', (e) => {
        const tab = e.target.closest('.skills-tab');
        if (!tab) return;
        const key = tab.dataset.key;
        if (!key || key === activeKey) return;
        activeKey = key;
        // Visual active state
        dotsWrap.querySelectorAll('.skills-tab').forEach(d => {
          const isActive = d === tab;
          d.classList.toggle('active', isActive);
          d.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          d.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        // Swap animation
        skillGroupsEl.classList.add('swapping');
        setTimeout(() => {
          skillGroupsEl.innerHTML = renderCategory(key);
          skillGroupsEl.classList.remove('swapping');
        }, 180);
      });
    }
  } catch (e) {
    console.error('About data failed', e);
  }
})();
