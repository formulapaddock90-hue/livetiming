<section id="mod-f" class="tab-content">
    <h2>Modulo F: Circuito & Pirelli</h2>

    <h3>🏎️ Circuito</h3>
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
        <label style="margin:0; font-weight:bold; color:#eee; font-size:13px;">Circuito:
            <select id="circuit-select" style="margin-left:8px; padding:7px 12px; background:#1e1e1e; color:#fff; border:1px solid #444; border-radius:6px; font-weight:600; font-size:13px; min-width:220px; cursor:pointer;">
                <option value="">Seleziona circuito...</option>
            </select>
        </label>
        <button type="button" id="load-circuit-temperature" style="margin:0; padding:7px 14px; white-space:nowrap;">Carica Temperature</button>
    </div>
    <table id="circuit-temp-table" class="postgara-table">
        <thead><tr><th>Sessione</th><th>Min (°C)</th><th>Avg (°C)</th><th>Max (°C)</th></tr></thead>
        <tbody></tbody>
    </table>
    <canvas id="circuitTempChart"></canvas>

    <h3 style="margin-top:20px;">🏎️ Pirelli</h3>
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
        <label style="margin:0; font-weight:bold; color:#eee; font-size:13px;">Nazione:
            <select id="pirelli-country" style="margin-left:8px; padding:7px 12px; background:#1e1e1e; color:#fff; border:1px solid #444; border-radius:6px; font-weight:600; font-size:13px; min-width:220px; cursor:pointer;">
                <option value="">Seleziona nazione...</option>
            </select>
        </label>
        <button type="button" id="load-pirelli" style="margin:0; padding:7px 14px; white-space:nowrap;">Carica Dati Pirelli</button>
        <button type="button" id="load-standing-json" style="background-color:#2ecc71; color:white; margin:0; padding:7px 14px; white-space:nowrap; border:none; border-radius:6px; cursor:pointer; font-weight:600;">📊 Carica JSON Standing</button>
    </div>
    <table id="pirelli-table" class="postgara-table">
        <thead><tr><th>Compound</th><th>Best Lap</th><th>Max Stint</th></tr></thead>
        <tbody></tbody>
    </table>
    <canvas id="pirelliCompoundChart"></canvas>
</section>
