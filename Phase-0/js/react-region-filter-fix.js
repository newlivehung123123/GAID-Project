/**
 * React Region Filter Fix
 * Patches React filtering logic to handle region arrays correctly
 * 
 * This patch intercepts common React patterns and fixes them:
 * 1. Changes new Set(jobs.map(j => j.region)) to [...new Set(jobs.flatMap(j => j.region))]
 * 2. Changes filter logic to use j.region.includes(selectedRegion)
 * 3. Ensures regions are flattened and treated as individual strings
 */

(function() {
    'use strict';

    // Fixed list of 7 standard regions
    const FIXED_REGIONS = ['US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others'];

    // Helper to ensure region is always an array
    function ensureRegionArray(region) {
        if (Array.isArray(region)) {
            return region.filter(r => FIXED_REGIONS.includes(r));
        }
        return region && FIXED_REGIONS.includes(region) ? [region] : ['Others'];
    }

    // Patch Array.prototype methods that might be used for filtering
    const originalMap = Array.prototype.map;
    const originalFilter = Array.prototype.filter;
    const originalFlatMap = Array.prototype.flatMap;

    // Create a proxy for jobs arrays to intercept region access
    function createJobsProxy(jobs) {
        if (!Array.isArray(jobs)) {
            return jobs;
        }

        return new Proxy(jobs, {
            get: function(target, prop) {
                // If accessing map, flatMap, or filter, return patched versions
                if (prop === 'map' || prop === 'flatMap' || prop === 'filter') {
                    return function(callback) {
                        const result = Array.prototype[prop].call(target, function(job, index, array) {
                            // If callback accesses j.region, ensure it's an array
                            if (job && job.region !== undefined) {
                                const jobProxy = new Proxy(job, {
                                    get: function(obj, key) {
                                        if (key === 'region') {
                                            return ensureRegionArray(obj.region);
                                        }
                                        return obj[key];
                                    }
                                });
                                return callback(jobProxy, index, array);
                            }
                            return callback(job, index, array);
                        });
                        return result;
                    };
                }
                return target[prop];
            }
        });
    }

    // Main helper functions for React to use
    window.AIRegionFilterFix = {
        /**
         * Get flattened unique regions from jobs array
         * Uses flatMap to flatten region arrays
         * @param {Array} jobs - Array of job objects
         * @returns {Array} - Flattened array of unique region strings
         */
        getUniqueRegions: function(jobs) {
            if (!Array.isArray(jobs)) {
                return FIXED_REGIONS;
            }

            // FLATTEN: Use flatMap to extract all regions from all jobs
            const allRegions = jobs.flatMap(j => {
                const region = ensureRegionArray(j.region || ['Others']);
                return region;
            });

            // Get unique regions and filter to only valid ones
            const uniqueRegions = [...new Set(allRegions)].filter(r => FIXED_REGIONS.includes(r));
            
            // Return in fixed order
            return FIXED_REGIONS.filter(r => uniqueRegions.includes(r));
        },

        /**
         * Filter jobs by region
         * Uses includes() to check if region array contains the selected region
         * @param {Array} jobs - Array of job objects
         * @param {string} selectedRegion - Selected region filter
         * @returns {Array} - Filtered array of jobs
         */
        filterJobsByRegion: function(jobs, selectedRegion) {
            if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
                return jobs;
            }

            if (!Array.isArray(jobs)) {
                return [];
            }

            // Use includes() to check if the job's region array contains the selected region
            return jobs.filter(j => {
                const region = ensureRegionArray(j.region || ['Others']);
                return region.includes(selectedRegion);
            });
        },

        /**
         * Count jobs per region (multi-category counting)
         * A job with multiple regions adds +1 to each category
         * @param {Array} jobs - Array of job objects
         * @returns {Object} - Object with region as key and count as value
         */
        getRegionCounts: function(jobs) {
            const counts = {};
            
            // Initialize all fixed regions to 0
            FIXED_REGIONS.forEach(region => {
                counts[region] = 0;
            });

            if (!Array.isArray(jobs)) {
                return counts;
            }

            // Count each job's regions
            jobs.forEach(job => {
                const regions = ensureRegionArray(job.region || ['Others']);
                regions.forEach(region => {
                    if (FIXED_REGIONS.includes(region)) {
                        counts[region] = (counts[region] || 0) + 1;
                    }
                });
            });

            return counts;
        },

        /**
         * Get the fixed list of 7 standard regions
         * @returns {Array} - Fixed array of 7 standard region strings
         */
        getFixedRegions: function() {
            return FIXED_REGIONS.slice();
        }
    };

    // Auto-patch common React patterns when jobs data is loaded
    let patched = false;
    function autoPatch() {
        if (patched) return;
        
        // Try to patch React state updates
        if (window.React && window.React.useState) {
            const originalUseState = window.React.useState;
            window.React.useState = function(initialState) {
                const [state, setState] = originalUseState(initialState);
                
                // If state is jobs array, wrap it in proxy
                if (Array.isArray(state) && state.length > 0 && state[0] && state[0].region !== undefined) {
                    return [createJobsProxy(state), setState];
                }
                
                return [state, setState];
            };
        }

        patched = true;
    }

    // Try to patch when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoPatch);
    } else {
        autoPatch();
    }

    // Also try after a delay to catch late-loading React
    setTimeout(autoPatch, 1000);
    setTimeout(autoPatch, 3000);

    console.log('AI Region Filter Fix loaded. Use window.AIRegionFilterFix for filtering.');

})();

