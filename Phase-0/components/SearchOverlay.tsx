import React, { useState, useEffect, useMemo } from 'react';
import { Article, JobOpportunity, Book } from '../types';
import TypewriterText from './TypewriterText';

// No mock articles - search will use real articles from props

const SEARCH_JOBS: JobOpportunity[] = [
  { id: '1', role: "Lead AI Ethics Researcher", company: "OpenFuture", location: "San Francisco, CA", region: "North America", type: "Hybrid", category: "Full-time", posted: "2d ago", description: "Lead our ethics team to develop frameworks ensuring AGI benefits humanity.", url: "#" },
  { id: '2', role: "ML Infrastructure Engineer", company: "DeepScale", location: "Remote", region: "Remote Global", type: "Remote", category: "Full-time", posted: "4h ago", description: "Design and build scalable infrastructure for training massive language models.", url: "#" },
  { id: '3', role: "Cognitive Architect Fellow", company: "NeuralNet Corp", location: "London, UK", region: "Europe", type: "On-site", category: "Fellowship", posted: "1d ago", description: "Exploration of cognitive architectures and AGI.", url: "#" },
  { id: '4', role: "AI Policy Summer Analyst", company: "Global Tech Watch", location: "Washington, DC", region: "North America", type: "Hybrid", category: "Internship", posted: "5d ago", description: "Analyze emerging AI legislation.", url: "#" }
];

const SEARCH_BOOKS: Book[] = [
  { title: "Superintelligence", author: "Nick Bostrom", description: "Paths, Dangers, Strategies.", coverColor: "#1B3D7B" },
  { title: "Life 3.0", author: "Max Tegmark", description: "Being Human in the Age of AI.", coverColor: "#10b981" },
  { title: "The Coming Wave", author: "Mustafa Suleyman", description: "Technology, Power, and the Twenty-first Century's Greatest Dilemma.", coverColor: "#ef4444" },
  { title: "Human Compatible", author: "Stuart Russell", description: "Artificial Intelligence and the Problem of Control.", coverColor: "#f59e0b" },
  { title: "Nexus", author: "Yuval Noah Harari", description: "A Brief History of Information Networks.", coverColor: "#6366f1" },
  { title: "Deep Learning", author: "Ian Goodfellow", description: "The bible of deep learning.", coverColor: "#6366f1" }
];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onArticleSelect?: (article: Article) => void;
  articles?: Article[];
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onNavigate, onArticleSelect, articles = [] }) => {
  const [query, setQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      // Auto focus input
      const input = document.getElementById('search-input');
      if (input) input.focus();
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Search Logic
  const results = useMemo(() => {
    if (!query.trim()) return { articles: [], jobs: [], books: [] };
    
    const lowerQ = query.toLowerCase();
    
    return {
      articles: articles.filter(item => 
        item.title.toLowerCase().includes(lowerQ) || 
        item.summary.toLowerCase().includes(lowerQ) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowerQ))
      ),
      jobs: SEARCH_JOBS.filter(item => 
        item.role.toLowerCase().includes(lowerQ) || 
        item.company.toLowerCase().includes(lowerQ) ||
        item.description.toLowerCase().includes(lowerQ)
      ),
      books: SEARCH_BOOKS.filter(item => 
        item.title.toLowerCase().includes(lowerQ) || 
        item.author.toLowerCase().includes(lowerQ)
      )
    };
  }, [query]);

  const hasResults = results.articles.length > 0 || results.jobs.length > 0 || results.books.length > 0;

  const handleResultClick = (section: string, item?: any) => {
    if (section === 'articles' && item && onArticleSelect) {
      onArticleSelect(item);
    } else {
      onNavigate(section);
    }
    onClose();
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Main Search Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mt-20 px-6 flex flex-col h-[80vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="self-end mb-8 text-gray-500 hover:text-white transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Input Field */}
        <div className="relative mb-12 group">
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="w-full bg-transparent border-b-2 border-gray-700 text-3xl md:text-5xl font-orbitron font-bold text-white py-4 focus:outline-none focus:border-blue-500 placeholder-gray-800 transition-colors"
            autoComplete="off"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {!query && (
            <div className="text-gray-600 font-mono text-sm">
              <p className="mb-2">Try searching for:</p>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:text-blue-400" onClick={() => setQuery("Ethics")}>"Ethics"</span>
                <span className="cursor-pointer hover:text-blue-400" onClick={() => setQuery("Robotics")}>"Robotics"</span>
                <span className="cursor-pointer hover:text-blue-400" onClick={() => setQuery("Policy")}>"Policy"</span>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div className="text-gray-500 font-mono text-lg">No intelligence found matching query.</div>
          )}

          {query && hasResults && (
            <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Articles */}
              {results.articles.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 border-b border-blue-900/30 pb-2">Articles</h3>
                  <div className="grid gap-4">
                    {results.articles.map((article, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleResultClick('articles', article)}
                        className="group cursor-pointer hover:bg-white/5 p-4 rounded transition-colors border border-transparent hover:border-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl text-white font-bold font-orbitron group-hover:text-blue-400 transition-colors">{article.title}</h4>
                          <span className={`text-[10px] uppercase border px-1.5 py-0.5 rounded ${
                             article.articleType === 'Analysis' ? 'text-purple-400 border-purple-900' :
                             article.articleType === 'Perspective' ? 'text-green-400 border-green-900' :
                             'text-orange-400 border-orange-900'
                          }`}>{article.articleType}</span>
                        </div>
                        <p className="text-sm text-gray-400 font-mono line-clamp-1">{article.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jobs */}
              {results.jobs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 border-b border-green-900/30 pb-2">Opportunities</h3>
                  <div className="grid gap-4">
                    {results.jobs.map((job, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleResultClick('opportunities')}
                        className="group cursor-pointer hover:bg-white/5 p-4 rounded transition-colors border border-transparent hover:border-gray-800"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-lg text-white font-bold group-hover:text-green-400 transition-colors">{job.role}</h4>
                          <span className="text-xs border border-green-900 text-green-500 px-2 py-0.5 rounded bg-green-900/10">{job.type}</span>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">{job.company} • {job.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Books */}
              {results.books.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4 border-b border-orange-900/30 pb-2">Books</h3>
                  <div className="grid gap-4">
                    {results.books.map((book, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleResultClick('books')}
                        className="group cursor-pointer hover:bg-white/5 p-4 rounded transition-colors border border-transparent hover:border-gray-800 flex items-center gap-4"
                      >
                         <div className="w-10 h-14 bg-gray-800 shadow-md flex-shrink-0" style={{ backgroundColor: book.coverColor }}></div>
                         <div>
                            <h4 className="text-lg text-white font-bold group-hover:text-orange-400 transition-colors">{book.title}</h4>
                            <p className="text-xs text-gray-400 font-mono">by {book.author}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;