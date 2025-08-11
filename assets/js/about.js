import { loadJSON, applyYear, initNavToggle } from './modules/utils.js';

initNavToggle();
applyYear();

(async () => {
  try {
    const [education, skills] = await Promise.all([
      loadJSON('../data/education.json'),
      loadJSON('../data/skills.json')
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
  const dotsWrap = document.getElementById('skillsDots');
    // Backward compatibility: if skills is an array, show as a single group
    const renderList = (arr) => `<ul class="skill-list">${arr.map(s => `<li class="fade-in">${s}</li>`).join('')}</ul>`;

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
