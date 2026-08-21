<?php
// Modulo Post Gara - Analisi Team Pre Weekend & Weekend
?>
<section id="mod-postgara" class="tab-content postgara-module-content">
    <div class="postgara-header-row">
        <div>
            <h2>Modulo Post Gara: Analisi Team</h2>
            <p class="muted">Gestione dei commenti e grafici dei Team suddivisa tra Pre-Weekend e Weekend (Venerdì, Sabato, Domenica con grafici UndercutF1).</p>
        </div>
        <div class="postgara-status-pill" id="postgara-status-pill">
            <span class="status-dot"></span>
            <span id="postgara-status-text">Analisi pronta</span>
        </div>
    </div>

    <!-- MAIN NAV TABS: PRE WEEKEND vs WEEKEND -->
    <div class="postgara-main-nav-tabs">
        <button type="button" class="postgara-main-tab-btn active" data-subtab="pre-weekend">
            🏁 Pre Weekend
        </button>
        <button type="button" class="postgara-main-tab-btn" data-subtab="weekend">
            📊 Weekend
        </button>
    </div>

    <!-- DAY SUB TABS (VISIBILI SOLO IN WEEKEND) -->
    <div id="postgara-day-nav-wrapper" class="postgara-day-nav-tabs" style="display:none;">
        <button type="button" class="postgara-day-tab-btn active" data-day="venerdi">
            📅 Venerdì (FP1 & FP2)
        </button>
        <button type="button" class="postgara-day-tab-btn" data-day="sabato">
            ⏱️ Sabato (FP3 & Qualifiche)
        </button>
        <button type="button" class="postgara-day-tab-btn" data-day="domenica">
            🏆 Domenica (Gara & Grafici UndercutF1)
        </button>
    </div>

    <!-- TOOLBAR E AZIONI -->
    <div class="postgara-toolbar" style="margin-top:12px;">
        <button type="button" id="postgara-load-undercutf1-btn" title="Carica dati da UndercutF1">1. Carica da UndercutF1 (Ungheria 2026)</button>
        <button type="button" id="load-standing-json" class="postgara-load-local-pc-btn" style="background-color:#2ecc71; color:white; font-weight:bold;">📁 Scegli file JSON dal PC</button>
        <input type="file" id="postgara-json-file-input" accept=".json,.jsonl,.csv" style="display:none;" />
        <button type="button" id="postgara-toggle-incomplete-btn">Mostra solo da completare</button>
        <button type="button" id="postgara-generate-seo-btn">2. Genera articolo SEO</button>
        <button type="button" id="postgara-insert-charts-btn">3. Inserisci grafici nel post</button>
        <button type="button" id="postgara-clear-comments-btn">Svuota commenti team</button>
    </div>

    <div id="postgara-autosave-status" class="muted postgara-inline-status" style="margin-top:8px;"></div>

    <!-- CLASSIFICA LIVE/FINALE (VISIBILE IN DOMENICA) -->
    <div id="postgara-standing-card" class="postgara-card-panel" style="margin-top:16px; display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>🏆 Classifica Finale Domenica</h3>
            <div id="standing-status" style="padding:4px 8px; font-size:12px; border-radius:4px; display:none;"></div>
        </div>
        <table id="session-result-table" class="postgara-table" style="margin-top:12px;">
            <thead><tr><th>Pos</th><th>N.</th><th>Pilota</th><th>Team</th><th>Best Lap</th><th>Ultimo Giro</th><th>Giri</th><th>Gap</th></tr></thead>
            <tbody></tbody>
        </table>
    </div>

    <!-- CONTENITORE UNICO PER LE SCHEDE DEI TEAM (REQUISITO DI POSTGARA-MODULE.JS) -->
    <div id="postgara-boxes-container" class="postgara-boxes-container" style="margin-top:16px;">
        <!-- Box team generati dinamicamente da renderTeamBoxes() -->
    </div>

    <!-- GRAFICI DI CONFRONTO TEAM / LAP-TIME (UNDERCUTF1 - VISIBILI IN DOMENICA) -->
    <section class="postgara-group-section" id="postgara-full-charts-section" style="margin-top:20px; display:none;">
        <div class="postgara-group-header">
            <div>
                <h3>🏎️ Grafici di Confronto tra i Team (UndercutF1)</h3>
                <p class="muted">Confronto dei tempi sul giro (Lap-Time), stint di gara e velocità tra le scuderie</p>
            </div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Strategia gomme (Tyre Strategy)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-tyre-strategy-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-tyre-strategy-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Confronto Tempi sul giro (Lap-Time Comparison Top 5)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-lap-times-g1-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-lap-times-g1-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Confronto Tempi sul giro (Midfield P6-10)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-lap-times-g2-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-lap-times-g2-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Confronto Tempi sul giro (Back P11-15)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-lap-times-g3-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-lap-times-g3-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Confronto Tempi sul giro (Tail P16-20)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-lap-times-g4-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-lap-times-g4-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Speed Trap (velocità massima)</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-speed-trap-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-speed-trap-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Miglior Settore 1</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-best-s1-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-best-s1-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Miglior Settore 2</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-best-s2-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-best-s2-note"></div>
        </div>

        <div class="postgara-group-chart-card">
            <div class="postgara-group-chart-title">Miglior Settore 3</div>
            <div class="postgara-group-chart-wrap">
                <canvas id="postgara-best-s3-chart"></canvas>
            </div>
            <div class="postgara-group-chart-note muted" id="postgara-best-s3-note"></div>
        </div>
    </section>

    <div id="postgara-loading" class="muted" style="text-align: center; display: none;">
        Caricamento dati gara... ⏳
    </div>
    <div id="postgara-error" class="notice notice-warn" style="display: none;"></div>
</section>
