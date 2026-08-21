// Classifica F1 Live Loader per FormulaPaddock / UndercutF1
(function() {

  // Helper per visualizzare lo stato dell'operazione
  function setStatus(message, type = 'info') {
    const statusEl = document.getElementById('modulo-d-status');
    if (!statusEl) return;

    statusEl.style.display = 'block';
    if (type === 'success') {
      statusEl.style.background = '#d4edda';
      statusEl.style.color = '#155724';
      statusEl.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
      statusEl.style.background = '#f8d7da';
      statusEl.style.color = '#721c24';
      statusEl.style.border = '1px solid #f5c6cb';
    } else {
      statusEl.style.background = '#e2e3e5';
      statusEl.style.color = '#383d41';
      statusEl.style.border = '1px solid #d6d8db';
    }
    statusEl.innerHTML = message;
  }

  // Task 3.2: Caricamento della classifica (🏁 Carica Classifica Finale)
  async function loadClassifica() {
    const importBtn = document.getElementById('import-local-standings');
    try {
      if (importBtn) {
        importBtn.disabled = true;
        importBtn.innerHTML = '⏳ Caricamento in corso...';
      }
      setStatus('⏳ Recupero dati classifica da UndercutF1...', 'info');

      // Tentativo 1: API locale/remota
      const endpoints = ['/seo/api-classifica.php', 'api-classifica.php', 'https://www.undercut-f1.it/api-classifica.php'];
      let result = null;
      let fetchError = null;

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            result = await res.json();
            if (result && result.success) break;
          }
        } catch (err) {
          fetchError = err;
        }
      }

      if (!result || !result.success) {
        throw new Error(result?.error || fetchError?.message || 'Impossibile contattare l\'API di classifica');
      }

      // Individua la tabella o il body
      let tbody = document.getElementById('classifica-finale-body');
      let table = document.getElementById('classifica-finale');

      if (!table && !tbody) {
        const container = document.querySelector('#modulo-d, .modulo-d, [data-modulo="d"]') || document.body;
        table = document.createElement('table');
        table.id = 'classifica-finale';
        table.style.cssText = 'width:100%; border-collapse:collapse; margin-top:15px; background:#fff; border:1px solid #ddd;';
        container.appendChild(table);
      }

      if (table && !tbody) {
        table.innerHTML = `
          <thead style="background:#f5f5f5; border-bottom:2px solid #ddd;">
            <tr>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Pos</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">N.</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Pilota</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Team</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Best Lap</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Ultimo Giro</th>
              <th style="padding:10px; border-right:1px solid #ddd; text-align:left;">Giri</th>
              <th style="padding:10px; text-align:left;">Gap</th>
            </tr>
          </thead>
          <tbody id="classifica-finale-body"></tbody>
        `;
        tbody = document.getElementById('classifica-finale-body');
      }

      tbody.innerHTML = '';

      const drivers = result.data || [];
      drivers.forEach((row, idx) => {
        const pos    = row.Posizione || row.position || (idx + 1);
        const nGara  = row['N. Gara'] || row.number || row.carNumber || '-';
        const pilota = row.Pilota || row.driver || row.driverName || 'Pilota Sconosciuto';
        const team   = row.Team || row.team || '-';
        const best   = row['Best Lap'] || row.best_lap || row.bestLap || '-';
        const last   = row['Ultimo Giro'] || row.last_lap || row.lastLap || '-';
        const giri   = row.Giri || row.laps || '-';
        const gap    = row.Gap || row.gap || '-';

        const tr = document.createElement('tr');
        tr.style.cssText = `background:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'}; border-bottom:1px solid #eee;`;
        tr.innerHTML = `
          <td style="padding:10px; border-right:1px solid #eee;"><strong>${pos}</strong></td>
          <td style="padding:10px; border-right:1px solid #eee;">${nGara}</td>
          <td style="padding:10px; border-right:1px solid #eee;"><strong>${pilota}</strong></td>
          <td style="padding:10px; border-right:1px solid #eee;">${team}</td>
          <td style="padding:10px; border-right:1px solid #eee;">${best}</td>
          <td style="padding:10px; border-right:1px solid #eee;">${last}</td>
          <td style="padding:10px; border-right:1px solid #eee;">${giri}</td>
          <td style="padding:10px;">${gap}</td>
        `;
        tbody.appendChild(tr);
      });

      // Aggiorna timestamp ed elemento di stato
      const tsText = `Ultimo aggiornamento: ${result.timestamp} (Sorgente: ${result.source})`;
      setStatus(`✅ Classifica aggiornata con successo! (${result.count} piloti caricati)`, 'success');

      const tsEl = document.getElementById('modulo-d-timestamp');
      if (tsEl) tsEl.textContent = tsText;

    } catch (error) {
      console.error('Errore durante il caricamento classifica:', error);
      setStatus(`❌ Errore durante il caricamento: ${error.message}`, 'error');
    } finally {
      if (importBtn) {
        importBtn.disabled = false;
        importBtn.innerHTML = '🏁 Carica Classifica Finale';
      }
    }
  }

  // Task 3.2: Forzare esportazione lato server (💾 Esporta da Undercut)
  async function exportClassificaServer() {
    const exportBtn = document.getElementById('export-formulapaddock-btn');
    try {
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '⏳ Esportazione in corso...';
      }
      setStatus('⏳ Forzatura esportazione CSV da UndercutF1...', 'info');

      const endpoints = ['/seo/export-classifica.php', 'export-classifica.php', 'https://www.undercut-f1.it/export-classifica.php'];
      let result = null;

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { method: 'POST' });
          if (res.ok) {
            result = await res.json();
            if (result && result.success) break;
          }
        } catch (e) {
          // Prova prossimo endpoint
        }
      }

      if (!result || !result.success) {
        throw new Error(result?.error || 'Errore durante la chiamata di esportazione CSV');
      }

      setStatus(`✅ Esportazione CSV completata: salvate ${result.rows} righe in ${result.file}`, 'success');

      // Ricarica automaticamente la classifica aggiornata
      await loadClassifica();

    } catch (err) {
      console.error('Errore esportazione:', err);
      setStatus(`❌ Errore esportazione server: ${err.message}`, 'error');
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '💾 Esporta da Undercut';
      }
    }
  }

  // Inizializzazione event listener DOM
  function init() {
    const importBtn = document.getElementById('import-local-standings');
    if (importBtn) {
      importBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loadClassifica();
      });
    }

    const exportBtn = document.getElementById('export-formulapaddock-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportClassificaServer();
      });
    }

    console.log('🏁 Classifica Loader (UndercutF1 ➔ FormulaPaddock) pronto.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

