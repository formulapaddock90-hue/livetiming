<?php
// Modulo Post Gara & Analisi Weekend
?>
<section id="mod-postgara" class="tab-content postgara-module-content">
    <div class="postgara-header-row">
        <div>
            <h2>🏁 Post Gara & Analisi Weekend</h2>
            <p class="muted">Gestione completa del weekend di gara: Analisi Pre-Weekend e Weekend suddiviso in Venerdì, Sabato e Domenica con confronto Team e Telemetria Reale OpenF1 / UndercutF1.</p>
        </div>
        <div class="postgara-status-pill" id="postgara-status-pill">
            <span class="status-dot"></span>
            <span id="postgara-status-text">Analisi pronta</span>
        </div>
    </div>

    <!-- MAIN SECTIONS NAVIGATION TABS -->
    <div class="postgara-main-nav-tabs">
        <button type="button" class="postgara-main-tab-btn" data-subtab="pre-weekend">
            🏁 1. Pre Weekend
        </button>
        <button type="button" class="postgara-main-tab-btn active" data-subtab="weekend">
            📊 2. Weekend
        </button>
    </div>

    <!-- 1. PRE WEEKEND SECTION -->
    <div id="section-pre-weekend" class="postgara-section-panel" style="display:none;">
        <div class="postgara-card-panel">
            <h3>Preparazione Pre-Weekend & Circuito</h3>
            <p class="muted">Seleziona il circuito e carica le info Pirelli per l'analisi preparatoria.</p>

            <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end; margin-top:16px;">
                <label style="margin:0; flex:1; min-width:200px;">Circuito
                    <select id="circuit-select" name="circuit-select" aria-label="Seleziona circuito" style="margin-top:4px; width:100%;">
                        <option value="">Seleziona circuito</option>
                    </select>
                </label>
                <button type="button" id="load-circuit-temperature" style="margin:0; padding:8px 16px;">Carica Temperature</button>

                <label style="margin:0; flex:1; min-width:200px;">Nazione (Pirelli)
                    <select id="pirelli-country" name="pirelli-country" aria-label="Seleziona nazione" style="margin-top:4px; width:100%;">
                        <option value="">Seleziona nazione</option>
                    </select>
                </label>
                <button type="button" id="load-pirelli" style="margin:0; padding:8px 16px;">Carica Pirelli</button>
                <button type="button" id="preweekend-load-standing-json" class="postgara-load-local-pc-btn" style="background-color:#2ecc71; color:white; margin:0; padding:8px 16px; font-weight:bold;">📁 Scegli file JSON dal PC</button>
                <input type="file" id="postgara-json-file-input" name="postgara-json-file-input" aria-label="Seleziona file JSON" accept=".json,.jsonl,.csv" style="display:none;" />
            </div>

            <div style="margin-top:20px;">
                <h4>Temperature Circuito</h4>
                <table id="circuit-temp-table" class="postgara-table">
                    <thead><tr><th>Sessione</th><th>Min (°C)</th><th>Avg (°C)</th><th>Max (°C)</th></tr></thead>
                    <tbody></tbody>
                </table>
                <div class="postgara-chart-box" style="margin-top:12px;">
                    <canvas id="circuitTempChart"></canvas>
                </div>
            </div>

            <div style="margin-top:24px;">
                <h4>Dati Pirelli Compound</h4>
                <table id="pirelli-table" class="postgara-table">
                    <thead><tr><th>Compound</th><th>Best Lap</th><th>Max Stint</th></tr></thead>
                    <tbody></tbody>
                </table>
                <div class="postgara-chart-box" style="margin-top:12px;">
                    <canvas id="pirelliCompoundChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. WEEKEND SECTION -->
    <div id="section-weekend" class="postgara-section-panel active" style="display:block;">
        <!-- SUB TABS PER GIORNI -->
        <div class="postgara-day-nav-tabs">
            <button type="button" class="postgara-day-tab-btn" data-day="venerdi">
                📅 Venerdì (FP1 & FP2)
            </button>
            <button type="button" class="postgara-day-tab-btn" data-day="sabato">
                ⏱️ Sabato (FP3 & Qualifiche)
            </button>
            <button type="button" class="postgara-day-tab-btn active" data-day="domenica">
                🏆 Domenica (Gara & Grafici Team)
            </button>
        </div>

        <!-- GIORNO: VENERDI -->
        <div id="day-section-venerdi" class="postgara-day-panel" style="display:none;">
            <div class="postgara-card-panel">
                <h3>Venerdì: Prove Libere 1 & 2</h3>
                <p class="muted">Analisi del passo gara iniziale, stint e velocita di punta (Speed Trap) durante le FP1 e FP2.</p>
                <div class="postgara-toolbar" style="margin-top:16px; display:flex; gap:12px; align-items:center;">
                    <button type="button" id="venerdi-load-btn" style="background: linear-gradient(135deg, #e10600 0%, #ff4136 100%); color: #fff; font-weight: bold; font-size: 14px; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
                        ⚡ Carica Telemetria Live Venerdì (FP1 / FP2)
                    </button>
                </div>

                <!-- CLASSIFICA VENERDI -->
                <div style="margin-top:20px;">
                    <h4>🏆 Tempi e Classifica FP1 / FP2</h4>
                    <table id="venerdi-session-result-table" class="postgara-table" style="margin-top:10px;">
                        <thead><tr><th>Pos</th><th>N.</th><th>Pilota</th><th>Team</th><th>Best Lap</th><th>Ultimo Giro</th><th>Giri</th><th>Gap</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>

                <!-- GRAFICI VENERDI -->
                <div class="postgara-group-chart-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-top:20px;">
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap (FP1/FP2) - Gruppo 1 (P1-P10)</div>
                        <canvas id="venerdi-speed-trap-g1-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap (FP1/FP2) - Gruppo 2 (P11-P20)</div>
                        <canvas id="venerdi-speed-trap-g2-chart"></canvas>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">🔴🟡⚪ Giri per Compound Pirelli - FP1/FP2</div>
                        <canvas id="venerdi-laps-per-compound-chart"></canvas>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Miglior Tempo per Scuderia - FP1/FP2</div>
                        <canvas id="venerdi-session-best-laps-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- GIORNO: SABATO -->
        <div id="day-section-sabato" class="postgara-day-panel" style="display:none;">
            <div class="postgara-card-panel">
                <h3>Sabato: FP3 & Qualifiche</h3>
                <p class="muted">Analisi della prestazione sul giro secco, settori S1/S2/S3 e velocità di punta (Speed Trap).</p>
                <div class="postgara-toolbar" style="margin-top:16px; display:flex; gap:12px; align-items:center;">
                    <button type="button" id="sabato-load-btn" style="background: linear-gradient(135deg, #e10600 0%, #ff4136 100%); color: #fff; font-weight: bold; font-size: 14px; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
                        ⚡ Carica Telemetria Live Sabato (FP3 / Qualifiche)
                    </button>
                </div>

                <!-- CLASSIFICA SABATO -->
                <div style="margin-top:20px;">
                    <h4>🏆 Classifica Qualifiche / FP3</h4>
                    <table id="sabato-session-result-table" class="postgara-table" style="margin-top:10px;">
                        <thead><tr><th>Pos</th><th>N.</th><th>Pilota</th><th>Team</th><th>Best Lap</th><th>Ultimo Giro</th><th>Giri</th><th>Gap</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>

                <!-- GRAFICI SABATO -->
                <div class="postgara-group-chart-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-top:20px;">
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap - Gruppo 1 (P1-P10)</div>
                        <canvas id="sabato-speed-trap-g1-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap - Gruppo 2 (P11-P20)</div>
                        <canvas id="sabato-speed-trap-g2-chart"></canvas>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 1 (S1) - Gruppo 1</div>
                        <canvas id="sabato-best-s1-g1-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 1 (S1) - Gruppo 2</div>
                        <canvas id="sabato-best-s1-g2-chart"></canvas>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 2 (S2) - Gruppo 1</div>
                        <canvas id="sabato-best-s2-g1-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 2 (S2) - Gruppo 2</div>
                        <canvas id="sabato-best-s2-g2-chart"></canvas>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 3 (S3) - Gruppo 1</div>
                        <canvas id="sabato-best-s3-g1-chart"></canvas>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Miglior Settore 3 (S3) - Gruppo 2</div>
                        <canvas id="sabato-best-s3-g2-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- GIORNO: DOMENICA -->
        <div id="day-section-domenica" class="postgara-day-panel active" style="display:block;">
            <!-- TOOLBAR PRINCIPALE POST GARA -->
            <div class="postgara-toolbar" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
                <button type="button" id="postgara-load-undercutf1-btn" class="btn-primary-main" style="background: linear-gradient(135deg, #e10600 0%, #ff4136 100%); color: #ffffff; font-weight: bold; font-size: 15px; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 14px rgba(225, 6, 0, 0.4); display: inline-flex; align-items: center; gap: 8px;">
                    ⚡ Carica Gara & Telemetria Live (OpenF1 / UndercutF1)
                </button>
                <button type="button" id="load-standing-json" class="postgara-load-local-pc-btn" style="background-color:#27ae60; color:white; font-weight:600; padding:10px 16px; border:none; border-radius:6px; cursor:pointer;">📁 Scegli file JSON dal PC</button>
                <button type="button" id="postgara-generate-seo-btn" style="background:#2c3e50; color:#fff; padding:10px 16px; border:none; border-radius:6px; cursor:pointer;">✍️ Genera articolo SEO</button>
                <button type="button" id="postgara-insert-charts-btn" style="background:#8e44ad; color:#fff; padding:10px 16px; border:none; border-radius:6px; cursor:pointer;">📊 Inserisci grafici nel post</button>
                <button type="button" id="postgara-clear-comments-btn" style="background:#e74c3c; color:#fff; padding:10px 16px; border:none; border-radius:6px; cursor:pointer; font-weight:600;">🗑️ Svuota tutto</button>
            </div>

            <!-- CLASSIFICA LIVE/FINALE -->
            <div class="postgara-card-panel" style="margin-top:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>🏆 Classifica Gara Domenica</h3>
                    <div id="standing-status" style="padding:4px 8px; font-size:12px; border-radius:4px; display:none;"></div>
                </div>
                <table id="session-result-table" class="postgara-table" style="margin-top:12px;">
                    <thead><tr><th>Pos</th><th>N.</th><th>Pilota</th><th>Team</th><th>Best Lap</th><th>Ultimo Giro</th><th>Giri</th><th>Gap</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>

            <!-- GRAFICI DI CONFRONTO TEAM / LAP-TIME (OPENF1 / UNDERCUTF1) -->
            <section class="postgara-group-section" id="postgara-team-comparison-section" style="margin-top:20px;">
                <div class="postgara-group-header">
                    <div>
                        <h3>🏎️ Grafici di Confronto tra i Team (OpenF1 / UndercutF1)</h3>
                        <p class="muted">Confronto dei tempi sul giro (Lap-Time), stint di gara e velocità tra le 10 scuderie F1</p>
                    </div>
                </div>

                <div class="postgara-group-chart-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap:20px; margin-top:16px;">
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Miglior Tempo per le Ultime Sessioni per Scuderia</div>
                        <div class="postgara-group-chart-wrap">
                            <canvas id="postgara-session-best-laps-chart"></canvas>
                        </div>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">🔴🟡⚪ Giri Percorsi per Compound / Mescola per Scuderia</div>
                        <div class="postgara-group-chart-wrap">
                            <canvas id="postgara-laps-per-compound-chart"></canvas>
                        </div>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap (Velocità Max Gara) - Gruppo 1 (P1-P10)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-speed-trap-g1-chart"></canvas></div>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⚡ Speed Trap (Velocità Max Gara) - Gruppo 2 (P11-P20)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-speed-trap-g2-chart"></canvas></div>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 1 - Gruppo 1 (P1-P10)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s1-g1-chart"></canvas></div>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 1 - Gruppo 2 (P11-P20)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s1-g2-chart"></canvas></div>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 2 - Gruppo 1 (P1-P10)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s2-g1-chart"></canvas></div>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 2 - Gruppo 2 (P11-P20)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s2-g2-chart"></canvas></div>
                    </div>

                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 3 - Gruppo 1 (P1-P10)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s3-g1-chart"></canvas></div>
                    </div>
                    <div class="postgara-group-chart-card" style="background:#1e1e1e; padding:16px; border-radius:8px;">
                        <div class="postgara-group-chart-title" style="font-weight:bold; color:#fff; margin-bottom:8px;">⏱️ Settore 3 - Gruppo 2 (P11-P20)</div>
                        <div class="postgara-group-chart-wrap"><canvas id="postgara-best-s3-g2-chart"></canvas></div>
                    </div>
                </div>

                <div id="postgara-boxes-container" class="postgara-boxes-container" style="margin-top:20px;"></div>
            </section>
        </div>
    </div>
</section>
