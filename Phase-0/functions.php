<?php
/**
 * AI in Society Hub Theme Functions
 * 
 * @package AI_in_Society_Hub
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue SPA assets: Tailwind CSS and React bundle
 * CRITICAL: For SPA template, ensure React loads on #root div
 * FIXED: Scripts load in preview mode, only blocked in actual editor UI
 */
function ai_in_society_enqueue_assets() {
    $theme_version = '13.8.0';
    $assets_uri = get_template_directory_uri();
    $assets_dir = get_template_directory();
    
    // PRECISE editor detection - only block when actually in editor UI, not preview
    $is_elementor_editor = false;
    $is_gutenberg_editor_ui = false;
    
    // Elementor: Only block if actually in edit mode (not preview)
    if ( class_exists( '\Elementor\Plugin' ) ) {
        $is_elementor_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
    }
    
    // Gutenberg: Only block if in the actual editor UI (wp-admin/post.php with action=edit)
    // NOT in preview mode, NOT in REST API calls from front-end
    if ( is_admin() ) {
        // Check if we're in the Gutenberg editor screen (not just any admin page)
        $screen = get_current_screen();
        if ( $screen && ( $screen->is_block_editor() || ( isset( $_GET['action'] ) && $_GET['action'] === 'edit' ) ) ) {
            // Only block if we're actually in the editor UI, not in preview iframe
            if ( ! isset( $_GET['preview'] ) && ! isset( $_GET['_wp-find-template'] ) ) {
                $is_gutenberg_editor_ui = true;
            }
        }
    }
    
    // Enqueue tailwind-static.css - ALWAYS load (editor + front-end + preview)
    $tailwind_css_path = $assets_dir . '/dist/assets/tailwind-static.css';
    if (file_exists($tailwind_css_path)) {
        wp_enqueue_style(
            'ai-in-society-tailwind-static',
            $assets_uri . '/dist/assets/tailwind-static.css',
            array(),
            $theme_version
        );
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('AI in Society Hub: Enqueued Tailwind CSS: ' . $assets_uri . '/dist/assets/tailwind-static.css');
        }
    }
    
    // Enqueue React bundle for SPA
    // Load on: front-end, preview mode
    // Block only in: actual Elementor/Gutenberg editor UI
    $should_load_react = ! $is_elementor_editor && ! $is_gutenberg_editor_ui;
    
    if ( $should_load_react ) {
        // Use the specific build file
        $js_filename = 'index-CLsCaM2I.js';
        $js_file = $assets_dir . '/dist/assets/' . $js_filename;
        
        if (file_exists($js_file)) {
            wp_enqueue_script(
                'ai-in-society-react-spa',
                get_template_directory_uri() . '/dist/assets/index-CLsCaM2I.js',
                array(),
                '13.8.0', 
                true
            );
            
            // Mark as module script - MUST be added before wp_footer()
            add_filter('script_loader_tag', function($tag, $handle, $src) use ($js_url) {
                if ('ai-in-society-react-spa' === $handle) {
                    $module_tag = '<script type="module" crossorigin src="' . esc_url($src) . '"></script>' . "\n";
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        error_log('AI in Society Hub: Script loader tag filter applied for: ' . $src);
                    }
                    return $module_tag;
                }
                return $tag;
            }, 10, 3);
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('AI in Society Hub: Enqueued React SPA bundle: ' . $js_url);
                error_log('AI in Society Hub: Should load React: ' . ($should_load_react ? 'YES' : 'NO'));
                error_log('AI in Society Hub: Elementor editor: ' . ($is_elementor_editor ? 'YES' : 'NO'));
                error_log('AI in Society Hub: Gutenberg editor UI: ' . ($is_gutenberg_editor_ui ? 'YES' : 'NO'));
            }
            
            // Localize AJAX URL for React frontend subscription form
            wp_localize_script('ai-in-society-react-spa', 'aiInSocietyAjax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('ai_in_society_subscribe_nonce')
            ));
        } else {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('AI in Society Hub: ERROR - React bundle not found in: ' . $assets_dir);
            }
        }
    } else {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('AI in Society Hub: React NOT loaded - Elementor: ' . ($is_elementor_editor ? 'YES' : 'NO') . ', Gutenberg UI: ' . ($is_gutenberg_editor_ui ? 'YES' : 'NO'));
        }
    }
    
    // Only load other CSS files on front-end/preview (not in editor UI to avoid conflicts)
    if ( $should_load_react ) {
        $css_files = glob($assets_dir . '/dist/assets/*.css');
        if ($css_files) {
            foreach ($css_files as $css_file) {
                $css_filename = basename($css_file);
                
                // Skip tailwind-static.css as we already enqueued it
                if ($css_filename === 'tailwind-static.css') {
                    continue;
                }
                
                $css_url = $assets_uri . '/dist/assets/' . $css_filename;
                wp_enqueue_style(
                    'ai-in-society-style-' . sanitize_file_name($css_filename),
                    $css_url,
                    array(),
                    $theme_version
                );
                
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('AI in Society Hub: Enqueued CSS: ' . $css_url);
                }
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'ai_in_society_enqueue_assets');


/**
 * Add editor styles for Gutenberg editor
 * This ensures fonts and layout are visible while editing
 */
function ai_in_society_add_editor_styles() {
    $assets_uri = get_template_directory_uri() . '/dist/assets/';
    $tailwind_css_path = get_template_directory() . '/dist/assets/tailwind-static.css';
    
    if (file_exists($tailwind_css_path)) {
        add_editor_style($assets_uri . 'tailwind-static.css');
    }
    
    // Also add Google Fonts for editor
    add_editor_style('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
}
add_action('admin_init', 'ai_in_society_add_editor_styles');

/**
 * Add theme support
 * CRITICAL: Include editor support for Gutenberg/Elementor
 */
function ai_in_society_theme_setup() {
    // Add theme support for post thumbnails
    add_theme_support('post-thumbnails');
    
    // Add theme support for title tag
    add_theme_support('title-tag');
    
    // Add theme support for HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // CRITICAL: Enable wide and full alignment for Gutenberg editor
    add_theme_support('align-wide');
    
    // CRITICAL: Enable responsive embeds for editor
    add_theme_support('responsive-embeds');
    
    // CRITICAL: Enable editor styles
    add_theme_support('editor-styles');
    
    // CRITICAL: Enable custom line height
    add_theme_support('custom-line-height');
    
    // CRITICAL: Enable custom spacing
    add_theme_support('custom-spacing');
}
add_action('after_setup_theme', 'ai_in_society_theme_setup');

/**
 * Enable CORS for WordPress REST API (if needed)
 * CRITICAL: Never block wp-json or REST API - editor needs this!
 */
function ai_in_society_rest_api_cors() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Expose-Headers: X-WP-Total');
        return $value;
    });
}
add_action('rest_api_init', 'ai_in_society_rest_api_cors', 15);

/**
 * Ensure REST API is always accessible for editor
 * This prevents any accidental blocking of wp-json endpoints
 */
function ai_in_society_ensure_rest_api_access() {
    // Never block REST API - it's required for Gutenberg and Elementor
    if ( ! defined( 'REST_REQUEST' ) ) {
        // Allow REST API requests
        add_filter('rest_authentication_errors', function($result) {
            // Don't block authenticated requests
            if ( ! empty( $result ) ) {
                return $result;
            }
            return $result;
        }, 20);
    }
}
add_action('rest_api_init', 'ai_in_society_ensure_rest_api_access', 5);

/**
 * Static Best Sellers Books (exact replica from laptop version)
 */
function ai_in_society_get_initial_best_sellers() {
    return array(
        array('title' => 'Superintelligence: Paths, Dangers, Strategies', 'author' => 'Nick Bostrom', 'description' => 'A seminal work on the potential risks of AGI.', 'coverColor' => '#1B3D7B', 'rating' => 4.5, 'reviewCount' => 3200, 'rank' => 1, 'asin' => '0199678111'),
        array('title' => 'Life 3.0: Being Human in the Age of AI', 'author' => 'Max Tegmark', 'description' => 'How AI will affect crime, war, justice, jobs, society and our very sense of being human.', 'coverColor' => '#10b981', 'rating' => 4.7, 'reviewCount' => 4500, 'rank' => 2, 'asin' => '1101946598'),
        array('title' => 'The Coming Wave', 'author' => 'Mustafa Suleyman', 'description' => 'Technology, Power, and the Twenty-first Century\'s Greatest Dilemma.', 'coverColor' => '#ef4444', 'rating' => 4.6, 'reviewCount' => 1200, 'rank' => 3, 'asin' => 'B0BT6Y69QC'),
        array('title' => 'Human Compatible', 'author' => 'Stuart Russell', 'description' => 'Artificial Intelligence and the Problem of Control.', 'coverColor' => '#f59e0b', 'rating' => 4.6, 'reviewCount' => 1800, 'rank' => 4, 'asin' => '0525558616'),
        array('title' => 'Nexus: A Brief History of Information Networks', 'author' => 'Yuval Noah Harari', 'description' => 'Looking at how information networks have made and broken our world.', 'coverColor' => '#6366f1', 'rating' => 4.8, 'reviewCount' => 5000, 'rank' => 5, 'asin' => '0062871331'),
        array('title' => 'Co-Intelligence', 'author' => 'Ethan Mollick', 'description' => 'Living and Working with AI.', 'coverColor' => '#8b5cf6', 'rating' => 4.9, 'reviewCount' => 850, 'rank' => 6, 'asin' => '0593716722'),
        array('title' => 'The Worlds I See', 'author' => 'Fei-Fei Li', 'description' => 'Curiosity, Exploration, and Discovery at the Dawn of AI.', 'coverColor' => '#ec4899', 'rating' => 4.9, 'reviewCount' => 1100, 'rank' => 7, 'asin' => '1250897880'),
        array('title' => 'AI 2041', 'author' => 'Kai-Fu Lee', 'description' => 'Ten Visions for Our Future.', 'coverColor' => '#14b8a6', 'rating' => 4.4, 'reviewCount' => 2300, 'rank' => 8, 'asin' => '059323829X'),
        array('title' => 'Prediction Machines', 'author' => 'Agrawal et al.', 'description' => 'The Simple Economics of Artificial Intelligence.', 'coverColor' => '#f97316', 'rating' => 4.5, 'reviewCount' => 900, 'rank' => 9, 'asin' => '1633695670'),
        array('title' => 'Genius Makers', 'author' => 'Cade Metz', 'description' => 'The Mavericks Who Brought AI to Google, Facebook, and the World.', 'coverColor' => '#06b6d4', 'rating' => 4.6, 'reviewCount' => 750, 'rank' => 10, 'asin' => '1524742671'),
        array('title' => 'Atlas of AI', 'author' => 'Kate Crawford', 'description' => 'Power, Politics, and the Planetary Costs of Artificial Intelligence.', 'coverColor' => '#84cc16', 'rating' => 4.3, 'reviewCount' => 600, 'rank' => 11, 'asin' => '0300209574'),
        array('title' => 'Rebooting AI', 'author' => 'Gary Marcus', 'description' => 'Building Artificial Intelligence We Can Trust.', 'coverColor' => '#a855f7', 'rating' => 4.2, 'reviewCount' => 800, 'rank' => 12, 'asin' => '1524748254')
    );
}

/**
 * Static Top Rated Books (exact replica from laptop version)
 */
function ai_in_society_get_initial_top_rated() {
    return array(
        array('title' => 'Deep Learning', 'author' => 'Ian Goodfellow', 'description' => 'The bible of deep learning.', 'coverColor' => '#6366f1', 'rating' => 4.9, 'reviewCount' => 800, 'asin' => '0262035618'),
        array('title' => 'Artificial Intelligence: A Modern Approach', 'author' => 'Stuart Russell & Peter Norvig', 'description' => 'The standard textbook for AI.', 'coverColor' => '#8b5cf6', 'rating' => 4.8, 'reviewCount' => 2100, 'asin' => '0134610997'),
        array('title' => 'Chip War', 'author' => 'Chris Miller', 'description' => 'The Fight for the World\'s Most Critical Technology.', 'coverColor' => '#ec4899', 'rating' => 4.8, 'reviewCount' => 5000, 'asin' => '1982172002'),
        array('title' => 'Scary Smart', 'author' => 'Mo Gawdat', 'description' => 'The Future of Artificial Intelligence and How You Can Save Our World.', 'coverColor' => '#14b8a6', 'rating' => 4.7, 'reviewCount' => 3000, 'asin' => '1529077651'),
        array('title' => 'Algorithms to Live By', 'author' => 'Brian Christian', 'description' => 'The Computer Science of Human Decisions.', 'coverColor' => '#f43f5e', 'rating' => 4.7, 'reviewCount' => 4000, 'asin' => '1627790365'),
        array('title' => 'The Master Algorithm', 'author' => 'Pedro Domingos', 'description' => 'How the Quest for the Ultimate Learning Machine Will Remake Our World.', 'coverColor' => '#eab308', 'rating' => 4.3, 'reviewCount' => 1500, 'asin' => '0465065708'),
        array('title' => 'Machine Learning Yearning', 'author' => 'Andrew Ng', 'description' => 'Technical strategy for AI engineers.', 'coverColor' => '#3b82f6', 'rating' => 4.8, 'reviewCount' => 2000, 'asin' => '1732265108'),
        array('title' => 'Pattern Recognition and Machine Learning', 'author' => 'Christopher Bishop', 'description' => 'A comprehensive introduction to the fields of pattern recognition and machine learning.', 'coverColor' => '#ef4444', 'rating' => 4.6, 'reviewCount' => 900, 'asin' => '0387310738')
    );
}

/**
 * Fetch dashboard content from Gemini API (replicates exact laptop logic)
 * Cached with WordPress transients (_v35)
 */
function ai_in_society_fetch_dashboard_content() {
    $cache_key = 'ai_hub_dashboard_FINAL';
    $cached = get_transient($cache_key);
    
    if ($cached !== false) {
    // 1. Hand the data to the visitor IMMEDIATELY
    return $cached; 
}
    
    $api_key = defined('VITE_GEMINI_API_KEY') ? VITE_GEMINI_API_KEY : getenv('VITE_GEMINI_API_KEY');
    if (empty($api_key)) {
        // Return fallback data - removed all hard-coded article data
        // Site now strictly relies on live WordPress database
        $fallback = array(
            'heroArticle' => array(
                'title' => '',
                'summary' => '',
                'category' => 'General',
                'articleType' => 'Analysis',
                'author' => '',
                'date' => '',
                'readTime' => '0 min read',
                'views' => 0
            ),
            'featuredArticles' => array(),
            'opportunities' => array(),
            'mustReadBooks' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 6)
        );
        set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
        return $fallback;
    }
    
    // Call Gemini API with exact schema from laptop version
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=' . $api_key;
    
    $payload = array(
        'contents' => array(
            array('parts' => array(
                array('text' => 'Generate content for a high-tech AI magazine website. Include a hero article, 3 featured articles, 4 job opportunities, and 6 must-read books about AI (Best Sellers). Dates should be futuristic. Articles must have an articleType of either \'Perspective\', \'Analysis\', or \'Long-read\'.')
            ))
        ),
        'generationConfig' => array(
            'responseMimeType' => 'application/json',
            'responseSchema' => array(
                'type' => 'OBJECT',
                'properties' => array(
                    'heroArticle' => array(
                        'type' => 'OBJECT',
                        'properties' => array(
                            'title' => array('type' => 'STRING'),
                            'summary' => array('type' => 'STRING'),
                            'category' => array('type' => 'STRING'),
                            'articleType' => array('type' => 'STRING', 'enum' => array('Perspective', 'Analysis', 'Long-read')),
                            'author' => array('type' => 'STRING'),
                            'date' => array('type' => 'STRING'),
                            'readTime' => array('type' => 'STRING'),
                            'views' => array('type' => 'NUMBER')
                        )
                    ),
                    'featuredArticles' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'OBJECT',
                            'properties' => array(
                                'title' => array('type' => 'STRING'),
                                'summary' => array('type' => 'STRING'),
                                'category' => array('type' => 'STRING'),
                                'articleType' => array('type' => 'STRING', 'enum' => array('Perspective', 'Analysis', 'Long-read')),
                                'author' => array('type' => 'STRING'),
                                'date' => array('type' => 'STRING'),
                                'readTime' => array('type' => 'STRING'),
                                'tags' => array('type' => 'ARRAY', 'items' => array('type' => 'STRING')),
                                'views' => array('type' => 'NUMBER')
                            )
                        )
                    ),
                    'opportunities' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'OBJECT',
                            'properties' => array(
                                'id' => array('type' => 'STRING'),
                                'role' => array('type' => 'STRING'),
                                'company' => array('type' => 'STRING'),
                                'location' => array('type' => 'STRING'),
                                'region' => array('type' => 'STRING', 'enum' => array('North America', 'Europe', 'Asia', 'Remote Global', 'Others')),
                                'type' => array('type' => 'STRING', 'enum' => array('Remote', 'On-site', 'Hybrid')),
                                'category' => array('type' => 'STRING', 'enum' => array('Full-time', 'Part-time', 'Fellowship', 'Funding', 'Internship', 'Training', 'Volunteering', 'Others')),
                                'posted' => array('type' => 'STRING'),
                                'description' => array('type' => 'STRING'),
                                'url' => array('type' => 'STRING')
                            )
                        )
                    ),
                    'mustReadBooks' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'OBJECT',
                            'properties' => array(
                                'title' => array('type' => 'STRING'),
                                'author' => array('type' => 'STRING'),
                                'description' => array('type' => 'STRING'),
                                'coverColor' => array('type' => 'STRING'),
                                'asin' => array('type' => 'STRING')
                            )
                        )
                    )
                )
            )
        )
    );
    
    $response = wp_remote_post($url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($payload),
        'timeout' => 2 
    ));
    
    if (is_wp_error($response)) {
        // Fallback on error - removed all hard-coded article data
        // Site now strictly relies on live WordPress database
        $fallback = array(
            'heroArticle' => array(
                'title' => '',
                'summary' => '',
                'category' => 'General',
                'articleType' => 'Analysis',
                'author' => '',
                'date' => '',
                'readTime' => '0 min read',
                'views' => 0
            ),
            'featuredArticles' => array(),
            'opportunities' => array(),
            'mustReadBooks' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 6)
        );
        set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
        return $fallback;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        $json_text = $data['candidates'][0]['content']['parts'][0]['text'];
        $dashboard_data = json_decode($json_text, true);
        
        // Sanitize arrays
        $dashboard_data['featuredArticles'] = isset($dashboard_data['featuredArticles']) ? $dashboard_data['featuredArticles'] : array();
        $dashboard_data['opportunities'] = isset($dashboard_data['opportunities']) ? $dashboard_data['opportunities'] : array();
        
        // Use static books (exact replica of laptop logic)
        $dashboard_data['mustReadBooks'] = array_slice(ai_in_society_get_initial_best_sellers(), 0, 6);
        
        // Cache for 24 hours
        set_transient($cache_key, $dashboard_data, HOUR_IN_SECONDS * 24);
        return $dashboard_data;
    }
    
    // Fallback on error - removed all hard-coded article data
    // Site now strictly relies on live WordPress database
    $fallback = array(
        'heroArticle' => array(
            'title' => '',
            'summary' => '',
            'category' => 'General',
            'articleType' => 'Analysis',
            'author' => '',
            'date' => '',
            'readTime' => '0 min read',
            'views' => 0
        ),
        'featuredArticles' => array(),
        'opportunities' => array(),
        'mustReadBooks' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 6)
    );
    set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
    return $fallback;
}

/**
 * Fetch books page content from Gemini API (replicates exact laptop logic)
 * Cached with WordPress transients (_v35)
 */
function ai_in_society_fetch_books_content() {
    $cache_key = 'ai_hub_books_v35';
    $cached = get_transient($cache_key);
    
  if ($cached !== false) {
    // 1. Hand the data to the visitor IMMEDIATELY
    return $cached; 
}
    
    $api_key = defined('VITE_GEMINI_API_KEY') ? VITE_GEMINI_API_KEY : getenv('VITE_GEMINI_API_KEY');
    if (empty($api_key)) {
        $fallback = array(
            'bestSellers' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 12),
            'topRated' => array_slice(ai_in_society_get_initial_top_rated(), 0, 12)
        );
        set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
        return $fallback;
    }
    
    // Call Gemini API with exact schema from laptop version
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=' . $api_key;
    
    $payload = array(
        'contents' => array(
            array('parts' => array(
                array('text' => 'Act as a scraper extracting data from the Amazon \'Artificial Intelligence\' book category. Provide two lists: exactly 12 \'Best Sellers\' (highly popular, mainstream) and exactly 12 \'Top Rated\' (high technical acclaim, classics). Include rating (4.0-5.0), reviewCount, and typical price.')
            ))
        ),
        'generationConfig' => array(
            'responseMimeType' => 'application/json',
            'responseSchema' => array(
                'type' => 'OBJECT',
                'properties' => array(
                    'bestSellers' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'OBJECT',
                            'properties' => array(
                                'title' => array('type' => 'STRING'),
                                'author' => array('type' => 'STRING'),
                                'description' => array('type' => 'STRING'),
                                'coverColor' => array('type' => 'STRING'),
                                'rating' => array('type' => 'NUMBER'),
                                'reviewCount' => array('type' => 'INTEGER'),
                                'rank' => array('type' => 'INTEGER'),
                                'asin' => array('type' => 'STRING')
                            )
                        )
                    ),
                    'topRated' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'OBJECT',
                            'properties' => array(
                                'title' => array('type' => 'STRING'),
                                'author' => array('type' => 'STRING'),
                                'description' => array('type' => 'STRING'),
                                'coverColor' => array('type' => 'STRING'),
                                'rating' => array('type' => 'NUMBER'),
                                'reviewCount' => array('type' => 'INTEGER'),
                                'asin' => array('type' => 'STRING')
                            )
                        )
                    )
                )
            )
        )
    );
    
    $response = wp_remote_post($url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($payload),
        'timeout' => 2 
    ));
    
    if (is_wp_error($response)) {
        $fallback = array(
            'bestSellers' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 12),
            'topRated' => array_slice(ai_in_society_get_initial_top_rated(), 0, 12)
        );
        set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
        return $fallback;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        $json_text = $data['candidates'][0]['content']['parts'][0]['text'];
        $books_data = json_decode($json_text, true);
        
        // Sanitize arrays
        $books_data['bestSellers'] = isset($books_data['bestSellers']) ? $books_data['bestSellers'] : array();
        $books_data['topRated'] = isset($books_data['topRated']) ? $books_data['topRated'] : array();
        
        // Exact replica of laptop logic: Merge static with generated, filter duplicates, limit to 12
        $static_best_sellers = ai_in_society_get_initial_best_sellers();
        $static_titles = array();
        foreach ($static_best_sellers as $book) {
            $static_titles[$book['title']] = true;
        }
        
        // Filter out duplicates from generated books
        $new_generated = array();
        foreach ($books_data['bestSellers'] as $book) {
            if (!isset($static_titles[$book['title']])) {
                $new_generated[] = $book;
            }
        }
        
        // Merge: static first, then generated, limit to 12
        $merged_best_sellers = array_merge($static_best_sellers, $new_generated);
        $books_data['bestSellers'] = array_slice($merged_best_sellers, 0, 12);
        
        // --- MAXIMUM ACCURACY LOGIC FOR BEST SELLERS ---
        foreach ($books_data['bestSellers'] as $index => &$book) {
            $book['rank'] = $index + 1;
            
            // Check if it's one of your verified books (Safe PHP version check using strpos)
            $is_verified = !empty($book['asin']) && strpos($book['asin'], 'PLACEHOLDER') === false;
            
            // If it's NOT a verified ASIN, use Search with "book" keyword to ensure it works
            if (!$is_verified) {
                $book['amazon_url'] = 'https://www.amazon.com/s?k=' . urlencode($book['title'] . ' ' . $book['author'] . ' book');
            } else {
                $book['amazon_url'] = 'https://www.amazon.com/dp/' . trim($book['asin']);
            }
            
            // Add affiliate tag with safe append logic
            if (strpos($book['amazon_url'], '?') !== false) {
                $book['amazon_url'] .= '&tag=hungyushing-20';
            } else {
                $book['amazon_url'] .= '?tag=hungyushing-20';
            }
        }
        
        // Limit topRated to 12 and ensure URL accuracy
        $books_data['topRated'] = array_slice($books_data['topRated'], 0, 12);
        
        // --- MAXIMUM ACCURACY LOGIC FOR TOP RATED ---
        foreach ($books_data['topRated'] as $index => &$book) {
             // For Top Rated, search is safer than generated ASINs if they contain placeholders
             if (empty($book['asin']) || strpos($book['asin'], 'PLACEHOLDER') !== false) {
                $book['amazon_url'] = 'https://www.amazon.com/s?k=' . urlencode($book['title'] . ' ' . $book['author'] . ' book');
            } else {
                $book['amazon_url'] = 'https://www.amazon.com/dp/' . trim($book['asin']);
            }
            
            // Add affiliate tag with safe append logic
            if (strpos($book['amazon_url'], '?') !== false) {
                $book['amazon_url'] .= '&tag=hungyushing-20';
            } else {
                $book['amazon_url'] .= '?tag=hungyushing-20';
            }
        }
        
        // Cache for 24 hours
        set_transient($cache_key, $books_data, HOUR_IN_SECONDS * 24);
        return $books_data;
    }
    
    // Fallback on error
    $fallback = array(
        'bestSellers' => array_slice(ai_in_society_get_initial_best_sellers(), 0, 12),
        'topRated' => array_slice(ai_in_society_get_initial_top_rated(), 0, 12)
    );
    set_transient($cache_key, $fallback, HOUR_IN_SECONDS * 24);
    return $fallback;
}


/**
 * Register REST API endpoints
 */
function ai_in_society_register_rest_routes() {
    register_rest_route('ai-hub/v1', '/dashboard', array(
        'methods' => 'GET',
        'callback' => 'ai_in_society_rest_dashboard',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('ai-hub/v1', '/books', array(
        'methods' => 'GET',
        'callback' => 'ai_in_society_rest_books',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('ai-hub/v1', '/board-data-stream', array(
        'methods' => 'GET',
        'callback' => 'ai_in_society_rest_jobs',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('ai-hub/v1', '/articles', array(
        'methods' => 'GET',
        'callback' => 'ai_in_society_rest_articles',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('ai-hub/v1', '/scrape-opportunity', array(
        'methods' => 'GET',
        'callback' => 'ai_in_society_rest_scrape_opportunity',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    
    // Note: Subscribe endpoint moved to WordPress AJAX (admin-ajax.php) for better compatibility
}
add_action('rest_api_init', 'ai_in_society_register_rest_routes');

/**
 * Set WPForm ID for subscription form
 * This links the global Subscribe buttons to the Newsletter Signup Form (ID: 91)
 */
add_filter('ai_in_society_subscribe_form_id', function() { 
    return 91;
});

/**
 * REST API callback for dashboard
 */
function ai_in_society_rest_dashboard($request) {
    $data = ai_in_society_fetch_dashboard_content();
    return new WP_REST_Response($data, 200);
}

/**
 * REST API callback for books
 */
function ai_in_society_rest_books($request) {
    $data = ai_in_society_fetch_books_content();
    return new WP_REST_Response($data, 200);
}

/**
 * Helper function to fetch and format ALL published opportunity posts
 * This is used by both the REST API and SEO prerender functions
 * 
 * @param bool $escape_html Whether to escape HTML for safe output (true for SEO, false for JSON API)
 * @return array Array of formatted opportunity data
 */
function ai_in_society_fetch_all_opportunities($escape_html = false) {
    // Use get_posts() instead of WP_Query to avoid global query collision
    // This prevents the 'Opportunities' page object from hijacking the REST API response
    $args = array(
        'post_type'        => 'opportunity',
        'numberposts'       => 100, // Explicit count to override Sandbox defaults
        'post_status'       => 'publish', // Only published posts
        'suppress_filters'  => true, // CRITICAL: Kill ghost filters - prevent plugins from hijacking query
        'orderby'           => 'date',
        'order'             => 'DESC'
    );
    
    // Get posts directly - this bypasses global query state completely
    $opportunities = get_posts($args);
    $jobs = array();
    
    // MASTER LIST: Only these regions are allowed in the filter dropdown
    $valid_regions = array('US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others');
    
    // Loop through the posts array directly
    foreach ($opportunities as $post) {
        $raw_regions = get_post_meta($post->ID, 'opportunity_region', true);
        
        // CLEANING LOGIC: This stops the long "messy" strings from appearing
        $cleaned_regions = array();
        
        if (is_array($raw_regions)) {
            foreach ($raw_regions as $r) {
                if (in_array($r, $valid_regions)) {
                    $cleaned_regions[] = $r;
                }
            }
        } elseif (is_string($raw_regions)) {
            // If the database has a joined string, split it into separate valid regions
            foreach ($valid_regions as $valid) {
                if (strpos($raw_regions, $valid) !== false) {
                    $cleaned_regions[] = $valid;
                }
            }
        }
        
        if (empty($cleaned_regions)) { 
            $cleaned_regions = array('Others'); 
        }
        
        // Format the job data
        $job_data = array(
            'id'          => $post->ID,
            'role'        => $post->post_title,
            'company'     => get_post_meta($post->ID, 'opportunity_organization', true) ?: 'Organization',
            'location'    => get_post_meta($post->ID, 'opportunity_location', true) ?: 'Remote',
            'region'      => array_values(array_unique($cleaned_regions)),
            'type'        => get_post_meta($post->ID, 'opportunity_work_type', true) ?: 'Remote',
            'category'    => get_post_meta($post->ID, 'opportunity_category', true) ?: 'Others',
            'posted'      => get_the_date('M j, Y', $post),
            'description' => strip_tags($post->post_content),
            'url'         => get_post_meta($post->ID, 'opportunity_apply_url', true) ?: get_permalink($post->ID)
        );
        
        // Escape HTML if needed (for SEO output)
        if ($escape_html) {
            $job_data['role'] = esc_html($job_data['role']);
            $job_data['company'] = esc_html($job_data['company']);
            $job_data['location'] = esc_html($job_data['location']);
            $job_data['region'] = array_map('esc_html', $job_data['region']);
            $job_data['type'] = esc_html($job_data['type']);
            $job_data['category'] = esc_html($job_data['category']);
            $job_data['posted'] = esc_html($job_data['posted']);
            $job_data['description'] = esc_html($job_data['description']);
            $job_data['url'] = esc_url($job_data['url']);
        }
        
        $jobs[] = $job_data;
    }
    
    return $jobs;
}

/**
 * REST API callback for jobs
 * Curated Hub: Fetches ALL opportunity posts from WordPress database
 */
function ai_in_society_rest_jobs($request) {
    // Bypass template redirects - stops WordPress Sandbox from redirecting API requests
    remove_action('template_redirect', 'redirect_canonical');
    
    $jobs = ai_in_society_fetch_all_opportunities(false); // Don't escape for JSON API
    
    // Use WordPress rest_ensure_response wrapper for standardized REST object format
    return rest_ensure_response($jobs);
}

/**
 * Get opportunities formatted for server-side HTML output (SEO)
 * Returns ALL published opportunities as an array for prerendering
 * This ensures every opportunity is visible in "View Page Source" for Google indexing
 * 
 * @return array Array of opportunity data for HTML output (with escaped HTML)
 */
function ai_in_society_get_opportunities_for_seo() {
    // Fetch ALL opportunities with HTML escaping for safe output
    return ai_in_society_fetch_all_opportunities(true);
}

/**
 * REST API callback for articles
 */
function ai_in_society_rest_articles($request) {
    $args = array(
        'post_type'      => 'post',
        'posts_per_page' => -1, // Get all published posts
        'post_status'    => 'publish',
        'suppress_filters' => true 
    );
    
    $posts = get_posts($args);
    $articles = array();
    
    foreach ($posts as $post) {
        // Get the first category name, or empty string if none
        $categories = get_the_category($post->ID);
        $category_name = !empty($categories) ? $categories[0]->name : '';
        
        // Get featured image URL
        $featured_image_id = get_post_thumbnail_id($post->ID);
        $featured_image_url = '';
        if ($featured_image_id) {
            $featured_image_url = wp_get_attachment_image_url($featured_image_id, 'large');
        }
        
        // Clean excerpt - remove &hellip; and other HTML entities
        $excerpt = wp_trim_words(strip_tags($post->post_excerpt ?: $post->post_content), 30);
        $excerpt = str_replace('&hellip;', '...', $excerpt);
        $excerpt = html_entity_decode($excerpt, ENT_QUOTES, 'UTF-8');
        
        // Get full post content with WordPress filters applied (preserves formatting, images, etc.)
        $content = apply_filters('the_content', $post->post_content);
        
        // Get author display name from WordPress user profile
        // If empty or looks like an email (contains '@'), default to 'Jason Hung'
        $author_name = get_the_author_meta('display_name', $post->post_author);
        if (empty($author_name) || strpos($author_name, '@') !== false) {
            $author_name = 'Jason Hung';
        }
        
        // Calculate reading time based on word count
        $word_count = str_word_count(strip_tags($post->post_content));
        $reading_time = ceil($word_count / 200); // Standard speed: 200 words per minute
        $read_time_label = $reading_time . ' min read';
        
        $articles[] = array(
            'id'                => $post->ID,
            'title'             => $post->post_title,
            'date'              => get_the_date('M j, Y', $post),
            'excerpt'           => $excerpt,
            'content'           => $content,
            'url'               => get_permalink($post->ID),
            'slug'              => $post->post_name, // WordPress post slug (sanitized title)
            'category'          => $category_name,
            'featured_image_url' => $featured_image_url,
            'author'            => $author_name,
            'readTime'          => $read_time_label
        );
    }
    
    // STOP WordPress from adding extra text that breaks the board
    header('Content-Type: application/json');
    echo json_encode($articles);
    exit;
}

/**
 * Automatically find and enqueue the React JS bundle as a Module
 * DISABLED: React bundle is now loaded directly in footer.php with Elementor check
 * to prevent it from loading in the Elementor editor.
 */
/*
function ai_in_society_enqueue_react_js() {
    $assets_dir = get_template_directory() . '/dist/assets/';
    $assets_uri = get_template_directory_uri() . '/dist/assets/';
    
    $js_files = glob($assets_dir . 'index-*.js'); 
    
    if ($js_files) {
        $js_filename = basename($js_files[0]);
        wp_enqueue_script(
            'ai-in-society-react',
            $assets_uri . $js_filename,
            array(),
            '1.1.2', 
            true 
        );

        add_filter('script_loader_tag', function($tag, $handle, $src) {
            if ('ai-in-society-react' !== $handle) {
                return $tag;
            }
            return '<script type="module" src="' . esc_url($src) . '"></script>';
        }, 10, 3);
    }
}
add_action('wp_enqueue_scripts', 'ai_in_society_enqueue_react_js');
*/

/**
 * Register Opportunity Custom Post Type
 * Curated Hub: Manual opportunity management via WordPress admin
 */
function ai_in_society_register_opportunity_cpt() {
    $labels = array(
        'name' => 'Opportunities',
        'singular_name' => 'Opportunity',
        'menu_name' => 'Opportunities',
        'add_new' => 'Add New',
        'add_new_item' => 'Add New Opportunity',
        'edit_item' => 'Edit Opportunity',
        'new_item' => 'New Opportunity',
        'view_item' => 'View Opportunity',
        'search_items' => 'Search Opportunities',
        'not_found' => 'No opportunities found',
        'not_found_in_trash' => 'No opportunities found in Trash'
    );
    
    $args = array(
        'labels' => $labels,
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'opportunity'),
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'has_archive' => true,
        'hierarchical' => false,
        'menu_position' => 20,
        'menu_icon' => 'dashicons-businessperson',
        'supports' => array('title', 'editor', 'thumbnail'),
        'show_in_rest' => true, // Force REST API access
        'rest_base' => 'opportunities-api', // Define explicit REST base to prevent mapping conflicts
    );
    
    register_post_type('opportunity', $args);
}
add_action('init', 'ai_in_society_register_opportunity_cpt');

/**
 * Flush rewrite rules when theme is activated to ensure CPT is registered
 */
function ai_in_society_flush_rewrite_rules() {
    ai_in_society_register_opportunity_cpt();
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'ai_in_society_flush_rewrite_rules');

/**
 * Register Custom Fields for Opportunity CPT
 * Fields: Organization, Location, Apply URL, Region, Work Type, Category
 */
function ai_in_society_register_opportunity_meta_boxes() {
    add_meta_box(
        'opportunity_details',
        'Opportunity Details',
        'ai_in_society_opportunity_meta_box_callback',
        'opportunity',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'ai_in_society_register_opportunity_meta_boxes');

/**
 * Meta box callback for opportunity custom fields
 */
function ai_in_society_opportunity_meta_box_callback($post) {
    wp_nonce_field('ai_in_society_save_opportunity_meta', 'opportunity_meta_nonce');
    
    $organization = get_post_meta($post->ID, 'opportunity_organization', true);
    $location = get_post_meta($post->ID, 'opportunity_location', true);
    $apply_url = get_post_meta($post->ID, 'opportunity_apply_url', true);
    $region = get_post_meta($post->ID, 'opportunity_region', true);
    // Handle both old string format and new array format
    if (!is_array($region)) {
        $region = !empty($region) ? array($region) : array();
    }
    $work_type = get_post_meta($post->ID, 'opportunity_work_type', true);
    $category = get_post_meta($post->ID, 'opportunity_category', true);
    $source_url = get_post_meta($post->ID, 'opportunity_source_url', true);
    
    // Available regions
    $available_regions = array('US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others');
    
    ?>
    <table class="form-table">
        <tr>
            <th><label for="opportunity_source_url">Source URL</label></th>
            <td>
                <input type="url" id="opportunity_source_url" name="opportunity_source_url" value="<?php echo esc_attr($source_url); ?>" class="regular-text" placeholder="https://example.com/job-posting" />
                <button type="button" id="auto-fill-from-url" class="button button-secondary" style="margin-left: 10px;">Auto-Fill from URL</button>
                <span id="auto-fill-status" style="margin-left: 10px;"></span>
            </td>
        </tr>
        <tr>
            <th><label for="opportunity_organization">Organization</label></th>
            <td><input type="text" id="opportunity_organization" name="opportunity_organization" value="<?php echo esc_attr($organization); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="opportunity_location">Location</label></th>
            <td><input type="text" id="opportunity_location" name="opportunity_location" value="<?php echo esc_attr($location); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="opportunity_apply_url">Apply URL</label></th>
            <td><input type="url" id="opportunity_apply_url" name="opportunity_apply_url" value="<?php echo esc_attr($apply_url); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label>Region</label></th>
            <td>
                <fieldset>
                    <legend class="screen-reader-text"><span>Region</span></legend>
                    <?php foreach ($available_regions as $region_option) : ?>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="checkbox" 
                                   name="opportunity_region[]" 
                                   value="<?php echo esc_attr($region_option); ?>"
                                   <?php checked(in_array($region_option, $region), true); ?> />
                            <?php echo esc_html($region_option); ?>
                        </label>
                    <?php endforeach; ?>
                </fieldset>
                <p class="description">Select one or more regions for this opportunity.</p>
            </td>
        </tr>
        <tr>
            <th><label for="opportunity_work_type">Work Type</label></th>
            <td>
                <select id="opportunity_work_type" name="opportunity_work_type">
                    <option value="">Select Work Type</option>
                    <option value="On-site" <?php selected($work_type, 'On-site'); ?>>On-site</option>
                    <option value="Remote" <?php selected($work_type, 'Remote'); ?>>Remote</option>
                    <option value="Hybrid" <?php selected($work_type, 'Hybrid'); ?>>Hybrid</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="opportunity_category">Category</label></th>
            <td>
                <select id="opportunity_category" name="opportunity_category">
                    <option value="">Select Category</option>
                    <option value="Fellowship" <?php selected($category, 'Fellowship'); ?>>Fellowship</option>
                    <option value="Funding" <?php selected($category, 'Funding'); ?>>Funding</option>
                    <option value="Internship" <?php selected($category, 'Internship'); ?>>Internship</option>
                    <option value="Full-time" <?php selected($category, 'Full-time'); ?>>Full-time</option>
                    <option value="Part-time" <?php selected($category, 'Part-time'); ?>>Part-time</option>
                    <option value="Training" <?php selected($category, 'Training'); ?>>Training</option>
                    <option value="Others" <?php selected($category, 'Others'); ?>>Others</option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Save opportunity custom fields
 */
function ai_in_society_save_opportunity_meta($post_id) {
    // Check nonce
    if (!isset($_POST['opportunity_meta_nonce']) || !wp_verify_nonce($_POST['opportunity_meta_nonce'], 'ai_in_society_save_opportunity_meta')) {
        return;
    }
    
    // Check autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Check permissions
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Save custom fields
    if (isset($_POST['opportunity_organization'])) {
        update_post_meta($post_id, 'opportunity_organization', sanitize_text_field($_POST['opportunity_organization']));
    }
    
    if (isset($_POST['opportunity_location'])) {
        update_post_meta($post_id, 'opportunity_location', sanitize_text_field($_POST['opportunity_location']));
    }
    
    if (isset($_POST['opportunity_apply_url'])) {
        update_post_meta($post_id, 'opportunity_apply_url', esc_url_raw($_POST['opportunity_apply_url']));
    }
    
    if (isset($_POST['opportunity_region'])) {
        // Handle array of regions from checkboxes
        if (is_array($_POST['opportunity_region'])) {
            $regions = array_map('sanitize_text_field', $_POST['opportunity_region']);
            $regions = array_filter($regions); // Remove empty values
            update_post_meta($post_id, 'opportunity_region', $regions);
        } else {
            // Fallback for old single value format
            update_post_meta($post_id, 'opportunity_region', array(sanitize_text_field($_POST['opportunity_region'])));
        }
    } else {
        // No regions selected, save empty array
        update_post_meta($post_id, 'opportunity_region', array());
    }
    
    if (isset($_POST['opportunity_work_type'])) {
        update_post_meta($post_id, 'opportunity_work_type', sanitize_text_field($_POST['opportunity_work_type']));
    }
    
    if (isset($_POST['opportunity_category'])) {
        update_post_meta($post_id, 'opportunity_category', sanitize_text_field($_POST['opportunity_category']));
    }
    
    if (isset($_POST['opportunity_source_url'])) {
        update_post_meta($post_id, 'opportunity_source_url', esc_url_raw($_POST['opportunity_source_url']));
    }
}
add_action('save_post_opportunity', 'ai_in_society_save_opportunity_meta');

/**
 * REST API endpoint for scraping opportunity data from URL
 */
function ai_in_society_rest_scrape_opportunity($request) {
    $url = $request->get_param('url');
    
    if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
        return new WP_Error('invalid_url', 'Invalid URL provided', array('status' => 400));
    }
    
    // Fetch the URL content
    $response = wp_remote_get($url, array(
        'timeout' => 30,
        'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('fetch_failed', 'Failed to fetch URL: ' . $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    
    // Cleaner text extraction: aggressively remove all HTML, scripts, and styles
    $text_content = wp_strip_all_tags($body, true);
    $text_content = preg_replace('/\s+/', ' ', $text_content); // Normalize whitespace
    $text_content = substr($text_content, 0, 3000); // Limit to 3,000 chars - more than enough for job description
    
    // Call Gemini 3 Flash API
    $api_key = defined('VITE_GEMINI_API_KEY') ? VITE_GEMINI_API_KEY : getenv('VITE_GEMINI_API_KEY');
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Gemini API key not configured', array('status' => 500));
    }
    
    $gemini_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' . $api_key;
    
    // Refined prompt: Focus ONLY on job title, organization, and description
    // Ensure output is valid JSON to avoid parsing errors
    $prompt = 'Analyze this job/grant page and extract ONLY the following information. You MUST return valid JSON. Focus on: 1) Job Title (the role name), 2) Organization Name (the company/institution), 3) A 2-sentence professional description. Also extract Location, Region (You MUST strictly map every location found to one or more of these EXACT categories: US/Canada, UK, EU, Asia, Australia, Remote, Others. Never return specific city names or country names as a region. If a job is in "San Francisco," return only ["US/Canada"]. If it is in "London," return only ["UK"]. For the region field, you must provide an array of strings using ONLY these exact values: US/Canada, UK, EU, Asia, Australia, Remote, Others), Work Type (map to: On-site, Remote, Hybrid), and Category (map to: Fellowship, Funding, Internship, Full-time, Part-time, Training, Others). Your response MUST be valid JSON only.';
    
    $payload = array(
        'contents' => array(
            array('parts' => array(
                array('text' => $prompt . '\n\nPage Content:\n' . $text_content)
            ))
        ),
        'generationConfig' => array(
            'responseMimeType' => 'application/json',
            'thinkingConfig' => array(
                'thinkingLevel' => 'minimal'
            ),
            'responseSchema' => array(
                'type' => 'OBJECT',
                'properties' => array(
                    'roleTitle' => array('type' => 'STRING'),
                    'organizationName' => array('type' => 'STRING'),
                    'location' => array('type' => 'STRING'),
                    'region' => array(
                        'type' => 'ARRAY',
                        'items' => array(
                            'type' => 'STRING',
                            'enum' => array('US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others')
                        )
                    ),
                    'workType' => array('type' => 'STRING', 'enum' => array('On-site', 'Remote', 'Hybrid')),
                    'category' => array('type' => 'STRING', 'enum' => array('Fellowship', 'Funding', 'Internship', 'Full-time', 'Part-time', 'Training', 'Others')),
                    'description' => array('type' => 'STRING')
                )
            )
        )
    );
    
    $gemini_response = wp_remote_post($gemini_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($payload),
        'timeout' => 30
    ));
    
    if (is_wp_error($gemini_response)) {
        return new WP_Error('gemini_failed', 'Gemini API error: ' . $gemini_response->get_error_message(), array('status' => 500));
    }
    
    $gemini_body = wp_remote_retrieve_body($gemini_response);
    $gemini_data = json_decode($gemini_body, true);
    
    // Error handling: Check if Gemini returned an error before parsing
    if (isset($gemini_data['error'])) {
        $error_message = isset($gemini_data['error']['message']) ? $gemini_data['error']['message'] : 'Unknown Gemini API error';
        return new WP_Error('gemini_api_error', 'Gemini API error: ' . $error_message, array('status' => 500));
    }
    
    // Check for valid response structure
    if (isset($gemini_data['candidates'][0]['content']['parts'][0]['text'])) {
        $json_text = $gemini_data['candidates'][0]['content']['parts'][0]['text'];
        $parsed_data = json_decode($json_text, true);
        
        if ($parsed_data && json_last_error() === JSON_ERROR_NONE) {
            return new WP_REST_Response($parsed_data, 200);
        } else {
            // Log JSON parsing error for debugging
            $json_error = json_last_error_msg();
            return new WP_Error('parse_failed', 'Failed to parse Gemini JSON response: ' . $json_error, array('status' => 500));
        }
    }
    
    // Fallback error if response structure is unexpected
    return new WP_Error('parse_failed', 'Failed to parse Gemini response - unexpected response structure', array('status' => 500));
}

/**
 * WordPress AJAX handler for subscription (WPForms integration)
 * Uses official WPForms API for Lite version (no database tables)
 * Falls back to email notification if WPForms processing fails
 * Uses admin-ajax.php instead of REST API for better compatibility
 */
function ai_in_society_ajax_subscribe_user() {
    // Verify nonce for security
    check_ajax_referer('ai_in_society_subscribe_nonce', 'nonce');
    
    error_log('AI_IN_SOCIETY_SUBSCRIBE: WordPress AJAX endpoint called - WPForms API MODE');
    
    // Get email from POST data
    $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
    
    // Validate email
    if (empty($email) || !is_email($email)) {
        $error_msg = 'Invalid email provided: ' . $email;
        error_log('AI_IN_SOCIETY_SUBSCRIBE: ' . $error_msg);
        wp_send_json_error(array(
            'message' => 'Please provide a valid email address.',
            'debug_error' => $error_msg
        ));
    }
    
    error_log('AI_IN_SOCIETY_SUBSCRIBE: Email validated: ' . $email);
    
    // Get Form ID 91 (from filter)
    $form_id = apply_filters('ai_in_society_subscribe_form_id', 91);
    $form_id = absint($form_id);
    
    error_log('AI_IN_SOCIETY_SUBSCRIBE: Using Form ID: ' . $form_id);
    
    // Check if WPForms is active
    if (!function_exists('wpforms')) {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: WPForms plugin not active, using email fallback');
        $email_sent = ai_in_society_send_subscription_email($email, $form_id);
        if ($email_sent) {
            wp_send_json_success(array(
                'message' => 'Thank you for subscribing!'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to process subscription. Please try again later.'
            ));
        }
    }
    
    // Get form data to find email field ID
    $form_post = get_post($form_id);
    if (!$form_post) {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: Form post not found for ID: ' . $form_id);
        $email_sent = ai_in_society_send_subscription_email($email, $form_id);
        if ($email_sent) {
            wp_send_json_success(array(
                'message' => 'Thank you for subscribing!'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Failed to process subscription. Please try again later.'
            ));
        }
    }
    
    // Parse form to find email field
    $form_content = $form_post->post_content;
    $form_data = json_decode($form_content, true);
    $email_field_id = 1; // Default
    
    if (isset($form_data['fields']) && is_array($form_data['fields'])) {
        foreach ($form_data['fields'] as $field_id => $field) {
            if (isset($field['type']) && $field['type'] === 'email') {
                $email_field_id = $field_id;
                error_log('AI_IN_SOCIETY_SUBSCRIBE: Found email field ID: ' . $email_field_id);
                break;
            }
        }
    }
    
    // Prepare form fields array for WPForms processing
    $fields = array(
        $email_field_id => array(
            'value' => $email,
            'id' => $email_field_id,
            'type' => 'email'
        )
    );
    
    error_log('AI_IN_SOCIETY_SUBSCRIBE: Attempting WPForms processing');
    
    // Try to trigger WPForms processing via action hook
    // This will trigger WPForms email notifications if configured
    $wpforms_attempted = false;
    
    if (has_action('wpforms_process_submit')) {
        try {
            // Simulate form submission data structure
            $_POST['wpforms'] = array(
                'id' => $form_id,
                'fields' => array(
                    $email_field_id => $email
                )
            );
            
            // Trigger WPForms processing action
            do_action('wpforms_process_submit', $fields, array(), $form_id);
            $wpforms_attempted = true;
            error_log('AI_IN_SOCIETY_SUBSCRIBE: WPForms process_submit action triggered');
        } catch (Exception $e) {
            error_log('AI_IN_SOCIETY_SUBSCRIBE: WPForms action failed: ' . $e->getMessage());
        }
    }
    
    // Always send email notification to admin as primary method
    // This ensures we never lose a lead, regardless of WPForms status
    error_log('AI_IN_SOCIETY_SUBSCRIBE: Sending email notification to admin');
    $email_sent = ai_in_society_send_subscription_email($email, $form_id);
    
    if ($email_sent) {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: SUCCESS - Email notification sent (WPForms attempted: ' . ($wpforms_attempted ? 'yes' : 'no') . ')');
        wp_send_json_success(array(
            'message' => 'Thank you for subscribing!'
        ));
    } else {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: FAILED - Email notification could not be sent');
        wp_send_json_error(array(
            'message' => 'Failed to process subscription. Please try again later.'
        ));
    }
}

/**
 * Fallback function to send subscription email to admin
 * Ensures we never lose a lead even if WPForms fails
 * 
 * @param string $email Subscriber email address
 * @param int $form_id WPForms form ID
 * @return bool True if email sent successfully, false otherwise
 */
function ai_in_society_send_subscription_email($email, $form_id) {
    $admin_email = get_option('admin_email');
    if (empty($admin_email)) {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: Admin email not configured');
        return false;
    }
    
    $subject = 'New Newsletter Subscription - AI in Society';
    $message = "A new newsletter subscription was received:\n\n";
    $message .= "Email: " . $email . "\n";
    $message .= "Form ID: " . $form_id . "\n";
    $message .= "Date: " . current_time('mysql') . "\n";
    $message .= "IP Address: " . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unknown') . "\n\n";
    $message .= "Note: This email was sent because WPForms processing failed or is unavailable.\n";
    $message .= "Please add this email to your mailing list manually if needed.";
    
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . get_bloginfo('name') . ' <' . $admin_email . '>'
    );
    
    $email_sent = wp_mail($admin_email, $subject, $message, $headers);
    
    if ($email_sent) {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: Fallback email sent successfully to: ' . $admin_email);
    } else {
        error_log('AI_IN_SOCIETY_SUBSCRIBE: Failed to send fallback email');
    }
    
    return $email_sent;
}
// Register AJAX handlers for both logged-in and non-logged-in users
add_action('wp_ajax_subscribe_user', 'ai_in_society_ajax_subscribe_user');
add_action('wp_ajax_nopriv_subscribe_user', 'ai_in_society_ajax_subscribe_user');

/**
 * Enqueue admin scripts for opportunity auto-fill
 */
function ai_in_society_enqueue_opportunity_admin_scripts($hook) {
    global $post_type;
    
    if ($post_type === 'opportunity' && ($hook === 'post.php' || $hook === 'post-new.php')) {
        wp_enqueue_script('jquery');
        
        $rest_url = esc_url(rest_url('ai-hub/v1/scrape-opportunity'));
        $nonce = wp_create_nonce('wp_rest');
        
        // Corrected JS: Using single quotes for the outer string to prevent syntax crashes
        $inline_script = '
        jQuery(document).ready(function($) {
            $("#auto-fill-from-url").on("click", function() {
                var url = $("#opportunity_source_url").val();
                var statusEl = $("#auto-fill-status");
                var button = $(this);
                
                if (!url || !url.startsWith("http")) {
                    statusEl.html("<span style=\'color: red;\'>Please enter a valid URL</span>");
                    return;
                }
                
                button.prop("disabled", true).text("Scraping...");
                statusEl.html("<span style=\'color: blue;\'>Fetching and analyzing...</span>");
                
                $.ajax({
                    url: "' . $rest_url . '",
                    method: "GET",
                    data: { url: url },
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("X-WP-Nonce", "' . $nonce . '");
                    },
                    success: function(response) {
                        if (response.roleTitle) $("#title").val(response.roleTitle);
                        if (response.organizationName) $("#opportunity_organization").val(response.organizationName);
                        if (response.location) $("#opportunity_location").val(response.location);
                        
                        // Handle multiple region checkboxes
                        if (response.region) {
                            $(\'input[name="opportunity_region[]"]\').prop("checked", false);
                            if (Array.isArray(response.region)) {
                                response.region.forEach(function(r) {
                                    $(\'input[name="opportunity_region[]"][value="\' + r + \'"]\').prop("checked", true);
                                });
                            }
                        }
                        
                        if (response.workType) $("#opportunity_work_type").val(response.workType);
                        if (response.category) $("#opportunity_category").val(response.category);
                        if (response.description) {
                            if (typeof wp !== "undefined" && wp.data && wp.data.select("core/editor")) {
                                var htmlContent = "<p>" + response.description.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
                                var blocks = wp.blocks.rawHandler({ HTML: htmlContent });
                                wp.data.dispatch("core/block-editor").resetBlocks(blocks);
                            } else {
                                if (typeof tinyMCE !== "undefined" && tinyMCE.get("content")) {
                                    tinyMCE.get("content").setContent(response.description);
                                } else {
                                    $("#content").val(response.description);
                                }
                            }
                        }
                        $("#opportunity_apply_url").val(url);
                        statusEl.html("<span style=\'color: green;\'>✓ Auto-filled successfully!</span>");
                        button.prop("disabled", false).text("Auto-Fill from URL");
                    },
                    error: function(xhr) {
                        statusEl.html("<span style=\'color: red;\'>✗ Failed to scrape URL</span>");
                        button.prop("disabled", false).text("Auto-Fill from URL");
                    }
                });
            });
        });';
        
        wp_add_inline_script('jquery', $inline_script);
    }
}
add_action('admin_enqueue_scripts', 'ai_in_society_enqueue_opportunity_admin_scripts');

// Bypass WordPress canonical redirects for React article routes
add_action('template_redirect', function() {
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/articles/') !== false) {
        // This kills the WordPress redirect BEFORE it starts the 'Jump'
        remove_action('template_redirect', 'redirect_canonical');
    }
}, 1);

// 1. FORCE 200 OK AND INJECT METADATA
add_action('wp_head', function() {
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/articles/') !== false) {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $slug = basename($path);
        $post = get_page_by_path($slug, OBJECT, 'post');
        
        if ($post) {
            status_header(200);
            remove_action('wp_head', 'wp_no_robots');
            echo '<title>' . esc_html($post->post_title) . ' | AI in Society</title>' . "\n";
            echo '<meta name="description" content="' . esc_attr(wp_trim_words($post->post_content, 30)) . '" />' . "\n";
        }
    }
}, 0);

// 2. FORCE RANK MATH TO ALLOW INDEXING
add_filter('rank_math/frontend/robots', function($robots) {
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/articles/') !== false) {
        return array(
            'index'  => 'index',
            'follow' => 'follow',
        );
    }
    return $robots;
}, 999);