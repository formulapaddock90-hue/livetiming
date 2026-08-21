<?php
/*
Template Name: F1 Live Timing Direct Stream
*/
get_header();
?>
<style>
    /* Override any theme margin corruption on live timing page */
    #primary, #main, .site-main, .content-area {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
    }
</style>
<div id="primary" class="content-area w-100 p-0 m-0">
    <main id="main" class="site-main w-100 p-0 m-0" role="main">
        <div class="undercut-iframe-wrapper" style="width: 100%; min-height: 1350px; background: #0b0f19; margin: 0; padding: 0;">
            <iframe src="https://www.formulapaddock.it/live.html?v=14.0" style="width: 100%; height: 1350px; border: none; overflow: hidden;" allow="autoplay; fullscreen" title="F1 Live Timing Telemetria Direct Stream"></iframe>
        </div>
    </main>
</div>
<?php
get_footer();
?>
