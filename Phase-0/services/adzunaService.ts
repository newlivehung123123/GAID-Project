import { JobOpportunity } from '../types';

/**
 * Fetches AI jobs from WordPress REST API endpoint
 * All complex logic (region labeling, keyword filtering, etc.) is handled server-side
 */
export const fetchAdzunaJobs = async (): Promise<JobOpportunity[]> => {
  try {
    const response = await fetch('/wp-json/ai-hub/v1/board-data-stream?nocache=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
    });

    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const responseData = await response.json();

    // Handle both direct array response and WordPress REST API wrapped response
    // WordPress REST API may return {data: [...], status: 200} or just [...]
    let jobs: JobOpportunity[] = [];
    if (Array.isArray(responseData)) {
      // Direct array response
      jobs = responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      // WordPress REST API wrapped response
      jobs = responseData.data;
    } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      // If it's an object but not wrapped, try to extract array from common properties
      console.warn('WordPress API returned unexpected data format:', responseData);
      return [];
    } else {
      console.warn('WordPress API returned invalid data format - not an array');
      return [];
    }

    // Final safety check
    if (!Array.isArray(jobs)) {
      console.warn('WordPress API returned invalid data format after parsing');
      return [];
    }

    console.log(`Successfully fetched ${jobs.length} jobs from WordPress API`);
    return jobs;
  } catch (error) {
    console.error('Error fetching jobs from WordPress API:', error);
    return [];
  }
};
