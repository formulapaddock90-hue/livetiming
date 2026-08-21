// Gestione Tab Pre-Weekend vs Weekend e sotto-tab giorni (Venerdì / Sabato / Domenica)
function setupPostGaraTabs() {
    const mainBtns = document.querySelectorAll('.postgara-main-tab-btn');
    const dayNavWrapper = document.getElementById('postgara-day-nav-wrapper');
    const standingCard = document.getElementById('postgara-standing-card');
    const chartsSection = document.getElementById('postgara-full-charts-section');

    mainBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.getAttribute('data-subtab');

            mainBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (subtab === 'pre-weekend') {
                if (dayNavWrapper) dayNavWrapper.style.display = 'none';
                if (standingCard) standingCard.style.display = 'none';
                if (chartsSection) chartsSection.style.display = 'none';
            } else {
                if (dayNavWrapper) dayNavWrapper.style.display = 'flex';
                // Attiva il sotto-tab corrente o default 'domenica'
                const activeDayBtn = document.querySelector('.postgara-day-tab-btn.active') || document.querySelector('.postgara-day-tab-btn[data-day="domenica"]');
                if (activeDayBtn) activeDayBtn.click();
            }
        });
    });

    const dayBtns = document.querySelectorAll('.postgara-day-tab-btn');
    dayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');

            dayBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (day === 'domenica') {
                if (standingCard) standingCard.style.display = 'block';
                if (chartsSection) chartsSection.style.display = 'block';
            } else {
                if (standingCard) standingCard.style.display = 'none';
                if (chartsSection) chartsSection.style.display = 'none';
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPostGaraTabs);
} else {
    setupPostGaraTabs();
}
