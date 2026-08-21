<?php
/**
 * Plugin Name: UndercutF1 Live Standings & Telemetry
 * Description: F1 Live Timing & Telemetria Direct Stream Integration (No Ads)
 * Version: 14.0.0
 * Author: Formula Paddock Team
 */

if (!defined('ABSPATH')) exit;

// Block Google AdSense Auto-Ads code on Live Timing Page
add_action('template_redirect', function() {
    if (is_page('live-timing-f1') || is_page('live-timing')) {
        add_filter('adsense_auto_ads_enabled', '__return_false');
        add_filter('googlesitekit_adsense_tag_blocked', '__return_true');
    }
});

add_shortcode('undercutf1_live_timing', function() {
    return '<div class="undercut-iframe-wrapper" style="width: 100%; min-height: 1350px; background: #0b0f19;"><iframe src="https://www.formulapaddock.it/live.html?v=NO_ADS" style="width: 100%; height: 1350px; border: none;" title="F1 Live Timing"></iframe></div>';
});

add_filter('page_template', function($template) {
    if (is_page('live-timing-f1') || is_page('live-timing')) {
        $plugin_template = plugin_dir_path(__FILE__) . 'template-live-timing.php';
        if (file_exists($plugin_template)) {
            return $plugin_template;
        }
    }
    return $template;
});
