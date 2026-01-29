/**
 * React Source File - Temporary Bypass
 * This file contains the corrected filter logic using flatMap
 * 
 * IMPORTANT: This is a temporary solution. The actual React component
 * should be updated with this logic and then rebuilt.
 */

// Corrected unique regions logic - FLATTENS arrays
// Use this exact pattern in your React component:
// const uniqueRegions = [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);

// Corrected filter logic - uses includes() for arrays
// Use this exact pattern in your React component:
// const filteredJobs = jobs.filter(j => j.region.includes(selectedRegion));

// Corrected count logic - uses includes() for arrays
// Use this exact pattern in your React component:
// const count = jobs.filter(j => j.region.includes(selectedRegion)).length;

// Export helper functions for use in React components
// EXACT PATTERN: const uniqueRegions = [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);
export const getUniqueRegions = (jobs) => {
    if (!Array.isArray(jobs)) return [];
    return [...new Set(jobs.flatMap(j => j.region))].filter(Boolean);
};

export const filterJobsByRegion = (jobs, selectedRegion) => {
    if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
        return jobs || [];
    }
    if (!Array.isArray(jobs)) return [];
    return jobs.filter(j => {
        const region = Array.isArray(j.region) ? j.region : (j.region ? [j.region] : []);
        return region.includes(selectedRegion);
    });
};

export const countJobsByRegion = (jobs, selectedRegion) => {
    if (!selectedRegion || selectedRegion === '' || selectedRegion === 'All') {
        return Array.isArray(jobs) ? jobs.length : 0;
    }
    if (!Array.isArray(jobs)) return 0;
    return jobs.filter(j => {
        const region = Array.isArray(j.region) ? j.region : (j.region ? [j.region] : []);
        return region.includes(selectedRegion);
    }).length;
};

