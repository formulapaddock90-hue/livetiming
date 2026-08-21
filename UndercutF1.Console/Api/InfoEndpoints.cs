namespace UndercutF1.Console.Api;

public static class InfoEndpoints
{
    public static WebApplication MapInfoEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/api/info",
                (ConsoleOptions options) =>
                {
                    return TypedResults.Ok(
                        new ApiInfoResponse(
                            Version: "1.0.0",
                            ApiKeyRequired: !string.IsNullOrEmpty(options.ApiKey),
                            ApiKey: options.ApiKey ?? "Not configured",
                            Endpoints: new ApiEndpointsInfo(
                                ExportStandingsJSON: "/export/standings/json",
                                ExportSocialStandings: "/export/social/standings",
                                ExportClassificaFormulaPaddock: "/export/classifica/formulapaddock"
                            )
                        )
                    );
                }
            )
            .WithTags("Info")
            .WithName("GetApiInfo");

        return app;
    }
}

public record ApiInfoResponse(
    string Version,
    bool ApiKeyRequired,
    string ApiKey,
    ApiEndpointsInfo Endpoints
);

public record ApiEndpointsInfo(
    string ExportStandingsJSON,
    string ExportSocialStandings,
    string ExportClassificaFormulaPaddock
);
