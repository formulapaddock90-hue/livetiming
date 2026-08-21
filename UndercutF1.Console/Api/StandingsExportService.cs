using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UndercutF1.Data;

namespace UndercutF1.Console.Api;

public class StandingsExportService : IHostedService
{
    private readonly DriverListProcessor _driverListProcessor;
    private readonly TimingDataProcessor _timingDataProcessor;
    private readonly SessionInfoProcessor _sessionInfoProcessor;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StandingsExportService> _logger;
    private readonly HttpClient _httpClient;
    private Timer? _timer;
    private readonly string _folder = @"C:\xampp\htdocs\seo\data";
    private readonly string _fileName = "session-results.txt";

    public StandingsExportService(
        DriverListProcessor driverListProcessor,
        TimingDataProcessor timingDataProcessor,
        SessionInfoProcessor sessionInfoProcessor,
        IConfiguration configuration,
        ILogger<StandingsExportService> logger
    )
    {
        _driverListProcessor = driverListProcessor;
        _timingDataProcessor = timingDataProcessor;
        _sessionInfoProcessor = sessionInfoProcessor;
        _configuration = configuration;
        _logger = logger;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger.LogInformation("✅ StandingsExportService constructor called");
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var filePath = Path.Combine(_folder, _fileName);
        _logger.LogInformation("⭐ STARTING StandingsExportService - will update every minute to {FilePath}", filePath);

        try
        {
            Directory.CreateDirectory(_folder);
        }
        catch
        {
            // Ignore directory creation errors if path does not exist locally
        }

        _timer = new Timer(
            _ => UpdateStandings(),
            null,
            TimeSpan.Zero,
            TimeSpan.FromSeconds(15) // Update every 15 seconds during live sessions
        );

        _logger.LogInformation("⭐ Timer configured: updates every 15 seconds");

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Dispose();
        _httpClient.Dispose();
        return Task.CompletedTask;
    }

    private void UpdateStandings()
    {
        try
        {
            var now = DateTime.Now.ToString("HH:mm:ss");
            var latestTiming = _timingDataProcessor.Latest;
            var latestSession = _sessionInfoProcessor.Latest;
            var sessionName = latestSession?.Name ?? "Live Timing";

            if (latestTiming?.Lines == null || latestTiming.Lines.Count == 0)
            {
                return;
            }

            var driverList = new List<object>();
            var csv = new StringBuilder();
            csv.AppendLine("Classifica Live F1");
            csv.AppendLine($"Sessione: {sessionName}");
            csv.AppendLine($"Aggiornato: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");
            csv.AppendLine();
            csv.AppendLine("Posizione,Numero Gara,Pilota,Team,Best Lap,Ultimo Giro,Giri,Gap");

            var drivers = latestTiming.GetOrderedLines();
            foreach (var driver in drivers)
            {
                var driverNumber = driver.Key;
                var timing = driver.Value;
                var driverInfo = _driverListProcessor.Latest.GetValueOrDefault(driverNumber);
                var position = timing.Position ?? "?";
                var racingNumber = driverInfo?.RacingNumber ?? driverNumber;
                var tla = driverInfo?.Tla ?? driverNumber;
                var team = driverInfo?.TeamName ?? "-";
                var bestLap = timing.BestLapTime?.Value ?? "-";
                var lastLap = timing.LastLapTime?.Value ?? "-";
                var numberOfLaps = timing.NumberOfLaps ?? 0;
                var gap = position == "1" ? "Leader" : (timing.GapToLeader ?? "-");

                csv.AppendLine($"{position},{racingNumber},{tla},{team},{bestLap},{lastLap},{numberOfLaps},{gap}");

                driverList.Add(new
                {
                    position = position,
                    carNumber = racingNumber,
                    driverName = tla,
                    teamName = team,
                    bestLap = bestLap,
                    lastLap = lastLap,
                    laps = numberOfLaps,
                    gap = gap
                });
            }

            // Save local file
            try
            {
                var filePath = Path.Combine(_folder, _fileName);
                File.WriteAllText(filePath, csv.ToString(), Encoding.UTF8);
            }
            catch
            {
                // Local write error ignored
            }

            // Send HTTP Webhook to WordPress / Web Server
            _ = SendWebhookAsync(sessionName, driverList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating standings");
        }
    }

    private async Task SendWebhookAsync(string sessionName, List<object> driverList)
    {
        var webhookUrl = _configuration["Webhook:Url"] ?? "https://www.formulapaddock.it/wp-json/undercutf1/v1/update-standings";
        var apiKey = _configuration["Webhook:ApiKey"] ?? "";

        var payload = new
        {
            sessionName = sessionName,
            drivers = driverList,
            timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, webhookUrl);
            if (!string.IsNullOrEmpty(apiKey))
            {
                request.Headers.Add("X-API-Key", apiKey);
            }

            request.Content = JsonContent.Create(payload);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("🚀 Webhook successfully sent to WordPress ({Count} drivers)", driverList.Count);
            }
            else
            {
                // Fallback to legacy POST endpoint if WP JSON REST is not yet active
                await SendFallbackLegacyWebhookAsync(payload);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Webhook send failed: {Message}. Trying legacy endpoint...", ex.Message);
            await SendFallbackLegacyWebhookAsync(payload);
        }
    }

    private async Task SendFallbackLegacyWebhookAsync(object payload)
    {
        try
        {
            var fallbackUrl = "https://www.formulapaddock.it/api-classifica.php";
            using var request = new HttpRequestMessage(HttpMethod.Post, fallbackUrl);
            request.Content = JsonContent.Create(payload);
            await _httpClient.SendAsync(request);
        }
        catch
        {
            // Ignore secondary fallback errors
        }
    }
}

