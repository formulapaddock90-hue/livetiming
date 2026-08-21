#pragma warning disable IDE0046, IDE0270
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace UndercutF1.Data;

/// <summary>
/// Helper class to export session data to various formats.
/// </summary>
public class SessionExporter(ILogger<SessionExporter> logger)
{
    public async Task ExportFinalStandingsToTxtAsync(
        string sessionDirectory,
        string? outputFilePath = null
    )
    {
        try
        {
            var liveJsonlPath = Path.Join(sessionDirectory, "live.jsonl");
            var subscribeJsonPath = Path.Join(sessionDirectory, "subscribe.json");

            if (!File.Exists(liveJsonlPath))
                throw new FileNotFoundException($"live.jsonl not found at {liveJsonlPath}");

            if (!File.Exists(subscribeJsonPath))
                throw new FileNotFoundException(
                    $"subscribe.json not found at {subscribeJsonPath}"
                );

            // Read session info
            var subscribeData = await File.ReadAllTextAsync(subscribeJsonPath);
            var sessionInfo = JsonNode
                .Parse(subscribeData)?["SessionInfo"]
                ?.Deserialize(TimingDataSerializerContext.Raw.SessionInfoDataPoint);

            if (sessionInfo == null)
                throw new InvalidOperationException("Could not parse session info");

            // Read live.jsonl and extract latest TimingDataPoint
            var lines = await File.ReadAllLinesAsync(liveJsonlPath);
            TimingDataPoint? finalTimingData = null;
            DriverListDataPoint? driverList = null;

            foreach (var line in lines)
            {
                try
                {
                    var rawPoint = JsonSerializer.Deserialize(
                        line,
                        TimingDataSerializerContext.Default.RawTimingDataPoint
                    );

                    if (rawPoint.Type == "TimingData")
                    {
                        finalTimingData = rawPoint
                            .Json.Deserialize(TimingDataSerializerContext.Raw.TimingDataPoint);
                    }
                    else if (rawPoint.Type == "DriverList")
                    {
                        driverList = rawPoint
                            .Json.Deserialize(
                                TimingDataSerializerContext.Raw.DriverListDataPoint
                            );
                    }
                }
                catch (Exception ex)
                {
                    logger.LogDebug(ex, "Failed to deserialize line: {Line}", line);
                }
            }

            if (finalTimingData == null)
                throw new InvalidOperationException("No timing data found in session");

            // Generate output filename if not provided
            outputFilePath ??= Path.Join(
                sessionDirectory,
                $"final_standings_{DateTime.Now:yyyy-MM-dd_HH-mm-ss}.txt"
            );

            // Build standings text
            var sb = new StringBuilder();
            sb.AppendLine("=".PadRight(80, '='));
            sb.AppendLine($"F1 FINAL STANDINGS - {sessionInfo.Name}");
            sb.AppendLine(
                $"Location: {sessionInfo.Meeting?.Circuit?.ShortName ?? "Unknown"} - Date: {sessionInfo.StartDate:yyyy-MM-dd}"
            );
            sb.AppendLine("=".PadRight(80, '='));
            sb.AppendLine();

            sb.AppendLine(
                $"{"Pos",-4} {"Driver",-20} {"Team",-20} {"Laps",-6} {"Gap/Interval",-15} {"Status"}"
            );
            sb.AppendLine("-".PadRight(80, '-'));

            var driversByPosition = finalTimingData.Lines.Values.OrderBy(d =>
                {
                    if (int.TryParse(d.Position, out var pos))
                        return pos;
                    return int.MaxValue;
                })
                .ToList();

            foreach (var driver in driversByPosition)
            {
                var racingNumber = driver.Line?.ToString() ?? "?";
                var driverName = driverList?.TryGetValue(racingNumber, out var driverInfo) ?? false
                    ? driverInfo?.FullName ?? "Unknown"
                    : "Unknown";

                var teamName = driverList?.TryGetValue(racingNumber, out var teamInfo) ?? false
                    ? teamInfo?.TeamName ?? "Unknown"
                    : "Unknown";

                var position = driver.Position ?? "-";
                var laps = driver.NumberOfLaps?.ToString() ?? "-";
                var gap = driver.GapToLeader ?? "-";
                var status = GetDriverStatus(driver);

                sb.AppendLine(
                    $"{position,-4} {driverName,-20} {teamName,-20} {laps,-6} {gap,-15} {status}"
                );
            }

            sb.AppendLine();
            sb.AppendLine("=".PadRight(80, '='));

            // Write to file
            await File.WriteAllTextAsync(outputFilePath, sb.ToString());
            logger.LogInformation("Final standings exported to {OutputPath}", outputFilePath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to export final standings");
            throw;
        }
    }

    private static string GetDriverStatus(TimingDataPoint.Driver driver)
    {
        if (driver.Retired == true)
            return "RETIRED";
        if (driver.Stopped == true)
            return "STOPPED";
        if (driver.KnockedOut == true)
            return "KNOCKED OUT";
        if (driver.Status.HasValue)
            return driver.Status.Value.ToString();
        return "FINISHED";
    }
}

/// <summary>
/// Static helper methods for session export operations.
/// </summary>
public static class SessionExporterExtensions
{
    /// <summary>
    /// Exports final standings from a session directory to a TXT file.
    /// Uses Console.Error for logging if no ILogger is available.
    /// </summary>
    /// <param name="sessionDirectory">Path to the session directory containing live.jsonl and subscribe.json</param>
    /// <param name="outputFilePath">Optional output file path. If not provided, defaults to final_standings_{timestamp}.txt in the session directory</param>
    public static async Task ExportFinalStandingsToTxtAsync(
        string sessionDirectory,
        string? outputFilePath = null
    )
    {
        try
        {
            var liveJsonlPath = Path.Join(sessionDirectory, "live.jsonl");
            var subscribeJsonPath = Path.Join(sessionDirectory, "subscribe.json");

            if (!File.Exists(liveJsonlPath))
                throw new FileNotFoundException($"live.jsonl not found at {liveJsonlPath}");

            if (!File.Exists(subscribeJsonPath))
                throw new FileNotFoundException(
                    $"subscribe.json not found at {subscribeJsonPath}"
                );

            // Read session info
            var subscribeData = await File.ReadAllTextAsync(subscribeJsonPath);
            var sessionInfo = JsonNode
                .Parse(subscribeData)?["SessionInfo"]
                ?.Deserialize(TimingDataSerializerContext.Raw.SessionInfoDataPoint);

            if (sessionInfo == null)
                throw new InvalidOperationException("Could not parse session info");

            // Read live.jsonl and extract latest TimingDataPoint
            var lines = await File.ReadAllLinesAsync(liveJsonlPath);
            TimingDataPoint? finalTimingData = null;
            DriverListDataPoint? driverList = null;

            foreach (var line in lines)
            {
                try
                {
                    var rawPoint = JsonSerializer.Deserialize(
                        line,
                        TimingDataSerializerContext.Default.RawTimingDataPoint
                    );

                    if (rawPoint.Type == "TimingData")
                    {
                        finalTimingData = rawPoint
                            .Json.Deserialize(TimingDataSerializerContext.Raw.TimingDataPoint);
                    }
                    else if (rawPoint.Type == "DriverList")
                    {
                        driverList = rawPoint
                            .Json.Deserialize(
                                TimingDataSerializerContext.Raw.DriverListDataPoint
                            );
                    }
                }
                catch
                {
                    // Silently skip malformed lines
                }
            }

            if (finalTimingData == null)
                throw new InvalidOperationException("No timing data found in session");

            // Generate output filename if not provided
            outputFilePath ??= Path.Join(
                sessionDirectory,
                $"final_standings_{DateTime.Now:yyyy-MM-dd_HH-mm-ss}.txt"
            );

            // Build standings text
            var sb = new StringBuilder();
            sb.AppendLine("=".PadRight(80, '='));
            sb.AppendLine($"F1 FINAL STANDINGS - {sessionInfo.Name}");
            sb.AppendLine(
                $"Location: {sessionInfo.Meeting?.Circuit?.ShortName ?? "Unknown"} - Date: {sessionInfo.StartDate:yyyy-MM-dd}"
            );
            sb.AppendLine("=".PadRight(80, '='));
            sb.AppendLine();

            sb.AppendLine(
                $"{"Pos",-4} {"Driver",-20} {"Team",-20} {"Laps",-6} {"Gap/Interval",-15} {"Status"}"
            );
            sb.AppendLine("-".PadRight(80, '-'));

            var driversByPosition = finalTimingData.Lines.Values.OrderBy(d =>
                {
                    if (int.TryParse(d.Position, out var pos))
                        return pos;
                    return int.MaxValue;
                })
                .ToList();

            foreach (var driver in driversByPosition)
            {
                var racingNumber = driver.Line?.ToString() ?? "?";
                var driverName = driverList?.TryGetValue(racingNumber, out var driverInfo) ?? false
                    ? driverInfo?.FullName ?? "Unknown"
                    : "Unknown";

                var teamName = driverList?.TryGetValue(racingNumber, out var teamInfo) ?? false
                    ? teamInfo?.TeamName ?? "Unknown"
                    : "Unknown";

                var position = driver.Position ?? "-";
                var laps = driver.NumberOfLaps?.ToString() ?? "-";
                var gap = driver.GapToLeader ?? "-";
                var status = GetDriverStatus(driver);

                sb.AppendLine(
                    $"{position,-4} {driverName,-20} {teamName,-20} {laps,-6} {gap,-15} {status}"
                );
            }

            sb.AppendLine();
            sb.AppendLine("=".PadRight(80, '='));

            // Write to file
            await File.WriteAllTextAsync(outputFilePath, sb.ToString());
            Console.Error.WriteLine($"✓ Final standings exported to: {outputFilePath}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"✗ Failed to export final standings: {ex.Message}");
            throw;
        }
    }

    private static string GetDriverStatus(TimingDataPoint.Driver driver)
    {
        if (driver.Retired == true)
            return "RETIRED";
        if (driver.Stopped == true)
            return "STOPPED";
        if (driver.KnockedOut == true)
            return "KNOCKED OUT";
        if (driver.Status.HasValue)
            return driver.Status.Value.ToString();
        return "FINISHED";
    }
}
