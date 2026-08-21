using System.Globalization;
using UndercutF1.Data;

namespace UndercutF1.Console.Api;

public static class DashboardEndpoints
{
    public static WebApplication MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/data/dashboard/summary",
                (
                    SessionInfoProcessor sessionInfoProcessor,
                    DriverListProcessor driverListProcessor,
                    TimingDataProcessor timingDataProcessor,
                    TimingAppDataProcessor timingAppDataProcessor,
                    WeatherProcessor weatherProcessor,
                    TrackStatusProcessor trackStatusProcessor,
                    RaceControlMessageProcessor raceControlMessageProcessor,
                    IDateTimeProvider dateTimeProvider
                ) =>
                {
                    try
                    {
                        var latestSession = sessionInfoProcessor.Latest;
                        var latestTiming = timingDataProcessor.Latest;
                        var latestTimingApp = timingAppDataProcessor.Latest;
                        var latestWeather = weatherProcessor.Latest;
                        var latestTrackStatus = trackStatusProcessor.Latest;

                        // Return empty dashboard if no timing data is available
                        if (latestSession == null || latestTiming == null || latestTimingApp == null || latestTiming.Lines.Count == 0 || latestTimingApp.Lines.Count == 0)
                    {
                        return TypedResults.Ok(
                            new DashboardSummaryResponse(
                                UpdatedAtUtc: DateTimeOffset.UtcNow,
                                SessionRunning: latestSession?.Name is not null,
                                ClockPaused: dateTimeProvider.IsPaused,
                                MeetingName: latestSession?.Meeting?.Name,
                                SessionName: latestSession?.Name,
                                SessionType: latestSession?.Type,
                                CircuitName: latestSession?.Meeting?.Circuit?.ShortName,
                                TrackStatus: latestTrackStatus?.Message,
                                TrackStatusCode: latestTrackStatus?.Status,
                                AirTemp: latestWeather?.AirTemp,
                                TrackTemp: latestWeather?.TrackTemp,
                                WindSpeed: latestWeather?.WindSpeed,
                                Humidity: latestWeather?.Humidity,
                                Drivers: [],
                                CompoundRankings: [],
                                SectorRankings: [],
                                RaceControl: [],
                                TeamGroups: []
                            )
                        );
                    }

                    var driverBestLapByCompound = latestTimingApp.Lines.ToDictionary(
                        line => line.Key,
                        line => line
                            .Value.Stints.Values
                            .Where(stint =>
                                !string.IsNullOrWhiteSpace(stint.Compound)
                                && !string.IsNullOrWhiteSpace(stint.LapTime)
                            )
                            .GroupBy(stint => stint.Compound!)
                            .Select(group =>
                            {
                                var fastest = group
                                    .Where(stint => stint.LapTime.TryParseTimeSpan(out _))
                                    .Select(stint =>
                                    {
                                        _ = stint.LapTime.TryParseTimeSpan(out var lapTime);
                                        return new { LapTimeText = stint.LapTime!, LapTimeSpan = lapTime };
                                    })
                                    .OrderBy(entry => entry.LapTimeSpan)
                                    .FirstOrDefault();

                                return fastest is null
                                    ? null
                                    : new DashboardCompoundBestLapResponse(
                                        group.Key,
                                        fastest.LapTimeText,
                                        fastest.LapTimeSpan.TotalMilliseconds
                                    );
                            })
                            .OfType<DashboardCompoundBestLapResponse>()
                            .ToList()
                    );

                    var driverBestSectors = latestTiming.Lines.ToDictionary(
                        line => line.Key,
                        line => GetBestSectorsForDriver(line.Key, line.Value, timingDataProcessor.DriversByLap)
                    );

                    var driverLapTimes = latestTiming.Lines.ToDictionary(
                        line => line.Key,
                        line => GetLapTimesForDriver(line.Key, timingDataProcessor.DriversByLap)
                    );

                    var driverStints = latestTiming.Lines.ToDictionary(
                        line => line.Key,
                        line =>
                            GetStintsForDriver(
                                latestTimingApp.Lines.GetValueOrDefault(line.Key)?.Stints
                                    ?? new Dictionary<string, TimingAppDataPoint.Driver.Stint>()
                            )
                    );

                    var drivers = latestTiming
                        .GetOrderedLines()
                        .Select(line =>
                        {
                            var driverNumber = line.Key;
                            var timing = line.Value;
                            var driverInfo = driverListProcessor.Latest.GetValueOrDefault(driverNumber);
                            var teamGroup = GetTeamGroup(driverInfo?.TeamName);
                            var bestLap = timing.BestLapTime.ToTimeSpan();
                            var lapTimes = driverLapTimes.GetValueOrDefault(driverNumber) ?? [];
                            var firstLap = lapTimes.FirstOrDefault();
                            var lastLap = lapTimes.LastOrDefault();
                            var improvedLastLap =
                                lapTimes.Count >= 2
                                && lapTimes[^1].LapTimeSeconds < lapTimes[^2].LapTimeSeconds;

                            return new DashboardDriverResponse(
                                DriverNumber: driverNumber,
                                RacingNumber: driverInfo?.RacingNumber ?? driverNumber,
                                Tla: driverInfo?.Tla ?? driverInfo?.BroadcastName ?? driverNumber,
                                FullName: driverInfo?.FullName,
                                TeamName: driverInfo?.TeamName,
                                TeamGroup: teamGroup,
                                TeamColour: driverInfo?.TeamColour,
                                Position: timing.Position,
                                GapToLeader: timing.GapToLeader,
                                IntervalToAhead: timing.IntervalToPositionAhead?.Value,
                                LastLap: timing.LastLapTime?.Value,
                                BestLap: timing.BestLapTime?.Value,
                                BestLapMilliseconds: bestLap?.TotalMilliseconds,
                                NumberOfLaps: timing.NumberOfLaps,
                                InPit: timing.InPit.GetValueOrDefault() || timing.PitOut.GetValueOrDefault(),
                                Retired: timing.Retired.GetValueOrDefault(),
                                Stopped: timing.Stopped.GetValueOrDefault(),
                                KnockedOut: timing.KnockedOut.GetValueOrDefault(),
                                ImprovedLastLap: improvedLastLap,
                                FirstLapTimeSeconds: firstLap?.LapTimeSeconds,
                                LatestLapTimeSeconds: lastLap?.LapTimeSeconds,
                                FirstToLatestDeltaSeconds:
                                    firstLap is null || lastLap is null
                                        ? null
                                        : lastLap.LapTimeSeconds - firstLap.LapTimeSeconds,
                                CompoundBestLaps: driverBestLapByCompound.GetValueOrDefault(driverNumber) ?? [],
                                SectorBestLaps: driverBestSectors.GetValueOrDefault(driverNumber) ?? [],
                                LapTimes: lapTimes,
                                Stints: driverStints.GetValueOrDefault(driverNumber) ?? []
                            );
                        })
                        .ToList();

                    var compoundRankings = drivers
                        .SelectMany(driver =>
                            driver.CompoundBestLaps.Select(compound => new
                            {
                                compound.Compound,
                                Driver = new DashboardCompoundRankingEntryResponse(
                                    DriverNumber: driver.DriverNumber,
                                    RacingNumber: driver.RacingNumber,
                                    Tla: driver.Tla,
                                    FullName: driver.FullName,
                                    TeamName: driver.TeamName,
                                    TeamColour: driver.TeamColour,
                                    LapTime: compound.LapTime,
                                    LapTimeMilliseconds: compound.LapTimeMilliseconds
                                ),
                            })
                        )
                        .GroupBy(entry => entry.Compound)
                        .OrderBy(group => CompoundOrder(group.Key))
                        .Select(group =>
                            new DashboardCompoundRankingResponse(
                                Compound: group.Key,
                                Entries: group
                                    .Select(entry => entry.Driver)
                                    .OrderBy(entry => entry.LapTimeMilliseconds)
                                    .ToList()
                            )
                        )
                        .ToList();

                    var sectorRankings = drivers
                        .SelectMany(driver =>
                            driver.SectorBestLaps.Select(sector => new
                            {
                                sector.Sector,
                                Driver = new DashboardSectorRankingEntryResponse(
                                    DriverNumber: driver.DriverNumber,
                                    RacingNumber: driver.RacingNumber,
                                    Tla: driver.Tla,
                                    FullName: driver.FullName,
                                    TeamName: driver.TeamName,
                                    TeamColour: driver.TeamColour,
                                    LapTime: sector.LapTime,
                                    LapTimeMilliseconds: sector.LapTimeMilliseconds
                                ),
                            })
                        )
                        .GroupBy(entry => entry.Sector)
                        .OrderBy(group => SectorOrder(group.Key))
                        .Select(group =>
                            new DashboardSectorRankingResponse(
                                Sector: group.Key,
                                Entries: group
                                    .Select(entry => entry.Driver)
                                    .OrderBy(entry => entry.LapTimeMilliseconds)
                                    .ToList()
                            )
                        )
                        .ToList();

                    var teamGroups = drivers
                        .GroupBy(driver => driver.TeamGroup)
                        .OrderBy(group => TeamGroupOrder(group.Key))
                        .Select(group =>
                        {
                            var teams = group
                                .Select(driver => driver.TeamName)
                                .Where(team => !string.IsNullOrWhiteSpace(team))
                                .Distinct(StringComparer.OrdinalIgnoreCase)
                                .OrderBy(team => team)
                                .ToList();

                            var bestLaps = group
                                .Where(driver => driver.BestLapMilliseconds.HasValue)
                                .Select(driver => driver.BestLapMilliseconds!.Value)
                                .ToList();

                            var latestLaps = group
                                .Where(driver => driver.LatestLapTimeSeconds.HasValue)
                                .Select(driver => driver.LatestLapTimeSeconds!.Value)
                                .ToList();

                            return new DashboardTeamGroupResponse(
                                GroupName: group.Key,
                                DriverCount: group.Count(),
                                Teams: teams,
                                AverageBestLapMilliseconds: bestLaps.Count > 0 ? bestLaps.Average() : null,
                                AverageLatestLapSeconds: latestLaps.Count > 0 ? latestLaps.Average() : null
                            );
                        })
                        .ToList();

                    var raceControlMessages = raceControlMessageProcessor
                        .Latest.Messages.Values
                        .OrderByDescending(message => message.Utc)
                        .Take(50)
                        .Select(message => new DashboardRaceControlMessageResponse(message.Utc, message.Message))
                        .ToList();

                    return TypedResults.Ok(
                        new DashboardSummaryResponse(
                            UpdatedAtUtc: DateTimeOffset.UtcNow,
                            SessionRunning: latestSession?.Name is not null,
                            ClockPaused: dateTimeProvider.IsPaused,
                            MeetingName: latestSession?.Meeting?.Name,
                            SessionName: latestSession?.Name,
                            SessionType: latestSession?.Type,
                            CircuitName: latestSession?.Meeting?.Circuit?.ShortName,
                            TrackStatus: latestTrackStatus?.Message,
                            TrackStatusCode: latestTrackStatus?.Status,
                            AirTemp: latestWeather?.AirTemp,
                            TrackTemp: latestWeather?.TrackTemp,
                            WindSpeed: latestWeather?.WindSpeed,
                            Humidity: latestWeather?.Humidity,
                            Drivers: drivers,
                            CompoundRankings: compoundRankings,
                            SectorRankings: sectorRankings,
                            RaceControl: raceControlMessages,
                            TeamGroups: teamGroups
                        )
                    );
                    }
                    catch (Exception)
                    {
                        return TypedResults.Ok(
                            new DashboardSummaryResponse(
                                UpdatedAtUtc: DateTimeOffset.UtcNow,
                                SessionRunning: false,
                                ClockPaused: false,
                                MeetingName: null,
                                SessionName: null,
                                SessionType: null,
                                CircuitName: null,
                                TrackStatus: null,
                                TrackStatusCode: null,
                                AirTemp: null,
                                TrackTemp: null,
                                WindSpeed: null,
                                Humidity: null,
                                Drivers: [],
                                CompoundRankings: [],
                                SectorRankings: [],
                                RaceControl: [],
                                TeamGroups: []
                            )
                        );
                    }
                }
            )
            .WithTags("Dashboard");

        return app;
    }

    private static List<DashboardSectorBestLapResponse> GetBestSectorsForDriver(
        string driverNumber,
        TimingDataPoint.Driver latestDriver,
        Dictionary<int, Dictionary<string, TimingDataPoint.Driver>> driversByLap
    )
    {
        var bestBySector = new Dictionary<string, (string LapTimeText, TimeSpan LapTimeSpan)>();

        UpdateBestSectors(bestBySector, latestDriver.Sectors);

        foreach (var lap in driversByLap.Values)
        {
            if (lap.TryGetValue(driverNumber, out var lapDriver))
            {
                UpdateBestSectors(bestBySector, lapDriver.Sectors);
            }
        }

        return bestBySector
            .Select(x => new DashboardSectorBestLapResponse(
                Sector: x.Key,
                LapTime: x.Value.LapTimeText,
                LapTimeMilliseconds: x.Value.LapTimeSpan.TotalMilliseconds
            ))
            .OrderBy(x => SectorOrder(x.Sector))
            .ToList();
    }

    private static void UpdateBestSectors(
        Dictionary<string, (string LapTimeText, TimeSpan LapTimeSpan)> bestBySector,
        Dictionary<string, TimingDataPoint.Driver.LapSectorTime> sectors
    )
    {
        foreach (var (sectorNumber, sectorData) in sectors)
        {
            if (!sectorData.Value.TryParseTimeSpan(out var sectorTime))
            {
                continue;
            }

            if (!bestBySector.TryGetValue(sectorNumber, out var currentBest) || sectorTime < currentBest.LapTimeSpan)
            {
                bestBySector[sectorNumber] = (sectorData.Value!, sectorTime);
            }
        }
    }

    private static int CompoundOrder(string compound) =>
        compound.ToUpperInvariant() switch
        {
            "SOFT" => 0,
            "MEDIUM" => 1,
            "HARD" => 2,
            "INTERMEDIATE" => 3,
            "WET" => 4,
            _ => 999,
        };

    private static int SectorOrder(string sector) => int.TryParse(sector, out var number) ? number : 999;

    private static List<DashboardLapTimePointResponse> GetLapTimesForDriver(
        string driverNumber,
        Dictionary<int, Dictionary<string, TimingDataPoint.Driver>> driversByLap
    )
    {
        var lapTimes = new List<DashboardLapTimePointResponse>();

        foreach (var (lapNumber, lapData) in driversByLap.OrderBy(x => x.Key))
        {
            if (!lapData.TryGetValue(driverNumber, out var lapDriver))
            {
                continue;
            }

            var lapTimeText = lapDriver.LastLapTime?.Value;
            if (!TryParseLapTimeSeconds(lapTimeText, out var lapTimeSeconds))
            {
                // Fallback: in alcuni aggiornamenti il LastLapTime può mancare,
                // ma i settori sono presenti. Sommiamo i settori validi.
                var sectorSeconds = lapDriver
                    .Sectors.Values.Select(x => x.Value)
                    .Where(x => TryParseLapTimeSeconds(x, out _))
                    .Select(x =>
                    {
                        _ = TryParseLapTimeSeconds(x, out var parsed);
                        return parsed;
                    })
                    .ToList();

                if (sectorSeconds.Count > 0)
                {
                    lapTimeSeconds = sectorSeconds.Sum();
                    lapTimeText = FormatLapTime(lapTimeSeconds);
                }
                else
                {
                    continue;
                }
            }

            lapTimes.Add(
                new DashboardLapTimePointResponse(
                    LapNumber: lapNumber,
                    LapTime: lapTimeText!,
                    LapTimeSeconds: lapTimeSeconds,
                    IsPitLap: lapDriver.IsPitLap
                )
            );
        }

        return lapTimes;
    }

    private static bool TryParseLapTimeSeconds(string? value, out double seconds)
    {
        seconds = 0;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim().TrimStart('+');
        if (!normalized.TryParseTimeSpan(out var span))
        {
            return false;
        }

        seconds = span.TotalSeconds;
        return true;
    }

    private static string FormatLapTime(double seconds)
    {
        var mins = (int)Math.Floor(seconds / 60);
        var secs = seconds % 60;
        return $"{mins}:{secs:00.000}";
    }

    private static List<DashboardStintSummaryResponse> GetStintsForDriver(
        Dictionary<string, TimingAppDataPoint.Driver.Stint> stints
    )
    {
        var results = new List<DashboardStintSummaryResponse>();

        foreach (var (stintKey, stintData) in stints.OrderBy(x => int.TryParse(x.Key, out var i) ? i : int.MaxValue))
        {
            var duration = stintData.GetStintDuration();
            var startLap = (stintData.StartLaps ?? 0) + 1;
            var endLap = startLap + Math.Max(0, duration - 1);
            var hasBestLap = stintData.LapTime.TryParseTimeSpan(out var bestLap);

            results.Add(
                new DashboardStintSummaryResponse(
                    Stint: stintKey,
                    Compound: stintData.Compound,
                    StartLap: startLap,
                    EndLap: endLap,
                    Laps: duration,
                    BestLap: stintData.LapTime,
                    BestLapMilliseconds: hasBestLap ? bestLap.TotalMilliseconds : null
                )
            );
        }

        return results;
    }

    private static string GetTeamGroup(string? teamName)
    {
        var normalized = NormalizeTeamName(teamName);

        return normalized switch
        {
            "ferrari" or "mclaren" or "redbull" or "mercedes" => "Gruppo 1",
            "astonmartin" or "alpine" or "cadilac" or "cadillac" or "audi" => "Gruppo 2",
            "haas" or "visacashapp" or "visachashapp" or "williams" => "Gruppo 3",
            _ => "Altri",
        };
    }

    private static int TeamGroupOrder(string teamGroup) =>
        teamGroup switch
        {
            "Gruppo 1" => 0,
            "Gruppo 2" => 1,
            "Gruppo 3" => 2,
            _ => 999,
        };

    private static string NormalizeTeamName(string? teamName) =>
        string.IsNullOrWhiteSpace(teamName)
            ? string.Empty
            : new string(teamName.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
}

public sealed record DashboardSummaryResponse(
    DateTimeOffset UpdatedAtUtc,
    bool SessionRunning,
    bool ClockPaused,
    string? MeetingName,
    string? SessionName,
    string? SessionType,
    string? CircuitName,
    string? TrackStatus,
    string? TrackStatusCode,
    string? AirTemp,
    string? TrackTemp,
    string? WindSpeed,
    string? Humidity,
    List<DashboardDriverResponse> Drivers,
    List<DashboardCompoundRankingResponse> CompoundRankings,
    List<DashboardSectorRankingResponse> SectorRankings,
    List<DashboardRaceControlMessageResponse> RaceControl,
    List<DashboardTeamGroupResponse> TeamGroups
);

public sealed record DashboardDriverResponse(
    string DriverNumber,
    string RacingNumber,
    string Tla,
    string? FullName,
    string? TeamName,
    string TeamGroup,
    string? TeamColour,
    string? Position,
    string? GapToLeader,
    string? IntervalToAhead,
    string? LastLap,
    string? BestLap,
    double? BestLapMilliseconds,
    int? NumberOfLaps,
    bool InPit,
    bool Retired,
    bool Stopped,
    bool KnockedOut,
    bool ImprovedLastLap,
    double? FirstLapTimeSeconds,
    double? LatestLapTimeSeconds,
    double? FirstToLatestDeltaSeconds,
    List<DashboardCompoundBestLapResponse> CompoundBestLaps,
    List<DashboardSectorBestLapResponse> SectorBestLaps,
    List<DashboardLapTimePointResponse> LapTimes,
    List<DashboardStintSummaryResponse> Stints
);

public sealed record DashboardCompoundBestLapResponse(
    string Compound,
    string LapTime,
    double LapTimeMilliseconds
);

public sealed record DashboardCompoundRankingResponse(
    string Compound,
    List<DashboardCompoundRankingEntryResponse> Entries
);

public sealed record DashboardCompoundRankingEntryResponse(
    string DriverNumber,
    string RacingNumber,
    string Tla,
    string? FullName,
    string? TeamName,
    string? TeamColour,
    string LapTime,
    double LapTimeMilliseconds
);

public sealed record DashboardSectorBestLapResponse(
    string Sector,
    string LapTime,
    double LapTimeMilliseconds
);

public sealed record DashboardSectorRankingResponse(
    string Sector,
    List<DashboardSectorRankingEntryResponse> Entries
);

public sealed record DashboardSectorRankingEntryResponse(
    string DriverNumber,
    string RacingNumber,
    string Tla,
    string? FullName,
    string? TeamName,
    string? TeamColour,
    string LapTime,
    double LapTimeMilliseconds
);

public sealed record DashboardLapTimePointResponse(
    int LapNumber,
    string LapTime,
    double LapTimeSeconds,
    bool IsPitLap
);

public sealed record DashboardStintSummaryResponse(
    string Stint,
    string? Compound,
    int StartLap,
    int EndLap,
    int Laps,
    string? BestLap,
    double? BestLapMilliseconds
);

public sealed record DashboardRaceControlMessageResponse(DateTimeOffset Utc, string? Message);

public sealed record DashboardTeamGroupResponse(
    string GroupName,
    int DriverCount,
    List<string?> Teams,
    double? AverageBestLapMilliseconds,
    double? AverageLatestLapSeconds
);

