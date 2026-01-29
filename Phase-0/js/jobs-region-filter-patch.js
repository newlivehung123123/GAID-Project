/**
 * Jobs Region Filter Patch
 * Updates React filtering logic to handle region as array instead of string
 * 
 * This patch:
 * 1. Normalizes region data when jobs are fetched (ensures it's always an array)
 * 2. Provides helper functions for filtering
 * 3. Intercepts fetch responses to normalize region data
 * 4. FLATTENS region arrays so each individual string becomes its own filter option
 * 5. STANDARDIZES labels to only the 7 fixed regions
 * 6. Provides multi-category counting (job with Array(6) adds +1 to all 6 categories)
 * 
 * Usage in React:
 *   // Get flattened, standardized region list for dropdown
 *   const regions = window.AIRegionFilterHelper.getFlattenedRegions(jobs);
 *   
 *   // Get job counts per region (multi-category counting)
 *   const counts = window.AIRegionFilterHelper.getRegionCounts(jobs);
 *   // counts = { 'US/Canada': 5, 'UK': 3, 'EU': 2, ... }
 *   
 *   // Check if job matches filter
 *   const matches = window.AIRegionFilterHelper.matchesRegion(job, selectedRegion);
 */

(function() {
    'use strict';

    // Normalize region data in a job object
    function normalizeJobRegion(job) {
        if (job && job.region !== undefined) {
            // Convert string to array, or ensure array format
            if (!Array.isArray(job.region)) {
                job.region = job.region ? [job.region] : ['Others'];
            } else if (job.region.length === 0) {
                job.region = ['Others'];
            }
        } else {
            job.region = ['Others'];
        }
        return job;
    }

    // Normalize region data in jobs array
    function normalizeJobsRegions(jobs) {
        if (Array.isArray(jobs)) {
            return jobs.map(normalizeJobRegion);
        }
        return jobs;
    }

    // Patch fetch to normalize region data in responses
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const isJobsEndpoint = typeof url === 'string' && 
                               (url.includes('/ai-hub/v1/board-data-stream') || url.includes('ai-hub/v1/board-data-stream'));
        
        if (isJobsEndpoint) {
            return originalFetch.apply(this, args).then(response => {
                // Clone the response so we can read it without consuming it
                return response.clone().json().then(data => {
                    // Normalize and clean region data
                    const normalizedData = Array.isArray(data) ? 
                        data.map(job => normalizeAndCleanJobRegion(Object.assign({}, job))) : 
                        data;
                    
                    // Return a new Response with normalized and cleaned data
                    return new Response(JSON.stringify(normalizedData), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }).catch(() => {
                    // If JSON parsing fails, return original response
                    return response;
                });
            }).catch(error => {
                // If fetch fails, let it propagate
                throw error;
            });
        }
        
        // For non-jobs endpoints, use original fetch
        return originalFetch.apply(this, args);
    };

    // Fixed list of 7 standard regions - this is the only valid list
    const FIXED_REGIONS = ['US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others'];

    // Clean region array - removes invalid values and joined strings
    function cleanRegionArray(regionArray) {
        if (!Array.isArray(regionArray)) {
            return ['Others'];
        }
        
        const cleaned = [];
        regionArray.forEach(r => {
            const trimmed = String(r).trim();
            // Check if it's a valid region
            if (FIXED_REGIONS.includes(trimmed)) {
                if (!cleaned.includes(trimmed)) {
                    cleaned.push(trimmed);
                }
            } else {
                // Try to extract valid regions from joined strings (fallback for corrupted data)
                FIXED_REGIONS.forEach(valid => {
                    if (trimmed.includes(valid) && !cleaned.includes(valid)) {
                        cleaned.push(valid);
                    }
                });
            }
        });
        
        return cleaned.length > 0 ? cleaned : ['Others'];
    }

    // Enhanced normalize function that also cleans
    function normalizeAndCleanJobRegion(job) {
        if (job && job.region !== undefined) {
            job.region = cleanRegionArray(Array.isArray(job.region) ? job.region : [job.region]);
        } else {
            job.region = ['Others'];
        }
        return job;
    }

    // Helper functions for React components
    window.AIRegionFilterHelper = {
        /**
         * Get the fixed list of 7 standard regions
         * Use this for the dropdown - it always returns all 7 standard regions
         * @returns {Array} - Fixed array of 7 standard region strings
         */
        getFixedRegions: function() {
            return FIXED_REGIONS.slice(); // Return a copy
        },

        /**
         * Get flattened list of all regions from jobs (for dropdown options)
         * FLATTENS arrays so each individual string becomes its own option
         * STANDARDIZES to only the 7 fixed regions
         * @param {Array} jobs - Array of job objects
         * @returns {Array} - Flattened array of unique region strings (standardized)
         */
        getFlattenedRegions: function(jobs) {
            // Use getUniqueRegions which already flattens and standardizes
            return this.getUniqueRegions(jobs);
        },

        /**
         * Check if a job matches the selected region filter
         * @param {Object} job - The job object with region (array)
         * @param {string} selectedRegion - The selected region filter
         * @returns {boolean} - True if job matches the filter
         */
        matchesRegion: function(job, selectedRegion) {
            // If no filter selected, show all
            if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
                return true;
            }

            // Normalize and clean job region first
            const normalizedJob = normalizeAndCleanJobRegion(Object.assign({}, job));
            
            // Check if selected region exists in the job's region array
            return normalizedJob.region.includes(selectedRegion);
        },

        /**
         * Get all unique regions from jobs array (only from the fixed list)
         * FLATTENS region arrays so each individual string becomes its own filter option
         * This ensures the dropdown only shows the 7 standard regions
         * @param {Array} jobs - Array of job objects
         * @returns {Array} - Array of unique region strings from the fixed list (flattened)
         */
        getUniqueRegions: function(jobs) {
            const regions = new Set();
            
            if (Array.isArray(jobs)) {
                jobs.forEach(job => {
                    const normalizedJob = normalizeAndCleanJobRegion(Object.assign({}, job));
                    // FLATTEN: Loop through each region in the job's region array
                    if (Array.isArray(normalizedJob.region)) {
                        normalizedJob.region.forEach(region => {
                            // Only add if it's in the fixed list
                            if (FIXED_REGIONS.includes(region)) {
                                regions.add(region);
                            }
                        });
                    }
                });
            }
            
            // STANDARDIZE: Return only the 7 standard regions that actually appear in jobs
            // Always return them in the fixed order
            const foundRegions = Array.from(regions).filter(r => FIXED_REGIONS.includes(r));
            // Return in the order of FIXED_REGIONS, but only include those that were found
            return FIXED_REGIONS.filter(r => foundRegions.includes(r));
        },

        /**
         * Count jobs per region (multi-category counting)
         * A job with multiple regions adds +1 to each of those categories
         * @param {Array} jobs - Array of job objects
         * @returns {Object} - Object with region as key and count as value
         */
        getRegionCounts: function(jobs) {
            const counts = {};
            
            // Initialize all fixed regions to 0
            FIXED_REGIONS.forEach(region => {
                counts[region] = 0;
            });
            
            if (Array.isArray(jobs)) {
                jobs.forEach(job => {
                    const normalizedJob = normalizeAndCleanJobRegion(Object.assign({}, job));
                    // FLATTEN: Loop through each region in the job's region array
                    if (Array.isArray(normalizedJob.region)) {
                        normalizedJob.region.forEach(region => {
                            // Only count if it's in the fixed list
                            if (FIXED_REGIONS.includes(region)) {
                                counts[region] = (counts[region] || 0) + 1;
                            }
                        });
                    }
                });
            }
            
            return counts;
        },

        /**
         * Normalize region data - ensures it's always a clean array
         * @param {string|Array} region - Region data (string or array)
         * @returns {Array} - Normalized and cleaned array of regions
         */
        normalizeRegion: function(region) {
            return cleanRegionArray(Array.isArray(region) ? region : (region ? [region] : []));
        },

        /**
         * Clean region array - removes invalid values and joined strings
         * @param {Array} regionArray - Array of region strings
         * @returns {Array} - Cleaned array with only valid regions
         */
        cleanRegionArray: cleanRegionArray,

        /**
         * Normalize a single job's region data
         * @param {Object} job - Job object
         * @returns {Object} - Job object with normalized and cleaned region
         */
        normalizeJob: normalizeAndCleanJobRegion,

        /**
         * Normalize an array of jobs' region data
         * @param {Array} jobs - Array of job objects
         * @returns {Array} - Array of jobs with normalized and cleaned regions
         */
        normalizeJobs: function(jobs) {
            if (Array.isArray(jobs)) {
                return jobs.map(normalizeAndCleanJobRegion);
            }
            return jobs;
        }
    };

    // Additional helper for React components using the exact pattern you specified
    window.AIRegionFilterHelper.getFlattenedUniqueRegions = function(jobs) {
        if (!Array.isArray(jobs)) {
            return FIXED_REGIONS;
        }
        
        // EXACT PATTERN: [...new Set(jobs.flatMap(j => j.region))]
        // This flattens region arrays and gets unique values
        const allRegions = jobs.flatMap(j => {
            const region = normalizeAndCleanJobRegion(Object.assign({}, j)).region;
            return Array.isArray(region) ? region : [region];
        });
        
        const uniqueRegions = [...new Set(allRegions)].filter(r => FIXED_REGIONS.includes(r));
        return FIXED_REGIONS.filter(r => uniqueRegions.includes(r));
    };

    // Helper for job count using the exact pattern: jobs.filter(j => j.region.includes(selectedRegion)).length
    window.AIRegionFilterHelper.countJobsByRegion = function(jobs, selectedRegion) {
        if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
            return jobs ? jobs.length : 0;
        }
        
        if (!Array.isArray(jobs)) {
            return 0;
        }
        
        // EXACT PATTERN: jobs.filter(j => j.region.includes(selectedRegion)).length
        return jobs.filter(j => {
            const region = normalizeAndCleanJobRegion(Object.assign({}, j)).region;
            return Array.isArray(region) && region.includes(selectedRegion);
        }).length;
    };

    console.log('AI Region Filter Patch loaded. Region data will be normalized automatically.');
    console.log('Use window.AIRegionFilterHelper.getFlattenedUniqueRegions(jobs) for: [...new Set(jobs.flatMap(j => j.region))]');
    console.log('Use window.AIRegionFilterHelper.countJobsByRegion(jobs, region) for: jobs.filter(j => j.region.includes(selectedRegion)).length');

})();

