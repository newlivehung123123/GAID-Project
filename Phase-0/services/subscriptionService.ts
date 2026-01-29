/**
 * WordPress AJAX endpoint for subscription
 * Uses admin-ajax.php instead of REST API
 */

// Type declaration for WordPress AJAX object
declare const aiInSocietyAjax: {
  ajax_url: string;
  nonce: string;
} | undefined;

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Centralized subscription handler
 * Sends email to WordPress admin-ajax.php via AJAX POST
 * 
 * @param email - The email address to subscribe
 * @returns Promise with success status and message
 */
export const handleSubscription = async (email: string): Promise<{ success: boolean; message: string }> => {
  // Validate email format
  if (!email || !email.trim()) {
    return {
      success: false,
      message: 'Please enter a valid email address.'
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: 'Please enter a valid email address format.'
    };
  }

  // Check if AJAX URL is available
  if (!aiInSocietyAjax || !aiInSocietyAjax.ajax_url) {
    console.error('WordPress AJAX URL not available');
    return {
      success: false,
      message: 'Subscription service is not available. Please refresh the page and try again.'
    };
  }

  try {
    // WordPress AJAX expects form data, not JSON
    const formData = new FormData();
    formData.append('action', 'subscribe_user');
    formData.append('email', email.trim());
    formData.append('nonce', aiInSocietyAjax.nonce);

    const response = await fetch(aiInSocietyAjax.ajax_url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to subscribe. Please try again later.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.data?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = `Subscription failed: ${response.status} ${response.statusText}`;
      }

      return {
        success: false,
        message: errorMessage
      };
    }

    // WordPress AJAX returns { success: true/false, data: {...} }
    const result = await response.json().catch(() => ({ success: false }));
    
    if (result.success) {
      return {
        success: true,
        message: result.data?.message || 'Thank you for subscribing!'
      };
    } else {
      return {
        success: false,
        message: result.data?.message || 'Failed to subscribe. Please try again.'
      };
    }
  } catch (error) {
    console.error('Subscription error:', error);
    
    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
};

/**
 * Legacy function name for backward compatibility
 * @deprecated Use handleSubscription instead
 */
export const subscribeToNewsletter = handleSubscription;
