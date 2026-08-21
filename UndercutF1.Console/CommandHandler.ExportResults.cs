using Spectre.Console;

namespace UndercutF1.Console;

public static partial class CommandHandler
{
    /// <summary>
    /// Esporta la classifica finale di una gara in CSV per il sito web
    /// Utilizzo: undercutf1 export-results --session-dir "C:\path\to\session" --output-dir "C:\temp\output"
    /// </summary>
    public static async Task ExportResults(
        DirectoryInfo? sessionDirectory,
        DirectoryInfo? outputDirectory,
        bool? isVerbose
    )
    {
        if (sessionDirectory == null || !sessionDirectory.Exists)
        {
            AnsiConsole.Write(
                new Text("❌ Cartella sessione non specificata o non esiste", Color.Red)
            );
            AnsiConsole.Write(
                new Text(
                    "Utilizzo: undercutf1 export-results --session-dir \"C:\\path\\to\\session\" --output-dir \"C:\\temp\\output\"",
                    Color.Yellow
                )
            );
            return;
        }

        if (outputDirectory == null)
        {
            // Default: salva nello stesso percorso della sessione
            outputDirectory = sessionDirectory;
        }

        AnsiConsole.Write(
            new Text("🏁 Esportazione classifica F1...", Color.Cyan)
        );

        await ExportRaceResults.ExportClassificaAsync(
            sessionDirectory,
            outputDirectory,
            isVerbose ?? false
        );
    }
}
