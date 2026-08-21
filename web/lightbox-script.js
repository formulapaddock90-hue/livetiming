// GESTIONE LIGHTBOX TEMPORANEO AL MOUSEOVER/MOUSELEAVE
function setupHoverLightbox() {
    const overlay = document.getElementById('hover-lightbox-overlay');
    const lightboxImg = document.getElementById('hover-lightbox-img');
    const lightboxTitle = document.getElementById('hover-lightbox-title');

    if (!overlay || !lightboxImg || !lightboxTitle) return;

    document.addEventListener('mouseover', (e) => {
        const thumb = e.target.closest('.picker-img-thumb, .picker-img-card img, .picker-img-card');
        if (thumb) {
            const imgEl = thumb.tagName === 'IMG' ? thumb : thumb.querySelector('img');
            if (imgEl && imgEl.src) {
                lightboxImg.src = imgEl.src;
                lightboxTitle.textContent = imgEl.alt || '';
                overlay.style.display = 'flex';
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const thumb = e.target.closest('.picker-img-thumb, .picker-img-card img, .picker-img-card');
        if (thumb) {
            overlay.style.display = 'none';
            lightboxImg.src = '';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHoverLightbox);
} else {
    setupHoverLightbox();
}
