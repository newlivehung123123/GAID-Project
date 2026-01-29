<?php
/**
 * Template Name: AI Hub Main Design
 */
get_header(); // Required for Elementor

// Check if we're in the editor (Gutenberg or Elementor)
$is_editor = false;

// Elementor editor detection
if ( class_exists( '\Elementor\Plugin' ) && \Elementor\Plugin::$instance->editor->is_edit_mode() ) {
    $is_editor = true;
}

// Gutenberg editor detection - check for editor preview/iframe context
// Gutenberg loads templates in iframe for preview, so we check for editor context
if ( ! $is_editor ) {
    // Check if we're in Gutenberg editor preview context
    $is_gutenberg_preview = ( isset( $_GET['_wp-find-template'] ) || 
                              ( isset( $_GET['preview'] ) && isset( $_GET['preview_id'] ) ) ||
                              ( isset( $_SERVER['HTTP_REFERER'] ) && 
                                ( strpos( $_SERVER['HTTP_REFERER'], '/wp-admin/post.php' ) !== false ||
                                  strpos( $_SERVER['HTTP_REFERER'], '/wp-admin/post-new.php' ) !== false ) ) );
    
    if ( $is_gutenberg_preview ) {
        $is_editor = true;
    }
}

// 1. WORDPRESS CONTENT AREA: Hidden for front-end, visible only in editor
if ( have_posts() ) : 
    while ( have_posts() ) : the_post(); 
        ?>
        <div class="wp-editable-content" style="<?php echo $is_editor ? 'background: transparent; min-height: 50px;' : 'display: none;'; ?>">
            <?php 
            // Show content only in editor for visibility, hidden on front-end so React has full control
            the_content(); 
            ?>
        </div>
        <?php 
    endwhile; 
endif; 

// 2. REACT AREA: Only show on front-end, NOT in editor
if ( ! $is_editor ) :
    ?>
    <div id="root"></div>
    
    <?php
    // SEO: Prerender ALL opportunities as HTML for search engines
    // This ensures EVERY opportunity is visible in "View Page Source" for Google indexing
    // Output directly in HTML (not in noscript) so search engines can index it
    // The function ai_in_society_get_opportunities_for_seo() fetches ALL published opportunities
    $seo_opportunities = ai_in_society_get_opportunities_for_seo();
    if ( ! empty( $seo_opportunities ) ) :
    ?>
    <!-- SEO: All Opportunities Prerendered for Search Engine Indexing -->
    <!-- This content is visible in View Page Source for Google indexing -->
    <!-- Total opportunities: <?php echo count($seo_opportunities); ?> -->
    <div id="opportunities-seo-content" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;" aria-hidden="true">
        <h2>AI Opportunities Board</h2>
        <ul>
            <?php foreach ( $seo_opportunities as $job ) : ?>
            <li>
                <h3><?php echo $job['role']; ?></h3>
                <p><strong>Organization:</strong> <?php echo $job['company']; ?></p>
                <p><strong>Location:</strong> <?php echo $job['location']; ?></p>
                <p><strong>Region:</strong> <?php echo implode(', ', $job['region']); ?></p>
                <p><strong>Type:</strong> <?php echo $job['type']; ?></p>
                <p><strong>Category:</strong> <?php echo $job['category']; ?></p>
                <p><strong>Posted:</strong> <?php echo $job['posted']; ?></p>
                <p><?php echo $job['description']; ?></p>
                <p><a href="<?php echo $job['url']; ?>" rel="noopener noreferrer">View Opportunity</a></p>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>
    
    <?php
else :
    // In editor, show a placeholder instead of React root
    ?>
    <div style="padding: 20px; background: #f0f0f0; border: 2px dashed #ccc; text-align: center; margin: 20px 0;">
        <p style="color: #666; margin: 0;">React App will load here on the front-end</p>
    </div>
    <?php
endif;

get_footer(); // Required for scripts to load correctly
?>