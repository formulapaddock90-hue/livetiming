const summaryUrl = "/data/dashboard/summary";
const refreshIntervalMs = 2000;
let apiKey = null;
const apiInfoUrl = "/api/info";

const GROUP_TABS = [
    { groupName: "Gruppo 1", tabId: "gruppo-1", suffix: "g1" },
    { groupName: "Gruppo 2", tabId: "gruppo-2", suffix: "g2" },
    { groupName: "Gruppo 3", tabId: "gruppo-3", suffix: "g3" }
];

const elements = {
    sessionTitle: document.getElementById("session-title"),
    sessionSubtitle: document.getElementById("session-subtitle"),
    trackStatus: document.getElementById("track-status"),
    clockStatus: document.getElementById("clock-status"),
    meetingName: document.getElementById("meeting-name"),
    circuitName: document.getElementById("circuit-name"),
    airTemp: document.getElementById("air-temp"),
    trackTemp: document.getElementById("track-temp"),
    windSpeed: document.getElementById("wind-speed"),
    humidity: document.getElementById("humidity"),
    updatedAt: document.getElementById("updated-at"),
    sessionRunning: document.getElementById("session-running"),
    driverCount: document.getElementById("driver-count"),
    timingBody: document.getElementById("timing-body"),
    rcTimeline: document.getElementById("rc-timeline"),
    rcCount: document.getElementById("rc-count"),
    driverModal: document.getElementById("driver-modal"),
    driverModalBody: document.getElementById("driver-modal-body"),
    driverModalTitle: document.getElementById("driver-modal-title"),
    driverModalClose: document.getElementById("driver-modal-close"),
    lapAlerts: document.getElementById("lap-alerts"),
    popoutBtn: document.getElementById("popoutBtn"),
    sectorHeatmapContainer: document.getElementById("sector-heatmap-container"),
    stintMatrixContainer: document.getElementById("stint-matrix-container")
};

const groupElements = Object.fromEntries(
    GROUP_TABS.map(group => [
        group.groupName,
        {
            tabId: group.tabId,
            selectedDrivers: document.getElementById(`selected-drivers-${group.suffix}`),
            lapTimeChart: document.getElementById(`lap-time-chart-${group.suffix}`),
            lapStatsTable: document.getElementById(`lap-stats-table-${group.suffix}`),
            sectorRankingTable: document.getElementById(`sector-ranking-table-${group.suffix}`),
            stintChart: document.getElementById(`stint-chart-${group.suffix}`),
            pitTable: document.getElementById(`pit-table-${group.suffix}`),
            compoundRankingTable: document.getElementById(`compound-ranking-table-${group.suffix}`),
            positionChart: document.getElementById(`position-chart-${group.suffix}`)
        }
    ])
);

let lastGoodData = null;
let selectedDriverNumbers = [];
let previousLapSnapshot = new Map();
let absoluteBestLapMs = null;
let absoluteBestDriverNumber = null;

function textOrDash(value) {
    return value && `${value}`.trim().length > 0 ? value : "-";
}

function formatTemperature(value, label) {
    return value ? `${value} °C` : `${label} -`;
}

function formatUpdatedAt(value) {
    return value ? new Date(value).toLocaleTimeString("it-IT") : "-";
}

function formatLapSeconds(seconds) {
    if (typeof seconds !== "number") {
        return "-";
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, "0");
    return `${mins}:${secs}`;
}

function badgeClass(trackStatus) {
    const text = (trackStatus ?? "").toLowerCase();
    if (text.includes("green") || text.includes("all clear")) return "green";
    if (text.includes("yellow") || text.includes("safety") || text.includes("vsc")) return "yellow";
    if (text.includes("red")) return "red";
    return "neutral";
}

function statusText(driver) {
    if (driver.retired) return "Ritirato";
    if (driver.stopped) return "Fermo";
    if (driver.knockedOut) return "Eliminato";
    if (driver.inPit) return "Pit";
    return "In pista";
}

function statusClass(driver) {
    if (driver.retired || driver.stopped) return "red";
    if (driver.knockedOut || driver.inPit) return "yellow";
    return "green";
}

function getStintDelta(stints) {
    const values = (stints ?? [])
        .map(stint => stint.bestLapMilliseconds)
        .filter(value => typeof value === "number")
        .sort((left, right) => left - right);

    if (!values.length) return null;
    return values[values.length - 1] - values[0];
}

function getComparisonPoints(driver) {
    const lapPoints = (driver.lapTimes ?? [])
        .filter(point => typeof point.lapTimeSeconds === "number" && (point.lapNumber ?? 0) > 1)
        .map(point => ({ lapNumber: point.lapNumber, lapTimeSeconds: point.lapTimeSeconds }));

    if (lapPoints.length) return lapPoints;

    return (driver.stints ?? [])
        .filter(stint => typeof stint.bestLapMilliseconds === "number" && (stint.endLap ?? 0) > 1)
        .map((stint, index) => ({
            lapNumber: stint.endLap ?? (index + 2),
            lapTimeSeconds: stint.bestLapMilliseconds / 1000
        }));
}

function getSelectedDrivers(drivers) {
    return drivers.filter(driver => selectedDriverNumbers.includes(driver.driverNumber));
}

function activateTab(tabId) {
    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });

    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("hidden", content.id !== tabId);
    });
}

function activateTabForDriver(driver, fallbackTab = "gruppo-1") {
    const tab = GROUP_TABS.find(g => g.groupName === driver.teamGroup);
    activateTab(tab?.tabId ?? fallbackTab);
}

function compoundClass(compound) {
    const c = (compound ?? "").toUpperCase();
    return ["SOFT", "MEDIUM", "HARD", "INTER", "WET"].includes(c) ? c : "UNKNOWN";
}

function compoundLabel(compound) {
    return { SOFT: "S", MEDIUM: "M", HARD: "H", INTER: "I", WET: "W" }[(compound ?? "").toUpperCase()] ?? "?";
}

function rcMsgClass(msg) {
    const m = (msg ?? "").toLowerCase();
    if (m.includes("safety car") || m.includes("vsc") || m.includes("virtual safety")) return "safety";
    if (m.includes("red flag") || m.includes("session suspended")) return "red-flag";
    if (m.includes("drs")) return "drs";
    return "";
}

function bindDriverSelection(drivers) {
    document.querySelectorAll("#timing-body .driver-row").forEach(row => {
        row.addEventListener("click", () => {
            const driverNumber = row.dataset.driverNumber;
            if (!driverNumber) return;

            if (selectedDriverNumbers.includes(driverNumber)) {
                selectedDriverNumbers = selectedDriverNumbers.filter(number => number !== driverNumber);
            } else {
                selectedDriverNumbers = [...selectedDriverNumbers, driverNumber].slice(-4);
            }

            if (lastGoodData) {
                renderSummary(lastGoodData, false);
            }
        });
    });

    document.querySelectorAll("#timing-body .driver-chart-btn").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            const driverNumber = button.dataset.driverNumber;
            if (!driverNumber) return;

            const driver = drivers.find(d => d.driverNumber === driverNumber);
            selectedDriverNumbers = [driverNumber];
            if (driver) {
                activateTabForDriver(driver);
            }

            if (lastGoodData) {
                renderSummary(lastGoodData, false);
            }
        });
    });

    document.querySelectorAll("#timing-body .driver-detail-btn").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            const driverNumber = button.dataset.driverNumber;
            if (!driverNumber) return;

            const driver = drivers.find(d => d.driverNumber === driverNumber);
            if (driver) {
                openDriverModal(driver);
            }
        });
    });
}

function renderDriverSectorsMicro(driver, sectorRankings) {
    const s1Rank = (sectorRankings?.[0]?.entries ?? []).find(e => e.driverNumber === driver.driverNumber);
    const s2Rank = (sectorRankings?.[1]?.entries ?? []).find(e => e.driverNumber === driver.driverNumber);
    const s3Rank = (sectorRankings?.[2]?.entries ?? []).find(e => e.driverNumber === driver.driverNumber);

    const getSectorClass = (entry, index) => {
        if (!entry) return "norm";
        if (entry.position === 1 || entry.isSessionBest) return "purp";
        if (entry.isPersonalBest) return "p-best";
        return "norm";
    };

    const c1 = getSectorClass(s1Rank, 1);
    const c2 = getSectorClass(s2Rank, 2);
    const c3 = getSectorClass(s3Rank, 3);

    return `
        <div class="micro-sectors" title="Settori S1 / S2 / S3">
            <span class="micro-sec ${c1}">S1</span>
            <span class="micro-sec ${c2}">S2</span>
            <span class="micro-sec ${c3}">S3</span>
        </div>`;
}

function renderDriverTireChip(driver) {
    const currentStint = (driver.stints ?? []).slice(-1)[0];
    const compound = currentStint?.compound || driver.currentCompound || "UNKNOWN";
    const laps = currentStint?.laps ?? driver.tireAge ?? "-";
    const cls = compoundClass(compound);
    const lbl = compoundLabel(compound);

    return `<span class="tire-chip ${cls}" title="Mescola ${compound} - ${laps} giri">${lbl} <small>${laps}L</small></span>`;
}

function renderDrivers(drivers, sectorRankings = []) {
    elements.driverCount.textContent = `${drivers.length} piloti`;

    if (!drivers.length) {
        elements.timingBody.innerHTML = '<tr><td colspan="6" class="empty">In attesa dei dati live...</td></tr>';
        return;
    }

    elements.timingBody.innerHTML = drivers.map(driver => {
        const teamColour = driver.teamColour ? `#${driver.teamColour}` : "#66d9ef";
        const displayName = textOrDash(driver.tla || driver.fullName || driver.racingNumber);
        const gap = driver.position === "1" ? "Leader" : textOrDash(driver.gapToLeader || driver.intervalToAhead);
        const selectedClass = selectedDriverNumbers.includes(driver.driverNumber) ? "selected-driver-row" : "";
        const improved = driver.improvedLastLap ? '<span class="lap-improved" title="Giro migliore del precedente">⚡</span>' : "";
        const lastLapStr = driver.lastLap ? driver.lastLap : "-";
        const bestLapStr = driver.bestLap ? driver.bestLap : "-";

        return `
            <tr class="driver-row ${selectedClass}" data-driver-number="${driver.driverNumber}">
                <td class="pos-cell"><strong>${textOrDash(driver.position)}</strong></td>
                <td>
                    <div class="driver-cell">
                        <span class="team-dot" style="background:${teamColour}"></span>
                        <div class="driver-name">
                            <strong>${displayName}</strong>
                        </div>
                        <button class="driver-detail-btn" data-driver-number="${driver.driverNumber}" title="Apri dettaglio pilota" aria-label="Dettaglio ${displayName}">👤</button>
                        <button class="driver-chart-btn" data-driver-number="${driver.driverNumber}" title="Mostra grafico tempi giro" aria-label="Mostra grafico tempi di ${displayName}">📈</button>
                    </div>
                </td>
                <td>${renderDriverTireChip(driver)}</td>
                <td>${renderDriverSectorsMicro(driver, sectorRankings)}</td>
                <td class="gap-cell">${gap}</td>
                <td class="lap-times-compact">
                    <div>${lastLapStr} ${improved}</div>
                    <div class="muted-small">B: ${bestLapStr}</div>
                </td>
            </tr>`;
    }).join("");

    bindDriverSelection(drivers);
}

function renderSelectedDriversHeader(drivers, labelElement) {
    if (!labelElement) return;
    const selected = getSelectedDrivers(drivers);
    if (!selected.length) {
        labelElement.textContent = "Nessun pilota selezionato";
        return;
    }
    labelElement.textContent = selected
        .map(d => d.tla || d.fullName || d.racingNumber || d.driverNumber)
        .filter(Boolean)
        .join(", ");
}

function renderDriverComparisonChart(drivers, chartElement, labelElement) {
    const groupDrivers = drivers;

    if (!groupDrivers.length) {
        chartElement.className = "chart empty";
        chartElement.textContent = "Nessun pilota disponibile nel gruppo";
        renderSelectedDriversHeader(groupDrivers, labelElement);
        return;
    }

    const series = groupDrivers
        .map(driver => {
            const points = getComparisonPoints(driver).filter(point => point.lapNumber > 1);
            return { driver, points };
        })
        .filter(item => item.points.length > 0);

    if (!series.length) {
        chartElement.className = "chart empty";
        chartElement.textContent = "Nessun tempo disponibile oltre il primo giro";
        renderSelectedDriversHeader(groupDrivers, labelElement);
        return;
    }

    const width = 860;
    const height = 280;
    const padding = 28;
    const maxLap = Math.max(...series.flatMap(item => item.points.map(point => point.lapNumber)), 2);
    const minTime = Math.min(...series.flatMap(item => item.points.map(point => point.lapTimeSeconds)));
    const maxTime = Math.max(...series.flatMap(item => item.points.map(point => point.lapTimeSeconds)));
    const span = Math.max(maxTime - minTime, 0.001);

    const toX = lap => padding + ((lap - 2) / Math.max(maxLap - 2, 1)) * (width - padding * 2);
    const toY = time => height - padding - ((time - minTime) / span) * (height - padding * 2);

    const yTicks = 4;
    const grid = Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = padding + ((height - padding * 2) / yTicks) * i;
        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="line-grid" />`;
    }).join("");

    const svgLines = series
        .map(item => {
            const polyline = item.points
                .map(point => `${toX(point.lapNumber)},${toY(point.lapTimeSeconds)}`)
                .join(" ");
            const colour = item.driver.teamColour ? `#${item.driver.teamColour}` : "#66d9ef";
            return `<polyline fill="none" stroke="${colour}" stroke-width="2.4" points="${polyline}" />`;
        })
        .join("");

    const legend = series
        .map(item => {
            const colour = item.driver.teamColour ? `#${item.driver.teamColour}` : "#66d9ef";
            const name = textOrDash(item.driver.tla || item.driver.racingNumber || item.driver.driverNumber);
            return `<span class="legend-item"><span class="legend-dot" style="background:${colour}"></span>${name}</span>`;
        })
        .join("");

    chartElement.className = "chart";
    chartElement.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-label="Tempi giro piloti del gruppo (escluso primo giro)">
            <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
            ${grid}
            ${svgLines}
        </svg>
        <div class="line-chart-legend">${legend}</div>`;

    renderSelectedDriversHeader(groupDrivers, labelElement);
}

function renderDriverDeltaComparison(drivers, container) {
    const ranked = drivers
        .filter(driver => typeof driver.bestLapMilliseconds === "number")
        .sort((a, b) => a.bestLapMilliseconds - b.bestLapMilliseconds)
        .map(driver => ({
            driver,
            bestMs: driver.bestLapMilliseconds
        }));

    if (!ranked.length) {
        container.className = "chart empty";
        container.textContent = "Nessun best lap disponibile";
        return;
    }

    const fastest = ranked[0].bestMs;
    const slowest = ranked[ranked.length - 1].bestMs;
    const span = Math.max(slowest - fastest, 1);

    container.className = "chart delta-live-chart";
    container.innerHTML = ranked.map(item => {
        const width = 100 - (((item.bestMs - fastest) / span) * 50);
        const colour = item.driver.teamColour ? `#${item.driver.teamColour}` : "#66d9ef";
        const deltaLabel = item.bestMs <= fastest + 0.001
            ? "FASTEST"
            : `+${((item.bestMs - fastest) / 1000).toFixed(3)}s`;

        return `<div class="delta-live-row">
            <div class="delta-live-head">
                <strong style="color:${colour}">${textOrDash(item.driver.tla || item.driver.driverNumber)}</strong>
                <span class="muted">Best lap: ${textOrDash(item.driver.bestLap)}</span>
            </div>
            <div class="delta-live-track">
                <div class="delta-live-fill" style="width:${width}%;background:${colour}"></div>
                <span class="delta-live-label">${deltaLabel}</span>
            </div>
        </div>`;
    }).join("");
}

function renderCompoundRankings(compoundRankings, container) {
    if (!compoundRankings?.length) {
        container.className = "compound-ranking-table empty";
        container.textContent = "Nessun dato compound disponibile";
        return;
    }

    container.className = "compound-ranking-table compound-grid";
    container.innerHTML = compoundRankings
        .map(ranking => {
            const rows = (ranking.entries ?? []).slice(0, 20);
            if (!rows.length) return "";

            return `
                <section class="compound-block compound-column">
                    <h3 class="compound-title">${textOrDash(ranking.compound)}</h3>
                    <div class="compound-rows">
                        ${rows
                            .map((entry, index) => {
                                const teamColour = entry.teamColour ? `#${entry.teamColour}` : "#66d9ef";
                                return `
                                    <div class="compound-row">
                                        <span class="compound-pos">P${index + 1}</span>
                                        <span class="compound-driver" style="color:${teamColour}">${textOrDash(entry.tla || entry.racingNumber || entry.driverNumber)}</span>
                                        <span class="compound-team muted">${textOrDash(entry.teamName)}</span>
                                        <span class="compound-lap">${textOrDash(entry.lapTime)}</span>
                                    </div>`;
                            })
                            .join("")}
                    </div>
                </section>`;
        })
        .join("");
}

function renderSectorRankings(sectorRankings, container) {
    if (!sectorRankings?.length) {
        container.className = "compound-ranking-table empty";
        container.textContent = "Nessun dato settore disponibile";
        return;
    }

    container.className = "compound-ranking-table sector-table-grid";
    container.innerHTML = sectorRankings
        .map(ranking => {
            const rows = (ranking.entries ?? []).slice(0, 20);
            if (!rows.length) return "";

            return `
                <section class="sector-table-block">
                    <h3 class="compound-title">S${textOrDash(ranking.sector)}</h3>
                    <div class="sector-table-head">
                        <span>Pos</span><span>Pilota</span><span>Team</span><span>Tempo</span>
                    </div>
                    ${rows
                        .map((entry, index) => {
                            const teamColour = entry.teamColour ? `#${entry.teamColour}` : "#66d9ef";
                            return `
                                <div class="sector-table-row">
                                    <span class="compound-pos">P${index + 1}</span>
                                    <span class="compound-driver" style="color:${teamColour}">${textOrDash(entry.tla || entry.racingNumber || entry.driverNumber)}</span>
                                    <span class="compound-team muted">${textOrDash(entry.teamName)}</span>
                                    <span class="compound-lap">${textOrDash(entry.lapTime)}</span>
                                </div>`;
                        })
                        .join("")}
                </section>`;
        })
        .join("");
}

function renderSectorHeatmap(drivers, sectorRankings, container) {
    if (!container) return;
    if (!drivers || !drivers.length) {
        container.className = "sector-heatmap-wrap empty";
        container.textContent = "Nessun dato settore disponibile";
        return;
    }

    const s1Map = new Map((sectorRankings?.[0]?.entries ?? []).map(e => [e.driverNumber, e]));
    const s2Map = new Map((sectorRankings?.[1]?.entries ?? []).map(e => [e.driverNumber, e]));
    const s3Map = new Map((sectorRankings?.[2]?.entries ?? []).map(e => [e.driverNumber, e]));

    container.className = "sector-heatmap-wrap";
    container.innerHTML = `
        <table class="heatmap-table">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Pilota</th>
                    <th>Settore 1</th>
                    <th>Settore 2</th>
                    <th>Settore 3</th>
                    <th>Miglior Giro</th>
                </tr>
            </thead>
            <tbody>
                ${drivers.map(driver => {
                    const colour = driver.teamColour ? `#${driver.teamColour}` : "#66d9ef";
                    const s1 = s1Map.get(driver.driverNumber);
                    const s2 = s2Map.get(driver.driverNumber);
                    const s3 = s3Map.get(driver.driverNumber);

                    const getCellHtml = (entry) => {
                        if (!entry || !entry.lapTime) return '<span class="sec-cell norm">-</span>';
                        let cls = "norm";
                        if (entry.position === 1 || entry.isSessionBest) cls = "purp";
                        else if (entry.isPersonalBest) cls = "p-best";
                        return `<span class="sec-cell ${cls}">${entry.lapTime}</span>`;
                    };

                    return `
                        <tr>
                            <td class="pos-cell"><strong>P${textOrDash(driver.position)}</strong></td>
                            <td>
                                <strong style="color:${colour}">${textOrDash(driver.tla || driver.fullName)}</strong>
                            </td>
                            <td>${getCellHtml(s1)}</td>
                            <td>${getCellHtml(s2)}</td>
                            <td>${getCellHtml(s3)}</td>
                            <td><strong>${textOrDash(driver.bestLap)}</strong></td>
                        </tr>`;
                }).join("")}
            </tbody>
        </table>`;
}

function renderStintComparisonMatrix(drivers, container) {
    if (!container) return;
    if (!drivers || !drivers.length) {
        container.className = "stint-matrix-wrap empty";
        container.textContent = "Nessun dato stint disponibile";
        return;
    }

    container.className = "stint-matrix-wrap";
    container.innerHTML = `
        <div class="stint-matrix-grid">
            ${drivers.map(driver => {
                const colour = driver.teamColour ? `#${driver.teamColour}` : "#66d9ef";
                const stints = driver.stints ?? [];

                const stintsHtml = stints.length ? stints.map(stint => {
                    const cls = compoundClass(stint.compound);
                    const lbl = compoundLabel(stint.compound);
                    return `
                        <div class="stint-matrix-card ${cls}">
                            <div class="stint-matrix-header">
                                <span class="stint-chip ${cls}">${lbl} ${stint.compound || "UNKNOWN"}</span>
                                <span class="stint-laps">${stint.laps ?? "?"} giri</span>
                            </div>
                            <div class="stint-matrix-details">
                                <div>Giri: ${stint.startLap ?? "?"} - ${stint.endLap ?? "?"}</div>
                                <div>Best: <strong>${stint.bestLap ?? "-"}</strong></div>
                            </div>
                        </div>`;
                }).join("") : '<div class="muted">Nessun dato stint registrato</div>';

                return `
                    <div class="stint-driver-card">
                        <div class="stint-driver-head" style="border-left-color:${colour}">
                            <div>
                                <strong style="color:${colour}">${textOrDash(driver.tla || driver.driverNumber)}</strong>
                                <span class="muted">P${textOrDash(driver.position)} · ${textOrDash(driver.teamName)}</span>
                            </div>
                            <span>${renderDriverTireChip(driver)}</span>
                        </div>
                        <div class="stint-driver-stints">
                            ${stintsHtml}
                        </div>
                    </div>`;
            }).join("")}
        </div>`;
}

function renderStintChart(drivers, container) {
    const withStints = drivers.filter(d => d.stints && d.stints.length > 0);
    if (!withStints.length) {
        container.className = "stint-chart empty";
        container.textContent = "Nessun dato stint disponibile";
        return;
    }

    const maxLap = Math.max(
        ...withStints.flatMap(d => d.stints.map(s => (s.startLap ?? 0) + (s.laps ?? 0))),
        1
    );

    const sorted = [...withStints].sort((a, b) => parseInt(a.position ?? "99") - parseInt(b.position ?? "99"));

    container.className = "stint-chart stint-infographic";
    container.innerHTML = sorted.map(driver => {
        const bars = driver.stints.map(s => {
            const width = Math.max(((s.laps ?? 1) / maxLap) * 100, 4);
            const cls = compoundClass(s.compound);
            const lbl = compoundLabel(s.compound);
            const laps = s.laps ?? "?";
            const lapRange = `${s.startLap ?? "?"}-${s.endLap ?? "?"}`;
            return `<div class="stint-segment ${cls}" style="width:${width}%" title="${s.compound ?? "?"} · ${laps} giri · Lap ${lapRange}">
                <span class="stint-segment-label">${lbl}</span>
                <span class="stint-segment-meta">${laps}g</span>
            </div>`;
        }).join("");

        const colour = driver.teamColour ? `#${driver.teamColour}` : "#66d9ef";
        return `<div class="stint-row infographic-row">
            <span class="stint-driver" style="color:${colour}">${driver.tla ?? driver.driverNumber}</span>
            <div class="stint-bars infographic-bars">${bars}</div>
        </div>`;
    }).join("");
}

function renderPitTable(drivers, container) {
    const rows = drivers
        .flatMap(d => (d.stints ?? []).map(s => ({
            tla: d.tla ?? d.driverNumber,
            colour: d.teamColour,
            stint: s.stint,
            compound: s.compound,
            laps: s.laps,
            bestLap: s.bestLap,
            bestLapMilliseconds: s.bestLapMilliseconds
        })))
        .filter(r => r.stint != null)
        .sort((a, b) => parseInt(a.stint ?? "0") - parseInt(b.stint ?? "0"));

    if (!rows.length) {
        container.className = "chart empty";
        container.textContent = "Nessun riepilogo stint disponibile";
        return;
    }

    container.className = "chart pit-board";
    container.innerHTML = `<div class="pit-board-head">
        <span>Pilota</span><span>Stint</span><span>Mescola</span><span>Best lap</span><span>Giri</span>
    </div>` + rows.map(r => {
        const colour = r.colour ? `#${r.colour}` : "#66d9ef";
        const compoundCls = compoundClass(r.compound);
        return `<div class="pit-board-row">
            <strong style="color:${colour}">${r.tla}</strong>
            <span>S${r.stint}</span>
            <span><span class="compound-chip ${compoundCls}">${compoundLabel(r.compound)} ${r.compound ?? "-"}</span></span>
            <span class="pit-duration">${r.bestLap ?? "-"}</span>
            <span>${r.laps ?? "-"}</span>
        </div>`;
    }).join("");
}

function renderRaceControl(raceControl) {
    if (!raceControl || !raceControl.length) {
        elements.rcTimeline.className = "rc-timeline empty";
        elements.rcTimeline.textContent = "Nessun messaggio disponibile";
        if (elements.rcCount) elements.rcCount.textContent = "Nessun messaggio";
        return;
    }

    if (elements.rcCount) elements.rcCount.textContent = `${raceControl.length} messaggi`;
    elements.rcTimeline.className = "rc-timeline";
    elements.rcTimeline.innerHTML = raceControl.map(m => {
        const time = m.utc ? new Date(m.utc).toLocaleTimeString("it-IT") : "-";
        const msgClass = rcMsgClass(m.message);
        return `<div class="rc-entry">
            <span class="rc-time">${time}</span>
            <span class="rc-msg ${msgClass}">${m.message ?? ""}</span>
        </div>`;
    }).join("");
}

function renderGroupTab(groupName, allDrivers, allCompoundRankings, allSectorRankings) {
    const el = groupElements[groupName];
    if (!el) return;

    const groupDrivers = allDrivers.filter(driver => driver.teamGroup === groupName);
    const selectedGroupDrivers = getSelectedDrivers(groupDrivers);
    const groupDriverNumbers = new Set(groupDrivers.map(d => d.driverNumber));

    const compoundRankings = (allCompoundRankings ?? [])
        .map(r => ({
            ...r,
            entries: (r.entries ?? []).filter(e => groupDriverNumbers.has(e.driverNumber))
        }))
        .filter(r => (r.entries ?? []).length > 0);

    const sectorRankings = (allSectorRankings ?? [])
        .map(r => ({
            ...r,
            entries: (r.entries ?? []).filter(e => groupDriverNumbers.has(e.driverNumber))
        }))
        .filter(r => (r.entries ?? []).length > 0);

    renderDriverComparisonChart(groupDrivers, el.lapTimeChart, el.selectedDrivers);
    renderDriverDeltaComparison(groupDrivers, el.lapStatsTable);
    renderSectorRankings(sectorRankings, el.sectorRankingTable);
    renderStintChart(groupDrivers, el.stintChart);
    renderPitTable(groupDrivers, el.pitTable);
    renderCompoundRankings(compoundRankings, el.compoundRankingTable);
    renderPositionChart(groupDrivers, el.positionChart);

    if (!selectedGroupDrivers.length && el.selectedDrivers) {
        el.selectedDrivers.textContent = "Nessun pilota selezionato";
    }
}

function renderSummary(data, isStale) {
    const title = [data.sessionName, data.sessionType].filter(Boolean).join(" · ");
    const subtitle = [data.meetingName, data.circuitName].filter(Boolean).join(" · ");

    elements.sessionTitle.textContent = title || "UndercutF1";
    elements.sessionSubtitle.textContent = subtitle || "In attesa dei dati della sessione...";
    elements.meetingName.textContent = textOrDash(data.meetingName);
    elements.circuitName.textContent = textOrDash(data.circuitName);
    elements.airTemp.textContent = formatTemperature(data.airTemp, "Aria");
    elements.trackTemp.textContent = data.trackTemp ? `Pista ${data.trackTemp} °C` : "Pista -";
    elements.windSpeed.textContent = data.windSpeed ? `${data.windSpeed} m/s` : "-";
    elements.humidity.textContent = data.humidity ? `${data.humidity} %` : "-";
    elements.updatedAt.textContent = formatUpdatedAt(data.updatedAtUtc);
    elements.sessionRunning.textContent = isStale
        ? `Ultimo caricamento: ${formatUpdatedAt(data.updatedAtUtc)}`
        : data.sessionRunning ? "Sessione attiva" : "Sessione non avviata";

    elements.trackStatus.textContent = textOrDash(data.trackStatus);
    elements.trackStatus.className = `badge ${badgeClass(data.trackStatus)}`;

    elements.clockStatus.textContent = data.clockPaused ? "Clock in pausa" : "Clock live";
    elements.clockStatus.className = `badge ${data.clockPaused ? "yellow" : "green"}`;

    const summaryDrivers = data.drivers || [];

    selectedDriverNumbers = selectedDriverNumbers.filter(driverNumber =>
        summaryDrivers.some(driver => driver.driverNumber === driverNumber)
    );

    if (!selectedDriverNumbers.length && summaryDrivers.length) {
        selectedDriverNumbers = [summaryDrivers[0].driverNumber];
    }

    renderDrivers(summaryDrivers, data.sectorRankings || []);
    updateLapAlerts(summaryDrivers);
    renderSectorHeatmap(summaryDrivers, data.sectorRankings || [], elements.sectorHeatmapContainer);
    renderStintComparisonMatrix(summaryDrivers, elements.stintMatrixContainer);

    for (const group of GROUP_TABS) {
        renderGroupTab(group.groupName, summaryDrivers, data.compoundRankings || [], data.sectorRankings || []);
    }

    renderRaceControl(data.raceControl ?? []);
}

async function loadSummary() {
    try {
        const response = await fetch(summaryUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const hasUsefulData = data.sessionName || (data.drivers && data.drivers.length > 0);

        if (hasUsefulData) {
            lastGoodData = data;
            renderSummary(data, false);
        } else if (lastGoodData) {
            renderSummary(lastGoodData, true);
        } else {
            renderSummary(data, false);
        }
    } catch (error) {
        elements.trackStatus.textContent = "Errore caricamento";
        elements.trackStatus.className = "badge red";
        elements.clockStatus.textContent = "Dashboard offline";
        elements.clockStatus.className = "badge red";
        elements.timingBody.innerHTML = '<tr><td colspan="6" class="empty">Impossibile leggere i dati live.</td></tr>';

        for (const group of GROUP_TABS) {
            const groupEl = groupElements[group.groupName];
            groupEl.compoundRankingTable.className = "compound-ranking-table empty";
            groupEl.compoundRankingTable.textContent = "Controlla che l'app sia avviata con --with-api";
            groupEl.sectorRankingTable.className = "compound-ranking-table empty";
            groupEl.sectorRankingTable.textContent = "Controlla che l'app sia avviata con --with-api";
        }

        console.error(error);
    }
}

document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

if (elements.popoutBtn) {
    elements.popoutBtn.addEventListener("click", () => {
        window.open(window.location.href, "_blank", "width=1280,height=850,menubar=no,toolbar=no");
    });
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(err => console.log("SW reg error:", err));
    });
}

initializeDriverModalBindings();

loadSummary();
setInterval(loadSummary, refreshIntervalMs);

function renderPositionChart(drivers, container) {
    const series = drivers
        .filter(d => d.position != null)
        .map(driver => {
            const currentPos = parseInt(driver.position ?? "0");
            if (!currentPos) return null;

            const points = (driver.lapTimes ?? [])
                .filter(lp => typeof lp.lapNumber === "number")
                .map(lp => ({ lapNumber: lp.lapNumber, position: currentPos }))
                .slice(-30);

            if (!points.length) {
                points.push({ lapNumber: 1, position: currentPos });
            }

            return { driver, points };
        })
        .filter(Boolean);

    if (!series.length) {
        container.className = "chart empty";
        container.textContent = "Nessun dato posizione disponibile";
        return;
    }

    const width = 860;
    const height = 280;
    const padding = 30;
    const maxLap = Math.max(...series.flatMap(s => s.points.map(p => p.lapNumber)), 1);
    const maxPos = Math.max(...series.flatMap(s => s.points.map(p => p.position)), 1);

    const toX = lap => padding + ((lap - 1) / Math.max(maxLap - 1, 1)) * (width - padding * 2);
    const toY = pos => padding + ((pos - 1) / Math.max(maxPos - 1, 1)) * (height - padding * 2);

    const grid = Array.from({ length: maxPos }, (_, i) => {
        const y = toY(i + 1);
        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="line-grid" />`;
    }).join("");

    const lines = series.map(s => {
        const color = s.driver.teamColour ? `#${s.driver.teamColour}` : "#66d9ef";
        const polyline = s.points.map(p => `${toX(p.lapNumber)},${toY(p.position)}`).join(" ");
        return `<polyline fill="none" stroke="${color}" stroke-width="2.2" points="${polyline}" />`;
    }).join("");

    const legend = series.map(s => {
        const color = s.driver.teamColour ? `#${s.driver.teamColour}` : "#66d9ef";
        return `<span class="legend-item"><span class="legend-dot" style="background:${color}"></span>${textOrDash(s.driver.tla || s.driver.driverNumber)}</span>`;
    }).join("");

    container.className = "chart";
    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-label="Evoluzione posizioni">
            <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
            ${grid}
            ${lines}
        </svg>
        <div class="line-chart-legend">${legend}</div>`;
}

function renderDriverModalLapChart(driver) {
    const points = getComparisonPoints(driver).slice(-20);
    if (!points.length) {
        return '<div class="chart empty">Nessun dato tempi giro disponibile</div>';
    }

    const width = 720;
    const height = 220;
    const padding = 24;
    const minLap = Math.min(...points.map(p => p.lapNumber));
    const maxLap = Math.max(...points.map(p => p.lapNumber));
    const minTime = Math.min(...points.map(p => p.lapTimeSeconds));
    const maxTime = Math.max(...points.map(p => p.lapTimeSeconds));
    const span = Math.max(maxTime - minTime, 0.001);
    const colour = driver.teamColour ? `#${driver.teamColour}` : "#66d9ef";

    const toX = lap => padding + ((lap - minLap) / Math.max(maxLap - minLap, 1)) * (width - padding * 2);
    const toY = time => height - padding - ((time - minTime) / span) * (height - padding * 2);
    const polyline = points.map(point => `${toX(point.lapNumber)},${toY(point.lapTimeSeconds)}`).join(" ");

    return `
        <svg viewBox="0 0 ${width} ${height}" class="line-chart" role="img" aria-label="Lap time dettaglio pilota">
            <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
            <polyline fill="none" stroke="${colour}" stroke-width="2.6" points="${polyline}" />
        </svg>`;
}

function renderDriverModalStints(driver) {
    const stints = driver.stints ?? [];
    if (!stints.length) {
        return '<div class="muted">Nessun stint disponibile</div>';
    }

    return `<div class="driver-modal-stints">${stints.map(stint => {
        const cls = compoundClass(stint.compound);
        return `<div class="driver-modal-stint ${cls}">
            <strong>${compoundLabel(stint.compound)} ${textOrDash(stint.compound)}</strong>
            <span class="muted">Stint ${textOrDash(stint.stint)} · Lap ${textOrDash(stint.startLap)}-${textOrDash(stint.endLap)}</span>
            <span class="muted">Best: ${textOrDash(stint.bestLap)} · Giri: ${textOrDash(stint.laps)}</span>
        </div>`;
    }).join("")}</div>`;
}

function openDriverModal(driver) {
    if (!elements.driverModal || !elements.driverModalBody || !elements.driverModalTitle) {
        return;
    }

    const title = `${textOrDash(driver.tla || driver.driverNumber)} · ${textOrDash(driver.fullName || driver.teamName)}`;
    elements.driverModalTitle.textContent = title;

    elements.driverModalBody.innerHTML = `
        <div class="driver-modal-grid">
            <section class="driver-modal-card">
                <h3>Info live</h3>
                <div class="driver-modal-kv"><span>Posizione</span><strong>P${textOrDash(driver.position)}</strong></div>
                <div class="driver-modal-kv"><span>Team</span><strong>${textOrDash(driver.teamName)}</strong></div>
                <div class="driver-modal-kv"><span>Best lap</span><strong>${textOrDash(driver.bestLap)}</strong></div>
                <div class="driver-modal-kv"><span>Ultimo giro</span><strong>${textOrDash(driver.lastLap)}</strong></div>
                <div class="driver-modal-kv"><span>Gap</span><strong>${textOrDash(driver.gapToLeader || driver.intervalToAhead)}</strong></div>
                <div class="driver-modal-kv"><span>Stato</span><strong>${statusText(driver)}</strong></div>
            </section>
            <section class="driver-modal-card">
                <h3>Lap time trend</h3>
                ${renderDriverModalLapChart(driver)}
            </section>
            <section class="driver-modal-card driver-modal-card-full">
                <h3>Stint e mescole</h3>
                ${renderDriverModalStints(driver)}
            </section>
        </div>`;

    elements.driverModal.classList.remove("hidden");
}

function closeDriverModal() {
    if (!elements.driverModal) return;
    elements.driverModal.classList.add("hidden");
}

function renderMiniSparklineChart(driver) {
    if (!driver) return "";
    const points = getComparisonPoints(driver).slice(-15);
    if (!points || points.length < 2) return "";

    const width = 280;
    const height = 48;
    const padding = 6;
    const minLap = Math.min(...points.map(p => p.lapNumber));
    const maxLap = Math.max(...points.map(p => p.lapNumber));
    const minTime = Math.min(...points.map(p => p.lapTimeSeconds));
    const maxTime = Math.max(...points.map(p => p.lapTimeSeconds));
    const span = Math.max(maxTime - minTime, 0.001);
    const colour = driver.teamColour ? `#${driver.teamColour}` : "#3ddc97";

    const toX = lap => padding + ((lap - minLap) / Math.max(maxLap - minLap, 1)) * (width - padding * 2);
    const toY = time => height - padding - ((time - minTime) / span) * (height - padding * 2);

    const polyline = points.map(p => `${toX(p.lapNumber).toFixed(1)},${toY(p.lapTimeSeconds).toFixed(1)}`).join(" ");
    const lastP = points[points.length - 1];
    const lastX = toX(lastP.lapNumber).toFixed(1);
    const lastY = toY(lastP.lapTimeSeconds).toFixed(1);

    return `
        <div class="lap-alert-chart">
            <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg" role="img" aria-label="Tempi giro ${textOrDash(driver.tla)}">
                <polyline fill="none" stroke="${colour}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />
                <circle cx="${lastX}" cy="${lastY}" r="4" fill="${colour}" class="sparkline-dot" />
            </svg>
            <div class="sparkline-footer">
                <span>Giro ${minLap}</span>
                <span class="sparkline-best">Ultimo: ${lastP.lapTimeSeconds.toFixed(3)}s</span>
                <span>Giro ${maxLap}</span>
            </div>
        </div>`;
}

function pushLapAlert(type, message, driver) {
    if (!elements.lapAlerts) return;

    const item = document.createElement("div");
    const prefix = type === "absolute" ? "🏁 GIRO VELOCE ASSOLUTO" : "⚡ GIRO VELOCE PERSONALE";
    item.className = `lap-alert-item ${type}`;

    const miniChartHtml = driver ? renderMiniSparklineChart(driver) : "";

    item.innerHTML = `
        <div class="lap-alert-header">
            <div class="lap-alert-title">${prefix}</div>
            <div class="lap-alert-msg">${message}</div>
        </div>
        ${miniChartHtml}
    `;

    if (driver) {
        item.style.cursor = "pointer";
        item.title = "Clicca per aprire il dettaglio del pilota";
        item.addEventListener("click", event => {
            event.stopPropagation();
            openDriverModal(driver);
        });
    }

    elements.lapAlerts.prepend(item);

    let duration = type === "absolute" ? 7500 : 5500;
    let timerId = null;
    let remaining = duration;
    let startTime = Date.now();

    const startTimer = () => {
        startTime = Date.now();
        timerId = setTimeout(() => {
            item.classList.add("hide");
            setTimeout(() => item.remove(), 300);
        }, remaining);
    };

    const pauseTimer = () => {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
            remaining -= Date.now() - startTime;
            if (remaining < 1000) remaining = 1000;
        }
    };

    item.addEventListener("mouseenter", pauseTimer);
    item.addEventListener("mouseleave", startTimer);

    startTimer();
}

function updateLapAlerts(drivers) {
    const current = new Map();

    for (const driver of drivers) {
        const bestMs = typeof driver.bestLapMilliseconds === "number" ? driver.bestLapMilliseconds : null;
        const prevMs = previousLapSnapshot.get(driver.driverNumber);

        if (bestMs != null) {
            current.set(driver.driverNumber, bestMs);

            if (prevMs != null && bestMs < prevMs - 0.5) {
                pushLapAlert("personal", `${textOrDash(driver.tla)} migliora il personale: ${textOrDash(driver.bestLap)}`, driver);
            }

            if (absoluteBestLapMs == null || bestMs < absoluteBestLapMs - 0.5) {
                if (absoluteBestDriverNumber !== driver.driverNumber) {
                    pushLapAlert("absolute", `Giro veloce assoluto: ${textOrDash(driver.tla)} in ${textOrDash(driver.bestLap)}`, driver);
                }
                absoluteBestLapMs = bestMs;
                absoluteBestDriverNumber = driver.driverNumber;
            }
        }
    }

    previousLapSnapshot = current;
}

function initializeDriverModalBindings() {
    if (elements.driverModalClose) {
        elements.driverModalClose.addEventListener("click", closeDriverModal);
    }

    if (elements.driverModal) {
        elements.driverModal.addEventListener("click", event => {
            const target = event.target;
            if (target instanceof HTMLElement && target.dataset.closeDriverModal === "true") {
                closeDriverModal();
            }
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeDriverModal();
        }
    });
}

async function fetchApiKey() {
    if (apiKey) return apiKey;
    try {
        const response = await fetch(apiInfoUrl);
        if (response.ok) {
            const info = await response.json();
            apiKey = info.apiKey;
            return apiKey;
        }
    } catch (error) {
        console.error("Error fetching API key:", error);
    }
    return null;
}

function getApiHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) {
        headers["X-API-Key"] = apiKey;
    }
    return headers;
}

async function exportClassificaToFtp() {
    const btn = document.getElementById('exportBtn');
    const msgEl = document.getElementById('exportMessage');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.textContent = '⏳ Caricamento...';
        msgEl.innerHTML = '';
        msgEl.className = 'export-message';

        const response = await fetch('/export/classifica/formulapaddock', {
            method: 'POST',
            headers: getApiHeaders()
        });

        const result = await response.json();

        if (result.success) {
            msgEl.className = 'export-message success';
            msgEl.innerHTML = `✅ Esportato con successo su <a href="${result.url}" target="_blank" style="color: inherit; text-decoration: underline;">FormulaPaddock</a>`;
            btn.textContent = '✅ Esportazione riuscita!';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                msgEl.innerHTML = '';
            }, 3000);
        } else {
            throw new Error(result.error || 'Errore sconosciuto');
        }
    } catch (error) {
        msgEl.className = 'export-message error';
        msgEl.textContent = `❌ Errore: ${error.message}`;
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportClassificaToFtp);
    }
});



