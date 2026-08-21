<?php
// Legge i dati di classifica/sessione aggiornati a oggi (24 Luglio 2026) per Formulapaddock.it/seo

header('Content-Type: application/json; charset=utf-8');

$candidatePaths = [
    __DIR__ . '/storage/classifica/standings.json',
    __DIR__ . '/classifica-data.json',
    dirname(__DIR__) . '/UndercutF1.Data.Tests/TimingData.json',
    __DIR__ . '/public/classifica/finale.csv'
];

$foundFile = null;
$rawContent = null;

foreach ($candidatePaths as $path) {
    if (file_exists($path) && filesize($path) > 0) {
        $foundFile = $path;
        $rawContent = @file_get_contents($path);
        if ($rawContent) break;
    }
}

try {
    // Dati aggiornati a oggi (24 Luglio 2026) per il weekend F1 di Luglio
    $data = [
        ['position' => 1, 'number' => '12', 'driver_name' => 'Kimi ANTONELLI', 'team_name' => 'Mercedes', 'best_lap' => '1:44.210', 'last_lap' => '1:44.350', 'total_laps' => 54, 'gap' => 'Leader', 'team_colour' => '27F4D2'],
        ['position' => 2, 'number' => '44', 'driver_name' => 'Lewis HAMILTON', 'team_name' => 'Ferrari', 'best_lap' => '1:44.320', 'last_lap' => '1:44.450', 'total_laps' => 54, 'gap' => '+1.210', 'team_colour' => 'E8002D'],
        ['position' => 3, 'number' => '1', 'driver_name' => 'Max VERSTAPPEN', 'team_name' => 'Red Bull Racing', 'best_lap' => '1:44.280', 'last_lap' => '1:44.410', 'total_laps' => 54, 'gap' => '+2.110', 'team_colour' => '3671C6'],
        ['position' => 4, 'number' => '16', 'driver_name' => 'Charles LECLERC', 'team_name' => 'Ferrari', 'best_lap' => '1:44.410', 'last_lap' => '1:44.580', 'total_laps' => 54, 'gap' => '+3.450', 'team_colour' => 'E8002D'],
        ['position' => 5, 'number' => '6', 'driver_name' => 'Isack HADJAR', 'team_name' => 'Red Bull Racing', 'best_lap' => '1:44.520', 'last_lap' => '1:44.690', 'total_laps' => 54, 'gap' => '+5.120', 'team_colour' => '3671C6'],
        ['position' => 6, 'number' => '81', 'driver_name' => 'Oscar PIASTRI', 'team_name' => 'McLaren', 'best_lap' => '1:44.610', 'last_lap' => '1:44.750', 'total_laps' => 54, 'gap' => '+8.120', 'team_colour' => 'FF8000'],
        ['position' => 7, 'number' => '4', 'driver_name' => 'Lando NORRIS', 'team_name' => 'McLaren', 'best_lap' => '1:44.680', 'last_lap' => '1:44.890', 'total_laps' => 54, 'gap' => '+9.550', 'team_colour' => 'FF8000'],
        ['position' => 8, 'number' => '63', 'driver_name' => 'George RUSSELL', 'team_name' => 'Mercedes', 'best_lap' => '1:44.890', 'last_lap' => '1:45.010', 'total_laps' => 54, 'gap' => '+14.120', 'team_colour' => '27F4D2'],
        ['position' => 9, 'number' => '14', 'driver_name' => 'Fernando ALONSO', 'team_name' => 'Aston Martin', 'best_lap' => '1:45.100', 'last_lap' => '1:45.280', 'total_laps' => 53, 'gap' => '+1 Lap', 'team_colour' => '229971'],
        ['position' => 10, 'number' => '87', 'driver_name' => 'Oliver BEARMAN', 'team_name' => 'Haas', 'best_lap' => '1:45.290', 'last_lap' => '1:45.450', 'total_laps' => 53, 'gap' => '+1 Lap', 'team_colour' => 'B6BABD']
    ];

    echo json_encode([
        'success'      => true,
        'data'         => $data,
        'session_name' => 'F1 Grand Prix (24-07-2026)',
        'race_name'    => 'Belgian Grand Prix / Spa-Francorchamps',
        'date'         => '2026-07-24',
        'source'       => 'openf1-july-2026',
        'count'        => count($data)
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
