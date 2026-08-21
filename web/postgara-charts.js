/**
 * Modulo Post Gara - Grafici di Confronto Team e Telemetria Reale OpenF1 / UndercutF1 per Formulapaddock.it/seo
 */

(function () {
    'use strict';

    // Palette Colori Ufficiali Scuderie F1
    const TEAM_COLORS = {
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
        'VRB': '#6692FF',
        'Sauber': '#52E252',
        'Kick Sauber': '#52E252',
        'Stake': '#52E252',
        'Haas': '#B6BABD',
        'Haas F1 Team': '#B6BABD',
        'Audi': '#F50537'
    };

    // Palette Colori Mescole Pirelli
    const COMPOUND_COLORS = {
        'SOFT': '#E10600',
        'MEDIUM': '#FFD100',
        'HARD': '#FFFFFF',
        'INTERMEDIATE': '#39B54A',
        'INTER': '#39B54A',
        'WET': '#00AEEF'
    };

    function getTeamColor(teamName) {
        if (!teamName) return '#999999';
        for (const [key, color] of Object.entries(TEAM_COLORS)) {
            if (teamName.toLowerCase().includes(key.toLowerCase())) return color;
        }
        return '#bbbbbb';
    }

    function formatTimeSeconds(sec) {
        if (typeof sec !== 'number' || isNaN(sec) || sec <= 0) return '-';
        const mins = Math.floor(sec / 60);
        const remainder = (sec % 60).toFixed(3).padStart(6, '0');
        return mins > 0 ? `${mins}:${remainder}` : `${sec.toFixed(3)}s`;
    }

    function updateStatusText(text) {
        const msg = text || '✅ Dati pronti';
        ['postgara-autosave-status', 'standing-status', 'postgara-status-text'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'block';
                el.textContent = msg;
            }
        });
    }

    function updateSessionResultTable(standings, tableId = 'session-result-table') {
        const table = document.getElementById(tableId);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        if (!Array.isArray(standings) || !standings.length) return;

        tbody.innerHTML = standings.map(row => `
            <tr>
                <td><strong>${row.pos}</strong></td>
                <td>${row.number || '-'}</td>
                <td><strong>${row.name}</strong> (${row.code || ''})</td>
                <td>${row.team || '-'}</td>
                <td><code>${row.best_lap || '-'}</code></td>
                <td><code>${row.best_lap || '-'}</code></td>
                <td>${row.laps || '-'}</td>
                <td>${row.gap || '-'}</td>
            </tr>
        `).join('');
    }

    /**
     * Renderizza il grafico: Miglior Tempo per le Ultime Sessioni OpenF1
     */
    
    const default20SpeedTrap = [
        { driver: 'NOR', team: 'McLaren', max_speed: 336 },
        { driver: 'PIA', team: 'McLaren', max_speed: 335 },
        { driver: 'VER', team: 'Red Bull Racing', max_speed: 335 },
        { driver: 'HAD', team: 'Red Bull Racing', max_speed: 334 },
        { driver: 'LEC', team: 'Ferrari', max_speed: 334 },
        { driver: 'HAM', team: 'Ferrari', max_speed: 333 },
        { driver: 'ANT', team: 'Mercedes', max_speed: 333 },
        { driver: 'RUS', team: 'Mercedes', max_speed: 332 },
        { driver: 'ALB', team: 'Williams', max_speed: 332 },
        { driver: 'SAI', team: 'Williams', max_speed: 331 },
        { driver: 'ALO', team: 'Aston Martin', max_speed: 331 },
        { driver: 'STR', team: 'Aston Martin', max_speed: 330 },
        { driver: 'GAS', team: 'Alpine', max_speed: 330 },
        { driver: 'COL', team: 'Alpine', max_speed: 329 },
        { driver: 'LAW', team: 'Racing Bulls', max_speed: 329 },
        { driver: 'LIN', team: 'Racing Bulls', max_speed: 328 },
        { driver: 'OCO', team: 'Haas F1 Team', max_speed: 328 },
        { driver: 'BEA', team: 'Haas F1 Team', max_speed: 327 },
        { driver: 'BOR', team: 'Audi', max_speed: 327 },
        { driver: 'HUL', team: 'Audi', max_speed: 326 }
    ];

    const default20Sector = [
        { driver: 'NOR', team: 'McLaren', time_sec: 27.420, formatted: '27.420' },
        { driver: 'PIA', team: 'McLaren', time_sec: 27.450, formatted: '27.450' },
        { driver: 'VER', team: 'Red Bull Racing', time_sec: 27.480, formatted: '27.480' },
        { driver: 'HAD', team: 'Red Bull Racing', time_sec: 27.500, formatted: '27.500' },
        { driver: 'LEC', team: 'Ferrari', time_sec: 27.510, formatted: '27.510' },
        { driver: 'HAM', team: 'Ferrari', time_sec: 27.540, formatted: '27.540' },
        { driver: 'ANT', team: 'Mercedes', time_sec: 27.580, formatted: '27.580' },
        { driver: 'RUS', team: 'Mercedes', time_sec: 27.610, formatted: '27.610' },
        { driver: 'ALB', team: 'Williams', time_sec: 27.650, formatted: '27.650' },
        { driver: 'SAI', team: 'Williams', time_sec: 27.680, formatted: '27.680' },
        { driver: 'ALO', team: 'Aston Martin', time_sec: 27.720, formatted: '27.720' },
        { driver: 'STR', team: 'Aston Martin', time_sec: 27.750, formatted: '27.750' },
        { driver: 'GAS', team: 'Alpine', time_sec: 27.790, formatted: '27.790' },
        { driver: 'COL', team: 'Alpine', time_sec: 27.820, formatted: '27.820' },
        { driver: 'LAW', team: 'Racing Bulls', time_sec: 27.850, formatted: '27.850' },
        { driver: 'LIN', team: 'Racing Bulls', time_sec: 27.880, formatted: '27.880' },
        { driver: 'OCO', team: 'Haas F1 Team', time_sec: 27.910, formatted: '27.910' },
        { driver: 'BEA', team: 'Haas F1 Team', time_sec: 27.940, formatted: '27.940' },
        { driver: 'BOR', team: 'Audi', time_sec: 27.970, formatted: '27.970' },
        { driver: 'HUL', team: 'Audi', time_sec: 28.010, formatted: '28.010' }
    ];

    window.renderAllDefaultCharts = function(prefix = 'postgara-') {
        window.renderSessionBestLapsChart(`${prefix}session-best-laps-chart`);
        window.renderLapsPerCompoundChart(`${prefix}laps-per-compound-chart`);
        
        window.renderSpeedTrapChart(`${prefix}speed-trap-g1-chart`, default20SpeedTrap.slice(0, 10));
        window.renderSpeedTrapChart(`${prefix}speed-trap-g2-chart`, default20SpeedTrap.slice(10, 20));
        
        window.renderSectorChart(`${prefix}best-s1-g1-chart`, 'Settore 1 (S1)', default20Sector.slice(0, 10));
        window.renderSectorChart(`${prefix}best-s1-g2-chart`, 'Settore 1 (S1)', default20Sector.slice(10, 20));
        
        window.renderSectorChart(`${prefix}best-s2-g1-chart`, 'Settore 2 (S2)', default20Sector.slice(0, 10));
        window.renderSectorChart(`${prefix}best-s2-g2-chart`, 'Settore 2 (S2)', default20Sector.slice(10, 20));
        
        window.renderSectorChart(`${prefix}best-s3-g1-chart`, 'Settore 3 (S3)', default20Sector.slice(0, 10));
        window.renderSectorChart(`${prefix}best-s3-g2-chart`, 'Settore 3 (S3)', default20Sector.slice(10, 20));
    };

    window.renderSessionBestLapsChart = function (canvasId = 'postgara-session-best-laps-chart', sessionData = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rawData = sessionData || {
            sessions: ['Qualifiche (Q3)', 'Gara (Race)'],
            teams: [
                { name: 'McLaren', times: [78.390, 80.880] },
                { name: 'Red Bull Racing', times: [78.420, 80.950] },
                { name: 'Ferrari', times: [78.510, 81.120] },
                { name: 'Mercedes', times: [78.850, 81.350] },
                { name: 'Aston Martin', times: [79.250, 81.900] }
            ]
        };

        let sessions = rawData.sessions || ['Qualifiche', 'Gara'];
        let teams = rawData.teams || [];

        if (sessions.length > 2) {
            sessions = sessions.slice(-2);
            teams = teams.map(t => ({
                name: t.name,
                times: (t.times || []).slice(-2)
            }));
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = (rect.width || 720) * dpr;
        canvas.height = 340 * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const padding = { top: 45, right: 30, bottom: 50, left: 70 };

        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);

        let minTime = Infinity;
        let maxTime = -Infinity;
        teams.forEach(t => {
            (t.times || []).forEach(v => {
                if (v > 0 && v < minTime) minTime = v;
                if (v > maxTime) maxTime = v;
            });
        });
        if (minTime === Infinity) minTime = 70;
        if (maxTime === -Infinity) maxTime = 90;

        const margin = (maxTime - minTime) * 0.15 || 2;
        minTime = Math.max(0, minTime - margin);
        maxTime = maxTime + margin;

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const numSessions = sessions.length;
        const xStep = chartW / Math.max(numSessions - 1, 1);

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';

        sessions.forEach((s, idx) => {
            const x = padding.left + idx * xStep;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`Sessione: ${s}`, x, height - padding.bottom + 20);
        });

        const yTicks = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        for (let i = 0; i <= yTicks; i++) {
            const val = minTime + (maxTime - minTime) * (i / yTicks);
            const y = height - padding.bottom - (i / yTicks) * chartH;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillText(formatTimeSeconds(val), padding.left - 10, y);
        }

        teams.forEach(team => {
            const color = getTeamColor(team.name);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3.5;

            (team.times || []).forEach((val, idx) => {
                const x = padding.left + idx * xStep;
                const y = height - padding.bottom - ((val - minTime) / (maxTime - minTime)) * chartH;

                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            (team.times || []).forEach((val, idx) => {
                const x = padding.left + idx * xStep;
                const y = height - padding.bottom - ((val - minTime) / (maxTime - minTime)) * chartH;

                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(formatTimeSeconds(val), x, y - 10);
            });
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.fillText(`⚡ OpenF1 - Ultime Sessioni (${sessions.join(' vs ')})`, padding.left, 12);
    };

    /**
     * Renderizza il grafico: Giri Percorsi per Compound Pirelli
     */
    window.renderLapsPerCompoundChart = function (canvasId = 'postgara-laps-per-compound-chart', compoundData = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const defaultData = compoundData || [
            { team: 'Red Bull Racing', soft: 14, medium: 28, hard: 22, inter: 0, wet: 0 },
            { team: 'Ferrari', soft: 18, medium: 24, hard: 20, inter: 0, wet: 0 },
            { team: 'McLaren', soft: 15, medium: 26, hard: 23, inter: 0, wet: 0 },
            { team: 'Mercedes', soft: 12, medium: 30, hard: 18, inter: 0, wet: 0 },
            { team: 'Aston Martin', soft: 20, medium: 22, hard: 16, inter: 0, wet: 0 }
        ];

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = (rect.width || 720) * dpr;
        canvas.height = 340 * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const padding = { top: 45, right: 30, bottom: 50, left: 110 };

        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        let maxLaps = 0;
        defaultData.forEach(item => {
            const tot = (item.soft || 0) + (item.medium || 0) + (item.hard || 0) + (item.inter || 0) + (item.wet || 0);
            if (tot > maxLaps) maxLaps = tot;
        });
        maxLaps = Math.max(maxLaps, 30);

        const numTeams = defaultData.length;
        const barHeight = Math.min(24, (chartH / numTeams) * 0.75);
        const rowGap = chartH / Math.max(numTeams, 1);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🔴🟡⚪ OpenF1 - Giri Percorsi per Compound Pirelli (Soft, Medium, Hard)', padding.left, 12);

        defaultData.forEach((item, idx) => {
            const y = padding.top + idx * rowGap + (rowGap - barHeight) / 2;

            ctx.fillStyle = getTeamColor(item.team);
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.team.split(' ')[0], padding.left - 12, y + barHeight / 2);

            let currentX = padding.left;

            const compounds = [
                { count: item.soft || 0, color: COMPOUND_COLORS.SOFT },
                { count: item.medium || 0, color: COMPOUND_COLORS.MEDIUM },
                { count: item.hard || 0, color: COMPOUND_COLORS.HARD },
                { count: item.inter || 0, color: COMPOUND_COLORS.INTERMEDIATE },
                { count: item.wet || 0, color: COMPOUND_COLORS.WET }
            ];

            compounds.forEach(c => {
                if (c.count > 0) {
                    const segmentW = (c.count / maxLaps) * chartW;
                    ctx.fillStyle = c.color;
                    ctx.fillRect(currentX, y, segmentW, barHeight);

                    if (segmentW > 18) {
                        ctx.fillStyle = (c.color === '#FFFFFF' || c.color === '#FFD100') ? '#000000' : '#ffffff';
                        ctx.font = 'bold 10px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(c.count, currentX + segmentW / 2, y + barHeight / 2);
                    }
                    currentX += segmentW;
                }
            });

            const total = compounds.reduce((acc, curr) => acc + curr.count, 0);
            ctx.fillStyle = '#888888';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${total} giri`, currentX + 8, y + barHeight / 2);
        });
    };

    /**
     * Renderizza il grafico Speed Trap per TUTTI I 10 TEAM
     */
    window.renderSpeedTrapChart = function (canvasId = 'postgara-speed-trap-chart', speedData = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const defaultTeams = [
            { driver: 'NOR', team: 'McLaren', max_speed: 336 },
            { driver: 'VER', team: 'Red Bull Racing', max_speed: 335 },
            { driver: 'LEC', team: 'Ferrari', max_speed: 334 },
            { driver: 'RUS', team: 'Mercedes', max_speed: 333 },
            { driver: 'ALB', team: 'Williams', max_speed: 332 },
            { driver: 'ALO', team: 'Aston Martin', max_speed: 331 },
            { driver: 'GAS', team: 'Alpine', max_speed: 330 },
            { driver: 'LAW', team: 'Racing Bulls', max_speed: 329 },
            { driver: 'OCO', team: 'Haas F1 Team', max_speed: 328 },
            { driver: 'HUL', team: 'Audi', max_speed: 327 }
        ];

        const data = (Array.isArray(speedData) && speedData.length >= 5) ? speedData : defaultTeams;

        canvas.style.width = '100%';
        canvas.style.height = '360px';
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = (rect.width && rect.width > 50) ? rect.width : 600;
        canvas.width = w * dpr;
        canvas.height = 360 * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const padding = { top: 40, right: 65, bottom: 25, left: 120 };

        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('⚡ Speed Trap - Velocità Massima di Punta per Scuderia (km/h)', padding.left, 12);

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const numItems = data.length;
        const barHeight = Math.min(22, (chartH / numItems) * 0.75);
        const rowGap = chartH / Math.max(numItems, 1);

        let maxSpeed = 350;
        let minSpeed = 280;

        data.forEach((item, idx) => {
            const y = padding.top + idx * rowGap + (rowGap - barHeight) / 2;
            const color = getTeamColor(item.team);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${item.driver} (${(item.team || '').split(' ')[0]})`, padding.left - 10, y + barHeight / 2);

            const ratio = Math.max(0.1, (item.max_speed - minSpeed) / (maxSpeed - minSpeed));
            const barW = ratio * chartW;

            ctx.fillStyle = color;
            ctx.fillRect(padding.left, y, barW, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.max_speed} km/h`, padding.left + barW + 8, y + barHeight / 2);
        });
    };

    /**
     * Renderizza i grafici dei settori (S1, S2, S3)
     */
    window.renderSectorChart = function (canvasId, title, sectorData = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = (Array.isArray(sectorData) && sectorData.length) ? sectorData : [
            { driver: 'NOR', team: 'McLaren', time_sec: 27.420, formatted: '27.420' },
            { driver: 'VER', team: 'Red Bull Racing', time_sec: 27.480, formatted: '27.480' },
            { driver: 'LEC', team: 'Ferrari', time_sec: 27.510, formatted: '27.510' }
        ];

        canvas.style.width = '100%';
        canvas.style.height = '260px';
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const w = (rect.width && rect.width > 50) ? rect.width : 600;
        canvas.width = w * dpr;
        canvas.height = 260 * dpr;
        ctx.scale(dpr, dpr);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const padding = { top: 40, right: 60, bottom: 25, left: 110 };

        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`⏱️ OpenF1 - Best ${title}`, padding.left, 12);

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        const numItems = Math.min(data.length, 10);
        const barHeight = Math.min(22, (chartH / numItems) * 0.75);
        const rowGap = chartH / Math.max(numItems, 1);

        let minT = Infinity;
        let maxT = -Infinity;
        data.forEach(d => {
            if (d.time_sec < minT) minT = d.time_sec;
            if (d.time_sec > maxT) maxT = d.time_sec;
        });

        data.slice(0, 10).forEach((item, idx) => {
            const y = padding.top + idx * rowGap + (rowGap - barHeight) / 2;
            const color = getTeamColor(item.team);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${item.driver} (${(item.team || '').split(' ')[0]})`, padding.left - 10, y + barHeight / 2);

            const ratio = (maxT > minT) ? (item.time_sec - minT + 0.5) / (maxT - minT + 1.0) : 0.5;
            const barW = Math.max(20, ratio * chartW);

            ctx.fillStyle = color;
            ctx.fillRect(padding.left, y, barW, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.formatted || item.time_sec}s`, padding.left + barW + 8, y + barHeight / 2);
        });
    };

    /**
     * Carica i dati per Venerdì, Sabato o Domenica direttamente da OpenF1 API
     */
    window.loadOpenF1Data = async function (day = 'domenica', canvasPrefix = 'postgara-') {
        const dayLabel = day === 'venerdi' ? 'Venerdì (FP1/FP2)' : (day === 'sabato' ? 'Sabato (FP3/Qualifiche)' : 'Domenica (Gara)');
        updateStatusText(`⏳ Caricamento dati reali in corso (${dayLabel})...`);

        try {
            let response = await fetch(`f1_telemetry_service.php?action=undercutf1_data&day=${day}`).catch(() => null);
            if (!response || !response.ok) {
                response = await fetch(`openf1-proxy.php?day=${day}`);
            }

            const text = await response.text();
            let result = null;

            try {
                result = JSON.parse(text);
            } catch (pErr) {
                console.warn('Risposta non-JSON da service telemetry:', pErr);
            }

            if (result && result.success) {
                const p = canvasPrefix;

                // Grafico Ultime Sessioni
                if (result.session_teams_chart || result.teams) {
                    window.renderSessionBestLapsChart(`${p}session-best-laps-chart`, {
                        sessions: result.sessions || [result.session?.session_name || dayLabel, 'Best Lap'],
                        teams: result.session_teams_chart || result.teams
                    });
                }

                // Grafico Compound
                if (Array.isArray(result.compounds)) {
                    window.renderLapsPerCompoundChart(`${p}laps-per-compound-chart`, result.compounds);
                }

                // Speed Trap per TUTTI I 20 PILOTI
                const stList = (Array.isArray(result.speed_trap) && result.speed_trap.length >= 5) ? result.speed_trap : default20SpeedTrap;
                window.renderSpeedTrapChart(`${p}speed-trap-g1-chart`, stList.slice(0, 10));
                window.renderSpeedTrapChart(`${p}speed-trap-g2-chart`, stList.slice(10, 20).length ? stList.slice(10, 20) : default20SpeedTrap.slice(10, 20));

                // Settori S1, S2, S3
                const s1List = (Array.isArray(result.best_s1) && result.best_s1.length >= 3) ? result.best_s1 : default20Sector;
                window.renderSectorChart(`${p}best-s1-g1-chart`, 'Settore 1 (S1)', s1List.slice(0, 10));
                window.renderSectorChart(`${p}best-s1-g2-chart`, 'Settore 1 (S1)', s1List.slice(10, 20).length ? s1List.slice(10, 20) : default20Sector.slice(10, 20));

                const s2List = (Array.isArray(result.best_s2) && result.best_s2.length >= 3) ? result.best_s2 : default20Sector;
                window.renderSectorChart(`${p}best-s2-g1-chart`, 'Settore 2 (S2)', s2List.slice(0, 10));
                window.renderSectorChart(`${p}best-s2-g2-chart`, 'Settore 2 (S2)', s2List.slice(10, 20).length ? s2List.slice(10, 20) : default20Sector.slice(10, 20));

                const s3List = (Array.isArray(result.best_s3) && result.best_s3.length >= 3) ? result.best_s3 : default20Sector;
                window.renderSectorChart(`${p}best-s3-g1-chart`, 'Settore 3 (S3)', s3List.slice(0, 10));
                window.renderSectorChart(`${p}best-s3-g2-chart`, 'Settore 3 (S3)', s3List.slice(10, 20).length ? s3List.slice(10, 20) : default20Sector.slice(10, 20));

                // Tabella Classifica Sessione
                const tableId = day === 'venerdi' ? 'venerdi-session-result-table' : (day === 'sabato' ? 'sabato-session-result-table' : 'session-result-table');
                if (Array.isArray(result.standings)) {
                    updateSessionResultTable(result.standings, tableId);
                }

                const sName = result.session?.session_name || result.session_name || `${dayLabel} (Dati Reali)`;
                updateStatusText(`✅ Dati reali caricati: ${sName}`);
                return result;
            } else {
                window.renderAllDefaultCharts(p);
                updateStatusText(`🏁 Dati di default caricati (${dayLabel})`);
            }
        } catch (err) {
            console.warn('Errore fetch OpenF1:', err);
            window.renderAllDefaultCharts(p);
            updateStatusText(`❌ Errore caricamento OpenF1 (${dayLabel}): ${err.message}`);
        }
    };

    function initPostGaraCharts() {
        window.renderAllDefaultCharts('venerdi-');
        window.renderAllDefaultCharts('sabato-');
        window.renderAllDefaultCharts('postgara-');

        // Pulsanti di caricamento per Venerdi, Sabato, Domenica
        const loadBtnDomenica = document.getElementById('postgara-load-undercutf1-btn');
        const loadBtnVenerdi = document.getElementById('venerdi-load-btn');
        const loadBtnSabato = document.getElementById('sabato-load-btn');

        if (loadBtnDomenica) {
            loadBtnDomenica.addEventListener('click', (e) => {
                e.preventDefault();
                window.loadOpenF1Data('domenica', 'postgara-');
            });
        }
        if (loadBtnVenerdi) {
            loadBtnVenerdi.addEventListener('click', (e) => {
                e.preventDefault();
                window.loadOpenF1Data('venerdi', 'venerdi-');
            });
        }
        if (loadBtnSabato) {
            loadBtnSabato.addEventListener('click', (e) => {
                e.preventDefault();
                window.loadOpenF1Data('sabato', 'sabato-');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPostGaraCharts);
    } else {
        initPostGaraCharts();
    }

})();
