<?php
/**
 * Template Name: SPA App Shell
 * 
 * Single Page Application Shell Template
 * - Minimal HTML: Only <div id="root"></div> visible
 * - Hidden WordPress content for editor compatibility
 * - React app mounts on #root
 */

// CRITICAL: Prevent template output during REST API requests
// This ensures the REST API returns clean JSON without HTML pollution
if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
    return;
}

// Also check if this is a REST API endpoint request
if ( strpos( $_SERVER['REQUEST_URI'] ?? '', '/wp-json/' ) !== false ) {
    return;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php
    // WordPress loop - HIDDEN content for editor compatibility
    // This allows the Visual Editor to work (add images, text, SEO) 
    // but content is hidden from front-end so React UI is clean
    if ( have_posts() ) : 
        while ( have_posts() ) : the_post(); 
            ?>
            <div style="display:none;">
                <?php the_content(); ?>
            </div>
            <?php 
        endwhile; 
    endif; 
    ?>
    
    <!-- React App Mount Point -->
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
            <?php foreach ( $seo_opportunities as $job ) : 
                // Map work type to JobPosting employmentType format
                $employment_type_map = array(
                    'Full-time' => 'FULL_TIME',
                    'Part-time' => 'PART_TIME',
                    'Internship' => 'INTERN',
                    'Fellowship' => 'CONTRACTOR',
                    'Training' => 'CONTRACTOR',
                    'Volunteering' => 'VOLUNTEER',
                    'Funding' => 'CONTRACTOR',
                    'Others' => 'OTHER'
                );
                
                // Map category to employmentType if it's a job type, otherwise use type field
                $employment_type = 'OTHER';
                if (isset($employment_type_map[$job['category']])) {
                    $employment_type = $employment_type_map[$job['category']];
                } elseif ($job['type'] === 'Remote' || $job['type'] === 'On-site' || $job['type'] === 'Hybrid') {
                    // If category doesn't map, check if we can infer from other fields
                    $employment_type = 'FULL_TIME'; // Default
                }
                
                // Format date for JobPosting (ISO 8601 format)
                $date_posted = '';
                if (!empty($job['posted'])) {
                    // Try to parse the date format "M j, Y" (e.g., "Jan 15, 2024")
                    $posted_date = DateTime::createFromFormat('M j, Y', $job['posted']);
                    if ($posted_date) {
                        $date_posted = $posted_date->format('Y-m-d');
                    } else {
                        // Fallback to current date if parsing fails
                        $date_posted = date('Y-m-d');
                    }
                } else {
                    $date_posted = date('Y-m-d');
                }
                
                // Prepare location for JobPosting schema
                $job_location = array(
                    '@type' => 'Place',
                    'address' => array(
                        '@type' => 'PostalAddress',
                        'addressLocality' => $job['location'],
                        'addressRegion' => !empty($job['region']) ? implode(', ', $job['region']) : '',
                    )
                );
                
                // If type is Remote, add special handling
                if ($job['type'] === 'Remote') {
                    $job_location['address']['addressCountry'] = 'Multiple';
                }
                
                // Prepare JSON-LD schema data with proper escaping
                $schema_data = array(
                    '@context' => 'https://schema.org',
                    '@type' => 'JobPosting',
                    'title' => $job['role'],
                    'description' => $job['description'],
                    'datePosted' => $date_posted,
                    'employmentType' => $employment_type,
                    'hiringOrganization' => array(
                        '@type' => 'Organization',
                        'name' => $job['company']
                    ),
                    'jobLocation' => $job_location,
                    'url' => $job['url']
                );
            ?>
            <li>
                <h3><?php echo $job['role']; ?></h3>
                <p><strong>Organization:</strong> <?php echo $job['company']; ?></p>
                <p><strong>Location:</strong> <?php echo $job['location']; ?></p>
                <p><strong>Work Type:</strong> <?php echo $job['type']; ?></p>
                <p><strong>Category:</strong> <?php echo $job['category']; ?></p>
                <p><strong>Region:</strong> <?php echo implode(', ', $job['region']); ?></p>
                <p><strong>Posted:</strong> <?php echo $job['posted']; ?></p>
                <p><?php echo $job['description']; ?></p>
                <p><a href="<?php echo $job['url']; ?>" rel="noopener noreferrer">View Opportunity</a></p>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <!-- JobPosting Schema for All Opportunities -->
    <?php foreach ( $seo_opportunities as $job ) : 
        // Recalculate schema data for each job (same logic as above)
        $employment_type_map = array(
            'Full-time' => 'FULL_TIME',
            'Part-time' => 'PART_TIME',
            'Internship' => 'INTERN',
            'Fellowship' => 'CONTRACTOR',
            'Training' => 'CONTRACTOR',
            'Volunteering' => 'VOLUNTEER',
            'Funding' => 'CONTRACTOR',
            'Others' => 'OTHER'
        );
        
        $employment_type = 'OTHER';
        if (isset($employment_type_map[$job['category']])) {
            $employment_type = $employment_type_map[$job['category']];
        } elseif ($job['type'] === 'Remote' || $job['type'] === 'On-site' || $job['type'] === 'Hybrid') {
            $employment_type = 'FULL_TIME';
        }
        
        $date_posted = '';
        if (!empty($job['posted'])) {
            $posted_date = DateTime::createFromFormat('M j, Y', $job['posted']);
            if ($posted_date) {
                $date_posted = $posted_date->format('Y-m-d');
            } else {
                $date_posted = date('Y-m-d');
            }
        } else {
            $date_posted = date('Y-m-d');
        }
        
        $job_location = array(
            '@type' => 'Place',
            'address' => array(
                '@type' => 'PostalAddress',
                'addressLocality' => $job['location'],
                'addressRegion' => !empty($job['region']) ? implode(', ', $job['region']) : '',
            )
        );
        
        if ($job['type'] === 'Remote') {
            $job_location['address']['addressCountry'] = 'Multiple';
        }
        
        $schema_data = array(
            '@context' => 'https://schema.org',
            '@type' => 'JobPosting',
            'title' => $job['role'],
            'description' => $job['description'],
            'datePosted' => $date_posted,
            'employmentType' => $employment_type,
            'hiringOrganization' => array(
                '@type' => 'Organization',
                'name' => $job['company']
            ),
            'jobLocation' => $job_location,
            'url' => $job['url']
        );
    ?>
    <script type="application/ld+json">
    <?php 
    // Use wp_json_encode for proper WordPress JSON encoding with all necessary flags
    // This handles special characters, quotes, colons, and Unicode properly
    echo wp_json_encode( $schema_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
    ?>
    </script>
    <?php endforeach; ?>
    <?php endif; ?>
    
    <?php wp_footer(); ?>
</body>
</html>
