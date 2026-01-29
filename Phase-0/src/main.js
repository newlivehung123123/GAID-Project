/**
 * React Filter Logic Fix - Direct JavaScript (No Build Required)
 * This file provides the corrected filter logic using flatMap
 * 
 * EXACT PATTERN for unique regions:
 * const uniqueRegions = [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);
 * 
 * EXACT PATTERN for filtering:
 * const filteredJobs = jobs.filter(j => j.region.includes(selectedRegion));
 * 
 * EXACT PATTERN for counting:
 * const count = jobs.filter(j => j.region.includes(selectedRegion)).length;
 */

// Make helper functions available globally
if (typeof window !== 'undefined') {
    window.AIRegionFilterSource = {
        /**
         * Get unique regions using flatMap - EXACT PATTERN
         * const uniqueRegions = [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);
         */
        getUniqueRegions: function(jobs) {
            if (!Array.isArray(jobs)) return [];
            return [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);
        },

        /**
         * Filter jobs by region using includes - EXACT PATTERN
         * const filteredJobs = jobs.filter(j => j.region.includes(selectedRegion));
         */
        filterJobs: function(jobs, selectedRegion) {
            if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
                return jobs || [];
            }
            if (!Array.isArray(jobs)) return [];
            return jobs.filter(j => j.region.includes(selectedRegion));
        },

        /**
         * Count jobs by region using includes - EXACT PATTERN
         * const count = jobs.filter(j => j.region.includes(selectedRegion)).length;
         */
        countJobs: function(jobs, selectedRegion) {
            if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
                return Array.isArray(jobs) ? jobs.length : 0;
            }
            if (!Array.isArray(jobs)) return 0;
            return jobs.filter(j => j.region.includes(selectedRegion)).length;
        }
    };

    console.log('AI Region Filter Source loaded. Use window.AIRegionFilterSource for correct filtering logic.');
}

