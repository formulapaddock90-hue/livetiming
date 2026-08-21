using System.Text.Json;
using System.Text.Json.Nodes;
using Spectre.Console;

namespace UndercutF1.Console;

/// <summary>
/// Esporta la classifica finale di una gara in formato CSV
/// per il sito web https://www.formulapaddock.it/seo/
/// </summary>
public static class ExportRaceResults
{
    public static async Task ExportClassificaAsync(
        DirectoryInfo sessionDirectory,
        DirectoryInfo outputDirectory,
        bool verbose = false
    )
    {
        try
        {
            var liveFilePath = Path.Combine(sessionDirectory.FullName, "live.jsonl");

            if (!File.Exists(liveFilePath))
            {
                AnsiConsole.Write(
                    new Text($"❌ File non trovato: {liveFilePath}", Color.Red)
                );
                return;
            }

            AnsiConsole.Write(
                new Text($"📖 Lettura file: {liveFilePath}", Color.Yellow)
            );

            // Leggi tutte le linee del file
            var lines = await File.ReadAllLinesAsync(liveFilePath);

            // Estrai i dati di timing (classifica)
            var timingDataLines = lines
                .Where(line => line.Contains("\"Type\":\"TimingData\""))
                .ToList();

            if (timingDataLines.Count == 0)
            {
                AnsiConsole.Write(
                    new Text("⚠️ Nessun dato TimingData trovato nel file", Color.Orange1)
                );
                return;
            }

            // Prendi l'ultimo messaggio di TimingData (classifica finale)
            var lastTimingData = timingDataLines.Last();
            var timingDataJson = JsonNode.Parse(lastTimingData[12..])!;

            if (verbose)
            {
                AnsiConsole.Write(new Text($"📊 Dati di timing estratti", Color.Cyan));
            }

            // Estrai i dati dei driver
            var drivers = new List<DriverResult>();

            if (timingDataJson["Drivers"] is JsonObject driversObj)
            {
                foreach (var (driverId, driverData) in driversObj)
                {
                    if (driverData is JsonObject driver)
                    {
                        var position = driver["Position"]?.AsValue().TryGetValue(out int pos) ?? false ? pos : 0;
                        var points = driver["Points"]?.AsValue().TryGetValue(out int pts) ?? false ? pts : 0;
                        var status = driver["Status"]?.AsValue().GetValue<string>() ?? "";
                        var abbreviation = driver["Abbreviation"]?.AsValue().GetValue<string>() ?? driverId;
                        var teamName = driver["TeamName"]?.AsValue().GetValue<string>() ?? "Unknown";
                        var lastName = driver["LastName"]?.AsValue().GetValue<string>() ?? "";
                        var firstName = driver["FirstName"]?.AsValue().GetValue<string>() ?? "";
                        var fullName = $"{firstName} {lastName}".Trim();

                        // Estrai best lap e gap
                        var bestLap = "";
                        var gap = "";
                        var lapCount = 0;

                        if (driver["BestLapTime"] is JsonObject bestLapTime)
                        {
                            var minutes = bestLapTime["Minutes"]?.AsValue().GetValue<int>() ?? 0;
                            var seconds = bestLapTime["Seconds"]?.AsValue().GetValue<int>() ?? 0;
                            var milliseconds =
                                bestLapTime["Milliseconds"]?.AsValue().GetValue<int>() ?? 0;
                            bestLap =
                                $"{minutes}:{seconds:D2}.{milliseconds / 10:D3}";
                        }

                        if (driver["GapToLeader"] is JsonObject gapData)
                        {
                            if (gapData["Seconds"]?.AsValue().TryGetValue(out double gapSeconds) ?? false)
                            {
                                gap = gapSeconds > 0 ? $"+{gapSeconds:F3}" : "0";
                            }
                        }

                        if (driver["LapCount"]?.AsValue().TryGetValue(out int laps) ?? false)
                        {
                            lapCount = laps;
                        }

                        // Solo aggiungi driver con position valida (finishers)
                        if (position > 0)
                        {
                            drivers.Add(new DriverResult
                            {
                                Position = position,
                                DriverName = fullName,
                                TeamName = teamName,
                                BestLap = bestLap,
                                Gap = gap,
                                LapCount = lapCount,
                                Points = points,
                                Status = status
                            });
                        }
                    }
                }
            }

            // Ordina per posizione
            drivers = drivers.OrderBy(d => d.Position).ToList();

            if (drivers.Count == 0)
            {
                AnsiConsole.Write(
                    new Text("⚠️ Nessun driver con posizione trovato", Color.Orange1)
                );
                return;
            }

            // Crea file CSV
            outputDirectory.Create();
            var csvPath = Path.Combine(outputDirectory.FullName, "classifica.csv");

            var csvLines = new List<string>
            {
                "Pos|Pilota|Team|Best Lap|Gap|Giri|Punti"
            };

            foreach (var driver in drivers)
            {
                var line = $"{driver.Position}|{driver.DriverName}|{driver.TeamName}|{driver.BestLap}|{driver.Gap}|{driver.LapCount}|{driver.Points}";
                csvLines.Add(line);
            }

            await File.WriteAllLinesAsync(csvPath, csvLines);

            AnsiConsole.Write(
                new Text($"✅ Classifica esportata: {csvPath}", Color.Green)
            );

            AnsiConsole.Write(
                new Text($"   {drivers.Count} piloti classificati", Color.Gray)
            );

            // Mostra preview
            if (verbose)
            {
                AnsiConsole.Write(new Text("\n📋 Preview classifica:", Color.Cyan));
                foreach (var driver in drivers.Take(5))
                {
                    AnsiConsole.Write(
                        new Text(
                            $"  {driver.Position}. {driver.DriverName} ({driver.TeamName}) - Pts: {driver.Points}",
                            Color.White
                        )
                    );
                }
            }
        }
        catch (Exception ex)
        {
            AnsiConsole.Write(new Text($"❌ Errore: {ex.Message}", Color.Red));
            if (verbose)
            {
                AnsiConsole.Write(new Text($"   Stack: {ex.StackTrace}", Color.DarkRed));
            }
        }
    }

    private class DriverResult
    {
        public int Position { get; set; }
        public string DriverName { get; set; } = "";
        public string TeamName { get; set; } = "";
        public string BestLap { get; set; } = "";
        public string Gap { get; set; } = "";
        public int LapCount { get; set; }
        public int Points { get; set; }
        public string Status { get; set; } = "";
    }
}
