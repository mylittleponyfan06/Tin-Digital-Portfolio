// Cute ASCII-cat page transition: softer fade + flying cat layer
(function () {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CATS = [
    '/\\_/\\  ( o.o )  > ^ <',
    '(=^.^=)',
    '/\\_/\\  (=^_^=)',
    '(=^..^=)~',
    '/\\_/\\  ( -.- )  zZ',
    '', '(˶˃ ᵕ ˂˶) ٩(^ᗜ^ )و ´-', 
    '₍₍⚞(˶˃ ꒳ ˂˶)⚟⁾⁾',
    '✧｡٩(ˊᗜˋ )و✧*｡'
  ];

  const TRANSITION_MS = 2000;
  const CAT_DELAY_STEP_MS = 64;
  let navigating = false;
  let overlay = null;
  let layer = null;

  function isInternalLink(anchor) {
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.hash) return false;
    return true;
  }

  function clearLayer() {
    if (layer) layer.innerHTML = '';
  }

  function spawnCats(direction) {
    if (!layer) return;
    clearLayer();

    const count = window.innerWidth < 760 ? 3 : 4;
    const catDuration = Math.max(500, TRANSITION_MS - CAT_DELAY_STEP_MS * (count - 1) - 70);

    for (let i = 0; i < count; i += 1) {
      const cat = document.createElement('span');
      cat.className = 'pt-cat';
      if (direction === 'rtl') cat.classList.add('rtl');
      cat.textContent = CATS[i % CATS.length];

      const top = Math.min(80, 16 + i * (62 / count) + Math.random() * 7);
      const duration = catDuration;
      const delay = i * CAT_DELAY_STEP_MS;
      const tilt = (Math.random() * 4 - 2).toFixed(2);

      cat.style.setProperty('--pt-top', `${top}vh`);
      cat.style.setProperty('--pt-duration', `${duration}ms`);
      cat.style.setProperty('--pt-delay', `${delay}ms`);
      cat.style.setProperty('--pt-tilt', `${tilt}deg`);
      layer.appendChild(cat);
    }
  }

  function runTransition(mode, onDone) {
    if (!overlay || prefersReduced) {
      if (onDone) onDone();
      return;
    }

    const isEnter = mode === 'enter';
    document.body.classList.remove('pt-cats-enter', 'pt-cats-leave');
    overlay.classList.remove('pt-cats-active', 'pt-cats-entering', 'pt-cats-leaving');

    // Force reflow so repeated transitions replay cleanly.
    void overlay.offsetWidth;

    document.body.classList.add(isEnter ? 'pt-cats-enter' : 'pt-cats-leave');
    overlay.classList.add('pt-cats-active', isEnter ? 'pt-cats-entering' : 'pt-cats-leaving');
    spawnCats(isEnter ? 'rtl' : 'ltr');

    window.setTimeout(() => {
      document.body.classList.remove('pt-cats-enter', 'pt-cats-leave');
      overlay.classList.remove('pt-cats-active', 'pt-cats-entering', 'pt-cats-leaving');
      clearLayer();
      if (onDone) onDone();
    }, TRANSITION_MS);
  }

  document.addEventListener('DOMContentLoaded', () => {
    overlay = document.createElement('div');
    overlay.className = 'pt-cats-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    layer = document.createElement('div');
    layer.className = 'pt-cats-layer';
    overlay.appendChild(layer);
    document.body.appendChild(overlay);

    if (!prefersReduced) {
      const startEnter = () => runTransition('enter');
      if (document.readyState === 'complete') startEnter();
      else window.addEventListener('load', startEnter, { once: true });

      window.addEventListener('pageshow', (event) => {
        if (event.persisted) runTransition('enter');
      });
    }

    document.body.addEventListener(
      'click',
      (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const anchor = event.target.closest('a[href]');
        if (!anchor || !isInternalLink(anchor) || navigating) return;
        if (prefersReduced) return;

        event.preventDefault();
        navigating = true;
        runTransition('leave', () => {
          window.location.href = anchor.href;
        });
      },
      { capture: true }
    );
  });
})();
