<?php
// Modulo Post Gara - Analisi Team Pre Weekend & Weekend con Grafici UndercutF1 & OpenF1
?>
<section id="mod-postgara" class="tab-content postgara-module-content">
    <div class="postgara-header-row">
        <div>
            <h2>Modulo Post Gara: Analisi Team</h2>
            <p class="muted">Gestione dei commenti e grafici dei Team suddivisa tra Pre Weekend e Weekend (Venerdì, Sabato, Domenica con grafici UndercutF1).</p>
        </div>
        <div class="postgara-status-pill" id="postgara-status-pill">
            <span class="status-dot"></span>
            <span id="postgara-status-text">Analisi pronta</span>
        </div>
    </div>

    <!-- MAIN NAV TABS: PRE WEEKEND vs WEEKEND -->
    <div class="postgara-main-nav-tabs mb-4">
        <button type="button" class="postgara-main-tab-btn" data-subtab="pre-weekend">
            🏁 Pre Weekend (Analisi Team)
        </button>
        <button type="button" class="postgara-main-tab-btn active" data-subtab="weekend">
            📊 Weekend (Venerdì / Sabato / Domenica)
        </button>
    </div>

    <!-- 1. PRE WEEKEND TEAM ANALYSIS -->
    <div id="section-pre-weekend" class="postgara-section-panel" style="display:none;">
        <div class="postgara-card-panel">
            <h3>🏁 Pre Weekend - Analisi & Aspettative dei Team</h3>
            <p class="muted">Inserisci i commenti, le note e l'analisi preparatoria dei team prima dell'inizio del weekend di gara.</p>
            
            <div class="postgara-toolbar" style="margin-top:16px;">
                <button type="button" id="postgara-toggle-incomplete-btn-pre" class="btn btn-secondary">Mostra solo da completare</button>
                <button type="button" id="postgara-clear-comments-btn-pre" class="btn btn-danger">Svuota commenti Pre-Weekend</button>
            </div>

            <div id="postgara-boxes-container-pre" class="postgara-boxes-container" style="margin-top:16px;">
                <!-- Box team Pre-Weekend generati dinamicamente -->
            </div>
        </div>
    </div>

    <!-- 2. WEEKEND TEAM ANALYSIS (VENERDI, SABATO, DOMENICA) -->
    <div id="section-weekend" class="postgara-section-panel active" style="display:block;">
        <!-- DAY SUB TABS -->
        <div class="postgara-day-nav-tabs mb-4" id="postgara-day-nav-wrapper">
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

        <!-- DAY: VENERDI -->
        <div id="day-section-venerdi" class="postgara-day-panel active" style="display:block;">
            <div class="postgara-card-panel">
                <h3>📅 Venerdì - Prove Libere 1 & 2</h3>
                <p class="muted">Analisi del passo gara dei team e primi riscontri dai long run nelle FP1/FP2.</p>
                <div class="postgara-toolbar" style="margin-top:14px;">
                    <button type="button" class="postgara-load-local-pc-btn btn btn-success" style="background-color:#2ecc71; color:white; font-weight:bold;">📊 Carica Ultima Sessione Locale (PC)</button>
                    <button type="button" id="venerdi-load-btn" class="btn btn-primary">Carica FP1/FP2</button>
                </div>
                <div class="postgara-boxes-container" id="postgara-boxes-container-venerdi" style="margin-top:16px;">
                    <!-- Box team Venerdì -->
                </div>
            </div>
        </div>

        <!-- DAY: SABATO -->
        <div id="day-section-sabato" class="postgara-day-panel" style="display:none;">
            <div class="postgara-card-panel">
                <h3>⏱️ Sabato - FP3 & Qualifiche</h3>
                <p class="muted">Prestazioni sul giro secco, velocità di punta (Speed Trap) e confronto nei settori S1/S2/S3.</p>
                <div class="postgara-toolbar" style="margin-top:14px;">
                    <button type="button" class="postgara-load-local-pc-btn btn btn-success" style="background-color:#2ecc71; color:white; font-weight:bold;">📊 Carica Ultima Sessione Locale (PC)</button>
                    <button type="button" id="sabato-load-btn" class="btn btn-primary">Carica Qualifiche</button>
                </div>
                <div class="postgara-boxes-container" id="postgara-boxes-container-sabato" style="margin-top:16px;">
                    <!-- Box team Sabato -->
                </div>
            </div>
        </div>

        <!-- DAY: DOMENICA -->
        <div id="day-section-domenica" class="postgara-day-panel" style="display:none;">
            <!-- TOOLBAR GARA -->
            <div class="postgara-toolbar mb-3">
                <button type="button" id="postgara-load-undercutf1-btn" class="btn btn-success" style="background-color:#2ecc71; color:white; font-weight:bold; padding:10px 18px; font-size:14px;" title="Carica Qualifiche Ungheria 2026 o scegli file dal PC">
                    🏎️ 1. Carica Qualifiche Ungheria 2026 (Live & PC)
                </button>
                <input type="file" id="postgara-json-file-input" accept=".json,.jsonl,.csv" style="display:none;" />
                <button type="button" id="postgara-generate-seo-btn" class="btn btn-accent">2. Genera articolo SEO</button>
                <button type="button" id="postgara-insert-charts-btn" class="btn btn-info">3. Inserisci grafici nel post</button>
                <button type="button" id="postgara-clear-comments-btn" class="btn btn-danger">Svuota commenti Domenica</button>
            </div>

            <!-- CLASSIFICA LIVE/FINALE DOMENICA -->
            <div class="postgara-card-panel" id="postgara-standing-card" style="margin-top:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>🏆 Classifica Finale Domenica</h3>
                    <div id="standing-status" style="padding:4px 8px; font-size:12px; border-radius:4px; display:none;"></div>
                </div>
                <table id="session-result-table" class="postgara-table" style="margin-top:12px;">
                    <thead><tr><th>Pos</th><th>N.</th><th>Pilota</th><th>Team</th><th>Best Lap</th><th>Ultimo Giro</th><th>Giri</th><th>Gap</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>

            <!-- GRAFICI DI CONFRONTO TEAM / LAP-TIME (UNDERCUTF1 & OPENF1) -->
            <section class="postgara-group-section" id="postgara-full-charts-section" style="margin-top:20px;">
                <div class="postgara-group-header">
                    <div>
                        <h3>🏎️ Grafici di Confronto tra i Team (UndercutF1 & OpenF1)</h3>
                        <p class="muted">Confronto dei tempi sul giro (Lap-Time), stint di gara e velocità tra le scuderie</p>
                    </div>
                </div>

                <!-- NUOVI GRAFICI DI CONFRONTO TEAM -->
                <div class="postgara-group-chart-card">
                    <div class="postgara-group-chart-title">⏱️ Miglior Tempo per le Ultime 2 Sessioni per Scuderia (Qualifiche vs Gara)</div>
                    <div class="postgara-group-chart-wrap">
                        <canvas id="postgara-session-best-laps-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-note muted">Confronto dei tempi record ottenuti dai team nelle ultime 2 sessioni del weekend (es. Qualifiche e Gara).</div>
                </div>

                <div class="postgara-group-chart-card">
                    <div class="postgara-group-chart-title">🔴🟡⚪ Giri Percorsi per Compound / Mescola per Scuderia</div>
                    <div class="postgara-group-chart-wrap">
                        <canvas id="postgara-laps-per-compound-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-note muted">Distribuzione dei giri percorsi da ciascun team su gomma Soft, Medium, Hard, Inter e Wet.</div>
                </div>

                <!-- CONFRONTO LAP TIMES -->
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

                <!-- STRATEGIA E STINT GOMME -->
                <div class="postgara-group-chart-card">
                    <div class="postgara-group-chart-title">Strategia Stint & Mescole Gomme (Tyre Strategy)</div>
                    <div class="postgara-group-chart-wrap">
                        <canvas id="postgara-tyre-strategy-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-note muted" id="postgara-tyre-strategy-note"></div>
                </div>
            </section>

            <!-- BOX TEAM ANALISI INDIVIDUALE DOMENICA -->
            <div id="postgara-boxes-container" class="postgara-boxes-container" style="margin-top:20px;">
                <!-- Box team Domenica -->
            </div>
        </div>
    </div>

    <div id="postgara-loading" class="muted" style="text-align: center; display: none;">
        Caricamento dati gara... ⏳
    </div>
    <div id="postgara-error" class="notice notice-warn" style="display: none;"></div>
</section>

<script src="postgara-charts.js?v=<?php echo time(); ?>"></script>
