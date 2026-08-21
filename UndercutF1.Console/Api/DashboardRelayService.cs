using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace UndercutF1.Console.Api;

public sealed class DashboardRelayService : IHostedService, IDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DashboardRelayService> _logger;
    private readonly HttpClient _httpClient;
    private Timer? _timer;
    private int _running;

    public DashboardRelayService(
        IConfiguration configuration,
        ILogger<DashboardRelayService> logger
    )
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var relayUrl = _configuration["DashboardRelay:Url"];
        if (string.IsNullOrWhiteSpace(relayUrl))
        {
            _logger.LogInformation("Dashboard relay disabled: DashboardRelay:Url is not configured");
            return Task.CompletedTask;
        }

        var seconds = int.TryParse(_configuration["DashboardRelay:IntervalSeconds"], out var parsed)
            ? Math.Clamp(parsed, 2, 60)
            : 5;

        _logger.LogInformation("Dashboard relay enabled: {Url}, every {Seconds}s", relayUrl, seconds);
        _timer = new Timer(
            _ => _ = RelayAsync(),
            null,
            TimeSpan.FromSeconds(2),
            TimeSpan.FromSeconds(seconds)
        );

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, Timeout.Infinite);
        return Task.CompletedTask;
    }

    private async Task RelayAsync()
    {
        if (Interlocked.Exchange(ref _running, 1) == 1)
        {
            return;
        }

        try
        {
            const string localSummaryUrl = "http://127.0.0.1:61937/data/dashboard/summary";
            using var localResponse = await _httpClient.GetAsync(localSummaryUrl);
            if (!localResponse.IsSuccessStatusCode)
            {
                return;
            }

            var json = await localResponse.Content.ReadAsStringAsync();
            if (string.IsNullOrWhiteSpace(json))
            {
                return;
            }

            var relayUrl = _configuration["DashboardRelay:Url"];
            if (string.IsNullOrWhiteSpace(relayUrl))
            {
                return;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, relayUrl);
            request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var token = _configuration["DashboardRelay:Token"];
            if (!string.IsNullOrWhiteSpace(token))
            {
                request.Headers.TryAddWithoutValidation("X-Live-Token", token);
            }

            request.Headers.UserAgent.Add(new ProductInfoHeaderValue("FormulaPaddock-LiveTiming", "1.0"));

            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Dashboard relay HTTP {StatusCode}", (int)response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Dashboard relay attempt failed");
        }
        finally
        {
            Interlocked.Exchange(ref _running, 0);
        }
    }

    public void Dispose()
    {
        _timer?.Dispose();
        _httpClient.Dispose();
    }
}
