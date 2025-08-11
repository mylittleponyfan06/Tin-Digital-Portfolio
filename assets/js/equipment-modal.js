// Equipment Specs Modal/Carousel logic

function qs(sel, root=document) { return root.querySelector(sel); }
function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

let currentIdx = 0;
let slides = [];

// Map slide index to official product URLs
const productLinks = [
  'https://staggmusic.com/en/products/view/UPC535-abs-case-for-guitar-effect-pedals-pedals-not-included', // Pedalboard Overview
  'https://www.moskyaudio.com/product/products-3-75.html', // Power Supply
  '', // Fuzz Pedal (no link provided)
  'https://effectsbakery.us/products/effects-bakery-plain-bread-compressor-eb-pbc-1', // Compressor
  'https://zoomcorp.com/en/jp/multi-effects/multistomp-pedals/ms-50g' // Multi-effects
];

function showSlide(idx) {
  if (!slides.length) return;
  currentIdx = (idx + slides.length) % slides.length;
  const slide = slides[currentIdx];
  const slideWrap = qs('.carousel-slide', qs('#equipmentModal'));
  // Add button if product link exists for this slide
  let btn = '';
  const link = productLinks[currentIdx];
  if (link) {
    btn = `<a href="${link}" target="_blank" rel="noopener" class="btn outline" style="margin-top:1rem;">Official Product Site</a>`;
  }
  slideWrap.innerHTML = `
    <img src="${slide.img}" alt="${slide.title}" style="max-width:220px; max-height:180px; border-radius:10px; box-shadow:0 2px 12px #0002; margin-bottom:1rem;">
    <h4 style="margin:0 0 .5rem;">${slide.title}</h4>
    <p style="font-size:.92rem; color:#b2b9cc; margin:0;">${slide.desc}</p>
    ${btn}
  `;
  // Indicators
  const ind = qs('.carousel-indicators', qs('#equipmentModal'));
  ind.innerHTML = slides.map((_,i) => `<span class="carousel-dot${i===currentIdx?' active':''}" data-idx="${i}"></span>`).join('');
}

function openEquipmentModal(equipment) {
  slides = equipment;
  currentIdx = 0;
  const modal = qs('#equipmentModal');
  modal.style.display = 'block';
  showSlide(0);
  setTimeout(()=>modal.classList.add('show'), 10);
}

function closeEquipmentModal() {
  const modal = qs('#equipmentModal');
  modal.classList.remove('show');
  setTimeout(()=>{ modal.style.display = 'none'; }, 180);
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
  qs('#equipmentModal .carousel-prev').onclick = () => showSlide(currentIdx-1);
  qs('#equipmentModal .carousel-next').onclick = () => showSlide(currentIdx+1);
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
}
