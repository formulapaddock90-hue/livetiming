// Gestione Tab Pre Weekend vs Weekend e Sotto-tab Venerdì/Sabato/Domenica
function setupPostGaraNavTabs() {
    // Main Tabs (Pre-Weekend vs Weekend)
    const mainTabBtns = document.querySelectorAll('.postgara-main-tab-btn');
    mainTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubtab = btn.getAttribute('data-subtab');
            
            mainTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const sectionPre = document.getElementById('section-pre-weekend');
            const sectionWeek = document.getElementById('section-weekend');

            if (targetSubtab === 'pre-weekend') {
                if (sectionPre) sectionPre.style.display = 'block';
                if (sectionWeek) sectionWeek.style.display = 'none';
            } else {
                if (sectionPre) sectionPre.style.display = 'none';
                if (sectionWeek) sectionWeek.style.display = 'block';
            }
        });
    });

    // Day Sub-Tabs (Venerdì / Sabato / Domenica)
    const dayTabBtns = document.querySelectorAll('.postgara-day-tab-btn');
    dayTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetDay = btn.getAttribute('data-day');

            dayTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const dayPanels = document.querySelectorAll('.postgara-day-panel');
            dayPanels.forEach(panel => panel.style.display = 'none');

            const activePanel = document.getElementById(`day-section-${targetDay}`);
            if (activePanel) activePanel.style.display = 'block';
        });
    });
}

// Inizializzazione nav tabs al DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPostGaraNavTabs);
} else {
    setupPostGaraNavTabs();
}
