<?php
/**
 * Plugin Name: FormulaPaddock Classifica F1 Live
 * Description: Shortcode [formulapaddock_classifica] per integrare la classifica F1 live e finale da UndercutF1 su WordPress.
 * Version: 1.0.0
 * Author: UndercutF1 / FormulaPaddock Team
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

function formulapaddock_classifica_shortcode($atts) {
    // Carica lo script JS di caricamento classifica
    wp_enqueue_script(
        'undercut-classifica-loader',
        'https://www.undercut-f1.it/classifica-loader.js',
        array(),
        '1.0.0',
        true
    );

    ob_start();
    ?>
    <div id="modulo-d" class="modulo-d" data-modulo="d" style="font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; background: #18191c; color: #ffffff; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #ffffff; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                <span>🏁</span> Classifica F1 Live & Finale
            </h2>

            <div class="modulo-d-toolbar" style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="import-local-standings" class="btn-carica-classifica" style="
                    background: linear-gradient(135deg, #e10600 0%, #b30000 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    font-size: 0.95em;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(225, 6, 0, 0.3);
                    transition: all 0.2s ease;
                ">
                    🏁 Carica Classifica Finale
                </button>

                <button id="export-formulapaddock-btn" class="btn-esporta-classifica" style="
                    background: linear-gradient(135deg, #2b2d42 0%, #1a1b26 100%);
                    color: white;
                    border: 1px solid #4a4e69;
                    padding: 10px 20px;
                    font-size: 0.95em;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                ">
                    💾 Esporta da Undercut
                </button>
            </div>
        </div>

        <div id="modulo-d-status" style="padding: 12px 16px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9em; display: none;"></div>

        <div class="table-wrap" style="overflow-x: auto;">
            <table id="classifica-finale" style="width: 100%; border-collapse: collapse; background: #22242b; border: 1px solid #333742; border-radius: 6px; color: #fff;">
                <thead style="background: #111215; color: #e10600; font-weight: bold; border-bottom: 2px solid #e10600;">
                    <tr>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Pos</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">N.</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Pilota</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Team</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Best Lap</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Ultimo Giro</th>
                        <th style="padding: 12px; text-align: left; border-right: 1px solid #333742;">Giri</th>
                        <th style="padding: 12px; text-align: left;">Gap</th>
                    </tr>
                </thead>
                <tbody id="classifica-finale-body">
                    <tr>
                        <td colspan="8" style="padding: 24px; text-align: center; color: #94a3b8;">
                            Premi su <strong>"🏁 Carica Classifica Finale"</strong> per visualizzare i tempi live.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div id="modulo-d-timestamp" style="text-align: right; color: #94a3b8; font-size: 0.85rem; margin-top: 10px; font-style: italic;"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('formulapaddock_classifica', 'formulapaddock_classifica_shortcode');
