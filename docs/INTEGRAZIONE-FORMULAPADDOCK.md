# 🏁 Integrazione Classifica Finale - UndercutF1 → FormulaPaddock

## 📋 Panoramica

Questo sistema esporta automaticamente la classifica finale da UndercutF1 in una cartella pubblica sul server e la rende importabile nel **Modulo D** di formulapaddock.it tramite il pulsante **🏁 Carica Classifica Finale**.

## 🔧 Componenti

### 1. **export-classifica.php** (UndercutF1)
- **Posizione**: `G:\Altri computer\Il mio computer\undercut-f1-master\export-classifica.php`
- **Funzione**: Esporta i dati dal database di UndercutF1 in CSV
- **Output**: `/public/classifica/finale.csv` e `/public/classifica/finale-YYYY-MM-DD.csv`
- **Accesso**: `POST /export-classifica.php`

### 2. **api-classifica.php** (UndercutF1)
- **Posizione**: `G:\Altri computer\Il mio computer\undercut-f1-master\api-classifica.php`
- **Funzione**: API che serve i dati in JSON
- **Priorità lettura**:
  1. File locale esportato (`/public/classifica/finale.csv`)
  2. Google Drive (fallback)
- **Accesso**: `GET /api-classifica.php` → JSON con classifica
- **Export CSV**: `GET /api-classifica.php?format=csv` → CSV download

### 3. **classifica-loader.js** (UndercutF1)
- **Posizione**: `G:\Altri computer\Il mio computer\undercut-f1-master\classifica-loader.js`
- **Funzione**: Script che carica i dati e popola la tabella
- **Listener**: 
  - Bottone `#import-local-standings` → Carica classifica dal JSON
  - Bottone `#export-formulapaddock-btn` → Esporta verso formulapaddock.it

### 4. **modulo-d-integrazione.html** (FormulaPaddock)
- **Da copiare**: Contenuto in `modulo-d-integrazione.html`
- **Destinazione**: Inserire in formulapaddock.it/seo/modulo-d.html o pagina che contiene il modulo d
- **Pulsanti inclusi**:
  - 🏁 Carica Classifica Finale
  - 💾 Esporta da Undercut

## 📦 Flusso di Esportazione

```
UndercutF1 (Database)
    ↓
export-classifica.php
    ↓
/public/classifica/finale.csv
    ↓
api-classifica.php (legge da CSV)
    ↓
JSON Response
    ↓
classifica-loader.js (su formulapaddock.it)
    ↓
Tabella nel Modulo D
```

## 🚀 Setup Iniziale

### Su UndercutF1:

1. **Creare la directory pubblica**:
   ```bash
   mkdir -p /public/classifica
   chmod 755 /public/classifica
   ```

2. **Caricare i file**:
   - `export-classifica.php`
   - Aggiornare `api-classifica.php`
   - Aggiornare `classifica-loader.js`

3. **Testare l'esportazione**:
   ```
   curl http://undercut-f1.it/export-classifica.php
   ```
   Risposta attesa:
   ```json
   {
     "success": true,
     "message": "Classifica esportata con successo",
     "file": "finale-2026-07-22.csv",
     "rows": 20,
     "timestamp": "2026-07-22 10:30:45"
   }
   ```

### Su FormulaPaddock:

1. **Copiare il file di integrazione**:
   - Copiare il contenuto di `modulo-d-integrazione.html`
   - Incollare nella pagina che contiene il modulo D

2. **Assicurarsi che lo script sia accessibile**:
   - Uploadare `classifica-loader.js` su UndercutF1 in root pubblica
   - Lo script sarà caricato da: `https://www.undercut-f1.it/classifica-loader.js`

3. **Testare il caricamento**:
   - Aprire formulapaddock.it (pagina con modulo D)
   - Cliccare su 🏁 Carica Classifica Finale
   - Verificare che la tabella si popoli

## 🔄 Flusso di Utilizzo

### Caricamento Classifica (🏁 Carica Classifica Finale):

1. Utente clicca il pulsante 🏁 nel modulo D
2. JavaScript fetch da `/seo/api-classifica.php` (locale UndercutF1)
3. API legge dal CSV esportato
4. Dati vengono popolati nella tabella del modulo D
5. Timestamp di aggiornamento viene visualizzato

### Esportazione da Undercut (💾 Esporta da Undercut):

1. Utente clicca il pulsante 💾 nel modulo D
2. JavaScript chiama `export-classifica.php` su UndercutF1
3. Script esporta dal database in CSV
4. File viene salvato in `/public/classifica/finale.csv`
5. Messaggio di conferma mostra numero di piloti e timestamp

## 📊 Formato CSV

Il file CSV usa il delimitatore `;` (punto e virgola):

```csv
Posizione;N. Gara;Pilota;Team;Best Lap;Ultimo Giro;Giri;Gap;Timestamp
1;1;Max Verstappen;Red Bull Racing;1:23.456;1:24.123;45;0:00.000;2026-07-22 15:30:45
2;11;Sergio Pérez;Red Bull Racing;1:23.789;1:24.456;45;0:01.234;2026-07-22 15:30:45
...
```

## 🔌 Endpoint API

### GET `/api-classifica.php`
Restituisce la classifica in JSON
```json
{
  "success": true,
  "data": [...],
  "count": 20,
  "timestamp": "2026-07-22 10:30:45",
  "source": "local"
}
```

### GET `/api-classifica.php?format=csv`
Scarica il file CSV della classifica

### POST `/export-classifica.php`
Esporta la classifica dal database
```json
{
  "success": true,
  "message": "Classifica esportata con successo",
  "file": "finale-2026-07-22.csv",
  "rows": 20,
  "timestamp": "2026-07-22 10:30:45"
}
```

## 🐛 Troubleshooting

### Errore: "Impossibile leggere il file CSV"
- Verificare che `/public/classifica/` esista e sia scrivibile
- Controllare i permessi della directory (755)
- Eseguire manualmente `export-classifica.php` per debuggare

### Errore: "Contenitore classifica non trovato"
- Assicurarsi che il modulo D abbia un ID `modulo-d` o classe `modulo-d`
- Verificare che sia caricato il file `classifica-loader.js`
- Controllare la console browser (F12) per errori JavaScript

### Tabella vuota
- Verificare che il database contenga dati
- Controllare che `api-classifica.php` restituisca JSON valido
- Verificare CORS headers in api-classifica.php

## 📝 Note Importanti

- La classifica viene salvata con timestamp giornaliero: `finale-YYYY-MM-DD.csv`
- Il file `finale.csv` è sempre l'ultimo esportato
- L'API legge prima dal file locale, poi fallback a Google Drive
- Il sistema è progettato per essere resiliente ai fallimenti di connessione

## 🔐 Sicurezza

- ✅ CORS abilitato per accessi cross-origin
- ✅ File CSV salvato in directory pubblica
- ✅ Validazione dei dati prima della esportazione
- ✅ Permessi directory impostati correttamente

---

**Versione**: 1.0  
**Ultima modifica**: 2026-07-22  
**Autore**: UndercutF1 Integration System
