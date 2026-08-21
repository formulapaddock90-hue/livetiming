using Spectre.Console;
using UndercutF1.Data;

namespace UndercutF1.Console;

public static partial class CommandHandler
{
    public static async Task ExportSession(
        DirectoryInfo sessionDirectory,
        FileInfo? outputFile,
        DirectoryInfo? dataDirectory,
        bool? isVerbose
    )
    {
        try
        {
            var path = sessionDirectory.FullName;

            if (!Directory.Exists(path))
            {
                AnsiConsole.MarkupLine(
                    $"[red]✗ Session directory not found: {path}[/]"
                );
                return;
            }

            var liveJsonlPath = Path.Join(path, "live.jsonl");
            var subscribeJsonPath = Path.Join(path, "subscribe.json");

            if (!File.Exists(liveJsonlPath))
            {
                AnsiConsole.MarkupLine(
                    $"[red]✗ live.jsonl not found in session directory[/]"
                );
                return;
            }

            if (!File.Exists(subscribeJsonPath))
            {
                AnsiConsole.MarkupLine(
                    $"[red]✗ subscribe.json not found in session directory[/]"
                );
                return;
            }

            var outputPath = outputFile?.FullName;
            AnsiConsole.MarkupLine(
                $"[cyan]Exporting final standings from {sessionDirectory.Name}...[/]"
            );

            await SessionExporterExtensions.ExportFinalStandingsToTxtAsync(path, outputPath);

            AnsiConsole.MarkupLine(
                $"[green]✓ Export completed successfully[/]"
            );
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]✗ Export failed: {ex.Message}[/]");
            Environment.Exit(1);
        }
    }
}
