import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book } from '../types';
import ScrollReveal from './ScrollReveal';
import TypewriterText from './TypewriterText';

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

interface BookListProps {
  books: Book[];
  onNavClick: (section: string) => void;
}

const BookList: React.FC<BookListProps> = ({ books, onNavClick }) => {
  // Ensure we have books (fallback logic already handled, but safe guard)
  const displayBooks = books.slice(0, 6); // Max 6 as per request
  
  // Carousel State
  // We use a tripled array approach for seamless infinite looping.
  // [Set 1 (Clone)] [Set 2 (Real)] [Set 3 (Clone)]
  // This allows us to slide from end of Set 2 to start of Set 3, then jump to start of Set 2 seamlessly.
  const [currentIndex, setCurrentIndex] = useState(displayBooks.length); // Start at index 6 (Set 2)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleItems, setVisibleItems] = useState(3);
  
  const transitionRef = useRef<HTMLDivElement>(null);

  // Responsive Visible Items
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(1);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(2);
      } else {
        setVisibleItems(3);
      }
    };
    
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tripledBooks = [...displayBooks, ...displayBooks, ...displayBooks];

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  }, [isTransitioning]);

  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
  }, [isTransitioning]);

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    
    // Check for bounds and reset without transition
    const totalReal = displayBooks.length;
    
    if (currentIndex >= totalReal * 2) {
      // Reached start of 3rd set -> Jump to start of 2nd set
      setCurrentIndex(currentIndex - totalReal);
    } else if (currentIndex < totalReal) {
      // Reached end of 1st set -> Jump to end of 2nd set
      setCurrentIndex(currentIndex + totalReal);
    }
  };

  return (
    <div className="mb-16">
      <ScrollReveal className="flex items-center justify-between mb-8">
        <div className="flex items-center flex-grow">
          <div className="h-px bg-gray-700 flex-grow opacity-50"></div>
          {/* Title - Navigates to Books Page */}
          <div onClick={() => onNavClick('books')} className="cursor-pointer group">
             <TypewriterText 
              text="AI Must-Read Books" 
              tag="h2" 
              className="mx-4 text-2xl font-orbitron font-bold text-white uppercase tracking-wider text-center group-hover:text-blue-400 transition-colors"
              speed={50}
              repeat={false}
            />
          </div>
          <div className="h-px bg-gray-700 flex-grow opacity-50"></div>
        </div>
        
        {/* Navigation Buttons - Control Carousel ONLY */}
        <div className="flex gap-2 ml-4">
          <button 
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all active:scale-95"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all active:scale-95"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </ScrollReveal>

      {/* Carousel Container */}
      <div className="relative overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
            transition: isTransitioning ? 'transform 500ms ease-out' : 'none'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {tripledBooks.map((book, idx) => {
            const imageSrc = getImagePath(book.imageUrl);
            const amazonLink = getAmazonAffiliateLink(book);
            return (
            <div 
              key={`${idx}`} 
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / visibleItems}%` }}
            >
              <div 
                className="flex flex-col group h-full"
              >
                {amazonLink ? (
                  <a 
                    href={amazonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full aspect-[2/3] rounded shadow-lg mb-4 relative overflow-hidden flex items-center justify-center p-4 text-center transition-all duration-500 transform group-hover:-translate-y-2 group-hover:shadow-blue-900/20 group-hover:shadow-2xl cursor-pointer"
                    style={{ 
                      backgroundColor: book.coverColor || '#333',
                      background: imageSrc ? undefined : `linear-gradient(135deg, ${book.coverColor || '#333'} 0%, ${book.coverColor || '#333'}dd 50%, ${book.coverColor || '#333'}aa 100%)`
                    }}
                  >
                   {/* Book cover image or fallback to styled placeholder */}
                   {imageSrc ? (
                     <img 
                       src={imageSrc} 
                       alt={`${book.title} cover`}
                       className="absolute inset-0 w-full h-full object-cover"
                       onError={(e) => {
                         // Hide image on error, show styled placeholder
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                       </svg>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-10 mix-blend-overlay"></div>
                   
                   <div className="relative z-10">
                     <h4 className="font-orbitron font-bold text-white text-lg leading-tight mb-2 drop-shadow-md line-clamp-3">
                       {book.title}
                     </h4>
                     <div className="w-8 h-1 bg-white/50 mx-auto mb-2"></div>
                     <span className="text-xs text-gray-200 font-sans uppercase tracking-widest line-clamp-1">
                       {book.author}
                     </span>
                   </div>
                  </a>
                ) : (
                  <div 
                    className="w-full aspect-[2/3] rounded shadow-lg mb-4 relative overflow-hidden flex items-center justify-center p-4 text-center transition-all duration-500"
                    style={{ 
                      background: `linear-gradient(135deg, ${book.coverColor || '#333'} 0%, ${book.coverColor || '#333'}dd 50%, ${book.coverColor || '#333'}aa 100%)`
                    }}
                  >
                   {/* Book cover image or fallback to styled placeholder */}
                   {imageSrc ? (
                     <img 
                       src={imageSrc} 
                       alt={`${book.title} cover`}
                       className="absolute inset-0 w-full h-full object-cover"
                       onError={(e) => {
                         // Hide image on error, show styled placeholder
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center">
                       <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                       </svg>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-10 mix-blend-overlay"></div>
                   
                   <div className="relative z-10">
                     <h4 className="font-orbitron font-bold text-white text-lg leading-tight mb-2 drop-shadow-md line-clamp-3">
                       {book.title}
                     </h4>
                     <div className="w-8 h-1 bg-white/50 mx-auto mb-2"></div>
                     <span className="text-xs text-gray-200 font-sans uppercase tracking-widest line-clamp-1">
                       {book.author}
                     </span>
                   </div>
                  </div>
                )}
                <div onClick={() => onNavClick('books')} className="cursor-pointer">
                  <h3 className="text-base font-orbitron font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {book.description}
                  </p>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default BookList;
