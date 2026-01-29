/**
 * React Filter Runtime Fix
 * Aggressively patches React filtering logic to handle region arrays correctly
 * 
 * This patch intercepts and fixes:
 * 1. new Set(jobs.map(j => j.region)) → [...new Set(jobs.flatMap(j => j.region))]
 * 2. j.region === selectedRegion → j.region.includes(selectedRegion)
 * 3. Ensures counters accurately count jobs with region arrays
 */

(function() {
    'use strict';

    const FIXED_REGIONS = ['US/Canada', 'UK', 'EU', 'Asia', 'Australia', 'Remote', 'Others'];

    // Ensure region is always a clean array
    function ensureRegionArray(region) {
        if (Array.isArray(region)) {
            return region.filter(r => FIXED_REGIONS.includes(r));
        }
        return region && FIXED_REGIONS.includes(region) ? [region] : ['Others'];
    }

    // Patch Array.prototype.flatMap to ensure it works correctly
    if (!Array.prototype.flatMap) {
        Array.prototype.flatMap = function(callback) {
            return this.map(callback).flat();
        };
    }

    // Create a comprehensive helper object
    window.AIRegionFilterHelper = window.AIRegionFilterHelper || {};

    // EXACT PATTERN 1: Get unique regions using flatMap
    window.AIRegionFilterHelper.getUniqueRegions = function(jobs) {
        if (!Array.isArray(jobs)) {
            return FIXED_REGIONS;
        }

        // EXACT LOGIC: [...new Set(jobs.flatMap(j => j.region))]
        const uniqueRegions = [...new Set(jobs.flatMap(j => {
            const region = ensureRegionArray(j.region || ['Others']);
            return region;
        }))];

        // Filter to only valid regions and return in fixed order
        const validRegions = uniqueRegions.filter(r => FIXED_REGIONS.includes(r));
        return FIXED_REGIONS.filter(r => validRegions.includes(r));
    };

    // EXACT PATTERN 2: Filter jobs using includes()
    window.AIRegionFilterHelper.filterJobs = function(jobs, selectedRegion) {
        if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
            return jobs || [];
        }

        if (!Array.isArray(jobs)) {
            return [];
        }

        // EXACT LOGIC: jobs.filter(j => j.region.includes(selectedRegion))
        return jobs.filter(j => {
            const region = ensureRegionArray(j.region || ['Others']);
            return region.includes(selectedRegion);
        });
    };

    // EXACT PATTERN 3: Count jobs per region (for counters)
    window.AIRegionFilterHelper.countJobsByRegion = function(jobs, selectedRegion) {
        if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
            return Array.isArray(jobs) ? jobs.length : 0;
        }

        if (!Array.isArray(jobs)) {
            return 0;
        }

        // EXACT LOGIC: jobs.filter(j => j.region.includes(selectedRegion)).length
        return jobs.filter(j => {
            const region = ensureRegionArray(j.region || ['Others']);
            return region.includes(selectedRegion);
        }).length;
    };

    // Get all region counts (for all counters at once)
    window.AIRegionFilterHelper.getAllRegionCounts = function(jobs) {
        const counts = {};
        
        // Initialize all fixed regions to 0
        FIXED_REGIONS.forEach(region => {
            counts[region] = 0;
        });

        if (!Array.isArray(jobs)) {
            return counts;
        }

        // Count each job's regions (multi-category counting)
        jobs.forEach(job => {
            const regions = ensureRegionArray(job.region || ['Others']);
            regions.forEach(region => {
                if (FIXED_REGIONS.includes(region)) {
                    counts[region] = (counts[region] || 0) + 1;
                }
            });
        });

        return counts;
    };

    // Get fixed regions list
    window.AIRegionFilterHelper.getFixedRegions = function() {
        return FIXED_REGIONS.slice();
    };

    // Monkey-patch common patterns in code execution
    function patchCodeExecution() {
        // Intercept Function constructor to patch code that creates filters
        const originalFunction = window.Function;
        window.Function = function(...args) {
            const code = args[args.length - 1];
            
            // If code contains the problematic pattern, replace it
            if (typeof code === 'string') {
                // Replace: new Set(jobs.map(j => j.region))
                let patchedCode = code.replace(
                    /new\s+Set\s*\(\s*jobs\s*\.\s*map\s*\(\s*j\s*=>\s*j\s*\.\s*region\s*\)\s*\)/g,
                    '[...new Set(jobs.flatMap(j => j.region))]'
                );
                
                // Replace: [...new Set(jobs.map(j => j.region))]
                patchedCode = patchedCode.replace(
                    /\[\s*\.\.\.\s*new\s+Set\s*\(\s*jobs\s*\.\s*map\s*\(\s*j\s*=>\s*j\s*\.\s*region\s*\)\s*\)\s*\]/g,
                    '[...new Set(jobs.flatMap(j => j.region))]'
                );
                
                // Replace: j.region === selectedRegion
                patchedCode = patchedCode.replace(
                    /j\s*\.\s*region\s*===\s*selectedRegion/g,
                    'j.region.includes(selectedRegion)'
                );
                
                // Replace: job.region === selectedRegion
                patchedCode = patchedCode.replace(
                    /job\s*\.\s*region\s*===\s*selectedRegion/g,
                    'job.region.includes(selectedRegion)'
                );
                
                if (patchedCode !== code) {
                    args[args.length - 1] = patchedCode;
                }
            }
            
            return originalFunction.apply(this, args);
        };
    }

    // Try to patch when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchCodeExecution);
    } else {
        patchCodeExecution();
    }

    // Also try after delays
    setTimeout(patchCodeExecution, 500);
    setTimeout(patchCodeExecution, 2000);
    setTimeout(patchCodeExecution, 5000);

    console.log('AI Region Filter Runtime Fix loaded.');
    console.log('Use window.AIRegionFilterHelper.getUniqueRegions(jobs) for: [...new Set(jobs.flatMap(j => j.region))]');
    console.log('Use window.AIRegionFilterHelper.filterJobs(jobs, region) for: jobs.filter(j => j.region.includes(selectedRegion))');
    console.log('Use window.AIRegionFilterHelper.countJobsByRegion(jobs, region) for accurate counters');

})();

