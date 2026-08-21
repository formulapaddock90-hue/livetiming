# UndercutF1 API Guide

## Chiave API (API Key)

La chiave API viene generata automaticamente al primo avvio dell'applicazione con `--with-api` abilitato.

### Dove trovare la chiave API

1. **Al primo avvio**: Apparirà nel log della console con il formato:
   ```
   API Key: uk_[stringa casuale]
   ```

2. **Dinamicamente**: Accedi a `GET /api/info` per visualizzare la chiave:
   ```bash
   curl http://localhost:61937/api/info
   ```

3. **Nel file di configurazione**: Salvata in:
   - **Windows**: `%APPDATA%\undercut-f1\config.json`
   - **Linux/Mac**: `~/.config/undercut-f1/config.json`

## Utilizzo dell'API Key

Tutte le richieste API (tranne il dashboard statico) richiedono la chiave API nell'header:

```bash
curl -H "X-API-Key: uk_tuaChiaveAPI" http://localhost:61937/export/standings/csv
```

## Endpoint Disponibili

### 1. Info API
**GET** `/api/info`

Restituisce informazioni sulla chiave API e gli endpoint disponibili.

```bash
curl http://localhost:61937/api/info
```

**Risposta:**
```json
{
  "version": "1.0.0",
  "apiKeyRequired": true,
  "apiKey": "uk_xxxxx",
  "endpoints": {
    "exportStandingsCSV": "/export/standings/csv",
    "exportStandingsJSON": "/export/standings/json",
    "exportSocialStandings": "/export/social/standings"
  }
}
```

---

### 2. Esporta Classifica (CSV)
**GET** `/export/standings/csv`

Esporta la classifica attuale in formato CSV.

```bash
curl -H "X-API-Key: uk_tuaChiaveAPI" http://localhost:61937/export/standings/csv
```

**Risposta:**
```json
{
  "format": "csv",
  "data": "Posizione,Numero Gara,Pilota,Team,Best Lap,Ultimo Giro,Giri,Gap\n1,1,VER,Red Bull Racing,1:23.456,1:24.123,12,Leader\n...",
  "timestamp": "2026-07-17T15:30:00Z",
  "driverCount": 20
}
```

---

### 3. Esporta Classifica (JSON)
**GET** `/export/standings/json`

Esporta la classifica attuale in formato JSON strutturato.

```bash
curl -H "X-API-Key: uk_tuaChiaveAPI" http://localhost:61937/export/standings/json
```

**Risposta:**
```json
{
  "session": "Qualifying",
  "drivers": [
    {
      "position": "1",
      "racingNumber": "1",
      "tla": "VER",
      "fullName": "Max Verstappen",
      "team": "Red Bull Racing",
      "bestLap": "1:23.456",
      "lastLap": "1:24.123",
      "numberOfLaps": 12,
      "gap": "Leader",
      "teamColour": "3671c6"
    },
    ...
  ],
  "timestamp": "2026-07-17T15:30:00Z",
  "totalDrivers": 20
}
```

---

### 4. Esporta per Social Media
**GET** `/export/social/standings`

Genera un messaggio formattato pronto per i social media.

```bash
curl -H "X-API-Key: uk_tuaChiaveAPI" http://localhost:61937/export/social/standings
```

**Risposta:**
```json
{
  "platform": "all",
  "message": "🏁 Classifica Live - Qualifying\n⏰ 15:30\n\n🥇 VER - 1:23.456\n🥈 LEC - 1:23.789\n🥉 SAI - 1:24.123\n4️⃣ RUS - 1:24.456\n5️⃣ HAM - 1:24.789\n\n#F1 #LiveTiming #UndercutF1",
  "timestamp": "2026-07-17T15:30:00Z",
  "hashtags": ["#F1", "#LiveTiming", "#UndercutF1"]
}
```

---

## Utilizzo nel Dashboard

### Esportare Classifica (CSV)
Clicca il pulsante **📥** nella sezione "Classifica live" per scaricare la classifica in CSV.

### Esportare per Social
Clicca il pulsante **📱** nella sezione "Classifica live" per copiare il messaggio nei social negli appunti.

---

## Esempi di Utilizzo

### Python
```python
import requests
import json

api_key = "uk_tuaChiaveAPI"
headers = {"X-API-Key": api_key}

# Esportare classifica JSON
response = requests.get(
    "http://localhost:61937/export/standings/json",
    headers=headers
)
standings = response.json()

for driver in standings["drivers"][:5]:
    print(f"{driver['position']}. {driver['tla']} - {driver['bestLap']}")
```

### JavaScript/Node.js
```javascript
const apiKey = "uk_tuaChiaveAPI";
const response = await fetch("http://localhost:61937/export/standings/json", {
  headers: { "X-API-Key": apiKey }
});
const standings = await response.json();
console.log(standings);
```

### cURL
```bash
# Esportare classifica CSV
curl -H "X-API-Key: uk_tuaChiaveAPI" \
  http://localhost:61937/export/standings/csv > classifica.csv

# Esportare per social
curl -H "X-API-Key: uk_tuaChiaveAPI" \
  http://localhost:61937/export/social/standings | jq .message
```

---

## Sicurezza

- **Mantieni la chiave API al sicuro**: Non condividerla pubblicamente
- **Ruota la chiave regolarmente**: Modifica il valore nel file `config.json`
- **Usa HTTPS in produzione**: Se esponi l'API su internet, usa un certificato SSL

---

## Troubleshooting

### Errore 401 Unauthorized
```
Errore: Missing API key
```
**Soluzione**: Aggiungi l'header `X-API-Key` alla richiesta

### Errore 403 Forbidden
```
Errore: Invalid API key
```
**Soluzione**: Verifica che la chiave API sia corretta nel file di configurazione

### Nessun dato disponibile
Assicurati che:
- L'app sia in esecuzione con `--with-api`
- La sessione F1 sia caricata
- Ci siano dati live disponibili

---

## Riferimenti

- **Porta API**: `61937` (0xF1F1)
- **Dashboard**: http://localhost:61937
- **OpenAPI/Swagger**: http://localhost:61937/swagger
- **Config File**: Vedi "Dove trovare la chiave API"
