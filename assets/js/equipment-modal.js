// Equipment Specs Modal/Carousel logic

function qs(sel, root=document) { return root.querySelector(sel); }
function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

let currentIdx = 0;
let slides = [];
let positionArrowsCleanup = null;

// Map slide index to official product URLs
const productLinks = [
  'https://staggmusic.com/en/products/view/UPC535-abs-case-for-guitar-effect-pedals-pedals-not-included', // Pedalboard
  'https://www.moskyaudio.com/product/products-3-75.html', // Power Supply
  'https://www.facebook.com/share/v/19knkSG3yY/', // Fuzz Pedal 
  'https://effectsbakery.us/products/effects-bakery-plain-bread-compressor-eb-pbc-1', // Compressor
  'https://zoomcorp.com/en/jp/multi-effects/multistomp-pedals/ms-50g' // Multi-effects
];

function showSlide(idx) {
  if (!slides.length) return;
  currentIdx = (idx + slides.length) % slides.length;
  const slide = slides[currentIdx];
  const slideWrap = qs('.carousel-slide', qs('#equipmentModal'));

  let btn = '';
  const link = productLinks[currentIdx];
  if (link) {
  btn = `<a href="${link}" target="_blank" rel="noopener" class="btn outline" style="margin-top:1rem;">Official Product Site</a>`;
  }
  slideWrap.innerHTML = `
    <img class="equipment-img" src="${slide.img}" alt="${slide.title}">
    <h4 style="margin:0 0 .5rem;">${slide.title}</h4>
    <p style="font-size:.92rem; color:#b2b9cc; margin:0;">${slide.desc}</p>
    ${btn}
  `;
  // Show spinner until image loads
  const modal = qs('#equipmentModal');
  const spinner = qs('.equipment-modal__spinner', modal);
  if (spinner) spinner.classList.add('show');
  const img = qs('.equipment-img', slideWrap);
  if (img) {
    const done = () => { if (spinner) spinner.classList.remove('show'); positionArrows(); };
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once:true });
      img.addEventListener('error', done, { once:true });
    }
  }
  // Indicators
  const ind = qs('.carousel-indicators', qs('#equipmentModal'));
  ind.innerHTML = slides.map((_,i) => `<span class="carousel-dot${i===currentIdx?' active':''}" data-idx="${i}"></span>`).join('');

  // Reposition arrows after DOM updates
  requestAnimationFrame(positionArrows);
}

function openEquipmentModal(equipment) {
  slides = equipment;
  currentIdx = 0;
  const modal = qs('#equipmentModal');
  const content = qs('.equipment-modal__content', modal);
  modal.style.display = 'block';
  // reset zoom
  content.style.setProperty('--zoom', '1');
  const range = qs('.zoom-range', modal);
  if (range) range.value = '1';
  showSlide(0);
  setTimeout(()=>modal.classList.add('show'), 10);
  // Init arrow positioning listeners
  setupArrowPositioning();
}

function closeEquipmentModal() {
  const modal = qs('#equipmentModal');
  modal.classList.remove('show');
  setTimeout(()=>{ modal.style.display = 'none'; }, 180);
  if (positionArrowsCleanup) { positionArrowsCleanup(); positionArrowsCleanup = null; }
}

export function initEquipmentModal() {
  // Open modal on button click
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('.equipment-specs-btn');
    if (!btn) return;
    let equipment;
    try { equipment = JSON.parse(btn.dataset.equipment); } catch { return; }
    openEquipmentModal(equipment);
  });
  // Close modal
  qs('#equipmentModal .equipment-modal__close').onclick = closeEquipmentModal;
  qs('#equipmentModal .equipment-modal__overlay').onclick = closeEquipmentModal;
  // Carousel prev/next
  // support both positions (outside sibling + legacy inside)
  const prevBtn = qs('#equipmentModal > .carousel-prev') || qs('#equipmentModal .carousel-prev');
  const nextBtn = qs('#equipmentModal > .carousel-next') || qs('#equipmentModal .carousel-next');
  if (prevBtn) prevBtn.onclick = () => showSlide(currentIdx-1);
  if (nextBtn) nextBtn.onclick = () => showSlide(currentIdx+1);
  // Dots
  qs('#equipmentModal .carousel-indicators').onclick = e => {
    const dot = e.target.closest('.carousel-dot');
    if (!dot) return;
    showSlide(Number(dot.dataset.idx));
  };
  // Esc key
  document.addEventListener('keydown', e => {
    if (qs('#equipmentModal').style.display !== 'block') return;
    if (e.key === 'Escape') closeEquipmentModal();
    if (e.key === 'ArrowLeft') showSlide(currentIdx-1);
    if (e.key === 'ArrowRight') showSlide(currentIdx+1);
  });

  // Zoom wiring
  const modal = qs('#equipmentModal');
  const content = qs('.equipment-modal__content', modal);
  const range = qs('.zoom-range', modal);
  const zoomIn = qs('.zoom-in', modal);
  const zoomOut = qs('.zoom-out', modal);
  const setZoom = (z) => {
    const clamped = Math.max(0.8, Math.min(1.8, z));
    content.style.setProperty('--zoom', String(clamped));
    if (range) range.value = String(clamped);
  };
  if (range) range.addEventListener('input', () => setZoom(parseFloat(range.value)));
  if (zoomIn) zoomIn.addEventListener('click', () => setZoom((parseFloat(range.value)||1)+0.1));
  if (zoomOut) zoomOut.addEventListener('click', () => setZoom((parseFloat(range.value)||1)-0.1));

  // Also reposition arrows on zoom changes
  const observer = new MutationObserver(() => positionArrows());
  if (content) observer.observe(content, { attributes:true, attributeFilter:['style']});
}

function getContentRect() {
  const modal = qs('#equipmentModal');
  const content = qs('.equipment-modal__content', modal);
  if (!content) return null;
  return content.getBoundingClientRect();
}

function positionArrows() {
  const modal = qs('#equipmentModal');
  const contentRect = getContentRect();
  if (!modal || !contentRect) return;
  const prevBtn = qs('#equipmentModal > .carousel-prev');
  const nextBtn = qs('#equipmentModal > .carousel-next');
  if (!prevBtn || !nextBtn) return;
  const btnOffset = 12; // px away from the content box
  const midY = contentRect.top + contentRect.height / 2;
  const prevX = contentRect.left - btnOffset - prevBtn.offsetWidth;
  const nextX = contentRect.right + btnOffset;
  Object.assign(prevBtn.style, { top: `${midY}px`, left: `${prevX}px`, transform: 'translateY(-50%)' });
  Object.assign(nextBtn.style, { top: `${midY}px`, left: `${nextX}px`, transform: 'translateY(-50%)' });
}

function setupArrowPositioning() {
  const onResize = () => positionArrows();
  window.addEventListener('resize', onResize);
  // Reposition after zoom slider input as well
  const modal = qs('#equipmentModal');
  const range = qs('.zoom-range', modal);
  const onInput = () => positionArrows();
  if (range) range.addEventListener('input', onInput);
  positionArrows();
  positionArrowsCleanup = () => {
    window.removeEventListener('resize', onResize);
    if (range) range.removeEventListener('input', onInput);
  };
}
