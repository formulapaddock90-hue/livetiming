<?php
/**
 * Endpoint per ricevere la classifica live da UndercutF1 in formato JSON.
 * POST { "sessionName": "...", "drivers": [...] }  → salva e risponde { "success": true }
 * GET                                              → restituisce l'ultima classifica salvata
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/storage/classifica/standings.json';

// Crea la directory se non esiste
if (!is_dir(dirname($dataFile))) {
    mkdir(dirname($dataFile), 0755, true);
}

// ── POST: riceve e salva la classifica ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    if (!$data || !isset($data['drivers']) || !is_array($data['drivers'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payload JSON non valido. Richiesto: { "sessionName": "...", "drivers": [...] }']);
        exit;
    }

    $payload = [
        'sessionName' => $data['sessionName'] ?? 'Sessione',
        'drivers'     => $data['drivers'],
        'count'       => count($data['drivers']),
        'timestamp'   => date('Y-m-d H:i:s'),
    ];

    if (file_put_contents($dataFile, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Impossibile salvare il file']);
        exit;
    }

    echo json_encode([
        'success'   => true,
        'message'   => 'Classifica salvata',
        'count'     => $payload['count'],
        'timestamp' => $payload['timestamp'],
    ]);
    exit;
}

// ── GET: restituisce l'ultima classifica salvata ────────────────────────────
if (!file_exists($dataFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Nessuna classifica disponibile']);
    exit;
}

$raw = file_get_contents($dataFile);
$payload = json_decode($raw, true);

if (!$payload) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'File JSON corrotto']);
    exit;
}

echo json_encode(array_merge(['success' => true], $payload));
