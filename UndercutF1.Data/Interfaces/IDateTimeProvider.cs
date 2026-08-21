namespace UndercutF1.Data;

public interface IDateTimeProvider
{
    TimeSpan Delay { get; set; }

    DateTimeOffset Utc { get; }

    bool IsPaused { get; }

    void TogglePause();
}
