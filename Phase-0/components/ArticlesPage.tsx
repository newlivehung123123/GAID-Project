import React, { useState, useMemo } from 'react';
import { Article } from '../types';
import ScrollReveal from './ScrollReveal';
import TypewriterText from './TypewriterText';

const TRENDING_TOPICS = ["AGI Safety", "Regulatory Sandboxes", "Neuromorphic Chips", "Synthetic Data", "Space Mining"];
const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' }
];

interface ArticlesPageProps {
  articles: Article[];
  onSubscribeClick: () => void;
  onArticleClick: (article: Article) => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = ({ articles, onSubscribeClick, onArticleClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const filteredArticles = useMemo(() => {
    // 1. Filter
    let result = articles.filter(article => {
      const matchSearch = searchQuery 
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          article.summary.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchCategory = selectedCategory 
        ? article.category === selectedCategory 
        : true;
      const matchYear = selectedYear
        ? article.date.includes(selectedYear)
        : true;
      return matchSearch && matchCategory && matchYear;
    });

    // 2. Sort
    return result.sort((a, b) => {
      if (sortBy === 'latest') {
        // Sort by Date Descending (Newest first for display)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        // Sort by Views Descending (Highest views first)
        // Fallback to 0 if views undefined
        return (b.views || 0) - (a.views || 0);
      }
    });
  }, [articles, searchQuery, selectedCategory, selectedYear, sortBy]);

  // Extract all categories from articles
  const allCategories = Array.from(new Set(articles.map(a => a.category)));

  // Extract unique years from articles dynamically
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    
    articles.forEach(article => {
      if (article.date) {
        // Parse date string (format: "M j, Y" e.g., "Jan 15, 2025")
        // Extract year by finding the last 4-digit number or using Date parsing
        const dateMatch = article.date.match(/\b(\d{4})\b/);
        if (dateMatch) {
          years.add(dateMatch[1]);
        } else {
          // Fallback: try to parse as Date object
          const parsedDate = new Date(article.date);
          if (!isNaN(parsedDate.getTime())) {
            years.add(parsedDate.getFullYear().toString());
          }
        }
      }
    });
    
    // Convert to array, sort descending (newest first)
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [articles]);

  return (
    <div className="min-h-screen bg-[#121212]">
      
      {/* Top Filter Bar */}
      <div className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-30 shadow-lg backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Topic Filters */}
            <div className="flex-grow overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mr-2 whitespace-nowrap">Topics:</span>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-all whitespace-nowrap font-mono ${!selectedCategory ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}
                >
                  All
                </button>
                {allCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-sm border transition-all whitespace-nowrap font-mono ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Year Filters */}
              <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
                 <span className="text-xs font-bold text-blue-500 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Year:</span>
                 <div className="flex gap-1">
                   <button
                      onClick={() => setSelectedYear(null)}
                      className={`text-xs px-2 py-1 rounded-sm border transition-all font-mono ${!selectedYear ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'text-gray-500 border-transparent hover:text-white'}`}
                   >
                     All
                   </button>
                   {availableYears.map(year => (
                     <button
                       key={year}
                       onClick={() => setSelectedYear(year)}
                       className={`text-xs px-2 py-1 rounded-sm border transition-all font-mono ${selectedYear === year ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'text-gray-500 border-transparent hover:text-white'}`}
                     >
                       {year}
                     </button>
                   ))}
                 </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
                 <span className="text-xs font-bold text-blue-500 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Sort:</span>
                 <div className="flex gap-1 bg-black rounded p-0.5 border border-gray-800">
                   {SORT_OPTIONS.map(opt => (
                     <button
                       key={opt.id}
                       onClick={() => setSortBy(opt.id as 'latest' | 'popular')}
                       className={`text-xs px-3 py-1 rounded-sm transition-all font-mono uppercase tracking-wider ${
                         sortBy === opt.id 
                           ? 'bg-blue-600 text-white font-bold' 
                           : 'text-gray-500 hover:text-gray-300'
                       }`}
                     >
                       {opt.label}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-wider">
                {selectedCategory ? `${selectedCategory} Articles` : 'All Articles'}
                {selectedYear && <span className="text-gray-500 ml-2 text-sm">// {selectedYear}</span>}
              </h2>
              <span className="text-xs font-mono text-gray-500">{filteredArticles.length} Results &bull; Sorted by {sortBy}</span>
            </div>

            {articles.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-800 rounded bg-[#151515]">
                <p className="text-gray-400 font-mono text-lg">Our first analysis articles are coming soon</p>
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article, idx) => (
                <ScrollReveal key={`${article.title}-${idx}`} className="bg-[#161616] border border-gray-800/50 hover:border-gray-700 rounded-sm overflow-hidden group transition-all hover:bg-[#1a1a1a]" triggerOnce={true}>
                  <div 
                    className="flex flex-col md:flex-row cursor-pointer"
                    onClick={() => onArticleClick(article)}
                  >
                    <div className="md:w-1/3 relative overflow-hidden h-48 md:h-auto">
                      <img 
                        src={article.imageUrl || `https://images.unsplash.com/photo-${idx % 2 === 0 ? '1620712943543-bcc4688e7485' : '1531746790731-6c087fecd65a'}?q=80&w=800`} 
                        alt={article.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-6 md:w-2/3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{article.category}</span>
                          <span className="text-xs text-gray-600 font-mono">|</span>
                          <span className="text-xs text-gray-500 font-mono">{article.date}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-blue-300 transition-colors font-orbitron leading-tight">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-400 font-mono leading-relaxed line-clamp-3 mb-4">
                          {article.summary}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                        <div className="flex flex-wrap gap-2">
                           {article.tags?.map((tag, i) => (
                              <span key={i} className="text-[10px] text-gray-500 font-mono border border-gray-800 px-1.5 py-0.5 rounded uppercase tracking-wider bg-gray-900/50">
                                #{tag}
                              </span>
                           ))}
                        </div>
                        <div className="flex items-center gap-3">
                          {article.views && (
                            <span className="text-[10px] text-gray-600 font-mono flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              {article.views.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 font-mono">{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-gray-800 rounded bg-[#151515]">
                <p className="text-gray-500 font-mono">No articles found matching your criteria.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedCategory(null); setSelectedYear(null);}} 
                  className="mt-4 text-blue-400 hover:text-white text-sm font-bold uppercase tracking-wider"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Explore Archive Widget (Moved from Top) */}
            <div className="bg-[#161616] p-6 border border-gray-800 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2 font-orbitron relative z-10">Explore the Archive</h3>
              <p className="text-xs text-gray-400 font-mono mb-4 relative z-10">
                Search our database of analysis, research, and commentary.
              </p>
              <div className="relative z-10">
                <input 
                  type="text" 
                  placeholder="Keywords, authors..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 text-white pl-4 pr-10 py-3 rounded-sm focus:outline-none focus:border-blue-500 font-mono text-sm placeholder-gray-600 transition-colors"
                />
                <svg className="absolute right-3 top-3 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            {/* Trending Widget */}
            <div className="bg-[#161616] p-6 border border-gray-800 rounded-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TOPICS.map(topic => (
                  <span key={topic} className="text-xs bg-[#0a0a0a] text-gray-300 border border-gray-800 px-2 py-1 hover:border-blue-500 cursor-pointer transition-colors font-mono">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Newsletter Promo (Mini) */}
            <div className="bg-blue-900/10 border border-blue-900/30 p-6 rounded-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                 <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
               </div>
               <h3 className="text-lg font-orbitron font-bold text-white mb-2 relative z-10">Updated Briefing</h3>
               <p className="text-xs text-gray-300 mb-4 relative z-10 font-mono">Get the most important and timely AI developments and societal impacts delivered to your index regularly.</p>
               <button 
                 onClick={onSubscribeClick}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase py-2.5 transition-colors relative z-10"
               >
                 Subscribe For Free
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;