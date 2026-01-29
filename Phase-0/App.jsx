import React, { useEffect, useState, useRef, useMemo } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ArticleGrid from './components/ArticleGrid';
import JobBoard from './components/JobBoard';
import BookList from './components/BookList';
import OpportunitiesPage from './components/OpportunitiesPage';
import ArticlesPage from './components/ArticlesPage';
import BooksPage from './components/BooksPage';
import ArticleDetail from './components/ArticleDetail';
import ScrollReveal from './components/ScrollReveal';
import TypewriterText from './components/TypewriterText';
import SearchOverlay from './components/SearchOverlay';
import SubscribeModal from './components/SubscribeModal';
import { fetchDashboardContent } from './services/geminiService';
import { fetchAdzunaJobs } from './services/adzunaService';
import { fetchWordPressArticles } from './services/wordpressService.js';
import { fetchDataWithCache } from './utils/cache';
import { slugify } from './utils/slugify.js';

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [adzunaJobs, setAdzunaJobs] = useState([]);

  // Refs for scrolling to sections
  const articlesRef = useRef(null);
  const opportunitiesRef = useRef(null);
  const booksRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // This triggers Gemini and Adzuna AT THE SAME TIME
        // It also checks your cache first for instant loading
        console.log('TRIGGERING FETCH NOW');
        const [dashboardData, jobs] = await Promise.all([
          fetchDataWithCache('dashboard-data', () => fetchDashboardContent()),
          fetchDataWithCache('jobs-data', () => fetchAdzunaJobs())
        ]);

        // Safety check: Ensure jobs is an array before setting state
        if (jobs && Array.isArray(jobs)) {
          setAdzunaJobs(jobs);
        } else {
          console.warn('Jobs data is not a valid array:', jobs);
          setAdzunaJobs([]);
        }
        
        if (dashboardData) {
          const updatedData = {
            ...dashboardData,
            opportunities: jobs ? jobs.slice(0, 6) : [],
          };
          setData(updatedData);
        }
      } catch (error) {
        console.error("Speed boost data load failed:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  // Fetch WordPress articles for articles page
  const [wpArticles, setWpArticles] = useState([]);
  
  useEffect(() => {
    const loadWordPressArticles = async () => {
      try {
        // Bypass cache for wp-articles - always fetch fresh from API
        const articles = await fetchWordPressArticles();
        setWpArticles(articles);
      } catch (error) {
        console.error("Failed to load WP articles", error);
      }
    };
    loadWordPressArticles();
  }, []);

  // Compute all unique articles for global state
  // Use WordPress articles from the API
  const uniqueArticles = useMemo(() => {
    // Use WordPress articles if available
    if (wpArticles.length > 0) {
      return wpArticles;
    }
    
    // If no WordPress articles, return empty array
    return [];
  }, [wpArticles]);

  // Get latest article for homepage hero section
  const latestArticle = useMemo(() => {
    if (uniqueArticles.length > 0) {
      // Sort by date (newest first) and get the first one
      const sorted = [...uniqueArticles].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      return sorted[0];
    }
    return null;
  }, [uniqueArticles]);

  // Get featured articles for homepage (latest 3 articles)
  const featuredArticles = useMemo(() => {
    if (uniqueArticles.length > 0) {
      // Sort by date (newest first) and take first 3
      const sorted = [...uniqueArticles].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      return sorted.slice(0, 3);
    }
    return [];
  }, [uniqueArticles]);

  // Sort by Date Ascending (Oldest first = Article #1) for Ranking
  // Note: uniqueArticles passed to ArticlesPage will be sorted by latest for display,
  // but this specific sort is for calculating the absolute rank.
  const sortedArticlesForRanking = useMemo(() => {
    return [...uniqueArticles].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // Handle invalid dates safe-guard
        if (isNaN(dateA)) return 1; 
        if (isNaN(dateB)) return -1;
        
        return dateA - dateB;
    });
  }, [uniqueArticles]);

  const getArticleRank = (article) => {
      if (!article) return 0;
      // Find index in the sorted list. +1 because array is 0-indexed but Humans count from 1.
      const index = sortedArticlesForRanking.findIndex(a => a.title === article.title);
      return index >= 0 ? index + 1 : sortedArticlesForRanking.length + 1;
  };

  // Router: Read URL on mount and handle browser navigation
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      
      // Remove leading/trailing slashes and get the route
      const route = path.replace(/^\/+|\/+$/g, '') || 'home';
      
      // Map routes to views
      if (route === 'articles') {
        setCurrentView('articles');
        setSelectedArticle(null);
      } else if (route === 'opportunities') {
        setCurrentView('opportunities');
        setSelectedArticle(null);
      } else if (route === 'books') {
        setCurrentView('books');
        setSelectedArticle(null);
      } else if (route.startsWith('articles/')) {
        // Handle article detail routes
        // Extract and sanitize the slug from the URL
        const rawSlug = route.split('/')[1];
        const sanitizedSlug = slugify(rawSlug);
        
        // Try to find article by:
        // 1. ID match (if slug is numeric)
        // 2. WordPress slug field (if available)
        // 3. Slugified title match
        const article = uniqueArticles.find(a => {
          // Match by ID if slug is numeric
          if (!isNaN(Number(rawSlug)) && String(a.id) === rawSlug) {
            return true;
          }
          
          // Match by WordPress slug if available
          if (a.slug && slugify(a.slug) === sanitizedSlug) {
            return true;
          }
          
          // Match by slugified title
          const titleSlug = slugify(a.title);
          return titleSlug === sanitizedSlug;
        });
        
        // If we have a matching article, force article_detail view
        if (article) {
          setSelectedArticle(article);
          setCurrentView('article_detail');
        }
      } else {
        setCurrentView('home');
        setSelectedArticle(null);
      }
      
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Handle initial route
    handleRoute();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRoute);

    return () => {
      window.removeEventListener('popstate', handleRoute);
    };
  }, [uniqueArticles]); // Re-run when articles load (important for article detail routes)

  const handleNavClick = (section) => {
    let path = '/';
    
    if (section === 'opportunities') {
      setCurrentView('opportunities');
      path = '/opportunities';
    } else if (section === 'articles') {
      setCurrentView('articles');
      path = '/articles';
    } else if (section === 'home') {
      setCurrentView('home');
      path = '/';
    } else if (section === 'books') {
      setCurrentView('books');
      path = '/books';
    }
    
    // Update URL without page reload
    window.history.pushState({ view: section }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setCurrentView('article_detail');
    // Update URL for article detail (prefer slug, fallback to slugified title, then ID)
    const articleSlug = article.slug 
      ? slugify(article.slug) 
      : (article.title ? slugify(article.title) : String(article.id));
    const articlePath = `/articles/${articleSlug}`;
    window.history.pushState({ view: 'article_detail', articleId: article.id }, '', articlePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Loading Screen - Shows until core layout data is ready
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 font-mono animate-pulse">Curating Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative min-h-screen bg-[#121212] text-gray-300 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Search Overlay - Sits on top of everything */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={handleNavClick}
        onArticleSelect={handleArticleClick}
        articles={uniqueArticles}
      />

      {/* Subscribe Modal - Sits on top of everything, outside the blurred container */}
      <SubscribeModal 
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        onSuccess={() => {
          setSubscriptionSuccess(true);
          // Auto-hide after 4 seconds
          setTimeout(() => setSubscriptionSuccess(false), 4000);
        }}
      />

      {/* Unified Success Toast Notification - Shows regardless of which button was clicked */}
      {subscriptionSuccess && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-600 border border-green-400 text-white px-6 py-4 rounded-sm shadow-lg flex items-center gap-3 min-w-[300px] max-w-md">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="font-bold text-sm uppercase tracking-wider">Subscription Confirmed</p>
              <p className="text-xs text-green-100 mt-1">Your email has been saved successfully!</p>
            </div>
            <button
              onClick={() => setSubscriptionSuccess(false)}
              className="flex-shrink-0 text-green-200 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Wrapper - Gets blurred when search is open */}
      <div className={`transition-all duration-500 ease-out origin-top ${isSearchOpen ? 'filter blur-md scale-[0.99] opacity-40 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>
        <Header 
          onNavClick={handleNavClick} 
          onSearchClick={() => setIsSearchOpen(true)}
          onSubscribeClick={() => setIsSubscribeOpen(true)}
        />

        {currentView === 'home' && (
          <>
            {/* HERO SECTION - Full Width (Outside Main Container) */}
            <HeroSection 
              article={latestArticle || data.heroArticle}
            />

            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
              
              {/* ARTICLES PREVIEW SECTION */}
              <div ref={articlesRef} className="scroll-mt-24">
                 <ScrollReveal className="flex items-center justify-between mb-6 border-b border-gray-800 pb-2">
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-2 animate-pulse">●</span>
                    <TypewriterText 
                      text="Latest Articles" 
                      tag="h3"
                      className="font-bold text-white uppercase tracking-wider text-sm font-orbitron"
                      speed={100}
                    />
                  </div>
                  <button 
                    onClick={() => handleNavClick('articles')}
                    className="text-xs text-blue-400 hover:text-white uppercase font-bold tracking-widest transition-colors"
                  >
                    View All &rarr;
                  </button>
                 </ScrollReveal>
                 <ArticleGrid 
                    articles={featuredArticles.length > 0 ? featuredArticles : data.featuredArticles} 
                    onArticleClick={handleArticleClick}
                 />
              </div>

              {/* OPPORTUNITIES PREVIEW SECTION */}
              {/* Note: We keep the preview on homepage, but clicking title/more goes to full board */}
              <div ref={opportunitiesRef} className="scroll-mt-24 cursor-pointer mt-16" onClick={() => handleNavClick('opportunities')}>
                 <JobBoard jobs={data.opportunities} />
              </div>

              {/* BOOKS SECTION */}
              {/* Removed top-level onClick here to allow separate interaction with scroll buttons */}
              <div ref={booksRef} className="scroll-mt-24 mt-16">
                 <BookList books={data.mustReadBooks} onNavClick={handleNavClick} />
              </div>

            </main>
          </>
        )}

        {currentView === 'opportunities' && <OpportunitiesPage jobs={adzunaJobs} />}
        
        {currentView === 'articles' && (
          <ArticlesPage 
            articles={uniqueArticles}
            onSubscribeClick={() => setIsSubscribeOpen(true)} 
            onArticleClick={handleArticleClick}
          />
        )}

        {currentView === 'books' && <BooksPage />}

        {currentView === 'article_detail' && selectedArticle && (
          <ArticleDetail 
            article={selectedArticle}
            articleNumber={getArticleRank(selectedArticle)}
            onBack={() => handleNavClick('articles')}
            onSubscribeClick={() => setIsSubscribeOpen(true)}
          />
        )}

        <footer className="bg-black border-t border-gray-800 py-12 px-4 text-center relative z-10">
          <ScrollReveal>
            <h2 
              onClick={() => handleNavClick('home')}
              className="font-orbitron text-2xl font-bold text-white mb-4 cursor-pointer hover:text-blue-400 transition-colors inline-block"
            >
              AI in Society
            </h2>
            <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
              Advancing the conversation on artificial intelligence, ethics, and our shared future.
            </p>
            <div className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} AI in Society. All rights reserved.
            </div>
          </ScrollReveal>
        </footer>
      </div>
    </div>
  );
};

export default App;
