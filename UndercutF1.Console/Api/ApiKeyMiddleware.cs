using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace UndercutF1.Console.Api;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;
    private const string ApiKeyHeaderName = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IOptions<ConsoleOptions> optionsAccessor)
    {
        var options = optionsAccessor.Value;
        if (!options.ApiEnabled || string.IsNullOrEmpty(options.ApiKey))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.ToString().ToLowerInvariant();
        var isPublicEndpoint = path == "/" || path == "/favicon.ico" || path.StartsWith("/index") || path.StartsWith("/dashboard") || path.StartsWith("/data/dashboard") || path.StartsWith("/export/") || path == "/api/info";

        if (isPublicEndpoint)
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var apiKey))
        {
            _logger.LogWarning("API request without API key from {RemoteIpAddress}", context.Connection.RemoteIpAddress);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Missing API key\"}");
            return;
        }

        if (apiKey != options.ApiKey)
        {
            _logger.LogWarning("Invalid API key attempt from {RemoteIpAddress}", context.Connection.RemoteIpAddress);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Invalid API key\"}");
            return;
        }

        await _next(context);
    }
}

public static class ApiKeyMiddlewareExtensions
{
    public static WebApplication UseApiKeyAuthentication(this WebApplication app)
    {
        app.UseMiddleware<ApiKeyMiddleware>();
        return app;
    }
}
