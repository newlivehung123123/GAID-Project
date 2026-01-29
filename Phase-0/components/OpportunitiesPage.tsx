import React, { useState, useMemo, useEffect } from 'react';
import { JobOpportunity } from '../types';
import ScrollReveal from './ScrollReveal';
import TypewriterText from './TypewriterText';
import { slugify } from '../utils/slugify';

interface OpportunitiesPageProps {
  jobs: JobOpportunity[];
}

const ALL_CATEGORIES = ["Full-time", "Part-time", "Fellowship", "Funding", "Internship", "Training", "Volunteering", "Others"];
const FILTER_TYPES = ["Remote", "On-site", "Hybrid"];

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ jobs }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Safety check: Ensure jobs is an array before processing
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  // Calculate available categories (only show categories that have at least one job)
  const availableCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    safeJobs.forEach(job => {
      const count = categoryCounts.get(job.category) || 0;
      categoryCounts.set(job.category, count + 1);
    });
    
    // Return only categories that have at least one job
    return ALL_CATEGORIES.filter(category => (categoryCounts.get(category) || 0) > 0);
  }, [safeJobs]);

  // Calculate available regions dynamically (only show regions that have at least one job)
  // FLATTEN: Use flatMap to extract all regions from region arrays
  const availableRegions = useMemo(() => {
    const regionCounts = new Map<string, number>();
    
    // FLATTEN: Count jobs per region (multi-category counting)
    // A job with multiple regions adds +1 to each category
    safeJobs.forEach(job => {
      const regions = Array.isArray(job.region) ? job.region : (job.region ? [job.region] : []);
      regions.forEach(region => {
        if (region) {
          const count = regionCounts.get(region) || 0;
          regionCounts.set(region, count + 1);
        }
      });
    });
    
    // Return regions sorted by count (descending) and only those with at least one job
    return Array.from(regionCounts.entries())
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a) // Sort by count descending
      .map(([region, count]) => ({ region, count }));
  }, [safeJobs]);

  // Filter Logic
  const filteredJobs = useMemo(() => {
    // Safety check: Ensure safeJobs is an array before filtering
    if (!Array.isArray(safeJobs)) {
      return [];
    }
    return safeJobs.filter(job => {
      const matchCategory = selectedCategory ? job.category === selectedCategory : true;
      // FIXED: Use includes() to check if region array contains selectedRegion
      const matchRegion = selectedRegion ? (Array.isArray(job.region) ? job.region.includes(selectedRegion) : job.region === selectedRegion) : true;
      const matchType = selectedType ? job.type === selectedType : true;
      const matchSearch = searchQuery 
        ? job.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
          job.company.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      return matchCategory && matchRegion && matchType && matchSearch;
    });
  }, [safeJobs, selectedCategory, selectedRegion, selectedType, searchQuery]);

  // Generate slug from job role for URL hash
  const getJobSlug = (job: JobOpportunity) => {
    return slugify(job.role);
  };

  // BUILD_VERSION: 1.0.1 - FORCED_UPDATE_MOBILE_UX
  // Update URL hash when opportunity is clicked
  const toggleExpand = (id: string, job: JobOpportunity) => {
    const newExpandedId = expandedId === id ? null : id;
    setExpandedId(newExpandedId);
    
    // Update URL hash for routing
    if (newExpandedId) {
      const slug = getJobSlug(job);
      window.history.pushState(null, '', '#' + slug);
    } else {
      // Remove hash if collapsing
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  // Read hash on mount and expand matching job
  useEffect(() => {
    if (safeJobs.length === 0) return;
    
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Find job matching the hash slug
      const matchingJob = safeJobs.find(job => getJobSlug(job) === hash);
      if (matchingJob) {
        setExpandedId(matchingJob.id);
        // Scroll to the job after a brief delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(`job-${matchingJob.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeJobs.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 min-h-screen">
      <ScrollReveal>
        <div className="mb-12 text-center flex flex-col items-center">
          <TypewriterText 
            text="AI Opportunities Board"
            tag="h1"
            className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
            speed={40}
            repeat={false}
          />
          <div className="text-gray-400 max-w-2xl mx-auto font-mono text-sm md:text-base min-h-[4em]">
             <TypewriterText 
                text="Curated opportunities in AI safety, policy, engineering, and research. Connect with organizations shaping the future of intelligence."
                tag="p"
                speed={20}
                repeat={false}
              />
          </div>
        </div>
      </ScrollReveal>

      {/* Filters Section */}
      <ScrollReveal delay={100} className="bg-[#1a1a1a] border border-gray-800 rounded-sm p-6 mb-10 sticky top-24 z-30 shadow-2xl backdrop-blur-md bg-opacity-95">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Search */}
          <div className="col-span-1 md:col-span-4 lg:col-span-1">
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Opportunity, Role or Organization..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-gray-700 text-white px-4 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <svg className="absolute right-3 top-3 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          {/* Category Filter - Only show categories with results */}
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Category</label>
            <select 
              className="w-full bg-black border border-gray-700 text-gray-300 px-4 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono text-sm appearance-none cursor-pointer"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Region Filter - Dynamic based on available jobs */}
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Region</label>
            <select 
              className="w-full bg-black border border-gray-700 text-gray-300 px-4 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono text-sm appearance-none cursor-pointer"
              value={selectedRegion || ''}
              onChange={(e) => setSelectedRegion(e.target.value || null)}
            >
              <option value="">All Regions</option>
              {availableRegions.map(({ region, count }) => (
                <option key={region} value={region}>
                  {region} ({count})
                </option>
              ))}
            </select>
          </div>

           {/* Type Filter */}
           <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Work Type</label>
            <select 
              className="w-full bg-black border border-gray-700 text-gray-300 px-4 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono text-sm appearance-none cursor-pointer"
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
            >
              <option value="">All Types</option>
              {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || selectedRegion || selectedType || searchQuery) && (
          <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="flex items-center text-xs bg-blue-900/30 text-blue-300 border border-blue-800 px-2 py-1 rounded hover:bg-blue-900/50">
                {selectedCategory} <span className="ml-1">×</span>
              </button>
            )}
            {selectedRegion && (
              <button onClick={() => setSelectedRegion(null)} className="flex items-center text-xs bg-blue-900/30 text-blue-300 border border-blue-800 px-2 py-1 rounded hover:bg-blue-900/50">
                {selectedRegion} <span className="ml-1">×</span>
              </button>
            )}
             {selectedType && (
              <button onClick={() => setSelectedType(null)} className="flex items-center text-xs bg-blue-900/30 text-blue-300 border border-blue-800 px-2 py-1 rounded hover:bg-blue-900/50">
                {selectedType} <span className="ml-1">×</span>
              </button>
            )}
             {(selectedCategory || selectedRegion || selectedType || searchQuery) && (
              <button 
                onClick={() => {setSelectedCategory(null); setSelectedRegion(null); setSelectedType(null); setSearchQuery('');}}
                className="text-xs text-gray-500 hover:text-white ml-2 underline decoration-gray-600 underline-offset-4"
              >
                Clear All
              </button>
             )}
          </div>
        )}
      </ScrollReveal>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-gray-500 font-mono uppercase tracking-widest px-4 mb-2">
          <span>{filteredJobs.length} Opportunities Found</span>
          <span className="hidden sm:inline">Sort: Newest First</span>
        </div>
        
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job, idx) => (
            <ScrollReveal key={job.id} className="w-full" triggerOnce={true}>
              <div 
                id={`job-${job.id}`}
                onClick={() => toggleExpand(job.id, job)}
                className={`group bg-[#121212] cursor-pointer relative overflow-hidden flex flex-col p-5 rounded-sm transition-all duration-300 border ${
                  expandedId === job.id 
                  ? 'border-blue-900 bg-[#1a1a1a]' 
                  : 'border-gray-800 hover:bg-[#1a1a1a] hover:border-gray-700'
                }`}
              >
                 {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-900/0 via-blue-900/5 to-blue-900/0 transition-transform duration-1000 ${expandedId === job.id ? 'translate-x-0' : 'translate-x-[-100%] group-hover:translate-x-[100%]'}`}></div>
                
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
                  <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 border border-blue-900/50 px-1.5 py-0.5 rounded bg-blue-900/10">
                        {job.category}
                      </span>
                      {job.posted.includes('h') && <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 border border-green-900/50 px-1.5 py-0.5 rounded bg-green-900/10">New</span>}
                    </div>
                    {/* Job Title */}
                    <h3 className={`text-xl font-orbitron font-bold transition-colors ${expandedId === job.id ? 'text-blue-300' : 'text-white group-hover:text-blue-300'}`}>
                      {job.role}
                    </h3>
                    {/* Company and Location */}
                    <div className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
                      <span className="text-white font-semibold">{job.company}</span>
                      <span className="text-gray-600">|</span>
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 min-w-[140px]">
                     {/* Work Type Badge */}
                     <div className="flex gap-2">
                       <span className={`text-xs px-2 py-1 rounded border border-opacity-20 ${
                        job.type === 'Remote' ? 'bg-green-900/20 text-green-300 border-green-500' :
                        job.type === 'Hybrid' ? 'bg-purple-900/20 text-purple-300 border-purple-500' :
                        'bg-blue-900/20 text-blue-300 border-blue-500'
                      }`}>
                        {job.type}
                      </span>
                     </div>
                     <span className="text-xs text-gray-600">{job.posted}</span>
                     
                     {/* Collapse/Expand chevron indicator */}
                     <div className="hidden md:block mt-2 text-gray-500">
                        <svg 
                          className={`w-5 h-5 transition-transform duration-300 ${expandedId === job.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                     </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === job.id && (
                  <div className="mt-6 pt-6 border-t border-gray-700 animate-in slide-in-from-top-2 fade-in duration-300 w-full relative z-10 cursor-default">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-3">
                         <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                         {/* Description Snippet */}
                         <p className="text-gray-300 font-mono text-sm leading-relaxed mb-6">
                           {job.description}
                         </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        {/* View Opportunity Button */}
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block text-center !bg-white !text-black font-bold text-sm uppercase px-6 py-3 hover:bg-blue-400 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                          style={{ backgroundColor: 'white', color: 'black' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Opportunity ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded bg-[#151515]">
            <p className="text-gray-500 font-mono">No opportunities found matching your criteria.</p>
            <button 
              onClick={() => {setSelectedCategory(null); setSelectedRegion(null); setSelectedType(null); setSearchQuery('');}}
              className="mt-4 text-blue-400 hover:text-white text-sm font-bold uppercase tracking-wider"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Hidden Sitemap for Google Indexing - All 34 Opportunities */}
      <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <h2>AI Opportunities Sitemap</h2>
        <ul>
          {safeJobs.map((job) => {
            const slug = getJobSlug(job);
            const jobUrl = `https://aiinsocietyhub.com/opportunities/#${slug}`;
            return (
              <li key={job.id}>
                <a href={jobUrl}>{job.role} - {job.company}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OpportunitiesPage;
