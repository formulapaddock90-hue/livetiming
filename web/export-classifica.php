<?php
// Esporta la classifica da UndercutF1 in CSV pubblico per FormulaPaddock

// Impostazioni CORS dinamiche per formulapaddock.it e ambiente locale
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
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Includi connessione DB se presente
if (file_exists(__DIR__ . '/conn.php')) {
    @require_once 'conn.php';
}

// Configurazione directory e file di esportazione
$exportDir = __DIR__ . '/public/classifica';
$exportFile = $exportDir . '/finale-' . date('Y-m-d') . '.csv';
$latestFile = $exportDir . '/finale.csv';
$publicUrl  = 'https://www.formulapaddock.it/undercut-f1/public/classifica/finale.csv';

function exportClassifica() {
    global $hostname, $username, $dbname, $password, $exportDir, $exportFile, $latestFile, $publicUrl;

    try {
        // 1. Creazione sicura directory pubblica
        if (!is_dir($exportDir)) {
            if (!mkdir($exportDir, 0755, true)) {
                throw new Exception("Impossibile creare la directory pubblica: $exportDir");
            }
            @chmod($exportDir, 0755);
        }

        $classifica = [];

        // 2. Prova connessione al Database MySQL
        if (isset($hostname) && !empty($hostname)) {
            $conn = @new mysqli($hostname, $username, $password, $dbname);
            if (!$conn->connect_error) {
                $sql = "SELECT * FROM classifica ORDER BY CAST(posizione AS UNSIGNED) ASC, posizione ASC";
                $result = $conn->query($sql);

                if ($result && $result->num_rows > 0) {
                    while ($row = $result->fetch_assoc()) {
                        $classifica[] = $row;
                    }
                }
                $conn->close();
            }
        }

        // 3. Fallback: Prova file JSON locale (webhook/live-timing)
        if (empty($classifica)) {
            $jsonFiles = [
                __DIR__ . '/classifica-data.json',
                __DIR__ . '/storage/classifica/standings.json'
            ];

            foreach ($jsonFiles as $jf) {
                if (file_exists($jf)) {
                    $jsonContent = json_decode(file_get_contents($jf), true);
                    if ($jsonContent) {
                        if (isset($jsonContent['drivers']) && is_array($jsonContent['drivers'])) {
                            $classifica = $jsonContent['drivers'];
                        } elseif (is_array($jsonContent)) {
                            $classifica = $jsonContent;
                        }
                        break;
                    }
                }
            }
        }

        if (empty($classifica)) {
            throw new Exception("Nessun dato di classifica disponibile nel database o nei file locali JSON.");
        }

        // 4. Generazione File CSV
        $fp = fopen($exportFile, 'w');
        if (!$fp) {
            throw new Exception("Impossibile creare il file CSV: $exportFile");
        }

        // Intestazione CSV standard con delimitatore ';'
        $headers = ['Posizione', 'N. Gara', 'Pilota', 'Team', 'Best Lap', 'Ultimo Giro', 'Giri', 'Gap', 'Timestamp'];
        fputcsv($fp, $headers, ';');

        $now = date('Y-m-d H:i:s');
        foreach ($classifica as $idx => $row) {
            $pos    = $row['Posizione'] ?? $row['posizione'] ?? $row['position'] ?? ($idx + 1);
            $nGara  = $row['N. Gara'] ?? $row['n_gara'] ?? $row['number'] ?? $row['carNumber'] ?? '';
            $pilota = $row['Pilota'] ?? $row['pilota'] ?? $row['driver'] ?? $row['driverName'] ?? '';
            $team   = $row['Team'] ?? $row['team'] ?? $row['teamName'] ?? '';
            $best   = $row['Best Lap'] ?? $row['best_lap'] ?? $row['bestLap'] ?? '';
            $last   = $row['Ultimo Giro'] ?? $row['ultimo_giro'] ?? $row['lastLap'] ?? '';
            $giri   = $row['Giri'] ?? $row['giri'] ?? $row['laps'] ?? '';
            $gap    = $row['Gap'] ?? $row['gap'] ?? '';
            $ts     = $row['Timestamp'] ?? $row['timestamp'] ?? $now;

            fputcsv($fp, [$pos, $nGara, $pilota, $team, $best, $last, $giri, $gap, $ts], ';');
        }

        fclose($fp);

        // Duplica come "latest" (finale.csv)
        if (!copy($exportFile, $latestFile)) {
            throw new Exception("Impossibile aggiornare il file principale finale.csv");
        }

        @chmod($exportFile, 0644);
        @chmod($latestFile, 0644);

        return [
            'success'   => true,
            'message'   => 'Classifica esportata con successo in formato CSV',
            'file'      => basename($exportFile),
            'latest'    => basename($latestFile),
            'rows'      => count($classifica),
            'csv_url'   => $publicUrl,
            'timestamp' => $now
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error'   => $e->getMessage()
        ];
    }
}

// Esecuzione esportazione
$result = exportClassifica();
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

