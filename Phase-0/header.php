<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <?php
    // Completely omit React scripts if Elementor editor is active
    $is_elementor_editor = false;
    if ( class_exists( '\Elementor\Plugin' ) ) {
        $is_elementor_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
    }
    
    // Only output React importmap if NOT in Elementor editor
    if ( ! $is_elementor_editor ) :
    ?>
        <script type="importmap">
        {
          "imports": {
            "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
            "react/": "https://esm.sh/react@^19.2.3/",
            "react": "https://esm.sh/react@^19.2.3",
            "@google/genai": "https://esm.sh/@google/genai@^1.33.0",
            "jspdf": "https://esm.sh/jspdf@2.5.1"
          }
        }
        </script>
    <?php endif; ?>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet">

    <style>
      body {
        background-color: #121212; /* Modern high-tech dark grey */
        color: #e5e5e5;
        font-family: 'Space Mono', monospace; /* Default body font */
      }
      /* Custom scrollbar for high-tech feel */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #1a1a1a;
      }
      ::-webkit-scrollbar-thumb {
        background: #333;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    </style>

    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>