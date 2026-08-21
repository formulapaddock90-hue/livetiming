# 🚀 Checklist Deployment - Sistema Esportazione Classifica

## ✅ Fase 1: Preparazione UndercutF1

- [ ] Creare directory pubblica
  ```bash
  mkdir -p public/classifica
  chmod 755 public/classifica
  ```

- [ ] Upload file `export-classifica.php` in root di undercut-f1.it
  
- [ ] Aggiornare `api-classifica.php` (modifiche già applicate):
  - [ ] Aggiunta variabile `$localExportFile`
  - [ ] Aggiunto fallback a lettura file locale

- [ ] Aggiornare `classifica-loader.js` (modifiche già applicate):
  - [ ] Aggiunta funzione `exportToFormulaPaddock()`
  - [ ] Aggiunto event listener per `#export-formulapaddock-btn`

- [ ] Verificare che `classifica-loader.js` sia accessibile in root pubblica
  - URL di accesso: `https://www.undercut-f1.it/classifica-loader.js`

- [ ] Testare l'esportazione:
  ```bash
  curl https://www.undercut-f1.it/export-classifica.php
  ```
  Deve restituire JSON con success: true

## ✅ Fase 2: Setup FormulaPaddock

- [ ] Identificare la posizione del **Modulo D** su formulapaddock.it
  - Cercare elemento con ID `modulo-d`, classe `modulo-d`, o attributo `data-modulo="d"`
  - Oppure cercare testo "Classifica Finale" sulla pagina

- [ ] Aprire/creare il file HTML della pagina del modulo D
  - Presumibilmente: `/seo/modulo-d.html` o `/modulo-d.html`

- [ ] Inserire il contenuto di `modulo-d-integrazione.html`
  - Copiare l'intera sezione `<div id="modulo-d">`
  - Incollare prima della chiusura della sezione/pagina pertinente

- [ ] Verificare che lo script `classifica-loader.js` sia caricato correttamente
  - Check nella console browser (F12): deve logare "✅ Classifica Loader inizializzato"

## ✅ Fase 3: Configurazione Database

- [ ] Verificare tabella `classifica` nel database di UndercutF1
  ```sql
  SELECT * FROM classifica LIMIT 1;
  ```

- [ ] Se la tabella non esiste, usare fallback JSON:
  - Assicurarsi che `classifica-data.json` esista in root
  - Il file deve contenere array di piloti

- [ ] Verificare colonne della tabella:
  - `posizione` o `Posizione`
  - `n_gara` o `N. Gara`
  - `pilota` o `Pilota`
  - `team` o `Team`
  - `best_lap` o `Best Lap`
  - `ultimo_giro` o `Ultimo Giro`
  - `giri` o `Giri`
  - `gap` o `Gap`

## ✅ Fase 4: Test Funzionale

### Test 1: Esportazione
- [ ] Navigare a `https://www.undercut-f1.it/export-classifica.php`
- [ ] Verificare response JSON:
  ```json
  {
    "success": true,
    "message": "Classifica esportata con successo",
    "rows": XX,
    "timestamp": "2026-07-22 HH:MM:SS"
  }
  ```
- [ ] Verificare che file esista:
  - `/public/classifica/finale.csv`
  - `/public/classifica/finale-2026-07-22.csv`

### Test 2: API di Lettura
- [ ] Navigare a `https://www.undercut-f1.it/api-classifica.php`
- [ ] Verificare response JSON con array di piloti
- [ ] Verificare che `source` sia "local" (legge da CSV)

### Test 3: Download CSV
- [ ] Navigare a `https://www.undercut-f1.it/api-classifica.php?format=csv`
- [ ] Verificare che scarichi un file `.csv`
- [ ] Aprire il file e verificare il contenuto

### Test 4: Caricamento Classifica in FormulaPaddock
- [ ] Aprire la pagina di FormulaPaddock con il modulo D
- [ ] Cliccare su pulsante **🏁 Carica Classifica Finale**
- [ ] Verificare che:
  - [ ] La tabella si popoli con i dati
  - [ ] Il timestamp di aggiornamento sia visualizzato
  - [ ] Console browser non mostri errori

### Test 5: Esportazione da Undercut in FormulaPaddock
- [ ] Cliccare su pulsante **💾 Esporta da Undercut**
- [ ] Verificare che:
  - [ ] Appaia messaggio di conferma
  - [ ] Numero di piloti sia corretto
  - [ ] Timestamp sia aggiornato

## ✅ Fase 5: Controllo Errori

- [ ] Testare con JavaScript console disabilitato (F12 → Sources → Pause)
- [ ] Testare con rete lenta (Chrome DevTools → Throttling)
- [ ] Testare su browser mobile
- [ ] Testare con cache cleared (Ctrl+Shift+Delete)

### Errori Comuni:

| Errore | Soluzione |
|--------|-----------|
| "Impossibile leggere il file CSV" | Verificare che `/public/classifica/` esista e sia scrivibile |
| "Contenitore classifica non trovato" | Assicurarsi che il modulo D abbia ID/classe `modulo-d` |
| "Script non caricato" | Verificare che classifica-loader.js sia in root pubblica di undercut-f1.it |
| CORS error | Verificare header `Access-Control-Allow-Origin: *` in api-classifica.php |

## ✅ Fase 6: Documentazione & Manutenzione

- [ ] Salvare file di setup in un luogo accessibile
- [ ] Creare pagina FAQ per gli utenti
- [ ] Documentare credenziali di accesso (se necessarie)
- [ ] Impostare backup automatico di `finale.csv`

## 📋 File Coinvolti

| File | Percorso | Status |
|------|---------|--------|
| export-classifica.php | UndercutF1 root | ✅ Creato |
| api-classifica.php | UndercutF1 root | ✅ Aggiornato |
| classifica-loader.js | UndercutF1 root | ✅ Aggiornato |
| modulo-d-integrazione.html | FormulaPaddock | 📋 Da inserire |
| INTEGRAZIONE-FORMULAPADDOCK.md | Documentazione | ✅ Creato |

## 🎯 Post-Deployment

Dopo il deployment:

1. Monitorare i log per errori
2. Verificare che i dati si aggiornino correttamente ogni volta che si esporta
3. Impostare un reminder per controllare integrità dei dati periodicamente
4. Se necessario, aggiungere un webhook automatico per esportare al termine di ogni sessione

---

**Versione**: 1.0  
**Data**: 2026-07-22  
**Status**: 🟢 Pronto per il deployment
