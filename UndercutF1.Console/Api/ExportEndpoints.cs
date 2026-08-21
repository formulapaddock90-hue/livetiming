using System.Text;
using UndercutF1.Data;

namespace UndercutF1.Console.Api;

public static class ExportEndpoints
{
    public static WebApplication MapExportEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/export/standings/json",
                (
                    DriverListProcessor driverListProcessor,
                    TimingDataProcessor timingDataProcessor,
                    SessionInfoProcessor sessionInfoProcessor
                ) =>
                {
                    var latestTiming = timingDataProcessor.Latest;
                    var latestSession = sessionInfoProcessor.Latest;
                    var drivers = latestTiming
                        .GetOrderedLines()
                        .Select(driver =>
                        {
                            var driverNumber = driver.Key;
                            var timing = driver.Value;
                            var driverInfo = driverListProcessor.Latest.GetValueOrDefault(driverNumber);
                            var position = timing.Position ?? "?";

                            return new StandingsDriverResponse(
                                Position: position,
                                RacingNumber: driverInfo?.RacingNumber ?? driverNumber,
                                Tla: driverInfo?.Tla ?? driverNumber,
                                FullName: driverInfo?.BroadcastName ?? "-",
                                Team: driverInfo?.TeamName ?? "-",
                                BestLap: timing.BestLapTime?.Value ?? "-",
                                LastLap: timing.LastLapTime?.Value ?? "-",
                                NumberOfLaps: timing.NumberOfLaps ?? 0,
                                Gap: position == "1" ? "Leader" : (timing.GapToLeader ?? "-"),
                                TeamColour: driverInfo?.TeamColour ?? "000000"
                            );
                        })
                        .ToList();

                    return TypedResults.Ok(
                        new StandingsExportResponse(
                            Session: latestSession.Name ?? "-",
                            Drivers: drivers,
                            Timestamp: DateTime.UtcNow,
                            TotalDrivers: drivers.Count
                        )
                    );
                }
            )
            .WithTags("Export")
            .WithName("ExportStandingsJSON");

        app.MapGet(
                "/export/social/standings",
                (
                    DriverListProcessor driverListProcessor,
                    TimingDataProcessor timingDataProcessor,
                    SessionInfoProcessor sessionInfoProcessor
                ) =>
                {
                    var latestTiming = timingDataProcessor.Latest;
                    var latestSession = sessionInfoProcessor.Latest;
                    var topDrivers = latestTiming
                        .GetOrderedLines()
                        .Take(5)
                        .Select((driver, index) =>
                        {
                            var driverNumber = driver.Key;
                            var timing = driver.Value;
                            var driverInfo = driverListProcessor.Latest.GetValueOrDefault(driverNumber);
                            var tla = driverInfo?.Tla ?? driverNumber;
                            var bestLap = timing.BestLapTime?.Value ?? "-";

                            var medals = new[] { "🥇", "🥈", "🥉", "4️⃣", "5️⃣" };
                            var medal = index < medals.Length ? medals[index] : $"{index + 1}°";

                            return $"{medal} {tla} - {bestLap}";
                        })
                        .ToList();

                    var socialText = string.Join("\n", topDrivers);
                    var timestamp = DateTime.Now.ToString("HH:mm");

                    var message = $@"🏁 Classifica Live - {latestSession.Name}
⏰ {timestamp}

{socialText}

#F1 #LiveTiming #UndercutF1";

                    return TypedResults.Ok(
                        new SocialExportResponse(
                            Platform: "all",
                            Message: message,
                            Timestamp: DateTime.UtcNow,
                            Hashtags: new[] { "#F1", "#LiveTiming", "#UndercutF1" }
                        )
                    );
                }
            )
            .WithTags("Export")
            .WithName("ExportSocialStandings");

        app.MapPost(
                "/export/classifica/formulapaddock",
                async Task<IResult> (
                    DriverListProcessor driverListProcessor,
                    TimingDataProcessor timingDataProcessor,
                    SessionInfoProcessor sessionInfoProcessor,
                    IConfiguration config
                ) =>
                {
                    try
                    {
                        var latestTiming = timingDataProcessor.Latest;
                        var latestSession = sessionInfoProcessor.Latest;
                        var driverLines = latestTiming.GetOrderedLines();

                        if (driverLines.Count == 0)
                        {
                            return Results.Content("{\"success\":false,\"error\":\"Nessun dato timing disponibile\"}", "application/json");
                        }

                        var driverList = driverLines.Select(d =>
                        {
                            var num = d.Key;
                            var timing = d.Value;
                            var info = driverListProcessor.Latest.GetValueOrDefault(num);
                            var pos = timing.Position ?? "?";
                            return new StandingsDriverResponse(
                                Position: pos,
                                RacingNumber: info?.RacingNumber ?? num,
                                Tla: info?.Tla ?? num,
                                FullName: info?.BroadcastName ?? "-",
                                Team: info?.TeamName ?? "-",
                                BestLap: timing.BestLapTime?.Value ?? "-",
                                LastLap: timing.LastLapTime?.Value ?? "-",
                                NumberOfLaps: timing.NumberOfLaps ?? 0,
                                Gap: pos == "1" ? "Leader" : (timing.GapToLeader ?? "-"),
                                TeamColour: info?.TeamColour ?? "000000"
                            );
                        }).ToList();

                        var webhookUrl = config["Webhook:Url"];
                        return string.IsNullOrEmpty(webhookUrl)
                            ? Results.Content("{\"success\":false,\"error\":\"Webhook:Url non configurato in appsettings.json\"}", "application/json")
                            : await SendJsonToWebhook(
                                webhookUrl,
                                latestSession.Name ?? "Sessione",
                                driverList
                            );
                    }
                    catch (Exception ex)
                    {
                        var errorMsg = ex.Message.Replace("\"", "\\\"").Replace("\n", "\\n");
                        return Results.Content(
                            $@"{{""success"":false,""error"":""{errorMsg}""}}",
                            "application/json"
                        );
                    }
                }
            )
            .WithTags("Export")
            .WithName("ExportClassificaFormulaPaddock");

        return app;
    }

    private static async Task<IResult> SendJsonToWebhook(
        string webhookUrl,
        string sessionName,
        List<StandingsDriverResponse> drivers)
    {
        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

        // Serializza usando il context AOT-safe del progetto
        var driversJson = System.Text.Json.JsonSerializer.Serialize(
            drivers,
            ConsoleSerializerContext.Default.ListStandingsDriverResponse
        );
        var json = $@"{{""sessionName"":""{sessionName.Replace("\"", "\\\"")}"",""drivers"":{driversJson},""count"":{drivers.Count},""timestamp"":""{DateTime.UtcNow:o}""}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(webhookUrl, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Webhook HTTP {(int)response.StatusCode}: {body}");
        }

        string? url = null;
        try
        {
            var parsed = System.Text.Json.JsonDocument.Parse(body);
            parsed.RootElement.TryGetProperty("url", out var urlEl);
            url = urlEl.GetString();
        }
        catch { /* risposta non JSON, ignora */ }

        var urlJson = url != null ? $",\"url\":\"{url}\"" : string.Empty;
        return Results.Content(
            $@"{{""success"":true,""count"":{drivers.Count}{urlJson}}}",
            "application/json"
        );
    }
}

public record StandingsDriverResponse(
    string Position,
    string RacingNumber,
    string Tla,
    string FullName,
    string Team,
    string BestLap,
    string LastLap,
    int NumberOfLaps,
    string Gap,
    string TeamColour
);

public record StandingsExportResponse(
    string Session,
    List<StandingsDriverResponse> Drivers,
    DateTime Timestamp,
    int TotalDrivers
);

public record SocialExportResponse(
    string Platform,
    string Message,
    DateTime Timestamp,
    string[] Hashtags
);
