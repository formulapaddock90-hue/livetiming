<?php
// API per servire i dati della classifica a FormulaPaddock o client UndercutF1

error_reporting(0);
ini_set('display_errors', '0');


// Configurazione CORS dinamica
$allowedOrigins = [
    'https://www.formulapaddock.it',
    'https://formulapaddock.it',
    'http://localhost',
    'http://127.0.0.1'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/classifica-data.json';
$standingsJsonFile = __DIR__ . '/storage/classifica/standings.json';
$localExportFile = __DIR__ . '/public/classifica/finale.csv';
$gdriveCsvUrl = 'https://drive.google.com/uc?export=download&id=1oCeZrGJMS_YwuNHZed-OEPHpElVtsOzn';

// Leggi CSV da Google Drive (fallback)
function readCsvFromGdrive($url) {
    $ctx = stream_context_create(['http' => ['timeout' => 10]]);
    $csv = @file_get_contents($url, false, $ctx);
    if (!$csv) {
        throw new Exception("Impossibile leggere il file da Google Drive");
    }
    return $csv;
}

// Parsing flessibile di righe CSV
function parseCsv($csvData) {
    $lines = explode("\n", $csvData);
    $classifica = [];
    $headers = [];

    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (empty($line)) continue;

        $delimiter = (strpos($line, ';') !== false) ? ';' : ',';

        if ($i === 0 || empty($headers)) {
            $headers = str_getcsv($line, $delimiter);
            // Pulisci eventuale BOM UTF-8
            if (!empty($headers[0])) {
                $headers[0] = preg_replace('/[\x00-\x1F\x7F\xEF\xBB\xBF]/', '', $headers[0]);
            }
            continue;
        }

        $values = str_getcsv($line, $delimiter);
        if (empty($values[0])) continue;

        $row = [];
        foreach ($headers as $idx => $header) {
            $hName = trim($header);
            $row[$hName] = trim($values[$idx] ?? '');
        }

        if (!empty($row)) {
            $classifica[] = $row;
        }
    }

    return $classifica;
}

// ── POST: Ricezione webhook da UndercutF1 (salva in JSON e aggiorna finale.csv) ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    if ($data && (isset($data['csvData']) || isset($data['drivers']))) {
        try {
            if (isset($data['csvData'])) {
                $classifica = parseCsv($data['csvData']);
            } else {
                $classifica = $data['drivers'];
            }

            if (!empty($classifica)) {
                file_put_contents($dataFile, json_encode($classifica, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                echo json_encode([
                    'success'   => true,
                    'message'   => 'Dati di classifica aggiornati via POST',
                    'count'     => count($classifica),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Dati POST non validi. Fornire "csvData" o "drivers".']);
    exit;
}

// ── GET: Lettura prioritaria a 3 livelli ──
try {
    $classifica = [];
    $source = 'none';

    // Priority 1: JSON salvato via webhook / live timing
    if (file_exists($dataFile)) {
        $parsed = json_decode(file_get_contents($dataFile), true);
        if (!empty($parsed)) {
            $classifica = $parsed;
            $source = 'local-json';
        }
    } elseif (file_exists($standingsJsonFile)) {
        $parsed = json_decode(file_get_contents($standingsJsonFile), true);
        if (!empty($parsed['drivers'])) {
            $classifica = $parsed['drivers'];
            $source = 'live-standings-json';
        }
    }

    // Priority 2: CSV locale esportato (/public/classifica/finale.csv)
    if (empty($classifica) && file_exists($localExportFile)) {
        $csvData = @file_get_contents($localExportFile);
        if ($csvData) {
            $classifica = parseCsv($csvData);
            $source = 'local-csv (/public/classifica/finale.csv)';
        }
    }

    // Priority 3: Fallback Google Drive
    if (empty($classifica)) {
        try {
            $csvData = @readCsvFromGdrive($gdriveCsvUrl);
            if ($csvData) {
                $classifica = parseCsv($csvData);
                $source = 'google-drive-fallback';
            }
        } catch (Throwable $gex) {
            // Ignore Google Drive network error
        }
    }

    if (empty($classifica)) {
        $source = 'default-fallback';
        $classifica = [
            ['position' => '1', 'carNumber' => '4', 'driverName' => 'NOR', 'teamName' => 'McLaren', 'bestLap' => '1:19.228', 'lastLap' => '1:23.625', 'laps' => 70, 'gap' => 'Leader'],
            ['position' => '2', 'carNumber' => '1', 'driverName' => 'VER', 'teamName' => 'Red Bull Racing', 'bestLap' => '1:19.585', 'lastLap' => '1:24.220', 'laps' => 70, 'gap' => '+0.357s'],
            ['position' => '3', 'carNumber' => '12', 'driverName' => 'ANT', 'teamName' => 'Mercedes', 'bestLap': '1:19.662', 'lastLap' => '1:23.472', 'laps' => 70, 'gap' => '+0.434s'],
            ['position' => '4', 'carNumber' => '16', 'driverName' => 'LEC', 'teamName' => 'Ferrari', 'bestLap' => '1:19.720', 'lastLap' => '1:23.098', 'laps' => 70, 'gap' => '+0.492s']
        ];
    }


    // Supporto download formato CSV
    if (isset($_GET['format']) && $_GET['format'] === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="classifica-' . date('Y-m-d-Hi') . '.csv"');

        $output = fopen('php://output', 'w');
        $headers = ['Posizione', 'N. Gara', 'Pilota', 'Team', 'Best Lap', 'Ultimo Giro', 'Giri', 'Gap', 'Timestamp'];
        fputcsv($output, $headers, ';');

        $now = date('Y-m-d H:i:s');
        foreach ($classifica as $idx => $row) {
            fputcsv($output, [
                $row['Posizione'] ?? $row['position'] ?? ($idx + 1),
                $row['N. Gara'] ?? $row['number'] ?? $row['carNumber'] ?? '',
                $row['Pilota'] ?? $row['driver'] ?? $row['driverName'] ?? '',
                $row['Team'] ?? $row['team'] ?? '',
                $row['Best Lap'] ?? $row['best_lap'] ?? '',
                $row['Ultimo Giro'] ?? $row['last_lap'] ?? '',
                $row['Giri'] ?? $row['laps'] ?? '',
                $row['Gap'] ?? $row['gap'] ?? '',
                $row['Timestamp'] ?? $row['timestamp'] ?? $now
            ], ';');
        }
        fclose($output);
        exit;
    }

    // Output JSON standard
    echo json_encode([
        'success'   => true,
        'data'      => $classifica,
        'count'     => count($classifica),
        'timestamp' => date('Y-m-d H:i:s'),
        'source'    => $source
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(200);
    echo json_encode([
        'success'   => false,
        'message'   => $e->getMessage(),
        'data'      => [],
        'count'     => 0,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>

