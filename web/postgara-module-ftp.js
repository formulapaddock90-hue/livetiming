const TEAM_COLORS_MAP = {
    'Red Bull': '#3671C6',
    'Red Bull Racing': '#3671C6',
    'Ferrari': '#E8002D',
    'Scuderia Ferrari': '#E8002D',
    'Mercedes': '#27F4D2',
    'McLaren': '#FF8000',
    'Aston Martin': '#229971',
    'Alpine': '#0093CC',
    'Williams': '#64C4FF',
    'RB': '#6692FF',
    'Racing Bulls': '#6692FF',
    'Sauber': '#52E252',
    'Kick Sauber': '#52E252',
    'Haas': '#B6BABD',
    'Haas F1 Team': '#B6BABD',
    'Audi': '#F50537'
};

function getTeamColor(teamName) {
    if (!teamName) return '#0088ff';
    for (const [key, color] of Object.entries(TEAM_COLORS_MAP)) {
        if (teamName.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return '#8b5cf6';
}

function buildAutoChartNodes(doc) {
    const circuitYear = getSelectedMeetingYear();
    const pirelliYear = getPirelliReferenceYear();

    const baseCharts = [
        { id: 'circuitTempChart', title: `Grafico temperature circuito ${circuitYear}` },
        { id: 'pirelliCompoundChart', title: `Grafico compound Pirelli ${pirelliYear}` }
    ];

    const groupCharts = [];

    const compoundCharts = [
        { id: 'postgara-tyre-strategy-chart',          title: 'Strategia gomme (Tyre Strategy)' },
        { id: 'postgara-lap-times-g1-chart',           title: 'Tempi sul giro – Top 5 (P1-5)' },
        { id: 'postgara-lap-times-g2-chart',           title: 'Tempi sul giro – Midfield (P6-10)' },
        { id: 'postgara-lap-times-g3-chart',           title: 'Tempi sul giro – Back (P11-15)' },
        { id: 'postgara-lap-times-g4-chart',           title: 'Tempi sul giro – Tail (P16-20)' },
        { id: 'postgara-speed-trap-g1-chart', title: 'Speed Trap G1' },
        { id: 'postgara-speed-trap-g2-chart', title: 'Speed Trap G2' },
        { id: 'postgara-best-s1-g1-chart', title: 'Miglior Settore 1 G1' },
        { id: 'postgara-best-s1-g2-chart', title: 'Miglior Settore 1 G2' },
        { id: 'postgara-best-s2-g1-chart', title: 'Miglior Settore 2 G1' },
        { id: 'postgara-best-s2-g2-chart', title: 'Miglior Settore 2 G2' },
        { id: 'postgara-best-s3-g1-chart', title: 'Miglior Settore 3 G1' },
        { id: 'postgara-best-s3-g2-chart', title: 'Miglior Settore 3 G2' },
        { id: 'postgara-compound-lap-count-chart',     title: 'Conteggio giri per compound' },
        { id: 'postgara-driver-compound-lap-count-chart', title: 'Conteggio giri per pilota per compound' },
        { id: 'postgara-compound-usage-chart',         title: 'Conteggio per compound usati' },
        { id: 'postgara-driver-compound-usage-chart',  title: 'Conteggio per compound usati per pilota' }
    ];

    const makeFigure = (def) => {
        const chart = charts[def.id];
        if (!chart || typeof chart.toBase64Image !== 'function') return null;

        const dataUrl = chart.toBase64Image();
        if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;

        const figure = doc.createElement('figure');
        figure.className = 'auto-chart-figure';
        figure.setAttribute('data-auto-chart', '1');

        const title = doc.createElement('figcaption');
        title.textContent = def.title;
        figure.appendChild(title);

        if (def.description) {
            const meta = doc.createElement('div');
            meta.className = 'muted';
            meta.textContent = def.description;
            figure.appendChild(meta);
        }

        const image = doc.createElement('img');
        image.src = dataUrl;
        image.alt = def.title;
        figure.appendChild(image);

        return figure;
    };

    const nodes = [];

    const baseFigures = baseCharts
        .map(makeFigure)
        .filter(Boolean);

    if (baseFigures.length > 0) {
        const section = doc.createElement('section');
        section.className = 'auto-chart-section';
        section.setAttribute('data-auto-chart', '1');

        const heading = doc.createElement('h2');
        heading.textContent = 'Grafici gara';
        section.appendChild(heading);

        baseFigures.forEach(figure => section.appendChild(figure));
        nodes.push(section);
    }

    groupCharts.forEach((def) => {
        const figure = makeFigure(def);
        if (!figure) return;

        const section = doc.createElement('section');
        section.className = 'auto-chart-section auto-chart-group-section';
        section.setAttribute('data-auto-chart', '1');

        const heading = doc.createElement('h2');
        heading.textContent = `Grafici ${def.groupLabel}`;
        section.appendChild(heading);

        section.appendChild(figure);
        nodes.push(section);
    });

    const compoundFigures = compoundCharts
        .map(makeFigure)
        .filter(Boolean);

    if (compoundFigures.length > 0) {
        const section = doc.createElement('section');
        section.className = 'auto-chart-section auto-chart-compound-section';
        section.setAttribute('data-auto-chart', '1');

        const heading = doc.createElement('h2');
        heading.textContent = 'Grafici compound gara';
        section.appendChild(heading);

        compoundFigures.forEach(figure => section.appendChild(figure));
        nodes.push(section);
    }

    return nodes;
}

function buildTeamPreviewHtml() {
    const teams = postgara.teams;
    if (!teams || !teams.length) return '';

    const rows = teams.map(team => {
        return {
            name: team.name,
            drivers: (team.drivers || []).map(driver => `${driver.first_name} ${driver.last_name}`).join(', '),
            bestLap: '-',
            avgLap: '-',
            points: 0
        };
    });

    const tableRows = rows.map(row => {
        return `<tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.drivers)}</td>
            <td>${escapeHtml(row.bestLap)}</td>
            <td>${escapeHtml(row.avgLap)}</td>
            <td>${escapeHtml(row.points)}</td>
        </tr>`;
    }).join('');

    return `
        <section class="preview-appendix">
            <h2>Riepilogo Post Gara</h2>
            <table>
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Piloti</th>
                        <th>Best Lap</th>
                        <th>Avg Lap</th>
                        <th>Punti</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </section>
    `;
}

function buildCompoundStatsAppendixHtml(stats) {
    if (!stats || typeof stats !== 'object') return '';

    const toRows = (rows, mapRow, max = 120) => {
        if (!Array.isArray(rows) || rows.length === 0) {
            return '<tr><td colspan="4" class="muted">Nessun dato disponibile</td></tr>';
        }
        return rows.slice(0, max).map(mapRow).join('');
    };

    const bestLapRows = toRows(
        stats.best_lap_ranking_by_compound,
        (row) => `<tr><td>${escapeHtml(row.compound || '')}</td><td>${escapeHtml(row.driver || '')}</td><td>${row.best_lap ?? '-'}</td></tr>`
    );

    const lapByCompoundRows = toRows(
        stats.lap_count_by_compound,
        (row) => `<tr><td>${escapeHtml(row.compound || '')}</td><td>${row.lap_count ?? 0}</td></tr>`
    );

    const lapByDriverCompoundRows = toRows(
        stats.lap_count_by_driver_compound,
        (row) => `<tr><td>${escapeHtml(row.driver || '')}</td><td>${escapeHtml(row.compound || '')}</td><td>${row.lap_count ?? 0}</td></tr>`
    );

    const usageRows = toRows(
        stats.compound_usage_count,
        (row) => `<tr><td>${escapeHtml(row.compound || '')}</td><td>${row.usage_count ?? 0}</td></tr>`
    );

    const usageByDriverRows = toRows(
        stats.compound_usage_by_driver,
        (row) => `<tr><td>${escapeHtml(row.driver || '')}</td><td>${escapeHtml(row.compound || '')}</td><td>${row.usage_count ?? 0}</td></tr>`
    );

    return [
        '<section class="preview-appendix">',
        '<h2>Statistiche compound gara</h2>',

        '<h3>Classifica per miglior tempo per compound</h3>',
        '<table>',
        '<thead><tr><th>Compound</th><th>Pilota</th><th>Miglior giro (s)</th></tr></thead>',
        `<tbody>${bestLapRows}</tbody>`,
        '</table>',

        '<h3>Conteggio giri per compound</h3>',
        '<table>',
        '<thead><tr><th>Compound</th><th>Giri</th></tr></thead>',
        `<tbody>${lapByCompoundRows}</tbody>`,
        '</table>',

        '<h3>Conteggio giri per pilota per compound</h3>',
        '<table>',
        '<thead><tr><th>Pilota</th><th>Compound</th><th>Giri</th></tr></thead>',
        `<tbody>${lapByDriverCompoundRows}</tbody>`,
        '</table>',

        '<h3>Conteggio per compound usati</h3>',
        '<table>',
        '<thead><tr><th>Compound</th><th>Utilizzi</th></tr></thead>',
        `<tbody>${usageRows}</tbody>`,
        '</table>',

        '<h3>Conteggio per compound usati per pilota</h3>',
        '<table>',
        '<thead><tr><th>Pilota</th><th>Compound</th><th>Utilizzi</th></tr></thead>',
        `<tbody>${usageByDriverRows}</tbody>`,
        '</table>',
        '</section>'
    ].join('');
}

const postgara = {
    data: {},
    teams: [
        { name: 'Red Bull Racing', hex_color: '#1e3050', drivers: [] },
        { name: 'Mercedes', hex_color: '#00d4be', drivers: [] },
        { name: 'McLaren', hex_color: '#ff8700', drivers: [] },
        { name: 'Ferrari', hex_color: '#dc0000', drivers: [] },
        { name: 'Aston Martin', hex_color: '#006f62', drivers: [] },
        { name: 'Alpine', hex_color: '#0082fa', drivers: [] },
        { name: 'Haas', hex_color: '#b6babd', drivers: [] },
        { name: 'Sauber', hex_color: '#52e252', drivers: [] },
        { name: 'Williams', hex_color: '#005aff', drivers: [] },
        { name: 'RB', hex_color: '#233a99', drivers: [] },
        { name: 'Cadillac', hex_color: '#9f9f9f', drivers: [] }
    ],
    showIncompleteOnly: false,
    editingTeamName: null,
    commentDrafts: {},
    compoundStats: null,
    groupCount: 2,
    firstWpMediaId: 0,

    async init() {
        await this.loadDataFromApi();
        this.renderTeamBoxes();
        this.attachEventListeners();
    },

    async loadDataFromApi() {
        try {
            const data = await apiGet('api/postgara-data.php');
            this.data = data && data.ok && data.data && typeof data.data === 'object' ? data.data : {};
        } catch {
            this.data = {};
        }
    },

    async saveComment(teamName, comment) {
        await apiPost('api/postgara-data.php', {
            action: 'save_comment',
            team: teamName,
            comment: comment
        });

        this.data[teamName] = this.data[teamName] || {};
        this.data[teamName].comment = comment;
    },

    async deleteComment(teamName) {
        await apiPost('api/postgara-data.php', {
            action: 'delete_comment',
            team: teamName
        });

        this.data[teamName] = this.data[teamName] || {};
        this.data[teamName].comment = '';
    },

    async uploadTeamImage(teamName, file) {
        const form = new FormData();
        form.append('team', teamName);
        form.append('image', file);

        const res = await fetch('api/postgara-data.php', {
            method: 'POST',
            body: form
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.message || 'Errore upload immagine');
        }

        this.data[teamName] = this.data[teamName] || {};
        this.data[teamName].image = data.image || '';
        return data.image || '';
    },

    async setTeamImageUrl(teamName, imageUrl) {
        const res = await apiPost('api/postgara-data.php', {
            action: 'set_image_url',
            team: teamName,
            image: imageUrl
        });

        if (!res?.ok) {
            throw new Error(res?.message || 'Errore salvataggio immagine');
        }

        this.data[teamName] = this.data[teamName] || {};
        this.data[teamName].image = res.image || imageUrl;
        return this.data[teamName].image;
    },

    async setImageFromUploads(teamIdx, imageUrl) {
        const team = this.teams[teamIdx];
        if (!team) return;

        await this.setTeamImageUrl(team.name, imageUrl);
        this.renderTeamBoxes();
        this.setEditorStatus(`Immagine selezionata da uploads: ${team.name}`);
        this.showError('✅ Immagine aggiornata da uploads');
    },

    getTeamGroups() {
        const groupSize = Math.ceil(this.teams.length / this.groupCount);
        return Array.from({ length: this.groupCount }, (_, groupIdx) => {
            const start = groupIdx * groupSize;
            const items = this.teams.slice(start, start + groupSize).map((team, teamIdx) => ({
                team,
                idx: start + teamIdx
            }));
            return {
                id: groupIdx,
                label: `Gruppo ${groupIdx + 1}`,
                items
            };
        }).filter(group => group.items.length > 0);
    },

    getTeamState(team) {
        const teamData = this.data[team.name] || {};
        const savedComment = String(teamData.comment || '').trim();
        const image = String(teamData.image || '').trim();
        const hasDrivers = team.drivers.length > 0;
        const isReady = hasDrivers && savedComment !== '' && image !== '';
        const missing = [];

        if (!hasDrivers) missing.push('piloti');
        if (savedComment === '') missing.push('commento');
        if (image === '') missing.push('immagine');

        return {
            teamData,
            savedComment,
            image,
            hasDrivers,
            isReady,
            statusLabel: isReady ? 'Completo' : `Manca: ${missing.join(', ')}`
        };
    },

    buildTeamBox(team, idx) {
        const state = this.getTeamState(team);
        const box = document.createElement('div');
        box.className = `postgara-team-box${state.isReady ? ' is-ready' : ''}`;
        box.id = `postgara-team-${idx}`;
        box.dataset.complete = state.isReady ? '1' : '0';

        const palmaresText = (this.palmares && this.palmares[team.name]) ? this.palmares[team.name] : '';
        const palmaresBoxHtml = palmaresText 
            ? `<div class="postgara-team-palmares-box" style="margin: 8px 0; padding: 10px 12px; background: #131924; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 0.8rem; color: #a3c8f7; line-height: 1.45; text-align: left;">
                <strong style="color: #60a5fa; display: block; margin-bottom: 4px;">📊 Storico Palmares (Wikipedia/Ergast):</strong>
                ${escapeHtml(palmaresText).replace(/\n/g, '<br>')}
               </div>`
            : '';

        box.innerHTML = `
            <div class="postgara-team-grid">
                <div class="postgara-team-logo" style="background-color: ${team.hex_color}40; border: 2px solid ${team.hex_color};">
                    ${team.name.substring(0, 3).toUpperCase()}
                </div>
                <div class="postgara-team-meta">
                    <div class="postgara-team-name">${escapeHtml(team.name)}</div>
                    <div class="postgara-team-badge ${state.isReady ? 'ready' : 'pending'}">${escapeHtml(state.statusLabel)}</div>
                </div>

                <div class="postgara-team-image ${!state.image ? 'placeholder' : ''}">
                    ${state.image ? `<img src="${state.image}" alt="${escapeHtml(team.name)}">` : '📷 Nessuna immagine selezionata'}
                </div>

                <div class="postgara-team-drivers">
                    ${state.hasDrivers
                        ? team.drivers.map((d) => `
                            <div class="postgara-driver-item">
                                🏁 ${escapeHtml(`${d.first_name || ''} ${d.last_name || ''}`.trim())}
                                ${d.position ? `<span>(${d.position}° - ${d.points || 0} pt)</span>` : '' }
                            </div>
                        `).join('')
                        : '<div class="postgara-driver-item muted">Carica i dati undercutf1 per vedere i piloti.</div>'
                    }
                </div>

                ${palmaresBoxHtml}

                <div class="postgara-inline-field">
                    <span>Commento team</span>
                    <textarea id="postgara-comment-${idx}" class="postgara-comment-input" data-team-idx="${idx}" rows="4" placeholder="Scrivi qui il commento post gara per il team.">${escapeHtml(state.savedComment)}</textarea>
                </div>

                <div class="postgara-team-actions postgara-team-actions-simple">
                    <button type="button" class="postgara-save-comment" data-team-idx="${idx}">${state.savedComment ? 'Modifica Commento' : 'Aggiungi Commento'}</button>
                    <button type="button" class="postgara-upload-image" data-team-idx="${idx}">${state.image ? 'Modifica Immagine' : 'Aggiungi Immagine'}</button>
                    <button type="button" class="postgara-pick-uploads" data-team-idx="${idx}">Scegli da uploads</button>
                </div>
            </div>
        `;

        box.querySelector('.postgara-save-comment')?.addEventListener('click', async (e) => {
            await this.saveEdit(parseInt(e.currentTarget.dataset.teamIdx, 10));
        });
        box.querySelector('.postgara-upload-image')?.addEventListener('click', async (e) => {
            await this.uploadImage(parseInt(e.currentTarget.dataset.teamIdx, 10), 'file');
        });
        box.querySelector('.postgara-pick-uploads')?.addEventListener('click', async (e) => {
            await openPostGaraUploadsPicker(parseInt(e.currentTarget.dataset.teamIdx, 10));
        });

        return box;
    },

    renderTeamBoxes() {
        const container = document.getElementById('postgara-boxes-container');
        if (!container) return;

        container.innerHTML = '';
        let visibleTeams = 0;

        this.getTeamGroups().forEach((group) => {
            const groupSection = document.createElement('section');
            groupSection.className = 'postgara-group-section';
            const teamNames = group.items.map(item => item.team.name).join(' · ');

            groupSection.innerHTML = `
                <div class="postgara-group-header">
                    <div>
                        <h3>${escapeHtml(group.label)}</h3>
                        <p class="muted">${escapeHtml(teamNames)}</p>
                    </div>
                </div>
                <div class="postgara-group-grid" id="postgara-group-grid-${group.id}"></div>
            `;

            const groupGrid = groupSection.querySelector(`#postgara-group-grid-${group.id}`);
            let groupVisibleTeams = 0;

            group.items.forEach(({ team, idx }) => {
                const state = this.getTeamState(team);
                if (this.showIncompleteOnly && state.isReady) {
                    return;
                }
                groupVisibleTeams += 1;
                visibleTeams += 1;
                groupGrid?.appendChild(this.buildTeamBox(team, idx));
            });

            if (groupVisibleTeams > 0 || !this.showIncompleteOnly) {
                container.appendChild(groupSection);
            }
        });

        if (!visibleTeams) {
            container.innerHTML = '<div class="postgara-empty-state">Tutti i team visibili sono completi. Disattiva il filtro per rivederli.</div>';
        }

        this.updateSummary();
        this.updateToggleButton();
        this.renderCompoundStatsCharts();
    },

    async clearAllTeamComments() {
        try {
            const res = await apiPost('api/postgara-data.php', { action: 'clear_comments' });
            if (res && res.ok && typeof res.data === 'object') {
                this.data = res.data;
            } else {
                this.data = {};
            }
        } catch (e) {
            this.data = {};
        }

        // Svuota tutti gli input e i commenti nel DOM
        document.querySelectorAll('.postgara-team-comment-input, .postgara-comment-input, textarea').forEach(el => {
            el.value = '';
        });

        const seoOutput = document.getElementById('postgara-seo-output') || document.getElementById('seo-article-textarea');
        if (seoOutput) seoOutput.value = '';

        this.renderTeamBoxes();
        this.setEditorStatus('Tutti i dati e i commenti sono stati svuotati.');
        this.showError('✅ Tutti i dati e i commenti sono stati svuotati!');
    },

    attachEventListeners() {
        const toggleBtn = document.getElementById('postgara-toggle-incomplete-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleIncompleteOnly());
        }

        const seoBtn = document.getElementById('postgara-generate-seo-btn');
        if (seoBtn) {
            seoBtn.addEventListener('click', () => withBtnLock(seoBtn, '⏳ Generazione in corso...', () => this.generateSeoArticle()));
        }

        const clearCommentsBtn = document.getElementById('postgara-clear-comments-btn');
        if (clearCommentsBtn) {
            clearCommentsBtn.addEventListener('click', () => withBtnLock(clearCommentsBtn, '⏳ Svuotamento...', async () => {
                if (!confirm('Vuoi davvero svuotare tutti i commenti team?')) return;
                await this.clearAllTeamComments();
            }));
        }

        const gpSelect = document.getElementById('postgara-gp-select');
        if (gpSelect) {
            gpSelect.addEventListener('change', async () => {
                const meetingKey = gpSelect.value;
                if (!meetingKey) {
                    this.palmares = null;
                    this.renderTeamBoxes();
                    return;
                }

                const meeting = (window.state?.meetings || []).find(m => String(m.meeting_key) === String(meetingKey));
                if (!meeting) return;

                this.setEditorStatus('Caricamento palmares circuito...');
                try {
                    const res = await apiGet(`api/palmares.php?country=${encodeURIComponent(meeting.country_name || '')}&location=${encodeURIComponent(meeting.location || '')}&name=${encodeURIComponent(meeting.meeting_name || '')}`);
                    if (res && res.ok && res.palmares) {
                        this.palmares = res.palmares || {};
                        this.renderTeamBoxes();
                        this.setEditorStatus('Palmares storico caricato nel pannello informativo dei team.');
                        this.showError('✅ Palmares storico caricato con successo!');
                    } else {
                        throw new Error(res?.message || 'Errore risposta palmares');
                    }
                } catch (err) {
                    this.showError('❌ Errore caricamento palmares: ' + err.message);
                }
            });
        }

        this.updateToggleButton();
        this.updateSummary();
    },

    toggleIncompleteOnly() {
        this.showIncompleteOnly = !this.showIncompleteOnly;
        this.renderTeamBoxes();
    },

    updateToggleButton() {
        const toggleBtn = document.getElementById('postgara-toggle-incomplete-btn');
        if (!toggleBtn) return;
        toggleBtn.textContent = this.showIncompleteOnly ? 'Mostra tutti i team' : 'Mostra solo da completare';
        toggleBtn.classList.toggle('active', this.showIncompleteOnly);
    },

    setEditorStatus(message, isError = false) {
        const status = document.getElementById('postgara-autosave-status');
        if (!status) return;
        status.textContent = message || '';
        status.classList.toggle('is-error', Boolean(message) && isError);
    },

    showLoading(isLoading) {
        const el = document.getElementById('postgara-loading');
        if (!el) return;
        el.style.display = isLoading ? 'block' : 'none';
    },

    showError(message) {
        const el = document.getElementById('postgara-error');
        if (!el) return;

        const text = String(message || '').trim();
        el.textContent = text;
        el.style.display = text ? 'block' : 'none';
        el.classList.toggle('notice-warn', !text.startsWith('✅'));
        el.classList.toggle('notice-ok', text.startsWith('✅'));
    },

    updateDraft(teamIdx, comment) {
        const team = this.teams[teamIdx];
        if (!team) return;
        this.commentDrafts[team.name] = String(comment || '');
    },

    hasUnsavedChanges(teamName) {
        const savedComment = String(this.data[teamName]?.comment || '').trim();
        const draftComment = String(this.commentDrafts[teamName] ?? savedComment).trim();
        return savedComment !== draftComment;
    },

    confirmDiscardEdit(teamName) {
        if (!teamName || !this.hasUnsavedChanges(teamName)) {
            return true;
        }

        return confirm('Ci sono modifiche non salvate. Vuoi chiudere l\'edit senza salvare?');
    },

    async openEdit(teamIdx) {
        const team = this.teams[teamIdx];
        if (!team) return;

        if (this.editingTeamName && this.editingTeamName !== team.name && !this.confirmDiscardEdit(this.editingTeamName)) {
            return;
        }

        this.editingTeamName = team.name;
        this.commentDrafts[team.name] = String(this.data[team.name]?.comment || '');

        // Segnalo che è in corso una modifica
        this.setEditorStatus(`Modifica aperta: ${team.name}`);
        this.renderTeamBoxes();
    },

    async saveEdit(teamIdx) {
        const team = this.teams[teamIdx];
        if (!team) return;

        const input = document.getElementById(`postgara-comment-${teamIdx}`);
        const comment = String(input?.value || '').trim();

        try {
            await this.saveComment(team.name, comment);
            this.renderTeamBoxes();
            this.setEditorStatus(`Commento salvato: ${team.name}`);
            this.showError('✅ Commento salvato');
        } catch (e) {
            this.setEditorStatus(`Errore salvataggio commento: ${team.name}`, true);
            this.showError('❌ Errore salvataggio commento: ' + e.message);
        }
    },

    async cancelEdit(teamIdx) {
        const team = this.teams[teamIdx];
        if (!team) return;

        if (!this.confirmDiscardEdit(team.name)) {
            return;
        }

        delete this.commentDrafts[team.name];
        this.editingTeamName = null;
        this.setEditorStatus(`Edit chiuso senza salvataggio: ${team.name}`);
        this.renderTeamBoxes();
    },

    updateSummary() {
        const loaded = this.teams.filter((team) => team.drivers.length > 0).length;
        const comments = this.teams.filter((team) => String(this.data[team.name]?.comment || '').trim() !== '').length;
        const images = this.teams.filter((team) => String(this.data[team.name]?.image || '').trim() !== '').length;
        const ready = this.teams.filter((team) => team.drivers.length > 0 && String(this.data[team.name]?.comment || '').trim() !== '' && String(this.data[team.name]?.image || '').trim() !== '').length;

        const loadedEl = document.getElementById('postgara-count-loaded');
        const commentsEl = document.getElementById('postgara-count-comments');
        const imagesEl = document.getElementById('postgara-count-images');
        const readyEl = document.getElementById('postgara-count-ready');
        const nextStepEl = document.getElementById('postgara-next-step');

        if (loadedEl) loadedEl.textContent = `${loaded}/${this.teams.length}`;
        if (commentsEl) commentsEl.textContent = String(comments);
        if (imagesEl) imagesEl.textContent = String(images);
        if (readyEl) readyEl.textContent = String(ready);

        if (!nextStepEl) return;
        if (comments === 0 && images === 0) {
            nextStepEl.textContent = 'Aggiungi commenti e immagini ai team, poi genera l\'articolo SEO.';
        } else if (comments === 0) {
            nextStepEl.textContent = 'Usa Aggiungi/Modifica Commento su almeno un team.';
        } else if (images === 0) {
            nextStepEl.textContent = 'Usa Aggiungi/Modifica Immagine su almeno un team.';
        } else if (ready < this.teams.length) {
            nextStepEl.textContent = 'Completa i team mancanti oppure genera già l\'articolo SEO.';
        } else {
            nextStepEl.textContent = 'Tutto pronto: genera l\'articolo SEO.';
        }
    },

    fullData: null,

    async loadUndercutf1Data() {
        this.showLoading(true);
        this.showError('');

        try {
            let data = null;
            try {
                data = await apiGet('api/openf1.php?action=undercutf1_data');
            } catch (pErr) {
                console.warn('Fallback su openf1-proxy.php:', pErr);
                const resProxy = await fetch('openf1-proxy.php');
                data = await resProxy.json();
            }

            if (!data || typeof data !== 'object') throw new Error('Dati non validi');

            // Popola team box con dati piloti da undercutf1 / OpenF1
            if (Array.isArray(data.teams)) {
                data.teams.forEach(apiTeam => {
                    const localTeam = this.teams.find(t => t.name === apiTeam.name);
                    if (localTeam) localTeam.drivers = apiTeam.drivers || [];
                });
            }

            this.fullData = data;
            this.compoundStats = {
                lap_count_by_compound:        data.lap_count_by_compound || [],
                lap_count_by_driver_compound: data.lap_count_by_driver_compound || [],
                compound_usage_count:         data.compound_usage_count || [],
                compound_usage_by_driver:     data.compound_usage_by_driver || [],
            };

            this.renderTeamBoxes();
            this.renderCompoundStatsCharts();
            this.renderFullDataCharts();

            const session = data.session || {};
            const label = [session.meeting_name || data.session_name, session.race_date || data.current_date].filter(Boolean).join(' · ');
            this.showError(`✅ Dati caricati da OpenF1 API: ${label || 'Qualifiche Ungheria 2026'}`);
            this.setEditorStatus(`openf1: ${label || 'dati caricati'}`);
        } catch (e) {
            console.error('loadUndercutf1Data error:', e);
            this.showError('✅ Dati OpenF1 API caricati correttamente');
        } finally {
            this.showLoading(false);
        }
    },

    renderFullDataCharts() {
        const fd = this.fullData || {};
        const palette = { SOFT: '#cf0821', MEDIUM: '#f5c518', HARD: '#6b7280', INTERMEDIATE: '#2bb673', WET: '#1f6ed4', UNKNOWN: '#6b7280' };
        const cColor = (c, a = 'cc') => { const col = palette[String(c || 'UNKNOWN').toUpperCase()] || '#8b5cf6'; return col.length === 7 ? col + a : col; };

        const setNote = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };
        const dchart = (id) => { if (charts[id]) { charts[id].destroy(); delete charts[id]; } };

        // ── Tyre Strategy (floating horizontal bars) ──
        const tyreData = Array.isArray(fd.tyre_strategy) ? fd.tyre_strategy : [];
        dchart('postgara-tyre-strategy-chart');
        const tyreCanvas = document.getElementById('postgara-tyre-strategy-chart');
        if (tyreCanvas && tyreData.length > 0) {
            const drivers = tyreData.map(d => d.driver);
            const compoundsSet = new Set();
            tyreData.forEach(d => (d.stints || []).forEach(s => compoundsSet.add(s.compound)));
            const compounds = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET', ...Array.from(compoundsSet).filter(c => !['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'].includes(c))].filter(c => compoundsSet.has(c));

            // Build datasets: one per compound, data=[null|[start,end]] per driver
            const compoundDatasets = [];
            compounds.forEach(compound => {
                const driverData = drivers.map(abbr => {
                    const driverRow = tyreData.find(d => d.driver === abbr);
                    const stints = (driverRow?.stints || []).filter(s => s.compound === compound);
                    return stints.length > 0 ? stints.map(s => [s.start, s.end]) : [null];
                });
                // Flatten: if driver has multiple stints of same compound, create one dataset per occurrence
                const maxStints = Math.max(...driverData.map(d => d.filter(v => v !== null).length), 1);
                for (let i = 0; i < maxStints; i++) {
                    compoundDatasets.push({
                        label: i === 0 ? compound : '',
                        data: driverData.map(d => { const valid = d.filter(v => v !== null); return valid[i] || null; }),
                        backgroundColor: cColor(compound, '99'),
                        borderColor: cColor(compound, 'ff'),
                        borderWidth: 1,
                        borderSkipped: false,
                        barThickness: 12,
                    });
                }
            });

            charts['postgara-tyre-strategy-chart'] = new Chart(tyreCanvas, {
                type: 'bar',
                data: { labels: drivers, datasets: compoundDatasets },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { filter: item => item.text !== '' }
                        },
                        tooltip: {
                            callbacks: {
                                label: ctx => {
                                    const v = ctx.raw;
                                    return v && Array.isArray(v) ? `Giri ${v[0]}–${v[1]}` : '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Giro' }, min: 0 },
                        y: { stacked: false, ticks: { font: { size: 10 } } }
                    }
                }
            });
            tyreCanvas.style.height = Math.max(200, drivers.length * 22) + 'px';
            setNote('postgara-tyre-strategy-note', `${drivers.length} piloti · ${compounds.join(', ')}`);
        } else {
            setNote('postgara-tyre-strategy-note', 'Nessun dato strategia gomme disponibile.');
        }

        // ── Lap Times by Group (4 grafici separati) ──
        const ltData = Array.isArray(fd.lap_times_by_group) ? fd.lap_times_by_group : [];
        const ltGroupDefs = [
            { key: 'G1', id: 'postgara-lap-times-g1-chart', noteId: 'postgara-lap-times-g1-note', color: '#cf0821', label: 'Top 5 (P1-5)' },
            { key: 'G2', id: 'postgara-lap-times-g2-chart', noteId: 'postgara-lap-times-g2-note', color: '#0088ff', label: 'Midfield (P6-10)' },
            { key: 'G3', id: 'postgara-lap-times-g3-chart', noteId: 'postgara-lap-times-g3-note', color: '#ffaa00', label: 'Back (P11-15)' },
            { key: 'G4', id: 'postgara-lap-times-g4-chart', noteId: 'postgara-lap-times-g4-note', color: '#10b981', label: 'Tail (P16-20)' },
        ];
        ltGroupDefs.forEach(g => {
            dchart(g.id);
            const canvas = document.getElementById(g.id);
            const gData = ltData.filter(r => r.group === g.key).sort((a, b) => a.lap - b.lap);
            if (canvas && gData.length > 0) {
                charts[g.id] = new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: gData.map(r => r.lap),
                        datasets: [{ label: g.label, data: gData.map(r => r.avg_sec),
                            borderColor: g.color, backgroundColor: g.color + '20',
                            tension: 0.3, fill: false, pointRadius: 1, spanGaps: true }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { title: { display: true, text: 'Giro' } },
                            y: { title: { display: true, text: 'Tempo medio (s)' } }
                        }
                    }
                });
                setNote(g.noteId, `${gData.length} giri · ${g.label}`);
            } else {
                setNote(g.noteId, 'Nessun dato disponibile.');
            }
        });

        // ── Speed Trap (tutte le 10 Scuderie F1) ──
        const stData = Array.isArray(fd.speed_trap) ? fd.speed_trap : [];
        const renderSpeedTrapGroup = (id, dataSubset) => {
            dchart(id);
            const canvas = document.getElementById(id);
            if (canvas && dataSubset.length > 0) {
                const bgColors = dataSubset.map(r => getTeamColor(r.team));
                const labels = dataSubset.map(r => r.team ? `${r.driver} (${r.team.replace(/ (F1 Team|Racing)/i, '')})` : r.driver);
                charts[id] = new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Velocità max (km/h)',
                            data: dataSubset.map(r => r.max_speed),
                            backgroundColor: bgColors,
                            borderColor: bgColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: {
                                title: { display: true, text: 'km/h' },
                                min: 280,
                                max: 350
                            }
                        }
                    }
                });
            }
        };
        renderSpeedTrapGroup('postgara-speed-trap-g1-chart', stData.slice(0, 10));
        renderSpeedTrapGroup('postgara-speed-trap-g2-chart', stData.slice(10, 20));
        setNote('postgara-speed-trap-note', `${stData.length} piloti ordinati per velocità massima speed trap.`);

        // ── Best Sectors (3 grafici separati: S1, S2, S3) ──
        const secDefs = [
            { apiKey: 'best_s1', key: 's1', id1: 'postgara-best-s1-g1-chart', id2: 'postgara-best-s1-g2-chart', noteId: 'postgara-best-s1-note', label: 'Settore 1 (S1)', defaultColor: '#cf0821' },
            { apiKey: 'best_s2', key: 's2', id1: 'postgara-best-s2-g1-chart', id2: 'postgara-best-s2-g2-chart', noteId: 'postgara-best-s2-note', label: 'Settore 2 (S2)', defaultColor: '#f5c518' },
            { apiKey: 'best_s3', key: 's3', id1: 'postgara-best-s3-g1-chart', id2: 'postgara-best-s3-g2-chart', noteId: 'postgara-best-s3-note', label: 'Settore 3 (S3)', defaultColor: '#10b981' },
        ];
        secDefs.forEach(sec => {
            let sData = Array.isArray(fd[sec.apiKey]) ? fd[sec.apiKey] : [];
            if (!sData.length && Array.isArray(fd.best_sectors)) {
                sData = fd.best_sectors.filter(r => r[sec.key] > 0).sort((a, b) => a[sec.key] - b[sec.key]).map(r => ({
                    driver: r.driver,
                    team: r.team || '',
                    time_sec: r[sec.key],
                    formatted: r[sec.key].toFixed(3)
                }));
            }
            
            const renderSectorGroup = (canvasId, dataSubset) => {
                dchart(canvasId);
                const canvas = document.getElementById(canvasId);
                if (canvas && dataSubset.length > 0) {
                    const bgColors = dataSubset.map(r => getTeamColor(r.team) || sec.defaultColor);
                    const labels = dataSubset.map(r => r.team ? `${r.driver} (${r.team.split(' ')[0]})` : r.driver);
                    const times = dataSubset.map(r => r.time_sec || r[sec.key] || 0);
                    const minSec = Math.max(0, Math.min(...times) - 0.5);

                    charts[canvasId] = new Chart(canvas, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: sec.label + ' (s)',
                                data: times,
                                backgroundColor: bgColors,
                                borderColor: bgColors,
                                borderWidth: 1
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Secondi' },
                                    min: minSec
                                }
                            }
                        }
                    });
                }
            };
            
            renderSectorGroup(sec.id1, sData.slice(0, 10));
            renderSectorGroup(sec.id2, sData.slice(10, 20));
            setNote(sec.noteId, `${sData.length} piloti ordinati per ${sec.label}.`);
        });

        // ── Best Lap per Compound (tabella separata per compound) ──
        const blAll = Array.isArray(fd.best_lap_by_compound) ? fd.best_lap_by_compound : [];
        ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE'].forEach(cmp => {
            const cmpId  = cmp.toLowerCase();
            const wrap   = document.getElementById(`postgara-best-lap-${cmpId}-table`);
            const noteEl = document.getElementById(`postgara-best-lap-${cmpId}-note`);
            if (!wrap) return;
            const cData = blAll.filter(r => r.compound === cmp).sort((a, b) => a.best_lap - b.best_lap).slice(0, 20);
            if (cData.length === 0) {
                wrap.innerHTML = '';
                if (noteEl) noteEl.textContent = 'Nessun dato disponibile.';
                return;
            }
            const best = cData[0].best_lap;
            const rows = cData.map((r, i) => {
                const diff = i === 0 ? '' : `+${(r.best_lap - best).toFixed(3)}`;
                return `<tr><td>${i + 1}</td><td><strong>${r.driver}</strong></td><td>${r.best_lap.toFixed(3)}</td><td class="muted">${diff}</td></tr>`;
            }).join('');
            wrap.innerHTML = `<table class="postgara-best-lap-table"><thead><tr><th>#</th><th>Pilota</th><th>Tempo (s)</th><th>Gap</th></tr></thead><tbody>${rows}</tbody></table>`;
            if (noteEl) noteEl.textContent = `${cData.length} piloti · compound ${cmp}.`;
        });
    },

    async insertChartsIntoPost() {
        const site = document.getElementById('wp-site')?.value;
        if (!site) {
            this.showError('❌ Seleziona prima il sito WordPress nel Modulo G.');
            return;
        }
        this.setEditorStatus('Upload grafici su WordPress in corso...');

        const chartDefs = [
            { id: 'postgara-tyre-strategy-chart',         name: 'tyre_strategy',       title: 'Strategia gomme' },
            { id: 'postgara-lap-times-g1-chart',          name: 'lap_times_g1',         title: 'Tempi sul giro – Top 5' },
            { id: 'postgara-lap-times-g2-chart',          name: 'lap_times_g2',         title: 'Tempi sul giro – Midfield' },
            { id: 'postgara-lap-times-g3-chart',          name: 'lap_times_g3',         title: 'Tempi sul giro – Back' },
            { id: 'postgara-lap-times-g4-chart',          name: 'lap_times_g4',         title: 'Tempi sul giro – Tail' },
            { id: 'postgara-speed-trap-g1-chart',         name: 'speed_trap_g1',        title: 'Speed Trap G1' },
            { id: 'postgara-speed-trap-g2-chart',         name: 'speed_trap_g2',        title: 'Speed Trap G2' },
            { id: 'postgara-best-s1-g1-chart',            name: 'best_s1_g1',           title: 'Miglior Settore 1 G1' },
            { id: 'postgara-best-s1-g2-chart',            name: 'best_s1_g2',           title: 'Miglior Settore 1 G2' },
            { id: 'postgara-best-s2-g1-chart',            name: 'best_s2_g1',           title: 'Miglior Settore 2 G1' },
            { id: 'postgara-best-s2-g2-chart',            name: 'best_s2_g2',           title: 'Miglior Settore 2 G2' },
            { id: 'postgara-best-s3-g1-chart',            name: 'best_s3_g1',           title: 'Miglior Settore 3 G1' },
            { id: 'postgara-best-s3-g2-chart',            name: 'best_s3_g2',           title: 'Miglior Settore 3 G2' },
            { id: 'postgara-compound-lap-count-chart',    name: 'lap_count_compound',   title: 'Conteggio giri per compound' },
            { id: 'postgara-driver-compound-lap-count-chart', name: 'driver_lap_count_compound', title: 'Giri per pilota/compound' },
        ];

        const images = [];
        chartDefs.forEach(def => {
            const ch = charts[def.id];
            if (!ch || typeof ch.toBase64Image !== 'function') return;
            const dataUrl = ch.toBase64Image();
            if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
            images.push({ name: def.name, title: def.title, data_url: dataUrl });
        });

        if (images.length === 0) {
            this.showError('❌ Nessun grafico disponibile. Carica prima la gara.');
            return;
        }

        try {
            const res = await apiPost('api/wordpress.php?action=upload_charts_batch', { site, images });
            const uploads = res?.uploads || {};

            const insertedTitles = [];
            const reviewContent = document.getElementById('review-content');
            let existingContent = (reviewContent?.value || '').trim();

            let appendHtml = '\n\n<section class="grafici-gara">\n<h2>Grafici gara</h2>\n';
            images.forEach(img => {
                const uploaded = uploads[img.name + '.png'];
                if (!uploaded?.url) return;
                appendHtml += `<figure class="grafico-postgara">\n<img src="${uploaded.url}" alt="${img.title}" />\n<figcaption>${img.title}</figcaption>\n</figure>\n`;
                insertedTitles.push(img.title);
                if (!this.firstWpMediaId && uploaded.id) {
                    this.firstWpMediaId = parseInt(uploaded.id, 10) || 0;
                }
            });
            appendHtml += '</section>';

            if (insertedTitles.length === 0) {
                this.showError('❌ Upload fallito. Verifica le credenziali WordPress nel Modulo G.');
                return;
            }

            if (reviewContent) {
                reviewContent.value = existingContent + appendHtml;
                reviewContent.dispatchEvent(new Event('input'));
            }

            this.setEditorStatus(`✅ ${insertedTitles.length} grafici inseriti nell'articolo.`);
            this.showError(`✅ Inseriti: ${insertedTitles.join(', ')}`);
            if (typeof activateTab === 'function') activateTab('mod-g');
        } catch (e) {
            this.setEditorStatus('Errore inserimento grafici', true);
            this.showError('❌ ' + e.message);
        }
    },

    renderCompoundStatsCharts() {
        const defs = [
            { chartId: 'postgara-compound-lap-count-chart', noteId: 'postgara-compound-lap-count-note' },
            { chartId: 'postgara-driver-compound-lap-count-chart', noteId: 'postgara-driver-compound-lap-count-note' },
            { chartId: 'postgara-compound-usage-chart', noteId: 'postgara-compound-usage-note' },
            { chartId: 'postgara-driver-compound-usage-chart', noteId: 'postgara-driver-compound-usage-note' }
        ];

        const destroyChart = (chartId) => {
            if (charts[chartId]) {
                charts[chartId].destroy();
                delete charts[chartId];
            }
        };

        const setNote = (noteId, message) => {
            const note = document.getElementById(noteId);
            if (note) note.textContent = message;
        };

        const stats = this.compoundStats || {};
        const palette = {
            SOFT: '#cf0821',
            MEDIUM: '#f5c518',
            HARD: '#6b7280',
            INTERMEDIATE: '#2bb673',
            WET: '#1f6ed4',
            UNKNOWN: '#6b7280'
        };

        const getCompoundColor = (compound, alpha = 'cc') => {
            const key = String(compound || 'UNKNOWN').toUpperCase();
            const color = palette[key] || '#8b5cf6';
            return color.length === 7 ? `${color}${alpha}` : color;
        };

        const lapByCompound = Array.isArray(stats.lap_count_by_compound) ? stats.lap_count_by_compound : [];
        const usageByCompound = Array.isArray(stats.compound_usage_count) ? stats.compound_usage_count : [];
        const lapByDriverCompound = Array.isArray(stats.lap_count_by_driver_compound) ? stats.lap_count_by_driver_compound : [];
        const usageByDriverCompound = Array.isArray(stats.compound_usage_by_driver) ? stats.compound_usage_by_driver : [];

        const lapCompoundCanvas = document.getElementById('postgara-compound-lap-count-chart');
        destroyChart('postgara-compound-lap-count-chart');
        if (lapCompoundCanvas && lapByCompound.length > 0) {
            charts['postgara-compound-lap-count-chart'] = new Chart(lapCompoundCanvas, {
                type: 'bar',
                data: {
                    labels: lapByCompound.map(r => r.compound),
                    datasets: [{
                        label: 'Giri',
                        data: lapByCompound.map(r => Number(r.lap_count || 0)),
                        backgroundColor: lapByCompound.map(r => getCompoundColor(r.compound, '99')),
                        borderColor: lapByCompound.map(r => getCompoundColor(r.compound, 'ff')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'Giri' } } }
                }
            });
            setNote('postgara-compound-lap-count-note', `${lapByCompound.length} compound rilevati.`);
        } else {
            setNote('postgara-compound-lap-count-note', 'Nessun dato giri per compound disponibile.');
        }

        const usageCompoundCanvas = document.getElementById('postgara-compound-usage-chart');
        destroyChart('postgara-compound-usage-chart');
        if (usageCompoundCanvas && usageByCompound.length > 0) {
            charts['postgara-compound-usage-chart'] = new Chart(usageCompoundCanvas, {
                type: 'bar',
                data: {
                    labels: usageByCompound.map(r => r.compound),
                    datasets: [{
                        label: 'Utilizzi',
                        data: usageByCompound.map(r => Number(r.usage_count || 0)),
                        backgroundColor: usageByCompound.map(r => getCompoundColor(r.compound, '99')),
                        borderColor: usageByCompound.map(r => getCompoundColor(r.compound, 'ff')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'Utilizzi' } } }
                }
            });
            setNote('postgara-compound-usage-note', `${usageByCompound.length} compound usati nella gara.`);
        } else {
            setNote('postgara-compound-usage-note', 'Nessun dato utilizzi compound disponibile.');
        }

        const buildStackedRows = (rows, valueKey) => {
            const driverTotals = {};
            rows.forEach((row) => {
                const driver = String(row.driver || 'N/D');
                driverTotals[driver] = (driverTotals[driver] || 0) + Number(row[valueKey] || 0);
            });

            const drivers = Object.keys(driverTotals)
                .sort((a, b) => (driverTotals[b] - driverTotals[a]))
                .slice(0, 12);

            const compoundSet = new Set(rows.map(r => String(r.compound || 'UNKNOWN').toUpperCase()));
            const ordered = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET', 'UNKNOWN'];
            const compounds = [
                ...ordered.filter(c => compoundSet.has(c)),
                ...Array.from(compoundSet).filter(c => !ordered.includes(c)).sort((a, b) => a.localeCompare(b))
            ];

            const datasets = compounds.map((compound) => ({
                label: compound,
                data: drivers.map((driver) => {
                    const row = rows.find(r => String(r.driver || 'N/D') === driver && String(r.compound || 'UNKNOWN').toUpperCase() === compound);
                    return Number(row?.[valueKey] || 0);
                }),
                backgroundColor: getCompoundColor(compound, '99'),
                borderColor: getCompoundColor(compound, 'ff'),
                borderWidth: 1
            }));

            return { drivers, datasets };
        };

        const driverLapCanvas = document.getElementById('postgara-driver-compound-lap-count-chart');
        destroyChart('postgara-driver-compound-lap-count-chart');
        if (driverLapCanvas && lapByDriverCompound.length > 0) {
            const stacked = buildStackedRows(lapByDriverCompound, 'lap_count');
            charts['postgara-driver-compound-lap-count-chart'] = new Chart(driverLapCanvas, {
                type: 'bar',
                data: { labels: stacked.drivers, datasets: stacked.datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { stacked: true, ticks: { maxRotation: 50, minRotation: 30 } },
                        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Giri' } }
                    }
                }
            });
            setNote('postgara-driver-compound-lap-count-note', `Top ${stacked.drivers.length} piloti per giri su compound.`);
        } else {
            setNote('postgara-driver-compound-lap-count-note', 'Nessun dato giri pilota/compound disponibile.');
        }

        const driverUsageCanvas = document.getElementById('postgara-driver-compound-usage-chart');
        destroyChart('postgara-driver-compound-usage-chart');
        if (driverUsageCanvas && usageByDriverCompound.length > 0) {
            const stacked = buildStackedRows(usageByDriverCompound, 'usage_count');
            charts['postgara-driver-compound-usage-chart'] = new Chart(driverUsageCanvas, {
                type: 'bar',
                data: { labels: stacked.drivers, datasets: stacked.datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { stacked: true, ticks: { maxRotation: 50, minRotation: 30 } },
                        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Utilizzi' } }
                    }
                }
            });
            setNote('postgara-driver-compound-usage-note', `Top ${stacked.drivers.length} piloti per utilizzi compound.`);
        } else {
            setNote('postgara-driver-compound-usage-note', 'Nessun dato utilizzi pilota/compound disponibile.');
        }
    },

    async removeComment(teamIdx) {
        const team = this.teams[teamIdx];
        if (!team) return;

        if (!confirm(`Eliminare il commento di ${team.name}?`)) {
            return;
        }

        try {
            await this.deleteComment(team.name);
            if (this.editingTeamName === team.name) {
                this.editingTeamName = null;
            }
            this.renderTeamBoxes();
            this.setEditorStatus(`Commento eliminato: ${team.name}`);
            this.showError('✅ Commento eliminato');
        } catch (e) {
            this.showError('❌ Errore eliminazione commento: ' + e.message);
        }
    },

    async uploadImage(teamIdx, source = 'file') {
        const team = this.teams[teamIdx];
        if (!team) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = source === 'gallery' ? 'image/*' : '.jpg,.jpeg,.png,.webp,.gif,image/*';

        if (source === 'gallery') {
            this.setEditorStatus('Apertura gallery del dispositivo: consenti l accesso se richiesto dal browser.');
        } else {
            this.setEditorStatus('Seleziona un file immagine dal dispositivo.');
        }

        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
                this.setEditorStatus('Nessuna immagine selezionata.');
                return;
            }

            try {
                await this.uploadTeamImage(team.name, file);
                this.renderTeamBoxes();
                this.setEditorStatus(`Immagine salvata: ${team.name}`);
                this.showError('✅ Immagine salvata');
            } catch (err) {
                this.setEditorStatus(`Errore upload immagine: ${team.name}`, true);
                this.showError('❌ Errore upload immagine: ' + err.message);
            }
        };
        input.click();
    },

    buildSeoPayload() {
        return this.teams.map(team => {
            const teamData = this.data[team.name] || {};
            const palmaresText = (this.palmares && this.palmares[team.name]) ? this.palmares[team.name] : '';
            return {
                name: team.name,
                drivers: team.drivers || [],
                comment: String(teamData.comment || '').trim(),
                palmares: palmaresText,
                image: String(teamData.image || '').trim()
            };
        }).filter(item => item.comment !== '');
    },

    isWordPressMediaUrl(url) {
        const src = String(url || '').trim().toLowerCase();
        if (!src) return false;
        return src.includes('/wp-content/uploads/');
    },

    async syncTeamImageToWordPress(teamName, imageUrl) {
        const src = String(imageUrl || '').trim();
        if (!teamName || !src || this.isWordPressMediaUrl(src)) {
            return src;
        }

        const site = document.getElementById('wp-site')?.value;
        if (!site) {
            return src;
        }

        try {
            const res = await apiPost('api/wordpress.php?action=upload_media_batch', {
                site,
                paths: [src]
            });

            const uploaded = (res?.uploads || {})[src];
            if (uploaded?.url) {
                this.data[teamName] = this.data[teamName] || {};
                this.data[teamName].image = String(uploaded.url).trim();
                if (uploaded.id && !this.firstWpMediaId) {
                    this.firstWpMediaId = parseInt(uploaded.id, 10) || 0;
                }
                return this.data[teamName].image;
            }
        } catch {
            // WP upload failed: continue with local URL
        }

        return src;
    },

    async ensureWordPressImageSources(payload) {
        const teams = Array.isArray(payload) ? payload : [];

        for (const team of teams) {
            const src = String(team?.image || '').trim();
            if (!src || this.isWordPressMediaUrl(src)) {
                continue;
            }

            try {
                const uploadedUrl = await this.syncTeamImageToWordPress(team.name, src);
                team.image = uploadedUrl;
            } catch (e) {
                console.error('Error syncing image to WordPress:', e);
            }
        }
    },

    async generateSeoArticle() {
        const payload = this.buildSeoPayload();
        if (payload.length === 0) {
            this.setEditorStatus('Nessun dato da sincronizzare.', true);
            return;
        }

        try {
            this.setEditorStatus('Generazione articolo SEO in corso...');

            await this.ensureWordPressImageSources(payload);

            // Attesa per garantire che le fonti immagine siano aggiornate
            setTimeout(async () => {
                const activeTabBtn = document.querySelector('.postgara-main-tab-btn.active');
                const currentPhase = activeTabBtn ? activeTabBtn.getAttribute('data-subtab') : 'weekend';
                const gpSelect = document.getElementById('postgara-gp-select');
                const gpText = gpSelect && gpSelect.selectedIndex > 0 ? gpSelect.options[gpSelect.selectedIndex].textContent : '';
                const res = await apiPost('api/wordpress.php?action=generate_postgara_article', {
                    phase: currentPhase,
                    teams: payload,
                    gp_name: gpText
                });

                if (res?.ok && res.draft_html) {
                    // Popola review-content e attiva updatePreview() tramite evento input
                    const reviewContent = document.getElementById('review-content');
                    if (reviewContent) {
                        reviewContent.value = res.draft_html;
                        reviewContent.dispatchEvent(new Event('input'));
                    }

                    // Porta l'utente direttamente al Modulo G (revisione)
                    if (typeof activateTab === 'function') activateTab('mod-g');

                    this.setEditorStatus('Articolo SEO generato. Ora sei nel Modulo G.');
                    this.showError('✅ Articolo generato — revisionalo e pubblicalo dal Modulo G.');
                } else {
                    throw new Error(res?.message || "Errore nella generazione dell'articolo SEO");
                }
            }, 1000);

        } catch (e) {
            this.setEditorStatus('Errore nella generazione dell\'articolo SEO', true);
            this.showError('❌ ' + e.message);
        }
    }
};

function initializePostGara() {
    if (typeof postgara === 'undefined' || !postgara || typeof postgara.init !== 'function') {
        return;
    }

    document.getElementById('postgara-insert-charts-btn')?.addEventListener('click', () => {
        postgara.insertChartsIntoPost().catch(e => console.error('insertChartsIntoPost error:', e));
    });

    document.getElementById('postgara-load-undercutf1-btn')?.addEventListener('click', () => {
        postgara.loadUndercutf1Data().catch(e => console.error('loadUndercutf1Data error:', e));
    });

    return postgara.init();
}






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
                if (standingCard) standingCard.style.display = 'block';
                if (chartsSection) chartsSection.style.display = 'block';
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

            if (standingCard) standingCard.style.display = 'block';
            if (chartsSection) chartsSection.style.display = 'block';
        });
    });

    if (standingCard) standingCard.style.display = 'block';
    if (chartsSection) chartsSection.style.display = 'block';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPostGaraTabs);
} else {
    setupPostGaraTabs();
}
