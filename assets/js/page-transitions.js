// Smoother gradient swipe page transition with coordinated content fade
(function(){
  const overlay = document.createElement('div');
  overlay.className = 'pt-overlay';

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let navigating = false;

  function isInternalLink(a){
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    // Allow same-page hash navigation without transition
    if (url.pathname === location.pathname && url.hash) return false;
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);

    if (!prefersReduced) {
      // Prep content for fade-in and run enter after full load to avoid jank
      document.body.classList.add('pt-enter');
      const startEnter = () => {
        overlay.classList.add('pt-enter');
        // Let main fade in slightly after we kick the overlay animation
        requestAnimationFrame(() => document.body.classList.add('pt-on'));
        overlay.addEventListener('animationend', () => {
          overlay.classList.remove('pt-enter');
          document.body.classList.remove('pt-enter');
        }, { once: true });
      };
      if (document.readyState === 'complete') startEnter();
      else window.addEventListener('load', startEnter, { once: true });
    }

    // Intercept internal link clicks to play exit animation then navigate
    document.body.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || !isInternalLink(a) || navigating) return;
      if (prefersReduced) return; // let browser navigate immediately
      e.preventDefault();
      navigating = true;
      document.body.classList.add('pt-leave');
      overlay.classList.remove('pt-enter');
      overlay.classList.add('pt-exit');
      overlay.addEventListener('animationend', () => {
        window.location.href = a.href;
      }, { once: true });
    }, { capture: true });
  });
})();
