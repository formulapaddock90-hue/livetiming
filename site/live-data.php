<?php
// Formula Paddock live dashboard relay endpoint.
// POST: stores the latest dashboard JSON received from UndercutF1.
// GET: returns the latest stored dashboard JSON.

$storage = __DIR__ . '/live-data.json';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Empty body']);
        exit;
    }

    json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit;
    }

    $tmp = $storage . '.tmp';
    if (file_put_contents($tmp, $raw, LOCK_EX) === false || !rename($tmp, $storage)) {
        @unlink($tmp);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Unable to store data']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!is_file($storage)) {
    echo json_encode([
        'updatedAtUtc' => gmdate('c'),
        'sessionRunning' => false,
        'clockPaused' => false,
        'drivers' => [],
        'compoundRankings' => [],
        'sectorRankings' => [],
        'raceControl' => [],
        'teamGroups' => []
    ]);
    exit;
}

readfile($storage);
