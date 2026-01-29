<?php
// React bundle loading logic - FALLBACK ONLY
// Note: For SPA template, React is enqueued via functions.php
// This footer.php serves as fallback for other templates that don't use wp_enqueue_script

// Check if React is already enqueued (for SPA template via functions.php)
$react_already_enqueued = wp_script_is('ai-in-society-react-spa', 'enqueued') || 
                          wp_script_is('ai-in-society-react-spa', 'done') ||
                          wp_script_is('ai-in-society-react', 'enqueued') ||
                          wp_script_is('ai-in-society-react', 'done');

// Strictly prevent React bundle from loading in Elementor editor
$is_elementor_editor = false;
if ( class_exists( '\Elementor\Plugin' ) ) {
    $is_elementor_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
}

// Only load React as fallback if:
// 1. Not in Elementor editor
// 2. Not already enqueued/loaded (SPA template handles it via functions.php)
// 3. This is a fallback for templates that don't use wp_enqueue_script
if ( ! $is_elementor_editor && ! $react_already_enqueued ) {
    // Dynamically find the React bundle file
    $assets_dir = get_template_directory() . '/dist/assets/';
    $assets_uri = get_template_directory_uri() . '/dist/assets/';
    $js_files = glob($assets_dir . 'index-*.js');
    
    if ($js_files && !empty($js_files)) {
        $js_filename = basename($js_files[0]);
        echo '<script type="module" crossorigin src="' . esc_url($assets_uri . $js_filename) . '"></script>' . "\n";
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('AI in Society Hub: Fallback React bundle loaded from footer.php: ' . $assets_uri . $js_filename);
        }
    }
}
?>

<?php wp_footer(); ?>
</body>
</html>