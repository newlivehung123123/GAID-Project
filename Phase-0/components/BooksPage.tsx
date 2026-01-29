import React, { useEffect, useState } from 'react';
import { BooksPageData, Book } from '../types';
import { fetchBooksPageContent } from '../services/geminiService';
import ScrollReveal from './ScrollReveal';
import TypewriterText from './TypewriterText';
import { fetchDataWithCache } from '../utils/cache';

const ASSOCIATE_TAG = 'hungyushing-20';

// Get base URL from Vite environment (will be '/prototype/' in production)
const BASE_URL = import.meta.env.BASE_URL || '/';


/**
 * Generate Amazon affiliate link using search-first approach
 * All books (including featured) use search URLs for 100% reliability
 */
const getAmazonAffiliateLink = (book: Book): string | null => {
  // Only generate link if we have both title and author
  if (!book.title || !book.author || book.title.trim() === '' || book.author.trim() === '') {
    return null; // Don't show button if title/author missing
  }
  
  // Clean and encode title and author for URL
  const cleanTitle = book.title.trim();
  const cleanAuthor = book.author.trim();
  const searchQuery = `${cleanTitle} ${cleanAuthor}`.trim();
  
  // URL encode the search query
  const encodedQuery = encodeURIComponent(searchQuery);
  
  return `https://www.amazon.com/s?k=${encodedQuery}&tag=${ASSOCIATE_TAG}`;
};

// Helper function to get image path - handles both absolute URLs and local paths
const getImagePath = (imagePath: string | undefined): string | undefined => {
  if (!imagePath) return undefined;
  
  // If it's already an absolute URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /, it's an absolute path, prepend base
  if (imagePath.startsWith('/')) {
    return `${BASE_URL}${imagePath.slice(1)}`;
  }
  
  // Otherwise, prepend base URL
  return `${BASE_URL}${imagePath}`;
};

const BooksPage: React.FC = () => {
  const [data, setData] = useState<BooksPageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // View More State - Limited to 12 books per category
  const [visibleBestSellers, setVisibleBestSellers] = useState(6);
  const [visibleTopRated, setVisibleTopRated] = useState(6);

  useEffect(() => {
    const loadBooks = async () => {
      // Only show the spinner if we don't have data in the state already
      if (!data) setLoading(true);

      try {
        // This is the "Magic" that saves the AI response to your hard drive
        const booksData = await fetchDataWithCache('amazon-books-page', () => fetchBooksPageContent());
        setData(booksData);
      } catch (error) {
        console.error("Books page load failed:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const handleLoadMoreBestSellers = () => {
    setVisibleBestSellers(prev => Math.min(prev + 6, 12));
  };

  const handleLoadMoreTopRated = () => {
    setVisibleTopRated(prev => Math.min(prev + 6, 12));
  };

  // Loading Screen - Shows until book data is ready
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 font-mono animate-pulse">Extracting Amazon Book Data...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-500 text-xs">
        {[...Array(5)].map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-600 fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-400 font-mono">{rating}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        
        <ScrollReveal>
          <div className="text-center mb-16">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              AI MUST-READ BOOKS
            </h1>
            <p className="text-gray-400 font-mono max-w-2xl mx-auto">
              Curated lists featuring current best sellers and highest rated books on Artificial Intelligence. <br/> 
              Helping you ship your career or grow your interest in Artificial Intelligence.
            </p>
          </div>
        </ScrollReveal>

        {/* Section 1: Best Sellers (Horizontal Cards) */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-2 h-8 bg-orange-500 rounded-sm"></div>
             <TypewriterText 
                text="AMAZON BEST SELLERS" 
                tag="h2" 
                className="text-2xl font-orbitron font-bold text-white uppercase tracking-wider"
                speed={50}
              />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.bestSellers.slice(0, visibleBestSellers).map((book, idx) => {
              const imageSrc = getImagePath(book.imageUrl);
              const amazonLink = getAmazonAffiliateLink(book);
              return (
              <ScrollReveal 
                key={idx} 
                staggerIndex={idx % 3} // Reduced stagger calculation to avoid large delays
                triggerOnce={true}    // Keep items visible after first reveal
                className="h-full"
              >
                <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-sm h-full flex flex-col hover:border-orange-500/50 transition-colors group relative overflow-hidden">
                   {/* Rank Badge */}
                   <div className="absolute top-0 right-0 bg-orange-500 text-black font-bold font-mono px-3 py-1 text-sm shadow-lg z-10">
                     #{book.rank || idx + 1}
                   </div>

                   <div className="flex gap-4 mb-4">
                      {/* Book Cover - Use live image URL if available, fallback to styled placeholder */}
                      {imageSrc ? (
                        <img 
                          src={imageSrc} 
                          alt={`${book.title} cover`}
                          className="w-24 h-36 flex-shrink-0 shadow-lg relative object-cover"
                          onError={(e) => {
                            // Fallback to styled placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-24 h-36 flex-shrink-0 shadow-lg relative ${imageSrc ? 'hidden' : 'flex'} items-center justify-center`} 
                        style={{ 
                          background: `linear-gradient(135deg, ${book.coverColor} 0%, ${book.coverColor}dd 50%, ${book.coverColor}aa 100%)`,
                        }}
                      >
                         <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                         <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/30"></div>
                         {/* Styled "No Cover" indicator */}
                         <div className="relative z-10 text-center px-2">
                           <svg className="w-8 h-8 mx-auto mb-1 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                           </svg>
                           <p className="text-[8px] text-white/30 font-mono uppercase tracking-wider">No Cover</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col justify-between py-1">
                        <div>
                           <h3 className="font-orbitron font-bold text-white leading-tight mb-1 group-hover:text-orange-400 transition-colors">{book.title}</h3>
                           <p className="text-sm text-gray-400 font-mono mb-2">by {book.author}</p>
                        </div>
                        <div>
                          {renderStars(book.rating || 4.5)}
                          <p className="text-xs text-gray-500 mt-1">{book.reviewCount?.toLocaleString()} ratings</p>
                        </div>
                      </div>
                   </div>

                   <p className="text-sm text-gray-300 mb-6 line-clamp-3 font-mono flex-grow">
                     {book.description}
                   </p>

                   <div className="mt-auto flex justify-end items-center pt-4 border-t border-gray-800">
                     {amazonLink ? (
                       <a 
                         href={amazonLink} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="bg-[#232f3e] hover:bg-[#37475a] text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                         Buy Now
                       </a>
                     ) : null}
                   </div>
                </div>
              </ScrollReveal>
            )})}
          </div>

          {visibleBestSellers < data.bestSellers.length && visibleBestSellers < 12 && (
            <div className="flex justify-center">
              <button 
                onClick={handleLoadMoreBestSellers}
                className="bg-transparent border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black font-bold uppercase py-3 px-8 text-sm transition-all tracking-wider"
              >
                View More Best Sellers
              </button>
            </div>
          )}
        </section>

        {/* Section 2: Top Rated (List View) */}
        <section className="pb-20">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-2 h-8 bg-blue-500 rounded-sm"></div>
             <TypewriterText 
                text="HIGHEST RATED & CRITICALLY ACCLAIMED" 
                tag="h2" 
                className="text-2xl font-orbitron font-bold text-white uppercase tracking-wider"
                speed={50}
              />
          </div>

          <div className="space-y-4 mb-8">
             {data.topRated.slice(0, visibleTopRated).map((book, idx) => {
               const imageSrc = getImagePath(book.imageUrl);
               const amazonLink = getAmazonAffiliateLink(book);
               return (
               <ScrollReveal key={idx} delay={0} triggerOnce={true}>
                 <div className="bg-[#161616] border border-gray-800 p-4 rounded-sm hover:bg-[#1c1c1c] transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Book Cover Small - Use live image URL if available, fallback to styled placeholder */}
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={`${book.title} cover`}
                        className="w-16 h-24 flex-shrink-0 shadow-md md:ml-4 object-cover"
                        onError={(e) => {
                          // Fallback to styled placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLDivElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-16 h-24 flex-shrink-0 shadow-md md:ml-4 ${imageSrc ? 'hidden' : 'flex'} items-center justify-center relative`} 
                      style={{ 
                        background: `linear-gradient(135deg, ${book.coverColor} 0%, ${book.coverColor}dd 50%, ${book.coverColor}aa 100%)`,
                      }}
                    >
                       {/* Styled "No Cover" indicator */}
                       <div className="text-center">
                         <svg className="w-6 h-6 mx-auto mb-0.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                         </svg>
                       </div>
                    </div>
                    
                    <div className="flex-grow">
                       <h3 className="font-orbitron font-bold text-lg text-white mb-1">{book.title}</h3>
                       <p className="text-sm text-gray-400 font-mono mb-2">by {book.author}</p>
                       <p className="text-xs text-gray-500 max-w-2xl">{book.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[140px]">
                       <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0">
                         <div className="mb-1">{renderStars(book.rating || 5.0)}</div>
                         <div className="text-xs text-blue-400 font-bold uppercase tracking-wider border border-blue-900/50 bg-blue-900/10 px-2 py-1 rounded">Editor's Pick</div>
                       </div>
                       {/* Buy Now Button for Top Rated Books - Only show if link is available */}
                       {amazonLink ? (
                         <a 
                           href={amazonLink} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-[#232f3e] hover:bg-[#37475a] text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                           Buy Now
                         </a>
                       ) : null}
                    </div>
                 </div>
               </ScrollReveal>
             )})}
          </div>

          {visibleTopRated < data.topRated.length && visibleTopRated < 12 && (
            <div className="flex justify-center">
              <button 
                onClick={handleLoadMoreTopRated}
                className="bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold uppercase py-3 px-8 text-sm transition-all tracking-wider"
              >
                View More Top Rated
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default BooksPage;
