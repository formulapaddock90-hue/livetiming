<?php
/**
 * Template Name: Live Timing
 * Description: Custom WordPress Page Template for F1 Live Timing Dashboard iframe integration.
 * Version: 1.1.0
 * Author: Formula Paddock Team
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// --- SEO: Titolo pagina personalizzato ---
add_filter( 'pre_get_document_title', function() {
    return 'Live Timing F1 | Telemetria in Diretta – Formula Paddock';
}, 99 );

// --- SEO: Meta, Open Graph, Twitter Card, Schema.org, Canonical, Font Preload ---
add_action( 'wp_head', function() {
    $canonical = home_url( '/live-timing-f1/' );
    $og_image  = 'https://www.formulapaddock.it/wp-content/uploads/og-live-timing.jpg';
    ?>
    <meta name="description" content="Segui il Live Timing F1 in tempo reale su Formula Paddock: posizioni, tempi sul giro, stint gomme e messaggi di gara in diretta durante ogni sessione ufficiale.">
    <link rel="canonical" href="<?php echo esc_url( $canonical ); ?>">
    <!-- Open Graph -->
    <meta property="og:type"        content="website">
    <meta property="og:title"       content="Live Timing F1 in Diretta – Formula Paddock">
    <meta property="og:description" content="Telemetria F1 live: posizioni, tempi sul giro, stint gomme e Race Control in diretta durante Prove Libere, Qualifiche e Gara.">
    <meta property="og:url"         content="<?php echo esc_url( $canonical ); ?>">
    <meta property="og:image"       content="<?php echo esc_url( $og_image ); ?>">
    <meta property="og:site_name"   content="Formula Paddock">
    <meta property="og:locale"      content="it_IT">
    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="Live Timing F1 in Diretta – Formula Paddock">
    <meta name="twitter:description" content="Telemetria F1 live: posizioni, tempi sul giro, stint gomme e Race Control durante ogni sessione ufficiale di Formula 1.">
    <meta name="twitter:image"       content="<?php echo esc_url( $og_image ); ?>">
    <!-- Google Fonts con preload per ridurre il LCP -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@600;700;900&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@600;700;900&display=swap">
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Live Timing F1 | Telemetria in Diretta",
        "description": "Segui il Live Timing F1 in tempo reale su Formula Paddock: posizioni, tempi sul giro, stint gomme e messaggi di gara in diretta.",
        "url": "<?php echo esc_js( $canonical ); ?>",
        "publisher": {
            "@type": "Organization",
            "name": "Formula Paddock",
            "url": "https://www.formulapaddock.it"
        },
        "mainEntity": {
            "@type": "SportsEvent",
            "name": "F1 Live Timing – Formula Paddock",
            "sport": "Formula 1",
            "organizer": {
                "@type": "Organization",
                "name": "Formula Paddock",
                "url": "https://www.formulapaddock.it"
            }
        }
    }
    </script>
    <?php
}, 1 );

get_header();
?>

<style id="f1-lt-styles">
/* ==========================================================================
   F1 LIVE TIMING DASHBOARD - SCOPED STYLES (#f1-lt-dashboard)
   ========================================================================== */
#f1-lt-dashboard {
    --f1-red: #e10600;
    --f1-red-hover: #ff1801;
    --f1-red-glow: rgba(225, 6, 0, 0.4);
    --f1-bg-main: #15151e;
    --f1-bg-surface: #1f1f27;
    --f1-bg-surface-elevated: #282832;
    --f1-border-metallic: #38383f;
    --f1-border-subtle: #2a2a35;
    --f1-text-primary: #ffffff;
    --f1-text-secondary: #a0a0ab;
    --f1-text-muted: #6c6c75;
    --f1-status-online: #00d26a;
    --f1-status-online-glow: rgba(0, 210, 106, 0.4);
    --f1-status-offline: #e10600;
    --f1-status-offline-glow: rgba(225, 6, 0, 0.4);
    --f1-status-amber: #f59e0b;

    width: 100%;
    max-width: 100% !important;
    background-color: var(--f1-bg-main);
    color: var(--f1-text-primary);
    font-family: 'Titillium Web', 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px 0 40px;
    margin: 0 auto;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    /* Assicura che il blocco non si sovrapponga al menu del tema */
    clear: both;
}

#f1-lt-dashboard * {
    box-sizing: border-box;
}

/* Assicura che il wrapper #primary non nasconda il menu del tema */
.live-timing-page-wrapper {
    position: relative;
    z-index: 1;
    overflow: visible !important;
}

#f1-lt-dashboard .f1-lt-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
}

/* Header Bar */
#f1-lt-dashboard .f1-lt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--f1-bg-surface);
    border: 1px solid var(--f1-border-metallic);
    border-left: 5px solid var(--f1-red);
    border-radius: 8px;
    padding: 16px 24px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

#f1-lt-dashboard .f1-lt-title-group {
    display: flex;
    align-items: center;
    gap: 14px;
}

#f1-lt-dashboard .f1-lt-brand-badge {
    background: var(--f1-red);
    color: #ffffff;
    font-weight: 900;
    font-size: 16px;
    padding: 6px 12px;
    border-radius: 3px;
    transform: skewX(-12deg);
    letter-spacing: 1px;
}

#f1-lt-dashboard .f1-lt-brand-badge span {
    display: inline-block;
    transform: skewX(12deg);
}

#f1-lt-dashboard .f1-lt-title-meta {
    display: flex;
    flex-direction: column;
}

#f1-lt-dashboard .f1-lt-title {
    font-size: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--f1-text-primary);
    margin: 0;
    line-height: 1.2;
}

#f1-lt-dashboard .f1-lt-subtitle {
    font-size: 11px;
    color: var(--f1-text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 2px;
}

/* Dynamic Status Badge */
#f1-lt-dashboard #f1-status-badge,
#f1-lt-dashboard .f1-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--f1-border-metallic);
}

#f1-lt-dashboard .f1-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
    background-color: var(--f1-text-muted);
}

/* Status Badge Pulse Animations */
@keyframes f1-pulse-green {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 var(--f1-status-online-glow);
    }
    70% {
        transform: scale(1.15);
        box-shadow: 0 0 0 10px rgba(0, 210, 106, 0);
    }
    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 210, 106, 0);
    }
}

@keyframes f1-pulse-red {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.35;
        transform: scale(0.92);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes f1-pulse-amber {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
}

/* Status Badge States */
#f1-lt-dashboard .f1-status-badge.is-live {
    background: rgba(0, 210, 106, 0.12);
    border: 1px solid rgba(0, 210, 106, 0.45);
    color: var(--f1-status-online);
    box-shadow: 0 0 20px rgba(0, 210, 106, 0.25);
}

#f1-lt-dashboard .f1-status-badge.is-live .f1-status-dot {
    background-color: var(--f1-status-online);
    animation: f1-pulse-green 1.8s infinite ease-in-out;
}

#f1-lt-dashboard .f1-status-badge.is-offline {
    background: rgba(225, 6, 0, 0.12);
    border: 1px solid rgba(225, 6, 0, 0.35);
    color: #ff4d4d;
    box-shadow: 0 0 15px rgba(225, 6, 0, 0.15);
}

#f1-lt-dashboard .f1-status-badge.is-offline .f1-status-dot {
    background-color: var(--f1-status-offline);
    animation: f1-pulse-red 2.2s infinite ease-in-out;
}

#f1-lt-dashboard .f1-status-badge.is-checking {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: var(--f1-status-amber);
}

#f1-lt-dashboard .f1-status-badge.is-checking .f1-status-dot {
    background-color: var(--f1-status-amber);
    animation: f1-pulse-amber 1s infinite ease-in-out;
}

/* Responsive Iframe Container */
#f1-lt-dashboard #f1-iframe-container,
#f1-lt-dashboard .f1-lt-view-wrapper {
    position: relative;
    width: 100%;
    height: calc(100vh - 180px);
    min-height: 720px;
    max-height: 950px;
    background: var(--f1-bg-surface);
    border: 1px solid var(--f1-border-metallic);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

#f1-lt-dashboard .f1-lt-view-wrapper iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
}

/* Offline Fallback UI Container */
#f1-lt-dashboard #f1-offline-container,
#f1-lt-dashboard .f1-offline-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 560px;
    padding: 40px 20px;
    background: radial-gradient(circle at center, #1a1a26 0%, #0b0b10 100%);
    border-radius: 12px;
    border: 1px solid var(--f1-border-metallic);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

#f1-lt-dashboard .f1-offline-card {
    max-width: 640px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Telemetry Radar Animation */
#f1-lt-dashboard .f1-radar-graphic {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
}

#f1-lt-dashboard .f1-radar-circle {
    position: absolute;
    border: 1.5px solid rgba(225, 6, 0, 0.4);
    border-radius: 50%;
    animation: f1-radar-expand 3s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

#f1-lt-dashboard .f1-radar-circle.circle-1 { width: 40px; height: 40px; animation-delay: 0s; }
#f1-lt-dashboard .f1-radar-circle.circle-2 { width: 70px; height: 70px; animation-delay: 0.8s; }
#f1-lt-dashboard .f1-radar-circle.circle-3 { width: 100px; height: 100px; animation-delay: 1.6s; }

@keyframes f1-radar-expand {
    0% {
        transform: scale(0.3);
        opacity: 1;
    }
    100% {
        transform: scale(1.4);
        opacity: 0;
    }
}

#f1-lt-dashboard .f1-radar-icon {
    position: relative;
    z-index: 2;
    width: 48px;
    height: 48px;
    background: var(--f1-bg-main);
    border: 2px solid var(--f1-red);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--f1-red);
    box-shadow: 0 0 20px rgba(225, 6, 0, 0.4);
}

/* Broadcast Offline Copy */
#f1-lt-dashboard .f1-offline-title {
    color: var(--f1-text-primary);
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin: 0 0 12px 0;
    font-family: 'Titillium Web', 'Montserrat', sans-serif;
}

#f1-lt-dashboard .f1-offline-subtitle {
    color: var(--f1-text-secondary);
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 28px 0;
    max-width: 520px;
}

/* Slanted F1 Retry Button */
#f1-lt-dashboard #f1-retry-btn,
#f1-lt-dashboard .f1-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--f1-red);
    color: var(--f1-text-primary);
    border: none;
    padding: 14px 32px;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transform: skewX(-10deg);
    transition: all 0.25s ease;
    box-shadow: 0 4px 18px var(--f1-red-glow);
    border-radius: 4px;
}

#f1-lt-dashboard #f1-retry-btn > *,
#f1-lt-dashboard .f1-btn-primary > * {
    transform: skewX(10deg);
}

#f1-lt-dashboard #f1-retry-btn:hover,
#f1-lt-dashboard .f1-btn-primary:hover {
    background: var(--f1-red-hover);
    box-shadow: 0 6px 25px rgba(225, 6, 0, 0.6);
    transform: skewX(-10deg) translateY(-2deg);
}

#f1-lt-dashboard #f1-retry-btn:disabled,
#f1-lt-dashboard .f1-btn-primary:disabled {
    background: #475569;
    cursor: not-allowed;
    box-shadow: none;
    transform: skewX(-10deg);
}

#f1-lt-dashboard .f1-btn-spinner {
    width: 18px;
    height: 18px;
    display: none;
    animation: f1-spin 1s linear infinite;
}

#f1-lt-dashboard .f1-btn-primary.is-loading .f1-btn-spinner,
#f1-lt-dashboard #f1-retry-btn.is-loading .f1-btn-spinner {
    display: inline-block;
}

@keyframes f1-spin {
    from { transform: skewX(10deg) rotate(0deg); }
    to { transform: skewX(10deg) rotate(360deg); }
}

#f1-lt-dashboard .f1-auto-retry-note {
    margin-top: 14px;
    font-size: 12px;
    color: var(--f1-text-muted);
}

#f1-lt-dashboard #f1-countdown {
    color: var(--f1-red);
    font-weight: 700;
}

/* Transmission Schedule Box */
#f1-lt-dashboard .f1-schedule-box {
    margin-top: 36px;
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 20px;
    text-align: left;
}

#f1-lt-dashboard .f1-schedule-box h3 {
    color: var(--f1-text-secondary);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

#f1-lt-dashboard .f1-schedule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
}

#f1-lt-dashboard .f1-schedule-item {
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid #475569;
    padding: 10px 14px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
}

#f1-lt-dashboard .f1-schedule-item.highlighted {
    border-left-color: var(--f1-red);
    background: rgba(225, 6, 0, 0.08);
}

#f1-lt-dashboard .f1-schedule-item .day {
    font-size: 11px;
    font-weight: 800;
    color: var(--f1-red);
    letter-spacing: 0.8px;
}

#f1-lt-dashboard .f1-schedule-item .session {
    font-size: 13px;
    color: var(--f1-text-primary);
    font-weight: 600;
    margin-top: 4px;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
    #f1-lt-dashboard .f1-lt-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
    }
    #f1-lt-dashboard .f1-lt-view-wrapper {
        height: 560px;
        min-height: 520px;
    }
    #f1-lt-dashboard .f1-lt-title {
        font-size: 16px;
    }
}

/* SEO Content Section - Testo statico indicizzabile */
#f1-lt-dashboard .f1-lt-seo-content {
    background: var(--f1-bg-surface);
    border: 1px solid var(--f1-border-subtle);
    border-top: 3px solid var(--f1-red);
    border-radius: 8px;
    padding: 28px 32px;
    margin-top: 28px;
    color: var(--f1-text-secondary);
    font-size: 15px;
    line-height: 1.7;
}

#f1-lt-dashboard .f1-lt-seo-content h2 {
    color: var(--f1-text-primary);
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 14px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--f1-border-metallic);
}

#f1-lt-dashboard .f1-lt-seo-content h3 {
    color: var(--f1-text-primary);
    font-size: 14px;
    font-weight: 700;
    margin: 20px 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
}

#f1-lt-dashboard .f1-lt-seo-content p {
    margin: 0 0 12px 0;
}

#f1-lt-dashboard .f1-lt-seo-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 8px;
}

#f1-lt-dashboard .f1-lt-seo-content ul li {
    padding: 8px 12px 8px 22px;
    position: relative;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 4px;
    font-size: 14px;
}

#f1-lt-dashboard .f1-lt-seo-content ul li::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 5px;
    background: var(--f1-red);
    border-radius: 50%;
}

#f1-lt-dashboard .f1-lt-seo-content strong {
    color: var(--f1-text-primary);
    font-weight: 700;
}
</style>

<div id="primary" class="content-area live-timing-page-wrapper">
    <main id="main" class="site-main" role="main">
        <div id="f1-lt-dashboard">
            <div class="f1-lt-container">
                <!-- Header Bar -->
                <header class="f1-lt-header">
                    <div class="f1-lt-title-group">
                        <div class="f1-lt-brand-badge">
                            <span>F1</span>
                        </div>
                        <div class="f1-lt-title-meta">
                            <h1 class="f1-lt-title"><?php echo esc_html( 'Live Timing F1 – Telemetria in Diretta' ); ?></h1>
                            <span class="f1-lt-subtitle"><?php echo esc_html( 'FORMULA PADDOCK • DIRECT STREAM' ); ?></span>
                        </div>
                    </div>

                    <!-- Dynamic Status Badge -->
                    <div id="f1-status-badge" class="f1-status-badge is-checking">
                        <span class="f1-status-dot"></span>
                        <span id="f1-status-text"><?php echo esc_html( 'VERIFICA STATO...' ); ?></span>
                    </div>
                </header>

                <!-- Responsive Iframe Container -->
                <div id="f1-iframe-container" class="f1-lt-view-wrapper">
                    <iframe
                        id="f1-live-iframe"
                        src="<?php echo esc_url( 'https://live.formulapaddock.it' ); ?>"
                        title="<?php echo esc_attr( 'F1 Live Timing Dashboard' ); ?>"
                        allow="autoplay; fullscreen; clipboard-write"
                        allowfullscreen="true"
                        loading="eager"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                    ></iframe>
                </div>

                <!-- Offline Fallback UI Container -->
                <div id="f1-offline-container" class="f1-offline-container" style="display: none;">
                    <div class="f1-offline-card">
                        <!-- Telemetry Radar Graphic -->
                        <div class="f1-radar-graphic">
                            <div class="f1-radar-circle circle-1"></div>
                            <div class="f1-radar-circle circle-2"></div>
                            <div class="f1-radar-circle circle-3"></div>
                            <div class="f1-radar-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4.9 19.1C1.9 16.1 1.9 11.3 4.9 8.3"></path>
                                    <path d="M7.8 16.2C5.6 14 5.6 10.4 7.8 8.2"></path>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <path d="M16.2 7.8c2.2 2.2 2.2 5.8 0 8"></path>
                                    <path d="M19.1 4.9c3 3 3 7.8 0 10.8"></path>
                                </svg>
                            </div>
                        </div>

                        <!-- Broadcast Status Message -->
                        <h2 class="f1-offline-title"><?php echo esc_html( 'OFFLINE - NO SESSION ACTIVE' ); ?></h2>
                        <p class="f1-offline-subtitle">
                            <?php echo esc_html( 'La telemetria F1 live non è al momento in trasmissione. Il segnale viene attivato automaticamente durante le sessioni ufficiali di Prove Libere (FP1, FP2, FP3), Qualifiche e Gara.' ); ?>
                        </p>

                        <!-- Slanted Red Retry Button -->
                        <button id="f1-retry-btn" class="f1-btn-primary" onclick="window.f1CheckLiveStatus(true)">
                            <svg class="f1-btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle>
                            </svg>
                            <span id="f1-btn-text"><?php echo esc_html( 'RIPROVA CONNESSIONE' ); ?></span>
                        </button>

                        <!-- Auto-Retry Countdown Timer -->
                        <p class="f1-auto-retry-note">
                            <?php echo esc_html( 'Prossimo controllo automatico tra ' ); ?><span id="f1-countdown">20</span><?php echo esc_html( ' secondi' ); ?>
                        </p>

                        <!-- UndercutF1 Live & Final Standings Integration -->
    <div style="margin-top: 30px; width: 100%;">
        <?php echo do_shortcode('[formulapaddock_classifica]'); ?>
    </div>

    <!-- Transmission Schedule Box -->
                        <div class="f1-schedule-box">
                            <h3>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <?php echo esc_html( 'PROGRAMMAZIONE TRASMISSIONI TELEMETRIA F1' ); ?>
                            </h3>
                            <div class="f1-schedule-grid">
                                <div class="f1-schedule-item">
                                    <span class="day"><?php echo esc_html( 'VENERDÌ' ); ?></span>
                                    <span class="session"><?php echo esc_html( 'Prove Libere 1 & 2' ); ?></span>
                                </div>
                                <div class="f1-schedule-item highlighted">
                                    <span class="day"><?php echo esc_html( 'SABATO' ); ?></span>
                                    <span class="session"><?php echo esc_html( 'FP3 & Qualifiche / Sprint' ); ?></span>
                                </div>
                                <div class="f1-schedule-item highlighted">
                                    <span class="day"><?php echo esc_html( 'DOMENICA' ); ?></span>
                                    <span class="session"><?php echo esc_html( 'Gran Premio (Gara Live)' ); ?></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SEO: Contenuto statico indicizzabile dai motori di ricerca -->
                <section class="f1-lt-seo-content" aria-label="Informazioni sul Live Timing F1">
                    <h2>Live Timing F1 in Diretta su Formula Paddock</h2>
                    <p>Formula Paddock trasmette il <strong>live timing F1</strong> in tempo reale durante tutte le sessioni ufficiali del Mondiale di Formula 1. Segui la <strong>telemetria F1 in diretta</strong>: posizioni aggiornate al secondo, tempi sul giro, stint gomme Pirelli, gap tra piloti e messaggi dalla Direzione di Gara (Race Control).</p>
                    <p>La dashboard è attiva durante <strong>Prove Libere (FP1, FP2, FP3)</strong>, <strong>Qualifiche</strong>, <strong>Sprint Race</strong> e <strong>Gran Premio</strong>. I dati vengono trasmessi tramite le API ufficiali F1 mediante il progetto open-source UndercutF1.</p>
                    <h3>Cosa trovi nel Live Timing F1</h3>
                    <ul>
                        <li>Classifica in tempo reale con posizioni e gap tra i piloti</li>
                        <li>Tempi sul giro e tempi settore per ogni pilota</li>
                        <li>Stint gomme: compound Pirelli, numero giri e miglior tempo per mescola</li>
                        <li>Messaggi Race Control: Safety Car, bandiere gialle, penalità</li>
                        <li>Meteo pista: temperatura aria e asfalto, umidità, vento</li>
                        <li>Analisi comparativa per gruppo di team</li>
                    </ul>
                </section>
            </div>
        </div>
    </main>
</div>

<script id="f1-lt-script">
(function() {
    'use strict';

    const CONFIG = {
        targetUrl: 'https://live.formulapaddock.it',
        checkIntervalMs: 20000,
        timeoutMs: 4000
    };

    let isChecking = false;
    let countdownInterval = null;
    let countdownSeconds = 20;

    /**
     * Dual-probe reachability checker:
     * Layer 1: fetch HEAD request with AbortController timeout.
     * Layer 2: Image probe fallback for CORS error pages (Cloudflare 502/521).
     */
    async function checkReachability() {
        if (!navigator.onLine) {
            return false;
        }

        const timestamp = Date.now();
        const pingUrl = CONFIG.targetUrl + '/?ping=' + timestamp;

        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, CONFIG.timeoutMs);

            // Layer 1: Fetch Request
            fetch(pingUrl, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-store',
                signal: controller.signal
            }).then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    resolve(true);
                } else {
                    resolve(false); // HTTP 502, 521, etc.
                }
            }).catch(() => {
                clearTimeout(timeoutId);
                // Layer 2: Image Probe Fallback
                const img = new Image();
                const imgTimeout = setTimeout(() => {
                    img.onload = img.onerror = null;
                    resolve(false);
                }, 3000);

                img.onload = () => {
                    clearTimeout(imgTimeout);
                    resolve(true);
                };
                img.onerror = () => {
                    clearTimeout(imgTimeout);
                    resolve(false);
                };
                img.src = CONFIG.targetUrl + '/favicon.ico?v=' + timestamp;
            });
        });
    }

    /**
     * Main Status Check & UI Switcher
     */
    async function updateStatus(manualTrigger) {
        if (isChecking) return;
        isChecking = true;

        const badge = document.getElementById('f1-status-badge');
        const badgeText = document.getElementById('f1-status-text');
        const iframeContainer = document.getElementById('f1-iframe-container');
        const iframe = document.getElementById('f1-live-iframe');
        const offlineContainer = document.getElementById('f1-offline-container');
        const retryBtn = document.getElementById('f1-retry-btn');
        const btnText = document.getElementById('f1-btn-text');

        // Set Checking UI State
        if (badge) {
            badge.className = 'f1-status-badge is-checking';
            if (badgeText) badgeText.textContent = 'VERIFICA STATO...';
        }
        if (manualTrigger && retryBtn && btnText) {
            retryBtn.disabled = true;
            btnText.textContent = 'VERIFICA IN CORSO...';
            retryBtn.classList.add('is-loading');
        }

        const isOnline = await checkReachability();

        if (isOnline) {
            // ONLINE STATE
            if (badge) {
                badge.className = 'f1-status-badge is-live';
                if (badgeText) badgeText.textContent = 'LIVE ON AIR';
            }
            if (offlineContainer) offlineContainer.style.display = 'none';
            if (iframeContainer) {
                iframeContainer.style.display = 'block';
                if (iframe && (!iframe.src || iframe.src === 'about:blank')) {
                    iframe.src = CONFIG.targetUrl;
                }
            }
        } else {
            // OFFLINE STATE
            if (badge) {
                badge.className = 'f1-status-badge is-offline';
                if (badgeText) badgeText.textContent = 'OFFLINE - NO SESSION ACTIVE';
            }
            if (iframeContainer) iframeContainer.style.display = 'none';
            if (offlineContainer) offlineContainer.style.display = 'flex';
        }

        // Reset Button UI State
        if (retryBtn && btnText) {
            retryBtn.disabled = false;
            btnText.textContent = 'RIPROVA CONNESSIONE';
            retryBtn.classList.remove('is-loading');
        }

        isChecking = false;
        resetCountdown();
    }

    /**
     * Countdown Timer for Auto-Retry
     */
    function resetCountdown() {
        clearInterval(countdownInterval);
        countdownSeconds = Math.floor(CONFIG.checkIntervalMs / 1000);
        const countdownEl = document.getElementById('f1-countdown');

        if (countdownEl) countdownEl.textContent = countdownSeconds;

        countdownInterval = setInterval(() => {
            countdownSeconds--;
            if (countdownEl) countdownEl.textContent = Math.max(0, countdownSeconds);
            if (countdownSeconds <= 0) {
                clearInterval(countdownInterval);
                updateStatus(false);
            }
        }, 1000);
    }

    // Expose check method globally for button onclick handler
    window.f1CheckLiveStatus = function(isManual) {
        updateStatus(isManual);
    };

    // Auto-initialize on DOMReady
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateStatus(false);
        });
    } else {
        updateStatus(false);
    }
})();
</script>

<?php
if ( ! did_action( 'wp_footer' ) ) {
    wp_footer();
}

get_footer();