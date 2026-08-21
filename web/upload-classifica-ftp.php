<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

require_once 'conn.php';

function uploadClassificaToFtp() {
    global $host_ftp, $user_ftp, $pw_ftp;

    try {
        // Leggi i dati della classifica
        $localExportFile = __DIR__ . '/public/classifica/finale.csv';
        $gdriveCsvUrl = 'https://drive.google.com/uc?export=download&id=1oCeZrGJMS_YwuNHZed-OEPHpElVtsOzn';

        $csvData = null;

        // Prova file locale
        if (file_exists($localExportFile)) {
            $csvData = @file_get_contents($localExportFile);
        }

        // Se non trovato, usa Google Drive come fallback
        if (!$csvData) {
            $ctx = stream_context_create(['http' => ['timeout' => 10]]);
            $csvData = @file_get_contents($gdriveCsvUrl, false, $ctx);
        }

        if (!$csvData) {
            throw new Exception("Impossibile leggere i dati della classifica");
        }

        // Genera file temporaneo
        $tmpFile = tempnam(sys_get_temp_dir(), 'classifica_');
        if (!file_put_contents($tmpFile, $csvData)) {
            throw new Exception("Impossibile creare file temporaneo");
        }

        // Connessione FTP
        $ftpConnection = ftp_connect($host_ftp);
        if (!$ftpConnection) {
            throw new Exception("Impossibile connettersi al server FTP");
        }

        if (!ftp_login($ftpConnection, $user_ftp, $pw_ftp)) {
            ftp_close($ftpConnection);
            throw new Exception("Autenticazione FTP fallita");
        }

        // Carica il file
        $remoteFile = '/standing/classifica.csv';
        if (!ftp_put($ftpConnection, $remoteFile, $tmpFile, FTP_BINARY)) {
            ftp_close($ftpConnection);
            throw new Exception("Impossibile caricare il file via FTP");
        }

        // Imposta i permessi 757
        if (!ftp_chmod($ftpConnection, 0755, $remoteFile)) {
            // chmod non sempre funziona, continua comunque
            error_log("Warning: Impossibile impostare permessi 755");
        }

        ftp_close($ftpConnection);
        unlink($tmpFile);

        return [
            'success' => true,
            'message' => 'Classifica caricata con successo su formulapaddock.it/standing/classifica.csv',
            'url' => 'https://www.formulapaddock.it/standing/classifica.csv',
            'timestamp' => date('Y-m-d H:i:s')
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo json_encode(uploadClassificaToFtp());
    exit;
}

// Se GET, mostri un messaggio
echo json_encode(['error' => 'Usa POST per caricare la classifica']);
?>
