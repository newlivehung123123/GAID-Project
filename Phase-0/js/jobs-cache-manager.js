/**
 * Jobs Board Cache Manager
 * Handles localStorage caching with TTL and background refresh
 * 
 * Usage in React:
 *   // Instead of: fetch('/wp-json/ai-hub/v1/jobs')
 *   const jobs = await window.AIJobsCacheManager.fetchJobs();
 *   
 *   // Force refresh (bypasses cache):
 *   const jobs = await window.AIJobsCacheManager.forceRefresh();
 *   
 *   // Clear cache manually:
 *   window.AIJobsCacheManager.clearCache();
 * 
 * Features:
 * - 10 minute cache TTL
 * - Background refresh every 5 minutes (or immediately for admins)
 * - Visual "Updating..." indicator during refresh
 * - Automatic cache invalidation
 */

(function() {
    'use strict';

    const CACHE_KEY = 'jobs-data';
    const CACHE_TIMESTAMP_KEY = 'jobs-data-timestamp';
    const TTL_MS = 0; // Cache disabled - force network request every time
    const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    // Get config from WordPress (passed via wp_localize_script)
    const config = typeof aiJobsConfig !== 'undefined' ? aiJobsConfig : {};
    const isAdmin = config.isAdmin || false;
    const JOBS_API_URL = config.apiUrl || '/wp-json/ai-hub/v1/board-data-stream';

    // Get cached data with timestamp check
    function getCachedJobs() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            
            if (!cached || !timestamp) {
                return null;
            }

            const age = Date.now() - parseInt(timestamp, 10);
            if (age > TTL_MS) {
                // Cache expired
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                return null;
            }

            return JSON.parse(cached);
        } catch (e) {
            console.error('Error reading jobs cache:', e);
            return null;
        }
    }

    // Save data to cache
    function setCachedJobs(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error saving jobs cache:', e);
        }
    }

    // Fetch jobs from API
    async function fetchJobsFromAPI(forceRefresh = false) {
        try {
            const response = await fetch(JOBS_API_URL + (forceRefresh ? '?t=' + Date.now() : ''), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: forceRefresh ? 'no-cache' : 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setCachedJobs(data);
            return data;
        } catch (error) {
            console.error('Error fetching jobs:', error);
            throw error;
        }
    }

    // Main fetch function with caching
    async function fetchJobs(forceRefresh = false) {
        // If force refresh, bypass cache
        if (forceRefresh) {
            return await fetchJobsFromAPI(true);
        }

        // Check cache first
        const cached = getCachedJobs();
        if (cached) {
            // Return cached data immediately
            // Trigger background refresh if needed
            const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY), 10);
            const age = Date.now() - timestamp;
            
            // Background refresh if cache is older than 5 minutes OR if admin
            if (age > BACKGROUND_REFRESH_INTERVAL || isAdmin) {
                fetchJobsFromAPI(true).catch(() => {
                    // Silently fail background refresh
                });
            }
            
            return cached;
        }

        // No cache, fetch from API
        return await fetchJobsFromAPI(false);
    }

    // Create updating indicator
    function createUpdatingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'jobs-updating-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(27, 61, 123, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            font-family: 'Space Mono', monospace;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        indicator.appendChild(spinner);
        indicator.appendChild(document.createTextNode('Updating...'));
        document.body.appendChild(indicator);
        
        return indicator;
    }

    // Show updating indicator
    function showUpdatingIndicator() {
        let indicator = document.getElementById('jobs-updating-indicator');
        if (!indicator) {
            indicator = createUpdatingIndicator();
        }
        indicator.style.display = 'flex';
    }

    // Hide updating indicator
    function hideUpdatingIndicator() {
        const indicator = document.getElementById('jobs-updating-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Enhanced fetch with visual indicator
    async function fetchJobsWithIndicator(forceRefresh = false) {
        if (forceRefresh) {
            showUpdatingIndicator();
        }
        
        try {
            const data = await fetchJobs(forceRefresh);
            return data;
        } finally {
            if (forceRefresh) {
                // Hide indicator after a short delay
                setTimeout(hideUpdatingIndicator, 500);
            }
        }
    }

    // Expose to window for React app to use
    window.AIJobsCacheManager = {
        fetchJobs: fetchJobsWithIndicator,
        clearCache: function() {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        },
        forceRefresh: function() {
            return fetchJobsWithIndicator(true);
        }
    };

    // Intercept fetch calls to jobs endpoint (only GET requests)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};
        const method = (options.method || 'GET').toUpperCase();
        
        // Only intercept GET requests to jobs endpoint
        if (method === 'GET' && typeof url === 'string' && 
            (url.includes('/ai-hub/v1/board-data-stream') || url.includes('ai-hub/v1/board-data-stream'))) {
            
            // Check if this is a forced refresh (has cache-busting param)
            const forceRefresh = url.includes('?t=') || url.includes('&t=') || 
                                  options.cache === 'no-cache' || 
                                  options.cache === 'reload';
            
            // Use our cached fetch instead
            return fetchJobsWithIndicator(forceRefresh).then(data => {
                // Return a Response-like object that works with .json()
                const response = new Response(JSON.stringify(data), {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                // Ensure .json() method works
                if (!response.json) {
                    response.json = function() {
                        return Promise.resolve(data);
                    };
                }
                return response;
            }).catch(error => {
                // If cache fetch fails, fall back to original fetch
                console.warn('Cache fetch failed, using original fetch:', error);
                return originalFetch.apply(this, args);
            });
        }
        
        // For all other URLs, use original fetch
        return originalFetch.apply(this, args);
    };

    // Auto-refresh for admins every 5 minutes
    if (isAdmin) {
        setInterval(() => {
            fetchJobsWithIndicator(true).catch(() => {
                // Silently fail
            });
        }, BACKGROUND_REFRESH_INTERVAL);
    }

})();

